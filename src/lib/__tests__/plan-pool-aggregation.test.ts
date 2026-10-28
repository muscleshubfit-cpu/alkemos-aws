import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveUnifiedPlanPoolLimit,
  resolveMembershipTier,
  type SubscriptionTierRow,
} from "@/lib/membership-tier";
import {
  checkUnifiedPlanQuota,
  unifiedPlanPoolFor,
} from "@/lib/tier-limits";
import { getLimits } from "@/lib/memberships";

/**
 * PLAN-POOL-AGGREGATION (Phase 376 — owner order 2026-10-28 «تصحيح متطلب
 * أساسي في Alkemos — سياسة تجميع حصص الاشتراكات المدفوعة»).
 *
 * THE LAW: a member's unified monthly AI plan-generation pool = the SUM of
 * `aiPlanMonthlyLimit` over every DISTINCT paid tier held as an
 * effectively-active subscription — Premium (4) + Pro (8) = 12 for the
 * entitled period. A member who burned 2 before the upgrade reads
 * {used:2, remaining:10} — NOT 6 (the superseded best-tier-only reading)
 * and NOT a fresh 12 (zeroed ledger).
 *
 * This canary holds the FULL matrix the order demands:
 *
 *   A. The pure aggregator (resolveUnifiedPlanPoolLimit — the single
 *      source of truth): single / dual / triple stacking · the free
 *      baseline · the entitlement window (expired + non-active rows
 *      contribute nothing; a cancelled-but-unexpired row still does) ·
 *      dedup (duplicate rows and legacy/live sibling pairs count ONCE) ·
 *      legacy starter/elite mapping · unknown tiers contribute nothing.
 *   B. The enforced verdict (checkUnifiedPlanQuota over a mocked DB):
 *      single premium · THE MANDATORY EXAMPLE (2 used of 4 → upgrade →
 *      {2,12,10}) · the coaching stack (4+8+8=20) · exhaustion at the
 *      aggregate · renewal never double-counts · expiry drops the tier's
 *      contribution with NO fresh grant · cancellation keeps access to
 *      end_date · guests unchanged · staff unlimited · the fail-safe
 *      single-tier fallback when the rows cannot be read.
 *   C. Source pins: every enforcement/display path rides the SAME
 *      function; the profile limits card reads the METER (meter ==
 *      enforcement); the numbers come from memberships.ts.
 */

const src = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

// ─────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────

const DAY = 86400000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
const NOW = new Date("2026-10-28T12:00:00.000Z");

/** An effectively-ACTIVE subscription row (the auth/DB pre-filter shape). */
const active = (tier: string, endOffsetMs = 30 * DAY): SubscriptionTierRow => ({
  tier,
  status: "active",
  end_date: iso(endOffsetMs),
});

/** An expired row (status column still 'active' — effectively EXPIRED). */
const expired = (tier: string, endOffsetMs = -5 * DAY): SubscriptionTierRow => ({
  tier,
  status: "active",
  end_date: iso(endOffsetMs),
});

// ─────────────────────────────────────────────────────────────────────
// A. The pure aggregator — the single source of truth
// ─────────────────────────────────────────────────────────────────────

