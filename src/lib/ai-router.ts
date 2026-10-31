/**
 * AI ROUTER — the thin decision layer ABOVE the untouched engine
 * (Phase 388, owner order 2026-10-31 — approved design §6-ج of
 * docs/AI-ROUTER-UNIFICATION-AUDIT-2026-10-31.md).
 *
 * ROLE
 *   resolveFunction / dispatchAI / dispatchGrounded turn the data-only
 *   registry (ai-registry.ts) into the ONE place a call site asks for
 *   routing: `dispatchAI("plan:nutrition", prompt, { systemPrompt })`
 *   instead of a hand-copied option block. The two engines
 *   (callFreeAIFallbackChain + callGroundedSearch) stay the ONLY
 *   transport (AGENTS §8 single-source law) — the router PRODUCES their
 *   inputs, it never re-implements the walk (rotation / R3 clamp / CF
 *   insertion / cooldowns keep running inside the engine verbatim).
 *
 * ROLLBACK WITHOUT A DEPLOY (design principle 7)
 *   AI_ROUTER_MODE=legacy switches every dispatch to the FROZEN snapshot
 *   of the pre-migration inline option blocks (LEGACY_POLICIES below) —
 *   the exact values each call site passed before its family migrated.
 *   While the registry and the snapshot agree (the golden canaries prove
 *   it on every run) the two modes are behaviorally identical; the day a
 *   future frame changes a registry ladder/policy, legacy remains the
 *   one-env-var path back to today's measured behavior (T8 rollback test).
 *
 * CALL-SITE OVERRIDE LAW (design §6-ج)
 *   Allowed overrides (closed list): systemPrompt, onDelta (streaming),
 *   maxTokens (payload-contract conditionals such as social-posts
 *   linkedin 2600) — ROUTING POLICY (maxModels / timeoutMs / chain /
 *   jsonMode / temperature / tag) comes from the registry ALONE; any
 *   attempt to override it throws loudly (CI guard R6 backs this up).
 *
 * R1 SCOPE: this module ships with ZERO production consumers — call
 * sites migrate family-by-family in R3/R4/R5. Until then only the
 * golden canaries import it. Zero behavior change by construction.
 */

import {
  AI_FUNCTION_REGISTRY,
  resolveRegistrySpec,
  type AIFunctionSpec,
} from "./ai-registry";
import {
  callFreeAIFallbackChain,
  callGroundedSearch,
  INTERLEAVED_FAST_CHAIN,
  INTERLEAVED_STRONGEST_CHAIN,
  type AIProvider,
  type FallbackChainOptions,
  type GroundedSearchOptions,
  type GroundedSearchResult,
} from "./ai-provider";

/* ───────────────────────── Router mode ───────────────────────── */

export type AIRouterMode = "registry" | "legacy";

/** AI_ROUTER_MODE=legacy → the frozen pre-migration snapshot (see above).
 *  Absent/any other value → "registry" (the central source). */
export function aiRouterMode(): AIRouterMode {
  return process.env.AI_ROUTER_MODE === "legacy" ? "legacy" : "registry";
}

/* ────────────── The frozen legacy snapshot (T8 rollback key) ──────────────
 * Byte-identical to the inline option blocks the call sites passed BEFORE
 * their family's migration frame — transcribed from the audit's §3-ب table
 * (file:line evidence in ai-registry.ts doc.evidence). The golden canaries
 * pin registry≡legacy per function; this map is what AI_ROUTER_MODE=legacy
 * serves, so a future registry change can never silently alter the
 * pre-migration measured behavior. */
type LegacyPolicy = Pick<
  FallbackChainOptions,
  "maxTokens" | "timeoutMs" | "maxModels" | "temperature" | "jsonMode" | "chain"
>;

