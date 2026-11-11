"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useNav } from "@/hooks/use-nav";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdSenseAd } from "@/components/AdSenseAd";
import { OtherTools } from "@/components/OtherTools";
// Report 15 §5-B1 (owner order 2026-11-12): contextual guides that interpret
// the tool result — pairs from src/lib/tool-article-links.ts (reverse leg
// renders on the article pages from the same source).
import { ToolArticleLinks } from "@/components/ToolArticleLinks";
import { LeadCaptureCard } from "@/components/LeadCaptureCard";
import { SaveResultButton } from "@/components/SaveResultButton";
import { ShareButtons } from "@/components/ShareButtons";
import { ReviewInviteCard } from "@/components/ReviewInviteCard";
import { ToolReferenceContent } from "@/components/ToolReferenceContent";
import { MACRO_CALCULATOR_CONTENT } from "@/lib/content/macro-calculator";

type DietType = "balanced" | "low_carb" | "high_protein" | "keto" | "low_fat";

const DIET_PRESETS: Record<DietType, { protein: number; carbs: number; fat: number; label_ar: string; label_en: string }> = {
  balanced: { protein: 30, carbs: 40, fat: 30, label_ar: "متوازن", label_en: "Balanced" },
  low_carb: { protein: 40, carbs: 20, fat: 40, label_ar: "قليل الكربوهيدرات", label_en: "Low Carb" },
  high_protein: { protein: 45, carbs: 35, fat: 20, label_ar: "عالي البروتين", label_en: "High Protein" },
  keto: { protein: 25, carbs: 5, fat: 70, label_ar: "كيتو", label_en: "Keto" },
  low_fat: { protein: 35, carbs: 55, fat: 10, label_ar: "قليل الدهون", label_en: "Low Fat" },
};

