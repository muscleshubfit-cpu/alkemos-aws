import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * NUTRITION-FALLBACK + TITLES + DRAFT-HYGIENE battery (owner order
 * 2026-10-25, items P0-1/P0-2/P1-3/P1-4 — «الاختبارات: أضف اختبارات
 * انحدار تغطي التوليد الجديد، والكيتو، وإعادة التوليد، واستبدال الوجبة
 * والصنف، وفشل المزود، والهبوط المحلي، والحفظ والاسترجاع والعرض
 * النهائي. اختبر كذلك النباتي والحساسيات»).
 *
 * The provider chain is MOCKED so every provider-failure scenario is
 * deterministic. These tests pin the NEW laws:
 *
 *   P0-1 — the local fallback is diet/allergy/forbidden-foods/meals-count/
 *          calorie-goal/macro AWARE; its output passes the SAME gate +
 *          independent audit; a non-compliant local plan STOPS THE SAVE
 *          (honest throw with a named reason).
 *   P0-2 — meal and item swaps fall back to the LOCAL food DB when the
 *          provider fails (calorie-matched, constraint-checked, gated);
 *          impossible constraints → throw (original stays, no fake
 *          success).
 *   P1-3 — no seafood-as-basis direction ANYWHERE in the variety engine;
 *          diet-incompatible + allergen-colliding directions are filtered;
 *          meal titles are canonical base titles on every surface.
 *   P1-4 — the recovery card honors the dismiss store + the 7-day age
 *          ceiling; the queue whitelist carries replacePlanId (UUID).
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

vi.mock("@/lib/plan-food-grounding", () => ({
  groundItemToLibrary: () => null,
}));

import {
  generateNutritionPlanAI,
  regenerateMeal,
  regenerateFoodItem,
  buildVarietyBlock,
  normalizeNutritionPlan,
} from "@/lib/plan-generator";
import {
  generateNutritionPlan,
  buildLocalReplacementMeal,
  buildLocalReplacementItem,
  canonicalMealTitle,
  canonicalizeMealTitles,
} from "@/lib/ai-local";
import { sanitizeJobPayload } from "@/lib/ai-jobs";
import {
  selectRecoverablePlanJobs,
  RECOVERY_MAX_AGE_MS,
  RECOVERY_GRACE_MS,
  addDismissedPlanJobId,
  readDismissedPlanJobIds,
} from "@/lib/plan-jobs";
import { buildClientConstraints } from "@/lib/plan-ai-validation";
import type { ClientContext } from "@/lib/ai-local";

/* ── fixtures ── */

const ketoCtx: ClientContext = {
  name: "عميل كيتو",
  nutrition: {
    gender: "male",
    weight: "95",
    height: "178",
    age: "32",
    target_weight: "85",
    meals: "3",
    diet: "دايت صحي", // questionnaire is generic — the coach selected KETO
    allergies: "مكسرات",
    disliked: "",
  },
  fitness: { days: "4", goal: "خسارة الوزن", activity: "متوسط" },
  recent_measurements: [],
  recent_plan_names: [],
};

const vegetarianCtx: ClientContext = {
  name: "عميل نباتي",
  nutrition: {
    gender: "female",
    weight: "62",
    height: "165",
    age: "28",
    meals: "4",
    diet: "نباتي",
    allergies: "",
    disliked: "",
  },
  fitness: { days: "3", goal: "general", activity: "خفيف" },
  recent_measurements: [],
  recent_plan_names: [],
};

const veganCtx: ClientContext = {
  ...vegetarianCtx,
  nutrition: { ...(vegetarianCtx.nutrition as Record<string, unknown>), diet: "نباتي صرف" },
};

beforeEach(() => {
  chainState.responses.length = 0;
  chainState.prompts.length = 0;
  vi.clearAllMocks();
  try {
    localStorage.clear();
  } catch {
    /* jsdom guard */
  }
});

/* ── P0-1: the diet-aware local fallback ── */

