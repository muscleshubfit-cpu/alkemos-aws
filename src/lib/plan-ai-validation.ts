/**
 * PLAN-AI-VALIDATION — the MANDATORY quality gate for every AI plan
 * surface (AI-PLAN-QUALITY 2026-10-24, owner order «جودة التوليد هي
 * الأولوية القصوى لأنها الخدمة المدفوعة الأساسية»).
 *
 * WHY THIS MODULE EXISTS (the measured roots):
 *   - generateNutritionPlanAI accepted ANY JSON with meals.length > 0 —
 *     meals could sum 1500 kcal against a 2900 target (the live incident
 *     class: three contradicting number sets in one plan), items could
 *     carry absurd calories, and model-provided meal totals were trusted.
 *   - Model outputs smuggle STRING numbers ("230") — downstream sums
 *     concatenated them into garbage ("0300…"), and normalizers zeroed
 *     them. Everything numeric is COERCED here exactly once.
 *   - Regeneration results (meal / food item / workout day) were applied
 *     with ZERO validation — a drifted or shapeless payload reached the
 *     member's saved plan.
 *
 * THE LAW (owner order item 5): a provider answering 200 is NOT evidence
 * of quality. Every payload passes one of the validators below BEFORE it
 * is returned to a caller, displayed, or persisted. A failed validation
 * surfaces as { ok:false, error } — the caller retries or fails honestly;
 * it NEVER forwards the bad payload.
 *
 * PURE MODULE: zero imports (structural types only) so the whole gate is
 * unit-testable in isolation. Food-library grounding is injected as a
 * callback (src/lib/plan-food-grounding.ts) — the validator never loads
 * the 3.6MB FOODS array itself.
 */

/* ─────────────────────────── Structural types ─────────────────────────── */

export type AIItemLike = {
  food: string;
  amount: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  alternatives?: string;
};

export type AIMealLike = {
  name: string;
  time?: string;
  notes?: string;
  items: AIItemLike[];
  total_calories: number;
  total_protein_g?: number;
};

export type AIWorkoutExerciseLike = {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
};

export type AIWorkoutDayLike = {
  day: string;
  focus: string;
  isRest: boolean;
  exercises: AIWorkoutExerciseLike[];
};

/** Library-grounded macros for one item (see plan-food-grounding.ts). */
export type GroundedMacros = {
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
};

/** Grounding callback contract — pure, synchronous, never throws. */
export type GroundItemFn = (
  item: { food: string; amount: string; calories: number },
) => GroundedMacros | null;

/* ─────────────────────────── Sanity constants ─────────────────────────── */

export const PLAN_AI_SANITY = {
  /** Per-item calorie bounds (an item outside these is hallucinated). */
  itemKcalMin: 1,
  itemKcalMax: 2000,
  /** Per-item protein bound (g). */
  itemProteinMax: 250,
  /** Meals in a full-day plan. */
  mealCountMin: 2,
  mealCountMax: 8,
  /** Items per meal. */
  itemsPerMealMin: 1,
  itemsPerMealMax: 10,
  /** The full plan's meals-sum must close within ±25% of the target. */
  planDriftTolerance: 0.25,
  /** A regenerated meal must close within ±20% of its target (the demo
   * planner's law — now the paid path's law too). */
  mealDriftTolerance: 0.2,
  /** A regenerated food item must stay within ±15% of the original
   * (the prompt's own promise — now enforced). */
  itemDriftTolerance: 0.15,
  /** Trust the food library over the model when the model's calorie
   * estimate deviates beyond this (cooked/raw variance lives below it). */
  groundingTolerance: 0.35,
  /**
   * PLAN-REGEN-CONSTRAINTS 2026-10-24 (owner order item 2): per-item
   * MACRO↔CALORIE coherence band. When an item carries all three macros
   * the Atwater factors (P×4 + C×4 + F×9) must roughly close on the
   * declared calories — an INFLATED-calories hallucination (600 kcal for
   * macros summing 224 = ×2.7) is rejected at this band, which starts at
   * ×1.5 so rounded protein-forward rows (library chicken 248 kcal vs
   * 172-235 naive on mis-scaled grams) never false-fire. The downward
   * direction (macros-kcal far ABOVE calories) gets a wider band:
   * USDA-style rows count fiber inside carbs at 4 kcal/g while
   * physiologically insoluble fiber contributes ~0-2 kcal/g, so
   * high-fiber foods legitimately show declared calories BELOW the naive
   * Atwater sum (measured: wheat bran 100g → 216 kcal declared vs 344
   * naive). No sugar-alcohol correction is applied — the platform's
   * library rows carry no sugar-alcohol fields, so erythritol-style items
   * simply fall inside the wide downward band (documented honestly, not
   * silently "corrected").
   */
  macroCalorieInflationTolerance: 0.5,
  macroCalorieDeflationTolerance: 0.7,
  /** Keto item carb ceiling (g) — the ketogenic band is 20-50g NET for
   * the WHOLE day, so a single item above this is definitionally off-diet. */
  ketoItemCarbsMax: 12,
  /** Low-carb item carb ceiling (g) — ~25% of kcal as carbs for the day
   * allows a starch SIDE in a low-carb meal, not a >35g carb item. */
  lowCarbItemCarbsMax: 35,
  /** String length ceilings (display safety). */
  foodNameMax: 80,
  amountMax: 80,
  mealNameMax: 60,
  /** Workout day bounds. */
  dayExerciseMin: 3,
  dayExerciseMax: 8,
  dayCountMin: 3,
  dayCountMax: 8,
  setsMin: 1,
  setsMax: 12,
} as const;

