import { describe, it, expect } from "vitest";
import { auditNutritionPlan } from "@/lib/plan-audit";
import { applyMemberSwapToContent } from "@/lib/member-swap-apply";

/**
 * P1 canaries — NUT-2's independent audit comparison (macro↔calorie
 * closure as a CRITICAL finding) and NUT-6's client-side day-budget
 * rejection (member-swap-apply).
 */

describe("NUT-2 — the audit's macro↔calorie closure finding", () => {
  it("declared macros that do not close on daily_calories are a CRITICAL finding", () => {
    const report = auditNutritionPlan({
      daily_calories: 1200,
      macros: { protein_g: 400, carbs_g: 24, fat_g: 100 }, // 1600+96+900 = 2596 kcal vs 1200
      meals: [
        {
          name: "فطار",
          items: [
            { food: "بيض مسلوق", amount: "3", calories: 210, protein_g: 18, carbs_g: 1, fat_g: 15 },
          ],
        },
      ],
    });
    const closure = report.findings.find((f) => f.code === "macro_closure_violation");
    expect(closure).toBeDefined();
    expect(closure?.severity).toBe("critical");
    expect(closure?.message).toContain("2596");
  });

  it("closed macros carry no closure finding", () => {
    const report = auditNutritionPlan({
      daily_calories: 2000,
      macros: { protein_g: 150, carbs_g: 200, fat_g: 67 }, // 600+800+603 = 2003 (±0.15%)
      meals: [
        {
          name: "فطار",
          items: [
            { food: "شوفان", amount: "60 جم", calories: 230, protein_g: 8, carbs_g: 40, fat_g: 4 },
          ],
        },
      ],
    });
    expect(report.findings.some((f) => f.code === "macro_closure_violation")).toBe(false);
  });
});

describe("NUT-6 — the member-side day-budget rejection (member-swap-apply)", () => {
  const plan = (mealCals: number[]) => ({
    daily_calories: 1000,
    meals: mealCals.map((c, i) => ({
      name: `وجبة ${i + 1}`,
      items: [
        { food: "صنف أول", amount: "100 جم", calories: Math.round(c * 0.7), protein_g: 20 },
        { food: "صنف ثانٍ", amount: "100 جم", calories: Math.round(c * 0.3), protein_g: 5 },
      ],
      total_calories: c,
      total_protein_g: 25,
    })),
    meals_total_calories: mealCals.reduce((s, c) => s + c, 0),
    macros: { protein_g: 120, carbs_g: 120, fat_g: 40 },
  });

  const replacement = (cals: number) => ({
    name: "وجبة بديلة",
    items: [
      { food: "دجاج مشوي", amount: "200 جم", calories: Math.round(cals * 0.6) },
      { food: "أرز", amount: "150 جم", calories: Math.round(cals * 0.4) },
    ],
  });

  it("an in-band swap applies and recomputes the totals", () => {
    const content = plan([400, 300, 300]);
    const out = applyMemberSwapToContent(content, "meal", 1, undefined, replacement(320));
    expect(out.ok).toBe(true);
    if (out.ok) {
      const meals = (out.content as { meals: Array<{ total_calories?: number }> }).meals;
      const total = meals.reduce((s, m) => s + (m.total_calories ?? 0), 0);
      expect(Math.abs(total - 1020)).toBeLessThanOrEqual(2);
    }
  });

  it("the ratchet swap (+20% over an already-inflated day) is REJECTED with the named reason", () => {
    // day already at 1250 vs the 1000 target (within ±25%); a swap that
    // pushes the meal +20% breaches the day band → rejection
    const content = plan([500, 375, 375]);
    const out = applyMemberSwapToContent(content, "meal", 0, undefined, replacement(620));
    expect(out.ok).toBe(false);
    expect(out.ok === false && out.error).toContain("ميزانية اليوم");
  });

  it("a plan without a declared budget applies without the day check (honest skip)", () => {
    const content = plan([400, 300, 300]) as Record<string, unknown>;
    delete content.daily_calories;
    const out = applyMemberSwapToContent(content, "meal", 0, undefined, replacement(700));
    expect(out.ok).toBe(true);
  });
});
