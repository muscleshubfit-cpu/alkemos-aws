/**
 * scripts/ai-grounded-failover-probe.mts — LIVE provider-failover probe
 * (BLOG-PROVIDER-FAILOVER 2026-10-16, owner order «اختبر التبديل الفعلي»;
 * PHASE 5-A 2026-10-31 — the Tavily search arm joins the probe;
 * PHASE 5-B 2026-10-31 — the Exa search arm joins + the language-split
 * ladders are BOTH walked live + the §13-6 includeDomains complementary
 * measurement).
 *
 * Dispatch-only measuring instrument (grounded-failover-test.yml) — the
 * same discipline as aws-ai-test/gsc-connection-test: REAL calls against
 * the REAL provider keys, printing ONLY provider/model names, durations,
 * HTTP statuses, evidence counts and short text snippets. No secret
 * values, no personal data, NO code changes, NO deploy.
 *
 * WHAT IT MEASURES (in order):
 *   1. Each grounded-search arm SEPARATELY with a tiny real prompt —
 *      exa search API (+ /contents full-text deepening + chain synthesis)
 *      · tavily search API (+ chain synthesis) · groq browser_search
 *      (GROQ-2: the compound-successor tool) · gemini googleSearch ladder
 *      (dormant — 0/114 measured). Per arm: PASS/FAIL, model, HTTP status
 *      class, live-evidence counts (searchQueries/sources/fullText pages),
 *      latency, and the failure message when red. The openrouter web arm
 *      is probed for DIAGNOSTICS ONLY (it was removed from the effective
 *      ladder — dead default model 404 + paid plugin 402, P0-2) and a
 *      402/404 there is an expected measurement, never a verdict input.
 *      (NVIDIA is NOT probed for grounding: its OpenAI-compatible chat API
 *      has no web-search tool — excluded by design, documented honestly.)
 *   1b. The Phase-4 §13-6 complementary measurement (cheap, ~$0.004):
 *      ONE Exa search restricted to authority domains (includeDomains) —
 *      prints the result domains + the honored share for human inspection.
 *   2. The CROSS-PROVIDER end-to-end walk callGroundedSearch() — TWICE,
 *      once per §6-أ language ladder (EN: exa → tavily → groq → gemini
 *      dormant · AR: tavily → groq → exa(EN-equivalent query) → gemini
 *      dormant). With the cooldown registry ON, arms that failed with
 *      quota-class errors in step 1 are SKIPPED here (the "avoid futile
 *      repeats" law, demonstrated live).
 *   3. The generation chain callFreeAIFallbackChain() — provider failover
 *      for P1/P2/P4-class calls (post-5-A: the 3-way rotation leads;
 *      gemini rides the TAIL slot).
 *   4. The active cooldown registry state (secret-free scopes only).
 *
 * QUALITY LAW (owner decision #7, Phase 5-A 2026-10-31): connection success
 * is NOT evidence of research quality — the probe therefore prints the
 * SOURCE URLS and an answer sample for human/owner inspection, and the
 * per-arm evidence counts (sources/searchQueries) are the quality-visible
 * part of the verdict.
 *
 * EXIT LAW (honest): exit 0 iff EVERY end-to-end walk returned a REAL
 * grounded answer from SOME provider (both §6-أ ladders work — the
 * language split is production behavior). Per-arm failures are
 * MEASUREMENTS (printed, never fatal); an end-to-end failure is red —
 * that is exactly "the failover did not produce a working search path".
 *
 * Usage (GitHub Actions runner, secrets in env):
 *   npx --no-install tsx scripts/ai-grounded-failover-probe.mts
 * Env: EXA_API_KEY TAVILY_API_KEY GEMINI_API_KEY [GEMINI_API_KEY2]
 *      OPENROUTER_API [OPENROUTER_API_KEY] GROQ_API_KEY NVIDIA_API_KEY
 *      AI_PROVIDER_COOLDOWN_MS (recommended 1800000 — demonstrates the
 *      cooldown skip live) [AI_PROVIDER_COOLDOWN=0 to disable]
 */

import {
  callGeminiGroundedSearch,
  callOpenRouterGroundedSearch,
  callGroqGroundedSearch,
  callTavilySearch,
  callExaSearch,
  callGroundedSearch,
  callFreeAIFallbackChain,
  getGeminiGroundedKeys,
  getOpenRouterKeys,
  getOpenRouterGroundedModel,
  getTavilyKey,
  getExaKey,
} from "../src/lib/ai-provider";
import {
  activeCooldowns,
  flushCooldownWrites,
} from "../src/lib/ai-provider-cooldown";

