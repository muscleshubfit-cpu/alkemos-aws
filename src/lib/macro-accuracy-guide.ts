/**
 * src/lib/macro-accuracy-guide.ts — the P1-8 content chain's pillar guide.
 *
 * PROVENANCE (Phase 318 — owner order 2026-10-01 «ابدأ تنفيذ البند التالى»):
 * the approved SEO audit report's P1 list, item 8: «سلسلة محتوى «دقة تتبع
 * الماكروز» وسلعنة قاعدة الأطعمة كمرجع موثق يستحق الروابط» (internal ·
 * medium long-term impact · medium effort). This module is the single
 * content source for /guides/macro-tracking-accuracy (EN) and its
 * /ar/guides/macro-tracking-accuracy mirror — the chain hub that links the
 * guide → the food database → the methodology reference → the tools.
 *
 * CONTENT LAWS honored here (blog-editorial-law equivalents for static
 * surfaces):
 *   - ANSWER-FIRST: section 1 answers the searcher's question directly.
 *   - HONESTY: every Alkemos claim maps to a shipped surface — planning-
 *     level tracking (no intake diary, no barcode scanner) is stated
 *     plainly, mirroring the macro-tracker landing's capability inventory.
 *   - NUMBERS: the only inventory figure cited in copy is FOODS_COUNT
 *     (imported from foods-shared, the single source — never a hardcoded
 *     literal). Accuracy ranges are stated as honest engineering
 *     ballparks, never as lab claims.
 *   - MSA (175/176 discipline, applied voluntarily to this surface):
 *     Arabic copy is Modern Standard; Latin appears only inside
 *     parenthetical glosses or brand names (USDA, Cronometer).
 *
 * Client-safe: pure data, no server imports.
 */

import { FOODS_COUNT } from "./foods-shared";

export const MACRO_ACCURACY_GUIDE_SLUG = "macro-tracking-accuracy";
export const MACRO_ACCURACY_GUIDE_PATH = `/guides/${MACRO_ACCURACY_GUIDE_SLUG}`;
export const MACRO_ACCURACY_GUIDE_PATH_AR = `/ar/guides/${MACRO_ACCURACY_GUIDE_SLUG}`;

/** Stable publication stamp for the guide (Article schema dates). */
export const MACRO_ACCURACY_GUIDE_PUBLISHED = "2026-10-01";

export const MACRO_ACCURACY_GUIDE_META = {
  // SEO title ceiling (comprehensive audit 2026-11-04): 80 → 71 chars —
  // brand suffix dropped (blog-article convention) to fit the site's
  // measured ≤75 healthy range. AR twin was already ≤65 (unchanged).
  titleEn: "Macro Tracking Accuracy — Why Apps Disagree and How to Track Precisely",
  descriptionEn:
    // SEO-P2-10 (2026-10-01, SEO audit item 10): 180 → 145 chars — the
    // ≤160 SERP-truncation law now holds (raw-vs-cooked + weekly audit kept).
    "Why the same food shows different macros in every app, how raw vs cooked weights bend your totals, and a weekly audit that keeps tracking honest.",
  titleAr: "دقة تتبع الماكروز — لماذا تختلف الأرقام بين التطبيقات وكيف تضبطها",
  descriptionAr:
    "لماذا يعرض كل تطبيق ماكروز مختلفة لنفس الصنف؟ وكيف تُحني أوزان النيّئ والمطبوخ وتقديرات الحصص مجاميعك اليومية؟ مع طريقة تدقيق أسبوعية تحفظ صدق التتبع.",
  h1En: "Macro Tracking Accuracy — Why the Numbers Differ and How to Make Them Trustworthy",
  h1Ar: "دقة تتبع الماكروز — لماذا تختلف الأرقام وكيف تجعلها موثوقة",
  introEn:
    "You weighed your food, logged it honestly, and still the daily total moves when you switch apps. This guide explains where every gram of that difference comes from — reference databases, raw versus cooked states, serving estimates, label rounding — and gives you the weekly audit loop that keeps tracking accurate even when the underlying numbers are only approximations.",
  introAr:
    "وزنت طعامك وسجّلته بصدق، ومع ذلك يتغير المجموع اليومي بمجرد تبديل التطبيق. يشرح هذا الدليل من أين يأتي كل جرام من هذا الاختلاف — قواعد البيانات المرجعية، وحالات النيّئ مقابل المطبوخ، وتقديرات الحصص، وتقريب الملصقات — ويعطيك حلقة التدقيق الأسبوعية التي تحفظ دقة التتبع حتى حين تكون الأرقام الأساسية تقريبية.",
} as const;

