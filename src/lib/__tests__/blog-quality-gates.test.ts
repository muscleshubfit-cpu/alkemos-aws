import { describe, it, expect } from "vitest";

/**
 * AUDIT_REPORT.md §9-المرحلة 1, item 4 (2026-09-29) — the deterministic
 * P5 quality-gate battery (G2-G6), unit-tested in isolation (pure leaf
 * module). The behavioral route-level proof (a deficient draft is
 * BLOCKED, a compliant draft PUBLISHES) lives in
 * blog-phase1-quality-gates.test.ts.
 */
import {
  countH2Sections,
  findAuthorityLinks,
  findUngrammaticalAnchors,
  findQuotedSearchPhrases,
  runP5QualityGates,
} from "@/lib/blog-quality-gates";

const LEGAL_TITLES = [
  "How to Build Muscle at Home: The Complete Guide",
  "دليل شامل لبناء العضلات في المنزل",
];

describe("G2 — H2 section count", () => {
  it("counts ## headings, ignores #/### and body text", () => {
    expect(countH2Sections("# H1\n## One\n### Sub\n## Two\ntext\n## Three\n## Four\n## Five")).toBe(5);
    expect(countH2Sections("## One\n## Two")).toBe(2);
  });
});

describe("G4 — external authority links", () => {
  it("recognizes whitelisted authority domains (https, www tolerated)", () => {
    const md =
      "See [WHO healthy diets](https://www.who.int/news-room/fact-sheets/healthy-diet) and [the CDC page](https://cdc.gov/physical-activity).";
    expect(findAuthorityLinks(md).sort()).toEqual(["cdc.gov", "who.int"]);
  });

  it("rejects non-authority and non-https links (no E-E-A-T credit)", () => {
    expect(findAuthorityLinks("[a blog](https://example.com/protein)")).toEqual([]);
    expect(findAuthorityLinks("[insecure](http://www.who.int/x)")).toEqual([]);
    expect(findAuthorityLinks("[internal](/tools/calorie-calculator)")).toEqual([]);
  });
});

describe("G5 — anchor grammar law", () => {
  it("flags the audit's live raw-keyword-list anchor evidence", () => {
    const md =
      "Read [training adjustments menstrual cycle female lifters](/blog/x) for more.";
    expect(findUngrammaticalAnchors(md, "en", LEGAL_TITLES)).toEqual([
      "training adjustments menstrual cycle female lifters",
    ]);
  });

  it("flags >5-word keyword stacks that are not exact titles", () => {
    const md = "See [best beginner home workout plan build muscle fast](/blog/y).";
    expect(findUngrammaticalAnchors(md, "en", [])).toEqual([
      "best beginner home workout plan build muscle fast",
    ]);
  });

  it("allows exact post-title anchors of any length", () => {
    const md = "Start with [How to Build Muscle at Home: The Complete Guide](/blog/x).";
    expect(findUngrammaticalAnchors(md, "en", LEGAL_TITLES)).toEqual([]);
  });

  it("allows 2-3 word anchors and 4+ word anchors WITH function words", () => {
    const md =
      "Try [the complete guide](/blog/a), [a guide to recovery](/blog/b), and [protein for muscle](/blog/c).";
    expect(findUngrammaticalAnchors(md, "en", [])).toEqual([]);
  });

  it("AR: flags a bare keyword list, allows grammatical Arabic phrases", () => {
    // 4 words, zero function words — the raw keyword-list shape
    const bad = "شوف [تمارين بناء العضلات المنزل](/ar/blog/z) للمزيد.";
    expect(findUngrammaticalAnchors(bad, "ar", [])).toEqual([
      "تمارين بناء العضلات المنزل",
    ]);
    // "بدون" (without) is a function word → grammatical 4-word anchor
    const good = "اقرأ [تمارين بدون معدات للمبتدئين](/ar/blog/w).";
    expect(findUngrammaticalAnchors(good, "ar", [])).toEqual([]);
  });

  // BLOG-RECOVERY-3 (2026-10-21, live run 39580182779): the anchors the P4
  // model ACTUALLY produced in the live run — the gate rejected every
  // repair cycle and publishing was blocked for the whole day.
  it("AR (BLOG-RECOVERY-3): the LIVE-MEASURED authority anchors pass — fused-preposition morphology + AR word economy", () => {
    const md = [
      "راجع [إرشادات الكلية الأمريكية للطب الرياضي](https://www.acsm.org/).",
      "راجع [الكلية الأمريكية للطب الرياضي](https://www.acsm.org/).",
      "راجع [كمية الماء التي يحتاجها الرياضي يوميًا](https://www.issn-online.org/).",
    ].join(" ");
    expect(findUngrammaticalAnchors(md, "ar", [])).toEqual([]);
  });

  it("AR (BLOG-RECOVERY-3): a 6-word noun clause with a function word passes the count (the >5 EN threshold killed «كمية الماء التي يحتاجها الرياضي يوميًا»)", () => {
    const md = "راجع [كمية الماء التي يحتاجها الرياضي يوميًا](https://www.who.int/).";
    expect(findUngrammaticalAnchors(md, "ar", [])).toEqual([]);
  });

  it("AR (BLOG-RECOVERY-3): an 8-word keyword stack is still rejected (the >7 AR threshold keeps the stuffing law)", () => {
    const md = "شوف [تمارين بناء العضلات المنزل بدون معدات للمبتدئين أسبوعيا](/ar/blog/z).";
    // 8 words, and the function words بدون/للمبتدئين(لل!)/أسبوعيا — the count rule alone must reject
    expect(findUngrammaticalAnchors(md, "ar", [])).toEqual([
      "تمارين بناء العضلات المنزل بدون معدات للمبتدئين أسبوعيا",
    ]);
  });

  it("AR (BLOG-RECOVERY-3): the fused-preposition signal alone does NOT rescue a bare list (canary law intact)", () => {
    // «تمارين بناء العضلات المنزل» keeps failing: plain-ال words are
    // insufficient — only لل/بال/كال/وال/فال fused forms count.
    const bad = "شوف [تمارين بناء العضلات المنزل](/ar/blog/z) للمزيد.";
    expect(findUngrammaticalAnchors(bad, "ar", [])).toEqual([
      "تمارين بناء العضلات المنزل",
    ]);
  });
});

