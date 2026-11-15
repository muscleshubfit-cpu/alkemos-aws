/**
 * BLOG-WORD-COUNT — the ART-4 prose word counter (audit
 * AI-GENERATION-PIPELINES 2026-11-15, P1 bucket 5).
 *
 * THE MEASURED DEFECT: the old `md.split(/\s+/)` counter counted markdown
 * SYMBOLS as words — `##`, `-`, `**`, `[link](url)` brackets — so a body
 * padded with list markers and link syntax inflated its word floor, and a
 * genuinely thin draft crossed the 1000-word execution floor it did not
 * earn (the re-measured «short article» class).
 *
 * THE LAW (one definition, every surface — client-safe, zero imports):
 *   1. strip markdown scaffolding: heading hashes, emphasis marks, list
 *      bullets, blockquote markers, inline code fences, link/image
 *      targets (the anchor text stays), table pipes, horizontal rules;
 *   2. count the remaining whitespace-separated tokens (a token still
 *      needs one letter/digit — lone punctuation tokens are gone with the
 *      scaffolding);
 *   3. the FAQ section is EXCLUDED when the caller passes the
 *      post-FAQ-split body (the P5 route extracts the FAQ before calling
 *      — the floor measures the prose the reader actually gets, not the
 *      lifted Q&A block; the FAQ carries its own count separately).
 *
 * PARITY LAW: blog-pipeline (P2 floor) and blog-quality-gates (the manual
 * AI-draft battery) both consume THIS module — the old byte-identical
 * inline copies are retired (one law, no drift).
 */

/** Strip markdown scaffolding, keep the human-readable prose. Pure. */
export function stripMarkdownForCount(md: string): string {
  return String(md ?? "")
    // fenced code blocks: the whole block is scaffolding, not prose
    .replace(/```[\s\S]*?```/g, " ")
    // headings markers (## ### …) — the heading TEXT stays
    .replace(/^\s{0,3}#{1,6}\s+/gm, " ")
    // images: keep the alt text, drop the target
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    // links: keep the anchor text, drop the target
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // emphasis/strong/strikethrough markers
    .replace(/(\*\*|__|\*|_|~~|==)/g, " ")
    // list bullets + blockquote markers + table pipes + horizontal rules
    .replace(/^\s{0,3}[-*+]\s+/gm, " ")
    .replace(/^\s{0,3}>\s?/gm, " ")
    .replace(/\|/g, " ")
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, " ")
    // inline code backticks — the code itself stays as tokens
    .replace(/`([^`]*)`/g, "$1")
    .trim();
}

/** Count PROSE words — markdown symbols stripped, one token = one word. */
export function countProseWords(md: string): number {
  return stripMarkdownForCount(md)
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t))
    .length;
}
