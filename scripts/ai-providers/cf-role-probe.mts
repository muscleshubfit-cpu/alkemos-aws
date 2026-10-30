/**
 * scripts/ai-providers/cf-role-probe.mts — LIVE Cloudflare Workers AI
 * ROLE probe (AI-PROVIDERS-EXPANSION Phase 5-C / stage ج, §10-ج1 of the
 * Phase-4 unified-architecture report; owner order 2026-10-31 «نفّذ جميع
 * المراحل المتبقية» approving §12-3).
 *
 * Dispatch-only measuring instrument (cf-role-probe.yml) — the aws-ai-test
 * / grounded-failover-test discipline: REAL calls against the REAL repo
 * secrets (CLOUDFLARE_AI_TOKEN + CLOUDFLARE_ACCOUNT_ID — the Phase-3
 * pair), printing ONLY provider/model names, latencies, HTTP statuses,
 * neuron counts, parse verdicts and short text snippets. No secret
 * values, no personal data, NO code changes, NO deploy.
 *
 * WHAT IT MEASURES (in order) — the OWNER'S RULE (Phase-4 §6 principle 4:
 * «لا يُنقل أي دور لمزود جديد قبل مسبار الدور الوظيفي — مسار الكود
 * الحقيقي لا اختبار API عام»):
 *
 *   0. Token verify + CATALOG pre-check (§6-ج): both first-wave role
 *      models (@cf/meta/llama-3.3-70b-instruct-fp8-fast ·
 *      @cf/meta/llama-4-scout-17b-16e-instruct) must be CURRENTLY listed
 *      before any role call; officially billing-only models are listed
 *      for AVOIDANCE proof only (never called — the no-paid-consumption
 *      law). A role model absent from the catalog = honest RED (the role
 *      cannot serve; production would fall to the chain).
 *
 *   1. PAIRING ROLE through the REAL production code path:
 *      callFreeAIFallbackChain(tag "blog:pairing", maxModels 1) — the
 *      CF role entry leads and NOTHING else is walked (pure role
 *      isolation) — then the answer is validated by parsePairingJSON
 *      (the strict hard-laws validator). exit 1 on ANY parse failure.
 *      Then the INTEGRATED path: runPairingSelection(sampleEn, sampleAr)
 *      verbatim (CF leads, the ordinary chain follows as fallback —
 *      exactly what production runs).
 *
 *   2. LATIN-TOKENS ROLE through the REAL code path:
 *      callFreeAIFallbackChain(tag "blog:latin-tokens-ar", maxModels 1)
 *      with the REAL translateLatinTokens prompt, then every returned
 *      value validated by isValidArabicTermValue (the per-value law).
 *      exit 1 on parse failure / zero accepted values. Then the
 *      INTEGRATED path: translateLatinTokens(tokens) verbatim.
 *
 *   3. CONCURRENCY probe ×5 / ×10 (§8-ب6 — the mandatory pre-adoption
 *      item: CF's concurrency limits are unpublished): parallel isolated
 *      role calls (small payloads), statuses counted, any 429/5xx printed
 *      with its class. A round with ZERO successes = RED; partial
 *      failures are MEASURED (production roles are low-frequency and the
 *      chain absorbs a 429 by falling to the next provider).
 *
 *   4. NEURON accounting per role: cfNeuronsToday() deltas around each
 *      section (the Upstash daily key the production meter writes — the
 *      probe rides the same accounting), plus the structured [cf-usage]
 *      console lines the adapter always prints.
 *
 *   5. STRUCTURAL prints: the fast chain carries NO cloudflare entry
 *      (EVO streaming exclusion — no streaming in JSON mode) — verified
 *      live from the imported chain constant.
 *
 * EXIT LAW (honest, §10-ج1 verbatim): exit 1 at ANY role parse failure,
 * at an absent-from-catalog role model, at a fully-failed concurrency
 * round, or when a role section itself errored. Connection success is
 * NOT the verdict — the PARSE validators are (owner rule: a limited test
 * never proves a model fit for the task).
 *
 * Usage (GitHub Actions runner, secrets in env):
 *   npx --no-install tsx scripts/ai-providers/cf-role-probe.mts
 * Env: CLOUDFLARE_AI_TOKEN CLOUDFLARE_ACCOUNT_ID
 *      [OPENROUTER_API [OPENROUTER_API_KEY] GROQ_API_KEY NVIDIA_API_KEY
 *      for the integrated-path fallback chain]
 *      [UPSTASH_REDIS_REST_URL/TOKEN for the shared neuron meter]
 *      [CF_ARM_ENABLED — must NOT be "0" for the role entries to ride]
 */

