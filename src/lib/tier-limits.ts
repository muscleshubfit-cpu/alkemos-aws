/**
 * Server-side tier limit helpers.
 *
 * Enforces daily message + swap limits at the API layer (not just
 * client-side). Fixes C15 (EVO chat limit bypassable) and C16
 * (swap limit bypassable).
 *
 * 2026-08-27 CRITICAL FIXES (audit findings G1–G4 — kept; their fixes
 * survive the 2026-11-14 restructure):
 *
 *   G3 — resolveTier() previously trusted unfiltered subscription rows
 *        (expired/pending still granted paid limits). The verified auth
 *        tier from getAuthUser()/requireUser() is passed in by every
 *        caller as `tierHint` and trusted first; fallback re-resolution
 *        queries through the SERVICE-ROLE admin client with the same
 *        active+expiry filters.
 *   G1/G2 — EVO chat daily counting lives in the tamper-proof
 *        `evo_chat_usage` ledger (migration 0022): server-inserted
 *        before dispatch, no client INSERT/DELETE policies — clearing
 *        chat history cannot reset the quota.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AI MONTHLY QUOTAS (owner order 2026-11-14 «إعادة هيكلة سياسة الذكاء
 * الاصطناعي والاشتراكات والأرصدة» + التوضيح المُصحِّح + أمر الاستكمال
 * 2026-11-14 «استكمال تطوير نظام الحصص الشهرية» — حصتان موحدتان فقط،
 * لا أرصدة ولا محافظ ولا تقسيم حسب نوع المحتوى. Governing doc:
 * docs/AI-QUOTAS-POLICY-2026-11-14.md):
 *
 *   1. GENERATION is subscriber-only: free members and guests get the
 *      FREE quota (0) — every generation surface (planner pages, EVO
 *      plan intents, dashboard self-service, coach B2B jobs for
 *      clients) must pass checkUnifiedPlanQuota() first and show the
 *      subscription message when the verdict says subscriptionRequired.
 *      Paid tiers keep the unified monthly quota (premium 4 · pro 8 ·
 *      coaching 8, aggregated stacking — 2026-10-28 law preserved).
 *   2. SWAPS are ONE UNIFIED monthly quota (completion order §1/§2:
 *      «التبديلات حصة موحدة… سواء كانت تبديل وجبة أو تمرين» — the
 *      per-type split is RETIRED): free 0 · premium 8 · pro 16 ·
 *      coaching 16, meal + exercise COMBINED. Generation and swap
 *      quotas are FULLY INDEPENDENT (§2) — exhausting one never gates
 *      the other — and both stack across parallel subscriptions (§4).
 *   3. RENEWAL follows the SUBSCRIPTION CYCLE (§5): every subscription
 *      gets its OWN monthly window anchored at its own start_date
 *      anniversary (anniversary-day windows; calendar-month fallback
 *      when the anchor is unusable). EARLY RENEWAL (§4-أ) extends the
 *      SAME row (extend_subscription 0018 — start_date never moves),
 *      so the current window, its remaining quota and the renewal day
 *      are untouched; the renewal's fresh entitlements arrive with the
 *      next covered window. AN UPGRADE (§4-ب) starts a NEW parallel
 *      subscription (own start_date, own window) while the old one
 *      keeps its quotas and its end_date — the member benefits from
 *      BOTH («يستفيد العميل من حقوق الاشتراكين دون أن يمس أحدهما
 *      الآخر»). Usage inside overlapping windows is attributed FIFO —
 *      EARLIEST-EXPIRING subscription first — so overlap usage can
 *      never eat a longer-lived paid entitlement (no paid quota is
 *      ever lost, §7) and unused quotas expire with their own period
 *      (no rollover, §5).
 *   4. SUCCESS-ONLY + ONCE-ONLY: quota is deducted by inserting ONE
 *      success row (ai_plan_usage / plan_swaps) after the operation
 *      lands; migration 0110 adds a UNIQUE job_ref so a runner re-run
 *      can never record the same job twice. Failures never burn quota.
 *   5. EXHAUSTION (§3): the verdicts carry subscriptionRequired (402)
 *      vs exhausted (429) + renewsAt, and every member-facing surface
 *      offers the EXISTING payment path for renewal/upgrade
 *      (memberships.ts renewalCheckoutUrlFor / upgradeCheckoutUrlFor).
 *
 * RETIRED (this frame): the per-type swap split (13/26 per type) and
 * the single-earliest-anchor window — superseded by the unified swap
 * quota + the per-subscription parallel windows above. Also retired
 * earlier: the weekly swap window (weekStartUtc / countThisWeekSwaps /
 * checkAndRecordSwap — Monday-anchored law of the 2026-09-02 decree).
 * ─────────────────────────────────────────────────────────────────────────
 */

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { MEMBERSHIPS, getLimits, type MembershipTier } from "@/lib/memberships";
import {
  resolveMembershipTier,
  mappedPaidTierOf,
  type SubscriptionTierRow,
} from "@/lib/membership-tier";
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
 * Fallback subscription-rows fetch when a route has no pre-computed
 * auth subs list. Uses the service-role admin client (RLS-bypassing)
 * with the SAME active + expiry filtering the auth entry points apply
 * (status='active' AND end_date > now) — mirrors getAuthUser()'s
 * window in auth-server.ts. start_date rides along for the quota
 * cycle window (the 2026-11-14 renewal law: anniversary-day anchor).
 *
 * Returns null when the admin client is unavailable or the read fails
 * (fail-safe: checkUnifiedPlanQuota then falls back to the single-tier
 * hint pool — never to unlimited, never above the entitlement).
 */
export type SubRowWithStart = SubscriptionTierRow & { start_date: string | null };

