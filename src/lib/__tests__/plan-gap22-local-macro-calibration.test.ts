import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * GAP-22 (S4-1 wave-2 live 2026-11-17, plan 347c88c4) — the LOCAL
 * generation path consumed the coach's macro override VERBATIM:
 * ai-local.ts:789 «coach override WIN» took any positive protein with no
 * validation, and normalizeNutritionPlan's per-field ||-chains then let
 * the RAW override overwrite the closed targets at the save chokepoint —
 * so a B2B payload of overrides.macros={protein_g:3000, carbs_g:0,
 * fat_g:0} shipped macros summing 12,000 kcal (Atwater) against a
 * 1957-kcal day (the saved plan the independent audit flagged at
 * 575.6% drift). The AI path's law (computeMacrosForDiet +
 * macro_closure_adjusted) never applied to the local path.
 *
 * THE FIX (one law, both paths):
 *   - the shared closure law (enforceMacroClosure) lives in the pure
 *     plan-ai-validation module and BOTH engines import it;
 *   - the local engine honors a macro override ONLY as a COMPLETE triple
 *     (all three finite and > 0) and calibrates it onto the day's target;
 *   - normalizeNutritionPlan saves targets.macros (the CLOSED numbers)
 *     whenever server targets exist — the raw override never re-enters;
 *   - a PARTIAL override stamps macro_closure_adjusted (the coach sees
 *     his numbers were adjusted instead of wondering where they went).
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
    // No scripted response → the chain throws → the honest LOCAL FALLBACK
    // fires: the exact path of the measured incident (job 9092e0c0 fell
    // to local after the whole provider chain failed).
    callFreeAIFallbackChain: vi.fn(async (prompt: string) => {
      chainState.prompts.push(prompt);
      const next = chainState.responses.shift();
      if (!next) throw new Error("no scripted response");
      if (next instanceof Error) throw next;
      return { qualityTier: "strong" as const, ...next };
    }),
  };
});

vi.mock("@/lib/plan-food-grounding", () => ({
  groundItemToLibrary: () => null,
}));

import {
  computeNutritionTargets,
  generateNutritionPlanAI,
  normalizeNutritionPlan,
  macroClosureDriftPct,
} from "@/lib/plan-generator";
import { generateNutritionPlan } from "@/lib/ai-local";
import { enforceMacroClosure, PLAN_AI_SANITY } from "@/lib/plan-ai-validation";
import type { ClientContext } from "@/lib/ai-local";

/* The measured incident's client shape (B2B on the diabetes member): a
 * 80kg adult male — the daily target was coach-forced to 1957 kcal. */
const ctx: ClientContext = {
  name: "عميل الاختبار",
  nutrition: {
    gender: "male",
    weight: "80",
    height: "175",
    age: "40",
    target_weight: "78",
    meals: "4",
    diet: "متوازن",
    allergies: "",
    disliked: "",
  },
  fitness: { days: "4", goal: "general", activity: "متوسط" },
  recent_measurements: [],
  recent_plan_names: [],
};

const TARGET = 1957;
const atwater = (m: { protein_g: number; carbs_g: number; fat_g: number }) =>
  m.protein_g * 4 + m.carbs_g * 4 + m.fat_g * 9;

beforeEach(() => {
  chainState.responses.length = 0;
  chainState.prompts.length = 0;
  vi.clearAllMocks();
});

describe("GAP-22 — the shared closure law (single source)", () => {
  it("the shared law is re-exported from plan-generator (public surface unchanged)", async () => {
    const gen = await import("@/lib/plan-generator");
    expect(typeof gen.enforceMacroClosure).toBe("function");
    expect(typeof gen.macroClosureDriftPct).toBe("function");
  });

  it("enforceMacroClosure rescales a breaching triple ratio-preserved onto the target", () => {
    // The full-triple form of the incident: 13,140 kcal against 1957.
    const out = enforceMacroClosure({ protein_g: 3000, carbs_g: 150, fat_g: 60 }, TARGET);
    const drift = macroClosureDriftPct(out, TARGET);
    expect(drift).not.toBeNull();
    expect(Math.abs(drift!)).toBeLessThanOrEqual(PLAN_AI_SANITY.macroClosureTolerance * 100);
    // ratio preserved: 3000:150:60 → the dominant protein stays dominant
    expect(out.protein_g).toBeGreaterThan(out.carbs_g);
    expect(out.carbs_g).toBeGreaterThan(out.fat_g);
    expect(out.protein_g).toBeLessThan(500); // 3000g NEVER ships
  });

  it("a closed triple rides untouched", () => {
    const closed = { protein_g: 160, carbs_g: 180, fat_g: 70 };
    expect(enforceMacroClosure(closed, TARGET)).toEqual(closed);
  });
});

