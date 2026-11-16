/**
 * src/lib/blog-msa.ts
 *
 * PHASE 175 — Arabic Legacy Content Cleanup (owner order «ابدا التنظيف»,
 * 2026-09-11): the shared, DETERMINISTIC MSA tooling for the whole blog
 * system. Three pieces, all pure (no DB / no network — leaf module):
 *
 *   1. AR_MSA_EDITOR_LAW — the Pan-Arab Modern Standard Arabic editorial
 *      law, extracted (Phase 175) from ai-job-processors.ts so the editor
 *      tools AND the legacy-cleanup runner ride the EXACT same law text
 *      (no fork — the Phase-169 extraction doctrine). The 174 canaries
 *      now read this file as the law's single source of truth.
 *
 *   2. The dialect detector — word-boundary-aware marker counting that
 *      decides which published AR articles still need repair (the Phase
 *      173 live sample: عشان×8 · مش×12 · ازاي×2 · بتاع×2). Markers are
 *      split STRONG (unambiguous dialect — never acceptable in MSA) and
 *      WEAK (colloquial-leaning or MSA-ambiguous — tolerated sparingly).
 *
 *   3. validateMsaConversion — the deterministic pre-write gate for the
 *      cleanup runner: a converted article only reaches the DB when it
 *      keeps every link/image URL, keeps its heading structure, keeps its
 *      length within bounds, drops every STRONG marker, strictly improves
 *      the weak count, and adds none of the banned session-service
 *      wording (Phase 174 honesty law).
 *
 * Scope guard: this module never touches titles/slugs/publish state —
 * the SLUG LAW (Phase 121) applies to every consumer.
 */

/** Arabic letter/diacritic range used for word-boundary detection. */
const ARABIC_LETTER_CLASS = "[\\u0621-\\u0652]";

/**
 * The Pan-Arab MSA editorial law (Phase 173/174), single source of truth.
 * Byte-exact extraction from the ai-job-processors editor sys prompt.
 *
 * PHASE 176 (2026-09-11 — owner report «التعديلات الجديدة اختفت مرة أخرى»,
 * live evidence: the protein-timing article shipped "يُ marketed"،
 * "لا توجد evidences"، "shake مصل اللبن"، "الكرياتين alkalin" mid-sentence):
 * the law now ALSO bans raw Latin/English words inside Arabic prose —
 * every term must be Arabic or transliterated; a Latin gloss INSIDE
 * parentheses after the Arabic term stays allowed (مصل اللبن (Whey)) —
 * the same clause text propagates to the editor tools, the coach
 * single-shot generator, and the legacy cleanup runner through this
 * single constant (no fork).
 */
export const AR_MSA_EDITOR_LAW =
  "أنت محرر لغوي وخبير SEO لموقع Alkemos الرياضي. تلتزم حرفياً بتعليمات الإخراج. قانون تحريري صارم: اكتب وحرّر بالعربية الفصحى الحديثة السهلة الواضحة لكل القراء العرب (Pan-Arab Modern Standard Arabic) — ممنوع منعًا باتًا أي لهجة محلية (مصرية أو خليجية أو غيرها) أو تعبيرات عامية لا يفهمها إلا أهل بلد معين (عشان، مش، ازاي، بتاع، كده، خلاص…) أو الترجمة الحرفية عن الإنجليزية؛ وممنوع أيضًا خلط كلمات إنجليزية/لاتينية سائبة داخل الجمل العربية: كل مصطلح له مقابل عربي يُكتب بالعربية (الليوسين، الكازين، مشروب البروتين، ألكالين، الأدلة، البساطة، مقابل بدل vs)، أو يُعرَّب صوتيًا عند غياب مقابل شائع، والاستثناء الوحيد إشارة لاتينية بين قوسين بعد المصطلح العربي (مثل: مصل اللبن (Whey)) أو أسماء العلامات (Alkemos). صحّح النحو والإملاء وصُغ العناوين والأسئلة صياغة عربية سليمة طبيعية بحسب السياق. عند إعادة صياغة نص موجود بالعامية حوّله إلى الفصحى الحديثة السهلة مع الحفاظ الكامل على المعنى، واستبدل أي كلمة لاتينية سائبة فيه بمقابلها العربي.";

