import type { Metadata } from "next";
import { getFAQSchema, getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";
import { WORKOUT_TRACKER_FAQ_AR } from "@/app/(en)/workout-tracker/content";

/**
 * AR MIRROR of /workout-tracker — SEO layout.
 *
 * Arabic-FIRST metadata for the "متتبّع تمارين" search intent (P0 SEO
 * audit 2026-09-30, finding #1). The hreflang pair is declared on BOTH
 * sides (en→/workout-tracker, ar→/ar/workout-tracker,
 * x-default→/workout-tracker) — the for-coaches twin-pair pattern.
 *
 * JSON-LD: FAQPage (AR questions — non-Google semantic value per site
 * convention) + BreadcrumbList + ItemList (AR tracking surfaces).
 *
 * Title law: no trailing brand — the /ar layout template appends exactly
 * one "— Alkemos" (anti-double-brand canary, same class as /ar/evo).
 */

const SITE_URL = "https://alkemos.com";

export const metadata: Metadata = {
  title: "متتبّع التمارين — خطّط تدريبك وتابع تقدّمك مجانًا",
  description:
    // ~160-char budget, real capabilities only (no set/rep logging claims).
    "خطط تمارين بالذكاء الاصطناعي للمشتركين (حصص شهرية)، برامج جاهزة، 868+ تمرينًا مشروحًا — مع تتبّع الوزن والقياسات وصور التقدّم في لوحة مجانية واحدة.",
  keywords: [
    "متتبع تمارين",
    "تتبع التمارين",
    "برنامج تمارين",
    "تتبع الوزن",
    "قياسات الجسم",
    "تتبع التقدم الرياضي",
    "مخطط تمارين",
    "صور التقدم",
  ],
  alternates: {
    canonical: `${SITE_URL}/ar/workout-tracker`,
    languages: {
      en: `${SITE_URL}/workout-tracker`,
      ar: `${SITE_URL}/ar/workout-tracker`,
      "x-default": `${SITE_URL}/workout-tracker`,
    },
  },
  openGraph: {
    title: "متتبّع التمارين — خطّط تدريبك وتابع تقدّمك مجانًا",
    description:
      "ولّد خطط تمارين بالذكاء الاصطناعي، اتبع برامج جاهزة، وتابع وزنك وقياساتك وصور تقدّمك في لوحة مجانية واحدة بالعربية والإنجليزية.",
    url: `${SITE_URL}/ar/workout-tracker`,
    siteName: "Alkemos",
    locale: "ar_EG",
    type: "website",
    // Dedicated AR family card (SOCIAL-OG-3 dedicated-card law).
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "متتبّع التمارين — Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "متتبّع التمارين — خطّط تدريبك وتابع تقدّمك مجانًا",
    description:
      "خطط تمارين بالذكاء الاصطناعي، برامج جاهزة، ومكتبة تمارين مشروحة — مع تتبّع الوزن والقياسات وصور التقدّم في لوحة واحدة.",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

const faqSchema = getFAQSchema(WORKOUT_TRACKER_FAQ_AR);
const breadcrumbSchema = getBreadcrumbSchema([
  { name: "الرئيسية", url: `${SITE_URL}/ar` },
  { name: "متتبّع التمارين", url: `${SITE_URL}/ar/workout-tracker` },
]);
const itemListSchema = getItemListSchema({
  name: "تخطيط التمارين وتتبّع التقدّم على Alkemos",
  description:
    "أسطح Alkemos خلف مسار تتبّع التمارين: توليد الخطط بالذكاء الاصطناعي، البرامج الجاهزة، مكتبة التمارين، ولوحة تقدّم الأعضاء.",
  items: [
    { name: "مخطط التمارين بالذكاء الاصطناعي", url: "/ar/ai-workout-planner" },
    { name: "برامج التدريب", url: "/ar/programs" },
    { name: "مكتبة التمارين", url: "/ar/exercises" },
    { name: "متتبّع الماكروز", url: "/ar/macro-tracker" },
    { name: "مخطط الوجبات", url: "/ar/meal-planner" },
    { name: "الأدوات المجانية", url: "/ar/tools" },
  ],
});

export default function ArabicWorkoutTrackerLayout({
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
