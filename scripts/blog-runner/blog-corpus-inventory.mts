#!/usr/bin/env node
/**
 * scripts/blog-runner/blog-corpus-inventory.mts
 *
 * BLOG-CORPUS-INVENTORY (owner order 2026-11-01 «أمر تنفيذ المرحلة التالية» —
 * بند 1: معالجة شاملة للمقالات المنشورة + بند 2: المقالات بلا نظير باللغة
 * الأخرى). READ-ONLY measurement instrument — the evidence base for the
 * article triage + language-gap analysis. Zero write verbs, zero secrets
 * printed (service key read from env, used in headers only).
 *
 * WHAT IT MEASURES (per published blog_posts row, both languages):
 *   - Editorial depth: visible word count (AR+EN aware), H2/H3 counts,
 *     FAQ items (faq_json), reading_time.
 *   - Evidence: external link domains (authority links), internal link count.
 *   - Legacy stains: planted filler phrases (§1.3 AUDIT_REPORT shapes),
 *     "Sources cited" claims with zero external links, Latin contamination
 *     ratio in AR bodies (MSA law 176 surface check, report-only).
 *   - Governance: review_status, last_reviewed_at, published_at age.
 *   - Cross-language pairing: linked_post_id resolvable BOTH ways; the
 *     unpaired sets per language (the §2 mandate input).
 *
 * OUTPUT: JSON to stdout (consumable) + a compact human summary on stderr.
 *
 * LAWS: read-only PostgREST GETs (paginated, order=id) · rate-limited (~1
 * req/s per VERCEL-USAGE-7 spirit, but this is Supabase not origin) · prints
 * metrics, never full bodies.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     bun scripts/blog-runner/blog-corpus-inventory.mts > inventory.json
 */

import {
  contentWords,
  orphanEntries,
} from "../../src/lib/blog-keyword-relevance";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "[blog-corpus-inventory] missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
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
  category: string | null;
  author: string | null;
  published_at: string | null;
  updated_at: string | null;
  review_status: string | null;
  last_reviewed_at: string | null;
  reading_time: number | null;
  linked_post_id: string | null;
  focus_keyword: string | null;
  keywords: string[] | null;
  tags: string[] | null;
  faq_json: FaqItem[] | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

async function rest(path: string): Promise<Row[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `PostgREST ${res.status} on ${path.slice(0, 80)}…: ${text.slice(0, 300)}`,
    );
  }
  return JSON.parse(text);
}

// ── text metrics ───────────────────────────────────────────────────────────

/** Count visible words: strip markdown syntax, then whitespace-split. */
function wordCount(md: string): number {
  const stripped = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return 0;
  return stripped.split(" ").filter(Boolean).length;
}

function headingCount(md: string, level: number): number {
  const re = new RegExp(`^${"#".repeat(level)}\\s+\\S`, "gm");
  return (md.match(re) || []).length;
}

function links(md: string) {
  const external = new Set<string>();
  const internal: string[] = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const url = m[1].trim();
    if (/^https?:\/\//i.test(url)) {
      try {
        external.add(new URL(url).hostname);
      } catch {
        /* malformed — ignore */
      }
    } else if (url.startsWith("/")) {
      internal.push(url);
    }
  }
  // bare autolinks (rare but legal markdown)
  for (const bare of md.match(/(^|[\s(])https?:\/\/[^\s)]+/g) || []) {
    try {
      external.add(new URL(bare.trim()).hostname);
    } catch {
      /* ignore */
    }
  }
  return { external: [...external], internal };
}

/** Latin-contamination ratio for AR VISIBLE text (MSA law surface, report-only).
 *  Strips markdown machinery first: image/link URLs + alt texts + code —
 *  the law governs the rendered body, not the markdown plumbing. */
function latinRatio(md: string): number {
  const visible = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
  const letters = visible.replace(/[^\p{L}]/gu, "");
  if (!letters) return 0;
  const latin = visible.match(/[A-Za-z]/g) || [];
  return latin.length / letters.length;
}

// Image CDN hosts are NOT authority links (the Pexels-first image law).
const IMAGE_HOSTS = new Set([
  "images.pexels.com",
  "images.unsplash.com",
  "cdn.pixabay.com",
]);

function authorityDomains(all: string[]): string[] {
  return all.filter((h) => !IMAGE_HOSTS.has(h));
}

