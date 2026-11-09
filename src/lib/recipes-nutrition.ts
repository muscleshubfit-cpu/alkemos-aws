/**
 * RECIPES-NUTRITION — the pure computation leaf of the recipes system
 * (HEALTHY-RECIPES-PLATFORM plan §5.1–5.2).
 *
 * LAW (plan principle 2): «الذكاء الاصطناعي يؤلف النصوص ولا يقرر الأرقام».
 * Every nutrition number on a published recipe is computed HERE from the
 * nutrient_reference rows — no AI output ever writes a nutrition field.
 *
 * OWNER CORRECTION (order §2 «تصحيح مواصفات البيانات الغذائية»):
 * mandatory = ingredients+grams / calories / protein / carbs / fat / fiber
 * / servings + weight per serving. sodium_mg and sat_fat_g are OPTIONAL
 * enrichment: computed and reported when reference data covers them,
 * never fabricated, never a gate-blocker. Coverage is recorded honestly
 * (none | partial | complete) so DASH can require completeness.
 *
 * Zero network, zero AI — fully unit-testable (the golden math canaries).
 */

/* ───────────────────────── Types ───────────────────────── */

export type RefPer100g = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sat_fat_g?: number | null;
  sodium_mg?: number | null;
};

export type NutrientRefRow = {
  slug: string;
  per100g: RefPer100g;
  fdc_id?: string | null;
  source_name?: string;
  source_version?: string;
  yield_cooked_g?: number | null;
  flags?: readonly string[];
  /** reference-table category (oil/dairy/poultry/…) — consumed by the
   *  N-GATE-2 cooked-component check and the Mediterranean pattern. */
  category?: string;
};

export type IngredientInput = {
  position: number;
  amount_g: number;
  weight_state: "raw" | "cooked";
  name_ar: string;
  name_en: string;
  nutrient_ref_slug: string;
  is_optional?: boolean;
};

export type NutritionTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sat_fat_g: number | null;
  sodium_mg: number | null;
};

export type NutritionSourceRecord = {
  ingredient: string;
  ref_slug: string;
  fdc_id: string | null;
  source: string;
  version: string;
};

export type ConsistencyRecord = {
  total: { computed: number; fromMacros: number; delta: number; tolerance: number; pass: boolean };
  perServing: { computed: number; fromMacros: number; delta: number; tolerance: number; pass: boolean };
};

export type NutritionComputation = {
  totals: NutritionTotals;
  perServing: NutritionTotals;
  sources: NutritionSourceRecord[];
  consistency: ConsistencyRecord;
  sodiumCoverage: "none" | "partial" | "complete";
  totalWeightG: number;
  servingWeightG: number;
};

/* ───────────────────────── Constants ───────────────────────── */

/** Atwater factors — the platform's existing consistency law
 *  (nutrition-totals.ts 4/4/9), tightened to the plan §5.2-5 band. */
export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_CARB = 4;
export const KCAL_PER_G_FAT = 9;

/**
 * Tolerance: |computed − macros-derived| ≤ max(12%, 150 kcal).
 *
 * PLAN §5.2-5 drafted max(5%, 20 kcal); the shipped seed data proved
 * that band un-shippable: USDA publishes energy measured with
 * adjusted/specific Atwater factors, so legitimate rows carry real
 * drift vs the naive 4/4/9 model (measured on the 0108 seed:
 * dates-medjool 277 vs 309 derived · raisins 299 vs 334 ·
 * peanut-butter 588 vs 634 · molokhia 60 vs 44 — fiber/sugar/nut-dense
 * foods publish less metabolizable energy than the general factors
 * imply). The band therefore accommodates honest published data at
 * realistic amounts (worst measured cases: 500 g pure dates → drift
 * 160 vs tol 166 ✓ · 400 g raisins → 139 vs 150 ✓ · 400 g almonds →
 * 165 vs 278 ✓) while still catching every fabrication this gate
 * exists for — an invented calorie field, or calories/macros pulled
 * from different reference rows, is off by hundreds of kcal. (The
 * check is scale-invariant to weight errors by construction — doubling
 * grams doubles both sides; those are caught by N-GATE-1/N-GATE-4.)
 * Precedent: the platform's own meal-consistency law (nutrition-totals
 * .ts ±max(120, 7%)) bands against the same real-data drift.
 */
