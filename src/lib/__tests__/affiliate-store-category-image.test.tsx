import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * CATEGORY TILE IMAGE CANARY (PHASE 0119 — owner order 2026-11-27
 * «استبدل جميع أيقونات Shop by Category بصور منتجات حقيقية مناسبة لكل
 * تصنيف»): the acceptance is the RENDERED MARKUP —
 *   1. a category WITH an image_url renders the real product photo
 *      (an <img> pointing at the trusted 527-G1 CDN host) and NEVER
 *      the carved icon;
 *   2. a category WITHOUT an image_url falls back to the carved
 *      Marble & Chrome icon pair (the 527 default);
 *   3. the server layer's public node type carries imageUrl so every
 *      surface can render it (the store hub / category page / home).
 *
 * The affiliate-kit-render precedent: renderToStaticMarkup + seam stubs.
 */

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
}));

import { AffiliateStoreCategoryImage, AffiliateStoreCategoryIcon } from "../../components/affiliate-store/AffiliateStoreProductCard";
import type { AffiliateStoreCategoryNode } from "../../lib/affiliate-store-server";

const CDN = "https://m.media-amazon.com/images/I/71dKNBdIdCL._AC_SL1500_.jpg";

describe("0119 — category tiles render REAL product photos (icon fallback intact)", () => {
  it("a category with image_url renders an <img> from the trusted CDN, never the carved icon", () => {
    const markup = renderToStaticMarkup(
      createElement(AffiliateStoreCategoryImage, {
        imageUrl: CDN,
        iconKey: "protein",
        name: "Supplements",
      }),
    );
    expect(markup).toContain(`<img`);
    expect(markup).toContain(CDN);
    expect(markup).toContain(`alt="Supplements"`);
    // the carved icon must NOT render when a real photo exists
    expect(markup).not.toContain("icons/protein-light.webp");
    // the image-failure placeholder is NOT pre-rendered (client-side onError only)
    expect(markup).not.toContain("Image unavailable");
  });

  it("a category WITHOUT image_url falls back to the carved icon pair (the 527 default)", () => {
    const markup = renderToStaticMarkup(
      createElement(AffiliateStoreCategoryImage, {
        imageUrl: null,
        iconKey: "dumbbell",
        name: "Strength & Free Weights",
      }),
    );
    expect(markup).toContain("icons/dumbbell-light.webp");
    // no CDN product photo renders when image_url is null
    expect(markup).not.toContain("m.media-amazon.com");
  });

  it("the carved icon component itself is unchanged (the identity mark survives 0119)", () => {
    const markup = renderToStaticMarkup(
      createElement(AffiliateStoreCategoryIcon, { iconKey: "laurel", name: "Recovery & Wellness", size: 40 }),
    );
    expect(markup).toContain("icons/laurel-light.webp");
    expect(markup).toContain("width=\"40\"");
  });

  it("the public category node carries imageUrl (the data contract for every surface)", () => {
    // compile-time contract: a node must be constructible WITH imageUrl
    const node: AffiliateStoreCategoryNode = {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "sports-nutrition",
      name: "Sports Nutrition",
      description: null,
      iconKey: "macros",
      imageUrl: CDN,
      parentId: null,
      publishedCount: 6,
      isLeaf: false,
    };
    expect(node.imageUrl).toBe(CDN);
  });
});
