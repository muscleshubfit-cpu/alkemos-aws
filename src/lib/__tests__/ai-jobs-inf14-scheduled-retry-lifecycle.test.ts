import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * INF-14 / S5-3 walking lifecycle canaries (AI-OPERATIONAL-TEST-PLAN
 * 2026-11-16 · frame 484 — «نفّذ البند التالي» order).
 *
 * The P2-5 file (ai-jobs-p2-5-retry-backoff.test.ts) pins each function
 * in isolation — the classifier, the two windows, the CAS writers, the
 * claimable gate. What it does NOT pin is the INTERLOCK the live S5-3
 * experiment walks end-to-end, the exact shape the audit's measured
 * defect took (a re-burned waiting row inside one 40-minute run):
 *
 *   claim → processor fails (TRANSIENT tail) → failJob stamps +3:00 →
 *   claimQueuedJobs while the gate is CLOSED sees NOTHING and touches
 *   NOTHING (attempts / started_at / next_attempt_at byte-identical) →
 *   gate opens → claim granted (attempt 2) → … → cap → failed with the
 *   gate cleared.
 *
 * Plus the item's success criterion verbatim — «نافذتان مميزتان
 * بالقاعدة» (two distinct windows in the DB): a transient-gated row
 * (+3:00) and a quota-gated row (+30:00) in the SAME candidate set, the
 * claim seeing neither while both are closed, only the transient one
 * after 3:01, and both after 30:01.
 *
 * The live evidence (docs/ai-operational-tests-2026-11-16/raw/t5/
 * s5-3-scheduled-retry-inf14.md) ran this exact walk against the
 * production worker and rows; these canaries make the sequence
 * deterministic so a regression anywhere in the interlock fails the
 * battery even when no natural failure occurs in any given window.
 */

type Row = Record<string, unknown>;

