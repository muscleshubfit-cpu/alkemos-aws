/**
 * STORE-ADMIN — the server-side ADMIN data layer of the Alkemos Product
 * Store (the recipes-admin.ts pattern lifted to the store; System 2,
 * EN-only content fields).
 *
 * LAWS:
 *  - Every function runs through the SERVICE-ROLE client (supabaseAdmin)
 *    AFTER the route already verified the caller with requireAdmin —
 *    the 0105 channel law; the store tables' RLS admin policies are the
 *    second lock, this layer the first.
 *  - The 0097 owner-review flow is HONEST: products are born
 *    review_status='pending' + is_published=false; review flips
 *    pending→reviewed (owner action); publish REQUIRES reviewed and
 *    re-runs every store guard — no bypass (owner order 2026-11-26:
 *    «لا تتجاوز مراجعة المالك المطلوبة قبل نشر المنتجات»).
 *  - Publish/unpublish/category-activation flush the three cache layers
 *    for the store surfaces (revalidateTag + revalidatePath + the CF
 *    edge purge — the blog-cache-revalidate pattern, minimal + safe).
 *  - Nothing here touches System 1 (the affiliate_ / referral_ table family) — §0.
 */

import { revalidatePath, revalidateTag } from "next/cache";
import type {
  Database,
  StoreCategory,
  StoreProduct,
} from "./supabase/types";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase/admin";
import { purgeCloudflareEdgeUrls } from "./edge-purge";
import {
  blocksPublish,
  runStoreProductGuards,
  type StoreGuardFinding,
} from "./store-guards";
import { isValidAsin } from "./store-link";

export const STORE_CACHE_TAGS = [
  "store-tree",
  "store-featured",
  "store-slugs",
  "store-products",
] as const;

function client() {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  return supabaseAdmin;
}

/* ───────────────────── the cache flush (3 layers) ───────────────────── */

export function storePublicPaths(): string[] {
  return [
    "/store",
    "/sitemap-store.xml",
    "/sitemap.xml",
    "/affiliate-disclosure",
  ];
}

/**
 * Flush the store surfaces after any admin write: data-cache tags,
 * ISR paths, and (when configured) the Cloudflare edge HTML cache —
 * the 2026-10-21 three-layer lesson applied from day one.
 */
export async function flushStoreCaches(extraPaths: string[] = []): Promise<void> {
  for (const tag of STORE_CACHE_TAGS) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // revalidateTag throws outside a request scope (e.g. tests) —
      // the hourly ISR window still converges.
    }
  }
  const paths = [...storePublicPaths(), ...extraPaths];
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // same request-scope note as above
    }
  }
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alkemos.com";
    await purgeCloudflareEdgeUrls(paths.map((p) => `${base}${p}`));
  } catch {
    // fail-soft: the edge serves the old copy until its TTL (≤12h)
  }
}

/* ───────────────────── read helpers (admin listings) ───────────────── */

export type AdminStoreProductRow = StoreProduct & {
  category: Pick<StoreCategory, "id" | "slug" | "name" | "is_active"> | null;
};

export async function adminListStoreProducts(
  limit = 200,
): Promise<AdminStoreProductRow[]> {
  const db = client();
  if (!db) return [];
  const { data } = await db
    .from("store_products")
    .select(
      "*,store_categories(id,slug,name,is_active)",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as AdminStoreProductRow[]);
}

export async function adminGetStoreProduct(
  id: string,
): Promise<AdminStoreProductRow | null> {
  const db = client();
  if (!db) return null;
  const { data } = await db
    .from("store_products")
    .select("*,store_categories(id,slug,name,is_active)")
    .eq("id", id)
    .maybeSingle();
  return ((data ?? null) as unknown as AdminStoreProductRow | null);
}

export async function adminListProductLinks(productId: string): Promise<
  Array<{ surface_type: string; surface_key: string; sort_order: number }>
> {
  const db = client();
  if (!db) return [];
  const { data } = await db
    .from("store_product_links")
    .select("surface_type,surface_key,sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  return ((data ?? []) as Array<{
    surface_type: string;
    surface_key: string;
    sort_order: number;
  }>);
}

export type AdminStoreStats = {
  total: number;
  published: number;
  pending: number;
  reviewed: number;
  featured: number;
  withoutAsin: number;
  categoriesActive: number;
  categoriesInactive: number;
};

