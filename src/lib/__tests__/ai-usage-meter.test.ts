/**
 * AI USAGE METER CANARIES (Phase 388 — R2, owner clause 3 of the
 * AI-Router unification order 2026-10-31 «تنفيذ العدادات المركزية لكل
 * (مزود × نموذج × وظيفة)، بما فيها Tavily وExa، مع جعل التسجيل اختياريًا
 * وFail-Open تمامًا، وعدم تعطيل التوليد عند فشل التخزين»).
 *
 * Pins the three binding laws:
 *   1. OPTIONAL — AI_METER=0 → NO fetch, NO console line.
 *   2. FAIL-OPEN COMPLETELY — a rejected/unreachable Upstash NEVER throws
 *      (generation can never be disabled by metering), and the walk still
 *      succeeds through the meter taps (engine-level proof).
 *   3. THE KEY CONTRACT — ai:usage:{date}:{fn}:{provider}:{model}:{metric}
 *      with the gemini-counter sanitization convention; Tavily/Exa monthly
 *      quota keys; the official credit/cost model; the day read-back.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  EXA_CONTENTS_CENTS,
  EXA_MONTH_USD_CENTS_LIMIT,
  EXA_SEARCH_CENTS,
  TAVILY_CREDIT_ADVANCED,
  TAVILY_CREDIT_BASIC,
  TAVILY_MONTH_CREDIT_LIMIT,
  aiMeterEnabled,
  aiMeterKey,
  exaUsageMonthKey,
  readAIMeterDay,
  sanitizeMeterModel,
  tavilyExtractCredits,
  tavilySearchCredits,
  tavilyUsageMonthKey,
  trackAIMeterAttempt,
  trackExaCostCents,
  trackTavilyCredits,
} from "../ai-usage-meter";

const ENV_KEYS = ["AI_METER", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];

const URL = "https://example-upstash.fake";
const TOKEN = "fake-token";

type FetchCall = { url: string; init?: RequestInit };

function stubFetch(log: FetchCall[], responder: (call: FetchCall) => Response | Promise<Response>) {
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: String(input), init };
    log.push(call);
    return responder(call);
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

function jsonResponse(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), {
    status: ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
}

describe("R2 — the optional/fail-open/contract laws of the central meter", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("AI_METER=0 disables EVERYTHING — no fetch, no console line", async () => {
    process.env.AI_METER = "0";
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    expect(aiMeterEnabled()).toBe(false);
    const log: FetchCall[] = [];
    stubFetch(log, () => {
      throw new Error("fetch must never run with AI_METER=0");
    });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await trackAIMeterAttempt({ fn: "plan:nutrition", provider: "groq", model: "openai/gpt-oss-120b", outcome: "ok" });
    await trackTavilyCredits(TAVILY_CREDIT_BASIC, "blog:research");
    await trackExaCostCents(EXA_SEARCH_CENTS, "blog:research");
    expect(log).toHaveLength(0);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("default (absent AI_METER) = ENABLED", () => {
    expect(aiMeterEnabled()).toBe(true);
  });

  it("an unreachable/rejecting Upstash NEVER throws — the fail-open law", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    stubFetch([], () => Promise.reject(new Error("upstash down")));
    vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(
      trackAIMeterAttempt({ fn: "evo-chat", provider: "groq", model: "openai/gpt-oss-20b", outcome: "fail", latencyMs: 12 }),
    ).resolves.toBeUndefined();
    await expect(trackTavilyCredits(2)).resolves.toBeUndefined();
    await expect(trackExaCostCents(0.4)).resolves.toBeUndefined();
  });

  it("a THROWING internal path is still swallowed (belt+suspenders)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    // No token → early return path; force an internal throw via a broken env shape
    (process.env as Record<string, string>).UPSTASH_REDIS_REST_TOKEN = "";
    vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("console exploded");
    });
    await expect(
      trackAIMeterAttempt({ fn: "x", provider: "groq", model: "m", outcome: "ok" }),
    ).resolves.toBeUndefined();
  });

  it("the structured [ai-meter] line is ALWAYS printed when enabled (audit source)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    stubFetch([], () => jsonResponse([{ result: "OK" }]));
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      lines.push(args.join(" "));
    });
    await trackAIMeterAttempt({
      fn: "blog:pairing",
      provider: "cloudflare",
      model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      outcome: "ok",
      latencyMs: 1234,
      tokensEst: 456,
    });
    const line = lines.find((l) => l.includes("[ai-meter]"));
    expect(line).toBeDefined();
    expect(line).toContain("fn=blog_pairing");
    expect(line).toContain("provider=cloudflare");
    expect(line).toContain("model=cf_meta_llama-3.3-70b-instruct-fp8-fast");
    expect(line).toContain("outcome=ok");
    expect(line).toContain("latency=1234ms");
    expect(line).toContain("tokens_est=456");
  });

  it("THE KEY CONTRACT: ai:usage:{date}:{fn}:{provider}:{model}:{metric} (sanitized)", () => {
    expect(aiMeterKey("2026-10-31", "plan:nutrition", "openrouter", "nvidia/nemotron-3-ultra-550b-a55b:free", "ok")).toBe(
      "ai:usage:2026-10-31:plan_nutrition:openrouter:nvidia_nemotron-3-ultra-550b-a55b_free:ok",
    );
    expect(sanitizeMeterModel("openai/gpt-oss-120b")).toBe("openai_gpt-oss-120b");
    expect(sanitizeMeterModel("")).toBe("unknown");
  });

  it("one attempt bumps calls + outcome (+tokens_est float) + EXPIRE NX TTL 30d", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
    await trackAIMeterAttempt({
      fn: "evo-eval",
      provider: "groq",
      model: "openai/gpt-oss-120b",
      outcome: "quota",
      tokensEst: 100,
    });
    expect(log).toHaveLength(1);
    const cmds = JSON.parse(String(log[0].init?.body)) as string[][];
    const date = new Date().toISOString().slice(0, 10);
    const base = `ai:usage:${date}:evo-eval:groq:openai_gpt-oss-120b:`;
    expect(cmds).toContainEqual(["INCRBY", `${base}calls`, "1"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}quota`, "1"]);
    expect(cmds).toContainEqual(["INCRBYFLOAT", `${base}tokens_est`, "100"]);
    const expires = cmds.filter((c) => c[0] === "EXPIRE");
    expect(expires).toHaveLength(3); // one per touched key
    for (const e of expires) {
      expect(e[2]).toBe(String(30 * 24 * 60 * 60));
      expect(e[3]).toBe("NX");
    }
  });

  it("quota/fail/empty/ok all land on their own metric key", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
    for (const outcome of ["ok", "empty", "fail", "quota"] as const) {
      await trackAIMeterAttempt({ fn: "meal-demo", provider: "gemini", model: "gemini-3.5-flash", outcome });
    }
    expect(log).toHaveLength(4);
    const date = new Date().toISOString().slice(0, 10);
    const all = log.flatMap((c) => JSON.parse(String(c.init?.body)) as string[][]);
    expect(all).toContainEqual(["INCRBY", `ai:usage:${date}:meal-demo:gemini:gemini-3.5-flash:ok`, "1"]);
    expect(all).toContainEqual(["INCRBY", `ai:usage:${date}:meal-demo:gemini:gemini-3.5-flash:empty`, "1"]);
    expect(all).toContainEqual(["INCRBY", `ai:usage:${date}:meal-demo:gemini:gemini-3.5-flash:fail`, "1"]);
    expect(all).toContainEqual(["INCRBY", `ai:usage:${date}:meal-demo:gemini:gemini-3.5-flash:quota`, "1"]);
  });
});

describe("R2 — Tavily/Exa monthly quota meters (gap D-3 closed)", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("the official credit model: basic=1 · advanced=2 · extract=1 per 5 URLs", () => {
    expect(TAVILY_CREDIT_BASIC).toBe(1);
    expect(TAVILY_CREDIT_ADVANCED).toBe(2);
    expect(tavilySearchCredits("basic")).toBe(1);
    expect(tavilySearchCredits("advanced")).toBe(2);
    expect(tavilyExtractCredits(3)).toBe(1);
    expect(tavilyExtractCredits(5)).toBe(1);
    expect(tavilyExtractCredits(10)).toBe(2);
    expect(TAVILY_MONTH_CREDIT_LIMIT).toBe(1000);
  });

  it("the Exa cost model: search 0.4¢ + contents 0.1¢ against the $10 grant", () => {
    expect(EXA_SEARCH_CENTS).toBe(0.4);
    expect(EXA_CONTENTS_CENTS).toBe(0.1);
    expect(EXA_MONTH_USD_CENTS_LIMIT).toBe(1000);
  });

  it("monthly keys carry the month, not the date", () => {
    expect(tavilyUsageMonthKey("2026-10")).toBe("tavily:usage:2026-10:credits");
    expect(exaUsageMonthKey("2026-10")).toBe("exa:usage:2026-10:usd-cents");
  });

  it("credits/costs accumulate via INCRBYFLOAT + EXPIRE NX", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
    await trackTavilyCredits(2, "blog:research");
    await trackExaCostCents(0.5, "blog:research");
    const month = new Date().toISOString().slice(0, 7);
    const t = JSON.parse(String(log[0].init?.body)) as string[][];
    expect(t[0]).toEqual(["INCRBYFLOAT", `tavily:usage:${month}:credits`, "2"]);
    const e = JSON.parse(String(log[1].init?.body)) as string[][];
    expect(e[0]).toEqual(["INCRBYFLOAT", `exa:usage:${month}:usd-cents`, "0.5"]);
  });

  it("non-positive values are ignored (no phantom accounting)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
    await trackTavilyCredits(0);
    await trackTavilyCredits(-3);
    await trackExaCostCents(Number.NaN);
    expect(log).toHaveLength(0);
  });
});

describe("R2 — the day read-back (queue-health panel source)", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("no Upstash → [] (fail-open)", async () => {
    expect(await readAIMeterDay("2026-10-31")).toEqual([]);
  });

  it("SCAN+MGET rows are assembled into (fn,provider,model) rows", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const keys = [
      "ai:usage:2026-10-31:plan_nutrition:groq:openai_gpt-oss-120b:calls",
      "ai:usage:2026-10-31:plan_nutrition:groq:openai_gpt-oss-120b:ok",
      "ai:usage:2026-10-31:plan_nutrition:groq:openai_gpt-oss-120b:fail",
      "ai:usage:2026-10-31:evo-chat:groq:openai_gpt-oss-20b:calls",
      "ai:usage:2026-10-31:evo-chat:groq:openai_gpt-oss-20b:ok",
    ];
    stubFetch([], (call) => {
      const body = JSON.parse(String(call.init?.body)) as string[][];
      if (body[0]?.[0] === "SCAN") return jsonResponse([{ result: ["0", keys] }]);
      if (body[0]?.[0] === "MGET") return jsonResponse([{ result: ["3", "2", "1", "7", "7"] }]);
      return jsonResponse([{ result: "OK" }]);
    });
    const rows = await readAIMeterDay("2026-10-31");
    expect(rows).toHaveLength(2);
    const plan = rows.find((r) => r.fn === "plan_nutrition")!;
    expect(plan.provider).toBe("groq");
    expect(plan.model).toBe("openai_gpt-oss-120b");
    expect(plan.calls).toBe(3);
    expect(plan.ok).toBe(2);
    expect(plan.fail).toBe(1);
    const evo = rows.find((r) => r.fn === "evo-chat")!;
    expect(evo.calls).toBe(7);
    expect(evo.ok).toBe(7);
  });

  it("malformed keys / values are skipped, outages return []", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    stubFetch([], () => jsonResponse([{ result: "not-a-scan-page" }]));
    expect(await readAIMeterDay("2026-10-31")).toEqual([]);
    stubFetch([], () => new Response("boom", { status: 500 }));
    expect(await readAIMeterDay("2026-10-31")).toEqual([]);
  });
});

describe("R2 — the ENGINE-level fail-open proof (clause 3: generation NEVER disabled)", () => {
  beforeEach(() => {
    for (const k of [
      ...ENV_KEYS,
      "AI_PROVIDER_COOLDOWN_MS",
      "OPENROUTER_API",
      "OPENROUTER_API_KEY",
      "GROQ_API_KEY",
      "NVIDIA_API_KEY",
      "GEMINI_API_KEY",
      "CLOUDFLARE_AI_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "GEMINI_MODEL",
      "AI_CHAIN_TOTAL_BUDGET_MS",
    ]) delete process.env[k];
  });
  afterEach(() => {
    for (const k of [
      ...ENV_KEYS,
      "AI_PROVIDER_COOLDOWN_MS",
      "OPENROUTER_API",
      "OPENROUTER_API_KEY",
      "GROQ_API_KEY",
      "NVIDIA_API_KEY",
      "GEMINI_API_KEY",
      "CLOUDFLARE_AI_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "GEMINI_MODEL",
      "AI_CHAIN_TOTAL_BUDGET_MS",
    ]) delete process.env[k];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("the walk SUCCEEDS while the meter store is hard-down (chain returns text, meter swallowed)", async () => {
    process.env.GROQ_API_KEY = "gsk-test";
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const { __resetChainRotationForTests } = await import("../ai-provider");
    const cooldown = await import("../ai-provider-cooldown");
    const { cooldownState } = cooldown;
    __resetChainRotationForTests();
    cooldown.__resetCooldownForTests();
    let providerCalls = 0;
    // Upstash path rejects EVERY time (hard-down); the provider succeeds.
    stubFetch([], (call) => {
      if (String(call.url).includes("example-upstash.fake")) {
        providerCalls += 0;
        return Promise.reject(new Error("upstash hard down"));
      }
      providerCalls += 1;
      return jsonResponse({
        choices: [{ message: { content: '{"ok":true}' } }],
      });
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { callFreeAIFallbackChain } = await import("../ai-provider");
    const out = await callFreeAIFallbackChain("reply with JSON", {
      tag: "evo-eval",
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20_000,
      maxModels: 3,
      chain: "fast",
    });
    expect(out.text).toContain('"ok":true');
    expect(out.provider).toBe("groq");
    expect(providerCalls).toBeGreaterThan(0);
    expect(cooldownState("chain:groq")).toBeNull(); // no cooldown poison from the meter
  });
});
