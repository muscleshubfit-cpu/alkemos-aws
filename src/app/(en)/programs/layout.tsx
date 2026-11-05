import type { Metadata } from "next";
import { Resources } from "@/components/hub-head-resources";

/**
 * M30 fix: English-first metadata for /programs and /programs/[slug].
 * Arabic mirrors (/ar/programs) have their own layout with Arabic metadata.
 */
export const metadata: Metadata = {
  title: "Workout Programs | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 162 → 125 chars — the
    // ≤160 SERP-truncation law now holds (all three locations kept + CTA).
    "Ready-made workout programs for every level and goal: home workouts without equipment, dumbbell plans, and full gym programs.",
  keywords: [
    "workout programs",
    "training programs",
    "home workout",
    "gym program",
    "bodyweight workout",
    "dumbbell program",
    "fitness plan",
  ],
  alternates: {
    canonical: "https://alkemos.com/programs",
    // HREFLANG RECIPROCITY FIX (Phase 140 audit): /ar/programs declares
    // the full cluster (en/ar/x-default) but this EN side never
    // reciprocated. Same fix as /programs/[slug] in the same phase —
    // matches the pattern already live on /, /blog, /exercises, /foods,
    // /memberships, /faq, /about, /for-coaches.
    languages: {
      en: "https://alkemos.com/programs",
      ar: "https://alkemos.com/ar/programs",
      "x-default": "https://alkemos.com/programs",
    },
  },
  openGraph: {
    title: "Workout Programs | Alkemos",
    description: "Ready-made workout programs for all levels and goals.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/programs",
    // §12.53 item 4 (2026-09-15): og:image for the EN list surface —
    // same-family home card, matching the AR mirror's og-home-ar
    // inheritance (no programs-specific card exists; Phase 187 asset law).
    images: [
      {
        // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=4 (SOCIAL-OG-4).
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos — The Smart Fitness & Nutrition Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

export default function ProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Resources banner="programs">{children}</Resources>
  );
}
