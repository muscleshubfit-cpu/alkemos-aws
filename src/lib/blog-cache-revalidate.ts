import { revalidatePath, revalidateTag } from "next/cache";

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
 *   3. Cloudflare edge — s-maxage=3600 + stale-while-revalidate=86400 on
 *      the HTML, and each layer can "latch" the previous layer's stale
 *      copy on its refresh (an origin STALE-while-revalidate answer is
 *      still a 200 that the edge happily re-caches for another hour).
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

/** The public URL paths a published post flows through (per language). */
export function blogPostPublicPaths({ slug, language }: BlogCacheRevalidateInput) {
  const listing = language === "ar" ? "/ar/blog" : "/blog";
  return {
    article: `${listing}/${slug}`,
    listing,
    rss: language === "ar" ? "/ar/rss.xml" : "/rss.xml",
    sitemap: "/sitemap-blog.xml",
  } as const;
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
  //    shared/.env production path.
  const urls = paths.map((p) => `https://alkemos.com${p}`);
  const edge = await purgeCloudflareEdge(urls);

  return {
    ok: !originError,
    ...(originError ? { error: originError } : {}),
    invalidated: { tags: [...BLOG_CACHE_TAGS], paths: [...paths] },
    edge,
  };
}

async function purgeCloudflareEdge(urls: string[]): Promise<
  BlogCacheRevalidateOutcome["edge"]
> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_PURGE_TOKEN;
  if (!zoneId || !token) {
    return {
      attempted: false,
      ok: false,
      urls,
      error:
        "CLOUDFLARE_ZONE_ID/CLOUDFLARE_PURGE_TOKEN not configured — the edge keeps serving the old copy until s-maxage=3600 expires (≤1h); see docs/BLOG-CONTENT-CACHE-REFRESH-2026-10-21.md §setup",
    };
  }
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: urls }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) {
      return {
        attempted: true,
        ok: false,
        urls,
        error: `Cloudflare purge HTTP ${res.status}`,
      };
    }
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean }
      | null;
    if (!json?.success) {
      return {
        attempted: true,
        ok: false,
        urls,
        error: "Cloudflare purge endpoint answered without success=true",
      };
    }
    return { attempted: true, ok: true, urls };
  } catch (e) {
    return {
      attempted: true,
      ok: false,
      urls,
      error: e instanceof Error ? e.message : "edge purge threw (non-Error)",
    };
  }
}