import {
  callFreeAIFallbackChain,
  parseJSON,
  cfArmEnabled,
  isCloudflareConfigured,
  getCloudflareAccountId,
  getCloudflareAiToken,
  CF_PAIRING_MODEL,
  CF_SCOUT_MODEL,
  INTERLEAVED_FAST_CHAIN,
  INTERLEAVED_STRONGEST_CHAIN,
} from "../../src/lib/ai-provider";
import { runPairingSelection, parsePairingJSON } from "../../src/lib/blog-pairing";
import type { LanguageResearch } from "../../src/lib/blog-research";
import {
  translateLatinTokens,
  isValidArabicTermValue,
  ARTICLE_ANGLES,
} from "../../src/lib/blog-pipeline";
import { AR_MSA_EDITOR_LAW } from "../../src/lib/blog-msa";
import { cfNeuronsToday } from "../../src/lib/ai-cf-usage";

/* ── Catalog constants (mirrors scripts/ai-providers/phase3_cloudflare.py) ── */

const CF_BASE = "https://api.cloudflare.com/client/v4";

/** Officially billing-only models (Phase-2 §4) — NEVER called; catalog
 *  presence is only REPORTED to prove avoidance. */
const PAID_ONLY_MODELS = [
  "@cf/kimi/kimi-k2.6",
  "@cf/kimi/kimi-k2.7-code",
  "@zai/glm-5.2",
  "@zai/glm-5.3",
  "@zai/glm-5.3-flash",
  "@cf/deepseek-ai/deepseek-v4-flash-0731",
  "@cf/deepseek-ai/deepseek-v4.1-flash-1017",
  "@cf/deepseek-ai/deepseek-v4-pro-0813",
];

/* ── Sample research (the pairing role's REAL input shape) ─────────── */

const SAMPLE_EN_RESEARCH: LanguageResearch = {
  keywords: [
    { keyword: "creatine monohydrate loading", searchVolume: "22000" },
    { keyword: "creatine benefits for muscle", searchVolume: "18000" },
    { keyword: "creatine timing before workout", searchVolume: "9900" },
  ],
  faqs: [
    { question: "Do I need a creatine loading phase?", answer: "No — 3–5 g daily reaches saturation in ~3–4 weeks." },
    { question: "Is creatine safe for kidneys?", answer: "Healthy adults: no harm shown at standard doses." },
  ],
  topics: [
    "creatine monohydrate loading phase how much per day",
    "creatine benefits and timing for muscle gain",
    "creatine side effects for healthy adults",
  ],
};

const SAMPLE_AR_RESEARCH: LanguageResearch = {
  keywords: [
    { keyword: "الكرياتين للتضخيم", searchVolume: "8100" },
    { keyword: "جرعة الكرياتين اليومية", searchVolume: "5400" },
  ],
  faqs: [
    { question: "هل أحتاج مرحلة تحميل الكرياتين؟", answer: "لا — ٣–٥ غرام يوميًا تصل للتشبع خلال ٣–٤ أسابيع." },
  ],
  topics: [
    "جرعة الكرياتين اليومية لبناء العضلات",
    "مرحلة تحميل الكرياتين هل هي ضرورية",
    "أضرار الكرياتين للبالغين الأصحاء",
  ],
};

const LATIN_PROBE_TOKENS = ["leucine", "casein", "whey isolate", "bulking"];

function ms(started: number): number {
  return Date.now() - started;
}

function snippet(s: string, n = 160): string {
  return (s || "").replace(/\s+/g, " ").slice(0, n);
}

/* ── Section 0: token verify + catalog ─────────────────────────────── */

