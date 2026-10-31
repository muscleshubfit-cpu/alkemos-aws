import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { parseBundleRepairLoop, bundleResearchSource } from "@/lib/blog-queue";
import {
  cfNeuronsToday,
  cfNeuronWarnLevel,
  CF_NEURON_WARN_THRESHOLD,
  CF_NEURON_DAY_LIMIT,
} from "@/lib/ai-cf-usage";
// R2 (AI-Router unification, owner clause 3): the centralized
// (provider×model×function) meters + the Tavily/Exa monthly quota strips.
import {
  readAIMeterDay,
  tavilyCreditsThisMonth,
  exaCostCentsThisMonth,
  TAVILY_MONTH_CREDIT_LIMIT,
  EXA_MONTH_USD_CENTS_LIMIT,
  QUOTA_WARN_SHARE,
} from "@/lib/ai-usage-meter";

/**
 * AI QUEUE HEALTH — project-wide early-warning dashboard data.
 *
 * GET /api/ai/queue-health   (coach-only)
 * → { counts: {queued, processing, done, failed},
 *     oldestQueuedMinutes, lastDone: {type, finishedAt} | null,
 *     lastRunnerRunAt: string | null, ok: boolean, issues: string[],
 *     clearableFailedJobs: number }
 *
 * OWNER DIRECTIVE (2026-08-28, «محتاج اتاكد ان مفيش مشاكل مشابهة تحصل
 * مستقبلا فى المشروع كله»): the 2026-08-28 incidents were all "silent
 * for hours" failures — jobs queued forever (de-registered scheduler),
 * results invisible (no materialization), green runs over broken work.
 * This endpoint makes the whole AI pipeline's health visible AT A
 * GLANCE in the admin UI, so nothing can rot silently again.
 *
 * Fail-OPEN philosophy: the GitHub Actions probe is best-effort (6s
 * timeout, null on any error) — a missing GITHUB_DISPATCH_TOKEN must
 * degrade the panel, never break it.
 */
export const maxDuration = 20;

/** A queued job older than this is STUCK (runner should drain in ≤10 min). */
const STUCK_QUEUE_MINUTES = 30;

