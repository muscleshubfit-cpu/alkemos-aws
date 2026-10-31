/**
 * AI REGISTRY GOLDEN CANARIES (Phase 388 — R1, design §9 tests ت2+ت3 of
 * docs/AI-ROUTER-UNIFICATION-AUDIT-2026-10-31.md).
 *
 * ت2 — THE GOLDEN CANARY (per function): the registry's resolved policy
 *      must equal the LITERAL inline option block each call site passes
 *      TODAY (transcribed below from the audited source — file:line in
 *      ai-registry.ts doc.evidence). This is the automatic proof that
 *      every migration frame is zero-behavior: re-run this file after
 *      R3/R4/R5 and it still pins the same values.
 *
 *      The same table pins the LEGACY snapshot (AI_ROUTER_MODE=legacy) —
 *      registry ≡ legacy ≡ the live call-site values, three-way.
 *
 * ت3 — SPECIALIZATION: CF leads only its two measured roles · streaming
 *      excludes CF structurally · fast never rotates · strongest rotates
 *      3-way · R3 groq clamp/drop mirrors the engine laws · the language-
 *      split grounded ladder matches the engine's groundedArmOrder().
 *
 * ZERO-CONSUMER PROOF (R1): no production module imports ai-router yet —
 * the grep assertion at the bottom keeps that true until R3 lands.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  AI_FUNCTION_REGISTRY,
  listRegistryIds,
  registerFunction,
  resolveRegistrySpec,
  type AIFunctionSpec,
} from "../ai-registry";
import {
  aiRouterMode,
  isRegisteredFunction,
  legacySnapshotFor,
  resolveEffectiveChain,
  resolveFunction,
} from "../ai-router";
import {
  groundedArmOrder,
  INTERLEAVED_FAST_CHAIN,
  INTERLEAVED_STRONGEST_CHAIN,
} from "../ai-provider";

/* ─────────────── ت2 — the golden policy table (verbatim call sites) ───────────────
 * {tag defaults to the key; absent fields mean the call site does NOT
 * pass them (engine defaults rule — e.g. meal-demo has NO maxModels). */
