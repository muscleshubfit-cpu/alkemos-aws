import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { FOODS, getFoodBySlug } from "@/lib/foods";
import { SEO_FOOD_BAND, SEO_FOOD_BAND_SET } from "@/lib/seo-food-band";

/**
 * FOOD-ARABIZATION Phase 1+2+3 (2026-09-19) — ARABIZED-BAND LAW.
 *
 * The arabization plan (docs/FOOD-DATA-ARABIZATION-PLAN-2026-09-19.md §6)
 * scopes the Arabic-purity law to the BAND, not the whole library (the
 * deep USDA tail legitimately keeps English nameAr until a future batch):
 *
 *   1. every SEO_FOOD_BAND slug exists and is a USDA-tail row (tags EMPTY
 *      — curation stays a hand-written signal; auto-tagging is forbidden);
 *   2. its nameAr is non-empty, contains Arabic, carries ZERO Latin
 *      letters, differs from nameEn, is 2-80 chars, no CJK (Phase-191
 *      fail-closed batch pipeline — same discipline as exercise names);
 *   3. Arabic names are UNIQUE across the band (distinct H1/titles);
 *   4. FREEZE canaries — the translation line may never touch: the 80
 *      curated rows, the 8,830 slug identities, or the band's nameEn.
 *
 * Phase 1 (pilot, owner order 2026-09-19): 481 slugs. Phase 2 (owner
 * expansion order, same day): +975 slugs (seafood sweep · produce ·
 * full spice rack · dairy/bakery/dessert staples). Phase 3 (owner
 * batch-3 order, same day): +953 slugs (meat cuts & organs with semantic
 * cut-dedupe · poultry part grid · remaining fish/shellfish · rabbit/
 * deer/water-buffalo · generic soups · bakery/dessert/candy · beverages
 * incl. protein powders · vegetables/fruits/legumes · flours & cereals ·
 * nuts/seeds · condiments · snacks — zero pork/brands/babyfood/tribal)
 * — cumulative 2,409 = pilot + two 500-1,000 batches (plan §8 Phase 2
 * law; the size range below encodes exactly that).
 *
 * Phase 4 (Report 15 §5-B2, owner execution order 2026-11-12 «ابدأ
 * التنفيذ للخطة»): +49 GSC-demand-filtered slugs (measured >=3 impressions
 * on the EN mirror in the owner's 3-month export; pork/alcoholic rows
 * excluded per band precedent — the report's §B2 table documents every
 * applied and excluded row). Cumulative 2,458.
 *
 * Phase 5 (owner order 2026-11-12 «استكمال تعريب الأغذية المتبقية وفق خطة
 * التعريب المعتمدة والقرارات المسجلة»): the FINAL completion batch —
 * +5,618 slugs covering the ENTIRE remaining translatable USDA tail.
 * Reproducible pipeline in scripts/repro/food-arabization-batch5/
 * (compositional engine + curated lexicons + 1,009 hand-translated rows
 * + fail-closed validator mirroring this test's law exactly). The 4
 * late-excluded rows (2 wild-boar pork + hard cider + malt liquor) moved
 * to the standing audience-fit exclusions — batch-4 precedent, override
 * only by an owner order naming the rows. Cumulative 8,076.
 *
 * PORK-ALCOHOL DELETION (owner order 2026-11-12 «حذف الأغذية المحتوية
 * على لحم الخنزير والكحول نهائيًا» — decision: DELETE from the catalog,
 * not just exclude from arabization): every row of the documented
 * audience-fit exclusions was re-audited from the source (674 = 597
 * pork-family + 77 alcohol). CONFIRMED rows were DELETED — 593 pork-family
 * (597 minus 6 guardrail-protected poultry/plant rows, plus the 2 curated
 * confirmed-pork rows pork-tenderloin & bacon) and 75 alcohol (77 minus 2
 * alcohol-free products) = 668 rows removed from FOODS. The 8 protected
 * survivors (owner order: «لا تحذف الأغذية النباتية أو الدواجن أو
 * الأسماك أو المنتجات الخالية من هذه المكونات لمجرد تشابه الاسم»)
 * keep English nameAr and stay OUTSIDE the band. Deletion log + full
 * evidence: docs/FOOD-PORK-ALCOHOL-DELETION-2026-11-12.md.
 *
 * Outside the band: the 8 guardrail-protected rows only
 * (foods-sitemap-policy.test.ts pins the new tail fact).
 */

