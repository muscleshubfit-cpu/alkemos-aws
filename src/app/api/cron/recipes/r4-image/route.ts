import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { fetchRecipeImage, type RecipeImageInput } from "@/lib/recipes-images";
import {
  getRecipeQueueIdParam,
  fetchRecipeQueueItem,
  updateRecipeQueueItem,
  markRecipeQueueFailed,
} from "@/lib/recipes-queue";
import type { RecipeIdea } from "@/lib/recipes-pipeline";

export const maxDuration = 120;

/**
 * RECIPES PIPELINE · R4 — the pair image (plan §7).
 *
 * The EXISTING market chain (Pexels → Unsplash → Pixabay + safety +
 * rotation + dedup) with the composite dish query (dish name + main
 * ingredients + family keyword) and the post-pick alt MATCH check.
 * ONE image lands on the MASTER record (recipes.image_url) — both
 * language versions read it (P-GATE-3 by construction). A full match
 * failure holds the recipe honestly after one retry.
 *
 * GET /api/cron/recipes/r4-image?queueId=<uuid>
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
    if (["imaged", "gates_passed", "published"].includes(qi.status)) {
      return NextResponse.json({ ok: true, step: "r4", queueId: qi.id, idempotent: true });
    }
    if (qi.status !== "authored") {
      return NextResponse.json(
        { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
        { status: 409 },
      );
    }
    if (!qi.recipe_id) throw new Error("queue row carries no recipe_id — rerun r1-structure");

    const idea = qi.idea as unknown as Partial<RecipeIdea>;
    const bundle = qi.bundle ?? {};

    // The main ingredients by weight (the composite query's substance).
    const { data: ingData, error: ingErr } = await supabaseAdmin
      .from("recipe_ingredients")
      .select("name_en, amount_g")
      .eq("recipe_id", qi.recipe_id)
      .order("amount_g", { ascending: false })
      .limit(4);
    if (ingErr) throw new Error(ingErr.message);
    const mains = (ingData ?? []).map((r) => String((r as { name_en: string }).name_en));

    const input: RecipeImageInput = {
      themeEn: String(idea?.themeEn ?? "healthy recipe"),
      themeAr: String(idea?.themeAr ?? "وصفة صحية"),
      mainIngredientsEn: mains,
      dishTypeEn: String((bundle as { structure?: { mealType?: string } }).structure?.mealType ?? ""),
      queueId,
    };

    let image: Awaited<ReturnType<typeof fetchRecipeImage>> = null;
    let lastNote = "no provider result";
    for (let attempt = 0; attempt < 2 && !image; attempt++) {
      image = await fetchRecipeImage(input);
      if (!image) {
        lastNote = `visual match failed on attempt ${attempt + 1}`;
        console.warn(`[recipes/r4] ${lastNote}`);
      }
    }

    if (!image) {
      await updateRecipeQueueItem(queueId, {
        status: "held",
        error_message: `R4: image stage failed — ${lastNote}`.slice(0, 2000),
        rerun_target: "r4-image",
      });
      return NextResponse.json({ ok: false, queueId, held: true, rerunTarget: "r4-image", reason: lastNote });
    }

    const { error: updErr } = await supabaseAdmin
      .from("recipes")
      .update({
        image_url: image.url,
        image_alt_ar: image.altAr,
        image_alt_en: image.altEn,
        image_source: image.source,
        image_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", qi.recipe_id);
    if (updErr) throw new Error(updErr.message);

    const nextBundle = {
      ...bundle,
      image: { url: image.url, altAr: image.altAr, altEn: image.altEn, source: image.source, matchNotes: image.matchNotes },
    };
    const qErr = await updateRecipeQueueItem(queueId, {
      status: "imaged",
      bundle: JSON.stringify(nextBundle),
      error_message: null,
      rerun_target: null,
    });
    if (qErr) throw new Error(qErr);

    return NextResponse.json({ ok: true, step: "r4", queueId, imageUrl: image.url, source: image.source, matchNotes: image.matchNotes });
  } catch (err) {
    console.error("[recipes/r4] failed:", err);
    await markRecipeQueueFailed(queueId, `R4: ${err instanceof Error ? err.message : "unknown"}`);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
