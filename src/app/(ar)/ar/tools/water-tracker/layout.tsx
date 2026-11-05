import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * SEO-GEO-4 (2026-09-08): AR metadata for /ar/tools/water-tracker.
 * Title carries NO brand suffix — the /ar layout template appends exactly
 * one "— Alkemos".
 */
export const metadata: Metadata = {
  title: "متتبع شرب الماء — هدفك اليومي وسجل أكوابك",
  description:
    "احسب احتياجك اليومي من الماء مجانًا بناءً على وزنك (35 مل × الكجم)، وسجّل كل كوب، واحفظ سجلك، وابنِ عادة شرب الماء يوميًا — متتبع مجاني بالعربية.",
  keywords: [
    "حاسبة الماء",
    "حساب كمية الماء اليومية",
    "متتبع شرب الماء",
    "كم لتر ماء اشرب يوميا",
    "احتياج الجسم من الماء",
    "سجل شرب الماء",
  ],
  alternates: {
    canonical: "https://alkemos.com/ar/tools/water-tracker",
    languages: {
      en: "https://alkemos.com/tools/water-tracker",
      ar: "https://alkemos.com/ar/tools/water-tracker",
      "x-default": "https://alkemos.com/tools/water-tracker",
    },
  },
  openGraph: {
    title: "متتبع شرب الماء",
    description: "هدف ماء ذكي من وزنك + تسجيل الأكواب + سجل يومي — مجانًا.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/tools/water-tracker",
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
    title: "متتبع شرب الماء",
    description: "هدف ماء ذكي من وزنك + تسجيل الأكواب + سجل يومي — مجانًا.",
  },
};

export default function ArWaterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="water-tracker" lang="ar" />
      {children}
    </>
  );
}
