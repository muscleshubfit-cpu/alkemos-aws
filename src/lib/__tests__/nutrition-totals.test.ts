import { describe, it, expect } from "vitest";
import {
  parseGrams,
  scalePer100g,
  recomputeNutritionTotals,
  displayCalories,
  resolveTargetCalorieChange,
  TARGET_CONSISTENCY_ABS_KCAL,
  TARGET_CONSISTENCY_PCT,
} from "@/lib/nutrition-totals";
import type { NutritionPlanContent } from "@/lib/plan-generator";

/**
 * PLAN-EDIT-2026-10-24 (owner order — «اضافة صنف… اختيارات من مكتبة
 * الأطعمة عند كتابة اسم الصنف وبعد تحديد السعرات او الجرامات يتم تغير
 * كل السعرات والماكروز لكامل الخطة»): the canary battery for the
 * editor's pure math leaf — the grams parser (honest: count-based
 * amounts NEVER guess), the per-100g scaling, and the full item→meal→
 * plan chain (meal totals, daily_calories = meals_total_calories, and
 * the 4/4/9 kcal splits — the NOTIF→PLAN item-5 law).
 */

describe("parseGrams — gram quantities out of free-text amounts", () => {
 it("reads Arabic gram markers", () => {
  expect(parseGrams("150 جرام")).toBe(150);
  expect(parseGrams("١٥٠ جرام")).toBe(150); // Arabic-Indic digits
  expect(parseGrams("80جم")).toBe(80);
  expect(parseGrams("100.5 جرام")).toBe(100.5);
  expect(parseGrams("نصف كوب أرز (50 جم)")).toBe(50);
 });

 it("reads English/Latin gram markers", () => {
  expect(parseGrams("150g")).toBe(150);
  expect(parseGrams("150 g")).toBe(150);
  expect(parseGrams("180 gr")).toBe(180);
  expect(parseGrams("200 grams")).toBe(200);
 });

 it("bare numbers ≥ 20 read as grams", () => {
  expect(parseGrams("150")).toBe(150);
  expect(parseGrams("80")).toBe(80);
  expect(parseGrams("20")).toBe(20);
 });

 it("count-based and portion-based amounts return null — NEVER a guess", () => {
  expect(parseGrams("2 بيضة كاملة")).toBeNull(); // 2 < 20, no gram marker
  expect(parseGrams("نصف حبة أفوكادو")).toBeNull(); // no digits at all
  expect(parseGrams("طبق كبير")).toBeNull();
  expect(parseGrams("")).toBeNull();
  expect(parseGrams(null)).toBeNull();
  expect(parseGrams(undefined)).toBeNull();
 });

 it("explicit gram markers count even below 20g", () => {
  expect(parseGrams("10 جم زيت زيتون")).toBe(10);
  expect(parseGrams("15 جرام")).toBe(15);
 });

 it("rejects zero/negative/non-numeric", () => {
  expect(parseGrams("0 جرام")).toBeNull();
  expect(parseGrams("جرام")).toBeNull();
 });

 it("Arabic decimal comma parses", () => {
  expect(parseGrams("100,5 جرام")).toBe(100.5);
 });
});

describe("scalePer100g — linear mass scaling, whole-number rounding", () => {
 it("scales a library row to the picked grams", () => {
  const chicken = { calories: 165, protein: 31, carbs: 0, fat: 3.6 };
  expect(scalePer100g(chicken, 150)).toEqual({
   calories: 248, // 165 × 1.5 = 247.5 → 248
   protein_g: 47, // 31 × 1.5 = 46.5 → 47
   carbs_g: 0,
   fat_g: 5, // 3.6 × 1.5 = 5.4 → 5
  });
 });

 it("100g is identity (rounded)", () => {
  const row = { calories: 208, protein: 20, carbs: 0, fat: 13 };
  expect(scalePer100g(row, 100)).toEqual({
   calories: 208,
   protein_g: 20,
   carbs_g: 0,
   fat_g: 13,
  });
 });

 it("50g halves", () => {
  const row = { calories: 200, protein: 10, carbs: 20, fat: 5 };
  expect(scalePer100g(row, 50)).toEqual({
   calories: 100,
   protein_g: 5,
   carbs_g: 10,
   fat_g: 3, // 2.5 → 3
  });
 });
});

