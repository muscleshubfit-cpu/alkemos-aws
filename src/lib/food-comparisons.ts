/**
 * Food comparison pages — SEO-GROWTH-P4 pilot (owner order 2026-11-05,
 * «Programmatic SEO للأطعمة… ابدأ باختبار محدود قابل للقياس… لا تبدأ
 * بدفعات 500 أو 1,000 صفحة»), executing audit file 03 §4.2 (the highest
 * search-value NEW page type): "X vs Y" food pairs answering the measured
 * Arabic PAA patterns («موز أم تفاح؟» «تونة أم دجاج للبروتين؟» «شوفان أم
 * أرز؟» — SERP evidence 2026-11-05: led by generic medical portals with no
 * strict comparison tables).
 *
 * SCOPE (batch 2, 2026-11-05: a deliberately small 4-pair pilot under the
 *   owner's «اختبار محدود» order → batch 3, same day, owner order
 *   «استكمل تنفيذ الأعمال المؤجلة ذات الأولوية… لا تنتظر نتائج Google
 *   للأعمال المستقلة المتاحة»: completing the plan's Phase-1 "first 10
 *   food comparisons" — file 07's own task line «10 مقارنات غذائية أولى
 *   (أزواج المنقّى الأعلى طلبًا)»):
 *   10 pairs × 2 languages = 20 URLs, ALL built exclusively from the 80
 *   CURATED + ENRICHED foods (audit §4.2's own precondition: both items
 *   enriched first). No USDA tail items, no band items — the D-2-gated
 *   scale-out (the 40-90-pair expansion, gated on measured demand) is NOT
 *   touched by this family (sitemap-foods criteria and its selection law
 *   stay byte-identical).
 *
 * DATA TRUTH (audit quality gate #8): every number on the page is
 * DERIVED from src/lib/foods.ts at module scope — the same rows the two
 * linked food pages render. The editorial copy interpolates the computed
 * values, so a data drift between the comparison and the food pages is
 * structurally impossible. Nutrients per serving = per100g ×
 * defaultGrams ÷ 100 (the same arithmetic the food pages' tables show).
 *
 * LANGUAGE LAW (order 414): AR and EN are editorially independent — the
 * AR copy is not a translation of the EN copy; question-shaped AR titles
 * (audit §4.1 law) vs descriptive EN titles.
 *
 * SCHEMA LAW (§12.19 DO-NOT list + audit 03 §6 gate 6): the comparison
 * family carries ItemList + Breadcrumb only — the FAQ is visible plain
 * text (answerable), NOT FAQPage JSON-LD.
 */

import { getFoodBySlug, type Food } from "./foods";

export type FoodPairNutrition = {
  /** per 100 g (raw FOODS row — the food pages' own table) */
  per100g: Food["per100g"];
  /** the food's real default serving (grams + label per language) */
  servingGrams: number;
  servingLabelEn: string;
  servingLabelAr: string;
  /** per-serving macros = per100g × grams ÷ 100 */
  serving: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  /** protein density in grams per 100 kcal (the verdict's transparent rule) */
  proteinPer100kcal: number;
  /** energy density kcal per 100 g (the cutting verdict's rule) */
  kcalPer100g: number;
};

export type FoodComparisonFaq = {
  q: { en: string; ar: string };
  a: { en: string; ar: string };
};

export type FoodComparison = {
  slug: string;
  aSlug: string;
  bSlug: string;
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
  a: FoodPairNutrition;
  b: FoodPairNutrition;
  /** Contextual verdicts by goal (audit §4.2: حكم سياقي بقواعد شفافة) */
  verdicts: Array<{ heading: { en: string; ar: string }; body: { en: string; ar: string } }>;
  faqs: FoodComparisonFaq[];
  /** the contextual tool this page hands the reader to (one link, no banner) */
  toolSlug: "calorie-calculator" | "macro-calculator";
};

function nutritionFor(food: Food): FoodPairNutrition {
  const g = food.defaultGrams;
  const r = (n: number) => Math.round(n * 10) / 10;
  const serving = {
    calories: r((food.per100g.calories * g) / 100),
    protein: r((food.per100g.protein * g) / 100),
    carbs: r((food.per100g.carbs * g) / 100),
    fat: r((food.per100g.fat * g) / 100),
    fiber: r((food.per100g.fiber * g) / 100),
  };
  return {
    per100g: food.per100g,
    servingGrams: g,
    servingLabelEn: food.defaultServingEn,
    servingLabelAr: food.defaultServingAr,
    serving,
    proteinPer100kcal:
      food.per100g.calories > 0
        ? Math.round(((food.per100g.protein * 100) / food.per100g.calories) * 10) / 10
        : 0,
    kcalPer100g: food.per100g.calories,
  };
}

// ---------------------------------------------------------------------------
// The comparison pairs — every slug below is one of the 80 CURATED foods
// (tags > 0), i.e. enriched AND sitemap-advertised (audit §4.2 rule).
// A module-scope assertion keeps that law mechanical: a pair referencing
// an un-curated food throws at build time, not in production.
// ---------------------------------------------------------------------------

function curated(slug: string): Food {
  const food = getFoodBySlug(slug);
  if (!food) throw new Error(`food-comparisons: unknown slug "${slug}"`);
  if ((food.tags?.length ?? 0) === 0)
    throw new Error(`food-comparisons: "${slug}" is not curated (tags empty)`);
  return food;
}

const banana = curated("banana");
const apple = curated("apple");
const tuna = curated("tuna");
const chicken = curated("chicken-breast");
const whiteRice = curated("white-rice");
const brownRice = curated("brown-rice");
const greekYogurt = curated("greek-yogurt");
const cottageCheese = curated("cottage-cheese");
// Batch 3 (owner order 2026-11-05 «استكمل تنفيذ الأعمال المؤجلة ذات
// الأولوية… لا تنتظر نتائج Google»): the six pairs completing the plan's
// Phase-1 "first ten" — each traceable to the audit's documented demand
// evidence (see the per-pair comment block below the N-derivations).
const oatmeal = curated("oatmeal");
const eggs = curated("eggs");
const eggWhites = curated("egg-whites");
const tofu = curated("tofu");
const oliveOil = curated("olive-oil");
const coconutOil = curated("coconut-oil");
const dates = curated("dates");
const lentils = curated("lentils");
const chickpeas = curated("chickpeas");

// Derived nutrition for the copy layer (the same derivation the page
// tables render) — the intro/verdict strings interpolate THESE, never
// raw Food fields, so serving-level numbers stay structurally truthful.
const bananaN = nutritionFor(banana);
const appleN = nutritionFor(apple);
const tunaN = nutritionFor(tuna);
const chickenN = nutritionFor(chicken);
const whiteRiceN = nutritionFor(whiteRice);
const brownRiceN = nutritionFor(brownRice);
const greekYogurtN = nutritionFor(greekYogurt);
const cottageCheeseN = nutritionFor(cottageCheese);
const oatmealN = nutritionFor(oatmeal);
const eggsN = nutritionFor(eggs);
const eggWhitesN = nutritionFor(eggWhites);
const tofuN = nutritionFor(tofu);
const oliveOilN = nutritionFor(oliveOil);
const coconutOilN = nutritionFor(coconutOil);
const datesN = nutritionFor(dates);
const lentilsN = nutritionFor(lentils);
const chickpeasN = nutritionFor(chickpeas);

const PUBLISHED_AT = "2026-11-05"; // stable first-publish (batches 2+3 ship the same date — never bumped, W1-1 law)

