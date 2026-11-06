import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  callGroundedSearch,
  callAI,
  callAIStream,
  groundedArmOrder,
  __resetChainRotationForTests,
} from "@/lib/ai-provider";
import { dispatchAI, dispatchGrounded } from "@/lib/ai-router";
import { AI_FUNCTION_REGISTRY } from "@/lib/ai-registry";
import { __resetCooldownForTests } from "@/lib/ai-provider-cooldown";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";

/**
 * AI-SEARCH-UNIFICATION canaries (frame 443 — owner order 2026-11-06
 * «استكمال توحيد منظومة الذكاء الاصطناعي», items 1+2+3).
 *
 * WHAT THIS FILE PROVES — not data theory, ACTUAL EXECUTION:
 *
 *   A. The grounded arm ladder is REGISTRY-OWNED: mutating
 *      AI_FUNCTION_REGISTRY["blog:research"].grounding.arms{Ar,En} changes
 *      WHICH PROVIDER ENDPOINT THE WALK ACTUALLY CALLS FIRST (asserted on
 *      the fetch log — network execution, not the resolved array), both on
 *      the direct engine path (callGroundedSearch) and the router path
 *      (dispatchGrounded, which passes the policy to the engine).
 *   B. The deploy-free emergency handles still WIN over the registry in
 *      execution: GROUNDED_ARM_ORDER overrides the whole walk;
 *      GEMINI_GROUNDED_ENABLED=0 drops the dormant arm even when the
 *      registry lists it.
 *   C. AI_ROUTER_MODE=legacy serves the FROZEN pre-unification ladder —
 *      a mutated registry does NOT change the legacy walk (the T8
 *      rollback key for the search path).
 *   D. The plan-ai-probe root cause is fixed at the engine level: a
 *      reasoning model that burns its completion budget on CoT
 *      (content:"" + reasoning + finish_reason=length — the exact
 *      live-measured groq gpt-oss shape from probe runs
 *      40105018071→41203608645) is an HONEST FAILURE that falls to the
 *      next ladder entry instead of masquerading as a "succeeded" chain
 *      answer the quality gate must then reject («no meals array») while
 *      nvidia/gemini starve. finish_reason=stop keeps the legitimate
 *      reasoning-channel answer path byte-identical.
 *   E. Structural pins: the router passes the policy (armOrder) and the
 *      engine imports the registry — the single-source law, guarded.
 */

