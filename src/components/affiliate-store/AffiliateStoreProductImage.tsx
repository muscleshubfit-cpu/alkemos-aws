"use client";

import { useState } from "react";
import { ThemeImg } from "@/components/ThemeImg";

/**
 * STORE PRODUCT IMAGE — the SINGLE rendering path for a store product's
 * visual (VISIBILITY-PREVIEW 2026-11-26 — owner order «توفير صورة بديلة
 * احترافية عند غياب الصورة أو فشل تحميلها»):
 *
 *   1. image_url set → the owned/licensed <img> (guard-approved at write
 *      time — IMAGE-POLICY-EN.md v2);
 *   2. load FAILURE (404/timeout/broken) → falls back IN PLACE to the
 *      category's CARVED ICON (ص-1) — never a broken-image glyph, never
 *      an empty box on a public store surface;
 *   3. no image_url at all → the carved icon (the launch default).
 *
 * The carved icon pair (light+dark) is person-free by construction, so
 * the fallback keeps every surface compliant with the absolute image
 * law even when an external owned URL dies.
 */

const ICON_FALLBACK = "dumbbell";

export function AffiliateStoreProductImage({
  imageUrl,
  imageAlt,
  categoryIconKey,
  categoryName,
  size = 64,
  className = "",
  eager = false,
}: {
  imageUrl: string | null | undefined;
  imageAlt: string;
  categoryIconKey: string | null;
  categoryName: string;
  size?: number;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const iconKey = categoryIconKey || ICON_FALLBACK;
  if (!imageUrl || failed) {
    return (
      <ThemeImg
        light={`/images/brand/icons/${iconKey}-light.webp`}
        dark={`/images/brand/icons/${iconKey}-dark.webp`}
        alt={imageAlt || categoryName}
        width={size}
        height={size}
        eager={eager}
        className={className}
      />
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- external
       owned/licensed URLs, fixed display size, not a next/image asset */
    <img
      src={imageUrl}
      alt={imageAlt}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
