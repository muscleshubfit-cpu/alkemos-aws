import { describe, it, expect } from "vitest";
import {
  runRecipeQualityGates,
  titleSimilarity,
  INGREDIENT_CEILING_G_BY_CATEGORY,
  type RecipeGateInput,
} from "@/lib/recipes-quality-gates";
import { computeRecipeNutrition, type IngredientInput, type NutrientRefRow } from "@/lib/recipes-nutrition";

/**
 * P1 canaries — the recipes battery: REC-3 (quantity sanity N-GATE-5),
 * REC-9 (title similarity), REC-14 (halal prose Q-GATE-5), REC-15
 * (steps↔ingredients coherence Q-GATE-6), REC-5 (weight-state conversion)
 * and REC-8 (sat-fat coverage).
 */

const ref = (slug: string, category: string, per100g: Partial<NutrientRefRow["per100g"]> = {}, yieldCooked?: number): NutrientRefRow => ({
  slug,
  per100g: {
    calories: 150,
    protein_g: 20,
    carbs_g: 5,
    fat_g: 5,
    fiber_g: 1,
    ...per100g,
  },
  category,
  ...(yieldCooked ? { yield_cooked_g: yieldCooked } : {}),
});

const ing = (
  i: number,
  nameAr: string,
  nameEn: string,
  slug: string,
  amountG: number,
  over: Partial<IngredientInput> = {},
): IngredientInput => ({
  position: i,
  amount_g: amountG,
  weight_state: "raw",
  name_ar: nameAr,
  name_en: nameEn,
  nutrient_ref_slug: slug,
  ...over,
});

const baseInput = (over: Partial<RecipeGateInput> = {}): RecipeGateInput => ({
  pairSlug: "test-dish",
  servings: 2,
  servingWeightG: 400,
  prepMinutes: 15,
  cookMinutes: 25,
  ingredients: [
    ing(1, "صدور دجاج", "chicken breast", "chicken-breast-raw", 300),
    ing(2, "أرز أبيض", "white rice", "white-rice-raw", 200),
    ing(3, "زيت زيتون", "olive oil", "olive-oil", 30),
  ],
  refs: new Map<string, NutrientRefRow>([
    ["chicken-breast-raw", ref("chicken-breast-raw", "poultry", {}, 70)],
    ["white-rice-raw", ref("white-rice-raw", "grain", {}, 280)],
    ["olive-oil", ref("olive-oil", "oil", { calories: 884, fat_g: 100 })],
  ]),
  versions: [
    {
      language: "ar",
      title: "طبق تجريبي صحي",
      excerpt: "مقدمة تجريبية",
      steps: [
        { position: 1, text: "تبّل الدجاج بالملح والفلفل" },
        { position: 2, text: "اشوِ الدجاج مع الأرز" },
        { position: 3, text: "أضف زيت الزيتون قبل التقديم" },
      ],
      tips: "قدّمه ساخنًا",
      storageInfo: "يوم في الثلاجة",
    },
    {
      language: "en",
      title: "Healthy Test Dish",
      excerpt: "A test excerpt",
      steps: [
        { position: 1, text: "Season the chicken" },
        { position: 2, text: "Grill the chicken with the rice" },
        { position: 3, text: "Drizzle the olive oil" },
      ],
      tips: "Serve hot",
      storageInfo: "One day",
    },
  ],
  perServing: { calories: 550, protein_g: 40, carbs_g: 50, fat_g: 18, fiber_g: 2, sat_fat_g: 3, sodium_mg: 200 },
  consistency: {
    total: { pass: true, computed: 1100, fromMacros: 1100 },
    perServing: { pass: true, computed: 550, fromMacros: 550 },
  },
  derivedDiets: ["high-protein"],
  imageUrl: "https://x.com/i.jpg",
  imageVerified: true,
  // REC-4 second half (P2-7): the alt scan field — null keeps this
  // battery's semantics identical to its pre-P2-7 form.
  imageAltAr: null,
  existingPairSlugs: new Set(),
  existingTitlesByLang: new Map([
    ["ar", new Set(["شاورما دجاج صحية"])],
    ["en", new Set(["Healthy Chicken Shawarma"])],
  ]),
  publishedIngredientSets: [],
  ...over,
});

