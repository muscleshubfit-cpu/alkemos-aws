import { RecipesTaxonomyHub, taxonomyMetadata } from "@/components/recipes/RecipesTaxonomyHub";
import { RECIPE_GOALS } from "@/lib/recipes-shared";

/** /recipes/goal/[slug] — goal hub (EN). Plan §9.1. */
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
  return taxonomyMetadata("goal", slug, "en");
}

export default async function GoalHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipesTaxonomyHub kind="goal" slug={slug} lang="en" />;
}
