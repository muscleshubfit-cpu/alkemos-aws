/**
 * blog-weekly-cadence.test.ts — WEEKLY CADENCE laws (owner order
 * 2026-11-13 «خفض النشر من مقالين يوميًا (نسخة عربية ونسخة إنجليزية)
 * إلى 4 مقالات إجمالًا أسبوعيًا فقط»).
 *
 * The weekly law, proven here from the single source of truth (the
 * exported slot constants + the workflow cron lines they pin):
 *   1. DISTRIBUTION — 2 AR + 2 EN slots per ISO week on FOUR distinct
 *      days, never more than one article per day, at the UNCHANGED
 *      Phase-119 times (AR 05:00 UTC = 08:00 Cairo · EN 22:00 UTC =
 *      18:00 US Eastern — no time or timezone change).
 *   2. BACKSTOP WEEK-AWARENESS — expectedWeeklySlotsThrough /
 *      computeWeeklyTopUp: a slot is expected only on its scheduled
 *      weekday after the 90-minute grace; coverage = max(runs, posts)
 *      over the ISO week; at most ONE top-up per language per fire;
 *      a healthy week dispatches nothing on ANY day (the daily 23:40
 *      backstop fire can never resurrect daily publishing).
 *   3. PAIR COMPLETION — the normal handoff (AR creates Mon 05:00 →
 *      EN adopts Tue 22:00, 41h) and the WORST-CASE recovery wait
 *      (twin created Thu 05:00 → next EN slot Tue 22:00, 137h) both
 *      sit inside the 144h adopt/join/resume windows widened for the
 *      weekly cadence — an orphaned twin survives the weekend gap.
 *   4. HARD CAP — BLOG_WEEKLY_QUOTA_PER_LANG = 2 (the p5-publish
 *      weekly guard's threshold) and the ISO-week attribution helper
 *      (Monday 00:00 UTC, week boundary rollover).
 *
 * The route-level enforcement (skipped_weekly_quota) is proven in
 * blog-weekly-quota.route.test.ts (same mock pattern as the Phase-171
 * daily-quota suite).
 *
 * BLOG-WEEKLY-COMPENSATION-FIX 2026-11-13 (owner approval «موافق على
 * تنفيذ الاصلاح»): the pair-completion block below additionally pins
 * the SELECTION — not just the window — through a PostgREST-replay
 * double: with the §5 compound-failure feed (the older 137h twin AND
 * the fresh 41h twin both awaiting adoption), Tuesday's slot must
 * consume the OLDER twin and the following Friday slot still finds the
 * newer one at 113h — both pairs complete. The sibling contract suite
 * is blog-adopt-order.test.ts (the ordering law + the RESUME
 * newest-first contrast pin).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  AR_WEEKLY_SLOTS,
  EN_WEEKLY_SLOTS,
  expectedWeeklySlotsThrough,
  computeWeeklyTopUp,
  SLOT_GRACE_MINUTES,
} from "@/lib/blog-pipeline-dispatch";
import {
  BLOG_WEEKLY_QUOTA_PER_LANG,
  RESUME_MAX_AGE_HOURS,
  findAdoptablePairRow,
  isoDayOfWeek,
  isoWeekStartUTC,
} from "@/lib/blog-queue";
import {
  ADOPT_MAX_AGE_HOURS,
  JOIN_MAX_AGE_HOURS,
  extractSharedBrief,
  isAdoptablePairRow,
} from "@/lib/blog-pairing";

// ── PostgREST read-builder double for the SELECTION test below —
// captures the .order() direction the source issues and replays it as
// a real sort over the seeded rows, exactly as PostgREST would. The
// state rides vi.hoisted because the vi.mock factory is hoisted above
// every import. Mirror of blog-adopt-order.test.ts (kept local: this
// file was mock-free and stays mock-free for every PURE law — only
// the one ADOPT-selection test touches the double).
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

// Fixed test week: Monday 2026-11-09 00:00 UTC → Sunday 2026-11-15.
const MONDAY = new Date("2026-11-09T00:00:00.000Z");
const at = (iso: string) => new Date(iso);

describe("WEEKLY CADENCE — the schedule pinned to the workflow crons", () => {
  /**
   * Single source of truth: the cron expressions in the two workflow
   * files MUST match the exported slot constants exactly (days AND
   * hour). This is the anti-drift pin — changing one without the
   * other fails here.
   */
  function cronLine(workflow: string): string {
    const raw = readFileSync(
      path.resolve(__dirname, "../../../.github/workflows", workflow),
      "utf-8",
    );
    const m = raw.match(/cron:\s*"([^"]+)"/);
    if (!m) throw new Error(`no cron line found in ${workflow}`);
    return m[1];
  }

  it("blog-post-ar.yml cron == 0 5 * * 1,4 (Mon+Thu 05:00 UTC — time unchanged)", () => {
    expect(cronLine("blog-post-ar.yml")).toBe("0 5 * * 1,4");
  });

  it("blog-post-en.yml cron == 0 22 * * 2,5 (Tue+Fri 22:00 UTC — time unchanged)", () => {
    expect(cronLine("blog-post-en.yml")).toBe("0 22 * * 2,5");
  });

  it("the slot constants mirror the crons (days + hour per language)", () => {
    expect(AR_WEEKLY_SLOTS).toEqual([
      { day: 0, hour: 5 },
      { day: 3, hour: 5 },
    ]);
    expect(EN_WEEKLY_SLOTS).toEqual([
      { day: 1, hour: 22 },
      { day: 4, hour: 22 },
    ]);
  });

  it("THE DISTRIBUTION LAW: 4 articles/week — 2 AR + 2 EN on FOUR distinct days, max ONE per day", () => {
    const all = [...AR_WEEKLY_SLOTS, ...EN_WEEKLY_SLOTS];
    expect(all).toHaveLength(4); // 4 articles total per week
    expect(AR_WEEKLY_SLOTS).toHaveLength(2); // 2 Arabic
    expect(EN_WEEKLY_SLOTS).toHaveLength(2); // 2 English
    // Four DISTINCT days, no day carrying more than one article.
    const days = all.map((s) => s.day);
    expect(new Set(days).size).toBe(4);
    // The days are SPREAD (no two adjacent language slots collapse onto
    // one day, and the week has two rest gaps: Wednesday + the weekend).
    expect([...days].sort((a, b) => a - b)).toEqual([0, 1, 3, 4]); // Mon Tue Thu Fri
    // The Phase-119 times are UNTOUCHED — same hours as the daily era.
    expect(all.filter((s) => s.hour === 5).length).toBe(2); // AR morning slot
    expect(all.filter((s) => s.hour === 22).length).toBe(2); // EN evening slot
  });
});

