/**
 * src/lib/blog-pipeline.ts — PIPELINE V2 · writing phases (P1 outline,
 * P2 content, P4 review + the MSA/Latin repair passes).
 *
 * Current law: the writing laws compose BYTE-EXACT from the single-source
 * editorial constitution (src/lib/blog-editorial-law.ts — AUDIT §9-1.2);
 * the file history/phase chronicle lives in
 * archive/PROMPT-LAW-HISTORY.md (AUDIT §9-2.6 pruning law).
 */
import { callFreeAIFallbackChain, parseJSON } from "./ai-provider";
import { type LanguageResearch } from "./blog-research";
import { getRecentPostsByLanguage, getRecentContentDigests, isDuplicateTopic } from "./blog-topics";
import { sanitizeModelSlug } from "./slug";
import {
  AR_MSA_EDITOR_LAW,
  FAQ_HEADING_RE,
  scanArabicDialect,
  scanLatinContamination,
  validateMsaConversion,
  countArabicWords,
} from "./blog-msa";
// AUDIT_REPORT §9-المرحلة 1, item 2 (2026-09-29) — the editorial
// constitution now lives in ONE module (blog-editorial-law.ts) and is
// imported byte-exact by P1/P2/P4 here AND the fallback generator in
// ai-job-processors.ts (the AR_MSA_EDITOR_LAW Phase-175 pattern,
// generalized per the audit's «دستور prompts موحّد» order). The blocks
// below are the exact pre-Phase-1 strings — the composed prompts are
// byte-identical; canaries in blog-editorial-law.test.ts prove no fork.
import {
  EDITORIAL_LANG_RULE,
  EDITORIAL_ANSWER_FIRST,
  EDITORIAL_EEAT,
  EDITORIAL_FACT_GUARD,
  EDITORIAL_DEPTH_OVER_LENGTH,
  EDITORIAL_FAQ_CONTRACT,
  EDITORIAL_FAQ_COUNT_RANGE,
  EDITORIAL_AUTHORITY_DOMAINS,
  EDITORIAL_ANCHOR_GRAMMAR_LAW,
} from "./blog-editorial-law";
// PHASE 171 (blog-audit proposal ب): every model-JSON parse in P1/P2/P4
// now uses the 161.5-hardened parseJSON from ai-provider (fence-strip +
// truncation repair + control-char escaping) — the legacy weak
// parseJSONLoose was deleted from blog-research.ts. Same parser as the
// coach path: one JSON-recovery law for BOTH article systems.

// ─────────────────────────────────────────────────────────────────
// OWNER HARD RULE (2026-08-27 REVISED): PEOPLE-FREE AI imagery ONLY.
// The old textual 'modesty suffix' is RETIRED — see image-safety.ts.
// ─────────────────────────────────────────────────────────────────
export const IMAGE_MODESTY_SUFFIX_RETIRED = true;
// (retired value — negation tokens like 'no nudity' POISON diffusion
// prompts and directly caused the live immodest-render incident;
// policy now centralized in src/lib/image-safety.ts)

export type ImagePlanItem = { subject: string; type: string };

export type OutlinePlan = {
  title: string;
  subtitle: string;
  metaDescription: string;
  slugBase: string;
  sections: string[]; // 5–7 H2 headings
  lsiKeywords: string[];
  imagePlan: ImagePlanItem[];
  /** PHASE 62 VARIETY: the article type/angle chosen for this run —
   *  shapes the outline + writing instructions so consecutive articles
   *  stop sharing one structural mold. */
  angle?: string;
};

export type ReviewReport = {
  changesSummary: string[];
  keywordCoverage: "good" | "partial" | "poor";
  factCheckNotes: string;
};

export type InternalLinkCandidate = { slug: string; title: string };

// PHASE 173/176 (current law): ARABIC = Modern Standard Arabic ONLY,
// Pan-Arab and easy for every Arabic reader — the full editorial law text
// lives in blog-editorial-law.ts LANG_RULE.ar (single source). History:
// archive/PROMPT-LAW-HISTORY.md.
export const LANG_RULE: Record<"en" | "ar", string> = EDITORIAL_LANG_RULE;

/** Compact JSON view of research fed to prompts (keeps token cost sane).
 *  PHASE 344 (owner order «تدخل نتائج البحث الفعلية في عملية توليد
 *  المقال»): the REAL Google-Search evidence (searchedQueries + grounded
 *  result pages) rides the digest into the P1 outline prompt — empty for
 *  pre-344 bundle rows, whose digest stays byte-identical to before. */