const LEGACY_POLICIES: Record<string, LegacyPolicy> = {
  // plans (plan-generator.ts)
  "plan:nutrition": { temperature: 0.7, maxTokens: 7000, jsonMode: true, timeoutMs: 70_000, maxModels: 5 },
  "plan:workout": { temperature: 0.7, maxTokens: 4000, jsonMode: true, timeoutMs: 35_000, maxModels: 4 },
  "plan:nutrition-alt": { temperature: 0.8, maxTokens: 2600, jsonMode: true, timeoutMs: 60_000, maxModels: 3 },
  "plan:item-regen": { temperature: 0.7, maxTokens: 400, jsonMode: true, timeoutMs: 30_000, maxModels: 3 },
  "plan:day-regen": { temperature: 0.7, maxTokens: 1200, jsonMode: true, timeoutMs: 45_000, maxModels: 3 },
  "plan:exercise-corrective": { temperature: 0.4, maxTokens: 900, jsonMode: true, timeoutMs: 45_000, maxModels: 2 },
  "plan:json-normalize": { temperature: 0.3, maxTokens: 4000, jsonMode: true, timeoutMs: 26_000, maxModels: 2 },
  // blog (blog-pipeline.ts / blog-pairing.ts / blog-topics.ts / blog-research.ts)
  "blog:research": { temperature: 0.7, maxTokens: 4000, timeoutMs: 180_000 },
  "blog:pairing": { temperature: 0.3, maxTokens: 400, jsonMode: true, timeoutMs: 45_000, maxModels: 4 },
  "blog:pick-topic": { temperature: 0.4, maxTokens: 120, jsonMode: true, timeoutMs: 90_000, maxModels: 3 },
  "blog:outline": { temperature: 0.6, maxTokens: 4000, jsonMode: false, timeoutMs: 110_000, maxModels: 3 },
  "blog:content": { temperature: 0.7, maxTokens: 6400, jsonMode: false, timeoutMs: 150_000, maxModels: 3 },
  "blog:review": { temperature: 0.4, maxTokens: 6400, jsonMode: false, timeoutMs: 150_000, maxModels: 4 },
  "blog:latin-tokens-ar": { temperature: 0.2, maxTokens: 1200, jsonMode: true, timeoutMs: 60_000, maxModels: 3 },
  "blog:latin-repair-ar": { temperature: 0.2, maxTokens: 6400, jsonMode: false, timeoutMs: 110_000, maxModels: 3 },
  "blog:topics": { temperature: 0.85, maxTokens: 800, jsonMode: true, timeoutMs: 22_000, maxModels: 2 },
  // tools (ai-job-processors.ts)
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
  // social (social-posts.ts)
  "social-posts": { temperature: 0.75, maxTokens: 2200, jsonMode: true, timeoutMs: 70_000, maxModels: 3 },
  // demo (visitor routes)
  "meal-demo": { temperature: 0.4, maxTokens: 3000, jsonMode: true, timeoutMs: 20_000 },
  "workout-demo": { temperature: 0.4, maxTokens: 3000, jsonMode: true, timeoutMs: 20_000 },
  // evo (chat route + eval runner)
  "evo-chat": { temperature: 0.6, maxTokens: 800, timeoutMs: 16_000, maxModels: 3, chain: "fast" },
  "evo-memory": { temperature: 0.2, maxTokens: 400, timeoutMs: 12_000, maxModels: 2, chain: "fast" },
  "evo-eval": { temperature: 0.6, maxTokens: 800, timeoutMs: 20_000, maxModels: 3, chain: "fast" },
  "evo-eval-judge": { temperature: 0, maxTokens: 300, timeoutMs: 15_000, maxModels: 2, chain: "fast" },
};

/* ─────────────────────── Override contract ─────────────────────── */

/** ALLOWED call-site overrides — the closed list (design §6-ج).
 *  systemPrompt / onDelta are call context; maxTokens is the payload
 *  contract (conditional variants such as social-posts linkedin 2600).
 *  Routing policy (maxModels/timeoutMs/chain/jsonMode/temperature/tag)
 *  is registry-owned and any attempt to set it throws. */
