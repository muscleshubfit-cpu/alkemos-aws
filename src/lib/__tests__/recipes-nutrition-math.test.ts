import { describe, it, expect } from "vitest";

/**
 * RECIPES NUTRITION MATH — the golden-constant + property canaries
 * (HEALTHY-RECIPES-PLATFORM plan §12.1, items 2+3):
 *
 *  - computeRecipeNutrition is the ONLY number source (owner §2): every
 *    value = per100g × grams/100, summed, ÷ servings.
 *  - The 4/4/9 consistency law holds on generated ingredient sets
 *    (property test — plan item 3).
 *  - Oils/sauces count as full ingredients (owner «عدم تجاهل الزيوت»).
 *  - Raw/cooked weight states are computed on the ENTERED weight.
 *  - Optional sodium/sat-fat: null stays null (owner correction §2 —
 *    never fabricated), partial coverage is labeled honestly.
 */
import {
  computeRecipeNutrition,
  calorieTolerance,
  KCAL_PER_G_PROTEIN,
  KCAL_PER_G_CARB,
  KCAL_PER_G_FAT,
  CALORIE_CONSISTENCY_ABS_KCAL,
  CALORIE_CONSISTENCY_PCT,
  extractNarrativeNutrientClaims,
  checkNarrativeAgainstComputed,
} from "@/lib/recipes-nutrition";
import { REFS, cleanIngredients, CLEAN_GOLDEN, REF_ROWS } from "./recipes-fixtures";