function researchDigest(r: LanguageResearch): string {
  const kws = r.keywords.map((k) => `${k.keyword} (${k.searchVolume || "?"})`).join("; ");
  const faqs = r.faqs.map((f) => `Q: ${f.question}`).join(" | ");
  const queries = (r.searchedQueries ?? []).length
    ? `\nLIVE SEARCH QUERIES (real Google Search this research ran): ${(r.searchedQueries ?? []).join(" | ")}`
    : "";
  const srcs = (r.sources ?? []).length
    ? `\nTOP LIVE SEARCH RESULTS (real pages the research grounded on — title + URL):\n${(r.sources ?? []).slice(0, 8).map((s) => `- ${s.title || "(untitled)"} — ${s.url}`).join("\n")}`
    : "";
  return `KEYWORDS: ${kws}\nCOMMON QUESTIONS: ${faqs}${queries}${srcs}`;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 62 VARIETY — ARTICLE-TYPE ROTATION (owner: «مفروض يكون فى تنوع
// كبير وتدوير لنوع المقالات»). Path A previously forced EVERY article
// through one generic 5-7 H2 teaching skeleton + the same closing CTA.
// Each run now draws a random angle and the outline/writing/review
// prompts genuinely shape themselves around it.
// ═══════════════════════════════════════════════════════════════
type ArticleAngle = { id: string; en: string; ar: string; shapeEn: string; shapeAr: string };

export const ARTICLE_ANGLES: ArticleAngle[] = [
  {
    id: "guide",
    en: "a practical step-by-step how-to guide",
    ar: "دليل عملي خطوة بخطوة",
    shapeEn: "numbered step sections, each with concrete actions and a common-pitfall note",
    shapeAr: "أقسام خطوات مرقّمة، كل خطوة بإجراءات ملموسة وتحذير من خطأ شائع",
  },
  {
    id: "myths",
    en: "a myth-busting article (claim → what science actually says → what to do instead)",
    ar: "مقال دحض خرافات (الادعاء ← ماذا يقول العلم فعلاً ← البديل الصحيح)",
    shapeEn: "one section per myth, each opening with the popular claim then the correction",
    shapeAr: "قسم لكل خرافة، يبدأ بالادعاء الشائع ثم تصحيحه العلمي",
  },
  {
    id: "comparison",
    en: "a head-to-head comparison (X vs Y)",
    ar: "مقال مقارنة مباشرة (س مقابل ص)",
    shapeEn: "criteria-based sections (effectiveness, cost, time, who it suits) ending with a verdict",
    shapeAr: "أقسام حسب معايير (الفعالية، التكلفة، الوقت، لمن يناسب) وتنتهي بحكم نهائي",
  },
  {
    id: "mistakes",
    en: "a mistakes-and-fixes article",
    ar: "مقال أخطاء وحلولها",
    shapeEn: "numbered mistakes, each with the signs you are doing it + the exact fix",
    shapeAr: "أخطاء مرقّمة، كل خطأ بعلامات تعرفه + الحل الدقيق",
  },
  {
    id: "science",
    en: "a science deep-dive explained simply",
    ar: "تحليل علمي مبسط",
    shapeEn: "mechanism → evidence → practical application sections, jargon-free",
    shapeAr: "أقسام: الآلية ← الأدلة ← التطبيق العملي، بلغة بسيطة بلا مصطلحات معقدة",
  },
  {
    id: "checklist",
    en: "a checklist / cheat-sheet article",
    ar: "مقال قائمة مرجعية (تشيك ليست)",
    shapeEn: "short focused sections of scannable checklists the reader can apply today",
    shapeAr: "أقسام قصيرة بقوائم قابلة للتطبيق اليوم",
  },
  {
    id: "faq",
    en: "a question-driven article answering real reader questions",
    ar: "مقال أسئلة وأجوبة لأكثر ما يسأل الناس",
    shapeEn: "each H2 is a real question phrased the way people search, answered directly",
    shapeAr: "كل عنوان رئيسي سؤال حقيقي بصيغة البحث الشائع، مع إجابة مباشرة",
  },
  {
    id: "plan",
    en: "a ready-to-use plan/template article (7-day sample, prep template…)",
    ar: "مقال خطة/قالب جاهز للتطبيق (أسبوع نموذجي، قالب تحضير وجبات…)",
    shapeEn: "template sections the reader can copy, with adaptation notes for different levels",
    shapeAr: "أقسام قوالب جاهزة للنسخ مع ملاحظات تكييف لكل مستوى",
  },
  {
    id: "beginner-path",
    en: "a beginner-focused pathway article (zero to competent in X weeks)",
    ar: "مقال مسار للمبتدئين (من الصفر إلى الإتقان خلال أسابيع)",
    shapeEn: "week-by-week progression sections with milestones and self-tests",
    shapeAr: "أقسام أسبوع بأسبوع مع محطات قياس تقدم واختبارات ذاتية",
  },
  {
    id: "food-focus",
    en: "a food/kitchen-focused practical article (shopping, prep, recipes structure)",
    ar: "مقال عملي مركز على المطبخ (تسوق، تحضير، هيكل وصفات)",
    shapeEn: "kitchen-actionable sections: what to buy, how to prep, how to combine",
    shapeAr: "أقسام قابلة للتنفيذ في المطبخ: ماذا تشتري، كيف تحضّر، كيف تجمع",
  },
];

export function pickArticleAngle(): ArticleAngle {
  return ARTICLE_ANGLES[Math.floor(Math.random() * ARTICLE_ANGLES.length)];
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1 — topic choice + outline
// ═══════════════════════════════════════════════════════════════

/** Model ranks the 5 researched topics; code applies a hard dup-guard. */
export async function pickTopicIndex(
  lang: "en" | "ar",
  topics: string[],
): Promise<number> {
  const recent = await getRecentPostsByLanguage(lang, 100);
  const recentLite = recent.map((p) => p.title);
  try {
    const prompt = `You are an SEO strategist. Recent published titles (avoid overlap):\n${recentLite.slice(0, 30).map((t) => `- ${t}`).join("\n")}\n\nCandidate topics:\n${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nPick the candidate with the best search potential AND lowest duplication risk. Return STRICT JSON: {"index": <1-based number>}`;
    const { text } = await callFreeAIFallbackChain(prompt, {
      tag: `blog:pick-topic-${lang}`,
      temperature: 0.4,
      // PHASE 177 (2026-09-11 audit): 40s killed the strongest model's CoT —
      // 220 aborts in 14d lived exactly here; the ultra-550b regularly needs
      // 30-90s of thinking before its tiny 120-token answer. GHA budget
      // 360s/3 = 120s allows 90s comfortably; the deterministic fallback pick
      // still guards the worst case.
      maxTokens: 120,
      jsonMode: true,
      timeoutMs: 90_000,
      maxModels: 3,
    });
    const parsed = parseJSON<{ index?: number }>(text);
    const idx = parsed?.index ? Number(parsed.index) - 1 : -1;
    if (idx >= 0 && idx < topics.length) return idx;
  } catch {
    /* fall through to deterministic pick */
  }
  // Deterministic fallback: first non-duplicate suggestion (LRU-friendly).
  for (let i = 0; i < topics.length; i++) {
    if (!recent.some((p) => isDuplicateTopic(topics[i], topics[i], [p]).duplicate)) return i;
  }
  return 0;
}

export async function buildOutline(
  lang: "en" | "ar",
  topic: string,
  research: LanguageResearch,
  // PHASE 157: paired rows (sharedBrief) pre-agree ONE article angle for
  // BOTH language twins — the brief's angleId is forced here. Invalid or
  // missing ids fall back to the random rotation (legacy behavior).
  opts?: { forcedAngle?: string },
): Promise<{ outline: OutlinePlan; source: string }> {
  const forced = ARTICLE_ANGLES.find((a) => a.id === opts?.forcedAngle);
  const angle = forced ?? pickArticleAngle();
  const angleLine = lang === "ar"
    ? `نوع المقال المطلوب: ${angle.ar} — صمّم أقسام H2 بحيث تناسب هذا النوع فعلاً (${angle.shapeAr})؛ ممنوع إعادة استخدام هيكل عام موحّد لكل المقالات.`
    : `ARTICLE TYPE: ${angle.en} — shape the H2 sections to genuinely fit this type (${angle.shapeEn}); do NOT reuse a generic one-size-fits-all skeleton.`;

  // PHASE 172 (owner order — topic/structure differentiation «منع التكرار
  // على مستوى search intent / angle / H2 structure / examples»): P1 now
  // sees the recent articles' actual coverage (focus keyword + H2
  // skeleton), not just their titles. The outline must differ at the
  // structure and angle level — a new title over a recycled skeleton is
  // the failure mode this block kills. Degrades to an empty string when
  // the digest query fails (legacy title-blind behavior).
  let recentContext = "";
  try {
    const digests = await getRecentContentDigests(lang, 10);
    if (digests.length) {
      const lines = digests
        .slice(0, 10)
        .map(
          (d) =>
            `- "${d.title}"${d.focusKeyword ? ` (focus: ${d.focusKeyword})` : ""}${
              d.h2s.length ? ` — sections: ${d.h2s.slice(0, 5).join(" | ")}` : ""
            }`,
        )
        .join("\n");
      recentContext = lang === "ar"
        ? `\nآخر المقالات المنشورة في نفس اللغة (ممنوع تكرار نيتها البحثية أو زاويتها أو هيكل عناوينها أو أمثلتها الرئيسية — اجعل هيكل أقسام هذا المقال مختلفًا فعليًا:\n${lines}\n`
        : `\nRECENTLY PUBLISHED ARTICLES IN THIS LANGUAGE (do NOT repeat their search intent, angle, H2 structure, main examples, or practical recommendations — this article's section skeleton must be genuinely different):\n${lines}\n`;
    }
  } catch {
    /* differentiation context is best-effort — outline proceeds title-blind */
  }

  const titleVarietyLine = lang === "ar"
    ? `قانون تنويع العنوان: صيغة العنوان يجب أن تناسب نية البحث لا قالبًا ثابتًا — نوّع بين صيغة سؤال، أو «س مقابل ص»، أو قائمة مرقّمة، أو دحض خرافة، أو وصفًا مباشرًا. لا تجعل كل العناوين تبدأ بنفس الصيغة، ولا تفرض قالبًا واحدًا على كل المقالات.`
    : `TITLE VARIETY LAW: the headline format must fit the search intent — rotate between a question, an "X vs Y" comparison, a number-led list, a myth-busting callout, or a plain descriptive phrase. Never lock every title into one opening formula (e.g. every title starting the same way); no fixed template.`;

  const prompt = `You are an expert SEO content planner for a fitness & nutrition blog.
${LANG_RULE[lang]}

CHOSEN TOPIC: "${topic}"

${angleLine}
${titleVarietyLine}
${recentContext}
LONG-TAIL SEO LAW (owner directive 2026-09-01): the title, at least TWO H2
headings, and at least 5 of the LSI keywords must mirror REAL long-tail
search phrasing — the exact question-style / how-to / "best X for Y" phrasings
people type into Google and AI assistants (e.g. "how many calories to eat to
lose weight" beats "calories"). Broad head-term titles are a FAILURE.
LONG-TAIL NATURALNESS (Phase 172): keywords guide the phrasing, they must NEVER
deform the language — H2s are written for human readers first.

${researchDigest(research)}

Create the detailed article blueprint. Return STRICT JSON only:
{
  "title": "SEO headline 50-65 chars containing the LONG-TAIL keyword naturally, phrased like a real search query",
  "subtitle": "one engaging supporting line",
  "metaDescription": "140-155 chars including the long-tail keyword",
  "slugBase": "short-url-slug-in-lowercase-english-even-for-arabic",
  "sections": ["H2 heading 1", "..."],            // exactly 5-7 H2s shaped for the article type above; at least TWO phrased as real long-tail search questions; NOT copying the section skeletons of the recent articles above
  "lsiKeywords": ["...", "..."],                   // 8-12 sub-keywords to weave in naturally; at least 5 must be 3+ word long-tail phrases
  "imagePlan": [ {"subject": "exact visual subject", "type": "photo|infographic|diagram"} ] // 3-5 items matching the sections. IMAGE LAW: subjects MUST be ENGLISH physical OBJECTS or SCENES ONLY (equipment, food, interiors) — NEVER any person, body part, people word, or clothing wording. PHASE 173 OWNER LAW (absolute): NEVER any woman, girl, or female subject in any image — if a person is ever needed, adult MEN only; otherwise use non-human subjects (equipment, food, anatomy diagrams, empty gym scenes)
}`;
  const { text, model, provider } = await callFreeAIFallbackChain(prompt, {
    tag: `blog:outline-${lang}`,
    temperature: 0.6,
    // 2026-08-27 hardening: Groq's strict json mode HARD-FAILS when a
    // reasoning model (gpt-oss) burns completion tokens on hidden CoT
    // before finishing the document ("max completion tokens reached").
    // We have our own tolerant extractor (161.5-hardened parseJSON) — drop
    // response_format so partial/fenced JSON can still be salvaged.
    // PHASE 171 (2026-09-10, blog-audit proposal ب): 2_600 → 4_000.
    // Live evidence: 3 failed EN runs «P1 en: invalid outline JSON from
    // openrouter:nvidia/nemotron-3-ultra-550b-a55b:free» (09-06/07/09) —
    // a verbose reasoning model burning hidden CoT against a 2_600 cap
    // truncates the outline JSON mid-document. Headroom now matches the
    // doc's real size (~700 JSON tokens) + reasoning-model CoT, and the
    // hardened parser salvages any residual truncation that still slips
    // through.
    maxTokens: 4_000,
    jsonMode: false,
    // PHASE 177 (2026-09-11 audit): 70s → 110s — the ultra-550b outline
    // attempts aborted at 70s repeatedly (220 timeout/abort class across
    // the window); 360s GHA budget / 2 models = 180s leaves headroom.
    timeoutMs: 110_000,
    maxModels: 2,
  });
  const parsed = parseJSON<{
    title?: string;
    subtitle?: string;
    metaDescription?: string;
    slugBase?: string;
    sections?: unknown[];
    imagePlan?: unknown[];
    lsiKeywords?: unknown[];
  }>(text);
  if (!parsed?.title || !Array.isArray(parsed.sections)) {
    throw new Error(`P1 ${lang}: invalid outline JSON from ${provider}:${model}`);
  }
  const imagePlan: ImagePlanItem[] = Array.isArray(parsed.imagePlan)
    ? parsed.imagePlan
        .map((i) => {
          // Per-item loose view — model JSON fields are defensively coerced below.
          const r = (typeof i === "object" && i !== null ? i : {}) as Record<string, unknown>;
          return { subject: String(r.subject ?? "").trim(), type: String(r.type ?? "photo").trim() };
        })
        .filter((i: ImagePlanItem) => i.subject.length > 2)
        .slice(0, 5)
    : [];
  // PHASE 172.1 (live run 34503876025 forensics — AR outline landed with
  // imagePlan:0): a plan-less outline was ACCEPTED here and the failure
  // only surfaced at P3 («image plan missing») AFTER the full P2 article
  // had been written — burning the whole run and the day's slot. Fail
  // FAST at P1 instead: the runner's existing ×3 retry re-runs the
  // outline (fresh model draw) and the plan comes back populated.
  if (imagePlan.length === 0) {
    throw new Error(
      `P1 ${lang}: outline missing image plan (model dropped the field) from ${provider}:${model} — retrying draws a fresh outline`,
    );
  }
  const lsi: string[] = Array.isArray(parsed.lsiKeywords)
    ? parsed.lsiKeywords.filter((k: unknown): k is string => typeof k === "string").slice(0, 12)
    : [];

  console.log(`[blog-pipeline] P1 ${lang} done (${provider}:${model}, angle: ${angle.id})`);
  return {
    outline: {
      title: String(parsed.title),
      subtitle: String(parsed.subtitle ?? ""),
      // PHASE 178: word-boundary clamp replaces the raw `.slice(0, 160)`
      // mid-word cut (the P0-3 title law, applied to descriptions — the
      // 2026-09-12 live audit found 14 published rows ending "…and equ" /
      // "…لدع"). Budget 158 EN / 160 AR + guaranteed sentence-final mark.
      metaDescription: clampMetaDescription(String(parsed.metaDescription ?? ""), lang),
      // ONE-SLUG-LAW (2026-08-28j): was a local 60-char inline sanitize —
      // now the same latin law as the coach generator (≤80, min 3 → "").
      slugBase: sanitizeModelSlug(String(parsed.slugBase ?? topic)),
      sections: parsed.sections.filter((s: unknown): s is string => typeof s === "string").slice(0, 8),
      lsiKeywords: lsi,
      imagePlan,
      angle: angle.id,
    },
    source: `${provider}:${model}`,
  };
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — full content generation (1500–2500 words)
// ═══════════════════════════════════════════════════════════════

/**
 * PHASE 172 (owner order — regeneration anti-repetition «إعادة توليد
 * المقال نفسه لا تنتج نسخة شبه مطابقة»): a per-run VARIATION SEED is
 * injected into the writing prompt. Same topic + same outline re-run
 * still draws a different example-emphasis and framing, so a regenerated
 * article genuinely changes content (search intent + facts preserved).
 */
const VARIATION_SEEDS: Record<"en" | "ar", string[]> = {
  en: [
    "EXAMPLE EMPHASIS: ground your advice in gym/equipment-based scenarios (barbells, machines, commercial-gym logistics).",
    "EXAMPLE EMPHASIS: ground your advice in home/minimal-equipment scenarios (bodyweight, dumbbells, small spaces).",
    "EXAMPLE EMPHASIS: lead sections with concrete numbers and quick math the reader can reproduce today (portions, grams, minutes).",
    "EXAMPLE EMPHASIS: lead sections with food-first practicality (meals, groceries, kitchen logistics, budget options).",
    "EXAMPLE EMPHASIS: frame sections around decision points the reader faces (choosing, adjusting, troubleshooting plateaus).",
  ],
  ar: [
    "تركيز الأمثلة: سيناريوهات الجيم والمعدات (بار، أجهزة، إدارة وقت النادي).",
    "تركيز الأمثلة: سيناريوهات المنزل والمعدات البسيطة (وزن الجسم، دمبل، مساحات صغيرة).",
    "تركيز الأمثلة: أرقام وحسابات عملية يقدر القارئ تطبيقها اليوم (كميات، جرامات، دقائق).",
    "تركيز الأمثلة: طعام أولًا (وجبات، مشتريات، تنظيم المطبخ، خيارات اقتصادية).",
    "تركيز الأمثلة: بناء الأقسام حول قرارات حقيقية يواجهها القارئ (الاختيار، التعديل، حل الثبات).",
  ],
};

const FAQ_SECTION_HEADING: Record<"en" | "ar", string> = {
  en: "## Frequently Asked Questions",
  ar: "## الأسئلة الشائعة",
};

// R4 — EXECUTION-WORD-FLOOR ALIGNMENT (Execution-Path Audit §10 Phase R4 /
// §8.2 B2 + §3.5, 2026-09-29): the writing layer's shared execution floor.
// Misalignment history: the P2 prompt asked 1500-2500 words, the CODE
// floors were 400-word parse-validity nets from an older era, and P5's
// publish floor (1300, p5-publish route) was the only real net — so
// 419/752/855-1271-word drafts (audit §3.1 + the R3 live runs) flowed
// through images + review and died at the MOST expensive point, and a
// P4 review that SHRANK a passing draft (live-measured 1201→752 in run
// 36582658309; 1409→1369 in §3.2) survived to fail at P5 after the whole
// chain had already re-run. Both writing steps now carry the same
// shared execution floor. A short draft dies at ITS OWN step, where the
// ×3 retry is a cheap fresh model draw, and review shrinkage below the
// floor dies at P4 instead of at P5. Floor VALUE history: R4 (2026-09-30)
// set 1200 here + 1300 at P5; owner order 2026-10-02 (Phase 323) lowered
// BOTH floors to 1000 — the ask (1500-2500), every other gate, and the
// R1 repair loop mechanics are unchanged; the former 1200-1300 band is
// gone (any draft ≥1000 now clears P2/P4/P5 alike).
export const BLOG_EXECUTION_WORD_FLOOR = 1000;

export async function generateFullArticle(
  lang: "en" | "ar",
  outline: OutlinePlan,
  research: LanguageResearch,
): Promise<{ markdown: string; wordCount: number; source: string }> {
// PHASE 176 (current law): the FAQ section is article-specific (see the
// FAQ CONTRACT in blog-editorial-law.ts); filterFaqsByRelevance enforces
// it deterministically at P5. Incident history: archive/PROMPT-LAW-HISTORY.md.
  const relevantResearchFaqs = relevantResearchFaqsForTitle(research.faqs, outline.title);
  const faqBlock = relevantResearchFaqs
    .map((f) => `- ${f.question}`)
    .join("\n");

  // PHASE 62 VARIETY: honor the angle chosen in P1 (flows through the
  // queue bundle). Unknown/legacy outlines fall back to a random angle.
  const angle = ARTICLE_ANGLES.find((a) => a.id === outline.angle) ?? pickArticleAngle();
  const angleLine = lang === "ar"
    ? `اكتب المقال كـ${angle.ar}: ${angle.shapeAr}.`
    : `Write this as ${angle.en}: ${angle.shapeEn}.`;

  // PHASE 172: per-run variation seed (regeneration changes content).
  const variationSeed =
    VARIATION_SEEDS[lang][Math.floor(Math.random() * VARIATION_SEEDS[lang].length)];

  // PHASE 344 (owner order «تدخل نتائج البحث الفعلية في عملية توليد
  // المقال»): the writer sees the REAL search pages the research stage
  // grounded on — facts align with the live SERP coverage instead of
  // model memory alone. Empty for pre-344 bundles → byte-identical
  // prompt. The FACT GUARD citation law below is UNCHANGED (owner scope:
  // feed the results, not rewrite the citation rules).
  const searchContextBlock = (research.sources ?? []).length
    ? `\nVERIFIED SEARCH CONTEXT — live Google-Search results the research stage grounded on (use their findings as your factual baseline for numbers, claims and current guidance; the citation law above is unchanged):\n${(research.sources ?? []).slice(0, 8).map((s) => `- ${s.title || "(untitled)"} — ${s.url}`).join("\n")}\n`
    : "";

  // AUDIT_REPORT §9-المرحلة 1, item 2 (2026-09-29): the five writing
  // laws now come from the shared editorial constitution
  // (blog-editorial-law.ts) — byte-exact (asserted at extraction),
  // canary-pinned, and composed identically by the fallback generator
  // in ai-job-processors.ts (one law, every surface — no fork).
  const answerFirstLine = EDITORIAL_ANSWER_FIRST[lang];
  const eeatLine = EDITORIAL_EEAT[lang];
  const factLine = EDITORIAL_FACT_GUARD[lang];
  const faqSectionLine = EDITORIAL_FAQ_CONTRACT[lang];
  const qualityLine = EDITORIAL_DEPTH_OVER_LENGTH[lang];

  const prompt = `You are an elite fitness/nutrition copywriter. Write the FULL article.
${LANG_RULE[lang]}

TITLE: ${outline.title}
SUBTITLE: ${outline.subtitle}
MAIN KEYWORDS TO COVER NATURALLY: ${research.keywords.slice(0, 6).map((k) => k.keyword).join("; ")}
LSI KEYWORDS: ${outline.lsiKeywords.join("; ")}
${searchContextBlock}

LONG-TAIL RULE: the keywords above are LONG-TAIL search phrases — include
them VERBATIM (or a natural near-verbatim phrasing) inside H2 headings and
paragraph text ONLY where it reads naturally. These phrasings are what the
article must rank for; natural language quality always wins over verbatim
placement.

${answerFirstLine}
${angleLine}
${variationSeed}
${eeatLine}
${factLine}
${qualityLine}
${faqSectionLine}

EXACT OUTLINE — follow it section by section:
- Introduction (ANSWER-FIRST: the direct answer, then what the reader will learn)
${outline.sections.map((s) => `- H2: ${s}`).join("\n")}
- Conclusion
- ${FAQ_SECTION_HEADING[lang]} (the article-specific FAQ section described above)

REQUIREMENTS:
1. Length: 1500-2500 words TOTAL (do NOT stop before 1500; do NOT pad past usefulness).
2. Use "## " for each H2 exactly as outlined (keep the wording), short paragraphs (2-4 sentences), bullet lists where useful.
3. Weave keywords + LSI terms NATURALLY (never at the cost of readability).
4. Where a researched question fits the article's intent, answer it inside the relevant section:
${faqBlock}
5. Evidence-aligned practical advice. Cite evidence ONLY as markdown links to the authority domains listed in the FACT GUARD law above (each link directly supporting its sentence — certain-to-exist pages); when no certain link fits, use generic evidence phrasing. Do NOT invent paper names, authors, URLs, or statistics.
6. No title repetition at the top — start directly with the ANSWER-FIRST introduction paragraph.

Return STRICT JSON only:
{ "articleMd": "the full article in markdown (## headings, no # H1)" }`;

  const { text, model, provider } = await callFreeAIFallbackChain(prompt, {
    tag: `blog:content-${lang}`,
    temperature: 0.7,
    // GROQ FREE FIT (2026-08-27, hard data from dispatch logs): Groq enforces
    // an 8000 TPM ceiling and COUNTS max_tokens in it — a 16000-cap request
    // returns 413 'Requested 16664' every time. A 1500-2500 word article is
    // only ~3000 output tokens, so 6400 keeps us under the ceiling while
    // leaving headroom. Nightly upstream outages (entire Google gemma pool
    // 429 for hours) leave nemotron as sole carrier some windows — give it
    // a REAL long window.
    // R3 (Execution-Path Audit 2026-09-29): maxModels 2 → 3. The 480s
    // workflow budget (AI_CHAIN_TOTAL_BUDGET_MS, up from 360s) funds a third
    // live entry: eff = min(150s, 480s/3=160s) = 150s ×3 models — per-model
    // timeout UNCHANGED. Entry #2 is Groq/gpt-oss-120b, re-admitted for this
    // ~8.7k-est call by the R3 per-entry clamp (~4.8–4.9k max_tokens — enough
    // for a 1300–2500-word article). Breaks the OR+NV dual-provider
    // isolation that exhausted P2 chains live (run 36582658309: OR-abort +
    // NV-503 in one window; AR 09-22/23/24 chain exhaustions).
    maxTokens: 6_400,
    jsonMode: false, // tolerant extraction instead of strict-mode hard fails
    timeoutMs: 150_000,
    maxModels: 3,
  });
  const parsed = parseJSON<{ articleMd?: string; article?: string }>(text);
  const md = (parsed?.articleMd || parsed?.article || "").trim();
  const wc = countWords(md);
  // R4: the 400-word parse-validity net let 419/752-word drafts cross
  // into images + review and die at P5's 1300 floor (audit §3.1/§3.5) —
  // the execution floor now kills them HERE, at the cheapest retry point.
  if (!md || wc < BLOG_EXECUTION_WORD_FLOOR) {
    throw new Error(
      `P2 ${lang}: empty/too-short article from ${provider}:${model} (${wc} words < ${BLOG_EXECUTION_WORD_FLOOR}-word execution floor)`,
    );
  }
  console.log(`[blog-pipeline] P2 ${lang} done (${provider}:${model}, ~${wc} words)`);
  return { markdown: md, wordCount: wc, source: `${provider}:${model}` };
}

export function countWords(md: string): number {
  return md.split(/\s+/).filter(Boolean).length;
}

// PHASE 189 (current law): SERP-safe meta title clamp — re-exported from
// the zero-dep single source blog-meta-title.ts (law + chronicle there;
// the full phase history lives in archive/PROMPT-LAW-HISTORY.md).
export {
  clampMetaTitle,
  stripDanglingTail,
  stripDanglingConnectives,
} from "./blog-meta-title";

// PHASE 178 (current law): meta description clamp — word-boundary cut at
// budget 158 EN / 160 AR, never a dangling connector, always a clean
// sentence-final mark. Incident history: archive/PROMPT-LAW-HISTORY.md.

const META_DESCRIPTION_MAX: Record<"en" | "ar", number> = { en: 158, ar: 160 };

/** Trailing connectors + separators — a clamp may never end on these. */
const DESC_TRAILING_JUNK_RE =
  /(?:[\s.,;:،؛\-–—]+|\b(?:and|or|with|the|of|to|for|in|on|a|an|plus|including)\b[\s.,؛،]*|\b(?:و|أو|مع|في|من|إلى|على|ثم|مع)\b[\s.,؛،]*)+$/i;

export function clampMetaDescription(rawDesc: string, lang: "en" | "ar"): string {
  const max = META_DESCRIPTION_MAX[lang];
  let d = (rawDesc ?? "").trim();
  if (!d) return d;

  // Law 2 — already within budget.
  if (d.length <= max) {
    // Law 3+4 still apply: no connector/punct island, terminal mark.
    const cleaned = d.replace(DESC_TRAILING_JUNK_RE, "").trim();
    if (!cleaned) return d;
    return /[.!?؟…]$/.test(cleaned) ? cleaned : `${cleaned}.`;
  }

  // Law 2 — word-boundary cut.
  const cut = d.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const floor = Math.floor(max / 2);
  let clipped = lastSpace >= floor ? cut.slice(0, lastSpace) : cut;

  // Laws 3+4 — never end on a connector island; end on a sentence mark.
  clipped = clipped.replace(DESC_TRAILING_JUNK_RE, "").trim();
  if (!clipped) return `${d.slice(0, max).trim()}.`;
  return /[.!?؟…]$/.test(clipped) ? clipped : `${clipped}.`;
}



// ═══════════════════════════════════════════════════════════════
// PHASE 4 — quality review & enhancement
// ═══════════════════════════════════════════════════════════════

/**
 * Deterministic safety net: if the enhanced draft is still missing an FAQ
 * section, append one built from Phase 0 research (real answers, no
 * hallucination). Used by the p4 route after the model pass.
 *
 * PHASE 172 (owner order — «أصلح مشكلة FAQ filler»): the append is now
 * RELEVANCE-FILTERED and CAPPED. P0 FAQs are niche-generic by design, so
 * blindly appending all of them produced the live filler evidence (a
 * creatine article carrying 9 off-topic FAQ cards, rendered twice). Only
 * questions sharing meaningful vocabulary with the article's title/focus
 * keyword are appended (≤6). Zero relevant questions → nothing appended —
 * an absent FAQ is CORRECT when the research set doesn't serve the
 * article's intent (no forced FAQ).
 *
 * Interrogatives/auxiliaries that match ANY fitness topic are stop-words
 * here, so "How often should I deload?" never counts as related to a
 * creatine-loading article merely via the word "how".
 */
const FAQ_RELEVANCE_STOPWORDS = new Set([
  // EN
  "how", "what", "when", "where", "which", "why", "who", "the", "for", "with",
  "and", "you", "your", "are", "can", "could", "does", "did", "should", "would",
  "will", "need", "needs", "many", "much", "take", "per", "day", "days", "week",
  "weeks", "all", "any", "from", "that", "this", "into", "only", "also", "get",
  "gets", "have", "has", "had", "help", "helps", "about", "best", "top", "good",
  "bad", "than", "then", "there", "their", "them", "its", "work", "works",
  // AR
  "كيف", "كم", "ما", "ماذا", "متى", "أين", "هل", "في", "على", "من", "الى",
  "إلى", "عن", "مع", "هذا", "هذه", "ذلك", "تلك", "التي", "الذي", "كل", "بعض",
  "يجب", "يمكن", "احتاج", "أحتاج", "تحتاج", "افضل", "أفضل", "متى", "لماذا",
]);

function faqRelevanceWords(s: string): Set<string> {
  // PHASE 176 — Arabic definite-article/prefix normalization: exact-token
  // matching missed real overlaps («بروتين» never matched «البروتين»,
  // «عضلي» never matched «عضلات»-bearing titles' «العضلي»). Stripping the
  // leading article (ال/وال/بال/لل…) lets the FAQ relevance filter
  // recognize the SAME concept word in either form.
  const stripArabicPrefix = (w: string) => w.replace(/^(?:وال|بال|فال|كال|لل|ال)/, "");
  return new Set(
    s
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .map((w) => (w.length > 2 && /[\u0600-\u06FF]/.test(w) ? stripArabicPrefix(w) : w))
      .filter((w) => w.length > 2 && !FAQ_RELEVANCE_STOPWORDS.has(w)),
  );
}

/** Shared relevance matcher (the ensureFaqSection append path AND the
 * PHASE 176 P2 prompt-injection + P5 lift filters ride this one law):
 * research FAQs are relevant to a title when they share at least one
 * meaningful vocabulary word. */
function relevantResearchFaqsForTitle(
  faqs: { question: string; answer: string }[],
  titleHint: string,
): { question: string; answer: string }[] {
  const hintWords = faqRelevanceWords(titleHint);
  if (hintWords.size < 2) return faqs;
  return faqs.filter((f) => {
    const words = faqRelevanceWords(`${f.question} ${f.answer}`);
    return [...words].some((w) => hintWords.has(w));
  });
}

// PHASE 176 (current law): FAQ relevance filter — a question must share
// ≥2 meaningful words with the article's title+focus to survive the P5
// lift. Incident history: archive/PROMPT-LAW-HISTORY.md.
export function filterFaqsByRelevance<T extends { question: string; answer: string }>(
  faqs: T[],
  hint: string,
): T[] {
  const hintWords = faqRelevanceWords(hint);
  if (hintWords.size < 2) return faqs;
  return faqs.filter((f) => {
    const words = faqRelevanceWords(`${f.question} ${f.answer}`);
    let shared = 0;
    for (const w of words) if (hintWords.has(w)) shared++;
    return shared >= 2;
  });
}

export function ensureFaqSection(
  lang: "en" | "ar",
  md: string,
  research: LanguageResearch,
  topicHint?: string,
): { md: string; appended: boolean; appendedCount: number } {
  const header = FAQ_SECTION_HEADING[lang];
  if (FAQ_HEADING_RE.test(md)) return { md, appended: false, appendedCount: 0 };
  // PHASE 176: the matcher logic moved to the shared
  // relevantResearchFaqsForTitle helper (the P2 prompt-injection filter
  // rides the exact same law — one implementation, no fork).
  const relevant = (faqRelevanceWords(topicHint ?? "").size >= 2
    ? relevantResearchFaqsForTitle(research.faqs, topicHint ?? "")
    : []
  ).slice(0, 6);
  if (relevant.length === 0) return { md, appended: false, appendedCount: 0 };
  const items = relevant.map((f) => `**${f.question}**\n\n${f.answer}`);
  return {
    md: `${md}\n\n${header}\n\n${items.join("\n\n")}`,
    appended: true,
    appendedCount: items.length,
  };
}

// ─────────────────────────────────────────────────────────────────
// FAQ MARKDOWN CONTRACT (Phase 172) — P2 writes the article-specific
// FAQ section into the markdown; P5 lifts it into blog_posts.faq_json
// (the visual FAQ cards) and removes it from the body so the section
// renders exactly ONCE (the pre-172 live pages rendered the generic
// research FAQ twice: once inside the body, once as faq_json cards).
// Heading + "**question**" + answer-paragraph is the shared contract.
// ─────────────────────────────────────────────────────────────────

// (PHASE 178: FAQ_HEADING_RE now lives in blog-msa.ts as the shared
// single source — the publish-time lift here AND the render-time
// single-display strip in BlogArticlePage ride the same contract.)

/** Strip inline markdown (bold/italic/links) so FAQ cards render plain text. */
function stripInlineMarkdown(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [text](url) → text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold**
    .replace(/\*([^*]+)\*/g, "$1") // *italic*
    .trim();
}

type ParsedFaq = { question: string; answer: string };

/**
 * Split the FAQ section out of an article's markdown (pure). Returns the
 * Q/A pairs (answers plain-text, inline markdown stripped, capped at 7 —
 * owner range 4-7) and the body markdown with the FAQ section REMOVED —
 * from the heading through the next H2 (or end of document). No
 * recognizable FAQ section → unchanged body + empty list (the caller
 * falls back to the legacy faq_json source).
 */
/**
 * PHASE 176 — strip the copied «السؤال؟» / "The question?" label prefix
 * from an FAQ question (live evidence: the 09-11 protein-timing article
 * rendered every FAQ card as «السؤال؟ ما هو أفضل وقت…» because the
 * writing model read the contract's literal «**السؤال؟**» example as a
 * prefix to copy). Shared by splitFaqSection AND the legacy cleanup
 * runner's FAQ-hygiene mode (one law, no fork).
 */
export function stripFaqQuestionLabel(q: string): string {
  return q
    .trim()
    .replace(/^(?:السؤال|question|the\s+question)\s*[؟?]*\s*[:：]?\s*/i, "")
    .trim();
}

// R4 — THIRD LIFT-ONLY FAQ FORMAT (Execution-Path Audit §10 Phase R4 /
// §8.2 B3, 2026-09-29): a PLAIN-TEXT question line. Live evidence
// (audit §3.3, queue row 38f230fb, run 36507693416): the P4 review model
// rewrote the FAQ section with plain-text question lines — "How soon
// after a long run…?" on its own line, the answer paragraph below —
// while the lifter recognized only **bold** and ### H3 lines. It lifted
// ZERO questions, the research0 fallback dropped all ten (relevance),
// and G3 killed a ~complete 1369-word article as "FAQ count 0". The
// lifter now recognizes a plain-text question line too — CONSERVATIVELY:
// it must be short (≤25 words), end in ?/؟, carry no block markdown,
// and it may never steal the first line of an answer still being
// accumulated. The questions ALREADY exist in the body; the lifter
// recovers them instead of discarding a publishable article. The
// models' WRITING contract is unchanged, and the count/quality gates
// (G3 range, relevance, AR Latin) judge the lifted result exactly as
// before.
const TEXT_QUESTION_MAX_WORDS = 25;

function isPlainTextQuestionLine(t: string): boolean {
  if (!/[?؟]$/.test(t)) return false;
  // Block markdown (headings, lists, quotes, tables) is not a prose
  // question — the third format covers plain question lines only.
  if (/^(?:#{1,6}[ \t]|>|\||[-*+]\s|\d+[.)]\s)/.test(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= TEXT_QUESTION_MAX_WORDS;
}

export function splitFaqSection(
  lang: "en" | "ar",
  md: string,
): { body: string; faqs: ParsedFaq[] } {
  const match = FAQ_HEADING_RE.exec(md);
  if (!match) return { body: md, faqs: [] };
  const start = match.index;
  const afterHeading = md.indexOf("\n", match.index + match[0].length);
  const sectionStart = afterHeading === -1 ? md.length : afterHeading + 1;
  // The section ends at the next H2 heading (e.g. a post-FAQ CTA) or EOF.
  const nextH2 = /^##[ \t]+/m.exec(md.slice(sectionStart));
  const sectionEnd = nextH2 ? sectionStart + nextH2.index : md.length;
  const section = md.slice(sectionStart, sectionEnd).trim();

// PHASE 172.1 (current law): the question-line parser tolerates the
// model's separator quirks (bold markers, dashes) before lifting Q/A pairs.
// Run forensics history: archive/PROMPT-LAW-HISTORY.md.
  const faqs: ParsedFaq[] = [];
  const BOLD_Q_LINE = /^\*\*(.+?)\*\*$/;
  const H3_LINE = /^###[ \t]+(.+)$/;
  let current: ParsedFaq | null = null;
  for (const line of section.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    const boldQ = BOLD_Q_LINE.exec(t);
    const h3Q = H3_LINE.exec(t);
    const qText = boldQ?.[1] ?? h3Q?.[1];
    const isLabel = qText !== undefined && /[:：]\s*$/.test(qText.trim());
    if (qText !== undefined && !isLabel) {
      if (current && current.question && current.answer) faqs.push(current);
      current = { question: stripInlineMarkdown(qText), answer: "" };
      continue;
    }
    // R4 third format: a plain-text question line opens the next Q/A pair
    // ONLY when no answer is mid-accumulation (current === null, or the
    // previous pair already has its answer) — a line ending in ? inside a
    // just-started answer stays answer text.
    if (isPlainTextQuestionLine(t) && (current === null || current.answer !== "")) {
      if (current && current.question && current.answer) faqs.push(current);
      current = { question: t, answer: "" };
      continue;
    }
    if (current) {
      current.answer = current.answer ? `${current.answer} ${t}` : t;
    }
  }
  if (current && current.question && current.answer) faqs.push(current);

  const cleaned = faqs.slice(0, 7).map((f) => {
    // PHASE 176 — label-prefix strip (stripFaqQuestionLabel, shared with
    // the legacy cleanup runner's FAQ-hygiene mode).
    const question = stripFaqQuestionLabel(stripInlineMarkdown(f.question));
    return {
      question: question.endsWith("?") || question.endsWith("؟")
        ? question
        : `${question}${lang === "ar" ? "؟" : "?"}`,
      answer: stripInlineMarkdown(f.answer),
    };
  });
  if (cleaned.length === 0) return { body: md, faqs: [] };

  const rest = md.slice(sectionEnd).trim();
  const body = rest
    ? `${md.slice(0, start).trimEnd()}\n\n${rest}`
    : md.slice(0, start).trim();
  return { body, faqs: cleaned };
}

/** Sanitize a repair directive threaded from a P5 deterministic-gate
 * failure into the P4 prompt (B1, Execution-Path Audit §8.2 B1 — owner
 * order 2026-10-01). One-shot REPAIR GUIDANCE ONLY: the directive names
 * the exact publish-gate violations the previous review output caused —
 * it is NOT a new editorial law and vanishes when absent (the default
 * P4 call site never passes it). Caps + control-char stripping keep a
 * pathological error string from bloating the review payload. */
function sanitizeRepairDirective(raw: string | undefined): string | null {
  if (!raw) return null;
  // strip control chars (incl. newlines) so the directive stays a
  // single prompt line — no prompt-injection surface via whitespace.
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 1_500);
}

/** B1 REPAIR-DIRECTIVE preface (owner order 2026-10-01): when P5's
 * deterministic battery rejects a review, the loop re-runs P4 on the
 * same row — WITHOUT the diagnostics the model re-reads the identical
 * prompt on the identical draft and reproduces the same violations
 * (live evidence: runs 78/81/82 — FAQ count 3 and the same Arabic
 * anchors failed three byte-identical retries). The directive is a
 * one-shot REPAIR note, NOT a permanent editorial layer (no-law-
 * stacking commitment, audit §11.2): it names the violations and
 * mandates fixing their CAUSE, with the quality-first guardrails the
 * owner pinned (no filler, no padding, no invented claims). */
function repairDirectiveBlock(directive: string): string {
  return `REPAIR RETRY — the previous version of this article was REJECTED by the publish quality gates for EXACTLY these violations (fix every one at its actual cause this time; all the standing instructions below still apply in full):
${directive}
Fixing a violation means correcting its cause — e.g. FAQ count: add a genuinely on-topic question this article already answers; ungrammatical anchor: rewrite the anchor as a natural grammatical phrase; missing authority link: add a real one you are certain exists; Latin tokens: replace them with their Arabic equivalents. NEVER mask a violation with filler, repetition, padding, or invented facts — an honest, deep article that fails a gate is preferred to a hollow one that games it.
`;
}

export async function reviewAndEnhance(
  lang: "en" | "ar",
  draftMd: string,
  outline: OutlinePlan,
  internalCandidates: InternalLinkCandidate[],
  repairDiagnostics?: string,
): Promise<{
  markdown: string;
  report: ReviewReport;
  internalLinks: { slug: string; anchorText: string }[];
  externalLinks: { url: string; anchorText: string }[];
  source: string;
}> {
  // PHASE 157 ROOT FIX (the 85-dead-links root cause): the internal-link
  // candidates were ALWAYS rendered with a fixed /blog/ prefix — even for
  // AR runs — so the review model planted EN-prefixed links inside AR
  // articles (85 live 404s across 24 posts; Phase 156 sanitizes at render
  // time, this kills the problem AT THE SOURCE). The prefix is now the
  // run language's real blog mount: EN → /blog/ · AR → /ar/blog/.
  const blogPrefix = lang === "ar" ? "/ar/blog" : "/blog";
  const candidates =
    internalCandidates.length > 0
      ? internalCandidates.slice(0, 15).map((c) => `- ${blogPrefix}/${c.slug} → ${c.title}`).join("\n")
      : "(no previous posts yet)";

  // LENGTH-PRESERVATION CONTRACT (owner order 2026-10-01 — the live P4
  // failure class: runs 75-82 killed complete drafts because the review
  // pass SHRANK them below the execution floor; live-measured shrinkage
  // 1217→671/1113/1133 words). The contract states the draft's measured
  // word count and makes "never shorter than the draft" an explicit
  // prompt-level obligation, with the owner's QUALITY-FIRST guardrail:
  // deletions are offset by DEPTH (mechanisms, steps, examples, pitfalls)
  // — never by filler, repetition, or unverifiable additions. This is
  // prompt guidance only: every code gate/floor stays byte-identical.
  const draftWords = countWords(draftMd);
  // B1: sanitized one-shot repair directive (null on every normal run).
  const directive = sanitizeRepairDirective(repairDiagnostics);

// PHASE 173 (current law): NO closing CTA in the article — the site
// renders its membership card after the article; the article ends with
// its content. History: archive/PROMPT-LAW-HISTORY.md.
  const prompt = `You are a senior editor doing FINAL QUALITY REVIEW of a fitness blog article.
${LANG_RULE[lang]}

ARTICLE TITLE: ${outline.title}
TARGET LENGTH: 1500-2500 words (expand thin sections if needed; NEVER pad with filler to reach the length — depth, not repetition).
LENGTH CONTRACT: the draft below is ~${draftWords} words. Your final article MUST be AT LEAST ~${draftWords} words — NEVER shorter than the draft. When proofreading removes repetition, filler, or unverifiable claims, OFFSET every deletion by deepening what remains: concrete mechanisms, practical step-by-step guidance, real training/nutrition examples, or common mistakes and how to avoid them — knowledge a qualified coach would state, with NO invented statistics, studies, or citations. NEVER manufacture length with filler, repeated advice, motivational padding, or off-topic sections: if you cannot honestly deepen a point, keep it as-is rather than pad it.
${directive ? repairDirectiveBlock(directive) : ""}
DRAFT (markdown):
"""
${draftMd}
"""

EXISTING SITE POSTS you may internally link to (slug → title):
${candidates}

DO ALL OF THE FOLLOWING:
1. Proofread: fix grammar/spelling, improve flow, remove repetition (merge advice that appears in more than one section into its single best home; delete generic motivational filler; if a point is simple, keep it simple).
2. ANSWER-FIRST CHECK (mandatory): if the opening 1-2 paragraphs do not DIRECTLY answer the title's core question, rewrite them so they do — specific, quotable, 2-4 sentences, no scene-setting warm-up, no restating the title.
3. Keyword coverage: verify every main keyword & LSI term appears naturally at least once; add a sentence ONLY where missing, and never at the cost of natural language (fix any sentence that reads as keyword stuffing).
4. FACT GUARD (health claims): remove or soften any specific statistic, study, paper, author, or clinical claim that cannot be verified — unverifiable precise numbers attached to evidence claims go; keep generic phrasing like "research suggests" or a direct link to an authority domain from the list in instruction 9. Timing, dosage, and outcome claims (supplements, nutrition, training, recovery, weight loss, muscle gain) must read as commonly recommended, context-dependent ranges — never absolute rules. NEVER fabricate new citations; an authority link you ADD must be a page you are certain exists.
5. E-E-A-T GUARD: delete any fabricated client story, testimonial, personal experience, coaching case, credential, or claimed experiment. Keep expert reasoning and the practical coaching perspective. Do not insert the coach's name into the body.
6. FAQ SECTION: keep the "## " FAQ section — ${EDITORIAL_FAQ_COUNT_RANGE.min}-${EDITORIAL_FAQ_COUNT_RANGE.max} questions serving THIS article's search intent; DELETE any off-topic or generic question the article doesn't need; answers stay plain text (no links inside FAQ answers).
7. Add EXACTLY 2-4 internal links using [anchor](${blogPrefix}/slug) format on fitting anchor text from the list above (only real slugs — copy the prefix exactly as shown). ${EDITORIAL_ANCHOR_GRAMMAR_LAW}
8. FREE-TOOL LINKS (owner directive 2026-09-01): wherever the text naturally mentions calories, macros/protein targets, body fat, BMI, water intake, or meal plans, link that phrase to the matching FREE tool in [anchor](url) format — ONLY these URLs, max 3 total, each used at most once:
   - calories → [anchor](/tools/calorie-calculator)
   - macros/protein needs → [anchor](/tools/macro-calculator)
   - body fat → [anchor](/tools/body-fat-calculator)
   - BMI → [anchor](/tools/bmi-calculator)
   - water intake/hydration → [anchor](/tools/water-tracker)
   - meal plan/meal prep → [anchor](/meal-planner)
9. Add at most 2 external links ONLY to well-known authoritative domains you are certain exist (${EDITORIAL_AUTHORITY_DOMAINS.join(", ")}) in [anchor](https://...) format — each link must directly support the sentence it is attached to; do NOT add links for linking's sake.
10. Keep all "## " section structure (including the FAQ section); output the COMPLETE final article. Do NOT append any closing call-to-action, marketing outro, or "join Alkemos" pitch paragraph — the website already renders its CTA cards after the article; the article itself must end with its content (the conclusion/summary).

Return STRICT JSON only:
{
  "articleMd": "full final article markdown",
  "changesSummary": ["short change notes"],
  "keywordCoverage": "good|partial|poor",
  "factCheckNotes": "what was removed/softened and why",
  "internalLinks": [{"slug":"used-slug","anchorText":"anchor"}],
  "externalLinks": [{"url":"https://...","anchorText":"anchor"}]
}`;

  const { text, model, provider } = await callFreeAIFallbackChain(prompt, {
    tag: `blog:review-${lang}`,
    temperature: 0.4,
    // Review embeds the FULL draft → big payload runs openrouter/nvidia-only
    // via the chain guard. DEEP LADDER FIX (2026-08-27 AR dispatch forensics):
    // with maxModels=2 the review died when BOTH leading models hiccuped.
    // PHASE 177 (2026-09-11 audit): the ladder's gemma/lightning:free steps
    // are now PURGED (0-0.4% live success) so every walked entry is healthy
    // — 4 models gives the strongest entries real depth instead of 5 × 72s
    // with 2 dead steps. Vercel self-clamps to 52s. R3 (2026-09-29): the
    // 480s budget widens each window 90s→110s (480/4=120s cap; the 110s
    // caller timeout rules) — and the R3 per-entry clamp does NOT re-admit
    // Groq here: review payloads (~10.4–11.1k est) clamp below the 3800
    // floor → openrouter/nvidia-only BY DESIGN (audit reservation).
    maxTokens: 6_400,
    jsonMode: false,
    timeoutMs: 110_000,
    maxModels: 4,
  });
  const parsed = parseJSON<{
    articleMd?: string;
    keywordCoverage?: string;
    changesSummary?: unknown[];
    factCheckNotes?: string;
    internalLinks?: unknown[];
    externalLinks?: unknown[];
  }>(text);
  const md = (parsed?.articleMd || "").trim();
  // R4: parse failure keeps the legacy message; a PARSED review that lands
  // under the execution floor is a DISTINCT class — the review shrank the
  // draft below what P5 could ever publish (its 1300 floor is measured on
  // exactly this markdown). Failing HERE gives the ×3 retry three fresh
  // review draws instead of burning images + review + a P5 repair cycle
  // on a review that can never publish (live-measured shrinkage: 1201→752).
  if (!parsed || !md) {
    throw new Error(`P4 ${lang}: invalid review JSON from ${provider}:${model}`);
  }
  const reviewWords = countWords(md);
  if (reviewWords < BLOG_EXECUTION_WORD_FLOOR) {
    throw new Error(
      `P4 ${lang}: review output too short from ${provider}:${model} (${reviewWords} words < ${BLOG_EXECUTION_WORD_FLOOR}-word execution floor — the draft was longer; the review shrank it)`,
    );
  }
  const coverage = ["good", "partial", "poor"].includes(parsed?.keywordCoverage ?? "")
    ? (parsed.keywordCoverage as ReviewReport["keywordCoverage"])
    : "partial";

  console.log(`[blog-pipeline] P4 ${lang} done (${provider}:${model})`);
  return {
    markdown: md,
    report: {
      changesSummary: Array.isArray(parsed.changesSummary)
        ? parsed.changesSummary.filter((c: unknown): c is string => typeof c === "string").slice(0, 10)
        : [],
      keywordCoverage: coverage,
      factCheckNotes: String(parsed?.factCheckNotes ?? ""),
    },
    internalLinks: Array.isArray(parsed.internalLinks)
      ? parsed.internalLinks
          .filter((l): l is { slug: string; anchorText: string } => {
            const r = (typeof l === "object" && l !== null ? l : {}) as Record<string, unknown>;
            return typeof r.slug === "string" && typeof r.anchorText === "string";
          })
          .slice(0, 5)
      : [],
    externalLinks: Array.isArray(parsed.externalLinks)
      ? parsed.externalLinks
          .filter((l): l is { url: string; anchorText: string } => {
            const r = (typeof l === "object" && l !== null ? l : {}) as Record<string, unknown>;
            return typeof r.url === "string" && /^https:\/\//.test(r.url) && typeof r.anchorText === "string";
          })
          .slice(0, 3)
      : [],
    source: `${provider}:${model}`,
  };
}

// PHASE 176 (2026-09-11): the AR Latin-repair backstop —
// scanLatinContamination detects, ONE targeted AI call repairs, then
// validateMsaConversion re-gates deterministically. Incident history:
// archive/PROMPT-LAW-HISTORY.md.
//
// R2 — LOCALIZED LATIN REPAIR (Execution-Path Audit §9 item 4 / §10
// Phase R2, 2026-09-29): the Phase-176 call regenerated the WHOLE
// article (~9.5k-token payload) to fix a handful of bare tokens — the
// oversized payload excluded Groq entirely (the 8k TPM guard) and the
// OR/NV free models kept timing out or returning English explanation
// text instead of the repaired article; 5 of the 7 final AR failures
// in the audit window died exactly there (we, need, to, replace…).
// The repair is now LOCALIZED, in three passes:
//   (a) a fully DETERMINISTIC dictionary pass first (the replacement
//       table literally from the Phase-176 prompt + the tokens measured
//       in the audit window's live drafts) + re-scan — dictionary-
//       covered contamination now repairs with ZERO AI calls;
//   (b) what remains goes to a SMALL token-only conversion call —
//       payload = the token list alone (est. tokens ≈ prompt/4 +
//       maxTokens + 800 ≪ 7.2k ⇒ Groq-eligible again) — the model
//       returns JSON {token → arabic}, applied deterministically via
//       the same scanner-mirroring engine;
//   (c) the SAME deterministic judges as ever — validateMsaConversion
//       + scanLatinContamination (blog-msa.ts untouched by R2): a
//       failing repair still throws the same honest
//       «latin-repair failed validation» error.
// Rollback (audit §10 R2): LATIN_REPAIR_LEGACY=1 restores the pre-R2
// full-article path verbatim. No gate, threshold, or editorial rule
// changed — the gates simply receive a cleaner input.

const LATIN_REPAIR_MAIN = "===CORRECTED==="; // (kept only for the legacy path below)
const LATIN_REPAIR_NOTES = "===NOTES===";

/**
 * R2(a) — the deterministic Latin→Arabic replacement table.
 * Provenance, two measured sources ONLY (no invented entries):
 *   1. The Phase-176 repair prompt's own example table (leucine→الليوسين،
 *      casein→الكازين، shake→مشروب، marketed→يُسوَّق، evidences→أدلة،
 *      simplicity→البساطة، alkalin→ألكالين، vs→مقابل) — the exact tokens
 *      of the 09-11 live incident.
 *   2. The audit window's live drafts (2026-09-15→29, blog queue):
 *      bmr/tdee/lbm/pal (09-16/17/24), epa/dha (×3), whey/isolate/
 *      monohydrate/atp/hcl/meq/amino acid(s) (09-16→18), deadlift/squat/
 *      shakes/bench press (09-17), heart rate (variability) + scapular
 *      wall slides (09-22/24), sleep/timing/intake/deload (09-15→24).
 * Multi-word keys are matched BEFORE their word fragments
 * ("amino acid" before "amino"). Keys must never collide with
 * LATIN_WHITELIST — pinned by test (silently rewriting an allowed
 * token would be an unrequested change). Exported for that collision
 * canary only (blog-latin-repair-r2.test.ts).
 */
export const LATIN_REPAIR_DICTIONARY: Record<string, string> = {
  // ── prompt table (the 09-11 incident) ──
  leucine: "الليوسين",
  casein: "الكازين",
  shake: "مشروب",
  shakes: "مشروبات",
  marketed: "يُسوَّق",
  evidences: "أدلة",
  simplicity: "البساطة",
  alkalin: "ألكالين",
  alkaline: "ألكالين",
  vs: "مقابل",
  // ── live audit-window drafts ──
  whey: "مصل اللبن",
  protein: "البروتين",
  isolate: "المعزول",
  monohydrate: "مونوهيدرات",
  creatine: "الكرياتين",
  bmr: "معدل الأيض الأساسي",
  tdee: "إجمالي الإنفاق اليومي للطاقة",
  lbm: "الكتلة العضلية الصافية",
  pal: "مستوى النشاط البدني",
  epa: "حمض الإيكوسابنتاينويك",
  dha: "حمض الدوكوساهيكساينويك",
  atp: "ثلاثي فوسفات الأدينوزين",
  hcl: "هيدروكلوريد",
  meq: "ملي مكافئ",
  deadlift: "الرفعة الميتة",
  squat: "القرفصاء",
  sleep: "النوم",
  timing: "التوقيت",
  intake: "المدخول",
  deload: "التخفيف",
  // ── multi-word phrases (matched before their fragments) ──
  "amino acids": "أحماض أمينية",
  "amino acid": "حمض أميني",
  "bench press": "ضغط الصدر",
  "heart rate variability": "تغيّر معدل ضربات القلب",
  "heart rate": "معدل ضربات القلب",
  "scapular wall slides": "الانزلاق الجداري الكتفي",
};

const LATIN_DICTIONARY_MAP = new Map(Object.entries(LATIN_REPAIR_DICTIONARY));

/** Arabic letter class — byte-identical to blog-msa's ARABIC_LETTER_CLASS
 * (kept local: the engine must mirror the scanner, not import its guts). */
const AR_LETTER_CLASS = "[\\u0621-\\u0652]";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface LatinTokenMapResult {
  out: string;
  /** Dictionary/AI keys actually applied (lowercase, unique). */
  applied: string[];
}

/**
 * R2 engine — apply a lowercase token→Arabic map with the EXACT scanning
 * semantics of scanLatinContamination (blog-msa.ts), so the repair only
 * ever touches what the detector counts:
 *   - fenced code blocks: split out verbatim (scanner replaces them)
 *   - image markdown + bare URLs + markdown link TARGETS "](url)":
 *     protected (scanner strips them; anchors stay visible)
 *   - parenthesized Latin glosses "(Whey)": protected (scanner removes
 *     them before counting — the accepted MSA gloss convention)
 *   - GLUED Arabic↔Latin adjacency (كريAlkaline): the Latin fragment is
 *     replaced in place with a SPACED Arabic term (scanner counts it
 *     before the gloss strip — a real gloss never glues letters)
 *   - bare tokens: replaced on non-Latin-letter boundaries, case-blind
 * Multi-word keys apply before single words (sorted longest-first).
 */
function applyLatinTokenMap(md: string, map: Map<string, string>): LatinTokenMapResult {
  if (!md || map.size === 0) return { out: md, applied: [] };
  const applied = new Set<string>();

  const keys = [...map.keys()].sort((a, b) => b.length - a.length);
  const bareRules = keys.map((k) => ({
    re: new RegExp(`(?<![A-Za-z])${escapeRegExp(k)}(?![A-Za-z])`, "gi"),
    rep: map.get(k) as string,
    key: k,
  }));
  const gluedRe = new RegExp(`(${AR_LETTER_CLASS})([A-Za-z]+)|([A-Za-z]+)(${AR_LETTER_CLASS})`, "g");

  const segments = md.split(/(```[\s\S]*?```)/g);
  const out = segments.map((seg, i) => (i % 2 === 1 ? seg : repairProseSegment(seg))).join("");
  return { out, applied: [...applied] };

  function repairProseSegment(seg: string): string {
    return seg
      .split("\n")
      .map((line) => repairLine(line))
      .join("\n");
  }

  function repairLine(line: string): string {
    const kept: string[] = [];
    const keep = (s: string): string => {
      kept.push(s);
      return `\u0000${kept.length - 1}\u0000`;
    };
    // 1) protect images / bare URLs / link targets (anchors stay visible)
    let work = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, (m) => keep(m))
      .replace(/https?:\/\/\S+/g, (m) => keep(m))
      .replace(/\]\([^)]*\)/g, (m) => keep(m));
    // 2) glued adjacency repair (BEFORE the gloss protection — mirrors
    //    the scanner's stage order)
    work = work.replace(gluedRe, (_m, arA: string, latA: string, latB: string, arB: string) => {
      const lat = (latA ?? latB ?? "").toLowerCase();
      const rep = map.get(lat);
      if (!rep) return _m;
      applied.add(lat);
      return latA ? `${arA} ${rep}` : `${rep} ${arB}`;
    });
    // 3) protect parenthesized Latin glosses, then bare replacement
    work = work.replace(/\([^)]*[A-Za-z][^)]*\)/g, (m) => keep(m));
    for (const { re, rep, key } of bareRules) {
      work = work.replace(re, () => {
        applied.add(key);
        return rep;
      });
    }
    // 4) restore protected spans
    return work.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => kept[Number(i)]);
  }
}

