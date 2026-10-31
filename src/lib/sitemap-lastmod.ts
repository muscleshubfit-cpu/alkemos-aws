/**
 * src/lib/sitemap-lastmod.ts — PER-FAMILY SITEMAP lastmod ANCHORS
 * (Phase 155, SEO-GEO-4.7 — master plan §7.1 #14).
 *
 * WHY: only /sitemap-blog.xml emitted <lastmod> (live Supabase dates);
 * the four static-data children advertised URLs with NO lastmod, so
 * search engines had no recency signal for ~1,900 of the site's URLs.
 *
 * UPDATE PROTOCOL (the whole point of centralizing): when a shipped
 * phase materially changes a page family's SERVED HTML (content,
 * schema, or visible structure — not just code refactors), bump that
 * family's date to the ship date. The value must stay truthful: it is
 * the date the pages last meaningfully changed, in W3C day precision.
 *
 *   pages        — static pages + tools + programs + diet-plan matrix
 *                  (batch 1-b: og:image on the AR evo/coaching/diet-plan
 *                  mirrors; batch 2: homepage exercise-sample images)
 *   exercises    — exercise detail pages: pinned to 2026-09-16 (batch 2
 *                  of §12.53 — image self-hosting changed every page's
 *                  served HTML; decoupled from CONTENT_LAST_REVIEWED,
 *                  which stays the E-E-A-T content-review anchor)
 *   foods        — food detail pages: 2026-11-01 (P1-1 batch 1 —
 *                  SEO-ADSENSE-RECOVERY-PLAN-2026-10-31, owner order
 *                  2026-11-01: the unique editorial layer (intro +
 *                  usage context + FAQ) changed the served HTML of 20
 *                  of the 80 curated foods across BOTH language
 *                  mirrors — a material family change; the anchor
 *                  stays truthful for the family as a whole)
 *   collections  — /muscles/* + /equipment/* + /collections/* hubs
 *                  (§12.53 batch 1: og:image + large twitter card on
 *                  the EN /equipment/* hubs)
 *   comparisons  — /compare/* pages (last material change: SEO-GEO-4
 *                  compare index, 2026-09-08)
 *
 * Blog stays dynamic (blogLastmod per-row from Supabase) and is NOT
 * listed here — one source of truth per family, never two.
 */

export const SITEMAP_LASTMOD = {
  pages: "2026-09-16",
  exercises: "2026-09-16",
  foods: "2026-11-01",
  collections: "2026-09-15",
  comparisons: "2026-09-08",
} as const;

export type SitemapFamily = keyof typeof SITEMAP_LASTMOD;

/** W3C day-precision Date for a family's lastmod (sitemap-xml contract). */
export function familyLastmod(family: SitemapFamily): Date {
  return new Date(`${SITEMAP_LASTMOD[family]}T00:00:00Z`);
}
