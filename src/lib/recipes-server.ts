/**
 * RECIPES-SERVER — the server-side data layer of the recipes section
 * (HEALTHY-RECIPES-PLATFORM plan §4 — the blog-server.ts pattern).
 *
 * LAWS:
 *  - Public reads go through a fresh ANON client: RLS on the new tables
 *    (migration 0108) allows the public to read PUBLISHED pairs only —
 *    the database enforces what this layer queries.
 *  - Every query is wrapped in unstable_cache with the `recipes-*` tags
 *    (recipes-list / recipes-detail / recipes-slugs — the blog-full
 *    precedent) so R6's revalidateTag flushes a fresh pair everywhere.
 *  - Null-safe by law: no Supabase env / DB error → empty result, never
 *    a thrown 500 (the feeds/pages degrade to their honest empty states).
 *  - ONE LATIN SLUG PER PAIR: both language versions share the pair slug
 *    (the foods-library law, NOT the blog's per-language slugs) — so
 *    /recipes/[slug] ↔ /ar/recipes/[slug] is a STRUCTURAL mirror and
 *    the hreflang pair is complete by construction (plan §9.2: the
 *    toggle jumps to the twin directly — stronger than the blog).
 */

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type {
  RecipeDetail,
  RecipeSummary,
  RecipeLanguage,
  RecipeCuisine,
  RecipeDiet,
  RecipeGoal,
  RecipeMealType,
  RecipeIngredientView,
} from "./recipes-shared";
import { RECIPES_FILTER_LIMITS } from "./recipes-shared";
import type { NutritionTotals } from "./recipes-nutrition";

/* ───────────────────────── raw row shapes ───────────────────────── */

type MasterRow = {
  id: string;
  pair_slug: string;
  servings: number;
  serving_weight_g: number;
  prep_minutes: number;
  cook_minutes: number;
  image_url: string | null;
  image_alt_ar: string | null;
  image_alt_en: string | null;
  nutrition_per_serving: Partial<Record<keyof NutritionTotals, number>> | null;
  nutrition_total: Partial<Record<keyof NutritionTotals, number>> | null;
  nutrition_sources: Array<{ source?: string; version?: string }> | null;
  sodium_coverage?: string;
  cuisines: string[];
  goals: string[];
  diets: string[];
  meal_types: string[];
  budget_tier: string | null;
  verification_status: string;
  published_at: string | null;
  updated_at: string;
};

type IngredientRow = {
  position: number;
  amount_g: string | number;
  weight_state: "raw" | "cooked";
  name_ar: string;
  name_en: string;
  note_ar: string | null;
  note_en: string | null;
  is_optional: boolean;
  nutrient_ref_slug: string;
  nutrient_reference: { per100g: Record<string, number> } | null;
};

type VersionRow = {
  title: string;
  slug: string;
  excerpt: string;
  steps: Array<{ position: number; text: string }> | null;
  tips: string | null;
  storage_info: string | null;
  substitutions: Array<{ from: string; to: string; note: string }> | null;
  faq_json: Array<{ question: string; answer: string }> | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  recipes: MasterRow | null;
};

type CardRow = {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string | null;
  recipes: MasterRow | null;
};

function anonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

function perServingOf(master: MasterRow | null): NutritionTotals {
  const p = master?.nutrition_per_serving ?? {};
  return {
    calories: num(p.calories),
    protein_g: num(p.protein_g),
    carbs_g: num(p.carbs_g),
    fat_g: num(p.fat_g),
    fiber_g: num(p.fiber_g),
    sat_fat_g: typeof p.sat_fat_g === "number" ? p.sat_fat_g : null,
    sodium_mg: typeof p.sodium_mg === "number" ? p.sodium_mg : null,
  };
}

function ingredientView(row: IngredientRow): RecipeIngredientView {
  const p = row.nutrient_reference?.per100g ?? {};
  return {
    position: row.position,
    amountG: num(row.amount_g),
    weightState: row.weight_state,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    noteAr: row.note_ar,
    noteEn: row.note_en,
    isOptional: row.is_optional,
    per100g: {
      calories: num(p.calories),
      protein: num(p.protein_g),
      carbs: num(p.carbs_g),
      fat: num(p.fat_g),
      fiber: num(p.fiber_g),
    },
  };
}

/** «القيم المحسوبة من: USDA FDC (الإصدار)» — the transparency line
 *  (plan §9.2): derived from the stored nutrition_sources records. */