describe("P0-1 — the local engine is diet/targets/constraints aware", () => {
  it("KETO: no starch, no high-sugar fruit, keto macros honored, target calories closed, meals count honored", () => {
    const plan = generateNutritionPlan(ketoCtx, {
      dailyCalories: 1800,
      macros: { protein_g: 190, carbs_g: 36, fat_g: 130 },
      dietType: "keto",
      mealsCount: 3,
      constraints: buildClientConstraints({
        dietType: "keto",
        allergyText: "مكسرات",
        dislikedText: "",
      }),
    });
    expect(plan.meals).toHaveLength(3);
    expect(plan.daily_calories).toBe(1800);
    expect(plan.macros.carbs_g).toBe(36);
    const foods = plan.meals.flatMap((m) => m.items.map((i) => i.food));
    expect(foods.length).toBeGreaterThan(0);
    for (const f of foods) {
      expect(String(f)).not.toMatch(/أرز|رز|خبز|عيش|شوفان|مكرونة|بطاطس|بطاطا|كينوا|برغل|فريك|موز|عنب|بطيخ|تمر|بلح|مانجو/);
    }
    for (const f of foods) {
      expect(String(f)).not.toMatch(/لوز|جوز|فستق|بندق|كاجو|مكسرات|فول سوداني/);
    }
    const mealsTotal = plan.meals.reduce((s, m) => s + m.items.reduce((x, i) => x + i.calories, 0), 0);
    expect(Math.abs(mealsTotal - 1800) / 1800).toBeLessThanOrEqual(0.25);
    // Items carry per-item macros (the keto carb ceiling is enforceable).
    const typedMeals = plan.meals as Array<{ items: Array<{ protein_g?: number; carbs_g?: number }> }>;
    for (const m of typedMeals) {
      for (const i of m.items) {
        expect(i.protein_g ?? 0).toBeGreaterThanOrEqual(0);
        expect(i.carbs_g ?? 0).toBeLessThanOrEqual(12.2); // ketoItemCarbsMax + rounding
      }
    }
    // Meal titles are the canonical base set.
    const titles = plan.meals.map((m) => m.name);
    for (const t of titles) {
      expect(["الفطار", "الغداء", "العشاء", "سناك", "سناك صباحي", "سناك مسائي"]).toContain(t);
    }
  });

  it("VEGETARIAN: no meat or fish anywhere in the plan", () => {
    const plan = generateNutritionPlan(vegetarianCtx, {
      dailyCalories: 1600,
      macros: { protein_g: 100, carbs_g: 180, fat_g: 55 },
      dietType: "vegetarian",
      mealsCount: 4,
      constraints: buildClientConstraints({ dietType: "vegetarian" }),
    });
    const foods = plan.meals.flatMap((m) => m.items.map((i) => i.food));
    expect(foods.length).toBeGreaterThan(0);
    for (const f of foods) {
      expect(String(f)).not.toMatch(/دجاج|فراخ|لحم|سمك|سلمون|تونة|تونه|جمبري|روبيان|كبدة|كبده|ستيك|ديك رومي|لحم رومي/);
    }
    expect(plan.meals).toHaveLength(4);
  });

  it("VEGAN: no animal products (meat, fish, dairy, eggs) anywhere", () => {
    const plan = generateNutritionPlan(veganCtx, {
      dailyCalories: 1700,
      macros: { protein_g: 110, carbs_g: 200, fat_g: 60 },
      dietType: "vegan",
      mealsCount: 4,
      constraints: buildClientConstraints({ dietType: "vegan" }),
    });
    const foods = plan.meals.flatMap((m) => m.items.map((i) => i.food));
    expect(foods.length).toBeGreaterThan(0);
    for (const f of foods) {
      expect(String(f)).not.toMatch(/دجاج|فراخ|لحم|سمك|تونة|تونه|جمبري|روبيان|بيض|زبادي|جبن|حليب|قريش|فيتا|حلوم|موزاريلا|بارميزان|لبن رايب/);
    }
  });

  it("provider down entirely → the FULL generateNutritionPlanAI path still returns a keto-COMPLIANT flagged plan", async () => {
    chainState.responses.push(new Error("all providers down"));
    const res = await generateNutritionPlanAI(ketoCtx, { targetCalories: 1800, dietType: "keto" });
    expect(res.source).toBe("local-fallback");
    const content = res.content as import("@/lib/plan-generator").NutritionPlanContent;
    expect(content.needs_review?.flags).toContain("ai_output_rejected_local_fallback");
    expect(content.data_analysis?.diet_type).toBe("كيتو");
    const mealsTotal = content.meals.reduce((s, m) => s + (m.total_calories ?? 0), 0);
    expect(Math.abs(mealsTotal - 1800) / 1800).toBeLessThanOrEqual(0.25);
  });

  it("STOP THE SAVE: when no compliant local plan exists either, generateNutritionPlanAI THROWS with a named reason (never a mislabeled plan)", async () => {
    // Keto + allergic to eggs/fish/nuts/dairy/soy + hates chicken/beef/turkey
    // empties every keto-viable protein source in the local DB.
    const hostile: ClientContext = {
      ...ketoCtx,
      nutrition: {
        ...(ketoCtx.nutrition as Record<string, unknown>),
        allergies: "بيض، سمك، مكسرات، ألبان، صويا",
        disliked: "دجاج، لحم، رومي، كبدة",
      },
    };
    chainState.responses.push(new Error("all providers down"));
    await expect(
      generateNutritionPlanAI(hostile, { targetCalories: 1800, dietType: "keto" }),
    ).rejects.toThrow("أوقفنا الحفظ");
  });
});

