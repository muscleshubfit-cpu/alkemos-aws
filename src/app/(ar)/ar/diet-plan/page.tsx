import type { Metadata } from "next";
import Link from "next/link";
import { jsonLd, getBreadcrumbSchema } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { DIET_LEVELS, DIET_SYSTEMS } from "@/lib/diet-plan-matrix";

const SITE_URL = "https://alkemos.com";

/**
 * /ar/diet-plan — the Arabic diet-plan LIBRARY hub (Phase SEO-GEO-6.6
 * §12.19 P1-8 · §12.27 EN twin · §12.33+§12.34 owner directives
 * «انقل خطط غذائيه جاهزة الى المكتبات باسم مكتبة الخطط الغذاييه الجاهزه
 * ، عدل شكل وتوزيع الخطط الغذاييه الجاهزه الى كارت لكل نوع واسفل منه
 * اختيارات السعرات»). The 24 leaf cells live under
 * /ar/diet-plan/{level}/{system}; the hub now presents them as one card
 * per system with the six calorie options below it.
 * No FAQPage schema, no ratings, no fabricated signals.
 */

/** One honest line per system — the card's subtitle (§12.34). */
const SYSTEM_LINES: Record<string, string> = {
  balanced: "نقطة بداية متوازنة — توزيع 30/40/30 من السعرات (بروتين/كربوهيدرات/دهون).",
  "high-protein": "مصمم لخسارة الدهون وبناء العضلات — 45/35/20 ببروتين أعلى.",
  keto: "دهون عالية وكربوهيدرات شبه معدومة — 25/5/70.",
  vegetarian: "بقول وحبوب وألبان وبيض — 25/50/25 (نمط خاص بالمكتبة).",
};

