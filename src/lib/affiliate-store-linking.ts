/**
 * STORE-LINKING — the smart internal-linking engine of the Alkemos
 * Affiliate Store (Phase 529, owner order 2026-11-27 «نظام الربط
 * الداخلي الذكي»).
 *
 * THE INTELLIGENCE MODEL (real relevance, never random keyword
 * stuffing — the owner's explicit law):
 *   score(product, page) = category-topic map match (the strong signal)
 *   + weighted token overlap between the PAGE text (title ×3, headings
 *   ×2, body ×1) and the PRODUCT text (title ×3, brand ×2, category
 *   name/tokens ×2, summary ×1). A suggestion requires a category-map
 *   hit OR ≥3 distinct content-token matches — anything weaker never
 *   reaches the table.
 *
 * THE RENDER LAW (insertStoreLinks — the blog-tool-links discipline):
 *   - **EN ONLY**: lang !== 'en' is a hard no-op (the store's §0
 *     language separation; canary-pinned).
 *   - The stored page content is NEVER modified — links are injected at
 *     RENDER time (idempotent pure function over the markdown).
 *   - Links point to the INTERNAL product page
 *     (/affiliate-store/[category]/[slug]) — never directly to Amazon
 *     (the buy unit + its OA disclosure live on the product page).
 *   - Max `max_links_per_page`, one link per product, never inside an
 *     existing markdown link/image/heading/table, first-occurrence only.
 *
 * THE LIFECYCLE:
 *   scanLinkSuggestions() — refresh suggestions for every EN surface.
 *   applyLinkSuggestions() — approve ≥ threshold (auto or admin) →
 *     inline_links rows + surface bindings for the rail.
 *   deactivateAffiliateStoreLinksForProducts() — hide propagation.
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase/admin";
import type { Database } from "./supabase/types";
import { getAffiliateStoreAutomationSettings } from "./affiliate-store-automation";
import { WORKOUT_PROGRAMS } from "./workout-programs";
import { EXERCISES } from "./exercises";

/* ───────────────────────── the category-topic map ───────────────────────── */

/**
 * The strong signal: which EN topic tokens map to which store category
 * (leaf) slug. A page whose text carries these tokens is a candidate
 * host for that category's products. Deliberately conservative — a
 * mapping here means REAL topical kinship, not a shared word.
 */
