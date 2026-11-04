import type { Metadata } from "next";
import { getCoachingServiceSchema, getFAQSchema, jsonLd } from "@/lib/seo";
import { COACHING_FAQ } from "@/lib/coaching-faq";

/**
 * M30 fix: English-first metadata for /coaching.
 */
export const metadata: Metadata = {
  title: "Online Coaching with Real Coaches | Alkemos",
  description:
    // CONTENT-AUDIT P1-7 (audit §2.1): 203 chars — trimmed to the ~160
    // budget with the offer intact.
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 162 → 145 chars — the
    // ≤160 SERP-truncation law now holds exactly.
    "Online coaching with professional coaches and nutrition specialists: personalized meal and workout plans, weekly follow-up, and the EVO AI coach.",
  keywords: [
    "online coaching",
    "nutrition coaching",
    "personalized meal plans",
    "custom workout programs",
    "personal coaching",
    "fitness coach online",
    "nutrition specialist",
  ],
  openGraph: {
    title: "Online Coaching with Real Coaches | Alkemos",
    description:
      "Personalized meal plans, adaptive workouts, personal follow-up, and EVO AI available 24/7.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/coaching",
    // BILINGUAL-CONTENT Phase 2 (audit gap #6 — live-verified missing): a
    // child openGraph block REPLACES the root one (Next.js merging), so
    // og:site_name was silently dropped on this surface. Pinned here like
    // the AR mirrors already do.
    siteName: "Alkemos",
    // §12.53 item 4 (2026-09-15): og:image was absent — a child openGraph
    // block replaces the root one (Next.js merging), so the EN surface
    // showed no social card. Same-family home card, matching the AR
    // mirror's og-home-ar inheritance.
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=3.
        url: "/images/og/og-coaching-en.png?v=3",
        width: 1200,
        height: 630,
        alt: "Alkemos — The Smart Fitness & Nutrition Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-coaching-en.png?v=3"],
  },
  alternates: {
    canonical: "https://alkemos.com/coaching",
    // SEO-GEO-6.4 (P1-9): full hreflang pair now that /ar/coaching exists.
    languages: {
      en: "https://alkemos.com/coaching",
      ar: "https://alkemos.com/ar/coaching",
      "x-default": "https://alkemos.com/coaching",
    },
  },
};

// §12.53 item 3: locale-aware schema — the EN page reads an English
// entity description (was Arabic-only before the audit fix).
const coachingSchema = getCoachingServiceSchema("en");

// CONTENT-AUDIT P1-2 (2026-09-28, audit §1.4): the FAQ answers live inside
// a closed Radix Accordion, so they never reach the served DOM. The same
// single-source array (src/lib/coaching-faq.ts) is emitted here as
// FAQPage JSON-LD — Google retired FAQ rich results (May 2026) but AI
// answer engines parse JSON-LD from the server HTML, closing the citation
// gap for the six coaching questions.
const coachingFaqSchema = getFAQSchema(COACHING_FAQ.en);

export default function CoachingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(coachingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(coachingFaqSchema) }}
      />
      {children}
    </>
  );
}
