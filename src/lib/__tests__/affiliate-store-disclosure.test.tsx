import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * STORE DISCLOSURE CANARY (governing law §3.4-7 — the Phase-1 spec
 * item 1.7): «كاناري يفشل أي صفحة منتج/فئة بلا مكون الإفصاح
 * الإنجليزي». The acceptance is the RENDERED MARKUP: every purchase
 * unit carries the mandated OA sentence attached (م-1), and the store
 * page sources structurally include the disclosure components.
 *
 * The affiliate-kit-render precedent: renderToStaticMarkup + seam
 * stubs; the page chrome (header/footer) is mocked to nothing.
 */

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href }, children),
}));

vi.mock("lucide-react", () => ({
  ExternalLink: () => createElement("span", { "aria-hidden": "true" }, "↗"),
}));

import { AmazonBuyButton } from "../../components/affiliate-store/AmazonBuyButton";
import {
  OaDisclosureLine,
  ShortDisclosureLine,
  OA_DISCLOSURE_TEXT,
} from "../../components/affiliate-store/disclosure";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("م-1 — the OA disclosure renders attached to every buy unit", () => {
  it("the buy unit's markup contains the mandated OA sentence (above the button)", () => {
    const markup = renderToStaticMarkup(
      createElement(AmazonBuyButton, {
        buyUrl: "https://www.amazon.com/dp/B0C1234567?tag=test-tag-20",
        productId: "11111111-1111-4111-8111-111111111111",
        surfaceType: "product",
        surfaceKey: "test-product",
      }),
    );
    expect(markup).toContain(OA_DISCLOSURE_TEXT);
    // the disclosure line precedes the anchor in the markup (م-1: فوق الزر/ملاصقًا له)
    const disclosureIndex = markup.indexOf(OA_DISCLOSURE_TEXT);
    const anchorIndex = markup.indexOf("<a ");
    expect(disclosureIndex).toBeGreaterThan(-1);
    expect(anchorIndex).toBeGreaterThan(disclosureIndex);
  });

  it("the link is a direct sponsored anchor to amazon.com (clause (v) + §2)", () => {
    const markup = renderToStaticMarkup(
      createElement(AmazonBuyButton, {
        buyUrl: "https://www.amazon.com/dp/B0C1234567?tag=test-tag-20",
        productId: "11111111-1111-4111-8111-111111111111",
      }),
    );
    expect(markup).toContain('href="https://www.amazon.com/dp/B0C1234567?tag=test-tag-20"');
    expect(markup).toContain('rel="sponsored noopener"');
    expect(markup).toContain("Check price on Amazon");
  });

  it("the OA sentence is the EXACT Agreement literal (never edited/translated)", () => {
    expect(OA_DISCLOSURE_TEXT).toBe(
      "As an Amazon Associate I earn from qualifying purchases.",
    );
  });
});

describe("د-2 — the short disclosure line renders for content surfaces", () => {
  it("renders the fixed short text", () => {
    const markup = renderToStaticMarkup(createElement(ShortDisclosureLine));
    expect(markup).toContain(
      "When you buy through links on our site, we may earn an affiliate commission at no extra cost to you.",
    );
  });
  it("OaDisclosureLine renders standalone too (the reusable component)", () => {
    const markup = renderToStaticMarkup(createElement(OaDisclosureLine));
    expect(markup).toContain(OA_DISCLOSURE_TEXT);
  });
});

describe("§3.4-7 (structural) — store pages include the disclosure components", () => {
  const REPO = resolve(__dirname, "../../../");
  const PAGES = [
    "src/app/(en)/affiliate-store/page.tsx",
    "src/app/(en)/affiliate-store/[category]/page.tsx",
    "src/app/(en)/affiliate-store/[category]/[slug]/page.tsx",
  ];

  it("every store public page source references the disclosure components", () => {
    for (const page of PAGES) {
      const full = resolve(REPO, page);
      expect(existsSync(full), `${page} must exist`).toBe(true);
      const text = readFileSync(full, "utf-8");
      expect(
        text.includes("disclosure") || text.includes("AmazonBuyButton"),
        `${page} must mount a disclosure component (§3.4-7)`,
      ).toBe(true);
    }
  });

  it("the product page mounts AmazonBuyButton (the م-1 carrier) and the footer line is pathname-gated EN", () => {
    const productPage = readFileSync(
      resolve(REPO, "src/app/(en)/affiliate-store/[category]/[slug]/page.tsx"),
      "utf-8",
    );
    expect(productPage.includes("AmazonBuyButton")).toBe(true);
    const footer = readFileSync(resolve(REPO, "src/components/SiteFooter.tsx"), "utf-8");
    expect(footer.includes("As an Amazon Associate I earn from qualifying purchases.")).toBe(
      true,
    );
    expect(footer.includes('pathname.startsWith("/affiliate-store")')).toBe(true);
  });
});
