import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  callGeminiGroundedSearch,
  GEMINI_GROUNDED_MODEL_LADDER,
} from "@/lib/ai-provider";

/**
 * BLOG-RECOVERY 2026-10-16 (RC2) — the grounded-search MODEL LADDER.
 *
 * Live evidence that forced it: GHA logs 2026-10-06 → 10-15 + the Gemini
 * weekly usage report (docs/ai/gemini-weekly-usage-report.md, week of
 * 2026-10-05) — `blog_research` 108 grounded attempts, 0 OK, 106 quota
 * (429 RESOURCE_EXHAUSTED) on gemini-3.5-flash, while NON-grounded calls
 * on the SAME key kept succeeding (evo-chat 9 OK, plans OK, aws-ai-test
 * real plan generation OK). Gemini bills every MODEL its own free-tier
 * quota bucket, so the ladder walks override → default → alternates and
 * ONE honest aggregate error fires only when EVERY grounded model is
 * drained. Every attempt stays a REAL grounded googleSearch call — the
 * honest ungrounded-200 gate runs per attempt (pinned in
 * ai-provider-gemini.test.ts), so nothing fake can pass as research.
 */

const ENV_KEYS = [
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "GEMINI_GROUNDED_MODELS",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

const GROUNDED_OK_PAYLOAD = {
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

const QUOTA_429_PAYLOAD = {
  error: {
    code: 429,
    message: "You exceeded your current quota, please check your plan and billing details.",
    status: "RESOURCE_EXHAUSTED",
  },
};

type FetchLog = { url: string; body?: Record<string, unknown> };

/** Route per-URL: fn(url) → {ok,status,payload}. Records every call. */
function stubRoutingFetch(
  log: FetchLog[],
  route: (url: string) => { ok: boolean; status: number; payload: unknown },
) {
  const fake = vi.fn(async (url: string, init?: RequestInit) => {
    log.push({ url, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    const r = route(url);
    return {
      ok: r.ok,
      status: r.status,
      json: async () => r.payload,
      text: async () => JSON.stringify(r.payload),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fake);
}

beforeEach(() => cleanEnv());
afterEach(() => {
  cleanEnv();
  vi.unstubAllGlobals();
});

describe("RC2 — grounded-search model ladder (registry + export shape)", () => {
  it("the ladder is exported with cross-family alternates (flash → pro → lite — separate quota buckets)", () => {
    expect(GEMINI_GROUNDED_MODEL_LADDER).toContain("gemini-3.8-flash");
    expect(GEMINI_GROUNDED_MODEL_LADDER).toContain("gemini-3.8-pro");
    expect(GEMINI_GROUNDED_MODEL_LADDER).toContain("gemini-3.5-flash-lite");
    expect(GEMINI_GROUNDED_MODEL_LADDER).not.toContain("gemini-3.5-flash"); // default leads, never duplicated
    expect(GEMINI_GROUNDED_MODEL_LADDER).not.toContain("gemini-2.5-flash"); // retired 404 for new keys (live-probed 2026-10-16)
  });
});

describe("RC2 — a drained quota bucket falls through to the NEXT real grounded model", () => {
  it("429 on the default → gemini-3.8-flash answers (2 fetches, result names the model that worked)", async () => {
    process.env.GEMINI_API_KEY = "AIza-ladder-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      url.includes("gemini-3.5-flash")
        ? { ok: false, status: 429, payload: QUOTA_429_PAYLOAD }
        : { ok: true, status: 200, payload: GROUNDED_OK_PAYLOAD },
    );
    const out = await callGeminiGroundedSearch("research", { tag: "blog:research" });
    expect(out.model).toBe("gemini-3.8-flash");
    expect(out.provider).toBe("gemini");
    expect(out.text).toBe('{"keywords":[],"faqs":[],"topics":["t"]}');
    expect(out.grounding.searchQueries).toEqual(["how much protein per day"]);
    // exactly two REAL grounded calls (default 429 → next model), both
    // carrying the googleSearch tool — no ungrounded substitute anywhere.
    expect(log).toHaveLength(2);
    expect(log[0].url).toContain("/models/gemini-3.5-flash:generateContent");
    expect(log[1].url).toContain("/models/gemini-3.8-flash:generateContent");
    expect(log[0].body?.tools).toEqual([{ googleSearch: {} }]);
    expect(log[1].body?.tools).toEqual([{ googleSearch: {} }]);
  });

  it("default AND 3.8-flash drained → gemini-3.8-pro answers (3 fetches)", async () => {
    process.env.GEMINI_API_KEY = "AIza-ladder-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      url.includes("gemini-3.5-flash:generateContent") || url.includes("gemini-3.8-flash:generateContent")
        ? { ok: false, status: 429, payload: QUOTA_429_PAYLOAD }
        : { ok: true, status: 200, payload: GROUNDED_OK_PAYLOAD },
    );
    const out = await callGeminiGroundedSearch("research");
    // flash:generateContent guards the exact model — 3.5-flash-LITE must NOT match it
    expect(out.model).toBe("gemini-3.8-pro");
    expect(log.map((c) => c.url)).toEqual([
      expect.stringContaining("/models/gemini-3.5-flash:generateContent"),
      expect.stringContaining("/models/gemini-3.8-flash:generateContent"),
      expect.stringContaining("/models/gemini-3.8-pro:generateContent"),
    ]);
  });

  it("GEMINI_MODEL override leads the ladder (its bucket is tried first)", async () => {
    process.env.GEMINI_API_KEY = "AIza-ladder-key";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, (url) =>
      url.includes("gemini-2.5-flash")
        ? { ok: false, status: 429, payload: QUOTA_429_PAYLOAD }
        : { ok: true, status: 200, payload: GROUNDED_OK_PAYLOAD },
    );
    const out = await callGeminiGroundedSearch("research");
    // override drained → default answered; the dedup keeps 2.5-flash from
    // re-appearing in the tail (one bucket = one try per ladder walk).
    expect(out.model).toBe("gemini-3.5-flash");
    expect(log[0].url).toContain("/models/gemini-2.5-flash:generateContent");
    expect(log).toHaveLength(2);
  });

  it("GEMINI_GROUNDED_MODELS (ops knob) replaces the built-in tail without a deploy", async () => {
    process.env.GEMINI_API_KEY = "AIza-ladder-key";
    process.env.GEMINI_GROUNDED_MODELS = "gemini-x-flash, gemini-y-flash";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: false, status: 429, payload: QUOTA_429_PAYLOAD }));
    await expect(callGeminiGroundedSearch("research")).rejects.toThrow(/ALL grounded models failed/);
    expect(log.map((c) => c.url)).toEqual([
      expect.stringContaining("/models/gemini-3.5-flash:generateContent"),
      expect.stringContaining("/models/gemini-x-flash:generateContent"),
      expect.stringContaining("/models/gemini-y-flash:generateContent"),
    ]);
  });
});

