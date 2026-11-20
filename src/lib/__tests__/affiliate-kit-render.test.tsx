/**
 * ORGANIC-GROWTH-P1-G render proof (owner order 2026-11-20 — docs/
 * organic-growth-system-2026-11-18/10-prioritized-execution-roadmap.md
 * §P1-G): the acceptance is «كيت منشور بالصفحة» — the kit is
 * PUBLISHED ON THE PAGE. Source pins alone cannot prove that (a dead
 * branch keeps the text while rendering nothing — the probe lesson of
 * this frame), so the proof renders the ACTUAL page view
 * (AffiliateProgramView, guest state) with renderToStaticMarkup and
 * asserts on the real markup:
 *
 *   - the segments section renders (4 cards × the two-market story);
 *   - the three 07-§2 matrix links render as real <a href> (locale-
 *     aware — the /ar mirrors);
 *   - the recruitment-kit section renders with the three outreach
 *     template BODIES (not just titles) + the in-template disclosure
 *     + the honesty note;
 *   - the P0-E guest surface is preserved (the crawlable CTAs).
 *
 * The diet-plan-bridge-render / tool-chain-bridge-render precedent:
 * next/link is stubbed at the seam (no Next router under vitest) and
 * the page chrome (header/footer) is mocked to nothing — the proof
 * targets the page's own sections.
 */
import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children?: ReactNode;
  }) => createElement("a", { href, className }, children),
}));

// The page chrome is mocked at the seam — the proof targets the view's
// own sections, not the shared header/footer grids.
vi.mock("@/components/SiteHeader", () => ({ SiteHeader: () => null }));
vi.mock("@/components/SiteFooter", () => ({ SiteFooter: () => null }));

// The URL-first i18n seam: the active language drives the whole view.
const langState: { lang: "en" | "ar" } = { lang: "en" };
vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({ lang: langState.lang, t: (k: string) => k }),
}));
vi.mock("@/hooks/use-nav", () => ({
  useNav: () => ({ navigate: () => undefined }),
}));
// Guest state — the crawler-facing default (no profile, no share
// section, no authed toolkit).
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ profile: null }),
}));

import { AffiliateProgramView } from "@/components/views/AffiliateProgramView";

function renderView(lang: "en" | "ar"): string {
  const prev = langState.lang;
  langState.lang = lang;
  try {
    return renderToStaticMarkup(createElement(AffiliateProgramView));
  } finally {
    langState.lang = prev;
  }
}

/** The visible text layer only (tags stripped — hrefs are ASCII by
 * design; the MSA law governs the source strings). */
function textOnly(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("AffiliateProgramView render (P1-G — the kit is PUBLISHED on the page)", () => {
  const en = renderView("en");
  const ar = renderView("ar");

  it("EN: the segments section renders — 4 cards + the two-markets story + the 3 matrix links", () => {
    expect(en).toContain("The highest-value partner segments");
    expect(en).toContain("Coaches — the highest-value segment");
    expect(en).toContain("Two markets work for you from one link");
    expect(en).toContain("Nutrition professionals");
    expect(en).toContain("Content creators");
    expect(en).toContain("Community owners");
    // the 07-§2 matrix row — real crawlable <a href> links
    expect(en).toContain('href="/for-coaches"');
    expect(en).toContain('href="/memberships"');
    expect(en).toContain('href="/coaching"');
    expect(en).toContain("Explore the coaches platform");
  });

  it("EN: the recruitment kit renders — 3 template BODIES + disclosure + honesty note", () => {
    expect(en).toContain("The recruitment kit — ready outreach messages");
    expect(en).toContain("Instagram DM to a coach");
    expect(en).toContain("WhatsApp message to a creator");
    expect(en).toContain("Email to a gym or nutrition practice");
    // the template bodies are PUBLISHED (not just titled) — the
    // copyable artifacts themselves render on the page (the apostrophe
    // in [Coach's name] arrives HTML-escaped — assert the stable part)
    expect(en).toContain("Hi [Coach");
    expect(en).toContain("If it fits your audience, start here: [Your link]");
    expect(en).toContain("(Disclosure: this is an affiliate link — I may earn a commission on eligible purchases.)");
    expect(en).toContain("Subject: A 20%-commission partnership with Alkemos");
    expect(en).toContain("guarantee no income");
    expect(en).toContain("Honesty reminder: never add income promises");
  });

  it("AR: القسمان يُرسمان بالعربية — الروابط بمرايا ‎/ar والنصوص فصحى", () => {
    expect(ar).toContain("شرائح الشركاء الأعلى قيمة");
    expect(ar).toContain("المدربون — الشريحة الأعلى قيمة");
    expect(ar).toContain("سوقان يعملان لك من رابط واحد");
    expect(ar).toContain("كيت التوظيف — قوالب رسائل جاهزة");
    expect(ar).toContain("رسالة إنستجرام مباشرة لمدرب");
    expect(ar).toContain("مرحبًا [اسم المدرب]");
    expect(ar).toContain("(إفصاح: هذا رابط أفلييت — قد أكسب عمولة على عمليات الشراء المؤهلة.)");
    expect(ar).toContain("تذكير الأمانة: لا تُضف وعودًا بأرقام دخل أو أي ضمانات");
    // locale-aware links (SEO-GEO-4)
    expect(ar).toContain('href="/ar/for-coaches"');
    expect(ar).toContain('href="/ar/memberships"');
    expect(ar).toContain('href="/ar/coaching"');
  });

  it("exactly THREE kit product links render per language (the matrix row — no more)", () => {
    for (const [html, prefix] of [
      [en, ""],
      [ar, "/ar"],
    ] as const) {
      for (const dest of ["for-coaches", "memberships", "coaching"]) {
        const matches = html.match(
          new RegExp(`href="${prefix}/${dest}"`, "g"),
        );
        expect(
          matches?.length ?? 0,
          `${prefix || "en"}/${dest}: expected exactly 1 kit link, found ${matches?.length ?? 0}`,
        ).toBe(1);
      }
    }
  });

  it("P0-E guest surface preserved: the crawlable CTAs default to /auth?mode=signup (4 links)", () => {
    // 3 state-dependent CTAs (hero primary + hero secondary + final)
    // + the promo-toolkit guest link — all crawlable <a href> in the
    // guest default (the P0-E conversions, untouched by P1-G).
    expect((en.match(/href="\/auth\?mode=signup"/g) || []).length).toBe(4);
    expect((ar.match(/href="\/auth\?mode=signup"/g) || []).length).toBe(4);
  });

  it("the outreach template numbers render (arithmetic from the governing constants)", () => {
    const text = textOnly(en);
    expect(text).toContain("$3.00");
    expect(text).toContain("$8.00");
    expect(text).toContain("$1.20");
    expect(text).toContain("$3.20");
    expect(text).toContain("$14.99");
    expect(text).toContain("$39.99");
    expect(text).toContain("$10");
    expect(text).toContain("30-day");
    const arText = textOnly(ar);
    expect(arText).toContain("3.00$");
    expect(arText).toContain("8.00$");
    expect(arText).toContain("1.20$");
    expect(arText).toContain("3.20$");
    expect(arText).toContain("(6$)");
    expect(arText).toContain("(16$)");
  });
});
