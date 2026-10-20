/**
 * src/lib/blog-research.ts — PIPELINE V3 · PHASE 0 (language-split)
 *
 * Keyword & Topic Research (owner directive 2026-08-27, refined same
 * day: one P0 call researches exactly ONE language — the per-language
 * quality bar is untouched). PHASE 157 (SEO-GEO-5.0, owner «نفذ توصيتك»):
 * the P0 ROUTE may research BOTH languages back-to-back to seal a daily
 * bilingual pair (pair_id + sharedBrief), but each research artifact is
 * still produced by its own single-language run with its own dedup —
 * the two language pipelines keep their independent schedules
 * (AR 05:00 UTC · EN 22:00 UTC). For that ONE language it produces:
 *   • top 10 search keywords (with estimated search volume)
 *   • top 10 common questions with short answers
 *   • 5 article topic suggestions based on the analysis
 *
 * PHASE 344 (owner order 2026-10-06 «نفّذ إصلاح P0 بحيث يستخدم بحثًا
 * خارجيًا حقيقيًا [Google Search grounding] وتدخل نتائج البحث الفعلية
 * في عملية توليد المقال، مع إزالة الاعتماد على محاكاة البحث أو الـ
 * curated fallback كبديل للبحث الحقيقي»): P0 now runs ONE REAL grounded
 * call and the live evidence (webSearchQueries + grounded result pages)
 * is stored on the artifact (searchedQueries + sources) and flows into
 * P1/P2 prompts (blog-pipeline researchDigest + VERIFIED SEARCH CONTEXT).
 * There is NO substitute anymore: the old chain-of-LLs "research from
 * training knowledge" and the deterministic curated fallback are RETIRED
 * as runtime paths — a failed/ungrounded attempt fails the step HONESTLY
 * and the GHA runner's step-level retry (×3) rides out transient overload;
 * after that the run dies red instead of silently publishing model memory
 * or the static pool as "research" (the 2026-10-06 review: run 37390233779
 * silently fell to curated-fallback). fallbackResearch() below survives
 * as a TEST FIXTURE ONLY (blog-*-tests import it), never called at runtime.
 *
 * BLOG-PROVIDER-FAILOVER 2026-10-16 (owner order «افحص وأصلح آلية التبديل
 * التلقائي بين مزوّدي الذكاء الاصطناعي الحاليين … مع الحفاظ على البحث
 * الحقيقي … ولا تستبدله بتوليد عادي أو نتائج وهمية»): the single gemini
 * call became callGroundedSearch — a REAL-search cross-provider failover
 * (gemini googleSearch → openrouter web plugin → groq compound; NVIDIA
 * excluded honestly — no grounded-search capability). Every arm enforces
 * the honest live-evidence gate; quota-class failures move to the next
 * provider and cool the failed one (AI_PROVIDER_COOLDOWN_MS opt-in) so
 * futile 429 re-walks are skipped. Honest-failure law UNCHANGED: no plain
 * generation, no simulation, no curated substitute — ever.
 *
 * The niche is fixed: fitness / nutrition / workouts / health.
 * Output is stored on the queue row inside `article_bundle.research0`.
 */
import { callGroundedSearch, parseJSON } from "./ai-provider";
import {
  getRecentPostsByLanguage,
  getRecentGeneratedTopics,
  getRecentContentDigests,
  pickRotationCategory,
  isDuplicateTopic,
} from "./blog-topics";

export type ResearchKeyword = { keyword: string; searchVolume: string };
export type ResearchFaq = { question: string; answer: string };

/** PHASE 344: a REAL search result page the research was grounded on
 *  (title + live URL from Gemini groundingMetadata — never fabricated). */
export type ResearchSource = { title: string; url: string };

export type LanguageResearch = {
  keywords: ResearchKeyword[];
  faqs: ResearchFaq[];
  topics: string[];
  /** PHASE 344 (owner order — بحث خارجي حقيقي): the Google-Search
   *  queries the model actually ran + the live result pages it grounded
   *  on. Optional → legacy bundle rows (pre-344) simply lack the fields
   *  and downstream prompts stay byte-identical for them. */
  searchedQueries?: string[];
  sources?: ResearchSource[];
};

export type Phase0Result = {
  lang: "en" | "ar";
  /** FLAT artifact — no {en, ar} nesting since the 2026-08-27 lang split. */
  research: LanguageResearch;
  category: string;
  source: string;
};

