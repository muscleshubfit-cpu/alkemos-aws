"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { MACRO_TRACKER_FAQ_AR, MACRO_TRACKER_FAQ_EN } from "./content";

/**
 * /macro-tracker — search-intent landing page (EN canonical).
 *
 * P0 SEO audit (2026-09-30, finding #1): "macro tracker" / "macro
 * tracking app" queries had ZERO matching pages. This page targets that
 * intent and routes it to the REAL product surface.
 *
 * SEO-RECOVERY fix (2026-11-11, audit 13 / T-1 / P0-2ب — same defect
 * class as workout-tracker): the AR step 4 and the closing CTA linked
 * /ar/auth — a 404 (auth has no Arabic mirror). Both now point to
 * /auth, the only real route.
 *
 * HONESTY LAW (capability inventory 2026-09-30): every claim below maps
 * to a shipped feature —
 *   - Macro calculator: free targets in protein/carbs/fat.
 *   - Meal planner: build meals from 8,162+ foods (+ OpenFoodFacts
 *     search) with LIVE per-meal & per-day macro totals — free, no
 *     signup; save plans with an account (Free tier: 1 saved plan).
 *   - AI meal planner: 2 successful free generations/month, no signup.
 *   - Food database: 8,162+ foods with macros, browseable, bilingual.
 *   - Water tracker: device-local daily log.
 *   - Weight/measurement tracking: weekly check-ins, photos, chart.
 *   - NO daily food diary / barcode scanning — stated plainly on page.
 * The page is bilingual inline (useI18n is URL-first), so the /ar
 * mirror re-exports this exact component with Arabic chrome.
 */

