/**
 * scripts/ai-grounded-failover-probe.mts — LIVE provider-failover probe
 * (BLOG-PROVIDER-FAILOVER 2026-10-16, owner order «اختبر التبديل الفعلي»).
 *
 * Dispatch-only measuring instrument (grounded-failover-test.yml) — the
 * same discipline as aws-ai-test/gsc-connection-test: REAL calls against
 * the REAL provider keys, printing ONLY provider/model names, durations,
 * HTTP statuses, evidence counts and short text snippets. No secret
 * values, no personal data, NO code changes, NO deploy.
 *
 * WHAT IT MEASURES (in order):
 *   1. Each grounded-search arm SEPARATELY with a tiny real prompt —
 *      gemini googleSearch ladder · openrouter web plugin · groq compound.
 *      Per arm: PASS/FAIL, model, HTTP status class, live-evidence counts
 *      (searchQueries/sources), latency, and the failure message when red.
 *      (NVIDIA is NOT probed for grounding: its OpenAI-compatible chat API
 *      has no web-search tool — excluded by design, documented honestly.)
 *   2. The CROSS-PROVIDER end-to-end call callGroundedSearch() — the actual
 *      failover walk. With the cooldown registry ON, arms that failed with
 *      quota-class errors in step 1 are SKIPPED here (the "avoid futile
 *      repeats" law, demonstrated live).
 *   3. The generation chain callFreeAIFallbackChain() — provider failover
 *      for P1/P2/P4-class calls.
 *   4. The active cooldown registry state (secret-free scopes only).
 *
 * EXIT LAW (honest): exit 0 iff the end-to-end callGroundedSearch returned
 * a REAL grounded answer from SOME provider (the failover works — someone
 * answered with live-search evidence). Per-arm failures are MEASUREMENTS
 * (printed, never fatal); the end-to-end failure is the only red exit —
 * that is exactly "the failover did not produce a working search path".
 *
 * Usage (GitHub Actions runner, secrets in env):
 *   npx --no-install tsx scripts/ai-grounded-failover-probe.mts
 * Env: GEMINI_API_KEY [GEMINI_API_KEY2] OPENROUTER_API [OPENROUTER_API_KEY]
 *      GROQ_API_KEY NVIDIA_API_KEY
 *      AI_PROVIDER_COOLDOWN_MS (recommended 1800000 — demonstrates the
 *      cooldown skip live) [AI_PROVIDER_COOLDOWN=0 to disable]
 */

import {
  callGeminiGroundedSearch,
  callOpenRouterGroundedSearch,
  callGroqGroundedSearch,
  callGroundedSearch,
  callFreeAIFallbackChain,
  getGeminiGroundedKeys,
  getOpenRouterKeys,
} from "../src/lib/ai-provider";
import {
  activeCooldowns,
  flushCooldownWrites,
} from "../src/lib/ai-provider-cooldown";

const PROBE_PROMPT =
  "What is the current World Health Organization guidance on weekly physical activity for adults? Answer in 2-3 short sentences and ground your answer on the live web sources you find.";

const ARM_OPTS = {
  tag: "failover-probe",
  temperature: 0.3,
  maxTokens: 400,
  timeoutMs: 45_000,
} as const;

function ms(started: number): number {
  return Date.now() - started;
}

function maskKeys(count: number): string {
  return count === 0 ? "none" : `${count} configured`;
}

async function probeArm(
  label: string,
  fn: () => Promise<{ provider: string; model: string; text: string; grounding: { searchQueries: string[]; sources: { url: string; title: string }[] } }>,
): Promise<boolean> {
  const t0 = Date.now();
  try {
    const r = await fn();
    const snippet = r.text.replace(/\s+/g, " ").slice(0, 160);
    console.log(`ARM ${label}: PASS`);
    console.log(`  provider/model : ${r.provider}:${r.model}`);
    console.log(`  latency_ms     : ${ms(t0)}`);
    console.log(`  evidence       : searchQueries=${r.grounding.searchQueries.length} sources=${r.grounding.sources.length}`);
    for (const s of r.grounding.sources.slice(0, 3)) {
      console.log(`    - ${s.url}${s.title ? ` (${s.title.slice(0, 60)})` : ""}`);
    }
    console.log(`  answer_sample  : ${snippet}`);
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`ARM ${label}: FAIL (${ms(t0)}ms)`);
    console.log(`  error          : ${msg.replace(/\s+/g, " ").slice(0, 500)}`);
    return false;
  }
}

