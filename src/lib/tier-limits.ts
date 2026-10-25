/**
 * Server-side tier limit helpers.
 *
 * Enforces daily message + swap limits at the API layer (not just
 * client-side). Fixes C15 (EVO chat limit bypassable) and C16
 * (swap limit bypassable).
 *
 * 2026-08-27 CRITICAL FIXES (audit findings G1–G4):
 *
 *   G3 — resolveTier() previously used getSubscriptionForClient(), which
 *        filtered NEITHER status NOR end_date: expired/pending/rejected
 *        subscriptions still granted unlimited Premium/Pro limits. It also
 *        imported a "use client" module (browser Supabase client without
 *        cookies) into server route context, so RLS could hide the rows and
 *        collapse paying users to "free". Now:
 *          1. The verified auth tier from getAuthUser()/requireUser()
 *             (already status='active' + end_date>now()-filtered) is passed
 *             in by every caller as `tierHint` and trusted first.
 *          2. Fallback re-resolution queries through the SERVICE-ROLE admin
 *             client with the same active+expiry filters.
 *
 *   G1/G2 — EVO chat daily counting moved to the tamper-proof
 *        `evo_chat_usage` ledger (migration 0022). Rows are inserted by the
 *        SERVER before each AI dispatch; users have no INSERT/DELETE policy,
 *        so neither skipping client inserts nor clearing chat history can
 *        reset/bypass the quota anymore.
 */

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { MEMBERSHIPS, getLimits, type MembershipTier } from "@/lib/memberships";
import { createHash } from "node:crypto";

/** Plan-quota domain (mirrors EvoPlanDomain in evo-intent.ts). */
export type EvoPlanKind = "nutrition" | "workout";

const VALID_TIERS: MembershipTier[] = ["free", "premium", "pro", "coaching"];

function sanitizeTier(tier: unknown): MembershipTier | null {
  return VALID_TIERS.includes(tier as MembershipTier)
    ? (tier as MembershipTier)
    : null;
}

/**
 * Fallback tier resolution when a route has no pre-computed auth tier.
 * Uses the service-role admin client (RLS-bypassing) with active + expiry
 * filtering — mirrors getAuthUser()'s logic in auth-server.ts.
 */
async function resolveTierFromDb(userId: string): Promise<MembershipTier> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return "free";
  try {
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("tier")
      .eq("client_id", userId)
      .eq("status", "active")
      .gt("end_date", new Date().toISOString());

    if (!subs || subs.length === 0) return "free";

    const tiers = subs.map((s) => sanitizeTier(s.tier)).filter(Boolean);
    if (tiers.includes("pro")) return "pro";
    if (tiers.includes("premium")) return "premium";
    if (tiers.includes("coaching")) return "coaching";
    return "free";
  } catch (e) {
    console.error("[tier-limits] resolveTierFromDb error:", e instanceof Error ? e.message : e);
    // Fail CLOSED for limit purposes? No — fail OPEN would grant unlimited.
    // Fail SAFE: an unknown user counts as free (10 msgs/day), never premium.
    return "free";
  }
}

/**
 * Get the EVO chat daily limit for a tier.
 * Returns null = unlimited.
 */
export function evoChatLimitFor(tier: MembershipTier): number | null {
  const m = MEMBERSHIPS.find((x) => x.id === tier);
  const limit = m?.limits.evoChatDailyLimit;
  // null = unlimited; if tier not found, default to 10 (free tier limit)
  return limit === undefined ? 10 : limit;
}

/**
 * Get the swap weekly limit for a tier (per type: meal/exercise).
 * Returns null = unlimited.
 *
 * Maps membership tiers to swap limits:
 *   free:     0 (no swaps)
 *   premium:  3/week
 *   pro:      6/week
 *   coaching: 6/week (inherits every Pro benefit — Phase 183)
 */
