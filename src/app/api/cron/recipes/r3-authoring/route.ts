import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  authorRecipeVersion,
  uniqueRecipeSlug,
  pairSlugify,
  type AuthoredVersion,
  type RecipeIdea,
} from "@/lib/recipes-pipeline";
import {
  getRecipeQueueIdParam,
  fetchRecipeQueueItem,
  updateRecipeQueueItem,
  markRecipeQueueFailed,
} from "@/lib/recipes-queue";

export const maxDuration = 300;

/**
 * RECIPES PIPELINE · R3 — the bilingual authoring (plan §6.2).
 *
 * TWO INDEPENDENT dispatchAI calls (recipe:author-ar / recipe:author-en):
 * the AR prompt never contains EN prose and vice versa — independent
 * production, never a translation (the Phase-157 law hardened). A failed
 * half is retried ALONE (≤2 attempts); nothing partial is ever
 * published (R6's atomic RPC guarantees it structurally anyway).
 *
 * ONE LATIN SLUG PER PAIR: both versions carry the pair slug (the
 * foods-library law) so /recipes/[slug] ↔ /ar/recipes/[slug] is a
 * structural mirror and the hreflang pair is complete by construction.
 *
 * GET /api/cron/recipes/r3-authoring?queueId=<uuid>
 */
const MAX_AUTHOR_REPAIRS = 2;

type BundleShape = {
  structure?: {
    servings?: number;
    prepMinutes?: number;
    cookMinutes?: number;
    cuisine?: string;
    mealType?: string;
    ingredients?: Array<{ nameAr: string; nameEn: string; amountG: number; weightState: string }>;
    stepsOutlineAr?: string[];
    stepsOutlineEn?: string[];
  };
  nutrition?: { perServing?: Record<string, number> };
};

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
    if (["authored", "imaged", "gates_passed", "published"].includes(qi.status)) {
      return NextResponse.json({ ok: true, step: "r3", queueId: qi.id, idempotent: true });
    }
    if (qi.status !== "nutrition_verified") {
      return NextResponse.json(
        { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
        { status: 409 },
      );
    }
    if (!qi.recipe_id) throw new Error("queue row carries no recipe_id — rerun r1-structure");

    const bundle = (qi.bundle ?? {}) as BundleShape;
    const structure = bundle.structure;
    if (!structure?.ingredients?.length) throw new Error("structure artifact missing — rerun r1-structure");
    const per = bundle.nutrition?.perServing ?? {};
    const idea = qi.idea as unknown as Partial<RecipeIdea>;
    if (!idea?.themeAr || !idea?.themeEn) throw new Error("idea artifact missing — rerun r0-idea");

    const computedPerServing = {
      calories: Math.round(Number(per.calories ?? 0)),
      protein: Math.round(Number(per.protein_g ?? 0) * 10) / 10,
      carbs: Math.round(Number(per.carbs_g ?? 0) * 10) / 10,
      fat: Math.round(Number(per.fat_g ?? 0) * 10) / 10,
      fiber: Math.round(Number(per.fiber_g ?? 0) * 10) / 10,
    };

    // The pair's ONE slug — computed once, used by BOTH versions.
    const slugBase = pairSlugify(idea.themeEn);
    const pairSlug = await uniqueRecipeSlug(slugBase, "en");
    // Guard the (unlikely) case where the EN-free slug is taken in AR.
    const arCheck = await supabaseAdmin
      .from("recipe_versions")
      .select("id")
      .eq("slug", pairSlug)
      .eq("language", "ar")
      .maybeSingle();
    const finalSlug = arCheck.data ? await uniqueRecipeSlug(slugBase, "ar") : pairSlug;

    // Author each half independently — a failed half retries ALONE.
    const authorInput = {
      themeAr: idea.themeAr,
      themeEn: idea.themeEn,
      cuisine: String(structure.cuisine ?? idea.cuisine ?? "international"),
      mealType: String(structure.mealType ?? idea.mealType ?? "dinner"),
      servings: Number(structure.servings ?? 2),
      prepMinutes: Number(structure.prepMinutes ?? 15),
      cookMinutes: Number(structure.cookMinutes ?? 30),
      ingredients: structure.ingredients,
      computedPerServing,
    };

    const versions: Array<{ language: "ar" | "en"; version: AuthoredVersion; source: string }> = [];
    const failures: string[] = [];
    for (const language of ["ar", "en"] as const) {
      let done: { version: AuthoredVersion; source: string } | null = null;
      let lastErr = "";
      for (let attempt = 0; attempt <= MAX_AUTHOR_REPAIRS && !done; attempt++) {
        try {
          done = await authorRecipeVersion(language, {
            ...authorInput,
            stepsOutline: language === "ar" ? structure.stepsOutlineAr ?? [] : structure.stepsOutlineEn ?? [],
          });
        } catch (err) {
          lastErr = err instanceof Error ? err.message : "authoring failed";
          console.warn(`[recipes/r3] ${language} attempt ${attempt + 1} failed: ${lastErr}`);
        }
      }
      if (done) versions.push({ language, ...done });
      else failures.push(`${language}: ${lastErr}`);
    }

    if (versions.length < 2) {
      await updateRecipeQueueItem(queueId, {
        status: "held",
        error_message: `R3: authoring failed — ${failures.join(" | ")}`.slice(0, 2000),
        rerun_target: "r3-authoring",
      });
      return NextResponse.json({
        ok: false,
        queueId,
        held: true,
        rerunTarget: "r3-authoring",
        reason: failures.join(" | "),
      });
    }

    // Replace any prior version rows (repair path), then insert the pair.
    // THE JSONB-WIRE LAW (first-live-run lesson 2026-11-10): jsonb columns
    // take plain OBJECTS/ARRAYS — JSON.stringify'd values land as string
    // documents and read back as text (the 0-steps Q-GATE-3 hold class).
    await supabaseAdmin.from("recipe_versions").delete().eq("recipe_id", qi.recipe_id);
    const versionRows = versions.map(({ language, version }) => ({
      recipe_id: qi.recipe_id as string,
      language,
      title: version.title,
      slug: finalSlug,
      excerpt: version.excerpt,
      steps: version.steps,
      tips: version.tips || null,
      storage_info: version.storageInfo || null,
      substitutions: version.substitutions,
      meta_title: version.metaTitle,
      meta_description: version.metaDescription,
      is_published: false,
    }));
    const { error: verErr } = await supabaseAdmin.from("recipe_versions").insert(versionRows);
    if (verErr) throw new Error(verErr.message);

    const nextBundle = {
      ...(qi.bundle ?? {}),
      versions: Object.fromEntries(versions.map(({ language, version, source }) => [language, { ...version, source }])),
      pairSlug: finalSlug,
    };
    const qErr = await updateRecipeQueueItem(queueId, {
      status: "authored",
      bundle: JSON.stringify(nextBundle),
      error_message: null,
      rerun_target: null,
    });
    if (qErr) throw new Error(qErr);

    return NextResponse.json({
      ok: true,
      step: "r3",
      queueId,
      slug: finalSlug,
      sources: versions.map((v) => `${v.language}:${v.source}`),
    });
  } catch (err) {
    console.error("[recipes/r3] failed:", err);
    await markRecipeQueueFailed(queueId, `R3: ${err instanceof Error ? err.message : "unknown"}`);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
