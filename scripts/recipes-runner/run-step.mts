/**
 * scripts/recipes-runner/run-step.mts
 *
 * Native GitHub Actions runner for the healthy-recipes pipeline steps
 * (HEALTHY-RECIPES-PLATFORM plan §6.3 — the blog-runner/run-step.mts
 * pattern adapted to the atomic PAIR pipeline). Executes the SAME
 * Next.js route handlers in-process inside the Actions job — NO HTTP
 * hop, no serverless cap, full AI_CHAIN_TOTAL_BUDGET_MS budget.
 *
 * USAGE (called by run-step.sh):
 *   npx --no-install tsx scripts/recipes-runner/run-step.mts \
 *     --step r1-structure [--queueId <uuid>]
 *   npx --no-install tsx scripts/recipes-runner/run-step.mts \
 *     --requeue --queueId <uuid>     (the repair-chain row reset)
 *
 * REQUIRED ENV (GitHub Secrets → job env):
 *   CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   OPENROUTER_API (or OPENROUTER_API_KEY), GROQ_API_KEY, NVIDIA_API_KEY
 * OPTIONAL ENV: PEXELS_API_KEY / UNSPLASH_ACCESS_KEY / PIXABAY_API_KEY
 *   (R4 image chain), AI_CHAIN_TOTAL_BUDGET_MS, AI_PROVIDER_COOLDOWN_MS,
 *   RECIPES_PUBLISH_ENABLED (R6 kill switch — default true).
 *   No language split: the pair is bilingual by design — r0 creates ONE
 *   row for BOTH versions.
 *
 * EXIT CODES: 0 = ok:true (a "skipped" honest-skip step also exits 0 and
 *             prints SKIPPED=1) · 1 = step reported failure ·
 *             2 = misconfig · 3 = REPAIR CONTRACT — a deterministic
 *             hold carrying a machine-readable rerunTarget (stdout line
 *             `RERUN_TARGET=<step>`); run-step.sh executes the repair
 *             in-run instead of blind-retrying (the blog R1 precedent).
 */
import { NextRequest } from "next/server";
import { R5_RERUN_TARGETS } from "../../src/lib/recipes-repair-target";

const STEPS = [
  "r0-idea",
  "r1-structure",
  "r2-nutrition",
  "r3-authoring",
  "r4-image",
  "r5-gates",
  "r6-publish",
  "r7-indexing",
] as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function requeueMode(queueId: string): Promise<void> {
  const { resetRecipeRowForRepair } = await import("../../src/lib/recipes-queue");
  const res = await resetRecipeRowForRepair(queueId);
  if (!res.ok) {
    console.error(`[runner] ❌ requeue failed: ${res.error}`);
    process.exit(1);
  }
  // Machine-readable: 0 = r0-target (no reset possible) — the wrapper
  // knows to re-run r0 fresh instead.
  console.log(`REQUEUE_RESET=${res.reset ? 1 : 0}`);
}

async function main(): Promise<void> {
  // ── Repair-chain mode (called by run-step.sh between hold and rerun) ──
  if (arg("requeue") !== undefined) {
    const qid = arg("queueId");
    if (!qid || !/^[0-9a-f-]{36}$/i.test(qid)) {
      console.error("[runner] ❌ --requeue needs a valid --queueId <uuid>.");
      process.exit(2);
    }
    await requeueMode(qid);
    return;
  }

  const step = arg("step");
  const queueId = arg("queueId");

  if (!step || !STEPS.includes(step as (typeof STEPS)[number])) {
    console.error(
      `[runner] ❌ Missing/unknown --step. Valid steps: ${STEPS.join(", ")}`,
    );
    process.exit(2);
  }

  // queueId sanity: r0 is the pipeline's queue initiator — it CREATES the
  // recipe_generation_queue row itself (or resumes today's open row) and
  // returns the id in its JSON (which run-step.sh captures into
  // $GITHUB_ENV as QUEUE_ID). Every later stage must thread that id.
  if (!queueId && step !== "r0-idea") {
    console.error(
      `[runner] ❌ Step ${step} needs --queueId (captured automatically from r0-idea output).`,
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
  // provider key should abort instantly with an actionable message (the
  // blog-runner law; R5's advisory arm also rides the AI engine).
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

  // WebSocket guarantee for supabase-js realtime (the 2026-08-27 law):
  // workflows use Node 22+ (stable global); this optional 'ws' fallback
  // keeps runners safe on older nodes.
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
  const mod = await import(`../../src/app/api/cron/recipes/${step}/route.ts`);

  const url = new URL(`http://actions-runner/api/cron/recipes/${step}`);
  if (queueId) url.searchParams.set("queueId", queueId);

  console.log(
    `[runner] ▶ ${step}${queueId ? ` · queue=${queueId}` : ""} · publishEnabled=${process.env.RECIPES_PUBLISH_ENABLED !== "false"}`,
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
  let skipped = false;
  try {
    const parsedBody = JSON.parse(text);
    ok = ok && parsedBody?.ok === true;
    // Honest-skip shapes (R0 already-published/circuit-breaker, R6
    // kill-switch): ok:true + skipped:true — surface SKIPPED=1 so the
    // wrapper can stop later stages gracefully instead of failing them.
    if (ok && parsedBody?.skipped === true) skipped = true;
    // REPAIR CONTRACT (the blog R1 law adapted): a deterministic hold
    // returns { ok:false, held:true, rerunTarget } — translate to exit
    // code 3 + a machine-readable stdout line for run-step.sh's repair
    // loop. Only the closed-set contract targets are honored; anything
    // else stays a plain exit-1 failure.
    if (
      !ok &&
      typeof parsedBody?.rerunTarget === "string" &&
      (R5_RERUN_TARGETS as readonly string[]).includes(parsedBody.rerunTarget)
    ) {
      rerunTarget = parsedBody.rerunTarget;
    }
  } catch {
    /* non-JSON body already failed via status above when >= 400 */
  }
  if (!ok) {
    if (rerunTarget) {
      console.log(`RERUN_TARGET=${rerunTarget}`);
      process.exit(3);
    }
    process.exit(1);
  }
  if (skipped) {
    console.log("SKIPPED=1");
  }

  console.log(`[runner] ✓ ${step} OK${skipped ? " (honest skip)" : ""}`);
}

main().catch((e: unknown) => {
  console.error("[runner] ❌ Runner crashed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
