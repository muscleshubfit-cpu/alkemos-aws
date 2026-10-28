import { getLimits, type MembershipTier } from "@/lib/memberships";

// Re-export so server contexts can import the tier type from the
// resolver module (auth-server.ts re-exports it onward, preserving
// its historical export surface).
export type { MembershipTier } from "@/lib/memberships";

/**
 * SINGLE SOURCE OF TRUTH for server-side membership tier resolution
 * (audit A-6 / Phase 141 — owner-approved §7 auth change, 2026-09-07).
 *
 * The bug this kills: `getAuthUser()` and `getAuthUserFromHeaders()`
 * in `src/lib/auth-server.ts` each carried their OWN copy of the tier
 * resolution logic — and they had DRIFTED. The API-route copy mapped
 * the retired legacy products (starter → premium, elite → pro) as
 * belt-and-suspenders against stray legacy rows, while the
 * server-component copy (`getAuthUserFromHeaders`, used by the coach
 * preview surface) did not. A client holding ONLY a stray `starter`
 * or `elite` row resolved as "free" in server components while
 * resolving correctly ("premium"/"pro") in API routes.
 *
 * Both call sites now share THIS pure function, so the two entry
 * points can never drift again. The function is intentionally free of
 * imports on the auth stack (no next/headers, no Supabase client) so
 * unit tests and any future server context can import it directly.
 */

/**
 * Row shape the resolver consumes — the subset of `subscriptions`
 * columns it needs. Callers MUST pre-filter rows to
 * `status = 'active' AND end_date > now()` in their query (the
 * resolver does not re-check those fields; it trusts the query).
 */
export type SubscriptionTierRow = {
  tier: string;
  status: string;
  /** Nullable in the DB schema — the query filters nulls out anyway. */
  end_date: string | null;
};

/**
 * 0045 legacy compat: `starter` and `elite` were the retired
 * coaching-page products; migration 0045 remapped all rows
 * (starter → premium, elite → pro). This map is belt-and-suspenders
 * so a stray legacy row can never downgrade a paying client to
 * "free" — a stray row UPGRADES to the equivalent live tier instead.
 */
const LEGACY_TIER_MAP: Record<string, MembershipTier> = {
  starter: "premium",
  elite: "pro",
};

/**
 * Semantics (kept identical to the previous getAuthUser() behavior —
 * the more complete of the two drifted copies):
 *
 * - Staff (role coach | admin) → "coaching". This unlocks subscriber
 *   UI gates for display; hard limits are bypassed server-side via
 *   the separate `is_staff` flag (STAFF QUOTA SEMANTICS, 2026-08-29).
 * - Clients with at least one MEMBERSHIP sub (premium | pro | legacy
 *   starter/elite): the BEST membership wins (pro/elite > premium/
 *   starter). `membership_tier` deliberately reports the membership,
 *   NOT coaching — EVO-limit merging for clients who hold BOTH
 *   coaching and a membership happens client-side via getLimits().
 * - Clients with ONLY a coaching sub → "coaching" (EVO access).
 * - No active subs (or empty array) → "free".
 * - Unknown tier strings are ignored defensively (fall through to
 *   free / coaching rules) — they can never crash auth.
 */
export function resolveMembershipTier(
  role: "client" | "coach" | "admin",
  subs: ReadonlyArray<SubscriptionTierRow> | null | undefined,
): MembershipTier {
  if (role !== "client") return "coaching";
  if (!subs || subs.length === 0) return "free";

  const hasCoaching = subs.some((s) => s.tier === "coaching");
  const membershipSubs = subs.filter(
    (s) => s.tier === "premium" || s.tier === "pro" || s.tier === "starter" || s.tier === "elite",
  );

  if (membershipSubs.length > 0) {
    // Best membership tier: pro/elite (3) > premium/starter (2).
    const priority = (tier: string) => {
      if (tier === "pro" || tier === "elite") return 3;
      if (tier === "premium" || tier === "starter") return 2;
      return 0;
    };
    membershipSubs.sort((a, b) => priority(b.tier) - priority(a.tier));
    const best = membershipSubs[0].tier;
    const mapped = LEGACY_TIER_MAP[best];
    return mapped ?? (best as MembershipTier);
  }

  if (hasCoaching) return "coaching";
  return "free";
}

