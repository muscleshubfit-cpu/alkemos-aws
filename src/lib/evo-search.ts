/**
 * EVO Search — context-aware search across the platform's local databases.
 *
 * When a user asks EVO a question, this module searches:
 *   1. Exercises (868 exercises)
 *   2. Foods (8,162 foods)
 *   3. Workout Programs (7 programs)
 *   4. Tools (4 calculators)
 *
 * Returns relevant links that EVO can include in its response.
 *
 * SERVER-ONLY (VERCEL-USAGE-3, 2026-09-21): this module runs inside
 * /api/ai/chat (its only importers are the chat route and
 * evo-system-prompt). It previously imported the FULL data modules
 * (foods.ts 3.6MB + exercises.ts 1.8MB), which bloated the chat
 * function's serverless bundle and its V8 parse cost on every instance
 * start — a measured contributor to the Fluid Active CPU overage
 * (4h33m/4h) and Functions Storage (14/10GB). It now reads the GENERATED
 * light search indexes (search-field slices only — see
 * scripts/generate-search-indexes.ts): ~2.5MB of data instead of ~5.4MB,
 * with identical search results (the search never touched instructions,
 * servings, tags, or tips).
 *
 * Blog search is done separately via Supabase (server-side).
 */
import "server-only";

import {
  EXERCISES_SEARCH_INDEX,
} from "@/lib/exercises-search-index";
import { FOODS_SEARCH_INDEX } from "@/lib/foods-search-index";
import { WORKOUT_PROGRAMS } from "@/lib/workout-programs";

export type SearchResult = {
  type: "exercise" | "food" | "program" | "tool" | "recipe";
  slug: string;
  nameAr: string;
  nameEn: string;
  url: string;
  description: string;
  relevance: number; // 0-1, higher = more relevant
};