export async function GET(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const issues: string[] = [];

  // ── Queue counts + oldest queued + last done (one light select) ──
  const { data: rows, error } = await supabaseAdmin
    .from("ai_jobs")
    .select("status, job_type, created_at, finished_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = { queued: 0, processing: 0, done: 0, failed: 0 };
  let oldestQueuedMinutes: number | null = null;
  let lastDone: { type: string; finishedAt: string } | null = null;
  const now = Date.now();
  for (const r of rows || []) {
    const st = String(r.status || "");
    if (st in counts) counts[st as keyof typeof counts]++;
    if (st === "queued") {
      const age = (now - new Date(r.created_at).getTime()) / 60_000;
      if (oldestQueuedMinutes === null || age > oldestQueuedMinutes) oldestQueuedMinutes = age;
    }
    if (st === "done" && !lastDone && r.finished_at) {
      lastDone = { type: String(r.job_type || ""), finishedAt: String(r.finished_at) };
    }
  }

  if (counts.queued > 0 && (oldestQueuedMinutes ?? 0) > STUCK_QUEUE_MINUTES) {
    issues.push(
      `فيه ${counts.queued} مهمة في الطابور أقدمها منتظرة ${Math.round(oldestQueuedMinutes!)} دقيقة — المشغّل غالبًا واقف`,
    );
  }
  if (counts.failed > 0) {
    issues.push(`${counts.failed} مهمة فشلت نهائيًا — راجعي سبب الفشل في سجل التشغيل`);
  }

  // ── AUDIT_REPORT §9-المرحلة 1, item 3 (2026-09-29): blog research
  // fallback visibility. The audit measured 34/141 runs (24%) silently
  // shipping STATIC curated-pool topics — the root of the measured
  // cannibalization clusters (C3/F4). Rows inserted since the law carry
  // researchSource:"fallback" in their bundle (stamped by the P0 route);
  // this scan surfaces them in the admin panel so a fallback day is NEVER
  // silent. Degrades open (a scan failure never breaks the panel).
  //
  // 2026-10-30 (owner order «زر مسح التنبيه…» — measured live, run
  // 40934223546): the old server-side `.like("article_bundle", …)`
  // prefilter answered PostgREST 42883 on EVERY call — article_bundle is
  // a jsonb column and Postgres has no LIKE for jsonb — so the scan
  // silently no-op'd and the fallback alert could NEVER fire (a
  // dishonest green on exactly the axis this strip exists for). The
  // bundles are stored as jsonb STRING scalars (double-encoded text), so
  // no server-side operator can see their keys either (arrow `->>` sees
  // nothing on a string scalar). Fixed the countAutomatedPublishedToday
  // way: bounded window fetch + client-side parse-gate
  // (bundleResearchSource) — a stray prose mention of "fallback" can
  // never count, only the exact top-level stamp does.
  try {
    const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const { data: fbRows, error: fbErr } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("id, language, created_at, article_bundle")
      .gte("created_at", since)
      .limit(50);
    if (!fbErr && Array.isArray(fbRows)) {
      const fbHits = (
        fbRows as Array<{ language?: string | null; article_bundle?: string | null }>
      ).filter((r) => bundleResearchSource(r.article_bundle ?? null) === "fallback");
      if (fbHits.length > 0) {
        const en = fbHits.filter((r) => r.language === "en").length;
        const ar = fbHits.length - en;
        issues.push(
          `⚠ ${fbHits.length} صف توليد مدونة في آخر 24 ساعة جاء موضعه من القائمة الثابتة لا من بحث حقيقي (EN ${en} · AR ${ar}) — سلسلة النماذج فشلت في P0 تلك التشغيلات`,
        );
      }
    }
  } catch {
    /* blog-fallback scan is best-effort — panel stays honest without it */
  }

  // ── Last GHA runner run (best-effort probe) ──
  let lastRunnerRunAt: string | null = null;
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (token) {
    try {
      const res = await fetch(
        "https://api.github.com/repos/muscleshubfit-cpu/alkemos-aws/actions/workflows/process-ai-jobs.yml/runs?per_page=1&status=success", // OPS-TRANSITION 2026-10-10
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          signal: AbortSignal.timeout(6_000),
        },
      );
      if (res.ok) {
        const data: unknown = await res.json();
        const ranAt = (data as { workflow_runs?: { run_started_at?: string }[] })
          ?.workflow_runs?.[0]?.run_started_at;
        if (ranAt) {
          lastRunnerRunAt = String(ranAt);
          const sinceMin = (now - new Date(ranAt).getTime()) / 60_000;
          if (counts.queued > 0 && sinceMin > STUCK_QUEUE_MINUTES && !issues.length) {
            issues.push(
              `الطابور فيه مهام وآخر تشغيل ناجح كان قبل ${Math.round(sinceMin)} دقيقة — اضغطي يدويًا على Run workflow أو راجعي GITHUB_DISPATCH_TOKEN`,
            );
          }
        }
      }
    } catch {
      /* probe failed — degrade silently, counts above still tell the story */
    }
  }

  // ── AUDIT_REPORT §9-المرحلة 2, item 5 (2026-09-29): bilingual
  // pairing ADOPTION visibility — «تفعيل الإقران الثنائي أو إيقاف
  // وعوده». The live diagnosis measured only 4/53 pair-era rows
  // carrying a pair_id (7.5%): the promise was effectively dead while
  // AGENTS.md still called pairing a foundational law. This 7-day window
  // scan surfaces the REAL adoption rate next to the fallback rate, so
  // the fix (retry + widened windows, same frame) can be measured and
  // the promise either keeps delivering or gets an honest owner
  // decision (retro-pair as primary). Degrades open — a scan failure
  // never breaks the panel.
  let pairing: { rows: number; paired: number; pct: number } | null = null;
  try {
    const sincePair = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pairRows, error: pairErr } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("language, pair_id")
      .gte("created_at", sincePair)
      .limit(100);
    if (!pairErr && pairRows) {
      const rows = pairRows.length;
      const paired = pairRows.filter(
        (r: { pair_id?: string | null }) => typeof r.pair_id === "string" && r.pair_id.length > 0,
      ).length;
      const pct = rows > 0 ? Math.round((paired / rows) * 100) : 100;
      pairing = { rows, paired, pct };
      // Only flag when there is enough signal AND adoption is critically
      // low — the threshold matches the measured broken state (7.5%);
      // a young day with 1-2 rows should not cry wolf.
      if (rows >= 4 && pct < 25) {
        issues.push(
          `⚠ الإقران الثنائي شبه معطل: ${paired}/${rows} صف توليد فقط في آخر 7 أيام يحمل pair_id (${pct}%) — مراجعة أغلب أزواج اللغة لا تكتمل (انظر مدخل المرحلة 2 بتقرير التدقيق)`,
        );
      }
    }
  } catch {
    /* pairing scan is best-effort — panel stays honest without it */
  }

  // ── CF NEURON WARNING (Phase 5-C / stage ج — §8-ج design, §12-4 owner
  // approval): the Cloudflare Workers AI free allocation is 10,000
  // neurons/day. The meter (ai-cf-usage.ts — Upstash daily key, fail-open)
  // accumulates result.usage.neurons from every CF role call; at ≥80%
  // (8,000) this strip warns so the owner can watch the headroom BEFORE
  // the ≥95% barrier starts skipping CF calls honestly. Advisory only
  // — never blocks a call; a metering outage degrades open (null).
  let cfNeurons: { used: number; warnThreshold: number; dayLimit: number } | null = null;
  try {
    const used = await cfNeuronsToday();
    if (used > 0) {
      cfNeurons = { used, warnThreshold: CF_NEURON_WARN_THRESHOLD, dayLimit: CF_NEURON_DAY_LIMIT };
      if (await cfNeuronWarnLevel()) {
        issues.push(
          `⚠ استهلاك Cloudflare بلغ ${Math.round(used)} عصبونًا من ${CF_NEURON_DAY_LIMIT.toLocaleString("en-US")} اليومي (تجاوز عتبة التحذير ${CF_NEURON_WARN_THRESHOLD.toLocaleString("en-US")} — حاجز المنع عند 95%)`,
        );
      }
    }
  } catch {
    /* CF neuron meter is best-effort — panel stays honest without it */
  }

  // ── R5 REPAIR-LOOP COUNTER (Execution-Path Audit §10 Phase R5,
  // 2026-09-30 — «عدّاد إصلاح في /api/ai/queue-health»): measures
  // «repair-first vs regenerate» from DB truth. P5 stamps a
  // `repairLoop` marker into the row's bundle at every repair
  // directive; the marker survives the repair chain, so a PUBLISHED
  // row that carries it = a row the R1 loop actually saved in-run
  // (repair-first won), while a FAILED row carrying it = the repair
  // budget was exhausted and the 23:40 backstop regenerated the day
  // (regenerate path). 14-day window = the audit's measurement
  // window. A NEUTRAL counter, not an alarm (like `pairing` above):
  // it reports the ratio, the issues array stays for real problems.
  // Degrades open — a scan failure never breaks the panel.
  let repair: {
    windowDays: number;
    published: number;
    afterRepair: number;
    exhausted: number;
    sharePct: number;
    recoveryPct: number;
  } | null = null;
  try {
    const sinceRepair = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pubRows, error: pubErr } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("article_bundle")
      .eq("status", "published")
      .gte("created_at", sinceRepair)
      .limit(300);
    // 2026-10-30 (same 42883 measurement as the fallback scan above):
    // the old `.like("article_bundle", '%"repairLoop"%')` server-side
    // prefilter errored on every live call (no LIKE for jsonb), so the
    // stamped-row half of the counter never saw a single row. The window
    // is fetched whole and parse-gated client-side instead — the parse
    // gate below is UNCHANGED law: a stray substring inside topic prose
    // must never count as a repaired row (only a structurally valid
    // repairLoop stamp does).
    const { data: repRows, error: repErr } = await supabaseAdmin
      .from("blog_generation_queue")
      .select("status, article_bundle")
      .gte("created_at", sinceRepair)
      .limit(300);
    if (!pubErr && !repErr && Array.isArray(pubRows) && Array.isArray(repRows)) {
      const published = pubRows.length;
      // Parse-gate the window rows — a stray substring inside topic
      // prose must never count as a repaired row. (Cast mirrors
      // countAutomatedPublishedToday: the generated client types
      // article_bundle as Json; the column is a string in practice.)
      const stampedRows = repRows as Array<{ status?: string | null; article_bundle?: string | null }>;
      const stamped = stampedRows.filter(
        (r) => parseBundleRepairLoop(r.article_bundle ?? null) !== null,
      );
      const afterRepair = stamped.filter((r) => r.status === "published").length;
      const exhausted = stamped.filter((r) =>
        String(r.status || "").startsWith("failed"),
      ).length;
      repair = {
        windowDays: 14,
        published,
        afterRepair,
        exhausted,
        sharePct: published > 0 ? Math.round((afterRepair / published) * 100) : 0,
        recoveryPct:
          afterRepair + exhausted > 0
            ? Math.round((afterRepair / (afterRepair + exhausted)) * 100)
            : 100,
      };
    }
  } catch {
    /* repair scan is best-effort — panel stays honest without it */
  }

  // ── R2 PROVIDER×MODEL×FUNCTION USAGE (last 24h) + SEARCH QUOTAS ──
  // (AI-Router unification frame R2, owner clause 3: «عدادات ومراقبة حسب
  // المزود والنموذج والوظيفة»). Reads the ai:usage:{date}:* daily keys
  // (SCAN+MGET, fail-open → null keeps the panel honest without it) plus
  // the two MONTHLY search-quota meters (advisory strips — the free
  // grants renew monthly; WARNING at 80%, never a barrier).
  let providerUsage: {
    windowHours: 24;
    rows: Array<{
      fn: string;
      provider: string;
      model: string;
      calls: number;
      ok: number;
      empty: number;
      fail: number;
      quota: number;
      tokensEst: number;
    }>;
  } | null = null;
  try {
    const rows = await readAIMeterDay();
    if (rows.length > 0) providerUsage = { windowHours: 24, rows };
  } catch {
    /* usage meter is best-effort — panel stays honest without it */
  }

  let tavilyQuota: { usedCredits: number; monthLimit: number; warnAt: number } | null = null;
  try {
    const usedCredits = await tavilyCreditsThisMonth();
    if (usedCredits !== null && usedCredits > 0) {
      const warnAt = Math.floor(TAVILY_MONTH_CREDIT_LIMIT * QUOTA_WARN_SHARE);
      tavilyQuota = { usedCredits: Math.round(usedCredits * 10) / 10, monthLimit: TAVILY_MONTH_CREDIT_LIMIT, warnAt };
      if (usedCredits >= warnAt) {
        issues.push(
          `⚠ استهلاك Tavily بلغ ${Math.round(usedCredits)} رصيدًا من ${TAVILY_MONTH_CREDIT_LIMIT.toLocaleString("en-US")} شهريًا (تجاوز عتبة التحذير ${warnAt} — استشاري، المنحة تتجدد شهريًا)`,
        );
      }
    }
  } catch {
    /* advisory strip only */
  }

  let exaQuota: { usedCents: number; monthLimit: number; warnAt: number } | null = null;
  try {
    const usedCents = await exaCostCentsThisMonth();
    if (usedCents !== null && usedCents > 0) {
      const warnAt = Math.floor(EXA_MONTH_USD_CENTS_LIMIT * QUOTA_WARN_SHARE);
      exaQuota = { usedCents: Math.round(usedCents * 10) / 10, monthLimit: EXA_MONTH_USD_CENTS_LIMIT, warnAt };
      if (usedCents >= warnAt) {
        issues.push(
          `⚠ استهلاك Exa بلغ $${(usedCents / 100).toFixed(2)} من المنحة الشهرية $10 (تجاوز عتبة التحذير $${(warnAt / 100).toFixed(2)} — استشاري، المنحة تتجدد شهريًا)`,
        );
      }
    }
  } catch {
    /* advisory strip only */
  }

  return NextResponse.json({
    counts,
    oldestQueuedMinutes: oldestQueuedMinutes === null ? null : Math.round(oldestQueuedMinutes),
    lastDone,
    lastRunnerRunAt,
    pairing,
    repair,
    cfNeurons,
    providerUsage,
    tavilyQuota,
    exaQuota,
    // CLEARABLE-SCOPE CONTRACT (2026-10-30, owner order «زر مسح التنبيه يعرض
    // تم مسح 0 بينما يظل التنبيه الأحمر 0/6 pair_id ظاهرًا»): the issues array
    // mixes FAILED ai_jobs rows (transient diagnostics the DELETE actually
    // removes) with LIVE conditions computed from real pipeline rows
    // (stuck queue · research fallback · pairing adoption · stale runner) —
    // none of which any record-deletion can honestly resolve. This field is
    // the explicit contract for what the dismissal CAN clear: the UI offers
    // the clear button ONLY when it is > 0, so a live-state alert is never
    // offered a dismissal that would clear 0 records and stay red.
    clearableFailedJobs: counts.failed,
    ok: issues.length === 0,
    issues,
  });
}