describe("REC-3 — N-GATE-5 quantity sanity", () => {
  it("a hallucinated spice quantity (2,000g salt-class) holds with rerun r1-structure", () => {
    const out = runRecipeQualityGates(
      baseInput({
        ingredients: [
          ...baseInput().ingredients.slice(0, 2),
          ing(3, "ملح", "salt", "salt", 2000),
        ],
        refs: new Map([
          ...baseInput().refs,
          ["salt", ref("salt", "spice")],
        ]),
      }),
    );
    const v = out.find((x) => x.gate === "N-GATE-5");
    expect(v).toBeDefined();
    expect(v?.message).toContain("rerun r1-structure");
  });

  it("the category ceilings follow the map (oil 300 / spice 60 / meat 2500)", () => {
    expect(INGREDIENT_CEILING_G_BY_CATEGORY.spice).toBe(60);
    expect(INGREDIENT_CEILING_G_BY_CATEGORY.oil).toBe(300);
    expect(INGREDIENT_CEILING_G_BY_CATEGORY.meat).toBe(2500);
  });

  it("a realistic recipe passes N-GATE-5 cleanly", () => {
    const out = runRecipeQualityGates(baseInput());
    expect(out.some((x) => x.gate === "N-GATE-5")).toBe(false);
  });

  it("an impossible serving weight holds", () => {
    const out = runRecipeQualityGates(baseInput({ servingWeightG: 3000 }));
    expect(out.some((x) => x.gate === "N-GATE-5" && x.message.includes("serving weight"))).toBe(true);
  });

  it("an impossible per-serving calorie band holds", () => {
    const out = runRecipeQualityGates(
      baseInput({
        perServing: { calories: 2200, protein_g: 40, carbs_g: 50, fat_g: 18, fiber_g: 2, sat_fat_g: 3, sodium_mg: 200 },
      }),
    );
    expect(out.some((x) => x.gate === "N-GATE-5" && x.message.includes("kcal"))).toBe(true);
  });
});

describe("REC-9 — normalized title similarity", () => {
  it("a reworded duplicate title (≥0.85 token-set similarity) holds at r0", () => {
    const out = runRecipeQualityGates(
      baseInput({
        versions: [
          { ...baseInput().versions[0]!, title: "شاورما الدجاج الصحية" },
          baseInput().versions[1]!,
        ],
      }),
    );
    const v = out.find((x) => x.gate === "Q-GATE-4" && x.message.includes("%"));
    expect(v).toBeDefined();
    expect(v?.message).toContain("rerun r0-idea");
  });

  it("a genuinely different title passes", () => {
    expect(titleSimilarity("شاورما دجاج صحية", "كشري مصري بالعدس")).toBeLessThan(0.3);
    expect(runRecipeQualityGates(baseInput()).some((x) => x.gate === "Q-GATE-4")).toBe(false);
  });
});

describe("REC-14 — the halal prose scan (Q-GATE-5)", () => {
  it("a «رشة نبيذ» tip holds with rerun r3-authoring", () => {
    const out = runRecipeQualityGates(
      baseInput({
        versions: [
          { ...baseInput().versions[0]!, tips: "أضف رشة نبيذ أبيض للنكهة" },
          baseInput().versions[1]!,
        ],
      }),
    );
    const v = out.find((x) => x.gate === "Q-GATE-5");
    expect(v).toBeDefined();
    expect(v?.message).toContain("rerun r3-authoring");
  });

  it("a rum substitution suggestion holds (the audit's «استبدل الفانيلا بالروم»)", () => {
    const out = runRecipeQualityGates(
      baseInput({
        versions: [
          baseInput().versions[0]!,
          { ...baseInput().versions[1]!, tips: "or substitute the vanilla with rum for depth" },
        ],
      }),
    );
    expect(out.some((x) => x.gate === "Q-GATE-5")).toBe(true);
  });

  it("cooking vinegar in the narrative passes (the exception)", () => {
    const out = runRecipeQualityGates(
      baseInput({
        versions: [
          { ...baseInput().versions[0]!, tips: "يمكن استبدال خل التفاح بخل النبيذ" },
          baseInput().versions[1]!,
        ],
      }),
    );
    expect(out.some((x) => x.gate === "Q-GATE-5")).toBe(false);
  });
});

