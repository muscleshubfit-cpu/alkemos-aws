import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  callGroundedSearch,
  callGeminiGroundedSearch,
  callOpenRouterGroundedSearch,
  callGroqGroundedSearch,
  callTavilySearch,
  callExaSearch,
  callFreeAIFallbackChain,
  groundedArmOrder,
  getTavilyKey,
  getExaKey,
  __resetChainRotationForTests,
} from "@/lib/ai-provider";
import {
  __resetCooldownForTests,
  flushCooldownWrites,
  activeCooldowns,
} from "@/lib/ai-provider-cooldown";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * BLOG-PROVIDER-FAILOVER 2026-10-16 — the CROSS-PROVIDER grounded-search
 * failover (owner order «افحص وأصلح آلية التبديل التلقائي بين مزوّدي
 * الذكاء الاصطناعي الحاليين (Gemini / OpenRouter / Groq / NVIDIA) …
 * افحص دعم البحث المُسنَد لدى كل مزوّد، ولا تستبدله بتوليد عادي أو نتائج
 * وهمية»).
 *
 * PHASE 5-A (owner order 2026-10-31 «ابدأ المرحلة الخامسة — المرحلة (أ):
 * تنفيذ ذراع البحث Tavily» + «إلغاء قانون Gemini-First نهائيًا») — the
 * ladder RE-ORDERED per the Phase-4 §6-أ/§12-1 approved design:
 *
 * Pinned here:
 *   • The walk order tavily(search API) → groq(browser_search) →
 *     gemini(googleSearch, DORMANT last arm) — the openrouter web arm is
 *     REMOVED from the effective ladder (dead default model 404 + paid
 *     plugin 402 — P0-2) and NEVER receives a call from the walk; NVIDIA
 *     NEVER receives a grounded call (no capability; honestly excluded).
 *   • The TAVILY ARM contract: a REAL basic search whose result URLs ARE
 *     the evidence (the live-evidence gate — zero usable URLs = honest
 *     failure, law 344) + a research-JSON synthesis on the ordinary
 *     generation chain whose prompt CONTAINS the real URLs (grounding
 *     proof — never model memory alone); the caller's searchQuery rides
 *     the search body (§10-أ «تمرير الاستعلام المناسب»).
 *   • Every arm is a REAL search call and every arm enforces the honest
 *     live-evidence gate — a 200 without citations/annotations/URLs FAILS
 *     and falls through, never masquerades.
 *   • Quota-class failures cool the scope (AI_PROVIDER_COOLDOWN_MS opt-in):
 *     the second call SKIPS the drained arm with zero network calls, and
 *     the chain skips a drained provider WITHOUT consuming attempt budget
 *     (NVIDIA becomes reachable within the same maxModels).
 *   • Cooldown marks survive a process restart via the state file.
 *   • GEMINI_GROUNDED_ENABLED=0 removes the dormant gemini arm without a
 *     deploy (the §6-أ kill-switch).
 *   • The generation chains: the 3-way lead rotation runs on every
 *     strongest-chain call (gemini-first cancelled; gemini rides the
 *     tail slot only — pinned in ai-provider.test.ts).
 */

const ENV_KEYS = [
  "GEMINI_API_KEY",
  "GEMINI_API_KEY2",
  "GEMINI_MODEL",
  "GEMINI_GROUNDED_MODELS",
  "GEMINI_GROUNDED_ENABLED",
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NVIDIA_API_KEY",
  "CLOUDFLARE_AI_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CF_ARM_ENABLED",
  "OPENROUTER_GROUNDED_MODEL",
  "GROQ_GROUNDED_MODEL",
  "GROQ_GROUNDED_MODELS",
  "TAVILY_API_KEY",
  "TAVILY_SEARCH_DEPTH",
  "TAVILY_MAX_RESULTS",
  "TAVILY_INCLUDE_DOMAINS",
  "EXA_API_KEY",
  "EXA_NUM_RESULTS",
  "EXA_CONTENTS_MAX_CHARS",
  "EXA_INCLUDE_DOMAINS",
  "GROUNDED_ARM_ORDER",
  "AI_PROVIDER_COOLDOWN_MS",
  "AI_PROVIDER_COOLDOWN",
  "AI_COOLDOWN_STATE_FILE",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

let stateFile = "";

beforeEach(() => {
  cleanEnv();
  stateFile = join(mkdtempSync(join(tmpdir(), "gf-")), "cooldown.json");
  process.env.AI_COOLDOWN_STATE_FILE = stateFile;
  __resetCooldownForTests({ deleteFile: true });
  // PHASE 5-A: the gemini-first rotation suspension is GONE — reset the
  // rotation counter so every canary starts at a deterministic lead
  // (call #1 → openrouter leads the strongest chain).
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

/* ── Fixtures ─────────────────────────────────────────────────────────── */

const GEMINI_GROUNDED_OK = {
  candidates: [
    {
      content: { parts: [{ text: '{"keywords":[],"faqs":[],"topics":["t"]}' }] },
      groundingMetadata: {
        webSearchQueries: ["how much protein per day"],
        groundingChunks: [{ web: { uri: "https://examine.com/protein", title: "Protein" } }],
      },
    },
  ],
};

const QUOTA_429 = {
  error: { code: 429, message: "You exceeded your current quota", status: "RESOURCE_EXHAUSTED" },
};

const CREDITS_402 = {
  error: { code: 402, message: "Insufficient credits to use the web plugin" },
};

/** The REALISTIC Groq sustained-exhaustion body (the GROQ-2 diagnosis
 *  law): tokens-per-day wording + Limit/Used numbers + hours-scale hint.
 *  BLOG-RECOVERY 2026-10-20 classification law: ONLY this daily class is a
 *  sustained 429 on the groq arm (cools the 30-min registry); hint-less
 *  per-minute variants retry patiently and never cool — the old tests
 *  reused the GEMINI quota body on groq, which the new law correctly
 *  reads as per-minute (no daily markers), so the groq arm's quota
 *  fixtures now carry the REAL Groq daily shape. */
const GROQ_TPD_429 = {
  error: {
    message:
      "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_x` service tier `on_demand` on tokens per day (TPD): Limit 200,000, Used 198,932, Requested 4,000. Please try again in 4h 2m 3s.",
    type: "rate_limit_error",
  },
};

/** Tavily quota/credit exhaustion body (search-arm analog of CREDITS_402 —
 *  the Researcher plan's monthly 1000-credit cap). */
const TAVILY_CREDITS_429 = {
  detail: "Usage limit reached. Not enough credits to complete this request.",
};

/** Tavily /search success — the LIVE-MEASURED Phase-3 shape (run 41075269014):
 *  results[] of {title,url,content,raw_content,score}. */
const TAVILY_SEARCH_OK = {
  results: [
    {
      title: "Protein intake for muscle building",
      url: "https://www.nasm.org/protein-intake",
      content: "NASM guidance on daily protein intake for muscle building.",
      raw_content: "Protein intake of 1.6-2.2 g/kg body weight supports muscle hypertrophy.",
      score: 0.97,
    },
    {
      title: "PubMed — protein supplementation",
      url: "https://pubmed.ncbi.nlm.nih.gov/22150333",
      content: "A meta-analysis of protein supplementation and resistance training.",
      raw_content: "",
      score: 0.91,
    },
  ],
};

/** Exa /search success — the LIVE-MEASURED Phase-3 shape (run 41075269014):
 *  results[] of {url,title,text,publishedDate,author} (score absent in
 *  type:"auto" mode — measured). */
const EXA_SEARCH_OK = {
  results: [
    {
      title: "International Society of Sports Nutrition Position Stand: protein and exercise",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      text: "Protein intake of 1.6-2.2 g/kg body weight supports muscle hypertrophy and recovery.",
      publishedDate: "2025-11-06",
      author: "ISSN",
    },
    {
      title: "Effect of creatine supplementation on kidney function",
      url: "https://pubmed.ncbi.nlm.nih.gov/22150333",
      text: "A systematic review and meta-analysis of creatine safety.",
      publishedDate: "2025-10-02",
      author: "PubMed",
    },
  ],
};

/** Exa /contents success — the Phase-3 WINNING shape {ids, text:{maxCharacters}}
 *  (24/24 pages extracted): results[] of {url,title?,text}. */
const EXA_CONTENTS_OK = {
  results: [
    {
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      text: "FULL PAGE TEXT: The International Society of Sports Nutrition recommends 1.6-2.2 grams of protein per kilogram for building muscle.",
    },
    {
      url: "https://pubmed.ncbi.nlm.nih.gov/22150333",
      text: "FULL PAGE TEXT: Creatine is safe for healthy adults.",
    },
  ],
};

/** Tavily /extract success (the §6-أ ALTERNATIVE extractor): results[] of
 *  {url,raw_content}. */
const TAVILY_EXTRACT_OK = {
  results: [
    {
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      raw_content: "EXTRACTED VIA TAVILY: 1.6-2.2 g/kg daily protein for hypertrophy.",
    },
  ],
};

/** Exa quota/credit exhaustion body (the free $10/month credit drained —
 *  the search-arm analog of TAVILY_CREDITS_429). */
const EXA_CREDITS_429 = {
  detail: "Usage limit reached. Monthly free credits exhausted.",
};

const OR_WEB_OK = {
  choices: [
    {
      message: {
        content: "Based on live search: the recommended intake is 1.6 g/kg.",
        // LIVE-MEASURED shape (run 38844582803): OpenAI-style url_citation
        // annotations — type "url_citation" + the payload nested under
        // `url_citation` (the flat {type:"url", url} shape is legacy).
        annotations: [
          {
            type: "url_citation",
            url_citation: {
              url: "https://examine.com/protein",
              title: "Protein | Examine",
            },
          },
          {
            type: "url_citation",
            url_citation: {
              url: "https://pubmed.ncbi.nlm.nih.gov/22150333",
              title: "PubMed",
            },
          },
        ],
      },
    },
  ],
};

const GROQ_BROWSER_OK = {
  // LIVE-MEASURED shape (probe run 39061588932, GROQ-2 round 2): the
  // browser_search findings live at message.executed_tools[*].
  // search_results.results (title/url/content/score) — the tool's REAL
  // live-web findings (browser.search + page reads).
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
                { title: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/22150333", content: "", score: 0 },
              ],
            },
          },
        ],
      },
    },
  ],
};

