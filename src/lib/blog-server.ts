import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
// PHASE 189 (SEO-GEO-10, deep-audit P1-1): render-time SERP title clamp
// — the law lives in the zero-dep blog-meta-title.ts so this server
// module never imports the AI provider chain (see that file's header).
import { clampMetaTitle } from "./blog-meta-title";
import type { BlogPost, BlogPostCard, BlogFaq } from "./blog";
import { sizedRemoteImage } from "./remote-image-size";

/**
 * Server-side blog helpers — for route handlers and server components.
 * (The sibling `blog.ts` is "use client" and uses the browser Supabase
 * client; this file uses a fresh server client and never touches the browser.)
 */

// PHASE 192 (fork fix): the registry lived here TWICE (this server copy
// carried only 8 ids — fitness/wellness missing — so /blog/category/fitness
// and /wellness 404'd live while the client stored those ids). The single
// source is now src/lib/blog-categories.ts; both sides re-export it.
// CONTENT-AUDIT P1-8: effectiveCategory is ALSO imported as a value — the
// category-page query filters through it in-memory (misfiled stored rows
// are corrected at render time; DB untouched).
import { effectiveCategory } from "./blog-categories";

export {
  BLOG_CATEGORIES,
  VALID_CATEGORY_IDS,
  normalizeCategory,
  effectiveCategory,
} from "./blog-categories";

export type BlogOGData = {
  title: string;
  description: string;
  image: string;
  /**
   * SOCIAL-OG (2026-09-22, owner order «اجعل النشر يستخدم صورة المقال»):
   * the single share-image source for og:image / twitter:image / Article
   * JSON-LD on both mirrors — the article's REAL featured photo, Pexels-
   * cropped to the 1200×630 social ratio with fm=jpeg (WebP og:image is a
   * blank/blue-box risk on strict crawlers). The branded /api/og-image
   * generator is the fallback ONLY for photo-less articles: its cold
   * render (1.7–5.2s live) exceeds WhatsApp/Facebook fetch budgets —
   * that latency is what produced the blue-box share cards. `image`
   * stays the raw featured_image (page-body hero source).
   *
   * AUDIT_REPORT §9-0.5 (2026-09-29) — DEFERRED BY OWNER-ORDER CONFLICT,
   * not overlooked: the audit's Phase 0.5 proposes og:image → /api/og-image
   * (brand identity + CTR), but that reverses the live-verified
   * SOCIAL-OG/SOCIAL-OG-2 cover-first fix (owner order 2026-09-22;
   * 11/11 green verification 2026-09-28) whose root-cause evidence is the
   * generator cold-render timeout above. Re-enabling generator-first
   * requires an explicit owner decision accepting the blue-box risk —
   * see the PHASE0-QUALITY-2026-09-29 worklog entry.
   */
  shareImage: string;
  articleUrl: string;
  locale: "en_US" | "ar_EG";
  /**
   * Phase SEO-GEO-6.5 (§12.19 P0-4): the language twin of this post, when
   * the Phase-157/158 `linked_post_id` pairing links it to a PUBLISHED
   * counterpart. Used by the blog pages' generateMetadata to emit
   * en/ar/x-default hreflang — `null` on unpaired posts (the page then
   * declares self + x-default only, never a dangling counterpart URL).
   */
  twinSlug?: string | null;
  twinLang?: "en" | "ar" | null;
  publishedAt?: string | null;
  /**
   * Phase SEO-GEO-4 (2026-09-08): the article schema's dateModified +
   * lastReviewed + the visible "Last reviewed" byline all need the real
   * DB updated_at. Without it, every page silently fell back to
   * new Date().toISOString() at request time → Google saw every article
   * as "modified just now" on every crawl, which devalues the freshness
   * signal. Also adds `author` so resolveAuthor can match the DB value
   * instead of always falling through to the default.
   */
  updatedAt?: string | null;
  author?: string | null;
  /**
   * 0097 (AUDIT_REPORT §9-المرحلة 2, item 1 — 2026-09-29): the REAL
   * review state of this article. review_status='reviewed' +
   * lastReviewedAt = the owner actually read/approved it (admin-gated
   * review action or the owner's own editor publish) — the Article
   * schema then legitimately carries reviewedBy + lastReviewed.
   * review_status='pending' + lastReviewedAt=null (the honest state of
   * every pipeline-published article until reviewed): the schema OMITS
   * the review claims entirely and the byline says "AI-generated ·
   * medical review pending" (the audit C2/F2 fix — no fabricated
   * E-E-A-T signals on YMYL health content).
   */
  reviewStatus?: string | null;
  lastReviewedAt?: string | null;
};

