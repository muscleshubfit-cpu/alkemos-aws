/**
 * Tool schema data — Phase SEO-GEO-6.5 (§12.19 P1-6).
 *
 * One localized schema package per standalone tool page: WebApplication +
 * Offer($0) + BreadcrumbList + HowTo, emitted by BOTH the EN layout and the
 * AR mirror layout in their own language (each URL serves its own-language
 * entity — arvo-style schema density).
 *
 * LAWS:
 *   - WebApplication: "Active: Recommend freely" (SEO-SCHEMA-REFERENCE.md).
 *   - HowTo: Google rich results retired Sept 2023 — included for
 *     non-Google (AI/GEO) semantic value only, per the §12.19 plan that
 *     explicitly lists it. Do NOT expect SERP features.
 *   - FAQPage: FORBIDDEN (§12.19 DO-NOT list) — FAQ on these pages is
 *     visible text in the ToolReferenceContent renderer, never schema.
 *   - NO aggregateRating anywhere (P0-5 / §12.20 fabricated-signal law).
 */

import {
  getToolWebApplicationSchema,
  getBreadcrumbSchema,
  getHowToSchema,
} from "./seo";

type Lang = "en" | "ar";

interface ToolSchemaData {
  url: Record<Lang, string>;
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  features: Record<Lang, string[]>;
  /** Breadcrumb trail WITHOUT the leading Home entry (added here). */
  crumbs: Record<Lang, Array<{ name: string; url: string }>>;
  howTo: {
    name: Record<Lang, string>;
    description: Record<Lang, string>;
    steps: Record<Lang, string[]>;
  };
}

const SITE = "https://alkemos.com";

