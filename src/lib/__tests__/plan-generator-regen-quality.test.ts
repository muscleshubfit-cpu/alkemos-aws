import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * AI-PLAN-QUALITY 2026-10-24 (owner order items 2+4+5): the generation
 * and regeneration quality-contract battery. The provider chain is
 * MOCKED — these tests prove the ENGINE's behavior around the gate:
 *
 *   - a valid payload passes and is normalized (totals recomputed);
 *   - an invalid payload triggers EXACTLY ONE repair retry whose prompt
 *     names the rejection reason;
 *   - a second invalid payload → full plans fall back to the local
 *     generator with the visible review flag; regenerations THROW so the
 *     caller keeps the original element untouched;
 *   - the degenerate zero-calorie meal never reaches a provider call.
 */

const chainState = vi.hoisted(() => {
  const responses: Array<{ text: string; model: string; provider: string } | Error> = [];
  const prompts: string[] = [];
  return { responses, prompts };
});

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...actual,
    callFreeAIFallbackChain: vi.fn(async (prompt: string) => {
      chainState.prompts.push(prompt);
      const next = chainState.responses.shift();
      if (!next) throw new Error("no scripted response");
      if (next instanceof Error) throw next;
      return next;
    }),
  };
});

// Keep the 3.6MB FOODS array out of this battery — grounding behavior is
// covered by plan-food-grounding.test.ts against the real library.
vi.mock("@/lib/plan-food-grounding", () => ({
  groundItemToLibrary: () => null,
}));

import {
  generateNutritionPlanAI,
  generateWorkoutPlanAI,
  regenerateMeal,
  regenerateFoodItem,
  regenerateWorkoutDay,
} from "@/lib/plan-generator";
import type { ClientContext } from "@/lib/ai-local";

const ctx: ClientContext = {
  name: "عميل الاختبار",
  nutrition: {
    gender: "male",
    weight: "80",
    height: "180",
    age: "30",
    target_weight: "75",
    meals: "3",
    diet: "متوازن",
    allergies: "",
    disliked: "",
  },
  fitness: { days: "4", goal: "خسارة الوزن", activity: "متوسط" },
  recent_measurements: [],
  recent_plan_names: [],
};

/** A model meal that closes near `cals`. */
const modelMeal = (name: string, cals: number) => ({
  name,
  items: [
    { food: "شوفان", amount: "60 جم", calories: cals - 100, protein_g: 8 },
    { food: "زبادي", amount: "200 جم", calories: 100 },
  ],
  total_calories: 99999, // model lie — must be recomputed
});

const validNutritionPlan = (target: number) => {
  const per = Math.round(target / 3);
  return {
    overview: "نظرة عامة",
    data_analysis: {},
    daily_calories: 99999,
    macros: { protein_g: 999, carbs_g: 999, fat_g: 999 },
    meals: [modelMeal("الفطور", per), modelMeal("الغداء", per), modelMeal("العشاء", target - 2 * per)],
  };
};

beforeEach(() => {
  chainState.responses.length = 0;
  chainState.prompts.length = 0;
  vi.clearAllMocks();
});

describe("generateNutritionPlanAI — the gate + repair + fallback law", () => {
  it("accepts a coherent plan and ENFORCES the server's daily calories/macros", async () => {
    const targets = { daily: 2000 };
    chainState.responses.push({
      text: JSON.stringify(validNutritionPlan(targets.daily)),
      model: "test-model",
      provider: "groq",
    });
    const res = await generateNutritionPlanAI(ctx);
    expect(res.source).toBe("groq:test-model");
    const content = res.content as {
      daily_calories: number;
      meals_total_calories: number;
      macros: { protein_g: number };
      meals: Array<{ total_calories: number }>;
    };
    // The server-computed target (Mifflin: ~2000 for this ctx) wins over
    // the model's 99999, and every meal total is recomputed from items.
    expect(content.daily_calories).toBeLessThan(3000);
    expect(content.daily_calories).toBeGreaterThan(1200);
    expect(content.macros.protein_g).toBeLessThan(300);
    for (const m of content.meals) {
      expect(m.total_calories).toBeLessThan(99999);
    }
  });

  it("ONE repair retry whose prompt names the exact rejection reason, then acceptance", async () => {
    const drifted = { meals: [modelMeal("أ", 100), modelMeal("ب", 100), modelMeal("ج", 100)] };
    chainState.responses.push(
      { text: JSON.stringify(drifted), model: "m1", provider: "openrouter" },
      { text: JSON.stringify(validNutritionPlan(2000)), model: "m2", provider: "groq" },
    );
    const res = await generateNutritionPlanAI(ctx);
    expect(chainState.prompts).toHaveLength(2);
    expect(chainState.prompts[1]).toContain("محاولتك السابقة رُفضت");
    expect(res.source).toBe("groq:m2");
  });

  it("two rejections → local fallback with the VISIBLE review flag (never silent AI work)", async () => {
    const drifted = { meals: [modelMeal("أ", 100)] };
    chainState.responses.push(
      { text: JSON.stringify(drifted), model: "m1", provider: "openrouter" },
      { text: JSON.stringify({ meals: [] }), model: "m2", provider: "groq" },
    );
    const res = await generateNutritionPlanAI(ctx);
    expect(res.source).toBe("local-fallback");
    const content = res.content as { needs_review?: { flags: string[] } };
    expect(content.needs_review?.flags).toContain("ai_output_rejected_local_fallback");
  });

  it("provider failure (all providers down) → local fallback, still coherent", async () => {
    chainState.responses.push(new Error("all providers failed"));
    const res = await generateNutritionPlanAI(ctx);
    expect(res.source).toBe("local-fallback");
    const content = res.content as { meals: unknown[]; daily_calories: number };
    expect(content.meals.length).toBeGreaterThan(0);
    expect(content.daily_calories).toBeGreaterThan(1200);
  });
});

