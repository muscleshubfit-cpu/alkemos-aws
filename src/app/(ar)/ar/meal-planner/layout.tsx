import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * SEO-GEO-4 (2026-09-08): AR metadata for /ar/meal-planner.
 * Title carries NO brand suffix — the /ar layout template appends exactly
 * one "— Alkemos".
 */
export const metadata: Metadata = {
  title: "مخطط الوجبات — ابنِ خطة غذائية مخصصة مجانًا",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 168 → 134 chars — the
    // ≤160 SERP-truncation law now holds (8,830+ proof + free CTA kept).
    "ابنِ خطة وجبات مخصصة في دقائق: ابحث في 8,830+ صنف بالسعرات والماكروز، وحدد الكميات، واحفظ خططك — مجانًا، والتصدير مع الباقات المدفوعة.",
  keywords: [
    "مخطط الوجبات",
    "خطة غذائية مجانية",
    "إنشاء نظام غذائي",
    "حاسبة وجبات",
    "نظام غذائي حسب السعرات",
    "خطة أكل صحي",
  ],
  alternates: {
    canonical: "https://alkemos.com/ar/meal-planner",
    languages: {
      en: "https://alkemos.com/meal-planner",
      ar: "https://alkemos.com/ar/meal-planner",
      "x-default": "https://alkemos.com/meal-planner",
    },
  },
  openGraph: {
    title: "مخطط الوجبات | Alkemos",
    description: "ابنِ وجباتك من 8,830+ صنف غذائي وتتبّع الماكروز — مجانًا.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/meal-planner",
    // Phase 216 (P2-1 discovery beyond the audit list — same replace-
    // not-inherit gap as the EN twin, live-verified): the tools family
    // card is pinned explicitly.
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
  },
};

export default function ArMealPlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSchemaScripts tool="meal-planner" lang="ar" />
      {children}
    </>
  );
}