export async function adminStoreStats(): Promise<AdminStoreStats> {
  const db = client();
  const empty: AdminStoreStats = {
    total: 0,
    published: 0,
    pending: 0,
    reviewed: 0,
    featured: 0,
    withoutAsin: 0,
    categoriesActive: 0,
    categoriesInactive: 0,
  };
  if (!db) return empty;
  const [products, categories] = await Promise.all([
    db.from("store_products").select("is_published,review_status,is_featured,asin"),
    db.from("store_categories").select("is_active"),
  ]);
  const rows = (products.data ?? []) as Array<
    Pick<StoreProduct, "is_published" | "review_status" | "is_featured" | "asin">
  >;
  const cats = (categories.data ?? []) as Array<Pick<StoreCategory, "is_active">>;
  return {
    total: rows.length,
    published: rows.filter((r) => r.is_published).length,
    pending: rows.filter((r) => r.review_status === "pending").length,
    reviewed: rows.filter((r) => r.review_status === "reviewed").length,
    featured: rows.filter((r) => r.is_featured).length,
    withoutAsin: rows.filter((r) => !r.asin).length,
    categoriesActive: cats.filter((c) => c.is_active).length,
    categoriesInactive: cats.filter((c) => !c.is_active).length,
  };
}

export type AdminCategoryNode = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  parent_id: string | null;
  productCount: number;
  children: AdminCategoryNode[];
};

/** The FULL category tree (inactive included) with product counts. */
export async function adminCategoryTree(): Promise<AdminCategoryNode[]> {
  const db = client();
  if (!db) return [];
  const [cats, counts] = await Promise.all([
    db
      .from("store_categories")
      .select("id,slug,name,is_active,parent_id,sort_order")
      .order("sort_order", { ascending: true }),
    db.from("store_products").select("category_id"),
  ]);
  const catRows = (cats.data ?? []) as Array<
    Pick<StoreCategory, "id" | "slug" | "name" | "is_active" | "parent_id">
  >;
  const countMap = new Map<string, number>();
  for (const row of (counts.data ?? []) as Array<{ category_id: string }>) {
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  }
  const build = (parentId: string | null): AdminCategoryNode[] =>
    catRows
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        is_active: c.is_active,
        parent_id: c.parent_id,
        productCount: countMap.get(c.id) ?? 0,
        children: build(c.id),
      }));
  return build(null);
}

/* ───────────────────── write helpers (guards + 0097) ───────────────── */

export type StoreProductInput = {
  id?: string;
  category_id: string;
  asin: string | null;
  slug: string;
  title: string;
  summary: string;
  content: string;
  brand: string | null;
  image_url: string | null;
  image_alt?: string | null;
  editorial_rating: number | null;
  is_featured?: boolean;
  links?: Array<{ surface_type: string; surface_key: string }>;
};

export type StoreWriteResult =
  | { ok: true; id: string; findings: StoreGuardFinding[] }
  | { ok: false; error: string; findings?: StoreGuardFinding[] };

