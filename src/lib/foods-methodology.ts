/**
 * src/lib/foods-methodology.ts — the P1-8 "documented reference" content.
 *
 * PROVENANCE (Phase 318 — owner order 2026-10-01 «ابدأ تنفيذ البند التالى»):
 * the approved SEO audit's P1 item 8: «سلعنة قاعدة الأطعمة كمرجع موثق يستحق
 * الروابط» — the food database becomes a citable reference by documenting
 * its sources, conventions, and limits in public. Content source for
 * /foods/methodology (EN) + /ar/foods/methodology (AR).
 *
 * NUMBER LAW (STATE.md source-of-truth map): every count on the page is
 * computed AT RENDER TIME from the FOODS array (src/lib/foods.ts — the
 * single source) by foodsMethodologyStats() below — never hardcoded
 * literals, never doc numbers. The page therefore cannot drift from the
 * data.
 *
 * HONESTY LAWS:
 *   - The long tail's USDA provenance is stated as documented in-repo
 *     (Phase 141 data audit; sitemap-foods policy header).
 *   - Untranslated AR mirrors being noindex is stated openly (P2-12 §12.37)
 *     — the methodology page is where that honesty becomes an asset.
 *   - No open-data license is claimed: repo LICENSE is proprietary, so the
 *     citation section links the site terms instead.
 *   - MSA discipline for the Arabic copy (Latin only as parenthetical
 *     glosses or brand names).
 *
 * Client-safe: pure data. The stats helper lives here too but takes the
 * FOODS array as an argument so this module stays client-importable —
 * only the (server) page imports foods.ts and passes the rows in.
 */

export const FOODS_METHODOLOGY_PATH = "/foods/methodology";
export const FOODS_METHODOLOGY_PATH_AR = "/ar/foods/methodology";
export const FOODS_METHODOLOGY_PUBLISHED = "2026-10-01";

export const FOODS_METHODOLOGY_META = {
  titleEn: "Food Database Methodology — Sources, Conventions, and How to Cite | Alkemos",
  descriptionEn:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 192 → 132 chars — the
    // ≤160 SERP-truncation law now holds (all five documentation pillars kept).
    "How the Alkemos food database is built: per-100g standardization, curated core, Arabic layer, known limits, and the citation format.",
  titleAr: "منهجية قاعدة الأطعمة — المصادر والأعراف وكيفية الاستشهاد",
  descriptionAr:
    "كيف تُبنى قاعدة أطعمة Alkemos: التوحيد على كل 100 جرام، والنواة المنتقاة والذيل المرجعي، والطبقة العربية، والحدود المعروفة، وصيغة الاستشهاد للمدربين والكتّاب.",
  h1En: "Alkemos Food Database — Methodology and Sources",
  h1Ar: "قاعدة أطعمة Alkemos — المنهجية والمصادر",
  introEn:
    "A nutrition reference earns citations by documenting itself. This page states what the Alkemos food database contains, where its values come from, which conventions every entry follows, where the honest limits sit, and exactly how to cite it — so a coach quoting a macro figure or a writer referencing a per-100g value knows what the number is and what it is not.",
  introAr:
    "المرجع الغذائي يستحق الاستشهاد عندما يوثّق نفسه. هذه الصفحة تعلن ما تحتويه قاعدة أطعمة Alkemos، ومن أين تأتي قيمها، وأي أعراف يتبعها كل مدخل، وأين تقع الحدود الصادقة، وكيف تستشهد بها بالضبط — حتى يعرف المدرب الذي ينقل رقم ماكرو، والكاتب الذي يحيل إلى قيمة كل 100 جرام، ما هو الرقم وما ليس هو.",
} as const;

/**
 * Render-time stats computed FROM the FOODS array (passed in by the server
 * page — keeps this module client-safe). The long-tail / arabized split
 * mirrors the Phase-141 data audit criteria verbatim: curated = tags
 * non-empty; arabized = nameAr carries real Arabic characters.
 */
export interface FoodsMethodologyStats {
  total: number;
  curated: number;
  longTail: number;
  arabized: number;
  categories: number;
}

