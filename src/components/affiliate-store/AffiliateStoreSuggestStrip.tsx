"use client";

import { useEffect, useState } from "react";
import { AffiliateStoreProductImage } from "@/components/affiliate-store/AffiliateStoreProductImage";
import { ShortDisclosureLine } from "@/components/affiliate-store/disclosure";

/**
 * AFFILIATE-STORE SUGGEST STRIP (VISIBILITY-PREVIEW 2026-11-26 — the
 * RecipeSuggestStrip pattern lifted to the store): a slim row of up to 3
 * PUBLISHED products bound to the caller's EN content surface
 * (affiliate_store_product_links), for the CLIENT-side tool pages
 * (the calculators/planners are "use client" pages — the rail rides a
 * lazy fetch against the public /api/affiliate-store/suggest endpoint).
 *
 * LAWS:
 *  - HONEST-EMPTY: renders NOTHING until real PUBLISHED products match
 *    — before the owner's 0097 review + publish the tools look exactly
 *    as they did (zero regression).
 *  - EN ONLY (store law §0): the caller passes lang; the strip drops
 *    out entirely when the UI language is Arabic.
 *  - Cards link ONLY to the public product pages; the ONE strip CTA
 *    leads to the public /affiliate-store hub. No Amazon links, no
 *    prices, no commission hints (the ninth guard).
 */

type SuggestedProduct = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  brand: string | null;
  imageUrl: string | null;
  categorySlug: string;
  categoryName: string;
  categoryIconKey: string | null;
};
export function AffiliateStoreSuggestStrip({
  lang,
  surfaceType,
  surfaceKey,
  title = "Gear we recommend for this",
  limit = 3,
}: {
  lang: "en" | "ar";
  surfaceType: "tool" | "equipment_hub" | "program" | "blog" | "collection";
  surfaceKey: string;
  title?: string;
  limit?: number;
}) {
  const isAr = lang === "ar";
  const [items, setItems] = useState<SuggestedProduct[]>([]);

  useEffect(() => {
    if (isAr) return; // store law §0 — EN surfaces only
    let cancelled = false;
    const params = new URLSearchParams({ surface: surfaceType, key: surfaceKey, limit: String(limit) });
    fetch(`/api/affiliate-store/suggest?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((body: { products?: SuggestedProduct[] }) => {
        if (!cancelled && Array.isArray(body.products)) setItems(body.products);
      })
      .catch(() => {
        /* fail-soft: the strip simply never renders */
      });
    return () => {
      cancelled = true;
    };
  }, [isAr, surfaceType, surfaceKey, limit]);

  if (isAr || items.length === 0) return null;

  return (
    <section
      aria-label={title}
      data-affiliate-store-strip={`${surfaceType}:${surfaceKey}`}
      className="mt-6 rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-5"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <a
          href="/affiliate-store"
          className="text-sm text-[var(--muted-foreground)] underline-offset-2 hover:underline"
        >
          Alkemos Affiliate Store
        </a>
      </div>
      <ShortDisclosureLine className="mb-3" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <li key={product.id}>
            <a
              href={`/affiliate-store/${product.categorySlug}/${product.slug}`}
              className="group flex h-full gap-3 rounded-xl border border-[var(--edge)] bg-[var(--card)] p-3 transition-shadow hover:shadow-md"
            >
              <span className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]/40">
                <AffiliateStoreProductImage
                  imageUrl={product.imageUrl}
                  imageAlt={product.title}
                  categoryName={product.categoryName}
                  fill
                  className="object-contain"
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
                  {product.title}
                </span>
                {product.brand && (
                  <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">{product.brand}</span>
                )}
                <span className="mt-1 line-clamp-2 block text-xs text-[var(--muted-foreground)]">
                  {product.summary}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
