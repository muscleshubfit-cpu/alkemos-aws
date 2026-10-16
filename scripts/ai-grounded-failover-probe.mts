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
  getOpenRouterGroundedModel,
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
  // 90s per arm: the OpenRouter web arm rides a reasoning model whose
  // chain-measured CoT is 30–90s before content+annotations (Phase 177).
  timeoutMs: 90_000,
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

/** SELF-DIAGNOSIS (2026-10-16 live round): the OpenRouter web-plugin
 *  answer shape drifts by model (reasoning models answer in reasoning*
 *  fields; annotations may sit at message or root). On an arm failure the
 *  probe dumps the STRUCTURE (keys + lengths only — never user-facing
 *  text or secrets) so the extractor can be fixed against measured truth. */
async function diagnoseOrWebShape(): Promise<void> {
  const keys = getOpenRouterKeys();
  if (keys.length === 0) return;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keys[0]}`,
        "HTTP-Referer": "https://alkemos.com",
        "X-Title": "Alkemos Failover Probe",
      },
      body: JSON.stringify({
        model: getOpenRouterGroundedModel(),
        messages: [
          { role: "user", content: "What is the WHO weekly physical activity guidance for adults? One sentence." },
        ],
        plugins: [{ id: "web", max_results: 5 }],
      }),
    });
    const bodyText = await res.text();
    let structure = "";
    try {
      const j = JSON.parse(bodyText) as Record<string, unknown>;
      const choice = (j.choices as Array<Record<string, unknown>> | undefined)?.[0];
      const message = choice?.message as Record<string, unknown> | undefined;
      const contentLen = typeof message?.content === "string" ? message.content.length : -1;
      const reasoningLen = typeof message?.reasoning === "string" ? (message.reasoning as string).length : -1;
      const rd = Array.isArray(message?.reasoning_details) ? (message.reasoning_details as unknown[]).length : 0;
      const ann = Array.isArray(message?.annotations) ? (message.annotations as unknown[]).length : -1;
      const rootAnn = Array.isArray(j.annotations) ? (j.annotations as unknown[]).length : -1;
      structure =
        `status=${res.status} root_keys=${Object.keys(j).join(",")}` +
        ` message_keys=${message ? Object.keys(message).join(",") : "-"}` +
        ` content_len=${contentLen} reasoning_len=${reasoningLen} reasoning_details=${rd}` +
        ` message_annotations=${ann} root_annotations=${rootAnn}` +
        ` usage=${JSON.stringify(j.usage ?? null).slice(0, 220)}`;
    } catch {
      structure = `status=${res.status} body[:400]=${bodyText.slice(0, 400)}`;
    }
    console.log(`DIAG openrouter web-plugin response shape: ${structure}`);
  } catch (e) {
    console.log(`DIAG openrouter shape probe failed: ${e instanceof Error ? e.message : e}`);
  }
}

/** SELF-DIAGNOSIS (2026-10-16 live round): list the Groq account's LIVE
 *  model ids (public catalog identifiers — not secrets) so a compound-
 *  model 404 can be settled by measurement, never by guessing. */
async function diagnoseGroqModels(): Promise<void> {
  const key = process.env.GROQ_API_KEY || "";
  if (!key) return;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = (await res.json()) as { data?: Array<{ id?: string }> };
    const ids = (data.data || []).map((m) => String(m.id || "")).filter(Boolean);
    console.log(`DIAG groq models: status=${res.status} total=${ids.length}`);
    const searchCapable = ids.filter((id) => /compound|search/i.test(id));
    console.log(`DIAG groq compound/search-capable ids: ${searchCapable.join(" · ") || "NONE"}`);
    console.log(`DIAG groq all ids: ${ids.slice(0, 50).join(" · ")}`);
  } catch (e) {
    console.log(`DIAG groq models listing failed: ${e instanceof Error ? e.message : e}`);
  }
  // Settle the SECOND search path by measurement: Groq's agentic web_search
  // tool on a regular model (gpt-oss-120b) — accepted? citations returned?
  // (structure only; never user-facing text, never secrets)
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "user", content: "What is the WHO weekly physical activity guidance for adults? One sentence." },
        ],
        tools: [{ type: "web_search" }],
        max_tokens: 400,
      }),
    });
    const bodyText = await res.text();
    let shape = "";
    try {
      const j = JSON.parse(bodyText) as Record<string, unknown>;
      const msg = ((j.choices as Array<Record<string, unknown>> | undefined)?.[0]?.message) as Record<string, unknown> | undefined;
      const cit = Array.isArray(msg?.citations) ? (msg.citations as unknown[]).length : Array.isArray((j as Record<string, unknown>).citations) ? ((j as Record<string, unknown>).citations as unknown[]).length : -1;
      const xg = (j as { x_groq?: { citations?: unknown[] } }).x_groq;
      shape = `status=${res.status} message_keys=${msg ? Object.keys(msg).join(",") : "-"} content_len=${typeof msg?.content === "string" ? msg.content.length : -1} message_citations=${cit} x_groq_citations=${Array.isArray(xg?.citations) ? xg.citations.length : -1}`;
    } catch {
      shape = `status=${res.status} body[:300]=${bodyText.slice(0, 300)}`;
    }
    console.log(`DIAG groq web_search-tool (gpt-oss-120b) shape: ${shape}`);
  } catch (e) {
    console.log(`DIAG groq web_search tool probe failed: ${e instanceof Error ? e.message : e}`);
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
  // ── 1b) SELF-DIAGNOSIS on arm failures (permanent instrument value:
  // live shapes/ids drift — the probe NAMES them instead of guessing)
  if (!orOk) await diagnoseOrWebShape();
  if (!groqOk) await diagnoseGroqModels();
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
