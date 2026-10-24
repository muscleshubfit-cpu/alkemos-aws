import { describe, it, expect } from "vitest";
import { applyMemberSwapToContent } from "@/lib/member-swap-apply";

/**
 * AI-PLAN-QUALITY 2026-10-24 (owner order items 4+5): the member-side
 * apply gate. The OLD PlansView code spliced the raw job result into the
 * saved plan unvalidated and never recomputed totals — a null payload
 * corrupted the row, a drifted meal sat under the OLD calorie card, and
 * string calories poisoned every sum. These tests pin the new law.
 */

const plan = () => ({
  overview: "خطة",
  daily_calories: 1000,
  meals_total_calories: 1000,
  macros: { protein_g: 50, carbs_g: 100, fat_g: 30, protein_cal: 200, carbs_cal: 400, fat_cal: 270 },
  meals: [
    {
      name: "الفطور",
      items: [
        { food: "شوفان", amount: "60 جم", calories: 220, protein_g: 8, carbs_g: 30, fat_g: 4 },
        { food: "موزة", amount: "1", calories: 100, carbs_g: 25 },
      ],
      total_calories: 320,
      total_protein_g: 8,
      total_carbs_g: 55,
      total_fat_g: 4,
    },
    {
      name: "العشاء",
      items: [{ food: "دجاج", amount: "200 جم", calories: 400, protein_g: 60, carbs_g: 0, fat_g: 10 }],
      total_calories: 400,
      total_protein_g: 60,
      total_carbs_g: 0,
      total_fat_g: 10,
    },
  ],
});

const replacementMeal = {
  name: "فطور بديل",
  items: [
    { food: "بيض", amount: "3 بيضات", calories: 210, protein_g: 18 },
    { food: "خبز أسمر", amount: "رغيف", calories: 140, carbs_g: 28 },
  ],
};

describe("applyMemberSwapToContent — meal kind", () => {
  it("applies a valid replacement and RECOMPUTES the whole plan's totals", () => {
    const content = plan();
    const res = applyMemberSwapToContent(content, "meal", 0, undefined, replacementMeal);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const c = res.content as Record<string, unknown> & {
      meals: Array<{ name: string; total_calories: number; items: Array<{ calories: number }> }>;
      daily_calories: number;
      meals_total_calories: number;
      macros: { protein_g: number; carbs_g: number; fat_g: number };
    };
    expect(c.meals[0].name).toBe("فطور بديل");
    expect(c.meals[0].total_calories).toBe(350);
    expect(c.meals[0].items[0].calories).toBe(210);
    // CALORIE-TARGET 2026-10-24: the header card reads the ACTUAL
    // (meals_total_calories — it updates on every swap); daily_calories is
    // the plan's TARGET and SURVIVES the swap (displayCalories picks the
    // actual first).
    expect(c.meals_total_calories).toBe(750);
    expect(c.macros.protein_g).toBe(78); // 18 + 60
    expect(c.macros.carbs_g).toBe(28);
    expect(c.macros.fat_g).toBe(10);
  });

  it("coerces string calories in the replacement (no string poisoning)", () => {
    const res = applyMemberSwapToContent(plan(), "meal", 0, undefined, {
      name: "بديل",
      items: [
        { food: "بيض", amount: "3", calories: "210" },
        { food: "خبز", amount: "رغيف", calories: "140" },
      ],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const c = res.content as { daily_calories: number; meals_total_calories: number };
    expect(c.meals_total_calories).toBe(750);
    expect(typeof c.meals_total_calories).toBe("number");
  });

  it("REJECTS shapeless payloads without touching the plan (the old corruption bug)", () => {
    for (const bad of [null, undefined, {}, { items: [] }, "meal", 42, { items: [{ food: "", calories: 100 }] }, { items: [{ food: "x", calories: 0 }] }, { items: [{ food: "x", calories: 9999 }] }]) {
      const res = applyMemberSwapToContent(plan(), "meal", 0, undefined, bad);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error.length).toBeGreaterThan(0);
    }
  });

  it("rejects an out-of-range meal index", () => {
    expect(applyMemberSwapToContent(plan(), "meal", 9, undefined, replacementMeal).ok).toBe(false);
    expect(applyMemberSwapToContent(plan(), "meal", -1, undefined, replacementMeal).ok).toBe(false);
  });
});

describe("applyMemberSwapToContent — exercise kind", () => {
  const workoutContent = () => ({
    overview: "برنامج",
    days: [
      {
        day: "السبت",
        focus: "صدر",
        isRest: false,
        exercises: [
          { name: "Bench Press", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
          { name: "Cable Fly", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
        ],
      },
    ],
  });

  it("applies a valid substitute and coerces its numbers", () => {
    const res = applyMemberSwapToContent(workoutContent(), "exercise", 0, 1, {
      name: "Dumbbell Fly",
      sets: "3",
      reps: "12-15",
      rest: "45 ثانية",
      notes: "تحكم في النزول",
      exerciseSlug: "dumbbell-fly",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const c = res.content as { days: Array<{ exercises: Array<{ name: string; sets: number; reps: string }> }> };
    expect(c.days[0].exercises[1].name).toBe("Dumbbell Fly");
    expect(c.days[0].exercises[1].sets).toBe(3);
    expect(c.days[0].exercises[0].name).toBe("Bench Press"); // untouched
  });

  it("rejects a nameless substitute without touching the plan", () => {
    const res = applyMemberSwapToContent(workoutContent(), "exercise", 0, 1, { sets: 3 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.length).toBeGreaterThan(0);
  });

  it("rejects bad day/exercise indices", () => {
    expect(applyMemberSwapToContent(workoutContent(), "exercise", 5, 0, { name: "X" }).ok).toBe(false);
    expect(applyMemberSwapToContent(workoutContent(), "exercise", 0, 9, { name: "X" }).ok).toBe(false);
  });
});

describe("applyMemberSwapToContent — legacy plans", () => {
  it("recomputes over a legacy plan whose old totals were strings", () => {
    const legacy = {
      daily_calories: "1000",
      meals: [
        {
          name: "أ",
          items: [
            { food: "شوفان", amount: "60 جم", calories: "220" },
            { food: "موزة", amount: "1", calories: "100" },
          ],
          total_calories: "320",
        },
        {
          name: "ب",
          items: [{ food: "دجاج", amount: "200 جم", calories: "400" }],
          total_calories: "400",
        },
      ],
    };
    const res = applyMemberSwapToContent(legacy, "meal", 0, undefined, replacementMeal);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const c = res.content as { daily_calories: number; meals_total_calories: number };
    // The legacy string target "1000" is COERCED to the number 1000 and
    // preserved as the target; the actual (750) rides meals_total_calories.
    expect(c.daily_calories).toBe(1000);
    expect(c.meals_total_calories).toBe(750);
    expect(typeof c.daily_calories).toBe("number");
    expect(typeof c.meals_total_calories).toBe("number");
  });
});
