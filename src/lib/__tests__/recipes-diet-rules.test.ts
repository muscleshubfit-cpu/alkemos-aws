import { describe, it, expect } from "vitest";

/**
 * RECIPES DIET RULES — the deterministic engine canary
 * (HEALTHY-RECIPES-PLATFORM plan §12.1 item 4): every diet in the
 * closed taxonomy is accepted/rejected deterministically at its
 * boundary (D-GATE-1: the AI never assigns diets — only this engine).
 */
import { evaluateDiets, evaluateTaxonomy, EXPECTED_DIET_SET, dietRulesCoverAll } from "@/lib/recipes-diet-rules";
import type { NutritionTotals } from "@/lib/recipes-nutrition";
import { MACRO_DIET_RULES, FLAG_DIET_RULES, MEDITERRANEAN_RULE } from "@/lib/recipes-taxonomy";

function per(partial: Partial<NutritionTotals>): NutritionTotals {
  return {
    calories: 500,
    protein_g: 30,
    carbs_g: 40,
    fat_g: 20,
    fiber_g: 5,
    sat_fat_g: 4,
    sodium_mg: 300,
    ...partial,
  };
}

const FULL_SODIUM = "complete" as const;
const NO_SODIUM = "none" as const;

describe("the diet rule registry covers the full closed set", () => {
  it("every RecipeDiet has a rule and every rule maps to a real diet", () => {
    expect(dietRulesCoverAll()).toBe(true);
    expect(EXPECTED_DIET_SET).toHaveLength(10);
  });

  it("macro rules: keto ≤10g net, low-carb ≤20g carbs, high-protein ≥25g or ≥30% kcal", () => {
    const keto = MACRO_DIET_RULES.find((r) => r.diet === "keto")!;
    expect(keto.maxNetCarbsG).toBe(10);
    const lowCarb = MACRO_DIET_RULES.find((r) => r.diet === "low-carb")!;
    expect(lowCarb.maxCarbsG).toBe(20);
    const hp = MACRO_DIET_RULES.find((r) => r.diet === "high-protein")!;
    expect(hp.minProteinG).toBe(25);
    expect(hp.minProteinPct).toBe(30);
    const dash = MACRO_DIET_RULES.find((r) => r.diet === "dash")!;
    expect(dash.maxSodiumMg).toBe(600);
  });
});

describe("macro diets — boundary cases", () => {
  const flags = [["plant"], ["plant"]] as const;

  it("keto: net carbs (carbs − fiber) at and past the 10g boundary", () => {
    // net = 10 exactly → pass
    expect(
      evaluateDiets({ perServing: per({ carbs_g: 15, fiber_g: 5 }), sodiumCoverage: NO_SODIUM, ingredientFlags: flags }),
    ).toContain("keto");
    // net = 10.1 → reject
    expect(
      evaluateDiets({ perServing: per({ carbs_g: 15.1, fiber_g: 5 }), sodiumCoverage: NO_SODIUM, ingredientFlags: flags }),
    ).not.toContain("keto");
  });

  it("low-carb: total carbs at and past 20g", () => {
    expect(
      evaluateDiets({ perServing: per({ carbs_g: 20, fiber_g: 25 }), sodiumCoverage: NO_SODIUM, ingredientFlags: flags }),
    ).toContain("low-carb");
    expect(
      evaluateDiets({ perServing: per({ carbs_g: 20.1, fiber_g: 0 }), sodiumCoverage: NO_SODIUM, ingredientFlags: flags }),
    ).not.toContain("low-carb");
  });

  it("high-protein: passes on grams alone (30g ≥ 25g) even at low share", () => {
    expect(
      evaluateDiets({ perServing: per({ protein_g: 30, calories: 900, carbs_g: 100, fat_g: 30 }), sodiumCoverage: NO_SODIUM, ingredientFlags: flags }),
    ).toContain("high-protein");
  });

  it("low grams can still pass via the ≥30% energy-share branch", () => {
    // 10g P (40 kcal) + 30g C (120) + 0 F = 160 kcal → 25% share — reject
    expect(
      evaluateDiets({ perServing: per({ protein_g: 10, calories: 160, carbs_g: 30, fat_g: 0 }), sodiumCoverage: NO_SODIUM, ingredientFlags: flags }),
    ).not.toContain("high-protein");
    // 20g P (80 kcal) + 5g C (20) + 0 F = 100 kcal → 80% share — pass
    expect(
      evaluateDiets({ perServing: per({ protein_g: 20, calories: 100, carbs_g: 5, fat_g: 0 }), sodiumCoverage: NO_SODIUM, ingredientFlags: flags }),
    ).toContain("high-protein");
  });

  it("DASH: sodium ≤600mg ONLY with complete coverage (owner §2 — optional data)", () => {
    expect(
      evaluateDiets({ perServing: per({ sodium_mg: 600 }), sodiumCoverage: FULL_SODIUM, ingredientFlags: flags }),
    ).toContain("dash");
    expect(
      evaluateDiets({ perServing: per({ sodium_mg: 601 }), sodiumCoverage: FULL_SODIUM, ingredientFlags: flags }),
    ).not.toContain("dash");
    // value fits but coverage partial → NOT assigned (honest unknown)
    expect(
      evaluateDiets({ perServing: per({ sodium_mg: 300 }), sodiumCoverage: "partial", ingredientFlags: flags }),
    ).not.toContain("dash");
    // coverage complete but value null → NOT assigned
    expect(
      evaluateDiets({ perServing: per({ sodium_mg: null }), sodiumCoverage: FULL_SODIUM, ingredientFlags: flags }),
    ).not.toContain("dash");
  });
});

