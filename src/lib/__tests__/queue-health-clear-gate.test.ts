import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * CLEARABLE-SCOPE GATE (2026-10-30, owner order «زر «مسح التنبيه» يعرض «تم
 * مسح 0 مهمة فاشلة من السجل» بينما يظل التنبيه الأحمر القديم ظاهرًا (0/6،
 * وpair_id (0%))»): the queue-health strip mixes two fundamentally different
 * alert classes, and the old UI offered ONE dismissal for both:
 *
 *   • CLEARABLE — failed `ai_jobs` rows (transient diagnostics): the DELETE
 *     verb really removes exactly these records, and the «N مهمة فاشلت
 *     نهائيًا» issue disappears on the next probe.
 *   • LIVE — pairing adoption / research fallback / stuck-queue / stale
 *     runner: conditions computed from REAL pipeline rows on every GET.
 *     No record-deletion can honestly resolve them (deleting the measured
 *     rows would destroy published-article history), so they must never be
 *     offered a dismissal — they clear when their cause is fixed.
 *
 * ROOT CAUSE this canary pins as CLOSED: the button rendered for ANY !ok
 * state while DELETE only touches ai_jobs failed rows — with 0 failed rows
 * (measured live: process-ai-jobs 40904025148 = done=0 failedPermanent=0)
 * and a REAL pairing condition (0/6 rows carry pair_id in the 7-day window),
 * the button cleared 0 records, toasted a dishonest «تم مسح 0 ✅», and the
 * red strip correctly stayed. The fix: the GET response carries an explicit
 * `clearableFailedJobs` contract; the UI shows the clear button ONLY when
 * it is > 0 and shows an honest live-state note otherwise.
 *
 * Layers:
 *   1. ROUTE BEHAVIOR (scripted supabase, the blog-repair-r5-observability
 *      harness shape): the two owner-mandated cases — clearable records
 *      present (DELETE removes exactly them) and absent (the user's exact
 *      0/6 pairing state: nothing clearable, zero delete verbs issued) —
 *      plus the alert-stays-honest law (issues are never suppressed).
 *   2. SOURCE PINS (BlogAdminView.tsx): the button is gated on
 *      clearableFailedJobs, the live-state note replaces the dead button,
 *      and the «cleared 0» fake-success toast is extinct.
 */

// ── queue-health route auth: bypassed (authRequired=false) ──
vi.mock("@/lib/auth-server", () => ({
  authRequired: false,
  requireAdmin: vi.fn(async () => null),
}));

// ── scripted supabase admin ──────────────────────────────────────────
// Selects key on (table, projection); the DELETE verb's `.in()` payload is
// captured for assertions so tests can prove EXACTLY which records the
// dismissal touched (and that it touched nothing when nothing is clearable).
type Row = Record<string, unknown>;
let SCRIPTED: Record<string, { rows: Row[]; error?: string | null }> = {};
const DELETE_CALLS: Array<{ table: string; ids: unknown[] }> = [];

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      let projection = "";
      const step = () => {
        const entry = SCRIPTED[`${table}|${projection}`] ?? { rows: [], error: null };
        return {
          select: (p: string) => {
            projection = p;
            return step();
          },
          eq: () => step(),
          gte: () => step(),
          like: () => step(),
          order: () => step(),
          limit: () => Promise.resolve({ data: entry.rows, error: entry.error ?? null }),
          delete: () => ({
            in: (_col: string, ids: unknown[]) => {
              DELETE_CALLS.push({ table, ids });
              return Promise.resolve({ error: null });
            },
          }),
        };
      };
      return step();
    }),
  },
}));

import { GET as queueHealthGET, DELETE as queueHealthDELETE } from "@/app/api/ai/queue-health/route";

const REQ = { url: "http://localhost:3000/api/ai/queue-health" } as unknown as NextRequest;

