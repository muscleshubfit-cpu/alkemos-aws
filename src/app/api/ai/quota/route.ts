import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import {
  countTodayChatUsage,
  checkUnifiedPlanQuota,
  checkSwapQuota,
  evoChatLimitFor,
} from "@/lib/tier-limits";
import {
  renewalCheckoutUrlFor,
  upgradeCheckoutUrlFor,
  type MembershipTier,
} from "@/lib/memberships";

/**
 * GET /api/ai/quota — Phase 69 (owner-approved): the AI QUOTA METER
 * → Phase 183 (unified pool) → AI-QUOTAS 2026-11-14 («إعادة هيكلة سياسة
 * الذكاء الاصطناعي والاشتراكات والأرصدة» + التوضيح المُصحِّح) → the
 * completion order 2026-11-14 «استكمال تطوير نظام الحصص الشهرية»
 * (governing doc: docs/AI-QUOTAS-POLICY-2026-11-14.md).
 *
 * The meter reads the SAME ledgers the enforcement counts
 * (checkUnifiedPlanQuota / checkSwapQuota — meter == enforcement law)
 * and adds the per-subscription-cycle renewal date + the EXISTING
 * payment-path links for the exhaustion UX (order §3):
 *
 *   - authed callers: their unified monthly GENERATION quota (parallel
 *     buckets aggregated — premium 4 + pro 8 = 12) + their UNIFIED
 *     monthly SWAP quota (meal + exercise combined, completion order
 *     §1/§2 — the per-type split is retired) + subscriptionRequired
 *     when no active paid subscription exists (generation and swaps are
 *     subscriber-only) + renewalUrl/upgradeUrl riding /checkout.
 *   - anonymous callers: subscriptionRequired (no generation path) + the
 *     free EVO chat daily limit for the meter.
 *   - staff: unlimited semantics (nothing counted for display).
 *
 * Read-only — nothing is recorded here.
 *
 * Response `swaps.meal`/`swaps.exercise` (and `nutrition`/`workout`)
 * are kept for one release as mirrors of the unified quotas (older
 * widgets read them); they are deprecated — read `swaps` and `plans`.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);

  // ── Guest: no generation path (subscriber-only — 2026-11-14). ──
  if (!auth) {
    const freeChat = { used: 0, limit: evoChatLimitFor("free"), unlimited: false };
    const blockedQuota = {
      used: 0,
      limit: 0,
      remaining: 0,
      unlimited: false,
      subscriptionRequired: true,
    };
    return NextResponse.json({
      chat: freeChat,
      plans: { ...blockedQuota, renewsAt: null, renewalUrl: null, upgradeUrl: null },
      swaps: {
        ...blockedQuota,
        renewsAt: null,
        renewalUrl: null,
        upgradeUrl: null,
        meal: { ...blockedQuota },
        exercise: { ...blockedQuota },
      },
      nutrition: { ...blockedQuota, weeklyUsed: 0, weeklyLimit: null },
      workout: { ...blockedQuota, weeklyUsed: 0, weeklyLimit: null },
    });
  }

  const tier = auth.membership_tier;
  const staff = auth.is_staff;

  if (staff) {
    // STAFF QUOTA SEMANTICS — unlimited, nothing counted for display
    const unlimited = { used: 0, limit: null, remaining: 0, unlimited: true, subscriptionRequired: false };
    return NextResponse.json({
      chat: { used: 0, limit: null, unlimited: true },
      plans: { ...unlimited, renewsAt: null, renewalUrl: null, upgradeUrl: null },
      swaps: {
        ...unlimited,
        renewsAt: null,
        renewalUrl: null,
        upgradeUrl: null,
        meal: { ...unlimited },
        exercise: { ...unlimited },
      },
      nutrition: { used: 0, limit: null, unlimited: true, weeklyUsed: 0, weeklyLimit: null },
      workout: { used: 0, limit: null, unlimited: true, weeklyUsed: 0, weeklyLimit: null },
      staff: true,
    });
  }

  const chatLimit = evoChatLimitFor(tier);
  const chatUsed = chatLimit === null ? 0 : await countTodayChatUsage(auth.id);

  const pool = await checkUnifiedPlanQuota({
    userId: auth.id,
    tierHint: tier,
  });

  // AI-QUOTAS completion order §2: ONE unified swap quota — meal and
  // exercise draw from the same budget, so ONE verdict feeds the meter
  // (the type argument only shapes the runner's ledger row).
  const swap = await checkSwapQuota(auth.id, "meal", tier);

  // §3 exhaustion UX: the direct renewal/upgrade links ride the EXISTING
  // payment path (/checkout?tier=&months= — memberships.ts owns the URLs;
  // coaching members get renewal only, there is no higher tier).
  const quotaTier = (pool.tier === "guest" ? "free" : pool.tier) as MembershipTier | "free";
  const renewalUrl = renewalCheckoutUrlFor(quotaTier);
  const upgradeUrl = upgradeCheckoutUrlFor(quotaTier);

  const unified = {
    used: pool.used,
    limit: pool.limit,
    remaining: pool.remaining,
    unlimited: pool.unlimited,
    subscriptionRequired: pool.subscriptionRequired,
    renewsAt: pool.renewsAt,
    renewalUrl,
    upgradeUrl,
  };
  const swapReadout = {
    used: swap.used,
    limit: swap.limit,
    remaining: swap.limit === null ? Infinity : Math.max(0, (swap.limit ?? 0) - swap.used),
    unlimited: swap.unlimited,
    subscriptionRequired: swap.subscriptionRequired,
    renewsAt: swap.renewsAt,
    renewalUrl,
    upgradeUrl,
  };
  // Deprecated mirrors (one release): the same unified swap quota under
  // the old per-type keys so older widgets keep rendering honest numbers.
  const swapMirror = {
    used: swapReadout.used,
    limit: swapReadout.limit,
    remaining: swapReadout.remaining,
    unlimited: swapReadout.unlimited,
    subscriptionRequired: swapReadout.subscriptionRequired,
  };

  return NextResponse.json({
    chat: {
      used: chatUsed,
      limit: chatLimit,
      unlimited: chatLimit === null,
    },
    plans: unified,
    swaps: {
      ...swapReadout,
      meal: swapMirror,
      exercise: swapMirror,
    },
    nutrition: { ...unified, weeklyUsed: 0, weeklyLimit: null },
    workout: { ...unified, weeklyUsed: 0, weeklyLimit: null },
  });
}
