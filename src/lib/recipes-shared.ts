/**
 * RECIPES-SHARED — the client-safe types + taxonomy labels of the healthy
 * recipes system (HEALTHY-RECIPES-PLATFORM, owner order 2026-11-10).
 *
 * THE BUNDLE LAW (foods-shared precedent): server-only data modules
 * (recipes-server.ts, nutrient reference queries) never reach the browser;
 * client components import ONLY from this file or receive serializable
 * slices as props.
 *
 * Taxonomy values are CLOSED SETS mirrored one-to-one with the DB columns
 * (migration 0108) and the rules engine (recipes-diet-rules.ts). The
 * labels here are the single source for every UI surface (explorer
 * filters, badges, hub pages, schema output).
 */

/* ───────────────────────── Taxonomy types ───────────────────────── */

export type RecipeCuisine =
  | "egyptian"
  | "gulf"
  | "arab"
  | "mediterranean"
  | "asian"
  | "international";

export type RecipeGoal =
  | "weight-loss"
  | "muscle-gain"
  | "weight-gain"
  | "maintenance"
  | "sports-nutrition"
  | "high-protein";

export type RecipeDiet =
  | "keto"
  | "low-carb"
  | "high-protein"
  | "mediterranean"
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "dash"
  | "gluten-free"
  | "dairy-free";

export type RecipeMealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "healthy-dessert"
  | "drink"
  | "pre-workout"
  | "post-workout";

export type RecipeBudgetTier = "low" | "medium" | "high";

export type RecipeLanguage = "ar" | "en";

/* ───────────────────────── Bilingual labels ───────────────────────── */

export const CUISINE_LABELS: Record<RecipeCuisine, { ar: string; en: string }> = {
  egyptian: { ar: "مصري", en: "Egyptian" },
  gulf: { ar: "خليجي", en: "Gulf" },
  arab: { ar: "عربي", en: "Arab" },
  mediterranean: { ar: "متوسطي", en: "Mediterranean" },
  asian: { ar: "آسيوي", en: "Asian" },
  international: { ar: "عالمي", en: "International" },
};

export const GOAL_LABELS: Record<RecipeGoal, { ar: string; en: string }> = {
  "weight-loss": { ar: "خسارة الوزن", en: "Weight Loss" },
  "muscle-gain": { ar: "بناء العضلات", en: "Muscle Gain" },
  "weight-gain": { ar: "زيادة الوزن", en: "Weight Gain" },
  maintenance: { ar: "المحافظة على الوزن", en: "Maintenance" },
  "sports-nutrition": { ar: "تغذية رياضية", en: "Sports Nutrition" },
  "high-protein": { ar: "عالي البروتين", en: "High Protein" },
};

export const DIET_LABELS: Record<RecipeDiet, { ar: string; en: string }> = {
  keto: { ar: "كيتو", en: "Keto" },
  "low-carb": { ar: "قليل الكربوهيدرات", en: "Low Carb" },
  "high-protein": { ar: "عالي البروتين", en: "High Protein" },
  mediterranean: { ar: "متوسطي", en: "Mediterranean" },
  vegetarian: { ar: "نباتي (بيض وألبان)", en: "Vegetarian" },
  vegan: { ar: "نباتي صرف", en: "Vegan" },
  pescatarian: { ar: "نباتي بأسماك", en: "Pescatarian" },
  dash: { ar: "داش (قليل الصوديوم)", en: "DASH" },
  "gluten-free": { ar: "خالٍ من الجلوتين", en: "Gluten Free" },
  "dairy-free": { ar: "خالٍ من الألبان", en: "Dairy Free" },
};

export const MEAL_TYPE_LABELS: Record<RecipeMealType, { ar: string; en: string }> = {
  breakfast: { ar: "إفطار", en: "Breakfast" },
  lunch: { ar: "غداء", en: "Lunch" },
  dinner: { ar: "عشاء", en: "Dinner" },
  snack: { ar: "وجبة خفيفة", en: "Snack" },
  "healthy-dessert": { ar: "حلويات صحية", en: "Healthy Dessert" },
  drink: { ar: "مشروبات", en: "Drink" },
  "pre-workout": { ar: "قبل التمرين", en: "Pre-Workout" },
  "post-workout": { ar: "بعد التمرين", en: "Post-Workout" },
};

export const BUDGET_LABELS: Record<RecipeBudgetTier, { ar: string; en: string }> = {
  low: { ar: "اقتصادي", en: "Budget" },
  medium: { ar: "متوسط", en: "Medium" },
  high: { ar: "مميز", en: "Premium" },
};

/* ───────────────────────── Closed-set guards ───────────────────────── */

export const RECIPE_CUISINES = Object.keys(CUISINE_LABELS) as RecipeCuisine[];
export const RECIPE_GOALS = Object.keys(GOAL_LABELS) as RecipeGoal[];
export const RECIPE_DIETS = Object.keys(DIET_LABELS) as RecipeDiet[];
export const RECIPE_MEAL_TYPES = Object.keys(MEAL_TYPE_LABELS) as RecipeMealType[];

