import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { callGroundedSearch } from "@/lib/ai-provider";
import {
  __resetCooldownForTests,
  activeCooldowns,
} from "@/lib/ai-provider-cooldown";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * BLOG-RECOVERY 2026-10-20 — the Groq grounded-arm RECOVERY LAWS.
 *
 * Live evidence that forced them (AR run 39403516194 — the 15th
 * consecutive daily failure — plus the 14 dailies before it and the
 * 2026-10-20 probe run 39436703538):
 *
 *   1. HINT-LESS PER-MINUTE 429s: Groq's «Rate limit reached for model …
 *      in organization …» shell does NOT always carry the literal «tokens
 *      per minute»/TPM wording (the RPM sibling carries only the visit
 *      link). The old TPM-only detector misread them as sustained
 *      exhaustion → markCooldown poisoned grounded:groq:<model> for 30
 *      minutes → the ×3 step retries collapsed to instant skips → the
 *      run died. LAW: a 429 is SUSTAINED only when its body carries
 *      DAILY markers (tokens-per-day / Limit-Used numbers without
 *      per-minute wording / hours-scale «try again» hints); everything
 *      else is a per-minute transient → patient wait + retry, NEVER a
 *      registry cooldown.
 *   2. The agentic «Tool call validation failed» 400 — measured on the
 *      EN twin (gpt-oss-20b: «attempted to call tool 'assistant…'») — is
 *      a one-shot quirk: pause + re-walk the SAME model.
 *   3. A 200-EMPTY (or evidence-less) walk right after a sibling grounded
 *      call on the same free-tier bucket is the measured starvation shape
 *      (the EN twin, 5s after the AR walk's success): ONE pause +
 *      re-walk before the honest failure. Every retry is still a REAL
 *      browser_search call; the evidence gate runs per attempt.
 */

const ENV_KEYS = [
  "GEMINI_API_KEY",
  "GEMINI_API_KEY2",
  "OPENROUTER_API",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "NVIDIA_API_KEY",
  "AI_PROVIDER_COOLDOWN_MS",
  "AI_PROVIDER_COOLDOWN",
  "AI_COOLDOWN_STATE_FILE",
] as const;

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

let stateFile = "";

beforeEach(() => {
  cleanEnv();
  stateFile = join(mkdtempSync(join(tmpdir(), "gr-")), "cooldown.json");
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

/* ── Fixtures — the LIVE-MEASURED groq error bodies ──────────────────── */

/** The RPM-variant shell: rate limit, NO per-minute wording, NO hint —
 *  the exact class that killed 15 daily runs (misread as exhaustion). */
const RPM_UNMARKED_429 = {
  error: {
    message:
      "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_01kz0ywxa5f9ctgnjk3gq3ed`. Visit https://console.groq.com/docs/rate-limits for more information.",
    type: "rate_limit_error",
  },
};

/** The TPM variant (probe run 39061337401) — per-minute wording + numbers
 *  + seconds hint: still per-minute, still never a cooldown. */
const TPM_HINTED_429 = {
  error: {
    message:
      "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_x` service tier `on_demand` on tokens per minute (TPM): Limit 8000, Used 7541, Requested 4146. Please try again in 0.01s.",
    type: "rate_limit_error",
  },
};

/** The DAILY variant (the GROQ-2 diagnosis law) — tokens-per-day + numbers
 *  + hours-scale hint: SUSTAINED exhaustion → throw + 30-min cooldown. */
const TPD_DAILY_429 = {
  error: {
    message:
      "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_x` service tier `on_demand` on tokens per day (TPD): Limit 200,000, Used 198,932, Requested 4,000. Please try again in 4h 2m 3s.",
    type: "rate_limit_error",
  },
};

/** The agentic quirk 400 — measured on the EN twin (39403516194). */
const TOOL_VALIDATION_400 = {
  error: {
    message:
      "Tool call validation failed: tool call validation failed: attempted to call tool 'assistant_reply' with invalid arguments",
    type: "invalid_request_error",
  },
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
                { title: "Physical activity", url: "https://www.who.int/physical-activity", content: "", score: 0 },
                { title: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/22150333", content: "", score: 0 },
              ],
            },
          },
        ],
      },
    },
  ],
};

/** The starvation shape: 200 with EMPTY content and no evidence. */
const GROQ_EMPTY_200 = { choices: [{ message: { content: "" } }] };

const QUOTA_429_GEMINI = {
  error: { code: 429, message: "You exceeded your current quota", status: "RESOURCE_EXHAUSTED" },
};
const CREDITS_402 = {
  error: { code: 402, message: "Insufficient credits. This account never purchased credits." },
};

type FetchLog = { url: string; auth?: string; body?: Record<string, unknown> };
type RouteResult = { ok: boolean; status: number; payload: unknown };
type Route = (url: string, auth: string) => RouteResult;

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

