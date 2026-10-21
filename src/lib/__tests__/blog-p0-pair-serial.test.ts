import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  runBilingualResearchPair,
  p0PairGapMs,
  type Phase0Result,
} from "@/lib/blog-research";

/**
 * BLOG-RECOVERY 2026-10-20 — P0-PAIR-SERIAL (the bilingual double-walk
 * law).
 *
 * LIVE ROOT CAUSE (AR run 39403516194, the 15th consecutive daily
 * failure): the P0 CREATE path launched BOTH languages' grounded
 * research CONCURRENTLY (Promise.all) — with gemini's grounded quota
 * drained at project level and both OpenRouter keys answering 402 for
 * the web plugin, the two simultaneous walks BOTH landed on the single
 * remaining grounded arm (Groq browser_search, free tier). The AR walk
 * won (groq:120b, 95s, 12 live sources, kw:10/faq:10/topics:5); the EN
 * twin starved the same per-minute token/tool bucket → 200-empty on
 * 120b → 400 tool-call-validation on 20b → the step failed → the run's
 * ×3 retries collapsed against the 30-min cooldowns the cascade set.
 * The standalone single-call probe stayed GREEN the whole time — the
 * concurrent pipeline pair stayed RED.
 *
 * THE LAW pinned here: the pair runs SEQUENTIALLY (mine first, then the
 * twin), and when the first walk landed on the rate-limited groq arm the
 * twin waits out a recovery gap (default 90s — the 10-17 probe measured
 * a sequential second call succeeding ~45s after the first). A
 * non-groq landing inserts NO gap (gemini/openrouter arms carry their
 * own independent buckets). Ops knob: P0_PAIR_GAP_MS (0 = gap off,
 * serialization itself is unconditional).
 */

const ENV_KEYS = ["P0_PAIR_GAP_MS"] as const;

function cleanEnv() {
  for (const k of ENV_KEYS) delete process.env[k];
}

beforeEach(() => cleanEnv());
afterEach(() => cleanEnv());

function fakeResult(lang: "en" | "ar", source: string): Phase0Result {
  return {
    lang,
    research: { keywords: [], faqs: [], topics: ["t"] },
    category: "c",
    source,
  };
}

describe("P0-PAIR-SERIAL — the two languages NEVER walk concurrently", () => {
  it("sequential order [mine → twin], never overlapping (the Promise.all killer)", async () => {
    process.env.P0_PAIR_GAP_MS = "10";
    const events: string[] = [];
    const runner = async (l: "en" | "ar"): Promise<Phase0Result> => {
      events.push(`start:${l}`);
      await new Promise((r) => setTimeout(r, 30));
      events.push(`end:${l}`);
      return fakeResult(l, `p0-${l}:openrouter:nvidia/nemotron-3.5-lightning:free`);
    };
    const out = await runBilingualResearchPair("ar", "en", runner);
    expect(out.mine.lang).toBe("ar");
    expect(out.other?.lang).toBe("en");
    expect(out.twinError).toBeNull();
    // THE serialization invariant: mine fully ends BEFORE the twin starts
    expect(events).toEqual(["start:ar", "end:ar", "start:en", "end:en"]);
  });
});

