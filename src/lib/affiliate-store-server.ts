/**
 * STORE-SERVER — the server-side data layer of the Alkemos Affiliate Store
 * (System 2 — EN-only; the recipes-server.ts pattern lifted to the store).
 *
 * LAWS:
 *  - Public reads go through a fresh ANON client: RLS on the store_*
 *    tables (migration 0115) allows the public to read ACTIVE categories
 *    and PUBLISHED products only — the database enforces what this layer
 *    queries.
 *  - Every query is wrapped in unstable_cache with the `store-*` tags so
 *    the admin publish flow can revalidateTag a fresh state everywhere.
 *  - Null-safe by law: no Supabase env / DB error → empty result, never
 *    a thrown 500 (pages degrade to their honest empty states).
 *  - THE THIN-PAGE LAW (governing law §1.4 + CATEGORIES-EN.md §4): a MAIN
 *    category is publicly listable only when its subtree holds ≥3
 *    PUBLISHED products ("الفئة لا تُنششر قبل 3 منتجات مراجعة" — the
 *    eight launch categories × 3–4 products counting). Sub (leaf) pages
 *    render from ≥1 published product; subs with none render nothing.
 *  - ISR: the pages set revalidate 3600; the cache tags give the owner's
 *    publish action its same-window freshness path.
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
  /** For a LEAF: the products grid. For a MAIN: empty (sections carry them). */
  products: AffiliateStoreProductCard[];
};

export type AffiliateStoreProductCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  brand: string | null;
  imageUrl: string | null;
  editorialRating: number | null;
  isFeatured: boolean;
  /** The LEAF category that owns the product URL (/affiliate-store/[category]/[slug]). */
  categorySlug: string;
  categoryName: string;
  categoryIconKey: string | null;
};

export type AffiliateStoreProductDetail = AffiliateStoreProductCard & {
  content: string;
  asin: string | null;
  updatedAt: string;
  /** Internal EN surface bindings (Phase 2 reads these; detail page shows related tools). */
  links: Array<{ surfaceType: string; surfaceKey: string }>;
};

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
  "id" | "slug" | "name" | "description" | "icon_key" | "parent_id" | "is_active"
>;
type ProductRow = Pick<
  AffiliateStoreProduct,
  | "id" | "slug" | "title" | "summary" | "brand" | "image_url"
  | "editorial_rating" | "is_featured" | "content" | "asin" | "updated_at"
  | "category_id"
>;

const CATEGORY_COLUMNS = "id,slug,name,description,icon_key,parent_id,is_active";
const PRODUCT_COLUMNS =
  "id,slug,title,summary,brand,image_url,editorial_rating,is_featured,content,asin,updated_at,category_id";

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

async function fetchPublishedCategoriesCounts(): Promise<Map<string, number>> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return new Map();
    // RLS gives published only; group in code (the count endpoint would
    // need an RPC — 0115 deliberately ships none).
    const { data } = await client
      .from("affiliate_store_products")
      .select("category_id")
      .eq("is_published", true);
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as Array<{ category_id: string }>) {
      counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    }
    return counts;
  } catch {
    return new Map();
  }
}

async function fetchPublishedProducts(limit = 200): Promise<
  Array<ProductRow & { category: CategoryRow | null }>
> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return [];
    const { data } = await client
      .from("affiliate_store_products")
      .select(`${PRODUCT_COLUMNS},affiliate_store_categories(${CATEGORY_COLUMNS})`)
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as unknown as Array<ProductRow & { category: CategoryRow | null }>);
  } catch {
    return [];
  }
}

async function fetchProductBySlug(
  slug: string,
): Promise<(ProductRow & { category: CategoryRow | null }) | null> {
  try {
    const client = affiliateStorePublicClient();
    if (!client) return null;
    const { data } = await client
      .from("affiliate_store_products")
      .select(`${PRODUCT_COLUMNS},affiliate_store_categories(${CATEGORY_COLUMNS})`)
      .eq("is_published", true)
      .eq("slug", slug)
      .maybeSingle();
    return ((data ?? null) as unknown as (ProductRow & { category: CategoryRow | null }) | null);
  } catch {
    return null;
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

function toCard(
  row: ProductRow & { category: CategoryRow | null },
): AffiliateStoreProductCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    brand: row.brand,
    imageUrl: row.image_url,
    editorialRating: row.editorial_rating,
    isFeatured: row.is_featured,
    categorySlug: row.category?.slug ?? "",
    categoryName: row.category?.name ?? "",
    categoryIconKey: row.category?.icon_key ?? null,
  };
}

/**
 * The public category tree (ACTIVE only) with published counts and the
 * main-visibility verdicts. Cached (store-tree tag).
 */
export const getAffiliateStoreTree = unstable_cache(
  async (): Promise<{
    mains: AffiliateStoreCategoryNode[];
    subs: AffiliateStoreCategoryNode[];
  }> => {
    const [categories, counts] = await Promise.all([
      fetchActiveCategories(),
      fetchPublishedCategoriesCounts(),
    ]);
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
    return { mains, subs };
  },
  ["affiliate-store-tree"],
  { revalidate: 3600, tags: ["affiliate-store-tree", "affiliate-store-products"] },
);