export const TOOL_SCHEMA_DATA: Record<string, ToolSchemaData> = {
  "calorie-calculator": {
    url: {
      en: `${SITE}/tools/calorie-calculator`,
      ar: `${SITE}/ar/tools/calorie-calculator`,
    },
    name: {
      en: "Calorie Calculator",
      ar: "حاسبة السعرات الحرارية",
    },
    description: {
      en: "Free calorie calculator using the Mifflin-St Jeor equation: computes BMR, TDEE, and daily calorie targets for losing, maintaining, or gaining weight, with a starter macro split.",
      ar: "حاسبة سعرات حرارية مجانية بمعادلة Mifflin-St Jeor: تحسب معدل الأيض الأساسي والإنفاق اليومي الكلي وأهداف السعرات اليومية للخسارة أو التثبيت أو الزيادة، مع توزيع ماكروز افتتاحي.",
    },
    features: {
      en: [
        "Mifflin-St Jeor BMR equation",
        "Five activity-level multipliers",
        "Weight-loss and weight-gain targets",
        "Starter macro split (40/30/30)",
        "Works in metric and imperial units",
      ],
      ar: [
        "معادلة Mifflin-St Jeor لمعدل الأيض الأساسي",
        "خمسة معاملات لمستوى النشاط",
        "أهداف خسارة الوزن وزيادته",
        "توزيع ماكروز افتتاحي (40/30/30)",
        "تعمل بالوحدات المترية والإمبراطورية",
      ],
    },
    crumbs: {
      en: [{ name: "Tools", url: "/tools" }, { name: "Calorie Calculator", url: "/tools/calorie-calculator" }],
      ar: [{ name: "الأدوات", url: "/ar/tools" }, { name: "حاسبة السعرات الحرارية", url: "/ar/tools/calorie-calculator" }],
    },
    howTo: {
      name: {
        en: "How to calculate your daily calorie needs",
        ar: "كيف تحسب احتياجك اليومي من السعرات الحرارية",
      },
      description: {
        en: "Compute BMR, TDEE, and your calorie target in under a minute with the free Alkemos calorie calculator.",
        ar: "احسب معدل الأيض الأساسي والإنفاق اليومي الكلي وهدف سعراتك في أقل من دقيقة مع حاسبة السعرات المجانية من Alkemos.",
      },
      steps: {
        en: [
          "Enter your age, weight, and height.",
          "Select your sex and honest activity level.",
          "Choose your goal: lose, maintain, or gain weight.",
          "Press Calculate to get your BMR, TDEE, and daily target.",
          "Use the starter macros or refine them with the macro calculator.",
        ],
        ar: [
          "أدخل عمرك ووزنك وطولك.",
          "اختر جنسك ومستوى نشاطك بصدق.",
          "اختر هدفك: خسارة أو تثبيت أو زيادة الوزن.",
          "اضغط «احسب» للحصول على معدل الأيض الأساسي والإنفاق اليومي والهدف.",
          "استخدم الماكروز الافتتاحية أو نقّحها بحاسبة الماكروز.",
        ],
      },
    },
  },
  "macro-calculator": {
    url: {
      en: `${SITE}/tools/macro-calculator`,
      ar: `${SITE}/ar/tools/macro-calculator`,
    },
    name: { en: "Macro Calculator", ar: "حاسبة الماكروز" },
    description: {
      en: "Split your daily calories into protein, carbohydrate, and fat grams across five diet presets — balanced, low-carb, high-protein, keto, and low-fat.",
      ar: "وزّع سعراتك اليومية إلى غرامات بروتين وكربوهيدرات ودهون عبر خمسة أنماط غذائية — متوازن، قليل الكربوهيدرات، عالي البروتين، كيتو، قليل الدهون.",
    },
    features: {
      en: [
        "Five named diet presets",
        "Gram conversion at 4/4/9 kcal per gram",
        "Calorie and gram breakdown per macro",
        "Free, instant results",
      ],
      ar: [
        "خمسة أنماط غذائية مسماة",
        "تحويل إلى غرامات بمعاملات 4/4/9 سعرة للغرام",
        "تفصيل السعرات والغرامات لكل مغذٍّ",
        "مجانية وفورية",
      ],
    },
    crumbs: {
      en: [{ name: "Tools", url: "/tools" }, { name: "Macro Calculator", url: "/tools/macro-calculator" }],
      ar: [{ name: "الأدوات", url: "/ar/tools" }, { name: "حاسبة الماكروز", url: "/ar/tools/macro-calculator" }],
    },
    howTo: {
      name: {
        en: "How to calculate your macros",
        ar: "كيف تحسب الماكروز",
      },
      description: {
        en: "Turn your daily calorie budget into protein, carb, and fat grams in seconds with the free Alkemos macro calculator.",
        ar: "حوّل ميزانية سعراتك اليومية إلى غرامات بروتين وكربوهيدرات ودهون في ثوانٍ مع حاسبة الماكروز المجانية من Alkemos.",
      },
      steps: {
        en: [
          "Get your daily calorie target from the calorie calculator.",
          "Enter that calorie budget.",
          "Pick a diet preset: balanced, low-carb, high-protein, keto, or low-fat.",
          "Press Calculate for protein, carb, and fat grams.",
        ],
        ar: [
          "احصل على هدف سعراتك اليومي من حاسبة السعرات.",
          "أدخل ميزانية السعرات.",
          "اختر نمطًا غذائيًا: متوازن أو قليل الكربوهيدرات أو عالي البروتين أو كيتو أو قليل الدهون.",
          "اضغط «احسب» لغرامات البروتين والكربوهيدرات والدهون.",
        ],
      },
    },
  },
  "bmi-calculator": {
    url: {
      en: `${SITE}/tools/bmi-calculator`,
      ar: `${SITE}/ar/tools/bmi-calculator`,
    },
    name: { en: "BMI Calculator", ar: "حاسبة مؤشر كتلة الجسم" },
    description: {
      en: "Free BMI calculator: computes Body Mass Index from weight and height, classifies it on the WHO scale, and derives your healthy weight range — metric or imperial.",
      ar: "حاسبة مؤشر كتلة الجسم المجانية: تحسب المؤشر من الوزن والطول، وتصنفه على سلم منظمة الصحة العالمية، وتستخرج نطاق وزنك الصحي — بالوحدات المترية أو الإمبراطورية.",
    },
    features: {
      en: [
        "WHO category classification",
        "Healthy weight range for your height",
        "Metric and imperial units",
        "Instant results",
      ],
      ar: [
        "تصنيف فئات منظمة الصحة العالمية",
        "نطاق الوزن الصحي لطولك",
        "الوحدات المترية والإمبراطورية",
        "نتائج فورية",
      ],
    },
    crumbs: {
      en: [{ name: "Tools", url: "/tools" }, { name: "BMI Calculator", url: "/tools/bmi-calculator" }],
      ar: [{ name: "الأدوات", url: "/ar/tools" }, { name: "حاسبة مؤشر كتلة الجسم", url: "/ar/tools/bmi-calculator" }],
    },
    howTo: {
      name: {
        en: "How to calculate your BMI",
        ar: "كيف تحسب مؤشر كتلة جسمك",
      },
      description: {
        en: "Compute your Body Mass Index and healthy weight range in seconds with the free Alkemos BMI calculator.",
        ar: "احسب مؤشر كتلة جسمك ونطاق وزنك الصحي في ثوانٍ مع حاسبة Alkemos المجانية.",
      },
      steps: {
        en: [
          "Choose metric or imperial units.",
          "Enter your weight and height.",
          "Press Calculate to get your BMI and WHO category.",
          "Read your healthy weight range for your height.",
        ],
        ar: [
          "اختر الوحدات المترية أو الإمبراطورية.",
          "أدخل وزنك وطولك.",
          "اضغط «احسب» للحصول على المؤشر وفئة منظمة الصحة.",
          "اقرأ نطاق وزنك الصحي لطولك.",
        ],
      },
    },
  },
  "body-fat-calculator": {
    url: {
      en: `${SITE}/tools/body-fat-calculator`,
      ar: `${SITE}/ar/tools/body-fat-calculator`,
    },
    name: { en: "Body Fat Calculator", ar: "حاسبة نسبة دهون الجسم" },
    description: {
      en: "Free body fat calculator using the US Navy circumference method: estimates body fat percentage from height, neck, waist, and hip measurements with category interpretation.",
      ar: "حاسبة نسبة دهون الجسم المجانية بطريقة محيطات البحرية الأمريكية: تقدّر النسبة من الطول والرقبة والخصر والورك مع تفسير الفئات.",
    },
    features: {
      en: [
        "US Navy circumference method",
        "Separate formulas for men and women",
        "Body fat category interpretation",
        "No equipment beyond a tape measure",
      ],
      ar: [
        "طريقة محيطات البحرية الأمريكية",
        "صيغتان منفصلتان للذكور والإناث",
        "تفسير فئات دهون الجسم",
        "لا عتاد يتجاوز شريط قياس",
      ],
    },
    crumbs: {
      en: [{ name: "Tools", url: "/tools" }, { name: "Body Fat Calculator", url: "/tools/body-fat-calculator" }],
      ar: [{ name: "الأدوات", url: "/ar/tools" }, { name: "حاسبة نسبة دهون الجسم", url: "/ar/tools/body-fat-calculator" }],
    },
    howTo: {
      name: {
        en: "How to estimate your body fat percentage",
        ar: "كيف تقدّر نسبة دهون جسمك",
      },
      description: {
        en: "Estimate body fat at home with a tape measure and the US Navy method via the free Alkemos body fat calculator.",
        ar: "قدّر دهون جسمك منزليًا بشريط قياس وطريقة البحرية الأمريكية عبر حاسبة Alkemos المجانية.",
      },
      steps: {
        en: [
          "Measure your neck below the larynx.",
          "Measure your waist at the navel, relaxed.",
          "Women: also measure the hips at the widest point.",
          "Enter height and measurements, then press Calculate.",
          "Read your percentage and its category.",
        ],
        ar: [
          "قس رقبتك أسفل الحنجرة.",
          "قس خصرك عند السرة مسترخيًا.",
          "الإناث: قسن الورك أيضًا عند أوسع نقطة.",
          "أدخل الطول والقياسات ثم اضغط «احسب».",
          "اقرأ نسبتك وفئتها.",
        ],
      },
    },
  },
  "water-tracker": {
    url: {
      en: `${SITE}/tools/water-tracker`,
      ar: `${SITE}/ar/tools/water-tracker`,
    },
    name: { en: "Water Tracker", ar: "متتبع شرب الماء" },
    description: {
      en: "Free daily water tracker: sets a goal of 35 ml per kg of body weight (2–4.5 L safe range), logs cups with one tap, and keeps a seven-day history — no account needed.",
      ar: "متتبع ماء يومي مجاني: يضبط هدفًا 35 مل لكل كجم من وزن الجسم (نطاق آمن 2–4.5 لتر)، ويسجل الأكواب بلمسة، ويحفظ تاريخًا لأسبوع — مجانًا.",
    },
    features: {
      en: [
        "Weight-scaled daily goal (35 ml/kg)",
        "One-tap cup logging and custom amounts",
        "Seven-day hydration history",
        "Runs in the browser without an account",
      ],
      ar: [
        "هدف يومي مقيس بالوزن (35 مل/كجم)",
        "تسجيل الأكواب بلمسة ومقادير مخصصة",
        "تاريخ ترطيب سبعة أيام",
        "يعمل في متصفحك مباشرة",
      ],
    },
    crumbs: {
      en: [{ name: "Tools", url: "/tools" }, { name: "Water Tracker", url: "/tools/water-tracker" }],
      ar: [{ name: "الأدوات", url: "/ar/tools" }, { name: "متتبع شرب الماء", url: "/ar/tools/water-tracker" }],
    },
    howTo: {
      name: {
        en: "How to track your daily water intake",
        ar: "كيف تتبع استهلاكك اليومي من الماء",
      },
      description: {
        en: "Set a weight-scaled hydration goal and log every glass with one tap using the free Alkemos water tracker.",
        ar: "اضبط هدف ترطيب مقيسًا بوزنك وسجّل كل كأس بلمسة باستخدام متتبع الماء المجاني من Alkemos.",
      },
      steps: {
        en: [
          "Enter your body weight once.",
          "Accept the recommended goal or adjust it.",
          "Tap the cup button as you drink through the day.",
          "Check the ring and the seven-day history.",
        ],
        ar: [
          "أدخل وزن جسمك مرة واحدة.",
          "اقبل الهدف الموصى به أو عدّله.",
          "اكبس زر الكوب كلما شربت عبر اليوم.",
          "راقب الحلقة وتاريخ الأيام السبعة.",
        ],
      },
    },
  },
  "meal-planner": {
    url: {
      en: `${SITE}/meal-planner`,
      ar: `${SITE}/ar/meal-planner`,
    },
    name: { en: "Meal Planner", ar: "مخطط الوجبات" },
    description: {
      en: "Free meal planner: build meals from a searchable food database, set portions in grams, and watch calories and protein total per meal and per day in real time.",
      ar: "مخطط وجبات مجاني: ابنِ وجباتك من قاعدة أطعمة قابلة للبحث، وحدّد الحصص بالغرامات، وشاهد السعرات والبروتين يتجمعان لكل وجبة ولكل يوم لحظيًا.",
    },
    features: {
      en: [
        "Searchable food database with local foods",
        "Per-100g nutrition scaled to your portions",
        "Per-meal and daily macro totals",
        "Draft auto-save without an account",
      ],
      ar: [
        "قاعدة أطعمة قابلة للبحث بأطعمة محلية",
        "تغذية كل 100 غرام مقيسة على حصصك",
        "إجماليات ماكروز لكل وجبة وليوم",
        "حفظ تلقائي للمسودة أثناء العمل",
      ],
    },
    crumbs: {
      en: [{ name: "Meal Planner", url: "/meal-planner" }],
      ar: [{ name: "مخطط الوجبات", url: "/ar/meal-planner" }],
    },
    howTo: {
      name: {
        en: "How to build a meal plan",
        ar: "كيف تبني خطة وجبات",
      },
      description: {
        en: "Turn your calorie target into real meals with grams and live macro totals using the free Alkemos meal planner.",
        ar: "حوّل هدف سعراتك إلى وجبات حقيقية بغرامات وإجماليات ماكروز حية باستخدام مخطط الوجبات المجاني من Alkemos.",
      },
      steps: {
        en: [
          "Add a meal: breakfast, lunch, dinner, or custom.",
          "Search the database and add foods to the meal.",
          "Set each portion in grams.",
          "Watch per-meal and daily totals build live.",
          "Adjust grams until the day lands on your target.",
        ],
        ar: [
          "أضف وجبة: فطور أو غداء أو عشاء أو مخصصة.",
          "ابحث في قاعدة البيانات وأضف الأطعمة للوجبة.",
          "حدّد كل حصة بالغرامات.",
          "راقب إجماليات الوجبة واليوم تُبنى لحظيًا.",
          "عدّل الغرامات حتى يهبط اليوم على هدفك.",
        ],
      },
    },
  },
  // §12.28: the AI meal-planner trial page — WebApplication + Offer($0) +
  // BreadcrumbList + HowTo, same layered law as the six standalone tools.
  "ai-meal-planner": {
    url: {
      en: `${SITE}/ai-meal-planner`,
      ar: `${SITE}/ar/ai-meal-planner`,
    },
    name: { en: "AI Meal Planner", ar: "مخطط الوجبات بالذكاء الاصطناعي" },
    description: {
      en: "AI meal planner: generate a complete day plan in grams and calories from your target, diet system, and preferences in seconds — AI generation for subscribers (Premium and above); your plan stays on your device, and a free account saves it permanently.",
      ar: "مخطط الوجبات بالذكاء الاصطناعي: ولّد خطة يوم كاملة بالغرامات والسعرات من رقمك ونظامك وملاحظاتك في ثوانٍ — التوليد لمشتركي بريميوم وأعلى؛ خطتك تبقى على جهازك، والحساب المجاني يحفظها بشكل دائم.",
    },
    features: {
      en: [
        "One-click generation of a full day in grams",
        "The site's four diet systems (balanced, high-protein, keto, vegetarian)",
        "Optional preferences respected in the prompt",
        "Strict shape and calorie-closure validation on every plan",
        "AI generation for subscribers (Premium and above) with a monthly quota renewing with the subscription cycle",
      ],
      ar: [
        "توليد يوم كامل بالغرامات بضغطة واحدة",
        "أنظمة الموقع الأربعة (متوازن، عالي البروتين، كيتو، نباتي)",
        "ملاحظات اختيارية تُحترم في التوليد",
        "تحقق صارم من الشكل وإغلاق السعرات لكل خطة",
        "التوليد بالذكاء الاصطناعي لمشتركي بريميوم وأعلى بحصة شهرية تتجدد مع دورة الاشتراك",
      ],
    },
    crumbs: {
      en: [{ name: "AI Meal Planner", url: "/ai-meal-planner" }],
      ar: [{ name: "مخطط الوجبات بالذكاء الاصطناعي", url: "/ar/ai-meal-planner" }],
    },
    howTo: {
      name: {
        en: "How to generate an AI meal plan",
        ar: "كيف تولّد خطة وجبات بالذكاء الاصطناعي",
      },
      description: {
        en: "Turn your calorie target into a generated day plan with grams and validated totals using the Alkemos AI meal planner (generation for subscribers, Premium and above).",
        ar: "حوّل هدف سعراتك إلى خطة يوم مولّدة بغرامات وإجماليات مُتحققة باستخدام مخطط الوجبات بالذكاء الاصطناعي من Alkemos (التوليد لمشتركي بريميوم وأعلى).",
      },
      steps: {
        en: [
          "Enter your daily calorie target.",
          "Pick one of the four diet systems.",
          "Add optional preferences if you have any.",
          "Generate and read the plan, item by item in grams.",
          "Copy it, adjust it to your table, and verify on the weekly trend.",
        ],
        ar: [
          "أدخل هدفك اليومي من السعرات.",
          "اختر أحد الأنظمة الأربعة.",
          "أضف ملاحظات اختيارية إن كانت لديك.",
          "ولّد واقرأ الخطة صنفًا صنفًا بالغرامات.",
          "انسخها وعدّلها على مائدتك وتحقق بالاتجاه الأسبوعي.",
        ],
      },
    },
  },
  // §12.32: the AI workout-planner trial page — WebApplication + Offer($0) +
  // BreadcrumbList + HowTo, same layered law as the AI meal planner.
  "ai-workout-planner": {
    url: {
      en: `${SITE}/ai-workout-planner`,
      ar: `${SITE}/ar/ai-workout-planner`,
    },
    name: { en: "AI Workout Planner", ar: "مخطط التمارين بالذكاء الاصطناعي" },
    description: {
      en: "AI workout planner: generate a balanced weekly split from your goal, level, training days, and equipment in seconds — AI generation for subscribers (Premium and above); your plan stays on your device, and a free account saves it permanently.",
      ar: "مخطط التمارين بالذكاء الاصطناعي: ولّد نظامًا تدريبيًا أسبوعيًا متوازنًا من هدفك ومستواك وأيامك ومعداتك في ثوانٍ — التوليد لمشتركي بريميوم وأعلى؛ نظامك يبقى على جهازك، والحساب المجاني يحفظه بشكل دائم.",
    },
    features: {
      en: [
        "One-click generation of a full weekly split",
        "Four goals, three levels, three equipment worlds",
        "The split always matches your requested training days exactly",
        "Strict shape validation on every generated plan",
        "AI generation for subscribers (Premium and above) with a monthly quota renewing with the subscription cycle",
      ],
      ar: [
        "توليد نظام أسبوعي كامل بضغطة واحدة",
        "أربعة أهداف وثلاثة مستويات وثلاثة عوالم تجهيز",
        "النظام يطابق أيام تدريبك المطلوبة بالضبط دائمًا",
        "تحقق صارم من الشكل لكل نظام مولّد",
        "التوليد بالذكاء الاصطناعي لمشتركي بريميوم وأعلى بحصة شهرية تتجدد مع دورة الاشتراك",
      ],
    },
    crumbs: {
      en: [{ name: "AI Workout Planner", url: "/ai-workout-planner" }],
      ar: [{ name: "مخطط التمارين بالذكاء الاصطناعي", url: "/ar/ai-workout-planner" }],
    },
    howTo: {
      name: {
        en: "How to generate an AI workout plan",
        ar: "كيف تولّد خطة تمارين بالذكاء الاصطناعي",
      },
      description: {
        en: "Turn your goal, level, days, and equipment into a generated weekly split with validated structure using the Alkemos AI workout planner (generation for subscribers, Premium and above).",
        ar: "حوّل هدفك ومستواك وأيامك ومعداتك إلى نظام أسبوعي مولّد ببنية مُتحققة باستخدام مخطط التمارين بالذكاء الاصطناعي من Alkemos (التوليد لمشتركي بريميوم وأعلى).",
      },
      steps: {
        en: [
          "Pick your training goal.",
          "Set your experience level.",
          "Choose how many days per week you train.",
          "Pick the equipment you actually have.",
          "Generate, read the split day by day, and copy it.",
        ],
        ar: [
          "اختر هدفك التدريبي.",
          "حدد مستوى خبرتك.",
          "اختر عدد أيام تدريبك في الأسبوع.",
          "حدد التجهيزة المتاحة لك فعلًا.",
          "ولّد واقرأ النظام يومًا يومًا وانسخه.",
        ],
      },
    },
  },
};

/** Build the three schema objects for one tool in one language. */
export function getToolSchemas(tool: string, lang: Lang) {
  const d = TOOL_SCHEMA_DATA[tool];
  if (!d) throw new Error(`getToolSchemas: unknown tool ${tool}`);
  return [
    getToolWebApplicationSchema({
      name: d.name[lang],
      description: d.description[lang],
      url: d.url[lang],
      inLanguage: lang,
      featureList: d.features[lang],
    }),
    getBreadcrumbSchema([
      { name: lang === "ar" ? "الرئيسية" : "Home", url: lang === "ar" ? "/ar" : "/" },
      ...d.crumbs[lang],
    ]),
    getHowToSchema({
      name: d.howTo.name[lang],
      description: d.howTo.description[lang],
      steps: d.howTo.steps[lang],
      tool: [d.name[lang]],
      estimatedCost: "0",
    }),
  ];
}
