import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { FOODS } from "@/lib/foods";
import { SEO_FOOD_BAND_SET } from "@/lib/seo-food-band";

/**
 * Phase 141 / audit A-5 policy canaries — the invariants the
 * sitemap-foods crawl-budget policy depends on.
 *
 * Policy (src/app/sitemap-foods.xml/route.ts): only foods with
 * `tags.length > 0` are advertised in the sitemap (both languages).
 * The USDA long tail stays live and indexable via internal links.
 *
 * FOOD-ARABIZATION Phase 1+2+3 (2026-09-19) — band-aware update: the pilot
 * translated a bounded SEO_FOOD_BAND (481 USDA slugs) to real Arabic, the
 * owner-ordered Phase-2 expansion batch added +975 more, and the owner-
 * ordered batch 3 added +953 (cumulative 2,409). Phase 4 (2026-11-12) added
 * +49 GSC-demand rows; Phase 5 (2026-11-12, owner order «استكمال تعريب
 * الأغذية المتبقية») completed the tail with +5,618 — cumulative 8,076.
 * The tail OUTSIDE the band was the documented audience-fit exclusions
 * (pork/alcohol) until the PORK-ALCOHOL DELETION (owner order 2026-11-12
 * «حذف الأغذية المحتوية على لحم الخنزير والكحول نهائيًا»): 666 of the
 * 674 excluded rows were DELETED from FOODS entirely (593 pork-family +
 * 75 alcohol, incl. the 2 curated confirmed-pork rows pork-tenderloin &
 * bacon); the 8 guardrail-protected survivors (owner order: «لا تحذف
 * الأغذية النباتية أو الدواجن أو الأسماك أو المنتجات الخالية من هذه
 * المكونات لمجرد تشابه الاسم») keep English nameAr and stay out of the
 * band. The sitemap POLICY ITSELF is deliberately UNCHANGED — pinned
 * below.
 */

const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

describe("foods sitemap policy (A-5)", () => {
  it("curated band: every tagged food has a REAL Arabic name (rankable AR mirror)", () => {
    const curated = FOODS.filter((f) => (f.tags?.length ?? 0) > 0);
    expect(curated.length).toBeGreaterThanOrEqual(50);
    for (const f of curated) {
      expect(hasArabic(f.nameAr), `${f.slug} nameAr must contain Arabic`).toBe(
        true,
      );
      expect(f.slug.length).toBeGreaterThan(0);
    }
  });

  it("USDA long tail OUTSIDE the SEO band carries ENGLISH nameAr — documents WHY it stays out of the sitemap", () => {
    const tail = FOODS.filter((f) => (f.tags?.length ?? 0) === 0);
    // The Phase-141 audit verified ALL USDA tail rows ship English
    // nameAr. FOOD-ARABIZATION Phase 1 (481) + Phase 2 (+975) + Phase 3
    // (+953) translated a bounded band of it; everything else keeps
    // English nameAr (translatable only by a future owner-ordered batch
    // naming the rows — the batch-4 precedent). If this fails outside the
    // band, a translation landed unguarded — revisit the sitemap policy then.
    //
    // PORK-ALCOHOL DELETION (owner order 2026-11-12): 666 of the 674
    // documented audience-fit exclusions were DELETED from the catalog
    // (593 pork-family + 75 alcohol). Outside the band remain EXACTLY the
    // 8 guardrail-protected rows (owner order: «لا تحذف الأغذية النباتية
    // أو الدواجن أو الأسماك أو المنتجات الخالية من هذه المكونات لمجرد
    // تشابه الاسم»): 2 turkey ham + 1 turkey bacon + 2 meatless bacon +
    // 1 turkey-pepperoni pizza (poultry/plant — not pork) + 2 alcohol-free
    // drinks (non-alcoholic wine + non-alcoholic cocktail mix).
    const outside = tail.filter((f) => !SEO_FOOD_BAND_SET.has(f.slug));
    const withArabic = outside.filter((f) => hasArabic(f.nameAr)).length;
    expect(withArabic).toBe(0);
    expect(outside.length).toBe(8);
    // The band itself is now genuinely Arabic (rankable AR mirrors) —
    // the batches' whole point (full law: foods-ar-purity.test.ts).
    // 481 pilot + 975 + 953 + 49 + 5,618 = 8,076 (the final completion batch).
    const band = tail.filter((f) => SEO_FOOD_BAND_SET.has(f.slug));
    expect(band.length).toBe(8076);
    expect(band.every((f) => hasArabic(f.nameAr))).toBe(true);
  });

  it("curated band spans every food category (section coverage)", () => {
    const curated = FOODS.filter((f) => (f.tags?.length ?? 0) > 0);
    const cats = new Set(curated.map((f) => f.category));
    for (const c of [
      "protein",
      "carb",
      "fat",
      "vegetable",
      "fruit",
      "dairy",
      "nuts",
      "snack",
      "drink",
    ]) {
      expect(cats.has(c as never), `curated band missing category ${c}`).toBe(
        true,
      );
    }
  });

  // P2-12 (§12.37 — plan item 12 «معالجة USDA العربي»): the AR mirror of
  // an arabicless (USDA long-tail) food leaves the index — noindex,follow
  // — while curated foods (real Arabic names) stay fully indexable and
  // the EN twin keeps the Phase-141 policy (indexable, unadvertised).
  // FOOD-ARABIZATION Phase 1: translated band mirrors flip to indexable
  // AUTOMATICALLY via the same regex — no route change, by design.
  it("P2-12: the AR food route noindexes arabicless USDA mirrors only", () => {
    const route = readFileSync("src/app/(ar)/ar/foods/[slug]/page.tsx", "utf8");
    expect(route).toContain("arabiclessName");
    expect(route).toContain("robots: { index: false, follow: true }");
    expect(route).toContain("/[\\u0600-\\u06FF]/.test(food.nameAr)");
    // The EN twin stays indexable for the whole dataset (141 policy).
    const en = readFileSync("src/app/(en)/foods/[slug]/page.tsx", "utf8");
    expect(en).not.toContain("arabiclessName");
    expect(en).not.toContain("index: false, follow: true");
    // Data facts the law depends on: the long tail outside the
    // Arabized band really is arabicless (band-aware since Phase 1).
    const tail = FOODS.filter((f) => (f.tags?.length ?? 0) === 0);
    expect(tail.length).toBeGreaterThan(5000);
    expect(
      tail.filter((f) => !SEO_FOOD_BAND_SET.has(f.slug) && hasArabic(f.nameAr))
        .length,
    ).toBe(0);
  });

  // FOOD-ARABIZATION Phase 1 — owner directive 2026-09-19 («لا تغيّر سياسة
  // sitemap/indexing النهائية قبل التحقق من جودة الـPilot»): the sitemap
  // criterion stays `tags.length > 0` ONLY while the pilot's quality is
  // being verified. Wiring SEO_FOOD_BAND into the route is a DELIBERATE
  // future change (plan §3.4 composite criterion) that must arrive in its
  // own reviewed frame — this canary fails if it sneaks in unreviewed.
  it("PILOT HOLD: sitemap advertisement policy unchanged — the band is NOT yet advertised", () => {
    const route = readFileSync("src/app/sitemap-foods.xml/route.ts", "utf8");
    expect(route).not.toContain("SEO_FOOD_BAND");
    expect(route).toContain("(f.tags?.length ?? 0) > 0");
  });
});
