/**
 * src/lib/blog-editorial-law.ts — THE single source of the article
 * editorial constitution (AUDIT_REPORT.md §9-المرحلة 1, item 2 —
 * «دستور prompts موحّد (single source)», owner order 2026-09-29).
 *
 * WHY THIS FILE EXISTS (audit C5/F8 — «نظاما توليد متوازيان بمواصفات
 * متضاربة»): the writing laws (ANSWER-FIRST / E-E-A-T / FACT GUARD)
 * lived as inline string constants inside the MAIN pipeline's P2
 * (blog-pipeline.ts) while the single-shot fallback generator
 * (ai-job-processors.ts) carried its own PARAPHRASED copies — same
 * intent, different bytes, drifting apart with every edit (the exact
 * fork pattern AR_MSA_EDITOR_LAW killed in Phase 175). This module is
 * the generalization of that precedent: ONE exported block per law,
 * imported byte-exact by every prompt builder — P1 outline, P2 content,
 * P4 review, and the coach-path fallback generator — with canary tests
 * proving no surface forks the text (blog-editorial-law.test.ts).
 *
 * LAWS OF THIS FILE:
 *   - Blocks are extracted BYTE-EXACT from blog-pipeline.ts (P2/P4) —
 *     the P2/P4 prompts compose to the exact pre-Phase-1 strings, so
 *     live model behavior is untouched (QUALITY-FIRST: no lowering).
 *   - The fallback generator's paraphrases are REPLACED by these
 *     canonical blocks (a raise, not a neutral swap — audit F8).
 *   - AR_MSA_EDITOR_LAW stays in blog-msa.ts (its own single source,
 *     consumer set, and test family) — this file generalizes the
 *     PATTERN, it does not absorb that law.
 *   - Anything here is BINDING on generation surfaces; the audit's
 *     docs-parity philosophy applies — change the law here and every
 *     surface changes with it in the same commit.
 */

export type EditorialLang = "en" | "ar";

// ─────────────────────────────────────────────────────────────────
// LANG — the language law (byte-exact LANG_RULE, blog-pipeline.ts
// Phase 173/176 lineage). Used by P1, P2, P4.
// ─────────────────────────────────────────────────────────────────
export const EDITORIAL_LANG_RULE: Record<EditorialLang, string> = {
  en: "Write in ENGLISH for an international fitness audience.",
  ar: "اكتب باللغة العربية الفصحى الحديثة السهلة والواضحة — عربية سليمة طبيعية يفهمها كل قارئ عربي من أي بلد (Pan-Arab Modern Standard Arabic)، بنبرة ودية عملية. ممنوع منعًا باتًا: أي لهجة محلية (مصرية أو خليجية أو غيرها)، والتعبيرات العامية التي لا يفهمها إلا أهل بلد معين (مثل: عشان، مش، ازاي، بتاع، كده، ده، دي، خلاص، حاجة بمعنى «شيء»)، والترجمة الحرفية عن الإنجليزية، والتراكيب الركيكة، وأخطاء النحو والإملاء. صُغ العناوين والأسئلة صياغة عربية سليمة طبيعية بحسب السياق (مثل: «كم من الماء أحتاج يوميًا؟» لا «كم ماء احتاج»). ليست لغة أدبية ثقيلة بل فصحى حديثة سهلة. كل المحتوى بالعربية بالكامل (بما في ذلك العناوين والروابط النصية). ممنوع أيضًا خلط كلمات إنجليزية/لاتينية سائبة داخل الجمل العربية (PHASE 176 — دليل حي: «يُ marketed»، «لا توجد evidences»، «shake مصل اللبن»): كل مصطلح يُكتب بالعربية أو يُعرَّب صوتيًا (الليوسين، الكازين، مشروب البروتين، ألكالين، الأدلة، البساطة، «مقابل» بدل vs)، والاستثناء الوحيد إشارة لاتينية بين قوسين بعد المصطلح العربي (مثل: «مصل اللبن (Whey)») أو أسماء العلامات (Alkemos).",
};

