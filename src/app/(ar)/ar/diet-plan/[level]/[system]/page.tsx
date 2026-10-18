import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { jsonLd, getBreadcrumbSchema } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import {
  DIET_LEVELS,
  DIET_SYSTEMS,
  LEVEL_GUIDANCE,
  SYSTEM_GUIDANCE,
  buildCellIntro,
  buildCellMetadata,
  getDietSystem,
  isDietLevel,
  macroTargets,
  solveDayPlan,
} from "@/lib/diet-plan-matrix";

const SITE_URL = "https://alkemos.com";

/**
 * /ar/diet-plan/{level}/{system} — the 24 programmatic leaf pages
 * (Phase SEO-GEO-6.6, §12.19 P1-8, eatthismuch-style Arabic matrix).
 *
 * LAWS (see src/lib/diet-plan-matrix.ts header):
 *   - Unique intro per cell + computed day plan within ±10 kcal.
 *   - §12.27: the EN twin (/diet-plan/{level}/{system}) now exists — full
 *     hreflang pair (ar + en + x-default→en). BreadcrumbList schema only —
 *     no FAQPage, no ratings.
 *   - Free-planner CTA (no registration needed — free tier: 3 meals).
 */

export function generateStaticParams() {
  return DIET_LEVELS.flatMap((level) =>
    DIET_SYSTEMS.map((system) => ({
      level: String(level),
      system: system.slug,
    })),
  );
}

