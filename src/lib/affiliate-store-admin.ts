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
 *  - 527-L2 — AUTO-PUBLISH (owner order 2026-11-27 «إلغاء نظام الاعتماد
 *    المزدوج... اجعل جميع المنتجات تُنشر تلقائيًا بمجرد إضافتها وحفظها
 *    بنجاح، دون أي خطوة اعتماد أو مراجعة أو ضغط زر Publish»): the
 *    retired 0097 dual-approval (pending → owner review → publish) is
 *    GONE. A create saves → is_published=true immediately; an update of
 *    a published product stays live (edits reflect automatically);
 *    Unpublish stays a one-click hide; republish re-runs the guards.
 *    The guards (527-G1/G2: image + ASIN + all content laws) are the
 *    ONLY gate — automated validation, no manual approval step.
 *  - Save/publish/unpublish/category-activation flush the cache layers
 *    for the store surfaces (revalidateTag + revalidatePath + the CF
 *    edge purge — the blog-cache-revalidate pattern, minimal + safe).
 *  - Nothing here touches System 1 (the affiliate_ / referral_ table family) — §0.
 */

import { revalidatePath, revalidateTag } from "next/cache";
import type {
  Database,
  AffiliateStoreCategory,
  AffiliateStoreProduct,
} from "./supabase/types";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase/admin";
import { purgeCloudflareEdgeUrls } from "./edge-purge";
import {
  blocksPublish,
  runAffiliateStoreProductGuards,
  type AffiliateStoreGuardFinding,
} from "./affiliate-store-guards";
import { isValidAsin } from "./affiliate-store-link";

export const AFFILIATE_STORE_CACHE_TAGS = [
  "affiliate-store-tree",
  "affiliate-store-featured",
  "affiliate-store-slugs",
  "affiliate-store-products",
] as const;

function client() {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  return supabaseAdmin;
}

/* ───────────────────── the cache flush (3 layers) ───────────────────── */

export function affiliateStorePublicPaths(): string[] {
  return [
    "/affiliate-store",
    "/sitemap-affiliate-store.xml",
    "/sitemap.xml",
    "/affiliate-disclosure",
  ];
}

/**
 * Flush the store surfaces after any admin write: data-cache tags,
 * ISR paths, and (when configured) the Cloudflare edge HTML cache —
 * the 2026-10-21 three-layer lesson applied from day one.
 */
export async function flushAffiliateStoreCaches(extraPaths: string[] = []): Promise<void> {
  for (const tag of AFFILIATE_STORE_CACHE_TAGS) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // revalidateTag throws outside a request scope (e.g. tests) —
      // the hourly ISR window still converges.
    }
  }
  const paths = [...affiliateStorePublicPaths(), ...extraPaths];
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

export type AdminAffiliateStoreProductRow = AffiliateStoreProduct & {
  category: Pick<AffiliateStoreCategory, "id" | "slug" | "name" | "is_active"> | null;
};

export async function adminListAffiliateStoreProducts(
  limit = 200,
): Promise<AdminAffiliateStoreProductRow[]> {
  const db = client();
  if (!db) return [];
  // 527-L1: NO EMBEDS in production-facing reads (the measured
  // production failure) — direct reads stitched in code.
  const [prodRes, catRes] = await Promise.all([
    db.from("affiliate_store_products")
      .select("id,category_id,slug,title,summary,brand,asin,image_url,editorial_rating,price_usd,is_featured,is_published,review_status,content,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    db.from("affiliate_store_categories").select("id,slug,name,is_active"),
  ]);
  const cats = new Map((catRes.data ?? []).map((c: { id: string }) => [c.id, c]));
  return ((prodRes.data ?? []) as Array<Record<string, unknown> & { category_id: string }>).map((row) => ({
    ...row,
    category: cats.get(row.category_id) ?? null,
  })) as unknown as AdminAffiliateStoreProductRow[];
}

export async function adminGetAffiliateStoreProduct(
  id: string,
): Promise<AdminAffiliateStoreProductRow | null> {
  const db = client();
  if (!db) return null;
  const [prodRes, catRes] = await Promise.all([
    db.from("affiliate_store_products").select("*").eq("id", id).maybeSingle(),
    db.from("affiliate_store_categories").select("id,slug,name,is_active"),
  ]);
  if (!prodRes.data) return null;
  const row = prodRes.data as Record<string, unknown> & { category_id: string };
  const cats = (catRes.data ?? []) as Array<{ id: string; slug: string; name: string; is_active: boolean }>;
  return {
    ...row,
    category: cats.find((c) => c.id === row.category_id) ?? null,
  } as unknown as AdminAffiliateStoreProductRow;
}

export async function adminListAffiliateStoreProductLinks(productId: string): Promise<
  Array<{ surface_type: string; surface_key: string; sort_order: number }>
> {
  const db = client();
  if (!db) return [];
  const { data } = await db
    .from("affiliate_store_product_links")
    .select("surface_type,surface_key,sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  return ((data ?? []) as Array<{
    surface_type: string;
    surface_key: string;
    sort_order: number;
  }>);
}

