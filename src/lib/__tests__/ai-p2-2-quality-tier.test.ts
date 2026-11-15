import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  callFreeAIFallbackChain,
  INTERLEAVED_FAST_CHAIN,
  INTERLEAVED_STRONGEST_CHAIN,
  __resetChainRotationForTests,
} from "@/lib/ai-provider";
import { __resetCooldownForTests } from "@/lib/ai-provider-cooldown";
import { __resetCfInProcessUsageForTests } from "@/lib/ai-cf-usage";
import { resolveFunction, resolveEffectiveChain, dispatchAI } from "@/lib/ai-router";
import { AI_FUNCTION_REGISTRY } from "@/lib/ai-registry";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

/**
 * INF-4 + INF-9 / P2-2 (audit AI-GENERATION-PIPELINES 2026-11-15 — owner
 * order «نفّذ البند التالي غير المنفّذ بالكامل», the P2 plan's item 2
 * «تدهور الجودة المرئي») — the OBSERVABLE QUALITY TIER battery:
 *
 *   A. STRUCTURE: the audit-named degradation tail (groq qwen-3.8-27b ·
 *      gemini-3.5-flash on the strongest chain; nvidia lightning-30b-a3b ·
 *      gemini on the fast chain) is tagged tier:"tail"; every measured
 *      strong entry rides untagged (default "strong"). The pure
 *      resolveEffectiveChain mirror carries the tiers through walk prep.
 *   B. BEHAVIOR (real engine, stubbed fetch): the chain RESULT carries
 *      qualityTier — "strong" from a head entry, "tail" when the walk
 *      degrades to the tail, "strong" for the measured CF agile-role
 *      leads (untagged default), and dispatchAI passes the tier (plus the
 *      INF-9-aligned temperature) through to the engine request.
 *   C. INF-9 ALIGNMENT: the plans family's temperatures sit in the
 *      structured band (0.3-0.6, the five aligned at 0.5/0.5/0.6/0.5/0.5)
 *      while variation-explicit functions (blog:topics 0.85 ·
 *      social-posts 0.75) keep their creative temperatures; the FROZEN
 *      legacy snapshot still serves the pre-alignment values (the
 *      one-env-var rollback).
 *   D. UI/QUEUE WIRING (source reads — the P2-1 canary pattern): the
 *      coach's plan modal renders the tail badge, the member's viewer
 *      stays clean (coach-only by design), and both plan processors
 *      mirror quality_tier in the job result.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(HERE, rel), "utf8");

const ENV_KEYS = [
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NVIDIA_API_KEY",
  "GEMINI_API_KEY",
  "CLOUDFLARE_AI_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CF_ARM_ENABLED",
  "AI_PROVIDER_COOLDOWN_MS",
  "AI_PROVIDER_COOLDOWN",
  "AI_COOLDOWN_STATE_FILE",
  "AI_CHAIN_TOTAL_BUDGET_MS",
  "AI_ROUTER_MODE",
  "GEMINI_MODEL",
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
  stateFile = join(mkdtempSync(join(tmpdir(), "p22-")), "cooldown.json");
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

/* ── Fetch stub helpers (the ai-provider-cf-arm pattern) ── */

type Route = { ok: boolean; status: number; payload: unknown; headers?: Record<string, string> };