const GROQ_BROWSER_OK_CITED = {
  // legacy documented location #1 — message.citations (still accepted)
  choices: [
    {
      message: {
        content: "Legacy citations shape still accepted.",
        citations: [
          "https://www.nasm.org/protein-intake",
          "https://pubmed.ncbi.nlm.nih.gov/22150333",
        ],
      },
    },
  ],
};

const GROQ_BROWSER_OK_XGROQ = {
  choices: [{ message: { content: "Answer with citations in x_groq." } }],
  x_groq: {
    citations: [{ url: "https://www.issn.org/position-stand", title: "ISSN" }],
  },
};

const CHAIN_PONG = { choices: [{ message: { content: "PONG" } }] };

/** A synthesis-chain answer shaped like the P0 research JSON (what the
 *  tavily arm's chain call actually returns in production). */
const CHAIN_RESEARCH_JSON = {
  choices: [
    {
      message: {
        content:
          '{"keywords":[{"keyword":"how much protein per day","searchVolume":"high"}],"faqs":[],"topics":["How much protein do you really need per day to build muscle"]}',
      },
    },
  ],
};

type FetchLog = { url: string; auth?: string; body?: Record<string, unknown> };

type RouteResult = { ok: boolean; status: number; payload: unknown };
type Route = (url: string, auth: string) => RouteResult;

