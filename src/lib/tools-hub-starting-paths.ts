/**
 * TOOLS-HUB-STARTING-PATHS — the «Where do you start?» lane data.
 *
 * ORGANIC-GROWTH-P0-B (owner order 2026-11-19 — roadmap 10/P0-B +
 * 07-§2 matrix rows 3-4): the hub's three starting-lane guidance
 * sentences told visitors which tools to use in plain TEXT with no links
 * — the intent routing was invisible to crawlers and cost every hub
 * visitor a navigation step (the audit's «dead commercial node» #2).
 *
 * The fix models each sentence as ordered segments so the hub renders
 * the EXACT same sentence («نص المسار الحالي نفسه» — 07-§2) with every
 * named tool wrapped as a real crawlable <Link> (language-aware: the AR
 * tree renders `/ar`-prefixed hrefs — the SEO-GEO-4 mirror law). The
 * canary `src/lib/__tests__/tools-hub-starting-paths.test.ts`
 * re-concatenates the segments and asserts the byte-identical original
 * sentences, so any text drift fails CI.
 *
 * Lane → tool mapping (07-§2: T1→T3→T4→T5 in the lane's logical order —
 * each lane links exactly the tools its sentence names):
 *   Fat loss:          T1 calorie → T3 macro → T4 body-fat → T5 water
 *   Muscle:            T3 macro → T1 calorie → AI workout → programs
 *   General health:    T2 bmi → T4 body-fat → T5 water
 *
 * Same client-safe pattern as tools-shared.ts: pure data, zero side
 * effects, safe for client import. Arabic anchors keep the attached
 * prepositions (بحاسبة/بالماكروز) so the sentence stays byte-identical.
 */

export type PathSegment = {
  /** Literal sentence fragment — joined back byte-identically. */
  text: string;
  /** Internal destination href (EN-tree form); the AR tree prefixes /ar. */
  href?: string;
};

export type StartingLane = {
  goalAr: string;
  goalEn: string;
  segAr: PathSegment[];
  segEn: PathSegment[];
};

export const STARTING_LANES: StartingLane[] = [
  {
    goalAr: "هدفك خسارة الدهون",
    goalEn: "Your goal is fat loss",
    segAr: [
      { text: "ابدأ " },
      { text: "بحاسبة السعرات", href: "/tools/calorie-calculator" },
      { text: " لتعرف رقمك اليومي، ثم وزّعه " },
      { text: "بالماكروز", href: "/tools/macro-calculator" },
      { text: "، وتابع التقدم " },
      { text: "بحاسبة الدهون", href: "/tools/body-fat-calculator" },
      { text: " و" },
      { text: "متتبع الماء", href: "/tools/water-tracker" },
      { text: "." },
    ],
    segEn: [
      { text: "Start with the " },
      { text: "Calorie Calculator", href: "/tools/calorie-calculator" },
      { text: " for your daily number, split it with the " },
      { text: "Macro Calculator", href: "/tools/macro-calculator" },
      { text: ", and follow progress with the " },
      { text: "Body Fat Calculator", href: "/tools/body-fat-calculator" },
      { text: " and the " },
      { text: "Water Tracker", href: "/tools/water-tracker" },
      { text: "." },
    ],
  },
  {
    goalAr: "هدفك بناء العضل",
    goalEn: "Your goal is building muscle",
    segAr: [
      { text: "ابدأ " },
      { text: "بالماكروز", href: "/tools/macro-calculator" },
      { text: " (بروتينك أولًا) بجانب " },
      { text: "حاسبة السعرات", href: "/tools/calorie-calculator" },
      { text: "، وولّد تقسيمتك من " },
      { text: "مخطط التمارين بالذكاء الاصطناعي", href: "/ai-workout-planner" },
      { text: " أو من " },
      { text: "برامج التدريب الجاهزة", href: "/programs" },
      { text: "." },
    ],
    segEn: [
      { text: "Start with the " },
      { text: "Macro Calculator", href: "/tools/macro-calculator" },
      { text: " (your protein first) alongside the " },
      { text: "Calorie Calculator", href: "/tools/calorie-calculator" },
      { text: ", and generate your split from the " },
      { text: "AI Workout Planner", href: "/ai-workout-planner" },
      { text: " or the " },
      { text: "ready programs", href: "/programs" },
      { text: "." },
    ],
  },
  {
    goalAr: "هدفك الصحة العامة",
    goalEn: "You're starting with general health",
    segAr: [
      { text: "قياس سريع في دقائق: " },
      { text: "مؤشر الكتلة", href: "/tools/bmi-calculator" },
      { text: "، ثم " },
      { text: "نسبة الدهون", href: "/tools/body-fat-calculator" },
      { text: "، ثم " },
      { text: "عادة الماء اليومية", href: "/tools/water-tracker" },
      { text: " — ثلاث أدوات ترسم لك صورة واضحة منذ اليوم الأول." },
    ],
    segEn: [
      { text: "A quick three-minute reading: the " },
      { text: "BMI Calculator", href: "/tools/bmi-calculator" },
      { text: ", then " },
      { text: "Body Fat", href: "/tools/body-fat-calculator" },
      { text: ", then the " },
      { text: "daily water habit", href: "/tools/water-tracker" },
      { text: " — three tools that give you a clear picture on day one." },
    ],
  },
];

/** Derived crawlable lane-link count (the roadmap bar: ≥8 per language). */
export const STARTING_LANE_LINK_COUNTS = {
  ar: STARTING_LANES.reduce((n, l) => n + l.segAr.filter((s) => s.href).length, 0),
  en: STARTING_LANES.reduce((n, l) => n + l.segEn.filter((s) => s.href).length, 0),
};
