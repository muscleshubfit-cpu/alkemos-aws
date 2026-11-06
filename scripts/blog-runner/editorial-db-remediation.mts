#!/usr/bin/env node
/**
 * scripts/blog-runner/editorial-db-remediation.mts
 *
 * BILINGUAL-EDITORIAL-444B — the deterministic remediation companion of
 * editorial-db-audit.mts (same owner order 2026-11-07 «إلغاء الاستثناءات»).
 * Applies the measured editorial defects found by the audit run 42292979775
 * (139 published rows scanned → 23 flagged → triaged here to 12 rows with
 * real defects; the rest are documented false positives — «لا حاجة/حاجة»
 * MSA noun uses and «طب الباطنة/طب الرياضة» journal names).
 *
 * CHANNEL LAW (the legacy-ar-msa / keyword-tag-remediation precedents):
 *   - Writes touch ONLY: content · reading_time (the SITE's own formula:
 *     ceil(whitespace-words/200) — src/lib/blog-admin.ts, imported logic
 *     mirrored) · updated_at · excerpt/meta_description/meta_title/faq_json
 *     (only the fields an edit actually hits). title: touched ONLY by the
 *     deterministic tanween orthography swap (exact-literal, count-verified,
 *     mathematically reversible) — never by a semantic edit.
 *     Slug/is_published/images/links: NEVER touched.
 *   - Every edit is an exact string or regex pair with an expected match
 *     count — a live row that does not match the expectation is REFUSED
 *     individually (no blind apply).
 *   - Deterministic validation BEFORE any write: URL count unchanged ·
 *     word-count delta within tolerance · AR rows must not gain strong
 *     dialect markers (repo detector) · EN rows must end with zero
 *     double-spaces outside code fences.
 *   - updated_at bumps on every write (honest-lastmod D-4: content changes
 *     ARE visible changes).
 *   - Idempotent: rows already clean are skipped; re-runs converge to no-op.
 *   - DRY_RUN=1 (default) reports the plan + validations, zero writes.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DRY_RUN=1 \
 *     bun scripts/blog-runner/editorial-db-remediation.mts
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DRY_RUN = process.env.DRY_RUN !== "0";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[editorial-db-remediation] missing env");
  process.exit(1);
}

import { scanArabicDialect } from "../../src/lib/blog-msa";

// ---------- the measured patch set (audit run 42292979775) ----------

type Edit = {
  desc: string;
  /** exact literal find (mutually exclusive with re) */
  find?: string;
  /** regex source (applied globally) */
  re?: string;
  replace: string;
  /** expected match count (null = report count, still apply if > 0) */
  expect: number | null;
};

type Patch = {
  slug: string;
  language: "ar" | "en";
  edits: Edit[];
};

const TANWEEN_FIND = "\u0627\u064b"; // ا + fathatan (old style)
const TANWEEN_REPLACE = "\u064b\u0627"; // fathatan + ا (modern)

