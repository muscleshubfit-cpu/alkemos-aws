/**
 * FREE-TOOL INTERNAL LINKING canaries (owner SEO directive, 2026-09-01).
 *
 * insertToolLinks() is the deterministic guarantee that every generated
 * article links readers to the matching free tools (calorie/macro/BMI/
 * body-fat calculators, water tracker, meal planner, hub pages).
 * These tests lock in the contract: language-aware triggers, first
 * occurrence only, max 3 links, idempotent, never inside an existing
 * markdown link, never on headings/tables/quotes.
 */
import { describe, it, expect } from "vitest";
import { insertToolLinks } from "../blog-tool-links";

describe("insertToolLinks — EN", () => {
  it("wraps the first natural mention with the matching tool link", () => {
    const md =
      "Intro paragraph about training. You must control your daily calories to lose fat. More text here about progress and macros later.";
    const { md: out, inserted } = insertToolLinks(md, "en");
    expect(out).toContain("[calories](/tools/calorie-calculator)");
    expect(inserted.map((i) => i.tool)).toContain("calorie-calculator");
  });

  it("caps at 3 tool links per article", () => {
    const md =
      "Tracking calories daily matters. A meal plan keeps you consistent. Watch your macros too. Body fat percentage also matters. Hydration and water intake matter. Check your BMI as well. Good exercises help. A workout program ties it together.";
    const { md: out, inserted } = insertToolLinks(md, "en");
    expect(inserted.length).toBe(3);
    const links = out.match(/\]\((\/tools\/[^)]+|\/meal-planner|\/programs|\/exercises|\/foods)\)/g) || [];
    expect(links.length).toBe(3);
  });

  it("is idempotent — a second pass inserts nothing new", () => {
    const md = "You should track your calories every day and follow a solid meal plan for best results.";
    const first = insertToolLinks(md, "en");
    const second = insertToolLinks(first.md, "en");
    expect(second.inserted.length).toBe(0);
    expect(second.md).toBe(first.md);
  });

  it("skips a tool already linked by the model (P4 review output)", () => {
    const md = "Track your [calories](/tools/calorie-calculator) daily for fat loss results now.";
    const { inserted } = insertToolLinks(md, "en");
    expect(inserted.map((i) => i.tool)).not.toContain("calorie-calculator");
  });

  it("never wraps text inside an existing markdown link", () => {
    const md = "Read our [guide to counting calories the right way](/blog/count-calories) today for results.";
    const { md: out } = insertToolLinks(md, "en");
    // The anchor inside the existing link must remain untouched.
    expect(out).toContain("[guide to counting calories the right way](/blog/count-calories)");
    expect(out).not.toContain("[[");
  });

  it("does not link headings, tables, blockquotes or images", () => {
    const md = [
      "## Calories and macros overview",
      "",
      "| Item | Value |",
      "| --- | --- |",
      "| calories | 2000 |",
      "",
      "> drink water daily quote line stays plain",
      "",
      "A normal sentence mentioning calories here gets the link.",
    ].join("\n");
    const { md: out } = insertToolLinks(md, "en");
    expect(out).toContain("## Calories and macros overview");
    expect(out).toContain("| calories | 2000 |");
    expect(out).toContain("> drink water daily quote line stays plain");
    expect(out).toContain("A normal sentence mentioning [calories](/tools/calorie-calculator) here");
  });
});

describe("insertToolLinks — AR", () => {
  it("wraps Arabic trigger phrases (السعرات / خطة غذائية) with AR-mirror URLs", () => {
    const md =
      "مقدمة عن التمرين والتغذية. للتحكم في وزنك لازم تحسب السعرات بدقة، وتلتزم بخطة غذائية واضحة تناسب هدفك على المدى الطويل.";
    const { md: out, inserted } = insertToolLinks(md, "ar");
    // Access-point fix (2026-09-14): AR articles link the /ar mirrors —
    // the tool pages render Arabic ONLY on their /ar/* URLs. The anchor is
    // the matched «سعرات» inside «السعرات» — the definite article stays
    // outside and the word still shapes whole (see the WORD_CHAR note).
    expect(out).toContain("[سعرات](/ar/tools/calorie-calculator)");
    expect(out).toContain("](/ar/meal-planner)");
    expect(inserted.length).toBeGreaterThanOrEqual(2);
  });

  // CONTENT-AUDIT P0-2 root fix (2026-09-28): the Arabic trigger patterns
  // are plain substrings, so before the word-split guard a mention like
  // «سعراتك» wrapped ONLY the fragment «سعرات» and the rendered article
  // showed a visibly broken word (`سعرات</a>ك`) on 18 live articles.
  it("never splits a word: a possessive suffix glued to the mention leaves it PLAIN (no partial-word wrap)", () => {
    const md =
      "جملة تمهيدية كاملة عن التغذية السليمة. لازم تحسب سعراتك اليومية بدقة عالية حتى تصل إلى هدفك بثبات وانتظام مع مرور الوقت.";
    const { md: out } = insertToolLinks(md, "ar");
    expect(out).toContain("سعراتك"); // the word stays whole
    expect(out).not.toContain("[سعرات]("); // …and is never wrapped mid-word
    expect(out).not.toContain(")ك"); // no link ever closes before the kaf
  });

  it("prefix + suffix both glued (بسعراتك) also stays plain — the trailing kaf alone blocks the wrap", () => {
    // «بسعراتك» = ب + سعرات + ك — the AFTER edge carries a word letter,
    // so the mention is never wrapped mid-word.
    const md =
      "التزم بتتبع ما تأكله أسبوعياً بعناية، وقارن المجموع بسعراتك المستهدفة يوم بعد يوم حتى تستقر العادة.";
    const { md: out } = insertToolLinks(md, "ar");
    expect(out).not.toContain("[سعرات](");
    expect(out).not.toContain(")ك");
  });

  it("is idempotent for Arabic too", () => {
    const md = "احسب السعرات اليومية لتحقيق هدفك واتبع خطة غذائية مناسبة لجسمك ونشاطك اليومي.";
    const first = insertToolLinks(md, "ar");
    const second = insertToolLinks(first.md, "ar");
    expect(second.inserted.length).toBe(0);
    expect(second.md).toBe(first.md);
  });
});

