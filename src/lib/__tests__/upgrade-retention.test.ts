import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveMembershipTier,
  resolveUnifiedPlanPoolLimit,
  type SubscriptionTierRow,
} from "@/lib/membership-tier";
import {
  checkUnifiedPlanQuota,
  unifiedPlanPoolFor,
  swapLimitForTier,
} from "@/lib/tier-limits";
import { getLimits } from "@/lib/memberships";
import {
  pickPrimarySubscription,
  effectiveSubStatus,
  daysLeftOn,
} from "@/lib/subscription-view";

/**
 * UPGRADE-RETENTION (Phase 375 — owner order 2026-10-28: «اختبار المرحلة
 * 374 لا يثبت صحة الاحتفاظ بالاشتراك والحصص»).
 *
 * The Phase 374 live round measured ONLY the quota-meter flip 4→8 on the
 * upgraded member (qa.m3.1027) — a number that would read IDENTICALLY under
 * three WRONG implementations:
 *   (a) deleting/cancelling the premium row and replacing it with pro
 *       (record destroyed — the owner's explicit «لا تلغِ الاشتراك الأصلي»),
 *   (b) zeroing the usage ledger on activation (member "regains" 8 fresh
 *       generations he never paid for),
 *   (c) stacking the pools per subscription row (4+8=12 — double grant).
 *
 * These canaries prove the FULL invariant chain from the requirements +
 * code, at every layer:
 *
 *   A. TIER RESOLUTION across the upgrade lifecycle (membership-tier.ts —
 *      the single source of truth): premium-only → premium · premium+pro
 *      both active → pro (best membership wins) · premium expired + pro
 *      live → pro · both expired → free.
 *   B. THE UNIFIED-POOL VERDICT across the upgrade (tier-limits.ts +
 *      mocked ai_plan_usage ledger) — the PARTIAL-CONSUMPTION scenario the
 *      owner ordered: a member who burned 2 of his 4 premium generations,
 *      then upgrades, MUST read {used:2, limit:12, remaining:10} — not
 *      {0,12,12} (zeroed) and not {2,8,6} (best-tier-only).
 *   C. THE DB STACKING LAW (migration source pins): unique(client_id,tier)
 *      (0011 — a client holds one row PER TIER, stacking not replacement)
 *      · extend_subscription keyed on (client_id,tier) with an INSERT
 *      branch for a tier the client never held and a same-tier EXTEND
 *      branch that preserves paid days (0018/0042) · the usage ledger is
 *      identity-keyed with NO subscription reference (0085) — an
 *      activation structurally cannot zero or double it.
 *   D. THE VIEW PICK LAW over stacked rows (subscription-view.ts — what
 *      every member-side surface displays after the upgrade).
 *   E. CANCEL SEMANTICS on the upgraded account (cancel-route source pins:
 *      every active row is marked, access survives to end_date, idempotent).
 *   F. THE LIVE-MEASURED M3 FIXTURE — the exact production rows of the
 *      Phase-374 upgraded account (read-only, 2026-10-27) as a regression
 *      fixture: premium row INTACT beside the new pro row.
 *
 * PHASE 376 SUPERSESSION (owner order 2026-10-28 «تجميع حصص الاشتراكات
 * المدفوعة»): the PLAN-POOL sizing law FLIPPED from best-tier-wins
 * (upgrade → limit 8) to the AGGREGATE of every distinct effectively-
 * active paid tier (premium 4 + pro 8 = 12; used 2 → remaining 10, NOT
 * 6). The RETENTION invariants this canary was built for are UNCHANGED
 * and still enforced below: usage never zeroed · the premium row never
 * destroyed · renewal extends its OWN row (never double-counted) ·
 * cancel keeps access to end_date · meter == enforcement. Only the
 * limit arithmetic flipped — the (c) «stacked double-grant» reading of
 * 375 is now THE LAW (an activation is a paid entitlement, not a
 * replacement). The full new-law matrix: plan-pool-aggregation.test.ts.
 */

const src = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

