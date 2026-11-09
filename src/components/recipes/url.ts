/**
 * URL-state helpers for the public recipes explorer (client + server safe).
 *
 * The foods-list precedent (2026-09-05 audit): filters live in the URL
 * (?cuisine=…&diet=…&maxcal=…&page=2), the grid renders server-side,
 * and every pill/toggle is a plain crawlable <Link>. These helpers
 * build those URLs consistently from both sides.
 *
 * HEALTHY-RECIPES-PLATFORM plan §8-3: the owner-required filters —
 * calories / protein / prep time / budget — plus the four taxonomy
 * axes (cuisine / diet / goal / meal).
 */

import {
  RECIPE_CUISINES,
  RECIPE_DIETS,
  RECIPE_GOALS,
  RECIPE_MEAL_TYPES,
  RECIPES_FILTER_LIMITS,
  type RecipeCuisine,
  type RecipeDiet,
  type RecipeGoal,
  type RecipeMealType,
} from "@/lib/recipes-shared";

export type RecipesQuery = {
  cuisine: RecipeCuisine | "all";
  diet: RecipeDiet | "all";
  goal: RecipeGoal | "all";
  meal: RecipeMealType | "all";
  maxTime: string;
  maxCalories: string;
  minProtein: string;
  page: number;
};

export const EMPTY_RECIPES_QUERY: RecipesQuery = {
  cuisine: "all",
  diet: "all",
  goal: "all",
  meal: "all",
  maxTime: "",
  maxCalories: "",
  minProtein: "",
  page: 1,
};

const CUISINE_SET = new Set<string>(RECIPE_CUISINES);
const DIET_SET = new Set<string>(RECIPE_DIETS);
const GOAL_SET = new Set<string>(RECIPE_GOALS);
const MEAL_SET = new Set<string>(RECIPE_MEAL_TYPES);

/** Parses + validates raw searchParams into a RecipesQuery. */
export function parseRecipesQuery(
  sp: Record<string, string | string[] | undefined>,
): RecipesQuery {
  const one = (k: string): string => {
    const v = sp[k];
    if (Array.isArray(v)) return v[0] ?? "";
    return v ?? "";
  };
  const num = (k: string): string => one(k).replace(/[^\d]/g, "").slice(0, 4);
  const pageRaw = parseInt(one("page"), 10);
  const cuisine = one("cuisine");
  const diet = one("diet");
  const goal = one("goal");
  const meal = one("meal");
  return {
    cuisine: CUISINE_SET.has(cuisine) ? (cuisine as RecipeCuisine) : "all",
    diet: DIET_SET.has(diet) ? (diet as RecipeDiet) : "all",
    goal: GOAL_SET.has(goal) ? (goal as RecipeGoal) : "all",
    meal: MEAL_SET.has(meal) ? (meal as RecipeMealType) : "all",
    maxTime: num("maxtime"),
    maxCalories: num("maxcal"),
    minProtein: num("minprotein"),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

/** Serializes a RecipesQuery into a relative href (no trailing ? when
 *  everything is default). `over` lets callers override one field. */
export function buildRecipesHref(
  base: string,
  q: RecipesQuery,
  over: Partial<RecipesQuery> = {},
): string {
  const merged = { ...q, ...over };
  const params = new URLSearchParams();
  if (merged.cuisine !== "all") params.set("cuisine", merged.cuisine);
  if (merged.diet !== "all") params.set("diet", merged.diet);
  if (merged.goal !== "all") params.set("goal", merged.goal);
  if (merged.meal !== "all") params.set("meal", merged.meal);
  if (merged.maxTime) params.set("maxtime", merged.maxTime);
  if (merged.maxCalories) params.set("maxcal", merged.maxCalories);
  if (merged.minProtein) params.set("minprotein", merged.minProtein);
  if (merged.page > 1) params.set("page", String(merged.page));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** The numeric filter choices rendered as pills (single source). */
export const RECIPES_TIME_CHOICES = RECIPES_FILTER_LIMITS.maxTimeChoices;
export const RECIPES_CAL_CHOICES = RECIPES_FILTER_LIMITS.maxCaloriesChoices;
export const RECIPES_PROTEIN_CHOICES = RECIPES_FILTER_LIMITS.minProteinChoices;
