import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { FOODS, getFoodBySlug } from "@/lib/foods";
import { FOODS_COUNT } from "@/lib/foods-shared";
import { SEO_FOOD_BAND_SET } from "@/lib/seo-food-band";
import { foodsMethodologyStats } from "@/lib/foods-methodology";

/**
 * FOODS-COUNT-CONSISTENCY (PORK-ALCOHOL DELETION, owner order 2026-11-12
 * «تحديث جميع إحصائيات وأعداد الأغذية في المشروع» — item 6: «أضف اختبارًا
 * أو تحققًا يمنع ظهور إحصائيات حالية قديمة أو متناقضة مستقبلًا»).
 *
 * THREE LAWS:
 *
 * 1. SINGLE-SOURCE TRUTH — every derived statistic is recomputed FROM the
 *    FOODS array and pinned. A data change that moves any number MUST
 *    consciously update this pin (the same discipline as the FREEZE
 *    canaries in foods-ar-purity.test.ts). The pin set is the exact
 *    vocabulary the UI surfaces render (methodology page stats, sitemap
 *    policy counts, arabization band counts).
 *
 * 2. NO STALE CURRENT-COUNT LITERALS — the retired totals (8,830/8830 the
 *    pre-deletion catalog, 8,750/8750 the pre-deletion tail, 8,156/8156
 *    the pre-deletion arabized total, 674/597/77 the pre-deletion
 *    exclusion counts) may not appear as CURRENT claims on user-facing
 *    surfaces (src/app/**, src/components/**, src/lib marketing copy,
 *    public/llms.txt). Historical narrative inside test files, docs/**,
 *    archive/**, scripts/** and the two historical "Before:" comments in
 *    sitemap-foods.xml/route.ts is exempt — those describe past states.
 *
 * 3. THE DELETION STAYS DELETED — the 668 deleted pork/alcohol slugs
 *    (sampled anchors: lard, bacon, pork-tenderloin, the wild-boar and
 *    malt-liquor rows the batch-5 report names) may never return to the
 *    catalog, and the 8 guardrail-protected survivors (poultry/plant/
 *    alcohol-free — owner order «لا تحذف الأغذية النباتية أو الدواجن أو
 *    الأسماك أو المنتجات الخالية من هذه المكونات لمجرد تشابه الاسم»)
 *    may not be deleted by a future over-broad sweep.
 */

const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

const curated = FOODS.filter((f) => (f.tags?.length ?? 0) > 0);
const tail = FOODS.filter((f) => (f.tags?.length ?? 0) === 0);
const band = tail.filter((f) => SEO_FOOD_BAND_SET.has(f.slug));
const outsideBand = tail.filter((f) => !SEO_FOOD_BAND_SET.has(f.slug));