export default function MacroTrackerPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const faqs = isAr ? MACRO_TRACKER_FAQ_AR : MACRO_TRACKER_FAQ_EN;

  const steps = isAr
    ? [
        {
          n: "١",
          title: "اضبط أهدافك",
          desc: "حاسبة الماكروز المجانية توزّع سعراتك اليومية على بروتين وكربوهيدرات ودهون حسب جسمك وهدفك ونشاطك.",
          href: "/ar/tools/macro-calculator",
          cta: "احسب ماكروزك",
        },
        {
          n: "٢",
          title: "ابنِ وجباتك بمجاميع حيّة",
          desc: "ابحث في 8,162+ صنفًا غذائيًا واضبط الغرامات — مجاميع السعرات والماكروز تتحدّث لحظيًا لكل وجبة ولكل اليوم، بلا تسجيل.",
          href: "/ar/meal-planner",
          cta: "افتح مخطط الوجبات",
        },
        {
          n: "٣",
          title: "أو ولّد يومًا كاملًا",
          desc: "مخطط الوجبات بالذكاء الاصطناعي يبني يومك بالغرامات من رقم سعراتك ونظامك الغذائي — توليدان مجانًا شهريًا بلا حساب.",
          href: "/ar/ai-meal-planner",
          cta: "ولّد خطة وجبات",
        },
        {
          n: "٤",
          title: "تابع النتيجة",
          desc: "تسجيلات أسبوعية للوزن وخمسة قياسات وصور تقدّم ومخطط وزن تفاعلي — ماكروزك ونتائجك في لوحة واحدة.",
          href: "/auth",
          cta: "ابدأ مجانًا",
        },
      ]
    : [
        {
          n: "1",
          title: "Set your targets",
          desc: "The free macro calculator splits your daily calories into protein, carbs, and fat from your body stats, goal, and activity level.",
          href: "/tools/macro-calculator",
          cta: "Calculate your macros",
        },
        {
          n: "2",
          title: "Build meals with live totals",
          desc: "Search 8,162+ foods, set the grams — calorie and macro totals update live per meal and per day, with no signup.",
          href: "/meal-planner",
          cta: "Open the meal planner",
        },
        {
          n: "3",
          title: "Or generate a full day",
          desc: "The AI Meal Planner builds your day in grams from your calorie target and diet system — 2 free generations per month, no account.",
          href: "/ai-meal-planner",
          cta: "Generate a meal plan",
        },
        {
          n: "4",
          title: "Track the outcome",
          desc: "Weekly check-ins for weight, five measurements, progress photos, and an interactive weight chart — your macros and results in one dashboard.",
          href: "/auth",
          cta: "Start free",
        },
      ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Breadcrumb — matches the compare/static-page convention */}
        <nav className="mb-6 text-sm text-muted-foreground" aria-label={isAr ? "مسار التنقل" : "Breadcrumb"}>
          <Link href={isAr ? "/ar" : "/"} className="hover:underline">
            {isAr ? "الرئيسية" : "Home"}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">
            {isAr ? "متتبّع الماكروز" : "Macro Tracker"}
          </span>
        </nav>

        <header>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "متتبّع الماكروز" : "Macro Tracker"}
          </h1>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "من الهدف إلى الجرام إلى النتيجة: اضبط أهداف ماكروزك، ابنِ وجباتك من 8,162+ صنفًا غذائيًا بمجاميع حيّة، أو ولّد يومًا كاملًا بالذكاء الاصطناعي — ثم تابع أثره على وزنك وقياساتك. التخطيط مجاني بالكامل للبدء، بالعربية والإنجليزية."
              : "From target to grams to result: set your macro targets, build meals from 8,162+ foods with live totals, or generate a full day with AI — then track the effect on your weight and measurements. Planning is entirely free to start, in English and Arabic."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={isAr ? "/ar/tools/macro-calculator" : "/tools/macro-calculator"}
              className="btn-chrome px-6 py-2.5 text-sm"
            >
              {isAr ? "احسب ماكروزك" : "Calculate your macros"}
            </Link>
            <Link
              href={isAr ? "/ar/meal-planner" : "/meal-planner"}
              className="btn-outline px-6 py-2.5 text-sm"
            >
              {isAr ? "ابنِ وجباتك" : "Build your meals"}
            </Link>
          </div>
          <div className="mt-6 flex justify-start">
            <ShareButtons
              path="/macro-tracker"
              title={isAr ? "متتبّع الماكروز — Alkemos" : "Macro Tracker — Alkemos"}
            />
          </div>
        </header>

        {/* The macro workflow */}
        <section className="mt-12" aria-label={isAr ? "مسار الماكروز" : "The macro workflow"}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "مسار الماكروز على Alkemos" : "The macro workflow on Alkemos"}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {steps.map((s) => (
              <Link
                key={s.n}
                href={s.href}
                className="marble-card group p-6 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="chrome-text text-3xl font-semibold" aria-hidden="true">
                    {s.n}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                </div>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {s.desc}
                </p>
                <span className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
                  {s.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Honest scope — the no-false-claims section (audit law) */}
        <section className="marble-card mt-12 p-8" aria-label={isAr ? "نطاق صادق" : "Honest scope"}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "ما لا يفعله Alkemos (بصراحة)" : "What Alkemos does not do (honestly)"}
          </h2>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-2)]">
            {isAr
              ? "Alkemos ليس يوميات طعام يومية: لا شاشة «سجّل ما أكلته اليوم» ولا ماسح باركود ولا تتبّع مغذيات دقيقة. تتبّعنا للماكروز على مستوى التخطيط: أهداف واضحة، وجبات بمجاميع حيّة، ونتائج تُقاس أسبوعيًا. إن كنت تريد يوميات استهلاك بعمق المغذيات الدقيقة، صفحة مقارنتنا مع Cronometer تفصّل الفرق بصدق — وإن أردت تخطيطًا سريعًا بنتائج قابلة للقياس، فأنت في المكان الصحيح."
              : "Alkemos is not a daily food diary: no log-what-I-ate screen, no barcode scanner, no micronutrient tracking. Our macro tracking lives at the planning level — clear targets, meals with live totals, and results measured weekly. If you want an intake diary with micronutrient depth, our Alkemos vs Cronometer comparison spells out that difference honestly — and if you want fast planning with measurable results, you are in the right place."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <Link
              href={isAr ? "/ar/compare/alkemos-vs-cronometer" : "/compare/alkemos-vs-cronometer"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "Alkemos مقابل Cronometer" : "Alkemos vs Cronometer"}
            </Link>
            <Link
              href={isAr ? "/ar/compare/alkemos-vs-myfitnesspal" : "/compare/alkemos-vs-myfitnesspal"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "Alkemos مقابل MyFitnessPal" : "Alkemos vs MyFitnessPal"}
            </Link>
          </div>
        </section>

        {/* Data + tools cross-links */}
        <section className="mt-12" aria-label={isAr ? "البيانات والأدوات" : "Data & tools"}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "البيانات والأدوات خلف المسار" : "The data & tools behind the workflow"}
          </h2>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-2)]">
            {isAr
              ? "كل صنف غذائي في قاعدة الـ8,162+ يحمل سعراته وبروتينه وكربوهيدراته ودهونه بمقاسات تقديم ذكية، ومجموعات منتقاة تجمع الأطعمة عالية البروتين ومنخفضة الكربوهيدرات والكيتو — وبجانبها حاسبة السعرات وحاسبة نسبة الدهون ومتتبع الماء اليومي."
              : "Every food in the 8,162+ database carries its calories, protein, carbs, and fat with smart serving sizes, and curated collections gather high-protein, low-carb, and keto picks — flanked by the calorie calculator, body-fat calculator, and a daily water tracker."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {/* Phase 318 (P1-8): the accuracy-chain link — the tool surface
                routes accuracy questions to the pillar guide. */}
            <Link
              href={isAr ? "/ar/guides/macro-tracking-accuracy" : "/guides/macro-tracking-accuracy"}
              className="rounded-full bg-[#0071e3]/10 px-4 py-2 font-medium text-[#0071e3] transition-opacity hover:opacity-90"
            >
              {isAr ? "دليل دقة تتبع الماكروز" : "Macro tracking accuracy guide"}
            </Link>
            <Link
              href={isAr ? "/ar/foods" : "/foods"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "قاعدة الأطعمة" : "Food database"}
            </Link>
            <Link
              href={isAr ? "/ar/collections/high-protein-foods" : "/collections/high-protein-foods"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "أطعمة عالية البروتين" : "High-protein foods"}
            </Link>
            <Link
              href={isAr ? "/ar/tools/calorie-calculator" : "/tools/calorie-calculator"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "حاسبة السعرات" : "Calorie calculator"}
            </Link>
            <Link
              href={isAr ? "/ar/tools/water-tracker" : "/tools/water-tracker"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "متتبع شرب الماء" : "Water tracker"}
            </Link>
            <Link
              href={isAr ? "/ar/workout-tracker" : "/workout-tracker"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "متتبّع التمارين" : "Workout Tracker"}
            </Link>
          </div>
        </section>

        {/* FAQ — visible text (GEO) + FAQPage JSON-LD from the layout */}
        <section className="mt-12" aria-label={isAr ? "أسئلة شائعة" : "FAQ"}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "أسئلة شائعة" : "Frequently asked questions"}
          </h2>
          <div className="mt-6 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="marble-card p-6">
                <h3 className="text-base font-semibold tracking-tight">{f.q}</h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="marble-card mt-12 p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            {isAr ? "ابدأ بماكروزك اليوم" : "Start with your macros today"}
          </h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            {isAr
              ? "الحاسبات وقاعدة الأطعمة ومخطط الوجبات بمجاميعه الحيّة — كلها مجانية، ووصول محدود لمدرب EVO بدون بطاقة ائتمان."
              : "The calculators, the food database, and the meal planner with live totals — all free, plus limited EVO AI access with no credit card."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/auth" className="btn-chrome px-6 py-2.5 text-sm">
              {isAr ? "سجّل مجانًا" : "Sign up free"}
            </Link>
            <Link href={isAr ? "/ar/memberships" : "/memberships"} className="btn-outline px-6 py-2.5 text-sm">
              {isAr ? "عرض الأسعار" : "View pricing"}
            </Link>
            <Link href={isAr ? "/ar/evo" : "/evo"} className="btn-outline px-6 py-2.5 text-sm">
              {isAr ? "تعرّف على EVO" : "Meet EVO AI"}
            </Link>
          </div>
        </section>
      </main>

      {/* Access-point law (2026-09-14): shared marble footer on every
          public page. */}
      <SiteFooter />
    </div>
  );
}
