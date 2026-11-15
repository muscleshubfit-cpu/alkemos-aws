import { describe, it, expect } from "vitest";
import {
  computeMacrosForDiet,
  computeNutritionTargets,
  enforceMacroClosure,
  macroClosureDriftPct,
} from "@/lib/plan-generator";
import { PLAN_AI_SANITY } from "@/lib/plan-ai-validation";

/**
 * P1 canaries — the generator's deterministic math: NUT-2 (macro closure
 * on coach overrides), NUT-5 (the minors gate) and NUT-11 (labeled
 * defaults + the unified meal band).
 */

const adultCtx = (over: Record<string, unknown> = {}) => ({
  name: "عميل",
  nutrition: {
    gender: "male",
    weight: "80",
    height: "180",
    age: "30",
    activity: "moderate",
    diet: "متوازن",
    ...over,
  },
  fitness: {},
  recent_measurements: [],
  recent_plan_names: [],
  ...over,
});

describe("NUT-2 — coach macro closure", () => {
  it("a coherent coach override passes verbatim (ratio + closure kept)", () => {
    const macros = { protein_g: 150, carbs_g: 200, fat_g: 67 }; // 600+800+603 ≈ 2003 kcal
    const out = computeMacrosForDiet("balanced", 2000, 80, macros);
    expect(Math.abs(macroClosureDriftPct(out, 2000) ?? 0)).toBeLessThanOrEqual(
      PLAN_AI_SANITY.macroClosureTolerance * 100 + 0.5,
    );
  });

  it("the audit's measured violation (3000g protein vs 2000 kcal) is RESCALED to closure", () => {
    const insane = { protein_g: 3000, carbs_g: 50, fat_g: 60 };
    const out = computeMacrosForDiet("balanced", 2000, 80, insane);
    // closes within ±10% after the proportional rescale
    const drift = macroClosureDriftPct(out, 2000);
    expect(drift).not.toBeNull();
    expect(Math.abs(drift as number)).toBeLessThanOrEqual(PLAN_AI_SANITY.macroClosureTolerance * 100 + 0.5);
    // the ratio intent is preserved (protein stays the dominant macro)
    expect(out.protein_g).toBeGreaterThan(out.carbs_g);
  });

  it("enforceMacroClosure keeps a closed triple untouched", () => {
    const closed = { protein_g: 150, carbs_g: 200, fat_g: 67 };
    expect(enforceMacroClosure(closed, 2000)).toEqual(closed);
  });

  it("the rescale lands on the target (the round-trip closes)", () => {
    const rescaled = enforceMacroClosure({ protein_g: 3000, carbs_g: 50, fat_g: 60 }, 2000);
    const kcal = rescaled.protein_g * 4 + rescaled.carbs_g * 4 + rescaled.fat_g * 9;
    expect(Math.abs(kcal - 2000)).toBeLessThanOrEqual(30);
  });

  it("the generator stamps macro_closure_adjusted for the rescaled override", () => {
    const t = computeNutritionTargets(adultCtx() as never, {
      targetCalories: 2000,
      macros: { protein_g: 3000, carbs_g: 50, fat_g: 60 },
    });
    expect(t.reviewFlags).toContain("macro_closure_adjusted");
  });

  it("a closed override stamps NO closure flags", () => {
    const t = computeNutritionTargets(adultCtx() as never, {
      targetCalories: 2000,
      macros: { protein_g: 150, carbs_g: 200, fat_g: 67 },
    });
    expect(t.reviewFlags).not.toContain("macro_closure_adjusted");
    expect(t.reviewFlags).not.toContain("macro_closure_violation");
  });
});

describe("NUT-5 — the minors gate (10-17)", () => {
  it("a 13-year-old carries the minor_client flag", () => {
    const t = computeNutritionTargets(adultCtx({ age: "13" }) as never);
    expect(t.reviewFlags).toContain("minor_client");
  });

  it("a 17-year-old is still a minor; 18 is not", () => {
    expect(computeNutritionTargets(adultCtx({ age: "17" }) as never).reviewFlags).toContain("minor_client");
    expect(computeNutritionTargets(adultCtx({ age: "18" }) as never).reviewFlags).not.toContain("minor_client");
  });

  it("a minor's fat-loss goal is clamped to maintenance (no deficit under 18)", () => {
    // target weight 30kg below current + fat-loss goal text ⇒ the −20% path
    const minor = computeNutritionTargets(
      adultCtx({ age: "14", target: "50" }) as never,
    );
    const adult = computeNutritionTargets(adultCtx({ age: "30", target: "50" }) as never);
    expect(minor.reviewFlags).toContain("minor_deficit_clamped_to_maintenance");
    expect(minor.dailyCalories).toBe(minor.tdee);
    expect(adult.dailyCalories).toBeLessThan(adult.tdee); // the adult keeps the deficit
  });

  it("an adult's deficit path is untouched", () => {
    const t = computeNutritionTargets(adultCtx({ age: "30", target: "50" }) as never);
    expect(t.reviewFlags).not.toContain("minor_deficit_clamped_to_maintenance");
  });
});

describe("NUT-11 — labeled defaults + the unified meal band", () => {
  it("missing basic data flags the same three review flags as the targets", () => {
    const t = computeNutritionTargets(
      adultCtx({ weight: undefined, height: undefined, age: undefined }) as never,
    );
    expect(t.reviewFlags).toContain("missing_or_implausible_weight");
    expect(t.reviewFlags).toContain("missing_or_implausible_height");
    expect(t.reviewFlags).toContain("missing_or_implausible_age");
  });
});