/**
 * Fetch a published blog post's OG-relevant fields by slug + language.
 * Returns null when Supabase isn't configured, the post doesn't exist,
 * or the request fails — callers fall back to defaults.
 *
 * Used by:
 *   - /api/og-image/[slug] (OG image for crawlers)
 *   - app/blog/[slug]/page.tsx and app/ar/blog/[slug]/page.tsx (generateMetadata)
 *
 * Centralizing this here so the three previous copies of the same REST
 * query don't drift apart.
 */
// Decision 2 fix: wrap fetchBlogForOG in unstable_cache — aligned with the
// blog ISR window (VERCEL-USAGE-9 2026-10-09: 300s → 3600s, same change as
// the blog pages' revalidate; the lowest cache revalidate propagates to the
// route, so a 300s entry here would silently cap the 1h ISR at 5m).
// Blog posts change rarely — caching reduces Supabase queries significantly.
const fetchBlogForOGUncached = async (
  slug: string,
  lang: "en" | "ar",
): Promise<BlogOGData | null> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // 0097 TRANSITION-WINDOW LAW: the Vercel deploy and the Supabase
    // migration land on the same push but not the same instant — a query
    // naming review_status/last_reviewed_at 400s (PGRST204) until the
    // column exists. Degrade ONCE to the pre-0097 column list (review
    // fields null = the honest pending default) instead of failing the
    // whole page to 404. Self-heals when the migration lands.
    const REVIEW_COLS = "review_status, last_reviewed_at";
    let { data, error } = await supabase
      .from("blog_posts")
      .select(
        `title, meta_title, meta_description, excerpt, featured_image, cover_alt, slug, published_at, updated_at, author, linked_post_id, ${REVIEW_COLS}`,
      )
      .eq("slug", slug)
      .eq("language", lang)
      .eq("is_published", true)
      .maybeSingle();
    if (error && /review_status|last_reviewed_at|PGRST204|Could not find the .* column/i.test(error.message)) {
      // type-compatible retry (the review fields are absent → mapped null
      // below via the defensive casts — the honest pending default).
      const retry = await supabase
        .from("blog_posts")
        .select(
          "title, meta_title, meta_description, excerpt, featured_image, cover_alt, slug, published_at, updated_at, author, linked_post_id",
        )
        .eq("slug", slug)
        .eq("language", lang)
        .eq("is_published", true)
        .maybeSingle();
      data = retry.data as typeof data;
      error = retry.error;
    }
    if (error || !data) return null;

    // Phase SEO-GEO-6.5 (§12.19 P0-4): resolve the language twin ONLY when
    // the twin is itself published (sitemap C1 law — a draft/deleted twin
    // must never be declared in hreflang). One extra lightweight query,
    // cached with the OG payload for 5 minutes.
    let twinSlug: string | null = null;
    let twinLang: "en" | "ar" | null = null;
    if (data.linked_post_id) {
      const { data: twin } = await supabase
        .from("blog_posts")
        .select("slug, language")
        .eq("id", data.linked_post_id)
        .eq("is_published", true)
        .maybeSingle();
      if (twin) {
        twinSlug = twin.slug;
        twinLang = twin.language === "ar" ? "ar" : "en";
      }
    }

    const baseUrl = "https://alkemos.com";
    const articleUrl = `${baseUrl}${lang === "ar" ? "/ar/blog" : "/blog"}/${data.slug}`;
    // SOCIAL-OG (2026-09-22): cover-first share image — see the
    // shareImage field doc above. Pexels' CDN serves the 1200×630 jpeg
    // crop in <100ms globally: no cold function on the crawler path.
    const featured = (data.featured_image || "").trim();
    const featuredAbsolute = featured.startsWith("/")
      ? `${baseUrl}${featured}`
      : featured;
    const shareImage =
      sizedRemoteImage(featuredAbsolute, 1200, 1200 / 630, "jpeg") ||
      `${baseUrl}/api/og-image/${data.slug}?lang=${lang}`;
    // PHASE 189 (SEO-GEO-10, deep-audit P1-1): RENDER-TIME title clamp —
    // the durable guarantee that a stored meta_title can never leak an
    // over-budget <title> to SERP. Live audit 2026-09-13: 5 legacy AR rows
    // carried a trailing " — Alkemos" brand suffix (71-77 chars, budget
    // 70) — the clamp's Law 1 strips the suffix and Law 2 passes the
    // clean title through, so the fix converges at the 5-min ISR
    // revalidate with ZERO DB writes (the Phase-187 pattern: fix the
    // render, don't mutate stored data). This is the single choke point
    // for <title>/og:title/twitter:title/JSON-LD headline/breadcrumb on
    // BOTH language mirrors AND the /api/og-image card text.
    return {
      title: clampMetaTitle(data.meta_title || data.title || "", lang),
      description: data.meta_description || data.excerpt || "",
      image: data.featured_image || `${baseUrl}/logo.png`,
      shareImage,
      articleUrl,
      locale: lang === "ar" ? "ar_EG" : "en_US",
      twinSlug,
      twinLang,
      publishedAt: data.published_at,
      updatedAt: data.updated_at,
      author: data.author,
      reviewStatus: (data as { review_status?: string | null }).review_status ?? null,
      lastReviewedAt:
        (data as { last_reviewed_at?: string | null }).last_reviewed_at ?? null,
    };
  } catch {
    return null;
  }
};