export const CATEGORY_TOPIC_MAP: Record<string, string[]> = {
  "protein-powders": ["protein powder", "whey protein", "casein", "plant protein", "protein shake", "protein supplement", "post-workout shake"],
  "creatine-amino-acids": ["creatine", "bcaa", "eaa", "amino acid"],
  "vitamins-minerals-omegas": ["vitamin", "multivitamin", "omega-3", "fish oil", "vitamin d", "magnesium", "micronutrient", "mineral"],
  "pre-workout-energy-formulas": ["pre-workout", "pre workout"],
  "electrolytes-hydration-mixes": ["electrolyte", "hydration", "mineral drink"],
  "energy-gels-chews": ["energy gel", "energy chew", "race fuel"],
  "protein-bars-functional-snacks": ["protein bar", "protein snack", "protein bars"],
  "nuts-seeds-trail-mixes": ["trail mix", "almond", "pistachio", "nuts", "chia seed", "mixed nuts"],
  "nut-butters-spreads": ["peanut butter", "almond butter", "nut butter"],
  "low-sugar-diet-friendly-foods": ["low sugar", "sugar-free", "low carb snack"],
  "specialty-baking-cooking-ingredients": ["protein flour", "sweetener", "sugar substitute", "almond flour"],
  "coffees-teas": ["green tea", "black coffee", "coffee", "tea"],
  "adjustable-fixed-dumbbells": ["dumbbell", "dumbbells", "adjustable dumbbell"],
  "kettlebells": ["kettlebell", "kettlebell swing", "kettlebells"],
  "barbells-plates-collars": ["barbell", "olympic bar", "weight plate", "bumper plate", "plates"],
  "resistance-bands-tubes": ["resistance band", "resistance bands", "loop band", "mini band"],
  "functional-plyometric-tools": ["medicine ball", "slam ball", "battle rope", "agility"],
  "power-racks-benches-pull-up-bars": ["power rack", "squat rack", "weight bench", "pull-up bar", "pull up bar", "bench press"],
  "home-gyms-cable-stations": ["home gym", "cable machine", "functional trainer", "home gym machine"],
  "treadmills-walking-pads": ["treadmill", "walking pad", "indoor walking", "running machine"],
  "exercise-spin-bikes": ["exercise bike", "spin bike", "stationary bike", "indoor cycling"],
  "rowing-machines": ["rowing machine", "rower", "indoor rowing"],
  "ellipticals-steppers": ["elliptical", "stepper"],
  "yoga-mats-props": ["yoga mat", "yoga block", "yoga strap"],
  "foam-rollers-massage-tools": ["foam roller", "massage stick", "myofascial", "self-massage"],
  "percussive-massagers": ["massage gun", "percussive massage", "massage therapy"],
  "stretching-mobility-equipment": ["stretch strap", "mobility tool", "stretching equipment"],
  "digital-food-scales-measuring-tools": ["food scale", "kitchen scale", "measuring cup", "measuring spoon"],
  "meal-prep-containers-storage": ["meal prep container", "meal prep", "food storage container", "batch cooking"],
  "blenders-personal-blenders": ["blender", "smoothie", "personal blender"],
  "healthy-cooking-appliances": ["air fryer", "airfryer", "steamer", "indoor grill"],
  "smart-body-composition-scales": ["smart scale", "body fat scale", "body composition", "body fat percentage"],
  "body-fat-calipers-measuring-tapes": ["body fat caliper", "caliper", "measuring tape", "body measurements"],
  "fitness-smartwatches-gps-watches": ["smartwatch", "fitness tracker", "gps watch", "garmin", "fitbit", "apple watch"],
  "heart-rate-monitors": ["heart rate monitor", "heart rate strap", "chest strap", "hrm"],
  "sport-earbuds-headphones": ["sport earbuds", "running headphones", "workout earbuds", "bone conduction"],
  "insulated-smart-water-bottles": ["water bottle", "insulated bottle", "hydration bottle"],
  "shaker-mixer-bottles": ["shaker bottle", "protein shaker", "shaker"],
  "lifting-belts-straps-gloves": ["lifting belt", "weightlifting belt", "lifting strap", "wrist wrap", "gym glove"],
  "jump-ropes": ["jump rope", "skipping rope", "speed rope"],
  "gym-flooring-setup": ["gym floor", "floor mat", "rubber tile"],
  "weight-storage": ["dumbbell rack", "plate tree", "weight storage"],
  "gym-training-bags": ["gym bag", "duffel bag", "gym backpack"],
  "gym-chalk-grip": ["gym chalk", "lifting chalk", "grip"],
  "running-footwear": ["running shoe", "running shoes", "running footwear"],
  "training-gym-footwear": ["training shoe", "gym shoe", "lifting shoe", "cross trainer"],
  "socks-base-layers": ["training sock", "running sock", "base layer"],
  "fitness-nutrition-books": ["fitness book", "training book", "nutrition book", "strength training book"],
  "training-logs-planners": ["training log", "workout journal", "fitness journal", "training planner"],
  "sleep-recovery-tools": ["sleep mask", "recovery tool", "sleep tracking"],
  "herbal-adaptogenic-supplements": ["ashwagandha", "adaptogen", "herbal supplement"],
  "joint-bone-support": ["joint support", "collagen", "glucosamine", "joint health"],
  "recovery-electrolyte-supplements": ["recovery drink", "post-workout recovery"],
  "activity-sleep-trackers": ["sleep tracker", "activity tracker", "fitness band"],
  "connected-training-tech": ["smart rope", "smart gym", "connected fitness"],
};

