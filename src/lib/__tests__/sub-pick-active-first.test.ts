import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  pickPrimarySubscription,
  effectiveSubStatus,
} from "@/lib/subscription-view";

/**
 * SUB-PICK-ACTIVE-FIRST battery (owner order 2026-10-26, item 3 — «اشتراك
 * التدريب المجدد يظهر منتهيًا مع استمرار ظهور اشتراك Premium قديم»).
 *
 * THE REPRODUCED LIVE DEFECT (scripts/repro/sub_pick_repro.py, read-only on
 * production 2026-10-26): client 87cd7ba6 holds premium (ends 2026-10-10 —
 * expired) + coaching (renewed 2026-10-22 → ends 2026-11-22 — ACTIVE).
 * Every staff-side pick ordered by tier priority ALONE (pro > premium >
 * coaching) with no expiry term, so the EXPIRED premium masked the
 * RENEWED-ACTIVE coaching row: the client list badge read «منتهي» over the
 * old premium while the renewal surfaced nowhere.
 *
 * THE LAW: effectively-ACTIVE rows win over expired rows (any tier); among
 * actives the historical best-membership pick stands; when nothing is
 * active, the historical pick over all rows (the surface then shows the
 * honest effective «منتهي» status — never a masked renewal).
 */

const DAY = 864e5;

function sub(over: {
  tier: string;
  status?: string;
  endDate?: string | null;
  id?: string;
}) {
  return {
    id: over.id ?? over.tier,
    tier: over.tier,
    status: over.status ?? "active",
    end_date:
      over.endDate === undefined ? iso(+30 * DAY) : over.endDate,
  };
}

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

