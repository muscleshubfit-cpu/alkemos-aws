import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

export const metadata: Metadata = {
  title: "Macro Calculator — Protein, Carbs & Fat in Grams | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 175 → 137 chars — the
    // ≤160 SERP-truncation law now holds (five splits + free CTA kept).
    "Calculate your daily macros from your calorie target: five preset splits from balanced to keto, with grams per day. Free, no credit card.",
  keywords: [
    "macro calculator",
    "macros calculator",
    "protein calculator",
    "carb calculator",
    "fat calculator",
    "daily macros",
  ],
  alternates: {
    canonical: "https://alkemos.com/tools/macro-calculator",
    // SEO-GEO-4 (2026-09-08): reciprocal pair with the new AR mirror.
    languages: {
      en: "https://alkemos.com/tools/macro-calculator",
      ar: "https://alkemos.com/ar/tools/macro-calculator",
      "x-default": "https://alkemos.com/tools/macro-calculator",
    },
  },
  openGraph: {
    title: "Macro Calculator | Alkemos",
    description: "Calculate your daily protein, carbs, and fat needs for free.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/tools/macro-calculator",
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

export default function MacroLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="macro-calculator" lang="en" />
      {children}
    </>
  );
}