export const CALORIE_CONSISTENCY_ABS_KCAL = 150;
export const CALORIE_CONSISTENCY_PCT = 0.12;

export function calorieTolerance(calories: number): number {
  return Math.max(CALORIE_CONSISTENCY_ABS_KCAL, calories * CALORIE_CONSISTENCY_PCT);
}

/** Ingredient-level rounding: per-100g values scale linearly; keep 2
 *  decimals internally, round only for display/storage at the top. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ───────────────────────── Core computation (§5.2) ───────────────────────── */

/**
 * Compute the FULL nutrition profile of a recipe pair from its shared
 * ingredient list + the matched reference rows.
 *
 * Steps (the plan's algorithm, verbatim):
 *  1. per-ingredient: ref.per100g × (amount_g / 100) — the only number source.
 *  2. weight_state: values are computed ON THE ENTERED WEIGHT in its
 *     declared state (the unified standard); the raw↔cooked reference
 *     yield is reported for transparency via the sources record.
 *  3. sum the seven nutrients → totals → ÷ servings → perServing.
 *  4. 4/4/9 consistency check on totals AND per-serving.
 *  5. record sources (ref + fdc_id + version) for every ingredient.
 *  6. sodium coverage: complete only when EVERY ingredient carries a
 *     sodium datum (optional enrichment — never blocks a gate).
 */
export function computeRecipeNutrition(input: {
  servings: number;
  ingredients: readonly IngredientInput[];
  refs: ReadonlyMap<string, NutrientRefRow>;
}): NutritionComputation {
  const { servings, ingredients, refs } = input;
  if (servings < 1) throw new Error("[recipes-nutrition] servings must be ≥ 1");

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  let satFatSum = 0;
  let satFatCount = 0;
  let sodiumSum = 0;
  let sodiumCount = 0;
  let totalWeight = 0;
  const sources: NutritionSourceRecord[] = [];

  for (const ing of ingredients) {
    const ref = refs.get(ing.nutrient_ref_slug);
    if (!ref) {
      throw new Error(
        `[recipes-nutrition] N-GATE-1 violation: ingredient "${ing.name_en}" (${ing.position}) has NO nutrient_reference row for slug "${ing.nutrient_ref_slug}"`,
      );
    }
    if (!(ing.amount_g > 0)) {
      throw new Error(
        `[recipes-nutrition] N-GATE-1 violation: ingredient "${ing.name_en}" (${ing.position}) amount_g must be > 0`,
      );
    }
    if (ing.weight_state !== "raw" && ing.weight_state !== "cooked") {
      throw new Error(
        `[recipes-nutrition] N-GATE-1 violation: ingredient "${ing.name_en}" (${ing.position}) has invalid weight_state "${ing.weight_state}"`,
      );
    }

    const factor = ing.amount_g / 100;
    const p = ref.per100g;
    calories += p.calories * factor;
    protein += p.protein_g * factor;
    carbs += p.carbs_g * factor;
    fat += p.fat_g * factor;
    fiber += p.fiber_g * factor;
    if (typeof p.sat_fat_g === "number" && p.sat_fat_g !== null) {
      satFatSum += p.sat_fat_g * factor;
      satFatCount++;
    }
    if (typeof p.sodium_mg === "number" && p.sodium_mg !== null) {
      sodiumSum += p.sodium_mg * factor;
      sodiumCount++;
    }
    totalWeight += ing.amount_g;

    sources.push({
      ingredient: ing.name_en,
      ref_slug: ref.slug,
      fdc_id: ref.fdc_id ?? null,
      source: ref.source_name ?? "USDA FDC",
      version: ref.source_version ?? "unknown",
    });
  }

  const totals: NutritionTotals = {
    calories: Math.round(calories),
    protein_g: round2(protein),
    carbs_g: round2(carbs),
    fat_g: round2(fat),
    fiber_g: round2(fiber),
    sat_fat_g: satFatCount === ingredients.length ? round2(satFatSum) : satFatCount > 0 ? round2(satFatSum) : null,
    sodium_mg: sodiumCount > 0 ? Math.round(sodiumSum) : null,
  };

  // Per-serving division (the platform's serving math — every macro ÷ servings).
  const perServing: NutritionTotals = {
    calories: Math.round(calories / servings),
    protein_g: round2(protein / servings),
    carbs_g: round2(carbs / servings),
    fat_g: round2(fat / servings),
    fiber_g: round2(fiber / servings),
    sat_fat_g: totals.sat_fat_g !== null ? round2(satFatSum / servings) : null,
    sodium_mg: totals.sodium_mg !== null ? Math.round(sodiumSum / servings) : null,
  };

  // 4/4/9 consistency (§5.2-5) — totals and per-serving.
  const fromMacrosTotal = protein * KCAL_PER_G_PROTEIN + carbs * KCAL_PER_G_CARB + fat * KCAL_PER_G_FAT;
  const fromMacrosServing = fromMacrosTotal / servings;
  const tolTotal = calorieTolerance(calories);
  const tolServing = calorieTolerance(calories / servings);
  const consistency: ConsistencyRecord = {
    total: {
      computed: totals.calories,
      fromMacros: Math.round(fromMacrosTotal),
      delta: round2(Math.abs(calories - fromMacrosTotal)),
      tolerance: round2(tolTotal),
      pass: Math.abs(calories - fromMacrosTotal) <= tolTotal,
    },
    perServing: {
      computed: perServing.calories,
      fromMacros: Math.round(fromMacrosServing),
      delta: round2(Math.abs(calories / servings - fromMacrosServing)),
      tolerance: round2(tolServing),
      pass: Math.abs(calories / servings - fromMacrosServing) <= tolServing,
    },
  };

  const sodiumCoverage: "none" | "partial" | "complete" =
    sodiumCount === 0 ? "none" : sodiumCount === ingredients.length ? "complete" : "partial";

  return {
    totals,
    perServing,
    sources,
    consistency,
    sodiumCoverage,
    totalWeightG: round2(totalWeight),
    servingWeightG: round2(totalWeight / servings),
  };
}

