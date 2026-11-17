import { describe, it, expect } from "vitest";
import {
  alternativeCaloriesEquivalent,
  coerceNumber,
  normalizeAIItem,
  validateNutritionPlanAIOutput,
  validateRegeneratedMeal,
  validateRegeneratedFoodItem,
  validateRegeneratedWorkoutDay,
  validateWorkoutPlanAIOutput,
  PLAN_AI_SANITY,
  type GroundItemFn,
} from "@/lib/plan-ai-validation";

/**
 * AI-PLAN-QUALITY 2026-10-24 (owner order — «جودة التوليد هي الأولوية
 * القصوى لأنها الخدمة المدفوعة الأساسية»): the MANDATORY output gate
 * battery. A provider answering 200 is NOT evidence of quality — these
 * tests pin every bound the gate enforces before any AI payload is
 * returned, displayed, or persisted.
 */

/* ── fixtures ── */

const goodMeal = (name: string, cals: number) => ({
  name,
  items: [
    { food: "صدور دجاج مشوية", amount: "150 جم", calories: cals, protein_g: 45 },
    { food: "أرز أبيض", amount: "200 جم", calories: 260, protein_g: 6 },
    { food: "سلطة خضراء", amount: "طبق", calories: 80 },
  ],
});

// Each meal's true sum is cals + 260 + 80 = cals + 340.
// 3 meals (200/300/250) → 540 + 640 + 590 = 1770 → inside ±25% of 2000.
const goodPlan = () => ({
  meals: [goodMeal("الفطور", 200), goodMeal("الغداء", 300), goodMeal("العشاء", 250)],
});

/* ── coercion ── */

describe("coerceNumber", () => {
  it("coerces strings, Arabic decimals and numbers; rejects garbage", () => {
    expect(coerceNumber("230")).toBe(230);
    expect(coerceNumber(230)).toBe(230);
    expect(coerceNumber(" 230 ")).toBe(230);
    expect(coerceNumber("230,5")).toBe(230.5);
    // REGEN-RELIABILITY 2026-10-24: Arabic-Indic digits ARE parsed now (the
    // live "calories outside 1-2000" rejection class — parity with parseGrams).
    expect(coerceNumber("٢٣٠")).toBe(230);
    expect(coerceNumber("abc")).toBeNull();
    expect(coerceNumber(null)).toBeNull();
    expect(coerceNumber(undefined)).toBeNull();
    expect(coerceNumber(Number.NaN)).toBeNull();
  });
});

/* ── item normalization ── */

describe("normalizeAIItem", () => {
  it("coerces string calories/protein into rounded numbers", () => {
    const v = normalizeAIItem({ food: "شوفان", amount: "70 جم", calories: "260", protein_g: "9.4" });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.calories).toBe(260);
      expect(v.value.protein_g).toBe(9.4);
      expect(typeof v.value.calories).toBe("number");
    }
  });

  it("rejects hallucinated calorie magnitudes", () => {
    expect(normalizeAIItem({ food: "موزة", amount: "1", calories: 5000 }).ok).toBe(false);
    expect(normalizeAIItem({ food: "موزة", amount: "1", calories: 0 }).ok).toBe(false);
    expect(normalizeAIItem({ food: "موزة", amount: "1", calories: -5 }).ok).toBe(false);
    expect(normalizeAIItem({ food: "", amount: "1", calories: 100 }).ok).toBe(false);
  });

  it("grounds a hallucinated estimate to the library truth (owner order item 3)", () => {
    // Library says 150g of this food is 248 kcal; the model claims 600.
    const ground: GroundItemFn = () => ({ calories: 248, protein_g: 31, carbs_g: 0, fat_g: 5.4 });
    const v = normalizeAIItem({ food: "صدور دجاج", amount: "150 جم", calories: 600 }, ground);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.calories).toBe(248);
      expect(v.value.protein_g).toBe(31);
      expect(v.value.fat_g).toBe(5.4);
    }
  });

  it("keeps a close estimate untouched (within the 35% grounding tolerance)", () => {
    const ground: GroundItemFn = () => ({ calories: 248 });
    const v = normalizeAIItem({ food: "صدور دجاج", amount: "150 جم", calories: 290 }, ground);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.calories).toBe(290);
  });

  it("a throwing grounding callback degrades to no-grounding (total contract)", () => {
    const bad: GroundItemFn = () => {
      throw new Error("boom");
    };
    const v = normalizeAIItem({ food: "شوفان", amount: "70 جم", calories: 260 }, bad);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.calories).toBe(260);
  });
});

