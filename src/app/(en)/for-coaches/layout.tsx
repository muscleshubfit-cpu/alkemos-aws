import type { Metadata } from "next";
import { getFAQSchema, getBreadcrumbSchema, jsonLd } from "@/lib/seo";
import { COACH_FAQ_EN } from "./content";

/**
 * FOR-COACHES — SEO layout (server component under a client page).
 *
 * EN CANONICAL of the twin pair (2026-08-30 — was a single bilingual
 * URL with self-referencing hreflang; now mirrors /ar/about & /ar/faq):
 *   EN canonical: /for-coaches      ← this layout (EN-first metadata)
 *   AR mirror:    /ar/for-coaches   (Arabic-first metadata)
 *   The pair (en/ar/x-default) is declared on BOTH sides — no
 *   self-references, no inherited signals.
 *
 * JSON-LD: FAQPage (EN questions on the EN side) + BreadcrumbList.
 */

const SITE = "https://alkemos.com";
const PAGE_URL = `${SITE}/for-coaches`;

export const metadata: Metadata = {
  title: "Coach on Alkemos — your clients, your prices, your money",
  description:
    // CONTENT-AUDIT P1-7 (audit §2.1): 260 chars — trimmed to the ~160
    // budget; commission model + free registration kept up front.
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 194 → 146 chars — the
    // ≤160 SERP-truncation law now holds (free + zero commission kept).
    "Register as a coach or nutrition specialist free: your clients, your pricing, direct collection — zero commission, a fixed monthly fee on Alkemos.",
  keywords: [
    "join as a coach",
    "coach registration",
    "online coaching platform",
    "personal trainer platform",
    "manage fitness clients",
    "AI meal plans for clients",
    "Alkemos coach",
  ],
  alternates: {
    canonical: PAGE_URL,
    languages: {
      en: PAGE_URL,
      ar: `${SITE}/ar/for-coaches`,
      "x-default": PAGE_URL,
    },
  },
  openGraph: {
    title: "Coach on Alkemos — your clients, your prices, your money",
    description:
      "A complete coach platform: client management, AI plans, your pricing, direct payments — zero commission. Register free with instant activation.",
    url: PAGE_URL,
    siteName: "Alkemos",
    locale: "en_US",
    type: "website",
    // Phase 231 (owner order C5): the vertical coach-portrait photo
    // (1122×1402) is replaced as the share card by the DEDICATED
    // horizontal 1200×630 branded card (same generator as every other
    // family card) — a summary_large_image card wants a wide asset.
    // The portrait remains the page's on-page hero image (unchanged).
    images: [
      {
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Coach on Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coach on Alkemos — your clients, your prices, your money",
    description:
      "Client management, AI plans, your pricing with zero commission. Register free.",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

const faqSchema = getFAQSchema(COACH_FAQ_EN);
const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Alkemos", url: SITE },
  { name: "For coaches", url: PAGE_URL },
]);

export default function ForCoachesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