const NICHE_EN =
  "online fitness & nutrition coaching (Alkemos): workouts, muscle building, fat loss, healthy eating, supplements, recovery";

const NICHE_AR =
  "التدريب والتغذية الرياضية عبر الإنترنت (Alkemos): التمارين، بناء العضلات، حرق الدهون، الأكل الصحي، المكملات، الاستشفاء";

// PHASE 171 (blog-audit proposal ب — 2026-09-10): the weak local
// parseJSONLoose (strict JSON.parse + a {…} regex — NO truncation repair,
// NO control-character escaping) was DELETED. P0/P1/P2/P4 in the
// AUTOMATIC pipeline now parse through the 161.5-hardened parseJSON
// from ai-provider.ts — the same parser the coach path already uses
// (fence-stripping + prose extraction + truncation repair + raw
// control-char escaping inside string values). Live evidence that
// forced the unification: 3 failed EN runs «P1 en: invalid outline
// JSON from openrouter:nvidia/nemotron-3-ultra-550b-a55b:free»
// (09-06 dispatch · 09-07 dispatch · 09-09 SCHEDULED) — the same
// soft-JSON failure family 161.5 fixed for the coach path.

function asStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 3)
    .map((s) => s.trim())
    .slice(0, max);
}

function normalizeResearch(rawInput: unknown): LanguageResearch {
  // Loose record view — model JSON fields are defensively coerced below.
  const raw = (typeof rawInput === "object" && rawInput !== null ? rawInput : {}) as Record<string, unknown>;
  const keywords: ResearchKeyword[] = Array.isArray(raw.keywords)
    ? (raw.keywords as unknown[])
        .map((k): ResearchKeyword => {
          if (typeof k === "string") return { keyword: k.trim(), searchVolume: "" };
          const r = (typeof k === "object" && k !== null ? k : {}) as Record<string, unknown>;
          return {
            keyword: String(r.keyword ?? "").trim(),
            searchVolume: String(r.searchVolume ?? r.volume ?? "").trim(),
          };
        })
        .filter((k: ResearchKeyword) => k.keyword.length > 2)
        .slice(0, 10)
    : [];

  const faqs: ResearchFaq[] = Array.isArray(raw.faqs)
    ? (raw.faqs as unknown[])
        .map((f): ResearchFaq => {
          const r = (typeof f === "object" && f !== null ? f : {}) as Record<string, unknown>;
          return {
            question: String(r.question ?? r.q ?? "").trim(),
            answer: String(r.answer ?? r.a ?? "").trim(),
          };
        })
        .filter((f: ResearchFaq) => f.question.length > 5 && f.answer.length > 2)
        .slice(0, 10)
    : [];

  // PHASE 344: defensive coercion of the grounding-evidence fields when
  // the model echoes them inside its JSON (the authoritative values are
  // attached from groundingMetadata by the caller — model echoes never
  // fabricate evidence).
  const searchedQueries = Array.isArray(raw.searchedQueries)
    ? (raw.searchedQueries as unknown[]).map((q) => String(q ?? "").trim()).filter(Boolean).slice(0, 10)
    : [];
  const sources: ResearchSource[] = Array.isArray(raw.sources)
    ? (raw.sources as unknown[])
        .map((s): ResearchSource => {
          const r = (typeof s === "object" && s !== null ? s : {}) as Record<string, unknown>;
          return { title: String(r.title ?? "").trim(), url: String(r.url ?? "").trim() };
        })
        .filter((s: ResearchSource) => s.url.length > 7)
        .slice(0, 12)
    : [];

  return {
    keywords,
    faqs,
    topics: asStringArray(raw.topics, 5),
    ...(searchedQueries.length ? { searchedQueries } : {}),
    ...(sources.length ? { sources } : {}),
  };
}

