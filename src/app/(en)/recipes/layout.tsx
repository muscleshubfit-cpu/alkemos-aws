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
    "Healthy recipes with ingredients weighed in grams and clear per-serving nutrition from trusted references — filter by cuisine, diet, goal, meal, calories, protein, and prep time. A new recipe every day.",
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
      "Healthy recipes with gram-weighed ingredients and clear per-serving nutrition from trusted references — matched to your training and nutrition goals.",
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
