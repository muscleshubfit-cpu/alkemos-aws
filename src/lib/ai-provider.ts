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
 * (Google AI Studio auth key, FREE tier, env: GEMINI_API_KEY) on the
 * NATIVE generativelanguage REST API (NOT OpenAI-compatible): the
 * translation adapters are the only native-shape code in the platform and
 * live below (callAI / callAIStream branch on provider === "gemini").
 * Model override: GEMINI_MODEL. Usage of the free tier is tracked per-tag
 * to Upstash (src/lib/ai-usage-gemini.ts) feeding
 * docs/ai/gemini-weekly-usage-report.md (weekly workflow
 * gemini-weekly-usage-report.yml).
 *
 * GEMINI-FIRST LAW (343) — CANCELLED (owner order 2026-10-31, Phase 5-A
 * «إلغاء قانون Gemini-First نهائيًا، بما يشمل السلاسل الثقيلة، وإزالة أي
 * أولوية إجبارية لـ Gemini دون المساس بضوابط جودة المخرجات»): gemini
 * entries NO LONGER lead either chain — the 3-way lead rotation
 * (openrouter → groq → nvidia) runs on EVERY strongest-chain call again,
 * and gemini rides both ladders as an ordinary TAIL entry (positioned on
 * measured AVAILABILITY — 66/271 weekly success = 24.4%, the worst of the
 * four providers — while its OUTPUT quality stays a valid last-resort
 * lottery ticket under the QUALITY-FIRST law). The native adapter, the
 * GEMINI_MODEL knob, the usage tracker and the dormant grounded arm all
 * STAY; only the forced priority is gone. In the grounded-search walk the
 * gemini googleSearch arm is the DORMANT LAST arm (0/114 measured — see
 * callGroundedSearch).
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
import {
  activeCooldowns,
  classifyForCooldown,
  cooldownState,
  markCooldown,
} from "./ai-provider-cooldown";

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
 * bills quota per MODEL FAMILY, so the ladder walks the override/default
 * first, then alternate grounded-capable models across FAMILIES (flash →
 * pro → flash-lite); EVERY attempt is a REAL grounded googleSearch call
 * (the honest ungrounded-200 gate runs per attempt), so no fake/curated
 * substitute can ever masquerade as research. All models exhausted →
 * one honest aggregate error (the caller's ×3 retry rides transient 5xx).
 * Live-probed 2026-10-16 (run 38833407195): gemini-2.5-flash answers 404
 * «no longer available to new users» — retired from the ladder; gemini-3.8-pro
 * retired 2026-10-20 the same way (404 on the live key — see the ladder).
 * Ops knob: GEMINI_GROUNDED_MODELS (comma-separated) replaces the
 * built-in tail without a deploy. */
export const GEMINI_GROUNDED_MODEL_LADDER: readonly string[] = [
  // (the registry default — gemini-3.5-flash — always leads the ladder;
  //  it is prepended by callGeminiGroundedSearch below, not listed here)
  "gemini-3.8-flash", // current-gen flash (its 404 advisory names it) — own bucket
  // "gemini-3.8-pro" REMOVED 2026-10-20 (BLOG-RECOVERY): 404 «models/
  // gemini-3.8-pro is not found for API version v1beta» on the live key —
  // measured 2026-10-16 (run 38834723820) and again on every daily since
  // (39403516194 …). A dead id burns one grounded attempt per walk and
  // pollutes the cooldown registry with a gone-class entry. Ops knob:
  // GEMINI_GROUNDED_MODELS re-adds it without a deploy if a future key/
  // project ever carries it.
  "gemini-3.5-flash-lite", // lite family — separate quota bucket, historically most available
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

/** BLOG-RECOVERY 2026-10-16 (RC2 relief) — DUAL-KEY POOL for the grounded
 * ladder (the OpenRouter dual-key precedent, applied where it bites):
 * Gemini bills the Google-Search grounding quota PER PROJECT, and the
 * live probe (runs 38833407195 + 38834723820 vs aws-ai-test 38835797657)
 * measured the primary project's grounded quota drained across every
 * model family while NON-grounded calls on the same key kept succeeding.
 * A second free-tier key (GEMINI_API_KEY2, a NEW Google project) carries
 * an INDEPENDENT grounded bucket — the owner adds one secret and P0
 * resumes without any further code. Absent/empty = single-key behavior
 * byte-identical to the pre-relief ladder. */
export function getGeminiGroundedKeys(): string[] {
  const keys = [process.env.GEMINI_API_KEY || "", process.env.GEMINI_API_KEY2 || ""]
    .map((k) => k.trim())
    .filter(Boolean);
  return [...new Set(keys)];
}

export async function callGeminiGroundedSearch(
  prompt: string,
  options: CallAIOptions = {},
): Promise<GeminiGroundedSearchResult> {
  const keys = getGeminiGroundedKeys();
  if (keys.length === 0) {
    throw new Error(
      "callGeminiGroundedSearch: GEMINI_API_KEY is not configured — real Google-Search grounding is unavailable, and no simulated/curated substitute is allowed (owner order 2026-10-06).",
    );
  }
  const candidates = groundedModelCandidates();
  const failures: string[] = [];
  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    for (const model of candidates) {
      const cfg: AIConfig = {
        provider: "gemini",
        apiKey: keys[keyIdx],
        model,
        baseUrl: AI_PROVIDERS.gemini.baseUrl,
      };
      // BLOG-PROVIDER-FAILOVER (owner order 2026-10-16 «تجنب تكرار
      // المحاولات الفاشلة»): a key×model pair that already answered with an
      // exhaustion-class error in this window is SKIPPED without a network
      // call — the futile 429 re-walk (8 attempts × 3 step-retries, measured
      // on the 2026-10-16 recovery runs) collapses to an instant honest
      // skip. Registry is OPT-IN via AI_PROVIDER_COOLDOWN_MS (canary law —
      // absent env = byte-identical ladder walk).
      const cdScope = `grounded:gemini:key#${keyIdx + 1}:${model}`;
      const cd = cooldownState(cdScope);
      if (cd) {
        failures.push(
          `[key#${keyIdx + 1} ${model}] quota-cooldown until ${new Date(cd.until).toISOString()} (${cd.reason}) — skipped, no call made`,
        );
        console.warn(
          `[gemini-grounded] key#${keyIdx + 1} ${model} in quota-cooldown → skipped (${cd.reason.slice(0, 120)})`,
        );
        continue;
      }
      try {
        const { text, grounding } = await callGeminiGenerate(cfg, prompt, {
          ...options,
          googleSearch: true,
        });
        if (failures.length > 0) {
          console.warn(
            `[gemini-grounded] key#${keyIdx + 1} ${model} succeeded after ${failures.length} earlier key/model failure(s)`,
          );
        }
        return { text, provider: "gemini", model, grounding };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        failures.push(`[key#${keyIdx + 1} ${model}] ${msg.slice(0, 240)}`);
        // Exhaustion-class failure (429 quota / 402 payment / 401-403 auth /
        // 404 model-gone) → cool this key×model for the window; transient
        // (5xx/timeout/empty) stays retryable as before.
        const cls = classifyForCooldown(msg);
        if (cls) {
          markCooldown(cdScope, `${cls}: ${msg.slice(0, 120)}`);
        }
        const nextModel =
          candidates.indexOf(model) < candidates.length - 1
            ? candidates[candidates.indexOf(model) + 1]
            : keys.length - 1 > keyIdx
              ? `${candidates[0]} (next key)`
              : null;
        console.warn(
          `[gemini-grounded] key#${keyIdx + 1} ${model} failed${nextModel ? ` → trying ${nextModel}` : " (last ladder entry)"}: ${msg.slice(0, 180)}`,
        );
      }
    }
  }
  throw new Error(
    `callGeminiGroundedSearch: ALL grounded models failed across every configured key (${keys.length} key(s) × ${candidates.join(", ")}) — no simulated/curated substitute is allowed (owner order 2026-10-06). Per-attempt errors: ${failures.join(" | ")}`,
  );
}

/* ───────────────────────────────────────────────────────────────────────
 * CROSS-PROVIDER GROUNDED SEARCH (BLOG-PROVIDER-FAILOVER 2026-10-16,
 * owner order «افحص وأصلح آلية التبديل التلقائي بين مزوّدي الذكاء
 * الاصطناعي الحاليين (Gemini / OpenRouter / Groq / NVIDIA) في منظومة
 * المدونة … افحص دعم البحث المُسنَد لدى كل مزوّد، ولا تستبدله بتوليد
 * عادي أو نتائج وهمية»).
 *
 * Grounded-search capability, measured per provider:
 *   • Gemini     — NATIVE Google-Search grounding (tools:[{googleSearch:{}}])
 *                  → callGeminiGroundedSearch above (arm 1).
 *   • OpenRouter — REAL web search via the documented `web` plugin
 *                  (plugins:[{id:"web"}]) riding chat/completions; the
 *                  response carries URL `annotations` as the live-search
 *                  evidence → callOpenRouterGroundedSearch (arm 2). The
 *                  plugin bills per-search credits on the EXISTING key —
 *                  a 402 "insufficient credits" fails HONESTLY and falls
 *                  through (never a plain-generation substitute).
 *   • Groq       — REAL live web search via the `browser_search`
 *                  built-in tool on the GPT-OSS reasoning models
 *                  (GROQ-2 2026-10-17: Groq DECOMMISSIONED the compound
 *                  system — groq/compound + compound-mini — on
 *                  2026-09-21, so the old `compound-beta` entry 404s
 *                  permanently; live account model list run 38844967928
 *                  holds ZERO compound ids); the documented successor
 *                  is the browser_search tool, whose agentic live-web
 *                  walk returns citation URLs →
 *                  callGroqGroundedSearch (arm 3). The extractor accepts
 *                  citations at every documented location (message.citations,
 *                  message.annotations, root citations, x_groq.citations).
 *   • NVIDIA NIM — NO native web-search tool in its OpenAI-compatible
 *                  chat API → EXCLUDED FROM THE GROUNDED PATH BY DESIGN.
 *                  NVIDIA stays a full generation-chain provider; putting
 *                  an ungrounded NIM answer into the research step would
 *                  be exactly the «توليد عادي» the owner forbade.
 *
 * EVERY arm enforces the same HONEST EVIDENCE GATE as the gemini arm: a
 * 200 answer with NO live-search evidence (annotation/citation URLs)
 * FAILS — model memory can never masquerade as research. All arms
 * exhausted → ONE honest aggregate error. No simulated/curated
 * substitute exists anywhere in this path (owner order 2026-10-06).
 * ─────────────────────────────────────────────────────────────────────── */

/** Cross-provider grounded-search result — same contract the gemini arm
 *  returns; `provider`/`model` name the arm that actually answered.
 *  PHASE 5-A (owner order 2026-10-31): `provider` widens to include
 *  "tavily" — the search-API arm answers under its own id while `model`
 *  names the SYNTHESIS model that produced the text (Tavily itself is a
 *  search/extraction API, never a generator — the Phase-4 §5 provider
 *  law). */
export type GroundedSearchArmProvider = AIProvider | "tavily";

export type GroundedSearchResult = {
  text: string;
  provider: GroundedSearchArmProvider;
  model: string;
  grounding: GeminiGrounding;
};

/** Options for the cross-provider grounded search (PHASE 5-A, owner order
 *  2026-10-31 «نفّذ المرحلة (أ)…ذراع البحث Tavily وفق §10»): search-only
 *  arms (Tavily) need the caller's CONCISE search query — the research
 *  prompt itself is a generation brief, not a search string («تمرير
 *  الاستعلام المناسب» §10-أ); `lang` feeds the §6-أ language-split arm
 *  ladder (Phase B will lead EN with Exa). */
export type GroundedSearchOptions = CallAIOptions & {
  /** Concise, language-appropriate REAL search query for search-API arms. */
  searchQuery?: string;
  /** Language of the research (§6-أ ladder split). */
  lang?: "ar" | "en";
};

/** OpenRouter web-search plugin body — a REAL search ride-along: the
 *  model's answer is grounded on live web results and the response
 *  carries URL annotations as evidence. */
const OPENROUTER_WEB_PLUGIN = { id: "web", max_results: 5 } as const;

/** Default model for the OpenRouter grounded arm (an existing live-verified
 *  free-chain id — balanced quality/latency for search-grounded JSON).
 *  Ops knob: OPENROUTER_GROUNDED_MODEL swaps it without a deploy. */
export const OPENROUTER_GROUNDED_DEFAULT_MODEL =
  "nvidia/nemotron-3-super-120b-a12b:free";

export function getOpenRouterGroundedModel(): string {
  return (
    (process.env.OPENROUTER_GROUNDED_MODEL || "").trim() ||
    OPENROUTER_GROUNDED_DEFAULT_MODEL
  );
}

/** Default model for the Groq grounded arm. GROQ-2 (2026-10-17): Groq
 *  decommissioned the compound system (groq/compound + compound-mini) on
 *  2026-09-21 — every `compound-beta` call now 404s (live-measured runs
 *  38844967928 + 39019592155; the account's live model list holds zero
 *  compound ids). The platform-documented successor for REAL live web
 *  search is the `browser_search` built-in tool, supported by the GPT-OSS
 *  reasoning models — both ladder ids below are live-verified platform
 *  generation-chain entries (gpt-oss-120b 85.3% live survival, 20b 82.6%).
 *  Ops knob: GROQ_GROUNDED_MODEL swaps the leader without a deploy. */
export const GROQ_GROUNDED_DEFAULT_MODEL = "openai/gpt-oss-120b";

/** Fallback tail for the Groq grounded ladder — each entry is a REAL
 *  browser_search call on a distinct live-verified model (separate TPM
 *  headroom). Ops knob: GROQ_GROUNDED_MODELS (comma-separated) replaces
 *  the whole tail without a deploy. */
export const GROQ_GROUNDED_MODEL_LADDER: readonly string[] = [
  "openai/gpt-oss-20b", // smaller sibling — 82.6% live, separate TPM bucket
  // BLOG-RECOVERY-2 round-4 (2026-10-20, live run 39495419206): the
  // round-3 candidate openai/gpt-oss-safeguard-20b was REMOVED — it
  // supports browser_search on SMALL asks (the probe's one-sentence
  // question walked fine) but the REAL P0 research prompt (~4.5k tokens
  // + max_tokens 5000 + the walk's growing browser context) exceeds its
  // context window: 413 «Request too large for model …safeguard-20b»
  // on the very first request, every time — structurally unfit for
  // this path. It stays available for smaller jobs via the
  // GROQ_GROUNDED_MODELS ops knob. (qwen3.8-27b and allam-2-7b were
  // live-measured OUT in round 2: 400 «tools[0].type must be one of
  // [function, mcp]» — no browser_search support at all.)
];

export function getGroqGroundedModel(): string {
  return (
    (process.env.GROQ_GROUNDED_MODEL || "").trim() ||
    GROQ_GROUNDED_DEFAULT_MODEL
  );
}

/** Full Groq grounded ladder: GROQ_GROUNDED_MODEL override leads, then the
 *  built-in tail (or the GROQ_GROUNDED_MODELS env tail). Mirrors the gemini
 *  grounded-ladder law (GROQ-2): one drained/dead id falls through to the
 *  next REAL browser_search call; all exhausted → one honest error. */
function groqGroundedModelCandidates(): string[] {
  const override = (process.env.GROQ_GROUNDED_MODEL || "").trim();
  const envLadder = (process.env.GROQ_GROUNDED_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const tail = envLadder.length > 0 ? envLadder : GROQ_GROUNDED_MODEL_LADDER;
  return [...new Set([override || GROQ_GROUNDED_DEFAULT_MODEL, ...tail])];
}

/** Extract {title,url} sources from an OpenRouter `annotations` array.
 *  LIVE-MEASURED shape (run 38844582803): the plugin answers OpenAI-style
 *  citations — `{type:"url_citation", url_citation:{url,title}}` — and the
 *  documented flat shape `{type:"url", url, title}` may also appear. Both
 *  are read; entries without a usable URL (whatever their type) are
 *  dropped. Deduped by URL, capped at 12. */
function urlSourcesFromAnnotations(annotations: unknown): GeminiGroundingSource[] {
  if (!Array.isArray(annotations)) return [];
  const out: GeminiGroundingSource[] = [];
  const seen = new Set<string>();
  for (const a of annotations) {
    const r = (typeof a === "object" && a !== null ? a : {}) as {
      url?: unknown;
      title?: unknown;
      url_citation?: { url?: unknown; title?: unknown } | null;
      citation?: { url?: unknown; title?: unknown } | null;
    };
    const nested = r.url_citation ?? r.citation ?? null;
    const url =
      typeof r.url === "string"
        ? r.url.trim()
        : typeof nested?.url === "string"
          ? nested.url.trim()
          : "";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({
      title:
        typeof r.title === "string"
          ? r.title.trim()
          : typeof nested?.title === "string"
            ? nested.title.trim()
            : "",
      url,
    });
    if (out.length >= 12) break;
  }
  return out;
}

/** Extract {title,url} sources from a Groq citations array — entries may
 *  be plain URL strings or {url,title} objects. Deduped, capped at 12. */
function urlSourcesFromCitations(citations: unknown): GeminiGroundingSource[] {
  if (!Array.isArray(citations)) return [];
  const out: GeminiGroundingSource[] = [];
  const seen = new Set<string>();
  for (const c of citations) {
    let url = "";
    let title = "";
    if (typeof c === "string") {
      url = c.trim();
    } else if (typeof c === "object" && c !== null) {
      const r = c as { url?: unknown; link?: unknown; title?: unknown };
      url = typeof r.url === "string" ? r.url.trim() : typeof r.link === "string" ? r.link.trim() : "";
      title = typeof r.title === "string" ? r.title.trim() : "";
    }
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ title, url });
    if (out.length >= 12) break;
  }
  return out;
}

