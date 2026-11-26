import Link from "next/link";
import { ThemeImg } from "@/components/ThemeImg";
import type { AffiliateStoreProductCard as CardData } from "@/lib/affiliate-store-server";

/**
 * STORE PRODUCT CARD + CARVED ICON (ALKEMOS-STORE-PHASE1 §1.3 — the
 * IMAGE-POLICY-EN.md v2 default: a product without an owned/licensed
 * image renders the category's CARVED ICON (ص-1); the person-free rule
 * is enforced at write time, the icon is the fallback that makes the
 * store's surfaces person-free by construction).
 *
 * The card carries NO price (§3.4-6), NO commission hints (§6-c), and
 * NO amazon link — the purchase unit exists ONLY on the product page
 * (م-1 adjacency is unsatisfiable on a grid, so the grid shows none).
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

export function AffiliateStoreProductCard({ product }: { product: CardData }) {
  return (
    <Link
      href={`/affiliate-store/${product.categorySlug}/${product.slug}`}
      className="group flex gap-4 rounded-xl border border-[var(--edge)] bg-[var(--card)] p-4 transition-shadow hover:shadow-md"
    >
      <span className="shrink-0 self-start">
        {product.imageUrl ? (
          // Owned/licensed image only (guard-rejected at write time if
          // Amazon-hosted or person-signaled — IMAGE-POLICY-EN.md v2 §0).
          /* eslint-disable-next-line @next/next/no-img-element -- external
             owned/licensed URLs, fixed display size, not a next/image asset */
          <img
            src={product.imageUrl}
            alt={product.title}
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
            className="rounded-lg object-contain"
          />
        ) : (
          <AffiliateStoreCategoryIcon iconKey={product.categoryIconKey} name={product.categoryName} />
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
          {product.title}
        </span>
        {product.brand && (
          <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
            {product.brand}
          </span>
        )}
        <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
          {product.summary}
        </span>
      </span>
    </Link>
  );
}

export function AffiliateStoreProductGrid({ products }: { products: CardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {products.map((product) => (
        <AffiliateStoreProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