/* ── full plan gate ── */

describe("validateNutritionPlanAIOutput", () => {
  it("accepts a coherent plan and recomputes totals from items", () => {
    const plan = goodPlan();
    // Lie in the model's own totals — the gate must ignore them.
    (plan.meals[0] as Record<string, unknown>).total_calories = 9999;
    const v = validateNutritionPlanAIOutput(plan, 2000);
    expect(v.ok).toBe(true);
    if (v.ok) {
      const expected0 = 200 + 260 + 80;
      expect(v.value.meals[0].total_calories).toBe(expected0);
      expect(v.value.meals_total_calories).toBe(
        v.value.meals.reduce((s, m) => s + m.total_calories, 0),
      );
    }
  });

  it("rejects a plan whose meals drift beyond ±25% of the target (the live incident class)", () => {
    const plan = {
      meals: [goodMeal("أ", 300), goodMeal("ب", 300), goodMeal("ج", 300)],
    };
    const v = validateNutritionPlanAIOutput(plan, 2905);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain("drifted");
  });

  it("rejects wrong meal counts and empty item lists", () => {
    expect(validateNutritionPlanAIOutput({ meals: [goodMeal("واحدة", 500)] }, 2000).ok).toBe(false);
    expect(
      validateNutritionPlanAIOutput({ meals: Array.from({ length: 9 }, () => goodMeal("m", 200)) }, 2000).ok,
    ).toBe(false);
    expect(
      validateNutritionPlanAIOutput({ meals: [{ name: "فارغة", items: [] }] }, 2000).ok,
    ).toBe(false);
    expect(validateNutritionPlanAIOutput({}, 2000).ok).toBe(false);
    expect(validateNutritionPlanAIOutput("not json", 2000).ok).toBe(false);
  });

  it("unwraps common model wrappers ({plan:{meals}})", () => {
    const v = validateNutritionPlanAIOutput({ plan: { meals: goodPlan().meals } }, 2000);
    expect(v.ok).toBe(true);
  });

  it("string-calorie items are coerced, never zeroed", () => {
    const plan = {
      meals: [
        { name: "أ", items: [{ food: "شوفان", amount: "70 جم", calories: "260" }] },
        { name: "ب", items: [{ food: "زبادي", amount: "200 جم", calories: "140" }] },
      ],
    };
    const v = validateNutritionPlanAIOutput(plan, 400);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.meals[0].items[0].calories).toBe(260);
      expect(v.value.meals_total_calories).toBe(400);
    }
  });
});

/* ── meal regeneration gate ── */

describe("validateRegeneratedMeal", () => {
  it("accepts an equivalent meal and recomputes its totals from items", () => {
    const raw = {
      meal: {
        name: "غداء بديل",
        items: [
          { food: "سمك مشوي", amount: "200 جم", calories: "300", protein_g: 40 },
          { food: "بطاطس مسلوقة", amount: "250 جم", calories: 215 },
        ],
        total_calories: 9999,
      },
    };
    const v = validateRegeneratedMeal(raw, 550);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.total_calories).toBe(515);
      expect(v.value.items[0].calories).toBe(300);
      expect(v.value.items[0].protein_g).toBe(40);
    }
  });

  it("rejects a drifted replacement beyond ±20% of the meal target", () => {
    const raw = {
      meal: { name: "بديل منحرف", items: [{ food: "بيتزا", amount: "كاملة", calories: 1800 }] },
    };
    const v = validateRegeneratedMeal(raw, 550);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain("±20%");
  });

  it("rejects empty/too-many items and shapeless payloads", () => {
    expect(validateRegeneratedMeal({ meal: { items: [] } }, 500).ok).toBe(false);
    expect(validateRegeneratedMeal(null, 500).ok).toBe(false);
    expect(
      validateRegeneratedMeal(
        { meal: { items: Array.from({ length: 11 }, () => ({ food: "صنف", amount: "10 جم", calories: 50 })) } },
        550,
      ).ok,
    ).toBe(false);
  });
});

