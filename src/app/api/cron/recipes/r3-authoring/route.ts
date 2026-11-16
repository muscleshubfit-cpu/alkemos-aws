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
// REC-12 (audit P1): the fail-fast deterministic battery INSIDE the R3
// retry loop — the R5 checks that are pure (no DB, no image): meta-title
// clamp, meta-description ceiling, N-GATE-4 narrative claims, MSA/latin.
import { clampMetaTitle } from "@/lib/blog-meta-title";
import {
  extractNarrativeNutrientClaims,
  checkNarrativeAgainstComputed,
  type NutritionTotals,
} from "@/lib/recipes-nutrition";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";
// AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16): the SHARED repair
// passes (the same ones the blog P4 rides — deterministic dictionary +
// localized AI tokens + the deterministic re-validators) applied to the
// AR-authored version's TEXT FIELDS. The live scheduled run
// (2026-11-16 16:13Z) held exactly on this class: Q-GATE-1 latin
// contamination (10-14 bare tokens) detected and rejected through the
// whole ×2 repair budget with NO repair attempt — «يجب اكتشاف أي مسار
// يكتفي برصد المشكلة أو رفض المخرجات دون محاولة إصلاحها، ومعالجته
// وفق طبيعة المهمة».
import {
  repairArabicLatinContamination,
  repairArabicDialectContamination,
} from "@/lib/blog-pipeline";

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

/** REC-12 (audit P1): the R3-EARLY deterministic battery — the cheap
 *  pure checks the R5 gate runs, evaluated on the authored version
 *  BEFORE it ever reaches R4/R5. Each message names its R5 gate so the
 *  repair semantics stay identical (a violation here = a would-be hold
 *  there). */
function r3EarlyDeterministicViolations(
  version: AuthoredVersion,
  language: "ar" | "en",
  perServing: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
): string[] {
  const violations: string[] = [];
  // Q-GATE-2 parity: meta title clamp + description ceiling.
  if (version.metaTitle && clampMetaTitle(version.metaTitle, language) !== version.metaTitle.trim()) {
    violations.push(`Q-GATE-2: meta title exceeds the ${language === "ar" ? 70 : 60}-char budget`);
  }
  if (version.metaDescription && version.metaDescription.trim().length > 160) {
    violations.push("Q-GATE-2: meta description exceeds 160 chars");
  }
  // N-GATE-4 parity: narrative nutrient claims vs the computed truth.
  // AI-QUALITY-REPAIR-LOOP (2026-11-16): the steps are OBJECTS
  // ({position, text}) — the pre-fix spread stringified them as
  // "[object Object]" so the steps' text NEVER reached this battery's
  // scans (Q-GATE-1/N-GATE-4 judged excerpt/tips/storage only). The
  // R5 battery already mapped s.text — now the early twin does too
  // (REC-12's intent: the R5 semantics, fail-fast).
  const prose = [
    version.excerpt,
    ...version.steps.map((s) => s.text),
    version.tips ?? "",
    version.storageInfo ?? "",
  ]
    .filter(Boolean)
    .join("\n");
  const claims = extractNarrativeNutrientClaims(prose);
  const bad = checkNarrativeAgainstComputed(claims, perServing as unknown as NutritionTotals);
  for (const b of bad.slice(0, 2)) {
    violations.push(`N-GATE-4: narrative claim "${b.claim.raw.trim().slice(0, 60)}" (${b.reason})`);
  }
  // Q-GATE-1 parity (AR only): MSA + no latin contamination.
  if (language === "ar") {
    const scan = scanArabicDialect(prose);
    if (scan.strong >= 1 || scan.weak >= 5) {
      violations.push(`Q-GATE-1: fails MSA (strong=${scan.strong}, weak=${scan.weak})`);
    }
    const latin = scanLatinContamination(prose);
    if (latin.count > 0) {
      violations.push(`Q-GATE-1: latin contamination (${latin.count} tokens)`);
    }
  }
  return violations;
}

/**
 * AI-QUALITY-REPAIR-LOOP — repair the AR version's text fields with the
 * SHARED blog repairers (dictionary-first, scanner-mirroring, the SAME
 * deterministic re-validators). Per-field fail-closed: a field whose
 * repair cannot pass its validator returns null for the WHOLE version so
 * the caller keeps the honest directed rejection (never a half-repaired
 * version). Returns null when nothing needed repair OR any field failed
 * (the early gate re-judges the ORIGINAL in the null case — same verdict
 * as pre-2026-11-16).
 */
