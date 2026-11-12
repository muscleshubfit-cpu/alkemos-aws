import { buildUrlSet, xmlResponse, siteUrl, type SitemapUrl } from "@/lib/sitemap-xml";
import { familyLastmod } from "@/lib/sitemap-lastmod";
import { FOODS } from "@/lib/foods";

/**
 * GET /sitemap-foods.xml — CRAWL-BUDGET POLICY (Phase 141, 2026-09-07 —
 * owner-approved execution of audit A-5, "food indexing economy").
 *
 * Before: 8,830 foods × EN+AR mirrors = 17,660 advertised URLs. Data
 * audit (Phase 141): the 8,750-row USDA long tail ships ENGLISH text
 * as its `nameAr` — zero USDA rows contain a single Arabic character
 * (verified by test + one-off analysis) — so every AR mirror rendered
 * an English H1 inside the Arabic locale: semantically-broken thin
 * pages that can never rank for Arabic queries, while the EN mirrors
 * are raw USDA clones competing with USDA.gov itself. Advertising
 * 17.6K such URLs spent the site's crawl budget on pages with no
 * differentiation.
 *
 * After: ONLY the 78 CURATED foods (hand-written Arabic names, real
 * default servings, tag facets) are advertised, in both languages =
 * 156 URLs. The long tail REMAINS 200-accessible and indexable —
 * discovery continues through internal links (foods explorer
 * pagination + related-foods links) — it is simply no longer
 * advertised in the sitemap, so crawl budget concentrates on the
 * pages that can actually rank ("سعرات صدور الدجاج" style queries).
 *
 * Selection criterion (deterministic): `tags.length > 0` — the same
 * hand-curation signal that already gates the homepage/foods-hub
 * "popular" facets. Pinned by foods-sitemap-policy.test.ts.
 *
 * REVERSIBLE: single commit. Revisit after 90 days of Search Console
 * coverage data (per A-5): if long-tail EN pages earn impressions,
 * re-admit a bounded, ranked subset.
 */

export const revalidate = 3600;

export async function GET() {
  const base = siteUrl();

  const curated = FOODS.filter((f) => (f.tags?.length ?? 0) > 0);

  const urls: SitemapUrl[] = [];
  for (const food of curated) {
    urls.push({
      loc: `${base}/foods/${food.slug}`,
      changefreq: "monthly",
      priority: 0.6,
      alternates: {
        en: `${base}/foods/${food.slug}`,
        ar: `${base}/ar/foods/${food.slug}`,
      },
    });
    urls.push({
      loc: `${base}/ar/foods/${food.slug}`,
      changefreq: "monthly",
      priority: 0.6,
      alternates: {
        en: `${base}/foods/${food.slug}`,
        ar: `${base}/ar/foods/${food.slug}`,
      },
    });
  }

  // Phase 155 (#14): truthful per-family lastmod (see sitemap-lastmod.ts).
  return xmlResponse(
    buildUrlSet(urls.map((u) => ({ ...u, lastModified: familyLastmod("foods") }))),
  );
}