/* ── item regeneration gate ── */

describe("validateRegeneratedFoodItem", () => {
  it("accepts an in-band replacement (±15%)", () => {
    const v = validateRegeneratedFoodItem({ food: "زبادي يوناني", amount: "200 جم", calories: 210 }, 200);
    expect(v.ok).toBe(true);
  });

  it("rejects an out-of-band replacement", () => {
    const v = validateRegeneratedFoodItem({ food: "وجبة كاملة", amount: "طبق كبير", calories: 900 }, 200);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain("±15%");
  });

  it("grounding runs BEFORE the ±15% bound check — a grounded value still outside the band is rejected (the repair retry then asks for adjusted grams)", () => {
    const ground: GroundItemFn = () => ({ calories: 240 });
    const v = validateRegeneratedFoodItem({ food: "شوفان", amount: "60 جم", calories: 600 }, 200, ground);
    // 240 vs 200 = +20% → out of band → honest rejection (retry path).
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain("±15%");
  });

  it("a grounded value INSIDE the band is accepted with the library's number", () => {
    const ground: GroundItemFn = () => ({ calories: 210 });
    const v = validateRegeneratedFoodItem({ food: "شوفان", amount: "50 جم", calories: 950 }, 200, ground);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.calories).toBe(210);
  });
});

/* ── workout gates ── */

describe("validateRegeneratedWorkoutDay", () => {
  const day = { day: "السبت", focus: "صدر وترايسبس" };

  it("accepts 3-8 exercises and coerces bad sets into bounds", () => {
    const raw = {
      exercises: [
        { name: "Bench Press", sets: 4, reps: "6-8", rest: "120 ثانية", notes: "…" },
        { name: "Incline DB Press", sets: "3", reps: "8-12", rest: "90", notes: "" },
        { name: "Cable Fly", sets: 99, reps: "", rest: "", notes: "" },
      ],
    };
    const v = validateRegeneratedWorkoutDay(raw, day);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.exercises).toHaveLength(3);
      expect(v.value.exercises[1].sets).toBe(3);
      expect(v.value.exercises[2].sets).toBe(PLAN_AI_SANITY.setsMax);
      expect(v.value.exercises[2].reps).toBe("10-12");
      expect(v.value.exercises[2].rest).toBe("90 ثانية");
      expect(v.value.day).toBe("السبت");
    }
  });

  it("rejects a hollow day (fewer than 3 exercises) and nameless exercises", () => {
    expect(
      validateRegeneratedWorkoutDay({ exercises: [{ name: "Bench Press", sets: 3 }] }, day).ok,
    ).toBe(false);
    expect(
      validateRegeneratedWorkoutDay(
        { exercises: [{ name: "", sets: 3 }, { name: "Row", sets: 3 }, { name: "Fly", sets: 3 }] },
        day,
      ).ok,
    ).toBe(false);
  });
});

