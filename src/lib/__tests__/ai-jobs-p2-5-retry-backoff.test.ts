import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";

/**
 * P2-5 canaries (audit AI-GENERATION-PIPELINES-AUDIT-2026-11-15, §9 item
 * 5 — «تقوية خوارزمية الاستئناف: backoff مجدول بnext_attempt_at (INF-14)
 * + شروط status للكُتّاب (INF-15, ART-6) + قفل تفاؤلي لطوابع الحزم
 * (ART-16)»): the ai_jobs retry algorithm hardening. ART-6 and ART-16
 * were delivered by the P1 frame (§12 log rows); the delta here is the
 * shared queue's own resume path:
 *
 * THE MEASURED DEFECTS (INF-14 + INF-15):
 *   · A requeue was IMMEDIATE — the failed row went straight back to
 *     `queued` and could be re-claimed by the same 40-minute run within
 *     seconds. The only spacing was the runner's blind 70s sleep whose
 *     regex (/429|rate.?limit|TPM|quota/i) matched the
 *     "Active quota-cooldowns" preamble that EVERY aggregated chain error
 *     carries — so a parse failure paid 70s of dead clock while a
 *     genuinely quota-drained provider got only 70s of mercy before
 *     attempt 2 re-burned the same dry bucket (run 33176102145).
 *   · finishJob/failJob wrote with NO status precondition — a late
 *     finisher could stamp `done` over a row the reaper had requeued.
 *
 * THE LAW THESE CANARIES PIN:
 *   · failJob stamps next_attempt_at on requeue (short window for a
 *     transient TERMINAL error, the 30-min provider-cooldown window for a
 *     quota-class terminal error — classified by the terminal line only,
 *     never by the preamble) and claimQueuedJobs only claims rows whose
 *     gate is NULL or past.
 *   · Both writers are processing-only CAS: a row that changed state
 *     underneath is reported (finishJob → false, failJob → "lost"),
 *     never blind-overwritten.
 *   · The runner retired the blind sleep and logs each outcome honestly.
 */

type Row = Record<string, unknown>;

/** The supabase-js builder shape the queue functions drive (only the
 * methods they actually call — a thenable so `await` resolves the chain). */
interface Chain {
  eq: (k: string, v: unknown) => Chain;
  or: (f: string) => Chain;
  order: () => Chain;
  limit: () => Chain;
  select: () => Chain;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  then: (resolve: (v: unknown) => void) => void;
}

const db = vi.hoisted(() => ({
  rows: [] as Row[],
  orFilters: [] as string[],
}));

vi.mock("@/lib/supabase/admin", () => {
  const runSelect = (filters: Array<[string, unknown]>) => {
    let out = db.rows.slice();
    for (const [k, v] of filters) {
      if (k === "__or") {
        // The INF-14 claimable gate, implemented semantically:
        // next_attempt_at IS NULL OR next_attempt_at <= now().
        out = out.filter(
          (r) => r.next_attempt_at == null || Date.parse(String(r.next_attempt_at)) <= Date.now(),
        );
      } else {
        out = out.filter((r) => r[k] === v);
      }
    }
    return out;
  };
  const runUpdate = (payload: Row, filters: Array<[string, unknown]>) => {
    const row = db.rows.find((r) =>
      filters.every(([k, v]) => (k === "__or" ? true : r[k] === v)),
    );
    if (!row) return [] as Row[];
    Object.assign(row, payload);
    return [row];
  };
  const makeChain = (mode: "select" | "update", payload: Row, filters: Array<[string, unknown]>): Chain => {
    const chain: Chain = {
      eq: (k: string, v: unknown) => {
        filters.push([k, v]);
        return chain;
      },
      or: (f: string) => {
        db.orFilters.push(f);
        filters.push(["__or", f]);
        return chain;
      },
      order: () => chain,
      limit: () => chain,
      select: () => chain,
      maybeSingle: async () => ({ data: null, error: null }),
      then: (resolve: (v: unknown) => void) =>
        resolve({
          data: mode === "select" ? runSelect(filters) : runUpdate(payload, filters),
          error: null,
        }),
    };
    return chain;
  };
  return {
    isSupabaseAdminConfigured: true,
    supabaseAdmin: {
      from: (table: string) => {
        if (table !== "ai_jobs") throw new Error(`unexpected table under test: ${table}`);
        return {
          select: () => makeChain("select", {}, []),
          update: (payload: Row) => makeChain("update", payload, []),
        };
      },
    },
  };
});

