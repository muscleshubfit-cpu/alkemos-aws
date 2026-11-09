/**
 * RECIPES-TAXONOMY — the single registry of diet RULES + goal derivation
 * (HEALTHY-RECIPES-PLATFORM plan §5.4 / §8).
 *
 * Pure DATA — no network, no AI, fully unit-testable. The rules engine
 * (recipes-diet-rules.ts) consumes these tables deterministically:
 * `diets[]` on a recipe is written by evaluateDiets() ONLY (D-GATE-1) —
 * any diet list arriving from a model is wiped before storage.
 *
 * SOURCES for the thresholds: the widely published clinical definitions
 * the platform already cites editorially (ketogenic net-carb ceiling,
 * DASH per-meal sodium guidance, high-protein thresholds from ISSN/ACSM
 * position stands). Thresholds are per SERVING.
 */

import type { RecipeDiet, RecipeGoal } from "./recipes-shared";

/* ───────────────────────── Diet rules (§5.4) ───────────────────────── */

/**
 * Macro-based diets — evaluated from nutrition_per_serving.
 * netCarbs = carbs_g − fiber_g (floored at 0).
 */
export type MacroDietRule = {
  diet: RecipeDiet;
  maxNetCarbsG?: number;
  maxCarbsG?: number;
  minProteinG?: number;
  minProteinPct?: number;
  /** only evaluated when sodium coverage is COMPLETE (owner §2 — optional) */
  maxSodiumMg?: number;
  describeAr: string;
  describeEn: string;
};

export const MACRO_DIET_RULES: readonly MacroDietRule[] = [
  {
    diet: "keto",
    maxNetCarbsG: 10,
    describeAr: "الكربوهيدرات الصافية ≤ 10 جم لكل حصة",
    describeEn: "Net carbs ≤ 10 g per serving",
  },
  {
    diet: "low-carb",
    maxCarbsG: 20,
    describeAr: "الكربوهيدرات ≤ 20 جم لكل حصة",
    describeEn: "Carbs ≤ 20 g per serving",
  },
  {
    diet: "high-protein",
    minProteinG: 25,
    minProteinPct: 30,
    describeAr: "بروتين ≥ 25 جم أو ≥ 30% من سعرات الحصة",
    describeEn: "Protein ≥ 25 g or ≥ 30% of serving calories",
  },
  {
    diet: "dash",
    maxSodiumMg: 600,
    describeAr: "صوديوم ≤ 600 مجم لكل حصة (عند اكتمال بيانات الصوديوم)",
    describeEn: "Sodium ≤ 600 mg per serving (only with complete sodium data)",
  },
] as const;

/**
 * Flag-based diets — evaluated from the ingredient flag sets.
 * A diet is assigned ONLY when NO ingredient carries any of its forbidden
 * flags (containment over the whole ingredient list, optional included —
 * the honest reading of «وصفة نباتية»).
 */
export type FlagDietRule = {
  diet: RecipeDiet;
  forbiddenFlags: readonly string[];
  describeAr: string;
  describeEn: string;
};

export const FLAG_DIET_RULES: readonly FlagDietRule[] = [
  {
    diet: "vegan",
    forbiddenFlags: ["meat", "fish", "shellfish", "dairy", "egg", "honey", "animal", "organ"],
    describeAr: "بلا لحوم أو أسماك أو ألبان أو بيض أو عسل",
    describeEn: "No meat, fish, dairy, eggs, or honey",
  },
  {
    diet: "vegetarian",
    forbiddenFlags: ["meat", "fish", "shellfish", "animal", "organ"],
    describeAr: "بلا لحوم أو أسماك (يسمح بالألبان والبيض)",
    describeEn: "No meat or fish (dairy and eggs allowed)",
  },
  {
    diet: "pescatarian",
    forbiddenFlags: ["meat", "animal", "organ"],
    describeAr: "بلا لحوم برية (يسمح بالأسماك)",
    describeEn: "No land meat (fish allowed)",
  },
  {
    diet: "gluten-free",
    forbiddenFlags: ["gluten"],
    describeAr: "بلا مكونات تحتوي الجلوتين",
    describeEn: "No gluten-containing ingredients",
  },
  {
    diet: "dairy-free",
    forbiddenFlags: ["dairy"],
    describeAr: "بلا مكونات الألبان",
    describeEn: "No dairy ingredients",
  },
] as const;