// Cached wrapper — 1 hour revalidate (VERCEL-USAGE-9: aligned with the
// blog pages' 1h ISR window; the og-image route's freshness is dominated
// by its own CF edge TTL 86400s regardless).
export const fetchBlogForOG = unstable_cache(
  fetchBlogForOGUncached,
  ["blog-og"],
  { revalidate: 3600 },
);

/**
 * Phase SEO-GEO-6.5 (§12.19 P0-4) — hreflang map for a blog article page.
 *
 * PAIRED post (live linked_post_id twin): emits the full en/ar pair with
 * x-default → the EN URL. UNPAIRED post: emits self + x-default → self —
 * the page never declares a counterpart URL that does not exist (the C1
 * dangling-hreflang law stands; what changed since C1 is that the
 * Phase-157/158 pairing now supplies REAL twins worth declaring).
 *
 * Single source for both /blog/[slug] and /ar/blog/[slug] generateMetadata
 * so the two mirrors can never drift apart.
 */
export function buildBlogHreflang(og: BlogOGData): Record<string, string> {
  const selfLang = og.locale === "ar_EG" ? "ar" : "en";
  if (og.twinSlug && og.twinLang) {
    const twinUrl =
      og.twinLang === "ar"
        ? `https://alkemos.com/ar/blog/${og.twinSlug}`
        : `https://alkemos.com/blog/${og.twinSlug}`;
    const languages: Record<string, string> = {
      [selfLang]: og.articleUrl,
      [og.twinLang]: twinUrl,
    };
    // x-default points at the EN variant whenever one exists in the pair.
    languages["x-default"] = languages.en ?? og.articleUrl;
    return languages;
  }
  return { [selfLang]: og.articleUrl, "x-default": og.articleUrl };
}