export interface AICallOverrides {
  systemPrompt?: string;
  onDelta?: (chunk: string) => void;
  maxTokens?: number;
}

const FORBIDDEN_OVERRIDES = [
  "maxModels",
  "timeoutMs",
  "chain",
  "jsonMode",
  "temperature",
  "tag",
] as const;

function assertNoPolicyOverride(overrides: Record<string, unknown> | undefined): void {
  if (!overrides) return;
  for (const key of FORBIDDEN_OVERRIDES) {
    if (overrides[key] !== undefined) {
      throw new Error(
        `[ai-router] "${key}" is registry-owned policy — call sites cannot override it (design §6-ج; AI_ROUTER_MODE=legacy is the escape hatch)`,
      );
    }
  }
}

/* ─────────────────────── resolveFunction ─────────────────────── */

export interface ResolvedAIFunction {
  /** The concrete tag (language-expanded when applicable). */
  effectiveId: string;
  spec: AIFunctionSpec;
  /** The COMPLETE FallbackChainOptions the engine will receive — policy
   *  (registry or legacy snapshot) + tag + allowed overrides. */
  options: FallbackChainOptions;
}

/** Resolve a function's routing: registry spec + policy → engine options.
 *  Throws for unknown ids (a typo'd tag must never silently ride
 *  defaults) and for policy-owning overrides. */
export function resolveFunction(
  id: string,
  overrides?: AICallOverrides,
): ResolvedAIFunction {
  assertNoPolicyOverride(overrides as Record<string, unknown> | undefined);
  const hit = resolveRegistrySpec(id);
  if (!hit) {
    throw new Error(
      `[ai-router] unknown AI function id "${id}" — register it in ai-registry.ts (registerFunction) before dispatching`,
    );
  }
  const { effectiveId, spec } = hit;
  const policy =
    aiRouterMode() === "legacy"
      ? legacyPolicyFor(effectiveId, spec)
      : registryPolicyFor(spec);

  const options: FallbackChainOptions = {
    tag: effectiveId,
    ...policy,
    ...(overrides?.systemPrompt !== undefined ? { systemPrompt: overrides.systemPrompt } : {}),
    ...(overrides?.onDelta !== undefined ? { onDelta: overrides.onDelta } : {}),
    ...(overrides?.maxTokens !== undefined ? { maxTokens: overrides.maxTokens } : {}),
  };
  return { effectiveId, spec, options };
}

function registryPolicyFor(spec: AIFunctionSpec): LegacyPolicy {
  const p = spec.policy;
  const out: LegacyPolicy = {};
  if (p.temperature !== undefined) out.temperature = p.temperature;
  if (p.maxTokens !== undefined) out.maxTokens = p.maxTokens;
  if (p.jsonMode !== undefined) out.jsonMode = p.jsonMode;
  if (p.timeoutMs !== undefined) out.timeoutMs = p.timeoutMs;
  if (p.maxModels !== undefined) out.maxModels = p.maxModels;
  if (p.chain !== undefined) out.chain = p.chain;
  return out;
}

/** Legacy mode: the frozen snapshot, keyed by the spec's BASE id (the
 *  snapshot predates language expansion — one block per template). */
function legacyPolicyFor(effectiveId: string, spec: AIFunctionSpec): LegacyPolicy {
  const snap = LEGACY_POLICIES[spec.id];
  if (!snap) {
    // A function registered AFTER the migration frames (the §6-ج future
    // path) has no pre-migration snapshot — legacy mode serves its
    // registry policy verbatim (legacy is "pre-migration behavior", and
    // for a post-migration function the registry IS its origin).
    return registryPolicyFor(spec);
  }
  void effectiveId;
  return { ...snap };
}

/* ─────────────────────── dispatch (thin pass-through) ─────────────────────── */