describe("validateWorkoutPlanAIOutput", () => {
  const day = (name: string, n: number) => ({
    day: name,
    focus: "تدريب",
    isRest: false,
    exercises: Array.from({ length: n }, (_, i) => ({
      name: `Exercise ${i + 1}`,
      sets: 3,
      reps: "10",
      rest: "60 ثانية",
      notes: "",
    })),
  });

  it("accepts a real program and empties rest days", () => {
    const raw = {
      days: [day("السبت", 4), day("الأحد", 5), { day: "الاثنين", focus: "راحة", isRest: true, exercises: [day("x", 1)] }],
    };
    const v = validateWorkoutPlanAIOutput(raw);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.days[2].exercises).toEqual([]);
  });

  it("rejects hollow training days and wrong day counts", () => {
    expect(validateWorkoutPlanAIOutput({ days: [day("أ", 1), day("ب", 2), day("ج", 3)] }).ok).toBe(false);
    expect(validateWorkoutPlanAIOutput({ days: [day("أ", 3), day("ب", 3)] }).ok).toBe(false);
  });

  // WOR-1 (audit AI-GENERATION-PIPELINES 2026-11-15, P0-4): the plan's
  // "brain" — overview/weekly_volume/progression are prompted for by BOTH
  // workout prompts, then were dropped by this gate, so every AI workout
  // plan shipped with an empty overview and no progression. They now ride
  // the verdict (bounded, coerced, absent-when-empty).
  it("WOR-1: overview/weekly_volume/progression ride the verdict into normalization", () => {
    const raw = {
      overview: "برنامج 4 أسابيع لبناء العضل",
      weekly_volume: "20 مجموعة أسبوعيًا",
      progression: "زود الوزن 2.5 كجم أسبوعيًا",
      days: [day("السبت", 4), day("الأحد", 5), day("الاثنين", 3)],
    };
    const v = validateWorkoutPlanAIOutput(raw);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.overview).toBe("برنامج 4 أسابيع لبناء العضل");
      expect(v.value.weekly_volume).toBe("20 مجموعة أسبوعيًا");
      expect(v.value.progression).toBe("زود الوزن 2.5 كجم أسبوعيًا");
    }
  });

  it("WOR-1: absent narrative fields stay ABSENT (never blank strings), oversized ones are clamped", () => {
    const v = validateWorkoutPlanAIOutput({ days: [day("أ", 4), day("ب", 4), day("ج", 4)] });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.value.overview).toBeUndefined();
      expect(v.value.weekly_volume).toBeUndefined();
      expect(v.value.progression).toBeUndefined();
    }
    const fat = validateWorkoutPlanAIOutput({
      overview: "x".repeat(5000),
      days: [day("أ", 4), day("ب", 4), day("ج", 4)],
    });
    expect(fat.ok).toBe(true);
    if (fat.ok) expect(fat.value.overview!.length).toBe(PLAN_AI_SANITY.overviewMax);
  });
});

