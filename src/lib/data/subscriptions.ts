"use client";

import {
 supabase,
 isSupabaseConfigured,
 validateUploadFile,
 read,
 write,
 uid,
 LS_PROFILES,
 LS_SUBS,
 LS_PREFIX,
 type Profile,
} from "./helpers";
import { createNotification, createAdminNotification , createNotificationDeduped } from "./notifications";
import { canonicalModelTier } from "../plans";
import { pickPrimarySubscription } from "../subscription-view";
import type { Subscription, SubscriptionRequest } from "@/lib/supabase/types";

/** Input accepted by submitSubscriptionRequest — mirrors the subscription_requests Insert shape (payment_method union == lib/plans PaymentMethod). */
export type SubscriptionRequestInput = Pick<
 SubscriptionRequest,
 "user_id" | "full_name" | "whatsapp" | "plan_tier" | "duration_months" | "price_usd" | "payment_method" | "receipt_path"
>;

export async function listAllClients() {
 if (isSupabaseConfigured && supabase) {
 const { data } = await supabase
 .from("profiles")
 .select("*")
 .eq("role", "client")
 .order("created_at", { ascending: false });
 return data ?? [];
 }
 const profiles = read<Record<string, Profile>>(LS_PROFILES, {});
 return Object.values(profiles).filter((p) => p.role === "client");
}

/**
 * Decision 1 fix: fetch all coach client data in ONE query via RPC.
 * Replaces the N+1 pattern in CoachView (listAllClients +
 * listAllSubscriptions + listSubscriptionRequests + per-client
 * getQuestionnaire × 2 = 2N+3 queries).
 *
 * Returns: client profile + latest sub + pending payments + questionnaire
 * status for every client, in a single round-trip.
 *
 * Falls back to the old multi-query path if the RPC is not available
 * (e.g. migration not yet applied to production).
 */
export async function getCoachClientListOptimized() {
 if (isSupabaseConfigured && supabase) {
 try {
 const { data, error } = await supabase.rpc("get_coach_client_list");
 if (!error && data) {
 return data;
 }
 // RPC not available — fall through to old path
 console.warn("[data] get_coach_client_list RPC not available, using fallback");
 } catch (e) {
 console.warn("[data] get_coach_client_list RPC failed, using fallback:", e);
 }
 }
 // Fallback: return null so caller uses the old multi-query path
 return null;
}

// ---------------------------------------------------------------------------
// PAGED client list (Phase 52 — «تخيل لو فى ١٠٠٠٠٠٠٠ مستخدم مسجل»)
// Server-side paging/filtering/sorting inside Postgres. Returns null when
// the 0047 RPC is not applied yet → callers fall back to the full-list path.
// ---------------------------------------------------------------------------

export type CoachClientPageOpts = {
  limit?: number;
  offset?: number;
  search?: string;
  filter?: string; // all|active|expiring|no_plan|no_questionnaire|pending_payment|expired|premium|pro|coaching
  segment?: string; // all|coach|site (admin only)
  sort?: string; // newest|oldest|name|expiry
};

/** Row shape of get_coach_client_list_paged / get_coach_client_list (0047/0043) —
 *  consumed by CoachView's enrichClientRow (single definition, Phase 247). */
export type CoachClientRpcRow = {
  client_id: string;
  client_full_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_created_at: string;
  sub_tier: string | null;
  sub_status: string | null;
  sub_end_date: string | null;
  sub_months: number | null;
  pending_payments: number | null;
  nutri_q_status: string | null;
  fit_q_status: string | null;
  assigned_coach_id: string | null;
  assigned_coach_name: string | null;
  // 0072 additive columns (absent before the migration → undefined)
  member_kind?: string | null;
  site_member_active?: boolean | null;
  // 0092 (m-C) additive column (absent before the migration → undefined)
  invite_pending?: boolean | null;
  total_count?: number | string;
};

/** Phase 247 — discriminated result: "missing" (0047 RPC not applied → the
 *  caller MAY fall back to the legacy full-list path) is deliberately
 *  distinct from "error" (anything else — the caller must speak instead of
 *  silently downgrading the whole session to the N+1 legacy path). */