/** program the GET route's scans: ai_jobs census + clean blog scans */
function scans(aiJobsRows: Row[], pairingRows: Row[] = [], fallbackRows: Row[] = []) {
  SCRIPTED["ai_jobs|status, job_type, created_at, finished_at"] = { rows: aiJobsRows };
  SCRIPTED["blog_generation_queue|language, pair_id"] = { rows: pairingRows };
  SCRIPTED["blog_generation_queue|language, created_at"] = { rows: fallbackRows };
  SCRIPTED["blog_generation_queue|article_bundle"] = { rows: [] };
  SCRIPTED["blog_generation_queue|status, article_bundle"] = { rows: [] };
}

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  SCRIPTED = {};
  DELETE_CALLS.length = 0;
  delete process.env.GITHUB_DISPATCH_TOKEN;
});

// ═══════════════════════════════════════════════════════════════
// ROUTE — GET: the clearableFailedJobs contract
// ═══════════════════════════════════════════════════════════════

describe("queue-health clearable-scope — GET contract", () => {
  it("failed ai_jobs rows → clearableFailedJobs counts them + the failed-jobs issue fires", async () => {
    scans([
      { status: "failed", job_type: "plan_nutrition", created_at: minsAgo(90), finished_at: minsAgo(80) },
      { status: "failed", job_type: "article_generate", created_at: minsAgo(70), finished_at: minsAgo(60) },
      { status: "done", job_type: "plan_workout", created_at: minsAgo(50), finished_at: minsAgo(40) },
      { status: "done", job_type: "plan_workout", created_at: minsAgo(30), finished_at: minsAgo(20) },
    ]);
    const res = await queueHealthGET(REQ);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.counts.failed).toBe(2);
    expect(body.clearableFailedJobs).toBe(2);
    expect(body.ok).toBe(false);
    expect(body.issues.some((i: string) => i.includes("2 مهمة فشلت نهائيًا"))).toBe(true);
  });

  it("the user's exact state (0 failed · 0/6 pairing) → clearableFailedJobs=0, pairing issue stays honest", async () => {
    // ai_jobs: no failed rows (measured live 2026-10-29: done=0 failedPermanent=0)
    scans(
      [
        { status: "done", job_type: "article_generate", created_at: minsAgo(200), finished_at: minsAgo(180) },
        { status: "processing", job_type: "plan_nutrition", created_at: minsAgo(10), finished_at: null },
      ],
      // 6 unpaired generation rows in the 7-day window → 0/6 (0%)
      Array.from({ length: 6 }, (_, i) => ({ language: i % 2 ? "en" : "ar", pair_id: null })),
    );
    const res = await queueHealthGET(REQ);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.counts.failed).toBe(0);
    expect(body.clearableFailedJobs).toBe(0);
    expect(body.ok).toBe(false);
    // The alert is NOT hidden and NOT cosmetically zeroed — it states the
    // measured truth (0/6 rows, pair_id 0%).
    expect(body.issues.some((i: string) => i.includes("0/6") && i.includes("pair_id (0%)"))).toBe(true);
  });

  it("clean state → ok=true, clearableFailedJobs=0, no issues", async () => {
    scans([
      { status: "done", job_type: "article_generate", created_at: minsAgo(60), finished_at: minsAgo(50) },
    ]);
    const res = await queueHealthGET(REQ);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.clearableFailedJobs).toBe(0);
    expect(body.issues).toEqual([]);
  });

  it("a live pairing condition with failed rows TOO → both issues report, clearableFailedJobs counts only the clearable class", async () => {
    scans(
      [
        { status: "failed", job_type: "plan_workout", created_at: minsAgo(300), finished_at: minsAgo(290) },
        { status: "done", job_type: "plan_workout", created_at: minsAgo(60), finished_at: minsAgo(50) },
      ],
      Array.from({ length: 8 }, (_, i) => ({ language: i % 2 ? "en" : "ar", pair_id: null })),
    );
    const res = await queueHealthGET(REQ);
    const body = await res.json();
    expect(body.clearableFailedJobs).toBe(1);
    expect(body.issues.some((i: string) => i.includes("1 مهمة فشلت نهائيًا"))).toBe(true);
    expect(body.issues.some((i: string) => i.includes("0/8") && i.includes("pair_id (0%)"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// ROUTE — DELETE: scope is EXACTLY the failed ai_jobs rows
// ═══════════════════════════════════════════════════════════════

describe("queue-health clearable-scope — DELETE behavior", () => {
  it("case: clearable records exist → deletes exactly the failed rows' ids", async () => {
    SCRIPTED["ai_jobs|id"] = {
      rows: [{ id: "job-failed-1" }, { id: "job-failed-2" }, { id: "job-failed-3" }],
    };
    const res = await queueHealthDELETE(REQ);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.deleted).toBe(3);
    // ONE delete verb, exactly the selected failed ids, ai_jobs only.
    expect(DELETE_CALLS).toEqual([
      { table: "ai_jobs", ids: ["job-failed-1", "job-failed-2", "job-failed-3"] },
    ]);
  });

  it("case: nothing clearable (the user's state) → deleted=0 and ZERO delete verbs issued", async () => {
    SCRIPTED["ai_jobs|id"] = { rows: [] };
    const res = await queueHealthDELETE(REQ);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.deleted).toBe(0);
    // The honest core of the fix: no records were touched at all — a live
    // pairing/fallback condition is never "cleared" by deleting anything.
    expect(DELETE_CALLS).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// SOURCE PINS — BlogAdminView.tsx (the strip's honest contract)
// ═══════════════════════════════════════════════════════════════

const repoRoot = resolve(__dirname, "../../..");
const viewSrc = () =>
  readFileSync(resolve(repoRoot, "src/components/views/BlogAdminView.tsx"), "utf8");

describe("BlogAdminView source pins — the dismissal is scoped and honest", () => {
  it("the health state type carries the clearableFailedJobs contract", () => {
    expect(viewSrc()).toContain("clearableFailedJobs?: number");
  });

  it("the clear button renders ONLY when clearable records exist (the gate literal)", () => {
    const s = viewSrc();
    expect(s).toContain("(qHealth.clearableFailedJobs ?? 0) > 0 ?");
    // The old unconditional dismissal is extinct.
    expect(s).not.toContain('isAr ? "🗑 مسح التنبيه" : "🗑 Dismiss"');
  });

  it("a live-state alert shows the honest note instead of a dead button — both languages", () => {
    const s = viewSrc();
    expect(s).toContain("تنبيه حالة حية يُحسب من البيانات الفعلية — يختفي تلقائيًا متى زال سببه");
    expect(s).toContain("Live-state alert computed from real data — it clears automatically once its cause is resolved");
  });

  it("the dishonest «cleared 0 ✅» success toast is extinct — 0 deleted reads as a neutral info", () => {
    const s = viewSrc();
    // Old template (success toast built straight from data.deleted, 0 included):
    expect(s).not.toMatch(/تم مسح \$\{data\?\.deleted[^\n]*من السجل/);
    // New contract: success only when deleted > 0, else an honest info toast.
    expect(s).toContain("const deleted = typeof data?.deleted === \"number\" ? data.deleted : 0;");
    expect(s).toContain("if (deleted > 0) {");
    expect(s).toContain("لا توجد سجلات مهام فاشلة للمسح");
  });

  it("the button label scopes to failed-job RECORDS (not a blanket «clear the alert»)", () => {
    const s = viewSrc();
    expect(s).toContain("مسح سجلات المهام الفاشلة");
    expect(s).toContain("Clear failed-job records");
  });

  it("the strip re-probes after a clear (UI reflects the true post-clear state)", () => {
    const s = viewSrc();
    expect(s).toMatch(/const h = await fetch\("\/api\/ai\/queue-health"\);\s*\n\s*if \(h\.ok\) setQHealth\(await h\.json\(\)\)/);
  });
});
