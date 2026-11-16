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
// REC-14 (audit AI-GENERATION-PIPELINES 2026-11-15, P1 bucket 6): the
// SAME halal token law the nutrition gate enforces — one definition,
// both generation surfaces (plan-ai-validation is a PURE zero-import
// module, safe to consume here).
import { halalFoodViolation } from "./plan-ai-validation";
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
  /** REC-4 second half (audit AI-GENERATION-PIPELINES, plan §9 P2 item 7 —
   *  executed 2026-11-16): the ARABIC image alt joins the Q-GATE-1 scan.
   *  The alt is an Arabic accessibility/SEO text surface written at R4 —
   *  the original audit found it built from ENGLISH ingredient names
   *  («دجاج مشوي بـchicken breast وrice») and Q-GATE-1 never scanned it.
   *  The P1 sweep fixed the BUILD (name_ar at R4); THIS frame adds the
   *  deterministic SCAN: latin contamination or dialect inside the alt
   *  holds the pair. The alt is REBUILT at R4, so its violations carry
   *  the r4-image repair target (not r3-authoring). */
  imageAltAr: string | null;
  /** existing published pair_slugs (dup guard) */
  existingPairSlugs: ReadonlySet<string>;
  /** existing published titles per language (dup guard) */
  existingTitlesByLang: ReadonlyMap<"ar" | "en", ReadonlySet<string>>;
  /** ingredient ref-slug sets of published recipes (Jaccard overlap) */
  publishedIngredientSets: ReadonlyArray<ReadonlySet<string>>;
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

/* ── REC-3 (audit P1 bucket 6): per-category quantity ceilings (grams per
 * ingredient, per recipe). The audit's measured failure class: «ملح 2,000
 * جم» / «سناك 5 كجم» crossed every gate because N-GATE-1 only checked
 * >0. The ceilings are padded above the audit's ~minimums (spice 60 not
 * 20 — a family koshary legitimately uses ~45g of spice blends) so a
 * REAL recipe never holds while every hallucination-class quantity does.
 * Total recipe weight 100g-15kg · serving 50-1200g · 50-1500 kcal. */
export const INGREDIENT_CEILING_G_BY_CATEGORY: Record<string, number> = {
  spice: 60,
  sweetener: 300,
  oil: 300,
  sauce: 500,
  meat: 2500,
  poultry: 2500,
  fish: 2500,
  egg: 2500,
};
export const INGREDIENT_CEILING_G_DEFAULT = 3000;
export const RECIPE_TOTAL_WEIGHT_MIN_G = 100;
export const RECIPE_TOTAL_WEIGHT_MAX_G = 15_000;
export const SERVING_WEIGHT_MIN_G = 50;
export const SERVING_WEIGHT_MAX_G = 1200;
export const SERVING_KCAL_MIN = 50;
export const SERVING_KCAL_MAX = 1500;

/* ── REC-9 (audit P1 bucket 9): the normalized-title similarity ceiling —
 * the literal-exact title guard let a reworded duplicate through. */