/**
 * M28 fix: fetch a published blog post's FULL content server-side.
 *
 * Previously BlogArticlePage was a "use client" component that fetched
 * the post via getBlogPost() in a useEffect — Googlebot saw an empty
 * <div> where the article body should be. This function fetches the
 * full post server-side so the article HTML is in the initial response.
 *
 * Returns null when Supabase isn't configured, the post doesn't exist,
 * or the request fails.
 */
const fetchBlogPostFullUncached = async (
  slug: string,
  lang: "en" | "ar",
): Promise<BlogPostFull | null> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("language", lang)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return null;
    return data as BlogPostFull;
  } catch {
    return null;
  }
};

// Cached wrapper — 1 hour revalidate (VERCEL-USAGE-9 2026-10-09: aligned
// with the blog pages' 1h ISR window — blog posts change rarely)
export const fetchBlogPostFull = unstable_cache(
  fetchBlogPostFullUncached,
  ["blog-full"],
  { revalidate: 3600 },
);

/**
 * Phase 156 (SEO-GEO-4.8, §7.1 #15): published blog slugs per language —
 * the truth source for the render-time link-prefix sanitizer
 * (blog-content-sanitize.ts). A wrong-prefix link is only rewritten when
 * the target genuinely exists in the reader's language, so a missing or
 * deliberately cross-language target can never be turned into a 404.
 * Light select (slug, language only) + unstable_cache aligned with the
 * blog pages' ISR window (VERCEL-USAGE-9 2026-10-09: 300s → 3600s —
 * same change as the blog pages' revalidate; at most one extra query
 * per hour).
 *
 * ─────────────────────────────────────────────────────────────────────
 * PHASE 174 (2026-09-11, live incident): `unstable_cache` JSON-serializes
 * its cached value, and a `Set` serializes to `{}` — so every cache HIT
 * handed the sanitizer `{en: {}, ar: {}}` instead of real Sets. The AR
 * legacy corpus (26/37 published AR posts carry `](/blog/…)` links) then
 * crashed the whole page render with `TypeError: pools.ar.has is not a
 * function` → those 26 articles served HTTP 500 in production since
 * Phase 156 (reproduced locally with `next build && next start`; perfect
 * correlation: 26/26 broken posts have the links, 11/11 working have
 * none). FIX: the CACHED primitive now stores JSON-safe string ARRAYS;
 * the exported wrapper rebuilds real Sets on every call, so every
 * consumer keeps the exact same `{en: Set, ar: Set}` contract.
 * ─────────────────────────────────────────────────────────────────────
 */
const fetchPublishedBlogSlugPoolsCached = unstable_cache(
  async (): Promise<{ en: string[]; ar: string[] }> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const pools: { en: string[]; ar: string[] } = { en: [], ar: [] };
    if (!supabaseUrl || !supabaseAnonKey) return pools;
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, language")
        .eq("is_published", true);
      if (error || !data) return pools;
      for (const row of data as Array<{ slug: string; language: string }>) {
        if (row.language === "ar") pools.ar.push(row.slug);
        else pools.en.push(row.slug);
      }
    } catch {
      // empty pools on failure — sanitizer degrades to a no-op (never 500s)
    }
    return pools;
  },
  ["blog-slug-pools"],
  { revalidate: 3600 },
);

/** Cached wrapper → REAL Sets for every caller (API unchanged, JSON-safe). */
export async function fetchPublishedBlogSlugPools(): Promise<{
  en: Set<string>;
  ar: Set<string>;
}> {
  const raw = await fetchPublishedBlogSlugPoolsCached();
  return {
    en: new Set(Array.isArray(raw?.en) ? raw.en : []),
    ar: new Set(Array.isArray(raw?.ar) ? raw.ar : []),
  };
}

// FAQ item moved to blog.ts (client-safe single source of truth — Phase 90)
// and re-exported here for the existing blog-server import surface.
export type { BlogFaq };

