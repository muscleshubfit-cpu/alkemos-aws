import { LandingView } from "@/components/views/LandingView";
import { AuthErrorToast } from "@/components/AuthErrorToast";
import { getHomeSamples } from "@/lib/home-samples";
import { fetchSiteContentOverrides } from "@/lib/site-content/server";
import { listPublishedPostsForListPage } from "@/lib/blog-server";
import { selectHomeBlogCarousels } from "@/lib/blog-home-carousel";

/**
 * HOMEPAGE (EN canonical "/") — Phase 202 «Product-Website Homepage»
 * (owner order 2026-09-15: the homepage serves DISCOVERY + USAGE, not a
 * sales pitch).
 *
 * ARCHITECTURE (Phase 202): this page is now a SERVER component — it
 * picks the curated REAL content samples (8 exercises / 8 foods / 3
 * programs) from the giant server-only libraries via getHomeSamples()
 * and passes the small serializable slices to the client LandingView.
 * The old "use client" page existed only for the OAuth-error toast,
 * which now lives in the tiny AuthErrorToast island below (verbatim
 * behavior).
 *
 * Metadata (canonical + hreflang cluster) is owned by this route
 * group's server layout.tsx — unchanged.
 *
 * SITE-CONTENT-281: the page additionally fetches the admin-editable
 * marketing-copy overrides (anon-key read + RLS public-read, migration
 * 0094) and passes them to LandingView. `revalidate = 300` is the SAME
 * ISR window the blog article pages use — an admin wording save goes
 * live within ~5 minutes WITHOUT a deploy, and a missing/failed fetch
 * renders the code defaults (the fallback law). The fetch converts this
 * page from fully-static to ISR (one regeneration per 5-min window at
 * most, the blog's accepted trade).
 */
export const revalidate = 300;

export default async function Page() {
  const samples = getHomeSamples();
  // F-4 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6): the #learn island's
  // carousel posts are selected SERVER-SIDE (the /blog list-page precedent
  // + the getHomeSamples pattern — listPublishedPostsForListPage is the
  // same card-fields law, and the failed-fetch law returns [] so the
  // section honestly doesn't render). The fetch rides the page's ISR
  // window (revalidate=300), so the rotating featured window advances at
  // regeneration — and each visit saves the old client REST trip.
  const posts = await listPublishedPostsForListPage("en");
  const blogCarousels = selectHomeBlogCarousels(posts);
  const content = await fetchSiteContentOverrides();
  return (
    <>
      <AuthErrorToast />
      {/* SEO-P1-6 (frame 315): the EN canonical homepage pins isAr=false —
          URL-resolved, the BlogListPage precedent (no client locale
          guess on the body; the header/footer chrome keeps its own
          provider behavior). */}
      <LandingView samples={samples} content={content} isAr={false} blogCarousels={blogCarousels} />
    </>
  );
}
