/**
 * blog-adopt-order.test.ts — the ADOPT FIFO law (BLOG-WEEKLY-COMPENSATION
 * 2026-11-13 §5/§6, owner approval «موافق على تنفيذ الاصلاح»).
 *
 * The review's compound-failure finding: findAdoptablePairRow ordered
 * created_at DESCENDING ("newest-first") and returned the FIRST row
 * alone, so when an orphaned older twin (created Thu 05:00) and a fresh
 * twin (created next Mon 05:00) were BOTH awaiting adoption at the
 * Tuesday 22:00 EN slot, the slot ate the FRESH twin and the older one
 * starved past its 144h window (209h at the following Friday slot) —
 * its Arabic side then published orphaned, with no hreflang twin.
 *
 * The fix under test: ADOPT orders created_at ASCENDING — FIFO. The
 * oldest eligible twin (the one closest to its 144h expiry) is consumed
 * FIRST, which makes twin starvation structurally impossible as long as
 * ANY consumer exists: Tue takes the 137h twin, Fri takes the 113h one,
 * both pairs complete.
 *
 * The supabase double below is a faithful PostgREST read-builder: it
 * captures the .order() direction the source issues and REPLAYS it as a
 * real sort over the seeded rows — exactly what PostgREST does — so the
 * tests prove the QUERY direction and the data[0] SELECTION together
 * (a source that orders DESC returns newest-first from this double and
 * fails here; the tests were RED against the pre-fix source).
 *
 * Contrast pin: findResumableRow / findResumePairCandidate stay
 * NEWEST-first ON PURPOSE (resume wants the freshest pending work) —
 * pinned here so the FIFO flip can never silently spread to them.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── the PostgREST read-builder double (state rides vi.hoisted so the
// vi.mock factory — hoisted above all imports — can close over it) ──
const double = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  queries: [] as Array<{
    table: string;
    column: string | null;
    ascending: boolean | null;
    limit: number | null;
  }>,
}));

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: (table: string) => {
      const captured: {
        table: string;
        column: string | null;
        ascending: boolean | null;
        limit: number | null;
      } = { table, column: null, ascending: null, limit: null };
      double.queries.push(captured);
      const filters: Array<(r: Record<string, unknown>) => boolean> = [];
      const builder: Record<string, unknown> = {};
      const chain = (): Record<string, unknown> => builder;
      builder.select = chain;
      builder.eq = (col: string, val: unknown) => {
        filters.push((r) => r[col] === val);
        return builder;
      };
      builder.not = (col: string, _op: string, val: unknown) => {
        // PostgREST .not(col, "is", null) → col IS NOT null
        filters.push((r) => r[col] !== val);
        return builder;
      };
      builder.is = (col: string, val: unknown) => {
        filters.push((r) => r[col] === val);
        return builder;
      };
      builder.in = (col: string, vals: unknown[]) => {
        filters.push((r) => vals.includes(r[col]));
        return builder;
      };
      builder.gte = (col: string, val: unknown) => {
        filters.push((r) => String(r[col]) >= String(val));
        return builder;
      };
      builder.order = (column: string, opts?: { ascending?: boolean }) => {
        captured.column = column;
        captured.ascending = opts?.ascending ?? false;
        return builder;
      };
      builder.limit = (n: number) => {
        captured.limit = n;
        return builder;
      };
      // The awaited value: apply the filters, then REPLAY the captured
      // order as the real PostgREST sort, then slice to the limit.
      builder.then = (
        onFulfilled: (v: { data: Record<string, unknown>[]; error: null }) => unknown,
        onRejected: (e: unknown) => unknown,
      ) =>
        Promise.resolve()
          .then(() => {
            const filtered = double.rows.filter((r) => filters.every((f) => f(r)));
            if (captured.column === null || captured.ascending === null) {
              return { data: filtered, error: null };
            }
            const col = captured.column;
            const dir = captured.ascending ? 1 : -1;
            const sorted = [...filtered].sort((x, y) => {
              const a = String(x[col]);
              const b = String(y[col]);
              return a < b ? -dir : a > b ? dir : 0;
            });
            const data =
              captured.limit === null ? sorted : sorted.slice(0, captured.limit);
            return { data, error: null };
          })
          .then(onFulfilled, onRejected);
      return builder;
    },
  },
}));

import {
  findAdoptablePairRow,
  findResumableRow,
  findResumePairCandidate,
} from "@/lib/blog-queue";

// ── the review §5 scenario dates (all UTC) ──
const T1B_CREATED = "2026-11-12T05:00:00.000Z"; // pair-2 EN twin, created Thu (week W)
const T2_CREATED = "2026-11-16T05:00:00.000Z"; // pair-3 EN twin, created Mon (week W+1)
const T1B_ID = "aaaaaaaa-0000-4000-8000-00000000000b";
const T2_ID = "aaaaaaaa-0000-4000-8000-000000000002";

/** A MY-language researched twin awaiting adoption (the ADOPT feedstock). */
const researchedTwin = (id: string, pairId: string, created: string) => ({
  id,
  language: "en",
  status: "researched",
  pair_id: pairId,
  created_at: created,
  topic: "an evergreen researched topic long enough",
});

