import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * STORE-ANALYTICS CANARIES (Phase 529) — the aggregation math over
 * mocked impression/click rows: totals, CTR, per-product / per-surface
 * / per-category grouping, and the zero-interaction list.
 */

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: { from: (table: unknown) => mockFrom(table) },
}));

import { buildStoreAnalyticsReport, ZERO_INTERACTION_IMPRESSION_FLOOR } from "../affiliate-store-analytics";

/** A thenable chainable query builder: awaiting it (with or without a
 *  terminal call) resolves { data, error } — matches every call shape
 *  the analytics layer uses (select+gte+limit OR bare select). */
function chain(data: unknown) {
  const result = { data, error: null };
  const c: Record<string, unknown> = {};
  const self = () => c;
  c.select = vi.fn(self);
  c.gte = vi.fn(self);
  c.eq = vi.fn(self);
  c.order = vi.fn(self);
  c.limit = vi.fn(self);
  c.then = (resolve: (v: unknown) => unknown, reject: (v: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  // limit() resolves the result directly (awaited terminal call)
  const limitFn = c.limit as ReturnType<typeof vi.fn>;
  limitFn.mockImplementation(() => Promise.resolve(result));
  return c as unknown as Record<string, ReturnType<typeof vi.fn>>;
}

beforeEach(() => {
  mockFrom.mockReset();
});

describe("buildStoreAnalyticsReport", () => {
  it("aggregates impressions, clicks, CTR, categories, and zero-interaction", async () => {
    const today = new Date().toISOString().slice(0, 10);
    mockFrom.mockImplementation((table: string) => {
      if (table === "affiliate_store_impression_events") {
        return chain([
          { product_id: "p1", surface_type: "store", surface_key: "", impressions: 40 },
          { product_id: "p1", surface_type: "blog", surface_key: "best-dumbbells", impressions: 10 },
          { product_id: "p2", surface_type: "store", surface_key: "", impressions: 30 },
        ]);
      }
      if (table === "affiliate_store_click_events") {
        return chain([
          { product_id: "p1", surface_type: "store", surface_key: "", day: today },
          { product_id: "p1", surface_type: "store", surface_key: "", day: today },
          { product_id: "p1", surface_type: "blog", surface_key: "best-dumbbells", day: today },
        ]);
      }
      if (table === "affiliate_store_products") {
        return chain([
          { id: "p1", slug: "prod-1", title: "Dumbbell X", brand: "A", category_id: "c1" },
          { id: "p2", slug: "prod-2", title: "Foam Roller Y", brand: "B", category_id: "c2" },
        ]);
      }
      if (table === "affiliate_store_categories") {
        return chain([
          { id: "c1", slug: "adjustable-fixed-dumbbells", name: "Dumbbells" },
          { id: "c2", slug: "foam-rollers", name: "Foam Rollers" },
        ]);
      }
      return chain([]);
    });

    const report = await buildStoreAnalyticsReport(30);

    // totals: 80 impressions, 3 clicks → CTR 3.8%
    expect(report.totals.impressions).toBe(80);
    expect(report.totals.clicks).toBe(3);
    expect(report.totals.ctr).toBe(3.8);

    // top product = p1 (3 clicks, 50 impressions)
    expect(report.topProducts[0].productId).toBe("p1");
    expect(report.topProducts[0].clicks).toBe(3);
    expect(report.topProducts[0].impressions).toBe(50);
    expect(report.topProducts[0].ctr).toBe(6);

    // top surface = store: (2 clicks / 70 impr)
    expect(report.topSurfaces[0].surface).toBe("store:");
    expect(report.topSurfaces[0].clicks).toBe(2);

    // categories
    const dumbbells = report.categories.find((c) => c.categorySlug === "adjustable-fixed-dumbbells");
    expect(dumbbells?.clicks).toBe(3);
    expect(dumbbells?.productsWithClicks).toBe(1);

    // zero-interaction: p2 (30 impressions ≥ floor, 0 clicks)
    expect(report.zeroInteraction).toHaveLength(1);
    expect(report.zeroInteraction[0].productId).toBe("p2");
    expect(report.productsTracked).toBe(2);
  });

  it("keeps products with clicks but no impressions visible", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "affiliate_store_impression_events") return chain([]);
      if (table === "affiliate_store_click_events") {
        return chain([{ product_id: "p9", surface_type: "product", surface_key: "x" }]);
      }
      if (table === "affiliate_store_products") {
        return chain([{ id: "p9", slug: "s", title: "T", brand: null, category_id: "c1" }]);
      }
      if (table === "affiliate_store_categories") {
        return chain([{ id: "c1", slug: "cat", name: "Cat" }]);
      }
      return chain([]);
    });
    const report = await buildStoreAnalyticsReport(7);
    expect(report.totals.clicks).toBe(1);
    expect(report.topProducts[0].productId).toBe("p9");
    expect(report.topProducts[0].impressions).toBe(0);
    expect(report.topProducts[0].ctr).toBeNull();
  });

  it("documents the zero-interaction floor", () => {
    expect(ZERO_INTERACTION_IMPRESSION_FLOOR).toBe(20);
  });
});
