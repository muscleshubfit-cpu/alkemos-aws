/**
 * STORE-SERVER — the server-side data layer of the Alkemos Affiliate Store
 * (System 2 — EN-only; the recipes-server.ts pattern lifted to the store).
 *
 * PHASE 527 (owner order 2026-11-27 «إعادة بناء تجربة Affiliate Store
 * تجاريًا») — the data layer was REBUILT around one hard production
 * lesson measured live on alkemos.com:
 *
 *   THE EMBED BAN (527-L1). PostgREST embedded resources
 *   (`products.select("*,affiliate_store_categories(...)")`) returned
 *   NULL for every row in the production runtime while BOTH direct
 *   reads (products, categories) worked — the public store rendered
 *   product cards whose `categorySlug` was "" (hrefs like
 *   `/affiliate-store//slug` → every product page 404, every category
 *   page an empty grid, the sitemap full of double-slash URLs). The
 *   ban: this layer NEVER uses an embed join again — products and
 *   categories are fetched with DIRECT queries and stitched in code
 *   (the join happens here, where it is testable and deterministic).
 *
 * LAWS:
 *  - Public reads go through a fresh ANON client: RLS on the store_*
 *    tables (migration 0115) allows the public to read ACTIVE categories
 *    and PUBLISHED products only — the database enforces what this layer
 *    queries.
 *  - Every query is wrapped in unstable_cache with the `affiliate-store-*`
 *    tags so the admin save flow (auto-publish, 527-L2) can revalidateTag
 *    a fresh state everywhere.
 *  - Null-safe by law: no Supabase env / DB error → empty result, never
 *    a thrown 500 (pages degrade to their honest empty states).
 *  - THE THIN-PAGE LAW (governing law §1.4 + CATEGORIES-EN.md §4): a MAIN
 *    category is publicly listable only when its subtree holds ≥3
 *    PUBLISHED products. Sub (leaf) pages render from ≥1 published
 *    product; subs with none render nothing.
 *  - ISR: the pages set revalidate 3600; the cache tags give the owner's
 *    save action its same-window freshness path.
 *  - 527-L3: products missing a real image (image_url) or a valid buy
 *    path (ASIN) are NOT listed on public surfaces — a product the
 *    visitor cannot see or buy is not a shelf product (owner order:
 *    «عدم نشر منتج في واجهة المتجر باعتباره منتجًا جاهزًا للبيع إذا
 *    كانت صورته الفعلية مفقودة»).
 */

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { Database, AffiliateStoreCategory, AffiliateStoreProduct } from "./supabase/types";

/* ───────────────────────── types (public view models) ───────────────── */

export type AffiliateStoreCategoryNode = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  /** Category tile image (0119 — owner order «استبدل أيقونات Shop by Category
   * بصور منتجات حقيقية»): the SAME trusted source as product images
   * (527-G1 — m.media-amazon.com original product photos). Null → the
   * carved icon renders. */
  imageUrl: string | null;
  parentId: string | null;
  publishedCount: number;
  /** true when this is a leaf (no active children) — used by leaf URLs. */
  isLeaf: boolean;
};

export type AffiliateStoreCategoryPage = {
  category: AffiliateStoreCategoryNode;
  /** For a MAIN: its qualifying sub sections. For a LEAF: itself. */
  sections: Array<{
    category: AffiliateStoreCategoryNode;
    products: AffiliateStoreProductCard[];
  }>;
  /** For a LEAF: the products grid. For a MAIN: every subtree product (527: mains show the full grid too). */
  products: AffiliateStoreProductCard[];
};

export type AffiliateStoreProductCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  brand: string | null;
  imageUrl: string | null;
  /** API-served price only (guards forbid manual prices); null → "See price on Amazon". */
  priceUsd: number | null;
  editorialRating: number | null;
  isFeatured: boolean;
  /** The LEAF category that owns the product URL (/affiliate-store/[category]/[slug]). */
  categorySlug: string;
  categoryName: string;
  categoryIconKey: string | null;
  /** The MAIN category slug (the store's filter dimension). */
  mainCategorySlug: string | null;
  mainCategoryName: string | null;
  updatedAt: string;
};