/* ─────────────────────────── Coercion helpers ─────────────────────────── */

/**
 * Coerce a model-supplied number: handles 230, "230", " 230 ", 230.0,
 * AND Arabic-Indic/Persian digit strings ("٢٥٠" / "۴۵۰").
 * Returns null when not finite (NEVER 0 — 0 is a valid cooking value
 * and must not mask a missing field).
 *
 * REGEN-RELIABILITY FIX 2026-10-24 (owner order item 2 — the live measured
 * rejection class, run 40091765755): models answering in Arabic routinely
 * emit calories as Arabic-Indic numerals, and the old `[\\d.-]` strip
 * DELETED every ٠-۹/۰-۹ glyph (JS \d matches [0-9] only) — "٢٥٠" parsed to
 * NaN → null → the gate rejected a perfectly good item with «calories
 * outside 1-2000». parseGrams (nutrition-totals) already normalizes these
 * digits; the gate now shares the same law (parity, not a new policy).
 */
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function normalizeDigits(v: string): string {
  return v.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

export function coerceNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = parseFloat(
      normalizeDigits(v)
        .replace(/[٫,]/g, ".")
        .replace(/[^\d.\-]/g, ""),
    );
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/* ─────────────── Client-constraint compliance (PLAN-REGEN-CONSTRAINTS) ───────────────
 *
 * OWNER ORDER 2026-10-24 (items 1+2 — the measured keto-loss bug): the
 * client's COMMITTED constraints — diet type, allergies, banned/disliked
 * foods — are MANDATORY at every generation/regeneration stage (plan,
 * meal, single item). A provider answering 200 with a rice dish inside a
 * keto plan is as rejected as one answering garbage JSON.
 *
 * PURE MODULE law preserved: the token tables below are DATA (no
 * imports); matching is conservative substring containment over an
 * Arabic-aware normalization, and KNOWN dairy-alternative / keto-flour
 * wordings are guarded so plant milks and almond/coconut flour do not
 * false-trigger the dairy/grain tokens.
 * ──────────────────────────────────────────────────────────────────────── */

/** Diets the gate enforces on ITEMS (balanced = unconstrained). */
export type ConstraintDietType = "keto" | "low_carb" | "vegetarian" | "vegan";

/** The constraint bundle handed to every validator below. */
export type ClientItemConstraints = {
  dietType?: ConstraintDietType | null;
  /** Allergen tokens (already expanded by buildClientConstraints). */
  allergyTokens?: string[];
  /** Disliked / banned food tokens from the questionnaire. */
  bannedTokens?: string[];
};

/** Normalize a food name / token for matching: lowercase Latin, strip
 * Arabic diacritics + tatweel, unify alef/ya/ta-marbuta shapes, collapse
 * spaces. Best-effort — identical in spirit to the grounding module's
 * normalizeFoodName but kept LOCAL so this module stays import-free. */
function normFood(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ال(?=\S)/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Per-diet forbidden-token tables (normalized on first use). */
const DIET_FORBIDDEN_TOKENS: Record<ConstraintDietType, string[]> = {
  keto: [
    // grains & starches
    "ارز", "رز ابيض", "خبز", "عيش", "توست", "شوفان", "مكرونه", "مكرونة", "باستا", "سباجيتي",
    "بطاطس", "بطاطا", "كينوا", "برغل", "بلغر", "كسكسي", "فريك", "ذره", "ذرة", "فطير", "بيتزا", "كريب", "بان كيك",
    // sugars & syrups
    "سكر", "عسل", "مربي", "عصير", "غازيه", "مشروب سكري",
    // dried & high-sugar fruits
    "تمر", "بلح", "زبيب", "موز", "مانجو", "عنب", "تين", "اناناس", "بطيخ", "مشمس مجفف",
    // english
    "rice", "bread", "toast", "oats", "oatmeal", "pasta", "spaghetti", "potato", "sweet potato",
    "quinoa", "bulgur", "couscous", "corn", "pizza", "pancake", "sugar", "honey", "jam", "juice",
    "dates", "raisins", "banana", "mango", "grapes", "figs", "pineapple", "watermelon", "soda",
  ],
  low_carb: [
    // dense sugar sources only — starch portions ride the carb-gram ceiling
    "سكر", "عسل", "مربي", "عصير", "غازيه", "تمر", "بلح", "زبيب", "حلاوه", "حلاوة", "كيك", "بسكويت", "جاتو",
    "sugar", "honey", "jam", "juice", "dates", "raisins", "cake", "cookies", "soda",
  ],
  vegetarian: [
    "لحم", "دجاج", "فراخ", "سمك", "سلطات بحريه", "سلمون", "تونه", "تونة", "جمبري", "استاكوزا", "كابوريا",
    "انشوجه", "سردين", "ماكريل", "كفته", "كباب", "برجر", "سجق", "بسطرمه", "مرقه لحم", "مرقه دجاج", "ستيك",
    "meat", "beef", "lamb", "mutton", "chicken", "turkey", "fish", "salmon", "tuna", "shrimp", "prawn",
    "crab", "lobster", "anchovy", "sardine", "mackerel", "burger", "sausage", "bacon", "steak", "kebab", "meatball",
  ],
  vegan: [
    // vegetarian table + animal products + dairy (dairy tokens carry the
    // plant-alternative guard below — coconut/soy/oat/almond milks pass)
    "لحم", "دجاج", "فراخ", "سمك", "سلمون", "تونه", "تونة", "جمبري", "استاكوزا", "كابوريا", "انشوجه", "سردين",
    "ماكريل", "كفته", "كباب", "برجر", "سجق", "بسطرمه", "مرقه لحم", "مرقه دجاج", "ستيك",
    "بيض", "بيضه", "بيضة", "اومليت", "جلاتين",
    "جبن", "جبنة", "لبنه", "حليب", "زبادي", "قريش", "موزاريلا", "شيدر", "بارميزان",
    "كريمه", "كريمة", "زبده", "زبدة", "عسل", "كاسترد", "بوظه", "ايس كريم",
    "meat", "beef", "lamb", "chicken", "turkey", "fish", "salmon", "tuna", "shrimp", "prawn", "crab",
    "lobster", "anchovy", "sardine", "mackerel", "burger", "sausage", "bacon", "steak", "kebab", "meatball",
    "egg", "omelette", "omelet", "gelatin",
    "cheese", "milk", "yogurt", "yoghurt", "cream", "butter", "whey", "casein", "honey", "custard", "ice cream", "gelato",
  ],
};

/** Vegan dairy tokens carry a plant-alternative guard (coconut/soy/oat/
 * almond milks are vegan staples — they must NOT trip the dairy match).
 * Applies to BOTH the vegan diet tokens AND dairy-allergy family tokens. */
const VEGAN_DAIRY_TOKENS = [
  "جبن", "جبنة", "لبنه", "لبن زبادي", "حليب", "زبادي", "قريش", "موزاريلا", "شيدر", "بارميزان",
  "كريمه", "كريمة", "زبده", "زبدة", "عسل", "كاسترد", "بوظه", "ايس كريم",
  "cheese", "milk", "yogurt", "yoghurt", "cream", "butter", "whey", "casein", "honey", "custard", "ice cream", "gelato",
];
const PLANT_BASED_GUARD = /جوز هند|جوزهند|صويا|نباتي|شوفان|لوز|بذر الكتان|ارز|رز/;

/** Allergen category → family expansion (CONSERVATIVE: category words
 * only — a named single food stays a plain containment token). */
const ALLERGEN_EXPANSION: Array<{ category: RegExp; family: string[] }> = [
  { category: /مكسرات|نوت|nuts?\b|peanut|فول سوداني|فولسوداني/, family: [
    "جوز", "عين جمل", "بندق", "كاجو", "فستق", "لوز", "مكسرات", "زبدة الفول السوداني", "نوتيلا",
    "walnut", "hazelnut", "cashew", "pistachio", "almond", "nut", "peanut", "nutella",
  ] },
  { category: /بيض|eggs?\b/, family: ["بيض", "بيضه", "بيضة", "اومليت", "مايونيز", "egg", "omelette", "mayonnaise"] },
  { category: /البان|لبان|اجبان|dairy|milk|حليب|لبن/, family: [
    "حليب", "لبن", "زبادي", "جبن", "جبنة", "قريش", "لبنه", "موزاريلا", "شيدر", "كريمه", "كريمة", "زبده", "زبدة",
    "milk", "yogurt", "cheese", "cream", "butter", "whey", "casein",
  ] },
  { category: /سمك|اسماك|أسم|seafood|fish\b/, family: [
    "سمك", "سلمون", "تونه", "تونة", "جمبري", "استاكوزا", "كابوريا", "سردين", "ماكريل", "انشوجه",
    "fish", "salmon", "tuna", "shrimp", "prawn", "crab", "lobster", "sardine", "anchovy",
  ] },
  { category: /جلوتين|gluten|قمح|wheat\b/, family: [
    "خبز", "عيش", "توست", "مكرونه", "مكرونة", "شعير", "برغل", "فريك", "سباجيتي", "باستا",
    "bread", "pasta", "spaghetti", "barley", "bulgur", "toast",
  ] },
  { category: /صويا|soy|soya/, family: ["صويا", "توفو", "soy", "tofu", "edamame"] },
];

/** Stop words stripped when tokenizing the allergy/disliked free text. */
const TOKEN_STOP_WORDS = new Set([
  "حساسيه", "حساسية", "من", "و", "او", "أو", "لا", "يوجد", "ولا", "انا", "أنا", "عند", "عندي", "مع", "بدون",
  "allergy", "allergic", "to", "and", "or", "no", "none", "i", "have", "am",
]);

/** Tokenize a free-text allergy/disliked line into matchable tokens,
 * expanding category words to their food families. */
export function tokenizeConstraintText(raw: unknown): string[] {
  const text = String(raw || "");
  if (!text.trim()) return [];
  const normText = normFood(text);
  const words = normText.split(/[\s،,؛;/·+|]+/).filter(Boolean);
  const tokens = new Set<string>();
  for (const w of words) {
    if (w.length < 2 || TOKEN_STOP_WORDS.has(w)) continue;
    tokens.add(w);
    for (const { category, family } of ALLERGEN_EXPANSION) {
      // Category matched on the normalized word, the normalized FULL text
      // (hamza/article shapes like «ألبان» → «لبان» resolve here), or the
      // raw lowercased text (English categories) — union of the three.
      if (category.test(w) || category.test(normText) || category.test(text.toLowerCase())) {
        for (const f of family) tokens.add(normFood(f));
      }
    }
  }
  return [...tokens].filter(Boolean);
}

/** Build the constraint bundle from the raw client fields (pure). */
export function buildClientConstraints(opts: {
  dietType?: unknown;
  allergyText?: unknown;
  dislikedText?: unknown;
}): ClientItemConstraints {
  const dietRaw = String(opts.dietType ?? "").trim().toLowerCase();
  const dietType = (["keto", "low_carb", "vegetarian", "vegan"] as const).includes(
    dietRaw as ConstraintDietType,
  )
    ? (dietRaw as ConstraintDietType)
    : null;
  const allergyTokens = tokenizeConstraintText(opts.allergyText);
  const bannedTokens = tokenizeConstraintText(opts.dislikedText);
  return {
    ...(dietType ? { dietType } : {}),
    ...(allergyTokens.length > 0 ? { allergyTokens } : {}),
    ...(bannedTokens.length > 0 ? { bannedTokens } : {}),
  };
}

/** True when the constraints carry anything enforceable. */
export function hasItemConstraints(c?: ClientItemConstraints | null): boolean {
  return Boolean(c && (c.dietType || (c.allergyTokens?.length ?? 0) > 0 || (c.bannedTokens?.length ?? 0) > 0));
}

/**
 * Check ONE item against the client's constraints. Returns the violation
 * message (Arabic — it rides the repair directive verbatim) or null when
 * compliant / unconstrained.
 */
export function checkItemConstraints(
  food: string,
  macros: { carbs_g?: number | null },
  constraints?: ClientItemConstraints | null,
): string | null {
  if (!hasItemConstraints(constraints)) return null;
  const name = normFood(food);
  if (!name) return null;

  const hits = (tokens: string[]): string | null => {
    for (const rawTok of tokens) {
      const tok = normFood(rawTok);
      if (!tok || tok.length < 2) continue;
      // Plant-based guard: dairy tokens never fire on coconut/soy/oat/
      // almond milk or plant-cheese wordings ("حليب جوز الهند" is vegan).
      if (VEGAN_DAIRY_TOKENS.includes(rawTok) && PLANT_BASED_GUARD.test(name)) {
        continue;
      }
      if (name.includes(tok)) return tok;
    }
    return null;
  };

  if (constraints?.dietType) {
    const forbidden = hits(DIET_FORBIDDEN_TOKENS[constraints.dietType]);
    if (forbidden) {
      return `الصنف «${food}» مخالف لنظام ${constraints.dietType === "keto" ? "الكيتو" : constraints.dietType === "low_carb" ? "قليل الكربوهيدرات" : constraints.dietType === "vegan" ? "النباتي الصرف" : "النباتي"} (يحتوي «${forbidden}»)`;
    }
    const carbs = typeof macros.carbs_g === "number" ? macros.carbs_g : null;
    if (constraints.dietType === "keto" && carbs !== null && carbs > PLAN_AI_SANITY.ketoItemCarbsMax) {
      return `الصنف «${food}» يحمل ${Math.round(carbs)}جم كربوهيدرات — أعلى من سقف صنف الكيتو (${PLAN_AI_SANITY.ketoItemCarbsMax}جم)`;
    }
    if (constraints.dietType === "low_carb" && carbs !== null && carbs > PLAN_AI_SANITY.lowCarbItemCarbsMax) {
      return `الصنف «${food}» يحمل ${Math.round(carbs)}جم كربوهيدرات — أعلى من سقف صنف قليل الكربوهيدرات (${PLAN_AI_SANITY.lowCarbItemCarbsMax}جم)`;
    }
  }
  if (constraints?.allergyTokens?.length) {
    const allergen = hits(constraints.allergyTokens);
    if (allergen) {
      return `الصنف «${food}» يحتوي «${allergen}» — من ضمن حساسيات العميل المسجلة`;
    }
  }
  if (constraints?.bannedTokens?.length) {
    const banned = hits(constraints.bannedTokens);
    if (banned) {
      return `الصنف «${food}» يحتوي «${banned}» — من ضمن الأطعمة الممنوعة/غير المحببة للعميل`;
    }
  }
  return null;
}

/* ─────────────────────────── Item normalization ─────────────────────────── */

export type ItemVerdict =
  | { ok: true; value: AIItemLike }
  | { ok: false; error: string };

/** Unwrap one level of common model wrappers around a single item:
 * {item:{…}} · {replacement:{…}} · {food_item:{…}} · {new_item:{…}} —
 * REGEN-RELIABILITY FIX 2026-10-24 (owner order item 2, the live measured
 * class from run 40091765755): providers kept answering 200 with the
 * replacement NESTED under a wrapper key (16-token payloads) while the
 * gate read food/name only at the TOP level → «item has no food name»
 * rejections → the job failed permanently although the data inside was
 * fine. Same unwrap law the plan-level gate (unwrapMeals) already has. */
const ITEM_WRAPPER_KEYS = ["item", "replacement", "food_item", "new_item"] as const;

function unwrapItem(raw: Record<string, unknown>): Record<string, unknown> {
  const hasName = typeof raw.food === "string" || typeof raw.name === "string";
  if (hasName) return raw;
  for (const key of ITEM_WRAPPER_KEYS) {
    const inner = raw[key];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
  }
  return raw;
}

/**
 * Normalize ONE food item: coerce calories/protein, bound them, and —
 * when a grounding callback is provided — cross-check the model's calorie
 * estimate against the food library (per-100g × parsed grams). A
 * deviation beyond PLAN_AI_SANITY.groundingTolerance REPLACES the model's
 * numbers with the library's (the owner order: use the real database,
 * not invented values).
 */
export function normalizeAIItem(
  raw: unknown,
  groundItem?: GroundItemFn | null,
): ItemVerdict {
  const rawObj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const it = unwrapItem(rawObj);
  const food = str(it.food ?? it.name, PLAN_AI_SANITY.foodNameMax);
  if (!food) return { ok: false, error: "item has no food name" };
  const amount = str(it.amount, PLAN_AI_SANITY.amountMax);

  let calories = coerceNumber(it.calories ?? it.kcal ?? it.calories_g);
  if (calories === null || calories < PLAN_AI_SANITY.itemKcalMin || calories > PLAN_AI_SANITY.itemKcalMax) {
    return { ok: false, error: `item "${food}" calories outside ${PLAN_AI_SANITY.itemKcalMin}-${PLAN_AI_SANITY.itemKcalMax}` };
  }
  const proteinRaw = coerceNumber(it.protein_g ?? it.protein);
  let protein_g: number | null =
    proteinRaw !== null && proteinRaw >= 0 && proteinRaw <= PLAN_AI_SANITY.itemProteinMax
      ? proteinRaw
      : null;
  const carbsRaw = coerceNumber(it.carbs_g ?? it.carbs);
  let carbs_g: number | null =
    carbsRaw !== null && carbsRaw >= 0 && carbsRaw <= PLAN_AI_SANITY.itemProteinMax ? carbsRaw : null;
  const fatRaw = coerceNumber(it.fat_g ?? it.fat);
  let fat_g: number | null =
    fatRaw !== null && fatRaw >= 0 && fatRaw <= PLAN_AI_SANITY.itemProteinMax ? fatRaw : null;

  // ── Food-library grounding (owner order item 3: «الاستفادة الصحيحة من
  //    قاعدة الأطعمة بدل اختلاق بيانات غير موثوقة»). The callback itself
  //    is total (never throws, never rejects) — a grounding miss is a
  //    no-op and the model's bounded estimate stands.
  if (groundItem) {
    try {
      const grounded = groundItem({ food, amount, calories: Math.round(calories) });
      if (grounded && Number.isFinite(grounded.calories) && grounded.calories > 0) {
        const deviation = Math.abs(calories - grounded.calories) / grounded.calories;
        if (deviation > PLAN_AI_SANITY.groundingTolerance) {
          calories = Math.round(grounded.calories);
          if (Number.isFinite(grounded.protein_g)) protein_g = grounded.protein_g as number;
          if (Number.isFinite(grounded.carbs_g)) carbs_g = grounded.carbs_g as number;
          if (Number.isFinite(grounded.fat_g)) fat_g = grounded.fat_g as number;
        }
      }
    } catch {
      /* grounding is best-effort by contract */
    }
  }

  const alternatives = str(it.alternatives, 200) || undefined;

  // ── MACRO↔CALORIE coherence (PLAN-REGEN-CONSTRAINTS 2026-10-24, owner
  //    order item 2: «كشف التناقض بين السعرات المحسوبة من الماكروز والسعرات
  //    المعلنة»). Runs on the FINAL numbers (post-grounding). Asymmetric
  //    bands — see PLAN_AI_SANITY above for the fiber rationale. Only
  //    fires when the model supplied ALL THREE macros; partial macro sets
  //    are estimates, not contradictions (documented honest limit).
  if (protein_g !== null && carbs_g !== null && fat_g !== null) {
    const kcalFromMacros = protein_g * 4 + carbs_g * 4 + fat_g * 9;
    if (kcalFromMacros > 0) {
      if (calories > kcalFromMacros * (1 + PLAN_AI_SANITY.macroCalorieInflationTolerance)) {
        return {
          ok: false,
          error: `item "${food}" calories (${Math.round(calories)}) contradict its macros (P${Math.round(protein_g)}·C${Math.round(carbs_g)}·F${Math.round(fat_g)} → ${Math.round(kcalFromMacros)} kcal by 4/4/9) — inflated calories`,
        };
      }
      if (kcalFromMacros > calories * (1 + PLAN_AI_SANITY.macroCalorieDeflationTolerance)) {
        return {
          ok: false,
          error: `item "${food}" macros (P${Math.round(protein_g)}·C${Math.round(carbs_g)}·F${Math.round(fat_g)} → ${Math.round(kcalFromMacros)} kcal) contradict its declared ${Math.round(calories)} kcal`,
        };
      }
    }
  }

  return {
    ok: true,
    value: {
      food,
      amount,
      calories: Math.round(calories),
      ...(protein_g !== null ? { protein_g: Math.round(protein_g * 10) / 10 } : {}),
      ...(carbs_g !== null ? { carbs_g: Math.round(carbs_g * 10) / 10 } : {}),
      ...(fat_g !== null ? { fat_g: Math.round(fat_g * 10) / 10 } : {}),
      ...(alternatives ? { alternatives } : {}),
    },
  };
}

/** Recompute meal totals from normalized items — model totals never trusted. */
function recomputeMealTotals(meal: AIMealLike): AIMealLike {
  const items = meal.items ?? [];
  const anyProtein = items.some((i) => typeof i.protein_g === "number");
  return {
    ...meal,
    total_calories: items.reduce((s, i) => s + (i.calories || 0), 0),
    // When the model gave per-item protein we recompute; when it gave NO
    // item-level protein at all we keep its meal-level estimate (if any)
    // rather than displaying a misleading 0.
    total_protein_g: anyProtein
      ? Math.round(items.reduce((s, i) => s + (i.protein_g || 0), 0) * 10) / 10
      : meal.total_protein_g,
  };
}

/** Unwrap common model wrappers ({plan:{meals}}, {day_plan:{meals}}…). */
function unwrapMeals(raw: unknown): unknown[] | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.meals)) return obj.meals;
  for (const key of ["plan", "day_plan", "dayPlan", "day", "result", "data"]) {
    const inner = obj[key];
    if (inner && typeof inner === "object" && Array.isArray((inner as Record<string, unknown>).meals)) {
      return (inner as Record<string, unknown>).meals as unknown[];
    }
  }
  return null;
}