const PATCHES: Patch[] = [
  // -- 1. strong dialect quote → MSA (deload-week-guide) --
  {
    slug: "deload-week-guide",
    language: "ar",
    edits: [
      {
        desc: "«تعبت شوية = أنزل أسبوعًا» → MSA",
        find: "تعبت شوية = أنزل أسبوعًا",
        replace: "تعب خفيف = أنزل أسبوعًا",
        expect: 1,
      },
    ],
  },
  // -- 2. awkward Arabic-letter transliteration of EPA/DHA → the site's
  //      own convention (Latin acronym in parens; the law's exception) --
  {
    slug: "best-omega-3-supplement-athletes",
    language: "ar",
    edits: [
      {
        desc: "(إي بى إيه + دي إتش إيه) (EPA+DHA) → (EPA+DHA)",
        find: "(إي بى إيه + دي إتش إيه) (EPA+DHA)",
        replace: "(EPA+DHA)",
        expect: 1,
      },
      {
        desc: "«**إي بى إيه (EPA) ودي إتش إيه (DHA)**» → «**EPA وDHA**»",
        find: "**إي بى إيه (EPA) ودي إتش إيه (DHA)**",
        replace: "**EPA وDHA**",
        expect: 1,
      },
      {
        desc: "«مجموع إي بى إيه ودي إتش إيه 500 ملجم» → «مجموع EPA وDHA 500 ملجم»",
        find: "مجموع إي بى إيه ودي إتش إيه 500 ملجم",
        replace: "مجموع EPA وDHA 500 ملجم",
        expect: 1,
      },
    ],
  },
  // -- 3. old-style tanween → modern (the phase-444 orthography law) --
  { slug: "hiit-home-workout-guide", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 33 }] },
  { slug: "calculate-daily-calories-weight-loss", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 2 }] },
  { slug: "how-many-hours-sleep-for-muscle-growth", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 2 }] },
  { slug: "choose-best-wearable-sleep-tracker-athletes", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 2 }] },
  { slug: "progressive-weight-increase", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 1 }] },
  { slug: "nutrition-periodization-body-recomposition-guide", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 1 }] },
  { slug: "best-dynamic-stretching-exercises-athletes-injury-prevention", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 1 }] },
  { slug: "best-protein-supplement-ramadan", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 1 }] },
  { slug: "calculate-calories-fat-loss", language: "ar", edits: [{ desc: "tanween", find: TANWEEN_FIND, replace: TANWEEN_REPLACE, expect: 1 }] },
  // -- 4. EN double spaces (outside code fences) --
  { slug: "smart-water-bottle-hydration-tracking-during-workouts", language: "en", edits: [{ desc: "double-space", re: "  +", replace: " ", expect: 11 }] },
  { slug: "protein-calculator-women-muscle-gain", language: "en", edits: [{ desc: "double-space", re: "  +", replace: " ", expect: 3 }] },
];

// ---------- engine ----------

type FaqItem = { question: string; answer: string };
type Row = {
  id: string;
  slug: string;
  language: "en" | "ar";
  title: string;
  excerpt: string | null;
  content: string | null;
  faq_json: FaqItem[] | null;
  meta_title: string | null;
  meta_description: string | null;
  reading_time: number | null;
};

