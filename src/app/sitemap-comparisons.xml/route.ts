import { buildUrlSet, xmlResponse, siteUrl, type SitemapUrl } from "@/lib/sitemap-xml";
import { familyLastmod } from "@/lib/sitemap-lastmod";
import { COMPARISONS } from "@/lib/comparisons";
import { FOOD_COMPARISONS } from "@/lib/food-comparisons";

/**
 * GET /sitemap-comparisons.xml — Comparison pages (Phase SEO-GEO-3, 2026-09-08).
 *
 * Advertises the "Alkemos vs [Competitor]" comparison pages:
 *   - /compare/[slug]      (EN)
 *   - /ar/compare/[slug]   (AR mirror)
 *
 * Each comparison targets a high-commercial-intent query (users actively
 * comparing platforms before sign-up). Conversion rates on this traffic
 * are 3–5× higher than top-of-funnel blog traffic.
 *
 * ISR cache: 1 hour (matches the other sitemap routes).
 */

export const revalidate = 3600;

export async function GET() {
  const base = siteUrl();
  const urls: SitemapUrl[] = [];

  for (const comparison of COMPARISONS) {
    urls.push({
      loc: `${base}/compare/${comparison.slug}`,
      changefreq: "monthly",
      priority: 0.8,
      alternates: {
        en: `${base}/compare/${comparison.slug}`,
        ar: `${base}/ar/compare/${comparison.slug}`,
      },
    });
    urls.push({
      loc: `${base}/ar/compare/${comparison.slug}`,
      changefreq: "monthly",
      priority: 0.8,
      alternates: {
        en: `${base}/compare/${comparison.slug}`,
        ar: `${base}/ar/compare/${comparison.slug}`,
      },
    });
  }

  // SEO-GROWTH-P4 (2026-11-05, owner order «اختبار محدود قابل للقياس»):
  // the food-vs-food comparison pilot joins the SAME sitemap family —
  // 4 pairs × 2 languages = 8 URLs, built exclusively from the curated
  // enriched foods (audit 03 §4.2). NOTE: this does NOT touch
  // sitemap-foods.xml or its selection policy in any way — the D-2
  // decision space (USDA tail / band advertisement) stays byte-identical;
  // these are NEW URLs of a NEW family, not newly-advertised old ones.
  for (const fc of FOOD_COMPARISONS) {
    urls.push({
      loc: `${base}/foods/compare/${fc.slug}`,
      changefreq: "monthly",
      priority: 0.7,
      alternates: {
        en: `${base}/foods/compare/${fc.slug}`,
        ar: `${base}/ar/foods/compare/${fc.slug}`,
      },
    });
    urls.push({
      loc: `${base}/ar/foods/compare/${fc.slug}`,
      changefreq: "monthly",
      priority: 0.7,
      alternates: {
        en: `${base}/foods/compare/${fc.slug}`,
        ar: `${base}/ar/foods/compare/${fc.slug}`,
      },
    });
  }

  // Phase 155 (#14): truthful per-family lastmod (see sitemap-lastmod.ts).
  return xmlResponse(
    buildUrlSet(urls.map((u) => ({ ...u, lastModified: familyLastmod("comparisons") }))),
  );
}