/** Dispatch a generation call through the central router — a literal
 *  pass-through to the engine with the resolved options. */
export async function dispatchAI(
  id: string,
  prompt: string,
  overrides?: AICallOverrides,
): Promise<{ text: string; model: string; provider: string }> {
  const { options } = resolveFunction(id, overrides);
  return callFreeAIFallbackChain(prompt, options);
}

/** Dispatch a grounded-search call — the arm ladder stays the engine's
 *  groundedArmOrder(lang); search queries/lang are call context. */
export async function dispatchGrounded(
  id: string,
  prompt: string,
  searchOpts?: Pick<GroundedSearchOptions, "searchQuery" | "searchQueryEn" | "lang">,
  overrides?: AICallOverrides,
): Promise<GroundedSearchResult> {
  const { options } = resolveFunction(id, overrides);
  return callGroundedSearch(prompt, { ...options, ...searchOpts });
}

/* ─────────── Pure effective-chain resolution (canary/analysis only) ───────────
 * A PURE, network-free mirror of the engine's walk-preparation steps —
 * chain selection → 3-way lead rotation → R3 groq clamp/drop → GEMINI_MODEL
 * override → CF role insertion → maxModels/effTimeout clamping — used by the
 * golden/specialization canaries to PROVE the registry's declared ladder
 * matches what the engine actually walks. It is NOT a second execution
 * path: the engine remains the only executor; this function merely models
 * the deterministic prep for verification and future dashboards. */

export interface EffectiveChainContext {
  /** Which providers have keys configured (skip-unconfigured engine law). */
  configuredProviders: readonly AIProvider[];
  /** The rotation counter value (engine chainCallSeq BEFORE this call +1). */
  callSeq: number;
  /** Prompt character length — drives the R3 payload estimate. */
  promptChars: number;
  /** Caller maxTokens (from the resolved policy). */
  maxTokens?: number;
  /** Chain budget (AI_CHAIN_TOTAL_BUDGET_MS — surface-dependent). */
  chainTotalBudgetMs: number;
  /** GEMINI_MODEL runtime override, if set. */
  geminiModelOverride?: string;
  /** Whether the call streams (onDelta set) — excludes CF structurally. */
  streaming: boolean;
  /** CF neuron barrier tripped (≥95% of 10k/day) — skip CF honestly. */
  cfNeuronBarrierTripped: boolean;
  /** GROQ_MAX_TOKENS_CLAMP=0 rollback flag. */
  groqClampEnabled: boolean;
}

export interface EffectiveChainResult {
  /** The ordered entries the engine will walk (post rotation/clamp/CF). */
  entries: Array<{ provider: AIProvider; model: string; maxTokens?: number }>;
  /** maxModels after engine clamping (≥1, ≤ entries). */
  maxModels: number;
  /** Per-model effective timeout (caller timeout ∧ budget/maxModels). */
  effTimeoutMs: number;
}

const GROQ_TPM_WINDOW = 7_200;
const GROQ_TPM_RESERVE = 800;
const GROQ_CLAMP_FLOOR = 3_800;
const LEAD_SEQ: AIProvider[] = ["openrouter", "groq", "nvidia"];

/** The engine's cfRoleForTag map (first-wave agile roles) — mirrored here
 *  (purely for the model-resolution mirror) from ai-provider.ts. */
const CF_ROLE_MODELS: Record<string, string> = {
  "blog:pairing": "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "blog:latin-tokens-ar": "@cf/meta/llama-4-scout-17b-16e-instruct",
};

