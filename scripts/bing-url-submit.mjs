#!/usr/bin/env node
/**
 * Bing URL Submission (SEO-ADSENSE-RECOVERY-PLAN-2026-10-31 — P1-4,
 * owner execution order 2026-11-01 «إبدأ التنفيذ»).
 *
 * WHY: the comprehensive audit (2026-10-31) measured that the repo secret
 * `BING_WEB_MASTER` (Bing Webmaster Tools API key, updated 2026-10-30)
 * has ZERO consumers — secret existence is not a working integration —
 * while IndexNow already pushes URLs successfully. The Bing Content
 * Submission API is the second, ownership-authenticated push channel:
 * it requires the site to be VERIFIED in Bing Webmaster Tools (plan
 * §9.2 — the owner's manual prerequisite, decision D-3) and carries a
 * per-site daily quota (10/day at the minimum tier).
 *
 * WHAT (read-only against the site, push-only against Bing):
 *   1. Reads the BWT API key from env BING_WEB_MASTER (GitHub Actions
 *      secret — NEVER printed, never logged; only HTTP status codes and
 *      per-URL counts are reported, §3.2 law).
 *   2. Fetches the six child sitemaps from the LIVE site (SITE_URL env,
 *      default https://alkemos.com) and extracts <loc> + <lastmod>.
 *   3. Filters: URLs whose <lastmod> is within --days (default 3) days
 *      of today, or ALL URLs with --all (capped by --limit).
 *   4. POSTs ONE batch of at most --limit (default 10 — the minimum
 *      BWT daily quota tier, safe under every tier) URLs to
 *      https://ssl.bing.com/webmaster/api.svc/2.0/SubmitUrls?apikey=…
 *      with {siteUrl, urlList} — the documented JSON shape.
 *   5. Prints an honest summary (JSON line) and exits:
 *      0 = at least one URL accepted (per-URL StatusCode 200/201);
 *      1 = nothing accepted — hard failure (HTTP 403 = site NOT verified
 *          in BWT or invalid key → the owner's §9.2 prerequisite is
 *          missing; 4xx/5xx = request rejected);
 *      2 = quota (per-URL StatusCode 400/405 or HTTP 429) — retry after
 *          the daily quota resets, do not hammer.
 *
 * SAFETY: the API key is a real secret (unlike the public-by-design
 * IndexNow key). It lives ONLY in the env of the workflow run, is never
 * echoed, never included in error output, and the request URL that
 * embeds it is never logged. No DB writes, no site mutations. Idempotent
 * at the protocol level: re-submitting a URL Bing already knows simply
 * returns its per-URL status without side effects.
 *
 * Usage:
 *   BING_WEB_MASTER=… node scripts/bing-url-submit.mjs            # lastmod ≤ 3 days, ≤10 URLs
 *   BING_WEB_MASTER=… node scripts/bing-url-submit.mjs --days 7
 *   BING_WEB_MASTER=… node scripts/bing-url-submit.mjs --all --limit 50
 *   SITE_URL=https://alkemos.com BING_WEB_MASTER=… node scripts/bing-url-submit.mjs
 */

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
// Default 10 = the minimum BWT daily quota tier — deliberately the
// safest cap so the script can never burn a higher-tier quota by
// accident; raise via --limit only against a measured higher tier.
const LIMIT = Math.min(10000, Math.max(1, Number.parseInt(optValue("limit", "10"), 10)));
const ALL = flag("all");
const API_KEY = process.env.BING_WEB_MASTER;

const SITEMAPS = [
  "sitemap-blog.xml", // freshest family first — within the quota the
  // most-recently-changed URLs (blog) get the slots before the static
  // families (whose lastmod rarely enters the --days window anyway).
  "sitemap-pages.xml",
  "sitemap-collections.xml",
  "sitemap-comparisons.xml",
  "sitemap-exercises.xml",
  "sitemap-foods.xml",
];

const BING_ENDPOINT = "https://ssl.bing.com/webmaster/api.svc/2.0/SubmitUrls";

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
    headers: { "User-Agent": "alkemos-bing-submitter/1.0 (+https://alkemos.com)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.text();
}

function isRecent(lastmod, days) {
  if (!lastmod) return false;
  const t = Date.parse(lastmod);
  if (Number.isNaN(t)) return false;
  return t >= Date.now() - days * 86400_000;
}

