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

/**
 * FULL-SITE AUDIT FIX (2026-08-30): this page previously had no metadata
 * and INHERITED the root canonical (= homepage), telling Google it was a
 * duplicate of "/". Now it owns its identity (title/description/canonical).
 * AR EXPANSION (same day): /ar/about mirror built → the hreflang pair now
 * declares the real Arabic twin instead of nothing.
 */
export const metadata: Metadata = {
  title: "About Alkemos — The Platform, the Founder, and the Model",
  // PHASE 189 (SEO-GEO-10, deep-audit P1-3): was 244 chars — Google
  // truncates meta descriptions around ~155-160. Same identity, one
  // clean sentence inside the 158 EN budget (the Phase-178 description
  // law applied to a static conversion surface).
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 168 → 142 chars — the
    // ≤160 SERP-truncation law now holds (all six pillars kept).
    "A bilingual fitness and nutrition platform: exercise library, food database, free tools, ready programs, the EVO AI coach, and personal coaching.",
  alternates: {
    canonical: "/about",
    languages: {
      en: "https://alkemos.com/about",
      ar: "https://alkemos.com/ar/about",
      "x-default": "https://alkemos.com/about",
    },
  },
  // SEO/GEO audit (2026-09-28): this page had title/description but NO
  // openGraph block — Next.js field-level inheritance served the ROOT
  // homepage og:title/og:description/og:url ("Alkemos — The Smart…" and
  // og:url = "/") on /about. Mirrors the AR twin's explicit block
  // (src/app/(ar)/ar/about/page.tsx) — same replace-not-inherit law the
  // memberships/coaching layouts already document.
  openGraph: {
    title: "About Alkemos — The Platform, the Founder, and the Model",
    description:
      "A bilingual fitness and nutrition platform: exercise library, food database, free tools, ready programs, the EVO AI coach, and personal coaching.",
    url: "https://alkemos.com/about",
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
  return <StaticPageView page="about" content={content} />;
}
