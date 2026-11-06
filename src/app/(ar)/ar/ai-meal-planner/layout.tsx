import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * /ar/ai-meal-planner layout — §12.28 (AR side of the AI meal-planner
 * trial pair). Title carries NO brand suffix — the /ar layout template
 * appends exactly one "— Alkemos" (anti-double-brand law, eadb3e7).
 */
export const metadata: Metadata = {
  title: "مخطط الوجبات بالذكاء الاصطناعي — ولّد خطة يومك مجانًا",
  description:
    "ولّد خطة يوم كاملة بالغرامات والسعرات بالذكاء الاصطناعي: اختر هدفك من السعرات والنظام الغذائي وأضف ملاحظاتك، واحصل على خطة يوم مُتحققة في ثوانٍ — تجربة مجانية.",
  keywords: [
    "مخطط وجبات بالذكاء الاصطناعي",
    "مولد خطط الوجبات",
    "خطة غذائية جاهزة",
    "تخطيط الوجبات",
    "نظام غذائي بالسعرات",
    "ai meal planner",
  ],
  alternates: {
    canonical: "https://alkemos.com/ar/ai-meal-planner",
    languages: {
      en: "https://alkemos.com/ai-meal-planner",
      ar: "https://alkemos.com/ar/ai-meal-planner",
      "x-default": "https://alkemos.com/ai-meal-planner",
    },
  },
  openGraph: {
    title: "مخطط الوجبات بالذكاء الاصطناعي | Alkemos",
    description: "ولّد خطة يوم كاملة بالغرامات والسعرات في ثوانٍ — تجربة مجانية.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/ai-meal-planner",
    // Phase 216 (P2-1 — deep-audit confirmed-7): same replace-not-inherit
    // gap as the EN twin — the tools family card is pinned explicitly.
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

export default function ArAiMealPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToolSchemaScripts tool="ai-meal-planner" lang="ar" />
      {children}
    </>
  );
}