describe("generateWorkoutPlanAI — hollow training days are rejected", () => {
  const validWorkout = () => ({
    overview: "برنامج",
    days: [
      { day: "السبت", focus: "صدر", isRest: false, exercises: [
        { name: "Bench Press", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
        { name: "Incline Press", sets: 3, reps: "10", rest: "60 ثانية", notes: "" },
        { name: "Cable Fly", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
      ] },
      { day: "الأحد", focus: "راحة", isRest: true, exercises: [] },
      { day: "الاثنين", focus: "ظهر", isRest: false, exercises: [
        { name: "Lat Pulldown", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
        { name: "Row", sets: 3, reps: "10", rest: "60 ثانية", notes: "" },
        { name: "Face Pull", sets: 3, reps: "15", rest: "45 ثانية", notes: "" },
      ] },
    ],
  });

  it("accepts a real program", async () => {
    chainState.responses.push({ text: JSON.stringify(validWorkout()), model: "m", provider: "nvidia" });
    const res = await generateWorkoutPlanAI(ctx);
    expect(res.source).toBe("nvidia:m");
    expect((res.content as { days: unknown[] }).days).toHaveLength(3);
  });

  it("hollow days rejected twice → local fallback", async () => {
    const hollow = { days: [{ day: "السبت", focus: "صدر", isRest: false, exercises: [] }] };
    chainState.responses.push(
      { text: JSON.stringify(hollow), model: "m1", provider: "openrouter" },
      { text: JSON.stringify(hollow), model: "m2", provider: "groq" },
    );
    const res = await generateWorkoutPlanAI(ctx);
    expect(res.source).toBe("local-fallback");
  });
});

describe("regenerateMeal — gate + retry + honest throw", () => {
  const currentMeal = {
    name: "الغداء",
    items: [
      { food: "أرز", amount: "200 جم", calories: 260 },
      { food: "دجاج", amount: "150 جم", calories: 250 },
    ],
  };

  it("accepts an equivalent meal with recomputed totals and cleaned suggestions", async () => {
    const replacement = {
      meal: {
        name: "غداء بديل",
        items: [
          { food: "بطاطس", amount: "250 جم", calories: "215", protein_g: 5 },
          { food: "سمك", amount: "200 جم", calories: 290, protein_g: 40 },
        ],
        total_calories: 99999,
      },
      suggestions: [
        { name: "بديل 1", items: [{ food: "مكرونة", amount: "200 جم", calories: "280" }], total_calories: 999 },
        { name: "سيء", items: [{ food: "", amount: "", calories: 0 }] },
      ],
    };
    chainState.responses.push({ text: JSON.stringify(replacement), model: "m", provider: "groq" });
    const out = await regenerateMeal(currentMeal, 510);
    expect(out.source).toBe("groq:m");
    // items coerced + totals recomputed from items
    const items = (out.meal.items as Array<{ calories: number }>);
    expect(items[0].calories).toBe(215);
    expect((out.meal as unknown as { total_calories: number }).total_calories).toBe(505);
    // suggestions normalized: usable entry kept with recomputed total, junk dropped
    expect(out.suggestions).toHaveLength(1);
    expect(out.suggestions[0].total_calories).toBe(280);
  });

  it("drifted replacement → ONE repair retry naming the reason → second failure THROWS", async () => {
    const drifted = { meal: { name: "x", items: [{ food: "بيتزا", amount: "كاملة", calories: 1800 }] } };
    chainState.responses.push(
      { text: JSON.stringify(drifted), model: "m1", provider: "openrouter" },
      { text: JSON.stringify(drifted), model: "m2", provider: "groq" },
    );
    await expect(regenerateMeal(currentMeal, 510)).rejects.toThrow("بوابة الجودة");
    expect(chainState.prompts).toHaveLength(2);
    expect(chainState.prompts[1]).toContain("محاولتك السابقة رُفضت");
  });

  it("a meal with NO calorie anchor fails honestly BEFORE any provider call", async () => {
    await expect(
      regenerateMeal({ name: "فارغة", items: [{ food: "x", amount: "y", calories: 0 }] }, 0),
    ).rejects.toThrow("سعرات مرجعية");
    expect(chainState.prompts).toHaveLength(0);
  });

  it("legacy string-calorie items produce a NUMERIC target (no string poisoning)", async () => {
    const legacy = {
      name: "قديمة",
      items: [
        { food: "أرز", amount: "200 جم", calories: "260" as unknown as number },
        { food: "دجاج", amount: "150 جم", calories: "250" as unknown as number },
      ],
    };
    const replacement = {
      meal: {
        name: "بديل",
        items: [
          { food: "بطاطس", amount: "250 جم", calories: 250 },
          { food: "سمك", amount: "200 جم", calories: 260 },
        ],
      },
    };
    chainState.responses.push({ text: JSON.stringify(replacement), model: "m", provider: "groq" });
    const out = await regenerateMeal(legacy, undefined);
    expect((out.meal as unknown as { total_calories: number }).total_calories).toBe(510);
  });
});

describe("regenerateFoodItem — ±15% enforced with one retry", () => {
  const original = { food: "زبادي", amount: "200 جم", calories: 140 };

  it("accepts an in-band replacement", async () => {
    chainState.responses.push({
      text: JSON.stringify({ food: "زبادي يوناني", amount: "180 جم", calories: 150 }),
      model: "m",
      provider: "nvidia",
    });
    const out = await regenerateFoodItem(original);
    expect(out.item.calories).toBe(150);
    expect(out.item.food).toBe("زبادي يوناني");
  });

  it("out-of-band twice → throws (the original item stays untouched at the caller)", async () => {
    chainState.responses.push(
      { text: JSON.stringify({ food: "بيتزا", amount: "طبق", calories: 900 }), model: "m1", provider: "openrouter" },
      { text: JSON.stringify({ food: "بيتزا", amount: "طبق", calories: 950 }), model: "m2", provider: "groq" },
    );
    await expect(regenerateFoodItem(original)).rejects.toThrow("بوابة الجودة");
    expect(chainState.prompts).toHaveLength(2);
  });
});

describe("regenerateWorkoutDay — 3-8 exercises enforced", () => {
  const currentDay = {
    day: "السبت",
    focus: "صدر وترايسبس",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
      { name: "Fly", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
    ],
  };

  it("accepts a full day and keeps the weekly slot + focus", async () => {
    chainState.responses.push({
      text: JSON.stringify({
        focus: "صدر وترايسبس",
        exercises: [
          { name: "Incline Bench Press", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "نصيحة" },
          { name: "Dumbbell Fly", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
          { name: "Triceps Pushdown", sets: 3, reps: "12", rest: "45 ثانية", notes: "" },
          { name: "Cable Crossover", sets: 3, reps: "15", rest: "45 ثانية", notes: "" },
        ],
      }),
      model: "m",
      provider: "nvidia",
    });
    const out = await regenerateWorkoutDay(currentDay);
    expect(out.day.day).toBe("السبت");
    expect(out.day.focus).toBe("صدر وترايسبس");
    expect(out.day.exercises).toHaveLength(4);
    expect(out.day.exercises[0].exerciseSlug).toBeTruthy();
  });

  it("hollow day twice → throws", async () => {
    chainState.responses.push(
      { text: JSON.stringify({ exercises: [{ name: "Bench Press", sets: 3 }] }), model: "m1", provider: "openrouter" },
      { text: JSON.stringify({ exercises: [] }), model: "m2", provider: "groq" },
    );
    await expect(regenerateWorkoutDay(currentDay)).rejects.toThrow("بوابة الجودة");
  });
});