const GOLDEN: Record<string, Record<string, unknown>> = {
  // plans — plan-generator.ts:553/715/880/2425/2522/2299/2027
  "plan:nutrition": { temperature: 0.7, maxTokens: 7000, jsonMode: true, timeoutMs: 70_000, maxModels: 5 },
  "plan:workout": { temperature: 0.7, maxTokens: 4000, jsonMode: true, timeoutMs: 35_000, maxModels: 4 },
  "plan:nutrition-alt": { temperature: 0.8, maxTokens: 2600, jsonMode: true, timeoutMs: 60_000, maxModels: 3 },
  "plan:item-regen": { temperature: 0.7, maxTokens: 400, jsonMode: true, timeoutMs: 30_000, maxModels: 3 },
  "plan:day-regen": { temperature: 0.7, maxTokens: 1200, jsonMode: true, timeoutMs: 45_000, maxModels: 3 },
  "plan:exercise-corrective": { temperature: 0.4, maxTokens: 900, jsonMode: true, timeoutMs: 45_000, maxModels: 2 },
  "plan:json-normalize": { temperature: 0.3, maxTokens: 4000, jsonMode: true, timeoutMs: 26_000, maxModels: 2 },
  // blog — blog-research.ts:511 · blog-pairing.ts:301 · blog-pipeline.ts:213/314/545/1010/1364/1420 · blog-topics.ts:657
  "blog:research": { temperature: 0.7, maxTokens: 4000, timeoutMs: 180_000 },
  "blog:pairing": { temperature: 0.3, maxTokens: 400, jsonMode: true, timeoutMs: 45_000, maxModels: 4 },
  "blog:pick-topic-ar": { temperature: 0.4, maxTokens: 120, jsonMode: true, timeoutMs: 90_000, maxModels: 3 },
  "blog:pick-topic-en": { temperature: 0.4, maxTokens: 120, jsonMode: true, timeoutMs: 90_000, maxModels: 3 },
  "blog:outline-ar": { temperature: 0.6, maxTokens: 4000, jsonMode: false, timeoutMs: 110_000, maxModels: 3 },
  "blog:outline-en": { temperature: 0.6, maxTokens: 4000, jsonMode: false, timeoutMs: 110_000, maxModels: 3 },
  "blog:content-ar": { temperature: 0.7, maxTokens: 6400, jsonMode: false, timeoutMs: 150_000, maxModels: 3 },
  "blog:content-en": { temperature: 0.7, maxTokens: 6400, jsonMode: false, timeoutMs: 150_000, maxModels: 3 },
  "blog:review-ar": { temperature: 0.4, maxTokens: 6400, jsonMode: false, timeoutMs: 150_000, maxModels: 4 },
  "blog:review-en": { temperature: 0.4, maxTokens: 6400, jsonMode: false, timeoutMs: 150_000, maxModels: 4 },
  "blog:latin-tokens-ar": { temperature: 0.2, maxTokens: 1200, jsonMode: true, timeoutMs: 60_000, maxModels: 3 },
  "blog:latin-repair-ar": { temperature: 0.2, maxTokens: 6400, jsonMode: false, timeoutMs: 110_000, maxModels: 3 },
  "blog:topics-ar": { temperature: 0.85, maxTokens: 800, jsonMode: true, timeoutMs: 22_000, maxModels: 2 },
  "blog:topics-en": { temperature: 0.85, maxTokens: 800, jsonMode: true, timeoutMs: 22_000, maxModels: 2 },
  // tools — ai-job-processors.ts:1181 (article_generate) + :584 (ten tools)
  "ai-job:article-generate": { temperature: 0.7, maxTokens: 6000, jsonMode: true, timeoutMs: 120_000, maxModels: 4 },
  "ai-job:paraphrase": { temperature: 0.7, maxTokens: 4000, jsonMode: false, timeoutMs: 70_000, maxModels: 2 },
  "ai-job:summarize_bullets": { temperature: 0.7, maxTokens: 1400, jsonMode: false, timeoutMs: 70_000, maxModels: 2 },
  "ai-job:proofread": { temperature: 0.3, maxTokens: 4000, jsonMode: false, timeoutMs: 70_000, maxModels: 2 },
  "ai-job:seo_pack": { temperature: 0.7, maxTokens: 1600, jsonMode: true, timeoutMs: 120_000, maxModels: 3 },
  "ai-job:subheadings": { temperature: 0.7, maxTokens: 4000, jsonMode: false, timeoutMs: 70_000, maxModels: 2 },
  "ai-job:seo_title": { temperature: 0.7, maxTokens: 4000, jsonMode: true, timeoutMs: 120_000, maxModels: 3 },
  "ai-job:meta_desc": { temperature: 0.7, maxTokens: 4000, jsonMode: true, timeoutMs: 120_000, maxModels: 3 },
  "ai-job:faq": { temperature: 0.7, maxTokens: 4000, jsonMode: true, timeoutMs: 120_000, maxModels: 3 },
  "ai-job:cta": { temperature: 0.7, maxTokens: 4000, jsonMode: false, timeoutMs: 70_000, maxModels: 2 },
  "ai-job:image_prompt": { temperature: 0.7, maxTokens: 4000, jsonMode: false, timeoutMs: 70_000, maxModels: 2 },
  // social — social-posts.ts:165 (base budget 2200; linkedin 2600 = declared payload override)
  "social-posts:ar": { temperature: 0.75, maxTokens: 2200, jsonMode: true, timeoutMs: 70_000, maxModels: 3 },
  "social-posts:en": { temperature: 0.75, maxTokens: 2200, jsonMode: true, timeoutMs: 70_000, maxModels: 3 },
  // demo — meal-plan-demo/route.ts:138 · workout-plan-demo/route.ts:143 (NO maxModels → engine default 2)
  "meal-demo": { temperature: 0.4, maxTokens: 3000, jsonMode: true, timeoutMs: 20_000 },
  "workout-demo": { temperature: 0.4, maxTokens: 3000, jsonMode: true, timeoutMs: 20_000 },
  // evo — chat/route.ts:653/954 · evo-eval-runner.ts:90/119 (chain:"fast" — the ONLY chain literals)
  "evo-chat": { temperature: 0.6, maxTokens: 800, timeoutMs: 16_000, maxModels: 3, chain: "fast" },
  "evo-memory": { temperature: 0.2, maxTokens: 400, timeoutMs: 12_000, maxModels: 2, chain: "fast" },
  "evo-eval": { temperature: 0.6, maxTokens: 800, timeoutMs: 20_000, maxModels: 3, chain: "fast" },
  "evo-eval-judge": { temperature: 0, maxTokens: 300, timeoutMs: 15_000, maxModels: 2, chain: "fast" },
};

