import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  generateRecipeStructure,
  groundStructure,
  loadNutrientCatalog,
  pairSlugify,
  type RecipeIdea,
  type RecipeStructure,
} from "@/lib/recipes-pipeline";
import {
  getRecipeQueueIdParam,
  fetchRecipeQueueItem,
  updateRecipeQueueItem,
  markRecipeQueueFailed,
} from "@/lib/recipes-queue";

export const maxDuration = 120;

/**
 * RECIPES PIPELINE · R1 — the structure (plan §6.2).
 *
 * `dispatchAI("recipe:structure")` proposes the skeleton: servings,
 * times, ingredients WITH GRAMS + weight states (each referencing a
 * nutrient_reference slug), and the two step outlines. N-GATE-1
 * grounding runs HERE: every ref slug must resolve — ≤2 targeted
 * repair cycles with the missing-refs feedback, then an honest hold.
 * On success the `recipes` master (in_production) + the shared
 * `recipe_ingredients` rows are created. AI proposes; the numbers are
 * computed by R2 (never stored from the model).
 *
 * GET /api/cron/recipes/r1-structure?queueId=<uuid>
 */
const MAX_STRUCTURE_REPAIRS = 2;

function readIdea(qi: { idea: Record<string, unknown> }): RecipeIdea {
  const idea = qi.idea as unknown as Partial<RecipeIdea>;
  if (!idea?.themeAr || !idea?.themeEn || !idea?.cuisine || !idea?.mealType) {
    throw new Error("idea artifact missing/incomplete on queue item — rerun r0-idea");
  }
  return {
    ideaId: String(idea.ideaId ?? ""),
    themeAr: idea.themeAr,
    themeEn: idea.themeEn,
    cuisine: idea.cuisine,
    goal: idea.goal ?? "maintenance",
    mealType: idea.mealType,
    brief: String(idea.brief ?? ""),
    sealedAt: String(idea.sealedAt ?? ""),
  };
}

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

    // Idempotent fast-exit: a row that already structured keeps its work.
    if (["structured", "nutrition_verified", "authored", "imaged", "gates_passed", "published"].includes(qi.status)) {
      return NextResponse.json({ ok: true, step: "r1", queueId: qi.id, idempotent: true });
    }
    if (qi.status !== "idea" && qi.status !== "held") {
      return NextResponse.json(
        { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
        { status: 409 },
      );
    }

    const idea = readIdea(qi);
    const catalog = await loadNutrientCatalog();
    if (catalog.length === 0) {
      throw new Error("nutrient_reference catalog is empty — the seed migration 0108 must run first");
    }
    const catalogSet = new Set(catalog.map((c) => c.slug));

    // Structure with the inline N-GATE-1 repair ladder.
    const bundle = qi.bundle ?? {};
    const priorFeedback = typeof qi.error_message === "string" && qi.error_message.includes("missing nutrient refs")
      ? qi.error_message
      : undefined;

    let structure: RecipeStructure | null = null;
    let source = "";
    let missing: string[] = [];
    let lastError = "";

    for (let attempt = 0; attempt <= MAX_STRUCTURE_REPAIRS; attempt++) {
      const feedback =
        attempt === 0 && priorFeedback
          ? priorFeedback
          : attempt > 0 && missing.length > 0
            ? `The following nutrientRefSlug values do NOT exist in the catalog: ${[...new Set(missing)].join(", ")}. Replace each with the closest REAL catalog slug (or remove the ingredient if it is optional).`
            : undefined;
      try {
        const result = await generateRecipeStructure(idea, catalog, feedback);
        missing = groundStructure(result.structure, catalogSet);
        if (missing.length === 0) {
          structure = result.structure;
          source = result.source;
          break;
        }
        lastError = `missing nutrient refs: ${[...new Set(missing)].join(", ")}`;
        console.warn(`[recipes/r1] attempt ${attempt + 1}: ${lastError}`);
      } catch (err) {
        lastError = err instanceof Error ? err.message : "structure generation failed";
        console.warn(`[recipes/r1] attempt ${attempt + 1} threw: ${lastError}`);
      }
    }

    if (!structure) {
      // Honest hold after the repair budget — rerun r1 (new structure).
      await updateRecipeQueueItem(queueId, {
        status: "held",
        error_message: `R1: ${lastError}`.slice(0, 2000),
        rerun_target: "r1-structure",
      });
      return NextResponse.json({ ok: false, queueId, held: true, rerunTarget: "r1-structure", reason: lastError });
    }

    // Create the master record (in_production) + the shared ingredients.
    const totalWeight = structure.ingredients.reduce((s, i) => s + i.amountG, 0);
    const servingWeightG = Math.max(1, Math.round(totalWeight / structure.servings));
    const pairSlug = pairSlugify(idea.themeEn);

    let recipeId: string;
    if (qi.recipe_id) {
      // Repair path: the master already exists — replace its ingredients.
      recipeId = qi.recipe_id;
      const upErr = await updateRecipeMaster(recipeId, structure, pairSlug, idea, servingWeightG);
      if (upErr) throw new Error(upErr);
      await supabaseAdmin.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
    } else {
      const { data: master, error: masterErr } = await supabaseAdmin
        .from("recipes")
        .insert({
          pair_slug: pairSlug,
          status: "in_production",
          scheduled_for: qi.scheduled_for,
          servings: structure.servings,
          serving_weight_g: servingWeightG,
          prep_minutes: structure.prepMinutes,
          cook_minutes: structure.cookMinutes,
          cuisines: [structure.cuisine],
          meal_types: [structure.mealType],
          budget_tier: structure.budgetTier,
        })
        .select("id")
        .single();
      if (masterErr || !master) throw new Error(masterErr?.message ?? "recipes insert failed");
      recipeId = (master as { id: string }).id;
    }

    const ingredientRows = structure.ingredients.map((ing) => ({
      recipe_id: recipeId,
      position: ing.position,
      amount_g: ing.amountG,
      weight_state: ing.weightState,
      name_ar: ing.nameAr,
      name_en: ing.nameEn,
      nutrient_ref_slug: ing.nutrientRefSlug,
      is_optional: ing.isOptional,
      ...(ing.noteAr ? { note_ar: ing.noteAr } : {}),
      ...(ing.noteEn ? { note_en: ing.noteEn } : {}),
    }));
    const { error: ingErr } = await supabaseAdmin.from("recipe_ingredients").insert(ingredientRows);
    if (ingErr) throw new Error(ingErr.message);

    const nextBundle = {
      ...bundle,
      structure: {
        servings: structure.servings,
        prepMinutes: structure.prepMinutes,
        cookMinutes: structure.cookMinutes,
        budgetTier: structure.budgetTier,
        cuisine: structure.cuisine,
        mealType: structure.mealType,
        ingredients: structure.ingredients,
        stepsOutlineAr: structure.stepsOutlineAr,
        stepsOutlineEn: structure.stepsOutlineEn,
      },
      structureSource: source,
    };
    const updErr = await updateRecipeQueueItem(queueId, {
      status: "structured",
      recipe_id: recipeId,
      bundle: JSON.stringify(nextBundle),
      error_message: null,
      rerun_target: null,
    });
    if (updErr) throw new Error(updErr);

    return NextResponse.json({ ok: true, step: "r1", queueId, recipeId, source, ingredients: structure.ingredients.length });
  } catch (err) {
    console.error("[recipes/r1] failed:", err);
    await markRecipeQueueFailed(queueId, `R1: ${err instanceof Error ? err.message : "unknown"}`);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

/** Repair path: refresh the master's structure fields in place. */
async function updateRecipeMaster(
  recipeId: string,
  structure: RecipeStructure,
  pairSlug: string,
  idea: RecipeIdea,
  servingWeightG: number,
): Promise<string | null> {
  const admin = supabaseAdmin;
  if (!admin) return "admin client not configured";
  const { error } = await admin
    .from("recipes")
    .update({
      pair_slug: pairSlug,
      status: "in_production",
      servings: structure.servings,
      serving_weight_g: servingWeightG,
      prep_minutes: structure.prepMinutes,
      cook_minutes: structure.cookMinutes,
      cuisines: [structure.cuisine],
      meal_types: [structure.mealType],
      budget_tier: structure.budgetTier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipeId);
  void idea;
  return error ? error.message : null;
}
