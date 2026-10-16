/**
 * Universal AI Provider — OpenAI-compatible client.
 *
 * OWNER DIRECTIVE (2026-08-27, extended 2026-09-09): the platform uses
 * EXACTLY THREE AI providers:
 *   1. openrouter (default) → https://openrouter.ai/api/v1       (env: OPENROUTER_API)
 *   2. groq                 → https://api.groq.com/openai/v1     (env: GROQ_API_KEY)
 *   3. nvidia (NIM)         → https://integrate.api.nvidia.com/v1 (env: NVIDIA_API_KEY)
 *
 * OWNER DIRECTIVE (2026-10-06, «أضف Gemini كمزود AI جديد مع المزودين
 * الحاليين، واجعله الاختيار الأول في المدونة بكل خطوات توليدها وتوليد خطط
 * الذكاء الاصطناعي ومحادثات EVO»): a FOURTH provider joins — gemini
 * (Google AI Studio auth key, FREE tier, env: GEMINI_API_KEY). GEMINI-FIRST
 * LAW: when the gemini key is configured, a gemini entry LEADS both chains
 * (strongest = blog pipeline + AI plans · fast = EVO chat) and the 3-way
 * lead rotation is suspended; the ladder AFTER gemini, the dual-key pool,
 * the Groq R3 clamp and every queue mechanism stay byte-identical, and with
 * the key absent the pre-343 behavior is verbatim. Gemini uses the NATIVE
 * generativelanguage REST API (NOT OpenAI-compatible): the translation
 * adapters are the only native-shape code in the platform and live below
 * (callAI / callAIStream branch on provider === "gemini"). Model override:
 * GEMINI_MODEL. Usage of the free tier is tracked per-tag to Upstash
 * (src/lib/ai-usage-gemini.ts) feeding docs/ai/gemini-weekly-usage-report.md
 * (weekly workflow gemini-weekly-usage-report.yml).
 *
 * PHASE 344 (owner order 2026-10-06 «بحث خارجي حقيقي [Google Search
 * grounding] يدخل نتائج البحث الفعلية في توليد المقال» + «تبديل إصدار
 * نموذج Gemini»): (a) the native arm gains GOOGLE SEARCH GROUNDING —
 * tools:[{googleSearch:{}}] rides generateContent and the response's
 * groundingMetadata (webSearchQueries + groundingChunks web uri/title)
 * is extracted as REAL search evidence; the P0 research step calls the
 * new callGeminiGroundedSearch() directly (no chain substitute — only
 * gemini can ground, and an ungrounded answer fails honestly). (b) the
 * default model switches gemini-3.8-flash → gemini-3.5-flash (measured
 * free-tier 503 «The model is overloaded» on 3.8-flash; 3.5-flash is the
 * same-tier prior stable version on the free plan) — GEMINI_MODEL still
 * overrides at runtime and the ladder/fallback after gemini is untouched.
 *
 * The 2026-08-27 removal banned CONSUMER-side provider fetches and the
 * Gemini SDK; it is superseded for THIS file only by the explicit owner
 * order above. The law that consumers never fetch provider URLs themselves
 * is unchanged (§8). The dead OpenRouter `google/gemma-*` ids (Phase 177
 * purge) stay dead — this arm is the native API, not an OpenRouter slug.
 *
 * All providers expose the OpenAI Chat Completions API shape:
 * POST {base_url}/chat/completions
 * body: { model, messages, temperature, max_tokens, response_format }
 *
 * Resolution order (highest priority first):
 * 1. Runtime override (sent inline by the API caller via mergeOverride())
 * 2. Process.env (OPENROUTER_API || OPENROUTER_API_KEY / GROQ_API_KEY /
 *    NVIDIA_API_KEY)
 *
 * Vercel Hobby budget guarantee: callFreeAIFallbackChain() clamps its own
 * per-model timeout so that maxModels × timeoutMs never exceeds ~52s,
 * keeping every single serverless request safely under the 60s cap.
 *
 * This file MUST be server-only — it never exposes API keys to the client.
 */

export type AIProvider = "openrouter" | "groq" | "nvidia" | "gemini";

import { trackGeminiUsage } from "./ai-usage-gemini";

/**
 * Canonical env-var reader for the allowed providers.
 * OPENROUTER_API_KEY is accepted as a documented alias of OPENROUTER_API
 * (older docs used it) so both spellings always work.
 */
export function getOpenRouterKey(): string {
  return process.env.OPENROUTER_API || process.env.OPENROUTER_API_KEY || "";
}

/**
 * DUAL-KEY POOL (2026-08-27 owner addition): owner supplied TWO OpenRouter
 * accounts after hitting the free tier's ~50 requests/day ceiling.
 * OPENROUTER_API = account #2, OPENROUTER_API_KEY = account #1.
 * The fallback chain rotates across every configured key so the daily
 * budget effectively doubles before any single account is exhausted,
 * and a key that returns auth/quota errors is bypassed automatically.
 */
export function getOpenRouterKeys(): string[] {
  const raw = [process.env.OPENROUTER_API, process.env.OPENROUTER_API_KEY];
  const keys = raw.filter((k): k is string => typeof k === "string" && k.trim().length > 0);
  return [...new Set(keys)];
}

export function getGroqKey(): string {
  return process.env.GROQ_API_KEY || "";
}

/**
 * NVIDIA NIM (2026-09-09 owner addition — third provider in the key bundle):
 * OpenAI-compatible endpoint at integrate.api.nvidia.com. Keys start with
 * `nvapi-`. Handled by the SAME fallback chain as the other two providers.
 */
export function getNvidiaKey(): string {
  return process.env.NVIDIA_API_KEY || "";
}

/**
 * GEMINI (2026-10-06 owner addition — fourth provider, FREE tier):
 * Google AI Studio auth key bound to the owner's Cloud project. Uses the
 * NATIVE generativelanguage REST API (x-goog-api-key header) — NOT the
 * OpenAI-compatible shape — so callAI/callAIStream translate for it.
 * Ops knob: GEMINI_MODEL swaps the model without a deploy.
 */
export function getGeminiKey(): string {
  return process.env.GEMINI_API_KEY || "";
}

export const AI_PROVIDERS: Record<
  AIProvider,
  {
    label: string;
    baseUrl: string;
    defaultModel: string;
    envKey: string;
    docsUrl: string;
    keyPrefix: string;
  }
> = {
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "nvidia/nemotron-3.5-lightning:free",
    envKey: "OPENROUTER_API",
    docsUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-",
  },
  groq: {
    label: "Groq (ultra-fast)",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-120b",
    envKey: "GROQ_API_KEY",
    docsUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_",
  },
  nvidia: {
    label: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "nvidia/nemotron-3-super-120b-a12b",
    envKey: "NVIDIA_API_KEY",
    docsUrl: "https://build.nvidia.com",
    keyPrefix: "nvapi-",
  },
  gemini: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    // PHASE 344 (owner order «تبديل إصدار نموذج Gemini»): default switched
    // 3.8-flash → 3.5-flash — the 2026-10-06 production review measured
    // transient free-tier 503 «The model is overloaded. Please try again
    // later.» on 3.8-flash while the key itself was healthy (live EVO 4/5
    // + GHA 200); 3.5-flash is the same-tier prior stable version on the
    // free plan. GEMINI_MODEL still swaps it without a deploy.
    defaultModel: "gemini-3.5-flash",
    envKey: "GEMINI_API_KEY",
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyPrefix: "AIza",
  },
};

export type AIConfig = {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
};

export type AIConfigStatus = {
  provider: AIProvider;
  model: string;
  baseUrl: string;
  isConfigured: boolean;
  source: "env" | "override" | "none";
  maskedKey: string | null;
};

/**
 * Resolve the active AI config from env vars (default source).
 * Override configs (from cookies/inline) are merged by callers via
 * `mergeOverride` below.
 *
 * Only the four allowed providers (openrouter | groq | nvidia | gemini)
 * are returned. AI_PROVIDER values outside that set are ignored (default
 * wins). If the requested provider has no key, fall through to the first
 * configured one in priority order openrouter → groq → nvidia → gemini
 * (gemini sits LAST here by design: the single-call default stays
 * openrouter — the GEMINI-FIRST law (2026-10-06) lives in the CHAINS,
 * which cover blog + plans + EVO exactly as the owner ordered).
 */