describe("NUT-1 — meal_alternatives ride the full-plan gate (audit P0-3)", () => {
  const alt = (name: string, cals: number) => ({
    name,
    items: [
      { food: "تونة مسحورة", amount: "150 جم", calories: cals },
      { food: "سلطة", amount: "طبق", calories: 80 },
    ],
  });

  it("valid alternatives pass through with RECOMPUTED totals (the paid feature is alive)", () => {
    // goodMeal("الفطور", 200) → primary total = 200 + 260 + 80 = 540;
    // the ±10% band (GAP-21) is [486, 594] — 530 and 500 ride.
    const plan = {
      meals: [
        { ...goodMeal("الفطور", 200), meal_alternatives: [alt("بديل الفطور", 450), alt("بديل ثانٍ", 420)] },
        goodMeal("الغداء", 300),
        goodMeal("العشاء", 250),
      ],
    };
    const v = validateNutritionPlanAIOutput(plan, 2000);
    expect(v.ok).toBe(true);
    if (v.ok) {
      const alts = v.value.meals[0].meal_alternatives;
      expect(alts).toBeDefined();
      expect(alts!).toHaveLength(2);
      // totals recomputed from items — the model's own numbers never trusted
      expect(alts![0].total_calories).toBe(450 + 80);
      expect(alts![1].total_calories).toBe(420 + 80);
    }
  });

  it("capped at TWO per meal (owner directive #2) and more than 12 items per alternative are dropped", () => {
    const fat = { ...alt("بديل منتفخ", 450), items: Array.from({ length: 13 }, () => ({ food: "صنف", amount: "1 جم", calories: 50 })) };
    const plan = {
      meals: [
        { ...goodMeal("الفطور", 200), meal_alternatives: [alt("بديل 1", 450), alt("بديل 2", 420), alt("بديل 3", 430), fat] },
        goodMeal("الغداء", 300),
        goodMeal("العشاء", 250),
      ],
    };
    const v = validateNutritionPlanAIOutput(plan, 2000);
    expect(v.ok).toBe(true);
    if (v.ok) {
      const alts = v.value.meals[0].meal_alternatives;
      expect(alts!).toHaveLength(2); // the third + the malformed one never ship
      expect(alts!.every((a) => a.items.length <= 12)).toBe(true);
    }
  });

  it("a violating alternative (forbidden token) is DROPPED, the plan still passes", () => {
    // keto-clean primary meals (goodMeal carries rice — keto-forbidden —
    // so this fixture swaps the starch side for a keto-safe one).
    const ketoMeal = (name: string, cals: number) => ({
      name,
      items: [
        { food: "صدور دجاج مشوية", amount: "150 جم", calories: cals, protein_g: 45, fat_g: 8 },
        { food: "بيض مسلق", amount: "حبة", calories: 70, protein_g: 6, fat_g: 5 },
        { food: "سلطة خضراء", amount: "طبق", calories: 80 },
      ],
    });
    // ketoMeal("الفطور", 200) → primary total 350; the ±10% band (GAP-21)
    // is [315, 385] — the good alternative totals 240 + 80 = 320 and rides.
    const badAlt = {
      name: "بديل مخالف",
      items: [{ food: "أرز أبيض", amount: "200 جم", calories: 260 }],
    };
    const goodAlt = {
      name: "بديل سليم",
      items: [
        { food: "تونة مسحورة", amount: "150 جم", calories: 240, protein_g: 40, fat_g: 2 },
        { food: "سلطة خضراء", amount: "طبق", calories: 80 },
      ],
    };
    const plan = {
      meals: [
        { ...ketoMeal("الفطور", 200), meal_alternatives: [goodAlt, badAlt] },
        ketoMeal("الغداء", 300),
        ketoMeal("العشاء", 250),
      ],
    };
    // keto constraints: rice is a forbidden token class for a keto plan —
    // the PRIMARY meals are clean, only the second alternative violates.
    // meals sum 1200 kcal — a keto-cut target that stays inside ±25%
    const v = validateNutritionPlanAIOutput(plan, 1400, undefined, { dietType: "keto" });
    expect(v.ok).toBe(true);
    if (v.ok) {
      const alts = v.value.meals[0].meal_alternatives!;
      expect(alts).toHaveLength(1);
      expect(alts[0].name).toBe("بديل سليم");
    }
  });
});

/* ── GAP-21 (S4-1/NUT-1 live 2026-11-17, plan a2fc0c91): the ±10%
 * calorie-equivalence gate for whole-meal alternatives — the prompt always
 * promised «حصة سعرات مكافئة ±10%» but NOTHING checked it; the live plan
 * shipped a 1257-kcal substitute for a 345-kcal meal (+264%) and a
 * 100-kcal one for a 365-kcal meal (−73%). These canaries pin the gate
 * law on both sides of the band and every edge case. ── */

