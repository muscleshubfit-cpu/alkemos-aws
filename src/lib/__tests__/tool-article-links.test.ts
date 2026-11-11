/**
 * TOOL ↔ ARTICLE CONTEXTUAL LINKING canaries (Report 15 §5-B1, owner
 * execution order 2026-11-12 «ابدأ التنفيذ للخطة»).
 *
 * The pair source is src/lib/tool-article-links.ts (pure data + lookups).
 * These tests lock the Report-15 §5-B1 acceptance contract:
 *
 *   (1) every tool has ≥2 contextual article links (both languages);
 *   (2) ZERO links to a non-published article — pinned against the
 *       committed live-sitemap snapshot fixture (append-only corpus);
 *   (3) ZERO links to a non-existent tool ROUTE — pinned against the
 *       real route tree (filesystem check);
 *   (4) anti-spam: no article is linked twice in the same language;
 *   (5) the tool-surface MSA law: Arabic anchors/blurbs carry zero bare
 *       Latin tokens;
 *   (6) hrefs are locale-native (AR mirrors get /ar hrefs);
 *   (7) the eight tool pages actually RENDER the strip (source pin).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  TOOL_ARTICLE_PAIRS,
  TOOL_ARTICLE_PAIRS_COUNT,
  PAIRED_TOOL_SLUGS,
  toolHref,
  articleLinksForTool,
  toolLinksForArticle,
} from "../tool-article-links";
import { TOOLS, TOOLS_COUNT } from "@/lib/tools-shared";

const ROOT = join(__dirname, "../../..");
const FIXTURE = JSON.parse(
  readFileSync(
    join(__dirname, "fixtures/tool-article-links.published-slugs.json"),
    "utf-8",
  ),
) as { en: string[]; ar: string[] };

const LATIN = /[A-Za-z]/;

/** The 8 tool page sources (EN root; /ar mirrors re-export them). */
const TOOL_PAGE_SOURCES: Record<string, string> = {
  "calorie-calculator": "src/app/(en)/tools/calorie-calculator/page.tsx",
  "bmi-calculator": "src/app/(en)/tools/bmi-calculator/page.tsx",
  "macro-calculator": "src/app/(en)/tools/macro-calculator/page.tsx",
  "body-fat-calculator": "src/app/(en)/tools/body-fat-calculator/page.tsx",
  "water-tracker": "src/app/(en)/tools/water-tracker/page.tsx",
  "/meal-planner": "src/app/(en)/meal-planner/page.tsx",
  "/ai-meal-planner": "src/app/(en)/ai-meal-planner/page.tsx",
  "/ai-workout-planner": "src/app/(en)/ai-workout-planner/page.tsx",
};