/**
 * Deterministic curated pool — TEST FIXTURE ONLY since Phase 344 (owner
 * order «إزالة الاعتماد على... الـ curated fallback كبديل للبحث
 * الحقيقي»): nothing at runtime calls this anymore; blog-*-tests import
 * it to build LanguageResearch fixtures. The pools + concept-freshness
 * rotation stay verbatim for those fixtures. VARIETY FIX (Phase 62) and
 * PHASE 176 concept-tag freshness history preserved below.
 *
 * PHASE 176 (owner report «التعديلات الجديدة اختفت مرة أخرى» — live
 * evidence, 09-11: the AR dispatch fell back to the pool and published a
 * 4th sleep article; the EN dispatch fell back and P5 dup-skipped the
 * SAME title as yesterday's article): the pool grew 5 → 15 topics per
 * language AND the old freshness check (≥0.7 whole-phrase word overlap)
 * is replaced by CONCEPT-tag matching — each curated topic carries its
 * core concept roots, and a topic is fresh only when NONE of its
 * concepts appear in any recent title (substring, so Arabic
 * ال/و/بال/لل affixing never hides a repeat, and EN plurals never hide
 * one either: "calorie" matches "calories"). A concept-level repeat
 * with different wording was exactly the 09-11 failure («الاستشفاء
 * والنوم: المفتاح المنسي» vs «كم ساعة نوم يحتاج الرياضي» shared the
 * نوم/استشفاء concepts but only 1-2 exact words).
 */
interface CuratedTopic {
  topic: string;
  /** Core concept roots — a hit against any recent title = duplicate. */
  concepts: string[];
}

const FALLBACK_TOPICS_AR: CuratedTopic[] = [
  {
    topic: "الدليل الكامل لبناء العضلات للمبتدئين: من أين تبدأ خطوة بخطوة",
    concepts: ["مبتدئ", "بناء العضلات"],
  },
  {
    topic: "كيف تحسب سعراتك اليومية بدقة لخسارة الوزن أو التضخيم",
    concepts: ["سعرات", "حساب"],
  },
  {
    topic: "أخطاء شائعة تمنعك من حرق الدهون رغم التمرين اليومي",
    concepts: ["حرق الدهون", "أخطاء"],
  },
  {
    topic: "أفكار وجبات صحية سريعة عالية البروتين للموظفين",
    concepts: ["وجبات", "الموظفين"],
  },
  {
    topic: "الاستشفاء والنوم: المفتاح المنسي لنتائج أسرع في الجيم",
    concepts: ["نوم", "استشفاء"],
  },
  {
    topic: "التدرج في الأوزان: كيف تزيد الحمل بأمان كل أسبوع لبناء العضلات",
    concepts: ["تدرج", "الأوزان"],
  },
  {
    topic: "أسبوع التخفيف (Deload): متى وكيف تأخذ راحة من التمرين دون خسارة تقدمك",
    concepts: ["تخفيف", "ديلود"],
  },
  {
    topic: "كم مرة تدرب كل مجموعة عضلية في الأسبوع؟ التردد الأمثل للنمو",
    concepts: ["تردد", "المجموعة العضلية"],
  },
  {
    topic: "برنامج الدفع والسحب والأرجل (Push Pull Legs): دليل تقسيم أسبوعي كامل",
    concepts: ["دفع", "سحب"],
  },
  {
    topic: "تجهيز جيم منزلي بميزانية محدودة: ما تحتاجه فعلًا وما يمكنك تجاهله",
    concepts: ["جيم منزلي", "منزلي"],
  },
  {
    topic: "الإحماء قبل التمرين: هل هو ضروري فعلًا؟ روتين دقائق يحميك من الإصابات",
    concepts: ["إحماء", "الإحماء"],
  },
  {
    topic: "الكارديو وعضلاتك: كيف تدمج تمارين القلب دون خسارة الكتلة العضلية",
    concepts: ["كارديو"],
  },
  {
    topic: "تحضير الوجبات الأسبوعي: دليل عملي لتوفير الوقت والمال مع أهداف لياقية",
    concepts: ["تحضير الوجبات"],
  },
  {
    topic: "زيادة الوزن للنحافين: خطة سعرات وتمارين عملية للوزن الصحي",
    concepts: ["نحاف", "زيادة الوزن"],
  },
  {
    topic: "البروتين النباتي: هل يكفي لبناء العضلات؟ أفضل المصادر وكيف تجمعها",
    concepts: ["نباتي"],
  },
];

