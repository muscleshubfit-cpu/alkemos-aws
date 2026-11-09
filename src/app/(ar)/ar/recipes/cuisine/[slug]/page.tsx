import { RecipesTaxonomyHub, taxonomyMetadata } from "@/components/recipes/RecipesTaxonomyHub";

/**
 * /ar/recipes/cuisine/[slug] — Arabic mirror of the cuisine hub.
 * HEALTHY-RECIPES-PLATFORM plan §9.1 (the foods-mirror precedent).
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [
    "egyptian",
    "gulf",
    "arab",
    "mediterranean",
    "asian",
    "international",
  ].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return taxonomyMetadata("cuisine", slug, "ar");
}

export default async function CuisineHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipesTaxonomyHub kind="cuisine" slug={slug} lang="ar" />;
}
