import { describe, it, expect } from "vitest";
import {
  buildClientConstraints,
  checkItemConstraints,
  hasItemConstraints,
  tokenizeConstraintText,
  validateNutritionPlanAIOutput,
  validateRegeneratedMeal,
  validateRegeneratedFoodItem,
  normalizeAIItem,
  PLAN_AI_SANITY,
} from "@/lib/plan-ai-validation";
import { resolvePlanDietType, classifyDietText } from "@/lib/diet-types";

/**
 * PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order items 1+2 — the measured
 * keto-loss bug): the client's COMMITTED constraints are MANDATORY at every
 * generation stage. These tests pin:
 *
 *   - the diet-compliance gate (a rice dish inside a keto plan REJECTED);
 *   - the allergen gate (free-text allergies + conservative family
 *     expansion; plant-milk guard against false positives);
 *   - the disliked/banned gate;
 *   - the per-item MACRO↔CALORIE coherence check (the «سعرات تناقي
 *     الماكروز» contradiction class);
 *   - the robust plan-diet resolver that killed RC1-a/RC1-b (whole-plan
 *     regen + target-change regen + member swap diet preservation).
 */

/* ── diet compliance ── */

describe("diet-compliance gate (checkItemConstraints)", () => {
  it("rejects keto violations: grains, starches, sugars, high-carb fruits", () => {
    for (const food of ["أرز أبيض", "خبز بلدي", "شوفان بالحليب", "مكرونة بالصلصة", "بطاطس مشوية", "عسل نحل", "تمر مجهول", "موزة وسطة", "Banana smoothie", "Rice bowl"]) {
      const v = checkItemConstraints(food, {}, { dietType: "keto" });
      expect(v, `«${food}» must be rejected in a keto plan`).toContain("كيتو");
    }
  });

  it("allows keto-clean foods", () => {
    for (const food of ["صدور دجاج مشوية", "سلمون بالزبدة", "بيض مسلوق", "جبن قريش", "سلطة خضراء بزيت الزيتون", "لوز", "افوكادو", "Steak with butter"]) {
      expect(checkItemConstraints(food, {}, { dietType: "keto" })).toBeNull();
    }
  });

  it("rejects a keto item by its CARB GRAMS even with an innocent name", () => {
    // A "healthy" sounding item carrying 40g carbs is off a 20-50g/day diet.
    const v = checkItemConstraints("مشروب صحي بالخضار", { carbs_g: 40 }, { dietType: "keto" });
    expect(v).toContain("كربوهيدرات");
    expect(checkItemConstraints("سلطة خضراء", { carbs_g: 4 }, { dietType: "keto" })).toBeNull();
  });

  it("low_carb: rejects dense sugars, allows a moderate starch portion by grams", () => {
    expect(checkItemConstraints("عصير برتقال", {}, { dietType: "low_carb" })).toContain("قليل الكربوهيدرات");
    expect(checkItemConstraints("حلاوة", {}, { dietType: "low_carb" })).toContain("قليل الكربوهيدرات");
    // rice itself is NOT token-blocked on low_carb — the gram ceiling governs
    expect(checkItemConstraints("أرز", { carbs_g: 30 }, { dietType: "low_carb" })).toBeNull();
    expect(checkItemConstraints("أرز", { carbs_g: 60 }, { dietType: "low_carb" })).toContain("كربوهيدرات");
  });

  it("vegetarian: rejects meat/fish in Arabic and English", () => {
    for (const food of ["لحم بقري مشوي", "صدور دجاج", "سلمون مشوي", "تونة بالماء", "جمبري مشوي", "Grilled chicken", "Beef steak"]) {
      expect(checkItemConstraints(food, {}, { dietType: "vegetarian" }), `«${food}»`).toContain("نظام");
    }
    // dairy + eggs are FINE for plain vegetarian
    expect(checkItemConstraints("جبن قريش", {}, { dietType: "vegetarian" })).toBeNull();
    expect(checkItemConstraints("بيض أومليت", {}, { dietType: "vegetarian" })).toBeNull();
  });

  it("vegan: rejects animal products incl. dairy/eggs/honey, but NOT plant milks (the guard)", () => {
    for (const food of ["لحم", "دجاج مشوي", "بيض مسلوق", "جبن شيدر", "زبادي يوناني", "عسل", "Milk chocolate", "Whey protein"]) {
      expect(checkItemConstraints(food, {}, { dietType: "vegan" }), `«${food}»`).toBeTruthy();
    }
    // THE GUARD: plant-based dairy alternatives are vegan staples
    expect(checkItemConstraints("حليب جوز الهند", {}, { dietType: "vegan" })).toBeNull();
    expect(checkItemConstraints("حليب اللوز", {}, { dietType: "vegan" })).toBeNull();
    expect(checkItemConstraints("حليب الصويا", {}, { dietType: "vegan" })).toBeNull();
    expect(checkItemConstraints("جبن نباتي", {}, { dietType: "vegan" })).toBeNull();
  });

  it("unconstrained (balanced / no constraints) never rejects", () => {
    expect(checkItemConstraints("أرز أبيض", {}, undefined)).toBeNull();
    expect(checkItemConstraints("أي طعام", { carbs_g: 999 }, {})).toBeNull();
  });
});