/** Reverse map: token → category slugs (built once). */
const TOKEN_TO_CATEGORIES = (() => {
  const map = new Map<string, string[]>();
  for (const [cat, tokens] of Object.entries(CATEGORY_TOPIC_MAP)) {
    for (const token of tokens) {
      const key = token.toLowerCase();
      const list = map.get(key) ?? [];
      list.push(cat);
      map.set(key, list);
    }
  }
  return map;
})();

/* ───────────────────────── pure scoring engine ───────────────────────── */

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "with", "on", "at", "by", "is", "are",
  "was", "were", "be", "been", "being", "it", "its", "this", "that", "these", "those", "as", "from",
  "your", "you", "we", "our", "their", "they", "he", "she", "his", "her", "not", "no", "but", "can",
  "will", "would", "should", "could", "may", "might", "must", "have", "has", "had", "do", "does",
  "did", "if", "then", "than", "so", "such", "more", "most", "less", "least", "very", "much",
  "how", "what", "when", "where", "which", "who", "whom", "why", "also", "into", "over", "under",
  "about", "after", "before", "between", "during", "through", "up", "down", "out", "off", "again",
  "further", "once", "here", "there", "all", "any", "both", "each", "few", "other", "some", "own",
  "same", "too", "just", "because", "while", "until", "ai", "vs", "per", "one", "two", "three",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && t.length <= 24 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));
}

export type PageText = {
  title: string;
  body: string; // markdown/plain body (headings included)
};

export type ProductText = {
  productId: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  brand: string | null;
  summary: string;
};

export type RelevanceMatch = {
  productId: string;
  score: number;
  reason: string;
  matchedTokens: string[];
  categoryHit: boolean;
};

/**
 * Score one product against one page (0..100). The scale:
 *   category-map hit: +40 base (the topical kinship signal)
 *   each distinct matched token: title 8 / heading 5 / body 3 (capped)
 *   exact product-title phrase in page: +10
 * Threshold guidance: ≥30 is a real match (the default threshold).
 */
