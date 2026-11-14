import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * /ai-meal-planner layout — §12.28 (owner directive «اين صفحة تخطيط
 * الوجبات بالذكاء الاصطناعي؟ مطلوب إنشاؤها» — generation for
 * subscribers since the 2026-11-14 AI-QUOTAS order, no conflict with
 * subscriptions). EN side of the full hreflang pair with
 * /ar/ai-meal-planner.
 */
export const metadata: Metadata = {
  title: "AI Meal Planner — Day Plan Generator | Alkemos",
  // PHASE 189 (SEO-GEO-10, deep-audit P1-3): was 189 chars — trimmed to
  // the 158 EN budget, same funnel message, sentence ends cleanly.
  description:
    "Generate a daily meal plan in grams and calories with AI: pick your calorie target, diet system, and preferences, get a validated plan — for subscribers.",
  keywords: [
    "ai meal planner",
    "ai meal plan generator",
    "meal plan generator",
    "personalized meal plan",
    "مخطط وجبات بالذكاء الاصطناعي",
  ],
  alternates: {
    canonical: "https://alkemos.com/ai-meal-planner",
    languages: {
      en: "https://alkemos.com/ai-meal-planner",
      ar: "https://alkemos.com/ar/ai-meal-planner",
      "x-default": "https://alkemos.com/ai-meal-planner",
    },
  },
  openGraph: {
    title: "AI Meal Planner | Alkemos",
    description:
      "Generate a complete day plan in grams and calories — AI generation for subscribers (Premium and above).",
    type: "website",
    url: "https://alkemos.com/ai-meal-planner",
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

export default function AiMealPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToolSchemaScripts tool="ai-meal-planner" lang="en" />
      {children}
    </>
  );
}