export type AffiliateStoreProductDetail = AffiliateStoreProductCard & {
  content: string;
  asin: string | null;
  /** Internal EN surface bindings (Phase 2 reads these; detail page shows related tools). */
  links: Array<{ surfaceType: string; surfaceKey: string }>;
};

/** Sort keys for the public store surfaces (527-L4). */
export type AffiliateStoreSortKey =
  | "featured"
  | "newest"
  | "rating"
  | "price-asc"
  | "price-desc"
  | "title";

export const AFFILIATE_STORE_SORT_KEYS: AffiliateStoreSortKey[] = [
  "featured",
  "newest",
  "rating",
  "price-asc",
  "price-desc",
  "title",
];

/* ───────────────────────── the anon read client ───────────────────────── */

function affiliateStorePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* ───────────────────── raw row shapes (fail-soft) ───────────────────── */

type CategoryRow = Pick<
  AffiliateStoreCategory,
  "id" | "slug" | "name" | "description" | "icon_key" | "image_url" | "parent_id" | "is_active"
>;
type ProductRow = Pick<
  AffiliateStoreProduct,
  | "id" | "slug" | "title" | "summary" | "brand" | "image_url"
  | "editorial_rating" | "is_featured" | "content" | "asin" | "updated_at"
  | "category_id" | "price_usd"
>;

const CATEGORY_COLUMNS = "id,slug,name,description,icon_key,image_url,parent_id,is_active";
const PRODUCT_COLUMNS =
  "id,slug,title,summary,brand,image_url,editorial_rating,is_featured,content,asin,updated_at,category_id,price_usd";

/**
 * 527-L3: the public shelf predicate — a product needs BOTH a real
 * image and a valid purchase identity (ASIN) to be a shelf product.
 * Applied AFTER the read (RLS already limits rows to published).
 */
function isShelfProduct(row: ProductRow): boolean {
  return Boolean(row.image_url && row.asin);
}

async function fetchActiveCategories(): Promise<CategoryRow[]> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return [];
    const { data } = await client
      .from("affiliate_store_categories")
      .select(CATEGORY_COLUMNS)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as CategoryRow[];
  } catch {
    return [];
  }
}

async function fetchPublishedProducts(limit = 400): Promise<ProductRow[]> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return [];
    const { data } = await client
      .from("affiliate_store_products")
      .select(PRODUCT_COLUMNS)
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as ProductRow[]).filter(isShelfProduct);
  } catch {
    return [];
  }
}

async function fetchPublishedCategoriesCounts(): Promise<Map<string, number>> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return new Map();
    // RLS gives published only; group in code (the count endpoint would
    // need an RPC — 0115 deliberately ships none). NOTE (527): counts
    // here are the RAW published counts (visibility math below applies
    // the shelf predicate itself for consistency with the grids).
    const { data } = await client
      .from("affiliate_store_products")
      .select("category_id,image_url,asin")
      .eq("is_published", true);
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as Array<{ category_id: string; image_url: string | null; asin: string | null }>) {
      if (!row.image_url || !row.asin) continue;
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }
    return counts;
  } catch {
    return new Map();
  }
}

async function fetchProductLinks(productId: string): Promise<
  Array<{ surface_type: string; surface_key: string }>
> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return [];
    const { data } = await client
      .from("affiliate_store_product_links")
      .select("surface_type,surface_key")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });
    return (data ?? []) as Array<{ surface_type: string; surface_key: string }>;
  } catch {
    return [];
  }
}

/* ───────────────────── the cached public API ───────────────────── */

/** The thin-page law: minimum PUBLISHED products for a main to be listable. */
export const MAIN_CATEGORY_MIN_PUBLISHED = 3;

/**
 * THE 527 STITCH (527-L1): products + categories read DIRECTLY and
 * joined in code. `categoriesById` maps id → row; a product whose
 * category is missing/inactive (RLS already blocks inactive) maps to
 * "" and is dropped from URL-bearing surfaces.
 */
