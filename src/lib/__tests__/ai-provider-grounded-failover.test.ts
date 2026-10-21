import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  callGroundedSearch,
  callGeminiGroundedSearch,
  callOpenRouterGroundedSearch,
  callGroqGroundedSearch,
  callFreeAIFallbackChain,
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
 * Pinned here:
 *   • The walk order gemini(googleSearch) → openrouter(web plugin) →
 *     groq(browser_search — GROQ-2 2026-10-17: the compound-successor
 *     built-in tool on the GPT-OSS ladder) — NVIDIA NEVER receives a
 *     grounded call (no grounded-search capability; honestly excluded).
 *   • Every arm is a REAL search call (plugin body / browser_search tool)
 *     and every arm enforces the honest live-evidence gate — a 200 without
 *     annotations/citations FAILS and falls through, never masquerades.
 *   • Quota-class failures cool the scope (AI_PROVIDER_COOLDOWN_MS opt-in):
 *     the second call SKIPS the drained arm with zero network calls, and
 *     the chain skips a drained provider WITHOUT consuming attempt budget
 *     (NVIDIA becomes reachable within the same maxModels).
 *   • Cooldown marks survive a process restart via the state file.
 */

const ENV_KEYS = [
  "GEMINI_API_KEY",
  "GEMINI_API_KEY2",
  "GEMINI_MODEL",
  "GEMINI_GROUNDED_MODELS",
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NVIDIA_API_KEY",
  "OPENROUTER_GROUNDED_MODEL",
  "GROQ_GROUNDED_MODEL",
  "GROQ_GROUNDED_MODELS",
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

type FetchLog = { url: string; auth?: string; body?: Record<string, unknown> };

type RouteResult = { ok: boolean; status: number; payload: unknown };
type Route = (url: string, auth: string) => RouteResult;

/** Route by URL + auth header; records every call (url, auth, body). */
function stubRoutingFetch(log: FetchLog[], route: Route) {
  const fake = vi.fn(async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const auth =
      headers.get("x-goog-api-key") || headers.get("authorization") || "";
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

/* ══════════════════════════════════════════════════════════════════════
 * 1. The cross-provider walk — provider transition on quota drain
 *    (cooldown OFF: pure failover mechanics, canaries' default env)
 * ═════════════════════════════════════════════════════════════════════ */

describe("cross-provider walk — gemini quota drain moves to openrouter web", () => {
  it("gemini 429 everywhere → openrouter web plugin answers with REAL annotation evidence", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      geminiKeyOk(url)
        ? { ok: false, status: 429, payload: QUOTA_429 }
        : { ok: true, status: 200, payload: OR_WEB_OK },
    );

    const out = await callGroundedSearch("research", { tag: "blog:research" });

    expect(out.provider).toBe("openrouter");
    expect(out.model).toBe("nvidia/nemotron-3-super-120b-a12b:free");
    expect(out.text).toContain("1.6 g/kg");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://examine.com/protein",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    expect(out.grounding.sources[0].title).toBe("Protein | Examine");

    // walk order: 3 REAL gemini grounded attempts (the ladder — 3.8-pro
    // retired 2026-10-20: measured 404 on the live key), then ONE
    // openrouter web call — groq/nvidia NEVER called.
    expect(log).toHaveLength(4);
    expect(log.slice(0, 3).every((c) => geminiKeyOk(c.url))).toBe(true);
    expect(orUrl(log[3].url)).toBe(true);
    expect(log.some((c) => groqUrl(c.url) || nvidiaUrl(c.url))).toBe(false);
    // the openrouter attempt IS a real search call: web plugin in the body,
    // NO response_format (STRICT-JSON prompt contract carries JSON).
    expect(log[3].body?.plugins).toEqual([{ id: "web", max_results: 5 }]);
    expect(log[3].body?.response_format).toBeUndefined();
    expect(log[3].auth).toBe("Bearer sk-or-test-key");
  });

  it("gemini 429 + openrouter 402 (no plugin credits) → groq browser_search answers with citations", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return { ok: true, status: 200, payload: GROQ_BROWSER_OK };
    });

    const out = await callGroundedSearch("research", { tag: "blog:research" });

    expect(out.provider).toBe("groq");
    expect(out.model).toBe("openai/gpt-oss-120b");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.nasm.org/protein-intake",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    // 3 gemini + 1 openrouter + 1 groq, NVIDIA never called
    expect(log).toHaveLength(5);
    expect(groqUrl(log[4].url)).toBe(true);
    expect(log.some((c) => nvidiaUrl(c.url))).toBe(false);
    // groq browser_search body: the built-in tool rides the call (the REAL
    // search ride-along — GROQ-2), reasoning_format hidden (GPT-OSS law),
    // NO response_format (STRICT-JSON prompt contract carries JSON)
    expect(log[4].body?.tools).toEqual([{ type: "browser_search" }]);
    expect(log[4].body?.reasoning_format).toBe("hidden");
    expect(log[4].body?.plugins).toBeUndefined();
    expect(log[4].body?.response_format).toBeUndefined();
    expect(log[4].auth).toBe("Bearer gsk-test-key");
  });

  it("groq legacy message.citations shape still answers (documented location #1)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return { ok: true, status: 200, payload: GROQ_BROWSER_OK_CITED };
    });

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.nasm.org/protein-intake",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
  });

  it("groq 400 «Parsing failed» under reasoning_format hidden → flips to parsed and succeeds (LIVE-MEASURED split, run 39061588932)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
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
      if (geminiKeyOk(String(url))) {
        ok = false; status = 429; payload = QUOTA_429;
      } else if (orUrl(String(url))) {
        ok = false; status = 402; payload = CREDITS_402;
      } else if (body.reasoning_format === "hidden") {
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
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
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
      if (geminiKeyOk(String(url))) {
        ok = false; status = 429; payload = QUOTA_429;
      } else if (orUrl(String(url))) {
        ok = false; status = 402; payload = CREDITS_402;
      } else {
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
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return { ok: true, status: 200, payload: GROQ_BROWSER_OK_XGROQ };
    });

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.issn.org/position-stand",
    ]);
    expect(out.grounding.sources[0].title).toBe("ISSN");
  });

  it("groq ladder: the leader 404s (dead id) → gpt-oss-20b answers (the GROQ-2 compound-decommission law)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
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
      if (geminiKeyOk(String(url))) {
        ok = false;
        status = 429;
        payload = QUOTA_429;
      } else if (orUrl(String(url))) {
        ok = false;
        status = 402;
        payload = CREDITS_402;
      } else if (body.model === "openai/gpt-oss-120b") {
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

  it("openrouter reasoning models: empty content + reasoning_details + annotations still answers (LIVE-PROBED run 38843366143)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      return {
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
      };
    });

    const out = await callGroundedSearch("research", { maxTokens: 400 });
    expect(out.provider).toBe("openrouter");
    expect(out.text).toContain("150-300 minutes");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    ]);
  });

  it("the OR arm enforces a 10000-token floor (LIVE-PROBED: 400 dies inside the reasoning CoT; 6000 truncates the ARABIC research mid-JSON — kw:10/topics:0, run 38849540488)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      geminiKeyOk(url)
        ? { ok: false, status: 429, payload: QUOTA_429 }
        : { ok: true, status: 200, payload: OR_WEB_OK },
    );
    await callGroundedSearch("research", { maxTokens: 400 });
    expect(log[3].body?.max_tokens).toBe(10000);
    // a caller above the floor keeps their own value (never clamped DOWN)
    await callGroundedSearch("research", { maxTokens: 12000 });
    expect(log[7].body?.max_tokens).toBe(12000);
  });

  it("all three arms fail → ONE honest aggregate error; NVIDIA never receives a call", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return { ok: false, status: 429, payload: GROQ_TPD_429 };
    });

    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("every grounded-search arm failed");
    expect(err.message).toContain("gemini(googleSearch)");
    expect(err.message).toContain("openrouter(web plugin)");
    expect(err.message).toContain("groq(browser_search)");
    expect(err.message).toContain("NVIDIA NIM has no grounded-search capability");
    expect(err.message).toContain("no simulated/curated substitute");
    expect(err.message).toContain("AI API error 429");
    expect(err.message).toContain("AI API error 402");
    // NVIDIA is excluded BY DESIGN — zero calls to integrate.api.nvidia.com
    expect(log.some((c) => nvidiaUrl(c.url))).toBe(false);
  });

  it("no keys configured → the aggregate names every arm's configuration error", async () => {
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: OR_WEB_OK }));
    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("GEMINI_API_KEY is not configured");
    expect(err.message).toContain("no OpenRouter key configured");
    expect(err.message).toContain("GROQ_API_KEY is not configured");
    expect(log).toHaveLength(0);
  });

  it("gemini healthy → arm 1 answers and openrouter/groq are never called", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: GEMINI_GROUNDED_OK }));
    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("gemini");
    expect(out.grounding.searchQueries).toEqual(["how much protein per day"]);
    expect(log).toHaveLength(1);
    expect(log.some((c) => orUrl(c.url) || groqUrl(c.url))).toBe(false);
  });

  it("ops knobs swap the arm models without a deploy (OPENROUTER_GROUNDED_MODEL / GROQ_GROUNDED_MODEL)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.OPENROUTER_GROUNDED_MODEL = "custom/or-model:free";
    process.env.GROQ_GROUNDED_MODEL = "groq/custom-browser";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: true, status: 200, payload: OR_WEB_OK };
      return { ok: true, status: 200, payload: GROQ_BROWSER_OK };
    });

    const orOut = await callGroundedSearch("research");
    expect(orOut.provider).toBe("openrouter");
    expect(orOut.model).toBe("custom/or-model:free");
    expect(String(log[3].body?.model)).toBe("custom/or-model:free");

    const groqOut = await callGroqGroundedSearch("research");
    expect(groqOut.model).toBe("groq/custom-browser");
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 2. The honest evidence gates — plain generation can NEVER masquerade
 * ═════════════════════════════════════════════════════════════════════ */