export type CoachClientPagedResult =
  | { status: "ok"; rows: CoachClientRpcRow[] }
  | { status: "missing" }
  | { status: "error"; message: string };

/** PostgREST "function does not exist" arrives as code 404/42883 (or
 *  PGRST202 on newer gateways) or a message mentioning the missing function. */
function isRpcMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  if (code === "404" || code === "42883" || code === "PGRST202") return true;
  return /could not find the function|schema cache/i.test(error.message ?? "");
}

export async function getCoachClientListPaged(
 opts: CoachClientPageOpts = {},
): Promise<CoachClientPagedResult> {
 if (isSupabaseConfigured && supabase) {
 try {
 const { data, error } = await supabase.rpc("get_coach_client_list_paged", {
 p_limit: Math.max(1, Math.min(opts.limit ?? 25, 100)),
 p_offset: Math.max(0, opts.offset ?? 0),
 p_search: opts.search?.trim() || null,
 p_filter: opts.filter || "all",
 p_segment: opts.segment || "all",
 p_sort: opts.sort || "newest",
 });
 if (!error && data) return { status: "ok", rows: data as CoachClientRpcRow[] };
 if (isRpcMissing(error)) {
 console.warn("[data] get_coach_client_list_paged not ready:", error?.message);
 return { status: "missing" };
 }
 // Phase 247 (honest-failure law): ANY other error used to be swallowed
 // into the same "migration absent" bucket, silently downgrading the
 // whole session to the N+1 legacy path. Now the caller can speak.
 console.error("[data] get_coach_client_list_paged failed:", error?.message);
 return { status: "error", message: error?.message || "request failed" };
 } catch (e) {
 const message = e instanceof Error ? e.message : String(e);
 console.error("[data] get_coach_client_list_paged threw:", message);
 return { status: "error", message };
 }
 }
 return { status: "missing" };
}

export type CoachClientStats = {
 total: number;
 active: number;
 expiring: number;
 no_plan: number;
 no_questionnaire: number;
 pending_payment: number;
 expired: number;
 premium: number;
 pro: number;
 coaching: number;
 coach_clients: number;
 site_clients: number;
 // 0092 (m-C): invited clients who never joined yet (migration-absent → 0).
 pending_invites: number;
};

// ---------------------------------------------------------------------------
// UNIFIED ADMIN CLIENTS FEED (Phase 103 — 0067).
// Every profile (client + coach + admin) with membership lifecycle, B2B
// coach relation, site-coach follow-up relation, coach_kind and the
// test-account flag. Admin-only inside the RPC (non-admin gets an empty
// set). Returns null when the 0067 RPC is not applied yet → the unified
// clients page shows its own "service not applied" empty state.
// ---------------------------------------------------------------------------

export type AdminClientsPageOpts = {
  limit?: number;
  offset?: number;
  search?: string;
  filter?: string; // all|active|expiring|expired|no_plan|pending_payment|premium|pro|coaching
  type?: string; // all|member_site|client_of_coach|coach|coach_site|coach_b2b|admin
  test?: string; // all|test|real
  sort?: string; // newest|oldest|name|expiry
};

export async function getAdminClientsPaged(opts: AdminClientsPageOpts = {}) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("get_admin_clients_paged", {
        p_limit: Math.max(1, Math.min(opts.limit ?? 25, 100)),
        p_offset: Math.max(0, opts.offset ?? 0),
        p_search: opts.search?.trim() || null,
        p_filter: opts.filter || "all",
        p_type: opts.type || "all",
        p_test: opts.test || "all",
        p_sort: opts.sort || "newest",
      });
      if (!error && data) return data;
      if (error) console.warn("[data] get_admin_clients_paged not ready:", error.message);
    } catch (e) {
      console.warn("[data] get_admin_clients_paged failed:", e);
    }
  }
  return null;
}