const ARABIC = /[\u0600-\u06FF]/;
const LATIN = /[A-Za-z]/;
const CJK = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

const bandFoods = FOODS.filter((f) => SEO_FOOD_BAND_SET.has(f.slug));

describe("foods-ar-purity (FOOD-ARABIZATION Phase 1–5 — the 8,076-slug band)", () => {
  it("band integrity: every manifest slug exists, is a USDA-tail row (tags empty), band size = final completion batch (8076)", () => {
    expect(bandFoods.length).toBe(SEO_FOOD_BAND.length);
    for (const slug of SEO_FOOD_BAND) {
      const f = getFoodBySlug(slug);
      expect(f !== undefined, `band slug missing from FOODS: ${slug}`).toBe(true);
      expect(
        f!.tags.length,
        `${slug}: band rows must keep tags EMPTY (no auto-curation)`,
      ).toBe(0);
    }
    // Phase 5 (final completion batch, owner order 2026-11-12): the band
    // now covers the whole translatable tail — 481 + 975 + 953 + 49 + 5,618.
    expect(SEO_FOOD_BAND.length).toBe(8076);
  });

  it("band law: nameAr is non-empty, Arabic, ZERO Latin, differs from nameEn", () => {
    const offenders: string[] = [];
    for (const f of bandFoods) {
      if (!f.nameAr.trim()) offenders.push(`${f.slug}: EMPTY nameAr`);
      if (!ARABIC.test(f.nameAr)) offenders.push(`${f.slug}: no Arabic «${f.nameAr}»`);
      if (LATIN.test(f.nameAr)) offenders.push(`${f.slug}: Latin letters «${f.nameAr}»`);
      if (f.nameAr === f.nameEn) offenders.push(`${f.slug}: identical to nameEn`);
    }
    expect(offenders.slice(0, 15), `band purity violations (${offenders.length})`).toEqual([]);
    expect(offenders.length).toBe(0);
  });

  it("band law: nameAr length 2-80 and CJK-free (Phase-191 batch rules)", () => {
    const offenders: string[] = [];
    for (const f of bandFoods) {
      if (f.nameAr.length < 2 || f.nameAr.length > 80)
        offenders.push(`${f.slug}: length ${f.nameAr.length} «${f.nameAr}»`);
      if (CJK.test(f.nameAr)) offenders.push(`${f.slug}: CJK «${f.nameAr}»`);
    }
    expect(offenders.slice(0, 15), `band length/CJK violations (${offenders.length})`).toEqual([]);
    expect(offenders.length).toBe(0);
  });

  it("band Arabic names are UNIQUE (distinct H1s / meta titles across the band)", () => {
    const names = bandFoods.map((f) => f.nameAr);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(
      dupes.map((n) => `«${n}»`),
      "duplicated Arabic names in band",
    ).toEqual([]);
  });

  it("FREEZE — the 78 curated rows are untouched (hand-written band canary — 2026-11-12: pork-tenderloin + bacon deleted per the pork/alcohol deletion order)", () => {
    const curated = FOODS.filter((f) => (f.tags?.length ?? 0) > 0);
    expect(curated.length).toBe(78);
    const payload = curated
      .map((f) =>
        [
          f.slug,
          f.nameAr,
          f.nameEn,
          f.category,
          f.defaultServingAr,
          f.defaultServingEn,
          String(f.defaultGrams),
          f.tags.join(","),
        ].join("|"),
      )
      .join("\n");
    // Pinned 2026-09-19 (pre-arabization snapshot); re-pinned 2026-11-12
    // after the PORK-ALCOHOL DELETION removed the curated confirmed-pork
    // rows pork-tenderloin + bacon (owner order). If this fails, the
    // curated band was edited — the translation line NEVER touches it.
    expect(sha256(payload)).toBe(
      "de7abeeaad9908cf98c83fdccb6fd3c2c153b921b8f82535d7761da88e1fe59b",
    );
  });

  it("FREEZE — the 8,162 slug identities (URL law: membership AND order — 2026-11-12: 668 pork/alcohol rows deleted)", () => {
    const payload = FOODS.map((f) => f.slug).join("\n");
    expect(FOODS.length).toBe(8162);
    // Pinned 2026-09-19; re-pinned 2026-11-12 after the pork/alcohol
    // deletion (668 rows removed). Any slug change/addition/removal/
    // reorder fails CI.
    expect(sha256(payload)).toBe(
      "81201df7afbf5a5985692897bc62e43aaf31d4b43d63d68a67a723def6939291",
    );
  });

  it("FREEZE — the band's English twins (nameEn immutable across batches)", () => {
    const payload = bandFoods.map((f) => `${f.slug}|${f.nameEn}`).join("\n");
    // Pinned 2026-09-19 after the Phase-3 expansion; re-pinned 2026-11-12
    // after the Phase-4 demand-filtered batch (+49 rows — Report 15 §5-B2);
    // re-pinned 2026-11-12 after Phase 5 (final completion batch +5,618 —
    // every nameEn still the verbatim USDA English name).
    expect(sha256(payload)).toBe(
      "e5d94a848288a458ee06c2199cfc97c0a93e98c16aba20504f1a71f6bc677198",
    );
  });

  it("incident canaries — Egyptian-diet staples lead with real Arabic now", () => {
    expect(getFoodBySlug("butter-salted")?.nameAr).toBe("زبدة مملحة");
    expect(getFoodBySlug("falafel-home-prepared")?.nameAr).toBe("طعمية — فلافل بيتية");
    expect(getFoodBySlug("jute-potherb-raw")?.nameAr).toBe("ملوخية — نيئة");
    expect(getFoodBySlug("fish-tilapia-raw")?.nameAr).toBe("سمك بلطي — نيء");
    expect(
      getFoodBySlug("broadbeans-fava-beans-mature-seeds-cooked-boiled-with-salt")
        ?.nameAr,
    ).toBe("فول مجفف — مسلوق بالملح");
    expect(getFoodBySlug("rice-white-medium-grain-raw-enriched")?.nameAr).toBe(
      "أرز أبيض متوسط الحبة — نيء",
    );
  });

  it("Phase-2 canaries — owner-ordered expansion batch (seafood · spices · Egyptian staples)", () => {
    expect(getFoodBySlug("dates-medjool")?.nameAr).toBe("بلح مجهول");
    expect(getFoodBySlug("quinces-raw")?.nameAr).toBe("سفرجل — نيء");
    expect(getFoodBySlug("grape-leaves-raw")?.nameAr).toBe("ورق عنب — نيء");
    expect(getFoodBySlug("roselle-raw")?.nameAr).toBe("كركديه — طازج");
    expect(getFoodBySlug("tamarinds-raw")?.nameAr).toBe("تمر هندي — نيء");
    expect(getFoodBySlug("spices-saffron")?.nameAr).toBe("زعفران");
    expect(getFoodBySlug("spices-cardamom")?.nameAr).toBe("هيل");
    expect(getFoodBySlug("spices-fenugreek-seed")?.nameAr).toBe("حلبة — حبوب");
    expect(getFoodBySlug("fish-grouper-mixed-species-raw")?.nameAr).toBe("سمك هامور — نيء");
    expect(getFoodBySlug("fish-whiting-mixed-species-raw")?.nameAr).toBe("سمك ميرلان (بحري) — نيء");
    expect(getFoodBySlug("pumpkin-raw")?.nameAr).toBe("يقطين — نيء");
    expect(getFoodBySlug("purslane-raw")?.nameAr).toBe("رجلة (بربيين) — نيئة");
    expect(getFoodBySlug("puddings-rice-ready-to-eat")?.nameAr).toBe("أرز باللبن — جاهز");
    expect(getFoodBySlug("chard-swiss-raw")?.nameAr).toBe("سلق — نيء");
    expect(getFoodBySlug("nuts-coconut-milk-canned-liquid-expressed-from-grated-meat-a")?.nameAr).toBe("حليب جوز الهند — معلب");
    expect(getFoodBySlug("oil-canola")?.nameAr).toBe("زيت الكانولا");
  });

  it("Phase-3 canaries — owner-ordered batch 3 (meat/organs · poultry · shellfish · soup · bakery · nuts)", () => {
    expect(getFoodBySlug("game-meat-rabbit-domesticated-composite-of-cuts-raw")?.nameAr).toBe("أرنب بلدي — نيء");
    expect(getFoodBySlug("game-meat-buffalo-water-raw")?.nameAr).toBe("جاموس الماء — نيء");
    expect(getFoodBySlug("beef-variety-meats-and-by-products-tripe-cooked-simmered")?.nameAr).toBe("كرشة بقري — مطهوة على نار هادئة");
    expect(getFoodBySlug("beef-new-zealand-imported-variety-meats-and-by-products-tong-7482")?.nameAr).toBe("لسان بقري مستورد — نيء");
    expect(getFoodBySlug("chicken-broilers-or-fryers-wing-meat-only-cooked-fried")?.nameAr).toBe("جناح دجاج — لحم فقط، مقلي");
    expect(getFoodBySlug("turkey-retail-parts-breast-meat-only-raw")?.nameAr).toBe("صدر رومي (قطع تجزئة) — لحم فقط، نيء");
    expect(getFoodBySlug("fish-salmon-pink-canned-drained-solids")?.nameAr).toBe("سلمون وردي معلب — مصفى");
    expect(getFoodBySlug("mollusks-octopus-common-cooked-moist-heat")?.nameAr).toBe("أخطبوط — مطهو");
    expect(getFoodBySlug("crustaceans-shrimp-raw-not-previously-frozen")?.nameAr).toBe("جمبري طازج — نيء");
    expect(getFoodBySlug("soup-cream-of-mushroom-canned-prepared-with-equal-volume-wat")?.nameAr).toBe("شوربة كريمة الفطر — محضرة بالماء");
    expect(getFoodBySlug("ground-turkey-93-lean-7-fat-patties-broiled")?.nameAr).toBe("برجر رومي مفروم 93/7 — مشوي");
    expect(getFoodBySlug("bread-naan-whole-wheat-commercially-prepared-refrigerated")?.nameAr).toBe("خبز نان بالقمح الكامل — جاهز مبرد");
    expect(getFoodBySlug("candies-halavah-plain")?.nameAr).toBe("حلاوة طحينية (هلاوة) — عادية");
    expect(getFoodBySlug("nuts-pine-nuts-pinyon-dried")?.nameAr).toBe("صنوبر مجفف");
    expect(getFoodBySlug("beverages-whey-protein-powder-isolate")?.nameAr).toBe("بروتين مصل اللبن المعزول — بودرة");
    expect(getFoodBySlug("yogurt-greek-strawberry-nonfat")?.nameAr).toBe("زبادي يوناني بالفراولة — خالي الدسم");
    expect(getFoodBySlug("orange-juice-raw")?.nameAr).toBe("عصير برتقال — طازج معصور");
    expect(getFoodBySlug("arugula-raw")?.nameAr).toBe("أروغولا (جرجير بري) — نيئة");
  });

  it("EN twins untouched — nameEn remains the USDA English name for the band", () => {
    expect(getFoodBySlug("butter-salted")?.nameEn).toBe("Butter, salted");
    expect(getFoodBySlug("falafel-home-prepared")?.nameEn).toBe("Falafel, home-prepared");
  });

  it("Phase-4 canaries — GSC-demand-filtered batch 4 (branded fast-food/retail rows led by McNuggets' 122 impressions)", () => {
    // The batch's #1 demand row + one cut + one cereal + one censored row
    // (pork excluded per band precedent — its slug must NOT be in the band).
    expect(getFoodBySlug("mcdonalds-chicken-mcnuggets")?.nameAr).toBe("ناجتس دجاج ماكدونالدز");
    expect(getFoodBySlug("mcdonalds-cheeseburger")?.nameAr).toBe("برجر جبنة ماكدونالدز");
    expect(getFoodBySlug("potatoes-baked-flesh-and-skin-without-salt")?.nameAr).toBe("بطاطس مشوية بالقشرة — دون ملح");
    expect(getFoodBySlug("sorghum-grain")?.nameAr).toBe("حبوب الذرة الرفيعة");
    expect(getFoodBySlug("teff-cooked")?.nameAr).toBe("حبوب التف — مطبوخة");
    expect(getFoodBySlug("snacks-potato-chips-plain-unsalted")?.nameAr).toBe("رقائق بطاطس عادية — دون ملح");
  });

  it("Phase-5 canaries — the final completion batch (deep-tail families the plan left for the owner decision)", () => {
    // Meat-cut deep tail (trim/grade variants the earlier dedupe batches skipped)
    expect(getFoodBySlug("beef-chuck-arm-pot-roast-separable-lean-and-fat-trimmed-to-0-3830")?.nameAr).toBe("بوت روست العضد بقري — لحم ودهن، مطهو، مطهو ببطء");
    // RTE cereal brands (the owner order opened the branded tail batch-4 style)
    expect(getFoodBySlug("cereals-ready-to-eat-kellogg-kelloggs-cocoa-krispies")?.nameAr).toBe("حبوب إفطار كيلوغز كوكوا كريسبيز");
    // Babyfood + infant formula
    expect(getFoodBySlug("babyfood-gerber-3rd-foods-apple-mango-and-kiwi")?.nameAr).toBe("طعام أطفال جيربر — تفاح ومانجو وكيوي");
    expect(getFoodBySlug("infant-formula-abbott-nutrition-similac-sensitive-lactose-fr")?.nameAr).toBe("حليب أطفال سيميلاك سينسيتيف — خالٍ من اللاكتوز، جاهز للتقديم بعنصري أرا ودها");
    // Tribal rows (translated factually)
    expect(getFoodBySlug("fish-whitefish-dried-alaska-native")?.nameAr).toBe("سمك أبيض — مجفف (قبائل ألاسكا)");
    // Restaurant + fast-food branded dishes
    expect(getFoodBySlug("mcdonalds-filet-o-fish")?.nameAr).toBe("فيليه-أو-فيش ماكدونالدز");
    // The pizza-chain inch families (quote chars must NEVER leak into nameAr)
    expect(getFoodBySlug("pizza-hut-14-cheese-pizza-stuffed-crust")?.nameAr).toBe("بيتزا جبنة بيتزا هت 14 بوصة — بقشرة محشوة");
    // Boundary pins — PORK-ALCOHOL DELETION (owner order 2026-11-12):
    // the former audience-fit exclusions are now DELETED from the catalog
    // entirely (getFoodBySlug → undefined), and the deleted slugs must
    // NEVER return to the band or the catalog without a named owner order.
    expect(SEO_FOOD_BAND_SET.has("pork-fresh-loin-tenderloin-separable-lean-only-raw")).toBe(false);
    expect(SEO_FOOD_BAND_SET.has("alcoholic-beverage-tequila-sunrise-canned")).toBe(false);
    expect(SEO_FOOD_BAND_SET.has("game-meat-boar-wild-raw")).toBe(false);
    expect(SEO_FOOD_BAND_SET.has("beverages-malt-liquor-beverage")).toBe(false);
    // …and the rows are GONE from the catalog (the deletion order's
    // completion criterion: no confirmed pork/alcohol food remains).
    expect(getFoodBySlug("pork-fresh-loin-tenderloin-separable-lean-only-raw")).toBeUndefined();
    expect(getFoodBySlug("game-meat-boar-wild-raw")).toBeUndefined();
    expect(getFoodBySlug("beverages-malt-liquor-beverage")).toBeUndefined();
    expect(getFoodBySlug("alcoholic-beverage-tequila-sunrise-canned")).toBeUndefined();
    expect(getFoodBySlug("lard")).toBeUndefined();
    expect(getFoodBySlug("pork-tenderloin")).toBeUndefined();
    expect(getFoodBySlug("bacon")).toBeUndefined();
    // …and the 8 guardrail-protected survivors (poultry/plant/alcohol-free)
    // stay in the catalog with English nameAr — outside the band.
    expect(getFoodBySlug("bacon-turkey-low-sodium")?.nameEn).toBe("Bacon, turkey, low sodium");
    expect(getFoodBySlug("bacon-meatless")?.nameEn).toBe("Bacon, meatless");
    expect(getFoodBySlug("beverages-wine-non-alcoholic")?.nameEn).toBe("Beverages, Wine, non-alcoholic");
  });
});
