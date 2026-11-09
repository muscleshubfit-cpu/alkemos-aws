/**
 * src/lib/intent-map.ts — SEARCH INTENT MAP (owner SEO/GEO audit item:
 * «Query Cluster → Primary Intent → Canonical Alkemos Page → Supporting
 * Pages», 2026-09-14).
 *
 * WHAT THIS IS: the single, in-repo registry of the site's PRIMARY
 * search intents. Every product surface (library hub, tool, program
 * library, EVO, coaching, memberships) owns EXACTLY ONE canonical page
 * per intent, and the map names that page. It exists to guarantee the
 * audit's law: «لا تسمح لأكثر من صفحة أساسية باستهداف نفس intent» —
 * no two primary pages chase the same intent, and no NEW blog article
 * may compete with an existing primary page (the blog topic gate in
 * blog-topics.ts consults this map before every auto-pick).
 *
 * WHAT THIS IS NOT: it does NOT replace hreflang pairing (scripts/
 * retro-pair-blog.pairs.json), the duplicate-topic detector, or the
 * blog category system. It covers PRIMARY product intents only; the
 * blog's long-tail article intents (e.g. «4-week beginner home plan»)
 * are deliberately NOT entries here — qualified long-tails belong to
 * the article corpus, the HEAD queries belong to the canonical pages.
 *
 * DATA LAWS (pinned by intent-map.test.ts):
 *   1. canonical values are unique across entries.
 *   2. Every canonical is a REAL site route (compile the path from the
 *      route tree — no invented URLs).
 *   3. kind !== "blog" entries carry at least one head query in BOTH
 *      languages (EN + AR) — the non-branded, product-direct queries
 *      the audit prioritizes.
 *   4. The blog gate consumes ONLY non-blog kinds (findBlogIntentCollision).
 *
 * Client-safe: pure data + pure functions, no server imports.
 */

export type IntentKind =
  | "library" // browsable content libraries (exercises / foods)
  | "hub" // filtered hubs (muscles / equipment / collections)
  | "tool" // calculators + planners (indexable WebApplication pages)
  | "program" // ready program surfaces
  | "evo" // the AI coach page
  | "coaching" // personal coaching
  | "membership" // pricing / tiers
  | "compare" // comparison pages
  | "guide" // pillar guide pages (Phase 318 — P1-8 accuracy chain)
  | "blog" // editorial surfaces (never a blog-gate collision source)
  | "brand"; // brand/home queries (documented, excluded from the gate)

export type SearchIntentEntry = {
  /** Stable cluster id — referenced in docs/SEO-GEO-MASTER-PLAN.md §12.49 */
  cluster: string;
  labelEn: string;
  labelAr: string;
  /** Primary intent, stated as the searcher's goal (one sentence). */
  primaryIntent: string;
  /** The ONE canonical page that owns this intent (site path). */
  canonical: string;
  /** Pages that support the canonical (internal-linking network). */
  supporting: string[];
  kind: IntentKind;
  /** Head queries that DEFINE the intent (non-branded, product-direct). */
  queries: string[];
};

