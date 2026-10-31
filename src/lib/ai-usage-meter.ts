/**
 * AI USAGE METER — the centralized (provider × model × function) counters
 * (Phase 388, owner order 2026-10-31 clause 3 «تنفيذ العدادات المركزية لكل
 * (مزود × نموذج × وظيفة)، بما فيها Tavily وExa، مع جعل التسجيل اختياريًا
 * وFail-Open تمامًا، وعدم تعطيل التوليد عند فشل التخزين» — approved design
 * §6-هـ of docs/AI-ROUTER-UNIFICATION-AUDIT-2026-10-31.md, frame R2).
 *
 * WHAT THIS IS
 *   A generalization of the PROVEN per-provider patterns (ai-usage-gemini.ts
 *   per-tag counters · ai-cf-usage.ts neuron meter) to EVERY provider and
 *   search arm: one structured console line `[ai-meter]` per ATTEMPT inside
 *   the walk, plus Upstash daily counters keyed by
 *
 *     ai:usage:{UTC date}:{function}:{provider}:{model}:{metric}
 *
 *   metrics: calls · ok · empty · fail · quota · tokens_est
 *   (the function part reuses featureFromTag's sanitization so the existing
 *   Gemini counter shapes and the new keys share one convention).
 *
 * THE THREE LAWS (owner clause 3, binding):
 *   1. OPTIONAL: AI_METER=0 disables EVERYTHING (no console line, no
 *      Upstash command) — zero-effect rollback without a deploy.
 *   2. FAIL-OPEN COMPLETELY: no failure of this module may EVER disable,
 *      delay beyond its 3s bound, or alter generation — every path is
 *      swallowed; a metering outage is an accounting gap, never a call
 *      failure (the ai-usage-gemini FAIL-SOFT law, generalized).
 *   3. SAME STORE, NO NEW SERVICES: Upstash REST via the platform's
 *      existing UPSTASH_REDIS_REST_URL/TOKEN (the rate limiter's and both
 *      standing counters' store) — TTL 30 days, EXPIRE NX, no schema, no
 *      paid service, no card.
 *
 * MONTHLY SEARCH QUOTAS (design §6-هـ, gap D-3 closed):
 *   Tavily  — free Researcher 1,000 credits/month (basic=1 · advanced=2 ·
 *             extract=1 per 5 URLs — official pricing table). Key:
 *             tavily:usage:{YYYY-MM}:credits · WARNING at 80% (advisory —
 *             the monthly grant renews; no barrier).
 *   Exa     — free $10/month credit (Phase-3 measured ≈$0.004/search +
 *             /contents). Key: exa:usage:{YYYY-MM}:usd-cents · WARNING at
 *             80% (advisory). Cost model (official rates, measured in
 *             Phase 2/3 reports): search $4/1k = 0.4¢ · contents $1/1k =
 *             0.1¢ per request.
 */

import { featureFromTag } from "./ai-usage-gemini";

const TTL_SECONDS = String(30 * 24 * 60 * 60); // 30 days

/* ───────────────────────────── Knob ───────────────────────────── */

/** AI_METER=0 → the meter is fully disabled (owner clause 3: optional). */
export function aiMeterEnabled(): boolean {
  return process.env.AI_METER !== "0";
}

/* ───────────────────────────── Types ───────────────────────────── */

export type AIMeterProvider =
  | "openrouter"
  | "groq"
  | "nvidia"
  | "gemini"
  | "cloudflare"
  | "tavily"
  | "exa";

export type AIMeterOutcome = "ok" | "empty" | "fail" | "quota";

export interface AIMeterEvent {
  /** The chain tag / function id (e.g. "plan:nutrition", "blog:pairing"). */
  fn: string;
  provider: AIMeterProvider | string;
  model: string;
  outcome: AIMeterOutcome;
  latencyMs?: number;
  /** Token estimate (chars/4 in + chars/4 out) — best-effort. */
  tokensEst?: number;
}

/* ─────────────────────── Key shape (stable contract) ─────────────────────── */

/** Redis-key-safe model label (lowercase, [a-z0-9._-] only — mirrors
 *  featureFromTag's function sanitization). */
export function sanitizeMeterModel(model: string): string {
  const cleaned = (model || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "unknown";
}

function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function utcMonthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

/** The stable daily counter key — public so probes/reports mirror it. */
export function aiMeterKey(
  date: string,
  fn: string,
  provider: string,
  model: string,
  metric: string,
): string {
  return `ai:usage:${date}:${featureFromTag(fn)}:${provider}:${sanitizeMeterModel(model)}:${metric}`;
}

/* ─────────────────────── Upstash plumbing (fail-soft) ─────────────────────── */

function upstashUrl(): string {
  return process.env.UPSTASH_REDIS_REST_URL || "";
}
function upstashToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || "";
}

