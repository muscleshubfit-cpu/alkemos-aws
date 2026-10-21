import { revalidatePath } from "next/cache";
import { purgeCloudflareEdgeUrls, type EdgePurgeOutcome } from "@/lib/edge-purge";

/**
 * COACH-LANDING-REVALIDATE — CACHE-POLICY-AUDIT 2026-10-22 (owner order
 * «تدقيق شامل لسياسات الكاش… وإبطال صحيح وفوري بعد تعديل المحتوى»).
 *
 * THE MEASURED GAP: the public coach landing pages
 * (/coaches/[slug] + /ar/coaches/[slug]) ride ISR revalidate=86400 (24h)
 * with NO invalidation hook anywhere — while the Cloudflare
 * «alkemos-public-html-cache» rule holds the rendered HTML for
 * edge_ttl=43200 (12h, measured live 2026-10-22; the pre-audit comments
 * said 3600). A coach edit (PUT /api/coach/landing → review pending per
 * the 0046 law) or the admin's approve/reject/unpublish flip therefore
 * kept serving the OLD public render for up to ~12-36h — including
 * pages that were unpublished or re-sent to moderation (the review
 * law's «stays hidden until approved» was leaking through the caches).
 *
 * THE FIX (the blog precedent's pattern): revalidatePath for both
 * language mirrors + an env-gated targeted CF purge of both URLs —
 * fired server-side at the end of the coach's own PUT, and from the
 * admin review surface (browser write → fire-and-forget
 * POST /api/admin/coach-pages/revalidate).
 *
 * NEVER throws — a cache refresh must never fail the DB write that
 * already succeeded; failures are reported honestly in the outcome.
 */

/** Same shape the PUT route's own SLUG_RE enforces (3-40 latin
 * chars/digits/dashes — lowercase). */
const SLUG_RE = /^[a-z0-9-]{3,40}$/;

export type CoachLandingRevalidateOutcome = {
  ok: boolean;
  slug?: string;
  error?: string;
  invalidated: { paths: string[] };
  edge: EdgePurgeOutcome;
};

/** The public page paths one coach landing flows through (both mirrors). */
export function coachLandingPublicPaths(slug: string): {
  en: string;
  ar: string;
} {
  return { en: `/coaches/${slug}`, ar: `/ar/coaches/${slug}` };
}

/** Invalidate every cache layer for one coach landing. */
export async function revalidateCoachLanding(
  slugRaw: string,
): Promise<CoachLandingRevalidateOutcome> {
  const slug = String(slugRaw ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return {
      ok: false,
      error:
        "revalidateCoachLanding: missing/invalid slug — nothing invalidated",
      invalidated: { paths: [] },
      edge: { attempted: false, ok: false, urls: [], error: "skipped (bad slug)" },
    };
  }

  const paths = Object.values(coachLandingPublicPaths(slug));
  let originError: string | undefined;

  try {
    for (const p of paths) revalidatePath(p);
  } catch (e) {
    originError =
      e instanceof Error ? e.message : "origin revalidation threw (non-Error)";
  }

  const urls = paths.map((p) => `https://alkemos.com${p}`);
  const edge = await purgeCloudflareEdgeUrls(urls);

  return {
    ok: !originError,
    slug,
    ...(originError ? { error: originError } : {}),
    invalidated: { paths: [...paths] },
    edge,
  };
}
