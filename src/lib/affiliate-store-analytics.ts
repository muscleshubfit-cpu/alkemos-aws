/**
 * STORE-ANALYTICS — the tracking + aggregation layer of the Alkemos
 * Affiliate Store automation system (Phase 529, owner order 2026-11-27:
 * «نظام التتبع والتحليلات»).
 *
 * WHAT IT MEASURES (the owner's list, complete):
 *   - impressions (the daily-aggregated beacon table, 0120)
 *   - clicks (the existing affiliate_store_click_events beacon, 0115)
 *   - per product: impressions, clicks, CTR (clicks/impressions)
 *   - per surface/page: which pages drive clicks (and impressions)
 *   - per category: aggregate performance
 *   - top products by clicks; top pages by clicks
 *   - zero-interaction products (impressions ≥ floor, clicks = 0)
 *
 * LAWS:
 *  - Zero PII everywhere (the beacon design: product/surface/day only).
 *  - Service-role reads (admin surfaces); the public learns nothing.
 *  - Fail-soft: any read error → empty results (dashboards degrade
 *    honestly, never a 500).
 *  - All windows are trailing N-day UTC windows (the day column).
 */

import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase/admin";

function client() {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  return supabaseAdmin;
}

function dayIso(offsetDays: number): string {
  return new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);
}

/* ───────────────────────── the aggregated report ───────────────────────── */

export type ProductPerformanceRow = {
  productId: string;
  slug: string;
  title: string;
  brand: string | null;
  categorySlug: string;
  categoryName: string;
  impressions: number;
  clicks: number;
  ctr: number | null; // clicks/impressions (null when impressions = 0)
};

export type SurfacePerformanceRow = {
  surface: string; // "surface_type:surface_key"
  surfaceType: string;
  surfaceKey: string;
  impressions: number;
  clicks: number;
  ctr: number | null;
};

export type CategoryPerformanceRow = {
  categorySlug: string;
  categoryName: string;
  impressions: number;
  clicks: number;
  ctr: number | null;
  productsWithClicks: number;
};

export type StoreAnalyticsReport = {
  windowDays: number;
  totals: { impressions: number; clicks: number; ctr: number | null };
  topProducts: ProductPerformanceRow[]; // by clicks desc
  topSurfaces: SurfacePerformanceRow[]; // by clicks desc
  categories: CategoryPerformanceRow[];
  zeroInteraction: ProductPerformanceRow[]; // impressions ≥ 20, clicks = 0
  productsTracked: number;
};

const EMPTY_REPORT = (windowDays: number): StoreAnalyticsReport => ({
  windowDays,
  totals: { impressions: 0, clicks: 0, ctr: null },
  topProducts: [],
  topSurfaces: [],
  categories: [],
  zeroInteraction: [],
  productsTracked: 0,
});

/** The impressions aggregation floor for "zero-interaction" (documented). */
export const ZERO_INTERACTION_IMPRESSION_FLOOR = 20;