/** Every LIVE tag the production code actually passes (grep-verified call
 *  sites — the completeness half of ت1; R6's CI guard automates the grep). */
const LIVE_TAGS = [
  ...Object.keys(GOLDEN),
];

const ENV_KEYS = ["AI_ROUTER_MODE", "GEMINI_GROUNDED_ENABLED", "GROUNDED_ARM_ORDER", "GEMINI_MODEL"];

describe("ت2 — golden canaries: registry ≡ legacy snapshot ≡ live call-site values", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });

  it("resolves EVERY golden tag to its exact literal policy (no defaults leaking, none missing)", () => {
    for (const [id, policy] of Object.entries(GOLDEN)) {
      const resolved = resolveFunction(id);
      expect(resolved.options, `options for ${id}`).toEqual({ tag: id, ...policy });
      // the spec must also EXIST in the registry data (resolveRegistrySpec path)
      expect(resolved.spec.id.length, `spec for ${id}`).toBeGreaterThan(0);
    }
  });

  it("the legacy snapshot (AI_ROUTER_MODE=legacy) serves the SAME values for every tag", () => {
    process.env.AI_ROUTER_MODE = "legacy";
    expect(aiRouterMode()).toBe("legacy");
    for (const [id, policy] of Object.entries(GOLDEN)) {
      const resolved = resolveFunction(id);
      expect(resolved.options, `legacy options for ${id}`).toEqual({ tag: id, ...policy });
    }
  });

  it("legacySnapshotFor exposes the frozen map for every base id", () => {
    for (const [id, policy] of Object.entries(GOLDEN)) {
      expect(legacySnapshotFor(id), `snapshot for ${id}`).toEqual(policy);
    }
  });

  it("registry policy and snapshot agree — a future registry change cannot silently drift from pre-migration behavior", () => {
    for (const id of LIVE_TAGS) {
      const registryOptions = resolveFunction(id).options;
      delete process.env.AI_ROUTER_MODE;
      const snap = legacySnapshotFor(id) ?? {};
      expect(
        { ...registryOptions, tag: undefined },
        `registry≡snapshot for ${id}`,
      ).toEqual({ tag: undefined, ...snap });
    }
  });

  it("every spec's declared chain matches reality: only the evo family rides fast", () => {
    for (const [baseId, spec] of Object.entries(AI_FUNCTION_REGISTRY)) {
      const chain = spec.policy.chain;
      if (spec.family === "evo") {
        expect(chain, `${baseId} (evo) must ride fast`).toBe("fast");
      } else {
        expect(chain, `${baseId} must not declare a chain (engine strongest default)`).toBeUndefined();
      }
    }
  });
});

describe("ت2-b — template expansion (tags are the ids)", () => {
  it("suffix templates expand: blog:pick-topic-ar/en → the pick-topic spec", () => {
    const ar = resolveRegistrySpec("blog:pick-topic-ar");
    expect(ar?.spec.id).toBe("blog:pick-topic");
    expect(ar?.effectiveId).toBe("blog:pick-topic-ar");
    const en = resolveRegistrySpec("blog:pick-topic-en");
    expect(en?.spec.id).toBe("blog:pick-topic");
    // wrong variant does NOT match
    expect(resolveRegistrySpec("blog:pick-topic-fr")).toBeNull();
  });

  it("colon templates expand: social-posts:ar/en → the social spec", () => {
    expect(resolveRegistrySpec("social-posts:ar")?.spec.id).toBe("social-posts");
    expect(resolveRegistrySpec("social-posts:en")?.spec.id).toBe("social-posts");
  });

  it("direct ids never fall through to template expansion (latin-tokens-ar is its OWN spec)", () => {
    const hit = resolveRegistrySpec("blog:latin-tokens-ar");
    expect(hit?.spec.id).toBe("blog:latin-tokens-ar");
  });

  it("unknown ids are rejected loudly (a typo can never ride defaults)", () => {
    expect(() => resolveFunction("plan:nutriton")).toThrow(/unknown AI function id/);
    expect(isRegisteredFunction("evo-chatt")).toBe(false);
  });

  it("allowed overrides pass through; policy overrides throw (§6-ج closed list)", () => {
    const resolved = resolveFunction("plan:nutrition", {
      systemPrompt: "SYS",
      maxTokens: 6500,
    });
    expect(resolved.options.systemPrompt).toBe("SYS");
    expect(resolved.options.maxTokens).toBe(6500);
    expect(resolved.options.maxModels).toBe(5); // registry-owned, untouched
    expect(() =>
      resolveFunction("plan:nutrition", { maxModels: 9 } as never),
    ).toThrow(/registry-owned policy/);
    expect(() =>
      resolveFunction("evo-chat", { timeoutMs: 99_000 } as never),
    ).toThrow(/registry-owned policy/);
  });
});