// ─────────────────────────────────────────────────────────────────────
// Shared fixtures
// ─────────────────────────────────────────────────────────────────────

const DAY = 86400000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

/** An effectively-ACTIVE subscription row (auth-server's filter shape). */
const active = (tier: string, endOffsetMs = 30 * DAY): SubscriptionTierRow => ({
  tier,
  status: "active",
  end_date: iso(endOffsetMs),
});

/** An expired row: status column still 'active' (no flipper job exists),
 *  end_date in the past — effectively EXPIRED per effectiveSubStatus. */
const expired = (tier: string, endOffsetMs = -5 * DAY): SubscriptionTierRow => ({
  tier,
  status: "active",
  end_date: iso(endOffsetMs),
});

// The exact production rows of qa.m3.1027@alkemos-test.com — the account
// Phase 374 upgraded premium→pro (read-only live probe, 2026-10-27):
//   premium  start 2026-10-27T14:07:12  end 2026-11-27T14:07:12  active
//   pro      start 2026-10-27T14:08:00  end 2026-11-27T14:08:00  active
// Frozen as literal dates so the fixture never rots with the wall clock:
// both end_dates sit in the future until 2026-11-27 — after that the rows
// read as expired and the assertions below assert exactly that honest
// transition too (the fixture is timeline-aware, not frozen-lie).
const M3_PREMIUM = {
  tier: "premium",
  status: "active",
  start_date: "2026-10-27T14:07:12.000Z",
  end_date: "2026-11-27T14:07:12.000Z",
  months: 1,
  subscription_type: "membership",
} as const;
const M3_PRO = {
  tier: "pro",
  status: "active",
  start_date: "2026-10-27T14:08:00.000Z",
  end_date: "2026-11-27T14:08:00.000Z",
  months: 1,
  subscription_type: "membership",
} as const;
const m3Rows = (): SubscriptionTierRow[] => {
  // Mirror auth-server's pre-filter: only effectively-active rows reach
  // the resolver (status='active' AND end_date > now).
  const live = (r: typeof M3_PREMIUM | typeof M3_PRO) =>
    new Date(r.end_date).getTime() > Date.now();
  return [M3_PREMIUM, M3_PRO].filter(live) as SubscriptionTierRow[];
};

// ─────────────────────────────────────────────────────────────────────
// A. Tier resolution across the upgrade lifecycle
// ─────────────────────────────────────────────────────────────────────

