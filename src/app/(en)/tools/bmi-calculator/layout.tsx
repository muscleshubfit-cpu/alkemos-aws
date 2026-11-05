import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

export const metadata: Metadata = {
  title: "BMI Calculator — Calculate Your Ideal Weight | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 176 → 133 chars — the
    // ≤160 SERP-truncation law now holds (interpretation kept as CTA).
    "Calculate your Body Mass Index (BMI) free: find out if your weight is ideal, overweight, or underweight — with result interpretation.",
  keywords: [
    "BMI calculator",
    "Body Mass Index",
    "ideal weight calculator",
    "BMI calculation",
    "weight calculator",
    "healthy weight",
  ],
  alternates: {
    canonical: "https://alkemos.com/tools/bmi-calculator",
    // SEO-GEO-4 (2026-09-08): reciprocal pair with the new AR mirror.
    languages: {
      en: "https://alkemos.com/tools/bmi-calculator",
      ar: "https://alkemos.com/ar/tools/bmi-calculator",
      "x-default": "https://alkemos.com/tools/bmi-calculator",
    },
  },
  openGraph: {
    title: "BMI Calculator | Alkemos",
    description: "Calculate your Body Mass Index (BMI) for free and find your ideal weight.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/tools/bmi-calculator",
    // PHASE 187 (deep-audit P0-2): og:image — static branded family
    // card (design mirrors /api/og-image; see scripts/generate-og-cards.py).
    images: [
      {
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos Free Fitness Calculators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

export default function BMILayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="bmi-calculator" lang="en" />
      {children}
    </>
  );
}
