import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FOODS, getFoodBySlug, getRelatedFoods } from "@/lib/foods";
import { getCollectionsForFoodTags, type HubLinkMini } from "@/lib/hub-collections";
import { getBreadcrumbSchema, getReviewedWebPageSchema, jsonLd } from "@/lib/seo";
import FoodDetailClient from "@/app/(en)/foods/[slug]/FoodDetailClient";

const SITE_URL = "https://alkemos.com";

/**
 * Arabic mirror of /foods/[slug] — SEO 404 FIX (2026-09-01).
 *
 * Previously /ar/foods/<slug> returned a hard 404 while the Arabic foods
 * listing linked into it. This server component resolves the SAME
 * bilingual food row (src/lib/foods.ts, 8,830 foods with native nameAr /
 * defaultServingAr fields — the same data layer that powers the EN pages)
 * and renders it fully in Arabic.
 *
 * Own Arabic metadata: canonical /ar/foods/[slug] + hreflang pair +
 * og:locale ar_EG + Arabic NutritionInformation JSON-LD so answer engines
 * can cite the per-100g facts from the Arabic page.
 */

// VERCEL-USAGE-3 (2026-09-21): explicit 7-day ISR window — mirrors the EN
// route. Frozen reference data + crawlers sweeping thousands of distinct
// /ar/foods/<slug> URLs make per-request SSR the top Fluid CPU consumer;
// the ISR cache (live once the root layout de-dynamicization lands in
// this same change set) serves repeats without invoking the function.
// VERCEL-USAGE-9 (2026-10-09): 604800 → 86400 + generateStaticParams —
// mirrors the EN fix: the route still measured ƒ (per-request SSR) on
// Vercel because in Next 16 the revalidate export alone never engages
// ISR on a dynamic route without gSP. See the EN mirror for the full
// rationale; the USDA long tail keeps the on-demand path
// (dynamicParams = true) with the same 24h ISR window.
export const revalidate = 86400; // 24 hours

// VERCEL-USAGE-9 (2026-10-09): prerender the 80 CURATED foods — the
// exact deterministic set the foods sitemap advertises (tags.length > 0,
// the foods-sitemap-policy law — 80 foods × EN/AR mirrors = the 160
// sitemap URLs). Mirrors the EN route + sitemap-foods.xml's selection
// criterion so the prerendered surface and the advertised surface can
// never drift.
export async function generateStaticParams() {
  return FOODS.filter((f) => (f.tags?.length ?? 0) > 0).map((f) => ({
    slug: f.slug,
  }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const food = getFoodBySlug(slug);

  if (!food) {
    return {
      title: "الصنف الغذائي غير موجود",
      robots: { index: false, follow: false },
    };
  }

  // NOTE: no "| Alkemos" suffix — the /ar layout title template appends
  // the brand automatically (avoids "— Alkemos — Alkemos").
  const title = `${food.nameAr} — السعرات والماكروز لكل 100 جرام`;
  const description = `القيمة الغذائية لـ ${food.nameAr}: ${food.per100g.calories} سعرة، ${food.per100g.protein} جرام بروتين، ${food.per100g.carbs} جرام كربوهيدرات، ${food.per100g.fat} جرام دهون لكل 100 جرام. الحصة الافتراضية: ${food.defaultServingAr} (${food.defaultGrams} جرام).`;
  const url = `${SITE_URL}/ar/foods/${food.slug}`;

  // P2-12 (§12.37 — owner directive «… ثم ابدأ p2», plan item 12): the
  // USDA long tail ships ENGLISH as its `nameAr` (zero Arabic characters
  // — the Phase-141 data audit: 8,750 rows) — those AR mirrors render an
  // English H1 inside the Arabic locale: semantically-broken thin pages
  // that can never rank for Arabic queries while diluting AR crawl
  // budget. They now leave the index: noindex,follow (internal-link
  // crawl flow preserved; the EN twin stays fully indexable per the
  // owner-approved Phase-141 policy). Curated foods (real Arabic names,
  // the 160 sitemap-advertised URLs) remain fully indexable.
  const arabiclessName = !/[\u0600-\u06FF]/.test(food.nameAr);

  return {
    title,
    description,
    ...(arabiclessName ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: `/ar/foods/${food.slug}`,
      languages: {
        en: `${SITE_URL}/foods/${food.slug}`,
        ar: url,
        "x-default": `${SITE_URL}/foods/${food.slug}`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "Alkemos",
      locale: "ar_EG",
      // PHASE 187 (deep-audit P0-2): og:image for the AR food surface —
      // static branded family card (design mirrors /api/og-image).
      images: [
        {
          url: "/images/og/og-foods-ar.png?v=3",
          width: 1200,
          height: 630,
          alt: "قاعدة أطعمة وقيم غذائية من Alkemos",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/og/og-foods-ar.png?v=3"],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const food = getFoodBySlug(slug);

  // A-8 (Phase 141): real 404 instead of a 200 + noindex soft-404 —
  // protects crawl budget and cleans Search Console coverage reports.
  // (Blog detail pages already did this; the exercise page even
  // imported notFound without ever calling it.)
  if (!food) notFound();

  const breadcrumbSchema = food
    ? getBreadcrumbSchema([
        { name: "الرئيسية", url: "/ar" },
        { name: "الأطعمة", url: "/ar/foods" },
        { name: food.nameAr, url: `/ar/foods/${food.slug}` },
      ])
    : null;

  // GEO: Arabic NutritionInformation node — mirrors the EN page's schema
  // so AI answer engines can cite the ARABIC page for Arabic queries
  // ("كم سعرات صدور الفراخ").
  // Phase SEO-GEO-4.5 (§7.1 #6+#7): YMYL E-E-A-T — same review node as the
  // EN mirror, with the ARABIC page URL so the AR page earns its own signal.
  const reviewSchema = food
    ? getReviewedWebPageSchema({
        url: `https://alkemos.com/ar/foods/${food.slug}`,
        name: `${food.nameAr} — القيم الغذائية (لكل 100 جرام)`,
      })
    : null;
  const nutritionSchema = food
    ? {
        "@context": "https://schema.org",
        "@type": "NutritionInformation",
        name: `${food.nameAr} — القيم الغذائية (لكل 100 جرام)`,
        servingSize: "100 g",
        calories: `${food.per100g.calories} kcal`,
        proteinContent: `${food.per100g.protein} g`,
        carbohydrateContent: `${food.per100g.carbs} g`,
        fatContent: `${food.per100g.fat} g`,
      }
    : null;

  return (
    <>
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
        />
      )}
      {nutritionSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(nutritionSchema) }}
        />
      )}
      {reviewSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(reviewSchema) }}
        />
      )}
      <FoodDetailClient
        food={food ?? null}
        related={food ? getRelatedFoods(food) : []}
        collectionLinks={food ? getCollectionsForFoodTags(food.tags).map(
          (c): HubLinkMini => ({
            href: `/collections/${c.slug}`,
            labelEn: c.h1En,
            labelAr: c.h1Ar,
          }),
        ) : []}
        lang="ar"
      />
    </>
  );
}
