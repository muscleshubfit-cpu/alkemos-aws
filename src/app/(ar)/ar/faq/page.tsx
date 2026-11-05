import { jsonLd } from "@/lib/seo";
import type { Metadata } from "next";
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

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /faq.
 *
 * AR EXPANSION (2026-08-30): the FAQ content (both languages) was already
 * in the platform — StaticPageView renders its Arabic sections whenever the
 * URL is under /ar/* (I18nProvider is URL-first since the homepage AR
 * mirror fix). This page gives that Arabic content its own indexable URL
 * + Arabic-first metadata + reciprocal hreflang with the EN page.
 *
 * The FAQPage JSON-LD mirrors the EN page's structure but is ordered
 * Arabic-first (the AR Q&As are the ones this URL will be quoted for).
 * Q&A data comes from the shared src/lib/faq-content.ts.
 */
export const metadata: Metadata = {
  // SEO-GEO-4: no brand suffix in title — the /ar layout template appends
  // exactly one "— Alkemos" (the old string produced "… | Alkemos — Alkemos").
  title: "الأسئلة الشائعة | إجابات عن المنصة والعضويات",
  description:
    "كل ما تريد معرفته عن Alkemos: المنصة، مدربك الذكي EVO، العضويات والأسعار، طرق الدفع، وأمان البيانات.",
  alternates: {
    canonical: `${SITE_URL}/ar/faq`,
    languages: {
      en: `${SITE_URL}/faq`,
      ar: `${SITE_URL}/ar/faq`,
      "x-default": `${SITE_URL}/faq`,
    },
  },
  openGraph: {
    title: "الأسئلة الشائعة — Alkemos",
    description:
      "إجابات شاملة حول منصة Alkemos: محرك EVO الذكي، العضويات، الدفع، الأمان، والمزيد.",
    url: `${SITE_URL}/ar/faq`,
    type: "website",
    locale: "ar_EG",
    // Phase 216 (P2-1 — deep-audit confirmed-7): same replace-not-inherit
    // gap as the EN /faq — the home card is pinned explicitly.
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
  // SITE-CONTENT-281: resolve the admin-editable FAQ items first — the
  // JSON-LD below and the visible page below derive from the SAME
  // resolved arrays (single source law, now one editable source).
  const content = await fetchSiteContentOverrides();
  const faqAr = resolveFaqPage(content, true).items;
  const faqEn = resolveFaqPage(content, false).items;

  // FAQPage JSON-LD — Arabic-first (this is the URL AI engines and Google
  // should quote for Arabic questions), with the EN set riding along.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...faqAr, ...faqEn].map((faq) => ({
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
