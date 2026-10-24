/**
 * NUTRITION-TOTALS — the coach plan editor's pure math leaf.
 *
 * PLAN-EDIT-2026-10-24 (owner order — «اضافة صنف… اختيارات من مكتبة
 * الأطعمة عند كتابة اسم الصنف وبعد تحديد السعرات أو الجرامات يتم تغيّر
 * كل السعرات والماكروز لكامل الخطة»): one zero-dependency home for the
 * two calculations the editor needs on every item change, so the exact
 * same math is unit-testable and reusable instead of living inline in the
 * component (the old inline copies drifted from meals_total_calories and
 * left the NOTIF→PLAN «اتساق الوجبات» banner stale after edits).
 *
 * AI-PLAN-QUALITY 2026-10-24: every numeric field is COERCED through
 * numOr before any arithmetic — AI/legacy items carrying STRING numbers
 * ("230") used to poison the sums (0 + "230" = "0230" garbage that was
 * displayed AND persisted). Totals are now always finite numbers.
 *
 * BUNDLE LAW: type-only import from the server generator (erased at
 * build — the Phase-183 law: no runtime value may come from there).
 */

import type { NutritionPlanContent } from "./plan-generator";

/** Per-100g nutrition of a food-library row (local DB or Open Food Facts). */
export type Per100g = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** A food picked from the library autocomplete (bound to an item). */
export type BoundFood = {
  name: string;
  per100g: Per100g;
};

/** Coerce an item/macros field to a finite number (strings → numbers). */
function numOr(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Parse a gram quantity out of a free-text amount.
 *
 * Honest parsing — NOT a guess (the NOTIF→PLAN lesson: silent wrong
 * numbers are worse than no numbers):
 *   - "150 جرام" / "150جم" / "150 غ" / "150g" / "150 gr" → 150
 *   - "100.5 جرام" → 100.5 (decimals honored)
 *   - "80" → 80 (bare numbers ≥ 20 read as grams)
 *   - "2 بيضة" / "نصف كوب" → null (count/portion-based: no gram data,
 *     the caller must NOT recompute macros — the coach picks grams or
 *     edits calories manually)
 */
export function parseGrams(amount: string | null | undefined): number | null {
  if (!amount) return null;
  const text = String(amount).trim();
  if (!text) return null;

  const hasGramMarker =
    /(جرام|غرام|جرامات|جم|غر|غ\b|\bg\b|\bgr\b|gram|grams|g\.)/i.test(text);

  // First number in the text (Arabic-Indic digits normalized).
  const normalized = text.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const match = normalized.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;

  const value = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;

  if (hasGramMarker) return value; // "50 جم" is grams even below 20
  if (value >= 20) return value; // bare "150" / "80" read as grams
  return null; // "2 بيضة" — count-based, no gram information
}

/**
 * Scale a per-100g row to a gram quantity and round to whole numbers.
 * calories/protein/carbs/fat all scale linearly with mass.
 */
export function scalePer100g(per100g: Per100g, grams: number): {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
} {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein_g: Math.round(per100g.protein * factor),
    carbs_g: Math.round(per100g.carbs * factor),
    fat_g: Math.round(per100g.fat * factor),
  };
}

/**
 * Recompute every total a nutrition plan displays, from its items up:
 *
 *   item macros → per-meal totals (calories/protein/carbs/fat)
 *              → meals_total_calories (the ACTUAL — what the meals sum to)
 *              → macros in grams AND their kcal splits (protein 4,
 *                carbs 4, fat 9 kcal/g — the NOTIF→PLAN item-5 law)
 *
 * CALORIE-TARGET FIX 2026-10-24 (owner order item 1 «تغيير الهدف يجب أن
 * يؤدي إلى إعادة ضبط فعلية لمحتوى الخطة… دون الاكتفاء بتغيير الرقم
 * المعروض»): daily_calories is the plan's TARGET (set deterministically at
 * generation: coach override > server-computed TDEE math) — it is NOT the
 * meals' sum and must SURVIVE every item edit. The old line
 * `next.daily_calories = sum(...)` conflated target with actual: the coach
 * set a new target, then ANY item edit silently clobbered it back to the
 * meals' sum (the "الرقم المعروض" illusion). The actual now lives in
 * meals_total_calories; displays read actual-first via displayCalories().
 *
 * Mutates a deep copy and returns it (the editor's immutability shape).
 */