describe("A) resolveUnifiedPlanPoolLimit — stacking, window, dedup", () => {
  it("no rows at all → the FREE pool (2) — the no-membership baseline", () => {
    expect(resolveUnifiedPlanPoolLimit(null)).toBe(2);
    expect(resolveUnifiedPlanPoolLimit(undefined)).toBe(2);
    expect(resolveUnifiedPlanPoolLimit([])).toBe(2);
  });

  it("SINGLE paid subscriptions: premium 4 · pro 8 · coaching 8", () => {
    expect(resolveUnifiedPlanPoolLimit([active("premium")], NOW)).toBe(4);
    expect(resolveUnifiedPlanPoolLimit([active("pro")], NOW)).toBe(8);
    expect(resolveUnifiedPlanPoolLimit([active("coaching")], NOW)).toBe(8);
  });

  it("DUAL stacks: premium+pro = 12 · premium+coaching = 12 · pro+coaching = 16", () => {
    expect(
      resolveUnifiedPlanPoolLimit([active("premium"), active("pro")], NOW),
    ).toBe(12);
    expect(
      resolveUnifiedPlanPoolLimit([active("premium"), active("coaching")], NOW),
    ).toBe(12);
    expect(
      resolveUnifiedPlanPoolLimit([active("pro"), active("coaching")], NOW),
    ).toBe(16);
  });

  it("THE FULL STACK: premium + pro + coaching = 20 (every paid tier contributes)", () => {
    expect(
      resolveUnifiedPlanPoolLimit(
        [active("premium"), active("pro"), active("coaching")],
        NOW,
      ),
    ).toBe(20);
  });

  it("the numbers come from memberships.ts (single source — no local copies)", () => {
    expect(getLimits("free").aiPlanMonthlyLimit).toBe(2);
    expect(getLimits("premium").aiPlanMonthlyLimit).toBe(4);
    expect(getLimits("pro").aiPlanMonthlyLimit).toBe(8);
    expect(getLimits("coaching").aiPlanMonthlyLimit).toBe(8);
    // 2+4+8+8 = the full-stack aggregate above
    expect(
      getLimits("free").aiPlanMonthlyLimit +
        getLimits("premium").aiPlanMonthlyLimit +
        getLimits("pro").aiPlanMonthlyLimit +
        getLimits("coaching").aiPlanMonthlyLimit,
    ).toBe(22); // 20 paid + the free baseline of 2
  });

  it("the FREE pool NEVER stacks on top of paid pools", () => {
    // A 'free' row is not a paid tier — it contributes nothing; a member
    // with premium reads 4, not 4+2.
    expect(
      resolveUnifiedPlanPoolLimit([active("free"), active("premium")], NOW),
    ).toBe(4);
  });

  it("ENTITLEMENT WINDOW — expired rows contribute NOTHING (no quota outside the paid period)", () => {
    // premium expired, pro live → 8 only (the samarsamy-class state)
    expect(
      resolveUnifiedPlanPoolLimit([expired("premium"), active("pro")], NOW),
    ).toBe(8);
    // both expired → the free baseline
    expect(
      resolveUnifiedPlanPoolLimit([expired("premium"), expired("pro")], NOW),
    ).toBe(2);
  });

  it("ENTITLEMENT WINDOW — the end_date boundary is exclusive at 'now'", () => {
    const boundary = new Date(NOW.getTime()); // end_date == now → gone
    expect(
      resolveUnifiedPlanPoolLimit(
        [{ tier: "premium", status: "active", end_date: boundary.toISOString() }],
        NOW,
      ),
    ).toBe(2);
    const justBefore = new Date(NOW.getTime() - 1);
    expect(
      resolveUnifiedPlanPoolLimit(
        [{ tier: "premium", status: "active", end_date: justBefore.toISOString() }],
        NOW,
      ),
    ).toBe(2);
    const justAfter = new Date(NOW.getTime() + 1);
    expect(
      resolveUnifiedPlanPoolLimit(
        [{ tier: "premium", status: "active", end_date: justAfter.toISOString() }],
        NOW,
      ),
    ).toBe(4);
  });

  it("ENTITLEMENT WINDOW — a non-active status row contributes NOTHING", () => {
    expect(
      resolveUnifiedPlanPoolLimit(
        [
          { tier: "premium", status: "rejected", end_date: iso(30 * DAY) },
          { tier: "pro", status: "pending", end_date: iso(30 * DAY) },
        ],
        NOW,
      ),
    ).toBe(2);
    expect(
      resolveUnifiedPlanPoolLimit(
        [{ tier: "premium", status: "cancelled", end_date: iso(30 * DAY) }],
        NOW,
      ),
    ).toBe(2);
  });

  it("CANCELLATION keeps access to end_date — a cancelled-but-unexpired row (status still 'active', Phase 68 law) STILL contributes", () => {
    // Phase 68: cancel marks cancel_requested_at ONLY; status stays
    // 'active' and access continues until end_date — so the pool keeps
    // the tier's contribution until the paid period ends.
    expect(
      resolveUnifiedPlanPoolLimit([active("premium"), active("pro")], NOW),
    ).toBe(12);
  });

  it("DEDUP — duplicate rows of the SAME tier count ONCE («لا تحتسب الحصة نفسها مرتين»)", () => {
    expect(
      resolveUnifiedPlanPoolLimit(
        [active("premium"), active("premium"), active("premium")],
        NOW,
      ),
    ).toBe(4);
    expect(
      resolveUnifiedPlanPoolLimit(
        [active("premium"), active("pro"), active("pro")],
        NOW,
      ),
    ).toBe(12);
  });

  it("DEDUP — a legacy row and its live sibling count ONCE (starter+premium → one premium pool)", () => {
    expect(
      resolveUnifiedPlanPoolLimit([active("starter"), active("premium")], NOW),
    ).toBe(4);
    expect(
      resolveUnifiedPlanPoolLimit([active("elite"), active("pro")], NOW),
    ).toBe(8);
  });

  it("LEGACY 0045 mapping — starter → premium pool (4) · elite → pro pool (8)", () => {
    expect(resolveUnifiedPlanPoolLimit([active("starter")], NOW)).toBe(4);
    expect(resolveUnifiedPlanPoolLimit([active("elite")], NOW)).toBe(8);
    expect(
      resolveUnifiedPlanPoolLimit([active("starter"), active("elite")], NOW),
    ).toBe(12);
  });

  it("UNKNOWN tiers contribute NOTHING (never fall through to the free pool's 2)", () => {
    expect(resolveUnifiedPlanPoolLimit([active("mega")], NOW)).toBe(2);
    expect(
      resolveUnifiedPlanPoolLimit([active("mega"), active("pro")], NOW),
    ).toBe(8);
  });

  it("a null/missing end_date contributes nothing (defensive — malformed row)", () => {
    expect(
      resolveUnifiedPlanPoolLimit(
        [
          { tier: "premium", status: "active", end_date: null },
          active("pro"),
        ],
        NOW,
      ),
    ).toBe(8);
  });
});

