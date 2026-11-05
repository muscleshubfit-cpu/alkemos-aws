import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * SEO-GEO-4 (2026-09-08): AR metadata for /ar/tools/body-fat-calculator.
 * Title carries NO brand suffix — the /ar layout template appends exactly
 * one "— Alkemos".
 */
export const metadata: Metadata = {
  title: "حاسبة نسبة الدهون في الجسم — طريقة البحرية الأمريكية",
  description:
    "احسب نسبة الدهون في جسمك مجانًا بطريقة البحرية الأمريكية (U.S. Navy) المعتمدة بناءً على محيط الخصر والرقبة والورك — نتيجة فورية مع تصنيف النسبة وتفسيرها.",
  keywords: [
    "حاسبة نسبة الدهون",
    "حساب نسبة الدهون في الجسم",
    "حاسبة الدهون بطريقة البحرية",
    "نسبة الدهون الطبيعية",
    "حاسبة دهون الجسم",
  ],
  alternates: {
    canonical: "https://alkemos.com/ar/tools/body-fat-calculator",
    languages: {
      en: "https://alkemos.com/tools/body-fat-calculator",
      ar: "https://alkemos.com/ar/tools/body-fat-calculator",
      "x-default": "https://alkemos.com/tools/body-fat-calculator",
    },
  },
  openGraph: {
    title: "حاسبة نسبة الدهون في الجسم",
    description: "احسب نسبة دهونك مجانًا بطريقة البحرية الأمريكية (U.S. Navy) مع تصنيف النتيجة.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/tools/body-fat-calculator",
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
    title: "حاسبة نسبة الدهون في الجسم",
    description: "احسب نسبة دهونك مجانًا بطريقة البحرية الأمريكية (U.S. Navy) مع تصنيف النتيجة.",
  },
};

export default function ArBodyFatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="body-fat-calculator" lang="ar" />
      {children}
    </>
  );
}
