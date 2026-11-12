import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  computeTopUp,
  computeWeeklyTopUp,
  AR_WEEKLY_SLOTS,
  EN_WEEKLY_SLOTS,
  type WeeklySlot,
} from "@/lib/blog-pipeline-dispatch";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isoWeekStartUTC } from "@/lib/blog-queue";

export const maxDuration = 60;

/**
 * SCHEDULER-INDEPENDENT PIPELINE DISPATCHER (SCHEDULE HEALTH LAW §8-3/§8-5).
 *
 * WHY THIS EXISTS (2026-08-27 incident): GitHub silently de-registered ALL
 * scheduled workflows in this repo (last schedule fire 2026-08-26T16:39Z;
 * dispatch/push runs kept working). The API enable + touching-commit remedy
 * did NOT restore firing within 90 min across 9+ cron slots. This endpoint
 * makes blog production independent of GitHub's scheduler:
 *
 * WEEKLY CADENCE (owner order 2026-11-13 «4 مقالات إجمالًا أسبوعيًا فقط"):
 *   the blog language pipelines run TWO slots per language per WEEK on
 *   four distinct days (AR Mon+Thu 05:00 UTC · EN Tue+Fri 22:00 UTC —
 *   Phase-119 geography-anchored times untouched). The backstop keeps
 *   firing daily at 23:40 UTC but now judges each language over the ISO
 *   WEEK (Monday 00:00 UTC): a slot is expected only on its scheduled
 *   weekday after the 90-minute grace, coverage = max(non-failed runs
 *   this week, posts published this week), and at most ONE top-up per
 *   language per fire (a still-missing slot waits for the next daily
 *   fire — the 1-automated-article/day/lang publish guard would refuse
 *   a same-day second publish anyway). A missed slot in EITHER language
 *   is therefore topped up on the same day or a later day of the SAME
 *   week, and the week's total can never exceed its two scheduled
 *   slots per language (the p5-publish weekly guard enforces the hard
 *   cap against every path — retries, manual runs and backstops).
 *   The daily fire time (23:40 UTC, Vercel cron + /etc/cron.d/alkemos)
 *   is UNTOUCHED — the weekly logic lives here, so both fire channels
 *   follow it automatically.
 *
 *   The 23:40 fire is after BOTH slot hours' grace windows (AR 05:00+90
 *   = 06:30 · EN 22:00+90 = 23:30 UTC), so a merely-late scheduled run
 *   is never mistaken for a missed one (the 09-04/09-05 double-publish
 *   race law, Phase 171, preserved verbatim).
 *
 *   HEALTHY-RECIPES-PLATFORM (2026-11-10): the recipes pair keeps its
 *   own DAILY backstop law (one pair per day; coverage = max(non-failed
 *   runs today, published pairs today)) — recipes are NOT part of the
 *   weekly blog cadence change.
 *
 * It also rescues the every-10-minutes ai-jobs worker when its last run is
 * stale (>15 min) — meaningful when an external cron calls this endpoint
 * every few minutes (Layer 2); harmless when called once daily.
 *
 * AUTH: Vercel Cron sends Authorization: Bearer <CRON_SECRET> (fail-closed,
 * same C4 pattern as the other cron routes).
 *
 * TOKEN: requires GITHUB_DISPATCH_TOKEN (Vercel env) — a fine-grained
 * GitHub PAT scoped to THIS repo with Actions: Read and write ONLY.
 * Never commit a PAT into the repo (§3.2). Without the token the endpoint
 * answers 503 with setup instructions (dormant, never crashes the cron).
 *
 * GET /api/cron/dispatch-pipelines
 */