describe("flag diets — containment over ALL ingredients (optional included)", () => {
  it("vegan: zero animal flags passes; ANY animal flag rejects", () => {
    const plants = [["plant"], ["grain"], ["vegetable"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: plants })).toContain("vegan");
    const withEgg = [...plants, ["egg", "animal"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: withEgg })).not.toContain("vegan");
    // honey rejects vegan too
    const withHoney = [...plants, ["honey"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: withHoney })).not.toContain("vegan");
  });

  it("vegetarian: dairy/egg allowed, meat/fish reject", () => {
    const withDairyEgg = [["dairy"], ["egg"], ["plant"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: withDairyEgg })).toContain("vegetarian");
    const withFish = [...withDairyEgg, ["fish"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: withFish })).not.toContain("vegetarian");
  });

  it("pescatarian: fish allowed, land meat rejects", () => {
    const withFish = [["fish"], ["plant"], ["vegetable"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: withFish })).toContain("pescatarian");
    const withMeat = [...withFish, ["meat"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: withMeat })).not.toContain("pescatarian");
  });

  it("gluten-free / dairy-free: single-flag rejection", () => {
    const withGluten = [["grain", "gluten"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: withGluten })).not.toContain("gluten-free");
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: [["grain"]] })).toContain("gluten-free");
    const withDairy = [["dairy"]] as const;
    expect(evaluateDiets({ perServing: per({}), sodiumCoverage: NO_SODIUM, ingredientFlags: withDairy })).not.toContain("dairy-free");
  });
});

describe("mediterranean — the pattern rule", () => {
  it("olive oil + ≥2 vegetables + red meat <40% weight → assigned", () => {
    const out = evaluateDiets({
      perServing: per({}),
      sodiumCoverage: NO_SODIUM,
      ingredientFlags: [["oil"], ["vegetable"], ["vegetable"], ["grain"]],
      ingredientWeights: [15, 150, 120, 80],
    });
    expect(out).toContain("mediterranean");
  });

  it("no oil/fish OR <2 vegetables → rejected", () => {
    expect(
      evaluateDiets({
        perServing: per({}),
        sodiumCoverage: NO_SODIUM,
        ingredientFlags: [["vegetable"], ["vegetable"], ["grain"]],
        ingredientWeights: [100, 100, 100],
      }),
    ).not.toContain("mediterranean");
    expect(
      evaluateDiets({
        perServing: per({}),
        sodiumCoverage: NO_SODIUM,
        ingredientFlags: [["oil"], ["vegetable"], ["grain"]],
        ingredientWeights: [15, 100, 100],
      }),
    ).not.toContain("mediterranean");
  });

  it("red meat dominating (≥40% of weight) → rejected", () => {
    expect(
      evaluateDiets({
        perServing: per({}),
        sodiumCoverage: NO_SODIUM,
        ingredientFlags: [["oil"], ["vegetable"], ["vegetable"], ["red-meat", "meat"]],
        ingredientWeights: [15, 100, 100, 250], // 250/(465) = 53.8% red meat
      }),
    ).not.toContain("mediterranean");
    expect(MEDITERRANEAN_RULE.maxRedMeatWeightShare).toBe(0.4);
  });
});

describe("evaluateTaxonomy — goals derive deterministically", () => {
  it("derives goals from calorie density + protein share (the matrix)", () => {
    const out = evaluateTaxonomy({
      perServing: per({ calories: 350, protein_g: 35, carbs_g: 30, fat_g: 10 }),
      sodiumCoverage: NO_SODIUM,
      ingredientFlags: [["meat"], ["vegetable"]],
      caloriesPerServing: 350,
      proteinPerServing: 35,
      mealTypes: ["dinner"],
    });
    expect(Array.isArray(out.goals)).toBe(true);
    // 35g protein on 350 kcal = 40% energy share → high-protein goal
    expect(out.goals).toContain("high-protein");
    expect(out.diets).toBeDefined();
  });

  it("sports-nutrition requires a pre/post-workout meal type", () => {
    const withWorkout = evaluateTaxonomy({
      perServing: per({}),
      sodiumCoverage: NO_SODIUM,
      ingredientFlags: [["grain"]],
      caloriesPerServing: 400,
      proteinPerServing: 20,
      mealTypes: ["pre-workout"],
    });
    expect(withWorkout.goals).toContain("sports-nutrition");
    const withoutWorkout = evaluateTaxonomy({
      perServing: per({}),
      sodiumCoverage: NO_SODIUM,
      ingredientFlags: [["grain"]],
      caloriesPerServing: 400,
      proteinPerServing: 20,
      mealTypes: ["dinner"],
    });
    expect(withoutWorkout.goals).not.toContain("sports-nutrition");
  });
});

describe("D-GATE-1 — the engine output is exclusive", () => {
  it("FLAG rules exist for exactly the flag-driven diets", () => {
    const flagDiets = FLAG_DIET_RULES.map((r) => r.diet).sort();
    expect(flagDiets).toEqual(["dairy-free", "gluten-free", "pescatarian", "vegan", "vegetarian"]);
  });
});
