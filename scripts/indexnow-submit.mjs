#!/usr/bin/env node
/**
 * IndexNow submitter (SEO-COLLAPSE-AUDIT-2026-10-18 — P1 recovery fix).
 *
 * WHY: the audit's measured finding — Bing returns "There are no results
 * for site:alkemos.com" (zero pages indexed; even the brand query has no
 * results) while the site serves 200/indexable to crawlers and its six
 * sitemaps are healthy. Bing never picked the ~6-week-old domain up.
 * IndexNow is Bing's own push protocol (also honored by Yandex/Seznam/
 * Naver...; Google does NOT use it) and works WITHOUT site verification:
 * a key file at https://alkemos.com/<key>.txt is the only ownership proof.
 *
 * WHAT (read-only against the site, push-only against IndexNow):
 *   1. Reads the key from public/<key>.txt in this repo (single source of
 *      truth — the same file served at the keyLocation URL).
 *   2. Fetches the six child sitemaps from the LIVE site (SITE_URL env,
 *      default https://alkemos.com) and extracts <loc> + <lastmod>.
 *   3. Filters: URLs whose <lastmod> is within --days (default 3) days of
 *      today, or ALL URLs with --all (recovery bootstrapping).
 *      Sitemap entries WITHOUT <lastmod> are only included with --all
 *      (no honest freshness signal to filter on).
 *   4. POSTs batches of --batch (default 500) URLs to
 *      https://api.indexnow.org/indexnow as
 *      {host, key, keyLocation, urlList} — the documented JSON shape.
 *   5. Prints an honest summary (JSON line) and exits:
 *      0 = at least one batch accepted (202/200); 1 = nothing submitted
 *      (0 URLs matched or every batch failed hard 400/403/422); 2 =
 *      quota/throttle (429) — retry later, do not hammer.
 *
 * SAFETY: no secrets (the key is public-by-design at the keyLocation URL),
 * no DB writes, no site mutations, idempotent — resubmitting URLs IndexNow
 * already knows is a documented no-op ("If a search engine already knows
 * the URL it will ignore it").
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs                 # lastmod ≤ 3 days
 *   node scripts/indexnow-submit.mjs --all           # every sitemap URL
 *   node scripts/indexnow-submit.mjs --days 7 --batch 1000
 *   SITE_URL=https://alkemos.com node scripts/indexnow-submit.mjs --all
 */

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const optValue = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : dflt;
};

const SITE_URL = (process.env.SITE_URL || "https://alkemos.com").replace(/\/$/, "");
const DAYS = Number.parseInt(optValue("days", "3"), 10);
const BATCH = Math.min(10000, Math.max(1, Number.parseInt(optValue("batch", "500"), 10)));
const ALL = flag("all");
const KEY_LOCATION = `${SITE_URL}/528c4a22973f45cd3c1af4e4e218035b.txt`;

const SITEMAPS = [
  "sitemap-pages.xml",
  "sitemap-collections.xml",
  "sitemap-comparisons.xml",
  "sitemap-exercises.xml",
  "sitemap-foods.xml",
  "sitemap-blog.xml",
];

async function findKeyFile() {
  // public/<key>.txt — file name IS the key (IndexNow convention).
  const pubDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
  for (const f of await readdir(pubDir)) {
    if (/^[0-9a-f]{16,64}\.txt$/i.test(f)) {
      const content = (await readFile(path.join(pubDir, f), "utf8")).trim();
      const key = f.replace(/\.txt$/i, "");
      if (content === key) return { key, file: f };
    }
  }
  return null;
}

function extractUrls(xml) {
  const out = [];
  const blocks = xml.split(/<url>/).slice(1);
  for (const b of blocks) {
    const loc = b.match(/<loc>([^<]+)<\/loc>/);
    if (!loc) continue;
    const lastmod = b.match(/<lastmod>([^<]+)<\/lastmod>/);
    out.push({ loc: loc[1].trim(), lastmod: lastmod ? lastmod[1].trim() : null });
  }
  return out;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "alkemos-indexnow-submitter/1.0 (+https://alkemos.com)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.text();
}

async function submitBatch(key, urls) {
  const body = JSON.stringify({
    host: new URL(SITE_URL).host,
    key,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  });
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body,
  });
  let text = "";
  try { text = (await res.text()).slice(0, 200); } catch { /* body optional */ }
  return { status: res.status, body: text };
}

function isRecent(lastmod, days) {
  if (!lastmod) return false;
  const t = Date.parse(lastmod);
  if (Number.isNaN(t)) return false;
  return t >= Date.now() - days * 86400_000;
}

async function main() {
  const found = await findKeyFile();
  if (!found) {
    console.error("::error::No IndexNow key file public/<hex>.txt found (file name must equal its content).");
    process.exitCode = 1;
    return;
  }
  console.log(`key file: public/${found.file} (public-by-design — served at the keyLocation URL)`);

  let all = [];
  const perSitemap = {};
  for (const sm of SITEMAPS) {
    let urls;
    try {
      urls = extractUrls(await fetchText(`${SITE_URL}/${sm}`));
    } catch (e) {
      console.error(`::error::sitemap fetch failed: ${sm} — ${e.message}`);
      process.exitCode = 1;
      return;
    }
    perSitemap[sm] = urls.length;
    all = all.concat(urls);
  }
  console.log(`sitemap inventory: ${SITEMAPS.map((s) => `${s}=${perSitemap[s]}`).join(" · ")} (total ${all.length})`);

  const selected = ALL ? all : all.filter((u) => isRecent(u.lastmod, DAYS));
  const mode = ALL ? "all" : `lastmod<=${DAYS}d`;
  console.log(`selected ${selected.length} URL(s) [mode=${mode}]`);

  if (selected.length === 0) {
    console.log(JSON.stringify({ ok: true, submitted: 0, mode, note: "no recent URLs — nothing to submit (idempotent no-op)" }));
    return;
  }

  let accepted = 0;
  let failed = 0;
  let throttled = 0;
  const statuses = [];
  for (let i = 0; i < selected.length; i += BATCH) {
    const batch = selected.slice(i, i + BATCH).map((u) => u.loc);
    const r = await submitBatch(found.key, batch);
    statuses.push({ batch: Math.ceil((i + 1) / BATCH), n: batch.length, status: r.status });
    console.log(`batch ${statuses.length}: ${batch.length} URLs -> HTTP ${r.status}${r.body ? ` (${r.body})` : ""}`);
    if (r.status === 200 || r.status === 202) accepted += batch.length;
    else if (r.status === 429) throttled += batch.length;
    else failed += batch.length;
  }

  const summary = {
    ok: accepted > 0,
    mode,
    total: selected.length,
    accepted,
    throttled,
    failed,
    batches: statuses,
  };
  console.log(JSON.stringify(summary));
  if (accepted === 0) {
    process.exitCode = throttled > 0 ? 2 : 1;
    console.error(`::error::IndexNow accepted 0 URLs (throttled=${throttled}, failed=${failed})`);
  }
}

// main-guard: importable without side effects (repo script law)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(`::error::${e && e.message ? e.message : String(e)}`);
    process.exitCode = 1;
  });
}