const REPO = "muscleshubfit-cpu/alkemos-aws"; // OPS-TRANSITION 2026-10-10: pipeline + worker backstop targets the new repo
const EN_WORKFLOW = "blog-post-en.yml";
const AR_WORKFLOW = "blog-post-ar.yml";
const AI_JOBS_WORKFLOW = "process-ai-jobs.yml";
// HEALTHY-RECIPES-PLATFORM (2026-11-10, plan §6.3): the daily pair's
// backstop — same top-up law (one pair per day; coverage = max(non-failed
// runs today, published pairs today); a published pair by ANY path covers
// the slot). Slot 06:30 UTC → hour 6. UNTOUCHED by the 2026-11-13 weekly
// blog cadence change (recipes are a separate content type).
const RECIPES_WORKFLOW = "recipe-post.yml";
// WEEKLY CADENCE (owner order 2026-11-13): TWO slots per language per
// WEEK on four distinct days — AR Mon+Thu 05:00 UTC · EN Tue+Fri 22:00
// UTC (Phase-119 times untouched; crons `0 5 * * 1,4` / `0 22 * * 2,5`).
const BLOG_WEEKLY_PLANS: Array<{ workflow: string; slots: readonly WeeklySlot[] }> = [
  { workflow: EN_WORKFLOW, slots: EN_WEEKLY_SLOTS },
  { workflow: AR_WORKFLOW, slots: AR_WEEKLY_SLOTS },
];
const AI_JOBS_STALE_MS = 15 * 60 * 1000;

type DispatchCheck = {
  workflow: string;
  /** Counting scope of runs/posts/expected: the ISO week (blog —
   *  WEEKLY CADENCE 2026-11-13) or the UTC day (recipes). Absent on
   *  the ai-jobs worker rescue (no quota semantics). */
  scope?: "iso-week" | "utc-day";
  runsToday: number;
  postsToday: number | null;
  expectedThroughNow: number;
  dispatched: number;
  status: "dispatched" | "up-to-date" | "error";
  detail?: string;
};

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/** Non-failed workflow runs created in [since, now] — a started run
 *  owns its slot; failure/cancelled runs consumed a slot WITHOUT
 *  producing an article (2026-08-27 AR 08:35 failure) and must not mask
 *  a missing publish. WEEKLY CADENCE 2026-11-13: `since` is the ISO
 *  week start for the blog language pipelines, the UTC day start for
 *  the recipes pair (unchanged daily law). */
async function runsSinceFor(
  token: string,
  workflow: string,
  since: Date,
  utcNow: Date,
): Promise<number> {
  const created = encodeURIComponent(`${since.toISOString()}..${utcNow.toISOString()}`);
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/runs?per_page=100&created=${created}`,
    { headers: ghHeaders(token), signal: AbortSignal.timeout(20_000) },
  );
  if (!res.ok) throw new Error(`runs query ${workflow}: HTTP ${res.status}`);
  const data = (await res.json()) as {
    workflow_runs?: Array<{ conclusion?: string | null }>;
  };
  const counted = (data.workflow_runs ?? []).filter(
    (r) => !["failure", "cancelled"].includes(r.conclusion ?? ""),
  );
  return counted.length;
}

/** The UTC day start of `utcNow` (the recipes daily scope). */
function utcDayStart(utcNow: Date): Date {
  return new Date(
    Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), utcNow.getUTCDate()),
  );
}

async function lastRunAt(token: string, workflow: string): Promise<Date | null> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/runs?per_page=1`,
    { headers: ghHeaders(token), signal: AbortSignal.timeout(20_000) },
  );
  if (!res.ok) throw new Error(`last-run query ${workflow}: HTTP ${res.status}`);
  const data = (await res.json()) as { workflow_runs?: Array<{ created_at?: string }> };
  const at = data.workflow_runs?.[0]?.created_at;
  return at ? new Date(at) : null;
}

/**
 * PHASE 171 (blog-audit proposal ج): ACTUAL posts published in [since, now]
 * for the language — the quota law's source of truth (a post that landed by
 * ANY path means a slot was served). Read-only SELECT, server-side.
 * WEEKLY CADENCE 2026-11-13: `since` is the ISO week start for the blog
 * backstop (published_at basis — the max(runs, posts) coverage never
 * under-covers); the UTC day start for the recipes pair (unchanged).
 * Returns null when the DB is unavailable (decision falls back to
 * run-counting, the pre-171 behavior) — never throws.
 */
