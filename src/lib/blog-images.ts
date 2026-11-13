/**
 * Blog featured image sourcing — PEXELS-FIRST REAL PHOTOGRAPHY.
 *
 * OWNER DIRECTIVE (2026-08-28): «استبدل خطوه الصور تماما الى
 * PEXELS_API_KEY داخل GitHub Action … بحيث يكون فى اشخاص عادى لكن لا عرى»
 *
 * Sources (in order of priority):
 *   1. Pexels API (PEXELS_API_KEY) — PRIMARY. Real fitness photography,
 *      normal people ALLOWED, nudity screened out at query AND result
 *      level. PHASE 173 OWNER LAW: no women or girls in any NEW article
 *      image — female-subject alt-texts rejected, female words stripped
 *      from queries; men-only or non-human subjects.
 *      `src.landscape` = 1200×627 auto=compress CDN URL → the
 *      site's next/image system converts it to lightweight WebP.
 *   2. Unsplash API (optional key)
 *   3. Pixabay API (optional key, safesearch=true)
 *
 * RETIRED (2026-08-28): Pollinations AI generation — removed entirely
 * per owner directive (real photography only, no diffusion renders).
 *
 * DIVERSITY: search returns up to 6 results; the picked index rotates
 * deterministically per variationKey = (article, position) so posts and
 * in-article slots never repeat the same photo while staying stable.
 */

import {
  sanitizeImageQuery,
  hasNsfwVocabulary,
  hasImmodestSignal,
  hasFemaleSubjectSignal,
  pickResultIndex,
  isExcludedImageUrl,
  normalizeImageUrlForCompare,
} from "@/lib/image-safety";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

/**
 * v3.1 RESULT SCREENING — combined modesty gate for alt-texts:
 * NSFW vocabulary AND immodest-signal wording ("flexing his muscles",
 * "shirtless", "six pack"…) both reject a candidate photo.
 * PHASE 173 OWNER LAW: female-subject wording ("woman lifting
 * dumbbells", "امرأة في الجيم", …) ALSO rejects the candidate — no new
 * article image may contain women or girls. This is the FINAL
 * selection-time verification for every source (Pexels, Unsplash,
 * Pixabay) and therefore every consumer (P3 automated pipeline, coach
 * editor suggest/swap flow, article materialization). When every
 * candidate of a search is rejected the source returns null → the
 * failover chain tries the next source → P3 falls back to its
 * non-human FALLBACK_QUERIES (equipment/food/empty gym).
 */
function altTextUnsafe(alt: string | null | undefined): boolean {
  if (!alt) return false;
  return hasNsfwVocabulary(alt) || hasImmodestSignal(alt) || hasFemaleSubjectSignal(alt);
}

export type SourcedImage = { url: string; alt: string; credit: string } | null;

/**
 * Per-call image-source options:
 *  - variationKey: deterministic (article, position) key that rotates
 *    the picked result inside the search results (owner: no two images
 *    in the blog should look like copies of one another).
 */
export type ImageSourceOptions = {
  variationKey?: string;
  /** OWNER IMAGE-SWAP (2026-08-28f): URLs already seen/rejected in this
   *  editing session — the same photo is never suggested twice. */
  excludeUrls?: string[];
};

/** Results fetched per search — rotation pool size (v4: 6 → 15, PHASE 62
 *  variety fix: a 6-photo pool made similar topics share the same photos). */
const RESULTS_PER_SEARCH = 15;

/**
 * PHASE 62 VARIETY: URLs of the most recent articles' featured images —
 * used as a cross-article exclusion list so new posts stop reusing the
 * same cover photos. Never throws (empty list = no exclusion).
 */
export async function getRecentFeaturedImageUrls(limit = 30): Promise<string[]> {
  try {
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("featured_image")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((p) => String(p.featured_image || "")).filter(Boolean);
  } catch {
    return [];
  }
}

/** Pexels search-result photo shape (only the fields we consume). */
type PexelsPhoto = {
  alt?: string | null;
  photographer?: string | null;
  width?: number | null;
  height?: number | null;
  src?: { landscape?: string; large?: string; medium?: string; original?: string } | null;
};

/**
 * BLOG-DIVERSITY-ENGINE (2026-11-13) — full candidate lists for the ranked
 * image-discovery path: every safe result of ONE source search, in result
 * order (rank 0 = the source's own relevance head). The legacy single-pick
 * functions below ride these lists, so there is ONE fetch path per source.
 */
