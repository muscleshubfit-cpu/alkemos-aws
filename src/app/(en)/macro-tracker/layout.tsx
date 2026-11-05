import type { Metadata } from "next";
import { getFAQSchema, getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";
import { MACRO_TRACKER_FAQ_EN } from "./content";

/**
 * /macro-tracker — SEO layout (server component under a client page).
 *
 * P0 SEO audit (2026-09-30, finding #1): "macro tracker" / "macro
 * tracking app" queries had ZERO matching pages. This page targets that
 * intent with the REAL product surface (macro calculator → meal planner
 * live totals → AI meal plans → weight/measurement tracking).
 *
 * EN CANONICAL of the twin pair (the for-coaches pattern):
 *   EN canonical: /macro-tracker      ← this layout (EN-first metadata)
 *   AR mirror:    /ar/macro-tracker   (Arabic-first metadata)
 *   The pair (en/ar/x-default) is declared on BOTH sides.
 *
 * JSON-LD: FAQPage (kept for non-Google semantic value per the site
 * convention — Google retired FAQ rich results May 2026) + BreadcrumbList
 * + ItemList (the macro workflow surfaces).
 */

const SITE = "https://alkemos.com";
const PAGE_URL = `${SITE}/macro-tracker`;

export const metadata: Metadata = {
  title: "Macro Tracker — Set Targets, Build Meals, Track Totals | Alkemos",
  description:
    // ~160-char budget (CONTENT-AUDIT P1-7 law): real capabilities only —
    // targets, live totals, AI plans; no food-diary claims.
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 166 → 152 chars — proof
    // number (8,830+) and the 2-free AI plans kept inside ≤160.
    "Macro calculator targets, a meal planner with live totals from 8,830+ foods, AI meal plans (2 free/month), and weight tracking — one bilingual platform.",
  keywords: [
    "macro tracker",
    "macro tracking app",
    "macro calculator",
    "meal planner",
    "protein calculator",
    "carb tracking",
    "nutrition planner",
    "IIFYM tracker",
  ],
  alternates: {
    canonical: PAGE_URL,
    languages: {
      en: PAGE_URL,
      ar: `${SITE}/ar/macro-tracker`,
      "x-default": PAGE_URL,
    },
  },
  openGraph: {
    title: "Macro Tracker — Set Targets, Build Meals, Track Totals | Alkemos",
    description:
      "Set your macro targets, build meals from 8,830+ foods with live totals, generate AI meal plans, and track your weight — free to start.",
    url: PAGE_URL,
    siteName: "Alkemos",
    locale: "en_US",
    type: "website",
    // Dedicated family card (SOCIAL-OG-3 dedicated-card law) — generated
    // by scripts/generate-og-cards.py, guarded by og-image-coverage.test.ts.
    images: [
      {
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Macro Tracker — Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Macro Tracker — Set Targets, Build Meals, Track Totals | Alkemos",
    description:
      "Macro targets, live meal totals from 8,830+ foods, AI meal plans, and weight tracking — free to start.",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

const faqSchema = getFAQSchema(MACRO_TRACKER_FAQ_EN);
const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Alkemos", url: SITE },
  { name: "Macro Tracker", url: PAGE_URL },
]);
const itemListSchema = getItemListSchema({
  name: "The macro planning workflow on Alkemos",
  description:
    "The Alkemos surfaces behind the macro tracking workflow: the macro calculator, the meal planner with live totals, the AI meal planner, and the food database.",
  items: [
    { name: "Macro Calculator", url: "/tools/macro-calculator" },
    { name: "Meal Planner", url: "/meal-planner" },
    { name: "AI Meal Planner", url: "/ai-meal-planner" },
    { name: "Food Database", url: "/foods" },
    { name: "Workout Tracker", url: "/workout-tracker" },
    { name: "Free Tools", url: "/tools" },
  ],
});

export default function MacroTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />
      {children}
    </>
  );
}
