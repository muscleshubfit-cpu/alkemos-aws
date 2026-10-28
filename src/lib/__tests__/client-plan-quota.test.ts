import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  countUnifiedPlanUsage,
  checkUnifiedPlanQuota,
  recordUnifiedPlanUsage,
  hashGuestKey,
  hashIpKey,
  monthStartUtc,
} from "@/lib/tier-limits";

/**
 * PHASE 183 (owner decree 2026-09-13 «البوول الموحد» — spec "Alkemos —
 * Membership & Plan Changes"): ONE monthly pool per identity for
 * nutrition + workout generations COMBINED — free 2 · premium 4 ·
 * pro 8 · coaching 8 — counted SUCCESS-ONLY from the ai_plan_usage
 * ledger (migration 0085): a row exists only after a plan was actually
 * generated and validated.
 *
 * G6 (owner report 2026-09-13, migration 0086): the guest pool is
 * DUAL-DIMENSION — used = max(count(guest_key), count(ip_key)) — so a
 * fresh incognito window (fresh guest_key, same IP) or a router IP
 * rotation (fresh IP, same browser) can NO LONGER reset the balance.
 * The owner reproduced the original hole live: closed one incognito
 * window, opened another, saw 2/2 again.
 *
 * These tests mock the service-role client: fixed ai_plan_usage counts
 * per (table, dimension key), subscriptions rows for the DB-tier
 * fallback, and an insert spy capturing exactly what
 * recordUnifiedPlanUsage writes.
 */

