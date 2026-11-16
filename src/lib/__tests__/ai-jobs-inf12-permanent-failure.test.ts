import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * INF-12 canaries (fix order 2026-11-16 — gap-register GAP-2, the measured
 * poison pill from the T1 live frame):
 *
 * THE MEASURED DEFECT (raw/t1/job-3a65f8d1-inf12.md · run 43926112257):
 * the reaper requeued a `processing` row PAST the attempts cap with NO
 * cap comparison, and the claim then granted that row a FOURTH attempt —
 * a collapsed job poisoned the queue forever (every 30-minute reaper
 * cycle resurrected it).
 *
 * THE LAW THESE CANARIES PIN:
 *   · reapStaleJobs is a SPLIT verdict — a stale processing row BELOW
 *     MAX_JOB_ATTEMPTS requeues (historic recovery semantics preserved);
 *     a stale row AT/ABOVE the cap lands `failed` PERMANENTLY with
 *     finished_at set and no re-enqueue path.
 *   · claimQueuedJobs never grants an attempt beyond the cap: a queued
 *     row at cap is finalized as `failed` instead of being claimed (this
 *     also heals legacy poison rows the old reaper created).
 */

type Row = Record<string, unknown>;

interface Chain {
  eq: (k: string, v: unknown) => Chain;
  or: (f: string) => Chain;
  lt: (k: string, v: unknown) => Chain;
  gte: (k: string, v: unknown) => Chain;
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
  const matches = (r: Row, filters: Array<[string, unknown]>): boolean =>
    filters.every(([k, v]) => {
      if (k === "__or") {
        // next_attempt_at IS NULL OR next_attempt_at <= now()
        return r.next_attempt_at == null || Date.parse(String(r.next_attempt_at)) <= Date.now();
      }
      if (k === "__lt") {
        const [col, bound] = v as [string, unknown];
        const rv = r[col];
        if (typeof rv === "number" && typeof bound === "number") return rv < bound;
        if (typeof rv === "string" && typeof bound === "string") return rv < bound;
        return false; // NULL comparisons exclude the row (SQL semantics)
      }
      if (k === "__gte") {
        const [col, bound] = v as [string, unknown];
        const rv = r[col];
        if (typeof rv === "number" && typeof bound === "number") return rv >= bound;
        if (typeof rv === "string" && typeof bound === "string") return rv >= bound;
        return false;
      }
      return r[k] === v;
    });
  const runSelect = (filters: Array<[string, unknown]>) => db.rows.filter((r) => matches(r, filters));
  const runUpdate = (payload: Row, filters: Array<[string, unknown]>) => {
    const row = db.rows.find((r) => matches(r, filters));
    if (!row) return [] as Row[];
    Object.assign(row, payload);
    return [row];
  };
  const makeChain = (mode: "select" | "update", payload: Row, filters: Array<[string, unknown]>): Chain => {
    const chain: Chain = {
      eq: (k, v) => {
        filters.push([k, v]);
        return chain;
      },
      or: (f) => {
        db.orFilters.push(f);
        filters.push(["__or", f]);
        return chain;
      },
      lt: (k, v) => {
        filters.push(["__lt", [k, v]]);
        return chain;
      },
      gte: (k, v) => {
        filters.push(["__gte", [k, v]]);
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

import { claimQueuedJobs, reapStaleJobs, MAX_JOB_ATTEMPTS } from "@/lib/ai-jobs";

beforeEach(() => {
  db.rows = [];
  db.orFilters = [];
});

describe("reapStaleJobs — the INF-12 split verdict (the poison-pill kill)", () => {
  it("a stale processing row AT the cap lands `failed` PERMANENTLY — never requeued (the exact GAP-2 shape)", async () => {
    const stale = new Date(Date.now() - 35 * 60_000).toISOString();
    db.rows = [
      { id: "poison", status: "processing", attempts: MAX_JOB_ATTEMPTS, started_at: stale, error_message: "old chain error" },
    ];
    const outcome = await reapStaleJobs(30);
    expect(outcome).toEqual({ requeued: 0, failedFinal: 1 });
    const row = db.rows[0];
    expect(row.status).toBe("failed");
    expect(row.finished_at).toBeTruthy();
    expect(row.next_attempt_at).toBeNull();
    expect(String(row.error_message)).toContain("INF-12");
    expect(String(row.error_message)).toContain("failed permanently");
  });

  it("a stale processing row ABOVE the cap (the legacy 4th-attempt class) also lands failed — no more attempts, ever", async () => {
    const stale = new Date(Date.now() - 40 * 60_000).toISOString();
    db.rows = [
      { id: "legacy-poison", status: "processing", attempts: MAX_JOB_ATTEMPTS + 1, started_at: stale, error_message: null },
    ];
    const outcome = await reapStaleJobs(30);
    expect(outcome.failedFinal).toBe(1);
    expect(db.rows[0].status).toBe("failed");
  });

  it("a stale processing row BELOW the cap keeps the historic recovery semantics — requeued, no finished_at", async () => {
    const stale = new Date(Date.now() - 35 * 60_000).toISOString();
    db.rows = [
      { id: "recoverable", status: "processing", attempts: 1, started_at: stale, error_message: null },
    ];
    const outcome = await reapStaleJobs(30);
    expect(outcome).toEqual({ requeued: 1, failedFinal: 0 });
    const row = db.rows[0];
    expect(row.status).toBe("queued");
    expect(row.finished_at).toBeUndefined();
    expect(String(row.error_message)).toContain("reaped");
  });

  it("a FRESH processing row (inside the stale window) is untouched by both branches", async () => {
    db.rows = [
      { id: "fresh-processing", status: "processing", attempts: 1, started_at: new Date().toISOString(), error_message: null },
      { id: "fresh-at-cap", status: "processing", attempts: MAX_JOB_ATTEMPTS, started_at: new Date().toISOString(), error_message: null },
    ];
    const outcome = await reapStaleJobs(30);
    expect(outcome).toEqual({ requeued: 0, failedFinal: 0 });
    expect(db.rows.every((r) => r.status === "processing")).toBe(true);
  });

  it("a mixed stale batch routes each row to its own verdict", async () => {
    const stale = new Date(Date.now() - 45 * 60_000).toISOString();
    db.rows = [
      { id: "below-cap", status: "processing", attempts: 2, started_at: stale, error_message: null },
      { id: "at-cap", status: "processing", attempts: MAX_JOB_ATTEMPTS, started_at: stale, error_message: null },
    ];
    const outcome = await reapStaleJobs(30);
    expect(outcome).toEqual({ requeued: 1, failedFinal: 1 });
    expect(db.rows.find((r) => r.id === "below-cap")?.status).toBe("queued");
    expect(db.rows.find((r) => r.id === "at-cap")?.status).toBe("failed");
  });
});

describe("claimQueuedJobs — the INF-12 cap guard (no attempt beyond MAX_JOB_ATTEMPTS)", () => {
  it("a queued row at the cap is FINALIZED as failed, NOT claimed — no 4th attempt (the live evidence's next cycle)", async () => {
    db.rows = [
      { id: "queued-poison", status: "queued", attempts: MAX_JOB_ATTEMPTS, created_at: "2026-11-16T09:00:00Z", next_attempt_at: null, error_message: "boom" },
    ];
    const claimed = await claimQueuedJobs(10);
    expect(claimed).toEqual([]);
    const row = db.rows[0];
    expect(row.status).toBe("failed");
    expect(row.attempts).toBe(MAX_JOB_ATTEMPTS); // NOT incremented
    expect(row.finished_at).toBeTruthy();
    expect(String(row.error_message)).toContain("INF-12");
    expect(String(row.error_message)).toContain("boom"); // prior reason preserved
  });

  it("a queued row BELOW the cap is still claimed and incremented (recovery path intact)", async () => {
    db.rows = [
      { id: "normal", status: "queued", attempts: 1, created_at: "2026-11-16T09:00:00Z", next_attempt_at: null },
    ];
    const claimed = await claimQueuedJobs(10);
    expect(claimed.map((r) => r.id)).toEqual(["normal"]);
    expect(db.rows[0].status).toBe("processing");
    expect(db.rows[0].attempts).toBe(2);
  });

  it("a mixed batch claims the healthy row and finalizes the at-cap one", async () => {
    db.rows = [
      { id: "healthy", status: "queued", attempts: 0, created_at: "2026-11-16T08:00:00Z", next_attempt_at: null },
      { id: "poison", status: "queued", attempts: MAX_JOB_ATTEMPTS, created_at: "2026-11-16T09:00:00Z", next_attempt_at: null },
    ];
    const claimed = await claimQueuedJobs(10);
    expect(claimed.map((r) => r.id)).toEqual(["healthy"]);
    expect(db.rows.find((r) => r.id === "poison")?.status).toBe("failed");
    expect(db.rows.find((r) => r.id === "healthy")?.status).toBe("processing");
  });
});

describe("runner source pins — the INF-12 honest reaper log", () => {
  it("process.mts logs the split verdict (requeued vs failedFinal), never the blind single count", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("scripts/ai-jobs-runner/process.mts", "utf8");
    expect(src).toContain("reaped.failedFinal");
    expect(src).toContain("failed PERMANENTLY (INF-12");
    expect(src).not.toContain("reaped ${reaped} stale");
  });
});