/** Route by URL + auth headers; records every call (url, auth, body). */
function stubRoutingFetch(log: FetchLog[], route: Route) {
  const fake = vi.fn(async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const auth =
      headers.get("x-goog-api-key") ||
      headers.get("x-api-key") ||
      headers.get("authorization") ||
      "";
    log.push({ url, auth, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    const r = route(String(url), auth);
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.payload,
      text: async () => JSON.stringify(r.payload),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fake);
}

function geminiKeyOk(url: string): boolean {
  return url.includes("generativelanguage.googleapis.com");
}
function orUrl(url: string): boolean {
  return url.includes("openrouter.ai");
}
function groqUrl(url: string): boolean {
  return url.includes("api.groq.com");
}
function nvidiaUrl(url: string): boolean {
  return url.includes("integrate.api.nvidia.com");
}
function tavilyUrl(url: string): boolean {
  return url.includes("api.tavily.com");
}
function exaUrl(url: string): boolean {
  return url.includes("api.exa.ai");
}

/** The §10-أ search query blog-research passes to the tavily arm. */
const SEARCH_QUERY =
  "most searched questions right now in sports nutrition muscle building fat loss and supplements";

/* ══════════════════════════════════════════════════════════════════════
 * 0. The §6-أ ladder shape (PHASE 5-A order canary)
 * ══════════════════════════════════════════════════════════════════════ */

describe("PHASE 5-A/5-B — the §6-أ grounded-arm ladder (order canary)", () => {
  it("EN order: exa → tavily → groq → gemini (dormant last) — the Phase-4 approved FINAL state, landed by Phase 5-B", () => {
    expect(groundedArmOrder("en")).toEqual(["exa", "tavily", "groq", "gemini"]);
    // a lang-less caller gets the EN order (the research JSON contract is
    // English-keyed by construction — the documented default)
    expect(groundedArmOrder()).toEqual(["exa", "tavily", "groq", "gemini"]);
  });

  it("AR order: tavily → groq → exa (EN-equivalent query) → gemini — the §6-أ language split", () => {
    expect(groundedArmOrder("ar")).toEqual(["tavily", "groq", "exa", "gemini"]);
  });

  it("GEMINI_GROUNDED_ENABLED=0 drops the dormant gemini arm (deploy-free §6-أ kill-switch)", () => {
    process.env.GEMINI_GROUNDED_ENABLED = "0";
    expect(groundedArmOrder()).toEqual(["exa", "tavily", "groq"]);
    expect(groundedArmOrder("ar")).toEqual(["tavily", "groq", "exa"]);
    expect(groundedArmOrder("en")).toEqual(["exa", "tavily", "groq"]);
  });

  it("GROUNDED_ARM_ORDER overrides the whole walk without a deploy (ops/rollback knob); an invalid value falls back to the built-in ladder", () => {
    process.env.GROUNDED_ARM_ORDER = " tavily , gemini ";
    expect(groundedArmOrder()).toEqual(["tavily", "gemini"]);
    expect(groundedArmOrder("ar")).toEqual(["tavily", "gemini"]);
    process.env.GROUNDED_ARM_ORDER = "nonsense,,";
    expect(groundedArmOrder()).toEqual(["exa", "tavily", "groq", "gemini"]);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 1. The cross-provider walk — provider transition on quota drain
 *    (cooldown OFF: pure failover mechanics, canaries' default env)
 * ══════════════════════════════════════════════════════════════════════ */

describe("cross-provider walk — tavily quota drain moves to groq browser_search", () => {
  it("tavily 429 (credits exhausted) → groq browser_search answers with REAL citation evidence; the openrouter web arm is NEVER called (off-ladder)", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      return { ok: true, status: 200, payload: GROQ_BROWSER_OK };
    });

    const out = await callGroundedSearch("research", { tag: "blog:research" });

    expect(out.provider).toBe("groq");
    expect(out.model).toBe("openai/gpt-oss-120b");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.nasm.org/protein-intake",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    // walk order: ONE tavily search attempt (429 — honest error), then ONE
    // groq browser_search call — gemini (keyless config error) and the
    // off-ladder openrouter web arm are NEVER called; NVIDIA never called.
    expect(log).toHaveLength(2);
    expect(tavilyUrl(log[0].url)).toBe(true);
    expect(log[0].auth).toBe("Bearer tvly-test-key");
    expect(groqUrl(log[1].url)).toBe(true);
    expect(log.some((c) => orUrl(c.url) || nvidiaUrl(c.url) || geminiKeyOk(c.url))).toBe(false);
    // the groq attempt IS a real search call: browser_search tool in the
    // body, reasoning_format hidden (GPT-OSS law), NO response_format.
    expect(log[1].body?.tools).toEqual([{ type: "browser_search" }]);
    expect(log[1].body?.reasoning_format).toBe("hidden");
    expect(log[1].body?.response_format).toBeUndefined();
    expect(log[1].auth).toBe("Bearer gsk-test-key");
  });

  it("tavily 429 + groq TPD-drained → the DORMANT gemini arm answers as the last resort", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      if (groqUrl(url)) return { ok: false, status: 429, payload: GROQ_TPD_429 };
      return { ok: true, status: 200, payload: GEMINI_GROUNDED_OK };
    });

    const out = await callGroundedSearch("research", { tag: "blog:research" });

    expect(out.provider).toBe("gemini");
    expect(out.grounding.searchQueries).toEqual(["how much protein per day"]);
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://examine.com/protein",
    ]);
    // 1 tavily + 2 groq ladder models (120b/20b, both TPD-drained) + the
    // gemini ladder's first model — openrouter NEVER called (off-ladder).
    expect(log).toHaveLength(4);
    expect(tavilyUrl(log[0].url)).toBe(true);
    expect(log.slice(1, 3).every((c) => groqUrl(c.url))).toBe(true);
    expect(geminiKeyOk(log[3].url)).toBe(true);
    expect(log.some((c) => orUrl(c.url) || nvidiaUrl(c.url))).toBe(false);
  });

  it("groq legacy message.citations shape still answers (documented location #1)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: GROQ_BROWSER_OK_CITED }));

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.nasm.org/protein-intake",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    // tavily + gemini are keyless (honest config errors, zero fetches) —
    // groq answers on the FIRST real call.
    expect(log).toHaveLength(1);
  });

  it("groq 400 «Parsing failed» under reasoning_format hidden → flips to parsed and succeeds (LIVE-MEASURED split, run 39061588932)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    const fake = vi.fn(async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const auth = headers.get("authorization") || "";
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      log.push({ url, auth, body });
      let ok = true;
      let status = 200;
      let payload: unknown = GROQ_BROWSER_OK;
      if (groqUrl(String(url)) && body.reasoning_format === "hidden") {
        // the measured gpt-oss-20b failure under "hidden"
        ok = false; status = 400;
        payload = { error: { message: "Parsing failed. The model generated output that could not be parsed. Please adjust your prompt.", type: "invalid_request_error" } };
      }
      return {
        ok, status,
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fake);

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.model).toBe("openai/gpt-oss-120b");
    const groqCalls = log.filter((c) => groqUrl(c.url));
    expect(groqCalls).toHaveLength(2);
    expect(groqCalls[0].body?.reasoning_format).toBe("hidden");
    expect(groqCalls[1].body?.reasoning_format).toBe("parsed");
  });

  it("groq 429 TPM (per-minute token bucket) → waits Groq's own hint and retries; NEVER marks the 30-min quota registry", { timeout: 15_000 }, async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    let groqCall = 0;
    const fake = vi.fn(async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const auth = headers.get("authorization") || "";
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      log.push({ url, auth, body });
      let ok = true;
      let status = 200;
      let payload: unknown = GROQ_BROWSER_OK;
      if (groqUrl(String(url))) {
        groqCall++;
        if (groqCall === 1) {
          // the measured TPM body (probe run 39061337401): per-minute token
          // bucket with Groq's own retry hint
          ok = false; status = 429;
          payload = { error: { message: "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_x` service tier `on_demand` on tokens per minute (TPM): Limit 8000, Used 7541, Requested 4146. Please try again in 0.01s.", type: "rate_limit_error" } };
        }
      }
      return {
        ok, status,
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fake);

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.model).toBe("openai/gpt-oss-120b");
    const groqCalls = log.filter((c) => groqUrl(c.url));
    expect(groqCalls).toHaveLength(2); // 429 TPM → patient retry → 200
    // the TPM 429 is a per-minute transient: it must NOT cool the model
    const cds = activeCooldowns();
    expect(cds.some((c) => c.scope.startsWith("grounded:groq:"))).toBe(false);
  });

  it("groq citations are also accepted from x_groq (documented location #2)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: GROQ_BROWSER_OK_XGROQ }));

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.issn.org/position-stand",
    ]);
    expect(out.grounding.sources[0].title).toBe("ISSN");
  });

  it("groq ladder: the leader 404s (dead id) → gpt-oss-20b answers (the GROQ-2 compound-decommission law)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    const fake = vi.fn(async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const auth = headers.get("authorization") || "";
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      log.push({ url, auth, body });
      let ok = true;
      let status = 200;
      let payload: unknown = GROQ_BROWSER_OK;
      if (groqUrl(String(url)) && body.model === "openai/gpt-oss-120b") {
        // the LIVE shape of the decommissioned-id failure (run 39019592155):
        // 404 model_not_found — the ladder must fall to the next model
        ok = false;
        status = 404;
        payload = { error: { message: "The model `groq/compound` does not exist or you do not have access to it.", type: "invalid_request_error", code: "model_not_found" } };
      }
      return {
        ok,
        status,
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fake);

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.model).toBe("openai/gpt-oss-20b");
    expect(out.grounding.sources.length).toBe(2);
    // the ladder walked BOTH groq models: dead leader first, sibling second
    const groqCalls = log.filter((c) => groqUrl(c.url));
    expect(groqCalls).toHaveLength(2);
    expect(groqCalls[0].body?.model).toBe("openai/gpt-oss-120b");
    expect(groqCalls[1].body?.model).toBe("openai/gpt-oss-20b");
    // every groq call is a REAL browser_search call with the reasoning law
    for (const c of groqCalls) {
      expect(c.body?.tools).toEqual([{ type: "browser_search" }]);
      expect(c.body?.reasoning_format).toBe("hidden");
    }
  });

  it("groq arm clamps max_tokens into the TPM-safe band [4096, 5000] (the R3 law, applied to the grounded arm)", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: GROQ_BROWSER_OK }));
    await callGroqGroundedSearch("research", { maxTokens: 400 });
    expect(log[0].body?.max_tokens).toBe(4096);
    await callGroqGroundedSearch("research", { maxTokens: 12000 });
    expect(log[1].body?.max_tokens).toBe(5000);
  });

  it("openrouter reasoning models: empty content + reasoning_details + annotations still answers (LIVE-PROBED run 38843366143 — direct arm diagnostics)", async () => {
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({
      ok: true,
      status: 200,
      payload: {
        choices: [
          {
            message: {
              content: null,
              reasoning_details: [{ text: "The WHO guidance recommends 150-300 minutes of moderate activity weekly." }],
              annotations: [
                { type: "url", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity", title: "WHO" },
              ],
            },
          },
        ],
      },
    }));

    const out = await callOpenRouterGroundedSearch("research", { maxTokens: 400 });
    expect(out.provider).toBe("openrouter");
    expect(out.text).toContain("150-300 minutes");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    ]);
  });

  it("the OR arm enforces a 10000-token floor (LIVE-PROBED: 400 dies inside the reasoning CoT; 6000 truncates the ARABIC research mid-JSON — kw:10/topics:0, run 38849540488)", async () => {
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: OR_WEB_OK }));
    await callOpenRouterGroundedSearch("research", { maxTokens: 400 });
    expect(log[0].body?.max_tokens).toBe(10000);
    // a caller above the floor keeps their own value (never clamped DOWN)
    await callOpenRouterGroundedSearch("research", { maxTokens: 12000 });
    expect(log[1].body?.max_tokens).toBe(12000);
  });

  it("every ladder arm fails → ONE honest aggregate error; the openrouter web arm NEVER receives a call (off-ladder); NVIDIA never receives a call", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url)) return { ok: false, status: 429, payload: EXA_CREDITS_429 };
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      if (groqUrl(url)) return { ok: false, status: 429, payload: GROQ_TPD_429 };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });

    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("every grounded-search arm failed");
    expect(err.message).toContain("exa(search API)");
    expect(err.message).toContain("tavily(search API)");
    expect(err.message).toContain("groq(browser_search)");
    expect(err.message).toContain("gemini(googleSearch, dormant last arm)");
    expect(err.message).toContain("REMOVED from the effective ladder");
    expect(err.message).toContain("NVIDIA NIM has no grounded-search capability");
    expect(err.message).toContain("no simulated/curated substitute");
    expect(err.message).toContain("AI API error 429");
    // 1 exa + 1 tavily + 2 groq ladder + 3 gemini ladder = 7 REAL attempts;
    // the off-ladder OR arm and the excluded NVIDIA make ZERO calls.
    expect(log).toHaveLength(7);
    expect(log.some((c) => orUrl(c.url) || nvidiaUrl(c.url))).toBe(false);
  });

  it("no keys configured → the aggregate names every ladder arm's configuration error (exa + tavily + groq + gemini)", async () => {
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: OR_WEB_OK }));
    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("EXA_API_KEY is not configured");
    expect(err.message).toContain("TAVILY_API_KEY is not configured");
    expect(err.message).toContain("GROQ_API_KEY is not configured");
    expect(err.message).toContain("GEMINI_API_KEY is not configured");
    expect(log).toHaveLength(0);
  });

  it("tavily healthy → the FIRST arm answers and groq/gemini are never called (search + chain synthesis)", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out = await callGroundedSearch("research", { tag: "blog:research", searchQuery: SEARCH_QUERY });

    expect(out.provider).toBe("tavily");
    expect(out.model).toBe("nvidia/nemotron-3-ultra-550b-a55b:free"); // the synthesis model
    expect(out.text).toContain("How much protein do you really need per day");
    expect(out.grounding.searchQueries).toEqual([SEARCH_QUERY]);
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.nasm.org/protein-intake",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    // ONE tavily search + ONE synthesis chain call — groq/gemini/nvidia never called.
    expect(log).toHaveLength(2);
    expect(tavilyUrl(log[0].url)).toBe(true);
    expect(orUrl(log[1].url)).toBe(true);
    expect(log.some((c) => groqUrl(c.url) || geminiKeyOk(c.url) || nvidiaUrl(c.url))).toBe(false);
  });

  it("ops knobs swap the arm models without a deploy (GROQ_GROUNDED_MODEL / OPENROUTER_GROUNDED_MODEL — direct arm calls)", async () => {
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_GROUNDED_MODEL = "custom/or-model:free";
    process.env.GROQ_GROUNDED_MODEL = "groq/custom-browser";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (groqUrl(url)) return { ok: true, status: 200, payload: GROQ_BROWSER_OK };
      return { ok: true, status: 200, payload: OR_WEB_OK };
    });

    const orOut = await callOpenRouterGroundedSearch("research");
    expect(orOut.provider).toBe("openrouter");
    expect(orOut.model).toBe("custom/or-model:free");
    expect(String(log[0].body?.model)).toBe("custom/or-model:free");

    const groqOut = await callGroqGroundedSearch("research");
    expect(groqOut.model).toBe("groq/custom-browser");
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 1b. PHASE 5-A — the Tavily search arm contract (callTavilySearch)
 * ══════════════════════════════════════════════════════════════════════ */

