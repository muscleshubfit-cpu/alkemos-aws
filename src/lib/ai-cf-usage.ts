/**
 * src/lib/ai-cf-usage.ts — Cloudflare Workers AI NEURON usage counter
 * (AI-PROVIDERS-EXPANSION Phase 5-C / stage ج, owner order 2026-10-31
 * «نفّذ جميع المراحل المتبقية» approving §12-3 + §12-4 of the Phase-4
 * unified-architecture report).
 *
 * WHAT THIS IS: the §8-ج central neuron-quota meter for the FIFTH
 * provider (Cloudflare Workers AI — free tier 10,000 neurons/day, no
 * card). Every CF REST answer carries `result.usage.neurons` (measured
 * call-by-call against the `cf-ai-neurons` header in the Phase-3 live
 * battery — the two sources agreed on every call; GraphQL Analytics
 * rejected its guessed fields, documented blocked). This module
 * accumulates that number in Upstash Redis (the SAME store the Gemini
 * counters and the platform rate limiter use) under a DAILY UTC key, so
 * the 00:00 UTC rollover is automatic (new date = new key — no purge).
 *
 * Key shape:  cf:usage:{UTC date}:neurons   (TTL 30 days, EXPIRE NX)
 *
 * THE TWO THRESHOLDS (§8-ج design, owner-approved §12-4):
 *   ≥ 80% (8,000 neurons)  → WARNING  — surfaces in queue-health + the
 *                                      weekly report (never blocks).
 *   ≥ 95% (9,500 neurons)  → BARRIER  — every NEW CF call is skipped
 *                                      honestly and the role falls to
 *                                      the next provider in the same
 *                                      walk. The free allocation is
 *                                      never drained to zero BY DESIGN
 *                                      (5% headroom for in-flight
 *                                      concurrent calls).
 *
 * FAIL-SOFT LAW (identical to ai-usage-gemini.ts): accounting must NEVER
 * affect an AI call. Without Upstash the meter degrades to an in-process
 * counter (per-process barrier — documented degradation, §8-ج «التدهور»)
 * and the structured [cf-usage] console line is ALWAYS printed so
 * Vercel/GHA logs stay the audit source of truth.
 */

const TTL_SECONDS = String(30 * 24 * 60 * 60); // 30 days

/** Free-tier daily neuron allocation (official). */
export const CF_NEURON_DAY_LIMIT = 10_000;
/** WARNING threshold share (80% — queue-health + weekly report). */
export const CF_NEURON_WARN_SHARE = 0.8;
/** BARRIER threshold share (95% — skip new CF calls honestly). */
export const CF_NEURON_BARRIER_SHARE = 0.95;

export const CF_NEURON_WARN_THRESHOLD = Math.floor(
  CF_NEURON_DAY_LIMIT * CF_NEURON_WARN_SHARE,
); // 8,000
export const CF_NEURON_BARRIER_THRESHOLD = Math.floor(
  CF_NEURON_DAY_LIMIT * CF_NEURON_BARRIER_SHARE,
); // 9,500

/** Lazy env reads — never captured at import time (cold start + tests). */
function upstashUrl(): string {
  return process.env.UPSTASH_REDIS_REST_URL || "";
}
function upstashToken(): string {
  return process.env.UPSTASH_REDIS_REST_TOKEN || "";
}

function utcDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Public so probes/reports mirror the EXACT same key shape. */
export function cfUsageKey(date: string): string {
  return `cf:usage:${date}:neurons`;
}

/* ── In-process degradation counter (no-Upstash path) ──────────────── */

/**
 * Per-process neuron tally for the no-Upstash degradation (§8-ج). A
 * single GitHub Actions step / one Vercel lambda instance sees its own
 * window — honest, documented, and still bounded by the per-call
 * barrier check below.
 */
const inProcessNeurons = new Map<string, number>();

function bumpInProcess(date: string, delta: number): void {
  inProcessNeurons.set(date, (inProcessNeurons.get(date) ?? 0) + delta);
}

function readInProcess(date: string): number {
  return inProcessNeurons.get(date) ?? 0;
}

/** TEST-ONLY seam: resets the in-process degradation counter. */
export function __resetCfInProcessUsageForTests(): void {
  inProcessNeurons.clear();
}

/* ── Upstash helpers (bounded, fail-soft) ──────────────────────────── */

async function upstashGet(key: string): Promise<number | null> {
  const url = upstashUrl();
  const token = upstashToken();
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
      // Hard 2s bound — a quota check must never stall an AI call.
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

/* ── Public API ────────────────────────────────────────────────────── */

/**
 * Neurons consumed TODAY (UTC) so far. Returns the Upstash number when
 * reachable, else the in-process degradation tally (fail-open: unknown
 * is reported as the in-process value, never as a barrier trip).
 */
export async function cfNeuronsToday(): Promise<number> {
  const date = utcDateKey();
  const remote = await upstashGet(cfUsageKey(date));
  if (remote !== null) return remote;
  return readInProcess(date);
}

/**
 * THE BARRIER (§8-ج): true when today's accumulation reached ≥95% of the
 * free daily allocation. Callers SKIP every new CF call when tripped —
 * the role falls to the next provider in the same walk (honest skip,
 * documented reason, no fabricated success). Fail-open by construction:
 * a metering outage never blocks the provider.
 */
export async function cfNeuronBarrierTripped(): Promise<boolean> {
  const used = await cfNeuronsToday();
  return used >= CF_NEURON_BARRIER_THRESHOLD;
}

/**
 * The WARNING level (§8-ج): true at ≥80% — advisory only (queue-health
 * strip + weekly report); NEVER blocks a call.
 */
export async function cfNeuronWarnLevel(): Promise<boolean> {
  const used = await cfNeuronsToday();
  return used >= CF_NEURON_WARN_THRESHOLD;
}

export type CfUsageEvent = {
  model: string;
  /** Neurons reported by `result.usage.neurons` (header fallback ok). */
  neurons: number;
  ok: boolean;
  /** HTTP status of the CF response when one was received. */
  status?: number;
  latencyMs?: number;
  /** Role tag riding the chain call (e.g. "blog:pairing"). */
  tag?: string;
};

/**
 * Record ONE CF call's neuron consumption. Atomic INCRBY + EXPIRE NX on
 * the daily key; the in-process tally bumps FIRST so the per-process
 * barrier stays coherent even when Upstash is unreachable (the remote
 * pipeline is best-effort — a lost increment is a fail-open accounting
 * gap, never a call failure). The structured console line is ALWAYS
 * printed (audit source of truth — Vercel/GHA logs).
 */
export async function trackCfUsage(evt: CfUsageEvent): Promise<void> {
  const date = utcDateKey();
  const neurons =
    typeof evt.neurons === "number" && Number.isFinite(evt.neurons) && evt.neurons > 0
      ? Math.round(evt.neurons * 100) / 100
      : 0;

  const pct = ((neurons / CF_NEURON_DAY_LIMIT) * 100).toFixed(2);
  console.log(
    `[cf-usage] date=${date} model=${evt.model} ok=${evt.ok ? 1 : 0}` +
      ` neurons=${neurons} (~${pct}% of the 10k/day free allocation)` +
      ` status=${evt.status ?? "-"} latency=${evt.latencyMs ?? "-"}ms` +
      `${evt.tag ? ` tag=${evt.tag}` : ""}`,
  );

  if (neurons <= 0) return;

  bumpInProcess(date, neurons);

  const key = cfUsageKey(date);
  await upstashPipeline([
    ["INCRBYFLOAT", key, String(neurons)],
    ["EXPIRE", key, TTL_SECONDS, "NX"],
  ]);
}
