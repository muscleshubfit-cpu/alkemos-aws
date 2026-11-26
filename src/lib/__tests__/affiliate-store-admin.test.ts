import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * STORE-ADMIN 527 CANARIES (owner order 2026-11-27 «إلغاء نظام الاعتماد
 * المزدوج»): the dual-approval flow (pending → owner review → publish)
 * is RETIRED. The publish action re-runs every store guard on the
 * current row — the guards are the ONLY gate (automated validation:
 * basics + real image + ASIN; no manual approval step anywhere).
 *
 * 527-L1 note: the data layer reads products and categories with
 * SEPARATE direct queries (no embeds) — the mock serves both tables.
 */

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: { from: (table: unknown) => mockFrom(table) },
}));

vi.mock("@/lib/edge-purge", () => ({
  purgeCloudflareEdgeUrls: vi.fn(async () => ({ attempted: false, ok: false, urls: [] })),
}));

import { adminPublishAffiliateStoreProduct } from "../affiliate-store-admin";

function chainReturning(selectResult: unknown) {
  // shape: from(table).select(cols).eq().maybeSingle() OR the awaited
  // bare select (categories) OR from(table).update(row).eq(col, val)
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: selectResult, error: null }),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: selectResult, error: null }),
    then: undefined,
  };
}

/** Products by id (first from() on the products table per call). */
const productStore = new Map<string, Record<string, unknown>>();

function primeProduct(row: Record<string, unknown>) {
  productStore.set(row.id as string, row);
}

function installMock() {
  mockFrom.mockImplementation((table: unknown) => {
    if (table === "affiliate_store_categories") {
      return chainReturning([]);
    }
    if (table === "affiliate_store_products") {
      const chain = chainReturning(null);
      // select("*").eq("id", id).maybeSingle() → the primed row
      chain.eq.mockImplementation((_col: string, val: string) => {
        chain.maybeSingle.mockResolvedValue({ data: productStore.get(val) ?? null, error: null });
        return chain;
      });
      return chain;
    }
    return chainReturning(null);
  });
}

function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    category_id: "22222222-2222-4222-8222-222222222222",
    asin: "B0C1234567",
    slug: "cast-iron-kettlebell-16kg",
    title: "Cast-Iron Kettlebell 16 kg",
    summary: "Powder-coated cast iron for swings and carries.",
    content:
      "A fixed-weight kettlebell is the most cost-effective strength tool for a home setup. " +
      "This 16 kg bell covers goblet squats, swings, cleans, and loaded carries, and its powder " +
      "coat keeps the handle dry through long sessions. Trained three times a week it delivers " +
      "most of the posterior-chain volume a full barbell block would program, in a fraction of " +
      "the floor space and budget.",
    brand: null,
    image_url: "https://m.media-amazon.com/images/I/71dMltueu8L._AC_SL1500_.jpg",
    editorial_rating: 8.5,
    price_usd: null,
    is_featured: false,
    is_published: false,
    review_status: "reviewed",
    updated_at: "2026-11-26T00:00:00Z",
    category: { id: "22222222-2222-4222-8222-222222222222", slug: "kettlebells", name: "Kettlebells", is_active: true },
    ...overrides,
  };
}

describe("adminPublishAffiliateStoreProduct — the 527 automated gate (auto-publish law)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productStore.clear();
    installMock();
  });

  it("publishes a clean product with NO review_status requirement (0097 retired)", async () => {
    // 527: even a 'pending' review_status publishes — the dual-approval
    // flow is retired; the guards are the only gate.
    primeProduct(productRow({ review_status: "pending" }));
    const res = await adminPublishAffiliateStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(true);
  });

  it("REFUSES to publish a product that fails a store guard (halal hit)", async () => {
    primeProduct(productRow({ summary: "perfect after a glass of wine" }));
    const res = await adminPublishAffiliateStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/guards rejected/i);
    }
  });

  it("REFUSES to publish with a manual price (pre-API law)", async () => {
    primeProduct(productRow({ price_usd: 29.99 }));
    const res = await adminPublishAffiliateStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
  });

  it("REFUSES to publish a product with a women-model image (law v2 §0.1)", async () => {
    primeProduct(productRow({ image_url: "https://alkemos.com/affiliate-store-products/woman-model.webp" }));
    const res = await adminPublishAffiliateStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
  });

  it("REFUSES to publish without a real image (527-G2 shelf gate)", async () => {
    primeProduct(productRow({ image_url: null }));
    const res = await adminPublishAffiliateStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/guards rejected/i);
    }
  });

  it("REFUSES to publish without a valid ASIN (527-G2 shelf gate)", async () => {
    primeProduct(productRow({ asin: null }));
    const res = await adminPublishAffiliateStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
  });

  it("publishes with the TRUSTED Amazon product-image CDN (527-G1)", async () => {
    primeProduct(productRow({ image_url: "https://m.media-amazon.com/images/I/71dMltueu8L._AC_SL1500_.jpg" }));
    const res = await adminPublishAffiliateStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(true);
  });
});
