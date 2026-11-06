import type { Metadata } from "next";
import { getFAQSchema, getBreadcrumbSchema, jsonLd } from "@/lib/seo";
import { COACH_FAQ_AR } from "@/app/(en)/for-coaches/content";

/**
 * AR MIRROR of /for-coaches — SEO layout.
 *
 * Arabic-FIRST metadata: the recruitment audience is Egyptian coaches.
 * The hreflang pair is declared on BOTH sides (en→/for-coaches,
 * ar→/ar/for-coaches, x-default→/for-coaches) — no self-references,
 * the /ar/about & /ar/faq pattern (Phase 44).
 *
 * JSON-LD: FAQPage (AR questions) + BreadcrumbList — semantic value
 * for non-Google answer engines per site convention.
 */

const SITE_URL = "https://alkemos.com";

export const metadata: Metadata = {
  title: "انضم كمدرب في Alkemos — درِّب عملاءك بأسعارك وأموالك بين يديك",
  description:
    // CONTENT-AUDIT P1-7 (audit §2.1): 205 chars — trimmed inside the ~160 budget.
"سجّل كمدرب أو أخصائي تغذية على Alkemos مجانًا: أدر عملاءك أنت، خطط بالذكاء الاصطناعي، سعرك وتحصيلك المباشر — بدون أي نسبة. تفعيل فوري.",
  keywords: [
    "انضم كمدرب",
    "تسجيل مدرب",
    "العمل كمدرب أونلاين",
    "التدريب الأونلاين",
    "منصة مدربين",
    "إدارة عملاء المدرب",
    "خطط تغذية بالذكاء الاصطناعي",
    "برامج تمارين للعملاء",
    "مدرب نادي رياضي",
    "أخصائي تغذية اونلاين",
    "متابعة عملاء التدريب",
  ],
  alternates: {
    canonical: `${SITE_URL}/ar/for-coaches`,
    languages: {
      en: `${SITE_URL}/for-coaches`,
      ar: `${SITE_URL}/ar/for-coaches`,
      "x-default": `${SITE_URL}/for-coaches`,
    },
  },
  openGraph: {
    title: "انضم كمدرب في Alkemos — درِّب عملاءك بأسعارك وأموالك بين يديك",
    description:
      "منصة كاملة للمدربين: إدارة عملائك، خطط بالذكاء الاصطناعي، أسعارك تختارها أنت وتحصّلها بنفسك — بدون أي نسبة من دخلك. سجّل مجانًا بتفعيل فوري.",
    url: `${SITE_URL}/ar/for-coaches`,
    siteName: "Alkemos",
    locale: "ar_EG",
    type: "website",
    // Phase 231 (owner order C5): the vertical coach-portrait photo is
    // replaced as the share card by the DEDICATED AR horizontal
    // 1200×630 branded card (same generator as every other family card).
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "انضم كمدرب في Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "انضم كمدرب في Alkemos — عملاؤك بأسعارك وأموالك بين يديك",
    description:
      "إدارة عملاء، وخطط بالذكاء الاصطناعي، وأسعار تختارها أنت وتحصّلها بنفسك — بدون نسبة. سجّل مجانًا.",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

const faqSchema = getFAQSchema(COACH_FAQ_AR);
const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Alkemos", url: SITE_URL },
  { name: "انضم كمدرب", url: `${SITE_URL}/ar/for-coaches` },
]);

export default function ArForCoachesLayout({
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
