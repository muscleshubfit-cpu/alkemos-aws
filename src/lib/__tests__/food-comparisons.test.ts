import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { FOOD_COMPARISONS, getFoodComparisonBySlug } from "@/lib/food-comparisons";
import { getFoodBySlug } from "@/lib/foods";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";

/**
 * FOOD COMPARISONS canaries — SEO-GROWTH-P4 pilot (owner order
 * 2026-11-05 «اختبار محدود قابل للقياس… اجعل جودة المعلومات والتفرد
 * والفائدة أهم من عدد الكلمات»), guarding audit 03 §6's eight
 * mandatory quality gates for this new family:
 *
 *   1. DEPTH: ≥180 unique words per language per pair (the foods-family
 *      bar; measured — every pilot page clears it with margin).
 *   2. TEMPLATE SIMILARITY: pairwise Jaccard within the family ≤ the
 *      measured ceiling (pinned below at the observed max + safety).
 *   3. AR PURITY: the Arabic copy passes the site's Latin-contamination
 *      scanner (numbers/units allowed; no Latin prose).
 *   4. TITLES: EN ≤75; AR ≤75 COMPOSED (title + the /ar layout's
 *      " — Alkemos" template append).
 *   5. DESCRIPTIONS: ≤160 both languages.
 *   6. FAQ: 2-4 real questions per pair, bilingual.
 *   7. INTERNAL LINKS: ≥3 per page (both food pages + the foods hub +
 *      the contextual tool — verified on the ROUTE SOURCE).
 *   8. DATA TRUTH: every per100g number equals the FOODS row; every
 *      serving number equals per100g × defaultGrams ÷ 100 (rounded
 *      0.1); proteinPer100kcal = protein × 100 ÷ calories.
 *
 * Plus the family-scope law (updated batch 3, 2026-11-05): ONLY curated
 * (tags>0) foods may join a pair — enforced by the module's own curated()
 * guard, pinned here; and the sitemap family law: all 20 URLs present in
 * sitemap-comparisons.xml (10 pairs × 2 mirrors).
 */

const EN_PAGE = "src/app/(en)/foods/compare/[slug]/page.tsx";
const AR_PAGE = "src/app/(ar)/ar/foods/compare/[slug]/page.tsx";
const SITEMAP = "src/app/sitemap-comparisons.xml/route.ts";
const AR_TEMPLATE_APPEND = " — Alkemos".length;

function flatten(c: (typeof FOOD_COMPARISONS)[number], lang: "en" | "ar"): string {
  const parts = [lang === "en" ? c.introEn : c.introAr];
  for (const v of c.verdicts) {
    parts.push(v.heading[lang]);
    parts.push(v.body[lang]);
  }
  for (const f of c.faqs) {
    parts.push(f.q[lang]);
    parts.push(f.a[lang]);
  }
  return parts.join(" ");
}

