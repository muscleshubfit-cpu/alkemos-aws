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
import { SiteHeader } from "@/components/SiteHeader";

/**
 * FULL-SITE AUDIT FIX (2026-08-30): this page previously had no metadata
 * and INHERITED the root canonical (= homepage), telling Google it was a
 * duplicate of "/". Now it owns its identity (title/description/canonical).
 * Access-point fix (2026-09-14): /ar/privacy now exists — reciprocal
 * hreflang pair added.
 */
export const metadata: Metadata = {
  title: "Privacy Policy — How We Protect Your Data | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 163 → 132 chars — the
    // ≤160 SERP-truncation law now holds (all five data classes kept).
    "How Alkemos collects, uses, and protects your data: account details, health metrics, cookies, third-party services, and your rights.",
  alternates: {
    canonical: "/privacy",
    languages: {
      en: "https://alkemos.com/privacy",
      ar: "https://alkemos.com/ar/privacy",
      "x-default": "https://alkemos.com/privacy",
    },
  },
  // SEO/GEO audit (2026-09-28): without an openGraph block, Next.js
  // field-level inheritance served the ROOT homepage og:title/description
  // and og:url = "/" on /privacy. Mirrors the AR twin's explicit block
  // (src/app/(ar)/ar/privacy/page.tsx).
  openGraph: {
    title: "Privacy Policy — How We Protect Your Data | Alkemos",
    description:
      "How Alkemos collects, uses, and protects your data: account details, health metrics, cookies, third-party services, and your rights.",
    url: "https://alkemos.com/privacy",
    type: "website",
    siteName: "Alkemos",
    locale: "en_US",
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — The Smart Fitness & Nutrition Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

export default async function Page() {
 const content = await fetchSiteContentOverrides();
 return <StaticPageView page="privacy" content={content} />;
}
