import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { FOOD_COMPARISONS, getFoodComparisonBySlug, type FoodPairNutrition } from "@/lib/food-comparisons";
import { getFoodBySlug } from "@/lib/foods";
import { getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";

/**
 * /ar/foods/compare/[slug] — Arabic mirror of /foods/compare/[slug].
 *
 * SEO-GROWTH-P4 (owner orders 2026-11-05: batch 2 «اختبار محدود قابل
 * للقياس» + batch 3 «استكمل الأعمال المؤجلة ذات الأولوية… لا تنتظر
 * نتائج Google» — the plan's Phase-1 first-ten, 10 pairs × 2 mirrors).
 * The AR copy is
 * editorially independent (order 414 law) with question-shaped AR titles
 * (audit 03 §4.1) — the AR surface is the primary PAA target
 * («موز أم تفاح؟» patterns measured 2026-11-05).
 *
 * AR title law: NO brand suffix here — the /ar layout template appends
 * "— Alkemos" automatically (the anti-double-brand law).
 *
 * Schema law mirrors the EN page: ItemList + Breadcrumb only; FAQ is
 * visible plain text.
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return FOOD_COMPARISONS.map((c) => ({ slug: c.slug }));
}

const OG_IMAGE = "/images/og/og-home-ar.png?v=4";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getFoodComparisonBySlug(slug);
  if (!comparison) {
    return {
      title: "المقارنة غير موجودة",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/ar/foods/compare/${comparison.slug}`;
  return {
    title: comparison.titleAr,
    description: comparison.descriptionAr,
    alternates: {
      canonical: url,
      languages: {
        en: `https://alkemos.com/foods/compare/${comparison.slug}`,
        ar: url,
        "x-default": `https://alkemos.com/foods/compare/${comparison.slug}`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: comparison.titleAr,
      description: comparison.descriptionAr,
      siteName: "Alkemos",
      locale: "ar_EG",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: comparison.titleAr,
      description: comparison.descriptionAr,
      images: [OG_IMAGE],
    },
  };
}

function MacroRow({
  label,
  a,
  b,
  unit = " جم",
}: {
  label: string;
  a: number;
  b: number;
  unit?: string;
}) {
  return (
    <tr>
      <th scope="row" className="px-3 py-2 text-right text-sm font-medium text-[var(--muted-foreground)]">
        {label}
      </th>
      <td className="px-3 py-2 text-center text-sm font-semibold">{a}{unit}</td>
      <td className="px-3 py-2 text-center text-sm font-semibold">{b}{unit}</td>
    </tr>
  );
}

function ServingBlock({
  name,
  n,
  href,
}: {
  name: string;
  n: FoodPairNutrition;
  href: string;
}) {
  return (
    <div className="marble-card p-5">
      <Link href={href} className="text-base font-semibold hover:underline">
        {name}
      </Link>
      <p className="mt-1 text-sm font-normal text-[var(--muted-foreground)]">
        الحصة الشائعة: {n.servingLabelAr} ({n.servingGrams} جرام)
      </p>
      <p className="mt-2 text-sm font-normal leading-relaxed">
        <strong className="font-semibold">{n.serving.calories}</strong> سعرة ·{" "}
        {n.serving.protein} جم بروتين · {n.serving.carbs} جم كربوهيدرات · {n.serving.fat} جم دهون
      </p>
    </div>
  );
}

export default async function ArabicFoodComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comparison = getFoodComparisonBySlug(slug);
  if (!comparison) notFound();

  const foodA = getFoodBySlug(comparison.aSlug)!;
  const foodB = getFoodBySlug(comparison.bSlug)!;
  const url = `https://alkemos.com/ar/foods/compare/${comparison.slug}`;
  const toolHref = `/ar/tools/${comparison.toolSlug}`;

  const itemListSchema = getItemListSchema({
    name: `${foodA.nameAr} مقابل ${foodB.nameAr}`,
    description: comparison.descriptionAr,
    items: [
      {
        name: `${foodA.nameAr} — صفحة القيم الغذائية`,
        url: `https://alkemos.com/ar/foods/${foodA.slug}`,
      },
      {
        name: `${foodB.nameAr} — صفحة القيم الغذائية`,
        url: `https://alkemos.com/ar/foods/${foodB.slug}`,
      },
    ],
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "الأطعمة", url: "/ar/foods" },
    { name: comparison.h1Ar, url },
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm font-normal text-[var(--muted-foreground)]">
          <Link href="/ar/foods" className="hover:underline">الأطعمة</Link>
          <span className="mx-1.5">/</span>
          <span>{comparison.h1Ar}</span>
        </nav>

        {/* H1 + إجابة أولى مباشرة (قانون AEO) */}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
          {comparison.h1Ar}
        </h1>
        <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
          {comparison.introAr}
        </p>

        {/* جدول المقارنة لكل 100 جرام */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            الأرقام: {foodA.nameAr} مقابل {foodB.nameAr}
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--edge)] bg-[var(--card)]">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--edge)]">
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    لكل 100 جرام
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-sm font-semibold">
                    <Link href={`/ar/foods/${foodA.slug}`} className="hover:underline">{foodA.nameAr}</Link>
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-sm font-semibold">
                    <Link href={`/ar/foods/${foodB.slug}`} className="hover:underline">{foodB.nameAr}</Link>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edge)]">
                <MacroRow label="السعرات" a={comparison.a.per100g.calories} b={comparison.b.per100g.calories} unit=" سعرة" />
                <MacroRow label="البروتين" a={comparison.a.per100g.protein} b={comparison.b.per100g.protein} />
                <MacroRow label="الكربوهيدرات" a={comparison.a.per100g.carbs} b={comparison.b.per100g.carbs} />
                <MacroRow label="الدهون" a={comparison.a.per100g.fat} b={comparison.b.per100g.fat} />
                <MacroRow label="الألياف" a={comparison.a.per100g.fiber} b={comparison.b.per100g.fiber} />
                <MacroRow label="السكر" a={comparison.a.per100g.sugar} b={comparison.b.per100g.sugar} />
                <MacroRow label="البروتين لكل 100 سعرة" a={comparison.a.proteinPer100kcal} b={comparison.b.proteinPer100kcal} unit=" جم" />
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs font-normal text-[var(--muted-foreground)]">
            المصدر: قاعدة أطعمة Alkemos — الصفوف نفسها التي تعرضها صفحة كل صنف (قيم لكل 100 جرام؛ وقيم الحصص مشتقة من الحصة الافتراضية لكل صنف).
          </p>
        </section>

        {/* الحصة الحقيقية */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">كيف تبدو الحصة الحقيقية</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ServingBlock name={foodA.nameAr} n={comparison.a} href={`/ar/foods/${foodA.slug}`} />
            <ServingBlock name={foodB.nameAr} n={comparison.b} href={`/ar/foods/${foodB.slug}`} />
          </div>
        </section>

        {/* الأحكام السياقية بقواعد شفافة */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">أيهما… ولأي هدف</h2>
          <div className="mt-4 space-y-5">
            {comparison.verdicts.map((v, i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold tracking-tight">{v.heading.ar}</h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)] md:text-base">
                  {v.body.ar}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* أسئلة شائعة مرئية (نص صريح — بلا سكيما FAQPage بقانون الأسرة) */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">أسئلة شائعة</h2>
          <div className="mt-4 space-y-5">
            {comparison.faqs.map((f, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold leading-snug">{f.q.ar}</h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">{f.a.ar}</p>
              </div>
            ))}
          </div>
        </section>

        {/* جسر الأداة السياقي الواحد */}
        <section className="mt-10">
          <div className="marble-card p-6 text-center">
            <p className="text-base font-normal text-[var(--text)]">
              حوّل هذه الأرقام إلى خطة:{" "}
              <Link href={toolHref} className="font-medium underline underline-offset-4 hover:text-[var(--text)]">
                {comparison.toolSlug === "macro-calculator" ? "حاسبة الماكروز" : "حاسبة السعرات"}
              </Link>{" "}
              توزّع ميزانيتك اليومية إلى غرامات — مجانًا وبلا حساب.
            </p>
          </div>
        </section>

        {/* بقية مقارنات الدفعة */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">مقارنات غذائية أخرى</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {FOOD_COMPARISONS.filter((c) => c.slug !== comparison.slug).map((c) => {
              const ca = getFoodBySlug(c.aSlug)!;
              const cb = getFoodBySlug(c.bSlug)!;
              return (
                <li key={c.slug}>
                  <Link
                    href={`/ar/foods/compare/${c.slug}`}
                    className="marble-card inline-block px-4 py-2 text-sm font-medium hover:underline"
                  >
                    {ca.nameAr} أم {cb.nameAr}؟
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-10">
          <ShareButtons path={`/ar/foods/compare/${comparison.slug}`} title={comparison.titleAr} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