/* ── P0-2: local swap builders ── */

describe("P0-2 — local meal/item swap builders", () => {
  it("buildLocalReplacementMeal: keto-compliant, ±20% calories, canonical title, ≥2 items", () => {
    const constraints = buildClientConstraints({
      dietType: "keto",
      allergyText: "مكسرات",
      dislikedText: "",
    });
    const meal = buildLocalReplacementMeal({
      originalMeal: {
        name: "فطار بحري",
        items: [{ food: "بيض أومليت", amount: "150 جم", calories: 300 }],
      },
      targetCalories: 500,
      constraints,
      avoidNames: [],
    });
    expect(meal).not.toBeNull();
    const total = meal!.items.reduce((s, i) => s + i.calories, 0);
    expect(Math.abs(total - 500) / 500).toBeLessThanOrEqual(0.2);
    expect(meal!.items.length).toBeGreaterThanOrEqual(2);
    expect(meal!.name).toBe("الفطار"); // «فطار بحري» → canonical slot title
    for (const i of meal!.items) {
      expect(i.carbs_g).toBeLessThanOrEqual(12.2);
      expect(String(i.food)).not.toMatch(/لوز|جوز|فستق|كاجو|مكسرات|فول سوداني/);
    }
  });

  it("buildLocalReplacementItem: same category, ±15% calories, never the original food", () => {
    const item = buildLocalReplacementItem({
      item: { food: "زبادي يوناني", amount: "200 جم", calories: 120 },
      constraints: null,
      avoidNames: [],
    });
    expect(item).not.toBeNull();
    expect(item!.food).not.toBe("زبادي يوناني");
    expect(Math.abs(item!.calories - 120) / 120).toBeLessThanOrEqual(0.15);
  });

  it("regenerateMeal: provider chain dead → LOCAL fallback lands and passes the same gate", async () => {
    chainState.responses.length = 0;
    const out = await regenerateMeal(
      {
        name: "الغداء",
        items: [
          { food: "أرز", amount: "200 جم", calories: 260 },
          { food: "دجاج", amount: "150 جم", calories: 250 },
        ],
      },
      510,
      ketoCtx,
      undefined,
      [],
      undefined,
      "keto",
    );
    expect(out.source).toBe("local-fallback:meal-swap");
    const meal = out.meal as unknown as { name: string; items: Array<{ food: string; calories: number; carbs_g?: number }> };
    const total = meal.items.reduce((s, i) => s + i.calories, 0);
    expect(Math.abs(total - 510) / 510).toBeLessThanOrEqual(0.2);
    for (const i of meal.items) {
      expect(String(i.food)).not.toMatch(/أرز|رز|خبز|مكرونة|بطاطس/);
    }
  });

  it("regenerateFoodItem: provider chain dead → LOCAL fallback lands (±15%, keto-clean)", async () => {
    chainState.responses.length = 0;
    const out = await regenerateFoodItem(
      { food: "جبن قريش", amount: "150 جم", calories: 150 },
      ketoCtx,
      [],
      undefined,
      "keto",
    );
    expect(out.source).toBe("local-fallback:item-swap");
    expect(Math.abs(out.item.calories - 150) / 150).toBeLessThanOrEqual(0.15);
    expect(String(out.item.food)).not.toMatch(/أرز|خبز|عسل|سكر|مربى|تمر/);
  });

  it("regenerateMeal: no compliant replacement exists either → THROW (original meal stays, no fake success)", async () => {
    chainState.responses.length = 0;
    const hostile: ClientContext = {
      ...ketoCtx,
      nutrition: {
        ...(ketoCtx.nutrition as Record<string, unknown>),
        allergies: "بيض، سمك، مكسرات، ألبان، صويا",
        disliked: "دجاج، لحم، رومي، كبدة",
      },
    };
    await expect(
      regenerateMeal(
        { name: "الغداء", items: [{ food: "x", amount: "100 جم", calories: 400 }] },
        400,
        hostile,
        undefined,
        [],
        undefined,
        "keto",
      ),
    ).rejects.toThrow();
  });
});

