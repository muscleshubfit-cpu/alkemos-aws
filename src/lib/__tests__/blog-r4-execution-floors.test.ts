import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * R4 — EXECUTION-WORD-FLOOR ALIGNMENT + THIRD FAQ LIFT FORMAT
 * (Execution-Path Audit §10 Phase R4 / §8.2 B2+B3, 2026-09-29 —
 * docs/EXECUTION-PATH-AUDIT-AND-RECOVERY-PLAN-2026-09-29.md).
 *
 * Live evidence this frame is built on (audit §3.1/§3.3/§3.5 + the R3
 * monitored runs 36595579697/36595584050):
 *   • P2 drafts arrived at 419/752/855-1271 words while the code floor
 *     was a 400-word parse-validity net — they burned images + review
 *     and died at P5's 1300 floor (the most expensive point).
 *   • P4 SHRANK a passing draft (live-measured 1201→752 in run
 *     36582658309; 1409→1369 in audit §3.2) and survived to P5.
 *   • Queue row 38f230fb: a 1369-word marathon article whose FAQ section
 *     the review model rewrote in PLAIN-TEXT question lines — the lifter
 *     understood only the bold and H3 formats, lifted ZERO questions, and
 *     G3 killed the article as "FAQ count 0".
 *
 * R4 tightens the EXECUTION layer only (P2/P4 floors 400→1200, shared
 * constant) and widens the LIFTER to the third format. These canaries
 * pin: the floors' behavior both directions, the distinct P4 short-class
 * message, the third-format lift + its conservative guards, and — per
 * the plan's verification clause — that G3 and the rest of
 * runP5QualityGates stay byte-identical (P5_WORD_FLOOR still 1300; the
 * FAQ-range law still the shared 4-7 constant; faqCount 0 still fails).
 *
 * FLOOR-LOWERING UPDATE (owner order 2026-10-02, Phase 323): both floors
 * were lowered — BLOG_EXECUTION_WORD_FLOOR 1200→1000 and P5_WORD_FLOOR
 * 1300→1000. The behavioral pins below were updated to the new values;
 * the R4 historical narrative above is untouched. The ask (1500-2500)
 * and every other gate are unchanged.
 */

// ── the AI chain boundary (same mocking pattern as the editorial-law
// no-fork canaries): the payload the "model" returns is steered per test
// through __state.articleMd. ─────────────────────────────────────────
vi.mock("@/lib/ai-provider", () => {
  const state = { articleMd: "" };
  return {
    __state: state,
    callFreeAIFallbackChain: vi.fn(async () => ({
      text: JSON.stringify({ articleMd: state.articleMd }),
      model: "floor-test-model",
      provider: "floortest",
    })),
    parseJSON: vi.fn(<T,>(text: string): T | null => {
      try {
        return JSON.parse(text) as T;
      } catch {
        return null;
      }
    }),
  };
});

import {
  BLOG_EXECUTION_WORD_FLOOR,
  generateFullArticle,
  reviewAndEnhance,
  splitFaqSection,
  filterFaqsByRelevance,
  type OutlinePlan,
} from "@/lib/blog-pipeline";
import { runP5QualityGates } from "@/lib/blog-quality-gates";
import { fallbackResearch } from "@/lib/blog-research";
import * as aiProvider from "@/lib/ai-provider";

const state = (aiProvider as unknown as { __state: { articleMd: string } }).__state;

/** A markdown-free filler of EXACTLY n words (countWords basis). */
const filler = (n: number) => Array.from({ length: n }, (_, i) => `t${i}`).join(" ");

const OUTLINE: OutlinePlan = {
  title: "How to Recover After a Marathon",
  subtitle: "a complete recovery guide",
  metaDescription: "Recovery steps for the two weeks after a marathon.",
  slugBase: "marathon-recovery",
  sections: ["Why recovery matters", "The first 48 hours", "Week one", "Week two", "Returning to training"],
  lsiKeywords: ["marathon recovery"],
  imagePlan: [],
};

const read = (rel: string): string => readFileSync(join(process.cwd(), rel), "utf-8");

// ─────────────────────────────────────────────────────────────────
// P2 — the execution floor inside generateFullArticle
// ─────────────────────────────────────────────────────────────────