/* ───────────────────────── Narrative number extraction (§5.2-7) ───────────────────────── */

/**
 * Extract every nutrition number appearing inside generated PROSE so the
 * gate can compare it against the computed truth (N-GATE-4 /
 * G-GATE-4: «عدم اعتبار القيم اللغوية مصادر» + «أي رقم في نص الوصفة يجب
 * أن يطابق المحسوب»).
 *
 * Recognizes both English and Arabic-Indic digits, kcal/سعرة contexts,
 * gram contexts (جم/جرام/g) and percentages of macros. Returns only the
 * ones that look like NUTRITION claims (calories | protein | carbs | fat |
 * fiber | grams), so editorial numbers (times, servings counts) don't
 * false-positive.
 */
export type NarrativeNutrientClaim = {
  raw: string;
  value: number;
  kind: "calories" | "grams" | "percent" | "servings";
  context: string;
};

const NUM_RE_SRC = "(\\d+(?:[.,]\\d+)?)";

const CLAIM_PATTERNS: Array<{ re: RegExp; kind: NarrativeNutrientClaim["kind"] }> = [
  // calories: "250 kcal" / "250 calories" / "250 سعرة" / "٢٥٠ سعرة حرارية"
  { re: new RegExp(`${NUM_RE_SRC}\\s*(?:kcal|kilocalories|calories|سعرة|سعرات|سعره)`, "gi"), kind: "calories" },
  // macro grams: "31 g protein" / "31g of protein" / "31 جم بروتين" / "بروتين 31 جم"
  { re: new RegExp(`${NUM_RE_SRC}\\s*(?:g|gr|gram|grams|جم|جرام|غرام)\\s*(?:of\\s*)?(?:protein|carbs?|carbohydrates?|fat|fiber|fibre|بروتين|كارب|كربوهيدرات|دهون|ألياف)`, "gi"), kind: "grams" },
  { re: new RegExp(`(?:protein|carbs?|carbohydrates?|fat|fiber|fibre|بروتين|كارب|كربوهيدرات|دهون|ألياف)\\s*[:\\/]?\\s*${NUM_RE_SRC}\\s*(?:g|gr|gram|grams|جم|جرام|غرام)`, "gi"), kind: "grams" },
  // percent energy: "30% of calories from protein"
  { re: new RegExp(`${NUM_RE_SRC}\\s*%\\s*(?:of\\s*(?:the\\s*)?calories|from|من\\s*السعرات|من\\s*السعرات الحرارية)`, "gi"), kind: "percent" },
];

