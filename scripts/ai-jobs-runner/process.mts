/**
 * scripts/ai-jobs-runner/process.mts
 *
 * Native GitHub Actions worker for the WHOLE AI system (owner directive
 * 2026-08-27): claims queued `ai_jobs` rows and runs their processors
 * IN-PROCESS — no API-route hop, no time cap (the design was born
 * against the retired Vercel 60s serverless cap). EVO chat is the
 * ONLY AI that never touches this file (it streams in the app on the
 * AWS origin — the sole direct-model exception).
 *
 * USAGE:
 *   npx --no-install tsx scripts/ai-jobs-runner/process.mts [--max 10]
 *
 * REQUIRED ENV (GitHub Secrets → job env):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   OPENROUTER_API (or OPENROUTER_API_KEY), GROQ_API_KEY
 * OPTIONAL: AI_CHAIN_TOTAL_BUDGET_MS (workflow sets 180000)
 *
 * EXIT CODES: 0 = cycle finished, all processed jobs succeeded,
 *             1 = one or more jobs FAILED PERMANENTLY (HONEST RUN COLOR
 *                 LAW 2026-08-28d: the workflow must show RED when work
 *                 actually failed — owner report: «بيطلع اشارة خضراء كأن
 *                 العملية نجحت» while articles never appeared),
 *             2 = misconfiguration (missing env).
 */

// Fail fast BEFORE importing anything heavy.
const missing: string[] = [];
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (!process.env.OPENROUTER_API && !process.env.OPENROUTER_API_KEY)
  missing.push("OPENROUTER_API (or OPENROUTER_API_KEY)");
