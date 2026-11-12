import type { Metadata } from "next";
import { FoodsExplorer } from "@/components/foods/FoodsExplorer";
import { parseFoodsQuery } from "@/components/foods/url";

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /foods — SERVER-RENDERED (same 2026-09-05 audit).
 *
 * Passes `lang="ar"` to force Arabic rendering regardless of the
 * browser's stored language preference. Wrapped by
 * `src/app/ar/layout.tsx`'s `<div dir="rtl" lang="ar">` for proper RTL,
 * and by `src/middleware.ts`'s `Content-Language: ar-EG` header for
 * crawler language attribution.
 */
export const metadata: Metadata = {
  // NOTE: the /ar layout template appends «— Alkemos» automatically — a
  // static «| Alkemos» here would double-brand the SERP title.
  title: "مكتبة الأطعمة — السعرات والماكروز لكل 100 جرام",
  description:
    "مكتبة أطعمة تضم 8,162+ صنفًا غذائيًا بالسعرات والماكروز لكل 100 جرام — ابحث، صفِّ النتائج، واحسب الكميات التي تحتاجها بالجرام.",
  alternates: {
    canonical: "/ar/foods",
    languages: {
      en: `${SITE_URL}/foods`,
      ar: `${SITE_URL}/ar/foods`,
      "x-default": `${SITE_URL}/foods`,
    },
  },
  // SEO/GEO audit (2026-09-28): the EN twin pins its own OG block, but
  // this page had none — Next.js field-level inheritance served the AR
  // ROOT HOMEPAGE og:title/og:description/og:image on /ar/foods. Pins the
  // AR foods card (og-foods-ar.png) — the mirror of the EN block.
  openGraph: {
    title: "مكتبة الأطعمة | Alkemos",
    description:
      "8,162+ صنفًا غذائيًا بالسعرات والماكروز لكل 100 جرام — ابحث، صفِّ النتائج، واحسب بالجرام.",
    type: "website",
    locale: "ar_EG",
    url: `${SITE_URL}/ar/foods`,
    siteName: "Alkemos",
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "مكتبة أطعمة Alkemos",
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
  return <FoodsExplorer lang="ar" query={parseFoodsQuery(sp)} />;
}