describe("recomputeNutritionTotals — the item→meal→plan chain", () => {
 const plan: NutritionPlanContent = {
  overview: "test",
  daily_calories: 9999, // stale on purpose — must be overwritten
  meals_total_calories: 9999,
  macros: {
   protein_g: 999, carbs_g: 999, fat_g: 999,
   protein_cal: 999, carbs_cal: 999, fat_cal: 999,
  },
  meals: [
   {
    name: "الفطور",
    items: [
     { food: "بيض", amount: "100 جرام", calories: 150, protein_g: 13, carbs_g: 1, fat_g: 10 },
     { food: "شوفان", amount: "60 جرام", calories: 230, protein_g: 8, carbs_g: 40, fat_g: 4 },
    ],
    total_calories: 1, // stale — overwritten
   },
   {
    name: "الغداء",
    items: [
     { food: "صدور دجاج", amount: "150 جرام", calories: 248, protein_g: 47, carbs_g: 0, fat_g: 5 },
    ],
   },
  ],
 };

 it("recomputes per-meal totals from the items", () => {
  const next = recomputeNutritionTotals(plan);
  expect(next.meals[0].total_calories).toBe(380); // 150 + 230
  expect(next.meals[0].total_protein_g).toBe(21); // 13 + 8
  expect(next.meals[0].total_carbs_g).toBe(41);
  expect(next.meals[0].total_fat_g).toBe(14);
  expect(next.meals[1].total_calories).toBe(248);
 });

 it("CALORIE-TARGET 2026-10-24: meals_total = the meals sum; daily_calories (the TARGET) SURVIVES the recompute", () => {
  const next = recomputeNutritionTotals(plan);
  // The ACTUAL is the meals sum…
  expect(next.meals_total_calories).toBe(628); // 380 + 248
  // …and the TARGET is no longer clobbered by it (the old
  // `daily_calories = sum` line silently reverted every coach target edit
  // on the next item edit — the «الرقم المعروض» illusion).
  expect(next.daily_calories).toBe(9999);
 });

 it("macro grams sum the meals and split kcal at 4/4/9", () => {
  const next = recomputeNutritionTotals(plan);
  expect(next.macros.protein_g).toBe(68); // 21 + 47
  expect(next.macros.carbs_g).toBe(41);
  expect(next.macros.fat_g).toBe(19);
  expect(next.macros.protein_cal).toBe(272); // 68 × 4
  expect(next.macros.carbs_cal).toBe(164); // 41 × 4
  expect(next.macros.fat_cal).toBe(171); // 19 × 9
 });

 it("never mutates the input (the editor's immutability shape)", () => {
  const before = JSON.stringify(plan);
  recomputeNutritionTotals(plan);
  expect(JSON.stringify(plan)).toBe(before);
 });

 it("a grams edit to ONE item moves every total in the plan (the owner-ordered flow)", () => {
  // The coach binds صدور دجاج (165 kcal/100g) and raises it 150g → 200g:
  const edited: NutritionPlanContent = JSON.parse(JSON.stringify(plan));
  edited.meals[1].items[0].amount = "200 جرام";
  const scaled = scalePer100g({ calories: 165, protein: 31, carbs: 0, fat: 3.6 }, 200);
  edited.meals[1].items[0] = { ...edited.meals[1].items[0], ...scaled };
  const next = recomputeNutritionTotals(edited);
  expect(next.meals[1].total_calories).toBe(330);
  // The ACTUAL moves with the edit; the TARGET (9999) stays untouched.
  expect(next.meals_total_calories).toBe(710); // 380 + 330
  expect(next.daily_calories).toBe(9999);
  expect(next.macros.protein_g).toBe(83); // 21 + 62 (31×2)
 });

 it("items without macros still count their calories", () => {
  const legacy: NutritionPlanContent = {
   overview: "",
   daily_calories: 0,
   macros: { protein_g: 0, carbs_g: 0, fat_g: 0 },
   meals: [
    { name: "وجبة", items: [{ food: "طبق مكرونة", amount: "كبيرة", calories: 500 }] },
   ],
  };
  const next = recomputeNutritionTotals(legacy);
  expect(next.meals[0].total_calories).toBe(500);
  expect(next.meals_total_calories).toBe(500);
  expect(next.daily_calories).toBe(0); // no target set — stays 0, actual rides meals_total
  expect(displayCalories(next)).toBe(500); // display falls back to the actual
  expect(next.macros.protein_g).toBe(0);
 });

 it("empty meals array is safe", () => {
  const empty: NutritionPlanContent = {
   overview: "",
   daily_calories: 5,
   macros: { protein_g: 1, carbs_g: 1, fat_g: 1 },
   meals: [],
  };
  const next = recomputeNutritionTotals(empty);
  expect(next.daily_calories).toBe(5); // preserved target
  expect(next.meals_total_calories).toBe(0);
 });
});

/* ── CALORIE-TARGET 2026-10-24 (owner order item 1: «افحص هل المطلوب إعادة
 * حساب أم إعادة توليد، ونفّذ السلوك الصحيح») — the display + verdict laws. */
