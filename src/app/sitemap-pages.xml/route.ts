import { buildUrlSet, xmlResponse, siteUrl, type SitemapUrl } from "@/lib/sitemap-xml";
import { familyLastmod } from "@/lib/sitemap-lastmod";
import {
  RECIPE_CUISINES,
  RECIPE_DIETS,
  RECIPE_GOALS,
  RECIPE_MEAL_TYPES,
} from "@/lib/recipes-shared";
import { BLOG_CATEGORY_CONTENT } from "@/lib/blog-category-content";

/**
 * GET /sitemap-pages.xml — informational static surface.
 *
 * SEO-RECOVERY SPLIT (2026-11-11, owner execution order): the COMMERCIAL
 * surface (paid services · tools · planners/trackers · programs · the
 * diet-plan matrix · the compare index — 100 paths, audit 13 §3) moved
 * to its own child /sitemap-commercial.xml so GSC's per-sitemap report
 * tracks the revenue surface's recovery as one readable number (the
 * governing recovery dashboard, report 11 §11). This child keeps the
 * informational surface: homepage · library hubs · recipes taxonomy ·
 * blog hubs + categories · guides · methodology · affiliate · about ·
 * authors · faq · contact · legal.
 *
 * The split is an exact partition of the previous 212-URL set — same
 * URLs, same priorities, same hreflang alternates, same truthful
 * lastmod anchor law. Nothing was added, removed, or re-prioritized.
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
    // §12.53 item 11 (2026-09-16): /affiliate is now bilingual — the AR
    // mirror exists at /ar/affiliate (was the last monolingual page).
    { loc: `${base}/affiliate`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/affiliate`, ar: `${base}/ar/affiliate` } },
    { loc: `${base}/ar/affiliate`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/affiliate`, ar: `${base}/ar/affiliate` } },
    // Phase 318 (P1-8 — SEO audit item 8, owner order 2026-10-01): the
    // macro-accuracy content chain's two new pairs — the pillar guide
    // («سلسلة محتوى دقة تتبع الماكروز») and the food-database methodology
    // reference («سلعنة قاعدة الأطعمة كمرجع موثق يستحق الروابط»).
    { loc: `${base}/guides/macro-tracking-accuracy`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/guides/macro-tracking-accuracy`, ar: `${base}/ar/guides/macro-tracking-accuracy` } },
    { loc: `${base}/ar/guides/macro-tracking-accuracy`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/guides/macro-tracking-accuracy`, ar: `${base}/ar/guides/macro-tracking-accuracy` } },
    { loc: `${base}/foods/methodology`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/foods/methodology`, ar: `${base}/ar/foods/methodology` } },
    { loc: `${base}/ar/foods/methodology`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/foods/methodology`, ar: `${base}/ar/foods/methodology` } },
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

  // Phase 155 (#14): truthful per-family lastmod (see sitemap-lastmod.ts).
  return xmlResponse(
    buildUrlSet(urls.map((u) => ({ ...u, lastModified: familyLastmod("pages") }))),
  );
}