export function scoreProductForPage(product: ProductText, page: PageText): RelevanceMatch | null {
  const pageLower = `${page.title}\n${page.body}`.toLowerCase();
  const titleTokens = new Set(tokenize(page.title));
  const headingLines = page.body
    .split("\n")
    .filter((l) => /^#{1,6}\s/.test(l.trim()))
    .join(" ");
  const headingTokens = new Set(tokenize(headingLines));
  const bodyTokens = new Set(tokenize(page.body));

  // 1) category-map hit (the strong signal)
  const categoryTokens = CATEGORY_TOPIC_MAP[product.categorySlug] ?? [];
  const matchedMapTokens = categoryTokens.filter((t) => pageLower.includes(t.toLowerCase()));
  const categoryHit = matchedMapTokens.length > 0;

  // 2) token overlap (product side)
  const productTokens = new Set([
    ...tokenize(product.title),
    ...(product.brand ? tokenize(product.brand) : []),
    ...tokenize(product.categoryName),
    ...tokenize(product.summary).slice(0, 30),
  ]);

  let score = 0;
  const matchedTokens: string[] = [];
  if (categoryHit) {
    score += 40;
    matchedTokens.push(...matchedMapTokens.slice(0, 4));
  }
  let tokenMatches = 0;
  for (const token of productTokens) {
    if (tokenMatches >= 6) break;
    let weight = 0;
    if (titleTokens.has(token)) weight = 8;
    else if (headingTokens.has(token)) weight = 5;
    else if (bodyTokens.has(token)) weight = 3;
    if (weight > 0) {
      score += weight;
      tokenMatches += 1;
      if (matchedTokens.length < 8) matchedTokens.push(token);
    }
  }

  // 3) exact title phrase (long product names are a strong signal)
  const phrase = product.title.toLowerCase().split(",")[0].trim();
  if (phrase.length >= 12 && pageLower.includes(phrase)) {
    score += 10;
  }

  // Gate: a suggestion needs a category hit OR ≥3 distinct token matches
  if (!categoryHit && tokenMatches < 3) return null;
  if (score < 20) return null;

  return {
    productId: product.productId,
    score: Math.min(100, score),
    reason: `${categoryHit ? "category-topic match" : "token overlap"}: ${matchedTokens.slice(0, 6).join(", ")}`,
    matchedTokens,
    categoryHit,
  };
}

/* ───────────────────────── render-time injection (EN ONLY) ───────────────────────── */

/** The render-path link shape (the public view model — camelCase). */
export type InlineLinkRow = {
  productId: string;
  anchorPhrase: string;
  slug: string;
  categorySlug: string;
  title: string;
};

/** Hard anti-spam cap (also enforced by the settings value at apply time). */
const RENDER_CAP = 4;

const MD_LINK_SPLIT = /(!?\[[^\]]*\]\([^)]*\))/g;
const SKIP_LINE = /^(#{1,6}\s|>|\||\s*[-*_]{3,}\s*$|!\[)/;
const WORD_CHAR = /[0-9A-Za-z]/;

/**
 * insertStoreLinks — the render-time injection (the insertToolLinks
 * discipline, store-shaped). EN ONLY: any other language is a NO-OP.
 * Links are internal (to the store product page). Idempotent (an
 * already-linked product is skipped), capped, never inside existing
 * links/headings/tables/images, first-occurrence-only.
 */
export function insertStoreLinks(
  md: string,
  lang: string,
  links: InlineLinkRow[],
): { md: string; inserted: Array<{ productId: string; url: string; anchor: string }> } {
  if (!md || md.length < 200) return { md, inserted: [] };
  if (lang !== "en") return { md, inserted: [] }; // THE LANGUAGE LAW (§0)
  const usable = links.slice(0, RENDER_CAP);
  if (usable.length === 0) return { md, inserted: [] };

  let result = md;
  const inserted: Array<{ productId: string; url: string; anchor: string }> = [];

  for (const link of usable) {
    const url = `/affiliate-store/${link.categorySlug}/${link.slug}`;
    if (result.includes(`](${url})`) || result.includes(`(${url}`)) continue; // idempotence
    const phrase = link.anchorPhrase.trim();
    if (phrase.length < 4 || phrase.length > 60) continue;
    const wrapped = tryWrapFirstOccurrence(result, phrase, url);
    if (wrapped) {
      result = wrapped.text;
      inserted.push({ productId: link.productId, url, anchor: wrapped.anchor });
    }
  }
  return { md: result, inserted };
}

function tryWrapFirstOccurrence(
  text: string,
  phrase: string,
  url: string,
): { text: string; anchor: string } | null {
  const needle = phrase.toLowerCase();
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SKIP_LINE.test(line.trim())) continue;
    // split on existing markdown links/images — only plain fragments qualify
    const fragments = line.split(MD_LINK_SPLIT);
    for (let f = 0; f < fragments.length; f++) {
      const fragment = fragments[f];
      if (f % 2 === 1) continue; // inside an existing link/image
      // EVERY occurrence inside the fragment, in order — the first one
      // that passes the boundary check wins (a mid-word hit like
      // "Dumbbellsrule" never splits; the clean later occurrence links)
      const lower = fragment.toLowerCase();
      let idx = lower.indexOf(needle);
      while (idx !== -1) {
        const before = idx > 0 ? fragment[idx - 1] : " ";
        const after = idx + needle.length < fragment.length ? fragment[idx + needle.length] : " ";
        if (!WORD_CHAR.test(before) && !WORD_CHAR.test(after)) {
          const anchor = fragment.slice(idx, idx + needle.length);
          fragments[f] =
            fragment.slice(0, idx) + `[${anchor}](${url})` + fragment.slice(idx + needle.length);
          lines[i] = fragments.join("");
          return { text: lines.join("\n"), anchor };
        }
        idx = lower.indexOf(needle, idx + needle.length);
      }
    }
  }
  return null;
}

/* ───────────────────────── the scan (EN surfaces) ───────────────────────── */

type ScannedPage = {
  page_type: string;
  page_slug: string;
  title: string;
  body: string;
};

export type LinkScanResult = {
  pagesScanned: number;
  productsConsidered: number;
  suggestionsWritten: number;
  autoApplied: number;
};