describe("RC2 — every model drained → ONE honest aggregate error (real-search law intact)", () => {
  it("names every tried model + per-model statuses, and never falls back to a non-grounded path", async () => {
    process.env.GEMINI_API_KEY = "AIza-ladder-key";
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: false, status: 429, payload: QUOTA_429_PAYLOAD }));
    const err = (await callGeminiGroundedSearch("research").catch((e: Error) => e)) as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/ALL grounded models failed/);
    expect(err.message).toContain("gemini-3.5-flash");
    expect(err.message).toContain("gemini-3.8-flash");
    expect(err.message).toContain("gemini-3.8-pro");
    expect(err.message).toContain("gemini-3.5-flash-lite");
    expect(err.message).toContain("AI API error 429");
    // the owner-order law stays in the message: no substitute allowed
    expect(err.message).toContain("no simulated/curated substitute");
    // four REAL grounded attempts — the loop is bounded by the ladder
    expect(log).toHaveLength(4);
  });

  it("an ungrounded-200 on EVERY model still fails honestly (the per-attempt gate survives the ladder)", async () => {
    process.env.GEMINI_API_KEY = "AIza-ladder-key";
    stubRoutingFetch(log_unused(), () => ({
      ok: true,
      status: 200,
      payload: { candidates: [{ content: { parts: [{ text: "answers from memory" }] } }] },
    }));
    await expect(callGeminiGroundedSearch("research")).rejects.toThrow(
      /no Google-Search grounding evidence[\s\S]*not built on live search/,
    );
  });

  it("no GEMINI_API_KEY → the configuration error fires BEFORE any model is tried", async () => {
    const log: FetchLog[] = [];
    stubRoutingFetch(log, () => ({ ok: true, status: 200, payload: GROUNDED_OK_PAYLOAD }));
    await expect(callGeminiGroundedSearch("research")).rejects.toThrow(
      /GEMINI_API_KEY is not configured[\s\S]*no simulated\/curated substitute/,
    );
    expect(log).toHaveLength(0);
  });
});

function log_unused(): FetchLog[] {
  return [];
}
