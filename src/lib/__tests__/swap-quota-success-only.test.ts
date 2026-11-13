import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkSwapQuota, recordSwapUsage } from "@/lib/tier-limits";

/**
 * AI-PLAN-QUALITY 2026-10-24 (owner order item 4 — «تحديث الحصص المدفوعة
 * بصورة صحيحة») + AI-QUOTAS 2026-11-14 completion order: the member swap
 * quota is SUCCESS-ONLY and is ONE UNIFIED monthly quota (premium 8 ·
 * pro/coaching 16 — meal + exercise COMBINED, §1/§2; the per-type split
 * and the weekly window are retired). The enqueue gate (checkSwapQuota)
 * checks WITHOUT recording; the GHA runner records (recordSwapUsage) only
 * when the regeneration job lands `done` — a permanently failed
 * regeneration never burns a paid unit. Migration 0110: job_ref is UNIQUE,
 * so a re-run records nothing twice.
 */

const h = vi.hoisted(() => {
  // Full subscription rows (the bucket engine needs start/end dates).
  const subRows: Array<{ tier: string; status: string; end_date: string; start_date: string | null }> = [];
  // Success-ledger rows per table: user_id → created_at stamps.
  const usage: Record<string, Array<{ created_at: string }>> = {};
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  return { subRows, usage, inserts };
});

type RowOutcome = { count: number | null; error: unknown; data: unknown };
interface FakeBuilder extends PromiseLike<RowOutcome> {
  select: () => FakeBuilder;
  eq: (col: string, val: unknown) => FakeBuilder;
  gt: () => FakeBuilder;
  gte: (col: string, val: unknown) => FakeBuilder;
  order: () => FakeBuilder;
  limit: () => FakeBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  single: () => Promise<{ data: unknown; error: unknown }>;
}

vi.mock("@/lib/supabase/admin", () => {
  const makeBuilder = (table: string): FakeBuilder => {
    let userId = "";
    let sinceMs = 0;
    const outcome = (): Promise<RowOutcome> => {
      if (table === "subscriptions") {
        return Promise.resolve({
          count: null,
          error: null,
          data: h.subRows,
        } as unknown as RowOutcome);
      }
      // The unified engine fetches created_at rows since the earliest
      // bucket window start — mirror the server filter (user + gte).
      const rows = (h.usage[`${table}:${userId}`] ?? []).filter(
        (r) => new Date(r.created_at).getTime() >= sinceMs,
      );
      return Promise.resolve({ count: rows.length, error: null, data: rows } as unknown as RowOutcome);
    };
    const builder: FakeBuilder = {
      select: () => builder,
      eq: (col, val) => {
        if (col === "user_id") userId = String(val);
        return builder;
      },
      gt: () => builder,
      gte: (col, val) => {
        if (col === "created_at") sinceMs = new Date(String(val)).getTime();
        return builder;
      },
      order: () => builder,
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
const DAY = 86400000;
const NOW = Date.now();
// A long-lived active premium row anchored 20 days ago (window covers NOW).
const premiumRow = () => ({
  tier: "premium",
  status: "active",
  end_date: new Date(NOW + 60 * DAY).toISOString(),
  start_date: new Date(NOW - 20 * DAY).toISOString(),
});
const inWindow = (offsetDays: number) => ({
  created_at: new Date(NOW - offsetDays * DAY).toISOString(),
});

describe("success-only UNIFIED swap quota (AI-PLAN-QUALITY 2026-10-24 + completion order 2026-11-14)", () => {
  beforeEach(() => {
    h.subRows.length = 0;
    for (const k of Object.keys(h.usage)) delete h.usage[k];
    h.inserts.length = 0;
  });

  it("checkSwapQuota is CHECK-ONLY — an allowed check writes NO plan_swaps row", async () => {
    h.subRows.push(premiumRow()); // premium unified swap quota = 8
    h.usage[`plan_swaps:${USER}`] = [inWindow(2)];
    const res = await checkSwapQuota(USER, "meal", "premium");
    expect(res.allowed).toBe(true);
    expect(res.used).toBe(1);
    expect(res.limit).toBe(8);
    expect(res.subscriptionRequired).toBe(false);
    expect(res.renewsAt).toBeTruthy();
    expect(h.inserts).toHaveLength(0);
  });

  it("UNIFIED counting (§2): meal AND exercise rows draw from the SAME quota — 8 meal + 8 exercise = exhausted at 8/8", async () => {
    h.subRows.push(premiumRow());
    // The engine never filters by swap_type: 4 meal + 4 exercise rows all
    // land in the one quota (the ledger's swap_type stays analytics-only).
    h.usage[`plan_swaps:${USER}`] = [
      inWindow(6), inWindow(6), inWindow(5), inWindow(5), // 4 "meals"
      inWindow(4), inWindow(4), inWindow(3), inWindow(3), // 4 "exercises"
    ];
    const res = await checkSwapQuota(USER, "exercise", "premium");
    expect(res.used).toBe(8);
    expect(res.limit).toBe(8);
    expect(res.allowed).toBe(false);
    expect(res.subscriptionRequired).toBe(false);
  });

  it("blocks when the unified monthly quota is exhausted (the 402/429 shape picks from the verdict)", async () => {
    h.subRows.push(premiumRow());
    h.usage[`plan_swaps:${USER}`] = Array.from({ length: 8 }, () => inWindow(2));
    const res = await checkSwapQuota(USER, "meal", "premium");
    expect(res.allowed).toBe(false);
    expect(res.used).toBe(8);
    expect(res.limit).toBe(8);
    expect(res.subscriptionRequired).toBe(false);
    expect(h.inserts).toHaveLength(0);
  });

  it("free tier (no paid rows) is blocked AND flagged subscriptionRequired (the 402 subscribe CTA)", async () => {
    const res = await checkSwapQuota(USER, "meal", "free");
    expect(res.allowed).toBe(false);
    expect(res.limit).toBe(0);
    expect(res.subscriptionRequired).toBe(true);
    expect(res.renewsAt).toBeNull();
  });

  it("STACKING (§4): premium 8 + pro 16 = 24 for the overlap — the upgrade keeps BOTH quotas", async () => {
    h.subRows.push(
      premiumRow(),
      {
        tier: "pro",
        status: "active",
        end_date: new Date(NOW + 90 * DAY).toISOString(),
        start_date: new Date(NOW - 3 * DAY).toISOString(),
      },
    );
    const res = await checkSwapQuota(USER, "meal", "pro");
    expect(res.limit).toBe(24); // 8 + 16 — «يستفيد العميل من حقوق الاشتراكين»
    expect(res.allowed).toBe(true);
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