describe("displayCalories — the actual-first display law", () => {
 it("shows the meals sum when present (updates on every edit/swap)", () => {
  expect(displayCalories({ daily_calories: 2905, meals_total_calories: 2342 })).toBe(2342);
 });

 it("falls back to the target for legacy plans without meals_total_calories", () => {
  expect(displayCalories({ daily_calories: 2905 })).toBe(2905);
  expect(displayCalories({})).toBe(0);
  expect(displayCalories(null)).toBe(0);
 });

 it("ignores a zero meals_total (treated as absent)", () => {
  expect(displayCalories({ daily_calories: 1800, meals_total_calories: 0 })).toBe(1800);
 });
});

describe("resolveTargetCalorieChange — recalc vs regenerate (the measured answer)", () => {
 it("IN BAND: a small change keeps the meals — target-only update is the honest behavior", () => {
  // ±max(120, 7%): 2000 → band 140 → meals at 2100 are within
  expect(resolveTargetCalorieChange(2000, 2100)).toEqual({ kind: "in-band" });
  expect(resolveTargetCalorieChange(2000, 1861)).toEqual({ kind: "in-band" }); // -139
  // 2905 → band ~203 → meals 2710 within
  expect(resolveTargetCalorieChange(2905, 2710)).toEqual({ kind: "in-band" });
 });

 it("OUT OF BAND: a material change REQUIRES regeneration (recalc can never move meals)", () => {
  const verdict = resolveTargetCalorieChange(2000, 2905);
  expect(verdict.kind).toBe("regenerate");
  if (verdict.kind === "regenerate") {
   expect(verdict.reason).toContain("2905");
   expect(verdict.reason).toContain("2000");
  }
  // 2905 → 2000: |2000-2905| = 905 > band 203 → regenerate
  expect(resolveTargetCalorieChange(2905, 2000).kind).toBe("regenerate");
  // tiny plans use the absolute floor: 1200 → band = max(120, 84) = 120
  expect(resolveTargetCalorieChange(1200, 1290).kind).toBe("in-band"); // +90 ≤ 120
  expect(resolveTargetCalorieChange(1200, 1400).kind).toBe("regenerate"); // +200 > 120
 });

 it("the band constants stay the banner's own law", () => {
  expect(TARGET_CONSISTENCY_ABS_KCAL).toBe(120);
  expect(TARGET_CONSISTENCY_PCT).toBe(0.07);
 });

 it("an invalid target asks for regeneration (never a silent no-op)", () => {
  expect(resolveTargetCalorieChange(0, 2000).kind).toBe("regenerate");
  expect(resolveTargetCalorieChange(NaN, 2000).kind).toBe("regenerate");
 });
});

/* ── AI-PLAN-QUALITY 2026-10-24 — string-poisoning immunity ──
 * Model/legacy items carrying STRING numbers ("230") used to turn every
 * sum into string concatenation ("0230…") — displayed AND persisted.
 * recomputeNutritionTotals now coerces every numeric field first. */

describe("recomputeNutritionTotals — AI string-number immunity (AI-PLAN-QUALITY)", () => {
 it("string calories/protein/macros are coerced, sums stay numbers", () => {
  const poisoned: NutritionPlanContent = {
   overview: "",
   daily_calories: 0,
   macros: { protein_g: 0, carbs_g: 0, fat_g: 0 },
   meals: [
    {
     name: "وجبة",
     items: [
      { food: "شوفان", amount: "60 جم", calories: "220" as unknown as number, protein_g: "8" as unknown as number, carbs_g: "30" as unknown as number, fat_g: "4" as unknown as number },
      { food: "موزة", amount: "1", calories: "100" as unknown as number },
     ],
    },
   ],
  };
  const next = recomputeNutritionTotals(poisoned);
  expect(next.meals[0].total_calories).toBe(320);
  expect(typeof next.meals[0].total_calories).toBe("number");
  // CALORIE-TARGET 2026-10-24: the fixture set NO target (0) — 0 is
  // preserved (never silently replaced by the sum); the ACTUAL rides
  // meals_total_calories and displayCalories reads it.
  expect(next.daily_calories).toBe(0);
  expect(next.meals_total_calories).toBe(320);
  expect(displayCalories(next)).toBe(320);
  expect(next.macros.protein_g).toBe(8);
  expect(next.macros.carbs_g).toBe(30);
  expect(next.macros.fat_g).toBe(4);
  expect(next.macros.protein_cal).toBe(32);
  expect(next.macros.fat_cal).toBe(36);
 });

 it("stale string meal totals are recomputed from items, not concatenated", () => {
  const legacy: NutritionPlanContent = {
   overview: "",
   daily_calories: 0,
   macros: { protein_g: 0, carbs_g: 0, fat_g: 0 },
   meals: [
    {
     name: "وجبة",
     items: [{ food: "أرز", amount: "200 جم", calories: 260 }],
     total_calories: "0260" as unknown as number,
    },
   ],
  };
  const next = recomputeNutritionTotals(legacy);
  expect(next.meals[0].total_calories).toBe(260);
  expect(next.meals_total_calories).toBe(260);
  expect(displayCalories(next)).toBe(260);
 });
});
