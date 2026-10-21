#!/usr/bin/env node
// db-blog-state-inspect.mjs — BLOG-CACHE-REFRESH root-cause evidence tool
// (owner order 2026-10-21 «افحص سبب عدم انعكاس تعديلاتي اليدوية…»).
//
// WHY: the owner's manual edits + review approvals appeared missing from the
// live site while the DB was the only source of truth we could not read
// directly (no Supabase PAT in this session). This script is the READ-ONLY
// measuring instrument: it dumps the exact blog_posts state (review columns,
// updated_at, content identity) for the affected slugs plus a corpus census
// (duplicate slug+language pairs among published rows, review_status counts,
// 5 most-recently-updated rows) so "did the edit actually save?" and "are
// there multiple copies?" are answered with row-level evidence, not guesses.
//
// SAFETY LAWS (same shape as storage-inventory.mjs):
//   - READ-ONLY by construction: plain PostgREST GETs, zero write verbs.
//   - Prints row state + content IDENTITY only (length/words/sha256-12/
//     first+last 120 chars) — never the full body, never any secret.
//   - service-role key is read from env, used in headers, never printed.
//
// Usage (GitHub Actions db-blog-state-inspect.yml — dispatch-only):
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/db-blog-state-inspect.mjs [slug1,slug2,...]
// Default slugs = the two articles of the 2026-10-21 incident.

import crypto from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SLUGS = (process.argv[2] ||
  "best-creatine-men-guide,protein-myths-busted-muscle-gain")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[db-blog-state-inspect] missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function rest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PostgREST ${res.status} on ${path.slice(0, 60)}…: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

/** Row identity WITHOUT dumping the body: lengths + hash + head/tail. */
function summarize(row) {
  const content = typeof row.content === "string" ? row.content : "";
  return {
    id: row.id,
    slug: row.slug,
    language: row.language,
    is_published: row.is_published,
    review_status: row.review_status ?? null,
    last_reviewed_at: row.last_reviewed_at ?? null,
    published_at: row.published_at ?? null,
    updated_at: row.updated_at ?? null,
    created_at: row.created_at ?? null,
    title: row.title ?? null,
    meta_title: row.meta_title ?? null,
    linked_post_id: row.linked_post_id ?? null,
    content_len: content.length,
    content_words: content.split(/\s+/).filter(Boolean).length,
    content_sha256_12: crypto.createHash("sha256").update(content).digest("hex").slice(0, 12),
    content_head_120: content.slice(0, 120),
    content_tail_120: content.slice(-120),
    columns: Object.keys(row).sort(),
  };
}

const SELECT = "id,slug,language,is_published,review_status,last_reviewed_at,published_at,updated_at,created_at,title,meta_title,linked_post_id,content";

// ── 1. every row carrying an inspected slug (any language / any publish
//      state — duplicate detection is the point; maybeSingle on the read
//      path makes ambiguity invisible otherwise).
const orFilter = SLUGS.map((s) => `slug.eq.${s}`).join(",");
const targetRows = await rest(
  `blog_posts?select=${SELECT}&or=(${orFilter})&order=updated_at.desc`,
);
console.log("== TARGET SLUG ROWS ==");
console.log(JSON.stringify(targetRows.map(summarize), null, 2));

// ── 2. duplicate census among PUBLISHED rows (slug+language collisions —
//      the live read path is .eq(slug).eq(language).eq(is_published)).
const pairs = await rest("blog_posts?select=slug,language&is_published=eq.true");
const seen = new Map();
const dupes = [];
for (const r of pairs) {
  const k = `${r.language}:${r.slug}`;
  seen.set(k, (seen.get(k) || 0) + 1);
}
for (const [k, n] of seen) if (n > 1) dupes.push({ key: k, rows: n });
console.log("== DUPLICATE CENSUS (published slug+language pairs) ==");
console.log(
  JSON.stringify(
    { published_rows: pairs.length, distinct_pairs: seen.size, duplicates: dupes },
    null,
    2,
  ),
);

// ── 3. review-status census (published) — how many rows still claim pending.
const statuses = await rest("blog_posts?select=review_status&is_published=eq.true");
const byStatus = {};
for (const r of statuses) {
  const k = r.review_status ?? "NULL";
  byStatus[k] = (byStatus[k] || 0) + 1;
}
console.log("== REVIEW-STATUS CENSUS (published) ==");
console.log(JSON.stringify(byStatus, null, 2));

// ── 4. the 5 most-recently-updated rows (what actually changed lately —
//      catches an overwrite mechanism re-serving old data).
const recent = await rest(
  `blog_posts?select=${SELECT}&order=updated_at.desc&limit=5`,
);
console.log("== 5 MOST RECENTLY UPDATED ROWS ==");
console.log(JSON.stringify(recent.map(summarize), null, 2));