if (!process.env.GROQ_API_KEY) missing.push("GROQ_API_KEY");
if (!process.env.NVIDIA_API_KEY) missing.push("NVIDIA_API_KEY");
if (missing.length > 0) {
  console.error(`[ai-jobs] ❌ Missing required secrets/env: ${missing.join(", ")}`);
  process.exit(2);
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const MAX_JOBS_PER_RUN = Math.max(1, Math.min(25, Number(arg("max")) || 10));
/** Wall-clock guard for the whole run (GHA job also enforces timeout). */
const RUN_DEADLINE_MS = Date.now() + 40 * 60_000;

async function main(): Promise<void> {
  // WebSocket guarantee for supabase-js realtime (same 2026-08-27 GHA
  // incident as blog-runner): Node <22 lacks a stable global WebSocket,
  // which crashed createClient(). Node 22+ workflows unaffected; this
  // optional 'ws' fallback covers older runtimes.
  if (typeof (globalThis as any).WebSocket === "undefined") {
    try {
      const wsMod = await import("ws");
      (globalThis as any).WebSocket = (wsMod as any).default ?? wsMod;
    } catch {
      /* no 'ws' pkg installed — rely on the runtime's native WebSocket */
    }
  }

  // Dynamic imports AFTER the secret check (config errors exit instantly).
  const { claimQueuedJobs, finishJob, failJob, reapStaleJobs } = await import(
    "../../src/lib/ai-jobs"
  );
  const { PROCESSORS } = await import("../../src/lib/ai-job-processors");

  // 0. Recover jobs orphaned by a previous crashed run.
  // INF-12 (fix order 2026-11-16 — gap-register GAP-2): the reaper's
  // verdict is SPLIT — below-cap stale rows requeue (recovery semantics
  // unchanged), at-cap stale rows fail PERMANENTLY (the old blind requeue
  // is what handed a collapsed job its 4th attempt: the poison pill).
  const reaped = await reapStaleJobs(30);
  if (reaped.requeued > 0 || reaped.failedFinal > 0) {
    console.log(
      `[ai-jobs] ↩︎ reaper: ${reaped.requeued} stale job(s) requeued (below attempts cap) · ${reaped.failedFinal} at-cap job(s) failed PERMANENTLY (INF-12 — no automatic re-enqueue)`,
    );
  }

  let done = 0;
  let failed = 0;
  const failedLabels: string[] = [];

  // AI-QUOTAS 2026-11-14 (owner order «إعادة هيكلة سياسة الذكاء الاصطناعي
  // والاشتراكات والأرصدة» + the corrective clarification — monthly quotas,
  // developed): the member's INDEPENDENT monthly swap quota (per type) is
  // recorded HERE, when a meal_regenerate / exercise_regenerate job
  // actually lands `done` (AI-PLAN-QUALITY 2026-10-24 success-only law).
  // ROLE-AWARE target (the planPoolBillingForRequester matrix, extended
  // to swaps): b2b coach → the swap burns the CLIENT's quota (the
  // 2026-09-01/13 decrees carried onto swaps); client self-service → his
  // own; site-coach / admin / unresolvable → the staff member's own
  // history row only (staff never burns a client's quota).
  // Migration 0110: job_ref is UNIQUE — a re-run after `done` returns
  // false here and logs the truth (no double deduction, ever).
  // Fail-soft: a ledger hiccup NEVER fails the finished job.
  const recordSwapOnSuccess = async (job: {
    id: string;
    job_type: string;
    requested_by?: string | null;
    payload?: Record<string, unknown> | null;
  }): Promise<void> => {
    try {
      if (job.job_type !== "meal_regenerate" && job.job_type !== "exercise_regenerate") return;
      const requesterId = String(job.requested_by || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requesterId)) return;
      const { recordSwapUsage, planPoolBillingForRequester } = await import("../../src/lib/tier-limits");
      const { supabaseAdmin } = await import("../../src/lib/supabase/admin");
      // Whose quota burns? Resolve the requester's role (same profile read
      // the plan-pool path uses) and apply the attribution matrix.
      let targetId = requesterId;
      let attribution = "requester (unresolved role) — staff/history row only";
      if (supabaseAdmin) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("role, coach_kind")
          .eq("id", requesterId)
          .maybeSingle();
        const policy = planPoolBillingForRequester(profile?.role ?? null, profile?.coach_kind ?? null);
        if (policy.bill) {
          const clientId = String(job.payload?.clientId ?? "");
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
            targetId = clientId;
            attribution = policy.reason;
          }
        } else {
          attribution = policy.reason;
        }
      }
      // HONEST-LEDGER 2026-10-26: recordSwapUsage RETURNS the insert's
      // truth — this log must never say «usage recorded» unless the
      // plan_swaps row actually landed (0110: a UNIQUE job_ref duplicate
      // returns false = the job was already recorded — also logged honest).
      const recorded = await recordSwapUsage(
        targetId,
        job.job_type === "meal_regenerate" ? "meal" : "exercise",
        job.id,
      );
      if (recorded) {
        console.log(`[ai-jobs] usage recorded: ${job.job_type} → plan_swaps(${targetId.slice(0, 8)}… · ${attribution})`);
      } else {
        console.warn(
          `[ai-jobs] usage NOT recorded: ${job.job_type} → plan_swaps insert FAILED or duplicate job_ref for ${targetId.slice(0, 8)}… (job stays done)`,
        );
      }
    } catch (e) {
      console.warn("[ai-jobs] swap usage recording failed (job stays done):", e instanceof Error ? e.message : e);
    }
  };

  // PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order item 3 — «تصحيح منطق
  // الأرصدة والاستحقاقات» — carried by AI-QUOTAS 2026-11-14): the CLIENT's
  // unified monthly plan quota for a successful plan_nutrition / plan_workout
  // job is recorded HERE — after finishJob lands `done` (the old
  // in-processor recording sat BEFORE finishJob: a finishJob failure →
  // requeue → re-run burned the quota TWICE) — and it is ROLE-AWARE
  // (tier-limits.planPoolBillingForRequester — extended 2026-11-14 with the
  // CLIENT self-service branch for the new dashboard generation):
  //   · b2b coach (role=coach, coach_kind='b2b'|null) → the client's quota
  //     burns — the owner's documented decrees (2026-09-01 + 2026-09-13),
  //     exactly as before;
  //   · CLIENT self-service (2026-11-14 dashboard path) → the member's own
  //     quota burns;
  //   · SITE COACH (role=coach, coach_kind='site') → NO client-quota burn —
  //     his B2C members already paid the site (migration 0067's own law);
  //   · ADMIN (site staff) → NO client-quota burn — the measured live defect
  //     this kills: 18/20 recent plan jobs were admin-requested and each
  //     burned its client's quota;
  //   · unresolvable requester → NO burn (fail-open on the ledger).
  // Migration 0110: job_ref is UNIQUE — a re-run after `done` dies on the
  // unique index and the insert is skipped (no double deduction, ever).
  // Fail-soft: a lookup/ledger hiccup NEVER fails the finished job.
  const recordPlanPoolOnSuccess = async (job: {
    id: string;
    job_type: string;
    requested_by?: string | null;
    payload?: Record<string, unknown> | null;
  }): Promise<void> => {
    try {
      if (job.job_type !== "plan_nutrition" && job.job_type !== "plan_workout") return;
      const clientId = String(job.payload?.clientId ?? "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
        return; // no target client → nothing to bill (browser-side plan)
      }
      const { supabaseAdmin } = await import("../../src/lib/supabase/admin");
      const { planPoolBillingForRequester, recordUnifiedPlanUsage } = await import(
        "../../src/lib/tier-limits"
      );
      let role: string | null = null;
      let coachKind: string | null = null;
      const requesterId = String(job.requested_by || "");
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requesterId) && supabaseAdmin) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("role, coach_kind")
          .eq("id", requesterId)
          .maybeSingle();
        role = profile?.role ?? null;
        coachKind = profile?.coach_kind ?? null;
      }
      const policy = planPoolBillingForRequester(role, coachKind);
      if (!policy.bill) {
        console.log(`[ai-jobs] plan-quota billing skipped: ${policy.reason}`);
        return;
      }
      await recordUnifiedPlanUsage({
        userId: clientId,
        kind: job.job_type === "plan_nutrition" ? "nutrition" : "workout",
        surface: "coach",
        // Migration 0110: the UNIQUE job_ref — deduct exactly once.
        jobRef: job.id,
      });
      console.log(
        `[ai-jobs] usage recorded: ${job.job_type} → ai_plan_usage(client ${clientId.slice(0, 8)}…, requester ${role}/${coachKind ?? "b2b"})`,
      );
    } catch (e) {
      console.warn("[ai-jobs] plan-quota usage recording failed (job stays done):", e instanceof Error ? e.message : e);
    }
  };

  // Loop in batches until queue empty / cap reached / wall-clock out.
  while (Date.now() < RUN_DEADLINE_MS && done + failed < MAX_JOBS_PER_RUN) {
    const batch = await claimQueuedJobs(Math.min(3, MAX_JOBS_PER_RUN - done - failed));
    if (batch.length === 0) break;

    for (const job of batch) {
      const label = `${job.job_type}#${job.id.slice(0, 8)} attempt=${job.attempts}`;
      const startedAt = Date.now();
      try {
        console.log(`[ai-jobs] ▶ processing ${label}`);
        const processor = PROCESSORS[job.job_type];
        if (!processor) throw new Error(`no processor registered for ${job.job_type}`);
        // MEMBER-SWAP-DURABILITY 2026-10-26: the swap materializers verify
        // the REQUESTER against the target plan before any service-role
        // write — requested_by rides from the claimed job row.
        const result = await processor(job.payload ?? {}, {
          requestedBy: job.requested_by ?? null,
          // INF-13 (audit AI-GENERATION-PIPELINES 2026-11-15, P1): the
          // claiming job's id — the plan-draft materializer stamps it on
          // the row and skips an already-materialized job (a finishJob
          // failure after processor success used to requeue and insert a
          // DUPLICATE draft for the member).
          jobId: job.id ?? null,
        });
        // INF-15 (P2-5): finishJob is a processing-only CAS — it returns
        // whether the write LANDED. When it did not (the row was reaped
        // mid-run and requeued, or re-claimed by a later run), the result
        // is NOT resurrected over the row's new state; the usage ledgers
        // still run below (the work was real, and 0110's UNIQUE job_ref
        // makes a double record impossible when the re-run finishes).
        const finishLanded = await finishJob(job.id, result);
        await recordSwapOnSuccess(job);
        await recordPlanPoolOnSuccess(job);
        done++;
        if (!finishLanded) {
          console.warn(
            `[ai-jobs] ⚠︎ ${label} processed, but finishJob did NOT land (row no longer processing — reaped/re-claimed underneath); result discarded, the queue row heals via its own state. Usage recording ran (job_ref dedup protects the re-run).`,
          );
          console.log(
            `::notice::AI job ${job.job_type} finished processing but its row changed state underneath (CAS miss) — honest discard`,
          );
        }
        console.log(`[ai-jobs] ✓ ${label} done in ${Math.round((Date.now() - startedAt) / 1000)}s`);
        console.log(`::notice::AI job ${job.job_type} completed`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const outcome = await failJob(job.id, Number(job.attempts || 1), message);
        if (outcome.outcome === "failed") {
          failed++;
          failedLabels.push(label);
          console.error(`[ai-jobs] ✗ ${label} FAILED permanently: ${message}`);
          console.log(`::error::AI job ${job.job_type} failed permanently: ${message.slice(0, 180)}`);
        } else if (outcome.outcome === "lost") {
          // INF-15 (P2-5): the row stopped being `processing` underneath us
          // (reaped mid-catch / re-claimed). Never counted as a permanent
          // failure — the row's own state (queued by the reaper) governs
          // what happens next, and blind overwriting is banned.
          console.warn(
            `[ai-jobs] ⚠︎ ${label} failure NOT recorded (row no longer processing — reaped/re-claimed underneath); the queue row keeps its own state. Original error: ${message}`,
          );
          console.log(
            `::notice::AI job ${job.job_type} failure discarded honestly (CAS miss — row state changed underneath)`,
          );
        } else {
          // INF-14 (P2-5): the requeue carries a SCHEDULED retry —
          // claimQueuedJobs will not touch this row until next_attempt_at
          // passes, so the OLD blind in-run sleeps are retired: the 70s
          // nap fired on nearly every failure because its regex matched the
          // "Active quota-cooldowns" preamble that every aggregated chain
          // error carries, while a genuinely quota-drained provider got
          // only 70s of mercy. The DB now spaces the retry (short window
          // for transient tails, the 30-minute provider-cooldown window
          // for quota-class terminal errors — isQuotaClassFailure reads
          // only the terminal error line), and this run moves on to the
          // next claimable job instead of sleeping on the clock.
          console.warn(
            `[ai-jobs] ⚠︎ ${label} failed, requeued with scheduled backoff — next attempt ≥ ${outcome.nextAttemptAt}: ${message}`,
          );
        }
      }
    }
  }

  console.log(`\n[ai-jobs] ══ summary: done=${done} failedPermanent=${failed}`);
  if (failed > 0) {
    // HONEST RUN COLOR: permanent failures → exit 1 → the workflow run
    // shows RED. A green run now genuinely means every claimed job landed.
    console.log(`[ai-jobs] ❌ ${failed} job(s) failed permanently: ${failedLabels.join(", ")}`);
    console.log(`[ai-jobs] The workflow will show RED — inspect the ✗ lines above.`);
    console.log(`::error::${failed} AI job(s) failed permanently this run`);
  } else {
    console.log(`[ai-jobs] ✅ every processed job succeeded — this green run is genuine.`);
  }
  process.exitCode = failed > 0 ? 1 : 0;
}

main()
  .then(() => {
    // exitCode set inside main(): 0 all-good, 1 permanent failures.
    process.exit(process.exitCode === 1 ? 1 : 0);
  })
  .catch((e: unknown) => {
    console.error("[ai-jobs] ❌ Runner crashed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