import {
  claimQueuedJobs,
  finishJob,
  failJob,
  isQuotaClassFailure,
  retryBackoffMs,
  nextAttemptAtISO,
  AI_RETRY_BACKOFF_MS,
  AI_RETRY_BACKOFF_COOLDOWN_MS,
  MAX_JOB_ATTEMPTS,
} from "@/lib/ai-jobs";

/** A byte-faithful aggregated chain error (the shape the audit measured):
 * config lines + the ALWAYS-present cooldown preamble + per-error lines. */
function chainError(errors: string[], withCooldownPreamble = true): string {
  return (
    "[ai-fallback-chain] All AI providers failed. (system: plan:nutrition)\n" +
    "OpenRouter keys configured: 2.\nGroq key: present.\nNVIDIA key: present.\n" +
    "Gemini key: present.\nCloudflare config: present (token+account).\n" +
    (withCooldownPreamble
      ? "Active quota-cooldowns: chain:groq until 2026-11-16T12:00:00.000Z; chain:openrouter until 2026-11-16T12:05:00.000Z\n"
      : "") +
    "Errors:\n  - " +
    errors.join("\n  - ")
  );
}

beforeEach(() => {
  db.rows = [];
  db.orFilters = [];
});

describe("isQuotaClassFailure — classifies the TERMINAL error line only (INF-14)", () => {
  it("a parse-failure tail is TRANSIENT even with the always-present quota-cooldown preamble (the audit's exact complaint)", () => {
    const msg = chainError([
      "groq: quota-cooldown until 2026-11-16T12:00:00.000Z (429: groq/llama: Rate limit reached) — entries skipped, no call made",
      "openrouter/qwen-3.8-27b: empty response",
    ]);
    expect(isQuotaClassFailure(msg)).toBe(false);
  });

  it("a real 429 terminal line is quota-class (the long, provider-cooldown-aligned window)", () => {
    const msg = chainError(["openrouter/llama-3.3-70b: 429 Rate limit exceeded: free-models-per-day"]);
    expect(isQuotaClassFailure(msg)).toBe(true);
  });

  it("a cooldown-SKIP terminal line (everything cooled, chain never reached a provider) is quota-class", () => {
    const msg = chainError([
      "groq: quota-cooldown until 2026-11-16T12:00:00.000Z (429: groq/llama: Rate limit reached) — entries skipped, no call made",
    ]);
    expect(isQuotaClassFailure(msg)).toBe(true);
  });

  it("a per-minute TPM window (groq's own seconds hint) is TRANSIENT — mirrors the P2-3 provider law", () => {
    const msg = chainError([
      "groq/llama: Error 429: Rate limit reached for llama on tokens per minute (TPM): Limit 6000, Used 5551, Requested 914. Please try again in 12.82s",
    ]);
    expect(isQuotaClassFailure(msg)).toBe(false);
  });

  it("a plain processor error (no Errors: section — validation/parse) is transient", () => {
    expect(isQuotaClassFailure("AI plan failed validation: macro closure violated by 41%")).toBe(false);
    expect(isQuotaClassFailure("")).toBe(false);
  });

  it("an auth/payment terminal (402/401) is quota-class — a dry account does not refill in 3 minutes", () => {
    expect(isQuotaClassFailure(chainError(["openrouter/model-x: 402 payment required"]))).toBe(true);
    expect(isQuotaClassFailure(chainError(["openrouter/model-x: 401 unauthorized"]))).toBe(true);
  });
});