function toCard(
  row: ProductRow,
  categoriesById: Map<string, CategoryRow>,
  parentByChildId: Map<string, CategoryRow>,
): AffiliateStoreProductCard | null {
  const category = categoriesById.get(row.category_id) ?? null;
  if (!category) return null; // no active category → no URL → not a card
  const parent = category.parent_id ? parentByChildId.get(category.parent_id) ?? null : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    brand: row.brand,
    imageUrl: row.image_url,
    priceUsd: row.price_usd ?? null,
    editorialRating: row.editorial_rating,
    isFeatured: row.is_featured,
    categorySlug: category.slug,
    categoryName: category.name,
    categoryIconKey: category.icon_key,
    mainCategorySlug: parent?.slug ?? null,
    mainCategoryName: parent?.name ?? null,
    updatedAt: row.updated_at,
  };
}

/**
 * The store's ONE cached data snapshot: the active category tree with
 * published counts + the full published, shelf-qualified product list
 * (cards stitched in code). Every public query below derives from it —
 * one cache entry, one DB round, zero embeds.
 */
export const getAffiliateStoreSnapshot = unstable_cache(
  async (): Promise<{
    mains: AffiliateStoreCategoryNode[];
    subs: AffiliateStoreCategoryNode[];
    cards: AffiliateStoreProductCard[];
    brands: string[];
  }> => {
    const [categories, productRows, counts] = await Promise.all([
      fetchActiveCategories(),
      fetchPublishedProducts(400),
      fetchPublishedCategoriesCounts(),
    ]);
    const categoriesById = new Map(categories.map((c) => [c.id, c]));
    const parentByChildId = new Map<string, CategoryRow>();
    for (const cat of categories) {
      if (cat.parent_id) {
        const parent = categoriesById.get(cat.parent_id);
        if (parent) parentByChildId.set(cat.id, parent);
      }
    }
    const childrenOf = new Map<string, CategoryRow[]>();
    for (const cat of categories) {
      if (cat.parent_id) {
        const list = childrenOf.get(cat.parent_id) ?? [];
        list.push(cat);
        childrenOf.set(cat.parent_id, list);
      }
    }
    const node = (cat: CategoryRow): AffiliateStoreCategoryNode => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      iconKey: cat.icon_key,
      imageUrl: cat.image_url,
      parentId: cat.parent_id,
      publishedCount: counts.get(cat.id) ?? 0,
      isLeaf: cat.parent_id !== null,
    });
    const mains: AffiliateStoreCategoryNode[] = [];
    const subs: AffiliateStoreCategoryNode[] = [];
    for (const cat of categories) {
      if (cat.parent_id === null) {
        const subtreeCount = (childrenOf.get(cat.id) ?? []).reduce(
          (sum, child) => sum + (counts.get(child.id) ?? 0),
          0,
        );
        mains.push({ ...node(cat), publishedCount: subtreeCount });
      } else {
        subs.push(node(cat));
      }
    }
    const cards: AffiliateStoreProductCard[] = productRows
      .map((row) => toCard(row, categoriesById, parentByChildId))
      .filter((c): c is AffiliateStoreProductCard => c !== null);
    const brands = [...new Set(cards.map((c) => c.brand).filter((b): b is string => Boolean(b)))].sort((a, b) =>
      a.localeCompare(b),
    );
    return { mains, subs, cards, brands };
  },
  ["affiliate-store-snapshot"],
  { revalidate: 3600, tags: ["affiliate-store-tree", "affiliate-store-products", "affiliate-store-featured", "affiliate-store-slugs"] },
);

/** Back-compat tree API (the homepage + admin surfaces). */
export async function getAffiliateStoreTree(): Promise<{
  mains: AffiliateStoreCategoryNode[];
  subs: AffiliateStoreCategoryNode[];
}> {
  const { mains, subs } = await getAffiliateStoreSnapshot();
  return { mains, subs };
}

/**
 * MAIN-category public listing (the store grid + sitemap + main pages):
 * active mains whose subtree holds ≥ MAIN_CATEGORY_MIN_PUBLISHED
 * shelf-qualified products (the thin-page law).
 */
