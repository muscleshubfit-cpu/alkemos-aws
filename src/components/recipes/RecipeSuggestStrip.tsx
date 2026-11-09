"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";

/**
 * RECIPE-SUGGEST-STRIP — the light tools-integration island
 * (HEALTHY-RECIPES-PLATFORM plan §9.4).
 *
 * A slim card row of up to 3 published recipes that fit the caller's
 * context (a meal-share calorie budget, or the plan's goal/macros).
 * HONEST-EMPTY: renders NOTHING until real published recipes match —
 * before the pipeline's first publish the tools look exactly as they
 * did (zero regression — plan §12.2's «لا أثر سلبي على الأدوات»).
 *
 * Props are read AFTER the tool's result exists: mount it inside the
 * results block with the computed numbers; it fetches lazily.
 */

type SuggestedRecipe = {
  title: string;
  slug: string;
  excerpt: string;
  href: string;
  calories: number;
  protein: number;
  minutes: number;
};

export function RecipeSuggestStrip({
  lang,
  goal,
  maxCalories,
  minProtein,
  title,
}: {
  lang: "en" | "ar";
  goal?: "weight-loss" | "muscle-gain" | "weight-gain" | "maintenance" | "sports-nutrition" | "high-protein";
  /** Per-serving ceiling the caller derived (e.g. a meal share of the daily target). */
  maxCalories?: number;
  minProtein?: number;
  /** Optional heading override; defaults to the standard line. */
  title?: string;
}) {
  const isAr = lang === "ar";
  const [items, setItems] = useState<SuggestedRecipe[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ lang, limit: "3" });
    if (goal) params.set("goal", goal);
    if (maxCalories) params.set("maxcal", String(Math.round(maxCalories)));
    if (minProtein) params.set("minprotein", String(Math.round(minProtein)));
    let alive = true;
    fetch(`/api/recipes/suggest?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: SuggestedRecipe[] }) => {
        if (alive && Array.isArray(data.items)) setItems(data.items);
      })
      .catch(() => {
        /* offline-ish: the strip stays hidden */
      });
    return () => {
      alive = false;
    };
  }, [lang, goal, maxCalories, minProtein]);

  if (items.length === 0) return null;

  const heading =
    title ??
    (isAr ? "وصفات جاهزة تناسب هدفك" : "Ready recipes that fit your goal");

  return (
    <section className="rounded-2xl bg-[var(--tint)] p-4 print:hidden" aria-label={heading}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <UtensilsCrossed className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
        {heading}
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {items.map((r) => (
          <a
            key={r.slug}
            href={r.href}
            className="group rounded-xl bg-[var(--card)] p-3 text-start transition-opacity hover:opacity-85"
          >
            <p className="line-clamp-2 text-sm font-medium leading-snug">{r.title}</p>
            <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
              {isAr
                ? `${r.calories.toLocaleString("ar-EG")} سعرة/حصة · بروتين ${r.protein.toLocaleString("ar-EG")} جم · ${r.minutes.toLocaleString("ar-EG")} دقيقة`
                : `${r.calories} kcal/serving · protein ${r.protein}g · ${r.minutes} min`}
            </p>
            <p className="mt-1.5 text-xs font-medium text-[var(--muted-foreground)] group-hover:text-[var(--text)]">
              {isAr ? "اعرض الوصفة ›" : "View recipe ›"}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