export type GuideSection = {
  id: string;
  headingEn: string;
  headingAr: string;
  paragraphsEn: readonly string[];
  paragraphsAr: readonly string[];
};

export const MACRO_ACCURACY_GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: "short-answer",
    headingEn: "The short answer",
    headingAr: "الإجابة المختصرة",
    paragraphsEn: [
      `Tracked carefully, macro counting lands within roughly 10–20% of true intake for calories and a few grams per day for protein. That is not a flaw in you or in your app — it is the honest ceiling of a system built on averaged references, estimated portions, and rounded labels. Two people can log the same chicken breast and end up 15g of protein apart, and both be doing it right.`,
      `The goal of accurate tracking is therefore not a perfect number. It is a consistent, repeatable measurement you can steer by: the same scale, the same entries, the same weighing state. A bias that stays stable can be corrected from your weekly weight trend; a bias that jumps around cannot. Everything in this guide optimizes for lowering variance first and chasing precision second — because variance is what breaks decisions.`,
    ],
    paragraphsAr: [
      `عند التتبع الدقيق، يستقر عدّ الماكروز عادة داخل نطاق 10–20% من الاستهلاك الحقيقي للسعرات، وبضع جرامات يوميًا للبروتين. هذه ليست عيبًا فيك ولا في تطبيقك — بل السقف الصادق لنظام مبني على مراجع متوسطة وحصص مقدّرة وملصقات مُقرَّبة. شخصان يسجّلان صدر الدجاج نفسه قد يفترقان بـ15 جرام بروتين، وكلاهما محق في طريقته.`,
      `لذلك فإن هدف التتبع الدقيق ليس رقمًا مثاليًا، بل قياس ثابت قابل للتكرار يمكنك القيادة به: نفس الميزان، ونفس المدخلات، ونفس حالة الوزن. الانحياز الثابت يمكن تصحيحه من اتجاه وزنك الأسبوعي، أما الانحياز المتقلب فلا. كل ما في هذا الدليل يعظّم خفض التباين أولًا ومطاردة الدقة المطلقة ثانيًا — لأن التباين هو ما يكسر القرارات.`,
    ],
  },
  {
    id: "database-variance",
    headingEn: "Why the same food shows different macros in every app",
    headingAr: "لماذا يعرض كل تطبيق ماكروز مختلفة لنفس الصنف",
    paragraphsEn: [
      `No app measures your chicken. Every app looks up a reference value, and references legitimately disagree: government laboratory databases average many samples, national food tables differ between countries, brand labels reflect one manufacturer's recipe, and community-entered entries inherit typos that nobody corrected for a decade. Each is a correct answer to a slightly different question.`,
      `That is why chicken breast appears at 165 kcal per 100g in one database and 172 in another — skinless versus with skin, raw-average versus cooked sample sets. The Alkemos food database standardizes all ${FOODS_COUNT.toLocaleString("en-US")} foods per 100g and documents its own conventions, sources, and limits on a dedicated methodology page — which is exactly the question you should put to any nutrition database you trust with your targets.`,
      `If you compare platforms, the Alkemos versus Cronometer comparison covers how a dedicated nutrition tracker handles data sourcing, verification, and diary workflow — a useful reference point before committing to either approach.`,
    ],
    paragraphsAr: [
      `لا يوجد تطبيق يقيس دجاجك أنت. كل تطبيق يبحث عن قيمة مرجعية، والمراجع تختلف بشكل مشروع: قواعد البيانات الحكومية المختبرية تتوسط عينات كثيرة، والجداول الغذائية الوطنية تختلف من بلد لبلد، وملصقات العلامات التجارية تعكس وصفة مصنع واحد، والمدخلات التي يضيفها المستخدمون ترث أخطاءً كتابية لم يصححها أحد لسنوات. كل مرجع إجابة صحيحة عن سؤال مختلف قليلًا.`,
      `لهذا يظهر صدر الدجاج بـ165 سعرة لكل 100 جرام في قاعدة بيانات وبـ172 في أخرى — بلا جلد مقابل مع الجلد، ومتوسطات النيّئ مقابل عينات المطبوخ. قاعدة أطعمة Alkemos توحّد ${FOODS_COUNT.toLocaleString("en-US")} صنفًا على مقياس كل 100 جرام، وتوثّق أعرافها ومصادرها وحدودها في صفحة منهجية مخصصة — وهذا بالضبط السؤال الذي يجب أن تطرحه على أي قاعدة بيانات غذائية تعتمد عليها في أهدافك.`,
      `إن كنت تقارن بين المنصات، فمقارنة Alkemos مع كرونوميتر (Cronometer) تغطي كيف يتعامل متتبع غذائي متخصص مع مصادر البيانات والتحقق وسير اليوميات — نقطة مرجعية مفيدة قبل الاستقرار على أي من النهجين.`,
    ],
  },
  {
    id: "raw-vs-cooked",
    headingEn: "Raw vs cooked: the biggest single source of error",
    headingAr: "النيّئ مقابل المطبوخ: أكبر مصدر منفرد للخطأ",
    paragraphsEn: [
      `Cooking changes weight, not nutrition. Water evaporates and fat renders, so 100g of cooked chicken started life as roughly 130–150g raw — the protein did not grow by a third, the portion shrank. Rice and pasta can double or triple in weight from absorbed water alone. Log a cooked weight against a raw entry and you silently inflate your protein; do the reverse and you quietly under-eat.`,
      `The rule that removes the error: pick one state and match it to the entry. Weigh raw and log raw, or weigh cooked and log cooked. Per-100g entries make the arithmetic trivial — the Alkemos database states its convention openly and takes any gram figure you enter, so the database and your scale can never disagree about which state you weighed.`,
    ],
    paragraphsAr: [
      `الطبخ يغيّر الوزن لا القيمة الغذائية. الماء يتبخر والدهون تذوب، فكل 100 جرام من الدجاج المطبوخ كانت في الأصل نحو 130–150 جرامًا نيئة — البروتين لم ينمُ بالثلث، بل انكمشت الكتلة. الأرز والمكرونة قد يتضاعف وزنها أو يتثالث بماء الامتصاص وحده. تسجيل وزن مطبوخ مقابل مدخل نيّئ يضخّم بروتينك بصمت، والعكس يجعلك تأكل أقل مما تظن بهدوء.`,
      `القاعدة التي تلغي هذا الخطأ: اختر حالة واحدة وطابقها مع المدخل. زن نيئًا وسجّل نيئًا، أو زن مطبوخًا وسجّل مطبوخًا. المدخلات المبنية على كل 100 جرام تجعل الحساب بسيطًا — قاعدة أطعمة Alkemos تعلن أعرافها صراحة وتقبل أي رقم بالجرام تدخله، فلا يمكن لقاعدة البيانات وميزانك أن يختلفا حول الحالة التي وزنتها.`,
    ],
  },
  {
    id: "serving-estimation",
    headingEn: "Serving sizes: what “one medium breast” really costs you",
    headingAr: "أحجام الحصص: ما تكلفك فعلًا «حبة متوسطة واحدة»",
    paragraphsEn: [
      `Household serving descriptions hide enormous ranges. A “medium” chicken breast spans about 120g to 250g between butchers and countries; a scoop of protein powder varies with how settled the tub is; a tablespoon of peanut butter depends on how generous the wrist feels that day. Eyeballed portions routinely land 20–40% away from the true weight — an error no database can absorb.`,
      `A kitchen scale that resolves to the gram is the cheapest accuracy upgrade in the whole system. You do not need to weigh forever, either: two weeks of weighing calibrates your eye for the foods you actually eat. Alkemos entries carry smart default servings with real gram equivalents — “1 medium breast ≈ 150g” — so even a quick estimate has an honest anchor instead of a guess.`,
    ],
    paragraphsAr: [
      `أوصاف الحصص المنزلية تخفي مدايات هائلة. «الحبة المتوسطة» من صدر الدجاج تمتد تقريبًا من 120 إلى 250 جرامًا بين جزّار وبلد؛ مغرفة مسحوق البروتين تختلف حسب انضغاط العبوة؛ وملعقة زبدة الفول السوداني تعتمد على سخاء اليد في ذلك اليوم. الحصص المقدّرة بالعين تسقط عادة على بعد 20–40% من الوزن الحقيقي — خطأ لا تستطيع أي قاعدة بيانات امتصاصه.`,
      `ميزان مطبخ يقرأ بالجرام هو أرخص ترقية للدقة في النظام كله. ولست مضطرًا للوزن للأبد: أسبوعان من الوزن يعايران عينك على الأصناف التي تأكلها فعلًا. مدخلات Alkemos تحمل حصصًا افتراضية ذكية بمكافئات حقيقية بالجرام — «حبة متوسطة واحدة ≈ 150 جم» — فحتى التقدير السريع يجد مرساة صادقة بدل التخمين.`,
    ],
  },
  {
    id: "labels-rounding",
    headingEn: "Labels, rounding, and legal margins",
    headingAr: "الملصقات والتقريب وهوامش السماح النظامية",
    paragraphsEn: [
      `Packaged food carries a legal margin of tolerance: regulators accept declared values within a reasonable deviation of true content, and rounding happens at the label level (per serving) while databases round per 100g. Individually these are rounding errors; stacked across a five-meal day they can drift your total by a hundred-odd calories before any real counting mistake happens.`,
      `For packaged goods, log the label rather than the database — the label is the manufacturer's actual recipe. For whole foods, log the database entry and stay with the same entry every time. The error you cannot eliminate, you can at least keep constant — and that constancy is precisely the property the weekly audit in the next section depends on.`,
    ],
    paragraphsAr: [
      `الغذاء المعلب يحمل هامش سماح نظاميًا: الجهات الرقابية تقبل القيم المعلنة داخل انحراف معقول عن المحتوى الحقيقي، والتقريب يقع على مستوى الملصق (لكل حصة) بينما تقريب قواعد البيانات على مستوى كل 100 جرام. كل واحد منها وحده خطأ تقريب صغير، لكنها تتراكم عبر يوم من خمس وجبات فتنحرف بمجموعك مئة سعرة تقريبًا قبل أي خطأ عدّ حقيقي.`,
      `للمنتجات المعلبة سجّل الملصق لا قاعدة البيانات — الملصق هو وصفة المصنّع الفعلية. وللأطعمة الكاملة سجّل مدخل قاعدة البيانات والتزم بالمدخل نفسه كل مرة. الخطأ الذي لا يمكنك إلغاؤه تستطيع على الأقل إبقاءه ثابتًا — وهذا الثبات هو بالضبط الخاصية التي تعتمد عليها حلقة التدقيق الأسبوعية في القسم التالي.`,
    ],
  },
  {
    id: "audit-method",
    headingEn: "The weekly audit: closing the loop with your own data",
    headingAr: "التدقيق الأسبوعي: إغلاق الحلقة ببياناتك أنت",
    paragraphsEn: [
      `Here is the method that makes database error survivable. Your bathroom scale does not read nutrition labels — it reads outcomes. Weigh yourself under the same conditions three to four mornings a week and read the weekly average. If you logged a 500 kcal daily deficit for two full weeks and the weekly average is flat, your true intake is at maintenance — whatever the app said. The error has been measured, not guessed.`,
      `Then correct with a real number: a flat scale against a logged 500 kcal deficit means you are eating about 500 more than you log, or burning 500 less than planned. Apply that correction to your targets instead of re-litigating every food entry, and re-audit every two weeks. This loop is why consistency beats precision — a stable bias gets corrected once and stays corrected.`,
      `Alkemos builds the loop in: weekly check-ins capture weight, five body measurements, energy, and plan adherence on a 1–10 scale, with progress photos and an interactive weight chart — the outcome evidence that sits next to the planned macros in the same free account.`,
    ],
    paragraphsAr: [
      `هذه هي الطريقة التي تجعل خطأ قواعد البيانات قابلًا للنجاة. ميزان الحمام لا يقرأ الملصقات الغذائية — بل يقرأ النتائج. زن نفسك بالظروف نفسها ثلاث إلى أربع صباحات أسبوعيًا واقرأ متوسط الأسبوع. إن سجّلت عجزًا يوميًا قدره 500 سعرة لأسبوعين كاملين وظل المتوسط الأسبوعي ثابتًا، فاستهلاكك الحقيقي عند حد التوازن — مهما قال التطبيق. الخطأ قيس ولم يُخمَّن.`,
      `ثم صحّح برقم حقيقي: ثبات الميزان مقابل عجز مسجّل بـ500 سعرة يعني أنك تأكل نحو 500 أكثر مما تسجّل، أو تحرق 500 أقل مما خططت. طبّق هذا التصحيح على أهدافك بدل إعادة محاكمة كل مدخل غذائي، وأعد التدقيق كل أسبوعين. هذه الحلقة هي سبب تفوق الثبات على الدقة — الانحياز الثابت يصحَّح مرة واحدة ويبقى مصححًا.`,
      `Alkemos تبني هذه الحلقة داخليًا: التسجيلات الأسبوعية تلتقط الوزن وخمسة قياسات للجسم والطاقة والالتزام بالخطة على مقياس 1–10، مع صور تقدّم ومخطط وزن تفاعلي — دليل النتائج الذي يجلس بجانب الماكروز المخططة في الحساب المجاني نفسه.`,
    ],
  },
  {
    id: "alkemos-approach",
    headingEn: "How Alkemos keeps the numbers honest",
    headingAr: "كيف يحفظ Alkemos صدق الأرقام",
    paragraphsEn: [
      `Honest scope first: Alkemos is a macro planning platform, not an intake diary. There is no log-what-I-ate screen and no barcode scanner — that scope is stated plainly because pretending otherwise would be the least accurate thing on this page. The accuracy work happens upstream where it is cheapest: the macro calculator sets your targets from body stats, goal, and activity, and the meal planner totals every meal you build from the ${FOODS_COUNT.toLocaleString("en-US")}-food database live, per meal and per day, with no signup.`,
      `The food database itself is a documented reference: every entry standardized per 100g, a hand-curated bilingual core with gram-anchored default servings, and a public methodology page stating sources, conventions, known limits, and the citation format for coaches and writers. This guide links every claim to the surface that carries it — the standard a nutrition reference should meet before you trust it with your targets.`,
    ],
    paragraphsAr: [
      `نطاق صادق أولًا: Alkemos منصة تخطيط ماكروز لا يوميات استهلاك. لا توجد شاشة «سجّل ما أكلته اليوم» ولا ماسح باركود — وهذا النطاق معلن بوضوح لأن ادعاء غير ذلك سيكون أقل شيء دقة في هذه الصفحة. عمل الدقة يقع في المنبع حيث هو الأرخص: حاسبة الماكروز تضبط أهدافك من بيانات جسمك وهدفك ونشاطك، ومخطط الوجبات يجمع كل وجبة تبنيها من قاعدة ${FOODS_COUNT.toLocaleString("en-US")} صنف غذائي لحظيًا، لكل وجبة ولكل يوم، بلا تسجيل.`,
      `وقاعدة الأطعمة نفسها مرجع موثق: كل مدخل موحّد على كل 100 جرام، ونواة ثنائية اللغة منتقاة يدويًا بحصص افتراضية مثبتة بالجرام، وصفحة منهجية عامة تعلن المصادر والأعراف والحدود المعروفة وصيغة الاستشهاد للمدربين والكتّاب. هذا الدليل يربط كل ادعاء بالسطح الذي يحمله — وهو المعيار الذي ينبغي لمرجع غذائي أن يبلغه قبل أن تثق به في أهدافك.`,
    ],
  },
];