describe("foods-count-consistency (PORK-ALCOHOL DELETION — owner order 2026-11-12, item 6)", () => {
  it("LAW 1 — single-source stats pin: every current number derives from FOODS and matches the post-deletion state", () => {
    // The catalog after the 668-row deletion (8,830 − 668 = 8,162).
    expect(FOODS.length).toBe(8162);
    expect(FOODS_COUNT).toBe(FOODS.length);
    // Curated (sitemap-advertised): 80 − 2 confirmed-pork rows.
    expect(curated.length).toBe(78);
    // Long tail: 8,750 − 666 deleted tail rows.
    expect(tail.length).toBe(8084);
    // Arabized band: unchanged 8,076.
    expect(band.length).toBe(8076);
    // Outside the band: EXACTLY the 8 guardrail-protected survivors.
    expect(outsideBand.length).toBe(8);
    expect(outsideBand.every((f) => !hasArabic(f.nameAr))).toBe(true);
    // The methodology stats helper agrees (it feeds the public pages).
    const stats = foodsMethodologyStats(FOODS, 9);
    expect(stats.total).toBe(8162);
    expect(stats.curated).toBe(78);
    expect(stats.longTail).toBe(8084);
    expect(stats.arabized).toBe(8154); // 78 curated + 8,076 band
    expect(stats.total).toBe(stats.curated + stats.longTail);
  });

  it("LAW 1 — AR/EN parity: the rendered totals are identical in both languages (no divergent counts)", () => {
    // The single source renders both language surfaces — the Arabic and
    // English copy must carry the SAME number (either the literal formatted
    // FOODS_COUNT or the constant itself, never a divergent hardcoded one).
    const total = FOODS_COUNT.toLocaleString("en-US");
    const arFoodsPage = readFileSync("src/app/(ar)/ar/foods/page.tsx", "utf8");
    expect(arFoodsPage).toContain(`${total}+`);
    // The EN list page renders the count through the client explorer —
    // it must keep deriving it from the shared constant (single source).
    const explorer = readFileSync("src/components/foods/FoodsExplorer.tsx", "utf8");
    expect(explorer).toContain("FOODS_COUNT");
    expect(explorer).not.toMatch(/8[,.]830|8[,.]162\+? "|"8[,.]162/);
    const arLayout = readFileSync("src/app/(ar)/ar/layout.tsx", "utf8");
    const metadata = readFileSync("src/app/metadata.ts", "utf8");
    expect(arLayout).toContain(`${total}+`);
    expect(metadata).toContain(`${total}+`);
  });

  it("LAW 2 — no stale CURRENT-count literals on user-facing surfaces (the retired totals stay retired)", () => {
    // Retired current-state numbers. Historical narrative is exempt
    // (docs/, archive/, scripts/, tests, and the pre-deletion "Before:"
    // comments that describe past states).
    const STALE = [
      "8,830", "8830", // pre-deletion catalog total
      "8,750", "8750", // pre-deletion USDA tail
      "8,156", "8156", // pre-deletion arabized total
    ];
    const EXEMPT_SUBSTRINGS = [
      // sitemap-foods route: the historical Phase-141 "Before/audit"
      // narrative describes the PRE-policy state (kept verbatim).
      "Before: 8,830 foods",
      "audit (Phase 141): the 8,750-row",
    ];
    const SURFACE_ROOTS = [
      "src/app",
      "src/components",
      "src/lib",
      "public",
    ];
    const EXEMPT_FILES = new Set([
      // data module headers carry the historical batch narrative + the
      // deletion record; the band manifest documents the 674 history.
      "src/lib/seo-food-band.ts",
      "src/lib/foods.ts",
      "src/lib/foods-search-index.ts",
      // tests are pin-exempt by design (they carry historical numbers).
      "src/lib/foods-methodology.ts",
    ]);
    const isTestFile = (p: string) => p.includes("__tests__") || p.endsWith(".test.ts") || p.endsWith(".test.tsx");

    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          if (entry === "__tests__" || entry === "node_modules" || entry === ".next") continue;
          walk(full);
        } else if (/\.(ts|tsx|txt|json)$/.test(entry)) {
          const rel = full.replace(/\\/g, "/");
          if (isTestFile(rel) || EXEMPT_FILES.has(rel)) continue;
          const src = readFileSync(full, "utf8");
          for (const stale of STALE) {
            let idx = src.indexOf(stale);
            while (idx !== -1) {
              const context = src.slice(Math.max(0, idx - 80), idx + 80);
              if (!EXEMPT_SUBSTRINGS.some((e) => context.includes(e))) {
                offenders.push(`${rel}: «${stale}» …${context.replace(/\n/g, " ").slice(0, 100)}`);
              }
              idx = src.indexOf(stale, idx + 1);
            }
          }
        }
      }
    };
    for (const root of SURFACE_ROOTS) walk(root);
    expect(offenders.slice(0, 10), `stale current-count literals (${offenders.length})`).toEqual([]);
    expect(offenders.length).toBe(0);
  });

  it("LAW 3 — the deletion stays deleted and the guardrail survivors stay (sampled anchors)", () => {
    // Deleted anchors — confirmed pork/alcohol rows that may never return.
    for (const slug of [
      "lard",
      "bacon",
      "pork-tenderloin",
      "animal-fat-bacon-grease",
      "game-meat-boar-wild-raw",
      "beverages-malt-liquor-beverage",
      "beverages-amber-hard-cider",
      "alcoholic-beverage-wine-table-red",
      "alcoholic-beverage-distilled-vodka-80-proof",
      "soup-bean-with-pork-canned-condensed",
      "pork-fresh-loin-tenderloin-separable-lean-only-raw",
      "snacks-pork-skins-plain",
      "alcoholic-beverage-creme-de-menthe-72-proof",
    ]) {
      expect(getFoodBySlug(slug), `${slug} must stay DELETED (pork/alcohol deletion 2026-11-12)`).toBeUndefined();
    }
    // Guardrail survivors — poultry/plant/alcohol-free rows the owner's
    // order explicitly protected («لا تحذف ... لمجرد تشابه الاسم»).
    for (const slug of [
      "usda-commodity-turkey-ham-dark-meat-smoked-frozen",
      "turkey-ham-sliced-extra-lean-prepackaged-or-deli-sliced",
      "bacon-turkey-low-sodium",
      "bacon-meatless",
      "bacon-bits-meatless",
      "school-lunch-pizza-big-daddys-ls-16-51-whole-grain-rolled-ed-6689",
      "beverages-wine-non-alcoholic",
      "beverages-cocktail-mix-non-alcoholic-concentrated-frozen",
    ]) {
      expect(getFoodBySlug(slug), `${slug} is guardrail-protected and must stay in the catalog`).toBeDefined();
    }
  });
});