describe("computeRecipeNutrition — golden constants (§12.1 item 2)", () => {
  it("computes the hand-verified totals for the clean pair", () => {
    const out = computeRecipeNutrition({
      servings: CLEAN_GOLDEN.servings,
      ingredients: cleanIngredients(),
      refs: REFS,
    });
    expect(out.totals.calories).toBe(CLEAN_GOLDEN.calories);
    expect(out.totals.protein_g).toBeCloseTo(CLEAN_GOLDEN.protein_g, 2);
    expect(out.totals.carbs_g).toBeCloseTo(CLEAN_GOLDEN.carbs_g, 2);
    expect(out.totals.fat_g).toBeCloseTo(CLEAN_GOLDEN.fat_g, 2);
  });

  it("divides per-serving by the declared servings", () => {
    const out = computeRecipeNutrition({
      servings: CLEAN_GOLDEN.servings,
      ingredients: cleanIngredients(),
      refs: REFS,
    });
    expect(out.perServing.calories).toBe(Math.round(CLEAN_GOLDEN.calories / CLEAN_GOLDEN.servings));
    expect(out.perServing.protein_g).toBeCloseTo(CLEAN_GOLDEN.protein_g / CLEAN_GOLDEN.servings, 2);
    // serving weight = total weight ÷ servings (300+200+15+150 = 665g)
    expect(out.servingWeightG).toBeCloseTo(665 / 3, 1);
    expect(out.totalWeightG).toBe(665);
  });

  it("counts the cooking oil as a FULL ingredient (owner «لا تتجاهل الزيوت»)", () => {
    const withOil = computeRecipeNutrition({
      servings: 1,
      ingredients: [
        { position: 1, amount_g: 200, weight_state: "raw", name_ar: "صدور دجاج", name_en: "Chicken breast", nutrient_ref_slug: "chicken-breast" },
        { position: 2, amount_g: 15, weight_state: "raw", name_ar: "زيت زيتون", name_en: "Olive oil", nutrient_ref_slug: "olive-oil" },
      ],
      refs: REFS,
    });
    const withoutOil = computeRecipeNutrition({
      servings: 1,
      ingredients: [
        { position: 1, amount_g: 200, weight_state: "raw", name_ar: "صدور دجاج", name_en: "Chicken breast", nutrient_ref_slug: "chicken-breast" },
      ],
      refs: REFS,
    });
    // 15g olive oil = 132.6 kcal + 15g fat — ignoring it is NOT an option.
    expect(withOil.totals.calories - withoutOil.totals.calories).toBe(Math.round(884 * 0.15));
    expect(withOil.totals.fat_g - withoutOil.totals.fat_g).toBeCloseTo(15, 2);
  });

  it("computes on the ENTERED weight state (raw grams, raw reference)", () => {
    const out = computeRecipeNutrition({
      servings: 2,
      ingredients: [
        { position: 1, amount_g: 250, weight_state: "raw", name_ar: "أرز أبيض", name_en: "White rice", nutrient_ref_slug: "white-rice" },
      ],
      refs: REFS,
    });
    // 250g raw rice × per100g — the unified standard (§5.2-3).
    expect(out.totals.calories).toBe(900);
    expect(out.totals.carbs_g).toBeCloseTo(197.5, 2);
  });

  it("records the source + version for EVERY ingredient (owner «حفظ المرجع والإصدار»)", () => {
    const out = computeRecipeNutrition({
      servings: 2,
      ingredients: cleanIngredients(),
      refs: REFS,
    });
    expect(out.sources).toHaveLength(4);
    for (const s of out.sources) {
      expect(s.source).toBe("USDA FDC");
      expect(s.version).toBe("SR-Legacy-curated-2026-11");
      expect(REFS.has(s.ref_slug)).toBe(true);
    }
    const chicken = out.sources.find((s) => s.ref_slug === "chicken-breast");
    expect(chicken?.fdc_id).toBe("05064");
  });

  it("keeps optional sodium/sat-fat NULL when the reference lacks them (owner §2)", () => {
    const out = computeRecipeNutrition({
      servings: 4,
      ingredients: [
        { position: 1, amount_g: 400, weight_state: "raw", name_ar: "ملوخية", name_en: "Molokhia", nutrient_ref_slug: "molokhia" },
      ],
      refs: REFS,
    });
    expect(out.totals.sodium_mg).toBeNull();
    expect(out.totals.sat_fat_g).toBeNull();
    expect(out.sodiumCoverage).toBe("none");
  });

  it("labels partial sodium coverage honestly", () => {
    const out = computeRecipeNutrition({
      servings: 2,
      ingredients: [
        { position: 1, amount_g: 300, weight_state: "raw", name_ar: "صدور دجاج", name_en: "Chicken breast", nutrient_ref_slug: "chicken-breast" },
        { position: 2, amount_g: 200, weight_state: "raw", name_ar: "ملوخية", name_en: "Molokhia", nutrient_ref_slug: "molokhia" },
      ],
      refs: REFS,
    });
    expect(out.sodiumCoverage).toBe("partial");
  });

  it("throws the N-GATE-1 contract on a missing reference row (no guessing)", () => {
    expect(() =>
      computeRecipeNutrition({
        servings: 2,
        ingredients: [
          { position: 1, amount_g: 100, weight_state: "raw", name_ar: "مكون مجهول", name_en: "Mystery ingredient", nutrient_ref_slug: "does-not-exist" },
        ],
        refs: REFS,
      }),
    ).toThrowError(/N-GATE-1/);
  });

  it("throws the N-GATE-1 contract on a zero/negative weight", () => {
    expect(() =>
      computeRecipeNutrition({
        servings: 2,
        ingredients: [
          { position: 1, amount_g: 0, weight_state: "raw", name_ar: "أرز", name_en: "Rice", nutrient_ref_slug: "white-rice" },
        ],
        refs: REFS,
      }),
    ).toThrowError(/N-GATE-1/);
  });
});

