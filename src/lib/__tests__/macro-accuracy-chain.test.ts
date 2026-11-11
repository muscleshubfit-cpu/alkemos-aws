import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GET as pagesSitemapGET } from "@/app/sitemap-pages.xml/route";
import { FOODS } from "@/lib/foods";
import { FOODS_COUNT } from "@/lib/foods-shared";
import {
  MACRO_ACCURACY_CHAIN_LINKS,
  MACRO_ACCURACY_GUIDE_FAQ_AR,
  MACRO_ACCURACY_GUIDE_FAQ_EN,
  MACRO_ACCURACY_GUIDE_SECTIONS,
} from "@/lib/macro-accuracy-guide";
import {
  FOODS_CITATION_FORMATS,
  FOODS_METHODOLOGY_CHAIN_LINKS,
  FOODS_METHODOLOGY_FAQ_AR,
  FOODS_METHODOLOGY_FAQ_EN,
  FOODS_METHODOLOGY_SECTIONS,
  foodsMethodologyStats,
} from "@/lib/foods-methodology";
import { SEARCH_INTENT_MAP, findBlogIntentCollision } from "@/lib/intent-map";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";

/**
 * MACRO-ACCURACY CHAIN LAW (Phase 318 — P1-8, owner order 2026-10-01
 * «ابدأ تنفيذ البند التالى»): the content chain «دقة تتبع الماكروز» +
 * the food-database methodology reference. Guarded contracts:
 *
 *   1. BILINGUAL PARITY — every section exists in EN and AR with the
 *      same paragraph counts; every FAQ pair has an equal-length twin.
 *   2. MSA LAW (175/176 applied to the new surface): the Arabic copy
 *      carries no dialect markers and no non-gloss Latin contamination.
 *   3. THE CHAIN WIRING — the guide interlinks methodology → foods →
 *      tools → comparison; the methodology page interlinks back; the
 *      intent map registers both canonicals (blog-gate protection); the
 *      sitemap advertises all four URLs with hreflang pairs.
 *   4. CITATION ANCHORS — the 8,830 food pages + the foods hub cite the
 *      methodology surface (the wiring that makes the reference
 *      link-worthy); the macro-tracker landing routes to the guide.
 *   5. NUMBER LAW — the guide cites FOODS_COUNT (data-driven, never a
 *      hardcoded literal); the methodology stats computed from the
 *      shipped FOODS array match the documented Phase-141 audit split
 *      (80 curated / 8,750 long tail) and stay self-consistent.
 */

const AR_RUN = /[\u0600-\u06FF]/;

function repo(rel: string): string {
  return resolve(__dirname, "../../..", rel);
}