describe("GAP-21 — meal_alternatives calorie equivalence (±10%)", () => {
  /** A single-protein meal priced at `cals` (items ≥1 kcal each). */
  const mealOf = (name: string, cals: number) => ({
    name,
    items: [
      { food: "صدور دجاج مشوية", amount: "200 جم", calories: cals, protein_g: 40 },
      { food: "سلطة خضراء", amount: "طبق", calories: 40 },
    ],
  });
  const altOf = (name: string, cals: number) => ({
    name,
    items: [{ food: "سمك مشوي", amount: "180 جم", calories: cals, protein_g: 38 }],
  });
  const planWith = (altCals: number[]) => ({
    meals: [
      // primary total = 345 + 40 = 385 (the live incident's meal class)
      { ...mealOf("الفطور", 345), meal_alternatives: altCals.map((c, i) => altOf(`بديل ${i + 1}`, c)) },
      mealOf("الغداء", 500),
      mealOf("العشاء", 450),
    ],
  });

  it("alternativeCaloriesEquivalent — the pure ±10% verdict, edge cases included", () => {
    // exactly ±10.0% passes on both sides
    expect(alternativeCaloriesEquivalent(500, 550)).toBe(true);
    expect(alternativeCaloriesEquivalent(500, 450)).toBe(true);
    // one kcal beyond the band fails
    expect(alternativeCaloriesEquivalent(500, 551)).toBe(false);
    expect(alternativeCaloriesEquivalent(500, 449)).toBe(false);
    // the live incident's magnitudes
    expect(alternativeCaloriesEquivalent(345, 1257)).toBe(false);
    expect(alternativeCaloriesEquivalent(365, 100)).toBe(false);
    // missing / unpriceable values can never prove equivalence
    expect(alternativeCaloriesEquivalent(0, 500)).toBe(false);
    expect(alternativeCaloriesEquivalent(500, 0)).toBe(false);
    expect(alternativeCaloriesEquivalent(Number.NaN, 500)).toBe(false);
    expect(alternativeCaloriesEquivalent(500, Number.NaN)).toBe(false);
  });

  it("an in-band substitute rides, an out-of-band one is DROPPED (the live incident class)", () => {
    // primary 385 → band [346.5, 423.5]: 420 rides, 1257 and 100 drop.
    const v = validateNutritionPlanAIOutput(planWith([1257, 420, 100]), 1600);
    expect(v.ok).toBe(true);
    if (v.ok) {
      const alts = v.value.meals[0].meal_alternatives!;
      expect(alts).toHaveLength(1);
      expect(alts[0].total_calories).toBe(420);
      expect(Math.abs(alts[0].total_calories - 385) / 385).toBeLessThanOrEqual(0.1);
    }
  });

  it("boundary values: exactly ±10% rides, one kcal beyond drops", () => {
    // primary 385 → 10% = 38.5 → band [346.5, 423.5] → integers 347..423.
    const pass = validateNutritionPlanAIOutput(planWith([423, 347]), 1600);
    expect(pass.ok).toBe(true);
    if (pass.ok) expect(pass.value.meals[0].meal_alternatives!).toHaveLength(2);
    const failHigh = validateNutritionPlanAIOutput(planWith([424]), 1600);
    expect(failHigh.ok).toBe(true);
    if (failHigh.ok) expect(failHigh.value.meals[0].meal_alternatives).toBeUndefined();
    const failLow = validateNutritionPlanAIOutput(planWith([346]), 1600);
    expect(failLow.ok).toBe(true);
    if (failLow.ok) expect(failLow.value.meals[0].meal_alternatives).toBeUndefined();
  });

  it("a substitute with missing/zero-priced items never ships (normalizeAIItem rejects, then the equivalence gate)", () => {
    const broken = {
      name: "بديل بلا سعرات",
      items: [{ food: "سمك مشوي", amount: "180 جم", calories: 0 }],
    };
    const v = validateNutritionPlanAIOutput({ meals: [{ ...mealOf("الفطور", 345), meal_alternatives: [broken] }, mealOf("الغداء", 500), mealOf("العشاء", 450)] }, 1600);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.meals[0].meal_alternatives).toBeUndefined();
  });
});

/* ── REGEN-RELIABILITY 2026-10-24 (owner order item 2 — the LIVE measured
 * failure classes from GHA run 40091765755 on the deployed c0900c31):
 * the gate rejected perfectly good payloads twice and food_item_regenerate
 * job #ce03e09f failed PERMANENTLY over them. These canaries pin the two
 * compat laws that make regeneration actually succeed:
 *   (a) Arabic-Indic/Persian digit strings are real numbers ("٢٥٠" = 250
 *       — the old \d strip deleted every glyph → "calories outside
 *       1-2000" rejections);
 *   (b) wrapper shapes ({item:{…}} / {replacement:{…}} — the 16-token
 *       gemini payloads) carry the same data at one level of nesting —
 *       "item has no food name" rejections died with the unwrap. */
