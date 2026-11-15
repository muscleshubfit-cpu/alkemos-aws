import { describe, it, expect } from "vitest";
import {
  checkItemConstraints,
  constraintsTextViolation,
  halalFoodViolation,
  dayBudgetClosureViolation,
  validateNutritionPlanAIOutput,
  validateRegeneratedMeal,
  validateWorkoutPlanAIOutput,
  buildClientConstraints,
  PLAN_AI_SANITY,
} from "@/lib/plan-ai-validation";

/**
 * P1 canaries (audit AI-GENERATION-PIPELINES-2026-11-15) — the nutrition
 * gates: NUT-4 (global halal), NUT-8 (false-positive fixes), NUT-7
 * (free-text surfaces), NUT-2 (macro↔calorie closure constants), NUT-6
 * (day-budget closure after swaps) and WOR-5 (training-day anchor).
 */

const okMeal = (cals: number) => ({
  name: "الغداء",
  items: [
    { food: "صدور دجاج مشوية", amount: "150 جم", calories: Math.round(cals * 0.6), protein_g: 40 },
    { food: "أرز أبيض", amount: "200 جم", calories: Math.round(cals * 0.4), protein_g: 8 },
  ],
  total_calories: 0,
});

describe("NUT-4 — the GLOBAL halal gate (every diet, balanced included)", () => {
  it("pork tokens are rejected with NO constraints at all (balanced)", () => {
    expect(checkItemConstraints("لحم خنزير مشوي", {}, null)).toContain("الحلال");
    expect(checkItemConstraints("Bacon strips", {}, null)).toContain("الحلال");
    expect(checkItemConstraints("ham sandwich", {}, null)).toContain("الحلال");
  });

  it("alcohol tokens are rejected (wine / نبيذ / beer / rum / كحول)", () => {
    expect(checkItemConstraints("كأس نبيذ أحمر", {}, null)).toContain("الحلال");
    expect(checkItemConstraints("wine glass", {}, null)).toContain("الحلال");
    expect(checkItemConstraints(" rum cake ", {}, null)).toContain("الحلام".slice(0, 0) + "الحلال");
    // Non-alcoholic beer wording still blocks — the platform stance is
    // conservative: «بيرة» is a forbidden token BY NAME (the parenthetical
    // alcohol-free claim never legitimizes the beer family).
    expect(checkItemConstraints("بيرة بدون كحول (خالٍ من الكحول)", {}, null)).toContain("الحلال");
  });

  it("the exceptions hold: turkey bacon + cooking vinegar pass", () => {
    expect(checkItemConstraints("بيكون رومي (غير محضر)", {}, null)).toBeNull();
    expect(checkItemConstraints("Turkey bacon, unprepared", {}, null)).toBeNull();
    expect(checkItemConstraints("خل النبيذ", {}, null)).toBeNull();
    expect(checkItemConstraints("white wine vinegar", {}, null)).toBeNull();
  });

  it("the bacon exception does NOT leak into the vegetarian diet (turkey bacon is meat)", () => {
    const vegetarian = buildClientConstraints({ dietType: "vegetarian" });
    expect(checkItemConstraints("بيكون رومي", {}, vegetarian)).toContain("النباتي");
    expect(checkItemConstraints("Turkey bacon", {}, vegetarian)).toContain("النباتي");
  });

  it("substring collisions are suppressed: baking powder + Pekin duck + رومي", () => {
    expect(halalFoodViolation("بيكنج بودر ثنائي التفاعل")).toBeNull();
    expect(halalFoodViolation("صدر بجعة صغيرة (بيكن) مشوي")).toBeNull();
    expect(halalFoodViolation("صدور ديك رومي")).toBeNull();
  });

  it("the halal gate rides the FULL plan gate (a pork item fails the plan)", () => {
    const plan = {
      meals: [
        okMeal(600),
        { name: "العشاء", items: [{ food: "شرائح بيكون", amount: "50 جم", calories: 200 }], total_calories: 200 },
        { name: "سناك", items: [{ food: "تفاحة", amount: "1", calories: 80 }], total_calories: 80 },
      ],
    };
    const v = validateNutritionPlanAIOutput(plan, 1000);
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.error).toContain("الحلال");
  });

  it("the halal gate rides the MEAL-swap gate", () => {
    const meal = {
      meal: { name: "العشاء", items: [{ food: "لحم خنزير", amount: "100 جم", calories: 300 }] },
    };
    const v = validateRegeneratedMeal(meal, 300);
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.error).toContain("الحلال");
  });
});

describe("NUT-8 — false-positive fixes", () => {
  it("«بلح البحر» (mussels) no longer fires the keto «بلح» (dates) token", () => {
    const keto = buildClientConstraints({ dietType: "keto" });
    expect(checkItemConstraints("بلح البحر مطبوخ", { carbs_g: 7 }, keto)).toBeNull();
    // the real date still blocks
    expect(checkItemConstraints("بلح مجفف", { carbs_g: 70 }, keto)).toContain("الكيتو");
  });

  it("«برجر نباتي» passes vegetarian (plant-based guard on meat tokens)", () => {
    const vegetarian = buildClientConstraints({ dietType: "vegetarian" });
    expect(checkItemConstraints("برجر نباتي بالعدس", {}, vegetarian)).toBeNull();
    expect(checkItemConstraints("سجق نباتي", {}, vegetarian)).toBeNull();
    // real meat still blocks
    expect(checkItemConstraints("برجر لحم", {}, vegetarian)).toContain("النباتي");
    expect(checkItemConstraints("beef burger", {}, vegetarian)).toContain("النباتي");
  });

  it("mozzarella keeps passing keto (the FRAME-443 exception is untouched)", () => {
    const keto = buildClientConstraints({ dietType: "keto" });
    expect(checkItemConstraints("جبن موزاريلا", { carbs_g: 2 }, keto)).toBeNull();
  });
});

