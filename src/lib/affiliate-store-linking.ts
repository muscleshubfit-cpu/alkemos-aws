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
 *
 * THE ANCHOR LAW (Phase 533 — report 533 §3, the structural fix):
 *   An anchor is only ever picked from the article text the visitor
 *   ACTUALLY SEES as the renderable markdown body — the blog pipeline
 *   content (sanitize → tool links) minus the FAQ sections (Phase 178:
 *   rendered from faq_json cards, stripped from the body) minus the
 *   leading title heading (Phase 187). Tags/keywords/excerpt/category
 *   are NEVER anchor sources (they never reach the injector), table
 *   rows / headings / blockquotes / existing links are never wrappable
 *   positions, and every candidate is gated by the ultimate truth: a
 *   real insertStoreLinks probe whose wrap must SURVIVE the render
 *   strips. approveLinkSuggestion() refuses (clear error, no write)
 *   when no renderable anchor exists — the product-title fallback that
 *   wrote dead rows is GONE. repairInlineLinkAnchor() re-anchors or
 *   deactivates existing invisible links (the official channel).
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase/admin";
import { stripFaqSectionFromBody, stripTitleHeadingFromBody } from "./blog-msa";
import { sanitizeBlogContent } from "./blog-content-sanitize";
import { insertToolLinks } from "./blog-tool-links";
import { fetchPublishedBlogSlugPools } from "./blog-server";
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
  /** Blog pages only (Phase 533): the render context for the anchor
   *  visibility probe — the pipeline content and the FAQ-strip flag. */
  pipelineContent?: string;
  hasFaqCards?: boolean;
};

export type LinkScanResult = {
  pagesScanned: number;
  productsConsidered: number;
  suggestionsWritten: number;
  autoApplied: number;
  /** Phase 533: pending rows whose anchor/score were recomputed in place. */
  anchorsRefreshed: number;
};

/**
 * THE BLOG SCAN SOURCE (Phase 533 — unified with the render rules):
 * the page body IS the displayed article body (pipeline content minus
 * FAQ sections minus the title heading) — exactly the text the store
 * injector can wrap into. Tags/keywords/excerpt/category are NO LONGER
 * scan text (report 533 §3-1: anchors picked from them never rendered
 * — the measured 155/155 dead-approval class). The pipeline context is
 * carried alongside for the visibility probe.
 */
