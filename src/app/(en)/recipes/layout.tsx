import type { Metadata } from "next";
import { Resources } from "@/components/hub-head-resources";

/**
 * RECIPES SECTION LAYOUT (EN) — HEALTHY-RECIPES-PLATFORM plan §9.1.
 *
 * The foods-layout precedent: English-first metadata for the /recipes
 * tree; the AR mirror (src/app/(ar)/ar/recipes/layout.tsx) carries its
 * own Arabic metadata. One index URL pair, canonical + full hreflang
 * (en · ar · x-default→EN — the recipes hreflang is complete by
 * construction: pairs publish atomically).
 */
export const metadata: Metadata = {
  title: "Healthy Recipes | Alkemos",
  description:
    "Healthy bilingual recipes with nutrition computed in grams from a verified USDA-based reference — filter by cuisine, diet, goal, meal, calories, protein, and prep time. A new verified Arabic + English pair every day.",
  keywords: [
    "healthy recipes",
    "high protein recipes",
    "calorie recipes",
    "meal prep recipes",
    "arabic healthy recipes",
    "egyptian healthy recipes",
    "keto recipes",
  ],
  alternates: {
    canonical: "https://alkemos.com/recipes",
    languages: {
      en: "https://alkemos.com/recipes",
      ar: "https://alkemos.com/ar/recipes",
      "x-default": "https://alkemos.com/recipes",
    },
  },
  openGraph: {
    title: "Healthy Recipes | Alkemos",
    description:
      "Bilingual healthy recipes with per-serving nutrition computed from a verified reference — in grams, per serving, matched to your goal.",
    type: "website",
    locale: "en_US",
    url: "https://alkemos.com/recipes",
    images: [
      {
        url: "/images/og/og-home-en.png?v=4",
        width: 1200,
        height: 630,
        alt: "Alkemos Healthy Recipes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-en.png?v=4"],
  },
};

export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Resources banner="foods">{children}</Resources>;
}
