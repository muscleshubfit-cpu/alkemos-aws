import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchX, UtensilsCrossed } from "lucide-react";
import { ServerPagination } from "@/components/ServerPagination";
import { MembershipPromo, ExploreMore } from "@/components/PageBottomPromo";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import {
  buildRecipesHref,
  RECIPES_CAL_CHOICES,
  RECIPES_PROTEIN_CHOICES,
  RECIPES_TIME_CHOICES,
  type RecipesQuery,
} from "@/components/recipes/url";
import { listRecipeSummaries } from "@/lib/recipes-server";
import {
  CUISINE_LABELS,
  DIET_LABELS,
  GOAL_LABELS,
  MEAL_TYPE_LABELS,
  RECIPE_CUISINES,
  RECIPE_DIETS,
  RECIPE_GOALS,
  RECIPE_MEAL_TYPES,
  RECIPES_FILTER_LIMITS,
} from "@/lib/recipes-shared";

/**
 * RECIPES-EXPLORER — the server-rendered recipes list
 * (HEALTHY-RECIPES-PLATFORM plan §9.1 — the FoodsExplorer pattern:
 * URL-state filters, zero-JS pagination, crawlable pills).
 *
 * An ASYNC server component: the published pairs come from the
 * ISR-cached Supabase query (recipes-server.listRecipeSummaries) —
 * the corpus is one pair/day so the in-memory filter is exact and
 * cheap. The empty state is honest: until the first publish the page
 * says so in plain words (never fake placeholder cards).
 */