async function fetchEnBlogPages(): Promise<ScannedPage[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("blog_posts")
    .select("slug,title,content,excerpt,category,tags,keywords")
    .eq("is_published", true)
    .eq("language", "en") // THE LANGUAGE LAW: EN posts only
    .limit(400);
  return ((data ?? []) as Array<{
    slug: string; title: string; content: string; excerpt: string | null;
    category: string; tags: string[]; keywords: string[];
  }>).map((p) => ({
    page_type: "blog",
    page_slug: p.slug,
    title: p.title,
    body: `${p.content}\n${p.excerpt ?? ""}\n${p.category}\n${(p.tags ?? []).join(" ")}\n${(p.keywords ?? []).join(" ")}`,
  }));
}

async function fetchEnRecipePages(): Promise<ScannedPage[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("recipe_versions")
    .select("slug,title,excerpt,steps,tips,substitutions")
    .eq("is_published", true)
    .eq("language", "en") // EN recipe halves only
    .limit(400);
  const out: ScannedPage[] = [];
  for (const r of (data ?? []) as Array<{
    slug: string; title: string; excerpt: string; steps: unknown; tips: string | null; substitutions: unknown;
  }>) {
    const stepsText = Array.isArray(r.steps)
      ? r.steps.map((s) => (typeof s === "object" && s ? JSON.stringify(s) : String(s ?? ""))).join(" ")
      : "";
    out.push({
      page_type: "recipe",
      page_slug: r.slug,
      title: r.title,
      body: `${r.excerpt ?? ""}\n${stepsText}\n${r.tips ?? ""}`,
    });
  }
  return out;
}

function fetchProgramPages(): ScannedPage[] {
  return WORKOUT_PROGRAMS.map((p) => ({
    page_type: "program",
    page_slug: p.slug,
    title: p.nameEn,
    body: [
      p.nameEn,
      p.descriptionEn,
      p.methodologyEn,
      p.progressionEn ?? "",
      p.forWhomEn ?? "",
      (p.days ?? []).map((d) => d.titleEn ?? "").join(" "),
    ].join("\n"),
  }));
}

function fetchExercisePages(): ScannedPage[] {
  // The exercise library is large but static and cheap to scan — the
  // equipment tag is the real relevance signal (a dumbbell exercise page
  // is a natural host for dumbbell products).
  return EXERCISES.map((e) => ({
    page_type: "exercise",
    page_slug: e.slug,
    title: e.nameEn,
    body: [e.nameEn, e.equipment, e.category, (e.primaryMuscles ?? []).join(" "), (e.instructionsEn ?? []).join(" ")].join("\n"),
  }));
}

/** The static EN tool/nutrition/resource pages worth product context. */
const STATIC_RESOURCE_PAGES: ScannedPage[] = [
  { page_type: "tool", page_slug: "calorie-calculator", title: "Calorie Calculator", body: "calorie calculator daily calorie intake maintenance deficit surplus tdee" },
  { page_type: "tool", page_slug: "macro-calculator", title: "Macro Calculator", body: "macro calculator protein carbs fat macronutrients macros protein intake" },
  { page_type: "tool", page_slug: "bmi-calculator", title: "BMI Calculator", body: "bmi body mass index weight height healthy weight" },
  { page_type: "tool", page_slug: "body-fat-calculator", title: "Body Fat Calculator", body: "body fat calculator body fat percentage caliper measurement navy method" },
  { page_type: "tool", page_slug: "water-tracker", title: "Water Tracker", body: "water tracker daily water intake hydration bottle" },
  { page_type: "nutrition", page_slug: "foods", title: "Foods Database", body: "foods database nutrition facts high protein foods protein intake" },
  { page_type: "resource", page_slug: "equipment", title: "Equipment Hub", body: "equipment home gym dumbbells kettlebells resistance bands barbell bench rack treadmill" },
];

/* ───────────────────────── scan + apply ───────────────────────── */