const SURFACE_TYPES = ["tool", "equipment_hub", "program", "blog", "collection"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Create/update a product (guards ALWAYS run — blocking findings refuse
 * the save; warnings pass). Products are ALWAYS born pending/unpublished
 * on create; publish is a separate owner action.
 */
export async function adminUpsertStoreProduct(
  input: StoreProductInput,
): Promise<StoreWriteResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  if (!input.category_id) return { ok: false, error: "category_id is required" };
  if (!SLUG_RE.test(input.slug ?? "")) {
    return { ok: false, error: "slug must be lowercase latin with hyphens" };
  }
  if (input.asin && !isValidAsin(input.asin)) {
    return { ok: false, error: "non-standard ASIN (B + 9 chars, or 10 digits)" };
  }
  if (input.editorial_rating !== null && input.editorial_rating !== undefined) {
    if (input.editorial_rating < 0 || input.editorial_rating > 9.9) {
      return { ok: false, error: "editorial_rating must be 0.0–9.9" };
    }
  }
  const findings = runStoreProductGuards({
    asin: input.asin,
    title: input.title,
    summary: input.summary,
    content: input.content,
    image_url: input.image_url,
    image_alt: input.image_alt ?? null,
    price_usd: null,
  });
  if (blocksPublish(findings)) {
    return {
      ok: false,
      error: "store guards rejected the save (blocking findings)",
      findings,
    };
  }
  const row = {
    category_id: input.category_id,
    asin: input.asin,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    content: input.content,
    brand: input.brand,
    image_url: input.image_url,
    editorial_rating: input.editorial_rating,
    is_featured: input.is_featured ?? false,
    updated_at: new Date().toISOString(),
  };
  let productId = input.id;
  if (productId) {
    const { error } = await db
      .from("store_products")
      .update(row)
      .eq("id", productId);
    if (error) return { ok: false, error: error.message, findings };
  } else {
    const { data, error } = await db
      .from("store_products")
      .insert({ ...row, review_status: "pending", is_published: false })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "insert failed", findings };
    productId = (data as { id: string }).id;
  }
  // Surface links: replace-all (small bounded set, idempotent outcome)
  if (input.links) {
    await db.from("store_product_links").delete().eq("product_id", productId);
    const valid = input.links.filter(
      (l) => SURFACE_TYPES.includes(l.surface_type) && l.surface_key,
    );
    if (valid.length > 0) {
      const { error } = await db.from("store_product_links").insert(
        valid.map((l) => ({
          product_id: productId,
          surface_type: l.surface_type,
          surface_key: l.surface_key,
        })),
      );
      if (error) return { ok: false, error: error.message, findings };
    }
  }
  return { ok: true, id: productId, findings };
}

export type StoreActionResult =
  | { ok: true; findings?: StoreGuardFinding[] }
  | { ok: false; error: string; findings?: StoreGuardFinding[] };

/** The OWNER review action (0097): pending → reviewed. */
export async function adminReviewStoreProduct(id: string): Promise<StoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("store_products")
    .update({
      review_status: "reviewed",
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("review_status", "pending");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * The publish action: REQUIRES review_status='reviewed' (the 0097 owner
 * gate — no bypass), re-runs every guard on the CURRENT row, then flips
 * is_published and flushes the store caches.
 */
export async function adminPublishStoreProduct(id: string): Promise<StoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const product = await adminGetStoreProduct(id);
  if (!product) return { ok: false, error: "product not found" };
  if (product.review_status !== "reviewed") {
    return {
      ok: false,
      error:
        "owner review required before publishing (0097 flow — review first, then publish)",
    };
  }
  const findings = runStoreProductGuards({
    asin: product.asin,
    title: product.title,
    summary: product.summary,
    content: product.content,
    image_url: product.image_url,
    price_usd: product.price_usd,
  });
  if (blocksPublish(findings)) {
    return { ok: false, error: "store guards rejected publishing", findings };
  }
  const { error } = await db
    .from("store_products")
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await flushStoreCaches([
    `/store/${product.category?.slug ?? ""}`,
    `/store/${product.category?.slug ?? ""}/${product.slug}`,
  ]);
  return { ok: true, findings };
}

/** Unpublish (hide — never delete; slug law). */
export async function adminUnpublishStoreProduct(id: string): Promise<StoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("store_products")
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await flushStoreCaches();
  return { ok: true };
}

/** Feature toggle (the /store featured rail). */
export async function adminSetFeatured(
  id: string,
  featured: boolean,
): Promise<StoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("store_products")
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await flushStoreCaches();
  return { ok: true };
}

/**
 * Category activation (wave 2/3 go-live — an OWNER decision recorded as
 * the admin action; every product still passes the 0097 review before
 * its own publish).
 */
export async function adminSetCategoryActive(
  id: string,
  active: boolean,
): Promise<StoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("store_categories")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await flushStoreCaches();
  return { ok: true };
}

/* ───────────── the click-events reader (analytics preview) ─────────── */

export type StoreClickDailyRow = { day: string; clicks: number };

/** Daily click totals for the last N days (the analytics Phase-2 preview). */
export async function adminClicksByDay(days = 14): Promise<StoreClickDailyRow[]> {
  const db = client();
  if (!db) return [];
  const { data } = await db
    .from("store_click_events")
    .select("day")
    .gte("day", new Date(Date.now() - days * 86400000).toISOString().slice(0, 10));
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ day: string }>) {
    counts.set(row.day, (counts.get(row.day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([day, clicks]) => ({ day, clicks }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}
