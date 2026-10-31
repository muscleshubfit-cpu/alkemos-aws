/**
 * AI FUNCTION REGISTRY — the central decision layer of the AI-Router
 * unification (Phase 388, owner order 2026-10-31 «ابدأ تنفيذ خطة توحيد
 * منظومة الذكاء الاصطناعي وفق التقرير المعتمد» — the approved design §6-ب
 * of docs/AI-ROUTER-UNIFICATION-AUDIT-2026-10-31.md).
 *
 * WHAT THIS FILE IS
 *   Pure DATA — the single central source that defines, for EVERY AI
 *   function of the platform, its model ladder (primary + failover order),
 *   its call policy (maxTokens / timeoutMs / maxModels / jsonMode /
 *   temperature / chain) and its descriptive metadata (family, role,
 *   deterministic gates, metering scope, entry surface, ops knobs, and the
 *   measured rationale that USED TO live as inline comments at each call
 *   site). It contains NO network code, NO secrets, NO side effects — it is
 *   fully unit-testable and reviewable in one read.
 *
 * WHAT THIS FILE IS NOT (the engine stays the engine — AGENTS §8)
 *   It does NOT replace, bypass or shadow `src/lib/ai-provider.ts`: the two
 *   engines (`callFreeAIFallbackChain` + `callGroundedSearch`) remain the
 *   ONLY transport. The global chains (INTERLEAVED_STRONGEST_CHAIN /
 *   INTERLEAVED_FAST_CHAIN), the 3-way lead rotation, the R3 groq clamp,
 *   the CF role insertion, cooldowns and the neuron barrier keep living
 *   VERBATIM inside the engine — the registry DOCUMENTS the ladder roles
 *   and never copies the engine's ordered lists (anti-drift law: one
 *   algorithm, zero second copies; the T3 canaries pin the correspondence).
 *
 * LAW: TAGS ARE THE IDS (backward compatibility at zero cost)
 *   Every registry id IS the existing chain `tag` verbatim
 *   ("plan:nutrition", "evo-chat", "ai-job:faq", …) so logs, Upstash
 *   counters, the Gemini weekly report and evo_call_stats keep aggregating
 *   identically before and after every migration frame.
 *
 * LAW: NO ENTRY WITHOUT EVIDENCE (owner rule)
 *   Every ladder entry carries its evidence {source,status}. A status of
 *   "wave-2-pending" marks candidates NOT yet adopted — a role-probe
 *   through the real code path is the ONLY path to "measured"
 *   (no model is adopted for a function without function-specific testing).
 *
 * LAW: ZERO BEHAVIOR AT MIGRATION (R1 lands with ZERO consumers)
 *   R1 introduces the registry + router + golden canaries ONLY — no
 *   production call site changes. Families migrate frame-by-frame (R3
 *   plans · R4 blog · R5 EVO) behind dispatchAI(), each frame proven
 *   zero-behavior by re-running the golden canaries against the frozen
 *   pre-migration values. Global rollback without a deploy:
 *   AI_ROUTER_MODE=legacy (see ai-router.ts).
 *
 * LAW: GEMINI — optional tail, single key (owner order 2026-10-31, clause 6)
 *   GEMINI_API_KEY2 is RETIRED permanently: no path reads a second key and
 *   no ladder may depend on one. Gemini rides as an ordinary TAIL entry on
 *   measured availability, never a forced priority.
 */

import type { AIProvider } from "./ai-provider";

/* ───────────────────────────── Types ───────────────────────────── */

/** Function families (policy inheritance groups — audit §4 D-5). */
export type AIFunctionFamily =
  | "plans" // nutrition/workout generation + swaps + normalize (plan-generator.ts)
  | "blog" // the paired pipeline + pairing + topics + latin tools (blog-*.ts)
  | "evo" // chat/memory/eval family — fast chain, streaming where marked
  | "social" // social post generation (social-posts.ts)
  | "demo" // visitor synchronous demo surfaces (Vercel, EVO-style)
  | "tools"; // the ai_jobs article tools (ai-job-processors.ts)

/** One ladder slot. `role` is declared, never implied:
 *  - "lead-rotated": the strongest-chain 3-way rotation candidate
 *    (openrouter → groq → nvidia on EVERY call — engine law, pre-343 state).
 *  - "fixed-lead": a measured provider-role assignment that leads its tag
 *    (the CF first-wave agile roles) and falls to the ordinary chain.
 *  - "tail": the last-resort slot (gemini on both chains). */
export interface AILadderEntry {
  provider: AIProvider;
  model: string;
  role?: "lead-rotated" | "fixed-lead" | "tail";
  evidence: {
    /** Report/run/phase the measurement comes from. */
    source: string;
    status: "measured" | "wave-2-pending";
  };
}

/** Declared role requirements of the function (structural constraints the
 *  router and CI honor: streaming excludes cloudflare BY CONSTRUCTION). */
export interface AIFunctionRole {
  /** The call contract is strict JSON (jsonMode at the engine). */
  json: boolean;
  /** The surface streams tokens to a user (SSE) — CF excluded structurally. */
  streaming: boolean;
  language: "ar" | "en" | "both";
  /** Payload weight class — feeds the R3 groq clamp decision, documented. */
  payloadClass: "light" | "medium" | "heavy";
}

/** The call policy — EXACTLY the values the call site passes today.
 *  Fields absent from a live call site stay ABSENT here (the engine
 *  defaults rule); the golden canaries pin byte-parity per function. */
export interface AIFunctionPolicy {
  maxTokens?: number;
  timeoutMs?: number;
  maxModels?: number;
  temperature?: number;
  jsonMode?: boolean;
  /** Which global chain the function rides (absent = "strongest", the
   *  engine default). "fast" never rotates BY DESIGN (speed law). */
  chain?: "strongest" | "fast";
  /** The time-pocket governor the engine clamps against (52s Vercel /
   *  480–600s GHA via env — per-surface, unchanged). */
  budgetEnv?: "AI_CHAIN_TOTAL_BUDGET_MS";
}