async function fetchEnBlogPages(): Promise<ScannedPage[]> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
  const [pools, postsRes] = await Promise.all([
    fetchPublishedBlogSlugPools(),
    supabaseAdmin
      .from("blog_posts")
      .select("slug,title,content,faq_json")
      .eq("is_published", true)
      .eq("language", "en") // THE LANGUAGE LAW: EN posts only
      .limit(400),
  ]);
  return ((postsRes.data ?? []) as Array<{
    slug: string; title: string; content: string; faq_json: unknown;
  }>).map((p) => {
    const hasFaqCards = Array.isArray(p.faq_json) && p.faq_json.length > 0;
    const pipelineContent = buildBlogPipelineContent(p.content ?? "", pools);
    return {
      page_type: "blog",
      page_slug: p.slug,
      title: p.title,
      body: renderableBlogBody(pipelineContent, p.title, hasFaqCards),
      pipelineContent,
      hasFaqCards,
    };
  });
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
  // EQUIPMENT TAG is the real relevance signal (a dumbbell exercise page
  // is a natural host for dumbbell products). The form-cue instructions
  // are DELIBERATELY EXCLUDED: they mention incidental gear ("set the
  // barbell on a rack…") that has nothing to do with the exercise's own
  // equipment, which measured live as false matches (bodyweight ankle
  // circles attracting squat-rack links — the owner's «الصلة الحقيقية
  // وليس تطابق كلمات عشوائي» law).
  return EXERCISES.map((e) => ({
    page_type: "exercise",
    page_slug: e.slug,
    title: e.nameEn,
    body: [e.nameEn, e.equipment, e.category, (e.primaryMuscles ?? []).join(" ")].join("\n"),
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
 * The renderable-position check (Phase 533 — the anchor law): does the
 * phrase occur in a position the injector can actually WRAP? Mirrors
 * tryWrapFirstOccurrence exactly — skip lines (headings, blockquotes,
 * table rows, hr, images), split existing markdown links/images, and
 * require word boundaries around the match. (The old plain-substring
 * check proposed anchors from tables/tags/FAQ text that measured live
 * as never-rendering dead rows — report 533 §3.)
 */
export function occursInRenderablePosition(phrase: string, text: string): boolean {
  const needle = phrase.toLowerCase();
  if (!needle) return false;
  for (const line of text.split("\n")) {
    if (SKIP_LINE.test(line.trim())) continue;
    const fragments = line.split(MD_LINK_SPLIT);
    for (let f = 0; f < fragments.length; f += 2) {
      const fragment = fragments[f];
      const lower = fragment.toLowerCase();
      let idx = lower.indexOf(needle);
      while (idx !== -1) {
        const before = idx > 0 ? fragment[idx - 1] : " ";
        const after = idx + needle.length < fragment.length ? fragment[idx + needle.length] : " ";
        if (!WORD_CHAR.test(before) && !WORD_CHAR.test(after)) return true;
        idx = lower.indexOf(needle, idx + needle.length);
      }
    }
  }
  return false;
}

/**
 * THE BLOG RENDER PIPELINE (what the article template feeds the store
 * injector — page.tsx line order: sanitize → tool links → store links):
 * built here once so the scan, the approve path and the repair path all
 * compute anchors on the SAME text the injector sees.
 */
export function buildBlogPipelineContent(content: string, pools: { en: ReadonlySet<string>; ar: ReadonlySet<string> }): string {
  return insertToolLinks(sanitizeBlogContent(content, "en", pools), "en").md;
}

/**
 * The DISPLAYED blog body (what the visitor actually reads as the
 * article markdown): the pipeline content minus the FAQ sections
 * (Phase 178 — stripped whenever faq_json cards exist, rendered from
 * the cards instead) minus the leading title heading (Phase 187).
 * Exactly BlogArticlePage's own strip order.
 */
export function renderableBlogBody(pipelineContent: string, title: string, hasFaqCards: boolean): string {
  const faqStripped = hasFaqCards ? stripFaqSectionFromBody(pipelineContent) : pipelineContent;
  return stripTitleHeadingFromBody(faqStripped, title);
}

/** The blog render context an anchor must survive (report 533 §3). */
export type BlogRenderContext = {
  /** what insertStoreLinks receives (sanitize + tool links applied) */
  pipelineContent: string;
  title: string;
  hasFaqCards: boolean;
};

/**
 * THE ULTIMATE TRUTH (Phase 533): would this candidate link, injected
 * by the REAL injector over the REAL pipeline content, still be present
 * in the DISPLAYED body after the Phase-178/187 strips? This is the
 * exact production shape — the same functions, the same order — so an
 * anchor that passes here renders for the visitor (and one that fails
 * here is refused BEFORE any row is written: no dead links, ever).
 *
 * `links` is the full render-order link set INCLUDING the candidate;
 * `candidateUrl` is the internal product URL the candidate must produce.
 */
export function anchorRendersVisibly(
  ctx: BlogRenderContext,
  links: InlineLinkRow[],
  candidateUrl: string,
): boolean {
  const { md } = insertStoreLinks(ctx.pipelineContent, "en", links);
  const stripped = ctx.hasFaqCards ? stripFaqSectionFromBody(md) : md;
  const displayed = stripTitleHeadingFromBody(stripped, ctx.title);
  return displayed.includes(`](${candidateUrl})`);
}

/**
 * Pick the anchor phrase for a (page, product) pair: the longest product
 * title segment that occurs in the page's RENDERABLE body (a natural
 * anchor the reader already sees — never in a heading, table, quote,
 * existing link, FAQ section or the title hero); fallback: the matched
 * token pair (same renderable-position rule). The page title is NOT a
 * source: it renders as the template's H1 hero, outside the markdown
 * the injector touches. Returns null when nothing renderable exists —
 * the caller must then refuse the approval (the 533 law).
 */
export function pickAnchorPhrase(product: ProductText, page: PageText, matchedTokens: string[]): string | null {
  const body = page.body; // callers pass the RENDERABLE displayed body
  const title = product.title.trim();
  // try title comma-segments, longest first
  const segments = title.split(/[,(|]/).map((s) => s.trim()).filter((s) => s.length >= 8 && s.length <= 60);
  segments.sort((a, b) => b.length - a.length);
  for (const seg of segments) {
    if (occursInRenderablePosition(seg, body)) return seg;
  }
  // THE FALLBACK LADDER (Phase 533): every candidate must sit in a
  // renderable position of the displayed body. Ranked by how truthfully
  // the anchor describes THIS product — word-coverage of the product's
  // IDENTITY text (title+brand+category name; the SUMMARY is
  // deliberately excluded: comparative marketing prose like "slower
  // than whey" on a CASEIN product measured live as poisoning the
  // coverage check into picking a false "whey protein" anchor):
  //   ① multi-word matched tokens whose EVERY word the identity text
  //      carries ("heart rate monitor" for the Polar H10, "smart scale"
  //      for the RENPHO, "plant protein" for a plant-based powder) —
  //      longest first;
  //   ② single matched tokens present in the product's OWN name
  //      (title+brand — "whey" for a whey powder, "casein" for a casein
  //      powder; NOT the broad category name: "creatine" for an amino-
  //      energy product via "Creatine & Amino Acids" measured as
  //      misleading), in match order;
  //   ③ remaining multi-word tokens (category/context phrases, partially
  //      product-truthful — "water bottle" for an insulated bottle,
  //      "post-workout shake" for a whey powder), longest first;
  //   ④ the contiguous pair of the first two matched tokens.
  // Tier ⑤ (bare singles from the summary that merely occur in the
  // article — "continuous", "heart") is deliberately ABSENT: a single
  // word that does not describe the product measured live as a
  // misleading anchor, and the approve path refuses instead.
  // (Measured live: the old "pair-of-first-two or nothing" ladder left
  // 29/30 of the §2 pairs unanchorable, and an unranked ladder picked
  // "plant protein" for an animal-whey product — word-coverage ranking
  // prevents both: "plant" never appears in the whey product's text.)
  const identityText = `${title} ${product.brand ?? ""} ${product.categoryName}`.toLowerCase();
  const nameText = `${title} ${product.brand ?? ""}`.toLowerCase();
  const wordCovered = (candidate: string): boolean =>
    candidate.split(/\s+/).every((w) => w.length === 0 || identityText.includes(w));
  const fullMultis: string[] = [];
  const fullSingles: string[] = [];
  const partialMultis: string[] = [];
  for (const token of matchedTokens) {
    if (token.length < 5 || token.length > 60) continue;
    if (token.includes(" ")) {
      if (wordCovered(token)) fullMultis.push(token);
      else partialMultis.push(token);
    } else if (nameText.includes(token)) {
      fullSingles.push(token);
    }
    // bare non-identity singles are NOT candidates (see the ladder note)
  }
  const pair = matchedTokens.length >= 2 ? `${matchedTokens[0]} ${matchedTokens[1]}` : null;
  const candidates = [
    ...[...new Set(fullMultis)].sort((a, b) => b.length - a.length),
    ...[...new Set(fullSingles)],
    ...[...new Set(partialMultis)].sort((a, b) => b.length - a.length),
    ...(pair && pair.length >= 5 ? [pair] : []),
  ];
  for (const candidate of candidates) {
    if (occursInRenderablePosition(candidate, body)) return candidate;
  }
  return null;
}

/**
 * THE SCAN: refresh suggestions for every EN surface. Writes ONLY the
 * suggestion queue (application is a separate, threshold-gated step).
 *
 * PHASE 533 (the §3-3 gap fix): existing PENDING suggestions get their
 * anchor/score/reason REFRESHED in place (a stale or NULL anchor no
 * longer freezes forever); decided rows (approved/rejected) are never
 * touched. Auto-apply is now render-gated: it runs only for surfaces
 * with an inline render consumer (blog — the only insertStoreLinks
 * consumer today) and only when the anchor passes the visibility
 * probe, so an auto-applied link is a link the visitor actually sees.
 */
export async function scanLinkSuggestions(): Promise<LinkScanResult> {
  const result: LinkScanResult = { pagesScanned: 0, productsConsidered: 0, suggestionsWritten: 0, autoApplied: 0, anchorsRefreshed: 0 };
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

  // existing suggestions: pending rows are refreshable; decided rows are frozen
  const { data: existing } = await supabaseAdmin
    .from("affiliate_store_link_suggestions")
    .select("page_type,page_slug,product_id,status,anchor_phrase,relevance_score,reason");
  type ExistingRow = {
    page_type: string; page_slug: string; product_id: string;
    status: string; anchor_phrase: string | null; relevance_score: number; reason: string;
  };
  const existingByKey = new Map<string, ExistingRow>();
  for (const r of (existing ?? []) as ExistingRow[]) {
    existingByKey.set(`${r.page_type}|${r.page_slug}|${r.product_id}`, r);
  }

  // the live render set for the auto-apply visibility probe (blog only)
  const productById = new Map(products.map((p) => [p.id, p]));
  const activeLinksBySlug = new Map<string, InlineLinkRow[]>();
  if (settings.auto_link_enabled) {
    const { data: activeRows } = await supabaseAdmin
      .from("affiliate_store_inline_links")
      .select("page_slug,product_id,anchor_phrase")
      .eq("page_type", "blog")
      .eq("is_active", true);
    for (const r of (activeRows ?? []) as Array<{ page_slug: string; product_id: string; anchor_phrase: string }>) {
      const product = productById.get(r.product_id);
      if (!product) continue;
      const list = activeLinksBySlug.get(r.page_slug) ?? [];
      list.push({
        productId: product.id,
        anchorPhrase: r.anchor_phrase,
        slug: product.slug,
        categorySlug: product.categorySlug,
        title: product.title,
      });
      activeLinksBySlug.set(r.page_slug, list);
    }
  }

  type SuggestionInsert = Database["public"]["Tables"]["affiliate_store_link_suggestions"]["Insert"];
  const toUpsert: SuggestionInsert[] = [];
  let newSuggestions = 0;
  let anchorsRefreshed = 0;
  const autoApplyQueue: Array<{
    pageSlug: string;
    product: ProductText & { id: string };
    anchor: string;
    ctx: BlogRenderContext;
    otherLinks: InlineLinkRow[];
  }> = [];

  for (const page of pages) {
    let newThisPage = 0;
    for (const product of products) {
      const match = scoreProductForPage(product, { title: page.title, body: page.body });
      if (!match) continue;
      const key = `${page.page_type}|${page.page_slug}|${product.id}`;
      const existingRow = existingByKey.get(key);
      if (existingRow && existingRow.status !== "pending") continue; // decided → frozen
      const anchor = pickAnchorPhrase(product, { title: page.title, body: page.body }, match.matchedTokens);
      if (existingRow) {
        // PHASE 533: refresh the pending row's anchor/score/reason in
        // place (upsert update-on-conflict) — only when something moved
        if (
          existingRow.anchor_phrase !== anchor ||
          Number(existingRow.relevance_score) !== match.score ||
          existingRow.reason !== match.reason
        ) {
          toUpsert.push({
            page_type: page.page_type,
            page_slug: page.page_slug,
            product_id: product.id,
            relevance_score: match.score,
            reason: match.reason,
            anchor_phrase: anchor,
            status: "pending",
          });
          anchorsRefreshed += 1;
        }
        continue; // existing pending rows never re-enter the new-suggestion budget
      }
      if (newThisPage >= 6) continue; // bounded NEW suggestions per page
      toUpsert.push({
        page_type: page.page_type,
        page_slug: page.page_slug,
        product_id: product.id,
        relevance_score: match.score,
        reason: match.reason,
        anchor_phrase: anchor,
        status: "pending",
      });
      newSuggestions += 1;
      newThisPage += 1;
      // AUTO-APPLY (render-gated, Phase 533): only the blog surface has
      // an inline render consumer, and only a probe-verified anchor.
      if (
        settings.auto_link_enabled &&
        page.page_type === "blog" &&
        page.pipelineContent !== undefined &&
        match.score >= settings.link_score_threshold &&
        anchor
      ) {
        const candidateUrl = `/affiliate-store/${product.categorySlug}/${product.slug}`;
        const otherLinks = activeLinksBySlug.get(page.page_slug) ?? [];
        const ctx: BlogRenderContext = {
          pipelineContent: page.pipelineContent,
          title: page.title,
          hasFaqCards: page.hasFaqCards ?? false,
        };
        if (anchorRendersVisibly(ctx, [...otherLinks, { productId: product.id, anchorPhrase: anchor, slug: product.slug, categorySlug: product.categorySlug, title: product.title }], candidateUrl)) {
          autoApplyQueue.push({ pageSlug: page.page_slug, product, anchor, ctx, otherLinks });
        }
      }
    }
  }

  // write suggestions (chunked; update-on-conflict so pending refreshes land)
  for (let i = 0; i < toUpsert.length; i += 100) {
    const chunk = toUpsert.slice(i, i + 100);
    await supabaseAdmin.from("affiliate_store_link_suggestions").upsert(chunk, {
      onConflict: "page_type,page_slug,product_id",
      ignoreDuplicates: false,
    });
  }
  result.suggestionsWritten = newSuggestions;
  result.anchorsRefreshed = anchorsRefreshed;

  // auto-apply the qualifying (probe-verified) subset
  for (const item of autoApplyQueue) {
    const applied = await applyInlineLink("blog", item.pageSlug, item.product, item.anchor, "auto");
    if (applied) {
      result.autoApplied += 1;
      // keep the probe set live for the next candidate on the same page
      const list = activeLinksBySlug.get(item.pageSlug) ?? [];
      list.push({
        productId: item.product.id,
        anchorPhrase: item.anchor,
        slug: item.product.slug,
        categorySlug: item.product.categorySlug,
        title: item.product.title,
      });
      activeLinksBySlug.set(item.pageSlug, list);
    }
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

/**
 * THE APPROVE-PATH ANCHOR COMPUTATION (Phase 533 — report §7-1):
 * fetch the page's REAL render inputs, rebuild the exact render
 * pipeline (sanitize → tool links → displayed body), then accept the
 * stored anchor only if it actually renders, else recompute one. A
 * candidate must pass the anchorRendersVisibly probe (the real
 * injector + the real strips) — the product-title fallback that wrote
 * dead rows (533 §3-2) is GONE. Returns the validated anchor or null.
 */
async function computeRenderableAnchorForBlog(
  pageSlug: string,
  product: ProductText & { id: string },
  storedAnchor: string | null,
): Promise<{ anchor: string } | { error: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { error: "Supabase not configured" };
  const { data: postRow } = await supabaseAdmin
    .from("blog_posts")
    .select("slug,title,content,faq_json,language,is_published")
    .eq("slug", pageSlug)
    .eq("language", "en") // THE LANGUAGE LAW: EN posts only
    .eq("is_published", true)
    .maybeSingle();
  if (!postRow) {
    return { error: `no published EN article found for slug "${pageSlug}" — the link could never render` };
  }
  const post = postRow as { slug: string; title: string; content: string; faq_json: unknown };
  const hasFaqCards = Array.isArray(post.faq_json) && post.faq_json.length > 0;
  const pools = await fetchPublishedBlogSlugPools();
  const pipelineContent = buildBlogPipelineContent(post.content ?? "", pools);
  const ctx: BlogRenderContext = { pipelineContent, title: post.title, hasFaqCards };
  const displayedBody = renderableBlogBody(pipelineContent, post.title, hasFaqCards);
  const candidateUrl = `/affiliate-store/${product.categorySlug}/${product.slug}`;
  const candidateRow: InlineLinkRow = {
    productId: product.id,
    anchorPhrase: "",
    slug: product.slug,
    categorySlug: product.categorySlug,
    title: product.title,
  };
  // the page's CURRENT active links (the real render set, minus this product)
  const { data: activeRows } = await supabaseAdmin
    .from("affiliate_store_inline_links")
    .select("product_id,anchor_phrase")
    .eq("page_type", "blog")
    .eq("page_slug", pageSlug)
    .eq("is_active", true);
  const { data: activeProducts } = await supabaseAdmin
    .from("affiliate_store_products")
    .select("id,slug,title,brand,summary,category_id")
    .in("id", ((activeRows ?? []) as Array<{ product_id: string }>).map((r) => r.product_id));
  const activeProductById = new Map(
    ((activeProducts ?? []) as Array<{ id: string; slug: string; title: string; brand: string | null; summary: string; category_id: string }>).map((p) => [p.id, p]),
  );
  const activeCatIds = [...new Set([...activeProductById.values()].map((p) => p.category_id))];
  const { data: activeCats } = activeCatIds.length
    ? await supabaseAdmin.from("affiliate_store_categories").select("id,slug").in("id", activeCatIds)
    : { data: [] as Array<{ id: string; slug: string }> | null };
  const activeCatSlugById = new Map(
    ((activeCats ?? []) as Array<{ id: string; slug: string }>).map((c) => [c.id, c.slug]),
  );
  const otherLinks: InlineLinkRow[] = [];
  for (const r of (activeRows ?? []) as Array<{ product_id: string; anchor_phrase: string }>) {
    if (r.product_id === product.id) continue;
    const p = activeProductById.get(r.product_id);
    if (!p) continue;
    const catSlug = activeCatSlugById.get(p.category_id);
    if (!catSlug) continue;
    otherLinks.push({
      productId: p.id,
      anchorPhrase: r.anchor_phrase,
      slug: p.slug,
      categorySlug: catSlug,
      title: p.title,
    });
  }

  // 1) the stored anchor, if it actually renders
  if (storedAnchor && anchorRendersVisibly(ctx, [...otherLinks, { ...candidateRow, anchorPhrase: storedAnchor }], candidateUrl)) {
    return { anchor: storedAnchor };
  }
  // 2) recompute from the RENDERABLE displayed body (never tags/keywords,
  //    never the product title as an unverified fallback)
  const match = scoreProductForPage(product, { title: post.title, body: displayedBody });
  const picked = pickAnchorPhrase(product, { title: post.title, body: displayedBody }, match?.matchedTokens ?? []);
  if (picked && anchorRendersVisibly(ctx, [...otherLinks, { ...candidateRow, anchorPhrase: picked }], candidateUrl)) {
    return { anchor: picked };
  }
  return {
    error:
      `no renderable anchor: neither the stored anchor${storedAnchor ? ` ("${storedAnchor}")` : " (NULL)"} nor a recomputed phrase ` +
      `occurs in a linkable position of the article's displayed body (tags/keywords/tables/FAQ are excluded by the render law) — ` +
      `edit the article or reject this suggestion (refusing to write a dead row)`,
  };
}

/** Admin approve: one pending suggestion → applied inline link (Phase 533:
 *  renderable-anchor-gated, blog-only, honest refusals — never a dead row). */
export async function approveLinkSuggestion(
  suggestionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { ok: false, error: "Supabase not configured" };
  const { data: suggestion } = await supabaseAdmin
    .from("affiliate_store_link_suggestions")
    .select("page_type,page_slug,product_id,anchor_phrase,status")
    .eq("id", suggestionId)
    .maybeSingle();
  if (!suggestion) return { ok: false, error: "suggestion not found" };
  const row = suggestion as {
    page_type: string; page_slug: string; product_id: string;
    anchor_phrase: string | null; status: string;
  };
  if (row.status !== "pending") {
    return { ok: false, error: `suggestion is not pending (status=${row.status}) — only pending rows can be approved` };
  }
  // THE RENDER-CONSUMER LAW (audit 530 §3.2-2): only the blog template
  // consumes insertStoreLinks today — approving any other surface writes
  // an inline row nothing renders (the owner's P2 exercise decision is
  // pending), so the mechanism refuses honestly instead.
  if (row.page_type !== "blog") {
    return {
      ok: false,
      error: `inline render consumer exists only for blog pages (page_type=${row.page_type}) — approving would write a dead row (audit 530 §3.2-2; the surface-rail binding decision is the owner's pending P2)`,
    };
  }
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
  const productText: ProductText & { id: string } = {
    id: (product as { id: string }).id,
    productId: (product as { id: string }).id,
    slug: (product as { slug: string }).slug,
    categorySlug: (cat as { slug: string }).slug,
    categoryName: (cat as { name: string }).name,
    title: (product as { title: string }).title,
    brand: (product as { brand: string | null }).brand,
    summary: (product as { summary: string }).summary,
  };
  const anchorResult = await computeRenderableAnchorForBlog(row.page_slug, productText, row.anchor_phrase);
  if ("error" in anchorResult) return { ok: false, error: anchorResult.error };
  const applied = await applyInlineLink(row.page_type, row.page_slug, productText, anchorResult.anchor, "manual");
  if (!applied) return { ok: false, error: "could not apply (per-page cap reached or write failed)" };
  await flushLinkingCaches();
  return { ok: true };
}

/**
 * REPAIR (Phase 533 — report §7-3, the official channel): recompute an
 * existing ACTIVE inline link's anchor from the article's renderable
 * body; when no renderable anchor exists the link is DEACTIVATED (no
 * phantom active rows). Refuses non-blog surfaces (no inline consumer).
 */
export async function repairInlineLinkAnchor(
  linkId: string,
): Promise<{ ok: true; action: "reanchored" | "deactivated"; anchor: string | null } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return { ok: false, error: "Supabase not configured" };
  const { data: linkRow } = await supabaseAdmin
    .from("affiliate_store_inline_links")
    .select("id,page_type,page_slug,product_id,anchor_phrase,is_active")
    .eq("id", linkId)
    .maybeSingle();
  if (!linkRow) return { ok: false, error: "inline link not found" };
  const link = linkRow as {
    id: string; page_type: string; page_slug: string; product_id: string;
    anchor_phrase: string; is_active: boolean;
  };
  if (link.page_type !== "blog") {
    return {
      ok: false,
      error: `inline render consumer exists only for blog pages (page_type=${link.page_type}) — nothing to repair (the surface decision is the owner's pending P2)`,
    };
  }
  const { data: product } = await supabaseAdmin
    .from("affiliate_store_products")
    .select("id,slug,title,summary,brand,category_id")
    .eq("id", link.product_id)
    .maybeSingle();
  if (!product) return { ok: false, error: "product not found" };
  const { data: cat } = await supabaseAdmin
    .from("affiliate_store_categories")
    .select("id,slug,name")
    .eq("id", (product as { category_id: string }).category_id)
    .maybeSingle();
  if (!cat) return { ok: false, error: "product category missing" };
  const productText: ProductText & { id: string } = {
    id: (product as { id: string }).id,
    productId: (product as { id: string }).id,
    slug: (product as { slug: string }).slug,
    categorySlug: (cat as { slug: string }).slug,
    categoryName: (cat as { name: string }).name,
    title: (product as { title: string }).title,
    brand: (product as { brand: string | null }).brand,
    summary: (product as { summary: string }).summary,
  };
  const anchorResult = await computeRenderableAnchorForBlog(link.page_slug, productText, link.anchor_phrase);
  if ("error" in anchorResult) {
    // no renderable anchor exists → deactivate honestly (no phantom row)
    const { error } = await supabaseAdmin
      .from("affiliate_store_inline_links")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", linkId);
    if (error) return { ok: false, error: `no renderable anchor and deactivate failed: ${error.message}` };
    await flushLinkingCaches();
    return { ok: true, action: "deactivated", anchor: null };
  }
  const { error } = await supabaseAdmin
    .from("affiliate_store_inline_links")
    .update({ anchor_phrase: anchorResult.anchor, updated_at: new Date().toISOString() })
    .eq("id", linkId);
  if (error) return { ok: false, error: error.message };
  await flushLinkingCaches();
  return { ok: true, action: "reanchored", anchor: anchorResult.anchor };
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
