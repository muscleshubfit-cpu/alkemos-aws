import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import {
  fetchRecipeDetail,
  listPublishedRecipeSlugs,
  buildRecipeHreflang,
} from "@/lib/recipes-server";
import {
  CUISINE_LABELS,
  recipeIngredientLine,
  type RecipeLanguage,
} from "@/lib/recipes-shared";
import {
  getRecipeSchema,
  getBreadcrumbSchema,
  SCHEMA_SUITABLE_FOR_DIET,
  jsonLd,
} from "@/lib/seo";

/**
 * /recipes/[slug] — the recipe detail page (EN).
 *
 * HEALTHY-RECIPES-PLATFORM plan §9.1/§9.2/§10. ONE LATIN SLUG PER PAIR:
 * the AR twin is the structural mirror /ar/recipes/[same-slug] — the
 * hreflang pair is complete by construction (the atomic publish RPC
 * publishes both versions together or nothing).
 *
 * ISR: cached with the recipes-detail tag; R6's revalidateTag flushes
 * a fresh pair everywhere within the hour TTL at worst.
 *
 * SCHEMA (§10-1): Recipe (full node — computed nutrition, HowToStep
 * instructions, honest Organization author, NO aggregateRating) +
 * BreadcrumbList. FAQPage stays OFF unless real questions exist (the
 * blog NO-FORCED-FILLER law — the visible FAQ renders as plain text).
 */
export const revalidate = 3600;

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await listPublishedRecipeSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

const SITE_URL = "https://alkemos.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await fetchRecipeDetail(slug, "en");
  if (!detail) {
    return {
      title: "Recipe Not Found — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const pageUrl = `${SITE_URL}/recipes/${slug}`;
  const title = detail.metaTitle ?? detail.title;
  const description =
    detail.metaDescription ??
    (detail.excerpt.length > 160 ? `${detail.excerpt.slice(0, 157)}…` : detail.excerpt);
  return {
    title: { absolute: `${title} | Alkemos` },
    description,
    alternates: {
      canonical: pageUrl,
      languages: buildRecipeHreflang("en", slug),
    },
    openGraph: {
      type: "article",
      url: pageUrl,
      title,
      description,
      siteName: "Alkemos",
      locale: "en_US",
      ...(detail.imageUrl
        ? { images: [{ url: detail.imageUrl, alt: detail.imageAlt ?? detail.title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(detail.imageUrl ? { images: [detail.imageUrl] } : {}),
    },
  };
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await fetchRecipeDetail(slug, "en");
  if (!detail) notFound();

  const lang: RecipeLanguage = "en";
  const pageUrl = `${SITE_URL}/recipes/${slug}`;
  const published = detail.publishedAt ?? new Date().toISOString();

  const recipeSchema = getRecipeSchema({
    lang: "en",
    title: detail.title,
    description: detail.excerpt,
    pageUrl,
    image: detail.imageUrl ?? undefined,
    datePublished: published,
    dateModified: published,
    recipeYield: detail.servings,
    prepMinutes: detail.prepMinutes,
    cookMinutes: detail.cookMinutes,
    cuisineLabels: detail.cuisines.map((c) => CUISINE_LABELS[c].en),
    suitableForDietLabels: detail.diets
      .map((d) => SCHEMA_SUITABLE_FOR_DIET[d])
      .filter((v): v is string => Boolean(v)),
    nutrition: {
      calories: Math.round(detail.caloriesPerServing),
      proteinG: Math.round(detail.proteinPerServing),
      carbsG: Math.round(detail.carbsPerServing),
      fatG: Math.round(detail.fatPerServing),
      fiberG: detail.fiberPerServing != null ? Math.round(detail.fiberPerServing) : null,
      saturatedFatG:
        detail.satFatPerServing != null ? Math.round(detail.satFatPerServing) : null,
      sodiumMg: detail.sodiumPerServing != null ? Math.round(detail.sodiumPerServing) : null,
    },
    recipeIngredient: detail.ingredients.map((ing) => recipeIngredientLine(ing, lang)),
    instructions: detail.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => s.text),
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Healthy Recipes", url: "/recipes" },
    { name: detail.title, url: `/recipes/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(recipeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <RecipeDetailView detail={detail} lang={lang} pageUrl={pageUrl} />
    </>
  );
}