/** Grounded-search arm ladder (the §6-أ language-split FINAL state) —
 *  documented here, EXECUTED by the engine's groundedArmOrder(). */
export interface AIGroundingSpec {
  armsAr: readonly string[];
  armsEn: readonly string[];
  /** Gemini's googleSearch arm is DORMANT (free tier has no grounding for
   *  current models) — rides last, skipped keyless. */
  geminiDormant: true;
  note: string;
}

/** Where the function is triggered from (audit §3-ج) — descriptive. */
export type AIFunctionEntrySurface =
  | "ai_jobs" // queued via POST /api/ai/jobs → process-ai-jobs.yml runner
  | "vercel-sync" // synchronous Vercel function (demo surfaces, normalize)
  | "vercel-stream" // synchronous Vercel function with SSE (EVO chat)
  | "gha-workflow"; // native GitHub Actions runner (blog pipeline steps)

export interface AIFunctionEntry {
  surface: AIFunctionEntrySurface;
  trigger: string;
}

/** Language-template expansion (the tag carries the language suffix).
 *  style "suffix" → `${id}-${lang}` (blog:pick-topic-ar · blog:topics-en)
 *  style "colon"  → `${id}:${lang}` (social-posts:ar · social-posts:en) */
export interface AILangTemplate {
  style: "suffix" | "colon";
  variants: readonly ("ar" | "en")[];
}

/** The full function specification (design §6-ب). */
export interface AIFunctionSpec {
  id: string;
  family: AIFunctionFamily;
  /** Declare when this spec inherits its family's shared policy shape —
   *  documentation of provenance (values are explicit either way). */
  inherits?: string;
  role: AIFunctionRole;
  ladder: AILadderEntry[];
  policy: AIFunctionPolicy;
  /** Deterministic gates governing this function (REFERENCES, never
   *  executed here — they stay at their sites, audit §3-د). */
  gates: string[];
  metering: { scope: string };
  entry: AIFunctionEntry;
  langTemplate?: AILangTemplate;
  grounding?: AIGroundingSpec;
  knobs?: string[];
  doc: {
    since: string;
    rationale: string;
    evidence: string;
  };
}

/* ─────────────── Shared ladder building blocks ───────────────
 * The strongest-chain rotation candidates + gemini tail. These document
 * the ROLES; the ordered list itself is the engine's
 * INTERLEAVED_STRONGEST_CHAIN (never copied here — anti-drift law). */

const ROTATED_LEADS: AILadderEntry[] = [
  {
    provider: "openrouter",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    role: "lead-rotated",
    evidence: {
      source: "PHASE-177 14-day live audit (470 GHA runs): 48.1% per-attempt success",
      status: "measured",
    },
  },
  {
    provider: "groq",
    model: "openai/gpt-oss-120b",
    role: "lead-rotated",
    evidence: {
      source: "PHASE-177: 85.3% live survival — the platform's best",
      status: "measured",
    },
  },
  {
    provider: "nvidia",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    role: "lead-rotated",
    evidence: {
      source: "NIM live-verified (run 34350583104); 69.8% live window survival",
      status: "measured",
    },
  },
];

const GEMINI_TAIL: AILadderEntry = {
  provider: "gemini",
  model: "gemini-3.5-flash",
  role: "tail",
  evidence: {
    source:
      "gemini-weekly-usage-report.md week 2026-10-18→24: 66/271 = 24.4% (worst of four — availability position, NOT quality)",
    status: "measured",
  },
};

/** The fast chain ladder IS copied verbatim (it never rotates — a static
 *  list by design) so future frames can reason about it; the T3 canary
 *  pins byte-parity with the engine's INTERLEAVED_FAST_CHAIN. */
const FAST_CHAIN_LADDER: AILadderEntry[] = [
  {
    provider: "groq",
    model: "openai/gpt-oss-20b",
    role: "fixed-lead",
    evidence: {
      source: "OWNER DIRECTIVE #1 speed law: smallest verified id, <1s TTFT, 82.6% live",
      status: "measured",
    },
  },
  {
    provider: "groq",
    model: "openai/gpt-oss-120b",
    evidence: {
      source: "PHASE-177: quality slot on Groq LPU, TTFT ~1-2s, 85.3% live",
      status: "measured",
    },
  },
  {
    provider: "nvidia",
    model: "nvidia/nemotron-3.5-lightning-30b-a3b",
    evidence: {
      source: "NIM fast slot (3B active) — 33.3% live; Groq-quota relief valve",
      status: "measured",
    },
  },
  {
    provider: "openrouter",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    evidence: {
      source: "Provider-diversity tail — 47.9% live",
      status: "measured",
    },
  },
  GEMINI_TAIL,
];

/** The CF first-wave agile role lead (Phase 5-C) — measured JSON role. */
const CF_PAIRING_LEAD: AILadderEntry = {
  provider: "cloudflare",
  model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  role: "fixed-lead",
  evidence: {
    source:
      "Phase-3 role probe 7/7 valid JSON both modes + led production run 41146215738 (25.34 neurons, paired attempt 1)",
    status: "measured",
  },
};

const CF_SCOUT_LEAD: AILadderEntry = {
  provider: "cloudflare",
  model: "@cf/meta/llama-4-scout-17b-16e-instruct",
  role: "fixed-lead",
  evidence: {
    source:
      "Phase-3 role probe — literal stability Jaccard 1.0; served production latin-tokens 19.16×2 neurons (run 06a682ce window)",
    status: "measured",
  },
};

/* ───────────────── The registry — every live AI function ─────────────────
 * ORDER: plans → blog → tools (article tools) → social → demo → evo.
 * Every policy value below was read from the ACTUAL option block at the
 * call site (audit §3-ب) — golden canaries pin them byte-for-byte. */

