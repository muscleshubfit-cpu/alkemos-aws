#!/usr/bin/env node
/**
 * Gemini weekly usage report generator (Phase 343 — owner order 2026-10-06
 * «مع مراقبة استهلاك Gemini لمدة أسبوع، وإنشاء تقرير المراقبة الأسبوعية»).
 *
 * Node 22, ZERO dependencies. Reads the daily Upstash counters written by
 * src/lib/ai-usage-gemini.ts (key shape: gemini:usage:{UTC date}:{feature}:{metric})
 * for the LAST 7 FULL DAYS and updates docs/ai/gemini-weekly-usage-report.md
 * (newest week on top, 8-week retention — older weeks live in git history).
 *
 * 343-FIXUP-2 (2026-10-06): the first smoke dispatch (run 37393414575) hung
 * silently for the whole 10-minute job timeout. ROOT CAUSE (reproduced on a
 * local mock-Upstash): pipeline() returns ONE entry per command, but the SCAN
 * result was destructured one level too high — `const [next, batch] = await
 * pipeline([...SCAN])` bound next = the WHOLE [cursor, keys] array, so cursor
 * became String([...]) (e.g. "0,") which NEVER equals "0" → an unbounded loop
 * of SUCCESSFUL SCANs (no error ever thrown, zero output). Hardened here:
 *   * correct one-level destructuring + result-shape guard,
 *   * ONE global SCAN over `gemini:usage:*` (was 7 per-day scans), bucketed
 *     locally from the key itself,
 *   * HARD page cap (2000) + wall-clock budget (90s) — beyond either, an
 *     HONEST red with the measured page/key counts, never a silent hang,
 *   * progress line every 25 pages on stderr (pages/cursor/keys so far),
 *   * pipeline responses carrying an `error` field (and null SCAN cursor)
 *     now throw with the command + message instead of poisoning the cursor.
 *
 * This script NEVER commits by itself — the workflow step commits with the
 * owner identity (GIT-IDENTITY law: muscleshubfit@gmail.com, [vercel skip]).
 * Fails honestly (exit 1) when the Upstash secrets are missing.
 */

import { readFileSync, writeFileSync } from "node:fs";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error(
    "gemini-usage-report: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing — cannot read counters (honest red)",
  );
  process.exit(1);
}

const REPORT_PATH = "docs/ai/gemini-weekly-usage-report.md";
const WINDOW_DAYS = 7;
const MAX_SECTIONS = 8;
const MARKER = "<!-- AUTO-WEEKLY-START -->";
const SCAN_PATTERN = "gemini:usage:*";
const SCAN_COUNT = 1000; // hint — keys per SCAN page
const MAX_PAGES = 2000; // hard cap: 2000 × 1000 = 2M keys scanned max
const SCAN_BUDGET_MS = 90_000; // wall-clock budget for the whole scan phase
const PROGRESS_EVERY = 25;
const METRICS = [
  "calls",
  "ok",
  "empty",
  "fail",
  "fail_quota",
  "fail_server",
  "fail_auth",
  "fail_bad_request",
  "fail_timeout",
  "fail_network",
  "fail_other",
  "tokens_in",
  "tokens_out",
];

function dayKey(offsetDays) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

