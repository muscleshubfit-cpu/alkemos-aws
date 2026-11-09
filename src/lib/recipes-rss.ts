import { listRecipesForFeed, type RecipeFeedItem } from "@/lib/recipes-server";

/**
 * RECIPES RSS (HEALTHY-RECIPES-PLATFORM plan §9.1 / decision ق7 — a
 * separate feed per language, the blog rss.ts precedent).
 *
 * KEPT SEPARATE from src/lib/rss.ts on purpose: the blog feed builder
 * hardcodes /blog/ item links and blog-only channel fields; the recipes
 * family owns its own tiny builder with the same escaping discipline.
 */

export const RECIPES_RSS_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://alkemos.com";

const MAX_ITEMS = 50;

function esc(s: string): string {
  return s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function item(post: RecipeFeedItem, lang: "en" | "ar"): string {
  const base = RECIPES_RSS_SITE_URL;
  const link = `${base}${lang === "ar" ? "/ar" : ""}/recipes/${post.slug}`;
  const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : null;
  return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <description>${esc(post.excerpt)}</description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
    </item>`;
}

export async function buildRecipesRss(channel: {
  title: string;
  link: string;
  description: string;
  language: "en" | "ar";
  selfUrl: string;
}): Promise<string> {
  const posts = await listRecipesForFeed(channel.language, MAX_ITEMS);
  const items = posts.map((p) => item(p, channel.language)).join("\n");
  const lastBuild =
    posts.find((p) => p.published_at)?.published_at ?? null;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(channel.title)}</title>
    <link>${esc(channel.link)}</link>
    <description>${esc(channel.description)}</description>
    <language>${channel.language === "ar" ? "ar-eg" : "en-us"}</language>
    ${lastBuild ? `<lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>` : ""}
    <atom:link href="${esc(channel.selfUrl)}" rel="self" type="application/rss+xml" />
    <generator>Alkemos (Next.js)</generator>
${items}
  </channel>
</rss>`;
}