export async function RecipesExplorer({
  lang,
  query,
}: {
  lang: "en" | "ar";
  query: RecipesQuery;
}) {
  const isAr = lang === "ar";
  const base = isAr ? "/ar/recipes" : "/recipes";

  const { items, total, page, pages } = await listRecipeSummaries(
    lang,
    {
      cuisine: query.cuisine === "all" ? undefined : query.cuisine,
      diet: query.diet === "all" ? undefined : query.diet,
      goal: query.goal === "all" ? undefined : query.goal,
      meal: query.meal === "all" ? undefined : query.meal,
      maxTime: query.maxTime ? Number(query.maxTime) : undefined,
      maxCalories: query.maxCalories ? Number(query.maxCalories) : undefined,
      minProtein: query.minProtein ? Number(query.minProtein) : undefined,
    },
    query.page,
  );

  const hasFilters =
    query.cuisine !== "all" ||
    query.diet !== "all" ||
    query.goal !== "all" ||
    query.meal !== "all" ||
    query.maxTime !== "" ||
    query.maxCalories !== "" ||
    query.minProtein !== "";

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "bg-[var(--text)] text-[var(--bg)]"
        : "bg-[var(--tint)] text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--text)]"
    }`;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "الوصفات الصحية" : "Healthy Recipes"}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "وصفات ثنائية اللغة بقيم غذائية محسوبة برمجيًا من مرجع موثق — بالجرام، لكل حصة، وبما يخدم هدفك."
              : "Bilingual recipes with programmatically computed nutrition from a verified reference — in grams, per serving, matched to your goal."}
          </p>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)] opacity-80">
            {total.toLocaleString(isAr ? "ar-EG" : "en-US")}{" "}
            {isAr ? "وصفة منشورة" : "published recipes"}
          </p>
        </div>

        {/* Taxonomy axes — crawlable pill links to hub pages */}
        <div className="mt-10 space-y-4">
          <FilterRow
            label={isAr ? "المطبخ:" : "Cuisine:"}
            values={RECIPE_CUISINES.map((c) => ({
              key: c,
              label: isAr ? CUISINE_LABELS[c].ar : CUISINE_LABELS[c].en,
              href: `${base}/cuisine/${c}`,
            }))}
          />
          <FilterRow
            label={isAr ? "النظام الغذائي:" : "Diet:"}
            values={RECIPE_DIETS.map((d) => ({
              key: d,
              label: isAr ? DIET_LABELS[d].ar : DIET_LABELS[d].en,
              href: `${base}/diet/${d}`,
            }))}
          />
          <FilterRow
            label={isAr ? "الهدف:" : "Goal:"}
            values={RECIPE_GOALS.map((g) => ({
              key: g,
              label: isAr ? GOAL_LABELS[g].ar : GOAL_LABELS[g].en,
              href: `${base}/goal/${g}`,
            }))}
          />
          <FilterRow
            label={isAr ? "الوجبة:" : "Meal:"}
            values={RECIPE_MEAL_TYPES.map((m) => ({
              key: m,
              label: isAr ? MEAL_TYPE_LABELS[m].ar : MEAL_TYPE_LABELS[m].en,
              href: `${base}/meal/${m}`,
            }))}
          />

          {/* Numeric URL filters (owner-required §9-هـ) */}
          <NumericFilterRow
            label={isAr ? "أقصى وقت (دقيقة):" : "Max time (min):"}
            choices={RECIPES_TIME_CHOICES}
            activeValue={query.maxTime}
            buildHref={(v) => buildRecipesHref(base, query, { maxTime: v, page: 1 })}
            isAr={isAr}
            pillClass={pill}
          />
          <NumericFilterRow
            label={isAr ? "أقصى سعرات/حصة:" : "Max kcal/serving:"}
            choices={RECIPES_CAL_CHOICES}
            activeValue={query.maxCalories}
            buildHref={(v) => buildRecipesHref(base, query, { maxCalories: v, page: 1 })}
            isAr={isAr}
            pillClass={pill}
          />
          <NumericFilterRow
            label={isAr ? "أدنى بروتين/حصة (جم):" : "Min protein/serving (g):"}
            choices={RECIPES_PROTEIN_CHOICES}
            activeValue={query.minProtein}
            buildHref={(v) => buildRecipesHref(base, query, { minProtein: v, page: 1 })}
            isAr={isAr}
            pillClass={pill}
          />
        </div>

        {/* Results count */}
        <p id="results-top" className="mt-6 scroll-mt-24 text-sm font-normal text-[var(--muted-foreground)]">
          {total.toLocaleString(isAr ? "ar-EG" : "en-US")}{" "}
          {isAr ? "وصفة" : "recipes"}
        </p>

        {/* Grid */}
        {total === 0 ? (
          <div className="mt-10 marble-card p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--tint)] border border-[var(--edge)]">
              {hasFilters ? (
                <SearchX className="h-8 w-8 text-[var(--muted-foreground)]" aria-hidden="true" />
              ) : (
                <UtensilsCrossed className="h-8 w-8 text-[var(--muted-foreground)]" aria-hidden="true" />
              )}
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {hasFilters
                ? isAr
                  ? "لم نجد نتائج"
                  : "No results found"
                : isAr
                  ? "لم تُنشر وصفات بعد"
                  : "No recipes published yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
              {hasFilters
                ? isAr
                  ? "جرّب تغيير الفلاتر أو إزالتها"
                  : "Try adjusting or removing the filters"
                : isAr
                  ? "ينشر خط الإنتاج اليومي زوج وصفات جديدًا (عربي + إنجليزي) بعد اجتياز بوابات التحقق الغذائي والتحريري كاملة."
                  : "The daily pipeline publishes one new recipe pair (Arabic + English) after passing the full nutrition and editorial verification gates."}
            </p>
            {hasFilters && (
              <Link
                href={base}
                className="mt-6 inline-block rounded-full bg-[#1d1d1f] px-6 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90"
              >
                {isAr ? "إعادة ضبط الفلاتر" : "Reset filters"}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} lang={lang} priority={i < 4} />
              ))}
            </div>
            <ServerPagination
              page={page}
              pageSize={RECIPES_FILTER_LIMITS.pageSize}
              total={total}
              isAr={isAr}
              buildHref={(n) => buildRecipesHref(base, query, { page: n })}
              className="mt-10"
            />
          </>
        )}

        {/* Promotional sections */}
        <MembershipPromo isAr={isAr} />
        <ExploreMore isAr={isAr} exclude="recipes" />

        {/* Methodology citation (the foods hub precedent) */}
        <div className="mt-8 text-center text-sm">
          <Link
            href={isAr ? "/ar/recipes/methodology" : "/recipes/methodology"}
            className="text-[var(--muted-foreground)] underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            {isAr
              ? "منهجية الوصفات — المصادر والحسابات وحقوق الصور"
              : "Recipes methodology — sources, computation, and image licenses"}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ─── a row of crawlable pill links (taxonomy axis / hub pages) ─── */
function FilterRow({
  label,
  values,
}: {
  label: string;
  values: Array<{ key: string; label: string; href: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      {values.map((v) => (
        <Link
          key={v.key}
          href={v.href}
          className="rounded-full bg-[var(--tint)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] hover:text-[var(--text)]"
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}

/* ─── a numeric URL-filter row (toggle pills, plain links) ─── */
function NumericFilterRow({
  label,
  choices,
  activeValue,
  buildHref,
  isAr,
  pillClass,
}: {
  label: string;
  choices: readonly number[];
  activeValue: string;
  buildHref: (v: string) => string;
  isAr: boolean;
  pillClass: (active: boolean) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      {choices.map((c) => {
        const v = String(c);
        const active = activeValue === v;
        return (
          <Link
            key={v}
            href={active ? buildHref("") : buildHref(v)}
            aria-pressed={active}
            className={pillClass(active)}
          >
            {isAr ? c.toLocaleString("ar-EG") : v}
          </Link>
        );
      })}
    </div>
  );
}
