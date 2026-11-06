/**
 * src/lib/blog-keyword-relevance.ts
 *
 * KEYWORD/TAG TOPICAL RELEVANCE (P1 batch 13/14, owner order 2026-11-06):
 * the single source for the orphan detector used by BOTH the standing
 * corpus inventory (scripts/blog-runner/blog-corpus-inventory.mts —
 * measurement) and the remediation channel
 * (scripts/blog-runner/keyword-tag-remediation.mts — validation of every
 * replacement entry against the live row's own topical basis).
 *
 * WHY: the legacy generator assigned random keyword/tag pools to blog
 * rows (measured 2026-11-06: 99 rows with orphan keywords — 446 entries —
 * + 113 rows with orphan tags — 276 entries — across the 139-article
 * corpus). The on-site search predicate (matchesBlogSearch,
 * src/lib/blog-search.ts) matches on keywords+tags, so unrelated entries
 * pollute search results for queries that have nothing to do with the
 * article (measured sample: 'best creatine monohydrate for women over 40'
 * on the maintenance-calories article).
 *
 * DETECTOR (deterministic, conservative):
 *   An entry (keyword or tag) is ORPHAN when NONE of its content words
 *   (>=4 chars, lowercase, stopword-stripped, with plural/definite-article
 *   variants) appears in the article's topical basis. Variants widen
 *   matching on both sides — the detector therefore under-reports
 *   (fewer false orphans), never over-reports.
 *
 * PURE MODULE by design (no "use client", no server-only, no Supabase):
 * importable from server components, blog-runner scripts and unit tests
 * alike (the same pattern as blog-search.ts).
 */

const RELEVANCE_STOPWORDS = new Set([
  "best", "how", "what", "when", "why", "which", "with", "without", "for",
  "and", "the", "you", "your", "that", "this", "from", "into", "about",
  "many", "much", "should", "can", "will", "does", "are", "was", "were",
  "has", "have", "been", "its", "their", "over", "under", "between",
  "during", "before", "after", "while", "than", "then", "some", "most",
  // 3-letter function/generic tokens (raw filter is >=3 — these must be
  // stopworded so the acronym tier (BFR, RPE, TDEE, fat, leg, arm...) stays)
  "one", "two", "six", "ten", "day", "days", "top", "low", "non",
  "yes", "get", "got", "use", "per", "via", "yet", "out", "off",
  "own", "his", "her", "they", "them", "there", "where", "each",
  "both", "few", "all", "any", "not", "but", "new", "old", "now",
  "set", "sets", "rep", "reps",
  "كل", "أو", "او", "ثم", "قد", "لن", "لا", "إن", "أن", "أنا", "انا",
  "أفضل", "كيف", "ما", "هل", "في", "على", "مع", "إلى", "الى", "بين",
  "أكثر", "اكثر", "عندما", "لماذا", "الذي", "التي", "هذا", "هذه",
  "ذلك", "تلك", "كان", "كانت", "يكون", "عن", "هو", "هي",
]);

// Arabic sound-plural / prefix variant strips — every variant only WIDENS
// matching (fewer false orphans, never more):
//   المكملات -> مكمل (broken plural ات) · الرياضيون -> الرياضي (sound masc ون)
//   الرياضيين -> الرياضي (sound masc plural ين) · و/ف/ب/ل/ك proclitics
const AR_VARIANT_RULES: Array<[RegExp, number]> = [
  [/ات$/, 2],
  [/ون$/, 2],
  [/ين$/, 2],
  [/^[و ف ب ل ك]/, 1],
];

function arabicVariants(raw: string, forms: Set<string>): void {
  // Fixpoint over roots: each root can yield ال/لل-stripped, suffix-stripped
  // and proclitic-stripped children, which are themselves roots (handles
  // chains like والتدرج -> التدرج -> تدرج). Bounded: strings only shrink.
  const roots = new Set<string>([raw]);
  let grew = true;
  let rounds = 0;
  while (grew && rounds < 6) {
    grew = false;
    rounds++;
    for (const root of [...roots]) {
      if (root.startsWith("لل") && root.length - 2 >= 3 && !roots.has(root.slice(2))) { roots.add(root.slice(2)); grew = true; }
      if (root.startsWith("ال") && root.length - 2 >= 3 && !roots.has(root.slice(2))) { roots.add(root.slice(2)); grew = true; }
      for (const [re, drop] of AR_VARIANT_RULES) {
        let child: string | undefined;
        if (drop === 2 && re.test(root) && root.length - 2 >= 4) child = root.slice(0, -2);
        if (drop === 1 && re.test(root) && root.length - 1 >= 4) child = root.slice(1);
        if (child && !roots.has(child)) { roots.add(child); grew = true; }
      }
    }
  }
  for (const root of roots) forms.add(root);
}

/** Content-word variants of a string (lowercase, stopword-stripped). */
export function contentWords(s: string | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const raw of (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)) {
    if (raw.length < 3 || RELEVANCE_STOPWORDS.has(raw)) continue;
    // Every word contributes its RAW form plus lightly-normalized variants,
    // so matching stays robust on both sides (calories/calorie, classes/class).
    // Extra variants only ever widen matching (conservative for the orphan
    // detector: fewer false orphans, never more).
    const forms = new Set<string>([raw]);
    // Latin plural variants (calories->calorie via s-strip, classes->class via
    // es-strip, studies->stud via ies-strip) — every variant widens matching,
    // so all are added; the ss-guard protects mass/class/atlas.
    if (/s$/.test(raw) && !/ss$/.test(raw) && raw.length - 1 >= 3) {
      forms.add(raw.slice(0, -1));
    }
    if (/ies$/.test(raw) && raw.length - 3 >= 3) forms.add(raw.slice(0, -3));
    else if (/es$/.test(raw) && raw.length - 2 >= 3) forms.add(raw.slice(0, -2));
    // Arabic variants (definite article, sound plurals, proclitics)
    if (/\p{Script=Arabic}/u.test(raw)) arabicVariants(raw, forms);
    for (const f of forms) if (f.length >= 3 && !RELEVANCE_STOPWORDS.has(f)) out.add(f);
  }
  return out;
}

/**
 * Orphan entries within a keyword/tag list vs a topical basis.
 * An entry is orphan when it has content words but NONE of them appears
 * in the basis. Entries with no content words at all (pure stopwords /
 * numbers) are NOT reported — the detector only judges topical overlap.
 */
export function orphanEntries(
  entries: string[] | null | undefined,
  topical: Set<string>,
): string[] {
  const out: string[] = [];
  for (const raw of entries || []) {
    const words = contentWords(raw);
    let hit = false;
    for (const w of words) if (topical.has(w)) { hit = true; break; }
    if (!hit && words.size > 0) out.push(raw);
  }
  return out;
}

/**
 * The topical basis builder for a row: title + category + focus_keyword
 * (the inventory's basis) — callers with access to the full content widen
 * it with H2 headings and FAQ questions (the remediation's basis).
 */
export function topicalBasis(
  title: string | null | undefined,
  category: string | null | undefined,
  focusKeyword: string | null | undefined,
  extra: string[] = [],
): Set<string> {
  const basis = contentWords(
    [title, category, focusKeyword].filter(Boolean).join(" "),
  );
  for (const e of extra) for (const w of contentWords(e)) basis.add(w);
  return basis;
}

export const RELEVANCE_STOPWORD_LIST: readonly string[] = [
  ...RELEVANCE_STOPWORDS,
];