// Food nutrition info for quick answers
export type FoodNutrition = {
  slug: string;
  nameAr: string;
  nameEn: string;
  url: string;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

const TOOLS = [
  {
    type: "tool" as const,
    slug: "calorie-calculator",
    nameAr: "حاسبة السعرات الحرارية",
    nameEn: "Calorie Calculator",
    url: "/tools/calorie-calculator",
    description: "احسب احتياجك اليومي من السعرات والماكروز",
    keywords: ["سعرات", "calories", "tdee", "bmr", "احتياج"],
  },
  {
    type: "tool" as const,
    slug: "bmi-calculator",
    nameAr: "حاسبة BMI",
    nameEn: "BMI Calculator",
    url: "/tools/bmi-calculator",
    description: "احسب مؤشر كتلة الجسم",
    keywords: ["bmi", "كتلة", "وزن مثالي", "mass index"],
  },
  {
    type: "tool" as const,
    slug: "macro-calculator",
    nameAr: "حاسبة الماكروز",
    nameEn: "Macro Calculator",
    url: "/tools/macro-calculator",
    description: "وزّع سعراتك على بروتين وكربوهيدرات ودهون",
    keywords: ["ماكرو", "macro", "بروتين كارب دهون", "keto", "كيتو"],
  },
  {
    type: "tool" as const,
    slug: "body-fat-calculator",
    nameAr: "حاسبة نسبة الدهون",
    nameEn: "Body Fat Calculator",
    url: "/tools/body-fat-calculator",
    description: "احسب نسبة الدهون في جسمك",
    keywords: ["دهون", "fat", "body fat", "نسبة دهون"],
  },
];

/**
 * Normalize text for search — English-first, with Arabic support.
 * Removes stop words in BOTH languages so search works regardless of
 * which language the user types in.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove Arabic diacritics
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize alef variants
    .replace(/[إأآ]/g, "ا")
    // Remove taa marbuta
    .replace(/ة/g, "ه")
    // Remove question marks (both languages)
    .replace(/[؟?]/g, " ")
    // Remove ENGLISH stop words (primary language)
    .replace(/\b(how|to|do|what|is|the|a|an|of|for|in|on|at|with|and|or|not|can|i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|its|our|their|this|that|these|those|are|was|were|been|being|have|has|had|will|would|could|should|may|might|must|shall|about|into|from|by|as|if|then|than|so|no|yes|please|tell|show|give|find|need|want|know|like|use|make|get|put|set|see|look|try|ask|say)\b/g, " ")
    // Remove ARABIC stop words (secondary language)
    .replace(/\b(ازاي|إزاي|كيف|في|من|عن|علي|على|ان|إن|و|او|أو|لا|ما|متى|مين|ليه|لماذا|هل|فيه|عايز|محتاج|كم|كام|ايه|إيه|شنو|ايش|اللي|الى|التي|الذي|بس|كمان|كده|دا|ده|دي|اكتر|اكثر|شوي|جد|جدا|قوي|نفس|زي|يبقى|كانه|كان|يكون|تكون|يقدر|تقدر|اعمل|اعرف|نعمل|تعال|قول|قولي|ممكن|سؤال|سوال|معلومة|استفسار)\b/g, " ")
    // Collapse spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate relevance score — how well does the query match the text?
 * Uses word-level matching, not raw substring (to avoid false positives
 * like "تمرين" matching "تمر" which is dates).
 */
function scoreMatch(query: string, text: string): number {
  const q = normalize(query);
  const t = normalize(text);
  if (!q || !t) return 0;

  // Exact match
  if (t === q) return 1;

  // Starts with query
  if (t.startsWith(q)) return 0.9;

  const words = t.split(" ").filter((w) => w.length > 1);
  const queryWords = q.split(" ").filter((w) => w.length > 1);

  // Contains query as a whole word
  if (words.some((w) => w === q)) return 0.85;

  // Word-level matching: count how many query words match text words
  let matchCount = 0;
  for (const qw of queryWords) {
    // Exact word match
    if (words.some((w) => w === qw)) {
      matchCount += 1;
      continue;
    }
    // Word starts with query word (e.g., "bench" matches "bench-press")
    if (words.some((w) => w.startsWith(qw) && qw.length >= 4)) {
      matchCount += 0.8;
      continue;
    }
    // Query word starts with text word (e.g., "benchpress" matches "bench")
    if (words.some((w) => qw.startsWith(w) && w.length >= 4)) {
      matchCount += 0.7;
      continue;
    }
  }

  if (matchCount > 0) {
    const ratio = matchCount / queryWords.length;
    // Require at least 50% of query words to match
    if (ratio >= 0.5) {
      return 0.6 + ratio * 0.3; // 0.6 to 0.9
    }
    // Single significant word match (length >= 4)
    if (queryWords.length === 1 && queryWords[0].length >= 4) {
      // Only match if the word is significant (not "تمر" which is too short)
      return 0;
    }
  }

  return 0;
}

/**
 * Search exercises by name, muscles, or equipment.
 */
function searchExercises(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  for (const ex of EXERCISES_SEARCH_INDEX) {
    // Search in name (Arabic + English), primary muscles, equipment
    const searchText = [
      ex.nameAr,
      ex.nameEn,
      ex.primaryMuscles.join(" "),
      ex.secondaryMuscles.join(" "),
      ex.equipment,
    ].join(" ");

    const score = Math.max(
      scoreMatch(query, ex.nameAr),
      scoreMatch(query, ex.nameEn),
      scoreMatch(query, ex.primaryMuscles.join(" ")),
      scoreMatch(query, ex.equipment) * 0.8,
    );

    if (score > 0.3) {
      results.push({
        type: "exercise",
        slug: ex.slug,
        nameAr: ex.nameAr,
        nameEn: ex.nameEn,
        url: `/exercises/${ex.slug}`,
        description: `${ex.primaryMuscles.join(", ")} · ${ex.equipment}`,
        relevance: score,
      });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
}

/**
 * Search foods by name or category.
 * Also returns nutrition info for quick answers.
 */
function searchFoods(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  for (const food of FOODS_SEARCH_INDEX) {
    const score = Math.max(
      scoreMatch(query, food.nameAr),
      scoreMatch(query, food.nameEn),
      scoreMatch(query, food.category) * 0.7,
    );

    if (score > 0.3) {
      results.push({
        type: "food",
        slug: food.slug,
        nameAr: food.nameAr,
        nameEn: food.nameEn,
        url: `/foods/${food.slug}`,
        description: `${food.calories} kcal · ${food.protein}g protein per 100g`,
        relevance: score,
      });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
}

/**
 * Search workout programs by name, level, or goal.
 */
function searchPrograms(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  for (const prog of WORKOUT_PROGRAMS) {
    const score = Math.max(
      scoreMatch(query, prog.nameAr),
      scoreMatch(query, prog.nameEn),
      scoreMatch(query, prog.level) * 0.8,
      scoreMatch(query, prog.location) * 0.8,
      scoreMatch(query, prog.goal) * 0.7,
    );

    if (score > 0.3) {
      results.push({
        type: "program",
        slug: prog.slug,
        nameAr: prog.nameAr,
        nameEn: prog.nameEn,
        url: `/programs/${prog.slug}`,
        description: `${prog.level} · ${prog.daysPerWeek} days/week · ${prog.durationWeeks} weeks`,
        relevance: score,
      });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
}

/* ────────────────────────────────────────────────────────────────────────
 * GAP-20 (S4-6 live measurement 2026-11-17): tool anchors appeared ONLY
 * on the LITERAL tool-name phrasing — «أعرض علي حاسبة السعرات» scored
 * 0.75 (name match) while the common natural request shapes scored ZERO
 * («عايز أحسب احتياجي اليومي من السعرات» · «إحسبلي سعراتي» · «إحسبلي
 * سعراتي ومؤشر كتلة جسمي»): scoreMatch needs ≥50% of the QUERY's words
 * to appear inside the short keyword/name text, and natural requests
 * carry intent verbs (احسب/إحسبلي), attached clitics (سعراتي/احتياجي)
 * and the «ال» prefix (السعرات) that never appear in the keywords — so
 * the ratio collapses below 0.5 and no anchor ever renders.
 *
 * THE FIX — a tool-INTENT layer (this block ONLY; the generic scoreMatch
 * and the exercises/foods/programs search are untouched, so existing
 * behavior cannot shift): each tool declares intent VERBS and DOMAIN
 * NOUNS (prefix-matched on a lightly-normalized token view) plus
 * high-precision STRONG phrases. A verb+noun pair (or a strong phrase)
 * fires at relevance 0.7 — BELOW the literal name match (0.75+) so a
 * direct name mention still outranks it, comfortably ABOVE the 0.3
 * anchor threshold in /api/ai/chat.
 * ──────────────────────────────────────────────────────────────────────── */

/** GAP-20: light normalization for intent matching — NO stop-word removal
 * (intent verbs ARE the signal scoreMatch's stop list deletes) and no
 * aggressive clitic surgery; just shape unification + punctuation strip. */
function intentNormalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // diacritics + tatweel
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[؟?!.،,؛:()«»"'`\-\u2013\u2014]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** GAP-20: the token view — word-level «ال» prefix strip so «السعرات»
 * matches the «سعرات» noun (the measured breaker), keeping every token
 * that survives normalization. */
function intentTokens(text: string): string[] {
  return intentNormalize(text)
    .split(" ")
    .map((w) => (w.length > 3 && w.startsWith("ال") ? w.slice(2) : w))
    .filter(Boolean);
}

/** True when any token equals/starts-with a signal prefix (≥3 chars so
 * Arabic clitics like «سعراتي» and «احسبلي» still prefix-match their
 * nouns/verbs: احسبلي ⊃ احسب، سعراتي ⊃ سعرات). Multi-word signals
 * ("body fat", "figure out") match the joined token stream instead. */
function hasSignal(tokens: string[], prefixes: string[]): boolean {
  const flat = tokens.join(" ");
  for (const p of prefixes) {
    if (p.includes(" ")) {
      if (flat.includes(p)) return true;
      continue;
    }
    for (const t of tokens) {
      if (t === p || (p.length >= 3 && t.startsWith(p))) return true;
    }
  }
  return false;
}

/** GAP-20: the per-tool intent table (bilingual, Egyptian-tolerant). */
const TOOL_INTENTS: Record<string, { verbs: string[]; nouns: string[]; strong: string[] }> = {
  "calorie-calculator": {
    verbs: ["احسب", "حساب", "هحسب", "نحسب", "ا حسب", "calculate", "calc", "compute", "determine", "figure out", "work out"],
    nouns: ["سعر", "كالوري", "احتياج", "calorie", "calories", "kcal", "tdee", "bmr"],
    strong: ["احتياجي اليومي", "احتياج اليومي", "احتياجك اليومي", "daily calories", "my calories", "calorie needs", "my tdee", "my bmr", "maintenance calories"],
  },
  "bmi-calculator": {
    verbs: ["احسب", "حساب", "هحسب", "نحسب", "calculate", "calc", "compute", "determine"],
    nouns: ["كتله", "bmi", "mass index"],
    strong: ["مؤشر كتله", "وزني المثالي", "وزني مثالي", "وزنك المثالي", "ideal weight", "my bmi", "bmi بتاعي"],
  },
  "macro-calculator": {
    verbs: ["احسب", "حساب", "هحسب", "نحسب", "وزع", "قسم", "وزّع", "calculate", "calc", "compute", "split", "distribute"],
    nouns: ["ماكرو", "macro", "macros", "بروتين وكارب"],
    strong: ["توزيع ماكرو", "تقسيم سعرات", "توزيع سعرات", "توزيع الماكرو", "split my macros", "macro split", "macro distribution", "my macros"],
  },
  "body-fat-calculator": {
    verbs: ["احسب", "حساب", "هحسب", "نحسب", "قيس", "calculate", "calc", "compute", "measure", "determine"],
    nouns: ["نسبه دهون", "دهون الجسم", "body fat", "bodyfat", "adipos"],
    strong: ["نسبه الدهون", "نسبة الدهون", "دهون الجسم", "body fat percentage", "my body fat", "نسبه دهوني"],
  },
};

/** The relevance a fired intent carries — below the literal name match,
 * above the anchor threshold (see the GAP-20 block comment). */
const TOOL_INTENT_RELEVANCE = 0.7;

/** GAP-20: the intent verdict for one tool — 0 when the message shows no
 * tool-intent shape. Fires on (verb AND domain noun) OR a strong phrase
 * (strong phrases match the FLAT normalized text — the «ال» strip is a
 * token-level aid for the verb/noun signals, not for exact phrases). */
function toolIntentScore(message: string, slug: string): number {
  const intent = TOOL_INTENTS[slug];
  if (!intent) return 0;
  const flat = intentNormalize(message);
  if (!flat) return 0;
  if (intent.strong.some((phrase) => flat.includes(intentNormalize(phrase)))) {
    return TOOL_INTENT_RELEVANCE;
  }
  const tokens = intentTokens(message);
  if (tokens.length === 0) return 0;
  if (hasSignal(tokens, intent.verbs) && hasSignal(tokens, intent.nouns)) {
    return TOOL_INTENT_RELEVANCE;
  }
  return 0;
}

/**
 * Search tools by name or keywords.
 */
function searchTools(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  for (const tool of TOOLS) {
    const keywordScore = Math.max(
      ...tool.keywords.map((kw) => scoreMatch(query, kw)),
    );
    const nameScore = Math.max(
      scoreMatch(query, tool.nameAr),
      scoreMatch(query, tool.nameEn),
    );
    // GAP-20: the natural-phrasing intent layer — ADDITIVE only (the
    // literal keyword/name matching above is untouched), so a tool whose
    // name is mentioned verbatim still outranks an intent-shaped ask.
    const intentScore = toolIntentScore(query, tool.slug);
    const score = Math.max(keywordScore, nameScore, intentScore);

    if (score > 0.3) {
      results.push({
        type: "tool",
        slug: tool.slug,
        nameAr: tool.nameAr,
        nameEn: tool.nameEn,
        url: tool.url,
        description: tool.description,
        relevance: score,
      });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 2);
}

/**
 * HEALTHY-RECIPES-PLATFORM (plan §9.4 — EVO knowledge): the recipes
 * family joins the platform search. Recipe PAGES are DB-backed (not
 * searchable in-memory), but the TAXONOMY HUBS are static code — so
 * EVO honestly points recipe-intent questions («وصفة كيتو»، «أفكار
 * عشاء صحي») at the matching hub page. Keywords are bilingual and
 * recipe-INTENT specific (a «دجاج» query still belongs to /foods).
 */
const RECIPE_HUBS = [
  {
    slug: "recipes",
    nameAr: "الوصفات الصحية",
    nameEn: "Healthy Recipes",
    url: "/recipes",
    description: "وصفات ثنائية اللغة بقيم محسوبة بالجرام لكل حصة",
    keywords: ["وصفة", "وصفات", "طبخ", "اكل صحي", "وصفة صحية", "recipe", "recipes", "healthy recipe", "meal ideas"],
  },
  {
    slug: "diet-keto",
    nameAr: "وصفات كيتو",
    nameEn: "Keto Recipes",
    url: "/recipes/diet/keto",
    description: "كربوهيدرات صافية ≤ 10 جم للحصة — قاعدة المحرك معلنة",
    keywords: ["وصفة كيتو", "وصفات كيتو", "كيتو", "keto recipes", "keto meal"],
  },
  {
    slug: "diet-high-protein",
    nameAr: "وصفات عالية البروتين",
    nameEn: "High-Protein Recipes",
    url: "/recipes/diet/high-protein",
    description: "بروتين ≥ 25 جم أو ≥ 30% من السعرات للحصة",
    keywords: ["وصفة بروتين", "وصفات عالية البروتين", "high protein recipes", "protein meal"],
  },
  {
    slug: "diet-vegan",
    nameAr: "وصفات نباتية صرفة",
    nameEn: "Vegan Recipes",
    url: "/recipes/diet/vegan",
    description: "بلا أي مكونات حيوانية — محسوبة من الأعلام",
    keywords: ["وصفة نباتية", "وصفات نباتية", "vegan recipes", "vegan meal"],
  },
  {
    slug: "diet-vegetarian",
    nameAr: "وصفات نباتية بالبيض والألبان",
    nameEn: "Vegetarian Recipes",
    url: "/recipes/diet/vegetarian",
    description: "بلا لحوم أو أسماك",
    keywords: ["وصفة نباتية بالبيض", "vegetarian recipes"],
  },
  {
    slug: "diet-gluten-free",
    nameAr: "وصفات خالية من الجلوتين",
    nameEn: "Gluten-Free Recipes",
    url: "/recipes/diet/gluten-free",
    description: "صفر أعلام جلوتين",
    keywords: ["وصفة خالية الجلوتين", "بدون جلوتين", "gluten free recipes"],
  },
  {
    slug: "diet-low-carb",
    nameAr: "وصفات قليلة الكربوهيدرات",
    nameEn: "Low-Carb Recipes",
    url: "/recipes/diet/low-carb",
    description: "كربوهيدرات ≤ 20 جم للحصة",
    keywords: ["وصفة قليلة الكارب", "low carb recipes"],
  },
  {
    slug: "cuisine-egyptian",
    nameAr: "وصفات مصرية صحية",
    nameEn: "Healthy Egyptian Recipes",
    url: "/recipes/cuisine/egyptian",
    description: "المطبخ المصري بقيم محسوبة بالجرام",
    keywords: ["وصفة مصرية", "اكل مصري صحي", "egyptian recipes"],
  },
  {
    slug: "meal-breakfast",
    nameAr: "وصفات إفطار صحية",
    nameEn: "Healthy Breakfast Recipes",
    url: "/recipes/meal/breakfast",
    description: "إفطار بقيم محسوبة لكل حصة",
    keywords: ["وصفة افطار", "افطار صحي", "healthy breakfast ideas", "breakfast recipes"],
  },
  {
    slug: "meal-dinner",
    nameAr: "وصفات عشاء صحية",
    nameEn: "Healthy Dinner Recipes",
    url: "/recipes/meal/dinner",
    description: "عشاء بقيم محسوبة لكل حصة",
    keywords: ["وصفة عشاء", "عشاء صحي", "dinner recipes", "healthy dinner"],
  },
  {
    slug: "meal-pre-workout",
    nameAr: "وصفات قبل التمرين",
    nameEn: "Pre-Workout Recipes",
    url: "/recipes/meal/pre-workout",
    description: "وقود ما قبل التمرين بقيم محسوبة",
    keywords: ["قبل التمرين", "اكل قبل التمرين", "pre workout meal"],
  },
  {
    slug: "meal-post-workout",
    nameAr: "وصفات بعد التمرين",
    nameEn: "Post-Workout Recipes",
    url: "/recipes/meal/post-workout",
    description: "استشفاء ما بعد التمرين ببروتين محسوب",
    keywords: ["بعد التمرين", "اكل بعد التمرين", "post workout meal"],
  },
];

/**
 * Search the recipes taxonomy hubs (EVO's recipes knowledge — plan §9.4).
 */
function searchRecipeHubs(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const hub of RECIPE_HUBS) {
    const keywordScore = Math.max(
      0,
      ...hub.keywords.map((kw) => scoreMatch(query, kw)),
    );
    if (keywordScore > 0.45) {
      results.push({
        type: "recipe",
        slug: hub.slug,
        nameAr: hub.nameAr,
        nameEn: hub.nameEn,
        url: hub.url,
        description: hub.description,
        relevance: keywordScore,
      });
    }
  }
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 2);
}

/**
 * Main search function — searches all local databases.
 * Returns combined results sorted by relevance.
 */
export function searchPlatform(query: string): SearchResult[] {
  const all = [
    ...searchExercises(query),
    ...searchFoods(query),
    ...searchPrograms(query),
    ...searchTools(query),
    ...searchRecipeHubs(query),
  ];

  return all.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

/**
 * Get nutrition info for a food (for quick answers like "how many calories in X?").
 */
export function getFoodNutrition(query: string): FoodNutrition | null {
  for (const food of FOODS_SEARCH_INDEX) {
    const score = Math.max(
      scoreMatch(query, food.nameAr),
      scoreMatch(query, food.nameEn),
    );
    if (score > 0.5) {
      return {
        slug: food.slug,
        nameAr: food.nameAr,
        nameEn: food.nameEn,
        url: `/foods/${food.slug}`,
        per100g: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
        },
      };
    }
  }
  return null;
}

/**
 * Check if the query is asking about nutrition/calories of a specific food.
 * Returns true for queries like "كم سعرة دجاج" or "calories in chicken".
 */
export function isNutritionQuery(query: string): boolean {
  const q = normalize(query);
  const nutritionKeywords = [
    "سعرة",
    "سعرات",
    "كالوري",
    "calories",
    "cal",
    "ماكرو",
    "macro",
    "بروتين",
    "protein",
    "كارب",
    "carbs",
    "دهون",
    "fat",
  ];
  return nutritionKeywords.some((kw) => q.includes(normalize(kw)));
}

/**
 * Check if the query is asking about an exercise (how to do X).
 */
export function isExerciseQuery(query: string): boolean {
  const q = normalize(query);
  const exerciseKeywords = [
    "تمرين",
    "ازاي",
    "إزاي",
    "طريقة",
    "how to",
    "exercise",
    "how do",
    "تمارين",
  ];
  return exerciseKeywords.some((kw) => q.includes(normalize(kw)));
}

/**
 * Check if the query is asking for a program/workout plan.
 */
export function isProgramQuery(query: string): boolean {
  const q = normalize(query);
  const programKeywords = [
    "برنامج",
    "خطة",
    "program",
    "plan",
    "routine",
    "جدول",
    "تدريب",
    "workout",
  ];
  return programKeywords.some((kw) => q.includes(normalize(kw)));
}
