import type { Metadata } from "next";
import { getEVOApplicationSchema, getFAQSchema, jsonLd } from "@/lib/seo";
import { EVO_FAQ } from "@/lib/evo-faq";

/**
 * M30 fix: English-first metadata for /evo.
 */
export const metadata: Metadata = {
  title: "EVO — AI Fitness Coach | Alkemos",
  description:
    // CONTENT-AUDIT P1-7 (2026-09-28, audit §2.1): 265 chars — Google
    // truncates at ~155-160. Front-loaded the definition + core actions.
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 189 → 159 chars — the
    // ≤160 SERP-truncation law now holds exactly (proof kept: free-for-all).
    "EVO, your intelligent performance engine: builds personalized nutrition and workout plans from your data and goal, and suggests smart swaps. Free for everyone.",
  keywords: [
    "EVO AI coach",
    "AI fitness coach",
    "intelligent performance engine",
    "AI workout assistant",
    "AI nutrition consultant",
    "fitness AI",
    "smart fitness coach",
  ],
  openGraph: {
    title: "EVO — AI Fitness Coach | Alkemos",
    description:
      "An intelligent engine that builds personalized plans from your data and suggests smart swaps. Free for everyone.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/evo",
    // §12.53 item 4 (2026-09-15): the EN list surfaces shared NO social
    // card — this layout declared openGraph without images, and a child
    // openGraph block REPLACES the root one in Next.js metadata merging,
    // so nothing was inherited. Phase 231 (owner order C3): the card is
    // now the DEDICATED EVO card (og-evo-en, 1200×630, same generator
    // design) — it previously reused the homepage card (og-home-en).
    images: [
      {
        url: "/images/og/og-evo-en.png?v=3",
        width: 1200,
        height: 630,
        alt: "EVO — AI Fitness Coach | Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-evo-en.png?v=3"],
  },
  alternates: {
    canonical: "https://alkemos.com/evo",
    // SEO-GEO-6.4 (P1-9): full hreflang pair now that /ar/evo exists.
    languages: {
      en: "https://alkemos.com/evo",
      ar: "https://alkemos.com/ar/evo",
      "x-default": "https://alkemos.com/evo",
    },
  },
};

// Inject EVO SoftwareApplication structured data
// §12.53 item 3: locale-aware schema — the EN page reads an English
// entity description (was Arabic-only before the audit fix).
const evoSchema = getEVOApplicationSchema("en");

// PRIORITY-PAGES Implementation 2 (2026-10-19, audit §B-1): the page now
// renders a visible FAQ from src/lib/evo-faq.ts — the same single-source
// array is emitted here as FAQPage JSON-LD (the coaching-faq.ts precedent,
// audit P1-2): Google retired FAQ rich results (May 2026) but AI answer
// engines parse JSON-LD from the server HTML (GEO citation value).
const evoFaqSchema = getFAQSchema(EVO_FAQ.en);

export default function EvoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(evoSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(evoFaqSchema) }}
      />
      {children}
    </>
  );
}
