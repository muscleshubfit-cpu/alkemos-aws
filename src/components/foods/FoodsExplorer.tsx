import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageBanner } from "@/components/PageBanner";
import { SearchX } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { ServerPagination } from "@/components/ServerPagination";
import { MembershipPromo, ExploreMore } from "@/components/PageBottomPromo";
import { FoodsFilters } from "@/components/foods/FoodsFilters";
import { buildFoodsHref, type FoodsQuery } from "@/components/foods/url";
import { filterFoods } from "@/lib/foods";
import { FOOD_COLLECTIONS } from "@/lib/hub-collections";
// GROWTH-PLAN batch 11 (owner order «حسّن الروابط الداخلية»): the ranked
// nutrient lists join the library surface — the /foods hub previously
// linked the 10 collections but none of the 15 database-ranked lists,
// leaving the family reachable only from collection hubs and sitemaps.
import { NUTRIENT_LISTS } from "@/lib/food-nutrient-lists";
import {
  CATEGORY_LABELS,
  TAG_LABELS,
  POPULAR_TAGS,
  FOODS_COUNT,
  type FoodCategory,
} from "@/lib/foods-shared";

/**
 * SERVER-RENDERED foods explorer (performance audit 2026-09-05).
 *
 * Previously this whole page was a client component importing the
 * 8,162-food array — a ~3MB JS chunk hit every mobile visitor. Now:
 *   • the grid + filters render on the server from URL search params
 *   • the food array NEVER reaches the browser bundle
 *   • category pills / tag toggles / pagination are plain <Link>s
 *   • only the search + macro inputs are a small client island
 *
 * Rendering is dynamic (searchParams) but the filter is an in-memory
 * scan of a static array (~1-2ms) — negligible serverless cost, and
 * the client saves megabytes. SEO also improves: the grid HTML now
 * contains real food cards + links for crawlers.
 */

const PAGE_SIZE = 20;

const CATEGORIES: (FoodCategory | "all")[] = [
  "all",
  "protein",
  "carb",
  "fat",
  "vegetable",
  "fruit",
  "dairy",
  "nuts",
  "snack",
  "drink",
];

