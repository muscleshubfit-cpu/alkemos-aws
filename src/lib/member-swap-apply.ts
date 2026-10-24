/**
 * MEMBER-SWAP-APPLY — the validated apply step for member AI swaps
 * (AI-PLAN-QUALITY 2026-10-24, owner order items 4+5).
 *
 * THE ROOT CAUSE THIS KILLS: PlansView.applySwapToPlans used to splice
 * `job.result.replacement` into the plan with ZERO shape checks — a null
 * or shapeless payload became a persisted corrupted row — and it never
 * recomputed the plan's totals, so the member kept the OLD calorie card
 * over a NEW meal (the exact «أرقام متضاربة بعد الاستبدال» complaint).
 *
 * THE LAW HERE: a replacement is applied ONLY when it passes its gate
 * (meal: real items with coerced numeric calories; exercise: a real
 * name). After a MEAL swap the whole plan's totals are recomputed through
 * the shared pure leaf (nutrition-totals.ts) so daily_calories,
 * meals_total_calories and macros always match the meals actually shown.
 *
 * CLIENT-SAFE: imports only the zero-dependency totals leaf + structural
 * types (the Phase-183 bundle law — no runtime value from the server
 * generator module).
 */

import { recomputeNutritionTotals } from "@/lib/nutrition-totals";
import type { NutritionPlanContent } from "@/lib/plan-generator";

export type SwapKind = "meal" | "exercise";

export type SwapApplyResult =
  | { ok: true; content: Record<string, unknown> }
  | { ok: false; error: string };

/** Coerce a model field to a finite positive number (0 otherwise). */
function numOr(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/** Meal gate: object + 1..10 items, every item with a real food name and
 * coerced finite calories. Returns the CLEANED meal (numbers as numbers,
 * strings trimmed/bounded) — the caller persists exactly this. */
function cleanReplacementMeal(raw: unknown): Record<string, unknown> | null {
  if (!isObj(raw)) return null;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  if (rawItems.length < 1 || rawItems.length > 10) return null;
  const items: Array<Record<string, unknown>> = [];
  for (const it of rawItems) {
    if (!isObj(it)) return null;
    const food = typeof it.food === "string" ? it.food.trim().slice(0, 80) : "";
    if (!food) return null;
    const calories = numOr(it.calories);
    if (calories <= 0 || calories > 2000) return null;
    const protein = numOr(it.protein_g);
    const carbs = numOr(it.carbs_g);
    const fat = numOr(it.fat_g);
    items.push({
      food,
      amount: typeof it.amount === "string" ? it.amount.trim().slice(0, 80) : "",
      calories: Math.round(calories),
      ...(protein > 0 ? { protein_g: Math.round(protein * 10) / 10 } : {}),
      ...(carbs > 0 ? { carbs_g: Math.round(carbs * 10) / 10 } : {}),
      ...(fat > 0 ? { fat_g: Math.round(fat * 10) / 10 } : {}),
      ...(typeof it.alternatives === "string" && it.alternatives.trim()
        ? { alternatives: it.alternatives.trim().slice(0, 200) }
        : {}),
    });
  }
  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 60) : "وجبة بديلة",
    ...(typeof raw.time === "string" && raw.time.trim() ? { time: raw.time.trim().slice(0, 60) } : {}),
    ...(typeof raw.notes === "string" && raw.notes.trim() ? { notes: raw.notes.trim().slice(0, 300) } : {}),
    items,
    total_calories: items.reduce((s, i) => s + (i.calories as number), 0),
    total_protein_g: Math.round(items.reduce((s, i) => s + numOr(i.protein_g), 0) * 10) / 10,
  };
}

/** Exercise gate: object + a real name (the substituteExercise contract). */
function cleanReplacementExercise(raw: unknown): Record<string, unknown> | null {
  if (!isObj(raw)) return null;
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 80) : "";
  if (!name) return null;
  const sets = numOr(raw.sets);
  return {
    name,
    ...(sets > 0 ? { sets: Math.min(12, Math.max(1, Math.round(sets))) } : { sets: 3 }),
    reps: typeof raw.reps === "string" && raw.reps.trim() ? raw.reps.trim().slice(0, 40) : "10-12",
    rest: typeof raw.rest === "string" && raw.rest.trim() ? raw.rest.trim().slice(0, 40) : "90 ثانية",
    notes: typeof raw.notes === "string" ? raw.notes.trim().slice(0, 300) : "",
    ...(typeof raw.exerciseSlug === "string" && raw.exerciseSlug.trim()
      ? { exerciseSlug: raw.exerciseSlug.trim().slice(0, 120) }
      : {}),
    ...(typeof raw.image === "string" && raw.image.trim() ? { image: raw.image.trim() } : {}),
  };
}

/**
 * Apply a finished swap job's replacement to a plan's content — VALIDATED.
 *
 * @param content  the plan's current content (parsed JSON)
 * @param kind     "meal" | "exercise"
 * @param i1       meal index | day index
 * @param i2       exercise index (exercise kind only)
 * @param replacement the raw job result replacement
 * @returns { ok: true, content } with the element replaced and (for meals)
 * the FULL totals recomputed — or { ok: false, error } leaving the plan
 * untouched (the caller shows the error instead of corrupting the row).
 */
export function applyMemberSwapToContent(
  content: unknown,
  kind: SwapKind,
  i1: number,
  i2: number | undefined,
  replacement: unknown,
): SwapApplyResult {
  const base = isObj(content) ? content : {};
  if (!Number.isInteger(i1) || i1 < 0) {
    return { ok: false, error: "مؤشر العنصر غير صالح" };
  }

  if (kind === "meal") {
    const meals = Array.isArray(base.meals) ? [...base.meals] : null;
    if (!meals || meals[i1] === undefined) {
      return { ok: false, error: "الوجبة المستهدفة غير موجودة" };
    }
    const cleaned = cleanReplacementMeal(replacement);
    if (!cleaned) {
      return {
        ok: false,
        error: "نتيجة الاستبدال غير صالحة — لم تُطبّق على الخطة (الأصناف أو السعرات ناقصة/غير منطقية)",
      };
    }
    meals[i1] = cleaned;
    const next = { ...base, meals } as unknown as NutritionPlanContent;
    // The full totals recompute — the OLD code left the calorie card at
    // the previous meal's numbers over the NEW meal.
    const recomputed = recomputeNutritionTotals(next);
    return { ok: true, content: recomputed as unknown as Record<string, unknown> };
  }

  // exercise
  if (!Number.isInteger(i2) || i2 === undefined || i2 < 0) {
    return { ok: false, error: "مؤشر التمرين غير صالح" };
  }
  const days = Array.isArray(base.days) ? [...base.days] : null;
  if (!days || !isObj(days[i1]) || !Array.isArray((days[i1] as Record<string, unknown>).exercises)) {
    return { ok: false, error: "اليوم المستهدف غير موجود" };
  }
  const day = { ...(days[i1] as Record<string, unknown>) };
  const exercises = [...(day.exercises as unknown[])];
  if (exercises[i2] === undefined) {
    return { ok: false, error: "التمرين المستهدف غير موجود" };
  }
  const cleaned = cleanReplacementExercise(replacement);
  if (!cleaned) {
    return {
      ok: false,
      error: "نتيجة استبدال التمرين غير صالحة — لم تُطبّق على الخطة",
    };
  }
  exercises[i2] = cleaned;
  day.exercises = exercises;
  days[i1] = day;
  return { ok: true, content: { ...base, days } };
}