// ─────────────────────────────────────────────────────────────────────
// B. The enforced verdict — checkUnifiedPlanQuota over a mocked DB
// ─────────────────────────────────────────────────────────────────────

const h = vi.hoisted(() => {
  const counts: Record<string, number> = {};
  const subRows: Array<{ tier: string; status: string; end_date: string }> = [];
  const adminDown = { down: false };
  return { counts, subRows, adminDown };
});

type CountRow = { count: number | null; error: unknown };
interface FakeBuilder extends PromiseLike<CountRow> {
  select: () => FakeBuilder;
  eq: (col: string, val: unknown) => FakeBuilder;
  gt: () => FakeBuilder;
  gte: () => FakeBuilder;
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
          // adminDown simulates an unreadable rows read (fetch returns
          // null → the single-tier fail-safe fallback)
          error: h.adminDown.down ? { message: "admin client down" } : null,
          data: h.adminDown.down ? null : h.subRows,
        } as unknown as CountRow);
      }
      return Promise.resolve({ count: h.counts[`${table}:${identity}`] ?? 0, error: null });
    };
    const builder: FakeBuilder = {
      select: () => builder,
      eq: (col, val) => {
        if (col === "user_id" || col === "guest_key" || col === "ip_key" || col === "client_id") {
          identity = String(val);
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
    isSupabaseAdminConfigured: !h.adminDown.down,
    supabaseAdmin: { from: (table: string) => makeBuilder(table) },
  };
});

const MEMBER = "33333333-3333-3333-3333-333333333333";