export function isRecipeCuisine(v: string): v is RecipeCuisine {
  return Object.prototype.hasOwnProperty.call(CUISINE_LABELS, v);
}
export function isRecipeGoal(v: string): v is RecipeGoal {
  return Object.prototype.hasOwnProperty.call(GOAL_LABELS, v);
}
export function isRecipeDiet(v: string): v is RecipeDiet {
  return Object.prototype.hasOwnProperty.call(DIET_LABELS, v);
}
export function isRecipeMealType(v: string): v is RecipeMealType {
  return Object.prototype.hasOwnProperty.call(MEAL_TYPE_LABELS, v);
}

/* ───────────────────────── Filter shape (URL-state, foods pattern) ───────────────────────── */

export type RecipeFilters = {
  cuisine?: RecipeCuisine;
  diet?: RecipeDiet;
  goal?: RecipeGoal;
  meal?: RecipeMealType;
  /** max total time (prep+cook) in minutes */
  maxTime?: number;
  /** max calories per serving */
  maxCalories?: number;
  /** min protein per serving (g) */
  minProtein?: number;
  budget?: RecipeBudgetTier;
  page: number;
};

export const RECIPES_FILTER_LIMITS = {
  page: 1,
  pageSize: 12,
  maxTimeChoices: [15, 30, 45, 60, 90] as const,
  maxCaloriesChoices: [300, 400, 500, 600, 800] as const,
  minProteinChoices: [15, 20, 25, 30, 40] as const,
  maxKeywordLen: 60,
} as const;

/* ───────────────────────── Serializable view models ───────────────────────── */

/** A recipe card's serializable projection (listing pages, home samples). */
export type RecipeSummary = {
  id: string;
  pairSlug: string;
  language: RecipeLanguage;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt: string | null;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  cuisines: RecipeCuisine[];
  diets: RecipeDiet[];
  mealTypes: RecipeMealType[];
  goals: RecipeGoal[];
  publishedAt: string | null;
};

/** One ingredient row as passed to the servings-scaler client island. */
export type RecipeIngredientView = {
  position: number;
  amountG: number;
  weightState: "raw" | "cooked";
  nameAr: string;
  nameEn: string;
  noteAr: string | null;
  noteEn: string | null;
  isOptional: boolean;
  /** per-100g reference values (client-safe: plain numbers, no sources) */
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
};

/** The full detail page's serializable projection. */
export type RecipeDetail = RecipeSummary & {
  servingWeightG: number;
  fiberPerServing: number;
  satFatPerServing: number | null;
  sodiumPerServing: number | null;
  steps: Array<{ position: number; text: string }>;
  tips: string | null;
  storageInfo: string | null;
  substitutions: Array<{ from: string; to: string; note: string }>;
  faq: Array<{ question: string; answer: string }> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ingredients: RecipeIngredientView[];
  twinSlug: string;
  publishedAt: string | null;
  /** honest methodology disclosure (ق3) */
  verificationStatus: string;
  nutritionSourceLabel: string;
};

/* ───────────────────────── Small pure helpers ───────────────────────── */

export function recipeTotalMinutes(prep: number, cook: number): number {
  return prep + cook;
}

/**
 * The recipe hreflang pair — ALWAYS complete by construction (one slug,
 * both mirrors published by the atomic RPC). The single source for both
 * /recipes/[slug] and /ar/recipes/[slug] generateMetadata (plan §10-2).
 */
export function buildRecipeHreflang(lang: RecipeLanguage, slug: string): Record<string, string> {
  void lang; // the pair is symmetric — both languages build the same triple
  const en = `https://alkemos.com/recipes/${slug}`;
  const ar = `https://alkemos.com/ar/recipes/${slug}`;
  return {
    en,
    ar,
    "x-default": en,
  };
}

export function recipePublicPath(lang: RecipeLanguage, slug: string): string {
  return lang === "ar" ? `/ar/recipes/${slug}` : `/recipes/${slug}`;
}

export function recipesListingPath(lang: RecipeLanguage): string {
  return lang === "ar" ? "/ar/recipes" : "/recipes";
}

export function recipesTaxonomyPath(
  lang: RecipeLanguage,
  kind: "cuisine" | "diet" | "goal" | "meal",
  slug: string,
): string {
  const base = lang === "ar" ? "/ar/recipes" : "/recipes";
  return `${base}/${kind}/${slug}`;
}

/**
 * One ingredient line in the requested language — the Recipe Schema's
 * `recipeIngredient` and the printable list both render from this
 * (owner §7: weight in grams + declared weight state, ALWAYS visible).
 */
export function recipeIngredientLine(
  ing: RecipeIngredientView,
  lang: RecipeLanguage,
): string {
  const name = lang === "ar" ? ing.nameAr : ing.nameEn;
  const note = lang === "ar" ? ing.noteAr : ing.noteEn;
  const grams =
    lang === "ar"
      ? `${ing.amountG.toLocaleString("ar-EG")} جم`
      : `${ing.amountG} g`;
  const state =
    ing.weightState === "raw"
      ? lang === "ar"
        ? "نيئ"
        : "raw"
      : lang === "ar"
        ? "مطبوخ"
        : "cooked";
  const optional = ing.isOptional
    ? lang === "ar"
      ? " (اختياري)"
      : " (optional)"
    : "";
  const noteSuffix = note ? ` — ${note}` : "";
  return lang === "ar"
    ? `${name}: ${grams} (${state})${optional}${noteSuffix}`
    : `${name}: ${grams} (${state})${optional}${noteSuffix}`;
}