export type AdminClientsStats = {
  total: number;
  member_site: number;
  client_of_coach: number;
  coach_site: number;
  coach_b2b: number;
  admin_count: number;
  test_count: number;
  active: number;
  expiring: number;
  expired: number;
  pending_payment: number;
};

/** One row of counts for the unified clients page tiles + type buttons. */
export async function getAdminClientsStats(): Promise<AdminClientsStats | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("get_admin_clients_stats");
      if (!error && data && data.length > 0) {
        const s = data[0];
        const n = (v: unknown) => Number(v) || 0;
        return {
          total: n(s.total),
          member_site: n(s.member_site),
          client_of_coach: n(s.client_of_coach),
          coach_site: n(s.coach_site),
          coach_b2b: n(s.coach_b2b),
          admin_count: n(s.admin_count),
          test_count: n(s.test_count),
          active: n(s.active),
          expiring: n(s.expiring),
          expired: n(s.expired),
          pending_payment: n(s.pending_payment),
        };
      }
      if (error) console.warn("[data] get_admin_clients_stats not ready:", error.message);
    } catch (e) {
      console.warn("[data] get_admin_clients_stats failed:", e);
    }
  }
  return null;
}

/** One row of tab counts over the caller's scope (admin → everyone; coach → his clients). */
export async function getCoachClientStats(): Promise<CoachClientStats | null> {
 if (isSupabaseConfigured && supabase) {
 try {
 const { data, error } = await supabase.rpc("get_coach_client_stats");
 if (!error && data && data.length > 0) {
 const s = data[0];
 const n = (v: unknown) => Number(v) || 0;
 return {
 total: n(s.total), active: n(s.active), expiring: n(s.expiring),
 no_plan: n(s.no_plan), no_questionnaire: n(s.no_questionnaire),
 pending_payment: n(s.pending_payment), expired: n(s.expired),
 premium: n(s.premium), pro: n(s.pro), coaching: n(s.coaching),
 coach_clients: n(s.coach_clients), site_clients: n(s.site_clients),
 pending_invites: n(s.pending_invites),
 };
 }
 if (error) console.warn("[data] get_coach_client_stats not ready:", error.message);
 } catch (e) {
 console.warn("[data] get_coach_client_stats failed:", e);
 }
 }
 return null;
}

// ---------------------------------------------------------------------------
// Subscription Requests (for coach payments page)
// ---------------------------------------------------------------------------

export async function listSubscriptionRequests(status?: string): Promise<SubscriptionRequest[]> {
 if (isSupabaseConfigured && supabase) {
 let q = supabase.from("subscription_requests").select("*").order("created_at", { ascending: false });
 if (status && status !== "all") q = q.eq("status", status as "pending" | "approved" | "rejected");
 const { data } = await q;
 return data ?? [];
 }
 return read<SubscriptionRequest[]>(LS_PREFIX + "subreqs", []);
}

export async function submitSubscriptionRequest(req: SubscriptionRequestInput): Promise<SubscriptionRequest> {
 if (isSupabaseConfigured && supabase) {
 // M9 fix: check for existing pending request from the same user for the
 // same plan tier to prevent spamming the coach's payment review queue.
 const { data: existing } = await supabase
 .from("subscription_requests")
 .select("id, status")
 .eq("user_id", req.user_id)
 .eq("plan_tier", req.plan_tier)
 .eq("status", "pending")
 .maybeSingle();
 if (existing) {
 throw new Error("You already have a pending request for this plan. Please wait for the coach to review it.");
 }
 const { data, error } = await supabase.from("subscription_requests").insert(req).select().single();
 if (error) throw new Error(error.message);
 // Notify THE ADMIN about new payment request — 0043 MODEL: site
 // membership purchases (B2C) are reviewed by the admin only; coaches
 // never see them (terminology law). Link → /admin/payments.
 await createAdminNotification(
 "payment_request",
 "طلب دفع جديد ",
 `${req.full_name} طلب اشتراك ${req.plan_tier} لمدة ${req.duration_months} شهر — $${req.price_usd}`,
 "/admin/payments",
 req.user_id,
 { name: req.full_name, tier: req.plan_tier, months: req.duration_months, price_usd: req.price_usd },
 ).catch(() => {});
 return data;
 }
 const all = read<SubscriptionRequest[]>(LS_PREFIX + "subreqs", []);
 const row: SubscriptionRequest = {
 id: uid(),
 ...req,
 status: "pending",
 reviewed_at: null,
 // Phase 191 mirror truth (RUN_ON_SUPABASE_0042): live column, NULL
 // until the evidence gate consumes the request — same default live
 consumed_at: null,
 // 0098 (W0-3): PayPal capture claims only — a manual request is
 // never order-locked (NULL is outside the partial unique index)
 paypal_order_id: null,
 created_at: new Date().toISOString(),
 };
 all.push(row);
 write(LS_PREFIX + "subreqs", all);
 return row;
}

