import { RecipesTaxonomyHub, taxonomyMetadata } from "@/components/recipes/RecipesTaxonomyHub";
import { RECIPE_MEAL_TYPES } from "@/lib/recipes-shared";

/** /ar/recipes/meal/[slug] — Arabic mirror of the meal-type hub. */
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
  return taxonomyMetadata("meal", slug, "ar");
}

export default async function MealHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipesTaxonomyHub kind="meal" slug={slug} lang="ar" />;
}
