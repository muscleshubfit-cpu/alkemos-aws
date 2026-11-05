import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * SEO-GEO-4 (2026-09-08): AR metadata for /ar/tools/macro-calculator.
 * Title carries NO brand suffix — the /ar layout template appends exactly
 * one "— Alkemos".
 */
export const metadata: Metadata = {
  title: "حاسبة الماكروز — وزّع بروتينك وكربوهيدراتك ودهونك",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 168 → 142 chars — the
    // ≤160 SERP-truncation law now holds (five splits + free CTA kept).
    "احسب الماكروز (بروتين وكربوهيدرات ودهون) من سعراتك المستهدفة: خمسة توزيعات جاهزة من المتوازن إلى الكيتو بالغرامات — مجانًا دون بطاقة ائتمانية.",
  keywords: [
    "حاسبة الماكروز",
    "حاسبة البروتين والكربوهيدرات والدهون",
    "حساب الماكروز للتضخيم",
    "ماكروز التنشيف",
    "حاسبة البروتين اليومية",
    "توزيع السعرات",
  ],
  alternates: {
    canonical: "https://alkemos.com/ar/tools/macro-calculator",
    languages: {
      en: "https://alkemos.com/tools/macro-calculator",
      ar: "https://alkemos.com/ar/tools/macro-calculator",
      "x-default": "https://alkemos.com/tools/macro-calculator",
    },
  },
  openGraph: {
    title: "حاسبة الماكروز",
    description: "وزّع سعراتك على بروتين وكربوهيدرات ودهون حسب هدفك — مجانًا وفورًا.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/tools/macro-calculator",
    // PHASE 187 (deep-audit P0-2): og:image — static branded family
    // card (design mirrors /api/og-image; see scripts/generate-og-cards.py).
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "حاسبات اللياقة المجانية من Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
    title: "حاسبة الماكروز",
    description: "وزّع سعراتك على بروتين وكربوهيدرات ودهون حسب هدفك — مجانًا وفورًا.",
  },
};

export default function ArMacroLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="macro-calculator" lang="ar" />
      {children}
    </>
  );
}