export function nutritionSourceLabel(detail: RecipeDetail): string {
  const sources = (detail as unknown as { nutritionSources?: Array<{ source?: string; version?: string }> })
    .nutritionSources;
  if (!sources || sources.length === 0) return "USDA FDC";
  const first = sources[0];
  const parts = [first.source ?? "USDA FDC"];
  if (first.version && first.version !== "unknown") parts.push(first.version);
  return parts.join(" · ");
}

/* ───────────────────────── detail fetch ───────────────────────── */

const fetchRecipeDetailUncached = async (
  slug: string,
  lang: RecipeLanguage,
): Promise<RecipeDetail | null> => {
  const supabase = anonClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("recipe_versions")
      .select(
        `title, slug, excerpt, steps, tips, storage_info, substitutions, faq_json, meta_title, meta_description, published_at,
         recipes!inner(
           id, pair_slug, servings, serving_weight_g, prep_minutes, cook_minutes,
           image_url, image_alt_ar, image_alt_en, image_source, image_verified,
           nutrition_total, nutrition_per_serving, nutrition_sources, sodium_coverage,
           cuisines, goals, diets, meal_types, budget_tier,
           verification, verification_status, published_at, updated_at,
           recipe_ingredients(position, amount_g, weight_state, name_ar, name_en, note_ar, note_en, is_optional, nutrient_ref_slug, nutrient_reference(per100g))
         )`,
      )
      .eq("slug", slug)
      .eq("language", lang)
      .eq("is_published", true)
      .eq("recipes.status", "published")
      .maybeSingle();
    if (error || !data) return null;
    const row = data as unknown as VersionRow;
    const master = row.recipes;
    if (!master) return null;

    const per = perServingOf(master);
    const ingredients = ((master as unknown as { recipe_ingredients?: IngredientRow[] }).recipe_ingredients ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(ingredientView);
    const sources = master.nutrition_sources ?? [];

    return {
      id: master.id,
      pairSlug: master.pair_slug,
      language: lang,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      imageUrl: master.image_url,
      imageAlt: lang === "ar" ? master.image_alt_ar : master.image_alt_en,
      prepMinutes: master.prep_minutes,
      cookMinutes: master.cook_minutes,
      servings: master.servings,
      caloriesPerServing: per.calories,
      proteinPerServing: per.protein_g,
      carbsPerServing: per.carbs_g,
      fatPerServing: per.fat_g,
      cuisines: strArray(master.cuisines) as RecipeCuisine[],
      diets: strArray(master.diets) as RecipeDiet[],
      mealTypes: strArray(master.meal_types) as RecipeMealType[],
      goals: strArray(master.goals) as RecipeGoal[],
      servingWeightG: num(master.serving_weight_g),
      fiberPerServing: per.fiber_g,
      satFatPerServing: per.sat_fat_g,
      sodiumPerServing: per.sodium_mg,
      steps: Array.isArray(row.steps) ? row.steps : [],
      tips: row.tips,
      storageInfo: row.storage_info,
      substitutions: Array.isArray(row.substitutions) ? row.substitutions : [],
      faq: Array.isArray(row.faq_json) ? row.faq_json : null,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      ingredients,
      twinSlug: row.slug, // ONE slug per pair — the twin is structural
      publishedAt: row.published_at ?? master.published_at,
      verificationStatus: master.verification_status,
      nutritionSourceLabel:
        sources.length > 0
          ? [sources[0].source ?? "USDA FDC", sources[0].version && sources[0].version !== "unknown" ? sources[0].version : ""]
              .filter(Boolean)
              .join(" · ")
          : "USDA FDC",
    };
  } catch {
    return null;
  }
};

export const fetchRecipeDetail = unstable_cache(
  fetchRecipeDetailUncached,
  ["recipes-detail"],
  { revalidate: 3600, tags: ["recipes-detail"] },
);

/* ───────────────────────── listing fetch ───────────────────────── */

export type RecipeListFilters = {
  cuisine?: RecipeCuisine;
  diet?: RecipeDiet;
  goal?: RecipeGoal;
  meal?: RecipeMealType;
  budget?: "low" | "medium" | "high";
  maxTime?: number;
  maxCalories?: number;
  minProtein?: number;
};