export type AdminAffiliateStoreStats = {
  total: number;
  published: number;
  pending: number;
  reviewed: number;
  featured: number;
  withoutAsin: number;
  categoriesActive: number;
  categoriesInactive: number;
};

export async function adminAffiliateStoreStats(): Promise<AdminAffiliateStoreStats> {
  const db = client();
  const empty: AdminAffiliateStoreStats = {
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
    db.from("affiliate_store_products").select("is_published,review_status,is_featured,asin"),
    db.from("affiliate_store_categories").select("is_active"),
  ]);
  const rows = (products.data ?? []) as Array<
    Pick<AffiliateStoreProduct, "is_published" | "review_status" | "is_featured" | "asin">
  >;
  const cats = (categories.data ?? []) as Array<Pick<AffiliateStoreCategory, "is_active">>;
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

export type AdminAffiliateStoreCategoryNode = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  parent_id: string | null;
  /** The carved-icon key (VISIBILITY-PREVIEW 2026-11-26 — the editor's
   *  live preview renders the leaf's carved icon as the image fallback). */
  icon_key: string | null;
  productCount: number;
  children: AdminAffiliateStoreCategoryNode[];
};

/** The FULL category tree (inactive included) with product counts. */
export async function adminAffiliateStoreCategoryTree(): Promise<AdminAffiliateStoreCategoryNode[]> {
  const db = client();
  if (!db) return [];
  const [cats, counts] = await Promise.all([
    db
      .from("affiliate_store_categories")
      .select("id,slug,name,is_active,parent_id,icon_key,sort_order")
      .order("sort_order", { ascending: true }),
    db.from("affiliate_store_products").select("category_id"),
  ]);
  const catRows = (cats.data ?? []) as Array<
    Pick<AffiliateStoreCategory, "id" | "slug" | "name" | "is_active" | "parent_id" | "icon_key">
  >;
  const countMap = new Map<string, number>();
  for (const row of (counts.data ?? []) as Array<{ category_id: string }>) {
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  }
  const build = (parentId: string | null): AdminAffiliateStoreCategoryNode[] =>
    catRows
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        is_active: c.is_active,
        parent_id: c.parent_id,
        icon_key: c.icon_key,
        productCount: countMap.get(c.id) ?? 0,
        children: build(c.id),
      }));
  return build(null);
}

/* ───────────────────── write helpers (guards + 0097) ───────────────── */