export async function reviewSubscriptionRequest(id: string, action: "approve" | "reject", adminNote?: string): Promise<SubscriptionRequest> {
 if (isSupabaseConfigured && supabase) {
 // M10 fix: only update if status is still "pending" — prevents re-approving
 // or re-rejecting an already-processed request (double-commission, etc.)
 const { data, error } = await supabase
 .from("subscription_requests")
 .update({ status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
 .eq("id", id)
 .eq("status", "pending")
 .select()
 .single();
 if (error) throw new Error(error.message);
 if (!data) throw new Error("Subscription request not found or already processed");

 // If approved, create a subscription for the user
 if (action === "approve") {
 const req = data;
 const start = new Date();
 const end = new Date();
 end.setMonth(end.getMonth() + req.duration_months);
 // 0042 EVIDENCE GATE: pass the approved request id — the RPC consumes
 // it (consumed_at) so the activation is provably tied to a paid request.
 // 0046 CANONICAL TIER: legacy /coaching products (Starter $20 / Elite
 // $40 — owner-decreed PayPal-tied prices) are approved from their real
 // request rows, but the subscription is written under the canonical
 // model tier (starter → premium, elite → pro) so the 0045 DB guard
 // (tier in premium/pro/coaching) never rejects a real approval. Safe
 // here: the admin approval path is a trusted override in the RPC
 // (0042) — no (client,tier,months) evidence match is required. The
 // client notification below keeps the PRODUCT name they actually bought.
 await upsertSubscription(req.user_id, canonicalModelTier(req.plan_tier), req.duration_months, start.toISOString(), end.toISOString(), req.id);
 // Notify the user — 0093: payload feeds the bell's render-side catalog
 // (lib/notification-i18n.ts) so EN members read English and the «1 أشهر»
 // grammar bug never reappears (arMonthsPhrase law).
 // NOTIF→PLAN 2026-10-24 (item 1): deduped on the request id — a
 // double-clicked admin approval (or a retried submit) rings once.
 await createNotificationDeduped(req.user_id, "subscription_approved", "تم تفعيل اشتراكك!", `تم الموافقة على طلب اشتراكك (${req.plan_tier}) لمدة ${req.duration_months} أشهر.`, "/dashboard", { tier: req.plan_tier, months: req.duration_months, request_id: req.id }, { key: "request_id", value: req.id, windowMs: 5 * 60 * 1000 });
 // PHASE 66 (owner-approved): award the affiliate commission from the
 // SERVER (POST /api/affiliate/commission) instead of the browser.
 // The Phase 64 study proved the old browser engine call failed
 // silently (RLS blocked tracking inserts; the engine tables never
 // existed in production). The route runs the shared server engine
 // (coach-clients decree gate included) — idempotent on the request id.
 // Best-effort: a commission failure never blocks the approval.
 try {
  const paymentAmount = req.price_usd ? Number(req.price_usd) : 10; // already USD
  await fetch("/api/affiliate/commission", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({
    userId: req.user_id,
    amount: paymentAmount,
    reference: req.id,
    productId: req.plan_tier,
   }),
  });
 } catch (e) {
  console.error("[reviewSubscriptionRequest] Affiliate commission error:", e);
 }
 } else {
 // M55 fix: include rejection reason in the notification if provided
 const reasonText = adminNote ? ` (${adminNote})` : "";
 // NOTIF→PLAN 2026-10-24 (item 1): same request-id dedup on rejection.
 await createNotificationDeduped(data.user_id, "subscription_rejected", "تم رفض طلب الاشتراك", `تم رفض طلب اشتراكك.${reasonText} يرجى التواصل مع الدعم.`, "/memberships", { reason: adminNote || "", request_id: data.id }, { key: "request_id", value: data.id, windowMs: 5 * 60 * 1000 });
 }
 return data;
 }
 const all = read<SubscriptionRequest[]>(LS_PREFIX + "subreqs", []);
 const idx = all.findIndex((r) => r.id === id);
 if (idx >= 0) all[idx].status = action === "approve" ? "approved" : "rejected";
 write(LS_PREFIX + "subreqs", all);
 return all[idx];
}

// Phase 246: receipt reads no longer sign from the browser — the old
// getReceiptSignedUrl asked for `receipts/receipts/…` (double-prefixed DB
// path) AND had no storage SELECT policy to sign with, silently returning
// "" (the dead «الإيصال» button). The single reader is the authorized
// /api/file proxy: src/lib/receipt-view.ts (receiptObjectKey/receiptViewUrl).
// Revenue sums deduped into the pure src/lib/subscription-sums.ts:
export { sumSubscriptionRequestsByStatus } from "@/lib/subscription-sums";

export async function uploadReceipt(file: File): Promise<string> {
 // P3-11 🔐 (deep-audit confirmed 18/19, Phase 217 — owner §7 approval
 // «أوافق على التنفيذ كاملاً»): receipts ride the LAW-ful upload path
 // (POST /api/upload) like every other upload. The old browser-side
 // Storage write (a) violated the UPLOAD LAW (AGENTS.md §8: uploads go
 // EXCLUSIVELY through /api/upload) and (b) has been dead weight since
 // the 0071 storage hardening dropped the blanket authenticated-INSERT
 // policy — no browser INSERT is allowed on the receipts bucket anymore.
 // /api/upload re-validates type/size, rebuilds the storage path
 // SERVER-SIDE under the caller's uid (receipts/<uid>/<ts>-<name>), and
 // that uid segment is what /api/coach/wallet/topup now verifies as the
 // ownership proof. Returns the bucket-prefixed path for DB storage
 // (same shape the previous flow produced).
 validateUploadFile(file, ["image/jpeg", "image/png", "image/webp", "application/pdf"], 5 * 1024 * 1024);
 const formData = new FormData();
 formData.append("file", file);
 formData.append("bucket", "receipts");
 const res = await fetch("/api/upload", { method: "POST", body: formData });
 if (!res.ok) {
 const json = (await res.json().catch(() => ({}))) as { error?: string };
 throw new Error(json.error || `Receipt upload failed (${res.status})`);
 }
 const json = (await res.json()) as { path?: string };
 if (!json.path) throw new Error("Receipt upload failed");
 return `receipts/${json.path}`;
}

// ---------------------------------------------------------------------------
// Plan file upload (coach uploads PDF files)
// ---------------------------------------------------------------------------

export async function uploadPlanFile(bucket: string, clientId: string, file: File): Promise<string> {
 if (isSupabaseConfigured && supabase) {
 const ext = file.name.split(".").pop();
 const path = `${clientId}/${Date.now()}.${ext}`;
 const { error } = await supabase.storage.from(bucket).upload(path, file);
 if (error) throw new Error(error.message);
 return path;
 }
 return "";
}

export async function getPlanFileUrl(bucket: string, filePath: string): Promise<string> {
 if (isSupabaseConfigured && supabase) {
 const { data } = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600);
 return data?.signedUrl ?? "";
 }
 return "";
}

