import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * INF-4 / P2-2 (audit AI-GENERATION-PIPELINES 2026-11-15) — the PLAN
 * STAMPING battery (mocked provider chain, the plan-generator-regen-quality
 * pattern): the generation provenance block rides the SAVED content of
 * every AI-path plan —
 *
 *   - strong-tier answer → content.generation = { qualityTier:"strong",
 *     model, provider } (the serving model is PERSISTED for the first
 *     time — previously it lived only in the transient job result);
 *   - tail-tier answer → qualityTier:"tail" (the coach-side review badge
 *     reads exactly this — observable degradation);
 *   - local-fallback plans carry NO generation block (deterministic
 *     server math is not a model draw — its provenance is the review
 *     flag + source field, by design).
 */

const chainState = vi.hoisted(() => {
  const responses: Array<
    { text: string; model: string; provider: string; qualityTier?: "strong" | "tail" } | Error
  > = [];
  return { responses };
});

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...actual,
    callFreeAIFallbackChain: vi.fn(async () => {
      const next = chainState.responses.shift();
      if (!next) throw new Error("no scripted response");
      if (next instanceof Error) throw next;
      return next;
    }),
  };
});

vi.mock("@/lib/plan-food-grounding", () => ({
  groundItemToLibrary: () => null,
}));

import {
  generateNutritionPlanAI,
  generateWorkoutPlanAI,
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
  fitness: { days: "4", goal: "خسارة الوزن", activity: "متوسط", experience: "متوسط" },
  recent_measurements: [],
  recent_plan_names: [],
};

const validWorkoutPlan = () => ({
  overview: "برنامج أسبوعي",
  weekly_volume: "18 مجموعة أسبوعيًا",
  progression: "تدرّج 4 أسابيع",
  days: [
    { day: "السبت", focus: "صدر", isRest: false, exercises: [
      { name: "Barbell Bench Press - Medium Grip", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
      { name: "Incline Press", sets: 3, reps: "10", rest: "60 ثانية", notes: "" },
      { name: "Cable Fly", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
    ] },
    { day: "الأحد", focus: "ظهر", isRest: false, exercises: [
      { name: "Full Range-Of-Motion Lat Pulldown", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
      { name: "Row", sets: 3, reps: "10", rest: "60 ثانية", notes: "" },
      { name: "Face Pull", sets: 3, reps: "15", rest: "45 ثانية", notes: "" },
    ] },
    { day: "الإثنين", focus: "أرجل", isRest: false, exercises: [
      { name: "Barbell Squat", sets: 4, reps: "8-12", rest: "120 ثانية", notes: "" },
      { name: "Leg Press", sets: 3, reps: "10", rest: "90 ثانية", notes: "" },
      { name: "Calf Raise", sets: 3, reps: "15", rest: "45 ثانية", notes: "" },
    ] },
    { day: "الثلاثاء", focus: "أكتاف", isRest: false, exercises: [
      { name: "Dumbbell Shoulder Press", sets: 4, reps: "8-12", rest: "90 ثانية", notes: "" },
      { name: "Lateral Raise", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
      { name: "Shrug", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
    ] },
    { day: "الأربعاء", focus: "راحة", isRest: true, exercises: [] },
  ],
});

const modelMeal = (name: string, cals: number) => ({
  name,
  items: [
    { food: "شوفان", amount: "60 جم", calories: cals - 100, protein_g: 8 },
    { food: "زبادي", amount: "200 جم", calories: 100 },
  ],
  total_calories: cals,
});

const validNutritionPlan = () => ({
  overview: "خطة متوازنة",
  meals: [modelMeal("فطور", 500), modelMeal("غداء", 800), modelMeal("عشاء", 600)],
});

beforeEach(() => {
  chainState.responses.length = 0;
  vi.clearAllMocks();
});

describe("INF-4 / P2-2 — the generation provenance stamp on saved plans", () => {
  it("workout AI path (strong tier): content.generation carries {qualityTier, model, provider}", async () => {
    chainState.responses.push({
      text: JSON.stringify(validWorkoutPlan()),
      model: "openai/gpt-oss-120b",
      provider: "groq",
      qualityTier: "strong",
    });
    const res = await generateWorkoutPlanAI(ctx);
    expect(res.source).toBe("groq:openai/gpt-oss-120b");
    expect(res.content.generation).toEqual({
      qualityTier: "strong",
      model: "openai/gpt-oss-120b",
      provider: "groq",
    });
  });

  it("THE INF-4 CANARY: a TAIL-tier workout plan (qwen-3.8-27b answered) is stamped qualityTier \"tail\" — the coach badge reads exactly this", async () => {
    chainState.responses.push({
      text: JSON.stringify(validWorkoutPlan()),
      model: "qwen/qwen3.8-27b",
      provider: "groq",
      qualityTier: "tail",
    });
    const res = await generateWorkoutPlanAI(ctx);
    expect(res.content.generation?.qualityTier).toBe("tail");
    expect(res.content.generation?.model).toBe("qwen/qwen3.8-27b");
  });

  it("nutrition AI path: content.generation carries the tier + provenance", async () => {
    chainState.responses.push({
      text: JSON.stringify(validNutritionPlan()),
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      provider: "nvidia",
      qualityTier: "strong",
    });
    const res = await generateNutritionPlanAI(ctx);
    expect(res.content.generation).toEqual({
      qualityTier: "strong",
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      provider: "nvidia",
    });
  });

  it("nutrition TAIL tier (gemini last resort answered) → qualityTier \"tail\"", async () => {
    chainState.responses.push({
      text: JSON.stringify(validNutritionPlan()),
      model: "gemini-3.5-flash",
      provider: "gemini",
      qualityTier: "tail",
    });
    const res = await generateNutritionPlanAI(ctx);
    expect(res.content.generation?.qualityTier).toBe("tail");
  });

  it("local-fallback plans carry NO generation block (deterministic server math is not a model draw)", async () => {
    chainState.responses.push(new Error("all providers down"));
    const res = await generateWorkoutPlanAI(ctx);
    expect(res.source).toBe("local-fallback");
    expect(res.content.generation).toBeUndefined();
  });

  it("a repair retry served by the tail still records the tail tier (the LAST attempt's tier is the plan's)", async () => {
    // first attempt: gate rejects (garbage shape) on a strong entry
    chainState.responses.push({
      text: "ليس JSON صالحًا إطلاقًا",
      model: "openai/gpt-oss-120b",
      provider: "groq",
      qualityTier: "strong",
    });
    // repair attempt: valid JSON but from the tail
    chainState.responses.push({
      text: JSON.stringify(validWorkoutPlan()),
      model: "qwen/qwen3.8-27b",
      provider: "groq",
      qualityTier: "tail",
    });
    const res = await generateWorkoutPlanAI(ctx);
    expect(res.content.generation?.qualityTier).toBe("tail");
    expect(res.content.generation?.model).toBe("qwen/qwen3.8-27b");
  });
});
