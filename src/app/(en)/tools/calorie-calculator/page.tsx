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
import { RecipeSuggestStrip } from "@/components/recipes/RecipeSuggestStrip";
import { LeadCaptureCard } from "@/components/LeadCaptureCard";
import { SaveResultButton } from "@/components/SaveResultButton";
import { ShareButtons } from "@/components/ShareButtons";
import { ReviewInviteCard } from "@/components/ReviewInviteCard";
import { ToolReferenceContent } from "@/components/ToolReferenceContent";
import { CALORIE_CALCULATOR_CONTENT } from "@/lib/content/calorie-calculator";
import {
  calculateCalorieTargets,
  ACTIVITY_FACTORS as SHARED_ACTIVITY_FACTORS,
} from "@/lib/fitness-math";

type Gender = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
type Goal = "lose" | "maintain" | "gain";

/* HOME-EXPERIENCE-269: the math now flows from the shared single source
   (src/lib/fitness-math.ts) so the tool page and the homepage calculator
   can never drift. The local alias keeps the template unchanged. */
const ACTIVITY_FACTORS = SHARED_ACTIVITY_FACTORS;

const ACTIVITY_LABELS_AR: Record<Activity, string> = {
  sedentary: "خامل (بدون رياضة)",
  light: "نشاط خفيف (1-3 أيام/أسبوع)",
  moderate: "نشاط متوسط (3-5 أيام/أسبوع)",
  active: "نشاط عالي (6-7 أيام/أسبوع)",
  very_active: "نشاط شديد جدًا (رياضي محترف)",
};

const ACTIVITY_LABELS_EN: Record<Activity, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Lightly active (1-3 days/week)",
  moderate: "Moderately active (3-5 days/week)",
  active: "Very active (6-7 days/week)",
  very_active: "Extra active (athlete/pro)",
};