/* ─────────────────── Full nutrition plan validation ─────────────────── */

export type NutritionPlanVerdict =
  | { ok: true; value: { meals: AIMealLike[]; meals_total_calories: number } }
  | { ok: false; error: string };

/**
 * The FULL-PLAN gate for generateNutritionPlanAI: meals bounded, items
 * bounded + coerced + grounded, totals recomputed from items, and the
 * whole day closes within ±25% of the server-computed target. This is
 * the gate the paid service owes its customers.
 */
export function validateNutritionPlanAIOutput(
  parsed: unknown,
  targetCalories: number,
  groundItem?: GroundItemFn | null,
  /** PLAN-REGEN-CONSTRAINTS 2026-10-24: the client's committed diet +
   * allergy/banned tokens — enforced per item (a rice dish inside a keto
   * plan is rejected exactly like a shapeless payload). */
  constraints?: ClientItemConstraints | null,
): NutritionPlanVerdict {
  const mealsRaw = unwrapMeals(parsed);
  if (!mealsRaw) return { ok: false, error: "model returned no meals array" };
  if (mealsRaw.length < PLAN_AI_SANITY.mealCountMin || mealsRaw.length > PLAN_AI_SANITY.mealCountMax) {
    return {
      ok: false,
      error: `plan must carry ${PLAN_AI_SANITY.mealCountMin}-${PLAN_AI_SANITY.mealCountMax} meals (got ${mealsRaw.length})`,
    };
  }

  const meals: AIMealLike[] = [];
  for (const m of mealsRaw) {
    const meal = (m && typeof m === "object" ? m : {}) as Record<string, unknown>;
    const name = str(meal.name, PLAN_AI_SANITY.mealNameMax);
    if (!name) return { ok: false, error: "a meal has no name" };
    const rawItems = Array.isArray(meal.items)
      ? meal.items
      : Array.isArray(meal.foods)
        ? meal.foods
        : [];
    if (rawItems.length < PLAN_AI_SANITY.itemsPerMealMin || rawItems.length > PLAN_AI_SANITY.itemsPerMealMax) {
      return {
        ok: false,
        error: `meal "${name}" must carry ${PLAN_AI_SANITY.itemsPerMealMin}-${PLAN_AI_SANITY.itemsPerMealMax} items (got ${rawItems.length})`,
      };
    }
    const items: AIItemLike[] = [];
    for (const rawItem of rawItems) {
      const v = normalizeAIItem(rawItem, groundItem);
      if (!v.ok) return { ok: false, error: `meal "${name}": ${v.error}` };
      const violation = checkItemConstraints(v.value.food, v.value, constraints);
      if (violation) return { ok: false, error: `meal "${name}": ${violation}` };
      items.push(v.value);
    }
    const modelTotalProtein = coerceNumber(meal.total_protein_g ?? meal.total_protein);
    meals.push(
      recomputeMealTotals({
        name,
        time: str(meal.time, 60) || undefined,
        notes: str(meal.notes, 300) || undefined,
        items,
        total_calories: 0,
        ...(modelTotalProtein !== null && modelTotalProtein > 0
          ? { total_protein_g: modelTotalProtein }
          : {}),
      }),
    );
  }

  const mealsTotal = meals.reduce((s, m) => s + (m.total_calories || 0), 0);
  if (targetCalories > 0) {
    const drift = Math.abs(mealsTotal - targetCalories) / targetCalories;
    if (drift > PLAN_AI_SANITY.planDriftTolerance) {
      return {
        ok: false,
        error: `meals sum ${mealsTotal} kcal drifted beyond ±${Math.round(PLAN_AI_SANITY.planDriftTolerance * 100)}% of the ${targetCalories} target`,
      };
    }
  }
  return { ok: true, value: { meals, meals_total_calories: mealsTotal } };
}

