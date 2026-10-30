import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  callFreeAIFallbackChain,
  cfArmEnabled,
  cfRoleForTag,
  isCloudflareConfigured,
  isCfJsonRoleModelAllowed,
  CF_PAIRING_MODEL,
  CF_SCOUT_MODEL,
  INTERLEAVED_FAST_CHAIN,
  INTERLEAVED_STRONGEST_CHAIN,
  __resetChainRotationForTests,
} from "@/lib/ai-provider";
import {
  cfUsageKey,
  cfNeuronsToday,
  cfNeuronBarrierTripped,
  cfNeuronWarnLevel,
  trackCfUsage,
  CF_NEURON_DAY_LIMIT,
  CF_NEURON_WARN_THRESHOLD,
  CF_NEURON_BARRIER_THRESHOLD,
  __resetCfInProcessUsageForTests,
} from "@/lib/ai-cf-usage";
import { __resetCooldownForTests } from "@/lib/ai-provider-cooldown";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * AI-PROVIDERS-EXPANSION Phase 5-C / stage ج (owner order 2026-10-31
 * «نفّذ جميع المراحل المتبقية» approving §12-3 + §12-4 of the Phase-4
 * unified-architecture report) — the Cloudflare Workers AI FIFTH-provider
 * integration canaries:
 *
 *   A. The §8-ج neuron meter (ai-cf-usage.ts): key shape, thresholds
 *      (80% warning / 95% barrier of the 10k/day free allocation), the
 *      Upstash INCRBYFLOAT+EXPIRE NX pipeline shape, in-process
 *      degradation, and the fail-open law (a metering outage NEVER
 *      blocks a call).
 *   B. The role-scope law (§6-ب/§6-ج): ONLY the two first-wave agile
 *      tags get a CF entry — blog:pairing leads with 70b-fp8-fast,
 *      blog:latin-tokens-ar leads with scout; EVERY other tag keeps the
 *      ordinary chain untouched; llama-3.1-8b* is excluded from every
 *      JSON role.
 *   C. The chain behavior: the CF role entry LEADS the walk and answers
 *      (provider "cloudflare"); CF failure falls to the ordinary chain
 *      (the §6-ب fallback law); the kill switch CF_ARM_ENABLED=0 and a
 *      missing-secret config skip the entry honestly WITHOUT consuming
 *      attempt budget; the ≥95% barrier skips every new CF call the same
 *      honest way; a 429 marks the chain:cloudflare cooldown scope.
 *   D. The structural exclusions: NO cloudflare entry in the fast chain
 *      (EVO streaming — no streaming in JSON mode) and none in the
 *      strongest chain (roles ride the tag-scoped entry only).
 */