export function swapLimitForTier(tier: MembershipTier): number | null {
  // Single source of truth = memberships.ts (evoSwapLimit).
  // Previously a hardcoded switch duplicated these numbers — the two could
  // drift apart from the advertised comparison table. They agree
  // today (0/3/6/6); now they CANNOT diverge.
  return getLimits(tier).evoSwapLimit;
}

/**
 * UNIFIED monthly AI plan-generation pool (owner decree 2026-09-13
 * «البوول الموحد» — spec "Alkemos — Membership & Plan Changes").
 * ONE budget per identity for nutrition + workout COMBINED:
 *   free 2 · premium 4 · pro 8 · coaching 8 (coaching = every Pro
 *   benefit). Guests get the free pool — no signup wall.
 * Reads aiPlanMonthlyLimit straight from memberships.ts so the
 * advertised numbers ARE the enforced numbers.
 */
export function unifiedPlanPoolFor(tier: MembershipTier): number {
  return getLimits(tier).aiPlanMonthlyLimit;
}

/**
 * Guest identity → ledger key: salted SHA-256 of the client-generated
 * guest id (a localStorage UUID the planner pages mint per browser).
 * No raw ids stored — same posture as the anon chat key (D3). Rotating
 * EVO_ANON_SALT invalidates existing guest counters (documented).
 */