function stubFetch(route: (url: string) => Route) {
  const fake = vi.fn(async (url: string, init?: RequestInit) => {
    const r = route(String(url));
    void init;
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.payload,
      text: async () => JSON.stringify(r.payload),
      headers: new Headers(r.headers ?? {}),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fake);
  return fake;
}

const GROQ_PONG = { choices: [{ message: { content: "PONG-from-groq" } }] };
const GROQ_500 = { error: { message: "upstream exploded (scripted)" } };
const GEMINI_PONG = {
  candidates: [{ content: { parts: [{ text: "PONG-from-gemini" }] } }],
};
const CF_JSON_OK = {
  success: true,
  result: {
    response: '{"topicEn":"creatine loading","topicAr":"جرعة الكرياتين","angleId":"guide"}',
    usage: { neurons: 63.43 },
  },
};

/* ══════════════════════════ A. STRUCTURE ══════════════════════════ */

describe("INF-4 / P2-2 — A. chain tier structure (the audit-named tail)", () => {
  it("strongest chain: EXACTLY the audit-named tail is tier \"tail\" (qwen-3.8-27b + gemini-3.5-flash); the four measured strong entries ride untagged", () => {
    const tails = INTERLEAVED_STRONGEST_CHAIN.filter((e) => e.tier === "tail");
    expect(tails.map((e) => `${e.provider}/${e.model}`)).toEqual([
      "groq/qwen/qwen3.8-27b",
      "gemini/gemini-3.5-flash",
    ]);
    // the strong head: untagged = the engine's "strong" default
    const heads = INTERLEAVED_STRONGEST_CHAIN.filter((e) => e.tier !== "tail");
    expect(heads.map((e) => `${e.provider}/${e.model}`)).toEqual([
      "openrouter/nvidia/nemotron-3-ultra-550b-a55b:free",
      "groq/openai/gpt-oss-120b",
      "groq/openai/gpt-oss-20b",
      "nvidia/nvidia/nemotron-3-ultra-550b-a55b",
    ]);
    for (const h of heads) expect(h.tier).toBeUndefined();
  });

  it("fast chain: the 3B-active lightning + the gemini last resort are \"tail\"; both gpt-oss LPU heads are not", () => {
    const tails = INTERLEAVED_FAST_CHAIN.filter((e) => e.tier === "tail");
    expect(tails.map((e) => `${e.provider}/${e.model}`)).toEqual([
      "nvidia/nvidia/nemotron-3.5-lightning-30b-a3b",
      "gemini/gemini-3.5-flash",
    ]);
    expect(INTERLEAVED_FAST_CHAIN[0]).toEqual({ provider: "groq", model: "openai/gpt-oss-20b" });
    expect(INTERLEAVED_FAST_CHAIN[1]).toEqual({ provider: "groq", model: "openai/gpt-oss-120b" });
  });

  it("every gemini entry in BOTH chains is tail-tier — the registry's GEMINI_TAIL role \"tail\" and the engine tier agree", () => {
    for (const chain of [INTERLEAVED_STRONGEST_CHAIN, INTERLEAVED_FAST_CHAIN]) {
      for (const e of chain.filter((e) => e.provider === "gemini")) {
        expect(e.tier, `${chain === INTERLEAVED_FAST_CHAIN ? "fast" : "strongest"} gemini`).toBe("tail");
      }
    }
    // registry mirror: every non-fast spec's declared tail is gemini with role "tail"
    for (const [id, spec] of Object.entries(AI_FUNCTION_REGISTRY)) {
      if (spec.policy.chain === "fast") continue;
      const declared = spec.ladder.filter((e) => e.role === "tail");
      expect(declared.map((t) => t.provider), `${id} declared tail`).toEqual(["gemini"]);
    }
  });

  it("resolveEffectiveChain carries the tiers through the walk prep (rotation moves heads, the tail stays tagged)", () => {
    const out = resolveEffectiveChain("plan:nutrition", {
      configuredProviders: ["openrouter", "groq", "nvidia", "gemini"],
      callSeq: 1,
      promptChars: 2_000,
      maxTokens: 7_000,
      chainTotalBudgetMs: 480_000,
      streaming: false,
      cfNeuronBarrierTripped: false,
      groqClampEnabled: true,
    });
    expect(out.entries[0]).toEqual({ provider: "openrouter", model: "nvidia/nemotron-3-ultra-550b-a55b:free" });
    const qwen = out.entries.find((e) => e.model === "qwen/qwen3.8-27b");
    const gem = out.entries.find((e) => e.provider === "gemini");
    expect(qwen?.tier).toBe("tail");
    expect(gem?.tier).toBe("tail");
    // heads stay untagged through the mirror too
    expect(out.entries[0].tier).toBeUndefined();
    expect(out.entries.find((e) => e.model === "openai/gpt-oss-120b")?.tier).toBeUndefined();
  });
});

/* ══════════════════════════ B. BEHAVIOR (real engine) ══════════════════════════ */

describe("INF-4 / P2-2 — B. the chain result carries qualityTier", () => {
  it("a strong head entry answers → qualityTier \"strong\"", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const calls: string[] = [];
    stubFetch((url) => {
      if (url.includes("api.groq.com")) {
        calls.push(url);
        return { ok: true, status: 200, payload: GROQ_PONG };
      }
      return { ok: false, status: 500, payload: GROQ_500 };
    });
    const out = await callFreeAIFallbackChain("ping", { tag: "test:chain", maxModels: 2 });
    expect(out.text).toBe("PONG-from-groq");
    expect(out.model).toBe("openai/gpt-oss-120b");
    expect(out.provider).toBe("groq");
    expect(out.qualityTier).toBe("strong");
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  it("THE INF-4 CANARY: the head burns out and the walk degrades to the qwen tail → qualityTier \"tail\" (the degradation is OBSERVABLE)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    let groqCalls = 0;
    stubFetch((url) => {
      if (url.includes("api.groq.com")) {
        groqCalls++;
        // gpt-oss-120b (entry 2) and gpt-oss-20b (entry 3) fail transiently
        // (500 = no cooldown mark — the walk keeps going); qwen-3.8-27b
        // (the tagged tail) answers.
        if (groqCalls <= 2) return { ok: false, status: 500, payload: GROQ_500 };
        return { ok: true, status: 200, payload: GROQ_PONG };
      }
      return { ok: false, status: 500, payload: GROQ_500 };
    });
    const out = await callFreeAIFallbackChain("ping", { tag: "test:chain", maxModels: 5 });
    expect(out.model).toBe("qwen/qwen3.8-27b");
    expect(out.provider).toBe("groq");
    expect(out.qualityTier).toBe("tail");
  });

  it("the gemini last-resort tail answers (only GEMINI configured) → qualityTier \"tail\"", async () => {
    process.env.GEMINI_API_KEY = "gem-test-key";
    stubFetch((url) => {
      if (url.includes("generativelanguage.googleapis.com")) {
        return { ok: true, status: 200, payload: GEMINI_PONG };
      }
      return { ok: false, status: 500, payload: GROQ_500 };
    });
    const out = await callFreeAIFallbackChain("ping", { tag: "test:chain", maxModels: 2 });
    expect(out.provider).toBe("gemini");
    expect(out.model).toBe("gemini-3.5-flash");
    expect(out.qualityTier).toBe("tail");
  });

  it("the measured CF agile-role lead answers → qualityTier \"strong\" (untagged default — a role-proven entry is NOT degradation)", async () => {
    process.env.CLOUDFLARE_AI_TOKEN = "cf-test-token";
    process.env.CLOUDFLARE_ACCOUNT_ID = "cf-test-account";
    process.env.GROQ_API_KEY = "gsk-test-key";
    stubFetch((url) => {
      if (url.includes("api.cloudflare.com") && url.includes("/ai/run/")) {
        return { ok: true, status: 200, payload: CF_JSON_OK, headers: { "cf-ai-neurons": "63.43" } };
      }
      return { ok: false, status: 500, payload: GROQ_500 };
    });
    const out = await callFreeAIFallbackChain("pairing prompt", { tag: "blog:pairing" });
    expect(out.provider).toBe("cloudflare");
    expect(out.qualityTier).toBe("strong");
  });

  it("dispatchAI resolves the INF-9-aligned policy AND passes the tier through (plan:nutrition at 0.5)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const captured: { body: Record<string, unknown> | null } = { body: null };
    const fake = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.body) captured.body = JSON.parse(String(init.body)) as Record<string, unknown>;
      return {
        ok: true,
        status: 200,
        json: async () => GROQ_PONG,
        text: async () => JSON.stringify(GROQ_PONG),
        headers: new Headers(),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fake);
    const out = await dispatchAI("plan:nutrition", "ping");
    expect(out.qualityTier).toBe("strong");
    expect(out.model).toBe("openai/gpt-oss-120b");
    // INF-9 wiring proof: the registry's aligned temperature rides the request.
    // (max_tokens: the registry says 7000; the R3 groq clamp trims it to the
    // 7200-window remainder 6399 for THIS groq entry — the engine law.)
    expect(captured.body?.temperature).toBe(0.5);
    expect(captured.body?.max_tokens).toBe(6399);
  });
});