const FALLBACK_TOPICS_EN: CuratedTopic[] = [
  {
    topic: "The Complete Beginner's Guide to Building Muscle: Where to Start Step by Step",
    concepts: ["beginner", "build muscle"],
  },
  {
    topic: "How to Calculate Your Daily Calories Accurately for Fat Loss or Bulking",
    concepts: ["calorie", "calculate"],
  },
  {
    topic: "Common Mistakes That Block Fat Loss Despite Daily Workouts",
    concepts: ["fat loss", "mistake"],
  },
  {
    topic: "Quick High-Protein Meal Ideas for Busy Professionals",
    concepts: ["meal", "protein"],
  },
  {
    topic: "Recovery and Sleep: The Forgotten Key to Faster Gym Results",
    concepts: ["sleep", "recovery"],
  },
  {
    topic: "Progressive Overload Explained: How to Add Weight Safely Every Week",
    concepts: ["overload", "progressive"],
  },
  {
    topic: "The Deload Week: When and How to Back Off Without Losing Gains",
    concepts: ["deload"],
  },
  {
    topic: "How Often Should You Train Each Muscle Group Per Week? The Optimal Frequency",
    concepts: ["frequency", "muscle group"],
  },
  {
    topic: "Push Pull Legs Split: A Complete Weekly Routine Guide",
    concepts: ["push pull", "split"],
  },
  {
    topic: "Building a Home Gym on a Budget: What You Actually Need",
    concepts: ["home gym", "budget"],
  },
  {
    topic: "Warming Up Before Lifting: Is It Really Necessary? A 5-Minute Routine",
    concepts: ["warm up", "warmup"],
  },
  {
    topic: "Cardio and Muscle: How to Endure Without Losing Your Gains",
    concepts: ["cardio", "muscle"],
  },
  {
    topic: "Weekly Meal Prep: A Practical Guide to Saving Time and Money",
    concepts: ["meal prep"],
  },
  {
    topic: "Gaining Weight as a Skinny Guy: A Practical Calories and Training Plan",
    concepts: ["skinny", "underweight"],
  },
  {
    topic: "Plant-Based Protein: Is It Enough to Build Muscle? Best Sources and Combining",
    concepts: ["plant", "vegan"],
  },
];

function curatedFallbackTopics(
  pool: CuratedTopic[],
  recentTitles: string[],
): string[] {
  if (pool.length < 2) return pool.map((t) => t.topic);
  // Concept-level freshness: a topic is fresh when NONE of its concept
  // roots appears in ANY recent title (substring match — Arabic affixes
  // and EN plurals cannot hide a repeat).
  const recentLower = recentTitles.map((t) => t.toLowerCase());
  const fresh = (t: CuratedTopic) =>
    !recentLower.some((r) => t.concepts.some((c) => r.includes(c.toLowerCase())));
  const offset = Math.floor(Math.random() * pool.length);
  const rotated = pool.slice(offset).concat(pool.slice(0, offset));
  const surviving = rotated.filter(fresh);
  const chosen = surviving.length >= 2 ? surviving : rotated;
  return chosen.map((t) => t.topic);
}

