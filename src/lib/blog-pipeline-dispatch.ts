/**
 * BLOG PIPELINE DISPATCH — coach generation rides the AUTOMATIC pipeline.
 *
 * PHASE 162 (owner directive 2026-09-10: «مطلوب مسار الكوتش للتوليد يكون
 * نفس مسار التوليد الالى دون تعطيل للتوليد الالى»): article_generate no
 * longer runs a parallel generation system of its own by default — the
 * coach's request DISPATCHES the exact workflow the automatic daily
 * generation uses (`blog-post-ar.yml` / `blog-post-en.yml`, the same files
 * the 05:00/22:00 UTC cron slots fire). The article therefore inherits the
 * full automatic path for free: P0 research → P1 outline → P2 content
 * (1500-2500 words) → P3 images → P4 review/links → P5 PUBLISH + sitemap
 * + the bilingual pairing handshake (`linked_post_id` bidirectional).
 *
 * AUTOMATIC GENERATION IS UNTOUCHED: the cron triggers, concurrency groups
 * (`blog-pipeline-ar` / `blog-pipeline-en`, cancel-in-progress false) and
 * Phase-119 one-slot-per-day tables are exactly as they were — a coach
 * dispatch simply queues another run of the same workflow (never cancels a
 * running one, never skips a scheduled one).
 *
 * TOPIC OVERRIDE: an optional coach topic (≥ MIN_TOPIC_CHARS so it can be
 * legally sealed into a shared brief) rides workflow_dispatch inputs →
 * `PIPELINE_TOPIC` → P0, which seals it into MY side of the pair's brief
 * (the twin keeps its researched topic). Empty/short topic = the pipeline's
 * own research picks the title — the same «مفروض يختار العنوان بنفس نظام
 * التوليد» behavior the automatic run has.
 *
 * TOKEN: `GITHUB_DISPATCH_TOKEN` (same secret and same fine-grained-PAT
 * law as `ai-runner-dispatch.ts` — this repo only, Actions: Read+write).
 *
 * FAIL-OPEN BY DESIGN: a false return NEVER fails the enqueue — the route
 * leaves the ai_jobs row queued and the proven single-shot draft generator
 * (`runArticleGenerate` in ai-job-processors.ts, hardened by 161.4/161.5)
 * processes it as the fallback, so generation never silently dies.
 */

// WEEKLY CADENCE (2026-11-13): the pure ISO-week attribution helpers
// (isoWeekStartUTC) live in blog-queue.ts next to the weekly quota
// counter that shares them — single source, no cycle (queue never
// imports this module).
import { isoWeekStartUTC } from "./blog-queue";

const REPO = "muscleshubfit-cpu/alkemos-aws"; // OPS-TRANSITION 2026-10-10: coach pipeline dispatch targets the new repo
const DISPATCH_TIMEOUT_MS = 8_000;

/** Mirrors blog-pairing MIN_TOPIC_CHARS — a topic shorter than this cannot
 * be sealed into a SharedBrief, so it is NOT honored as an override (the
 * pipeline's research picks the title instead, exactly like automatic runs). */
const MIN_TOPIC_CHARS = 10;

// ═════════════════════════════════════════════════════════════════
// PHASE 171 (blog-audit proposal ج — 2026-09-10): DOUBLE-PUBLISH RACE
// CLOSURE. Live evidence: EN published TWO posts on 09-05 (23:07 + 23:33)
// and 09-04; AR two on 09-04 — violating the Phase-119 one-article/day
// law. Root cause: the 23:00 UTC backstop counted RUNS and saw GitHub's
// documented 30–90 min cron delay as a "missed slot" → extra dispatch →
// the delayed scheduled run then fired too → both published. Three
// deterministic layers now close it:
//   (1) GRACE: a slot only counts as "expected" once slot+90 min has
//       passed (GitHub's documented worst-case scheduler delay), so a
//       merely-late scheduled run is never mistaken for a missed one.
//   (2) POST-COUNT COVERAGE: the backstop now counts ACTUAL published
//       posts today (blog_posts) alongside runs — coverage is the max of
//       the two. A post that already landed (any path) means the daily
//       quota is met; no top-up is dispatched for it.
//   (3) P5 publish-layer guard (blog-queue.ts countAutomatedPublishedToday
//       + p5-publish route): even if two runs DO race through, the second
//       AUTOMATIC publish of the same UTC day is refused
//       (skipped_daily_quota) — coach-requested rows are exempt (owner
//       override, Phase 162). The Vercel cron moved 23:00 → 23:40 UTC so
//       the grace window has fully elapsed when the backstop fires.
// ═════════════════════════════════════════════════════════════════

