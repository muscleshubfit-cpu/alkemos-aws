import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * /ai-workout-planner layout — §12.32 (owner directive «ضيف أداة جديده
 * مخطط التمارين بالذكاء الاصطناعي»). EN side of the full hreflang pair
 * with /ar/ai-workout-planner.
 */
export const metadata: Metadata = {
  title: "AI Workout Planner — Free Weekly Split Generator | Alkemos",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 169 → 138 chars — the
    // ≤160 SERP-truncation law now holds (free-trial CTA kept).
    "Generate a balanced weekly workout split with AI: pick goal, level, days, and equipment, and get a validated split in seconds. Free trial.",
  keywords: [
    "ai workout planner",
    "ai workout generator",
    "workout split generator",
    "free ai workout plan",
    "weekly workout program",
    "مخطط التمارين بالذكاء الاصطناعي",
  ],
  alternates: {
    canonical: "https://alkemos.com/ai-workout-planner",
    languages: {
      en: "https://alkemos.com/ai-workout-planner",
      ar: "https://alkemos.com/ar/ai-workout-planner",
      "x-default": "https://alkemos.com/ai-workout-planner",
    },
  },
  openGraph: {
    title: "AI Workout Planner | Alkemos",
    description:
      "Generate a balanced weekly split in seconds — free trial.",
    type: "website",
    url: "https://alkemos.com/ai-workout-planner",
    // P3-10 (Phase 217, deep-audit م9): og:locale symmetry — the AR twin
    // declares ar_EG; this EN block replaces the root's, so it must
    // state its own locale.
    locale: "en_US",
    // Phase 216 (P2-1 — deep-audit confirmed-7): a child openGraph block
    // replaces the root one in Next.js merging, so this surface served NO
    // og:image — the tools family card is pinned explicitly.
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

export default function AiWorkoutPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToolSchemaScripts tool="ai-workout-planner" lang="en" />
      {children}
    </>
  );
}
