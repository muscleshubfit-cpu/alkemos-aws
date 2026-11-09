import { RecipesTaxonomyHub, taxonomyMetadata } from "@/components/recipes/RecipesTaxonomyHub";
import { RECIPE_MEAL_TYPES } from "@/lib/recipes-shared";

/** /recipes/meal/[slug] — meal-type hub (EN). Plan §9.1. */
export const revalidate = 3600;

export function generateStaticParams() {
  return RECIPE_MEAL_TYPES.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return taxonomyMetadata("meal", slug, "en");
}

export default async function MealHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipesTaxonomyHub kind="meal" slug={slug} lang="en" />;
}
