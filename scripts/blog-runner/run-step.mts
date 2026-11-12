/**
 * scripts/blog-runner/run-step.mts
 *
 * Native GitHub Actions runner for the blog pipeline steps.
 * Executes the SAME Next.js route handlers in-process inside the
 * Actions job — NO Vercel hop, NO 60-second serverless cap.
 *
 * WHY: /api/cron/blog/* routes were budget-clamped to ≤52s per call to
 * respect the Vercel Hobby limit. Running them natively here lets each
 * step use AI_CHAIN_TOTAL_BUDGET_MS (480000 in the blog workflows since
 * R3 2026-09-29 — was 360000 since Phase 119; process-ai-jobs has run
 * 480000 since 161.4) for full-length article completions instead of
 * truncated ones.
 *
 * USAGE (called by run-step.sh):
 *   npx --no-install tsx scripts/blog-runner/run-step.mts \
 *     --step p0-research --lang en    [--queueId <uuid>] [--topic <coach topic>]
 *
 * REQUIRED ENV (GitHub Secrets → job env):
 *   CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   OPENROUTER_API (or OPENROUTER_API_KEY), GROQ_API_KEY, NVIDIA_API_KEY
 * OPTIONAL ENV: UNSPLASH_ACCESS_KEY / PEXELS_API_KEY / PIXABAY_API_KEY
 *   (IMAGE SOURCE LAW v3: Pexels primary — PEXELS_API_KEY required in
 *   GHA secrets AND the origin's staged runtime env (shared/.env,
 *   synced from the same GitHub Secrets); Unsplash/Pixabay failover),
 *   AI_CHAIN_TOTAL_BUDGET_MS, PIPELINE_LANG (en|ar — threaded by
 *   run-step.sh; required for p0-research, logged for all steps),
 *   PIPELINE_TOPIC (Phase 162: coach topic override — p0-research only;
 *   scheduled runs never set it, so their URLs are unchanged),
 *   PIPELINE_JOB_ID (Phase 171: ai_jobs receipt — marks the run
 *   coach-requested; scheduled runs never set it),
 *   P2_FORCE_REGENERATE (R1 repair loop, 2026-09-29: "1" = p2-content
 *   regenerates over an existing draft — set ONLY by run-step.sh's
 *   repair chain after a P5 word-floor failure, never by workflows),
 *   P4_REPAIR_DIAGNOSTICS (B1 repair loop, 2026-10-01: the P5 gate
 *   violation text for the p4-review re-run — set ONLY by run-step.sh's
 *   repair chain after a P5 battery/latin failure; never by workflows).
 *
 * EXIT CODES: 0 = ok:true · 1 = step reported failure · 2 = misconfig
 *             3 = R1 REPAIR CONTRACT — deterministic P5 gate failure
 *                 carrying a machine-readable rerunTarget (stdout line
 *                 `RERUN_TARGET=<step>`, plus `RERUN_DIAGNOSTICS_B64=`
 *                 when the body carries B1 repairDiagnostics); run-step.sh
 *                 executes the repair in-run instead of blind-retrying
 *                 (audit §8.2 A2 + B1)
 */
import { NextRequest } from "next/server";
import { P5_RERUN_TARGETS } from "../../src/lib/blog-repair-target";

