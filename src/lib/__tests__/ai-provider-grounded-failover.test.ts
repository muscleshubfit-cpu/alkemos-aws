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
 *     groq(compound) — NVIDIA NEVER receives a grounded call (no
 *     grounded-search capability; honestly excluded).
 *   • Every arm is a REAL search call (plugin body / compound model) and
 *     every arm enforces the honest live-evidence gate — a 200 without
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

const GROQ_COMPOUND_OK = {
  choices: [
    {
      message: {
        content: "Compound answer grounded on live web search.",
        citations: [
          "https://www.nasm.org/protein-intake",
          "https://pubmed.ncbi.nlm.nih.gov/22150333",
        ],
      },
    },
  ],
};

const GROQ_COMPOUND_OK_XGROQ = {
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

    // walk order: 4 REAL gemini grounded attempts (the ladder), then ONE
    // openrouter web call — groq/nvidia NEVER called.
    expect(log).toHaveLength(5);
    expect(log.slice(0, 4).every((c) => geminiKeyOk(c.url))).toBe(true);
    expect(orUrl(log[4].url)).toBe(true);
    expect(log.some((c) => groqUrl(c.url) || nvidiaUrl(c.url))).toBe(false);
    // the openrouter attempt IS a real search call: web plugin in the body,
    // NO response_format (STRICT-JSON prompt contract carries JSON).
    expect(log[4].body?.plugins).toEqual([{ id: "web", max_results: 5 }]);
    expect(log[4].body?.response_format).toBeUndefined();
    expect(log[4].auth).toBe("Bearer sk-or-test-key");
  });

  it("gemini 429 + openrouter 402 (no plugin credits) → groq compound answers with citations", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return { ok: true, status: 200, payload: GROQ_COMPOUND_OK };
    });

    const out = await callGroundedSearch("research", { tag: "blog:research" });

    expect(out.provider).toBe("groq");
    expect(out.model).toBe("compound-beta");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.nasm.org/protein-intake",
      "https://pubmed.ncbi.nlm.nih.gov/22150333",
    ]);
    // 4 gemini + 1 openrouter + 1 groq, NVIDIA never called
    expect(log).toHaveLength(6);
    expect(groqUrl(log[5].url)).toBe(true);
    expect(log.some((c) => nvidiaUrl(c.url))).toBe(false);
    // groq compound body: NO manual tools/plugins (search is built into the
    // compound system), NO response_format
    expect(log[5].body?.tools).toBeUndefined();
    expect(log[5].body?.plugins).toBeUndefined();
    expect(log[5].body?.response_format).toBeUndefined();
    expect(log[5].auth).toBe("Bearer gsk-test-key");
  });

  it("groq citations are also accepted from x_groq (documented location #2)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return { ok: true, status: 200, payload: GROQ_COMPOUND_OK_XGROQ };
    });

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.grounding.sources.map((s) => s.url)).toEqual([
      "https://www.issn.org/position-stand",
    ]);
    expect(out.grounding.sources[0].title).toBe("ISSN");
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

  it("the OR arm enforces a 6000-token floor (LIVE-PROBED run 38843887341: a 400 cap dies inside the reasoning CoT before content/annotations)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      geminiKeyOk(url)
        ? { ok: false, status: 429, payload: QUOTA_429 }
        : { ok: true, status: 200, payload: OR_WEB_OK },
    );
    await callGroundedSearch("research", { maxTokens: 400 });
    expect(log[4].body?.max_tokens).toBe(6000);
    // a caller above the floor keeps their own value (never clamped DOWN)
    await callGroundedSearch("research", { maxTokens: 7000 });
    expect(log[9].body?.max_tokens).toBe(7000);
  });

  it("all three arms fail → ONE honest aggregate error; NVIDIA never receives a call", async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
      return { ok: false, status: 429, payload: QUOTA_429 };
    });

    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("every grounded-search arm failed");
    expect(err.message).toContain("gemini(googleSearch)");
    expect(err.message).toContain("openrouter(web plugin)");
    expect(err.message).toContain("groq(compound)");
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
    process.env.GROQ_GROUNDED_MODEL = "groq/custom-compound";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429 };
      if (orUrl(url)) return { ok: true, status: 200, payload: OR_WEB_OK };
      return { ok: true, status: 200, payload: GROQ_COMPOUND_OK };
    });

    const orOut = await callGroundedSearch("research");
    expect(orOut.provider).toBe("openrouter");
    expect(orOut.model).toBe("custom/or-model:free");
    expect(String(log[4].body?.model)).toBe("custom/or-model:free");

    const groqOut = await callGroqGroundedSearch("research");
    expect(groqOut.model).toBe("groq/custom-compound");
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
      return { ok: true, status: 200, payload: GROQ_COMPOUND_OK };
    });

    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq"); // the ungrounded OR answer did NOT pass
    expect(orUrl(log[4].url)).toBe(true);
    expect(groqUrl(log[5].url)).toBe(true);
  });

  it("groq 200 WITHOUT citations fails the gate → the aggregate reports it honestly", async () => {
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
    expect(err.message).toContain("no web-search evidence (citation URLs)");
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
    expect(log).toHaveLength(5); // 4 futile gemini 429s + 1 OR success

    const out2 = await callGroundedSearch("research");
    expect(out2.provider).toBe("openrouter");
    // the second call made ZERO gemini attempts — the whole drained ladder
    // was skipped from cooldown memory
    const call2 = log.slice(5);
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
      return { ok: false, status: 429, payload: QUOTA_429 };
    });

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    const call1Fetches = log.length;
    expect(call1Fetches).toBe(6); // 4 + 1 + 1

    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toMatch(/quota-cooldown until .+ — skipped, no call made/);
    expect(err.message).toContain("ACTIVE COOLDOWNS");
    expect(err.message).toContain("grounded:gemini:key#1:gemini-3.5-flash");
    expect(err.message).toContain("grounded:openrouter:key#1");
    expect(err.message).toContain("grounded:groq:compound-beta");
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
    expect(log.slice(0, 4).every((c) => geminiKeyOk(c.url))).toBe(true);

    await expect(callGroundedSearch("research")).rejects.toThrow(/every grounded-search arm failed/);
    // gemini was re-attempted (4 more REAL calls) — 503 stays retryable
    const call2Gemini = log.slice(call1Fetches).filter((c) => geminiKeyOk(c.url));
    expect(call2Gemini).toHaveLength(4);
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
    // both calls walked the full gemini ladder (rollback knob = old walk)
    expect(log.filter((c) => geminiKeyOk(c.url))).toHaveLength(8);
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
    expect(log.slice(5)).toHaveLength(1);
    expect(log.slice(5).every((c) => orUrl(c.url))).toBe(true);
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
    expect(out.model).toBe("nvidia/nemotron-3-super-120b-a12b");
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
    // BOTH calls walked the full 4-model ladder (byte-identical to the
    // pre-2026-10-16 walk — the registry is a no-op without the env)
    expect(log.filter((c) => geminiKeyOk(c.url))).toHaveLength(8);
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
