import { describe, it, expect, vi } from "vitest";

/**
 * REGEN-ROOTCAUSE-2 battery (owner order 2026-10-26 — «فحص وإصلاح جذري
 * لمشكلة فشل إعادة توليد الخطط… لا تفترض أن المشكلة هي نفسها فشل
 * المزودين السابق»).
 *
 * THE MEASURED PRODUCTION FAILURE this file pins (reproduced locally with
 * the EXACT production payloads, read read-only from ai_jobs):
 *
 *   ai_jobs#15ebfcd6 (plan_nutrition, muscle-gain target 3035 kcal):
 *   with the provider chain dead (the measured free-tier norm on ~9k-token
 *   payloads — gemini 503 / nvidia abort / groq unusable), the LOCAL
 *   fallback is the de-facto production path. Its RAW output closed within
 *   ±3% (5/5 draws) — but the GATE's library grounding re-priced
 *   «شوفان مطبوخ» (cooked oats, 71 kcal/100g) against the DRY «شوفان»
 *   row (389 kcal/100g) because the containment matcher returned the
 *   FIRST candidate in FOODS array order: +954 kcal on one item → the day
 *   drifted +26-31% → beyond the ±25% gate → the local fallback was
 *   REJECTED → the job failed permanently → «فشل إعادة توليد الخطة».
 *   Reproduction on the pre-fix code: 3907/3831/3982 kcal vs the 3035
 *   target across draws — a probabilistic (~60-80%) user-facing failure.
 *
 *   The twin defect pinned here: the local fallback SAVED the raw local
 *   copy while the gate validated the GROUNDED copy — the gate never
 *   validated what was persisted (false confidence), and grounding
 *   corrections could never reach the saved plan.
 *
 * Unlike the earlier plan-generator batteries, this file runs the REAL
 * grounding against the REAL 8,830-row library (they mock it to null —
 * which is exactly why the ranked-matcher defect was invisible to them).
 */

const chainState = vi.hoisted(() => ({ dead: true }));

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...actual,
    // The measured production provider state on full-plan payloads: the
    // chain answers nothing usable — the local fallback is the path under
    // test (the free-tier provider reality, documented live).
    callFreeAIFallbackChain: vi.fn(async () => {
      throw new Error(chainState.dead ? "provider chain down (test)" : "unused");
    }),
  };
});

vi.mock("@/lib/evo-nutrition-knowledge.server", () => ({
  loadEvoNutritionKnowledge: async () => ({ knowledgeBlock: "", swapBlock: "" }),
}));

// NO mock of @/lib/plan-food-grounding — the REAL library grounding is
// the defect surface under test.

import { generateNutritionPlanAI, regenerateMeal } from "@/lib/plan-generator";
import { groundItemToLibrary } from "@/lib/plan-food-grounding";
import type { ClientContext } from "@/lib/ai-local";

/* ── The anonymized production payload classes (structure-equal to the
 * live ai_jobs rows; identity + free-text scrubbed) ─────────────────── */

/** ai_jobs#15ebfcd6 — the muscle-gain regeneration class (3035 kcal). */
const MUSCLE_GAIN_CTX: ClientContext = {
  name: "عميل اختبار",
  nutrition: {
    gender: "male",
    weight: "80",
    height: "180",
    age: "30",
    target_weight: "95",
    meals: "3",
    diet: "متوازن",
    allergies: "",
    disliked: "",
  },
  fitness: { days: "3", goal: "Build muscle", activity: "moderate" },
  recent_measurements: [],
  recent_plan_names: [],
};

/** ai_jobs#a8201f6c — the keto regeneration class (2324 kcal, insulin
 * resistance, cheese+bread allergies). */
const KETO_CTX: ClientContext = {
  name: "عميلة اختبار",
  nutrition: {
    gender: "female",
    weight: "132.5",
    height: "179",
    age: "34",
    target_weight: "100",
    meals: "3",
    diet: "كيتو",
    allergies: "الجبن والعيش",
    disliked: "",
    medical: "مقاومة إنسولين",
  },
  fitness: { days: "2", goal: "خسارة الوزن", activity: "خفيف" },
  recent_measurements: [],
  recent_plan_names: [],
};

type SavedItem = { food: string; amount: string; calories: number; carbs_g?: number };

