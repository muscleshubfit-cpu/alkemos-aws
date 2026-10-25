import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * MEMBER-SWAP-DURABILITY battery (owner order 2026-10-26, items 1-2 —
 * «نفّذ تدقيقًا جذريًا وإصلاحًا فعليًا لمنظومة الخطط والاشتراكات… توحيد
 * مصدر الخطط… وأن تبديل الوجبة أو الصنف يُحفظ ويظهر في جميع الواجهات
 * المعنية»).
 *
 * THE MEASURED GAP (live ai_jobs, 2026-10-25): the coach's meal/item swaps
 * carried planId + clientId + indices (368 law) and materialized
 * server-side — but the MEMBER's PlansView swaps (and EVERY exercise swap,
 * coach or member) carried NO plan targets: the runner's
 * materializeSwapIntoPlan returned {materialized:false} and the result
 * lived ONLY in the browser poller. A closed tab lost the swap — the exact
 * 13:29Z failure class 368 fixed for coach meal/item swaps only.
 *
 * Plus the OWNERSHIP DEFENSE: the payload's planId/clientId are
 * browser-supplied; the runner now re-verifies the REQUESTER
 * (ai_jobs.requested_by) before any service-role write — a hostile member
 * targeting another member's plan can no longer write through the queue.
 */

const dbState = vi.hoisted(() => {
  const state = {
    planRow: null as Record<string, unknown> | null,
    requesterProfile: null as Record<string, unknown> | null,
    coachAssignment: null as Record<string, unknown> | null,
    siteAssignment: null as Record<string, unknown> | null,
    updates: [] as Array<{ id: string; content: unknown }>,
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
  loadEvoNutritionKnowledge: async () => ({ swapBlock: "", knowledgeBlock: "" }),
}));

vi.mock("@/lib/social-posts", () => ({
  generateSocialPost: async () => ({}),
}));

vi.mock("@/lib/blog-topics", () => ({
  pickSmartTopic: async () => "t",
}));

vi.mock("@/lib/blog-images", () => ({
  fetchFeaturedImage: async () => null,
  embedBodyImages: async () => null,
  getRecentFeaturedImageUrls: async () => [],
}));

