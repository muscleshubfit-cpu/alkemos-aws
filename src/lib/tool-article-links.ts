/**
 * src/lib/tool-article-links.ts — TOOL ↔ ARTICLE CONTEXTUAL LINKING
 * (Report 15 §5-B1, owner execution order 2026-11-12 «ابدأ التنفيذ للخطة»).
 *
 * WHAT THIS CLOSES: the ONE measured linking gap of the family — the tool
 * pages carried ZERO contextual /blog/* links (live evidence 2026-11-12:
 * /tools/calorie-calculator = 36 internal links, none /blog/*). This module
 * is the single source for BOTH directions:
 *
 *   tool → article : the 8 standalone tool pages render a "how to use your
 *                    result" guide strip via <ToolArticleLinks/> (component
 *                    src/components/ToolArticleLinks.tsx).
 *   article → tool : the blog article pages render a "try the calculator"
 *                    strip via toolLinksForArticle() (the retro-pair
 *                    precedent — a fixed, reviewed pairing, not a regex).
 *
 * LAW COMPLIANCE (all binding, all checked by canaries in
 * src/lib/__tests__/tool-article-links.test.ts):
 *   - «تحسين الموجود فقط» (owner order 2026-11-06): every pair points at
 *     an ALREADY-PUBLISHED article (both language slugs verified against
 *     the live sitemap-blog.xml on 2026-11-12 — 143 URLs) and an EXISTING
 *     tool route. Zero new pages. Fixtures fail on any drift.
 *   - tools-shared.ts pattern: pure data + derived counts + lookups, zero
 *     side effects, client-safe (no server-only import).
 *   - MSA law (tool surface, src/lib/tool-msa.ts): the Arabic anchors and
 *     blurbs carry zero bare Latin — brand-free, acronym-free copy.
 *   - AR pages link AR mirrors: the /ar tool pages and /ar/blog articles
 *     receive locale-native hrefs (access-point law, blog-tool-links
 *     precedent urlAr — Arabic readers never land on EN-rendering pages).
 *
 * WHY SLUG PAIRS AND NOT ONE SLUG: the bilingual pairing pipeline gives
 * each language its OWN SEO slug (pair_id twins — "calculate-daily-calories-
 * fuel-fat-loss-bulking" EN vs "calculate-daily-calories-weight-loss" AR),
 * so a pair must store BOTH slugs. This extends the Report-15 sketch
 * ({toolSlug, articleSlug, anchorEn, anchorAr}) with articleSlugEn/Ar —
 * documented here as the honest shape of the real data.
 *
 * SELECTION (no quantitative expansion — the 11-06 order): pairs were
 * picked from the ~70 published titles per language by TOPICAL MATCH to
 * each tool's result interpretation, favoring articles the GSC 3-month
 * export already shows demand for (e.g. the calorie family — the top
 * Arabic query cluster ~700 impressions/3mo — gets the three
 * calculate-your-calories guides).
 */

export type ToolArticlePair = {
  /** tools-shared.ts slug space: relative ("calorie-calculator") or the
   *  absolute standalone routes ("/meal-planner", "/ai-meal-planner",
   *  "/ai-workout-planner"). */
  toolSlug: string;
  /** Published EN article slug (no /blog/ prefix). */
  articleSlugEn: string;
  /** Published AR article slug (no /ar/blog/ prefix) — the pair twin. */
  articleSlugAr: string;
  /** Link text on the TOOL page (EN) — a natural published-title phrase. */
  anchorEn: string;
  /** Link text on the TOOL page (AR) — pure MSA, zero bare Latin. */
  anchorAr: string;
  /** One-line context under the anchor (EN). */
  blurbEn: string;
  /** One-line context under the anchor (AR). */
  blurbAr: string;
};

