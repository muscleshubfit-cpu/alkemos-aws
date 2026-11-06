#!/usr/bin/env node
/**
 * scripts/blog-runner/editorial-db-audit.mts
 *
 * BILINGUAL-EDITORIAL-444B (owner order 2026-11-07 — «إلغاء الاستثناءات»: the
 * live blog DB content joins the editorial audit scope). READ-ONLY measurement
 * instrument over every PUBLISHED blog_posts row, both languages. Zero write
 * verbs; the service key stays in headers; prints findings + snippet evidence
 * (±45 chars) — never full bodies, never secret values.
 *
 * WHAT IT MEASURES per published AR row (title + excerpt + content + FAQ +
 * meta_title + meta_description):
 *   1. Egyptian-dialect markers — the repo's own detector (blog-msa.ts
 *      scanArabicDialect) on the assembled visible text.
 *   2. Old-style tanween (اً before alef) — the phase-444 orthography law.
 *   3. Terminology law: كوتش / كارب / خطط AI / كوتشينج (unified to
 *      مدرب / كربوهيدرات / خطط بالذكاء الاصطناعي / التدريب الأونلاين).
 *   4. Spelling-corruption signatures found in the repo dataset (خطا،
 *      الموصى بهة، أصدقاءك، جاري، قليمًا، واظهر، عمامية…).
 *   5. Latin contamination ratio (MSA law 176 surface check — report-only).
 * Per published EN row:
 *   6. EN surface defects: double spaces, common typos, stray Arabic chars.
 * Pair parity (structural): linked AR↔EN twins resolve both ways.
 *
 * OUTPUT: JSON to stdout + human summary on stderr.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     bun scripts/blog-runner/editorial-db-audit.mts > editorial-audit.json
 */

import {
  scanArabicDialect,
  countArabicWords,
} from "../../src/lib/blog-msa";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "[editorial-db-audit] missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

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
  category: string | null;
  review_status: string | null;
  linked_post_id: string | null;
};