vi.mock("@/lib/evo-nutrition-learning", () => ({
  diffFoodNames: () => ({ removed: [], added: [] }),
  mergeSwapPayload: () => ({ count: 0 }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: (table: string) => {
      const rowsFor = (): Record<string, unknown>[] => {
        if (table === "plans") return dbState.state.planRow ? [dbState.state.planRow] : [];
        if (table === "profiles") return dbState.state.requesterProfile ? [dbState.state.requesterProfile] : [];
        if (table === "coach_assignments") return dbState.state.coachAssignment ? [dbState.state.coachAssignment] : [];
        if (table === "site_coach_assignments") return dbState.state.siteAssignment ? [dbState.state.siteAssignment] : [];
        return [];
      };
      const selectChain = {
        eq: (_col: string, _val: string) => selectChain,
        maybeSingle: async () => ({ data: rowsFor()[0] ?? null, error: null }),
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
  applyExerciseSwapToContent,
  PROCESSORS,
} from "@/lib/ai-job-processors";

const PLAN_ID = "11111111-2222-3333-4444-555555555555";
const CLIENT_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const MEMBER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"; // the plan's owner
const ATTACKER_ID = "99999999-8888-7777-6666-555555555555";
const COACH_ID = "22222222-2222-2222-2222-222222222222";

function savedWorkoutContent() {
  return {
    overview: "برنامج 3 أيام",
    days: [
      {
        day: "اليوم ١",
        focus: "صدر",
        exercises: [
          { name: "بنش برس", sets: 4, reps: "8-10", rest: "90 ثانية", notes: "" },
          { name: "تفتيح دمبل", sets: 3, reps: "12", rest: "60 ثانية", notes: "" },
        ],
      },
      {
        day: "اليوم ٢",
        focus: "ظهر",
        exercises: [
          { name: "سحب أرضي", sets: 4, reps: "8", rest: "90 ثانية", notes: "" },
        ],
      },
    ],
  };
}

beforeEach(() => {
  dbState.state.planRow = null;
  dbState.state.requesterProfile = null;
  dbState.state.coachAssignment = null;
  dbState.state.siteAssignment = null;
  dbState.state.updates = [];
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 1 — exercise_regenerate joins the plan-target whitelist                    */
/* ──────────────────────────────────────────────────────────────────────── */

describe("MEMBER-SWAP-DURABILITY 1 — exercise_regenerate keeps the plan targets", () => {
  it("planId + clientId + dayIdx + exIdx ride the sanitized payload", () => {
    const payload = sanitizeJobPayload("exercise_regenerate", {
      exercise: { name: "بنش برس", sets: 4, reps: "8-10", rest: "90 ثانية", focus: "صدر" },
      planId: PLAN_ID,
      clientId: CLIENT_ID,
      dayIdx: 1,
      exIdx: 0,
      location: "gym",
    }) as Record<string, unknown>;
    expect(payload.planId).toBe(PLAN_ID);
    expect(payload.clientId).toBe(CLIENT_ID);
    expect(payload.dayIdx).toBe(1);
    expect(payload.exIdx).toBe(0);
  });

  it("hostile values degrade silently (strict UUID + bounded indices)", () => {
    const payload = sanitizeJobPayload("exercise_regenerate", {
      exercise: { name: "x" },
      planId: "'; drop table plans; --",
      clientId: 42,
      dayIdx: -3,
      exIdx: -1,
    }) as Record<string, unknown>;
    expect(payload.planId).toBeUndefined();
    expect(payload.clientId).toBeUndefined();
    expect(payload.dayIdx).toBeUndefined();
    expect(payload.exIdx).toBeUndefined();
    // Oversized indices CLAMP to the ceiling (the mealIdx bounding law):
    const clamped = sanitizeJobPayload("exercise_regenerate", {
      exercise: { name: "x" },
      dayIdx: 1e9,
      exIdx: 1e9,
    }) as Record<string, unknown>;
    expect(clamped.dayIdx).toBe(20);
    expect(clamped.exIdx).toBe(30);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 2 — applyExerciseSwapToContent (the pure transform)                       */
/* ──────────────────────────────────────────────────────────────────────── */

describe("MEMBER-SWAP-DURABILITY 2 — applyExerciseSwapToContent", () => {
  it("MERGES the replacement over the old exercise (the editor's exact semantics)", () => {
    const next = applyExerciseSwapToContent(savedWorkoutContent(), 0, 1, {
      name: "ضغط صدر دمبل",
      sets: 3,
    });
    expect(next).not.toBeNull();
    const ex = (next!.days as Array<{ exercises: Array<Record<string, unknown>> }>)[0].exercises[1];
    expect(ex.name).toBe("ضغط صدر دمبل"); // replaced
    expect(ex.sets).toBe(3); // replaced
    expect(ex.reps).toBe("12"); // old field SURVIVES the merge
    // the OTHER exercises are untouched
    const ex0 = (next!.days as Array<{ exercises: Array<Record<string, unknown>> }>)[0].exercises[0];
    expect(ex0.name).toBe("بنش برس");
  });

  it("out-of-range indices / wrong shapes / nameless replacements return null (never throw)", () => {
    expect(applyExerciseSwapToContent(savedWorkoutContent(), 5, 0, { name: "x" })).toBeNull();
    expect(applyExerciseSwapToContent(savedWorkoutContent(), 0, 9, { name: "x" })).toBeNull();
    expect(applyExerciseSwapToContent({ noDays: true }, 0, 0, { name: "x" })).toBeNull();
    expect(applyExerciseSwapToContent(savedWorkoutContent(), 0, 1, { sets: 3 })).toBeNull();
    expect(applyExerciseSwapToContent(null, 0, 0, { name: "x" })).toBeNull();
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 3 — the runner persists exercise swaps (dead-tab survival)                */
/* ──────────────────────────────────────────────────────────────────────── */

describe("MEMBER-SWAP-DURABILITY 3 — exercise_regenerate materializes server-side", () => {
  it("the member's swap lands in the workout plan row (the poller is no longer the only writer)", async () => {
    dbState.state.planRow = { id: PLAN_ID, client_id: CLIENT_ID, type: "workout", content: savedWorkoutContent() };
    dbState.state.requesterProfile = { role: "client", id: MEMBER_ID };
    const result = await PROCESSORS["exercise_regenerate"](
      {
        exercise: { name: "تفتيح دمبل", sets: 3, reps: "12", rest: "60 ثانية", focus: "صدر" },
        location: "gym",
        planId: PLAN_ID,
        clientId: CLIENT_ID,
        dayIdx: 0,
        exIdx: 1,
      },
      { requestedBy: MEMBER_ID },
    );
    expect(result.materialized).toBe(true);
    expect(result.plan_id).toBe(PLAN_ID);
    expect(dbState.state.updates).toHaveLength(1);
    const merged = dbState.state.updates[0].content as {
      days: Array<{ exercises: Array<Record<string, unknown>> }>;
    };
    // The target slot was REPLACED with a real library-backed exercise
    // (deterministic fallback — the pool draws a safe chest alternative):
    const replaced = merged.days[0].exercises[1];
    expect(typeof replaced.name).toBe("string");
    expect(replaced.name.length).toBeGreaterThan(1);
    expect(replaced.sets).toBeGreaterThanOrEqual(1);
    // The OTHER slot + day are untouched:
    expect(merged.days[0].exercises[0].name).toBe("بنش برس");
    expect(merged.days[1].exercises[0].name).toBe("سحب أرضي");
  });

  it("a meal-plan target under exercise_regenerate is skipped (type mismatch — no cross-type writes)", async () => {
    dbState.state.planRow = { id: PLAN_ID, client_id: CLIENT_ID, type: "meal", content: { meals: [] } };
    dbState.state.requesterProfile = { role: "client", id: MEMBER_ID };
    const result = await PROCESSORS["exercise_regenerate"](
      {
        exercise: { name: "بنش برس" },
        planId: PLAN_ID,
        clientId: CLIENT_ID,
        dayIdx: 0,
        exIdx: 0,
      },
      { requestedBy: MEMBER_ID },
    );
    expect(result.materialized).toBeUndefined();
    expect(dbState.state.updates).toHaveLength(0);
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* 4 — the OWNERSHIP DEFENSE (the IDOR class this frame kills)               */
/* ──────────────────────────────────────────────────────────────────────── */

describe("MEMBER-SWAP-DURABILITY 4 — the runner ownership defense", () => {
  it("a hostile member targeting ANOTHER member's plan: materialization SKIPS, plan untouched (IDOR blocked)", async () => {
    dbState.state.planRow = { id: PLAN_ID, client_id: CLIENT_ID, type: "meal", content: { meals: [] } };
    dbState.state.requesterProfile = { role: "client", id: ATTACKER_ID };
    const result = await PROCESSORS["meal_regenerate"](
      {
        meal: { name: "الغداء", items: [{ food: "x", amount: "1 جم", calories: 10 }] },
        planId: PLAN_ID, // the victim's plan
        clientId: CLIENT_ID, // the attacker forges BOTH ids
        mealIdx: 0,
        targetCalories: 500,
      },
      { requestedBy: ATTACKER_ID },
    );
    // The job still finishes done (best-effort law) but NOT A BYTE lands:
    expect(result.materialized).toBeUndefined();
    expect(dbState.state.updates).toHaveLength(0);
  });

  it("the plan's OWNER member materializes normally (his own plan)", async () => {
    dbState.state.planRow = {
      id: PLAN_ID,
      client_id: CLIENT_ID,
      type: "meal",
      content: {
        overview: "خطة",
        daily_calories: 1500,
        meals: [
          {
            name: "الفطار",
            items: [
              { food: "بيض مسلوق", amount: "150 جم", calories: 233, protein_g: 20 },
            ],
            total_calories: 233,
            total_protein_g: 20,
          },
        ],
        meals_total_calories: 233,
      },
    };
    dbState.state.requesterProfile = { role: "client", id: MEMBER_ID };
    const result = await PROCESSORS["meal_regenerate"](
      {
        meal: { name: "الفطار", items: [{ food: "بيض مسلوق", amount: "150 جم", calories: 233 }] },
        planId: PLAN_ID,
        clientId: CLIENT_ID,
        mealIdx: 0,
        targetCalories: 233,
      },
      { requestedBy: MEMBER_ID },
    );
    expect(result.materialized).toBe(true);
    expect(dbState.state.updates).toHaveLength(1);
  });

  it("the ASSIGNED coach materializes (coach_assignments row)", async () => {
    dbState.state.planRow = {
      id: PLAN_ID,
      client_id: CLIENT_ID,
      type: "meal",
      content: {
        overview: "خطة",
        meals: [
          { name: "الفطار", items: [{ food: "بيض", amount: "100 جم", calories: 155 }], total_calories: 155 },
        ],
        meals_total_calories: 155,
      },
    };
    dbState.state.requesterProfile = { role: "coach", id: COACH_ID };
    dbState.state.coachAssignment = { coach_id: COACH_ID, client_id: CLIENT_ID };
    const result = await PROCESSORS["meal_regenerate"](
      {
        meal: { name: "الفطار", items: [{ food: "بيض", amount: "100 جم", calories: 155 }] },
        planId: PLAN_ID,
        clientId: CLIENT_ID,
        mealIdx: 0,
      },
      { requestedBy: COACH_ID },
    );
    expect(result.materialized).toBe(true);
    expect(dbState.state.updates).toHaveLength(1);
  });

  it("an UNRESOLVED requester (no profile) skips materialization — fail-closed at the defense layer", async () => {
    dbState.state.planRow = { id: PLAN_ID, client_id: CLIENT_ID, type: "meal", content: { meals: [] } };
    dbState.state.requesterProfile = null;
    const result = await PROCESSORS["meal_regenerate"](
      {
        meal: { name: "x", items: [{ food: "y", amount: "1 جم", calories: 10 }] },
        targetCalories: 300,
        planId: PLAN_ID,
        clientId: CLIENT_ID,
        mealIdx: 0,
      },
      { requestedBy: ATTACKER_ID },
    );
    expect(result.materialized).toBeUndefined();
    expect(dbState.state.updates).toHaveLength(0);
  });

  it("legacy jobs (no requested_by) keep the pre-frame behavior — materialize (backward compatible)", async () => {
    dbState.state.planRow = {
      id: PLAN_ID,
      client_id: CLIENT_ID,
      type: "meal",
      content: {
        overview: "خطة",
        meals: [
          { name: "الفطار", items: [{ food: "بيض", amount: "100 جم", calories: 155 }], total_calories: 155 },
        ],
        meals_total_calories: 155,
      },
    };
    const result = await PROCESSORS["meal_regenerate"](
      {
        meal: { name: "الفطار", items: [{ food: "بيض", amount: "100 جم", calories: 155 }] },
        planId: PLAN_ID,
        clientId: CLIENT_ID,
        mealIdx: 0,
      },
      { requestedBy: null },
    );
    expect(result.materialized).toBe(true);
    expect(dbState.state.updates).toHaveLength(1);
  });
});
