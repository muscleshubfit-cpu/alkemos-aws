/**
 * src/lib/blog-semantic.ts — BLOG-DIVERSITY-ENGINE (owner order 2026-11-13)
 * ─────────────────────────────────────────────────────────────────────────
 * SEMANTIC topic diversity for the automated blog pipeline (AR + EN).
 *
 * OWNER ORDER (2026-11-13 «تحسين نظام اختيار أفكار مقالات المدونة… منع
 * التكرار الدلالي، وليس مجرد تكرار العنوان أو الكلمات»): the legacy
 * dedup (`isDuplicateTopic` in blog-topics.ts) is purely LEXICAL — substring
 * + focus-keyword word overlap. Two articles can carry ZERO shared words
 * yet answer the SAME question («كم ساعة نوم يحتاج الرياضي؟» vs «المدة
 * المثالية للنوم لأفضل استشفاء عضلي») and the lexical gate never fires.
 * This module adds the SEMANTIC layer:
 *
 *   1. CONCEPT SIGNATURES — normalized concept sets (Arabic affix-stripped,
 *      diacritics-folded, light-stemmed) compared by Jaccard similarity, so
 *      a paraphrase with different wording still collides.
 *   2. DOMAIN TAXONOMY — the fitness identity's editorial domains
 *      (nutrition · muscle & strength · fat loss · training · recovery ·
 *      supplements · injury prevention · metabolic/aging · mistakes & myths ·
 *      applied research · practical guides). Coverage-gap analysis tells P0
 *      which domains are UNDER-covered (flexible balancing — never a forced
 *      equal split) and which are saturated.
 *   3. SEARCH-INTENT CLASSES — question / how-to / comparison / myth /
 *      number-list / plan — a new topic that shares domain AND intent with
 *      a recent article collides at a lower similarity threshold.
 *   4. ANGLE ROTATION (LRU) — the editorial angle (ARTICLE_ANGLES registry
 *      in blog-pipeline.ts) rotates least-recently-used instead of pure
 *      random, so consecutive articles stop sharing one structural mold.
 *
 * ALKEMOS FITNESS IDENTITY LAW (owner order §7): every domain below is a
 * TRAINING / SPORTS-NUTRITION / RECOVERY / APPLIED-SCIENCE domain. General
 * medicine, disease, diagnosis and treatment topics are OUT OF SCOPE by
 * taxonomy design — the dictionaries contain no medical-disease vocabulary,
 * and the P0 directive explicitly anchors suggestions to athletic
 * performance.
 *
 * PURE MODULE — no DB, no AI calls (unit-tested in __tests__/blog-semantic.test.ts).
 * DB helpers that feed it live in blog-queue.ts / blog-topics.ts.
 */

// ─────────────────────────────────────────────────────────────────
// Normalization (AR + EN)
// ─────────────────────────────────────────────────────────────────

/** Arabic diacritics + tatweel stripped, letter forms folded. */
const AR_DIACRITICS = /[\u064B-\u0652\u0640]/g;

/** Fold Arabic letter variants onto their base forms (أإآ→ا · ى→ي · ة→ه · ؤ→و · ئ→ي). */
function foldArabic(s: string): string {
  return s
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

/** Strip Arabic clitic prefixes (ال · وال · بال · كال · فال · لل · و) and the
 *  leading و conjunction, so «العضلات» and «بالعضلات» and «عضلات» share one root. */
function stripArabicAffixes(w: string): string {
  let out = w;
  for (let i = 0; i < 2; i += 1) {
    if (out.length > 4 && out.startsWith("وال")) out = out.slice(3);
    else if (out.length > 4 && (out.startsWith("بال") || out.startsWith("كال") || out.startsWith("فال"))) out = out.slice(3);
    else if (out.length > 3 && out.startsWith("ال")) out = out.slice(2);
    else if (out.length > 3 && out.startsWith("لل")) out = out.slice(2);
    else break;
  }
  return out;
}

/** Light EN stem: plural / gerund / past-tense endings. */
function lightEnStem(w: string): string {
  if (w.length > 5 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && (w.endsWith("es") || w.endsWith("s")) && !w.endsWith("ss")) return w.slice(0, -1);
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 5 && w.endsWith("ed")) return w.slice(0, -2);
  return w;
}

