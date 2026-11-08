import type { Metadata } from "next";

/**
 * M30 fix: this layout applies to BOTH /exercises and /exercises/[slug].
 * The root URL is English-first, so metadata should be English.
 * Arabic mirrors (/ar/exercises) have their own layout with Arabic metadata.
 */
export const metadata: Metadata = {
  title: "Exercise Library | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 162 → 132 chars — the
    // ≤160 SERP-truncation law now holds (868+ proof + muscle list kept).
    "Browse 868+ exercises with full instructions, target muscles, and difficulty — chest, back, shoulders, legs, arms, core, and cardio.",
  keywords: [
    "exercise library",
    "fitness exercises",
    "workout exercises",
    "gym exercises",
    "chest exercises",
    "back exercises",
    "leg exercises",
  ],
  alternates: {
    canonical: "https://alkemos.com/exercises",
    // Homepage AR mirror follow-up (2026-08-30): declare the Arabic mirror
    // (src/app/ar/exercises/page.tsx declares the reciprocal pair).
    languages: {
      en: "https://alkemos.com/exercises",
      ar: "https://alkemos.com/ar/exercises",
      "x-default": "https://alkemos.com/exercises",
    },
  },
  openGraph: {
    title: "Exercise Library | Alkemos",
    description: "Browse 868+ exercises with full instructions and difficulty levels.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/exercises",
    // §12.53 item 4 (2026-09-15): the EN list surface shared NO social
    // card — a child openGraph block REPLACES the root one in Next.js
    // metadata merging, so the root images never applied. Same family
    // card the exercise DETAIL pages already use (Phase 187 pattern).
    images: [
      {
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos Exercise Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

import { Resources } from "@/components/hub-head-resources";

export default function ExercisesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // PERFORMANCE-AUDIT-2026-11-08 P0-3 (owner order 2026-11-08): the
  // https://wger.de preconnect is REMOVED — a dead-origin TLS handshake
  // on every exercises page (measured on the audit: 1,736 detail pages ×
  // 2 languages). No wger asset has been served since the Batch-2
  // self-hosting (2026-09-16 removed the remote pattern from
  // next.config.ts); hosts=[] keeps the banner preload only.
  return (
    <Resources hosts={[]} banner="exercises">
      {children}
    </Resources>
  );
}