export function fallbackResearch(lang: "en" | "ar", recentTitles: string[] = []): LanguageResearch {
  if (lang === "ar") {
    return {
      keywords: [
        { keyword: "كم سعرة أحتاج يومياً لخسارة الوزن", searchVolume: "عالي" },
        { keyword: "جدول تغذية لبناء العضلات للمبتدئين", searchVolume: "عالي" },
        { keyword: "أفضل تمارين حرق دهون البطن في المنزل", searchVolume: "عالي" },
        { keyword: "كم جرام بروتين يحتاج الجسم يومياً لبناء العضلات", searchVolume: "عالي" },
        { keyword: "بروتين واي منافع وأضرار ومتى أشربه", searchVolume: "متوسط" },
        { keyword: "أفضل وقت للتمرين لبناء العضلات صباحاً أم مساءً", searchVolume: "متوسط" },
        { keyword: "أكل قبل وبعد التمرين بكمية وكام ساعة", searchVolume: "متوسط" },
        { keyword: "كيف أنشف بطني بدون فقدان عضلات", searchVolume: "عالي" },
        { keyword: "أفضل مكملات زيادة الوزن للنحاف", searchVolume: "متوسط" },
        { keyword: "النوم وبناء العضلات كم ساعة أحتاج", searchVolume: "منخفض" },
        { keyword: "مبدأ التدرج في الأحمال لزيادة القوة", searchVolume: "منخفض" },
        { keyword: "تمارين كارديو بدون معدات في المنزل", searchVolume: "متوسط" },
        { keyword: "أفضل أطعمة عالية البروتين النباتي", searchVolume: "متوسط" },
        { keyword: "متى آخذ أسبوع راحة من التمرين", searchVolume: "منخفض" },
      ],
      faqs: [
        { question: "كم مرة أتدرب في الأسبوع لبناء العضلات؟", answer: "3-5 أيام أسبوعيًا تكفي مع تدرج في الأوزان." },
        { question: "هل الكارديو يحرق العضلات؟", answer: "الكارديو المعتدل لا يحرق العضلات إذا كانت سعراتك كافية." },
        { question: "ما أفضل وقت للتمرين؟", answer: "أي وقت يناسب جدولك باستمرار هو الأفضل." },
        { question: "كم سعرة أحتاج يومياً لخسارة الوزن؟", answer: "يعتمد على وزنك ونشاطك — احسبها بحاسبة السعرات ثم اطرح 300-500 سعرة." },
      ],
      topics: curatedFallbackTopics(FALLBACK_TOPICS_AR, recentTitles),
    };
  }
  return {
    keywords: [
      { keyword: "how many calories should i eat to lose weight", searchVolume: "high" },
      { keyword: "beginner workout plan at home no equipment", searchVolume: "high" },
      { keyword: "muscle building meal plan on a budget", searchVolume: "high" },
      { keyword: "best fat burning exercises for belly fat", searchVolume: "high" },
      { keyword: "how much protein do i need to build muscle per day", searchVolume: "high" },
      { keyword: "whey protein benefits and side effects", searchVolume: "medium" },
      { keyword: "pre workout nutrition what to eat and when", searchVolume: "medium" },
      { keyword: "push pull legs routine for beginners", searchVolume: "medium" },
      { keyword: "how to lose belly fat without losing muscle", searchVolume: "high" },
      { keyword: "best supplements for muscle gain for beginners", searchVolume: "medium" },
      { keyword: "progressive overload how to add weight safely", searchVolume: "medium" },
      { keyword: "deload week when to take rest from training", searchVolume: "low" },
      { keyword: "cardio vs weights for fat loss and muscle", searchVolume: "medium" },
      { keyword: "plant based protein sources for muscle building", searchVolume: "medium" },
    ],
    faqs: [
      { question: "How many days a week should I train to build muscle?", answer: "3–5 sessions per week with progressive overload is enough." },
      { question: "Does cardio burn muscle?", answer: "Moderate cardio does not burn muscle if calories and protein are adequate." },
      { question: "What is the best time to work out?", answer: "Any time you can train consistently is the best time." },
      { question: "How many calories should I eat to lose weight?", answer: "Estimate your maintenance with a calorie calculator, then subtract 300–500 kcal." },
    ],
    topics: curatedFallbackTopics(FALLBACK_TOPICS_EN, recentTitles),
  };
}

/**
 * PHASE 0 — ONE REAL grounded Gemini search per language (owner order
 * 2026-10-06 Phase 344). No chain, no simulation, no curated substitute:
 * a failed or ungrounded attempt THROWS (the route's 500 → the runner's
 * step-level ×3 retry rides out transient overload; a final failure dies
 * red instead of silently publishing fake research).
 */