beforeEach(() => {
  double.rows.length = 0;
  double.queries.length = 0;
});

describe("ADOPT FIFO law — the ordering contract (BLOG-WEEKLY-COMPENSATION-FIX)", () => {
  it("findAdoptablePairRow queries created_at ASCENDING (FIFO — oldest eligible first)", async () => {
    double.rows.push(researchedTwin(T2_ID, "pair-3", T2_CREATED));
    await findAdoptablePairRow("en");
    expect(double.queries).toHaveLength(1);
    const q = double.queries[0];
    expect(q.table).toBe("blog_generation_queue");
    expect(q.column).toBe("created_at");
    expect(q.ascending).toBe(true); // RED before the fix (was false)
    expect(q.limit).toBe(5);
  });

  it("with an older 137h twin AND a newer 41h twin both researched, the OLDEST is adopted", async () => {
    // The review §5 compound failure: pair-2's Thu twin (would be 137h at
    // the next Tue slot) waits alongside pair-3's fresh Mon twin (41h).
    // Seed order is deliberately the REVERSE of creation order — the
    // double's replayed sort, not the seed order, decides.
    double.rows.push(
      researchedTwin(T2_ID, "pair-3", T2_CREATED),
      researchedTwin(T1B_ID, "pair-2", T1B_CREATED),
    );
    const adopted = await findAdoptablePairRow("en");
    expect(adopted?.id).toBe(T1B_ID); // RED before the fix (returned T2_ID)
  });

  it("FIFO drains in creation order — no starvation: after the older twin is consumed the next call takes the newer", async () => {
    double.rows.push(
      researchedTwin(T1B_ID, "pair-2", T1B_CREATED),
      researchedTwin(T2_ID, "pair-3", T2_CREATED),
    );
    // Tuesday's slot consumes the older twin — its row leaves
    // `researched` as its own P1 walk starts.
    const first = await findAdoptablePairRow("en");
    expect(first?.id).toBe(T1B_ID);
    const consumed = double.rows.find((r) => r.id === T1B_ID);
    if (consumed) consumed.status = "outlined";
    // The following Friday slot still finds the newer twin — both
    // pairs complete (the starved-to-209h orphan of §5 is impossible).
    const second = await findAdoptablePairRow("en");
    expect(second?.id).toBe(T2_ID);
  });

  it("an empty/degraded feed returns null honestly (no rows, no crash)", async () => {
    expect(await findAdoptablePairRow("en")).toBeNull();
  });

  it("CONTRAST PIN: the RESUME lookups stay NEWEST-first on purpose (the freshest pending work)", async () => {
    double.rows.push(
      researchedTwin(T2_ID, "pair-3", T2_CREATED),
      researchedTwin(T1B_ID, "pair-2", T1B_CREATED),
    );
    // findResumableRow wants the freshest stuck row — newest-first.
    await findResumableRow("en");
    expect(double.queries[0].column).toBe("created_at");
    expect(double.queries[0].ascending).toBe(false);
    // findResumePairCandidate (the RESUME-PAIR path) — newest-first too.
    await findResumePairCandidate("ar");
    expect(double.queries[1].column).toBe("created_at");
    expect(double.queries[1].ascending).toBe(false);
  });
});
