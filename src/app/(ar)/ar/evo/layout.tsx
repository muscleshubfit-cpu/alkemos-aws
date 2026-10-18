import type { Metadata } from "next";
import { getEVOApplicationSchema, getFAQSchema, jsonLd } from "@/lib/seo";
import { EVO_FAQ } from "@/lib/evo-faq";

/**
 * SEO-GEO-6.4 (2026-09-12): AR metadata for /ar/evo — P1-9, the last
 * language-engineering gap (§12.19: "مرايا عربية لـ /evo و /coaching").
 *
 * The page component is the shared bilingual one (re-exported by
 * ../page.tsx); this layout gives the AR URL its own Arabic title /
 * description / keywords and full hreflang pair. The EVO
 * SoftwareApplication schema is injected here as on the EN layout —
 * its name/description are already Arabic-first (src/lib/seo.ts).
 */
export const metadata: Metadata = {
  // BRANDLESS by law: the /ar/layout template appends exactly one
  // " — Alkemos" to depth-1 titles — including a brand here would render
  // a double-brand title (the same class of bug P0-3 fixed on blog).
  title: "مدرب اللياقة الذكي EVO — خطط مخصصة بالذكاء الاصطناعي",
  description:
    // CONTENT-AUDIT P1-7 (audit §2.1): 226 chars — trimmed inside the ~160 budget.
"EVO محرك أداء ذكي من Alkemos — ليس مجرد روبوت محادثة: يقرأ بياناتك وهدفك، يبني خطط تغذية وتمارين مخصصة، ويقترح بدائل ذكية للوجبات والتمارين. مجاني للجميع.",
  keywords: [
    "مدرب ذكاء اصطناعي للياقة",
    "مدرب اللياقة الذكي",
    "EVO",
    "خطة تمارين بالذكاء الاصطناعي",
    "خطة تغذية مخصصة",
    "استشارات تغذية أونلاين",
    "مدرب AI رياضي",
  ],
  openGraph: {
    title: "مدرب اللياقة الذكي EVO | Alkemos",
    description:
      "محرك أداء ذكي يبني خطط تغذية وتمارين مخصصة من بياناتك — مجاني للجميع.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/evo",
    // Batch 1-b (2026-09-16, §12.53 item 4 follow-up): same AR-side gap
    // the batch-1 live verification caught — this layout declares
    // openGraph without images, and a child openGraph block REPLACES the
    // root one in Next.js metadata merging, so the og-home-ar card from
    // /ar/layout.tsx was NOT inherited. Pinned explicitly — Phase 231
    // (owner order C3): the card is now the DEDICATED AR EVO card
    // (og-evo-ar, 1200×630) instead of the homepage card.
    images: [
      {
        url: "/images/og/og-evo-ar.png?v=3",
        width: 1200,
        height: 630,
        alt: "مدرب اللياقة الذكي EVO | Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مدرب اللياقة الذكي EVO | Alkemos",
    description:
      "محرك أداء ذكي يبني خطط تغذية وتمارين مخصصة من بياناتك — مجاني للجميع.",
    images: ["/images/og/og-evo-ar.png?v=3"],
  },
  alternates: {
    canonical: "https://alkemos.com/ar/evo",
    languages: {
      en: "https://alkemos.com/evo",
      ar: "https://alkemos.com/ar/evo",
      "x-default": "https://alkemos.com/evo",
    },
  },
};

// Same EVO SoftwareApplication structured data pattern as the EN layout —
// §12.53 item 3: locale-aware, so the AR page keeps the Arabic
// name/description/featureList while EN serves English.
const evoSchema = getEVOApplicationSchema("ar");

// PRIORITY-PAGES Implementation 2 (2026-10-19, audit §B-1): the Arabic
// FAQ mirror of the EN layout's FAQPage JSON-LD — same single-source
// array (src/lib/evo-faq.ts), Arabic-first so this URL gets quoted for
// the Arabic questions (the coaching-faq.ts precedent, audit P1-2).
const evoFaqSchema = getFAQSchema(EVO_FAQ.ar);

export default function ArEvoLayout({
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