export const MACRO_ACCURACY_GUIDE_FAQ_EN: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "How accurate is macro tracking overall?",
    a: "Done carefully — a kitchen scale, consistent entries, one weighing state — expect daily calorie totals within roughly 10–20% of true intake and protein within a few grams. The remaining gap comes from averaged reference values, label tolerances, and portion variance, not from your effort. Consistency shrinks the practical impact of that gap far more than any single precision trick.",
  },
  {
    q: "Why do different apps show different macros for the same food?",
    a: "Each app queries a different reference layer: government lab averages, national food tables, brand labels, or user-entered entries. A value like chicken breast legitimately ranges from about 165 to 172 kcal per 100g depending on the sample set (skinless vs with skin, raw vs cooked). Pick one database and stay with it so the variance stays constant.",
  },
  {
    q: "Should I weigh my food raw or cooked?",
    a: "Either — but match the entry's state. Cooking removes water and renders fat, so 100g cooked chicken corresponds to roughly 130–150g raw; logging a cooked weight against a raw entry inflates your protein by up to a third. Weigh raw and log raw, or weigh cooked and log cooked, and the error disappears.",
  },
  {
    q: "Are nutrition labels exact numbers?",
    a: "No. Regulators allow declared values a reasonable deviation from true content, and labels round per serving while databases round per 100g. For packaged foods log the label — it reflects that manufacturer's actual recipe; for whole foods log the same database entry every time so the error stays constant.",
  },
  {
    q: "How do I know if my tracking is off?",
    a: "Compare outcomes with inputs: weigh yourself three to four mornings a week and read the weekly average. A logged 500 kcal deficit with a flat weekly average over two full weeks means your true intake is around maintenance — so apply a real correction to your targets and re-audit every two weeks.",
  },
  {
    q: "Do I need to weigh everything forever?",
    a: "No. Two weeks of weighing calibrates your eye for the foods you actually eat, and gram-anchored default servings give quick estimates an honest reference point. Return to the scale whenever your weekly audit shows the trend drifting away from the logged numbers.",
  },
  {
    q: "Is Alkemos a daily food diary?",
    a: "No — Alkemos tracks macros at the planning level. The macro calculator sets daily targets, the meal planner totals every meal you build live from the food database, and weekly check-ins capture weight and measurements to verify the outcome. There is no eat-log screen and no barcode scanner, and the platform says so plainly.",
  },
  {
    q: "Where do Alkemos food values come from?",
    a: `Every one of the ${FOODS_COUNT.toLocaleString("en-US")} foods is standardized per 100g with calories, protein, carbs, and fat, built from a hand-curated bilingual core plus an English-language reference long tail. Sources, conventions, the Arabic layer, known limits, and the citation format are documented publicly on the food database methodology page.`,
  },
];

