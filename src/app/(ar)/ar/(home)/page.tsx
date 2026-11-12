import type { Metadata } from "next";
import { LandingView } from "@/components/views/LandingView";
import { AuthErrorToast } from "@/components/AuthErrorToast";
import { getHomeSamples } from "@/lib/home-samples";
import { fetchSiteContentOverrides } from "@/lib/site-content/server";
import { listPublishedPostsForListPage } from "@/lib/blog-server";
import { listHomeSampleRecipes } from "@/lib/recipes-server";
import { selectHomeBlogCarousels } from "@/lib/blog-home-carousel";

// SITE-CONTENT-281: ISR freshness for the admin-editable homepage copy —
// the SAME 300 s window the blog article pages use (their precedent,
// revalidate = 300). The page re-render and the site-content cache
// (unstable_cache @ 300 s) expire together: an admin save is live within
// ~5 minutes with ZERO deploys/commits.
export const revalidate = 300;

const SITE_URL = "https://alkemos.com";

/**
 * Arabic home page — REAL page (was: redirect("/")).
 *
 * History / why this exists:
 *   This page used to be a one-line `redirect("/")`. The i18n provider
 *   then "guessed" the language from localStorage / browser settings, so:
 *     - Google crawled /ar (declared in hreflang) and found an empty
 *       redirect shell → the Arabic homepage was never indexed.
 *     - A visitor with a non-Arabic browser who explicitly opened /ar
 *       landed on the English homepage.
 *
 *   Fix (homepage AR mirror, 2026-08-30):
 *     - /ar now renders the real LandingView.
 *     - The I18nProvider is URL-aware (see `src/lib/i18n.tsx`): the root
 *       layout passes `urlLocale` resolved from the `x-pathname` header,
 *       so the SERVER renders Arabic strings for /ar (no flash, SEO sees
 *       full Arabic content).
 *     - The language toggle still works: on /ar it navigates to "/" and
 *       persists the choice in localStorage (MIRROR_ROUTES in
 *       `LanguageToggle.tsx`).
 *
 *   Metadata: title/description/OG defaults come from
 *   `src/app/ar/layout.tsx`; the alternates live HERE (not in the
 *   layout) so only the homepage declares the homepage canonical —
 *   sibling /ar/* pages declare their own (follow-up fix: the layout
 *   block was leaking to every child page).
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/ar",
    languages: {
      // BILINGUAL-CONTENT Phase 2 (audit §2.8 detail): "/" declares
      // en/x-default as "https://alkemos.com" (no trailing slash) — the
      // pair is now LITERALLY identical on both sides (this page
      // previously wrote "...com/" with the slash; Google unifies them,
      // but the ideal hreflang cluster matches byte-for-byte).
      en: `${SITE_URL}`,
      ar: `${SITE_URL}/ar`,
      "x-default": `${SITE_URL}`,
    },
  },
  // Phase 231 (owner order «نفّذ الآن جميع إصلاحات Social Sharing
  // المتبقية…» — C1): /ar previously had NO og:url — the openGraph block
  // was inherited from src/app/ar/layout.tsx, which declares no `url`, so
  // shares/crawlers saw an og:url-less Arabic homepage. The block lives
  // HERE (the homepage only) — a `url` in the /ar LAYOUT would leak onto
  // every /ar/* child without its own openGraph (the exact leak class the
  // 2026-08-30 alternates fix removed; a child openGraph block REPLACES
  // the parent's wholesale, so the layout's fields are re-declared here
  // verbatim for THIS page).
  openGraph: {
    title: "Alkemos | منصة اللياقة والتغذية الذكية المتكاملة",
    description:
      "تدرّب بذكاء، وتغذَّ بدقة، وتقدّم والأرقام في صفك — منصة واحدة تجمع التدريب والتغذية والتخطيط الذكي: 868+ تمرينًا، و8,162+ صنفًا غذائيًا، و8 أدوات مجانية، ومدرّب ذكاء اصطناعي.",
    siteName: "Alkemos",
    locale: "ar_EG",
    type: "website",
    url: `${SITE_URL}/ar`,
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — منصة اللياقة والتغذية الذكية المتكاملة",
      },
    ],
  },
};

export default async function Page() {
  // Phase 202: the AR mirror passes the same curated REAL samples as the
  // EN homepage (server-side selection — see (home)/page.tsx), plus the
  // shared OAuth-error toast island (EN/AR parity).
  // SITE-CONTENT-281: admin-editable marketing copy (Supabase overrides,
  // 5-min ISR window — the blog precedent; the code defaults are the
  // fallback). Adding the fetch converts this page from fully-static to
  // ISR, so wording changes go live WITHOUT a deploy.
  const samples = getHomeSamples();
  // F-4 (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07 §6): the #learn island's
  // carousel posts are selected SERVER-SIDE — the EN mirror's twin change
  // (see (en)/(home)/page.tsx for the full rationale: /blog list-page
  // precedent, card-fields law, ISR-window rotation, REST trip saved).
  const posts = await listPublishedPostsForListPage("ar");
  const recipeSamples = await listHomeSampleRecipes("ar", 3);
  const blogCarousels = selectHomeBlogCarousels(posts);
  const content = await fetchSiteContentOverrides();
  return (
    <>
      <AuthErrorToast />
      {/* SEO-P1-6 (frame 315): the AR mirror pins isAr=true — URL-resolved
          (the /ar page ALWAYS renders Arabic for crawlers and visitors). */}
      <LandingView samples={samples} content={content} isAr={true} blogCarousels={blogCarousels} recipeSamples={recipeSamples} />
    </>
  );
}