async function upstashPipeline(cmds: string[][]): Promise<boolean> {
  const url = upstashUrl();
  const token = upstashToken();
  if (!url || !token) return false;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmds),
      // Hard 3s bound — accounting must never stall an AI response.
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as Array<{ error?: string }>;
    return Array.isArray(data) && data.every((r) => !r.error);
  } catch {
    return false;
  }
}

async function upstashGet(key: string): Promise<number | null> {
  const url = upstashUrl();
  const token = upstashToken();
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string | null };
    if (typeof data.result !== "string") return null;
    const n = Number(data.result);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

/* ─────────────────────── The generalized attempt meter ─────────────────────── */

/**
 * Record ONE provider attempt. Called from INSIDE the walk/arms (never from
 * call sites — R2 wires the engine, not the consumers).
 *
 * Behavior: prints the structured `[ai-meter]` line (the audit source of
 * truth — Vercel/GHA logs) and bumps the daily (provider×model×function)
 * counters. EVERYTHING is swallowed: this function can never throw, never
 * rejects, and never disables generation (owner clause 3, laws 1+2).
 */
export async function trackAIMeterAttempt(evt: AIMeterEvent): Promise<void> {
  try {
    if (!aiMeterEnabled()) return;
    const date = utcDateKey();
    const fn = featureFromTag(evt.fn);
    const provider = String(evt.provider || "unknown").toLowerCase();
    const model = sanitizeMeterModel(evt.model);

    console.log(
      `[ai-meter] fn=${fn} provider=${provider} model=${model}` +
        ` outcome=${evt.outcome} latency=${evt.latencyMs ?? "-"}ms` +
        ` tokens_est=${evt.tokensEst ?? "-"}`,
    );

    const cmds: string[][] = [];
    const touched: string[] = [];
    const bump = (metric: string, delta: number | string, isFloat = false) => {
      const key = aiMeterKey(date, fn, provider, model, metric);
      cmds.push(isFloat ? ["INCRBYFLOAT", key, String(delta)] : ["INCRBY", key, String(delta)]);
      touched.push(key);
    };
    bump("calls", 1);
    bump(evt.outcome, 1);
    if (typeof evt.tokensEst === "number" && evt.tokensEst > 0) {
      bump("tokens_est", Math.round(evt.tokensEst * 100) / 100, true);
    }
    for (const key of touched) cmds.push(["EXPIRE", key, TTL_SECONDS, "NX"]);

    await upstashPipeline(cmds); // fail-soft by construction
  } catch {
    /* THE LAW: never propagate — a metering failure is an accounting gap */
  }
}

/* ─────────────────── Monthly search-quota meters (D-3) ─────────────────── */

/** Official free-tier limits (docs.tavily.com · exa.ai/pricing). */
export const TAVILY_MONTH_CREDIT_LIMIT = 1_000;
export const EXA_MONTH_USD_CENTS_LIMIT = 1_000; // $10
export const QUOTA_WARN_SHARE = 0.8;

/** Credit/cost model (official pricing tables; Phase-2/3 verified). */
export const TAVILY_CREDIT_BASIC = 1;
export const TAVILY_CREDIT_ADVANCED = 2;
export const TAVILY_EXTRACT_CREDITS_PER_5_URLS = 1;
export const EXA_SEARCH_CENTS = 0.4; // $4 / 1k searches
export const EXA_CONTENTS_CENTS = 0.1; // $1 / 1k contents requests

export function tavilyUsageMonthKey(month = utcMonthKey()): string {
  return `tavily:usage:${month}:credits`;
}
export function exaUsageMonthKey(month = utcMonthKey()): string {
  return `exa:usage:${month}:usd-cents`;
}

/** Credits consumed by one Tavily /search call (depth-driven). */
export function tavilySearchCredits(depth: "basic" | "advanced"): number {
  return depth === "advanced" ? TAVILY_CREDIT_ADVANCED : TAVILY_CREDIT_BASIC;
}

/** Credits consumed by one Tavily /extract call (1 per 5 URLs). */
export function tavilyExtractCredits(urlCount: number): number {
  return Math.max(1, Math.ceil(Math.max(0, urlCount) / 5));
}

/**
 * Record Tavily credits consumed this month (advisory quota meter —
 * fail-open by the same law as the attempt meter). Never blocks.
 */