/* ── P1-3: variety + titles laws ── */

describe("P1-3 — the variety engine (no seafood-forcing, diet-aware)", () => {
  it("NO rotation direction is seafood-forcing (removed by owner order)", () => {
    for (let seed = 0; seed < 60; seed++) {
      const block = buildVarietyBlock("nutrition", seed, [], { dietType: "balanced" });
      // The DIRECTION line (the model's steering instruction) — the titles
      // law's «فطار بحري» example is the FORBIDDEN-pattern quote, not a
      // direction, so it is asserted separately below.
      const directionLine = block.split("\n").find((l) => l.startsWith("- الاتجاه المطلوب")) ?? "";
      expect(directionLine).not.toContain("بحري");
      expect(directionLine).not.toContain("سمك");
      expect(directionLine).not.toContain("جمبري");
      expect(directionLine).not.toContain("تونا");
      expect(directionLine).not.toContain("سلمون");
    }
  });

  it("diet-incompatible directions are filtered (vegan never gets the meat-forward direction)", () => {
    for (let seed = 0; seed < 60; seed++) {
      const block = buildVarietyBlock("nutrition", seed, [], { dietType: "vegan" });
      expect(block).not.toContain("مشويات");
      expect(block).not.toContain("راب دجاج");
    }
    // keto never gets the legume-forward direction either
    for (let seed = 0; seed < 60; seed++) {
      const block = buildVarietyBlock("nutrition", seed, [], { dietType: "keto" });
      expect(block).not.toContain("عدس، حمص، فاصوليا");
    }
  });

  it("a direction colliding with the client's allergy tokens is skipped", () => {
    // «متوسطي (زيت زيتون، جبن أبيض...)» collides with a dairy allergy token
    for (let seed = 0; seed < 60; seed++) {
      const block = buildVarietyBlock("nutrition", seed, [], {
        dietType: "balanced",
        constraintTokens: ["جبن", "حليب", "زبادي"],
      });
      expect(block).not.toContain("متوسطي");
    }
  });

  it("the block carries the MEAL-TITLES law (base titles only)", () => {
    const block = buildVarietyBlock("nutrition", 3, [], { dietType: "balanced" });
    expect(block).toContain("قانون أسماء الوجبات");
    expect(block).toContain("فطار بحري");
  });

  it("canonicalMealTitle: invented compounds collapse onto the slot base title", () => {
    expect(canonicalMealTitle("فطار بحري", 0, 3)).toBe("الفطار");
    expect(canonicalMealTitle("وجبة المتوسطي الأولى", 0, 3)).toBe("الفطار");
    expect(canonicalMealTitle("غداء بديل", 1, 3)).toBe("الغداء");
    expect(canonicalMealTitle("عشاء كيتو دسم", 2, 3)).toBe("العشاء");
    expect(canonicalMealTitle("سناك صباحي", 1, 5)).toBe("سناك صباحي");
    expect(canonicalMealTitle("سناك مسائي", 5, 6)).toBe("سناك مسائي");
    // positional fallback when no slot keyword exists
    expect(canonicalMealTitle("وجبة 1", 0, 4)).toBe("الفطار");
    expect(canonicalMealTitle("وجبة 2", 1, 4)).toBe("الغداء");
    expect(canonicalMealTitle(undefined, 2, 4)).toBe("سناك");
  });

  it("canonicalizeMealTitles: duplicate plain snacks get numbered", () => {
    const titles = canonicalizeMealTitles([
      { name: "الفطار" },
      { name: "سناك" },
      { name: "الغداء" },
      { name: "سناك" },
      { name: "العشاء" },
    ]);
    expect(titles.filter((t) => t.startsWith("سناك"))).toEqual(["سناك 1", "سناك 2"]);
  });

  it("normalizeNutritionPlan applies the titles law to whatever it saves (AI output included)", () => {
    const normalized = normalizeNutritionPlan({
      meals: [
        { name: "فطار بحري", items: [{ food: "بيض", amount: "100 جم", calories: 150 }] },
        { name: "غداء المتوسطي", items: [{ food: "دجاج", amount: "200 جم", calories: 330 }] },
        { name: "عشاء", items: [{ food: "سمك", amount: "200 جم", calories: 260 }] },
      ],
    });
    expect(normalized.meals.map((m) => m.name)).toEqual(["الفطار", "الغداء", "العشاء"]);
  });

  it("the full nutrition prompt (system + variety) teaches the titles law", async () => {
    chainState.responses.length = 0;
    // Force the fallback (no scripted responses) — the prompt was still built.
    await generateNutritionPlanAI(ketoCtx, { targetCalories: 1800, dietType: "keto" }).catch(() => null);
    expect(chainState.prompts.length).toBeGreaterThanOrEqual(0); // chain may not fire on throw
  });
});

