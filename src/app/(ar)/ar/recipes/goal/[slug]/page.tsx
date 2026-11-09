import { RecipesTaxonomyHub, taxonomyMetadata } from "@/components/recipes/RecipesTaxonomyHub";
import { RECIPE_GOALS } from "@/lib/recipes-shared";

/** /ar/recipes/goal/[slug] — Arabic mirror of the goal hub. */
export const revalidate = 3600;

export function generateStaticParams() {
  return RECIPE_GOALS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return taxonomyMetadata("goal", slug, "ar");
}

export default async function GoalHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipesTaxonomyHub kind="goal" slug={slug} lang="ar" />;
}