export type ImageCandidate = {
  url: string;
  alt: string;
  credit: string;
  source: "pexels" | "unsplash" | "pixabay";
  width?: number;
  height?: number;
  /** 0-based position in the source's own result order. */
  rank: number;
};

/** All safe Pexels results for a query (alt-screened + exclusion-filtered). */
async function searchPexelsCandidates(
  query: string,
  opts?: ImageSourceOptions,
): Promise<ImageCandidate[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query.trim()) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${RESULTS_PER_SEARCH}&orientation=landscape`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { photos?: PexelsPhoto[] } | null;
    const photos = data?.photos ?? [];
    return photos
      .map((p, rank) => ({
        p,
        url: p.src?.landscape || p.src?.large || p.src?.medium || p.src?.original || "",
        rank,
      }))
      .filter(
        (c) =>
          c.url && !altTextUnsafe(c.p.alt) && !isExcludedImageUrl(c.url, opts?.excludeUrls),
      )
      .map((c) => ({
        url: c.url,
        alt: c.p.alt || query,
        credit: c.p.photographer ? `Photo by ${c.p.photographer} on Pexels` : "Pexels",
        source: "pexels" as const,
        width: c.p.width ?? undefined,
        height: c.p.height ?? undefined,
        rank: c.rank,
      }));
  } catch {
    return [];
  }
}

/**
 * Search Pexels for a photo matching the query. PRIMARY source.
 * Alt-texts are NSFW-screened; the picked index rotates per variationKey.
 */
async function searchPexels(
  query: string,
  opts?: ImageSourceOptions,
): Promise<SourcedImage> {
  const candidates = await searchPexelsCandidates(query, opts);
  if (candidates.length === 0) return null;
  const picked = candidates[pickResultIndex(candidates.length, opts?.variationKey)];
  return { url: picked.url, alt: picked.alt, credit: picked.credit };
}

/** Unsplash search-result photo shape (only the fields we consume). */
type UnsplashPhoto = {
  alt_description?: string | null;
  description?: string | null;
  width?: number | null;
  height?: number | null;
  urls?: { regular?: string; full?: string } | null;
  user?: { name?: string | null } | null;
};

/** All safe Unsplash results for a query (failover source). */
async function searchUnsplashCandidates(
  query: string,
  opts?: ImageSourceOptions,
): Promise<ImageCandidate[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query.trim()) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${RESULTS_PER_SEARCH}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: UnsplashPhoto[] } | null;
    const results = data?.results ?? [];
    return results
      .map((p, rank) => ({
        p,
        url: p.urls?.regular || p.urls?.full || "",
        rank,
      }))
      .filter(
        (c) =>
          c.url &&
          !altTextUnsafe(c.p.alt_description || c.p.description) &&
          !isExcludedImageUrl(c.url, opts?.excludeUrls),
      )
      .map((c) => ({
        url: c.url,
        alt: c.p.alt_description || query,
        credit: c.p.user?.name ? `Photo by ${c.p.user.name} on Unsplash` : "Unsplash",
        source: "unsplash" as const,
        width: c.p.width ?? undefined,
        height: c.p.height ?? undefined,
        rank: c.rank,
      }));
  } catch {
    return [];
  }
}

/**
 * Search Unsplash for a photo matching the query (failover source).
 */
async function searchUnsplash(
  query: string,
  opts?: ImageSourceOptions,
): Promise<SourcedImage> {
  const candidates = await searchUnsplashCandidates(query, opts);
  if (candidates.length === 0) return null;
  const picked = candidates[pickResultIndex(candidates.length, opts?.variationKey)];
  return { url: picked.url, alt: picked.alt, credit: picked.credit };
}

/** Pixabay search-result photo shape (only the fields we consume). */
type PixabayPhoto = {
  tags?: string | null;
  largeImageURL?: string;
  webformatURL?: string;
  previewURL?: string;
  user?: string | null;
  imageWidth?: number;
  imageHeight?: number;
};

/** All safe Pixabay results for a query (failover source; safesearch=true). */
async function searchPixabayCandidates(
  query: string,
  opts?: ImageSourceOptions,
): Promise<ImageCandidate[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key || !query.trim()) return [];
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${RESULTS_PER_SEARCH}&safesearch=true`,
      { signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { hits?: PixabayPhoto[] } | null;
    const hits = data?.hits ?? [];
    return hits
      .map((h, rank) => ({
        h,
        url: h.largeImageURL || h.webformatURL || h.previewURL || "",
        rank,
      }))
      .filter(
        (c) => c.url && !altTextUnsafe(c.h.tags) && !isExcludedImageUrl(c.url, opts?.excludeUrls),
      )
      .map((c) => ({
        url: c.url,
        alt: c.h.tags || query,
        credit: c.h.user ? `Photo by ${c.h.user} on Pixabay` : "Pixabay",
        source: "pixabay" as const,
        width: c.h.imageWidth,
        height: c.h.imageHeight,
        rank: c.rank,
      }));
  } catch {
    return [];
  }
}

