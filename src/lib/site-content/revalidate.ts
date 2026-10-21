import { revalidatePath, revalidateTag } from "next/cache";
import { purgeCloudflareEdgeUrls, type EdgePurgeOutcome } from "@/lib/edge-purge";
import { SITE_CONTENT_CACHE_TAG } from "@/lib/site-content/server";

/**
 * SITE-CONTENT/REVALIDATE — CACHE-POLICY-AUDIT 2026-10-22 (owner order
 * «تدقيق شامل لسياسات الكاش… وإبطال صحيح وفوري بعد تعديل المحتوى»).
 *
 * THE MEASURED GAP: the /admin/site-content editor writes its override
 * rows DIRECTLY from the browser (adminUpsertSiteContent /
 * adminResetSiteContent — no server write route to hook), and the
 * consuming pages (homepage EN/AR + about/faq/terms/privacy EN/AR)
 * ride THREE stacked TTL layers with NO invalidation hook:
 *
 *   unstable_cache(300s) → ISR(300s) → Cloudflare edge(edge_ttl 43200)
 *
 * The origin half of that stack is fresh within ~5 minutes — but the
 * Cloudflare «alkemos-public-html-cache» rule (edge_ttl=43200, measured
 * live 2026-10-22 — the code comments' 3600 was stale twice over) held
 * the PRE-EDIT render for up to 12h. Same incident class the blog fix
 * (BLOG-CACHE-REFRESH 2026-10-21) closed for blog_posts.
 *
 * THE FIX (the blog precedent, verbatim pattern): revalidateTag on the
 * wrapper's tag + revalidatePath for every consuming page + an
 * env-gated targeted CF purge of those URLs — fired by the admin
 * editor (fire-and-forget after a successful save/reset) through
 * POST /api/admin/site-content/revalidate, and available as the manual
 * lever after direct Supabase dashboard edits.
 *
 * NEVER throws — a cache refresh must never fail the DB write that
 * already succeeded; failures are reported honestly in the outcome.
 */

/** The pages whose render consumes the override map (grep-verified the
 * complete set — home EN/AR + about/faq/terms/privacy EN/AR). */
export const SITE_CONTENT_PAGE_PATHS = [
  "/",
  "/ar",
  "/about",
  "/ar/about",
  "/faq",
  "/ar/faq",
  "/terms",
  "/ar/terms",
  "/privacy",
  "/ar/privacy",
] as const;

export type SiteContentRevalidateOutcome = {
  ok: boolean;
  error?: string;
  invalidated: { tag: string; paths: string[] };
  edge: EdgePurgeOutcome;
};

/** Invalidate every cache layer for the site-content override map. */
export async function revalidateSiteContent(): Promise<SiteContentRevalidateOutcome> {
  let originError: string | undefined;

  try {
    // "max" = Next 16's non-deprecated profile argument (classic
    // immediate invalidation; single-arg revalidateTag is deprecated).
    revalidateTag(SITE_CONTENT_CACHE_TAG, "max");
    for (const p of SITE_CONTENT_PAGE_PATHS) revalidatePath(p);
  } catch (e) {
    originError =
      e instanceof Error ? e.message : "origin revalidation threw (non-Error)";
  }

  const urls = SITE_CONTENT_PAGE_PATHS.map((p) => `https://alkemos.com${p}`);
  const edge = await purgeCloudflareEdgeUrls(urls);

  return {
    ok: !originError,
    ...(originError ? { error: originError } : {}),
    invalidated: { tag: SITE_CONTENT_CACHE_TAG, paths: [...SITE_CONTENT_PAGE_PATHS] },
    edge,
  };
}