/* ─────────────────── Single-meal regeneration gate ─────────────────── */

export type MealRegenVerdict =
  | { ok: true; value: AIMealLike }
  | { ok: false; error: string };

/**
 * The MEAL-REGENERATION gate: one meal, items coerced + grounded, totals
 * recomputed, and the replacement closes within ±20% of the meal's own
 * calorie target (the exact promise the prompt makes).
 */
export function validateRegeneratedMeal(
  raw: unknown,
  targetCalories: number,
  groundItem?: GroundItemFn | null,
  /** PLAN-REGEN-CONSTRAINTS 2026-10-24: diet/allergy constraints of the
   * plan the meal belongs to — a keto plan's replacement meal may not
   * come back with rice at matching calories. */
  constraints?: ClientItemConstraints | null,
): MealRegenVerdict {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  // Accept both { meal: {...} } and a flat meal object.
  const mealRaw = (obj.meal && typeof obj.meal === "object" ? obj.meal : obj) as Record<string, unknown>;
  const name = str(mealRaw.name, PLAN_AI_SANITY.mealNameMax) || "وجبة بديلة";
  const rawItems = Array.isArray(mealRaw.items)
    ? mealRaw.items
    : Array.isArray(mealRaw.foods)
      ? mealRaw.foods
      : [];
  if (rawItems.length < PLAN_AI_SANITY.itemsPerMealMin || rawItems.length > PLAN_AI_SANITY.itemsPerMealMax) {
    return {
      ok: false,
      error: `الوجبة البديلة لازم تحمل ${PLAN_AI_SANITY.itemsPerMealMin}-${PLAN_AI_SANITY.itemsPerMealMax} أصناف (وصلت ${rawItems.length})`,
    };
  }
  const items: AIItemLike[] = [];
  for (const rawItem of rawItems) {
    const v = normalizeAIItem(rawItem, groundItem);
    if (!v.ok) return { ok: false, error: v.error };
    const violation = checkItemConstraints(v.value.food, v.value, constraints);
    if (violation) return { ok: false, error: violation };
    items.push(v.value);
  }
  const modelTotalProtein = coerceNumber(mealRaw.total_protein_g ?? mealRaw.total_protein);
  const meal = recomputeMealTotals({
    name,
    time: str(mealRaw.time, 60) || undefined,
    notes: str(mealRaw.notes, 300) || undefined,
    items,
    total_calories: 0,
    ...(modelTotalProtein !== null && modelTotalProtein > 0 ? { total_protein_g: modelTotalProtein } : {}),
  });

  if (targetCalories > 0) {
    const drift = Math.abs(meal.total_calories - targetCalories) / targetCalories;
    if (drift > PLAN_AI_SANITY.mealDriftTolerance) {
      return {
        ok: false,
        error: `مجموع الوجبة البديلة (${meal.total_calories} سعرة) ابتعد أكتر من ±${Math.round(PLAN_AI_SANITY.mealDriftTolerance * 100)}% عن المطلوب (${targetCalories} سعرة)`,
      };
    }
  }
  return { ok: true, value: meal };
}

