import { RecipesTaxonomyHub, taxonomyMetadata } from "@/components/recipes/RecipesTaxonomyHub";
import { RECIPE_DIETS } from "@/lib/recipes-shared";

/** /ar/recipes/diet/[slug] — Arabic mirror of the diet hub (rule copy in Arabic). */
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
  return taxonomyMetadata("diet", slug, "ar");
}

export default async function DietHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RecipesTaxonomyHub kind="diet" slug={slug} lang="ar" />;
}