// Legacy planted phrases measured by AUDIT_REPORT §1.3 / §4 (EN + AR shapes).
const LEGACY_PHRASES_EN: Array<[string, RegExp]> = [
  ["keyword-echo tail", /, answering the common question of/i],
  ["query-echo self-ref", /the “[^”]{5,60}” question/i],
  ["query-echo plain", /the "[^"]{5,60}" question/i],
  ["sources-cited claim", /\*\*Sources cited?:\*\*/i],
  ["sources-cited heading", /^#{1,3}\s*Sources?\b/im],
  ["reader-question block", /\*\*Reader question:\*\*/i],
];
const LEGACY_PHRASES_AR: Array<[string, RegExp]> = [
  ["سؤال القارئ block", /\*\*سؤال القارئ:\*\*/],
  ["كلمة مفتاحية label", /\*\*كلمة مفتاحية:\*\*/],
  ["مصادر claim", /\*\*المصادر:\*\*/],
];

function legacyStains(md: string, lang: "en" | "ar") {
  const found: string[] = [];
  const table = lang === "en" ? LEGACY_PHRASES_EN : LEGACY_PHRASES_AR;
  for (const [name, re] of table) if (re.test(md)) found.push(name);
  return found;
}

// ── keyword/tag topical relevance (P1 batch 13, owner order 2026-11-06) ───
// The on-site search predicate (matchesBlogSearch) matches on keywords+tags,
// so a legacy random keyword pool pollutes search results for unrelated
// queries. The detector lives in src/lib/blog-keyword-relevance.ts (single
// source — shared with the remediation channel); this script measures, the
// remediation channel fixes. Basis here: title + category + focus_keyword.

// ── fetch all published rows (paginated) ──────────────────────────────────

async function fetchAll(): Promise<Row[]> {
  const cols =
    "id,slug,language,title,excerpt,category,author,published_at,updated_at,review_status,last_reviewed_at,reading_time,linked_post_id,focus_keyword,keywords,tags,faq_json,content,meta_title,meta_description";
  const out: Row[] = [];
  let offset = 0;
  const PAGE = 500;
  for (;;) {
    const page = await rest(
      `blog_posts?select=${cols}&is_published=eq.true&order=id.asc&limit=${PAGE}&offset=${offset}`,
    );
    out.push(...page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}

// ── main ──────────────────────────────────────────────────────────────────

const rows = await fetchAll();
const byId = new Map(rows.map((r) => [r.id, r]));
const metricById = new Map<string, Metric>();

type Metric = {
  id: string;
  slug: string;
  language: "en" | "ar";
  title: string;
  category: string | null;
  published_at: string | null;
  updated_at: string | null;
  review_status: string | null;
  last_reviewed_at: string | null;
  words: number;
  h2: number;
  h3: number;
  faq_items: number;
  ext_domains: string[];
  int_links: number;
  legacy_stains: string[];
  latin_ratio_ar: number | null;
  sources_claim_no_links: boolean;
  linked_post_id: string | null;
  linked_resolves: boolean | null;
  linked_lang_pair_ok: boolean | null;
  backlink_from: string | null;
  pairing: "bidirectional" | "one-way" | "unpaired" | "broken";
  keywords_count: number;
  tags_count: number;
  keyword_orphans: string[];
  tag_orphans: string[];
};

const metrics: Metric[] = rows.map((r) => {
  const md = typeof r.content === "string" ? r.content : "";
  const { external, internal } = links(md);
  const stains = legacyStains(md, r.language);
  // keyword/tag topical relevance (P1 batch 13): orphans vs the article's own
  // topical words (title + category + focus_keyword).
  const topical = contentWords(
    [r.title, r.category, r.focus_keyword].filter(Boolean).join(" "),
  );
  const keywordOrphans = orphanEntries(r.keywords, topical);
  const tagOrphans = orphanEntries(r.tags, topical);
  const sourcesClaim =
    stains.includes("sources-cited claim") ||
    stains.includes("sources-cited heading") ||
    stains.includes("مصادر claim");
  const linked = r.linked_post_id
    ? (byId.get(r.linked_post_id) ?? null)
    : null;
  // who points back at me?
  let backlinkFrom: string | null = null;
  for (const other of rows) {
    if (other.linked_post_id === r.id && other.id !== r.id) {
      backlinkFrom = other.slug;
      break;
    }
  }
  let pairing: Metric["pairing"] = "unpaired";
  if (linked || backlinkFrom) {
    if (linked && linked.linked_post_id === r.id) pairing = "bidirectional";
    else if (!linked && backlinkFrom) pairing = "one-way";
    else if (linked && linked.linked_post_id !== r.id) pairing = "broken";
    else pairing = "one-way";
  }
  return {
    id: r.id,
    slug: r.slug,
    language: r.language,
    title: r.title,
    category: r.category,
    published_at: r.published_at,
    updated_at: r.updated_at,
    review_status: r.review_status,
    last_reviewed_at: r.last_reviewed_at,
    words: wordCount(md),
    h2: headingCount(md, 2),
    h3: headingCount(md, 3),
    faq_items: Array.isArray(r.faq_json) ? r.faq_json.length : 0,
    ext_domains: authorityDomains(external),
    int_links: internal.length,
    legacy_stains: stains,
    latin_ratio_ar: r.language === "ar" ? Number(latinRatio(md).toFixed(4)) : null,
    sources_claim_no_links: sourcesClaim && external.length === 0,
    linked_post_id: r.linked_post_id,
    linked_resolves: r.linked_post_id ? linked !== null : null,
    linked_lang_pair_ok:
      linked !== null ? linked.language !== r.language : null,
    backlink_from: backlinkFrom,
    pairing,
    keywords_count: (r.keywords || []).length,
    tags_count: (r.tags || []).length,
    keyword_orphans: keywordOrphans,
    tag_orphans: tagOrphans,
  };
});

for (const m of metrics) metricById.set(m.id, m);

// ── corpus summary ────────────────────────────────────────────────────────

const byLang = (l: "en" | "ar") => metrics.filter((m) => m.language === l);
const unpaired = (l: "en" | "ar") =>
  byLang(l).filter(
    (m) => m.pairing === "unpaired" || m.pairing === "broken",
  );
const oneWay = (l: "en" | "ar") => byLang(l).filter((m) => m.pairing === "one-way");

function tier(m: Metric): "A" | "B" | "C" | "D" {
  // Tier A: deep + evidenced + governed  (blog floor laws: ≥1500 ask, FAQ,
  // authority links, reviewed)
  if (
    m.words >= 1500 &&
    m.faq_items >= 3 &&
    m.ext_domains.length >= 1 &&
    m.review_status === "reviewed"
  )
    return "A";
  // Tier B: acceptable depth, partial signals
  if (m.words >= 1200 && m.faq_items >= 1) return "B";
  // Tier C: thin or ungoverned — needs editorial treatment
  if (m.words >= 800) return "C";
  // Tier D: superficial (<800 words) — top treatment priority
  return "D";
}

const summary = {
  generated_at: new Date().toISOString(),
  total_published: metrics.length,
  per_language: {
    en: byLang("en").length,
    ar: byLang("ar").length,
  },
  tiers: {
    A: metrics.filter((m) => tier(m) === "A").length,
    B: metrics.filter((m) => tier(m) === "B").length,
    C: metrics.filter((m) => tier(m) === "C").length,
    D: metrics.filter((m) => tier(m) === "D").length,
  },
  review_status: {
    reviewed: metrics.filter((m) => m.review_status === "reviewed").length,
    pending: metrics.filter((m) => m.review_status === "pending").length,
    other: metrics.filter(
      (m) => m.review_status !== "reviewed" && m.review_status !== "pending",
    ).length,
  },
  pairing: {
    bidirectional: metrics.filter((m) => m.pairing === "bidirectional").length,
    one_way: metrics.filter((m) => m.pairing === "one-way").length,
    broken: metrics.filter((m) => m.pairing === "broken").length,
    unpaired: metrics.filter((m) => m.pairing === "unpaired").length,
    unpaired_en: unpaired("en").length,
    unpaired_ar: unpaired("ar").length,
  },
  legacy_stains: {
    articles_with_stains: metrics.filter((m) => m.legacy_stains.length > 0)
      .length,
    sources_claim_no_links: metrics.filter((m) => m.sources_claim_no_links)
      .length,
    ar_latin_ratio_over_5pct: metrics.filter(
      (m) => m.latin_ratio_ar !== null && m.latin_ratio_ar > 0.05,
    ).length,
  },
  authority_links: {
    with_any: metrics.filter((m) => m.ext_domains.length > 0).length,
    without_any: metrics.filter((m) => m.ext_domains.length === 0).length,
    en_without: metrics.filter(
      (m) => m.language === "en" && m.ext_domains.length === 0,
    ).length,
    ar_without: metrics.filter(
      (m) => m.language === "ar" && m.ext_domains.length === 0,
    ).length,
  },
  words_median: (() => {
    const w = metrics.map((m) => m.words).sort((a, b) => a - b);
    return w.length ? w[Math.floor(w.length / 2)] : 0;
  })(),
  keyword_tag_relevance: {
    rows_with_keywords: metrics.filter((m) => m.keywords_count > 0).length,
    rows_zero_keywords: metrics.filter((m) => m.keywords_count === 0).length,
    rows_with_orphan_keywords: metrics.filter((m) => m.keyword_orphans.length > 0)
      .length,
    orphan_keyword_entries: metrics.reduce(
      (n, m) => n + m.keyword_orphans.length,
      0,
    ),
    rows_with_orphan_tags: metrics.filter((m) => m.tag_orphans.length > 0)
      .length,
    orphan_tag_entries: metrics.reduce((n, m) => n + m.tag_orphans.length, 0),
  },
};

// ── PAIR PARITY (E8, owner order 2026-11-01 clause 3-d: «فحص النسختين
// العربية والإنجليزية والتأكد من تكافئهما») — every bidirectional pair is
// quality-compared: depth ratio, FAQ counts, authority links. A pair is
// FLAGGED when one side lags (words ratio < 0.6 either way, or one side
// <1000 words, or FAQ <4 on one side, or authority links 0 on one side).
// Read-only measurement; the fix channel is the treatment batches.
const pairParity = metrics
  .filter((m) => m.pairing === "bidirectional" && m.language === "en")
  .map((en) => {
    const ar = metricById.get(en.linked_post_id!)!;
    const ratio = ar.words / Math.max(1, en.words);
    const flags: string[] = [];
    if (ratio < 0.6) flags.push("ar_depth_lag");
    if (ratio > 1.67) flags.push("en_depth_lag");
    if (en.words < 1000) flags.push("en_under_floor");
    if (ar.words < 1000) flags.push("ar_under_floor");
    if (en.faq_items < 4) flags.push("en_faq_thin");
    if (ar.faq_items < 4) flags.push("ar_faq_thin");
    if (en.ext_domains.length === 0) flags.push("en_no_authority");
    if (ar.ext_domains.length === 0) flags.push("ar_no_authority");
    return {
      en_slug: en.slug,
      ar_slug: ar.slug,
      en_words: en.words,
      ar_words: ar.words,
      depth_ratio: Number(ratio.toFixed(2)),
      en_faq: en.faq_items,
      ar_faq: ar.faq_items,
      en_authority: en.ext_domains.length,
      ar_authority: ar.ext_domains.length,
      parity: flags.length === 0 ? "ok" : "flagged",
      flags,
    };
  });

// ── UNPAIRED LEDGER (E8, owner order clause 3-e: «أو توثيق عدم وجود نظير
// حتى تتم معالجته») — the durable documentation of every published article
// with no live counterpart. New pipeline articles land here the moment they
// publish unpaired; L-batches consume the eligible entries.
const unpairedLedger = metrics
  .filter((m) => m.pairing === "unpaired" || m.pairing === "broken")
  .sort((a, b) => b.words - a.words)
  .map((m) => ({
    slug: m.slug,
    language: m.language,
    words: m.words,
    tier: tier(m),
    faq: m.faq_items,
    authority: m.ext_domains.length,
    published_at: m.published_at,
    // counterpart-worthiness policy (triage §4.3): A/B + core topics are
    // eligible; D-tier must be treated first; the rest documented as-is.
    eligible_for_counterpart: tier(m) === "A" || tier(m) === "B",
  }));

const pairParitySummary = {
  pairs_measured: pairParity.length,
  pairs_ok: pairParity.filter((p) => p.parity === "ok").length,
  pairs_flagged: pairParity.filter((p) => p.parity === "flagged").length,
};

console.log(
  JSON.stringify(
    {
      summary,
      pair_parity_summary: pairParitySummary,
      pair_parity: pairParity,
      unpaired_ledger: unpairedLedger,
      articles: metrics.map((m) => ({ ...m, tier: tier(m) })),
    },
    null,
    2,
  ),
);

// compact human summary on stderr
console.error("── blog corpus inventory (read-only) ──");
console.error(JSON.stringify(summary, null, 2));
console.error("pair parity:", JSON.stringify(pairParitySummary));
console.error(
  `unpaired ledger: ${unpairedLedger.length} (${unpairedLedger.filter((u) => u.eligible_for_counterpart).length} eligible A/B)`,
);
console.error(
  "keyword/tag relevance:",
  JSON.stringify(summary.keyword_tag_relevance),
);