/** GitHub's documented worst-case scheduled-run delay (high load). */
export const SLOT_GRACE_MINUTES = 90;

/**
 * How many of the given UTC-hour slots count as "expected" through the
 * given time. A slot enters the expectation only AFTER its grace window
 * (slot + SLOT_GRACE_MINUTES) elapsed — before that, a missing run means
 * "the scheduler is probably just late", NOT "the slot was missed".
 * Pure: injected clock values, unit-testable.
 */
export function expectedSlotsThrough(
  slots: readonly number[],
  utcHour: number,
  utcMinute: number,
  graceMinutes: number = SLOT_GRACE_MINUTES,
): number {
  const nowMin = utcHour * 60 + utcMinute;
  return slots.filter((s) => nowMin - s * 60 >= graceMinutes).length;
}

export type TopUpDecision = {
  /** Slots whose grace window elapsed through the given time. */
  expected: number;
  /** Coverage = max(run-count, post-count) — either means "slot served". */
  covered: number;
  /** How many top-up dispatches are warranted (never negative). */
  missing: number;
  /** True when the post count was unavailable and runs alone decided. */
  postsCountUnknown: boolean;
};

/**
 * The backstop's dispatch decision (pure). Coverage semantics:
 *   - runsToday: non-failed workflow runs created today (IN-FLIGHT runs
 *     count — conclusion null — because a started run owns the slot).
 *   - postsToday: blog_posts published today for the language (nullable —
 *     DB unavailable → fall back to run-counting, the pre-171 behavior).
 */
export function computeTopUp(opts: {
  slots: readonly number[];
  utcHour: number;
  utcMinute: number;
  runsToday: number;
  postsToday: number | null;
  graceMinutes?: number;
}): TopUpDecision {
  const expected = expectedSlotsThrough(
    opts.slots,
    opts.utcHour,
    opts.utcMinute,
    opts.graceMinutes,
  );
  const covered = Math.max(
    opts.runsToday,
    opts.postsToday ?? opts.runsToday,
  );
  return {
    expected,
    covered,
    missing: Math.max(0, expected - covered),
    postsCountUnknown: opts.postsToday === null,
  };
}

export type PipelineDispatchLang = "ar" | "en";

// ═════════════════════════════════════════════════════════════════
// WEEKLY CADENCE (owner order 2026-11-13 «خفض النشر من مقالين يوميًا
// إلى 4 مقالات إجمالًا أسبوعيًا فقط»): the blog pipelines moved from
// ONE slot per language PER DAY (Phase 119) to TWO slots per language
// PER WEEK on FOUR distinct days — no day carries more than one
// article:
//
//   AR   Monday + Thursday  05:00 UTC  (08:00 Cairo — morning window)
//   EN   Tuesday + Friday   22:00 UTC  (18:00 US Eastern — evening)
//
// The Phase-119 geography-anchored TIMES and timezone anchors are
// UNTOUCHED (owner law: no publishing-time change without a documented
// technical necessity) — only the DAYS were reduced. Pair completion
// keeps today's direction: the AR slot CREATEs the pair and its EN
// twin row; the EN slot on the NEXT day ADOPTs/resumes the twin
// (41h apart, well inside the 144h pairing windows widened for the
// weekly cadence in blog-pairing.ts).
//
// The backstop model below follows the same weekly law: a language's
// slot is "expected" only on its scheduled weekday after the 90-minute
// grace, and coverage is counted over the ISO WEEK (Monday 00:00 UTC)
// as max(non-failed runs this week, posts published this week) — so a
// genuinely missed slot can be topped up on a LATER day of the SAME
// week (pair-completion first: the twin row is consumed before a new
// pair is created), while the week's dispatches can never exceed the
// two scheduled slots (expected ≤ 2) and the publish-layer weekly
// guard (p5-publish + countAutomatedPublishedThisWeek) refuses any
// THIRD automated article per language per creation-week regardless
// of path — retries, manual re-runs and backstop dispatches alike.
// ═════════════════════════════════════════════════════════════════

/** One weekly publishing slot. `day`: 0 = Monday … 6 = Sunday (ISO). */
export type WeeklySlot = { day: number; hour: number };

/** AR weekly slots — Mon + Thu 05:00 UTC (cron `0 5 * * 1,4`). */
export const AR_WEEKLY_SLOTS: readonly WeeklySlot[] = [
  { day: 0, hour: 5 },
  { day: 3, hour: 5 },
];

