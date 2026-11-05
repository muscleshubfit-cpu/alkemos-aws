import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * FULL-SITE AUDIT FIX (2026-08-30): /tools/water-tracker previously had
 * NO metadata at all — it inherited BOTH the title AND the canonical of
 * the /tools hub, literally telling Google "I am the tools index page"
 * (a deindexing risk for the tracker). The page is a client component,
 * so a server layout owns the metadata (same pattern as the other tool
 * pages, e.g. calorie-calculator/layout.tsx). No hreflang: no /ar
 * mirror exists for this page.
 */
export const metadata: Metadata = {
  title: "Water Tracker — Daily Hydration Goal & Log | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 181 → 132 chars — the
    // ≤160 SERP-truncation law now holds (35 ml × kg proof kept).
    "Track your daily water intake free: a smart hydration goal from your body weight (35 ml × kg), log every cup, and keep your history.",
  keywords: [
    "water tracker",
    "water intake calculator",
    "daily water goal",
    "hydration tracker",
    "how much water should I drink",
    "daily water intake",
  ],
  alternates: {
    canonical: "/tools/water-tracker",
    // SEO-GEO-4 (2026-09-08): reciprocal pair with the new AR mirror.
    languages: {
      en: "https://alkemos.com/tools/water-tracker",
      ar: "https://alkemos.com/ar/tools/water-tracker",
      "x-default": "https://alkemos.com/tools/water-tracker",
    },
  },
  openGraph: {
    title: "Water Tracker | Alkemos",
    description:
      "Smart daily hydration goal from your body weight, cup logging, and history — free water tracker.",
    type: "website",
    // §12.53 item 4 (2026-09-15): og:locale was missing (the only tool
    // surface without one — the AR mirror declares ar_EG).
    locale: "en_US",
    url: "https://alkemos.com/tools/water-tracker",
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

export default function WaterTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToolSchemaScripts tool="water-tracker" lang="en" />
      {children}
    </>
  );
}
