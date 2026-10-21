import { revalidatePath, revalidateTag } from "next/cache";
import { purgeCloudflareEdgeUrls } from "@/lib/edge-purge";

/**
 * BLOG-CACHE-REFRESH — the 2026-10-21 root-cause fix for «تعديلاتي
 * اليدوية لا تنعكس على المقالات المنشورة» (owner order 2026-10-21).
 * Full story + measured evidence: docs/BLOG-CONTENT-CACHE-REFRESH-2026-10-21.md
 *
 * THE MEASURED INCIDENT: the owner's edits + review approvals saved in
 * the DB (updated_at 17:20:25 AR / 20:46:05 EN) and even reached the
 * origin's fresh ISR render — yet the reader kept seeing the pre-edit
 * page («AI-generated · medical review pending» + the old title) for
 * hours. Root cause: THREE stacked TTL layers with ZERO invalidation
 * hooks anywhere in the codebase (grep: 0 revalidatePath/revalidateTag):
 *
 *   1. Next.js Data Cache — unstable_cache(blog-og / blog-full /
 *      blog-slug-pools) revalidate: 3600
 *   2. Next.js ISR page/route cache — the blog pages' revalidate: 3600
 *      (plus force-static rss.xml / sitemap-blog.xml)
 *   3. Cloudflare edge — the «alkemos-public-html-cache» rule serves
 *      the HTML for edge_ttl=43200 (measured live 2026-10-22 — the
 *      pre-audit comments said 3600; the rule was raised twice since:
 *      T-3 → 14400, T-3b → 43200), plus og-image edge_ttl=86400 — and
 *      each layer can "latch" the previous layer's stale copy on its
 *      refresh (an origin STALE-while-revalidate answer is still a 200
 *      that the edge happily re-caches for another TTL window).
 *
 * CACHE-POLICY-AUDIT 2026-10-22 extension: the purge list now also
 * carries the article's og-image generator URL (/api/og-image/<slug>
 * ?lang=…) — the card renders the stored title, and the og-image cache
 * rule holds it for a full edge day, so a title edit would otherwise
 * keep the OLD card alive for up to 24h on social platforms.
 *
 * THE FIX (minimal + safe — TTLs, cache settings and the review policy
 * are all untouched): every owner write path that already updates the DB
 * now ALSO invalidates the three layers for the affected post:
 *
 *   revalidateTag(blog-og | blog-full | blog-slug-pools)  → data cache
 *   revalidatePath(article | listing | rss | sitemap)     → ISR caches
 *   POST /client/v4/zones/<id>/purge_cache {files}       → CF edge
 *      (env-gated on CLOUDFLARE_ZONE_ID + CLOUDFLARE_PURGE_TOKEN — the
 *      documented shared/.env path; absent vars degrade to an honest
 *      reported skip, the edge then self-heals within s-maxage)
 *
 * Consumers: POST /api/admin/blog/review (the Approve button),
 * POST /api/admin/blog/revalidate (the editor's post-save call +
 * the manual lever after direct Supabase dashboard edits).
 */

/** The exact tags declared on the three unstable_cache wrappers in
 *  blog-server.ts (single source of truth for both sides of the pact). */
export const BLOG_CACHE_TAGS = [
  "blog-og",
  "blog-full",
  "blog-slug-pools",
] as const;

export type BlogCacheRevalidateInput = {
  slug: string;
  language: "en" | "ar";
};

export type BlogCacheRevalidateOutcome = {
  /** origin-side invalidation (tags + paths) succeeded */
  ok: boolean;
  error?: string;
  invalidated: { tags: string[]; paths: string[] };
  edge: {
    attempted: boolean;
    ok: boolean;
    urls: string[];
    error?: string;
  };
};

/** The public URL paths a published post flows through (per language).
 * PAGE paths only — these are what revalidatePath() gets called with;
 * the og-image generator URL is a ROUTE (edge-cached, never ISR-cached)
 * and rides the purge list via blogPostPurgeUrls(). */
export function blogPostPublicPaths({ slug, language }: BlogCacheRevalidateInput) {
  const listing = language === "ar" ? "/ar/blog" : "/blog";
  return {
    article: `${listing}/${slug}`,
    listing,
    rss: language === "ar" ? "/ar/rss.xml" : "/rss.xml",
    sitemap: "/sitemap-blog.xml",
  } as const;
}

/** The absolute URLs purged from the Cloudflare edge for one post: the
 * four page URLs + the og-image card (CACHE-POLICY-AUDIT 2026-10-22 —
 * the card carries the stored title and its edge TTL is 86400s). */
export function blogPostPurgeUrls(input: BlogCacheRevalidateInput): string[] {
  const pages = Object.values(blogPostPublicPaths(input)).map(
    (p) => `https://alkemos.com${p}`,
  );
  const ogImage = `https://alkemos.com/api/og-image/${input.slug}?lang=${input.language}`;
  return [...pages, ogImage];
}

/**
 * Invalidate every cache layer for one blog post. NEVER throws — a cache
 * refresh must never fail the DB write that already succeeded behind it;
 * failures are reported honestly in the outcome instead.
 */
export async function revalidateBlogPost(
  input: BlogCacheRevalidateInput,
): Promise<BlogCacheRevalidateOutcome> {
  if (!input.slug || (input.language !== "en" && input.language !== "ar")) {
    return {
      ok: false,
      error:
        "revalidateBlogPost: missing/invalid slug or language — nothing invalidated",
      invalidated: { tags: [], paths: [] },
      edge: { attempted: false, ok: false, urls: [], error: "skipped (bad input)" },
    };
  }

  const paths = Object.values(blogPostPublicPaths(input));
  let originError: string | undefined;

  // 1) Next.js Data Cache — the unstable_cache entries carry these tags
  //    (blog-server.ts); this is what makes content edits visible on the
  //    next render instead of after the 3600s TTL.
  //    ("max" profile = Next 16's non-deprecated second argument — the
  //    classic immediate-invalidation semantics; updateTag is
  //    Server-Action-only and cannot be used from Route Handlers.)
  // 2) Next.js ISR caches — the article page, the language listing, the
  //    language RSS feed and the blog sitemap.
  try {
    for (const tag of BLOG_CACHE_TAGS) revalidateTag(tag, "max");
    for (const p of paths) revalidatePath(p);
  } catch (e) {
    originError =
      e instanceof Error ? e.message : "origin revalidation threw (non-Error)";
  }

  // 3) Cloudflare edge — targeted per-URL purge (NOT a cache-settings
  //    change): the zone-scoped token pair comes from the documented
  //    shared/.env production path. Includes the og-image card URL
  //    (edge TTL 86400) so a title edit refreshes social cards too.
  const urls = blogPostPurgeUrls(input);
  const edge = await purgeCloudflareEdgeUrls(urls);

  return {
    ok: !originError,
    ...(originError ? { error: originError } : {}),
    invalidated: { tags: [...BLOG_CACHE_TAGS], paths: [...paths] },
    edge,
  };
}
