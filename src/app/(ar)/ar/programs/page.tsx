import type { Metadata } from "next";
import ProgramsPage from "@/app/(en)/programs/page";

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /programs (workout training programs).
 *
 * Passes `lang="ar"` to force Arabic rendering regardless of the user's
 * localStorage preference — same established pattern as /ar/exercises
 * (→ <ExercisesPage lang="ar" />) and /ar/blog (→ <BlogListPage lang="ar" />).
 *
 * Rendered inside src/app/ar/layout.tsx's <div dir="rtl" lang="ar"> and
 * tagged Content-Language: ar-EG by the middleware for crawlers.
 */
export const metadata: Metadata = {
  title: "برامج التدريب",
  description:
    "برامج تدريب جاهزة لكل المستويات والأهداف — برامج منزلية بدون معدات، برامج دمبل، وبرامج كاملة للنادي الرياضي بالجدول الأسبوعي وشرح كل تمرين على Alkemos.",
  alternates: {
    canonical: "/ar/programs",
    languages: {
      en: `${SITE_URL}/programs`,
      ar: `${SITE_URL}/ar/programs`,
      "x-default": `${SITE_URL}/programs`,
    },
  },
  // SEO/GEO audit (2026-09-28): the EN twin pins an explicit OG block
  // ((en)/programs/layout.tsx — same-family home card), but this page had
  // none — Next.js field-level inheritance served the AR ROOT HOMEPAGE
  // og:title/og:description on /ar/programs. Pins the AR home card — the
  // mirror of the EN block.
  openGraph: {
    title: "برامج التدريب | Alkemos",
    description:
      "برامج تدريب جاهزة لكل المستويات والأهداف — منزلية، دمبل، ونادي رياضي.",
    type: "website",
    locale: "ar_EG",
    url: `${SITE_URL}/ar/programs`,
    siteName: "Alkemos",
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — منصة اللياقة والتغذية الذكية المتكاملة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

export default function Page() {
  return <ProgramsPage lang="ar" />;
}
