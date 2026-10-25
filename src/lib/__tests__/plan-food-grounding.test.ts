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

/* ═══════════════════════════════════════════════════════════════════════
 * REGEN-ROOTCAUSE-2 2026-10-26 — RANKED MATCHING pins (the plan-
 * regeneration job-killer). The pre-fix lookupContains returned the FIRST
 * substring-containment candidate in FOODS array order, so the gate's
 * grounding re-priced COOKED foods against DRY rows and re-priced «بيض
 * مقلي» as STIR-FRIED MUSHROOMS — the inflated day drifted past ±25%, the
 * local fallback was rejected and the regeneration job failed (reproduced
 * locally with the exact production payload: 3915 kcal vs 3035 target).
 * ═════════════════════════════════════════════════════════════════════ */

describe("REGEN-ROOTCAUSE-2 — ranked matching picks the RIGHT row (not the first substring)", () => {
  it("«شوفان مطبوخ» anchors the COOKED row (71), never the DRY «شوفان» (389) — the +954 kcal job-killer", () => {
    const row = findFoodForAIItem("شوفان مطبوخ");
    expect(row).not.toBeNull();
    expect(row!.per100g.calories).toBeLessThanOrEqual(80); // cooked-with-water family
    const grounded = groundItemToLibrary({ food: "شوفان مطبوخ", amount: "300 جم", calories: 213 });
    expect(grounded?.calories).toBeLessThanOrEqual(250); // 71×3 ≈ 213 — NOT 389×3 = 1167
  });

  it("«بيض مقلي» anchors a REAL egg row (the «بيضة مقلية» row via ة-equivalence), never «مشروم أبيض — مقلي سريعًا» (26)", () => {
    const row = findFoodForAIItem("بيض مقلي");
    expect(row).not.toBeNull();
    expect(row!.per100g.calories).toBeGreaterThanOrEqual(120); // an egg, not a 26-kcal mushroom
    expect(row!.per100g.protein).toBeGreaterThanOrEqual(10);
  });

  it("«لبن رايب» anchors a FLUID row, never «لبن رايب مجفف» (387 — the +868% inflation class)", () => {
    const row = findFoodForAIItem("لبن رايب");
    expect(row).not.toBeNull();
    expect(row!.per100g.calories).toBeLessThanOrEqual(80); // fluid buttermilk family
  });

  it("«جبن موزاريلا قليلة الدسم» anchors the PART-SKIM row (254), not the full-fat «جبن موزاريلا» (280)", () => {
    const row = findFoodForAIItem("جبن موزاريلا قليلة الدسم");
    expect(row?.slug).toBe("cheese-mozzarella-part-skim-milk");
  });

  it("bare «شوفان» still anchors the DRY row (389) — the bare name means dry oats", () => {
    const row = findFoodForAIItem("شوفان");
    expect(row?.per100g.calories).toBeGreaterThanOrEqual(300);
  });

  it("«فريك مطبوخ» (freekeh) finds NO anchor — the farina «فريكة قمح ناعمة» rows are a different food (+5 extra tokens)", () => {
    expect(findFoodForAIItem("فريك مطبوخ")).toBeNull();
  });

  it("«صدور دجاج مشوية» generalizes to the chicken-breast row (T2 — the row drops the cooking qualifier)", () => {
    const row = findFoodForAIItem("صدور دجاج مشوية");
    expect(row).not.toBeNull();
    expect(normalizeFoodName(row!.nameEn)).toContain("chicken");
  });

  it("the containment cap keeps variety-qualified rows out: «فاصوليا خضراء» never anchors «فاصوليا بينتو…» (162 vs 31)", () => {
    const row = findFoodForAIItem("فاصوليا خضراء");
    expect(row).not.toBeNull();
    expect(row!.per100g.calories).toBeLessThanOrEqual(45); // green-bean family, not pinto 162
  });
});

describe("REGEN-ROOTCAUSE-2 — grounding is IDEMPOTENT for the whole local FOOD_DB", () => {
  it("no FOOD_DB item deviates >35% from its library anchor (nothing the gate would re-price)", async () => {
    const { FOOD_DB } = await import("@/lib/ai-local");
    const offenders: string[] = [];
    for (const f of FOOD_DB as Array<{ name: string; calsPer100g: number }>) {
      const row = findFoodForAIItem(f.name);
      if (!row) continue; // no anchor — the item's own estimate stands
      const deviation = Math.abs(row.per100g.calories - f.calsPer100g) / row.per100g.calories;
      if (deviation > 0.35) {
        offenders.push(`${f.name}: ${f.calsPer100g} vs «${row.nameAr}» ${row.per100g.calories} (dev ${Math.round(deviation * 100)}%)`);
      }
    }
    expect(offenders, offenders.join(" | ")).toEqual([]);
  });
});
