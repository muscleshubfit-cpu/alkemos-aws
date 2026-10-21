/**
 * src/lib/blog-quality-gates.ts — AUDIT_REPORT.md §9-المرحلة 1, item 4
 * (2026-09-29): the EXPANDED deterministic P5 publish gate battery.
 *
 * WHY (audit F3/F6/F7): P5 previously checked only Latin contamination
 * (AR), duplicate titles and the daily quota — nothing enforced the
 * article SPEC at publish. Measured result: median 1,202 words vs the
 * 1500-2500 ask, 62/97 articles with ZERO external authority links,
 * ~124 raw keyword-list anchors, and quoted long-tail search phrases
 * pasted into prose (the §C4 stuffing pattern). Phase 0 (09dff50c)
 * added the length floor; this module adds the remaining battery —
 * every check DETERMINISTIC and cheap (regex/parse only, no AI):
 *
 *   G1  length ≥ 1000 words            (lives in p5-publish — Phase 0; value
 *                                       lowered 1300→1000 by owner order
 *                                       2026-10-02, Phase 323)
 *   G2  H2 section count ≥ 5           (the 5-7 H2 outline spec)
 *   G3  final FAQ count within 4-7     (EDITORIAL_FAQ_COUNT_RANGE)
 *   G4  ≥ 1 external AUTHORITY link    (EDITORIAL_AUTHORITY_DOMAINS —
 *                                       the whole blog is YMYL, so the
 *                                       gate applies to every article)
 *   G5  anchor grammar                 (EDITORIAL_ANCHOR_GRAMMAR_LAW:
 *                                       raw keyword-list anchors and
 *                                       >5-word stacks rejected unless
 *                                       the anchor is an exact post title)
 *   G6  quoted search phrases in prose (the §C4 keyword-stuffing pattern)
 *
 * Any violation → the P5 route throws → markQueueItemFailed with the
 * diagnostic → the 23:40 UTC dispatch backstop tops the day's slot up
 * with a fresh run (the audit's «أي فشل → إعادة توليد… البنية موجودة:
 * markFailed + backstop» — the exact mechanism the Phase-176 Latin gate
 * and the Phase-0 length gate already ride).
 *
 * Pure leaf module: no DB, no network — unit-testable in isolation.
 */

import { EDITORIAL_AUTHORITY_DOMAINS, EDITORIAL_FAQ_COUNT_RANGE } from "./blog-editorial-law";

export type GateLang = "en" | "ar";

/** G2 — count "## " H2 headings in the final body (the outline spec is
 * 5-7 H2s; the conclusion counts, the FAQ section is already lifted out
 * of the body at this point). */
export function countH2Sections(bodyMd: string): number {
  return (bodyMd.match(/^##[ \t]+\S/gm) || []).length;
}

/** Markdown links (images excluded): [anchor](url). */
const MD_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** G4 — collect the AUTHORITY domains actually linked in the body.
 * Only links to EDITORIAL_AUTHORITY_DOMAINS count (audit F6 is about
 * trusted-authority linking in YMYL health content — a random external
 * link is not E-E-A-T). www. is tolerated; exact-host or subdomain of
 * a whitelisted authority passes. */
export function findAuthorityLinks(bodyMd: string): string[] {
  const found = new Set<string>();
  for (const m of bodyMd.matchAll(MD_LINK_RE)) {
    const url = m[2];
    if (!/^https:\/\//i.test(url)) continue;
    let host: string;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      continue;
    }
    const bare = host.startsWith("www.") ? host.slice(4) : host;
    for (const d of EDITORIAL_AUTHORITY_DOMAINS) {
      if (bare === d || bare.endsWith(`.${d}`)) {
        found.add(d);
        break;
      }
    }
  }
  return [...found];
}

/**
 * Function words for the anchor-grammar gate: a 4+-word anchor with
 * NONE of these is a raw keyword list, not a grammatical phrase (the
 * audit's live evidence: "training adjustments menstrual cycle female
 * lifters" — 5 words, zero function words).
 */
const ANCHOR_FUNCTION_WORDS: Record<GateLang, Set<string>> = {
  en: new Set([
    "the", "a", "an", "of", "to", "for", "in", "on", "at", "with", "without",
    "and", "or", "but", "your", "you", "its", "it", "that", "which", "when",
    "while", "how", "what", "why", "where", "who", "is", "are", "was", "were",
    "be", "been", "do", "does", "did", "can", "could", "should", "would",
    "will", "from", "by", "as", "into", "over", "under", "between", "during",
    "before", "after", "about", "against", "per", "each", "every", "not",
    "no", "more", "most", "less", "least", "vs", "versus", "if", "than",
    "then", "so", "such", "both", "either", "neither", "own", "same", "s",
  ]),
  ar: new Set([
    "في", "من", "إلى", "الى", "على", "عن", "مع", "أو", "او", "و", "ثم",
    "بدون", "دون", "خلال", "بين", "عند", "بعد", "قبل", "لكي", "حتى", "كما",
    "إن", "أن", "ان", "التي", "الذي", "هذا", "هذه", "ذلك", "تلك", "كل",
    "بعض", "أفضل", "كيف", "لماذا", "متى", "أين", "هل", "ما", "كم", "لمن",
    "لذا", "حيث", "بينما", "أثناء", "ضمن", "عبر", "نحو", "داخل", "خارج",
    "فوق", "تحت", "أمام", "خلف", "لدى", "ليس", "بدلا", "بدل", "مثل", "مثلا",
    "يجب", "يمكن", "عندما", "إذا", "اذا", "أي", "اي", "هناك", "هنا",
  ]),
};

/** True iff the URL's host is (or is a subdomain of) an EDITORIAL
 *  AUTHORITY domain (www. tolerated) — the G4 citation surface. */
function isAuthorityUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const bare = host.replace(/^www\./, "");
    return EDITORIAL_AUTHORITY_DOMAINS.some(
      (d) => bare === d || bare.endsWith(`.${d}`),
    );
  } catch {
    return false;
  }
}