export default function CalorieCalculatorPage() {
  const { lang } = useI18n();
  const { navigate } = useNav();
  const isAr = lang === "ar";

  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [result, setResult] = useState<{
    bmr: number;
    tdee: number;
    target: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  // Phase 154 — inline validation feedback (was a silent `return` — the only
  // calculator with no empty-submit message; BMI/body-fat both show one).
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (!w || !h || !a || w <= 0 || h <= 0 || a <= 0) {
      setError(
        isAr
          ? "من فضلك أدخل عمرًا ووزنًا وطولًا صحيحة (أكبر من صفر)."
          : "Please enter a valid age, weight and height (greater than zero).",
      );
      return;
    }
    setError(null);

    // The math flows from the shared single source (fitness-math.ts) —
    // byte-identical results to the previous inline formulas.
    const targets = calculateCalorieTargets({
      gender,
      age: a,
      weightKg: w,
      heightCm: h,
      activity,
      goal,
    });
    setResult(targets);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-2xl px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "حاسبة السعرات الحرارية" : "Calorie Calculator"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "احسب احتياجك اليومي من السعرات الحرارية والماكروز انطلاقًا من وزنك وطولك وعمرك ونشاطك."
              : "Calculate your daily calorie needs and macros based on your stats."}
          </p>
        </div>

        {/* Calculator */}
        <div className="mt-10 rounded-3xl bg-[var(--tint)] p-6 md:p-8">
          {/* Gender */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              {isAr ? "الجنس" : "Gender"}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender("male")}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-normal transition-all ${
                  gender === "male" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"
                }`}
              >
                {isAr ? "ذكر" : "Male"}
              </button>
              <button
                onClick={() => setGender("female")}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-normal transition-all ${
                  gender === "female" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"
                }`}
              >
                {isAr ? "أنثى" : "Female"}
              </button>
            </div>
          </div>

          {/* Age + Weight + Height */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {isAr ? "العمر" : "Age"}
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                {isAr ? "الوزن (كجم)" : "Weight (kg)"}
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
                className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                {isAr ? "الطول (سم)" : "Height (cm)"}
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]"
              />
            </div>
          </div>

          {/* Activity */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              {isAr ? "مستوى النشاط" : "Activity Level"}
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as Activity)}
              className="w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-2.5 text-base font-normal outline-none focus:border-[var(--chrome-edge)]"
            >
              {(Object.keys(ACTIVITY_FACTORS) as Activity[]).map((a) => (
                <option key={a} value={a}>
                  {isAr ? ACTIVITY_LABELS_AR[a] : ACTIVITY_LABELS_EN[a]}
                </option>
              ))}
            </select>
          </div>

          {/* Goal */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              {isAr ? "الهدف" : "Goal"}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setGoal("lose")}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-normal transition-all ${
                  goal === "lose" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"
                }`}
              >
                {isAr ? "خسارة وزن" : "Lose weight"}
              </button>
              <button
                onClick={() => setGoal("maintain")}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-normal transition-all ${
                  goal === "maintain" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"
                }`}
              >
                {isAr ? "تثبيت الوزن" : "Maintain"}
              </button>
              <button
                onClick={() => setGoal("gain")}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-normal transition-all ${
                  goal === "gain" ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--card)] text-[var(--muted-foreground)]"
                }`}
              >
                {isAr ? "زيادة وزن" : "Gain weight"}
              </button>
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={calculate}
            className="w-full btn-chrome px-6 py-3 text-base"
          >
            {isAr ? "احسب" : "Calculate"}
          </button>
          {/* Phase 154 — inline validation feedback */}
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-[#ff3b30]/10 px-4 py-2.5 text-center text-sm font-normal text-[#ff3b30]"
            >
              {error}
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Main result */}
            <div className="rounded-[var(--radius-chrome)] bg-black p-8 text-center text-white">
              <p className="text-xs font-normal uppercase tracking-wide text-gray-400">
                {isAr ? "السعرات اليومية" : "Daily Calories"}
              </p>
              <p className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
                {result.target}
              </p>
              <p className="mt-2 text-sm font-normal text-gray-400">
                {isAr ? "سعرة حرارية / يوم" : "calories / day"}
              </p>
            </div>

            {/* BMR + TDEE */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[var(--tint)] p-6 text-center">
                <p className="text-2xl font-semibold tracking-tight">{result.bmr}</p>
                <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">
                  {isAr ? "معدل الأيض الأساسي (BMR)" : "BMR (Basal Metabolic Rate)"}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--tint)] p-6 text-center">
                <p className="text-2xl font-semibold tracking-tight">{result.tdee}</p>
                <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">
                  {isAr ? "الاحتياج اليومي (TDEE)" : "TDEE (Maintenance)"}
                </p>
              </div>
            </div>

            {/* Macros */}
            <div className="rounded-3xl bg-[var(--tint)] p-6 md:p-8">
              <h3 className="text-lg font-semibold tracking-tight">
                {isAr ? "الماكروز اليومية" : "Daily Macros"}
              </h3>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="chrome-text text-2xl font-semibold">{isAr ? `${result.protein} جم` : `${result.protein}g`}</p>
                  <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">
                    {isAr ? "بروتين" : "Protein"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-[var(--text)]">{isAr ? `${result.carbs} جم` : `${result.carbs}g`}</p>
                  <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">
                    {isAr ? "كربوهيدرات" : "Carbs"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-[var(--muted-foreground)]">{isAr ? `${result.fat} جم` : `${result.fat}g`}</p>
                  <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">
                    {isAr ? "دهون" : "Fat"}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-3xl border border-[var(--edge)] bg-[var(--tint)] p-6 text-center">
              <p className="text-base font-normal text-[var(--text)]">
                {isAr
                  ? "تحتاج خطة تغذية مخصصة بالغرامات بناءً على أرقامك؟"
                  : "Need a personalized meal plan based on your numbers?"}
              </p>
              <button
                onClick={() => navigate("memberships")}
                className="mt-4 btn-chrome px-6 py-2.5 text-sm"
              >
                {isAr ? "احصل على خطة مخصصة ›" : "Get a personalized plan ›"}
              </button>
            </div>

            {/* Save + Download */}
            <SaveResultButton
              toolSlug="calorie-calculator"
              title={`Calories: ${result.target} kcal/day`}
              resultData={result}
            />

            {/* Lead Capture (Email / WhatsApp) — optional */}
            <LeadCaptureCard
              toolSlug="calorie-calculator"
              resultSummary={
                isAr
                  ? `السعرات: ${result.target}/يوم · بروتين: ${result.protein} جم · كربوهيدرات: ${result.carbs} جم · دهون: ${result.fat} جم`
                  : `Calories: ${result.target}/day · Protein: ${result.protein}g · Carbs: ${result.carbs}g · Fat: ${result.fat}g`
              }
              resultJson={result}
            />

            {/* HEALTHY-RECIPES-PLATFORM (plan §9.4): recipes that fit a meal
                share of the daily target (~1/3 — the heuristic is stated in
                the aria label; honest empty until the pipeline publishes). */}
            <RecipeSuggestStrip
              lang={lang}
              goal={goal === "lose" ? "weight-loss" : goal === "gain" ? "muscle-gain" : "maintenance"}
              maxCalories={Math.round(result.target / 3)}
            />

            {/* Share buttons */}
            <div className="rounded-2xl bg-[var(--tint)] p-4">
              <ShareButtons
                path="/tools/calorie-calculator"
                title={
                  isAr
                    ? `نتائجي من حاسبة السعرات: ${result.target} سعرة/يوم | Alkemos`
                    : `My calorie results: ${result.target} cal/day | Alkemos`
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
        <ToolArticleLinks toolSlug="calorie-calculator" />

        <OtherTools current="calorie-calculator" />

        {/* Deep reference content — Phase SEO-GEO-6.5 (§12.19 P1-6):
            calculator.net-standard deep content, bilingual, standalone per
            tool (owner law «كل أداة صفحة مستقلة») — replaces legacy block */}
        <ToolReferenceContent content={CALORIE_CALCULATOR_CONTENT} />
      </main>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}