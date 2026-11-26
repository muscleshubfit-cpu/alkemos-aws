import { NextRequest, NextResponse } from "next/server";
import {
  AFFILIATE_STORE_SURFACE_TYPES,
  listAffiliateStoreProductsForSurface,
  type AffiliateStoreSurfaceType,
} from "@/lib/affiliate-store-server";

/**
 * AFFILIATE-STORE SUGGEST — the light public suggestion endpoint behind
 * the client-side store entrances (VISIBILITY-PREVIEW 2026-11-26 — the
 * /api/recipes/suggest pattern, store-shaped):
 *
 *   GET /api/affiliate-store/suggest?surface=tool&key=macro-calculator&limit=3
 *     → { products: [...] }
 *
 * LAWS:
 *  - PUBLIC read through the SAME anon client the store pages use
 *    (RLS: PUBLISHED products only — pending products never leak here).
 *  - Fail-soft: any error → { products: [] } (the strip honestly never
 *    renders; never a 500 for a suggestion).
 *  - Surface-type whitelist + key length cap; limit capped at 6.
 *  - The payload carries ONLY the public card fields — no prices
 *    (§3.4-6), no ASINs, no commission data (the ninth guard); the
 *    purchase unit exists only on the product page.
 */
export const dynamic = "force-dynamic";

const MAX_LIMIT = 6;

export async function GET(request: NextRequest) {
  const surface = request.nextUrl.searchParams.get("surface") ?? "";
  const key = (request.nextUrl.searchParams.get("key") ?? "").slice(0, 120);
  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 3) || 3, 1),
    MAX_LIMIT,
  );
  if (!(AFFILIATE_STORE_SURFACE_TYPES as readonly string[]).includes(surface) || !key) {
    return NextResponse.json({ products: [] });
  }
  const products = await listAffiliateStoreProductsForSurface(
    surface as AffiliateStoreSurfaceType,
    key,
    limit,
  );
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      brand: p.brand,
      imageUrl: p.imageUrl,
      categorySlug: p.categorySlug,
      categoryName: p.categoryName,
      categoryIconKey: p.categoryIconKey,
    })),
  });
}
