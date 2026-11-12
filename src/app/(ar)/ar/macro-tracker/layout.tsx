import type { Metadata } from "next";
import { getFAQSchema, getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";
import { MACRO_TRACKER_FAQ_AR } from "@/app/(en)/macro-tracker/content";

/**
 * AR MIRROR of /macro-tracker — SEO layout.
 *
 * Arabic-FIRST metadata for the "متتبع ماكروز" search intent (P0 SEO
 * audit 2026-09-30, finding #1). The hreflang pair is declared on BOTH
 * sides (en→/macro-tracker, ar→/ar/macro-tracker,
 * x-default→/macro-tracker) — the for-coaches twin-pair pattern.
 *
 * JSON-LD: FAQPage (AR questions — non-Google semantic value per site
 * convention) + BreadcrumbList + ItemList (AR workflow surfaces).
 *
 * Title law: no trailing brand — the /ar layout template appends exactly
 * one "— Alkemos" (anti-double-brand canary, same class as /ar/evo).
 */

const SITE_URL = "https://alkemos.com";

export const metadata: Metadata = {
  title: "متتبّع الماكروز — أهداف واضحة ومجاميع حيّة مجانًا",
  description:
    // ~160-char budget, real capabilities only (no food-diary claims).
    "حاسبة ماكروز مجانية، مخطط وجبات بمجاميع حيّة من 8,162+ صنفًا غذائيًا، خطط وجبات بالذكاء الاصطناعي (توليدان مجانًا شهريًا)، وتتبّع وزن — في منصة واحدة.",
  keywords: [
    "متتبع ماكروز",
    "حاسبة الماكروز",
    "حساب البروتين",
    "تتبع الكارب",
    "مخطط وجبات",
    "حاسبة سعرات",
    "ماكروز يومي",
    "تغذية رياضية",
  ],
  alternates: {
    canonical: `${SITE_URL}/ar/macro-tracker`,
    languages: {
      en: `${SITE_URL}/macro-tracker`,
      ar: `${SITE_URL}/ar/macro-tracker`,
      "x-default": `${SITE_URL}/macro-tracker`,
    },
  },
  openGraph: {
    title: "متتبّع الماكروز — أهداف واضحة ومجاميع حيّة مجانًا",
    description:
      "اضبط أهداف ماكروزك، ابنِ وجباتك من 8,162+ صنفًا غذائيًا بمجاميع حيّة، وولّد خطط وجبات بالذكاء الاصطناعي — وابدأ مجانًا.",
    url: `${SITE_URL}/ar/macro-tracker`,
    siteName: "Alkemos",
    locale: "ar_EG",
    type: "website",
    // Dedicated AR family card (SOCIAL-OG-3 dedicated-card law).
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "متتبّع الماكروز — Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "متتبّع الماكروز — أهداف واضحة ومجاميع حيّة مجانًا",
    description:
      "أهداف ماكروز، مجاميع حيّة من 8,162+ صنفًا غذائيًا، خطط وجبات بالذكاء الاصطناعي، وتتبّع وزن — ابدأ مجانًا.",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

const faqSchema = getFAQSchema(MACRO_TRACKER_FAQ_AR);
const breadcrumbSchema = getBreadcrumbSchema([
  { name: "الرئيسية", url: `${SITE_URL}/ar` },
  { name: "متتبّع الماكروز", url: `${SITE_URL}/ar/macro-tracker` },
]);
const itemListSchema = getItemListSchema({
  name: "مسار تخطيط الماكروز على Alkemos",
  description:
    "أسطح Alkemos خلف مسار تتبّع الماكروز: حاسبة الماكروز، مخطط الوجبات بالمجاميع الحيّة، مخطط الوجبات بالذكاء الاصطناعي، وقاعدة الأطعمة.",
  items: [
    { name: "حاسبة الماكروز", url: "/ar/tools/macro-calculator" },
    { name: "مخطط الوجبات", url: "/ar/meal-planner" },
    { name: "مخطط الوجبات بالذكاء الاصطناعي", url: "/ar/ai-meal-planner" },
    { name: "قاعدة الأطعمة", url: "/ar/foods" },
    { name: "متتبّع التمارين", url: "/ar/workout-tracker" },
    { name: "الأدوات المجانية", url: "/ar/tools" },
  ],
});

export default function ArabicMacroTrackerLayout({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />
      {children}
    </>
  );
}