/** G5 — anchors that violate the grammar law: raw keyword lists (≥4
 * words, zero function words) or keyword stacks (>5 words) that are not
 * an exact published-post title. `legalTitles` = the exact titles of
 * published posts in the article's language (the P4 law allows the
 * article's exact title as an anchor) — case/punctuation-insensitive
 * comparison. Tool links and FAQ cards never plant such anchors; this
 * catches what the MODEL planted. */
export function findUngrammaticalAnchors(
  bodyMd: string,
  lang: GateLang,
  legalTitles: string[],
): string[] {
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/[\u064B-\u0652]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const legal = new Set(legalTitles.map((t) => normalize(t)).filter(Boolean));
  const violations: string[] = [];
  for (const m of bodyMd.matchAll(MD_LINK_RE)) {
    const anchor = m[1].trim();
    if (!anchor) continue;
    // Image-syntax survivors and pure-symbol anchors are not prose.
    if (!/[\p{L}]/u.test(anchor)) continue;
    if (legal.has(normalize(anchor))) continue; // exact post title — allowed
    const words = anchor.split(/\s+/).filter(Boolean);
    // BLOG-RECOVERY-3 round-2 (2026-10-21, live run 39628616769): an anchor
    // pointing at an EDITORIAL AUTHORITY domain is a SOURCE CITATION — a
    // natural proper-noun name («إرشادات الكلية الأمريكية للطب الرياضي» →
    // acsm.org), not keyword stuffing (stuffing targets the site's OWN search
    // surface). Authority anchors within the AR word-economy threshold (≤7)
    // pass without the function-word check.
    if (words.length <= 7 && isAuthorityUrl(m[2])) continue;
    // BLOG-RECOVERY-3 (2026-10-21, live run 39580182779): the EN-calibrated
    // >5 auto-reject killed legitimate 6-word ARABIC noun clauses — measured
    // «كمية الماء التي يحتاجها الرياضي يوميًا» (6 words, carries the function
    // word التي, still auto-rejected). Arabic spends ~30-50% more words than
    // English on the same phrase; the stack threshold is per-language now.
    if (words.length > (lang === "ar" ? 7 : 5)) {
      violations.push(anchor);
      continue;
    }
    if (words.length >= 4) {
      const fn = ANCHOR_FUNCTION_WORDS[lang];
      let hasFunctionWord = words.some((w) =>
        fn.has(w.replace(/[^\p{L}\p{N}']/gu, "").toLowerCase()),
      );
      // BLOG-RECOVERY-3 (2026-10-21, same run): ARABIC FUSED MORPHOLOGY —
      // Arabic fuses prepositions + the definite article INTO the noun
      // (لـ+الطب = للطب، بـ+المنزل = بالمنزل)، so the standalone
      // function-word check can NEVER see them. Measured false positives
      // that kept failing every P4 repair cycle: «إرشادات الكلية الأمريكية
      // للطب الرياضي»، «الكلية الأمريكية للطب الرياضي» — both perfectly
      // grammatical authority anchors. A word carrying لل/بال/كال/وال/فال
      // is a PREPOSITIONED definite token — a construct-chain word, not a
      // bare keyword-list entry (the stuffing shape stacks bare nouns:
      // «تمارين بناء العضلات المنزل» — still flagged, canary-pinned). The
      // precision set is deliberately narrow (fused-with-article forms
      // only): plain-ال words stay insufficient, so the existing Arabic
      // keyword-list canary keeps failing as designed. EN is unchanged.
      if (lang === "ar" && !hasFunctionWord) {
        hasFunctionWord = words.some(
          (w) => w.length >= 4 && /^(?:لل|بال|كال|وال|فال)/.test(w),
        );
      }
      if (!hasFunctionWord) violations.push(anchor);
    }
  }
  return [...new Set(violations)];
}

/**
 * G6 — quoted long-tail SEARCH phrases pasted into prose (audit §C4:
 * «your daily target for "how many calories should i eat to lose
 * weight" while still feeding muscle»). Deliberately CONSERVATIVE so a
 * legitimate quotation never false-fails:
 *   EN: a double-quoted span of ≥4 words, ALL lowercase, containing a
 *       search-intent marker (how / what / best / why / when / vs / for).
 *       Real prose quotes keep capitalization or punctuation.
 *   AR: a quoted span (double quotes or «guillemets») of ≥4 words that
 *       OPENS with a search-question word (كم / كيف / ما / متى / هل /
 *       أفضل / لماذا / أين) — the exact shape of the stuffed queries.
 */
export function findQuotedSearchPhrases(bodyMd: string, lang: GateLang): string[] {
  const violations: string[] = [];
  const push = (phrase: string) => {
    const p = phrase.trim();
    if (p && !violations.includes(p)) violations.push(p);
  };

  if (lang === "en") {
    for (const m of bodyMd.matchAll(/"([^"\n]{8,200})"/g)) {
      const q = m[1].trim();
      const words = q.split(/\s+/).filter(Boolean);
      if (words.length < 4) continue;
      // ALL-lowercase + no sentence punctuation = a raw pasted query.
      if (q !== q.toLowerCase()) continue;
      if (/[.!?;:]/.test(q)) continue;
      if (/\b(how|what|best|why|when|vs|for|can|should|do)\b/i.test(q)) push(q);
    }
    return violations;
  }

  for (const m of bodyMd.matchAll(/[«"]([^«»"\n]{8,200})[»"]/g)) {
    const q = m[1].trim();
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length < 4) continue;
    // NOTE: \b is ASCII-\w-boundary defined — it does NOT fire between
    // Arabic letters and space, so the question-word prefix uses an
    // explicit whitespace/end anchor instead.
    if (/^(كم|كيف|ما|ماذا|متى|هل|أفضل|لماذا|أين|افضل)(?:\s|$)/.test(q)) push(q);
  }
  return violations;
}

/** The full battery's verdict for one article. `args` carries the two
 * computed artifacts P5 already has: the final BODY markdown (post
 * FAQ-lift + tool-link pass) and the final FAQ list (post relevance +
 * Latin gates, incl. the research0 degraded path — capped at max by the
 * caller). Returns every violation message — empty array = publish. */
export function runP5QualityGates(args: {
  lang: GateLang;
  bodyMd: string;
  faqCount: number;
  legalTitles: string[];
}): string[] {
  const { lang, bodyMd, faqCount, legalTitles } = args;
  const violations: string[] = [];

  const h2 = countH2Sections(bodyMd);
  if (h2 < 5) {
    violations.push(`only ${h2} H2 sections (< 5 floor)`);
  }

  if (faqCount < EDITORIAL_FAQ_COUNT_RANGE.min || faqCount > EDITORIAL_FAQ_COUNT_RANGE.max) {
    violations.push(
      `FAQ count ${faqCount} outside the ${EDITORIAL_FAQ_COUNT_RANGE.min}-${EDITORIAL_FAQ_COUNT_RANGE.max} range`,
    );
  }

  const authority = findAuthorityLinks(bodyMd);
  if (authority.length < 1) {
    violations.push(
      `no external authority link (${EDITORIAL_AUTHORITY_DOMAINS.slice(0, 3).join("/")}… — YMYL E-E-A-T floor)`,
    );
  }

  const badAnchors = findUngrammaticalAnchors(bodyMd, lang, legalTitles);
  if (badAnchors.length > 0) {
    violations.push(
      `${badAnchors.length} ungrammatical keyword-list anchor(s): ${badAnchors.slice(0, 3).map((a) => `"${a}"`).join(", ")}`,
    );
  }

  const quotedQueries = findQuotedSearchPhrases(bodyMd, lang);
  if (quotedQueries.length > 0) {
    violations.push(
      `${quotedQueries.length} quoted search phrase(s) in prose: ${quotedQueries.slice(0, 3).map((q) => `"${q}"`).join(", ")}`,
    );
  }

  return violations;
}
