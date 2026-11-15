/**
 * P2-3 CANARIES (audit AI-GENERATION-PIPELINES 2026-11-15, item 3 — INF-19
 * «العداد الحقيقي») — the CONVERTER/ENGINE side of the remedy.
 *
 * The audit's exact complaint: «العداد يسجل تقدير chars/4 ويهدر usage
 * الحقيقي الموجود في كل رد متوافق (يقرؤه فقط محول Gemini)» — the meter
 * logged a chars/4 estimate and DISCARDED the real usage sitting in
 * every OpenAI-compatible response. These canaries pin the closed loop:
 *
 *   1. THE CONVERTERS READ IT — callAI (non-streaming OpenAI-compat),
 *      callAIStream (SSE, with stream_options.include_usage for the two
 *      providers that document it), and both Gemini native adapters
 *      push the provider-reported usage through the onUsage tap.
 *   2. THE CHAIN FEEDS THE METER — a successful chain attempt whose
 *      response carried usage records tokens_prompt/completion/total +
 *      cost (and does NOT double-record the chars/4 estimate); an
 *      attempt without usage keeps the estimate exactly as before.
 *   3. THE GROUNDED ARMS TOO — the groq browser_search arm parses the
 *      usage block of its OpenAI-compatible response; the gemini
 *      googleSearch arm rides callGeminiGenerate's usageMetadata.
 *   4. THE METER LAWS SURVIVE — a throwing onUsage callback can never
 *      break the call it observes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  callAI,
  callAIStream,
  callFreeAIFallbackChain,
  callGeminiGroundedSearch,
  callGroqGroundedSearch,
  __resetChainRotationForTests,
} from "@/lib/ai-provider";
import { __resetCooldownForTests } from "@/lib/ai-provider-cooldown";

const ENV_KEYS = [
  "AI_METER",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "GROQ_API_KEY",
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "NVIDIA_API_KEY",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "GEMINI_GROUNDED_MODELS",
  "AI_PROVIDER_COOLDOWN_MS",
  "AI_PROVIDER_COOLDOWN",
  "AI_COOLDOWN_STATE_FILE",
  "AI_CHAIN_TOTAL_BUDGET_MS",
] as const;

const UPSTASH = "https://example-upstash.fake";

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

type FetchCall = { url: string; init?: RequestInit };

function stubFetch(log: FetchCall[], route: (call: FetchCall) => Response | Promise<Response>) {
  const fake = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: String(input), init };
    log.push(call);
    return route(call);
  });
  vi.stubGlobal("fetch", fake);
  return fake;
}

function jsonResponse(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), {
    status: ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
}

/** An SSE Response whose body emits the given `data: …` payload strings. */
function sseResponse(payloads: unknown[]): Response {
  const text = payloads.map((p) => `data: ${JSON.stringify(p)}\n\n`).join("") + "data: [DONE]\n\n";
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

/** Flush the fire-and-forget meter taps (they POST to Upstash async). */
const flushMeter = () => new Promise((r) => setTimeout(r, 25));

/** The OpenAI-compatible success payload WITH the real usage block. */
const GROQ_OK_WITH_USAGE = {
  choices: [{ message: { content: "PONG" }, finish_reason: "stop" }],
  usage: { prompt_tokens: 123, completion_tokens: 45, total_tokens: 168 },
};

const GROQ_OK_WITHOUT_USAGE = {
  choices: [{ message: { content: "PONG" }, finish_reason: "stop" }],
};

beforeEach(() => {
  cleanEnv();
});

afterEach(() => {
  cleanEnv();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════
 * LAW 1 — the CONVERTERS read the provider-reported usage
 * ══════════════════════════════════════════════════════════════════════ */
describe("INF-19 — callAI (OpenAI-compatible, non-streaming) reads data.usage", () => {
  it("a usage block on the response fires the onUsage tap with the real counts", async () => {
    const log: FetchCall[] = [];
    stubFetch(log, (c) => (String(c.url).includes("api.groq.com") ? jsonResponse(GROQ_OK_WITH_USAGE) : jsonResponse({})));
    const taps: unknown[] = [];
    const text = await callAI(
      "Reply with PONG",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "groq",
        apiKey: "gsk_test_key",
        model: "openai/gpt-oss-120b",
        baseUrl: "https://api.groq.com/openai/v1",
      },
    );
    expect(text).toBe("PONG");
    expect(taps).toEqual([{ promptTokens: 123, completionTokens: 45, totalTokens: 168 }]);
  });

  it("total falls back to prompt+completion when the provider omitted it", async () => {
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("api.groq.com")
        ? jsonResponse({
            choices: [{ message: { content: "PONG" } }],
            usage: { prompt_tokens: 100, completion_tokens: 40 }, // no total_tokens
          })
        : jsonResponse({}),
    );
    const taps: unknown[] = [];
    await callAI(
      "Reply with PONG",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "groq",
        apiKey: "gsk_test_key",
        model: "openai/gpt-oss-120b",
        baseUrl: "https://api.groq.com/openai/v1",
      },
    );
    expect(taps).toEqual([{ promptTokens: 100, completionTokens: 40, totalTokens: 140 }]);
  });

  it("a response WITHOUT usage never fires the tap (estimate fallback stays)", async () => {
    const log: FetchCall[] = [];
    stubFetch(log, (c) => (String(c.url).includes("api.groq.com") ? jsonResponse(GROQ_OK_WITHOUT_USAGE) : jsonResponse({})));
    const taps: unknown[] = [];
    await callAI(
      "Reply with PONG",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "groq",
        apiKey: "gsk_test_key",
        model: "openai/gpt-oss-120b",
        baseUrl: "https://api.groq.com/openai/v1",
      },
    );
    expect(taps).toEqual([]);
  });

  it("a THROWING onUsage callback never breaks the call (the meter law)", async () => {
    const log: FetchCall[] = [];
    stubFetch(log, (c) => (String(c.url).includes("api.groq.com") ? jsonResponse(GROQ_OK_WITH_USAGE) : jsonResponse({})));
    const text = await callAI(
      "Reply with PONG",
      {
        maxTokens: 10,
        onUsage: () => {
          throw new Error("tap exploded — must be swallowed");
        },
      },
      {
        provider: "groq",
        apiKey: "gsk_test_key",
        model: "openai/gpt-oss-120b",
        baseUrl: "https://api.groq.com/openai/v1",
      },
    );
    expect(text).toBe("PONG");
  });
});