async function researchLanguage(lang: "en" | "ar"): Promise<{ data: LanguageResearch; source: string }> {
  const niche = lang === "ar" ? NICHE_AR : NICHE_EN;
  // BLOG-PROVIDER-FAILOVER 2026-10-16 (live run 38849540488 — Arabic shape
  // hardening): the OR reasoning model occasionally "responds in Arabic"
  // so thoroughly it drifts the JSON STRUCTURE; one explicit line pins the
  // contract (English keys exactly as templated, Arabic VALUES only).
  const outLang = lang === "ar"
    ? 'Respond in ARABIC. All keywords, questions, answers and topic titles MUST be in natural, correct Modern Standard Arabic — clear and natural for every Arabic reader (Pan-Arab MSA, no local dialect, no dialect-only vocabulary, correct grammar and spelling). The JSON structure below stays EXACTLY as templated: English keys (keywords/faqs/topics), Arabic values only — never rename or translate the JSON keys.'
    : 'Respond in ENGLISH.';

  // PHASE 62 VARIETY FIX: P0 previously had ZERO memory of published
  // content — the same trending suggestions regenerated every run. Feed
  // recent published + generated titles into the research prompt so the
  // 5 suggestions are forced onto UNCOVERED angles.
  // PHASE 172 (owner order — anti-repetition «ليس title dedup فقط»): the
  // exclusion context is now STRUCTURAL, not title-only — recent digests
  // carry each article's focus keyword + H2 skeleton, and the prompt
  // bans repetition at the search-intent/angle/structure level, not
  // just the title wording.
  const [recentPosts, recentJobs, digests] = await Promise.all([
    // PHASE 178 (cannibalization forensics): the 30-post title window let
    // the AR sleep cluster (4 articles answering the SAME «كم ساعة نوم»
    // question + 3 slug-suffixed variants of one topic) slip through as
    // older duplicates scrolled out — widen to the full-corpus horizon
    // (100, aligned with the blog-topics default) so topic-pick sees the
    // whole published language blog, not just the last month.
    getRecentPostsByLanguage(lang, 100),
    getRecentGeneratedTopics(lang, 15),
    getRecentContentDigests(lang, 12),
  ]);
  const recentTitles = [...recentPosts, ...recentJobs].map((p) => p.title).filter(Boolean);
  const digestBlock = digests.length
    ? digests
        .slice(0, 12)
        .map(
          (d, i) =>
            `${i + 1}. "${d.title}"${d.focusKeyword ? ` [focus: ${d.focusKeyword}]` : ""}${
              d.h2s.length ? ` — covered sections: ${d.h2s.slice(0, 5).join(" | ")}` : ""
            }`,
        )
        .join("\n")
    : "";
  const recentBlock = recentTitles.length
    ? `THE BLOG HAS ALREADY PUBLISHED / GENERATED THESE RECENT TITLES (your 5 topic suggestions MUST cover NEW subjects or genuinely NEW angles — rewording any of these is a FAILURE):
${recentTitles.slice(0, 35).map((t, i) => `${i + 1}. ${t}`).join("\n")}
${digestBlock ? `
RECENT ARTICLES' ACTUAL COVERAGE (focus keyword + section structure already used — a suggestion that repeats any of these INTENTS, ANGLES or SECTION SKELETONS is a FAILURE even with a different title):
${digestBlock}` : ""}`
    : "";

  const prompt = `You are an SEO research analyst equipped with LIVE Google Search. Niche: ${niche}.
${outLang}
USE YOUR GOOGLE SEARCH TOOL to ground this research in what people ACTUALLY search RIGHT NOW in this niche (query volume patterns, currently-ranking questions, real People-Also-Ask entries, fresh SERP angles) — model memory alone is NOT acceptable as the evidence base. Volume labels remain estimates ("high/medium/low") informed by what the search results indicate.
${recentBlock}

LONG-TAIL KEYWORD LAW (owner directive 2026-09-01):
- At least 6 of the 10 keywords MUST be LONG-TAIL keywords: 3+ word phrases phrased the way real people search (question format, "how to…", "best … for …", "… vs …", or a very specific intent), NOT broad one/two-word head terms.
- Every FAQ question must be a REAL most-searched question in the fitness/nutrition niche (People-Also-Ask style, phrased exactly as users type it).
- Each of the 5 topic suggestions must target at least one LONG-TAIL keyword (a broad "protein guide" topic is a FAILURE; "how much protein do you really need per day to build muscle" is a WIN).
Return STRICT JSON only, no markdown fences:
{
  "keywords": [ {"keyword": "...", "searchVolume": "high|medium|low"} ],   // exactly 10 items — ≥6 long-tail (3+ words, real search phrasing)
  "faqs":     [ {"question": "...", "answer": "1-2 sentence direct answer"} ], // exactly 10 items — most-searched questions (People-Also-Ask style)
  "topics":   [ "..." ]   // exactly 5 specific, non-generic article topic suggestions NOT overlapping with the recent titles above; EACH must target a long-tail keyword above; VARY the article types across the 5 (guide / myth-busting / comparison / step-by-step plan / science deep-dive); suggestions must differ from the recent coverage at the SEARCH-INTENT and ANGLE level (different reader goal, not just different wording)
}`;

  // PHASE 344 + BLOG-PROVIDER-FAILOVER 2026-10-16: the REAL grounded call —
  // now a CROSS-PROVIDER failover walk (gemini googleSearch → openrouter
  // web plugin → groq browser_search; NVIDIA honestly excluded — no
  // grounded-search capability). jsonMode is intentionally omitted: the
  // gemini arm suppresses the JSON mime-type with tools anyway (REST
  // rejects JSON-mode + tool use), so the STRICT-JSON instruction above +
  // the 161.5-hardened parseJSON carry the contract (the Groq Phase 177
  // pattern). GROQ-2 (2026-10-17, live run 39062486597): a systemPrompt
  // now reinforces the STRICT-JSON law — the measured failure was the EN
  // research answering in PROSE (no JSON object anywhere in the text)
  // while the twin AR call parsed perfectly; the system channel is the
  // strongest instruction location for agentic browser_search models.
  try {
    const { text, model, grounding, provider } = await callGroundedSearch(prompt, {
      tag: "blog:research",
      systemPrompt:
        "You are a strict JSON API endpoint. The user message describes the research task; your ENTIRE response MUST be a single valid JSON object matching the requested schema — no prose, no markdown, no commentary, no code fences. The JSON object starts with { and ends with }.",
      temperature: 0.7,
      maxTokens: 2_500,
      // BLOG-PROVIDER-FAILOVER 2026-10-16 (live measurements, probe
      // 38844967928 + pipeline 38846158680): the OR web arm rides a
      // reasoning model whose CoT runs 30–90s on SHORT prompts and the
      // REAL research prompt aborted at 90s on key#2 (live: "This
      // operation was aborted" ×3 attempts while the 402-rejected key#1
      // answered instantly — key#2 was WORKING, just slow). 180s fits the
      // GHA native runner budget comfortably (maxDuration=60 applies only
      // to Vercel serverless; the blog steps run natively per the
      // recovery report RC1).
      timeoutMs: 180_000,
    });
    const parsed = parseJSON<Record<string, unknown>>(text);
    const data = parsed ? normalizeResearch(parsed) : null;
    if (data && data.topics.length > 0 && data.keywords.length >= 5) {
      // Attach the AUTHORITATIVE live-search evidence from groundingMetadata
      // (real queries + real result pages) — model JSON never fabricates it.
      data.searchedQueries = grounding.searchQueries;
      data.sources = grounding.sources;
      console.log(`[blog-research] P0 ${lang} done (${provider}:${model} [grounded], kw:${data.keywords.length} faq:${data.faqs.length} topics:${data.topics.length} queries:${grounding.searchQueries.length} sources:${grounding.sources.length})`);
      return { data, source: `${provider}:${model}` };
    }
    // GROQ-2 diagnosis (2026-10-17): print the raw answer sample on an
    // invalid shape — the measured EN failure (run 39062486597: prose, no
    // JSON object) must be VISIBLE in the logs, never guessed at again.
    console.error(
      `[blog-research] P0 ${lang} invalid research JSON shape from ${provider}:${model} — raw text sample (first 500 chars): ${text.replace(/\s+/g, " ").slice(0, 500)}`,
    );
    throw new Error(
      `P0 ${lang}: invalid research JSON shape from ${provider}:${model} (topics:${data?.topics.length ?? 0} keywords:${data?.keywords.length ?? 0}) — no substitute allowed`,
    );
  } catch (e) {
    // HONEST FAILURE (owner order 2026-10-06): no simulated search, no
    // curated fallback — the error propagates, the route returns 500, and
    // the GHA runner's step-level retry (×3) draws a fresh attempt.
    console.error(`[blog-research] P0 ${lang} grounded search failed: ${e instanceof Error ? e.message : e}`);
    throw e;
  }
}