// ─────────────────────────────────────────────────────────────────
// ANSWER-FIRST — the GEO quotable-answer law (P2 + fallback).
// ─────────────────────────────────────────────────────────────────
export const EDITORIAL_ANSWER_FIRST: Record<EditorialLang, string> = {
  en: `ANSWER-FIRST (mandatory): the first or second paragraph must DIRECTLY answer the core search intent behind the title — a specific, quotable, practical answer (2-4 sentences) — before the article expands into detail. FORBIDDEN: generic scene-setting intros, filler, restating the title, or a long warm-up story before the answer.`,
  ar: `الإجابة أولًا (قانون إلزامي): الفقرة الأولى أو الثانية يجب أن تجيب مباشرة عن نية البحث الأساسية التي يطرحها العنوان — إجابة محددة عملية قابلة للاقتباس (٢-٤ جمل)، ثم يتوسع المقال في التفاصيل. ممنوع: مقدمات عامة، أو حشو، أو إعادة صياغة العنوان، أو مشهد تمهيدي طويل قبل الإجابة.`,
};

// ─────────────────────────────────────────────────────────────────
// E-E-A-T — expertise without fabrication (P2 + P4 + fallback).
// ─────────────────────────────────────────────────────────────────
export const EDITORIAL_EEAT: Record<EditorialLang, string> = {
  en: `E-E-A-T WITHOUT FABRICATION: expert reasoning and a practical coaching perspective are welcome; FABRICATING client stories, client results, testimonials, personal experiences, coaching cases, credentials, or experiments is strictly FORBIDDEN. Do not repeat the coach's name inside the body as an authority filler — attribution lives in the byline, not the prose.`,
  ar: `خبرة بلا اختلاق (E-E-A-T): يُسمح بمنظور تدريبي عملي واستنتاجات خبير، لكن ممنوع منعًا باتًّا اختلاق قصص عملاء أو نتائجهم أو شهادات أو تجارب شخصية أو مؤهلات أو تجارب تدريبية لم تحدث. لا تكرر اسم الكابتن أحمد زكي داخل النص كحشو لإظهار السلطة — الإسناد موجود في توقيع المقال نفسه.`,
};

// ─────────────────────────────────────────────────────────────────
// FACT GUARD — no invented studies/statistics/clinical claims
// (P2 + P4 + fallback). YMYL health content law.
//
// AUDIT_REPORT §9-المرحلة 2, item 2 (2026-09-29) — the HONEST
// CITATION amendment (option أ): evidence may now be cited as LINKS
// to the whitelisted authority domains (EDITORIAL_AUTHORITY_
// DOMAINS — WHO/NIH/CDC/Mayo plus the sport-science bodies ACSM/
// ISSN/NSCA/NASM/ACE/health.gov/eatright, audit-2 owner order
// 2026-09-29: the blog is NOT all medical — training/gear/nutrition
// articles need their own authorities, else the G4 floor has no
// natural citation target for them) — better for GEO than the old
// blanket ban. What stays ABSOLUTE: fabricating studies, authors, paper
// titles, statistics, or URLs. The deterministic enforcement behind
// this law: the P5 authority-link floor (blog-quality-gates G4) + the
// HEAD-verification gate (blog-link-verify.ts — dead citations are
// removed before the battery).
// ─────────────────────────────────────────────────────────────────
export const EDITORIAL_FACT_GUARD: Record<EditorialLang, string> = {
  en: `FACT GUARD (health/supplements/training/recovery/weight-loss/muscle-gain): present timing, dosage, numbers, and outcomes as commonly recommended ranges that depend on individual context — never as absolute rules. FABRICATING studies, authors, paper titles, URLs, statistics, or clinical claims is strictly FORBIDDEN. Citing evidence is allowed ONLY as markdown links to well-known authority domains (who.int, ncbi.nlm.nih.gov, pubmed.ncbi.nlm.nih.gov, ods.od.nih.gov, nccih.nih.gov, cdc.gov, mayoclinic.org, acsm.org, issn-online.org, nsca.com, health.gov, nasm.org, acefitness.org, eatright.org) — health AND sport-science/training/nutrition authorities — e.g. [WHO guidance on protein intake](https://www.who.int/...) or [CDC physical-activity guidance](https://www.cdc.gov/physical-activity/index.html) — where the link directly supports its sentence; every cited URL must be a page you are CERTAIN exists. Generic phrasing ("research suggests...", "evidence supports...") is the alternative when no certain authority link fits.`,
  ar: `حراسة الحقائق (صحة/مكملات/تدريب): قدّم التوقيتات والجرعات والأرقام والنتائج كتوصيات شائعة تعتمد على السياق الفردي (نطاقات، «يختلف حسب...»)، لا كقواعد مطلقة. ممنوع اختلاق دراسات أو باحثين أو عناوين أوراق أو روابط أو إحصاءات أو ادعاءات سريرية. الاستشهاد بالأدلة مسموح فقط كروابط markdown إلى نطاقات سلطات موثوقة معروفة (who.int, ncbi.nlm.nih.gov, pubmed.ncbi.nlm.nih.gov, ods.od.nih.gov, nccih.nih.gov, cdc.gov, mayoclinic.org, acsm.org, issn-online.org, nsca.com, health.gov, nasm.org, acefitness.org, eatright.org) — جهات صحية وجهات علوم الرياضة والتدريب والتغذية معًا — مثل [إرشادات منظمة الصحة العالمية عن البروتين](https://www.who.int/...) أو [إرشادات النشاط البدني من CDC](https://www.cdc.gov/physical-activity/index.html) — بشرط أن يدعم الرابط جملته مباشرة وأن تكون متأكدًا من وجود الصفحة. وعند غياب رابط سلطة متأكد منه: صياغة عامة فقط مثل «تشير الأدلة إلى...».`,
};

