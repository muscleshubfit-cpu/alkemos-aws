import { describe, it, expect } from "vitest";
import {
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