export function foodsMethodologyStats(
  foods: ReadonlyArray<{
    tags?: readonly string[];
    nameAr: string;
    category: string;
  }>,
  categoryCount: number,
): FoodsMethodologyStats {
  const arRun = /[\u0600-\u06FF]/;
  let curated = 0;
  let arabized = 0;
  for (const f of foods) {
    if ((f.tags?.length ?? 0) > 0) curated += 1;
    if (arRun.test(f.nameAr)) arabized += 1;
  }
  return {
    total: foods.length,
    curated,
    longTail: foods.length - curated,
    arabized,
    categories: categoryCount,
  };
}

export type MethodologySection = {
  id: string;
  headingEn: string;
  headingAr: string;
  /** Paragraphs support {total} / {curated} / {longTail} / {arabized} / {categories} slots filled at render. */
  paragraphsEn: readonly string[];
  paragraphsAr: readonly string[];
};

export const FOODS_METHODOLOGY_SECTIONS: readonly MethodologySection[] = [
  {
    id: "what-it-is",
    headingEn: "What this database is",
    headingAr: "ما هذه القاعدة",
    paragraphsEn: [
      "The Alkemos food database is a nutrition reference of {total} foods. Every entry carries the same four facts — calories, protein, carbohydrate, and fat — standardized per 100 grams, plus fiber and sugar where the source provides them, a food category ({categories} top-level families), and a default serving expressed in real grams.",
      "The database is bilingual by design: each row holds an English name and an Arabic name, with Arabic default-serving descriptions on the hand-curated core. It powers the macro workflow end to end — the meal planner's live per-meal and per-day totals are computed from these same rows, so the numbers you plan with and the numbers you look up are one and the same source.",
      "The structure splits into two layers with different curation depths: a hand-curated core of {curated} foods (written bilingual names, gram-anchored default servings, and nutrition-goal tags such as high-protein or keto-friendly), and a reference long tail of {longTail} rows carrying standardized English nutrition values. Both layers follow the per-100g convention; the counts on this page are computed live from the shipped data, not copied from a document.",
    ],
    paragraphsAr: [
      "قاعدة أطعمة Alkemos مرجع غذائي يضم {total} صنفًا. كل مدخل يحمل الحقائق الأربع نفسها — السعرات والبروتين والكربوهيدرات والدهون — موحدة على كل 100 جرام، مع الألياف والسكر حيث يوفرها المصدر، وفئة غذائية ({categories} عائلات رئيسية)، وحصة افتراضية معبر عنها بالجرام الحقيقي.",
      "القاعدة ثنائية اللغة بالتصميم: كل صف يحمل اسمًا إنجليزيًا واسمًا عربيًا، مع أوصاف حصص افتراضية عربية على النواة المنتقاة يدويًا. وهي تغذي مسار الماكروز من طرفه إلى طرفه — مجاميع مخطط الوجبات الحيّة لكل وجبة ولكل يوم تُحسب من هذه الصفوف نفسها، فالأرقام التي تخطط بها والأرقام التي تبحث عنها مصدرها واحد.",
      "تنقسم البنية إلى طبقتين بعمق تنقيح مختلف: نواة منتقاة يدويًا من {curated} صنفًا (أسماء ثنائية اللغة مكتوبة، وحصص افتراضية مثبتة بالجرام، ووسم أهداف غذائية مثل عالي البروتين أو صديق للكيتو)، وذيل مرجعي من {longTail} صفًا يحمل قيمًا غذائية إنجليزية موحدة. الطبقتان تتبعان أعراف كل 100 جرام؛ والأعداد في هذه الصفحة تُحسب لحظيًا من البيانات المُشغّلة، لا تُنسخ من مستند.",
    ],
  },
  {
    id: "sources",
    headingEn: "Sources and structure",
    headingAr: "المصادر والبنية",
    paragraphsEn: [
      "The curated core was written by hand: bilingual names, default servings measured in grams, and the tag facets that drive the nutrition-goal collections (high-protein, low-carb, keto-friendly, and their siblings). Its values follow common kitchen-state references and are the rows the sitemap advertises in both languages.",
      "The long tail derives from the U.S. Department of Agriculture's public nutrition reference data (USDA) — the standard open reference for per-100g food composition. Long-tail rows ship English text as their Arabic name field; rather than machine-faking Arabic labels, the Arabic mirrors of untranslated rows are excluded from indexing (noindex, follow) so crawl budget and Arabic searchers never land on semantically-broken pages. The English originals remain fully indexable.",
      "This is the documented crawl-budget policy, not an oversight: the sitemap advertises the {curated} curated foods in both languages ({curated} × 2 URLs), while the long tail stays reachable through the foods explorer's pagination and related-food links and earns indexing on merit.",
    ],
    paragraphsAr: [
      "النواة المنتقاة كُتبت يدويًا: أسماء ثنائية اللغة، وحصص افتراضية مقيسة بالجرام، ووسوم الأهداف الغذائية التي تقود المجموعات (عالي البروتين، منخفض الكربوهيدرات، صديق الكيتو وإخوتها). قيمها تتبع مراجع حالة المطبخ الشائعة، وهي الصفوف التي تعلن عنها خريطة الموقع باللغتين.",
      "الذيل الطويل مشتق من بيانات المرجع الغذائي العامة لوزارة الزراعة الأمريكية (USDA) — المرجع المفتوح المعياري للتركيب الغذائي لكل 100 جرام. صفوف الذيل تحمل نصًا إنجليزيًا في حقل الاسم العربي؛ وبدل تزييف تسميات عربية آليًا، استُبعدت المرايا العربية للصفوف غير المترجمة من الفهرسة (noindex مع follow) حتى لا يهبط ميزانية الزحف ولا الباحث العربي على صفحات مكسورة دلاليًا. أما الأصول الإنجليزية فتبقى قابلة للفهرسة كاملة.",
      "هذه سياسة ميزانية زحف موثقة لا سهو: خريطة الموقع تعلن الأصناف المنتقاة ({curated} × 2 رابطًا باللغتين)، بينما يظل الذيل الطويل متاح الوصول عبر تقسيم صفحات مستكشف الأطعمة وروابط الأصناف المشابهة، فيكسب الفهرسة بالاستحقاق.",
    ],
  },
  {
    id: "conventions",
    headingEn: "The per-100g convention and gram-anchored servings",
    headingAr: "عرْف كل 100 جرام والحصص المثبتة بالجرام",
    paragraphsEn: [
      "Every value in the database is expressed per 100 grams of the food in its documented state — the international standard for food composition tables, and the convention that makes portions pure arithmetic: a 37g tablespoon of a food is 0.37 × the per-100g values, whatever your scale reads. State is the variable to watch, not math: raw and cooked weights of the same food differ (water loss concentrates cooked values per gram), so match the weighing state to the entry and the arithmetic stays honest.",
      "Default servings are anchors, not guesses: each carries a gram equivalent (for example, one medium chicken breast ≈ 150g) so a quick estimate lands near reality instead of inside a 120–250g household range. The meal planner accepts any gram figure the user enters — from 1 g up — and recomputes live against it: the per-100g values are the stored reference, never a mandatory calculation unit. The same per-100g rows feed both surfaces.",
    ],
    paragraphsAr: [
      "كل قيمة في القاعدة معبر عنها لكل 100 جرام من الصنف في حالته الموثقة — المعيار الدولي لجداول التركيب الغذائي، والعرْف الذي يجعل الحصص حسابًا خالصًا: ملعقة بحجم 37 جرامًا من صنف ما تساوي 0.37 × قيم كل 100 جرام، أيًا كان ما يقرأه ميزانك. المتغير الذي يستحق المراقبة هو الحالة لا الحساب: أوزان النيّئ والمطبوخ للصنف نفسه تختلف (فقدان الماء يركّز قيم المطبوخ لكل جرام)، فطابق حالة الوزن مع المدخل ويبقى الحساب صادقًا.",
      "الحصص الافتراضية مراسٍ لا تخمينات: كل منها تحمل مكافئًا بالجرام (مثلًا: حبة متوسطة من صدر الدجاج ≈ 150 جم) حتى يهبط التقدير السريع قرب الواقع لا داخل مدى منزلي بين 120 و250 جرامًا. ومخطط الوجبات يقبل أي رقم بالجرام يدخله المستخدم — من 1 جم فأكثر — ويعيد الحساب لحظيًا عليه: قيم كل 100 جرام مرجع مخزّن لا وحدة حساب إلزامية — صفوف كل 100 جرام نفسها تغذي السطحين.",
    ],
  },
  {
    id: "arabic-layer",
    headingEn: "The Arabic layer",
    headingAr: "الطبقة العربية",
    paragraphsEn: [
      "{arabized} foods carry hand-written Modern Standard Arabic names and, on the curated core, Arabic default-serving descriptions — written by editors, not machine-translated, so the Arabic surface reads as Arabic (the editorial law bans dialect and Latin mixing on these surfaces). The remaining {longTail}-row long tail keeps its English name in the Arabic field by design, and those untranslated mirrors are excluded from indexing rather than faked.",
      "The Arabic layer is what makes the reference usable for the Arabic-speaking fitness audience — most of whom meet macro numbers for the first time in Arabic search results — and it is why the Arabic food pages, collections, and this methodology page carry reciprocal language pairings (hreflang) with their English originals.",
    ],
    paragraphsAr: [
      "{arabized} صنفًا غذائيًا تحمل أسماء عربية فصحى مكتوبة يدويًا، ومع أوصاف حصص افتراضية عربية على النواة المنتقاة — بقلم محررين لا بترجمة آلية، حتى يقرأ السطح العربي كعربية (القانون التحريري يحظر اللهجات والخلط اللاتيني على هذه الأسطح). أما الذيل الطويل الباقي ({longTail} صفًا) فيُبقي اسمه الإنجليزي في الحقل العربي عمدًا، وقد استُبعدت تلك المرايا غير المترجمة من الفهرسة بدل تزييفها.",
      "الطبقة العربية هي ما يجعل المرجع قابلًا للاستخدام لجمهور اللياقة الناطق بالعربية — ومعظمهم يلتقي أرقام الماكروز أول مرة في نتائج بحث عربية — ولهذا تحمل صفحات الأطعمة العربية والمجموعات وهذه الصفحة المنهجية أزواج الروابط اللغوية المتبادلة (hreflang) مع أصولها الإنجليزية.",
    ],
  },
  {
    id: "stability",
    headingEn: "Update cadence and stability",
    headingAr: "إيقاع التحديث والثبات",
    paragraphsEn: [
      "The database is frozen reference data with batch updates: values change in deliberate, versioned batches — never silently per-request — and each food page is served from a long-lived cache (a 7-day revalidation window) so a cited number stays the number a returning reader saw. The per-page nutrition facts, the methodology counts, and the meal-planner arithmetic all read the same shipped data snapshot.",
      "When a batch lands (new curated foods, expanded Arabic coverage, or corrected values), the change rides a repository commit with its documentation — which is precisely the audit trail a cited reference should be able to show.",
    ],
    paragraphsAr: [
      "القاعدة بيانات مرجعية مجمّدة بتحديثات دفعية: القيم تتغير في دفعات مقصودة مرقّمة — لا بصمت في كل طلب — وكل صفحة صنف تُخدم من كاش طويل العمر (نافذة تحقق 7 أيام) فيبقى الرقم المستشهد به هو الرقم الذي رآه القارئ العائد. الحقائق الغذائية في الصفحة، وأعداد المنهجية، وحساب مخطط الوجبات، كلها تقرأ لقطة البيانات المُشغّلة نفسها.",
      "وحين تصل دفعة (أصناف منتقاة جديدة، أو توسعة تغطية عربية، أو قيم مصححة)، يسير التغيير في كوميت بالمستودع مع توثيقه — وهذا بالضبط أثر التدقيق الذي ينبغي لمرجع مستشهَد به أن يستطيع إظهاره.",
    ],
  },
  {
    id: "limits",
    headingEn: "Known limitations (read before citing a number)",
    headingAr: "حدود معروفة (اقرأها قبل الاستشهاد برقم)",
    paragraphsEn: [
      "The values are reference averages, not your exact food. Between varieties, brands, cuts, ripeness, and cooking method, a real chicken breast or a real banana drifts around the database figure — reference tables are built to average that drift, not eliminate it. Per-100g values describe a documented state; converting between raw and cooked weights is the citing writer's responsibility (the macro-accuracy guide covers the conversion rules).",
      "The long tail carries standardized English reference values, so it does not include your local brand's specific US nutrition label; for packaged goods, the label wins (regulators allow it a tolerance margin the database cannot know). And nutrition is an evolving science: a frozen reference is honest about its snapshot date — cite with an accessed date, which the format below includes.",
    ],
    paragraphsAr: [
      "القيم متوسطات مرجعية لا طعامك أنت. بين الأصناف والعلامات والقطعات ودرجة النضج وطريقة الطهي، ينحرف صدر دجاج حقيقي أو موز حقيقي حول رقم القاعدة — فجداول المرجع تُبنى لتتوسط هذا الانحراف لا لتلغيه. قيم كل 100 جرام تصف حالة موثقة؛ وتحويل الأوزان بين النيّئ والمطبوخ مسؤولية الكاتب المستشهِد (دليل دقة الماكروز يغطي قواعد التحويل).",
      "الذيل الطويل يحمل قيمًا مرجعية إنجليزية موحدة، فلا يشمل ملصق منتجك المحلي بعينه؛ وللمعلبات الغلبة للملصق (فهو يحمل هامش سماح نظاميًا لا يمكن لقاعدة البيانات معرفته). والتغذية علم متطور: المرجع المجمّد صادق حول تاريخ لقطته — فاستشهد مع تاريخ اطلاع، وهو ما تتضمنه الصيغة أدناه.",
    ],
  },
  {
    id: "cite",
    headingEn: "How to cite this database",
    headingAr: "كيف تستشهد بهذه القاعدة",
    paragraphsEn: [
      "Coaches, writers, and students may cite the per-100g values with the formats in the block below — cite the specific food page (or the database page), include an accessed date, and link the page you cite. The Arabic-language format is included for Arabic writing.",
      "Content and data are offered under the site's terms (see the terms page); the citation format itself is free to use. What we ask in exchange for a citation: keep the accessed date — a citation without a date silently turns a reference snapshot into an unbounded claim.",
    ],
    paragraphsAr: [
      "يمكن للمدربين والكتّاب والطلاب الاستشهاد بقيم كل 100 جرام بالصيغ في الكتلة أدناه — استشهد بصفحة الصنف بعينها (أو صفحة القاعدة)، وأدرج تاريخ اطلاع، واربط الصفحة التي تستشهد بها. والصيغة العربية مضمّنة للكتابة العربية.",
      "المحتوى والبيانات تُقدَّم تحت شروط الموقع (انظر صفحة الشروط)؛ وصيغة الاستشهاد نفسها حرة الاستخدام. وما نطلبه مقابل الاستشهاد: الاحتفاظ بتاريخ الاطلاع — فالاستشهاد بلا تاريخ يحوّل بصمت لقطة مرجعية إلى ادعاء بلا حدود.",
    ],
  },
];