/* ── allergens + banned tokens ── */

describe("allergen/banned tokenization + matching", () => {
  it("tokenizes free-text allergies and EXPANDS category words to families", () => {
    const tokens = tokenizeConstraintText("حساسية من المكسرات والبيض");
    // the named categories themselves (article-stripped by normFood)
    expect(tokens).toContain("مكسرات");
    expect(tokens).toContain("بيض");
    // conservative family expansion — nuts
    expect(tokens.some((t) => t.includes("كاجو"))).toBe(true);
    expect(tokens.some((t) => t.includes("بندق"))).toBe(true);
    expect(tokens.some((t) => t.includes("فستق"))).toBe(true);
    // eggs
    expect(tokens.some((t) => t.includes("اومليت"))).toBe(true);
    // stop words never become tokens
    expect(tokens).not.toContain("حساسيه");
    expect(tokens).not.toContain("من");
  });

  it("a named single allergen matches its occurrences in generated items", () => {
    const c = buildClientConstraints({ allergyText: "جمبري" });
    expect(hasItemConstraints(c)).toBe(true);
    expect(checkItemConstraints("جمبري مشوي بالثوم", {}, c)).toContain("حساسيات");
    expect(checkItemConstraints("سلمون مشوي", {}, c)).toBeNull();
  });

  it("dairy-allergy family expansion blocks cheese/yogurt but not plant milk (guard)", () => {
    const c = buildClientConstraints({ allergyText: "حساسية ألبان" });
    expect(checkItemConstraints("جبن قريش", {}, c)).toContain("حساسيات");
    expect(checkItemConstraints("زبادي", {}, c)).toContain("حساسيات");
    // plant milks are dairy-free — the guard applies to allergens too
    expect(checkItemConstraints("حليب جوز الهند", {}, c)).toBeNull();
  });

  it("disliked (banned) foods are enforced too", () => {
    const c = buildClientConstraints({ dislikedText: "فول، كبدة" });
    expect(checkItemConstraints("فول مدمس بالليمون", {}, c)).toContain("الممنوعة");
    expect(checkItemConstraints("كبدة اسكندراني", {}, c)).toContain("الممنوعة");
    expect(checkItemConstraints("شيش طاووق", {}, c)).toBeNull();
  });

  it("empty texts build no constraints", () => {
    expect(hasItemConstraints(buildClientConstraints({}))).toBe(false);
    expect(hasItemConstraints(buildClientConstraints({ allergyText: "لا يوجد", dislikedText: "" }))).toBe(false);
  });
});

/* ── macro↔calorie coherence ── */

describe("macro↔calorie coherence (normalizeAIItem)", () => {
  it("REJECTS inflated calories vs macros (the 600-kcal-eggs class)", () => {
    const v = normalizeAIItem({ food: "بيض مسلوق", amount: "150 جم", calories: 600, protein_g: 18, carbs_g: 2, fat_g: 16 });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain("contradict");
  });

  it("REJECTS inflated macros vs declared calories", () => {
    const v = normalizeAIItem({ food: "كرة بروتين", amount: "60 جم", calories: 90, protein_g: 40, carbs_g: 25, fat_g: 15 });
    expect(v.ok).toBe(false);
  });

  it("accepts coherent items and fiber-shaped rows inside the wide band", () => {
    // 4*18 + 4*2 + 9*16 = 224 vs 234 declared → 4% off, fine
    expect(normalizeAIItem({ food: "بيض مسلوق", amount: "150 جم", calories: 234, protein_g: 18, carbs_g: 2, fat_g: 16 }).ok).toBe(true);
    // wheat-bran shape: naive Atwater 344 vs declared 216 → within the ×1.7 deflation band
    expect(normalizeAIItem({ food: "نخلة قمح", amount: "100 جم", calories: 216, protein_g: 13, carbs_g: 64, fat_g: 4 }).ok).toBe(true);
  });

  it("partial macro sets are estimates, not contradictions — never rejected", () => {
    expect(normalizeAIItem({ food: "شوفان", amount: "60 جم", calories: 230, protein_g: 8 }).ok).toBe(true);
    expect(normalizeAIItem({ food: "شوفان", amount: "60 جم", calories: 230 }).ok).toBe(true);
  });
});

/* ── validators carry the constraints end-to-end ── */