/* ══════════════════════════ C. INF-9 ALIGNMENT ══════════════════════════ */

describe("INF-9 / P2-2 — C. structured-task temperature alignment", () => {
  it("every plans-family function samples in the structured band (0.3 ≤ temperature ≤ 0.6)", () => {
    for (const [id, spec] of Object.entries(AI_FUNCTION_REGISTRY)) {
      if (spec.family !== "plans") continue;
      const t = spec.policy.temperature;
      expect(t, `${id} temperature`).toBeDefined();
      expect(t as number, `${id} must be in the structured band`).toBeGreaterThanOrEqual(0.3);
      expect(t as number, `${id} must be in the structured band`).toBeLessThanOrEqual(0.6);
    }
  });

  it("the five aligned values are exact (0.7/0.8 → 0.5/0.6)", () => {
    expect(AI_FUNCTION_REGISTRY["plan:nutrition"].policy.temperature).toBe(0.5);
    expect(AI_FUNCTION_REGISTRY["plan:workout"].policy.temperature).toBe(0.5);
    expect(AI_FUNCTION_REGISTRY["plan:nutrition-alt"].policy.temperature).toBe(0.6);
    expect(AI_FUNCTION_REGISTRY["plan:item-regen"].policy.temperature).toBe(0.5);
    expect(AI_FUNCTION_REGISTRY["plan:day-regen"].policy.temperature).toBe(0.5);
    // the already-structured siblings stay untouched
    expect(AI_FUNCTION_REGISTRY["plan:exercise-corrective"].policy.temperature).toBe(0.4);
    expect(AI_FUNCTION_REGISTRY["plan:json-normalize"].policy.temperature).toBe(0.3);
  });

  it("variation-explicit functions KEEP their creative temperatures (the audit's carve-out)", () => {
    expect(AI_FUNCTION_REGISTRY["blog:topics"].policy.temperature).toBe(0.85);
    expect(AI_FUNCTION_REGISTRY["social-posts"].policy.temperature).toBe(0.75);
    expect(AI_FUNCTION_REGISTRY["blog:content"].policy.temperature).toBe(0.7);
  });

  it("the rollback: AI_ROUTER_MODE=legacy restores the PRE-alignment temperatures for the five (frozen snapshot)", () => {
    process.env.AI_ROUTER_MODE = "legacy";
    expect(resolveFunction("plan:nutrition").options.temperature).toBe(0.7);
    expect(resolveFunction("plan:workout").options.temperature).toBe(0.7);
    expect(resolveFunction("plan:nutrition-alt").options.temperature).toBe(0.8);
    expect(resolveFunction("plan:item-regen").options.temperature).toBe(0.7);
    expect(resolveFunction("plan:day-regen").options.temperature).toBe(0.7);
    // …and nothing else changed in legacy mode (maxTokens/maxModels intact)
    expect(resolveFunction("plan:nutrition").options.maxModels).toBe(5);
    expect(resolveFunction("plan:nutrition").options.maxTokens).toBe(7000);
  });

  it("registry mode (default) serves the aligned values — the mode switch is the ONLY difference", () => {
    expect(resolveFunction("plan:nutrition").options.temperature).toBe(0.5);
    expect(resolveFunction("plan:nutrition-alt").options.temperature).toBe(0.6);
  });
});

