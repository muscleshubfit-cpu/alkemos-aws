import { describe, it, expect } from "vitest";
import {
  computeNutritionTargets,
  computeMacrosForDiet,
  detectGoalAdjustmentPct,
  classifyDietText,
  DIET_TYPES,
} from "@/lib/plan-generator";
import type { ClientContext } from "@/lib/ai-local";

/**
 * NOTIF→PLAN 2026-10-24 (owner order items 4+5+7) — the nutrition-math
 * battery. THE headline case is the LIVE incident re-derived from the
 * production row (plan 9bdd901f, «خطة تغذية - Samar samy», 2026-10-23):
 * the client's goal read «تحسين الصحه خساره الوزن» and the old goal
 * regex only knew «خسارة وزن» with the tied-تاء — so the −20% deficit
 * NEVER fired, daily_calories landed on raw TDEE 2905 while the plan's
 * own overview text promised 2320. Every number below is the real
 * questionnaire data, and the assertions pin the corrected math.
 */

const ctxOf = (over: Partial<{
  nutrition: Record<string, unknown>;
  fitness: Record<string, unknown>;
}> = {}): ClientContext => ({
  name: "Samar samy",
  nutrition: {
    gender: "female",
    weight: "132.5",
    height: "179",
    age: "34",
    target_weight: "100",
    meals: "3",
    diet: "كيتو",
    allergies: "اوقات الجبن والعيش",
    disliked: "مفيش",
    ...over.nutrition,
  },
  fitness: {
    days: "2",
    goal: "تحسين الصحه خساره الوزن",
    activity: "light",
    ...over.fitness,
  },
  recent_measurements: [],
  recent_plan_names: [],
});

/** |P·4 + C·4 + F·9 − daily| must stay small (rounding only). */
const macroKcalGap = (m: { protein_g: number; carbs_g: number; fat_g: number }, daily: number) =>
  Math.abs(m.protein_g * 4 + m.carbs_g * 4 + m.fat_g * 9 - daily);

describe("THE live incident — goal detection with Arabic spelling drift (item 5 root cause)", () => {
  it("fires the −20% deficit for «تحسين الصحه خساره الوزن» (was silently 0% before the fix)", () => {
    const t = computeNutritionTargets(ctxOf());
    expect(t.goalAdjustmentPct).toBe(-20);
  });

  it("reproduces the production numbers exactly: BMR 2113 · TDEE 2905 · target 2324 (not 2905)", () => {
    const t = computeNutritionTargets(ctxOf());
    expect(t.bmr).toBe(2113);
    expect(t.tdee).toBe(2905);
    expect(t.dailyCalories).toBe(2324); // 2905 × 0.8 — the deficit the plan text promised
  });

  it("classifies the questionnaire's «كيتو» into the keto macro policy (carbs ≤ 50g, not 279g)", () => {
    const t = computeNutritionTargets(ctxOf());
    expect(t.dietType).toBe("keto");
    expect(t.macros.carbs_g).toBeLessThanOrEqual(50);
    expect(t.macros.carbs_g).toBeGreaterThanOrEqual(20);
    // The live row shipped P265/C279/F81 — 279g of carbs for a keto client
    // was the category error; the protein law (2g/kg) stays.
    expect(t.macros.protein_g).toBe(265);
  });

  it("keeps macro kcal math consistent with the daily target (P4/C4/F9)", () => {
    const t = computeNutritionTargets(ctxOf());
    expect(macroKcalGap(t.macros, t.dailyCalories)).toBeLessThanOrEqual(40);
  });
});

describe("goal-text spelling variants (item 5)", () => {
  const cases: Array<[string, number]> = [
    ["خساره الوزن", -20], // the live spelling (هاء)
    ["خسارة وزن", -20], // the old regex's only form (تاء مربوطة)
    ["عايز أنقص وزني", -20],
    ["تنزيل وزن", -20],
    ["تخسيس", -20],
    ["تنحيف", -20],
    ["حرق الدهون", -20],
    ["weight loss", -20],
    ["lose fat", -20],
    ["بناء عضل", 10],
    ["زيادة الوزن", 10],
    ["muscle gain", 10],
    ["تحسين الصحة العامة", 0], // genuinely neutral
  ];
  for (const [goal, expected] of cases) {
    it(`«${goal}» → ${expected}%`, () => {
      expect(detectGoalAdjustmentPct(goal, 80, null)).toBe(expected);
    });
  }
});

describe("target-weight signal (the second, independent goal detector)", () => {
  it("target 100 vs current 132.5 → −20% even with a neutral goal text", () => {
    expect(detectGoalAdjustmentPct("", 132.5, 100)).toBe(-20);
    expect(detectGoalAdjustmentPct("تحسين الصحة العامة", 132.5, 100)).toBe(-20);
  });
  it("target above current → +10%", () => {
    expect(detectGoalAdjustmentPct("", 60, 75)).toBe(10);
  });
  it("target within ±2kg → maintenance (0%)", () => {
    expect(detectGoalAdjustmentPct("", 80, 81)).toBe(0);
  });
  it("an explicit fat-loss goal wins over a gain-ish target field", () => {
    expect(detectGoalAdjustmentPct("خسارة دهون", 80, 95)).toBe(-20);
  });
});