async function postsSinceFor(
  lang: "en" | "ar",
  since: Date,
  utcNow: Date,
): Promise<number | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  try {
    const { count, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("language", lang)
      .eq("is_published", true)
      .gte("published_at", since.toISOString())
      .lte("published_at", utcNow.toISOString());
    if (error) {
      console.warn(`[dispatch-pipelines] postsSince degraded (${lang}): ${error.message}`);
      return null;
    }
    return count ?? 0;
  } catch (e) {
    console.warn(
      `[dispatch-pipelines] postsSince degraded (${lang}): ${e instanceof Error ? e.message : e}`,
    );
    return null;
  }
}

/**
 * HEALTHY-RECIPES-PLATFORM (2026-11-10): pairs PUBLISHED today (UTC) —
 * the recipes daily-quota law's source of truth (the postsSinceFor
 * precedent; read-only SELECT, null on DB trouble — never throws).
 */
async function pairsTodayFor(utcNow: Date): Promise<number | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  try {
    const dayStart = new Date(
      Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), utcNow.getUTCDate()),
    ).toISOString();
    const { count, error } = await supabaseAdmin
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", dayStart);
    if (error) {
      console.warn(`[dispatch-pipelines] pairsToday degraded: ${error.message}`);
      return null;
    }
    return count ?? 0;
  } catch (e) {
    console.warn(
      `[dispatch-pipelines] pairsToday degraded: ${e instanceof Error ? e.message : e}`,
    );
    return null;
  }
}

async function dispatchWorkflow(token: string, workflow: string): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: ghHeaders(token),
      body: JSON.stringify({ ref: "main" }),
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (res.status !== 204) throw new Error(`dispatch ${workflow}: HTTP ${res.status}`);
}