export const SEARCH_INTENT_MAP: SearchIntentEntry[] = [
  // ── Brand ──────────────────────────────────────────────────────
  {
    cluster: "brand-home",
    labelEn: "Alkemos brand & homepage",
    labelAr: "علامة Alkemos والصفحة الرئيسية",
    primaryIntent: "Find and evaluate the Alkemos platform itself.",
    canonical: "/",
    supporting: ["/about", "/faq", "/memberships"],
    kind: "brand",
    queries: ["alkemos", "alkemos fitness", "الكموس", "الموقع الرسمي alkemos"],
  },

  // ── Training libraries & hubs ─────────────────────────────────
  {
    cluster: "exercise-library",
    labelEn: "Exercise library",
    labelAr: "مكتبة التمارين",
    primaryIntent: "Browse proper form and instructions for exercises.",
    canonical: "/exercises",
    supporting: ["/muscles/chest", "/muscles/back", "/equipment/dumbbell", "/programs"],
    kind: "library",
    queries: [
      "exercise library",
      "exercises with instructions",
      "exercise database",
      "مكتبة التمارين",
      "تمارين بالصور والشرح",
    ],
  },
  {
    cluster: "muscle-hub",
    labelEn: "Muscle-group hubs",
    labelAr: "مراكز المجموعات العضلية",
    primaryIntent: "See all exercises for one muscle group.",
    canonical: "/muscles/[group]",
    supporting: ["/exercises", "/equipment/[slug]", "/programs"],
    kind: "hub",
    queries: [
      "chest exercises",
      "back exercises",
      "shoulder exercises",
      "leg exercises",
      "تمارين الصدر",
      "تمارين الظهر",
      "تمارين الأكتاف",
      "تمارين الرجل",
    ],
  },
  {
    cluster: "equipment-hub",
    labelEn: "Equipment hubs",
    labelAr: "مراكز المعدات",
    primaryIntent: "See all exercises performable with one equipment type.",
    canonical: "/equipment/[type]",
    supporting: ["/exercises", "/muscles/[group]", "/programs"],
    kind: "hub",
    queries: [
      "dumbbell exercises",
      "barbell exercises",
      "cable exercises",
      "bodyweight exercises list",
      "تمارين الدمبل",
      "تمارين البار",
      "تمارين بالكابل",
    ],
  },
  {
    cluster: "programs-library",
    labelEn: "Ready workout programs",
    labelAr: "برامج التدريب الجاهزة",
    primaryIntent: "Browse and pick a ready-made training program.",
    canonical: "/programs",
    supporting: ["/programs/[slug]", "/exercises", "/evo", "/ai-workout-planner"],
    kind: "program",
    queries: [
      "workout programs",
      "training programs",
      "ready workout plan",
      "برامج تدريب جاهزة",
      "برنامج تمرين جاهز",
    ],
  },

  // ── Nutrition libraries & hubs ────────────────────────────────
  {
    cluster: "food-database",
    labelEn: "Food database",
    labelAr: "قاعدة بيانات الأطعمة",
    primaryIntent: "Look up per-100g calories and macros for a food.",
    canonical: "/foods",
    supporting: ["/collections/high-protein-foods", "/tools/calorie-calculator", "/meal-planner", "/foods/methodology"],
    kind: "library",
    queries: [
      "food nutrition database",
      "calories per 100g",
      "food database",
      "سعرات الأكلات",
      "القيم الغذائية للأطعمة",
      "قاعدة بيانات الأطعمة",
    ],
  },
  // ── HEALTHY-RECIPES-PLATFORM (2026-11-10, plan §10-5): the recipes
  // family's three primary surfaces. Registered HERE so the blog topic
  // gate protects them (no article competes for their head queries)
  // AND so the recipes idea gate (Q-GATE-5) can consult this map. The
  // /blog/category/recipes overlap (decision ق5): separate intents,
  // cross-linked, rename deferred to the owner.
  {
    cluster: "recipes-library",
    labelEn: "Healthy recipes library",
    labelAr: "مكتبة الوصفات الصحية",
    primaryIntent: "Find a healthy recipe with computed per-serving nutrition.",
    canonical: "/recipes",
    supporting: ["/foods", "/meal-planner", "/recipes/methodology", "/tools/calorie-calculator"],
    kind: "library",
    queries: [
      "healthy recipes",
      "healthy recipe with calories",
      "high protein recipes",
      "وصفات صحية",
      "وصفة صحية بالسعرات",
      "وصفات دايت",
    ],
  },
  {
    cluster: "recipes-cuisines",
    labelEn: "Healthy recipes by cuisine",
    labelAr: "وصفات صحية حسب المطبخ",
    primaryIntent: "Browse healthy recipes from a specific cuisine.",
    canonical: "/recipes/cuisine/egyptian",
    supporting: ["/recipes", "/recipes/cuisine/arab", "/recipes/cuisine/gulf"],
    kind: "hub",
    queries: [
      "healthy egyptian recipes",
      "arabic healthy recipes",
      "وصفات مصرية صحية",
      "وصفات عربية صحية",
    ],
  },
  {
    cluster: "recipes-diets",
    labelEn: "Healthy recipes by diet",
    labelAr: "وصفات صحية حسب النظام الغذائي",
    primaryIntent: "Browse recipes compatible with a specific diet.",
    canonical: "/recipes/diet/keto",
    supporting: ["/recipes/diet/high-protein", "/recipes/diet/vegan", "/recipes"],
    kind: "hub",
    queries: [
      "keto recipes",
      "high protein diet recipes",
      "وصفات كيتو",
      "وصفات عالية البروتين",
    ],
  },
  // ── Phase 318 (P1-8 — SEO audit item 8): the accuracy chain's two new
  // primary surfaces. Registered HERE so the blog topic gate protects
  // them: no future article may compete for their head queries — the
  // chain pages stay the canonical owners of the accuracy intent.
  {
    cluster: "macro-accuracy-guide",
    labelEn: "Macro tracking accuracy guide",
    labelAr: "دليل دقة تتبع الماكروز",
    primaryIntent: "Understand why macro numbers differ between apps and track accurately.",
    canonical: "/guides/macro-tracking-accuracy",
    supporting: ["/foods/methodology", "/foods", "/macro-tracker", "/tools/macro-calculator", "/compare/alkemos-vs-cronometer"],
    kind: "guide",
    queries: [
      "macro tracking accuracy",
      "how accurate is macro tracking",
      "why do macros differ between apps",
      "دقة تتبع الماكروز",
      "دقة حساب الماكروز",
    ],
  },
  {
    cluster: "food-data-methodology",
    labelEn: "Food data methodology",
    labelAr: "منهجية بيانات الأطعمة",
    primaryIntent: "Check how a food database sources and standardizes its values.",
    canonical: "/foods/methodology",
    supporting: ["/foods", "/guides/macro-tracking-accuracy", "/meal-planner"],
    kind: "library",
    queries: [
      "food database methodology",
      "food nutrition data sources",
      "منهجية قاعدة بيانات الأطعمة",
      "مصادر القيم الغذائية",
    ],
  },
  {
    cluster: "food-collections",
    labelEn: "Food collections",
    labelAr: "مجموعات الأطعمة",
    primaryIntent: "Browse foods filtered by a nutrition goal (e.g. high protein).",
    canonical: "/collections/[slug]",
    supporting: ["/foods", "/meal-planner", "/ai-meal-planner"],
    kind: "hub",
    queries: [
      "high protein foods",
      "low calorie foods",
      "أكلات عالية البروتين",
      "أطعمة قليلة السعرات",
    ],
  },
  {
    cluster: "diet-plan-library",
    labelEn: "Ready diet-plan library",
    labelAr: "مكتبة الخطط الغذائية الجاهزة",
    primaryIntent: "Pick a ready daily meal plan by calorie level and system.",
    canonical: "/diet-plan",
    supporting: ["/ai-meal-planner", "/meal-planner", "/foods"],
    kind: "program",
    queries: [
      "ready meal plan",
      "daily diet plan",
      "خطط غذائية جاهزة",
      "نظام غذائي يومي جاهز",
    ],
  },

  // ── Tools ──────────────────────────────────────────────────────
  {
    cluster: "calorie-calculator",
    labelEn: "Calorie / TDEE calculator",
    labelAr: "حاسبة السعرات / TDEE",
    primaryIntent: "Calculate daily calorie needs (TDEE) online.",
    canonical: "/tools/calorie-calculator",
    supporting: ["/tools/macro-calculator", "/tools/bmi-calculator", "/ai-meal-planner"],
    kind: "tool",
    queries: [
      "calorie calculator",
      "tdee calculator",
      "how many calories calculator",
      "حاسبة السعرات",
      "حاسبة السعرات اليومية",
      "حاسبة tdee",
    ],
  },
  {
    cluster: "macro-calculator",
    labelEn: "Macro calculator",
    labelAr: "حاسبة الماكروز",
    primaryIntent: "Split daily calories into protein/carb/fat targets.",
    canonical: "/tools/macro-calculator",
    supporting: ["/tools/calorie-calculator", "/foods", "/ai-meal-planner", "/guides/macro-tracking-accuracy"],
    kind: "tool",
    queries: [
      "macro calculator",
      "macronutrient calculator",
      "protein needs calculator",
      "حاسبة الماكروز",
      "حاسبة البروتين والكارب",
    ],
  },
  {
    cluster: "bmi-calculator",
    labelEn: "BMI calculator",
    labelAr: "حاسبة كتلة الجسم",
    primaryIntent: "Calculate body mass index online.",
    canonical: "/tools/bmi-calculator",
    supporting: ["/tools/calorie-calculator", "/tools/body-fat-calculator"],
    kind: "tool",
    queries: [
      "bmi calculator",
      "body mass index calculator",
      "حاسبة كتلة الجسم",
      "حاسبة bmi",
    ],
  },
  {
    cluster: "body-fat-calculator",
    labelEn: "Body-fat calculator",
    labelAr: "حاسبة نسبة الدهون",
    primaryIntent: "Estimate body-fat percentage online.",
    canonical: "/tools/body-fat-calculator",
    supporting: ["/tools/bmi-calculator", "/tools/calorie-calculator"],
    kind: "tool",
    queries: [
      "body fat calculator",
      "body fat percentage calculator",
      "حاسبة نسبة الدهون",
      "حاسبة دهون الجسم",
    ],
  },
  {
    cluster: "water-tracker",
    labelEn: "Water tracker",
    labelAr: "متتبع الماء",
    primaryIntent: "Track daily water intake against a personal goal.",
    canonical: "/tools/water-tracker",
    supporting: ["/tools/calorie-calculator"],
    kind: "tool",
    queries: [
      "water intake tracker",
      "daily water goal",
      "متتبع شرب الماء",
      "حاسبة الماء اليومية",
    ],
  },
  {
    cluster: "manual-meal-planner",
    labelEn: "Manual meal planner",
    labelAr: "مخطط الوجبات اليدوي",
    primaryIntent: "Assemble a day of meals from the food database with live macros.",
    canonical: "/meal-planner",
    supporting: ["/foods", "/collections/[slug]", "/diet-plan", "/ai-meal-planner"],
    kind: "tool",
    queries: [
      "meal planner",
      "build a meal plan",
      "مخطط الوجبات",
      "بناء خطة وجبات",
    ],
  },
  {
    cluster: "ai-meal-planner",
    labelEn: "AI meal planner",
    labelAr: "مخطط الوجبات بالذكاء الاصطناعي",
    primaryIntent: "Generate a personalized meal plan with AI (free trial).",
    canonical: "/ai-meal-planner",
    supporting: ["/evo", "/diet-plan", "/meal-planner", "/tools/calorie-calculator"],
    kind: "tool",
    queries: [
      "ai meal planner",
      "ai meal plan generator",
      "meal plan generator",
      "مخطط وجبات بالذكاء الاصطناعي",
      "توليد خطة غذائية بالذكاء الاصطناعي",
    ],
  },
  {
    cluster: "ai-workout-planner",
    labelEn: "AI workout planner",
    labelAr: "مخطط التمارين بالذكاء الاصطناعي",
    primaryIntent: "Generate a personalized weekly workout split with AI (free trial).",
    canonical: "/ai-workout-planner",
    supporting: ["/evo", "/programs", "/exercises"],
    kind: "tool",
    queries: [
      "ai workout planner",
      "ai workout generator",
      "workout plan generator",
      "مخطط تمارين بالذكاء الاصطناعي",
      "توليد برنامج تمارين بالذكاء الاصطناعي",
    ],
  },

  // ── EVO / coaching / memberships ──────────────────────────────
  {
    cluster: "evo-ai-coach",
    labelEn: "EVO — AI fitness coach",
    labelAr: "EVO — مدرب اللياقة الذكي",
    primaryIntent: "Chat with an AI fitness coach that builds and adapts plans.",
    canonical: "/evo",
    supporting: ["/ai-meal-planner", "/ai-workout-planner", "/coaching", "/tools", "/memberships"],
    kind: "evo",
    queries: [
      "ai fitness coach",
      "ai personal trainer",
      "ai fitness chatbot",
      "مدرب لياقة بالذكاء الاصطناعي",
      "مدرب رياضي ذكي",
    ],
  },
  {
    cluster: "online-coaching",
    labelEn: "Personal online coaching",
    labelAr: "التدريب الأونلاين مع مدرب خاص",
    primaryIntent: "Get coached by a personal fitness/nutrition coach.",
    canonical: "/coaching",
    supporting: ["/evo", "/memberships", "/for-coaches", "/coaches"],
    kind: "coaching",
    queries: [
      "online fitness coach",
      "online nutrition coach",
      "كوتش لياقة اونلاين",
      "مدرب تغذية اونلاين",
    ],
  },
  {
    cluster: "memberships-pricing",
    labelEn: "Memberships & pricing",
    labelAr: "العضويات والأسعار",
    primaryIntent: "Compare Alkemos tiers, prices, and limits.",
    canonical: "/memberships",
    supporting: ["/evo", "/coaching", "/faq", "/compare"],
    kind: "membership",
    queries: [
      "alkemos price",
      "alkemos membership cost",
      "fitness app pricing comparison",
      "اسعار اشتراك alkemos",
      "باقات alkemos",
    ],
  },
  {
    cluster: "platform-comparisons",
    labelEn: "Platform comparisons",
    labelAr: "مقارنات المنصات",
    primaryIntent: "Compare Alkemos against a named alternative before deciding.",
    canonical: "/compare",
    supporting: ["/memberships", "/evo", "/programs", "/foods"],
    kind: "compare",
    queries: [
      "alkemos vs myfitnesspal",
      "alkemos vs freeletics",
      "myfitnesspal alternative free",
      "بديل myfitnesspal",
    ],
  },

  // ── Editorial surfaces ────────────────────────────────────────
  {
    cluster: "fitness-blog",
    labelEn: "Fitness blog",
    labelAr: "المدونة الرياضية",
    primaryIntent: "Read evidence-based training and nutrition articles.",
    canonical: "/blog",
    supporting: ["/blog/category/[slug]", "/tools", "/evo", "/programs", "/exercises", "/foods"],
    kind: "blog",
    queries: [],
  },
  {
    cluster: "fitness-blog-ar",
    labelEn: "Arabic fitness blog",
    labelAr: "المدونة الرياضية العربية",
    primaryIntent: "Read evidence-based training and nutrition articles in Arabic.",
    canonical: "/ar/blog",
    supporting: ["/ar/blog/category/[slug]", "/ar/tools", "/ar/evo", "/ar/programs", "/ar/exercises", "/ar/foods"],
    kind: "blog",
    queries: [],
  },
];