/**
 * Full published post row (select("*")). Derived from BlogPost so the
 * client article view (BlogArticlePage) stays assignable — with a typed
 * faq_json (JSONB array of {question, answer}) instead of `any`.
 */
export type BlogPostFull = Omit<BlogPost, "faq_json"> & {
  faq_json: BlogFaq[] | null;
};

// ─────────────────────────────────────────────────────────────────────
// FEED LISTING (Phase 86 — owner SEO/GEO push): server-side published-
// posts list for /rss.xml + /ar/rss.xml + /llms-full.txt. Mirrors the
// fetchBlogForOG* env/client pattern (fresh server client, anon keys,
// null-safe when Supabase env is absent → feeds degrade to empty, never
// throw). Sorted newest-first, capped by the caller.
// ─────────────────────────────────────────────────────────────────────
export type BlogFeedItem = {
  title: string;
  slug: string;
  excerpt: string | null;
  meta_description: string | null;
  category: string;
  featured_image: string | null;
  published_at: string | null;
  updated_at: string;
};

export async function listPublishedPostsForFeed(
  lang: "en" | "ar",
  limit = 50,
): Promise<BlogFeedItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "title, slug, excerpt, meta_description, category, featured_image, published_at, updated_at",
      )
      .eq("is_published", true)
      .eq("language", lang)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as BlogFeedItem[];
  } catch {
    return [];
  }
}

/**
 * Full published posts for the blog LIST page (server-side).
 *
 * SSR fix (H1, performance audit 2026-09-05): /blog used to render an
 * empty shell and fetch posts client-side after hydration — crawlers
 * saw zero articles and LCP waited on a second round trip. The server
 * pages now fetch the full list here and pass it as `initialPosts`.
 */
export async function listPublishedPostsForListPage(
  lang: "en" | "ar",
): Promise<BlogPostCard[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Phase 134 (perf): card fields ONLY. The previous select("*") pulled
    // every article's full `content` (10-30KB each) into the /blog RSC
    // payload — 476KB of HTML for a list of cards. Article bodies are
    // fetched per-slug by fetchBlogPostFull on the article route.
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, language, title, slug, excerpt, focus_keyword, keywords, category, tags, featured_image, cover_alt, reading_time, author, published_at, created_at",
      )
      .eq("is_published", true)
      .eq("language", lang)
      .order("published_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as BlogPostCard[];
  } catch {
    return [];
  }
}

/**
 * P2-11 (§12.36 — crawlable blog categories): the published-post list
 * for ONE category, in one language — the server data behind
 * /blog/category/[slug] and /ar/blog/category/[slug]. Same card-fields
 * law as listPublishedPostsForListPage (Phase 134): bodies never load
 * on list pages. Empty array on any failure — the route then renders
 * its honest empty state, never a 500.
 */
export async function listPublishedPostsByCategory(
  lang: "en" | "ar",
  categoryId: string,
): Promise<BlogPostCard[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // CONTENT-AUDIT P1-8 (2026-09-28, audit §2.4): membership is now the
    // EFFECTIVE category (render-time override map in blog-categories.ts).
    // The DB filter is dropped in favor of an in-memory pass — the corpus
    // is small (≤ ~50 card rows per language, body fields excluded), and
    // the stored category alone put recovery-device and training-split
    // articles inside /blog/category/nutrition, diluting topical authority.
    // DB rows stay untouched (render-time law).
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, language, title, slug, excerpt, focus_keyword, keywords, category, tags, featured_image, cover_alt, reading_time, author, published_at, created_at",
      )
      .eq("is_published", true)
      .eq("language", lang)
      .order("published_at", { ascending: false });
    if (error) return [];
    const rows = (data ?? []) as BlogPostCard[];
    return rows.filter((p) => effectiveCategory(p.slug, p.category) === categoryId);
  } catch {
    return [];
  }
}