/** EN weekly slots — Tue + Fri 22:00 UTC (cron `0 22 * * 2,5`). */
export const EN_WEEKLY_SLOTS: readonly WeeklySlot[] = [
  { day: 1, hour: 22 },
  { day: 4, hour: 22 },
];

/**
 * How many of the language's weekly slots count as "expected" through
 * the given instant: a slot enters the expectation only AFTER its
 * slot-time + grace window elapsed (GitHub's documented worst-case
 * scheduler delay — the Phase-171 grace law, now applied per weekday
 * inside the ISO week that starts Monday 00:00 UTC). Pure: injected
 * clock, unit-testable.
 */
export function expectedWeeklySlotsThrough(
  slots: readonly WeeklySlot[],
  now: Date,
  graceMinutes: number = SLOT_GRACE_MINUTES,
): number {
  const weekStart = isoWeekStartUTC(now).getTime();
  const nowMs = now.getTime();
  let expected = 0;
  for (const slot of slots) {
    const slotAt = weekStart + slot.day * 86_400_000 + slot.hour * 3_600_000;
    if (nowMs - slotAt >= graceMinutes * 60_000) expected += 1;
  }
  return expected;
}

export type WeeklyTopUpDecision = TopUpDecision & {
  /** How many top-up dispatches this backstop fire may issue (≤1 — see
   *  computeWeeklyTopUp; a second missed slot waits for the next fire). */
  topUpNow: number;
};

/**
 * The weekly backstop's dispatch decision (pure). Coverage semantics
 * mirror the Phase-171 daily law, week-scoped:
 *   - runsThisWeek: non-failed workflow runs created since Monday
 *     00:00 UTC (IN-FLIGHT runs count — a started run owns its slot).
 *   - postsThisWeek: blog_posts published since Monday 00:00 UTC for
 *     the language (nullable — DB unavailable → run-counting fallback).
 * `topUpNow` is clamped to ONE dispatch per language per backstop fire:
 * the publish-layer 1-automated-article/day/language guard would
 * refuse a same-day second publish anyway, so a second simultaneous
 * dispatch would only burn a full generation run to end
 * skipped_daily_quota. A still-missing slot is served by the next
 * daily 23:40 UTC fire.
 */
export function computeWeeklyTopUp(opts: {
  slots: readonly WeeklySlot[];
  now: Date;
  runsThisWeek: number;
  postsThisWeek: number | null;
  graceMinutes?: number;
}): WeeklyTopUpDecision {
  const expected = expectedWeeklySlotsThrough(
    opts.slots,
    opts.now,
    opts.graceMinutes,
  );
  const covered = Math.max(
    opts.runsThisWeek,
    opts.postsThisWeek ?? opts.runsThisWeek,
  );
  const missing = Math.max(0, expected - covered);
  return {
    expected,
    covered,
    missing,
    postsCountUnknown: opts.postsThisWeek === null,
    topUpNow: Math.min(missing, 1),
  };
}

/**
 * Sanitize a raw coach topic into an override-usable string (or null):
 * trimmed, capped at 300 chars, and only when it is long enough to be
 * sealable in a shared brief.
 */
export function usableCoachTopic(raw: unknown): string | null {
  const t = typeof raw === "string" ? raw.trim().slice(0, 300) : "";
  return t.length >= MIN_TOPIC_CHARS ? t : null;
}

/**
 * Push-dispatch the language's pipeline workflow. True ONLY when GitHub
 * accepted the dispatch (HTTP 204). Never throws.
 */
export async function dispatchBlogPipeline(opts: {
  lang: PipelineDispatchLang;
  /** Raw coach topic — sanitized internally; null/short = no override. */
  topic?: string | null;
  /** ai_jobs receipt id — echoed into the workflow logs for traceability. */
  jobId?: string | null;
}): Promise<boolean> {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    console.warn(
      "[blog-pipeline-dispatch] GITHUB_DISPATCH_TOKEN missing — article_generate falls back to the single-shot draft generator.",
    );
    return false;
  }
  const workflow = opts.lang === "en" ? "blog-post-en.yml" : "blog-post-ar.yml";
  const inputs: Record<string, string> = {};
  const topic = usableCoachTopic(opts.topic);
  if (topic) inputs.topic = topic;
  if (opts.jobId) inputs.job_id = String(opts.jobId).slice(0, 64);
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main", inputs }),
        signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
      },
    );
    if (res.status !== 204) {
      console.warn(`[blog-pipeline-dispatch] dispatch rejected: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(
      `[blog-pipeline-dispatch] dispatch failed: ${e instanceof Error ? e.message : e}`,
    );
    return false;
  }
}
