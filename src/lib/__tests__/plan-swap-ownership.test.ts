import { describe, it, expect } from "vitest";
import {
  decideSwapPlanOwnership,
  verifySwapPlanOwnershipForEnqueue,
  swapOwnershipErrorMessage,
  type OwnershipDbBuilder,
} from "@/lib/plan-swap-ownership";

/**
 * PLAN-SWAP-OWNERSHIP battery (owner order 2026-10-26, items 1-2).
 *
 * THE MEASURED GAP: SWAP-DURABILITY (368) made the RUNNER persist gated
 * swaps into plans.content — but the payload's planId/clientId are
 * browser-supplied and NOTHING verified the REQUESTER's relationship to
 * the plan. The browser persist path (/api/plans/member-edit) was already
 * ownership-gated; the QUEUE path wrote through supabaseAdmin with only a
 * payload-vs-payload check — an IDOR: a hostile premium member could
 * enqueue meal_regenerate with another member's planId+clientId and the
 * runner would overwrite the victim's plan.
 *
 * THE LAW (one pure decision, shared by the enqueue gate and the runner
 * defense): client → his OWN plan; coach → assignment roster (B2B or
 * site); admin → any; the payload's clientId must match the plan's real
 * client_id (forging defense).
 */

const PLAN_CLIENT = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const OTHER_CLIENT = "99999999-8888-7777-6666-555555555555";
const MEMBER = "11111111-1111-1111-1111-111111111111";
const COACH = "22222222-2222-2222-2222-222222222222";

describe("decideSwapPlanOwnership — the pure law", () => {
  it("a client owns HIS plan", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: MEMBER },
        requesterId: MEMBER,
        requesterRole: "client",
      }),
    ).toEqual({ ok: true });
  });

  it("a client does NOT own another member's plan (the IDOR case — blocked)", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: OTHER_CLIENT },
        requesterId: MEMBER,
        requesterRole: "client",
      }),
    ).toEqual({ ok: false, code: "not_your_plan" });
  });

  it("an ASSIGNED coach owns the plan (coach_assignments row)", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: PLAN_CLIENT },
        requesterId: COACH,
        requesterRole: "coach",
        assignment: { coach_id: COACH },
      }),
    ).toEqual({ ok: true });
  });

  it("a SITE coach owns the plan through the site roster", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: PLAN_CLIENT },
        requesterId: COACH,
        requesterRole: "coach",
        assignment: null,
        siteAssignment: { coach_id: COACH },
      }),
    ).toEqual({ ok: true });
  });

  it("an UNASSIGNED coach is blocked (poaching-proof)", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: PLAN_CLIENT },
        requesterId: COACH,
        requesterRole: "coach",
        assignment: null,
        siteAssignment: null,
      }),
    ).toEqual({ ok: false, code: "not_your_plan" });
  });

  it("an admin may target any plan (staff semantics)", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: OTHER_CLIENT },
        requesterId: "33333333-3333-3333-3333-333333333333",
        requesterRole: "admin",
      }),
    ).toEqual({ ok: true });
  });

  it("a forged payload clientId (≠ the plan's real client) is rejected — client_mismatch", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: PLAN_CLIENT },
        requesterId: MEMBER,
        requesterRole: "client",
        // The attacker passes the VICTIM's id as their own id and a third
        // id as the plan's client — the plan row is the only truth.
        payloadClientId: OTHER_CLIENT,
      }),
    ).toEqual({ ok: false, code: "client_mismatch" });
  });

  it("a matching payload clientId passes the cross-check", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: MEMBER },
        requesterId: MEMBER,
        requesterRole: "client",
        payloadClientId: MEMBER,
      }),
    ).toEqual({ ok: true });
  });

  it("a missing plan row is not_found (404 — never leaks existence)", () => {
    expect(
      decideSwapPlanOwnership({
        plan: null,
        requesterId: MEMBER,
        requesterRole: "client",
      }),
    ).toEqual({ ok: false, code: "not_found" });
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: "" },
        requesterId: MEMBER,
        requesterRole: "client",
      }),
    ).toEqual({ ok: false, code: "not_found" });
  });

  it("an unresolvable requester id / role is blocked (fail-closed at the decision layer)", () => {
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: MEMBER },
        requesterId: null,
        requesterRole: null,
      }),
    ).toEqual({ ok: false, code: "not_your_plan" });
    expect(
      decideSwapPlanOwnership({
        plan: { client_id: MEMBER },
        requesterId: MEMBER,
        requesterRole: "weird-role",
      }),
    ).toEqual({ ok: false, code: "not_your_plan" });
  });
});