describe("WEEKLY CADENCE — expectedWeeklySlotsThrough (grace law, week-scoped)", () => {
  it("Monday 05:00 AR slot is not expected before its grace elapses", () => {
    expect(expectedWeeklySlotsThrough(AR_WEEKLY_SLOTS, at("2026-11-09T06:29:00Z"))).toBe(0);
  });

  it("the Monday slot becomes expected at slot+90min (06:30 UTC)", () => {
    expect(expectedWeeklySlotsThrough(AR_WEEKLY_SLOTS, at("2026-11-09T06:30:00Z"))).toBe(1);
  });

  it("Tuesday mid-day: only the Monday AR slot is expected (Tuesday's EN slot not yet)", () => {
    expect(expectedWeeklySlotsThrough(AR_WEEKLY_SLOTS, at("2026-11-10T12:00:00Z"))).toBe(1);
    expect(expectedWeeklySlotsThrough(EN_WEEKLY_SLOTS, at("2026-11-10T12:00:00Z"))).toBe(0);
  });

  it("the 23:40 UTC backstop fire sees both same-day slots as expected (grace fully elapsed)", () => {
    // Monday 23:40 — AR slot (05:00+90min) elapsed.
    expect(expectedWeeklySlotsThrough(AR_WEEKLY_SLOTS, at("2026-11-09T23:40:00Z"))).toBe(1);
    // Tuesday 23:40 — EN slot (22:00+90min = 23:30) elapsed by 10 min.
    expect(expectedWeeklySlotsThrough(EN_WEEKLY_SLOTS, at("2026-11-10T23:40:00Z"))).toBe(1);
  });

  it("the OLD 23:00 backstop fire would NOT see the EN 22:00 slot — the 09-05 race law preserved", () => {
    expect(expectedWeeklySlotsThrough(EN_WEEKLY_SLOTS, at("2026-11-10T23:00:00Z"))).toBe(0);
  });

  it("Friday night: both EN slots and both AR slots expected through now", () => {
    expect(expectedWeeklySlotsThrough(EN_WEEKLY_SLOTS, at("2026-11-13T23:40:00Z"))).toBe(2);
    expect(expectedWeeklySlotsThrough(AR_WEEKLY_SLOTS, at("2026-11-13T23:40:00Z"))).toBe(2);
  });

  it("WEEK BOUNDARY: Sunday night still counts this week's slots; Monday 00:00 resets to zero", () => {
    expect(expectedWeeklySlotsThrough(EN_WEEKLY_SLOTS, at("2026-11-15T23:40:00Z"))).toBe(2);
    // Monday 00:00 — the new ISO week begins: nothing expected yet.
    expect(expectedWeeklySlotsThrough(EN_WEEKLY_SLOTS, at("2026-11-16T00:00:00Z"))).toBe(0);
    expect(expectedWeeklySlotsThrough(AR_WEEKLY_SLOTS, at("2026-11-16T00:00:00Z"))).toBe(0);
  });

  it("grace is injectable (pure — deterministic without fake timers)", () => {
    expect(
      expectedWeeklySlotsThrough(AR_WEEKLY_SLOTS, at("2026-11-09T05:30:00Z"), 30),
    ).toBe(1);
    expect(
      expectedWeeklySlotsThrough(AR_WEEKLY_SLOTS, at("2026-11-09T05:29:00Z"), 30),
    ).toBe(0);
  });
});