export async function listPublicAffiliateStoreMainCategories(): Promise<AffiliateStoreCategoryNode[]> {
  const { mains } = await getAffiliateStoreSnapshot();
  return mains.filter((main) => main.publishedCount >= MAIN_CATEGORY_MIN_PUBLISHED);
}

/** The public brands list (the store's brand filter options). */
export async function listPublicAffiliateStoreBrands(): Promise<string[]> {
  const { brands } = await getAffiliateStoreSnapshot();
  return brands;
}

/** Sort the cards (the store's sort control — 527-L4). */
export function sortAffiliateStoreCards(
  cards: AffiliateStoreProductCard[],
  sort: AffiliateStoreSortKey,
): AffiliateStoreProductCard[] {
  const list = [...cards];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
    case "rating":
      return list.sort((a, b) => (b.editorialRating ?? -1) - (a.editorialRating ?? -1));
    case "price-asc":
      return list.sort((a, b) => {
        if (a.priceUsd === null && b.priceUsd === null) return 0;
        if (a.priceUsd === null) return 1;
        if (b.priceUsd === null) return -1;
        return a.priceUsd - b.priceUsd;
      });
    case "price-desc":
      return list.sort((a, b) => {
        if (a.priceUsd === null && b.priceUsd === null) return 0;
        if (a.priceUsd === null) return 1;
        if (b.priceUsd === null) return -1;
        return b.priceUsd - a.priceUsd;
      });
    case "title":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case "featured":
    default:
      return list.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0;
      });
  }
}

export type AffiliateStoreQuery = {
  q?: string;
  category?: string;
  brand?: string;
  sort?: AffiliateStoreSortKey;
};

/**
 * The store hub's ONE listing query (527-L4): search across title,
 * brand, summary; filter by main-or-leaf category slug and brand; sort.
 * All against the cached snapshot — no extra DB round, no embeds.
 */
export async function queryAffiliateStoreProducts(
  query: AffiliateStoreQuery,
): Promise<AffiliateStoreProductCard[]> {
  const { mains, subs, cards } = await getAffiliateStoreSnapshot();
  let out = cards;
  if (query.category) {
    const mainSlugs = new Set(mains.map((m) => m.slug));
    const subSlugs = new Set(subs.map((s) => s.slug));
    if (mainSlugs.has(query.category)) {
      out = out.filter((c) => c.mainCategorySlug === query.category);
    } else if (subSlugs.has(query.category)) {
      out = out.filter((c) => c.categorySlug === query.category);
    } else {
      return [];
    }
  }
  if (query.brand) {
    out = out.filter((c) => c.brand === query.brand);
  }
  if (query.q) {
    const q = query.q.trim().toLowerCase();
    if (q) {
      out = out.filter((c) =>
        `${c.title} ${c.brand ?? ""} ${c.summary}`.toLowerCase().includes(q),
      );
    }
  }
  return sortAffiliateStoreCards(out, query.sort ?? "featured");
}

/**
 * The featured rail (published + shelf-qualified; featured first, newest
 * fallback). Cached with the snapshot.
 */
export async function listFeaturedAffiliateStoreProducts(limit = 8): Promise<AffiliateStoreProductCard[]> {
  const { cards } = await getAffiliateStoreSnapshot();
  const featured = cards.filter((c) => c.isFeatured);
  const rest = cards.filter((c) => !c.isFeatured);
  return [...featured, ...rest].slice(0, limit);
}

/**
 * One category page (main → sub sections + the full grid; leaf → product
 * grid). Returns null when the category is unknown/inactive, a main
 * below the thin-page floor, or a leaf with zero shelf products.
 */