export async function listAllSubscriptions(): Promise<Subscription[]> {
 if (isSupabaseConfigured && supabase) {
 const { data } = await supabase.from("subscriptions").select("*");
 return data ?? [];
 }
 return read<Subscription[]>(LS_SUBS, []);
}

/**
 * Fetch ONLY the calling user's own subscription.
 * Use this in user-facing contexts (e.g. /api/ai/chat) instead of
 * listAllSubscriptions() — which returns every row and is meant for
 * coach-only views. RLS also enforces this server-side, but defense in
 * depth: never trust the body's userId, and never fetch more than needed.
 */
export async function getSubscriptionForClient(clientId: string): Promise<Subscription | null> {
 if (isSupabaseConfigured && supabase) {
 // T-AI-DEEP-AUDIT-V2 (D5 fix): filter status='active' + end_date>now —
 // mirrors auth-server.ts getAuthUser(). Previously the newest row won
 // regardless of status/expiry, so an EXPIRED or REJECTED subscription
 // still made client UI treat the user as paid (useMembershipTier →
 // ads hidden, export buttons enabled, EVO unlimited-badge …). The
 // server stays the authority; this fix aligns the client picture.
 const { data } = await supabase
 .from("subscriptions")
 .select("*")
 .eq("client_id", clientId)
 .eq("status", "active")
 .gt("end_date", new Date().toISOString())
 .order("created_at", { ascending: false });
 const arr = data ?? [];
 if (arr.length === 0) return null;
 // Phase 247: the pick law (best membership pro > premium, else coaching)
 // lives in lib/subscription-view.ts — it was hand-rolled here AND twice in
 // CoachClientView. `?? arr[0]` preserves this function's final fallback.
 return pickPrimarySubscription(arr) ?? arr[0];
 }
 // Local fallback mirrors the same active + expiry filter.
 const now = new Date().toISOString();
 const all = read<Subscription[]>(LS_SUBS, []).filter(
 (s) => s.client_id === clientId && s.status === "active" && s.end_date !== null && s.end_date > now,
 );
 if (all.length === 0) return null;
 return pickPrimarySubscription(all) ?? all[0];
}