/** Merge + dedupe source lists from several response locations. */
function mergeDedupedSources(...lists: GeminiGroundingSource[][]): GeminiGroundingSource[] {
  const out: GeminiGroundingSource[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const s of list) {
      if (!s.url || seen.has(s.url)) continue;
      seen.add(s.url);
      out.push(s);
      if (out.length >= 12) return out;
    }
  }
  return out;
}

/* ───────────────────────────────────────────────────────────────────────
 * ARM 1 — TAVILY SEARCH API (PHASE 5-A, owner order 2026-10-31 «ابدأ
 * المرحلة الخامسة — تنفيذ ذراع البحث Tavily» — executing the Phase-4
 * §6-أ/§12-1 approved design, the §10-أ frame). Tavily is a SEARCH /
 * EXTRACTION provider, never a generator (the Phase-4 §5 provider law —
 * Tavily and Exa are search arms only): the arm therefore composes TWO
 * honest stages —
 *   (1) a REAL basic search (1 credit on the Researcher plan's 1000/month
 *       cap; Phase-3 measured 8/8 ok, 10/11 directly-relevant Arabic
 *       results, avg 1807ms) whose live result URLs ARE the evidence;
 *   (2) a research-JSON synthesis call on the ORDINARY generation chain
 *       (callFreeAIFallbackChain — the post-Gemini-first rotation ladder)
 *       grounded on the REAL snippets + raw_content passed in the prompt.
 * The SEARCH itself is independent of LLM quotas (Tavily credits) — P0 no
 * longer depends on search-capable chat models alone (the P0-1/P0-2 root
 * cause: gemini grounding unavailable on the free tier, OR web arm dead
 * 404 + paid 402, leaving Groq browser_search the only live arm).
 * EVIDENCE GATE (law 344, identical to every arm): a 200 answer with ZERO
 * usable result URLs is NOT research — honest failure, the walk moves to
 * the next arm. Cooldown law: 429/402/401/403/404-class failures cool the
 * `grounded:tavily` scope for the window like every arm.
 * ROLLBACK (§10-أ): remove the arm from the ladder (one line in
 * groundedArmOrder) or stop passing TAVILY_API_KEY to the workflows —
 * the key-absent arm fails honestly and the walk degrades to groq as
 * before. NO paid service is ever called (basic search only — the
 * free-tier law).
 * ─────────────────────────────────────────────────────────────────────── */

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
/** Tavily's documented query cap — the fallback clip for arm callers that
 *  pass no dedicated searchQuery. */