describe("ت3 — specialization canaries (structural laws)", () => {
  beforeEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) delete process.env[k];
  });

  it("cloudflare leads ONLY its two measured first-wave roles", () => {
    const cfIds = new Set<string>();
    for (const [id, spec] of Object.entries(AI_FUNCTION_REGISTRY)) {
      for (const entry of spec.ladder) {
        if (entry.provider === "cloudflare") cfIds.add(id);
      }
    }
    expect([...cfIds].sort()).toEqual(["blog:latin-tokens-ar", "blog:pairing"]);
    // and both are fixed-lead with measured evidence
    for (const id of cfIds) {
      const lead = AI_FUNCTION_REGISTRY[id].ladder[0];
      expect(lead.role, `${id} lead role`).toBe("fixed-lead");
      expect(lead.evidence.status, `${id} lead evidence`).toBe("measured");
    }
  });

  it("streaming excludes cloudflare STRUCTURALLY (the evo-chat law)", () => {
    const streaming = Object.entries(AI_FUNCTION_REGISTRY).filter(([, s]) => s.role.streaming);
    expect(streaming.map(([id]) => id)).toEqual(["evo-chat"]);
    for (const [, spec] of streaming) {
      expect(spec.ladder.some((e) => e.provider === "cloudflare")).toBe(false);
    }
    // engine mirror: a streaming context never inserts the CF role entry
    const withCf = resolveEffectiveChain("blog:pairing", baseCtx({ streaming: false }));
    expect(withCf.entries[0].provider).toBe("cloudflare");
    const streamed = resolveEffectiveChain("blog:pairing", baseCtx({ streaming: true }));
    expect(streamed.entries.every((e) => e.provider !== "cloudflare")).toBe(true);
  });

  it("fast chain never rotates — identical entries for every callSeq", () => {
    const a = resolveEffectiveChain("evo-chat", baseCtx({ callSeq: 1 }));
    const b = resolveEffectiveChain("evo-chat", baseCtx({ callSeq: 2 }));
    const c = resolveEffectiveChain("evo-chat", baseCtx({ callSeq: 7 }));
    expect(a.entries).toEqual(b.entries);
    expect(b.entries).toEqual(c.entries);
    expect(a.entries[0]).toEqual({ provider: "groq", model: "openai/gpt-oss-20b" });
  });

  it("strongest chain rotates 3-way on every call (openrouter → groq → nvidia)", () => {
    const seq1 = resolveEffectiveChain("plan:nutrition", baseCtx({ callSeq: 1 }));
    expect(seq1.entries[0].provider).toBe("openrouter");
    const seq2 = resolveEffectiveChain("plan:nutrition", baseCtx({ callSeq: 2 }));
    expect(seq2.entries[0].provider).toBe("groq");
    expect(seq2.entries[0].model).toBe("openai/gpt-oss-120b");
    const seq3 = resolveEffectiveChain("plan:nutrition", baseCtx({ callSeq: 3 }));
    expect(seq3.entries[0].provider).toBe("nvidia");
    const seq4 = resolveEffectiveChain("plan:nutrition", baseCtx({ callSeq: 4 }));
    expect(seq4.entries[0].provider).toBe("openrouter"); // cycle repeats
  });

  it("R3 payload law mirrors the engine: review (~11k est) drops groq; content (~9.2k est) clamps it", () => {
    // blog:review embeds a full draft → prompt ~45k chars → est ≈ 18.5k > 7200
    // and the clamp window falls below the 3800 floor → groq DROPPED.
    const review = resolveEffectiveChain(
      "blog:review-ar",
      baseCtx({ promptChars: 45_000, maxTokens: 6400 }),
    );
    expect(review.entries.every((e) => e.provider !== "groq")).toBe(true);
    // blog:content ~8k chars prompt → est ≈ 9.2k > 7200 → clamp keeps groq
    // with max_tokens = 7200 − 2000 − 800 = 4400 (≥ the 3800 floor).
    const content = resolveEffectiveChain(
      "blog:content-ar",
      baseCtx({ promptChars: 8_000, maxTokens: 6400 }),
    );
    const groqEntries = content.entries.filter((e) => e.provider === "groq");
    expect(groqEntries.length).toBeGreaterThan(0);
    for (const g of groqEntries) {
      expect(g.maxTokens).toBe(4400);
    }
    // a small payload never touches the clamp
    const small = resolveEffectiveChain(
      "plan:item-regen",
      baseCtx({ promptChars: 1_200, maxTokens: 400 }),
    );
    expect(small.entries.every((e) => e.maxTokens === undefined)).toBe(true);
  });

  it("the budget clamp: maxModels × effTimeout ≤ AI_CHAIN_TOTAL_BUDGET_MS", () => {
    // GHA native budget 480s, plan:nutrition (5 × 70s intent) → eff = min(70s, 96s) = 70s
    const gha = resolveEffectiveChain("plan:nutrition", baseCtx({ chainTotalBudgetMs: 480_000 }));
    expect(gha.maxModels).toBe(5);
    expect(gha.effTimeoutMs).toBe(70_000);
    // Vercel 52s budget → eff = min(70s, 52s/5=10.4s) = 10_400
    const vercel = resolveEffectiveChain("plan:nutrition", baseCtx({ chainTotalBudgetMs: 52_000 }));
    expect(vercel.effTimeoutMs).toBe(10_400);
    expect(vercel.maxModels * vercel.effTimeoutMs).toBeLessThanOrEqual(52_000);
  });

  it("the registry's fast ladder equals the engine's INTERLEAVED_FAST_CHAIN byte-for-byte", () => {
    const fastSpecs = Object.entries(AI_FUNCTION_REGISTRY).filter(([, s]) => s.policy.chain === "fast");
    expect(fastSpecs.length).toBe(4);
    for (const [id, spec] of fastSpecs) {
      expect(
        spec.ladder.map((e) => [e.provider, e.model]),
        `${id} fast ladder ≡ engine`,
      ).toEqual(INTERLEAVED_FAST_CHAIN.map((e) => [e.provider, e.model]));
    }
  });

  it("rotated leads + gemini tail: the declared strongest ladder mirrors the engine's head structure", () => {
    for (const [id, spec] of Object.entries(AI_FUNCTION_REGISTRY)) {
      if (spec.policy.chain === "fast") continue;
      const leadProviders = spec.ladder.filter((e) => e.role === "lead-rotated").map((e) => e.provider);
      expect(
        new Set(leadProviders),
        `${id} rotated-lead candidates`,
      ).toEqual(new Set(["openrouter", "groq", "nvidia"]));
      const tails = spec.ladder.filter((e) => e.role === "tail");
      expect(tails.map((t) => t.provider)).toEqual(["gemini"]);
      // the engine's real head for each lead candidate matches a declared model
      const engineModels = INTERLEAVED_STRONGEST_CHAIN.map((e) => `${e.provider}/${e.model}`);
      for (const entry of spec.ladder.filter((e) => e.role === "lead-rotated" || e.role === "tail")) {
        expect(
          engineModels,
          `${id} declared ${entry.provider}/${entry.model} exists in the engine chain`,
        ).toContain(`${entry.provider}/${entry.model}`);
      }
    }
  });

  it("the grounded ladder: registry §6-أ arms ≡ engine groundedArmOrder() (ar/en)", () => {
    const spec = AI_FUNCTION_REGISTRY["blog:research"];
    expect(spec.grounding?.armsAr).toEqual(groundedArmOrder("ar"));
    expect(spec.grounding?.armsEn).toEqual(groundedArmOrder("en"));
    expect(spec.grounding?.armsAr).toEqual(["tavily", "groq", "exa", "gemini"]);
    expect(spec.grounding?.armsEn).toEqual(["exa", "tavily", "groq", "gemini"]);
    expect(spec.grounding?.geminiDormant).toBe(true);
  });

  it("GEMINI_MODEL runtime override rewrites the tail (ops knob honored by the mirror)", () => {
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    const out = resolveEffectiveChain("plan:nutrition", baseCtx({ geminiModelOverride: "gemini-2.5-flash" }));
    const gemini = out.entries.filter((e) => e.provider === "gemini");
    expect(gemini.map((g) => g.model)).toEqual(["gemini-2.5-flash"]);
  });

  it("the CF neuron barrier skips the role honestly (the role falls to the chain)", () => {
    const tripped = resolveEffectiveChain("blog:pairing", baseCtx({ cfNeuronBarrierTripped: true }));
    expect(tripped.entries.every((e) => e.provider !== "cloudflare")).toBe(true);
    expect(tripped.entries[0].provider).toBe("openrouter"); // ordinary chain leads
  });
});

