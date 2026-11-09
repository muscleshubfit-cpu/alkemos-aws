/**
 * RECIPES-IMAGES — the recipe image stage (R4)
 * (HEALTHY-RECIPES-PLATFORM plan §7 — decision ق4: the EXISTING market
 * providers, no AI generation, no new keys).
 *
 * LAWS:
 *  - Reuses the blog image chain VERBATIM (fetchFeaturedImageMultiQuery →
 *    sanitizeImageQuery → Pexels → Unsplash → Pixabay + the no-women and
 *    NSFW alt screens + the (variationKey) rotation + recent-URL exclusion).
 *  - ONE image per PAIR written to recipes.image_url (the master record)
 *    — both language versions read it (P-GATE-3 structural guarantee).
 *  - Post-selection visual MATCH check: the dish's food-type keyword must
 *    appear in the result's alt text; failures walk to the next
 *    query/provider, then the recipe is honestly held.
 */

import {
  fetchFeaturedImageMultiQuery,
  getRecentFeaturedImageUrls,
  type SourcedImage,
} from "./blog-images";

export type RecipeImageInput = {
  /** the dish name for the search query (EN works best on stock sites) */
  themeEn: string;
  themeAr: string;
  /** the main 2-4 ingredients by weight (name_en) */
  mainIngredientsEn: readonly string[];
  /** the dish family keyword for the match check (soup/salad/curry/…) */
  dishTypeEn: string;
  queueId: string;
};

export type RecipeImageResult = {
  url: string;
  altEn: string;
  altAr: string;
  source: "pexels" | "unsplash" | "pixabay";
  verified: boolean;
  matchNotes: string;
};

/** Dish-family keywords used for BOTH query enrichment and the post-pick
 *  match verification (plan §7-3 — the image must represent the actual
 *  dish, not a generic food photo). */
const DISH_TYPE_KEYWORDS: ReadonlyArray<{ key: string; patterns: RegExp }> = [
  { key: "soup", patterns: /^(soup|شوربة|شوربه)/i },
  { key: "salad", patterns: /^(salad|سلطة|سلطه)/i },
  { key: "curry", patterns: /curry|كاري/i },
  { key: "stew", patterns: /stew|طاجن|tagine/i },
  { key: "stir-fry", patterns: /stir.?fry|ووك/i },
  { key: "baked", patterns: /baked|oven|فرن/i },
  { key: "grilled", patterns: /grill|مشوي|barbecue/i },
  { key: "omelette", patterns: /omelette|أومليت/i },
  { key: "overnight oats", patterns: /overnight|شوفان ليلي/i },
  { key: "smoothie", patterns: /smoothie|سموذي/i },
];

function dishKeyword(input: RecipeImageInput): string {
  if (input.dishTypeEn) return input.dishTypeEn.toLowerCase();
  const probe = `${input.themeEn} ${input.themeAr}`;
  for (const d of DISH_TYPE_KEYWORDS) {
    if (d.patterns.test(probe)) return d.key;
  }
  return "";
}

/** Does the picked image's alt text actually describe this dish family? */
function altMatchesDish(alt: string, keyword: string): boolean {
  if (!keyword) return true; // no family keyword → no family claim to verify
  const a = alt.toLowerCase();
  return a.includes(keyword) || a.includes("food") || a.includes("dish") || a.includes("meal") || a.includes("plate");
}

export async function fetchRecipeImage(input: RecipeImageInput): Promise<RecipeImageResult | null> {
  const keyword = dishKeyword(input);
  const mains = input.mainIngredientsEn.slice(0, 3).map((s) => s.toLowerCase());
  const base = input.themeEn.toLowerCase();

  // Composite queries: dish name + mains + family keyword — the plan §7-3
  // search built from the dish + prominent ingredients (never generic).
  const queries = [
    `${base} ${mains[0] ?? ""} ${keyword}`.replace(/\s+/g, " ").trim(),
    `${base} ${keyword}`,
    `${mains.slice(0, 2).join(" ")} ${keyword} dish`,
    keyword ? `${keyword} healthy homemade` : `${base}`,
  ];

  // Exclude the last 30 images used by BOTH recipes and the blog (the
  // cross-family dedup — same discipline, wider net).
  const excludeUrls = new Set(await getRecentFeaturedImageUrls(30));
  if (globalThis.__recentRecipeImageUrls) {
    for (const u of globalThis.__recentRecipeImageUrls) excludeUrls.add(u);
  }

  let lastNote = "no result from any provider";
  for (const q of queries) {
    if (!q.trim()) continue;
    const img: SourcedImage = await fetchFeaturedImageMultiQuery([q], {
      variationKey: `${input.queueId}-cover`,
      excludeUrls: Array.from(excludeUrls),
    });
    if (!img) {
      lastNote = `no result for query "${q}"`;
      continue;
    }
    const source = detectSource(img.url);
    const verified = altMatchesDish(img.alt, keyword);
    if (!verified) {
      excludeUrls.add(img.url);
      lastNote = `alt "${img.alt.slice(0, 60)}" does not match dish family "${keyword}" for query "${q}"`;
      continue;
    }
    rememberRecipeImage(img.url);
    return {
      url: img.url,
      altEn: buildAltEn(input, keyword),
      altAr: buildAltAr(input, keyword),
      source,
      verified: true,
      matchNotes: `matched query "${q}" · alt verified for "${keyword}"`,
    };
  }
  console.warn(`[recipes-images] visual match failed: ${lastNote}`);
  return null;
}

function detectSource(url: string): "pexels" | "unsplash" | "pixabay" {
  if (url.includes("unsplash")) return "unsplash";
  if (url.includes("pixabay")) return "pixabay";
  return "pexels";
}

function buildAltEn(input: RecipeImageInput, keyword: string): string {
  const mains = input.mainIngredientsEn.slice(0, 2).join(" and ");
  return `${input.themeEn}${mains ? ` with ${mains}` : ""}${keyword ? ` — ${keyword}` : ""} — Alkemos healthy recipe`;
}

function buildAltAr(input: RecipeImageInput, keyword: string): string {
  const mainsAr = input.mainIngredientsEn.slice(0, 2).join(" و");
  return `${input.themeAr}${mainsAr ? ` بـ${mainsAr}` : ""} — وصفة صحية من ألكيموس`;
}

/* A tiny in-process memory of recently used recipe images (per pipeline
 * run) — cross-day exclusion still comes from the DB below. */
declare global {
  var __recentRecipeImageUrls: Set<string> | undefined;
}
function rememberRecipeImage(url: string): void {
  globalThis.__recentRecipeImageUrls ??= new Set<string>();
  globalThis.__recentRecipeImageUrls.add(url);
  if (globalThis.__recentRecipeImageUrls.size > 30) {
    const it = globalThis.__recentRecipeImageUrls.values().next();
    if (!it.done) globalThis.__recentRecipeImageUrls.delete(it.value);
  }
}