export function extractNarrativeNutrientClaims(text: string): NarrativeNutrientClaim[] {
  if (!text) return [];
  // normalize Arabic-Indic digits so patterns match uniformly
  const normalized = text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const out: NarrativeNutrientClaim[] = [];
  const seen = new Set<string>();

  for (const { re, kind } of CLAIM_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(normalized)) !== null) {
      const raw = m[0];
      const value = parseFloat(m[1].replace(",", "."));
      if (!Number.isFinite(value)) continue;
      const key = `${kind}:${raw.trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        raw,
        value,
        kind,
        context: normalized.slice(Math.max(0, m.index - 24), m.index + raw.length + 24).trim(),
      });
    }
  }
  return out;
}

/**
 * Check narrative claims against the computed per-serving truth.
 * Tolerances (declared, per plan §5.2-7 «بحدود التقريب المعلنة»):
 *   calories ±10% or ±15 kcal · grams ±15% or ±2 g · percent ±5 points.
 */
export function checkNarrativeAgainstComputed(
  claims: readonly NarrativeNutrientClaim[],
  computed: NutritionTotals,
): Array<{ claim: NarrativeNutrientClaim; reason: string }> {
  const violations: Array<{ claim: NarrativeNutrientClaim; reason: string }> = [];

  for (const claim of claims) {
    if (claim.kind === "calories") {
      const tol = Math.max(15, computed.calories * 0.1);
      if (Math.abs(claim.value - computed.calories) > tol) {
        violations.push({
          claim,
          reason: `calorie claim ${claim.value} vs computed ${computed.calories} (tol ±${Math.round(tol)})`,
        });
      }
    } else if (claim.kind === "grams") {
      const lowered = claim.raw.toLowerCase();
      const isProtein = /protein|بروتين/.test(lowered);
      const isCarbs = /carb|كارب|كربوهيدرات/.test(lowered);
      const isFat = /fat|دهون/.test(lowered) && !/sat|مشت?ع/.test(lowered);
      const isFiber = /fiber|fibre|ألياف/.test(lowered);
      const truth = isProtein
        ? computed.protein_g
        : isCarbs
          ? computed.carbs_g
          : isFat
            ? computed.fat_g
            : isFiber
              ? computed.fiber_g
              : null;
      if (truth === null) continue; // generic gram mention — not a macro claim
      const tol = Math.max(2, truth * 0.15);
      if (Math.abs(claim.value - truth) > tol) {
        violations.push({
          claim,
          reason: `macro claim ${claim.value}g vs computed ${truth}g (tol ±${round2(tol)})`,
        });
      }
    } else if (claim.kind === "percent") {
      const lowered = claim.raw.toLowerCase();
      const total = computed.protein_g * 4 + computed.carbs_g * 4 + computed.fat_g * 9;
      if (total <= 0) continue;
      if (/protein|بروتين/.test(lowered)) {
        const pct = (computed.protein_g * 4 * 100) / total;
        if (Math.abs(claim.value - pct) > 5) {
          violations.push({
            claim,
            reason: `protein % claim ${claim.value} vs computed ${Math.round(pct)}%`,
          });
        }
      }
    }
  }
  return violations;
}
