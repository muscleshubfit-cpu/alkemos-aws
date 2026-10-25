import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * SWAP-DURABILITY battery (owner order item 1, 2026-10-25 — «أصلح تبديل
 * صنف واحد ووجبة كاملة من واجهة المدرب حتى نجاح الحفظ. تتبّع الأخطاء
 * الفعلية في API والطابور والمولد والبوابة، ولا تعتبر نجاح الاختبارات
 * الداخلية بديلًا عن إثبات المسار الكامل»).
 *
 * THE MEASURED PRODUCTION DEFECT this battery pins (read read-only from the
 * live rows, 2026-10-25): ai_jobs#2384a8a9 (food_item_regenerate) and
 * #3ee1bcea (meal_regenerate) — the owner's own live test, enqueued
 * 13:29Z — both landed `done` on the runner at 13:34/13:35Z, and their
 * results NEVER reached the client's saved plan. The swap result lived
 * ONLY in ai_jobs.result + a browser poller (runAiJob) that died when the
 * coach navigated off the plan editor mid-wait (the coach opened another
 * client's page 81 seconds after enqueue). Full-plan generation already
 * had server-side draft materialization; meal/item swaps were the last
 * result class whose persistence depended on a live tab.
 *
 * THE LAW: the swap payload carries planId + clientId + bounded indices
 * (sanitizeJobPayload whitelist), and the RUNNER applies the gated
 * replacement to plans.content server-side (fresh fetch → delta → shared
 * recomputeNutritionTotals). Best-effort — never job-fatal — but when it
 * lands, the swap survives navigation, reloads and dead tabs.
 */

const dbState = vi.hoisted(() => {
  const state = {
    planRow: null as Record<string, unknown> | null,
    updates: [] as Array<{ id: string; content: unknown }>,
    shouldFailFetch: false,
  };
  return { state };
});

vi.mock("@/lib/ai-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-provider")>();
  return {
    ...actual,
    callFreeAIFallbackChain: vi.fn(async () => {
      throw new Error("provider down — the local fallback path is the law under test");
    }),
  };
});

vi.mock("@/lib/plan-food-grounding", () => ({
  groundItemToLibrary: () => null,
}));

vi.mock("@/lib/evo-nutrition-knowledge.server", () => ({
  loadEvoNutritionKnowledge: async () => ({ swapBlock: "" }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: (table: string) => {
      if (table !== "plans") throw new Error(`unexpected table ${table}`);
      // Minimal builder: .select().eq().maybeSingle() and .update().eq()
      const row = dbState.state.planRow;
      const selectChain = {
        eq: (_col: string, _val: string) => selectChain,
        maybeSingle: async () => ({
          data: dbState.state.shouldFailFetch ? null : row,
          error: dbState.state.shouldFailFetch ? { message: "fetch failed (test)" } : null,
        }),
      };
      const updateChain = {
        eq: (col: string, val: string) => {
          if (col === "id") dbState.state.updates.push({ id: String(val), content: lastUpdatePayload.content });
          return updateChain;
        },
        then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      };
      let lastUpdatePayload = { content: null as unknown };
      return {
        select: () => selectChain,
        update: (payload: { content: unknown }) => {
          lastUpdatePayload = payload;
          return updateChain;
        },
      };
    },
  },
}));

import { sanitizeJobPayload } from "@/lib/ai-jobs";
import {
  applyMealSwapToContent,
  applyItemSwapToContent,
  PROCESSORS,
} from "@/lib/ai-job-processors";

const PLAN_ID = "11111111-2222-3333-4444-555555555555";
const CLIENT_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

/** A realistic saved nutrition plan (the shape the editor saves). */
function savedPlanContent() {
  return {
    overview: "خطة كيتو تجريبية",
    daily_calories: 1800,
    macros: { protein_g: 130, carbs_g: 40, fat_g: 130 },
    meals: [
      {
        name: "الفطار",
        items: [
          { food: "بيض كامل مسلوق", amount: "150 جم", calories: 233, protein_g: 20 },
          { food: "زيت زيتون", amount: "20 جم", calories: 177, fat_g: 20 },
        ],
        total_calories: 410,
        total_protein_g: 20,
      },
      {
        name: "الغداء",
        items: [
          { food: "صدر دجاج مشوي", amount: "200 جم", calories: 330, protein_g: 62 },
          { food: "زيت زيتون", amount: "25 جم", calories: 221, fat_g: 25 },
        ],
        total_calories: 551,
        total_protein_g: 62,
      },
      {
        name: "العشاء",
        items: [
          { food: "سمك بلطي مشوي", amount: "220 جم", calories: 282, protein_g: 57 },
          { food: "زبدة", amount: "20 جم", calories: 143, fat_g: 16 },
        ],
        total_calories: 425,
        total_protein_g: 57,
      },
    ],
    meals_total_calories: 1386,
  };
}