// ─────────────────────────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────────────────────────

/** Normalize a phrase for intent matching (EN case-fold + Arabic light
 *  normalization: alef variants unify, taa-marbuta→haa, alif maqsura→yaa,
 *  diacritics/tatweel strip). */
export function normalizeIntentText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every entry whose kind is NOT "blog" — the blog topic gate's source. */
export function blogGateEntries(): SearchIntentEntry[] {
  return SEARCH_INTENT_MAP.filter((e) => e.kind !== "blog");
}

export type IntentCollision = {
  entry: SearchIntentEntry;
  /** The head query that the candidate topic collided with. */
  matchedQuery: string;
};

/**
 * BLOG TOPIC GATE (audit item 1/10 — «امنع أي مقال جديد مستقبلًا من
 * منافسة Intent موجود»): does a candidate article topic/focus keyword
 * compete with an existing PRIMARY page's intent?
 *
 * Deterministic + conservative, to respect the long-tail law above:
 *   - The candidate's focusKeyword (and topic) is compared against every
 *     non-blog head query after normalization.
 *   - A collision fires when the candidate text EQUALS a head query or
 *     CONTAINS it as a substring. This is safe BY CONSTRUCTION of the
 *     map: only HEAD queries are registered, and the corpus's qualified
 *     long-tails (e.g. «برنامج تمارين بناء العضلات في المنزل بدون
 *     معدات») never contain those head phrases verbatim — while
 *     head+modifier candidates (e.g. "best AI meal planner") do fire,
 *     which is exactly the competition the audit bans.
 * The full topic string is checked with the same rule (catches topics
 * whose focusKeyword field is generic but whose title is a head query).
 */
