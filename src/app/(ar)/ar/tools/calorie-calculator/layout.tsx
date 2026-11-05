import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * SEO-GEO-4 (2026-09-08): AR metadata for /ar/tools/calorie-calculator.
 *
 * Targets the highest-volume Arabic fitness query «حاسبة السعرات
 * الحرارية» (live-verified SERP: MOH portals + generic media, no
 * dedicated professional competitor). Title carries NO brand suffix —
 * the /ar layout template appends exactly one "— Alkemos".
 */
export const metadata: Metadata = {
  title: "حاسبة السعرات الحرارية — احسب احتياجك اليومي والماكروز",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 199 → 132 chars — the
    // ≤160 SERP-truncation law now holds. The «(Mifflin-St Jeor)» gloss
    // is KEPT — pinned by tool-msa-surface.test.ts canary (§12.41 law).
    "احسب سعراتك اليومية والماكروز من وزنك وطولك وعمرك ونشاطك بمعادلة ميفلين-سانت جيور (Mifflin-St Jeor) — نتائج فورية وشرح مبسط، مجانًا.",
  keywords: [
    "حاسبة السعرات الحرارية",
    "حساب السعرات اليومية",
    "حاسبة الكالوري",
    "حاسبة TDEE",
    "حاسبة BMR",
    "السعرات الحرارية لتخسيس الوزن",
    "حاسبة الماكروز",
  ],
  alternates: {
    canonical: "https://alkemos.com/ar/tools/calorie-calculator",
    languages: {
      en: "https://alkemos.com/tools/calorie-calculator",
      ar: "https://alkemos.com/ar/tools/calorie-calculator",
      "x-default": "https://alkemos.com/tools/calorie-calculator",
    },
  },
  openGraph: {
    title: "حاسبة السعرات الحرارية",
    description: "احسب احتياجك اليومي من السعرات والماكروز مجانًا وبنتائج فورية.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/tools/calorie-calculator",
    // PHASE 187 (deep-audit P0-2): og:image — static branded family
    // card (design mirrors /api/og-image; see scripts/generate-og-cards.py).
    images: [
      {
        url: "/images/og/og-home-ar.png?v=4",
        width: 1200,
        height: 630,
        alt: "حاسبات اللياقة المجانية من Alkemos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/og-home-ar.png?v=4"],
    title: "حاسبة السعرات الحرارية",
    description: "احسب احتياجك اليومي من السعرات والماكروز مجانًا وبنتائج فورية.",
  },
};

export default function ArCalorieLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="calorie-calculator" lang="ar" />
      {children}
    </>
  );
}