/** The citation formats themselves — REFERENCE MATERIAL (deliberate
 * English strings, quoted like any bibliography entry; an Arabic writer
 * citing an English-language source writes the source's own title). The
 * {total} slot fills at render. Rendered as a distinct copyable block on
 * both locales — data, not Arabic prose, so the MSA scanner never sees
 * them as copy. */
export const FOODS_CITATION_FORMATS = {
  databaseEn:
    "Alkemos Food Database — per-100g nutrition values for {total} foods. Alkemos, accessed [date]. https://alkemos.com/foods",
  singleFoodEn:
    "Alkemos Food Database, “Chicken Breast — calories, protein, carbs, and fat per 100g.” Alkemos, accessed [date]. https://alkemos.com/foods/chicken-breast",
  databaseAr:
    "قاعدة أطعمة Alkemos — القيم الغذائية لكل 100 جرام لـ{total} صنفًا. Alkemos، تاريخ الاطلاع [التاريخ]. https://alkemos.com/ar/foods",
} as const;

export const FOODS_METHODOLOGY_FAQ_EN: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "How many foods does the database hold?",
    a: "The shipped data carries the live count shown in the section above (total, curated core, and long tail), computed at page render from the same rows that power the meal planner — the number you read here cannot drift from the data the tools use.",
  },
  {
    q: "Where do the values come from?",
    a: "A hand-curated bilingual core written with gram-anchored servings and nutrition-goal tags, plus an English-language reference long tail derived from the USDA public nutrition data — the standard open reference for per-100g composition.",
  },
  {
    q: "Why does an Arabic food page sometimes show an English name?",
    a: "Untranslated long-tail rows keep their English name in the Arabic field by design, and those Arabic mirrors are excluded from indexing rather than machine-faking Arabic labels. Only hand-written Arabic names are published as indexable Arabic surfaces.",
  },
  {
    q: "Are the values for raw or cooked food?",
    a: "Each entry documents its state under the per-100g convention. The same food weighs differently raw versus cooked (water loss), so match the weighing state to the entry — the macro-accuracy guide covers the conversion rules with worked examples.",
  },
  {
    q: "Can I use these numbers in my article, app, or coaching sheet?",
    a: "Yes, with the citation format in the “How to cite” section — cite the specific food page (or the database page), include an accessed date, and link the page you cite. Content and data are offered under the site's terms.",
  },
  {
    q: "How often does the database change?",
    a: "It is frozen reference data with versioned batch updates — values never drift silently, food pages are served from a long-lived cache, and every batch rides a repository commit with its documentation.",
  },
];