async function submitToBing(key, urls) {
  // The URL embeds the secret as a query param — it is NEVER logged.
  const res = await fetch(`${BING_ENDPOINT}?apikey=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      siteUrl: SITE_URL,
      urlList: urls,
    }),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body — handled by status below */
  }
  return { status: res.status, json };
}

async function main() {
  if (!API_KEY) {
    console.error("::error::BING_WEB_MASTER env is empty — the BWT API key secret is required (never printed).");
    process.exitCode = 1;
    return;
  }

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

  const candidates = ALL ? all : all.filter((u) => isRecent(u.lastmod, DAYS));
  const mode = ALL ? "all" : `lastmod<=${DAYS}d`;
  const selected = candidates.slice(0, LIMIT).map((u) => u.loc);
  console.log(`selected ${selected.length} of ${candidates.length} candidate URL(s) [mode=${mode}, limit=${LIMIT}]`);

  if (selected.length === 0) {
    console.log(JSON.stringify({ ok: true, submitted: 0, mode, note: "no recent URLs — nothing to submit (idempotent no-op)" }));
    return;
  }

  const r = await submitToBing(API_KEY, selected);

  // 403 = the classic pre-verification state: site not verified in BWT
  // (with a VALID key). Honest, actionable, never the secret.
  if (r.status === 403) {
    console.error("::error::Bing API returned 403 — alkemos.com is NOT verified in Bing Webmaster Tools. The BING_WEB_MASTER key reached Bing (authenticated) but the site is not claimed under it. Owner prerequisite: plan §9.2 (verify via Import-from-GSC).");
    console.log(JSON.stringify({ ok: false, http: 403, submitted: 0, quota: 0, mode, note: "BWT ownership verification missing (D-3 prerequisite)" }));
    process.exitCode = 1;
    return;
  }

  // 404 = measured locally 2026-11-01 with an invalid key: Bing's answer
  // to an unknown/bogus apikey (or one whose BWT account does not see
  // the site at all). Distinct from 403 above — actionable differently.
  if (r.status === 404) {
    console.error("::error::Bing API returned 404 — the BING_WEB_MASTER API key is invalid/unknown. Owner fix: Bing Webmaster Tools ▸ Settings ▸ API access ▸ regenerate the key, then update the GitHub secret BING_WEB_MASTER (plan §9.2 step 3).");
    console.log(JSON.stringify({ ok: false, http: 404, submitted: 0, quota: 0, mode, note: "invalid BWT API key — regenerate + update secret" }));
    process.exitCode = 1;
    return;
  }

  if (r.status === 429) {
    console.error("::error::Bing API throttled (HTTP 429) — daily quota exhausted; retry after the quota resets.");
    console.log(JSON.stringify({ ok: false, http: 429, submitted: 0, quota: selected.length, mode }));
    process.exitCode = 2;
    return;
  }

  if (r.status !== 200 || !r.json || !Array.isArray(r.json.d)) {
    // Never print the body verbatim: it could echo request details.
    console.error(`::error::Bing API returned HTTP ${r.status} with an unexpected body — nothing submitted.`);
    console.log(JSON.stringify({ ok: false, http: r.status, submitted: 0, quota: 0, mode }));
    process.exitCode = 1;
    return;
  }

  // Per-URL statuses inside {"d":[{Url, StatusCode, Message?}]}.
  let accepted = 0;
  let quota = 0;
  let failed = 0;
  const perUrl = [];
  for (const item of r.json.d) {
    const code = typeof item.StatusCode === "number" ? item.StatusCode : -1;
    if (code === 200 || code === 201) accepted += 1;
    else if (code === 400 || code === 405) quota += 1;
    else failed += 1;
    perUrl.push({ url: item.Url, status: code });
  }
  for (const p of perUrl.slice(0, 20)) {
    console.log(`  ${p.status}  ${p.url}`);
  }
  if (perUrl.length > 20) console.log(`  … ${perUrl.length - 20} more`);

  const summary = { ok: accepted > 0, http: 200, mode, total: selected.length, accepted, quota, failed };
  console.log(JSON.stringify(summary));
  if (accepted === 0) {
    process.exitCode = quota > 0 ? 2 : 1;
    console.error(`::error::Bing accepted 0 URLs (quota=${quota}, failed=${failed})`);
  }
}

// main-guard: importable without side effects (repo script law)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    // Never print e.config/e.url — fetch errors can embed the request URL
    // (which contains the key). Only the message, and even that is scrubbed.
    const msg = e && e.message ? e.message : String(e);
    console.error(`::error::${msg.replace(/apikey=[^&\s]+/g, "apikey=***")}`);
    process.exitCode = 1;
  });
}
