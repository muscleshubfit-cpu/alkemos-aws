import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import {
  countTodayChatUsage,
  checkUnifiedPlanQuota,
  checkSwapQuota,
  evoChatLimitFor,
} from "@/lib/tier-limits";

/**
 * GET /api/ai/quota — Phase 69 (owner-approved): the AI QUOTA METER
 * → Phase 183 (unified pool) → AI-QUOTAS 2026-11-14 («إعادة هيكلة سياسة
 * الذكاء الاصطناعي والاشتراكات والأرصدة» + التوضيح المُصحِّح — حصص شهرية
 * مطوَّرة، لا أرصدة. Governing doc: docs/AI-QUOTAS-POLICY-2026-11-14.md).
 *
 * The meter reads the SAME ledgers the enforcement counts (checkUnifiedPlanQuota
 * / checkSwapQuota — meter == enforcement law) and adds the subscription-cycle
 * renewal date (renewsAt):
 *
 *   - authed callers: their unified monthly GENERATION quota (aggregated
 *     stacking — premium 4 + pro 8 = 12) + their INDEPENDENT monthly SWAP
 *     quotas (meal and exercise, per type — evolved from the retired weekly
 *     limits) + subscriptionRequired when no active paid subscription
 *     exists (generation is subscriber-only — the 2026-11-14 correction).
 *   - anonymous callers: subscriptionRequired (no generation path) + the
 *     free EVO chat daily limit for the meter.
 *   - staff: unlimited semantics (nothing counted for display).
 *
 * Read-only — nothing is recorded here.
 *
 * Response `nutrition`/`workout` keys are kept for one release as
 * mirrors of the unified quota (older widgets read them); they are
 * deprecated — read `plans` instead.
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
      plans: { ...blockedQuota, renewsAt: null },
      swaps: {
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
      plans: { ...unlimited, renewsAt: null },
      swaps: {
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

  const [mealSwap, exerciseSwap] = await Promise.all([
    checkSwapQuota(auth.id, "meal", tier),
    checkSwapQuota(auth.id, "exercise", tier),
  ]);

  const unified = {
    used: pool.used,
    limit: pool.limit,
    remaining: pool.remaining,
    unlimited: pool.unlimited,
    subscriptionRequired: pool.subscriptionRequired,
    renewsAt: pool.renewsAt,
  };
  const toSwap = (v: typeof mealSwap) => ({
    used: v.used,
    limit: v.limit,
    remaining: v.limit === null ? Infinity : Math.max(0, (v.limit ?? 0) - v.used),
    unlimited: v.unlimited,
    subscriptionRequired: v.subscriptionRequired,
  });

  return NextResponse.json({
    chat: {
      used: chatUsed,
      limit: chatLimit,
      unlimited: chatLimit === null,
    },
    plans: unified,
    swaps: {
      meal: toSwap(mealSwap),
      exercise: toSwap(exerciseSwap),
    },
    nutrition: { ...unified, weeklyUsed: 0, weeklyLimit: null },
    workout: { ...unified, weeklyUsed: 0, weeklyLimit: null },
  });
}
