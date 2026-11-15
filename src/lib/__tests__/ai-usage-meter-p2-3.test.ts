/**
 * P2-3 CANARIES (audit AI-GENERATION-PIPELINES 2026-11-15, item 3 — INF-19
 * «العداد الحقيقي»: قراءة usage الفعلية بالمحولات + جدول تكلفة لكل موديل).
 *
 * This file pins the METER-side laws of the real-usage remedy:
 *   1. REAL USAGE METRICS — an attempt carrying `usage` bumps the integer
 *      counters tokens_prompt/tokens_completion/tokens_total AND the
 *      per-model cost (cost_usd_cents, INCRBYFLOAT) — the chars/4
 *      tokens_est estimate is recorded ONLY as the fallback when the
 *      provider did not report usage (the audit's core complaint).
 *   2. THE COST TABLE — every model the chains actually walk is listed
 *      with its TRUE price (all free-tier today: 0.0/0.0 + freeTier
 *      flag — a measured fact, not a placeholder); the OpenRouter `:free`
 *      rule; the `+arm` suffix stripping (browser_search/googleSearch);
 *      UNKNOWN models record NO cost key (honest unknown, never
 *      fabricated) and print cost_cents=?.
 *   3. THE STANDING METER LAWS SURVIVE THE EXTENSION — AI_METER=0 kills
 *      everything including the usage metrics; a down/rejecting Upstash
 *      with usage present still resolves (fail-open unchanged); the
 *      day read-back assembles the new metrics into rows.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AI_MODEL_COST_TABLE,
  aiMeterKey,
  lookupModelPrice,
  modelCostUsdCents,
  readAIMeterDay,
  trackAIMeterAttempt,
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

/** Parse the INCRBY/INCRBYFLOAT commands of one meter POST body. */
function cmdsOf(call: FetchCall): string[][] {
  return JSON.parse(String(call.init?.body)) as string[][];
}

