import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  callAI,
  callAIStream,
  callGeminiGroundedSearch,
  getEnvConfig,
  getGeminiKey,
} from "@/lib/ai-provider";
import {
  classifyGeminiError,
  featureFromTag,
  geminiUsageKey,
  trackGeminiUsage,
} from "@/lib/ai-usage-gemini";

/**
 * Phase 343 — Gemini native adapter contract (owner order 2026-10-06
 * «أضف Gemini كمزود AI جديد... واجعله الاختيار الأول», FREE tier).
 * These tests pin the NATIVE generativelanguage translation: URL shape,
 * x-goog-api-key auth, request/response mapping, thought-part filtering,
 * jsonMode mime-type, honest error carrying, SSE streaming deltas, and the
 * fail-soft per-tag usage counters that feed the weekly report.
 *
 * Phase 344 — GOOGLE SEARCH GROUNDING contract (owner order «بحث خارجي
 * حقيقي [Google Search grounding]... مع إزالة الاعتماد على محاكاة البحث
 * أو الـ curated fallback كبديل للبحث الحقيقي»): tools:[{googleSearch:{}}]
 * rides the request, JSON-mode mime is suppressed with tools, the response's
 * groundingMetadata is extracted as REAL evidence (queries + pages), and an
 * ungrounded 200 answer FAILS honestly instead of passing as research.
 */

const ENV_KEYS = [
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "AI_PROVIDER",
  "AI_MODEL",
  "AI_BASE_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

const GEMINI_OVERRIDE = {
  provider: "gemini" as const,
  apiKey: "AIza-test-key-0000",
  model: "gemini-3.5-flash",
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
};

type Captured = {
  url?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
};

function stubGeminiFetch(
  captured: Captured,
  payload: unknown,
  ok = true,
  status = 200,
) {
  const fake = vi.fn(async (url: string, init?: RequestInit) => {
    captured.url = url;
    captured.headers = Object.fromEntries(
      new Headers(init?.headers).entries(),
    );
    captured.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return {
      ok,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fake);
}

beforeEach(() => cleanEnv());
afterEach(() => {
  cleanEnv();
  vi.unstubAllGlobals();
});

describe("Phase 343 — Gemini registry + env resolution", () => {
  it("getGeminiKey reads GEMINI_API_KEY", () => {
    process.env.GEMINI_API_KEY = "AIza-test";
    expect(getGeminiKey()).toBe("AIza-test");
  });

  it("getGeminiKey empty when unset", () => {
    expect(getGeminiKey()).toBe("");
  });

  it("getEnvConfig resolves gemini when requested (AI_PROVIDER=gemini)", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "AIza-only";
    const cfg = getEnvConfig();
    expect(cfg?.provider).toBe("gemini");
    expect(cfg?.baseUrl).toBe("https://generativelanguage.googleapis.com/v1beta");
    expect(cfg?.model).toBe("gemini-3.5-flash");
  });

  it("openrouter stays the single-call default when no AI_PROVIDER is set", () => {
    process.env.OPENROUTER_API = "sk-or-x";
    process.env.GEMINI_API_KEY = "AIza-x";
    const cfg = getEnvConfig();
    expect(cfg?.provider).toBe("openrouter");
  });
});

describe("Phase 343 — callAI gemini translation (generateContent)", () => {
  it("URL, x-goog-api-key header, translated body (systemInstruction + contents + generationConfig)", async () => {
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [
        { content: { parts: [{ text: "PONG" }] }, finishReason: "STOP" },
      ],
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 1 },
    });
    const text = await callAI(
      "Reply with the single word: PONG",
      {
        systemPrompt: "You are a tester.",
        temperature: 0.2,
        maxTokens: 10,
        tag: "evo-chat",
      },
      GEMINI_OVERRIDE,
    );
    expect(text).toBe("PONG");
    expect(captured.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    );
    expect(captured.headers?.["x-goog-api-key"]).toBe("AIza-test-key-0000");
    expect(captured.headers?.["authorization"]).toBeUndefined();
    expect(captured.body?.contents).toEqual([
      { role: "user", parts: [{ text: "Reply with the single word: PONG" }] },
    ]);
    expect(captured.body?.systemInstruction).toEqual({
      parts: [{ text: "You are a tester." }],
    });
    expect(captured.body?.generationConfig).toMatchObject({
      temperature: 0.2,
      maxOutputTokens: 10,
    });
    expect(captured.body?.["response_format"]).toBeUndefined();
  });

  it("jsonMode → generationConfig.responseMimeType application/json (native, no response_format)", async () => {
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [{ content: { parts: [{ text: "{}" }] } }],
    });
    await callAI("json?", { jsonMode: true }, GEMINI_OVERRIDE);
    expect(captured.body?.generationConfig).toMatchObject({
      responseMimeType: "application/json",
    });
    expect(captured.body?.["response_format"]).toBeUndefined();
  });

  it("thought parts are skipped — only real text reaches the consumer", async () => {
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [
        {
          content: {
            parts: [
              { text: "internal reasoning", thought: true },
              { text: "VISIBLE" },
            ],
          },
        },
      ],
    });
    const text = await callAI("hi", {}, GEMINI_OVERRIDE);
    expect(text).toBe("VISIBLE");
  });

  it("non-OK → honest error carrying the status (chain's looksLikeQuota keeps working)", async () => {
    const captured: Captured = {};
    stubGeminiFetch(
      captured,
      { error: { code: 429, status: "RESOURCE_EXHAUSTED" } },
      false,
      429,
    );
    await expect(
      callAI("hi", { tag: "evo-chat" }, GEMINI_OVERRIDE),
    ).rejects.toThrow(/AI API error 429 from gemini/);
  });

  it("empty candidates → empty-response error with finishReason context", async () => {
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [{ content: { parts: [] }, finishReason: "SAFETY" }],
    });
    await expect(callAI("hi", {}, GEMINI_OVERRIDE)).rejects.toThrow(
      /empty response[\s\S]*SAFETY/,
    );
  });
});

