import { buildUrlSet, xmlResponse, siteUrl, type SitemapUrl } from "@/lib/sitemap-xml";
import { listStoreSitemapEntries } from "@/lib/store-server";

/**
 * GET /sitemap-store.xml — the store family's child sitemap
 * (ALKEMOS-STORE-PHASE1 §1.6 — the sitemap-recipes.xml pattern).
 *
 * EN ONLY (governing law §0): NO Arabic mirror URLs, NO hreflang
 * alternates — self-canonical English URLs only. Inactive categories
 * (waves 2/3) stay OUT of the map until their activation orders, and
 * the thin-page law keeps sub-3 mains out too.
 *
 * Truthful per-row lastmod (the family law): products carry their
 * updated_at; category/hub entries carry NO date rather than a
 * fabricated one. Unreachable DB or zero published products → an
 * EMPTY urlset (never a 500 to a crawler).
 *
 * INDEXING CHAIN (the audit's documented trap — §11): this child is
 * ALSO registered in the sitemap.xml index, robots.txt, and the
 * IndexNow/Bing submission arrays; without all four the family never
 * reaches the engines automatically.
 */
export const revalidate = 3600;

export async function GET() {
  const base = siteUrl();
  const { categories, products } = await listStoreSitemapEntries();

  const urls: SitemapUrl[] = [
    {
      loc: `${base}/store`,
      changefreq: "daily",
      priority: 0.8,
    },
  ];

  for (const category of categories) {
    urls.push({
      loc: `${base}/store/${category.slug}`,
      changefreq: "weekly",
      priority: category.kind === "main" ? 0.7 : 0.6,
    });
  }

  for (const product of products) {
    urls.push({
      loc: `${base}/store/${product.categorySlug}/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changefreq: "weekly",
      priority: 0.7,
    });
  }

  return xmlResponse(buildUrlSet(urls));
}
