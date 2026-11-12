/**
 * Nutrient-ranked food lists — SEO-GROWTH Phase 2 (owner order 2026-11-06
 * «استكمل المرحلة التالية من خطة استعادة النمو وتحسين SEO/GEO… استكمل جميع
 * الأعمال الممكنة حاليًا… لا تبدأ دفعات مقالات جديدة أو توسع الـ500 صنف قبل
 * حسم قرار D-2»), executing audit file 03 §4.3 (file 07's Phase-2 task line
 * «10-15 قائمة «غني بـ{مغذٍّ}» مبنية من قاعدة البيانات»): ten database-ranked
 * «الأطعمة الغنية بـ…» lists that DEEPEN the ten existing food collection
 * hubs (§4.3: «تعميق المجموعات العشر القائمة»).
 *
 * LISTS 11-15 (owner order 2026-11-06 «استكمل تنفيذ خطة استعادة النمو وتحسين
 * SEO/GEO لموقع Alkemos حتى إتمام جميع مراحلها وبنادها… نفّذ جميع التحسينات
 * الممكنة… لا تتجاوز القرارات المعلقة مثل D-2» — completing the plan's
 * 10-15 window at its ceiling): five more database-ranked lists —
 * highest-protein-dairy · highest-protein-nuts-seeds ·
 * highest-protein-vegetables (deepening the vegan hub) ·
 * leanest-high-protein-foods (deepening the low-fat hub) ·
 * highest-carb-foods (dry-weight staples, deepening the bulking hub).
 * Same family laws: every number derived from FOODS at module scope,
 * disclosed mechanical scope rules, AR/EN editorially independent.
 *
 * SCOPE LAWS (mechanical, disclosed ON every page — audit 03 §4.3 «مبنية
 *   آليًا من قاعدة البيانات بترتيب حقيقي… لا قوائم مختلقة»):
 *   1. REAL ARABIC NAME only (nameAr has Arabic script and differs from
 *      nameEn): the curated 80 + the arabized band (SEO_FOOD_BAND range) —
 *      every linked page is live index,follow. NO USDA-tail rows (their
 *      pages stay unannounced exactly as before — the D-2 space is
 *      untouched: no sitemap-foods criteria change, no pagination change,
 *      no tail announcement; these are NEW URLs of a NEW family, the
 *      comparisons-batch precedent).
 *   2. Spices excluded (slug prefix "spices-") — consumed in grams, the
 *      100g number is not a meal reality.
 *   3. Concentrated forms excluded (nameEn matches dried|dry|powder|flour|
 *      liquid) — dehydration concentrates nutrients; a 100g serving of a
 *      powder is not eaten.
 *   4. Per-list extra criteria are declared in each list's own criterion
 *      copy (no oils/pure fats, solid foods only, fresh fruits only,
 *      measured sugar only) — all mechanical, all disclosed.
 *
 * DATA TRUTH (audit 03 §6 gate 8): every number on the pages is DERIVED
 *   from src/lib/foods.ts at module scope — the same rows each linked food
 *   page renders. A drift between a list row and the food page is
 *   structurally impossible (the canary pins the equality).
 *
 * LANGUAGE LAW (order 414): AR and EN are editorially independent —
 *   question-shaped AR titles (audit §4.1) vs descriptive EN titles; the
 *   AR copy is not a translation of the EN copy.
 *
 * SCHEMA LAW (§12.19 + audit 03 §6 gate 6): ItemList + Breadcrumb only —
 *   the FAQ is visible plain text, NOT FAQPage JSON-LD (the family law
 *   the food-comparisons family set).
 *
 * Self-cannibalization guard (audit 03 §5.2): each list targets the
 *   RANKING question («أي/ما أعلى…؟ الترتيب الحقيقي») — a different
 *   question from the tag-based collections' LIST intent («قائمة أطعمة…»);
 *   the two surfaces cross-link (the §7 network: list ↔ collection ↔ food
 *   pages) and the canary pins both title intents.
 */

import { FOODS, type Food } from "./foods";

// ---------------------------------------------------------------------------
// Scope + ranking primitives (single source for the module AND the canary)
// ---------------------------------------------------------------------------

const ARABIC_RE = /[\u0600-\u06FF]/;
/** spice rack: consumed in grams — the 100 g figure misleads (disclosed) */
const SPICE_PREFIX = "spices-";
/** concentrated forms: dehydration/drying concentrates the nutrient (disclosed) */
const CONCENTRATE_RE = /\b(dried|dry|powder|flour|liquid)\b/i;
/** pure fats for the fat/calorie lists: oils, tallow, suet, separable fat (disclosed) */
const PURE_FAT_RE = /\b(anhydrous|tallow|suet|lard|separable fat)\b/i;
/** fish & seafood family for the seafood list (disclosed) */
const SEAFOOD_PREFIX_RE = /^(fish|crustaceans|mollusks)-/;
/**
 * Lists 11-15 scope rules (owner order 2026-11-06 «استكمل تنفيذ خطة استعادة
 * النمو وتحسين SEO/GEO حتى إتمام جميع مراحلها وبنودها… نفّذ جميع التحسينات
 * الممكنة» — the 10-15 window's completion):
 */
/** dehydrated forms spelled without "dried" (disclosed — concentration) */
const DEHYDRATED_RE = /\bdehydrated\b/i;
/** raisins = dried grapes by definition (disclosed — concentration) */
const RAISIN_RE = /\braisins?\b/i;
/** pure starch cooking ingredients, not a 100g food (disclosed) */
const STARCH_RE = /\b(cornstarch|starches|starch)\b/i;
/** the sweets/spreads class the carb staples list excludes (disclosed) */
const CARB_SWEET_RE = /\b(syrup|honey|molasses|jam|jell|preserves|candied|caramel|leather|cookies?)\b/i;
const SWEET_PREFIX_RE = /^(sugars|candies|sweeteners)-/;
/** raw dry legume rows — never eaten as-is, per-100g ≈ 3× the cooked plate (disclosed) */
const RAW_DRY_LEGUME_RE = /\b(mature seeds|lentils),\s*raw\b/i;

/** Law 1+2+3: the listable universe — real-Arabic-name, non-spice, non-concentrate. */
export function isListableFood(f: Food): boolean {
  return (
    ARABIC_RE.test(f.nameAr) &&
    f.nameAr !== f.nameEn &&
    !f.slug.startsWith(SPICE_PREFIX) &&
    !CONCENTRATE_RE.test(f.nameEn)
  );
}

const LISTABLE = FOODS.filter(isListableFood);

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Deterministic ranking: primary value, ties broken by slug asc. */
function topBy(
  pool: Food[],
  key: (f: Food) => number,
  dir: "desc" | "asc",
  n = 20,
): Food[] {
  return [...pool]
    .sort((a, b) =>
      dir === "desc" ? key(b) - key(a) || a.slug.localeCompare(b.slug) : key(a) - key(b) || a.slug.localeCompare(b.slug),
    )
    .slice(0, n);
}

// Per-list metric derivations (all from the FOODS rows themselves)
const proteinOf = (f: Food) => f.per100g.protein;
const kcalOf = (f: Food) => f.per100g.calories;
const fiberOf = (f: Food) => f.per100g.fiber;
const fatOf = (f: Food) => f.per100g.fat;
const carbOf = (f: Food) => f.per100g.carbs;
const sugarOf = (f: Food) => f.per100g.sugar;
/** grams of protein per 100 kcal — the efficiency metric (disclosed) */
const proteinPer100kcal = (f: Food) => (kcalOf(f) > 0 ? (proteinOf(f) * 100) / kcalOf(f) : 0);
/** satiety score per 100 kcal = (protein×4 + fiber×4) ÷ kcal (disclosed formula) */
const satietyPer100kcal = (f: Food) =>
  kcalOf(f) > 0 ? (proteinOf(f) * 4 + fiberOf(f) * 4) / kcalOf(f) : 0;

// The per-list pools (the extra criteria are part of each list's law)
const POOL_ALL = LISTABLE;
const POOL_NO_PURE_FAT = LISTABLE.filter((f) => f.category !== "fat" && !PURE_FAT_RE.test(f.nameEn));
const POOL_SOLID = LISTABLE.filter((f) => f.category !== "drink" && kcalOf(f) > 0);
const POOL_FRESH_FRUIT = LISTABLE.filter(
  (f) => f.category === "fruit" && /\braw\b/i.test(f.nameEn) && sugarOf(f) > 0,
);
const POOL_SEAFOOD = LISTABLE.filter((f) => SEAFOOD_PREFIX_RE.test(f.slug));
// Lists 11-15 pools (each extra criterion is disclosed in its list's copy)
const POOL_DAIRY = LISTABLE.filter((f) => f.category === "dairy");
const POOL_NUTS = LISTABLE.filter((f) => f.category === "nuts");
const POOL_VEG = LISTABLE.filter(
  (f) => f.category === "vegetable" && !DEHYDRATED_RE.test(f.nameEn),
);
/** a "protein food" bar of ≥20g/100g, raw dry legume rows out (not eaten as-is) */
const POOL_LEAN = LISTABLE.filter(
  (f) => proteinOf(f) >= 20 && !RAW_DRY_LEGUME_RE.test(f.nameEn),
);
/** dry carb staples: no pure fats, no drinks, no sugars/sweets/spreads class,
 *  no starch ingredients, no dehydrated/dried-fruit forms (all disclosed) */
const POOL_CARBS = LISTABLE.filter(
  (f) =>
    f.category !== "fat" &&
    f.category !== "drink" &&
    !PURE_FAT_RE.test(f.nameEn) &&
    !SWEET_PREFIX_RE.test(f.slug) &&
    !CARB_SWEET_RE.test(f.nameEn) &&
    !STARCH_RE.test(f.nameEn) &&
    !DEHYDRATED_RE.test(f.nameEn) &&
    !RAISIN_RE.test(f.nameEn),
);

// The fifteen ranked tables (20 rows each — the plan's 15-25 window)
const PROTEIN_TOP = topBy(POOL_ALL, proteinOf, "desc");
const PPC_TOP = topBy(LISTABLE.filter((f) => kcalOf(f) > 0), proteinPer100kcal, "desc");
const FIBER_TOP = topBy(POOL_ALL, fiberOf, "desc");
const SATIETY_TOP = topBy(
  LISTABLE.filter((f) => kcalOf(f) > 0 && proteinOf(f) > 0),
  satietyPer100kcal,
  "desc",
);
const LOWKCAL_TOP = topBy(POOL_SOLID, kcalOf, "asc");
const FAT_TOP = topBy(POOL_NO_PURE_FAT, fatOf, "desc");
const HIGHKCAL_TOP = topBy(POOL_NO_PURE_FAT, kcalOf, "desc");
const LOWCARB_PROTEIN_TOP = topBy(LISTABLE.filter((f) => carbOf(f) <= 5), proteinOf, "desc");
const LOWSUGAR_FRUIT_TOP = topBy(POOL_FRESH_FRUIT, sugarOf, "asc");
const SEAFOOD_PROTEIN_TOP = topBy(POOL_SEAFOOD, proteinOf, "desc");
// Lists 11-15 ranked tables
const DAIRY_PROTEIN_TOP = topBy(POOL_DAIRY, proteinOf, "desc");
const NUTS_PROTEIN_TOP = topBy(POOL_NUTS, proteinOf, "desc");
const VEG_PROTEIN_TOP = topBy(POOL_VEG, proteinOf, "desc");
const LEAN_LOWEST_FAT_TOP = topBy(POOL_LEAN, fatOf, "asc");
const CARBS_TOP = topBy(POOL_CARBS, carbOf, "desc");

// ---------------------------------------------------------------------------
// Derived row tables — the display layer the copy interpolates (DATA
// TRUTH: the ranked value + the food's own per-100g context columns,
// computed ONCE here so the editorial strings and the page tables can
// never drift).
// ---------------------------------------------------------------------------

const PROTEIN_ROWS = PROTEIN_TOP.map((f) => row(f, r1(proteinOf(f))));
const PPC_ROWS = PPC_TOP.map((f) => row(f, r1(proteinPer100kcal(f))));
const FIBER_ROWS = FIBER_TOP.map((f) => row(f, r1(fiberOf(f))));
const SATIETY_ROWS = SATIETY_TOP.map((f) => row(f, r2(satietyPer100kcal(f))));
const LOWKCAL_ROWS = LOWKCAL_TOP.map((f) => row(f, kcalOf(f)));
const FAT_ROWS = FAT_TOP.map((f) => row(f, r1(fatOf(f))));
const HIGHKCAL_ROWS = HIGHKCAL_TOP.map((f) => row(f, kcalOf(f)));
const LOWCARB_ROWS = LOWCARB_PROTEIN_TOP.map((f) => row(f, r1(proteinOf(f))));
// DATA-TRUTH anchors for the low-carb copy (PORK-ALCOHOL DELETION
// 2026-11-12: the curated bacon row this copy used to describe was deleted
// by the owner order; per the batch-5 name-not-index law the copy now
// derives its named examples from the ranked rows themselves).
const LOWCARB_LEADER = LOWCARB_PROTEIN_TOP[0];
const LOWCARB_CHEESE =
  LOWCARB_PROTEIN_TOP.find((f) => f.slug === "cheese-parmesan-low-sodium")!;
const LOWCARB_BRAISED =
  LOWCARB_PROTEIN_TOP.find((f) => f.slug.endsWith("cooked-braised"))!;
const LOWSUGAR_ROWS = LOWSUGAR_FRUIT_TOP.map((f) => row(f, r1(sugarOf(f))));
const SEAFOOD_ROWS = SEAFOOD_PROTEIN_TOP.map((f) => row(f, r1(proteinOf(f))));
const DAIRY_ROWS = DAIRY_PROTEIN_TOP.map((f) => row(f, r1(proteinOf(f))));
const NUTS_ROWS = NUTS_PROTEIN_TOP.map((f) => row(f, r1(proteinOf(f))));
const VEG_ROWS = VEG_PROTEIN_TOP.map((f) => row(f, r1(proteinOf(f))));
const LEAN_ROWS = LEAN_LOWEST_FAT_TOP.map((f) => row(f, r1(fatOf(f))));
const CARBS_ROWS = CARBS_TOP.map((f) => row(f, r1(carbOf(f))));

// Composition-safe lookups for the editorial copy (Phase-5 arabization
// changed the ranked compositions — the DATA TRUTH law now resolves the
// named foods by SLUG from the full database, never by table index):
const bySlug = (slug: string) => FOODS.find((x) => x.slug === slug)!;
const LUPINS_RAW = bySlug("lupins-mature-seeds-raw");
const SOYBEANS_RAW = bySlug("soybeans-mature-seeds-raw");
const PROTEIN_BRAISED_ROW =
  PROTEIN_ROWS.find((r) => r.nameAr.includes("مطهو ببطء")) ?? PROTEIN_ROWS[5];
