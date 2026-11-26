import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import {
  adminCategoryTree,
  adminGetStoreProduct,
  adminListProductLinks,
  adminUpsertStoreProduct,
  type StoreProductInput,
} from "@/lib/store-admin";

/**
 * ADMIN STORE PRODUCTS — create/update (ALKEMOS-STORE-PHASE1 §1.2).
 *
 *   POST  /api/admin/store/products   (create — born pending/unpublished)
 *   PATCH /api/admin/store/products   (update by input.id)
 *
 * The store guards ALWAYS run server-side (blocking findings refuse the
 * save); publishing is a SEPARATE owner action (review → publish, 0097).
 * English-content fields are validated by shape only — the operator UI
 * is bilingual but the CONTENT fields are EN by store law §0.
 */
export const maxDuration = 30;


/**
 * GET /api/admin/store/products?id=<uuid>
 *   → { product, links, categories } (the editor's load call).
 * Without id → just { categories } (the new-product form's selector).
 */
export async function GET(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const id = request.nextUrl.searchParams.get("id");
  const categories = await adminCategoryTree();
  if (!id) {
    return NextResponse.json({ product: null, links: [], categories });
  }
  const product = await adminGetStoreProduct(id);
  if (!product) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }
  const links = await adminListProductLinks(id);
  return NextResponse.json({ product, links, categories });
}

export async function POST(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const body = (await request.json().catch(() => null)) as StoreProductInput | null;
  if (!body || !body.title || !body.slug || !body.category_id || !body.summary || !body.content) {
    return NextResponse.json(
      { error: "Missing required fields (title, slug, category_id, summary, content)" },
      { status: 400 },
    );
  }
  const res = await adminUpsertStoreProduct(body);
  if (!res.ok) {
    return NextResponse.json({ error: res.error, findings: res.findings ?? [] }, { status: 409 });
  }
  return NextResponse.json({ ok: true, id: res.id, findings: res.findings });
}

export async function PATCH(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }
  const body = (await request.json().catch(() => null)) as StoreProductInput | null;
  if (!body || !body.id) {
    return NextResponse.json({ error: "id is required for update" }, { status: 400 });
  }
  const res = await adminUpsertStoreProduct(body);
  if (!res.ok) {
    return NextResponse.json({ error: res.error, findings: res.findings ?? [] }, { status: 409 });
  }
  return NextResponse.json({ ok: true, id: res.id, findings: res.findings });
}
