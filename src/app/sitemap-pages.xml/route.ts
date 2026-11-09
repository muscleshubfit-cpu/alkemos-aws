import { buildUrlSet, xmlResponse, siteUrl, type SitemapUrl } from "@/lib/sitemap-xml";
import { familyLastmod } from "@/lib/sitemap-lastmod";
import { WORKOUT_PROGRAMS } from "@/lib/workout-programs";
import { DIET_LEVELS, DIET_SYSTEMS } from "@/lib/diet-plan-matrix";
import {
  RECIPE_CUISINES,
  RECIPE_DIETS,
  RECIPE_GOALS,
  RECIPE_MEAL_TYPES,
} from "@/lib/recipes-shared";
import { BLOG_CATEGORY_CONTENT } from "@/lib/blog-category-content";

/**
 * GET /sitemap-pages.xml — static pages, tools, and programs.
 * The high-priority, traffic-earning URLs (~60) — kept tiny and
 * crawl-cheap so they are never drowned by the long tail.
 */

export const revalidate = 3600;

export async function GET() {
  const base = siteUrl();

  const urls: SitemapUrl[] = [
    // Homepage pair — highest priority
    { loc: base, changefreq: "weekly", priority: 1.0, alternates: { en: base, ar: `${base}/ar` } },
    { loc: `${base}/ar`, changefreq: "weekly", priority: 1.0, alternates: { en: base, ar: `${base}/ar` } },
    // Main platform sections
    { loc: `${base}/exercises`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/exercises`, ar: `${base}/ar/exercises` } },
    { loc: `${base}/ar/exercises`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/exercises`, ar: `${base}/ar/exercises` } },
    { loc: `${base}/foods`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/foods`, ar: `${base}/ar/foods` } },
    { loc: `${base}/ar/foods`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/foods`, ar: `${base}/ar/foods` } },
    // HEALTHY-RECIPES-PLATFORM (2026-11-10, plan §10-3): the recipes
    // STATIC surfaces (listing + methodology + the 30 taxonomy hubs)
    // ride the pages child — detail pairs ride sitemap-recipes.xml.
    { loc: `${base}/recipes`, changefreq: "daily", priority: 0.9, alternates: { en: `${base}/recipes`, ar: `${base}/ar/recipes` } },
    { loc: `${base}/ar/recipes`, changefreq: "daily", priority: 0.9, alternates: { en: `${base}/recipes`, ar: `${base}/ar/recipes` } },
    { loc: `${base}/recipes/methodology`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/recipes/methodology`, ar: `${base}/ar/recipes/methodology` } },
    { loc: `${base}/ar/recipes/methodology`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/recipes/methodology`, ar: `${base}/ar/recipes/methodology` } },
    ...(
      [
        ...RECIPE_CUISINES.map((c) => `cuisine/${c}`),
        ...RECIPE_DIETS.map((d) => `diet/${d}`),
        ...RECIPE_GOALS.map((g) => `goal/${g}`),
        ...RECIPE_MEAL_TYPES.map((m) => `meal/${m}`),
      ] as const
    ).flatMap((tail): SitemapUrl[] => [
      { loc: `${base}/recipes/${tail}`, changefreq: "weekly", priority: 0.6, alternates: { en: `${base}/recipes/${tail}`, ar: `${base}/ar/recipes/${tail}` } },
      { loc: `${base}/ar/recipes/${tail}`, changefreq: "weekly", priority: 0.6, alternates: { en: `${base}/recipes/${tail}`, ar: `${base}/ar/recipes/${tail}` } },
    ]),
    { loc: `${base}/programs`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/programs`, ar: `${base}/ar/programs` } },
    { loc: `${base}/ar/programs`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/programs`, ar: `${base}/ar/programs` } },
    // (/tools moved to the tool detail block below — now with its AR mirror pair)
    { loc: `${base}/evo`, changefreq: "monthly", priority: 0.9, alternates: { en: `${base}/evo`, ar: `${base}/ar/evo` } },
    { loc: `${base}/ar/evo`, changefreq: "monthly", priority: 0.9, alternates: { en: `${base}/evo`, ar: `${base}/ar/evo` } },
    { loc: `${base}/blog`, changefreq: "weekly", priority: 0.8, alternates: { en: `${base}/blog`, ar: `${base}/ar/blog` } },
    { loc: `${base}/ar/blog`, changefreq: "weekly", priority: 0.8, alternates: { en: `${base}/blog`, ar: `${base}/ar/blog` } },
    // P2-11 (§12.36): crawlable blog-category pages — 10 ids × 2 langs.
    ...Object.keys(BLOG_CATEGORY_CONTENT).flatMap((cat): SitemapUrl[] => [
      {
        loc: `${base}/blog/category/${cat}`,
        changefreq: "weekly",
        priority: 0.6,
        alternates: { en: `${base}/blog/category/${cat}`, ar: `${base}/ar/blog/category/${cat}` },
      },
      {
        loc: `${base}/ar/blog/category/${cat}`,
        changefreq: "weekly",
        priority: 0.6,
        alternates: { en: `${base}/blog/category/${cat}`, ar: `${base}/ar/blog/category/${cat}` },
      },
    ]),
    { loc: `${base}/coaching`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/coaching`, ar: `${base}/ar/coaching` } },
    { loc: `${base}/ar/coaching`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/coaching`, ar: `${base}/ar/coaching` } },
    // §12.53 item 11 (2026-09-16): /affiliate is now bilingual — the AR
    // mirror exists at /ar/affiliate (was the last monolingual page).
    { loc: `${base}/affiliate`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/affiliate`, ar: `${base}/ar/affiliate` } },
    { loc: `${base}/ar/affiliate`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/affiliate`, ar: `${base}/ar/affiliate` } },
    { loc: `${base}/memberships`, changefreq: "monthly", priority: 0.9, alternates: { en: `${base}/memberships`, ar: `${base}/ar/memberships` } },
    { loc: `${base}/ar/memberships`, changefreq: "monthly", priority: 0.9, alternates: { en: `${base}/memberships`, ar: `${base}/ar/memberships` } },
    // Coach recruitment funnel
    { loc: `${base}/for-coaches`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/for-coaches`, ar: `${base}/ar/for-coaches` } },
    { loc: `${base}/ar/for-coaches`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/for-coaches`, ar: `${base}/ar/for-coaches` } },
    { loc: `${base}/for-coaches/register`, changefreq: "monthly", priority: 0.75, alternates: { en: `${base}/for-coaches/register`, ar: `${base}/ar/for-coaches/register` } },
    { loc: `${base}/ar/for-coaches/register`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/for-coaches/register`, ar: `${base}/ar/for-coaches/register` } },
    // Tool detail pages (+ AR mirrors — SEO-GEO-4, 2026-09-08)
    { loc: `${base}/tools`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools`, ar: `${base}/ar/tools` } },
    { loc: `${base}/ar/tools`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools`, ar: `${base}/ar/tools` } },
    { loc: `${base}/tools/calorie-calculator`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/calorie-calculator`, ar: `${base}/ar/tools/calorie-calculator` } },
    { loc: `${base}/ar/tools/calorie-calculator`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/calorie-calculator`, ar: `${base}/ar/tools/calorie-calculator` } },
    { loc: `${base}/tools/bmi-calculator`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/bmi-calculator`, ar: `${base}/ar/tools/bmi-calculator` } },
    { loc: `${base}/ar/tools/bmi-calculator`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/bmi-calculator`, ar: `${base}/ar/tools/bmi-calculator` } },
    { loc: `${base}/tools/macro-calculator`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/macro-calculator`, ar: `${base}/ar/tools/macro-calculator` } },
    { loc: `${base}/ar/tools/macro-calculator`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/macro-calculator`, ar: `${base}/ar/tools/macro-calculator` } },
    { loc: `${base}/tools/body-fat-calculator`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/body-fat-calculator`, ar: `${base}/ar/tools/body-fat-calculator` } },
    { loc: `${base}/ar/tools/body-fat-calculator`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/body-fat-calculator`, ar: `${base}/ar/tools/body-fat-calculator` } },
    { loc: `${base}/tools/water-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/water-tracker`, ar: `${base}/ar/tools/water-tracker` } },
    { loc: `${base}/ar/tools/water-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/tools/water-tracker`, ar: `${base}/ar/tools/water-tracker` } },
    { loc: `${base}/meal-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/meal-planner`, ar: `${base}/ar/meal-planner` } },
    { loc: `${base}/ar/meal-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/meal-planner`, ar: `${base}/ar/meal-planner` } },
    // §12.28: the AI meal-planner trial pair (free generation, no signup).
    { loc: `${base}/ai-meal-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/ai-meal-planner`, ar: `${base}/ar/ai-meal-planner` } },
    { loc: `${base}/ar/ai-meal-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/ai-meal-planner`, ar: `${base}/ar/ai-meal-planner` } },
    // §12.32: the AI workout-planner trial pair (free generation, no signup).
    { loc: `${base}/ai-workout-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/ai-workout-planner`, ar: `${base}/ar/ai-workout-planner` } },
    { loc: `${base}/ar/ai-workout-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/ai-workout-planner`, ar: `${base}/ar/ai-workout-planner` } },
    // P0 SEO audit (2026-09-30, finding #1): the two search-intent landing
    // pairs — "workout tracker" and "macro tracker" queries had ZERO
    // matching pages while the tracking features live behind login. The
    // landing pages route that intent to the real product surface
    // (AI planners, programs, meal planner, ProgressView tracking).
    { loc: `${base}/workout-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/workout-tracker`, ar: `${base}/ar/workout-tracker` } },
    { loc: `${base}/ar/workout-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/workout-tracker`, ar: `${base}/ar/workout-tracker` } },
    { loc: `${base}/macro-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/macro-tracker`, ar: `${base}/ar/macro-tracker` } },
    { loc: `${base}/ar/macro-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/macro-tracker`, ar: `${base}/ar/macro-tracker` } },
    // Phase 318 (P1-8 — SEO audit item 8, owner order 2026-10-01): the
    // macro-accuracy content chain's two new pairs — the pillar guide
    // («سلسلة محتوى دقة تتبع الماكروز») and the food-database methodology
    // reference («سلعنة قاعدة الأطعمة كمرجع موثق يستحق الروابط»).
    { loc: `${base}/guides/macro-tracking-accuracy`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/guides/macro-tracking-accuracy`, ar: `${base}/ar/guides/macro-tracking-accuracy` } },
    { loc: `${base}/ar/guides/macro-tracking-accuracy`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/guides/macro-tracking-accuracy`, ar: `${base}/ar/guides/macro-tracking-accuracy` } },
    { loc: `${base}/foods/methodology`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/foods/methodology`, ar: `${base}/ar/foods/methodology` } },
    { loc: `${base}/ar/foods/methodology`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/foods/methodology`, ar: `${base}/ar/foods/methodology` } },
    // Comparison index pages — SEO-GEO-4 (2026-09-08): the detail pages
    // live in sitemap-comparisons.xml; the index lives here.
    { loc: `${base}/compare`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/compare`, ar: `${base}/ar/compare` } },
    { loc: `${base}/ar/compare`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/compare`, ar: `${base}/ar/compare` } },
    // About / FAQ pairs
    { loc: `${base}/about`, changefreq: "monthly", priority: 0.6, alternates: { en: `${base}/about`, ar: `${base}/ar/about` } },
    { loc: `${base}/ar/about`, changefreq: "monthly", priority: 0.6, alternates: { en: `${base}/about`, ar: `${base}/ar/about` } },
    // Phase SEO-GEO-2 (2026-09-08): author profile pages — the @id URLs
    // referenced by every Article.author Person + Organization.founder.
    // SEO/GEO audit (2026-09-28): /authors index pair added — the real
    // target of the profile pages' "Authors" breadcrumb (was a 404).
    { loc: `${base}/authors`, changefreq: "monthly", priority: 0.6, alternates: { en: `${base}/authors`, ar: `${base}/ar/authors` } },
    { loc: `${base}/ar/authors`, changefreq: "monthly", priority: 0.6, alternates: { en: `${base}/authors`, ar: `${base}/ar/authors` } },
    { loc: `${base}/authors/ahmed-zake`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/authors/ahmed-zake`, ar: `${base}/ar/authors/ahmed-zake` } },
    { loc: `${base}/ar/authors/ahmed-zake`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/authors/ahmed-zake`, ar: `${base}/ar/authors/ahmed-zake` } },
    { loc: `${base}/faq`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/faq`, ar: `${base}/ar/faq` } },
    { loc: `${base}/ar/faq`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/faq`, ar: `${base}/ar/faq` } },
    { loc: `${base}/contact`, changefreq: "yearly", priority: 0.5, alternates: { en: `${base}/contact`, ar: `${base}/ar/contact` } },
    { loc: `${base}/ar/contact`, changefreq: "yearly", priority: 0.5, alternates: { en: `${base}/contact`, ar: `${base}/ar/contact` } },
    { loc: `${base}/privacy`, changefreq: "yearly", priority: 0.3, alternates: { en: `${base}/privacy`, ar: `${base}/ar/privacy` } },
    { loc: `${base}/ar/privacy`, changefreq: "yearly", priority: 0.3, alternates: { en: `${base}/privacy`, ar: `${base}/ar/privacy` } },
    { loc: `${base}/terms`, changefreq: "yearly", priority: 0.3, alternates: { en: `${base}/terms`, ar: `${base}/ar/terms` } },
    { loc: `${base}/ar/terms`, changefreq: "yearly", priority: 0.3, alternates: { en: `${base}/terms`, ar: `${base}/ar/terms` } },
  ];

  // Program detail pages (+ AR mirrors) — small curated set
  for (const prog of WORKOUT_PROGRAMS) {
    urls.push({
      loc: `${base}/programs/${prog.slug}`,
      changefreq: "monthly",
      priority: 0.6,
      alternates: {
        en: `${base}/programs/${prog.slug}`,
        ar: `${base}/ar/programs/${prog.slug}`,
      },
    });
    urls.push({
      loc: `${base}/ar/programs/${prog.slug}`,
      changefreq: "monthly",
      priority: 0.6,
      alternates: {
        en: `${base}/programs/${prog.slug}`,
        ar: `${base}/ar/programs/${prog.slug}`,
      },
    });
  }

  // Phase SEO-GEO-6.6 (§12.19 P1-8) + §12.27 (owner directive «بند ٨ تم
  // تنفيذ عربى فقط مطلوب انجليزى»): the diet-plan matrix is now BILINGUAL —
  // EN hub + 24 EN cells mirror the AR surface, each entry declaring the
  // full en/ar alternates pair.
  urls.push({
    loc: `${base}/diet-plan`,
    changefreq: "monthly",
    priority: 0.8,
    alternates: { en: `${base}/diet-plan`, ar: `${base}/ar/diet-plan` },
  });
  urls.push({
    loc: `${base}/ar/diet-plan`,
    changefreq: "monthly",
    priority: 0.8,
    alternates: { en: `${base}/diet-plan`, ar: `${base}/ar/diet-plan` },
  });
  for (const level of DIET_LEVELS) {
    for (const system of DIET_SYSTEMS) {
      urls.push({
        loc: `${base}/diet-plan/${level}/${system.slug}`,
        changefreq: "monthly",
        priority: 0.7,
        alternates: {
          en: `${base}/diet-plan/${level}/${system.slug}`,
          ar: `${base}/ar/diet-plan/${level}/${system.slug}`,
        },
      });
      urls.push({
        loc: `${base}/ar/diet-plan/${level}/${system.slug}`,
        changefreq: "monthly",
        priority: 0.7,
        alternates: {
          en: `${base}/diet-plan/${level}/${system.slug}`,
          ar: `${base}/ar/diet-plan/${level}/${system.slug}`,
        },
      });
    }
  }

  // Phase 155 (#14): truthful per-family lastmod (see sitemap-lastmod.ts).
  return xmlResponse(
    buildUrlSet(urls.map((u) => ({ ...u, lastModified: familyLastmod("pages") }))),
  );
}