describe("Phase 344 — Google Search grounding translation (tools + evidence extraction)", () => {
  it("googleSearch:true → body carries tools:[{googleSearch:{}}] and SUPPRESSES responseMimeType (JSON-mode + tools is rejected by the REST API)", async () => {
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [
        {
          content: { parts: [{ text: "{}" }] },
          groundingMetadata: { webSearchQueries: ["q"], groundingChunks: [{ web: { uri: "https://x", title: "X" } }] },
        },
      ],
    });
    await callAI("research?", { jsonMode: true, googleSearch: true }, GEMINI_OVERRIDE);
    expect(captured.body?.tools).toEqual([{ googleSearch: {} }]);
    expect((captured.body?.generationConfig as Record<string, unknown>)?.responseMimeType).toBeUndefined();
  });

  it("without the flag → no tools in the body (non-grounded calls unchanged)", async () => {
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
    });
    await callAI("hi", {}, GEMINI_OVERRIDE);
    expect(captured.body?.tools).toBeUndefined();
  });

  it("callGeminiGroundedSearch — URL/default model, returns text + normalized grounding (queries + deduped sources)", async () => {
    process.env.GEMINI_API_KEY = "AIza-grounded-key";
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [
        {
          content: { parts: [{ text: '{"keywords":[]}' }] },
          groundingMetadata: {
            webSearchQueries: ["how much protein per day", "protein timing"],
            groundingChunks: [
              { web: { uri: "https://healthline.com/nutrition/protein", title: "How Much Protein" } },
              { web: { uri: "https://healthline.com/nutrition/protein", title: "dup — same URL" } },
              { web: { uri: "https://examine.com/protein", title: "Protein — Examine" } },
              { web: { title: "no uri — skipped" } },
            ],
          },
        },
      ],
    });
    const out = await callGeminiGroundedSearch("research", { tag: "blog:research" });
    expect(captured.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    );
    expect(captured.body?.tools).toEqual([{ googleSearch: {} }]);
    expect(out.provider).toBe("gemini");
    expect(out.model).toBe("gemini-3.5-flash");
    expect(out.text).toBe('{"keywords":[]}');
    expect(out.grounding.searchQueries).toEqual([
      "how much protein per day",
      "protein timing",
    ]);
    expect(out.grounding.sources).toEqual([
      { title: "How Much Protein", url: "https://healthline.com/nutrition/protein" },
      { title: "Protein — Examine", url: "https://examine.com/protein" },
    ]);
  });

  it("GEMINI_MODEL override wins for the grounded call", async () => {
    process.env.GEMINI_API_KEY = "AIza-grounded-key";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [
        {
          content: { parts: [{ text: "ok" }] },
          groundingMetadata: { webSearchQueries: ["q"] },
        },
      ],
    });
    const out = await callGeminiGroundedSearch("x");
    expect(out.model).toBe("gemini-2.5-flash");
    expect(captured.url).toContain("/models/gemini-2.5-flash:generateContent");
  });

  it("200 WITHOUT grounding evidence → HONEST failure (model memory may not masquerade as research)", async () => {
    process.env.GEMINI_API_KEY = "AIza-grounded-key";
    const captured: Captured = {};
    stubGeminiFetch(captured, {
      candidates: [{ content: { parts: [{ text: "answers from memory" }] } }],
    });
    await expect(callGeminiGroundedSearch("research")).rejects.toThrow(
      /no Google-Search grounding evidence[\s\S]*not built on live search/,
    );
  });

  it("no GEMINI_API_KEY → honest configuration error (no substitute allowed)", async () => {
    await expect(callGeminiGroundedSearch("research")).rejects.toThrow(
      /GEMINI_API_KEY is not configured[\s\S]*no simulated\/curated substitute/,
    );
  });
});

