import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkSwapQuota, recordSwapUsage } from "@/lib/tier-limits";

/**
 * AI-PLAN-QUALITY 2026-10-24 (owner order item 4 — «تحديث الحصص المدفوعة
 * بصورة صحيحة») + AI-QUOTAS 2026-11-14 (the corrective order): the member
 * swap quota is SUCCESS-ONLY and became an INDEPENDENT MONTHLY quota per
 * type (premium 13 · pro 26 — evolved from the retired weekly 3/6 by
 * full-entitlement conversion). The enqueue gate (checkSwapQuota) checks
 * WITHOUT recording; the GHA runner records (recordSwapUsage) only when
 * the regeneration job lands `done` — a permanently failed regeneration
 * never burns a paid unit. Migration 0110: job_ref is UNIQUE, so a re-run
 * records nothing twice.
 */

const h = vi.hoisted(() => {
  const counts: Record<string, number> = {};
  const subTiers: string[] = [];
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  return { counts, subTiers, inserts };
});

type CountRow = { count: number | null; error: unknown };
interface FakeBuilder extends PromiseLike<CountRow> {
  select: () => FakeBuilder;
  eq: (col: string, val: unknown) => FakeBuilder;
  gt: () => FakeBuilder;
  gte: (col: string, since: string) => FakeBuilder;
  limit: () => FakeBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  single: () => Promise<{ data: unknown; error: unknown }>;
}

vi.mock("@/lib/supabase/admin", () => {
  const makeBuilder = (table: string): FakeBuilder => {
    let identity = "";
    const outcome = (): Promise<CountRow> => {
      if (table === "subscriptions") {
        return Promise.resolve({
          count: null,
          error: null,
          data: h.subTiers.map((tier) => ({ tier })),
        } as unknown as CountRow);
      }
      return Promise.resolve({ count: h.counts[`${table}:${identity}`] ?? 0, error: null });
    };
    const builder: FakeBuilder = {
      select: () => builder,
      eq: (col: string, val: unknown) => {
        if (col === "user_id" || col === "swap_type") {
          identity = identity ? `${identity}|${val}` : String(val);
        }
        return builder;
      },
      gt: () => builder,
      gte: () => builder,
      limit: () => builder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      then: (onfulfilled, onrejected) => outcome().then(onfulfilled, onrejected),
    };
    return builder;
  };
  return {
    isSupabaseAdminConfigured: true,
    supabaseAdmin: {
      from: (table: string) => {
        const b = makeBuilder(table);
        if (table === "plan_swaps") {
          return {
            ...b,
            insert: (row: Record<string, unknown>) => ({
              then: (onfulfilled: unknown, onrejected: unknown) => {
                h.inserts.push({ table, row });
                return Promise.resolve({ error: null }).then(
                  onfulfilled as never,
                  onrejected as never,
                );
              },
            }),
          };
        }
        return b;
      },
    },
  };
});

const USER = "22222222-2222-2222-2222-222222222222";

describe("success-only swap quota (AI-PLAN-QUALITY 2026-10-24)", () => {
  beforeEach(() => {
    for (const k of Object.keys(h.counts)) delete h.counts[k];
    h.subTiers.length = 0;
    h.inserts.length = 0;
  });

  it("checkSwapQuota is CHECK-ONLY — an allowed check writes NO plan_swaps row", async () => {
    h.subTiers.push("premium"); // premium monthly swap quota = 13
    h.counts[`plan_swaps:${USER}|meal`] = 1;
    const res = await checkSwapQuota(USER, "meal", "premium");
    expect(res.allowed).toBe(true);
    expect(res.used).toBe(1);
    expect(res.limit).toBe(13);
    expect(h.inserts).toHaveLength(0);
  });

  it("blocks when the monthly quota is exhausted (the 402/429 shape picks from the verdict)", async () => {
    h.counts[`plan_swaps:${USER}|meal`] = 13;
    const res = await checkSwapQuota(USER, "meal", "premium");
    expect(res.allowed).toBe(false);
    expect(res.used).toBe(13);
    expect(res.limit).toBe(13);
    expect(res.subscriptionRequired).toBe(false);
    expect(h.inserts).toHaveLength(0);
  });

  it("free tier (quota 0) is blocked AND flagged subscriptionRequired (the 402 subscribe CTA)", async () => {
    const res = await checkSwapQuota(USER, "meal", "free");
    expect(res.allowed).toBe(false);
    expect(res.limit).toBe(0);
    expect(res.subscriptionRequired).toBe(true);
  });

  it("staff bypasses the check without recording (runner records on success)", async () => {
    const res = await checkSwapQuota(USER, "meal", null, true);
    expect(res.allowed).toBe(true);
    expect(res.unlimited).toBe(true);
    expect(h.inserts).toHaveLength(0);
  });

  it("recordSwapUsage writes the ledger row the runner calls on `done`", async () => {
    await recordSwapUsage(USER, "exercise");
    expect(h.inserts).toHaveLength(1);
    expect(h.inserts[0].table).toBe("plan_swaps");
    expect(h.inserts[0].row.user_id).toBe(USER);
    expect(h.inserts[0].row.swap_type).toBe("exercise");
  });

  // PLAN-TYPE 2026-10-27 (live QA round, Task QA-TEST-ACCOUNTS-2026-10-26,
  // defect #2): the production table's NOT NULL plan_type was never filled
  // by the insert — the ledger stayed empty (0 rows ever) while the runner
  // logged «usage recorded». The row must now carry the derived plan type
  // and the return value must be the insert's own truth.
  it("recordSwapUsage fills the live NOT NULL plan_type and returns true on the landed insert (HONEST-LEDGER)", async () => {
    await expect(recordSwapUsage(USER, "meal")).resolves.toBe(true);
    expect(h.inserts[h.inserts.length - 1].row).toMatchObject({
      swap_type: "meal",
      plan_type: "meal",
      plan_id: null,
    });
    await expect(recordSwapUsage(USER, "exercise")).resolves.toBe(true);
    expect(h.inserts[h.inserts.length - 1].row).toMatchObject({
      swap_type: "exercise",
      plan_type: "workout",
      plan_id: null,
    });
  });
});