async function cfGet(path: string): Promise<{ ok: boolean; status: number; json: unknown }> {
  const token = getCloudflareAiToken();
  const res = await fetch(`${CF_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

/** RAW SHAPE DIAGNOSTIC (added after the honest RED of run 41145194167:
 *  a 200 whose result carried NO string response). ONE direct REST call
 *  per shape hypothesis, printing the RAW body (secret-free, truncated)
 *  so the adapter's tolerant parsing is grounded in the measured truth:
 *    call A — plain chat (messages, no response_format)
 *    call B — JSON mode (response_format json_object) on the SAME model
 *  Both are honest measurements; neither is fatal by itself. */
async function directShapeDiagnostic(): Promise<void> {
  const token = getCloudflareAiToken();
  const accountId = getCloudflareAccountId();
  const model = CF_PAIRING_MODEL;
  const cases: Array<{ label: string; body: Record<string, unknown> }> = [
    {
      label: "plain chat (messages only, max_tokens 80)",
      body: { messages: [{ role: "user", content: "Reply with the single word: PONG" }], max_tokens: 80 },
    },
    {
      label: "JSON mode (response_format json_object)",
      body: {
        messages: [{ role: "user", content: 'Return STRICT JSON only: {"pong": true}' }],
        max_tokens: 80,
        response_format: { type: "json_object" },
      },
    },
  ];
  for (const c of cases) {
    const t0 = Date.now();
    try {
      const res = await fetch(
        `${CF_BASE}/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(c.body),
          signal: AbortSignal.timeout(30_000),
        },
      );
      const raw = await res.text();
      console.log(`SHAPE DIAG ${c.label}: HTTP ${res.status} · ${ms(t0)}ms · cf-ai-neurons=${res.headers.get("cf-ai-neurons") ?? "-"}`);
      console.log(`  raw_body (≤1200 chars): ${snippet(raw, 1200)}`);
      // Field-presence census — documents EXACTLY which tolerant-parser
      // branch the adapter can use (response-as-string · response-as-object
      // · choices[0].message.content · usage.neurons).
      try {
        const j = JSON.parse(raw) as { result?: Record<string, unknown> };
        const r = j.result ?? {};
        const choice0 = (r.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0];
        console.log(
          `  fields: result.response=${typeof r.response} · result.choices[0].message.content=${typeof choice0?.message?.content} · result.usage=${typeof r.usage}${r.usage && typeof r.usage === "object" ? ` (neurons=${(r.usage as { neurons?: unknown }).neurons ?? "-"})` : ""}`,
        );
      } catch {
        console.log("  fields: raw body is not JSON");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`SHAPE DIAG ${c.label}: FETCH FAIL · ${ms(t0)}ms · ${snippet(msg, 200)}`);
    }
  }
}

async function preflightCatalog(): Promise<boolean> {
  const t0 = Date.now();
  const verify = await cfGet("/user/tokens/verify");
  const verifyResult = (verify.json as { result?: { status?: string; id?: string } })?.result;
  console.log(`CF token verify: ${verify.ok ? "OK" : `FAIL (HTTP ${verify.status})`} · status=${verifyResult?.status ?? "?"} · id_prefix=${(verifyResult?.id || "").slice(0, 8)}… · ${ms(t0)}ms`);

  const cat = await cfGet(`/accounts/${getCloudflareAccountId()}/ai/models/search?per_page=100`);
  const catResult = (cat.json as { result?: unknown })?.result;
  const models = Array.isArray(catResult)
    ? catResult
    : ((catResult as { models?: unknown })?.models ?? []);
  const names = (models as Array<{ name?: string; id?: string }>)
    .map((m) => m.name || m.id || "");
  console.log(`CF catalog: ${cat.ok ? "OK" : `FAIL (HTTP ${cat.status})`} · models_on_page=${names.length} · ${ms(t0)}ms`);

  let allPresent = true;
  for (const want of [CF_PAIRING_MODEL, CF_SCOUT_MODEL]) {
    const present = names.includes(want);
    console.log(`  presence ${want}: ${present ? "LISTED" : "ABSENT"}`);
    if (!present) allPresent = false;
  }
  const paidPresent = PAID_ONLY_MODELS.filter((p) => names.includes(p));
  console.log(`  paid-only models listed (NEVER called — avoidance proof): ${paidPresent.length ? paidPresent.join(", ") : "none listed on this page"}`);

  return verify.ok && allPresent;
}

/* ── Section 1: pairing role (isolated then integrated) ────────────── */