const h = vi.hoisted(() => {
  // count returned per (table, identity key)
  const counts: Record<string, number> = {};
  // subscriptions ROWS for the aggregated-pool DB fetch (owner order
  // 2026-10-28 «تجميع حصص الاشتراكات المدفوعة» — full rows, not bare
  // tier strings: the pool aggregates over the active+expiry window)
  const subRows: Array<{ tier: string; status: string; end_date: string }> = [];
  // captured inserts per table
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  return { counts, subRows, inserts };
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
          data: h.subRows,
        } as unknown as CountRow);
      }
      return Promise.resolve({
        count: h.counts[`${table}:${identity}`] ?? 0,
        error: null,
      });
    };
    const builder: FakeBuilder = {
      select: () => builder,
      eq: (col: string, val: unknown) => {
        if (
          col === "user_id" || col === "guest_key" || col === "ip_key" ||
          col === "client_id"
        ) {
          identity = String(val);
        }
        return builder;
      },
      gt: () => builder,
      // The unified pool is monthly-only — every gte here is the month
      // window; kept in the signature for parity with the real builder.
      gte: (_col: string, _since: string) => builder,
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
        if (table === "ai_plan_usage") {
          // capture inserts (recordUnifiedPlanUsage)
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

/** A future ISO date for effectively-active fixture rows. */
const futureIso = () => new Date(Date.now() + 30 * 86400000).toISOString();

const USER = "11111111-1111-1111-1111-111111111111";

describe("unified AI plan pool (Phase 183 — «البوول الموحد»)", () => {
  beforeEach(() => {
    for (const k of Object.keys(h.counts)) delete h.counts[k];
    h.subRows.length = 0;
    h.inserts.length = 0;
  });

  it("countUnifiedPlanUsage reads only the success ledger, per dimension", async () => {
    h.counts[`ai_plan_usage:${USER}`] = 3;
    expect(await countUnifiedPlanUsage({ userId: USER })).toBe(3);
    expect(await countUnifiedPlanUsage({ guestKey: "abc" })).toBe(0);
    h.counts["ai_plan_usage:abc"] = 2;
    expect(await countUnifiedPlanUsage({ guestKey: "abc" })).toBe(2);
    expect(await countUnifiedPlanUsage({})).toBe(0); // no identity → 0
    // G6: several dimensions → the MAX across them (the dual law)
    h.counts["ai_plan_usage:ip-9"] = 5;
    expect(await countUnifiedPlanUsage({ guestKey: "abc", ipKey: "ip-9" })).toBe(5);
    expect(await countUnifiedPlanUsage({ guestKey: "zzz", ipKey: "abc" })).toBe(2);
  });

  it("member pool: premium 4 — 2 used → allowed, remaining 2", async () => {
    h.subRows.push({ tier: "premium", status: "active", end_date: futureIso() });
    h.counts[`ai_plan_usage:${USER}`] = 2;
    const r = await checkUnifiedPlanQuota({ userId: USER, tierHint: "premium" });
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe("premium");
    expect(r.limit).toBe(4);
    expect(r.remaining).toBe(2);
  });

  it("member pool blocks at the tier limit (pro 8, combined kinds)", async () => {
    h.subRows.push({ tier: "pro", status: "active", end_date: futureIso() });
    h.counts[`ai_plan_usage:${USER}`] = 8; // e.g. 5 nutrition + 3 workout
    const r = await checkUnifiedPlanQuota({ userId: USER, tierHint: "pro" });
    expect(r.allowed).toBe(false);
    expect(r.used).toBe(8);
    expect(r.limit).toBe(8);
    expect(r.remaining).toBe(0);
  });

  it("guest pool: free numbers (2/month), no signup wall", async () => {
    h.counts["ai_plan_usage:guestkey-1"] = 1;
    const r = await checkUnifiedPlanQuota({ guestKey: "guestkey-1" });
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe("guest");
    expect(r.limit).toBe(2);
    expect(r.remaining).toBe(1);
    expect(r.reason).toBeNull();
  });

  it("guest pool blocks after 2 successes", async () => {
    h.counts["ai_plan_usage:guestkey-1"] = 2;
    const r = await checkUnifiedPlanQuota({ guestKey: "guestkey-1" });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.reason).toBe("pool");
  });

  it("G6 — THE INCOUNTER TEST: fresh incognito (new guest id, SAME IP) does NOT reset the balance", async () => {
    // The owner's exact repro: browser #1 burned 2/2, a brand-new
    // incognito window arrives with a fresh guest id + same network.
    h.counts["ai_plan_usage:ip-key-1"] = 2; // the network dimension remembers
    const r = await checkUnifiedPlanQuota({
      guestKey: "brand-new-incognito-guest", // zero rows
      ipKey: "ip-key-1",
    });
    expect(r.allowed).toBe(false); // blocked — the hole is closed
    expect(r.used).toBe(2); // max(0, 2)
    expect(r.remaining).toBe(0);
    expect(r.reason).toBe("network"); // → the network copy + soft CTA
  });

  it("G6 — router/IP rotation (fresh IP, SAME browser) does not reset the balance either", async () => {
    h.counts["ai_plan_usage:guestkey-1"] = 2;
    const r = await checkUnifiedPlanQuota({
      guestKey: "guestkey-1",
      ipKey: "ip-changed-after-router-reboot",
    });
    expect(r.allowed).toBe(false);
    expect(r.used).toBe(2); // max(2, 0)
    expect(r.reason).toBe("pool");
  });

  it("G6 — partial burn across dimensions counts the max", async () => {
    h.counts["ai_plan_usage:guestkey-1"] = 1;
    h.counts["ai_plan_usage:ip-key-1"] = 1;
    const r = await checkUnifiedPlanQuota({ guestKey: "guestkey-1", ipKey: "ip-key-1" });
    expect(r.used).toBe(1);
    expect(r.allowed).toBe(true); // 1/2
    expect(r.remaining).toBe(1);
  });

  it("G6 — ip dimension alone still meters guests (EVO widget sends no guestId)", async () => {
    h.counts["ai_plan_usage:ip-key-1"] = 1;
    const r = await checkUnifiedPlanQuota({ ipKey: "ip-key-1" });
    expect(r.used).toBe(1);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(1);
  });

  it("unknown identity degrades to a fresh guest (full free pool)", async () => {
    const r = await checkUnifiedPlanQuota({});
    expect(r.allowed).toBe(true);
    expect(r.tier).toBe("guest");
    expect(r.limit).toBe(2);
  });

  it("DB-fallback: no active subscription → free pool (2)", async () => {
    h.subRows.length = 0;
    h.counts[`ai_plan_usage:${USER}`] = 1;
    const r = await checkUnifiedPlanQuota({ userId: USER });
    expect(r.tier).toBe("free");
    expect(r.limit).toBe(2);
    expect(r.allowed).toBe(true); // 1/2
  });

  it("DB-fallback: stacked premium+pro rows AGGREGATE (4+8=12 — owner order 2026-10-28), display tier stays pro", async () => {
    h.subRows.push(
      { tier: "premium", status: "active", end_date: futureIso() },
      { tier: "pro", status: "active", end_date: futureIso() },
    );
    const r = await checkUnifiedPlanQuota({ userId: USER });
    expect(r.tier).toBe("pro"); // display tier: best membership wins
    expect(r.limit).toBe(12); // pool: aggregated, not best-tier
  });

  it("staff bypass: unlimited, no ledger read", async () => {
    h.counts[`ai_plan_usage:${USER}`] = 99;
    const r = await checkUnifiedPlanQuota({
      userId: USER,
      tierHint: "free",
      staffHint: true,
    });
    expect(r.allowed).toBe(true);
    expect(r.unlimited).toBe(true);
  });

  it("recordUnifiedPlanUsage writes ONE success row with the right identity", async () => {
    await recordUnifiedPlanUsage({
      userId: USER,
      kind: "nutrition",
      surface: "planner",
    });
    await recordUnifiedPlanUsage({
      guestKey: "guestkey-1",
      ipKey: "ip-key-1",
      kind: "workout",
      surface: "evo",
    });
    expect(h.inserts).toHaveLength(2);
    expect(h.inserts[0].row).toMatchObject({
      user_id: USER,
      guest_key: null,
      ip_key: null, // members never get IP-keyed rows
      kind: "nutrition",
      surface: "planner",
    });
    expect(h.inserts[1].row).toMatchObject({
      user_id: null,
      guest_key: "guestkey-1",
      ip_key: "ip-key-1", // G6: guest rows burn BOTH dimensions
      kind: "workout",
      surface: "evo",
    });
  });

  it("recordUnifiedPlanUsage: no identity → no row (fail-safe)", async () => {
    await recordUnifiedPlanUsage({ kind: "nutrition" });
    expect(h.inserts).toHaveLength(0);
  });

  it("hashGuestKey is stable, salted, and never stores the raw id", () => {
    const k1 = hashGuestKey("guest-uuid-1");
    const k2 = hashGuestKey("guest-uuid-1");
    const k3 = hashGuestKey("guest-uuid-2");
    expect(k1).toBe(k2); // stable for the same id
    expect(k1).not.toBe(k3); // different ids → different keys
    expect(k1).not.toContain("guest-uuid-1"); // raw id never appears
    expect(k1).toHaveLength(32); // sha256 hex slice
  });

  it("hashIpKey: stable, salted, same length, never the raw IP — and matches the chat anon-key scheme", () => {
    const a = hashIpKey("41.23.11.7");
    expect(a).toBe(hashIpKey("41.23.11.7")); // stable
    expect(a).not.toBe(hashIpKey("41.23.11.8")); // different IP → key
    expect(a).not.toContain("41.23.11.7"); // raw IP never appears
    expect(a).toHaveLength(32);
    // Same salted scheme as the guest/browser dimension (one shared
    // EVO_ANON_SALT) — BY DESIGN: the chat anon key, the planner ip_key
    // and the EVO ip_key are the SAME value for one client.
    expect(a).toBe(hashGuestKey("41.23.11.7"));
    // ...while a guest UUID and an IP can never collide into one key:
    expect(hashIpKey("41.23.11.7")).not.toBe(hashGuestKey("guest-uuid-1"));
  });

  it("month window resets on the 1st, UTC", () => {
    const m = monthStartUtc();
    const d = new Date(m);
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCHours()).toBe(0);
  });
});
