import { buildRecipesRss, RECIPES_RSS_SITE_URL } from "@/lib/recipes-rss";

/**
 * GET /recipes/rss.xml — English recipes feed (RSS 2.0).
 * HEALTHY-RECIPES-PLATFORM plan §9.1 (decision ق7): a dedicated feed
 * per language, the blog-feed precedent. Cached hourly; honest empty
 * channel until the first pair publishes.
 */
export const revalidate = 3600;
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const xml = await buildRecipesRss({
    title: "Alkemos Healthy Recipes",
    link: `${RECIPES_RSS_SITE_URL}/recipes`,
    description:
      "Healthy recipes with ingredients weighed in grams and clear per-serving nutrition from trusted references — a new recipe every day.",
    language: "en",
    selfUrl: `${RECIPES_RSS_SITE_URL}/recipes/rss.xml`,
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