describe("NUT-7 — free-text surfaces (alternatives / notes / suggestions)", () => {
  it("an item's alternatives mentioning a forbidden food reject the plan", () => {
    const plan = {
      meals: [
        okMeal(600),
        {
          name: "العشاء",
          items: [
            { food: "زبادي يوناني", amount: "200 جم", calories: 150, alternatives: "أو 2 ملاعق زبدة فول سوداني" },
          ],
          total_calories: 150,
        },
        { name: "سناك", items: [{ food: "خيار", amount: "2", calories: 30 }], total_calories: 30 },
      ],
    };
    const nutAllergy = buildClientConstraints({ allergyText: "مكسرات" });
    const v = validateNutritionPlanAIOutput(plan, 900, null, nutAllergy);
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.error).toContain("حساسيات");
  });

  it("keto alternatives suggesting oats reject the plan", () => {
    const plan = {
      meals: [
        okMeal(600),
        { name: "العشاء", items: [{ food: "جبن قريش", amount: "100 جم", calories: 100, alternatives: "أو 50 جم شوفان مطبوخ" }], total_calories: 100 },
        { name: "سناك", items: [{ food: "بيض مسلوق", amount: "1", calories: 80 }], total_calories: 80 },
      ],
    };
    const keto = buildClientConstraints({ dietType: "keto" });
    const v = validateNutritionPlanAIOutput(plan, 800, null, keto);
    expect(v.ok).toBe(false);
  });

  it("haram mentions in meal notes reject the plan (every diet)", () => {
    const plan = {
      meals: [
        okMeal(600),
        { name: "العشاء", items: [{ food: "سمك مشوي", amount: "200 جم", calories: 300 }], total_calories: 300, notes: "يمكن رشه بقليل من النبيذ الأحمر" },
        { name: "سناك", items: [{ food: "جزر", amount: "1", calories: 30 }], total_calories: 30 },
      ],
    };
    const v = validateNutritionPlanAIOutput(plan, 950);
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.error).toContain("الحلال");
  });

  it("advice-style notes never false-fire (negation/avoidance clauses stripped)", () => {
    expect(constraintsTextViolation("تجنب الأرز والأكل المقلي", buildClientConstraints({ dietType: "keto" }))).toBeNull();
    expect(constraintsTextViolation("بدون سكر مضاف تمامًا", buildClientConstraints({ dietType: "keto" }))).toBeNull();
    // a real suggestion still fires
    expect(constraintsTextViolation("أو كوب عصير برتقال طازج", buildClientConstraints({ dietType: "keto" }))).toContain("عصير");
  });
});

describe("NUT-2 — macro↔calorie closure constants", () => {
  it("the closure band is ±10%", () => {
    expect(PLAN_AI_SANITY.macroClosureTolerance).toBe(0.1);
  });
});

describe("NUT-6 — day-budget closure after swaps", () => {
  it("a swap pushing the day past ±25% of daily_calories is a named violation", () => {
    expect(dayBudgetClosureViolation(2000, 2600)).toContain("ميزانية اليوم");
    expect(dayBudgetClosureViolation(2000, 1400)).toContain("ميزانية اليوم");
  });

  it("in-band and anchor-less cases pass (honest skip)", () => {
    expect(dayBudgetClosureViolation(2000, 2300)).toBeNull();
    expect(dayBudgetClosureViolation(2000, 1800)).toBeNull();
    expect(dayBudgetClosureViolation(undefined, 2300)).toBeNull();
    expect(dayBudgetClosureViolation(0, 2300)).toBeNull();
  });

  it("string numbers coerce (legacy plans)", () => {
    expect(dayBudgetClosureViolation("2000" as unknown as number, 2600)).toContain("ميزانية اليوم");
  });
});

describe("WOR-5 — the training-day anchor", () => {
  const plan = (trainingDays: number) => ({
    days: Array.from({ length: 7 }, (_, i) =>
      i < trainingDays
        ? { day: `يوم ${i + 1}`, focus: "تدريب", isRest: false, exercises: [
            { name: "Barbell Squat", sets: 4, reps: "8", rest: "90s", notes: "" },
            { name: "Leg Press", sets: 3, reps: "10", rest: "90s", notes: "" },
            { name: "Plank", sets: 3, reps: "45s", rest: "60s", notes: "" },
          ] }
        : { day: `يوم ${i + 1}`, focus: "راحة", isRest: true, exercises: [] },
    ),
  });

  it("the requested training-day count is enforced (6 asked, 3 given → rejection)", () => {
    const v = validateWorkoutPlanAIOutput(plan(3), 6);
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.error).toContain("6");
  });

  it("an exact match passes", () => {
    const v = validateWorkoutPlanAIOutput(plan(6), 6);
    expect(v.ok).toBe(true);
  });

  it("no anchor keeps the legacy behavior (shape bounds only)", () => {
    const v = validateWorkoutPlanAIOutput(plan(3));
    expect(v.ok).toBe(true);
  });
});
