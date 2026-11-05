import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { NUTRIENT_LISTS, getNutrientListBySlug } from "@/lib/food-nutrient-lists";
import { getFoodCollectionBySlug } from "@/lib/hub-collections";
import { getBreadcrumbSchema, getItemListSchema, jsonLd } from "@/lib/seo";

/**
 * /ar/foods/lists/[slug] — Arabic mirror of /foods/lists/[slug].
 *
 * SEO-GROWTH Phase 2 (owner order 2026-11-06 «استكمل المرحلة التالية من
 * خطة استعادة النمو وتحسين SEO/GEO… استكمل جميع الأعمال الممكنة حاليًا»):
 * the ten nutrient-ranked «الأطعمة الغنية بـ…» lists (audit 03 §4.3),
 * 10 × 2 mirrors = 20 URLs. The AR copy is editorially independent
 * (order 414 law) with question-shaped AR titles (audit §4.1) — the AR
 * surface is the primary target (the measured Arabic query patterns
 * «أي طعام أكثر بروتين» / «أقل الفواكه سكرًا»…).
 *
 * AR title law: NO brand suffix here — the /ar layout template appends
 * "— Alkemos" automatically (the anti-double-brand law).
 *
 * Schema law mirrors the EN page: ItemList + Breadcrumb only; FAQ is
 * visible plain text.
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return NUTRIENT_LISTS.map((l) => ({ slug: l.slug }));
}

const OG_IMAGE = "/images/og/og-home-ar.png?v=4";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const list = getNutrientListBySlug(slug);
  if (!list) {
    return {
      title: "القائمة غير موجودة",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/ar/foods/lists/${list.slug}`;
  return {
    title: list.titleAr,
    description: list.descriptionAr,
    alternates: {
      canonical: url,
      languages: {
        en: `https://alkemos.com/foods/lists/${list.slug}`,
        ar: url,
        "x-default": `https://alkemos.com/foods/lists/${list.slug}`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: list.titleAr,
      description: list.descriptionAr,
      siteName: "Alkemos",
      locale: "ar_EG",
      // SOCIAL-OG-4 (2026-11-06): no own content image on this page —
      // the homepage card is the default fallback (owner law).
      images: [{ url: OG_IMAGE, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: list.titleAr,
      description: list.descriptionAr,
      images: [OG_IMAGE],
    },
  };
}

export default async function ArabicNutrientListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = getNutrientListBySlug(slug);
  if (!list) notFound();

  const url = `https://alkemos.com/ar/foods/lists/${list.slug}`;
  const toolHref = `/ar/tools/${list.toolSlug}`;
  const collection = list.collectionSlug ? getFoodCollectionBySlug(list.collectionSlug) : null;

  const itemListSchema = getItemListSchema({
    name: list.h1Ar,
    description: list.descriptionAr,
    items: list.rows.map((r) => ({
      name: `${r.nameAr} — صفحة القيم الغذائية`,
      url: `https://alkemos.com/ar/foods/${r.slug}`,
    })),
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "الرئيسية", url: "/ar" },
    { name: "الأطعمة", url: "/ar/foods" },
    { name: list.h1Ar, url },
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
          <span>{list.h1Ar}</span>
        </nav>

        {/* H1 + إجابة أولى مباشرة (قانون AEO) */}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
          {list.h1Ar}
        </h1>
        <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
          {list.introAr}
        </p>

        {/* معيار الترتيب الشفاف (شرح معيار الترتيب — §4.3) */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">كيف يعمل هذا الترتيب؟</h2>
          <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)] md:text-base">
            {list.criterionAr}
          </p>
        </section>

        {/* الجدول المرتب — قيم لكل 100 جرام من صفوف قاعدة البيانات */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">الجدول: أعلى {list.rows.length}</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--edge)] bg-[var(--card)]">
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--edge)]">
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    #
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    الصنف
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    {list.metricAr}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    السعرات (سعرة/100 جرام)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edge)]">
                {list.rows.map((r, i) => (
                  <tr key={r.slug}>
                    <td className="px-3 py-2 text-right text-sm font-normal text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="px-3 py-2 text-right text-sm font-medium">
                      <Link href={`/ar/foods/${r.slug}`} className="hover:underline">{r.nameAr}</Link>
                    </td>
                    <td className="px-3 py-2 text-center text-sm font-semibold">{r.value}</td>
                    <td className="px-3 py-2 text-center text-sm font-normal text-[var(--muted-foreground)]">{r.calories}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs font-normal text-[var(--muted-foreground)]">
            المصدر: قاعدة بيانات أطعمة Alkemos — نفس الصفوف التي تعرضها صفحة كل صنف (قيم لكل
            100 جرام؛ كل اسم يوصل لصفحة الصنف كاملة).
          </p>
        </section>

        {/* قراءة الجدول (أحكام سياقية بقواعد شفافة) */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">كيف تقرأ الجدول</h2>
          <div className="mt-4 space-y-5">
            {list.verdicts.map((v, i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold tracking-tight">{v.heading.ar}</h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)] md:text-base">
                  {v.body.ar}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* أسئلة شائعة مرئية (نص صافٍ — بلا سكيما FAQPage بقانون العائلة) */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">أسئلة شائعة</h2>
          <div className="mt-4 space-y-5">
            {list.faqs.map((f, i) => (
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
              حوّل هذه الجداول إلى خطة:{" "}
              <Link href={toolHref} className="font-medium underline underline-offset-4 hover:text-[var(--text)]">
                {list.toolSlug === "macro-calculator" ? "حاسبة الماكروز" : "حاسبة السعرات"}
              </Link>{" "}
              تقسّم ميزانيتك اليومية إلى جرامات — مجانًا وبلا حساب.
            </p>
          </div>
        </section>

        {/* المجموعة المنتقاة ذات الصلة (تعميق المجموعات — روابط متبادلة §4.3) */}
        {collection && (
          <section className="mt-10">
            <div className="marble-card p-6">
              <p className="text-base font-normal text-[var(--text)]">
                جديد على الموضوع؟ ابدأ من مجموعة{" "}
                <Link href={`/ar/collections/${collection.slug}`} className="font-medium underline underline-offset-4 hover:text-[var(--text)]">
                  {collection.h1Ar}
                </Link>{" "}
                المنتقاة — الأساسيات المختارة يدويًا — ثم عد للترتيب الكامل.
              </p>
            </div>
          </section>
        )}

        {/* بقية القوائم المرتبة في العائلة */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">قوائم مرتبة أخرى</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {NUTRIENT_LISTS.filter((l) => l.slug !== list.slug).map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/ar/foods/lists/${l.slug}`}
                  className="marble-card inline-block px-4 py-2 text-sm font-medium hover:underline"
                >
                  {l.h1Ar}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <ShareButtons path={`/ar/foods/lists/${list.slug}`} title={list.titleAr} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
