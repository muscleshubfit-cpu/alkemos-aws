"use client";

import { useMemo, useState } from "react";
import type { RecipeIngredientView } from "@/lib/recipes-shared";

/**
 * RECIPE-SERVINGS-SCALER — the ONE client island of the recipe page
 * (HEALTHY-RECIPES-PLATFORM plan §9.2).
 *
 * Rescales the ingredient grams (1–12 servings, the DB CHECK bounds)
 * and recomputes the per-serving/per-recipe nutrition FROM THE
 * INGREDIENT DATA PASSED AS PROPS — zero network calls (the pure
 * calculateNutrition precedent: per100g × grams/100, summed, ÷
 * servings). The reference values crossed the boundary as plain
 * serializable numbers (the bundle law — no server-only imports).
 */

export type ScalerNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function RecipeServingsScaler({
  baseServings,
  ingredients,
  basePerServing,
  lang,
}: {
  baseServings: number;
  ingredients: RecipeIngredientView[];
  basePerServing: ScalerNutrition;
  lang: "en" | "ar";
}) {
  const isAr = lang === "ar";
  const [servings, setServings] = useState(baseServings);

  /** deterministic recompute — the same math as recipes-nutrition.ts */
  const computed = useMemo(() => {
    // totals stay CONSTANT (the whole recipe); only the per-serving
    // division changes with the servings dial.
    const totals: ScalerNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
    for (const ing of ingredients) {
      const f = ing.amountG / 100;
      totals.calories += ing.per100g.calories * f;
      totals.protein += ing.per100g.protein * f;
      totals.carbs += ing.per100g.carbs * f;
      totals.fat += ing.per100g.fat * f;
      totals.fiber += ing.per100g.fiber * f;
    }
    const per = {
      calories: totals.calories / servings,
      protein: totals.protein / servings,
      carbs: totals.carbs / servings,
      fat: totals.fat / servings,
      fiber: totals.fiber / servings,
    };
    return { totals, per };
  }, [ingredients, servings]);

  const factor = servings / baseServings;

  return (
    <div>
      {/* servings dial */}
      <div className="marble-card mb-6 p-5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">
              {isAr ? "مقيّد الحصص" : "Servings scaler"}
            </h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {isAr
                ? "غيّر عدد الحصص لتُعاد كتابة المقادير والقيم فورًا."
                : "Change the servings to rescale the ingredients and values instantly."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isAr ? "حصة أقل" : "Fewer servings"}
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tint)] text-lg font-semibold text-[var(--text)] transition-colors hover:bg-[var(--card)]"
            >
              −
            </button>
            <span className="min-w-16 text-center text-lg font-semibold tabular-nums">
              {isAr ? servings.toLocaleString("en-US") : servings}
            </span>
            <button
              type="button"
              aria-label={isAr ? "حصة أكثر" : "More servings"}
              onClick={() => setServings((s) => Math.min(12, s + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tint)] text-lg font-semibold text-[var(--text)] transition-colors hover:bg-[var(--card)]"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ingredients with grams (rescaled) */}
      <h3 className="text-lg font-semibold print:text-base">
        {isAr ? "المكونات (بالجرام)" : "Ingredients (in grams)"}
      </h3>
      <ul className="mt-3 space-y-2">
        {ingredients.map((ing) => {
          const g = ing.amountG * factor;
          const name = isAr ? ing.nameAr : ing.nameEn;
          const note = isAr ? ing.noteAr : ing.noteEn;
          return (
            <li
              key={ing.position}
              className="flex items-baseline justify-between gap-3 rounded-lg bg-[var(--tint)] px-4 py-2.5 print:bg-white print:px-0"
            >
              <span className="text-sm font-normal">
                {name}
                {ing.isOptional ? (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {" "}
                    ({isAr ? "اختياري" : "optional"})
                  </span>
                ) : null}
                {note ? <span className="text-xs text-[var(--muted-foreground)]"> — {note}</span> : null}
              </span>
              <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                {isAr
                  ? `${round(g).toLocaleString("en-US")} جم`
                  : `${round(g).toLocaleString("en-US")} g`}
                <span className="ml-1 text-[11px] font-normal text-[var(--muted-foreground)]">
                  ({isAr ? (ing.weightState === "raw" ? "نيئ" : "مطبوخ") : ing.weightState})
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {/* nutrition table — per serving AND per recipe */}
      <h3 className="mt-8 text-lg font-semibold print:mt-4 print:text-base">
        {isAr ? "القيم الغذائية" : "Nutrition facts"}
      </h3>
      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--edge)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--tint)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              <th className="px-4 py-2.5 font-medium">{isAr ? "المغذّي" : "Nutrient"}</th>
              <th className="px-4 py-2.5 text-right font-medium">
                {isAr ? `لكل حصة (من ${servings.toLocaleString("en-US")})` : `Per serving (of ${servings})`}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">
                {isAr ? "للوصفة كاملة" : "Whole recipe"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--edge)]">
            <NutritionRow
              label={isAr ? "السعرات" : "Calories"}
              unit={isAr ? "سعرة" : "kcal"}
              per={Math.round(computed.per.calories)}
              total={Math.round(computed.totals.calories)}
              isAr={isAr}
            />
            <NutritionRow
              label={isAr ? "البروتين" : "Protein"}
              unit="g"
              per={round(computed.per.protein)}
              total={round(computed.totals.protein)}
              isAr={isAr}
            />
            <NutritionRow
              label={isAr ? "الكربوهيدرات" : "Carbs"}
              unit="g"
              per={round(computed.per.carbs)}
              total={round(computed.totals.carbs)}
              isAr={isAr}
            />
            <NutritionRow
              label={isAr ? "الدهون" : "Fat"}
              unit="g"
              per={round(computed.per.fat)}
              total={round(computed.totals.fat)}
              isAr={isAr}
            />
            <NutritionRow
              label={isAr ? "الألياف" : "Fiber"}
              unit="g"
              per={round(computed.per.fiber)}
              total={round(computed.totals.fiber)}
              isAr={isAr}
            />
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        {isAr
          ? "القيم المحسوبة من بيانات المكونات أعلاه — تقريبًا لأقرب 0.1 جم."
          : "Computed from the ingredient data above — rounded to the nearest 0.1 g."}
      </p>
      {baseServings !== servings ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)] print:hidden">
          {isAr
            ? `القيم المرجعية المنشورة محسوبة على ${baseServings.toLocaleString("en-US")} حصص.`
            : `The published reference values are computed for ${baseServings} servings.`}
        </p>
      ) : null}
      {/* screen-reader fallback of the published per-serving block (a11y + SEO-safe noscript twin) */}
      <span className="sr-only">
        {isAr
          ? `القيم المنشورة لكل حصة: ${basePerServing.calories} سعرة، بروتين ${basePerServing.protein} جم، كربوهيدرات ${basePerServing.carbs} جم، دهون ${basePerServing.fat} جم، ألياف ${basePerServing.fiber} جم.`
          : `Published values per serving: ${basePerServing.calories} kcal, protein ${basePerServing.protein} g, carbs ${basePerServing.carbs} g, fat ${basePerServing.fat} g, fiber ${basePerServing.fiber} g.`}
      </span>
    </div>
  );
}

function NutritionRow({
  label,
  unit,
  per,
  total,
  isAr,
}: {
  label: string;
  unit: string;
  per: number;
  total: number;
  isAr: boolean;
}) {
  const fmt = (n: number) => (isAr ? n.toLocaleString("en-US") : n.toLocaleString("en-US"));
  const unitAr = unit === "g" ? "جم" : unit === "kcal" ? "سعرة" : unit;
  return (
    <tr>
      <td className="px-4 py-2.5 font-medium">{label}</td>
      <td className="px-4 py-2.5 text-right tabular-nums">
        {fmt(per)} {unitAr}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-[var(--muted-foreground)]">
        {fmt(total)} {unitAr}
      </td>
    </tr>
  );
}