/**
 * Fetch ALL subscriptions for a client (not just one).
 * Used by the coach client view to show multiple subscriptions
 * (e.g. Coaching + Premium coexisting).
 */
export async function listSubscriptionsForClient(clientId: string): Promise<Subscription[]> {
 if (isSupabaseConfigured && supabase) {
 const { data } = await supabase
 .from("subscriptions")
 .select("*")
 .eq("client_id", clientId)
 .order("created_at", { ascending: false });
 return data ?? [];
 }
 return read<Subscription[]>(LS_SUBS, []).filter((s) => s.client_id === clientId);
}

export async function upsertSubscription(clientId: string, tier: string, months: number, startDate?: string, endDate?: string, requestId?: string | null) {
 if (isSupabaseConfigured && supabase) {
 // Use migration 0018's extend_subscription() RPC which atomically
 // extends an existing subscription (preserving remaining paid days)
 // instead of overwriting it. Fixes C10 (early renewal lost paid days).
 // 0042: coaches MUST pass the approved payment request id — the RPC
 // consumes it atomically (no evidence → no activation). Server routes
 // (service role) pass null.
 const subscriptionType = tier === "coaching" ? "coaching" : "membership";
 const { data, error } = await supabase
 .rpc("extend_subscription", {
 p_client_id: clientId,
 p_tier: tier,
 p_months: months,
 p_subscription_type: subscriptionType,
 p_request_id: requestId ?? null,
 });
 if (error) throw new Error(error.message);
 return data;
 }
 const all = read<Subscription[]>(LS_SUBS, []);
 const idx = all.findIndex((s) => s.client_id === clientId);
 const row: Subscription = {
 id: idx >= 0 ? all[idx].id : uid(),
 client_id: clientId,
 tier,
 months,
 start_date: startDate ?? null,
 end_date: endDate ?? null,
 status: "active" as const,
 subscription_type: tier === "coaching" ? "coaching" : "membership",
 cancel_requested_at: null,
 created_at: idx >= 0 ? all[idx].created_at : new Date().toISOString(),
 };
 if (idx >= 0) all[idx] = row;
 else all.push(row);
 write(LS_SUBS, all);
 return row;
}