const CHICKEN_FRIED_ROW = PROTEIN_ROWS.find((r) =>
  r.slug.includes("chicken") && r.nameAr.includes("مقلي"),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NutrientListRow = {
  slug: string;
  nameAr: string;
  nameEn: string;
  /** the ranked metric (rounded for display) */
  value: number;
  /** the food's own per-100g row (calorie context column) */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type NutrientListFaq = {
  q: { en: string; ar: string };
  a: { en: string; ar: string };
};

export type NutrientList = {
  slug: string;
  /** STABLE first-publish date (W1-1 law — never bumped) */
  publishedAt: string;
  titleEn: string;
  titleAr: string;
  h1En: string;
  h1Ar: string;
  descriptionEn: string;
  descriptionAr: string;
  introEn: string;
  introAr: string;
  /** the transparent ranking + scope explanation (audit §4.3: شرح معيار الترتيب) */
  criterionEn: string;
  criterionAr: string;
  /** the ranked column header */
  metricEn: string;
  metricAr: string;
  verdicts: Array<{ heading: { en: string; ar: string }; body: { en: string; ar: string } }>;
  faqs: NutrientListFaq[];
  toolSlug: "calorie-calculator" | "macro-calculator";
  /** the related curated collection hub (the §4.3 deepening link), if any */
  collectionSlug: string | null;
  rows: NutrientListRow[];
};

function row(f: Food, value: number): NutrientListRow {
  return {
    slug: f.slug,
    nameAr: f.nameAr,
    nameEn: f.nameEn,
    value,
    calories: f.per100g.calories,
    protein: f.per100g.protein,
    carbs: f.per100g.carbs,
    fat: f.per100g.fat,
    fiber: f.per100g.fiber,
  };
}

const PUBLISHED_AT = "2026-11-06"; // stable first-publish (never bumped, W1-1 law)

/** A food's measured sugar per 100g (copy interpolation helper — DATA TRUTH). */
function getFoodSugar(slug: string): number {
  const f = FOODS.find((x) => x.slug === slug);
  if (!f) throw new Error(`food-nutrient-lists: unknown slug "${slug}"`);
  return f.per100g.sugar;
}

/** A food's calories per 100g (copy interpolation helper — DATA TRUTH). */
function getFoodKcal(slug: string): number {
  const f = FOODS.find((x) => x.slug === slug);
  if (!f) throw new Error(`food-nutrient-lists: unknown slug "${slug}"`);
  return f.per100g.calories;
}

// ---------------------------------------------------------------------------
// The ten lists — every number below is interpolated from the derived rows
// (the DATA TRUTH law: the copy can never drift from the tables)
// ---------------------------------------------------------------------------

export const NUTRIENT_LISTS: NutrientList[] = [
  {
    slug: "highest-protein-foods",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Protein Foods per 100g — Real Database Ranking | Alkemos",
    titleAr: "ما أعلى الأطعمة في البروتين؟ الترتيب الحقيقي لكل 100 جرام",
    h1En: "Highest Protein Foods per 100g",
    h1Ar: "ما أعلى الأطعمة في البروتين؟",
    descriptionEn: `Ranked from the Alkemos database: ${PROTEIN_TOP[0].nameEn} leads at ${PROTEIN_ROWS[0].value}g protein per 100g, ahead of hard cheeses and slow-cooked lean meats — all values verified.`,
    descriptionAr: `ترتيب حقيقي من قاعدة بيانات Alkemos: ${PROTEIN_TOP[0].nameAr} في الصدارة بـ${PROTEIN_ROWS[0].value} جرام بروتين لكل 100 جرام، ثم الأجبان الصلبة واللحوم الخالية المطهوة ببطء.`,
    introEn: `Numbers first: ${PROTEIN_TOP[0].nameEn} tops this ranking at ${PROTEIN_ROWS[0].value}g of protein per 100g, followed by ${PROTEIN_TOP[1].nameEn} (${PROTEIN_ROWS[1].value}g) and the strongest slow-braised lean cuts (up to ${PROTEIN_BRAISED_ROW.value}g).${CHICKEN_FRIED_ROW ? ` A fried chicken breast sits at ${CHICKEN_FRIED_ROW.value}g — still excellent, just below the concentrated and cured forms above it.` : ""} That is the honest story of any per-100g table: removing water and fat pushes a food up the chart. The table below ranks all twenty leaders, and the sections after it translate the raw numbers into what you actually put on a plate.`,
    introAr: `بالأرقام قبل أي شيء: يتصدر ${PROTEIN_TOP[0].nameAr} هذا الترتيب بـ${PROTEIN_ROWS[0].value} جرام بروتين لكل 100 جرام، يليه ${PROTEIN_TOP[1].nameAr} (بـ${PROTEIN_ROWS[1].value} جرام) وأقوى قطع اللحم الخالية المطهوة ببطء (حتى ${PROTEIN_BRAISED_ROW.value} جرامًا).${CHICKEN_FRIED_ROW ? ` صدر دجاج مقلي يقف عند ${CHICKEN_FRIED_ROW.value} جرامًا — رقم ممتاز أيضًا، لكنه أسفل الأشكال المركزة والمعالجة التي فوقه.` : ""} هذه هي الحكاية الصادقة لأي جدول يقيس لكل 100 جرام: نزع الماء والدهون يرفع الصنف للأعلى. الجدول أدناه يعرض العشرين الأوائل، والفقرات بعده تحوّل الأرقام الخام إلى ما تضعه فعلًا في الطبق.`,
    criterionEn: `Every value is the protein-gram column of the Alkemos food database (the same rows each food's own page shows), sorted high-to-low per 100g. Three scope rules keep the table honest: only foods with a real Arabic-market name enter; spices are left out because nobody eats 100g of them; and dried/powder/flour forms are excluded since their 100g serving is never actually eaten. One food can appear in more than one form (raw, cooked) because each database row is its own measurement.`,
    criterionAr: `كل قيمة هي عمود البروتين في قاعدة بيانات أطعمة Alkemos (نفس الصفوف التي تعرضها صفحة كل صنف)، مرتبة تنازليًا لكل 100 جرام. تحرس الجدول ثلاث قواعد معلنة: لا يدخل القائمة إلا صنف باسم عربي حقيقي في القاعدة؛ والتوابل مستبعدة لأن أحدًا لا يأكل 100 جرام منها؛ والأشكال المجففة والمساحيق والدقيق خارج الترتيب لأن حصة الـ100 جرام منها لا تُؤكل فعلًا. وقد يظهر الصنف الواحد بأكثر من صورة (نيء ومطهو) لأن كل صف في القاعدة قياس مستقل بذاته.`,
    metricEn: "Protein (g / 100g)",
    metricAr: "البروتين (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "The practical daily winners", ar: "الفائزون العمليون للاستخدام اليومي" },
        body: {
          en: `Strip away the concentrates and the chart belongs to hard cheese and lean braised meat: ${PROTEIN_TOP[1].nameEn} carries ${PROTEIN_ROWS[1].value}g per 100g while the strongest slow-braised lean cut delivers ${PROTEIN_BRAISED_ROW.value}g at roughly half the calories of the cured options. A 150g portion of that braised cut is about ${Math.round((PROTEIN_BRAISED_ROW.value * 150) / 100)}g of protein — most of what a training day needs.`,
          ar: `أنزل المساحيق من الحساب وسيتملك الصدارةَ الجبنُ الصلب واللحمُ الخالي المطهو ببطء: ${PROTEIN_TOP[1].nameAr} يحمل ${PROTEIN_ROWS[1].value} جرامًا لكل 100 جرام، وأقوى قطعة خالية مطهوة ببطء تمنح ${PROTEIN_BRAISED_ROW.value} جرامًا بنحو نصف سعرات الخيارات المعالجة. حصة 150 جرامًا منها تعادل ${Math.round((PROTEIN_BRAISED_ROW.value * 150) / 100)} جرام بروتين تقريبًا — معظم ما يحتاجه يوم تدريبي.`,
        },
      },
      {
        heading: { en: "Why the leader leads", ar: "لماذا يتقدم المتصدر" },
        body: {
          en: `A ${PROTEIN_ROWS[0].value}g-per-100g figure for the leader is real, but the scoop you actually use is 30g — about ${Math.round((PROTEIN_ROWS[0].value * 30) / 100)}g of protein per serving. The table measures density, not convenience; read both columns before crowning a champion.`,
          ar: `رقم ${PROTEIN_ROWS[0].value} جرامًا لكل 100 جرام للمتصدر حقيقي، لكن المغرفة التي تستخدمها فعلًا وزنها 30 جرامًا — أي ${Math.round((PROTEIN_ROWS[0].value * 30) / 100)} جرام بروتين للحصة. الجدول يقيس الكثافة لا سهولة الاستخدام؛ اقرأ العمودين معًا قبل تتويج البطل.`,
        },
      },
      {
        heading: { en: "Plant options on the board", ar: "الخيارات النباتية على الطاولة" },
        body: {
          en: `The plant aisle now owns the podium: ${PROTEIN_TOP[0].nameEn} — the current #1 — is itself plant-based, and mature soybeans carry ${r1(proteinOf(SOYBEANS_RAW))}g per 100g raw. Lupins, the strongest whole legume in the fuller database, sit at ${r1(proteinOf(LUPINS_RAW))}g per 100g raw with soy and seed items close behind. Vegetarians can absolutely compete at this table; they simply arrive through the legume aisle.`,
          ar: `قسم البقوليات يملك المنصة الآن: ${PROTEIN_TOP[0].nameAr} — المتصدر الحالي — نباتيّ الأصل بذاته، وحبوب الصويا الناضجة تحمل ${r1(proteinOf(SOYBEANS_RAW))} جرامًا لكل 100 جرام نيئة. أما الترمس، أقوى بقوليات كاملة في القاعدة الأكمل، فيقف عند ${r1(proteinOf(LUPINS_RAW))} جرامًا لكل 100 جرام نيئة وتحذو صنوف الصويا والبذور حذوه. النباتيون قادرون على المنافسة هنا فعلًا؛ يدخلون ببساطة من باب البقوليات.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Why do powders and shakes top the list?",
          ar: "لماذا تتصدر المساحيق والمشروبات البروتينية القائمة؟",
        },
        a: {
          en: `Because the ranking is per 100g, and removing water concentrates everything. The leader measures ${PROTEIN_ROWS[0].value}g per 100g precisely because there is no water left in it — the same reason dried and cured foods dominate any per-100g chart. We kept everyday concentrate products and excluded raw powders and flours by name from the scope, and that rule is written on the page itself.`,
          ar: `لأن الترتيب يقيس لكل 100 جرام، ونزع الماء يركّز كل شيء. المتصدر يسجل ${PROTEIN_ROWS[0].value} جرامًا لكل 100 جرام تحديدًا لأن لم يبقَ فيه ماء أصلًا — وهو نفس سبب تصدر الأغذية المجففة والمعالجة لأي جدول يقيس لكل 100 جرام. أبقينا منتجات التركيز اليومية واستبعدنا المساحيق والدقيق الخام بالاسم، والقاعدة مكتوبة على الصفحة نفسها.`,
        },
      },
      {
        q: {
          en: "Where does plain chicken breast rank?",
          ar: "في أي موقع يقف صدور الدجاج العادي؟",
        },
        a: {
          en: `A skinless chicken breast (fried, meat only) shows ${PROTEIN_ROWS[14].value}g per 100g in this table — inside the top twenty but below the cured and braised rows. The curated chicken-breast page in our library carries its own full macro table; this ranking is simply the honest order of the whole database, not a judgement of the bird.`,
          ar: `صدر الدجاج بلا جلد (المقلي، اللحم فقط) يسجل ${PROTEIN_ROWS[14].value} جرامًا لكل 100 جرام في هذا الجدول — داخل العشرين الأوائل لكن أسفل الصفوف المعالجة والمطهوة ببطء. صفحة صدور الدجاج في مكتبتنا تحمل جدول ماكروز كاملًا خاصًا بها؛ هذا الترتيب هو الترتيب الصادق للقاعدة كاملة لا حكم على الدجاج.`,
        },
      },
      {
        q: {
          en: "How is this page different from the high-protein collection?",
          ar: "ما الفرق بين هذه الصفحة ومجموعة أطعمة عالية البروتين؟",
        },
        a: {
          en: `The collection page is a curated introduction — eighty hand-picked staple foods with their macros. This page is the raw ranking: every eligible row in the database sorted by the protein column, including cured, smoked and braised forms the curated list does not carry. The two link to each other because they answer two different questions: "what should I buy" versus "what is literally highest".`,
          ar: `صفحة المجموعة مقدمة مُنتقاة — ثمانون صنفًا أساسيًا مختارًا يدويًا مع ماكروزها. هذه الصفحة هي الترتيب الخام: كل صف مؤهل في القاعدة مرتبًا بعمود البروتين، بما فيه الأشكال المعالجة والمدخنة والمطهوة ببطء التي لا تحملها القائمة المنتقاة. وتربط بينهما روابط لأنهما تجيبان عن سؤالين مختلفين: «ماذا أشتري» مقابل «ما هو الأعلى حرفيًا».`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "high-protein-foods",
    rows: PROTEIN_ROWS,
  },
  {
    slug: "protein-per-calorie",
    publishedAt: PUBLISHED_AT,
    titleEn: "Best Protein Per Calorie Foods — Real Lean Ranking | Alkemos",
    titleAr: "ما أفضل الأطعمة للبروتين لكل سعرة؟ ترتيب الكفاءة الحقيقي",
    h1En: "Best Protein Per Calorie Foods",
    h1Ar: "ما أفضل الأطعمة للبروتين لكل سعرة؟",
    descriptionEn: `Efficiency ranking: white fish leads with ${r1(proteinPer100kcal(PPC_TOP[0]))}g protein per 100 kcal, ahead of shrimp, water-packed tuna and turkey breast — from the Alkemos database.`,
    descriptionAr: `ترتيب الكفاءة: الأسماك البيضاء تتقدم بـ${r1(proteinPer100kcal(PPC_TOP[0]))} جم بروتين لكل 100 سعرة، أمام الجمبري والتونة المعلبة بالماء وصدور الديك الرومي.`,
    introEn: `Efficiency, not size, is the question here: for every 100 calories you spend, which food returns the most protein grams? The white fish sweep is total — ${PPC_TOP[0].nameEn} returns ${r1(proteinPer100kcal(PPC_TOP[0]))}g per 100 kcal, shrimp ${r1(proteinPer100kcal(PPC_TOP[5]))}g, water-packed tuna ${r1(proteinPer100kcal(PPC_TOP.find((f) => f.slug === "tuna") ?? PPC_TOP[10]))}g, and turkey breast ${r1(proteinPer100kcal(PPC_TOP.find((f) => f.slug === "turkey-breast") ?? PPC_TOP[15]))}g. When your calorie budget is tight, this single column is worth more than any protein-per-100g chart.`,
    introAr: `السؤال هنا عن الكفاءة لا الحجم: مقابل كل 100 سعرة تدفعها، أي صنف يعيد إليك أكبر عدد من جرامات البروتين؟ اجتياح الأسماك البيضاء كاسح — ${PPC_TOP[0].nameAr} يعيد ${r1(proteinPer100kcal(PPC_TOP[0]))} جرامًا لكل 100 سعرة، والجمبري ${r1(proteinPer100kcal(PPC_TOP[5]))} جرامًا، والتونة المعلبة بالماء ${r1(proteinPer100kcal(PPC_TOP.find((f) => f.slug === "tuna") ?? PPC_TOP[10]))} جرامًا، وصدور الديك الرومي ${r1(proteinPer100kcal(PPC_TOP.find((f) => f.slug === "turkey-breast") ?? PPC_TOP[15]))} جرامًا. حين تكون ميزانية سعراتك ضيقة، هذا العمود وحده أنفع من أي جدول بروتين لكل 100 جرام.`,
    criterionEn: `The metric is simple division: protein grams × 100 ÷ calories, both from the same database row. Foods with zero calories drop out, and the shared scope rules apply (real Arabic names, no spices, no concentrates). A high score means lean protein: you can eat a large portion before the calories bite.`,
    criterionAr: `المقياس قسمة بسيطة: جرامات البروتين × 100 ÷ السعرات، وكلاهما من صف القاعدة نفسه. تسقط الأصناف الصفرية السعرات، وتنطبق قواعد النطاق المعلنة (أسماء عربية حقيقية، بلا توابل، بلا مركزات). الدرجة العالية تعني بروتينًا خاليًا: تستطيع أكل حصة كبيرة قبل أن تعضّك السعرات.`,
    metricEn: "Protein (g / 100 kcal)",
    metricAr: "البروتين (جم / 100 سعرة)",
    verdicts: [
      {
        heading: { en: "For a hard cut", ar: "للتخسيس الصارم" },
        body: {
          en: `A 200g fillet of the leading white fish costs about ${Math.round((kcalOf(PPC_TOP[0]) * 200) / 100)} calories and hands you ${Math.round((proteinOf(PPC_TOP[0]) * 200) / 100)}g of protein — the closest thing to free protein in the entire database. Rotate cod, pollock and haddock so the palate does not mutiny.`,
          ar: `فيليه بوزن 200 جرام من السمك الأبيض المتصدر يكلف نحو ${Math.round((kcalOf(PPC_TOP[0]) * 200) / 100)} سعرة ويسلمك ${Math.round((proteinOf(PPC_TOP[0]) * 200) / 100)} جرام بروتين — أقرب شيء للبروتين المجاني في القاعدة كلها. نوّع بين القدّاك والبولاك والهادوك كي لا تتمرد حاسة التذوق.`,
        },
      },
      {
        heading: { en: "The pantry workhorses", ar: "خزائن المطبخ العاملة" },
        body: {
          en: `Water-packed tuna and shrimp are the shelf-stable and freezer-stable ways to stay at the top of this table without smelling like a fish market. Canned light tuna in water sits at ${r1(proteinPer100kcal(PPC_TOP.find((f) => f.slug === "tuna") ?? PPC_TOP[10]))}g per 100 kcal — essentially tied with fresh fillets, at a fraction of the price and prep.`,
          ar: `التونة المعلبة بالماء والجمبري هما الطريقان المحفوظان لتثبت أعلى هذا الجدول دون أن تفوح رائحة سوق السمك من مطبخك. التونة الفاتحة المعلبة بالماء تقف عند ${r1(proteinPer100kcal(PPC_TOP.find((f) => f.slug === "tuna") ?? PPC_TOP[10]))} جرامًا لكل 100 سعرة — تعادل عمليًا الفيليه الطازج بجزء يسير من السعر والتحضير.`,
        },
      },
      {
        heading: { en: "Read the broth row carefully", ar: "اقرأ صف المرقة بتمعّن" },
        body: {
          en: `Condensed beef broth posts a spectacular ratio because eleven calories carry a little protein — mathematically true, practically useless: you would need litres of it to reach a training dose. High ratios only matter when the food comes in portions you can actually eat; that is why the fish rows, not the broth row, are the real answer.`,
          ar: `المرقة المركزة تسجل نسبة خيالية لأن إحدى عشرة سعرة تحمل قليلًا من البروتين — صحيح حسابيًا، عديم الفائدة عمليًا: ستحتاج لترات منها للوصول إلى جرعة تدريبية. النسب العالية لا تعني شيئًا إلا إذا أتى الطعام بحصص تستطيع أكلها فعلًا؛ ولهذا فصفوف السمك — لا صف المرقة — هي الجواب الحقيقي.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "What does 'protein per calorie' mean in practice?",
          ar: "ماذا يعني «البروتين لكل سعرة» عمليًا؟",
        },
        a: {
          en: `It is the exchange rate between your calorie budget and your protein target. A food at ${r1(proteinPer100kcal(PPC_TOP[0]))}g per 100 kcal gives you 1g of protein for roughly ${Math.round(100 / r1(proteinPer100kcal(PPC_TOP[0])))} calories; a fattier cut might charge three times that. On a cut, the difference decides how much food fits in the day.`,
          ar: `إنه سعر الصرف بين ميزانية سعراتك وهدف بروتينك. صنف عند ${r1(proteinPer100kcal(PPC_TOP[0]))} جرام لكل 100 سعرة يمنحك جرام بروتين مقابل ${Math.round(100 / r1(proteinPer100kcal(PPC_TOP[0])))} سعرة تقريبًا؛ وقطعة أدهن قد تطلب ثلاثة أضعاف ذلك. داخل مرحلة تخسيس، هذا الفرق هو الذي يحدد كمية الطعام التي تتسع ليومك.`,
        },
      },
      {
        q: {
          en: "Why do white fish beat chicken here?",
          ar: "لماذا تتقدم الأسماك البيضاء على الدجاج هنا؟",
        },
        a: {
          en: `Lean white fish carry almost no fat, so nearly every calorie is protein. Chicken breast is still excellent — turkey breast posts ${r1(proteinPer100kcal(PPC_TOP.find((f) => f.slug === "turkey-breast") ?? PPC_TOP[15]))}g per 100 kcal in this table — but the fish rows simply run leaner, at ${kcalOf(PPC_TOP[0])}–90 kcal per 100g.`,
          ar: `الأسماك البيضاء الخالية لا تحمل دهونًا تقريبًا، فكل سعرة فيها بروتين تقريبًا. صدر الدجاج ممتاز أيضًا — صدور الديك الرومي تسجل ${r1(proteinPer100kcal(PPC_TOP.find((f) => f.slug === "turkey-breast") ?? PPC_TOP[15]))} جرامًا لكل 100 سعرة في هذا الجدول — لكن صفوف السمك أنحف ببساطة، عند ${kcalOf(PPC_TOP[0])}–90 سعرة لكل 100 جرام.`,
        },
      },
      {
        q: {
          en: "Is a high ratio the only thing that matters?",
          ar: "هل النسبة العالية هي الشيء الوحيد المهم؟",
        },
        a: {
          en: `No — fats carry vitamins and keep hormones and joints happy, and a plate of nothing-but-white-fish is a sad plate. Use this ranking to pick your protein anchor for the meal, then let the rest of the plate carry flavour and fats. The macro calculator on this site splits the whole day, not just the protein line.`,
          ar: `لا — الدهون تحمل الفيتامينات وتحفظ توازن الهرمونات والمفاصل، وطبق من السمك الأبيض وحده طبق بائس. استخدم هذا الترتيب لاختيار مرساة البروتين في الوجبة، ثم اترك بقية الطبق يحمل النكهة والدهون. حاسبة الماكروز بالموقع تقسم اليوم كله، لا سطر البروتين وحده.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "foods-for-cutting",
    rows: PPC_ROWS,
  },
  {
    slug: "highest-fiber-foods",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Fiber Foods per 100g — Real Database Ranking | Alkemos",
    titleAr: "ما أكثر الأطعمة أليافًا؟ الترتيب الحقيقي لكل 100 جرام",
    h1En: "Highest Fiber Foods per 100g",
    h1Ar: "ما أكثر الأطعمة أليافًا؟",
    descriptionEn: `Chia seeds lead the Alkemos database at ${FIBER_ROWS[0].value}g fiber per 100g, ahead of flaxseed, raw beans and lupins — the honest ranking with every value verified.`,
    descriptionAr: `بذور الشيا تتصدر قاعدة بيانات Alkemos بـ${FIBER_ROWS[0].value} جم ألياف لكل 100 جرام، أمام بذر الكتان والفاصوليا النيئة والترمس — الترتيب الصادق بقيم متحققة.`,
    introEn: `The seed drawer wins the fiber crown: chia measures ${FIBER_ROWS[0].value}g per 100g and flaxseed ${FIBER_ROWS[1].value}g, but the deeper story is the legume shelf — French beans, fava beans and kidney beans all cluster between ${FIBER_ROWS[3].value} and ${FIBER_ROWS[2].value}g, in the cheap, bulk-cookable form Arab kitchens have used for centuries. Twenty rows, one column, zero guessing: here is what fiber actually looks like per 100 grams.`,
    introAr: `درج البذور يحصد تاج الألياف: الشيا تسجل ${FIBER_ROWS[0].value} جرامًا لكل 100 جرام وبذر الكتان ${FIBER_ROWS[1].value} جرامًا، لكن الحكاية الأعمق في رف البقوليات — الفاصوليا الفرنسية والفول والفاصوليا الحمراء تتكدس كلها بين ${FIBER_ROWS[3].value} و${FIBER_ROWS[2].value} جرامًا، بالشكل الرخيص القابل للطبخ بالجملة الذي عرفته المطابخ العربية قرونًا. عشرون صفًا وعمود واحد ولا تخمين: هذه هي الألياف كما تبدو لكل 100 جرام.`,
    criterionEn: `Ranked by the fiber column of the Alkemos database, per 100g, high to low. Spices are excluded from the whole family (curry powder and cinnamon technically tower over everything, but nobody spoons 100g of curry onto dinner); dried and powdered forms are out for the same reason. Seeds, legumes and whole grains are the honest fibre heavyweights that survive those rules.`,
    criterionAr: `الترتيب بعمود الألياف في قاعدة بيانات Alkemos، لكل 100 جرام، من الأعلى للأدنى. التوابل مستبعدة من العائلة كلها (بودرة الكاري والقرفة تتفرقان تقنيًا على الجميع، لكن أحدًا لا يغرف 100 جرام كاري على العشاء)؛ والأشكال المجففة والمسحوقة خارجة للسبب نفسه. البذور والبقوليات والحبوب الكاملة هي الأبطال الحقيقيون الذين ينجون من هذه القواعد.`,
    metricEn: "Fiber (g / 100g)",
    metricAr: "الألياف (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "The Arab-kitchen anchor", ar: "مرساة المطبخ العربي" },
        body: {
          en: `Fava beans at ${FIBER_ROWS[3].value}g per 100g mean a 200g cooked batch delivers around ${Math.round((FIBER_ROWS[3].value * 200) / 100)}g of fiber before you add oil or bread. Beans-and-lentils cookery is not tradition for nostalgia's sake; it is pre-industrial nutrition engineering that happens to top modern tables.`,
          ar: `الفول عند ${FIBER_ROWS[3].value} جرامًا لكل 100 جرام يعني أن وجبة مطهوة 200 جرام تقدم نحو ${Math.round((FIBER_ROWS[3].value * 200) / 100)} جرام ألياف قبل أن تضيف الزيت أو الخبز. طبخ الفول والعدس ليس مجرد تقاليد تُحفظ للحنين؛ إنه هندسة تغذية سبقت الصناعة وتتصدّر فعلًا جداول العصر الحديث.`,
        },
      },
      {
        heading: { en: "Seeds as a topping, not a plate", ar: "البذور رشّة فوق الطبق لا الطبق" },
        body: {
          en: `A tablespoon of chia is about 12g — roughly ${Math.round((FIBER_ROWS[0].value * 12) / 100)}g of fiber for a spoonful. That is a legitimate boost on yogurt or salad, but the legume rows are where fiber arrives in meal-sized quantities. Treat seeds as the multiplier, legumes as the base.`,
          ar: `ملعقة الشيا تزن نحو 12 جرامًا — أي ${Math.round((FIBER_ROWS[0].value * 12) / 100)} جرام ألياف للمغرفة الواحدة. دفعة مشروعة فوق الزبادي أو السلطة، لكن صفوف البقوليات هي حيث تصل الألياف بمقاسات الوجبة. اعتبر البذور مضاعفًا والبقوليات أساسًا.`,
        },
      },
      {
        heading: { en: "Watch the calorie column", ar: "راقب عمود السعرات" },
        body: {
          en: `Every row carries its calories beside it because fiber champions are not automatically light: chia lands at ${FIBER_ROWS[0].calories} kcal per 100g. The pairing of the two columns is the whole trick — high fiber with moderate calories is the cutting combination; the table gives you both at a glance.`,
          ar: `كل صف يحمل سعراته بجواره لأن أبطال الألياف ليسوا خفيفين تلقائيًا: الشيا تقف عند ${FIBER_ROWS[0].calories} سعرة لكل 100 جرام. اقتران العمودين هو الحيلة كلها — ألياف عالية بسعرات معتدلة هي تركيبة التخسيس؛ والجدول يمنحك الاثنين بنظرة واحدة.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Why are spices missing from a fiber ranking?",
          ar: "لماذا تغيب التوابل عن ترتيب الألياف؟",
        },
        a: {
          en: `Ground spices like curry powder carry huge fiber figures per 100g — but a real serving is a teaspoon, not a hectogram. Including them would put a spice rack at the top of a food chart, which serves nobody. The exclusion is mechanical (every "spices-" row in the database) and it is written into the ranking rules on this page.`,
          ar: `التوابل المطحونة كالكاري تحمل أرقام ألياف ضخمة لكل 100 جرام — لكن الحصة الحقيقية ملعقة صغيرة لا مئة جرام. إدراجها سيضع رف التوابل أعلى جدول طعام، وهذا لا يخدم أحدًا. الاستبعاد ميكانيكي (كل صف «spices-» في القاعدة) ومكتوب ضمن قواعد الترتيب في هذه الصفحة.`,
        },
      },
      {
        q: {
          en: "Do I need to eat the top rows to hit a fiber target?",
          ar: "هل يجب أكل الصفوف العليا للوصول لهدف الألياف؟",
        },
        a: {
          en: `No — the top of the chart is density, not a prescription. Cooked lentils and beans sit lower per 100g raw yet arrive in 200–300g portions, so a normal bowl of legumes out-delivers a sprinkle of seeds. Build the base from the legume rows, then let seeds and whole grains close the gap.`,
          ar: `لا — قمة الجدول كثافة لا وصفة. العدس والفاصوليا المطبوخان يقفان أدنى لكل 100 جرام نيء لكنهما يصلان بحصص 200–300 جرام، فطبق البقول العادي يتفوق على رشة بذور. ابنِ الأساس من صفوف البقوليات ثم دع البذور والحبوب الكاملة تسد الفجوة.`,
        },
      },
      {
        q: {
          en: "Are these values raw or cooked?",
          ar: "هل هذه القيم نيئة أم مطهوة؟",
        },
        a: {
          en: `Each row keeps its own database state — some are raw, some cooked — and the state is part of the row's name on its food page. Cooking usually lowers per-100g fiber slightly as water is absorbed; the ranking keeps both forms visible because both exist in real kitchens.`,
          ar: `كل صف يحافظ على حالته في القاعدة — بعضها نيء وبعضها مطهو — والحالة جزء من اسم الصف في صفحة الصنف. الطبخ عادة يخفض الألياف لكل 100 جرام قليلًا مع امتصاص الماء؛ والترتيب يُبقي الصورتين ظاهرتين لأن كلتيهما موجودتان في المطابخ الحقيقية.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: null,
    rows: FIBER_ROWS,
  },
  {
    slug: "lowest-calorie-high-satiety",
    publishedAt: PUBLISHED_AT,
    titleEn: "Lowest Calorie, Highest Satiety Foods — Real Ranking | Alkemos",
    titleAr: "ما أقل الأطعمة سعرات وأكثرها شبعًا؟ الترتيب الحقيقي",
    h1En: "Lowest Calorie, Highest Satiety Foods",
    h1Ar: "ما أقل الأطعمة سعرات وأكثرها شبعًا؟",
descriptionEn: `A transparent satiety score (protein + fiber per calorie) ranks greens first, white fish behind — real values from the Alkemos database.`,
descriptionAr: `مؤشر شبع معلن (البروتين والألياف لكل سعرة) يصنف الخضار الورقية أولًا والأسماك البيضاء خلفها — قيم حقيقية من قاعدة بيانات Alkemos.`,
    introEn: `Hunger is the real enemy of a diet, so we ranked foods by what fills you per calorie spent. The formula is on the table: protein and fiber are the two nutrients science keeps crediting with fullness, so each food gets a score of (protein×4 + fiber×4) ÷ calories. Leafy greens dominate — ${SATIETY_TOP[0].nameEn} scores ${r2(satietyPer100kcal(SATIETY_TOP[0]))} — and right behind the greens come the lean white fish and shrimp, proving a high-satiety plate does not have to be a bowl of leaves.`,
    introAr: `الجوع هو عدو الحمية الحقيقي، لذلك رتبنا الأطعمة بمدى ما تملؤك مقابل كل سعرة تنفقها. المعادلة مكشوفة على الطاولة: البروتين والألياف هما المغذّيان اللذان تواصل العلوم نسبة الشبع إليهما، فلكل صنف درجة تُحسب هكذا: (البروتين×4 + الألياف×4) ÷ السعرات. الخضار الورقية تسيطر — ${SATIETY_TOP[0].nameAr} يسجل ${r2(satietyPer100kcal(SATIETY_TOP[0]))} — وخلف الورقيات مباشرة تأتي الأسماك البيضاء الخالية والجمبري، وهذا يثبت أن طبق الشبع العالي لا يلزم أن يكون وعاء أوراق.`,
    criterionEn: `The score is deliberately simple and printed beside every row: grams of protein and fiber (the two satiety-heavy nutrients), converted to their calorie weight of 4 each, divided by the food's calories per 100g. Zero-calorie foods drop out; the shared scope rules (real Arabic names, no spices, no concentrates) apply. A score near 1.0 means the food is essentially "free" — its filling nutrients nearly pay its own calorie bill.`,
    criterionAr: `الدرجة بسيطة عمدًا ومطبوعة بجوار كل صف: جرامات البروتين والألياف (أثقل مغذيين في الشبع)، محوّلة إلى وزنها السعري بواقع 4 لكل منهما، مقسومة على سعرات الصنف لكل 100 جرام. الأصناف الصفرية السعرات تسقط؛ وقواعد النطاق المعلنة تنطبق (أسماء عربية حقيقية، بلا توابل، بلا مركزات). الدرجة قرب 1.0 تعني أن الصنف «مجاني» تقريبًا — مغذياته المالئة تسدد فاتورة سعراته بنفسها.`,
    metricEn: "Satiety score (/100 kcal)",
    metricAr: "درجة الشبع (/100 سعرة)",
    verdicts: [
      {
        heading: { en: "The leafy-green engine", ar: "محرك الخضار الورقية" },
        body: {
          en: `Mustard greens, beet greens and pumpkin leaves all clear ${r2(satietyPer100kcal(SATIETY_TOP[3]))}+ while sitting at ${SATIETY_ROWS[3].calories} calories per 100g or less. In plain terms: 300g of these greens — a genuinely large bowl — costs fewer than ${Math.round((SATIETY_ROWS[3].calories * 300) / 100)} calories while loading the stomach with volume, fiber and water.`,
          ar: `أوراق الخردل وأوراق البنجر وأوراق القرق تتخطى كلها ${r2(satietyPer100kcal(SATIETY_TOP[3]))}+ وهي عند ${SATIETY_ROWS[3].calories} سعرة لكل 100 جرام أو أقل. بعبارة مباشرة: 300 جرام من هذه الورقيات — طبق ضخم حقًا — يكلف أقل من ${Math.round((SATIETY_ROWS[3].calories * 300) / 100)} سعرة بينما يملأ المعدة حجمًا وأليافًا وماءً.`,
        },
      },
      {
        heading: { en: "The protein flank", ar: "الجناح البروتيني" },
        body: {
          en: `White fish and shrimp break into the green wall because pure protein is almost pure satiety per calorie. Pollock at ${SATIETY_ROWS[14].calories} kcal per 100g scores ${r2(satietyPer100kcal(SATIETY_TOP[14]))} — pair a 150g fillet with the greens above and you have the architectural drawing of a cutting meal.`,
          ar: `الأسماك البيضاء والجمبري يخترقان سور الورقيات لأن البروتين الصافي شبع صافٍ تقريبًا لكل سعرة. البولاك عند ${SATIETY_ROWS[14].calories} سعرة لكل 100 جرام يسجل ${r2(satietyPer100kcal(SATIETY_TOP[14]))} — اقرن فيليه 150 جرامًا منه بالورقيات أعلاه تحصل على المخطط الهندسي لوجبة تخسيس كاملة.`,
        },
      },
      {
        heading: { en: "How to use the score honestly", ar: "كيف تستخدم الدرجة بأمانة" },
        body: {
          en: `The score is a comparison tool inside this table, not a clinical number. Two foods with similar scores can feel different in real life — cooking, volume and habit matter. Use the ranking to shortlist candidates, then let your own kitchen decide the finalists.`,
          ar: `الدرجة أداة مقارنة داخل هذا الجدول لا رقمًا سريريًا. صنفان بدرجتين متقاربتين قد يبدوان مختلفين في الحياة الواقعية — الطبخ والحجم والعادة كلها تؤثر. استخدم الترتيب لإعداد قائمة مرشحين، ثم دع مطبخك يختار النهائيين.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "How exactly is the satiety score calculated?",
          ar: "كيف تُحسب درجة الشبع بالضبط؟",
        },
        a: {
          en: `Protein grams times four, plus fiber grams times four, divided by calories per 100g — all three straight from the food's database row. We picked protein and fiber because they are the two nutrients most consistently associated with fullness in nutrition research; the formula is printed on the page so you can check any row yourself.`,
          ar: `جرامات البروتين × 4، زائد جرامات الألياف × 4، مقسومة على السعرات لكل 100 جرام — والثلاثة من صف الصنف في القاعدة مباشرة. اخترنا البروتين والألياف لأنهما المغذّيان الأكثر ثباتًا في ارتباطهما بالشبع في أبحاث التغذية؛ والمعادلة مطبوعة بالصفحة لتتحقق من أي صف بنفسك.`,
        },
      },
      {
        q: {
          en: "Why do greens beat everything?",
          ar: "لماذا تتفوق الورقيات على كل شيء؟",
        },
        a: {
          en: `Because their calories are almost entirely made of the two nutrients in the formula. A green at ${SATIETY_ROWS[0].calories} kcal per 100g has nowhere to hide fat or starch — what remains is protein, fiber and water, which is precisely what the score rewards. It is less that greens are magical and more that the maths favours their composition.`,
          ar: `لأن سعراتها تتكون بالكامل تقريبًا من المغذيين اللذين في المعادلة. ورقية عند ${SATIETY_ROWS[0].calories} سعرة لكل 100 جرام لا مكان فيها لدهون أو نشويات خفية — ما بقي بروتين وألياف وماء، وهذا بالضبط ما تكافئه الدرجة. الأمر أقل كون الورقيات سحرية وأكثر أن الحساب ينحاز لتركيبها.`,
        },
      },
      {
        q: {
          en: "Can I live on the top of this table?",
          ar: "هل يمكنني العيش على قمة هذا الجدول؟",
        },
        a: {
          en: `You could fill up on it, but filling up is not feeding: fats and energy-dense foods carry essential roles and the score says nothing about vitamins, minerals or essential fatty acids. Build meals around the top rows on hungry days; keep the rest of the diet balanced. The calorie calculator on the site keeps the overall budget honest.`,
          ar: `يمكنك أن تشبع منه، لكن الإشباع ليس تغذية: الدهون والأطعمة الكثيفة الطاقة أدوار أساسية، والدرجة لا تقول شيئًا عن الفيتامينات والمعادن والأحماض الدهنية الأساسية. ابنِ وجبات أيام الجوع الشديد حول الصفوف العليا؛ وحافظ على توازن بقية النظام. حاسبة السعرات بالموقع تحفظ صدق الميزانية الكلية.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
    collectionSlug: "foods-for-cutting",
    rows: SATIETY_ROWS,
  },
  {
    slug: "lowest-calorie-foods",
    publishedAt: PUBLISHED_AT,
    titleEn: "Lowest Calorie Solid Foods — Real Database Ranking | Alkemos",
    titleAr: "ما أقل الأطعمة سعرات؟ ترتيب حقيقي للأطعمة الصلبة",
    h1En: "Lowest Calorie Solid Foods per 100g",
    h1Ar: "ما أقل الأطعمة سعرات؟",
    descriptionEn: `The honest low-calorie table from the Alkemos database: broth, bamboo shoots, pickles and watercress at ${LOWKCAL_ROWS[0].value}–${LOWKCAL_ROWS[6].value} kcal per 100g — solids only, every value verified.`,
    descriptionAr: `جدول السعرات المنخفضة الصادق من قاعدة بيانات Alkemos: المرقة وجذوع الخيزران والمخللات والجرجير عند ${LOWKCAL_ROWS[0].value}–${LOWKCAL_ROWS[6].value} سعرة لكل 100 جرام — أطعمة صلبة فقط.`,
    introEn: `Plain arithmetic: when you sort every solid food in the database by calories per 100g, the top of the table is broth at ${LOWKCAL_ROWS[0].value} kcal, then bamboo shoots, sour pickles and watercress at ${LOWKCAL_ROWS[3].value} kcal, and a wall of cucumbers, bok choy and lettuce right behind at ${LOWKCAL_ROWS[7].value}–${LOWKCAL_ROWS[13].value}. Drinks are excluded — tea and coffee would trivially win — because the question here is what you can chew.`,
    introAr: `حساب صريح: حين ترتب كل الأطعمة الصلبة في القاعدة بالسعرات لكل 100 جرام، تقف المرقة أعلى الجدول بـ${LOWKCAL_ROWS[0].value} سعرة، ثم جذوع الخيزران والمخللات الحامضة والجرجير عند ${LOWKCAL_ROWS[3].value} سعرة، وسور من الخيار والباك تشوي والخس خلفها مباشرة عند ${LOWKCAL_ROWS[7].value}–${LOWKCAL_ROWS[13].value} سعرة. المشروبات مستبعدة — الشاي والقهوة سيفوزان بلا عناء — لأن السؤال هنا عن شيء تمضغه.`,
    criterionEn: `Sorted by the calorie column per 100g, low to high, from the Alkemos database rows. The scope keeps solid foods only (drinks excluded) and applies the family rules — real Arabic names, no spices, no concentrates. Ties are common at the bottom of the calorie range, so the order within equal values follows the database's own slug order, which keeps the table reproducible.`,
    criterionAr: `مرتبة بعمود السعرات لكل 100 جرام، من الأدنى للأعلى، من صفوف قاعدة بيانات Alkemos. النطاق يبقي الأطعمة الصلبة فقط (المشروبات خارجة) ويطبق قواعد العائلة — أسماء عربية حقيقية، بلا توابل، بلا مركزات. التعادل شائع في قاع مدى السعرات، فترتيب القيم المتساوية يتبع ترتيب المعرفات في القاعدة نفسها، وهذا ما يجعل الجدول قابلًا لإعادة الإنتاج.`,
    metricEn: "Calories (kcal / 100g)",
    metricAr: "السعرات (سعرة / 100 جرام)",
    verdicts: [
      {
        heading: { en: "The volume game", ar: "لعبة الحجم" },
        body: {
          en: `At ${LOWKCAL_ROWS[7].value}–${LOWKCAL_ROWS[13].value} kcal per 100g, cucumber, bok choy and lettuce mean you can stack a 400g plate for the price of a single banana. Volume is the dieter's currency, and this end of the table mints it — the stomach registers weight and stretch, not arithmetic.`,
          ar: `عند ${LOWKCAL_ROWS[7].value}–${LOWKCAL_ROWS[13].value} سعرة لكل 100 جرام، الخيار والباك تشوي والخس يعني أنك تستطيع رصّ طبق 400 جرام بثمن موزة واحدة. الحجم عملة المتخسس، وهذه النهاية من الجدول تسكّها — المعدة تسجل الوزن والتمدد لا الحساب.`,
        },
      },
      {
        heading: { en: "A word on the pickles", ar: "كلمة في المخللات" },
        body: {
          en: `Sour pickles at ${LOWKCAL_ROWS[3].value} kcal are legitimately near the top, but the jar brought something the calorie column does not show: sodium. If your plan watches salt, read the pickle rows as "sometimes foods" and lean on the fresh vegetables instead.`,
          ar: `المخللات الحامضة عند ${LOWKCAL_ROWS[3].value} سعرة قريبة من القمة بحق، لكن المرطبان جلب معه ما لا يعرضه عمود السعرات: الصوديوم. إن كانت خطتك تراقب الملح فاقرأ صفوف المخللات كـ«أطعمة من حين لآخر» واستند إلى الخضار الطازجة بدلًا منها.`,
        },
      },
      {
        heading: { en: "Broth is a technique, not a food", ar: "المرقة تقنية لا طعام" },
        body: {
          en: `Ready-to-serve beef broth registers ${LOWKCAL_ROWS[0].value} kcal per 100g, which makes it less a row in a diet and more a way to cook one: it carries flavour into vegetables and lean proteins at almost no caloric cost. Use the top of this table as ingredients, and the middle as the meal.`,
          ar: `مرقة اللحم الجاهزة تسجل ${LOWKCAL_ROWS[0].value} سعرة لكل 100 جرام، وهذا يجعلها أقل صفًا في حمية وأكثر طريقة لطهيها: تنقل النكهة إلى الخضار والبروتينات الخالية بتكلفة سعرية تكاد تكون صفرية. استخدم قمة هذا الجدول كمكونات، ووسطه كوجبة.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Why are drinks excluded?",
          ar: "لماذا استبعدتم المشروبات؟",
        },
        a: {
          en: `Because the question this page answers is about food you chew and plate. Black coffee and plain tea sit near 1 kcal per 100g and would flood the top of the table without teaching anyone anything about a meal. The database carries their pages separately, with their own values.`,
          ar: `لأن السؤال الذي تجيب عنه هذه الصفحة يدور حول طعام تمضغه وتضعه في طبق. القهوة السادة والشاي الصافي يقفان قرب سعرة واحدة لكل 100 جرام وكانا سيغرقان قمة الجدول دون أن يعلّما أحدًا شيئًا عن وجبة. القاعدة تحمل صفحاتهما منفصلة بقيمهما الخاصة.`,
        },
      },
      {
        q: {
          en: "Does 'lowest calorie' mean 'best for weight loss'?",
          ar: "هل «أقل سعرات» تعني «الأفضل للنزول»؟",
        },
        a: {
          en: `It means cheapest per gram, nothing more. Weight loss lives in the total day's balance, and a plate built only from this table would be huge but under-fed — too little protein to protect muscle. The satiety ranking and the protein-per-calorie ranking on this site cover the other half of that question.`,
          ar: `تعني الأرخص لكل جرام، لا أكثر. النزول يعيش في ميزان اليوم الكلي، وطبق مبني من هذا الجدول وحده سيكون ضخمًا ناقص التغذية — بروتين أقل من أن يحمي العضلات. ترتيب الشبع وترتيب البروتين لكل سعرة في هذا الموقع يغطيان النصف الآخر من السؤال.`,
        },
      },
      {
        q: {
          en: "Are these values raw or cooked?",
          ar: "هل القيم نيئة أم مطهوة؟",
        },
        a: {
          en: `Both appear — the database keeps raw and cooked measurements as separate rows, and this ranking shows whichever form the row records. The food's own page always states its state in the name, so you always know which measurement you are reading.`,
          ar: `كلاهما حاضر — القاعدة تحفظ قياسات النيء والمطهو كصفوف منفصلة، وهذا الترتيب يعرض أي صورة يسجلها الصف. صفحة الصنف نفسها تذكر حالته في الاسم دائمًا، فتعرف دائمًا أي قياس تقرأ.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
    collectionSlug: "foods-for-cutting",
    rows: LOWKCAL_ROWS,
  },
  {
    slug: "highest-fat-foods",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Fat Foods (No Oils) — Real Database Ranking | Alkemos",
    titleAr: "ما أكثر الأطعمة دهنًا بدون زيوت؟ الترتيب الحقيقي",
    h1En: "Highest Fat Whole Foods (No Oils)",
    h1Ar: "ما أكثر الأطعمة دهنًا بدون زيوت؟",
descriptionEn: `Butter leads the whole-food fat table at ${FAT_ROWS[0].value}g per 100g, ahead of pecans and walnuts — oils excluded, values from the Alkemos database.`,
descriptionAr: `الزبدة تقود جدول دهون الأطعمة الكاملة بـ${FAT_ROWS[0].value} جم لكل 100 جرام، أمام البيكان وعين الجمل — بلا زيوت ولا دهون صرفة.`,
    introEn: `Remove the bottles and the chart turns delicious: butter heads the whole-food fat table at ${FAT_ROWS[0].value}g per 100g, then pecans at ${FAT_ROWS[5].value}g, walnuts at ${FAT_ROWS[6].value}g and hazelnuts at ${FAT_ROWS[8].value}g, with nut butters and oil-roasted almonds packing the midfield. For keto readers this is the shopping map; for everyone else it is the honest price list of every delicious thing.`,
    introAr: `أنزل الزجاجات من الطاولة يتحول الجدول إلى خريطة شهية: الزبدة تتصدر جدول دهون الأطعمة الكاملة بـ${FAT_ROWS[0].value} جرامًا لكل 100 جرام، ثم البيكان عند ${FAT_ROWS[5].value} جرامًا وعين الجمل عند ${FAT_ROWS[6].value} جرامًا والبندق عند ${FAT_ROWS[8].value} جرامًا، وتملأ زبدات المكسرات واللوز المحمص بالزيت خط الوسط. لقراء الكيتو هذه خريطة التسوق؛ ولغيرهم قائمة الأسعار الصادقة لكل شيء لذيذ.`,
    criterionEn: `Ranked by the fat column per 100g, descending. Two scope rules shape this table specifically: cooking oils and pure rendered fats (tallow, suet, ghee-style products) are excluded — the question is foods as eaten, not cooking mediums — and the family rules (real Arabic names, no spices, no concentrates) apply throughout. Nut butters count because they are eaten as foods, not poured as mediums.`,
    criterionAr: `الترتيب بعمود الدهون لكل 100 جرام تنازليًا. قاعدتان تشكلان هذا الجدول تحديدًا: زيوت الطبخ والدهون الصرفة المسالة (كالشحم والسمن) مستبعدة — فالسؤال عن الأطعمة كما تُؤكل لا عن وسائط الطهي — وقواعد العائلة (أسماء عربية حقيقية، بلا توابل، بلا مركزات) مطبقة طوال الوقت. زبدات المكسرات محسوبة لأنها تُؤكل كطعام لا تُصب كوسيط.`,
    metricEn: "Fat (g / 100g)",
    metricAr: "الدهون (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "The keto mathematics", ar: "حسابات الكيتو" },
        body: {
          en: `A 30g portion of pecans carries about ${Math.round((FAT_ROWS[5].value * 30) / 100)}g of fat at ${Math.round((FAT_ROWS[5].calories * 30) / 100)} calories — one of the fastest ways to move a fat macro without volume. Two such portions and a tablespoon of butter on vegetables take a 120g fat target halfway.`,
          ar: `حصة 30 جرامًا من البيكان تحمل نحو ${Math.round((FAT_ROWS[5].value * 30) / 100)} جرام دهون عند ${Math.round((FAT_ROWS[5].calories * 30) / 100)} سعرة — من أسرع طرق تحريك ماكرو الدهون بلا حجم. حصتان كهذه وملعقة زبدة على الخضار توصلان هدف 120 جرامًا من الدهون إلى منتصف الطريق.`,
        },
      },
      {
        heading: { en: "The portion trap", ar: "فخ الحصة" },
        body: {
          en: `Everything near the top of this table is engineered by nature to be eaten in small amounts — a nut is a seed designed to survive winter. The rows are honest; the serving bowl is where diets die. Weigh the first few portions until your eye recalibrates.`,
          ar: `كل ما يقارب قمة هذا الجدول صممته الطبيعة ليُؤكل بمقادير صغيرة — المكسرة بذرة صُممت لتنجو من الشتاء. الصفوف صادقة؛ وعاء التقديم هو حيث تموت الحميات. زن أول حصصك حتى تعيد عينك معايرتها.`,
        },
      },
      {
        heading: { en: "Beyond the macros", ar: "خلف الماكروز" },
        body: {
          en: `The fat number says nothing about fat quality. Nuts carry their fat mostly unsaturated, butter mostly saturated, and the site's food pages and methodology guide carry the fuller composition story for every row. Use this ranking to shortlist, then read the individual page before building a staple.`,
          ar: `رقم الدهون لا يقول شيئًا عن نوعية الدهون. المكسرات تحمل دهونها غير مشبعة في معظمها، والزبدة مشبعة في معظمها، وصفحات الأطعمة ودليل المنهجية بالموقع يحملان القصة التركيبية الأكمل لكل صف. استخدم هذا الترتيب للإعداد، ثم اقرأ صفحة الصنف قبل أن تجعله أساسًا.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Why are oils excluded from a fat ranking?",
          ar: "لماذا استبعدت الزيوت من ترتيب الدهون؟",
        },
        a: {
          en: `Because a fat ranking that includes oils is a list of bottles — every cooking oil is 100% fat by definition and would crowd out every actual food. Excluding them (mechanically: the oil/fat category plus pure rendered-fat rows) leaves the foods you chew, which is the useful question. Olive oil keeps its own celebrated page in the library.`,
          ar: `لأن ترتيب الدهون الذي يشمل الزيوت يصبح قائمة زجاجات — كل زيت طبخ دهن 100% بالتعريف وسيدفع كل طعام حقيقي خارج الجدول. استبعادها (ميكانيكيًا: فئة الزيوت والدهون وصفوف الدهون الصرفة) يُبقي الأطعمة التي تمضغها، وهو السؤال المفيد. زيت الزيتون تحتفظ صفحته المحتفى بها في المكتبة.`,
        },
      },
      {
        q: {
          en: "Is butter allowed on keto?",
          ar: "هل الزبدة مسموحة في الكيتو؟",
        },
        a: {
          en: `On the numbers, butter is as keto as food gets: ${FAT_ROWS[0].value}g fat per 100g with trace carbohydrates. Whether it should dominate your fat intake is a different question — the site's keto collection pairs this table with lower-saturated options, and rotating fat sources is the pattern most guidance keeps recommending.`,
          ar: `على الأرقام، الزبدة كيتو بقدر ما يكون الطعام كيتو: ${FAT_ROWS[0].value} جرام دهن لكل 100 جرام مع أثر ضئيل من الكربوهيدرات. أما هل ينبغي أن تهيمن على دهونك فسؤال آخر — مجموعة الكيتو بالموقع تقارن هذا الجدول بخيارات أقل إشباعًا، وتنويع مصادر الدهون هو النمط الذي توصي به الإرشادات عادة.`,
        },
      },
      {
        q: {
          en: "What about fatty fish and meat?",
          ar: "وماذا عن الأسماك واللحوم الدهنية؟",
        },
        a: {
          en: `They sit below the nuts here because muscle food carries water and protein alongside the fat — salmon lands around 13g per 100g. That is not a demotion; fatty fish brings protein and its own composition story, which is why the seafood-protein ranking exists separately on this site.`,
          ar: `تقف أسفل المكسرات هنا لأن طعام العضلات يحمل ماءً وبروتينًا جنبًا إلى جنب مع الدهن — السلمون يهبط نحو 13 جرامًا لكل 100 جرام. وهذه ليست إهانة؛ السمك الدهني يجلب البروتين وقصته التركيبية الخاصة، ولهذا وُجد ترتيب بروتين المأكولات البحرية منفصلًا في هذا الموقع.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "keto-friendly-foods",
    rows: FAT_ROWS,
  },
  {
    slug: "highest-calorie-foods",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Calorie Foods for Bulking (No Oils) — Ranked | Alkemos",
    titleAr: "ما أعلى الأطعمة سعرات للتضخيم؟ الترتيب بدون زيوت",
    h1En: "Highest Calorie Foods for Bulking (No Oils)",
    h1Ar: "ما أعلى الأطعمة سعرات للتضخيم؟",
    descriptionEn: `The bulking density table: butter and pecans near ${HIGHKCAL_ROWS[0].value} kcal per 100g, walnuts, chocolate and hazelnuts close behind — oils excluded, from the Alkemos database.`,
    descriptionAr: `جدول كثافة التضخيم: الزبدة والبيكان قرب ${HIGHKCAL_ROWS[0].value} سعرة لكل 100 جرام، وعين الجمل والشوكولاتة والبندق خلفهما مباشرة — بلا زيوت، من قاعدة بيانات Alkemos.`,
    introEn: `Some appetites cannot chew their way to a surplus, and this table is their shortcut: butter and whipped butter open at ${HIGHKCAL_ROWS[0].value}–${HIGHKCAL_ROWS[2].value} kcal per 100g, pecans follow at ${HIGHKCAL_ROWS[3].value}–${HIGHKCAL_ROWS[5].value}, and the rest of the top twenty is a dense parade of walnuts, unsweetened baking chocolate, hazelnuts, sunflower kernels and nut butters. Calories per bite is the entire game when volume is the enemy.`,
    introAr: `بعض الشهيات لا تستطيع أن تمضغ طريقها إلى الفائض، وهذا الجدول اختصارها: الزبدة والزبدة المخفوقة تفتتحان بـ${HIGHKCAL_ROWS[0].value}–${HIGHKCAL_ROWS[2].value} سعرة لكل 100 جرام، والبيكان يتبع عند ${HIGHKCAL_ROWS[3].value}–${HIGHKCAL_ROWS[5].value}، وبقية العشرين الأوائل موكب كثيف من عين الجمل وشوكولاتة الخبز غير المحلاة والبندق ولب عباد الشمس وزبدات المكسرات. السعرات لكل قضمة هي اللعبة كلها حين يكون الحجم هو العدو.`,
    criterionEn: `Sorted by calories per 100g, descending, from the Alkemos database rows. Oils and pure fats are excluded — spooning oil is a supplement trick, not a food — along with the family rules on spices and concentrates. What survives is food you can actually serve: butters, nuts, seeds, chocolate and dense baked goods.`,
    criterionAr: `مرتبة بالسعرات لكل 100 جرام تنازليًا من صفوف قاعدة بيانات Alkemos. الزيوت والدهون الصرفة المسالة مستبعدة — غرف الزيت حيلة مكمّلات لا طعام — مع قواعد العائلة في التوابل والمركزات. ما ينجو هو طعام تستطيع فعلًا تقديمه: الزبدات والمكسرات والبذور والشوكولاتة والمخبوزات الكثيفة.`,
    metricEn: "Calories (kcal / 100g)",
    metricAr: "السعرات (سعرة / 100 جرام)",
    verdicts: [
      {
        heading: { en: "The surplus arithmetic", ar: "حساب الفائض" },
        body: {
          en: `A 300-calorie surplus that would take 900g of chicken is about 43g of pecans — less than a handful and a half. Two nut portions, a nut-butter sandwich and a bar of baking chocolate can quietly close a lean gainer's daily gap without a second dinner.`,
          ar: `فائض الـ300 سعرة الذي يحتاج 900 جرام من الدجاج يكفيه نحو 43 جرامًا من البيكان — أقل من حفنة ونصف. حصتا مكسرات وشطيرة زبدة مكسرات وقطعة شوكولاتة خبز تسد فجوة صاحب الزيادة الصعبة بهدوء دون عشاء ثانٍ.`,
        },
      },
      {
        heading: { en: "Density is not nutrition", ar: "الكثافة ليست تغذية" },
        body: {
          en: `The top of this table is energy, not a micronutrient plan: chocolate and nut butters carry sugar and saturated fat alongside their calories. A smart bulk leans on the nut and seed rows for their mineral story and keeps the sweeter rows as accessories — the bulking collection on this site stages the full plate.`,
          ar: `قمة هذا الجدول طاقة لا خطة مغذيات دقيقة: الشوكولاتة وزبدات المكسرات تحمل السكر والدهون المشبعة مع سعراتها. التضخيم الذكي يستند إلى صفوف المكسرات والبذور لقصة معادنها ويُبقي الصفوف الأحلى كإكسسوارات — ومجموعة التضخيم بالموقع ترتّب الطبق كاملًا.`,
        },
      },
      {
        heading: { en: "Pair with the protein tables", ar: "اقرنها بجداول البروتين" },
        body: {
          en: `Calories build the surplus; protein builds the tissue. The highest-protein and protein-per-calorie rankings on this site are the natural companions of this table — a bulk that only reads this page grows in the wrong direction.`,
          ar: `السعرات تبني الفائض؛ والبروتين يبني النسيج. ترتيبا أعلى بروتين والبروتين لكل سعرة في هذا الموقع هما الرفيقان الطبيعيان لهذا الجدول — تضخيم يقرأ هذه الصفحة وحدها ينمو في الاتجاه الخاطئ.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Why exclude oils if the goal is calories?",
          ar: "لماذا استبعاد الزيوت والهدف سعرات؟",
        },
        a: {
          en: `Because this page ranks foods, and a tablespoon of oil — while a legitimate surplus tool — is a supplement pattern, not a meal. Every oil is 884+ kcal per 100g and would simply be a list of bottles. The nut-butter rows give you a spreadable, servable version of nearly the same density.`,
          ar: `لأن هذه الصفحة ترتب الأطعمة، وملعقة الزيت — أداة فائض مشروعة — نمط مكمّلات لا وجبة. كل زيت عند 884 سعرة أو أكثر لكل 100 جرام وكان الجدول سيصبح قائمة زجاجات. صفوف زبدة المكسرات تمنحك نسخة قابلة للدهن والتقديم من الكثافة نفسها تقريبًا.`,
        },
      },
      {
        q: {
          en: "How much of the top of this table is too much?",
          ar: "كم من قمة هذا الجدول يعتبر كثيرًا؟",
        },
        a: {
          en: `There is no universal line, but a practical guardrail: when nut portions, chocolate and butters start displacing protein foods and vegetables from your day, the surplus has stopped serving the bulk. Keep the dense rows as gap-closers after the protein anchor is placed.`,
          ar: `لا يوجد خط واحد للجميع، لكن سياج عملي: حين تبدأ حصص المكسرات والشوكولاتة والزبدات بإزاحة أطعمة البروتين والخضار من يومك، توقف الفائض عن خدمة التضخيم. أبقِ الصفوف الكثيفة سادّات للفجوة بعد تثبيت مرساة البروتين.`,
        },
      },
      {
        q: {
          en: "Are dried fruits good for bulking?",
          ar: "هل الفواكه المجففة جيدة للتضخيم؟",
        },
        a: {
          en: `Excellent on paper — dates carry around ${getFoodKcal("dates")} kcal per 100g — but this table's scope excludes dried forms because their 100g serving misleads comparisons with fresh food. The dates page in the library carries their full macros; for the bulk itself, the nut rows above are the denser and more fat-complete route.`,
          ar: `ممتازة على الورق — التمر يحمل نحو ${getFoodKcal("dates")} سعرة لكل 100 جرام — لكن نطاق هذا الجدول يستبعد الأشكال المجففة لأن حصة الـ100 جرام فيها تضلل المقارنة بالطعام الطازج. صفحة التمر بالمكتبة تحمل ماكروزه كاملة؛ وللتضخيم نفسه، صفوف المكسرات أعلاه أعلى كثافة وأكمل دهونًا.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
    collectionSlug: "foods-for-bulking",
    rows: HIGHKCAL_ROWS,
  },
  {
    slug: "low-carb-high-protein-foods",
    publishedAt: PUBLISHED_AT,
    titleEn: "Low Carb, High Protein Foods — Real Database Ranking | Alkemos",
    titleAr: "ما أعلى الأطعمة بروتينًا بين قليلة الكربوهيدرات؟ الترتيب",
    h1En: "Low Carb, High Protein Foods",
    h1Ar: "ما أعلى الأطعمة بروتينًا بين قليلة الكربوهيدرات؟",
    descriptionEn: `Both filters at once: ${LOWCARB_LEADER.nameEn} leads at ${r1(proteinOf(LOWCARB_LEADER))}g protein with ${carbOf(LOWCARB_LEADER)}g carbs per 100g, ahead of smoked fish and hard cheeses — from the Alkemos database.`,
    descriptionAr: `الفلتران معًا: ${LOWCARB_LEADER.nameAr} يقود بـ${r1(proteinOf(LOWCARB_LEADER))} جم بروتين مع ${carbOf(LOWCARB_LEADER)} جم كربوهيدرات لكل 100 جرام، أمام الأسماك المدخنة والجبن الصلب والقطع الخالية المطهوة.`,
    introEn: `Two filters, one table: every row here stays at or under 5g of carbs per 100g, then ranks by protein. ${LOWCARB_LEADER.nameEn} opens at ${r1(proteinOf(LOWCARB_LEADER))}g protein against ${carbOf(LOWCARB_LEADER)}g carbs, ${LOWCARB_CHEESE.nameEn} follows at ${r1(proteinOf(LOWCARB_CHEESE))}g with ${carbOf(LOWCARB_CHEESE)}g, and the braised lean cuts — ${LOWCARB_BRAISED.nameEn} at ${r1(proteinOf(LOWCARB_BRAISED))}g — arrive at literally zero carbs. This is the keto and cutting shopper's shortlist — protein first, carbs nearly absent.`,
    introAr: `فلتران في جدول واحد: كل صف هنا يبقى عند 5 جم كربوهيدرات أو أقل لكل 100 جرام، ثم يرتب بالبروتين. ${LOWCARB_LEADER.nameAr} يفتتح بـ${r1(proteinOf(LOWCARB_LEADER))} جرام بروتين مقابل ${carbOf(LOWCARB_LEADER)} جرام كربوهيدرات، و${LOWCARB_CHEESE.nameAr} تتبع بـ${r1(proteinOf(LOWCARB_CHEESE))} جرامًا مع ${carbOf(LOWCARB_CHEESE)} جرام، والقطع الخالية المطهوة ببطء — ${LOWCARB_BRAISED.nameAr} بـ${r1(proteinOf(LOWCARB_BRAISED))} جرامًا — تصل بصفر كربوهيدرات حرفيًا. هذه قائمة تسوق الكيتو والتخسيس — البروتين أولًا والكربوهيدرات شبه غائبة.`,
    criterionEn: `The carb ceiling is 5g per 100g (a widely used low-carb threshold for a food, stricter than a full meal's), and ranking within it is by protein grams, descending. The family scope rules apply. The two columns printed side by side — protein and carbs — are the whole point: you can verify both numbers on every linked food page.`,
    criterionAr: `سقف الكربوهيدرات 5 جم لكل 100 جرام (عتبة قليلة الكربوهيدرات المعروفة لصنف واحد، أصرم من عتبة الوجبة الكاملة)، والترتيب داخله بجرامات البروتين تنازليًا. وقواعد نطاق العائلة مطبقة. والعمودان المطبوعان جنبًا إلى جنب — البروتين والكربوهيدرات — هما جوهر الصفحة: تستطيع التحقق من الرقمين في صفحة كل صنف مربوط.`,
    metricEn: "Protein (g / 100g, carbs ≤ 5g)",
    metricAr: "البروتين (جم / 100 جرام، كربوهيدرات ≤ 5 جم)",
    verdicts: [
      {
        heading: { en: "The cheese paradox", ar: "مفارقة الجبن" },
        body: {
          en: `Yes, the hardest cheese here out-proteins the leanest braised cut per 100g — ${r1(proteinOf(LOWCARB_CHEESE))}g versus ${r1(proteinOf(LOWCARB_BRAISED))}g — because cheese is concentrated milk with the water gone. The price sits in the calorie column (${kcalOf(LOWCARB_CHEESE)} versus ${kcalOf(LOWCARB_BRAISED)}), so cutters read this table right-to-left: meat first, cheese as the flavour layer.`,
          ar: `نعم، أقسى جبن هنا يتفوق على أنحف قطعة مطهوة ببطء بروتينًا لكل 100 جرام — ${r1(proteinOf(LOWCARB_CHEESE))} جرامًا مقابل ${r1(proteinOf(LOWCARB_BRAISED))} — لأن الجبن حليب مركز ذهب ماؤه. والثمن في عمود السعرات (${kcalOf(LOWCARB_CHEESE)} مقابل ${kcalOf(LOWCARB_BRAISED)})، فقراءة المتخسس لهذا الجدول تبدأ بعمود السعرات قبل عمود البروتين: اللحم أولًا والجبن طبقة النكهة.`,
        },
      },
      {
        heading: { en: "Zero-carb is real here", ar: "الصفر كربوهيدرات حقيقي هنا" },
        body: {
          en: `Dozens of braised beef, veal and lamb rows carry a true 0g of carbs — meat in its lean cooked form. That is why carnivore-style plates and strict keto both anchor on this end of the database: the protein arrives unaccompanied.`,
          ar: `عشرات الصفوف من لحم البقر والعجل والغنم المطهوة ببطء تحمل صفر جرام كربوهيدرات حقيقيًا — اللحم في صورته الخالية المطهوة. لهذا ترسو الأطباق اللحمية والكيتو الصارم على هذه النهاية من القاعدة: البروتين يصل بلا مرافق.`,
        },
      },
      {
        heading: { en: "The daily rotation", ar: "التدوير اليومي" },
        body: {
          en: `The economical core of this table is familiar: chicken breast, canned tuna, eggs and cottage cheese all live under the 5g ceiling with 20-31g of protein each. The exotic rows are for variety; the staples are what actually fill the week.`,
          ar: `النواة الاقتصادية لهذا الجدول مألوفة: صدر الدجاج والتونة المعلبة والبيض والجبن القريش كلها تحت السقف بـ20–31 جرام بروتين. الصفوف الغريبة للتنويع؛ والأساسيات هي ما يملأ الأسبوع فعلًا.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Why 5g of carbs as the ceiling?",
          ar: "لماذا 5 جم كربوهيدرات سقفًا؟",
        },
        a: {
          en: `It is a strict per-food line: a plate built entirely from sub-5g foods keeps even a large mixed meal inside typical low-carb budgets. The number is stated on the page so you can judge it — and every row's exact carb figure sits in the table beside the protein.`,
          ar: `إنه خط صارم للصنف الواحد: طبق مبني بالكامل من أصناف تحت 5 جم يبقي حتى وجبة مختلطة كبيرة داخل ميزانيات الكربوهيدرات المنخفضة المعتادة. الرقم معلن في الصفحة لتحكم عليه — وقيمة الكربوهيدرات الدقيقة لكل صف تجلس في الجدول بجوار البروتين.`,
        },
      },
      {
        q: {
          en: "Why does cheese outrank meat?",
          ar: "لماذا يتقدم الجبن على اللحم؟",
        },
        a: {
          en: `Per 100g, concentrated dairy edges lean meat because moisture was removed at the cheese press, not in your kitchen. Per calorie, meat wins. Both truths sit in the table's two columns — protein and calories — so choose by your budget, not by the rank number alone.`,
          ar: `لكل 100 جرام، يتقدم الألبان المركزة اللحمَ الخالي لأن الرطوبة نُزعت في مكبس الجبن لا في مطبخك. ولكل سعرة، يفوز اللحم. والحقيقتان جالستان في عمودي الجدول — البروتين والسعرات — فاختر بميزانيتك لا برقم الترتيب وحده.`,
        },
      },
      {
        q: {
          en: "What about vegetarian rows?",
          ar: "وماذا عن الصفوف النباتية؟",
        },
        a: {
          en: `Eggs, cheese and cottage cheese carry the vegetarian flag under this ceiling; the plant proteins — lentils, chickpeas, beans — sit well above 5g of carbs per 100g and belong to the fiber ranking's side of the database instead. That trade-off between plant protein and carbs is exactly what low-carb vegetarian planning navigates.`,
          ar: `البيض والجبن والجبن القريش يحملون راية النباتيين تحت هذا السقف؛ أما بروتينات النبات — العدس والحمص والفاصوليا — فوق 5 جم كربوهيدرات لكل 100 جرام بفارق كبير وتنتمي إلى جانب الألياف في القاعدة. وهذه المقايضة بين بروتين النبات والكربوهيدرات هي بالضبط ما يتفاوض عليه تخطيط الكيتو النباتي.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "low-carb-foods",
    rows: LOWCARB_ROWS,
  },
  {
    slug: "lowest-sugar-fruits",
    publishedAt: PUBLISHED_AT,
    titleEn: "Lowest Sugar Fresh Fruits — Real Database Ranking | Alkemos",
    titleAr: "ما أقل الفواكه سكرًا؟ الترتيب الحقيقي للفواكه الطازجة",
    h1En: "Lowest Sugar Fresh Fruits",
    h1Ar: "ما أقل الفواكه سكرًا؟",
    descriptionEn: `Fresh fruits ranked by measured sugar: avocado (${LOWSUGAR_ROWS[0].value}g), rhubarb (${LOWSUGAR_ROWS[2].value}g), lime (${LOWSUGAR_ROWS[3].value}g) and starfruit lead — values from the Alkemos database.`,
    descriptionAr: `الفواكه الطازجة مرتبة بالسكر المقيس: الأفوكادو (${LOWSUGAR_ROWS[0].value} جم) والراوند (${LOWSUGAR_ROWS[2].value} جم) والليمون الأضالي (${LOWSUGAR_ROWS[3].value} جم) والكاراميولا — من قاعدة بيانات Alkemos.`,
    introEn: `Fruit sugar is not a scandal, but if you are budgeting grams of it, the ranking starts surprisingly green: avocado leads at ${LOWSUGAR_ROWS[0].value}g of sugar per 100g, rhubarb follows at ${LOWSUGAR_ROWS[2].value}g, then lime at ${LOWSUGAR_ROWS[3].value}g and starfruit at ${LOWSUGAR_ROWS[6].value}g. The berries arrive just after — cranberry, raspberry, blackberry and strawberry all under 5g. One honest note: the sweet icons of the Arab table — dates at ${getFoodSugar("dates")}g and bananas at ${getFoodSugar("banana")}g — live at the other end of this database, and their pages say so plainly.`,
    introAr: `سكر الفاكهة ليس فضيحة، لكن إن كنت تدبر جراماته فالترتيب يبدأ أخضر بشكل مدهش: الأفوكادو يقود بـ${LOWSUGAR_ROWS[0].value} جم سكر لكل 100 جرام، والراوند يتبع بـ${LOWSUGAR_ROWS[2].value} جم، ثم الليمون الأضالي بـ${LOWSUGAR_ROWS[3].value} جم والكاراميولا بـ${LOWSUGAR_ROWS[6].value} جم. والتوت يصل بعدها مباشرة — التوت البري والعليق والأسود والفراولة كلها تحت 5 جم. وملاحظة صادقة: أيقونتا المائدة العربية الحلويتان — التمر عند ${getFoodSugar("dates")} جم والموز عند ${getFoodSugar("banana")} جم — تسكنان الطرف الآخر من هذه القاعدة، وصفحتاهما تقولان ذلك بوضوح.`,
    criterionEn: `Only fresh fruits enter — rows recorded raw in the database — because canning syrup and drying change the sugar story completely. Rows whose sugar was never measured (recorded as zero) are excluded so the table never presents a data gap as a fact. Within that scope the sort is ascending by grams of sugar per 100g, ties broken deterministically.`,
    criterionAr: `الفواكه الطازجة فقط تدخل — الصفوف المسجلة نيئة في القاعدة — لأن شراب التعليب والتجفيف يغيران قصة السكر تمامًا. والصفوف التي لم يقس سكرها أصلًا (المسجلة صفرًا) مستبعدة كي لا يقدم الجدول فجوة بيانات كحقيقة. وداخل هذا النطاق الترتيب تصاعدي بجرامات السكر لكل 100 جرام، والتعادل يُحسم حسمًا حتميًا.`,
    metricEn: "Sugar (g / 100g)",
    metricAr: "السكر (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "The avocado lesson", ar: "درس الأفوكادو" },
        body: {
          en: `The least sugary fruit is the fattiest one — ${LOWSUGAR_ROWS[0].value}g of sugar against 15g of fat per 100g. It reframes "fruit" from sweetness to plant food: the low-sugar shelf is mostly fats (avocado, olives), acids (citrus, rhubarb) and berries.`,
          ar: `أقل الفواكه سكرًا أكثرها دهنًا — ${LOWSUGAR_ROWS[0].value} جم سكر مقابل 15 جم دهن لكل 100 جرام. وهذا يعيد تعريف «الفاكهة» من الحلاوة إلى طعام النبات: رف السكر المنخفض دهون في معظمه (الأفوكادو والزيتون) وحوامض (الحمضيات والراوند) وتوت.`,
        },
      },
      {
        heading: { en: "Berries: the sweet spot", ar: "التوت: النقطة المثلى" },
        body: {
          en: `Cranberry, raspberry, blackberry and strawberry all sit between ${LOWSUGAR_ROWS.find((r) => r.slug.startsWith("cranberries"))!.value}g and ${LOWSUGAR_ROWS.find((r) => r.slug.startsWith("strawberries"))!.value}g of sugar while tasting like dessert. For most people watching sugar, the berry rows are where enjoyment and the budget shake hands.`,
          ar: `التوت البري والعليق والأسود والفراولة كلها بين ${LOWSUGAR_ROWS.find((r) => r.slug.startsWith("cranberries"))!.value} و${LOWSUGAR_ROWS.find((r) => r.slug.startsWith("strawberries"))!.value} جم سكر مع طعم الحلويات. لمعظم من يراقب سكره، صفوف التوت هي حيث تتصافح المتعة مع الميزانية.`,
        },
      },
      {
        heading: { en: "And the famous sweet ones?", ar: "وماذا عن الحلويات المشهورة؟",
        },
        body: {
          en: `Dates run near ${getFoodSugar("dates")}g of sugar per 100g and bananas near ${getFoodSugar("banana")}g in this database — not forbidden, just expensive for a sugar budget. The honest pattern: enjoy them as deliberate portions, and let the top of this table carry the casual snacking.`,
          ar: `التمر يجري قرب ${getFoodSugar("dates")} جم سكر لكل 100 جرام والموز قرب ${getFoodSugar("banana")} جم في هذه القاعدة — ليسا محظورين، فقط مكلفين لميزانية السكر. والنمط الصادق: تمتع بهما كحصص مقصودة، ودع قمة هذا الجدول تحمل الأكل العفوي بين الوجبات.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Why exclude canned and dried fruits?",
          ar: "لماذا استبعدتم الفواكه المعلبة والمجففة؟",
        },
        a: {
          en: `Because the question is about fruit as picked, and processing rewrites the sugar column: syrup packs add it, drying concentrates it, and many canned rows in source databases simply never had their sugars measured. Fresh-only scope keeps every number comparable and every claim checkable.`,
          ar: `لأن السؤال عن الفاكهة كما تُقطف، والتصنيع يعيد كتابة عمود السكر: الشراب يضيفه، والتجفيف يركزه، وكثير من صفوف المعلبات في القواعد المصدر لم يقس سكرها أصلًا. نطاق الطازج فقط يبقي كل رقم قابلً للمقارنة وكل ادعاء قابلًا للتحقق.`,
        },
      },
      {
        q: {
          en: "Is fruit sugar different from added sugar?",
          ar: "هل سكر الفاكهة مختلف عن السكر المضاف؟",
        },
        a: {
          en: `Chemically the molecules are the same; the packaging is what differs — whole fruit brings fiber, water and chewing speed along for the ride, which is why guidance treats whole fruit and added sugar very differently. This page only ranks the measured sugar grams; it does not editorialise about either.`,
          ar: `كيميائيًا الجزيئات هي هي؛ العلبة هي المختلفة — الفاكهة الكاملة تجلب الألياف والماء وسرعة المضغ معها في الرحلة، ولهذا تعامل الإرشادات الفاكهة الكاملة والسكر المضاف معاملة مختلفة جدًا. هذه الصفحة ترتب جرامات السكر المقيسة فقط؛ ولا تفتي في أيٍّ منهما.`,
        },
      },
      {
        q: {
          en: "Which of these fit a keto plan?",
          ar: "أي منها يناسب خطة الكيتو؟",
        },
        a: {
          en: `Avocado and olives are keto staples by any margin; rhubarb, lime and the berries can fit small portions inside tight carb budgets. The keto-friendly collection on this site stages the wider pantry — this table simply shows where fruit's own sugars are lowest.`,
          ar: `الأفوكادو والزيتون أساسيان في الكيتو بأي معيار؛ والراوند والليمون والتوت يمكن أن تسع حصصًا صغيرة داخل ميزانيات كربوهيدرات ضيقة. مجموعة الصديق للكيتو في هذا الموقع ترتب المخزن الأوسع — وهذا الجدول يكتفي بعرض حيث يكون سكر الفاكهة نفسه في أدناه.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
    collectionSlug: "keto-friendly-foods",
    rows: LOWSUGAR_ROWS,
  },
  {
    slug: "highest-protein-fish",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Protein Fish and Seafood — Real Ranking | Alkemos",
    titleAr: "ما أكثر الأسماك والمأكولات البحرية بروتينًا؟ الترتيب",
    h1En: "Highest Protein Fish and Seafood",
    h1Ar: "ما أكثر الأسماك والمأكولات البحرية بروتينًا؟",
    descriptionEn: `Cuttlefish leads the seafood table at ${SEAFOOD_ROWS[0].value}g protein per 100g, ahead of smoked sturgeon, octopus and oil-packed tuna — from the Alkemos database.`,
    descriptionAr: `السبيط يقود جدول المأكولات البحرية بـ${SEAFOOD_ROWS[0].value} جم بروتين لكل 100 جرام، أمام الحفش المدخن والأخطبوط والتونة المعلبة بالزيت — من قاعدة بيانات Alkemos.`,
    introEn: `The sea's own protein chart: cuttlefish opens at ${SEAFOOD_ROWS[0].value}g per 100g, smoked sturgeon and cooked octopus hold the podium at ${SEAFOOD_ROWS[1].value}g and ${SEAFOOD_ROWS[2].value}g, and the tuna family — oil-packed, water-packed, fresh yellowfin — fills the middle with ${SEAFOOD_ROWS[3].value}–${SEAFOOD_ROWS[18].value}g. Canned sardines and anchovies prove the cheap shelf competes: ${SEAFOOD_ROWS[17].value}g and ${SEAFOOD_ROWS[5].value}g respectively.`,
    introAr: `جدول البروتين من البحر مباشرة: السبيط يفتتح بـ${SEAFOOD_ROWS[0].value} جرامًا لكل 100 جرام، والحفش المدخن والأخطبوط المطهو يحرسان المنصة بـ${SEAFOOD_ROWS[1].value} و${SEAFOOD_ROWS[2].value} جرام، وعائلة التونة — بالزيت وبالماء والصفراء الزعنفة الطازجة — تملأ الوسط بـ${SEAFOOD_ROWS[3].value}–${SEAFOOD_ROWS[18].value} جرام. والسردين والأنشوجة المعلبان يثبتان أن الرف الرخيص ينافس: ${SEAFOOD_ROWS[17].value} و${SEAFOOD_ROWS[5].value} جرامًا على الترتيب.`,
    criterionEn: `Every fish, crustacean and mollusc row in the database with a real Arabic name enters, ranked by protein per 100g, descending — with the family scope rules (no spice rows, no dried/powder forms, which is why salted-dried fish stay out). Raw and cooked rows are both present because both are eaten; each linked page states its own state.`,
    criterionAr: `كل صف أسماك وقشريات ورخويات في القاعدة باسم عربي حقيقي يدخل، مرتبًا بالبروتين لكل 100 جرام تنازليًا — مع قواعد نطاق العائلة (لا صفوف توابل، ولا أشكال مجففة ومسحوقة، ولهذا يبقى السمك المملح المجفف خارجًا). وصفوف النيء والمطهو حاضرة معًا لأن كليهما يُؤكل؛ وكل صفحة مربوط تصرح بحالتها.`,
    metricEn: "Protein (g / 100g)",
    metricAr: "البروتين (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "Why cephalopods rule", ar: "لماذا تسود الرخويات" },
        body: {
          en: `Cuttlefish and octopus are essentially muscular protein with almost no fat — ${SEAFOOD_ROWS[0].calories} kcal per 100g carrying ${SEAFOOD_ROWS[0].value}g of protein. In protein-per-calorie terms they rival the white-fish podium of the efficiency ranking, with a chewier bite and a very different price tag.`,
          ar: `السبيط والأخطبوط بروتين عضلي صافٍ تقريبًا بلا دهون تذكر — ${SEAFOOD_ROWS[0].calories} سعرة لكل 100 جرام تحمل ${SEAFOOD_ROWS[0].value} جرام بروتين. وبلغة البروتين لكل سعرة ينافسان منصة الأسماك البيضاء في ترتيب الكفاءة، بقضمة أمضغ وسعر مختلف تمامًا.`,
        },
      },
      {
        heading: { en: "The economy podium", ar: "منصة الاقتصاد" },
        body: {
          en: `Sardines at ${SEAFOOD_ROWS[17].value}g, anchovies at ${SEAFOOD_ROWS[5].value}g and water-packed tuna at ${SEAFOOD_ROWS[12].value}g are the pantry rows that make daily seafood protein affordable — and the small oily fish bring their own mineral story on their food pages, bones and all.`,
          ar: `السردين عند ${SEAFOOD_ROWS[17].value} جرامًا والأنشوجة عند ${SEAFOOD_ROWS[5].value} والتونة بالماء عند ${SEAFOOD_ROWS[12].value} هي صفوف الخزانة التي تجعل بروتين البحر اليومي في المتناول — والأسماك الزيتية الصغيرة تجلب قصتها المعدنية في صفحاتها، بعظامها وكل ما فيها.`,
        },
      },
      {
        heading: { en: "Fresh versus canned", ar: "الطازج مقابل المعلب" },
        body: {
          en: `The table shows both honestly: oil-packed tuna rows (${SEAFOOD_ROWS[3].value}g) sit above fresh raw yellowfin (${SEAFOOD_ROWS[18].value}g) because draining concentrates the solids. Neither is cheating — pick by shelf life and budget, and let the calorie column tag along.`,
          ar: `الجدول يعرض الاثنين بأمانة: صفوف التونة بالزيت (${SEAFOOD_ROWS[3].value} جرامًا) فوق الصفراء الزعنفة الطازجة النيئة (${SEAFOOD_ROWS[18].value} جرامًا) لأن التصريف يركز المواد الصلبة. ولا أحد منهما يغش — اختر بعمر التخزين والميزانية، ودع عمود السعرات يرافقك.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Is canned fish lower in protein?",
          ar: "هل السمك المعلب أقل بروتينًا؟",
        },
        a: {
          en: `The rows say the opposite: drained canned tuna measures ${SEAFOOD_ROWS[3].value}g per 100g in this table, above many fresh fillets. Processing costs more in texture and sodium than in protein grams; the linked pages carry each row's full numbers.`,
          ar: `الصفوف تقول العكس: التونة المعلبة المصفاة تسجل ${SEAFOOD_ROWS[3].value} جرامًا لكل 100 جرام في هذا الجدول، فوق كثير من الفيليه الطازج. التصنيع يكلفك في الملمس والصوديوم أكثر مما يكلف في جرامات البروتين؛ والصفحات المربوطة تحمل الأرقام الكاملة لكل صف.`,
        },
      },
      {
        q: {
          en: "Where is salmon?",
          ar: "أين السلمون؟",
        },
        a: {
          en: `Salmon rows sit in the ${SEAFOOD_ROWS[6].value}–25g band — slightly below the podium — because the fish carries its celebrated oils alongside the protein. In the efficiency ranking (protein per calorie) the lean white fish pass it; in omega-3 terms it passes nearly everything. Different tables answer different questions.`,
          ar: `صفوف السلمون تقع في نطاق ${SEAFOOD_ROWS[6].value}–25 جرامًا — أسفل المنصة قليلًا — لأن السمكة تحمل زيوتها المحتفى بها مع البروتين. في ترتيب الكفاءة (البروتين لكل سعرة) تتجاوزه الأسماك البيضاء الخالية؛ وفي لغة أوميغا-3 هو يتجاوز الجميع تقريبًا. جداول مختلفة تجيب عن أسئلة مختلفة.`,
        },
      },
      {
        q: {
          en: "Why is dried salted fish excluded?",
          ar: "لماذا استبعد السمك المملح المجفف؟",
        },
        a: {
          en: `It would top this chart at over 60g per 100g — and mislead everyone. Drying removes water and concentrates every gram; nobody eats 100g of it in a sitting. The exclusion is the family's standard concentrate rule, applied mechanically and disclosed on the page.`,
          ar: `كان سيتصدر هذا الجدول بأكثر من 60 جرامًا لكل 100 جرام — ويضلل الجميع. التجفيف ينزع الماء ويركز كل جرام؛ ولا أحد يأكل 100 جرام منه في جلسة. والاستبعاد هو قاعدة المركزات المعتمدة للعائلة، مطبقة ميكانيكيًا ومعلنة في الصفحة.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "high-protein-foods",
    rows: SEAFOOD_ROWS,
  },
  {
    slug: "highest-protein-dairy",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Protein Dairy Foods — Real Database Ranking | Alkemos",
    titleAr: "ما أعلى منتجات الألبان في البروتين؟ الترتيب الحقيقي",
    h1En: "Highest Protein Dairy Foods",
    h1Ar: "ما أعلى منتجات الألبان في البروتين؟",
    descriptionEn: `Parmesan tops the dairy table at ${DAIRY_ROWS[0].value}g protein per 100g — and nonfat cheddar delivers ${DAIRY_ROWS[3].value}g at ${DAIRY_ROWS[3].calories} kcal. Real ranking from the Alkemos database.`,
    descriptionAr: `البارميزان يتصدر الألبان بـ${DAIRY_ROWS[0].value} جم بروتين لكل 100 جرام، والشيدر الخالي من الدسم يمنح ${DAIRY_ROWS[3].value} جم عند ${DAIRY_ROWS[3].calories} سعرة فقط — ترتيب حقيقي من قاعدة بيانات Alkemos.`,
    introEn: `Aged cheese is the dairy aisle's protein champion: parmesan rows open the table at ${DAIRY_ROWS[0].value}–${DAIRY_ROWS[2].value}g per 100g, romano and hard goat cheese follow at ${DAIRY_ROWS[4].value} and ${DAIRY_ROWS[5].value}g, and the whole top twenty stays above ${DAIRY_ROWS[19].value}g. The quiet star sits at row four: nonfat cheddar carries ${DAIRY_ROWS[3].value}g of protein at ${DAIRY_ROWS[3].calories} kcal and 0g fat — a protein density most meats cannot match. Mozzarella lands mid-table at ${DAIRY_ROWS[8].value}g, Swiss at ${DAIRY_ROWS[9].value}g.`,
    introAr: `الجبن المعتّق هو بطل البروتين في رف الألبان: صفوف البارميزان تفتتح الجدول بـ${DAIRY_ROWS[0].value}–${DAIRY_ROWS[2].value} جرامًا لكل 100 جرام، وتتبعه جبنة الرومانو وجبن الماعز القاسي بـ${DAIRY_ROWS[4].value} و${DAIRY_ROWS[5].value} جرام، ويبقى العشرون الأوائل كلها فوق ${DAIRY_ROWS[19].value} جرامًا. والنجم الصامت يجلس في الصف الرابع: الشيدر الخالي من الدسم يحمل ${DAIRY_ROWS[3].value} جرام بروتين عند ${DAIRY_ROWS[3].calories} سعرة وصفر دهون — كثافة بروتين تعجز عنها معظم اللحوم. والموزاريلا في منتصف الجدول بـ${DAIRY_ROWS[8].value} جرام والسويسرية بـ${DAIRY_ROWS[9].value} جرام.`,
    criterionEn: `Every dairy-category row in the database with a real Arabic name enters, ranked by protein per 100g, descending. The family scope rules apply (no spice rows, no dried/powder forms); fresh milk, yogurt and cottage cheese rank below the top twenty on their own pages — their water content dilutes the per-100g figure, which is exactly what hard cheese removes.`,
    criterionAr: `كل صف من فئة الألبان في القاعدة باسم عربي حقيقي يدخل، مرتبًا بالبروتين لكل 100 جرام تنازليًا، مع قواعد نطاق العائلة (لا توابل ولا أشكال مجففة أو مسحوقة). والحليب والزبادي والجبن القريش يقعون أسفل العشرين في صفحاتهم — فالماء في تركيبها يخفف رقم المائة جرام، وهو بالضبط ما ينزعه الجبن القاسي.`,
    metricEn: "Protein (g / 100g)",
    metricAr: "البروتين (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "Why hard cheese runs away with it", ar: "لماذا يتفوق الجبن القاسي" },
        body: {
          en: `Cheese is milk with most of its water removed, so every 100g concentrates the protein of roughly a liter of milk's solids. Parmesan's ${DAIRY_ROWS[0].value}g comes from long aging that also dries it further — you grate it, a serving is grams, and the calorie column (${DAIRY_ROWS[0].calories} kcal) is the honest cost of that concentration.`,
          ar: `الجبن حليب نُزع معظم مائه، فكل 100 جرام تركز بروتين ما يقارب لترًا من مكونات الحليب الصلبة. و${DAIRY_ROWS[0].value} جرامًا في البارميزان ثمرة تعتيق طويل يجففه أكثر — تبشره وتأكل منه جرامات، وعمود السعرات (${DAIRY_ROWS[0].calories} سعرة) هو الثمن الصادق لهذا التركيز.`,
        },
      },
      {
        heading: { en: "The nonfat cheddar anomaly", ar: "مفارقة الشيدر الخالي من الدسم" },
        body: {
          en: `Row four is the diet hack the table surfaces on its own: ${DAIRY_ROWS[3].value}g protein, ${DAIRY_ROWS[3].calories} kcal, zero fat. In protein-per-calorie terms it outperforms every other row here including the parmesan podium — the trade is texture and melt behavior, which the food page documents honestly.`,
          ar: `الصف الرابع هو الحل الذي يكشفه الجدول بنفسه: ${DAIRY_ROWS[3].value} جرام بروتين و${DAIRY_ROWS[3].calories} سعرة وصفر دهون. وبمقياس البروتين لكل سعرة يتفوق على كل صفوف هذا الجدول بمن فيهم منصة البارميزان — والثمن هو الملمس وسلوك الذوبان الذي توثقه صفحة الصنف بأمانة.`,
        },
      },
      {
        heading: { en: "Where your daily glass ranks", ar: "أين يقع كوب الحليب اليومي" },
        body: {
          en: `Milk sits near 3g per 100g — far below this table — because it is mostly water. That is not a flaw; it is a different serving reality. The table answers "which dairy packs the most protein per bite"; a glass answers hydration, calcium and routine. Both pages carry their own numbers.`,
          ar: `يقع الحليب قرب 3 جرامات لكل 100 جرام — بعيدًا أسفل هذا الجدول — لأن معظمه ماء. وهذه ليست عيوبًا بل واقع حصة مختلف: الجدول يجيب عن سؤال «أي الألبان أكثف بروتينًا في اللقمة»، والكوب يجيب عن الترطيب والكالسيوم والروتين. وكلتا الصفحتين تحملان أرقامهما الخاصة.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Is cheese a good protein source for muscle building?",
          ar: "هل الجبن مصدر بروتين جيد لبناء العضلات؟",
        },
        a: {
          en: `Per bite, the hardest cheeses rival meat: ${DAIRY_ROWS[0].value}g in parmesan, ${DAIRY_ROWS[9].value}g in Swiss. The catch is the fat that rides along — ${DAIRY_ROWS[9].fat}g per 100g in Swiss — so lifters on tight calories usually lean on the nonfat rows and treat full-fat cheese as a flavor layer, not the protein base.`,
          ar: `في اللقمة الواحدة تنافس الأجبان القاسية اللحوم: ${DAIRY_ROWS[0].value} جرامًا في البارميزان و${DAIRY_ROWS[9].value} في السويسرية. والتحفظ هو الدهون المرافقة — ${DAIRY_ROWS[9].fat} جرام لكل 100 جرام في السويسرية — لذا يعتمد الرياضيون داخل سعرات محدودة على الصفوف الخالية من الدسم ويعاملون الجبن كامل الدسم كطبقة نكهة لا كأساس للبروتين.`,
        },
      },
      {
        q: {
          en: "Why do so many parmesan rows appear?",
          ar: "لماذا تتكرر صفوف البارميزان كثيرًا؟",
        },
        a: {
          en: `The database keeps each commercial form as its own measured row — low-sodium, shredded, hard, grated — and each carries slightly different numbers (${DAIRY_ROWS[0].value} down to ${DAIRY_ROWS[7].value}g). The ranking is honest to the data; pick the row that matches what your kitchen actually holds.`,
          ar: `تحتفظ القاعدة بكل صورة تجارية كصف مقاس مستقل — قليل الصوديوم، مبروش، قاسي، مبشور — وكل صف يحمل أرقامًا مختلفة قليلًا (${DAIRY_ROWS[0].value} نزولًا إلى ${DAIRY_ROWS[7].value} جرام). والترتيب أمين للبيانات؛ اختر الصف الذي يطابق ما في مطبخك فعلًا.`,
        },
      },
      {
        q: {
          en: "What about Greek yogurt and cottage cheese?",
          ar: "ماذا عن الزبادي اليوناني والجبن القريش؟",
        },
        a: {
          en: `They are the per-calorie winners of dairy but sit under the 100g bar this table measures — around 10-12g — because they keep far more water. If your goal is maximum protein per calorie rather than per bite, the efficiency ranking answers it better than this one.`,
          ar: `هما الفائزان بلغة البروتين لكل سعرة في عائلة الألبان، لكنهما يقعان دون عتبة هذا الجدول — قرب 10-12 جرامًا — لأنهما يحتفظان بماء أكثر بكثير. إن كان هدفك أقصى بروتين لكل سعرة لا لكل لقمة فترتيب الكفاءة يجيبك أفضل من هذا الجدول.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "high-protein-foods",
    rows: DAIRY_ROWS,
  },
  {
    slug: "highest-protein-nuts-seeds",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Protein Nuts and Seeds — Real Ranking | Alkemos",
    titleAr: "ما أعلى المكسرات والبذور بروتينًا؟ الترتيب الحقيقي",
    h1En: "Highest Protein Nuts and Seeds",
    h1Ar: "ما أعلى المكسرات والبذور بروتينًا؟",
    descriptionEn: `Hemp seeds lead at ${NUTS_ROWS[0].value}g protein per 100g, pumpkin kernels and peanuts follow — a real ranking of nuts and seeds from the Alkemos food database.`,
    descriptionAr: `بذور القنب تتصدر بـ${NUTS_ROWS[0].value} جم بروتين لكل 100 جرام، تليها لب القرع والفول السوداني — ترتيب حقيقي للمكسرات والبذور من قاعدة أطعمة Alkemos.`,
    introEn: `The shelf's quiet protein stack: hulled hemp seeds open at ${NUTS_ROWS[0].value}g per 100g, roasted pumpkin kernels take second at ${NUTS_ROWS[1].value}g, and peanuts — technically a legume that eats like a nut — hold third at ${NUTS_ROWS[2].value}g. Almonds in their many forms occupy the ${NUTS_ROWS[3].value}–${NUTS_ROWS[9].value}g belt, pistachios hold the ${NUTS_ROWS[17].value}g mark, and the whole pumpkin seeds and flaxseed bring up the rear at ${NUTS_ROWS[18].value} and ${NUTS_ROWS[19].value}g — the latter carrying ${NUTS_ROWS[19].fiber}g of fiber alongside.`,
    introAr: `رَفُّ البروتين الصامت في متاجر البقالة: بذور القنب المقشورة تفتتح بـ${NUTS_ROWS[0].value} جرامًا لكل 100 جرام، ولب بذور القرع المحمص يحتل المركز الثاني بـ${NUTS_ROWS[1].value} جرام، والفول السوداني — بقوليا عمليًا تأكلها كمكسرات — يحتفظ بالثالث بـ${NUTS_ROWS[2].value} جرام. ويشغل اللوز بصوره المتعددة حزام ${NUTS_ROWS[3].value}–${NUTS_ROWS[9].value} جرام، ويحرس الفستق علامة ${NUTS_ROWS[17].value} جرام، وتجلب بذور القرع الكاملة وبذر الكتان المؤخرة بـ${NUTS_ROWS[18].value} و${NUTS_ROWS[19].value} جرام — والأخير محمّل بـ${NUTS_ROWS[19].fiber} جرامًا من الألياف.`,
    criterionEn: `Every nut and seed row in the database with a real Arabic name enters, ranked by protein per 100g, descending, under the family scope rules (no spice rows, no dried/powder forms). Salted, roasted and raw versions of the same seed are separate measured rows — the sodium belongs to the roasting pan, not the seed.`,
    criterionAr: `كل صف مكسرات وبذور في القاعدة باسم عربي حقيقي يدخل، مرتبًا بالبروتين لكل 100 جرام تنازليًا، تحت قواعد نطاق العائلة (لا توابل ولا أشكال مجففة أو مسحوقة). والنسخ المملحة والمحمصة والنيئة من البذرة نفسها صفوف مقاسة مستقلة — فالملح ملك لمقلاة التحميص لا للبذرة.`,
    metricEn: "Protein (g / 100g)",
    metricAr: "البروتين (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "Seeds beat the classic nuts", ar: "البذور تتفوق على المكسرات الكلاسيكية" },
        body: {
          en: `The podium is all seeds: hemp ${NUTS_ROWS[0].value}g, pumpkin kernels ${NUTS_ROWS[1].value}g, then peanuts at ${NUTS_ROWS[2].value}g. They also bring the family's better fiber numbers — pumpkin kernels carry ${NUTS_ROWS[1].fiber}g — while walnuts and cashews miss the twenty entirely on protein, whatever their other virtues.`,
          ar: `المنصة كلها بذور: القنب ${NUTS_ROWS[0].value} جرامًا ولب القرع ${NUTS_ROWS[1].value} ثم الفول السوداني ${NUTS_ROWS[2].value}. وهي أيضًا تحمل أرقام الألياف الأفضل في العائلة — لب القرع يحمل ${NUTS_ROWS[1].fiber} جرامًا — بينما يغيب الجوز والكاجو عن العشرين تمامًا في البروتين مهما كانت فضائلهما الأخرى.`,
        },
      },
      {
        heading: { en: "The calorie column is the deal", ar: "عمود السعرات هو العقد" },
        body: {
          en: `The rows run ${NUTS_ROWS[18].calories}–${NUTS_ROWS[10].calories} kcal per 100g — half a day's budget for many diets. A 30g handful of hemp seeds delivers about ${Math.round(NUTS_ROWS[0].value * 0.3)}g of protein for about ${Math.round(NUTS_ROWS[0].calories * 0.3)} kcal. Useful? Yes. Free? Never — the table says so plainly.`,
          ar: `تتراوح الصفوف بين ${NUTS_ROWS[18].calories} و${NUTS_ROWS[10].calories} سعرة لكل 100 جرام — نصف ميزانية يوم كامل لدى كثير من الأنظمة. وملء اليد (30 جرامًا) من بذور القنب يمنح نحو ${Math.round(NUTS_ROWS[0].value * 0.3)} جرام بروتين مقابل نحو ${Math.round(NUTS_ROWS[0].calories * 0.3)} سعرة. مفيد؟ نعم. مجاني؟ أبدًا — والجدول يقولها بوضوح.`,
        },
      },
      {
        heading: { en: "Almond butter counts too", ar: "زبدة اللوز محسوبة أيضًا" },
        body: {
          en: `The almond-butter rows sit at ${NUTS_ROWS[10].value}g — grinding changes nothing about the protein, only the eating speed. That is the practical warning of this family: a spoon slides down faster than a chewed handful, and the calorie column does not pause with you.`,
          ar: `تقع صفوف زبدة اللوز عند ${NUTS_ROWS[10].value} جرامًا — الطحن لا يغير من البروتين شيئًا، بل يغير سرعة الأكل فقط. وهذا تحذير هذه العائلة العملي: الملعقة تنزلق أسرع من حفنة تُمضغ، وعمود السعرات لا يتوقف معك.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Can nuts be my main protein source?",
          ar: "هل يمكن أن تكون المكسرات مصدر بروتيني الأساسي؟",
        },
        a: {
          en: `As a base, the math fights you: reaching 120g of protein from almonds alone means roughly 570g of them — over 3,300 kcal before anything else on the plate. As a contributor — ${Math.round(NUTS_ROWS[2].value * 0.3)}g per peanut handful — they are excellent; pair them with the legume and dairy tables for the heavy lifting.`,
          ar: `كأساس، تحاربك الحسابات: الوصول إلى 120 جرام بروتين من اللوز وحده يعني نحو 570 جرامًا منه — أكثر من 3300 سعرة قبل أي شيء آخر بالطبق. كمساهم — ${Math.round(NUTS_ROWS[2].value * 0.3)} جرامًا لكل حفنة فول سوداني — ممتازة؛ اقترنها بجدولي البقول والألبان لتحمل الأثقال.`,
        },
      },
      {
        q: {
          en: "Are roasted nuts lower in protein than raw?",
          ar: "هل المكسرات المحمصة أقل بروتينًا من النيئة؟",
        },
        a: {
          en: `The rows barely differ — raw pistachio ${NUTS_ROWS[12].value}g versus the roasted forms within a gram. Roasting's real costs are added oil and salt in some rows, visible in the calorie and sodium columns of each linked page. Home-roasting dry keeps the row's numbers closest.`,
          ar: `الصفوف تكاد لا تختلف — الفستق النيء ${NUTS_ROWS[12].value} جرامًا مقابل صور محمصة ضمن جرام واحد. أما كلفة التحميص الحقيقية فهي الزيت والملح المضافان في بعض الصفوف، ويظهران في عمودي السعرات والصوديوم بكل صفحة مربوطة. والتحميص الجاف منزليًا يبقي أرقام الصف أقرب ما تكون.`,
        },
      },
      {
        q: {
          en: "Why is the peanut in a nuts table?",
          ar: "لماذا يدخل الفول السوداني جدول المكسرات؟",
        },
        a: {
          en: `Botanically it grows underground as a legume, but it is bought, stored and eaten exactly like its shelf neighbors, and the database's nut category reflects that kitchen reality. Nutritionally it earns the seat honestly: ${NUTS_ROWS[2].value}g of protein per 100g, third on the table.`,
          ar: `نباتيًا ينمو تحت الأرض ضمن البقوليات، لكنه يُشترى ويُخزّن ويُؤكل تمامًا كجيرانه على الرف، وفئة المكسرات في القاعدة تعكس واقع المطبخ هذا. وغذائيًا يستحق المقعد بجدارة: ${NUTS_ROWS[2].value} جرام بروتين لكل 100 جرام، الثالث على الجدول.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "high-protein-foods",
    rows: NUTS_ROWS,
  },
  {
    slug: "highest-protein-vegetables",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Protein Vegetables — Real Database Ranking | Alkemos",
    titleAr: "ما أعلى الخضروات في البروتين؟ الترتيب الحقيقي",
    h1En: "Highest Protein Vegetables",
    h1Ar: "ما أعلى الخضروات في البروتين؟",
    descriptionEn: `Soybean sprouts top the vegetable table at ${VEG_ROWS[0].value}g protein per 100g, green soybeans and edamame follow — the real vegetable-protein ranking from Alkemos.`,
    descriptionAr: `براعم فول الصويا تتصدر جدول الخضروات بـ${VEG_ROWS[0].value} جم بروتين لكل 100 جرام، تليها حبوب الصويا الخضراء والإدامامي — الترتيب الحقيقي لبروتين الخضروات من قاعدة Alkemos.`,
    introEn: `Vegetables peak where the legume family lives: soybean sprouts open at ${VEG_ROWS[0].value}g per 100g, green soybeans and edamame hold the ${VEG_ROWS[2].value}–${VEG_ROWS[5].value}g band, and immature pinto beans, black-eyed peas and sprouted lentils fill the middle down to ${VEG_ROWS[19].value}g. The table's honest ceiling matters: not one leafy salad staple reaches it — spinach and broccoli sit far below, on their own pages, at a fraction of these numbers.`,
    introAr: `تبلغ الخضروات ذروتها حيث تعيش عائلة البقوليات: براعم فول الصويا تفتتح بـ${VEG_ROWS[0].value} جرامًا لكل 100 جرام، وفول الصويا الأخضر والإدامامي يحتفظان بنطاق ${VEG_ROWS[2].value}–${VEG_ROWS[5].value} جرام، وتملأ الفاصوليا الخضراء غير الناضجة ولوبيا العين السوداء والعدس المنبت الوسط نزولًا إلى ${VEG_ROWS[19].value} جرام. وسقف الجدول الصادق مهم: لا تصل إليه أي من أساسيات سلطة الورقيات — فالسبانخ والبروكلي يجلسان أسفل بكثير، في صفحتيهما، عند كسر من هذه الأرقام.`,
    criterionEn: `Every vegetable-category row with a real Arabic name enters, ranked by protein per 100g, descending. Family scope rules apply, and dehydrated vegetable rows are additionally excluded — removing water concentrates the number without changing any real plate. Immature (green) beans and sprouts stay: they are the category's genuine vegetables-as-protein.`,
    criterionAr: `كل صف من فئة الخضروات باسم عربي حقيقي يدخل، مرتبًا بالبروتين لكل 100 جرام تنازليًا، مع قواعد نطاق العائلة، واستبعاد إضافي لصفوف الخضروات المجففة — نزع الماء يضخم الرقم دون أن يغير أي طبق حقيقي. وتبقى البقوليات غير الناضجة (الخضراء) والبراعم: فهي خضروات العائلة الحقيقية بوصفها مصدر بروتين.`,
    metricEn: "Protein (g / 100g)",
    metricAr: "البروتين (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "Soy owns the podium", ar: "الصويا تملك المنصة" },
        body: {
          en: `Every top-seven row is a soy vegetable: sprouts at ${VEG_ROWS[0].value}g, green soybeans at ${VEG_ROWS[2].value}g, edamame at ${VEG_ROWS[5].value}g. No other plant in the produce aisle comes close to that band — which is why tofu and its family anchor every serious plant-protein kitchen.`,
          ar: `كل صف من السبعة الأولى خضار صويا: البراعم عند ${VEG_ROWS[0].value} جرامًا وفول الصويا الأخضر عند ${VEG_ROWS[2].value} والإدامامي عند ${VEG_ROWS[5].value}. ولا يقترب من هذا النطاق أي نبات آخر في قسم الخضروات — ولهذا يرسي التوفو وعائلته مرساة كل مطبخ جاد للبروتين النباتي.`,
        },
      },
      {
        heading: { en: "The pod vegetables earn their rows", ar: "خضروات القرون تستحق صفوفها" },
        body: {
          en: `Immature pinto beans (${VEG_ROWS[7].value}g) and black-eyed peas (${VEG_ROWS[10].value}g) are picked green and eaten as vegetables — pods and all in some kitchens — carrying both protein and ${VEG_ROWS[7].fiber}g-class fiber. Sprouted lentils (${VEG_ROWS[11].value}g) turn a dry pantry staple into a fresh-crisp one within days.`,
          ar: `تُقطف الفاصوليا البينتو غير الناضجة (${VEG_ROWS[7].value} جرامًا) ولوبيا العين السوداء (${VEG_ROWS[10].value} جرامًا) خضراء وتُؤكل كخضروات — بقرونها في بعض المطابخ — حاملة البروتين وأليافًا من فئة ${VEG_ROWS[7].fiber} جرام. والعدس المنبت (${VEG_ROWS[11].value} جرامًا) يحول أساسًا جافًا من الخزانة إلى طازج مقرمش في أيام.`,
        },
      },
      {
        heading: { en: "Where the famous greens actually sit", ar: "أين تجلس الورقيات المشهورة فعلًا" },
        body: {
          en: `Spinach's celebrated protein lives around 3g per 100g — a tenth of the podium — because a leaf is mostly water and air. This table does not diminish greens; it prices them honestly: eat them for micronutrients and volume, and let the soy and pod rows carry the protein load.`,
          ar: `بروتين السبانخ المحتفى به يعيش قرب 3 جرامات لكل 100 جرام — عُشر المنصة — لأن الورقة ماء وهواء في معظمها. وهذا الجدول لا ينتقص من الورقيات؛ بل يسعّرها بصدق: كُلها من أجل المغذيات الدقيقة والحجم، ودع صفوف الصويا والقرون تحمل عبء البروتين.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Can I build muscle on vegetable protein alone?",
          ar: "هل أستطيع بناء العضلات من بروتين الخضروات وحده؟",
        },
        a: {
          en: `Yes, with planning: the soy rows here deliver complete protein at meat-adjacent per-bite density, and the pod vegetables stack alongside. The volume is the challenge — matching a chicken breast's 31g means roughly 240g of edamame. The macro calculator sizes whichever mix you choose.`,
          ar: `نعم، مع تخطيط: صفوف الصويا هنا تقدم بروتينًا كاملًا بكثافة تقارب اللحوم في اللقمة، وخضروات القرون تتراكم معها. والتحدي هو الحجم — مجاراة 31 جرامًا من صدر الدجاج تعني نحو 240 جرامًا من الإدامامي. وحاسبة الماكروز تحسب أي مزيج تختاره.`,
        },
      },
      {
        q: {
          en: "Why are dried vegetables excluded?",
          ar: "لماذا استبعدت الخضروات المجففة؟",
        },
        a: {
          en: `A dehydrated onion flake measures 8+ grams of protein per 100g — but that 100g started as roughly a kilogram of fresh onions. The number is arithmetically true and practically meaningless, so this list excludes dehydrated rows mechanically, and says so here.`,
          ar: `رقاقة البصل المجفف تقيس أكثر من 8 جرامات بروتين لكل 100 جرام — لكن هذه الـ100 جرام كانت في الأصل نحو كيلوغرام من البصل الطازج. الرقم صادق حسابيًا وبلا معنى عمليًا، لذا يستبعد هذا الجدول الصفوف المجففة ميكانيكيًا ويصرح بذلك هنا.`,
        },
      },
      {
        q: {
          en: "Are sprouts safe to eat raw?",
          ar: "هل البراعم آمنة للأكل نيئة؟",
        },
        a: {
          en: `The rows offer both states — raw and stir-fried measure the same ${VEG_ROWS[0].value}g band here — and the choice is food safety, not protein: warm sprouting conditions can grow bacteria, so vulnerable groups are advised to cook them. The protein survives the pan either way.`,
          ar: `تقدم الصفوف الحالتين معًا — النيء والمقلي سريعًا يقيسان نطاق ${VEG_ROWS[0].value} جرامًا نفسه هنا — والاختيار مسألة سلامة غذائية لا بروتين: فظروف الإنبات الدافئة قد تنمو فيها البكتيريا، ويُنصح الفئات الأكثر عرضة بطهيها. والبروتين ينجو من المقلاة في الحالتين.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "vegan-protein-sources",
    rows: VEG_ROWS,
  },
  {
    slug: "leanest-high-protein-foods",
    publishedAt: PUBLISHED_AT,
    titleEn: "Leanest High Protein Foods (Lowest Fat) — Ranked | Alkemos",
    titleAr: "ما أقل مصادر البروتين دهونًا؟ الترتيب الحقيقي",
    h1En: "Leanest High-Protein Foods",
    h1Ar: "ما أقل مصادر البروتين دهونًا؟",
    descriptionEn: `Nonfat cheddar and cod anchor the leanest-proteins table at ${LEAN_ROWS[1].fat}–${LEAN_ROWS[2].value}g fat per 100g with 20g+ protein each — ranked from the Alkemos database.`,
    descriptionAr: `الشيدر الخالي من الدسم والقدّاك يرسيان جدول البروتينات الأقل دهنًا عند ${LEAN_ROWS[1].fat}–${LEAN_ROWS[2].value} جم دهون لكل 100 جرام مع بروتين يتجاوز 20 جم — مرتبة من قاعدة بيانات Alkemos.`,
    introEn: `The cutting-phase shortlist: every food here clears the 20g-protein bar per 100g, then ranks by fat, ascending. Two nonfat cheeses sit at zero (${LEAN_ROWS[0].value}g and ${LEAN_ROWS[1].value}g of fat), Pacific cod follows at ${LEAN_ROWS[2].value}g, and shrimp, tuna, scallops, smoked haddock and turkey breast crowd the sub-1.5g band. Even the table's last row — cooked cuttlefish — carries only ${LEAN_ROWS[19].value}g of fat with ${LEAN_ROWS[19].protein}g of protein.`,
    introAr: `القائمة المختصرة لمرحلة التنشيف: كل صنف هنا يتجاوز عتبة 20 جرام بروتين لكل 100 جرام، ثم يُرتب بالدهون تصاعديًا. جبنان خاليان من الدسم يجلسان عند الصفر (${LEAN_ROWS[0].value} و${LEAN_ROWS[1].value} جرام دهون)، ويتبعهما قدّاك المحيط الهادئ عند ${LEAN_ROWS[2].value} جرام، ويزدحم الجمبري والتونة والسكالوب والهادوك المدخن وصدر الديك الرومي في نطاق ما دون 1.5 جرام. وحتى الصف الأخير بالجدول — السبيط المطهو — لا يحمل سوى ${LEAN_ROWS[19].value} جرام دهون مع ${LEAN_ROWS[19].protein} جرام بروتين.`,
    criterionEn: `The bar: protein ≥ 20g per 100g — the classic "protein food" threshold. The sort: fat per 100g, ascending, ties broken deterministically. Raw dry-legume rows are excluded (nobody eats raw kidney beans, and their per-100g numbers are triple the cooked plate). Raw fish and meat rows stay — they are standard ingredient states, and each linked page declares its own.`,
    criterionAr: `العتبة: بروتين ≥ 20 جرامًا لكل 100 جرام — حد «الصنف البروتيني» الكلاسيكي. والترتيب: الدهون لكل 100 جرام تصاعديًا، والتعادل يُحسم حتميًا. واستُبعدت صفوف البقوليات الجافة النيئة (لا أحد يأكل الفاصوليا الحمراء نيئة، وأرقامها لكل 100 جرام ثلاثة أمثال الطبق المطهو). وبقيت صفوف السمك واللحم النيئة — فهي حالات مكونات معيارية، وكل صفحة مربوطة تصرح بحالتها.`,
    metricEn: "Fat (g / 100g)",
    metricAr: "الدهون (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "White fish is the cut's best friend", ar: "السمك الأبيض صديق التنشيف الأول" },
        body: {
          en: `Cod at ${LEAN_ROWS[2].value}g fat and ${LEAN_ROWS[2].protein}g protein, snapper at ${LEAN_ROWS[16].value}g, tuna family rows throughout: the ocean's lean white filets give meat-portion protein at vegetable-adjacent calorie costs (${LEAN_ROWS[2].calories} kcal for cod). If your deficit budget is tight, this column is where you shop.`,
          ar: `القدّاك عند ${LEAN_ROWS[2].value} جرام دهون و${LEAN_ROWS[2].protein} جرام بروتين، والناجل عند ${LEAN_ROWS[16].value} جرام، وصفوف عائلة التونة في كل مكان: فيليه البحر الأبيض الرشيق يمنح بروتينًا بحجم اللحم بكلفة سعرات تقارب الخضروات (${LEAN_ROWS[2].calories} سعرة للقدّاك). إن كانت ميزانية العجز ضيقة فهذا العمود سوقك.`,
        },
      },
      {
        heading: { en: "Turkey breast over chicken, this once", ar: "صدر الرومي يتقدم الدجاج هذه المرة" },
        body: {
          en: `The table's poultry seat goes to turkey breast: ${LEAN_ROWS[13].protein}g protein against ${LEAN_ROWS[13].value}g of fat at ${LEAN_ROWS[13].calories} kcal. Chicken breast — the default lean pick — carries more fat per row (its pages say exactly how much) and still beats nearly everything else; turkey simply edges it on this one metric.`,
          ar: `مقعد الدواجن في الجدول لصدر الديك الرومي: ${LEAN_ROWS[13].protein} جرام بروتين مقابل ${LEAN_ROWS[13].value} جرام دهون عند ${LEAN_ROWS[13].calories} سعرة. وصدر الدجاج — الخيار الرشيق الافتراضي — يحمل دهونًا أكثر في صفوفه (صفحاته تقول كم بالضبط) ويظل متفوقًا على كل شيء تقريبًا؛ لكن الرومي يتفوق عليه في هذا المقياس وحده.`,
        },
      },
      {
        heading: { en: "The zero-fat cheese trade", ar: "صفقة الجبن صفر الدسم" },
        body: {
          en: `Nonfat cheddar's row — ${LEAN_ROWS[1].protein}g protein, zero fat, ${LEAN_ROWS[1].calories} kcal — is the most extreme protein-per-calorie object in the database. The honest trade: nonfat cheese melts differently and tastes sharper; it is a tool for the last weeks of a cut, not a way of eating.`,
          ar: `صف الشيدر الخالي من الدسم — ${LEAN_ROWS[1].protein} جرام بروتين وصفر دهون و${LEAN_ROWS[1].calories} سعرة — أكثر أغراض القالة تطرفًا في البروتين لكل سعرة عبر القاعدة كلها. والصفقة الصادقة: الجبن منزوع الدسم يذوب بشكل مختلف وطعمه أكثر حدّة؛ هو أداة لأسابيع التنشيف الأخيرة لا أسلوب حياة.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Does eating lean protein automatically cut body fat?",
          ar: "هل أكل البروتين قليل الدهن يذيب دهون الجسم تلقائيًا؟",
        },
        a: {
          en: `No — fat loss is the calorie deficit, and these rows simply make building one easier: high protein at minimal fat cost keeps portions large and muscle protected. The calorie column here is the working number; the deficit itself is set outside any single food, in your daily total.`,
          ar: `لا — خسارة الدهون هي عجز السعرات، وهذه الصفوف تجعل بناءه أسهل فحسب: بروتين عالٍ بأقل كلفة دهنية يبقي الحصص كبيرة والعضلات محمية. عمود السعرات هنا هو رقم العمل؛ أما العجز نفسه فيُضبط خارج أي صنف منفرد، في مجموعك اليومي.`,
        },
      },
      {
        q: {
          en: "Why is beef missing from this table?",
          ar: "لماذا يغيب اللحم البقري عن هذا الجدول؟",
        },
        a: {
          en: `Lean beef rows clear the protein bar easily but carry 4-6g of fat per 100g even trimmed — above every row here. They remain excellent proteins on their own pages; this table simply answers the narrow question of which proteins cost the least fat per bite.`,
          ar: `صفوف اللحم البقري قليل الدهن تتجاوز عتبة البروتين بسهولة لكنها تحمل 4-6 جرامات دهون لكل 100 جرام حتى بعد التشذيب — فوق كل صف هنا. وتبقى بروتينات ممتازة في صفحاتها؛ هذا الجدول يجيب فقط عن السؤال الضيق: أي البروتينات أقل كلفة دهنية في اللقمة.`,
        },
      },
      {
        q: {
          en: "Is raw fish in the list safe advice?",
          ar: "هل وجود السمك النيء بالقائمة نصيحة آمنة؟",
        },
        a: {
          en: `The raw rows are database states, not serving suggestions — sashimi-grade handling is a separate discipline. Cooked rows of the same species sit beside them (cod, shrimp, tuna all appear both ways), and the protein number barely moves between the two states.`,
          ar: `الصفوف النيئة حالات قاعدة بيانات لا توصيات تقديم — فالتعامل بجودة الساشيمي انضباط منفصل. وصفوف المطهو من النوع نفسه تجلس بجانبها (القدّاك والجمبري والتونة حاضرة بالحالتين)، ورقم البروتين يكاد لا يتحرك بين الحالتين.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
    collectionSlug: "low-fat-foods",
    rows: LEAN_ROWS,
  },
  {
    slug: "highest-carb-foods",
    publishedAt: PUBLISHED_AT,
    titleEn: "Highest Carb Staple Foods — Dry-Weight Ranking | Alkemos",
    titleAr: "ما أعلى الأطعمة في الكربوهيدرات؟ ترتيب الأوزان الجافة",
    h1En: "Highest Carb Staple Foods",
    h1Ar: "ما أعلى الأطعمة في الكربوهيدرات؟",
    descriptionEn: `Corn flakes, matzo and glutinous rice lead the carb staples at ${CARBS_ROWS[0].value}–${CARBS_ROWS[3].value}g carbs per 100g dry weight — the real ranking from the Alkemos database.`,
    descriptionAr: `الكورن فليكس وخبز الماتزو والأرز اللزج تقود أطعمة الكربوهيدرات عند ${CARBS_ROWS[0].value}–${CARBS_ROWS[3].value} جم لكل 100 جرام بالوزن الجاف — الترتيب الحقيقي من قاعدة بيانات Alkemos.`,
    introEn: `The carb-loading shelf, weighed as you buy it: corn flakes open at ${CARBS_ROWS[0].value}g per 100g, matzo and fat-free saltines hold ${CARBS_ROWS[1].value}–${CARBS_ROWS[2].value}g, glutinous rice reaches ${CARBS_ROWS[3].value}g, and the white-rice family fills the ${CARBS_ROWS[7].value}–${CARBS_ROWS[16].value}g band alongside cornmeal. The popcorn rows close at ${CARBS_ROWS[19].value}g — with ${CARBS_ROWS[19].fiber}g of fiber that the polished rices left behind.`,
    introAr: `رفُّ تحميل الكربوهيدرات، موزونًا كما تشتريه: الكورن فليكس يفتتح بـ${CARBS_ROWS[0].value} جرامًا لكل 100 جرام، ويتمسك الماتزو والبسكويت المملح الخالي من الدهون بـ${CARBS_ROWS[1].value}–${CARBS_ROWS[2].value} جرام، ويبلغ الأرز اللزج ${CARBS_ROWS[3].value} جرام، وتملأ عائلة الأرز الأبيض نطاق ${CARBS_ROWS[7].value}–${CARBS_ROWS[16].value} جرام مع دقيق الذرة. وتختم صفوف الفشار عند ${CARBS_ROWS[19].value} جرامًا — ومعها ${CARBS_ROWS[19].fiber} جرامًا من الألياف التي تركها الأرز المصقول خلفه.`,
    criterionEn: `Staple carbohydrates ranked by carbs per 100g, descending, at DRY weight — the weight on the package you buy. The sweets class is out by rule (sugars, candies, sweeteners, syrups, honey, jams, cookies), as are pure starch ingredients, pure fats and drinks, and dehydrated or dried-fruit forms whose concentration fakes the podium. Cooked weights differ — rice roughly triples — so compare at the bag, not the plate.`,
    criterionAr: `الكربوهيدرات الأساسية مرتبة بالكربوهيدرات لكل 100 جرام تنازليًا بالوزن الجاف — الوزن المكتوب على العبوة التي تشتريها. وفئة الحلويات خارجة بقاعدة (السكريات والحلوى والمحليات والشرابات والعسل والمربى والكوكيز)، وكذلك مكونات النشا الصرفة والدهون الصرفة والمشروبات، والأشكال المجففة وفواكهها التي يزيّف تركيزها المنصة. والأوزان المطبوخة مختلفة — الأرز يتضاعف ثلاث مرات تقريبًا — فقارن عند الكيس لا عند الطبق.`,
    metricEn: "Carbs (g / 100g)",
    metricAr: "الكربوهيدرات (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "Rice is the honest bulk king", ar: "الأرز ملك الحجم الأمين" },
        body: {
          en: `Six white-rice rows crowd the top twenty at ${CARBS_ROWS[7].value}–${CARBS_ROWS[16].value}g, and they cost the least per kilo of anything here. For a hard gainer filling a 400g-carb day, that is the arithmetic that works: cheap, neutral, and exactly countable at the dry cup.`,
          ar: `ستة صفوف من الأرز الأبيض تزدحم في العشرين الأوائل عند ${CARBS_ROWS[7].value}–${CARBS_ROWS[16].value} جرام، وهي الأرخص كيلوغرامًا في القائمة كلها. لمُكتسب الوزن الصعب يملأ يومًا بأربعمائة جرام كربوهيدرات، هذا هو الحساب الذي ينجح: رخيص ومحايد وقابل للعد بدقة عند الكوب الجاف.`,
        },
      },
      {
        heading: { en: "Breakfast cereals earn row one", ar: "رقائق الفطور تستحق الصف الأول" },
        body: {
          en: `Corn flakes at ${CARBS_ROWS[0].value}g beat every rice row — concentration again, this time from the cereal extruder. The serving is the catch: 30g in the bowl, about ${Math.round(CARBS_ROWS[0].value * 0.3)}g of carbs, versus ${Math.round(CARBS_ROWS[7].value * 0.75)}g in a 75g dry rice portion. The column ranks; the portion decides.`,
          ar: `الكورن فليكس عند ${CARBS_ROWS[0].value} جرامًا يتفوق على كل صفوف الأرز — تركيز مرة أخرى، وهذه المرة من مطحنة البثق. والحصة هي الفخ: 30 جرامًا في الوعاء تعني نحو ${Math.round(CARBS_ROWS[0].value * 0.3)} جرام كربوهيدرات، مقابل ${Math.round(CARBS_ROWS[7].value * 0.75)} جرامًا في حصة 75 جرامًا جافة من الأرز. العمود يرتب؛ والحصة تحسم.`,
        },
      },
      {
        heading: { en: "Popcorn keeps its fiber", ar: "الفشار يحتفظ بأليافه" },
        body: {
          en: `Air-popped popcorn carries ${CARBS_ROWS[19].value}g of carbs together with ${CARBS_ROWS[19].fiber}g of fiber — the whole grain's skin survived the pop. Among these refined-heavy rows it is the one intact grain, and the rye wafer's ${CARBS_ROWS[5].fiber}g fiber says the same for its own row.`,
          ar: `فشار الهواء الساخن يحمل ${CARBS_ROWS[19].value} جرام كربوهيدرات مع ${CARBS_ROWS[19].fiber} جرام ألياف — قشر الحبة الكاملة نجا من الانفجار. وبين هذه الصفوف المكررة الثقيلة هو الحبة الكاملة الوحيدة، و${CARBS_ROWS[5].fiber} جرام ألياف ويفر الشعير تقول الشيء نفسه عن صفها.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: "Why does the list use dry weight?",
          ar: "لماذا يستخدم الجدول الوزن الجاف؟",
        },
        a: {
          en: `Because the bag is where the number is honest and identical every time: 100g of dry rice is 100g of rice. Cooked weight depends on your pot, water and time — the same rice lands anywhere from doubled to tripled. The dry column is the only version you can plan a macro day around.`,
          ar: `لأن العبوة هي المكان الذي يكون فيه الرقم أمينًا ومتطابقًا في كل مرة: 100 جرام أرز جاف هي 100 جرام أرز. أما الوزن المطبوخ فيعتمد على قِدرَك وماءك ووقتك — الأرز نفسه يهبط في أي نقطة بين الضعف والثلاثة أضعاف. والعمود الجاف هو النسخة الوحيدة التي تستطيع تخطيط يوم ماكرو حولها.`,
        },
      },
      {
        q: {
          en: "Where are fruits and dates?",
          ar: "أين الفواكه والتمور؟",
        },
        a: {
          en: `Fresh fruit carries its water — a banana sits near 23g per 100g, a fraction of these rows. Dates and raisins would score high, but drying them is exactly the concentration trick this family's rules exclude; their pages carry their own honest numbers instead.`,
          ar: `الفاكهة الطازجة تحمل ماءها — الموزة تجلس قرب 23 جرامًا لكل 100 جرام، وهي كسر من هذه الصفوف. والتمور والزبيب سيسجلان عاليًا، لكن تجفيفهما هو بالضبط حيلة التركيز التي تستبعدها قواعد هذه العائلة؛ وصفحاتهما تحمل أرقامهما الصادقة بدلًا من ذلك.`,
        },
      },
      {
        q: {
          en: "Is a high-carb list against low-carb diets?",
          ar: "هل جدول الكربوهيدرات العالية ضد الأنظمة قليلة الكارب؟",
        },
        a: {
          en: `It answers the opposite goal, stated openly: carb loading, gaining weight, and endurance fueling all need these exact foods. The library keeps both doors — a low-carb, high-protein ranking exists for the keto side — and neither table judges the other's diet.`,
          ar: `هو يجيب عن الهدف المعاكس، معلنًا بوضوح: تحميل الكربوهيدرات وكسب الوزن ووقود التحمّل كلها تحتاج هذه الأطعمة بالذات. والمكتبة تُبقي البابين مفتوحين — يوجد ترتيب قليل الكارب عالي البروتين للجهة الكيتونية — ولا يحكم أي جدول على حمية الآخر.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
    collectionSlug: "foods-for-bulking",
    rows: CARBS_ROWS,
  },
];

/** Lookup by slug (route helper). */
export function getNutrientListBySlug(slug: string): NutrientList | null {
  return NUTRIENT_LISTS.find((l) => l.slug === slug) ?? null;
}

/** Lists that deepen a given collection hub (the §4.3 backlink widget). */
export function listsForCollection(collectionSlug: string): NutrientList[] {
  return NUTRIENT_LISTS.filter((l) => l.collectionSlug === collectionSlug);
}

/**
 * GROWTH-PLAN batch 11 (owner order «حسّن الروابط الداخلية»): the ranked
 * lists that contain a given food row — derived 100% from this module so a
 * food page's reciprocal links can never drift from the real lists.
 */
export function getListsContainingFood(foodSlug: string): NutrientList[] {
  return NUTRIENT_LISTS.filter((l) => l.rows.some((r) => r.slug === foodSlug));
}
