import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * STORE-ADMIN 0097 CANARIES (ALKEMOS-STORE-PHASE1 §1.2 — owner order
 * 2026-11-26: «لا تتجاوز مراجعة المالك المطلوبة قبل نشر المنتجات»):
 * the publish action REQUIRES review_status='reviewed' and re-runs every
 * store guard on the current row; nothing bypasses the owner review.
 */

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: { from: (table: unknown) => mockFrom(table) },
}));

vi.mock("@/lib/edge-purge", () => ({
  purgeCloudflareEdgeUrls: vi.fn(async () => ({ attempted: false, ok: false, urls: [] })),
}));

import {
  adminPublishStoreProduct,
  adminReviewStoreProduct,
} from "../store-admin";

function chainReturning(selectResult: unknown) {
  // shape: from(table).update(row).eq(col, val) OR
  // from(table).select(cols).eq().maybeSingle()
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
    image_url: null,
    editorial_rating: 8.5,
    price_usd: null,
    is_featured: false,
    is_published: false,
    review_status: "pending",
    updated_at: "2026-11-26T00:00:00Z",
    category: { id: "22222222-2222-4222-8222-222222222222", slug: "kettlebells", name: "Kettlebells", is_active: true },
    ...overrides,
  };
}

describe("adminPublishStoreProduct — the 0097 owner gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REFUSES to publish a pending-review product (no owner-review bypass)", async () => {
    const chain = chainReturning(productRow({ review_status: "pending" }));
    mockFrom.mockReturnValueOnce(chain);
    const res = await adminPublishStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/owner review required/i);
    }
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("publishes a reviewed + clean product (update called once)", async () => {
    const chain = chainReturning(productRow({ review_status: "reviewed" }));
    // the second from() call is the UPDATE chain
    const updateChain = chainReturning(null);
    mockFrom.mockReturnValueOnce(chain).mockReturnValueOnce(updateChain);
    const res = await adminPublishStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(true);
    expect(mockFrom).toHaveBeenCalled();
  });

  it("REFUSES to publish a reviewed product that fails a store guard (halal hit)", async () => {
    const chain = chainReturning(
      productRow({
        review_status: "reviewed",
        summary: "perfect after a glass of wine",
      }),
    );
    mockFrom.mockReturnValueOnce(chain);
    const res = await adminPublishStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/guards rejected/i);
    }
  });

  it("REFUSES to publish with a manual price (pre-API law)", async () => {
    const chain = chainReturning(
      productRow({ review_status: "reviewed", price_usd: 29.99 }),
    );
    mockFrom.mockReturnValueOnce(chain);
    const res = await adminPublishStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
  });

  it("REFUSES to publish a product with a women-model image (law v2 §0.1)", async () => {
    const chain = chainReturning(
      productRow({ review_status: "reviewed", image_url: "https://alkemos.com/store-products/woman-model.webp" }),
    );
    mockFrom.mockReturnValueOnce(chain);
    const res = await adminPublishStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(false);
  });
});

describe("adminReviewStoreProduct — the review stamp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("flips pending → reviewed with the review stamp (the owner action)", async () => {
    const chain = chainReturning(null);
    mockFrom.mockReturnValueOnce(chain);
    const res = await adminReviewStoreProduct("11111111-1111-4111-8111-111111111111");
    expect(res.ok).toBe(true);
    const updateArg = chain.update.mock.calls[0][0] as Record<string, string>;
    expect(updateArg.review_status).toBe("reviewed");
    expect(updateArg.last_reviewed_at).toBeTruthy();
  });
});