describe("WEEKLY CADENCE — computeWeeklyTopUp (the backstop decision)", () => {
  it("A HEALTHY WEEK dispatches NOTHING on any day — daily publishing cannot resurrect", () => {
    // Monday 23:40 after a successful Monday AR run.
    const mon = computeWeeklyTopUp({
      slots: AR_WEEKLY_SLOTS,
      now: at("2026-11-09T23:40:00Z"),
      runsThisWeek: 1,
      postsThisWeek: 1,
    });
    expect(mon.missing).toBe(0);
    expect(mon.topUpNow).toBe(0);
    // Wednesday 23:40 — both Mon(AR)+Tue(EN) served, nothing missing.
    const wed = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-11T23:40:00Z"),
      runsThisWeek: 1,
      postsThisWeek: 1,
    });
    expect(wed.expected).toBe(1);
    expect(wed.topUpNow).toBe(0);
    // Sunday 23:40 — the whole week served (2 runs / 2 posts per lang).
    const sun = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-15T23:40:00Z"),
      runsThisWeek: 2,
      postsThisWeek: 2,
    });
    expect(sun.expected).toBe(2);
    expect(sun.topUpNow).toBe(0);
  });

  it("A GENUINELY MISSED SLOT is topped up — same day first (the Phase-171 rescue)", () => {
    // Tuesday 23:40: the 22:00 EN scheduled run failed outright
    // (0 non-failed runs, 0 posts) → ONE dispatch, grace respected.
    const d = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-10T23:40:00Z"),
      runsThisWeek: 0,
      postsThisWeek: 0,
    });
    expect(d.expected).toBe(1);
    expect(d.missing).toBe(1);
    expect(d.topUpNow).toBe(1);
  });

  it("A LATE-BUT-IN-FLIGHT run covers its slot (the 09-05 race law, week-scoped)", () => {
    const d = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-10T23:40:00Z"),
      runsThisWeek: 1, // the delayed scheduled run started 23:10
      postsThisWeek: 0,
    });
    expect(d.missing).toBe(0);
    expect(d.covered).toBe(1);
  });

  it("A post that landed by ANY path covers the slot even with zero counted runs", () => {
    const d = computeWeeklyTopUp({
      slots: AR_WEEKLY_SLOTS,
      now: at("2026-11-09T23:40:00Z"),
      runsThisWeek: 0,
      postsThisWeek: 1,
    });
    expect(d.missing).toBe(0);
  });

  it("RECOVERY ON A LATER DAY: a slot missed Tuesday can be topped up Wednesday", () => {
    // Wednesday 23:40 — Tuesday's EN slot still uncovered.
    const d = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-11T23:40:00Z"),
      runsThisWeek: 0,
      postsThisWeek: 0,
    });
    expect(d.expected).toBe(1); // only Tuesday's slot elapsed
    expect(d.topUpNow).toBe(1); // recover it NOW (pair completion first)
  });

  it("AT MOST ONE TOP-UP PER FIRE — two missed slots are served by successive daily fires", () => {
    // Sunday 23:40 with BOTH EN slots missed: missing=2 but topUpNow=1
    // (the 1-automated-article/day/lang publish guard would refuse a
    // same-day second publish anyway — no wasted generation runs).
    const d = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-15T23:40:00Z"),
      runsThisWeek: 0,
      postsThisWeek: 0,
    });
    expect(d.missing).toBe(2);
    expect(d.topUpNow).toBe(1);
  });

  it("THE WEEK'S CAP IS STRUCTURAL: expected never exceeds the 2 scheduled slots", () => {
    // Even a completely failed week can never expect more than 2 slots
    // per language — the backstop cannot manufacture a third article.
    for (const slots of [AR_WEEKLY_SLOTS, EN_WEEKLY_SLOTS]) {
      const d = computeWeeklyTopUp({
        slots,
        now: at("2026-11-15T23:59:00Z"),
        runsThisWeek: 0,
        postsThisWeek: 0,
      });
      expect(d.expected).toBe(2);
    }
  });

  it("MANUAL/COACH EXTRAS (posts > expected) never trigger a top-up", () => {
    const d = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-13T23:40:00Z"),
      runsThisWeek: 3, // scheduled + 2 manual re-runs
      postsThisWeek: 3,
    });
    expect(d.missing).toBe(0);
    expect(d.covered).toBe(3);
  });

  it("posts count unavailable → falls back to run counting (pre-171 behavior)", () => {
    const d = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-10T23:40:00Z"),
      runsThisWeek: 1,
      postsThisWeek: null,
    });
    expect(d.postsCountUnknown).toBe(true);
    expect(d.missing).toBe(0);
    const d2 = computeWeeklyTopUp({
      slots: EN_WEEKLY_SLOTS,
      now: at("2026-11-10T23:40:00Z"),
      runsThisWeek: 0,
      postsThisWeek: null,
    });
    expect(d2.missing).toBe(1);
  });

  it("missing is never negative and grace constant stays 90 (documented GitHub delay)", () => {
    const d = computeWeeklyTopUp({
      slots: [],
      now: at("2026-11-15T23:40:00Z"),
      runsThisWeek: 0,
      postsThisWeek: 0,
    });
    expect(d.missing).toBe(0);
    expect(SLOT_GRACE_MINUTES).toBe(90);
  });
});