/* ══════════════════════════ D. UI / QUEUE WIRING (source reads) ══════════════════════════ */

describe("INF-4 / P2-2 — D. delivery wiring (the WOR-1 lesson: generated-but-unshown is a defect)", () => {
  it("the COACH's plan modal renders the tail badge (condition + Arabic label + provenance tooltip)", () => {
    const src = read("../../components/views/CoachClientView.tsx");
    expect(src).toContain("generation?.qualityTier === \"tail\"");
    expect(src).toContain("موديل ذيل — راجع العمق");
    // the badge cites the audit and stays coach-side
    expect(src).toContain("INF-4 / P2-2");
  });

  it("the MEMBER's plan viewer stays clean — the tail badge is coach-only (the audit's «عرضه للمدرب»)", () => {
    const src = read("../../components/views/PlansView.tsx");
    expect(src).not.toContain("qualityTier === \"tail\"");
    expect(src).not.toContain("موديل ذيل");
  });

  it("both plan processors mirror quality_tier in the ai_jobs result (queue-side observability)", () => {
    const src = read("../ai-job-processors.ts");
    const hits = src.match(/quality_tier:/g) ?? [];
    expect(hits.length).toBe(2); // runPlanNutrition + runPlanWorkout
    expect(src).toContain("res.content.generation?.qualityTier ?? \"local\"");
  });

  it("both plan content types declare the generation block (the persisted contract)", () => {
    const src = read("../plan-generator.ts");
    const genBlocks = src.match(/generation\?: \{\s*qualityTier: "strong" \| "tail";/g) ?? [];
    expect(genBlocks.length).toBe(2); // NutritionPlanContent + WorkoutPlanContent
    // and BOTH AI paths stamp it (the local fallback does not)
    expect(src).toContain('content.generation = { qualityTier, model, provider }');
    expect(src.match(/content\.generation = \{ qualityTier, model, provider \}/g)?.length).toBe(2);
  });
});
