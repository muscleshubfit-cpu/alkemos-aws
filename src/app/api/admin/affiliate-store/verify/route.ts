import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { verifyAffiliateStoreProductLink } from "@/lib/affiliate-store-link-verify";

/**
 * ADMIN STORE VERIFY — StoreLinkVerify's endpoint
 * (ALKEMOS-STORE-PHASE1 §1.2 — derived from blog-link-verify):
 *
 *   GET /api/admin/affiliate-store/verify?asin=B0XXXXXXXX
 *     → { ok, status, url, httpStatus, message }
 *
 * Server-side HEAD probe (no browser CORS limits), short timeout, ONE
 * retry, honest UNVERIFIED≠dead semantics. The weekly automated sweep
 * over all published products is the Phase-2 item (audit §5.2).
 */
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const asin = request.nextUrl.searchParams.get("asin");
  const result = await verifyAffiliateStoreProductLink(asin);
  return NextResponse.json(result);
}
