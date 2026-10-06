/**
 * Gemini usage tracking (Phase 343, owner order 2026-10-06:
 * «أضف Gemini كمزود AI جديد مع المزودين الحاليين... مع مراقبة استهلاك
 * Gemini لمدة أسبوع» — free tier).
 *
 * Lightweight daily counters in Upstash Redis (REST) — the SAME store the
 * platform rate limiter uses (src/lib/rate-limit.ts) — so the weekly usage
 * report (scripts/gemini-usage-report.mjs →
 * docs/ai/gemini-weekly-usage-report.md) can aggregate per-feature
 * consumption with ZERO schema changes and ZERO impact on the fallback
 * chain, the ai_jobs queue, or the blog pipeline mechanics.
 *
 * Key shape:  gemini:usage:{UTC date}:{feature}:{metric}
 *   feature = sanitized chain tag (e.g. "evo-chat", "blog_content-ar")
 *   metric  = calls | ok | empty | fail | fail_quota | fail_server |
 *             fail_auth | fail_bad_request | fail_timeout | fail_network |
 *             fail_other | tokens_in | tokens_out
 * TTL: 30 days (EXPIRE NX on every touched key — auto-cleanup; the weekly
 * report reads only the last 7 days).
 *
 * FAIL-SOFT LAW: tracking must NEVER affect an AI call — every failure path
 * (env missing, network error, timeout) is swallowed. When Upstash is not
 * configured the counters degrade to console-only (the structured
 * [gemini-usage] line is ALWAYS printed, so Vercel/GHA logs stay auditable).
 */

const TTL_SECONDS = String(30 * 24 * 60 * 60); // 30 days

/** Lazy env reads — the module must not capture env at import time
 *  (serverless cold start order + testability). */
function upstashUrl(): string {
  return process.env.UPSTASH_REDIS_REST_URL || "";
}
function upstashToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || "";
}

export type GeminiErrorKind =
  | "quota"
  | "server"
  | "auth"
  | "bad_request"
  | "network"
  | "timeout"
  | "other";

export type GeminiUsageEvent = {
  /** Chain tag (subsystem label) — e.g. "evo-chat", "blog:content-ar". */
  tag?: string;
  model: string;
  ok: boolean;
  /** HTTP 200 but no usable text (blocked / empty candidates). */
  isEmpty?: boolean;
  /** HTTP status of the Gemini response when one was received. */
  status?: number;
  /** Failure classification override (derived from status when omitted). */
  errorKind?: GeminiErrorKind;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  /** True when the call went through the streaming adapter. */
  streamed?: boolean;
};

/** Map an HTTP status to the coarse failure kind used by the weekly report. */
export function classifyGeminiError(
  status?: number,
  fallback: GeminiErrorKind = "other",
): GeminiErrorKind {
  if (status === undefined || status === 0) return fallback;
  if (status === 429 || status === 402 || status === 403) return "quota";
  if (status === 401) return "auth";
  if (status >= 500) return "server";
  if (status === 400 || status === 404 || status === 422) return "bad_request";
  return "other";
}

/** Tag → Redis-key-safe feature label (lowercase, [a-z0-9._-] only). */
export function featureFromTag(tag?: string): string {
  const cleaned = (tag || "direct")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "direct";
}

function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Public so the weekly report script mirrors the EXACT same shape. */
export function geminiUsageKey(
  date: string,
  feature: string,
  metric: string,
): string {
  return `gemini:usage:${date}:${feature}:${metric}`;
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

/**
 * Record one Gemini attempt. The gemini adapter AWAITS this (bounded by the
 * 3s pipeline guard) so a serverless freeze does not drop counters — but it
 * is fail-soft by construction: callers wrap it in try/catch and every
 * internal error is swallowed.
 */
export async function trackGeminiUsage(evt: GeminiUsageEvent): Promise<void> {
  const date = utcDateKey();
  const feature = featureFromTag(evt.tag);
  const kind = evt.ok
    ? null
    : evt.isEmpty
      ? null
      : classifyGeminiError(evt.status, evt.errorKind || "other");

  const metrics: Array<[string, number]> = [["calls", 1]];
  if (evt.ok) metrics.push(["ok", 1]);
  else if (evt.isEmpty) metrics.push(["empty", 1]);
  else if (kind) metrics.push(["fail", 1], [`fail_${kind}`, 1]);
  if (typeof evt.promptTokens === "number" && evt.promptTokens > 0)
    metrics.push(["tokens_in", evt.promptTokens]);
  if (typeof evt.completionTokens === "number" && evt.completionTokens > 0)
    metrics.push(["tokens_out", evt.completionTokens]);

  const cmds: string[][] = [];
  const touched: string[] = [];
  for (const [metric, delta] of metrics) {
    const key = geminiUsageKey(date, feature, metric);
    cmds.push(["INCRBY", key, String(delta)]);
    touched.push(key);
  }
  for (const key of touched) cmds.push(["EXPIRE", key, TTL_SECONDS, "NX"]);

  // Structured console line — ALWAYS (even without Upstash) so Vercel/GHA
  // logs remain the audit source of truth.
  console.log(
    `[gemini-usage] tag=${feature} model=${evt.model} ok=${evt.ok ? 1 : 0}` +
      ` empty=${evt.isEmpty ? 1 : 0} status=${evt.status ?? "-"}` +
      ` kind=${kind ?? "-"} tokens_in=${evt.promptTokens ?? "-"}` +
      ` tokens_out=${evt.completionTokens ?? "-"}` +
      ` latency=${evt.latencyMs ?? "-"}ms${evt.streamed ? " streamed=1" : ""}`,
  );

  await upstashPipeline(cmds);
}