const PROVIDER_PRIORITY: AIProvider[] = ["openrouter", "groq", "nvidia", "gemini"];

export function getEnvConfig(): AIConfig | null {
  const requested = (process.env.AI_PROVIDER as AIProvider) || "openrouter";
  const provider: AIProvider = PROVIDER_PRIORITY.includes(requested)
    ? requested
    : "openrouter";

  const openrouterKey = getOpenRouterKey();
  const groqKey = getGroqKey();
  const nvidiaKey = getNvidiaKey();
  const geminiKey = getGeminiKey();
  const keyFor = (p: AIProvider) =>
    p === "openrouter"
      ? openrouterKey
      : p === "groq"
        ? groqKey
        : p === "nvidia"
          ? nvidiaKey
          : geminiKey;

  // Resolve the key for the chosen provider; if it's missing fall through
  // to the first configured provider by priority.
  let apiKey = keyFor(provider);
  let resolvedProvider = provider;
  if (!apiKey) {
    const fallback = PROVIDER_PRIORITY.find((p) => keyFor(p));
    if (fallback) {
      resolvedProvider = fallback;
      apiKey = keyFor(fallback);
    }
  }

  if (!apiKey) return null;

  const meta2 = AI_PROVIDERS[resolvedProvider];
  return {
    provider: resolvedProvider,
    apiKey,
    model: process.env.AI_MODEL || meta2.defaultModel,
    baseUrl: process.env.AI_BASE_URL || meta2.baseUrl,
  };
}

/**
 * Merge an optional override (from the AI Settings page) on top of the env
 * config. The override always wins when present.
 */
export function mergeOverride(
  override?: Partial<AIConfig> | null,
): AIConfig | null {
  const env = getEnvConfig();
  if (!override && !env) return null;
  if (!override) return env;

  const provider =
    (override.provider as AIProvider) || env?.provider || "openrouter";
  const meta = AI_PROVIDERS[provider] || AI_PROVIDERS.openrouter;

  return {
    provider,
    apiKey: override.apiKey || env?.apiKey || "",
    model: override.model || env?.model || meta.defaultModel,
    baseUrl: override.baseUrl || env?.baseUrl || meta.baseUrl,
  };
}

/**
 * Mask a key for display: show prefix + last 4 chars.
 */
export function maskKey(key: string): string | null {
  if (!key) return null;
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

/**
 * Get the current status (for the AI Settings page) — never returns the raw key.
 */
export function getStatus(override?: Partial<AIConfig> | null): AIConfigStatus {
  const cfg = mergeOverride(override);
  if (!cfg || !cfg.apiKey) {
    const provider = (process.env.AI_PROVIDER as AIProvider) || "openrouter";
    const meta = AI_PROVIDERS[provider] || AI_PROVIDERS.openrouter;
    return {
      provider,
      model: meta.defaultModel,
      baseUrl: meta.baseUrl,
      isConfigured: false,
      source: "none",
      maskedKey: null,
    };
  }
  return {
    provider: cfg.provider,
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    isConfigured: true,
    source: override?.apiKey ? "override" : "env",
    maskedKey: maskKey(cfg.apiKey),
  };
}

export type CallAIOptions = {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
  /** UNIVERSAL SWITCHER COVERAGE (observational only): labels the calling
   *  subsystem so gemini attempts land in per-feature usage counters
   *  ([gemini-usage] logs + Upstash → weekly report). NEVER changes model
   *  ordering or fallback policy. */
  tag?: string;
  /** GOOGLE SEARCH GROUNDING (Phase 344, owner order «بحث خارجي حقيقي"):
   *  honored ONLY by the gemini native arm — the request then carries
   *  tools:[{googleSearch:{}}] so the answer is grounded in LIVE Google
   *  Search results (groundingMetadata in the response). Other providers
   *  ignore the flag (they have no search capability). When set, the gemini
   *  arm also SUPPRESSES responseMimeType: the REST API rejects JSON-mode
   *  combined with tool use, so STRICT-JSON prompt instructions + the
   *  161.5-hardened parseJSON carry the contract (the same pattern as the
   *  Groq Phase 177 json guard). Grounding evidence is consumed via
   *  callGeminiGroundedSearch() below. */
  googleSearch?: boolean;
};

/* ───────────────────────────────────────────────────────────────────────
 * GEMINI NATIVE ADAPTER (Phase 343, 2026-10-06 — owner order, free tier)
 * generativelanguage REST is NOT OpenAI-compatible. The translators below
 * are the ONLY native-shape code in the platform; every consumer keeps
 * using callAI / callAIStream unchanged. Both adapters track every attempt
 * (per-tag) via ai-usage-gemini.ts — awaited but fail-soft, bounded 3s.
 * ─────────────────────────────────────────────────────────────────────── */

type GeminiPart = { text?: string; thought?: boolean };

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] } | null;
    finishReason?: string;
    /** PHASE 344: present when the request carried tools:[{googleSearch:{}}]
     *  — the REAL search evidence the answer was grounded on. */
    groundingMetadata?: GeminiGroundingMetadataRaw | null;
  }> | null;
  promptFeedback?: { blockReason?: string } | null;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null;
};

/** Raw REST shape of candidates[0].groundingMetadata (Phase 344). */
type GeminiGroundingMetadataRaw = {
  webSearchQueries?: string[] | null;
  groundingChunks?: Array<{ web?: { uri?: string; title?: string } | null } | null> | null;
};

/** PHASE 344 — normalized REAL search evidence extracted from a grounded
 *  response: the queries the model actually ran + the live result pages. */
export type GeminiGroundingSource = { title: string; url: string };
export type GeminiGrounding = {
  searchQueries: string[];
  sources: GeminiGroundingSource[];
};

function emptyGeminiGrounding(): GeminiGrounding {
  return { searchQueries: [], sources: [] };
}

/** Normalize groundingMetadata → searchQueries (≤10) + sources (≤12,
 *  deduped by URL). Missing/malformed metadata → empty evidence. */
function geminiGroundingFromMetadata(
  meta: GeminiGroundingMetadataRaw | null | undefined,
): GeminiGrounding {
  if (!meta) return emptyGeminiGrounding();
  const searchQueries = Array.isArray(meta.webSearchQueries)
    ? meta.webSearchQueries.map((q) => String(q ?? "").trim()).filter(Boolean).slice(0, 10)
    : [];
  const sources: GeminiGroundingSource[] = [];
  const seen = new Set<string>();
  if (Array.isArray(meta.groundingChunks)) {
    for (const chunk of meta.groundingChunks) {
      const web = chunk?.web;
      const url = typeof web?.uri === "string" ? web.uri.trim() : "";
      if (!url || seen.has(url)) continue;
      seen.add(url);
      sources.push({ title: typeof web?.title === "string" ? web.title.trim() : "", url });
      if (sources.length >= 12) break;
    }
  }
  return { searchQueries, sources };
}

/** Concatenate non-thought text parts (thought summaries are model CoT —
 *  never user-facing; mirrors callAI's reasoning-delta buffering law). */
function geminiTextFromParts(parts: GeminiPart[] | undefined | null): string {
  if (!Array.isArray(parts)) return "";
  return parts
    .filter(
      (p) =>
        typeof p?.text === "string" && p.text.length > 0 && p.thought !== true,
    )
    .map((p) => p.text as string)
    .join("");
}

function geminiBuildBody(
  prompt: string,
  options: CallAIOptions,
): Record<string, unknown> {
  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxTokens ?? 4096,
  };
  // PHASE 344: JSON-mode mime is suppressed when googleSearch is set — the
  // REST API rejects responseMimeType combined with tool use, so STRICT-JSON
  // prompt instructions + the hardened parseJSON carry the contract (the
  // Groq Phase 177 json guard pattern).
  if (options.jsonMode && !options.googleSearch) {
    // Native mime-type JSON mode — Gemini does NOT server-validate output
    // (unlike Groq's json_object 400s, Phase 177); parseJSON still guards.
    generationConfig.responseMimeType = "application/json";
  }
  return {
    ...(options.systemPrompt
      ? { systemInstruction: { parts: [{ text: options.systemPrompt }] } }
      : {}),
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
    ...(options.googleSearch ? { tools: [{ googleSearch: {} }] } : {}),
  };
}

function geminiHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
}

function isAbortError(e: unknown): boolean {
  return (
    e instanceof Error &&
    (e.name === "AbortError" || /aborted/i.test(e.message))
  );
}

/** Non-streaming: POST /models/{model}:generateContent → joined text +
 *  (Phase 344) normalized grounding evidence when the request was grounded. */
async function callGeminiGenerate(
  cfg: AIConfig,
  prompt: string,
  options: CallAIOptions,
): Promise<{ text: string; grounding: GeminiGrounding }> {
  const started = Date.now();
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 60_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let tracked = false;
  try {
    const res = await fetch(`${cfg.baseUrl}/models/${cfg.model}:generateContent`, {
      method: "POST",
      headers: geminiHeaders(cfg.apiKey),
      body: JSON.stringify(geminiBuildBody(prompt, options)),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      await trackGeminiUsage({
        tag: options.tag,
        model: cfg.model,
        ok: false,
        status: res.status,
        latencyMs: Date.now() - started,
      }).catch(() => {});
      tracked = true;
      throw new Error(
        `AI API error ${res.status} from ${cfg.provider}: ${text.slice(0, 500)}`,
      );
    }

    const data = (await res.json()) as GeminiGenerateResponse;
    const blockReason = data.promptFeedback?.blockReason;
    const finishReason = data.candidates?.[0]?.finishReason;
    const text = geminiTextFromParts(data.candidates?.[0]?.content?.parts);
    const grounding = geminiGroundingFromMetadata(
      data.candidates?.[0]?.groundingMetadata,
    );
    // PHASE 344 — HONEST GROUNDING GATE: a googleSearch request whose answer
    // carries NO grounding evidence was not built on live search; it must
    // fail (counted isEmpty) instead of passing model memory off as research.
    const ungrounded =
      options.googleSearch === true &&
      grounding.searchQueries.length === 0 &&
      grounding.sources.length === 0;
    if (!text || ungrounded) {
      await trackGeminiUsage({
        tag: options.tag,
        model: cfg.model,
        ok: false,
        isEmpty: true,
        status: res.status,
        latencyMs: Date.now() - started,
      }).catch(() => {});
      tracked = true;
      throw new Error(
        ungrounded
          ? `AI provider ${cfg.provider} returned no Google-Search grounding evidence (empty webSearchQueries + groundingChunks) — the answer was not built on live search`
          : `AI provider ${cfg.provider} returned an empty response` +
              (blockReason ? ` (blockReason: ${blockReason})` : "") +
              (finishReason && finishReason !== "STOP"
                ? ` (finishReason: ${finishReason})`
                : ""),
      );
    }

    await trackGeminiUsage({
      tag: options.tag,
      model: cfg.model,
      ok: true,
      latencyMs: Date.now() - started,
      promptTokens: data.usageMetadata?.promptTokenCount,
      completionTokens: data.usageMetadata?.candidatesTokenCount,
    }).catch(() => {});
    tracked = true;
    return { text: text.trim(), grounding };
  } catch (e) {
    if (!tracked) {
      const abort = isAbortError(e);
      await trackGeminiUsage({
        tag: options.tag,
        model: cfg.model,
        ok: false,
        status: 0,
        errorKind: abort ? "timeout" : "network",
        latencyMs: Date.now() - started,
      }).catch(() => {});
      if (abort) {
        throw new Error(
          `AI API timeout after ${timeoutMs}ms from ${cfg.provider}`,
        );
      }
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Streaming: POST /models/{model}:streamGenerateContent?alt=sse — each SSE
 *  data chunk carries candidates[0].content.parts[].text deltas. Returns
 *  the FULL text. Failure semantics match callAIStream's chain contract. */
async function callGeminiStream(
  cfg: AIConfig,
  prompt: string,
  options: CallAIOptions,
  onDelta?: (chunk: string) => void,
): Promise<string> {
  const started = Date.now();
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 60_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let tracked = false;
  try {
    const res = await fetch(
      `${cfg.baseUrl}/models/${cfg.model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: geminiHeaders(cfg.apiKey),
        body: JSON.stringify(geminiBuildBody(prompt, options)),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      await trackGeminiUsage({
        tag: options.tag,
        model: cfg.model,
        ok: false,
        status: res.status,
        latencyMs: Date.now() - started,
      }).catch(() => {});
      tracked = true;
      throw new Error(
        `AI API error ${res.status} from ${cfg.provider}: ${text.slice(0, 500)}`,
      );
    }
    if (!res.body) {
      await trackGeminiUsage({
        tag: options.tag,
        model: cfg.model,
        ok: false,
        isEmpty: true,
        status: res.status,
        latencyMs: Date.now() - started,
      }).catch(() => {});
      tracked = true;
      throw new Error(`AI provider ${cfg.provider} returned no stream body`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let usage: GeminiGenerateResponse["usageMetadata"] | null = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nlIdx).trim();
        buffer = buffer.slice(nlIdx + 1);
        if (!line || line.startsWith(":")) continue; // SSE comment / keep-alive
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as GeminiGenerateResponse;
          if (evt.usageMetadata) usage = evt.usageMetadata;
          const piece = geminiTextFromParts(
            evt.candidates?.[0]?.content?.parts,
          );
          if (piece) {
            full += piece;
            onDelta?.(piece);
          }
        } catch {
          // malformed SSE line — skip
        }
      }
    }

    const text = full.trim();
    if (!text) {
      await trackGeminiUsage({
        tag: options.tag,
        model: cfg.model,
        ok: false,
        isEmpty: true,
        status: res.status,
        latencyMs: Date.now() - started,
      }).catch(() => {});
      tracked = true;
      throw new Error(`AI provider ${cfg.provider} returned an empty stream`);
    }

    await trackGeminiUsage({
      tag: options.tag,
      model: cfg.model,
      ok: true,
      streamed: true,
      latencyMs: Date.now() - started,
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
    }).catch(() => {});
    tracked = true;
    return text;
  } catch (e) {
    if (!tracked) {
      const abort = isAbortError(e);
      await trackGeminiUsage({
        tag: options.tag,
        model: cfg.model,
        ok: false,
        status: 0,
        errorKind: abort ? "timeout" : "network",
        latencyMs: Date.now() - started,
      }).catch(() => {});
      if (abort) {
        throw new Error(
          `AI API timeout after ${timeoutMs}ms from ${cfg.provider}`,
        );
      }
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/* ───────────────────────────────────────────────────────────────────────
 * GOOGLE SEARCH GROUNDED CALL (Phase 344, owner order 2026-10-06 «بحث
 * خارجي حقيقي [Google Search grounding]... مع إزالة الاعتماد على محاكاة
 * البحث أو الـ curated fallback كبديل للبحث الحقيقي»)
 * One DIRECT native gemini generateContent with tools:[{googleSearch:{}}].
 * Deliberately NOT routed through callFreeAIFallbackChain: only the gemini
 * arm can ground, and a non-grounded model's output must never masquerade
 * as search results — a failure here is HONEST (thrown; the ungrounded
 * gate above also rejects 200-without-evidence answers), and the caller's
 * step-level retry (the runner's ×3 law) rides out transient 5xx/overload.
 * BLOG-RECOVERY 2026-10-16 (RC2): the call now walks a MODEL LADDER —
 * GEMINI_MODEL override (if set) → registry default → alternate
 * grounded-capable flash models (each bills its OWN free-tier quota
 * bucket, so one drained bucket no longer kills the whole research
 * step; see GEMINI_GROUNDED_MODEL_LADDER below for the live evidence).
 * Every attempt is still a REAL grounded call; all models exhausted →
 * one honest aggregate error. Model: GEMINI_MODEL override leads, then
 * the registry default (3.5-flash since 344). Every attempt is tracked
 * per-tag exactly like the other arms.
 * ─────────────────────────────────────────────────────────────────────── */

export type GeminiGroundedSearchResult = {
  text: string;
  provider: "gemini";
  model: string;
  grounding: GeminiGrounding;
};

/** BLOG-RECOVERY 2026-10-16 (RC2) — grounded-search MODEL LADDER.
 * Live evidence (GHA logs 2026-10-06 → 10-15 + docs/ai/gemini-weekly-
 * usage-report.md week of 2026-10-05): the ONLY runtime path that never
 * succeeded was the grounded call — `blog_research` 108 attempts, 0 OK,
 * 106 quota(429) — while NON-grounded Gemini calls on the SAME key kept
 * succeeding (evo-chat 9 OK, plans OK, aws-ai-test real plan OK). Gemini
 * bills each MODEL its own free-tier quota bucket, so a 429
 * RESOURCE_EXHAUSTED on gemini-3.5-flash does not mean grounding is
 * unavailable — it means THAT bucket is drained. The ladder tries the
 * override/default first, then the alternate grounded-capable flash
 * models; EVERY attempt is a REAL grounded googleSearch call (the
 * honest ungrounded-200 gate runs per attempt), so no fake/curated
 * substitute can ever masquerade as research. All models exhausted →
 * one honest aggregate error (the caller's ×3 retry rides transient 5xx).
 * Ops knob: GEMINI_GROUNDED_MODELS (comma-separated) replaces the
 * built-in tail without a deploy. */
export const GEMINI_GROUNDED_MODEL_LADDER: readonly string[] = [
  // (the registry default — gemini-3.5-flash — always leads the ladder;
  //  it is prepended by callGeminiGroundedSearch below, not listed here)
  "gemini-3.8-flash", // prior registry default (343) — separate quota bucket
  "gemini-2.5-flash", // long-stable prior generation — separate bucket
];

function groundedModelCandidates(): string[] {
  const override = (process.env.GEMINI_MODEL || "").trim();
  const envLadder = (process.env.GEMINI_GROUNDED_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const tail = envLadder.length > 0 ? envLadder : GEMINI_GROUNDED_MODEL_LADDER;
  return [
    ...new Set(
      [override, AI_PROVIDERS.gemini.defaultModel, ...tail].filter(
        (m): m is string => !!m,
      ),
    ),
  ];
}

export async function callGeminiGroundedSearch(
  prompt: string,
  options: CallAIOptions = {},
): Promise<GeminiGroundedSearchResult> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error(
      "callGeminiGroundedSearch: GEMINI_API_KEY is not configured — real Google-Search grounding is unavailable, and no simulated/curated substitute is allowed (owner order 2026-10-06).",
    );
  }
  const candidates = groundedModelCandidates();
  const failures: string[] = [];
  for (const model of candidates) {
    const cfg: AIConfig = {
      provider: "gemini",
      apiKey,
      model,
      baseUrl: AI_PROVIDERS.gemini.baseUrl,
    };
    try {
      const { text, grounding } = await callGeminiGenerate(cfg, prompt, {
        ...options,
        googleSearch: true,
      });
      if (failures.length > 0) {
        console.warn(
          `[gemini-grounded] model ${model} succeeded after earlier model failure(s) — ${failures.length} model(s) skipped`,
        );
      }
      return { text, provider: "gemini", model, grounding };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failures.push(`[${model}] ${msg.slice(0, 240)}`);
      const next =
        candidates.indexOf(model) < candidates.length - 1
          ? candidates[candidates.indexOf(model) + 1]
          : null;
      console.warn(
        `[gemini-grounded] model ${model} failed${next ? ` → trying ${next}` : " (last ladder model)"}: ${msg.slice(0, 180)}`,
      );
    }
  }
  throw new Error(
    `callGeminiGroundedSearch: ALL grounded models failed (tried ${candidates.join(", ")}) — no simulated/curated substitute is allowed (owner order 2026-10-06). Per-model errors: ${failures.join(" | ")}`,
  );
}

/**
 * Core: call any OpenAI-compatible chat completion endpoint.
 * Returns the assistant message text.
 *
 * Provider-specific notes:
 * - Anthropic's OpenAI-compat shim doesn't support response_format — we
 * skip it and rely on prompt-based JSON instructions.
 * - Gemini's OpenAI-compat shim accepts response_format but sometimes
 * returns 400 — same approach (skip it, use prompt instructions).
 * - Some reasoning models (gpt-oss, gemini-2.5-flash-thinking) return
 * empty `content` and put the actual text in `reasoning_details` /
 * `reasoning`. We fall back to those if `content` is empty.
 */
export async function callAI(
  prompt: string,
  options: CallAIOptions = {},
  configOverride?: Partial<AIConfig> | null,
): Promise<string> {
  const cfg = mergeOverride(configOverride);
  if (!cfg || !cfg.apiKey) {
    throw new Error(
      "AI provider not configured. Set OPENROUTER_API / GROQ_API_KEY / NVIDIA_API_KEY / GEMINI_API_KEY in your environment variables.",
    );
  }

  // GEMINI NATIVE ARM (Phase 343): translate to generativelanguage REST —
  // every other provider keeps the OpenAI-compatible path untouched.
  // (Phase 344: the grounding evidence, when requested, is consumed via
  // callGeminiGroundedSearch below — callAI's text-only contract is intact.)
  if (cfg.provider === "gemini") {
    const { text } = await callGeminiGenerate(cfg, prompt, options);
    return text;
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  };

  // GROQ JSON-MODE 400 GUARD (PHASE 177, 2026-09-11 — 14-day audit: 35 live
  // failures `code:"json_validate_failed"`): Groq validates json_object
  // output SERVER-SIDE and hard-rejects with HTTP 400 when a reasoning model
  // wraps output in prose or burns CoT. OpenRouter + NVIDIA NIM accept the
  // flag without server-side validation, so only they keep strict mode;
  // Groq relies on prompt JSON instructions + the 161.5-hardened parseJSON
  // (fenced/prose/truncation-tolerant extractor). Same pattern P1 already
  // uses (jsonMode:false) for its truncation-side failures.
  if (options.jsonMode && cfg.provider !== "groq") {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 60_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
        // OpenRouter recommends these optional headers for attribution.
        ...(cfg.provider === "openrouter"
          ? {
              "HTTP-Referer": "https://alkemos.com",
              "X-Title": "Alkemos Blog CMS",
            }
          : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `AI API error ${res.status} from ${cfg.provider}: ${text.slice(0, 500)}`,
      );
    }

    // Typed view of the OpenAI-compatible chat-completions response (only
    // the fields we consume — reasoning-model extras included).
    const data = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          reasoning?: string | null;
          reasoning_details?: Array<{ text?: unknown } | null> | null;
        } | null;
      }> | null;
    } | null;
    const msg = data?.choices?.[0]?.message;
    // Prefer `content`; fall back to `reasoning` / `reasoning_details` for
    // reasoning models (gpt-oss, gemini-thinking) that hide output there.
    let content: string | undefined = msg?.content ?? undefined;
    if (!content && Array.isArray(msg?.reasoning_details)) {
      content = msg.reasoning_details
        .map((r) => (typeof r?.text === "string" ? r.text : ""))
        .filter(Boolean)
        .join("\n");
    }
    if (!content && typeof msg?.reasoning === "string") {
      content = msg.reasoning;
    }
    if (!content) {
      throw new Error(`AI provider ${cfg.provider} returned an empty response`);
    }
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call AI with an EXPLICIT single-provider config — NO hidden cross-provider
 * fallback. (2026-08-27 hardening: the previous silent "try the other
 * provider" stage made the chain mislabel WHICH provider/model actually
 * answered and swallowed quota errors, so the chain's own model ladder AND
 * the new dual-key switch inside `callFreeAIFallbackChain` could never fire.
 * The chain + race now own ALL fallback policy; this helper is exact.)
 */
export async function callAIWithFallback(
  prompt: string,
  options: CallAIOptions = {},
  configOverride?: Partial<AIConfig> | null,
): Promise<{ text: string; provider: AIProvider; model: string }> {
  const cfg = mergeOverride(configOverride);
  if (!cfg || !cfg.apiKey) {
    throw new Error("callAIWithFallback: no provider config/apiKey given");
  }
  const text = await callAI(prompt, options, configOverride);
  return { text, provider: cfg.provider, model: cfg.model };
}

/**
 * Phase 89 — streaming variant of callAI for a single explicit provider
 * config. Opens the request with stream:true and forwards raw content
 * deltas to onDelta as they arrive (OpenAI-compatible SSE). Returns the
 * FULL accumulated text.
 *
 * Reasoning deltas (gpt-oss etc.) are buffered silently and used only if
 * NO content deltas ever arrive — mirroring callAI's content→reasoning
 * fallback — so users never see thinking garbage live.
 *
 * Failure semantics (the chain's streaming contract):
 * - request-level failures (HTTP error, timeout, network) throw BEFORE
 *   any delta → the chain silently falls back to the next model.
 * - mid-stream failures (after ≥1 delta was forwarded) throw with the
 *   stream already consumed — the chain aborts (see callFreeAIFallbackChain).
 */
export async function callAIStream(
  prompt: string,
  options: CallAIOptions = {},
  configOverride?: Partial<AIConfig> | null,
  onDelta?: (chunk: string) => void,
): Promise<string> {
  const cfg = mergeOverride(configOverride);
  if (!cfg || !cfg.apiKey) {
    throw new Error("callAIStream: no provider config/apiKey given");
  }

  // GEMINI NATIVE ARM (Phase 343): SSE streaming via streamGenerateContent.
  if (cfg.provider === "gemini") {
    return callGeminiStream(cfg, prompt, options, onDelta);
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const body = {
    model: cfg.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    stream: true,
  };

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 60_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
        ...(cfg.provider === "openrouter"
          ? {
              "HTTP-Referer": "https://alkemos.com",
              "X-Title": "Alkemos EVO Chat",
            }
          : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `AI API error ${res.status} from ${cfg.provider}: ${text.slice(0, 500)}`,
      );
    }
    if (!res.body) {
      throw new Error(`AI provider ${cfg.provider} returned no stream body`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let reasoning = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nlIdx).trim();
        buffer = buffer.slice(nlIdx + 1);
        if (!line || line.startsWith(":")) continue; // SSE comment / keep-alive
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          const delta = evt?.choices?.[0]?.delta;
          if (typeof delta?.content === "string" && delta.content.length > 0) {
            full += delta.content;
            onDelta?.(delta.content);
          } else if (typeof delta?.reasoning === "string") {
            // reasoning models — buffered silently, never streamed to users
            reasoning += delta.reasoning;
          }
        } catch {
          // malformed SSE line — skip
        }
      }
    }

    const text = (full || reasoning).trim();
    if (!text) {
      throw new Error(`AI provider ${cfg.provider} returned an empty stream`);
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Test that the configured provider responds. Returns a short sample message
 * on success, or throws on failure.
 */
export async function testConnection(
  override?: Partial<AIConfig> | null,
): Promise<{ ok: true; sample: string; provider: AIProvider; model: string }> {
  const sample = await callAI(
    "Reply with the single word: PONG",
    { temperature: 0, maxTokens: 10, timeoutMs: 15_000 },
    override,
  );
  const cfg = mergeOverride(override)!;
  return { ok: true, sample, provider: cfg.provider, model: cfg.model };
}

/**
 * Parse a JSON response from any LLM. Handles:
 * - Plain JSON
 * - ```json fenced blocks
 * - JSON embedded inside surrounding prose (extracts the outermost {…} or […])
 * - Truncated JSON (auto-closes any open {/[/") — useful when the LLM hits
 * max_tokens mid-response and we want to salvage as much as possible.
 */
export function parseJSON<T = unknown>(text: string): T | null {
  if (!text) return null;
  let cleaned = text.trim();

  // Strip ```json … ``` or ``` … ``` fences.
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();

  // Find the outermost {…} or […].
  const open = cleaned.search(/[{[]/);
  if (open === -1) return null;
  const openChar = cleaned[open];
  const closeChar = openChar === "{" ? "}" : "]";

  // First try strict parsing of the slice between the first opener and the
  // last closer — this is the happy path.
  const close = cleaned.lastIndexOf(closeChar);
  if (close !== -1 && close > open) {
    const slice = cleaned.slice(open, close + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      // fall through to truncation repair
    }
  }

  // Truncation repair: take everything from the first opener to the end of
  // the response, then balance the brackets/braces/quotes.
  const partial = cleaned.slice(open);
  let repaired = repairTruncatedJSON(partial);
  // Strip trailing commas inside objects/arrays: {"a":1,} → {"a":1}
  repaired = repaired.replace(/,\s*([\]}])/g, "$1");
  try {
    return JSON.parse(repaired) as T;
  } catch {
    return null;
  }
}

/**
 * Best-effort repair of truncated JSON. Closes open strings, objects, and
 * arrays. Doesn't handle every edge case (e.g. trailing commas after the
 * last complete value), but recovers most of the structured data.
 */
function repairTruncatedJSON(s: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  // PHASE 161.5 (2026-09-09, live runs 34358207261 + 34361832706): the
  // old closure-only repair could NOT fix raw control characters INSIDE
  // string values — a literal newline the model emitted in the markdown
  // field makes JSON.parse throw «Bad control character» even after every
  // bracket is closed, so article_generate failed permanently with
  // «JSON غير صالح» twice AFTER the 161.4 timeout fix. The scan now builds
  // the output incrementally and escapes control characters inside
  // strings (\n \r \t, others as \uXXXX) — turning the most common
  // soft-JSON-mode defect into a parseable document without discarding
  // any content. Outside strings the scan is byte-exact as before.
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      out += ch;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      out += ch;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        out += "\\r";
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        out += "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
      out += ch;
      continue;
    }
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      // pop matching opener if present
      for (let j = stack.length - 1; j >= 0; j--) {
        const opener = stack[j];
        if ((ch === "}" && opener === "{") || (ch === "]" && opener === "[")) {
          stack.length = j;
          break;
        }
      }
    }
    out += ch;
  }
  if (inString) out += '"'; // close dangling string
  // Close remaining open structures in reverse order.
  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === "{" ? "}" : "]";
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Free OpenRouter models — shared list                                        */
/* -------------------------------------------------------------------------- */

/**
 * Free OpenRouter models available to both execution paths.
 * Order: LARGEST/STRONGEST first.
 *
 * PHASE 177 (2026-09-11 audit): the two gemma ids (0.4% / 0% live success
 * — permanently 429'd upstream shared pool) and nemotron-3.5-lightning:free
 * (0% — «DEGRADED» 400s) were REMOVED so no future wiring can resurrect a
 * dead id from this list. Live-verified survivors only.
 *
 *   - nvidia/nemotron-3-ultra-550b-a55b : 550B total / 55B active, 1M ctx → STRONGEST (48% live)
 *   - nvidia/nemotron-3-super-120b-a12b : 120B / 12B active  → MIDDLE (48% live)
 */
export const FREE_OPENROUTER_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

/**
 * RACE multiple models in PARALLEL and return the FIRST one that succeeds.
 *
 * Uses Promise.any() — returns IMMEDIATELY when the first model responds with
 * valid text.
 *
 * STATUS (2026-08-27): its last consumer (the legacy swap route) was retired when all
 * plan swaps moved to the ai_jobs queue (GitHub Actions). The helper is kept
 * for future latency-critical paths, but NOTHING calls it today. Do not wire
 * it into new code without owner approval — the platform standard is
 * callFreeAIFallbackChain.
 *
 * Returns { text, model } on success, throws on total failure.
 */
export async function callFreeOpenRouterRace(
  prompt: string,
  options: CallAIOptions = {},
  raceCount = 3,
): Promise<{ text: string; model: string }> {
  const apiKey = getOpenRouterKey();
  const baseUrl = "https://openrouter.ai/api/v1";
  if (!apiKey) throw new Error("OPENROUTER_API not configured");

  // Pick the top N models to race (largest first, as defined in FREE_OPENROUTER_MODELS)
  const models = FREE_OPENROUTER_MODELS.slice(0, raceCount);

  // Build promises that REJECT on failure (so Promise.any can skip them)
  // and RESOLVE on success with { text, model }.
  const promises = models.map(async (model) => {
    try {
      const { text } = await callAIWithFallback(prompt, options, {
        provider: "openrouter",
        apiKey,
        model,
        baseUrl,
      });
      if (text && text.trim().length > 0) {
        return { text, model };
      }
      throw new Error(`${model}: empty response`);
    } catch (e) {
      throw new Error(`${model}: ${e instanceof Error ? e.message : e}`);
    }
  });

  try {
    // Promise.any returns as soon as the FIRST promise SUCCEEDS.
    // It rejects with AggregateError only if ALL promises reject.
    const result = await Promise.any(promises);
    return result;
  } catch (e) {
    // All failed — collect errors from the AggregateError
    const errors =
      (e instanceof AggregateError
        ? e.errors.map((err) => err.message).join("\n")
        : "") || "Unknown error";
    throw new Error(`All raced OpenRouter models failed:\n${errors}`);
  }
}


// ─────────────────────────────────────────────────────────────────────────
// UNIFIED AI FALLBACK CHAIN — OpenRouter + Groq + NVIDIA interleaved by strength
//
// OWNER DIRECTIVE (2026-08-27; NVIDIA added 2026-09-09): the ONLY sequential
// execution path in the platform. Used by EVO chat, plan generation, article
// generation (EN+AR), topic picking, research, and admin AI tools.
//
// Strategy:
//   Walk INTERLEAVED_STRONGEST_CHAIN in order — strongest model from ANY
//   provider first. If a provider's key is missing its entries are skipped.
//
// Vercel Hobby budget guarantee (60s function cap):
//   maxModels defaults to 2 and each per-model timeout is hard-clamped so
//   that  maxModels × timeoutMs ≤ 52_000ms — the chain can NEVER exceed the
//   serverless wall clock, no matter what the caller passes.
//
// Returns { text, model, provider } on success. Throws on total failure.
// ─────────────────────────────────────────────────────────────────────────

export type FallbackChainOptions = CallAIOptions & {
  /** Max entries of the interleaved chain to try (default 2). */
  maxModels?: number;
  /** "strongest" (default) = quality-first interleave.
   *  "fast"      = speed-first order for interactive streaming chat. */
  chain?: "strongest" | "fast";
  /** UNIVERSAL SWITCHER COVERAGE (2026-08-27 owner directive "نظام التبديل
   *  يتعمل لكل منظومة"): every subsystem labels its own chain calls so any
   *  log line always proves WHICH system used WHICH provider/model/key —
   *  e.g. "evo-chat", "plan:workout", "blog:content-ar". Observational
   *  only — it NEVER changes model ordering or fallback policy.
   *  (Inherited from CallAIOptions since Phase 343 — the tag now also feeds
   *  per-feature Gemini usage counters.) */
  tag?: string;
  /** Phase 89 — TRUE TOKEN STREAMING: when provided, raw content deltas
   *  stream to this callback as they arrive from the provider.
   *  Fallback contract: attempts fail over silently ONLY while nothing
   *  has been streamed yet; once the first delta reaches the user, a
   *  mid-stream failure aborts the whole chain (the caller decides what
   *  the user sees — the route sends an SSE error event). */
  onDelta?: (chunk: string) => void;
};

/** Total time budget reserved for the whole chain (Vercel Hobby-safe).
 *  Override ONLY in non-Vercel execution contexts (native GitHub Actions
 *  runner via scripts/blog-runner) by setting AI_CHAIN_TOTAL_BUDGET_MS
 *  (e.g. 180000) so full-length articles are generated without the 52s
 *  Hobby clamp. Default stays 52_000 — Vercel behavior unchanged. */
const CHAIN_TOTAL_BUDGET_MS =
  Number(process.env.AI_CHAIN_TOTAL_BUDGET_MS) || 52_000;
const DEFAULT_CHAIN_MODELS = 2;

/* ── R3 (Execution-Path Audit 2026-09-29) — Groq per-entry max_tokens clamp ──
 * Groq's free tier enforces an 8k TPM ceiling COUNTING prompt AND max_tokens.
 * Pre-R3 the guard dropped EVERY groq entry whenever the whole-request
 * estimate exceeded the window — evicting the platform's most reliable
 * provider (gpt-oss-120b, 85.3% live survival) from exactly the heaviest
 * calls (P2 content est ~8.7k · P4 review est ~10.4–11.1k · legacy
 * latin-repair ~9.5k). R3 makes the decision PER ENTRY: when the caller's
 * maxTokens does not fit, a groq entry is CLAMPED to the remaining window
 * (window − promptTokens − reserve) and STAYS in the chain as long as the
 * clamp keeps ≥ GROQ_CLAMP_FLOOR output tokens; below the floor the entry
 * is dropped exactly as before (P4-review-class payloads stay
 * openrouter/nvidia-only BY DESIGN — the floor is not met there).
 * ROLLBACK: GROQ_MAX_TOKENS_CLAMP=0 restores the pre-R3 global drop
 * verbatim (same log line, same filtering). */
const GROQ_TPM_WINDOW = 7_200; // conservative request ceiling under Groq's 8k TPM (guard heritage)
const GROQ_TPM_RESERVE = 800; // safety reserve — unchanged from the original guard formula
const GROQ_CLAMP_FLOOR = 3_800; // min output room a clamped groq entry must keep, else it is dropped

/**
 * Interleaved strongest-free-models chain.
 *
 * PHASE 177 (2026-09-11, 14-day live audit of 470 GHA runs / 1655 chain
 * attempts — owner order «الجودة القصوى»): three entries were PURGED as
 * dead weight. Their measured per-attempt success over the window:
 *   - google/gemma-4-31b-it:free        1/263  (0.4%) — Google AI Studio
 *     upstream shared pool permanently 429-rate-limited
 *   - google/gemma-4-26b-a4b-it:free    0/146  (0.0%) — same dead pool
 *   - nvidia/nemotron-3.5-lightning:free 0/26  (0.0%) — OpenRouter's Nvidia
 *     backend rejects it with 400 «DEGRADED function cannot be invoked»
 *     plus per-attempt timeouts
 * They burned ~435 chain slots in 14 days BEFORE the ladder ever reached a
 * healthy provider. Purging them = every fallback step is now live-verified
 * reachable (Groq 84.6% · NVIDIA NIM 69.8% · OpenRouter strongest-entry
 * 48.1%). Catalog ids retire silently (lesson 161.2) — re-audit by LIVE
 * CALL data before ever re-adding one.
 *
 * Order (strongest → weakest, interleaved):
 *   1. OpenRouter: nvidia/nemotron-3-ultra-550b-a55b (550B — strongest overall; 48% live)
 *   2. Groq: openai/gpt-oss-120b (120B — best live success 85.3%)
 *   3. NVIDIA: nvidia/nemotron-3-super-120b-a12b (120B MoE/12B active — NIM flagship, strong Arabic — 77.8% live)
 *   4. Groq: openai/gpt-oss-20b (20B — fast, good quality — 82.6% live)
 *   5. NVIDIA: nvidia/nemotron-3-ultra-550b-a55b (550B/55B active — strongest NIM, latency-tolerant slot)
 *   6. Groq: qwen/qwen3.6-27b (27B — good Arabic)
 *   7. OpenRouter: nvidia/nemotron-3-super-120b (120B — balanced; 47.9% live)
 *   8. Groq: compound-beta (compound system)
 *
 * Groq free tier has an 8000 TPM limit; interleave spreads load across all
 * three providers instead of exhausting one before touching the next.
 * NVIDIA NIM entries (2026-09-09, LIVE-VERIFIED against integrate.api.nvidia.com
 * with the owner key — run 34350583104): nemotron-3 ids are the DIRECT NIM twins
 * of the OpenRouter :free ids above. LESSON (161.2): the original picks
 * (meta/llama-3.3-70b-instruct · nvidia/llama-3.3-nemotron-super-49b-v1 ·
 * meta/llama-3.1-8b-instruct) went END-OF-LIFE 2026-08-26 (HTTP 410 Gone) —
 * catalog ids can retire at any time; verify by LIVE CALL, never by name.
 */
export const INTERLEAVED_STRONGEST_CHAIN: Array<{ provider: AIProvider; model: string }> = [
  // GEMINI-FIRST LAW (Phase 343, owner order 2026-10-06 «اجعله الاختيار
  // الأول»): leads the chain for the blog pipeline + AI plans whenever
  // GEMINI_API_KEY is configured (free tier). LIVE-VERIFIED 2026-10-05 via
  // the owner key (run 37384032599: v1beta/gemini-3.8-flash → 200 "OK").
  // With no key the entry is skipped without consuming attempt budget and
  // the pre-343 ladder below runs byte-identically.
  // PHASE 344 (owner order «تبديل إصدار نموذج Gemini»): the leading model
  // switched 3.8-flash → 3.5-flash — the 2026-10-06 production review
  // measured transient free-tier 503 "model overloaded" on 3.8-flash;
  // 3.5-flash is the same-tier prior stable version on the free plan.
  // GEMINI_MODEL still overrides at runtime; the ladder below is untouched.
  { provider: "gemini", model: "gemini-3.5-flash" },
  { provider: "openrouter", model: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  { provider: "groq", model: "openai/gpt-oss-120b" },
  { provider: "nvidia", model: "nvidia/nemotron-3-super-120b-a12b" },
  { provider: "groq", model: "openai/gpt-oss-20b" },
  { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b" },
  { provider: "groq", model: "qwen/qwen3.6-27b" },
  { provider: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free" },
  { provider: "groq", model: "compound-beta" },
];

/** Alternating-lead rotation counter (see callFreeAIFallbackChain below). */
let chainCallSeq = 0;
/** Round-robin cursor across configured OpenRouter accounts (dual-key pool). */
let orKeyCursor = 0;

/**
 * OWNER DIRECTIVE #1 (2026-08-27): EVO chat needs “very fast free models
 * with accurate replies”. Speed-first ordering of VERIFIED model ids only
 * (same ids as the strong chain — no untested endpoints), starting from
 * the smallest/lowest-latency entries. Interactive streaming paths opt in
 * explicitly via options.chain="fast"; default behavior is unchanged.
 *
 * PHASE 177 (2026-09-11 audit): purged the two dead entries
 * (openrouter/nemotron-3.5-lightning:free 0/26 «DEGRADED» 400s ·
 * openrouter/google/gemma-4-26b-a4b-it:free 0/146 upstream 429s) and
 * promoted groq/gpt-oss-120b (85.3% live success — the platform's best)
 * ABOVE nvidia/lightning-30b-a3b (33.3% live): gpt-oss-120b rides Groq's
 * LPU so its TTFT (~1-2s) still honors the speed law while its accuracy
 * is strictly better. lightning-30b-a3b keeps a slot as the Groq-quota
 * relief valve. Small chat payloads fit Groq's 8k TPM easily, so two
 * consecutive Groq entries up front are safe (a 429 falls through fast).
 */
export const INTERLEAVED_FAST_CHAIN: Array<{ provider: AIProvider; model: string }> = [
  // GEMINI-FIRST LAW (Phase 343, owner order 2026-10-06): EVO chat tries
  // Gemini first when GEMINI_API_KEY is configured (streamGenerateContent
  // SSE — TTFT comparable to Groq's LPU in live smoke). Fallback ladder
  // below is untouched; no key → entry skipped, groq leads as before.
  // PHASE 344: model switched 3.8-flash → 3.5-flash with the strongest
  // chain (same measured 503-overload evidence; GEMINI_MODEL still wins).
  { provider: "gemini", model: "gemini-3.5-flash" },
  { provider: "groq", model: "openai/gpt-oss-20b" }, // smallest — usually <1s TTFT (82.6% live)
  { provider: "groq", model: "openai/gpt-oss-120b" }, // quality slot, still LPU-fast (85.3% live)
  { provider: "nvidia", model: "nvidia/nemotron-3.5-lightning-30b-a3b" }, // NIM fast (3B active — 33.3% live)
  { provider: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free" }, // provider diversity tail (47.9% live)
];

export async function callFreeAIFallbackChain(
  prompt: string,
  options: FallbackChainOptions = {},
  _maxOpenRouterModels?: number, // DEPRECATED third arg — superseded by options.maxModels; still honored if provided for backward compat
): Promise<{ text: string; model: string; provider: string }> {
  const errors: string[] = [];

  // Log prefix carrying the calling subsystem's tag (universal coverage).
  const LP =
    "[ai-fallback-chain]" + (options.tag ? ` [${options.tag}]` : "");

  const openrouterKeys = getOpenRouterKeys();
  const groqKey = getGroqKey();
  const nvidiaKey = getNvidiaKey();
  const geminiKey = getGeminiKey();

  if (
    openrouterKeys.length === 0 &&
    !groqKey &&
    !nvidiaKey &&
    !geminiKey
  ) {
    throw new Error(
      "[ai-fallback-chain] No AI providers configured. Set OPENROUTER_API and/or GROQ_API_KEY and/or NVIDIA_API_KEY and/or GEMINI_API_KEY.",
    );
  }

  // ── PROVIDER-LEAD ROTATION (2026-08-27 owner directive "parallel or alternating"; 3-way since 2026-09-09) ──
  // Every call rotates which provider LEADS the chain: openrouter → groq →
  // nvidia → openrouter … Without this, entry #1 of
  // INTERLEAVED_STRONGEST_CHAIN (a strong OpenRouter model) succeeds almost
  // every time → the other providers are never reached and their free
  // budgets idle while OpenRouter's ~50/day free ceiling burns. With
  // rotation, each provider's own strength order stays intact and the load
  // is spread across ALL configured keys. Lead slots of unconfigured
  // providers degrade gracefully (the next configured provider's first
  // entry simply leads). The fast chain keeps groq-first (speed law) and
  // never rotates.
  chainCallSeq += 1;

  // GROQ BIG-PAYLOAD GUARD — R3 per-entry clamp (2026-09-29; hard data from
  // dispatch logs): Groq free tier enforces an 8000 TPM ceiling COUNTING both
  // prompt and max_tokens (observed 413s: 'Requested 16664', 'Requested
  // 9094'). Pre-R3: est > 7200 dropped ALL groq entries for the call. R3:
  // each groq entry's max_tokens is clamped to the remaining window when the
  // caller's maxTokens would not fit — the entry survives only while the
  // clamp keeps ≥ GROQ_CLAMP_FLOOR output room; below the floor (P4-review
  // payloads ~10.4–11.1k est) the entry is dropped as before. Normal-sized
  // calls are untouched. GROQ_MAX_TOKENS_CLAMP=0 = pre-R3 behavior verbatim.
  const promptTokens = Math.ceil(prompt.length / 4);
  const estTokens =
    promptTokens + (options.maxTokens ?? DEFAULT_CHAIN_MODELS * 1024) + 800;
  const groqWindow = GROQ_TPM_WINDOW - promptTokens - GROQ_TPM_RESERVE;
  const groqClampOn = process.env.GROQ_MAX_TOKENS_CLAMP !== "0";
  const skipGroq =
    options.chain !== "fast" &&
    estTokens > GROQ_TPM_WINDOW &&
    (!groqClampOn || groqWindow < GROQ_CLAMP_FLOOR);
  // Per-entry max_tokens for surviving groq entries (undefined = caller's own).
  const groqClampTokens =
    options.chain !== "fast" && !skipGroq && estTokens > GROQ_TPM_WINDOW
      ? groqWindow
      : undefined;
  if (skipGroq) {
    console.log(
      `${LP} payload ~${estTokens}t exceeds Groq 8k TPM window → openrouter/nvidia-only for this call`,
    );
  } else if (groqClampTokens !== undefined) {
    console.log(
      `${LP} payload ~${estTokens}t exceeds Groq 8k TPM window → R3 clamp: groq entries kept with max_tokens ${groqClampTokens}t (floor ${GROQ_CLAMP_FLOOR})`,
    );
  }

  type ChainEntry = { provider: AIProvider; model: string; maxTokens?: number };
  let activeChain0: ChainEntry[] =
    options.chain === "fast" ? INTERLEAVED_FAST_CHAIN : INTERLEAVED_STRONGEST_CHAIN;
  if (options.chain !== "fast") {
    if (geminiKey) {
      // GEMINI-FIRST LAW (Phase 343, owner order 2026-10-06 «اجعله الاختيار
      // الأول»): with the gemini key configured, gemini leads the chain for
      // blog + plans (and EVO via the fast chain) on EVERY call — the 3-way
      // lead rotation is SUSPENDED. The ladder after the gemini entry, the
      // dual-key pool, and the Groq R3 clamp below are untouched; removing
      // the key restores the pre-343 rotation verbatim (chainCallSeq keeps
      // counting so the rotation resumes in phase).
      console.log(
        `${LP} gemini-first (owner 2026-10-06): ${process.env.GEMINI_MODEL || "gemini-3.5-flash"} leads, rotation suspended (call #${chainCallSeq}, orKeys=${openrouterKeys.length})`,
      );
    } else {
      const LEAD_SEQ: AIProvider[] = ["openrouter", "groq", "nvidia"];
      const leadProvider = LEAD_SEQ[(chainCallSeq - 1) % LEAD_SEQ.length];
      const leadConfigured =
        leadProvider === "openrouter"
          ? openrouterKeys.length > 0
          : leadProvider === "groq"
            ? !!groqKey && !skipGroq
            : !!nvidiaKey;
      if (leadConfigured && leadProvider !== "openrouter") {
        const firstIdx = activeChain0.findIndex((e) => e.provider === leadProvider);
        if (firstIdx > 0) {
          activeChain0 = [
            activeChain0[firstIdx],
            ...activeChain0.slice(0, firstIdx),
            ...activeChain0.slice(firstIdx + 1),
          ];
        }
      }
      console.log(
        `${LP} lead=${leadConfigured ? leadProvider : "openrouter(fallback)"} (call #${chainCallSeq}, orKeys=${openrouterKeys.length})`,
      );
    }
    if (skipGroq) activeChain0 = activeChain0.filter((e) => e.provider !== "groq");
    // R3: surviving groq entries carry their own clamped max_tokens; every
    // other entry keeps the caller's value (byte-identical to pre-R3).
    if (groqClampTokens !== undefined) {
      activeChain0 = activeChain0.map((e) =>
        e.provider === "groq" ? { ...e, maxTokens: groqClampTokens } : e,
      );
    }
  }

  // Ops knob: GEMINI_MODEL swaps the gemini arm's model at runtime (no
  // deploy) — e.g. falling back to gemini-2.5-flash if 3.8-flash is busy.
  const geminiModelOverride = (process.env.GEMINI_MODEL || "").trim();
  if (geminiModelOverride) {
    activeChain0 = activeChain0.map((e) =>
      e.provider === "gemini" ? { ...e, model: geminiModelOverride } : e,
    );
  }

  // ── Time-budget enforcement (Vercel Hobby guarantee) ──────────────────
  const requestedModels =
    options.maxModels ??
    (typeof _maxOpenRouterModels === "number" && _maxOpenRouterModels > 0
      ? _maxOpenRouterModels
      : DEFAULT_CHAIN_MODELS);
  const maxModels = Math.max(1, Math.min(requestedModels, activeChain0.length));
  const callerTimeoutMs = options.timeoutMs ?? 60_000;
  // Clamp so that maxModels × effTimeout ≤ budget AND never exceeds caller intent.
  const effTimeoutMs = Math.min(callerTimeoutMs, Math.floor(CHAIN_TOTAL_BUDGET_MS / maxModels));

  const { maxModels: _omit, timeoutMs: _omit2, chain: _omit3, ...callOptions } = options;

  /** Quota/auth-style failures justify burning another KEY on the SAME model. */
  const looksLikeQuota = (m: string) => /\b(401|402|429|403)\b|quota|rate.?limit|credit|insufficient/i.test(m);

  let attempted = 0;
  for (const { provider, model, maxTokens: entryMaxTokens } of activeChain0) {
    if (attempted >= maxModels) break;

    const baseUrl = AI_PROVIDERS[provider].baseUrl;
    // DUAL-KEY POOL rotation: round-robin across every configured OpenRouter
    // account so the ~50/day free ceiling is shared instead of burned on one.
    let candidateKeys: string[] = [];
    if (provider === "openrouter" && openrouterKeys.length > 0) {
      const first = openrouterKeys[orKeyCursor++ % openrouterKeys.length];
      candidateKeys = [first, ...openrouterKeys.filter((k) => k !== first)];
    } else if (provider === "groq" && groqKey) {
      candidateKeys = [groqKey];
    } else if (provider === "nvidia" && nvidiaKey) {
      candidateKeys = [nvidiaKey];
    } else if (provider === "gemini" && geminiKey) {
      candidateKeys = [geminiKey];
    }
    if (candidateKeys.length === 0) {
      errors.push(`${provider}/${model}: key not configured`);
      continue;
    }
    attempted++;

    // R3 per-entry options: a clamped groq entry sends its OWN max_tokens;
    // all other entries send exactly the caller's options (unchanged).
    const attemptOptions =
      entryMaxTokens !== undefined && entryMaxTokens !== callOptions.maxTokens
        ? { ...callOptions, maxTokens: entryMaxTokens }
        : callOptions;

    // Inner key-fallback loop ONLY triggers on auth/quota-style errors —
    // ordinary failures fall through to the next MODEL as before.
    // EMPTY-RESPONSE RETRY (2026-08-27): OpenRouter's free pool frequently
    // swallows a request and returns 200-with-empty-content; an immediate
    // identical retry very often succeeds. Retry each entry ONCE on empty.
    for (const apiKey of candidateKeys) {
      for (let attemptNo = 0; attemptNo < 2; attemptNo++) {
        // Phase 89 streaming: when the caller passed onDelta, this attempt
        // streams raw deltas through the chain-level callback. attemptStreamed
        // marks that THIS attempt already pushed tokens to the user — after
        // that, a failure must abort the chain (no silent model switch that
        // would splice two different answers into one visible stream).
        let attemptStreamed = false;
        const streamTap = options.onDelta
          ? (chunk: string) => {
              attemptStreamed = true;
              options.onDelta?.(chunk);
            }
          : undefined;
        try {
          const { text } = streamTap
            ? {
                text: await callAIStream(
                  prompt,
                  { ...attemptOptions, timeoutMs: effTimeoutMs },
                  { provider, apiKey, model, baseUrl },
                  streamTap,
                ),
              }
            : await callAIWithFallback(
                prompt,
                { ...attemptOptions, timeoutMs: effTimeoutMs },
                {
                  provider,
                  apiKey,
                  model,
                  baseUrl,
                },
              );
          if (text && text.trim().length > 0) {
            console.log(
              `${LP} ${provider}/${model} succeeded${attemptNo ? " (after empty-retry)" : ""}${streamTap ? " (streamed)" : ""}`,
            );
            return { text: text.trim(), model, provider };
          }
          throw new Error(`${model}: empty response`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`${provider}/${model}: ${msg}`);
          if (attemptStreamed) {
            // Mid-stream failure AFTER user-visible tokens — rethrow so the
            // caller can decide (route sends an SSE error event; the client
            // keeps the partial text).
            throw new Error(
              `[ai-fallback-chain] stream failed mid-way on ${provider}/${model}: ${msg}`,
            );
          }
          console.warn(`${LP} ${provider}/${model} notice, trying next:`, msg);
        }
        const lastErr = errors[errors.length - 1] || "";
        const isEmpty = /empty response/i.test(lastErr);
        if (isEmpty && attemptNo === 0 && provider === "openrouter") {
          console.log(`${LP} empty response → one immediate retry of ${provider}/${model}`);
          continue;
        }
        break;
      }
      // Only a quota/auth problem on OpenRouter justifies switching ACCOUNT;
      // everything else falls through to the next model in the chain.
      const lastErr = errors[errors.length - 1] || "";
      if (!looksLikeQuota(lastErr) || provider !== "openrouter") break;
      if (!candidateKeys.some((k) => k !== apiKey)) break;
      console.log(`${LP} quota/auth error → switching OpenRouter account for ${model}`);
    }
  }

  // All providers failed
  const finalError = new Error(
    `[ai-fallback-chain] All AI providers failed.` +
      (options.tag ? ` (system: ${options.tag})\n` : "\n") +
      `OpenRouter keys configured: ${openrouterKeys.length}.\n` +
      `Groq key: ${groqKey ? "present" : "MISSING"}.\n` +
      `NVIDIA key: ${nvidiaKey ? "present" : "MISSING"}.\n` +
      `Gemini key: ${geminiKey ? "present" : "MISSING"}.\n` +
      `Errors:\n  - ${errors.join("\n  - ")}`,
  );
  console.error(finalError.message);
  throw finalError;
}