type Params = { params: Promise<{ level: string; system: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { level, system } = await params;
  if (!isDietLevel(level) || !getDietSystem(system)) return {};
  const lv = Number(level) as 1200 | 1500 | 1800 | 2000 | 2500 | 3000;
  const sys = getDietSystem(system)!;
  const { title, description } = buildCellMetadata(lv, sys);
  const url = `${SITE_URL}/ar/diet-plan/${lv}/${sys.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ar: url,
        en: `${SITE_URL}/diet-plan/${lv}/${sys.slug}`,
        "x-default": `${SITE_URL}/diet-plan/${lv}/${sys.slug}`,
      },
    },
    openGraph: {
      title: `${title} — Alkemos`,
      description,
      url,
      type: "website",
      locale: "ar_EG",
      // Batch 1-b (2026-09-16, §12.53 item 4 follow-up): og:image for the
      // 24 AR cells — same-family home card as the hub (matches the EN
      // cells' og-home-en pattern).
      images: [
        {
          // SOCIAL-OG-3 (2026-09-30): dedicated family card (was og-home — audit round 2: ~90 URLs across ~15 surface types shared the generic home card) + share-cache-bust v=3.
          url: "/images/og/og-diet-plan-ar.png?v=3",
          width: 1200,
          height: 630,
          alt: "منصة Alkemos الرياضية الشاملة",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/images/og/og-diet-plan-ar.png?v=3"],
    },
  };
}

export default async function DietPlanCellPage({ params }: Params) {
  const { level, system } = await params;
  if (!isDietLevel(level) || !getDietSystem(system)) notFound();
  const lv = Number(level) as 1200 | 1500 | 1800 | 2000 | 2500 | 3000;
  const sys = getDietSystem(system)!;

  const targets = macroTargets(lv, sys);
  const day = solveDayPlan(lv, sys);
  const intro = buildCellIntro(lv, sys, targets);
  const url = `${SITE_URL}/ar/diet-plan/${lv}/${sys.slug}`;

  const breadcrumb = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "مكتبة الخطط الغذائية الجاهزة", url: "/ar/diet-plan" },
    { name: `${lv} سعرة`, url: `/ar/diet-plan/${lv}/${sys.slug}` },
  ]);

  const macroRows = [
    {
      label: "البروتين",
      grams: targets.protein,
      kcal: Math.round((lv * sys.split.protein) / 100),
      pct: sys.split.protein,
    },
    {
      label: "الكربوهيدرات",
      grams: targets.carbs,
      kcal: Math.round((lv * sys.split.carbs) / 100),
      pct: sys.split.carbs,
    },
    {
      label: "الدهون",
      grams: targets.fat,
      kcal: Math.round((lv * sys.split.fat) / 100),
      pct: sys.split.fat,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }}
      />
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <SiteHeader variant="landing" />
        <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <nav aria-label="مسار التنقل" className="text-sm text-[var(--muted-foreground)]">
            <Link href="/ar/diet-plan" className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
              مكتبة الخطط الغذائية الجاهزة
            </Link>
            <span className="px-1.5">/</span>
            <span>
              {lv} سعرة · {sys.nameAr}
            </span>
          </nav>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {/* CONTENT-AUDIT P0-5 (audit §1.11): قالب واحد = عقدة نص واحدة —
                بلا فواصل `<!-- -->` حيث يلتقي الرقم بالشرطة أو القوس. */}
            {`نظام غذائي ${lv} سعرة — ${sys.nameAr}`}
          </h1>

          {intro.map((p, i) => (
            <p key={i} className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              {p}
            </p>
          ))}

          {/* ── The full day, computed ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            {`خطة اليوم كاملة بالغرامات (${day.kcal} سعرة)`}
          </h2>
          <div className="mt-4 space-y-4">
            {day.meals.map((meal) => (
              <div key={meal.name} className="rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                    {meal.name}
                  </h3>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {meal.kcal} سعرة
                  </span>
                </div>
                <ul className="mt-2 divide-y divide-[var(--edge)]/60">
                  {meal.items.map((item) => (
                    <li key={item.food} className="flex items-baseline justify-between gap-3 py-1.5 text-sm font-normal">
                      <span className="text-[var(--muted-foreground)]">
                        {item.food}
                      </span>
                      <span className="whitespace-nowrap text-[var(--muted-foreground)]">
                        {item.grams} جم · {item.kcal} سعرة
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            إجمالي اليوم: {day.kcal} سعرة · بروتين {day.protein} جم ·
            كربوهيدرات {day.carbs} جم · دهون {day.fat} جم. الأوزان مطبوخة أو
            جاهزة للأكل، والقيم مقربة لأقرب سعرة — فالفارق الطبيعي لهضم طعام
            حقيقي أوسع من هذه الخانات العشرية.
          </p>

          {/* ── Macro targets ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            توزيع الماكروز على {lv} سعرة
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--edge)]">
            <table className="w-full min-w-[420px] border-collapse text-sm font-normal">
              <thead>
                <tr className="bg-[var(--tint)]">
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-start font-medium text-[var(--text)]">المغذي</th>
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-center font-medium text-[var(--text)]">غرامات/يوم</th>
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-center font-medium text-[var(--text)]">سعرات</th>
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-center font-medium text-[var(--text)]">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {macroRows.map((r) => (
                  <tr key={r.label} className="odd:bg-[var(--tint)]/40">
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-[var(--muted-foreground)]">{r.label}</td>
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-center text-[var(--muted-foreground)]">{r.grams} غ</td>
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-center text-[var(--muted-foreground)]">{r.kcal}</td>
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-center text-[var(--muted-foreground)]">{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            هذا التوزيع هو نفسه ترويسة خطة اليوم — الغرامات الفعلية للطعام
            أعلاه تقترب منه بفارق طبيعي، لأن الخطة مبنية من أطعمة حقيقية لا
            من مطحونات مختبرية. إن أردت ضبط التوزيع بدقة متناهية فحاسبة
            الماكروز{" "}
            <Link href="/ar/tools/macro-calculator" className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
              تحسبه لك من سعراتك
            </Link>{" "}
            بغرامات قابلة للنسخ.
          </p>

          {/* ── Level & system guidance ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            لماذا {lv} سعرة؟ ومتى تلائمك؟
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            {LEVEL_GUIDANCE[lv]}
          </p>
          <h2 className="mt-8 text-xl font-semibold tracking-tight text-[var(--text)]">
            عن النظام {sys.nameArDef}
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            {SYSTEM_GUIDANCE[sys.slug]}
          </p>

          {/* ── Free customization CTA (the embedded tool path — §12.28: AI generator first, manual planner for exact grams) ── */}
          <div className="mt-10 rounded-3xl border border-[var(--edge)] bg-[var(--tint)] p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">
              اجعلها خطتك أنت — مجانًا
            </h2>
            <p className="mt-2 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              الخطة أعلاه مرسومة على مقاس {lv} سعرة عموماً؛ وأرقامك أنت تستحق
              قياساً خاصاً. أسرع طريق:{" "}
              <Link href="/ar/ai-meal-planner" className="font-medium underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
                خطّط وجباتك بالذكاء الاصطناعي
              </Link>{" "}
              — أدخل رقمك ونظامك وملاحظاتك فتُولَّد لك خطة يوم كاملة بالغرامات
              في ثوانٍ، مجانًا للجميع. وللتحكم اليدوي الدقيق افتح{" "}
              <Link href="/ar/meal-planner" className="font-medium underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
                مخطط الوجبات
              </Link>{" "}
              — يعمل للزوار مجانًا — وأدخل أصناف هذه الخطة
              بغراماتك، فترى الإجماليات تتجمع لحظياً لكل وجبة ولكل يوم، وعدّل
              الغرامات حتى يهبط يومك على هدفك بالضبط.
            </p>
            <p className="mt-2 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              وإن لم تكن متأكداً أن {lv} سعرة هي رقمك أصلاً، فابدأ من{" "}
              <Link href="/ar/tools/calorie-calculator" className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
                حاسبة السعرات
              </Link>{" "}
              — عمر ووزن وطول ونشاط صادق، وستخرج بأرقامك أنت لا بأرقام
              المتوسطات.
            </p>
          </div>

          {/* ── Visible FAQ (plain text, no FAQPage schema) ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            أسئلة شائعة عن نظام {lv} سعرة {sys.nameAr}
          </h2>
          <div className="mt-3 space-y-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                هل ألتزم بهذه الغرامات حرفيًا؟
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                لا — الخطة سقالة لا قيد. الالتزام الحرفي بالغرام كل يوم بلا
                حياة اجتماعية ولا تنويع ينهار أسرع مما يبدأ. الثابت اليومي هو
                الإجمالي{` (${day.kcal} سعرة)`} والبروتين (نحو {targets.protein}
                غراماً)، أما ترتيب الأصناف بين الوجبات فليكن تبعا ليومك
                وذوقك، والاستبدالات داخل العائلة الواحدة (دجاج بسمك، عدس
                بحمص) مسموحة ما دام الإجمالي اليومي قريباً من الهدف.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                ماذا لو جعت على {lv} سعرة؟
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                الجوع رسالة معلوماتية أولاً: راجع البروتين والألياف وكمية
                الخضار — فإن كانت منخفضة فأصلحها أولاً، فهي أدوات الشبع
                الأولى. اشرب كأس ماء وانتظر عشر دقائق؛ فإن بقي الجوع صادقاً
                فأضف حصة خضار مطبوخة أو زبادي خالي الدسم بسعرات قليلة، وقِس
                أثرها على اتجاه وزنك الأسبوعي. وإن كان الجوع مزمناً طوال
                الأسبوع فقد يكون {lv} سعرة أقل من احتياجك الحقيقي — أعد
                الحساب بدل أن تعاقب نفسك.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                كيف أعرف أن الخطة تعمل؟
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                بالاتجاه الأسبوعي لا بقراءة الصباح: زِن نفسك بالظروف نفسها
                صباحاً وقارن متوسطات الأسبوع بالأسبوع. إن كان هدفك خسارة
                الدهون فالانخفاض المعقول بين 0.25 و0.5 كجم أسبوعياً (أببطأ
                عند المستويات الأدنى لأن الهامش أضيق)؛ وللتثبيت استقرار
                المتوسط داخل نطاق كيلوغرام؛ وللزيادة صعود بمقدار مماثل. أسبوعان
                بلا حركة مع التزام صادق = عدّل 100 إلى 200 سعرة في اتجاه
                هدفك.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                هل يصلح هذا النظام لمرضى السكري أو الضغط؟
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                الطعام نفسه — خضار وبقول وبروتين ودهون صحية — يشبه كثيراً ما
                توصي به الإرشادات الغذائية عموماً، لكن الأرقام (خصوصاً
                الكربوهيدرات عند السكري، والصوديوم عند الضغط) تُضبط فردياً مع
                طبيبك وبأدويتك وتحاليلك. هذه الصفحة تخطيط عام لبالغين
                أصحاء، وليست وصفة طبية: استعملها مادة نقاش ممتازة مع مختصك،
                لا بديلاً عنه.
              </p>
            </div>
            {/* PRIORITY-PAGES-2 (2026-10-19, audit §E-1): مسار التخصيص
                كسؤال صريح — بطاقة الدعوة أعلاه تحمل الوصلات؛ وهذا السؤال
                يصيغ المسارات الثلاثة (مخطط الوجبات بالغرامات، توليد
                الذكاء الاصطناعي، تبديلات EVO للوجبات) بصيغة الأسئلة
                الشائعة التي تستعملها بقية إجابات الصفحة. */}
            <div>
              <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                هل أستطيع تخصيص هذه الخطة بدل اتباعها حرفياً؟
              </h3>
              <p className="mt-1.5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                نعم، وهي الخطوة التالية المقصودة: افتح مخطط الوجبات وأدخل
                أصناف هذه الخطة بغراماتك أنت — الإجماليات تُبنى حية لكل وجبة
                ولكل يوم، وتعدّل الغرامات حتى يهبط يومك على هدفك بالضبط.
                ولو أردت يوماً مولّداً من رقمك ونظامك وملاحظاتك فمخطط الوجبات
                بالذكاء الاصطناعي يبنيه في ثوانٍ مجانًا للجميع. ومع الاشتراك
                يستطيع EVO استبدال أي وجبة منفردة داخل خطتك بمكافئ مطابق
                للماكروز دون المساس ببقية اليوم.
              </p>
            </div>
          </div>

          {/* ── Internal mesh: same level, other systems + same system, other levels ── */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            خطط ذات صلة
          </h2>
          <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
            على {lv} سعرة بنظام آخر:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIET_SYSTEMS.filter((s) => s.slug !== sys.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/ar/diet-plan/${lv}/${s.slug}`}
                className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {`${lv} سعرة ${s.nameAr}`}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm font-normal text-[var(--muted-foreground)]">
            بالنظام {sys.nameArDef} على مستوى آخر:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIET_LEVELS.filter((l) => l !== lv).map((l) => (
              <Link
                key={l}
                href={`/ar/diet-plan/${l}/${sys.slug}`}
                className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
              >
                {l} سعرة {sys.nameAr}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm font-normal text-[var(--muted-foreground)]">
            <Link href="/ar/diet-plan" className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
              المكتبة كاملة — كل المستويات والأنظمة
            </Link>
            {" · "}
            <Link href={url} className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
              هذه الخطة
            </Link>
          </p>
        </main>
      </div>
    </>
  );
}