describe("REC-15 — steps↔ingredients coherence (Q-GATE-6)", () => {
  it("a non-optional ingredient never mentioned in the steps holds", () => {
    const out = runRecipeQualityGates(
      baseInput({
        versions: [
          {
            ...baseInput().versions[0]!,
            steps: [
              { position: 1, text: "سخّن المقلاة" },
              { position: 2, text: "اشوِ الدجاج" },
              { position: 3, text: "قدّم الطبق" },
            ],
          },
          baseInput().versions[1]!,
        ],
      }),
    );
    const v = out.find((x) => x.gate === "Q-GATE-6" && x.message.includes("never mention"));
    expect(v).toBeDefined();
    expect(v?.message).toContain("rerun r3-authoring");
  });

  it("a ghost cream mention in the steps holds (the audit's «شبح كريمة»)", () => {
    const out = runRecipeQualityGates(
      baseInput({
        versions: [
          {
            ...baseInput().versions[0]!,
            steps: [
              { position: 1, text: "تبّل الدجاج" },
              { position: 2, text: "اشوِ الدجاج مع الأرز" },
              { position: 3, text: "أضف ملعقة كريمة الطبخ قبل التقديم مع زيت الزيتون" },
            ],
          },
          baseInput().versions[1]!,
        ],
      }),
    );
    expect(out.some((x) => x.gate === "Q-GATE-6" && x.message.includes("ghost"))).toBe(true);
  });

  it("a coherent recipe passes Q-GATE-6", () => {
    expect(runRecipeQualityGates(baseInput()).some((x) => x.gate === "Q-GATE-6")).toBe(false);
  });
});

describe("REC-5 — weight-state conversion at the computation layer", () => {
  const refs = new Map<string, NutrientRefRow>([
    ["chicken-breast-raw", ref("chicken-breast-raw", "poultry", { calories: 120, protein_g: 22 }, 70)],
  ]);

  it("cooked grams on a RAW row are converted up through the yield (no more −27% silently)", () => {
    const rawDeclared = computeRecipeNutrition({
      servings: 1,
      ingredients: [ing(1, "دجاج", "chicken", "chicken-breast-raw", 150, { weight_state: "raw" })],
      refs,
    });
    const cookedDeclared = computeRecipeNutrition({
      servings: 1,
      ingredients: [ing(1, "دجاج", "chicken", "chicken-breast-raw", 150, { weight_state: "cooked" })],
      refs,
    });
    // 150g cooked = 150/0.7 ≈ 214g raw-equivalent → ~43% MORE calories
    expect(cookedDeclared.totals.calories).toBeGreaterThan(rawDeclared.totals.calories * 1.3);
  });

  it("matching states keep the legacy arithmetic", () => {
    const a = computeRecipeNutrition({
      servings: 1,
      ingredients: [ing(1, "دجاج", "chicken", "chicken-breast-raw", 200, { weight_state: "raw" })],
      refs,
    });
    expect(a.totals.calories).toBe(240); // 200/100 × 120 exactly
  });
});

describe("REC-8 — the sat-fat coverage record", () => {
  it("partial sat-fat data records «partial» (the display layer reads it)", () => {
    const refs = new Map<string, NutrientRefRow>([
      ["with-sat", ref("with-sat", "poultry", { sat_fat_g: 3 })],
      ["without-sat", ref("without-sat", "grain", {})],
    ]);
    const out = computeRecipeNutrition({
      servings: 2,
      ingredients: [
        ing(1, "أ", "a", "with-sat", 200),
        ing(2, "ب", "b", "without-sat", 200),
      ],
      refs,
    });
    expect(out.satFatCoverage).toBe("partial");
    expect(out.sodiumCoverage).toBe("none");
  });

  it("complete data records «complete»", () => {
    const refs = new Map<string, NutrientRefRow>([
      ["with-sat", ref("with-sat", "poultry", { sat_fat_g: 3, sodium_mg: 60 })],
    ]);
    const out = computeRecipeNutrition({
      servings: 2,
      ingredients: [ing(1, "أ", "a", "with-sat", 200)],
      refs,
    });
    expect(out.satFatCoverage).toBe("complete");
    expect(out.sodiumCoverage).toBe("complete");
  });
});
