import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * INF-13 canaries (AI-OPERATIONAL-TEST-PLAN 2026-11-16, T5/S5-5 — the
 * idempotent-materialization experiment frame, owner order 2026-11-18
 * «نفّذ البند التالي»).
 *
 * THE MEASURED DEFECT CLASS (audit AI-GENERATION-PIPELINES 2026-11-15,
 * P1 bucket 7): a processor SUCCESS followed by a finishJob FAILURE
 * requeues the job — and the re-run used to insert a SECOND `plans`
 * draft row for the same member (the measured duplicate-draft class).
 * Fix 2c8b1f48 stamps the claiming job's id on the row (`plans.job_id`,
 * migration 0112 + partial UNIQUE index) and the materializer returns an
 * already-materialized row AS-IS — the re-run is a NAMED no-op
 * («[plan job] INF-13 idempotent skip: …»).
 *
 * WHY THIS FILE: the pre-existing coverage (plan-jobs.test.ts) pins only
 * the BROWSER localStorage registry — the server-side materialization
 * law had zero processor-level canaries. These pin, at the real
 * PROCESSORS surface (the same entry the GHA runner calls):
 *   1. the named no-op — an already-materialized job returns the SAME
 *      row id and inserts NOTHING;
 *   2. the S5-5 root scenario — success → requeue → RE-RUN inserts no
 *      second draft (stateful: both passes share the job id);
 *   3. fresh materialization STAMPS job_id (the structural key) and the
 *      self-service row lands approved+current (the live a2fc0c91 shape);
 *   4. legacy ctx (no jobId) keeps the legacy insert path — no job_id
 *      lookup, no stamp (browser-fallback / pre-0112 jobs);
 *   5. a lookup error degrades HONESTLY to the legacy insert (the
 *      column-not-yet-applied / transient catch path) — never a
 *      duplicate, never a swallowed job.
 */

const dbState = vi.hoisted(() => {
  const state = {
    /** rows "in" the plans table — the job_id-keyed materialized drafts. */
    rowsByJobId: new Map<string, { id: string }>(),
    /** every insert payload the materializer issued. */
    inserts: [] as Array<Record<string, unknown>>,
    /** job_id-keyed lookups the materializer performed. */
    jobIdLookups: [] as Array<string | null>,
    /** force the job_id lookup to throw (the transient/catch path). */
    lookupThrows: false,
    insertSeq: 0,
  };
  return { state };
});

vi.mock("@/lib/plan-generator", () => ({
  // Controlled generator: the real engine's contract is pinned elsewhere
  // (regen-rootcause2*.test.ts) — here we only need a clean SUCCESS whose
  // content carries no review-hold flags (self-service lands approved).
  generateNutritionPlanAI: vi.fn(async () => ({
    title: "خطة تغذية - عميل اختبار INF-13",
    source: "local-fallback",
    content: {
      overview: "خطة اختبار INF-13",
      daily_calories: 2000,
      macros: { protein_g: 150, carbs_g: 200, fat_g: 60 },
      meals: [
        {
          name: "الفطار",
          items: [{ food: "بيض مسلوق", amount: "150 جم", calories: 294, protein_g: 20.4 }],
          total_calories: 294,
        },
      ],
      generation: { qualityTier: "tail", model: "canary-model", provider: "canary" },
    },
  })),
  generateWorkoutPlanAI: vi.fn(async () => ({})),
  regenerateMeal: vi.fn(async () => ({})),
  regenerateFoodItem: vi.fn(async () => ({})),
  regenerateWorkoutDay: vi.fn(async () => ({})),
  substituteExercise: vi.fn(async () => ({})),
}));