export async function getAffiliateStoreCategoryPage(
  slug: string,
): Promise<AffiliateStoreCategoryPage | null> {
  const { mains, subs, cards } = await getAffiliateStoreSnapshot();
  const main = mains.find((m) => m.slug === slug);
  if (main) {
    if (main.publishedCount < MAIN_CATEGORY_MIN_PUBLISHED) return null;
    const subtreeSlugs = subs
      .filter((sub) => sub.parentId === main.id)
      .map((sub) => sub.slug);
    const products = cards.filter(
      (p) => subtreeSlugs.includes(p.categorySlug) || p.mainCategorySlug === main.slug,
    );
    const sections = subs
      .filter((sub) => sub.parentId === main.id && sub.publishedCount > 0)
      .map((sub) => ({
        category: sub,
        products: products.filter((p) => p.categorySlug === sub.slug),
      }));
    return { category: main, sections, products: sortAffiliateStoreCards(products, "featured") };
  }
  const leaf = subs.find((s) => s.slug === slug);
  if (!leaf || leaf.publishedCount === 0) return null;
  const products = sortAffiliateStoreCards(cards.filter((p) => p.categorySlug === leaf.slug), "featured");
  return { category: leaf, sections: [], products };
}

/**
 * One published, shelf-qualified product by slug (stitched with its LEAF
 * category for the URL check + related links). Null when
 * unpublished/unknown/image-missing/ASIN-missing.
 */
export async function getAffiliateStoreProductBySlug(
  slug: string,
): Promise<AffiliateStoreProductDetail | null> {
  // 527-L1: DIRECT product read (no embed), then the stitch in code.
  let row: ProductRow | null = null;
  try {
    const client = affiliateStorePublicClient();
    if (!client) return null;
    const { data } = await client
      .from("affiliate_store_products")
      .select(PRODUCT_COLUMNS)
      .eq("is_published", true)
      .eq("slug", slug)
      .maybeSingle();
    row = ((data ?? null) as ProductRow | null);
  } catch {
    return null;
  }
  if (!row || !isShelfProduct(row)) return null;
  const { subs, mains } = await getAffiliateStoreTree();
  const leaf = subs.find((s) => s.id === row!.category_id);
  if (!leaf) return null;
  const links = await fetchProductLinks(row.id);
  const parent = mains.find((m) => m.id === leaf.parentId) ?? null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    brand: row.brand,
    imageUrl: row.image_url,
    priceUsd: row.price_usd ?? null,
    editorialRating: row.editorial_rating,
    isFeatured: row.is_featured,
    categorySlug: leaf.slug,
    categoryName: leaf.name,
    categoryIconKey: leaf.iconKey,
    mainCategorySlug: parent?.slug ?? null,
    mainCategoryName: parent?.name ?? null,
    updatedAt: row.updated_at,
    content: row.content,
    asin: row.asin,
    links: links.map((l) => ({ surfaceType: l.surface_type, surfaceKey: l.surface_key })),
  };
}

/**
 * Slugs for generateStaticParams + the sitemap child (published,
 * shelf-qualified products with their leaf-category slug pairs; qualifying
 * category pages). Cached with the snapshot — the sitemap route
 * revalidates hourly. 527: products without a leaf category never emit
 * the double-slash URL bug again (they are skipped entirely).
 */
export async function listAffiliateStoreSitemapEntries(): Promise<{
  categories: Array<{ slug: string; kind: "main" | "leaf"; updatedAt: string | null }>;
  products: Array<{ slug: string; categorySlug: string; updatedAt: string }>;
}> {
  const { mains, subs, cards } = await getAffiliateStoreSnapshot();
  const categories = [
    ...mains
      .filter((m) => m.publishedCount >= MAIN_CATEGORY_MIN_PUBLISHED)
      .map((m) => ({ slug: m.slug, kind: "main" as const, updatedAt: null })),
    ...subs
      .filter((s) => s.publishedCount > 0)
      .map((s) => ({ slug: s.slug, kind: "leaf" as const, updatedAt: null })),
  ];
  const products = cards
    .filter((p) => p.categorySlug)
    .map((p) => ({
      slug: p.slug,
      categorySlug: p.categorySlug,
      updatedAt: p.updatedAt,
    }));
  return { categories, products };
}

/**
 * Related products (same main category, excluding the current product).
 * Used by the product page's RelatedProducts section.
 */
export async function listRelatedAffiliateStoreProducts(
  currentSlug: string,
  categorySlug: string,
  limit = 4,
): Promise<AffiliateStoreProductCard[]> {
  const { subs, cards } = await getAffiliateStoreSnapshot();
  const leaf = subs.find((s) => s.slug === categorySlug);
  if (!leaf) return [];
  const siblingSlugs = subs
    .filter((s) => s.parentId === leaf.parentId)
    .map((s) => s.slug);
  return cards
    .filter(
      (p) => p.slug !== currentSlug && siblingSlugs.includes(p.categorySlug),
    )
    .slice(0, limit);
}