async function pipeline(cmds) {
  let res;
  try {
    res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmds),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    throw new Error(`Upstash pipeline network failure: ${e && e.message ? e.message : e}`);
  }
  if (!res.ok) throw new Error(`Upstash pipeline HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length !== cmds.length) {
    throw new Error(`Upstash pipeline: unexpected response shape (${typeof data})`);
  }
  data.forEach((r, i) => {
    if (r && r.error) {
      throw new Error(`Upstash pipeline: command ${cmds[i][0]} failed: ${r.error}`);
    }
  });
  return data.map((r) => (r ? r.result : null));
}

async function scanAllKeys(pattern) {
  let cursor = "0";
  const keys = [];
  const started = Date.now();
  let pages = 0;
  do {
    // pipeline() returns ONE entry per command; SCAN's own result is
    // [nextCursor, keysBatch] — destructuring the pipeline array directly
    // was the 343-FIXUP-2 silent-hang bug (cursor became String([...]) and
    // never equaled "0" → unbounded loop of successful SCANs).
    const results = await pipeline([
      ["SCAN", cursor, "MATCH", pattern, "COUNT", String(SCAN_COUNT)],
    ]);
    const scanResult = results[0];
    if (!Array.isArray(scanResult) || scanResult.length < 2) {
      throw new Error(`Upstash SCAN: unexpected result shape after ${pages} pages (honest red)`);
    }
    const [next, batch] = scanResult;
    if (next === null || next === undefined) {
      throw new Error(`Upstash SCAN returned a null cursor after ${pages} pages (honest red)`);
    }
    cursor = String(next);
    if (Array.isArray(batch)) keys.push(...batch);
    pages++;
    if (pages % PROGRESS_EVERY === 0) {
      console.error(
        `[scan] pages=${pages} cursor=${cursor} keys=${keys.length} elapsed=${Math.round((Date.now() - started) / 1000)}s`,
      );
    }
    if (pages > MAX_PAGES) {
      throw new Error(
        `Upstash SCAN page cap exceeded: >${MAX_PAGES} pages for pattern ${pattern} (keyspace too large / cursor not converging — honest red, no silent hang)`,
      );
    }
    if (Date.now() - started > SCAN_BUDGET_MS) {
      throw new Error(
        `Upstash SCAN budget exceeded: ${Math.round((Date.now() - started) / 1000)}s for pattern ${pattern} after ${pages} pages, ${keys.length} keys (honest red, no silent hang)`,
      );
    }
  } while (cursor !== "0");
  console.error(`[scan] done: pages=${pages} keys=${keys.length} in ${Math.round((Date.now() - started) / 1000)}s`);
  return keys;
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function main() {
  // window = the last 7 FULL UTC days (today excluded)
  const window = new Map(); // date -> calls
  for (let i = 1; i <= WINDOW_DAYS; i++) {
    window.set(dayKey(i), 0);
  }
  const windowSet = new Set(window.keys());

  // feature -> metric -> total
  const perFeature = new Map();
  const perDay = new Map(window);

  (async () => {
    const keys = await scanAllKeys(SCAN_PATTERN);

    // Bucket strictly from the key shape: gemini:usage:{date}:{feature}:{metric}
    // (the tracker sanitizes ":" inside feature/metric, so the shape holds).
    let outOfWindow = 0;
    const gets = [];
    const metas = [];
    for (const key of keys) {
      const parts = String(key).split(":");
      if (parts.length < 5 || parts[0] !== "gemini" || parts[1] !== "usage") {
        outOfWindow++; // foreign key caught by the pattern — never counted
        continue;
      }
      const date = parts[2];
      if (!windowSet.has(date)) {
        outOfWindow++; // today's partial keys + stale days outside the window
        continue;
      }
      gets.push(["GET", key]);
      metas.push({ date, feature: parts[3], metric: parts.slice(4).join(":") });
    }

    if (gets.length > 0) {
      const CHUNK = 500;
      for (let i = 0; i < gets.length; i += CHUNK) {
        const slice = gets.slice(i, i + CHUNK);
        const metaSlice = metas.slice(i, i + CHUNK);
        const values = await pipeline(slice);
        metaSlice.forEach((meta, idx) => {
          const v = Number(values[idx] || 0);
          if (!perFeature.has(meta.feature)) {
            perFeature.set(meta.feature, Object.fromEntries(METRICS.map((m) => [m, 0])));
          }
          const row = perFeature.get(meta.feature);
          if (!(meta.metric in row)) row[meta.metric] = 0; // unknown metric — kept honest
          row[meta.metric] += v;
          if (meta.metric === "calls") {
            perDay.set(meta.date, (perDay.get(meta.date) || 0) + v);
          }
        });
      }
    }
    console.error(
      `[bucket] window-keys=${gets.length} out-of-window=${outOfWindow} features=${perFeature.size}`,
    );

    const from = dayKey(WINDOW_DAYS);
    const to = dayKey(1);
    const totalCalls = [...perFeature.values()].reduce((s, r) => s + r.calls, 0);
    const totalOk = [...perFeature.values()].reduce((s, r) => s + r.ok, 0);
    const totalFail = [...perFeature.values()].reduce((s, r) => s + r.fail, 0);
    const totalQuota = [...perFeature.values()].reduce((s, r) => s + r.fail_quota, 0);
    const totalEmpty = [...perFeature.values()].reduce((s, r) => s + r.empty, 0);
    const totalIn = [...perFeature.values()].reduce((s, r) => s + r.tokens_in, 0);
    const totalOut = [...perFeature.values()].reduce((s, r) => s + r.tokens_out, 0);

    const lines = [];
    lines.push(`## Week of ${from} → ${to} (auto — ${new Date().toISOString().slice(0, 10)})`);
    lines.push("");
    lines.push(
      `**الإجمالي:** ${fmt(totalCalls)} محاولة Gemini · ${fmt(totalOk)} نجاح · ${fmt(totalEmpty)} فارغ · ${fmt(totalFail)} فشل (منها ${fmt(totalQuota)} حصة/كوتا) · توكنز داخل ${fmt(totalIn)} / خارج ${fmt(totalOut)}`,
    );
    lines.push("");
    lines.push("| Feature (tag) | Calls | OK | Empty | Fail | Quota-fail | Tokens in | Tokens out |");
    lines.push("|---|---:|---:|---:|---:|---:|---:|---:|");
    const features = [...perFeature.entries()].sort((a, b) => b[1].calls - a[1].calls);
    if (features.length === 0) {
      lines.push("| — (لا استهلاك مسجل) | 0 | 0 | 0 | 0 | 0 | 0 | 0 |");
    }
    for (const [feature, r] of features) {
      lines.push(
        `| \`${feature}\` | ${fmt(r.calls)} | ${fmt(r.ok)} | ${fmt(r.empty)} | ${fmt(r.fail)} | ${fmt(r.fail_quota)} | ${fmt(r.tokens_in)} | ${fmt(r.tokens_out)} |`,
      );
    }
    if (features.length > 0) {
      lines.push(
        `| **Total** | **${fmt(totalCalls)}** | **${fmt(totalOk)}** | **${fmt(totalEmpty)}** | **${fmt(totalFail)}** | **${fmt(totalQuota)}** | **${fmt(totalIn)}** | **${fmt(totalOut)}** |`,
      );
    }
    lines.push("");
    lines.push("**حسب اليوم (calls):**");
    lines.push("");
    lines.push("| UTC day | Calls |");
    lines.push("|---|---:|");
    for (const [date] of window) lines.push(`| ${date} | ${fmt(perDay.get(date) || 0)} |`);
    lines.push("");
    lines.push(
      "> **التفسير الثابت:** fail_quota (429/402/403) على الخطة المجانية = سلوك متوقع — السلسلة تكمل بالمزودين الثلاثة الآخرين بنفس الترتيب (قانون الـ fallback لم يُمس). fail_server (5xx) = ضغط مؤقت على الموديل. المصدر: عدادات `gemini:usage:*` (TTL 30 يومًا) من `src/lib/ai-usage-gemini.ts` — سطر `[gemini-usage]` في لوجات Vercel/GHA هو الأثر الحرفي لكل محاولة.",
    );
    lines.push("");
    const section = lines.join("\n");

    let doc;
    try {
      doc = readFileSync(REPORT_PATH, "utf8");
    } catch {
      console.error(`gemini-usage-report: ${REPORT_PATH} missing — run inside the repo root (honest red)`);
      process.exit(1);
    }
    const markerIdx = doc.indexOf(MARKER);
    if (markerIdx === -1) {
      console.error(`gemini-usage-report: marker ${MARKER} not found in ${REPORT_PATH} (honest red)`);
      process.exit(1);
    }
    const headEnd = markerIdx + MARKER.length;
    const head = doc.slice(0, headEnd);
    const tail = doc.slice(headEnd);

    // Existing weekly sections (each starts with "## Week of") — newest first,
    // Week-0 baseline included; hard cap MAX_SECTIONS.
    const sections = tail
      .split(/\n(?=## Week )/)
      .map((s) => s.replace(/^\n+/, "").replace(/\s+$/, ""))
      .filter(Boolean);
    const kept = [section, ...sections].slice(0, MAX_SECTIONS);

    const out = `${head}\n\n${kept.join("\n\n")}\n`;
    writeFileSync(REPORT_PATH, out, "utf8");
    console.log(
      `gemini-usage-report: wrote week ${from} → ${to} (${fmt(totalCalls)} calls, ${fmt(totalQuota)} quota-fails) — sections kept: ${kept.length}/${MAX_SECTIONS}`,
    );
  })().catch((e) => {
    console.error(`gemini-usage-report FAILED: ${e && e.message ? e.message : e}`);
    process.exit(1);
  });
}

main();
