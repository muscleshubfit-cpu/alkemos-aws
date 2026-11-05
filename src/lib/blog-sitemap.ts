/**
 * Pure helpers for /sitemap-blog.xml (SEO-GEO-4.1, 2026-09-08).
 *
 * Translation pairing via the existing `linked_post_id` column — the
 * "real translation pairing" audit C1 (2026-09-07) required before
 * hreflang may be re-added. Rules enforced here (unit-tested):
 *   1. A link is honored ONLY when the target is a PUBLISHED row in the
 *      opposite language (unpublished/self/same-language links are
 *      ignored) — the dangling-hreflang bug can never regress.
 *   2. Alternates are always reciprocal: EN↔AR pair URLs.
 *   3. lastmod = greatest(published_at, updated_at) (audit M4).
 */

export type BlogSitemapPost = {
  id: string;
  slug: string;
  language: string;
  published_at: string | null;
  updated_at: string | null;
  linked_post_id: string | null;
};

export function blogPostUrl(base: string, p: { language: string; slug: string }): string {
  return `${base}${p.language === "ar" ? "/ar/blog" : "/blog"}/${p.slug}`;
}

/**
 * Reciprocal hreflang alternates for a translation pair, or undefined
 * when the post has no valid opposite-language published twin.
 */
export function blogPairAlternates(
  post: BlogSitemapPost,
  byId: Map<string, BlogSitemapPost>,
  base: string,
): { en: string; ar: string } | undefined {
  const twin = post.linked_post_id ? byId.get(post.linked_post_id) : undefined;
  if (!twin || twin.language === post.language) return undefined;
  const en = post.language === "en" ? post : twin;
  const ar = post.language === "ar" ? post : twin;
  return { en: blogPostUrl(base, en), ar: blogPostUrl(base, ar) };
}

/** lastmod = greatest(published_at, updated_at), falling back to now. */
export function blogLastmod(post: BlogSitemapPost, fallback: Date): Date {
  const published = post.published_at ? new Date(post.published_at) : null;
  const updated = post.updated_at ? new Date(post.updated_at) : null;
  if (published && updated) return published > updated ? published : updated;
  return published ?? updated ?? fallback;
}

/**
 * Honest <lastmod> for the sitemap-INDEX entry pointing at
 * /sitemap-blog.xml (P-3 fix, 2026-11-05): the greatest REAL
 * published_at|updated_at across published rows.
 *
 * Deliberately NO fallback-to-now (unlike blogLastmod, which the child
 * sitemap uses per-row): the index entry must either carry a date the
 * data actually supports or be omitted entirely — a fabricated "today"
 * is exactly the dishonest pattern Google discounts (Search Central:
 * lastmod is used for crawl scheduling only while consistently
 * accurate). Returns null on empty/absent rows or when no row carries
 * a parseable date.
 */
export function blogIndexLastmod(
  posts:
    | ReadonlyArray<{ published_at: string | null; updated_at: string | null }>
    | null
    | undefined,
): Date | null {
  if (!posts) return null;
  let max: Date | null = null;
  for (const post of posts) {
    const published = post.published_at ? new Date(post.published_at) : null;
    const updated = post.updated_at ? new Date(post.updated_at) : null;
    const d =
      published && updated
        ? published > updated
          ? published
          : updated
        : (published ?? updated);
    // Invalid date strings produce NaN Dates — comparisons are false,
    // so unparseable rows are ignored rather than poisoning the max.
    if (d && !Number.isNaN(d.getTime()) && (!max || d > max)) {
      max = d;
    }
  }
  return max;
}