describe("registerFunction — the one-step future path (§6-ج)", () => {
  const ORIGINAL_KEYS = Object.keys(AI_FUNCTION_REGISTRY);

  afterEach(() => {
    // restore the pristine registry (tests must not leak registrations)
    for (const k of Object.keys(AI_FUNCTION_REGISTRY)) {
      if (!ORIGINAL_KEYS.includes(k)) delete (AI_FUNCTION_REGISTRY as Record<string, unknown>)[k];
    }
  });

  const validSpec: AIFunctionSpec = {
    id: "test:new-function",
    family: "tools",
    role: { json: true, streaming: false, language: "both", payloadClass: "light" },
    ladder: [
      {
        provider: "groq",
        model: "openai/gpt-oss-120b",
        role: "lead-rotated",
        evidence: { source: "test fixture", status: "measured" },
      },
    ],
    policy: { temperature: 0.5, maxTokens: 500, jsonMode: true, timeoutMs: 20_000, maxModels: 2 },
    gates: ["fixture gate"],
    metering: { scope: "test:new-function" },
    entry: { surface: "ai_jobs", trigger: "test" },
    doc: { since: "test", rationale: "fixture", evidence: "fixture" },
  };

  it("registers a valid spec and dispatch resolves it immediately", () => {
    registerFunction(validSpec);
    const resolved = resolveFunction("test:new-function");
    expect(resolved.options).toEqual({
      tag: "test:new-function",
      temperature: 0.5,
      maxTokens: 500,
      jsonMode: true,
      timeoutMs: 20_000,
      maxModels: 2,
    });
    expect(listRegistryIds()).toContain("test:new-function");
  });

  it("rejects a ladder entry without evidence (the no-model-without-evidence law)", () => {
    const bad: AIFunctionSpec = {
      ...validSpec,
      id: "test:no-evidence",
      ladder: [
        {
          provider: "groq" as const,
          model: "x",
          evidence: { source: "", status: "measured" as const },
        },
      ],
    };
    expect(() => registerFunction(bad)).toThrow(/no evidence\.source/);
  });

  it("rejects a wave-2-pending FIXED-LEAD (a role probe must measure it first)", () => {
    const bad: AIFunctionSpec = {
      ...validSpec,
      id: "test:wave2-lead",
      ladder: [
        {
          provider: "cloudflare" as const,
          model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          role: "fixed-lead" as const,
          evidence: { source: "phase-4 §6-ب candidacy", status: "wave-2-pending" as const },
        },
      ],
    };
    expect(() => registerFunction(bad)).toThrow(/wave-2-pending/);
  });

  it("rejects streaming + cloudflare (structural exclusion)", () => {
    const bad: AIFunctionSpec = {
      ...validSpec,
      id: "test:streaming-cf",
      role: { json: false, streaming: true, language: "both", payloadClass: "light" },
      policy: { chain: "fast", temperature: 0.5, maxTokens: 500, timeoutMs: 20_000, maxModels: 2 },
      ladder: [
        {
          provider: "cloudflare" as const,
          model: "@cf/meta/llama-4-scout-17b-16e-instruct",
          evidence: { source: "x", status: "measured" as const },
        },
      ],
    };
    expect(() => registerFunction(bad)).toThrow(/streaming but its ladder contains cloudflare/);
  });

  it("rejects duplicate ids unless overwrite is explicit", () => {
    registerFunction(validSpec);
    expect(() => registerFunction(validSpec)).toThrow(/already registered/);
    expect(() => registerFunction(validSpec, true)).not.toThrow();
  });

  it("rejects an unknown family and a blank id", () => {
    expect(() => registerFunction({ ...validSpec, id: "  " })).toThrow(/spec\.id is required/);
    expect(() =>
      registerFunction({ ...validSpec, id: "test:x", family: "nope" as never }),
    ).toThrow(/unknown family/);
  });
});

