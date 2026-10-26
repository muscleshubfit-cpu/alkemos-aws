import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * REGEN-ROOTCAUSE-2 — PERSISTENCE battery (owner order 2026-10-26 item 3:
 * «اختبر إعادة التوليد من البداية للنهاية، بما يشمل حفظ الخطة الجديدة…
 * وعدم فقد الخطة السابقة عند فشل التوليد»).
 *
 * Pins the RUNNER-side materialization contract around the regeneration
 * lifecycle:
 *   - a generation FAILURE never writes anything — the client's previous
 *     plan survives verbatim (the ordering law: materializePlanDraftRow
 *     runs only AFTER the generator returns);
 *   - a SUCCESS inserts the replacement draft BEFORE any superseded-draft
 *     cleanup, and the cleanup only ever deletes unapproved,
 *     never-activated rows (an approved plan is untouchable);
 *   - the swap-quota ledger insert carries plan_id NULL — the legacy
 *     "api-swap" placeholder failed EVERY insert against the uuid column
 *     (measured: the runner log's «invalid input syntax for type uuid» +
 *     the production plan_swaps table had ZERO rows — weekly swap quotas
 *     were never enforced).
 */

const dbState = vi.hoisted(() => {
  const state = {
    inserts: [] as Array<Record<string, unknown>>,
    deletes: [] as Array<{ col: string; val: string }>,
    updates: [] as Array<Record<string, unknown>>,
    oldPlanRow: null as Record<string, unknown> | null,
    insertId: "22222222-3333-4444-5555-666666666666",
    generatorThrows: false,
    tierInserts: [] as Array<Record<string, unknown>>[],
  };
  return { state };
});

