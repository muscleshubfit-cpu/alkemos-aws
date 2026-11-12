/**
 * TOOLS-SHARED — the single source for the free-tools cluster.
 *
 * PHASE 195 (owner directive «Tools: الرقم الحقيقي الحالي، وهو 8، وليس 5» +
 * «اجعل أعداد المكتبات/المحتوى Dynamic من مصدر البيانات قدر الإمكان»):
 * the tools/libraries arrays lived inline in src/app/tools/page.tsx, so
 * every consumer that wanted the tools COUNT had to hardcode it (the
 * homepage under-counted the tools (5) while the hub actually serves 8).
 *
 * Now the hub data lives here and exports TOOLS_COUNT = tools.length —
 * the homepage derives its "8+ Tools" proof chip from the same array,
 * so the number grows automatically when a tool is added to the hub.
 * The pinned census lives in src/lib/__tests__/library-counts.test.ts
 * (TOOLS_COUNT === 8 as of Phase 195 — the test fails when the hub
 * changes so the owner-facing pins are updated consciously).
 *
 * Same client-safe pattern as exercises-shared.ts / foods-shared.ts:
 * pure data + derived counts, zero side effects, safe for client import.
 */

export type ToolEntry = {
  slug: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: string;
};

// §12.28: the AI meal-planner trial — free generation, no signup.
// §12.32: the AI workout-planner trial (owner directive «ضيف أداة جديده
// مخطط التمارين بالذكاء الاصطناعي»).
export const TOOLS: ToolEntry[] = [
  {
    slug: "calorie-calculator",
    nameAr: "حاسبة السعرات الحرارية",
    nameEn: "Calorie Calculator",
    descAr: "احسب احتياجك اليومي من السعرات والماكروز",
    descEn: "Calculate daily calories and macros",
    icon: "calories",
  },
  {
    slug: "bmi-calculator",
    nameAr: "حاسبة مؤشر كتلة الجسم",
    nameEn: "BMI Calculator",
    descAr: "اعرف إن كان وزنك ضمن المعدل الصحي",
    descEn: "Check if your weight is healthy",
    icon: "bmi",
  },
  {
    slug: "macro-calculator",
    nameAr: "حاسبة الماكروز",
    nameEn: "Macro Calculator",
    descAr: "وزّع سعراتك على بروتين وكربوهيدرات ودهون",
    descEn: "Split calories into protein, carbs, fat",
    icon: "macros",
  },
  {
    slug: "body-fat-calculator",
    nameAr: "حاسبة نسبة الدهون",
    nameEn: "Body Fat Calculator",
    descAr: "احسب نسبة الدهون في جسمك",
    descEn: "Calculate your body fat percentage",
    icon: "bodyfat",
  },
  {
    slug: "water-tracker",
    nameAr: "متتبع شرب الماء",
    nameEn: "Water Tracker",
    descAr: "حدّد هدفك وسجّل أكوابك يوميًا",
    descEn: "Set your goal and log your cups daily",
    icon: "hydration",
  },
  {
    slug: "/meal-planner",
    nameAr: "مخطط الوجبات",
    nameEn: "Meal Planner",
    descAr: "ابنِ وجباتك من 8,162+ صنفًا غذائيًا وتابع الماكروز",
    descEn: "Build meals from 8,162+ foods and track macros",
    icon: "mealplanner",
  },
  {
    slug: "/ai-meal-planner",
    nameAr: "مخطط الوجبات بالذكاء الاصطناعي",
    nameEn: "AI Meal Planner",
    descAr: "ولّد خطة يوم كاملة بالغرامات في ثوانٍ",
    descEn: "Generate a full day plan in seconds",
    icon: "evo",
  },
  {
    slug: "/ai-workout-planner",
    nameAr: "مخطط التمارين بالذكاء الاصطناعي",
    nameEn: "AI Workout Planner",
    descAr: "ولّد نظامًا تدريبيًا أسبوعيًا في ثوانٍ",
    descEn: "Generate a weekly split in seconds",
    icon: "dumbbell",
  },
];

/** Dynamic tools count — derives from the hub array above (Phase 195). */
export const TOOLS_COUNT = TOOLS.length;

// The content libraries cluster — its own labeled section on the hub
// (DELIVERY 0050 cross-links + §12.33 move of the ready-made diet plans).
export const TOOL_LIBRARIES: ToolEntry[] = [
  {
    slug: "/exercises",
    nameAr: "مكتبة التمارين",
    nameEn: "Exercise Library",
    descAr: "868+ تمرينًا بالصور والشرح والمستويات",
    descEn: "868+ exercises with images and guides",
    icon: "dumbbell",
  },
  {
    slug: "/foods",
    nameAr: "مكتبة الأطعمة",
    nameEn: "Food Library",
    descAr: "8,162+ صنفًا غذائيًا بالسعرات والماكروز",
    descEn: "8,162+ foods with calories and macros",
    icon: "protein",
  },
  // §12.33: moved from the tools grid into the libraries, renamed per the
  // owner's directive (was «خطط غذائية جاهزة / Diet Plan Library» as a tool).
  {
    slug: "/diet-plan",
    nameAr: "مكتبة الخطط الغذائية الجاهزة",
    nameEn: "Diet Plan Library",
    descAr: "24 خطة يوم جاهزة بالغرامات (6 مستويات × 4 أنظمة)",
    descEn: "24 ready-made daily plans in grams",
    icon: "fruits",
  },
];
