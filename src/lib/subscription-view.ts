/**
 * subscription-view — Phase 247 dedup (owner: «مريح ومنظم بلا تكرار» applied
 * to EVERY role's dashboard). The member-side surfaces (DashboardView,
 * CoachClientView ×2, getSubscriptionForClient, profile page) each re-wrote
 * the same three derivations:
 *   1. pick the PRIMARY subscription (best membership pro > premium, else
 *      the coaching row),
 *   2. days left on an end_date (clamped at 0),
 *   3. the honest effective status (an "active" row past its end_date is
 *      EXPIRED, not «0 days left»).
 * This module is the single pure definition they all share — the member-side
 * twin of Phase 246's subscription-sums law (one source per number).
 *
 * Deliberately dependency-free (no data-layer import) so the law is
 * unit-testable. Read-path presentation only — never touches payment logic.
 */

type SubLike = {
  tier: string;
  status: string;
  end_date: string | null;
};

/** SUB-PICK-ACTIVE-FIRST 2026-10-26 (owner order item 3 — «اشتراك التدريب
 *  المجدد يظهر منتهيًا مع استمرار ظهور اشتراك Premium قديم»): the pick
 *  law is now EXPIRY-AWARE. The previous law ordered by tier priority
 *  alone (pro > premium > coaching) with no expiry term, so an EXPIRED
 *  premium masked a RENEWED-ACTIVE coaching row — measured live on
 *  production (client 87cd7ba6: premium ended 2026-10-10 + coaching
 *  renewed to 2026-11-22; every staff surface showed the expired premium
 *  as «منتهي» while the renewal never surfaced — scripts/repro/sub_pick_repro.py).
 *
 *  New law, one definition shared by every caller:
 *   1. effectively-ACTIVE rows win over expired rows (any tier);
 *   2. among the active pool: best membership (pro > premium) else the
 *      coaching row (the historical pick, unchanged);
 *   3. when NOTHING is active: the historical pick over ALL rows — the
 *      surface then honestly shows the best expired row with its
 *      effective «منتهي» status (effectiveSubStatus), never a masked
 *      renewal.
 *  Callers that pre-filter to active rows (getSubscriptionForClient)
 *  see no behavior change — the law only gains its first key there.
 */
export function pickPrimarySubscription<
  T extends { tier: string; status?: string; end_date?: string | null },
>(rows: readonly T[]): T | null {
  const isActiveRow = (s: T) =>
    s.status === "active" &&
    typeof s.end_date === "string" &&
    !!s.end_date &&
    new Date(s.end_date).getTime() > Date.now();
  const pool = rows.filter(isActiveRow);
  const fallbackPool = pool.length > 0 ? pool : rows;
  const membershipSubs = fallbackPool.filter(
    (s) => s.tier === "premium" || s.tier === "pro",
  );
  if (membershipSubs.length > 0) {
    const priority = (tier: string) => (tier === "pro" ? 3 : tier === "premium" ? 2 : 0);
    const sorted = [...membershipSubs].sort((a, b) => priority(b.tier) - priority(a.tier));
    return sorted[0];
  }
  return fallbackPool.find((s) => s.tier === "coaching") ?? null;
}

/** Whole days until end_date, clamped at 0; null when there is no end_date. */
export function daysLeftOn(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 864e5));
}

/** Honest status for display: an "active" row whose end_date has passed is
 *  EXPIRED — «0 days left» lied to the member (Phase 247 finding A6). */
export function effectiveSubStatus(
  row: Pick<SubLike, "status" | "end_date">,
): "active" | "expired" {
  const active = row.status === "active" && new Date(row.end_date ?? 0).getTime() > Date.now();
  return active ? "active" : "expired";
}