function cardOf(row: CardRow, lang: RecipeLanguage): RecipeSummary | null {
  const master = row.recipes;
  if (!master) return null;
  const per = perServingOf(master);
  return {
    id: master.id,
    pairSlug: master.pair_slug,
    language: lang,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    imageUrl: master.image_url,
    imageAlt: lang === "ar" ? master.image_alt_ar : master.image_alt_en,
    prepMinutes: master.prep_minutes,
    cookMinutes: master.cook_minutes,
    servings: master.servings,
    caloriesPerServing: per.calories,
    proteinPerServing: per.protein_g,
    carbsPerServing: per.carbs_g,
    fatPerServing: per.fat_g,
    cuisines: strArray(master.cuisines) as RecipeCuisine[],
    diets: strArray(master.diets) as RecipeDiet[],
    mealTypes: strArray(master.meal_types) as RecipeMealType[],
    goals: strArray(master.goals) as RecipeGoal[],
    publishedAt: row.published_at ?? master.published_at ?? null,
  };
}

const listRecipeCardsUncached = async (lang: RecipeLanguage): Promise<RecipeSummary[]> => {
  const supabase = anonClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("recipe_versions")
      .select(
        `title, slug, excerpt, published_at,
         recipes!inner(
           id, pair_slug, servings, prep_minutes, cook_minutes, image_url, image_alt_ar, image_alt_en,
           nutrition_per_serving, cuisines, goals, diets, meal_types, budget_tier, updated_at
         )`,
      )
      .eq("language", lang)
      .eq("is_published", true)
      .eq("recipes.status", "published")
      .order("published_at", { ascending: false })
      .limit(500);
    if (error || !data) return [];
    return (data as unknown as CardRow[]).flatMap((row) => {
      const card = cardOf(row, lang);
      return card ? [card] : [];
    });
  } catch {
    return [];
  }
};

const listRecipeCardsCached = unstable_cache(
  listRecipeCardsUncached,
  ["recipes-list"],
  { revalidate: 3600, tags: ["recipes-list"] },
);

/** Published cards with the URL-state filters applied (in memory — the
 *  corpus is one pair/day; the listPublishedPostsByCategory precedent). */
export async function listRecipeSummaries(
  lang: RecipeLanguage,
  filters: RecipeListFilters = {},
  page = 1,
): Promise<{ items: RecipeSummary[]; total: number; page: number; pages: number }> {
  const all = await listRecipeCardsCached(lang);
  const filtered = all.filter((r) => {
    if (filters.cuisine && !r.cuisines.includes(filters.cuisine)) return false;
    if (filters.diet && !r.diets.includes(filters.diet)) return false;
    if (filters.goal && !r.goals.includes(filters.goal)) return false;
    if (filters.meal && !r.mealTypes.includes(filters.meal)) return false;
    if (filters.maxTime && r.prepMinutes + r.cookMinutes > filters.maxTime) return false;
    if (filters.maxCalories && r.caloriesPerServing > filters.maxCalories) return false;
    if (filters.minProtein && r.proteinPerServing < filters.minProtein) return false;
    return true;
  });
  const pageSize = RECIPES_FILTER_LIMITS.pageSize;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page: safePage,
    pages,
  };
}

/** The full filtered card list (taxonomy hub pages — no pagination). */
export async function listRecipeSummariesAll(
  lang: RecipeLanguage,
  filters: RecipeListFilters = {},
): Promise<RecipeSummary[]> {
  const all = await listRecipeCardsCached(lang);
  return all.filter((r) => {
    if (filters.cuisine && !r.cuisines.includes(filters.cuisine)) return false;
    if (filters.diet && !r.diets.includes(filters.diet)) return false;
    if (filters.goal && !r.goals.includes(filters.goal)) return false;
    if (filters.meal && !r.mealTypes.includes(filters.meal)) return false;
    if (filters.maxTime && r.prepMinutes + r.cookMinutes > filters.maxTime) return false;
    if (filters.maxCalories && r.caloriesPerServing > filters.maxCalories) return false;
    if (filters.minProtein && r.proteinPerServing < filters.minProtein) return false;
    return true;
  });
}

/* ───────────────────────── slugs (sitemap + gSP) ───────────────────────── */

export type RecipeSitemapEntry = { slug: string; updatedAt: string };