const EN_STOPWORDS = new Set([
  "the", "a", "an", "of", "to", "for", "in", "on", "at", "with", "and", "or",
  "how", "what", "why", "when", "best", "vs", "is", "are", "do", "does",
  "your", "you", "it", "its", "this", "that", "from", "by", "be", "can",
  "should", "will", "my", "me", "guide", "complete", "ultimate", "really",
]);

const AR_STOPWORDS = new Set([
  "في", "من", "على", "عن", "مع", "أو", "او", "و", "ثم", "كيف", "ما", "متى",
  "هل", "لماذا", "أين", "اليومي", "يوميا", "افضل", "أفضل", "دليل", "الكامل",
  "الشامل", "هو", "هي", "انا", "أنا", "انت", "أنت", "لا", "نعم", "قد",
  "بين", "بدون", "خلال", "بعد", "قبل", "عند", "لكل", "الى", "إلى", "حول",
]);

/** Normalize one raw token to its comparable root form ("" = drop). */
export function normalizeToken(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/[\u0600-\u06FF]/.test(t)) {
    const folded = foldArabic(t.replace(AR_DIACRITICS, ""));
    const bare = stripArabicAffixes(folded);
    const w = bare.length >= 2 ? bare : folded;
    return AR_STOPWORDS.has(w) || AR_STOPWORDS.has(folded) ? "" : w;
  }
  const lower = t.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (lower.length < 3) return "";
  const stemmed = lightEnStem(lower);
  return EN_STOPWORDS.has(stemmed) || EN_STOPWORDS.has(lower) ? "" : stemmed;
}

/** Concept signature of a free-text string (topic / title / keyword).
 * BLOG-DIVERSITY-ENGINE R2: every normalized token is additionally mapped
 * through the SYNONYM_GROUPS canon (ساعه/مده/وقت → dur · حرق/خساره/نزول →
 * lose · عضلات/تضخيم → muscle …), so a reworded topic that swaps SYNONYMS
 * still lands on the same concept set — «المدة المثالية للنوم» and «كم
 * ساعة نوم يحتاج الرياضي» share {dur, sleep}, not just {نوم}. */
const SYNONYM_GROUPS: Record<string, string[]> = {
  sleep: ["نوم", "sleep"],
  dur: ["ساعه", "ساعات", "مده", "مدد", "وقت", "hour", "duration"],
  lose: ["حرق", "خساره", "نزول", "تنحيف", "burn", "lose", "loss", "cutting"],
  muscle: ["عضلات", "عضله", "تضخيم", "hypertrophy", "muscle"],
  protein: ["بروتين", "protein"],
  workout: ["تمرين", "تمارين", "تدريب", "workout", "exercise", "train"],
  meal: ["وجبه", "وجبات", "meal"],
  recovery: ["تعافي", "استشفاء", "recovery"],
  supplement: ["مكمل", "مكملات", "supplement"],
  hydration: ["ماء", "ترطيب", "water", "hydration"],
  build: ["بناء", "زياده", "اكتساب", "build", "gain", "bulk"],
  home: ["منزل", "منزلي", "منزليه", "home"],
  plan: ["خطه", "برنامج", "جدول", "plan", "program", "routine", "schedule"],
  mistake: ["خطا", "اخطاء", "خرافه", "خرافات", "اسطوره", "mistake", "myth"],
  strength: ["قوه", "strength"],
  stretch: ["اطاله", "مرونه", "stretch", "flexibility"],
  cardio: ["كارديو", "cardio"],
  weight: ["وزن", "اوزان", "weight"],
  prep: ["تحضير", "تجهيز", "prep"],
  fasting: ["صيام", "fasting"],
  ramadan: ["رمضان", "ramadan"],
  belly: ["بطن", "كرش", "belly"],
  aging: ["تقدم", "عمر", "كبار", "aging", "older", "senior"],
  sarcopenia: ["ساركوبينيا", "sarcopenia"],
  knee: ["ركبه", "knee"],
  shoulder: ["كتف", "shoulder"],
  back: ["ظهر", "back"],
  pain: ["الم", "ام", "لام", "وجع", "اوجاع", "pain", "ache"],
  nutrition: ["تغذيه", "nutrition"],
  checklist: ["قائمه", "checklist"],
  gym: ["جيم", "نادي", "gym"],
};

