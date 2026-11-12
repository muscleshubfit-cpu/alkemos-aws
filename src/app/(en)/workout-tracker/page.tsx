"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { WORKOUT_TRACKER_FAQ_AR, WORKOUT_TRACKER_FAQ_EN } from "./content";

/**
 * /workout-tracker — search-intent landing page (EN canonical).
 *
 * SEO-RECOVERY fix (2026-11-11, audit 13 / T-1 / P0-2ب): the AR steps
 * and CTAs linked /ar/auth — a 404 (the auth route has NO Arabic
 * mirror; /auth is the only real route — measured by the SiteOne
 * crawl and live). All auth CTAs now point to /auth in both languages.
 *
 * P0 SEO audit (2026-09-30, finding #1): the tracking features live
 * behind login (ProgressView + the AI planners) and the site had ZERO
 * pages answering "workout tracker" / "workout tracking app" queries —
 * the audit's biggest content gap. This page targets that intent and
 * routes it to the REAL product surface.
 *
 * HONESTY LAW (capability inventory 2026-09-30): every claim below maps
 * to a shipped feature —
 *   - AI workout plans: 2 successful free generations/month, no signup
 *     (api/ai/workout-plan-demo, unified monthly pool).
 *   - Ready-made programs + 868+ exercise library with instructions.
 *   - Progress tracking (ProgressView): weight + waist/chest/hips/arm/
 *     neck, energy & adherence self-scores 1–10, notes, progress photos,
 *     weight chart, weekly check-in reminder (cron, in-app notification).
 *   - NO per-session set/rep logging — stated plainly on the page.
 * The page is bilingual inline (useI18n is URL-first), so the /ar
 * mirror re-exports this exact component with Arabic chrome.
 */