describe("P2-3/INF-19 — the REAL-usage metrics written by the central meter", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("an attempt with REAL usage bumps tokens_prompt/completion/total (INCRBY) + cost (INCRBYFLOAT) + EXPIRE NX", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
    await trackAIMeterAttempt({
      fn: "plan:nutrition",
      provider: "groq",
      model: "openai/gpt-oss-120b",
      outcome: "ok",
      latencyMs: 900,
      usage: { promptTokens: 123, completionTokens: 45, totalTokens: 168 },
    });
    expect(log).toHaveLength(1);
    const cmds = cmdsOf(log[0]);
    const date = new Date().toISOString().slice(0, 10);
    const base = `ai:usage:${date}:plan_nutrition:groq:openai_gpt-oss-120b:`;
    expect(cmds).toContainEqual(["INCRBY", `${base}calls`, "1"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}ok`, "1"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_prompt`, "123"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_completion`, "45"]);
    expect(cmds).toContainEqual(["INCRBY", `${base}tokens_total`, "168"]);
    // free-tier model: the KNOWN price is 0 — the cost key is written with
    // the honest zero (the accounting RAN), not skipped.
    expect(cmds).toContainEqual(["INCRBYFLOAT", `${base}cost_usd_cents`, "0"]);
    const expires = cmds.filter((c) => c[0] === "EXPIRE");
    expect(expires).toHaveLength(6); // one per touched key (calls/ok/3 tokens/cost)
    for (const e of expires) {
      expect(e[2]).toBe(String(30 * 24 * 60 * 60));
      expect(e[3]).toBe("NX");
    }
  });

  it("REAL usage present ⇒ the chars/4 estimate is NOT double-recorded (no tokens_est key)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
    await trackAIMeterAttempt({
      fn: "evo-chat",
      provider: "groq",
      model: "openai/gpt-oss-20b",
      outcome: "ok",
      tokensEst: 999, // an estimate AND real usage both given — usage wins
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });
    const cmds = cmdsOf(log[0]);
    expect(cmds).toContainEqual(["INCRBY", `ai:usage:${new Date().toISOString().slice(0, 10)}:evo-chat:groq:openai_gpt-oss-20b:tokens_total`, "15"]);
    expect(cmds.some((c) => c[1]?.endsWith(":tokens_est"))).toBe(false);
  });

  it("no usage reported ⇒ the estimate fallback is recorded exactly as before (regression pin)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
    await trackAIMeterAttempt({
      fn: "meal-demo",
      provider: "nvidia",
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      outcome: "ok",
      tokensEst: 77,
    });
    const cmds = cmdsOf(log[0]);
    expect(cmds).toContainEqual(["INCRBYFLOAT", `ai:usage:${new Date().toISOString().slice(0, 10)}:meal-demo:nvidia:nvidia_nemotron-3-ultra-550b-a55b:tokens_est`, "77"]);
    expect(cmds.some((c) => c[1]?.endsWith(":tokens_total"))).toBe(false);
  });

  it("the structured [ai-meter] line carries the real usage + the known cost", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    stubFetch([], () => jsonResponse([{ result: "OK" }]));
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      lines.push(args.join(" "));
    });
    await trackAIMeterAttempt({
      fn: "blog:pairing",
      provider: "groq",
      model: "openai/gpt-oss-120b",
      outcome: "ok",
      latencyMs: 4321,
      usage: { promptTokens: 123, completionTokens: 45, totalTokens: 168 },
    });
    const line = lines.find((l) => l.includes("[ai-meter]"));
    expect(line).toBeDefined();
    expect(line).toContain("tokens_est=-"); // estimate absent
    expect(line).toContain("tokens_in=123");
    expect(line).toContain("tokens_out=45");
    expect(line).toContain("tokens_total=168");
    expect(line).toContain("cost_cents=0"); // free-tier price KNOWN
  });

  it("AI_METER=0 disables the usage metrics too — no fetch, no console line", async () => {
    process.env.AI_METER = "0";
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await trackAIMeterAttempt({
      fn: "plan:workout",
      provider: "groq",
      model: "openai/gpt-oss-120b",
      outcome: "ok",
      usage: { promptTokens: 5, completionTokens: 6, totalTokens: 11 },
    });
    expect(log).toHaveLength(0);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("a down/rejecting Upstash with usage present NEVER throws (fail-open law unchanged)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    stubFetch([], () => Promise.reject(new Error("upstash hard down")));
    vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(
      trackAIMeterAttempt({
        fn: "plan:nutrition",
        provider: "openrouter",
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        outcome: "ok",
        usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
      }),
    ).resolves.toBeUndefined();
  });
});

describe("P2-3/INF-19 — the per-model cost table (honest-accounting laws)", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("every chain model is listed with its TRUE free-tier price (0.0/0.0 + freeTier)", () => {
    const expected = [
      "openrouter:nvidia/nemotron-3-ultra-550b-a55b:free",
      "groq:openai/gpt-oss-120b",
      "groq:openai/gpt-oss-20b",
      "nvidia:nvidia/nemotron-3-ultra-550b-a55b",
      "groq:qwen/qwen3.8-27b",
      "nvidia:nvidia/nemotron-3.5-lightning-30b-a3b",
      "gemini:gemini-3.5-flash",
      "gemini:gemini-3.8-flash",
      "gemini:gemini-3.5-flash-lite",
    ];
    for (const key of expected) {
      const price = AI_MODEL_COST_TABLE[key];
      expect(price, `cost row missing: ${key}`).toBeDefined();
      expect(price.promptUsdPerMillion).toBe(0);
      expect(price.completionUsdPerMillion).toBe(0);
      expect(price.freeTier).toBe(true);
    }
  });

  it("the OpenRouter `:free` rule prices an unlisted free id at 0 (catch-all)", () => {
    const price = lookupModelPrice("openrouter", "meta/llama-4-scout:free");
    expect(price).not.toBeNull();
    expect(price?.promptUsdPerMillion).toBe(0);
    expect(price?.freeTier).toBe(true);
  });

  it("the `+arm` decoration is stripped — grounded arms price at their model's row", () => {
    expect(lookupModelPrice("groq", "openai/gpt-oss-120b+browser_search")).toEqual(
      AI_MODEL_COST_TABLE["groq:openai/gpt-oss-120b"],
    );
    expect(lookupModelPrice("gemini", "gemini-3.5-flash+googleSearch")).toEqual(
      AI_MODEL_COST_TABLE["gemini:gemini-3.5-flash"],
    );
  });

  it("UNKNOWN models get NO price — honest unknown, never a fabricated number", () => {
    expect(lookupModelPrice("groq", "totally/made-up-model")).toBeNull();
    expect(lookupModelPrice("openrouter", "totally/made-up-model")).toBeNull();
    expect(lookupModelPrice("cloudflare", "@cf/meta/llama-3.3-70b-instruct-fp8-fast")).toBeNull(); // neurons-billed, no token row by law
  });

  it("an unknown-price attempt records NO cost key and prints cost_cents=?", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const log: FetchCall[] = [];
    stubFetch(log, () => jsonResponse([{ result: "OK" }]));
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      lines.push(args.join(" "));
    });
    await trackAIMeterAttempt({
      fn: "evo-eval",
      provider: "groq",
      model: "totally/made-up-model",
      outcome: "ok",
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    });
    const cmds = cmdsOf(log[0]);
    expect(cmds).toContainEqual(["INCRBY", `ai:usage:${new Date().toISOString().slice(0, 10)}:evo-eval:groq:totally_made-up-model:tokens_total`, "150"]);
    expect(cmds.some((c) => c[1]?.endsWith(":cost_usd_cents"))).toBe(false); // no fabricated cost
    expect(lines.find((l) => l.includes("[ai-meter]"))).toContain("cost_cents=?");
  });

  it("modelCostUsdCents computes the true paid math when a real price exists (table injected, restored)", () => {
    const key = "openrouter:openai/gpt-5";
    const saved = AI_MODEL_COST_TABLE[key];
    try {
      AI_MODEL_COST_TABLE[key] = {
        promptUsdPerMillion: 1.25,
        completionUsdPerMillion: 10,
        freeTier: false,
      };
      // 2M prompt + 0.5M completion = 2×1.25 + 0.5×10 = $7.50 = 750 cents
      expect(
        modelCostUsdCents("openrouter", "openai/gpt-5", {
          promptTokens: 2_000_000,
          completionTokens: 500_000,
          totalTokens: 2_500_000,
        }),
      ).toBe(750);
    } finally {
      if (saved === undefined) delete AI_MODEL_COST_TABLE[key];
      else AI_MODEL_COST_TABLE[key] = saved;
    }
    expect(AI_MODEL_COST_TABLE[key]).toBeUndefined(); // restored — no test residue
  });

  it("the meter key contract is UNCHANGED (7 parts, sanitized)", () => {
    expect(aiMeterKey("2026-11-15", "plan:nutrition", "groq", "openai/gpt-oss-120b", "tokens_total")).toBe(
      "ai:usage:2026-11-15:plan_nutrition:groq:openai_gpt-oss-120b:tokens_total",
    );
  });
});

describe("P2-3/INF-19 — the day read-back assembles the real-usage rows", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("SCAN+MGET rows carry tokensPrompt/Completion/Total + costUsdCents", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const keys = [
      "ai:usage:2026-11-15:plan_nutrition:groq:openai_gpt-oss-120b:calls",
      "ai:usage:2026-11-15:plan_nutrition:groq:openai_gpt-oss-120b:ok",
      "ai:usage:2026-11-15:plan_nutrition:groq:openai_gpt-oss-120b:tokens_prompt",
      "ai:usage:2026-11-15:plan_nutrition:groq:openai_gpt-oss-120b:tokens_completion",
      "ai:usage:2026-11-15:plan_nutrition:groq:openai_gpt-oss-120b:tokens_total",
      "ai:usage:2026-11-15:plan_nutrition:groq:openai_gpt-oss-120b:cost_usd_cents",
      "ai:usage:2026-11-15:plan_nutrition:groq:openai_gpt-oss-120b:tokens_est",
    ];
    stubFetch([], (call) => {
      const body = JSON.parse(String(call.init?.body)) as string[][];
      if (body[0]?.[0] === "SCAN") return jsonResponse([{ result: ["0", keys] }]);
      if (body[0]?.[0] === "MGET") return jsonResponse([{ result: ["3", "3", "369", "135", "504", "0", "12.5"] }]);
      return jsonResponse([{ result: "OK" }]);
    });
    const rows = await readAIMeterDay("2026-11-15");
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.fn).toBe("plan_nutrition");
    expect(row.provider).toBe("groq");
    expect(row.model).toBe("openai_gpt-oss-120b");
    expect(row.calls).toBe(3);
    expect(row.ok).toBe(3);
    expect(row.tokensPrompt).toBe(369);
    expect(row.tokensCompletion).toBe(135);
    expect(row.tokensTotal).toBe(504);
    expect(row.costUsdCents).toBe(0); // free tier — the honest zero
    expect(row.tokensEst).toBe(13); // 12.5 rounded — the fallback metric
  });

  it("legacy rows without usage metrics stay honest (zeros, not phantoms)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = TOKEN;
    const keys = ["ai:usage:2026-11-15:evo-chat:groq:openai_gpt-oss-20b:calls"];
    stubFetch([], (call) => {
      const body = JSON.parse(String(call.init?.body)) as string[][];
      if (body[0]?.[0] === "SCAN") return jsonResponse([{ result: ["0", keys] }]);
      if (body[0]?.[0] === "MGET") return jsonResponse([{ result: ["9"] }]);
      return jsonResponse([{ result: "OK" }]);
    });
    const rows = await readAIMeterDay("2026-11-15");
    expect(rows).toHaveLength(1);
    expect(rows[0].tokensPrompt).toBe(0);
    expect(rows[0].tokensTotal).toBe(0);
    expect(rows[0].costUsdCents).toBe(0);
  });
});