export const AI_FUNCTION_REGISTRY: Record<string, AIFunctionSpec> = {
  /* ═══════════════════════ FAMILY: plans ═══════════════════════ */

  "plan:nutrition": {
    id: "plan:nutrition",
    family: "plans",
    role: { json: true, streaming: false, language: "both", payloadClass: "heavy" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 7000,
      jsonMode: true,
      timeoutMs: 70_000,
      // QUALITY-FIRST LAW (2026-08-28i): 5 buckets — under provider
      // saturation the strongest available model must stay reachable.
      maxModels: 5,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["PLAN_AI_SANITY", "validateNutritionPlanAIOutput", "plan-audit (independent)", "normalizeNutritionPlan (recompute)"],
    metering: { scope: "plan:nutrition" },
    entry: {
      surface: "ai_jobs",
      trigger: "coach/member plan intent → unified monthly pool gate → ai_jobs queue (success-only)",
    },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "2026-08-28 (quality-first ladder) · 2026-08-28i (5 buckets)",
      rationale:
        "Heaviest Arabic JSON ask on the platform (7000 tokens — full plans with 2 structured alternatives per meal; GHA-native budget workflow sets AI_CHAIN_TOTAL_BUDGET_MS=180000).",
      evidence: "plan-generator.ts:553 option block (audit §3-ب row 22)",
    },
  },

  "plan:workout": {
    id: "plan:workout",
    family: "plans",
    role: { json: true, streaming: false, language: "both", payloadClass: "heavy" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: true,
      // QUALITY-FIRST LAW: 4 buckets + a humane 35s window (was 26s — too
      // tight for a multi-week program on slow models).
      timeoutMs: 35_000,
      maxModels: 4,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["validateWorkoutPlanAIOutput", "plan-audit (independent)", "normalizeWorkoutPlan (recompute)"],
    metering: { scope: "plan:workout" },
    entry: {
      surface: "ai_jobs",
      trigger: "coach/member plan intent → role gate + unified pool → ai_jobs queue",
    },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "2026-08-28 (4 buckets) · window fix 2026-09 (26s→35s)",
      rationale: "Multi-week program JSON; 35s per-model window for slow strong models.",
      evidence: "plan-generator.ts:715 option block (audit §3-ب row 23)",
    },
  },

  "plan:nutrition-alt": {
    id: "plan:nutrition-alt",
    family: "plans",
    role: { json: true, streaming: false, language: "ar", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.8,
      maxTokens: 2600,
      jsonMode: true,
      timeoutMs: 60_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["validateRegeneratedMeal", "swap-ownership law (member weekly quota / staff unlimited)"],
    metering: { scope: "plan:nutrition-alt" },
    entry: { surface: "ai_jobs", trigger: "member/coach meal swap → weekly quota gate → queue" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "swap durability frames (0102/0103)",
      rationale: "Single-meal regeneration JSON — one equivalent meal with constraints.",
      evidence: "plan-generator.ts:880 option block (audit §3-ب row 24)",
    },
  },

  "plan:item-regen": {
    id: "plan:item-regen",
    family: "plans",
    role: { json: true, streaming: false, language: "ar", payloadClass: "light" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 400,
      jsonMode: true,
      timeoutMs: 30_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["validateRegeneratedFoodItem"],
    metering: { scope: "plan:item-regen" },
    entry: { surface: "ai_jobs", trigger: "member/coach food-item swap → weekly quota gate → queue" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "swap durability frames",
      rationale: "Tiny JSON (one food item + grams) — light call, deep walk 3.",
      evidence: "plan-generator.ts:2425 option block (audit §3-ب row 25)",
    },
  },

  "plan:day-regen": {
    id: "plan:day-regen",
    family: "plans",
    role: { json: true, streaming: false, language: "ar", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 1200,
      jsonMode: true,
      timeoutMs: 45_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["validateRegeneratedWorkoutDay", "findExerciseInLibrary (post-shape)"],
    metering: { scope: "plan:day-regen" },
    entry: { surface: "ai_jobs", trigger: "member/coach day regeneration → weekly quota gate → queue" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "swap durability frames",
      rationale: "One training-day JSON (1200 tokens — exercises with sets/reps).",
      evidence: "plan-generator.ts:2522 option block (audit §3-ب row 26)",
    },
  },

  "plan:exercise-corrective": {
    id: "plan:exercise-corrective",
    family: "plans",
    role: { json: true, streaming: false, language: "ar", payloadClass: "light" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.4,
      maxTokens: 900,
      jsonMode: true,
      timeoutMs: 45_000,
      maxModels: 2,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["deterministic substitute pool (choice_index ∈ pool)", "PLAN-REGEN-CONSTRAINTS audit axes"],
    metering: { scope: "plan:exercise-corrective" },
    entry: { surface: "ai_jobs", trigger: "member/coach corrective substitution → quota gate → queue" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "PLAN-REGEN-CONSTRAINTS (2026-10-24)",
      rationale: "Corrective-exercise choice from the approved pool — small strict JSON, walk 2.",
      evidence: "plan-generator.ts:2299 option block (audit §3-ب row 27)",
    },
  },

  "plan:json-normalize": {
    id: "plan:json-normalize",
    family: "plans",
    role: { json: true, streaming: false, language: "ar", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.3, // low temp for faithful extraction
      maxTokens: 4000,
      jsonMode: true,
      timeoutMs: 26_000,
      maxModels: 2,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["schema check (meals|days)", "normalizeNutritionPlan/normalizeWorkoutPlan"],
    metering: { scope: "plan:json-normalize" },
    entry: { surface: "vercel-sync", trigger: "coach text→JSON: POST /api/plans/normalize (coach-only)" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "coach normalize path",
      rationale: "Faithful text→JSON extraction (low temperature), Vercel 52s-clamped.",
      evidence: "plan-generator.ts:2027 option block (audit §3-ب row 28)",
    },
  },

  /* ═══════════════════════ FAMILY: blog ═══════════════════════ */

  "blog:research": {
    id: "blog:research",
    family: "blog",
    role: { json: true, streaming: false, language: "both", payloadClass: "heavy" },
    ladder: [
      // The grounded arm ladder is language-split — documented below in
      // `grounding`; generation synthesis rides the ordinary chain.
      ...ROTATED_LEADS,
      GEMINI_TAIL,
    ],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      timeoutMs: 180_000,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: [
      "live-evidence gate 344 (200-without-URLs = honest failure)",
      "normalizeResearch (topics>0, keywords≥5)",
      "researchSource stamp (fallback never silent)",
    ],
    metering: { scope: "blog:research" },
    entry: { surface: "gha-workflow", trigger: "blog-post-{ar,en}.yml P0 + manual dispatch (same workflow)" },
    grounding: {
      armsAr: ["tavily", "groq", "exa", "gemini"],
      armsEn: ["exa", "tavily", "groq", "gemini"],
      geminiDormant: true,
      note: "§6-أ FINAL language-split state (Phase 5-B): EN leads Exa (80/80 · 46% authority · μ=529ms), AR leads Tavily (10/11 Arabic) and reaches Exa THIRD with the English-equivalent query; groq = agentic browser_search; gemini = dormant last arm (GEMINI_GROUNDED_ENABLED=0 drops it). The engine's groundedArmOrder() executes this ladder.",
    },
    knobs: ["GROUNDED_ARM_ORDER", "GEMINI_GROUNDED_ENABLED", "TAVILY_*", "EXA_*"],
    doc: {
      since: "5-A/5-B (2026-10-31) · maxTokens 4000 fix (run 41129910118)",
      rationale:
        "P0 research: synthesis JSON over live sources. maxTokens 4000 (PHASE 171 family — CoT-heavy reasoning models truncate a 2500 cap mid-JSON once the §6-أ evidence base grew ~+2k tokens). timeoutMs 180s: OR reasoning CoT runs 30–90s on the real research prompt (live 38846158680).",
      evidence: "blog-research.ts:511 option block + groundedArmOrder (audit §3-ب row 1)",
    },
  },

  "blog:pairing": {
    id: "blog:pairing",
    family: "blog",
    role: { json: true, streaming: false, language: "both", payloadClass: "light" },
    ladder: [CF_PAIRING_LEAD, ...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.3,
      maxTokens: 400,
      jsonMode: true,
      timeoutMs: 45_000,
      // AUDIT §9-2.5: 2→3 deep walk for a light call; PHASE 5-E (§10-هـ):
      // 3→4 — same precedent one slot deeper, riding the CF role lead.
      maxModels: 4,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["parsePairingJSON (strict candidates match)", "PAIRING_MAX_ATTEMPTS=3", "neuron barrier 95% / warning 80%"],
    metering: { scope: "blog:pairing" },
    entry: { surface: "gha-workflow", trigger: "pipeline pairing step (CREATE + RESUME with restricted candidate set)" },
    knobs: ["CF_ARM_ENABLED", "AI_PROVIDER_COOLDOWN_MS"],
    doc: {
      since: "Phase 5-C (CF role) · 5-E (resume pairing + 3→4)",
      rationale: "AR↔EN topic pairing choice — a MEASURED CF agile role (strict JSON, 400 tokens) with the ordinary chain as fallback.",
      evidence: "blog-pairing.ts:301 option block + cf-role-probe GREEN ×2 (41145616267, 41145984029)",
    },
  },

  "blog:pick-topic": {
    id: "blog:pick-topic",
    family: "blog",
    langTemplate: { style: "suffix", variants: ["ar", "en"] },
    role: { json: true, streaming: false, language: "both", payloadClass: "light" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.4,
      maxTokens: 120,
      jsonMode: true,
      // PHASE 177: 40s killed the strongest model's CoT — 220 aborts in 14d
      // lived exactly here; GHA budget 360s/3 = 120s allows 90s comfortably.
      timeoutMs: 90_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["index ∈ candidate set (deterministic fallback pick)"],
    metering: { scope: "blog:pick-topic-{lang}" },
    entry: { surface: "gha-workflow", trigger: "pipeline P1 pick (auto + manual dispatch share the workflow)" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "PHASE 177 window fix",
      rationale: "P1 topic choice — tiny JSON (index); 90s window funds ultra-550b CoT.",
      evidence: "blog-pipeline.ts:213 option block (audit §3-ب row 3)",
    },
  },

  "blog:outline": {
    id: "blog:outline",
    family: "blog",
    langTemplate: { style: "suffix", variants: ["ar", "en"] },
    role: { json: false, streaming: false, language: "both", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.6,
      maxTokens: 4000,
      // jsonMode deliberately DROPPED (PHASE 161.5 pattern): Groq strict
      // json mode hard-fails when a reasoning model burns completion tokens
      // on hidden CoT — the tolerant 161.5-hardened parseJSON salvages
      // partial/fenced JSON instead.
      jsonMode: false,
      // PHASE 177: 70s→110s (ultra-550b outline aborts at 70s, 220×/14d);
      // BLOG-PROVIDER-FAILOVER 2026-10-16: maxModels 2→3 (run 38847288514 —
      // a healthy groq entry sat beyond a 2-deep walk).
      timeoutMs: 110_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["outline gates (H2 5–8 · LSI · imagePlan · IMAGE LAW 173)", "slugBase latin law"],
    metering: { scope: "blog:outline-{lang}" },
    entry: { surface: "gha-workflow", trigger: "pipeline P1 outline" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "PHASE 171 (2600→4000) · 177 · 2026-10-16 failover",
      rationale: "P1 outline JSON (~700 tokens + reasoning CoT headroom).",
      evidence: "blog-pipeline.ts:314 option block (audit §3-ب row 4)",
    },
  },

  "blog:content": {
    id: "blog:content",
    family: "blog",
    langTemplate: { style: "suffix", variants: ["ar", "en"] },
    role: { json: false, streaming: false, language: "both", payloadClass: "heavy" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 6400,
      jsonMode: false, // tolerant extraction instead of strict-mode hard fails
      // GROQ FREE FIT: 8k TPM counts max_tokens — 6400 keeps a 1500-2500-word
      // article (~3000 output tokens) under the ceiling with headroom.
      // R3: maxModels 2→3 — the 480s budget funds a third live entry; the
      // per-entry clamp re-admits groq at ~4.8-4.9k max_tokens.
      timeoutMs: 150_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["BLOG_EXECUTION_WORD_FLOOR 1000 (P2 rejection net)", "P5 battery later"],
    metering: { scope: "blog:content-{lang}" },
    entry: { surface: "gha-workflow", trigger: "pipeline P2 content generation" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS", "GROQ_MAX_TOKENS_CLAMP"],
    doc: {
      since: "2026-08-27 · R3 (2026-09-29) 2→3",
      rationale: "P2 full-article generation — the pipeline's heaviest writing call.",
      evidence: "blog-pipeline.ts:545 option block (audit §3-ب row 5)",
    },
  },

  "blog:review": {
    id: "blog:review",
    family: "blog",
    langTemplate: { style: "suffix", variants: ["ar", "en"] },
    role: { json: false, streaming: false, language: "both", payloadClass: "heavy" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.4,
      maxTokens: 6400,
      jsonMode: false,
      // Review embeds the FULL draft (~10.4–11.1k est) → groq excluded BY
      // DESIGN (R3 audit reservation: clamp falls below the 3800 floor) —
      // openrouter/nvidia only for this call. BLOG-PROVIDER-FAILOVER
      // 2026-10-16: 110s→150s + budget 480s→600s (run 38851515578 — every
      // non-gemini entry aborted at 110s on the ~11.8k-token payload).
      timeoutMs: 150_000,
      maxModels: 4,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["BLOG_EXECUTION_WORD_FLOOR 1000", "length-preservation contract", "P5 battery + R1 repair loop"],
    metering: { scope: "blog:review-{lang}" },
    entry: { surface: "gha-workflow", trigger: "pipeline P4 review/enhance (+ repair directives)" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS", "GROQ_MAX_TOKENS_CLAMP"],
    doc: {
      since: "PHASE 177 (4 models) · 2026-10-16 (150s/600s)",
      rationale: "P4 review — full-draft payload, deep walk 4, real CoT window.",
      evidence: "blog-pipeline.ts:1010 option block (audit §3-ب row 6)",
    },
  },

  "blog:latin-tokens-ar": {
    id: "blog:latin-tokens-ar",
    family: "blog",
    role: { json: true, streaming: false, language: "ar", payloadClass: "light" },
    ladder: [CF_SCOUT_LEAD, ...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.2,
      maxTokens: 1200,
      jsonMode: true,
      timeoutMs: 60_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["isValidArabicTermValue (per value — pure MSA only)", "dictionary pass first (deterministic)"],
    metering: { scope: "blog:latin-tokens-ar" },
    entry: { surface: "gha-workflow", trigger: "P4 localized latin repair (token-only conversion call)" },
    knobs: ["CF_ARM_ENABLED", "LATIN_REPAIR_LEGACY"],
    doc: {
      since: "R2 Execution-Path Audit §9-4 · CF role Phase 5-C",
      rationale: "Token-only {token→arabic} JSON (est <1k tokens ⇒ groq-eligible); a MEASURED CF scout agile role leads.",
      evidence: "blog-pipeline.ts:1364 option block + probe Jaccard 1.0",
    },
  },

  "blog:latin-repair-ar": {
    id: "blog:latin-repair-ar",
    family: "blog",
    role: { json: false, streaming: false, language: "ar", payloadClass: "heavy" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.2,
      maxTokens: 6400,
      jsonMode: false,
      timeoutMs: 110_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["sentinel parsing (LATIN_REPAIR_MAIN/NOTES)", "P4/P5 MSA gates (scanLatinContamination)"],
    metering: { scope: "blog:latin-repair-ar" },
    entry: {
      surface: "gha-workflow",
      trigger: "LEGACY full-article latin repair — reachable ONLY via LATIN_REPAIR_LEGACY=1 (rollback flag)",
    },
    knobs: ["LATIN_REPAIR_LEGACY", "AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "Phase 176 + R2 split (2026-09-29)",
      rationale: "Legacy full-article repair path kept verbatim behind the rollback flag.",
      evidence: "blog-pipeline.ts:1420 option block (audit §3-ب row 8)",
    },
  },

  "blog:topics": {
    id: "blog:topics",
    family: "blog",
    langTemplate: { style: "suffix", variants: ["ar", "en"] },
    role: { json: true, streaming: false, language: "both", payloadClass: "light" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.85,
      maxTokens: 800, // (was 600) Groq json_validate_failed truncation 2026-08-28
      jsonMode: true,
      timeoutMs: 22_000,
      maxModels: 2, // Vercel Hobby budget
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["topic shape check + deterministic fallback list"],
    metering: { scope: "blog:topics-{lang}" },
    entry: { surface: "vercel-sync", trigger: "smart topic suggestions (auto + manual editor)" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "topic-suggest frames",
      rationale: "Light JSON topic list; Vercel 52s clamp (22s × 2).",
      evidence: "blog-topics.ts:657 option block (audit §3-ب row 9)",
    },
  },

  /* ═══════════════ FAMILY: tools (ai_jobs article tools) ═══════════════ */

  "ai-job:article-generate": {
    id: "ai-job:article-generate",
    family: "tools",
    role: { json: true, streaming: false, language: "both", payloadClass: "heavy" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      // GROQ ELIGIBILITY LAW: 6000 keeps est ≈ 6975 < 7200 → still
      // groq-eligible while covering the 1100-1400-word contract.
      maxTokens: 6000,
      jsonMode: true,
      // PHASE 161.4: 120s × 4 = exactly the 480s workflow budget — per-model
      // time in the proven full-article class.
      timeoutMs: 120_000,
      maxModels: 4,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: [
      "coach/editor JOB_GATE",
      "single-shot DRAFT spec (1100-1400 words) — NEVER auto-published",
      "SEO-SLUG + IMAGE BUNDLE law (enrichment never fails the article)",
      "manual publish battery at editor publish (phase5-D)",
    ],
    metering: { scope: "ai-job:article-generate" },
    entry: {
      surface: "ai_jobs",
      trigger: "manual draft request → pipeline dispatch FIRST (Phase 162 twin); this single-shot engine is the FALLBACK when dispatch fails",
    },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "2026-08-28e · PHASE 161.4 (120s×4) · Phase 162 (pipeline-first)",
      rationale: "Fallback single-call draft generator — rides the SAME editorial-law blocks (no-fork canary) with the draft word contract.",
      evidence: "ai-job-processors.ts:1181 option block (audit §3-ب row 10)",
    },
  },

  // ── The ten editor article tools (ai-job-processors.ts:584) ──
  // HEAVY = {timeoutMs:120s, maxModels:3} for JSON tools;
  // LIGHT = {timeoutMs:70s, maxModels:2} for free-text tools (PHASE 177).

  "ai-job:paraphrase": {
    id: "ai-job:paraphrase",
    family: "tools",
    role: { json: false, streaming: false, language: "both", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: false,
      timeoutMs: 70_000,
      maxModels: 2,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["sentinel split (===CORRECTED===/===NOTES===)"],
    metering: { scope: "ai-job:paraphrase" },
    entry: { surface: "ai_jobs", trigger: "editor paraphrase button → ai_jobs(article_tool) → runner" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "owner directive #3 (editor tools)",
      rationale: "LIGHT free-text rephrase (sentinel output, no JSON).",
      evidence: "ai-job-processors.ts:584 LIGHT branch (audit §3-ب rows 11-20)",
    },
  },

  "ai-job:summarize_bullets": {
    id: "ai-job:summarize_bullets",
    family: "tools",
    role: { json: false, streaming: false, language: "both", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 1400,
      jsonMode: false,
      timeoutMs: 70_000,
      maxModels: 2,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["sentinel split"],
    metering: { scope: "ai-job:summarize_bullets" },
    entry: { surface: "ai_jobs", trigger: "editor summarize button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "owner directive #3",
      rationale: "LIGHT bullets summary — capped 1400 tokens.",
      evidence: "ai-job-processors.ts:584 (maxTokens branch: summarize_bullets→1400)",
    },
  },

  "ai-job:proofread": {
    id: "ai-job:proofread",
    family: "tools",
    role: { json: false, streaming: false, language: "both", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.3, // faithful correction
      maxTokens: 4000,
      jsonMode: false,
      timeoutMs: 70_000,
      maxModels: 2,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["sentinel split"],
    metering: { scope: "ai-job:proofread" },
    entry: { surface: "ai_jobs", trigger: "editor proofread button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "owner directive #3",
      rationale: "LIGHT proofread — low temperature for fidelity.",
      evidence: "ai-job-processors.ts:584 (temperature branch: proofread→0.3)",
    },
  },

  "ai-job:seo_pack": {
    id: "ai-job:seo_pack",
    family: "tools",
    role: { json: true, streaming: false, language: "both", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 1600,
      jsonMode: true,
      timeoutMs: 120_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["parseJSON (meta_description required)"],
    metering: { scope: "ai-job:seo_pack" },
    entry: { surface: "ai_jobs", trigger: "editor SEO pack button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "owner directive #3",
      rationale: "HEAVY JSON tool — full SEO pack (meta + LSI + title variants + subheadings), 1600 tokens.",
      evidence: "ai-job-processors.ts:578-593 HEAVY/needsJson branch",
    },
  },

  "ai-job:subheadings": {
    id: "ai-job:subheadings",
    family: "tools",
    role: { json: false, streaming: false, language: "both", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: false,
      timeoutMs: 70_000,
      maxModels: 2,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["sentinel split"],
    metering: { scope: "ai-job:subheadings" },
    entry: { surface: "ai_jobs", trigger: "editor subheadings button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "owner directive #3",
      rationale: "LIGHT free-text subheading suggestions.",
      evidence: "ai-job-processors.ts:584 LIGHT branch",
    },
  },

  "ai-job:seo_title": {
    id: "ai-job:seo_title",
    family: "tools",
    role: { json: true, streaming: false, language: "both", payloadClass: "light" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: true,
      timeoutMs: 120_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["parseJSON (title_variants[0] fallback net)"],
    metering: { scope: "ai-job:seo_title" },
    entry: { surface: "ai_jobs", trigger: "editor SEO title button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "legacy editor tools (kept working through the queue)",
      rationale: "HEAVY JSON tool — title variants.",
      evidence: "ai-job-processors.ts:578-593 HEAVY/needsJson branch",
    },
  },

  "ai-job:meta_desc": {
    id: "ai-job:meta_desc",
    family: "tools",
    role: { json: true, streaming: false, language: "both", payloadClass: "light" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: true,
      timeoutMs: 120_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["parseJSON (meta_description) · ≤300 chars"],
    metering: { scope: "ai-job:meta_desc" },
    entry: { surface: "ai_jobs", trigger: "editor meta description button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "legacy editor tools",
      rationale: "HEAVY JSON tool — meta description.",
      evidence: "ai-job-processors.ts:578-593 HEAVY/needsJson branch",
    },
  },

  "ai-job:faq": {
    id: "ai-job:faq",
    family: "tools",
    role: { json: true, streaming: false, language: "both", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: true,
      timeoutMs: 120_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["parseJSON (faq[].question/answer, ≤6)"],
    metering: { scope: "ai-job:faq" },
    entry: { surface: "ai_jobs", trigger: "editor FAQ button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "legacy editor tools",
      rationale: "HEAVY JSON tool — article-specific FAQ pairs.",
      evidence: "ai-job-processors.ts:578-593 HEAVY/needsJson branch",
    },
  },

  "ai-job:cta": {
    id: "ai-job:cta",
    family: "tools",
    role: { json: false, streaming: false, language: "both", payloadClass: "light" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: false,
      timeoutMs: 70_000,
      maxModels: 2,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["sentinel split · REAL-products-only rule (no 'book a session')"],
    metering: { scope: "ai-job:cta" },
    entry: { surface: "ai_jobs", trigger: "editor CTA button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "owner directive #3",
      rationale: "LIGHT free-text CTA — references only Alkemos's REAL products.",
      evidence: "ai-job-processors.ts:584 LIGHT branch",
    },
  },

  "ai-job:image_prompt": {
    id: "ai-job:image_prompt",
    family: "tools",
    role: { json: false, streaming: false, language: "en", payloadClass: "light" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: false,
      timeoutMs: 70_000,
      maxModels: 2,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["PHASE 173 image-safety law (never women/girls; adult men or non-human only)"],
    metering: { scope: "ai-job:image_prompt" },
    entry: { surface: "ai_jobs", trigger: "editor image-prompt button" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "owner directive #3",
      rationale: "LIGHT free-text EN image prompt (cover-directing, safety-law bound).",
      evidence: "ai-job-processors.ts:584 LIGHT branch",
    },
  },

  /* ═══════════════════ FAMILY: social ═══════════════════ */

  "social-posts": {
    id: "social-posts",
    family: "social",
    langTemplate: { style: "colon", variants: ["ar", "en"] },
    role: { json: true, streaming: false, language: "both", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.75,
      // platform-conditional: linkedin 2600 · everything else 2200 (declared
      // payload-contract override — routing policy stays registry-owned).
      maxTokens: 2200,
      jsonMode: true,
      timeoutMs: 70_000,
      maxModels: 3,
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["field-shape check per platform"],
    metering: { scope: "social-posts:{lang}" },
    entry: { surface: "ai_jobs", trigger: "coach social-post request → ai_jobs(social_post) → runner" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "social-post frames",
      rationale: "Marketing JSON (platform-conditional token budget: linkedin 2600).",
      evidence: "social-posts.ts:165 option block (audit §3-ب row 21)",
    },
  },

  /* ═══════════════════ FAMILY: demo (visitor surfaces) ═══════════════════ */

  "meal-demo": {
    id: "meal-demo",
    family: "demo",
    role: { json: true, streaming: false, language: "en", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.4,
      maxTokens: 3000,
      jsonMode: true,
      // TWO attempts (first + retry) must fit the 60s function budget.
      timeoutMs: 20_000,
      // maxModels intentionally absent at the call site → engine default 2.
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["parseDemoPlanText + ±20% calorie deviation (honest 422)", "guest burst pool 2/month (success-only)"],
    metering: { scope: "meal-demo" },
    entry: { surface: "vercel-sync", trigger: "visitor /ai-meal-planner demo (no signup)" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "demo surfaces (EVO interactive pattern)",
      rationale: "Synchronous visitor demo — one call + one bounded JSON-shape retry, both inside the request.",
      evidence: "meal-plan-demo/route.ts:138-147 callOpts (audit §3-ب row 29)",
    },
  },

  "workout-demo": {
    id: "workout-demo",
    family: "demo",
    role: { json: true, streaming: false, language: "en", payloadClass: "medium" },
    ladder: [...ROTATED_LEADS, GEMINI_TAIL],
    policy: {
      temperature: 0.4,
      maxTokens: 3000,
      jsonMode: true,
      timeoutMs: 20_000,
      // maxModels intentionally absent → engine default 2.
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["parseWorkoutPlanText + shape check", "guest burst pool 2/month (success-only)"],
    metering: { scope: "workout-demo" },
    entry: { surface: "vercel-sync", trigger: "visitor /ai-workout-planner demo (no signup)" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "demo surfaces (EVO interactive pattern)",
      rationale: "Synchronous visitor demo — same pattern as meal-demo.",
      evidence: "workout-plan-demo/route.ts:143-151 callOpts (audit §3-ب row 30)",
    },
  },

  /* ═══════════════════ FAMILY: evo (fast chain) ═══════════════════ */

  "evo-chat": {
    id: "evo-chat",
    family: "evo",
    role: { json: false, streaming: true, language: "both", payloadClass: "light" },
    ladder: FAST_CHAIN_LADDER,
    policy: {
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 16_000,
      maxModels: 3,
      chain: "fast", // speed law — never rotates; CF excluded STRUCTURALLY (streaming)
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["crisis shield", "daily quota (member 10/day · anon salted-hash)", "intent regex → pool gate", "evo_call_stats ledger"],
    metering: { scope: "evo-chat" },
    entry: { surface: "vercel-stream", trigger: "POST /api/ai/chat (SSE) — the ONLY EVO surface" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "Phase 89 (true token streaming)",
      rationale: "Interactive SSE chat — fast chain, streaming fallback contract (mid-stream failure aborts honestly, never splices).",
      evidence: "chat/route.ts:653 option block (audit §3-ب row 31)",
    },
  },

  "evo-memory": {
    id: "evo-memory",
    family: "evo",
    role: { json: false, streaming: false, language: "both", payloadClass: "light" },
    ladder: FAST_CHAIN_LADDER,
    policy: {
      temperature: 0.2,
      maxTokens: 400,
      timeoutMs: 12_000,
      maxModels: 2,
      chain: "fast",
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["validateMemoryFacts (≤5 facts ×300 chars, dedup vs active)"],
    metering: { scope: "evo-memory" },
    entry: { surface: "vercel-sync", trigger: "chat route post-turn memory extraction" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "EVO memory frames",
      rationale: "Cheap fact-extraction call after turns (low temperature).",
      evidence: "chat/route.ts:954 option block (audit §3-ب row 32)",
    },
  },

  "evo-eval": {
    id: "evo-eval",
    family: "evo",
    role: { json: false, streaming: false, language: "both", payloadClass: "light" },
    ladder: FAST_CHAIN_LADDER,
    policy: {
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20_000,
      maxModels: 3,
      chain: "fast",
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["EVAL FIDELITY law (rides the production mechanism)", "judge + code-computed boolean facts"],
    metering: { scope: "evo-eval" },
    entry: { surface: "gha-workflow", trigger: "evo-weekly-eval.yml (Thu 21:00 UTC) — 10 reference questions" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "EVO-5 eval frames",
      rationale: "Weekly eval answer — SAME selection mechanism as production (never a separate key).",
      evidence: "evo-eval-runner.ts:90 option block (audit §3-ب row 33)",
    },
  },

  "evo-eval-judge": {
    id: "evo-eval-judge",
    family: "evo",
    role: { json: false, streaming: false, language: "both", payloadClass: "light" },
    ladder: FAST_CHAIN_LADDER,
    policy: {
      temperature: 0,
      maxTokens: 300,
      timeoutMs: 15_000,
      maxModels: 2,
      chain: "fast",
      budgetEnv: "AI_CHAIN_TOTAL_BUDGET_MS",
    },
    gates: ["parseEvalVerdict + deterministic safety/language axes"],
    metering: { scope: "evo-eval-judge" },
    entry: { surface: "gha-workflow", trigger: "evo-weekly-eval.yml judge step (cheap grader)" },
    knobs: ["AI_CHAIN_TOTAL_BUDGET_MS"],
    doc: {
      since: "EVO-5 eval frames",
      rationale: "Cheap strict grader (temperature 0).",
      evidence: "evo-eval-runner.ts:119 option block (audit §3-ب row 34)",
    },
  },
};

/* ─────────────────────── Lookup helpers ─────────────────────── */

export interface ResolvedRegistrySpec {
  /** The concrete tag the engine was called with (language-expanded when
   *  a template matched, the literal id otherwise). */
  effectiveId: string;
  spec: AIFunctionSpec;
}

/** Resolve a registry spec by the LIVE tag — handles language-template
 *  expansion ("blog:pick-topic-ar" → the "blog:pick-topic" template spec)
 *  before the exact-id lookup. Returns null for unknown ids. */
export function resolveRegistrySpec(id: string): ResolvedRegistrySpec | null {
  const direct = AI_FUNCTION_REGISTRY[id];
  if (direct) return { effectiveId: id, spec: direct };
  if (id.length > 3) {
    for (const sep of ["-", ":"]) {
      const idx = id.lastIndexOf(sep);
      if (idx <= 0 || idx === id.length - 1) continue;
      const stem = id.slice(0, idx);
      const variant = id.slice(idx + 1);
      const tpl = AI_FUNCTION_REGISTRY[stem];
      if (
        tpl?.langTemplate &&
        tpl.langTemplate.style === (sep === "-" ? "suffix" : "colon") &&
        (tpl.langTemplate.variants as readonly string[]).includes(variant)
      ) {
        return { effectiveId: id, spec: tpl };
      }
    }
  }
  return null;
}

/** All registered base ids (templates listed once). */
export function listRegistryIds(): string[] {
  return Object.keys(AI_FUNCTION_REGISTRY);
}

/* ─────────────── Future-function registration (design §6-ج) ───────────────
 * registerFunction() is the ONE-STEP graph path for a NEW AI function:
 * register here + processor/gates at its surface — ZERO engine edits, ZERO
 * independent chain (the function inherits its family's ladder shape). */

/** Validation errors thrown by assertValidRegistration (unit-pinned). */
export function assertValidRegistration(spec: AIFunctionSpec): void {
  if (!spec || typeof spec.id !== "string" || !spec.id.trim()) {
    throw new Error("[ai-registry] registerFunction: spec.id is required");
  }
  if (spec.id !== spec.id.trim() || /\s/.test(spec.id)) {
    throw new Error(`[ai-registry] registerFunction: id must be trimmed and whitespace-free ("${spec.id}")`);
  }
  const KNOWN_FAMILIES: AIFunctionFamily[] = ["plans", "blog", "evo", "social", "demo", "tools"];
  if (!KNOWN_FAMILIES.includes(spec.family)) {
    throw new Error(`[ai-registry] registerFunction: unknown family "${String(spec.family)}"`);
  }
  if (!Array.isArray(spec.ladder) || spec.ladder.length === 0) {
    throw new Error(`[ai-registry] registerFunction: "${spec.id}" needs at least one ladder entry`);
  }
  // OWNER LAW — no entry without evidence (a new slot must name its probe).
  for (const entry of spec.ladder) {
    if (!entry?.evidence?.source || !entry.evidence.source.trim()) {
      throw new Error(
        `[ai-registry] registerFunction: "${spec.id}" ladder entry ${entry.provider}/${entry.model} carries no evidence.source — the no-model-without-evidence law`,
      );
    }
    if (entry.evidence.status === "wave-2-pending" && entry.role === "fixed-lead") {
      throw new Error(
        `[ai-registry] registerFunction: "${spec.id}" cannot pin a fixed-lead on a wave-2-pending entry — a role probe must measure it first`,
      );
    }
  }
  // STREAMING EXCLUDES CLOUDFLARE — structural law (no streaming in JSON
  // mode on CF; EVO excluded by construction).
  if (spec.role.streaming && spec.ladder.some((e) => e.provider === "cloudflare")) {
    throw new Error(
      `[ai-registry] registerFunction: "${spec.id}" is streaming but its ladder contains cloudflare — structurally excluded`,
    );
  }
  // A streaming function must ride the fast chain (the strongest chain's
  // deep walks are incompatible with interactive TTFT budgets).
  if (spec.role.streaming && spec.policy.chain && spec.policy.chain !== "fast") {
    throw new Error(`[ai-registry] registerFunction: "${spec.id}" is streaming but rides chain "${spec.policy.chain}"`);
  }
  if (spec.grounding && !spec.grounding.armsAr?.length && !spec.grounding.armsEn?.length) {
    throw new Error(`[ai-registry] registerFunction: "${spec.id}" declares grounding with no arms`);
  }
}

/** Register a NEW function at runtime (in-memory — production specs are
 *  code-reviewed constants; this path serves the owner-mandated one-step
 *  registration flow for future functions). Idempotent overwrite is
 *  rejected unless `allowOverwrite` is explicitly true (deliberate). */
export function registerFunction(spec: AIFunctionSpec, allowOverwrite = false): void {
  assertValidRegistration(spec);
  if (!allowOverwrite && AI_FUNCTION_REGISTRY[spec.id]) {
    throw new Error(
      `[ai-registry] registerFunction: "${spec.id}" is already registered — pass allowOverwrite=true for a deliberate replacement`,
    );
  }
  AI_FUNCTION_REGISTRY[spec.id] = spec;
}