describe("PHASE 5-A — the Tavily search arm (REAL search + chain synthesis)", () => {
  it("the search body: the caller's searchQuery, basic depth (1 credit), raw content on, NO include_domains by default", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    await callTavilySearch("the full research brief", {
      tag: "blog:research",
      searchQuery: SEARCH_QUERY,
    });

    expect(log).toHaveLength(2);
    const search = log[0].body ?? {};
    expect(search.query).toBe(SEARCH_QUERY);
    expect(search.search_depth).toBe("basic"); // 1 credit — the free-tier law
    expect(search.max_results).toBe(10);
    expect(search.include_raw_content).toBe(true);
    expect(search.include_answer).toBe(false);
    expect(search.include_domains).toBeUndefined(); // unrestricted discovery default
    expect(log[0].auth).toBe("Bearer tvly-test-key");
  });

  it("the synthesis prompt CONTAINS the real search URLs + snippets (grounding proof — never model memory alone)", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    await callTavilySearch("the full research brief", {
      tag: "blog:research",
      searchQuery: SEARCH_QUERY,
      systemPrompt: "You are a strict JSON API endpoint.",
    });

    const synth = log[1];
    expect(synth.body?.model).toBe("nvidia/nemotron-3-ultra-550b-a55b:free");
    const messages = JSON.stringify(synth.body?.messages);
    // BOTH live URLs ride the synthesis prompt (the evidence base):
    expect(messages).toContain("https://www.nasm.org/protein-intake");
    expect(messages).toContain("https://pubmed.ncbi.nlm.nih.gov/22150333");
    // …the raw_content excerpt too (measured depth, clipped):
    expect(messages).toContain("1.6-2.2 g/kg");
    // …the search-tool adapter note + the original brief:
    expect(messages).toContain("NO live-search tool in this call");
    expect(messages).toContain("the full research brief");
    expect(messages).toContain(SEARCH_QUERY);
    // the caller's systemPrompt rides the synthesis (strict-JSON law):
    expect(messages).toContain("strict JSON API endpoint");
  });

  it("200 with ZERO usable result URLs → the live-evidence gate fails honestly (law 344) → the walk falls to groq", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: { results: [] } };
      return { ok: true, status: 200, payload: GROQ_BROWSER_OK };
    });

    // the DIRECT arm call rejects with the gate error…
    await expect(
      callTavilySearch("research", { tag: "blog:research", searchQuery: SEARCH_QUERY }),
    ).rejects.toThrow(/ZERO usable result URLs.*live-evidence gate/);
    // …and the WALK falls through to groq (a 200-without-URLs answer is
    // NOT research — never a fake pass).
    const out = await callGroundedSearch("research", { searchQuery: SEARCH_QUERY });
    expect(out.provider).toBe("groq");
  });

  it("a 429/credit-exhausted search → markCooldown(grounded:tavily) + the walk falls to groq; the SECOND call skips tavily entirely", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      return { ok: true, status: 200, payload: GROQ_BROWSER_OK };
    });

    const out1 = await callGroundedSearch("research", { searchQuery: SEARCH_QUERY });
    expect(out1.provider).toBe("groq");
    expect(log).toHaveLength(2); // 1 tavily (429) + 1 groq
    const cds = activeCooldowns();
    expect(cds.some((c) => c.scope === "grounded:tavily")).toBe(true);

    const out2 = await callGroundedSearch("research", { searchQuery: SEARCH_QUERY });
    expect(out2.provider).toBe("groq");
    // the second call made ZERO tavily attempts — the drained arm was
    // skipped from cooldown memory (the futile-repeat law).
    const call2 = log.slice(2);
    expect(call2).toHaveLength(1);
    expect(groqUrl(call2[0].url)).toBe(true);
  });

  it("no TAVILY_API_KEY → honest configuration error; the walk degrades to groq exactly as before the arm existed", async () => {
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: GROQ_BROWSER_OK }));

    expect(getTavilyKey()).toBe("");
    const out = await callGroundedSearch("research", { searchQuery: SEARCH_QUERY });
    expect(out.provider).toBe("groq");
    expect(log).toHaveLength(1); // zero tavily/gemini fetches — keyless arms
  });

  it("search OK but the synthesis chain all-fails → the arm fails honestly → the walk falls to groq browser_search (a REAL search call, not plain generation)", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    const fake = vi.fn(async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const auth = headers.get("authorization") || "";
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      log.push({ url, auth, body });
      if (tavilyUrl(String(url))) {
        return {
          ok: true, status: 200,
          json: async () => TAVILY_SEARCH_OK,
          text: async () => JSON.stringify(TAVILY_SEARCH_OK),
        } as unknown as Response;
      }
      // The synthesis chain (plain chat, NO tools) fails everywhere…
      if (!body.tools) {
        return {
          ok: false, status: 429,
          json: async () => QUOTA_429,
          text: async () => JSON.stringify(QUOTA_429),
        } as unknown as Response;
      }
      // …while the groq ARM call (browser_search WITH tools) answers.
      return {
        ok: true, status: 200,
        json: async () => GROQ_BROWSER_OK,
        text: async () => JSON.stringify(GROQ_BROWSER_OK),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fake);

    const out = await callGroundedSearch("research", { searchQuery: SEARCH_QUERY });
    expect(out.provider).toBe("groq");
    expect(out.model).toBe("openai/gpt-oss-120b");
    // the walk: tavily search (OK) → synthesis chain (or-ultra 429 →
    // groq-120b plain 429 → chain exhausted → arm throws) → groq ARM
    // (browser_search) answers.
    const tavilyCalls = log.filter((c) => tavilyUrl(c.url));
    expect(tavilyCalls).toHaveLength(1);
    const plainChat = log.filter((c) => !c.body?.tools && (orUrl(c.url) || groqUrl(c.url)));
    expect(plainChat.length).toBeGreaterThanOrEqual(2); // or-ultra + groq-120b synthesis attempts
    const armCall = log.find((c) => Array.isArray(c.body?.tools as unknown));
    expect(armCall).toBeDefined();
    expect(armCall?.body?.tools).toEqual([{ type: "browser_search" }]);
  });

  it("TAVILY_INCLUDE_DOMAINS restricts the search (the Phase-3 measured authority filter) and TAVILY_SEARCH_DEPTH=advanced switches depth", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.TAVILY_INCLUDE_DOMAINS = "who.int, mayoclinic.org";
    process.env.TAVILY_SEARCH_DEPTH = "advanced";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    await callTavilySearch("research", { searchQuery: SEARCH_QUERY });
    expect(log[0].body?.include_domains).toEqual(["who.int", "mayoclinic.org"]);
    expect(log[0].body?.search_depth).toBe("advanced");
  });

  it("no searchQuery option → the prompt's first 400 chars become the query (the documented fallback, Tavily's cap)", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const longPrompt = "A".repeat(1000);
    await callTavilySearch(longPrompt, { tag: "probe" });
    expect(log[0].body?.query).toBe("A".repeat(400));
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 1b-b. PHASE 5-B — the Exa search arm (callExaSearch: REAL semantic
 *       search + OPTIONAL /contents full-text deepening + chain synthesis)
 * ══════════════════════════════════════════════════════════════════════ */

describe("PHASE 5-B — the Exa search arm (REAL search + optional deepening + chain synthesis)", () => {
  it("the search body: the caller's searchQuery, numResults 10, type auto (the Phase-3 measured shape), x-api-key auth, NO includeDomains by default", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url) && url.includes("/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
      if (exaUrl(url) && url.includes("/contents")) return { ok: true, status: 200, payload: EXA_CONTENTS_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    await callExaSearch("the full research brief", {
      tag: "blog:research",
      searchQuery: SEARCH_QUERY,
    });

    const search = log.find((c) => exaUrl(c.url) && c.url.includes("/search"))?.body ?? {};
    expect(search.query).toBe(SEARCH_QUERY);
    expect(search.numResults).toBe(10);
    expect(search.type).toBe("auto");
    expect(search.includeDomains).toBeUndefined(); // unrestricted discovery default
    expect(log.find((c) => exaUrl(c.url))?.auth).toBe("exa-test-key"); // the x-api-key header
  });

  it("the /contents deepening call: ids = top-3 result URLs, text.maxCharacters = 5000 (the Phase-3 WINNING shape)", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url) && url.includes("/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
      if (exaUrl(url) && url.includes("/contents")) return { ok: true, status: 200, payload: EXA_CONTENTS_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out = await callExaSearch("the full research brief", { searchQuery: SEARCH_QUERY });

    const contents = log.find((c) => exaUrl(c.url) && c.url.includes("/contents"))?.body ?? {};
    expect(contents.ids).toEqual([
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    expect(contents.text).toEqual({ maxCharacters: 5_000 });
    // the §6-أ stamp + pages ride the arm result:
    expect(out.researchDepth).toBe("full-text");
    expect(out.fullText?.map((p) => p.url)).toEqual([
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    expect(out.fullText?.[0].text).toContain("FULL PAGE TEXT");
    // 3 REAL calls total: search + contents + ONE synthesis chain call.
    expect(log).toHaveLength(3);
  });

  it("the synthesis prompt CONTAINS the real search URLs + snippets + the EXTRACTED FULL TEXT (grounding proof — never model memory alone)", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url) && url.includes("/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
      if (exaUrl(url) && url.includes("/contents")) return { ok: true, status: 200, payload: EXA_CONTENTS_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    await callExaSearch("the full research brief", {
      searchQuery: SEARCH_QUERY,
      systemPrompt: "You are a strict JSON API endpoint.",
    });

    const synth = log.find((c) => orUrl(c.url));
    expect(synth).toBeDefined();
    const messages = JSON.stringify(synth?.body?.messages);
    // BOTH live URLs ride the synthesis prompt (the evidence base):
    expect(messages).toContain("https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567");
    expect(messages).toContain("https://pubmed.ncbi.nlm.nih.gov/22150333");
    // …the snippet + the published date + the EXTRACTED full-text excerpt:
    expect(messages).toContain("1.6-2.2 g/kg");
    expect(messages).toContain("2025-11-06");
    expect(messages).toContain("FULL PAGE TEXT");
    expect(messages).toContain("extracted live via Exa /contents");
    // …the search-tool adapter note + the original brief + the query:
    expect(messages).toContain("NO live-search tool in this call");
    expect(messages).toContain("the full research brief");
    expect(messages).toContain(SEARCH_QUERY);
    // the caller's systemPrompt rides the synthesis (strict-JSON law):
    expect(messages).toContain("strict JSON API endpoint");
  });

  it("200 with ZERO usable result URLs → the live-evidence gate fails honestly (law 344) → the EN walk falls to tavily", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url)) return { ok: true, status: 200, payload: { results: [{ title: "no url here" }] } };
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    // the DIRECT arm call rejects with the gate error…
    await expect(
      callExaSearch("research", { searchQuery: SEARCH_QUERY }),
    ).rejects.toThrow(/ZERO usable result URLs.*live-evidence gate/);
    // …and the EN WALK falls through to tavily (a 200-without-URLs answer is
    // NOT research — never a fake pass).
    const out = await callGroundedSearch("research", { lang: "en", searchQuery: SEARCH_QUERY });
    expect(out.provider).toBe("tavily");
  });

  it("a 429/credit-exhausted search → markCooldown(grounded:exa) + the EN walk falls to tavily; the SECOND call skips exa entirely", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url)) return { ok: false, status: 429, payload: EXA_CREDITS_429 };
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out1 = await callGroundedSearch("research", { lang: "en", searchQuery: SEARCH_QUERY });
    expect(out1.provider).toBe("tavily");
    expect(log.filter((c) => exaUrl(c.url))).toHaveLength(1);
    const cds = activeCooldowns();
    expect(cds.some((c) => c.scope === "grounded:exa")).toBe(true);

    const out2 = await callGroundedSearch("research", { lang: "en", searchQuery: SEARCH_QUERY });
    expect(out2.provider).toBe("tavily");
    // the second call made ZERO exa attempts — the drained arm was skipped
    // from cooldown memory (the futile-repeat law).
    expect(log.filter((c) => exaUrl(c.url))).toHaveLength(1);
  });

  it("no EXA_API_KEY → honest configuration error; the EN walk degrades to tavily exactly as before the arm existed", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    expect(getExaKey()).toBe("");
    const out = await callGroundedSearch("research", { lang: "en", searchQuery: SEARCH_QUERY });
    expect(out.provider).toBe("tavily");
    expect(log.filter((c) => exaUrl(c.url))).toHaveLength(0);
  });

  it("AR walk: tavily first, and the Exa arm receives the ENGLISH-EQUIVALENT query (§6-أ «Exa بالاستعلام الإنجليزي المكافئ»)", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const AR_QUERY = "الأسئلة الأكثر بحثًا الآن في التغذية الرياضية";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      if (groqUrl(url)) return { ok: false, status: 429, payload: GROQ_TPD_429 };
      if (exaUrl(url) && url.includes("/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
      if (exaUrl(url) && url.includes("/contents")) return { ok: true, status: 200, payload: EXA_CONTENTS_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out = await callGroundedSearch("the Arabic research brief", {
      lang: "ar",
      searchQuery: AR_QUERY,
      searchQueryEn: SEARCH_QUERY,
    });

    // the AR ladder order: tavily (429) → groq ladder (2×TPD-drained) →
    // exa answers (the third arm, with the EN-equivalent query).
    expect(out.provider).toBe("exa");
    expect(out.grounding.searchQueries).toEqual([SEARCH_QUERY]); // NOT the Arabic query
    const exaSearch = log.find((c) => exaUrl(c.url) && c.url.includes("/search"))?.body ?? {};
    expect(exaSearch.query).toBe(SEARCH_QUERY);
    // the Arabic brief still rides the synthesis prompt (the language of
    // the ANSWER stays Arabic — only the search is English):
    const synth = log.find((c) => orUrl(c.url));
    expect(JSON.stringify(synth?.body?.messages)).toContain("the Arabic research brief");
  });

  it("exa healthy → the EN FIRST arm answers and tavily/groq/gemini are never called (search + contents + chain synthesis)", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url) && url.includes("/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
      if (exaUrl(url) && url.includes("/contents")) return { ok: true, status: 200, payload: EXA_CONTENTS_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out = await callGroundedSearch("research", { lang: "en", searchQuery: SEARCH_QUERY });

    expect(out.provider).toBe("exa");
    expect(out.model).toBe("nvidia/nemotron-3-ultra-550b-a55b:free"); // the synthesis model
    expect(out.text).toContain("How much protein do you really need per day");
    expect(out.grounding.searchQueries).toEqual([SEARCH_QUERY]);
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    // ONE exa search + ONE exa /contents + ONE synthesis chain call —
    // tavily/groq/gemini never called.
    expect(log).toHaveLength(3);
    expect(log.some((c) => tavilyUrl(c.url) || groqUrl(c.url) || geminiKeyOk(c.url))).toBe(false);
  });

  it("/contents fails → the Tavily Extract ALTERNATIVE fires (§6-أ) and the deepening still lands (researchDepth stays full-text)", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url) && url.includes("/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
      if (exaUrl(url) && url.includes("/contents")) return { ok: false, status: 500, payload: { error: "contents upstream boom" } };
      if (tavilyUrl(url) && url.includes("/extract")) return { ok: true, status: 200, payload: TAVILY_EXTRACT_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out = await callExaSearch("research", { searchQuery: SEARCH_QUERY });

    // the alternative extractor WAS called with the top URLs…
    const extract = log.find((c) => tavilyUrl(c.url) && c.url.includes("/extract"))?.body ?? {};
    expect(extract.urls).toEqual([
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    // …and its raw_content became the deepened page (title backfilled from
    // the search result):
    expect(out.researchDepth).toBe("full-text");
    expect(out.fullText).toHaveLength(1);
    expect(out.fullText?.[0].text).toContain("EXTRACTED VIA TAVILY");
    expect(out.fullText?.[0].title).toContain("International Society of Sports Nutrition");
    // the search results NEVER hit the tavily SEARCH endpoint (the walk arm
    // stayed exa — the extract call is the §6-أ ALTERNATIVE extractor only):
    expect(log.some((c) => tavilyUrl(c.url) && c.url.includes("/search"))).toBe(false);
  });

  it("BOTH extractors fail (no tavily key) → a snippets-only bundle stamped researchDepth:'snippets' — the article is NOT failed (§6-أ soft law)", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url) && url.includes("/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
      if (exaUrl(url) && url.includes("/contents")) return { ok: false, status: 500, payload: { error: "contents upstream boom" } };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out = await callExaSearch("research", { searchQuery: SEARCH_QUERY });

    // the ARM still succeeds — the deepening is optional by law:
    expect(out.provider).toBe("exa");
    expect(out.researchDepth).toBe("snippets");
    expect(out.fullText).toBeUndefined();
    expect(out.grounding.sources).toHaveLength(2); // the evidence gate still holds
    expect(out.text).toContain("How much protein");
  });

  it("ops knobs swap arm behavior without a deploy (EXA_NUM_RESULTS / EXA_INCLUDE_DOMAINS / EXA_CONTENTS_MAX_CHARS)", async () => {
    process.env.EXA_API_KEY = "exa-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.EXA_NUM_RESULTS = "5";
    process.env.EXA_INCLUDE_DOMAINS = "nih.gov, who.int";
    process.env.EXA_CONTENTS_MAX_CHARS = "1200";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (exaUrl(url) && url.includes("/search")) return { ok: true, status: 200, payload: EXA_SEARCH_OK };
      if (exaUrl(url) && url.includes("/contents")) return { ok: true, status: 200, payload: EXA_CONTENTS_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    await callExaSearch("research", { searchQuery: SEARCH_QUERY });

    const search = log.find((c) => exaUrl(c.url) && c.url.includes("/search"))?.body ?? {};
    expect(search.numResults).toBe(5);
    expect(search.includeDomains).toEqual(["nih.gov", "who.int"]);
    const contents = log.find((c) => exaUrl(c.url) && c.url.includes("/contents"))?.body ?? {};
    expect(contents.text).toEqual({ maxCharacters: 1_200 });
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 1b-c. PHASE 5-B — the Tavily arm's free full-text stamp (raw_content
 *       already rides the search response — ZERO extra network calls)
 * ══════════════════════════════════════════════════════════════════════ */

describe("PHASE 5-B — the Tavily arm stamps researchDepth from raw_content (zero extra calls)", () => {
  it("raw_content pages become fullText + the 'full-text' stamp — the search + synthesis call count is UNCHANGED (2)", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: TAVILY_SEARCH_OK };
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out = await callTavilySearch("research", { searchQuery: SEARCH_QUERY });

    expect(out.researchDepth).toBe("full-text");
    // only the FIRST result carries raw_content in the fixture → one page:
    expect(out.fullText?.map((p) => p.url)).toEqual(["https://www.nasm.org/protein-intake"]);
    expect(out.fullText?.[0].text).toContain("1.6-2.2 g/kg");
    // still EXACTLY the 5-A call shape: 1 search + 1 synthesis — the
    // deepening consumed the response body it already had.
    expect(log).toHaveLength(2);
  });

  it("no raw_content anywhere → the honest 'snippets' stamp and NO fullText field (legacy byte-identical shape)", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) {
        return {
          ok: true,
          status: 200,
          payload: {
            results: [
              {
                title: "Protein intake",
                url: "https://www.nasm.org/protein-intake",
                content: "snippet only",
                raw_content: "",
              },
            ],
          },
        };
      }
      return { ok: true, status: 200, payload: CHAIN_RESEARCH_JSON };
    });

    const out = await callTavilySearch("research", { searchQuery: SEARCH_QUERY });
    expect(out.researchDepth).toBe("snippets");
    expect(out.fullText).toBeUndefined();
    expect(out.grounding.sources).toHaveLength(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 1c. PHASE 5-A — GEMINI_GROUNDED_ENABLED (the dormant-arm kill-switch)
 * ══════════════════════════════════════════════════════════════════════ */

describe("PHASE 5-A — GEMINI_GROUNDED_ENABLED kill-switch (§6-أ)", () => {
  it("=0 → the dormant gemini arm is REMOVED from the walk (zero gemini fetches; the aggregate names the disablement)", async () => {
    process.env.GEMINI_GROUNDED_ENABLED = "0";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      if (groqUrl(url)) return { ok: false, status: 429, payload: GROQ_TPD_429 };
      return { ok: true, status: 200, payload: GEMINI_GROUNDED_OK };
    });

    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("every grounded-search arm failed");
    expect(err.message).toContain("DISABLED via GEMINI_GROUNDED_ENABLED=0");
    // the walk attempted ONLY tavily + the groq ladder — the disabled
    // gemini arm never fired a fetch (nor did the off-ladder OR arm).
    expect(log).toHaveLength(3);
    expect(log.some((c) => geminiKeyOk(c.url) || orUrl(c.url))).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 2. The honest evidence gates — plain generation can NEVER masquerade
 * ══════════════════════════════════════════════════════════════════════ */

describe("honest evidence gates — no live-search evidence = honest failure", () => {
  it("openrouter 200 WITHOUT annotations fails the gate (direct arm) — plain generation never masquerades as research", async () => {
    process.env.OPENROUTER_API = "sk-or-test-key";
    stubRoutingFetch([], () => ({
      ok: true,
      status: 200,
      payload: { choices: [{ message: { content: "answer from model memory" } }] },
    }));
    await expect(callOpenRouterGroundedSearch("research")).rejects.toThrow(
      /no web-search evidence.*not built on live search/,
    );
  });

  it("groq 200 WITHOUT citations fails the gate → the aggregate reports it honestly", { timeout: 20_000 }, async () => {
    // BLOG-RECOVERY 2026-10-20: the evidence-less 200 now re-walks the
    // SAME model twice (2s pauses) before the honest failure — the gate
    // itself is unchanged; the timeout covers the two pauses on slow CI.
    process.env.GROQ_API_KEY = "gsk-test-key";
    stubRoutingFetch([], () => ({
      ok: true,
      status: 200,
      payload: { choices: [{ message: { content: "memory-only answer" } }] },
    }));
    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("not built on live search");
  });

  it("tavily 200 WITHOUT usable URLs fails the gate → the aggregate reports it honestly", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: true, status: 200, payload: { results: [{ title: "no url here" }] } };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });
    const err = (await callGroundedSearch("research", { searchQuery: SEARCH_QUERY }).catch((e: Error) => e)) as Error;
    expect(err.message).toContain("ZERO usable result URLs");
    expect(err.message).toContain("live-evidence gate");
    expect(log).toHaveLength(1); // only the tavily call — groq/gemini keyless
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 3. The cooldown registry in the grounded walk («تجنب تكرار المحاولات
 *    الفاشلة») — OPT-IN via AI_PROVIDER_COOLDOWN_MS
 * ══════════════════════════════════════════════════════════════════════ */

describe("quota cooldown in the grounded walk (AI_PROVIDER_COOLDOWN_MS on)", () => {
  it("a 429-drained gemini ladder is SKIPPED on the second call — zero gemini fetches (the dormant last arm)", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 503, payload: { error: { message: "transient upstream" } } };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    const call1Fetches = log.length;
    // tavily (transient 503 — retried next call, never cooled) + the
    // 3-model gemini ladder (all 429 → cooled).
    expect(call1Fetches).toBe(4);
    expect(log.slice(1).every((c) => geminiKeyOk(c.url))).toBe(true);

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    // the second call made ZERO gemini attempts — the whole drained ladder
    // was skipped from cooldown memory; the transient tavily 503 re-fired.
    const call2 = log.slice(call1Fetches);
    expect(call2).toHaveLength(1);
    expect(tavilyUrl(call2[0].url)).toBe(true);
  });

  it("every arm drained → second call makes ZERO network calls and reports the skips honestly", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      if (groqUrl(url)) return { ok: false, status: 429, payload: GROQ_TPD_429 };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    const call1Fetches = log.length;
    expect(call1Fetches).toBe(6); // 1 tavily + 2 groq ladder (120b/20b) + 3 gemini ladder

    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toMatch(/quota-cooldown until .+ — skipped, no call made/);
    expect(err.message).toContain("ACTIVE COOLDOWNS");
    expect(err.message).toContain("grounded:tavily");
    expect(err.message).toContain("grounded:groq:openai/gpt-oss-120b");
    expect(err.message).toContain("grounded:gemini:key#1:gemini-3.5-flash");
    // ZERO new network calls — the futile repeat is gone
    expect(log.length).toBe(call1Fetches);
  });

  it("transient 503 NEVER cools — the second call re-attempts gemini (retry law intact)", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 503, payload: { error: { message: "The model is overloaded" } } };
      return { ok: false, status: 402, payload: CREDITS_402 };
    });

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    const call1Fetches = log.length;
    expect(log.slice(0, 3).every((c) => geminiKeyOk(c.url))).toBe(true);

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    // gemini was re-attempted (3 more REAL calls — the post-3.8-pro
    // ladder) — 503 stays retryable
    const call2Gemini = log.slice(call1Fetches).filter((c) => geminiKeyOk(c.url));
    expect(call2Gemini).toHaveLength(3);
  });

  it("AI_PROVIDER_COOLDOWN=0 kill-switch restores the no-cooldown walk", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.AI_PROVIDER_COOLDOWN = "0";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      if (groqUrl(url)) return { ok: false, status: 429, payload: GROQ_TPD_429 };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });

    await callGroundedSearch("research").catch(() => undefined);
    await callGroundedSearch("research").catch(() => undefined);
    // both calls walked EVERYTHING again (rollback knob = old walk):
    // 2 × (1 tavily + 2 groq + 3 gemini)
    expect(log.filter((c) => geminiKeyOk(c.url))).toHaveLength(6);
    expect(log.filter((c) => tavilyUrl(c.url))).toHaveLength(2);
    expect(log.filter((c) => groqUrl(c.url))).toHaveLength(4);
  });

  it("cooldown marks survive a process restart via the state file (cross-step persistence)", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    const call1Fetches = log.length;
    expect(call1Fetches).toBe(4); // 1 tavily + 3 gemini ladder models
    await flushCooldownWrites();
    // simulate the NEXT STEP's fresh process (run-step.mts runs each phase
    // as its own process): memory wiped, file on disk
    __resetCooldownForTests();

    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toMatch(/quota-cooldown until/);
    // BOTH arms skipped from the FILE state — zero new network calls
    expect(log.length).toBe(call1Fetches);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 4. The generation chain (P1/P2/P4) — a drained provider is skipped
 *    WITHOUT consuming attempt budget, so the walk REACHES the next
 *    provider (incl. NVIDIA) inside the same maxModels budget
 * ══════════════════════════════════════════════════════════════════════ */

describe("chain failover — provider cooldown frees attempt budget (callFreeAIFallbackChain)", () => {
  it("gemini+openrouter cooled → groq leads and answers (no fetch to the cooled providers)", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.NVIDIA_API_KEY = "nvapi-test-key";
    // pre-mark two providers drained (exactly what a real 429 does)
    const { markCooldown } = await import("@/lib/ai-provider-cooldown");
    markCooldown("chain:gemini", "quota: 429");
    markCooldown("chain:openrouter", "quota: 402");

    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: CHAIN_PONG }));

    const out = await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain",
      maxTokens: 10,
      timeoutMs: 5_000,
      maxModels: 3,
    });

    expect(out.provider).toBe("groq");
    expect(out.model).toBe("openai/gpt-oss-120b");
    // cooled providers made ZERO calls; the first live attempt is groq
    expect(log).toHaveLength(1);
    expect(groqUrl(log[0].url)).toBe(true);
    expect(log.some((c) => geminiKeyOk(c.url) || orUrl(c.url))).toBe(false);
  });

  it("gemini+openrouter+groq cooled → NVIDIA receives the call (4th provider reachable in-budget)", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.NVIDIA_API_KEY = "nvapi-test-key";
    const { markCooldown } = await import("@/lib/ai-provider-cooldown");
    markCooldown("chain:gemini", "quota: 429");
    markCooldown("chain:openrouter", "quota: 402");
    markCooldown("chain:groq", "quota: 429");

    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: CHAIN_PONG }));

    const out = await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain",
      maxTokens: 10,
      timeoutMs: 5_000,
      maxModels: 3,
    });

    expect(out.provider).toBe("nvidia");
    // BLOG-RECOVERY-3 round-3: nemotron-3-super-120b-a12b was REMOVED from
    // the chain (404 «Function not found» on NIM + its OR twin, measured
    // twice live 2026-10-21) — the 4th-provider proof now rides nvidia-ultra.
    expect(out.model).toBe("nvidia/nemotron-3-ultra-550b-a55b");
    expect(log).toHaveLength(1);
    expect(nvidiaUrl(log[0].url)).toBe(true);
  });

  it("a live 429 DURING the chain marks the provider — the next call skips it", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    let orStatus = 200;
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) {
        return orStatus === 200
          ? { ok: true, status: 200, payload: CHAIN_PONG }
          : { ok: false, status: orStatus, payload: QUOTA_429 };
      }
      return { ok: true, status: 200, payload: CHAIN_PONG };
    });

    // call 1 (rotation pinned by beforeEach: openrouter leads): gemini is
    // the TAIL now — openrouter answers, gemini never called.
    const out1 = await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain", maxTokens: 10, timeoutMs: 5_000, maxModels: 3,
    });
    expect(out1.provider).toBe("openrouter");
    const call1 = log.length;
    expect(log.slice(0, call1).some((c) => geminiKeyOk(c.url))).toBe(false);

    // call 2 (rotation re-pinned: openrouter leads again): openrouter now
    // 429s too → marked; groq answers. gemini stays the untouched tail.
    __resetChainRotationForTests();
    orStatus = 429;
    const out2 = await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain", maxTokens: 10, timeoutMs: 5_000, maxModels: 3,
    });
    expect(out2.provider).toBe("groq");
    const call2 = log.slice(call1);
    expect(call2.some((c) => geminiKeyOk(c.url))).toBe(false);
    expect(call2.some((c) => orUrl(c.url))).toBe(true);
    expect(call2.some((c) => groqUrl(c.url))).toBe(true);
  });

  it("all four providers cooled → zero network calls, honest aggregate lists the cooldowns", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.NVIDIA_API_KEY = "nvapi-test-key";
    const { markCooldown } = await import("@/lib/ai-provider-cooldown");
    for (const p of ["gemini", "openrouter", "groq", "nvidia"]) {
      markCooldown(`chain:${p}`, "quota: 429");
    }

    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: CHAIN_PONG }));

    const err = (await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain", maxTokens: 10, timeoutMs: 5_000, maxModels: 3,
    }).catch((e: Error) => e)) as Error;

    expect(err.message).toContain("All AI providers failed");
    expect(err.message).toMatch(/quota-cooldown until .+ — entries skipped, no call made/);
    expect(err.message).toContain("Active quota-cooldowns");
    expect(log).toHaveLength(0);
  });

  it("PHASE 5-A — the 3-way lead rotation runs on every strongest-chain call (gemini-first cancelled: the gemini key NEVER pins the lead)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.NVIDIA_API_KEY = "nvapi-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      // groq-120b answers ONLY on groq-led calls (simulating the rotation
      // deciding who gets the first slot); other providers 429.
      if (groqUrl(url)) return { ok: true, status: 200, payload: CHAIN_PONG };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });

    // call #1 (post-reset): openrouter leads → or-ultra 429 → groq-120b
    // answers (second slot) → gemini tail NEVER reached.
    const out1 = await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain", maxTokens: 10, timeoutMs: 5_000, maxModels: 3,
    });
    expect(out1.provider).toBe("groq");
    const call1 = log.length;
    expect(log.slice(0, call1).some((c) => geminiKeyOk(c.url))).toBe(false);

    // call #2: groq leads (rotation advanced) → groq-120b answers on the
    // FIRST slot — still zero gemini fetches (the tail is beyond a healthy
    // walk and never a forced lead).
    __resetChainRotationForTests();
    // advance the rotation to the groq lead: one throwaway chain call
    // consumed by the 429 fixture (or-ultra lead)…
    await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain", maxTokens: 10, timeoutMs: 5_000, maxModels: 3,
    }).catch(() => undefined);
    const out3 = await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain", maxTokens: 10, timeoutMs: 5_000, maxModels: 3,
    });
    expect(out3.provider).toBe("groq");
    expect(log.some((c) => geminiKeyOk(c.url))).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 5. Backward compatibility — cooldown OFF (no env) keeps the honest
 *    per-arm walk (the canary law: no cooldown memory without the env)
 * ══════════════════════════════════════════════════════════════════════ */

