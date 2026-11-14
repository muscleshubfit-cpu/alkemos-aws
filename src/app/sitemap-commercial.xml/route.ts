import { buildUrlSet, xmlResponse, siteUrl, type SitemapUrl } from "@/lib/sitemap-xml";
import { familyLastmod } from "@/lib/sitemap-lastmod";
import { WORKOUT_PROGRAMS } from "@/lib/workout-programs";
import { DIET_LEVELS, DIET_SYSTEMS } from "@/lib/diet-plan-matrix";

/**
 * GET /sitemap-commercial.xml — the COMMERCIAL surface, split out of
 * sitemap-pages.xml (SEO-RECOVERY 2026-11-11, owner execution order).
 *
 * WHY THIS SPLIT (evidence, audit 13 §3 + report 11 §11):
 *   The G-1 investigation measured the commercial surface (100 paths:
 *   paid services ×10 · tools ×12 · planners/trackers ×10 · programs ×16
 *   · diet-plan matrix ×50 · comparisons ×2) at 75 confirmed CNI · 25
 *   unverified · 0 confirmed indexed — mixed into one 212-URL child
 *   with informational pages, so GSC's per-sitemap report cannot show
 *   the commercial surface's recovery separately. Google Search Console
 *   reports Discovered/Indexed counts PER SITEMAP CHILD: this child
 *   makes the recovery dashboard (report 11 §11 — the governing
 *   measurement for any fix) a single readable number for the revenue
 *   surface, instead of 100 manual URL inspections.
 *
 * WHAT DID NOT CHANGE (the no-risk guarantees):
 *   - Same URLs, same priorities, same hreflang alternates, same
 *     truthful lastmod anchor law — only the container changed.
 *   - Zero URLs added or removed from the site's sitemap union; the
 *     split is an exact partition (verified: pages ∪ commercial =
 *     the previous pages set, intersection empty).
 *   - robots.txt lists both children; the sitemap index carries both.
 *
 * MOVED HERE from sitemap-pages.xml (test contracts follow the move):
 *   diet-plan-matrix.test.ts · ai-meal-planner.test.ts ·
 *   ai-workout-planner.test.ts · ar-mirrors.test.ts (evo/coaching).
 */

export const revalidate = 3600;

export async function GET() {
  const base = siteUrl();

  const urls: SitemapUrl[] = [
    // ---- Paid services (revenue surface — audit 13 §8 P0) -----------
    { loc: `${base}/coaching`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/coaching`, ar: `${base}/ar/coaching` } },
    { loc: `${base}/ar/coaching`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/coaching`, ar: `${base}/ar/coaching` } },
    { loc: `${base}/memberships`, changefreq: "monthly", priority: 0.9, alternates: { en: `${base}/memberships`, ar: `${base}/ar/memberships` } },
    { loc: `${base}/ar/memberships`, changefreq: "monthly", priority: 0.9, alternates: { en: `${base}/memberships`, ar: `${base}/ar/memberships` } },
    { loc: `${base}/evo`, changefreq: "monthly", priority: 0.9, alternates: { en: `${base}/evo`, ar: `${base}/ar/evo` } },
    { loc: `${base}/ar/evo`, changefreq: "monthly", priority: 0.9, alternates: { en: `${base}/evo`, ar: `${base}/ar/evo` } },
    // Coach recruitment funnel
    { loc: `${base}/for-coaches`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/for-coaches`, ar: `${base}/ar/for-coaches` } },
    { loc: `${base}/ar/for-coaches`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/for-coaches`, ar: `${base}/ar/for-coaches` } },
    { loc: `${base}/for-coaches/register`, changefreq: "monthly", priority: 0.75, alternates: { en: `${base}/for-coaches/register`, ar: `${base}/ar/for-coaches/register` } },
    { loc: `${base}/ar/for-coaches/register`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/for-coaches/register`, ar: `${base}/ar/for-coaches/register` } },
    // ---- Tools (+ AR mirrors — SEO-GEO-4, 2026-09-08) ---------------
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
    // ---- Planners & trackers (trial gateways + search-intent landings)
    { loc: `${base}/meal-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/meal-planner`, ar: `${base}/ar/meal-planner` } },
    { loc: `${base}/ar/meal-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/meal-planner`, ar: `${base}/ar/meal-planner` } },
    // §12.28: the AI meal-planner pair (generation for subscribers, Premium and above).
    { loc: `${base}/ai-meal-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/ai-meal-planner`, ar: `${base}/ar/ai-meal-planner` } },
    { loc: `${base}/ar/ai-meal-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/ai-meal-planner`, ar: `${base}/ar/ai-meal-planner` } },
    // §12.32: the AI workout-planner pair (generation for subscribers, Premium and above).
    { loc: `${base}/ai-workout-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/ai-workout-planner`, ar: `${base}/ar/ai-workout-planner` } },
    { loc: `${base}/ar/ai-workout-planner`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/ai-workout-planner`, ar: `${base}/ar/ai-workout-planner` } },
    // P0 SEO audit (2026-09-30, finding #1): the two search-intent landing
    // pairs — "workout tracker" and "macro tracker" queries had ZERO
    // matching pages while the tracking features live behind login.
    { loc: `${base}/workout-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/workout-tracker`, ar: `${base}/ar/workout-tracker` } },
    { loc: `${base}/ar/workout-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/workout-tracker`, ar: `${base}/ar/workout-tracker` } },
    { loc: `${base}/macro-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/macro-tracker`, ar: `${base}/ar/macro-tracker` } },
    { loc: `${base}/ar/macro-tracker`, changefreq: "monthly", priority: 0.8, alternates: { en: `${base}/macro-tracker`, ar: `${base}/ar/macro-tracker` } },
    // ---- Comparison index (detail pages live in sitemap-comparisons) -
    { loc: `${base}/compare`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/compare`, ar: `${base}/ar/compare` } },
    { loc: `${base}/ar/compare`, changefreq: "monthly", priority: 0.7, alternates: { en: `${base}/compare`, ar: `${base}/ar/compare` } },
  ];

  // ---- Programs (product surface) ------------------------------------
  urls.push(
    { loc: `${base}/programs`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/programs`, ar: `${base}/ar/programs` } },
    { loc: `${base}/ar/programs`, changefreq: "weekly", priority: 0.9, alternates: { en: `${base}/programs`, ar: `${base}/ar/programs` } },
  );
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

  // ---- Diet-plan matrix (SEO-GEO-6.6 §12.19 P1-8 + §12.27) -----------
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

  // Same truthful per-family anchor law as every static child (the
  // anchor lives in sitemap-lastmod.ts — one source of truth per family).
  return xmlResponse(
    buildUrlSet(urls.map((u) => ({ ...u, lastModified: familyLastmod("commercial") }))),
  );
}
