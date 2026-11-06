/**
 * scripts/blog-runner/keyword-tag-remediation.mts
 *
 * KEYWORD/TAG REMEDIATION (P1 batch 14, owner order 2026-11-06 «راجع جميع
 * المقالات المنشورة… وصحح المعلومات») — converge the stored blog rows'
 * keywords/tags to topical relevance. The measured defect (batch 13):
 * the legacy generator assigned random keyword/tag pools (99 rows with
 * orphan keywords — 446 entries — + 113 rows with orphan tags — 276
 * entries — plus 18 zero-keyword rows), polluting the on-site search
 * predicate matchesBlogSearch.
 *
 * Channel law (same family as meta-title-remediation / article-treatment):
 *   - dispatch-only (workflow keyword-tag-remediation.yml), DRY_RUN=1 by
 *     default (report + validation, zero writes), SLUGS allowlist input.
 *   - METADATA-ONLY writes: keywords + tags. Slug, title, content, images,
 *     faq, meta, publish state, review_status: never touched.
 *   - NO updated_at bump: keywords/tags never render on the page, so the
 *     honest-lastmod law (D-4) forbids claiming a content change — the
 *     blog sitemap child regenerates with the same dates it had.
 *   - Idempotent: rows already equal to the patch are skipped; re-runs
 *     converge to a no-op.
 *   - Validation BEFORE any write, per entry, against the LIVE row:
 *       · slug+language must exist and be published
 *       · the replacement keywords (4-8 items, each 2-8 words) and tags
 *         (3-5 items, each 1-3 words) must be ZERO-ORPHAN by the shared
 *         detector (src/lib/blog-keyword-relevance.ts) against the row's
 *         own topical basis widened with its H2 headings + FAQ questions —
 *         every replacement must be built from the article's own material
 *       · AR rows: the new entries' visible Latin ratio must stay <=5%
 *         (MSA surface law adapted to metadata — pure-Arabic search
 *         phrasing, the p22-1 quality bar)
 *       · no duplicate entries inside a list, and keywords/tags disjoint
 *         (a tag is never also a keyword row entry)
 *   - Whole-list replacement per row (the curated list IS the end state —
 *     the p22-1 bar: ~6 natural search phrasings + 3-4 topical tags);
 *     rows absent from the patch file are never touched.
 *
 * EXIT: 0 = ok · 1 = at least one failure · 2 = misconfig.
 *
 * Usage (GHA keyword-tag-remediation.yml, or locally with the same env —
 * always from the repo root, like every blog-runner script):
 *   npx --no-install tsx scripts/blog-runner/keyword-tag-remediation.mts
 * ENV:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   DRY_RUN=1                — report only (default)
 *   SLUGS=a,b                — restrict to these slugs (empty = the whole file)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../../src/lib/supabase/admin";
import { contentWords, orphanEntries } from "../../src/lib/blog-keyword-relevance";

const DRY_RUN = process.env.DRY_RUN !== "0";
const PATCH_PATH = join(
  process.cwd(),
  "scripts/blog-runner/keyword-tag-remediation.json",
);
const SLUGS = (process.env.SLUGS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

type PatchEntry = {
  slug: string;
  language: "en" | "ar";
  note?: string;
  keywords: string[];
  tags: string[];
};
const patch = JSON.parse(readFileSync(PATCH_PATH, "utf8")) as {
  batch: string;
  entries: PatchEntry[];
};

type FaqItem = { question: string; answer: string };
type Row = {
  id: string;
  slug: string;
  language: "en" | "ar";
  title: string;
  category: string | null;
  focus_keyword: string | null;
  keywords: string[] | null;
  tags: string[] | null;
  content: string | null;
  faq_json: FaqItem[] | null;
  is_published: boolean;
};

const KW_MIN = 4, KW_MAX = 8, TAG_MIN = 3, TAG_MAX = 5;

function validateEntry(e: PatchEntry, row: Row): string[] {
  const errs: string[] = [];
  const kws = e.keywords || [];
  const tags = e.tags || [];
  if (kws.length < KW_MIN || kws.length > KW_MAX)
    errs.push(`keywords count ${kws.length} outside ${KW_MIN}-${KW_MAX}`);
  if (tags.length < TAG_MIN || tags.length > TAG_MAX)
    errs.push(`tags count ${tags.length} outside ${TAG_MIN}-${TAG_MAX}`);
  for (const k of kws) {
    const w = k.trim().split(/\s+/).filter(Boolean).length;
    if (w < 2 || w > 8) errs.push(`keyword word-count ${w} outside 2-8: "${k}"`);
  }
  for (const t of tags) {
    const w = t.trim().split(/\s+/).filter(Boolean).length;
    if (w < 1 || w > 3) errs.push(`tag word-count ${w} outside 1-3: "${t}"`);
  }
  if (new Set(kws).size !== kws.length) errs.push("duplicate keyword entries");
  if (new Set(tags).size !== tags.length) errs.push("duplicate tag entries");
  const overlap = kws.filter((k) => tags.includes(k));
  if (overlap.length) errs.push(`keywords/tags overlap: ${JSON.stringify(overlap)}`);
  // topical basis widened with the row's own H2 headings + FAQ questions
  const h2s = (row.content || "").match(/^##\s+(.+)$/gm) || [];
  const faqQs = (row.faq_json || []).map((f) => f.question);
  const basis = contentWords(
    [row.title, row.category, row.focus_keyword, ...h2s, ...faqQs].filter(Boolean).join(" "),
  );
  const kwOrphans = orphanEntries(kws, basis);
  if (kwOrphans.length)
    errs.push(`orphan keywords vs live basis: ${JSON.stringify(kwOrphans)}`);
  const tagOrphans = orphanEntries(tags, basis);
  if (tagOrphans.length)
    errs.push(`orphan tags vs live basis: ${JSON.stringify(tagOrphans)}`);
  // AR purity on the new entries (MSA surface adapted to metadata): a Latin
  // token that appears in the row's own title/H2s (e.g. HIIT in the AR
  // article's own title) is the article's own vocabulary — only foreign
  // Latin tokens count against the ratio.
  if (row.language === "ar") {
    const text = [...kws, ...tags].join(" ");
    const letters = text.replace(/[^\p{L}]/gu, "");
    if (letters) {
      const own = new Set(
        ((row.title + " " + h2s.join(" ")).match(/[A-Za-z]+/g) || []).map((t) => t.toLowerCase()),
      );
      const foreign = (text.match(/[A-Za-z]+/g) || []).filter(
        (t) => !own.has(t.toLowerCase()),
      );
      const foreignLetters = foreign.join("").replace(/[^A-Za-z]/g, "").length;
      if (foreignLetters / letters.length > 0.05)
        errs.push(`AR foreign-Latin ratio ${((foreignLetters / letters.length) * 100).toFixed(1)}% > 5%`);
    }
  }
  return errs;
}

async function main() {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    console.error("[keyword-tag-remediation] SUPABASE env not configured — aborting.");
    process.exit(2);
  }
  const entries = SLUGS.length
    ? patch.entries.filter((e) => SLUGS.includes(e.slug))
    : patch.entries;
  console.log(
    `[keyword-tag-remediation] batch="${patch.batch}" entries=${entries.length}${SLUGS.length ? " (slug-filtered)" : ""} DRY_RUN=${DRY_RUN ? 1 : 0}`,
  );

  let failures = 0, skipped = 0, planned = 0, applied = 0;
  for (const e of entries) {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id,slug,language,title,category,focus_keyword,keywords,tags,content,faq_json,is_published")
      .eq("slug", e.slug)
      .eq("language", e.language)
      .maybeSingle();
    if (error || !data) {
      console.error(`✗ ${e.slug} [${e.language}]: row not found — refusing`);
      failures++;
      continue;
    }
    const row = data as Row;
    if (!row.is_published) {
      console.error(`✗ ${e.slug} [${e.language}]: not published — refusing`);
      failures++;
      continue;
    }
    const sameKw = JSON.stringify(row.keywords || []) === JSON.stringify(e.keywords);
    const sameTags = JSON.stringify(row.tags || []) === JSON.stringify(e.tags);
    if (sameKw && sameTags) {
      console.log(`↷ ${e.slug} [${e.language}]: already remediated — skip (idempotent)`);
      skipped++;
      continue;
    }
    const errs = validateEntry(e, row);
    if (errs.length) {
      console.error(`✗ ${e.slug} [${e.language}]: validation FAILED — ${errs.join("; ")}`);
      failures++;
      continue;
    }
    planned++;
    const orphanBefore = {
      kw: orphanEntries(row.keywords || [], contentWords([row.title, row.category, row.focus_keyword].filter(Boolean).join(" "))).length,
      tags: orphanEntries(row.tags || [], contentWords([row.title, row.category, row.focus_keyword].filter(Boolean).join(" "))).length,
    };
    console.log(
      `✓ ${e.slug} [${e.language}]: keywords ${ (row.keywords || []).length }→${e.keywords.length} · tags ${(row.tags || []).length}→${e.tags.length} (orphans before: kw=${orphanBefore.kw} tags=${orphanBefore.tags}) — ${DRY_RUN ? "DRY RUN" : "APPLYING"}`,
    );
    if (DRY_RUN) continue;
    const { error: upErr } = await supabaseAdmin
      .from("blog_posts")
      .update({ keywords: e.keywords, tags: e.tags })
      .eq("id", row.id);
    if (upErr) {
      console.error(`✗ ${e.slug} [${e.language}]: PATCH failed — ${upErr.message}`);
      failures++;
      continue;
    }
    applied++;
  }

  console.log(
    `\n[keyword-tag-remediation] done: planned=${planned} applied=${applied} skipped=${skipped} failures=${failures}`,
  );
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("[keyword-tag-remediation] fatal:", e);
  process.exit(2);
});