export default function MacroCalculatorPage() {
  const { lang } = useI18n();
  const { navigate } = useNav();
  const isAr = lang === "ar";

  const [calories, setCalories] = useState("");
  const [diet, setDiet] = useState<DietType>("balanced");
  const [result, setResult] = useState<{
    protein_g: number; carbs_g: number; fat_g: number;
    protein_cal: number; carbs_cal: number; fat_cal: number;
  } | null>(null);

  const calculate = () => {
    const cal = parseInt(calories);
    if (!cal || cal <= 0) return;

    const preset = DIET_PRESETS[diet];
    const protein_cal = Math.round(cal * preset.protein / 100);
    const carbs_cal = Math.round(cal * preset.carbs / 100);
    const fat_cal = Math.round(cal * preset.fat / 100);

    setResult({
      protein_g: Math.round(protein_cal / 4),
      carbs_g: Math.round(carbs_cal / 4),
      fat_g: Math.round(fat_cal / 9),
      protein_cal, carbs_cal, fat_cal,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <main className="mx-auto max-w-2xl px-4 py-12 md:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "حاسبة الماكروز" : "Macro Calculator"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr ? "وزّع سعراتك على بروتين وكربوهيدرات ودهون حسب نظامك الغذائي." : "Split your calories into protein, carbs, and fat."}
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-[var(--tint)] p-6 md:p-8">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">{isAr ? "السعرات اليومية" : "Daily Calories"}</label>
            <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2000"
              className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]" />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">{isAr ? "نظام غذائي" : "Diet Type"}</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DIET_PRESETS) as DietType[]).map((d) => (
                <button key={d} onClick={() => setDiet(d)}
                  className={`rounded-full px-4 py-2 text-sm font-normal transition-all ${diet === d ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"}`}>
                  {isAr ? DIET_PRESETS[d].label_ar : DIET_PRESETS[d].label_en}
                </button>
              ))}
            </div>
          </div>

          <button onClick={calculate} className="w-full btn-chrome px-6 py-3 text-base">
            {isAr ? "احسب" : "Calculate"}
          </button>
        </div>

        {result && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-[var(--radius-chrome)] bg-black p-6 text-center text-white">
                <p className="text-3xl font-semibold tracking-tight">{isAr ? `${result.protein_g} جم` : `${result.protein_g}g`}</p>
                <p className="mt-1 text-xs font-normal text-blue-100">{isAr ? "بروتين" : "Protein"}</p>
                <p className="mt-1 text-xs font-normal text-blue-200">{result.protein_cal} {isAr ? "سعرة" : "cal"}</p>
              </div>
              <div className="rounded-[var(--radius-chrome)] bg-black p-6 text-center text-white">
                <p className="text-3xl font-semibold tracking-tight">{isAr ? `${result.carbs_g} جم` : `${result.carbs_g}g`}</p>
                <p className="mt-1 text-xs font-normal text-gray-400">{isAr ? "كربوهيدرات" : "Carbs"}</p>
                <p className="mt-1 text-xs font-normal text-gray-500">{result.carbs_cal} {isAr ? "سعرة" : "cal"}</p>
              </div>
              <div className="rounded-3xl bg-[var(--muted-foreground)] p-6 text-center text-white">
                <p className="text-3xl font-semibold tracking-tight">{isAr ? `${result.fat_g} جم` : `${result.fat_g}g`}</p>
                <p className="mt-1 text-xs font-normal text-gray-300">{isAr ? "دهون" : "Fat"}</p>
                <p className="mt-1 text-xs font-normal text-gray-400">{result.fat_cal} {isAr ? "سعرة" : "cal"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--edge)] bg-[var(--tint)] p-6 text-center">
              <p className="text-base font-normal text-[var(--text)]">{isAr ? "تحتاج خطة وجبات بهذه الماكروز؟" : "Need a meal plan with these macros?"}</p>
              <button onClick={() => navigate("memberships")} className="mt-4 btn-chrome px-6 py-2.5 text-sm">
                {isAr ? "احصل على خطة مخصصة ›" : "Get a personalized plan ›"}
              </button>
            </div>

            {/* Save + Download */}
            <SaveResultButton
              toolSlug="macro-calculator"
              title={`Macros: P${result.protein_g}g C${result.carbs_g}g F${result.fat_g}g`}
              resultData={{ ...result, calories, diet }}
            />

            {/* Lead Capture (Email / WhatsApp) — optional */}
            <LeadCaptureCard
              toolSlug="macro-calculator"
              resultSummary={
                isAr
                  ? `السعرات: ${calories} · ${DIET_PRESETS[diet].label_ar} · بروتين: ${result.protein_g} جم · كربوهيدرات: ${result.carbs_g} جم · دهون: ${result.fat_g} جم`
                  : `Calories: ${calories} · ${DIET_PRESETS[diet].label_en} · Protein: ${result.protein_g}g · Carbs: ${result.carbs_g}g · Fat: ${result.fat_g}g`
              }
              resultJson={{ ...result, calories, diet }}
            />

            {/* Share buttons */}
            <div className="rounded-2xl bg-[var(--tint)] p-4">
              <ShareButtons
                path="/tools/macro-calculator"
                title={
                  isAr
                    ? `ماكروزي: بروتين ${result.protein_g} جم · كربوهيدرات ${result.carbs_g} جم · دهون ${result.fat_g} جم | Alkemos`
                    : `My macros: Protein ${result.protein_g}g · Carbs ${result.carbs_g}g · Fat ${result.fat_g}g | Alkemos`
                }
              />
            </div>

            {/* Review invite (SEO-GEO-6.3 §12.22 + §12.24) — always-on slim strip below results, never blocks them */}
            <ReviewInviteCard />

            {/* AdSense */}
            <AdSenseAd format="auto" />
          </div>
        )}

        {/* DELIVERY 0050: other-tools links always visible at the bottom (owner request) */}
        {/* Report 15 §5-B1: «كيف تستخدم نتيجتك» guide strip (marble cards) */}
        <ToolArticleLinks toolSlug="macro-calculator" />

        <OtherTools current="macro-calculator" />

        {/* Deep reference content — Phase SEO-GEO-6.5 (§12.19 P1-6):
            calculator.net-standard deep content, bilingual, standalone per
            tool (owner law «كل أداة صفحة مستقلة») — replaces legacy block */}
        <ToolReferenceContent content={MACRO_CALCULATOR_CONTENT} />
      </main>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}