/**
 * STRONG dialect markers — unambiguously Egyptian/colloquial. Any single
 * hit qualifies an article for repair, and a converted article must have
 * ZERO of them. Documented Phase 173 set + the Egyptian future هـ-prefix
 * verbs and participles seen in the live legacy corpus.
 */
export const AR_DIALECT_STRONG_MARKERS: readonly string[] = [
  "عشان", "علشان", "ازاي", "إزاي", "بتاع", "بتاعت", "كده", "كدة",
  "برضه", "برضو", "يلا", "يللا", "عايز", "عايزة", "عايزين",
  "إيه", "مفيش", "دلوقتي", "إمتى", "امتى", "فين",
  "كتير", "شوية", "شويه", "أوي", "اوى",
  "هتعمل", "هتبدأ", "هتحتاج", "هتحصل", "هتلاقي", "هتقدر", "هتاكل",
  "هتوصل", "هتشوف", "هتعرف", "هزود", "هخلي", "هبني", "هكمل",
  "بقالك", "بقاله",
];

/**
 * WEAK markers — colloquial-leaning or MSA-ambiguous (حاجة can be MSA
 * "need", زي reads dialect-only as a standalone word, مش is the classic
 * Egyptian negation). ≤4 scattered hits are tolerated in a published
 * article; ≥5 signals real dialect prose needing repair.
 */