describe("tool-article-links — structural pins", () => {
  it("derived count matches the array (library-counts pattern)", () => {
    expect(TOOL_ARTICLE_PAIRS_COUNT).toBe(TOOL_ARTICLE_PAIRS.length);
  });

  it("every toolSlug is one of the 8 real tools (tools-shared slug space)", () => {
    const hubSlugs = new Set(TOOLS.map((t) => t.slug));
    expect(TOOLS_COUNT).toBe(8);
    for (const p of TOOL_ARTICLE_PAIRS) {
      expect(
        hubSlugs.has(p.toolSlug),
        `unknown toolSlug ${p.toolSlug} — not in tools-shared.ts`,
      ).toBe(true);
    }
    // PAIRED_TOOL_SLUGS covers the whole hub (every tool participates).
    expect([...PAIRED_TOOL_SLUGS].sort()).toEqual([...hubSlugs].sort());
  });

  it("every tool route actually exists in the route tree", () => {
    for (const [slug, rel] of Object.entries(TOOL_PAGE_SOURCES)) {
      expect(existsSync(join(ROOT, rel)), `${rel} missing`).toBe(true);
    }
  });

  it("(1) every tool has ≥2 contextual article pairs", () => {
    for (const slug of PAIRED_TOOL_SLUGS) {
      const n = articleLinksForTool(slug).length;
      expect(n, `${slug} has ${n} pairs — the floor is 2`).toBeGreaterThanOrEqual(2);
    }
  });

  it("(2) ZERO links to a non-published article — pinned to the live-sitemap snapshot", () => {
    const en = new Set(FIXTURE.en);
    const ar = new Set(FIXTURE.ar);
    for (const p of TOOL_ARTICLE_PAIRS) {
      expect(
        en.has(p.articleSlugEn),
        `EN article "${p.articleSlugEn}" is not in the published snapshot`,
      ).toBe(true);
      expect(
        ar.has(p.articleSlugAr),
        `AR article "${p.articleSlugAr}" is not in the published snapshot`,
      ).toBe(true);
    }
  });

  it("(4) anti-spam: no article is linked twice in the same language", () => {
    const enSlugs = TOOL_ARTICLE_PAIRS.map((p) => p.articleSlugEn);
    const arSlugs = TOOL_ARTICLE_PAIRS.map((p) => p.articleSlugAr);
    expect(new Set(enSlugs).size).toBe(enSlugs.length);
    expect(new Set(arSlugs).size).toBe(arSlugs.length);
  });

  it("(5) MSA law: Arabic anchors and blurbs carry zero bare Latin", () => {
    for (const p of TOOL_ARTICLE_PAIRS) {
      expect(LATIN.test(p.anchorAr), `Latin in AR anchor: ${p.anchorAr}`).toBe(false);
      expect(LATIN.test(p.blurbAr), `Latin in AR blurb: ${p.blurbAr}`).toBe(false);
    }
  });

  it("anchors are natural phrases, not keyword stubs (≥2 words each language)", () => {
    for (const p of TOOL_ARTICLE_PAIRS) {
      expect(p.anchorEn.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
      expect(p.anchorAr.trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
      expect(p.anchorEn.length).toBeGreaterThan(8);
      expect(p.anchorAr.length).toBeGreaterThan(8);
    }
  });
});

describe("tool-article-links — href laws", () => {
  it("(6) locale-native tool hrefs for both slug spaces", () => {
    expect(toolHref("calorie-calculator", "en")).toBe("/tools/calorie-calculator");
    expect(toolHref("calorie-calculator", "ar")).toBe("/ar/tools/calorie-calculator");
    expect(toolHref("/meal-planner", "en")).toBe("/meal-planner");
    expect(toolHref("/meal-planner", "ar")).toBe("/ar/meal-planner");
    expect(toolHref("/ai-workout-planner", "ar")).toBe("/ar/ai-workout-planner");
  });

  it("articleLinksForTool returns ONLY that tool's pairs, in declaration order", () => {
    const calorie = articleLinksForTool("calorie-calculator");
    expect(calorie.length).toBe(3);
    expect(calorie.every((p) => p.toolSlug === "calorie-calculator")).toBe(true);
    expect(articleLinksForTool("no-such-tool")).toEqual([]);
  });

  it("toolLinksForArticle — the retro leg resolves for both languages", () => {
    const en = toolLinksForArticle("calculate-daily-calories-fuel-fat-loss-bulking", "en");
    expect(en).toHaveLength(1);
    expect(en[0].href).toBe("/tools/calorie-calculator");
    expect(en[0].name).toBe("Calorie Calculator");

    const ar = toolLinksForArticle("calculate-daily-calories-weight-loss", "ar");
    expect(ar).toHaveLength(1);
    expect(ar[0].href).toBe("/ar/tools/calorie-calculator");
    expect(LATIN.test(ar[0].name)).toBe(false); // the AR name is Arabic-only
    expect(LATIN.test(en[0].name)).toBe(true); // the EN name is Latin

    expect(toolLinksForArticle("never-published-slug", "en")).toEqual([]);
    expect(toolLinksForArticle("never-published-slug", "ar")).toEqual([]);
  });

  it("every retro-leg entry points at an existing tool route", () => {
    for (const p of TOOL_ARTICLE_PAIRS) {
      for (const lang of ["en", "ar"] as const) {
        const entries = toolLinksForArticle(
          lang === "en" ? p.articleSlugEn : p.articleSlugAr,
          lang,
        );
        expect(entries).toHaveLength(1);
        expect(TOOL_PAGE_SOURCES[entries[0].toolSlug ?? ""]).toBeDefined();
      }
    }
  });
});

describe("tool-article-links — the eight tool pages render the strip (source pin)", () => {
  it("(7) every tool page imports and renders <ToolArticleLinks> with its slug", () => {
    for (const [slug, rel] of Object.entries(TOOL_PAGE_SOURCES)) {
      const src = readFileSync(join(ROOT, rel), "utf-8");
      expect(
        src.includes('from "@/components/ToolArticleLinks"'),
        `${rel} does not import ToolArticleLinks`,
      ).toBe(true);
      expect(
        src.includes(`<ToolArticleLinks toolSlug="${slug}" />`),
        `${rel} does not render the strip with toolSlug="${slug}"`,
      ).toBe(true);
    }
  });

  it("the two blog article routes pass the retro leg (source pin)", () => {
    for (const rel of [
      "src/app/(en)/blog/[slug]/page.tsx",
      "src/app/(ar)/ar/blog/[slug]/page.tsx",
    ]) {
      const src = readFileSync(join(ROOT, rel), "utf-8");
      expect(src.includes("toolLinksForArticle")).toBe(true);
      expect(src.includes("toolCta")).toBe(true);
    }
  });

  it("BlogArticlePage accepts and renders the retro strip (source pin)", () => {
    const src = readFileSync(
      join(ROOT, "src/components/blog/BlogArticlePage.tsx"),
      "utf-8",
    );
    expect(src.includes("toolCta?:")).toBe(true);
    expect(src.includes("toolCta && toolCta.length > 0")).toBe(true);
    // The reverse strip links only via <a href> (crawlable, no JS gate).
    expect(src.includes('href={t.href}')).toBe(true);
  });
});
