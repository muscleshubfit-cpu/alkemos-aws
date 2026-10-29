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

// ── 5. QUEUE-HEALTH CENSUS (2026-10-30, owner order «زر مسح التنبيه يعرض
//      تم مسح 0 بينما يظل التنبيه الأحمر 0/6 pair_id ظاهرًا»): reproduces
//      the EXACT three scans GET /api/ai/queue-health runs, read-only, so
//      the strip's numbers can be verified against database truth from a
//      dispatch-only channel. Prints counts + per-row identity (id/lang/
//      status/dates) — never bundle bodies, never secrets.
{
  // 5a. ai_jobs census (route reads the 500 newest rows).
  const jobRows = await rest(
    "ai_jobs?select=id,status,job_type,created_at,finished_at&order=created_at.desc&limit=500",
  );
  const jobCounts = { queued: 0, processing: 0, done: 0, failed: 0, other: 0 };
  for (const r of jobRows) {
    const st = String(r.status || "");
    if (st in jobCounts) jobCounts[st] += 1;
    else jobCounts.other += 1;
  }
  const failedRows = jobRows.filter((r) => r.status === "failed");
  console.log("== QUEUE-HEALTH CENSUS: ai_jobs (500 newest) ==");
  console.log(
    JSON.stringify(
      {
        scanned: jobRows.length,
        counts: jobCounts,
        clearableFailedJobs: failedRows.length,
        failed_ids: failedRows.map((r) => r.id),
      },
      null,
      2,
    ),
  );

  // 5b. pairing adoption — the route's 7-day window scan.
  const sincePair = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const pairRows = await rest(
    `blog_generation_queue?select=id,language,pair_id,status,created_at&created_at=gte.${sincePair}&order=created_at.desc&limit=100`,
  );
  const paired = pairRows.filter(
    (r) => typeof r.pair_id === "string" && r.pair_id.length > 0,
  );
  const pct = pairRows.length > 0 ? Math.round((paired.length / pairRows.length) * 100) : 100;
  console.log("== QUEUE-HEALTH CENSUS: pairing adoption (7-day window) ==");
  console.log(
    JSON.stringify(
      {
        window_since: sincePair,
        rows: pairRows.length,
        paired: paired.length,
        pct,
        alert_fires: pairRows.length >= 4 && pct < 25,
        per_row: pairRows.map((r) => ({
          id: r.id,
          lang: r.language,
          status: r.status,
          pair_id: r.pair_id,
          created_at: r.created_at,
        })),
      },
      null,
      2,
    ),
  );

  // 5c. research fallback — the route's 24h window scan (pattern encoded
  //      exactly like supabase-js .like() does: quotes + colon).
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let fallback = { rows: 0, error: null };
  try {
    const fbPattern = encodeURIComponent('"researchSource":"fallback"');
    const fbRows = await rest(
      `blog_generation_queue?select=id,language,created_at&created_at=gte.${since24h}&article_bundle=like.*${fbPattern}*&limit=50`,
    );
    fallback.rows = fbRows.length;
  } catch (e) {
    fallback.error = String(e).slice(0, 200);
  }
  console.log("== QUEUE-HEALTH CENSUS: research fallback (24h window) ==");
  console.log(JSON.stringify(fallback, null, 2));

  // 5d. OPERATOR PROBES (2026-10-30, same owner order — the route's two
  //     `like()` scans over article_bundle): the live census above caught
  //     PostgREST 42883 ("no operator matches") on `like` — the classic
  //     jsonb-vs-LIKE failure. These probes settle the column's live
  //     type/shape and which operator actually works, BEFORE any route
  //     change: (a) OpenAPI column type, (b) typeof one live bundle value,
  //     (c) like vs arrow (->> eq / not-is-null) for BOTH markers.
  try {
    const specRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (specRes.ok) {
      const spec = await specRes.json();
      const props =
        spec?.definitions?.blog_generation_queue?.properties ?? null;
      const types = {};
      for (const [k, v] of Object.entries(props || {})) types[k] = v?.format || v?.type;
      console.log("== BUNDLE PROBE: blog_generation_queue column types (OpenAPI) ==");
      console.log(JSON.stringify({ article_bundle: types.article_bundle ?? "UNKNOWN", pair_id: types.pair_id ?? "UNKNOWN" }, null, 2));
    } else {
      console.log("== BUNDLE PROBE: OpenAPI fetch failed ==", specRes.status);
    }
  } catch (e) {
    console.log("== BUNDLE PROBE: OpenAPI error ==", String(e).slice(0, 150));
  }

  try {
    const sample = await rest(
      "blog_generation_queue?select=id,article_bundle&order=created_at.desc&limit=1",
    );
    const s = sample[0];
    const b = s?.article_bundle;
    console.log("== BUNDLE PROBE: live value shape ==");
    console.log(
      JSON.stringify(
        {
          id: s?.id,
          typeof: typeof b,
          is_object: b !== null && typeof b === "object",
          keys: b !== null && typeof b === "object" ? Object.keys(b).slice(0, 8) : null,
          head_60: typeof b === "string" ? b.slice(0, 60) : null,
        },
        null,
        2,
      ),
    );
  } catch (e) {
    console.log("== BUNDLE PROBE: sample error ==", String(e).slice(0, 150));
  }

  // (c) operator A/B: the exact filters the route needs, tried live.
  const probes = [
    ["like (current route form — researchSource)", `article_bundle=like.*${encodeURIComponent('"researchSource":"fallback"')}*`],
    ["arrow eq (researchSource)", `article_bundle->>researchSource=eq.fallback`],
    ["like (current route form — repairLoop)", `article_bundle=like.*${encodeURIComponent('"repairLoop"')}*`],
    ["arrow not-null (repairLoop)", `article_bundle->>repairLoop=not.is.null`],
  ];
  console.log("== BUNDLE PROBE: operator A/B on article_bundle ==");
  for (const [label, filter] of probes) {
    try {
      const rows = await rest(
        `blog_generation_queue?select=id&${filter}&limit=25`,
      );
      console.log(JSON.stringify({ probe: label, ok: true, rows: rows.length }));
    } catch (e) {
      console.log(JSON.stringify({ probe: label, ok: false, error: String(e).slice(0, 160) }));
    }
  }
}