export function resolveEffectiveChain(
  id: string,
  ctx: EffectiveChainContext,
): EffectiveChainResult {
  const hit = resolveRegistrySpec(id);
  if (!hit) {
    throw new Error(`[ai-router] resolveEffectiveChain: unknown id "${id}"`);
  }
  const spec = hit.spec;
  const chain: "strongest" | "fast" = spec.policy.chain ?? "strongest";
  const configured = new Set(ctx.configuredProviders);

  type ChainEntry = { provider: AIProvider; model: string; maxTokens?: number };
  let active: ChainEntry[] = chain === "fast" ? [...INTERLEAVED_FAST_CHAIN] : [...INTERLEAVED_STRONGEST_CHAIN];

  // R3 payload estimate + per-entry clamp decision (engine law).
  const promptTokens = Math.ceil(ctx.promptChars / 4);
  const effCallerMaxTokens = ctx.maxTokens ?? 2 * 1024;
  const estTokens = promptTokens + effCallerMaxTokens + 800;
  const groqWindow = GROQ_TPM_WINDOW - promptTokens - GROQ_TPM_RESERVE;
  const skipGroq =
    chain !== "fast" &&
    estTokens > GROQ_TPM_WINDOW &&
    (!ctx.groqClampEnabled || groqWindow < GROQ_CLAMP_FLOOR);
  const groqClampTokens =
    chain !== "fast" && !skipGroq && estTokens > GROQ_TPM_WINDOW ? groqWindow : undefined;

  if (chain !== "fast") {
    // 3-way lead rotation (openrouter → groq → nvidia, every call).
    const leadProvider = LEAD_SEQ[(ctx.callSeq - 1) % LEAD_SEQ.length];
    const leadConfigured =
      leadProvider === "openrouter"
        ? configured.has("openrouter")
        : leadProvider === "groq"
          ? configured.has("groq") && !skipGroq
          : configured.has("nvidia");
    if (leadConfigured && leadProvider !== "openrouter") {
      const firstIdx = active.findIndex((e) => e.provider === leadProvider);
      if (firstIdx > 0) {
        active = [active[firstIdx], ...active.slice(0, firstIdx), ...active.slice(firstIdx + 1)];
      }
    }
    if (skipGroq) active = active.filter((e) => e.provider !== "groq");
    if (groqClampTokens !== undefined) {
      active = active.map((e) => (e.provider === "groq" ? { ...e, maxTokens: groqClampTokens } : e));
    }
  }

  // GEMINI_MODEL runtime override.
  if (ctx.geminiModelOverride) {
    active = active.map((e) => (e.provider === "gemini" ? { ...e, model: ctx.geminiModelOverride as string } : e));
  }

  // CF first-wave agile role insertion (fixed-lead for its two tags).
  const cfRoleModel = CF_ROLE_MODELS[hit.effectiveId] ?? null;
  if (
    cfRoleModel &&
    configured.has("cloudflare") &&
    !ctx.streaming &&
    !ctx.cfNeuronBarrierTripped &&
    active.every((e) => e.provider !== "cloudflare")
  ) {
    active = [{ provider: "cloudflare" as AIProvider, model: cfRoleModel }, ...active];
  }

  const requested = spec.policy.maxModels ?? 2;
  const maxModels = Math.max(1, Math.min(requested, active.length));
  const callerTimeoutMs = spec.policy.timeoutMs ?? 60_000;
  const effTimeoutMs = Math.min(callerTimeoutMs, Math.floor(ctx.chainTotalBudgetMs / maxModels));

  return { entries: active, maxModels, effTimeoutMs };
}

/* ─────────── Registry introspection (registry-completeness canaries) ─────────── */

/** Does the effective tag resolve? (Used by the R6 CI guard + canaries.) */
export function isRegisteredFunction(id: string): boolean {
  return resolveRegistrySpec(id) !== null;
}

/** Exported for canaries: the frozen snapshot (read-only view). */
export function legacySnapshotFor(id: string): LegacyPolicy | undefined {
  const hit = resolveRegistrySpec(id);
  return hit ? LEGACY_POLICIES[hit.spec.id] : undefined;
}

/** Re-export so the CI guard + tests can enumerate without importing
 *  the registry module separately. */
export { AI_FUNCTION_REGISTRY };