const TAVILY_QUERY_MAX_CHARS = 400;
/** Per-result raw_content excerpt cap in the synthesis prompt — bounds the
 *  synthesis payload while keeping real evidence depth (Phase-3 measured
 *  raw_content up to 22,155 chars per result — must be clipped). */
const TAVILY_RAW_EXCERPT_CHARS = 1_200;

/** TAVILY (Phase 5-A — search-arm key, the Phase-3 owner-created secret):
 * Researcher plan, free, no card. Consumed by callTavilySearch ONLY — it
 * is never a generation provider and never enters the chains. */
export function getTavilyKey(): string {
  return process.env.TAVILY_API_KEY || "";
}

/** Search-depth ops knob — "basic" = 1 credit (default, the measured
 *  Phase-3 shape); "advanced" = 2 credits (owner opt-in, no deploy). */
export function getTavilySearchDepth(): "basic" | "advanced" {
  return process.env.TAVILY_SEARCH_DEPTH === "advanced" ? "advanced" : "basic";
}

/** Max-results ops knob (default 10 — the Phase-3 battery shape). */
export function getTavilyMaxResults(): number {
  const raw = Number(process.env.TAVILY_MAX_RESULTS);
  return Number.isFinite(raw) && raw >= 1 && raw <= 20 ? Math.floor(raw) : 10;
}

/** Optional authority-domain restriction (comma-separated). Phase-3
 *  measured include_domains honored 100% (all results from the 14
 *  authority domains). EMPTY by default: the discovery research query
 *  wants trending topics/questions across the real web — the
 *  authority-domain law lives at the P4/P5 citation gates where it
 *  belongs (the honest-citation law is unchanged). */