export const TITLE_SIMILARITY_MAX = 0.85;

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

  /* ── N-GATE-3: calorie consistency (4/4/9) within the declared band.
     AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16): the R5 rerun
     target moved r2-nutrition → r1-structure. R2 is PURE computation —
     re-running it on the same ingredients/refs reproduces the identical
     inconsistency deterministically and burns the whole repair budget
     on a no-op loop (the exact class the owner banned: «منع حلقات
     إعادة المحاولة التي تعيد النتيجة نفسها دون تقدم»). The root cause
     of a consistency miss is the structure/reference COMBO, which only
     r1 can change — the same target R2's own in-stage hold already uses
     (r2-nutrition/route.ts maps its N-GATE-3 hold to r1-structure).
     Same-commit canary law: recipes-gates-hold.test.ts updated. ── */
  if (!input.consistency.total.pass) {
    violations.push({
      gate: "N-GATE-3",
      message: `N-GATE-3: total calories ${input.consistency.total.computed} vs macros-derived ${input.consistency.total.fromMacros} outside tolerance — rerun r1-structure`,
    });
  }
  if (!input.consistency.perServing.pass) {
    violations.push({
      gate: "N-GATE-3",
      message: `N-GATE-3: per-serving calories ${input.consistency.perServing.computed} vs macros-derived ${input.consistency.perServing.fromMacros} outside tolerance — rerun r1-structure`,
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

  /* ── N-GATE-5 (REC-3, audit P1): quantity sanity — category ceilings
     per ingredient, whole-recipe weight bounds, serving weight and
     per-serving calorie bounds. The schema used to allow 5,000g per
     ingredient and nothing re-checked beyond >0, so one hallucinated
     quantity propagated silently into nutrition, diets and the serving
     meter. Violations hold with the r1-structure rerun target (the
     structure stage owns the amounts). ── */
  {
    let totalWeightG = 0;
    for (const ing of input.ingredients) {
      const ref = input.refs.get(ing.nutrient_ref_slug);
      const category = String((ref as { category?: string } | undefined)?.category ?? "");
      const ceiling =
        INGREDIENT_CEILING_G_BY_CATEGORY[category] ?? INGREDIENT_CEILING_G_DEFAULT;
      if (ing.amount_g > ceiling) {
        violations.push({
          gate: "N-GATE-5",
          message: `N-GATE-5: ingredient "${ing.name_en}" (position ${ing.position}) carries ${Math.round(ing.amount_g)}g — above the ${ceiling}g ceiling for category "${category || "default"}" — rerun r1-structure`,
        });
      }
      totalWeightG += ing.amount_g;
    }
    if (totalWeightG < RECIPE_TOTAL_WEIGHT_MIN_G || totalWeightG > RECIPE_TOTAL_WEIGHT_MAX_G) {
      violations.push({
        gate: "N-GATE-5",
        message: `N-GATE-5: whole-recipe weight ${Math.round(totalWeightG)}g outside the ${RECIPE_TOTAL_WEIGHT_MIN_G}-${RECIPE_TOTAL_WEIGHT_MAX_G}g band — rerun r1-structure`,
      });
    }
    if (
      input.servingWeightG < SERVING_WEIGHT_MIN_G ||
      input.servingWeightG > SERVING_WEIGHT_MAX_G
    ) {
      violations.push({
        gate: "N-GATE-5",
        message: `N-GATE-5: serving weight ${input.servingWeightG}g outside the ${SERVING_WEIGHT_MIN_G}-${SERVING_WEIGHT_MAX_G}g band — rerun r1-structure`,
      });
    }
    if (
      input.perServing.calories < SERVING_KCAL_MIN ||
      input.perServing.calories > SERVING_KCAL_MAX
    ) {
      violations.push({
        gate: "N-GATE-5",
        message: `N-GATE-5: per-serving ${input.perServing.calories} kcal outside the ${SERVING_KCAL_MIN}-${SERVING_KCAL_MAX} band — rerun r1-structure`,
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

  /* ── D-GATE-1 (the diets-provenance law — documentary, not a runtime
     check): diets come from the rules engine ONLY. The caller passes
     derivedDiets (already engine output — evaluateDiets at R2), any
     model-proposed diet list was wiped at R1, and a recipe legitimately
     matching no diet is NOT a violation. The enforcement lives in the
     pipeline wiring (the R1 wipe + the R2 derivation), so this battery
     records no gate here. REC-16/REC-17 (audit plan §9 P2 item 8 —
     executed 2026-11-16): the former EMPTY if-block was dead code, and
     the hand-stamped gateCount counted it — both deleted in the same
     frame; GATE_IDS below is now the single source of the count. ── */

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
    // REC-4 second half (plan §9 P2 item 7): the image ALT inside the
    // same Q-GATE-1 law — an Arabic text surface the battery never
    // scanned. The r4-image repair target: the alt is REBUILT at R4.
    if (input.imageAltAr) {
      const altScan = scanArabicDialect(input.imageAltAr);
      if (altScan.strong >= 1 || altScan.weak >= 5) {
        violations.push({
          gate: "Q-GATE-1",
          message: `Q-GATE-1: Arabic image alt fails MSA (strong=${altScan.strong}, weak=${altScan.weak}) — rerun r4-image`,
        });
      }
      const altLatin = scanLatinContamination(input.imageAltAr);
      if (altLatin.count > 0) {
        violations.push({
          gate: "Q-GATE-1",
          message: `Q-GATE-1: Arabic image alt has latin contamination (${altLatin.count} tokens) — rerun r4-image`,
        });
      }
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

  /* ── REC-9 (audit P1 bucket 9): NORMALIZED TITLE SIMILARITY — the
     exact-literal title guard let reworded duplicates through («شاورما
     دجاج صحية» vs «شاورما الدجاج الصحية»). Token-set similarity ≥0.85
     vs any published title of the same language holds at r0. ── */
  for (const v of [ar, en]) {
    if (!v) continue;
    const published = input.existingTitlesByLang.get(v.language) ?? new Set<string>();
    const dupTitle = [...published].find(
      (t) => titleSimilarity(v.title, t) >= TITLE_SIMILARITY_MAX,
    );
    if (dupTitle) {
      violations.push({
        gate: "Q-GATE-4",
        message: `Q-GATE-4: ${v.language} title is ~${TITLE_SIMILARITY_MAX * 100}% similar to the published "${dupTitle.slice(0, 60)}" — rerun r0-idea`,
      });
    }
  }

  /* ── Q-GATE-5 (REC-14, audit P1 bucket 6): the HALAL PROSE SCAN — the
     ingredient rows are halal by construction (the 2026-11-12 purge), but
     the model's free NARRATIVE could suggest «رشة نبيذ» or «استبدل
     الفانيلا بالروم» inside tips/substitutions/title/meta. One scan, all
     text surfaces, BOTH languages, the SAME token law the nutrition gate
     uses. A hit holds at r3-authoring. ── */
  for (const v of input.versions) {
    const prose = [
      v.title,
      v.excerpt,
      ...(v.steps?.map((st) => st.text) ?? []),
      v.tips ?? "",
      v.storageInfo ?? "",
      v.metaTitle ?? "",
      v.metaDescription ?? "",
    ]
      .filter(Boolean)
      .join("\n");
    // The halal scanner matches a FOOD-NAME shape; on free prose we wrap
    // the text as one candidate and keep the same exceptions (turkey
    // bacon, wine vinegar) — the violation message carries the rerun law.
    const halalHit = halalFoodViolation(prose.replace(/\n/g, " "));
    if (halalHit) {
      violations.push({
        gate: "Q-GATE-5",
        message: `Q-GATE-5: ${v.language} narrative mentions a non-halal term — ${halalHit} — rerun r3-authoring`,
      });
    }
  }

  /* ── Q-GATE-6 (REC-15, audit P1 bucket 6): STEPS↔INGREDIENTS
     coherence — two directions, both deterministic:
     (a) every NON-optional ingredient must be mentioned in at least one
         step of its language (token evidence — the missing-ingredient
         direction);
     (b) a step mentioning a high-signal food-family noun (meat/dairy/
         fish/egg/cream class) that is NOT in the ingredient list is a
         GHOST ingredient (the audit's «شبح كريمة» class). Pantry staples
         (salt/water/pepper) are exempt by design — recipes mention them
         without listing. ── */
  for (const v of [ar, en]) {
    if (!v) continue;
    const stepsText = (v.steps ?? []).map((st) => st.text).join(" \n ");
    const norm = (t: string) =>
      String(t ?? "")
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
        .replace(/[إأآا]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/ال(?=\S)/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
    const stepsNorm = norm(stepsText);
    // (a) missing non-optional ingredients — token evidence: any
    // distinctive token (≥4 chars) of the ingredient name in the steps.
    const missing = input.ingredients.filter((ing) => {
      if (ing.is_optional) return false;
      const name = v.language === "ar" ? ing.name_ar : ing.name_en;
      // Arabic words are compact (ارز/دجاج/زيت are 3 letters and fully
      // meaningful) — the token floor is 3 for AR, 4 for EN.
      const tokens = norm(name)
        .split(" ")
        .filter((t) => t.length >= (v.language === "ar" ? 3 : 4));
      if (tokens.length === 0) return false;
      return !tokens.some((t) => stepsNorm.includes(t));
    });
    if (missing.length > 0) {
      violations.push({
        gate: "Q-GATE-6",
        message: `Q-GATE-6: ${v.language} steps never mention ${missing.length} non-optional ingredient(s): ${missing.slice(0, 3).map((i) => `"${v.language === "ar" ? i.name_ar : i.name_en}"`).join(", ")} — rerun r3-authoring`,
      });
    }
    // (b) ghost high-signal foods — a step names a food FAMILY the
    // ingredient list does not carry at all (matched on the family's
    // noun stems; the list's own names suppress their families).
    const GHOST_FAMILIES: Array<{ stems: string[]; label: string }> =
      v.language === "ar"
        ? [
            { stems: ["دجاج", "فراخ"], label: "دجاج" },
            { stems: ["لحم"], label: "لحم" },
            { stems: ["سمك"], label: "سمك" },
            { stems: ["جمبري", "روبيان"], label: "جمبري" },
            { stems: ["كريمه", "قشطه"], label: "كريمة" },
            { stems: ["زبادي"], label: "زبادي" },
            { stems: ["جبن", "جبنة"], label: "جبن" },
          ]
        : [
            { stems: ["chicken"], label: "chicken" },
            { stems: ["beef", "lamb", "meat"], label: "meat" },
            { stems: ["fish", "salmon", "tilapia"], label: "fish" },
            { stems: ["shrimp", "prawn"], label: "shrimp" },
            { stems: ["cream"], label: "cream" },
            { stems: ["yogurt"], label: "yogurt" },
            { stems: ["cheese"], label: "cheese" },
          ];
    const listedNorm = input.ingredients
      .map((ing) => norm(v.language === "ar" ? ing.name_ar : ing.name_en))
      .join(" | ");
    const ghosts = GHOST_FAMILIES.filter(
      (fam) =>
        fam.stems.some((stem) => stepsNorm.includes(norm(stem))) &&
        !fam.stems.some((stem) => listedNorm.includes(norm(stem))),
    );
    if (ghosts.length > 0) {
      violations.push({
        gate: "Q-GATE-6",
        message: `Q-GATE-6: ${v.language} steps mention ${ghosts.map((g) => `«${g.label}»`).join(", ")} but the ingredient list carries none of it (ghost ingredient) — rerun r3-authoring`,
      });
    }
  }

  return violations;
}

/* ── REC-9: token-set title similarity (0-1). Normalized token sets;
 * Jaccard-style with a length guard — «شاورما دجاج صحية» vs «شاورما
 * الدجاج الصحية» lands ≥0.9; genuinely different titles land <0.5. */
export function titleSimilarity(a: string, b: string): number {
  const norm = (t: string) =>
    String(t ?? "")
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ال(?=\S)/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  const ta = new Set(norm(a).split(" ").filter((t) => t.length > 1));
  const tb = new Set(norm(b).split(" ").filter((t) => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = new Set([...ta, ...tb]).size;
  return inter / union;
}

/* ───────────────────────── Report shape ───────────────────────── */

export type GateReport = {
  passed: boolean;
  violations: GateViolation[];
  checkedAt: string;
  gateCount: number;
};

/* ── REC-16 (audit AI-GENERATION-PIPELINES, plan §9 P2 item 8 — executed
 * 2026-11-16): the stamped count had drifted TWICE — the audit caught
 * "14" over a real battery of 12, and a later frame re-stamped "15"
 * while counting the empty (now deleted) D-GATE-1 block. The count now
 * derives from ONE list — the gates this battery can actually emit —
 * and the canary (ai-pipelines-p2-8-dead-code-cleanup.test.ts) re-reads
 * THIS source file and fails the push if the list and the emitted
 * `gate: "…"` literals ever diverge again. */
export const GATE_IDS = [
  "N-GATE-1",
  "N-GATE-2",
  "N-GATE-3",
  "N-GATE-4",
  "N-GATE-5",
  "P-GATE-1",
  "P-GATE-2",
  "P-GATE-3",
  "Q-GATE-1",
  "Q-GATE-2",
  "Q-GATE-3",
  "Q-GATE-4",
  "Q-GATE-5",
  "Q-GATE-6",
] as const;

export function assembleGateReport(violations: readonly GateViolation[]): GateReport {
  return {
    passed: violations.length === 0,
    violations: [...violations],
    checkedAt: new Date().toISOString(),
    gateCount: GATE_IDS.length,
  };
}