const itemsOf = (content: { meals?: Array<{ items?: SavedItem[] }> }): SavedItem[] =>
  (content.meals ?? []).flatMap((m) => m.items ?? []);

const dayCalories = (content: { meals?: Array<{ items?: SavedItem[] }> }): number =>
  itemsOf(content).reduce((s, i) => s + (Number(i.calories) || 0), 0);

const dayCarbs = (content: { meals?: Array<{ items?: SavedItem[] }> }): number =>
  Math.round(itemsOf(content).reduce((s, i) => s + (Number(i.carbs_g) || 0), 0) * 10) / 10;

/* ──────────────────────────────────────────────────────────────────────── */
/* 1 — THE REPRODUCTION: the muscle-gain payload class now lands EVERY draw */
/* ──────────────────────────────────────────────────────────────────────── */

describe("REGEN-ROOTCAUSE-2 — the 3035-kcal regeneration class (ai_jobs#15ebfcd6 shape)", () => {
  it("EVERY draw (10/10) delivers a gate-passing local plan within ±25% — was a probabilistic job-killing throw (meals sum 3907/3831/3982)", async () => {
    for (let draw = 0; draw < 10; draw++) {
      const res = await generateNutritionPlanAI(MUSCLE_GAIN_CTX, {});
      expect(res.source).toBe("local-fallback");
      const total = dayCalories(res.content as never);
      const target = Number((res.content as { daily_calories?: number }).daily_calories ?? 3035);
      const drift = Math.abs(total - target) / target;
      expect(
        drift,
        `draw ${draw}: day total ${total} vs target ${target} (drift ${(drift * 100).toFixed(1)}%)`,
      ).toBeLessThanOrEqual(0.25);
    }
  }, 120_000);

  it("the keto oatmeal breakfast draws no longer inflate — any «شوفان مطبوخ» item is priced from the COOKED row (71/100g), never the dry 389", async () => {
    for (let draw = 0; draw < 6; draw++) {
      const res = await generateNutritionPlanAI(MUSCLE_GAIN_CTX, {});
      const oats = itemsOf(res.content as never).filter((i) => i.food.includes("شوفان"));
      for (const item of oats) {
        const grams = parseFloat(item.amount) || 0;
        // 71 kcal/100g ± the 35% grounding tolerance ceiling ≈ 96/100g —
        // the dry-row 389/100g would price 300g at 1167 kcal.
        expect(item.calories).toBeLessThanOrEqual(Math.ceil(grams * 0.97));
      }
    }
  }, 120_000);
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 2 — The keto regeneration class stays fully compliant (ai_jobs#a8201f6c) */
/* ──────────────────────────────────────────────────────────────────────── */

describe("REGEN-ROOTCAUSE-2 — the keto class (2324 kcal) keeps the keto law under the ranked matcher", () => {
  it("5/5 draws: keto-compliant, no banned dairy, day carbs inside the ketogenic band, ±25% closure", async () => {
    const BANNED = ["حليب بقري", "حليب كامل", "لبن رايب", "زبادي عادي", "زبادي طبيعي"];
    for (let draw = 0; draw < 5; draw++) {
      const res = await generateNutritionPlanAI(KETO_CTX, { dietType: "keto" });
      expect(res.source).toBe("local-fallback");
      const items = itemsOf(res.content as never);
      for (const item of items) {
        for (const banned of BANNED) {
          expect(
            `${item.food} (draw ${draw})`,
            `keto item matched the banned dairy token «${banned}»`,
          ).not.toContain(banned);
        }
      }
      const carbs = dayCarbs(res.content as never);
      expect(carbs, `draw ${draw}: day carbs ${carbs}g`).toBeLessThanOrEqual(50);
      const total = dayCalories(res.content as never);
      const target = Number((res.content as { daily_calories?: number }).daily_calories ?? 2324);
      expect(Math.abs(total - target) / target).toBeLessThanOrEqual(0.25);
    }
  }, 120_000);

  it("the cheese+bread allergy is enforced end-to-end (no جبن/خبز/عيش items in any keto meal)", async () => {
    for (let draw = 0; draw < 3; draw++) {
      const res = await generateNutritionPlanAI(KETO_CTX, { dietType: "keto" });
      for (const item of itemsOf(res.content as never)) {
        expect(item.food, `draw ${draw}`).not.toMatch(/جبن|جبنة|خبز|عيش|مكرونة|أرز|بطاطس/);
      }
    }
  }, 120_000);
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 3 — THE VALIDATED-COPY LAW: what is SAVED is what the GATE approved     */
/* ──────────────────────────────────────────────────────────────────────── */

describe("REGEN-ROOTCAUSE-2 — the saved content IS the gate-validated content", () => {
  it("every SAVED item with a library anchor is grounding-coherent (re-grounding is a no-op — the pre-fix code saved the raw, unvalidated copy)", async () => {
    for (let draw = 0; draw < 4; draw++) {
      const res = await generateNutritionPlanAI(MUSCLE_GAIN_CTX, {});
      for (const item of itemsOf(res.content as never)) {
        const grounded = groundItemToLibrary({
          food: item.food,
          amount: item.amount,
          calories: item.calories,
        });
        if (!grounded) continue; // no anchor — the bounded local estimate stands
        const deviation = Math.abs(item.calories - grounded.calories) / grounded.calories;
        expect(
          deviation,
          `draw ${draw}: «${item.food}» ${item.amount} saved ${item.calories} vs anchored ${grounded.calories}`,
        ).toBeLessThanOrEqual(0.35);
      }
    }
  }, 120_000);

  it("the local meal-swap fallback ships the VALIDATED meal (same law the item swap already followed)", async () => {
    for (let draw = 0; draw < 4; draw++) {
      const res = await regenerateMeal(
        {
          name: "العشاء",
          items: [
            { food: "كبدة دجاج", amount: "208 جم", calories: 248 },
            { food: "معكرونة قمح كامل", amount: "148 جم", calories: 184 },
            { food: "سبانخ مطبوخة", amount: "284 جم", calories: 65 },
          ],
        },
        772,
        MUSCLE_GAIN_CTX,
        "",
        ["الفطار", "بيض كامل مسلوق", "خبز أسمر", "طحينة", "حليب بقري 2%", "طماطم", "الغداء", "تونة في الماء"],
        undefined,
        "balanced",
      );
      expect(res.source).toBe("local-fallback:meal-swap");
      const meal = res.meal as unknown as { name: string; items: SavedItem[] };
      expect(meal.name).toBeTruthy();
      expect((meal.items ?? []).length).toBeGreaterThanOrEqual(2);
      const total = (meal.items ?? []).reduce((s, i) => s + i.calories, 0);
      expect(Math.abs(total - 772) / 772).toBeLessThanOrEqual(0.2);
      for (const item of meal.items ?? []) {
        const grounded = groundItemToLibrary({
          food: item.food,
          amount: item.amount,
          calories: item.calories,
        });
        if (!grounded) continue;
        expect(
          Math.abs(item.calories - grounded.calories) / grounded.calories,
          `«${item.food}» saved ${item.calories} vs anchored ${grounded.calories}`,
        ).toBeLessThanOrEqual(0.35);
      }
    }
  }, 120_000);

  it("the keto meal swap (ai_jobs#a26cf95e class) stays inside the keto meal carb ceiling under the REAL grounding", async () => {
    for (let draw = 0; draw < 4; draw++) {
      const res = await regenerateMeal(
        {
          name: "الغداء",
          items: [
            { food: "سمك مكاريل مشوي", amount: "166 جم", calories: 340 },
            { food: "أفوكادو", amount: "120 جم", calories: 192 },
            { food: "لبن رايب", amount: "110 جم", calories: 44 },
            { food: "زيت زيتون", amount: "27 جم", calories: 239 },
          ],
        },
        815,
        KETO_CTX,
        "",
        ["الفطار", "بيض كامل مسلوق", "زيت زيتون", "لبن رايب", "العشاء", "لحم ضأن مشوي", "أفوكادو"],
        undefined,
        "keto",
      );
      expect(res.source).toBe("local-fallback:meal-swap");
      const meal = res.meal as unknown as { items: SavedItem[] };
      const carbs = (meal.items ?? []).reduce((s, i) => s + (Number(i.carbs_g) || 0), 0);
      expect(carbs, `draw ${draw}: keto meal carbs ${carbs}g`).toBeLessThanOrEqual(25.05);
      const total = (meal.items ?? []).reduce((s, i) => s + i.calories, 0);
      expect(Math.abs(total - 815) / 815).toBeLessThanOrEqual(0.2);
    }
  }, 120_000);
});