describe("R4 · P2 execution floor (generateFullArticle)", () => {
  beforeEach(() => {
    state.articleMd = "";
  });

  it("the floor is 1000 (shared constant; lowered from 1200 by owner order 2026-10-02, Phase 323)", () => {
    expect(BLOG_EXECUTION_WORD_FLOOR).toBe(1000);
    const src = read("src/lib/blog-pipeline.ts");
    expect(src).toContain("export const BLOG_EXECUTION_WORD_FLOOR = 1000");
  });

  it("KILLS the live 419-word draft class at P2 — with the measurement in the error", async () => {
    state.articleMd = filler(419);
    await expect(generateFullArticle("en", OUTLINE, fallbackResearch("en", [])))
      .rejects.toThrow(/P2 en: empty\/too-short article from floortest:floor-test-model \(419 words < 1000-word execution floor\)/);
  });

  it("kills the R3 live-run class (911 words) and the AR 752-word class", async () => {
    state.articleMd = filler(911);
    await expect(generateFullArticle("en", OUTLINE, fallbackResearch("en", []))).rejects.toThrow(
      "911 words < 1000-word execution floor",
    );
    state.articleMd = filler(752);
    await expect(generateFullArticle("ar", OUTLINE, fallbackResearch("ar", []))).rejects.toThrow(
      "752 words < 1000-word execution floor",
    );
  });

  it("PASSES an adequate 1250-word draft (no false block — comfortably above the 1000 floor)", async () => {
    state.articleMd = filler(1250);
    const out = await generateFullArticle("en", OUTLINE, fallbackResearch("en", []));
    expect(out.wordCount).toBe(1250);
    expect(out.source).toBe("floortest:floor-test-model");
  });
});

// ─────────────────────────────────────────────────────────────────
// P4 — the review-shrinkage floor inside reviewAndEnhance
// ─────────────────────────────────────────────────────────────────

describe("R4 · P4 execution floor (reviewAndEnhance)", () => {
  beforeEach(() => {
    state.articleMd = "";
  });

  it("kills the live 1201→752 shrinkage class at P4 with a DISTINCT message", async () => {
    state.articleMd = filler(752);
    await expect(reviewAndEnhance("en", filler(1201), OUTLINE, [])).rejects.toThrow(
      /P4 en: review output too short from floortest:floor-test-model \(752 words\) AND the length-repair re-call/,
    );
  });

  it("parse failure keeps the legacy 'invalid review JSON' message (class separation)", async () => {
    // The chain mock always returns JSON; to simulate a parse failure we
    // return a non-JSON article payload through the same seam.
    const broken = (aiProvider as unknown as {
      callFreeAIFallbackChain: ReturnType<typeof vi.fn>;
    }).callFreeAIFallbackChain;
    broken.mockImplementationOnce(async () => ({ text: "not json at all", model: "m", provider: "p" }));
    await expect(reviewAndEnhance("en", filler(1300), OUTLINE, [])).rejects.toThrow(
      "P4 en: invalid review JSON from p:m",
    );
  });

  it("PASSES an adequate 1250-word review output", async () => {
    state.articleMd = filler(1250);
    const out = await reviewAndEnhance("en", filler(1300), OUTLINE, []);
    expect(out.markdown.split(/\s+/)).toHaveLength(1250);
  });
});

// ─────────────────────────────────────────────────────────────────
// R4 third lift format — splitFaqSection (plain-text question lines)
// ─────────────────────────────────────────────────────────────────

/** The §3.3 live shape (queue row 38f230fb): plain-text question lines,
 * each followed by an answer paragraph — ZERO bold/H3 markers. */
const MARATHON_FAQ_PLAIN = `
## Frequently Asked Questions

How soon after a marathon can I run again?

Most runners need seven to ten days of full rest before easy jogging feels normal again.

Should I take an ice bath after the marathon?

Cold water immersion may reduce soreness, but keep sessions short.

How do I know if my marathon recovery is on track?

Normal resting heart rate and restored appetite are good early signs.

Is walking good for marathon recovery?

Yes, light walking boosts blood flow without adding impact.

What should I eat after finishing a marathon?

Aim for carbohydrates plus protein within the first two hours.
`;