function uniqueWords(t: string): Set<string> {
  return new Set(t.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
}

function jaccard(a: string, b: string): number {
  const A = uniqueWords(a);
  const B = uniqueWords(b);
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

describe("food-comparisons family (SEO-GROWTH-P4 — audit 03 §6 gates)", () => {
  it(
    "the family stays at the plan's Phase-1 first-ten: 10 pairs — batch 2's 4-pair pilot + batch 3's six (owner order 2026-11-05 «استكمل الأعمال المؤجلة ذات الأولوية… لا تنتظر نتائج Google») — the 40-90 expansion stays D-2/demand-gated",
    () => {
      expect(FOOD_COMPARISONS).toHaveLength(10);
      expect(FOOD_COMPARISONS.map((c) => c.slug)).toEqual([
        "banana-vs-apple",
        "tuna-vs-chicken-breast",
        "white-rice-vs-brown-rice",
        "greek-yogurt-vs-cottage-cheese",
        "oatmeal-vs-white-rice",
        "eggs-vs-egg-whites",
        "tofu-vs-chicken-breast",
        "olive-oil-vs-coconut-oil",
        "dates-vs-banana",
        "lentils-vs-chickpeas",
      ]);
    },
  );

  it("GATE 1 — depth: ≥180 unique words per language per pair", () => {
    for (const c of FOOD_COMPARISONS) {
      expect(uniqueWords(flatten(c, "en")).size, `${c.slug} EN`).toBeGreaterThanOrEqual(180);
      expect(uniqueWords(flatten(c, "ar")).size, `${c.slug} AR`).toBeGreaterThanOrEqual(180);
    }
  });

  it("GATE 2 — template similarity: pairwise Jaccard stays under the measured ceiling", () => {
    // Measured on the shipped family (2026-11-05, batches 2+3): max
    // pairwise Jaccard EN 0.141 / AR 0.152 (batch-2 pilot) — the batch-3
    // six keep the same style ceiling, pinned at 0.22 with margin (the
    // P1-1/P1-2 law style: the canary pins the observed value, not an
    // aspiration).
    for (let i = 0; i < FOOD_COMPARISONS.length; i++) {
      for (let j = i + 1; j < FOOD_COMPARISONS.length; j++) {
        const je = jaccard(flatten(FOOD_COMPARISONS[i], "en"), flatten(FOOD_COMPARISONS[j], "en"));
        const ja = jaccard(flatten(FOOD_COMPARISONS[i], "ar"), flatten(FOOD_COMPARISONS[j], "ar"));
        expect(je, `${FOOD_COMPARISONS[i].slug}~${FOOD_COMPARISONS[j].slug} EN`).toBeLessThan(0.22);
        expect(ja, `${FOOD_COMPARISONS[i].slug}~${FOOD_COMPARISONS[j].slug} AR`).toBeLessThan(0.22);
      }
    }
  });

  it("GATE 3 — Arabic purity: no Latin prose contamination, MSA-clean", () => {
    for (const c of FOOD_COMPARISONS) {
      const text = flatten(c, "ar");
      const latin = scanLatinContamination(text);
      expect(latin.count, `${c.slug} latin contamination: ${latin.tokens.join(",")}`).toBe(0);
      const dialect = scanArabicDialect(text);
      expect(dialect.strong, `${c.slug} strong dialect markers`).toBe(0);
    }
  });

  it("GATE 4 — titles: EN ≤75 raw; AR ≤75 composed with the template append", () => {
    for (const c of FOOD_COMPARISONS) {
      expect(c.titleEn.length, `${c.slug} titleEn`).toBeLessThanOrEqual(75);
      expect(c.titleAr.length + AR_TEMPLATE_APPEND, `${c.slug} titleAr composed`).toBeLessThanOrEqual(75);
      // The AR title is QUESTION-SHAPED (audit §4.1 law for the AR surface).
      expect(c.titleAr).toContain("؟");
    }
  });

  it("GATE 5 — descriptions: ≤160 in both languages", () => {
    for (const c of FOOD_COMPARISONS) {
      expect(c.descriptionEn.length, `${c.slug} descEn`).toBeLessThanOrEqual(160);
      expect(c.descriptionAr.length, `${c.slug} descAr`).toBeLessThanOrEqual(160);
    }
  });

  it("GATE 6 — FAQ: 2-4 real bilingual questions per pair", () => {
    for (const c of FOOD_COMPARISONS) {
      expect(c.faqs.length, `${c.slug}`).toBeGreaterThanOrEqual(2);
      expect(c.faqs.length, `${c.slug}`).toBeLessThanOrEqual(4);
      for (const f of c.faqs) {
        expect(f.q.en.length).toBeGreaterThan(10);
        expect(f.q.ar.length).toBeGreaterThan(10);
        expect(f.a.en.length).toBeGreaterThan(60);
        expect(f.a.ar.length).toBeGreaterThan(60);
      }
    }
  });

  it("GATE 7 — internal links: both food pages + the foods hub + the contextual tool", () => {
    const enSrc = readFileSync(EN_PAGE, "utf8");
    expect(enSrc).toContain("/foods/${foodA.slug}");
    expect(enSrc).toContain("/foods/${foodB.slug}");
    expect(enSrc).toContain(`href="/foods"`);
    expect(enSrc).toContain("/tools/${comparison.toolSlug}");
    // Schema law: the pages emit ItemList + Breadcrumb ONLY — no
    // FAQPage SCHEMA call may appear (comments explaining the law are
    // fine; an actual schema emission is not).
    for (const p of [EN_PAGE, AR_PAGE]) {
      const src = readFileSync(p, "utf8");
      expect(src).not.toContain('"@type": "FAQPage"');
      expect(src).not.toContain('"@type":"FAQPage"');
    }
    const arSrc = readFileSync(AR_PAGE, "utf8");
    expect(arSrc).toContain(`href="/ar/foods"`);
    expect(arSrc).toContain("/ar/tools/${comparison.toolSlug}");
    expect(arSrc).toContain("/ar/foods/${foodA.slug}");
    expect(arSrc).toContain("/ar/foods/${foodB.slug}");
  });

  it("GATE 8 — data truth: every number derives from the FOODS rows", () => {
    for (const c of FOOD_COMPARISONS) {
      const a = getFoodBySlug(c.aSlug);
      const b = getFoodBySlug(c.bSlug);
      expect(a, c.aSlug).toBeDefined();
      expect(b, c.bSlug).toBeDefined();
      // Curated-only law (audit §4.2: both items enriched first).
      expect((a!.tags?.length ?? 0), `${c.aSlug} curated`).toBeGreaterThan(0);
      expect((b!.tags?.length ?? 0), `${c.bSlug} curated`).toBeGreaterThan(0);

      for (const [n, food] of [
        [c.a, a!],
        [c.b, b!],
      ] as const) {
        expect(n.per100g).toEqual(food.per100g);
        expect(n.servingGrams).toBe(food.defaultGrams);
        const r = (x: number) => Math.round(x * 10) / 10;
        expect(n.serving.calories).toBe(r((food.per100g.calories * food.defaultGrams) / 100));
        expect(n.serving.protein).toBe(r((food.per100g.protein * food.defaultGrams) / 100));
        expect(n.serving.carbs).toBe(r((food.per100g.carbs * food.defaultGrams) / 100));
        expect(n.serving.fat).toBe(r((food.per100g.fat * food.defaultGrams) / 100));
        expect(n.proteinPer100kcal).toBe(
          Math.round(((food.per100g.protein * 100) / food.per100g.calories) * 10) / 10,
        );
      }
    }
  });

  it("the copy interpolates the DERIVED numbers (answer-first honesty)", () => {
    const bananaApple = getFoodComparisonBySlug("banana-vs-apple")!;
    // The intro's direct answer must carry the real per-100g calories.
    expect(bananaApple.introEn).toContain(`${bananaApple.a.per100g.calories} kcal`);
    expect(bananaApple.introEn).toContain(`${bananaApple.b.per100g.calories} kcal`);

    const tunaChicken = getFoodComparisonBySlug("tuna-vs-chicken-breast")!;
    expect(tunaChicken.introEn).toContain(`${tunaChicken.a.proteinPer100kcal}g of protein per 100 kcal`);
    expect(tunaChicken.introEn).toContain(`${tunaChicken.b.proteinPer100kcal}g`);
  });

  it("sitemap-comparisons advertises all 20 family URLs (10 pairs × 2 mirrors) with the hreflang pair", () => {
    const src = readFileSync(SITEMAP, "utf8");
    expect(src).toContain("FOOD_COMPARISONS");
    // The URLs are template-built (${base}/foods/compare/${fc.slug}) —
    // assert the emitted patterns for both languages + alternates.
    expect(src).toContain("/foods/compare/${fc.slug}");
    expect(src).toContain("/ar/foods/compare/${fc.slug}");
    expect(src).toContain("en: `${base}/foods/compare/${fc.slug}`");
    expect(src).toContain("ar: `${base}/ar/foods/compare/${fc.slug}`");
  });

  it("routes: both pages export static params + reciprocal hreflang clusters", () => {
    for (const p of [EN_PAGE, AR_PAGE]) {
      const src = readFileSync(p, "utf8");
      expect(src).toContain("generateStaticParams");
      expect(src).toContain("canonical: url");
      expect(src).toContain('"x-default"');
    }
    // EN declares ar twin; AR declares en twin (reciprocal pair).
    expect(readFileSync(EN_PAGE, "utf8")).toContain("ar: `https://alkemos.com/ar/foods/compare/");
    expect(readFileSync(AR_PAGE, "utf8")).toContain("en: `https://alkemos.com/foods/compare/");
  });

  it("publishedAt is the stable family ship date (W1-1 law — never bump)", () => {
    // Batches 2 and 3 both ship 2026-11-05 — the first-publish date stays
    // truthful and identical for the whole family.
    for (const c of FOOD_COMPARISONS) expect(c.publishedAt).toBe("2026-11-05");
  });
});