export type AffiliateStoreProductInput = {
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

export type AffiliateStoreWriteResult =
  | { ok: true; id: string; findings: AffiliateStoreGuardFinding[] }
  | { ok: false; error: string; findings?: AffiliateStoreGuardFinding[] };

const SURFACE_TYPES = ["tool", "equipment_hub", "program", "blog", "collection"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Create/update a product — 527-L2 AUTO-PUBLISH: guards ALWAYS run
 * (blocking findings refuse the save — the automated validation gate:
 * basics + image + buy path); a CREATE is born published (visible on
 * every store surface immediately); an UPDATE of a published product
 * stays published (edits reflect automatically — «وأي تعديل وحفظ لمنتج
 * منشور ينعكس تلقائيًا»). review_status is written 'reviewed' purely
 * as a historical record (the 0097 dual-approval flow is retired).
 */
export async function adminUpsertAffiliateStoreProduct(
  input: AffiliateStoreProductInput,
): Promise<AffiliateStoreWriteResult> {
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
  const findings = runAffiliateStoreProductGuards({
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
      error: "store guards rejected the save (blocking findings — a product needs its real image, its Amazon ASIN, and clean content before it can publish)",
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
    review_status: "reviewed",
    updated_at: new Date().toISOString(),
  };
  let productId = input.id;
  if (productId) {
    const { error } = await db
      .from("affiliate_store_products")
      .update(row)
      .eq("id", productId);
    if (error) return { ok: false, error: error.message, findings };
  } else {
    // 527-L2: born PUBLISHED — no review step, no Publish button.
    const { data, error } = await db
      .from("affiliate_store_products")
      .insert({ ...row, is_published: true })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "insert failed", findings };
    productId = (data as { id: string }).id;
  }
  // Surface links: replace-all (small bounded set, idempotent outcome)
  if (input.links) {
    await db.from("affiliate_store_product_links").delete().eq("product_id", productId);
    const valid = input.links.filter(
      (l) => SURFACE_TYPES.includes(l.surface_type) && l.surface_key,
    );
    if (valid.length > 0) {
      const { error } = await db.from("affiliate_store_product_links").insert(
        valid.map((l) => ({
          product_id: productId,
          surface_type: l.surface_type,
          surface_key: l.surface_key,
        })),
      );
      if (error) return { ok: false, error: error.message, findings };
    }
  }
  // 527-L2: save = publish → the public surfaces refresh now.
  const saved = await adminGetAffiliateStoreProduct(productId);
  const catSlug = saved?.category?.slug ?? "";
  await flushAffiliateStoreCaches([
    `/affiliate-store/${catSlug}`,
    `/affiliate-store/${catSlug}/${input.slug}`,
  ]);
  return { ok: true, id: productId, findings };
}

export type AffiliateStoreActionResult =
  | { ok: true; findings?: AffiliateStoreGuardFinding[] }
  | { ok: false; error: string; findings?: AffiliateStoreGuardFinding[] };

/**
 * The publish action (republish path — 527-L2): re-runs every guard on
 * the CURRENT row (the automated gate — no owner-review requirement
 * anymore; the review flow is retired), then flips is_published and
 * flushes the store caches.
 */
export async function adminPublishAffiliateStoreProduct(id: string): Promise<AffiliateStoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const product = await adminGetAffiliateStoreProduct(id);
  if (!product) return { ok: false, error: "product not found" };
  const findings = runAffiliateStoreProductGuards({
    asin: product.asin,
    title: product.title,
    summary: product.summary,
    content: product.content,
    image_url: product.image_url,
    price_usd: product.price_usd,
  });
  if (blocksPublish(findings)) {
    return { ok: false, error: "store guards rejected publishing (image + ASIN + content laws — 527-G2)", findings };
  }
  const { error } = await db
    .from("affiliate_store_products")
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await flushAffiliateStoreCaches([
    `/affiliate-store/${product.category?.slug ?? ""}`,
    `/affiliate-store/${product.category?.slug ?? ""}/${product.slug}`,
  ]);
  return { ok: true, findings };
}

/** Unpublish (hide — never delete; slug law). */
export async function adminUnpublishAffiliateStoreProduct(id: string): Promise<AffiliateStoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("affiliate_store_products")
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await flushAffiliateStoreCaches();
  return { ok: true };
}

/** Feature toggle (the /store featured rail). */
export async function adminSetAffiliateStoreFeatured(
  id: string,
  featured: boolean,
): Promise<AffiliateStoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("affiliate_store_products")
    .update({ is_featured: featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await flushAffiliateStoreCaches();
  return { ok: true };
}

/**
 * Category activation (wave 2/3 go-live — an OWNER decision recorded as
 * the admin action; every product still passes the 0097 review before
 * its own publish).
 */
export async function adminSetAffiliateStoreCategoryActive(
  id: string,
  active: boolean,
): Promise<AffiliateStoreActionResult> {
  const db = client();
  if (!db) return { ok: false, error: "Supabase not configured" };
  const { error } = await db
    .from("affiliate_store_categories")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await flushAffiliateStoreCaches();
  return { ok: true };
}

/* ───────────── the click-events reader (analytics preview) ─────────── */

export type AffiliateStoreClickDailyRow = { day: string; clicks: number };

/** Daily click totals for the last N days (the analytics Phase-2 preview). */
export async function adminAffiliateStoreClicksByDay(days = 14): Promise<AffiliateStoreClickDailyRow[]> {
  const db = client();
  if (!db) return [];
  const { data } = await db
    .from("affiliate_store_click_events")
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
