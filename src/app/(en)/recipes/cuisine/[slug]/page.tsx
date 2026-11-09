import { RecipesTaxonomyHub, taxonomyMetadata } from "@/components/recipes/RecipesTaxonomyHub";

/**
 * /recipes/cuisine/[slug] — cuisine hub (EN). Plan §9.1.
 * All six cuisines pre-rendered; dynamicParams stays closed (unknown
 * slugs 404 — they are not content).
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
  return taxonomyMetadata("cuisine", slug, "en");
}

export default async function CuisineHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipesTaxonomyHub kind="cuisine" slug={slug} lang="en" />;
}