// ─────────────────────────────────────────────────────────────────
// DEPTH OVER LENGTH — anti-filler writing law (P2).
// ─────────────────────────────────────────────────────────────────
export const EDITORIAL_DEPTH_OVER_LENGTH: Record<EditorialLang, string> = {
  en: `DEPTH OVER LENGTH: no filler to hit a word count, no repeating the same advice in multiple sections, no generic motivational paragraphs, no keyword stuffing that deforms the language — if a point is simple, state it simply. Use a keyword verbatim ONLY when the sentence stays natural; otherwise rephrase naturally and closely. Write clean, quotable, information-dense prose (direct answers, clear definitions, concise factual statements, useful bullet lists, tables or clear comparisons only when they genuinely help).`,
  ar: `العمق لا الطول: لا حشو لبلوغ عدد كلمات، لا تكرار النصيحة نفسها في أكثر من قسم، لا فقرات تحفيزية عامة، لا حشو كلمات مفتاحية يفسد اللغة — إن كانت المعلومة بسيطة أجب عنها ببساطة. استخدم الكلمة المفتاحية بصيغتها الحرفية فقط إذا بقيت الجملة طبيعية، وإلا فصياغة طبيعية قريبة منها. العربيّة يجب أن تكون عربية طبيعية مستقلة تحريريًا (جمهور عربي، أمثلة تناسب الثقافة) — ليست ترجمة حرفية عن مقال إنجليزي.`,
};

// ─────────────────────────────────────────────────────────────────
// FAQ CONTRACT — the article-specific FAQ section law (P2's markdown
// section format; P4's review of it; the count/intent core also binds
// the fallback generator's JSON faq field).
// ─────────────────────────────────────────────────────────────────
export const EDITORIAL_FAQ_CONTRACT: Record<EditorialLang, string> = {
  en: `FAQ SECTION (mandatory, at the END of the article): 4-7 questions serving THIS article's actual search intent — questions a real searcher of THIS topic would ask, not generic fitness questions. Do NOT pad with side questions the article doesn't need. EXACT format: the heading "## Frequently Asked Questions", then for each question one line "**The question?**" followed by a plain-text answer paragraph (no links, no tables inside answers).`,
  ar: `قسم الأسئلة الشائعة (إلزامي في نهاية المقال): ٤-٧ أسئلة تخدم نية البحث الفعلية لهذا المقال تحديدًا — أسئلة يسألها باحث حقيقي عن هذا الموضوع، لا أسئلة عامة عن اللياقة. ممنوع إضافة أسئلة جانبية عن مواضيع لا يحتاجها المقال. الصيغة الحرفية: عنوان القسم «## الأسئلة الشائعة» ثم لكل سؤال سطر «**السؤال؟»» يليه فقرة الإجابة (إجابة نصية مباشرة بلا روابط وبلا جداول).`,
};

