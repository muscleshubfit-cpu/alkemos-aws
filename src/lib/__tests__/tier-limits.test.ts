import { describe, it, expect } from "vitest";
import {
  evoChatLimitFor,
  swapLimitForTier,
  checkEvoChatLimit,
  checkUnifiedPlanQuota,
  unifiedPlanPoolFor,
  checkSwapQuota,
  planPoolBillingForRequester,
  cycleWindowStartUtc,
  earliestPaidStartIso,
  quotaWindowStartForSubs,
  type SubRowWithStart,
} from "@/lib/tier-limits";

// ─────────────────────────────────────────────────────────────────────────────
// AI-QUOTAS 2026-11-14 (owner order «إعادة هيكلة سياسة الذكاء الاصطناعي
// والاشتراكات والأرصدة» + the corrective clarification — MONTHLY QUOTAS,
// developed; never credits/wallets). Governing doc:
// docs/AI-QUOTAS-POLICY-2026-11-14.md.
// ─────────────────────────────────────────────────────────────────────────────

describe("tier-limits", () => {
  describe("evoChatLimitFor", () => {
    it("free: 10 messages/day", () => {
      expect(evoChatLimitFor("free")).toBe(10);
    });

    it("premium: unlimited (null)", () => {
      expect(evoChatLimitFor("premium")).toBeNull();
    });

    it("pro: unlimited (null)", () => {
      expect(evoChatLimitFor("pro")).toBeNull();
    });

    it("coaching: unlimited (null)", () => {
      expect(evoChatLimitFor("coaching")).toBeNull();
    });
  });

  describe("swapLimitForTier (INDEPENDENT monthly quotas per type — 2026-11-14)", () => {
    it("free: 0 swaps (subscriber-only)", () => {
      expect(swapLimitForTier("free")).toBe(0);
    });

    it("premium: 13 swaps/type per month (evolved from the weekly 3 — 3/wk ≈ 13/mo)", () => {
      expect(swapLimitForTier("premium")).toBe(13);
    });

    it("pro: 26 swaps/type per month (evolved from the weekly 6 — 6/wk ≈ 26/mo)", () => {
      expect(swapLimitForTier("pro")).toBe(26);
    });

    it("coaching: 26/month (inherits every Pro benefit — spec 2026-09-13)", () => {
      expect(swapLimitForTier("coaching")).toBe(26);
    });
  });

  describe("unifiedPlanPoolFor (the 2026-09-13 decree kept as a monthly quota)", () => {
    it("free: 0 — generation is subscriber-only (2026-11-14 correction)", () => {
      expect(unifiedPlanPoolFor("free")).toBe(0);
    });

    it("premium: 4", () => {
      expect(unifiedPlanPoolFor("premium")).toBe(4);
    });

    it("pro: 8", () => {
      expect(unifiedPlanPoolFor("pro")).toBe(8);
    });

    it("coaching: 8 (inherits every Pro benefit)", () => {
      expect(unifiedPlanPoolFor("coaching")).toBe(8);
    });
  });

  // STAFF QUOTA SEMANTICS (2026-08-29): platform staff (role coach|admin)
  // bypass every consumer usage limit. The staffHint short-circuit fires
  // BEFORE any DB access, so these canaries run without Supabase config.
  describe("staff bypass (coach|admin)", () => {
    it("chat: staffHint=true → unlimited even on free tier", async () => {
      const r = await checkEvoChatLimit("staff-user", "free", true);
      expect(r.allowed).toBe(true);
      expect(r.unlimited).toBe(true);
      expect(r.limit).toBeNull();
    });

    it("unified plan quota: staffHint=true → unlimited, no DB access", async () => {
      const r = await checkUnifiedPlanQuota({
        userId: "staff-user",
        tierHint: "free",
        staffHint: true,
      });
      expect(r.allowed).toBe(true);
      expect(r.unlimited).toBe(true);
      expect(r.subscriptionRequired).toBe(false);
    });

    it("swap: staffHint=true → allowed + unlimited (check-only — 2026-11-14)", async () => {
      const r = await checkSwapQuota("staff-user", "meal", "free", true);
      expect(r.allowed).toBe(true);
      expect(r.unlimited).toBe(true);
      expect(r.limit).toBeNull();
      expect(r.subscriptionRequired).toBe(false);
    });

    it("non-staff free user: chat still limited to 10/day", async () => {
      // staffHint omitted → tier path; free tier limit = 10 (no DB in test
      // env → used=0 → allowed, but limit reflects the tier, not unlimited)
      const r = await checkEvoChatLimit("free-user", "free");
      expect(r.unlimited).toBe(false);
      expect(r.limit).toBe(10);
    });
  });

  // SUBSCRIBER-ONLY (2026-11-14): guests have NO generation path — the
  // verdict is blocked with subscriptionRequired, whatever keys are given.
  describe("subscriber-only generation gate", () => {
    it("guest (any dimensions) → blocked + subscriptionRequired", async () => {
      const r = await checkUnifiedPlanQuota({
        guestKey: "abc",
        ipKey: "def",
      });
      expect(r.allowed).toBe(false);
      expect(r.subscriptionRequired).toBe(true);
      expect(r.reason).toBe("subscription_required");
      expect(r.limit).toBe(0);
    });

    it("guest with NO dimensions at all → still blocked (fail-closed)", async () => {
      const r = await checkUnifiedPlanQuota({});
      expect(r.allowed).toBe(false);
      expect(r.subscriptionRequired).toBe(true);
    });
  });

  describe("planPoolBillingForRequester (attribution matrix + 2026-11-14 client branch)", () => {
    it("b2b coach → bills the client's quota", () => {
      expect(planPoolBillingForRequester("coach", "b2b").bill).toBe(true);
      expect(planPoolBillingForRequester("coach", null).bill).toBe(true);
    });

    it("site coach → NO client-quota burn (0067 law)", () => {
      const v = planPoolBillingForRequester("coach", "site");
      expect(v.bill).toBe(false);
      expect(v.reason).toContain("site-coach");
    });

    it("admin → NO client-quota burn (staff semantics)", () => {
      const v = planPoolBillingForRequester("admin", null);
      expect(v.bill).toBe(false);
      expect(v.reason).toContain("staff");
    });

    it("client self-service → bills the member's own quota (2026-11-14 dashboard path)", () => {
      const v = planPoolBillingForRequester("client", null);
      expect(v.bill).toBe(true);
      expect(v.reason).toContain("self-service");
    });

    it("unresolvable role → fail-open, no burn", () => {
      expect(planPoolBillingForRequester(null, null).bill).toBe(false);
      expect(planPoolBillingForRequester("whatever", null).bill).toBe(false);
    });
  });

  // ─────────── SUBSCRIPTION-CYCLE WINDOWS («تجديد الحصص وفق دورة الاشتراك») ───────────

  describe("cycleWindowStartUtc (anniversary-day monthly window)", () => {
    // Fixed "now": 2026-11-14 — a member who subscribed on the 5th of March
    // has windows [5th → 5th). The anchor day, not the calendar month.
    const NOW = new Date("2026-11-14T12:00:00Z");

    it("anchor day 5 → window starts on the 5th of the current month", () => {
      expect(cycleWindowStartUtc("2026-03-05T09:00:00Z", NOW)).toBe(
        "2026-11-05T00:00:00.000Z",
      );
    });

    it("anchor day 14 (today) → window starts today", () => {
      expect(cycleWindowStartUtc("2026-02-14T09:00:00Z", NOW)).toBe(
        "2026-11-14T00:00:00.000Z",
      );
    });

    it("anchor day 20 (still ahead this month) → window is LAST month's 20th", () => {
      expect(cycleWindowStartUtc("2026-01-20T09:00:00Z", NOW)).toBe(
        "2026-10-20T00:00:00.000Z",
      );
    });

    it("anchor day 31, now Nov 14 → the most recent occurrence is Oct 31 (Nov 30 is still ahead)", () => {
      expect(cycleWindowStartUtc("2026-01-31T09:00:00Z", NOW)).toBe(
        "2026-10-31T00:00:00.000Z",
      );
    });

    it("anchor day 31, now Nov 30 → clamped to the month's length (Nov 30) and current", () => {
      expect(cycleWindowStartUtc("2026-01-31T09:00:00Z", new Date("2026-11-30T12:00:00Z"))).toBe(
        "2026-11-30T00:00:00.000Z",
      );
    });

    it("anchor day 31, now Feb 10 → the most recent occurrence is Jan 31 (Feb 28 is still ahead)", () => {
      const feb = new Date("2027-02-10T12:00:00Z");
      expect(cycleWindowStartUtc("2026-01-31T09:00:00Z", feb)).toBe(
        "2027-01-31T00:00:00.000Z",
      );
    });

    it("no anchor → calendar-month fallback (the 1st)", () => {
      expect(cycleWindowStartUtc(null, NOW)).toBe("2026-11-01T00:00:00.000Z");
      expect(cycleWindowStartUtc("not-a-date", NOW)).toBe("2026-11-01T00:00:00.000Z");
    });

    it("year rollover: January anchor day 3 evaluated in December → Dec 3", () => {
      const dec = new Date("2026-12-10T12:00:00Z");
      expect(cycleWindowStartUtc("2026-01-03T09:00:00Z", dec)).toBe(
        "2026-12-03T00:00:00.000Z",
      );
    });
  });

  describe("earliestPaidStartIso (the stable anniversary anchor)", () => {
    const future = (d: string) => {
      const dt = new Date(d);
      dt.setUTCFullYear(dt.getUTCFullYear() + 10);
      return dt.toISOString();
    };
    const row = (
      tier: string,
      startIso: string | null,
      endIso = future("2026-01-01T00:00:00Z"),
      status = "active",
    ): SubRowWithStart =>
      ({ tier, status, end_date: endIso, start_date: startIso }) as SubRowWithStart;

    it("picks the EARLIEST active paid start_date (original relationship)", () => {
      const rows = [
        row("pro", "2026-11-03T00:00:00Z"),
        row("premium", "2026-03-05T00:00:00Z"),
      ];
      expect(earliestPaidStartIso(rows)).toBe("2026-03-05T00:00:00Z");
    });

    it("ignores free/unknown tiers and non-active rows", () => {
      const rows = [
        row("free", "2026-01-01T00:00:00Z"),
        row("mystery", "2026-01-02T00:00:00Z"),
        row("premium", "2025-12-01T00:00:00Z", "2026-01-01T00:00:00Z"), // expired
        row("pro", "2026-06-01T00:00:00Z"),
      ];
      expect(earliestPaidStartIso(rows)).toBe("2026-06-01T00:00:00Z");
    });

    it("0045 legacy rows (starter/elite) anchor too (paid products)", () => {
      const rows = [row("elite", "2026-02-01T00:00:00Z")];
      expect(earliestPaidStartIso(rows)).toBe("2026-02-01T00:00:00Z");
    });

    it("null start_date rows contribute nothing; empty/null rows → null", () => {
      expect(earliestPaidStartIso([row("premium", null)])).toBeNull();
      expect(earliestPaidStartIso([])).toBeNull();
      expect(earliestPaidStartIso(null)).toBeNull();
    });
  });

  describe("quotaWindowStartForSubs (window resolution + fail-safe)", () => {
    it("rows → the earliest paid anchor's window (subscribed on the 15th; now Nov 14 → window Oct 15 → Nov 15)", () => {
      const rows: SubRowWithStart[] = [
        {
          tier: "premium",
          status: "active",
          end_date: "2036-01-01T00:00:00Z",
          start_date: "2026-03-15T00:00:00Z",
        },
      ];
      const now = new Date("2026-11-14T12:00:00Z");
      expect(quotaWindowStartForSubs(rows, now)).toBe("2026-10-15T00:00:00.000Z");
    });

    it("null rows (read failure) → calendar-month fallback (fail-safe: a transient read never widens a window)", () => {
      const now = new Date("2026-11-14T12:00:00Z");
      expect(quotaWindowStartForSubs(null, now)).toBe("2026-11-01T00:00:00.000Z");
      expect(quotaWindowStartForSubs(undefined, now)).toBe("2026-11-01T00:00:00.000Z");
    });
  });
});
