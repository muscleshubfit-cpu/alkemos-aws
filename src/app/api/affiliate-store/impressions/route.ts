import { NextRequest, NextResponse } from "next/server";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase/admin";

/**
 * STORE IMPRESSION BEACON (Phase 529 — the clicks twin, aggregated):
 *
 *   POST /api/affiliate-store/impressions
 *     { productIds: string[], surfaceType, surfaceKey }
 *
 * The NON-INTERCEPTING impression record: a batched fire-and-forget
 * payload from the client island (IntersectionObserver — only products
 * actually SEEN are counted), aggregated into ONE daily counter row per
 * (product × surface × day) through the SECURITY DEFINER increment RPC
 * (migration 0120). Zero PII (product/surface/day only — the clicks
 * law). Rate-limited per instance; validates every product id shape;
 * the RPC drops malformed batches silently (a beacon never errors).
 *
 * The published-product check rides the RPC caller: only ids the
 * catalog knows can aggregate (unknown ids still write nothing visible
 * — they reference no row and the admin views join the products table).
 */

export const maxDuration = 10;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SURFACE_TYPES = new Set([
  "tool",
  "equipment_hub",
  "program",
  "blog",
  "collection",
  "store",
  "category",
  "product",
]);

/** Per-instance token bucket: 60 batches/min, burst 20 (beacon-grade). */
const RATE = { tokens: 20, refillPerSec: 1, max: 60 };
let bucket = { tokens: RATE.tokens, last: Date.now() };

function rateLimited(): boolean {
  const now = Date.now();
  bucket.tokens = Math.min(
    RATE.max,
    bucket.tokens + ((now - bucket.last) / 1000) * RATE.refillPerSec,
  );
  bucket.last = now;
  if (bucket.tokens < 1) return true;
  bucket.tokens -= 1;
  return false;
}

export async function POST(request: NextRequest) {
  if (rateLimited()) {
    return new NextResponse(null, { status: 204 });
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return new NextResponse(null, { status: 204 });
  }
  const body = (await request.json().catch(() => null)) as
    | { productIds?: string[]; surfaceType?: string; surfaceKey?: string }
    | null;
  const productIds = Array.isArray(body?.productIds) ? body!.productIds! : [];
  const surfaceType = body?.surfaceType ?? "";
  const surfaceKey = (body?.surfaceKey ?? "").slice(0, 120);
  if (
    productIds.length === 0 ||
    productIds.length > 24 ||
    !SURFACE_TYPES.has(surfaceType) ||
    !productIds.every((id) => typeof id === "string" && UUID_RE.test(id))
  ) {
    return new NextResponse(null, { status: 204 });
  }
  try {
    const day = new Date().toISOString().slice(0, 10);
    for (const productId of productIds) {
      await supabaseAdmin.rpc("affiliate_store_track_impressions", {
        p_product_id: productId,
        p_surface_type: surfaceType,
        p_surface_key: surfaceKey,
        p_day: day,
        p_count: 1,
      });
    }
  } catch {
    // best-effort by design — never a 500 for a beacon
  }
  return new NextResponse(null, { status: 204 });
}