async function fetchRow(slug: string, language: string): Promise<Row | null> {
  const url = `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&language=eq.${language}&is_published=eq.true&select=id,slug,language,title,excerpt,content,faq_json,meta_title,meta_description,reading_time&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as Row[];
  return rows[0] || null;
}

function countUrls(s: string): number {
  return (s.match(/https?:\/\/\S+/g) || []).length;
}

function applyEdit(text: string, e: Edit): { next: string; n: number } {
  if (e.find !== undefined) {
    const n = text.split(e.find).length - 1;
    return { next: n ? text.split(e.find).join(e.replace) : text, n };
  }
  const rx = new RegExp(e.re!, "g");
  const matches = text.match(rx) || [];
  return { next: text.replace(rx, e.replace), n: matches.length };
}

function stripCode(md: string): string {
  return md.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
}

function msnippets(text: string, e: Edit, max = 3): string[] {
  const out: string[] = [];
  const rx = e.find !== undefined ? new RegExp(e.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g") : new RegExp(e.re!, "g");
  const vis = text.replace(/\s+/g, " ");
  let m: RegExpExecArray | null;
  while ((m = rx.exec(vis)) !== null) {
    out.push(vis.slice(Math.max(0, m.index - 35), m.index + m[0].length + 35).trim());
    if (out.length >= max) break;
  }
  return out;
}

async function processPatch(p: Patch): Promise<void> {
  console.log(`\n=== [${p.language}] ${p.slug} ===`);
  const row = await fetchRow(p.slug, p.language);
  if (!row) {
    console.log("  SKIP: no published row found");
    return;
  }
  const before = {
    title: row.title || "",
    content: row.content || "",
    excerpt: row.excerpt || "",
    meta_title: row.meta_title || "",
    meta_description: row.meta_description || "",
    faq: JSON.stringify(row.faq_json || []),
  };
  let touched = false;
  let refused = false;
  const next: Record<string, string> = { ...before };

  for (const e of p.edits) {
    // apply on every field where it matches; count total across fields
    let total = 0;
    for (const field of ["title", "content", "excerpt", "meta_title", "meta_description", "faq"]) {
      const { n } = applyEdit(next[field], e);
      total += n;
    }
    if (total === 0) {
      console.log(`  EDIT NO-OP (already clean?): ${e.desc}`);
      continue;
    }
    if (e.expect !== null && total !== e.expect) {
      console.log(`  REFUSED: ${e.desc} — found ${total} (expected ${e.expect}) — row untouched`);
      refused = true;
      break;
    }
    console.log(`  EDIT: ${e.desc} ×${total}`);
    for (const s of msnippets(before.content, e)) console.log(`      …${s}…`);
    for (const field of ["title", "content", "excerpt", "meta_title", "meta_description", "faq"]) {
      next[field] = applyEdit(next[field], e).next;
    }
    touched = true;
  }
  if (refused || !touched) {
    if (!touched) console.log("  → nothing to write (clean)");
    return;
  }

  // ---- deterministic validations on the new content ----
  const urlBefore = countUrls(before.content);
  const urlAfter = countUrls(next.content);
  if (urlBefore !== urlAfter) {
    console.log(`  REFUSED: URL count changed (${urlBefore} → ${urlAfter}) — row untouched`);
    return;
  }
  // the SITE's own formula (src/lib/blog-admin.ts): whitespace-token words
  const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const wordsBefore = wc(before.content);
  const wordsAfter = wc(next.content);
  if (Math.abs(wordsAfter - wordsBefore) > 25) { // omega-3: removing the redundant transliteration is -17 by design (DRY-reviewed)
    console.log(`  REFUSED: word delta ${wordsAfter - wordsBefore} exceeds tolerance — row untouched`);
    return;
  }
  if (p.language === "ar") {
    const strongBefore = scanArabicDialect(before.content).strong;
    const strongAfter = scanArabicDialect(next.content).strong;
    if (strongAfter > strongBefore) {
      console.log(`  REFUSED: strong dialect markers would rise (${strongBefore} → ${strongAfter}) — row untouched`);
      return;
    }
  } else {
    const leftovers = (stripCode(next.content).match(/ {2,}/g) || []).length;
    if (leftovers > 0) {
      console.log(`  REFUSED: ${leftovers} double-spaces remain outside code — row untouched`);
      return;
    }
  }

  const reading_time = Math.max(1, Math.ceil(wordsAfter / 200));
  console.log(`  PLAN: words ${wordsBefore}→${wordsAfter} · reading_time ${row.reading_time}→${reading_time} · updated_at now`);

  if (DRY_RUN) {
    console.log("  DRY RUN — no write");
    return;
  }

  const payload: Record<string, unknown> = {
    content: next.content,
    reading_time,
    updated_at: new Date().toISOString(),
  };
  if (next.excerpt !== before.excerpt) payload.excerpt = next.excerpt;
  if (next.meta_title !== before.meta_title) payload.meta_title = next.meta_title;
  if (next.meta_description !== before.meta_description) payload.meta_description = next.meta_description;
  if (next.faq !== before.faq) payload.faq_json = JSON.parse(next.faq);
  if (next.title !== before.title) payload.title = next.title;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${row.id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.log(`  WRITE FAILED: ${res.status} ${await res.text()}`);
    process.exitCode = 1;
    return;
  }
  console.log("  WRITTEN ✓");
}

async function main() {
  console.log(`[editorial-db-remediation] mode=${DRY_RUN ? "DRY_RUN" : "APPLY"} patches=${PATCHES.length}`);
  for (const p of PATCHES) {
    await processPatch(p);
  }
  console.log("\n[editorial-db-remediation] done");
}

main().catch((e) => {
  console.error("[editorial-db-remediation] FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