/**
 * Search Pixabay for a photo matching the query (failover source;
 * safesearch=true is enforced by their API).
 */
async function searchPixabay(
  query: string,
  opts?: ImageSourceOptions,
): Promise<SourcedImage> {
  const candidates = await searchPixabayCandidates(query, opts);
  if (candidates.length === 0) return null;
  const picked = candidates[pickResultIndex(candidates.length, opts?.variationKey)];
  return { url: picked.url, alt: picked.alt, credit: picked.credit };
}

/**
 * Fetch a featured image for a blog article.
 * Pexels first (real photography, people OK / nudity never), then
 * Unsplash, then Pixabay.
 */
export async function fetchFeaturedImage(
  query: string,
  opts?: ImageSourceOptions,
): Promise<SourcedImage> {
  if (!query.trim()) return null;

  // DEFENSIVE GATE: every source receives a sanitized query — NSFW vocab
  // and negation constructions stripped; people words preserved (v3 law).
  const { query: safeQuery } = sanitizeImageQuery(query);
  if (!safeQuery) return null;

  const sources = [
    () => searchPexels(safeQuery, opts),
    () => searchUnsplash(safeQuery, opts),
    () => searchPixabay(safeQuery, opts),
  ];

  for (const source of sources) {
    const result = await source();
    if (result) return result;
  }

  return null;
}

/**
 * Fetch a featured image using multiple search queries. Each query gets
 * its own variation suffix so multi-query sourcing stays diverse.
 */
export async function fetchFeaturedImageMultiQuery(
  queries: string[],
  opts?: ImageSourceOptions,
): Promise<SourcedImage> {
  for (let i = 0; i < queries.length; i++) {
    const key = opts?.variationKey ? `${opts.variationKey}-q${i}` : undefined;
    const result = await fetchFeaturedImage(queries[i], { ...opts, variationKey: key });
    if (result) return result;
  }
  return null;
}

/**
 * BLOG-DIVERSITY-ENGINE (2026-11-13) — multi-source candidate pool for the
 * ranked discovery path: Pexels first; when it returns fewer than `limit`
 * safe results the failover sources top the list up (one query, one pass,
 * no repeated searches). Results are URL-deduped and capped at `limit`.
 */
export async function fetchImageCandidates(
  query: string,
  opts?: ImageSourceOptions & { limit?: number },
): Promise<ImageCandidate[]> {
  const { query: safeQuery } = sanitizeImageQuery(query || "");
  if (!safeQuery) return [];
  const limit = Math.max(1, Math.min(opts?.limit ?? 12, 20));

  const out: ImageCandidate[] = [];
  const seen = new Set<string>();
  const push = (list: ImageCandidate[]) => {
    for (const c of list) {
      const key = normalizeImageUrlForCompare(c.url);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(c);
      if (out.length >= limit) return;
    }
  };

  push(await searchPexelsCandidates(safeQuery, opts));
  if (out.length < limit) push(await searchUnsplashCandidates(safeQuery, opts));
  if (out.length < limit) push(await searchPixabayCandidates(safeQuery, opts));
  return out;
}

/**
 * BLOG-DIVERSITY-ENGINE (2026-11-13) — the visual-dedup memory: featured
 * images of the most recent posts PLUS the images embedded in their bodies
 * (the legacy memory saw featured covers only, so a repeated scene could
 * re-enter through a body slot). Degrades to [] on any failure.
 */
