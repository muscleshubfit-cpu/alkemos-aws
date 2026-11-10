import { buildRecipesRss, RECIPES_RSS_SITE_URL } from "@/lib/recipes-rss";

/**
 * GET /ar/recipes/rss.xml — Arabic recipes feed (RSS 2.0).
 * Decision ق7: a dedicated feed per language. Item links point at the
 * AR tree (the /ar prefix — the blog-feed §12.19 P0-2 law).
 */
export const revalidate = 3600;
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const xml = await buildRecipesRss({
    title: "وصفات Alkemos الصحية",
    link: `${RECIPES_RSS_SITE_URL}/ar/recipes`,
    description:
      "وصفات صحية بمكونات موزونة بالجرام وقيم غذائية لكل حصة من مراجع موثوقة — وصفة جديدة كل يوم.",
    language: "ar",
    selfUrl: `${RECIPES_RSS_SITE_URL}/ar/recipes/rss.xml`,
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
