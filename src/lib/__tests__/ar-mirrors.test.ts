import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GET as pagesSitemapGET } from "@/app/sitemap-pages.xml/route";
import { metadata as arEvoMetadata } from "@/app/(ar)/ar/evo/layout";
import { metadata as arCoachingMetadata } from "@/app/(ar)/ar/coaching/layout";
import { metadata as enEvoMetadata } from "@/app/(en)/evo/layout";
import { metadata as enCoachingMetadata } from "@/app/(en)/coaching/layout";
import { metadata as arAffiliateMetadata } from "@/app/(ar)/ar/affiliate/layout";
import { metadata as enAffiliateMetadata } from "@/app/(en)/affiliate/layout";

/**
 * Phase SEO-GEO-6.4 canaries (§12.23) — P1-9 Arabic mirrors for /evo and
 * /coaching, the last language-engineering gap:
 *   1. The AR route modules exist (imports above would fail otherwise).
 *   2. Sitemap-pages carries all four URLs with hreflang alternates.
 *   3. Both AR layouts declare canonical + full en/ar/x-default pairs.
 *   4. The EN layouts now declare the AR mirror in their hreflang.
 *   5. AR titles stay in the Arabic title budget (~70 chars — the same
 *      clamp law as blog titles, P0-3).
 */

describe("AR mirrors for /evo + /coaching (SEO-GEO-6.4 §12.23)", () => {
  it("sitemap-pages exposes all four URLs with hreflang alternates", async () => {
    const res = await pagesSitemapGET();
    expect(res.status).toBe(200);
    const xml = await res.text();

    for (const loc of [
      "https://alkemos.com/evo",
      "https://alkemos.com/ar/evo",
      "https://alkemos.com/coaching",
      "https://alkemos.com/ar/coaching",
    ]) {
      expect(xml, `sitemap must contain ${loc}`).toContain(`<loc>${loc}</loc>`);
    }

    // hreflang xhtml:link pairs on the evo block
    expect(xml).toMatch(
      /<url>\s*<loc>https:\/\/alkemos\.com\/evo<\/loc>[\s\S]*?hreflang="ar"\s+href="https:\/\/alkemos\.com\/ar\/evo"[\s\S]*?<\/url>/,
    );
    expect(xml).toMatch(
      /<url>\s*<loc>https:\/\/alkemos\.com\/ar\/evo<\/loc>[\s\S]*?hreflang="en"\s+href="https:\/\/alkemos\.com\/evo"[\s\S]*?<\/url>/,
    );
    expect(xml).toMatch(
      /<url>\s*<loc>https:\/\/alkemos\.com\/coaching<\/loc>[\s\S]*?hreflang="ar"\s+href="https:\/\/alkemos\.com\/ar\/coaching"[\s\S]*?<\/url>/,
    );
    expect(xml).toMatch(
      /<url>\s*<loc>https:\/\/alkemos\.com\/ar\/coaching<\/loc>[\s\S]*?hreflang="en"\s+href="https:\/\/alkemos\.com\/coaching"[\s\S]*?<\/url>/,
    );
  });

  it("AR /evo layout: canonical + full hreflang + brandless title within budget", () => {
    expect(arEvoMetadata.alternates?.canonical).toBe("https://alkemos.com/ar/evo");
    expect(arEvoMetadata.alternates?.languages).toEqual({
      en: "https://alkemos.com/evo",
      ar: "https://alkemos.com/ar/evo",
      "x-default": "https://alkemos.com/evo",
    });
    // ANTI-DOUBLE-BRAND CANARY: the /ar/layout template appends exactly
    // one " — Alkemos" to depth-1 titles — the stored title must carry NO
    // brand of its own (same law class as the P0-3 blog brand strip).
    const title = arEvoMetadata.title as string;
    expect(title).toMatch(/[\u0600-\u06FF]/);
    expect(title).not.toContain("Alkemos");
    expect(`${title} — Alkemos`.length).toBeLessThanOrEqual(70);
    expect((arEvoMetadata.openGraph?.locale as string) || "").toBe("ar_EG");
  });

  it("AR /coaching layout: canonical + full hreflang + owner-approved absolute title within budget", () => {
    expect(arCoachingMetadata.alternates?.canonical).toBe(
      "https://alkemos.com/ar/coaching",
    );
    expect(arCoachingMetadata.alternates?.languages).toEqual({
      en: "https://alkemos.com/coaching",
      ar: "https://alkemos.com/ar/coaching",
      "x-default": "https://alkemos.com/coaching",
    });
    // ANTI-DOUBLE-BRAND CANARY — BILINGUAL-CONTENT Phase 2 (2026-11-04):
    // the owner approved the branded title «التدريب الأونلاين مع مدرب
    // متخصص | Alkemos» (the old 66-char brandless title wasted the
    // budget). It is pinned with `title.absolute`, which BYPASSES the
    // /ar layout's «%s — Alkemos» template — the served title is exactly
    // this string, so the brand appears exactly ONCE (never doubled).
    // The evo law above (brandless + template) is unchanged for
    // template-rendered titles.
    const titleObj = arCoachingMetadata.title as { absolute?: string };
    expect(titleObj.absolute).toBeDefined();
    const title = titleObj.absolute!;
    expect(title).toMatch(/[\u0600-\u06FF]/);
    expect(title).toContain("| Alkemos");
    // The brand appears exactly once — the anti-double-brand invariant.
    expect(title.split("Alkemos").length - 1).toBe(1);
    expect([...title].length).toBeLessThanOrEqual(60);
    expect((arCoachingMetadata.openGraph?.locale as string) || "").toBe("ar_EG");
  });

  it("EN layouts now declare the AR mirror in hreflang (no more EN-only pair)", () => {
    expect(enEvoMetadata.alternates?.languages).toEqual({
      en: "https://alkemos.com/evo",
      ar: "https://alkemos.com/ar/evo",
      "x-default": "https://alkemos.com/evo",
    });
    expect(enCoachingMetadata.alternates?.languages).toEqual({
      en: "https://alkemos.com/coaching",
      ar: "https://alkemos.com/ar/coaching",
      "x-default": "https://alkemos.com/coaching",
    });
  });
});