describe("P1-8 content — bilingual parity", () => {
  it("guide sections: EN/AR twins with equal paragraph counts", () => {
    expect(MACRO_ACCURACY_GUIDE_SECTIONS.length).toBeGreaterThanOrEqual(6);
    for (const s of MACRO_ACCURACY_GUIDE_SECTIONS) {
      expect(s.headingEn.length, `${s.id} headingEn empty`).toBeGreaterThan(0);
      expect(AR_RUN.test(s.headingAr), `${s.id} headingAr not Arabic`).toBe(true);
      expect(s.paragraphsEn.length, `${s.id} EN paragraphs thin`).toBeGreaterThanOrEqual(2);
      expect(s.paragraphsAr.length, `${s.id} AR paragraphs differ from EN`).toBe(s.paragraphsEn.length);
    }
  });

  it("methodology sections: EN/AR twins with equal paragraph counts", () => {
    expect(FOODS_METHODOLOGY_SECTIONS.length).toBeGreaterThanOrEqual(6);
    for (const s of FOODS_METHODOLOGY_SECTIONS) {
      expect(s.headingEn.length, `${s.id} headingEn empty`).toBeGreaterThan(0);
      expect(AR_RUN.test(s.headingAr), `${s.id} headingAr not Arabic`).toBe(true);
      expect(s.paragraphsEn.length, `${s.id} EN paragraphs thin`).toBeGreaterThanOrEqual(2);
      expect(s.paragraphsAr.length, `${s.id} AR paragraphs differ from EN`).toBe(s.paragraphsEn.length);
    }
  });

  it("FAQ pairs: equal EN/AR counts, ≥6 questions each, answered", () => {
    expect(MACRO_ACCURACY_GUIDE_FAQ_EN.length).toBe(MACRO_ACCURACY_GUIDE_FAQ_AR.length);
    expect(MACRO_ACCURACY_GUIDE_FAQ_EN.length).toBeGreaterThanOrEqual(6);
    expect(FOODS_METHODOLOGY_FAQ_EN.length).toBe(FOODS_METHODOLOGY_FAQ_AR.length);
    expect(FOODS_METHODOLOGY_FAQ_EN.length).toBeGreaterThanOrEqual(6);
    for (const faq of [...MACRO_ACCURACY_GUIDE_FAQ_EN, ...FOODS_METHODOLOGY_FAQ_EN]) {
      expect(faq.a.length, `thin answer: ${faq.q}`).toBeGreaterThan(120);
    }
  });

  it("no CJK anywhere in the bilingual copy", () => {
    const all = JSON.stringify([
      MACRO_ACCURACY_GUIDE_SECTIONS,
      MACRO_ACCURACY_GUIDE_FAQ_EN,
      MACRO_ACCURACY_GUIDE_FAQ_AR,
      FOODS_METHODOLOGY_SECTIONS,
      FOODS_METHODOLOGY_FAQ_EN,
      FOODS_METHODOLOGY_FAQ_AR,
    ]);
    expect(all).not.toMatch(/[\u3040-\u30FF\u4E00-\u9FFF]/);
  });
});

describe("P1-8 content — MSA law on the new Arabic surface", () => {
  // Slots are CODE placeholders (fill at render) — fill them with the real
  // numbers before scanning so the scanner sees the rendered copy.
  const SLOTS: Record<string, string> = {
    total: FOODS_COUNT.toLocaleString("en-US"),
    curated: "80",
    longTail: "8,750",
    arabized: "2,489",
    categories: "9",
  };
  const fill = (s: string) => s.replace(/\{(total|curated|longTail|arabized|categories)\}/g, (_, k) => SLOTS[k as string]);

  const arCorpusGuide = MACRO_ACCURACY_GUIDE_SECTIONS
    .flatMap((s) => [s.headingAr, ...s.paragraphsAr]).map(fill).join("\n")
    + "\n" + MACRO_ACCURACY_GUIDE_FAQ_AR.map((f) => `${f.q}\n${f.a}`).join("\n");
  const arCorpusMethodology = FOODS_METHODOLOGY_SECTIONS
    .flatMap((s) => [s.headingAr, ...s.paragraphsAr]).map(fill).join("\n")
    + "\n" + FOODS_METHODOLOGY_FAQ_AR.map((f) => `${f.q}\n${f.a}`).join("\n");

  it("guide AR copy: no dialect markers (scanArabicDialect strong hits = 0)", () => {
    const scan = scanArabicDialect(arCorpusGuide);
    expect(scan.strongHits, `dialect leaked: ${JSON.stringify(scan.strongHits.slice(0, 3))}`).toHaveLength(0);
  });

  it("methodology AR copy: no dialect markers", () => {
    const scan = scanArabicDialect(arCorpusMethodology);
    expect(scan.strongHits, `dialect leaked: ${JSON.stringify(scan.strongHits.slice(0, 3))}`).toHaveLength(0);
  });

  it("guide AR copy: no Latin contamination outside glosses/brands", () => {
    const scan = scanLatinContamination(arCorpusGuide);
    expect(scan.count, `bare Latin tokens: ${scan.tokens.join(", ")}`).toBe(0);
  });

  it("methodology AR copy: no Latin contamination outside glosses/brands", () => {
    const scan = scanLatinContamination(arCorpusMethodology);
    expect(scan.count, `bare Latin tokens: ${scan.tokens.join(", ")}`).toBe(0);
  });

  it("citation formats: the deliberate English reference strings live in FOODS_CITATION_FORMATS (data, not AR prose)", () => {
    expect(FOODS_CITATION_FORMATS.databaseEn).toContain("https://alkemos.com/foods");
    expect(FOODS_CITATION_FORMATS.singleFoodEn).toContain("chicken-breast");
    expect(FOODS_CITATION_FORMATS.databaseAr).toContain("https://alkemos.com/ar/foods");
    // The AR prose no longer embeds the English formats (the block renders them).
    for (const s of FOODS_METHODOLOGY_SECTIONS) {
      if (s.id !== "cite") continue;
      for (const p of s.paragraphsAr) {
        expect(p).not.toContain("Alkemos Food Database");
      }
    }
    // Both pages render the block.
    const enPage = readFileSync(repo("src/app/(en)/foods/methodology/page.tsx"), "utf8");
    const arPage = readFileSync(repo("src/app/(ar)/ar/foods/methodology/page.tsx"), "utf8");
    expect(enPage).toContain("FOODS_CITATION_FORMATS.databaseEn");
    expect(arPage).toContain("FOODS_CITATION_FORMATS.databaseEn");
  });
});