/* ── helpers ── */

function baseCtx(over: Partial<Parameters<typeof resolveEffectiveChain>[1]> = {}) {
  return {
    configuredProviders: ["openrouter", "groq", "nvidia", "gemini", "cloudflare"] as const,
    callSeq: 1,
    promptChars: 4_000,
    maxTokens: undefined as number | undefined,
    chainTotalBudgetMs: 480_000,
    geminiModelOverride: undefined as string | undefined,
    streaming: false,
    cfNeuronBarrierTripped: false,
    groqClampEnabled: true,
    ...over,
  };
}

/* ─────────────── R3 — the plans family rides the router ONLY ───────────────
 * Migration-frame canary (ت1 scoped to the plans family): after R3, the
 * family's files contain ZERO direct engine calls — every dispatch goes
 * through dispatchAI (policy from the registry). The demo canaries already
 * pin the same for the two visitor routes; this generalizes it to the
 * generator itself. */

describe("R3 — plans family migrated: no direct engine calls remain", () => {
  const PLANS_FILES = [
    "src/lib/plan-generator.ts",
    "src/app/api/ai/meal-plan-demo/route.ts",
    "src/app/api/ai/workout-plan-demo/route.ts",
  ];

  it("every plans-family file dispatches through the router (no callFreeAIFallbackChain)", () => {
    for (const f of PLANS_FILES) {
      const src = readFileSync(f, "utf8");
      expect(src, `${f} must not call the engine directly`).not.toContain("callFreeAIFallbackChain(");
      expect(src, `${f} must not call grounded search`).not.toContain("callGroundedSearch(");
    }
  });

  it("the generator carries NO inline routing policy (registry-owned only)", () => {
    const src = stripInlineComments(readFileSync("src/lib/plan-generator.ts", "utf8"));
    expect(src).not.toMatch(/\bmaxModels\s*:/);
    expect(src).not.toMatch(/\btimeoutMs\s*:/);
    expect(src).not.toMatch(/\bjsonMode\s*:/);
    // systemPrompt overrides and payload maxTokens overrides ARE allowed
    // (the closed override list) — temperature is policy and must be gone.
    expect(src).not.toMatch(/temperature\s*:/);
  });

  it("both demo routes dispatch their registry ids", () => {
    const meal = readFileSync("src/app/api/ai/meal-plan-demo/route.ts", "utf8");
    expect(meal).toContain('dispatchAI("meal-demo"');
    const workout = readFileSync("src/app/api/ai/workout-plan-demo/route.ts", "utf8");
    expect(workout).toContain('dispatchAI("workout-demo"');
  });
});

function stripInlineComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

/* ─────────── ت4 — the manual≡auto blog ENGINE-PARITY canary (R4) ───────────
 * §6-و/§9-ت4 of the audit: the paired pipeline (automatic + manual dispatch,
 * Phase 162) and the single-shot FALLBACK draft generator must resolve ONE
 * policy from ONE source — the ONLY allowed deltas are the DECLARED
 * draft-vs-pipeline contract differences (word contract · call count ·
 * is_published), which live in docs/gates, never in routing. */

describe("ت4 — blog engine parity: manual ≡ automatic resolve one policy", () => {
  it("blog:draft-generate and ai-job:article-generate resolve IDENTICAL routing", () => {
    const draft = resolveFunction("blog:draft-generate");
    const tool = resolveFunction("ai-job:article-generate");
    // One ladder + one policy (the routing must be indistinguishable).
    expect(draft.options).toEqual({
      tag: "blog:draft-generate",
      temperature: 0.7,
      maxTokens: 6000,
      jsonMode: true,
      timeoutMs: 120_000,
      maxModels: 4,
    });
    expect({ ...tool.options, tag: undefined }).toEqual({ ...draft.options, tag: undefined });
    expect(draft.spec.ladder).toEqual(tool.spec.ladder);
    // The draft spec carries the historical metering tag (tags-are-the-ids).
    expect(draft.spec.metering.scope).toBe("ai-job:article-generate");
  });

  it("the ONLY allowed deltas are declared docs/gates — never routing fields", () => {
    const draft = AI_FUNCTION_REGISTRY["blog:draft-generate"];
    const tool = AI_FUNCTION_REGISTRY["ai-job:article-generate"];
    expect(draft.family).toBe("blog"); // registered in the BLOG family (§6-و)
    expect(tool.family).toBe("tools");
    // Routing fields byte-identical.
    expect(draft.policy).toEqual(tool.policy);
    expect(draft.role).toEqual(tool.role);
    expect(draft.ladder).toEqual(tool.ladder);
    // Deltas confined to documentation + gates + entry (the declared list).
    expect(draft.doc.rationale).toContain("1100-1400");
    expect(tool.doc.rationale).not.toContain("1100-1400");
  });

  it("both blog engines compose the editorial constitution from the SAME source (no-fork extends to the twin)", () => {
    const pipelineSrc = readFileSync("src/lib/blog-pipeline.ts", "utf8");
    const processorSrc = readFileSync("src/lib/ai-job-processors.ts", "utf8");
    // Both import from the single editorial-law source (AGENTS §8 UNIFIED
    // EDITORIAL CONSTITUTION) — a forked local copy in either is banned.
    expect(pipelineSrc).toContain('from "./blog-editorial-law"');
    expect(processorSrc).toContain('from "@/lib/blog-editorial-law"');
    expect(pipelineSrc).not.toMatch(/const EDITORIAL_(?:ANSWER_FIRST|EEAT|FACT_GUARD)\s*[:=]/);
    expect(processorSrc).not.toMatch(/const EDITORIAL_(?:ANSWER_FIRST|EEAT|FACT_GUARD)\s*[:=]/);
    // Both carry the MSA law from the single source too.
    expect(pipelineSrc).toContain('from "./blog-msa"');
    expect(processorSrc).toContain('from "@/lib/blog-msa"');
  });
});