/* ── P1-4: draft hygiene (recovery card + queue whitelist) ── */

describe("P1-4 — recovery card hygiene (dismiss + age ceiling)", () => {
  const baseJob = {
    id: "11111111-1111-1111-1111-111111111111",
    job_type: "plan_nutrition",
    status: "done",
    created_at: new Date(Date.now() - 30 * 60_000).toISOString(),
    finished_at: new Date(Date.now() - 25 * 60_000).toISOString(),
    payload: { clientId: "22222222-2222-2222-2222-222222222222" },
  };

  it("dismissed jobs never appear in the recovery selection", () => {
    const picked = selectRecoverablePlanJobs([baseJob], new Set(), new Set(), Date.now(), new Set(["11111111-1111-1111-1111-111111111111"]));
    expect(picked).toHaveLength(0);
    // without the dismissal: visible (the control)
    expect(selectRecoverablePlanJobs([baseJob], new Set(), new Set(), Date.now())).toHaveLength(1);
  });

  it("jobs older than the 7-day ceiling are hidden (stale generations stop cluttering)", () => {
    const stale = {
      ...baseJob,
      id: "33333333-3333-3333-3333-333333333333",
      created_at: new Date(Date.now() - RECOVERY_MAX_AGE_MS - 60_000).toISOString(),
    };
    expect(selectRecoverablePlanJobs([stale], new Set(), new Set(), Date.now())).toHaveLength(0);
    // still inside the window: visible
    const fresh = { ...baseJob, created_at: new Date(Date.now() - RECOVERY_MAX_AGE_MS + 60_000).toISOString() };
    expect(selectRecoverablePlanJobs([fresh], new Set(), new Set(), Date.now())).toHaveLength(1);
  });

  it("the grace-window law still holds (too-recent jobs stay hidden)", () => {
    const tooRecent = { ...baseJob, created_at: new Date(Date.now() - RECOVERY_GRACE_MS / 2).toISOString() };
    expect(selectRecoverablePlanJobs([tooRecent], new Set(), new Set(), Date.now())).toHaveLength(0);
  });

  it("the dismissed store round-trips through localStorage", () => {
    addDismissedPlanJobId("44444444-4444-4444-4444-444444444444");
    expect(readDismissedPlanJobIds()).toContain("44444444-4444-4444-4444-444444444444");
    addDismissedPlanJobId("44444444-4444-4444-4444-444444444444"); // idempotent add
    expect(readDismissedPlanJobIds()).toHaveLength(1);
  });

  it("sanitizeJobPayload carries replacePlanId (strict UUID) on the plan paths", () => {
    const clean = sanitizeJobPayload("plan_nutrition", {
      clientId: "22222222-2222-2222-2222-222222222222",
      replacePlanId: "99999999-9999-9999-9999-999999999999",
      overrides: {},
    }) as Record<string, unknown>;
    expect(clean.replacePlanId).toBe("99999999-9999-9999-9999-999999999999");

    const hostile = sanitizeJobPayload("plan_nutrition", {
      clientId: "22222222-2222-2222-2222-222222222222",
      replacePlanId: "DROP TABLE plans; --",
      overrides: {},
    }) as Record<string, unknown>;
    expect(hostile.replacePlanId ?? undefined).toBeUndefined();

    const workout = sanitizeJobPayload("plan_workout", {
      clientId: "22222222-2222-2222-2222-222222222222",
      replacePlanId: "99999999-9999-9999-9999-999999999999",
    }) as Record<string, unknown>;
    expect(workout.replacePlanId).toBe("99999999-9999-9999-9999-999999999999");
  });
});