const listPublishedRecipeSlugsUncached = async (): Promise<RecipeSitemapEntry[]> => {
  const supabase = anonClient();
  if (!supabase) return [];
  try {
    // The EN half of every published pair carries the pair's ONE slug —
    // the AR twin is the structural mirror (/ar/recipes/<same-slug>).
    const { data, error } = await supabase
      .from("recipe_versions")
      .select("slug, recipes!inner(status, updated_at)")
      .eq("language", "en")
      .eq("is_published", true)
      .eq("recipes.status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    return (data as unknown as Array<{ slug: string; recipes: { updated_at?: string } | null }>).map((r) => ({
      slug: r.slug,
      updatedAt: r.recipes?.updated_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
};

export const listPublishedRecipeSlugs = unstable_cache(
  listPublishedRecipeSlugsUncached,
  ["recipes-slugs"],
  { revalidate: 3600, tags: ["recipes-slugs"] },
);

/* ───────────────────────── feed (RSS) ───────────────────────── */

export type RecipeFeedItem = {
  title: string;
  slug: string;
  excerpt: string;
  published_at: string | null;
};

export async function listRecipesForFeed(lang: RecipeLanguage, limit = 30): Promise<RecipeFeedItem[]> {
  const cards = await listRecipeCardsCached(lang);
  return cards.slice(0, limit).map((c) => ({
    title: c.title,
    slug: c.slug,
    excerpt: c.excerpt,
    published_at: c.publishedAt,
  }));
}

/* ───────────────────────── home samples ───────────────────────── */

/** The homepage «وصفات مختارة» slice: the latest published pairs, small
 *  serializable cards (the home-samples law — real content, zero
 *  server-only imports crossing to the client). Empty until the first
 *  publish: the section hides honestly (never fake placeholders). */
export type HomeRecipeSample = {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt: string | null;
  calories: number;
  protein: number;
  minutes: number;
  cuisineLabel: string;
  dietLabel: string;
  href: string;
};

export async function listHomeSampleRecipes(lang: RecipeLanguage, limit = 3): Promise<HomeRecipeSample[]> {
  const { CUISINE_LABELS, DIET_LABELS } = await import("./recipes-shared");
  const cards = await listRecipeCardsCached(lang);
  return cards.slice(0, limit).map((c) => ({
    slug: c.slug,
    title: c.title,
    excerpt: c.excerpt.length > 140 ? `${c.excerpt.slice(0, 140)}…` : c.excerpt,
    imageUrl: c.imageUrl,
    imageAlt: c.imageAlt ?? c.title,
    calories: c.caloriesPerServing,
    protein: c.proteinPerServing,
    minutes: c.prepMinutes + c.cookMinutes,
    cuisineLabel: c.cuisines[0] ? CUISINE_LABELS[c.cuisines[0]][lang] : "",
    dietLabel: c.diets[0] ? DIET_LABELS[c.diets[0]][lang] : "",
    href: lang === "ar" ? `/ar/recipes/${c.slug}` : `/recipes/${c.slug}`,
  }));
}

/* ───────────────────────── related recipes ───────────────────────── */

/** Related recipes for the detail page: same cuisine or shared diet,
 *  ranked by taxonomy overlap then recency (plan §9.2 internal links). */
export async function listRelatedRecipes(
  detail: RecipeDetail,
  lang: RecipeLanguage,
  limit = 3,
): Promise<RecipeSummary[]> {
  const cards = await listRecipeCardsCached(lang);
  return cards
    .filter((c) => c.id !== detail.id)
    .map((c) => {
      let score = 0;
      for (const cu of c.cuisines) if (detail.cuisines.includes(cu)) score += 2;
      for (const d of c.diets) if (detail.diets.includes(d)) score += 1;
      for (const m of c.mealTypes) if (detail.mealTypes.includes(m)) score += 1;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}

/* ───────────────────────── hreflang ───────────────────────── */
// buildRecipeHreflang lives in recipes-shared (pure, client-safe) — the
// pages import it from there; re-exported here for API continuity.
export { buildRecipeHreflang } from "./recipes-shared";

/* ───────────────────────── cache invalidation ───────────────────────── */

/** R6 publish / R6 unpublish / admin edits: flush every recipes ISR
 *  entry (the blog-cache-revalidate precedent — one call, all tags). */
export async function revalidateRecipeCaches(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  for (const tag of ["recipes-list", "recipes-detail", "recipes-slugs"]) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // outside a request scope (scripts) — the hourly TTL still applies
    }
  }
}