export async function GET(request: NextRequest) {
  // ── Auth (fail-closed, C4 pattern) ──────────────────────────────────
  // M6 (audit 2026-09-07): constant-time CRON_SECRET check.
  if (!verifyCronAuth(request))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error: "GITHUB_DISPATCH_TOKEN not configured on this deployment.",
        setup:
          "Add a fine-grained GitHub PAT (this repo only, Actions: Read and write) as Vercel env GITHUB_DISPATCH_TOKEN, then redeploy.",
      },
      { status: 503 },
    );
  }

  const utcNow = new Date();
  const results: DispatchCheck[] = [];

  // ── Blog language pipelines: top up to the WEEKLY quota ─────────────
  // WEEKLY CADENCE (owner order 2026-11-13): each language has TWO
  // slots per ISO week (AR Mon+Thu 05:00 UTC · EN Tue+Fri 22:00 UTC).
  // Coverage is week-scoped: max(non-failed runs since Monday 00:00
  // UTC, posts published since Monday 00:00 UTC) — a slot missed on
  // its day can be topped up on a LATER day of the same week (pair
  // completion first: the resumed twin row is consumed before any new
  // pair), while at most ONE top-up per language per fire keeps the
  // 1-automated-article/day/lang publish guard meaningful. The week's
  // dispatches can never exceed the two scheduled slots per language.
  const weekStart = isoWeekStartUTC(utcNow);
  for (const plan of BLOG_WEEKLY_PLANS) {
    try {
      const lang = plan.workflow === EN_WORKFLOW ? "en" : "ar";
      const runsThisWeek = await runsSinceFor(token, plan.workflow, weekStart, utcNow);
      const postsThisWeek = await postsSinceFor(lang, weekStart, utcNow);
      const decision = computeWeeklyTopUp({
        slots: plan.slots,
        now: utcNow,
        runsThisWeek,
        postsThisWeek,
      });
      let dispatched = 0;
      for (let i = 0; i < decision.topUpNow; i++) {
        await dispatchWorkflow(token, plan.workflow);
        dispatched += 1;
      }
      results.push({
        workflow: plan.workflow,
        scope: "iso-week",
        runsToday: runsThisWeek,
        postsToday: postsThisWeek,
        expectedThroughNow: decision.expected,
        dispatched,
        status: dispatched > 0 ? "dispatched" : "up-to-date",
        detail: decision.postsCountUnknown ? "posts count unavailable — runs-only decision" : undefined,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        workflow: plan.workflow,
        scope: "iso-week",
        runsToday: -1,
        postsToday: -1,
        expectedThroughNow: -1,
        dispatched: 0,
        status: "error",
        detail: msg,
      });
    }
  }

  // ── Recipes pair: top up to the DAILY quota (unchanged law) ────────
  // HEALTHY-RECIPES-PLATFORM (2026-11-10, plan §6.3): one pair per day;
  // recipes are a separate content type, untouched by the weekly blog
  // cadence change. Coverage counts PAIRS (language-agnostic by design
  // — one atomic publish serves both languages).
  try {
    const runsToday = await runsSinceFor(token, RECIPES_WORKFLOW, utcDayStart(utcNow), utcNow);
    const postsToday = await pairsTodayFor(utcNow);
    // PHASE 171: grace-aware expectation + coverage = max(runs, posts).
    // A slot is "expected" only 90 min after its hour (GitHub's
    // documented scheduler delay); a post that landed by ANY path
    // covers the slot even if no run was counted.
    const decision = computeTopUp({
      slots: [6],
      utcHour: utcNow.getUTCHours(),
      utcMinute: utcNow.getUTCMinutes(),
      runsToday,
      postsToday,
    });
    let dispatched = 0;
    for (let i = 0; i < decision.missing; i++) {
      await dispatchWorkflow(token, RECIPES_WORKFLOW);
      dispatched += 1;
    }
    results.push({
      workflow: RECIPES_WORKFLOW,
      scope: "utc-day",
      runsToday,
      postsToday,
      expectedThroughNow: decision.expected,
      dispatched,
      status: dispatched > 0 ? "dispatched" : "up-to-date",
      detail: decision.postsCountUnknown ? "posts count unavailable — runs-only decision" : undefined,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({
      workflow: RECIPES_WORKFLOW,
      scope: "utc-day",
      runsToday: -1,
      postsToday: -1,
      expectedThroughNow: -1,
      dispatched: 0,
      status: "error",
      detail: msg,
    });
  }

  // ── ai-jobs worker: rescue when stale ───────────────────────────────
  try {
    const last = await lastRunAt(token, AI_JOBS_WORKFLOW);
    const stale = !last || utcNow.getTime() - last.getTime() > AI_JOBS_STALE_MS;
    if (stale) {
      await dispatchWorkflow(token, AI_JOBS_WORKFLOW);
      results.push({
        workflow: AI_JOBS_WORKFLOW,
        runsToday: -1,
        postsToday: null,
        expectedThroughNow: -1,
        dispatched: 1,
        status: "dispatched",
        detail: last ? `last run ${last.toISOString()} (>15 min stale)` : "no runs ever",
      });
    } else {
      results.push({
        workflow: AI_JOBS_WORKFLOW,
        runsToday: -1,
        postsToday: null,
        expectedThroughNow: -1,
        dispatched: 0,
        status: "up-to-date",
        detail: `last run ${last?.toISOString()}`,
      });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({
      workflow: AI_JOBS_WORKFLOW,
      runsToday: -1,
      postsToday: null,
      expectedThroughNow: -1,
      dispatched: 0,
      status: "error",
      detail: msg,
    });
  }

  return NextResponse.json({
    ok: results.every((r) => r.status !== "error"),
    checkedAt: utcNow.toISOString(),
    results,
  });
}
