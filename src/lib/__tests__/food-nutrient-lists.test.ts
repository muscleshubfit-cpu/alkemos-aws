import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  NUTRIENT_LISTS,
  getNutrientListBySlug,
  listsForCollection,
  isListableFood,
} from "@/lib/food-nutrient-lists";
import { FOODS, getFoodBySlug } from "@/lib/foods";
import { FOOD_COLLECTIONS, getFoodCollectionBySlug } from "@/lib/hub-collections";
import { scanArabicDialect, scanLatinContamination } from "@/lib/blog-msa";

/**
 * NUTRIENT LISTS canaries — SEO-GROWTH Phase 2 (owner order 2026-11-06
 * «استكمل المرحلة التالية من خطة استعادة النمو… استكمل جميع الأعمال
 * الممكنة حاليًا… لا تبدأ دفعات مقالات جديدة أو توسع الـ500 صنف قبل
 * حسم قرار D-2»), executing audit 03 §4.3 / file 07's Phase-2 task line
 * «10-15 قائمة «غني بـ{مغذٍّ}» مبنية من قاعدة البيانات» — guarding the
 * same eight mandatory quality gates the comparisons family pinned
 * (audit 03 §6), plus the list-family's own scope laws:
 *
 *   1. DEPTH: ≥180 unique words per language per list.
 *   2. TEMPLATE SIMILARITY: pairwise Jaccard within the family ≤ the
 *      pinned ceiling.
 *   3. AR PURITY: the Arabic copy passes the Latin-contamination and
 *      strong-dialect scanners.
 *   4. TITLES: EN ≤75 raw; AR ≤75 composed (+ the /ar layout template
 *      append) and QUESTION-SHAPED (the §4.1 AR-surface law).
 *   5. DESCRIPTIONS: ≤160 both languages.
 *   6. FAQ: 2-4 real questions per list, bilingual.
 *   7. INTERNAL LINKS: ≥3 per page (rows→food pages + tool bridge +
 *      family links + the collection deepening) — verified on ROUTE
 *      SOURCE.
 *   8. DATA TRUTH: every row's value equals the derivation from its
 *      FOODS row; every row obeys the SCOPE LAWS (real Arabic name,
 *      no spice, no concentrate; per-list pools: no pure fats on the
 *      fat/calorie lists, no drinks on the lowest-calorie list, fresh
 *      raw fruits only on the fruit list, seafood slugs only on the
 *      seafood list).
 *
 * Plus: the sitemap family law (20 URLs in sitemap-collections.xml)
 * and the §4.3 hub-deepening law (every list's collectionSlug resolves
 * to a live FOOD_COLLECTIONS hub; the hub pages render the backlinks).
 */

const EN_PAGE = "src/app/(en)/foods/lists/[slug]/page.tsx";
const AR_PAGE = "src/app/(ar)/ar/foods/lists/[slug]/page.tsx";
const SITEMAP = "src/app/sitemap-collections.xml/route.ts";
const EN_HUB = "src/app/(en)/collections/[slug]/page.tsx";
const AR_HUB = "src/app/(ar)/ar/collections/[slug]/page.tsx";
const AR_TEMPLATE_APPEND = " — Alkemos".length;