describe("pickPrimarySubscription — ACTIVE-FIRST (the reported case, pinned to the live rows)", () => {
  it("an EXPIRED premium never masks a RENEWED-ACTIVE coaching — THE reported state (client 87cd7ba6)", () => {
    // Live rows 2026-10-26: premium ended 2026-10-10 (−16d), coaching
    // renewed 2026-10-22 → ends 2026-11-22 (+27d). Relative offsets keep
    // the pin time-proof while mirroring the measured gap exactly.
    const rows = [
      sub({ tier: "premium", endDate: iso(-16 * DAY) }), // expired 16 days ago
      sub({ tier: "coaching", endDate: iso(+27 * DAY) }), // renewed, ACTIVE
    ];
    const picked = pickPrimarySubscription(rows);
    expect(picked?.tier).toBe("coaching");
    expect(effectiveSubStatus(picked!)).toBe("active");
  });

  it("an EXPIRED pro never masks an ACTIVE premium (any tier — the law is general)", () => {
    const rows = [
      sub({ tier: "pro", endDate: iso(-DAY) }), // expired yesterday
      sub({ tier: "premium", endDate: iso(+DAY) }), // active
    ];
    expect(pickPrimarySubscription(rows)?.tier).toBe("premium");
  });

  it("among ACTIVE rows the historical pick stands: pro > premium > coaching", () => {
    const rows = [
      sub({ tier: "coaching" }),
      sub({ tier: "premium" }),
      sub({ tier: "pro" }),
    ];
    expect(pickPrimarySubscription(rows)?.tier).toBe("pro");
    expect(pickPrimarySubscription([sub({ tier: "coaching" }), sub({ tier: "premium" })])?.tier).toBe("premium");
    expect(pickPrimarySubscription([sub({ tier: "coaching" })])?.tier).toBe("coaching");
  });

  it("when NOTHING is active, the historical pick over ALL rows (best expired row — honest «منتهي» display)", () => {
    const rows = [
      sub({ tier: "premium", endDate: iso(-2 * DAY) }),
      sub({ tier: "pro", endDate: iso(-10 * DAY) }),
    ];
    const picked = pickPrimarySubscription(rows);
    expect(picked?.tier).toBe("pro"); // best tier among the expired
    expect(effectiveSubStatus(picked!)).toBe("expired"); // the surface must show the honest badge
  });

  it("status != 'active' is never treated as active even with a future end_date (cancelled rows)", () => {
    const rows = [
      sub({ tier: "premium", status: "cancelled", endDate: iso(+30 * DAY) }),
      sub({ tier: "coaching", endDate: iso(+5 * DAY) }),
    ];
    expect(pickPrimarySubscription(rows)?.tier).toBe("coaching");
  });

  it("a NULL end_date is NOT active (the SQL _is_active convention — no masked renewals through NULL)", () => {
    const rows = [
      sub({ tier: "premium", endDate: null }),
      sub({ tier: "coaching", endDate: iso(+5 * DAY) }),
    ];
    expect(pickPrimarySubscription(rows)?.tier).toBe("coaching");
  });

  it("pre-filtered ACTIVE rows (the getSubscriptionForClient contract) — behavior unchanged", () => {
    // That caller filters status='active' AND end_date>now BEFORE picking;
    // the law's first key is a no-op there: the historical pick still wins.
    const rows = [
      sub({ tier: "premium", endDate: iso(+20 * DAY) }),
      sub({ tier: "coaching", endDate: iso(+10 * DAY) }),
    ];
    expect(pickPrimarySubscription(rows)?.tier).toBe("premium");
  });

  it("empty input → null", () => {
    expect(pickPrimarySubscription([])).toBeNull();
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* The SQL twin — migration 0102 pins the same key in ALL five functions    */
/* (structural source pins; the canary precedent for migration shape law)   */
/* ──────────────────────────────────────────────────────────────────────── */

describe("migration 0102 — the active-first key in every staff-side pick", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20261026120000_0102_sub_pick_active_first.sql"),
    "utf8",
  );

  it("defines all five functions (the 0092/0043/0068 latest bodies)", () => {
    for (const fn of [
      "get_coach_client_list_paged",
      "get_coach_client_stats",
      "get_coach_client_list",
      "get_admin_clients_paged",
      "get_admin_clients_stats",
    ]) {
      expect(sql).toContain(`create or replace function public.${fn}`);
    }
  });

  it("the active-first key leads the sub pick ordering in every lateral/subquery", () => {
    const KEY = "coalesce(s.status = 'active' and s.end_date > now(), false) desc";
    // paged + stats + legacy + admin paged + admin stats = at least 6
    // order-by sites (the legacy function has FOUR subqueries, each keyed)
    const occurrences = sql.split(KEY).length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(6);
    // and the key PRECEDES the tier-priority term in each ordering block
    const orderBlocks = sql.match(/order by\s+coalesce\(\s*s\.status[\s\S]{0,260}?created_at desc/g) ?? [];
    expect(orderBlocks.length).toBeGreaterThanOrEqual(6);
    for (const block of orderBlocks) {
      expect(block.indexOf("coalesce")).toBeLessThan(block.indexOf("case s.tier"));
    }
  });

  it("keeps the signatures identical (no caller breakage — types.ts untouched)", () => {
    // drop-function statements would signal a signature change; 0102 is
    // create-or-replace only.
    expect(sql.toLowerCase()).not.toContain("drop function");
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* CoachClientView display honesty — source pins (the badge + row status)   */
/* ──────────────────────────────────────────────────────────────────────── */

describe("CoachClientView — honest subscription display (source pins)", () => {
  const view = readFileSync(
    join(process.cwd(), "src/components/views/CoachClientView.tsx"),
    "utf8",
  );

  it("the header badge uses effectiveSubStatus (no «مؤكد» over an expired row)", () => {
    expect(view).toContain('effectiveSubStatus(sub) === "active"');
  });

  it("the all-subs list uses the same honest law (the hand-rolled isActive is gone)", () => {
    expect(view).toContain('const isActive = effectiveSubStatus(s) === "active";');
    // The OLD hand-rolled list isActive (status + null-end-date-is-active)
    // must not come back — it disagreed with the Phase 247 law:
    expect(view).not.toContain('const isActive = s.status === "active"');
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* PlansView member swaps — the unified plan-target law (source pins)       */
/* ──────────────────────────────────────────────────────────────────────── */

describe("PlansView — member swaps carry the plan targets (source pins)", () => {
  const view = readFileSync(
    join(process.cwd(), "src/components/views/PlansView.tsx"),
    "utf8",
  );

  it("swapMeal rides planId + clientId + mealIdx (runner materialization)", () => {
    const mealBlock = view.split('enqueueAiJobClient("meal_regenerate"')[1] ?? "";
    expect(mealBlock.slice(0, 1400)).toContain("planId");
    expect(mealBlock.slice(0, 1400)).toContain("clientId: profile.id");
    expect(mealBlock.slice(0, 1400)).toContain("mealIdx: mealIndex");
  });

  it("swapExercise rides planId + clientId + dayIdx + exIdx", () => {
    const exBlock = view.split('enqueueAiJobClient("exercise_regenerate"')[1] ?? "";
    expect(exBlock.slice(0, 1200)).toContain("planId");
    expect(exBlock.slice(0, 1200)).toContain("clientId: profile.id");
    expect(exBlock.slice(0, 1200)).toContain("dayIdx: dayIndex");
    expect(exBlock.slice(0, 1200)).toContain("exIdx: exIndex");
  });
});
