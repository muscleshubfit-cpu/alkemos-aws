import type { Metadata } from "next";
// ORGANIC-GROWTH-P0-E (2026-11-19, roadmap 10 field 4: «FAQPage (4-6
// أسئلة…) + BreadcrumbList»): the AR mirror emits its FAQPage JSON-LD
// from the SAME single source the page renders (src/lib/affiliate-faq.ts —
// the memberships-faq.ts AR precedent) + a BreadcrumbList with RELATIVE
// urls (getBreadcrumbSchema prefixes the site origin — the /ar/foods
// convention). The AR description is UNTOUCHED: it already carried the
// 20%/10$ pair (F-8 was EN-only deprivation — «النصان متطابقان رقميًا»
// now holds on both sides).
import { getFAQSchema, getBreadcrumbSchema, jsonLd } from "@/lib/seo";
import { AFFILIATE_FAQ } from "@/lib/affiliate-faq";

/**
 * AR MIRROR of /affiliate — SEO layout (§12.53 item 11, owner order
 * 2026-09-16: «أنشئ مرآة عربية كاملة لـ /affiliate على /ar/affiliate لأن
 * Alkemos يستهدف شركاء عربًا وغير عرب»).
 *
 * The page component is the shared bilingual one (re-exported by
 * ./page.tsx — useI18n is URL-first, so under /ar/* it renders its Arabic
 * content automatically); this layout gives the AR URL its own Arabic
 * title / description / keywords, og-home-ar card, and the full hreflang
 * pair — the /ar/for-coaches & /ar/evo pattern (Phase 44 / SEO-GEO-6.4).
 *
 * The EN layout (src/app/affiliate/layout.tsx) already declared
 * ar → /ar/affiliate in its hreflang since the H2 fix (2026-09-07); the
 * URL itself was the missing half of the pair (404 — the last
 * monolingual page on the site). EN is untouched in this batch.
 */
export const metadata: Metadata = {
  // BRANDLESS by law: the /ar/layout template appends exactly one
  // " — Alkemos" to depth-1 titles — including a brand here would render
  // a double-brand title (the same class of bug P0-3 fixed on blog).
  title: "برنامج الأفلييت (الشركاء) — حوّل تأثيرك إلى دخل",
  description:
    "انضم إلى برنامج الأفلييت من Alkemos: شارك منصة تثق بها واكسب 20% عمولة على كل عملية شراء مؤهلة عبر رابطك، مع حد أدنى للصرف 10 دولارات.",
  keywords: [
    "برنامج الأفلييت (الشركاء)",
    "أفلييت اللياقة",
    "أفلييت التغذية",
    "اكسب عمولة لياقة",
    "برنامج صناع التأثير الرياضي",
    "أفلييت المدرب الشخصي",
    "أفلييت مدوني اللياقة",
    "أفلييت التمارين الرياضية",
    "برنامج عمولة رياضي",
    "تسويق بالعمولة لياقة",
  ],
  openGraph: {
    title: "برنامج الأفلييت (الشركاء) — حوّل تأثيرك إلى دخل | Alkemos",
    description:
      "شارك Alkemos مع من يثقون بتوصياتك واكسب عمولة من عمليات الشراء المؤهلة عبر رابطك الخاص.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/affiliate",
    // Same AR-side gap the batch-1 live verification caught on evo/coaching/
    // diet-plan: this layout declares its own openGraph block, which
    // REPLACES the root one in Next.js metadata merging, so the og-home-ar
    // card from /ar/layout.tsx is NOT inherited — pinned explicitly
    // (batch 1-b pattern, §12.55).
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "برنامج الأفلييت (الشركاء) من Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "برنامج الأفلييت (الشركاء) — حوّل تأثيرك إلى دخل | Alkemos",
    description:
      "شارك Alkemos مع من يثقون بتوصياتك واكسب عمولة من عمليات الشراء المؤهلة عبر رابطك الخاص.",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
  alternates: {
    canonical: "https://alkemos.com/ar/affiliate",
    languages: {
      en: "https://alkemos.com/affiliate",
      ar: "https://alkemos.com/ar/affiliate",
      "x-default": "https://alkemos.com/affiliate",
    },
  },
};

const faqSchema = getFAQSchema(AFFILIATE_FAQ.ar);
const breadcrumbSchema = getBreadcrumbSchema([
  { name: "الرئيسية", url: "/ar" },
  { name: "برنامج الأفلييت (الشركاء)", url: "/ar/affiliate" },
]);

export default function ArAffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* ORGANIC-GROWTH-P0-E: FAQPage JSON-LD — GEO-only value (Google
          retired FAQ rich results May 2026; AI answer engines still parse
          JSON-LD from the server HTML — the repo's documented decision,
          same as the AR memberships mirror). */}
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
