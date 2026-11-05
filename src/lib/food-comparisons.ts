/**
 * Food comparison pages — SEO-GROWTH-P4 pilot (owner order 2026-11-05,
 * «Programmatic SEO للأطعمة… ابدأ باختبار محدود قابل للقياس… لا تبدأ
 * بدفعات 500 أو 1,000 صفحة»), executing audit file 03 §4.2 (the highest
 * search-value NEW page type): "X vs Y" food pairs answering the measured
 * Arabic PAA patterns («موز أم تفاح؟» «تونة أم دجاج للبروتين؟» «شوفان أم
 * أرز؟» — SERP evidence 2026-11-05: led by generic medical portals with no
 * strict comparison tables).
 *
 * PILOT SCOPE (deliberately small, per the owner's order):
 *   4 pairs × 2 languages = 8 URLs, ALL built exclusively from the 80
 *   CURATED + ENRICHED foods (audit §4.2's own precondition: both items
 *   enriched first). No USDA tail items, no band items — the D-2-gated
 *   scale-out is NOT touched by this family (sitemap-foods criteria and
 *   its selection law stay byte-identical).
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
// The pilot pairs — every slug below is one of the 80 CURATED foods
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

const PUBLISHED_AT = "2026-11-05"; // stable first-publish (this pilot frame)

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
          ar: `سكر أياً من الثمرتين لا يخرجه من الحمية: الموز ${banana.per100g.sugar} جرام لكل 100، والتفاح ${apple.per100g.sugar} جرام لكل 100 — وكلاهما يأتي داخل مصفوفة طعام كامل بألياف وماء ومغذيات دقيقة، لا كسكر حر. وإرشادات منظمة الصحة العالمية للسكر الحر لا تحسب الثمار الكاملة. الذي يُفسد الخسارة هو سطر إجمالي السعرات، لا سلّة الفاكهة.`,
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
];

export function getFoodComparisonBySlug(slug: string): FoodComparison | undefined {
  return FOOD_COMPARISONS.find((c) => c.slug === slug);
}