vi.mock("@/lib/evo-nutrition-knowledge.server", () => ({
  loadEvoNutritionKnowledge: vi.fn(async () => ({ knowledgeBlock: "" })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: (table: string) => {
      if (table !== "plans") {
        throw new Error(`unexpected table ${table}`);
      }
      // NUT-10 platform-avoid probe: select("content") chain — returns an
      // empty page (no platform avoid names; best-effort contract).
      const avoidChain = {
        eq: () => avoidChain,
        order: () => avoidChain,
        limit: () => avoidChain,
        then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
      };
      // INF-13 lookup chain: select("id").eq("job_id", id).limit(1)
      // .maybeSingle() — reads the stateful rows-by-job map.
      const makeLookupChain = (jobId: string | null) => {
        const chain = {
          eq: (col: string, val: unknown) =>
            col === "job_id" ? makeLookupChain(String(val)) : chain,
          limit: () => chain,
          maybeSingle: async () => {
            if (dbState.state.lookupThrows) {
              throw new Error("simulated transient lookup failure (column not applied?)");
            }
            const row = jobId ? dbState.state.rowsByJobId.get(jobId) ?? null : null;
            return { data: row, error: null };
          },
        };
        return chain;
      };
      const selectChain = {
        eq: (col: string, val: unknown) => {
          if (col === "job_id") return makeLookupChain(String(val));
          return selectChain;
        },
        limit: () => selectChain,
        maybeSingle: async () => ({ data: null, error: null }),
      };
      const insertChain = {
        select: () => ({
          single: async () => ({ data: { id: dbState.state.insertSeq }, error: null }),
        }),
      };
      return {
        select: (cols: string) => {
          if (cols === "content") return avoidChain;
          if (cols === "id") {
            const wrapped = {
              eq: (col: string, val: unknown) => {
                if (col === "job_id") {
                  const jobId = String(val);
                  dbState.state.jobIdLookups.push(jobId);
                  return makeLookupChain(jobId);
                }
                return wrapped;
              },
              limit: () => wrapped,
              maybeSingle: async () => ({ data: null, error: null }),
            };
            return wrapped;
          }
          return selectChain;
        },
        insert: (payload: Record<string, unknown>) => {
          dbState.state.inserts.push(payload);
          dbState.state.insertSeq += 1;
          const id = `plan-row-${dbState.state.insertSeq}`;
          if (typeof payload.job_id === "string") {
            dbState.state.rowsByJobId.set(payload.job_id, { id });
          }
          return {
            select: () => ({
              single: async () => ({ data: { id }, error: null }),
            }),
          };
        },
      };
    },
  },
}));

import { PROCESSORS } from "@/lib/ai-job-processors";

const CLIENT_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const JOB_ID = "fb82bc7d-51f4-48e2-96bd-e268502334f8"; // the live S5-5 row shape
const EXISTING_ROW_ID = "plan-row-1";

const payload = (extra: Record<string, unknown> = {}) => ({
  clientId: CLIENT_ID,
  selfService: true,
  clientContext: {
    name: "QA member (alkemos-test)",
    nutrition: {
      age: 30,
      diet: "متوازن",
      meals: 4,
      water: 3,
      gender: "male",
      height: 178,
      weight: 85,
      medical: "",
      allergies: "",
      target_weight: 78,
    },
    fitness: {},
    recent_plan_names: [],
    recent_measurements: [],
  },
  ...extra,
});