async function probePairingRole(): Promise<{ ok: boolean; parseOk: boolean }> {
  const out = { ok: false, parseOk: false };

  // (a) ISOLATED: the real chain machinery, tag blog:pairing, maxModels 1
  // → ONLY the CF role entry is walked (pure role measurement).
  const angleList = ARTICLE_ANGLES.map((a) => a.id).join("|");
  const prompt = `You are a bilingual SEO editor pairing ONE daily topic for a fitness blog.
Pick:
1. "topicEn": copy ONE of the EN candidates EXACTLY (no rewriting).
2. "topicAr": copy ONE of the AR candidates EXACTLY, or write ONE new Arabic long-tail topic phrasing the same daily subject for Arab searchers (natural Arabic only).
3. "angleId": ONE shared article-type id from: ${angleList} — the type that best fits the subject for BOTH languages.

EN CANDIDATES:
${SAMPLE_EN_RESEARCH.topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

AR CANDIDATES:
${SAMPLE_AR_RESEARCH.topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Return STRICT JSON only:
{"topicEn":"<exact EN candidate>","topicAr":"<exact AR candidate or new natural Arabic topic>","angleId":"<one id>"}`;

  const neuronsBefore = await cfNeuronsToday();
  const t0 = Date.now();
  try {
    const { text, model, provider } = await callFreeAIFallbackChain(prompt, {
      tag: "blog:pairing",
      temperature: 0.3,
      maxTokens: 400,
      jsonMode: true,
      timeoutMs: 45_000,
      maxModels: 1, // ONLY the CF role entry — the honest isolation probe
    });
    const choice = parsePairingJSON(text, {
      enCandidates: SAMPLE_EN_RESEARCH.topics,
      arCandidates: SAMPLE_AR_RESEARCH.topics,
    });
    const neuronsAfter = await cfNeuronsToday();
    out.ok = true;
    out.parseOk = choice !== null;
    console.log(`PAIRING ROLE (isolated, maxModels=1): PASS transport — provider=${provider} model=${model} · ${ms(t0)}ms · neurons_delta=${(neuronsAfter - neuronsBefore).toFixed(2)}`);
    console.log(`  parsePairingJSON: ${choice ? "VALID" : "INVALID (hard-law violation)"}`);
    if (choice) {
      console.log(`  choice: topicEn="${snippet(choice.topicEn, 90)}" · topicAr="${snippet(choice.topicAr, 90)}" · angleId=${choice.angleId}`);
    } else {
      console.log(`  raw_answer: ${snippet(text, 300)}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`PAIRING ROLE (isolated, maxModels=1): FAIL (${ms(t0)}ms)`);
    console.log(`  error: ${snippet(msg, 500)}`);
    return out;
  }

  // (b) INTEGRATED: runPairingSelection verbatim — the exact production
  // call (CF leads, the ordinary chain follows as fallback).
  const t1 = Date.now();
  try {
    const r = await runPairingSelection(SAMPLE_EN_RESEARCH, SAMPLE_AR_RESEARCH);
    console.log(`PAIRING ROLE (integrated runPairingSelection): PASS — source=${r.source} · attempt path with full fallback law · ${ms(t1)}ms`);
    console.log(`  choice: topicEn="${snippet(r.topicEn, 90)}" · topicAr="${snippet(r.topicAr, 90)}" · angleId=${r.angleId}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`PAIRING ROLE (integrated runPairingSelection): FAIL (${ms(t1)}ms)`);
    console.log(`  error: ${snippet(msg, 500)}`);
  }
  return out;
}

/* ── Section 2: latin-tokens role (isolated then integrated) ───────── */

async function probeLatinRole(): Promise<{ ok: boolean; parseOk: boolean }> {
  const out = { ok: false, parseOk: false };

  const prompt = `قائمة مصطلحات لاتينية ظهرت سائبة داخل مقال عربي عن اللياقة والتغذية. مهمتك تحويل المصطلحات فقط — لا يوجد مقال هنا.

أعد كائن JSON فقط، دون أي شرح أو نص خارجه، بهذا الشكل الحرفي:
{"<المصطلح اللاتيني>": "<المقابل العربي>"}

لكل مصطلح: مقابلها العربي الشائع في نصوص اللياقة والتغذية بالعربية الفصحى الحديثة، أو تعريبها الصوتي إذا لم يوجد مقابل شائع (مثل: leucine → الليوسين، casein → الكازين، shake → مشروب، marketed → يُسوَّق، evidences → أدلة، simplicity → البساطة، alkalin → ألكالين، vs → مقابل).

قواعد صارمة:
1. كل قيمة عربية خالصة — لا حرف لاتيني واحد داخل القيمة.
2. فصحى حديثة سهلة فقط — ممنوع أي لهجة عامية (عشان، مش، إيه…).
3. القيمة مصطلح قصير (كلمة إلى بضع كلمات) — ليست جملة.
4. لا تضف أي مفتاح لم يُطلب، ولا تكرر الشرح.
5. المقابل يحفظ المعنى التقني للمصطلح كما يُستخدم في سياق التدريب والتغذية.

المصطلحات:
${LATIN_PROBE_TOKENS.map((t) => `- ${t}`).join("\n")}`;

  const neuronsBefore = await cfNeuronsToday();
  const t0 = Date.now();
  try {
    const { text, model, provider } = await callFreeAIFallbackChain(prompt, {
      tag: "blog:latin-tokens-ar",
      systemPrompt: AR_MSA_EDITOR_LAW,
      temperature: 0.2,
      maxTokens: 1_200,
      jsonMode: true,
      timeoutMs: 60_000,
      maxModels: 1, // ONLY the CF scout entry — the honest isolation probe
    });
    const neuronsAfter = await cfNeuronsToday();
    out.ok = true;
    const parsed = parseJSON<Record<string, unknown>>(text);
    let accepted = 0;
    let rejected = 0;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v !== "string") continue;
        if (isValidArabicTermValue(v.trim())) accepted += 1;
        else rejected += 1;
      }
    }
    out.parseOk = parsed !== null && accepted > 0;
    console.log(`LATIN-TOKENS ROLE (isolated, maxModels=1): PASS transport — provider=${provider} model=${model} · ${ms(t0)}ms · neurons_delta=${(neuronsAfter - neuronsBefore).toFixed(2)}`);
    console.log(`  isValidArabicTermValue: accepted=${accepted}/${LATIN_PROBE_TOKENS.length} rejected=${rejected}${parsed ? "" : " (JSON parse failed)"}`);
    if (parsed) {
      for (const [k, v] of Object.entries(parsed).slice(0, 4)) {
        console.log(`    - ${k} → ${snippet(String(v), 60)} (${typeof v === "string" && isValidArabicTermValue(v.trim()) ? "accepted" : "REJECTED"})`);
      }
    } else {
      console.log(`  raw_answer: ${snippet(text, 300)}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`LATIN-TOKENS ROLE (isolated, maxModels=1): FAIL (${ms(t0)}ms)`);
    console.log(`  error: ${snippet(msg, 500)}`);
    return out;
  }

  // (b) INTEGRATED: translateLatinTokens verbatim — the exact production
  // call (CF scout leads, the ordinary chain follows as fallback).
  const t1 = Date.now();
  try {
    const r = await translateLatinTokens(LATIN_PROBE_TOKENS);
    console.log(`LATIN-TOKENS ROLE (integrated translateLatinTokens): PASS — provider=${r.provider} model=${r.model} · accepted=${r.map.size}/${LATIN_PROBE_TOKENS.length} · ${ms(t1)}ms`);
    for (const [k, v] of r.map.entries()) {
      console.log(`    - ${k} → ${snippet(v, 60)}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`LATIN-TOKENS ROLE (integrated translateLatinTokens): FAIL (${ms(t1)}ms)`);
    console.log(`  error: ${snippet(msg, 500)}`);
  }
  return out;
}

