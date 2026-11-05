import type { Metadata } from "next";
import { ExercisesExplorer } from "@/components/exercises/ExercisesExplorer";
import { parseExercisesQuery } from "@/components/exercises/url";

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /exercises.
 *
 * Passes `lang="ar"` to force Arabic rendering, regardless of the user's
 * localStorage language preference. This matches the established pattern
 * used by `/ar/blog/page.tsx` → `<BlogListPage lang="ar" />`.
 *
 * The page is wrapped by `src/app/ar/layout.tsx`'s `<div dir="rtl" lang="ar">`
 * for proper RTL rendering, and by `src/middleware.ts`'s `Content-Language:
 * ar-EG` header for crawler language attribution.
 *
 * Homepage AR mirror follow-up (2026-08-30): own title + canonical +
 * hreflang so Google indexes THIS url (the ar/layout alternates block was
 * removed — it leaked the homepage signals onto every /ar/* child).
 */
export const metadata: Metadata = {
  title: "مكتبة التمارين",
  description:
    "مكتبة 868+ تمرين بالصور والشرح ثنائي اللغة ومستويات الصعوبة — عضلات، أجهزة، وتمارين منزلية على Alkemos.",
  alternates: {
    canonical: "/ar/exercises",
    languages: {
      en: `${SITE_URL}/exercises`,
      ar: `${SITE_URL}/ar/exercises`,
      "x-default": `${SITE_URL}/exercises`,
    },
  },
  // SEO/GEO audit (2026-09-28): the EN twin pins its own OG block
  // ((en)/exercises/layout.tsx), but this page had none — Next.js
  // field-level inheritance served the AR ROOT HOMEPAGE og:title/
  // og:description/og:image on /ar/exercises. Same replace-not-inherit
  // gap documented on the memberships/coaching layouts. Pins the AR
  // exercises card (og-exercises-ar.png) — the mirror of the EN block.
  openGraph: {
    title: "مكتبة التمارين | Alkemos",
    description:
      "مكتبة 868+ تمرين بالصور والشرح ومستويات الصعوبة — عضلات، أجهزة، وتمارين منزلية.",
    type: "website",
    locale: "ar_EG",
    url: `${SITE_URL}/ar/exercises`,
    siteName: "Alkemos",
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "مكتبة تمارين Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  return <ExercisesExplorer lang="ar" query={parseExercisesQuery(sp)} />;
}