describe("INF-19 — callAIStream (SSE) requests and reads the stream usage", () => {
  it("openrouter: stream_options.include_usage rides the body; the final usage chunk fires the tap", async () => {
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("openrouter.ai")
        ? sseResponse([
            { choices: [{ delta: { content: "Hel" } }] },
            { choices: [{ delta: { content: "lo" }, finish_reason: "stop" }] },
            { choices: [], usage: { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 } },
          ])
        : jsonResponse({}),
    );
    const taps: unknown[] = [];
    const chunks: string[] = [];
    const text = await callAIStream(
      "Say hello",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "openrouter",
        apiKey: "sk-or-test",
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        baseUrl: "https://openrouter.ai/api/v1",
      },
      (c) => chunks.push(c),
    );
    expect(text).toBe("Hello");
    expect(chunks).toEqual(["Hel", "lo"]);
    expect(taps).toEqual([{ promptTokens: 20, completionTokens: 5, totalTokens: 25 }]);
    const body = JSON.parse(String(log[0].init?.body)) as Record<string, unknown>;
    expect(body.stream_options).toEqual({ include_usage: true });
  });

  it("groq stream: the same documented flag rides the body", async () => {
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("api.groq.com")
        ? sseResponse([
            { choices: [{ delta: { content: "OK" }, finish_reason: "stop" }] },
            { choices: [], usage: { prompt_tokens: 8, completion_tokens: 2, total_tokens: 10 } },
          ])
        : jsonResponse({}),
    );
    const taps: unknown[] = [];
    await callAIStream(
      "Say OK",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "groq",
        apiKey: "gsk_test_key",
        model: "openai/gpt-oss-120b",
        baseUrl: "https://api.groq.com/openai/v1",
      },
    );
    expect(taps).toEqual([{ promptTokens: 8, completionTokens: 2, totalTokens: 10 }]);
    const body = JSON.parse(String(log[0].init?.body)) as Record<string, unknown>;
    expect(body.stream_options).toEqual({ include_usage: true });
  });

  it("nvidia stream: NO stream_options (undocumented for NIM) — but an opportunistic usage chunk still fires the tap", async () => {
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("integrate.api.nvidia.com")
        ? sseResponse([
            { choices: [{ delta: { content: "NIM" }, finish_reason: "stop" }] },
            { choices: [], usage: { prompt_tokens: 30, completion_tokens: 6, total_tokens: 36 } },
          ])
        : jsonResponse({}),
    );
    const taps: unknown[] = [];
    const text = await callAIStream(
      "Say NIM",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "nvidia",
        apiKey: "nvapi-test",
        model: "nvidia/nemotron-3-ultra-550b-a55b",
        baseUrl: "https://integrate.api.nvidia.com/v1",
      },
    );
    expect(text).toBe("NIM");
    expect(taps).toEqual([{ promptTokens: 30, completionTokens: 6, totalTokens: 36 }]);
    const body = JSON.parse(String(log[0].init?.body)) as Record<string, unknown>;
    expect(body.stream_options).toBeUndefined();
  });

  it("a stream whose final chunk carries NO usage never fires the tap (fallback stays)", async () => {
    stubFetch([], (c) =>
      String(c.url).includes("integrate.api.nvidia.com")
        ? sseResponse([{ choices: [{ delta: { content: "OK" }, finish_reason: "stop" }] }])
        : jsonResponse({}),
    );
    const taps: unknown[] = [];
    const text = await callAIStream(
      "Say OK",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "nvidia",
        apiKey: "nvapi-test",
        model: "nvidia/nemotron-3-ultra-550b-a55b",
        baseUrl: "https://integrate.api.nvidia.com/v1",
      },
    );
    expect(text).toBe("OK");
    expect(taps).toEqual([]);
  });
});

