import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  runRecipeQualityGates,
  assembleGateReport,
  type RecipeVersionDraft,
} from "@/lib/recipes-quality-gates";
import type { NutrientRefRow, NutritionTotals } from "@/lib/recipes-nutrition";
import type { RecipeDiet } from "@/lib/recipes-shared";
import { mapR5FailureToRerunTarget } from "@/lib/recipes-repair-target";
import {
  narrativeAdvisorySampled,
  verifyPairNarrative,
} from "@/lib/recipes-pipeline";
import {
  getRecipeQueueIdParam,
  fetchRecipeQueueItem,
  updateRecipeQueueItem,
  markRecipeQueueFailed,
} from "@/lib/recipes-queue";

export const maxDuration = 120;

/**
 * RECIPES PIPELINE · R5 — the deterministic gate battery (plan §6.2).
 *
 * The full §5.3 table with NO AI deciding anything: N1–N4 (nutrition),
 * P1–P3 (pair integrity), D1 (diets provenance), Q1–Q5 (editorial).
 * Failures return the RERUN_TARGET contract (exit 3 in the runner —
 * the blog R1 repair precedent): the wrapper re-runs the targeted
 * stage chain on the SAME row, ≤ MAX_REPAIRS cycles, then the honest
 * held/failed verdict. The report is stamped into recipes.verification
 * (the «سجل كامل لعمليات الإنتاج والتحقق» owner requirement).
 *
 * ADVISORY TAIL (plan §6.1 row 5 — recipe:verify-narrative): AFTER the
 * deterministic battery passes, a deterministic 1-in-3 sample of
 * scheduled days gets the optional cross-version consistency read. It
 * is advisory ONLY — it never decides numbers; a HIGH-severity flag
 * holds the pair with the r3-authoring rerun target exactly like every
 * other diagnostic, and any provider/parse trouble fails OPEN (the
 * deterministic verdict stands untouched).
 *
 * GET /api/cron/recipes/r5-gates?queueId=<uuid>
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
    if (["gates_passed", "published"].includes(qi.status)) {
      return NextResponse.json({ ok: true, step: "r5", queueId: qi.id, idempotent: true });
    }
    if (qi.status !== "imaged") {
      return NextResponse.json(
        { ok: false, queueId: qi.id, skipped: true, reason: "wrong_status", actual_status: qi.status },
        { status: 409 },
      );
    }
    if (!qi.recipe_id) throw new Error("queue row carries no recipe_id — rerun r1-structure");
    const recipeId = qi.recipe_id;

    // ── The pair's own truth ──
    const { data: masterData, error: masterErr } = await supabaseAdmin
      .from("recipes")
      .select("pair_slug, servings, serving_weight_g, prep_minutes, cook_minutes, image_url, image_verified, nutrition_per_serving, calories_kcal_consistency, diets")
      .eq("id", recipeId)
      .maybeSingle();
    if (masterErr || !masterData) throw new Error(masterErr?.message ?? "recipe master not found");
    const master = masterData as {
      pair_slug: string;
      servings: number;
      serving_weight_g: number;
      prep_minutes: number;
      cook_minutes: number;
      image_url: string | null;
      image_verified: boolean;
      nutrition_per_serving: Record<string, number> | null;
      calories_kcal_consistency: { total?: { pass: boolean; computed: number; fromMacros: number }; perServing?: { pass: boolean; computed: number; fromMacros: number } } | null;
      diets: string[];
    };

    const { data: verData, error: verErr } = await supabaseAdmin
      .from("recipe_versions")
      .select("language, title, excerpt, steps, tips, storage_info, meta_title, meta_description")
      .eq("recipe_id", recipeId);
    if (verErr) throw new Error(verErr.message);
    const versions = ((verData ?? []) as Array<Record<string, unknown>>).map((v) => ({
      language: String(v.language) as "ar" | "en",
      title: String(v.title ?? ""),
      excerpt: String(v.excerpt ?? ""),
      steps: Array.isArray(v.steps) ? (v.steps as Array<{ position: number; text: string }>) : [],
      tips: (v.tips as string | null) ?? null,
      storageInfo: (v.storage_info as string | null) ?? null,
      metaTitle: (v.meta_title as string | null) ?? null,
      metaDescription: (v.meta_description as string | null) ?? null,
    })) as RecipeVersionDraft[];

    const { data: ingData, error: ingErr } = await supabaseAdmin
      .from("recipe_ingredients")
      .select("position, amount_g, weight_state, name_ar, name_en, nutrient_ref_slug, is_optional, nutrient_reference(slug, per100g, fdc_id, source_name, source_version, yield_cooked_g, flags)")
      .eq("recipe_id", recipeId)
      .order("position");
    if (ingErr) throw new Error(ingErr.message);
    const refs = new Map<string, NutrientRefRow>();
    const ingredients = ((ingData ?? []) as Array<Record<string, unknown>>).map((row) => {
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

    // ── The dup-guard corpus (published pairs only) ──
    const { data: pubData } = await supabaseAdmin
      .from("recipes")
      .select("id, pair_slug, diets")
      .eq("status", "published");
    const published = (pubData ?? []) as Array<{ id: string; pair_slug: string }>;
    const existingPairSlugs = new Set(published.map((r) => r.pair_slug));

    const { data: pubVersions } = await supabaseAdmin
      .from("recipe_versions")
      .select("language, title, slug")
      .eq("is_published", true);
    const titlesByLang = new Map<"ar" | "en", Set<string>>([
      ["ar", new Set()],
      ["en", new Set()],
    ]);
    const slugsByLang = new Map<"ar" | "en", Set<string>>([
      ["ar", new Set()],
      ["en", new Set()],
    ]);
    for (const v of ((pubVersions ?? []) as Array<{ language: string; title: string; slug: string }>)) {
      const lang = v.language === "ar" ? "ar" : "en";
      titlesByLang.get(lang)?.add(v.title.trim());
      slugsByLang.get(lang)?.add(v.slug);
    }

    const publishedIngredientSets: Array<Set<string>> = [];
    if (published.length > 0) {
      const { data: pubIngs } = await supabaseAdmin
        .from("recipe_ingredients")
        .select("recipe_id, nutrient_ref_slug");
      const byRecipe = new Map<string, Set<string>>();
      for (const row of ((pubIngs ?? []) as Array<{ recipe_id: string; nutrient_ref_slug: string }>)) {
        let set = byRecipe.get(row.recipe_id);
        if (!set) {
          set = new Set();
          byRecipe.set(row.recipe_id, set);
        }
        set.add(row.nutrient_ref_slug);
      }
      for (const r of published) {
        const set = byRecipe.get(r.id);
        if (set) publishedIngredientSets.push(set);
      }
    }

    const perServing: NutritionTotals = {
      calories: Number(master.nutrition_per_serving?.calories ?? 0),
      protein_g: Number(master.nutrition_per_serving?.protein_g ?? 0),
      carbs_g: Number(master.nutrition_per_serving?.carbs_g ?? 0),
      fat_g: Number(master.nutrition_per_serving?.fat_g ?? 0),
      fiber_g: Number(master.nutrition_per_serving?.fiber_g ?? 0),
      sat_fat_g: typeof master.nutrition_per_serving?.sat_fat_g === "number" ? master.nutrition_per_serving.sat_fat_g : null,
      sodium_mg: typeof master.nutrition_per_serving?.sodium_mg === "number" ? master.nutrition_per_serving.sodium_mg : null,
    };

    const violations = runRecipeQualityGates({
      pairSlug: master.pair_slug,
      servings: master.servings,
      servingWeightG: Number(master.serving_weight_g),
      prepMinutes: master.prep_minutes,
      cookMinutes: master.cook_minutes,
      ingredients,
      refs,
      versions,
      perServing,
      consistency: {
        total: {
          pass: Boolean(master.calories_kcal_consistency?.total?.pass),
          computed: Number(master.calories_kcal_consistency?.total?.computed ?? 0),
          fromMacros: Number(master.calories_kcal_consistency?.total?.fromMacros ?? 0),
        },
        perServing: {
          pass: Boolean(master.calories_kcal_consistency?.perServing?.pass),
          computed: Number(master.calories_kcal_consistency?.perServing?.computed ?? 0),
          fromMacros: Number(master.calories_kcal_consistency?.perServing?.fromMacros ?? 0),
        },
      },
      derivedDiets: (master.diets ?? []) as RecipeDiet[],
      imageUrl: master.image_url,
      imageVerified: master.image_verified,
      existingPairSlugs,
      existingTitlesByLang: titlesByLang,
      publishedIngredientSets,
      existingSlugsByLang: slugsByLang,
    });

    const report = assembleGateReport(violations);

    // ── Advisory tail (sampled, fail-open — see header). Runs ONLY on
    //    the deterministic pass path: an advisory can hold an otherwise
    //    passing pair, but can NEVER rescue a failing one. ──
    let advisoryStamped: Record<string, unknown> | null = null;
    if (report.passed && narrativeAdvisorySampled(String(qi.scheduled_for ?? ""))) {
      const idea = (qi.idea ?? {}) as { themeAr?: string; themeEn?: string };
      const advisory = await verifyPairNarrative({
        themeAr: String(idea.themeAr ?? ""),
        themeEn: String(idea.themeEn ?? ""),
        servings: master.servings,
        prepMinutes: master.prep_minutes,
        cookMinutes: master.cook_minutes,
        ingredients: ingredients.map((i) => ({
          nameAr: i.name_ar,
          nameEn: i.name_en,
          amountG: i.amount_g,
        })),
        perServing: {
          calories: Math.round(perServing.calories),
          protein: Math.round(perServing.protein_g),
          carbs: Math.round(perServing.carbs_g),
          fat: Math.round(perServing.fat_g),
          fiber: Math.round(perServing.fiber_g),
        },
        versions: versions.map((v) => ({
          language: v.language,
          title: v.title,
          excerpt: v.excerpt,
          steps: v.steps.map((s) => s.text),
          tips: v.tips ?? "",
        })),
      });
      if (advisory) {
        advisoryStamped = { ...advisory.advisory, source: advisory.source, sampledFor: String(qi.scheduled_for) };
        const highIssues = advisory.advisory.issues.filter((i) => i.severity === "high");
        if (!advisory.advisory.consistent && highIssues.length > 0) {
          const reason = `R5: NARRATIVE-ADV: ${highIssues
            .map((i) => `[${i.language}${i.field ? `/${i.field}` : ""}] ${i.problem}`)
            .join(" · ")}`.slice(0, 2000);
          await supabaseAdmin
            .from("recipes")
            .update({
              verification: JSON.stringify({ ...report, advisoryNarrative: advisoryStamped }),
              verification_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", recipeId);
          await updateRecipeQueueItem(queueId, {
            status: "held",
            error_message: reason,
            rerun_target: "r3-authoring",
          });
          return NextResponse.json({
            ok: false,
            queueId,
            held: true,
            rerunTarget: "r3-authoring",
            advisory: advisoryStamped,
          });
        }
      }
    }

    // Stamp the report (pass OR fail — the full production record law;
    // carries the advisory tail on sampled days, null otherwise).
    await supabaseAdmin
      .from("recipes")
      .update({
        verification: JSON.stringify(
          advisoryStamped ? { ...report, advisoryNarrative: advisoryStamped } : report,
        ),
        verification_status: report.passed ? "passed" : "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recipeId);

    if (!report.passed) {
      const first = violations[0];
      const rerunTarget = mapR5FailureToRerunTarget(first?.message ?? "");
      const reason = violations.map((v) => v.message).join(" · ").slice(0, 2000);
      // The runner's repair chain owns the ≤2 cycle budget; the row
      // keeps the target so the admin dashboard can requeue later too.
      await updateRecipeQueueItem(queueId, {
        status: "held",
        error_message: `R5: ${reason}`,
        ...(rerunTarget ? { rerun_target: rerunTarget } : {}),
      });
      return NextResponse.json({
        ok: false,
        queueId,
        held: true,
        rerunTarget,
        violations: violations.map((v) => ({ gate: v.gate, message: v.message })),
      });
    }

    const qErr = await updateRecipeQueueItem(queueId, {
      status: "gates_passed",
      bundle: JSON.stringify({
        ...(qi.bundle ?? {}),
        gates: report,
        ...(advisoryStamped ? { advisoryNarrative: advisoryStamped } : {}),
      }),
      error_message: null,
      rerun_target: null,
    });
    if (qErr) throw new Error(qErr);

    return NextResponse.json({
      ok: true,
      step: "r5",
      queueId,
      gates: report.gateCount,
      violations: 0,
      advisorySampled: advisoryStamped !== null,
    });
  } catch (err) {
    console.error("[recipes/r5] failed:", err);
    await markRecipeQueueFailed(queueId, `R5: ${err instanceof Error ? err.message : "unknown"}`);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