describe("B) checkUnifiedPlanQuota — the aggregated verdict", () => {
  beforeEach(() => {
    for (const k of Object.keys(h.counts)) delete h.counts[k];
    h.subRows.length = 0;
    h.adminDown.down = false;
  });

  it("SINGLE premium subscription: {used:0, limit:4}", async () => {
    h.subRows.push({ tier: "premium", status: "active", end_date: iso(30 * DAY) });
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "premium" });
    expect(v).toMatchObject({ used: 0, limit: 4, remaining: 4, allowed: true, tier: "premium" });
  });

  it("THE MANDATORY EXAMPLE — 2 of 4 burned as premium, then the pro upgrade: {used:2, limit:12, remaining:10} (NOT 6, NOT a fresh 12)", async () => {
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(30 * DAY) },
      { tier: "pro", status: "active", end_date: iso(30 * DAY) },
    );
    h.counts[`ai_plan_usage:${MEMBER}`] = 2;
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v).toMatchObject({ used: 2, limit: 12, remaining: 10, allowed: true, tier: "pro" });
    // The wrong readings this kills:
    expect(v.remaining).not.toBe(6); // superseded best-tier-only (limit 8)
    expect(v.used).not.toBe(0); // zeroed ledger
    expect(v.remaining).not.toBe(12); // fresh grant
  });

  it("COACHING stacks too: premium+pro+coaching with 2 used → {used:2, limit:20, remaining:18}", async () => {
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(30 * DAY) },
      { tier: "pro", status: "active", end_date: iso(30 * DAY) },
      { tier: "coaching", status: "active", end_date: iso(30 * DAY) },
    );
    h.counts[`ai_plan_usage:${MEMBER}`] = 2;
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v).toMatchObject({ used: 2, limit: 20, remaining: 18, allowed: true });
  });

  it("EXHAUSTION at the aggregate: 11/12 allowed, 12/12 blocked", async () => {
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(30 * DAY) },
      { tier: "pro", status: "active", end_date: iso(30 * DAY) },
    );
    h.counts[`ai_plan_usage:${MEMBER}`] = 11;
    const ok = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(ok).toMatchObject({ used: 11, limit: 12, remaining: 1, allowed: true });
    h.counts[`ai_plan_usage:${MEMBER}`] = 12;
    const blocked = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(blocked).toMatchObject({ used: 12, limit: 12, remaining: 0, allowed: false });
  });

  it("RENEWAL never double-counts: the premium row extended (same shape, same tier) keeps limit 12 — NOT 16/24", async () => {
    // extend_subscription (0018/0042) renews the SAME row — the DB shape
    // after a renewal is still ONE premium row + ONE pro row.
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(60 * DAY) }, // renewed +1mo
      { tier: "pro", status: "active", end_date: iso(30 * DAY) },
    );
    h.counts[`ai_plan_usage:${MEMBER}`] = 2;
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v).toMatchObject({ used: 2, limit: 12, remaining: 10 });
    // Even a stray duplicate premium row (pre-constraint legacy data)
    // cannot double the grant — the dedup law.
    h.subRows.push({ tier: "premium", status: "active", end_date: iso(90 * DAY) });
    const v2 = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v2.limit).toBe(12);
  });

  it("EXPIRY drops the tier's contribution with NO fresh grant: premium lapses, pro stays → {used:2, limit:8, remaining:6}", async () => {
    h.subRows.push({ tier: "pro", status: "active", end_date: iso(30 * DAY) });
    h.counts[`ai_plan_usage:${MEMBER}`] = 2; // 2 burned while premium was live
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v).toMatchObject({ used: 2, limit: 8, remaining: 6, allowed: true });
    // no quota is granted outside the paid period: the expired premium
    // contribution (4) is gone the moment its end_date passes.
  });

  it("CANCELLATION keeps access to end_date: the cancelled-but-unexpired stack still reads its full aggregate", async () => {
    // Phase 68: cancel marks cancel_requested_at only; status stays
    // 'active' — the meter keeps the aggregate until end_date.
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(30 * DAY) },
      { tier: "pro", status: "active", end_date: iso(30 * DAY) },
    );
    h.counts[`ai_plan_usage:${MEMBER}`] = 2;
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v).toMatchObject({ used: 2, limit: 12, remaining: 10, allowed: true });
  });

  it("the coach-generation gate shape (no tierHint — /api/ai/jobs): stacked rows aggregate identically", async () => {
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(30 * DAY) },
      { tier: "coaching", status: "active", end_date: iso(30 * DAY) },
    );
    const v = await checkUnifiedPlanQuota({ userId: MEMBER });
    expect(v.tier).toBe("premium"); // display tier: membership reported over coaching (141 law)
    expect(v.limit).toBe(12); // pool: 4+8 aggregated
  });

  it("GUESTS unchanged: the free pool (2), dual-dimension law intact", async () => {
    h.counts["ai_plan_usage:guest-agg-1"] = 1;
    const v = await checkUnifiedPlanQuota({ guestKey: "guest-agg-1" });
    expect(v).toMatchObject({ used: 1, limit: 2, remaining: 1, allowed: true, tier: "guest" });
  });

  it("STAFF unchanged: unlimited, never reads the ledger", async () => {
    h.counts[`ai_plan_usage:${MEMBER}`] = 99;
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, staffHint: true });
    expect(v).toMatchObject({ allowed: true, unlimited: true });
  });

  it("FAIL-SAFE: rows unreadable (admin client down) → the single-tier hint pool at most — never unlimited, never above the entitlement", async () => {
    h.adminDown.down = true;
    h.counts[`ai_plan_usage:${MEMBER}`] = 9;
    // tierHint pro (auth-resolved) → the per-tier pool 8 — the stacked
    // member is briefly UNDER-granted (9 ≥ 8 → blocked), never over.
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v).toMatchObject({ limit: 8, used: 9, remaining: 0, allowed: false });
    expect(v.unlimited).toBe(false);
    // no hint either → the free pool (fail-closed to the baseline)
    const v2 = await checkUnifiedPlanQuota({ userId: MEMBER });
    expect(v2.limit).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────
// C. Source pins — one law, every path
// ─────────────────────────────────────────────────────────────────────

describe("C) every quota path rides the SAME law (source pins)", () => {
  it("the aggregator + the DB fetch live in the single sources (membership-tier.ts + tier-limits.ts)", () => {
    const resolver = src("src/lib/membership-tier.ts");
    expect(resolver).toContain("export function resolveUnifiedPlanPoolLimit");
    const limits = src("src/lib/tier-limits.ts");
    expect(limits).toContain("fetchActiveSubTierRows");
    expect(limits).toContain("resolveUnifiedPlanPoolLimit(rows)");
    // the DB fetch pre-filters the same entitlement window as auth
    expect(limits).toContain('.eq("status", "active")');
    expect(limits).toContain('.gt("end_date", new Date().toISOString())');
    // the feature-limit fallback (chat/swaps — best-tier semantics) rides
    // the SAME rows fetch, never a parallel tier query
    expect(limits).toContain("resolveMembershipTier(\"client\", rows)");
  });

  it("EVERY enforcement path calls checkUnifiedPlanQuota — generation (member + coach), chat intents, the meter, the coach readout", () => {
    for (const p of [
      "src/app/api/ai/meal-plan-demo/route.ts",
      "src/app/api/ai/workout-plan-demo/route.ts",
      "src/app/api/ai/chat/route.ts",
      "src/app/api/ai/jobs/route.ts",
      "src/app/api/ai/quota/route.ts",
      "src/app/api/coach/ai-usage/route.ts",
    ]) {
      expect(src(p)).toContain("checkUnifiedPlanQuota");
    }
  });

  it("the member widget + planner meters read /api/ai/quota (the meter), and the coach client view reads /api/coach/ai-usage — no path recomputes the pool client-side", () => {
    expect(src("src/lib/evo-chat-context.tsx")).toContain("`/api/ai/quota${qs}`");
    expect(src("src/app/(en)/ai-meal-planner/page.tsx")).toContain("/api/ai/quota");
    expect(src("src/components/views/CoachClientView.tsx")).toContain("clientBalance");
  });

  it("the profile limits card shows the plan-pool line from the METER (meter == enforcement), other limits stay per-tier", () => {
    const page = src("src/app/(app)/profile/page.tsx");
    expect(page).toContain('fetch("/api/ai/quota")');
    expect(page).toContain("planPoolLimit ?? limits.aiPlanMonthlyLimit");
  });

  it("the per-tier helper remains the guest pool + the building block (2/4/8/8 from memberships.ts)", () => {
    expect(unifiedPlanPoolFor("free")).toBe(2);
    expect(unifiedPlanPoolFor("premium")).toBe(4);
    expect(unifiedPlanPoolFor("pro")).toBe(8);
    expect(unifiedPlanPoolFor("coaching")).toBe(8);
  });

  it("the display tier keeps best-membership semantics (badges/feature gates are NOT aggregated)", () => {
    expect(
      resolveMembershipTier("client", [active("premium"), active("pro")]),
    ).toBe("pro");
    expect(
      resolveMembershipTier("client", [active("coaching"), active("premium")]),
    ).toBe("premium"); // membership reported over coaching (141 law)
  });
});