describe("AR mirror for /affiliate (§12.53 item 11 — Phase 208)", () => {
  it("sitemap-pages exposes the affiliate pair with hreflang alternates", async () => {
    const res = await pagesSitemapGET();
    expect(res.status).toBe(200);
    const xml = await res.text();

    for (const loc of [
      "https://alkemos.com/affiliate",
      "https://alkemos.com/ar/affiliate",
    ]) {
      expect(xml, `sitemap must contain ${loc}`).toContain(`<loc>${loc}</loc>`);
    }

    // hreflang xhtml:link pairs on both blocks
    expect(xml).toMatch(
      /<url>\s*<loc>https:\/\/alkemos\.com\/affiliate<\/loc>[\s\S]*?hreflang="ar"\s+href="https:\/\/alkemos\.com\/ar\/affiliate"[\s\S]*?<\/url>/,
    );
    expect(xml).toMatch(
      /<url>\s*<loc>https:\/\/alkemos\.com\/ar\/affiliate<\/loc>[\s\S]*?hreflang="en"\s+href="https:\/\/alkemos\.com\/affiliate"[\s\S]*?<\/url>/,
    );
  });

  it("AR /affiliate layout: canonical + full hreflang + brandless title within budget + dedicated affiliate card", () => {
    expect(arAffiliateMetadata.alternates?.canonical).toBe(
      "https://alkemos.com/ar/affiliate",
    );
    expect(arAffiliateMetadata.alternates?.languages).toEqual({
      en: "https://alkemos.com/affiliate",
      ar: "https://alkemos.com/ar/affiliate",
      "x-default": "https://alkemos.com/affiliate",
    });
    // ANTI-DOUBLE-BRAND CANARY: the /ar/layout template appends exactly
    // one " — Alkemos" to depth-1 titles — the stored title must carry NO
    // brand of its own (same law class as the P0-3 blog brand strip).
    const title = arAffiliateMetadata.title as string;
    expect(title).toMatch(/[\u0600-\u06FF]/);
    expect(title).not.toContain("Alkemos");
    expect(`${title} — Alkemos`.length).toBeLessThanOrEqual(70);
    // MSA title: no English words smuggled into the Arabic title.
    expect(title).not.toMatch(/[A-Za-z]/);
    expect((arAffiliateMetadata.openGraph?.locale as string) || "").toBe("ar_EG");
    expect(arAffiliateMetadata.openGraph?.url).toBe(
      "https://alkemos.com/ar/affiliate",
    );
    // SOCIAL-OG-4 (2026-11-06): pages without an own content image share the
    // homepage card as the default fallback (owner law — first-own-image,
    // homepage default). The twitter card is string-guarded by
    // og-image-coverage. The URL carries the ?v=4 share-cache-bust.
    const images = arAffiliateMetadata.openGraph?.images as Array<{
      url: string;
    }>;
    expect(images?.[0]?.url).toBe("/images/og/og-home-ar.png?v=4");
  });

  it("EN /affiliate layout completes its half of the pair (was a dangling hreflang → 404)", () => {
    expect(enAffiliateMetadata.alternates?.languages).toEqual({
      en: "https://alkemos.com/affiliate",
      ar: "https://alkemos.com/ar/affiliate",
      "x-default": "https://alkemos.com/affiliate",
    });
  });

  it("the AR page re-exports the shared bilingual EN page (no forked content)", () => {
    const src = readFileSync(
      resolve(__dirname, "../../app/(ar)/ar/affiliate/page.tsx"),
      "utf8",
    );
    expect(src).toContain('export { default } from "@/app/(en)/affiliate/page"');
  });

  it("the language toggle carries the affiliate mirror route", () => {
    const src = readFileSync(
      resolve(__dirname, "../../components/LanguageToggle.tsx"),
      "utf8",
    );
    expect(src).toContain('{ en: "/affiliate", ar: "/ar/affiliate" }');
    // The old “no mirror for /affiliate” claim must be gone from the docs.
    expect(src).not.toContain("e.g. /affiliate");
  });
});
