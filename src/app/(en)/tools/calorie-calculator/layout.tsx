import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * M30 fix: English-first metadata for /tools/calorie-calculator.
 */
export const metadata: Metadata = {
  title: "Calorie Calculator — Calculate Your Daily Needs | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 192 → 139 chars — the
    // ≤160 SERP-truncation law now holds (equation + free CTA kept).
    "Calculate your daily calories and macros from weight, height, age, and activity level — the Mifflin-St Jeor equation. Free, no credit card.",
  keywords: [
    "calorie calculator",
    "TDEE calculator",
    "BMR calculator",
    "macro calculator",
    "daily calorie needs",
    "Mifflin-St Jeor",
  ],
  alternates: {
    canonical: "https://alkemos.com/tools/calorie-calculator",
    // SEO-GEO-4 (2026-09-08): reciprocal pair with the new AR mirror.
    languages: {
      en: "https://alkemos.com/tools/calorie-calculator",
      ar: "https://alkemos.com/ar/tools/calorie-calculator",
      "x-default": "https://alkemos.com/tools/calorie-calculator",
    },
  },
  openGraph: {
    title: "Calorie Calculator | Alkemos",
    description: "Calculate your daily calorie needs and macros for free.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/tools/calorie-calculator",
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
    title: "Calorie Calculator | Alkemos",
    description: "Calculate your daily calorie needs and macros for free.",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="calorie-calculator" lang="en" />
      {children}
    </>
  );
}
