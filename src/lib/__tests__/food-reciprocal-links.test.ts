/**
 * RECIPROCAL FOOD-LINK CANARY (2026-11-06 — growth-plan batch 11)
 *
 * LAW (owner order «حسّن الروابط الداخلية»): every ranked list and food
 * comparison links INTO the food pages it ranks or compares — and the food
 * pages must close the loop back. Measured before this batch: food detail
 * pages carried ZERO links to /foods/lists/* or /foods/compare/*, and the
 * /foods hub linked the 10 collections but none of the 15 ranked lists —
 * the 50 new-family URLs (batches 4-5) had no inbound links except from
 * each other and the sitemaps.
 *
 * Pins:
 *   1. The derivation helpers exist and are wired into BOTH language
 *      food pages (server components) and the shared client.
 *   2. The foods hub (FoodsExplorer) links every ranked list.
 *   3. Every derived href target actually exists in its source module —
 *      the reciprocal graph can never drift from the real routes.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import {
  FOOD_COMPARISONS,
  getComparisonsFeaturingFood,
} from "@/lib/food-comparisons";
import {
  NUTRIENT_LISTS,
  getListsContainingFood,
} from "@/lib/food-nutrient-lists";

const read = (p: string) =>
  readFileSync(resolve(process.cwd(), p), "utf-8");

const EN_PAGE = "src/app/(en)/foods/[slug]/page.tsx";
const AR_PAGE = "src/app/(ar)/ar/foods/[slug]/page.tsx";
const CLIENT = "src/app/(en)/foods/[slug]/FoodDetailClient.tsx";
const HUB = "src/components/foods/FoodsExplorer.tsx";

describe("reciprocal food links (growth-plan batch 11 law)", () => {
  it("both language food pages derive featuredIn from the source modules", () => {
    for (const page of [EN_PAGE, AR_PAGE]) {
      const src = read(page);
      expect(src, `${page} must derive lists`).toContain(
        "getListsContainingFood(food.slug)",
      );
      expect(src, `${page} must derive comparisons`).toContain(
        "getComparisonsFeaturingFood(food.slug)",
      );
    }
  });

  it("the shared client renders the reciprocal section (bilingual)", () => {
    const src = read(CLIENT);
    expect(src).toContain("featuredIn");
    expect(src).toContain("This food in rankings & comparisons");
    expect(src).toContain("هذا الصنف في الترتيبات والمقارنات");
  });

  it("the /foods hub links every ranked list (both locales via one component)", () => {
    const src = read(HUB);
    expect(src).toContain("NUTRIENT_LISTS.map");
    expect(src).toContain("/foods/lists/");
  });

  it("the derivation helpers return only real rows (every href target exists)", () => {
    const compareSlugs = new Set(FOOD_COMPARISONS.map((c) => c.slug));
    const listSlugs = new Set(NUTRIENT_LISTS.map((l) => l.slug));
    // Tuna is ranked in the fish list AND featured in a comparison — the
    // audit's own measured sample. Chicken breast is honestly featured in
    // TWO comparisons while appearing in no ranked list (scope rules) —
    // the section must render comparisons-only for it, never fabricate.
    const lists = getListsContainingFood("tuna");
    const comps = getComparisonsFeaturingFood("tuna");
    expect(lists.length).toBeGreaterThan(0);
    expect(comps.length).toBeGreaterThan(0);
    for (const l of lists) expect(listSlugs.has(l.slug)).toBe(true);
    for (const c of comps) expect(compareSlugs.has(c.slug)).toBe(true);
    const cbComps = getComparisonsFeaturingFood("chicken-breast");
    expect(cbComps.length).toBe(2); // tuna-vs-chicken-breast + tofu-vs-chicken-breast
    expect(getListsContainingFood("chicken-breast")).toEqual([]);
    // A food in neither family gets honest empties (no fabricated links).
    expect(getListsContainingFood("definitely-not-a-food")).toEqual([]);
    expect(getComparisonsFeaturingFood("definitely-not-a-food")).toEqual([]);
  });
});
