import type { Metadata } from "next";
import { ToolSchemaScripts } from "@/components/ToolSchemaScripts";

/**
 * /ar/ai-workout-planner layout — §12.32 (AR side of the AI
 * workout-planner trial pair). Title carries NO brand suffix — the /ar
 * layout template appends exactly one "— Alkemos" (anti-double-brand
 * law, eadb3e7).
 */
export const metadata: Metadata = {
  title: "مخطط التمارين بالذكاء الاصطناعي — ولّد نظامك الأسبوعي",
  description:
    "ولّد نظامًا تدريبيًا أسبوعيًا متوازنًا بالذكاء الاصطناعي: اختر هدفك ومستواك وأيامك ومعداتك، واحصل على نظام مُتحقق في ثوانٍ — التوليد لمشتركي بريميوم وأعلى.",
  keywords: [
    "مخطط التمارين بالذكاء الاصطناعي",
    "مولد برامج التمارين",
    "نظام تدريبي أسبوعي",
    "جدول تمرين جاهز",
    "توليد برنامج تمرين",
    "ai workout planner",
  ],
  alternates: {
    canonical: "https://alkemos.com/ar/ai-workout-planner",
    languages: {
      en: "https://alkemos.com/ai-workout-planner",
      ar: "https://alkemos.com/ar/ai-workout-planner",
      "x-default": "https://alkemos.com/ai-workout-planner",
    },
  },
  openGraph: {
    title: "مخطط التمارين بالذكاء الاصطناعي | Alkemos",
    description: "ولّد نظامًا تدريبيًا أسبوعيًا متوازنًا في ثوانٍ — التوليد لمشتركي بريميوم وأعلى.",
    type: "website",
    locale: "ar_EG",
    url: "https://alkemos.com/ar/ai-workout-planner",
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

export default function ArAiWorkoutPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ToolSchemaScripts tool="ai-workout-planner" lang="ar" />
      {children}
    </>
  );
}
