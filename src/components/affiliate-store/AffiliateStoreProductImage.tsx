"use client";

import { useState } from "react";

/**
 * STORE PRODUCT IMAGE (PHASE 527) — the SINGLE rendering path for a
 * store product's visual on every public surface:
 *
 *   1. image_url set → the ORIGINAL product photo (527-G1: the trusted
 *      source is Amazon's product-image CDN, m.media-amazon.com — the
 *      exact photo of the listing the card links to);
 *   2. load FAILURE (404/timeout/broken) → the NEUTRAL PROFESSIONAL
 *      PLACEHOLDER in place — a branded "image unavailable" block that
 *      is NEVER presented as the product's photo (owner order:
 *      «توفير صورة بديلة احترافية عند تعذر تحميل الصورة، مع عدم
 *      تقديمها باعتبارها صورة المنتج»);
 *   3. no image_url at all → the same placeholder (this should never
 *      reach a public surface — the 527-G2 shelf gate blocks products
 *      without an image from publishing — the placeholder is the last
 *      line of defense).
 *
 * The person-free law (IMAGE-POLICY v2 §0) is enforced at WRITE time by
 * the store guards; this component only renders what passed the gate.
 */

export function AffiliateStoreProductImage({
  imageUrl,
  imageAlt,
  categoryName,
  size,
  className = "",
  eager = false,
  fill = false,
}: {
  imageUrl: string | null | undefined;
  imageAlt: string;
  categoryName: string;
  /** Used when `fill` is false (fixed-size renders). */
  size?: number;
  className?: string;
  eager?: boolean;
  /** Modern layout: fill the parent box (aspect-ratio containers). */
  fill?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    // The professional fallback — clearly labeled as unavailable, never
    // presented as the product photo (no fake imagery, no icon that
    // reads as "the product").
    return (
      <span
        className={`flex items-center justify-center bg-[linear-gradient(135deg,var(--muted)_0%,var(--card)_100%)] ${fill ? "absolute inset-0" : ""} ${className}`}
        style={fill ? undefined : { width: size ?? 64, height: size ?? 64 }}
        role="img"
        aria-label={`${imageAlt} — product image unavailable`}
        data-store-image-fallback=""
      >
        <span className="px-3 py-2 text-center">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Image unavailable
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-[var(--muted-foreground)]">
            {categoryName}
          </span>
        </span>
      </span>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element -- external
       original product photos (Amazon image CDN, 527-G1), fluid display
       sizes, not a next/image asset */
    <img
      src={imageUrl}
      alt={imageAlt}
      width={fill ? undefined : (size ?? 64)}
      height={fill ? undefined : (size ?? 64)}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={fill ? `absolute inset-0 h-full w-full ${className}` : className}
    />
  );
}
