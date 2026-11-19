import type { Metadata } from "next";
import { Resources } from "@/components/hub-head-resources";
import { jsonLd } from "@/lib/seo";
// ORGANIC-GROWTH-P0-F (owner order 2026-11-19, roadmap 10/P0-F): the hub's
// parent ItemList schema — built from the SAME TOOLS array the grid renders
// (tools-shared.ts), serialized through the existing getItemListSchema
// helper (the workout-tracker/macro-tracker layout precedent).
import { getToolsHubItemList } from "@/lib/tools-hub-itemlist";

/**
 * M30 fix: English-first metadata for /tools.
 */
export const metadata: Metadata = {
  title: "Free Fitness Tools — Calculators, Planner & AI | Alkemos",
  description:
    // CONTENT-AUDIT P1-7 (audit §2.1): 182 chars — the tool list survives
    // intact inside the ~160 budget.
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 168 → 138 chars — the
    // ≤160 SERP-truncation law now holds (8-tool proof kept).
    "8 free fitness and nutrition tools: calorie, BMI, macro, and body-fat calculators, a water tracker, a meal planner, and two AI generators.",
  keywords: [
    "free fitness tools",
    "fitness calculators",
    "calorie calculator",
    "BMI calculator",
    "macro calculator",
    "body fat calculator",
    "water tracker",
  ],
  alternates: {
    canonical: "https://alkemos.com/tools",
    // SEO-GEO-4 (2026-09-08): reciprocal pair with the new AR tools hub.
    languages: {
      en: "https://alkemos.com/tools",
      ar: "https://alkemos.com/ar/tools",
      "x-default": "https://alkemos.com/tools",
    },
  },
  openGraph: {
    title: "Free Fitness Tools | Alkemos",
    description: "8 free tools: calculators, water tracker, and the manual meal planner — AI plan generation for subscribers.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/tools",
    // PHASE 187 (deep-audit P0-2): og:image — static branded family card
    // (design mirrors /api/og-image; see scripts/generate-og-cards.py).
    // ORGANIC-GROWTH-P0-F (2026-11-19): the hub's DEDICATED card
    // (og-tools-en) replaces the homepage fallback card.
    images: [
      {
        url: "/images/og/og-tools-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos Free Fitness Calculators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-tools-en.png?v=4"],
  },
};

const toolsItemListSchema = getToolsHubItemList("en");

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Resources banner="tools">
      {/* ORGANIC-GROWTH-P0-F: the parent ItemList — 8 ListItems (one per
          hub tool), machine-readable for rich results & AI answer engines. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(toolsItemListSchema) }}
      />
      {children}
    </Resources>
  );
}
