/**
 * RECIPES-DIET-RULES — the deterministic diet evaluation engine
 * (HEALTHY-RECIPES-PLATFORM plan §5.1/§5.4).
 *
 * evaluateDiets() is the ONLY writer of recipes.diets[] (D-GATE-1): the
 * function is pure, data comes from recipes-taxonomy.ts, and any diet
 * list proposed by the structure model is wiped before this engine
 * re-derives it.
 *
 * sodium: DASH requires COMPLETE sodium coverage (owner correction §2 —
 * absent sodium data must never block or fabricate; the diet simply is
 * not assigned when coverage is partial).
 */

import {
  MACRO_DIET_RULES,
  FLAG_DIET_RULES,
  MEDITERRANEAN_RULE,
  deriveGoals,
} from "./recipes-taxonomy";
import type { NutritionTotals } from "./recipes-nutrition";
import type { RecipeDiet, RecipeGoal } from "./recipes-shared";

export type DietEvaluationInput = {
  perServing: NutritionTotals;
  sodiumCoverage: "none" | "partial" | "complete";
  /** per-ingredient flag arrays from the matched nutrient_reference rows */
  ingredientFlags: readonly (readonly string[])[];
  /** per-ingredient category (from the reference rows) for pattern rules */
  ingredientCategories?: readonly string[];
  /** per-ingredient weights (grams) for dominance rules */
  ingredientWeights?: readonly number[];
};

function netCarbs(perServing: NutritionTotals): number {
  return Math.max(0, perServing.carbs_g - perServing.fiber_g);
}

/**
 * Evaluate ALL diets deterministically. Returns the EXCLUSIVE diet list —
 * callers must store this and nothing else (D-GATE-1).
 */
export function evaluateDiets(input: DietEvaluationInput): RecipeDiet[] {
  const out = new Set<RecipeDiet>();
  const { perServing, sodiumCoverage, ingredientFlags } = input;

  // ── Macro rules ──
  for (const rule of MACRO_DIET_RULES) {
    let pass = true;
    if (rule.maxNetCarbsG !== undefined && netCarbs(perServing) > rule.maxNetCarbsG) pass = false;
    if (rule.maxCarbsG !== undefined && perServing.carbs_g > rule.maxCarbsG) pass = false;
    if (rule.minProteinG !== undefined && perServing.protein_g < rule.minProteinG) {
      // OR-condition with the % share (high-protein only)
      const totalKcal = perServing.protein_g * 4 + perServing.carbs_g * 4 + perServing.fat_g * 9;
      const proteinPct = totalKcal > 0 ? (perServing.protein_g * 4 * 100) / totalKcal : 0;
      if (rule.minProteinPct === undefined || proteinPct < rule.minProteinPct) pass = false;
    }
    if (rule.maxSodiumMg !== undefined) {
      // Owner correction §2: sodium is optional — the diet is only assigned
      // when coverage is COMPLETE and the value is known to fit.
      if (sodiumCoverage !== "complete" || perServing.sodium_mg === null) pass = false;
      else if (perServing.sodium_mg > rule.maxSodiumMg) pass = false;
    }
    if (pass) out.add(rule.diet);
  }

  // ── Flag rules (containment over ALL ingredients, optional included) ──
  for (const rule of FLAG_DIET_RULES) {
    const violated = ingredientFlags.some((flags) =>
      rule.forbiddenFlags.some((f) => flags.includes(f)),
    );
    if (!violated && ingredientFlags.length > 0) out.add(rule.diet);
  }

  // ── Mediterranean pattern rule ──
  if (ingredientFlags.length > 0) {
    const hasOliveOilOrFish = ingredientFlags.some(
      (flags) => flags.includes("oil") || flags.includes("fish"),
    );
    const vegetableCount = ingredientFlags.filter((flags) => flags.includes("vegetable")).length;
    const weights = input.ingredientWeights ?? [];
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    const redMeatWeight = ingredientFlags.reduce((s, flags, i) => {
      if (!flags.includes("red-meat")) return s;
      return s + (weights[i] ?? 0);
    }, 0);
    const redMeatShare = totalWeight > 0 ? redMeatWeight / totalWeight : 0;
    if (
      hasOliveOilOrFish &&
      vegetableCount >= MEDITERRANEAN_RULE.minVegetables &&
      redMeatShare <= MEDITERRANEAN_RULE.maxRedMeatWeightShare
    ) {
      out.add("mediterranean");
    }
  }

  return Array.from(out).sort();
}

/** Convenience wrapper used by R2 — diets + goals in one deterministic pass. */
export function evaluateTaxonomy(input: DietEvaluationInput & {
  caloriesPerServing: number;
  proteinPerServing: number;
  mealTypes: readonly string[];
}): { diets: RecipeDiet[]; goals: RecipeGoal[] } {
  return {
    diets: evaluateDiets(input),
    goals: deriveGoals({
      caloriesPerServing: input.caloriesPerServing,
      proteinPerServing: input.proteinPerServing,
      mealTypes: input.mealTypes,
    }),
  };
}

/* ── A tiny self-assertion consumed by the canaries: the closed sets
 * (taxonomy + rules) must cover EXACTLY the ten owner-required diets. ── */
export const EXPECTED_DIET_SET: readonly RecipeDiet[] = [
  "keto",
  "low-carb",
  "high-protein",
  "mediterranean",
  "vegetarian",
  "vegan",
  "pescatarian",
  "dash",
  "gluten-free",
  "dairy-free",
];

export function dietRulesCoverAll(): boolean {
  const covered = new Set<RecipeDiet>();
  for (const r of MACRO_DIET_RULES) covered.add(r.diet);
  for (const r of FLAG_DIET_RULES) covered.add(r.diet);
  covered.add(MEDITERRANEAN_RULE.diet);
  return EXPECTED_DIET_SET.every((d) => covered.has(d));
}