export const MACRO_ACCURACY_GUIDE_FAQ_AR: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "ما مدى دقة تتبع الماكروز إجمالًا؟",
    a: "عند التنفيذ الدقيق — ميزان مطبخ، ومدخلات ثابتة، وحالة وزن واحدة — توقع مجاميع يومية داخل نطاق 10–20% تقريبًا من الاستهلاك الحقيقي للسعرات، وبروتين داخل بضع جرامات. الفجوة الباقية مصدرها متوسطات مرجعية وهوامش ملصقات وتباين الحصص، لا اجتهادك. الثبات يقلّص الأثر العملي لهذه الفجوة أكثر بكثير من أي حيلة دقيقة منفردة.",
  },
  {
    q: "لماذا تعرض تطبيقات مختلفة ماكروز مختلفة لنفس الصنف؟",
    a: "كل تطبيق يستعلم طبقة مرجعية مختلفة: متوسطات مختبرية حكومية، أو جداول وطنية، أو ملصقات علامات، أو مدخلات أضافها مستخدمون. قيمة مثل صدر الدجاج تتراوح مشروعًا من نحو 165 إلى 172 سعرة لكل 100 جرام بحسب مجموعة العينات (بلا جلد أم معه، نيّئة أم مطبوخة). اختر قاعدة واحدة والتزم بها حتى يبقى التباين ثابتًا.",
  },
  {
    q: "هل أزن طعامي نيئًا أم مطبوخًا؟",
    a: "أيهما كان — لكن طابق حالة المدخل. الطبخ يزيل الماء ويذيب الدهن، فكل 100 جرام دجاج مطبوخ تقابل نحو 130–150 جرامًا نيئة؛ وتسجيل وزن مطبوخ مقابل مدخل نيّئ يضخّم بروتينك حتى الثلث. زن نيئًا وسجّل نيئًا، أو زن مطبوخًا وسجّل مطبوخًا، فيختفي الخطأ.",
  },
  {
    q: "هل أرقام الملصقات الغذائية دقيقة؟",
    a: "لا. الجهات الرقابية تسمح للقيم المعلنة بانحراف معقول عن المحتوى الحقيقي، والملصقات تقرّب لكل حصة بينما قواعد البيانات تقرّب لكل 100 جرام. للمعلبات سجّل الملصق — فهو وصفة المصنّع الفعلية؛ وللأطعمة الكلية سجّل مدخل قاعدة البيانات نفسه كل مرة حتى يبقى الخطأ ثابتًا.",
  },
  {
    q: "كيف أعرف أن تتبعي منحرف؟",
    a: "قارن النتائج بالمدخلات: زن نفسك ثلاث إلى أربع صباحات أسبوعيًا واقرأ متوسط الأسبوع. عجز مسجّل بـ500 سعرة مع متوسط أسبوعي ثابت لأسبوعين كاملين يعني أن استهلاكك الحقيقي عند حد التوازن — فطبّق تصحيحًا حقيقيًا على أهدافك وأعد التدقيق كل أسبوعين.",
  },
  {
    q: "هل يجب أن أزن كل شيء للأبد؟",
    a: "لا. أسبوعان من الوزن يعايران عينك على أطعمتك الفعلية، والحصص الافتراضية المثبتة بالجرام تمنح التقدير السريع مرجعًا صادقًا. عد إلى الميزان كلما أظهر التدقيق الأسبوعي انحراف الاتجاه عن الأرقام المسجلة.",
  },
  {
    q: "هل Alkemos يوميات طعام يومية؟",
    a: "لا — Alkemos يتتبع الماكروز على مستوى التخطيط. حاسبة الماكروز تضبط الأهداف اليومية، ومخطط الوجبات يجمع كل وجبة تبنيها لحظيًا من قاعدة الأطعمة، والتسجيلات الأسبوعية تلتقط الوزن والقياسات للتحقق من النتيجة. لا توجد شاشة تسجيل أكل ولا ماسح باركود، والمنصة تعلن ذلك بوضوح.",
  },
  {
    q: "من أين تأتي قيم الأطعمة في Alkemos؟",
    a: `كل صنف من أصناف ${FOODS_COUNT.toLocaleString("en-US")} موحّد على كل 100 جرام بالسعرات والبروتين والكربوهيدرات والدهون، مبنيًا من نواة ثنائية اللغة منتقاة يدويًا وذيل مرجعي إنجليزي طويل. المصادر والأعراف والطبقة العربية والحدود المعروفة وصيغة الاستشهاد موثقة علنًا في صفحة منهجية قاعدة الأطعمة.`,
  },
];