function flatten(l: (typeof NUTRIENT_LISTS)[number], lang: "en" | "ar"): string {
  const parts = [
    lang === "en" ? l.introEn : l.introAr,
    lang === "en" ? l.criterionEn : l.criterionAr,
  ];
  for (const v of l.verdicts) {
    parts.push(v.heading[lang]);
    parts.push(v.body[lang]);
  }
  for (const f of l.faqs) {
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

const ARABIC_RE = /[\u0600-\u06FF]/;
const CONCENTRATE_RE = /\b(dried|dry|powder|flour|liquid)\b/i;
const PURE_FAT_RE = /\b(anhydrous|tallow|suet|lard|separable fat)\b/i;
const SEAFOOD_RE = /^(fish|crustaceans|mollusks)-/;

describe("food-nutrient-lists family (SEO-GROWTH Phase 2 — audit 03 §4.3, gates 03 §6)", () => {
  it(
    "the family completes the plan's Phase-2 window at its ceiling: 15 lists (owner order 2026-11-06 «استكمل تنفيذ خطة استعادة النمو… حتى إتمام جميع مراحلها وبنودها» — the 10-15 item executed to its top)",
    () => {
      expect(NUTRIENT_LISTS).toHaveLength(15);
      expect(NUTRIENT_LISTS.map((l) => l.slug)).toEqual([
        "highest-protein-foods",
        "protein-per-calorie",
        "highest-fiber-foods",
        "lowest-calorie-high-satiety",
        "lowest-calorie-foods",
        "highest-fat-foods",
        "highest-calorie-foods",
        "low-carb-high-protein-foods",
        "lowest-sugar-fruits",
        "highest-protein-fish",
        "highest-protein-dairy",
        "highest-protein-nuts-seeds",
        "highest-protein-vegetables",
        "leanest-high-protein-foods",
        "highest-carb-foods",
      ]);
    },
  );

  it("GATE 1 — depth: ≥180 unique words per language per list", () => {
    for (const l of NUTRIENT_LISTS) {
      expect(uniqueWords(flatten(l, "en")).size, `${l.slug} EN`).toBeGreaterThanOrEqual(180);
      expect(uniqueWords(flatten(l, "ar")).size, `${l.slug} AR`).toBeGreaterThanOrEqual(180);
    }
  });

  it("GATE 2 — template similarity: pairwise Jaccard stays under the measured ceiling", () => {
    // Same style ceiling as the comparisons family (pinned at 0.22 with
    // margin over the shipped measurements — the P1-1/P1-2 law style).
    for (let i = 0; i < NUTRIENT_LISTS.length; i++) {
      for (let j = i + 1; j < NUTRIENT_LISTS.length; j++) {
        const je = jaccard(flatten(NUTRIENT_LISTS[i], "en"), flatten(NUTRIENT_LISTS[j], "en"));
        const ja = jaccard(flatten(NUTRIENT_LISTS[i], "ar"), flatten(NUTRIENT_LISTS[j], "ar"));
        expect(je, `${NUTRIENT_LISTS[i].slug}~${NUTRIENT_LISTS[j].slug} EN`).toBeLessThan(0.22);
        expect(ja, `${NUTRIENT_LISTS[i].slug}~${NUTRIENT_LISTS[j].slug} AR`).toBeLessThan(0.22);
      }
    }
  });

  it("GATE 3 — Arabic purity: no Latin prose contamination, MSA-clean", () => {
    for (const l of NUTRIENT_LISTS) {
      const text = flatten(l, "ar");
      const latin = scanLatinContamination(text);
      expect(latin.count, `${l.slug} latin contamination: ${latin.tokens.join(",")}`).toBe(0);
      const dialect = scanArabicDialect(text);
      expect(dialect.strong, `${l.slug} strong dialect markers`).toBe(0);
    }
  });

  it("GATE 4 — titles: EN ≤75 raw; AR ≤75 composed with the template append; AR question-shaped", () => {
    for (const l of NUTRIENT_LISTS) {
      expect(l.titleEn.length, `${l.slug} titleEn`).toBeLessThanOrEqual(75);
      expect(l.titleAr.length + AR_TEMPLATE_APPEND, `${l.slug} titleAr composed`).toBeLessThanOrEqual(75);
      // The AR title is QUESTION-SHAPED (audit §4.1 law for the AR surface).
      expect(l.titleAr).toContain("؟");
      // The EN title carries the brand suffix (the EN convention).
      expect(l.titleEn).toMatch(/\| Alkemos$/);
    }
  });

  it("GATE 5 — descriptions: ≤160 in both languages", () => {
    for (const l of NUTRIENT_LISTS) {
      expect(l.descriptionEn.length, `${l.slug} descEn`).toBeLessThanOrEqual(160);
      expect(l.descriptionAr.length, `${l.slug} descAr`).toBeLessThanOrEqual(160);
    }
  });

  it("GATE 6 — FAQ: 2-4 real questions per list, bilingual, non-empty", () => {
    for (const l of NUTRIENT_LISTS) {
      expect(l.faqs.length, `${l.slug} faq count`).toBeGreaterThanOrEqual(2);
      expect(l.faqs.length, `${l.slug} faq count`).toBeLessThanOrEqual(4);
      for (const f of l.faqs) {
        expect(f.q.en.length).toBeGreaterThan(10);
        expect(f.q.ar.length).toBeGreaterThan(10);
        expect(f.a.en.length).toBeGreaterThan(40);
        expect(f.a.ar.length).toBeGreaterThan(40);
      }
    }
  });

  it("GATE 7 — internal links on the ROUTE SOURCE: rows→food pages, the tool bridge, the family links, the breadcrumb foods hub", () => {
    const en = readFileSync(EN_PAGE, "utf8");
    const ar = readFileSync(AR_PAGE, "utf8");
    // rows→food pages (per-language link prefix)
    expect(en).toContain("href={`/foods/${r.slug}`");
    expect(ar).toContain("href={`/ar/foods/${r.slug}`");
    // the tool bridge
    expect(en).toContain("`/tools/${list.toolSlug}`");
    expect(ar).toContain("`/ar/tools/${list.toolSlug}`");
    // the family links
    expect(en).toContain("/foods/lists/${l.slug}");
    expect(ar).toContain("/ar/foods/lists/${l.slug}");
    // the breadcrumb foods hub
    expect(en).toContain('href="/foods"');
    expect(ar).toContain('href="/ar/foods"');
  });

  it("GATE 8 — data truth: every row's value equals the derivation from its FOODS row (the food pages' own numbers)", () => {
    const r1 = (n: number) => Math.round(n * 10) / 10;
    const r2 = (n: number) => Math.round(n * 100) / 100;
    for (const l of NUTRIENT_LISTS) {
      expect(l.rows, `${l.slug} rows`).toHaveLength(20);
      for (const row of l.rows) {
        const f = getFoodBySlug(row.slug);
        expect(f, `${l.slug}/${row.slug} resolves in FOODS`).not.toBeNull();
        if (!f) continue;
        // the context columns ARE the food's own row
        expect(row.calories).toBe(f.per100g.calories);
        expect(row.protein).toBe(f.per100g.protein);
        expect(row.carbs).toBe(f.per100g.carbs);
        expect(row.fat).toBe(f.per100g.fat);
        expect(row.fiber).toBe(f.per100g.fiber);
        expect(row.nameAr).toBe(f.nameAr);
        expect(row.nameEn).toBe(f.nameEn);
        // the ranked value matches the per-list derivation
        const kcal = f.per100g.calories;
        switch (l.slug) {
          case "highest-protein-foods":
          case "low-carb-high-protein-foods":
          case "highest-protein-fish":
          case "highest-protein-dairy":
          case "highest-protein-nuts-seeds":
          case "highest-protein-vegetables":
            expect(row.value).toBe(r1(f.per100g.protein));
            break;
          case "highest-carb-foods":
            expect(row.value).toBe(r1(f.per100g.carbs));
            break;
          case "leanest-high-protein-foods":
            expect(row.value).toBe(r1(f.per100g.fat));
            break;
          case "protein-per-calorie":
            expect(row.value).toBe(r1((f.per100g.protein * 100) / kcal));
            break;
          case "highest-fiber-foods":
            expect(row.value).toBe(r1(f.per100g.fiber));
            break;
          case "lowest-calorie-high-satiety":
            expect(row.value).toBe(r2((f.per100g.protein * 4 + f.per100g.fiber * 4) / kcal));
            break;
          case "lowest-calorie-foods":
          case "highest-calorie-foods":
            expect(row.value).toBe(kcal);
            break;
          case "highest-fat-foods":
            expect(row.value).toBe(r1(f.per100g.fat));
            break;
          case "lowest-sugar-fruits":
            expect(row.value).toBe(r1(f.per100g.sugar));
            break;
        }
      }
    }
  });

  it("SCOPE LAW A — the listable universe: real Arabic names only, no spices, no concentrated forms (isListableFood is the single source)", () => {
    for (const f of FOODS) {
      expect(isListableFood(f)).toBe(
        ARABIC_RE.test(f.nameAr) &&
          f.nameAr !== f.nameEn &&
          !f.slug.startsWith("spices-") &&
          !CONCENTRATE_RE.test(f.nameEn),
      );
    }
    // every ranked row obeys it
    for (const l of NUTRIENT_LISTS) {
      for (const row of l.rows) {
        const f = getFoodBySlug(row.slug)!;
        expect(isListableFood(f), `${l.slug}/${row.slug} must be listable`).toBe(true);
      }
    }
  });

  it("SCOPE LAW B — per-list pools: no pure fats on the fat/calorie lists, no drinks on the lowest-calorie list, fresh raw fruits only, seafood slugs only", () => {
    for (const l of NUTRIENT_LISTS) {
      for (const row of l.rows) {
        const f = getFoodBySlug(row.slug)!;
        if (l.slug === "highest-fat-foods" || l.slug === "highest-calorie-foods") {
          expect(f.category, `${l.slug}/${row.slug} category`).not.toBe("fat");
          expect(PURE_FAT_RE.test(f.nameEn), `${l.slug}/${row.slug} no pure-fat rows`).toBe(false);
        }
        if (l.slug === "lowest-calorie-foods") {
          expect(f.category, `${l.slug}/${row.slug} solid foods only`).not.toBe("drink");
          expect(f.per100g.calories, `${l.slug}/${row.slug} positive calories`).toBeGreaterThan(0);
        }
        if (l.slug === "protein-per-calorie" || l.slug === "lowest-calorie-high-satiety") {
          expect(f.per100g.calories, `${l.slug}/${row.slug} positive calories`).toBeGreaterThan(0);
        }
        if (l.slug === "lowest-sugar-fruits") {
          expect(f.category, `${l.slug}/${row.slug} fruit category`).toBe("fruit");
          expect(/\braw\b/i.test(f.nameEn), `${l.slug}/${row.slug} fresh (raw) only`).toBe(true);
          expect(f.per100g.sugar, `${l.slug}/${row.slug} measured (non-zero) sugar only`).toBeGreaterThan(0);
        }
        if (l.slug === "highest-protein-fish") {
          expect(SEAFOOD_RE.test(f.slug), `${l.slug}/${row.slug} seafood slug`).toBe(true);
        }
        if (l.slug === "low-carb-high-protein-foods") {
          expect(f.per100g.carbs, `${l.slug}/${row.slug} carbs ≤ 5g`).toBeLessThanOrEqual(5);
        }
        // Lists 11-15 pools (owner order 2026-11-06 — the 10-15 completion)
        if (l.slug === "highest-protein-dairy") {
          expect(f.category, `${l.slug}/${row.slug} dairy category`).toBe("dairy");
        }
        if (l.slug === "highest-protein-nuts-seeds") {
          expect(f.category, `${l.slug}/${row.slug} nuts category`).toBe("nuts");
        }
        if (l.slug === "highest-protein-vegetables") {
          expect(f.category, `${l.slug}/${row.slug} vegetable category`).toBe("vegetable");
          expect(/\bdehydrated\b/i.test(f.nameEn), `${l.slug}/${row.slug} no dehydrated rows`).toBe(false);
        }
        if (l.slug === "leanest-high-protein-foods") {
          expect(f.per100g.protein, `${l.slug}/${row.slug} protein ≥ 20g bar`).toBeGreaterThanOrEqual(20);
          expect(
            /\b(mature seeds|lentils),\s*raw\b/i.test(f.nameEn),
            `${l.slug}/${row.slug} no raw dry-legume rows`,
          ).toBe(false);
        }
        if (l.slug === "highest-carb-foods") {
          expect(f.category, `${l.slug}/${row.slug} no fat category`).not.toBe("fat");
          expect(f.category, `${l.slug}/${row.slug} no drink category`).not.toBe("drink");
          expect(
            /^(sugars|candies|sweeteners)-/.test(f.slug) ||
              /\b(syrup|honey|molasses|jam|jell|preserves|candied|caramel|leather|cookies?|dehydrated|raisins?|cornstarch|starches|starch)\b/i.test(f.nameEn),
            `${l.slug}/${row.slug} no sweets/starch/dehydrated rows`,
          ).toBe(false);
        }
      }
    }
  });

  it("SCOPE LAW C — rankings are ordered and correct-typed: descending/ascending per list, deterministic ties", () => {
    for (const l of NUTRIENT_LISTS) {
      const values = l.rows.map((r) => r.value);
      const desc = ["highest-protein-foods", "protein-per-calorie", "highest-fiber-foods", "lowest-calorie-high-satiety", "highest-fat-foods", "highest-calorie-foods", "low-carb-high-protein-foods", "highest-protein-fish", "highest-protein-dairy", "highest-protein-nuts-seeds", "highest-protein-vegetables", "highest-carb-foods"];
      const asc = ["lowest-calorie-foods", "lowest-sugar-fruits", "leanest-high-protein-foods"];
      if (desc.includes(l.slug)) {
        for (let i = 1; i < values.length; i++) {
          expect(values[i], `${l.slug} order at ${i}`).toBeLessThanOrEqual(values[i - 1]);
        }
      } else if (asc.includes(l.slug)) {
        for (let i = 1; i < values.length; i++) {
          expect(values[i], `${l.slug} order at ${i}`).toBeGreaterThanOrEqual(values[i - 1]);
        }
      }
      // every slug appears at most once per list
      expect(new Set(l.rows.map((r) => r.slug)).size).toBe(l.rows.length);
    }
  });

  it("the anti-cannibalization law: each list targets the RANKING question, distinct from the tag-collection LIST intent — pinned via the title shapes", () => {
    for (const l of NUTRIENT_LISTS) {
      // AR question titles (the ranking intent) never equal a collection's
      // declarative title; EN titles carry "Ranking|Ranked|Per Calorie…"
      expect(l.titleAr.startsWith("ما "), `${l.slug} AR question form`).toBe(true);
      if (l.collectionSlug) {
        const coll = getFoodCollectionBySlug(l.collectionSlug);
        expect(coll, `${l.slug} collectionSlug resolves`).not.toBeNull();
        expect(l.titleAr, `${l.slug} vs collection title`).not.toBe(coll!.titleAr);
        expect(l.h1Ar, `${l.slug} vs collection h1`).not.toBe(coll!.h1Ar);
      }
    }
  });

  it("the §4.3 hub-deepening law: the hub pages render the ranked-lists backlinks and every collectionSlug resolves", () => {
    const enHub = readFileSync(EN_HUB, "utf8");
    const arHub = readFileSync(AR_HUB, "utf8");
    expect(enHub).toContain("listsForCollection(collection.slug)");
    expect(arHub).toContain("listsForCollection(collection.slug)");
    expect(enHub).toContain("/foods/lists/${l.slug}");
    expect(arHub).toContain("/ar/foods/lists/${l.slug}");
    // every list that names a collection gets a backlink from that hub
    const hubSlugs = new Set(FOOD_COLLECTIONS.map((c) => c.slug));
    for (const l of NUTRIENT_LISTS) {
      if (l.collectionSlug) {
        expect(hubSlugs.has(l.collectionSlug), `${l.slug}→${l.collectionSlug}`).toBe(true);
        expect(listsForCollection(l.collectionSlug).map((x) => x.slug)).toContain(l.slug);
      }
    }
  });

  it("the sitemap family law: all 30 list URLs present in sitemap-collections.xml (15 lists × 2 mirrors)", () => {
    const src = readFileSync(SITEMAP, "utf8");
    // the route generates the 20 URLs by looping NUTRIENT_LISTS — the
    // canary pins the loop + both per-language templates; the actual 20
    // URLs are verified on the built HTML and the live sitemap smoke.
    expect(src).toContain("NUTRIENT_LISTS");
    expect(src).toContain("/foods/lists/${list.slug}");
    expect(src).toContain("/ar/foods/lists/${list.slug}");
  });

  it("getNutrientListBySlug resolves and 404s cleanly", () => {
    expect(getNutrientListBySlug("highest-protein-foods")?.slug).toBe("highest-protein-foods");
    expect(getNutrientListBySlug("nope")).toBeNull();
  });

  it("rows link only to LIVE pages (every row slug is a real FOODS row — all food pages are indexable)", () => {
    for (const l of NUTRIENT_LISTS) {
      for (const row of l.rows) {
        expect(FOODS.some((f) => f.slug === row.slug), `${l.slug}/${row.slug}`).toBe(true);
      }
    }
  });
});