describe("retryBackoffMs / nextAttemptAtISO — the scheduled retry windows", () => {
  it("transient tail ⇒ the 3-minute window; quota tail ⇒ the 30-minute provider-cooldown window", () => {
    expect(retryBackoffMs(chainError(["openrouter/qwen: empty response"]))).toBe(AI_RETRY_BACKOFF_MS);
    expect(retryBackoffMs(chainError(["openrouter/model-x: 429 Rate limit exceeded"]))).toBe(
      AI_RETRY_BACKOFF_COOLDOWN_MS,
    );
    expect(AI_RETRY_BACKOFF_MS).toBe(3 * 60_000);
    expect(AI_RETRY_BACKOFF_COOLDOWN_MS).toBe(30 * 60_000);
  });

  it("nextAttemptAtISO returns a now+backoff ISO timestamp (±5s clock tolerance)", () => {
    const transient = nextAttemptAtISO("plain failure");
    const quota = nextAttemptAtISO(chainError(["groq/x: 429 Rate limit reached"]));
    const now = Date.now();
    expect(Math.abs(Date.parse(transient) - (now + AI_RETRY_BACKOFF_MS))).toBeLessThan(5_000);
    expect(Math.abs(Date.parse(quota) - (now + AI_RETRY_BACKOFF_COOLDOWN_MS))).toBeLessThan(5_000);
  });
});

describe("failJob — requeue carries the scheduled gate (INF-14), writer is a CAS (INF-15)", () => {
  it("requeue (attempts < MAX) stamps next_attempt_at ≈ now+3min for a transient message and keeps the row queued", async () => {
    db.rows = [{ id: "job-1", status: "processing", attempts: 1, error_message: null }];
    const before = Date.now();
    const outcome = await failJob("job-1", 1, "AI plan failed validation: empty sections");
    expect(outcome.outcome).toBe("requeued");
    if (outcome.outcome !== "requeued") return;
    const row = db.rows[0];
    expect(row.status).toBe("queued");
    expect(row.finished_at).toBeNull();
    expect(Math.abs(Date.parse(String(row.next_attempt_at)) - (before + AI_RETRY_BACKOFF_MS))).toBeLessThan(5_000);
    // the returned schedule matches the stamped gate (one source of truth)
    expect(outcome.nextAttemptAt).toBe(row.next_attempt_at);
  });

  it("a quota-class message stamps the 30-minute provider-cooldown window instead", async () => {
    db.rows = [{ id: "job-2", status: "processing", attempts: 1, error_message: null }];
    const before = Date.now();
    const outcome = await failJob(
      "job-2",
      1,
      chainError(["openrouter/model-x: 429 Rate limit exceeded: free-models-per-day"]),
    );
    expect(outcome.outcome).toBe("requeued");
    expect(Math.abs(Date.parse(String(db.rows[0].next_attempt_at)) - (before + AI_RETRY_BACKOFF_COOLDOWN_MS))).toBeLessThan(5_000);
  });

  it("the exhausted attempt (attempts ≥ MAX) lands `failed` with finished_at set and NO retry gate", async () => {
    db.rows = [{ id: "job-3", status: "processing", attempts: MAX_JOB_ATTEMPTS, error_message: null }];
    const outcome = await failJob("job-3", MAX_JOB_ATTEMPTS, "still failing");
    expect(outcome).toEqual({ outcome: "failed" });
    expect(db.rows[0].status).toBe("failed");
    expect(db.rows[0].finished_at).toBeTruthy();
    expect(db.rows[0].next_attempt_at).toBeNull();
  });

  it("a row that stopped being processing underneath is reported LOST, never blind-overwritten (INF-15)", async () => {
    // the reaper requeued it mid-catch — status is `queued`, not `processing`
    db.rows = [{ id: "job-4", status: "queued", attempts: 1, error_message: "reaped: processing exceeded time limit — auto-retried" }];
    const outcome = await failJob("job-4", 1, "late failure from a stale runner");
    expect(outcome).toEqual({ outcome: "lost" });
    // the reaper's message survives — the late writer changed NOTHING
    expect(db.rows[0].status).toBe("queued");
    expect(db.rows[0].error_message).toContain("reaped");
  });
});

describe("finishJob — processing-only CAS (INF-15)", () => {
  it("lands on this run's processing row: done + result + cleared error and gate", async () => {
    db.rows = [{ id: "job-a", status: "processing", error_message: "old", next_attempt_at: "2026-11-16T10:00:00.000Z" }];
    const landed = await finishJob("job-a", { ok: true });
    expect(landed).toBe(true);
    expect(db.rows[0].status).toBe("done");
    expect(db.rows[0].result).toEqual({ ok: true });
    expect(db.rows[0].error_message).toBeNull();
    expect(db.rows[0].next_attempt_at).toBeNull();
  });

  it("does NOT resurrect a row that changed state underneath — returns false and writes nothing", async () => {
    db.rows = [{ id: "job-b", status: "queued", result: null }]; // reaped mid-run
    const landed = await finishJob("job-b", { ok: true });
    expect(landed).toBe(false);
    expect(db.rows[0].status).toBe("queued");
    expect(db.rows[0].result).toBeNull();
  });
});