async function fetchActiveSubTierRows(
  userId: string,
): Promise<SubRowWithStart[] | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("tier, status, end_date, start_date")
      .eq("client_id", userId)
      .eq("status", "active")
      .gt("end_date", new Date().toISOString());
    if (error) {
      console.error("[tier-limits] fetchActiveSubTierRows error:", error.message);
      return null;
    }
    return (data ?? []) as SubRowWithStart[];
  } catch (e) {
    console.error(
      "[tier-limits] fetchActiveSubTierRows error:",
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

/**
 * The QUOTA-engine rows fetch (completion order §4/§5): effectively-active
 * paid rows PLUS recently-expired ones (status still 'active', end_date
 * within the GHOST_LOOKBACK window) — the expired rows feed the GHOST
 * buckets that keep absorbing the usage they paid for (the no-loss
 * guarantee). Callers derive the display tier / subscriptionRequired from
 * the LIVE subset (end_date > now), never from the ghosts.
 *
 * Returns null on read failure — same fail-safe contract as the active
 * fetch (the single-tier hint fallback, never unlimited).
 */
async function fetchQuotaSubRows(
  userId: string,
): Promise<SubRowWithStart[] | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  try {
    const ghostBound = new Date(Date.now() - GHOST_LOOKBACK_MS).toISOString();
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("tier, status, end_date, start_date")
      .eq("client_id", userId)
      .eq("status", "active")
      .gt("end_date", ghostBound);
    if (error) {
      console.error("[tier-limits] fetchQuotaSubRows error:", error.message);
      return null;
    }
    return (data ?? []) as SubRowWithStart[];
  } catch (e) {
    console.error(
      "[tier-limits] fetchQuotaSubRows error:",
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

/** The LIVE subset of quota rows (end_date > now) — display tier + the
 *  subscriber-only branch read this, ghosts never leak into either. */
function liveRowsOf(rows: ReadonlyArray<SubRowWithStart>): SubRowWithStart[] {
  const nowMs = Date.now();
  return rows.filter((r) => {
    const endMs = new Date(r.end_date ?? 0).getTime();
    return Number.isFinite(endMs) && endMs > nowMs;
  });
}

/**
 * Best-tier DB fallback for the FEATURE limits (EVO chat daily + monthly
 * swaps — best-membership semantics, NOT the plan pool). Returns "free"
 * when the rows are unreadable — an unknown user never inherits premium
 * limits (fail-safe, unchanged).
 */
async function resolveTierFromDb(userId: string): Promise<MembershipTier> {
  const rows = await fetchActiveSubTierRows(userId);
  if (!rows) return "free";
  return resolveMembershipTier("client", rows);
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
 * Get the UNIFIED monthly swap limit for a tier (completion order
 * 2026-11-14 §1: meal + exercise swaps COMBINED — the per-type split is
 * retired). Returns null = unlimited.
 *
 * Maps membership tiers to swap quotas:
 *   free:     0 (no swaps)
 *   premium:  8/month
 *   pro:      16/month
 *   coaching: 16/month (inherits every Pro benefit — Phase 183)
 */
export function swapLimitForTier(tier: MembershipTier): number | null {
  // Single source of truth = memberships.ts (evoSwapMonthlyLimit).
  return getLimits(tier).evoSwapMonthlyLimit;
}

/**
 * UNIFIED monthly AI plan-generation pool (owner decree 2026-09-13
 * «البوول الموحد» — spec "Alkemos — Membership & Plan Changes").
 * ONE budget per identity for nutrition + workout COMBINED:
 *   free 0 · premium 4 · pro 8 · coaching 8 (coaching = every Pro
 *   benefit). Subscriber-only since 2026-11-14 (free = 0).
 * Reads aiPlanMonthlyLimit straight from memberships.ts so the
 * advertised numbers ARE the enforced numbers.
 *
 * MEMBERS (owner order 2026-10-28 «تجميع حصص الاشتراكات المدفوعة» +
 * completion order 2026-11-14 §4): the enforced member limit is the
 * AGGREGATE over every distinct active paid tier — one parallel bucket
 * per subscription (quotaBucketsForSubs below, whose Σ limit equals
 * resolveUnifiedPlanPoolLimit in membership-tier.ts, the pure-law twin);
 * this per-tier helper remains the building block + the fail-safe
 * fallback when the subscription rows cannot be read (never above the
 * entitlement, never unlimited).
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
 * Count this window's SUCCESSFUL AI plan generations for one identity
 * (member userId OR guestKey/ipKey — several dimensions may be given;
 * the result is the MAX across them, the G6 dual-dimension law). The
 * ledger is ai_plan_usage (migration 0085 + 0086): a row exists ONLY
 * after a plan was generated AND validated — failed attempts, input
 * edits, navigation, or re-viewing an existing plan never burn the quota.
 */
export async function countUnifiedPlanUsage(identity: {
  userId?: string | null;
  guestKey?: string | null;
  ipKey?: string | null;
  windowStartIso?: string | null;
}): Promise<number> {
  const dims: Array<["user_id" | "guest_key" | "ip_key", string]> = [];
  if (identity.userId) dims.push(["user_id", identity.userId]);
  if (identity.guestKey) dims.push(["guest_key", identity.guestKey]);
  if (identity.ipKey) dims.push(["ip_key", identity.ipKey]);
  if (dims.length === 0) return 0;
  const counts = await Promise.all(
    dims.map(([col, val]) =>
      countPlanRowsBy(col, val, identity.windowStartIso ?? monthStartUtc()),
    ),
  );
  return Math.max(...counts);
}

/** One dimension → the window's success-row count (head count query). */
async function countPlanRowsBy(
  column: "user_id" | "guest_key" | "ip_key",
  value: string,
  windowStartIso: string,
): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const { count, error } = await supabaseAdmin
    .from("ai_plan_usage")
    .select("*", { count: "exact", head: true })
    .eq(column, value)
    .gte("created_at", windowStartIso);
  if (error) {
    console.error("[tier-limits] countPlanRowsBy error:", error.message);
    return 0; // fail open on counting errors — soft quota, same as chat
  }
  return count ?? 0;
}

/** Verdict for the unified quota — what enforcement AND display read. */
export type UnifiedPlanQuotaVerdict = {
  allowed: boolean;
  used: number; // successful generations this window (combined kinds)
  limit: number; // the tier's unified monthly quota size
  remaining: number;
  unlimited: boolean; // staff semantics — never limited, still recorded
  tier: MembershipTier | "guest";
  /**
   * WHY the caller was blocked — routes pick the error copy from it.
   *   "subscription_required" → free member / guest: generation is
   *     subscriber-only (2026-11-14 order) → subscribe CTA + 402.
   *   "pool" → a subscriber whose monthly quota is exhausted → 429.
   *   "network" → legacy guest-dimension copy (kept for API shape
   *     compatibility; unreachable while the free quota is 0).
   * null when allowed / staff.
   */
  reason: "pool" | "network" | "subscription_required" | null;
  /** true when limit === 0 (no active paid subscription) — the 402 flag. */
  subscriptionRequired: boolean;
  /** When the current window renews (ISO) — display surfaces read it. */
  renewsAt: string | null;
};

/**
 * THE unified-quota gate (owner decree 2026-09-13 + aggregation order
 * 2026-10-28 + subscriber-only correction 2026-11-14 + completion order
 * 2026-11-14 parallel entitlements).
 *
 * Identity resolution:
 *   - userId             → member quota = ONE bucket per distinct paid
 *     tier held as an effectively-active subscription (rows read via the
 *     service-role admin client with the SAME active+expiry filters as
 *     getAuthUser(); `tierHint` stays the display-tier hint and the
 *     fail-safe single-tier fallback when the rows are unreadable —
 *     never unlimited, never above the entitlement).
 *     FREE members resolve to the FREE quota (0) → blocked with
 *     subscriptionRequired (generation is subscriber-only).
 *   - guests (no userId)  → the FREE quota (0) → blocked with
 *     subscriptionRequired (the subscribe CTA; no guest generation
 *     path exists under the 2026-11-14 policy).
 *   - staffHint          → unlimited (STAFF QUOTA SEMANTICS; usage is
 *     still recorded for analytics).
 *
 * RENEWAL (completion order §4/§5): every subscription's window is its
 * OWN start_date-anniversary month (quotaBucketsForSubs below) — quotas
 * renew with each subscription's own cycle, never the calendar month.
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
      subscriptionRequired: false, renewsAt: null,
    };
  }
  if (opts.userId) {
    // PARALLEL-ENTITLEMENT LAW (completion order 2026-11-14 §4/§5): one
    // bucket per distinct effectively-active paid subscription (plus
    // GHOST buckets for recently-expired ones — see quotaBucketsForSubs),
    // window anchored at that subscription's OWN start_date anniversary,
    // usage attributed FIFO (earliest-expiring subscription first). Early
    // renewal (same row extended) never moves the window — remaining
    // quota is untouched; an upgrade adds a parallel bucket without
    // touching the old one; when the old subscription expires its ghost
    // keeps absorbing the usage it paid for, so nothing paid is lost.
    const rows = await fetchQuotaSubRows(opts.userId);
    const liveRows = rows !== null ? liveRowsOf(rows) : null;
    const hintTier = sanitizeTier(opts.tierHint);
    const tier: MembershipTier = hintTier
      ?? (liveRows ? resolveMembershipTier("client", liveRows) : "free");
    const buckets = quotaBucketsForSubs(rows, (t) => unifiedPlanPoolFor(t));
    if (buckets.length > 0) {
      const since = earliestBucketWindowStart(buckets);
      // Read failure → count 0 (soft quota — same convention as the
      // retired head-count query; a transient read never blocks a member).
      const usage = await fetchUsageTimestamps("ai_plan_usage", opts.userId, since);
      attributeUsageFifo(buckets, usage ?? []);
      const v = bucketVerdict(buckets);
      if (v.limit === 0) {
        // Only ghost buckets (everything expired) — no live paid tier:
        // generation is subscriber-only.
        return {
          allowed: false, used: 0, limit: 0, remaining: 0, unlimited: false,
          tier, reason: "subscription_required", subscriptionRequired: true,
          renewsAt: null,
        };
      }
      return {
        allowed: v.remaining > 0,
        used: v.used,
        limit: v.limit,
        remaining: v.remaining,
        unlimited: false,
        tier,
        reason: null,
        subscriptionRequired: false,
        renewsAt: v.renewsAt,
      };
    }
    if (rows !== null) {
      // Rows readable but NO active paid tier → the FREE quota (0 —
      // generation is subscriber-only; the hint can never out-grant the DB).
      return {
        allowed: false, used: 0, limit: 0, remaining: 0, unlimited: false,
        tier, reason: "subscription_required", subscriptionRequired: true,
        renewsAt: null,
      };
    }
    // Fail-safe: rows unavailable (admin client unconfigured / read
    // error) → the single-tier hint quota at most, calendar-month window
    // — NEVER unlimited and never above the entitled aggregate (a
    // stacked member is briefly under-granted on a transient read
    // failure, never over-granted).
    const failSafeLimit = unifiedPlanPoolFor(hintTier ?? "free");
    if (failSafeLimit <= 0) {
      return {
        allowed: false, used: 0, limit: 0, remaining: 0, unlimited: false,
        tier, reason: "subscription_required", subscriptionRequired: true,
        renewsAt: null,
      };
    }
    const failSafeStart = monthStartUtc();
    const failSafeUsage = await fetchUsageTimestamps("ai_plan_usage", opts.userId, failSafeStart);
    const failSafeUsed = failSafeUsage?.length ?? 0;
    return {
      allowed: failSafeUsed < failSafeLimit,
      used: failSafeUsed,
      limit: failSafeLimit,
      remaining: Math.max(0, failSafeLimit - failSafeUsed),
      unlimited: false,
      tier,
      reason: null,
      subscriptionRequired: false,
      renewsAt: addMonthsIso(failSafeStart, 1),
    };
  }
  // Guest (2026-11-14 subscriber-only correction): the FREE quota is 0 —
  // guests have NO generation path. The G6 dual-dimension counters are
  // retired for enforcement (limit 0 blocks unconditionally); the reason
  // is the subscription_required copy so every surface shows the same
  // honest subscribe CTA.
  return {
    allowed: false,
    used: 0,
    limit: unifiedPlanPoolFor("free"),
    remaining: 0,
    unlimited: false,
    tier: "guest",
    reason: "subscription_required",
    subscriptionRequired: true,
    renewsAt: null,
  };
}

/**
 * Record ONE successful generation into the unified ledger.
 * Called ONLY after the plan was generated and validated — the
 * success-only convention the 2026-09-13 spec demands (failed
 * attempts never burn quota). Errors are logged but never thrown:
 * a ledger hiccup must not break the member's generated plan (soft
 * quota, same convention as the chat counters).
 *
 * MIGRATION 0110 (2026-11-14): `jobRef` (the originating ai_jobs.id) is
 * UNIQUE in the ledger — a runner re-run after `done` dies on the
 * unique index and skips here (logged), so a successful job deducts
 * the quota EXACTLY ONCE, structurally. Sync surfaces (planner pages,
 * EVO intents) pass no jobRef and record once per request as before.
 */
export async function recordUnifiedPlanUsage(opts: {
  userId?: string | null;
  guestKey?: string | null;
  ipKey?: string | null;
  kind: EvoPlanKind;
  surface?: PlanSurface;
  jobRef?: string | null;
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
    job_ref: opts.jobRef ?? null,
  });
  if (error) {
    console.error("[tier-limits] recordUnifiedPlanUsage error:", error.message);
  }
}

/** UTC month start — the CALENDAR-MONTH FALLBACK window (analytics +
 * users with no usable subscription anchor). */
export function monthStartUtc(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

/* ─────────────── SUBSCRIPTION-CYCLE QUOTA WINDOWS (2026-11-14) ───────────────
 * «تجديد الحصص وفق دورة الاشتراك الحالية»: quota windows renew with the
 * subscription's own monthly cycle, not the calendar month. start_date is
 * set ONCE at first purchase (extend_subscription 0018 only extends
 * end_date), so the DAY-OF-MONTH of the earliest effectively-active paid
 * subscription's start_date is the stable anniversary anchor: a member
 * who subscribed on the 15th gets quota windows [15th → 15th).
 */

/** Days in a UTC month (handles leap years). */
function daysInUtcMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** ISO instant + N months (UTC, clamped to the target month's length). */
function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getUTCDate();
  const targetTotal = d.getUTCMonth() + months;
  const targetYear = d.getUTCFullYear() + Math.floor(targetTotal / 12);
  const targetMonth = ((targetTotal % 12) + 12) % 12;
  const clampedDay = Math.min(day, daysInUtcMonth(targetYear, targetMonth));
  return new Date(
    Date.UTC(targetYear, targetMonth, clampedDay,
      d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()),
  ).toISOString();
}

/**
 * PURE: the current subscription-cycle window start for an anchor
 * start_date — the most recent occurrence of the anchor's day-of-month
 * at or before `now` (clamped to month length; Feb 31st → Feb 28/29).
 * Falls back to the calendar-month start when the anchor is unusable
 * (null / unparseable / in the future).
 */
export function cycleWindowStartUtc(
  anchorStartDate: string | null | undefined,
  now: Date = new Date(),
): string {
  const calendarStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
  if (!anchorStartDate) return calendarStart;
  const anchor = new Date(anchorStartDate);
  if (Number.isNaN(anchor.getTime())) return calendarStart;
  const anchorDay = anchor.getUTCDate();
  const nowUtc = Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
  );
  const clamp = (y: number, m: number) =>
    Date.UTC(y, m, Math.min(anchorDay, daysInUtcMonth(y, m)));
  // Candidate in the current month; if it is still ahead of now, the
  // window is last month's occurrence (still inside the paid period).
  let startMs = clamp(now.getUTCFullYear(), now.getUTCMonth());
  if (startMs > nowUtc) {
    const prevTotal = now.getUTCMonth() - 1;
    const prevYear = now.getUTCFullYear() + Math.floor(prevTotal / 12);
    const prevMonth = ((prevTotal % 12) + 12) % 12;
    startMs = clamp(prevYear, prevMonth);
  }
  return new Date(startMs).toISOString();
}

/**
 * The EARLIEST start_date among a member's effectively-active PAID rows
 * (the original subscription relationship — the stable anniversary
 * anchor; stacking a second tier later never moves the renewal day).
 * Unknown/legacy-free rows contribute nothing (paid tiers only — the
 * same POOL_TIERS set the aggregate law uses).
 */
const PAID_ANCHOR_TIERS: ReadonlySet<string> = new Set([
  "premium", "pro", "coaching", "starter", "elite", // 0045 legacy included
]);

export function earliestPaidStartIso(
  rows: ReadonlyArray<SubRowWithStart> | null | undefined,
): string | null {
  if (!rows || rows.length === 0) return null;
  let earliest: string | null = null;
  for (const r of rows) {
    if (r.status !== "active" || !r.end_date) continue;
    if (!PAID_ANCHOR_TIERS.has(r.tier)) continue;
    const endMs = new Date(r.end_date).getTime();
    if (!Number.isFinite(endMs) || endMs <= Date.now()) continue;
    const startIso = r.start_date;
    if (!startIso) continue;
    const startMs = new Date(startIso).getTime();
    if (!Number.isFinite(startMs)) continue;
    if (earliest === null || startMs < new Date(earliest).getTime()) {
      earliest = startIso;
    }
  }
  return earliest;
}

/**
 * Window start for a member's quota: the subscription-cycle anchor when
 * usable, else the calendar month. rows === null (read failure) → the
 * calendar month (fail-safe — a transient read never widens a window).
 */
export function quotaWindowStartForSubs(
  rows: ReadonlyArray<SubRowWithStart> | null | undefined,
  now: Date = new Date(),
): string {
  return cycleWindowStartUtc(earliestPaidStartIso(rows), now);
}

/* ─────────────── PARALLEL-ENTITLEMENT BUCKETS (completion order 2026-11-14 §4/§5)
 *
 * «الاستحقاقات المتوازية»: every effectively-active paid subscription
 * contributes ONE bucket = {its OWN start_date-anniversary monthly window,
 * its tier's monthly quota, its end_date}. The member's verdict is the
 * SUM over buckets with usage attributed FIFO — each success row lands in
 * the EARLIEST-EXPIRING bucket whose window contains it and that still
 * has capacity. This is the whole "accounting": a pure function over the
 * existing ledgers (no new tables, no per-subscription balances, no
 * wallets — «أبسط بنية ممكنة»), and it satisfies every order invariant:
 *
 *   - EARLY RENEWAL (§4-أ): extend_subscription keeps the SAME row and
 *     its start_date → the SAME window, the SAME remaining quota —
 *     nothing resets, nothing is lost; the extended end_date simply
 *     keeps the bucket alive through the windows the renewal paid for.
 *   - UPGRADE (§4-ب): the new tier is a NEW row with its OWN start_date
 *     → its own window from the purchase date; the old row's bucket,
 *     quotas and end_date are untouched («دون أن يمس أحدهما الآخر»).
 *   - OLD SUB EXPIRES — GHOST BUCKETS (the no-loss guarantee, §7): a
 *     recently-expired paid row keeps GHOST buckets (capacity = its paid
 *     quota, window clamped to its lifetime) that still ABSORB the usage
 *     rows they paid for but contribute ZERO to the available limit.
 *     Without them, overlap usage would re-attribute to the surviving
 *     subscription the moment the old row expires — the exact
 *     «تضيع استحقاقات مدفوعة» defect («استخدم 6 خلال التداخل ثم فقد 4 من
 *     حصة الجديد»). Ghosts die on their own: their capacity only covers
 *     windows they actually lived, and no bucket ever counts rows from a
 *     past window (no rollover, §5).
 *   - NO ROLLOVER (§5): usage before a bucket's window start belongs to
 *     a past window of that subscription and can never consume it.
 *   - STACKING (2026-10-28 law): Σ live buckets = the aggregate limit
 *     (premium 4+8 alongside pro 8+16 for the overlap).
 */
export type QuotaBucket = {
  /** The bucket's monthly window start (ISO) — the sub's own anniversary. */
  windowStart: string;
  /** windowStart + 1 month (ISO) — the next renewal of THIS bucket
   *  (ghost buckets clamp to the sub's end_date — they die with it). */
  windowEnd: string;
  /** The tier's monthly quota — CAPACITY for attribution. */
  limit: number;
  /** The subscription's end_date — the FIFO order key. */
  subEnd: string;
  /** Units consumed inside this bucket's window after FIFO attribution. */
  used: number;
  /** GHOST (the sub already expired): absorbs the usage it paid for but
   *  contributes ZERO to the available limit — never grants anything. */
  ghost: boolean;
};

/** How far back a recently-expired paid row can still matter: any monthly
 *  window is ≤ 31 days, so a ghost whose end_date is older than 45 days
 *  can never intersect the fetched usage range. */
const GHOST_LOOKBACK_MS = 45 * 86400000;

/**
 * Build the bucket set from paid subscription rows (live + recent ghosts;
 * see fetchQuotaSubRows). LIVE rows: ONE bucket per distinct mapped tier
 * (stray duplicate rows fold: earliest start, latest end). GHOST rows
 * (expired within the lookback, no live sibling of the same tier): one
 * bucket per monthly window they lived that intersects the live windows'
 * range — capacity = the paid quota, windowEnd clamped to the death date.
 * Sorted by subEnd ASC (the FIFO order — earliest-expiring absorbed
 * first, ghosts naturally sorting before longer-lived live buckets).
 */
export function quotaBucketsForSubs(
  rows: ReadonlyArray<SubRowWithStart> | null | undefined,
  quotaOf: (tier: MembershipTier) => number,
  now: Date = new Date(),
): QuotaBucket[] {
  if (!rows || rows.length === 0) return [];
  const nowMs = now.getTime();
  // Pass 1 — live rows per distinct mapped tier (earliest start, latest end).
  const liveByTier = new Map<MembershipTier, { start: string | null; end: string }>();
  // Ghost candidates: expired within the lookback, per distinct mapped tier.
  const ghostByTier = new Map<MembershipTier, { start: string | null; end: string }>();
  for (const r of rows) {
    if (r.status !== "active" || !r.end_date) continue;
    const endMs = new Date(r.end_date).getTime();
    if (!Number.isFinite(endMs)) continue;
    const tier = mappedPaidTierOf(r.tier);
    if (!tier) continue;
    const limit = quotaOf(tier);
    if (limit <= 0) continue; // defensive: a zero-quota tier adds nothing
    const isLive = endMs > nowMs;
    const map = isLive ? liveByTier : ghostByTier;
    if (isLive && ghostByTier.has(tier)) ghostByTier.delete(tier); // a live sibling wins
    if (!isLive && liveByTier.has(tier)) continue; // stray expired duplicate under a live row
    if (!isLive && endMs <= nowMs - GHOST_LOOKBACK_MS) continue; // too old to matter
    const prev = map.get(tier);
    if (!prev) {
      map.set(tier, { start: r.start_date ?? null, end: r.end_date });
      continue;
    }
    // Duplicate rows of the same mapped tier: earliest start, latest end.
    if (r.start_date && (!prev.start || new Date(r.start_date).getTime() < new Date(prev.start).getTime())) {
      prev.start = r.start_date;
    }
    if (endMs > new Date(prev.end).getTime()) prev.end = r.end_date;
  }

  const buckets: QuotaBucket[] = [];
  for (const [tier, { start, end }] of liveByTier) {
    const windowStart = cycleWindowStartUtc(start, now);
    buckets.push({
      windowStart,
      windowEnd: addMonthsIso(windowStart, 1),
      limit: quotaOf(tier),
      subEnd: end,
      used: 0,
      ghost: false,
    });
  }
  // The ghost relevance bound: the earliest LIVE window start (ghosts
  // only need to absorb rows the live buckets could otherwise steal).
  let sinceMs: number | null = null;
  for (const b of buckets) {
    const ms = new Date(b.windowStart).getTime();
    if (sinceMs === null || ms < sinceMs) sinceMs = ms;
  }
  const monthMs = 30 * 86400000; // walk-back step (approx; clamps fix edges)
  for (const [tier, { start, end }] of ghostByTier) {
    const endMs = new Date(end).getTime();
    const quota = quotaOf(tier);
    // The window containing the sub's last live instant…
    let w = new Date(cycleWindowStartUtc(start, new Date(Math.min(nowMs, endMs) - 1))).getTime();
    // …plus earlier lived windows, while they still intersect [since, now].
    let guard = 0;
    while (w + monthMs > (sinceMs ?? nowMs) && guard < 4) {
      guard += 1;
      const windowStartIso = new Date(w).toISOString();
      const windowEndMs = Math.min(new Date(addMonthsIso(windowStartIso, 1)).getTime(), endMs);
      if (windowEndMs > (sinceMs ?? nowMs)) {
        buckets.push({
          windowStart: windowStartIso,
          windowEnd: new Date(windowEndMs).toISOString(),
          limit: quota,
          subEnd: end,
          used: 0,
          ghost: true,
        });
      }
      w -= monthMs;
    }
  }
  buckets.sort((a, b) => new Date(a.subEnd).getTime() - new Date(b.subEnd).getTime());
  return buckets;
}

/** The earliest window start among buckets — the usage-fetch lower bound
 *  (ghost windows included: their rows must be fetched so they can absorb
 *  them). */
export function earliestBucketWindowStart(buckets: ReadonlyArray<QuotaBucket>): string {
  let earliest: string | null = null;
  for (const b of buckets) {
    if (earliest === null || new Date(b.windowStart).getTime() < new Date(earliest).getTime()) {
      earliest = b.windowStart;
    }
  }
  return earliest ?? monthStartUtc();
}

/**
 * Attribute usage rows to buckets, FIFO by subscription end_date: each
 * timestamp consumes ONE unit from the earliest-expiring bucket whose
 * window contains it and that still has capacity. Rows that fit no
 * window (past windows — never fetched) or no capacity (overage races)
 * are ignored — the verdict can only under-count those, never a paid
 * entitlement. Ghost buckets absorb exactly like live ones (that is
 * their whole job) — they just never add to the available limit.
 */
export function attributeUsageFifo(
  buckets: QuotaBucket[],
  usageTimestamps: ReadonlyArray<string | Date>,
): QuotaBucket[] {
  const sorted = usageTimestamps
    .map((t) => new Date(t).getTime())
    .filter((ms) => Number.isFinite(ms))
    .sort((a, b) => a - b);
  for (const ts of sorted) {
    for (const b of buckets) {
      if (ts >= new Date(b.windowStart).getTime() && ts < new Date(b.windowEnd).getTime()) {
        if (b.used < b.limit) {
          b.used += 1;
          break;
        }
      }
    }
  }
  return buckets;
}

/** The aggregated verdict over buckets: Σ limit (LIVE buckets only —
 * ghosts never grant), the LIVE consumption (ghost-absorbed units left
 * with the subscription that paid for them — they never count against a
 * live entitlement), remaining, and the SOONEST LIVE window end (when
 * the member's next quota refresh lands). */
export function bucketVerdict(buckets: ReadonlyArray<QuotaBucket>): {
  used: number;
  limit: number;
  remaining: number;
  renewsAt: string | null;
} {
  let used = 0;
  let limit = 0;
  let renewsAt: string | null = null;
  for (const b of buckets) {
    if (b.ghost) continue; // absorbs usage, never grants and never counts
    used += b.used;
    limit += b.limit;
    if (renewsAt === null || new Date(b.windowEnd).getTime() < new Date(renewsAt).getTime()) {
      renewsAt = b.windowEnd;
    }
  }
  return { used, limit, remaining: Math.max(0, limit - used), renewsAt };
}

/**
 * Fetch a member's success-ledger timestamps since an instant (the FIFO
 * engine needs WHEN each unit landed, not just how many). Returns null
 * on read failure — callers treat null as "count 0" (soft quota, the
 * same fail-open convention the retired head-count query had).
 */
async function fetchUsageTimestamps(
  table: "ai_plan_usage" | "plan_swaps",
  userId: string,
  sinceIso: string,
): Promise<string[] | null> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(400);
  if (error) {
    console.error(`[tier-limits] fetchUsageTimestamps(${table}) error:`, error.message);
    return null;
  }
  return (data ?? []).map((r: { created_at?: string | null }) => r.created_at ?? "").filter(Boolean);
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
 * Count this QUOTA WINDOW's swaps for a user — UNIFIED across types
 * (completion order 2026-11-14 §2: meal + exercise swap rows all draw
 * from the ONE quota; the swap_type column stays in the ledger for
 * analytics only). Uses the plan_swaps ledger + the per-subscription
 * cycle windows — display and enforcement share this exact math.
 */
export async function countCycleSwaps(userId: string): Promise<number> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return 0;
  const rows = await fetchQuotaSubRows(userId);
  const buckets = quotaBucketsForSubs(rows, (t) => swapLimitForTier(t) ?? 0);
  const since = buckets.length > 0 ? earliestBucketWindowStart(buckets) : monthStartUtc();
  const { count, error } = await supabaseAdmin
    .from("plan_swaps")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) {
    console.error("[tier-limits] countCycleSwaps error:", error.message);
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

/* ─────────── RETIRED (2026-11-14): checkAndRecordSwap — the weekly
 * check+insert pair (Monday-anchored). Superseded by checkSwapQuota
 * (check-only, monthly subscription-cycle window) + the runner's
 * success-only recordSwapUsage — a permanently failed regeneration never
 * burns quota (the 2026-10-24 law, carried forward).
 * ─────────────────────────────────────────────────────────────── */

/**
 * AI-PLAN-QUALITY 2026-10-24 (owner order item 4 — «تحديث الحصص المدفوعة
 * بصورة صحيحة») + AI-QUOTAS 2026-11-14 completion order: CHECK-ONLY quota
 * gate for the member swap enqueue. The monthly swap quota is recorded
 * ONLY when the regeneration job actually SUCCEEDS (the runner calls
 * recordSwapUsage after finishJob) — a permanently FAILED regeneration
 * never burns a paid unit. Semantics mirror the unified plan quota
 * (success-only). The soft-limit race window (count + no insert) keeps
 * the documented 1-off overage parity of the old check+insert pair.
 *
 * UNIFIED MONTHLY QUOTA (completion order §1/§2): ONE quota for meal +
 * exercise swaps COMBINED (free 0 · premium 8 · pro 16 · coaching 16)
 * — the per-type split is retired. The quota rides the SAME
 * parallel-entitlement bucket engine as generation (per-subscription
 * windows + FIFO attribution + stacking, §4/§5) and is FULLY
 * INDEPENDENT from the generation quota (§2 — exhausting one never
 * gates the other). The `swapType` parameter is kept for call-site
 * compatibility; the counting is unified and never filters by it.
 */
export type SwapQuotaVerdict = {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number;
  unlimited: boolean;
  /** true when the tier's quota is 0 (free) — swaps are subscriber-only. */
  subscriptionRequired: boolean;
  /** When the current window renews (ISO) — display surfaces read it. */
  renewsAt: string | null;
};

export async function checkSwapQuota(
  userId: string,
  _swapType: "meal" | "exercise",
  tierHint?: string | null,
  staffHint?: boolean,
): Promise<SwapQuotaVerdict> {
  if (staffHint) {
    return { allowed: true, used: 0, limit: null, remaining: 0, unlimited: true, subscriptionRequired: false, renewsAt: null };
  }
  const rows = await fetchQuotaSubRows(userId);
  const liveRows = rows !== null ? liveRowsOf(rows) : null;
  const hintTier = sanitizeTier(tierHint);
  const tier: MembershipTier = hintTier
    ?? (liveRows ? resolveMembershipTier("client", liveRows) : "free");
  const buckets = quotaBucketsForSubs(rows, (t) => swapLimitForTier(t) ?? 0);
  if (buckets.length > 0) {
    const since = earliestBucketWindowStart(buckets);
    // Read failure → count 0 (soft quota — same convention as generation).
    const usage = await fetchUsageTimestamps("plan_swaps", userId, since);
    attributeUsageFifo(buckets, usage ?? []);
    const v = bucketVerdict(buckets);
    if (v.limit === 0) {
      // Only ghosts — no live paid tier: swaps are subscriber-only.
      return { allowed: false, used: 0, limit: 0, remaining: 0, unlimited: false, subscriptionRequired: true, renewsAt: null };
    }
    return {
      allowed: v.remaining > 0,
      used: v.used,
      limit: v.limit,
      remaining: v.remaining,
      unlimited: false,
      subscriptionRequired: false,
      renewsAt: v.renewsAt,
    };
  }
  if (rows !== null) {
    // Rows readable but NO active paid tier → swaps are subscriber-only.
    return { allowed: false, used: 0, limit: 0, remaining: 0, unlimited: false, subscriptionRequired: true, renewsAt: null };
  }
  // Fail-safe: rows unreadable → the single-tier hint quota at most,
  // calendar-month window (never unlimited, never above the entitlement).
  const failSafeLimit = swapLimitForTier(hintTier ?? "free");
  if (failSafeLimit === null) {
    return { allowed: true, used: 0, limit: null, remaining: 0, unlimited: true, subscriptionRequired: false, renewsAt: null };
  }
  if (failSafeLimit === 0) {
    return { allowed: false, used: 0, limit: 0, remaining: 0, unlimited: false, subscriptionRequired: true, renewsAt: null };
  }
  const failSafeStart = monthStartUtc();
  const failSafeUsage = await fetchUsageTimestamps("plan_swaps", userId, failSafeStart);
  const failSafeUsed = failSafeUsage?.length ?? 0;
  return {
    allowed: failSafeUsed < failSafeLimit,
    used: failSafeUsed,
    limit: failSafeLimit,
    remaining: Math.max(0, failSafeLimit - failSafeUsed),
    unlimited: false,
    subscriptionRequired: false,
    renewsAt: addMonthsIso(failSafeStart, 1),
  };
}

/**
 * Record a SUCCESSFUL swap in the plan_swaps table — called by the GHA
 * runner after a meal_regenerate / exercise_regenerate job lands `done`
 * (success-only quota law). Fail-soft by inheritance (recordSwap swallows
 * its own errors).
 *
 * MIGRATION 0110 (2026-11-14): jobRef is UNIQUE in the ledger — a runner
 * re-run after `done` dies on the unique index and returns false, so a
 * successful swap deducts the quota EXACTLY ONCE, structurally.
 */
export async function recordSwapUsage(
  userId: string,
  swapType: "meal" | "exercise",
  jobRef?: string | null,
): Promise<boolean> {
  return recordSwap(userId, swapType, jobRef);
}

/* ─────────────── PLAN-QUOTA ATTRIBUTION POLICY (PLAN-REGEN-CONSTRAINTS 2026-10-24
 * + AI-QUOTAS 2026-11-14 client self-service branch)
 *
 * OWNER ORDER 2026-10-24 item 3 («تصحيح منطق الأرصدة والاستحقاقات… أضف
 * اختبارات مستقلة تثبت أن مدرب الموقع لا يُخصم من رصيد العميل، وأن قواعد
 * مدربي الشركات تُطبّق كما صُممت»), reconciled with the MEASURED policy
 * landscape before any change:
 *
 *   - B2B coach (profiles.role='coach' + coach_kind='b2b' — migration
 *     0067's partner model): plan generation burns the CLIENT's unified
 *     monthly quota — the documented owner decrees (2026-09-01 «توليد
 *     الخطط بيتحسب من الرصيد سواء عن طريق المدرب او عن طريق ايفو» +
 *     2026-09-13 «البوول الموحد»). UNCHANGED.
 *   - Site coach (role='coach' + coach_kind='site' — the B2C follow-up
 *     roster): his members ALREADY paid the site (migration 0067's own
 *     rationale: mixing B2C members into the B2B money tables "would
 *     bill site coaches for members who already paid the SITE") — his
 *     generations must NOT burn the member's self-service quota.
 *   - Admin (role='admin' — the site's own staff): STAFF QUOTA SEMANTICS
 *     (the enqueue gate already bypasses every check for admins) — site
 *     work never consumes a client's quota. This was the MEASURED
 *     live defect: 18/20 recent plan jobs were admin-requested and every
 *     one burned its client's pool (client 87cd7ba6 lost 5 of 8 units to
 *     admin-driven work in two days).
 *   - CLIENT self-service (2026-11-14 — the NEW dashboard generation
 *     path): a member generating for HIMSELF (the enqueue route enforces
 *     payload.clientId === requester) BILLS the member's own quota —
 *     the self-service twin of the b2b-coach law.
 *   - Unresolvable requester: NO burn (fail-open on the ledger — never
 *     bills a client when the requester cannot be attributed).
 *
 * The recording itself lives in the runner AFTER finishJob lands `done`
 * (2026-10-24 law) — success-only, single-record (0110's job_ref now
 * enforces the single-record part structurally).
 * ─────────────────────────────────────────────────────────────────────────────── */

export type PlanPoolBillingVerdict = {
  /** true = record ONE ai_plan_usage row against the client's quota. */
  bill: boolean;
  /** The policy reason (logged by the runner — auditable). */
  reason: string;
};

/**
 * WHO pays the client's unified plan quota for a successful plan job.
 * Pure function — the enqueue gate and the runner resolve the
 * requester's profile and hand the two fields in; tests pin the matrix.
 */
export function planPoolBillingForRequester(
  role: unknown,
  coachKind: unknown,
): PlanPoolBillingVerdict {
  const r = String(role ?? "").trim().toLowerCase();
  const k = String(coachKind ?? "").trim().toLowerCase();
  if (r === "coach") {
    if (k === "site") {
      return { bill: false, reason: "site-coach: B2C follow-up — member already paid the site (0067 law); no client-quota burn" };
    }
    // 'b2b' AND the legacy default (NULL kind → 'b2b' per migration 0067)
    return { bill: true, reason: "b2b-coach: client unified quota per owner decrees 2026-09-01/2026-09-13" };
  }
  if (r === "admin") {
    return { bill: false, reason: "admin: site staff work — staff quota semantics; no client-quota burn" };
  }
  if (r === "client") {
    // 2026-11-14: member self-service generation (dashboard Plans section)
    // — the route guarantees clientId === requester; his own quota burns.
    return { bill: true, reason: "client self-service generation — member's own unified quota (2026-11-14 law)" };
  }
  return { bill: false, reason: `unresolved requester role (${r || "none"}) — fail-open, no client-quota burn` };
}

/**
 * Record a swap in the plan_swaps table.
 *
 * HONEST-LEDGER 2026-10-26 (live QA round, Task QA-TEST-ACCOUNTS-2026-10-26):
 * the insert's success is now RETURNED (boolean) — the runner logged
 * «usage recorded» unconditionally while the production insert was
 * failing on the live-only NOT NULL `plan_type` column (measured live:
 * runner log «[tier-limits] recordSwap error: null value in column
 * "plan_type" …» followed by «[ai-jobs] usage recorded» — a lie).
 * Callers MUST report the returned truth; a false return means the
 * weekly quota ledger was NOT updated (limits silently unenforced).
 *
 * PLAN-TYPE 2026-10-27 (same live QA round, defect #2 — the ledger has
 * been dead since birth): the production plan_swaps table carries a
 * NOT NULL `plan_type` column the repo migrations/types never had
 * (live OpenAPI, read-only: plan_swaps = id/user_id/plan_id?/
 * plan_type NOT NULL/swap_type/day_index?/item_index?/old_item?/
 * new_item?/reason?/created_at — the table held ZERO rows ever, so no
 * writer ever satisfied it). The ledger row's plan_type is derived
 * from the swap action — meal swap → the member's MEAL plan ('meal'),
 * exercise swap → the member's WORKOUT plan ('workout') — the exact
 * domain of the plans.type enum (0001_init.sql). Both live drain runs
 * of the QA round measured the empty table directly.
 */
async function recordSwap(
  userId: string,
  swapType: "meal" | "exercise",
  jobRef?: string | null,
): Promise<boolean> {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) return false;
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
      // PLAN-TYPE 2026-10-27: NOT NULL on production — the missing value
      // is what killed the insert even after the uuid fix above (live
      // error: «null value in column "plan_type" of relation "plan_swaps"
      // violates not-null constraint», GHA drain run 40246588409).
      plan_type: swapType === "meal" ? "meal" : "workout",
      swap_type: swapType,
      // 0110 (2026-11-14): UNIQUE when present — the structural
      // deduct-exactly-once guarantee for queued swap jobs.
      job_ref: jobRef ?? null,
    });
  if (error) {
    console.error("[tier-limits] recordSwap error:", error.message);
    return false;
  }
  return true;
}
