import Link from "next/link";
import { ThemeImg } from "@/components/ThemeImg";
import { AffiliateStoreProductImage } from "@/components/affiliate-store/AffiliateStoreProductImage";
import type { AffiliateStoreProductCard as CardData } from "@/lib/affiliate-store-server";

/**
 * STORE PRODUCT CARD + CARVED CATEGORY ICON (PHASE 527 — owner order
 * 2026-11-27 «إعادة تصميم المتجر بالكامل»: a professional retail
 * grid, not a suggestion list).
 *
 * THE CARD (527-D1):
 *  - VERTICAL layout with a LARGE square image on top (the real product
 *    photo — 527-G1);
 *  - Featured badge on the image corner when the product is featured;
 *  - Brand + title (clamped) + the price line: the API-served price
 *    when one exists, otherwise the honest "See price on Amazon"
 *    (never an invented price — «إذا لم يتوفر سعر موثوق، اعرض See
 *    price on Amazon»);
 *  - A clear View Product button to the product page (the purchase
 *    unit with its attached disclosure lives ONLY on the product page —
 *    the م-1 adjacency law);
 *  - NO amazon link on the grid (م-1 adjacency is unsatisfiable on a
 *    grid, so the grid shows none) and NO commission hints (ninth guard).
 *
 * The carved category icon (AffiliateStoreCategoryIcon) remains the
 * CATEGORY visual — categories render as visible tiles with their
 * carved icon + name + description (the person-free law by design).
 */

const ICON_FALLBACK = "dumbbell";

/** The carved icon for a category icon_key (light+dark pair, Marble & Chrome). */
export function AffiliateStoreCategoryIcon({
  iconKey,
  name,
  size = 64,
  className = "",
}: {
  iconKey: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const key = iconKey || ICON_FALLBACK;
  return (
    <ThemeImg
      light={`/images/brand/icons/${key}-light.webp`}
      dark={`/images/brand/icons/${key}-dark.webp`}
      alt={name}
      width={size}
      height={size}
      className={className}
    />
  );
}

/** The price line: API price when trusted, otherwise the honest Amazon CTA text. */
export function AffiliateStorePriceLine({
  priceUsd,
  className = "",
}: {
  priceUsd: number | null;
  className?: string;
}) {
  return (
    <span className={`text-sm font-semibold ${className}`}>
      {priceUsd !== null ? `$${priceUsd.toFixed(2)}` : "See price on Amazon"}
    </span>
  );
}

export function AffiliateStoreProductCard({ product }: { product: CardData }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--edge)] bg-[var(--card)] transition-shadow hover:shadow-lg">
      <Link
        href={`/affiliate-store/${product.categorySlug}/${product.slug}`}
        className="flex flex-1 flex-col"
        aria-label={product.title}
      >
        {/* The image box — large square, real product photo */}
        <span className="relative block aspect-square w-full overflow-hidden bg-[var(--muted)]/40 p-4">
          <AffiliateStoreProductImage
            imageUrl={product.imageUrl}
            imageAlt={product.title}
            categoryName={product.categoryName}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {product.isFeatured && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-[var(--text)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--bg)] shadow-sm">
              Featured
            </span>
          )}
        </span>

        {/* The body */}
        <span className="flex flex-1 flex-col gap-1.5 p-4 pt-3">
          {product.brand && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {product.brand}
            </span>
          )}
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text)]">
            {product.title}
          </span>
          <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {product.summary}
          </span>
          <span className="mt-auto flex items-center justify-between gap-2 pt-3">
            <AffiliateStorePriceLine priceUsd={product.priceUsd} />
            {product.editorialRating !== null && (
              <span className="rounded-md border border-[var(--edge)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                ★ {product.editorialRating.toFixed(1)}
              </span>
            )}
          </span>
        </span>
      </Link>

      {/* The clear View Product CTA (the buy unit + م-1 disclosure live
          on the product page — the grid CTA routes there). */}
      <div className="border-t border-[var(--edge)] p-3">
        <Link
          href={`/affiliate-store/${product.categorySlug}/${product.slug}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--text)] px-4 py-2 text-xs font-semibold text-[var(--bg)] transition-opacity hover:opacity-85"
        >
          View Product
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function AffiliateStoreProductGrid({ products }: { products: CardData[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--edge)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
        No products here yet — new picks appear as soon as they are saved.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <AffiliateStoreProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
