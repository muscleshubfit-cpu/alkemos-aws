import { RecipesTaxonomyHub, taxonomyMetadata } from "@/components/recipes/RecipesTaxonomyHub";
import { RECIPE_DIETS } from "@/lib/recipes-shared";

/**
 * /recipes/diet/[slug] — diet hub (EN). Plan §9.1: the page explains
 * the RULE behind the listing (dietHubCopy — real value, not list fluff).
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return RECIPE_DIETS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return taxonomyMetadata("diet", slug, "en");
}

export default async function DietHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipesTaxonomyHub kind="diet" slug={slug} lang="en" />;
}