/**
 * Mediterranean — a PATTERN rule (not a single macro or flag): olive oil
 * or fish present, at least two distinct vegetables, and red meat not
 * dominating the plate (< 40% of total ingredient weight).
 */
export const MEDITERRANEAN_RULE = {
  diet: "mediterranean" as RecipeDiet,
  minVegetables: 2,
  maxRedMeatWeightShare: 0.4,
  describeAr: "زيت زيتون أو أسماك + خضاران على الأقل + اللحم الأحمر ليس مهيمنًا",
  describeEn: "Olive oil or fish + at least two vegetables + red meat not dominant",
} as const;

/* ───────────────────────── Goal derivation (§8-1) ───────────────────────── */

/**
 * Goals derive from per-serving calorie density + protein share — the
 * deterministic matrix (plan §5.4 last line).sports-nutrition requires an
 * explicit pre/post-workout meal type (checked at the call site).
 */
export const GOAL_MATRIX = {
  "weight-loss": { maxCalories: 450, minProteinG: 20 },
  "muscle-gain": { minCalories: 500, minProteinG: 30 },
  "weight-gain": { minCalories: 650 },
  maintenance: { minCalories: 350, maxCalories: 650 },
} as const;

export const SPORTS_NUTRITION_MEAL_TYPES = ["pre-workout", "post-workout"] as const;

/** All assignable goals (the AI may PROPOSE goals, but R2 re-derives them
 *  deterministically — proposal and derivation must agree or the gate
 *  rewrites; D-GATE-1's philosophy applied to goals too). */
export function deriveGoals(input: {
  caloriesPerServing: number;
  proteinPerServing: number;
  mealTypes: readonly string[];
}): RecipeGoal[] {
  const out = new Set<RecipeGoal>();
  const c = input.caloriesPerServing;
  const p = input.proteinPerServing;

  if (c <= GOAL_MATRIX["weight-loss"].maxCalories && p >= GOAL_MATRIX["weight-loss"].minProteinG)
    out.add("weight-loss");
  if (c >= GOAL_MATRIX["muscle-gain"].minCalories && p >= GOAL_MATRIX["muscle-gain"].minProteinG)
    out.add("muscle-gain");
  if (c >= GOAL_MATRIX["weight-gain"].minCalories) out.add("weight-gain");
  if (c >= GOAL_MATRIX.maintenance.minCalories && c <= GOAL_MATRIX.maintenance.maxCalories)
    out.add("maintenance");
  if (p >= 25 || (c > 0 && (p * 4 * 100) / c >= 30)) out.add("high-protein");
  if (
    input.mealTypes.some((m) =>
      (SPORTS_NUTRITION_MEAL_TYPES as readonly string[]).includes(m),
    )
  )
    out.add("sports-nutrition");

  return Array.from(out);
}

/* ───────────────────────── Hub page copy (bilingual, real value) ───────────────────────── */

/** Hub pages explain the RULE behind each diet listing — real value, not
 *  auto-list fluff (plan §9.1 diet pages requirement). */
export function dietHubCopy(diet: RecipeDiet): { ar: string; en: string } {
  const macro = MACRO_DIET_RULES.find((r) => r.diet === diet);
  if (macro) return { ar: macro.describeAr, en: macro.describeEn };
  const flag = FLAG_DIET_RULES.find((r) => r.diet === diet);
  if (flag) return { ar: flag.describeAr, en: flag.describeEn };
  if (diet === "mediterranean")
    return { ar: MEDITERRANEAN_RULE.describeAr, en: MEDITERRANEAN_RULE.describeEn };
  return { ar: "", en: "" };
}