describe("REGEN-RELIABILITY — Arabic-Indic/Persian digit coercion (the live rejection class)", () => {
  it("Arabic-Indic digits parse as numbers", () => {
    expect(coerceNumber("٢٥٠")).toBe(250);
    expect(coerceNumber("١٢٣٤")).toBe(1234);
    expect(coerceNumber("٢٥٠ سعرة")).toBe(250);
    expect(coerceNumber("٣٠.٥")).toBe(30.5);
  });

  it("Persian digits parse as numbers", () => {
    expect(coerceNumber("۴۵۰")).toBe(450);
    expect(coerceNumber("۲۰۰ گرم")).toBe(200);
  });

  it("mixed Latin + Arabic-Indic digits parse", () => {
    expect(coerceNumber("1٢٣")).toBe(123);
  });

  it("the old behaviors stay: Latin strings, numbers, and the Arabic decimal separator", () => {
    expect(coerceNumber("230")).toBe(230);
    expect(coerceNumber(230)).toBe(230);
    expect(coerceNumber("23٫5")).toBe(23.5);
    expect(coerceNumber("abc")).toBeNull();
    expect(coerceNumber("")).toBeNull();
  });

  it("an item whose calories came as Arabic-Indic digits now PASSES the item gate", () => {
    const v = normalizeAIItem({
      food: "صدر دجاج مشوي بالأعشاب",
      amount: "150 جم",
      calories: "٢٥٠",
    });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.calories).toBe(250);
  });

  it("validateRegeneratedFoodItem accepts an Arabic-numeral replacement inside ±15%", () => {
    const verdict = validateRegeneratedFoodItem(
      { food: "تونة في الماء", amount: "150 جم", calories: "٢٠٥" },
      200,
      null,
    );
    expect(verdict.ok).toBe(true);
  });
});

describe("REGEN-RELIABILITY — wrapper-shape unwrap (the live 16-token payload class)", () => {
  const flat = { food: "تونة في الماء", amount: "150 جم", calories: 205 };

  it("a flat item still passes as before (no behavior change on the happy path)", () => {
    const v = normalizeAIItem(flat);
    expect(v.ok).toBe(true);
  });

  it("{item:{…}} unwraps and passes", () => {
    const v = normalizeAIItem({ item: flat });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.food).toBe("تونة في الماء");
  });

  it("{replacement:{…}} unwraps and passes", () => {
    const v = normalizeAIItem({ replacement: flat });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.calories).toBe(205);
  });

  it("{food_item:{…}} and {new_item:{…}} unwrap too", () => {
    expect(normalizeAIItem({ food_item: flat }).ok).toBe(true);
    expect(normalizeAIItem({ new_item: flat }).ok).toBe(true);
  });

  it("a TOP-LEVEL name still wins over any wrapper key (no false unwrap)", () => {
    const v = normalizeAIItem({ name: "بيض مسلوق", amount: "2 بيضة", calories: 150, item: { food: "other" } });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.value.food).toBe("بيض مسلوق");
  });

  it("validateRegeneratedFoodItem accepts the WRAPPED shape the providers actually returned", () => {
    const verdict = validateRegeneratedFoodItem(
      { replacement: { food: "جبن قريش", amount: "200 جم", calories: 190 } },
      200,
      null,
    );
    expect(verdict.ok).toBe(true);
    if (verdict.ok) expect(verdict.value.food).toBe("جبن قريش");
  });

  it("garbage still rejects honestly — the unwrap is not a loophole", () => {
    expect(normalizeAIItem({ item: "مجرد نص" }).ok).toBe(false);
    expect(normalizeAIItem({ replacement: { amount: "100 جم", calories: 200 } }).ok).toBe(false);
    expect(normalizeAIItem({ item: null }).ok).toBe(false);
  });

  it("arrays never unwrap (an items array is not a wrapped item)", () => {
    expect(normalizeAIItem([flat]).ok).toBe(false);
  });
});