describe("claimQueuedJobs — the claimable gate (INF-14)", () => {
  it("the candidate query carries the next_attempt_at NULL-or-past gate (the referral.ts .or() shape)", async () => {
    db.rows = [{ id: "fresh", status: "queued", attempts: 0, created_at: "2026-11-16T09:00:00Z", next_attempt_at: null }];
    await claimQueuedJobs(5);
    expect(db.orFilters.length).toBeGreaterThan(0);
    expect(db.orFilters[0]).toMatch(/^next_attempt_at\.is\.null,next_attempt_at\.lte\.\d{4}-\d{2}-\d{2}T/);
  });

  it("a row waiting out its backoff is NOT claimable — and does not occupy a claim slot", async () => {
    const future = new Date(Date.now() + 29 * 60_000).toISOString();
    db.rows = [
      { id: "cooling", status: "queued", attempts: 1, created_at: "2026-11-16T08:00:00Z", next_attempt_at: future },
      { id: "ready", status: "queued", attempts: 0, created_at: "2026-11-16T09:00:00Z", next_attempt_at: null },
    ];
    const claimed = await claimQueuedJobs(10);
    expect(claimed.map((r) => r.id)).toEqual(["ready"]);
  });

  it("a row whose gate has PASSED is claimable again; claiming clears the gate and increments attempts", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    db.rows = [{ id: "served", status: "queued", attempts: 1, created_at: "2026-11-16T08:00:00Z", next_attempt_at: past }];
    const claimed = await claimQueuedJobs(10);
    expect(claimed.map((r) => r.id)).toEqual(["served"]);
    expect(db.rows[0].status).toBe("processing");
    expect(db.rows[0].attempts).toBe(2);
    expect(db.rows[0].next_attempt_at).toBeNull();
  });
});

describe("runner source pins — the blind 70s sleep is retired, honesty took its place", () => {
  const src = readFileSync("scripts/ai-jobs-runner/process.mts", "utf8");

  it("no blind 70s/3s sleeps and no preamble-matching regex remain in the failure path", () => {
    expect(src).not.toContain("setTimeout(r, 70_000)");
    expect(src).not.toContain("setTimeout(r, 3_000)");
    expect(src).not.toMatch(/429\|rate\.\?limit\|TPM\|quota/);
    expect(src).not.toContain("cooling down 70s");
  });

  it("the requeue logs the scheduled backoff gate (the DB-enforced spacing)", () => {
    expect(src).toContain("requeued with scheduled backoff");
    expect(src).toContain("outcome.nextAttemptAt");
  });

  it("CAS misses are logged honestly on BOTH writers — landed check + lost branch", () => {
    expect(src).toContain("const finishLanded = await finishJob(job.id, result);");
    expect(src).toContain("finishJob did NOT land");
    expect(src).toContain('outcome.outcome === "lost"');
    expect(src).toContain("failure NOT recorded");
  });

  it("the success path keeps the 0110 success-only law: recording sits AFTER finishJob", () => {
    expect(src).toMatch(
      /await finishJob\(job\.id, result\);\s*\n\s*await recordSwapOnSuccess\(job\);\s*\n\s*await recordPlanPoolOnSuccess\(job\);/,
    );
  });
});

describe("vocabulary identity — the mirror stays welded to the provider layer", () => {
  it("isQuotaClassFailure mirrors the provider's quota vocabulary (looksLikeQuota/meterQuotaClass)", () => {
    const provider = readFileSync("src/lib/ai-provider.ts", "utf8");
    // If this pin breaks, the provider's quota vocabulary changed — sync
    // ai-jobs.isQuotaClassFailure in the SAME commit (the mirror law).
    expect(provider).toContain("quota|rate.?limit|credit|insufficient");
  });

  it("the per-minute transient class keeps the provider's wording (groq429PerMinuteClass)", () => {
    const provider = readFileSync("src/lib/ai-provider.ts", "utf8");
    expect(provider).toContain("tokens per minute");
    expect(provider).toContain("try again in");
  });
});
