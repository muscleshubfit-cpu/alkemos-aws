import type { BlogPostCard } from "./blog";

/**
 * HOMEPAGE BLOG CAROUSELS — latest + featured selection (Phase 118),
 * extracted from "use client" blog.ts by F-4
 * (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6, executed 2026-11-07).
 *
 * WHY a directive-free module (the matchesBlogSearch/blog-search.ts
 * precedent, §12.40 P2-14): the homepage's #learn section now receives
 * its carousel posts as SERVER props — the two home route pages fetch
 * the published list (listPublishedPostsForListPage in blog-server.ts,
 * the /blog list precedent) and run THIS selection server-side, so the
 * section ships inside the first HTML (the audit's R-3: it used to
 * render null until deferIdle(2500) + a client REST trip, a visible
 * late layout shift) and every visit saves one REST round trip.
 * blog.ts re-exports the same symbols so existing client importers
 * (and their canaries) keep one public surface.
 *
 * Semantics are the Phase-118 contract VERBATIM; the only timing
 * change: the deterministic rotating window now computes at ISR
 * regeneration (revalidate=300) instead of each client page load —
 * the featured set still advances per UTC day, within one 5-minute
 * regeneration of the rollover.
 */

/** Max posts in the homepage «أحدث المقالات» carousel. */
export const HOME_LATEST_COUNT = 8;

/** Max posts in the homepage «مقالات مميزة» carousel. */
export const HOME_FEATURED_COUNT = 6;

/**
 * Split the blog list between the two homepage carousels.
 *
 * Phase 118 (owner directive 2026-09-04): «تنويع لقسم المقالات المميزة،
 * وأن يستبعد فقط ما يُعرض حاليًا في قسم أحدث المقالات» — the featured
 * section had been FROZEN for weeks: the old "daily shuffle" sorted posts
 * by the char-code SUM of (id + dailySeed), and the seed digits append the
 * SAME constant to every post's hash, so the sort order never changed from
 * day to day. On top of that, featured drew exclusively from posts outside
 * the latest carousel — the net effect read as "featured permanently
 * excludes anything that ever passed through latest".
 *
 * The contract now:
 * 1. `latest` — the newest HOME_LATEST_COUNT posts (section behavior
 *    unchanged; the half-cap keeps a featured pool alive for tiny blogs).
 * 2. `featured` — draws from every post NOT in `latest` at this moment.
 *    ONLY the current overlap is excluded («فقط»): a post that left the
 *    latest carousel may resurface in featured on a later day.
 * 3. Variety — a deterministic rotating window that advances
 *    HOME_FEATURED_COUNT slots per UTC day: consecutive days show a
 *    different set, and the whole pool cycles through every
 *    ceil(pool / HOME_FEATURED_COUNT) days, while the selection is stable
 *    within a single day (no mid-session flicker; every visitor on the
 *    same UTC day sees the same featured set).
 *
 * `dayIndex` is injectable for deterministic tests; production callers
 * use the default (days since Unix epoch, UTC).
 */
export function selectHomeBlogCarousels(
  posts: BlogPostCard[],
  dayIndex: number = Math.floor(Date.now() / 86_400_000),
): { latest: BlogPostCard[]; featured: BlogPostCard[] } {
  // Newest-first, defensively — callers sort desc by published_at;
  // nulls fall back to created_at so no post is dropped.
  const sorted = [...posts].sort((a, b) => {
    const ka = a.published_at ?? a.created_at ?? "";
    const kb = b.published_at ?? b.created_at ?? "";
    return kb.localeCompare(ka);
  });

  // Latest: the newest posts, capped so a small blog keeps a featured pool.
  const latest = sorted.slice(0, Math.min(HOME_LATEST_COUNT, Math.ceil(sorted.length / 2)));

  // Featured pool: everything EXCEPT what latest shows right now.
  const latestIds = new Set(latest.map((p) => p.id));
  const pool = sorted.filter((p) => !latestIds.has(p.id));

  // Rotating window: the start slot advances HOME_FEATURED_COUNT posts per
  // day (wrapping), so the featured set genuinely changes every day.
  const count = Math.min(HOME_FEATURED_COUNT, pool.length);
  const start = pool.length > 0 ? Math.abs(dayIndex * HOME_FEATURED_COUNT) % pool.length : 0;
  const featured = Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
  return { latest, featured };
}
