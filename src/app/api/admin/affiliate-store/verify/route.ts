import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import {
  verifyAffiliateStoreImageUrl,
  verifyAffiliateStoreProductLink,
} from "@/lib/affiliate-store-link-verify";

/**
 * ADMIN STORE VERIFY — StoreLinkVerify's endpoint
 * (ALKEMOS-STORE-PHASE1 §1.2 — derived from blog-link-verify):
 *
 *   GET /api/admin/affiliate-store/verify?asin=B0XXXXXXXX
 *     → { ok, status, url, httpStatus, message }
 *   GET /api/admin/affiliate-store/verify?image=https://…   (VISIBILITY-
 *     PREVIEW 2026-11-26): the DIRECT-IMAGE probe — HEAD + content-type
 *     image/* (a 200 text/html answer is a PAGE, not an image).
 *
 * Server-side HEAD probes (no browser CORS limits), short timeout, ONE
 * retry, honest UNVERIFIED≠dead semantics. The weekly automated sweep
 * over all published products is the Phase-2 item (audit §5.2).
 */
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const image = request.nextUrl.searchParams.get("image");
  if (image !== null) {
    const result = await verifyAffiliateStoreImageUrl(image);
    return NextResponse.json(result);
  }
  const asin = request.nextUrl.searchParams.get("asin");
  const result = await verifyAffiliateStoreProductLink(asin);
  return NextResponse.json(result);
}