/** The chain map — surfaces this guide interlinks (the P1-8 "chain" wiring).
 * Rendered as the guide's closing cross-link section + asserted by
 * macro-accuracy-chain.test.ts. */
export const MACRO_ACCURACY_CHAIN_LINKS: ReadonlyArray<{
  hrefEn: string;
  hrefAr: string;
  labelEn: string;
  labelAr: string;
}> = [
  {
    hrefEn: "/foods/methodology",
    hrefAr: "/ar/foods/methodology",
    labelEn: "Food database methodology",
    labelAr: "منهجية قاعدة الأطعمة",
  },
  {
    hrefEn: "/foods",
    hrefAr: "/ar/foods",
    labelEn: "Food database",
    labelAr: "قاعدة الأطعمة",
  },
  {
    hrefEn: "/macro-tracker",
    hrefAr: "/ar/macro-tracker",
    labelEn: "Macro tracker",
    labelAr: "متتبّع الماكروز",
  },
  {
    hrefEn: "/tools/macro-calculator",
    hrefAr: "/ar/tools/macro-calculator",
    labelEn: "Macro calculator",
    labelAr: "حاسبة الماكروز",
  },
  {
    hrefEn: "/meal-planner",
    hrefAr: "/ar/meal-planner",
    labelEn: "Meal planner with live totals",
    labelAr: "مخطط الوجبات بمجاميع حيّة",
  },
  {
    hrefEn: "/compare/alkemos-vs-cronometer",
    hrefAr: "/ar/compare/alkemos-vs-cronometer",
    labelEn: "Alkemos vs Cronometer",
    labelAr: "مقارنة Alkemos وكرونوميتر",
  },
];
