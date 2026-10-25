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

/* ── REGEN-ROOTCAUSE-2 2026-10-26 — RANKED containment matching ──
 * MEASURED DEFECT (the plan-regeneration job-killer): the old
 * lookupContains returned the FIRST substring-containment candidate in
 * FOODS array order, so «شوفان مطبوخ» (cooked oats, 71 kcal/100g) hit the
 * DRY «شوفان» row at index 14 (389 kcal/100g) before the semantically
 * correct «شوفان مطبوخ بالماء» row at index 1924 — the gate's grounding
 * re-priced one breakfast item +954 kcal, the day drifted past ±25%, the
 * local fallback was rejected and the regeneration job FAILED. Same
 * class: «بيض مقلي» matched «مشروم أبيض — مقلي سريعًا» because the raw
 * substring "بيض مقلي" sits inside "ا**بيض مقلي** سريعا" (fried eggs
 * grounded as stir-fried mushrooms, −87%).
 *
 * THE FIX — three ranked tiers (first tier with a candidate wins):
 *   T1 SPECIALIZATION: rows covering EVERY query token with ≤3 extra
 *      tokens (cooked-state/variety variants of the queried food);
 *      fewest extra wins. «شوفان مطبوخ» → «شوفان مطبوخ بالماء» (71) ✓ ·
 *      «جبن موزاريلا قليلة الدسم» → «جبنة موزاريلا — قليلة الدسم» (254,
 *      via feminine-taa token equivalence) ✓ · «فاصوليا خضراء» → the
 *      plain green-bean rows, NOT «فاصوليا بينتو…» (+4 extra) ✓.
 *      The +3 cap also keeps «فريك مطبوخ» (freekeh) OFF the semantically
 *      different «فريكة قمح ناعمة…» farina rows (+5 extra → no anchor,
 *      the item's own estimate stands — the pre-fix behavior).
 *   T2 GENERALIZATION: rows whose every token sits inside the query
 *      (the row drops a qualifier) — LONGEST covered row wins. «شوفان
 *      مطبوخ» with no T1 row would anchor «شوفان»; «صدور دجاج مشوية»
 *      anchors «صدور دجاج».
 *   T3 LEGACY: raw substring containment, first match — unchanged
 *      reachability (EN plurals, glued compounds); unreachable for any
 *      query that has a T1/T1-token candidate.
 * Token equivalence: feminine taa — «جبنة» ≡ «جبن», «مطبوخة» ≡ «مطبوخ». */
const tokenize = (norm: string): string[] => norm.split(" ").filter(Boolean);
/** Feminine-taa token equivalence: «جبنه» ≡ «جبن», «مطبوخه» ≡ «مطبوخ». */
const tokenKey = (t: string): string => (t.endsWith("ه") && t.length >= 3 ? t.slice(0, -1) : t);

/* REGEN-ROOTCAUSE-2: form tokens that change FOOD DENSITY by multiples
 * (dried/dry/ground) — an EXTRA one of these (absent from the query)
 * disqualifies a T1 candidate from the fewest-extra shortcut: «لبن رايب»
 * must anchor a FLUID row (~40-62), never «لبن رايب مجفف» (387, +868%
 * measured inflation class). Fat-level/prep tokens (قليل الدسم، بالملح،
 * نيء، معلب، مجمد) do NOT change density multiples and stay unpenalized. */
const DENSITY_FORM_TOKENS = new Set(["مجفف", "جاف", "مطحون", "مركز"]);

const T1_MAX_EXTRA_TOKENS = 3;

function lookupContains(q: string): Food | null {
  const nq = normalizeFoodName(q);
  if (nq.length < 4) return null;
  buildIndexes();
  const qSet = new Set(tokenize(nq).map(tokenKey));
  if (qSet.size === 0) return null;
  let t1: { food: Food; densityExtra: boolean; extra: number } | null = null;
  let t2: { food: Food; rowLen: number } | null = null;
  for (const { ar, en, food } of normalizedRows!) {
    for (const rowNorm of [ar, en]) {
      if (rowNorm.length < 4) continue;
      const rSet = new Set(tokenize(rowNorm).map(tokenKey));
      if (rSet.size === 0) continue;
      let coversAllQuery = true;
      for (const t of qSet) {
        if (!rSet.has(t)) {
          coversAllQuery = false;
          break;
        }
      }
      if (coversAllQuery) {
        const extra = rSet.size - qSet.size;
        if (extra <= T1_MAX_EXTRA_TOKENS) {
          const densityExtra = [...rSet].some(
            (t) => DENSITY_FORM_TOKENS.has(t) && !qSet.has(t),
          );
          const better =
            !t1 ||
            (t1.densityExtra && !densityExtra) ||
            (t1.densityExtra === densityExtra && extra < t1.extra);
          if (better) t1 = { food, densityExtra, extra };
        }
        continue;
      }
      // T2: every ROW token inside the query (row drops a qualifier).
      let coveredByQuery = true;
      for (const t of rSet) {
        if (!qSet.has(t)) {
          coveredByQuery = false;
          break;
        }
      }
      if (coveredByQuery && (!t2 || rSet.size > t2.rowLen)) {
        t2 = { food, rowLen: rSet.size };
      }
    }
  }
  if (t1) return t1.food;
  if (t2) return t2.food;
  // T3 legacy — raw substring containment (first match), only when the
  // ranked tiers found nothing.
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