/**
 * KNOWN PAID TIERS for the aggregated plan pool (owner order
 * 2026-10-28 «تجميع حصص الاشتراكات المدفوعة»): every tier that
 * carries a paid `aiPlanMonthlyLimit`, with the 0045 legacy rows
 * (starter/elite) mapped to their successor tiers so a stray legacy
 * row can never downgrade a paying client's pool — and so a legacy
 * row DEDUPS against its live sibling (starter + premium = ONE
 * premium contribution, never two).
 * Unknown tier strings contribute NOTHING (they must never fall
 * through to the free limits and silently add 2).
 */
const POOL_TIERS: Record<string, MembershipTier> = {
  premium: "premium",
  pro: "pro",
  coaching: "coaching",
  // 0045 legacy compat (same map as LEGACY_TIER_MAP above)
  starter: "premium",
  elite: "pro",
};

/**
 * AGGREGATED PAID-POOL LAW (owner order 2026-10-28 «تجميع حصص
 * الاشتراكات المدفوعة» — supersedes the previous single-tier pool
 * for the AI plan pool ONLY; the display tier above keeps its
 * best-membership semantics for badges/feature gates).
 *
 * The member's unified monthly AI plan-generation pool = the SUM of
 * `aiPlanMonthlyLimit` over every DISTINCT paid tier held as an
 * effectively-active subscription:
 *
 *   Premium (4) + Pro (8) = 12 for the entitled period — a member who
 *   burned 2 before the upgrade keeps {used:2, remaining:10}, NOT 6.
 *
 * Rules (the order's invariants):
 *   - Only rows inside their paid entitlement window count
 *     (status === "active" AND end_date > now). Callers pre-filter
 *     the same way (auth entry points + the tier-limits DB fetch),
 *     but this is a MONEY path — the function re-verifies defensively
 *     so an expired/cancelled-status row can never contribute, and no
 *     quota is granted outside the paid period or after its end.
 *   - A cancellation (Phase 68) keeps status "active" until end_date
 *     — a cancelled-but-unexpired row STILL contributes (access
 *     continues until end_date, exactly like the entitlement itself).
 *   - ONE contribution per distinct (mapped) tier — the DB's
 *     unique(client_id, tier) constraint (0011) structurally caps one
 *     row per tier, and extend_subscription (0018/0042) renews the
 *     SAME row instead of inserting a sibling, so a renewal never
 *     double-counts; the dedup here guarantees it even against stray
 *     duplicate rows («لا تحتسب الحصة نفسها مرتين»).
 *   - No active paid row → the FREE pool (2). The free pool is the
 *     no-membership baseline — it never stacks on top of paid pools.
 *   - The usage ledger (ai_plan_usage, 0085) is identity-keyed and
 *     untouched by activations — used/remaining are computed by the
 *     caller from that ledger; this function owns the LIMIT only.
 *
 * Pool numbers come straight from memberships.ts (single source) —
 * free 2 · premium 4 · pro 8 · coaching 8.
 */
export function resolveUnifiedPlanPoolLimit(
  subs: ReadonlyArray<SubscriptionTierRow> | null | undefined,
  now: Date = new Date(),
): number {
  const freePool = getLimits("free").aiPlanMonthlyLimit;
  if (!subs || subs.length === 0) return freePool;
  const nowMs = now.getTime();
  const counted = new Set<MembershipTier>();
  let total = 0;
  for (const s of subs) {
    // Entitlement window — defensive re-verification (money path).
    if (s.status !== "active") continue;
    if (!s.end_date) continue;
    const endMs = new Date(s.end_date).getTime();
    if (!Number.isFinite(endMs) || endMs <= nowMs) continue;
    // Known paid tiers only; unknown strings contribute nothing.
    const tier = POOL_TIERS[s.tier];
    if (!tier) continue;
    // One contribution per distinct mapped tier — never twice.
    if (counted.has(tier)) continue;
    counted.add(tier);
    total += getLimits(tier).aiPlanMonthlyLimit;
  }
  return counted.size === 0 ? freePool : total;
}