export async function trackTavilyCredits(credits: number, tag?: string): Promise<void> {
  try {
    if (!aiMeterEnabled()) return;
    if (!Number.isFinite(credits) || credits <= 0) return;
    const key = tavilyUsageMonthKey();
    console.log(
      `[ai-meter] provider=tavily quota=credits credits=${credits} month=${utcMonthKey()}${tag ? ` fn=${featureFromTag(tag)}` : ""}`,
    );
    await upstashPipeline([
      ["INCRBYFLOAT", key, String(credits)],
      ["EXPIRE", key, TTL_SECONDS, "NX"],
    ]);
  } catch {
    /* never propagate */
  }
}

/** Record Exa cost (usd cents) this month (advisory quota meter). */
export async function trackExaCostCents(cents: number, tag?: string): Promise<void> {
  try {
    if (!aiMeterEnabled()) return;
    if (!Number.isFinite(cents) || cents <= 0) return;
    const key = exaUsageMonthKey();
    console.log(
      `[ai-meter] provider=exa quota=usd-cents cents=${cents} month=${utcMonthKey()}${tag ? ` fn=${featureFromTag(tag)}` : ""}`,
    );
    await upstashPipeline([
      ["INCRBYFLOAT", key, String(cents)],
      ["EXPIRE", key, TTL_SECONDS, "NX"],
    ]);
  } catch {
    /* never propagate */
  }
}

/** Tavily credits consumed this month (null = meter unavailable). */
export async function tavilyCreditsThisMonth(): Promise<number | null> {
  return upstashGet(tavilyUsageMonthKey());
}

/** Exa cost this month in USD cents (null = meter unavailable). */
export async function exaCostCentsThisMonth(): Promise<number | null> {
  return upstashGet(exaUsageMonthKey());
}

/* ─────────────────── Daily read-back (queue-health panel) ─────────────────── */

export interface AIMeterDayRow {
  fn: string;
  provider: string;
  model: string;
  calls: number;
  ok: number;
  empty: number;
  fail: number;
  quota: number;
  tokensEst: number;
}

/**
 * Read a UTC day's (provider×model×function) rows via SCAN+MGET.
 * Fail-open: any outage returns [] (the panel stays honest without it).
 */
export async function readAIMeterDay(date = utcDateKey()): Promise<AIMeterDayRow[]> {
  const url = upstashUrl();
  const token = upstashToken();
  if (!url || !token) return [];
  try {
    // SCAN the day's keys (bounded: two cursor rounds at COUNT 300).
    const pattern = `ai:usage:${date}:*`;
    const keys: string[] = [];
    let cursor = "0";
    for (let round = 0; round < 3 && keys.length < 900; round++) {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([["SCAN", cursor, "MATCH", pattern, "COUNT", "300"]]),
        signal: AbortSignal.timeout(3_000),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
      const page = data?.[0]?.result as [string, string[]] | undefined;
      if (!Array.isArray(page)) return [];
      cursor = page[0];
      keys.push(...page[1]);
      if (cursor === "0") break;
    }
    if (keys.length === 0) return [];

    const values = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([["MGET", ...keys.slice(0, 900)]]),
      signal: AbortSignal.timeout(3_000),
    });
    if (!values.ok) return [];
    const vdata = (await values.json()) as Array<{ result?: unknown }>;
    const raw = vdata?.[0]?.result;
    if (!Array.isArray(raw)) return [];

    // ai:usage:{date}:{fn}:{provider}:{model}:{metric} → rows
    const rows = new Map<string, AIMeterDayRow>();
    keys.slice(0, 900).forEach((key, i) => {
      const parts = key.split(":"); // [ai, usage, date, fn, provider, model, metric]
      if (parts.length !== 7) return;
      const metric = parts[6];
      const num = Number(raw[i]);
      if (!Number.isFinite(num)) return;
      const rowKey = `${parts[3]}|${parts[4]}|${parts[5]}`;
      let row = rows.get(rowKey);
      if (!row) {
        row = {
          fn: parts[3],
          provider: parts[4],
          model: parts[5],
          calls: 0,
          ok: 0,
          empty: 0,
          fail: 0,
          quota: 0,
          tokensEst: 0,
        };
        rows.set(rowKey, row);
      }
      if (metric === "calls") row.calls = num;
      else if (metric === "ok") row.ok = num;
      else if (metric === "empty") row.empty = num;
      else if (metric === "fail") row.fail = num;
      else if (metric === "quota") row.quota = num;
      else if (metric === "tokens_est") row.tokensEst = Math.round(num);
    });
    return [...rows.values()].sort(
      (a, b) => b.calls - a.calls || a.fn.localeCompare(b.fn) || a.provider.localeCompare(b.provider),
    );
  } catch {
    return [];
  }
}