describe("WEEKLY CADENCE — pair completion across the four-day rhythm", () => {
  const PAIR = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
  const twinRow = (created: string) => ({
    id: "11111111-2222-4333-8444-555555555555",
    language: "en",
    status: "researched",
    pair_id: PAIR,
    created_at: created,
  });

  beforeEach(() => {
    double.rows.length = 0;
    double.queries.length = 0;
  });

  it("THE NORMAL HANDOFF: an EN twin created Mon 05:00 is adoptable at Tue 22:00 (41h)", () => {
    const twin = twinRow("2026-11-09T05:00:00.000Z");
    const enSlot = at("2026-11-10T22:00:00.000Z");
    expect(isAdoptablePairRow(twin, "en", { now: enSlot })).toBe(true);
    expect(
      extractSharedBrief(
        {
          sharedBrief: {
            pairId: PAIR,
            topicEn: "progressive overload fundamentals",
            topicAr: "مبادئ التحميل التدريجي لبناء العضلات",
            angleId: "guide",
            sealedAt: "2026-11-09T05:00:00.000Z",
          },
        },
        { now: enSlot },
      ),
    ).not.toBeNull();
  });

  it("THE WORST-CASE RECOVERY WAIT: a twin created Thu 05:00 survives to the NEXT Tue 22:00 slot (137h ≤ 144h)", () => {
    // The pair-2 EN twin is created by Thursday's AR run; Friday's EN
    // slot failed entirely; the next EN slot is NEXT Tuesday 22:00 —
    // 6d17h = 137h after creation. The 144h window keeps the pair
    // completable across the weekend gap (the guarantee the daily
    // cadence had for free).
    const twin = twinRow("2026-11-12T05:00:00.000Z");
    const nextEnSlot = at("2026-11-17T22:00:00.000Z");
    expect(isAdoptablePairRow(twin, "en", { now: nextEnSlot })).toBe(true);
  });

  it("THE COMPOUND-FAILURE SELECTION (review §5): with BOTH twins waiting, Tuesday consumes the OLDER (137h) and Friday still finds the newer (113h) — both pairs complete", async () => {
    // The window test above (line 335) proves only that a 137h twin is
    // ELIGIBLE. This test pins the SELECTION through the real lookup:
    // after Friday's slot + every weekend 23:40 top-up fail, Monday's
    // AR run creates a FRESH twin — so Tuesday's EN slot finds TWO
    // researched twins. Newest-first adoption (the review §5 defect)
    // would eat the fresh one and starve the older past 144h (209h by
    // the following Friday) leaving its Arabic side orphaned; FIFO
    // adoption consumes the oldest first and BOTH pairs complete.
    const T1B = { id: "bbbbbbbb-0000-4000-8000-00000000000b", pair: "b1b2c3d4-0000-4000-8000-000000000001" };
    const T2 = { id: "cccccccc-0000-4000-8000-000000000002", pair: "c1c2c3d4-0000-4000-8000-000000000002" };
    const t1bRow = {
      ...twinRow("2026-11-12T05:00:00.000Z"), // pair-2's twin, created Thu W
      id: T1B.id,
      pair_id: T1B.pair,
    };
    const t2Row = {
      ...twinRow("2026-11-16T05:00:00.000Z"), // pair-3's twin, created Mon W+1
      id: T2.id,
      pair_id: T2.pair,
    };
    double.rows.push(t2Row, t1bRow); // seed order ≠ creation order on purpose

    // The ages the whole guarantee rests on, stated as arithmetic:
    const tueSlot = at("2026-11-17T22:00:00.000Z");
    const friSlot = at("2026-11-20T22:00:00.000Z");
    expect((tueSlot.getTime() - at("2026-11-12T05:00:00.000Z").getTime()) / 3_600_000).toBe(137);
    expect((tueSlot.getTime() - at("2026-11-16T05:00:00.000Z").getTime()) / 3_600_000).toBe(41);
    expect((friSlot.getTime() - at("2026-11-16T05:00:00.000Z").getTime()) / 3_600_000).toBe(113);
    expect((friSlot.getTime() - at("2026-11-12T05:00:00.000Z").getTime()) / 3_600_000).toBe(209); // starved — the orphan the fix removes

    // Tuesday W+1 22:00: BOTH twins are eligible (137h and 41h ≤ 144h)
    // — the slot must consume the OLDER one.
    const adoptedAtTue = await findAdoptablePairRow("en");
    expect(adoptedAtTue?.id).toBe(T1B.id);
    expect(isAdoptablePairRow(adoptedAtTue, "en", { now: tueSlot })).toBe(true);

    // Tuesday's own P1 walk moves the adopted row out of `researched`.
    const consumed = double.rows.find((r) => r.id === T1B.id);
    if (consumed) consumed.status = "outlined";

    // The following Friday slot (113h later): the fresh twin is still
    // inside its window — pair-3 completes too. BOTH pairs complete.
    const adoptedAtFri = await findAdoptablePairRow("en");
    expect(adoptedAtFri?.id).toBe(T2.id);
    expect(isAdoptablePairRow(adoptedAtFri, "en", { now: friSlot })).toBe(true);
  });

  it("beyond 144h the twin expires honestly (no stale blind pairing)", () => {
    const twin = twinRow("2026-11-12T05:00:00.000Z");
    expect(isAdoptablePairRow(twin, "en", { now: at("2026-11-18T05:30:00Z") })).toBe(false); // 144.5h
  });

  it("the widened windows are exactly 144h (adopt + join + resume)", () => {
    expect(ADOPT_MAX_AGE_HOURS).toBe(144);
    expect(JOIN_MAX_AGE_HOURS).toBe(144);
    expect(RESUME_MAX_AGE_HOURS).toBe(144);
  });

  it("the same-language RESUME gap across the weekend (Fri→Tue, 96h) sits inside the window", () => {
    // An EN row stuck mid-pipeline Friday 22:00 is resumed by the next
    // EN slot (Tuesday 22:00) — 96h < 144h.
    expect(96).toBeLessThan(RESUME_MAX_AGE_HOURS);
  });
});