vi.mock("@/lib/plan-generator", () => ({
  // Controlled generator: the real engine's contract is pinned by
  // regen-rootcause2.test.ts against the real library — here we only
  // steer SUCCESS vs FAILURE to pin the runner's persistence ordering.
  generateNutritionPlanAI: vi.fn(async () => {
    if (dbState.state.generatorThrows) {
      throw new Error("تعذر إنتاج خطة متوافقة محليًا — أوقفنا الحفظ (test)");
    }
    return {
      title: "خطة تغذية - عميل اختبار",
      source: "local-fallback",
      content: {
        overview: "خطة اختبار",
        daily_calories: 2000,
        macros: { protein_g: 150, carbs_g: 200, fat_g: 60 },
        meals: [
          {
            name: "الفطار",
            items: [{ food: "بيض مقلي", amount: "150 جم", calories: 294, protein_g: 20.4 }],
            total_calories: 294,
          },
        ],
      },
    };
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: (table: string) => {
      if (table !== "plans" && table !== "plan_swaps") {
        throw new Error(`unexpected table ${table}`);
      }
      if (table === "plan_swaps") {
        const tierChain = {
          insert: (payload: Record<string, unknown>) => {
            dbState.state.tierInserts.push([payload]);
            return { error: null };
          },
        };
        return tierChain;
      }
      // plans builder
      const selectChain = {
        eq: (_c: string, _v: string) => selectChain,
        maybeSingle: async () => ({ data: dbState.state.oldPlanRow, error: null }),
      };
      const deleteChain = {
        eq: (col: string, val: string) => {
          dbState.state.deletes.push({ col, val });
          return deleteChain;
        },
        then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      };
      const insertChain = {
        select: () => ({
          single: async () => ({ data: { id: dbState.state.insertId }, error: null }),
        }),
      };
      return {
        select: () => selectChain,
        insert: (payload: Record<string, unknown>) => {
          dbState.state.inserts.push(payload);
          return insertChain;
        },
        delete: () => deleteChain,
        update: (payload: Record<string, unknown>) => {
          dbState.state.updates.push(payload);
          return { eq: () => ({ then: (r: (v: unknown) => void) => r({ data: null, error: null }) }) };
        },
      };
    },
  },
}));

import { PROCESSORS } from "@/lib/ai-job-processors";
import { recordSwapUsage } from "@/lib/tier-limits";

const CLIENT_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const OLD_DRAFT_ID = "11111111-2222-3333-4444-555555555555";

const planPayload = (extra: Record<string, unknown> = {}) => ({
  clientId: CLIENT_ID,
  clientContext: {
    name: "عميل اختبار",
    nutrition: { gender: "male", weight: "80", height: "180", age: "30", meals: "3", diet: "متوازن" },
    fitness: { days: "3", goal: "بناء العضلات", activity: "متوسط" },
    recent_measurements: [],
    recent_plan_names: [],
  },
  overrides: {},
  ...extra,
});

beforeEach(() => {
  dbState.state.inserts.length = 0;
  dbState.state.deletes.length = 0;
  dbState.state.updates.length = 0;
  dbState.state.tierInserts.length = 0;
  dbState.state.generatorThrows = false;
  dbState.state.oldPlanRow = null;
});

describe("REGEN-ROOTCAUSE-2 — regeneration failure NEVER loses the previous plan", () => {
  it("a generator throw propagates with ZERO plan writes (no insert/update/delete — the old plan survives verbatim)", async () => {
    dbState.state.generatorThrows = true;
    await expect(PROCESSORS.plan_nutrition(planPayload())).rejects.toThrow("أوقفنا الحفظ");
    expect(dbState.state.inserts).toEqual([]);
    expect(dbState.state.updates).toEqual([]);
    expect(dbState.state.deletes).toEqual([]);
  });
});

describe("REGEN-ROOTCAUSE-2 — regeneration success materializes BEFORE any cleanup", () => {
  it("inserts the new draft (materialized: true, plan_id) — the receipt the browser flow trusts", async () => {
    const res = (await PROCESSORS.plan_nutrition(planPayload())) as Record<string, unknown>;
    expect(res.materialized).toBe(true);
    expect(res.plan_id).toBe(dbState.state.insertId);
    expect(dbState.state.inserts).toHaveLength(1);
    expect(dbState.state.inserts[0]).toMatchObject({
      client_id: CLIENT_ID,
      status: "draft",
      is_current: false,
    });
    // no replacePlanId → no cleanup at all
    expect(dbState.state.deletes).toEqual([]);
  });

  it("an APPROVED superseded plan is NEVER deleted (untouchable — only unapproved drafts are)", async () => {
    dbState.state.oldPlanRow = { id: OLD_DRAFT_ID, status: "approved", is_current: true };
    await PROCESSORS.plan_nutrition(planPayload({ replacePlanId: OLD_DRAFT_ID }));
    expect(dbState.state.inserts).toHaveLength(1);
    expect(dbState.state.deletes).toEqual([]);
  });

  it("a still-draft superseded plan is deleted — AFTER the replacement insert landed (the ordering law)", async () => {
    dbState.state.oldPlanRow = { id: OLD_DRAFT_ID, status: "draft", is_current: false };
    await PROCESSORS.plan_nutrition(planPayload({ replacePlanId: OLD_DRAFT_ID }));
    expect(dbState.state.inserts).toHaveLength(1);
    // The guarded delete shape: .eq("id", OLD).eq("status", "draft").eq("is_current", false)
    expect(dbState.state.deletes).toEqual([
      { col: "id", val: OLD_DRAFT_ID },
      { col: "status", val: "draft" },
      { col: "is_current", val: false },
    ]);
  });
});

describe("REGEN-ROOTCAUSE-2 — the swap-quota ledger insert (the dead plan_swaps table)", () => {
  it("recordSwapUsage inserts plan_id NULL — never the legacy «api-swap» placeholder that failed every insert on the uuid column", async () => {
    await recordSwapUsage("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "meal");
    expect(dbState.state.tierInserts).toHaveLength(1);
    const [payload] = dbState.state.tierInserts[0];
    expect(payload).toMatchObject({
      user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      swap_type: "meal",
    });
    expect(payload.plan_id).toBeNull();
    expect(JSON.stringify(payload)).not.toContain("api-swap");
  });

  // PLAN-TYPE 2026-10-27 (live QA round defect #2): the production
  // plan_swaps carries a NOT NULL plan_type the insert never filled —
  // every ledger row died on it (GHA drain run 40246588409). The insert
  // must now carry the derived plan type AND report its truth.
  it("recordSwapUsage fills the live NOT NULL plan_type (meal swap → 'meal', exercise swap → 'workout') and returns the insert's truth", async () => {
    await expect(recordSwapUsage("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "meal")).resolves.toBe(true);
    expect(dbState.state.tierInserts).toHaveLength(1);
    expect(dbState.state.tierInserts[0][0]).toMatchObject({
      plan_type: "meal",
      swap_type: "meal",
    });

    await expect(recordSwapUsage("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "exercise")).resolves.toBe(true);
    expect(dbState.state.tierInserts).toHaveLength(2);
    expect(dbState.state.tierInserts[1][0]).toMatchObject({
      plan_type: "workout",
      swap_type: "exercise",
    });
  });
});