/**
 * R2(b) per-value deterministic acceptance for ONE model-returned
 * mapping: the value must be a pure-MSA Arabic TERM, never a sentence,
 * never English junk (the we-need-to-replace class), never dialect
 * (the إيه×6 class of 09-17), never a URL/markdown fragment.
 */
function isValidArabicTermValue(v: string): boolean {
  if (!v || v.length > 80) return false;
  if (!/[\u0600-\u06FF]/.test(v)) return false; // must carry Arabic
  if (/[A-Za-z]/.test(v)) return false; // zero Latin (junk responses)
  if (/https?:|[[\]`#]/.test(v)) return false; // no URLs / markdown
  if (scanArabicDialect(v).strong > 0) return false; // no dialect
  if (countArabicWords(v) > 8) return false; // a term, not a sentence
  return true;
}

/**
 * R2(b) — the SMALL conversion call: the model sees ONLY the token
 * list (never the article), so the payload stays far under Groq's 8k
 * TPM guard (est. tokens ≈ prompt/4 + maxTokens + 800 ≪ 7.2k) and the
 * strongest free model (gpt-oss-120b, 85% live success) re-enters the
 * latin-repair path. Returns only per-value-accepted mappings for the
 * tokens actually requested.
 */
async function translateLatinTokens(
  tokens: string[],
): Promise<{ map: Map<string, string>; provider: string; model: string }> {
  const map = new Map<string, string>();
  if (tokens.length === 0) return { map, provider: "none", model: "none" };

  const prompt = `قائمة مصطلحات لاتينية ظهرت سائبة داخل مقال عربي عن اللياقة والتغذية. مهمتك تحويل المصطلحات فقط — لا يوجد مقال هنا.

أعد كائن JSON فقط، دون أي شرح أو نص خارجه، بهذا الشكل الحرفي:
{"<المصطلح اللاتيني>": "<المقابل العربي>"}

لكل مصطلح: مقابلها العربي الشائع في نصوص اللياقة والتغذية بالعربية الفصحى الحديثة، أو تعريبها الصوتي إذا لم يوجد مقابل شائع (مثل: leucine → الليوسين، casein → الكازين، shake → مشروب، marketed → يُسوَّق، evidences → أدلة، simplicity → البساطة، alkalin → ألكالين، vs → مقابل).

قواعد صارمة:
1. كل قيمة عربية خالصة — لا حرف لاتيني واحد داخل القيمة.
2. فصحى حديثة سهلة فقط — ممنوع أي لهجة عامية (عشان، مش، إيه…).
3. القيمة مصطلح قصير (كلمة إلى بضع كلمات) — ليست جملة.
4. لا تضف أي مفتاح لم يُطلب، ولا تكرر الشرح.
5. المقابل يحفظ المعنى التقني للمصطلح كما يُستخدم في سياق التدريب والتغذية.

المصطلحات:
${tokens.map((t) => `- ${t}`).join("\n")}`;

  const { text, model, provider } = await callFreeAIFallbackChain(prompt, {
    tag: "blog:latin-tokens-ar",
    systemPrompt: AR_MSA_EDITOR_LAW,
    temperature: 0.2,
    maxTokens: 1_200,
    jsonMode: true,
    timeoutMs: 60_000,
    maxModels: 3,
  });

  const parsed = parseJSON<Record<string, unknown>>(text);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const [k, v] of Object.entries(parsed)) {
      const key = k.trim().toLowerCase();
      if (!tokens.includes(key)) continue; // only what we asked for
      if (typeof v !== "string") continue;
      const val = v.trim();
      if (!isValidArabicTermValue(val)) continue; // junk/dialect rejected
      map.set(key, val);
    }
  }
  return { map, provider, model };
}

/**
 * The pre-R2 full-article repair (Phase 176, kept VERBATIM as the
 * LATIN_REPAIR_LEGACY=1 rollback path — audit §10 R2 «علم env يعيد
 * المسار القديم»). Do not modify: it is the rollback lever, not the
 * live path.
 */
async function repairArabicLatinContaminationLegacy(
  markdown: string,
  offendingTokens: string[],
): Promise<string> {
  const tokens = offendingTokens.slice(0, 40);
  const prompt = `المقال التالي بالعربية يحتوي كلمات لاتينية/إنجليزية سائبة داخل جُمله العربية — قائمة المخالفات المكتشفة آليًا:
${tokens.map((t) => `- ${t}`).join("\n")}

مهمتك: أعد المقال كاملًا بعد استبدال كل كلمة من هذه القائمة (وأي كلمة لاتينية سائبة أخرى تجدها) بمقابلها العربي الطبيعي أو تعريبها الصوتي عند غياب مقابل شائع (مثل: leucine → الليوسين، casein → الكازين، shake → مشروب، marketed → يُسوَّق، evidences → أدلة، simplicity → البساطة، alkalin → ألكالين، vs → مقابل).

قواعد صارمة:
1. لا تغيّر أي شيء آخر — المعنى والأرقام والحقائق كما هي.
2. حافظ حرفيًا على كل روابط Markdown وصورها وعناوينها (#/##/###) وبنيتها — لا تحذف ولا تضف.
3. الإشارة اللاتينية بين قوسين بعد المصطلح العربي (مثل: مصل اللبن (Whey)) تبقى كما هي — لا تحذف القوسين ولا تحوّلها.
4. أصلح أي دمج فاسد بين حروف عربية ولاتينية (مثل: كريAlkaline) إلى مصطلح عربي سليم.
5. أعد المقال كاملًا من أوله إلى آخره بنفس الطول تقريبًا (±10%).

أعد النتيجة بهذا الشكل الحرفي (لا JSON ولا أسوار كود):
${LATIN_REPAIR_MAIN}
المقال النهائي كاملًا بصيغة Markdown
${LATIN_REPAIR_NOTES}
- أهم الاستبدالات (٢-٥ نقاط)

المقال الأصلي:
${markdown}`;

  const { text, model, provider } = await callFreeAIFallbackChain(prompt, {
    tag: "blog:latin-repair-ar",
    systemPrompt: AR_MSA_EDITOR_LAW,
    temperature: 0.2,
    maxTokens: 6_400,
    jsonMode: false,
    timeoutMs: 110_000,
    maxModels: 3,
  });

  // Sentinel parsing (same contract as the legacy cleanup runner).
  let body = (text || "").trim();
  const fence = body.match(/^```[a-zA-Z]*\s*\n([\s\S]*?)\n```$/);
  if (fence) body = fence[1].trim();
  const i = body.indexOf(LATIN_REPAIR_MAIN);
  if (i >= 0) {
    body = body.slice(i + LATIN_REPAIR_MAIN.length);
    const j = body.indexOf(LATIN_REPAIR_NOTES);
    if (j >= 0) body = body.slice(0, j);
  }
  body = body.trim();
  if (!body || !/[\u0600-\u06FF]/.test(body)) {
    throw new Error(`latin-repair: degenerate payload from ${provider}:${model}`);
  }

  // Deterministic gate: everything preserved + zero dialect + zero Latin.
  const check = validateMsaConversion(markdown, body, { ctaLinkTolerance: false });
  const latinAfter = scanLatinContamination(body);
  if (!check.ok || latinAfter.count > 0) {
    const violations = [
      ...check.violations,
      ...(latinAfter.count > 0
        ? [`latin contamination remains: ${latinAfter.tokens.slice(0, 10).join(", ")}`]
        : []),
    ];
    throw new Error(`latin-repair failed validation: ${violations.join(" | ")}`);
  }
  console.log(
    `[blog-pipeline] latin-repair ar done (${provider}:${model}) — ${tokens.length} token(s) arabized`,
  );
  return body;
}

/**
 * PHASE 176 → R2 (2026-09-29): localized Latin repair for AR articles —
 * deterministic dictionary pass first, then (only for what remains) the
 * small token-only conversion call, then the SAME deterministic judges.
 * `offendingTokens` (from the route's scan) feeds the legacy rollback
 * path only; the live path re-scans internally so the dictionary, the
 * re-scan and the validator always agree byte-for-byte.
 */
export async function repairArabicLatinContamination(
  markdown: string,
  offendingTokens: string[],
): Promise<string> {
  // R2 rollback lever (audit §10 R2): the pre-R2 full-article path.
  if (process.env.LATIN_REPAIR_LEGACY === "1") {
    return repairArabicLatinContaminationLegacy(markdown, offendingTokens);
  }

  // (a) deterministic dictionary pass + re-scan
  let out = markdown;
  const dictPass = applyLatinTokenMap(out, LATIN_DICTIONARY_MAP);
  out = dictPass.out;
  let latin = scanLatinContamination(out);

  // (b) remaining tokens → the small conversion call (Groq-eligible)
  let provider = "dictionary";
  let model = "pass";
  let modelAppliedCount = 0;
  if (latin.count > 0) {
    const remaining = latin.tokens.slice(0, 40);
    const { map, provider: p, model: m } = await translateLatinTokens(remaining);
    if (map.size > 0) {
      const aiPass = applyLatinTokenMap(out, map);
      out = aiPass.out;
      modelAppliedCount = aiPass.applied.length;
      provider = p;
      model = m;
    } else {
      provider = p;
      model = m;
    }
    latin = scanLatinContamination(out);
  }

  // (c) the SAME deterministic judges as ever — no gate changed
  const check = validateMsaConversion(markdown, out, { ctaLinkTolerance: false });
  if (!check.ok || latin.count > 0) {
    const violations = [
      ...check.violations,
      ...(latin.count > 0
        ? [`latin contamination remains: ${latin.tokens.slice(0, 10).join(", ")}`]
        : []),
    ];
    throw new Error(`latin-repair failed validation: ${violations.join(" | ")}`);
  }
  console.log(
    `[blog-pipeline] latin-repair ar done (${provider}:${model}) — ` +
      `${dictPass.applied.length} dictionary + ${modelAppliedCount} model token(s) arabized`,
  );
  return out;
}