/* ─────────────────── Single food-item regeneration gate ─────────────────── */

export type FoodItemRegenVerdict =
  | { ok: true; value: AIItemLike }
  | { ok: false; error: string };

/**
 * The ITEM-REGENERATION gate: a valid replacement food/amount with
 * calories within ±15% of the original item (the prompt's promise —
 * finally enforced). Library grounding runs BEFORE the bound check, so
 * an inflated model estimate is pulled toward the per-100g truth first;
 * a grounded value still outside the band is honestly rejected (the
 * repair retry then asks for adjusted grams).
 */
export function validateRegeneratedFoodItem(
  raw: unknown,
  originalCalories: number,
  groundItem?: GroundItemFn | null,
  /** PLAN-REGEN-CONSTRAINTS 2026-10-24: diet/allergy constraints — the
   * ±15% calorie-equivalent replacement must ALSO respect the client's
   * committed diet and allergies (owner order item 1). */
  constraints?: ClientItemConstraints | null,
): FoodItemRegenVerdict {
  const v = normalizeAIItem(raw, groundItem);
  if (!v.ok) return { ok: false, error: v.error };
  const violation = checkItemConstraints(v.value.food, v.value, constraints);
  if (violation) return { ok: false, error: violation };
  const target = Math.max(1, originalCalories);
  const drift = Math.abs(v.value.calories - target) / target;
  if (drift > PLAN_AI_SANITY.itemDriftTolerance + 1e-9) {
    return {
      ok: false,
      error: `سعرات الصنف البديل (${v.value.calories}) خارج نطاق ±${Math.round(PLAN_AI_SANITY.itemDriftTolerance * 100)}% من الأصل (${Math.round(target)})`,
    };
  }
  return { ok: true, value: v.value };
}