export default function WorkoutTrackerPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const faqs = isAr ? WORKOUT_TRACKER_FAQ_AR : WORKOUT_TRACKER_FAQ_EN;

  const features = isAr
    ? [
        {
          title: "خطة تمارين بالذكاء الاصطناعي",
          desc: "ولّد نظامًا أسبوعيًا كاملًا من هدفك ومستواك وأيامك ومعداتك — توليدان مجانًا شهريًا بلا تسجيل، ولا يُحسب رصيدك إلا على التوليد الناجح.",
          href: "/ar/ai-workout-planner",
          cta: "ولّد خطة الآن",
        },
        {
          title: "برامج تدريب جاهزة",
          desc: "كتل تدريبية منظّمة لكل هدف ومستوى، للمنزل والنادي — ابدأ اليوم بلا انتظار توليد.",
          href: "/ar/programs",
          cta: "تصفّح البرامج",
        },
        {
          title: "868+ تمرينًا بشرح خطوة بخطوة",
          desc: "طريقة الأداء والعضلات المستهدفة والمعدات لكل حركة — بالعربية والإنجليزية.",
          href: "/ar/exercises",
          cta: "افتح المكتبة",
        },
        {
          title: "تسجيل الوزن وخمسة قياسات",
          desc: "الوزن والخصر والصدر والأرداف والذراع والرقبة بتواريخها — مع مخطط وزن تفاعلي يريك الاتجاه لا الأرقام المتناثرة.",
          href: "/auth",
          cta: "ابدأ التسجيل مجانًا",
        },
        {
          title: "صور تقدّم بتاريخها",
          desc: "ارفع صورك بضغطة، محفوظة بخصوصية في حسابك وبتاريخ كل صورة — الدليل البصري الذي لا يكذب.",
          href: "/auth",
          cta: "أنشئ حسابك",
        },
        {
          title: "تسجيل أسبوعي بتذكير",
          desc: "قيّم طاقتك والتزامك بالخطة (1–10) مع ملاحظاتك، وتذكير أسبوعي يصلك إن مرّ أسبوع بلا تسجيل.",
          href: "/auth",
          cta: "جرّب التسجيل الأسبوعي",
        },
      ]
    : [
        {
          title: "AI workout plans",
          desc: "Generate a complete weekly split from your goal, level, days, and equipment — 2 free generations per month, no signup, and only successful generations count against your quota.",
          href: "/ai-workout-planner",
          cta: "Generate a plan",
        },
        {
          title: "Ready-made programs",
          desc: "Structured training blocks for every goal and level, home or gym — start today without waiting for anything.",
          href: "/programs",
          cta: "Browse programs",
        },
        {
          title: "868+ exercises, explained",
          desc: "Step-by-step instructions, target muscles, and equipment for every movement — in English and Arabic.",
          href: "/exercises",
          cta: "Open the library",
        },
        {
          title: "Weight + 5 measurements",
          desc: "Weight, waist, chest, hips, arm, and neck — each entry dated, with an interactive weight chart that shows the trend instead of scattered numbers.",
          href: "/auth",
          cta: "Start tracking free",
        },
        {
          title: "Progress photos, dated",
          desc: "Upload your photos in one tap, stored privately in your account with the date on each shot — the visual evidence that never lies.",
          href: "/auth",
          cta: "Create your account",
        },
        {
          title: "Weekly check-in + reminder",
          desc: "Rate your energy and plan adherence (1–10) with notes, and a weekly reminder arrives if a week passes without a check-in.",
          href: "/auth",
          cta: "Try weekly check-ins",
        },
      ];

  const steps = isAr
    ? [
        {
          n: "١",
          title: "خطّط",
          desc: "ولّد خطة بالذكاء الاصطناعي أو اختر برنامجًا جاهزًا — كل تمرين فيها بمجموعاته وتكراراته وراحاته وشرحه.",
        },
        {
          n: "٢",
          title: "سجّل أسبوعيًا",
          desc: "وزنك وقياساتك وصورتك ودرجة التزامك (1–10) — دقائق معدودة تكفي، والتذكير الأسبوعي يضمن ألا تنسى.",
        },
        {
          n: "٣",
          title: "شاهد الاتجاه",
          desc: "مخطط الوزن وملخص التغيّر ولوحة المؤشرات الصحية (BMI ونسبة الدهون عند اكتمال القياسات) تترجم أرقامك إلى قرار.",
        },
      ]
    : [
        {
          n: "1",
          title: "Plan",
          desc: "Generate an AI plan or pick a ready program — every exercise arrives with sets, reps, rest, and full instructions.",
        },
        {
          n: "2",
          title: "Check in weekly",
          desc: "Weight, measurements, a photo, and your adherence score (1–10) — a few minutes is enough, and the weekly reminder keeps you honest.",
        },
        {
          n: "3",
          title: "See the trend",
          desc: "The weight chart, change summary, and health-metrics dashboard (BMI and body-fat once your measurements are in) turn your numbers into decisions.",
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
            {isAr ? "متتبّع التمارين" : "Workout Tracker"}
          </span>
        </nav>

        <header>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "متتبّع التمارين" : "Workout Tracker"}
          </h1>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "ربع ساعة تخطيط وتسجيل أسبوعي واحد يفصلانك عن رؤية تقدّمك الحقيقي: Alkemos يخطّط تدريبك بالذكاء الاصطناعي أو من برامج جاهزة، ثم يتتبّع وزنك وقياساتك وصورك في لوحة واحدة — مجانًا، وبالعربية والإنجليزية."
              : "One planning session and one weekly check-in separate you from seeing real progress: Alkemos plans your training with AI or from ready-made programs, then tracks your weight, measurements, and photos in one dashboard — free, in English and Arabic."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={isAr ? "/ar/ai-workout-planner" : "/ai-workout-planner"}
              className="btn-chrome px-6 py-2.5 text-sm"
            >
              {isAr ? "ولّد خطة مجانية" : "Generate a free plan"}
            </Link>
            <Link
              href="/auth"
              className="btn-outline px-6 py-2.5 text-sm"
            >
              {isAr ? "سجّل مجانًا" : "Sign up free"}
            </Link>
          </div>
          <div className="mt-6 flex justify-start">
            <ShareButtons
              path="/workout-tracker"
              title={isAr ? "متتبّع التمارين — Alkemos" : "Workout Tracker — Alkemos"}
            />
          </div>
        </header>

        {/* What you can track today */}
        <section className="mt-12" aria-label={isAr ? "ما يمكنك تتبّعه اليوم" : "What you can track today"}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "ما يمكنك تتبّعه اليوم" : "What you can track today"}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="marble-card group p-6 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {f.desc}
                </p>
                <span className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
                  {f.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-12" aria-label={isAr ? "كيف يعمل التتبّع" : "How tracking works"}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "كيف يعمل التتبّع" : "How tracking works"}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="marble-card p-6">
                <span className="chrome-text text-3xl font-semibold" aria-hidden="true">
                  {s.n}
                </span>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {s.desc}
                </p>
              </div>
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
              ? "Alkemos لا يسجّل المجموعات والتكرارات لكل جلسة تمرين — لا شاشة «اضغط لتسجيل المجموعة». بدلًا من ذلك، تحمل خطتك كل تمرين بمجموعاته وتكراراته وراحاته، ويُلتقط التقدّم في تسجيلك الأسبوعي: القياسات والصور ودرجة التزامك الذاتية (1–10). إن كنت تبحث تحديدًا عن سجل جلسات لحظي فصوّرنا لك الفرق بصدق في صفحات المقارنات — وإن أردت تخطيطًا وتتبّع نتائج في منصة واحدة، فأنت في المكان الصحيح."
              : "Alkemos does not log sets and reps for every session — there is no tap-to-log-every-set screen. Instead, your plan carries every exercise with its sets, reps, and rest, and progress is captured in your weekly check-in: measurements, photos, and your self-reported adherence score (1–10). If you are specifically after a live session log, our comparison pages spell out that difference honestly — and if you want planning plus results-tracking in one platform, you are in the right place."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <Link
              href={isAr ? "/ar/compare/alkemos-vs-cronometer" : "/compare/alkemos-vs-cronometer"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "Alkemos مقابل Cronometer" : "Alkemos vs Cronometer"}
            </Link>
            <Link
              href={isAr ? "/ar/compare" : "/compare"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "كل المقارنات" : "All comparisons"}
            </Link>
          </div>
        </section>

        {/* Nutrition cross-link */}
        <section className="mt-12" aria-label={isAr ? "الجانب الغذائي" : "The nutrition side"}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "والجانب الغذائي؟" : "The nutrition side"}
          </h2>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-2)]">
            {isAr
              ? "التقدّم لا يُصنع بالتمارين وحدها: احسب أهداف ماكروزك، ابنِ وجباتك من 8,162+ صنفًا غذائيًا بمجاميع حيّة، أو ولّد يومًا كاملًا بالغرامات بالذكاء الاصطناعي — ثم تابع أثرها على وزنك وقياساتك في نفس اللوحة."
              : "Progress is not built by training alone: calculate your macro targets, build meals from 8,162+ foods with live totals, or generate a full day of eating in grams with AI — then watch their effect on your weight and measurements in the same dashboard."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <Link
              href={isAr ? "/ar/macro-tracker" : "/macro-tracker"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "متتبّع الماكروز" : "Macro Tracker"}
            </Link>
            <Link
              href={isAr ? "/ar/meal-planner" : "/meal-planner"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "مخطط الوجبات" : "Meal Planner"}
            </Link>
            <Link
              href={isAr ? "/ar/tools/water-tracker" : "/tools/water-tracker"}
              className="rounded-full border border-[var(--edge)] px-4 py-2 font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
            >
              {isAr ? "متتبع شرب الماء" : "Water Tracker"}
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
            {isAr ? "ابدأ التتبّع اليوم" : "Start tracking today"}
          </h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            {isAr
              ? "مكتبة التمارين الكاملة، قاعدة الأطعمة، الأدوات الثماني، ووصول محدود لمدرب EVO — بدون بطاقة ائتمان."
              : "The full exercise library, food database, 8 free tools, and limited EVO AI access — no credit card required."}
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
