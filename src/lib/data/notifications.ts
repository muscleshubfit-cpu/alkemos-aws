"use client";

import {
 supabase,
 isSupabaseConfigured,
 read,
 write,
 uid,
 LS_PREFIX,
} from "./helpers";
import type { Json } from "@/lib/supabase/types";

// Row shapes for the notifications tables + their localStorage mirrors.
// (Shared with NotificationBell / AdminNotificationBell — Phase 90.)
// 0093 — `payload` carries structured fields for SYSTEM notifications
// (tier/months/reason/…); the bell localizes known types from it at
// render time (lib/notification-i18n.ts) — legacy rows fall back to the
// stored text verbatim.
export type NotificationRow = {
 id: string;
 user_id: string;
 type: string;
 title: string;
 body: string;
 link?: string | null;
 read: boolean;
 created_at: string;
 payload?: Record<string, unknown> | null;
};

export type AdminNotificationRow = {
 id: string;
 type: string;
 title: string;
 body: string;
 link?: string | null;
 read: boolean;
 created_at: string;
 target_coach_id?: string | null;
 payload?: Record<string, unknown> | null;
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function listNotifications(userId: string) {
 if (isSupabaseConfigured && supabase) {
 const { data } = await supabase
 .from("notifications")
 .select("*")
 .eq("user_id", userId)
 .order("created_at", { ascending: false })
 .limit(20);
 return (data ?? []) as NotificationRow[];
 }
 return read<NotificationRow[]>(LS_PREFIX + "notifs", []).filter((n) => n.user_id === userId);
}

export async function markNotificationsRead(userId: string) {
 if (isSupabaseConfigured && supabase) {
 await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
 return;
 }
 const all = read<NotificationRow[]>(LS_PREFIX + "notifs", []);
 all.forEach((n) => { if (n.user_id === userId) n.read = true; });
 write(LS_PREFIX + "notifs", all);
}

// 0049 — per-item read: clicking ONE notification marks IT read
// (owner rule: «بعد الضغط على الاشعار بيفضل موجود غير مقروء — مفروض
// يختفى مقروء»). RLS notifs_update_self_or_coach lets the owner update
// his own rows client-side; the bell flips its state optimistically.
export async function markNotificationRead(id: string) {
 if (isSupabaseConfigured && supabase) {
 await supabase.from("notifications").update({ read: true }).eq("id", id);
 return;
 }
 const all = read<NotificationRow[]>(LS_PREFIX + "notifs", []);
 all.forEach((n) => { if (n.id === id) n.read = true; });
 write(LS_PREFIX + "notifs", all);
}

// 0093 — optional `payload`: structured fields for system notifications
// so the bell can localize known types at render time. Legacy callers
// (and free-text broadcasts) omit it — the row renders verbatim as before.
// STAFF-BELL-I18N-251 — createAdminNotification carries the same optional
// payload for STAFF rows: the crew bell's catalog (lib/notification-i18n.ts
// ADMIN_CATALOG) renders them in the VIEWER's language; old rows stay
// verbatim (honest fallback).
export async function createNotification(userId: string, type: string, title: string, body: string, link?: string, payload?: Record<string, unknown>) {
 if (isSupabaseConfigured && supabase) {
 const { data, error } = await supabase
 .from("notifications")
 .insert({ user_id: userId, type, title, body, link, payload: (payload ?? {}) as Json })
 .select()
 .single();
 if (error) throw new Error(error.message);
 return data;
 }
 const all = read<NotificationRow[]>(LS_PREFIX + "notifs", []);
 const row = { id: uid(), user_id: userId, type, title, body, link, payload: payload ?? {}, read: false, created_at: new Date().toISOString() };
 all.push(row);
 write(LS_PREFIX + "notifs", all);
 return row;
}

// ---------------------------------------------------------------------------
// NOTIF→PLAN 2026-10-24 (owner order item 1 — تكرار الإشعارات): the dedup
// guard. Live-DB evidence: plan_activated rows 5-53s apart (double-click /
// network retry on the SAME approval), questionnaire_status double-fires,
// and the PayPal wallet top-up's parallel-race loser re-notifying. Every
// emit site whose event has a natural identity key now checks for an
// existing row BEFORE inserting — same (user_id, type) + same
// payload[dedupKey] inside the window → skip. Fail-OPEN: a dedup CHECK
// failure never blocks the real event (the guard degrades to a plain
// createNotification — a duplicate is recoverable, a lost event is not).
// ---------------------------------------------------------------------------

export type NotificationDedup = {
 /** The payload field that identifies the EVENT (e.g. plan_id). */
 key: string;
 /** Key VALUE — compared against payload[key] of recent rows. */
 value: string;
 /** Look-back window (ms). Default 5 minutes. */
 windowMs?: number;
};

/**
 * Deduped member-notification emit. Semantics:
 *  - SELECT recent rows (user_id+type, created_at >= now-window) and skip
 *    the insert when one already carries payload[key] === value.
 *  - localStorage (demo) path: same check against the stored rows.
 *  - Returns the existing row when deduped, the new row otherwise.
 */
export async function createNotificationDeduped(
 userId: string,
 type: string,
 title: string,
 body: string,
 link?: string,
 payload?: Record<string, unknown>,
 dedup?: NotificationDedup,
) {
 const windowMs = dedup?.windowMs ?? 5 * 60 * 1000;
 const since = new Date(Date.now() - windowMs).toISOString();

 if (isSupabaseConfigured && supabase) {
  try {
   const { data: recent, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, link, read, created_at, payload")
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(25);
   if (!error && Array.isArray(recent) && dedup) {
    const dupe = (recent as NotificationRow[]).find(
     (r) => (r.payload as Record<string, unknown> | null | undefined)?.[dedup.key] === dedup.value,
    );
    if (dupe) return dupe;
   }
  } catch {
   // fail-open: never lose the event over the guard itself
  }
  return createNotification(userId, type, title, body, link, payload);
 }
 // No descriptor → the legacy plain emit (never dedup on undefined keys).
 if (!dedup) return createNotification(userId, type, title, body, link, payload);
 const all = read<NotificationRow[]>(LS_PREFIX + "notifs", []);
 const dupe = all.find(
  (n) =>
   n.user_id === userId &&
   n.type === type &&
   new Date(n.created_at).getTime() >= Date.now() - windowMs &&
   (n.payload as Record<string, unknown> | undefined)?.[dedup.key] === dedup.value,
 );
 if (dupe) return dupe;
 return createNotification(userId, type, title, body, link, payload);
}

// ---------------------------------------------------------------------------
// Admin Notifications (for coach)
// ---------------------------------------------------------------------------

export async function listAdminNotifications() {
 if (isSupabaseConfigured && supabase) {
 const { data } = await supabase
 .from("admin_notifications")
 .select("*")
 .order("created_at", { ascending: false })
 .limit(30);
 return (data ?? []) as AdminNotificationRow[];
 }
 return read<AdminNotificationRow[]>(LS_PREFIX + "admin_notifs", []);
}

// Phase 246 — the ADMIN's feed goes through GET /api/notifications/admin:
// RLS hands an admin EVERY staff row (the is_admin() branch), so the bell
// drowned in pings targeted at other coaches (new-client / questionnaire /
// plan-approval) plus rows meant for one specific coach. The GET route
// filters service-side to `target_coach_id is null OR in (admin ids)` —
// precise multi-admin visibility with zero RLS changes. Any failure falls
// back to the raw RLS fetch — the bell never goes empty-handed.
export async function listAdminNotificationsForAdmin(): Promise<AdminNotificationRow[]> {
 if (isSupabaseConfigured && supabase) {
 try {
 const res = await fetch("/api/notifications/admin");
 if (res.ok) {
 const json = (await res.json()) as { items?: AdminNotificationRow[] };
 if (Array.isArray(json.items)) return json.items;
 }
 } catch (e) {
 // Phase 247: the fallback re-opens the RAW RLS feed (which for an admin
 // means EVERY staff row — the exact B3 leak). It stays as a never-empty-
 // handed tradeoff, but it must never degrade silently again.
 console.error("[notifications] admin feed fetch failed — falling back to raw RLS fetch:", e);
 }
 }
 return listAdminNotifications();
}

// Phase 246 — «تعليم الكل» now scopes to the ids the bell actually shows.
// The old update touched EVERY read=false row in the table — for an admin
// that literally marked OTHER coaches' rows read (RLS admin-update-all).
// .in("id", ids) keeps the write inside the visible set for every staff
// role, matching what the bell displayed.
export async function markAdminNotificationsRead(ids: string[]) {
 if (isSupabaseConfigured && supabase) {
 if (ids.length === 0) return;
 await supabase.from("admin_notifications").update({ read: true }).in("id", ids).eq("read", false);
 return;
 }
 const all = read<AdminNotificationRow[]>(LS_PREFIX + "admin_notifs", []);
 all.forEach((n) => { if (ids.includes(n.id)) n.read = true; });
 write(LS_PREFIX + "admin_notifs", all);
}

// 0049 — staff bell: clicking ONE admin_notification marks IT read
// (same owner rule as the client bell). RLS allows admins to update any
// row and staff to update broadcast rows or rows targeted at them.
export async function markAdminNotificationRead(id: string) {
 if (isSupabaseConfigured && supabase) {
 await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
 return;
 }
 const all = read<AdminNotificationRow[]>(LS_PREFIX + "admin_notifs", []);
 all.forEach((n) => { if (n.id === id) n.read = true; });
 write(LS_PREFIX + "admin_notifs", all);
}

export async function createAdminNotification(
 type: string,
 title: string,
 body: string,
 link?: string,
 clientId?: string,
 payload?: Record<string, unknown>,
) {
 if (isSupabaseConfigured && supabase) {
 // Use the server-side endpoint instead of direct supabase insert.
 // The RLS policy on admin_notifications only allows coaches to
 // insert directly — but createAdminNotification is called from
 // client-side code (new_client, questionnaire_submitted, new_ticket,
 // payment_request) where the user is NOT a coach. The server endpoint
 // uses supabaseAdmin (service_role) to bypass RLS.
 //
 // MULTI-COACH ROUTING: `clientId` lets the server route the bell
 // notification to the client's ASSIGNED coach (target_coach_id)
 // instead of the legacy broadcast-to-all-staff.
 try {
 const res = await fetch("/api/notifications/admin", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ type, title, body, link, clientId, payload }),
 });
 if (!res.ok) {
 const err = await res.json().catch(() => ({}));
 throw new Error(err.error || `HTTP ${res.status}`);
 }
 const data = await res.json();
 return data;
 } catch (e) {
 // Re-throw so callers can .catch() if they want to suppress
 throw e;
 }
 }
 const all = read<AdminNotificationRow[]>(LS_PREFIX + "admin_notifs", []);
 const row = { id: uid(), type, title, body, link, payload: payload ?? {}, read: false, created_at: new Date().toISOString() };
 all.push(row);
 write(LS_PREFIX + "admin_notifs", all);
 return row;
}