async function fetchPublishedProductTexts(): Promise<Array<ProductText & { id: string }>> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  // 527-L1: DIRECT reads stitched in code (no embeds).
  const [prodRes, catRes] = await Promise.all([
    supabaseAdmin
      .from("affiliate_store_products")
      .select("id,slug,title,summary,brand,category_id")
      .eq("is_published", true)
      .not("asin", "is", null)
      .not("image_url", "is", null)
      .limit(400),
    supabaseAdmin.from("affiliate_store_categories").select("id,slug,name"),
  ]);
  const cats = new Map(
    ((catRes.data ?? []) as Array<{ id: string; slug: string; name: string }>).map((c) => [c.id, c]),
  );
  return ((prodRes.data ?? []) as Array<{
    id: string; slug: string; title: string; summary: string; brand: string | null; category_id: string;
  }>)
    .map((p) => {
      const cat = cats.get(p.category_id);
      if (!cat) return null;
      return {
        id: p.id,
        productId: p.id,
        slug: p.slug,
        categorySlug: cat.slug,
        categoryName: cat.name,
        title: p.title,
        brand: p.brand,
        summary: p.summary,
      };
    })
    .filter((p): p is ProductText & { id: string } => p !== null);
}

/**
 * Pick the anchor phrase for a (page, product) pair: the longest product
 * title prefix that actually occurs in the page text (a natural anchor
 * the reader already sees); fallback: the strongest matched token pair.
 */