/* ───────── SURFACE ENTRANCES (VISIBILITY-PREVIEW 2026-11-26) ───────── */

/** The surface-binding types the editor can bind (the 0115 family). */
export const AFFILIATE_STORE_SURFACE_TYPES = [
  "tool",
  "equipment_hub",
  "program",
  "blog",
  "collection",
] as const;
export type AffiliateStoreSurfaceType = (typeof AFFILIATE_STORE_SURFACE_TYPES)[number];

/**
 * PUBLISHED, shelf-qualified products bound to one EN content surface
 * (affiliate_store_product_links: surface_type + surface_key — the
 * Phase-2 wiring the founding batch seeded). Equipment hubs, program
 * pages, and tool pages render these as "Recommended gear" entrances.
 *
 * 527-L1: the product_links read stays DIRECT (it always was) and the
 * product leg comes from the cached snapshot — no embeds anywhere.
 */
export async function listAffiliateStoreProductsForSurface(
  surfaceType: AffiliateStoreSurfaceType,
  surfaceKey: string,
  limit = 4,
): Promise<AffiliateStoreProductCard[]> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return [];
    const { data: linkRows } = await client
      .from("affiliate_store_product_links")
      .select("product_id")
      .eq("surface_type", surfaceType)
      .eq("surface_key", surfaceKey)
      .limit(24);
    const ids = new Set(((linkRows ?? []) as Array<{ product_id: string }>).map((r) => r.product_id));
    if (ids.size === 0) return [];
    const { cards } = await getAffiliateStoreSnapshot();
    return cards.filter((card) => ids.has(card.id)).slice(0, limit);
  } catch {
    return [];
  }
}

/* ───────── INLINE LINKS (the 529 smart-linking render path) ───────── */

/** One applied inline link (the public view model — RLS shows active
 *  rows of published, shelf-qualified products only). */
export type AffiliateStoreInlineLinkView = {
  productId: string;
  anchorPhrase: string;
  slug: string;
  categorySlug: string;
  title: string;
};

/**
 * The EN render path's inline-link reader (529): the active inline links
 * bound to one content page, stitched with their product's URL identity
 * (leaf category + slug) for the render-time injection. Fail-soft by
 * law (empty list, never a throw).
 */
export async function listAffiliateStoreInlineLinksForPage(
  pageType: string,
  pageSlug: string,
): Promise<AffiliateStoreInlineLinkView[]> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return [];
    // DIRECT link rows (527-L1: no embeds) …
    const { data: linkRows } = await client
      .from("affiliate_store_inline_links")
      .select("product_id,anchor_phrase")
      .eq("page_type", pageType)
      .eq("page_slug", pageSlug)
      .eq("is_active", true)
      // 534: DETERMINISTIC RENDER ORDER (created_at, then id) — the
      // approve/repair/auto-apply probes simulate the candidate appended
      // LAST; an unordered read could shuffle same-anchor links and starve
      // one of its occurrence (measured live: two 'pre-workout' links on
      // the evening-training page, only one rendered).
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(6);
    const rows = (linkRows ?? []) as Array<{ product_id: string; anchor_phrase: string }>;
    if (rows.length === 0) return [];
    // … then the shelf-qualified cards from the cached snapshot (the
    // stitch happens in code — the same 527 discipline).
    const { cards } = await getAffiliateStoreSnapshot();
    const byId = new Map(cards.map((c) => [c.id, c]));
    const out: AffiliateStoreInlineLinkView[] = [];
    for (const row of rows) {
      const card = byId.get(row.product_id);
      if (!card) continue; // RLS/snapshot already filtered drafts
      out.push({
        productId: card.id,
        anchorPhrase: row.anchor_phrase,
        slug: card.slug,
        categorySlug: card.categorySlug,
        title: card.title,
      });
    }
    return out;
  } catch {
    return [];
  }
}