/** member (normalized) → canonical concept id. */
const SYNONYM_INDEX: ReadonlyMap<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [canon, members] of Object.entries(SYNONYM_GROUPS)) {
    for (const w of members) m.set(w, canon);
  }
  return m;
})();

/** Canonical concept id for a normalized token (identity when not a member). */
export function canonicalConcept(w: string): string {
  return SYNONYM_INDEX.get(w) ?? w;
}

export function extractConcepts(text: string): Set<string> {
  const out = new Set<string>();
  if (!text) return out;
  for (const raw of text.split(/[\s,،؛::\-–—/\\()[\]{}؟?!."'\u060C]+/)) {
    const w = normalizeToken(raw);
    if (w) out.add(canonicalConcept(w));
  }
  return out;
}

/** Jaccard similarity between two concept sets (0..1). */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ─────────────────────────────────────────────────────────────────
// Search-intent classes
// ─────────────────────────────────────────────────────────────────

export type SearchIntent =
  | "question"
  | "how-to"
  | "comparison"
  | "myth"
  | "number-list"
  | "plan"
  | "descriptive";

/**
 * NOTE ON \b AND ARABIC: JS \b is defined over [A-Za-z0-9_] — Arabic letters
 * are all NON-word characters, so `\b` before an Arabic token NEVER fires.
 * Arabic segments below deliberately use plain substrings (or ^ anchors);
 * \b is reserved for the Latin segments only.
 */
const INTENT_PATTERNS: Array<[SearchIntent, RegExp]> = [
  // NOTE (R2): Arabic segments use fold-tolerant classes (خط[أا] · شائع[هة]
  // · طريق[هة] · أ?خطاء) and word-start anchors with lookbehind — the bare
  // substring «روتين» used to fire inside «البروتين» (protein!), and the
  // bare «اخطاء شائعه» never fired on real titles («أخطاء شائعة»).
  [
    "myth",
    /خراف|اسطور[هة]|خط[أا]\s?شائع|أ?خطاء\s+شائع[هة]?|مفهوم\s?خاط[ئي]|حقيق|myth|misconception|mistake|debunk|truth about/i,
  ],
  ["comparison", /مقابل|الفرق بين|يقارن|افضل[^.]{0,30}(ام|أم)\s|\bvs\.?\b|\bversus\b|difference between|compare/i],
  ["plan", /(?<![ء-ي])(?:ال)?(?:خطة|برنامج|جدول|روتين)|\bplan\b|\bprogram\b|\broutine\b|\bschedule\b|\btemplate\b/i],
  ["how-to", /كيف|طريق[هة]|خطوات|how to|ways to|steps to|guide to/i],
  // Arabic question openers use a NEGATIVE ARABIC-LETTER LOOKAHEAD (not
  // \b — Arabic letters are non-word chars in JS, so \b never fires
  // there; «كم ساعة» would silently fall through to "descriptive").
  [
    "question",
    /[؟?]$|^\s*(?:هل|كم|ماذا|لماذا|متى|أين|مين)(?![ء-ي])|^\s*(is|are|do|does|can|should|what|how many|how much|when|why|who)\b/i,
  ],
  ["number-list", /^\s*\d+\s+\S|\d+\s+(طرق|طريق|أ?سباب|نصائح|أ?خطاء)|\b\d+\s+(ways|tips|reasons|mistakes|exercises|foods|steps)\b|\b(top\s*\d+|best\s+\d+)\b/i],
];

/** Classify a topic/title into its dominant search-intent class. */
export function detectSearchIntent(text: string): SearchIntent {
  const t = (text || "").trim();
  if (!t) return "descriptive";
  for (const [intent, re] of INTENT_PATTERNS) {
    if (re.test(t)) return intent;
  }
  return "descriptive";
}

// ─────────────────────────────────────────────────────────────────
// Domain taxonomy (the fitness identity's editorial domains)
// ─────────────────────────────────────────────────────────────────

export type DomainId =
  | "nutrition"
  | "muscle-strength"
  | "fat-loss"
  | "training"
  | "recovery"
  | "supplements"
  | "injury-prevention"
  | "metabolic-aging"
  | "mistakes-myths"
  | "research-applied"
  | "practical-guides";

export type FitnessDomain = {
  id: DomainId;
  en: string;
  ar: string;
  /** Concept roots (normalized) that mark the domain — AR and EN mixed. */
  markers: string[];
};

/**
 * The 11 editorial domains of the owner order (2026-11-13 §1/§7), kept
 * INSIDE the Alkemos fitness identity: training, sports nutrition,
 * recovery, applied science. Markers are normalizeToken-shaped roots
 * (e.g. «التغذية» → تغذيه, «muscle building» → muscle/build).
 */
export const FITNESS_DOMAINS: readonly FitnessDomain[] = [
  {
    id: "nutrition",
    en: "Sports nutrition & diet quality",
    ar: "التغذية الرياضية وجودة النظام الغذائي",
    markers: [
      "تغذيه", "وجبه", "وجبات", "سعرات", "سعره", "كارب", "كربوهيدرات", "بروتين", "دهون", "ماكرو",
      "ميكرو", "فيتامين", "معدن", "الياف", "اكل", "طعام", "مطبخ", "شراب", "ماء", "ترطيب", "سكر",
      "نظام غذائي", "حميه", "صيام", "رمضان", "nutrition", "meal", "calorie", "carb", "protein",
      "fat", "macro", "micronutrient", "fiber", "diet", "hydration", "fasting", "ramadan", "food",
    ],
  },
  {
    id: "muscle-strength",
    en: "Muscle building & strength",
    ar: "بناء العضلات والقوة",
    markers: [
      "عضلات", "عضله", "تضخيم", "قوه", "مقاومه", "حجم", "تدريب", "تكرار", "مجموعه", "ضغط",
      "سحب", "سكوات", "ديدلفت", "بار", "دمبل", "hypertrophy", "muscle", "strength", "squat",
      "deadlift", "bench", "press", "pull", "rep", "set", "volume", "overload",
    ],
  },
  {
    id: "fat-loss",
    en: "Fat loss & weight management",
    ar: "خسارة الدهون وإدارة الوزن",
    markers: [
      "حرق", "دهون", "خساره", "وزن", "نزول", "تعريف", "بطن", "كرش", "عجز", "ايض", "تصفية",
      "fat loss", "weight", "deficit", "cutting", "lean", "belly", "abs", "metabolism", "lose",
    ],
  },
  {
    id: "training",
    en: "Workout programming, home & athletic training",
    ar: "برمجة التدريب والتدريب المنزلي والرياضي",
    markers: [
      "تمرين", "تمارين", "برنامج", "تقسيم", "روتين", "منزل", "منزلي", "جيم", "نادي", "كارديو",
      "هيت", "تحمل", "مرونه", "حركه", "اداء", "سرعه", "workout", "exercise", "home", "gym",
      "cardio", "hiit", "endurance", "mobility", "athletic", "sport", "split", "routine",
      "plan", "stretch",
    ],
  },
  {
    id: "recovery",
    en: "Recovery, sleep & regeneration",
    ar: "التعافي والنوم والاستشفاء",
    markers: [
      "نوم", "تعافي", "استشفاء", "راحه", "ارهاق", "توتر", "كورتيزول", "ملحيه", "تدليك", "بارد",
      "sleep", "recovery", "rest", "deload", "fatigue", "stress", "cortisol", "regeneration",
      "massage", "cold",
    ],
  },
  {
    id: "supplements",
    en: "Supplements & evidence",
    ar: "المكملات والأدلة العلمية",
    markers: [
      "مكمل", "مكملات", "كرياتين", "واي", "كافيين", "بيتا", "اوميغا", "مغنيسيوم", "زنك", "حديد",
      "اشواجاندا", "supplement", "creatine", "whey", "caffeine", "beta", "omega", "magnesium",
      "zinc", "vitamin", "ashwagandha", "preworkout", "pre workout",
    ],
  },
  {
    id: "injury-prevention",
    en: "Injury prevention & training safety",
    ar: "الإصابات والوقاية منها",
    markers: [
      "اصابه", "اصابات", "الم", "مفصل", "ركبه", "كتف", "ظهر", "امن", "وقايه", "احماء", "تمزق",
      "التواء", "injury", "pain", "joint", "knee", "shoulder", "back", "prevention", "warm",
      "safety", "sprain", "strain",
    ],
  },
  {
    id: "metabolic-aging",
    en: "Metabolic health & fitness with age",
    ar: "الصحة الأيضية واللياقة مع التقدم في العمر",
    markers: [
      "ساركوبينيا", "تقدم", "عمر", "سن", "كبار", "خمسين", "اربعين", "هرمون", "تستوستيرون",
      "انسلين", "حساسيه", "sarcopenia", "aging", "older", "senior", "hormone", "testosterone",
      "insulin", "longevity", "metabolic",
    ],
  },
  {
    id: "mistakes-myths",
    en: "Common mistakes & misconceptions",
    ar: "الأخطاء الشائعة والمفاهيم المغلوطة",
    markers: [
      "خطا", "اخطاء", "خرافه", "خرافات", "اسطوره", "مفهوم", "مغالطه", "حقيقه", "صح ام",
      "mistake", "myth", "misconception", "debunk", "truth", "wrong",
    ],
  },
  {
    id: "research-applied",
    en: "Studies, research & practical application",
    ar: "الدراسات والأبحاث وتطبيقاتها العملية",
    markers: [
      "دراسه", "دراسات", "بحث", "ابحاث", "علمي", "علم", "تجربه", "دليل", "ميتا", "تحليل",
      "study", "studies", "research", "science", "evidence", "meta", "trial", "review", "data",
    ],
  },
  {
    id: "practical-guides",
    en: "Practical guides, comparisons & real use-cases",
    ar: "الأدلة العملية والمقارنات وحالات الاستخدام",
    markers: [
      "دليل عملي", "خطوات", "قائمه", "مقارنه", "تشيك", "تحضير", "تجهيز", "مشتريات", "ميزانيه",
      "وقت", "guide", "checklist", "comparison", "compare", "prep", "budget", "time",
      "practical", "step",
    ],
  },
];

const DOMAIN_MARKER_INDEX: ReadonlyMap<string, DomainId> = (() => {
  const m = new Map<string, DomainId>();
  for (const d of FITNESS_DOMAINS) for (const kw of d.markers) m.set(kw, d.id);
  return m;
})();

/** Domain scores for a text (marker hits over its concept signature). */
export function classifyDomains(text: string): Map<DomainId, number> {
  const scores = new Map<DomainId, number>();
  const concepts = extractConcepts(text);
  const rawTokens = new Set(
    foldArabic((text || "").toLowerCase().replace(AR_DIACRITICS, ""))
      .split(/[^\u0600-\u06FFa-z0-9]+/)
      .filter(Boolean),
  );
  for (const c of concepts) {
    const hit = DOMAIN_MARKER_INDEX.get(c);
    if (hit) scores.set(hit, (scores.get(hit) ?? 0) + 1);
  }
  for (const t of rawTokens) {
    const hit = DOMAIN_MARKER_INDEX.get(t) ?? DOMAIN_MARKER_INDEX.get(stripArabicAffixes(t));
    if (hit) scores.set(hit, (scores.get(hit) ?? 0) + 1);
  }
  return scores;
}

/** Highest-scoring domain (null when no marker fires). */
export function classifyPrimaryDomain(text: string): DomainId | null {
  let best: DomainId | null = null;
  let bestScore = 0;
  for (const [id, s] of classifyDomains(text)) {
    if (s > bestScore) {
      best = id;
      bestScore = s;
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────
// Semantic collision (the anti-repetition core)
// ─────────────────────────────────────────────────────────────────

export type SemanticCollision = {
  collision: boolean;
  matchedTitle?: string;
  similarity?: number;
  reason?: "paraphrase" | "same-domain-same-intent" | "same-essence" | "lexical";
};

/**
 * SUB-TOPIC ESSENCE PAIRS (canonical concept ids). Two titles that share
 * BOTH concepts of one pair answer the SAME reader question even when the
 * intent labels differ («كم ساعة نوم يحتاج الرياضي؟» [question] vs «المدة
 * المثالية للنوم للاستشفاء» [descriptive] — both carry {sleep, dur} =
 * the sleep-DURATION question). Deliberately CONSERVATIVE: pairs whose
 * combo could span multiple genuinely different questions (e.g. protein +
 * meal — content vs timing) are NOT listed, so the Phase-178 distinct
 * intents (hours vs impact vs mechanism) stay distinct.
 */
const DOMAIN_ESSENCE_PAIRS: Partial<Record<DomainId, string[][]>> = {
  recovery: [["sleep", "dur"]],
  "fat-loss": [["lose", "weight"], ["lose", "belly"], ["lose", "cardio"]],
  "muscle-strength": [["muscle", "build"], ["muscle", "plan"], ["strength", "plan"]],
  training: [["workout", "home"], ["workout", "plan"]],
  nutrition: [["meal", "prep"], ["hydration", "workout"], ["fasting", "ramadan"]],
  "injury-prevention": [["knee", "pain"], ["shoulder", "pain"], ["back", "pain"]],
  "metabolic-aging": [["muscle", "aging"], ["sarcopenia", "muscle"]],
  "mistakes-myths": [["mistake", "workout"], ["myth", "nutrition"]],
  "practical-guides": [["prep", "meal"], ["checklist", "gym"]],
};

/** Essence pairs of one domain (empty when none defined). */
export function domainEssencePairs(domain: DomainId): string[][] {
  return DOMAIN_ESSENCE_PAIRS[domain] ?? [];
}

/**
 * SEMANTIC duplicate gate (owner order §1.5 «امنع التكرار الدلالي، وليس
 * مجرد تكرار العنوان أو الكلمات»):
 *   • PARAPHRASE — concept-Jaccard ≥ PARAPHRASE_THRESHOLD against any recent
 *     article (different wording, same subject → collision).
 *   • SAME DOMAIN + SAME INTENT — a new topic that shares the primary domain
 *     AND the search-intent class with a recent article collides at the
 *     lower SAME_DOMAIN_THRESHOLD (the editorial «زاوية» law: same reader
 *     goal + same domain = same article even with fresh wording).
 *   • SAME ESSENCE — same primary domain AND the shared concept set covers
 *     one DOMAIN_ESSENCE_PAIRS entry (the sleep-duration class: same
 *     sub-question, different intent label and different wording).
 * Thresholds deliberately CONSERVATIVE: genuinely different intents in the
 * same domain (e.g. «how many hours» vs «how sleep affects hormones») stay
 * distinct — pinned by regression vectors in blog-semantic.test.ts.
 */
export const PARAPHRASE_THRESHOLD = 0.55;
export const SAME_DOMAIN_THRESHOLD = 0.32;

export function findSemanticTopicCollision(
  newTopic: string,
  newKeyword: string,
  existing: Array<{ title: string; focusKeyword?: string }>,
): SemanticCollision {
  const newSig = new Set([...extractConcepts(newTopic), ...extractConcepts(newKeyword)]);
  if (newSig.size === 0) return { collision: false };
  const newDomain = classifyPrimaryDomain(`${newTopic} ${newKeyword}`);
  const newIntent = detectSearchIntent(newTopic);

  for (const ex of existing) {
    const exSig = new Set([
      ...extractConcepts(ex.title || ""),
      ...extractConcepts(ex.focusKeyword || ""),
    ]);
    if (exSig.size === 0) continue;
    const sim = jaccardSimilarity(newSig, exSig);

    if (sim >= PARAPHRASE_THRESHOLD) {
      return { collision: true, matchedTitle: ex.title, similarity: sim, reason: "paraphrase" };
    }
    if (newDomain) {
      const exDomain = classifyPrimaryDomain(`${ex.title} ${ex.focusKeyword || ""}`);
      if (exDomain === newDomain) {
        const exIntent = detectSearchIntent(ex.title || "");
        if (sim >= SAME_DOMAIN_THRESHOLD && exIntent === newIntent) {
          return {
            collision: true,
            matchedTitle: ex.title,
            similarity: sim,
            reason: "same-domain-same-intent",
          };
        }
        // SAME ESSENCE — the shared concepts cover one essence pair of
        // this domain (intent labels may differ; the reader question is
        // the same — the owner's «كم ساعة نوم» vs «المدة المثالية للنوم»
        // class, which pure Jaccard scores at only ~0.25).
        const shared = [...newSig].filter((c) => exSig.has(c));
        for (const pair of domainEssencePairs(newDomain)) {
          if (pair.every((c) => shared.includes(c))) {
            return {
              collision: true,
              matchedTitle: ex.title,
              similarity: sim,
              reason: "same-essence",
            };
          }
        }
      }
    }
  }
  return { collision: false };
}

// ─────────────────────────────────────────────────────────────────
// Domain coverage gaps (flexible balancing — NEVER a forced equal split)
// ─────────────────────────────────────────────────────────────────

export type DomainCoverage = {
  domain: FitnessDomain;
  /** Recency-weighted coverage weight (0 = never covered). */
  weight: number;
  /** Plain article count. */
  count: number;
};

/**
 * Coverage of every domain across recent articles, weighted so RECENT
 * articles matter more (first 10 ×3 · next 15 ×2 · rest ×1 — the owner
 * order «اكتشف المجالات التي تحتاج تغطية ووازن بينها بمرونة»). The
 * ascending-weight ordering IS the under-covered-first plan for P0; a
 * forced equal distribution is explicitly NOT the goal.
 */
export function computeDomainCoverage(
  recent: Array<{ title: string; focusKeyword?: string }>,
): DomainCoverage[] {
  const weights = new Map<DomainId, number>();
  const counts = new Map<DomainId, number>();
  recent.forEach((p, idx) => {
    const w = idx < 10 ? 3 : idx < 25 ? 2 : 1;
    for (const [id, s] of classifyDomains(`${p.title} ${p.focusKeyword ?? ""}`)) {
      weights.set(id, (weights.get(id) ?? 0) + s * w);
      if (idx === 0 || s > 0) counts.set(id, (counts.get(id) ?? 0) + (s > 0 ? 1 : 0));
    }
  });
  return FITNESS_DOMAINS.map((domain) => ({
    domain,
    weight: weights.get(domain.id) ?? 0,
    count: counts.get(domain.id) ?? 0,
  }));
}

/** Under-covered domains (ascending weight) — the flexible balancing plan. */
export function undercoveredDomains(
  recent: Array<{ title: string; focusKeyword?: string }>,
  limit = 4,
): FitnessDomain[] {
  return computeDomainCoverage(recent)
    .sort((a, b) => a.weight - b.weight)
    .slice(0, limit)
    .map((c) => c.domain);
}

/** Saturated domains (top weight) — the «avoid unless genuinely new angle» set. */
export function saturatedDomains(
  recent: Array<{ title: string; focusKeyword?: string }>,
  limit = 2,
): FitnessDomain[] {
  return computeDomainCoverage(recent)
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((c) => c.domain);
}

/**
 * P0 diversity directive (owner order §1: «حسّن نظام اختيار الأفكار ليقدم
 * موضوعات متنوعة فعلًا»). Injected into the research prompt: the 5 topic
 * suggestions must SPAN under-covered domains with distinct intents and
 * audiences. Keeps the Alkemos fitness identity: every domain label is a
 * training/nutrition/recovery/applied-science label (§7).
 */
export function buildDiversityDirective(
  lang: "en" | "ar",
  recent: Array<{ title: string; focusKeyword?: string }>,
): string {
  const under = undercoveredDomains(recent, 5);
  const saturated = saturatedDomains(recent, 3);
  if (lang === "ar") {
    return `خطة تنويع التغطية (إلزامية):
- المجالات الأقل تغطية حاليًا على المدونة (ابدأ منها أولًا): ${under.map((d) => d.ar).join(" · ")}.
- المجالات المشبعة مؤخرًا (تجنبها ما لم تقدم زاوية جديدة كليًا): ${saturated.length ? saturated.map((d) => d.ar).join(" · ") : "(لا يوجد)"}.
- اقتراحاتك الخمسة MUST تمتد عبر 4 مجالات مختلفة على الأقل من القائمة أعلاه، ولكل مقال: هدف بحث مختلف + جمهور مختلف + زاوية تحريرية مختلفة (دليل عملي / مقارنة / دحض خرافة / خطة جاهزة / تحليل علمي تطبيقي).
- الهوية الرياضية لـ Alkemos: كل موضوع يخدم التدريب الرياضي أو التغذية الرياضية أو الاستشفاء أو الأداء — لا موضوعات الطب العام أو التشخيص أو علاج الأمراض.`;
  }
  return `COVERAGE DIVERSITY PLAN (mandatory):
- LEAST-COVERED domains right now (start from these first): ${under.map((d) => d.en).join(" · ")}.
- Recently SATURATED domains (avoid unless a genuinely new angle): ${saturated.length ? saturated.map((d) => d.en).join(" · ") : "(none)"}.
- Your 5 suggestions MUST span at least 4 DIFFERENT domains from the list above, and each article must have a DIFFERENT search goal, audience and editorial angle (practical guide / comparison / myth-bust / ready plan / applied science review).
- Alkemos fitness identity: every topic serves sports training, sports nutrition, recovery or athletic performance — no general medicine, diagnosis or disease-treatment topics.`;
}

// ─────────────────────────────────────────────────────────────────
// Angle rotation (LRU — replaces the pure-random angle pick)
// ─────────────────────────────────────────────────────────────────

/**
 * Least-recently-used angle pick over the ARTICLE_ANGLES registry order:
 * angles never used win first (registry order breaks ties), then the
 * angle whose last use is OLDEST. `recentAngles` is newest-first — exactly
 * how the queue helper returns it. Falls back to `fallback` (the legacy
 * random pick) when no history exists.
 */
export function pickLeastRecentlyUsedAngle(
  angleIds: readonly string[],
  recentAngles: readonly string[],
  fallback: string,
): string {
  if (recentAngles.length === 0 || angleIds.length === 0) return fallback;
  const lastUse = new Map<string, number>();
  recentAngles.forEach((a, idx) => {
    if (!lastUse.has(a)) lastUse.set(a, idx); // smallest idx = most recent
  });
  const neverUsed = angleIds.filter((a) => !lastUse.has(a));
  if (neverUsed.length > 0) return neverUsed[0];
  // oldest last-use = the LARGEST idx among used angles
  let best = angleIds[0];
  let bestIdx = -1;
  for (const a of angleIds) {
    const idx = lastUse.get(a);
    if (idx !== undefined && idx > bestIdx) {
      bestIdx = idx;
      best = a;
    }
  }
  return best;
}

/**
 * Pairing diversity nudge (owner order §3/§1.7): the recommended angle
 * ids for the daily pair — LRU-ordered. The pairing call still picks freely
 * (anti-blind law), but a choice that repeats one of the last articles'
 * angles is deterministically overridden to the LRU head.
 */
export function recommendedAngleOrder(
  angleIds: readonly string[],
  recentAngles: readonly string[],
): string[] {
  const ordered = [...angleIds].sort((a, b) => {
    const ia = recentAngles.indexOf(a);
    const ib = recentAngles.indexOf(b);
    const na = ia === -1 ? 0 : 1;
    const nb = ib === -1 ? 0 : 1;
    if (na !== nb) return na - nb; // never-used first
    if (na === 0) return angleIds.indexOf(a) - angleIds.indexOf(b); // registry order
    return ib - ia; // older use first (larger idx = older)
  });
  return ordered;
}

/** True when `angleId` was used by one of the last `n` articles (newest-first list). */
export function angleUsedRecently(
  angleId: string,
  recentAngles: readonly string[],
  n = 2,
): boolean {
  return recentAngles.slice(0, n).includes(angleId);
}
