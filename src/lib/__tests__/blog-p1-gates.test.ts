import { describe, it, expect } from "vitest";
import {
  countProseWords,
  stripMarkdownForCount,
} from "@/lib/blog-word-count";
import {
  findQuotedSearchPhrases,
  runP5QualityGates,
  shingle5Grams,
  maxShingleContainment,
  SHINGLE_CONTAINMENT_CEILING,
} from "@/lib/blog-quality-gates";
import { mapP5FailureToRerunTarget } from "@/lib/blog-repair-target";
import { EXERCISES } from "@/lib/exercises";

/**
 * P1 canaries — the blog deterministic layers: ART-4 (prose word count),
 * ART-12 (G6 case-fold + curly quotes), ART-15 (outline commitment +
 * 5-gram shingles), the ART-4-reworded repair map, and WOR-4's prompt
 * examples (every name must exist in the real library).
 */

describe("ART-4 — the prose word counter", () => {
  it("markdown scaffolding is not counted as words", () => {
    const md = "## Heading\n\n- bullet one\n- bullet two\n\n[link text](https://x.com) and **bold**";
    expect(countProseWords(md)).toBeLessThan(countProseWords("word ".repeat(100)) + 1);
    // the scaffolding itself contributes ZERO tokens
    expect(countProseWords("## - ** ** [x](y) | --- >")).toBe(1); // just "x" from the link anchor
  });

  it("a list-marker-padded draft counts its real prose only", () => {
    const padded = ["## قسم", "- نقطة أولى", "- نقطة ثانية", "- نقطة ثالثة"].join("\n");
    // قسم + (نقطة أولى) + (نقطة ثانية) + (نقطة ثالثة) = 7 real words —
    // the ##/- markers contribute NOTHING.
    expect(countProseWords(padded)).toBe(7);
  });

  it("code fences drop wholesale; inline code keeps its tokens", () => {
    expect(countProseWords("```js\nconst a = 1;\n```")).toBe(0);
    expect(countProseWords("run `npm test` now")).toBe(4);
  });

  it("images keep the alt text only", () => {
    expect(countProseWords("![صورة طبق دجاج](https://x.com/dish.jpg)")).toBe(3);
  });
});

describe("ART-12 — G6 quoted search phrases", () => {
  it("a CAPITALIZED pasted query is now caught (the case-fold fix)", () => {
    const en = findQuotedSearchPhrases(
      'You should try "How to lose belly fat fast" at home.',
      "en",
    );
    expect(en.length).toBeGreaterThan(0);
  });

  it("curly-quoted Arabic queries are caught (the “…” fix)", () => {
    const ar = findQuotedSearchPhrases(
      "كثير يتساءلون “كم جرام بروتين في اليوم للتضخيم” وغيرها.",
      "ar",
    );
    expect(ar.length).toBeGreaterThan(0);
  });

  it("normal prose with quotes stays clean", () => {
    expect(findQuotedSearchPhrases('He said "this is fine, really." and left.', "en")).toHaveLength(0);
  });
});

describe("ART-15 — outline commitment + 5-gram shingles", () => {
  const baseArgs = {
    lang: "en" as const,
    bodyMd: "## One\n\ntext under one.\n\n## Two\n\ntext under two.\n\n## Three\n\ntext three.\n\n## Four\n\ntext four.\n\n## Five\n\ntext five.\n\n[WHO says](https://www.who.int/news-room/fact-sheets/detail/healthy-diet)",
    faqCount: 4,
    legalTitles: [] as string[],
  };

  it("a body missing an outline heading violates the battery", () => {
    const violations = runP5QualityGates({
      ...baseArgs,
      outlineHeadings: ["One", "Two", "Three", "Four", "Five", "Six Missing"],
    });
    expect(violations.some((v) => v.includes("six missing"))).toBe(true);
  });

  it("a body covering every outline heading passes the commitment check", () => {
    const violations = runP5QualityGates({
      ...baseArgs,
      outlineHeadings: ["One", "Two", "Three", "Four", "Five"],
    });
    expect(violations.some((v) => v.includes("outline section heading"))).toBe(false);
  });

  it("near-duplicate prose vs a published body is measured (containment)", () => {
    const published = Array.from(
      { length: 120 },
      (_, i) => `sentence number ${i} about protein timing and creatine intake guidelines`,
    ).join(" ");
    const nearCopy = published.replace("number 0", "the very first"); // ≥80% identical
    const shingle = maxShingleContainment(nearCopy, [published]);
    expect(shingle).not.toBeNull();
    expect((shingle as { ratio: number }).ratio).toBeGreaterThan(SHINGLE_CONTAINMENT_CEILING);
  });

  it("genuinely different prose measures far below the ceiling", () => {
    const published = Array.from(
      { length: 120 },
      (_, i) => `cooking oats with milk and honey variations number ${i}`,
    ).join(" ");
    const fresh = Array.from(
      { length: 120 },
      (_, i) => `squat depth mechanics and knee valgus correction drills set ${i}`,
    ).join(" ");
    const shingle = maxShingleContainment(fresh, [published]);
    if (shingle) expect(shingle.ratio).toBeLessThan(SHINGLE_CONTAINMENT_CEILING);
  });

  it("shingle5Grams builds token 5-grams (short text = whole text)", () => {
    expect(shingle5Grams("one two three").size).toBe(1);
    expect(shingle5Grams("a b c d e f g").size).toBe(3);
  });
});

describe("ART-4 — the reworded word-floor message still maps to p2-content", () => {
  it("the NEW message shape (prose words, FAQ excluded) maps", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: article too short (812 prose words, FAQ excluded, < 1000-word floor) — rerun p2-content",
      ),
    ).toBe("p2-content");
  });

  it("the LEGACY message shape still maps (back-compat)", () => {
    expect(mapP5FailureToRerunTarget("p5: article too short (812 words < 1000-word floor) — rerun p2-content")).toBe(
      "p2-content",
    );
  });

  it("the ART-15 shingle violation maps to p2-content (regeneration, not review)", () => {
    expect(
      mapP5FailureToRerunTarget(
        "p5: body 5-gram overlap 34% with published article #2 (> 20% ceiling) — rerun p2-content",
      ),
    ).toBe("p2-content");
  });
});

describe("WOR-4 — the workout prompt examples name REAL library entries", () => {
  it("every example name in the coach prompts exists verbatim in EXERCISES", () => {
    const examples = [
      "Barbell Bench Press - Medium Grip",
      "Barbell Squat",
      "Barbell Deadlift",
      "Dumbbell Shoulder Press",
      "Full Range-Of-Motion Lat Pulldown",
      "Leg Press",
      "Dumbbell Bicep Curl",
      "Triceps Pushdown",
      "Pullups",
      "Plank",
    ];
    const names = new Set(EXERCISES.map((e) => e.nameEn));
    for (const ex of examples) {
      expect(names.has(ex), `prompt example "${ex}" missing from the library`).toBe(true);
    }
  });

  it("the bare names the OLD prompt taught (Bench Press / Deadlift) do NOT exist — the fix was needed", () => {
    const names = new Set(EXERCISES.map((e) => e.nameEn));
    expect(names.has("Bench Press")).toBe(false);
    expect(names.has("Deadlift")).toBe(false);
  });
});