describe("R4 · splitFaqSection — third format (plain-text question lines)", () => {
  it("lifts the §3.3 live shape: 5 Q/A pairs, body cleaned of the section", () => {
    const md = `Marathon recovery intro.

## Why recovery matters

Content.

## Frequently Asked Questions

How soon after a marathon can I run again?

Most runners need seven to ten days of full rest.

Should I take an ice bath after the marathon?

Cold water immersion may reduce soreness.
`;
    const { body, faqs } = splitFaqSection("en", md);
    expect(faqs.map((f) => f.question)).toEqual([
      "How soon after a marathon can I run again?",
      "Should I take an ice bath after the marathon?",
    ]);
    expect(faqs[0].answer).toBe("Most runners need seven to ten days of full rest.");
    expect(body).toContain("## Why recovery matters");
    expect(body).not.toContain("Frequently Asked Questions");
    expect(body).not.toContain("How soon after a marathon can I run again?");
  });

  it("single-newline variant: the answer sits directly under the question line", () => {
    const md = `Intro.

## FAQ

How many hours of sleep do runners need?
Adults who train regularly benefit from seven to nine hours.
Can I skip the rest week after a race?
No — the rest week is where adaptation actually happens.
`;
    const { faqs } = splitFaqSection("en", md);
    expect(faqs).toHaveLength(2);
    expect(faqs[0].question).toBe("How many hours of sleep do runners need?");
    expect(faqs[0].answer).toBe("Adults who train regularly benefit from seven to nine hours.");
    expect(faqs[1].question).toBe("Can I skip the rest week after a race?");
  });

  it("lifts Arabic plain-text questions ending with the Arabic question mark", () => {
    const md = `مقدمة مباشرة.

## الأسئلة الشائعة

متى أعود للجري بعد الماراثون؟

يحتاج معظم العدائين من سبعة إلى عشرة أيام راحة كاملة.

هل حمام الماء البارد مفيد بعد السباق؟

قد يقلل الوجع لكن اجعل الجلسة قصيرة.
`;
    const { body, faqs } = splitFaqSection("ar", md);
    expect(faqs).toHaveLength(2);
    expect(faqs[0].question).toBe("متى أعود للجري بعد الماراثون؟");
    expect(faqs[0].answer).toBe("يحتاج معظم العدائين من سبعة إلى عشرة أيام راحة كاملة.");
    expect(body).not.toContain("الأسئلة الشائعة");
  });

  it("mixes formats in one section (bold + plain text + H3)", () => {
    const md = `Intro.

## Frequently Asked Questions

**How much protein per day during recovery?**

Around 1.6 grams per kilogram is a common target.

Should I massage sore legs?

Gentle massage after 48 hours is fine.

### When can I race again?

Wait four to six weeks before the next race.
`;
    const { faqs } = splitFaqSection("en", md);
    expect(faqs.map((f) => f.question)).toEqual([
      "How much protein per day during recovery?",
      "Should I massage sore legs?",
      "When can I race again?",
    ]);
  });

  it("GUARD — never steals the FIRST line of an answer still accumulating", () => {
    const md = `Intro.

## FAQ

**Is creatine safe?**

Yes for healthy adults, but how much should you take per day?
Check the label for dosing guidance.
`;
    const { faqs } = splitFaqSection("en", md);
    expect(faqs).toHaveLength(1);
    expect(faqs[0].question).toBe("Is creatine safe?");
    // the answer line ending in ? STAYED answer text
    expect(faqs[0].answer).toContain("how much should you take per day?");
  });

  it("GUARD — a line over 25 words ending in ? stays answer text, not a question", () => {
    const longLine = `${filler(26)}?`;
    const md = `Intro.

## FAQ

**How long does loading take?**

Answer one.

${longLine}

More answer text.
`;
    const { faqs } = splitFaqSection("en", md);
    expect(faqs).toHaveLength(1);
    expect(faqs[0].question).toBe("How long does loading take?");
    expect(faqs[0].answer).toContain(longLine);
  });

  it("GUARD — list-item / heading / quote lines ending in ? are NOT lifted (plain prose only)", () => {
    const md = `Intro.

## FAQ

- How much sleep do I need?

Seven to nine hours.
`;
    const { body, faqs } = splitFaqSection("en", md);
    // no lifted pairs (the only question-shaped line is a list item) →
    // legacy degradation: body unchanged, empty list
    expect(faqs).toEqual([]);
    expect(body).toBe(md);
  });

  it("GUARD — a dangling question with no following answer is dropped (incomplete pair)", () => {
    const md = `Intro.

## FAQ

**How long does loading take?**

Answer one.

Is there a second question with no answer?
`;
    const { faqs } = splitFaqSection("en", md);
    expect(faqs).toHaveLength(1);
    expect(faqs[0].question).toBe("How long does loading take?");
  });
});

