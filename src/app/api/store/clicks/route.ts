import { NextRequest, NextResponse } from "next/server";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase/admin";

/**
 * STORE CLICK BEACON (ALKEMOS-STORE-PHASE1 §1.5 — the governing law
 * §1.5-6 / clause (v)):
 *
 *   POST /api/store/clicks   { productId, surfaceType, surfaceKey }
 *
 * The NON-INTERCEPTING click record: the purchase link itself is a
 * direct anchor to amazon.com; this endpoint only receives a
 * fire-and-forget navigator.sendBeacon payload and inserts ONE
 * aggregate row. It NEVER redirects anywhere (clause (v) — no
 * Redirecting Links, ever) and stores ZERO PII (product/surface/day
 * only — the sub-tags rule; no user id, no IP, no UA).
 *
 * HARD BOUNDS:
 *  - Insert-only via the service-role key (store_click_events has NO
 *    client policies — RLS deny-all).
 *  - Rate-limited per instance (a small in-memory token bucket — the
 *    public endpoint discipline; best-effort on a multi-instance
 *    deploy, backed by the surface-type whitelist + UUID check).
 *  - Validates the product EXISTS and is PUBLISHED before inserting
 *    (unpublished/unknown ids write nothing).
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

/** Simple per-instance token bucket: 120 writes/min, burst 30. */
const RATE = { tokens: 30, refillPerSec: 2, max: 120 };
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
    // 204: the beacon silently discards — the click itself (the real
    // event) already happened on Amazon's side.
    return new NextResponse(null, { status: 204 });
  }
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return new NextResponse(null, { status: 204 });
  }
  const body = (await request.json().catch(() => null)) as
    | { productId?: string; surfaceType?: string; surfaceKey?: string }
    | null;
  const productId = body?.productId ?? "";
  const surfaceType = body?.surfaceType ?? "";
  const surfaceKey = (body?.surfaceKey ?? "").slice(0, 120);
  if (!UUID_RE.test(productId) || !SURFACE_TYPES.has(surfaceType)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  try {
    // Only a PUBLISHED product's id is accepted (no probing of drafts).
    const { data: product } = await supabaseAdmin
      .from("store_products")
      .select("id")
      .eq("id", productId)
      .eq("is_published", true)
      .maybeSingle();
    if (!product) {
      return new NextResponse(null, { status: 204 });
    }
    await supabaseAdmin.from("store_click_events").insert({
      product_id: productId,
      surface_type: surfaceType,
      surface_key: surfaceKey,
    });
  } catch {
    // best-effort by design — never a 500 for a beacon
  }
  return new NextResponse(null, { status: 204 });
}