describe("WEEKLY CADENCE — the hard cap and its ISO-week attribution", () => {
  it("BLOG_WEEKLY_QUOTA_PER_LANG = 2 (2 AR + 2 EN = 4 articles/week total)", () => {
    expect(BLOG_WEEKLY_QUOTA_PER_LANG).toBe(2);
    expect(BLOG_WEEKLY_QUOTA_PER_LANG * 2).toBe(4);
  });

  it("isoDayOfWeek: Monday=0 … Sunday=6 (ISO order, matches the slot constants)", () => {
    expect(isoDayOfWeek(new Date("2026-11-09T12:00:00Z"))).toBe(0); // Monday
    expect(isoDayOfWeek(new Date("2026-11-13T12:00:00Z"))).toBe(4); // Friday
    expect(isoDayOfWeek(new Date("2026-11-15T12:00:00Z"))).toBe(6); // Sunday
  });

  it("isoWeekStartUTC: Monday 00:00 UTC of the given instant's week", () => {
    expect(isoWeekStartUTC(new Date("2026-11-11T15:30:00Z")).toISOString()).toBe(
      "2026-11-09T00:00:00.000Z",
    ); // Wednesday → its Monday
    expect(isoWeekStartUTC(new Date("2026-11-15T23:59:59Z")).toISOString()).toBe(
      "2026-11-09T00:00:00.000Z",
    ); // Sunday night → same Monday
  });

  it("the week rolls over AT Monday 00:00 UTC (Sunday 23:59 ≠ Monday 00:00)", () => {
    expect(isoWeekStartUTC(new Date("2026-11-16T00:00:00Z")).toISOString()).toBe(
      "2026-11-16T00:00:00.000Z",
    );
    expect(isoWeekStartUTC(new Date("2026-11-15T23:59:59Z")).getTime()).toBe(
      MONDAY.getTime(),
    );
  });
});
