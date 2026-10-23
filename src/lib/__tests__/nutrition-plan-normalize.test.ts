import { describe, it, expect } from "vitest";
import { normalizeNutritionPlan, computeNutritionTargets } from "@/lib/plan-generator";
import type { ClientContext } from "@/lib/ai-local";

/**
 * NOTIF→PLAN 2026-10-24 (owner order item 7) — one plan, ONE set of
 * numbers. The live incident shipped an AI overview promising
 * «السعرات المستهدفة: 2320 / بروتين 318جم / كارب 24جم / دهون 106جم»
 * while the enforced structured fields carried 2905 / 265 / 279 / 81 —
 * two contradicting "official" sets in a single plan. normalizeNutrition
 * Plan now REBUILDS the overview from server math and stamps the meals
 * sum, so every surface (coach viewer, member viewer, print) shows the
 * same numbers.
 */

const ctx: ClientContext = {
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
  },
  fitness: { days: "2", goal: "تحسين الصحه خساره الوزن", activity: "light" },
  recent_measurements: [],
  recent_plan_names: [],
};

const targets = computeNutritionTargets(ctx);

/** The hostile model output: its OWN numbers everywhere it could write them. */
const modelPlan = {
  overview:
    "خطة تغذية مخصصة لـ Samar samy بهدف خسارة الدهون.\n\n السعرات المستهدفة: 2320 كالوري/يوم\n البروتين: 318جم (≈55%)\n الكربوهيدرات: 24جم (≈4%)\n الدهون: 106جم (≈41%)",
  data_analysis: { bmr: 9999, tdee: 9999, body_fat_pct: "~99%" },
  daily_calories: 9999,
  macros: { protein_g: 318, carbs_g: 24, fat_g: 106 },
  meals: [
    { name: "الفطار", total_calories: 800, items: [{ food: "بيض", amount: "3 بيضات", calories: 800 }] },
    { name: "الغداء", total_calories: 750, items: [{ food: "سمك", amount: "200 جم", calories: 750 }] },
    { name: "العشاء", total_calories: 770, items: [{ food: "دجاج", amount: "250 جم", calories: 770 }] },
  ],
  supplements: [],
  health_notes: [],
  water_target: "2 لتر يومياً",
};

const normalized = normalizeNutritionPlan(modelPlan, undefined, targets);

describe("normalizeNutritionPlan — server numbers win EVERYWHERE (item 7)", () => {
  it("daily_calories + macros come from server targets, never the model", () => {
    expect(normalized.daily_calories).toBe(2324);
    expect(normalized.macros.protein_g).toBe(targets.macros.protein_g);
    expect(normalized.macros.carbs_g).toBe(targets.macros.carbs_g);
    expect(normalized.macros.fat_g).toBe(targets.macros.fat_g);
    expect(normalized.daily_calories).not.toBe(9999);
    expect(normalized.macros.carbs_g).not.toBe(24);
  });

  it("the overview is rebuilt from server math — the model's promised 318/24/106 never survives", () => {
    expect(normalized.overview).toContain(`${targets.dailyCalories} سعرة/يوم`);
    expect(normalized.overview).toContain(`${targets.bmr} سعرة`);
    expect(normalized.overview).toContain(`${targets.tdee} سعرة`);
    expect(normalized.overview).toContain("عجز يومي");
    // The model's keto-ish fake macros must not leak into the visible text.
    expect(normalized.overview).not.toContain("318");
    expect(normalized.overview).not.toContain("24جم");
    expect(normalized.overview).not.toContain("106جم");
  });

  it("the overview states the goal + resolved diet type (keto)", () => {
    expect(normalized.overview).toContain("كيتو");
    expect(normalized.overview).toContain("خسارة وزن");
  });

  it("meals_total_calories is computed from the meal totals (the third number the incident hid)", () => {
    expect(normalized.meals_total_calories).toBe(2320); // 800+750+770
  });

  it("data_analysis carries server bmr/tdee + goal/diet provenance", () => {
    expect(normalized.data_analysis?.bmr).toBe(2113);
    expect(normalized.data_analysis?.tdee).toBe(2905);
    expect(normalized.data_analysis?.goal).toContain("عجز");
    expect(normalized.data_analysis?.diet_type).toBe("كيتو");
    expect(normalized.data_analysis?.target_weight).toBe("100 كجم");
  });

  it("no needs_review for complete, ordinary data", () => {
    expect(normalized.needs_review).toBeUndefined();
  });

  it("needs_review rides the plan when the server flagged missing/extreme inputs (item 5)", () => {
    const badTargets = computeNutritionTargets({ nutrition: {}, fitness: {} });
    const out = normalizeNutritionPlan(modelPlan, undefined, badTargets);
    expect(out.needs_review?.flags).toContain("missing_or_implausible_weight");
    expect(out.needs_review?.note).toBeTruthy();
  });

  it("coach calorie override is honored and labeled in the overview", () => {
    const t = computeNutritionTargets(ctx, { targetCalories: 2100 });
    const out = normalizeNutritionPlan(modelPlan, { targetCalories: 2100 }, t);
    expect(out.daily_calories).toBe(2100);
    expect(out.overview).toContain("2100 سعرة/يوم");
    expect(out.overview).toContain("بتخصيص المدرب");
  });

  it("without targets (legacy callers) the plan passes through verbatim", () => {
    const out = normalizeNutritionPlan(modelPlan);
    expect(out.daily_calories).toBe(9999);
    expect(out.overview).toBe(modelPlan.overview);
  });

  it("meal totals missing → sum falls back to the items' calories", () => {
    const noTotals = {
      ...modelPlan,
      meals: [
        { name: "الفطار", items: [{ food: "بيض", amount: "3", calories: 300 }, { food: "شوفان", amount: "40 جم", calories: 150 }] },
      ],
    };
    const out = normalizeNutritionPlan(noTotals, undefined, targets);
    expect(out.meals_total_calories).toBe(450);
  });
});
