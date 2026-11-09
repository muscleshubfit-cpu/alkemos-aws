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
  stripTrailingBrandForArTemplate,
} from "@/lib/seo";

/**
 * /ar/recipes/[slug] — Arabic mirror of the recipe detail page.
 *
 * ONE LATIN SLUG PER PAIR: the same slug as the EN twin (structural
 * mirror — the toggle jumps straight to the twin, stronger than the
 * blog's linked_post handshake). Arabic metadata; the /ar layout
 * template appends «— Alkemos» so the stored meta title is fed through
 * stripTrailingBrandForArTemplate (the Phase-189 double-brand law).
 *
 * ISR + Recipe Schema: the same computed-nutrition node as the EN
 * mirror, inLanguage "ar", NO aggregateRating (honest-schema law).
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
  const detail = await fetchRecipeDetail(slug, "ar");
  if (!detail) {
    return {
      title: "الوصفة غير موجودة — Alkemos",
      robots: { index: false, follow: false },
    };
  }
  const pageUrl = `${SITE_URL}/ar/recipes/${slug}`;
  const title = detail.metaTitle ?? detail.title;
  const description =
    detail.metaDescription ??
    (detail.excerpt.length > 160 ? `${detail.excerpt.slice(0, 157)}…` : detail.excerpt);
  return {
    title: { absolute: stripTrailingBrandForArTemplate(title) },
    description,
    alternates: {
      canonical: pageUrl,
      languages: buildRecipeHreflang("ar", slug),
    },
    openGraph: {
      type: "article",
      url: pageUrl,
      title,
      description,
      siteName: "Alkemos",
      locale: "ar_EG",
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
  const detail = await fetchRecipeDetail(slug, "ar");
  if (!detail) notFound();

  const lang: RecipeLanguage = "ar";
  const pageUrl = `${SITE_URL}/ar/recipes/${slug}`;
  const published = detail.publishedAt ?? new Date().toISOString();

  const recipeSchema = getRecipeSchema({
    lang: "ar",
    title: detail.title,
    description: detail.excerpt,
    pageUrl,
    image: detail.imageUrl ?? undefined,
    datePublished: published,
    dateModified: published,
    recipeYield: detail.servings,
    prepMinutes: detail.prepMinutes,
    cookMinutes: detail.cookMinutes,
    cuisineLabels: detail.cuisines.map((c) => CUISINE_LABELS[c].ar),
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
    { name: "الرئيسية", url: "/ar" },
    { name: "الوصفات الصحية", url: "/ar/recipes" },
    { name: detail.title, url: `/ar/recipes/${slug}` },
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