function buildBlogGateQueries(): Array<{ entry: SearchIntentEntry; nq: string }> {
  const FLATTENED: Array<{ entry: SearchIntentEntry; nq: string }> = [];
  for (const entry of blogGateEntries()) {
    for (const q of entry.queries) {
      const nq = normalizeIntentText(q);
      if (nq) FLATTENED.push({ entry, nq });
    }
  }
  // Longest-match-first: "best ai meal planner" must resolve to the AI
  // planner's intent, not the manual planner's shorter head query (same
  // most-specific-first convention as blog-tool-links.ts).
  FLATTENED.sort((a, b) => b.nq.length - a.nq.length);
  return FLATTENED;
}

const BLOG_GATE_QUERIES = buildBlogGateQueries();

export function findBlogIntentCollision(
  focusKeyword: string,
  topic?: string,
): IntentCollision | null {
  const candidates: string[] = [];
  const fk = normalizeIntentText(focusKeyword || "");
  if (fk) candidates.push(fk);
  if (topic) {
    const t = normalizeIntentText(topic);
    if (t && !candidates.includes(t)) candidates.push(t);
  }

  for (const { entry, nq } of BLOG_GATE_QUERIES) {
    for (const cand of candidates) {
      if (cand.includes(nq)) {
        return { entry, matchedQuery: entry.queries.find((q) => normalizeIntentText(q) === nq) ?? nq };
      }
    }
  }
  return null;
}

/** Look up the intent entry owning a canonical path pattern. */
export function getIntentByCanonical(canonical: string): SearchIntentEntry | null {
  return SEARCH_INTENT_MAP.find((e) => e.canonical === canonical) ?? null;
}