/* ─────────── R4 — the blog family rides the router ONLY ─────────── */

describe("R4 — blog family migrated: no direct engine calls remain", () => {
  const BLOG_FILES = [
    "src/lib/blog-pipeline.ts",
    "src/lib/blog-pairing.ts",
    "src/lib/blog-topics.ts",
    "src/lib/blog-research.ts",
    "src/lib/ai-job-processors.ts",
    "src/lib/social-posts.ts",
  ];

  it("every blog-family file dispatches through the router", () => {
    for (const f of BLOG_FILES) {
      const src = stripInlineComments(readFileSync(f, "utf8"));
      expect(src, `${f} must not call the engine directly`).not.toContain("callFreeAIFallbackChain(");
      expect(src, `${f} must not call grounded search directly`).not.toContain("callGroundedSearch(");
    }
  });

  it("the ten editor tools + the draft generator + research dispatch their registered ids", () => {
    const processor = readFileSync("src/lib/ai-job-processors.ts", "utf8");
    expect(processor).toContain("dispatchAI(`ai-job:${tool}`");
    expect(processor).toContain('dispatchAI("ai-job:article-generate"');
    const research = readFileSync("src/lib/blog-research.ts", "utf8");
    expect(research).toContain('dispatchGrounded(\n      "blog:research"');
    const pipeline = readFileSync("src/lib/blog-pipeline.ts", "utf8");
    expect(pipeline).toContain("dispatchAI(`blog:pick-topic-${lang}`");
    expect(pipeline).toContain("dispatchAI(`blog:outline-${lang}`");
    expect(pipeline).toContain("dispatchAI(`blog:content-${lang}`");
    expect(pipeline).toContain("dispatchAI(`blog:review-${lang}`");
    expect(pipeline).toContain('dispatchAI("blog:latin-tokens-ar"');
    expect(pipeline).toContain('dispatchAI("blog:latin-repair-ar"');
    const pairing = readFileSync("src/lib/blog-pairing.ts", "utf8");
    expect(pairing).toContain('dispatchAI("blog:pairing"');
    const topics = readFileSync("src/lib/blog-topics.ts", "utf8");
    expect(topics).toContain("dispatchAI(`blog:topics-${language}`");
    const social = readFileSync("src/lib/social-posts.ts", "utf8");
    expect(social).toContain('dispatchAI(\n    input.language === "ar" ? "social-posts:ar" : "social-posts:en"');
  });
});
