/**
 * GRAM-SCALING LAW (nutrition-quantity audit 2026-11-12, owner order
 * «نفّذ تدقيقًا شاملًا لمعلومة حجم الحصة الغذائية»): pins the ACTUAL
 * calculation semantics of the food system against the wrong claim
 * «القيم الغذائية محسوبة لكل 100 جرام».
 *
 * THE TRUTH THIS TEST PINS:
 *   - Nutrition values are STORED per 100g as a REFERENCE density
 *     (the international food-composition convention, USDA-style).
 *   - Every calculation is performed on the ENTERED gram amount —
 *     from 1 g up (per each surface's limits) — by scaling the
 *     reference: serving value = reference × (grams ÷ 100).
 *     100 g is never a mandatory calculation unit.
 *   - defaultGrams is a per-food serving ANCHOR (9–355 g across the
 *     8,162-row DB, 36 distinct values), not a forced 100 g.
 *   - Rounding: calories → integer, macros → 0.1 g (calculateNutrition);
 *     coach-editor scalePer100g rounds to integers.
 *   - parseGrams honors gram amounts from 1 g up with decimals
 *     ("1 جم", "0.5 جم", "100.5 جرام"), bare numbers ≥ 20, and
 *     refuses count-based amounts ("2 بيضة").
 */
import { describe, it, expect } from "vitest";
import { FOODS } from "../foods";
import {
  calculateNutrition,
  type Food,
} from "../foods-shared";
import { scalePer100g, parseGrams } from "../nutrition-totals";

const GRAMS_TO_TEST = [1, 10, 50, 100, 200, 2000];

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Deterministic spread across categories: first + last + every 400th row. */
function sampleFoods(): Food[] {
  const picked: Food[] = [];
  const step = Math.max(1, Math.floor(FOODS.length / 20));
  for (let i = 0; i < FOODS.length; i += step) picked.push(FOODS[i]);
  picked.push(FOODS[0], FOODS[FOODS.length - 1]);
  const seen = new Set<string>();
  return picked.filter((f) => (seen.has(f.slug) ? false : (seen.add(f.slug), true)));
}

describe("AUDIT: nutrition math scales to the ENTERED grams (not a 100g unit)", () => {
  it("calculateNutrition matches per100g × grams/100 for every sampled food at 1/10/50/100/200/2000 g", () => {
    const foods = sampleFoods();
    expect(foods.length).toBeGreaterThan(15);
    let checked = 0;
    for (const food of foods) {
      for (const g of GRAMS_TO_TEST) {
        const n = calculateNutrition(food, g);
        expect(n).not.toBeNull();
        expect(n!.calories).toBe(Math.round(food.per100g.calories * (g / 100)));
        expect(n!.protein).toBe(r1(food.per100g.protein * (g / 100)));
        expect(n!.carbs).toBe(r1(food.per100g.carbs * (g / 100)));
        expect(n!.fat).toBe(r1(food.per100g.fat * (g / 100)));
        expect(n!.fiber).toBe(r1(food.per100g.fiber * (g / 100)));
        expect(n!.sugar).toBe(r1(food.per100g.sugar * (g / 100)));
        expect(n!.grams).toBe(g);
        checked += 1;
      }
    }
    // Truth marker for the report
    console.log(`AUDIT: verified linear gram scaling on ${foods.length} foods × ${GRAMS_TO_TEST.length} amounts = ${checked} assertions`);
  });

  it("accepts 1 gram (the practical minimum) and rejects 0/negative", () => {
    const food = FOODS[0];
    expect(calculateNutrition(food, 1)).not.toBeNull();
    expect(calculateNutrition(food, 0)).toBeNull();
    expect(calculateNutrition(food, -5)).toBeNull();
    expect(calculateNutrition(food, NaN)).toBeNull();
  });

  it("1g example (chicken breast if present): ~1.65 kcal rounds to 2, protein 0.31 → 0.3", () => {
    const chicken = FOODS.find((f) => f.slug.includes("chicken-breast") && f.defaultGrams === 150);
    if (!chicken) return; // data-shape independent
    const n = calculateNutrition(chicken, 1)!;
    expect(n.calories).toBe(Math.round(chicken.per100g.calories / 100));
    expect(n.protein).toBe(r1(chicken.per100g.protein / 100));
  });

  it("defaultGrams across the whole DB is a real serving anchor (≥ 1, ≤ 1000) — never a forced 100", () => {
    const grams = FOODS.map((f) => f.defaultGrams);
    const min = Math.min(...grams);
    const max = Math.max(...grams);
    const distinct = new Set(grams);
    console.log(`AUDIT: defaultGrams range = ${min}–${max} g across ${FOODS.length} foods (${distinct.size} distinct values)`);
    expect(min).toBeGreaterThanOrEqual(1);
    expect(max).toBeLessThanOrEqual(1000);
    expect(distinct.size).toBeGreaterThan(10); // genuinely varied servings
  });

  it("scalePer100g (coach editor) also scales by the entered grams", () => {
    const p = { calories: 165, protein: 31, carbs: 0, fat: 3.6 };
    expect(scalePer100g(p, 1)).toEqual({ calories: 2, protein_g: 0, carbs_g: 0, fat_g: 0 });
    expect(scalePer100g(p, 10)).toEqual({ calories: 17, protein_g: 3, carbs_g: 0, fat_g: 0 });
    expect(scalePer100g(p, 50)).toEqual({ calories: 83, protein_g: 16, carbs_g: 0, fat_g: 2 });
    expect(scalePer100g(p, 100)).toEqual({ calories: 165, protein_g: 31, carbs_g: 0, fat_g: 4 });
    expect(scalePer100g(p, 200)).toEqual({ calories: 330, protein_g: 62, carbs_g: 0, fat_g: 7 });
  });

  it("parseGrams honors gram amounts from 1g up, with decimals, and rejects non-gram counts", () => {
    expect(parseGrams("150 جرام")).toBe(150);
    expect(parseGrams("1 جم")).toBe(1);
    expect(parseGrams("0.5 جم")).toBe(0.5);
    expect(parseGrams("100.5 جرام")).toBe(100.5);
    expect(parseGrams("80")).toBe(80);
    expect(parseGrams("2 بيضة")).toBeNull();
    expect(parseGrams("نصف كوب")).toBeNull();
  });
});