const STEPS = [
  "p0-research",
  "p1-outline",
  "p2-content",
  "p3-images",
  "p4-review",
  "p5-publish",
] as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const step = arg("step");
  const queueId = arg("queueId");
  const langArg = arg("lang") ?? process.env.PIPELINE_LANG;
  // PHASE 162: optional coach topic override — P0 seals it into the queue
  // row + the shared brief; later steps ignore it (the row is their truth).
  const topicArg = arg("topic") ?? process.env.PIPELINE_TOPIC;
  // PHASE 171 (blog-audit proposal ج): the ai_jobs receipt id — present
  // ONLY on coach-triggered dispatches. P0 uses it to mark the run as
  // owner-requested (the row then bypasses the P5 daily-quota guard).
  const jobIdArg = (process.env.PIPELINE_JOB_ID || "").trim().slice(0, 64);

  if (!step || !STEPS.includes(step as (typeof STEPS)[number])) {
    console.error(
      `[runner] ❌ Missing/unknown --step. Valid steps: ${STEPS.join(", ")}`,
    );
    process.exit(2);
  }

  // Language split (2026-08-27): every pipeline targets exactly one
  // language. P0 requires it; later phases derive truth from the queue
  // row but still receive it so the URL stays self-describing.
  const lang = langArg === "en" || langArg === "ar" ? langArg : undefined;
  if (!lang) {
    console.error(
      `[runner] ❌ Step ${step} needs a language: pass --lang en|ar (or set PIPELINE_LANG).`,
    );
    process.exit(2);
  }

  // queueId sanity: P0 is the pipeline's queue initiator — it CREATES the
  // blog_generation_queue row itself and returns the id in its JSON (which
  // run-step.sh captures into $GITHUB_ENV as QUEUE_ID). Every later phase
  // must thread that id through.
  if (!queueId && step !== "p0-research") {
    console.error(
      `[runner] ❌ Step ${step} needs --queueId (captured automatically from p0-research output).`,
    );
    process.exit(2);
  }
  if (queueId && !/^[0-9a-f-]{36}$/i.test(queueId)) {
    console.error(`[runner] ❌ Malformed queueId: ${queueId}`);
    process.exit(2);
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "[runner] ❌ CRON_SECRET not set — add it under Settings ▸ Secrets and variables ▸ Actions.",
    );
    process.exit(2);
  }

  // Fail fast BEFORE importing pipeline modules: a missing Supabase or
  // provider key should abort instantly with an actionable message.
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.OPENROUTER_API && !process.env.OPENROUTER_API_KEY)
    missing.push("OPENROUTER_API (or OPENROUTER_API_KEY)");
  if (!process.env.GROQ_API_KEY) missing.push("GROQ_API_KEY");
  if (!process.env.NVIDIA_API_KEY) missing.push("NVIDIA_API_KEY");
  if (missing.length > 0) {
    console.error(`[runner] ❌ Missing required secrets/env: ${missing.join(", ")}`);
    process.exit(2);
  }

  // WebSocket guarantee for supabase-js realtime (2026-08-27 incident):
  // createClient() constructs a RealtimeClient eagerly; on GHA's Node 20
  // without native WebSocket it threw "Node.js detected but native
  // WebSocket not found." Workflows now use Node 22 (stable global) AND
  // this optional 'ws' fallback keeps runners safe on older nodes.
  if (typeof (globalThis as any).WebSocket === "undefined") {
    try {
      const wsMod = await import("ws");
      (globalThis as any).WebSocket = (wsMod as any).default ?? wsMod;
    } catch {
      /* no 'ws' pkg installed — rely on the runtime's native WebSocket */
    }
  }

  // Dynamic import AFTER env checks so configuration errors never reach
  // the AI providers. Route modules import @/lib via tsconfig paths —
  // resolved natively by tsx.
  const mod = await import(`../../src/app/api/cron/blog/${step}/route.ts`);

  const url = new URL(`http://actions-runner/api/cron/blog/${step}`);
  url.searchParams.set("lang", lang);
  if (queueId) url.searchParams.set("queueId", queueId);
  if (step === "p0-research" && topicArg) url.searchParams.set("topic", topicArg);
  if (step === "p0-research" && jobIdArg) url.searchParams.set("job_id", jobIdArg);
  // R1 repair chain: p2-content regenerates over the existing draft.
  if (step === "p2-content" && process.env.P2_FORCE_REGENERATE === "1") {
    url.searchParams.set("force", "1");
  }
  // B1 repair chain: the P5 gate violations ride the p4-review re-run so
  // the review model gets a one-shot REPAIR DIRECTIVE instead of the
  // identical prompt it just failed (runs 78/81/82 evidence). The env is
  // set ONLY by run-step.sh's repair chain (never GITHUB_ENV, never
  // workflows) — normal runs never carry the URL param at all.
  if (step === "p4-review" && process.env.P4_REPAIR_DIAGNOSTICS) {
    url.searchParams.set("repairDiagnostics", process.env.P4_REPAIR_DIAGNOSTICS);
  }

  console.log(
    `[runner] ▶ ${step} · lang=${lang}${queueId ? ` · queue=${queueId}` : ""}${
      step === "p0-research" && topicArg ? ` · topicOverride=yes` : ""
    }${step === "p0-research" && jobIdArg ? " · coachRun=yes" : ""}`,
  );

  const req = new NextRequest(url, {
    headers: { authorization: `Bearer ${secret}` },
  });

  let res: Response;
  try {
    res = await mod.GET(req);
  } catch (err) {
    console.error(
      "[runner] ❌ Handler threw:",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  }

  const text = await res.text();
  console.log(`HTTP ${res.status}\n${text}`);

  let ok = res.status < 400;
  let rerunTarget: string | null = null;
  let repairDiagnostics: string | null = null;
  try {
    const parsedBody = JSON.parse(text);
    ok = ok && parsedBody?.ok === true;
    // R1 REPAIR CONTRACT (audit §8.2 A2): a deterministic P5 gate
    // failure returns { error, rerunTarget } — translate it to exit
    // code 3 + a machine-readable stdout line for run-step.sh's
    // repair loop. Only the closed-set contract targets are honored;
    // anything else stays a plain exit-1 failure.
    if (
      !ok &&
      typeof parsedBody?.rerunTarget === "string" &&
      (P5_RERUN_TARGETS as readonly string[]).includes(parsedBody.rerunTarget)
    ) {
      rerunTarget = parsedBody.rerunTarget;
    }
    // B1 (audit §8.2 B1, owner order 2026-10-01): the P5 body may also
    // carry the gate violations as `repairDiagnostics` (p4-review
    // targets only). Re-emit base64 — an em-dash/Arabic/quote-bearing
    // single line that run-step.sh greps + decodes safely.
    if (rerunTarget && typeof parsedBody?.repairDiagnostics === "string" && parsedBody.repairDiagnostics.trim()) {
      repairDiagnostics = parsedBody.repairDiagnostics;
    }
  } catch {
    /* non-JSON body already failed via status above when >= 400 */
  }
  if (!ok) {
    if (rerunTarget) {
      console.log(`RERUN_TARGET=${rerunTarget}`);
      if (repairDiagnostics) {
        console.log(`RERUN_DIAGNOSTICS_B64=${Buffer.from(repairDiagnostics, "utf-8").toString("base64")}`);
      }
      process.exit(3);
    }
    process.exit(1);
  }

  console.log(`[runner] ✓ ${step} OK`);
}

main().catch((e: unknown) => {
  console.error("[runner] ❌ Runner crashed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