const ENV_KEYS = [
  "GEMINI_API_KEY",
  "GEMINI_GROUNDED_ENABLED",
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NVIDIA_API_KEY",
  "TAVILY_API_KEY",
  "EXA_API_KEY",
  "GROUNDED_ARM_ORDER",
  "AI_ROUTER_MODE",
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
  stateFile = join(mkdtempSync(join(tmpdir(), "su-")), "cooldown.json");
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

/* ── Fixtures (the live-measured shapes from the failover battery) ── */

const TAVILY_SEARCH_OK = {
  results: [
    {
      title: "Protein intake for muscle building",
      url: "https://www.nasm.org/protein-intake",
      content: "NASM guidance on daily protein intake for muscle building.",
      raw_content: "",
      score: 0.97,
    },
  ],
};

const EXA_SEARCH_OK = {
  results: [
    {
      title: "ISSN Position Stand: protein and exercise",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      text: "Protein intake of 1.6-2.2 g/kg body weight supports muscle hypertrophy.",
      publishedDate: "2025-11-06",
      author: "ISSN",
    },
  ],
};

const GROQ_BROWSER_OK = {
  choices: [
    {
      message: {
        content: "Answer grounded on the browser_search live web walk.",
        executed_tools: [
          {
            name: "browser.search",
            index: 0,
            type: "browser_search",
            search_results: {
              results: [
                { title: "Physical activity", url: "https://www.nasm.org/protein-intake", content: "", score: 0 },
              ],
            },
          },
        ],
      },
    },
  ],
};

const CHAIN_RESEARCH_JSON = {
  choices: [
    {
      message: {
        content:
          '{"keywords":[{"keyword":"how much protein per day","searchVolume":"high"}],"faqs":[],"topics":["How much protein do you really need per day"]}',
      },
    },
  ],
};

/** Exa /contents success — the Phase-3 WINNING shape {ids, text:{maxCharacters}}
 *  (the §6-أ deepening extractor — distinct from the /search ARM). */
const EXA_CONTENTS_OK = {
  results: [
    {
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      text: "FULL PAGE TEXT: 1.6-2.2 g/kg daily protein for hypertrophy.",
    },
  ],
};

/** Tavily /extract success — the documented ALTERNATIVE deepening extractor. */
const TAVILY_EXTRACT_OK = {
  results: [
    {
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      raw_content: "EXTRACTED VIA TAVILY: 1.6-2.2 g/kg daily protein.",
    },
  ],
};

const EXA_CREDITS_429 = { detail: "Usage limit reached. Monthly free credits exhausted." };

/** The EXACT live-measured truncation shape from the failing probe runs:
 *  a CoT reasoning model under the R3 TPM clamp burns its whole
 *  max_tokens budget on reasoning — content comes back EMPTY and
 *  finish_reason=length, with the partial chain-of-thought in `reasoning`. */
const GROQ_REASONING_TRUNCATED = {
  choices: [
    {
      finish_reason: "length",
      message: {
        content: "",
        reasoning:
          "let me think about the keto plan. the client needs 1800 kcal, 3 meals, allergic to nuts. first I should compute the macro split... 5% carbs is 25g, fat around 150g, protein around",
      },
    },
  ],
};

/** The legitimate reasoning-channel answer: the model COMPLETED
 *  (finish_reason=stop) and its whole answer lives in `reasoning`. */
const GROQ_REASONING_STOP_OK = {
  choices: [
    {
      finish_reason: "stop",
      message: {
        content: "",
        reasoning: '{"meals":[{"name":"breakfast","items":[{"food":"eggs","amount":"3","calories":210}]}]}',
      },
    },
  ],
};

const NVIDIA_OK = {
  choices: [{ finish_reason: "stop", message: { content: "PONG-FROM-NVIDIA" } }],
};

type FetchLog = { url: string };
type RouteResult = { ok: boolean; status: number; payload: unknown };
type Route = (url: string) => RouteResult;

function stubRoutingFetch(log: FetchLog[], route: Route) {
  const fake = vi.fn(async (url: string) => {
    log.push({ url: String(url) });
    const r = route(String(url));
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.payload,
      text: async () => JSON.stringify(r.payload),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fake);
}

const tavilyUrl = (u: string) => u.includes("api.tavily.com");
const exaUrl = (u: string) => u.includes("api.exa.ai");
const groqUrl = (u: string) => u.includes("api.groq.com");
const nvidiaUrl = (u: string) => u.includes("integrate.api.nvidia.com");
const geminiUrl = (u: string) => u.includes("generativelanguage.googleapis.com");
// The ARM endpoints (the walk) — distinct from the §6-أ deepening
// endpoints (/contents · /extract ride ALONGSIDE whichever arm leads).
const tavilySearchUrl = (u: string) => u.includes("api.tavily.com/search");
const exaSearchUrl = (u: string) => u.includes("api.exa.ai/search");

/** Route every search arm AND the §6-أ deepening endpoints to SUCCESS so
 *  the FIRST registry arm answers and the walk stops — the fetch log then
 *  proves which arm EXECUTED first. */
function routeAllArmsHealthy(url: string): RouteResult {
  if (url.includes("api.tavily.com/search")) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
  if (url.includes("api.tavily.com/extract")) return { ok: true, status: 200, payload: TAVILY_EXTRACT_OK };
  if (url.includes("api.exa.ai/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
  if (url.includes("api.exa.ai/contents")) return { ok: true, status: 200, payload: EXA_CONTENTS_OK };
  if (groqUrl(url)) return { ok: true, status: 200, payload: GROQ_BROWSER_OK };
  // the synthesis chain call of whichever search arm leads
  return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
}

/** In-memory registry mutation with guaranteed restore (the registry is
 *  live module state — every mutation is paired with a finally-restore). */
function registryGrounding() {
  const g = AI_FUNCTION_REGISTRY["blog:research"]?.grounding;
  if (!g) throw new Error("test setup: blog:research grounding spec missing");
  return g;
}

/* ══════════════════════════════════════════════════════════════════════
 * A. THE REGISTRY OWNS THE WALK — execution proofs (fetch-log asserted)
 * ══════════════════════════════════════════════════════════════════════ */

describe("frame 443 — the grounded arm ladder executes the REGISTRY order", () => {
  it("baseline EN walk (default registry): Exa is called FIRST — the §6-أ FINAL state stays byte-identical", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, routeAllArmsHealthy);

    const out = await callGroundedSearch("research", { tag: "blog:research", lang: "en", searchQuery: "protein intake" });

    expect(out.provider).toBe("exa");
    expect(exaSearchUrl(log[0].url)).toBe(true);
    expect(tavilySearchUrl(log[0].url)).toBe(false);
  });

  it("baseline AR walk (default registry): Tavily is called FIRST (Arabic relevance lead)", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, routeAllArmsHealthy);

    const out = await callGroundedSearch("research", { tag: "blog:research", lang: "ar", searchQuery: "كم بروتين يوميًا" });

    expect(out.provider).toBe("tavily");
    expect(tavilySearchUrl(log[0].url)).toBe(true);
  });

  it("CORE PROOF (engine path): mutating the registry's EN order changes ACTUAL EXECUTION — the walk calls Tavily first, not Exa", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const g = registryGrounding();
    const saved = g.armsEn;
    g.armsEn = ["tavily", "exa", "groq", "gemini"];
    const log: FetchLog[] = [];
    stubRoutingFetch(log, routeAllArmsHealthy);
    try {
      const out = await callGroundedSearch("research", { tag: "blog:research", lang: "en", searchQuery: "protein intake" });
      expect(out.provider).toBe("tavily");
      expect(tavilySearchUrl(log[0].url)).toBe(true);
      expect(log.some((c) => exaSearchUrl(c.url))).toBe(false); // Exa's ARM demoted — its /search endpoint never reached
    } finally {
      g.armsEn = saved;
    }
    // restored: the default order is back
    expect(groundedArmOrder("en")).toEqual(["exa", "tavily", "groq", "gemini"]);
  });

  it("CORE PROOF (router path): mutating the registry changes dispatchGrounded's ACTUAL EXECUTION too — the router passes the policy, the engine walks it", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const g = registryGrounding();
    const saved = g.armsEn;
    g.armsEn = ["groq", "tavily", "exa", "gemini"];
    const log: FetchLog[] = [];
    stubRoutingFetch(log, routeAllArmsHealthy);
    try {
      const out = await dispatchGrounded("blog:research", "research brief", {
        lang: "en",
        searchQuery: "protein intake",
      });
      expect(out.provider).toBe("groq");
      expect(groqUrl(log[0].url)).toBe(true);
      expect(log.some((c) => exaSearchUrl(c.url))).toBe(false);
      expect(log.some((c) => tavilySearchUrl(c.url))).toBe(false);
    } finally {
      g.armsEn = saved;
    }
  });

  it("CORE PROOF (AR, engine path): mutating armsAr re-orders the Arabic walk's first call", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const g = registryGrounding();
    const saved = g.armsAr;
    g.armsAr = ["exa", "tavily", "groq", "gemini"];
    const log: FetchLog[] = [];
    stubRoutingFetch(log, routeAllArmsHealthy);
    try {
      const out = await callGroundedSearch("research", { tag: "blog:research", lang: "ar", searchQuery: "كم بروتين يوميًا" });
      expect(out.provider).toBe("exa");
      expect(exaSearchUrl(log[0].url)).toBe(true);
    } finally {
      g.armsAr = saved;
    }
  });

  it("a registry order WITHOUT gemini rides WITHOUT gemini — the engine appends nothing (the registry is the whole ladder)", async () => {
    const g = registryGrounding();
    const saved = g.armsEn;
    g.armsEn = ["tavily", "groq"];
    try {
      expect(groundedArmOrder("en")).toEqual(["tavily", "groq"]);
      expect(groundedArmOrder()).toEqual(["tavily", "groq"]); // lang-less default = EN
    } finally {
      g.armsEn = saved;
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * B. THE DEPLOY-FREE HANDLES STILL WIN (execution, not resolution)
 * ══════════════════════════════════════════════════════════════════════ */

describe("frame 443 — the emergency handles keep winning over the registry", () => {
  it("GROUNDED_ARM_ORDER overrides the registry in EXECUTION: a mutated registry pointing at Exa still walks the override's Tavily first", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.GROUNDED_ARM_ORDER = "tavily";
    const g = registryGrounding();
    const saved = g.armsEn;
    g.armsEn = ["exa", "groq", "tavily", "gemini"];
    const log: FetchLog[] = [];
    stubRoutingFetch(log, routeAllArmsHealthy);
    try {
      const out = await callGroundedSearch("research", { tag: "blog:research", lang: "en", searchQuery: "protein intake" });
      expect(out.provider).toBe("tavily");
      expect(tavilySearchUrl(log[0].url)).toBe(true);
      expect(log.some((c) => exaSearchUrl(c.url))).toBe(false); // the registry pointed Exa FIRST — the override won in EXECUTION
    } finally {
      g.armsEn = saved;
    }
  });

  it("GEMINI_GROUNDED_ENABLED=0 drops the dormant gemini arm even though the registry lists it FIRST — gemini is NEVER called and the next registry arm executes", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_GROUNDED_ENABLED = "0";
    const g = registryGrounding();
    const saved = g.armsEn;
    // gemini rides FIRST in the mutated registry order — the kill-switch
    // must still drop it (execution proof: gemini's endpoint never appears,
    // the NEXT registry arm leads the actual walk).
    g.armsEn = ["gemini", "tavily", "exa", "groq"];
    const log: FetchLog[] = [];
    stubRoutingFetch(log, routeAllArmsHealthy);
    try {
      const out = await callGroundedSearch("research", { tag: "blog:research", lang: "en", searchQuery: "protein intake" });
      expect(out.provider).toBe("tavily");
      expect(tavilySearchUrl(log[0].url)).toBe(true);
      expect(log.some((c) => geminiUrl(c.url))).toBe(false); // the kill-switch held in EXECUTION
    } finally {
      g.armsEn = saved;
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * C. LEGACY MODE = THE FROZEN PRE-UNIFICATION LADDER (T8 rollback key)
 * ══════════════════════════════════════════════════════════════════════ */

describe("frame 443 — AI_ROUTER_MODE=legacy serves the frozen ladder", () => {
  it("a MUTATED registry does NOT change the legacy walk: dispatchGrounded(legacy, en) still calls Exa first — the pre-unification order, verbatim", async () => {
    process.env.AI_ROUTER_MODE = "legacy";
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const g = registryGrounding();
    const saved = g.armsEn;
    g.armsEn = ["groq", "tavily", "exa", "gemini"];
    const log: FetchLog[] = [];
    stubRoutingFetch(log, routeAllArmsHealthy);
    try {
      const out = await dispatchGrounded("blog:research", "research brief", {
        lang: "en",
        searchQuery: "protein intake",
      });
      expect(out.provider).toBe("exa"); // the FROZEN order executed, not the mutation
      expect(exaUrl(log[0].url)).toBe(true);
    } finally {
      g.armsEn = saved;
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * D. HONEST-COMPLETION LAW — the plan-ai-probe root cause, fixed
 * ══════════════════════════════════════════════════════════════════════ */

describe("frame 443 — honest-completion law (reasoning truncated before any answer)", () => {
  it("DIRECT: groq 200 with content:\"\" + reasoning + finish_reason=length → the honest truncation error (NOT the CoT as an answer)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    stubRoutingFetch([], () => ({ ok: true, status: 200, payload: GROQ_REASONING_TRUNCATED }));

    const err = (await callAI("generate a keto plan", { tag: "plan:nutrition", maxTokens: 5601 }).catch(
      (e: Error) => e,
    )) as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("finish_reason=length");
    expect(err.message).toContain("honest failure");
  });

  it("PRESERVED: reasoning-channel answers with finish_reason=stop still answer (the legitimate path is byte-identical)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    stubRoutingFetch([], () => ({ ok: true, status: 200, payload: GROQ_REASONING_STOP_OK }));

    const out = await callAI("generate a keto plan", { tag: "plan:nutrition", maxTokens: 5601 });
    expect(out).toContain("breakfast"); // the reasoning-channel JSON came through
  });

  it("PRESERVED: non-empty content with finish_reason=length still returns the content (truncated-JSON handling stays with parseJSON + the gates)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    stubRoutingFetch([], () => ({
      ok: true,
      status: 200,
      payload: {
        choices: [
          { finish_reason: "length", message: { content: '{"meals":[{"name":"eggs"' } },
        ],
      },
    }));

    const out = await callAI("generate a keto plan", { tag: "plan:nutrition", maxTokens: 5601 });
    expect(out).toBe('{"meals":[{"name":"eggs"');
  });

  it("THE PROBE WALK, REPRODUCED: groq gpt-oss truncates its CoT under the R3 clamp → the chain now FAILS OVER and NVIDIA answers — the mislabeled 'succeeded' CoT can never starve the ladder again", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.NVIDIA_API_KEY = "nvapi-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (groqUrl(url)) return { ok: true, status: 200, payload: GROQ_REASONING_TRUNCATED };
      if (nvidiaUrl(url)) return { ok: true, status: 200, payload: NVIDIA_OK };
      return { ok: true, status: 200, payload: NVIDIA_OK };
    });

    // the plan:nutrition dispatch — tag/policy from the registry, the exact
    // probe entry (rotation call #1: the unconfigured openrouter lead is
    // skipped without consuming attempt budget → groq leads the walk).
    const out = await dispatchAI("plan:nutrition", "generate a keto plan at 1800 kcal");

    expect(out.provider).toBe("nvidia"); // the walk REACHED nvidia — pre-fix it died at groq's mislabeled success
    expect(out.text).toBe("PONG-FROM-NVIDIA");
    expect(groqUrl(log[0].url)).toBe(true); // groq was tried first…
    expect(log.some((c) => nvidiaUrl(c.url))).toBe(true); // …and nvidia answered after it
  });

  it("STREAM TWIN: reasoning-only deltas ending with finish_reason=length → honest failure (the user never sees raw CoT)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const sse = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(
          enc.encode(
            sse({ choices: [{ delta: { reasoning: "thinking about the keto macros..." } }] }) +
              sse({ choices: [{ delta: {}, finish_reason: "length" }] }) +
              "data: [DONE]\n\n",
          ),
        );
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      body,
      json: async () => ({}),
      text: async () => "",
    }) as unknown as Response));

    const err = (await callAIStream("chat", { tag: "evo-chat" }).catch((e: Error) => e)) as Error;
    expect(err.message).toContain("finish_reason=length");
    expect(err.message).toContain("honest failure");
  });

  it("STREAM TWIN PRESERVED: reasoning-only deltas with finish_reason=stop still answer", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const sse = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(
          enc.encode(
            sse({ choices: [{ delta: { reasoning: "the answer is 42" } }] }) +
              sse({ choices: [{ delta: {}, finish_reason: "stop" }] }) +
              "data: [DONE]\n\n",
          ),
        );
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      body,
      json: async () => ({}),
      text: async () => "",
    }) as unknown as Response));

    const out = await callAIStream("chat", { tag: "evo-chat" });
    expect(out).toBe("the answer is 42");
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * E. STRUCTURAL PINS — the single-source law, guarded
 * ══════════════════════════════════════════════════════════════════════ */

describe("frame 443 — structural pins (single source, no second copies)", () => {
  it("the ENGINE imports the registry (the arm split has NO engine-side second copy)", () => {
    const src = readFileSync("src/lib/ai-provider.ts", "utf8");
    expect(src).toContain('import { AI_FUNCTION_REGISTRY } from "./ai-registry"');
    // the former independent split is gone — the hardcoded language arrays
    // must never come back (anti-drift law: one algorithm, zero second copies)
    expect(src).not.toContain('["tavily", "groq", "exa", ...geminiTail]');
    expect(src).not.toContain('["exa", "tavily", "groq", ...geminiTail]');
  });

  it("the ROUTER passes the arm policy to the engine (dispatchGrounded resolves spec.grounding → armOrder)", () => {
    const src = readFileSync("src/lib/ai-router.ts", "utf8");
    expect(src).toContain("spec.grounding");
    expect(src).toContain("armOrder");
    expect(src).toContain("LEGACY_GROUNDED_ARMS");
  });
});
