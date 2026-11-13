import { describe, it, expect } from "vitest";
import {
  MEMBERSHIPS,
  getLimits,
  COMPARISON_ROWS,
  translateCell,
  renewalCheckoutUrlFor,
  upgradeCheckoutUrlFor,
} from "@/lib/memberships";

describe("memberships", () => {
  describe("MEMBERSHIPS", () => {
    it("should have 4 tiers (free, premium, pro, coaching)", () => {
      expect(MEMBERSHIPS).toHaveLength(4);
      const ids = MEMBERSHIPS.map((m) => m.id);
      expect(ids).toContain("free");
      expect(ids).toContain("premium");
      expect(ids).toContain("pro");
      expect(ids).toContain("coaching");
    });

    it("free tier should have priceMonthly = 0", () => {
      const free = MEMBERSHIPS.find((m) => m.id === "free");
      expect(free?.priceMonthly).toBe(0);
    });

    it("premium should cost $14.99/month", () => {
      const premium = MEMBERSHIPS.find((m) => m.id === "premium");
      expect(premium?.priceMonthly).toBe(14.99);
    });

    it("pro should cost $29.99/month", () => {
      const pro = MEMBERSHIPS.find((m) => m.id === "pro");
      expect(pro?.priceMonthly).toBe(29.99);
    });

    it("coaching should cost $39.99/month", () => {
      const coaching = MEMBERSHIPS.find((m) => m.id === "coaching");
      expect(coaching?.priceMonthly).toBe(39.99);
    });

    it("each tier should have both Arabic and English features", () => {
      for (const m of MEMBERSHIPS) {
        expect(m.features.length).toBeGreaterThan(0);
        expect(m.featuresEn.length).toBe(m.features.length);
      }
    });

    it("coaching should be marked as separate", () => {
      const coaching = MEMBERSHIPS.find((m) => m.id === "coaching");
      expect(coaching?.separate).toBe(true);
    });
  });

  describe("getLimits", () => {
    // AI-QUOTAS completion order 2026-11-14: generation is subscriber-only
    // (free quota 0) and swaps are ONE UNIFIED monthly quota (meal +
    // exercise combined — the per-type split is retired).
    it("free tier: 10 EVO messages/day, 0 generation, 0 swaps", () => {
      const limits = getLimits("free");
      expect(limits.evoChatDailyLimit).toBe(10);
      expect(limits.aiPlanMonthlyLimit).toBe(0);
      expect(limits.evoSwapMonthlyLimit).toBe(0);
    });

    it("premium tier: unlimited EVO, 4 generations, 8 swaps per month (unified)", () => {
      const limits = getLimits("premium");
      expect(limits.evoChatDailyLimit).toBeNull();
      expect(limits.aiPlanMonthlyLimit).toBe(4);
      expect(limits.evoSwapMonthlyLimit).toBe(8);
    });

    it("pro tier: unlimited EVO, 8 generations, 16 swaps per month (unified)", () => {
      const limits = getLimits("pro");
      expect(limits.evoChatDailyLimit).toBeNull();
      expect(limits.aiPlanMonthlyLimit).toBe(8);
      expect(limits.evoSwapMonthlyLimit).toBe(16);
    });

    it("coaching tier inherits every Pro quota (8 generations, 16 swaps)", () => {
      const limits = getLimits("coaching");
      expect(limits.aiPlanMonthlyLimit).toBe(getLimits("pro").aiPlanMonthlyLimit);
      expect(limits.evoSwapMonthlyLimit).toBe(getLimits("pro").evoSwapMonthlyLimit);
    });
  });

  describe("COMPARISON_ROWS", () => {
    it("should have featureEn on every row", () => {
      for (const row of COMPARISON_ROWS) {
        expect(row.featureEn).toBeTruthy();
        expect(row.feature).toBeTruthy();
      }
    });
  });

  describe("translateCell", () => {
    it("should return Arabic value when isAr=true", () => {
      expect(translateCell("غير محدود", true)).toBe("غير محدود");
    });

    it("should return English value when isAr=false", () => {
      expect(translateCell("غير محدود", false)).toBe("Unlimited");
    });

    it("should pass through neutral values (✓, —, numbers)", () => {
      expect(translateCell("✓", true)).toBe("✓");
      expect(translateCell("—", false)).toBe("—");
      expect(translateCell("50", true)).toBe("50");
    });

    // Completion order 2026-11-14 §6: the unified swap numbers translate.
    it("translates the unified swap cells (8/16 per month)", () => {
      expect(translateCell("8/شهر", false)).toBe("8/mo");
      expect(translateCell("16/شهر", false)).toBe("16/mo");
    });
  });

  // AI-QUOTAS completion order §3: the exhaustion UX links ride the
  // EXISTING payment path (/checkout?tier=&months=) — never a new surface.
  describe("renewal/upgrade checkout links (§3 exhaustion UX)", () => {
    it("paid tiers renew via the existing checkout path (1 month)", () => {
      expect(renewalCheckoutUrlFor("premium")).toBe("/checkout?tier=premium&months=1");
      expect(renewalCheckoutUrlFor("pro")).toBe("/checkout?tier=pro&months=1");
      expect(renewalCheckoutUrlFor("coaching")).toBe("/checkout?tier=coaching&months=1");
    });

    it("free/guest get NO renewal link (the memberships-page subscribe CTA covers them)", () => {
      expect(renewalCheckoutUrlFor("free")).toBeNull();
      expect(renewalCheckoutUrlFor("guest")).toBeNull();
    });

    it("upgrade climbs the ladder: premium→pro, pro→coaching", () => {
      expect(upgradeCheckoutUrlFor("premium")).toBe("/checkout?tier=pro&months=1");
      expect(upgradeCheckoutUrlFor("pro")).toBe("/checkout?tier=coaching&months=1");
    });

    it("coaching is the top tier — NO upgrade link (renewal only, never a dead link)", () => {
      expect(upgradeCheckoutUrlFor("coaching")).toBeNull();
      expect(upgradeCheckoutUrlFor("free")).toBeNull();
      expect(upgradeCheckoutUrlFor("guest")).toBeNull();
    });
  });
});