/* ─────────────────── Workout validation ─────────────────── */

function normalizeExercise(raw: unknown): AIWorkoutExerciseLike | null {
  const ex = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = str(ex.name, 80);
  if (!name) return null;
  let sets = coerceNumber(ex.sets);
  if (sets === null || sets < PLAN_AI_SANITY.setsMin) sets = 3;
  sets = clamp(Math.round(sets), PLAN_AI_SANITY.setsMin, PLAN_AI_SANITY.setsMax);
  return {
    name,
    sets,
    reps: str(ex.reps, 40) || "10-12",
    rest: str(ex.rest, 40) || "90 ثانية",
    notes: str(ex.notes, 300),
  };
}

export type WorkoutDayRegenVerdict =
  | { ok: true; value: AIWorkoutDayLike }
  | { ok: false; error: string };

/**
 * The DAY-REGENERATION gate: 3-8 exercises, each with a real name and
 * bounded sets — a day with zero or two exercises is rejected instead of
 * silently hollowing the member's week.
 */
export function validateRegeneratedWorkoutDay(
  raw: unknown,
  originalDay: { day: string; focus: string },
): WorkoutDayRegenVerdict {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawExercises = Array.isArray(obj.exercises) ? obj.exercises : [];
  if (rawExercises.length < PLAN_AI_SANITY.dayExerciseMin || rawExercises.length > PLAN_AI_SANITY.dayExerciseMax) {
    return {
      ok: false,
      error: `اليوم البديل لازم يحمل ${PLAN_AI_SANITY.dayExerciseMin}-${PLAN_AI_SANITY.dayExerciseMax} تمارين (وصلت ${rawExercises.length})`,
    };
  }
  const exercises: AIWorkoutExerciseLike[] = [];
  for (const rawEx of rawExercises) {
    const ex = normalizeExercise(rawEx);
    if (!ex) return { ok: false, error: "أحد التمارين بلا اسم صالح" };
    exercises.push(ex);
  }
  const day = str(obj.day, 80) || originalDay.day;
  const focus = str(obj.focus, 120) || originalDay.focus;
  return { ok: true, value: { day, focus, isRest: false, exercises } };
}

