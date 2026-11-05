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
 * /foods/lists/[slug] — Nutrient-ranked food lists (EN).
 *
 * SEO-GROWTH Phase 2 (owner order 2026-11-06 «استكمل المرحلة التالية من
 * خطة استعادة النمو… استكمل جميع الأعمال الممكنة حاليًا»), executing
 * audit 03 §4.3 / file 07's Phase-2 task line «10-15 قائمة «غني بـ{مغذٍّ}»
 * مبنية من قاعدة البيانات»: ten database-ranked lists (10 × 2 mirrors =
 * 20 URLs) that deepen the ten existing food collection hubs. NOT the
 * D-2-gated 500-item band enrichment — sitemap-foods and its selection
 * law stay byte-identical; these are NEW URLs of a NEW family (the
 * food-comparisons precedent), advertised via sitemap-collections.
 *
 * Schema law (§12.19 + audit 03 §6): ItemList + Breadcrumb only — the
 * FAQ is visible plain text, NOT FAQPage JSON-LD.
 *
 * Data truth: every row renders from the FOODS rows via
 * src/lib/food-nutrient-lists.ts (module-scope derivation) — the same
 * rows each linked food page shows.
 *
 * Bilingual mirror at /ar/foods/lists/[slug] (editorially independent
 * copy — order 414 law).
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return NUTRIENT_LISTS.map((l) => ({ slug: l.slug }));
}

const OG_IMAGE = "/images/og/og-home-en.png?v=4";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const list = getNutrientListBySlug(slug);
  if (!list) {
    return {
      title: "List Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/foods/lists/${list.slug}`;
  return {
    title: list.titleEn,
    description: list.descriptionEn,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `https://alkemos.com/ar/foods/lists/${list.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: list.titleEn,
      description: list.descriptionEn,
      siteName: "Alkemos",
      locale: "en_US",
      // SOCIAL-OG-4 (2026-11-06): no own content image on this page —
      // the homepage card is the default fallback (owner law).
      images: [{ url: OG_IMAGE, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: list.titleEn,
      description: list.descriptionEn,
      images: [OG_IMAGE],
    },
  };
}

export default async function NutrientListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = getNutrientListBySlug(slug);
  if (!list) notFound();

  const url = `https://alkemos.com/foods/lists/${list.slug}`;
  const toolHref = `/tools/${list.toolSlug}`;
  const collection = list.collectionSlug ? getFoodCollectionBySlug(list.collectionSlug) : null;

  // ItemList: the ranked foods (the list family's schema precedent —
  // the items are the site's own food pages).
  const itemListSchema = getItemListSchema({
    name: list.h1En,
    description: list.descriptionEn,
    items: list.rows.map((r) => ({
      name: `${r.nameEn} — nutrition page`,
      url: `https://alkemos.com/foods/${r.slug}`,
    })),
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Foods", url: "/foods" },
    { name: list.h1En, url },
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
          <span>{list.h1En}</span>
        </nav>

        {/* H1 + answer-first intro (AEO law: the direct answer leads) */}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
          {list.h1En}
        </h1>
        <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
          {list.introEn}
        </p>

        {/* The transparent ranking criterion (audit §4.3: شرح معيار الترتيب) */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">How this ranking works</h2>
          <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)] md:text-base">
            {list.criterionEn}
          </p>
        </section>

        {/* The ranked table — per-100g values from the FOODS rows */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">The table: top {list.rows.length}</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--edge)] bg-[var(--card)]">
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--edge)]">
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    #
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Food
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    {list.metricEn}
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Calories (kcal/100g)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edge)]">
                {list.rows.map((r, i) => (
                  <tr key={r.slug}>
                    <td className="px-3 py-2 text-right text-sm font-normal text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="px-3 py-2 text-right text-sm font-medium">
                      <Link href={`/foods/${r.slug}`} className="hover:underline">{r.nameEn}</Link>
                    </td>
                    <td className="px-3 py-2 text-center text-sm font-semibold">{r.value}</td>
                    <td className="px-3 py-2 text-center text-sm font-normal text-[var(--muted-foreground)]">{r.calories}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs font-normal text-[var(--muted-foreground)]">
            Source: the Alkemos food database — the same rows each food&rsquo;s page shows
            (per-100g values; every name links to that food&rsquo;s full page).
          </p>
        </section>

        {/* Contextual verdicts (transparent rules) */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Reading the table</h2>
          <div className="mt-4 space-y-5">
            {list.verdicts.map((v, i) => (
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
            {list.faqs.map((f, i) => (
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
              Turn these tables into a plan: the{" "}
              <Link href={toolHref} className="font-medium underline underline-offset-4 hover:text-[var(--text)]">
                {list.toolSlug === "macro-calculator" ? "Macro Calculator" : "Calorie Calculator"}
              </Link>{" "}
              splits your daily budget into grams — free, no account needed.
            </p>
          </div>
        </section>

        {/* The related curated collection (the §4.3 hub deepening — mutual links) */}
        {collection && (
          <section className="mt-10">
            <div className="marble-card p-6">
              <p className="text-base font-normal text-[var(--text)]">
                New to this topic? Start from the curated{" "}
                <Link href={`/collections/${collection.slug}`} className="font-medium underline underline-offset-4 hover:text-[var(--text)]">
                  {collection.h1En}
                </Link>{" "}
                collection — the hand-picked staples — then come back for the full ranking.
              </p>
            </div>
          </section>
        )}

        {/* The other ranked lists in the family */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">More ranked food lists</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {NUTRIENT_LISTS.filter((l) => l.slug !== list.slug).map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/foods/lists/${l.slug}`}
                  className="marble-card inline-block px-4 py-2 text-sm font-medium hover:underline"
                >
                  {l.h1En}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <ShareButtons path={`/foods/lists/${list.slug}`} title={list.titleEn} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
