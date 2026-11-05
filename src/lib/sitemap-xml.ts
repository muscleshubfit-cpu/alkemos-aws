/**
 * Shared XML helpers for the split sitemap files (audit C2, 2026-09-05).
 *
 * The old single /sitemap.xml was ~9.3MB with 19,498 URLs (90% food
 * pages) — Google's crawl budget drowned the blog/landing URLs that
 * actually earn traffic. The sitemap is now a Sitemap INDEX:
 *
 *   /sitemap.xml             → index (points at the 4 children)
 *   /sitemap-pages.xml       → static pages + tools + programs (~60 URLs)
 *   /sitemap-exercises.xml   → 868 exercises × EN+AR (1,736 URLs)
 *   /sitemap-foods.xml       → 80 CURATED foods × EN+AR (160 URLs —
 *                              Phase 141/A-5 crawl-budget policy; the
 *                              8,750-row USDA long tail stays live and
 *                              indexable via internal links but is no
 *                              longer advertised)
 *   /sitemap-blog.xml        → published posts (live Supabase query)
 *
 * Each child carries its own realistic <priority> bands and is ISR
 * cached for an hour — identical data, fraction of the crawl cost.
 */

export const SITEMAP_CACHE_CONTROL =
  "public, max-age=3600, stale-while-revalidate=86400";

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type SitemapUrl = {
  loc: string;
  /** <lastmod> date (W3C date, day precision). */
  lastModified?: Date;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  /** hreflang alternates (xhtml:link rel="alternate"). */
  alternates?: Record<string, string>;
};

/**
 * One child entry of the /sitemap.xml INDEX.
 *
 * `lastModified` is OPTIONAL BY DESIGN (P-3 fix, 2026-11-05): it must
 * carry the date the child sitemap FILE actually changed (for the five
 * static families: the central family anchor; for blog: the greatest
 * real published/updated date across rows) — and it must be OMITTED
 * when no truthful date is available, never fabricated. Google uses
 * <lastmod> for crawl scheduling only while the dates look consistently
 * accurate and ignores them otherwise (Search Central sitemap docs);
 * the pre-fix index wrote lastmod=today for every child daily, which
 * is exactly the pattern that gets the signal discounted.
 */
export type SitemapIndexEntry = {
  loc: string;
  lastModified?: Date;
};

function toW3CDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Serializes a urlset (Google sitemap protocol 0.9 + xhtml:link). */
export function buildUrlSet(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts = [`<loc>${xmlEscape(u.loc)}</loc>`];
      if (u.lastModified) parts.push(`<lastmod>${toW3CDate(u.lastModified)}</lastmod>`);
      if (u.changefreq) parts.push(`<changefreq>${u.changefreq}</changefreq>`);
      if (typeof u.priority === "number") {
        parts.push(`<priority>${u.priority.toFixed(1)}</priority>`);
      }
      if (u.alternates) {
        for (const [lang, href] of Object.entries(u.alternates)) {
          parts.push(
            `<xhtml:link rel="alternate" hreflang="${xmlEscape(lang)}" href="${xmlEscape(href)}" />`,
          );
        }
      }
      return `  <url>\n    ${parts.join("\n    ")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`;
}

/**
 * Serializes a sitemap index file.
 *
 * <lastmod> is emitted ONLY for entries that carry a real Date (P-3
 * fix, 2026-11-05) — absent dates are omitted, never faked.
 */
export function buildSitemapIndex(entries: SitemapIndexEntry[]): string {
  const body = entries
    .map((entry) => {
      const parts = [`<loc>${xmlEscape(entry.loc)}</loc>`];
      if (entry.lastModified) {
        parts.push(`<lastmod>${toW3CDate(entry.lastModified)}</lastmod>`);
      }
      return `  <sitemap>\n    ${parts.join("\n    ")}\n  </sitemap>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": SITEMAP_CACHE_CONTROL,
    },
  });
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://alkemos.com"
  );
}
