import type { Metadata } from "next";
import { getCoachingServiceSchema, getFAQSchema, jsonLd } from "@/lib/seo";
import { COACHING_FAQ } from "@/lib/coaching-faq";

/**
 * SEO-GEO-6.4 (2026-09-12): AR metadata for /ar/coaching — P1-9, the
 * last language-engineering gap (§12.19).
 *
 * The page component is the shared bilingual one (re-exported by
 * ../page.tsx); this layout gives the AR URL its own Arabic title /
 * description / keywords and full hreflang pair. The Service schema is
 * injected here as on the EN layout — its name/description are already
 * Arabic-first (src/lib/seo.ts), with aggregateRating removed (P0-5).
 */
export const metadata: Metadata = {
  // BILINGUAL-CONTENT Phase 2 (owner-approved title, audit gap #3):
  // «التدريب الأونلاين مع مدرب متخصص | Alkemos» — ≈41 chars, inside the
  // ~60 budget (the old title measured 66). The owner wording carries
  // the brand, so it is pinned with `absolute` — the /ar layout template
  // would otherwise append a SECOND « — Alkemos» (the anti-double-brand
  // law, P0-3's class). The "|" separator mirrors the EN twin's pattern
  // ("Online Coaching with Real Coaches | Alkemos").
  title: {
    absolute: "التدريب الأونلاين مع مدرب متخصص | Alkemos",
  },
  description:
    "تدريب أونلاين مع مدربين وأخصائيي تغذية محترفين: خطط مخصصة، برامج متكيفة، متابعة أسبوعية، ومدربك الذكي EVO على مدار الساعة.",
  keywords: [
    "التدريب الأونلاين",
    "مدرب شخصي أونلاين",
    "أخصائي تغذية أونلاين",
    "خطة تغذية مخصصة",
    "برنامج تمارين مخصص",
    "متابعة تدريب أسبوعية",
    "مدرب لياقة معتمد",
  ],
  openGraph: {
    title: "التدريب الأونلاين | Alkemos",
    description:
      "خطط مخصصة من مدربين معتمدين + متابعة شخصية + مساعد ذكي على مدار الساعة.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/coaching",
    // BILINGUAL-CONTENT Phase 2 (audit gap #6 — live-verified missing):
    // a child openGraph block REPLACES the root one (Next.js merging), so
    // og:site_name was silently dropped on this surface. Pinned here like
    // the AR memberships mirror already does.
    siteName: "Alkemos",
    // Batch 1-b (2026-09-16, §12.53 item 4 follow-up): same AR-side gap
    // the batch-1 live verification caught — openGraph without images
    // replaces the root block in Next.js merging, so og-home-ar was NOT
    // inherited. Pinned explicitly — same pattern as the EN mirror.
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
    title: "التدريب الأونلاين | Alkemos",
    description:
      "خطط مخصصة من مدربين معتمدين + متابعة شخصية + مساعد ذكي على مدار الساعة.",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
  alternates: {
    canonical: "https://alkemos.com/ar/coaching",
    languages: {
      en: "https://alkemos.com/coaching",
      ar: "https://alkemos.com/ar/coaching",
      "x-default": "https://alkemos.com/coaching",
    },
  },
};

// Same Service structured data pattern as the EN layout — §12.53 item 3:
// locale-aware, so the AR page keeps the Arabic name/description while
// EN serves English; aggregateRating stays removed (P0-5 law).
const coachingSchema = getCoachingServiceSchema("ar");

// CONTENT-AUDIT P1-2 (2026-09-28, audit §1.4): see the EN layout — the AR
// FAQ answers are emitted as FAQPage JSON-LD from the same single-source
// array so non-JS crawlers read them in the served HTML.
const coachingFaqSchema = getFAQSchema(COACHING_FAQ.ar);

export default function ArCoachingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* P0-4 (PERFORMANCE-AUDIT-2026-11-08): same LCP preload as the EN
          layout — /ar/coaching renders the same bilingual page component,
          so its LCP is the same coaching-1 hero. */}
      <link
        rel="preload"
        as="image"
        href="/images/hero/coaching-1.webp"
        fetchPriority="high"
        imageSrcSet="/images/hero/coaching-1-640.webp 640w, /images/hero/coaching-1-828.webp 828w, /images/hero/coaching-1.webp 1200w"
        imageSizes="(max-width: 895px) calc(100vw - 32px), 864px"
      />
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