export function FoodsExplorer({
  lang,
  query,
}: {
  lang: "en" | "ar";
  query: FoodsQuery;
}) {
  const isAr = lang === "ar";
  const base = isAr ? "/ar/foods" : "/foods";

  const filtered = filterFoods({
    // parseFoodsQuery validates cat against the category set — cast is safe.
    category: query.cat as FoodCategory | "all",
    tags: query.tags,
    search: query.q,
    minProtein: query.minp ? Number(query.minp) : undefined,
    maxCarbs: query.maxc ? Number(query.maxc) : undefined,
    maxCalories: query.maxcal ? Number(query.maxcal) : undefined,
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const visibleFoods = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters =
    query.cat !== "all" ||
    query.q !== "" ||
    query.tags.length > 0 ||
    query.minp !== "" ||
    query.maxc !== "" ||
    query.maxcal !== "";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Owner artwork page banner (Phase 127 — 12 header images are PAGE banners) */}
        <PageBanner section="foods" className="mb-10" />

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "مكتبة الأطعمة" : "Food Library"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "ابحث عن الأطعمة، واستعرض السعرات والماكروز، واحسب الجرامات التي تحتاجها."
              : "Search foods, see calories and macros, and calculate the grams you need."}
          </p>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)] opacity-80">
            {FOODS_COUNT.toLocaleString("en-US")}{" "}
            {isAr ? "صنف غذائي" : "foods"}
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mt-10 space-y-4">
          <FoodsFilters lang={lang} query={query} base={base} />

          {/* Category pills — plain links, crawlable, zero-JS */}
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <FoodsCategoryPill
                key={cat}
                cat={cat}
                isActive={query.cat === cat}
                isAr={isAr}
                href={
                  query.cat === cat
                    ? buildFoodsHref(base, query, { cat: "all", page: 1 })
                    : buildFoodsHref(base, query, { cat, page: 1 })
                }
              />
            ))}
          </div>

          {/* Access-point fix (2026-09-14): /collections/* discoverability —
              the goal-based food collections join the library surface as
              crawlable server-rendered links (previously they had near-zero
              UI entry points). Locale-aware mirrors for AR visitors. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {isAr ? "مجموعات جاهزة:" : "Curated collections:"}
            </span>
            {FOOD_COLLECTIONS.map((c) => (
              <Link
                key={c.slug}
                href={`${isAr ? "/ar" : ""}/collections/${c.slug}`}
                className="rounded-full bg-[var(--tint)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] hover:text-[var(--text)]"
              >
                {isAr ? c.h1Ar : c.h1En}
              </Link>
            ))}
          </div>

          {/* GROWTH-PLAN batch 11: ranked lists discoverability — the 15
              database-ranked «الأطعمة الغنية بـ…» lists join the hub beside
              the collections (locale-aware mirrors). */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {isAr ? "قوائم مرتبة من قاعدة البيانات:" : "Ranked lists from the database:"}
            </span>
            {NUTRIENT_LISTS.map((l) => (
              <Link
                key={l.slug}
                href={`${isAr ? "/ar" : ""}/foods/lists/${l.slug}`}
                className="rounded-full bg-[var(--tint)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] hover:text-[var(--text)]"
              >
                {isAr ? l.h1Ar : l.h1En}
              </Link>
            ))}
          </div>

          {/* Tags — plain links; clicking a tag toggles it in the URL */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {isAr ? "تصفية:" : "Filter:"}
            </span>
            {POPULAR_TAGS.map((tag) => {
              const active = query.tags.includes(tag);
              const nextTags = active
                ? query.tags.filter((t) => t !== tag)
                : [...query.tags, tag];
              return (
                <Link
                  key={tag}
                  href={buildFoodsHref(base, query, { tags: nextTags, page: 1 })}
                  aria-pressed={active}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    active
                      ? "text-white"
                      : "bg-[var(--tint)] text-[var(--muted-foreground)] hover:text-[var(--text)]"
                  }`}
                  style={
                    active
                      ? { backgroundColor: TAG_LABELS[tag]?.color || "#1d1d1f" }
                      : {}
                  }
                >
                  {isAr ? TAG_LABELS[tag]?.ar : TAG_LABELS[tag]?.en}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Results count — anchor for scroll-back on page change */}
        <p id="results-top" className="mt-6 scroll-mt-24 text-sm font-normal text-[var(--muted-foreground)]">
          {filtered.length.toLocaleString("en-US")}{" "}
          {isAr ? "صنف غذائي" : "foods"}
        </p>

        {/* Foods grid — server-rendered */}
        {filtered.length === 0 ? (
          <div className="mt-10 marble-card p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--tint)] border border-[var(--edge)]">
              <SearchX className="h-8 w-8 text-[var(--muted-foreground)]" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {isAr ? "لم نجد نتائج" : "No results found"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
              {isAr ? "جرّب تغيير الفلاتر أو البحث بكلمة مختلفة" : "Try adjusting your filters or search term"}
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
              {visibleFoods.map((food) => (
                <a
                  key={food.slug}
                  href={`${base}/${food.slug}`}
                  className="card-hover group marble-card"
                >
                  {/* Content */}
                  <div className="p-3">
                    <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
                      {isAr ? CATEGORY_LABELS[food.category].ar : CATEGORY_LABELS[food.category].en}
                    </span>
                    <h3 className="mt-1 text-sm font-semibold tracking-tight">
                      {isAr ? food.nameAr : food.nameEn}
                    </h3>
                    {/* Macros per 100g — HOME-REFINE-286 (owner order):
                        all FOUR facts clearly labeled (Calories ·
                        Protein · Carbs · Fat) in the food detail
                        page's own color convention (kcal blue ·
                        protein green · carbs orange · fat red) — the
                        homepage's Food Library preview rides the SAME
                        format. Real database values, nothing invented. */}
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <div className="rounded bg-white px-1.5 py-1 text-center">
                        <p className="text-xs font-semibold leading-tight text-[#0071e3]">{food.per100g.calories}</p>
                        <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">{isAr ? "سعرة" : "kcal"}</p>
                      </div>
                      <div className="rounded bg-white px-1.5 py-1 text-center">
                        <p className="text-xs font-semibold leading-tight text-[#34c759]">{isAr ? `${food.per100g.protein} جم` : `${food.per100g.protein}g`}</p>
                        <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">{isAr ? "بروتين" : "Protein"}</p>
                      </div>
                      <div className="rounded bg-white px-1.5 py-1 text-center">
                        <p className="text-xs font-semibold leading-tight text-[#ff9500]">{isAr ? `${food.per100g.carbs} جم` : `${food.per100g.carbs}g`}</p>
                        <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">{isAr ? "كربوهيدرات" : "Carbs"}</p>
                      </div>
                      <div className="rounded bg-white px-1.5 py-1 text-center">
                        <p className="text-xs font-semibold leading-tight text-[#ff3b30]">{isAr ? `${food.per100g.fat} جم` : `${food.per100g.fat}g`}</p>
                        <p className="text-[9px] font-normal leading-tight text-[var(--muted-foreground)]">{isAr ? "دهون" : "Fat"}</p>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <ServerPagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              isAr={isAr}
              buildHref={(n) => buildFoodsHref(base, query, { page: n })}
              className="mt-10"
            />
          </>
        )}

        {/* Promotional sections */}
        <MembershipPromo isAr={isAr} />
        <ExploreMore isAr={isAr} exclude="foods" />

        {/* Phase 318 (P1-8): the hub cites its own reference — sources,
            per-100g convention, citation format. One line, both locales. */}
        <div className="mt-8 text-center text-sm">
          <Link
            href={isAr ? "/ar/foods/methodology" : "/foods/methodology"}
            className="text-[var(--muted-foreground)] underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            {isAr
              ? "منهجية قاعدة الأطعمة — المصادر والأعراف وكيفية الاستشهاد"
              : "Food database methodology — sources, conventions, and how to cite"}
          </Link>
        </div>
      </main>

        {/* Access-point fix (2026-09-14): shared marble footer — this
            public page now carries the same persistent link grid as the
            homepage (SiteFooter component). */}
        <SiteFooter />
    </div>
  );
}

// ─── Food category pill — link version of the old button ───
function FoodsCategoryPill({
  cat,
  isActive,
  isAr,
  href,
}: {
  cat: FoodCategory | "all";
  isActive: boolean;
  isAr: boolean;
  href: string;
}) {
  const isAll = cat === "all";
  const label = isAll ? (isAr ? "الكل" : "All") : (isAr ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].en);
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? "true" : undefined}
      className={`group flex w-20 flex-col items-center gap-2 rounded-2xl p-2 transition-all ${
        isActive
          ? "bg-[var(--text)] text-[var(--bg)] ring-2 ring-[var(--chrome-edge)] ring-offset-2"
          : "bg-[var(--tint)] text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--text)] hover:ring-1 hover:ring-[var(--edge)]"
      }`}
    >
      {isAll ? (
        <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--text)] text-[var(--bg)] text-sm font-bold">
          {isAr ? "الكل" : "All"}
        </span>
      ) : (
        <span className="relative block h-16 w-16">
          <ImageWithFallback
            src={CATEGORY_LABELS[cat].image}
            alt={label}
            fill
            className="rounded-xl object-cover ring-1 ring-black/5"
            fallbackElement={
              <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--tint)] text-2xl">
                {CATEGORY_LABELS[cat].emoji}
              </span>
            }
          />
        </span>
      )}
      <span className="text-center text-[11px] font-medium leading-tight">
        {label}
      </span>
    </Link>
  );
}