export const TOOL_ARTICLE_PAIRS: ToolArticlePair[] = [
  // ——————— calorie-calculator (the top Arabic query cluster) ———————
  {
    toolSlug: "calorie-calculator",
    articleSlugEn: "calculate-daily-calories-fuel-fat-loss-bulking",
    articleSlugAr: "calculate-daily-calories-weight-loss",
    anchorEn: "How many calories should I eat to lose weight?",
    anchorAr: "كم سعرة أحتاج يوميًا لخسارة الوزن؟",
    blurbEn:
      "The honest walkthrough: the right equation, the right activity factor, and a deficit that keeps muscle.",
    blurbAr:
      "الطريقة الصادقة: المعادلة الأدق ومعامل النشاط الصحيح وعجز يحافظ على العضلات.",
  },
  {
    toolSlug: "calorie-calculator",
    articleSlugEn: "calculate-maintenance-calories-muscle-gain",
    articleSlugAr: "calculate-daily-calories-muscle-gain-beginners-guide",
    anchorEn: "How to calculate maintenance calories for muscle gain",
    anchorAr: "حساب السعرات اليومية لزيادة الكتلة العضلية للمبتدئين",
    blurbEn:
      "Turn your maintenance number into a lean-bulk surplus without the guesswork.",
    blurbAr:
      "حوّل رقم التثبيت إلى فائض تضخيم نظيف بلا تخمين.",
  },
  {
    toolSlug: "calorie-calculator",
    articleSlugEn: "calorie-cycling-fat-loss-diet",
    articleSlugAr: "calorie-cycling-fat-loss-guide",
    anchorEn: "Calorie-cycling fat loss diet plan",
    anchorAr: "تدوير السعرات الحرارية: خطة خسارة الدهون",
    blurbEn:
      "Rotate your daily target across the week — higher on training days, lower on rest days.",
    blurbAr:
      "وزّع هدفك اليومي على الأسبوع: أعلى في أيام التدريب وأقل في أيام الراحة.",
  },

  // ——————— bmi-calculator ———————
  {
    toolSlug: "bmi-calculator",
    articleSlugEn: "how-many-calories-to-gain-muscle-and-lose-fat",
    articleSlugAr: "calculate-daily-calories-weight-loss-muscle-gain",
    anchorEn: "How many calories to gain muscle and lose fat?",
    anchorAr: "حساب سعراتك لخسارة الوزن أو التضخيم",
    blurbEn:
      "Reading your BMI against what your weight is made of — the recomposition answer.",
    blurbAr:
      "اقرأ مؤشرك على ضوء مكوّنات وزنك — إجابة إعادة التشكيل.",
  },
  {
    toolSlug: "bmi-calculator",
    articleSlugEn: "lose-belly-fat-without-losing-muscle-cardio-plan",
    articleSlugAr: "common-fat-burning-mistakes",
    anchorEn: "Lose belly fat without losing muscle — 4-week plan",
    anchorAr: "الأخطاء الشائعة التي تمنع حرق الدهون",
    blurbEn:
      "When the number reads above range: a cardio plan that keeps the muscle you already built.",
    blurbAr:
      "عندما يكون المؤشر فوق المدى: خطة تنقص الدهون وتحافظ على عضلاتك، وأشهر الأخطاء التي تعطّل النتيجة.",
  },

  // ——————— macro-calculator ———————
  {
    toolSlug: "macro-calculator",
    articleSlugEn: "protein-per-day-muscle-build-plan",
    articleSlugAr: "how-to-calc-daily-protein-athletes",
    anchorEn: "How much protein per day to build muscle?",
    anchorAr: "كيف تحسب احتياجك اليومي من البروتين بدقة",
    blurbEn:
      "The evidence-based grams-per-kg range and how to distribute it across meals.",
    blurbAr:
      "نطاق الجرامات لكل كيلوجرام المدعوم بالأدلة وكيفية توزيعه على الوجبات.",
  },
  {
    toolSlug: "macro-calculator",
    articleSlugEn: "track-macros-no-food-scale",
    articleSlugAr: "track-macros-without-scale-guide",
    anchorEn: "How to track macros without a food scale",
    anchorAr: "تتبع الماكروز بدون ميزان طعام",
    blurbEn:
      "Visual estimation that keeps your split honest — palm, fist, thumb portions.",
    blurbAr:
      "التقدير البصري الذي يحفظ عدلك صادقًا — الكف والقبضة والإبهام.",
  },
  {
    toolSlug: "macro-calculator",
    articleSlugEn: "how-to-periodize-nutrition-body-recomposition",
    articleSlugAr: "nutrition-periodization-body-recomposition-guide",
    anchorEn: "Periodize nutrition for recomposition",
    anchorAr: "تدوير التغذية لإعادة تشكيل الجسم",
    blurbEn:
      "Match your macro targets to training blocks — cutting, maintenance, building.",
    blurbAr:
      "طابق أهداف الماكرو مع كتل التدريب — تنشيف وتثبيت وبناء.",
  },

  // ——————— body-fat-calculator ———————
  {
    toolSlug: "body-fat-calculator",
    articleSlugEn: "science-backed-belly-fat-loss-8-weeks",
    articleSlugAr: "belly-fat-loss-8-weeks-guide",
    anchorEn: "Science-backed strategies to lose belly fat in 8 weeks",
    anchorAr: "حرق دهون البطن في 8 أسابيع",
    blurbEn:
      "What a measured fat-loss rate looks like week by week — and what your percentage should do.",
    blurbAr:
      "كيف تبدو وتيرة فقد الدهون المقيسة أسبوعًا بأسبوع وماذا يحدث لنسبتك.",
  },
  {
    toolSlug: "body-fat-calculator",
    articleSlugEn: "does-creatine-make-you-gain-weight-water-retention-vs-muscle",
    articleSlugAr: "creatine-water-retention-scientific-analysis-beginners-guide",
    anchorEn: "Creatine weight gain: water retention vs muscle",
    anchorAr: "احتباس الماء أم عضلات؟ دليل الكرياتين",
    blurbEn:
      "Scale weight moved but your body-fat estimate didn't? Here's what actually shifted.",
    blurbAr:
      "تحرّك وزن الميزان ولم تتغير نسبة دهونك؟ هذا ما حدث فعلًا.",
  },

  // ——————— water-tracker ———————
  {
    toolSlug: "water-tracker",
    articleSlugEn: "smart-water-bottle-hydration-tracking-during-workouts",
    articleSlugAr: "water-intake-athlete-guide",
    anchorEn: "Hydration tracking during workouts",
    anchorAr: "كم كمية الماء التي يحتاجها الرياضي يوميًا؟",
    blurbEn:
      "How much you actually sweat per training hour — and how to replace it.",
    blurbAr:
      "كم تفقد فعلًا من السوائل في ساعة التدريب وكيف تعوّضها.",
  },
  {
    toolSlug: "water-tracker",
    articleSlugEn: "sauna-muscle-recovery-hormone-optimization",
    articleSlugAr: "sauna-muscle-recovery-guide",
    anchorEn: "Sauna for muscle recovery",
    anchorAr: "الساونا لاستشفاء العضلات",
    blurbEn:
      "Heat sessions raise your fluid needs — time them and drink for them.",
    blurbAr:
      "جلسات الحرارة ترفع احتياجك من السوائل — نوّقها واشرب لأجلها.",
  },

  // ——————— /meal-planner ———————
  {
    toolSlug: "/meal-planner",
    articleSlugEn: "macro-tracking-meal-prep-1800-fat-loss",
    articleSlugAr: "fat-burning-macro-diet-plan",
    anchorEn: "Macro-tracking meal prep for fat loss",
    anchorAr: "إعداد نظام غذائي لحرق الدهون مع حساب الماكرو",
    blurbEn:
      "A full week of meals built around a fixed macro split — the 1800-calorie template.",
    blurbAr:
      "أسبوع كامل من الوجبات مبني على عدّ ثابت للماكرو — قالب السعرات المحدد.",
  },
  {
    toolSlug: "/meal-planner",
    articleSlugEn: "post-workout-recovery-meal-plan-7-recipes",
    articleSlugAr: "post-workout-recovery-meal-plan-guide",
    anchorEn: "Post-workout recovery meal plan: 7 recipes",
    anchorAr: "خطة وجبات الاستشفاء بعد التمرين",
    blurbEn:
      "What to plan around the training window — 7 easy recipes for muscle repair.",
    blurbAr:
      "ماذا تخطط حول نافذة التدريب — سبع وصفات سهلة لإصلاح العضلة.",
  },

  // ——————— /ai-meal-planner ———————
  {
    toolSlug: "/ai-meal-planner",
    articleSlugEn: "quick-healthy-meal-ideas-busy-people",
    articleSlugAr: "healthy-high-protein-meals-office",
    anchorEn: "Quick healthy meal ideas for busy people",
    anchorAr: "أفكار وجبات صحية سريعة عالية البروتين",
    blurbEn:
      "The ideas the planner turns into a full day — fast, high-protein, no cooking marathon.",
    blurbAr:
      "الأفكار التي يحوّلها المخطط إلى يوم كامل — سريعة وعالية البروتين بلا مطباخ طويل.",
  },
  {
    toolSlug: "/ai-meal-planner",
    articleSlugEn: "progressive-overload-home-food-plan",
    articleSlugAr: "design-diet-fat-loss-egyptian-lifestyle",
    anchorEn: "Home training food plan",
    anchorAr: "تصميم نظام غذائي يناسب نمط حياتك",
    blurbEn:
      "Eating around home sessions — and designing a diet your real schedule keeps.",
    blurbAr:
      "التغذية حول جلسات المنزل — وتصميم نظام يستمر مع جدولك الحقيقي.",
  },

  // ——————— /ai-workout-planner ———————
  {
    toolSlug: "/ai-workout-planner",
    articleSlugEn: "12-week-progressive-overload-intermediate",
    articleSlugAr: "12-week-progressive-overload-intermediate-guide",
    anchorEn: "12-week progressive overload program",
    anchorAr: "برنامج الحمل التدريجي 12 أسبوعًا للمتوسطين",
    blurbEn:
      "The intermediate template the generator's splits are built from — day by day.",
    blurbAr:
      "القالب الذي تُبنى عليه انقسامات المولد للمتوسطين — يومًا بيوم.",
  },
  {
    toolSlug: "/ai-workout-planner",
    articleSlugEn: "4-day-split-hypertrophy-fat-loss",
    articleSlugAr: "4-day-split-muscle-fat-loss-guide",
    anchorEn: "4-day split for muscle building and fat loss",
    anchorAr: "التقسيم الرباعي: بناء العضلات وحرق الدهون معًا",
    blurbEn:
      "Two ready 4-day templates — the classic hypertrophy/fat-loss compromise.",
    blurbAr:
      "قالبان جاهزان بأربعة أيام — الحل الوسط بين التضخيم والتنشيف.",
  },
  {
    toolSlug: "/ai-workout-planner",
    articleSlugEn: "4-week-beginner-muscle-building-plan",
    articleSlugAr: "4-week-beginner-muscle-building-plan-guide",
    anchorEn: "Beginner muscle building: 4-week plan",
    anchorAr: "خطة بناء العضلات للمبتدئين: أربعة أسابيع",
    blurbEn:
      "Never trained before? The day-by-day on-ramp before any generated split.",
    blurbAr:
      "لم تتدرب من قبل؟ المسار اليومي الذي يسبق أي انقسام مولَّد.",
  },
];