describe("P1-8 chain wiring — the interlink network", () => {
  it("the guide chain covers reference + database + tools + comparison (both locales)", () => {
    const hrefsEn = MACRO_ACCURACY_CHAIN_LINKS.map((l) => l.hrefEn);
    expect(hrefsEn).toContain("/foods/methodology");
    expect(hrefsEn).toContain("/foods");
    expect(hrefsEn).toContain("/macro-tracker");
    expect(hrefsEn).toContain("/tools/macro-calculator");
    expect(hrefsEn).toContain("/meal-planner");
    expect(hrefsEn).toContain("/compare/alkemos-vs-cronometer");
    for (const l of MACRO_ACCURACY_CHAIN_LINKS) {
      expect(l.hrefAr).toBe(`/ar${l.hrefEn}`);
    }
  });

  it("the methodology chain links back: database + guide + planner + terms", () => {
    const hrefsEn = FOODS_METHODOLOGY_CHAIN_LINKS.map((l) => l.hrefEn);
    expect(hrefsEn).toContain("/foods");
    expect(hrefsEn).toContain("/guides/macro-tracking-accuracy");
    expect(hrefsEn).toContain("/meal-planner");
    expect(hrefsEn).toContain("/terms");
    for (const l of FOODS_METHODOLOGY_CHAIN_LINKS) {
      expect(l.hrefAr).toBe(`/ar${l.hrefEn}`);
    }
  });

  it("intent map owns both new canonicals with EN + AR head queries (blog-gate protection)", () => {
    const guide = SEARCH_INTENT_MAP.find((e) => e.cluster === "macro-accuracy-guide");
    expect(guide?.canonical).toBe("/guides/macro-tracking-accuracy");
    const methodology = SEARCH_INTENT_MAP.find((e) => e.cluster === "food-data-methodology");
    expect(methodology?.canonical).toBe("/foods/methodology");
    for (const entry of [guide, methodology]) {
      expect(entry?.queries.some((q) => /[a-z]/i.test(q))).toBe(true);
      expect(entry?.queries.some((q) => AR_RUN.test(q))).toBe(true);
    }
    // The gate actually fires for a candidate article chasing the guide's
    // head query — the chain pages stay the intent's only canonical owner.
    const collision = findBlogIntentCollision("macro tracking accuracy");
    expect(collision?.entry.canonical).toBe("/guides/macro-tracking-accuracy");
  });

  it("sitemap-pages advertises all four chain URLs with hreflang pairs", async () => {
    const res = await pagesSitemapGET();
    expect(res.status).toBe(200);
    const xml = await res.text();
    for (const loc of [
      "https://alkemos.com/guides/macro-tracking-accuracy",
      "https://alkemos.com/ar/guides/macro-tracking-accuracy",
      "https://alkemos.com/foods/methodology",
      "https://alkemos.com/ar/foods/methodology",
    ]) {
      expect(xml, `sitemap must contain ${loc}`).toContain(`<loc>${loc}</loc>`);
    }
    expect(xml).toMatch(
      /<loc>https:\/\/alkemos\.com\/guides\/macro-tracking-accuracy<\/loc>[\s\S]*?hreflang="ar"\s+href="https:\/\/alkemos\.com\/ar\/guides\/macro-tracking-accuracy"/,
    );
    expect(xml).toMatch(
      /<loc>https:\/\/alkemos\.com\/foods\/methodology<\/loc>[\s\S]*?hreflang="ar"\s+href="https:\/\/alkemos\.com\/ar\/foods\/methodology"/,
    );
  });

  it("citation anchors: every food page + the foods hub cite the methodology surface", () => {
    const detail = readFileSync(repo("src/app/(en)/foods/[slug]/FoodDetailClient.tsx"), "utf8");
    expect(detail).toContain('"/foods/methodology"');
    expect(detail).toContain('"/ar/foods/methodology"');
    const explorer = readFileSync(repo("src/components/foods/FoodsExplorer.tsx"), "utf8");
    expect(explorer).toContain('"/foods/methodology"');
    expect(explorer).toContain('"/ar/foods/methodology"');
  });

  it("the macro-tracker landing routes accuracy questions to the guide", () => {
    const tracker = readFileSync(repo("src/app/(en)/macro-tracker/page.tsx"), "utf8");
    expect(tracker).toContain('"/guides/macro-tracking-accuracy"');
    expect(tracker).toContain('"/ar/guides/macro-tracking-accuracy"');
  });

  it("the four route files exist (static segment beats /foods/[slug])", () => {
    for (const rel of [
      "src/app/(en)/guides/macro-tracking-accuracy/page.tsx",
      "src/app/(ar)/ar/guides/macro-tracking-accuracy/page.tsx",
      "src/app/(en)/foods/methodology/page.tsx",
      "src/app/(ar)/ar/foods/methodology/page.tsx",
    ]) {
      expect(readFileSync(repo(rel), "utf8").length, `${rel} missing`).toBeGreaterThan(0);
    }
  });
});