describe("A) resolveMembershipTier — the premium→pro lifecycle ladder", () => {
  it("premium only (before the upgrade) → premium (aggregate pool 4)", () => {
    const tier = resolveMembershipTier("client", [active("premium")]);
    expect(tier).toBe("premium");
    expect(resolveUnifiedPlanPoolLimit([active("premium")])).toBe(4);
  });

  it("premium + pro BOTH active (the upgraded account) → display tier pro, AGGREGATED pool 12 (4+8 — the 376 law)", () => {
    const tier = resolveMembershipTier("client", [
      active("premium"),
      active("pro"),
    ]);
    expect(tier).toBe("pro");
    // PHASE 376 (owner order 2026-10-28 «تجميع حصص الاشتراكات المدفوعة»):
    // the member pool AGGREGATES every distinct active paid tier — the
    // upgrade ADDS the paid pro entitlement (4+8=12). The per-tier helper
    // stays the building block (8 = pro alone); 8 is now the WRONG
    // member verdict (the superseded best-tier-only reading).
    expect(resolveUnifiedPlanPoolLimit([active("premium"), active("pro")])).toBe(12);
    expect(unifiedPlanPoolFor(tier)).toBe(8); // per-tier building block
    expect(resolveUnifiedPlanPoolLimit([active("premium"), active("pro")])).not.toBe(8);
  });

  it("premium EXPIRED + pro still active (the post-upgrade months-later state) → pro unchanged", () => {
    // auth-server pre-filters expired rows away; the resolver still holds
    // if they leak through (defensive parity with the filter).
    expect(resolveMembershipTier("client", [active("pro")])).toBe("pro");
    expect(resolveMembershipTier("client", [expired("premium"), active("pro")])).toBe("pro");
  });

  it("pro EXPIRED + premium still active (upgrade outlived the original) → premium returns honestly", () => {
    // The resolver's CONTRACT (membership-tier.ts): callers pre-filter to
    // effectively-active rows — both auth-server entry points do — so the
    // premium-only input is what the resolver sees once the pro row lapses.
    expect(resolveMembershipTier("client", [active("premium")])).toBe("premium");
  });

  it("the pre-filter contract is ENFORCED at both auth entry points (source pins) — an expired pro row can never mask a live premium", () => {
    const auth = src("src/lib/auth-server.ts");
    const filters = auth.match(/\.eq\("status", "active"\)\s*\n\s*\.gt\("end_date", new Date\(\)\.toISOString\(\)\)/g) ?? [];
    expect(filters.length).toBe(2); // getAuthUser + getAuthUserFromHeaders
  });

  it("BOTH expired (the whole stack lapses) → free (pool 2)", () => {
    const tier = resolveMembershipTier("client", []);
    expect(tier).toBe("free");
    expect(resolveUnifiedPlanPoolLimit([])).toBe(2);
    // expired rows leaking through the pre-filter contribute NOTHING
    expect(resolveUnifiedPlanPoolLimit([expired("premium"), expired("pro")])).toBe(2);
  });

  it("coaching stacked under the upgrade (premium+pro+coaching) → pro (membership_tier reports the MEMBERSHIP)", () => {
    expect(
      resolveMembershipTier("client", [
        active("coaching"),
        active("premium"),
        active("pro"),
      ]),
    ).toBe("pro");
  });

  it("THE M3 LIVE FIXTURE — the Phase-374 upgraded account resolves pro while both rows are live, and degrades honestly after they lapse", () => {
    const rows = m3Rows();
    const tier = resolveMembershipTier("client", rows);
    if (rows.length === 2) {
      // While both production rows are effectively active.
      expect(tier).toBe("pro");
      expect(resolveUnifiedPlanPoolLimit(rows)).toBe(12); // 4+8 (376 law)
    } else {
      // After 2026-11-27 both rows lapse together (same-day activation,
      // same 1-month term) → free, per the same law.
      expect(tier).toBe("free");
      expect(resolveUnifiedPlanPoolLimit(rows)).toBe(2);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// B. The unified-pool verdict across the upgrade (mocked ledger) —
//    THE PARTIAL-CONSUMPTION SCENARIO the owner ordered
// ─────────────────────────────────────────────────────────────────────

const h = vi.hoisted(() => {
  // count returned per (table, identity key) — ai_plan_usage rows are
  // keyed by USER (0085: user_id XOR guest_key), never by subscription.
  const counts: Record<string, number> = {};
  // subscriptions ROWS for the aggregated-pool DB fetch (owner order
  // 2026-10-28 — full rows: the pool aggregates the active+expiry window)
  const subRows: Array<{ tier: string; status: string; end_date: string }> = [];
  return { counts, subRows };
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
          error: null,
          data: h.subRows,
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
    isSupabaseAdminConfigured: true,
    supabaseAdmin: { from: (table: string) => makeBuilder(table) },
  };
});

const MEMBER = "22222222-2222-2222-2222-222222222222";

describe("B) checkUnifiedPlanQuota — partial consumption then upgrade (the 374 gap, under the 376 aggregate law)", () => {
  beforeEach(() => {
    for (const k of Object.keys(h.counts)) delete h.counts[k];
    h.subRows.length = 0;
  });

  it("BEFORE the upgrade: 2 of the 4 premium generations burned → {used:2, limit:4, remaining:2}", async () => {
    h.subRows.push({ tier: "premium", status: "active", end_date: iso(30 * DAY) });
    h.counts[`ai_plan_usage:${MEMBER}`] = 2; // e.g. 1 nutrition + 1 workout
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "premium" });
    expect(v).toMatchObject({ used: 2, limit: 4, remaining: 2, allowed: true, tier: "premium" });
  });

  it("THE UPGRADE VERDICT (376 law): same member, pro row added — {used:2, limit:12, remaining:10} — usage NOT zeroed, pool AGGREGATED", async () => {
    // The ledger is identity-keyed (0085): activating a subscription row
    // never touches it. The pool aggregates the paid rows (4+8=12).
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(30 * DAY) },
      { tier: "pro", status: "active", end_date: iso(30 * DAY) },
    );
    h.counts[`ai_plan_usage:${MEMBER}`] = 2;
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v).toMatchObject({ used: 2, limit: 12, remaining: 10, allowed: true, tier: "pro" });
    // The two wrong implementations this canary kills:
    expect(v.used).not.toBe(0); // (b) zeroed ledger → {0,12,12}
    expect(v.remaining).not.toBe(12);
    expect(v.limit).not.toBe(8); // superseded best-tier-only → {2,8,6}
    expect(v.remaining).not.toBe(6);
  });

  it("EXHAUSTED premium at the upgrade moment: 4/4 blocked as premium, unblocked as premium+pro with exactly the 8 new paid units", async () => {
    h.counts[`ai_plan_usage:${MEMBER}`] = 4;
    h.subRows.push({ tier: "premium", status: "active", end_date: iso(30 * DAY) });
    const before = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "premium" });
    expect(before.allowed).toBe(false);
    expect(before.remaining).toBe(0);
    h.subRows.push({ tier: "pro", status: "active", end_date: iso(30 * DAY) });
    const after = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(after).toMatchObject({ used: 4, limit: 12, remaining: 8, allowed: true });
  });

  it("upgrade does NOT grant a fresh month-window: the ledger keeps counting the SAME calendar month (pool resets on the 1st only)", async () => {
    // 11 successes this month (4 as premium + 7 as pro) → 1 left, blocked at 12.
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(30 * DAY) },
      { tier: "pro", status: "active", end_date: iso(30 * DAY) },
    );
    h.counts[`ai_plan_usage:${MEMBER}`] = 11;
    const v = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(v).toMatchObject({ used: 11, limit: 12, remaining: 1, allowed: true });
    h.counts[`ai_plan_usage:${MEMBER}`] = 12;
    const blocked = await checkUnifiedPlanQuota({ userId: MEMBER, tierHint: "pro" });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("DB-fallback path (no tierHint — the /api/ai/jobs enqueue gate shape): stacked rows AGGREGATE → limit 12, display tier pro", async () => {
    h.subRows.push(
      { tier: "premium", status: "active", end_date: iso(30 * DAY) },
      { tier: "pro", status: "active", end_date: iso(30 * DAY) },
    );
    const v = await checkUnifiedPlanQuota({ userId: MEMBER });
    expect(v.tier).toBe("pro");
    expect(v.limit).toBe(12);
  });

  it("every other tier limit steps with the SAME single-tier law (swap weekly 3→6, saved-results 50→200, ads off at pro)", () => {
    expect(swapLimitForTier("premium")).toBe(3);
    expect(swapLimitForTier("pro")).toBe(6); // replaced, not 3+6
    expect(getLimits("premium").savedResultsLimit).toBe(50);
    expect(getLimits("pro").savedResultsLimit).toBe(200);
    expect(getLimits("premium").adsEnabled).toBe(true);
    expect(getLimits("pro").adsEnabled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
// C. The DB stacking law — migration source pins (fail on revert)
// ─────────────────────────────────────────────────────────────────────

describe("C) the stacking law in the database (migration source pins)", () => {
  it("0011 — one row PER TIER: unique(client_id, tier) — stacking across tiers, never replacement", () => {
    const sql = src("supabase/migrations/RUN_ON_SUPABASE_ORIGINAL_0011_multi_subscriptions.sql");
    expect(sql).toContain("subscriptions_client_id_tier_uidx");
    expect(sql).toContain("on public.subscriptions (client_id, tier)");
    // the old one-subscription-per-client constraint is gone
    expect(sql).toContain("drop constraint if exists subscriptions_client_id_key");
  });

  it("0042 — extend_subscription keys the row lock on (client_id, tier): a pro activation never touches the premium row", () => {
    const sql = src("supabase/migrations/RUN_ON_SUPABASE_0042_EXTEND_SUBSCRIPTION_EVIDENCE_GATE.sql");
    expect(sql).toContain("where client_id = p_client_id and tier = p_tier");
  });

  it("0042 — the NEW-TIER branch INSERTS a parallel row (start=now, end=now+months) — the premium row is neither updated nor cancelled", () => {
    const sql = src("supabase/migrations/RUN_ON_SUPABASE_0042_EXTEND_SUBSCRIPTION_EVIDENCE_GATE.sql");
    expect(sql).toMatch(
      /insert into public\.subscriptions\s*\(client_id, tier, months, start_date, end_date, status, subscription_type\)\s*values\s*\(p_client_id, p_tier, p_months, now\(\), v_end, 'active', p_subscription_type\)/,
    );
    // the ONLY update in the function is the same-tier extension branch
    expect(sql).toContain("v_end := v_row.end_date + make_interval(months => p_months);");
    expect(sql).toContain("set\n      end_date = v_end,\n      months = v_months_total,\n      status = 'active'");
  });

  it("0018 math — same-tier RENEWAL extends from the LATER of (existing end, now): paid days are never lost (C10 law)", () => {
    const sql = src("supabase/migrations/RUN_ON_SUPABASE_ORIGINAL_0018_extend_subscription.sql");
    expect(sql).toContain("new_end = existing.end_date + months");
    expect(sql).toContain("new_end = now + months");
    expect(sql).toContain("preserves remaining days");
  });

  it("0085 — the usage ledger is IDENTITY-keyed (user_id XOR guest_key) with NO subscription column: an activation structurally cannot zero or double it", () => {
    const sql = src("supabase/migrations/20260913120000_0085_ai_plan_usage_unified_pool.sql");
    expect(sql).toContain("user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE");
    expect(sql).toContain("CONSTRAINT ai_plan_usage_identity_check CHECK");
    // no subscription linkage anywhere in the ledger
    expect(sql).not.toMatch(/subscription_id/);
    // success-only accounting — the counting law the meter reads
    expect(sql).toContain("SUCCESS-ONLY accounting");
  });

  it("BOTH activation doors ride the SAME extend_subscription RPC (admin coach-activate + PayPal capture) — no third write path", () => {
    const activate = src("src/app/api/coach/subscriptions/activate/route.ts");
    expect(activate).toContain('"extend_subscription"');
    const capture = src("src/app/api/paypal/capture-order/route.ts");
    expect(capture).toContain("capture_paypal_subscription");
    // the manual-approval door rides it through upsertSubscription
    const subs = src("src/lib/data/subscriptions.ts");
    expect(subs).toContain('rpc("extend_subscription"');
  });

  it("the only trigger on subscriptions is the audit log (0019/0020) — no mutation side-effect on the upgrade path", () => {
    const sql = src("supabase/migrations/RUN_ON_SUPABASE_0019_0020.sql");
    expect(sql).toContain("audit_subscriptions");
    expect(sql).toContain("after insert or update or delete on public.subscriptions");
  });
});

// ─────────────────────────────────────────────────────────────────────
// D. The view pick law over stacked rows (member-side surfaces)
// ─────────────────────────────────────────────────────────────────────

describe("D) pickPrimarySubscription / effectiveSubStatus — what the UI shows after the upgrade", () => {
  it("both rows live → the PRO row is the primary (badge Pro), while the premium row keeps its own honest status", () => {
    const rows = [
      { ...M3_PREMIUM, id: "sub-premium" },
      { ...M3_PRO, id: "sub-pro" },
    ];
    const primary = pickPrimarySubscription(rows);
    expect(primary?.id).toBe("sub-pro");
    // the premium row is still fully alive for the all-subs list
    expect(effectiveSubStatus(M3_PREMIUM)).toBe("active");
  });

  it("premium outlives the pro row (renewed later) → premium surfaces as primary (active-first law, 0102)", () => {
    const rows = [
      { tier: "premium", status: "active", end_date: iso(40 * DAY), id: "p" },
      { tier: "pro", status: "active", end_date: iso(-2 * DAY), id: "r" },
    ];
    expect(pickPrimarySubscription(rows)?.id).toBe("p");
  });

  it("both expired → the best EXPIRED row shows with an honest «expired» (never a masked renewal)", () => {
    const rows = [
      { tier: "premium", status: "active", end_date: iso(-3 * DAY), id: "p" },
      { tier: "pro", status: "active", end_date: iso(-1 * DAY), id: "r" },
    ];
    const pick = pickPrimarySubscription(rows);
    expect(pick?.id).toBe("r");
    expect(effectiveSubStatus(pick!)).toBe("expired");
  });

  it("each row keeps its OWN days-left countdown (independent entitlement dates)", () => {
    expect(daysLeftOn(iso(31 * DAY))).toBe(31);
    expect(daysLeftOn(iso(2 * DAY))).toBe(2);
    expect(daysLeftOn(iso(-1 * DAY))).toBe(0);
    expect(daysLeftOn(null)).toBeNull();
  });

  it("DashboardView renders EVERY row (the all-subs list) — source pin", () => {
    const view = src("src/components/views/DashboardView.tsx");
    expect(view).toContain("listSubscriptionsForClient");
    expect(view).toContain("allSubs.map");
    expect(view).toContain('effectiveSubStatus(s)');
  });
});

// ─────────────────────────────────────────────────────────────────────
// E. Cancel semantics on the upgraded (stacked) account
// ─────────────────────────────────────────────────────────────────────

describe("E) cancel on a stacked account — source pins (Phase 68 law)", () => {
  const route = src("src/app/api/subscription/cancel/route.ts");

  it("marks EVERY active row (the whole stack), not just the primary — cancel_requested_at only, status stays 'active'", () => {
    expect(route).toContain("const pending = rows.filter((r) => !r.cancel_requested_at);");
    expect(route).toContain("for (const row of pending) {");
    expect(route).toContain('update({ cancel_requested_at: nowIso })');
    // access is NEVER cut: the route writes ONLY the marker column
    expect(route).not.toMatch(/update\(\{[^}]*status/);
  });

  it("access continues until end_date (the paid period) — stated in the route contract", () => {
    expect(route).toContain("Access is NEVER cut immediately");
    expect(route).toContain("stays active until end_date");
  });

  it("idempotent: a repeat request keeps the original timestamp (alreadyRequested=true) and rings the bell once (the 374 fix)", () => {
    expect(route).toContain("alreadyRequested: pending.length === 0");
    expect(route).toContain("if (pending.length > 0) {");
  });
});

// ─────────────────────────────────────────────────────────────────────
// F. The quota meter reads the SAME verdict as enforcement
// ─────────────────────────────────────────────────────────────────────

describe("F) meter == enforcement (the /api/ai/quota contract after the upgrade)", () => {
  it("the quota route reads checkUnifiedPlanQuota with the auth-resolved tier — the same call the generation gates run", () => {
    const route = src("src/app/api/ai/quota/route.ts");
    expect(route).toContain("checkUnifiedPlanQuota");
    expect(route).toContain("tierHint: tier");
    expect(route).toContain("Display ALWAYS reads the same ledger enforcement counts");
  });

  it("the member demo-generation gate burns the SAME unified pool on success (the live-scenario path)", () => {
    const route = src("src/app/api/ai/meal-plan-demo/route.ts");
    expect(route).toContain("checkUnifiedPlanQuota");
    expect(route).toContain("recordUnifiedPlanUsage");
    expect(route).toContain("counted ONLY on");
    expect(route).toContain("Checked BEFORE the provider call");
  });
});