describe("diet-aware macro policy (item 4)", () => {
  it("keto: carbs clamped into [20g, 50g] and kcal-consistent", () => {
    for (const daily of [1500, 2000, 2324, 3000]) {
      const m = computeMacrosForDiet("keto", daily, 80);
      expect(m.carbs_g).toBeGreaterThanOrEqual(20);
      expect(m.carbs_g).toBeLessThanOrEqual(50);
      expect(macroKcalGap(m, daily)).toBeLessThanOrEqual(40);
    }
  });
  it("low_carb: carbs ≈ 25% of kcal", () => {
    const m = computeMacrosForDiet("low_carb", 2000, 80);
    expect(m.carbs_g).toBeGreaterThanOrEqual(50);
    expect(Math.abs(m.carbs_g - (2000 * 0.25) / 4)).toBeLessThanOrEqual(2);
    expect(macroKcalGap(m, 2000)).toBeLessThanOrEqual(40);
  });
  it("balanced (default): fat 25% of kcal, carbs the remainder — the pre-fix policy unchanged", () => {
    const m = computeMacrosForDiet("balanced", 2324, 132.5);
    expect(m.fat_g).toBe(Math.round((2324 * 0.25) / 9));
    expect(macroKcalGap(m, 2324)).toBeLessThanOrEqual(40);
  });
  it("coach macros always win over every policy", () => {
    const coach = { protein_g: 180, carbs_g: 200, fat_g: 70 };
    expect(computeMacrosForDiet("keto", 2500, 100, coach)).toEqual(coach);
  });
  it("classifyDietText maps the real questionnaire spellings", () => {
    expect(classifyDietText("كيتو")).toBe("keto");
    expect(classifyDietText("Keto")).toBe("keto");
    expect(classifyDietText("لو كارب")).toBe("low_carb");
    expect(classifyDietText("نباتي")).toBe("vegetarian");
    expect(classifyDietText("نباتي صرف")).toBe("vegan");
    expect(classifyDietText("متوازن")).toBe("balanced");
    expect(classifyDietText("")).toBe("balanced");
    expect(classifyDietText("أكل عادي")).toBe("balanced");
  });
  it("the coach's explicit dietType override beats the questionnaire text", () => {
    const t = computeNutritionTargets(ctxOf(), { dietType: "low_carb" });
    expect(t.dietType).toBe("low_carb");
    expect(t.macros.carbs_g).toBeGreaterThan(50);
  });
  it("DIET_TYPES carries exactly the five families", () => {
    expect([...DIET_TYPES]).toEqual(["balanced", "keto", "low_carb", "vegetarian", "vegan"]);
  });
});

describe("plausibility flags + calorie floor (item 5 — أوقف الاعتماد واطلب مراجعة المدرب)", () => {
  it("flags missing basic data instead of presenting defaults as real", () => {
    const t = computeNutritionTargets({
      nutrition: {},
      fitness: { goal: "", activity: "" },
    });
    expect(t.reviewFlags).toContain("missing_or_implausible_weight");
    expect(t.reviewFlags).toContain("missing_or_implausible_height");
    expect(t.reviewFlags).toContain("missing_or_implausible_age");
    expect(t.reviewFlags).toContain("missing_gender");
  });
  it("no flags for complete, ordinary data", () => {
    const t = computeNutritionTargets(ctxOf());
    expect(t.reviewFlags).toEqual([]);
  });
  it("applies + flags the 1200 kcal floor", () => {
    // Tiny client + sedentary + hard deficit → under the floor.
    const t = computeNutritionTargets(
      ctxOf({
        nutrition: { gender: "female", weight: "45", height: "150", age: "60", target_weight: "40" },
        fitness: { goal: "خسارة وزن", activity: "sedentary" },
      }),
    );
    expect(t.dailyCalories).toBe(1200);
    expect(t.reviewFlags).toContain("calorie_floor_applied");
  });
  it("flags a surplus beyond +15% of TDEE as extreme", () => {
    const t = computeNutritionTargets(ctxOf(), { targetCalories: 3500 });
    expect(t.reviewFlags).toContain("surplus_beyond_15pct");
  });
  it("coach targetCalories override still wins the daily number", () => {
    const t = computeNutritionTargets(ctxOf(), { targetCalories: 2100 });
    expect(t.dailyCalories).toBe(2100);
  });
  it("carries the target weight + allergy text for the deterministic overview", () => {
    const t = computeNutritionTargets(ctxOf());
    expect(t.targetWeightKg).toBe(100);
    expect(t.allergyText).toBe("اوقات الجبن والعيش");
    expect(t.dislikedText).toBe("مفيش");
  });
});

describe("macro/kcal consistency across realistic input edges (item 5 — حالات واقعية وأطراف المدخلات)", () => {
  const edges: Array<[string, string, string, string, string]> = [
    // [weight, height, age, activity, goal]
    ["45", "150", "60", "sedentary", "خسارة وزن"],
    ["60", "165", "25", "light", "بناء عضل"],
    ["80", "175", "35", "moderate", "صيانة"],
    ["110", "190", "28", "very active", "خسارة دهون"],
    ["132.5", "179", "34", "light", "تحسين الصحه خساره الوزن"],
  ];
  for (const [w, h, a, act, goal] of edges) {
    it(`${w}kg/${h}cm/${a}y/${act} → kcal-consistent macros`, () => {
      const t = computeNutritionTargets(
        ctxOf({
          nutrition: { gender: "male", weight: w, height: h, age: a, diet: "متوازن" },
          fitness: { goal, activity: act },
        }),
      );
      expect(t.dailyCalories).toBeGreaterThanOrEqual(1200);
      expect(t.dailyCalories).toBeLessThanOrEqual(6000);
      expect(macroKcalGap(t.macros, t.dailyCalories)).toBeLessThanOrEqual(40);
    });
  }
});