/* ──────────────────────────────────────────────────────────────────────── */
/* 1 — The payload whitelist: the swap targets ride the sanitized payload  */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-DURABILITY 1 — sanitizeJobPayload whitelists the plan targets", () => {
  it("meal_regenerate keeps planId + clientId + mealIdx (strict UUID + bounded index)", () => {
    const payload = sanitizeJobPayload("meal_regenerate", {
      meal: { name: "الغداء", items: [{ food: "x", amount: "1 جم", calories: 10 }] },
      planId: PLAN_ID,
      clientId: CLIENT_ID,
      mealIdx: 1,
      targetCalories: 815,
      dietType: "keto",
    }) as Record<string, unknown>;
    expect(payload.planId).toBe(PLAN_ID);
    expect(payload.clientId).toBe(CLIENT_ID);
    expect(payload.mealIdx).toBe(1);
    // Hostile shapes degrade silently — never stored, never trusted:
    const hostile = sanitizeJobPayload("meal_regenerate", {
      meal: { name: "x", items: [] },
      planId: "'; DROP TABLE plans; --",
      clientId: "not-a-uuid",
      mealIdx: -5,
    }) as Record<string, unknown>;
    expect(hostile.planId).toBeUndefined();
    expect(hostile.clientId).toBeUndefined();
    expect(hostile.mealIdx).toBeUndefined();
  });

  it("food_item_regenerate keeps planId + clientId + mealIdx + itemIdx", () => {
    const payload = sanitizeJobPayload("food_item_regenerate", {
      item: { food: "لبن رايب", amount: "245 جم", calories: 98 },
      meal_name: "الفطار",
      planId: PLAN_ID,
      clientId: CLIENT_ID,
      mealIdx: 0,
      itemIdx: 1,
      dietType: "keto",
    }) as Record<string, unknown>;
    expect(payload.planId).toBe(PLAN_ID);
    expect(payload.clientId).toBe(CLIENT_ID);
    expect(payload.mealIdx).toBe(0);
    expect(payload.itemIdx).toBe(1);
    const hostile = sanitizeJobPayload("food_item_regenerate", {
      item: { food: "x", amount: "1 جم", calories: 10 },
      itemIdx: 999,
    }) as Record<string, unknown>;
    expect(hostile.itemIdx).toBe(40); // clamped to the bounded ceiling
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 2 — The pure content transforms (the editor's exact semantics)          */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-DURABILITY 2 — applyMealSwapToContent / applyItemSwapToContent", () => {
  it("the MEAL transform replaces the meal and recomputes EVERY total (the editor's semantics)", () => {
    const replacement = {
      name: "الغداء",
      items: [
        { food: "لحم ضأن مشوي", amount: "180 جم", calories: 464, protein_g: 45 },
        { food: "طحينة", amount: "20 جم", calories: 119, fat_g: 11 },
        { food: "خيار", amount: "150 جم", calories: 22, carbs_g: 5.4 },
      ],
      total_calories: 99999, // model-provided totals are NEVER trusted
      total_protein_g: 999,
    };
    const next = applyMealSwapToContent(savedPlanContent(), 1, replacement);
    expect(next).not.toBeNull();
    expect(next!.meals[1].items[0].food).toBe("لحم ضأن مشوي");
    // Totals recomputed from items — not the model's claims:
    expect(next!.meals[1].total_calories).toBe(464 + 119 + 22);
    expect(next!.meals[1].total_protein_g).toBe(45);
    expect(next!.meals_total_calories).toBe(410 + 605 + 425);
    // The OTHER meals are untouched (delta-only — a concurrent coach edit
    // elsewhere in the row survives):
    expect(next!.meals[0].items[0].food).toBe("بيض كامل مسلوق");
    expect(next!.meals[2].items[0].food).toBe("سمك بلطي مشوي");
  });

  it("the ITEM transform MERGES over the old item (old alternatives survive) and recomputes", () => {
    const replacement = { food: "جبن قريش", amount: "100 جم", calories: 98, protein_g: 11, carbs_g: 3.4 };
    const next = applyItemSwapToContent(savedPlanContent(), 0, 0, replacement);
    expect(next).not.toBeNull();
    const item = next!.meals[0].items[0];
    expect(item.food).toBe("جبن قريش");
    expect(item.protein_g).toBe(11);
    expect(next!.meals[0].total_calories).toBe(98 + 177);
    expect(next!.meals_total_calories).toBe(275 + 551 + 425);
  });

  it("out-of-range indices / wrong shapes / itemless replacements return null (never throw)", () => {
    const content = savedPlanContent();
    expect(applyMealSwapToContent(content, 9, { items: [{ food: "x", amount: "1 جم", calories: 5 }] })).toBeNull();
    expect(applyMealSwapToContent(content, -1, { items: [] })).toBeNull();
    expect(applyMealSwapToContent({ overview: "no meals" }, 0, { items: [{ food: "x", amount: "1 جم", calories: 5 }] })).toBeNull();
    expect(applyMealSwapToContent(null, 0, { items: [] })).toBeNull();
    expect(applyMealSwapToContent(content, 0, { items: [] })).toBeNull();
    expect(applyItemSwapToContent(content, 0, 99, { food: "x", amount: "1 جم", calories: 5 })).toBeNull();
    expect(applyItemSwapToContent(content, 0, 0, { amount: "بلا اسم", calories: 5 })).toBeNull();
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 3 — The runner materializes the swap into the owning plans row          */
/* ──────────────────────────────────────────────────────────────────────── */

describe("SWAP-DURABILITY 3 — the runner persists the swap server-side", () => {
  beforeEach(() => {
    dbState.state.updates.length = 0;
    dbState.state.shouldFailFetch = false;
    dbState.state.planRow = {
      id: PLAN_ID,
      client_id: CLIENT_ID,
      type: "meal",
      content: savedPlanContent(),
    };
  });

  it("meal_regenerate: done → plans.content updated (the swap SURVIVES the dead-tab class) + result carries materialized", async () => {
    const result = (await PROCESSORS.meal_regenerate({
      meal: { name: "الغداء", items: [{ food: "صدر دجاج مشوي", amount: "200 جم", calories: 551 }] },
      targetCalories: 600,
      planId: PLAN_ID,
      clientId: CLIENT_ID,
      mealIdx: 1,
      dietType: "keto",
      avoid_names: [],
    })) as Record<string, unknown>;
    // The engine fell back to the local DB (provider down) — the law under
    // test is the PERSISTENCE, and the local fallback is gated too.
    expect(String(result.source)).toContain("local-fallback");
    expect(result.materialized).toBe(true);
    expect(result.plan_id).toBe(PLAN_ID);
    expect(dbState.state.updates).toHaveLength(1);
    const updated = dbState.state.updates[0].content as ReturnType<typeof savedPlanContent>;
    expect(updated.meals[1].items.length).toBeGreaterThanOrEqual(2);
    expect(updated.meals[1].items[0].food).not.toBe("صدر دجاج مشوي");
    // The recomputed totals ride the saved row:
    const recomputed = updated.meals[1].items.reduce((s, i) => s + i.calories, 0);
    expect(updated.meals[1].total_calories).toBe(recomputed);
  });

  it("food_item_regenerate: done → the ±15% replacement lands in the saved row", async () => {
    const result = (await PROCESSORS.food_item_regenerate({
      item: { food: "زيت زيتون", amount: "25 جم", calories: 221 },
      meal_name: "الغداء",
      planId: PLAN_ID,
      clientId: CLIENT_ID,
      mealIdx: 1,
      itemIdx: 1,
      dietType: "keto",
      avoid_names: ["بيض كامل مسلوق", "سمك بلطي مشوي"],
    })) as Record<string, unknown>;
    expect(result.materialized).toBe(true);
    expect(dbState.state.updates).toHaveLength(1);
    const updated = dbState.state.updates[0].content as ReturnType<typeof savedPlanContent>;
    expect(updated.meals[1].items[1].food).toBe(String((result.replacement as { food: string }).food));
    expect(updated.meals[1].items[0].food).toBe("صدر دجاج مشوي"); // delta-only
  });

  it("ownership mismatch → materialization SKIPS (the job still finishes done — best-effort law)", async () => {
    dbState.state.planRow = {
      id: PLAN_ID,
      client_id: "00000000-0000-0000-0000-000000000000", // a DIFFERENT client's plan
      type: "meal",
      content: savedPlanContent(),
    };
    const result = (await PROCESSORS.meal_regenerate({
      meal: { name: "الغداء", items: [{ food: "صدر دجاج مشوي", amount: "200 جم", calories: 551 }] },
      targetCalories: 600,
      planId: PLAN_ID,
      clientId: CLIENT_ID,
      mealIdx: 1,
      avoid_names: [],
    })) as Record<string, unknown>;
    expect(result.materialized).toBeUndefined();
    expect(dbState.state.updates).toHaveLength(0);
    expect(result.replacement).toBeTruthy(); // the in-session UI path still works
  });

  it("no plan targets in the payload (legacy jobs) → done without materialization (backward compatible)", async () => {
    const result = (await PROCESSORS.food_item_regenerate({
      item: { food: "زيت زيتون", amount: "25 جم", calories: 221 },
      meal_name: "الغداء",
      avoid_names: [],
    })) as Record<string, unknown>;
    expect(result.materialized).toBeUndefined();
    expect(dbState.state.updates).toHaveLength(0);
  });

  it("a DB hiccup NEVER fails the job (best-effort — the job stays done)", async () => {
    dbState.state.shouldFailFetch = true;
    const result = (await PROCESSORS.meal_regenerate({
      meal: { name: "الغداء", items: [{ food: "صدر دجاج مشوي", amount: "200 جم", calories: 551 }] },
      targetCalories: 600,
      planId: PLAN_ID,
      clientId: CLIENT_ID,
      mealIdx: 1,
      avoid_names: [],
    })) as Record<string, unknown>;
    expect(result.materialized).toBeUndefined();
    expect(result.replacement).toBeTruthy();
  });
});