/* ──────────────────────────────────────────────────────────────────────── */
/* The enqueue wrapper — the fetch wiring (plan row + assignment rosters)   */
/* ──────────────────────────────────────────────────────────────────────── */

type TableRow = Record<string, unknown> | null;

/** Stub supabaseAdmin-shaped fluent builder over in-memory tables. */
function stubDb(tables: Record<string, TableRow[]>) {
  const calls: string[] = [];
  const make = (table: string): OwnershipDbBuilder => {
    const chain = {
      select: () => chain,
      eq: (col: string, val: string) => {
        rows = (rows ?? []).filter((r) => String(r?.[col] ?? "") === val);
        return chain;
      },
      maybeSingle: async () => {
        calls.push(table);
        return { data: rows?.[0] ?? null };
      },
    } as unknown as OwnershipDbBuilder;
    let rows = tables[table] ?? [];
    return chain;
  };
  return { from: make, calls };
}

describe("verifySwapPlanOwnershipForEnqueue — the fetch wiring", () => {
  const PLAN_ID = "44444444-4444-4444-4444-444444444444";

  it("member → his own plan: fetches the plan row only and passes", async () => {
    const db = stubDb({
      plans: [{ id: PLAN_ID, client_id: MEMBER }],
    });
    const verdict = await verifySwapPlanOwnershipForEnqueue({
      planId: PLAN_ID,
      requesterId: MEMBER,
      requesterRole: "client",
      db,
    });
    expect(verdict.ok).toBe(true);
    if (verdict.ok) expect(verdict.clientId).toBe(MEMBER);
  });

  it("member → another member's plan: 403-grade verdict (the enqueue gate rejects)", async () => {
    const db = stubDb({
      plans: [{ id: PLAN_ID, client_id: OTHER_CLIENT }],
    });
    const verdict = await verifySwapPlanOwnershipForEnqueue({
      planId: PLAN_ID,
      requesterId: MEMBER,
      requesterRole: "client",
      db,
    });
    expect(verdict).toEqual({ ok: false, code: "not_your_plan" });
  });

  it("coach → his assigned client's plan: consults coach_assignments and passes", async () => {
    const db = stubDb({
      plans: [{ id: PLAN_ID, client_id: PLAN_CLIENT }],
      coach_assignments: [{ coach_id: COACH, client_id: PLAN_CLIENT }],
    });
    const verdict = await verifySwapPlanOwnershipForEnqueue({
      planId: PLAN_ID,
      requesterId: COACH,
      requesterRole: "coach",
      db,
    });
    expect(verdict.ok).toBe(true);
  });

  it("coach without an assignment: the roster queries return nothing → blocked", async () => {
    const db = stubDb({
      plans: [{ id: PLAN_ID, client_id: PLAN_CLIENT }],
      coach_assignments: [],
      site_coach_assignments: [],
    });
    const verdict = await verifySwapPlanOwnershipForEnqueue({
      planId: PLAN_ID,
      requesterId: COACH,
      requesterRole: "coach",
      db,
    });
    expect(verdict).toEqual({ ok: false, code: "not_your_plan" });
  });

  it("unknown plan id → not_found", async () => {
    const db = stubDb({ plans: [] });
    const verdict = await verifySwapPlanOwnershipForEnqueue({
      planId: PLAN_ID,
      requesterId: MEMBER,
      requesterRole: "client",
      db,
    });
    expect(verdict).toEqual({ ok: false, code: "not_found" });
  });
});

describe("swapOwnershipErrorMessage — honest AR/EN copy", () => {
  it("covers every failure code in both languages (no raw codes leak to users)", () => {
    for (const code of ["not_found", "client_mismatch", "not_your_plan"] as const) {
      const ar = swapOwnershipErrorMessage({ ok: false, code }, true);
      const en = swapOwnershipErrorMessage({ ok: false, code }, false);
      expect(ar.trim().length).toBeGreaterThan(5);
      expect(en.trim().length).toBeGreaterThan(5);
      expect(ar).not.toContain(code);
      expect(en).not.toContain(code);
    }
  });
});