describe("P0-PAIR-SERIAL — the groq recovery gap law", () => {
  it("first language landed on groq → the twin waits out the gap (elapsed ≥ gap)", async () => {
    process.env.P0_PAIR_GAP_MS = "150";
    let arEndedAt = 0;
    let enStartedAt = 0;
    const runner = async (l: "en" | "ar"): Promise<Phase0Result> => {
      if (l === "ar") {
        arEndedAt = Date.now();
        return fakeResult(l, "p0-ar:groq:openai/gpt-oss-120b");
      }
      enStartedAt = Date.now();
      return fakeResult(l, "p0-en:groq:openai/gpt-oss-120b");
    };
    await runBilingualResearchPair("ar", "en", runner);
    expect(enStartedAt - arEndedAt).toBeGreaterThanOrEqual(140); // 150ms gap (10ms timer tolerance)
  });

  it("first language landed on a NON-groq arm → NO gap (instant twin — independent bucket)", async () => {
    let arEndedAt = 0;
    let enStartedAt = 0;
    const runner = async (l: "en" | "ar"): Promise<Phase0Result> => {
      if (l === "ar") {
        arEndedAt = Date.now();
        return fakeResult(l, "p0-ar:gemini:gemini-3.5-flash");
      }
      enStartedAt = Date.now();
      return fakeResult(l, "p0-en:gemini:gemini-3.5-flash");
    };
    await runBilingualResearchPair("ar", "en", runner);
    expect(enStartedAt - arEndedAt).toBeLessThan(50); // default 90s gap must NOT fire for non-groq
  });

  it("P0_PAIR_GAP_MS=0 disables the gap for groq landings — serialization itself stays", async () => {
    process.env.P0_PAIR_GAP_MS = "0";
    const events: string[] = [];
    const runner = async (l: "en" | "ar"): Promise<Phase0Result> => {
      events.push(`run:${l}`);
      return fakeResult(l, `p0-${l}:groq:openai/gpt-oss-120b`);
    };
    await runBilingualResearchPair("ar", "en", runner);
    expect(events).toEqual(["run:ar", "run:en"]);
  });
});

describe("P0-PAIR-SERIAL round-5 — the twin-research legacy degradation", () => {
  it("the TWIN's research failure AFTER mine succeeded → mine is returned (other=null, twinError set) — the successful research is NEVER discarded", async () => {
    process.env.P0_PAIR_GAP_MS = "10";
    const twinError = new Error("AI API error 524 from groq (gateway timeout — the measured 39550847616 shape)");
    const runner = async (l: "en" | "ar"): Promise<Phase0Result> => {
      if (l === "en") throw twinError; // the twin dies
      return fakeResult(l, "p0-ar:groq:openai/gpt-oss-120b");
    };
    const out = await runBilingualResearchPair("ar", "en", runner);
    expect(out.mine.lang).toBe("ar"); // MY research survives
    expect(out.mine.source).toBe("p0-ar:groq:openai/gpt-oss-120b");
    expect(out.other).toBeNull();
    expect(out.twinError).toContain("524");
  });

  it("MY research failure still THROWS (the run cannot continue without its own research — the real-search law)", async () => {
    process.env.P0_PAIR_GAP_MS = "10";
    const runner = async (l: "en" | "ar"): Promise<Phase0Result> => {
      if (l === "ar") throw new Error("grounded search failed for ar");
      return fakeResult(l, "p0-en:groq:openai/gpt-oss-120b");
    };
    await expect(runBilingualResearchPair("ar", "en", runner)).rejects.toThrow("grounded search failed for ar");
  });

  it("both researches succeed → other present, twinError null (the full pair contract)", async () => {
    process.env.P0_PAIR_GAP_MS = "10";
    const runner = async (l: "en" | "ar"): Promise<Phase0Result> =>
      fakeResult(l, `p0-${l}:groq:openai/gpt-oss-120b`);
    const out = await runBilingualResearchPair("ar", "en", runner);
    expect(out.other?.lang).toBe("en");
    expect(out.twinError).toBeNull();
  });
});

describe("P0-PAIR-SERIAL — p0PairGapMs() knob contract", () => {
  it("defaults to 90s (the measured-safe recovery window)", () => {
    expect(p0PairGapMs()).toBe(90_000);
  });

  it("honors explicit values and clamps the ceiling at 10 minutes", () => {
    process.env.P0_PAIR_GAP_MS = "0";
    expect(p0PairGapMs()).toBe(0);
    process.env.P0_PAIR_GAP_MS = "12345";
    expect(p0PairGapMs()).toBe(12_345);
    process.env.P0_PAIR_GAP_MS = "99999999";
    expect(p0PairGapMs()).toBe(600_000);
  });
});
