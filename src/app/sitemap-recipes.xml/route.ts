import { buildUrlSet, xmlResponse, siteUrl, type SitemapUrl } from "@/lib/sitemap-xml";
import { listPublishedRecipeSlugs } from "@/lib/recipes-server";

/**
 * GET /sitemap-recipes.xml — the recipes family's child sitemap
 * (HEALTHY-RECIPES-PLATFORM plan §10-3 — the sitemap-blog pattern).
 *
 * ONE slug per pair → both mirrors advertised with truthful per-row
 * lastmod (the recipes.updated_at). Unreachable DB or zero published
 * pairs → an EMPTY urlset (never a 500 to a crawler).
 *
 * INDEXING CHAIN (the audit's documented trap — §11): this child is
 * ALSO registered in the sitemap.xml index, robots.txt, and the
 * IndexNow/Bing submission arrays; without all four the family never
 * reaches the engines automatically.
 */
export const revalidate = 3600;

export async function GET() {
  const base = siteUrl();
  const slugs = await listPublishedRecipeSlugs();

  const urls: SitemapUrl[] = [];
  for (const { slug, updatedAt } of slugs) {
    const lastModified = new Date(updatedAt);
    urls.push({
      loc: `${base}/recipes/${slug}`,
      lastModified,
      changefreq: "monthly",
      priority: 0.7,
      alternates: {
        en: `${base}/recipes/${slug}`,
        ar: `${base}/ar/recipes/${slug}`,
      },
    });
    urls.push({
      loc: `${base}/ar/recipes/${slug}`,
      lastModified,
      changefreq: "monthly",
      priority: 0.7,
      alternates: {
        en: `${base}/recipes/${slug}`,
        ar: `${base}/ar/recipes/${slug}`,
      },
    });
  }

  return xmlResponse(buildUrlSet(urls));
}