async function repairAuthoredVersionArabic(
  version: AuthoredVersion,
  source: string,
): Promise<{ version: AuthoredVersion; source: string } | null> {
  const repairField = async (field: string): Promise<string | null> => {
    if (!field) return field;
    let out = field;
    // dialect pass first (same order as the blog P4 route)
    try {
      const dscan = scanArabicDialect(out);
      if (dscan.strong > 0 || dscan.weak > 0) {
        out = (await repairArabicDialectContamination(out)).out;
      }
    } catch {
      return null; // honest: unrepaired field ⇒ no half-repaired version
    }
    // latin pass second
    try {
      const lscan = scanLatinContamination(out);
      if (lscan.count > 0) {
        out = await repairArabicLatinContamination(out, lscan.tokens);
      }
    } catch {
      return null;
    }
    return out;
  };

  const steps: Array<{ position: number; text: string }> = [];
  for (const step of version.steps) {
    const r = await repairField(step.text);
    if (r === null) return null;
    steps.push({ ...step, text: r });
  }
  const fields = await Promise.all(
    (
      [
        ["title", version.title],
        ["excerpt", version.excerpt],
        ["tips", version.tips ?? ""],
        ["storageInfo", version.storageInfo ?? ""],
        ["metaTitle", version.metaTitle],
        ["metaDescription", version.metaDescription],
      ] as Array<[string, string]>
    ).map(async ([, v]) => repairField(v)),
  );
  if (fields.some((f) => f === null)) return null;
  const [title, excerpt, tips, storageInfo, metaTitle, metaDescription] = fields as string[];

  return {
    version: {
      ...version,
      title,
      excerpt,
      steps,
      tips,
      storageInfo,
      metaTitle,
      metaDescription,
    },
    source: `${source}+repaired`,
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
    // AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16): the ONE-SHOT
    // repair directive the runner reset preserved from the R5 hold
    // (bundle.repair.directive — previously the reset WIPED the
    // diagnostics so the repair re-run was a blind redraw). Consumed
    // ONLY by the first authoring attempt of this run; the success-path
    // bundle write below drops the stamp (one-shot law — the B1
    // precedent from the blog p4-review loop).
    const stampedDirective =
      typeof (qi.bundle ?? {}).repair === "object" &&
      (qi.bundle ?? {}).repair !== null &&
      typeof ((qi.bundle ?? {}).repair as { directive?: unknown }).directive === "string"
        ? String(((qi.bundle ?? {}).repair as { directive?: string }).directive).slice(0, 1500)
        : undefined;

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
      // AI-QUALITY-REPAIR-LOOP: the R1-stamped directive rides ONLY the
      // first attempt of this run (one-shot law); in-loop early-gate
      // rejections feed the NEXT attempt their OWN violations — the
      // redraw is now directed instead of blind.
      let loopDirective = stampedDirective;
      for (let attempt = 0; attempt <= MAX_AUTHOR_REPAIRS && !done; attempt++) {
        try {
          done = await authorRecipeVersion(language, {
            ...authorInput,
            stepsOutline: language === "ar" ? structure.stepsOutlineAr ?? [] : structure.stepsOutlineEn ?? [],
            repairDirective: loopDirective,
          });
          // REC-12 (audit AI-GENERATION-PIPELINES 2026-11-15, P1 bucket
          // 7): the CHEAP deterministic checks used to run ONLY at R5 —
          // after the image work — so a meta-title overflow, a narrative
          // number contradiction (N-GATE-4) or an MSA violation cost a
          // full R4+R5 cycle before its deterministic rejection. They now
          // run INSIDE the retry loop: a violation rejects THIS attempt
          // (the loop redraws with fresh model draw) instead of holding
          // at R5.
          if (done) {
            const earlyViolations = r3EarlyDeterministicViolations(done.version, language, computedPerServing);
            if (earlyViolations.length > 0) {
              // AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16): when the
              // violations are EXACTLY the repairable Q-GATE-1 class (MSA
              // dialect + latin contamination — AR only), the SHARED repair
              // passes (the same ones the blog P4 rides) repair the
              // version's text fields BEFORE rejecting it: the live
              // scheduled run (2026-11-16 16:13Z) held through its whole
              // ×2 repair budget on this class with NO repair attempt.
              // The repaired version must re-pass the SAME early battery
              // (no-new-defect check) — otherwise the directed rejection
              // stands exactly as before. Non-Q-GATE-1 violations (zod
              // shape, N-GATE-4 numbers, Q-GATE-2 budgets) keep the
              // directed-rejection path (they need a redraw, not a token
              // repair).
              const repairable =
                language === "ar" && earlyViolations.every((v) => v.startsWith("Q-GATE-1"));
              if (repairable) {
                const repaired = await repairAuthoredVersionArabic(done.version, done.source);
                if (repaired && r3EarlyDeterministicViolations(repaired.version, language, computedPerServing).length === 0) {
                  console.log(
                    `[recipes/r3] AI-QUALITY-REPAIR-LOOP repaired ${language} attempt ${attempt + 1} in-place (Q-GATE-1 defects actually fixed: ${earlyViolations.join(" | ")})`,
                  );
                  done = repaired;
                } else {
                  lastErr = earlyViolations.join(" | ");
                  console.warn(`[recipes/r3] REC-12 early gate rejected ${language} attempt ${attempt + 1} (repair pass did not resolve): ${lastErr}`);
                  loopDirective = lastErr.slice(0, 1500);
                  done = null;
                  continue;
                }
              } else {
                lastErr = earlyViolations.join(" | ");
                console.warn(`[recipes/r3] REC-12 early gate rejected ${language} attempt ${attempt + 1}: ${lastErr}`);
                // AI-QUALITY-REPAIR-LOOP: the next attempt carries THESE
                // violations as its repair directive (B1-style — the model
                // learns what failed instead of re-reading the identical
                // prompt and reproducing the identical defect).
                loopDirective = lastErr.slice(0, 1500);
                done = null;
                continue;
              }
            }
          }
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
      // AI-QUALITY-REPAIR-LOOP: the one-shot directive is CONSUMED —
      // a successful re-authoring never carries a stale repair stamp
      // forward (the B1 one-shot law).
      repair: undefined,
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
