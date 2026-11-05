import type { Metadata } from "next";
import { StaticPageView } from "@/components/views/StaticPageView";
import { fetchSiteContentOverrides } from "@/lib/site-content/server";

// SITE-CONTENT-281: admin-editable page copy — Supabase overrides fetched
// server-side (anon key + RLS public-read, migration 0094) and passed down;
// the code defaults in site-content/static-pages.ts are the eternal fallback.
// The SAME 300 s ISR window the blog article pages use: an admin save is
// live within ~5 minutes with ZERO deploys, and a failed fetch renders the
// defaults verbatim (the fallback law).
export const revalidate = 300;

const SITE_URL = "https://alkemos.com";

/**
 * Access-point fix (2026-09-14): /ar/terms — Arabic mirror of /terms.
 *
 * The Arabic terms content already existed inside the bilingual
 * StaticPageView; this page gives it its own indexable URL with
 * Arabic-first metadata + reciprocal hreflang with the EN page
 * (same pattern as /ar/faq and /ar/about).
 */
export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description:
    "شروط استخدام Alkemos: الاشتراك والعضويات، الخطط المخصصة بالذكاء الاصطناعي، التبديلات، مسؤولية المدربين وعملائهم، الملكية الفكرية، وسياسة الاسترداد.",
  alternates: {
    canonical: `${SITE_URL}/ar/terms`,
    languages: {
      en: `${SITE_URL}/terms`,
      ar: `${SITE_URL}/ar/terms`,
      "x-default": `${SITE_URL}/terms`,
    },
  },
  openGraph: {
    title: "الشروط والأحكام — Alkemos",
    description:
      "شروط استخدام منصة Alkemos: الاشتراك، الخطط، التبديلات، والمسؤوليات.",
    url: `${SITE_URL}/ar/terms`,
    type: "website",
    locale: "ar_EG",
    // Phase 216 (P2-1 — deep-audit confirmed-7): same replace-not-inherit
    // gap as /ar/about — the home card is pinned explicitly.
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "منصة Alkemos الرياضية الشاملة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

export default async function Page() {
  const content = await fetchSiteContentOverrides();
  return <StaticPageView page="terms" content={content} />;
}