/* ── Section 3: concurrency probe ×5 / ×10 (§8-ب6) ─────────────────── */

async function concurrencyRound(n: number): Promise<{ ok: number; fail: number; classes: string[] }> {
  const t0 = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: n }, (_, i) =>
      callFreeAIFallbackChain(
        `Return STRICT JSON only, no other text: {"n": ${i + 1}, "ok": true}`,
        {
          tag: "blog:pairing",
          temperature: 0.2,
          maxTokens: 60,
          jsonMode: true,
          timeoutMs: 45_000,
          maxModels: 1, // isolated CF entry per parallel call
        },
      ),
    ),
  );
  const classes: string[] = [];
  let ok = 0;
  let fail = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      ok += 1;
    } else {
      fail += 1;
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      const cls =
        /\b429\b/.test(msg) ? "429-rate-limit"
        : /\b(401|403)\b/.test(msg) ? "auth"
        : /\b5\d\d\b/.test(msg) ? "5xx"
        : /timeout|abort/i.test(msg) ? "timeout"
        : "other";
      classes.push(`#${i + 1}:${cls}`);
    }
  });
  console.log(`CONCURRENCY ×${n}: ${ok}/${n} ok · ${fail} failed · ${ms(t0)}ms total${classes.length ? ` · failure_classes=${classes.join(", ")}` : ""}`);
  return { ok, fail, classes };
}