export function pickAnchorPhrase(product: ProductText, page: PageText, matchedTokens: string[]): string | null {
  const pageLower = `${page.title} ${page.body}`.toLowerCase();
  const title = product.title.trim();
  // try title comma-segments, longest first
  const segments = title.split(/[,(|]/).map((s) => s.trim()).filter((s) => s.length >= 8 && s.length <= 60);
  segments.sort((a, b) => b.length - a.length);
  for (const seg of segments) {
    if (pageLower.includes(seg.toLowerCase())) return seg;
  }
  // fallback: first two matched tokens as a phrase (only if the pair occurs)
  if (matchedTokens.length >= 2) {
    const pair = `${matchedTokens[0]} ${matchedTokens[1]}`;
    if (pageLower.includes(pair)) return pair;
  }
  if (matchedTokens.length === 1 && matchedTokens[0].length >= 5) return matchedTokens[0];
  return null;
}

/**
 * THE SCAN: refresh suggestions for every EN surface. Writes ONLY the
 * suggestion queue (application is a separate, threshold-gated step).
 */
export async function scanLinkSuggestions(): Promise<LinkScanResult> {
  const result: LinkScanResult = { pagesScanned: 0, productsConsidered: 0, suggestionsWritten: 0, autoApplied: 0 };
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return result;

  const settings = await getAffiliateStoreAutomationSettings();
  const [blog, recipes, products] = await Promise.all([
    fetchEnBlogPages(),
    fetchEnRecipePages(),
    fetchPublishedProductTexts(),
  ]);
  const pages = [...blog, ...recipes, ...fetchProgramPages(), ...fetchExercisePages(), ...STATIC_RESOURCE_PAGES];
  result.pagesScanned = pages.length;
  result.productsConsidered = products.length;
  if (pages.length === 0 || products.length === 0) return result;

  // existing suggestions (upsert semantics: keep decided rows)
  const { data: existing } = await supabaseAdmin
    .from("affiliate_store_link_suggestions")
    .select("page_type,page_slug,product_id,status");
  const existingKeys = new Set(
    ((existing ?? []) as Array<{ page_type: string; page_slug: string; product_id: string }>).map(
      (r) => `${r.page_type}|${r.page_slug}|${r.product_id}`,
    ),
  );

  type SuggestionInsert = Database["public"]["Tables"]["affiliate_store_link_suggestions"]["Insert"];
  const toUpsert: SuggestionInsert[] = [];
  const autoApplyQueue: Array<{
    pageType: string;
    pageSlug: string;
    product: ProductText & { id: string };
    anchor: string;
    score: number;
  }> = [];

  for (const page of pages) {
    let perPage = 0;
    for (const product of products) {
      if (perPage >= 6) break; // bounded suggestions per page
      const match = scoreProductForPage(product, { title: page.title, body: page.body });
      if (!match) continue;
      const key = `${page.page_type}|${page.page_slug}|${product.id}`;
      if (existingKeys.has(key)) continue;
      const anchor = pickAnchorPhrase(product, { title: page.title, body: page.body }, match.matchedTokens);
      toUpsert.push({
        page_type: page.page_type,
        page_slug: page.page_slug,
        product_id: product.id,
        relevance_score: match.score,
        reason: match.reason,
        anchor_phrase: anchor,
        status: "pending",
      });
      existingKeys.add(key);
      perPage += 1;
      if (
        settings.auto_link_enabled &&
        match.score >= settings.link_score_threshold &&
        anchor !== null &&
        anchor !== undefined &&
        anchor.length > 0
      ) {
        autoApplyQueue.push({
          pageType: page.page_type,
          pageSlug: page.page_slug,
          product,
          anchor,
          score: match.score,
        });
      }
    }
  }

  // write suggestions (chunked)
  for (let i = 0; i < toUpsert.length; i += 100) {
    const chunk = toUpsert.slice(i, i + 100);
    await supabaseAdmin.from("affiliate_store_link_suggestions").upsert(chunk, {
      onConflict: "page_type,page_slug,product_id",
      ignoreDuplicates: true,
    });
  }
  result.suggestionsWritten = toUpsert.length;

  // auto-apply the qualifying subset
  for (const item of autoApplyQueue) {
    const applied = await applyInlineLink(item.pageType, item.pageSlug, item.product, item.anchor, "auto");
    if (applied) result.autoApplied += 1;
  }
  if (result.autoApplied > 0) {
    await flushLinkingCaches();
  }
  return result;
}

/** Apply one inline link + its rail binding (idempotent upsert). */
async function applyInlineLink(
  pageType: string,
  pageSlug: string,
  product: ProductText & { id: string },
  anchor: string,
  source: "auto" | "manual",
): Promise<boolean> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return false;
  // cap per page: respect max_links_per_page
  const settings = await getAffiliateStoreAutomationSettings();
  const { count } = await supabaseAdmin
    .from("affiliate_store_inline_links")
    .select("id", { count: "exact", head: true })
    .eq("page_type", pageType)
    .eq("page_slug", pageSlug)
    .eq("is_active", true);
  if ((count ?? 0) >= settings.max_links_per_page) return false;

  const { error } = await supabaseAdmin
    .from("affiliate_store_inline_links")
    .upsert(
      {
        page_type: pageType,
        page_slug: pageSlug,
        product_id: product.id,
        anchor_phrase: anchor,
        is_active: true,
        source,
      },
      { onConflict: "page_type,page_slug,product_id" },
    );
  if (error) return false;

  // mark the suggestion approved
  await supabaseAdmin
    .from("affiliate_store_link_suggestions")
    .update({ status: "approved", decided_at: new Date().toISOString() })
    .eq("page_type", pageType)
    .eq("page_slug", pageSlug)
    .eq("product_id", product.id);

  // the rail binding (the existing Phase-2 wiring — surface types map 1:1)
  const surfaceType = pageTypeToSurfaceType(pageType);
  if (surfaceType) {
    await supabaseAdmin
      .from("affiliate_store_product_links")
      .upsert(
        {
          product_id: product.id,
          surface_type: surfaceType,
          surface_key: pageSlug,
          sort_order: 100,
        },
        { onConflict: "product_id,surface_type,surface_key", ignoreDuplicates: true },
      );
  }
  return true;
}

/** page_type → the 0115 surface_type family (rail bindings). */
export function pageTypeToSurfaceType(pageType: string): string | null {
  switch (pageType) {
    case "blog":
      return "blog";
    case "program":
      return "program";
    case "tool":
      return "tool";
    case "recipe":
      return "collection"; // the recipe rail ("Kitchen picks for this recipe")
    case "exercise":
      return "equipment_hub"; // the per-exercise gear rail
    case "nutrition":
      return "collection";
    case "resource":
      return "equipment_hub";
    default:
      return null;
  }
}