interface Chain {
  eq: (k: string, v: unknown) => Chain;
  or: (f: string) => Chain;
  order: () => Chain;
  limit: () => Chain;
  select: () => Chain;
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
        // The INF-14 claimable gate, implemented semantically exactly as
        // PostgREST reads it: next_attempt_at IS NULL OR <= now().
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
  const makeChain = (
    mode: "select" | "update",
    payload: Row,
    filters: Array<[string, unknown]>,
  ): Chain => {
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
  failJob,
  AI_RETRY_BACKOFF_MS,
  AI_RETRY_BACKOFF_COOLDOWN_MS,
  MAX_JOB_ATTEMPTS,
} from "@/lib/ai-jobs";

/**
 * The byte-real aggregated chain error the production failJob received on
 * 2026-11-16T18:12:23Z (worker run 43926112257, job 3a65f8d1 — the
 * documented 429-TPD daily-bucket exhaustion): config lines, the
 * always-present cooldown preamble, then two error lines with the groq
 * 429-TPD tail LAST. The classifier must read that terminal line and
 * stamp the 30-minute window — NOT the 3-minute one the old regex's
 * preamble over-match would have paid.
 */
const REAL_QUOTA_CHAIN_MESSAGE =
  "[ai-fallback-chain] All AI providers failed. (system: ai-job:paraphrase)\n" +
  "OpenRouter keys configured: 2.\nGroq key: present.\nNVIDIA key: present.\n" +
  "Gemini key: present.\nCloudflare config: present (token+account).\n" +
  "Active quota-cooldowns: chain:groq until 2026-11-16T18:42:23.241Z\n" +
  "Errors:\n" +
  "  - openrouter/nvidia/nemotron-3-ultra-550b-a55b:free: This operation was aborted\n" +
  '  - groq/openai/gpt-oss-120b: AI API error 429 from groq: {"error":{"message":"Rate limit reached for model `openai/gpt-oss-120b` in organization `org_01kz0ywxa5f9ctgnjk3gq3edfw` service tier `on_demand` on tokens per day (TPD): Limit 200000, Used 199851, Requested 797. Please try again in 4m39.936s. Need more tokens? Upgrade to Dev Tier today at https://console.groq.com/settings/billing","type":"tokens","code":"rate_limit_exceeded"}}';

/** The exact transient-class terminal message the live probe produced
 * (an unknown-tool validation tail — no provider call, no quota vocab). */
const REAL_TRANSIENT_MESSAGE = "unknown article_tool: inf14_probe_transient";

function makeRow(over: Partial<Row>): Row {
  return {
    id: crypto.randomUUID(),
    job_type: "article_tool",
    status: "queued",
    payload: {},
    requested_by: "qa-member-adult-test-account",
    attempts: 0,
    created_at: new Date().toISOString(),
    started_at: null,
    finished_at: null,
    next_attempt_at: null,
    error_message: null,
    ...over,
  };
}

/** Snapshot the fields the failure mode would burn. */
function gateState(row: Row) {
  return {
    status: row.status,
    attempts: row.attempts,
    started_at: row.started_at,
    next_attempt_at: row.next_attempt_at,
  };
}

beforeEach(() => {
  db.rows = [];
  db.orFilters = [];
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("INF-14 / S5-3 — the walking lifecycle (the live experiment, deterministic)", () => {
  it("claim → transient fail stamps +3:00 → a claim WHILE the gate is closed sees and touches NOTHING → the opened gate grants attempt 2 → the cap finalizes with the gate cleared", async () => {
    const row = makeRow({});
    db.rows = [row];

    // 1. The claim (gate NULL — freshly enqueued).
    let claimed = await claimQueuedJobs(5);
    expect(claimed).toHaveLength(1);
    expect(claimed[0].attempts).toBe(1);
    expect(claimed[0].status).toBe("processing");
    expect(claimed[0].next_attempt_at).toBeNull(); // gate cleared on claim

    // 2. The processor fails with the real transient tail → failJob stamps +3:00.
    const failedAt = Date.now();
    const outcome = await failJob(row.id as string, 1, REAL_TRANSIENT_MESSAGE);
    expect(outcome).toEqual({ outcome: "requeued", nextAttemptAt: (row.next_attempt_at as string) });
    const gate = Date.parse(String(row.next_attempt_at));
    expect(gate - failedAt).toBeGreaterThanOrEqual(AI_RETRY_BACKOFF_MS - 5_000);
    expect(gate - failedAt).toBeLessThanOrEqual(AI_RETRY_BACKOFF_MS + 5_000);
    expect(row.status).toBe("queued");
    expect(row.error_message).toBe(REAL_TRANSIENT_MESSAGE);

    // 3. THE MEASURED DEFECT, pinned as impossible: while the gate is
    //    closed, claimQueuedJobs returns NOTHING and the waiting row is
    //    byte-identical (no re-burn inside the same run window).
    const before = gateState(row);
    expect(await claimQueuedJobs(5)).toHaveLength(0);
    expect(await claimQueuedJobs(5)).toHaveLength(0); // twice — same result
    expect(gateState(row)).toEqual(before);

    // 4. The gate opens → the claim is granted, the gate resets, attempt 2.
    vi.setSystemTime(new Date(gate + 1_000));
    claimed = await claimQueuedJobs(5);
    expect(claimed).toHaveLength(1);
    expect(claimed[0].attempts).toBe(2);
    expect(claimed[0].status).toBe("processing");
    expect(row.next_attempt_at).toBeNull();

    // 5. Attempt 2 fails the same way → a fresh +3:00 gate.
    const outcome2 = await failJob(row.id as string, 2, REAL_TRANSIENT_MESSAGE);
    expect(outcome2.outcome).toBe("requeued");

    // 6. The cap: attempt 3 fails → PERMANENT failure, gate cleared for good.
    vi.setSystemTime(new Date(Date.parse(String(row.next_attempt_at)) + 1_000));
    claimed = await claimQueuedJobs(5);
    expect(claimed).toHaveLength(1);
    expect(claimed[0].attempts).toBe(MAX_JOB_ATTEMPTS);
    const outcome3 = await failJob(row.id as string, MAX_JOB_ATTEMPTS, REAL_TRANSIENT_MESSAGE);
    expect(outcome3).toEqual({ outcome: "failed" });
    expect(row.status).toBe("failed");
    expect(row.next_attempt_at).toBeNull();
    expect(typeof row.finished_at).toBe("string");
  });

  it("the two windows are DISTINCT in the same queue — «نافذتان مميزتان بالقاعدة»: transient +3:00 and quota +30:00 stamped by the real classifier, each opening on its own clock", async () => {
    const transientRow = makeRow({ id: "transient-row" });
    const quotaRow = makeRow({ id: "quota-row" });
    db.rows = [transientRow, quotaRow];

    // Both rows were claimed (two parallel workers), both failed — one
    // with the real transient tail, one with the real 429-TPD chain tail.
    await claimQueuedJobs(5); // claims BOTH (gates NULL)
    expect(transientRow.status).toBe("processing");
    expect(quotaRow.status).toBe("processing");
    const at = Date.now();
    await failJob("transient-row", 1, REAL_TRANSIENT_MESSAGE);
    await failJob("quota-row", 1, REAL_QUOTA_CHAIN_MESSAGE);

    // The two stamped gates are the two DISTINCT windows of the item.
    const transientGate = Date.parse(String(transientRow.next_attempt_at));
    const quotaGate = Date.parse(String(quotaRow.next_attempt_at));
    expect(transientGate - at).toBeGreaterThanOrEqual(AI_RETRY_BACKOFF_MS - 5_000);
    expect(transientGate - at).toBeLessThanOrEqual(AI_RETRY_BACKOFF_MS + 5_000);
    expect(quotaGate - at).toBeGreaterThanOrEqual(AI_RETRY_BACKOFF_COOLDOWN_MS - 5_000);
    expect(quotaGate - at).toBeLessThanOrEqual(AI_RETRY_BACKOFF_COOLDOWN_MS + 5_000);
    expect(quotaGate - transientGate).toBeGreaterThanOrEqual(
      AI_RETRY_BACKOFF_COOLDOWN_MS - AI_RETRY_BACKOFF_MS - 10_000,
    );

    // While BOTH gates are closed: the claim sees neither.
    expect(await claimQueuedJobs(5)).toHaveLength(0);

    // After 3:01 — only the transient row is claimable; the quota row
    // stays invisible and untouched.
    vi.setSystemTime(new Date(at + AI_RETRY_BACKOFF_MS + 1_000));
    const claimed = await claimQueuedJobs(5);
    expect(claimed.map((r) => r.id)).toEqual(["transient-row"]);
    expect(quotaRow.status).toBe("queued");
    expect(quotaRow.attempts).toBe(1);
    expect(Date.parse(String(quotaRow.next_attempt_at))).toBe(quotaGate);

    // After 30:01 — the quota row's own gate opens too.
    vi.setSystemTime(new Date(at + AI_RETRY_BACKOFF_COOLDOWN_MS + 1_000));
    const claimedLate = await claimQueuedJobs(5);
    expect(claimedLate.map((r) => r.id)).toEqual(["quota-row"]);
    expect(quotaRow.attempts).toBe(2);
  });

  it("claiming one row never clears ANOTHER row's gate (partial-claim isolation)", async () => {
    const openRow = makeRow({ id: "open-row" });
    const gatedRow = makeRow({
      id: "gated-row",
      status: "queued",
      attempts: 1,
      next_attempt_at: new Date(Date.now() + AI_RETRY_BACKOFF_COOLDOWN_MS).toISOString(),
    });
    db.rows = [openRow, gatedRow];

    const claimed = await claimQueuedJobs(1); // limit 1 — only the open row
    expect(claimed.map((r) => r.id)).toEqual(["open-row"]);
    expect(gatedRow.next_attempt_at).toBeTypeOf("string"); // gate INTACT
    expect(gatedRow.attempts).toBe(1);
    expect(gatedRow.status).toBe("queued");
    expect(gatedRow.started_at).toBeNull();
  });
});

describe("INF-14 — the live message shapes weld to the two windows (S5-3 evidence, pinned)", () => {
  it("the live transient tail (unknown article_tool from the QA probe) and the live 429-TPD tail (run 43926112257) land on DIFFERENT windows through the same failJob writer", async () => {
    const transientRow = makeRow({ id: "t" });
    const quotaRow = makeRow({ id: "q" });
    db.rows = [transientRow, quotaRow];
    await claimQueuedJobs(5);
    const at = Date.now();
    await failJob("t", 1, REAL_TRANSIENT_MESSAGE);
    await failJob("q", 1, REAL_QUOTA_CHAIN_MESSAGE);
    const dTransient =
      Date.parse(String(transientRow.next_attempt_at)) - at;
    const dQuota = Date.parse(String(quotaRow.next_attempt_at)) - at;
    // The real transient tail: the 3-minute window.
    expect(dTransient).toBeGreaterThanOrEqual(AI_RETRY_BACKOFF_MS - 5_000);
    expect(dTransient).toBeLessThanOrEqual(AI_RETRY_BACKOFF_MS + 5_000);
    // The real 429-TPD daily-bucket tail (quota class — the "try again in
    // 4m39.936s" wording is a DAILY bucket hint, not a per-minute one):
    // the 30-minute provider-cooldown-aligned window.
    expect(dQuota).toBeGreaterThanOrEqual(AI_RETRY_BACKOFF_COOLDOWN_MS - 5_000);
    expect(dQuota).toBeLessThanOrEqual(AI_RETRY_BACKOFF_COOLDOWN_MS + 5_000);
  });
});

describe("INF-15 (S5-3 monitoring) — a late failJob over a row that changed state underneath", () => {
  it("reports lost and never overwrites the row's own state (the reaper's requeue governs)", async () => {
    const row = makeRow({ id: "late", status: "processing", attempts: 1 });
    db.rows = [row];

    // The reaper requeued the row underneath the still-running attempt.
    row.status = "queued";
    row.error_message = "reaped: processing exceeded time limit — auto-retried";

    const outcome = await failJob("late", 1, REAL_TRANSIENT_MESSAGE);
    expect(outcome).toEqual({ outcome: "lost" });
    // The row keeps the reaper's state — no blind overwrite, no gate
    // stamped over the recovery semantics.
    expect(row.status).toBe("queued");
    expect(row.error_message).toBe(
      "reaped: processing exceeded time limit — auto-retried",
    );
    expect(row.next_attempt_at).toBeNull();
  });
});