export const FOODS_METHODOLOGY_FAQ_AR: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "كم صنفًا تضم القاعدة؟",
    a: "البيانات المُشغّلة تحمل العدد الحي الظاهر في القسم أعلاه (الإجمالي والنواة المنتقاة والذيل الطويل)، محسوبًا عند عرض الصفحة من الصفوف نفسها التي تغذي مخطط الوجبات — فالرقم الذي تقرأه هنا لا يمكن أن ينحرف عن بيانات الأدوات.",
  },
  {
    q: "من أين تأتي القيم؟",
    a: "نواة ثنائية اللغة منتقاة يدويًا بحصص مثبتة بالجرام ووسوم أهداف غذائية، وذيل مرجعي إنجليزي مشتق من بيانات وزارة الزراعة الأمريكية (USDA) العامة — المرجع المفتوح المعياري للتركيب لكل 100 جرام.",
  },
  {
    q: "لماذا تعرض بعض صفحات الأطعمة العربية اسمًا إنجليزيًا؟",
    a: "صفوف الذيل غير المترجمة تُبقي اسمها الإنجليزي في الحقل العربي عمدًا، وقد استُبعدت مراياها العربية من الفهرسة بدل تزييف تسميات عربية آليًا. لا تُنشر أسماء عربية قابلة للفهرسة إلا المكتوبة يدويًا.",
  },
  {
    q: "هل القيم للنيّئ أم للمطبوخ؟",
    a: "كل مدخل يوثّق حالته تحت أعراف كل 100 جرام. الصنف نفسه يزن مختلفًا بين النيّئ والمطبوخ (فقدان الماء)، فطابق حالة الوزن مع المدخل — ودليل دقة الماكروز يغطي قواعد التحويل بأمثلة محلولة.",
  },
  {
    q: "هل يمكنني استخدام هذه الأرقام في مقالي أو تطبيقي أو ورقة تدريبي؟",
    a: "نعم، بصيغة الاستشهاد في قسم «كيف تستشهد» — استشهد بصفحة الصنف بعينها (أو صفحة القاعدة)، وأدرج تاريخ اطلاع، واربط الصفحة التي تستشهد بها. المحتوى والبيانات تُقدَّم تحت شروط الموقع.",
  },
  {
    q: "كم مرة تتغير القاعدة؟",
    a: "بيانات مرجعية مجمّدة بتحديثات دفعية مرقّمة — القيم لا تنحرف بصمت، وصفحات الأصناف تُخدم من كاش طويل العمر، وكل دفعة تسير في كوميت بالمستودع مع توثيقها.",
  },
];