/**
 * AUDIT_REPORT §9-المرحلة 1, item 3 (2026-09-29) — fallback visibility
 * law. The audit measured 34/141 runs (24%) silently publishing topics
 * from the STATIC curated pool (C3) — the root of the cannibalization
 * clusters. The GSC part of the item is owner-blocked (needs the owner's
 * Search Console API credentials — external service, owner decision);
 * what shipped then was the honest marking: every queue row's bundle
 * carries researchSource: "fallback" | "model", the P0 route ALERTS (no
 * silent fallback), and the admin queue-health panel surfaces it.
 * PHASE 344 note: for NEW runs this can never fire — the curated
 * substitution was removed by owner order; the detector stays for LEGACY
 * rows/stamps and the panel's historical visibility.
 */
export function researchUsedFallback(p0Source: string): boolean {
  return p0Source.includes("curated-fallback");
}

/**
 * Runs Phase 0 for EXACTLY ONE language + picks the rotation category
 * the same deterministic way step1 used to. Insertion of the queue row
 * happens in the route handler (keeps this lib DB-free).
 */
export async function runPhase0Research(
  lang: "en" | "ar",
): Promise<Phase0Result> {
  const r = await researchLanguage(lang);
  // PHASE 62 BUGFIX: was getRecentPosts(100) which hard-codes language=en —
  // the AR pipeline's pillar rotation was blind to ALL AR history. Each
  // language now rotates against its OWN recent posts + generated jobs.
  const [recentOwn, recentJobs] = await Promise.all([
    getRecentPostsByLanguage(lang, 100),
    getRecentGeneratedTopics(lang, 20),
  ]);
  const recent = [...recentOwn, ...recentJobs];
  // Prefer topics that survived the dup-guard when ranking categories is
  // not applicable here — keep rotation semantics identical, but ALSO
  // pre-flag duplicate topics so P1's guard sees fewer all-dup sets.
  const research = {
    ...r.data,
    topics: r.data.topics.filter(
      (t) => !recent.some((p) => isDuplicateTopic(t, t, [p]).duplicate),
    ).length >= 2
      ? r.data.topics.filter(
          (t) => !recent.some((p) => isDuplicateTopic(t, t, [p]).duplicate),
        )
      : r.data.topics,
  };
  return {
    lang,
    research,
    category: pickRotationCategory(recent),
    source: `p0-${lang}:${r.source}`,
  };
}

