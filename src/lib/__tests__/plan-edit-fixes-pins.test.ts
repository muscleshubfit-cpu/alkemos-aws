import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * PLAN-EDIT-2026-10-24 (owner order 2026-10-24 «لسه الشاشه لا تظهر كاملة
 * … التعديل والتبديل بالذكاء الاصطناعي … اختيارات من مكتبة الأطعمة …
 * تغير كل السعرات والماكروز لكامل الخطة») — source pins for the coach
 * plan-editor wiring. The repo's established canary pattern: these fail
 * when someone reverts the modal header wrap (the measured 639px-in-328px
 * root cause), drops the food-library combobox, unwires the pick→recalc
 * chain, or hides the AI swap tools from edit mode again.
 */

const src = (rel: string) =>
  readFileSync(join(process.cwd(), "src", rel), "utf8");

describe("root cause 1 — the modal header must wrap (screen fully visible)", () => {
  it("the header row is min-w-0 + flex-wrap and the actions cluster wrapps (no more off-screen paint)", () => {
    const s = src("components/ui/modal.tsx");
    expect(s).toContain('flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-2');
    // shrink-0 on the actions cluster was the un-wrappable half of the bug
    expect(s).toContain('flex flex-wrap items-center gap-2');
    expect(s).not.toContain("flex shrink-0 items-center gap-2");
  });

  it("the body cap is dvh-aware so the wrapped header can never push the dialog off a short phone", () => {
    const s = src("components/ui/modal.tsx");
    expect(s).toContain("max-h-[min(70vh,calc(100dvh-14rem))]");
    // the NOTIF→PLAN item-6 fix is still in place (no regression)
    expect(s).toContain('"min-w-0"');
    expect(s).toContain("overflow-x-auto overflow-y-auto");
  });
});

describe("root cause 2 — coach edit/swap/AI reachable on every screen", () => {
  it("the modal-header regenerate label is icon-only on phones (the overflow surface)", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toMatch(/RefreshCw[^}]*\}\s*<span className="hidden sm:inline">إعادة توليد<\/span>/);
  });

  it("the per-item AI swap column exists in BOTH view and edit modes (one shared header cell)", () => {
    const s = src("components/views/CoachClientView.tsx");
    // Scope to the MEALS table (the styled المكون header → Workout
    // section): the PDF template also prints a bare المكون th, and the
    // workout table legitimately keeps its own two-conditional th pair.
    const mealsStart = s.indexOf('text-muted-foreground">المكون</th>');
    // The JSX comment (line ~2770) — the PDF function has a plainer
    // "// Workout volume + progression" comment much earlier in the file.
    const mealsEnd = s.indexOf("{/* Workout volume + progression — editable */}");
    expect(mealsStart).toBeGreaterThan(-1);
    expect(mealsEnd).toBeGreaterThan(mealsStart);
    const mealsTable = s.slice(mealsStart, mealsEnd);
    // before: {!editMode && <th>} + {editMode && <th>} — the swap button
    // was view-only and the delete button edit-only; now ONE column
    // carries swap always + delete in edit mode.
    expect(mealsTable).not.toContain("{!editMode && <th");
    expect(mealsTable).not.toContain("{editMode && <th");
    expect(mealsTable).toMatch(/regenerateSingleItem\(mealIdx, itemIdx\)/);
    expect(mealsTable).toMatch(/removeMealItem\(mealIdx, itemIdx\)/);
  });

  it("the per-meal regenerate button is no longer view-only", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).not.toContain("{!editMode && (\n <Button\n size=\"sm\"\n variant=\"outline\"\n className=\"gap-1.5 border-primary/30 text-primary\"");
    expect(s).toContain("regenerateSingleMeal(mealIdx)");
  });
});

describe("root cause 3 — food-library autocomplete on the item name", () => {
  it("the food cell in edit mode is the FoodPickerCell combobox", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain("function FoodPickerCell({");
    expect(s).toMatch(/editMode \? \(\s*<FoodPickerCell/);
    expect(s).toContain("onPick={pickLibraryFood}");
  });

  it("the combobox rides a PORTAL dropdown (survives the table's overflow-x-auto) and keeps focus in the input", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain("PopoverAnchor asChild");
    expect(s).toContain("onOpenAutoFocus={(e) => e.preventDefault()}");
    expect(s).toContain('onMouseDown={(e) => e.preventDefault()}');
    expect(s).toContain("/api/food-search?q=");
  });

  it("the API returns the local row's default serving (grams prefill on pick)", () => {
    const s = src("app/api/food-search/route.ts");
    expect(s).toContain("defaultGrams: f.defaultGrams");
    expect(s).toContain("servingAr: f.defaultServingAr");
  });

  it("the silent first-match auto-calc is GONE (choices, not guesses)", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).not.toContain("const match = data.results?.[0];");
    expect(s).not.toMatch(/await fetch\(`\/api\/food-search[\s\S]{0,300}results\?\.\[0\]/);
  });
});

describe("root cause 4 — pick/grams recalcs every calorie + macro of the plan", () => {
  it("the editor uses the shared pure math (parseGrams + scalePer100g + recomputeNutritionTotals)", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain('from "@/lib/nutrition-totals"');
    expect(s).toContain("pickLibraryFood");
    expect(s).toContain("recomputeNutritionTotals(newContent)");
    expect(s).toMatch(/const recomputeTotals = \(c: NutritionPlanContent\) => recomputeNutritionTotals\(c\)/);
  });

  it("session bindings are bound per pick and invalidated on AI swap / meal regen / item removal", () => {
    const s = src("components/views/CoachClientView.tsx");
    expect(s).toContain("useState<Record<string, BoundFood>>");
    expect(s).toContain("delete next[`${mealIdx}:${itemIdx}`];");
    expect(s).toContain("if (k.startsWith(`${mealIdx}:`)) continue;");
    // the removal re-keys later indices (index-shifted bindings would
    // recalc from the WRONG food)
    expect(s).toContain("next[`${m}:${i - 1}`] = v;");
  });

  it("the pure math leaf exists and is the one home of the chain (no inline drift)", () => {
    const s = src("lib/nutrition-totals.ts");
    expect(s).toContain("export function parseGrams");
    expect(s).toContain("export function scalePer100g");
    expect(s).toContain("export function recomputeNutritionTotals");
    expect(s).toContain("next.macros.fat_cal = next.macros.fat_g * 9;");
    // CALORIE-TARGET 2026-10-24: the target (daily_calories) is PRESERVED
    // through every recompute — the actual rides meals_total_calories.
    expect(s).toContain("next.meals_total_calories = sum((m) => numOr(m.total_calories));");
    expect(s).toContain("next.daily_calories = numOr(next.daily_calories);");
  });
});
