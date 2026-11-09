import { RecipesExplorer } from "@/components/recipes/RecipesExplorer";
import { parseRecipesQuery } from "@/components/recipes/url";

/**
 * Arabic mirror of /recipes — SERVER-RENDERED (the foods mirror
 * precedent): passes `lang="ar"` to force Arabic rendering. RTL comes
 * from the /ar layout's dir="rtl"; Content-Language: ar from the
 * middleware. Layout metadata lives in the AR recipes layout.
 */
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  return <RecipesExplorer lang="ar" query={parseRecipesQuery(sp)} />;
}
