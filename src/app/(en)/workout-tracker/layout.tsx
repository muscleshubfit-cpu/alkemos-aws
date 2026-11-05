import type { Metadata } from "next";
import { getFAQSchema, getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";
import { WORKOUT_TRACKER_FAQ_EN } from "./content";

/**
 * /workout-tracker — SEO layout (server component under a client page).
 *
 * P0 SEO audit (2026-09-30, finding #1): "workout tracker" / "workout
 * tracking app" queries had ZERO matching pages — the tracking features
 * live behind login (ProgressView) with no indexable entry point.
 *
 * EN CANONICAL of the twin pair (the for-coaches pattern):
 *   EN canonical: /workout-tracker      ← this layout (EN-first metadata)
 *   AR mirror:    /ar/workout-tracker   (Arabic-first metadata)
 *   The pair (en/ar/x-default) is declared on BOTH sides.
 *
 * JSON-LD: FAQPage (kept for non-Google semantic value per the site
 * convention — Google retired FAQ rich results May 2026) + BreadcrumbList
 * + ItemList (the tracking surfaces this page routes to).
 */

const SITE = "https://alkemos.com";
const PAGE_URL = `${SITE}/workout-tracker`;

export const metadata: Metadata = {
  title: "Workout Tracker — Plan Workouts & Track Progress Free | Alkemos",
  description:
    // ~160-char budget (CONTENT-AUDIT P1-7 law): real capabilities only —
    // AI plans, programs, exercise library, body-metric tracking.
    "AI workout plans (2 free/month, no signup), ready-made programs, 868+ exercise guides — plus weight, measurements and progress photos in one free dashboard.",
  keywords: [
    "workout tracker",
    "workout tracking app",
    "track workout progress",
    "workout planner",
    "weight tracking app",
    "fitness progress tracker",
    "body measurement tracker",
    "progress photos",
  ],
  alternates: {
    canonical: PAGE_URL,
    languages: {
      en: PAGE_URL,
      ar: `${SITE}/ar/workout-tracker`,
      "x-default": PAGE_URL,
    },
  },
  openGraph: {
    title: "Workout Tracker — Plan Workouts & Track Progress Free | Alkemos",
    description:
      "Generate AI workout plans, follow ready-made programs, and track weight, measurements and progress photos in one free bilingual dashboard.",
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
        alt: "Workout Tracker — Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Workout Tracker — Plan Workouts & Track Progress Free | Alkemos",
    description:
      "AI workout plans, ready programs, exercise guides — plus weight, measurements and progress photos in one free dashboard.",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

const faqSchema = getFAQSchema(WORKOUT_TRACKER_FAQ_EN);
const breadcrumbSchema = getBreadcrumbSchema([
  { name: "Alkemos", url: SITE },
  { name: "Workout Tracker", url: PAGE_URL },
]);
const itemListSchema = getItemListSchema({
  name: "Workout planning & progress tracking on Alkemos",
  description:
    "The Alkemos surfaces behind the workout tracking workflow: AI plan generation, ready programs, the exercise library, and the member progress dashboard.",
  items: [
    { name: "AI Workout Planner", url: "/ai-workout-planner" },
    { name: "Workout Programs", url: "/programs" },
    { name: "Exercise Library", url: "/exercises" },
    { name: "Macro Tracker", url: "/macro-tracker" },
    { name: "Meal Planner", url: "/meal-planner" },
    { name: "Free Tools", url: "/tools" },
  ],
});

export default function WorkoutTrackerLayout({
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