export const metadata: Metadata = {
  // No brand in title — the /ar layout template appends exactly one
  // " — Alkemos" (anti-double-brand law, eadb3e7).
  title: "مكتبة الخطط الغذائية الجاهزة — من 1200 إلى 3000 سعرة",
  description:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 163 → 141 chars — the
    // ≤160 SERP-truncation law now holds (24-plan proof + free CTA kept).
    "مكتبة الخطط الغذائية الجاهزة: 24 خطة يوم (6 مستويات سعرات × 4 أنظمة — متوازن، عالي البروتين، كيتو، نباتي) بالغرامات والسعرات، مع تخصيص مجاني.",
  alternates: {
    canonical: `${SITE_URL}/ar/diet-plan`,
    languages: {
      ar: `${SITE_URL}/ar/diet-plan`,
      en: `${SITE_URL}/diet-plan`,
      "x-default": `${SITE_URL}/diet-plan`,
    },
  },
  openGraph: {
    title: "مكتبة الخطط الغذائية الجاهزة — Alkemos",
    description:
      "24 خطة يوم كاملة بالغرامات: من 1200 إلى 3000 سعرة × 4 أنظمة غذائية.",
    url: `${SITE_URL}/ar/diet-plan`,
    type: "website",
    locale: "ar_EG",
    // Batch 1-b (2026-09-16, §12.53 item 4 follow-up): a child openGraph
    // block REPLACES the root one in Next.js merging, so og-home-ar was
    // NOT inherited — pinned explicitly (same pattern as the EN hub).
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

export default function DietPlanHubPage() {
  const breadcrumb = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "مكتبة الخطط الغذائية الجاهزة", url: "/ar/diet-plan" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }}
      />
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <SiteHeader variant="landing" />
        <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            مكتبة الخطط الغذائية الجاهزة
          </h1>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            تحوّل هذه المكتبة رقم سعراتك إلى يوم طعام حقيقي: أربع وعشرون خطة
            جاهزة، كل منها لِمستوى سعرات معيّن (من 1200 إلى 3000 سعرة) عبر
            أربعة أنظمة غذائية — المتوازن، وعالي البروتين، والكيتوني،
            والنباتي. كل خطة مكتوبة بالغرامات والسعرات لكل صنف، بفطور وغداء
            وعشاء وسناك من مطبخ عربي مألوف: الفول والخبز البلدي والأرز
            والدجاج والعدس والزبادي، لا مساحيق ولا أطعمة لا تجدها في سوقك.
          </p>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            ابدأ من رقمك: إن كنت تعرف سعراتك اليومية فاختر نظامك من الكروت
            أدناه ثم مستوى سعراتك من اختياراته؛ وإن لم تعرفها فمرّ على{" "}
            <Link
              href="/ar/tools/calorie-calculator"
              className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]"
            >
              حاسبة السعرات
            </Link>{" "}
            أولاً — فمستوى 1500 سعرة لشخص يحرق 2400 غير مناسب تماماً
            لشخص يحرق 1800. ثم اختر النظام الذي يشبه حياتك: المتوازن نقطة
            بداية متوازنة، وعالي البروتين مصمم لخسارة الدهون وبناء
            العضلات، والكيتو لمن يحيا بداخله أصلاً، والنباتي لمن غذاؤه بقول
            وحبوب وألبان وبيض.
          </p>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            كل صفحة خطة تنتهي بخطوة التخصيص: خطّط وجباتك بالذكاء الاصطناعي —
            يولّد لك يوماً كاملاً من رقمك ونظامك وملاحظاتك مجانًا —
            أو افتح مخطط الوجبات اليدوي وأدخل الأصناف نفسها بغراماتك أنت،
            فتحصل على إجماليات حية لكل وجبة ولكل يوم، ثم عدّل الغرامات حتى
            يهبط اليوم على هدفك بالضبط. الخطة الجاهزة تفتح لك الباب؛
            والتخصيص يجعلها بيتك.
          </p>

          <div className="mt-6">
            <ShareButtons path="/diet-plan" title="مكتبة الخطط الغذائية — Alkemos" />
          </div>

          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            المكتبة — كارت لكل نظام وأسفله اختيارات السعرات
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {DIET_SYSTEMS.map((s) => (
              <div key={s.slug} className="marble-card flex flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                  {/* CONTENT-AUDIT P0-4 (audit §1.10): indefinite form —
                      «نظام متوازن» not «النظام متوازن». */}
                  نظام {s.nameAr}
                  </h3>
                  <span
                    className="whitespace-nowrap text-xs font-normal text-[var(--muted-foreground)]"
                    dir="ltr"
                  >
                    {s.split.protein}/{s.split.carbs}/{s.split.fat}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {SYSTEM_LINES[s.slug]}
                </p>
                <p className="mt-4 text-xs font-medium text-[var(--text)]">
                  اختيارات السعرات:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIET_LEVELS.map((lv) => (
                    <Link
                      key={lv}
                      href={`/ar/diet-plan/${lv}/${s.slug}`}
                      className="rounded-full border border-[var(--edge)] px-3.5 py-1.5 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
                    >
                      {lv} سعرة
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* PRIORITY-PAGES-2 (2026-10-19, audit §E-1): الفهرس النصي
              للخطط الـ24 بصيغة الاستعلام المقيسة — «خطة 2000 سعرة عالية
              البروتين — جاهزة بالغرامات» (نمط الاستعلامات المقيسة
              بتشغيل 39152491179) — المكتبة كانت تعرض الكروت بلا وصلة
              نصية يقرأها الباحث أو الزاحف. */}
          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            كل خطة باسمها — القائمة الكاملة
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            المكتبة كلها بصيغة يطلبها بها الناس — اختر سعراتك ونظامك
            وتُفتح الخطة بالغرامات:
          </p>
          <div className="mt-4 space-y-5">
            {DIET_SYSTEMS.map((s) => (
              <div key={s.slug}>
                <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">
                  خطط {s.nameAr}
                </h3>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                  {DIET_LEVELS.map((lv) => (
                    <li key={lv}>
                      <Link
                        href={`/ar/diet-plan/${lv}/${s.slug}`}
                        className="text-sm font-normal text-[var(--muted-foreground)] underline decoration-[var(--edge)] underline-offset-4 transition-colors hover:text-[var(--text)]"
                      >
                        {`خطة ${lv} سعرة ${s.nameAr} — جاهزة بالغرامات`}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-semibold tracking-tight text-[var(--text)]">
            كيف تقرأ الخطة وتستعملها
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            الأوزان في الخطط مطبوخة أو جاهزة للأكل — فالأرز المطبوخ غير الأرز
            الجاف، والبيض المسلوق يوزن بقشرته تقريباً. والخطة نقطة انطلاق صادقة
            لا عقداً مغلقاً: استبدل صنفاً بآخر من نفس العائلة (سمك مكان دجاج،
            عدس مكان حمص) ما دام الإجمالي اليومي قريباً من هدفك، وقِس أثرك
            أسبوعين بالميزان لا بالحدس. إن تحرك وزنك في الاتجاه المقصود بعد
            أسبوعين فالخطة تعمل؛ وإن لم يتحرك فعدّل 100 إلى 200 سعرة في
            الاتجاه المطلوب ثم أعطِ الأسبوعين نفسيهما.
          </p>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            وتذكير الصحة المعتاد: هذه خطط عامة لبالغين أصحاء. إن كان لديك وضع
            صحي مزمن — سكري أو كلى أو حمل أو اضطراب أكل — فالرقم المناسب لك
            يُضبط مع مختص يرى ملفك كاملاً، والمكتبة هنا نقطة حوار ممتازة معه
            لا بديلاً عنه.
          </p>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