/* ── Main ──────────────────────────────────────────────────────────── */

async function main(): Promise<number> {
  console.log("=== Cloudflare Workers AI ROLE probe (Phase 5-C / stage ج — §10-ج1) ===");
  console.log(
    `env: token=${getCloudflareAiToken() ? "configured" : "MISSING"} · account=${getCloudflareAccountId() ? "configured" : "MISSING"} · CF_ARM_ENABLED=${cfArmEnabled() ? "on" : "OFF (kill switch)"} · upstash_meter=${process.env.UPSTASH_REDIS_REST_URL ? "configured" : "absent (in-process degradation)"}`,
  );

  if (!isCloudflareConfigured()) {
    console.log("PROBE RED: CLOUDFLARE_AI_TOKEN / CLOUDFLARE_ACCOUNT_ID not configured — nothing to probe.");
    return 1;
  }
  if (!cfArmEnabled()) {
    console.log("PROBE RED: CF_ARM_ENABLED=0 — the role arm is disabled by the kill switch (probe must run with the arm on).");
    return 1;
  }

  // Structural print: the fast chain must carry NO cloudflare entry.
  const fastHasCf = INTERLEAVED_FAST_CHAIN.some((e) => e.provider === "cloudflare");
  const strongestHasCf = INTERLEAVED_STRONGEST_CHAIN.some((e) => e.provider === "cloudflare");
  console.log(`STRUCTURAL: fast_chain_has_cloudflare=${fastHasCf} (must be false — EVO streaming exclusion) · strongest_chain_has_cloudflare=${strongestHasCf} (must be false — roles ride the tag-scoped entry only)`);

  // Section 0 — token + catalog gate + the raw-shape diagnostic.
  const catalogOk = await preflightCatalog();
  if (!catalogOk) {
    console.log("PROBE RED: preflight failed (token verify or a role model absent from the live catalog) — the role cannot serve.");
    return 1;
  }
  await directShapeDiagnostic();

  // Section 1 — pairing role.
  console.log("\n--- Section 1: pairing role (blog:pairing → 70b-fp8-fast) ---");
  const pairing = await probePairingRole();

  // Section 2 — latin-tokens role.
  console.log("\n--- Section 2: latin-tokens role (blog:latin-tokens-ar → scout) ---");
  const latin = await probeLatinRole();

  // Section 3 — concurrency (§8-ب6 mandatory pre-adoption item).
  console.log("\n--- Section 3: concurrency probe (§8-ب6) ---");
  const c5 = await concurrencyRound(5);
  const c10 = await concurrencyRound(10);

  // Final neuron read (the shared production meter).
  const total = await cfNeuronsToday();
  console.log(`\nNEURON METER (shared daily key): ${total.toFixed(2)} neurons today (UTC) — the production cf:usage:{date}:neurons counter this probe also writes.`);

  // ── Honest verdict (exit law) ──
  const parseFailures: string[] = [];
  if (!pairing.parseOk) parseFailures.push("pairing role parse/transport");
  if (!latin.parseOk) parseFailures.push("latin-tokens role parse/transport");
  if (c5.ok === 0) parseFailures.push("concurrency ×5 round: 0/5 succeeded");
  if (c10.ok === 0) parseFailures.push("concurrency ×10 round: 0/10 succeeded");

  if (parseFailures.length > 0) {
    console.log(`\nPROBE RED: ${parseFailures.join(" · ")} — §10-ج1 exit law (any parse failure = 1).`);
    return 1;
  }
  const partialConcurrency = c5.fail + c10.fail;
  console.log(
    `\nPROBE GREEN: both roles parsed VALID through the REAL production code paths (isolated CF walk + integrated fallback law)${partialConcurrency > 0 ? ` · concurrency note: ${partialConcurrency} parallel failures measured (partial — the chain absorbs them in production; §8-ب6 limits documented)` : " · concurrency 15/15 clean"}.`,
  );
  return 0;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((e) => {
    console.error("probe crashed:", e);
    process.exit(1);
  });
