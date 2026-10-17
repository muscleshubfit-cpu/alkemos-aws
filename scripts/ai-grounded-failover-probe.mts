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
 *      gemini googleSearch ladder · openrouter web plugin · groq
 *      browser_search (GROQ-2: the compound-successor tool).
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

/** SELF-DIAGNOSIS (2026-10-16 live rounds 4-5): the bare web-plugin call
 *  succeeds (content + 5 URL annotations + cost) while the ARM call (same
 *  model, same key, same plugin) returns content WITHOUT annotations — the
 *  only systematic deltas are temperature and max_tokens. This diagnosis
 *  isolates them ONE AT A TIME plus the documented :online suffix route,
 *  dumping the annotation entries themselves (public URLs — safe) so the
 *  arm's mechanism is chosen by MEASUREMENT, never by guessing. */
async function diagnoseOrWebShape(): Promise<void> {
  const keys = getOpenRouterKeys();
  if (keys.length === 0) return;
  const model = getOpenRouterGroundedModel();
  const ask = "What is the WHO weekly physical activity guidance for adults? One sentence.";
  const variants: Array<{ label: string; extra: Record<string, unknown>; model?: string }> = [
    { label: "bare (no temp, no max_tokens)", extra: {} },
    { label: "max_tokens 6000 only", extra: { max_tokens: 6000 } },
    { label: "temperature 0.3 only", extra: { temperature: 0.3 } },
    { label: "arm-exact (temp 0.3 + max_tokens 6000 + plugin)", extra: { temperature: 0.3, max_tokens: 6000 } },
    { label: "online-suffix (model+\":online\", no plugins field)", extra: {}, model: model + ":online" },
  ];
  for (const v of variants) {
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
          model: v.model ?? model,
          messages: [{ role: "user", content: ask }],
          ...(Object.keys(v.extra).length > 0 || !v.model ? { plugins: [{ id: "web", max_results: 5 }] } : {}),
          ...v.extra,
        }),
      });
      const bodyText = await res.text();
      let report = "";
      try {
        const j = JSON.parse(bodyText) as Record<string, any>;
        const msg = j.choices?.[0]?.message ?? {};
        const anns = Array.isArray(msg.annotations) ? msg.annotations : [];
        const annPreview = anns
          .slice(0, 2)
          .map((a: Record<string, unknown>) => {
            const nested = (a.url_citation ?? a.citation) as Record<string, unknown> | null;
            const url = typeof a.url === "string" ? a.url : typeof nested?.url === "string" ? nested.url : "NO-URL";
            return `${String(a.type)}:${String(url).slice(0, 60)}`;
          })
          .join(" | ");
        report =
          `status=${res.status} provider=${String(j.provider ?? "-")} finish=${String(j.choices?.[0]?.finish_reason ?? "-")} ` +
          `content_len=${typeof msg.content === "string" ? msg.content.length : -1} ` +
          `ann_count=${anns.length} ann[0..1]=${annPreview || "-"} ` +
          `content_sample=${typeof msg.content === "string" ? msg.content.replace(/\s+/g, " ").slice(0, 110) : "-"}`;
        if (j.error) report = `status=${res.status} error=${JSON.stringify(j.error).slice(0, 250)}`;
      } catch {
        report = `status=${res.status} body[:300]=${bodyText.slice(0, 300)}`;
      }
      console.log(`DIAG or-web [${v.label}]: ${report}`);
    } catch (e) {
      console.log(`DIAG or-web [${v.label}] fetch failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}

/** SELF-DIAGNOSIS (2026-10-16 live round): list the Groq account's LIVE
 *  model ids (public catalog identifiers — not secrets) so a compound-
 *  model 404 can be settled by measurement, never by guessing. GROQ-2
 *  (2026-10-17): the compound system is gone (decommissioned 2026-09-21)
 *  — the diagnosis now settles the browser_search tool shape instead,
 *  with the ERROR BODY printed on non-200 (the round-1 400 was invisible). */
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
    const searchCapable = ids.filter((id) => /compound|search|gpt-oss|qwen|allam/i.test(id));
    console.log(`DIAG groq browser_search-capable candidate ids: ${searchCapable.join(" · ") || "NONE"}`);
    console.log(`DIAG groq all ids: ${ids.slice(0, 50).join(" · ")}`);
  } catch (e) {
    console.log(`DIAG groq models listing failed: ${e instanceof Error ? e.message : e}`);
  }
  // Settle the tool shapes by measurement — three variants, ERROR BODIES
  // printed (public API messages — safe): the round-1 400 on web_search
  // taught us the tool name must be the DOCUMENTED one, measured not guessed.
  const ask = "What is the WHO weekly physical activity guidance for adults? One sentence.";
  const variants: Array<{ label: string; extra: Record<string, unknown> }> = [
    { label: "arm-exact (tools browser_search + reasoning_format hidden + temp + max_tokens 4096)", extra: { tools: [{ type: "browser_search" }], reasoning_format: "hidden", temperature: 0.7, max_tokens: 4096 } },
    { label: "bare tools browser_search (no reasoning_format)", extra: { tools: [{ type: "browser_search" }] } },
    { label: "tools browser_search + tool_choice required", extra: { tools: [{ type: "browser_search" }], reasoning_format: "hidden", tool_choice: "required", max_tokens: 4096 } },
  ];
  for (const v of variants) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: ask }],
          ...v.extra,
        }),
      });
      const bodyText = await res.text();
      let shape = "";
      try {
        const j = JSON.parse(bodyText) as Record<string, unknown>;
        if (res.status !== 200) {
          shape = `status=${res.status} error_body=${bodyText.slice(0, 300)}`;
        } else {
          const msg = ((j.choices as Array<Record<string, unknown>> | undefined)?.[0]?.message) as Record<string, unknown> | undefined;
          const cit = Array.isArray(msg?.citations) ? (msg.citations as unknown[]).length : -1;
          const ann = Array.isArray(msg?.annotations) ? (msg.annotations as unknown[]).length : -1;
          const rootCit = Array.isArray(j.citations) ? (j.citations as unknown[]).length : -1;
          const xg = (j as { x_groq?: { citations?: unknown[] } }).x_groq;
          const xgCit = Array.isArray(xg?.citations) ? xg.citations.length : -1;
          shape = `status=200 message_keys=${msg ? Object.keys(msg).join(",") : "-"} content_len=${typeof msg?.content === "string" ? msg.content.length : -1} message_citations=${cit} message_annotations=${ann} root_citations=${rootCit} x_groq_citations=${xgCit}`;
        }
      } catch {
        shape = `status=${res.status} body[:300]=${bodyText.slice(0, 300)}`;
      }
      console.log(`DIAG groq browser_search [${v.label}]: ${shape}`);
    } catch (e) {
      console.log(`DIAG groq browser_search [${v.label}] fetch failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}

async function main(): Promise<void> {
  console.log("=== AI GROUNDED-FAILOVER LIVE PROBE (BLOG-PROVIDER-FAILOVER 2026-10-16 · GROQ-2 round 2026-10-17) ===");
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
  const groqOk = await probeArm("groq browser_search", () =>
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
