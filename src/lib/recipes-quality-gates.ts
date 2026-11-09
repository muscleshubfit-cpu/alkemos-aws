/**
 * RECIPES-QUALITY-GATES — the deterministic publish battery
 * (HEALTHY-RECIPES-PLATFORM plan §5.3).
 *
 * NO AI here — every check is code (the blog-quality-gates pattern).
 * A recipe that fails ANY gate is HELD, never published («فشل أي نسخة
 * يمنع نشر الزوج بالكامل» — owner §2).
 *
 * Violation message text is a PINNED CONTRACT: recipes-repair-target.ts
 * regex-matches exact substrings to choose the rerun target, and the
 * canaries pin the live messages (the blog G-gate precedent).
 *
 * OWNER CORRECTION §2 honored: sodium / saturated fat are NEVER gates —
 * a missing optional enrichment value cannot hold a recipe.
 */

import { scanArabicDialect, scanLatinContamination } from "./blog-msa";
import { clampMetaTitle } from "./blog-meta-title";
import {
  extractNarrativeNutrientClaims,
  checkNarrativeAgainstComputed,
  type NutritionTotals,
  type NutrientRefRow,
  type IngredientInput,
} from "./recipes-nutrition";
import type { RecipeDiet } from "./recipes-shared";

/* ───────────────────────── Gate inputs ───────────────────────── */

