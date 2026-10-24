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
 * Recompute EVERY total a nutrition plan displays, from its items up:
 *
 *   item macros → per-meal totals (calories/protein/carbs/fat)
 *              → plan daily_calories + meals_total_calories (same sum —
 *                the «اتساق الوجبات» banner can never show a stale
 *                mismatch again)
 *              → macros in grams AND their kcal splits (protein 4,
 *                carbs 4, fat 9 kcal/g — the NOTIF→PLAN item-5 law)
 *
 * Mutates a deep copy and returns it (the editor's immutability shape).
 */
export function recomputeNutritionTotals(
  content: NutritionPlanContent,
): NutritionPlanContent {
  const next: NutritionPlanContent = JSON.parse(JSON.stringify(content));

  for (const meal of next.meals ?? []) {
    const items = meal.items ?? [];
    meal.total_calories = items.reduce((s, it) => s + (it.calories || 0), 0);
    meal.total_protein_g = items.reduce((s, it) => s + (it.protein_g || 0), 0);
    meal.total_carbs_g = items.reduce((s, it) => s + (it.carbs_g || 0), 0);
    meal.total_fat_g = items.reduce((s, it) => s + (it.fat_g || 0), 0);
  }

  const meals = next.meals ?? [];
  const sum = (pick: (m: NutritionPlanContent["meals"][number]) => number) =>
    meals.reduce((s, m) => s + pick(m), 0);

  next.daily_calories = sum((m) => m.total_calories || 0);
  next.meals_total_calories = next.daily_calories;

  if (next.macros) {
    next.macros.protein_g = sum((m) => m.total_protein_g || 0);
    next.macros.carbs_g = sum((m) => m.total_carbs_g || 0);
    next.macros.fat_g = sum((m) => m.total_fat_g || 0);
    next.macros.protein_cal = next.macros.protein_g * 4;
    next.macros.carbs_cal = next.macros.carbs_g * 4;
    next.macros.fat_cal = next.macros.fat_g * 9;
  }

  return next;
}
