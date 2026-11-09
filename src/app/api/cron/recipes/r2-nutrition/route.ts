import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { computeRecipeNutrition, type NutrientRefRow } from "@/lib/recipes-nutrition";
import { evaluateTaxonomy } from "@/lib/recipes-diet-rules";
import {
  getRecipeQueueIdParam,
  fetchRecipeQueueItem,
  updateRecipeQueueItem,
  markRecipeQueueFailed,
} from "@/lib/recipes-queue";

export const maxDuration = 60;

/**
 * RECIPES PIPELINE · R2 — the nutrition computation (plan §6.2).
 *
 * PURE CODE — no AI, no network beyond the DB read. The §5.2 algorithm
 * verbatim: per-ingredient per100g × (amount_g/100) → sums → ÷ servings
 * → 4/4/9 consistency → diets/goals re-derived by the rules engine
 * (D-GATE-1: any model-proposed diet list was already wiped at R1).
 * A structural failure here (missing ref, inconsistent calories) HOLDS
 * the recipe and returns the pipeline to r1 — the numbers are never
 * "fixed" by a model.
 *
 * GET /api/cron/recipes/r2-nutrition?queueId=<uuid>
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const queueId = getRecipeQueueIdParam(request);
  if (!queueId) return NextResponse.json({ error: "Missing queueId query parameter" }, { status: 400 });

  try {
    const { data: qi, error: fetchErr } = await fetchRecipeQueueItem(queueId);
    if (fetchErr) throw new Error(fetchErr);
    if (!qi) {
      return NextResponse.json({ ok: false, queueId, skipped: true, reason: "queue_item_not_found" }, { status: 404 });
    }
    if (["nutrition_verified", "authored", "imaged", "gates_passed", "published"].includes(qi.status)) {
      return NextResponse.json({ ok: true, step: "r2", queueId: qi.id, idempotent: true });
    }
    if (qi.status !== "structured") {
      return NextResponse.json(
        { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
        { status: 409 },
      );
    }
    if (!qi.recipe_id) throw new Error("queue row carries no recipe_id — rerun r1-structure");

    // The shared truth: master + ingredients + their reference rows.
    const { data: masterData, error: masterErr } = await supabaseAdmin
      .from("recipes")
      .select("id, servings, cuisines, meal_types")
      .eq("id", qi.recipe_id)
      .maybeSingle();
    if (masterErr || !masterData) throw new Error(masterErr?.message ?? "recipe master not found");
    const master = masterData as { id: string; servings: number; cuisines: string[]; meal_types: string[] };

    const { data: ingData, error: ingErr } = await supabaseAdmin
      .from("recipe_ingredients")
      .select("position, amount_g, weight_state, name_ar, name_en, nutrient_ref_slug, is_optional, nutrient_reference(slug, per100g, fdc_id, source_name, source_version, yield_cooked_g, flags)")
      .eq("recipe_id", qi.recipe_id)
      .order("position");
    if (ingErr) throw new Error(ingErr.message);
    const ingredients = (ingData ?? []) as Array<Record<string, unknown>>;
    if (ingredients.length === 0) throw new Error("no ingredient rows — rerun r1-structure");

    const refs = new Map<string, NutrientRefRow>();
    const inputs = ingredients.map((row) => {
      const ref = row.nutrient_reference as NutrientRefRow | null;
      const slug = String(row.nutrient_ref_slug);
      if (ref) refs.set(slug, { ...ref, slug });
      return {
        position: Number(row.position),
        amount_g: Number(row.amount_g),
        weight_state: row.weight_state as "raw" | "cooked",
        name_ar: String(row.name_ar),
        name_en: String(row.name_en),
        nutrient_ref_slug: slug,
        is_optional: Boolean(row.is_optional),
      };
    });

    // §5.2 — the computation (throws on N-GATE-1 violations).
    const computation = computeRecipeNutrition({ servings: master.servings, ingredients: inputs, refs });

    // N-GATE-3 — calorie consistency is structural: a failure means the
    // reference data cannot describe this recipe; back to r1, never a
    // model "fix".
    if (!computation.consistency.total.pass || !computation.consistency.perServing.pass) {
      const reason = `N-GATE-3: calories ${computation.totals.calories} vs macros-derived ${Math.round(
        computation.consistency.total.fromMacros,
      )} outside tolerance`;
      await updateRecipeQueueItem(queueId, {
        status: "held",
        error_message: `R2: ${reason}`.slice(0, 2000),
        rerun_target: "r1-structure",
      });
      return NextResponse.json({ ok: false, queueId, held: true, rerunTarget: "r1-structure", reason });
    }

    // D-GATE-1 — diets from the rules engine ONLY (+ goals re-derived).
    const ingredientFlags = inputs.map((i) => [...(refs.get(i.nutrient_ref_slug)?.flags ?? [])]);
    const ingredientWeights = inputs.map((i) => i.amount_g);
    const { diets, goals } = evaluateTaxonomy({
      perServing: computation.perServing,
      sodiumCoverage: computation.sodiumCoverage,
      ingredientFlags,
      ingredientWeights,
      caloriesPerServing: computation.perServing.calories,
      proteinPerServing: computation.perServing.protein_g,
      mealTypes: master.meal_types ?? [],
    });

    const { error: updErr } = await supabaseAdmin
      .from("recipes")
      .update({
        nutrition_total: JSON.stringify(computation.totals),
        nutrition_per_serving: JSON.stringify(computation.perServing),
        nutrition_sources: JSON.stringify(computation.sources),
        calories_kcal_consistency: JSON.stringify(computation.consistency),
        sodium_coverage: computation.sodiumCoverage,
        serving_weight_g: computation.servingWeightG,
        diets,
        goals,
        updated_at: new Date().toISOString(),
      })
      .eq("id", qi.recipe_id);
    if (updErr) throw new Error(updErr.message);

    const nextBundle = {
      ...(qi.bundle ?? {}),
      nutrition: {
        totals: computation.totals,
        perServing: computation.perServing,
        consistency: computation.consistency,
        sodiumCoverage: computation.sodiumCoverage,
        derivedDiets: diets,
        derivedGoals: goals,
        totalWeightG: computation.totalWeightG,
      },
    };
    const qErr = await updateRecipeQueueItem(queueId, {
      status: "nutrition_verified",
      bundle: JSON.stringify(nextBundle),
      error_message: null,
      rerun_target: null,
    });
    if (qErr) throw new Error(qErr);

    return NextResponse.json({
      ok: true,
      step: "r2",
      queueId,
      perServing: computation.perServing,
      diets,
      goals,
      sodiumCoverage: computation.sodiumCoverage,
    });
  } catch (err) {
    console.error("[recipes/r2] failed:", err);
    await markRecipeQueueFailed(queueId, `R2: ${err instanceof Error ? err.message : "unknown"}`);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
