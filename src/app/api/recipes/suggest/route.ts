import { NextRequest, NextResponse } from "next/server";
import { listRecipeSummariesAll } from "@/lib/recipes-server";
import type { RecipeLanguage, RecipeGoal } from "@/lib/recipes-shared";

/**
 * RECIPES SUGGEST — the light public suggestion endpoint behind the
 * tools integration (HEALTHY-RECIPES-PLATFORM plan §9.4).
 *
 *   GET /api/recipes/suggest?lang=ar&goal=weight-loss&maxcal=550&limit=3
 *
 * Public + cacheable (anon read of PUBLISHED pairs only — RLS is the
 * gate, migration 0108). Used by:
 *   - the calorie calculator's result card (recipes that fit a meal
 *     share of the daily target),
 *   - the AI meal planner's compatible-recipes strip (2-3 recipes
 *     matched to the day's macros via diets/goals filters).
 *
 * ISOLATION LAW (plan §9.4): this endpoint READS recipes only — it
 * never feeds the plan engine itself (plan-generator untouched).
 */
export const maxDuration = 20;

function clampInt(v: string | null, min: number, max: number, fallback: number): number {
  const n = parseInt(v ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const lang: RecipeLanguage = sp.get("lang") === "ar" ? "ar" : "en";
  const goalParam = sp.get("goal");
  const goal =
    goalParam === "weight-loss" ||
    goalParam === "muscle-gain" ||
    goalParam === "weight-gain" ||
    goalParam === "maintenance" ||
    goalParam === "sports-nutrition" ||
    goalParam === "high-protein"
      ? (goalParam as RecipeGoal)
      : undefined;
  const maxcal = sp.get("maxcal") ? clampInt(sp.get("maxcal"), 50, 3000, 600) : undefined;
  const minprotein = sp.get("minprotein") ? clampInt(sp.get("minprotein"), 0, 200, 0) : undefined;
  const limit = clampInt(sp.get("limit"), 1, 3, 3);

  const items = await listRecipeSummariesAll(lang, {
    goal,
    maxCalories: maxcal,
    minProtein: minprotein,
  });

  return NextResponse.json(
    {
      items: items.slice(0, limit).map((r) => ({
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt.length > 120 ? `${r.excerpt.slice(0, 117)}…` : r.excerpt,
        href: lang === "ar" ? `/ar/recipes/${r.slug}` : `/recipes/${r.slug}`,
        calories: Math.round(r.caloriesPerServing),
        protein: Math.round(r.proteinPerServing),
        minutes: r.prepMinutes + r.cookMinutes,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=1800" } },
  );
}
