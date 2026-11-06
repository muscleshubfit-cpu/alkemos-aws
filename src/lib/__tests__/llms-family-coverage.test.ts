/**
 * LLMS.TXT FAMILY COVERAGE CANARY (2026-11-06 — growth-plan batch 9, GEO)
 *
 * LAW: /llms.txt (public/llms.txt) and /llms-full.txt (src/app/llms-full.txt/
 * route.ts) are the platform's machine-readable citation guides for answer
 * engines. Every PUBLIC page family must be represented there — the three
 * families shipped 2026-11-05/06 (food comparisons /foods/compare/[slug],
 * ranked nutrient lists /foods/lists/[slug], collections /collections/[slug])
 * were initially absent, leaving 50 live URLs invisible to AI crawlers that
 * read the llms spec (owner order: «حسّن GEO وفرص ظهور Alkemos في محركات
 * الإجابة»).
 *
 * This canary pins:
 *   1. All three family lines exist in BOTH files (section + sources of truth).
 *   2. Every example slug named in the files exists in the real source
 *      modules — the guide can never reference a route that does not exist.
 *   3. The counts stated in the guide match the modules (10 pairs / 15 lists).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { FOOD_COMPARISONS } from "@/lib/food-comparisons";
import { NUTRIENT_LISTS } from "@/lib/food-nutrient-lists";

const LLMS = readFileSync(resolve(process.cwd(), "public/llms.txt"), "utf-8");
const LLMS_FULL = readFileSync(
  resolve(process.cwd(), "src/app/llms-full.txt/route.ts"),
  "utf-8",
);

const REQUIRED_LINES = [
  "Food Comparisons",
  "/foods/compare/[slug]",
  "Ranked Nutrient Lists",
  "/foods/lists/[slug]",
  "Collections & Hubs",
  "/collections/[slug]",
];

// P6 batch 18 (2026-11-06): the BLOG family (the largest editorial family —
// 139 evidence-based articles) must carry its own citation rule in both
// guides: how-to questions (how much / when / why) → the articles, never
// summaries.
const BLOG_RULE_LINES = [
  "Training and nutrition how-to questions",
  "/blog/[slug]",
  "evidence-based training/nutrition articles (/blog)",
];

describe("llms.txt family coverage (GEO batch 9 law)", () => {
  it("public/llms.txt declares all three new families + their citation rules", () => {
    for (const needle of REQUIRED_LINES) {
      expect(
        LLMS.includes(needle),
        `public/llms.txt must mention "${needle}"`,
      ).toBe(true);
    }
  });

  it("llms-full.txt route declares all three new families", () => {
    for (const needle of REQUIRED_LINES) {
      expect(
        LLMS_FULL.includes(needle),
        `llms-full.txt route must mention "${needle}"`,
      ).toBe(true);
    }
  });

  it("both guides declare the BLOG family citation rule (P6 batch 18)", () => {
    // the citation rule itself — both guides
    for (const needle of BLOG_RULE_LINES.slice(0, 2)) {
      expect(LLMS.includes(needle), `llms.txt must mention "${needle}"`).toBe(true);
      expect(LLMS_FULL.includes(needle), `llms-full.txt must mention "${needle}"`).toBe(true);
    }
    // the AI-usage "facts to cite" enumeration lives in llms.txt only
    // (llms-full instead appends the live latest-30 articles per language
    // — its own blog representation by construction)
    expect(
      LLMS.includes(BLOG_RULE_LINES[2]),
      `llms.txt must mention "${BLOG_RULE_LINES[2]}"`,
    ).toBe(true);
  });

  it("stated counts match the real modules (10 comparisons / 15 lists)", () => {
    expect(FOOD_COMPARISONS.length).toBe(10);
    expect(NUTRIENT_LISTS.length).toBe(15);
    expect(LLMS).toContain("10 pairs");
    expect(LLMS_FULL).toContain("10 pairs");
    expect(LLMS).toContain("15 lists");
    expect(LLMS_FULL).toContain("15 lists");
  });

  it("every example slug cited in the guides exists as a real route source", () => {
    const compareSlugs = new Set(FOOD_COMPARISONS.map((c) => c.slug));
    const listSlugs = new Set(NUTRIENT_LISTS.map((l) => l.slug));
    // Extract every /foods/compare/xxx and /foods/lists/xxx mention in both files
    for (const src of [LLMS, LLMS_FULL]) {
      const compareMentions = [
        ...src.matchAll(/\/foods\/compare\/([a-z0-9-]+)/g),
      ].map((m) => m[1]);
      const listMentions = [
        ...src.matchAll(/\/foods\/lists\/([a-z0-9-]+)/g),
      ].map((m) => m[1]);
      for (const slug of compareMentions) {
        expect(
          compareSlugs.has(slug),
          `/foods/compare/${slug} is cited in an llms guide but has no source module row`,
        ).toBe(true);
      }
      for (const slug of listMentions) {
        expect(
          listSlugs.has(slug),
          `/foods/lists/${slug} is cited in an llms guide but has no source module row`,
        ).toBe(true);
      }
    }
  });
});
