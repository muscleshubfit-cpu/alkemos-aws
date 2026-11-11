/**
 * ToolArticleLinks SSR-HTML canary (Report 15 §5-B1) — the crawlable-HTML
 * proof for the guide strip, complementing the source pins in
 * tool-article-links.test.ts. Uses the repo's share-url.test.tsx precedent
 * (renderToStaticMarkup inside I18nProvider): the EN and AR renders are
 * exactly what the server puts in the initial HTML a crawler sees —
 * plain <a href> cards, locale-native hrefs, zero bare Latin in the
 * Arabic render (tool-surface MSA law).
 */
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "@/lib/i18n";
import { ToolArticleLinks } from "@/components/ToolArticleLinks";

// I18nProvider is a client component — under vitest there is no Next
// router, so the navigation seam is stubbed (the share-url.test.tsx
// precedent, same provider): usePathname() null-tolerated by the
// provider itself.
vi.mock("next/navigation", () => ({
  usePathname: () => null,
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {}, prefetch: () => {}, back: () => {} }),
}));

function ssr(toolSlug: string, lang: "en" | "ar"): string {
  // The provider TYPE declares children as a required prop (the
  // share-url.test.tsx precedent — children-in-props with a scoped
  // lint exemption on exactly that line).
  return renderToStaticMarkup(
    // eslint-disable-next-line react/no-children-prop -- the provider props TYPE declares children as a required prop (the share-url.test.tsx precedent; test-only render)
    createElement(I18nProvider, {
      urlLocale: lang,
      children: createElement(ToolArticleLinks, { toolSlug }),
    }),
  );
}

const LATIN = /[A-Za-z]/;

describe("ToolArticleLinks SSR HTML (B1 forward leg — EN/AR server render)", () => {
  it("EN render: every calorie-calculator pair is a plain <a href=\"/blog/…\"> card", () => {
    const html = ssr("calorie-calculator", "en");
    expect(html).toContain('href="/blog/calculate-daily-calories-fuel-fat-loss-bulking"');
    expect(html).toContain('href="/blog/calculate-maintenance-calories-muscle-gain"');
    expect(html).toContain('href="/blog/calorie-cycling-fat-loss-diet"');
    expect(html).toContain("How many calories should I eat to lose weight?");
    // the crawlable anchor count for this tool (plan floor: ≥2)
    expect((html.match(/href="\/blog\//g) || []).length).toBe(3);
  });

  it("AR render: locale-native hrefs (/ar/blog/…) and ZERO bare Latin on the strip", () => {
    const html = ssr("calorie-calculator", "ar");
    expect(html).toContain('href="/ar/blog/calculate-daily-calories-weight-loss"');
    expect(html).toContain('href="/ar/blog/calculate-daily-calories-muscle-gain-beginners-guide"');
    expect(html).toContain('href="/ar/blog/calorie-cycling-fat-loss-guide"');
    expect((html.match(/href="\/ar\/blog\//g) || []).length).toBe(3);
    // AR strip text carries no Latin letters (MSA law on the tool surface).
    // The hrefs themselves are ASCII by design — assert over the card
    // TEXT layer only (strip the tags and the href attributes).
    const textOnly = html
      .replace(/<[^>]+>/g, " ") // drop all tags incl. attributes
      .replace(/\s+/g, " ")
      .trim();
    expect(LATIN.test(textOnly)).toBe(false);
    expect(textOnly).toContain("كم سعرة أحتاج يوميًا لخسارة الوزن؟");
  });

  it("AR render: a standalone-route tool links its /ar mirror hrefs", () => {
    const html = ssr("/ai-workout-planner", "ar");
    expect(html).toContain('href="/ar/blog/12-week-progressive-overload-intermediate-guide"');
    expect(html).toContain('href="/ar/blog/4-day-split-muscle-fat-loss-guide"');
    expect(html).toContain('href="/ar/blog/4-week-beginner-muscle-building-plan-guide"');
  });

  it("unknown toolSlug renders NOTHING (fail-quiet, never a broken section)", () => {
    expect(ssr("no-such-tool", "en")).toBe("");
    expect(ssr("no-such-tool", "ar")).toBe("");
  });

  it("every tool renders ≥2 crawlable article hrefs in BOTH languages", () => {
    const tools = [
      "calorie-calculator",
      "bmi-calculator",
      "macro-calculator",
      "body-fat-calculator",
      "water-tracker",
      "/meal-planner",
      "/ai-meal-planner",
      "/ai-workout-planner",
    ];
    for (const t of tools) {
      const en = ssr(t, "en");
      const ar = ssr(t, "ar");
      expect((en.match(/href="\/blog\//g) || []).length, `${t} EN`).toBeGreaterThanOrEqual(2);
      expect((ar.match(/href="\/ar\/blog\//g) || []).length, `${t} AR`).toBeGreaterThanOrEqual(2);
    }
  });
});
