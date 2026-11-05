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
 * /foods/compare/[slug] — Food-vs-food comparison page (EN).
 *
 * SEO-GROWTH-P4 pilot (owner order 2026-11-05 «اختبار محدود قابل للقياس»),
 * executing audit 03 §4.2: X-vs-Y pairs from the curated+enriched foods,
 * targeting the measured Arabic PAA patterns («موز أم تفاح؟»…) and their
 * EN equivalents. 4 pairs × 2 mirrors = 8 URLs — deliberately NOT a
 * 500-page batch (the owner's explicit ceiling for this phase).
 *
 * Schema law (§12.19 DO-NOT + audit 03 §6): ItemList + Breadcrumb only —
 * the FAQ is visible plain text, NOT FAQPage JSON-LD.
 *
 * Data truth: every number renders from the FOODS rows via
 * src/lib/food-comparisons.ts (module-scope derivation) — the same rows
 * the two linked food pages show.
 *
 * Bilingual mirror at /ar/foods/compare/[slug] (editorially independent
 * copy — order 414 law).
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return FOOD_COMPARISONS.map((c) => ({ slug: c.slug }));
}

const OG_IMAGE = "/images/og/og-foods-en.png?v=3";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getFoodComparisonBySlug(slug);
  if (!comparison) {
    return {
      title: "Comparison Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/foods/compare/${comparison.slug}`;
  return {
    title: comparison.titleEn,
    description: comparison.descriptionEn,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `https://alkemos.com/ar/foods/compare/${comparison.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: comparison.titleEn,
      description: comparison.descriptionEn,
      siteName: "Alkemos",
      locale: "en_US",
      // SOCIAL-OG-3 family law: the pilot rides the FOODS family card
      // (per-pair cards are not generated — the tools/collections
      // family-card precedent).
      images: [{ url: OG_IMAGE, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: comparison.titleEn,
      description: comparison.descriptionEn,
      images: [OG_IMAGE],
    },
  };
}

function MacroRow({
  label,
  a,
  b,
  unit = "g",
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
  lang,
}: {
  name: string;
  n: FoodPairNutrition;
  href: string;
  lang: "en" | "ar";
}) {
  return (
    <div className="marble-card p-5">
      <Link href={href} className="text-base font-semibold hover:underline">
        {name}
      </Link>
      <p className="mt-1 text-sm font-normal text-[var(--muted-foreground)]">
        {lang === "en" ? `Typical serving: ${n.servingLabelEn} (${n.servingGrams}g)` : `الحصة الشائعة: ${n.servingLabelAr} (${n.servingGrams} جرام)`}
      </p>
      <p className="mt-2 text-sm font-normal leading-relaxed">
        {lang === "en" ? (
          <>
            <strong className="font-semibold">{n.serving.calories}</strong> kcal ·{" "}
            {n.serving.protein}g protein · {n.serving.carbs}g carbs · {n.serving.fat}g fat
          </>
        ) : (
          <>
            <strong className="font-semibold">{n.serving.calories}</strong> سعرة ·{" "}
            {n.serving.protein} جم بروتين · {n.serving.carbs} جم كربوهيدرات · {n.serving.fat} جم دهون
          </>
        )}
      </p>
    </div>
  );
}

export default async function FoodComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comparison = getFoodComparisonBySlug(slug);
  if (!comparison) notFound();

  const foodA = getFoodBySlug(comparison.aSlug)!;
  const foodB = getFoodBySlug(comparison.bSlug)!;
  const url = `https://alkemos.com/foods/compare/${comparison.slug}`;
  const toolHref = `/tools/${comparison.toolSlug}`;

  // ItemList: the two compared foods (the compare family's schema
  // precedent — the items are the site's own food pages).
  const itemListSchema = getItemListSchema({
    name: `${foodA.nameEn} vs ${foodB.nameEn}`,
    description: comparison.descriptionEn,
    items: [
      {
        name: `${foodA.nameEn} — nutrition page`,
        url: `https://alkemos.com/foods/${foodA.slug}`,
      },
      {
        name: `${foodB.nameEn} — nutrition page`,
        url: `https://alkemos.com/foods/${foodB.slug}`,
      },
    ],
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Foods", url: "/foods" },
    { name: comparison.h1En, url },
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm font-normal text-[var(--muted-foreground)]">
          <Link href="/foods" className="hover:underline">Foods</Link>
          <span className="mx-1.5">/</span>
          <span>{comparison.h1En}</span>
        </nav>

        {/* H1 + answer-first intro (AEO law: the direct answer leads) */}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
          {comparison.h1En}
        </h1>
        <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
          {comparison.introEn}
        </p>

        {/* The comparison table — per 100g (the food pages' own rows) */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            The numbers: {foodA.nameEn} vs {foodB.nameEn}
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--edge)] bg-[var(--card)]">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--edge)]">
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Per 100g
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-sm font-semibold">
                    <Link href={`/foods/${foodA.slug}`} className="hover:underline">{foodA.nameEn}</Link>
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-sm font-semibold">
                    <Link href={`/foods/${foodB.slug}`} className="hover:underline">{foodB.nameEn}</Link>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edge)]">
                <MacroRow label="Calories" a={comparison.a.per100g.calories} b={comparison.b.per100g.calories} unit=" kcal" />
                <MacroRow label="Protein" a={comparison.a.per100g.protein} b={comparison.b.per100g.protein} />
                <MacroRow label="Carbs" a={comparison.a.per100g.carbs} b={comparison.b.per100g.carbs} />
                <MacroRow label="Fat" a={comparison.a.per100g.fat} b={comparison.b.per100g.fat} />
                <MacroRow label="Fiber" a={comparison.a.per100g.fiber} b={comparison.b.per100g.fiber} />
                <MacroRow label="Sugar" a={comparison.a.per100g.sugar} b={comparison.b.per100g.sugar} />
                <MacroRow label="Protein per 100 kcal" a={comparison.a.proteinPer100kcal} b={comparison.b.proteinPer100kcal} unit="g" />
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs font-normal text-[var(--muted-foreground)]">
            Source: the Alkemos food database — the same rows each food&rsquo;s page shows
            (per-100g values; serving values derive from each food&rsquo;s default serving).
          </p>
        </section>

        {/* Per real serving */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">What a real serving looks like</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ServingBlock name={foodA.nameEn} n={comparison.a} href={`/foods/${foodA.slug}`} lang="en" />
            <ServingBlock name={foodB.nameEn} n={comparison.b} href={`/foods/${foodB.slug}`} lang="en" />
          </div>
        </section>

        {/* Contextual verdicts (transparent rules) */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Which one, for which goal</h2>
          <div className="mt-4 space-y-5">
            {comparison.verdicts.map((v, i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold tracking-tight">{v.heading.en}</h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)] md:text-base">
                  {v.body.en}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Visible FAQ (plain text — answerable; NO FAQPage schema by law) */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Common questions</h2>
          <div className="mt-4 space-y-5">
            {comparison.faqs.map((f, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold leading-snug">{f.q.en}</h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">{f.a.en}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ONE contextual tool bridge (audit 06 §3: value before the ask) */}
        <section className="mt-10">
          <div className="marble-card p-6 text-center">
            <p className="text-base font-normal text-[var(--text)]">
              Turn these numbers into a plan: the{" "}
              <Link href={toolHref} className="font-medium underline underline-offset-4 hover:text-[var(--text)]">
                {comparison.toolSlug === "macro-calculator" ? "Macro Calculator" : "Calorie Calculator"}
              </Link>{" "}
              splits your daily budget into grams — free, no account needed.
            </p>
          </div>
        </section>

        {/* Other comparisons in the pilot family */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">More food comparisons</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {FOOD_COMPARISONS.filter((c) => c.slug !== comparison.slug).map((c) => {
              const ca = getFoodBySlug(c.aSlug)!;
              const cb = getFoodBySlug(c.bSlug)!;
              return (
                <li key={c.slug}>
                  <Link
                    href={`/foods/compare/${c.slug}`}
                    className="marble-card inline-block px-4 py-2 text-sm font-medium hover:underline"
                  >
                    {ca.nameEn} vs {cb.nameEn}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-10">
          <ShareButtons path={`/foods/compare/${comparison.slug}`} title={comparison.titleEn} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