describe("validators enforce constraints end-to-end", () => {
  const keto = { dietType: "keto" as const };

  // Both fixtures sum to exactly 1800 (550+650+600) — INSIDE the ±25%
  // band — so the ONLY differentiator is the diet constraint itself.
  it("validateNutritionPlanAIOutput rejects a keto plan containing rice", () => {
    const plan = {
      meals: [
        { name: "الفطور", items: [{ food: "أومليت بالجبن", amount: "150 جم", calories: 550, protein_g: 32, fat_g: 42 }] },
        { name: "الغداء", items: [{ food: "أرز بالدجاج", amount: "300 جم", calories: 650, protein_g: 45, fat_g: 16 }] },
        { name: "العشاء", items: [{ food: "سلمون مشوي", amount: "180 جم", calories: 600, protein_g: 58, fat_g: 38 }] },
      ],
    };
    const v = validateNutritionPlanAIOutput(plan, 1800, null, keto);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain("كيتو");
  });

  it("validateNutritionPlanAIOutput accepts a keto-clean plan of the same shape", () => {
    const plan = {
      meals: [
        { name: "الفطور", items: [{ food: "أومليت بالجبن", amount: "150 جم", calories: 550, protein_g: 32, fat_g: 42 }] },
        { name: "الغداء", items: [{ food: "دجاج بالزبدة", amount: "250 جم", calories: 650, protein_g: 55, fat_g: 45 }] },
        { name: "العشاء", items: [{ food: "سلمون مشوي", amount: "180 جم", calories: 600, protein_g: 58, fat_g: 38 }] },
      ],
    };
    const v = validateNutritionPlanAIOutput(plan, 1800, null, keto);
    expect(v.ok).toBe(true);
  });

  it("validateRegeneratedMeal rejects a rice replacement for a keto plan", () => {
    const meal = {
      meal: {
        name: "غداء بديل",
        items: [
          { food: "أرز بخاري", amount: "200 جم", calories: 300 },
          { food: "دجاج مشوي", amount: "150 جم", calories: 250 },
        ],
        total_calories: 550,
      },
    };
    const v = validateRegeneratedMeal(meal, 550, null, keto);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain("كيتو");
  });

  it("validateRegeneratedFoodItem rejects an allergen replacement inside the ±15% band", () => {
    // calories are INSIDE ±15% of the original — only the constraint catches it
    const v = validateRegeneratedFoodItem(
      { food: "كاجو محمص", amount: "40 جم", calories: 230 },
      220,
      null,
      buildClientConstraints({ allergyText: "مكسرات" }),
    );
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain("حساسيات");
  });

  it("validateRegeneratedFoodItem accepts a keto-safe equivalent item", () => {
    const v = validateRegeneratedFoodItem(
      { food: "جبن قريش", amount: "150 جم", calories: 150, protein_g: 24, fat_g: 6 },
      150,
      null,
      keto,
    );
    expect(v.ok).toBe(true);
  });
});

/* ── the robust plan-diet resolver (RC1-a / RC1-b) ── */

describe("resolvePlanDietType — the keto-loss root fix", () => {
  it("resolves the exact generation echo label", () => {
    expect(resolvePlanDietType({ data_analysis: { diet_type: "كيتو" } })).toBe("keto");
    expect(resolvePlanDietType({ data_analysis: { diet_type: "متوازن" } })).toBe("balanced");
    expect(resolvePlanDietType({ data_analysis: { diet_type: "نباتي صرف" } })).toBe("vegan");
  });

  it("resolves a legacy / wordy echo through classification (RC1-b)", () => {
    expect(resolvePlanDietType({ data_analysis: { diet_type: "كيتو (Ketogenic)" } })).toBe("keto");
    expect(resolvePlanDietType({ data_analysis: { diet_type: "Keto" } })).toBe("keto");
    expect(resolvePlanDietType({ data_analysis: { diet_type: "قليل الكربوهيدرات" } })).toBe("low_carb");
  });

  it("falls back to the questionnaire ONLY when the plan carries no echo", () => {
    expect(resolvePlanDietType({}, "كيتو")).toBe("keto");
    expect(resolvePlanDietType({ data_analysis: {} }, "balanced")).toBe("balanced");
    // the echo WINS over a contradicting questionnaire (committed diet)
    expect(resolvePlanDietType({ data_analysis: { diet_type: "كيتو" } }, "متوازن")).toBe("keto");
  });

  it("returns null when nothing resolves — never invents a diet", () => {
    expect(resolvePlanDietType(null)).toBeNull();
    expect(resolvePlanDietType({})).toBeNull();
    expect(resolvePlanDietType({ data_analysis: { diet_type: "غير معروف" } })).toBeNull();
  });

  it("a stored enum key resolves directly (future-proof content.diet_type)", () => {
    expect(resolvePlanDietType({ diet_type: "keto" })).toBe("keto");
  });

  it("classifyDietText still governs the questionnaire path unchanged", () => {
    expect(classifyDietText("")).toBe("balanced");
    expect(classifyDietText("كيتوجينيك")).toBe("keto");
    expect(classifyDietText("دايت عادي")).toBe("balanced");
  });
});

/* ── sanity constants stay pinned ── */

describe("PLAN_AI_SANITY constraint constants", () => {
  it("carries the documented bands", () => {
    expect(PLAN_AI_SANITY.ketoItemCarbsMax).toBe(12);
    expect(PLAN_AI_SANITY.lowCarbItemCarbsMax).toBe(35);
    expect(PLAN_AI_SANITY.macroCalorieInflationTolerance).toBe(0.5);
    expect(PLAN_AI_SANITY.macroCalorieDeflationTolerance).toBe(0.7);
  });
});
