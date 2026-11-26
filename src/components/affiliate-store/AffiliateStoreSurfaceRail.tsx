import { AffiliateStoreProductCard } from "@/components/affiliate-store/AffiliateStoreProductCard";
import { ShortDisclosureLine } from "@/components/affiliate-store/disclosure";
import {
  listAffiliateStoreProductsForSurface,
  type AffiliateStoreSurfaceType,
} from "@/lib/affiliate-store-server";

/**
 * AFFILIATE-STORE SURFACE RAIL (VISIBILITY-PREVIEW 2026-11-26 — owner
 * order «إضافة مداخل مناسبة للمتجر داخل صفحات المحتوى الإنجليزي ذات
 * الصلة»): the "Recommended gear" section rendered on the EN SERVER
 * content surfaces (equipment hubs, program pages).
 *
 * LAWS:
 *  - HONEST-EMPTY: renders NOTHING until at least one PUBLISHED product
 *    is bound to the surface (pending products never leak — RLS + the
 *    published-only query; zero regression before the owner publishes).
 *  - The د-2 short disclosure rides near the first recommendation links
 *    (DISCLOSURES-EN.md placement م-4/م-5).
 *  - Cards link ONLY to the public product pages; the ONE section CTA
 *    leads to the public /affiliate-store hub. NO Amazon links, NO
 *    prices, NO commission hints on the rail (the purchase unit lives
 *    on the product page — م-1 adjacency law).
 *  - EN-only surfaces by construction (this component is imported only
 *    by (en)-tree pages — store law §0).
 */
export async function AffiliateStoreSurfaceRail({
  surfaceType,
  surfaceKey,
  title = "Recommended gear",
  limit = 4,
}: {
  surfaceType: AffiliateStoreSurfaceType;
  surfaceKey: string;
  title?: string;
  limit?: number;
}) {
  const products = await listAffiliateStoreProductsForSurface(surfaceType, surfaceKey, limit);
  if (products.length === 0) return null;
  return (
    <section
      aria-labelledby="affiliate-store-surface-rail"
      className="mt-12 border-t border-[var(--edge)] pt-8"
      data-affiliate-store-rail={`${surfaceType}:${surfaceKey}`}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="affiliate-store-surface-rail" className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <a
          href="/affiliate-store"
          className="text-sm text-[var(--muted-foreground)] underline-offset-2 hover:underline"
        >
          More from the Alkemos Affiliate Store
        </a>
      </div>
      <ShortDisclosureLine className="mb-4" />
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <AffiliateStoreProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
