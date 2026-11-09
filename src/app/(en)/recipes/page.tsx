import { RecipesExplorer } from "@/components/recipes/RecipesExplorer";
import { parseRecipesQuery } from "@/components/recipes/url";

/**
 * Healthy Recipes list (EN) — SERVER-RENDERED.
 *
 * HEALTHY-RECIPES-PLATFORM plan §9.1 — the FoodsExplorer pattern:
 * URL-state filters, zero-JS pagination, crawlable taxonomy pills.
 * Layout metadata (canonical/hreflang/OG) is declared by
 * src/app/(en)/recipes/layout.tsx.
 */
export default async function RecipesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  return <RecipesExplorer lang="en" query={parseRecipesQuery(sp)} />;
}