describe("honest evidence gates — no live-search evidence = honest failure", () => {
  it("openrouter 200 WITHOUT annotations fails the gate → the walk falls to groq", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) {
        return {
          ok: true,
          status: 200,
          payload: { choices: [{ message: { content: "answer from model memory" } }] },
        };
      }
      return { ok: true, status: 200, payload: GROQ_BROWSER_OK };
    });

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq"); // the ungrounded OR answer did NOT pass
    expect(orUrl(log[3].url)).toBe(true);
    expect(groqUrl(log[4].url)).toBe(true);
  });

  it("groq 200 WITHOUT citations fails the gate → the aggregate reports it honestly", { timeout: 20_000 }, async () => {
    // BLOG-RECOVERY 2026-10-20: the evidence-less 200 now re-walks the
    // SAME model twice (2s pauses) before the honest failure — the gate
    // itself is unchanged; the timeout covers the two pauses on slow CI.
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    stubRoutingFetch([], (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return {
        ok: true,
        status: 200,
        payload: { choices: [{ message: { content: "memory-only answer" } }] },
      };
    });
    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("no web-search evidence");
    expect(err.message).toContain("not built on live search");
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 3. The cooldown registry in the grounded walk («تجنب تكرار المحاولات
 *    الفاشلة») — OPT-IN via AI_PROVIDER_COOLDOWN_MS
 * ═════════════════════════════════════════════════════════════════════ */

describe("quota cooldown in the grounded walk (AI_PROVIDER_COOLDOWN_MS on)", () => {
  it("a 429-drained gemini ladder is SKIPPED on the second call — zero gemini fetches", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      geminiKeyOk(url)
        ? { ok: false, status: 429, payload: QUOTA_429 }
        : { ok: true, status: 200, payload: OR_WEB_OK },
    );

    const out1 = await callGroundedSearch("research");
    expect(out1.provider).toBe("openrouter");
    expect(log).toHaveLength(4); // 3 futile gemini 429s (post-3.8-pro ladder) + 1 OR success

    const out2 = await callGroundedSearch("research");
    expect(out2.provider).toBe("openrouter");
    // the second call made ZERO gemini attempts — the whole drained ladder
    // was skipped from cooldown memory
    const call2 = log.slice(4);
    expect(call2).toHaveLength(1);
    expect(call2.every((c) => orUrl(c.url))).toBe(true);
  });

  it("every arm drained → second call makes ZERO network calls and reports the skips honestly", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return { ok: false, status: 429, payload: GROQ_TPD_429 };
    });

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    const call1Fetches = log.length;
    expect(call1Fetches).toBe(6); // 3 gemini (post-3.8-pro ladder) + 1 openrouter + 2 groq ladder (120b/20b — safeguard removed round-4: 413 Request-too-large on the research prompt)

    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toMatch(/quota-cooldown until .+ — skipped, no call made/);
    expect(err.message).toContain("ACTIVE COOLDOWNS");
    expect(err.message).toContain("grounded:gemini:key#1:gemini-3.5-flash");
    expect(err.message).toContain("grounded:openrouter:key#1");
    expect(err.message).toContain("grounded:groq:openai/gpt-oss-120b");
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
    // gemini was re-attempted (3 more REAL calls — post-3.8-pro ladder) — 503 stays retryable
    const call2Gemini = log.slice(call1Fetches).filter((c) => geminiKeyOk(c.url));
    expect(call2Gemini).toHaveLength(3);
  });

  it("AI_PROVIDER_COOLDOWN=0 kill-switch restores the no-cooldown walk", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.AI_PROVIDER_COOLDOWN = "0";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      geminiKeyOk(url)
        ? { ok: false, status: 429, payload: QUOTA_429 }
        : { ok: true, status: 200, payload: OR_WEB_OK },
    );

    await callGroundedSearch("research");
    await callGroundedSearch("research");
    // both calls walked the full gemini ladder (rollback knob = old walk;
    // 2 × 3 models — post-3.8-pro ladder)
    expect(log.filter((c) => geminiKeyOk(c.url))).toHaveLength(6);
  });

  it("cooldown marks survive a process restart via the state file (cross-step persistence)", async () => {
    process.env.AI_PROVIDER_COOLDOWN_MS = "600000";
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      geminiKeyOk(url)
        ? { ok: false, status: 429, payload: QUOTA_429 }
        : { ok: true, status: 200, payload: OR_WEB_OK },
    );

    await callGroundedSearch("research");
    await flushCooldownWrites();
    // simulate the NEXT STEP's fresh process (run-step.mts runs each phase
    // as its own process): memory wiped, file on disk
    __resetCooldownForTests();

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("openrouter");
    // gemini skipped from the FILE state — only the OR call was made
    expect(log.slice(4)).toHaveLength(1);
    expect(log.slice(4).every((c) => orUrl(c.url))).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * 4. The generation chain (P1/P2/P4) — a drained provider is skipped
 *    WITHOUT consuming attempt budget, so the walk REACHES the next
 *    provider (incl. NVIDIA) inside the same maxModels budget
 * ═════════════════════════════════════════════════════════════════════ */

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

    // call 1: gemini 429 (marks chain:gemini) → openrouter answers
    const out1 = await callFreeAIFallbackChain("Reply PONG", {
      tag: "test:chain", maxTokens: 10, timeoutMs: 5_000, maxModels: 3,
    });
    expect(out1.provider).toBe("openrouter");
    const call1 = log.length;

    // call 2: openrouter now 429s too → marked; groq answers. gemini is
    // SKIPPED from call-1's cooldown — zero gemini fetches in call 2.
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
});

/* ══════════════════════════════════════════════════════════════════════
 * 5. Backward compatibility — cooldown OFF (no env) keeps the exact
 *    pre-failover walk (the canary law: existing behavior untouched)
 * ═════════════════════════════════════════════════════════════════════ */

describe("cooldown OFF (absent env) — pre-failover walk preserved", () => {
  it("the gemini ladder re-attempts every model on every call (no cooldown memory)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      geminiKeyOk(url)
        ? { ok: false, status: 429, payload: QUOTA_429 }
        : { ok: true, status: 200, payload: OR_WEB_OK },
    );
    await callGroundedSearch("research");
    await callGroundedSearch("research");
    // BOTH calls walked the full 3-model ladder (byte-identical to the
    // pre-2026-10-16 walk minus the retired 3.8-pro — the registry is a
    // no-op without the env)
    expect(log.filter((c) => geminiKeyOk(c.url))).toHaveLength(6);
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
