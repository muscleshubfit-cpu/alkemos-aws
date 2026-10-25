/**
 * PLAN-SWAP-OWNERSHIP — server-side gate for swap jobs that target a plan row
 * (SUB-PICK/MEMBER-SWAP-DURABILITY frame, owner order 2026-10-26 items 1-2).
 *
 * THE MEASURED GAP this kills: the SWAP-DURABILITY law (2026-10-25) made the
 * RUNNER persist gated meal/item swaps into plans.content server-side — but
 * the payload's planId + clientId are BROWSER-SUPPLIED and nothing verified
 * the REQUESTER's relationship to that plan. The browser persist path
 * (/api/plans/member-edit mode=swap) IS ownership-gated (plan.client_id ===
 * auth.id), yet the queue path wrote through supabaseAdmin with only a
 * payload-vs-payload check (plan.client_id === payload.clientId — BOTH
 * attacker-controlled): a hostile premium member could enqueue
 * meal_regenerate with another member's planId+clientId and the runner
 * would overwrite that victim's plan content (IDOR through the queue).
 *
 * THE LAW (two layers, one definition):
 *   1. ENQUEUE GATE (primary) — /api/ai/jobs rejects a swap carrying planId
 *      unless the requester may edit that plan:
 *        · client  → plan.client_id === requester id (his OWN plan)
 *        · coach   → an active coach_assignments row (coach_id = requester,
 *                    client_id = plan.client_id); site coaches ride their
 *                    site_coach_assignments roster the same way
 *        · admin   → any plan (staff semantics)
 *      The payload's clientId, when present, must match the plan's real
 *      client_id (a mismatch is a forged target — 403).
 *   2. RUNNER DEFENSE (belt) — materializeSwapIntoPlan re-verifies the same
 *      relationship from the job row's requested_by before writing; an
 *      unresolvable requester skips materialization (best-effort law — the
 *      job still finishes done, but no byte ever lands in a plan the
 *      requester does not own).
 *
 * Pure decision function + one fetch wrapper — the decision is unit-pinned
 * (plan-swap-ownership.test.ts) so both layers share byte-identical rules.
 */

export type SwapOwnershipInput = {
  /** The target plan row (fetched fresh, never body-supplied). */
  plan: { client_id: string } | null | undefined;
  /** ai_jobs.requested_by / auth.id of the requester. */
  requesterId: string | null | undefined;
  /** profiles.role of the requester ("client" | "coach" | "admin" | …). */
  requesterRole: string | null | undefined;
  /** coach_assignments row (coach_id = requester) for the plan's client. */
  assignment?: { coach_id?: string } | null;
  /** site_coach_assignments row for the plan's client (site-coach roster). */
  siteAssignment?: { coach_id?: string } | null;
  /** The payload's clientId (optional cross-check — forging defense). */
  payloadClientId?: string | null;
};

export type SwapOwnershipVerdict =
  | { ok: true }
  | { ok: false; code: "not_found" }
  | { ok: false; code: "client_mismatch" }
  | { ok: false; code: "not_your_plan" };

/** The pure law — no I/O, one definition shared by the enqueue gate and
 *  the runner defense. */
export function decideSwapPlanOwnership(
  input: SwapOwnershipInput,
): SwapOwnershipVerdict {
  const plan = input.plan ?? null;
  if (!plan || typeof plan.client_id !== "string" || !plan.client_id) {
    return { ok: false, code: "not_found" };
  }
  // Forging defense: the payload's clientId must match the REAL plan row.
  if (
    typeof input.payloadClientId === "string" &&
    input.payloadClientId &&
    input.payloadClientId !== plan.client_id
  ) {
    return { ok: false, code: "client_mismatch" };
  }
  const requesterId = typeof input.requesterId === "string" ? input.requesterId : "";
  if (!requesterId) return { ok: false, code: "not_your_plan" };
  const role = input.requesterRole ?? "";
  if (role === "admin") return { ok: true }; // staff semantics
  if (role === "client") {
    return plan.client_id === requesterId
      ? { ok: true }
      : { ok: false, code: "not_your_plan" };
  }
  if (role === "coach") {
    const owns =
      input.assignment?.coach_id === requesterId ||
      input.siteAssignment?.coach_id === requesterId;
    return owns ? { ok: true } : { ok: false, code: "not_your_plan" };
  }
  return { ok: false, code: "not_your_plan" };
}

/** Arabic-English honest messages for the enqueue gate (403/404). */
export function swapOwnershipErrorMessage(
  verdict: Exclude<SwapOwnershipVerdict, { ok: true }>,
  isAr: boolean,
): string {
  if (verdict.code === "not_found") {
    return isAr
      ? "الخطة المستهدفة غير موجودة"
      : "The target plan was not found";
  }
  if (verdict.code === "client_mismatch") {
    return isAr
      ? "الخطة المرسلة لا تطابق بياناتها — أعد فتح الخطة وحاول مرة أخرى"
      : "The submitted plan target does not match its records — reopen the plan and try again";
  }
  return isAr
    ? "هذه الخطة ليست خطة عميلك — لا يمكن تنفيذ الاستبدال عليها"
    : "This plan does not belong to your client — the swap cannot target it";
}

/**
 * Fetch + decide wrapper for the ENQUEUE GATE. Returns the verdict plus the
 * plan's real client_id on success (the caller may use it for logging).
 * `db` is the supabaseAdmin-shaped fluent reader (injected so tests can
 * stub it — the builder is select/eq chainable, same shape as the client).
 */
export type OwnershipDbBuilder = {
  select: (cols: string) => OwnershipDbBuilder;
  eq: (col: string, val: string) => OwnershipDbBuilder;
  maybeSingle: () => Promise<{ data: unknown }>;
};
export async function verifySwapPlanOwnershipForEnqueue(opts: {
  planId: string;
  requesterId: string;
  requesterRole: string;
  payloadClientId?: string | null;
  db: {
    from: (table: string) => OwnershipDbBuilder;
  };
}): Promise<SwapOwnershipVerdict & { clientId?: string }> {
  const planRes = await opts.db.from("plans").select("id, client_id").eq("id", opts.planId).maybeSingle();
  const plan = (planRes.data ?? null) as { client_id?: string } | null;
  if (!plan?.client_id) return { ok: false, code: "not_found" };

  let assignment: { coach_id?: string } | null = null;
  let siteAssignment: { coach_id?: string } | null = null;
  if (opts.requesterRole === "coach") {
    const aRes = await opts.db
      .from("coach_assignments")
      .select("coach_id")
      .eq("client_id", plan.client_id)
      .eq("coach_id", opts.requesterId)
      .maybeSingle();
    assignment = (aRes.data ?? null) as { coach_id?: string } | null;
    if (!assignment) {
      const sRes = await opts.db
        .from("site_coach_assignments")
        .select("coach_id")
        .eq("client_id", plan.client_id)
        .eq("coach_id", opts.requesterId)
        .maybeSingle();
      siteAssignment = (sRes.data ?? null) as { coach_id?: string } | null;
    }
  }

  const verdict = decideSwapPlanOwnership({
    plan: plan as { client_id: string },
    requesterId: opts.requesterId,
    requesterRole: opts.requesterRole,
    assignment,
    siteAssignment,
    payloadClientId: opts.payloadClientId,
  });
  return verdict.ok ? { ...verdict, clientId: plan.client_id } : verdict;
}