describe("Phase 343 — callAIStream gemini translation (streamGenerateContent SSE)", () => {
  it("parses Gemini SSE chunks and forwards text deltas to onDelta", async () => {
    const captured: Captured = {};
    const enc = new TextEncoder();
    const chunk = (obj: unknown) =>
      `data: ${JSON.stringify(obj)}\n\n`;
    const sse =
      chunk({ candidates: [{ content: { parts: [{ text: "Hel" }] } }] }) +
      chunk({
        candidates: [
          {
            content: {
              parts: [
                { text: "internal reasoning", thought: true },
                { text: "lo" },
              ],
            },
          },
        ],
      }) +
      chunk({
        candidates: [{ content: { parts: [{ text: " world" }] } }],
        usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 9 },
      });
    const fake = vi.fn(async (url: string, init?: RequestInit) => {
      captured.url = url;
      captured.headers = Object.fromEntries(
        new Headers(init?.headers).entries(),
      );
      return {
        ok: true,
        status: 200,
        body: new ReadableStream({
          start(c) {
            c.enqueue(enc.encode(sse));
            c.close();
          },
        }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fake);

    const deltas: string[] = [];
    const text = await callAIStream(
      "say hello",
      { tag: "evo-chat" },
      GEMINI_OVERRIDE,
      (c) => deltas.push(c),
    );
    expect(text).toBe("Hello world");
    expect(deltas.join("")).toBe("Hello world");
    expect(captured.url).toContain("streamGenerateContent?alt=sse");
    expect(captured.headers?.["x-goog-api-key"]).toBe("AIza-test-key-0000");
  });
});

describe("Phase 343 — gemini usage tracker (fail-soft, per-tag counters)", () => {
  it("key shape: gemini:usage:{date}:{feature}:{metric}", () => {
    expect(geminiUsageKey("2026-10-06", "evo-chat", "ok")).toBe(
      "gemini:usage:2026-10-06:evo-chat:ok",
    );
  });

  it("classifyGeminiError: 429/402/403 → quota · 5xx → server · 401 → auth · 400/404 → bad_request", () => {
    expect(classifyGeminiError(429)).toBe("quota");
    expect(classifyGeminiError(402)).toBe("quota");
    expect(classifyGeminiError(403)).toBe("quota");
    expect(classifyGeminiError(503)).toBe("server");
    expect(classifyGeminiError(401)).toBe("auth");
    expect(classifyGeminiError(400)).toBe("bad_request");
    expect(classifyGeminiError(404)).toBe("bad_request");
    expect(classifyGeminiError(undefined, "timeout")).toBe("timeout");
  });

  it("featureFromTag sanitizes unsafe characters (':' included — keeps Redis keys 5-part colon-delimited)", () => {
    expect(featureFromTag("blog:content-ar")).toBe("blog_content-ar");
    expect(featureFromTag("weird tag!! x")).toBe("weird_tag_x");
    expect(featureFromTag(undefined)).toBe("direct");
  });

  it("resolves without throwing when Upstash is not configured (fail-soft)", async () => {
    await expect(
      trackGeminiUsage({ tag: "evo-chat", model: "gemini-3.5-flash", ok: true }),
    ).resolves.toBeUndefined();
  });

  it("sends one pipeline with INCRBY calls+ok+tokens and EXPIRE NX when configured", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
    const captured: { url?: string; body?: string[][] } = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        captured.url = url;
        captured.body = JSON.parse(String(init?.body)) as string[][];
        return {
          ok: true,
          json: async () => [{ result: 1 }, { result: 1 }],
        } as unknown as Response;
      }),
    );
    await trackGeminiUsage({
      tag: "blog:content-ar",
      model: "gemini-3.5-flash",
      ok: true,
      promptTokens: 120,
      completionTokens: 45,
    });
    expect(captured.url).toBe("https://example.upstash.io/pipeline");
    const cmds = captured.body!;
    expect(cmds[0][0]).toBe("INCRBY");
    expect(cmds[0][1]).toBe("gemini:usage:" + new Date().toISOString().slice(0, 10) + ":blog_content-ar:calls");
    expect(
      cmds.some(
        (c) =>
          c[0] === "INCRBY" && c[1].endsWith(":tokens_in") && c[2] === "120",
      ),
    ).toBe(true);
    expect(
      cmds.some(
        (c) =>
          c[0] === "INCRBY" && c[1].endsWith(":tokens_out") && c[2] === "45",
      ),
    ).toBe(true);
    expect(cmds.filter((c) => c[0] === "EXPIRE" && c[3] === "NX").length).toBeGreaterThan(0);
  });

  it("429 failure increments fail + fail_quota", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
    const captured: { body?: string[][] } = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        captured.body = JSON.parse(String(init?.body)) as string[][];
        return {
          ok: true,
          json: async () => [{ result: 1 }, { result: 1 }],
        } as unknown as Response;
      }),
    );
    await trackGeminiUsage({
      tag: "evo-chat",
      model: "gemini-3.5-flash",
      ok: false,
      status: 429,
    });
    const cmds = captured.body!;
    expect(cmds.some((c) => c[1].endsWith(":fail"))).toBe(true);
    expect(cmds.some((c) => c[1].endsWith(":fail_quota"))).toBe(true);
  });

  it("upstash failure is swallowed (never throws)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(
      trackGeminiUsage({ tag: "evo-chat", model: "gemini-3.5-flash", ok: true }),
    ).resolves.toBeUndefined();
  });
});