describe("GAP-22 — the local engine no longer takes the override verbatim", () => {
  it("the measured PARTIAL override {3000,0,0} is ignored → diet-aware defaults answer", () => {
    const plan = generateNutritionPlan(ctx, {
      dailyCalories: TARGET,
      macros: { protein_g: 3000, carbs_g: 0, fat_g: 0 },
    });
    expect(plan.macros.protein_g).not.toBe(3000);
    expect(plan.macros.protein_g).toBe(160); // 2.0 g/kg × 80kg — the balanced default
    expect(Math.abs(atwater(plan.macros) - TARGET) / TARGET)
      .toBeLessThanOrEqual(PLAN_AI_SANITY.macroClosureTolerance);
  });

  it("a COMPLETE breaching triple is CALIBRATED onto the day target (ratio kept, closure enforced)", () => {
    const plan = generateNutritionPlan(ctx, {
      dailyCalories: TARGET,
      macros: { protein_g: 3000, carbs_g: 150, fat_g: 60 },
    });
    expect(plan.macros.protein_g).not.toBe(3000);
    expect(plan.macros.protein_g).toBeLessThan(500);
    const drift = macroClosureDriftPct(plan.macros, TARGET);
    expect(drift).not.toBeNull();
    expect(Math.abs(drift!)).toBeLessThanOrEqual(PLAN_AI_SANITY.macroClosureTolerance * 100);
  });

  it("a COMPLETE closed triple rides verbatim (the coach's ratio is authoritative)", () => {
    const sent = { protein_g: 160, carbs_g: 180, fat_g: 70 };
    const plan = generateNutritionPlan(ctx, { dailyCalories: TARGET, macros: sent });
    expect(plan.macros).toEqual(sent);
  });

  it("non-finite values are never accepted (defaults answer)", () => {
    const plan = generateNutritionPlan(ctx, {
      dailyCalories: TARGET,
      macros: { protein_g: Number.NaN, carbs_g: 180, fat_g: 70 },
    });
    expect(plan.macros.protein_g).toBe(160); // defaults
  });
});

describe("GAP-22 — the full local-fallback path saves CLOSED macros (the incident sequence)", () => {
  it("the measured B2B payload {3000,0,0} on a chain-down day: saved macros close on the target + the flag rides", async () => {
    // No scripted responses → every provider attempt fails → the honest
    // local fallback fires (the measured job 9092e0c0's exact situation).
    const res = await generateNutritionPlanAI(ctx, {
      targetCalories: TARGET,
      macros: { protein_g: 3000, carbs_g: 0, fat_g: 0 },
    });
    expect(res.source).toBe("local-fallback");
    const content = res.content as {
      macros: { protein_g: number; carbs_g: number; fat_g: number };
      needs_review?: { flags: string[] };
      audit?: { macroDriftPct: number | null };
    };
    // The verbatim 3000g ride is dead — the saved protein is the closed number.
    expect(content.macros.protein_g).not.toBe(3000);
    expect(content.macros.protein_g).toBeLessThan(500);
    // Closure on the declared daily target (the audit's independent number).
    const drift = macroClosureDriftPct(content.macros, TARGET);
    expect(drift).not.toBeNull();
    expect(Math.abs(drift!)).toBeLessThanOrEqual(PLAN_AI_SANITY.macroClosureTolerance * 100);
    // The coach SEES the adjustment (the evidence's «بلا قياس/علم» gap).
    expect(content.needs_review?.flags).toContain("macro_closure_adjusted");
    expect(content.needs_review?.flags).toContain("ai_output_rejected_local_fallback");
  });

  it("a COMPLETE breaching triple survives the fallback path ratio-preserved and CLOSED", async () => {
    const res = await generateNutritionPlanAI(ctx, {
      targetCalories: TARGET,
      macros: { protein_g: 3000, carbs_g: 150, fat_g: 60 },
    });
    expect(res.source).toBe("local-fallback");
    const content = res.content as {
      macros: { protein_g: number; carbs_g: number; fat_g: number };
      needs_review?: { flags: string[] };
    };
    expect(content.macros.protein_g).not.toBe(3000);
    const drift = macroClosureDriftPct(content.macros, TARGET);
    expect(Math.abs(drift ?? 999)).toBeLessThanOrEqual(PLAN_AI_SANITY.macroClosureTolerance * 100);
    expect(content.needs_review?.flags).toContain("macro_closure_adjusted");
  });
});

describe("GAP-22 — normalizeNutritionPlan saves the CLOSED targets (the chokepoint law)", () => {
  it("when server targets exist, the RAW override never re-enters the saved card", () => {
    const targets = computeNutritionTargets(ctx, {
      targetCalories: TARGET,
      macros: { protein_g: 3000, carbs_g: 0, fat_g: 0 },
    });
    // targets.macros already closed by computeMacrosForDiet (partial ignored)
    const out = normalizeNutritionPlan(
      { meals: [], macros: { protein_g: 9999, carbs_g: 1, fat_g: 1 }, daily_calories: TARGET },
      { targetCalories: TARGET, macros: { protein_g: 3000, carbs_g: 0, fat_g: 0 } },
      targets,
    );
    expect(out.macros.protein_g).toBe(targets.macros.protein_g);
    expect(out.macros.carbs_g).toBe(targets.macros.carbs_g);
    expect(out.macros.fat_g).toBe(targets.macros.fat_g);
    expect(out.macros.protein_g).not.toBe(3000);
    expect(out.macros.protein_g).not.toBe(9999);
  });

  it("computeNutritionTargets: a PARTIAL override stamps macro_closure_adjusted; a closed complete triple does not", () => {
    const partial = computeNutritionTargets(ctx, {
      targetCalories: TARGET,
      macros: { protein_g: 3000, carbs_g: 0, fat_g: 0 },
    });
    expect(partial.reviewFlags).toContain("macro_closure_adjusted");

    const closed = computeNutritionTargets(ctx, {
      targetCalories: TARGET,
      macros: { protein_g: 160, carbs_g: 180, fat_g: 70 }, // 1990 kcal vs 1957 → 1.7%
    });
    expect(closed.reviewFlags).not.toContain("macro_closure_adjusted");

    const breaching = computeNutritionTargets(ctx, {
      targetCalories: TARGET,
      macros: { protein_g: 3000, carbs_g: 150, fat_g: 60 },
    });
    expect(breaching.reviewFlags).toContain("macro_closure_adjusted");
  });
});