async function fetchAll(): Promise<Row[]> {
  const rows: Row[] = [];
  let offset = 0;
  const PAGE = 200;
  const COLS =
    "select=id,slug,language,title,excerpt,content,faq_json,meta_title,meta_description,category,review_status,linked_post_id";
  for (;;) {
    const url = `${SUPABASE_URL}/rest/v1/blog_posts?is_published=eq.true&${COLS}&order=id.asc&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!res.ok) {
      throw new Error(`PostgREST ${res.status}: ${await res.text()}`);
    }
    const page = (await res.json()) as Row[];
    rows.push(...page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }
  return rows;
}

// ---------- AR checks ----------

const TERM_LAW: Array<[string, RegExp]> = [
  ["كوتش", /(?<![\u0600-\u06FF])كوتش(?![\u0600-\u06FF])/g],
  ["كارب", /(?<![\u0600-\u06FF])كارب(?![\u0600-\u06FF])/g],
  ["خطط AI", /خطط AI|خطط الـAI|مخطط AI/g],
  ["كوتشينج", /(?<![\u0600-\u06FF])كوتشينج(?![\u0600-\u06FF])/g],
];

const SPELL_SIGS: Array<[string, RegExp]> = [
  ["خطا-مصدر", /(?<![\u0600-\u06FF])خطا (?=تحت|خطوة|إلى|تحته)/g],
  ["الموصى بهة", /الموصى بهة/g],
  ["أصدقاءك", /أصدقاءك/g],
  ["جاري-", /(?<![\u0600-\u06FF])جاري (?![\u0600-\u06FF])/g],
  ["قليمًا", /قليم/g],
  ["واظهر", /واظهر/g],
  ["العمامية", /العمامية/g],
  ["بمجرد اختار", /بمجرد اختار/g],
  ["في آن:", /في آن:/g],
];

function visible(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
}

function latinRatioAr(md: string): number {
  const vis = visible(md);
  const letters = vis.replace(/[^\p{L}]/gu, "");
  if (!letters) return 0;
  const latin = vis.match(/[A-Za-z]/g) || [];
  return latin.length / letters.length;
}

function snippets(text: string, rx: RegExp, max = 3): string[] {
  const out: string[] = [];
  const vis = text.replace(/\s+/g, " ");
  let m: RegExpExecArray | null;
  const re = new RegExp(rx.source, rx.flags.includes("g") ? rx.flags : rx.flags + "g");
  while ((m = re.exec(vis)) !== null) {
    out.push(
      vis.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).trim(),
    );
    if (out.length >= max) break;
  }
  return out;
}

type Finding = {
  kind: string;
  count: number;
  snippets: string[];
};

type RowReport = {
  slug: string;
  language: "ar" | "en";
  category: string | null;
  review_status: string | null;
  words: number;
  findings: Finding[];
};

function auditAr(row: Row): RowReport {
  const faqText = (row.faq_json || [])
    .map((f) => `${f.question} ${f.answer}`)
    .join("\n");
  const full = [
    row.title,
    row.excerpt || "",
    row.meta_title || "",
    row.meta_description || "",
    row.content || "",
    faqText,
  ].join("\n");

  const findings: Finding[] = [];

  // 1. dialect detector (repo's own law)
  const scan = scanArabicDialect(visible(full));
  const strongHits = (scan.strongHits || []).filter(([m, c]) => c > 0);
  const weakHits = (scan.weakHits || []).filter(([m, c]) => c > 0);
  if (strongHits.length) {
    findings.push({
      kind: `dialect-strong: ${strongHits.map(([m, c]) => `${m}×${c}`).join(", ")}`,
      count: strongHits.reduce((a, [, c]) => a + c, 0),
      snippets: strongHits
        .flatMap(([m]) => snippets(full, new RegExp(`(?<![\\u0600-\\u06FF])${escapeRx(m)}(?![\\u0600-\\u06FF])`, "g"), 1))
        .slice(0, 3),
    });
  }
  if (weakHits.length) {
    findings.push({
      kind: `dialect-weak: ${weakHits.map(([m, c]) => `${m}×${c}`).join(", ")}`,
      count: weakHits.reduce((a, [, c]) => a + c, 0),
      snippets: weakHits
        .flatMap(([m]) => snippets(full, new RegExp(`(?<![\\u0600-\\u06FF])${escapeRx(m)}(?![\\u0600-\\u06FF])`, "g"), 1))
        .slice(0, 3),
    });
  }

  // 2. old-style tanween
  const tan = (full.match(/\u0627\u064b/g) || []).length;
  if (tan > 0) {
    findings.push({
      kind: "old-style-tanween",
      count: tan,
      snippets: snippets(full, /\u0627\u064b/g),
    });
  }

  // 3. terminology law
  for (const [name, rx] of TERM_LAW) {
    const n = (full.match(rx) || []).length;
    if (n > 0) {
      findings.push({
        kind: `term:${name}`,
        count: n,
        snippets: snippets(full, rx),
      });
    }
  }

  // 4. spelling signatures
  for (const [name, rx] of SPELL_SIGS) {
    const n = (full.match(rx) || []).length;
    if (n > 0) {
      findings.push({ kind: `spell:${name}`, count: n, snippets: snippets(full, rx) });
    }
  }

  // 5. Latin contamination (report-only threshold per law 176 surface)
  const ratio = latinRatioAr(full);
  if (ratio > 0.02) {
    findings.push({
      kind: `latin-ratio ${ratio.toFixed(3)} (>0.02 report-only)`,
      count: Math.round(ratio * 1000),
      snippets: [],
    });
  }

  return {
    slug: row.slug,
    language: "ar",
    category: row.category,
    review_status: row.review_status,
    words: countArabicWords(full),
    findings,
  };
}

function escapeRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- EN checks ----------

const EN_TYPOS: Array<[string, RegExp]> = [
  ["double-space", / {2,}/g],
  ["typo-teh", /\bteh\b/gi],
  ["typo-recieve", /recieve/gi],
  ["typo-seperate", /seperate/gi],
  ["typo-occured", /occured/gi],
  ["stray-arabic", /[\u0600-\u06FF]/g],
];

function auditEn(row: Row): RowReport {
  const faqText = (row.faq_json || [])
    .map((f) => `${f.question} ${f.answer}`)
    .join("\n");
  const full = [
    row.title,
    row.excerpt || "",
    row.meta_title || "",
    row.meta_description || "",
    row.content || "",
    faqText,
  ].join("\n");
  const findings: Finding[] = [];
  for (const [name, rx] of EN_TYPOS) {
    const scope = name === "double-space" || name === "stray-arabic" ? full : full;
    const n = (scope.match(rx) || []).length;
    if (n > 0) {
      findings.push({ kind: name, count: n, snippets: snippets(scope, rx) });
    }
  }
  return {
    slug: row.slug,
    language: "en",
    category: row.category,
    review_status: row.review_status,
    words: full.split(/\s+/).filter(Boolean).length,
    findings,
  };
}

// ---------- main ----------

async function main() {
  const rows = await fetchAll();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const reports: RowReport[] = [];
  let pairBroken = 0;

  for (const row of rows) {
    if (row.language === "ar") reports.push(auditAr(row));
    else reports.push(auditEn(row));
  }

  for (const row of rows) {
    if (!row.linked_post_id) continue;
    const twin = byId.get(row.linked_post_id);
    if (!twin || twin.language === row.language) pairBroken++;
    else if (twin.linked_post_id !== row.id) pairBroken++;
  }

  const flagged = reports.filter((r) => r.findings.length > 0);
  const json = {
    generated_at: new Date().toISOString(),
    total_published: rows.length,
    ar_rows: rows.filter((r) => r.language === "ar").length,
    en_rows: rows.filter((r) => r.language === "en").length,
    pair_links_broken: pairBroken,
    rows_flagged: flagged.length,
    flagged,
  };
  console.log(JSON.stringify(json, null, 2));

  console.error("==== EDITORIAL DB AUDIT — human summary ====");
  console.error(`published rows: ${json.total_published} (AR ${json.ar_rows} / EN ${json.en_rows})`);
  console.error(`pair links broken: ${pairBroken}`);
  console.error(`rows flagged: ${flagged.length}`);
  for (const r of flagged) {
    console.error(`\n[${r.language}] ${r.slug} (${r.category || "-"}/${r.review_status || "-"})`);
    for (const f of r.findings) {
      console.error(`  - ${f.kind} ×${f.count}`);
      for (const s of f.snippets) console.error(`      …${s}…`);
    }
  }
}

main().catch((e) => {
  console.error("[editorial-db-audit] FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