export const AR_DIALECT_WEAK_MARKERS: readonly string[] = [
  "مش", "خلاص", "كمان", "زي", "بعدين", "تمام", "كويس", "ينفع",
  "حاجة", "حاجات", "انت", "إنت", "انك", "انه", "طب", "ده", "دي",
  "المفروض", "ليه",
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Count one marker with Arabic word boundaries: the marker must not touch
 * another Arabic letter on either side (المشكلة does NOT count "مش",
 * زيادة does NOT count "زي" — the Phase 174 audit's false-positive rule).
 */
export function countDialectMarker(text: string, marker: string): number {
  if (!text || !marker) return 0;
  const re = new RegExp(
    `(?<!${ARABIC_LETTER_CLASS})${escapeRegExp(marker)}(?!${ARABIC_LETTER_CLASS})`,
    "g",
  );
  return (text.match(re) || []).length;
}

export interface DialectScan {
  strong: number;
  weak: number;
  strongHits: Array<[string, number]>;
  weakHits: Array<[string, number]>;
}

/** Full deterministic scan of one text block. */
export function scanArabicDialect(text: string): DialectScan {
  const strongHits: Array<[string, number]> = [];
  const weakHits: Array<[string, number]> = [];
  let strong = 0;
  let weak = 0;
  for (const m of AR_DIALECT_STRONG_MARKERS) {
    const c = countDialectMarker(text, m);
    if (c > 0) {
      strongHits.push([m, c]);
      strong += c;
    }
  }
  for (const m of AR_DIALECT_WEAK_MARKERS) {
    const c = countDialectMarker(text, m);
    if (c > 0) {
      weakHits.push([m, c]);
      weak += c;
    }
  }
  strongHits.sort((a, b) => b[1] - a[1]);
  weakHits.sort((a, b) => b[1] - a[1]);
  return { strong, weak, strongHits, weakHits };
}

/** Repair gate: any STRONG marker OR ≥5 weak markers (audit-calibrated). */
export function needsMsaRepair(text: string): boolean {
  const scan = scanArabicDialect(text);
  return scan.strong >= 1 || scan.weak >= 5;
}

/** Arabic word count (used for the conversion length-ratio check). */
export function countArabicWords(text: string): number {
  return (text.match(/[\u0600-\u06FF]+/g) || []).length;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 178 — FAQ single-display law (owner-approved content-quality
// batch 2026-09-12). Live audit: EVERY published article (72/72) renders
// its FAQ section TWICE — the markdown body's own "## Frequently Asked
// Questions / ## الأسئلة الشائعة" section AND the faq_json cards — with
// identical Q&A. Phase 172's splitFaqSection lifted the FAQ at PUBLISH
// time for new articles only; the pre-172 legacy corpus kept both.
// This module is the shared, client-safe single source: the heading
// contract regex (moved from blog-pipeline.ts — no fork) + the
// render-time body strip used by BlogArticlePage.
// ═══════════════════════════════════════════════════════════════

/**
 * Matches the FAQ section heading in either language, as a FULL HEADING
 * LINE — the heading text must BE the FAQ heading, not a topical heading
 * that merely contains it (e.g. "Frequently Asked Questions About Protein"
 * is content and must never be stripped). Tolerated variants cover the
 * legacy corpus's generated headings: "Frequently Asked Questions",
 * "FAQ(s)", "الأسئلة الشائعة", "أسئلة شائعة", "أسئلة شائعة وإجابات سريعة".
 * Single source of the heading contract — splitFaqSection (publish-time
 * lift) and stripFaqSectionFromBody (render-time display) share it.
 */
export const FAQ_HEADING_RE =
  /^##[ \t]+(?:frequently[ \t]+asked(?:[ \t]+questions?)?|faqs?|(?:ال)?أسئلة[ \t]+(?:ال)?شائعة(?:[ \t]+وإجابات[ \t]+سريعة)?)[ \t]*[:：؟]?[ \t]*$/im;

/**
 * Remove EVERY contract-matching FAQ section (heading through the next H2
 * or end of document) so the section renders exactly ONCE — as the
 * faq_json cards. Deterministic + idempotent: a body without a
 * recognizable FAQ heading passes through unchanged (post-172 articles
 * already lifted at publish; call this only when faq_json is non-empty).
 *
 * WHY A LOOP (2026-09-14 audit): legacy bodies can carry MULTIPLE FAQ
 * sections — e.g. "أسئلة شائعة وإجابات سريعة" mid-body AND "الأسئلة
 * الشائعة" after the conclusion, or two identical "Frequently Asked
 * Questions" sections back-to-back. The single-strip version removed only
 * the first match and left the second rendering next to the cards (live:
 * 11/69 published pages rendered their FAQ twice). Each iteration strictly
 * shrinks the body (at least the heading line is removed), so the loop
 * always terminates.
 */
export function stripFaqSectionFromBody(md: string): string {
  let out = md;
  let stripped = false;
  for (;;) {
    FAQ_HEADING_RE.lastIndex = 0; // stateless guard (no /g flag, defensive)
    const match = FAQ_HEADING_RE.exec(out);
    if (!match) break;
    stripped = true;
    const start = match.index;
    const afterHeading = out.indexOf("\n", match.index + match[0].length);
    const sectionStart = afterHeading === -1 ? out.length : afterHeading + 1;
    const nextH2 = /^##[ \t]+/m.exec(out.slice(sectionStart));
    const sectionEnd = nextH2 ? sectionStart + nextH2.index : out.length;
    out = (out.slice(0, start) + out.slice(sectionEnd)).replace(/\n{3,}/g, "\n\n");
  }
  // No-match passthrough must be BYTE-IDENTICAL (Phase-178 semantics) —
  // normalization applies only when a section was actually removed.
  return stripped ? out.trim() : md;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 187 — single-H1 law (2026-09-13 deep-audit P0-1).
// Live audit: 22/69 published articles rendered TWO <h1> tags — the
// template hero (post.title) AND the markdown body's own leading
// `# Title` line (legacy corpus generated before the single-H1
// convention; e.g. /blog/progressive-overload-no-weight and
// /ar/blog/calculate-daily-calories-weight-loss). The AR case proved
// the body line is not always a byte-identical copy: سعرة/سُعرة and
// يومياً/يوميًا differ ONLY by Arabic diacritics — so the comparison
// normalizes before matching. Same pattern as the Phase-178 strip
// above: pure, deterministic, idempotent, render-time (no DB rewrite —
// the whole legacy corpus heals at the next ISR revalidate; the
// renderer's `# `→<h2> demotion in blog.ts is the SEO backstop for
// any non-title `# ` heading this strip deliberately leaves alone).
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize a heading/title for duplicate comparison: case-folded,
 * Arabic-diacritic-free (tashkeel + tatweel), hyphen-variant-unified
 * (U+2010..U+2014 → "-"), punctuation-stripped, whitespace-collapsed.
 * Byte differences that are NOT semantic (سعرة/سُعرة، يومياً/يوميًا،
 * 12‑Week/12-Week) collapse to equality before the comparison.
 */
export function normalizeHeadingForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // Arabic diacritics + tatweel
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-") // hyphen variants
    // Keep word chars + Arabic LETTERS + Arabic-Indic digits only —
    // Arabic punctuation (؟ ، ؛) and Latin punctuation drop out so a
    // heading differing only by terminal ؟ still compares equal.
    .replace(/[^\w\u0621-\u064A\u0660-\u0669\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remove the body's LEADING `# ` heading when it duplicates the article
 * title (normalized comparison), so the page renders exactly ONE <h1> —
 * the template hero — and the reader never sees the title twice.
 * Deterministic + idempotent: a body whose first non-blank line is not a
 * `# ` heading, or whose `# ` text does NOT match the title, passes
 * through unchanged (a legitimate mid-body heading is NEVER touched —
 * only the first line is eligible; the renderer's h2 demotion covers
 * the rest).
 */
export function stripTitleHeadingFromBody(md: string, title: string): string {
  if (!md) return md;
  // Anchor on the first non-blank line ONLY (content safety).
  const m = md.match(/^[ \t\r\n]*#[ \t]+(.+?)[ \t]*\r?(\n|$)/);
  if (!m) return md;
  if (normalizeHeadingForCompare(m[1]) !== normalizeHeadingForCompare(title)) return md;
  // Drop the title line (and its line break); preserve the rest
  // byte-identically, then trim the blank run the drop may leave.
  return md.slice(m[0].length).replace(/^[ \t]*\r?\n/, "").trimStart();
}

// ═══════════════════════════════════════════════════════════════
// PHASE 176 — Latin contamination detector (deterministic, pure).
//
// Owner report «التعديلات الجديدة اختفت مرة أخرى» — live evidence:
// the 09-11 AR article best-protein-timing-after-workout shipped
// bare English words INSIDE Arabic sentences: "يُ marketed"،
// "لا توجد evidences واضحة"، "shake مصل اللبن"، "تبحث عن
// simplicity"، "الكرياتين alkalin"، plus the corrupted token
// "كريAlkaline)". The Phase-173 MSA law banned dialect and
// translation-ese but NOT code-switching into English — and no
// deterministic detector existed. "Facts belong to code" (the
// Phase-168 law): this detector is the code side of the fix.
//
// Counting rule (per markdown line, after stripping):
//   - fenced code blocks are skipped entirely
//   - image markdown ![alt](url) is removed (Pexels alt texts are
//     English BY DESIGN — IMAGE SOURCE LAW v3 — and are not prose)
//   - link targets are removed but link ANCHOR text stays (an
//     English anchor inside an AR article is visible contamination)
//   - (a) Arabic↔Latin GLUED letter adjacency counts even inside
//     parentheses (the corrupted «كريAlkaline» class hides in gloss
//     parens — a real gloss always separates with spaces/parens)
//   - (b) parenthesized segments containing Latin letters are removed
//     (the accepted MSA gloss convention: «مصل اللبن (Whey)»), then
//     every remaining Latin token of 2+ chars NOT in the whitelist
//     counts — whether or not the line also carries Arabic (a fully
//     English sentence inside an AR article is contamination too)
// ═══════════════════════════════════════════════════════════════

/**
 * Latin tokens that legitimately appear in Arabic fitness prose:
 * brand names, acronyms with no common Arabic running-text form,
 * and measurement units. Everything else must be Arabic or
 * transliterated (leucine → الليوسين, casein → الكازين…).
 *
 * P2-10 (§12.41): callers OUTSIDE the blog — the tool-page surface and
 * the §12.25 reference modules — pass an extra context allowlist
 * (eponyms, SEO acronyms, payment brands; single source:
 * src/lib/tool-msa.ts) via the optional second parameter. The BASE
 * whitelist stays blog-strict: the blog guard is never weakened.
 */
export const LATIN_WHITELIST = new Set<string>([
  "alkemos", "evo", "ai", "who", "bmi", "mtor", "pubmed", "ahmed",
  "zake", "hiit", "kg", "mg", "ml", "cm", "km", "kcal", "bpm",
]);

export interface LatinContaminationScan {
  /** Total bare Latin tokens found (non-whitelisted, non-gloss). */
  count: number;
  /** Unique offending tokens, lowercase. */
  tokens: string[];
}

export function scanLatinContamination(
  md: string,
  /** P2-10: context extensions (tool surfaces / reference modules) —
   * the blog default (no second argument) stays strict. */
  extraWhitelist?: ReadonlySet<string> | readonly string[],
): LatinContaminationScan {
  if (!md) return { count: 0, tokens: [] };
  const allowed: ReadonlySet<string> = extraWhitelist
    ? new Set<string>([...LATIN_WHITELIST, ...extraWhitelist])
    : LATIN_WHITELIST;
  const tokens = new Map<string, number>();
  const bump = (t: string) => {
    if (t) tokens.set(t, (tokens.get(t) ?? 0) + 1);
  };
  // Fenced code blocks are lifted out before line scanning.
  const withoutCode = md.replace(/```[\s\S]*?```/g, "\n");
  for (const line of withoutCode.split("\n")) {
    // Stage 1 — strip images / link targets / bare URLs (keeping link
    // ANCHOR text — visible prose), WITHOUT touching parentheses yet.
    const linkStripped = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/https?:\/\/\S+/g, " ");
    // (a) GLUED Arabic-Latin adjacency — checked BEFORE the gloss
    // stripping because the corrupted «كريAlkaline» class hides INSIDE
    // a gloss parenthesis. A real gloss always separates the Latin word
    // with spaces/parens; direct letter adjacency is never legitimate.
    // LETTERS only (the repo's ARABIC_LETTER_CLASS) — the \u0600-\u06FF
    // block also contains Arabic punctuation (، ؟ ؛) which would
    // false-positive on every whitelisted token before an Arabic comma.
    const GLUED_RE = new RegExp(
      `${ARABIC_LETTER_CLASS}([A-Za-z]+)|([A-Za-z]+)${ARABIC_LETTER_CLASS}`,
      "g",
    );
    for (const m of linkStripped.matchAll(GLUED_RE)) {
      bump((m[1] ?? m[2] ?? "").toLowerCase());
    }
    // (b) BARE Latin tokens surviving the parenthetical-gloss strip.
    const scanned = linkStripped.replace(/\([^)]*[A-Za-z][^)]*\)/g, " ");
    for (const m of scanned.matchAll(/[A-Za-z]{2,}/g)) {
      const t = m[0].toLowerCase();
      if (allowed.has(t)) continue;
      bump(t);
    }
  }
  const entries = [...tokens.entries()];
  return {
    count: entries.reduce((n, [, c]) => n + c, 0),
    tokens: entries.map(([t]) => t),
  };
}

/** Latin-repair gate: any single bare Latin token in AR prose. */
export function needsLatinRepair(md: string): boolean {
  return scanLatinContamination(md).count > 0;
}

function extractImageUrls(md: string): string[] {
  return [...md.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)].map((m) => m[1]);
}

function extractLinkUrls(md: string): string[] {
  // Links only — images are matched separately and must not double-count.
  return [...md.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)].map((m) => m[1]);
}

function countHeadings(md: string): number {
  return (md.match(/^#{1,6}\s/mg) || []).length;
}

function extractHeadings(md: string): string[] {
  return [...md.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1].trim());
}

/** CTA-paragraph detection (175.10): rule 7 deletes marketing paragraphs
 *  WHEREVER they live — the live corpus proved the CTA is not always at
 *  the tail (calculate-daily's «انضم الآن لبرنامج الكوتشينج» paragraph is
 *  followed by a disclaimer + a full FAQ section, so the position-based
 *  600-char tail never covered it and the embedded /meal-planner link
 *  kept failing validation across 5 batches). Content-based: any blank-line
 *  paragraph carrying a CTA signature IS the CTA region. */
const CTA_SIGNATURES = [
  "انضم الآن",
  "انضم إلى الكوتشينج",
  "برنامج الكوتشينج",
  "اشترك الآن في الكوتشينج",
  "احجز جلس",
  "جرب الكوتشينج",
  "book a session",
  "join the coaching",
];

function ctaParagraphRegion(md: string): string {
  return md
    .split(/\n{2,}/)
    .filter((p) => CTA_SIGNATURES.some((s) => p.includes(s)))
    .join("\n\n");
}

/** Phrases for the non-existent single-session service (174 honesty law). */
const BANNED_SERVICE_PHRASES = ["احجز جلس", "Book a session", "book a session"];

function countBannedPhrases(md: string): number {
  let n = 0;
  for (const p of BANNED_SERVICE_PHRASES) n += md.split(p).length - 1;
  return n;
}

export interface MsaValidation {
  ok: boolean;
  violations: string[];
  metrics: {
    strongBefore: number;
    strongAfter: number;
    weakBefore: number;
    weakAfter: number;
    latinBefore: number;
    latinAfter: number;
    wordsBefore: number;
    wordsAfter: number;
    ratio: number;
  };
}

/**
 * Deterministic pre-write gate for a dialect→MSA conversion. The converted
 * text is only allowed to reach the DB when ALL of these hold:
 *
 *   1. zero STRONG dialect markers remain
 *   2. weak markers strictly improved (fewer than before) — only when
 *      the input carried any (a clean chunk must pass 0→0)
 *   3. zero bare Latin tokens remain (PHASE 176 — the
 *      protein-timing article shipped "يُ marketed" / "لا توجد
 *      evidences" mid-sentence; code-switching is a defect, glosses
 *      in parentheses stay allowed by the detector)
 *   4. Arabic word-count ratio within [0.55, 1.60] — neither truncation
 *      nor inflation (E-E-A-T: meaning preserved, nothing fabricated)
 *   5. image URLs byte-identical (old images are untouched — owner law)
 *   6. link URLs exactly preserved — EXCEPT links living solely inside
 *      the closing CTA paragraph that rule 7 deletes (the legitimate
 *      CTA-embedded-link loss class proven live)
 *   7. heading structure preserved (a single merge is tolerated — live
 *      batch evidence: 2/3 batch-2 failures were otherwise-perfect
 *      conversions merging one near-duplicate heading; a collapse of 2+
 *      headings is a structure violation and the retry prompt receives
 *      the original heading list)
 *   8. no NEW banned session-service wording (174 honesty law)
 */
export interface MsaValidationOptions {
  /** CTA-tail link tolerance (default true — the whole-article mode where
 *  rule 7 legitimately deletes the closing marketing paragraph). CHUNK
 *  callers disable it EXCEPT for the final chunk: a mid-article chunk's
 *  own tail is NOT the article's CTA region (the ramadan lesson — its
 *  /tools links dropped from a middle chunk's tail and the per-chunk
 *  tolerance leaked them through until the assembled check caught it). */
  ctaLinkTolerance?: boolean;
}

export function validateMsaConversion(
  before: string,
  after: string,
  options: MsaValidationOptions = {},
): MsaValidation {
  const ctaTolerance = options.ctaLinkTolerance !== false;
  const violations: string[] = [];

  const sb = scanArabicDialect(before);
  const sa = scanArabicDialect(after);
  if (sa.strong > 0) {
    violations.push(
      `strong dialect markers remain: ${sa.strongHits.map(([m, c]) => `${m}×${c}`).join(", ")}`,
    );
  }
  // Weak improvement is only REQUIRED when the input carried weak markers —
  // a clean CHUNK (preambles are often already MSA) must not fail 0→0
  // (the 175.7 chunked-run bug that killed three articles at chunk 1).
  if (before.trim() && sb.weak > 0 && sa.weak >= sb.weak) {
    violations.push(
      `weak markers did not improve (${sb.weak} → ${sa.weak}: ${sa.weakHits.map(([m, c]) => `${m}×${c}`).join(", ")})`,
    );
  }

  // PHASE 176 — Latin contamination: the converted text must carry ZERO
  // bare Latin tokens (glosses/links/images/whitelist are already excluded
  // by the detector). 0→0 passes (a clean input stays clean).
  const lb = scanLatinContamination(before);
  const la = scanLatinContamination(after);
  if (la.count > 0) {
    violations.push(
      `latin contamination remains: ${la.count} token(s): ${la.tokens.slice(0, 10).join(", ")}`,
    );
  }

  const wb = countArabicWords(before);
  const wa = countArabicWords(after);
  const ratio = wb > 0 ? wa / wb : 0;
  if (wb > 0 && (ratio < 0.55 || ratio > 1.6)) {
    violations.push(`arabic word-count ratio out of bounds: ${ratio.toFixed(2)} (${wb} → ${wa})`);
  }

  const imgsB = extractImageUrls(before);
  const imgsA = extractImageUrls(after);
  if (imgsB.join("\n") !== imgsA.join("\n")) {
    violations.push(`image URLs changed (${imgsB.length} → ${imgsA.length})`);
  }

  const linksB = [...new Set(extractLinkUrls(before))].sort();
  const linksA = [...new Set(extractLinkUrls(after))].sort();
  if (linksB.join("\n") !== linksA.join("\n")) {
    // CTA-strip tolerance: rule 7 deletes marketing paragraphs wherever
    // they live in the article, and links living ONLY inside those
    // paragraphs may legitimately vanish with them. Everything else must
    // survive byte-exact. The region is CONTENT-based (paragraphs carrying
    // a CTA signature — position-based tails missed mid-article CTAs).
    const lost = linksB.filter((l) => !linksA.includes(l));
    const added = linksA.filter((l) => !linksB.includes(l));
    const illegitimateLost = ctaTolerance
      ? lost.filter((l) => !ctaParagraphRegion(before).includes(l))
      : lost;
    if (illegitimateLost.length || added.length) {
      violations.push(
        `link URLs not preserved${illegitimateLost.length ? ` — lost: ${illegitimateLost.join(", ")}` : ""}${added.length ? ` — added: ${added.join(", ")}` : ""}`,
      );
    }
  }

  const hb = countHeadings(before);
  const ha = countHeadings(after);
  if (ha < hb - 1) {
    violations.push(`headings collapsed (${hb} → ${ha}; original: ${extractHeadings(before).slice(0, 8).join(" · ")})`);
  }

  const banB = countBannedPhrases(before);
  const banA = countBannedPhrases(after);
  if (banA > banB) {
    violations.push(`banned session-service wording added (${banB} → ${banA})`);
  }

  return {
    ok: violations.length === 0,
    violations,
    metrics: {
      strongBefore: sb.strong,
      strongAfter: sa.strong,
      weakBefore: sb.weak,
      weakAfter: sa.weak,
      latinBefore: lb.count,
      latinAfter: la.count,
      wordsBefore: wb,
      wordsAfter: wa,
      ratio,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16) — the dialect
// repair's OWN pre-write gate. THE LIVE FAILURE CLASS IT CLOSES:
// scheduled AR run التشغيلة العربية المجدولة (16 نوفمبر 2026) (and 8 of the last 13 AR runs before
// 2026-11-16) died at `weak markers did not improve (1 → 1: حاجة×1)`
// because the ONLY repair pass was the Latin-token repairer — it can
// never touch an Arabic dialect word, so the validator demanded an
// improvement no existing tool could produce, and the ×3 blind retry
// re-read the identical prompt and reproduced the identical marker.
//
// The DIALECT repair pass (blog-pipeline.ts, dictionary + localized
// AI tokens) now runs FIRST and is graded by THIS dialect-scoped
// validator — same law text, same preservation family, scoped to the
// dimensions the dialect repairer can actually be held accountable
// for:
//   1. zero STRONG markers remain (unambiguous dialect never ships)
//   2. weak markers strictly improved when the input carried any —
//      the EXACT clause that killed the live runs, now judging a
//      repairer that CAN fix it
//   3. no NEW Latin tokens (latinAfter ≤ latinBefore — the Latin
//      repair pass runs AFTER and owns the pre-existing tokens; a
//      dialect→MSA swap must never introduce a bare Latin token)
//   4. Arabic word-count ratio within [0.55, 1.60]
//   5. image URLs byte-identical
//   6. link URLs exactly preserved (a word-level swap never
//      legitimately deletes content)
//   7. heading count identical (word-level swaps never merge or add
//      a heading)
//   8. no NEW banned session-service wording
// Every gate in validateMsaConversion above stays byte-identical —
// this is an ADDITION, not a loosening.
// ═══════════════════════════════════════════════════════════════

export function validateDialectRepair(before: string, after: string): MsaValidation {
  const violations: string[] = [];

  const sb = scanArabicDialect(before);
  const sa = scanArabicDialect(after);
  if (sa.strong > 0) {
    violations.push(
      `strong dialect markers remain: ${sa.strongHits.map(([m, c]) => `${m}×${c}`).join(", ")}`,
    );
  }
  // Same live clause as validateMsaConversion: weak must STRICTLY
  // improve when the input carried any (0→0 passes for clean chunks).
  if (before.trim() && sb.weak > 0 && sa.weak >= sb.weak) {
    violations.push(
      `weak markers did not improve (${sb.weak} → ${sa.weak}: ${sa.weakHits.map(([m, c]) => `${m}×${c}`).join(", ")})`,
    );
  }

  // No NEW Latin — the dialect repair must not introduce tokens the
  // Latin pass did not already have to fix.
  const lb = scanLatinContamination(before);
  const la = scanLatinContamination(after);
  if (la.count > lb.count) {
    violations.push(
      `latin contamination grew (${lb.count} → ${la.count}: ${la.tokens.slice(0, 10).join(", ")})`,
    );
  }

  const wb = countArabicWords(before);
  const wa = countArabicWords(after);
  const ratio = wb > 0 ? wa / wb : 0;
  if (wb > 0 && (ratio < 0.55 || ratio > 1.6)) {
    violations.push(`arabic word-count ratio out of bounds: ${ratio.toFixed(2)} (${wb} → ${wa})`);
  }

  const imgsB = extractImageUrls(before);
  const imgsA = extractImageUrls(after);
  if (imgsB.join("\n") !== imgsA.join("\n")) {
    violations.push(`image URLs changed (${imgsB.length} → ${imgsA.length})`);
  }

  const linksB = [...new Set(extractLinkUrls(before))].sort();
  const linksA = [...new Set(extractLinkUrls(after))].sort();
  if (linksB.join("\n") !== linksA.join("\n")) {
    violations.push(
      `link URLs not preserved (lost: ${linksB.filter((l) => !linksA.includes(l)).join(", ") || "none"}; added: ${linksA.filter((l) => !linksB.includes(l)).join(", ") || "none"})`,
    );
  }

  const hb = countHeadings(before);
  const ha = countHeadings(after);
  if (ha !== hb) {
    violations.push(`heading count changed (${hb} → ${ha})`);
  }

  const banB = countBannedPhrases(before);
  const banA = countBannedPhrases(after);
  if (banA > banB) {
    violations.push(`banned session-service wording added (${banB} → ${banA})`);
  }

  return {
    ok: violations.length === 0,
    violations,
    metrics: {
      strongBefore: sb.strong,
      strongAfter: sa.strong,
      weakBefore: sb.weak,
      weakAfter: sa.weak,
      latinBefore: lb.count,
      latinAfter: la.count,
      wordsBefore: wb,
      wordsAfter: wa,
      ratio,
    },
  };
}