/* ─────────────────────────────────────────────────────────────────────
 * P0-PAIR-SERIAL (BLOG-RECOVERY 2026-10-20 — the bilingual double-walk
 * law). LIVE ROOT CAUSE (AR run 39403516194, the 15th consecutive daily
 * failure): the CREATE path launched BOTH languages' grounded research
 * CONCURRENTLY (Promise.all) — and with gemini's grounded quota drained
 * at project level (429 × every family, weekly report week of 10-05)
 * and both OpenRouter keys answering 402 «never purchased credits» for
 * the web plugin, the two simultaneous walks BOTH landed on the single
 * remaining grounded arm (Groq browser_search, free tier). One walk
 * won (AR: groq:120b, 95s, 12 live sources); the twin (EN) starved the
 * same per-minute token/tool bucket → 200-empty on 120b → 400 tool-call-
 * validation on 20b → the step failed → ×3 step retries all collapsed
 * against the 30-min cooldowns the cascade set. The standalone probe
 * (single sequential grounded call) stayed GREEN the whole time — the
 * pipeline (concurrent pair) stayed RED. Fix: serialize the pair, and
 * when the first language landed on the rate-limited arm, wait out a
 * recovery gap before the twin's walk (the 10-17 probe measured a
 * sequential second call succeeding ~45s after the first; 90s is the
 * measured-safe default). Ops knob: P0_PAIR_GAP_MS (default 90000;
 * 0 disables the gap — serialization itself is unconditional).
 * ─────────────────────────────────────────────────────────────────────── */

/** Recovery gap between the two languages' grounded walks (ms). */
export function p0PairGapMs(): number {
  const raw = Number(process.env.P0_PAIR_GAP_MS);
  if (Number.isFinite(raw) && raw >= 0) return Math.min(raw, 600_000);
  return 90_000;
}

const sleepMs = (ms: number): Promise<void> =>
  new Promise((res) => setTimeout(res, ms));

/**
 * P0-PAIR-SERIAL: run the two languages' Phase-0 research SEQUENTIALLY
 * (mine first — the pipeline's own language keeps the freshest bucket),
 * with a token-bucket recovery gap when the first walk landed on the
 * rate-limited Groq arm. Returns [mine, other] exactly like the old
 * Promise.all — callers are unchanged. (The `runner` parameter is a
 * test-only DI seam — production always uses the default runPhase0Research.)
 */
export async function runBilingualResearchPair(
  lang: "en" | "ar",
  otherLang: "en" | "ar",
  runner: (l: "en" | "ar") => Promise<Phase0Result> = runPhase0Research,
): Promise<[Phase0Result, Phase0Result]> {
  const mine = await runner(lang);
  const gapMs = p0PairGapMs();
  if (gapMs > 0 && mine.source.includes("groq")) {
    console.log(
      `[blog-research] P0 pair: ${lang} landed on groq (${mine.source}) → waiting ${Math.round(gapMs / 1000)}s before the ${otherLang} twin's grounded walk (free-tier token/tool bucket recovery — P0-PAIR-SERIAL)`,
    );
    await sleepMs(gapMs);
  }
  const other = await runner(otherLang);
  return [mine, other];
}