export const FOOD_COMPARISONS: FoodComparison[] = [
  {
    slug: "banana-vs-apple",
    aSlug: "banana",
    bSlug: "apple",
    publishedAt: PUBLISHED_AT,
    titleEn: `Banana vs Apple for Weight Loss — Calories, Sugar & Satiety | Alkemos`,
    titleAr: `موز أم تفاح للتخسيس؟ مقارنة السعرات والسكر والشبع`,
    h1En: `Banana vs Apple`,
    h1Ar: `موز أم تفاح؟`,
    descriptionEn: `Banana vs apple per 100g and per serving: ${banana.per100g.calories} vs ${apple.per100g.calories} kcal, sugar, fiber, and satiety — and when each fruit wins.`,
    descriptionAr: `موز أم تفاح للتخسيس؟ مقارنة السعرات لكل 100 جرام وللحصة الشائعة مع السكر والألياف والشبع، ومتى يفوز كل منهما لكل هدف.`,
    introEn: `Straight answer first: for fat loss on a calorie budget, the apple wins on volume — ${appleN.kcalPer100g} kcal per 100g versus ${bananaN.kcalPer100g} kcal for banana — and its common serving (${appleN.servingGrams}g, ≈${appleN.serving.calories} kcal) still lands under the banana's (${bananaN.servingGrams}g, ≈${bananaN.serving.calories} kcal). The banana is not "bad": it is the faster, denser energy source, which makes it the better pick right before or after training. The table below shows both fruits per 100g AND per their real default servings, then the verdicts split by goal.`,
    introAr: `الإجابة المباشرة أولًا: على ميزانية سعرات للتخسيس، يفوز التفاح بالحجم — ${appleN.kcalPer100g} سعرة لكل 100 جرام مقابل ${bananaN.kcalPer100g} سعرة للموز — وحصته الشائعة (${appleN.servingGrams} جرامًا، ≈${appleN.serving.calories} سعرة) تظل أخف من حصة الموز (${bananaN.servingGrams} جرامًا، ≈${bananaN.serving.calories} سعرة). والموز ليس «سيئًا»: هو مصدر الطاقة الأسرع والأكثر كثافة، وهذا ما يجعله الاختيار الأفضل قبل التمرين أو بعده مباشرة. الجدول أدناه يعرض الثمرة لكل 100 جرام ولحصتها الواقعية، ثم تأتي الأحكام مقسّمة على الهدف.`,
    a: nutritionFor(banana),
    b: nutritionFor(apple),
    verdicts: [
      {
        heading: { en: `For fat loss`, ar: `لخسارة الدهون` },
        body: {
          en: `The apple. The rule is transparent: at ${appleN.kcalPer100g} kcal/100g it carries roughly ${Math.round((1 - appleN.kcalPer100g / bananaN.kcalPer100g) * 100)}% fewer calories per bite of the same weight, its ${appleN.servingGrams}g default serving is bigger in the hand, and the chewing + fiber (${apple.per100g.fiber}g/100g) slow the eating. In a deficit you are managing hunger, and volume is your cheapest currency.`,
          ar: `التفاح. والقاعدة مكشوفة: عند ${appleN.kcalPer100g} سعرة لكل 100 جرام يحمل نحو ${Math.round((1 - appleN.kcalPer100g / bananaN.kcalPer100g) * 100)}% سعرات أقل لكل جرام من الموز، وحصته الافتراضية (${appleN.servingGrams} جرامًا) أكبر في الكف، والمضغ والألياف (${apple.per100g.fiber} جرام لكل 100) يبطئان الأكل. داخل العجز السعراتي أنت تدير الجوع، والحجم عملتك الأرخص.`,
        },
      },
      {
        heading: { en: `Around training`, ar: `حول التمرين` },
        body: {
          en: `The banana. ${bananaN.serving.carbs}g of carbohydrates in a ${bananaN.servingGrams}g serving, easy to digest, zero prep — fast fuel before a session or a clean top-up after one. The apple's fructose-and-fiber package releases slower, which serves satiety at rest, not a pre-workout spike.`,
          ar: `الموز. ${bananaN.serving.carbs} جرامًا من الكربوهيدرات في حصة ${bananaN.servingGrams} جرامًا، سهل الهضم، بلا أي تجهيز — وقود سريع قبل الجلسة أو تعبئة نظيفة بعدها. أما حزمة التفاح (فركتوز + ألياف) فتتحرر أبطأ، وهو ما يخدم الشبع في الراحة لا دفعة ما قبل التمرين.`,
        },
      },
      {
        heading: { en: `The sugar question`, ar: `مسألة السكر` },
        body: {
          en: `Neither fruit's sugar disqualifies it from a diet: banana ${banana.per100g.sugar}g/100g, apple ${apple.per100g.sugar}g/100g — both arrive inside a whole-food matrix with fiber, water, and micronutrients, not as free sugar. The WHO free-sugar guidance does not count whole fruit. What disqualifies a cut is the total calorie line, not the fruit bowl.`,
          ar: `سكر أيًا من الثمرتين لا يخرجه من الحمية: الموز ${banana.per100g.sugar} جرام لكل 100، والتفاح ${apple.per100g.sugar} جرام لكل 100 — وكلاهما يأتي داخل مصفوفة طعام كامل بألياف وماء ومغذيات دقيقة، لا كسكر حر. وإرشادات منظمة الصحة العالمية للسكر الحر لا تحسب الثمار الكاملة. الذي يُفسد الخسارة هو سطر إجمالي السعرات، لا سلّة الفاكهة.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Which has fewer calories — banana or apple?`,
          ar: `أيهما أقل سعرات — الموز أم التفاح؟`,
        },
        a: {
          en: `Per 100g the apple: ${appleN.kcalPer100g} kcal vs ${bananaN.kcalPer100g} kcal. Per their real default servings the gap narrows but holds: a ${appleN.servingGrams}g apple ≈ ${appleN.serving.calories} kcal while a ${bananaN.servingGrams}g banana ≈ ${bananaN.serving.calories} kcal. Both numbers come from the same database rows this site's food pages use.`,
          ar: `لكل 100 جرام: التفاح — ${appleN.kcalPer100g} سعرة مقابل ${bananaN.kcalPer100g} سعرة للموز. وبالحصتين الافتراضيتين الحقيقيتين يتقلص الفارق لكنه يبقى: تفاحة ${appleN.servingGrams} جرامًا ≈ ${appleN.serving.calories} سعرة، وموزة ${bananaN.servingGrams} جرامًا ≈ ${bananaN.serving.calories} سعرة. وكلا الرقمين من صفوف قاعدة البيانات نفسها التي تستخدمها صفحات الأطعمة هنا.`,
        },
      },
      {
        q: {
          en: `Can I eat a banana every day while cutting?`,
          ar: `هل آكل موزة كل يوم أثناء التخسيس؟`,
        },
        a: {
          en: `Yes — one banana is ≈${bananaN.serving.calories} kcal inside a ${bananaN.servingGrams}g serving with ${bananaN.serving.fiber}g of fiber and potassium; a cut that cannot afford a banana was cut too tight. The practical rule: count it in the day's budget like any food, and keep fruit as fruit (whole), not as juice or dried pieces where the calories concentrate and the satiety disappears.`,
          ar: `نعم — الموزة الواحدة ≈${bananaN.serving.calories} سعرة داخل حصة ${bananaN.servingGrams} جرامًا مع ${bananaN.serving.fiber} جرام ألياف وبوتاسيوم؛ والتخسيس الذي لا يجد مكانًا لموزة كان مشدودًا أكثر من اللازم. والقاعدة العملية: احسبها في ميزانية اليوم كأي طعام، وأبقِ الفاكهة فاكهة كاملة، لا عصيرًا أو قطعًا مجففة حيث تتكدس السعرات ويختفي الشبع.`,
        },
      },
      {
        q: {
          en: `Which fruit is more filling?`,
          ar: `أي الثمرتين أكثر إشباعًا؟`,
        },
        a: {
          en: `The apple, for most people: bigger default serving (${appleN.servingGrams}g vs ${bananaN.servingGrams}g), more chewing, comparable fiber (${apple.per100g.fiber} vs ${banana.per100g.fiber} g/100g) at ${Math.round((1 - appleN.kcalPer100g / bananaN.kcalPer100g) * 100)}% fewer calories per 100g. Satiety research ranks whole fruit high exactly because of this volume + fiber + chewing combination — the banana's edge is energy delivery, not fullness per calorie.`,
          ar: `التفاح، عند معظم الناس: حصة افتراضية أكبر (${appleN.servingGrams} مقابل ${bananaN.servingGrams} جرامًا)، ومضغ أكثر، وألياف مقاربة (${apple.per100g.fiber} مقابل ${banana.per100g.fiber} جرام لكل 100) بسعرات أقل بنحو ${Math.round((1 - appleN.kcalPer100g / bananaN.kcalPer100g) * 100)}% لكل 100 جرام. وأبحاث الشبع تضع الثمار الكاملة عاليًا تحديدًا بسبب تركيبة الحجم + الألياف + المضغ — وتميز الموز هو تسليم الطاقة لا الشبع لكل سعرة.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
  },
  {
    slug: "tuna-vs-chicken-breast",
    aSlug: "tuna",
    bSlug: "chicken-breast",
    publishedAt: PUBLISHED_AT,
    titleEn: `Tuna vs Chicken Breast — Which Has More Protein per Calorie? | Alkemos`,
    titleAr: `تونة أم دجاج للبروتين؟ مقارنة البروتين والسعرات`,
    h1En: `Tuna vs Chicken Breast`,
    h1Ar: `تونة أم صدور الدجاج؟`,
    descriptionEn: `Canned tuna vs chicken breast: ${tuna.per100g.protein}g vs ${chicken.per100g.protein}g protein per 100g — but who wins per calorie? Full table and an honest verdict.`,
    descriptionAr: `تونة أم صدور دجاج للبروتين؟ جدول البروتين والسعرات لكل 100 جرام وللحصة، ومَن يفوز بنسبة البروتين إلى السعرات — مع حكم صريح لكل هدف.`,
    introEn: `Straight answer: chicken breast carries more protein per 100g (${chicken.per100g.protein}g vs ${tuna.per100g.protein}g), but tuna wins the efficiency ratio — ${tunaN.proteinPer100kcal}g of protein per 100 kcal against chicken's ${chickenN.proteinPer100kcal}g — because it is leaner (${tuna.per100g.fat}g fat vs ${chicken.per100g.fat}g per 100g). In plain words: for the same calorie budget, canned tuna hands you slightly more protein; for the same plate weight, chicken does. Both are elite cutting proteins; the table and verdicts below split the rest by goal.`,
    introAr: `الإجابة المباشرة: صدر الدجاج يحمل بروتينًا أكثر لكل 100 جرام (${chicken.per100g.protein} جرامًا مقابل ${tuna.per100g.protein} جرامًا)، لكن التونة تفوز بنسبة الكفاءة — ${tunaN.proteinPer100kcal} جرام بروتين لكل 100 سعرة مقابل ${chickenN.proteinPer100kcal} جرامًا للدجاج — لأنها أقل دهنًا (${tuna.per100g.fat} جرام مقابل ${chicken.per100g.fat} جرام لكل 100). وبلغة واضحة: على الميزانية السعرية نفسها تعطيك التونة بروتينًا أكثر قليلًا؛ وعلى وزن الطبق نفسه يعطيك الدجاج. كلاهما بروتين تخسيس من الطراز الأول؛ والجدول والأحكام أدناه توزع الباقي على الهدف.`,
    a: nutritionFor(tuna),
    b: nutritionFor(chicken),
    verdicts: [
      {
        heading: { en: `For cutting`, ar: `لتخسيرة الدهون` },
        body: {
          en: `Tuna by a nose on the math: ${tunaN.proteinPer100kcal}g protein per 100 kcal means its default ${tunaN.servingGrams}g serving delivers ${tunaN.serving.protein}g protein for ≈${tunaN.serving.calories} kcal — protein density that guards muscle inside a tight deficit. Practicality matters as much as arithmetic: tuna needs zero cooking and stores for months, which is exactly what a busy cut requires.`,
          ar: `التونة بفارق ضئيل في الحساب: ${tunaN.proteinPer100kcal} جرام بروتين لكل 100 سعرة تعني أن حصتها الافتراضية (${tunaN.servingGrams} جرامًا) تقدم ${tunaN.serving.protein} جرام بروتين مقابل ≈${tunaN.serving.calories} سعرة — كثافة بروتينية تحمي العضلات داخل عزيمة ضيقة. والعملية لا تقل عن الحساب: التونة بلا طهي وتخزن شهورًا، وهذا بالضبط ما يحتاجه تخسيس مشغول.`,
        },
      },
      {
        heading: { en: `For muscle gain`, ar: `لبناء العضلات` },
        body: {
          en: `Chicken breast, mostly because volume adds up: a ${chickenN.servingGrams}g serving carries ${chickenN.serving.protein}g protein and ${chickenN.serving.calories} kcal — the larger, hot, versatile plate a gaining phase builds meals around. Tuna works too (stack two cans for ≈${tunaN.serving.protein * 2}g protein), but a chicken portion's higher calorie load (${chickenN.serving.calories} vs ${tunaN.serving.calories} kcal per serving) fits a surplus more naturally.`,
          ar: `صدر الدجاج، لأن الحجم يتراكم: حصة ${chickenN.servingGrams} جرامًا تحمل ${chickenN.serving.protein} جرام بروتين و${chickenN.serving.calories} سعرة — الطبق الأكبر والأكثر مرونة الذي تبني حوله مرحلة الزيادة وجباتها. التونة تصلح أيضًا (علبتان ≈ ${tunaN.serving.protein * 2} جرام بروتين)، لكن حمل السعرات الأعلى لحصة الدجاج (${chickenN.serving.calories} مقابل ${tunaN.serving.calories} سعرة للحصة) يناسب الفائض أكثر طبيعيًا.`,
        },
      },
      {
        heading: { en: `Variety is the real verdict`, ar: `التنويع هو الحكم الحقيقي` },
        body: {
          en: `Rotate them. Fish twice or more a week is the standing shape of official dietary guidance, and rotating protein sources also rotates their mineral and fatty-acid profiles. Neither food asks the other to leave the kitchen: the can for the rushed days, the breast for the cooked ones.`,
          ar: `نوّع بينهما. السمك مرتين أو أكثر أسبوعيًا هو الشكل القائم في الإرشادات الغذائية الرسمية، وتنويع مصادر البروتين يُنوّع معها ملامحها المعدنية والدهنية. ولا يطلب أحد الطعامين من الآخر مغادرة المطبخ: العلبة لأيام الاستعجال، والصدر لأيام الطهي.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Which has more protein per calorie?`,
          ar: `أيهما بروتينه أكثر لكل سعرة؟`,
        },
        a: {
          en: `Canned tuna: ${tunaN.proteinPer100kcal}g per 100 kcal vs chicken breast's ${chickenN.proteinPer100kcal}g — the leanness gap (${tuna.per100g.fat}g vs ${chicken.per100g.fat}g fat per 100g) decides it. Flip the lens and chicken leads absolute protein per 100g (${chicken.per100g.protein}g vs ${tuna.per100g.protein}g). Choose your lens before you choose your food.`,
          ar: `التونة المعلبة: ${tunaN.proteinPer100kcal} جرام لكل 100 سعرة مقابل ${chickenN.proteinPer100kcal} جرامًا لصدر الدجاج — فارق الدهن (${tuna.per100g.fat} مقابل ${chicken.per100g.fat} جرامًا لكل 100) يحسمه. واقلب المنظور يتقدم الدجاج في البروتين المطلق لكل 100 جرام (${chicken.per100g.protein} مقابل ${tuna.per100g.protein} جرامًا). اختر منظورك قبل طعامك.`,
        },
      },
      {
        q: {
          en: `Is canned tuna healthy to eat every day?`,
          ar: `هل أكل التونة المعلبة يوميًا صحي؟`,
        },
        a: {
          en: `It is an excellent protein source, but "every day" is not the frame official guidance uses for any single fish: weekly variety across species is the standing recommendation, and larger predatory fish carry more mercury than small ones. A practical pattern: tuna 2-3 days a week, rotated with chicken, eggs, dairy, and legumes — the rotation covers both the safety guidance and the micronutrient spread.`,
          ar: `هي مصدر بروتين ممتاز، لكن «كل يوم» ليست الصيغة التي تستخدمها الإرشادات الرسمية لأي سمك واحد: التنويع الأسبوعي عبر الأنواع هو التوصية القائمة، والأسماك المفترسة الأكبر تحمل زئبقًا أكثر من الصغيرة. ونمط عملي: التونة يومين إلى ثلاثة أسبوعيًا، بالتناوب مع الدجاج والبيض والألبان والبقوليات — التناوب يغطي إرشاد السلامة وانتشار المغذيات الدقيقة معًا.`,
        },
      },
      {
        q: {
          en: `Which is cheaper per gram of protein?`,
          ar: `أيهما أرخص لكل جرام بروتين؟`,
        },
        a: {
          en: `Prices move by country and brand, so no honest fixed answer exists — the site does not publish grocery prices. The rule that survives geography: compare the protein PER CAN/TIN against the protein PER KG of chicken at your local prices; canned tuna frequently wins on shelf-stability and portion precision (one drained tin ≈ one ${tunaN.servingGrams}g serving of ${tunaN.serving.protein}g protein), while bulk chicken usually wins on cost per kg.`,
          ar: `الأسعار تتحرك بالبلد والعلامة، فلا توجد إجابة ثابتة صادقة — والموقع لا ينشر أسعار بقالة. والقاعدة التي تنجو من الجغرافيا: قارن البروتين في العلبة الواحدة مقابل البروتين في الكيلوغرام من الدجاج بأسعار سوقك؛ التونة المعلبة تفوز غالبًا في الثبات على الرف ودقة الحصة (علبة مصفاة ≈ حصة ${tunaN.servingGrams} جرامًا فيها ${tunaN.serving.protein} جرام بروتين)، بينما يفوز الدجاج بالكيلو عادة في كلفة الكيلوغرام.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
  },
  {
    slug: "white-rice-vs-brown-rice",
    aSlug: "white-rice",
    bSlug: "brown-rice",
    publishedAt: PUBLISHED_AT,
    titleEn: `White Rice vs Brown Rice — Calories, Fiber and Which to Choose | Alkemos`,
    titleAr: `أرز أبيض أم بني؟ مقارنة السعرات والألياف والاختيار`,
    h1En: `White Rice vs Brown Rice`,
    h1Ar: `أرز أبيض أم بني؟`,
    descriptionEn: `White vs brown rice (cooked): ${whiteRice.per100g.calories} vs ${brownRice.per100g.calories} kcal per 100g — the real differences are fiber, satiety, and timing around training.`,
    descriptionAr: `أرز أبيض أم بني؟ الفرق الحقيقي في الألياف والشبع والتوقيت حول التمرين — جدول السعرات والماكروز لكل 100 جرام مع حكم لكل هدف.`,
    introEn: `Straight answer: cooked white and brown rice are nearly tied on calories (${whiteRice.per100g.calories} vs ${brownRice.per100g.calories} kcal per 100g — a ${Math.abs(whiteRice.per100g.calories - brownRice.per100g.calories)}-kcal gap nobody's deficit ever noticed), so the choice is NOT about calories. It is about fiber (${brownRice.per100g.fiber}g vs ${whiteRice.per100g.fiber}g per 100g — brown carries ${Math.round(brownRice.per100g.fiber / Math.max(whiteRice.per100g.fiber, 0.1))}× more), digestion speed, and what the rest of your plate needs. Both servings below use the same ${brownRiceN.servingGrams}g cooked serving.`,
    introAr: `الإجابة المباشرة: الأرز الأبيض والبني المطبوخان متعادلان تقريبًا في السعرات (${whiteRice.per100g.calories} مقابل ${brownRice.per100g.calories} سعرة لكل 100 جرام — فارق ${Math.abs(whiteRice.per100g.calories - brownRice.per100g.calories)} سعرة لم تلحظه أي عزيمة في التاريخ)، فالاختيار ليس عن السعرات إذًا. هو عن الألياف (${brownRice.per100g.fiber} جرام مقابل ${whiteRice.per100g.fiber} جرام لكل 100 — البني يحمل ${Math.round(brownRice.per100g.fiber / Math.max(whiteRice.per100g.fiber, 0.1))} أضعافًا تقريبًا) وسرعة الهضم وما يحتاجه باقي طبقك. والحصتان أدناه بحجم الحصة المطبوخة نفسه (${brownRiceN.servingGrams} جرامًا).`,
    a: nutritionFor(whiteRice),
    b: nutritionFor(brownRice),
    verdicts: [
      {
        heading: { en: `For fat loss`, ar: `لخسارة الدهون` },
        body: {
          en: `Brown rice, but for the satiety reason, not the calorie myth: ${brownRice.per100g.fiber}g of fiber per 100g slows the digestion and steadies the appetite curve, and the intact bran layer means you eat the whole grain's structure. If your daily rice is one ${brownRiceN.servingGrams}g serving inside a protein-anchored meal, the difference is real but modest — the deficit still does the losing.`,
          ar: `الأرز البني، لكن لسبب الشبع لا لخرافة السعرات: ${brownRice.per100g.fiber} جرام ألياف لكل 100 جرام تُبطئ الهضم وتثبّت منحنى الشهية، وبقاء النخالة يعني أنك تأكل بنية الحبة كاملة. إن كان أرز اليومي حصة واحدة (${brownRiceN.servingGrams} جرامًا) داخل وجبة يرسّخها البروتين، فالفرق حقيقي لكنه معتدل — والعزيمة هي التي تخسر، لا النخالة.`,
        },
      },
      {
        heading: { en: `Around hard training`, ar: `حول التدريب الشاق` },
        body: {
          en: `White rice. The bran and germ removed means faster gastric emptying and quicker available carbohydrate — the reason it is the classic fuel in the hours around heavy sessions and the standard pairing for hard gainers who need calories without satiating fiber in the way. Same serving (${whiteRiceN.servingGrams}g ≈ ${whiteRiceN.serving.carbs}g carbs), less friction on the way in.`,
          ar: `الأرز الأبيض. نزع النخالة والجنين يعني إفراغًا معديًا أسرع وكربوهيدرات متاحة أحدث — ولهذا هو الوقود الكلاسيكي في الساعات حول الجلسات الثقيلة والرفيق المعياري لمكتسبي الكتلة الذين يحتاجون سعرات بلا ألياف مُشبِئة تعترض الطريق. الحصة نفسها (${whiteRiceN.servingGrams} جرامًا ≈ ${whiteRiceN.serving.carbs} جرام كربوهيدرات) باحتكاك أقل في الدخول.`,
        },
      },
      {
        heading: { en: `The honest tie-breaker`, ar: `الحكم الفاصل الصادق` },
        body: {
          en: `If both sit in your kitchen and you eat them with a protein source and vegetables, pick the one you actually finish: adherence beats the ${Math.abs(whiteRice.per100g.calories - brownRice.per100g.calories)}-kcal gap. The rice you cook consistently is worth more than the rice theory says is marginally better.`,
          ar: `إن كان كلاهما في مطبخك وتأكله مع مصدر بروتين وخضروات، فاختر الذي تُكمل طبقه فعلًا: الالتزام يتفوق على فارق ${Math.abs(whiteRice.per100g.calories - brownRice.per100g.calories)} سعرة. الأرز الذي تطبخه باستمرار أقيمة من الأرز الذي تقول النظرية إنه أفضل بهامش.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Is brown rice actually better for weight loss?`,
          ar: `هل الأرز البني أفضل فعلًا لخسارة الوزن؟`,
        },
        a: {
          en: `Better by a small margin and for one mechanism: fiber (${brownRice.per100g.fiber} vs ${whiteRice.per100g.fiber} g/100g) and the intact grain structure improve satiety per serving — while calories are a practical tie (${brownRice.per100g.calories} vs ${whiteRice.per100g.calories} per 100g). No controlled deficit in the world is made or broken by a ${Math.abs(whiteRice.per100g.calories - brownRice.per100g.calories)}-kcal/100g difference; hunger management is where brown earns its place.`,
          ar: `أفضل بهامش صغير ولمؤثر واحد: الألياف (${brownRice.per100g.fiber} مقابل ${whiteRice.per100g.fiber} جرام لكل 100) وبنية الحبة الكاملة تحسّنان الشبع لكل حصة — بينما السعرات تعادل عملي (${brownRice.per100g.calories} مقابل ${whiteRice.per100g.calories} لكل 100). لا عزيمة مضبوطة في العالم تُصنع أو تُكسر بفارق ${Math.abs(whiteRice.per100g.calories - brownRice.per100g.calories)} سعرة لكل 100 جرام؛ وإدارة الجوع هي حيث يستحق البني مكانه.`,
        },
      },
      {
        q: {
          en: `Should I eat white rice before or after training?`,
          ar: `هل آكل الأرز الأبيض قبل التمرين أم بعده؟`,
        },
        a: {
          en: `Both windows work — it is a carb-timing question, not a magic one. Before (2-3 hours out): a ${whiteRiceN.servingGrams}g serving ≈ ${whiteRiceN.serving.carbs}g carbs tops the tank without weighing on the stomach. After: the same serving restocks what the session spent. What decides your results is the day's total, not the clock position of the bowl.`,
          ar: `النافذتان تعملان — هي مسألة توقيت كربوهيدرات لا مسألة سحر. قبلها بساعتين إلى ثلاث: حصة ${whiteRiceN.servingGrams} جرامًا ≈ ${whiteRiceN.serving.carbs} جرام كربوهيدرات تملأ الخزان دون إثقال للمعدة. وبعدها: الحصة نفسها تعيد ملء ما أنفقته الجلسة. وما يحسم نتائجك هو إجمالي اليوم، لا موضع الطبق من الساعة.`,
        },
      },
      {
        q: {
          en: `Do I have to give up rice to lose weight?`,
          ar: `هل أتخلى عن الأرز لأنقص وزني؟`,
        },
        a: {
          en: `No — rice is not the problem; the deficit is the mechanism. A ${brownRiceN.servingGrams}g cooked serving is ≈${brownRiceN.serving.calories} kcal, which fits comfortably inside a standard cut when the rest of the plate is built around protein and vegetables. Diets fail when they evict a culture's staple food — they succeed when they budget it.`,
          ar: `لا — الأرز ليس المشكلة؛ والعجز هو الآلية. حصة مطبوخة (${brownRiceN.servingGrams} جرامًا) ≈${brownRiceN.serving.calories} سعرة، وتتسع بارتياح داخل تخسيس قياسي حين يُبنى باقي الطبق حول البروتين والخضروات. الحميات تفشل حين تطرد طعام ثقافة أساسيًا — وتنجح حين تضع له ميزانية.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
  },
  {
    slug: "greek-yogurt-vs-cottage-cheese",
    aSlug: "greek-yogurt",
    bSlug: "cottage-cheese",
    publishedAt: PUBLISHED_AT,
    titleEn: `Greek Yogurt vs Cottage Cheese — Protein, Calories, Cutting | Alkemos`,
    titleAr: `زبادي يوناني أم جبن قريش؟ مقارنة البروتين والسعرات`,
    h1En: `Greek Yogurt vs Cottage Cheese`,
    h1Ar: `زبادي يوناني أم جبن قريش؟`,
    descriptionEn: `Greek yogurt vs cottage cheese: ${greekYogurt.per100g.protein}g vs ${cottageCheese.per100g.protein}g protein per 100g — the per-calorie gap decides the cut. Full table + verdict.`,
    descriptionAr: `زبادي يوناني أم جبن قريش؟ جدول البروتين والسعرات لكل 100 جرام وللحصة، وفارق كثافة البروتين الذي يحسم مسألة التخسيس.`,
    introEn: `Straight answer: per 100g the two are close on protein (${greekYogurt.per100g.protein}g vs ${cottageCheese.per100g.protein}g), but per calorie Greek yogurt pulls away — ${greekYogurtN.proteinPer100kcal}g of protein per 100 kcal versus cottage cheese's ${cottageCheeseN.proteinPer100kcal}g — because its default tub (${greekYogurtN.servingGrams}g) is bigger, wetter, and leaner. Cottage cheese answers with texture, sodium-adjusted flavor, and a slower-eating bowl. The table shows both per 100g and per their real servings; the verdicts split by goal.`,
    introAr: `الإجابة المباشرة: لكل 100 جرام يقترب الصنفان في البروتين (${greekYogurt.per100g.protein} مقابل ${cottageCheese.per100g.protein} جرامًا)، لكن لكل سعرة يبتعد الزبادي اليوناني — ${greekYogurtN.proteinPer100kcal} جرام بروتين لكل 100 سعرة مقابل ${cottageCheeseN.proteinPer100kcal} جرامًا للجبن القريش — لأن علبته الافتراضية (${greekYogurtN.servingGrams} جرامًا) أكبر وأرطب وأقل دهنًا. ويرد الجبن القريش بقوامه ومذاقه القابل للتعديل وطبقته التي تُؤكل أبطأ. الجدول يعرض كليهما لكل 100 جرام ولبحصتيهما الحقيقيتين؛ والأحكام تتوزع على الهدف.`,
    a: nutritionFor(greekYogurt),
    b: nutritionFor(cottageCheese),
    verdicts: [
      {
        heading: { en: `For cutting`, ar: `لتخسيرة الدهون` },
        body: {
          en: `Greek yogurt on the numbers: a ${greekYogurtN.servingGrams}g serving delivers ${greekYogurtN.serving.protein}g protein for ≈${greekYogurtN.serving.calories} kcal, and its ${greekYogurtN.proteinPer100kcal}g-per-100-kcal density is the number a deficit respects. Add the practical edge — it spoons into a snack with zero cooking and pairs with fruit instead of replacing it.`,
          ar: `الزبادي اليوناني بالأرقام: حصة ${greekYogurtN.servingGrams} جرامًا تقدم ${greekYogurtN.serving.protein} جرام بروتين مقابل ≈${greekYogurtN.serving.calories} سعرة، وكثافته ${greekYogurtN.proteinPer100kcal} جرام لكل 100 سعرة هي الرقم الذي تحترمه العزيمة. أضف الميزة العملية — يُغرف كسناك بلا أي طهي ويقرن بالفاكهة بدل أن يحل محلها.`,
        },
      },
      {
        heading: { en: `For a savory, slower meal`, ar: `لوجبة مالحة أبطأ` },
        body: {
          en: `Cottage cheese: a ${cottageCheeseN.servingGrams}g serving brings ${cottageCheeseN.serving.protein}g protein with a chewy, savory texture that eats like food rather than a snack — genuinely useful at night or in savory bowls where yogurt's tang does not belong. Watch the sodium line on the label; brands differ more than the base food does.`,
          ar: `الجبن القريش: حصة ${cottageCheeseN.servingGrams} جرامًا تجلب ${cottageCheeseN.serving.protein} جرام بروتين بقوام مالٍ يمضغ كطعام لا كسناك — نافع فعلًا ليلًا أو في الأطباق المالحة حيث لا مكان لحموضة الزبادي. وراقب سطر الصوديوم على العلبة؛ فالعلامات تختلف أكثر مما يختلف الطعام الأساسي نفسه.`,
        },
      },
      {
        heading: { en: `Both beat the same trap`, ar: `كلاهما يتجاوز الفخ نفسه` },
        body: {
          en: `The trap is the flavored version: fruit-on-the-bottom and sweetened variants convert a protein food into a dessert (added sugar displaces the protein per calorie you came for). Plain versions of both are the cut's allies; the label's ingredient list, not the front-of-pack claim, is the tie-breaker.`,
          ar: `الفخ هو النسخة المنكّهة: المحتوية على فاكهة بالقاع والمحلاة تحوّل طعام البروتين إلى حلوى (السكر المضاف يزيح كثافة البروتين التي جئت من أجلها). والنسختان الصافيتان حليفتا التخسيس؛ وقائمة المكونات على الظهر لا ادعاء الواجهة هي الفيصل.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Which has more protein — Greek yogurt or cottage cheese?`,
          ar: `أيهما بروتينه أكثر — الزبادي اليوناني أم الجبن القريش؟`,
        },
        a: {
          en: `Per 100g they are close — ${greekYogurt.per100g.protein}g vs ${cottageCheese.per100g.protein}g — but per real serving Greek yogurt's bigger tub wins: ${greekYogurtN.serving.protein}g vs ${cottageCheeseN.serving.protein}g. Per 100 kcal the gap widens decisively: ${greekYogurtN.proteinPer100kcal}g vs ${cottageCheeseN.proteinPer100kcal}g. Pick your denominator before you pick your winner.`,
          ar: `لكل 100 جرام يتقاربان — ${greekYogurt.per100g.protein} مقابل ${cottageCheese.per100g.protein} جرامًا — لكن بحجم الحصة الحقيقي تفوز علبة الزبادي الأكبر: ${greekYogurtN.serving.protein} مقابل ${cottageCheeseN.serving.protein} جرامًا. ولكل 100 سعرة يتسع الفارق حسمًا: ${greekYogurtN.proteinPer100kcal} مقابل ${cottageCheeseN.proteinPer100kcal} جرامًا. اختر مقامك قبل أن تختار فائزك.`,
        },
      },
      {
        q: {
          en: `Which is better before bed?`,
          ar: `أيهما أفضل قبل النوم؟`,
        },
        a: {
          en: `Both are classic late-evening proteins; cottage cheese earned its bedtime reputation on slow-digesting casein (the majority protein in both it and Greek yogurt) and a savory profile that does not read as dessert. The honest version: total daily protein decides muscle retention — the bowl's clock position is a rounding error. Choose whichever helps you actually hit the day's number.`,
          ar: `كلاهما بروتين مسائي كلاسيكي؛ والجبن القريش بنى سمعته قبل النوم على الكازئين بطيء الهضم (البروتين الغالب فيه وفي الزبادي اليوناني معًا) وعلى ملمح مالح لا يُقرأ كحلوى. والنسخة الصادقة: إجمالي بروتين اليوم هو من يحسم حفظ العضلات — وموضع الطبق من الساعة خطأ تقريب. اختر ما يساعدك فعلًا على بلوغ رقم يومك.`,
        },
      },
      {
        q: {
          en: `Is Greek yogurt or cottage cheese better for lactose sensitivity?`,
          ar: `أيهما ألطف على حساسية اللاكتوز؟`,
        },
        a: {
          en: `Greek yogurt, usually: straining removes part of the lactose along with the whey, and live cultures pre-digest more of it — many lactose-sensitive people tolerate it well. Cottage cheese sits in the middle (it retains more lactose than hard cheeses but less than milk). Severe intolerance: both are testable in small servings, and neither beats consulting a clinician about symptoms.`,
          ar: `الزبادي اليوناني عادةً: التصفي يُزيل جزءًا من اللاكتوز مع مصل اللبن، والزروع الحية تهضم مزيدًا منه مسبقًا — وكثيرون من أصحاب حساسية اللاكتوز يحتملونه جيدًا. والجبن القريش في المنتصف (يحتفظ بلاكتوز أكثر من الأجبان الصلبة وأقل من الحليب). وفي عدم التحمل الشديد: كلاهما قابل للتجربة بحصص صغيرة، ولا يتفوق أي منهما على استشارة طبيب بشأن الأعراض.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
  },
  // -------------------------------------------------------------------------
  // BATCH 3 (owner order 2026-11-05 «استكمل تنفيذ الأعمال المؤجلة ذات
  // الأولوية فقط… لا تنتظر نتائج Google لتنفيذ الأعمال المستقلة
  // المتاحة»): the six pairs completing the plan's Phase-1 "first 10
  // comparisons" — each traceable to the audit's documented demand:
  //   oatmeal-vs-white-rice     ← «شوفان أم أرز؟» measured SERP pattern (03 §4.2 + 02 §2.2-ج)
  //   eggs-vs-egg-whites        ← «كم بروتين في البيضة المسلوقة» SERP check (data §8)
  //   tofu-vs-chicken-breast    ← «100g tofu macros» GSC-measured query (02 §2.2-أ)
  //   olive-oil-vs-coconut-oil  ← ar/foods/olive-oil measured AR demand @6.8 (data §5)
  //   dates-vs-banana           ← «120g banana macros» GSC query + dates' documented
  //                                Arabic-dish data advantage (02 §2.2-أ + 03 §4.6)
  //   lentils-vs-chickpeas      ← Arabic-first strategy + Egypt market (04 §4.1)
  // -------------------------------------------------------------------------
  {
    slug: "oatmeal-vs-white-rice",
    aSlug: "oatmeal",
    bSlug: "white-rice",
    publishedAt: PUBLISHED_AT,
    titleEn: `Oatmeal vs White Rice — Calories, Fiber and When Each Wins | Alkemos`,
    titleAr: `شوفان أم أرز؟ مقارنة السعرات والألياف والتوقيت الأمثل`,
    h1En: `Oatmeal vs White Rice`,
    h1Ar: `شوفان أم أرز؟`,
    descriptionEn: `Oatmeal vs white rice: the dry-vs-cooked basis trap, real-serving calories (${oatmealN.serving.calories} vs ${whiteRiceN.serving.calories} kcal), fiber, and timing.`,
    descriptionAr: `شوفان أم أرز؟ حقيقة الأساس الجاف والمطبوخ، وسعرات الحصة الحقيقية والألياف والتوقيت حول التمرين — بجدول مقارنة صريح.`,
    introEn: `Straight answer: the per-100g table flatters rice only because the two rows stand on different bases — the oatmeal row is weighed dry (${oatmeal.per100g.calories} kcal/100g) while the rice row is weighed as served, cooked (${whiteRice.per100g.calories} kcal/100g). Put each on its real plate and the picture flips: half a cup of dry oats (${oatmealN.servingGrams}g ≈ ${oatmealN.serving.calories} kcal) comes out lighter than one cup of cooked rice (${whiteRiceN.servingGrams}g = ${whiteRiceN.serving.calories} kcal), and brings ${oatmealN.serving.fiber}g of fiber along against the rice's ${whiteRiceN.serving.fiber}g. Oats win the staying-full game; rice wins the fast-fuel game — the verdicts below split the rest by goal.`,
    introAr: `الإجابة المباشرة: جدول «لكل 100 جرام» يخدم الأرز ظاهريًا فقط لأن الصفين يقفان على أساسين مختلفين — صف الشوفان في قاعدة بياناتنا موزون جافًا (${oatmeal.per100g.calories} سعرة لكل 100 جرام) وصف الأرز موزون مطبوخًا كما يُقدَّم (${whiteRice.per100g.calories} سعرة لكل 100 جرام). وضعهما على طبق حقيقي يقلب الصورة: نصف كوب شوفان جاف (${oatmealN.servingGrams} جرامًا ≈ ${oatmealN.serving.calories} سعرة) يخرج أخف من كوب الأرز المطبوخ (${whiteRiceN.servingGrams} جرامًا = ${whiteRiceN.serving.calories} سعرة)، ويحضر ومعه ${oatmealN.serving.fiber} جرامات ألياف مقابل ${whiteRiceN.serving.fiber} جرام فقط للأرز. الشوفان يفوز بلعبة البقاء شبعانًا، والأرز يفوز بلعبة الوقود العاجل — والأحكام أدناه توزع الباقي على الهدف.`,
    a: nutritionFor(oatmeal),
    b: nutritionFor(whiteRice),
    verdicts: [
      {
        heading: { en: `For a calorie deficit`, ar: `لعجز سعراتي` },
        body: {
          en: `Oats, and the reason is the fiber line: ${oatmealN.serving.fiber}g inside the ${oatmealN.servingGrams}g bowl (the rice cup carries ${whiteRiceN.serving.fiber}g) — and their soluble fraction is the most-studied satiety lever among breakfast grains. A bowl that keeps the morning quiet until lunch is worth more to a deficit than a ${Math.round(whiteRiceN.serving.calories - oatmealN.serving.calories)}-kcal arithmetic edge.`,
          ar: `الشوفان، والسبب هو سطر الألياف: ${oatmealN.serving.fiber} جرامات داخل وعاء ${oatmealN.servingGrams} جرامًا (كوب الأرز يحمل ${whiteRiceN.serving.fiber} جرام) — وقسمها الذائب هو رافعة الشبع الأكثر دراسة بين حبوب الفطور. وعاء يُبقي الصباح هادئًا حتى الغداء أثمن في العجز من أفضلية حسابية بفارق ${Math.round(whiteRiceN.serving.calories - oatmealN.serving.calories)} سعرة.`,
        },
      },
      {
        heading: { en: `Fuel around training`, ar: `وقود حول التمرين` },
        body: {
          en: `Rice. The cooked cup delivers ${whiteRiceN.serving.carbs}g of carbohydrates that arrive fast and sit light — restocking what a heavy session spent without making the stomach negotiate first. Oats' ${oatmealN.serving.carbs}g come packaged with the very fiber that slows them down, which is the wrong direction when the clock says "train soon".`,
          ar: `الأرز. الكوب المطبوخ يقدم ${whiteRiceN.serving.carbs} جرام كربوهيدرات تصل سريعًا وتجلس خفيفة — تعيد ملء ما أنفقته جلسة ثقيلة دون أن تجعل المعدة تتفاوض أولًا. أما ${oatmealN.serving.carbs} جرامًا في الشوفان فتأتي معبأة بالألياف ذاتها التي تُبطئها — وهو الاتجاه المعاكس حين تقول الساعة «التمرين بعد قليل».`,
        },
      },
      {
        heading: { en: `The basis honesty`, ar: `صدق الأساس` },
        body: {
          en: `Whichever you eat, weigh it the way your tracker expects: oats dry or cooked — but consistently — and rice cooked. Both bowls fit a budgeted cut (${oatmealN.serving.calories} vs ${whiteRiceN.serving.calories} kcal on the real servings); the deficit dies from uncounted oil and toppings long before it dies from the grain choice.`,
          ar: `أيًّا كان ما تأكله، زِنه بالطريقة التي يفهمها متتبعك: الشوفان جافًا أو مطبوخًا لكن بثبات، والأرز مطبوخًا. كلا الوعاءين يدخل تخسيسًا مُقدَّرًا (${oatmealN.serving.calories} مقابل ${whiteRiceN.serving.calories} سعرة بالحصص الحقيقية)؛ والعجز يموت من الزيوت والإضافات غير المحسوبة قبل أن يموت من اختيار الحبة بزمن طويل.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Is oatmeal fewer calories than rice?`,
          ar: `هل الشوفان أقل سعرات من الأرز؟`,
        },
        a: {
          en: `On real servings, yes: ${oatmealN.servingGrams}g of dry oats ≈ ${oatmealN.serving.calories} kcal while a ${whiteRiceN.servingGrams}g cup of cooked rice = ${whiteRiceN.serving.calories} kcal. The per-100g column looks inverted (${oatmeal.per100g.calories} vs ${whiteRice.per100g.calories}) only because oats are listed dry and rice cooked — compare plates, not bases.`,
          ar: `على الحصص الحقيقية نعم: ${oatmealN.servingGrams} جرامًا شوفانًا جافًا ≈ ${oatmealN.serving.calories} سعرة، بينما كوب ${whiteRiceN.servingGrams} جرامًا من الأرز المطبوخ = ${whiteRiceN.serving.calories} سعرة. وعمود «لكل 100 جرام» يبدو معكوسًا (${oatmeal.per100g.calories} مقابل ${whiteRice.per100g.calories}) فقط لأن الشوفان مسجل جافًا والأرز مطبوخًا — قارن الأطباق لا الأسس.`,
        },
      },
      {
        q: {
          en: `Which one has more fiber?`,
          ar: `أيهما أغنى بالألياف؟`,
        },
        a: {
          en: `Oats, by a wide margin: ${oatmeal.per100g.fiber}g per 100g dry — ${oatmealN.serving.fiber}g in the standard bowl — against rice's ${whiteRice.per100g.fiber}g per 100g cooked (${whiteRiceN.serving.fiber}g per cup). That fiber gap is the whole satiety argument of this comparison.`,
          ar: `الشوفان بفارق واسع: ${oatmeal.per100g.fiber} جرام لكل 100 جرام جاف — أي ${oatmealN.serving.fiber} جرامات في الوعاء القياسي — مقابل ${whiteRice.per100g.fiber} جرام لكل 100 جرام أرز مطبوخ (${whiteRiceN.serving.fiber} جرام للكوب). وفجوة الألياف هذه هي كامل حجة الشبع في هذه المقارنة.`,
        },
      },
      {
        q: {
          en: `Can I keep both in a fat-loss plan?`,
          ar: `هل أُبقي الاثنين في خطة خسارة الدهون؟`,
        },
        a: {
          en: `Yes — and it often works better than banning either: oats for the slow morning, rice around training when speed matters, each counted at its real serving. The plan fails on the untracked extras, not on having two carb sources in the kitchen.`,
          ar: `نعم — وكثيرًا ما يعمل ذلك أفضل من حظر أحدهما: الشوفان لصباح بطيء الاشتعال، والأرز حول التمرين حين تصبح السرعة مهمة، وكلٌّ محسوب بحصته الحقيقية. الخطط تفشل على الإضافات غير المتتبعة لا على وجود مصدري كربوهيدرات في المطبخ.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
  },
  {
    slug: "eggs-vs-egg-whites",
    aSlug: "eggs",
    bSlug: "egg-whites",
    publishedAt: PUBLISHED_AT,
    titleEn: `Whole Eggs vs Egg Whites — Which for Protein and Cutting? | Alkemos`,
    titleAr: `بيض كامل أم بياض البيض؟ مقارنة البروتين والسعرات`,
    h1En: `Whole Eggs vs Egg Whites`,
    h1Ar: `بيض كامل أم بياض البيض؟`,
    descriptionEn: `Whole eggs vs egg whites: ${eggs.per100g.protein}g vs ${eggWhites.per100g.protein}g protein per 100g — but the serving math and the yolk question decide the cut.`,
    descriptionAr: `بيض كامل أم بياض البيض؟ جدول البروتين والسعرات لكل 100 جرام وللحصة، وحساب الحصة الحقيقية الذي يحسم مسألة التخسيس والصفار.`,
    introEn: `Straight answer: on paper a whole egg carries ${eggs.per100g.protein}g of protein per 100g against the white's ${eggWhites.per100g.protein}g — but the white delivers it at ${eggWhites.per100g.calories} kcal per 100g while the whole egg pays ${eggs.per100g.calories}. The serving math is the honest lens: four whites (${eggWhitesN.servingGrams}g) deliver ${eggWhitesN.serving.protein}g of protein for ${eggWhitesN.serving.calories} kcal, while two whole eggs (${eggsN.servingGrams}g) deliver ${eggsN.serving.protein}g for ${eggsN.serving.calories} kcal — near-identical protein at roughly two-and-a-half times the energy. What that extra energy buys is the yolk: its fats, the fat-soluble micronutrients inside them, and the flavor that makes the plate taste like food. The verdicts below pick per goal.`,
    introAr: `الإجابة المباشرة: على الورق يحمل البيض الكامل ${eggs.per100g.protein} جرام بروتين لكل 100 جرام مقابل ${eggWhites.per100g.protein} جرام للبياض — لكن البياض يؤديها عند ${eggWhites.per100g.calories} سعرة لكل 100 جرام بينما تدفع البيضة الكاملة ${eggs.per100g.calories}. وحساب الحصة هو العدسة الصادقة: أربعة بياضات (${eggWhitesN.servingGrams} جرامًا) تقدم ${eggWhitesN.serving.protein} جرام بروتين مقابل ${eggWhitesN.serving.calories} سعرة فقط، وبيضتان كاملتان (${eggsN.servingGrams} جرامًا) تقدمان ${eggsN.serving.protein} جرامًا مقابل ${eggsN.serving.calories} سعرة — بروتين متطابق تقريبًا وطاقة أعلى بنحو مرتين ونصف. وما تشتريه بهذه الطاقة هو الصفار: دهونه ومغذياته الذائبة فيها ومذاقه الذي يجعل الطبق طعامًا. والأحكام أدناه تختار على الهدف.`,
    a: nutritionFor(eggs),
    b: nutritionFor(eggWhites),
    verdicts: [
      {
        heading: { en: `For an aggressive cut`, ar: `لتخسيس مشدود` },
        body: {
          en: `Egg whites, by pure arithmetic: ${eggWhitesN.proteinPer100kcal}g of protein per 100 kcal against the whole egg's ${eggsN.proteinPer100kcal}g — the leanest ratio in this entire family of pages. When the calorie budget tightens, every gram of protein that arrives without accompanying fat buys more muscle retention per calorie, which is exactly how the white earned its contest-prep reputation.`,
          ar: `البياض بالحساب الصرف: ${eggWhitesN.proteinPer100kcal} جرام بروتين لكل 100 سعرة مقابل ${eggsN.proteinPer100kcal} للبيضة الكاملة — أنحف نسبة في عائلة الصفحات هذه كلها. حين تنكمش ميزانية السعرات، يصبح كل غرام بروتين يصل بلا دهن مصاحب صفقة أفضل لكل سعرة، وبهذا تحديدًا بنى البياض سمعته قبل المسابقات.`,
        },
      },
      {
        heading: { en: `For everyday nutrition and muscle gain`, ar: `للتغذية اليومية وبناء العضلات` },
        body: {
          en: `Whole eggs. The yolk carries the egg's fat (${eggs.per100g.fat}g per 100g) together with its fat-soluble vitamins, keeps the meal satisfying for longer, and its extra calories feed a surplus rather than ruin one. Modern guidance moved past the strict egg-limit thinking that ruled earlier decades; an egg or two inside a balanced day is ordinary nutrition, not a cheat.`,
          ar: `البيض الكامل. الصفار يحمل دهن البيضة (${eggs.per100g.fat} جرام لكل 100 جرام) ومعه فيتاميناته الذائبة في الدهن، ويُبقي الوجبة مُشبعة أطول، وسعراته الزائدة تخدم الفائض لا تفسده. والإرشادات الحديثة تجاوزت منطق تقييد البيض الصارم الذي حكم عقودًا سابقة؛ وبيضة أو اثنتان داخل يوم متوازن تغذية عادية لا «غش».`,
        },
      },
      {
        heading: { en: `The practical middle`, ar: `الوسط العملي` },
        body: {
          en: `One whole egg plus two or three whites: post-workout protein volume with the yolk's flavor and micronutrients, without the calorie line exploding. It is the working compromise professional kitchens know well — whites scale the protein, the whole egg scales the meal.`,
          ar: `بيضة كاملة مع بياضين أو ثلاثة: حجم بروتيني يليق بوجبة بعد التمرين، بمذاق الصفار ومغذياته، ودون أن ينفجر سطر السعرات. هذا هو الحل الوسط الذي تعرفه المطابخ المهنية جيدًا — البياض يكبّر البروتين والبيضة الكاملة تكبّر الوجبة.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `How many egg whites equal two whole eggs in protein?`,
          ar: `كم بياضة تعادل بيضتين في البروتين؟`,
        },
        a: {
          en: `Four whites (${eggWhitesN.servingGrams}g) deliver ${eggWhitesN.serving.protein}g of protein against two whole eggs' ${eggsN.serving.protein}g (${eggsN.servingGrams}g) — a near-exact match in protein with a sharp calorie gap: ${eggWhitesN.serving.calories} vs ${eggsN.serving.calories} kcal. If protein is the only target, whites get you there; if you want the full meal, the whole egg spends its extra calories on more nutrition.`,
          ar: `أربع حبات بياض (${eggWhitesN.servingGrams} جرامًا) تقدم ${eggWhitesN.serving.protein} جرامًا مقابل ${eggsN.serving.protein} جرامًا لبيضتين (${eggsN.servingGrams} جرامًا) — تكافؤ شبه تام في البروتين بفارق سعرات حاد: ${eggWhitesN.serving.calories} مقابل ${eggsN.serving.calories} سعرة. إن كان البروتين هو الهدف وحده فالبياض يوصلك؛ وإن أردت الوجبة كاملة فالبيضة تدفع فرق السعرات وتعيد لك مغذيات أعظم.`,
        },
      },
      {
        q: {
          en: `Is the egg yolk bad for you?`,
          ar: `هل صفار البيضة ضار بالصحة؟`,
        },
        a: {
          en: `No — it is the nutrient-dense half, not the guilty one: it carries the egg's fat (${eggs.per100g.fat}g per 100g) along with the fat-soluble vitamins. The old strict limits were built on dietary-cholesterol fears that later guidance relaxed for most people. Documented high cholesterol or a doctor's specific instruction outranks any general table.`,
          ar: `لا — الصفار هو النصف الغني بالمغذيات لا المتهم: يحمل دهن البيضة (${eggs.per100g.fat} جرام لكل 100 جرام) ومعه الفيتامينات الذائبة في الدهن. التقييدات القديمة بُنيت على مخاوف الكوليسترول الغذائي التي خففتها الإرشادات اللاحقة لمعظم الناس. وارتفاع الكوليسترول الموثق أو تعليمات طبيب محددة تتفوق على أي جدول عام.`,
        },
      },
      {
        q: {
          en: `Which is cheaper per gram of protein?`,
          ar: `أيهما أوفر لكل جرام بروتين؟`,
        },
        a: {
          en: `Usually whole eggs: one carton, no separation step, and liquid whites are a processed product that typically costs more per protein gram. The site publishes no grocery prices — the working rule: compare your local price per egg against the liquid-white carton and do the math on protein, not on package weight.`,
          ar: `البيض الكامل في أغلب الأسواق: كرتون واحد بلا خطوة فصل، والبياض السائل منتج مصنَّع يكلف غالبًا أكثر لكل جرام بروتين. والموقع لا ينشر أسعار بقالة — القاعدة العملية: قارن سعر البيضة الواحدة في سوقك مقابل كرتون البياض السائل واحسب البروتين لا وزن العبوة.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
  },
  {
    slug: "tofu-vs-chicken-breast",
    aSlug: "tofu",
    bSlug: "chicken-breast",
    publishedAt: PUBLISHED_AT,
    titleEn: `Tofu vs Chicken Breast — Protein per Calorie and per Gram | Alkemos`,
    titleAr: `توفو أم صدور دجاج؟ مقارنة البروتين لكل سعرة`,
    h1En: `Tofu vs Chicken Breast`,
    h1Ar: `توفو أم صدور الدجاج؟`,
    descriptionEn: `Tofu vs chicken breast: ${tofu.per100g.protein}g vs ${chicken.per100g.protein}g protein per 100g — and ${tofuN.proteinPer100kcal}g vs ${chickenN.proteinPer100kcal}g per 100 kcal. Numbers, then the plant-based verdict.`,
    descriptionAr: `توفو أم صدور دجاج؟ جدول البروتين والسعرات لكل 100 جرام وللحصة، وكثافة البروتين لكل سعرة — مع حكم صريح للمطبخ النباتي وغيره.`,
    introEn: `Straight answer: chicken breast wins both protein lenses. Per 100g it carries ${chicken.per100g.protein}g against tofu's ${tofu.per100g.protein}g, and per 100 kcal it still leads — ${chickenN.proteinPer100kcal}g versus ${tofuN.proteinPer100kcal}g — because its fat line (${chicken.per100g.fat}g vs ${tofu.per100g.fat}g per 100g) stays lower. Per real servings the same order holds: one ${chickenN.servingGrams}g breast hands you ${chickenN.serving.protein}g of protein, a ${tofuN.servingGrams}g tofu block ${tofuN.serving.protein}g. But "wins the table" is not "wins your kitchen": tofu is one of the rare plant proteins that is complete, carries no cholesterol by origin, and absorbs whatever sauce you commit to it. The verdicts below split the rest.`,
    introAr: `الإجابة المباشرة: صدر الدجاج يفوز بعدستَي البروتين معًا. لكل 100 جرام يحمل ${chicken.per100g.protein} جرامًا مقابل ${tofu.per100g.protein} جرامًا للتوفو، ولكل 100 سعرة يظل متقدمًا — ${chickenN.proteinPer100kcal} جرامًا مقابل ${tofuN.proteinPer100kcal} — لأن خط دهنه (${chicken.per100g.fat} مقابل ${tofu.per100g.fat} جرام لكل 100) يبقى أدنى. وبالحصص الحقيقية يتكرر الترتيب نفسه: صدر ${chickenN.servingGrams} جرامًا يناولك ${chickenN.serving.protein} جرام بروتين، وقطعة توفو ${tofuN.servingGrams} جرامًا تناولك ${tofuN.serving.protein} جرامًا. لكن «يفوز بالجدول» ليست «يفوز بمطبخك»: التوفو من البروتينات النباتية النادرة الكاملة، بلا كوليسترول من أصله، ويشرب أي صوص تسقيه إياه. والأحكام أدناه توزع الباقي.`,
    a: nutritionFor(tofu),
    b: nutritionFor(chicken),
    verdicts: [
      {
        heading: { en: `Pure protein arithmetic`, ar: `حساب البروتين الصرف` },
        body: {
          en: `Chicken breast, on both lenses: ${chickenN.proteinPer100kcal}g of protein per 100 kcal against tofu's ${tofuN.proteinPer100kcal}g, and ${chicken.per100g.protein}g against ${tofu.per100g.protein}g per 100g — the double win rides a lower fat line (${chicken.per100g.fat}g vs ${tofu.per100g.fat}g). When the job is maximal protein per bite and per calorie, the breast is the instrument.`,
          ar: `صدر الدجاج بالعدستين معًا: ${chickenN.proteinPer100kcal} جرام بروتين لكل 100 سعرة مقابل ${tofuN.proteinPer100kcal} جرامًا للتوفو، و${chicken.per100g.protein} مقابل ${tofu.per100g.protein} جرامًا لكل 100 جرام — والفضل يركب خط دهن أدنى (${chicken.per100g.fat} مقابل ${tofu.per100g.fat} جرام). حين تكون المهمة أقصى بروتين لكل قضمة ولكل سعرة، فالصدر هو الأداة.`,
        },
      },
      {
        heading: { en: `For the plant-based kitchen`, ar: `للمطبخ النباتي` },
        body: {
          en: `Tofu, and not as a consolation prize: soy is one of the rare plant proteins that is complete — it supplies the essential amino acids on its own — and a ${tofuN.servingGrams}g serving carries ${tofuN.serving.protein}g of it for ${tofuN.serving.calories} kcal. It is also the kitchen's blank canvas: it takes whatever marinade, sauce, or spice you commit to it.`,
          ar: `التوفو، لا كجائزة ترضية: فول الصويا من البروتينات النباتية النادرة الكاملة — يقدم الأحماض الأمينية الأساسية وحده — وحصة ${tofuN.servingGrams} جرامًا تحمل ${tofuN.serving.protein} جرامًا منها مقابل ${tofuN.serving.calories} سعرة. وهو كذلك اللوحة الفارغة في المطبخ: يشرب أي تتبيلة أو صوص أو بهار تلتزم به.`,
        },
      },
      {
        heading: { en: `The mixed-plate reality`, ar: `واقع الطبق المختلط` },
        body: {
          en: `Both, most weeks. Tofu soaks up the stir-fry on meatless days; chicken anchors the rest of the calendar. What decides muscle is the day's total protein line, not the citizenship of its source — a plate that hits its grams from two sources beats a plate that misses them from one "optimal" one.`,
          ar: `كلاهما في أغلب الأسابيع. التوفو يشرب صوص القلاية في الأيام الخالية من اللحم، والدجاج يرتكز في بقية التقويم. وما يبني العضلات هو سطر بروتين اليوم كله لا جنسية مصدره — طبق يبلغ غراماته من مصدرين أفضل من طبق يخطئها من مصدر «أمثل» واحد.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Is tofu a complete protein?`,
          ar: `هل التوفو بروتين كامل؟`,
        },
        a: {
          en: `Yes — soy protein contains the essential amino acids, which is what makes tofu the anchor case among plant proteins (most legumes need a grain pairing to complete the set). "Complete" does not mean "higher": it still carries ${tofu.per100g.protein}g per 100g against chicken's ${chicken.per100g.protein}g; it means self-sufficient.`,
          ar: `نعم — بروتين الصويا يحوي الأحماض الأمينية الأساسية، وهذا ما يجعل التوفو الحالة المرجعية بين البروتينات النباتية (أغلب البقوليات تحتاج قرين حبوب لتكتمل). و«كامل» لا تعني «أعلى»: يظل يحمل ${tofu.per100g.protein} جرامًا لكل 100 مقابل ${chicken.per100g.protein} جرامًا للدجاج؛ تعني مكتفية بذاتها.`,
        },
      },
      {
        q: {
          en: `Can tofu replace chicken for muscle gain?`,
          ar: `هل يعوض التوفو الدجاج في بناء العضلات؟`,
        },
        a: {
          en: `With portion planning, yes: a ${tofuN.servingGrams}g serving carries ${tofuN.serving.protein}g of protein while a ${chickenN.servingGrams}g breast carries ${chickenN.serving.protein}g — so a gaining phase built on tofu needs larger servings or stacked sources. The muscle-building requirement is total daily protein; tofu can meet it, it just needs a bigger plate.`,
          ar: `بتخطيط الحصص نعم: حصة ${tofuN.servingGrams} جرامًا تحمل ${tofuN.serving.protein} جرام بروتين بينما صدر ${chickenN.servingGrams} جرامًا يحمل ${chickenN.serving.protein} جرامًا — فمرحلة زيادة مبنية على التوفو تحتاج حصصًا أكبر أو مصادر متراكبة. شرط البناء هو إجمالي بروتين اليوم، والتوفو يبلغه لكن بطبق أكبر.`,
        },
      },
      {
        q: {
          en: `Which is lower in fat?`,
          ar: `أيهما أقل دهنًا؟`,
        },
        a: {
          en: `Chicken breast: ${chicken.per100g.fat}g per 100g against tofu's ${tofu.per100g.fat}g. The nuance worth keeping: tofu's fat is plant fat — predominantly unsaturated — and both lines are modest by the standards of a normal plate; the fat column should not scare anyone off either food.`,
          ar: `صدر الدجاج: ${chicken.per100g.fat} جرام لكل 100 مقابل ${tofu.per100g.fat} جرامًا للتوفو. والفارق الدقيق الذي يستحق البقاء: دهن التوفو نباتي أغلبُه غير مشبع، وكلا الخطين متواضع بمعايير طبق عادي؛ فعمود الدهن لا يخيف من أيٍّ منهما.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
  },
  {
    slug: "olive-oil-vs-coconut-oil",
    aSlug: "olive-oil",
    bSlug: "coconut-oil",
    publishedAt: PUBLISHED_AT,
    titleEn: `Olive Oil vs Coconut Oil — Calories, Fat and Cooking Uses | Alkemos`,
    titleAr: `زيت زيتون أم زيت جوز الهند؟ أيهما للطبخ والتخسيس`,
    h1En: `Olive Oil vs Coconut Oil`,
    h1Ar: `زيت زيتون أم زيت جوز الهند؟`,
    descriptionEn: `Olive oil vs coconut oil: ${oliveOil.per100g.calories} vs ${coconutOil.per100g.calories} kcal per 100g — both pure fat. The real choice is composition and use, not calories.`,
    descriptionAr: `زيت زيتون أم زيت جوز الهند؟ السعرات متعادلة تقريبًا والدهن كامل في كليهما — والفرق الحقيقي في التركيب والاستخدام. جدول وأحكام صريحة.`,
    introEn: `Straight answer: on calories there is nothing to argue about — olive oil ${oliveOil.per100g.calories} kcal per 100g against coconut oil's ${coconutOil.per100g.calories}, a ${oliveOil.per100g.calories - coconutOil.per100g.calories}-kcal gap that turns to noise inside one spoon (a ${oliveOilN.servingGrams}g tablespoon: ${oliveOilN.serving.calories} vs ${coconutOilN.serving.calories} kcal). Both oils are pure fat — zero protein, zero carbs — so neither is "light" and neither cuts anything alone. The real decision sits in fat composition and in what you are cooking: olive oil is predominantly monounsaturated, coconut oil mostly saturated, and the standing official pattern keeps favoring unsaturated fats for everyday use. The verdicts below turn that into kitchen practice.`,
    introAr: `الإجابة المباشرة: على السعرات لا شيء يستحق الجدل — زيت الزيتون ${oliveOil.per100g.calories} سعرة لكل 100 جرام مقابل ${coconutOil.per100g.calories} لزيت جوز الهند، بفارق ${oliveOil.per100g.calories - coconutOil.per100g.calories} سعرة يتحول إلى ضجيج بلا معنى داخل ملعقة واحدة (ملعقة ${oliveOilN.servingGrams} جرامًا: ${oliveOilN.serving.calories} مقابل ${coconutOilN.serving.calories} سعرة). والزيتان دهن خالص — صفر بروتين وصفر كربوهيدرات — فلا أحدهما «خفيف» ولا أحدهما يخسّر شيئًا منفردًا. القرار الحقيقي يسكن تركيب الدهن وفيما تطبخه: زيت الزيتون أحادي عدم التشبع في غالبه، وجوز الهند مشبع في أغلبه، والنمط الرسمي القائم يظل يرجح غير المشبع للاستعمال اليومي. والأحكام أدناه تحول ذلك إلى ممارسة مطبخية.`,
    a: nutritionFor(oliveOil),
    b: nutritionFor(coconutOil),
    verdicts: [
      {
        heading: { en: `For everyday cooking`, ar: `للطبخ اليومي` },
        body: {
          en: `Olive oil. Its fat is predominantly monounsaturated — the profile standing dietary guidance keeps favoring for daily use — and it earns its place at every step: salads, pan work, the finishing drizzle. Coconut oil's fat is mostly saturated, the category every major guideline asks you to keep limited.`,
          ar: `زيت الزيتون. دهنه أحادي عدم التشبع في غالبه — الملمح الذي تظل الإرشادات الغذائية القائمة ترجحه للاستعمال اليومي — ويكسب مكانه في كل خطوة: السلطات، وحلة القلي، واللمسة الأخيرة على الطبق. أما دهن زيت جوز الهند فمشبع في أغلبه، وهي الفئة التي تطلب كل الإرشادات الكبرى إبقاءها محدودة.`,
        },
      },
      {
        heading: { en: `The calorie truth on a cut`, ar: `حقيقة السعرات في التخسيس` },
        body: {
          en: `Neither spoon is free: both oils are 100% fat, and one tablespoon (${oliveOilN.servingGrams}g) costs ${oliveOilN.serving.calories} kcal as olive and ${coconutOilN.serving.calories} kcal as coconut — a ${Math.abs(oliveOilN.serving.calories - coconutOilN.serving.calories).toFixed(1)}-kcal difference that decides nothing. On a deficit the unit that matters is the measured spoon, not the label on the bottle.`,
          ar: `لا ملعقة مجانية: الزيتان دهن خالص، وملعقة الطعام (${oliveOilN.servingGrams} جرامًا) تكلف ${oliveOilN.serving.calories} سعرة كزيت زيتون و${coconutOilN.serving.calories} سعرة كجوز هند — فارق ${Math.abs(oliveOilN.serving.calories - coconutOilN.serving.calories).toFixed(1)} سعرة لا يحسم شيئًا. في العجز السعراتي الوحدة التي تعني شيئًا هي الملعقة المقيسة لا الملصق على القارورة.`,
        },
      },
      {
        heading: { en: `Where coconut earns its shelf`, ar: `حيث يستحق جوز الهند مكانه` },
        body: {
          en: `Texture and specific jobs: coconut oil is solid at cool room temperature, which suits certain baked goods and particular flavor profiles — treats and some Asian dishes where its aroma is the point. A specialty tool with real uses; just not the daily driver, and the honest shelf treats it that way.`,
          ar: `القوام والمهام النوعية: زيت جوز الهند صلب في حرارة الغرفة الباردة، وهذا يناسب أصنافًا من المخبوزات وملامح نكهة بعينها — حلويات وأطباق آسيوية تكون رائحته هي المقصود. أداة تخصص لها استخدامات حقيقية؛ لكنها ليست القوة اليومية، والرف الصادق يعاملها كذلك.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Which oil has fewer calories?`,
          ar: `أي الزيتين أقل سعرات؟`,
        },
        a: {
          en: `Effectively a tie: ${oliveOil.per100g.calories} vs ${coconutOil.per100g.calories} kcal per 100g, and ${oliveOilN.serving.calories} vs ${coconutOilN.serving.calories} per tablespoon — a ${Math.abs(oliveOil.per100g.calories - coconutOil.per100g.calories)}-kcal gap per 100g that vanishes inside a spoon. Every cooking oil lives in the same all-fat neighborhood; choose by composition and use, not by calories.`,
          ar: `تعادل عملي: ${oliveOil.per100g.calories} مقابل ${coconutOil.per100g.calories} سعرة لكل 100 جرام، و${oliveOilN.serving.calories} مقابل ${coconutOilN.serving.calories} للملعقة — فارق ${Math.abs(oliveOil.per100g.calories - coconutOil.per100g.calories)} سعرة لكل 100 جرام يتبخر داخل الملعقة. كل زيوت الطبخ تسكن الحي نفسه: دهن كامل تقريبًا؛ فاختر بالتركيب والاستخدام لا بالسعرات.`,
        },
      },
      {
        q: {
          en: `Is coconut oil unhealthy?`,
          ar: `هل زيت جوز الهند غير صحي؟`,
        },
        a: {
          en: `The honest framing: it is mostly saturated fat, and guidance recommends keeping saturated fat limited — but "limited" is not "banned." Occasional use in a dish that needs its texture or aroma is a different decision from making it the household default. A doctor's saturated-fat target for a heart condition decides the shelf, not a trend.`,
          ar: `الصياغة الصادقة: معظمه دهن مشبع، والإرشادات توصي بإبقاء المشبع محدودًا — لكن «محدودًا» ليست «محظورًا». والاستعمال العرضي في طبق يحتاج قوامه أو رائحته قرار مختلف عن جعله خيار البيت الدائم. وحدُّ الدهون المشبعة الذي يضعه طبيب لحالة قلبية هو الذي يرتب الرف، لا موجة من الموجات.`,
        },
      },
      {
        q: {
          en: `Which oil should I cook with on a diet?`,
          ar: `أي زيت أطبخ به في الحمية؟`,
        },
        a: {
          en: `Whichever one you measure. A tablespoon of either is ${oliveOilN.servingGrams}g of fat and roughly ${Math.round(oliveOilN.serving.calories)} kcal; olive oil as the daily default for its composition, coconut oil when the recipe genuinely calls for it. The deficit comes from the day's total line — never from the oil's brand war.`,
          ar: `ما تقيسه منهما. الملعقة من أيٍّ كان ${oliveOilN.servingGrams} جرام دهن ونحو ${Math.round(oliveOilN.serving.calories)} سعرة؛ زيت الزيتون خيارًا يوميًا لتركيبه، وجوز الهند حين يطلبه الطبق فعلًا. والعجز يأتي من سطر إجمالي اليوم — لا من حرب علامات الزيت.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
  },
  {
    slug: "dates-vs-banana",
    aSlug: "dates",
    bSlug: "banana",
    publishedAt: PUBLISHED_AT,
    titleEn: `Dates vs Banana — Calories, Sugar and Quick Energy | Alkemos`,
    titleAr: `تمر أم موز؟ مقارنة السعرات والسكر للطاقة والتخسيس`,
    h1En: `Dates vs Banana`,
    h1Ar: `تمر أم موز؟`,
    descriptionEn: `Dates vs banana: ${dates.per100g.calories} vs ${banana.per100g.calories} kcal per 100g — concentrated fuel vs everyday fruit volume, with the sugar math.`,
    descriptionAr: `تمر أم موز؟ كثافة الطاقة مقابل حجم الفاكهة اليومية — جدول السعرات والسكر للحصة الحقيقية، وحكم صريح للطاقة السريعة والتخسيس.`,
    introEn: `Direct answer: these are two different energy strategies. Dates are concentration itself — ${dates.per100g.calories} kcal per 100g — so the customary ${datesN.servingGrams}g portion (about five of them) delivers ${datesN.serving.calories} kcal plus ${datesN.serving.carbs}g of carbohydrates and ${((dates.per100g.sugar * datesN.servingGrams) / 100).toFixed(1)}g of sugars: compact, pocketable, no prep required — precisely why Ramadan tables break their fast on them. The banana works the opposite way: a single medium specimen (${bananaN.servingGrams}g) holds just ${bananaN.serving.calories} kcal and ${bananaN.serving.carbs}g of carbohydrates inside a watery structure the jaw has to work through. Each has its place — the numbers below map it.`,
    introAr: `الإجابة المباشرة: هذان نظامان للوقود لا نظام واحد. التمر هو المركّز — ${dates.per100g.calories} سعرة لكل 100 جرام — فحصته الشائعة (${datesN.servingGrams} جرامًا ≈ خمس تمرات) تجلب ${datesN.serving.calories} سعرة مع ${datesN.serving.carbs} جرام كربوهيدرات و${((dates.per100g.sugar * datesN.servingGrams) / 100).toFixed(1)} جرام سكريات: كثيف ومحمول وبلا أي تجهيز — ولهذا بالضبط يرتكز على مائدة الإفطار في رمضان. والموز هو نظام الحجم اليومي: ثمرة متوسطة (${bananaN.servingGrams} جرامًا) تحمل ${bananaN.serving.calories} سعرة و${bananaN.serving.carbs} جرام كربوهيدرات داخل غلاف غني بالماء تمضغه فعلًا. ولا أحد منهما خطأ — الجدول والأحكام أدناه يكشفان أين يربح كل منهما.`,
    a: nutritionFor(dates),
    b: nutritionFor(banana),
    verdicts: [
      {
        heading: { en: `For quick energy`, ar: `للوقود السريع` },
        body: {
          en: `Dates: ${datesN.serving.calories} kcal inside ${datesN.servingGrams}g requiring no washing, peeling, or delay — rapid carbohydrate compressed by generations of habit into the Ramadan iftar. The workable rule is counting, not weighing: five form a budgeted portion; an open tray is another matter entirely.`,
          ar: `التمر: ${datesN.serving.calories} سعرة داخل ${datesN.servingGrams} جرامًا لا تحتاج غسلًا ولا تقشيرًا ولا وقتًا — كثافة الكربوهيدرات العاجلة التي وضعتها أجيال من العادة على مائدة الإفطار. والقاعدة العملية العدّ لا الوزن: خمس تمرات حصة محسوبة، والطبق المفتوح قصة أخرى.`,
        },
      },
      {
        heading: { en: `When the count is tight`, ar: `ليوم معدود السعرات` },
        body: {
          en: `Banana: a larger mouthful (${bananaN.servingGrams}g vs ${datesN.servingGrams}g), less energy per portion (${bananaN.serving.calories} vs ${datesN.serving.calories} kcal), extra water and a slower pace. When the schedule is managed by arithmetic, produce that resists hurry is the sturdier ally.`,
          ar: `الموز: حجم قضمة أكبر (${bananaN.servingGrams} مقابل ${datesN.servingGrams} جرامًا)، وسعرات أقل للحصة (${bananaN.serving.calories} مقابل ${datesN.serving.calories})، وماء أكثر ومضغ أبطأ. في يوم يُدار بالأرقام تكون الفاكهة التي تستغرق مضغًا أطول حليفًا أمتن.`,
        },
      },
      {
        heading: { en: `The sweetness truth`, ar: `صدق السكر` },
        body: {
          en: `Both deliver their sweetness intact, not as added sugar: dates bring ${dates.per100g.sugar}g per 100g together with ${datesN.serving.fiber}g of fiber in the portion, the banana ${banana.per100g.sugar}g per 100g alongside ${bananaN.serving.fiber}g. The hazard with dates is never the produce — it is the uncounted chain: two extra of them add about ${Math.round((datesN.serving.calories * 2) / 5)} kcal.`,
          ar: `كلاهما يصل سكر طعام كامل لا سكر حر: التمر ${dates.per100g.sugar} جرام لكل 100 جرام ومعها ${datesN.serving.fiber} جرامات ألياف في الحصة، والموز ${banana.per100g.sugar} جرام لكل 100 مع ${bananaN.serving.fiber} جرام. الخطر في التمر ليس الثمرة بل السلسلة غير المعدودة: تمرتان إضافيتان تعنيان نحو +${Math.round((datesN.serving.calories * 2) / 5)} سعرة.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Which has more sugar — dates or banana?`,
          ar: `أيهما أكثر سكرًا — التمر أم الموز؟`,
        },
        a: {
          en: `Per 100g: dates ${dates.per100g.sugar}g against the banana's ${banana.per100g.sugar}g; per actual portion ${((dates.per100g.sugar * datesN.servingGrams) / 100).toFixed(1)}g vs ${((banana.per100g.sugar * bananaN.servingGrams) / 100).toFixed(1)}g — nearly double for dates. But each comes inside an intact plant food with fiber and moisture and micronutrients, never as loose added sugar; manage the difference by counting them instead of banning anything.`,
          ar: `لكل 100 جرام: التمر ${dates.per100g.sugar} جرامًا مقابل ${banana.per100g.sugar} جرامًا للموز؛ وبالحصة الحقيقية ${((dates.per100g.sugar * datesN.servingGrams) / 100).toFixed(1)} مقابل ${((banana.per100g.sugar * bananaN.servingGrams) / 100).toFixed(1)} جرام — نحو الضعف للتمر. لكن الطرفين يصلان داخل ثمرة كاملة بألياف وماء ومغذيات دقيقة، لا كسكر حر؛ والفرق يُدار بعدد الحبات لا بحظر الثمرة.`,
        },
      },
      {
        q: {
          en: `Are dates good before a workout?`,
          ar: `هل التمر مناسب قبل التمرين؟`,
        },
        a: {
          en: `Yes, as fast-acting energy: ${datesN.serving.carbs}g of easy carbohydrates in the ${datesN.servingGrams}g portion, digestible on the move — the compression that serves the iftar serves the pre-session top-up just as well. Hold it to a counted amount (five) and book it inside the carbohydrate allowance.`,
          ar: `نعم كوقود عاجل: ${datesN.serving.carbs} جرام كربوهيدرات سهلة في حصة ${datesN.servingGrams} جرامًا تُهضم في الطريق — الكثافة ذاتها التي تخدم فطر الصيام تخدم تعبئة ما قبل الجلسة. اجعلها حصة معدودة (نحو خمس) واحجزها داخل ميزانية الكربوهيدرات لليوم.`,
        },
      },
      {
        q: {
          en: `Which is better for weight loss?`,
          ar: `أيهما أفضل لخسارة الوزن؟`,
        },
        a: {
          en: `The banana by portion arithmetic: ${bananaN.serving.calories} vs ${datesN.serving.calories} kcal, with extra bulk and a slower pace per unit of energy. That does not convict the dates: a plan reserving two or three for after a workout is a sound plan — the decision always rests on the full-day tally, and their density only punishes snacking done by feel.`,
          ar: `الموز بحساب الحصص: ${bananaN.serving.calories} مقابل ${datesN.serving.calories} سعرة بحجم أكبر ومضغ أكثر لكل سعرة. وهذا لا يُدين التمر: خطة تحجز لتمرتين أو ثلاث بعد التدريب خطة سليمة — الحكم يقع دائمًا على سطر إجمالي اليوم، وكثافة التمر تعاقب الأكل بلا عدّ وحده.`,
        },
      },
    ],
    toolSlug: "calorie-calculator",
  },
  {
    slug: "lentils-vs-chickpeas",
    aSlug: "lentils",
    bSlug: "chickpeas",
    publishedAt: PUBLISHED_AT,
    titleEn: `Lentils vs Chickpeas — Protein, Fiber and Calories Compared | Alkemos`,
    titleAr: `عدس أم حمص؟ مقارنة البروتين والألياف والسعرات`,
    h1En: `Lentils vs Chickpeas`,
    h1Ar: `عدس أم حمص؟`,
    descriptionEn: `Lentils vs chickpeas (cooked): ${lentils.per100g.protein}g protein each per 100g — but ${lentils.per100g.calories} vs ${chickpeas.per100g.calories} kcal. Fiber, servings, honest verdicts.`,
    descriptionAr: `عدس أم حمص؟ بروتين متقارب وسعرات مختلفة — جدول الألياف والسعرات لكل 100 جرام وللكوب المطبوخ، وحكم بروتيني صادق لكل طبق.`,
    introEn: `Straight answer: the protein lines are nearly identical — ${lentils.per100g.protein}g per 100g for lentils, ${chickpeas.per100g.protein}g for chickpeas — so the choice is decided by the numbers around them. Lentils run leaner: ${lentils.per100g.calories} kcal per 100g against chickpeas' ${chickpeas.per100g.calories}, which makes their protein-per-calorie edge real (${lentilsN.proteinPer100kcal}g vs ${chickpeasN.proteinPer100kcal}g per 100 kcal). Chickpeas answer with a denser, firmer cup that carries more energy into the same spoon: one cooked cup (${chickpeasN.servingGrams}g) delivers ${chickpeasN.serving.calories} kcal against the lentil cup's (${lentilsN.servingGrams}g) ${lentilsN.serving.calories}. Both are fiber machines — ${lentilsN.serving.fiber}g and ${chickpeasN.serving.fiber}g per cup respectively. The verdicts below place each on its plate.`,
    introAr: `الإجابة المباشرة: البروتين شبه متطابق بين الصنفين — ${lentils.per100g.protein} جرام لكل 100 جرام للعدس و${chickpeas.per100g.protein} جرام للحمص — فالاختيار تحسمه الأرقام المحيطة بهما. العدس أخف: ${lentils.per100g.calories} سعرة لكل 100 جرام مقابل ${chickpeas.per100g.calories} للحمص، وهو ما يجعل أفضلية البروتين لكل سعرة حقيقية (${lentilsN.proteinPer100kcal} جرام مقابل ${chickpeasN.proteinPer100kcal} لكل 100 سعرة). ويرد الحمص بكوب أكثف وأصلب يحمل طاقة أكثر في الملعقة نفسها: كوب مطبوخ (${chickpeasN.servingGrams} جرامًا) يقدم ${chickpeasN.serving.calories} سعرة مقابل ${lentilsN.serving.calories} لكوب العدس (${lentilsN.servingGrams} جرامًا). وكلاهما آلة ألياف — ${lentilsN.serving.fiber} و${chickpeasN.serving.fiber} جرامًا للكوب على الترتيب. والأحكام أدناه تضع كليهما في طبقه.`,
    a: nutritionFor(lentils),
    b: nutritionFor(chickpeas),
    verdicts: [
      {
        heading: { en: `For a leaner plate`, ar: `لطبق أخف` },
        body: {
          en: `Lentils: ${lentils.per100g.calories} kcal per 100g against chickpeas' ${chickpeas.per100g.calories}, with the same ${lentils.per100g.protein}g of protein — which is why the protein-per-100-kcal column reads ${lentilsN.proteinPer100kcal}g vs ${chickpeasN.proteinPer100kcal}g. Add ${lentilsN.serving.fiber}g of fiber per cup and you have the soup base that fills a plate without creeping the day's total.`,
          ar: `العدس: ${lentils.per100g.calories} سعرة لكل 100 جرام مقابل ${chickpeas.per100g.calories} للحمص، وبالبروتين نفسه (${lentils.per100g.protein} جرام) — ولهذا يقرأ عمود البروتين لكل 100 سعرة ${lentilsN.proteinPer100kcal} جرامًا مقابل ${chickpeasN.proteinPer100kcal}. أضف ${lentilsN.serving.fiber} جرام ألياف للكوب تحصل على قاعدة شوربة تملأ الطبق دون أن تزحف على إجمالي اليوم.`,
        },
      },
      {
        heading: { en: `For gaining and hearty dishes`, ar: `للكسب والأطباق الدسمة` },
        body: {
          en: `Chickpeas: the firmer cup carries ${chickpeasN.serving.calories} kcal into ${chickpeasN.serving.protein}g of protein and holds its shape through salads and stews — a dense, satisfying base that a surplus and a family table both appreciate. Their ${chickpeas.per100g.fat}g of fat per 100g (against lentils' ${lentils.per100g.fat}g) is part of that richness.`,
          ar: `الحمص: الكوب الأصلب يحمل ${chickpeasN.serving.calories} سعرة مع ${chickpeasN.serving.protein} جرام بروتين ويحفظ شكله في السلطات والطواجن — قاعدة كثيفة مُشبعة يقدّرها الفائض ومائدة العائلة معًا. و${chickpeas.per100g.fat} جرام دهن لكل 100 جرام (مقابل ${lentils.per100g.fat} للعدس) جزء من هذا الاغتناء.`,
        },
      },
      {
        heading: { en: `The protein honesty`, ar: `صدق البروتين` },
        body: {
          en: `Both are supporting acts, not the headline: ${lentilsN.serving.protein}g and ${chickpeasN.serving.protein}g per cup is real protein, but a single ${chickenN.servingGrams}g chicken-breast serving carries ${chickenN.serving.protein}g. Anchor the meal around a primary protein and let the legume carry the fiber-and-slow-carbs side — or plan noticeably bigger portions on fully plant-based days.`,
          ar: `كلاهما دور مساند لا عنوان رئيس: ${lentilsN.serving.protein} و${chickpeasN.serving.protein} جرامًا للكوب بروتين حقيقي، لكن حصة صدر دجاج واحدة (${chickenN.servingGrams} جرامًا) تحمل ${chickenN.serving.protein} جرامًا. ارتكز الوجبة على بروتين أساسي ودع البقول يقود جانب الألياف والكربوهيدرات البطيئة — أو خطّط حصصًا أكبر بوضوح في الأيام النباتية الكاملة.`,
        },
      },
    ],
    faqs: [
      {
        q: {
          en: `Which has more protein — lentils or chickpeas?`,
          ar: `أيهما أكثر بروتينًا — العدس أم الحمص؟`,
        },
        a: {
          en: `Per 100g they are the same food on that line: ${lentils.per100g.protein}g each. Per real serving the lentil cup (bigger at ${lentilsN.servingGrams}g) delivers ${lentilsN.serving.protein}g against the chickpea cup's ${chickpeasN.serving.protein}g. Per 100 kcal lentils lead clearly: ${lentilsN.proteinPer100kcal}g vs ${chickpeasN.proteinPer100kcal}g. Pick your denominator before you pick your winner.`,
          ar: `لكل 100 جرام هما الطعام نفسه على هذا السطر: ${lentils.per100g.protein} جرام لكل منهما. وبالحصة الحقيقية يقدم كوب العدس (الأكبر: ${lentilsN.servingGrams} جرامًا) ${lentilsN.serving.protein} جرامًا مقابل ${chickpeasN.serving.protein} جرامًا لكوب الحمص. ولكل 100 سعرة يتقدم العدس بوضوح: ${lentilsN.proteinPer100kcal} مقابل ${chickpeasN.proteinPer100kcal} جرامًا. اختر مقامك قبل أن تختار فائزك.`,
        },
      },
      {
        q: {
          en: `Which is better for a diet?`,
          ar: `أيهما أفضل للحمية؟`,
        },
        a: {
          en: `Lentils win the arithmetic (${lentilsN.serving.calories} vs ${chickpeasN.serving.calories} kcal per cup), but chickpeas still fit: their cup is ${chickpeasN.serving.fiber}g of fiber and slow carbohydrates, not a cheat food. The classic mistake is neither legume — it is the oil poured over them, which both soak up like sponges.`,
          ar: `العدس في الحساب (${lentilsN.serving.calories} مقابل ${chickpeasN.serving.calories} سعرة للكوب)، لكن الحمص يتسع أيضًا: كوبه ${chickpeasN.serving.fiber} جرام ألياف وكربوهيدرات بطيئة، لا طعام غش. والخطأ الكلاسيكي ليس في أحدهما — بل في الزيت المسكوب فوقهما، وكلاهما يشربه كالإسفنج.`,
        },
      },
      {
        q: {
          en: `Can I rely on legumes alone for protein?`,
          ar: `هل يكفي البروتين من البقوليات وحدها؟`,
        },
        a: {
          en: `Only with planning: a cup of lentils is ${lentilsN.serving.protein}g, and an active adult's daily target takes several cups or stacked sources (tofu, dairy, eggs). Legumes anchor the fiber and slow-carb side of the plate; a primary protein usually tops it — the two jobs are different jobs.`,
          ar: `بالتخطيط فقط: كوب العدس ${lentilsN.serving.protein} جرامًا، وهدف اليوم لشخص نشط يحتاج أكوابًا عدة أو مصادر متراكبة (توفو وألبان وبيض). البقوليات ترتكز جانب الألياف والكربوهيدرات البطيئة في الطبق؛ وبروتين أساسي يتوجه عادة — الوظيفتان وظيفتان مختلفتان.`,
        },
      },
    ],
    toolSlug: "macro-calculator",
  },
];

/**
 * GROWTH-PLAN batch 11 (owner order «حسّن الروابط الداخلية»): the
 * comparisons featuring a given food — derived 100% from this module so a
 * food page's reciprocal links can never drift from the real pairs.
 */
export function getComparisonsFeaturingFood(foodSlug: string): FoodComparison[] {
  return FOOD_COMPARISONS.filter((c) => c.aSlug === foodSlug || c.bSlug === foodSlug);
}

export function getFoodComparisonBySlug(slug: string): FoodComparison | undefined {
  return FOOD_COMPARISONS.find((c) => c.slug === slug);
}
