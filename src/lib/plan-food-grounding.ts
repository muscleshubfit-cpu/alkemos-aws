/**
 * PLAN-FOOD-GROUNDING — AI calorie estimates cross-checked against the
 * REAL food library (AI-PLAN-QUALITY 2026-10-24, owner order item 3:
 * «الاستفادة الصحيحة من قاعدة الأطعمة بدل اختلاق بيانات غير موثوقة»).
 *
 * WHAT THIS DOES: when an AI-generated meal item names a food that exists
 * in our 8,830-row library (nameAr/nameEn, normalized match) AND its
 * amount carries a parseable gram quantity, the library's per-100g row is
 * the truth anchor. If the model's calorie estimate deviates beyond
 * PLAN_AI_SANITY.groundingTolerance (35% — cooked/raw variance lives
 * below it), the caller REPLACES the item's numbers with the library's
 * per-100g × grams values. Hallucinated "600 kcal for 150g chicken
 * breast" can no longer reach a member's plan when the library says 248.
 *
 * SERVER-ONLY (imports the 3.6MB FOODS array). Pure & synchronous — the
 * validator layer (plan-ai-validation.ts) receives it as a callback so
 * its unit tests never pay the import.
 *
 * Matching is deliberately conservative: exact normalized equality on
 * nameAr or nameEn first; then containment only when the shorter side is
 * ≥4 chars. No match → null → the model's bounded estimate stands.
 */

import { FOODS, type Food } from "@/lib/foods";
import { parseGrams } from "@/lib/nutrition-totals";
import type { GroundItemFn } from "@/lib/plan-ai-validation";

/** Normalize a food name for matching: lowercase, strip Arabic
 * diacritics/tatweel/definite article, collapse whitespace. */
export function normalizeFoodName(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // harakat + tatweel
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ال(?=\S)/g, "") // definite article prefix (best-effort)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lazy indexes: built once per process (8830 rows — a few ms). */
let exactIndex: Map<string, Food> | null = null;
let normalizedRows: Array<{ ar: string; en: string; food: Food }> | null = null;

function buildIndexes(): void {
  if (exactIndex && normalizedRows) return;
  const m = new Map<string, Food>();
  const rows: Array<{ ar: string; en: string; food: Food }> = [];
  for (const f of FOODS) {
    const ar = normalizeFoodName(f.nameAr);
    const en = normalizeFoodName(f.nameEn);
    if (ar && !m.has(ar)) m.set(ar, f);
    if (en && !m.has(en)) m.set(en, f);
    rows.push({ ar, en, food: f });
  }
  exactIndex = m;
  normalizedRows = rows;
}

/** Exact (normalized) library lookup. */
function lookupExact(q: string): Food | null {
  buildIndexes();
  return exactIndex!.get(normalizeFoodName(q)) ?? null;
}

/** Containment lookup — the shorter name inside the longer one (≥4 chars). */
function lookupContains(q: string): Food | null {
  const nq = normalizeFoodName(q);
  if (nq.length < 4) return null;
  buildIndexes();
  for (const { ar, en, food } of normalizedRows!) {
    if (ar.length >= 4 && (ar.includes(nq) || nq.includes(ar))) return food;
    if (en.length >= 4 && (en.includes(nq) || nq.includes(en))) return food;
  }
  return null;
}

/** Resolve a food row for an AI item name (null when nothing matches). */
export function findFoodForAIItem(food: string): Food | null {
  if (!food || !food.trim()) return null;
  return lookupExact(food) ?? lookupContains(food);
}

/**
 * The grounding callback handed to the validators. Contract (total):
 * never throws, never returns a non-finite value; returns null whenever
 * the item cannot be anchored (no library match OR no parseable grams).
 */
export const groundItemToLibrary: GroundItemFn = ({ food, amount }) => {
  try {
    const row = findFoodForAIItem(food);
    if (!row) return null;
    const grams = parseGrams(amount);
    if (grams === null || grams <= 0 || grams > 2000) return null;
    const factor = grams / 100;
    return {
      calories: Math.round(row.per100g.calories * factor),
      protein_g: Math.round(row.per100g.protein * factor * 10) / 10,
      carbs_g: Math.round(row.per100g.carbs * factor * 10) / 10,
      fat_g: Math.round(row.per100g.fat * factor * 10) / 10,
    };
  } catch {
    return null;
  }
};
