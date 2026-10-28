import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { clientIp } from "@/lib/rate-limit";
import {
  countTodayChatUsage,
  checkUnifiedPlanQuota,
  hashGuestKey,
  hashIpKey,
  evoChatLimitFor,
} from "@/lib/tier-limits";

/**
 * GET /api/ai/quota — Phase 69 (owner-approved): the EVO QUOTA METER
 * → Phase 183 (owner decree 2026-09-13 «البوول الموحد»): the meter now
 * reads ONE unified plan pool (nutrition + workout COMBINED) from the
 * success-only ledger (ai_plan_usage, migration 0085), for members AND
 * guests.
 *
 *   - ?guestId=<uuid>  (anonymous callers): the guest's pool — FREE
 *     tier numbers (2/month). G6 (migration 0086): the id is hashed
 *     server-side AND the pool is counted as max(browser dimension,
 *     network dimension — salted hash of the client IP), so a fresh
 *     incognito window NO LONGER shows a reset 2/2 balance. No raw
 *     values stored. No signup wall — guests see their remaining
 *     generations exactly like members do.
 *   - authed callers:  their AGGREGATED paid pool (owner order
 *     2026-10-28 «تجميع حصص الاشتراكات المدفوعة» — every distinct
 *     effectively-active paid tier contributes its pool once:
 *     free 2 · premium 4 · pro 8 · coaching 8; premium+pro = 12).
 *
 * Display ALWAYS reads the same ledger enforcement counts
 * (checkUnifiedPlanQuota) — the meter matches what is enforced.
 * Read-only — nothing is recorded here.
 *
 * Response `nutrition`/`workout` keys are kept for one release as
 * mirrors of the unified pool (older widgets read them); they are
 * deprecated — read `plans` instead.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);

  // ── Guest pool (unified + free chat readout). ──
  // G6: the meter reads BOTH guest dimensions (browser + IP) — exactly
  // what enforcement checks (meter == enforcement law). A brand-new
  // incognito session from a network that already burned its pool sees
  // the honest 2/2 used, not a fake-fresh balance.
  if (!auth) {
    const rawGuestId = new URL(request.url).searchParams.get("guestId") ?? "";
    const guestKey = rawGuestId.trim().length >= 8 ? hashGuestKey(rawGuestId.trim()) : null;
    const ipKey = hashIpKey(clientIp(request));
    const pool = await checkUnifiedPlanQuota({ guestKey, ipKey });
    return NextResponse.json({
      chat: { used: 0, limit: evoChatLimitFor("free"), unlimited: false },
      plans: {
        used: pool.used,
        limit: pool.limit,
        remaining: pool.remaining,
        unlimited: pool.unlimited,
      },
      nutrition: { used: pool.used, limit: pool.limit, unlimited: pool.unlimited, weeklyUsed: 0, weeklyLimit: null },
      workout: { used: pool.used, limit: pool.limit, unlimited: pool.unlimited, weeklyUsed: 0, weeklyLimit: null },
    });
  }

  const tier = auth.membership_tier;
  const staff = auth.is_staff;

  if (staff) {
    // STAFF QUOTA SEMANTICS — unlimited, nothing counted for display
    return NextResponse.json({
      chat: { used: 0, limit: null, unlimited: true },
      plans: { used: 0, limit: null, remaining: 0, unlimited: true },
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

  const unified = {
    used: pool.used,
    limit: pool.limit,
    remaining: pool.remaining,
    unlimited: pool.unlimited,
  };

  return NextResponse.json({
    chat: {
      used: chatUsed,
      limit: chatLimit,
      unlimited: chatLimit === null,
    },
    plans: unified,
    nutrition: { ...unified, weeklyUsed: 0, weeklyLimit: null },
    workout: { ...unified, weeklyUsed: 0, weeklyLimit: null },
  });
}