const ENV_KEYS = [
  "CLOUDFLARE_AI_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CF_ARM_ENABLED",
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NVIDIA_API_KEY",
  "GEMINI_API_KEY",
  "AI_PROVIDER_COOLDOWN_MS",
  "AI_PROVIDER_COOLDOWN",
  "AI_COOLDOWN_STATE_FILE",
  "AI_CHAIN_TOTAL_BUDGET_MS",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

let stateFile = "";

beforeEach(() => {
  cleanEnv();
  __resetCfInProcessUsageForTests();
  stateFile = join(mkdtempSync(join(tmpdir(), "cfarm-")), "cooldown.json");
  process.env.AI_COOLDOWN_STATE_FILE = stateFile;
  __resetCooldownForTests({ deleteFile: true });
  __resetChainRotationForTests();
});

afterEach(() => {
  cleanEnv();
  vi.unstubAllGlobals();
  try {
    rmSync(stateFile, { force: true });
  } catch {
    /* ignore */
  }
});

/* ── Fetch mocking helpers (the grounded-failover test pattern) ─────── */

type FetchLog = { url: string; auth?: string; body?: Record<string, unknown> };

const CF_OK = {
  success: true,
  result: { response: "PONG-from-cloudflare", usage: { neurons: 42.5 } },
};

const CF_JSON_OK = {
  success: true,
  result: {
    response: '{"topicEn":"creatine monohydrate loading phase how much per day","topicAr":"جرعة الكرياتين اليومية لبناء العضلات","angleId":"guide"}',
    usage: { neurons: 63.43 },
  },
};

const CHAIN_PONG = {
  choices: [{ message: { content: "PONG-from-groq" } }],
};

const QUOTA_429 = {
  errors: [{ code: 429, message: "rate limit exceeded" }],
};

function cfUrl(url: string): boolean {
  return url.includes("api.cloudflare.com") && url.includes("/ai/run/");
}

function groqUrl(url: string): boolean {
  return url.includes("api.groq.com");
}

/** Route by URL; records every call. CF answers carry the cf-ai-neurons
 *  header (the adapter's fallback meter source — always present on real
 *  responses). Body-less requests (GET) are recorded without a body. */
function stubRoutingFetch(log: FetchLog[], route: (url: string) => { ok: boolean; status: number; payload: unknown; headers?: Record<string, string> }) {
  const fake = vi.fn(async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const auth = headers.get("authorization") || "";
    log.push({
      url,
      auth,
      ...(init?.body ? { body: JSON.parse(String(init.body)) as Record<string, unknown> } : {}),
    });
    const r = route(String(url));
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.payload,
      text: async () => JSON.stringify(r.payload),
      headers: new Headers(r.headers ?? {}),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fake);
}

function setCfConfigured() {
  process.env.CLOUDFLARE_AI_TOKEN = "cf-test-token";
  process.env.CLOUDFLARE_ACCOUNT_ID = "cf-test-account";
}

/* ══════════════════════════════════════════════════════════════════════
 * A. The §8-ج neuron meter (ai-cf-usage.ts)
 * ══════════════════════════════════════════════════════════════════════ */

describe("Phase 5-C — the §8-ج neuron meter (ai-cf-usage.ts)", () => {
  it("thresholds: 10,000/day limit · 8,000 warning (80%) · 9,500 barrier (95%)", () => {
    expect(CF_NEURON_DAY_LIMIT).toBe(10_000);
    expect(CF_NEURON_WARN_THRESHOLD).toBe(8_000);
    expect(CF_NEURON_BARRIER_THRESHOLD).toBe(9_500);
  });

  it("key shape: cf:usage:{UTC date}:neurons (the daily rollover = new key, no purge)", () => {
    expect(cfUsageKey("2026-10-31")).toBe("cf:usage:2026-10-31:neurons");
  });

  it("trackCfUsage writes the atomic INCRBYFLOAT + EXPIRE NX 30d pipeline on the daily key", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "upstash-test-token";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: [{ result: "OK" }, { result: "OK" }] }));

    await trackCfUsage({ model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", neurons: 42.5, ok: true, status: 200, latencyMs: 1200, tag: "blog:pairing" });

    expect(log).toHaveLength(1);
    expect(log[0].url).toBe("https://upstash.example/pipeline");
    const today = new Date().toISOString().slice(0, 10);
    expect(log[0].body).toEqual([
      ["INCRBYFLOAT", `cf:usage:${today}:neurons`, "42.5"],
      ["EXPIRE", `cf:usage:${today}:neurons`, String(30 * 24 * 60 * 60), "NX"],
    ]);
  });

  it("barrier + warn read the Upstash GET value: 9,600 trips BOTH; 8,500 warns without blocking; 400 neither", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "upstash-test-token";
    let stored = "9600";
    stubRoutingFetch([], (url) => {
      if (url.includes("/get/")) {
        return { ok: true, status: 200, payload: { result: stored } };
      }
      return { ok: true, status: 200, payload: [] };
    });

    expect(await cfNeuronsToday()).toBe(9_600);
    expect(await cfNeuronBarrierTripped()).toBe(true);
    expect(await cfNeuronWarnLevel()).toBe(true);

    stored = "8500";
    expect(await cfNeuronsToday()).toBe(8_500);
    expect(await cfNeuronBarrierTripped()).toBe(false);
    expect(await cfNeuronWarnLevel()).toBe(true);

    stored = "400";
    expect(await cfNeuronBarrierTripped()).toBe(false);
    expect(await cfNeuronWarnLevel()).toBe(false);
  });

  it("in-process degradation (no Upstash): the tally accumulates per date and drives the barrier honestly", async () => {
    // No UPSTASH env → the meter degrades to the in-process counter.
    expect(await cfNeuronsToday()).toBe(0);
    expect(await cfNeuronBarrierTripped()).toBe(false);

    await trackCfUsage({ model: "@cf/x", neurons: 9_600, ok: true });
    expect(await cfNeuronsToday()).toBe(9_600);
    expect(await cfNeuronBarrierTripped()).toBe(true);

    await trackCfUsage({ model: "@cf/x", neurons: 8_000, ok: true });
    expect(await cfNeuronWarnLevel()).toBe(true);
  });

  it("fail-open law: a metering outage (fetch rejects) never throws; the in-process degradation keeps counting coherently", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example";
    process.env.UPSTASH_REDIS_REST_TOKEN = "upstash-test-token";
    const fake = vi.fn(async () => {
      throw new Error("network down");
    });
    vi.stubGlobal("fetch", fake);

    // the accounting call NEVER throws (fail-soft by construction)…
    await expect(trackCfUsage({ model: "@cf/x", neurons: 10, ok: true })).resolves.toBeUndefined();
    // …and the in-process tally still bumped FIRST (the documented §8-ج
    // degradation — the per-process barrier stays coherent without Upstash).
    await expect(cfNeuronsToday()).resolves.toBe(10);
    // far from the barrier → never blocks.
    await expect(cfNeuronBarrierTripped()).resolves.toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * B. The role-scope law (§6-ب/§6-ج)
 * ══════════════════════════════════════════════════════════════════════ */

describe("Phase 5-C — the role-scope law (first-wave agile roles ONLY)", () => {
  it("blog:pairing → llama-3.3-70b-instruct-fp8-fast · blog:latin-tokens-ar → llama-4-scout-17b-16e-instruct (the §6-ب measured picks)", () => {
    expect(CF_PAIRING_MODEL).toBe("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    expect(CF_SCOUT_MODEL).toBe("@cf/meta/llama-4-scout-17b-16e-instruct");
    expect(cfRoleForTag("blog:pairing")).toBe(CF_PAIRING_MODEL);
    expect(cfRoleForTag("blog:latin-tokens-ar")).toBe(CF_SCOUT_MODEL);
  });

  it("every OTHER tag → null (CF is NOT a general-purpose provider; heavy chains untouched)", () => {
    for (const tag of [
      "blog:content-ar", "blog:content-en", "blog:outline-ar", "blog:review-en",
      "plan:workout", "evo-chat", "article_tool:seo_title", "test:chain", undefined,
    ]) {
      expect(cfRoleForTag(tag)).toBeNull();
    }
  });

  it("llama-3.1-8b* is EXCLUDED from every JSON role (Phase-3 live proof: unparseable json_object + API-refused json_schema)", () => {
    expect(isCfJsonRoleModelAllowed("@cf/meta/llama-3.1-8b-instruct-fp8-fast")).toBe(false);
    expect(isCfJsonRoleModelAllowed("@cf/meta/llama-3.1-8b-instruct-fp8")).toBe(false);
    expect(isCfJsonRoleModelAllowed(CF_PAIRING_MODEL)).toBe(true);
    expect(isCfJsonRoleModelAllowed(CF_SCOUT_MODEL)).toBe(true);
  });

  it("kill switch CF_ARM_ENABLED=0 disables the whole arm; missing secrets = not configured", () => {
    expect(cfArmEnabled()).toBe(true); // default ON
    process.env.CF_ARM_ENABLED = "0";
    expect(cfArmEnabled()).toBe(false);
    delete process.env.CF_ARM_ENABLED;
    expect(cfArmEnabled()).toBe(true);

    expect(isCloudflareConfigured()).toBe(false);
    setCfConfigured();
    expect(isCloudflareConfigured()).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * C. The chain behavior — the CF role entry rides the walk
 * ══════════════════════════════════════════════════════════════════════ */

describe("Phase 5-C — the CF role entry inside callFreeAIFallbackChain", () => {
  it("blog:pairing → the CF entry LEADS: one call to /accounts/{id}/ai/run/{70b model}, provider=cloudflare, json_object mode + messages + max_tokens in the body", async () => {
    setCfConfigured();
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (cfUrl(url)) return { ok: true, status: 200, payload: CF_JSON_OK, headers: { "cf-ai-neurons": "63.43" } };
      return { ok: true, status: 200, payload: CHAIN_PONG };
    });

    const out = await callFreeAIFallbackChain("pairing prompt", {
      tag: "blog:pairing",
      temperature: 0.3,
      maxTokens: 400,
      jsonMode: true,
      timeoutMs: 45_000,
      maxModels: 3,
    });

    expect(out.provider).toBe("cloudflare");
    expect(out.model).toBe(CF_PAIRING_MODEL);
    expect(out.text).toContain("topicEn");
    // exactly ONE network call — CF answered, the chain never woke up.
    expect(log).toHaveLength(1);
    expect(log[0].url).toContain("/accounts/cf-test-account/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    expect(log[0].auth).toBe("Bearer cf-test-token");
    expect(log[0].body?.response_format).toEqual({ type: "json_object" });
    expect(log[0].body?.max_tokens).toBe(400);
    expect(Array.isArray(log[0].body?.messages)).toBe(true);
    expect(log[0].body?.temperature).toBe(0.3);
  });

  it("blog:latin-tokens-ar → the scout model leads the same way", async () => {
    setCfConfigured();
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (cfUrl(url)) return { ok: true, status: 200, payload: CF_OK, headers: { "cf-ai-neurons": "12" } };
      return { ok: true, status: 200, payload: CHAIN_PONG };
    });

    const out = await callFreeAIFallbackChain("latin prompt", {
      tag: "blog:latin-tokens-ar",
      jsonMode: true,
      maxModels: 3,
    });

    expect(out.provider).toBe("cloudflare");
    expect(out.model).toBe(CF_SCOUT_MODEL);
    expect(log[0].url).toContain("/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct");
  });

  it("a NON-role tag → ZERO CF calls (the ordinary chain serves; role entries never leak)", async () => {
    setCfConfigured();
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (cfUrl(url)) return { ok: true, status: 200, payload: CF_OK };
      return { ok: true, status: 200, payload: CHAIN_PONG };
    });

    const out = await callFreeAIFallbackChain("content prompt", {
      tag: "blog:content-ar",
      maxModels: 2,
    });

    expect(out.provider).toBe("groq");
    expect(log.some((c) => cfUrl(c.url))).toBe(false);
  });

  it("CF failure (429) → the role falls to the ordinary chain (the §6-ب fallback law) and the provider is cooled", async () => {
    setCfConfigured();
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (cfUrl(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      return { ok: true, status: 200, payload: CHAIN_PONG };
    });

    const out = await callFreeAIFallbackChain("pairing prompt", {
      tag: "blog:pairing",
      jsonMode: true,
      maxModels: 3,
    });

    // CF was tried FIRST and failed; the chain answered within the SAME budget.
    expect(cfUrl(log[0].url)).toBe(true);
    expect(out.provider).toBe("groq");
    expect(log.filter((c) => cfUrl(c.url))).toHaveLength(1);

    // the exhaustion class marked the CF provider — the NEXT role call
    // skips it honestly without a network call.
    const log2: FetchLog[] = [];
    stubRoutingFetch(log2, (url) => {
      if (cfUrl(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      return { ok: true, status: 200, payload: CHAIN_PONG };
    });
    const out2 = await callFreeAIFallbackChain("pairing prompt", {
      tag: "blog:pairing",
      jsonMode: true,
      maxModels: 3,
    });
    expect(out2.provider).toBe("groq");
    expect(log2.some((c) => cfUrl(c.url))).toBe(false); // zero CF calls — the cooldown skip
  });

  it("CF_ARM_ENABLED=0 (kill switch) → no CF entry at all; the ordinary chain serves the role tag", async () => {
    setCfConfigured();
    process.env.CF_ARM_ENABLED = "0";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (cfUrl(url)) return { ok: true, status: 200, payload: CF_OK };
      return { ok: true, status: 200, payload: CHAIN_PONG };
    });

    const out = await callFreeAIFallbackChain("pairing prompt", {
      tag: "blog:pairing",
      jsonMode: true,
      maxModels: 2,
    });
    expect(out.provider).toBe("groq");
    expect(log.some((c) => cfUrl(c.url))).toBe(false);
  });

  it("CF secrets absent → the role entry is skipped honestly (no entry, chain serves)", async () => {
    // no CF env at all
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: CHAIN_PONG }));

    const out = await callFreeAIFallbackChain("pairing prompt", {
      tag: "blog:pairing",
      jsonMode: true,
      maxModels: 2,
    });
    expect(out.provider).toBe("groq");
    expect(log.some((c) => cfUrl(c.url))).toBe(false);
  });

  it("≥95% neuron BARRIER (§8-ج) → the CF entry is skipped honestly and the chain serves (the free allocation is never drained to zero)", async () => {
    setCfConfigured();
    process.env.GROQ_API_KEY = "gsk-test-key";
    // fill the in-process meter past the barrier (no Upstash → degradation path)
    await trackCfUsage({ model: "@cf/x", neurons: 9_600, ok: true });

    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (cfUrl(url)) return { ok: true, status: 200, payload: CF_OK };
      return { ok: true, status: 200, payload: CHAIN_PONG };
    });

    const out = await callFreeAIFallbackChain("pairing prompt", {
      tag: "blog:pairing",
      jsonMode: true,
      maxModels: 2,
    });
    expect(out.provider).toBe("groq");
    expect(log.some((c) => cfUrl(c.url))).toBe(false); // barrier skip = zero CF network calls
  });

  it("STREAMING calls (options.onDelta) → CF is excluded STRUCTURALLY even for a role tag (no streaming in JSON mode — the EVO path law)", async () => {
    setCfConfigured();
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    // The groq mock answers a NON-stream body on purpose — callAIStream then
    // rejects it ("no stream body") and the chain dies honestly. What this
    // test pins is the CF half: the role entry was skipped STRUCTURALLY for
    // the streaming call (zero CF network calls + the documented skip reason
    // rides the aggregate error).
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: CHAIN_PONG }));

    const deltas: string[] = [];
    await expect(
      callFreeAIFallbackChain("pairing prompt", {
        tag: "blog:pairing",
        jsonMode: true,
        maxModels: 2,
        onDelta: (chunk) => deltas.push(chunk),
      }),
    ).rejects.toThrow(/All AI providers failed/);

    expect(log.some((c) => cfUrl(c.url))).toBe(false); // STRUCTURAL: zero CF calls on a streaming role call
  });

  it("the CF adapter meters neurons on success: [cf-usage] structured line + the in-process tally", async () => {
    setCfConfigured();
    process.env.GROQ_API_KEY = "gsk-test-key";
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
    try {
      const log: FetchLog[] = [];
      stubRoutingFetch(log, (url) => {
        if (cfUrl(url)) return { ok: true, status: 200, payload: CF_OK, headers: { "cf-ai-neurons": "42.5" } };
        return { ok: true, status: 200, payload: CHAIN_PONG };
      });

      await callFreeAIFallbackChain("pairing prompt", {
        tag: "blog:pairing",
        jsonMode: true,
        maxModels: 2,
      });

      const usageLine = logs.find((l) => l.includes("[cf-usage]"));
      expect(usageLine).toBeDefined();
      expect(usageLine).toContain("neurons=42.5");
      expect(usageLine).toContain("tag=blog:pairing");
      expect(await cfNeuronsToday()).toBe(42.5); // the in-process meter accumulated
    } finally {
      spy.mockRestore();
    }
  });

  it("usage.neurons is the authoritative meter; the cf-ai-neurons header is the fallback", async () => {
    setCfConfigured();
    process.env.GROQ_API_KEY = "gsk-test-key";
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
    try {
      const log: FetchLog[] = [];
      stubRoutingFetch(log, (url) => {
        if (cfUrl(url)) {
          // usage block ABSENT → the header must meter (Phase-3 measured them agreeing)
          return { ok: true, status: 200, payload: { success: true, result: { response: "PONG-header-metered" } }, headers: { "cf-ai-neurons": "7.75" } };
        }
        return { ok: true, status: 200, payload: CHAIN_PONG };
      });

      await callFreeAIFallbackChain("pairing prompt", { tag: "blog:pairing", jsonMode: true, maxModels: 2 });
      const usageLine = logs.find((l) => l.includes("[cf-usage]"));
      expect(usageLine).toContain("neurons=7.75");
    } finally {
      spy.mockRestore();
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * D. Structural exclusions (the §6-ب table)
 * ══════════════════════════════════════════════════════════════════════ */

describe("Phase 5-C — structural exclusions (CF NEVER rides the general chains)", () => {
  it("the FAST chain carries NO cloudflare entry (EVO streaming path — no streaming in JSON mode)", () => {
    expect(INTERLEAVED_FAST_CHAIN.some((e) => e.provider === "cloudflare")).toBe(false);
  });

  it("the STRONGEST chain carries NO cloudflare entry (roles ride the tag-scoped entry only — heavy generation untouched)", () => {
    expect(INTERLEAVED_STRONGEST_CHAIN.some((e) => e.provider === "cloudflare")).toBe(false);
  });
});
