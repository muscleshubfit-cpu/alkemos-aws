import { jsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { StaticPageView } from "@/components/views/StaticPageView";
import { fetchSiteContentOverrides } from "@/lib/site-content/server";
import { resolveFaqPage } from "@/lib/site-content/static-pages";

// SITE-CONTENT-281: admin-editable FAQ copy — Supabase overrides fetched
// server-side (anon key + RLS public-read, migration 0094); the faq-content.ts
// arrays remain the code defaults (single source preserved — the JSON-LD and
// the visible page derive from the SAME resolved arrays). The SAME 300 s ISR
// window the blog article pages use: an admin save is live within ~5 minutes
// with ZERO deploys, and a failed fetch renders the defaults verbatim.
export const revalidate = 300;

/**
 * FAQ page — server component so we can attach metadata + FAQPage JSON-LD
 * for Google rich results.
 *
 * AR EXPANSION (2026-08-30): the Q&A data moved to src/lib/faq-content.ts
 * (shared with the new /ar/faq mirror). hreflang now declares the REAL
 * Arabic twin /ar/faq instead of the old self-referencing en/ar pair
 * (which told Google this EN url was also the AR version).
 */

export const metadata: Metadata = {
  // SEO-GEO-4 (2026-09-08): this is the ENGLISH canonical page — it was
  // shipping an Arabic title + Arabic og:locale (live-verified defect),
  // which mis-signals the page language to crawlers. EN metadata now;
  // the Arabic twin /ar/faq carries the Arabic metadata + AR-first JSON-LD.
  title: "FAQ — Complete Platform Guide | Alkemos",
  // PHASE 194 (owner directive — Copy Refinement Pass): the time-frame
  // results claim was removed from the FAQ content — the description
  // no longer promises "when to expect results".
  // PHASE 203 (copy refinement): the Arabic-support question was retired
  // (replaced by the free-account question) — the description follows.
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 169 → 137 chars — the
    // ≤160 SERP-truncation law now holds.
    "Answers to common Alkemos questions: the EVO AI coach, memberships and pricing, payments, data safety, and what a free account gives you.",
  alternates: {
    canonical: "https://alkemos.com/faq",
    languages: {
      "en": "https://alkemos.com/faq",
      "ar": "https://alkemos.com/ar/faq",
      "x-default": "https://alkemos.com/faq",
    },
  },
  openGraph: {
    title: "FAQ — Complete Platform Guide | Alkemos",
    description:
      "Comprehensive answers about the Alkemos platform: EVO AI coach, memberships, payments, safety, and more.",
    url: "https://alkemos.com/faq",
    type: "website",
    locale: "en_US",
    // Phase 216 (P2-1 — deep-audit confirmed-7): a child openGraph block
    // replaces the root one in Next.js merging, so this page served NO
    // og:image — the home card is pinned explicitly.
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
  // SITE-CONTENT-281: resolve the admin-editable FAQ items first — the
  // JSON-LD below and the visible page below derive from the SAME
  // resolved arrays (single source law, now one editable source).
  const content = await fetchSiteContentOverrides();
  const faqEn = resolveFaqPage(content, false).items;
  const faqAr = resolveFaqPage(content, true).items;

  // FAQPage JSON-LD — both EN + AR versions for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...faqEn, ...faqAr].map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <StaticPageView page="faq" content={content} />
    </>
  );
}
