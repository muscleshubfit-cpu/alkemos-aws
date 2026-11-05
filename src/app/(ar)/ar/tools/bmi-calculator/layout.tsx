import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * SEO-GEO-4 (2026-09-08): AR metadata for /ar/tools/bmi-calculator.
 * Title carries NO brand suffix — the /ar layout template appends exactly
 * one "— Alkemos".
 */
export const metadata: Metadata = {
  title: "حاسبة مؤشر كتلة الجسم BMI — اعرف وزنك المثالي",
  description:
    "احسب مؤشر كتلة الجسم (BMI) مجانًا واعرف إن كان وزنك مثاليًا أم زائدًا أم ناقصًا، مع تفسير النتيجة ونطاقات WHO — حاسبة دقيقة وسهلة بالعربية.",
  keywords: [
    "حاسبة مؤشر كتلة الجسم",
    "حاسبة كتلة الجسم",
    "حاسبة BMI",
    "حساب مؤشر كتلة الجسم",
    "الوزن المثالي",
    "حاسبة الوزن المثالي",
    "نطاقات BMI",
  ],
  alternates: {
    canonical: "https://alkemos.com/ar/tools/bmi-calculator",
    languages: {
      en: "https://alkemos.com/tools/bmi-calculator",
      ar: "https://alkemos.com/ar/tools/bmi-calculator",
      "x-default": "https://alkemos.com/tools/bmi-calculator",
    },
  },
  openGraph: {
    title: "حاسبة مؤشر كتلة الجسم",
    description: "اعرف إن كان وزنك مثاليًا أم زائدًا — حاسبة BMI مجانية بتفسير النتيجة.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/tools/bmi-calculator",
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
    title: "حاسبة مؤشر كتلة الجسم",
    description: "اعرف إن كان وزنك مثاليًا أم زائدًا — حاسبة BMI مجانية بتفسير النتيجة.",
  },
};

export default function ArBmiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="bmi-calculator" lang="ar" />
      {children}
    </>
  );
}