/** The numeric FAQ count law (owner range, shared by the P5 publish
 * gate, the P4 review instruction, and the fallback generator's faq
 * field — one number, no drift). */
export const EDITORIAL_FAQ_COUNT_RANGE = { min: 4, max: 7 } as const;

// ─────────────────────────────────────────────────────────────────
// LINKING — external authority whitelist (P4 instruction 9 + the P5
// authority-link gate) and the anchor grammar law (P4 instruction 7 +
// the P5 anchor gate). Audit F6/F7: 62/97 articles carried ZERO
// external links and ~124 anchors were raw keyword lists — these two
// constants are the LAW text; blog-quality-gates.ts enforces them
// deterministically at publish.
// ─────────────────────────────────────────────────────────────────

/** The ONLY external domains a generated article may cite as evidence
 * links. The first nine are the original P4 medical-science whitelist;
 * the five appended domains (audit-2, owner order 2026-09-29) are the
 * SPORT-SCIENCE/training/nutrition authorities: NSCA (strength &
 * conditioning), health.gov (ODPHP — the US Physical Activity
 * Guidelines), NASM + ACE (fitness-training certifying bodies — the
 * same anchors already trusted for the coach's own credentials), and
 * eatright.org (Academy of Nutrition and Dietetics). The blog's corpus
 * is training/nutrition-heavy, not purely medical — without these the
 * G4 authority-link floor has no natural citation target for sports
 * articles (the owner's audit-2 finding). Byte-order: P4-composable. */

/**
 * BLOG-RECOVERY-3 round-3 (2026-10-21, live run 39632881785): VERIFIED
 * seed authority links — every URL here answered HTTP 200 at commit time
 * (measured 2026-10-21 16:40 UTC with a plain GET). They ride the G4
 * repair directive so the review model never INVENTS authority URLs
 * (the measured failure: an invented ODS path 404ed at publish
 * verification, the link was removed, and the gate failed again — the
 * loop could not converge while every cycle fabricated a different dead
 * path). The link-verify publish step still removes any seed that later
 * dies — the seeds buy convergence, not immortality.
 */
export const EDITORIAL_SEED_AUTHORITY_LINKS: readonly string[] = [
  "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
  "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
  "https://www.cdc.gov/physical-activity-basics/",
  "https://www.ncbi.nlm.nih.gov/books/NBK537084/",
];

export const EDITORIAL_AUTHORITY_DOMAINS: readonly string[] = [
  "who.int",
  "ncbi.nlm.nih.gov",
  "pubmed.ncbi.nlm.nih.gov",
  "ods.od.nih.gov",
  "nccih.nih.gov",
  "cdc.gov",
  "mayoclinic.org",
  "acsm.org",
  "issn-online.org",
  "nsca.com",
  "health.gov",
  "nasm.org",
  "acefitness.org",
  "eatright.org",
];

/** The anchor grammar law (content-audit §1.3, 2026-09-28) — the core
 * sentence byte-exact from the P4 instruction; the P5 anchor gate is
 * its deterministic enforcement. */
export const EDITORIAL_ANCHOR_GRAMMAR_LAW =
  'ANCHOR GRAMMAR LAW (content-audit §1.3, 2026-09-28): every anchor text MUST be a short natural phrase that reads grammatically inside its sentence — either the article\'s exact title or a 2-5 word phrase with normal articles/prepositions. NEVER use a raw keyword list ("training adjustments menstrual cycle female lifters"), never stack long-tail keywords as anchor text, and never add a sentence whose only purpose is to host the link (if the sentence doesn\'t serve the reader without the link, delete the sentence, not just the link).';