describe("insertToolLinks — EVO / AI-planner / coaching legs (intent-map audit 2026-09-14)", () => {
  it("links AI-coach mentions to /evo — the single primary AI-coach page", () => {
    const md =
      "An AI fitness coach can keep you accountable between sessions. Text after the mention to satisfy the minimum length gate for tool linking.";
    const { md: out, inserted } = insertToolLinks(md, "en");
    expect(out).toContain("](/evo)");
    expect(inserted.map((i) => i.tool)).toContain("evo-ai-coach");
  });

  it("links human-coach mentions to /coaching", () => {
    const md =
      "A human coach adapts what the app cannot see yet. Extra sentence so the paragraph is long enough to qualify for deterministic linking.";
    const { md: out, inserted } = insertToolLinks(md, "en");
    expect(out).toContain("](/coaching)");
    expect(inserted.map((i) => i.tool)).toContain("online-coaching");
  });

  // PERSONAL-COACH-RENAME (2026-11-05): the site term is now
  // "personal coach" / «مدرب خاص» — the patterns match BOTH (the legacy
  // human-coach matchers stay so existing DB posts keep linking).
  it("links personal-coach mentions to /coaching (the renamed term)", () => {
    const md =
      "A personal coach adapts what the app cannot see yet. Extra sentence so the paragraph is long enough to qualify for deterministic linking.";
    const { md: out, inserted } = insertToolLinks(md, "en");
    expect(out).toContain("](/coaching)");
    expect(inserted.map((i) => i.tool)).toContain("online-coaching");
  });

  it("links Arabic «مدرب خاص» mentions to /ar/coaching (the renamed term)", () => {
    const md =
      "مدرب خاص يبني خطة تناسب أسبوعك وأهدافك بالكامل. جملة إضافية تطول النص للوصول إلى الحد الأدنى المطلوب للربط الآلي.";
    const { md: out, inserted } = insertToolLinks(md, "ar");
    expect(out).toContain("](/ar/coaching)");
    expect(inserted.map((i) => i.tool)).toContain("online-coaching");
  });

  it("most-specific-first: the AR AI-meal-planner phrase links /ar/ai-meal-planner, not /ar/meal-planner", () => {
    const md =
      "جرّب مخطط الوجبات بالذكاء الاصطناعي للحصول على خطة تناسب سعراتك. جملة إضافية تطول النص للوصول إلى الحد الأدنى المطلوب للربط الآلي.";
    const { md: out, inserted } = insertToolLinks(md, "ar");
    expect(out).toContain("](/ar/ai-meal-planner)");
    expect(out).not.toContain("](/ar/meal-planner)");
    expect(inserted[0]?.tool).toBe("ai-meal-planner");
  });
});

describe("insertToolLinks — safety", () => {
  it("returns input untouched for very short content", () => {
    const md = "calories";
    const { md: out, inserted } = insertToolLinks(md, "en");
    expect(out).toBe(md);
    expect(inserted.length).toBe(0);
  });

  it("only produces site-internal tool URLs", () => {
    const md =
      "Track calories, follow a meal plan, and measure body fat to see real progress over several consistent weeks.";
    const { inserted } = insertToolLinks(md, "en");
    for (const link of inserted) {
      expect(link.url).toMatch(/^\/(tools\/|meal-planner|programs|exercises|foods)/);
    }
  });

  it("only produces site-internal tool URLs for Arabic too (AR mirrors)", () => {
    const md =
      "احسب سعراتك اليومية، والتزم بخطة غذائية متوازنة، وقس نسبة الدهون أسبوعياً لترى تقدماً حقيقياً ومستداماً على المدى الطويل مع الانتظام.";
    const { inserted } = insertToolLinks(md, "ar");
    expect(inserted.length).toBeGreaterThan(0);
    for (const link of inserted) {
      expect(link.url).toMatch(/^\/ar\/(tools\/|meal-planner|programs|exercises|foods|ai-meal-planner|ai-workout-planner|coaching)/);
    }
  });
});