describe("INF-13 — idempotent plan-draft materialization (server-side, processor level)", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dbState.state.rowsByJobId.clear();
    dbState.state.inserts.length = 0;
    dbState.state.jobIdLookups.length = 0;
    dbState.state.lookupThrows = false;
    dbState.state.insertSeq = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("1) the named no-op: an already-materialized job returns the SAME row id and inserts NOTHING", async () => {
    dbState.state.rowsByJobId.set(JOB_ID, { id: EXISTING_ROW_ID });

    const result = await PROCESSORS.plan_nutrition(payload(), { jobId: JOB_ID, requestedBy: null });

    // the re-run is a no-op: zero inserts, the existing row returned as-is
    expect(dbState.state.inserts).toHaveLength(0);
    expect(result.plan_id).toBe(EXISTING_ROW_ID);
    expect(result.materialized).toBe(true);
    // the no-op is NAMED (the plan's «no-op مسمًّى» requirement)
    const named = logSpy.mock.calls.map((c) => String(c[0])).find((m) => m.includes("INF-13 idempotent skip"));
    expect(named).toContain(`plans#${EXISTING_ROW_ID} already materialized for job ${JOB_ID.slice(0, 8)}`);
    // the lookup went through the job_id key — the structural idempotency key
    expect(dbState.state.jobIdLookups).toEqual([JOB_ID]);
  });

  it("2) the S5-5 root scenario: success → finishJob failure → requeue → RE-RUN inserts NO second draft", async () => {
    // PASS 1 — the original processing: fresh job, row materializes once.
    const first = await PROCESSORS.plan_nutrition(payload(), { jobId: JOB_ID, requestedBy: null });
    expect(dbState.state.inserts).toHaveLength(1);
    expect(first.plan_id).toBe("plan-row-1");
    expect(dbState.state.inserts[0].job_id).toBe(JOB_ID);

    // (the queue requeues the row — finishJob failed after processor
    // success; the SAME job id is claimed again)

    // PASS 2 — the re-run: the job_id lookup now finds the row → skip.
    const second = await PROCESSORS.plan_nutrition(payload(), { jobId: JOB_ID, requestedBy: null });

    // ONE row across both passes — zero duplicate drafts (the S5-5 verdict)
    expect(dbState.state.inserts).toHaveLength(1);
    expect(second.plan_id).toBe("plan-row-1");
    expect(second.materialized).toBe(true);
    // the skip line fired exactly once (pass 2), never on pass 1
    const skipLines = logSpy.mock.calls
      .map((c) => String(c[0]))
      .filter((m) => m.includes("INF-13 idempotent skip"));
    expect(skipLines).toHaveLength(1);
    expect(skipLines[0]).toContain("plan-row-1");
  });

  it("3) fresh materialization STAMPS job_id (the structural key) and self-service lands approved+current", async () => {
    const result = await PROCESSORS.plan_nutrition(payload(), { jobId: JOB_ID, requestedBy: null });

    expect(dbState.state.inserts).toHaveLength(1);
    const row = dbState.state.inserts[0];
    expect(row.job_id).toBe(JOB_ID); // the idempotency key is on the row
    expect(row.client_id).toBe(CLIENT_ID);
    expect(row.type).toBe("meal");
    // the live a2fc0c91 shape: member self-service lands approved+current
    expect(row.status).toBe("approved");
    expect(row.is_current).toBe(true);
    expect(typeof row.approved_at).toBe("string");
    expect(result.materialized).toBe(true);
  });

  it("4) legacy ctx (no jobId) keeps the legacy insert path — no job_id lookup, no stamp", async () => {
    // pre-0112 jobs / browser-fallback calls pass no jobId
    const result = await PROCESSORS.plan_nutrition(payload(), { requestedBy: null });

    expect(dbState.state.jobIdLookups).toEqual([]); // no job_id key consulted
    expect(dbState.state.inserts).toHaveLength(1);
    expect(dbState.state.inserts[0].job_id).toBeUndefined(); // nothing stamped
    expect(result.materialized).toBe(true);
    // and a NON-UUID jobId is ignored just the same (guards the key shape)
    const bogus = await PROCESSORS.plan_nutrition(payload(), { jobId: "not-a-uuid", requestedBy: null });
    expect(dbState.state.jobIdLookups).toEqual([]);
    expect(dbState.state.inserts).toHaveLength(2);
    expect(dbState.state.inserts[1].job_id).toBeUndefined();
    expect(bogus.materialized).toBe(true);
  });

  it("5) a job_id lookup error degrades HONESTLY to the legacy insert (never a swallowed job)", async () => {
    dbState.state.lookupThrows = true; // transient / column-not-yet-applied

    const result = await PROCESSORS.plan_nutrition(payload(), { jobId: JOB_ID, requestedBy: null });

    // the catch path: lookup failed → the legacy insert still materializes
    expect(dbState.state.jobIdLookups).toEqual([JOB_ID]);
    expect(dbState.state.inserts).toHaveLength(1);
    expect(result.plan_id).toBe("plan-row-1");
    expect(result.materialized).toBe(true);
    // no duplicate either: the failed lookup inserted exactly once
    expect(dbState.state.rowsByJobId.size).toBe(1);
  });
});