describe("cooldown OFF (absent env) — no-cooldown walk preserved", () => {
  it("the gemini ladder re-attempts every model on every call (no cooldown memory)", async () => {
    process.env.TAVILY_API_KEY = "tvly-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (tavilyUrl(url)) return { ok: false, status: 429, payload: TAVILY_CREDITS_429 };
      if (groqUrl(url)) return { ok: false, status: 429, payload: GROQ_TPD_429 };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });
    await callGroundedSearch("research").catch(() => undefined);
    await callGroundedSearch("research").catch(() => undefined);
    // BOTH calls walked the full 3-model gemini ladder + the whole walk
    // (byte-identical to the pre-cooldown behavior minus nothing).
    expect(log.filter((c) => geminiKeyOk(c.url))).toHaveLength(6);
    expect(log.filter((c) => tavilyUrl(c.url))).toHaveLength(2);
    expect(log.filter((c) => groqUrl(c.url))).toHaveLength(4);
  });

  it("callGeminiGroundedSearch keeps its own contract (the existing ladder canary's twin)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      url.includes("gemini-3.5-flash:generateContent")
        ? { ok: false, status: 429, payload: QUOTA_429 }
        : { ok: true, status: 200, payload: GEMINI_GROUNDED_OK },
    );
    const out = await callGeminiGroundedSearch("research");
    expect(out.provider).toBe("gemini");
    expect(out.model).toBe("gemini-3.8-flash");
    expect(log).toHaveLength(2);
  });
});
