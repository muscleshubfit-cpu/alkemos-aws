/**
 * Nutrient-ranked food lists — SEO-GROWTH Phase 2 (owner order 2026-11-06
 * «استكمل المرحلة التالية من خطة استعادة النمو وتحسين SEO/GEO… استكمل جميع
 * الأعمال الممكنة حاليًا… لا تبدأ دفعات مقالات جديدة أو توسع الـ500 صنف قبل
 * حسم قرار D-2»), executing audit file 03 §4.3 (file 07's Phase-2 task line
 * «10-15 قائمة «غني بـ{مغذٍّ}» مبنية من قاعدة البيانات»): ten database-ranked
 * «الأطعمة الغنية بـ…» lists that DEEPEN the ten existing food collection
 * hubs (§4.3: «تعميق المجموعات العشر القائمة»).
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

// The ten ranked tables (20 rows each — the plan's 15-25 window)
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
const LOWSUGAR_ROWS = LOWSUGAR_FRUIT_TOP.map((f) => row(f, r1(sugarOf(f))));
const SEAFOOD_ROWS = SEAFOOD_PROTEIN_TOP.map((f) => row(f, r1(proteinOf(f))));

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
    introEn: `Numbers first: the protein shake tops this ranking at ${PROTEIN_ROWS[0].value}g of protein per 100g, followed by hard cheeses (${PROTEIN_TOP[1].nameEn} at ${PROTEIN_ROWS[1].value}g) and slow-braised lean cuts (up to ${PROTEIN_ROWS[5].value}g). A skinless fried chicken breast sits at ${PROTEIN_ROWS[14].value}g — still excellent, just below the dehydrated and cured forms that concentrate protein. That is the honest story of any per-100g table: removing water and fat pushes a food up the chart. The table below ranks all twenty leaders, and the sections after it translate the raw numbers into what you actually put on a plate.`,
    introAr: `بالأرقام قبل أي شيء: يتصدر المشروب البروتيني هذا الترتيب بـ${PROTEIN_ROWS[0].value} جرام بروتين لكل 100 جرام، تليه الأجبان الصلبة (${PROTEIN_TOP[1].nameAr} بـ${PROTEIN_ROWS[1].value} جرام) وقطع اللحم الخالية المطهوة ببطء (حتى ${PROTEIN_ROWS[5].value} جرامًا). صدر الدجاج بلا جلد يقف عند ${PROTEIN_ROWS[14].value} جرامًا — رقم ممتاز أيضًا، لكنه أسفل الأشكال المعالجة والمجففة التي ركّزت بروتينها. هذه هي الحكاية الصادقة لأي جدول يقيس لكل 100 جرام: نزع الماء والدهون يرفع الصنف للأعلى. الجدول أدناه يعرض العشرين الأوائل، والفقرات بعده تحوّل الأرقام الخام إلى ما تضعه فعلًا في الطبق.`,
    criterionEn: `Every value is the protein-gram column of the Alkemos food database (the same rows each food's own page shows), sorted high-to-low per 100g. Three scope rules keep the table honest: only foods with a real Arabic-market name enter; spices are left out because nobody eats 100g of them; and dried/powder/flour forms are excluded since their 100g serving is never actually eaten. One food can appear in more than one form (raw, cooked) because each database row is its own measurement.`,
    criterionAr: `كل قيمة هي عمود البروتين في قاعدة بيانات أطعمة Alkemos (نفس الصفوف التي تعرضها صفحة كل صنف)، مرتبة تنازليًا لكل 100 جرام. تحرس الجدول ثلاث قواعد معلنة: لا يدخل القائمة إلا صنف باسم عربي حقيقي في القاعدة؛ والتوابل مستبعدة لأن أحدًا لا يأكل 100 جرام منها؛ والأشكال المجففة والمساحيق والدقيق خارج الترتيب لأن حصة الـ100 جرام منها لا تُؤكل فعلًا. وقد يظهر الصنف الواحد بأكثر من صورة (نيء ومطهو) لأن كل صف في القاعدة قياس مستقل بذاته.`,
    metricEn: "Protein (g / 100g)",
    metricAr: "البروتين (جم / 100 جرام)",
    verdicts: [
      {
        heading: { en: "The practical daily winners", ar: "الفائزون العمليون للاستخدام اليومي" },
        body: {
          en: `Strip away the concentrates and the chart belongs to hard cheese and lean braised meat: ${PROTEIN_TOP[1].nameEn} carries ${PROTEIN_ROWS[1].value}g per 100g while a slow-cooked veal leg delivers ${PROTEIN_ROWS[5].value}g at roughly half the calories of the cured options. A 150g portion of that veal is about ${Math.round((PROTEIN_ROWS[5].value * 150) / 100)}g of protein — most of what a training day needs.`,
          ar: `أنزل المساحيق من الحساب وسيتملك الصدارةَ الجبنُ الصلب واللحمُ الخالي المطهو ببطء: ${PROTEIN_TOP[1].nameAr} يحمل ${PROTEIN_ROWS[1].value} جرامًا لكل 100 جرام، وفخذ العجل المطهو يمنح ${PROTEIN_ROWS[5].value} جرامًا بنحو نصف سعرات الخيارات المعالجة. حصة 150 جرامًا من فخذ العجل تعادل ${Math.round((PROTEIN_ROWS[5].value * 150) / 100)} جرام بروتين تقريبًا — معظم ما يحتاجه يوم تدريبي.`,
        },
      },
      {
        heading: { en: "Why the shake leads", ar: "لماذا يتقدم المشروب البروتيني" },
        body: {
          en: `A ${PROTEIN_ROWS[0].value}g-per-100g figure for a shake is real, but the scoop you actually use is 30g — about ${Math.round((PROTEIN_ROWS[0].value * 30) / 100)}g of protein per serving. The table measures density, not convenience; read both columns before crowning a champion.`,
          ar: `رقم ${PROTEIN_ROWS[0].value} جرامًا لكل 100 جرام في المشروب البروتيني حقيقي، لكن المغرفة التي تستخدمها فعلًا وزنها 30 جرامًا — أي ${Math.round((PROTEIN_ROWS[0].value * 30) / 100)} جرام بروتين للحصة. الجدول يقيس الكثافة لا سهولة الاستخدام؛ اقرأ العمودين معًا قبل تتويج البطل.`,
        },
      },
      {
        heading: { en: "Plant options on the board", ar: "الخيارات النباتية على الطاولة" },
        body: {
          en: `Lupins land in the top ten at ${PROTEIN_ROWS.find((r) => r.slug.startsWith("lupins"))!.value}g per 100g raw — the strongest plant row in this table — with soy and seed items close behind in the fuller database. Vegetarians can absolutely compete at this table; they simply arrive through the legume aisle.`,
          ar: `الترمس يدخل العشرة الأوائل بـ${PROTEIN_ROWS.find((r) => r.slug.startsWith("lupins"))!.value} جرامًا لكل 100 جرام نيئًا — أقوى صف نباتي في هذا الجدول — وتحذو صنوف الصويا والبذور حذوه في القاعدة الأكمل. النباتيون قادرون على المنافسة هنا فعلًا؛ يدخلون ببساطة من باب البقوليات.`,
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
          en: `Because the ranking is per 100g, and removing water concentrates everything. A shake powder measures ${PROTEIN_ROWS[0].value}g per 100g precisely because there is no water left in it — the same reason dried foods dominate any per-100g chart. We kept the shake (it is a real daily food) but excluded raw powders and flours from the scope, and that rule is written on the page itself.`,
          ar: `لأن الترتيب يقيس لكل 100 جرام، ونزع الماء يركّز كل شيء. المسحوق البروتيني يسجل ${PROTEIN_ROWS[0].value} جرامًا لكل 100 جرام تحديدًا لأن لم يبقَ فيه ماء أصلًا — وهو نفس سبب تصدر الأغذية المجففة لأي جدول يقيس لكل 100 جرام. أبقينا المشروب البروتيني (لأنه طعام يومي حقيقي) واستبعدنا المساحيق والدقيق الخام، والقاعدة مكتوبة على الصفحة نفسها.`,
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
    descriptionEn: `Both filters at once: hard cheese leads at ${LOWCARB_ROWS[0].value}g protein with ${LOWCARB_ROWS[0].carbs}g carbs per 100g, ahead of bacon and braised lean cuts — from the Alkemos database.`,
    descriptionAr: `الفلتران معًا: الجبن الصلب يقود بـ${LOWCARB_ROWS[0].value} جم بروتين مع ${LOWCARB_ROWS[0].carbs} جم كربوهيدرات لكل 100 جرام، أمام البيكون والقطع الخالية المطهوة.`,
    introEn: `Two filters, one table: every row here stays at or under 5g of carbs per 100g, then ranks by protein. Hard cheese opens at ${LOWCARB_ROWS[0].value}g protein against ${LOWCARB_ROWS[0].carbs}g carbs, bacon follows at ${LOWCARB_ROWS[3].value}g with ${LOWCARB_ROWS[3].carbs}g, and the braised lean cuts deliver ${LOWCARB_ROWS[4].value}g at literally zero carbs. This is the keto and cutting shopper's shortlist — protein first, carbs nearly absent.`,
    introAr: `فلتران في جدول واحد: كل صف هنا يبقى عند 5 جم كربوهيدرات أو أقل لكل 100 جرام، ثم يرتب بالبروتين. الجبن الصلب يفتتح بـ${LOWCARB_ROWS[0].value} جرام بروتين مقابل ${LOWCARB_ROWS[0].carbs} جرام كربوهيدرات، والبيكون يتبع بـ${LOWCARB_ROWS[3].value} جرامًا مع ${LOWCARB_ROWS[3].carbs} جرام، والقطع الخالية المطهوة ببطء تمنح ${LOWCARB_ROWS[4].value} جرامًا بصفر كربوهيدرات حرفيًا. هذه قائمة تسوق الكيتو والتخسيس — البروتين أولًا والكربوهيدرات شبه غائبة.`,
    criterionEn: `The carb ceiling is 5g per 100g (a widely used low-carb threshold for a food, stricter than a full meal's), and ranking within it is by protein grams, descending. The family scope rules apply. The two columns printed side by side — protein and carbs — are the whole point: you can verify both numbers on every linked food page.`,
    criterionAr: `سقف الكربوهيدرات 5 جم لكل 100 جرام (عتبة قليلة الكربوهيدرات المعروفة لصنف واحد، أصرم من عتبة الوجبة الكاملة)، والترتيب داخله بجرامات البروتين تنازليًا. وقواعد نطاق العائلة مطبقة. والعمودان المطبوعان جنبًا إلى جنب — البروتين والكربوهيدرات — هما جوهر الصفحة: تستطيع التحقق من الرقمين في صفحة كل صنف مربوط.`,
    metricEn: "Protein (g / 100g, carbs ≤ 5g)",
    metricAr: "البروتين (جم / 100 جرام، كارب ≤ 5 جم)",
    verdicts: [
      {
        heading: { en: "The cheese paradox", ar: "مفارقة الجبن" },
        body: {
          en: `Yes, the hardest cheese out-proteins the leanest steak per 100g — ${LOWCARB_ROWS[0].value}g versus ${LOWCARB_ROWS[4].value}g — because cheese is concentrated milk with the water gone. The price sits in the calorie column (${LOWCARB_ROWS[0].calories} versus ${LOWCARB_ROWS[4].calories}), so cutters read this table right-to-left: meat first, cheese as the flavour layer.`,
          ar: `نعم، أقسى جبن يتفوق على أنحف ستيك بروتينًا لكل 100 جرام — ${LOWCARB_ROWS[0].value} جرامًا مقابل ${LOWCARB_ROWS[4].value} — لأن الجبن حليب مركز ذهب ماؤه. والثمن في عمود السعرات (${LOWCARB_ROWS[0].calories} مقابل ${LOWCARB_ROWS[4].calories})، فقراءة المتخسس لهذا الجدول تبدأ بعمود السعرات قبل عمود البروتين: اللحم أولًا والجبن طبقة النكهة.`,
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
];

/** Lookup by slug (route helper). */
export function getNutrientListBySlug(slug: string): NutrientList | null {
  return NUTRIENT_LISTS.find((l) => l.slug === slug) ?? null;
}

/** Lists that deepen a given collection hub (the §4.3 backlink widget). */
export function listsForCollection(collectionSlug: string): NutrientList[] {
  return NUTRIENT_LISTS.filter((l) => l.collectionSlug === collectionSlug);
}
