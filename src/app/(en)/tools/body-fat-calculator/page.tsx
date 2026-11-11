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
import { BODY_FAT_CALCULATOR_CONTENT } from "@/lib/content/body-fat-calculator";

type Gender = "male" | "female";

export default function BodyFatCalculatorPage() {
  const { lang } = useI18n();
  const { navigate } = useNav();
  const isAr = lang === "ar";

  const [gender, setGender] = useState<Gender>("male");
  const [height, setHeight] = useState("");
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [result, setResult] = useState<{ bf: number; category: string; color: string; fatMass: number; leanMass: number } | null>(null);
  /* Phase 144 (live QA finding «silent calculator validation»): the
   * guards below returned silently — the button appeared broken. Now
   * an inline bilingual aria-live error says exactly what to fix. */
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    setError(null);
    const h = parseFloat(height);
    const n = parseFloat(neck);
    const w = parseFloat(waist);
    if (!h || !n || !w || h <= 0 || n <= 0 || w <= 0) {
      setError(
        isAr
          ? "من فضلك أدخل الطول ومحيط الرقبة ومحيط الخصر بقيم صحيحة أكبر من صفر."
          : "Please enter valid height, neck and waist values (greater than zero).",
      );
      setResult(null);
      return;
    }

    let bf: number;
    if (gender === "male") {
      // Navy Method (men): 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
      const diff = w - n;
      if (diff <= 0) {
        setError(
          isAr
            ? "يجب أن يكون محيط الخصر أكبر من محيط الرقبة للرجال."
            : "For men, the waist must be larger than the neck.",
        );
        setResult(null);
        return;
      }
      bf = 495 / (1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(h)) - 450;
    } else {
      const hp = parseFloat(hip);
      if (!hp || hp <= 0) {
        setError(
          isAr
            ? "تحتاج السيدات إلى إدخال محيط الورك أيضًا."
            : "Women also need a valid hip measurement.",
        );
        setResult(null);
        return;
      }
      const diff = w + hp - n;
      bf = 495 / (1.29579 - 0.35004 * Math.log10(diff) + 0.22100 * Math.log10(h)) - 450;
    }

    bf = Math.max(2, Math.round(bf * 10) / 10);

    let category: string;
    let color: string;
    if (gender === "male") {
      if (bf < 6) { category = isAr ? "أساسي" : "Essential"; color = "#ff3b30"; }
      else if (bf < 14) { category = isAr ? "رياضي" : "Athlete"; color = "#34c759"; }
      else if (bf < 18) { category = isAr ? "لياقة" : "Fitness"; color = "#34c759"; }
      else if (bf < 25) { category = isAr ? "متوسط" : "Average"; color = "#ff9500"; }
      else { category = isAr ? "سمنة" : "Obese"; color = "#ff3b30"; }
    } else {
      if (bf < 14) { category = isAr ? "أساسي" : "Essential"; color = "#ff3b30"; }
      else if (bf < 21) { category = isAr ? "رياضي" : "Athlete"; color = "#34c759"; }
      else if (bf < 25) { category = isAr ? "لياقة" : "Fitness"; color = "#34c759"; }
      else if (bf < 32) { category = isAr ? "متوسط" : "Average"; color = "#ff9500"; }
      else { category = isAr ? "سمنة" : "Obese"; color = "#ff3b30"; }
    }

    // Estimate weight from BMI approximation (BMI 22 = healthy midpoint).
    // Formula: BMI = weight / height_m² → weight = BMI × height_m²
    // For h=175cm → heightM=1.75 → weight = 22 × 1.75² = 67.375 kg
    const heightM = h / 100;
    const estimatedWeight = 22 * heightM * heightM; // kg, no extra multiplier
    const fatMass = Math.round(estimatedWeight * bf / 100);
    const leanMass = Math.round(estimatedWeight - fatMass);

    setResult({ bf, category, color, fatMass, leanMass });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <main className="mx-auto max-w-2xl px-4 py-12 md:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "حاسبة نسبة الدهون" : "Body Fat Calculator"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr ? "احسب نسبة الدهون في جسمك بطريقة البحرية الأمريكية." : "Calculate your body fat percentage using the Navy Method."}
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-[var(--tint)] p-6 md:p-8">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">{isAr ? "الجنس" : "Gender"}</label>
            <div className="flex gap-2">
              <button onClick={() => setGender("male")} className={`flex-1 rounded-full px-4 py-2.5 text-sm font-normal transition-all ${gender === "male" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"}`}>
                {isAr ? "ذكر" : "Male"}
              </button>
              <button onClick={() => setGender("female")} className={`flex-1 rounded-full px-4 py-2.5 text-sm font-normal transition-all ${gender === "female" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"}`}>
                {isAr ? "أنثى" : "Female"}
              </button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">{isAr ? "الطول (سم)" : "Height (cm)"}</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175"
                className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{isAr ? "محيط الرقبة (سم)" : "Neck (cm)"}</label>
              <input type="number" value={neck} onChange={(e) => setNeck(e.target.value)} placeholder="38"
                className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{isAr ? "محيط الخصر (سم)" : "Waist (cm)"}</label>
              <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="85"
                className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]" />
            </div>
            {gender === "female" && (
              <div>
                <label className="mb-2 block text-sm font-medium">{isAr ? "محيط الورك (سم)" : "Hip (cm)"}</label>
                <input type="number" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="95"
                  className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]" />
              </div>
            )}
          </div>

          <button onClick={calculate} className="w-full btn-chrome px-6 py-3 text-base">
            {isAr ? "احسب" : "Calculate"}
          </button>

          {/* Phase 144 — inline validation feedback (was silent) */}
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-[#ff3b30]/10 px-4 py-2.5 text-center text-sm font-normal text-[#ff3b30]"
            >
              {error}
            </p>
          )}
        </div>

        {result && (
          <div className="mt-8 space-y-6">
            <div className="rounded-[var(--radius-chrome)] bg-black p-8 text-center text-white">
              <p className="text-xs font-normal uppercase tracking-wide text-gray-400">{isAr ? "نسبة الدهون" : "Body Fat"}</p>
              <p className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">{result.bf}%</p>
              <p className="mt-3 inline-block rounded-full px-4 py-1 text-sm font-medium" style={{ backgroundColor: `${result.color}20`, color: result.color }}>
                {result.category}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[var(--tint)] p-6 text-center">
                <p className="text-2xl font-semibold text-[var(--warning)]">{result.fatMass} kg</p>
                <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">{isAr ? "كتلة دهون" : "Fat mass"}</p>
              </div>
              <div className="rounded-2xl bg-[var(--tint)] p-6 text-center">
                <p className="text-2xl font-semibold text-[var(--success)]">{result.leanMass} kg</p>
                <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">{isAr ? "كتلة صافية" : "Lean mass"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--edge)] bg-[var(--tint)] p-6 text-center">
              <p className="text-base font-normal text-[var(--text)]">{isAr ? "تحتاج خطة لتقليل الدهون وبناء العضلات؟" : "Need a plan to reduce fat and build muscle?"}</p>
              <button onClick={() => navigate("memberships")} className="mt-4 btn-chrome px-6 py-2.5 text-sm">
                {isAr ? "احصل على خطة مخصصة ›" : "Get a personalized plan ›"}
              </button>
            </div>

            {/* Save + Download */}
            <SaveResultButton
              toolSlug="body-fat-calculator"
              title={`Body Fat: ${result.bf}% (${result.category})`}
              resultData={{ ...result, gender }}
            />

            {/* Lead Capture (Email / WhatsApp) — optional */}
            <LeadCaptureCard
              toolSlug="body-fat-calculator"
              resultSummary={
                isAr
                  ? `نسبة الدهون: ${result.bf}% (${result.category}) · كتلة دهون: ${result.fatMass}kg · كتلة عضلية: ${result.leanMass}kg`
                  : `Body Fat: ${result.bf}% (${result.category}) · Fat mass: ${result.fatMass}kg · Lean mass: ${result.leanMass}kg`
              }
              resultJson={{ ...result, gender }}
            />

            {/* Share buttons */}
            <div className="rounded-2xl bg-[var(--tint)] p-4">
              <ShareButtons
                path="/tools/body-fat-calculator"
                title={
                  isAr
                    ? `نسبة دهوني: ${result.bf}% (${result.category}) | Alkemos`
                    : `My body fat: ${result.bf}% (${result.category}) | Alkemos`
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
        <ToolArticleLinks toolSlug="body-fat-calculator" />

        <OtherTools current="body-fat-calculator" />

        {/* Deep reference content — Phase SEO-GEO-6.5 (§12.19 P1-6):
            calculator.net-standard deep content, bilingual, standalone per
            tool (owner law «كل أداة صفحة مستقلة») — replaces legacy block */}
        <ToolReferenceContent content={BODY_FAT_CALCULATOR_CONTENT} />
      </main>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}