const PROBE_PROMPT =
  "What is the current World Health Organization guidance on weekly physical activity for adults? Answer in 2-3 short sentences and ground your answer on the live web sources you find.";

/** The concise REAL search query for the search-API arms (§10-أ — the
 * research prompt itself is a generation brief, not a search string). */
const PROBE_SEARCH_QUERY =
  "current WHO guidance weekly physical activity adults";

/** The ARABIC twin for the §6-أ AR-ladder walk (Phase 5-B: both language
 * ladders are measured live — production runs them split by language). */
const PROBE_PROMPT_AR =
  "ما إرشادات منظمة الصحة العالمية الحالية للنشاط البدني الأسبوعي للبالغين؟ أجب في جملتين قصيرتين مستندًا إلى مصادر الويب الحية التي تجدها.";
const PROBE_SEARCH_QUERY_AR =
  "إرشادات منظمة الصحة العالمية للنشاط البدني الأسبوعي للبالغين";

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
  fn: () => Promise<{ provider: string; model: string; text: string; researchDepth?: string; fullText?: { url: string; text: string }[]; grounding: { searchQueries: string[]; sources: { url: string; title: string }[] } }>,
): Promise<boolean> {
  const t0 = Date.now();
  try {
    const r = await fn();
    const snippet = r.text.replace(/\s+/g, " ").slice(0, 160);
    console.log(`ARM ${label}: PASS`);
    console.log(`  provider/model : ${r.provider}:${r.model}`);
    console.log(`  latency_ms     : ${ms(t0)}`);
    console.log(`  evidence       : searchQueries=${r.grounding.searchQueries.length} sources=${r.grounding.sources.length}${r.researchDepth ? ` researchDepth=${r.researchDepth}` : ""}${r.fullText ? ` fullTextPages=${r.fullText.length} fullTextChars=${r.fullText.reduce((n, p) => n + p.text.length, 0)}` : ""}`);
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

/** PHASE 5-B — the Phase-4 §13-6 complementary measurement (cheap ~$0.004):
 *  ONE REAL Exa search with includeDomains restricted to a few of the 14
 *  authority domains, printing every result domain + the honored share —
 *  Exa's includeDomains behavior was never measured (Phase 3 tested
 *  Tavily's only) and the Phase-4 plan requires it before the EN arm
 *  merges. Public data only; a FAIL is a measurement, never fatal. */
async function probeExaIncludeDomains(): Promise<void> {
  const key = getExaKey();
  if (!key) {
    console.log("EXA includeDomains probe: SKIPPED — no EXA_API_KEY");
    return;
  }
  const authority = ["nih.gov", "who.int", "mayoclinic.org"];
  const t0 = Date.now();
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        query: PROBE_SEARCH_QUERY,
        numResults: 5,
        type: "auto",
        includeDomains: authority,
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) {
      console.log(`EXA includeDomains probe: FAIL — HTTP ${res.status}: ${bodyText.slice(0, 200)}`);
      return;
    }
    const j = JSON.parse(bodyText) as { results?: Array<{ url?: string; title?: string }> };
    const results = j.results ?? [];
    const domains = results.map((r) => {
      try {
        return r.url ? new URL(r.url).hostname.replace(/^www\./, "") : "(no-url)";
      } catch {
        return "(bad-url)";
      }
    });
    const honored = domains.filter((d) => authority.some((a) => d === a || d.endsWith(`.${a}`))).length;
    console.log(`EXA includeDomains probe: ${res.status} — ${results.length} results in ${ms(t0)}ms`);
    console.log(`  restricted to : ${authority.join(", ")}`);
    console.log(`  result domains: ${domains.join(" · ") || "NONE"}`);
    console.log(`  honored share : ${honored}/${results.length}${results.length > 0 ? ` (${Math.round((100 * honored) / results.length)}%)` : ""}`);
  } catch (e) {
    console.log(`EXA includeDomains probe: FAIL — ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
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

/** GROQ-2 round-2 instrument: dump the FULL response shape of the
 *  browser_search call BEFORE the arms consume the 8k TPM window — walks
 *  the JSON recursively and prints every array (path + length) and every
 *  string field whose name or value smells like a URL (public data — safe).
 *  On a 429-TPM answer: one patient retry after 65s (the window clears). */
async function dumpGroqBrowserResponse(): Promise<void> {
  const key = process.env.GROQ_API_KEY || "";
  if (!key) return;
  const ask = "What is the WHO weekly physical activity guidance for adults? One sentence, with sources.";
  const attempt = async (extra: Record<string, unknown>, model: string): Promise<{ status: number; text: string } | null> => {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: ask }], ...extra }),
      });
      const text = await res.text();
      return { status: res.status, text };
    } catch (e) {
      console.log(`DUMP groq [${model}] fetch failed: ${e instanceof Error ? e.message : e}`);
      return null;
    }
  };
  const walk = (node: unknown, path: string, out: string[]): void => {
    if (Array.isArray(node)) {
      out.push(`${path}: array(${node.length})${node.length > 0 ? ` first=${JSON.stringify(node[0]).slice(0, 160)}` : ""}`);
      node.slice(0, 3).forEach((el, i) => walk(el, `${path}[${i}]`, out));
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (typeof v === "string") {
          const smellsUrl = /https?:\/\//.test(v) || /url|link|citation|source/i.test(k);
          if (smellsUrl) out.push(`${path}.${k}: ${JSON.stringify(v.slice(0, 120))}`);
        } else {
          walk(v, `${path}.${k}`, out);
        }
      }
    }
  };
  const variants: Array<{ label: string; model: string; extra: Record<string, unknown> }> = [
    { label: "arm-exact 120b", model: "openai/gpt-oss-120b", extra: { tools: [{ type: "browser_search" }], reasoning_format: "hidden", temperature: 0.3, max_tokens: 4096 } },
    { label: "tool_choice-required 120b", model: "openai/gpt-oss-120b", extra: { tools: [{ type: "browser_search" }], reasoning_format: "hidden", tool_choice: "required", temperature: 0.3, max_tokens: 4096 } },
    { label: "reasoning-parsed 20b", model: "openai/gpt-oss-20b", extra: { tools: [{ type: "browser_search" }], reasoning_format: "parsed", temperature: 0.3, max_tokens: 4096 } },
    // BLOG-RECOVERY-2 (2026-10-20 round 2): the live TPD state measured the
    // gpt-oss buckets drained to the edge (120b 200,000/200,000 — the day's
    // failed runs + probes consumed the whole 200k rolling window) while the
    // account's live model list holds THREE more browser_search candidates
    // with INDEPENDENT per-model TPD buckets. Live-measure them the same
    // way (never by name): qwen3.8-27b (a live generation-chain entry, good
    // Arabic) · allam-2-7b (Arabic-specialized) · gpt-oss-safeguard-20b.
    { label: "browser_search qwen3.8-27b (separate TPD bucket)", model: "qwen/qwen3.8-27b", extra: { tools: [{ type: "browser_search" }], temperature: 0.3, max_tokens: 4096 } },
    { label: "browser_search allam-2-7b (Arabic specialist, separate TPD bucket)", model: "allam-2-7b", extra: { tools: [{ type: "browser_search" }], temperature: 0.3, max_tokens: 4096 } },
    // BLOG-RECOVERY-2 round-3: safeguard-20b ACCEPTED the browser_search
    // tool (the 400 was «Parsing failed» under reasoning_format hidden —
    // the exact measured 20b/120b split whose remedy is the flip to
    // "parsed"). Measure the flipped shape + the required-variant: if it
    // answers with REAL executed_tools evidence it is a THIRD gpt-oss TPD
    // bucket (fresh — the safeguard id is used by nothing else).
    { label: "browser_search safeguard-20b reasoning-parsed (fresh TPD bucket)", model: "openai/gpt-oss-safeguard-20b", extra: { tools: [{ type: "browser_search" }], reasoning_format: "parsed", temperature: 0.3, max_tokens: 4096 } },
    { label: "browser_search safeguard-20b parsed+tool_choice-required (fresh TPD bucket)", model: "openai/gpt-oss-safeguard-20b", extra: { tools: [{ type: "browser_search" }], reasoning_format: "parsed", tool_choice: "required", temperature: 0.3, max_tokens: 4096 } },
  ];
  for (const v of variants) {
    let r = await attempt(v.extra, v.model);
    if (r && r.status === 429 && /TPM|tokens per minute/i.test(r.text)) {
      console.log(`DUMP groq [${v.label}] hit TPM 429 — waiting 65s for the window to clear, then ONE retry`);
      await new Promise((res) => setTimeout(res, 65_000));
      r = await attempt(v.extra, v.model);
    }
    if (!r) continue;
    if (r.status !== 200) {
      console.log(`DUMP groq [${v.label}]: status=${r.status} error_body=${r.text.slice(0, 300)}`);
      continue;
    }
    try {
      const j = JSON.parse(r.text);
      const lines: string[] = [];
      walk(j, "root", lines);
      console.log(`DUMP groq [${v.label}]: status=200 STRUCTURE:`);
      for (const l of lines.slice(0, 40)) console.log(`  ${l}`);
      const content = j?.choices?.[0]?.message?.content;
      console.log(`  content_sample: ${typeof content === "string" ? content.replace(/\s+/g, " ").slice(0, 200) : "-"}`);
    } catch {
      console.log(`DUMP groq [${v.label}]: status=200 body[:400]=${r.text.slice(0, 400)}`);
    }
  }
}

async function main(): Promise<void> {
  console.log("=== AI GROUNDED-FAILOVER LIVE PROBE (BLOG-PROVIDER-FAILOVER 2026-10-16 · GROQ-2 2026-10-17 · PHASE 5-A TAVILY 2026-10-31 · PHASE 5-B EXA 2026-10-31) ===");
  console.log(`env: exa=${getExaKey() ? "configured" : "MISSING"} · tavily=${getTavilyKey() ? "configured" : "MISSING"} · gemini keys=${maskKeys(getGeminiGroundedKeys().length)} · openrouter keys=${maskKeys(getOpenRouterKeys().length)} · groq=${process.env.GROQ_API_KEY ? "configured" : "MISSING"} · nvidia=${process.env.NVIDIA_API_KEY ? "configured" : "MISSING"} · cooldown=${process.env.AI_PROVIDER_COOLDOWN_MS || "off"}`);
  console.log("");

  // ── 0) GROQ-2 response-shape dump FIRST (TPM window still fresh) ────
  console.log("--- [0/4] Groq browser_search response-shape dump (GROQ-2) ---");
  await dumpGroqBrowserResponse();
  console.log("");

  // ── 1) Per-arm probes (each is a REAL search call) ──────────────────
  console.log("--- [1/4] Per-arm grounded probes (the EN-ladder order: exa → tavily → groq → gemini) ---");
  // PHASE 5-B: the exa search arm leads the probe exactly as it leads the
  // production §6-أ EN ladder (search → optional /contents deepening →
  // chain synthesis). Exa key absent → an honest SKIPPED line (never a
  // crash) — the e2e walks below report the same gap.
  let exaOk = false;
  if (getExaKey()) {
    exaOk = await probeArm("exa search API (+ /contents deepening + chain synthesis)", () =>
      callExaSearch(PROBE_PROMPT, {
        ...ARM_OPTS,
        tag: "failover-probe:exa",
        lang: "en",
        searchQuery: PROBE_SEARCH_QUERY,
      }),
    );
  } else {
    console.log("ARM exa search API: SKIPPED — no EXA_API_KEY (honest config gap)");
  }
  console.log("");
  // PHASE 5-A: the tavily search arm (the AR-ladder leader; EN arm #2).
  let tavilyOk = false;
  if (getTavilyKey()) {
    tavilyOk = await probeArm("tavily search API (+ chain synthesis)", () =>
      callTavilySearch(PROBE_PROMPT, {
        ...ARM_OPTS,
        tag: "failover-probe:tavily",
        searchQuery: PROBE_SEARCH_QUERY,
      }),
    );
  } else {
    console.log("ARM tavily search API: SKIPPED — no TAVILY_API_KEY (honest config gap)");
  }
  console.log("");
  const groqOk = await probeArm("groq browser_search", () =>
    callGroqGroundedSearch(PROBE_PROMPT, { ...ARM_OPTS, tag: "failover-probe:groq" }),
  );
  console.log("");
  const geminiOk = await probeArm("gemini googleSearch (ladder — dormant arm)", () =>
    callGeminiGroundedSearch(PROBE_PROMPT, { ...ARM_OPTS, tag: "failover-probe:gemini" }),
  );
  console.log("");
  // DIAGNOSTICS-ONLY since PHASE 5-A (the OR web arm was REMOVED from the
  // effective ladder — P0-2: dead default model 404 + paid plugin 402). A
  // 402/404 here is an EXPECTED measurement, never a verdict input.
  const orOk = await probeArm("openrouter web plugin (OFF-LADDER diagnostics)", () =>
    callOpenRouterGroundedSearch(PROBE_PROMPT, { ...ARM_OPTS, tag: "failover-probe:openrouter" }),
  );
  console.log("");
  console.log("ARM NVIDIA NIM: EXCLUDED-BY-DESIGN (no web-search tool in its OpenAI-compatible chat API — an ungrounded answer would violate the real-search law; NVIDIA stays a generation-chain provider)");
  console.log("");
  // ── 1b) The Phase-4 §13-6 complementary measurement (Exa includeDomains)
  console.log("--- [1b/4] Exa includeDomains complementary probe (§13-6, ~$0.004) ---");
  await probeExaIncludeDomains();
  console.log("");
  // ── 1c) SELF-DIAGNOSIS on arm failures (permanent instrument value:
  // live shapes/ids drift — the probe NAMES them instead of guessing)
  if (!orOk) await diagnoseOrWebShape();
  if (!groqOk) await diagnoseGroqModels();
  console.log("");


  // ── 2) The end-to-end cross-provider failover walks (BOTH §6-أ ladders)
  console.log("--- [2/4] End-to-end callGroundedSearch ×2 (the §6-أ language split: EN exa→tavily→groq→gemini · AR tavily→groq→exa(EN query)→gemini) ---");
  let e2eEnOk = false;
  const t0 = Date.now();
  try {
    const r = await callGroundedSearch(PROBE_PROMPT, {
      ...ARM_OPTS,
      tag: "failover-probe:e2e-en",
      lang: "en",
      searchQuery: PROBE_SEARCH_QUERY,
    });
    console.log(`E2E EN FAILover: PASS — ${r.provider}:${r.model} answered with live-search evidence (${ms(t0)}ms, sources=${r.grounding.sources.length}${r.researchDepth ? `, depth=${r.researchDepth}` : ""})`);
    console.log(`  answer_sample  : ${r.text.replace(/\s+/g, " ").slice(0, 160)}`);
    e2eEnOk = true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`E2E EN FAILover: FAIL (${ms(t0)}ms) — no provider produced a grounded answer on the EN ladder`);
    console.log(`  error          : ${msg.replace(/\s+/g, " ").slice(0, 800)}`);
  }
  console.log("");
  let e2eArOk = false;
  const t1 = Date.now();
  try {
    const r = await callGroundedSearch(PROBE_PROMPT_AR, {
      ...ARM_OPTS,
      tag: "failover-probe:e2e-ar",
      lang: "ar",
      searchQuery: PROBE_SEARCH_QUERY_AR,
      searchQueryEn: PROBE_SEARCH_QUERY,
    });
    console.log(`E2E AR FAILover: PASS — ${r.provider}:${r.model} answered with live-search evidence (${ms(t1)}ms, sources=${r.grounding.sources.length}${r.researchDepth ? `, depth=${r.researchDepth}` : ""})`);
    console.log(`  answer_sample  : ${r.text.replace(/\s+/g, " ").slice(0, 160)}`);
    e2eArOk = true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`E2E AR FAILover: FAIL (${ms(t1)}ms) — no provider produced a grounded answer on the AR ladder`);
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
  console.log(`arm exa        : ${exaOk ? "PASS" : getExaKey() ? "FAIL" : "SKIPPED-no-key"}`);
  console.log(`arm tavily     : ${tavilyOk ? "PASS" : getTavilyKey() ? "FAIL" : "SKIPPED-no-key"}`);
  console.log(`arm groq       : ${groqOk ? "PASS" : "FAIL"}`);
  console.log(`arm gemini     : ${geminiOk ? "PASS" : "FAIL (dormant arm — expected red while the free tier has no grounding)"}`);
  console.log(`arm openrouter : ${orOk ? "PASS (off-ladder diagnostics)" : "FAIL (off-ladder diagnostics — expected: dead default model + paid plugin)"}`);
  console.log(`arm nvidia     : EXCLUDED-BY-DESIGN (no grounded-search capability)`);
  console.log(`e2e EN ladder  : ${e2eEnOk ? "PASS (some provider returned a REAL grounded answer on exa→tavily→groq→gemini)" : "FAIL (no grounded answer from any arm on the EN ladder)"}`);
  console.log(`e2e AR ladder  : ${e2eArOk ? "PASS (some provider returned a REAL grounded answer on tavily→groq→exa→gemini)" : "FAIL (no grounded answer from any arm on the AR ladder)"}`);
  console.log(`cooldowns active: ${cds.length}`);
  if (!e2eEnOk || !e2eArOk) {
    console.log(`PROBE VERDICT: RED — ${!e2eEnOk ? "the EN ladder" : ""}${!e2eEnOk && !e2eArOk ? " and " : ""}${!e2eArOk ? "the AR ladder" : ""} produced no working real-search path (see arm errors above; per-arm states are measurements, the e2e walks are the verdict).`);
    process.exit(1);
  }
  console.log("PROBE VERDICT: GREEN — the failover works on BOTH §6-أ language ladders: a provider answered with live-search evidence on each walk.");
}

main().catch((e: unknown) => {
  console.error("[probe] crashed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