describe("G6 — quoted search phrases in prose (§C4 stuffing pattern)", () => {
  it("EN: flags the audit's live lowercase pasted query", () => {
    const md =
      'The result is your daily target for "how many calories should i eat to lose weight" while training.';
    expect(findQuotedSearchPhrases(md, "en")).toEqual([
      "how many calories should i eat to lose weight",
    ]);
  });

  it("EN: a normal capitalized quotation is NOT flagged (no false block)", () => {
    const md = 'As the coach says: "Progressive overload beats novelty" every time.';
    expect(findQuotedSearchPhrases(md, "en")).toEqual([]);
  });

  it("AR: flags a quoted كم/كيف-style query, ignores normal quoted phrases", () => {
    const bad = 'هدفك اليومي هو "كم سعرة أحتاج لخسارة الوزن في الأسبوع" تمامًا.';
    expect(findQuotedSearchPhrases(bad, "ar")).toEqual([
      "كم سعرة أحتاج لخسارة الوزن في الأسبوع",
    ]);
    const good = "كما يقول المدرب: «الانتظام يهتم أكثر من الحماس المؤقت» دائمًا.";
    expect(findQuotedSearchPhrases(good, "ar")).toEqual([]);
  });
});

describe("the full battery (runP5QualityGates)", () => {
  const goodBody = [
    "## Why Home Training Works",
    "Training at home builds real strength with [the right plan](/blog/a).",
    "",
    "## Equipment Basics",
    "Start light. Evidence guidance: [WHO healthy diets](https://www.who.int/healthy-diet).",
    "",
    "## The Weekly Split",
    "Train four days per week with progressive overload.",
    "",
    "## Nutrition for Growth",
    "Eat enough protein and calories to support recovery.",
    "",
    "## Tracking Progress",
    "Log every session and add a little weight each week.",
    "",
    "## Conclusion",
    "Consistency beats perfection — start today.",
  ].join("\n");

  it("passes a compliant article (no violations)", () => {
    expect(
      runP5QualityGates({ lang: "en", bodyMd: goodBody, faqCount: 5, legalTitles: LEGAL_TITLES }),
    ).toEqual([]);
  });

  it("aggregates every gate failure with actionable diagnostics", () => {
    const v = runP5QualityGates({
      lang: "en",
      bodyMd: "## One\nplain text with no links at all.\n## Two\nmore.",
      faqCount: 2,
      legalTitles: [],
    });
    expect(v.some((x) => x.includes("H2 sections"))).toBe(true);
    expect(v.some((x) => x.includes("FAQ count 2 outside the 4-7 range"))).toBe(true);
    expect(v.some((x) => x.includes("no external authority link"))).toBe(true);
  });

  it("flags the FAQ ceiling too (7 max)", () => {
    const v = runP5QualityGates({ lang: "en", bodyMd: goodBody, faqCount: 9, legalTitles: [] });
    expect(v.some((x) => x.includes("FAQ count 9 outside the 4-7 range"))).toBe(true);
  });
});