export async function buildStoreAnalyticsReport(windowDays = 30): Promise<StoreAnalyticsReport> {
  const db = client();
  if (!db) return EMPTY_REPORT(windowDays);
  const since = dayIso(windowDays);

  const [imprRes, clickRes, prodRes, catRes] = await Promise.all([
    db
      .from("affiliate_store_impression_events")
      .select("product_id,surface_type,surface_key,impressions")
      .gte("day", since)
      .limit(50000),
    db
      .from("affiliate_store_click_events")
      .select("product_id,surface_type,surface_key")
      .gte("day", since)
      .limit(50000),
    db
      .from("affiliate_store_products")
      .select("id,slug,title,brand,category_id,is_published")
      .limit(500),
    db.from("affiliate_store_categories").select("id,slug,name"),
  ]);

  const catById = new Map(
    ((catRes.data ?? []) as Array<{ id: string; slug: string; name: string }>).map((c) => [c.id, c]),
  );
  const productById = new Map(
    ((prodRes.data ?? []) as Array<{
      id: string; slug: string; title: string; brand: string | null; category_id: string;
    }>).map((p) => [p.id, p]),
  );

  // impressions per product + per surface
  const impressionsByProduct = new Map<string, number>();
  const impressionsBySurface = new Map<string, { type: string; key: string; count: number }>();
  let totalImpressions = 0;
  for (const row of (imprRes.data ?? []) as Array<{
    product_id: string; surface_type: string; surface_key: string; impressions: number;
  }>) {
    totalImpressions += row.impressions ?? 0;
    impressionsByProduct.set(row.product_id, (impressionsByProduct.get(row.product_id) ?? 0) + (row.impressions ?? 0));
    const key = `${row.surface_type}:${row.surface_key ?? ""}`;
    const entry = impressionsBySurface.get(key) ?? { type: row.surface_type, key: row.surface_key ?? "", count: 0 };
    entry.count += row.impressions ?? 0;
    impressionsBySurface.set(key, entry);
  }

  // clicks per product + per surface
  const clicksByProduct = new Map<string, number>();
  const clicksBySurface = new Map<string, number>();
  let totalClicks = 0;
  for (const row of (clickRes.data ?? []) as Array<{
    product_id: string; surface_type: string; surface_key: string;
  }>) {
    totalClicks += 1;
    clicksByProduct.set(row.product_id, (clicksByProduct.get(row.product_id) ?? 0) + 1);
    const key = `${row.surface_type}:${row.surface_key ?? ""}`;
    clicksBySurface.set(key, (clicksBySurface.get(key) ?? 0) + 1);
  }

  // product rows (published products that have ANY signal in-window)
  const productRows: ProductPerformanceRow[] = [];
  for (const [productId, impressions] of impressionsByProduct) {
    const product = productById.get(productId);
    if (!product) continue;
    const cat = catById.get(product.category_id);
    const clicks = clicksByProduct.get(productId) ?? 0;
    productRows.push({
      productId,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      categorySlug: cat?.slug ?? "",
      categoryName: cat?.name ?? "",
      impressions,
      clicks,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : null,
    });
  }
  // products with clicks but no impressions recorded still count
  for (const [productId, clicks] of clicksByProduct) {
    if (impressionsByProduct.has(productId)) continue;
    const product = productById.get(productId);
    if (!product) continue;
    const cat = catById.get(product.category_id);
    productRows.push({
      productId,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      categorySlug: cat?.slug ?? "",
      categoryName: cat?.name ?? "",
      impressions: 0,
      clicks,
      ctr: null,
    });
  }

  // surfaces
  const surfaceRows: SurfacePerformanceRow[] = [];
  const surfaceKeys = new Set([...impressionsBySurface.keys(), ...clicksBySurface.keys()]);
  for (const key of surfaceKeys) {
    const impr = impressionsBySurface.get(key);
    const clicks = clicksBySurface.get(key) ?? 0;
    const impressions = impr?.count ?? 0;
    surfaceRows.push({
      surface: key,
      surfaceType: impr?.type ?? key.split(":")[0],
      surfaceKey: impr?.key ?? key.split(":").slice(1).join(":"),
      impressions,
      clicks,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : null,
    });
  }

  // categories
  const catMap = new Map<string, CategoryPerformanceRow>();
  for (const row of productRows) {
    if (!row.categorySlug) continue;
    const entry =
      catMap.get(row.categorySlug) ??
      {
        categorySlug: row.categorySlug,
        categoryName: row.categoryName,
        impressions: 0,
        clicks: 0,
        ctr: null,
        productsWithClicks: 0,
      };
    entry.impressions += row.impressions;
    entry.clicks += row.clicks;
    if (row.clicks > 0) entry.productsWithClicks += 1;
    catMap.set(row.categorySlug, entry);
  }
  for (const entry of catMap.values()) {
    entry.ctr = entry.impressions > 0 ? Math.round((entry.clicks / entry.impressions) * 1000) / 10 : null;
  }

  productRows.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  surfaceRows.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

  return {
    windowDays,
    totals: {
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : null,
    },
    topProducts: productRows.slice(0, 15),
    topSurfaces: surfaceRows.slice(0, 15),
    categories: [...catMap.values()].sort((a, b) => b.clicks - a.clicks),
    zeroInteraction: productRows
      .filter((r) => r.impressions >= ZERO_INTERACTION_IMPRESSION_FLOOR && r.clicks === 0)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15),
    productsTracked: productRows.length,
  };
}

/* ───────────────────────── the admin daily strip ───────────────────────── */

export type AnalyticsDailyRow = { day: string; impressions: number; clicks: number };

/** Daily totals for the sparkline (impressions + clicks, last N days). */
export async function analyticsDailyTotals(days = 14): Promise<AnalyticsDailyRow[]> {
  const db = client();
  if (!db) return [];
  const since = dayIso(days);
  const [imprRes, clickRes] = await Promise.all([
    db.from("affiliate_store_impression_events").select("day,impressions").gte("day", since).limit(20000),
    db.from("affiliate_store_click_events").select("day").gte("day", since).limit(20000),
  ]);
  const map = new Map<string, AnalyticsDailyRow>();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayIso(i);
    map.set(day, { day, impressions: 0, clicks: 0 });
  }
  for (const row of (imprRes.data ?? []) as Array<{ day: string; impressions: number }>) {
    const entry = map.get(row.day);
    if (entry) entry.impressions += row.impressions ?? 0;
  }
  for (const row of (clickRes.data ?? []) as Array<{ day: string }>) {
    const entry = map.get(row.day);
    if (entry) entry.clicks += 1;
  }
  return [...map.values()];
}