export function hashGuestKey(rawGuestId: string): string {
  const salt = process.env.EVO_ANON_SALT || "mhe-evo-anon-v1";
  return createHash("sha256")
    .update(`${rawGuestId}:${salt}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * G6 FIX (owner report 2026-09-13, migration 0086): client IP → ledger
 * key — the SECOND dimension of the guest identity. A localStorage
 * guest UUID dies with every incognito window / cleared storage
 * (the owner watched the balance "reset" to 2/2 exactly that way),
 * so the guest pool now burns in BOTH dimensions and enforcement
 * reads max(browser dimension, network dimension). Same salted scheme
 * as the chat route's getAnonKey/D3 so planner rows and EVO rows from
 * one network collide into ONE counter. No raw IPs stored; rotating
 * EVO_ANON_SALT invalidates existing IP counters (documented).
 */
export function hashIpKey(ip: string): string {
  const salt = process.env.EVO_ANON_SALT || "mhe-evo-anon-v1";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 32);
}

/** The surface that triggered a generation (analytics + audit). */
export type PlanSurface = "planner" | "evo" | "coach";

/**
 * Count this month's SUCCESSFUL AI plan generations for one identity
 * (member userId OR guestKey/ipKey — several dimensions may be given;
 * the result is the MAX across them, the G6 dual-dimension law). The
 * ledger is ai_plan_usage (migration 0085 + 0086): a row exists ONLY
 * after a plan was generated AND validated — failed attempts, input
 * edits, navigation, or re-viewing an existing plan never burn the pool.
 */
export async function countUnifiedPlanUsage(identity: {
  userId?: string | null;
  guestKey?: string | null;
  ipKey?: string | null;
}): Promise<number> {
  const dims: Array<["user_id" | "guest_key" | "ip_key", string]> = [];
  if (identity.userId) dims.push(["user_id", identity.userId]);
  if (identity.guestKey) dims.push(["guest_key", identity.guestKey]);
  if (identity.ipKey) dims.push(["ip_key", identity.ipKey]);
  if (dims.length === 0) return 0;
  const counts = await Promise.all(
    dims.map(([col, val]) => countPlanRowsBy(col, val)),
  );
  return Math.max(...counts);
}

/** One dimension → this month's success-row count (head count query). */
async function countPlanRowsBy(
  column: "user_id" | "guest_key" | "ip_key",
  value: string,
): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const { count, error } = await supabaseAdmin
    .from("ai_plan_usage")
    .select("*", { count: "exact", head: true })
    .eq(column, value)
    .gte("created_at", monthStartUtc());
  if (error) {
    console.error("[tier-limits] countPlanRowsBy error:", error.message);
    return 0; // fail open on counting errors — soft quota, same as chat
  }
  return count ?? 0;
}

/** Verdict for the unified pool — what enforcement AND display read. */
export type UnifiedPlanQuotaVerdict = {
  allowed: boolean;
  used: number; // successful generations this month (combined kinds)
  limit: number; // the tier's unified pool size
  remaining: number;
  unlimited: boolean; // staff semantics — never limited, still recorded
  tier: MembershipTier | "guest";
  /**
   * G6: WHY a guest was blocked — routes pick the error copy from it.
   *   "pool"    → this browser's own pool is exhausted (classic message)
   *   "network" → the browser is fresh but the shared IP dimension is
   *               exhausted (incognito-retry case) → network copy + soft
   *               free-account CTA. null when allowed / member / staff.
   */
  reason: "pool" | "network" | null;
};

/**
 * THE unified-pool gate (owner decree 2026-09-13).
 *
 * Identity resolution:
 *   - userId + tierHint  → member pool for their tier (hint trusted
 *     first — it comes from getAuthUser()'s active+expiry filtering;
 *     fallback re-resolves via the service-role admin client).
 *   - guestKey           → the FREE pool (2/month). No signup wall:
 *     guests generate within the free quota; the signup nudge stays
 *     soft (benefits only, never a block).
 *   - staffHint          → unlimited (STAFF QUOTA SEMANTICS; usage is
 *     still recorded for analytics).
 */
export async function checkUnifiedPlanQuota(opts: {
  userId?: string | null;
  guestKey?: string | null;
  ipKey?: string | null;
  tierHint?: string | null;
  staffHint?: boolean;
}): Promise<UnifiedPlanQuotaVerdict> {
  if (opts.staffHint) {
    return {
      allowed: true, used: 0, limit: 0, remaining: 0, unlimited: true,
      tier: opts.userId ? "free" : "guest", reason: null,
    };
  }
  if (opts.userId) {
    const tier = sanitizeTier(opts.tierHint) ?? (await resolveTierFromDb(opts.userId));
    const limit = unifiedPlanPoolFor(tier);
    const used = await countPlanRowsBy("user_id", opts.userId);
    return {
      allowed: used < limit,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      unlimited: false,
      tier,
      reason: null, // members have exactly one identity — no dimension copy
    };
  }
  // Guest (G6 dual-dimension law, migration 0086): the pool burns in
  // BOTH the browser dimension (guest_key — survives IP rotation) and
  // the network dimension (ip_key — survives incognito/clear-storage).
  // used = max(browser, network): whichever dimension saw more success
  // rows this month IS the balance — the meter reads the same number
  // (meter == enforcement law). An empty guestKey still counts by IP;
  // both empty (caller gave nothing) = a fresh guest with the full free
  // pool — the burst guard still caps abuse.
  const limit = unifiedPlanPoolFor("free");
  const [usedGuest, usedIp] = await Promise.all([
    opts.guestKey ? countPlanRowsBy("guest_key", opts.guestKey) : Promise.resolve(0),
    opts.ipKey ? countPlanRowsBy("ip_key", opts.ipKey) : Promise.resolve(0),
  ]);
  const used = Math.max(usedGuest, usedIp);
  const blocked = used >= limit;
  const reason =
    blocked && usedIp >= limit && usedIp > usedGuest
      ? "network"
      : blocked
        ? "pool"
        : null;
  return {
    allowed: !blocked,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    unlimited: false,
    tier: "guest",
    reason,
  };
}

/**
 * Record ONE successful generation into the unified ledger.
 * Called ONLY after the plan was generated and validated — the
 * success-only convention the 2026-09-13 spec demands (failed
 * attempts never burn quota). Errors are logged but never thrown:
 * a ledger hiccup must not break the member's generated plan (soft
 * quota, same convention as the chat counters).
 */
export async function recordUnifiedPlanUsage(opts: {
  userId?: string | null;
  guestKey?: string | null;
  ipKey?: string | null;
  kind: EvoPlanKind;
  surface?: PlanSurface;
}): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  if (!opts.userId && !opts.guestKey) return;
  const { error } = await supabaseAdmin.from("ai_plan_usage").insert({
    user_id: opts.userId ?? null,
    guest_key: opts.userId ? null : opts.guestKey ?? null,
    // G6 (migration 0086): guest rows burn BOTH dimensions so a fresh
    // incognito window still meets its own history via the IP count.
    // Members never get IP-keyed rows — their identity is the account.
    ip_key: opts.userId ? null : opts.ipKey ?? null,
    kind: opts.kind,
    surface: opts.surface ?? "planner",
  });
  if (error) {
    console.error("[tier-limits] recordUnifiedPlanUsage error:", error.message);
  }
}

/** UTC month start — "resets monthly" = resets on the 1st, UTC. */
export function monthStartUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

/**
 * UTC week start — Monday 00:00 UTC (owner decree 2026-09-02 weekly plan
 * cap). Same Monday-anchored convention as the weekly swaps reset
 * («الرصيد يتصفّر يوم الاثنين»), so both weekly windows agree.
 */
export function weekStartUtc(now: Date = new Date()): string {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const dow = d.getUTCDay(); // 0=Sun … 6=Sat
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - mondayOffset);
  return d.toISOString();
}

/**
 * LEGACY per-kind EVO-save counter — feeds ONLY the member-edit
 * anti-spam cap (30 EVO-sourced saves/month per kind). NOT the plan
 * quota: the unified pool (2026-09-13) counts successful generations
 * from ai_plan_usage, not evo_chat_usage rows.
 */
export async function countThisMonthPlanUsage(
  userId: string,
  kind: EvoPlanKind,
): Promise<number> {
  return countEvoPlanRowsSince(userId, kind, monthStartUtc());
}

/** EVO-self ledger rows since an arbitrary instant (save-cap support). */
async function countEvoPlanRowsSince(
  userId: string,
  kind: EvoPlanKind,
  sinceIso: string,
): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const { count, error } = await supabaseAdmin
    .from("evo_chat_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source", `plan_${kind}`)
    .gte("created_at", sinceIso);
  if (error) {
    console.error("[tier-limits] countEvoPlanRowsSince error:", error.message);
    return 0; // fail open on counting errors — soft quota, same as chat
  }
  return count ?? 0;
}

/* ──────────────── RETIRED (owner decree 2026-09-13 «البوول الموحد») ──────────────
 * The per-kind split (4+4 / 8+8 monthly + 1+1 / 2+2 weekly caps) and
 * its enforcement/display belt (countClientPlanUsage,
 * countClientWeeklyPlanUsage, countThisMonthCoachPlanJobs,
 * checkEvoPlanQuota, checkClientPlanQuota, enforcePlanQuota,
 * planQuotaFor, planWeeklyQuotaFor) were REPLACED by the unified
 * pool above: checkUnifiedPlanQuota() + recordUnifiedPlanUsage() +
 * countUnifiedPlanUsage() over ai_plan_usage (migration 0085).
 * Callers rewritten in the same commit: api/ai/chat, api/ai/jobs,
 * api/ai/quota, api/coach/ai-usage. Zero live subscribers at cutover
 * (owner-confirmed) — no balance migration was needed.
 * ───────────────────────────────────────────────────────────────────── */

/* ------------------- Anonymous traffic ledger (D3 fix) -------------------
 * evo_chat_usage.user_id is a uuid FK to auth.users, so anonymous visitors
 * (no identity) could previously dispatch UNLIMITED chat calls and bleed
 * OpenRouter/Groq credits. Migration 0028 adds evo_anon_usage — same
 * tamper-proof design (server-writes only, no browser policies) keyed by
 * a SALTED SHA-256 of the client IP (no raw IPs stored). The free-tier
 * daily limit applies per anonymous client.
 * ---------------------------------------------------------------------- */

/** Count today's anonymous dispatches for one hashed client key. */
export async function countTodayAnonChatUsage(anonKey: string): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count, error } = await supabaseAdmin
    .from("evo_anon_usage")
    .select("*", { count: "exact", head: true })
    .eq("anon_key", anonKey)
    .gte("created_at", todayStart.toISOString());
  if (error) {
    console.error("[tier-limits] countTodayAnonChatUsage error:", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Insert one anon ledger row BEFORE dispatching (record-before-dispatch). */
export async function recordAnonChatUsage(
  anonKey: string,
  source = "chat",
): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  const { error } = await supabaseAdmin
    .from("evo_anon_usage")
    .insert({ anon_key: anonKey, source });
  if (error) {
    console.error("[tier-limits] recordAnonChatUsage error:", error.message);
  }
}

/** Anonymous visitors get the FREE tier daily limit (10/day). */
export async function checkAnonChatLimit(anonKey: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number | null;
  unlimited: boolean;
}> {
  const limit = evoChatLimitFor("free");
  const used = await countTodayAnonChatUsage(anonKey);
  return { allowed: used < (limit ?? 10), used, limit, unlimited: false };
}

/**
 * Count today's EVO chat dispatches from the tamper-proof usage ledger.
 * (evo_chat_usage — server-written only; see migration 0022.)
 */
export async function countTodayChatUsage(userId: string): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count, error } = await supabaseAdmin
    .from("evo_chat_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());
  if (error) {
    console.error("[tier-limits] countTodayChatUsage error:", error.message);
    return 0; // fail open on counting errors — don't block users on infra issues
  }
  return count ?? 0;
}

/**
 * Insert one ledger row BEFORE dispatching an AI chat request.
 * Record-before-dispatch means concurrent burst requests all see the
 * incremented count, so N parallel calls can't slip past the limit.
 * Errors are logged but not thrown — a failed insert must not break chat;
 * the weekly/other soft limits behave the same way.
 */
export async function recordEvoChatUsage(
  userId: string,
  source = "chat",
): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  const { error } = await supabaseAdmin
    .from("evo_chat_usage")
    .insert({ user_id: userId, source });
  if (error) {
    console.error("[tier-limits] recordEvoChatUsage error:", error.message);
  }
}

/**
 * Count this week's swaps for a user (per type).
 * Uses the plan_swaps table (server-side, Monday-anchored week).
 */
async function countThisWeekSwaps(
  userId: string,
  swapType: "meal" | "exercise",
): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const { count, error } = await supabaseAdmin
    .from("plan_swaps")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("swap_type", swapType)
    .gte("created_at", weekStart.toISOString());
  if (error) {
    console.error("[tier-limits] countThisWeekSwaps error:", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Check if a user can send another EVO chat message.
 *
 * @param userId    Verified profile id (never trust body-supplied ids).
 * @param tierHint  Pre-computed membership tier from getAuthUser()
 *                  (active + expiry filtered). When omitted, falls back to
 *                  an admin-client DB lookup.
 * @param staffHint True when getAuthUser() resolved the caller as platform
 *                  staff (role coach|admin) — bypasses the limit entirely
 *                  (STAFF QUOTA SEMANTICS). Usage stays recorded.
 */
export async function checkEvoChatLimit(
  userId: string,
  tierHint?: string | null,
  staffHint?: boolean,
): Promise<{
  allowed: boolean;
  used: number;
  limit: number | null;
  unlimited: boolean;
}> {
  if (staffHint) {
    return { allowed: true, used: 0, limit: null, unlimited: true };
  }
  const tier =
    sanitizeTier(tierHint) ?? (await resolveTierFromDb(userId));
  const limit = evoChatLimitFor(tier);
  if (limit === null) {
    return { allowed: true, used: 0, limit: null, unlimited: true };
  }
  const used = await countTodayChatUsage(userId);
  return {
    allowed: used < limit,
    used,
    limit,
    unlimited: false,
  };
}

/**
 * Check if a user can perform another swap.
 * Returns { allowed, used, limit, unlimited }.
 *
 * Also records the swap in plan_swaps if allowed (server-side check +
 * insert).
 *
 * @param tierHint Same contract as checkEvoChatLimit.
 * @param staffHint True for platform staff (coach|admin) — bypasses the
 *                  weekly limit (STAFF QUOTA SEMANTICS); still recorded.
 */
export async function checkAndRecordSwap(
  userId: string,
  swapType: "meal" | "exercise",
  tierHint?: string | null,
  staffHint?: boolean,
): Promise<{
  allowed: boolean;
  used: number;
  limit: number | null;
  unlimited: boolean;
}> {
  if (staffHint) {
    await recordSwap(userId, swapType);
    return { allowed: true, used: 0, limit: null, unlimited: true };
  }
  const tier = sanitizeTier(tierHint) ?? (await resolveTierFromDb(userId));
  const limit = swapLimitForTier(tier);

  if (limit === null) {
    // Unlimited — still record the swap for analytics
    await recordSwap(userId, swapType);
    return { allowed: true, used: 0, limit: null, unlimited: true };
  }

  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0, unlimited: false };
  }

  const used = await countThisWeekSwaps(userId, swapType);
  if (used >= limit) {
    return { allowed: false, used, limit, unlimited: false };
  }

  // Record the swap (atomic — the count above + this insert could race,
  // but the weekly limit is soft; a 1-off overage is acceptable)
  await recordSwap(userId, swapType);
  return { allowed: true, used: used + 1, limit, unlimited: false };
}

/**
 * AI-PLAN-QUALITY 2026-10-24 (owner order item 4 — «تحديث الحصص المدفوعة
 * بصورة صحيحة»): CHECK-ONLY quota gate for the member swap enqueue. The
 * paid weekly swap quota is now recorded ONLY when the regeneration job
 * actually SUCCEEDS (the runner calls recordSwapUsage after finishJob) —
 * the old record-at-enqueue burned a paid unit for every permanently
 * FAILED regeneration. Semantics mirror the Phase-183 unified plan pool
 * (success-only via ai_plan_usage) — the owner's own established law.
 * The soft-limit race window (count + no insert) keeps the documented
 * 1-off overage parity of the old check+insert pair.
 */
export async function checkSwapQuota(
  userId: string,
  swapType: "meal" | "exercise",
  tierHint?: string | null,
  staffHint?: boolean,
): Promise<{
  allowed: boolean;
  used: number;
  limit: number | null;
  unlimited: boolean;
}> {
  if (staffHint) {
    return { allowed: true, used: 0, limit: null, unlimited: true };
  }
  const tier = sanitizeTier(tierHint) ?? (await resolveTierFromDb(userId));
  const limit = swapLimitForTier(tier);

  if (limit === null) {
    return { allowed: true, used: 0, limit: null, unlimited: true };
  }
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0, unlimited: false };
  }
  const used = await countThisWeekSwaps(userId, swapType);
  return {
    allowed: used < limit,
    used,
    limit,
    unlimited: false,
  };
}

/**
 * Record a SUCCESSFUL swap in the plan_swaps table — called by the GHA
 * runner after a meal_regenerate / exercise_regenerate job lands `done`
 * (AI-PLAN-QUALITY 2026-10-24: success-only quota law). Fail-soft by
 * inheritance (recordSwap swallows its own errors).
 */
export async function recordSwapUsage(
  userId: string,
  swapType: "meal" | "exercise",
): Promise<void> {
  await recordSwap(userId, swapType);
}

/* ─────────────── PLAN-POOL BILLING POLICY (PLAN-REGEN-CONSTRAINTS 2026-10-24) ───────────────
 *
 * OWNER ORDER 2026-10-24 item 3 («تصحيح منطق الأرصدة والاستحقاقات… أضف
 * اختبارات مستقلة تثبت أن مدرب الموقع لا يُخصم من رصيد العميل، وأن قواعد
 * مدربي الشركات تُطبّق كما صُممت»), reconciled with the MEASURED policy
 * landscape before any change:
 *
 *   - B2B coach (profiles.role='coach' + coach_kind='b2b' — migration
 *     0067's partner model): plan generation burns the CLIENT's unified
 *     monthly pool — the documented owner decrees (2026-09-01 «توليد
 *     الخطط بيتحسب من الرصيد سواء عن طريق المدرب او عن طريق ايفو» +
 *     2026-09-13 «البوول الموحد»). UNCHANGED.
 *   - Site coach (role='coach' + coach_kind='site' — the B2C follow-up
 *     roster): his members ALREADY paid the site (migration 0067's own
 *     rationale: mixing B2C members into the B2B money tables "would
 *     bill site coaches for members who already paid the SITE") — his
 *     generations must NOT burn the member's self-service pool.
 *   - Admin (role='admin' — the site's own staff): STAFF QUOTA SEMANTICS
 *     (the enqueue gate already bypasses every check for admins) — site
 *     work never consumes a client's paid balance. This was the MEASURED
 *     live defect: 18/20 recent plan jobs were admin-requested and every
 *     one burned its client's pool (client 87cd7ba6 lost 5 of 8 units to
 *     admin-driven work in two days).
 *   - Unresolvable requester: NO burn (fail-open on the ledger — never
 *     bills a client when the requester cannot be attributed).
 *
 * The recording itself moved from the processors (inside the job, BEFORE
 * finishJob — a finishJob failure + requeue + re-run burned the pool
 * TWICE) to the runner AFTER finishJob lands `done` — the same
 * success-only, single-record shape recordSwapOnSuccess already has.
 * ─────────────────────────────────────────────────────────────────────────────── */

export type PlanPoolBillingVerdict = {
  /** true = record ONE ai_plan_usage row against the client's pool. */
  bill: boolean;
  /** The policy reason (logged by the runner — auditable). */
  reason: string;
};

/**
 * WHO pays the client's unified plan pool for a successful plan job.
 * Pure function — the runner resolves the requester's profile and hands
 * the two fields in; tests pin the full matrix.
 */
export function planPoolBillingForRequester(
  role: unknown,
  coachKind: unknown,
): PlanPoolBillingVerdict {
  const r = String(role ?? "").trim().toLowerCase();
  const k = String(coachKind ?? "").trim().toLowerCase();
  if (r === "coach") {
    if (k === "site") {
      return { bill: false, reason: "site-coach: B2C follow-up — member already paid the site (0067 law); no client-pool burn" };
    }
    // 'b2b' AND the legacy default (NULL kind → 'b2b' per migration 0067)
    return { bill: true, reason: "b2b-coach: client unified pool per owner decrees 2026-09-01/2026-09-13" };
  }
  if (r === "admin") {
    return { bill: false, reason: "admin: site staff work — staff quota semantics; no client-pool burn" };
  }
  return { bill: false, reason: `unresolved requester role (${r || "none"}) — fail-open, no client-pool burn` };
}

/**
 * Record a swap in the plan_swaps table.
 */
async function recordSwap(
  userId: string,
  swapType: "meal" | "exercise",
): Promise<void> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return;
  const { error } = await supabaseAdmin
    .from("plan_swaps")
    .insert({
      user_id: userId,
      // REGEN-ROOTCAUSE-2 2026-10-26: plan_id is a NULLABLE uuid column —
      // the legacy "api-swap" placeholder failed EVERY insert with
      // «invalid input syntax for type uuid» (measured live in the runner
      // log + the production table had 0 rows ever), so the weekly swap
      // quota ledger stayed empty and client limits were never enforced.
      // NULL is the schema's own "no specific plan" value.
      plan_id: null,
      swap_type: swapType,
    });
  if (error) {
    console.error("[tier-limits] recordSwap error:", error.message);
  }
}