async function main(): Promise<void> {
  console.log("=== AI GROUNDED-FAILOVER LIVE PROBE (BLOG-PROVIDER-FAILOVER 2026-10-16) ===");
  console.log(`env: gemini keys=${maskKeys(getGeminiGroundedKeys().length)} · openrouter keys=${maskKeys(getOpenRouterKeys().length)} · groq=${process.env.GROQ_API_KEY ? "configured" : "MISSING"} · nvidia=${process.env.NVIDIA_API_KEY ? "configured" : "MISSING"} · cooldown=${process.env.AI_PROVIDER_COOLDOWN_MS || "off"}`);
  console.log("");

  // ── 1) Per-arm probes (each is a REAL search call) ──────────────────
  console.log("--- [1/4] Per-arm grounded probes ---");
  const geminiOk = await probeArm("gemini googleSearch (ladder)", () =>
    callGeminiGroundedSearch(PROBE_PROMPT, { ...ARM_OPTS, tag: "failover-probe:gemini" }),
  );
  console.log("");
  const orOk = await probeArm("openrouter web plugin", () =>
    callOpenRouterGroundedSearch(PROBE_PROMPT, { ...ARM_OPTS, tag: "failover-probe:openrouter" }),
  );
  console.log("");
  const groqOk = await probeArm("groq compound", () =>
    callGroqGroundedSearch(PROBE_PROMPT, { ...ARM_OPTS, tag: "failover-probe:groq" }),
  );
  console.log("");
  console.log("ARM NVIDIA NIM: EXCLUDED-BY-DESIGN (no web-search tool in its OpenAI-compatible chat API — an ungrounded answer would violate the real-search law; NVIDIA stays a generation-chain provider)");
  console.log("");

  // ── 2) The end-to-end cross-provider failover walk ──────────────────
  console.log("--- [2/4] End-to-end callGroundedSearch (the actual failover) ---");
  let e2eOk = false;
  const t0 = Date.now();
  try {
    const r = await callGroundedSearch(PROBE_PROMPT, {
      ...ARM_OPTS,
      tag: "failover-probe:e2e",
    });
    console.log(`E2E FAILover: PASS — ${r.provider}:${r.model} answered with live-search evidence (${ms(t0)}ms, sources=${r.grounding.sources.length})`);
    console.log(`  answer_sample  : ${r.text.replace(/\s+/g, " ").slice(0, 160)}`);
    e2eOk = true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`E2E FAILover: FAIL (${ms(t0)}ms) — no provider produced a grounded answer`);
    console.log(`  error          : ${msg.replace(/\s+/g, " ").slice(0, 800)}`);
  }
  console.log("");

  // ── 3) The generation chain (P1/P2/P4-class provider failover) ─────
  console.log("--- [3/4] Generation chain (callFreeAIFallbackChain) ---");
  try {
    const t1 = Date.now();
    const r = await callFreeAIFallbackChain("Reply with the single word: PONG", {
      tag: "failover-probe:chain",
      temperature: 0,
      maxTokens: 10,
      timeoutMs: 30_000,
      maxModels: 3,
    });
    console.log(`CHAIN: PASS — ${r.provider}:${r.model} answered (${ms(t1)}ms, sample: ${r.text.replace(/\s+/g, " ").slice(0, 40)})`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`CHAIN: FAIL — ${msg.replace(/\s+/g, " ").slice(0, 600)}`);
  }
  console.log("");

  // ── 4) The cooldown registry state (futile-repeat avoidance) ────────
  console.log("--- [4/4] Active cooldown registry (AI_PROVIDER_COOLDOWN_MS window) ---");
  const cds = activeCooldowns();
  if (cds.length === 0) {
    console.log("COOLDOWNS: none active (no exhaustion-class failures recorded, or the registry is off)");
  } else {
    for (const c of cds) {
      console.log(`  ${c.scope} → until ${new Date(c.until).toISOString()} (${c.reason.slice(0, 100)})`);
    }
  }
  await flushCooldownWrites();

  // ── Summary + honest exit ───────────────────────────────────────────
  console.log("");
  console.log("=== PROBE SUMMARY ===");
  console.log(`arm gemini      : ${geminiOk ? "PASS" : "FAIL"}`);
  console.log(`arm openrouter  : ${orOk ? "PASS" : "FAIL"}`);
  console.log(`arm groq        : ${groqOk ? "PASS" : "FAIL"}`);
  console.log(`arm nvidia      : EXCLUDED-BY-DESIGN (no grounded-search capability)`);
  console.log(`e2e failover    : ${e2eOk ? "PASS (some provider returned a REAL grounded answer)" : "FAIL (no grounded answer from any arm)"}`);
  console.log(`cooldowns active: ${cds.length}`);
  if (!e2eOk) {
    console.log("PROBE VERDICT: RED — the cross-provider failover produced no working real-search path (see arm errors above; per-arm states are measurements, the e2e walk is the verdict).");
    process.exit(1);
  }
  console.log("PROBE VERDICT: GREEN — the failover works: a provider answered with live-search evidence.");
}

main().catch((e: unknown) => {
  console.error("[probe] crashed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