export function recomputeNutritionTotals(
  content: NutritionPlanContent,
): NutritionPlanContent {
  const next: NutritionPlanContent = JSON.parse(JSON.stringify(content));

  for (const meal of next.meals ?? []) {
    const items = meal.items ?? [];
    meal.total_calories = items.reduce((s, it) => s + numOr(it.calories), 0);
    meal.total_protein_g = items.reduce((s, it) => s + numOr(it.protein_g), 0);
    meal.total_carbs_g = items.reduce((s, it) => s + numOr(it.carbs_g), 0);
    meal.total_fat_g = items.reduce((s, it) => s + numOr(it.fat_g), 0);
  }

  const meals = next.meals ?? [];
  const sum = (pick: (m: NutritionPlanContent["meals"][number]) => number) =>
    meals.reduce((s, m) => s + pick(m), 0);

  // The ACTUAL meals sum — daily_calories (the TARGET) is preserved, only
  // COERCED to a finite number when a legacy plan carried it as a string
  // ("1000" — the AI-PLAN-QUALITY string-poisoning law; the VALUE never
  // changes: numOr returns 0 only for absent/garbage, so a real target
  // survives byte-identical).
  next.meals_total_calories = sum((m) => numOr(m.total_calories));
  next.daily_calories = numOr(next.daily_calories);

  if (next.macros) {
    next.macros.protein_g = sum((m) => numOr(m.total_protein_g));
    next.macros.carbs_g = sum((m) => numOr(m.total_carbs_g));
    next.macros.fat_g = sum((m) => numOr(m.total_fat_g));
    next.macros.protein_cal = next.macros.protein_g * 4;
    next.macros.carbs_cal = next.macros.carbs_g * 4;
    next.macros.fat_cal = next.macros.fat_g * 9;
  }

  return next;
}

/**
 * The calories a plan surface should DISPLAY: the ACTUAL meals sum when the
 * plan carries it (every generated plan does; it updates on every
 * edit/swap), falling back to the target for legacy plans that predate
 * meals_total_calories. Keeps member/coach cards tracking the real meals
 * (the NOTIF→PLAN post-swap law) while the target stays intact in data.
 */
export function displayCalories(content: {
  daily_calories?: number;
  meals_total_calories?: number;
} | null | undefined): number {
  const actual = numOr(content?.meals_total_calories);
  if (actual > 0) return actual;
  return numOr(content?.daily_calories);
}

/**
 * CALORIE-TARGET FIX 2026-10-24 (owner order item 1: «افحص هل المطلوب إعادة
 * حساب أم إعادة توليد، ونفّذ السلوك الصحيح»). The measured answer:
 *
 *   - A recalculation DERIVES totals FROM the meals — it can never MOVE the
 *     meals toward a new target. Recalc alone is the "number-only" illusion
 *     the owner rejected.
 *   - So a target change is judged against the platform's own consistency
 *     band (the «اتساق الوجبات» banner law: ±max(120 kcal, 7%)):
 *       · IN BAND — the meals already track the new target within the
 *         platform's quality bar → updating the target field + recomputed
 *         totals IS the honest correct behavior (no quota burned).
 *       · OUT OF BAND — the meals no longer meet the new target → the plan
 *         content must be REGENERATED (meals, quantities, totals) with the
 *         new target as the generation override, preserving the client's
 *         context and constraints.
 */
export type TargetChangeVerdict =
  | { kind: "in-band" }
  | { kind: "regenerate"; reason: string };

export const TARGET_CONSISTENCY_ABS_KCAL = 120;
export const TARGET_CONSISTENCY_PCT = 0.07;

export function resolveTargetCalorieChange(
  newTarget: number,
  mealsTotalCalories: number,
): TargetChangeVerdict {
  const target = Math.round(newTarget);
  const actual = Math.round(mealsTotalCalories);
  if (!Number.isFinite(target) || target <= 0) {
    return { kind: "regenerate", reason: "هدف غير صالح" };
  }
  const band = Math.max(TARGET_CONSISTENCY_ABS_KCAL, target * TARGET_CONSISTENCY_PCT);
  if (Math.abs(actual - target) <= band) {
    return { kind: "in-band" };
  }
  return {
    kind: "regenerate",
    reason: `مجموع الوجبات الحالية (${actual} سعرة) خارج نطاق الاتساق مع الهدف الجديد (${target} سعرة ±${Math.round(band)})`,
  };
}