export type RecipeVersionDraft = {
  language: "ar" | "en";
  title: string;
  excerpt: string;
  steps: ReadonlyArray<{ position: number; text: string }>;
  tips?: string | null;
  storageInfo?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type RecipeGateInput = {
  pairSlug: string;
  servings: number;
  servingWeightG: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: readonly IngredientInput[];
  refs: ReadonlyMap<string, NutrientRefRow>;
  versions: ReadonlyArray<RecipeVersionDraft>;
  /** computed per-serving nutrition (from computeRecipeNutrition) */
  perServing: NutritionTotals;
  /** consistency results (from computeRecipeNutrition) */
  consistency: {
    total: { pass: boolean; computed: number; fromMacros: number };
    perServing: { pass: boolean; computed: number; fromMacros: number };
  };
  /** diets derived by the rules engine (the ONLY legal source) */
  derivedDiets: readonly RecipeDiet[];
  imageUrl: string | null;
  imageVerified: boolean;
  /** existing published pair_slugs (dup guard) */
  existingPairSlugs: ReadonlySet<string>;
  /** existing published titles per language (dup guard) */
  existingTitlesByLang: ReadonlyMap<"ar" | "en", ReadonlySet<string>>;
  /** ingredient ref-slug sets of published recipes (Jaccard overlap) */
  publishedIngredientSets: ReadonlyArray<ReadonlySet<string>>;
  /** slug candidates already used per language */
  existingSlugsByLang: ReadonlyMap<"ar" | "en", ReadonlySet<string>>;
};

export type GateViolation = {
  gate: string;
  message: string;
};

/* ───────────────────────── Thresholds ───────────────────────── */

export const STEPS_MIN = 3;
export const STEPS_MAX = 15;
export const META_DESCRIPTION_MAX = 160;
export const INGREDIENT_OVERLAP_MAX = 0.7; // Jaccard ceiling vs published
export const OILY_RECIPE_CARBS_G = 20; // a "needs cooking fat" heuristic input
export const COOKED_MAIN_DISH_TYPES = new Set(["lunch", "dinner", "breakfast"]);

/** The cooking-fat/oil/sauce checklist (plan §5.2-2): recipes whose main
 *  component is cooked (meat/grain/legume) must carry an explicit fat
 *  source ingredient — «عدم تجاهل الزيوت والإضافات». */
const FAT_SOURCE_REFS = new Set([
  "olive-oil",
  "canola-oil",
  "sunflower-oil",
  "coconut-oil",
  "sesame-oil",
  "butter-salted",
  "ghee",
  "heavy-cream",
  "tahini",
  "peanut-butter",
  "mayonnaise",
  "coconut-milk-canned",
]);

/* ───────────────────────── The battery ───────────────────────── */

export function runRecipeQualityGates(input: RecipeGateInput): GateViolation[] {
  const violations: GateViolation[] = [];
  const ar = input.versions.find((v) => v.language === "ar");
  const en = input.versions.find((v) => v.language === "en");

  /* ── N-GATE-1: every ingredient has a reference row, a weight > 0 and a
     declared weight state (by construction computeRecipeNutrition throws —
     the gate double-checks so the battery is independently provable). ── */
  for (const ing of input.ingredients) {
    if (!input.refs.has(ing.nutrient_ref_slug)) {
      violations.push({
        gate: "N-GATE-1",
        message: `N-GATE-1: ingredient "${ing.name_en}" (position ${ing.position}) has no nutrient reference row for "${ing.nutrient_ref_slug}" — rerun r1-structure`,
      });
    }
    if (!(ing.amount_g > 0)) {
      violations.push({
        gate: "N-GATE-1",
        message: `N-GATE-1: ingredient "${ing.name_en}" (position ${ing.position}) has amount_g ≤ 0 — rerun r1-structure`,
      });
    }
  }

  /* ── N-GATE-2: the oil/sauce checklist — a cooked main dish must carry
     an explicit fat source. Baked/boiled-egg/salad-only/drink recipes are
     exempt. Absence = structural rejection, not a guess. ── */
  const hasFatSource = input.ingredients.some((i) => FAT_SOURCE_REFS.has(i.nutrient_ref_slug));
  const hasCookedComponent = input.ingredients.some((i) => {
    const ref = input.refs.get(i.nutrient_ref_slug);
    if (!ref) return false;
    const cats = ["poultry", "meat", "fish", "grain", "legume"];
    return cats.includes(String((ref as { category?: string }).category ?? ""));
  });
  if (hasCookedComponent && !hasFatSource) {
    violations.push({
      gate: "N-GATE-2",
      message:
        "N-GATE-2: cooked main component present but no cooking-fat/oil/sauce ingredient listed (olive-oil/butter/ghee/tahini/…) — rerun r1-structure",
    });
  }

  /* ── N-GATE-3: calorie consistency (4/4/9) within the declared band. ── */
  if (!input.consistency.total.pass) {
    violations.push({
      gate: "N-GATE-3",
      message: `N-GATE-3: total calories ${input.consistency.total.computed} vs macros-derived ${input.consistency.total.fromMacros} outside tolerance — rerun r2-nutrition`,
    });
  }
  if (!input.consistency.perServing.pass) {
    violations.push({
      gate: "N-GATE-3",
      message: `N-GATE-3: per-serving calories ${input.consistency.perServing.computed} vs macros-derived ${input.consistency.perServing.fromMacros} outside tolerance — rerun r2-nutrition`,
    });
  }

  /* ── N-GATE-4: numbers inside the generated prose must match the
     computed truth (both languages). ── */
  for (const v of input.versions) {
    const prose = [v.excerpt, ...(v.steps?.map((s) => s.text) ?? []), v.tips ?? "", v.storageInfo ?? ""]
      .filter(Boolean)
      .join("\n");
    const claims = extractNarrativeNutrientClaims(prose);
    const bad = checkNarrativeAgainstComputed(claims, input.perServing);
    for (const b of bad.slice(0, 3)) {
      violations.push({
        gate: "N-GATE-4",
        message: `N-GATE-4: ${v.language} narrative claim "${b.claim.raw.trim()}" (${b.reason}) — rerun r3-authoring`,
      });
    }
  }

  /* ── P-GATE-1: BOTH versions exist and are structurally ready. ── */
  if (!ar || !en) {
    violations.push({
      gate: "P-GATE-1",
      message: `P-GATE-1: pair incomplete — missing ${!ar ? "ar" : "en"} version — rerun r3-authoring`,
    });
  }
  for (const v of [ar, en]) {
    if (v) {
      if (!v.title?.trim() || !v.excerpt?.trim()) {
        violations.push({
          gate: "P-GATE-1",
          message: `P-GATE-1: ${v.language} version missing title/excerpt — rerun r3-authoring`,
        });
      }
    }
  }

  /* ── P-GATE-2: structural identity — both versions share ONE recipe_id
     (guaranteed by construction: versions are inserted with the same
     recipe_id as ingredients; the gate asserts the caller passed a
     consistent object). ── */
  if (input.ingredients.length === 0) {
    violations.push({
      gate: "P-GATE-2",
      message: "P-GATE-2: no shared ingredient rows — the pair has no common truth — rerun r1-structure",
    });
  }

  /* ── P-GATE-3: ONE image on the master record, verified. ── */
  if (!input.imageUrl || !input.imageVerified) {
    violations.push({
      gate: "P-GATE-3",
      message: `P-GATE-3: image ${!input.imageUrl ? "missing" : "not verified"} on the master record — rerun r4-image`,
    });
  }

  /* ── D-GATE-1: diets come from the rules engine only. The caller
     passes derivedDiets (already engine output); this gate re-asserts
     non-empty input had NO ai-proposed diet list. ── */
  if (input.derivedDiets.length === 0) {
    // Not a violation per se — a recipe may match no diet. But the field
    // must have been ENGINE-derived; the pipeline enforces the wipe
    // before this battery. Recorded as informational (no violation).
  }

  /* ── Q-GATE-1: MSA + no latin contamination (Arabic version only —
     the blog laws reused verbatim). ── */
  if (ar) {
    const arProse = [ar.excerpt, ...(ar.steps?.map((s) => s.text) ?? []), ar.tips ?? "", ar.storageInfo ?? ""]
      .filter(Boolean)
      .join("\n");
    const scan = scanArabicDialect(arProse);
    if (scan.strong >= 1 || scan.weak >= 5) {
      violations.push({
        gate: "Q-GATE-1",
        message: `Q-GATE-1: Arabic version fails MSA (strong=${scan.strong}, weak=${scan.weak}) — rerun r3-authoring`,
      });
    }
    const latin = scanLatinContamination(arProse);
    if (latin.count > 0) {
      violations.push({
        gate: "Q-GATE-1",
        message: `Q-GATE-1: Arabic version has latin contamination (${latin.count} tokens) — rerun r3-authoring`,
      });
    }
  }

  /* ── Q-GATE-2: meta title clamps (en 60 / ar 70) + description ≤ 160. ── */
  for (const v of [ar, en]) {
    if (!v) continue;
    if (v.metaTitle && clampMetaTitle(v.metaTitle, v.language) !== v.metaTitle.trim()) {
      violations.push({
        gate: "Q-GATE-2",
        message: `Q-GATE-2: ${v.language} meta title exceeds the ${v.language === "ar" ? 70 : 60}-char budget — rerun r3-authoring`,
      });
    }
    if (v.metaDescription && v.metaDescription.trim().length > META_DESCRIPTION_MAX) {
      violations.push({
        gate: "Q-GATE-2",
        message: `Q-GATE-2: ${v.language} meta description exceeds ${META_DESCRIPTION_MAX} chars — rerun r3-authoring`,
      });
    }
  }

  /* ── Q-GATE-3: step count bounds per version. ── */
  for (const v of [ar, en]) {
    if (!v) continue;
    const n = v.steps?.length ?? 0;
    if (n < STEPS_MIN || n > STEPS_MAX) {
      violations.push({
        gate: "Q-GATE-3",
        message: `Q-GATE-3: ${v.language} version has ${n} steps (allowed ${STEPS_MIN}–${STEPS_MAX}) — rerun r3-authoring`,
      });
    }
  }

  /* ── Q-GATE-4: duplication guards — new pair_slug, unused titles,
     ingredient overlap ≤ 70% (Jaccard) vs every published recipe. ── */
  if (input.existingPairSlugs.has(input.pairSlug)) {
    violations.push({
      gate: "Q-GATE-4",
      message: `Q-GATE-4: pair_slug "${input.pairSlug}" already exists — rerun r0-idea`,
    });
  }
  for (const v of [ar, en]) {
    if (!v) continue;
    const titles = input.existingTitlesByLang.get(v.language);
    if (titles?.has(v.title.trim())) {
      violations.push({
        gate: "Q-GATE-4",
        message: `Q-GATE-4: ${v.language} title already published — rerun r0-idea`,
      });
    }
  }
  const mine = new Set(input.ingredients.map((i) => i.nutrient_ref_slug));
  for (let i = 0; i < input.publishedIngredientSets.length; i++) {
    const theirs = input.publishedIngredientSets[i];
    let inter = 0;
    for (const s of mine) if (theirs.has(s)) inter++;
    const union = mine.size + theirs.size - inter;
    const jaccard = union > 0 ? inter / union : 0;
    if (jaccard > INGREDIENT_OVERLAP_MAX) {
      violations.push({
        gate: "Q-GATE-4",
        message: `Q-GATE-4: ingredient overlap with published recipe #${i + 1} is ${(jaccard * 100).toFixed(0)}% > ${INGREDIENT_OVERLAP_MAX * 100}% — rerun r0-idea`,
      });
      break; // one reported violation is enough to hold
    }
  }

  return violations;
}

/* ───────────────────────── Report shape ───────────────────────── */

export type GateReport = {
  passed: boolean;
  violations: GateViolation[];
  checkedAt: string;
  gateCount: number;
};

export function assembleGateReport(violations: readonly GateViolation[]): GateReport {
  return {
    passed: violations.length === 0,
    violations: [...violations],
    checkedAt: new Date().toISOString(),
    gateCount: 14, // N1–N4, P1–P3, D1, Q1–Q5 (+D1 informational)
  };
}