describe("P1-8 number law — data-driven figures only", () => {
  it("the guide's only inventory figure is FOODS_COUNT (rendered, not hardcoded)", () => {
    // The FAQ answer citing the count must contain the formatted count —
    // sourced from foods-shared at module scope, so the copy tracks data.
    const expected = FOODS_COUNT.toLocaleString("en-US");
    const citing = MACRO_ACCURACY_GUIDE_FAQ_EN.find((f) => f.q.includes("Where do Alkemos food values come from"));
    expect(citing?.a).toContain(expected);
    const citingAr = MACRO_ACCURACY_GUIDE_FAQ_AR.find((f) => f.q.includes("من أين تأتي قيم الأطعمة"));
    expect(citingAr?.a).toContain(expected);
  });

  it("methodology stats: computed from the shipped FOODS array, matching the Phase-141 audit split", () => {
    const stats = foodsMethodologyStats(FOODS, 9);
    expect(stats.total).toBe(FOODS.length);
    expect(stats.total).toBe(FOODS_COUNT);
    expect(stats.curated).toBe(80); // sitemap policy: tags.length > 0
    expect(stats.longTail).toBe(8750); // Phase-141 data audit
    expect(stats.arabized).toBe(stats.curated + 2458); // 80 core + 4 arabization batches (batch 4 = +49 GSC-demand rows, Report 15 §5-B2, 2026-11-12)
    expect(stats.total).toBe(stats.curated + stats.longTail);
  });
});
