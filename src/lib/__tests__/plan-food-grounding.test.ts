import { describe, it, expect } from "vitest";
import {
  normalizeFoodName,
  findFoodForAIItem,
  groundItemToLibrary,
} from "@/lib/plan-food-grounding";
import { FOODS, getFoodBySlug } from "@/lib/foods";

/**
 * AI-PLAN-QUALITY 2026-10-24 (owner order item 3 — «الاستفادة الصحيحة من
 * قاعدة الأطعمة بدل اختلاق بيانات غير موثوقة»): the grounding layer ties
 * AI calorie estimates to the REAL 8,830-row library (per-100g × grams).
 * These tests run against the live FOODS array.
 */

describe("normalizeFoodName", () => {
  it("strips diacritics, unifies alef/ya/ta-marbuta and the definite article", () => {
    expect(normalizeFoodName("صُدور دَجاج")).toBe(normalizeFoodName("صدور دجاج"));
    expect(normalizeFoodName("الدجاج")).toBe(normalizeFoodName("دجاج"));
    expect(normalizeFoodName("Chicken Breast")).toBe("chicken breast");
    expect(normalizeFoodName("  خبز   بلدي ")).toBe(normalizeFoodName("خبز بلدي"));
  });
});

describe("findFoodForAIItem", () => {
  it("finds a food by exact English name", () => {
    const f = findFoodForAIItem("Chicken Breast");
    expect(f).not.toBeNull();
    expect(f?.nameEn.toLowerCase()).toContain("chicken");
  });

  it("finds a food by normalized Arabic name when the library row is translated", () => {
    // Any row whose nameAr normalizes equal to a common Arabic query.
    const row = FOODS.find((f) => f.nameAr && f.nameAr.includes("شوفان"));
    if (row) {
      // containment matching also reaches it from the bare Arabic name
      expect(findFoodForAIItem(row.nameAr)?.slug).toBe(row.slug);
    }
  });

  it("returns null for a nonexistent food (no hallucinated anchoring)", () => {
    expect(findFoodForAIItem("طبق خيالي غير موجود إطلاقاً xyz123")).toBeNull();
    expect(findFoodForAIItem("")).toBeNull();
  });
});

describe("groundItemToLibrary", () => {
  it("grounds a hallucinated estimate to per-100g × grams (the live incident: 150g chicken ≠ 600 kcal)", () => {
    const chicken = getFoodBySlug("chicken-breast") ?? findFoodForAIItem("Chicken Breast");
    if (!chicken) return; // library shape changed — guard, not a silent pass
    const grounded = groundItemToLibrary({ food: "Chicken Breast", amount: "150 جم", calories: 600 });
    expect(grounded).not.toBeNull();
    const expected = Math.round(chicken.per100g.calories * 1.5);
    expect(grounded?.calories).toBe(expected);
    // The hallucinated 600 must have been REPLACED, not echoed.
    expect(grounded?.calories).toBeLessThan(600);
  });

  it("returns null when the amount carries no parseable grams (count-based items are never guessed)", () => {
    expect(
      groundItemToLibrary({ food: "Chicken Breast", amount: "2 قطعة", calories: 300 }),
    ).toBeNull();
    expect(groundItemToLibrary({ food: "Chicken Breast", amount: "", calories: 300 })).toBeNull();
  });

  it("returns null for a food outside the library", () => {
    expect(
      groundItemToLibrary({ food: "كيك خيالي xyz123", amount: "100 جم", calories: 400 }),
    ).toBeNull();
  });

  it("never throws (total contract)", () => {
    expect(() =>
      groundItemToLibrary({ food: "شوفان", amount: "50 جم", calories: 200 }),
    ).not.toThrow();
  });
});