/**
 * MAIN-category public listing (the /store grid + sitemap + main pages):
 * active mains whose subtree holds ≥ MAIN_CATEGORY_MIN_PUBLISHED published
 * products (the thin-page law).
 */
export async function listPublicAffiliateStoreMainCategories(): Promise<AffiliateStoreCategoryNode[]> {
  const { mains } = await getAffiliateStoreTree();
  return mains.filter((main) => main.publishedCount >= MAIN_CATEGORY_MIN_PUBLISHED);
}

/**
 * The featured rail (published + featured first, newest fallback).
 * Cached (store-featured tag).
 */
export const listFeaturedAffiliateStoreProducts = unstable_cache(
  async (limit = 8): Promise<AffiliateStoreProductCard[]> => {
    const rows = await fetchPublishedProducts(200);
    const cards = rows.map(toCard);
    const featured = cards.filter((c) => c.isFeatured);
    const rest = cards.filter((c) => !c.isFeatured);
    return [...featured, ...rest].slice(0, limit);
  },
  ["affiliate-store-featured"],
  { revalidate: 3600, tags: ["affiliate-store-featured", "affiliate-store-products"] },
);

/**
 * One category page (main → sub sections; leaf → product grid).
 * Returns null when the category is unknown/inactive, a main below the
 * thin-page floor, or a leaf with zero published products.
 */
export async function getAffiliateStoreCategoryPage(
  slug: string,
): Promise<AffiliateStoreCategoryPage | null> {
  const { mains, subs } = await getAffiliateStoreTree();
  const main = mains.find((m) => m.slug === slug);
  if (main) {
    if (main.publishedCount < MAIN_CATEGORY_MIN_PUBLISHED) return null;
    const rows = await fetchPublishedProducts(400);
    const products = rows.map(toCard);
    const sections = subs
      .filter((sub) => sub.parentId === main.id && sub.publishedCount > 0)
      .map((sub) => ({
        category: sub,
        products: products.filter((p) => p.categorySlug === sub.slug),
      }));
    return { category: main, sections, products: [] };
  }
  const leaf = subs.find((s) => s.slug === slug);
  if (!leaf || leaf.publishedCount === 0) return null;
  const rows = await fetchPublishedProducts(400);
  return {
    category: leaf,
    sections: [],
    products: rows.map(toCard).filter((p) => p.categorySlug === leaf.slug),
  };
}

/**
 * One published product by slug (joined with its LEAF category for the
 * URL check + related links). Null when unpublished/unknown.
 */
export async function getAffiliateStoreProductBySlug(
  slug: string,
): Promise<AffiliateStoreProductDetail | null> {
  const row = await fetchProductBySlug(slug);
  if (!row) return null;
  const links = await fetchProductLinks(row.id);
  const card = toCard(row);
  return {
    ...card,
    content: row.content,
    asin: row.asin,
    updatedAt: row.updated_at,
    links: links.map((l) => ({ surfaceType: l.surface_type, surfaceKey: l.surface_key })),
  };
}

/**
 * Slugs for generateStaticParams + the sitemap child (published products
 * with their leaf-category slug pairs; qualifying category pages).
 * Cached (store-slugs tag) — the sitemap route revalidates hourly.
 */
export const listAffiliateStoreSitemapEntries = unstable_cache(
  async (): Promise<{
    categories: Array<{ slug: string; kind: "main" | "leaf"; updatedAt: string | null }>;
    products: Array<{ slug: string; categorySlug: string; updatedAt: string }>;
  }> => {
    const [{ mains, subs }, rows] = await Promise.all([
      getAffiliateStoreTree(),
      fetchPublishedProducts(1000),
    ]);
    const categories = [
      ...mains
        .filter((m) => m.publishedCount >= MAIN_CATEGORY_MIN_PUBLISHED)
        .map((m) => ({ slug: m.slug, kind: "main" as const, updatedAt: null })),
      ...subs
        .filter((s) => s.publishedCount > 0)
        .map((s) => ({ slug: s.slug, kind: "leaf" as const, updatedAt: null })),
    ];
    const products = rows.map((row) => ({
      slug: row.slug,
      categorySlug: row.category?.slug ?? "",
      updatedAt: row.updated_at,
    }));
    return { categories, products };
  },
  ["affiliate-store-slugs"],
  { revalidate: 3600, tags: ["affiliate-store-slugs", "affiliate-store-products"] },
);

/**
 * Related products (same main category, excluding the current product).
 * Used by the product page's RelatedProducts section.
 */
export async function listRelatedAffiliateStoreProducts(
  currentSlug: string,
  categorySlug: string,
  limit = 4,
): Promise<AffiliateStoreProductCard[]> {
  const { subs } = await getAffiliateStoreTree();
  const leaf = subs.find((s) => s.slug === categorySlug);
  if (!leaf) return [];
  const siblingSlugs = subs
    .filter((s) => s.parentId === leaf.parentId)
    .map((s) => s.slug);
  const rows = await fetchPublishedProducts(400);
  return rows
    .map(toCard)
    .filter(
      (p) => p.slug !== currentSlug && siblingSlugs.includes(p.categorySlug),
    )
    .slice(0, limit);
}
