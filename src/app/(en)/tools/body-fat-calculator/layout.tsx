import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

export const metadata: Metadata = {
  title: "Body Fat Calculator — Calculate Your Body Fat % | Alkemos",
  description:
    "Calculate your body fat percentage using the U.S. Navy Method. Free calculator based on waist, neck, and hip circumference measurements.",
  keywords: [
    "body fat calculator",
    "body fat percentage",
    "Navy method body fat",
    "fat calculator",
    "body composition",
  ],
  alternates: {
    canonical: "https://alkemos.com/tools/body-fat-calculator",
    // SEO-GEO-4 (2026-09-08): reciprocal pair with the new AR mirror.
    languages: {
      en: "https://alkemos.com/tools/body-fat-calculator",
      ar: "https://alkemos.com/ar/tools/body-fat-calculator",
      "x-default": "https://alkemos.com/tools/body-fat-calculator",
    },
  },
  openGraph: {
    title: "Body Fat Calculator | Alkemos",
    description: "Calculate your body fat percentage for free using the Navy Method.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/tools/body-fat-calculator",
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

export default function BodyFatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="body-fat-calculator" lang="en" />
      {children}
    </>
  );
}