/** Derived count (library-counts pinning pattern — asserted by canary). */
export const TOOL_ARTICLE_PAIRS_COUNT = TOOL_ARTICLE_PAIRS.length;

/** The 8 tool slugs the pairs may reference (tools-shared.ts slug space). */
export const PAIRED_TOOL_SLUGS: readonly string[] = [
  "calorie-calculator",
  "bmi-calculator",
  "macro-calculator",
  "body-fat-calculator",
  "water-tracker",
  "/meal-planner",
  "/ai-meal-planner",
  "/ai-workout-planner",
];

/** Locale-native href for a tool slug (access-point law — AR mirrors). */
export function toolHref(toolSlug: string, lang: "en" | "ar"): string {
  if (toolSlug.startsWith("/")) return lang === "ar" ? `/ar${toolSlug}` : toolSlug;
  return lang === "ar" ? `/ar/tools/${toolSlug}` : `/tools/${toolSlug}`;
}

/** Tool-name lookup for the reverse (article-side) strip. */
const TOOL_NAMES: Record<string, { en: string; ar: string }> = {
  "calorie-calculator": { en: "Calorie Calculator", ar: "حاسبة السعرات الحرارية" },
  "bmi-calculator": { en: "BMI Calculator", ar: "حاسبة مؤشر كتلة الجسم" },
  "macro-calculator": { en: "Macro Calculator", ar: "حاسبة الماكروز" },
  "body-fat-calculator": { en: "Body Fat Calculator", ar: "حاسبة نسبة الدهون" },
  "water-tracker": { en: "Water Tracker", ar: "متتبع شرب الماء" },
  "/meal-planner": { en: "Meal Planner", ar: "مخطط الوجبات" },
  "/ai-meal-planner": { en: "AI Meal Planner", ar: "مخطط الوجبات بالذكاء الاصطناعي" },
  "/ai-workout-planner": { en: "AI Workout Planner", ar: "مخطط التمارين بالذكاء الاصطناعي" },
};

/** All pairs for one tool page (stable order = declaration order). */
export function articleLinksForTool(toolSlug: string): ToolArticlePair[] {
  return TOOL_ARTICLE_PAIRS.filter((p) => p.toolSlug === toolSlug);
}

/**
 * Reverse leg: the "try the calculator" entries for ONE article page.
 * @param slug the article slug in `lang` (EN slug for "en", AR for "ar").
 */
export function toolLinksForArticle(
  slug: string,
  lang: "en" | "ar",
): { toolSlug: string; href: string; name: string; blurb: string }[] {
  return TOOL_ARTICLE_PAIRS.filter(
    (p) => (lang === "ar" ? p.articleSlugAr : p.articleSlugEn) === slug,
  ).map((p) => ({
    toolSlug: p.toolSlug,
    href: toolHref(p.toolSlug, lang),
    name: TOOL_NAMES[p.toolSlug][lang],
    blurb: lang === "ar" ? p.blurbAr : p.blurbEn,
  }));
}
