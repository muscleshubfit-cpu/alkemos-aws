import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import {
  adminAffiliateStoreCategoryTree,
  adminAffiliateStoreClicksByDay,
  adminAffiliateStoreStats,
  adminListAffiliateStoreProducts,
  adminPublishAffiliateStoreProduct,
  adminSetAffiliateStoreCategoryActive,
  adminSetAffiliateStoreFeatured,
  adminUnpublishAffiliateStoreProduct,
  type AffiliateStoreActionResult,
} from "@/lib/affiliate-store-admin";

/**
 * ADMIN AFFILIATE-STORE DASHBOARD (ALKEMOS-STORE-RENAME 2026-11-26 — the
 * root-cause fix of «تعذر تحميل بيانات المتجر», unified to the
 * affiliate_store name by the owner's rename order):
 *
 *   GET  /api/admin/affiliate-store
 *     → { stats, products, categories, clicks } — the dashboard's ONE
 *       load call (everything the view renders).
 *   POST /api/admin/affiliate-store   { action, id, ...extra }
 *     → the narrow owner-action set of the 0097 flow:
 *       review · publish · unpublish · feature {featured} ·
 *       category-activate {active}
 *
 * ROOT CAUSE THIS FILE CLOSES: the dashboard shipped (Phase 523/C4)
 * calling GET+POST /api/admin/store, but NO route.ts ever existed at
 * that path — only the products/ and verify/ children did — so every
 * load died on 404 and the view toasted «تعذر تحميل بيانات المتجر»
 * (measured live: HTTP 404 on production) while the data layer, the
 * tables (0115) and the founding batch (0116/0117: 27 pending
 * products) were all present and healthy. The fix is the route itself
 * — never a hidden error mask: a 401/500 still surfaces honestly.
 *
 * LAWS:
 *  - requireAdmin BEFORE any data-layer call (the 0105 channel law;
 *    the service-role client below it is the second lock).
 *  - 527-L2 AUTO-PUBLISH: the 0097 dual-approval flow (review → publish)
 *    is RETIRED by the owner's order — products publish the moment they
 *    save. The action set narrows to: publish (republish) · unpublish ·
 *    feature {featured} · category-activate {active}. The store guards
 *    (image + ASIN + content laws) remain the only gate, enforced in
 *    the data layer on every save.
 *  - Category activation stays an OWNER decision (waves 2/3 remain
 *    inactive until the owner's activation order).
 *  - System separation untouched: this route and its data layer never
 *    approach the System-1 partner-referral family (the partner
 *    commission tables and the /referral routes) or System 3 (zero
 *    pages/APIs for the future Arabic store) — enforced by the
 *    affiliate-store-separation canaries.
 */
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const [stats, products, categories, clicks] = await Promise.all([
    adminAffiliateStoreStats(),
    adminListAffiliateStoreProducts(),
    adminAffiliateStoreCategoryTree(),
    adminAffiliateStoreClicksByDay(),
  ]);
  return NextResponse.json({ stats, products, categories, clicks });
}

export async function POST(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    id?: string;
    featured?: boolean;
    active?: boolean;
  } | null;
  const action = body?.action ?? "";
  const id = body?.id ?? "";
  if (!action || !id) {
    return NextResponse.json(
      { error: "action and id are required" },
      { status: 400 },
    );
  }

  let res: AffiliateStoreActionResult;
  switch (action) {
    case "publish":
      res = await adminPublishAffiliateStoreProduct(id);
      break;
    case "unpublish":
      res = await adminUnpublishAffiliateStoreProduct(id);
      break;
    case "feature":
      res = await adminSetAffiliateStoreFeatured(id, body?.featured === true);
      break;
    case "category-activate":
      res = await adminSetAffiliateStoreCategoryActive(id, body?.active === true);
      break;
    default:
      return NextResponse.json(
        { error: `unknown action "${action}"` },
        { status: 400 },
      );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: res.error, findings: res.findings ?? [] },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, findings: res.findings ?? [] });
}
