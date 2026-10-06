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
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmds),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Upstash pipeline HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Upstash pipeline: unexpected response");
  return data.map((r) => r.result);
}

async function scanKeys(pattern) {
  let cursor = "0";
  const keys = [];
  do {
    const [next, batch] = await pipeline([
      ["SCAN", cursor, "MATCH", pattern, "COUNT", "500"],
    ]);
    cursor = String(next);
    if (Array.isArray(batch)) keys.push(...batch);
  } while (cursor !== "0");
  return keys;
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function main() {
  // feature -> metric -> total
  const perFeature = new Map();
  const perDay = new Map();

  for (let i = 1; i <= WINDOW_DAYS; i++) {
    const date = dayKey(i); // the last 7 FULL UTC days (today excluded)
    perDay.set(date, 0);
    // Note: SCAN per day keeps memory flat and lets us attribute calls.
  }

  // One SCAN per day (7 scans) → GET all matched keys in one pipeline.
  (async () => {
    for (const [date] of perDay) {
      const keys = await scanKeys(`gemini:usage:${date}:*`);
      if (keys.length === 0) continue;
      const values = await pipeline(keys.map((k) => ["GET", k]));
      keys.forEach((key, idx) => {
        const parts = String(key).split(":");
        const feature = parts[3] || "unknown";
        const metric = parts[4] || "unknown";
        const v = Number(values[idx] || 0);
        if (!perFeature.has(feature)) {
          perFeature.set(feature, Object.fromEntries(METRICS.map((m) => [m, 0])));
        }
        const row = perFeature.get(feature);
        if (!(metric in row)) row[metric] = 0; // unknown metric — kept honest
        row[metric] += v;
        if (metric === "calls") perDay.set(date, (perDay.get(date) || 0) + v);
      });
    }

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
    for (const [date] of perDay) lines.push(`| ${date} | ${fmt(perDay.get(date) || 0)} |`);
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
