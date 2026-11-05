import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FOOD_COLLECTIONS,
  getFoodCollectionBySlug,
  getFoodsForCollection,
} from "@/lib/hub-collections";
import { listsForCollection } from "@/lib/food-nutrient-lists";
import { CATEGORY_LABELS, TAG_LABELS } from "@/lib/foods-shared";
import { calculateNutrition } from "@/lib/foods-shared";
import { getHubDepth } from "@/lib/hub-depth";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { HubGuideSection, HubFaqSection } from "@/components/hubs/HubDepth";
import { getItemListSchema, getBreadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * /collections/[slug] — Food collection page (EN).
 *
 * SEO/GEO master plan Phase SEO-GEO-1 (2026-09-08): a curated food
 * collection page that organizes the 80 curated foods by goal/tag.
 * High-value targets:
 *   /collections/high-protein-foods — "high protein foods" (10K-100K searches/mo)
 *   /collections/low-carb-foods — "low carb foods" (10K-100K)
 *   /collections/keto-friendly-foods — "keto friendly foods" (10K-100K)
 *   /collections/foods-for-cutting — "best foods for cutting"
 *   /collections/vegan-protein-sources — "vegan protein sources"
 *
 * Bilingual mirror at /ar/collections/[slug].
 */

export const dynamicParams = true;

export function generateStaticParams() {
  return FOOD_COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getFoodCollectionBySlug(slug);
  if (!collection) {
    return {
      title: "Collection Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://alkemos.com/collections/${collection.slug}`;
  return {
    title: collection.titleEn,
    description: collection.descriptionEn,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ar: `https://alkemos.com/ar/collections/${collection.slug}`,
        "x-default": url,
      },
    },
    openGraph: {
      type: "website",
      url,
      title: collection.titleEn,
      description: collection.descriptionEn,
      siteName: "Alkemos",
      locale: "en_US",
      // PHASE 187 (deep-audit P0-2): og:image for the collection surface —
      // static branded family card (design mirrors /api/og-image).
      images: [
        {
          url: "/images/og/og-home-en.png?v=4",
          width: 1200,
          height: 630,
          alt: "Alkemos Curated Food Collections",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: collection.titleEn,
      description: collection.descriptionEn,
      images: ["/images/og/og-home-en.png?v=4"],
    },
  };
}

export default async function FoodCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getFoodCollectionBySlug(slug);
  if (!collection) notFound();

  const foods = getFoodsForCollection(collection);
  // Phase SEO-GEO-5.2: §6.3 template items 4+5 (guide + FAQ) — every food
  // collection has library rows, so depth content covers all ten slugs.
  const depth = getHubDepth("collection", collection.slug);
  const tagLabel = TAG_LABELS[collection.tag];

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Foods", url: "/foods" },
    { name: collection.h1En, url: `/collections/${collection.slug}` },
  ]);

  const itemListSchema = getItemListSchema({
    name: `${collection.h1En} — Alkemos`,
    description: collection.descriptionEn,
    items: foods.map((f) => ({
      name: f.nameEn,
      url: `/foods/${f.slug}`,
    })),
  });

  return (
    <>
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />

      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/foods" className="hover:underline">Foods</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{collection.h1En}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{collection.h1En}</h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          {collection.introEn}
        </p>
      </header>

      <div className="mb-8">
        <ShareButtons path={`/collections/${collection.slug}`} title={collection.h1En} />
      </div>

      {depth && <HubGuideSection depth={depth} lang="en" title="Nutrition Guide" />}

      <section aria-label="Food list" className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">All {collection.h1En}</h2>
          <span className="text-sm text-muted-foreground">{foods.length} foods</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.map((food) => {
            const perServing = calculateNutrition(food, food.defaultGrams);
            const catLabel = CATEGORY_LABELS[food.category];
            return (
              <li key={food.slug}>
                <Link
                  href={`/foods/${food.slug}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors"
                >
                  <div className="font-semibold text-foreground">{food.nameEn}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {catLabel.emoji} {catLabel.en} · Default serving: {food.defaultServingEn} ({food.defaultGrams}g)
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1 text-xs">
                    <div className="text-center">
                      <div className="text-muted-foreground">kcal</div>
                      <div className="font-semibold">{food.per100g.calories}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">P</div>
                      <div className="font-semibold">{food.per100g.protein}g</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">C</div>
                      <div className="font-semibold">{food.per100g.carbs}g</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">F</div>
                      <div className="font-semibold">{food.per100g.fat}g</div>
                    </div>
                  </div>
                  {perServing && (
                    <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                      Per serving: {perServing.calories} kcal · {perServing.protein}g protein
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Browse by category" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, lbl]) => {
            const count = foods.filter((f) => f.category === key).length;
            if (count === 0) return null;
            return (
              <Link
                key={key}
                href={`/foods?cat=${key}`}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
              >
                {lbl.emoji} {lbl.en} <span className="text-muted-foreground">({count})</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Other collections" className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Other Food Collections</h2>
        <div className="flex flex-wrap gap-2">
          {FOOD_COLLECTIONS.filter((c) => c.slug !== collection.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
            >
              {c.h1En}
            </Link>
          ))}
        </div>
      </section>

      {/* SEO-GROWTH Phase 2 (2026-11-06): the ranked-lists deepening —
          audit 03 §4.3 «تعميق المجموعات العشر القائمة» — each hub links
          to its nutrient-ranked list pages (mutual links with the
          /foods/lists/* family; renders only when the hub has any). */}
      {listsForCollection(collection.slug).length > 0 && (
        <section aria-label="Ranked lists from the database" className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Ranked Lists From Our Database</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The same foods, ranked by the numbers — real orderings computed from the full database,
            not hand-picked lists.
          </p>
          <div className="flex flex-wrap gap-2">
            {listsForCollection(collection.slug).map((l) => (
              <Link
                key={l.slug}
                href={`/foods/lists/${l.slug}`}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:border-primary transition-colors"
              >
                {l.h1En}
              </Link>
            ))}
          </div>
        </section>
      )}

      {depth && <HubFaqSection depth={depth} lang="en" title="Frequently Asked Questions" />}

      <section aria-label="Plan your nutrition" className="rounded-lg bg-muted/50 p-6">
        <h2 className="text-xl font-semibold mb-3">Plan Your Nutrition</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Calculate your daily calorie needs and macros, then plan meals from this collection.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/tools/calorie-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">Calorie Calculator</Link>
          <Link href="/tools/macro-calculator" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">Macro Calculator</Link>
          <Link href="/meal-planner" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90">AI Meal Planner</Link>
        </div>
      </section>
      </main>


        {/* Access-point fix (2026-09-14): shared marble footer — this
            public page now carries the same persistent link grid as the
            homepage (SiteFooter component). */}
      <SiteFooter />
    </>
  );
}