export type WorkoutPlanVerdict =
  | { ok: true; value: { days: AIWorkoutDayLike[] } }
  | { ok: false; error: string };

/**
 * The FULL-WORKOUT gate for generateWorkoutPlanAI: 3-8 days, training
 * days carrying 3-8 real exercises with bounded sets, rest days emptied.
 */
export function validateWorkoutPlanAIOutput(parsed: unknown): WorkoutPlanVerdict {
  const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const daysRaw = Array.isArray(obj.days) ? obj.days : [];
  if (daysRaw.length < PLAN_AI_SANITY.dayCountMin || daysRaw.length > PLAN_AI_SANITY.dayCountMax) {
    return {
      ok: false,
      error: `البرنامج لازم يحمل ${PLAN_AI_SANITY.dayCountMin}-${PLAN_AI_SANITY.dayCountMax} أيام (وصلت ${daysRaw.length})`,
    };
  }
  const days: AIWorkoutDayLike[] = [];
  for (const d of daysRaw) {
    const day = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
    const name = str(day.day, 40);
    if (!name) return { ok: false, error: "أحد الأيام بلا اسم" };
    const focus = str(day.focus, 120) || "تدريب";
    const isRest = day.isRest === true || /راحة|rest/i.test(focus);
    if (isRest) {
      days.push({ day: name, focus, isRest: true, exercises: [] });
      continue;
    }
    const rawExercises = Array.isArray(day.exercises) ? day.exercises : [];
    if (rawExercises.length < PLAN_AI_SANITY.dayExerciseMin || rawExercises.length > PLAN_AI_SANITY.dayExerciseMax) {
      return {
        ok: false,
        error: `اليوم "${name}" لازم يحمل ${PLAN_AI_SANITY.dayExerciseMin}-${PLAN_AI_SANITY.dayExerciseMax} تمارين (وصلت ${rawExercises.length})`,
      };
    }
    const exercises: AIWorkoutExerciseLike[] = [];
    for (const rawEx of rawExercises) {
      const ex = normalizeExercise(rawEx);
      if (!ex) return { ok: false, error: `تمرين بلا اسم في اليوم "${name}"` };
      exercises.push(ex);
    }
    days.push({ day: name, focus, isRest: false, exercises });
  }
  return { ok: true, value: { days } };
}