export async function getRecentImageUrls(featuredLimit = 30, bodyPostLimit = 10): Promise<string[]> {
  try {
    if (!isSupabaseAdminConfigured || !supabaseAdmin) return [];
    const { data } = await supabaseAdmin
      .from("blog_posts")
      .select("featured_image, content")
      .order("created_at", { ascending: false })
      .limit(Math.max(featuredLimit, bodyPostLimit));
    const rows = data ?? [];
    const urls: string[] = [];
    const seen = new Set<string>();
    const add = (u: unknown) => {
      const s = String(u || "");
      const key = normalizeImageUrlForCompare(s);
      if (s.startsWith("http") && key && !seen.has(key)) {
        seen.add(key);
        urls.push(s);
      }
    };
    rows.slice(0, featuredLimit).forEach((r) => add(r.featured_image));
    // markdown body images: ![alt](url)
    rows.slice(0, bodyPostLimit).forEach((r) => {
      const md = String(r.content || "");
      const re = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(md)) !== null) add(m[1]);
    });
    return urls;
  } catch {
    return [];
  }
}

/**
 * BODY IMAGE EMBEDDING LAW (2026-08-27): P3 sources 3–5 images per article
 * but P5 only consumed images[0] (featured/og cover) — positions 2..N went
 * to waste and every published article rendered as a bare wall of text.
 *
 * `embedBodyImages` inserts images[1..N] (capped at MAX_BODY_IMAGES) into
 * the reviewed markdown at evenly-spaced `##` section boundaries — the
 * classic "section header → supporting image" blog pattern.
 *
 * Guarantees (unit-tested canaries in src/lib/__tests__/blog-images.test.ts):
 *  - images[0] (the featured/og cover) is NEVER duplicated into the body;
 *  - idempotent: any URL already present in the markdown is skipped, so
 *    re-running publish or the embed backfill cannot double-insert;
 *  - no `##` headings → strict no-op (never injects into unstructured
 *    content);
 *  - fenced code blocks (```/~~~) are never treated as heading boundaries;
 *  - alt text is markdown-safe (brackets stripped).
 */
export const MAX_BODY_IMAGES = 3;

export function embedBodyImages(
  markdown: string,
  images: Array<{ url: string; alt?: string; credit?: string } | null | undefined>,
  maxImages: number = MAX_BODY_IMAGES,
): string {
  if (typeof markdown !== "string" || markdown.length === 0) return markdown;
  if (maxImages <= 0) return markdown;

  const usable = (images || []).filter(
    (i): i is { url: string; alt?: string; credit?: string } =>
      Boolean(i && typeof i.url === "string" && i.url.length > 0),
  );
  // images[0] is the COVER (featured_image + og:image) — body starts at 1.
  const candidates = usable.slice(1, 1 + maxImages);
  if (candidates.length === 0) return markdown;

  const startsWithHeading = markdown.startsWith("## ");
  const hasInlineHeading = markdown.includes("\n## ");
  if (!startsWithHeading && !hasInlineHeading) return markdown;

  const lines = markdown.split("\n");
  const fenceRe = /^\s*(```|~~~)/;
  let fenced = false;
  const headingIdx: number[] = [];
  lines.forEach((line, i) => {
    if (fenceRe.test(line)) fenced = !fenced;
    else if (!fenced && /^##\s+\S/.test(line)) headingIdx.push(i);
  });
  if (headingIdx.length === 0) return markdown;

  const H = headingIdx.length;
  const K = candidates.length;
  const byHeading = new Map<number, { url: string; alt?: string }>();
  for (let i = 0; i < K; i++) {
    const pos = Math.min(H, Math.max(1, Math.round(((i + 1) * H) / (K + 1))));
    const idx = headingIdx[pos - 1];
    if (idx !== undefined && !byHeading.has(idx)) byHeading.set(idx, candidates[i]);
  }
  if (byHeading.size === 0) return markdown;

  const out: string[] = [];
  let inserted = 0;
  lines.forEach((line, i) => {
    out.push(line);
    const img = byHeading.get(i);
    if (img && !markdown.includes(img.url)) {
      const alt = (img.alt || "Alkemos").replace(/[[\]]/g, "").trim() || "Alkemos";
      out.push("");
      out.push(`![${alt}](${img.url})`);
      out.push("");
      inserted += 1;
    }
  });

  return inserted > 0 ? out.join("\n") : markdown;
}