// ─────────────────────────────────────────────────────────────────
// The §3.3 article now PUBLISHES — pure-pipeline proof through the
// same deterministic chain P5 runs (lift → relevance → battery)
// ─────────────────────────────────────────────────────────────────

describe("R4 · the 38f230fb class passes the P5 battery chain (pure pipeline)", () => {
  it("plain-text FAQ section → lifted → relevance-kept → G3 in range → battery clean", () => {
    const body = `Marathon recovery is where the fitness you built actually sticks.

## Why marathon recovery matters

Your muscles, tendons and immune system all take damage during 42 kilometers, and the [ACSM](https://www.acsm.org/) recommends treating the fortnight after a race as part of the training plan itself.

## The first 48 hours

Walk, eat, sleep and repeat. Keep the intensity at conversation level.

## Week one

Easy movement only. Resting heart rate and appetite returning to baseline are your best progress markers.

## Week two

Short, easy jogs can return if soreness is gone and sleep is normal.

## Returning to training

Build volume gradually across the next month before racing again.
`;
    const reviewMd = `${body}
${MARATHON_FAQ_PLAIN}
`;
    const { body: faqStrippedMd, faqs } = splitFaqSection("en", reviewMd);
    expect(faqs).toHaveLength(5);

    // the P5 relevance filter keeps the on-topic marathon questions
    const kept = filterFaqsByRelevance(faqs, "Marathon Recovery: How to Bounce Back After the Race marathon recovery");
    expect(kept.length).toBeGreaterThanOrEqual(4);

    // the deterministic battery on the FINAL state: G3 rides the lifted
    // count, G2 the remaining body — all green, exactly as P5 computes it
    const violations = runP5QualityGates({
      lang: "en",
      bodyMd: faqStrippedMd,
      faqCount: kept.length,
      legalTitles: [],
    });
    expect(violations).toEqual([]);
  });

  it("the PRE-R4 failure message is reproduced exactly when the lift yields zero (G3 unchanged)", () => {
    // faqCount 0 after a failed lift was the live 09-29 failure:
    // "quality-gate battery failed — FAQ count 0 outside the 4-7 range"
    const violations = runP5QualityGates({ lang: "en", bodyMd: "## One\nx", faqCount: 0, legalTitles: [] });
    expect(violations.some((v) => v === "FAQ count 0 outside the 4-7 range")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// Byte-truth canaries — R4 tightens execution, NEVER the gates
// ─────────────────────────────────────────────────────────────────

describe("R4 · gate byte-truth canaries (no gate weakened by this frame)", () => {
  it("the P5 publish floor is 1000 (owner order 2026-10-02), named constant, its own line", () => {
    const route = read("src/app/api/cron/blog/p5-publish/route.ts");
    expect(route).toContain("const P5_WORD_FLOOR = 1000");
    expect(route).not.toContain("const P5_WORD_FLOOR = 1200");
    expect(route).not.toContain("const P5_WORD_FLOOR = 1300");
  });

  it("G3 still rides the shared 4-7 law constant (no local fork)", () => {
    const gates = read("src/lib/blog-quality-gates.ts");
    expect(gates).toContain("EDITORIAL_FAQ_COUNT_RANGE");
    const law = read("src/lib/blog-editorial-law.ts");
    expect(law).toContain("export const EDITORIAL_FAQ_COUNT_RANGE = { min: 4, max: 7 } as const");
  });

  it("the quality battery still fails a too-high FAQ count (8 > 7)", () => {
    const violations = runP5QualityGates({ lang: "en", bodyMd: "## One\nx", faqCount: 8, legalTitles: [] });
    expect(violations.some((v) => v.includes("FAQ count 8 outside the 4-7 range"))).toBe(true);
  });
});
