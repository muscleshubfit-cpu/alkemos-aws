import { describe, it, expect } from "vitest";
import { MEMBERSHIPS, getLimits, COMPARISON_ROWS, translateCell } from "@/lib/memberships";

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
    // AI-QUOTAS 2026-11-14: generation is subscriber-only (free quota 0)
    // and swaps became INDEPENDENT monthly quotas per type.
    it("free tier: 10 EVO messages/day, 0 generation, 0 swaps", () => {
      const limits = getLimits("free");
      expect(limits.evoChatDailyLimit).toBe(10);
      expect(limits.aiPlanMonthlyLimit).toBe(0);
      expect(limits.evoSwapMonthlyLimit).toBe(0);
    });

    it("premium tier: unlimited EVO, 4 generations, 13 swaps/type per month", () => {
      const limits = getLimits("premium");
      expect(limits.evoChatDailyLimit).toBeNull();
      expect(limits.aiPlanMonthlyLimit).toBe(4);
      expect(limits.evoSwapMonthlyLimit).toBe(13);
    });

    it("pro tier: unlimited EVO, 8 generations, 26 swaps/type per month", () => {
      const limits = getLimits("pro");
      expect(limits.evoChatDailyLimit).toBeNull();
      expect(limits.aiPlanMonthlyLimit).toBe(8);
      expect(limits.evoSwapMonthlyLimit).toBe(26);
    });

    it("coaching tier inherits every Pro quota (8 generations, 26 swaps)", () => {
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
  });
});