/** Admin approve: one pending suggestion → applied inline link. */
export async function approveLinkSuggestion(
  suggestionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { ok: false, error: "Supabase not configured" };
  const { data: suggestion } = await supabaseAdmin
    .from("affiliate_store_link_suggestions")
    .select("page_type,page_slug,product_id,anchor_phrase")
    .eq("id", suggestionId)
    .maybeSingle();
  if (!suggestion) return { ok: false, error: "suggestion not found" };
  const row = suggestion as {
    page_type: string; page_slug: string; product_id: string; anchor_phrase: string | null;
  };
  const { data: product } = await supabaseAdmin
    .from("affiliate_store_products")
    .select("id,slug,title,summary,brand,category_id")
    .eq("id", row.product_id)
    .maybeSingle();
  if (!product) return { ok: false, error: "product not found" };
  const { data: cat } = await supabaseAdmin
    .from("affiliate_store_categories")
    .select("id,slug,name")
    .eq("id", (product as { category_id: string }).category_id)
    .maybeSingle();
  if (!cat) return { ok: false, error: "product category missing" };
  const anchor =
    row.anchor_phrase ??
    ((product as { title: string }).title.split(/[,(|]/)[0].trim().slice(0, 60) || "this product");
  const applied = await applyInlineLink(
    row.page_type,
    row.page_slug,
    {
      id: (product as { id: string }).id,
      productId: (product as { id: string }).id,
      slug: (product as { slug: string }).slug,
      categorySlug: (cat as { slug: string }).slug,
      categoryName: (cat as { name: string }).name,
      title: (product as { title: string }).title,
      brand: (product as { brand: string | null }).brand,
      summary: (product as { summary: string }).summary,
    },
    anchor,
    "manual",
  );
  if (!applied) return { ok: false, error: "could not apply (per-page cap reached or write failed)" };
  await flushLinkingCaches();
  return { ok: true };
}

/** Admin reject: mark the suggestion rejected (no link is written). */
export async function rejectLinkSuggestion(
  suggestionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { ok: false, error: "Supabase not configured" };
  const { error } = await supabaseAdmin
    .from("affiliate_store_link_suggestions")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", suggestionId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Toggle an applied inline link (admin). */
export async function setInlineLinkActive(
  linkId: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { ok: false, error: "Supabase not configured" };
  const { error } = await supabaseAdmin
    .from("affiliate_store_inline_links")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", linkId);
  if (error) return { ok: false, error: error.message };
  await flushLinkingCaches();
  return { ok: true };
}

/**
 * HIDE PROPAGATION: when products are unpublished/hidden (the fetch
 * sync pass, or any admin hide), their inline links + rail bindings go
 * inactive so no dead internal link ever renders (the flush follows).
 */
export async function deactivateAffiliateStoreLinksForProducts(productIds: string[]): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin || productIds.length === 0) return;
  await supabaseAdmin
    .from("affiliate_store_inline_links")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in("product_id", productIds)
    .eq("is_active", true);
  await flushLinkingCaches();
}

/* ───────────────────────── the render-side reader ───────────────────────── */

/** Public reader for the EN render path (anon client, RLS-gated). */
export type PublicInlineLink = {
  product_id: string;
  anchor_phrase: string;
  slug: string;
  category_slug: string;
  title: string;
};

/* ───────────────────────── cache flush ───────────────────────── */

async function flushLinkingCaches(): Promise<void> {
  // The blog/recipes ISR caches + the store tags. Best-effort by design
  // (outside a request scope these are no-ops; the hourly ISR window
  // converges).
  for (const tag of ["affiliate-store-tree", "affiliate-store-products", "blog-content", "recipes-detail"]) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // expected outside request scope
    }
  }
  for (const path of ["/blog", "/recipes", "/affiliate-store"]) {
    try {
      revalidatePath(path);
    } catch {
      // expected outside request scope
    }
  }
}