/**
 * CLEAR-FAILED LAW (2026-08-28m, owner screenshot + «ضيف طريقة لمسحها
 * يدوى»): the red «N مهمة فشلت نهائيًا» banner counted FAILED rows
 * FOREVER — failed jobs stayed in ai_jobs, so the alert could never be
 * dismissed. DELETE /api/ai/queue-health (coach-only) removes the failed
 * queue rows (they are transient diagnostics — the real failure evidence
 * lives in the GHA run logs the banner already points at) and the next
 * GET reports clean. Stuck-queue issues (if any) stay honest: they are
 * recomputed from live rows, never suppressed.
 *
 * 2026-08-28n HOTFIX (owner: «مسح عمليات الفشل لم يعمل» + toast showed
 * the literal fallback «clear failed»): production answered the old
 * `.delete(null, {count:"exact"})` variant with a NON-JSON error, so the
 * client only had its fallback string to show. Rewritten to the SAME
 * shape as every delete that already works in this app
 * (select ids → `.delete().in("id", …)`) and wrapped in try/catch so the
 * route can ONLY ever answer JSON — the toast now shows a real message
 * (or an Arabic fallback with the HTTP code) instead of a cryptic stub.
 *
 * CLEARABLE-SCOPE (2026-10-30, same owner order as the GET contract
 * above): this verb's scope is EXACTLY the failed ai_jobs rows — the
 * records behind the «N مهمة فشلت نهائيًا» issue and nothing else. The
 * other alert sources (blog_generation_queue pairing/fallback scans,
 * stuck-queue math, runner staleness) are LIVE conditions over real
 * generation history: deleting those rows would destroy published-article
 * records, so they are NEVER touched here — they clear when their cause
 * resolves, and the UI never offers this button for them.
 */
export async function DELETE(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  try {
    const { data: rows, error: selErr } = await supabaseAdmin
      .from("ai_jobs")
      .select("id")
      .eq("status", "failed")
      .limit(200);
    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }
    const ids = (rows || [])
      .map((r) => r?.id)
      .filter((id) => typeof id === "string" && id.length > 0);
    if (!ids.length) {
      return NextResponse.json({ deleted: 0 });
    }
    const { error: delErr } = await supabaseAdmin
      .from("ai_jobs")
      .delete()
      .in("id", ids);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
    return NextResponse.json({ deleted: ids.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "delete failed unexpectedly" },
      { status: 500 },
    );
  }
}