describe("calorie consistency — the 4/4/9 law (§12.1 item 3, property)", () => {
  it("tolerance = max(150 kcal, 12%) — the banded law (USDA drift evidence)", () => {
    expect(calorieTolerance(100)).toBe(CALORIE_CONSISTENCY_ABS_KCAL); // 12% of 100 = 12 → floor 150
    expect(calorieTolerance(2000)).toBe(240); // 12% of 2000
    expect(CALORIE_CONSISTENCY_ABS_KCAL).toBe(150);
    expect(CALORIE_CONSISTENCY_PCT).toBe(0.12);
    expect(KCAL_PER_G_PROTEIN).toBe(4);
    expect(KCAL_PER_G_CARB).toBe(4);
    expect(KCAL_PER_G_FAT).toBe(9);
  });

  it("PASSES on 60 generated random ingredient sets (property)", () => {
    // Deterministic PRNG (no flaky CI).
    let seed = 20261110;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let trial = 0; trial < 60; trial++) {
      const n = 2 + Math.floor(rand() * 4); // 2..5 ingredients
      const ingredients = Array.from({ length: n }, (_, i) => {
        const ref = REF_ROWS[Math.floor(rand() * REF_ROWS.length)];
        return {
          position: i + 1,
          amount_g: 20 + Math.round(rand() * 330), // realistic per-ingredient range
          weight_state: "raw" as const,
          name_ar: `مكون ${i + 1}`,
          name_en: `Ingredient ${i + 1}`,
          nutrient_ref_slug: ref.slug,
        };
      });
      const servings = 1 + Math.floor(rand() * 6); // 1..6
      const out = computeRecipeNutrition({ servings, ingredients, refs: REFS });
      expect(
        out.consistency.total.pass,
        `trial ${trial}: computed ${out.consistency.total.computed} vs macros ${out.consistency.total.fromMacros}`,
      ).toBe(true);
      expect(
        out.consistency.perServing.pass,
        `trial ${trial} per-serving: computed ${out.consistency.perServing.computed} vs macros ${out.consistency.perServing.fromMacros}`,
      ).toBe(true);
    }
  });

  it("FAILS a fabricated calorie/macro mismatch (the gate has teeth)", () => {
    // A calorie number inconsistent with its macros by construction:
    // protein-heavy but claiming pure-oil calories.
    const inconsistent = new Map(REFS);
    inconsistent.set("fabricated", {
      slug: "fabricated",
      per100g: { calories: 900, protein_g: 90, carbs_g: 0, fat_g: 0.5, fiber_g: 0 },
      source_name: "test",
      source_version: "test",
    });
    const out = computeRecipeNutrition({
      servings: 1,
      ingredients: [
        { position: 1, amount_g: 100, weight_state: "raw", name_ar: "مفبرك", name_en: "Fabricated", nutrient_ref_slug: "fabricated" },
      ],
      refs: inconsistent,
    });
    expect(out.consistency.total.pass).toBe(false);
  });
});

describe("narrative number extraction (N-GATE-4 input)", () => {
  it("extracts calorie and macro-gram claims in both digit systems", () => {
    const en = extractNarrativeNutrientClaims("Each serving has about 413 kcal and 27 g protein.");
    expect(en.some((c) => c.kind === "calories")).toBe(true);
    expect(en.some((c) => c.kind === "grams" && /protein/.test(c.raw))).toBe(true);
    const ar = extractNarrativeNutrientClaims("كل حصة تحتوي على حوالي ٤١٣ سعرة و ٢٧ جم بروتين.");
    expect(ar.some((c) => c.kind === "calories")).toBe(true);
    expect(ar.some((c) => c.kind === "grams" && /بروتين/.test(c.raw))).toBe(true);
  });

  it("flags a narrative claim that contradicts the computed truth", () => {
    const claims = extractNarrativeNutrientClaims("Only 100 kcal per serving.");
    const bad = checkNarrativeAgainstComputed(claims, {
      calories: 413,
      protein_g: 27.6,
      carbs_g: 54.6,
      fat_g: 8.1,
      fiber_g: 3.3,
      sat_fat_g: 1.2,
      sodium_mg: 210,
    });
    expect(bad.length).toBeGreaterThan(0);
    expect(bad[0].reason).toMatch(/calorie claim \d+ vs computed \d+ \(tol/);
  });

  it("accepts a narrative claim within the declared rounding band", () => {
    const claims = extractNarrativeNutrientClaims("About 410 kcal per serving.");
    const bad = checkNarrativeAgainstComputed(claims, {
      calories: 413,
      protein_g: 27.6,
      carbs_g: 54.6,
      fat_g: 8.1,
      fiber_g: 3.3,
      sat_fat_g: 1.2,
      sodium_mg: 210,
    });
    expect(bad.filter((b) => b.claim.kind === "calories")).toHaveLength(0);
  });
});