export function getTavilyIncludeDomains(): string[] {
  return (process.env.TAVILY_INCLUDE_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export async function callTavilySearch(
  prompt: string,
  options: GroundedSearchOptions = {},
): Promise<GroundedSearchResult> {
  const key = getTavilyKey();
  if (!key) {
    throw new Error(
      "callTavilySearch: TAVILY_API_KEY is not configured — the Tavily search arm is unavailable, and no simulated/curated substitute is allowed (owner order 2026-10-06).",
    );
  }
  const LP = "[tavily-grounded]" + (options.tag ? ` [${options.tag}]` : "");
  const cdScope = "grounded:tavily";
  const cd = cooldownState(cdScope);
  if (cd) {
    throw new Error(
      `callTavilySearch: quota-cooldown until ${new Date(cd.until).toISOString()} — skipped, no call made (${cd.reason.slice(0, 120)})`,
    );
  }
  const query =
    (options.searchQuery || "").trim() ||
    prompt.replace(/\s+/g, " ").trim().slice(0, TAVILY_QUERY_MAX_CHARS);
  if (query.length === 0) {
    throw new Error(
      "callTavilySearch: empty search query (searchQuery option or prompt) — honest failure, no call made",
    );
  }
  if (!options.searchQuery) {
    console.warn(
      `${LP} no searchQuery option — falling back to the first ${TAVILY_QUERY_MAX_CHARS} chars of the prompt (Tavily's documented query cap); pass a concise language-appropriate query for best quality`,
    );
  }

  const includeDomains = getTavilyIncludeDomains();
  const timeoutMs = options.timeoutMs ?? 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let body: Record<string, unknown>;
  try {
    const res = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        query,
        search_depth: getTavilySearchDepth(),
        max_results: getTavilyMaxResults(),
        include_answer: false,
        include_raw_content: true,
        ...(includeDomains.length > 0 ? { include_domains: includeDomains } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = `Tavily /search HTTP ${res.status}: ${text.slice(0, 300)}`;
      const cls = classifyForCooldown(msg);
      if (cls) markCooldown(cdScope, `${cls}: ${msg.slice(0, 120)}`);
      throw new Error(`callTavilySearch: ${msg}`);
    }
    body = (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }

  // EVIDENCE EXTRACTION — the live result URLs ARE this arm's evidence
  // (the Phase-3 measured response shape: results[] {title,url,content,
  // raw_content,score}).
  const results = Array.isArray(body.results)
    ? (body.results as Array<Record<string, unknown>>)
    : [];
  const sources = mergeDedupedSources(
    results.map((r) => ({
      title: typeof r.title === "string" ? r.title.trim() : "",
      url: typeof r.url === "string" ? r.url.trim() : "",
    })),
  );
  // THE LIVE-EVIDENCE GATE (law 344): a 200 answer with zero usable URLs
  // is NOT research — honest failure; the walk moves to the next arm.
  if (sources.length === 0) {
    throw new Error(
      `callTavilySearch: Tavily answered 200 with ZERO usable result URLs (results=${results.length}) — fails the live-evidence gate (law 344); no substitute allowed`,
    );
  }

  // SYNTHESIS — the research JSON is generated on the ORDINARY chain,
  // grounded on the REAL search results below (never model memory alone:
  // every URL the model may cite is in the prompt, and the arm's own
  // grounding.sources come from the Tavily response, not the model).
  const resultsBlock = results
    .map((r, i) => {
      const title = typeof r.title === "string" ? r.title.trim() : "";
      const url = typeof r.url === "string" ? r.url.trim() : "";
      const content = typeof r.content === "string" ? r.content.trim() : "";
      const raw = typeof r.raw_content === "string" ? r.raw_content.trim() : "";
      const excerpt = raw
        ? `\n   excerpt: ${raw.slice(0, TAVILY_RAW_EXCERPT_CHARS)}`
        : "";
      return `${i + 1}. ${title}\n   url: ${url}\n   snippet: ${content.slice(0, 600)}${excerpt}`;
    })
    .join("\n");
  const synthesisPrompt = `REAL LIVE WEB SEARCH RESULTS (fetched just now via the Tavily search API — query: "${query}") — these are your EVIDENCE BASE; model memory alone is NOT acceptable as the evidence base:
${resultsBlock}

NOTE: you have NO live-search tool in this call — the search results above ARE the live-search evidence (do not claim to use a search tool; ground every keyword/FAQ/topic judgment on the results above).

${prompt}`;
  const synthesisTag = `${options.tag || "grounded"}:tavily-synth`;
  const synth = await callFreeAIFallbackChain(synthesisPrompt, {
    tag: synthesisTag,
    systemPrompt:
      options.systemPrompt ??
      "You are a strict JSON API endpoint. The user message describes the research task; your ENTIRE response MUST be a single valid JSON object matching the requested schema — no prose, no markdown, no commentary, no code fences. The JSON object starts with { and ends with }.",
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens ?? 2_500,
    // The search already spent part of the caller's window; the synthesis
    // chain gets the remainder (its own ≤52s/GHA-600s budget law still
    // clamps per-model timeouts internally).
    timeoutMs: Math.max(timeoutMs - 5_000, 20_000),
  });
  console.log(
    `${LP} search ok (depth=${getTavilySearchDepth()}, results=${results.length}, sources=${sources.length}) → synthesis by ${synth.provider}/${synth.model}`,
  );
  return {
    text: synth.text,
    provider: "tavily",
    model: synth.model,
    grounding: { searchQueries: [query], sources },
  };
}

/**
 * ARM — OpenRouter REAL web search (the documented `web` plugin) on the
 * EXISTING key pool. Every attempt is a REAL search-augmented call; the
 * honest evidence gate rejects 200-without-annotations answers. Exhaustion
 * errors (429/402/401/403) cool the key for the window when the registry
 * is enabled; all keys failed → one honest aggregate error.
 *
 * REMOVED FROM THE EFFECTIVE LADDER (PHASE 5-A, owner order 2026-10-31 —
 * the Phase-4 §6-أ/§12-1 approved design): TWO live proofs measured the
 * arm dead on the free path — (1) its default model
 * nvidia/nemotron-3-super-120b-a12b:free is ABSENT from the live catalog
 * (404 BEFORE the credit point — P0-2) and (2) the web plugin bills
 * per-search credits the never-purchased accounts answer 402 for. The
 * function STAYS for direct diagnostics (the live probe measures it
 * separately) but the callGroundedSearch walk NEVER reaches it. Full
 * deletion is a separate cleanup frame (Phase-4 §12-10).
 */
export async function callOpenRouterGroundedSearch(
  prompt: string,
  options: CallAIOptions = {},
): Promise<GroundedSearchResult> {
  const keys = getOpenRouterKeys();
  if (keys.length === 0) {
    throw new Error(
      "callOpenRouterGroundedSearch: no OpenRouter key configured (OPENROUTER_API / OPENROUTER_API_KEY) — the real web-search arm is unavailable, and no simulated/curated substitute is allowed (owner order 2026-10-06).",
    );
  }
  const model = getOpenRouterGroundedModel();
  const LP = "[or-grounded]" + (options.tag ? ` [${options.tag}]` : "");
  const failures: string[] = [];
  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    const cdScope = `grounded:openrouter:key#${keyIdx + 1}`;
    const cd = cooldownState(cdScope);
    if (cd) {
      failures.push(
        `[key#${keyIdx + 1}] quota-cooldown until ${new Date(cd.until).toISOString()} (${cd.reason}) — skipped, no call made`,
      );
      console.warn(`${LP} key#${keyIdx + 1} in quota-cooldown → skipped`);
      continue;
    }
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 60_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // LIVE-PROBED 2026-10-16 (runs 38843366143 → 38849540488): the free
      // nemotron burns its reasoning CoT FIRST and only then writes content
      // — with the caller's small cap (400) the tokens are exhausted before
      // any content/annotations materialize (200-with-empty both keys,
      // 18.7s), while the uncapped diagnostic call completed with
      // content=366 chars + 5 URL annotations + cost=$0.007. Per-entry
      // max_tokens FLOOR (the R3 per-entry clamp precedent — measured
      // upstream behavior, documented). 2026-10-16 pipeline round-3
      // (38849540488) RAISED the floor 6000 → 10000: the EN research JSON
      // parses at 6000 but the ARABIC research (longer reasoning CoT)
      // truncates mid-JSON — the measured signature: keywords:10 yet
      // topics:0 (parseJSON's truncation repair closes the lost arrays)
      // twice, and a fully-empty parse once. The :free model's extra
      // output tokens cost nothing — only the SEARCH is billed.
      const effectiveMaxTokens = Math.max(options.maxTokens ?? 2_500, 10_000);
      const body: Record<string, unknown> = {
        model,
        messages: [
          ...(options.systemPrompt
            ? [{ role: "system", content: options.systemPrompt }]
            : []),
          { role: "user", content: prompt },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: effectiveMaxTokens,
        // THE REAL SEARCH RIDE-ALONG — no plain-generation path exists here.
        plugins: [OPENROUTER_WEB_PLUGIN],
        // jsonMode intentionally NOT set: the gemini-arm pattern (STRICT-JSON
        // prompt instructions + the 161.5-hardened parseJSON) — reasoning
        // models + tool use reject strict response_format upstream.
      };
      const res = await fetch(`${AI_PROVIDERS.openrouter.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keys[keyIdx]}`,
          "HTTP-Referer": "https://alkemos.com",
          "X-Title": "Alkemos Blog Research",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `AI API error ${res.status} from openrouter (${model}+web): ${text.slice(0, 500)}`,
        );
      }
      const data = (await res.json()) as {
        choices?: Array<{
          message?: {
            content?: string | null;
            reasoning?: string | null;
            reasoning_details?: Array<{ text?: unknown } | null> | null;
            annotations?: unknown;
          } | null;
        }> | null;
        annotations?: unknown;
      } | null;
      const msg = data?.choices?.[0]?.message;
      const finishReasonRaw = (data?.choices?.[0] as { finish_reason?: unknown } | undefined)?.finish_reason;
      const finishReason = typeof finishReasonRaw === "string" ? finishReasonRaw : "";
      // LIVE-PROBED 2026-10-16 (run 38843366143): the free nemotron
      // reasoning model answers the web-plugin call with EMPTY content and
      // the actual text in reasoning_details/reasoning (the same
      // callAI content→reasoning law — mirrored here so the arm reads
      // every documented location instead of failing "empty response").
      let content: string = typeof msg?.content === "string" ? msg.content : "";
      if (!content && Array.isArray(msg?.reasoning_details)) {
        content = msg.reasoning_details
          .map((r) => (typeof r?.text === "string" ? r.text : ""))
          .filter(Boolean)
          .join("\n");
      }
      if (!content && typeof msg?.reasoning === "string") {
        content = msg.reasoning;
      }
      const sources = mergeDedupedSources(
        urlSourcesFromAnnotations(msg?.annotations),
        urlSourcesFromAnnotations(data?.annotations),
      );
      // HONEST EVIDENCE GATE — no URL annotations = not built on live
      // search: fail this key, never pass plain generation as research.
      // (finish_reason rides the message for diagnosis — "length" = the
      // output hit max_tokens: the truncation signature, measured on the
      // Arabic research run 38849540488.)
      if (!content.trim() || sources.length === 0) {
        throw new Error(
          `AI provider openrouter (${model}+web) returned ${
            !content.trim()
              ? "an empty response"
              : "no web-search evidence (annotation URLs)"
          } — the answer was not built on live search${finishReason ? ` (finish_reason: ${finishReason})` : ""}`,
        );
      }
      if (failures.length > 0) {
        console.warn(
          `${LP} key#${keyIdx + 1} ${model}+web succeeded after ${failures.length} earlier key failure(s)`,
        );
      }
      return {
        text: content.trim(),
        provider: "openrouter",
        model,
        grounding: { searchQueries: [], sources },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      failures.push(`[key#${keyIdx + 1} ${model}+web] ${msg.slice(0, 240)}`);
      const cls = classifyForCooldown(msg);
      if (cls) markCooldown(cdScope, `${cls}: ${msg.slice(0, 120)}`);
      console.warn(`${LP} key#${keyIdx + 1} ${model}+web failed: ${msg.slice(0, 180)}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(
    `callOpenRouterGroundedSearch: every configured OpenRouter key failed the REAL web-plugin search (${keys.length} key(s), ${model}+web) — no simulated/curated substitute is allowed (owner order 2026-10-06). Per-key errors: ${failures.join(" | ")}`,
  );
}

/** Extract {title,url} sources from a Groq browser_search `executed_tools`
 *  array — LIVE-MEASURED 2026-10-17 (probe run 39061588932, GROQ-2 round 2):
 *  each tool execution carries `search_results.results` entries
 *  ({title,url,content,score}) — the tool's REAL live-web findings (the
 *  search itself + the browsed pages). These are the citation-grade
 *  evidence of the browser_search walk. Deduped by URL, capped at 12. */
function urlSourcesFromExecutedTools(executedTools: unknown): GeminiGroundingSource[] {
  if (!Array.isArray(executedTools)) return [];
  const out: GeminiGroundingSource[] = [];
  const seen = new Set<string>();
  for (const t of executedTools) {
    if (typeof t !== "object" || t === null) continue;
    const results = (t as { search_results?: { results?: unknown } | null })
      .search_results?.results;
    if (!Array.isArray(results)) continue;
    for (const r of results) {
      if (typeof r !== "object" || r === null) continue;
      const { url, title } = r as { url?: unknown; title?: unknown };
      const u = typeof url === "string" ? url.trim() : "";
      if (!u || seen.has(u)) continue;
      seen.add(u);
      out.push({
        title: typeof title === "string" ? title.trim() : "",
        url: u,
      });
      if (out.length >= 12) return out;
    }
  }
  return out;
}

/** Parse Groq's own "Please try again in X.XXXs" TPM hint (seconds → ms).
 *  Absent/unparsable → 15s (the safe mid-window default). */
function parseGroqTpmRetryHint(text: string): number {
  const m = /try again in ([0-9]+(?:\.[0-9]+)?)\s*s/i.exec(text);
  if (!m) return 15_000;
  const s = Number(m[1]);
  return Number.isFinite(s) && s > 0 ? s * 1_000 : 15_000;
}

/* GROQ 429 CLASSIFICATION (BLOG-RECOVERY 2026-10-20). Live evidence (runs
 * 39403516194 + the 14 daily failures before it): Groq answers per-minute
 * limits with the «Rate limit reached for model … in organization …» shell
 * whose body carries a seconds-scale «Please try again in Xs» hint — and NOT
 * every variant spells out «tokens per minute» (the RPM sibling does not).
 * The old TPM-only detector misclassified those as sustained exhaustion →
 * markCooldown poisoned grounded:groq:<model> for 30 minutes → the step's
 * ×3 retries collapsed to instant skips → the run died. The DAILY class is
 * different on its face: Limit/Used/Requested numbers or hours-scale hints
 * («Limit 200,000 · Used X · Requested Y · Please try again in Zh» — the
 * GROQ-2 diagnosis law). Classification law: a 429 is SUSTAINED only when
 * its body carries daily markers; otherwise it is per-minute transient —
 * patient wait + retry, never a registry cooldown. */
function groq429DailyClass(text: string): boolean {
  // Per-minute buckets also carry Limit/Used/Requested numbers («on tokens
  // per minute (TPM): Limit 8000, Used 7541, Requested 4146» — the measured
  // probe body, run 39061337401) — explicit per-minute wording vetoes the
  // daily class BEFORE the numbers are consulted.
  if (/tokens per minute|\bTPM\b|requests per minute|\bRPM\b/i.test(text))
    return false;
  return (
    /tokens? per day|\bTPD\b/i.test(text) ||
    /limit [0-9][0-9,.]*[^\n]{0,60}used/i.test(text) ||
    /try again in [0-9]+(?:\.[0-9]+)?\s*(?:h|hr|hour)/i.test(text)
  );
}

/** True iff this 429 body looks like a per-minute (TPM/RPM) bucket —
 * seconds-scale hint or per-minute words, and NO daily markers. */
function groq429PerMinuteClass(text: string): boolean {
  if (!text) return false;
  if (groq429DailyClass(text)) return false;
  return (
    /try again in [0-9]+(?:\.[0-9]+)?\s*s/i.test(text) ||
    /tokens per minute|\bTPM\b|requests per minute|\bRPM\b/i.test(text)
  );
}

const sleep = (ms: number): Promise<void> =>
  new Promise((res) => setTimeout(res, ms));

/**
 * ARM 3 — Groq REAL live web search via the `browser_search` built-in
 * tool (GROQ-2 2026-10-17): search happens INSIDE the model call — the
 * agentic tool navigates the live web (measured: browser.search via the
 * search backend + page reads) and the response carries the findings at
 * message.executed_tools[*].search_results.results (accepted at every
 * other documented location too). The honest evidence gate rejects
 * 200-without-evidence answers; exhaustion errors cool the model scope
 * for the window; all ladder models failed → one honest error.
 *
 * Live-measured failure modes with their in-arm recovery (run
 * 39061588932): (a) gpt-oss-20b + reasoning_format "hidden" answers HTTP
 * 400 «Parsing failed» while "parsed" works (and 120b works under
 * "hidden") — the arm flips the format ONCE on that exact error;
 * (b) Groq's 8k TPM token-bucket can reject the second parallel research
 * call (P0 runs AR+EN together; each browser_search walk is
 * token-heavy) — the arm waits Groq's own "try again in Xs" hint ONCE
 * and retries, and a pure TPM 429 NEVER marks the 30-min quota
 * registry (per-minute transient, not sustained exhaustion).
 */
export async function callGroqGroundedSearch(
  prompt: string,
  options: CallAIOptions = {},
): Promise<GroundedSearchResult> {
  const key = getGroqKey();
  if (!key) {
    throw new Error(
      "callGroqGroundedSearch: GROQ_API_KEY is not configured — the real browser_search arm is unavailable, and no simulated/curated substitute is allowed (owner order 2026-10-06).",
    );
  }
  const models = groqGroundedModelCandidates();
  const LP = "[groq-grounded]" + (options.tag ? ` [${options.tag}]` : "");
  const failures: string[] = [];
  for (const model of models) {
    const cdScope = `grounded:groq:${model}`;
    const cd = cooldownState(cdScope);
    if (cd) {
      failures.push(
        `[${model}] quota-cooldown until ${new Date(cd.until).toISOString()} — skipped, no call made (${cd.reason.slice(0, 120)})`,
      );
      console.warn(`${LP} ${model} in quota-cooldown → skipped`);
      continue;
    }
    // Agentic browser walk (multi-hop navigate+read) needs the caller's
    // generous window (P0 passes 180s since 478a1afc); default stays 60s.
    const deadline = Date.now() + (options.timeoutMs ?? 60_000);
    // 3 attempts per model max: primary → format-flip («Parsing failed»
    // 400) or TPM patient retry — never a hot loop.
    for (
      let attempt = 1, reasoningFormat: "hidden" | "parsed" = "hidden";
      attempt <= 3;
      attempt++
    ) {
      const remaining = deadline - Date.now();
      if (remaining < 5_000) {
        failures.push(
          `[${model}+browser_search] timeout budget exhausted before attempt #${attempt} (deadline ${options.timeoutMs ?? 60_000}ms)`,
        );
        break;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);
      try {
        // Groq free tier bills an 8k TPM token-bucket counting prompt AND
        // max_tokens (the R3 chain-clamp law, measured Phase 177): keep the
        // completion budget inside the window — floor 4096 (GPT-OSS burns
        // reasoning tokens before content — the OR-arm CoT law), cap 5000
        // (window − prompt reserve), caller values outside the band clamp
        // INTO it, never above.
        const effectiveMaxTokens = Math.min(
          Math.max(options.maxTokens ?? 2_500, 4_096),
          5_000,
        );
        const body: Record<string, unknown> = {
          model,
          messages: [
            ...(options.systemPrompt
              ? [{ role: "system", content: options.systemPrompt }]
              : []),
            { role: "user", content: prompt },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: effectiveMaxTokens,
          // THE REAL SEARCH RIDE-ALONG (GROQ-2): Groq's built-in
          // browser_search tool — the documented successor of the
          // decommissioned compound system. No plain-generation path
          // exists here; the honest evidence gate below enforces it.
          tools: [{ type: "browser_search" }],
          // GPT-OSS reasoning models REQUIRE parsed|hidden reasoning_format
          // when tools are attached (Groq docs / promptfoo provider law).
          // LIVE-MEASURED split (run 39061588932): 120b answers under
          // "hidden"; 20b 400s «Parsing failed» under "hidden" and answers
          // under "parsed" — the flip is attempted below on that exact
          // error, so both ladder siblings stay one call away from their
          // working format.
          reasoning_format: reasoningFormat,
          // No jsonMode (the gemini-arm STRICT-JSON pattern) and no manual
          // function tools: browser_search performs its OWN live web walk.
        };
        const res = await fetch(`${AI_PROVIDERS.groq.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          // RECOVERY (a): the 20b's «Parsing failed» under "hidden" — flip
          // to "parsed" and retry the SAME model once.
          if (res.status === 400 && /parsing failed/i.test(text) && attempt < 3) {
            reasoningFormat = "parsed";
            console.warn(
              `${LP} ${model} 400 «Parsing failed» under reasoning_format hidden → flipping to parsed (the measured 20b/120b split) and retrying`,
            );
            continue;
          }
          // RECOVERY (a2) (BLOG-RECOVERY 2026-10-20): the agentic «Tool
          // call validation failed» 400 — measured on the EN twin (run
          // 39403516194, gpt-oss-20b: "attempted to call tool 'assistant…'").
          // The model occasionally opens its walk with a bogus tool call;
          // one brief pause + retry of the SAME model is the remedy. A
          // second occurrence falls through to the honest throw below.
          if (
            res.status === 400 &&
            /tool call validation failed/i.test(text) &&
            attempt < 3
          ) {
            console.warn(
              `${LP} ${model} 400 «Tool call validation failed» (agentic quirk) → pausing 3s and retrying the same model`,
            );
            await sleep(3_000);
            continue;
          }
          // RECOVERY (b) (BLOG-RECOVERY 2026-10-20 — the classification
          // law above): EVERY 429 whose body is NOT daily-marked is a
          // per-minute transient (TPM/RPM buckets, hint or hint-less) —
          // wait Groq's own hint (+3s safety, floor 3s, cap 70s) and
          // retry the SAME model. Daily-class 429s (Limit/Used numbers,
          // hours hints) stay exhaustion: thrown + cooled below, exactly
          // as before. The old TPM-only wording check killed 15 daily
          // runs on hint-less per-minute 429s misread as exhaustion.
          if (res.status === 429 && attempt < 3 && !groq429DailyClass(text)) {
            const waitMs = Math.min(
              Math.max(parseGroqTpmRetryHint(text) + 3_000, 3_000),
              70_000,
            );
            if (deadline - Date.now() > waitMs + 10_000) {
              console.warn(
                `${LP} ${model} 429 (per-minute class${groq429PerMinuteClass(text) ? " — hinted" : " — unmarked"}) → waiting ${waitMs}ms (Groq's own hint) and retrying`,
              );
              await sleep(waitMs);
              continue;
            }
          }
          throw new Error(
            // GROQ-2 diagnosis law: 500 chars cut the TPD body before
            // «Limit 200,000 · Used X · Requested Y · Please try again in
            // Zh» — the numbers that settle the reset-time question.
            `AI API error ${res.status} from groq (${model}+browser_search): ${text.slice(0, 1200)}`,
          );
        }
        // The response is OpenAI-compatible PLUS the browser_search
        // findings (measured: message.executed_tools[*].search_results.
        // results — the PRIMARY location) and, on older shapes, citation
        // arrays — the extractor accepts every documented location so a
        // live shape change degrades to an honest gate failure, never a
        // fake pass.
        const data = (await res.json()) as {
          choices?: Array<{
            message?: {
              content?: string | null;
              reasoning?: string | null;
              reasoning_details?: Array<{ text?: unknown } | null> | null;
              executed_tools?: unknown;
              citations?: unknown;
              annotations?: unknown;
            } | null;
          }> | null;
          citations?: unknown;
          annotations?: unknown;
          x_groq?: { citations?: unknown } | null;
        } | null;
        const msg = data?.choices?.[0]?.message;
        // Content fallbacks (the OR-arm content→reasoning law, mirrored for
        // Groq — LIVE-MEASURED on the 20b+parsed flip path, blog run
        // 39062486597: reasoning models sometimes answer with an EMPTY
        // content channel and the actual text in reasoning_details /
        // reasoning — read every documented location instead of failing
        // "empty response".)
        let content: string =
          typeof msg?.content === "string" && msg.content.trim()
            ? msg.content
            : "";
        if (!content && Array.isArray(msg?.reasoning_details)) {
          content = msg.reasoning_details
            .map((r) => (typeof r?.text === "string" ? r.text : ""))
            .filter(Boolean)
            .join("\n");
        }
        if (!content && typeof msg?.reasoning === "string") {
          content = msg.reasoning;
        }
        const sources = mergeDedupedSources(
          urlSourcesFromExecutedTools(msg?.executed_tools),
          urlSourcesFromCitations(msg?.citations),
          urlSourcesFromAnnotations(msg?.annotations),
          urlSourcesFromCitations(data?.citations),
          urlSourcesFromAnnotations(data?.annotations),
          urlSourcesFromCitations(data?.x_groq?.citations),
        );
        // HONEST EVIDENCE GATE — no executed-tools/search/citation URLs =
        // not built on live search.
        if (!content.trim() || sources.length === 0) {
          // BLOG-RECOVERY 2026-10-20: a 200-empty (or evidence-less) walk
          // right after a sibling grounded call on the same free-tier
          // bucket is the measured starvation shape (39403516194 EN
          // twin: 120b answered 200-empty at 09:51:44, 5s after the AR
          // walk's success). ONE pause + re-walk of the SAME model before
          // the honest failure — every retry is still a REAL
          // browser_search call and the evidence gate runs per attempt.
          if (attempt < 3) {
            console.warn(
              `${LP} ${model} 200 ${!content.trim() ? "empty content" : "no search evidence"} → pausing 2s and re-walking (starvation class, attempt ${attempt}/3)`,
            );
            await sleep(2_000);
            continue;
          }
          throw new Error(
            `AI provider groq (${model}+browser_search) returned ${
              !content.trim()
                ? "an empty response"
                : "no web-search evidence (executed_tools/search_results/citation URLs)"
            } — the answer was not built on live search`,
          );
        }
        if (failures.length > 0) {
          console.warn(
            `${LP} ${model}+browser_search (reasoning_format ${reasoningFormat}) succeeded after ${failures.length} earlier model failure(s)`,
          );
        }
        return {
          text: content.trim(),
          provider: "groq",
          model,
          grounding: { searchQueries: [], sources },
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        // A per-minute 429 (TPM/RPM bucket — seconds hint or per-minute
        // words, NO daily markers) is TRANSIENT, never a sustained
        // exhaustion — it must NOT poison the 30-min quota registry (the
        // measured "Please try again in 2.7s" class + the hint-less RPM
        // variant that killed 15 daily runs). Daily-class 429s and every
        // other exhaustion class still cool, exactly as before.
        const isPerMinute429 = /\b429\b/.test(msg) && !groq429DailyClass(msg);
        if (!isPerMinute429) {
          const cls = classifyForCooldown(msg);
          if (cls) markCooldown(cdScope, `${cls}: ${msg.slice(0, 120)}`);
        } else {
          console.warn(
            `${LP} ${model} per-minute 429 exhausted its retries — NOT cooling the 30-min registry (transient bucket)`,
          );
        }
        console.warn(`${LP} ${model}+browser_search failed: ${msg.slice(0, 180)}`);
        failures.push(`[${model}+browser_search] ${msg.slice(0, 240)}`);
        break; // the recovery loops `continue` — a thrown error ends this model
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw new Error(
    `callGroqGroundedSearch: every configured Groq grounded model failed the REAL browser_search call (${models.length} model(s): ${models.join(", ")}) — no simulated/curated substitute is allowed (owner order 2026-10-06). Per-model errors: ${failures.join(" | ")}`,
  );
}

/**
 * THE CROSS-PROVIDER GROUNDED SEARCH (owner order 2026-10-16; ladder
 * RE-ORDERED by PHASE 5-A owner order 2026-10-31 — executing the Phase-4
 * §6-أ/§12-1 approved design, the §10-أ frame): real-search arms in fixed
 * failover order —
 *   1. Tavily search API (REAL search on its own credits + chain
 *      synthesis — independent of LLM quotas; AR-first per the measured
 *      10/11 Arabic win)
 *   2. Groq `browser_search` built-in tool (REAL live web walk, citations
 *      — GROQ-2 2026-10-17, the compound successor)
 *   3. Gemini native googleSearch — DORMANT LAST arm (0/114 grounded
 *      successes over three measured weeks: grounding is unavailable on
 *      the current free tier; the cooldown registry makes re-trying it
 *      cheap). Ops knob: GEMINI_GROUNDED_ENABLED=0 removes it from the
 *      walk without a deploy (the §6-أ owner kill-switch).
 *   The OpenRouter `web` plugin arm was REMOVED from the effective ladder
 *   (P0-2: default model dead 404 + plugin bills credits 402 — two live
 *   proofs); its code stays above for direct diagnostics only.
 *   (NVIDIA NIM: no grounded-search capability — honestly excluded; it
 *    never receives a call on this path.)
 * A quota-class failure moves the walk to the NEXT provider; every arm
 * enforces the honest evidence gate; total failure = ONE honest aggregate
 * error naming every arm's state. The AR/EN pairing, workflow, and all
 * gates live ABOVE this layer (blog-research) and are untouched.
 */
export type GroundedArmId = "tavily" | "groq" | "gemini";

/** The effective arm ladder — language-split per §6-أ. PHASE 5-A ships
 *  the Tavily arm FIRST for BOTH languages (AR-first per the measured
 *  Arabic win; EN rides Tavily until Phase B lands Exa as the EN leader
 *  — the lang parameter is plumbed NOW so Phase B changes the ORDER
 *  only, never the contract). GEMINI_GROUNDED_ENABLED=0 drops the
 *  dormant gemini tail arm (deploy-free rollback, §6-أ). */
export function groundedArmOrder(lang?: "ar" | "en"): GroundedArmId[] {
  void lang; // Phase B: "en" will lead with the exa arm (§6-أ final state)
  const geminiEnabled = process.env.GEMINI_GROUNDED_ENABLED !== "0";
  return geminiEnabled ? ["tavily", "groq", "gemini"] : ["tavily", "groq"];
}

export async function callGroundedSearch(
  prompt: string,
  options: GroundedSearchOptions = {},
): Promise<GroundedSearchResult> {
  const armFailures: string[] = [];
  const arms = groundedArmOrder(options.lang);

  for (let i = 0; i < arms.length; i++) {
    const arm = arms[i];
    try {
      const r =
        arm === "tavily"
          ? await callTavilySearch(prompt, options)
          : arm === "groq"
            ? await callGroqGroundedSearch(prompt, options)
            : await callGeminiGroundedSearch(prompt, options);
      if (armFailures.length > 0) {
        console.warn(
          `[grounded-search] ${arm} answered after ${armFailures.length} earlier arm failure(s)`,
        );
      }
      return r;
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).slice(0, 600);
      armFailures.push(`[${arm}] ${msg}`);
      const next = i < arms.length - 1 ? arms[i + 1] : null;
      console.warn(
        `[grounded-search] arm ${i + 1}/${arms.length} (${arm}) failed${next ? ` → moving to ${next}` : " (last arm)"}: ${msg.slice(0, 180)}`,
      );
    }
  }

  // NVIDIA NIM — excluded BY DESIGN (no native web-search tool in its
  // OpenAI-compatible chat API): an ungrounded NIM answer is exactly the
  // «توليد عادي» the owner forbade as a search substitute.

  const cds = activeCooldowns();
  throw new Error(
    `callGroundedSearch: every grounded-search arm failed — tavily(search API) → groq(browser_search)${
      process.env.GEMINI_GROUNDED_ENABLED === "0"
        ? " [gemini dormant arm DISABLED via GEMINI_GROUNDED_ENABLED=0]"
        : " → gemini(googleSearch, dormant last arm)"
    }. The openrouter web arm was REMOVED from the effective ladder (dead default model 404 + paid plugin 402 — P0-2, two live proofs). NVIDIA NIM has no grounded-search capability (honestly excluded). No simulated/curated substitute is allowed (owner order 2026-10-06). Arm errors: ${armFailures.join(" || ")}${cds.length ? ` || ACTIVE COOLDOWNS: ${cds.map((c) => `${c.scope} until ${new Date(c.until).toISOString()}`).join("; ")}` : ""}`,
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

// SEO-COLLAPSE-AUDIT-2026-10-18 (topology fix, zero behavior change):
// parseJSON + repairTruncatedJSON moved VERBATIM to the leaf module
// ./parse-json.ts — client-bundled libs (ai-meal-planner, ai-workout-planner)
// must not import THIS module (it statically pulls the server-only
// ai-provider-cooldown → node:fs into their chunks; Turbopack died on
// /(ar)/ar/ai-meal-planner/page). Re-export keeps every server importer
// stable.
export { parseJSON } from "./parse-json";

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
 *   6. Groq: qwen/qwen3.8-27b (27B — good Arabic; GROQ-2 2026-10-17: 3.6
 *      retired — the live account list (run 38844967928 DIAG) holds 3.8)
 *   7. OpenRouter: nvidia/nemotron-3-super-120b (120B — balanced; 47.9% live)
 *   [8. Groq compound-beta — PURGED GROQ-2 2026-10-17: Groq decommissioned
 *      the compound system 2026-09-21 (groq/compound + compound-mini); every
 *      call 404s and the account's live model list holds ZERO compound ids —
 *      the Phase-177 dead-weight purge law applies.]
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
  // GEMINI-FIRST LAW (343) — CANCELLED (owner order 2026-10-31, Phase 5-A
  // «إلغاء قانون Gemini-First نهائيًا، بما يشمل السلاسل الثقيلة»): the
  // gemini entry no longer leads — the pre-343 ladder below is restored as
  // the effective head, the 3-way lead rotation (openrouter → groq →
  // nvidia) runs on EVERY call again (see callFreeAIFallbackChain), and
  // gemini rides as the ordinary TAIL entry — a last-resort lottery ticket
  // positioned on measured AVAILABILITY (66/271 weekly success = 24.4%,
  // the worst of the four providers — gemini-weekly-usage-report.md week
  // 2026-10-18→24), NOT on output quality. With no GEMINI_API_KEY the
  // entry is skipped without consuming attempt budget (unchanged).
  // GEMINI_MODEL still overrides at runtime; the 344 model switch
  // (3.8-flash → 3.5-flash, measured 503-overload evidence) stays.
  { provider: "openrouter", model: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  { provider: "groq", model: "openai/gpt-oss-120b" },
  // BLOG-RECOVERY-3 round-3 (2026-10-21, live run 39632881785): BOTH
  // nvidia/nemotron-3-super-120b-a12b entries REMOVED — the id answered
  // 404 «Function …: Not found for account» on NVIDIA NIM directly AND
  // through the OpenRouter :free twin in the same window (measured twice
  // in-run, 16:28 + 16:32 UTC), and the 404's gone-class cooldown froze
  // BOTH providers for 30 minutes — killing the two remaining P4 attempts
  // outright. The 161.2 live-call law cut both ways before (safeguard-20b
  // measured IN then OUT): this id stays out until a live probe measures
  // it answering again.
  { provider: "groq", model: "openai/gpt-oss-20b" },
  { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b" },
  { provider: "groq", model: "qwen/qwen3.8-27b" },
  // The gemini tail (post-5-A position — see the law note above).
  { provider: "gemini", model: "gemini-3.5-flash" },
];

/** Alternating-lead rotation counter (see callFreeAIFallbackChain below). */
let chainCallSeq = 0;
/** Round-robin cursor across configured OpenRouter accounts (dual-key pool). */
let orKeyCursor = 0;

/** TEST-ONLY seam (the ai-provider-cooldown `__resetCooldownForTests`
 *  precedent, added PHASE 5-A): resets the 3-way lead-rotation counter so
 *  chain canaries are DETERMINISTIC under the restored rotation (the
 *  gemini-first law's rotation suspension — which made chain order static
 *  for key-configured tests — was cancelled 2026-10-31). Never called by
 *  production code. */
export function __resetChainRotationForTests(): void {
  chainCallSeq = 0;
  orKeyCursor = 0;
}

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
  // GEMINI-FIRST LAW (343) — CANCELLED (owner order 2026-10-31, Phase 5-A):
  // the pre-343 speed ladder is restored as the head (groq-first speed
  // law intact — gpt-oss-20b leads) and gemini rides as the ordinary TAIL
  // entry (last-resort; the fast chain never rotates BY DESIGN). With no
  // GEMINI_API_KEY the entry is skipped without consuming attempt budget.
  // PHASE 344's model choice (3.5-flash) and the GEMINI_MODEL knob stay.
  { provider: "groq", model: "openai/gpt-oss-20b" }, // smallest — usually <1s TTFT (82.6% live)
  { provider: "groq", model: "openai/gpt-oss-120b" }, // quality slot, still LPU-fast (85.3% live)
  { provider: "nvidia", model: "nvidia/nemotron-3.5-lightning-30b-a3b" }, // NIM fast (3B active — 33.3% live)
  { provider: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free" }, // provider diversity tail (47.9% live)
  // The gemini tail (post-5-A position — SSE streaming-capable last resort).
  { provider: "gemini", model: "gemini-3.5-flash" },
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
  // Unconditional (pre-343 verbatim): the counter advances on EVERY chain
  // call — fast-chain calls included — so the strongest-chain rotation
  // resumes in phase across mixed call types.
  chainCallSeq += 1;
  if (options.chain !== "fast") {
    // ── PROVIDER-LEAD ROTATION (2026-08-27 owner directive "parallel or
    // alternating"; 3-way since 2026-09-09; RESTORED on every call by the
    // Phase 5-A Gemini-first cancellation, owner order 2026-10-31) ──
    // Every call rotates which provider LEADS the chain: openrouter → groq
    // → nvidia → openrouter … Without this, entry #1 of
    // INTERLEAVED_STRONGEST_CHAIN (a strong OpenRouter model) succeeds almost
    // every time → the other providers are never reached and their free
    // budgets idle while OpenRouter's ~50/day free ceiling burns. With
    // rotation, each provider's own strength order stays intact and the load
    // is spread across ALL configured keys. Lead slots of unconfigured
    // providers degrade gracefully (the next configured provider's first
    // entry simply leads). The fast chain keeps groq-first (speed law) and
    // never rotates. Gemini is NEVER a lead provider (not in LEAD_SEQ) —
    // the cancelled gemini-first law is gone; gemini answers only from its
    // TAIL slot when every rotated lead has failed.
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

    // BLOG-PROVIDER-FAILOVER (owner order 2026-10-16 «بحيث تنتقل للمزوّد
    // التالي عند نفاد الحصة … وتجنب تكرار المحاولات الفاشلة»): a
    // provider that answered with an exhaustion-class error earlier in
    // this window is SKIPPED without a network call and WITHOUT consuming
    // attempt budget — the next HEALTHY provider takes the slot within
    // the SAME maxModels budget. Registry is OPT-IN via
    // AI_PROVIDER_COOLDOWN_MS (canary law — absent env = the pre-2026-10-16
    // walk, byte-identical).
    const cd = cooldownState(`chain:${provider}`);
    if (cd) {
      errors.push(
        `${provider}: quota-cooldown until ${new Date(cd.until).toISOString()} (${cd.reason}) — entries skipped, no call made`,
      );
      console.log(
        `${LP} ${provider} in quota-cooldown → skipping its entries until ${new Date(cd.until).toISOString()}`,
      );
      continue;
    }

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
          // BLOG-PROVIDER-FAILOVER (owner order 2026-10-16): exhaustion-class
          // failure (429 quota / 402 payment / 401-403 auth / 404 gone) →
          // cool the PROVIDER for the window so later calls skip it and the
          // next provider leads. Transient (5xx/timeout/empty) stays
          // retryable as before (the ×3 step-retry rides it out).
          const cls = classifyForCooldown(msg);
          if (cls) {
            markCooldown(
              `chain:${provider}`,
              `${cls}: ${provider}/${model}: ${msg.slice(0, 120)}`,
            );
          }
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
  const cds = activeCooldowns();
  const finalError = new Error(
    `[ai-fallback-chain] All AI providers failed.` +
      (options.tag ? ` (system: ${options.tag})\n` : "\n") +
      `OpenRouter keys configured: ${openrouterKeys.length}.\n` +
      `Groq key: ${groqKey ? "present" : "MISSING"}.\n` +
      `NVIDIA key: ${nvidiaKey ? "present" : "MISSING"}.\n` +
      `Gemini key: ${geminiKey ? "present" : "MISSING"}.\n` +
      (cds.length
        ? `Active quota-cooldowns: ${cds
            .map((c) => `${c.scope} until ${new Date(c.until).toISOString()}`)
            .join("; ")}\n`
        : "") +
      `Errors:\n  - ${errors.join("\n  - ")}`,
  );
  console.error(finalError.message);
  throw finalError;
}