describe("INF-19 — the Gemini native adapters push usageMetadata through the tap", () => {
  it("callAI (gemini generateContent): usageMetadata fires the tap with the native counts", async () => {
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("generativelanguage.googleapis.com")
        ? jsonResponse({
            candidates: [{ content: { parts: [{ text: "مرحبا" }] } }],
            usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 3, totalTokenCount: 10 },
          })
        : jsonResponse({}),
    );
    const taps: unknown[] = [];
    const text = await callAI(
      "قل مرحبا",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "gemini",
        apiKey: "AIza-test",
        model: "gemini-3.5-flash",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      },
    );
    expect(text).toBe("مرحبا");
    expect(taps).toEqual([{ promptTokens: 7, completionTokens: 3, totalTokens: 10 }]);
  });

  it("totalTokenCount absent ⇒ prompt+candidates (same normalization as the compat arm)", async () => {
    stubFetch([], (c) =>
      String(c.url).includes("generativelanguage.googleapis.com")
        ? jsonResponse({
            candidates: [{ content: { parts: [{ text: "hi" }] } }],
            usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 2 },
          })
        : jsonResponse({}),
    );
    const taps: unknown[] = [];
    await callAI(
      "say hi",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "gemini",
        apiKey: "AIza-test",
        model: "gemini-3.5-flash",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      },
    );
    expect(taps).toEqual([{ promptTokens: 4, completionTokens: 2, totalTokens: 6 }]);
  });

  it("callAIStream (gemini streamGenerateContent): the usageMetadata chunk fires the tap", async () => {
    stubFetch([], (c) =>
      String(c.url).includes("generativelanguage.googleapis.com")
        ? sseResponse([
            {
              candidates: [{ content: { parts: [{ text: "Hel" }] } }],
            },
            {
              candidates: [{ content: { parts: [{ text: "lo" }] } }],
              usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 4, totalTokenCount: 15 },
            },
          ])
        : jsonResponse({}),
    );
    const taps: unknown[] = [];
    const text = await callAIStream(
      "Say hello",
      { maxTokens: 10, onUsage: (u) => taps.push(u) },
      {
        provider: "gemini",
        apiKey: "AIza-test",
        model: "gemini-3.5-flash",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      },
    );
    expect(text).toBe("Hello");
    expect(taps).toEqual([{ promptTokens: 11, completionTokens: 4, totalTokens: 15 }]);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * LAW 2 — the CHAIN feeds the central meter with the real usage
 * ══════════════════════════════════════════════════════════════════════ */
describe("INF-19 — callFreeAIFallbackChain meters the REAL usage of the winning attempt", () => {
  beforeEach(() => {
    __resetChainRotationForTests();
    __resetCooldownForTests();
  });

  it("a groq attempt whose response carries usage → the Upstash pipeline gets the REAL token counters + the free-tier cost, and NO chars/4 double-count", async () => {
    process.env.GROQ_API_KEY = "gsk-test";
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH;
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("api.groq.com") ? jsonResponse(GROQ_OK_WITH_USAGE) : jsonResponse([{ result: "OK" }]),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await callFreeAIFallbackChain("reply with PONG", {
      tag: "p2-3-chain-real",
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20_000,
      maxModels: 3,
      chain: "fast",
    });
    expect(out.text).toBe("PONG");
    expect(out.provider).toBe("groq");
    await flushMeter();
    const meterPost = log.find((c) => String(c.url).includes("example-upstash.fake") && String(c.init?.body).includes("ai:usage"));
    expect(meterPost).toBeDefined();
    const cmds = JSON.parse(String(meterPost?.init?.body)) as string[][];
    const date = new Date().toISOString().slice(0, 10);
    const base = `ai:usage:${date}:p2-3-chain-real:groq:openai_gpt-oss-20b:`;
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_prompt`, "123"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_completion`, "45"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_total`, "168"]);
    expect(cmds).toContainEqual(["INCRBYFLOAT", `${base}cost_usd_cents`, "0"]); // free tier — known zero
    expect(cmds.some((c) => c[1]?.endsWith(":tokens_est"))).toBe(false); // no estimate double-count
  });

  it("a response WITHOUT usage keeps the chars/4 estimate metric exactly as before (regression pin)", async () => {
    process.env.GROQ_API_KEY = "gsk-test";
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH;
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("api.groq.com") ? jsonResponse(GROQ_OK_WITHOUT_USAGE) : jsonResponse([{ result: "OK" }]),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await callFreeAIFallbackChain("reply with PONG", {
      tag: "p2-3-chain-est",
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20_000,
      maxModels: 3,
      chain: "fast",
    });
    expect(out.text).toBe("PONG");
    await flushMeter();
    const meterPost = log.find((c) => String(c.url).includes("example-upstash.fake") && String(c.init?.body).includes("ai:usage"));
    expect(meterPost).toBeDefined();
    const cmds = JSON.parse(String(meterPost?.init?.body)) as string[][];
    const date = new Date().toISOString().slice(0, 10);
    const base = `ai:usage:${date}:p2-3-chain-est:groq:openai_gpt-oss-20b:`;
    expect(cmds.some((c) => c[0] === "INCRBYFLOAT" && c[1] === `${base}tokens_est` && Number(c[2]) > 0)).toBe(true);
    expect(cmds.some((c) => c[1]?.endsWith(":tokens_total"))).toBe(false);
    expect(cmds.some((c) => c[1]?.endsWith(":cost_usd_cents"))).toBe(false);
  });

  it("a STREAMED chain attempt (onDelta) still meters the real usage of the final chunk — the two taps coexist", async () => {
    process.env.GROQ_API_KEY = "gsk-test";
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH;
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("api.groq.com")
        ? sseResponse([
            { choices: [{ delta: { content: "streamed-PONG" } }] },
            { choices: [{ finish_reason: "stop" }] },
            { choices: [], usage: { prompt_tokens: 55, completion_tokens: 22, total_tokens: 77 } },
          ])
        : jsonResponse([{ result: "OK" }]),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const seen: string[] = [];
    const out = await callFreeAIFallbackChain("reply with PONG", {
      tag: "p2-3-chain-stream",
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20_000,
      maxModels: 3,
      chain: "fast",
      onDelta: (c) => seen.push(c),
    });
    expect(out.text).toBe("streamed-PONG");
    expect(seen).toEqual(["streamed-PONG"]);
    await flushMeter();
    const meterPost = log.find((c) => String(c.url).includes("example-upstash.fake") && String(c.init?.body).includes("ai:usage"));
    expect(meterPost).toBeDefined();
    const cmds = JSON.parse(String(meterPost?.init?.body)) as string[][];
    const date = new Date().toISOString().slice(0, 10);
    const base = `ai:usage:${date}:p2-3-chain-stream:groq:openai_gpt-oss-20b:`;
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_prompt`, "55"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_total`, "77"]);
    expect(cmds.some((c) => c[1]?.endsWith(":tokens_est"))).toBe(false);
  });

  it("a caller-provided onUsage is NOT forwarded into the attempt (the chain owns the tap slot)", async () => {
    process.env.GROQ_API_KEY = "gsk-test";
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH;
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    const log: FetchCall[] = [];
    stubFetch(log, (c) => {
      const url = String(c.url);
      if (url.includes("api.groq.com")) {
        const body = JSON.parse(String(c.init?.body)) as Record<string, unknown>;
        expect(body.onUsage).toBeUndefined(); // must never ride the WIRE
        return jsonResponse(GROQ_OK_WITH_USAGE);
      }
      return jsonResponse([{ result: "OK" }]);
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const callerTap = vi.fn();
    const out = await callFreeAIFallbackChain("reply with PONG", {
      tag: "p2-3-chain-owned",
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20_000,
      maxModels: 3,
      chain: "fast",
      onUsage: callerTap,
    } as Parameters<typeof callFreeAIFallbackChain>[1]);
    expect(out.text).toBe("PONG");
    await flushMeter();
    // The meter (not the caller's tap) received the usage — the chain owns the slot.
    expect(callerTap).not.toHaveBeenCalled();
    const meterPost = log.find((c) => String(c.url).includes("example-upstash.fake") && String(c.init?.body).includes("ai:usage"));
    const cmds = JSON.parse(String(meterPost?.init?.body)) as string[][];
    expect(cmds.some((c) => c[1]?.endsWith(":tokens_total"))).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * LAW 3 — the GROUNDED arms read the usage of their own walks
 * ══════════════════════════════════════════════════════════════════════ */
describe("INF-19 — the grounded arms meter the real usage of their walks", () => {
  beforeEach(() => {
    __resetCooldownForTests();
  });

  it("groq browser_search arm: the OpenAI-compatible usage block of the walk reaches the meter (not the estimate)", async () => {
    process.env.GROQ_API_KEY = "gsk-test";
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH;
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("api.groq.com")
        ? jsonResponse({
            choices: [
              {
                message: {
                  content: "Grounded answer built on the live browser_search walk.",
                  executed_tools: [
                    {
                      name: "browser.search",
                      index: 0,
                      type: "browser_search",
                      search_results: {
                        results: [
                          { title: "WHO", url: "https://www.who.int/news-room/fact-sheets", content: "", score: 0 },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            usage: { prompt_tokens: 400, completion_tokens: 260, total_tokens: 660 },
          })
        : jsonResponse([{ result: "OK" }]),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await callGroqGroundedSearch("research something real", {
      tag: "p2-3-groq-grounded",
      timeoutMs: 8_000,
    });
    expect(out.provider).toBe("groq");
    expect(out.text).toContain("Grounded answer");
    await flushMeter();
    const meterPost = log.find((c) => String(c.url).includes("example-upstash.fake") && String(c.init?.body).includes("ai:usage"));
    expect(meterPost).toBeDefined();
    const cmds = JSON.parse(String(meterPost?.init?.body)) as string[][];
    const date = new Date().toISOString().slice(0, 10);
    const base = `ai:usage:${date}:p2-3-groq-grounded:groq:openai_gpt-oss-120b_browser_search:`;
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_prompt`, "400"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_completion`, "260"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_total`, "660"]);
    // the decorated label still prices at the base model's free-tier row
    expect(cmds).toContainEqual(["INCRBYFLOAT", `${base}cost_usd_cents`, "0"]);
    expect(cmds.some((c) => c[1]?.endsWith(":tokens_est"))).toBe(false);
  });

  it("gemini googleSearch arm: usageMetadata of the grounded call reaches the meter", async () => {
    process.env.GEMINI_API_KEY = "AIza-test";
    process.env.UPSTASH_REDIS_REST_URL = UPSTASH;
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    const log: FetchCall[] = [];
    stubFetch(log, (c) =>
      String(c.url).includes("generativelanguage.googleapis.com")
        ? jsonResponse({
            candidates: [
              {
                content: { parts: [{ text: '{"keywords":[],"faqs":[],"topics":["t"]}' }] },
                groundingMetadata: {
                  webSearchQueries: ["protein per day"],
                  groundingChunks: [{ web: { uri: "https://examine.com/protein", title: "Protein" } }],
                },
              },
            ],
            usageMetadata: { promptTokenCount: 90, candidatesTokenCount: 35, totalTokenCount: 125 },
          })
        : jsonResponse([{ result: "OK" }]),
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await callGeminiGroundedSearch("research protein per day", {
      tag: "p2-3-gem-grounded",
      timeoutMs: 8_000,
    });
    expect(out.provider).toBe("gemini");
    expect(out.grounding.sources.length).toBeGreaterThan(0);
    await flushMeter();
    const meterPost = log.find((c) => String(c.url).includes("example-upstash.fake") && String(c.init?.body).includes("ai:usage"));
    expect(meterPost).toBeDefined();
    const cmds = JSON.parse(String(meterPost?.init?.body)) as string[][];
    const date = new Date().toISOString().slice(0, 10);
    const base = `ai:usage:${date}:p2-3-gem-grounded:gemini:gemini-3.5-flash_googlesearch:`;
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_prompt`, "90"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_completion`, "35"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_total`, "125"]);
    expect(cmds).toContainEqual(["INCRBYFLOAT", `${base}cost_usd_cents`, "0"]);
    expect(cmds.some((c) => c[1]?.endsWith(":tokens_est"))).toBe(false);
  });
});