/** The 2026-10-20 production reality for the walk's first two arms. */
function deadGeminiAndOpenRouter(url: string): RouteResult | null {
  if (geminiKeyOk(url)) return { ok: false, status: 429, payload: QUOTA_429_GEMINI };
  if (orUrl(url)) return { ok: false, status: 402, payload: CREDITS_402 };
  return null;
}

/* ══════════════════════════════════════════════════════════════════════
 * LAW 1 — per-minute 429s (hinted AND hint-less) retry patiently and
 *        NEVER cool the 30-min registry.
 * ═════════════════════════════════════════════════════════════════════ */
describe("BLOG-RECOVERY 2026-10-20 — per-minute 429 classification law", () => {
  it(
    "HINT-LESS RPM 429 → patient retry → groq answers; the model is NEVER cooled",
    { timeout: 40_000 },
    async () => {
      process.env.GEMINI_API_KEY = "AIza-test-key";
      process.env.OPENROUTER_API = "sk-or-test-key";
      process.env.GROQ_API_KEY = "gsk-test-key";
      const log: FetchLog[] = [];
      let groqCall = 0;
      stubRoutingFetch(log, (url) => {
        const dead = deadGeminiAndOpenRouter(url);
        if (dead) return dead;
        groqCall++;
        return groqCall === 1
          ? { ok: false, status: 429, payload: RPM_UNMARKED_429 }
          : { ok: true, status: 200, payload: GROQ_BROWSER_OK };
      });
      const out = await callGroundedSearch("research");
      expect(out.provider).toBe("groq");
      expect(out.model).toBe("openai/gpt-oss-120b");
      const groqCalls = log.filter((c) => groqUrl(c.url));
      expect(groqCalls).toHaveLength(2); // unmarked 429 → waited default 15s+3s → retry → 200
      // THE law: the per-minute class must NEVER poison the registry
      const cds = activeCooldowns();
      expect(cds.some((c) => c.scope.startsWith("grounded:groq:"))).toBe(false);
    },
  );

  it(
    "hinted TPM 429 (per-minute wording + numbers + seconds hint) → retry → groq answers; never cooled",
    { timeout: 20_000 },
    async () => {
      process.env.GEMINI_API_KEY = "AIza-test-key";
      process.env.OPENROUTER_API = "sk-or-test-key";
      process.env.GROQ_API_KEY = "gsk-test-key";
      const log: FetchLog[] = [];
      let groqCall = 0;
      stubRoutingFetch(log, (url) => {
        const dead = deadGeminiAndOpenRouter(url);
        if (dead) return dead;
        groqCall++;
        return groqCall === 1
          ? { ok: false, status: 429, payload: TPM_HINTED_429 }
          : { ok: true, status: 200, payload: GROQ_BROWSER_OK };
      });
      const out = await callGroundedSearch("research");
      expect(out.provider).toBe("groq");
      expect(log.filter((c) => groqUrl(c.url))).toHaveLength(2);
      expect(activeCooldowns().some((c) => c.scope.startsWith("grounded:groq:"))).toBe(false);
    },
  );

  it("DAILY 429 (tokens per day + Limit/Used + hours hint) → NO retry, honest throw, 30-min cooldown", { timeout: 15_000 }, async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.AI_PROVIDER_COOLDOWN_MS = "1800000";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      const dead = deadGeminiAndOpenRouter(url);
      if (dead) return dead;
      return { ok: false, status: 429, payload: TPD_DAILY_429 };
    });
    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("every grounded-search arm failed");
    expect(err.message).toContain("tokens per day");
    // exactly ONE network call PER LADDER MODEL — a daily class never
    // burns a patient retry (3 models: 120b leader + 20b + safeguard —
    // the round-3 third bucket)
    expect(log.filter((c) => groqUrl(c.url))).toHaveLength(3);
    // and it cools every scope: the next walk skips all of them without a call
    const cds = activeCooldowns();
    expect(cds.some((c) => c.scope === "grounded:groq:openai/gpt-oss-120b")).toBe(true);
    expect(cds.some((c) => c.scope === "grounded:groq:openai/gpt-oss-20b")).toBe(true);
    expect(cds.some((c) => c.scope === "grounded:groq:openai/gpt-oss-safeguard-20b")).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════
 * LAW 4 — the round-3 THIRD TPD bucket: 120b AND 20b drained to their
 * TPD edge (measured 2026-10-20: 199.4k+/200k both) → safeguard-20b
 * (fresh bucket) answers — the exact measured live scenario.
 * ═════════════════════════════════════════════════════════════════ */
describe("BLOG-RECOVERY-2 round-3 — the safeguard-20b third TPD bucket", () => {
  it("120b AND 20b TPD-drained in the SAME walk → the fresh safeguard bucket answers (the exact measured 2026-10-20 live scenario)", { timeout: 20_000 }, async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    process.env.AI_PROVIDER_COOLDOWN_MS = "1800000";
    const log: FetchLog[] = [];
    // Body-model routing (the real scenario: per-MODEL TPD buckets):
    // 120b + 20b answer the daily-limit body; the fresh safeguard bucket
    // answers with a REAL browser_search walk (executed_tools + sources).
    const fake = vi.fn(async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const auth = headers.get("authorization") || "";
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      log.push({ url, auth, body });
      let ok = true;
      let status = 200;
      let payload: unknown = GROQ_BROWSER_OK;
      if (geminiKeyOk(String(url))) {
        ok = false; status = 429; payload = QUOTA_429_GEMINI;
      } else if (orUrl(String(url))) {
        ok = false; status = 402; payload = CREDITS_402;
      } else if (body.model === "openai/gpt-oss-120b" || body.model === "openai/gpt-oss-20b") {
        // the LIVE measured state of 2026-10-20 (probe 39445715096):
        // both gpt-oss buckets at their 199.4k+/200k TPD edge
        ok = false; status = 429; payload = TPD_DAILY_429;
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
    expect(out.model).toBe("openai/gpt-oss-safeguard-20b");
    expect(out.grounding.sources.length).toBeGreaterThanOrEqual(2);
    // the walk: 120b TPD-drained → 20b TPD-drained → safeguard's REAL walk
    const groqModels = log
      .filter((c) => groqUrl(c.url))
      .map((c) => String((c.body as { model?: string }).model));
    expect(groqModels).toEqual([
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "openai/gpt-oss-safeguard-20b",
    ]);
    // the daily-class drains cool ONLY the drained buckets — safeguard stays free
    const cds = activeCooldowns();
    expect(cds.some((c) => c.scope === "grounded:groq:openai/gpt-oss-120b")).toBe(true);
    expect(cds.some((c) => c.scope === "grounded:groq:openai/gpt-oss-20b")).toBe(true);
    expect(cds.some((c) => c.scope === "grounded:groq:openai/gpt-oss-safeguard-20b")).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * LAW 2 — the agentic «Tool call validation failed» 400 retries once.
 * ═════════════════════════════════════════════════════════════════════ */
describe("BLOG-RECOVERY 2026-10-20 — tool-call-validation 400 recovery", () => {
  it("400 «Tool call validation failed» → pause + re-walk the SAME model → groq answers", { timeout: 20_000 }, async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    let groqCall = 0;
    stubRoutingFetch(log, (url) => {
      const dead = deadGeminiAndOpenRouter(url);
      if (dead) return dead;
      groqCall++;
      return groqCall === 1
        ? { ok: false, status: 400, payload: TOOL_VALIDATION_400 }
        : { ok: true, status: 200, payload: GROQ_BROWSER_OK };
    });
    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.model).toBe("openai/gpt-oss-120b");
    const groqCalls = log.filter((c) => groqUrl(c.url));
    expect(groqCalls).toHaveLength(2); // the quirk → one re-walk → success
    // both walks stay REAL browser_search calls with the same reasoning_format
    expect((groqCalls[0].body as { tools?: unknown }).tools).toEqual([{ type: "browser_search" }]);
    expect((groqCalls[1].body as { tools?: unknown }).tools).toEqual([{ type: "browser_search" }]);
  });
});

/* ══════════════════════════════════════════════════════════════════════
 * LAW 3 — the 200-empty starvation shape re-walks once before failing.
 * ═════════════════════════════════════════════════════════════════════ */
describe("BLOG-RECOVERY 2026-10-20 — 200-empty starvation recovery", () => {
  it("200-empty right after a sibling walk → pause + re-walk → groq answers with evidence", { timeout: 20_000 }, async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    let groqCall = 0;
    stubRoutingFetch(log, (url) => {
      const dead = deadGeminiAndOpenRouter(url);
      if (dead) return dead;
      groqCall++;
      return groqCall === 1
        ? { ok: true, status: 200, payload: GROQ_EMPTY_200 }
        : { ok: true, status: 200, payload: GROQ_BROWSER_OK };
    });
    const out = await callGroundedSearch("research");
    expect(out.provider).toBe("groq");
    expect(out.grounding.sources.length).toBeGreaterThanOrEqual(2);
    expect(log.filter((c) => groqUrl(c.url))).toHaveLength(2); // empty → one re-walk → evidence
  });

  it("200-empty on EVERY attempt → the honest evidence-gate failure still fires (never a fake pass)", { timeout: 20_000 }, async () => {
    process.env.GEMINI_API_KEY = "AIza-test-key";
    process.env.OPENROUTER_API = "sk-or-test-key";
    process.env.GROQ_API_KEY = "gsk-test-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) => {
      const dead = deadGeminiAndOpenRouter(url);
      if (dead) return dead;
      return { ok: true, status: 200, payload: GROQ_EMPTY_200 };
    });
    const err = (await callGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err.message).toContain("an empty response");
    expect(err.message).toContain("not built on live search");
    // bounded: 3 REAL walks on the leader + the 20b sibling's ladder walk
    expect(log.filter((c) => groqUrl(c.url)).length).toBeGreaterThanOrEqual(3);
  });
});