/** Cross-links from the methodology page (the reference's own chain). */
export const FOODS_METHODOLOGY_CHAIN_LINKS: ReadonlyArray<{
  hrefEn: string;
  hrefAr: string;
  labelEn: string;
  labelAr: string;
}> = [
  {
    hrefEn: "/foods",
    hrefAr: "/ar/foods",
    labelEn: "Browse the food database",
    labelAr: "تصفّح قاعدة الأطعمة",
  },
  {
    hrefEn: "/guides/macro-tracking-accuracy",
    hrefAr: "/ar/guides/macro-tracking-accuracy",
    labelEn: "Macro tracking accuracy guide",
    labelAr: "دليل دقة تتبع الماكروز",
  },
  {
    hrefEn: "/meal-planner",
    hrefAr: "/ar/meal-planner",
    labelEn: "Meal planner (live gram-based arithmetic from per-100g rows)",
    labelAr: "مخطط الوجبات (حساب حيّ بالجرام من قيم كل 100 جرام)",
  },
  {
    hrefEn: "/macro-tracker",
    hrefAr: "/ar/macro-tracker",
    labelEn: "Macro tracker",
    labelAr: "متتبّع الماكروز",
  },
  {
    hrefEn: "/terms",
    hrefAr: "/ar/terms",
    labelEn: "Terms of use",
    labelAr: "شروط الاستخدام",
  },
];
