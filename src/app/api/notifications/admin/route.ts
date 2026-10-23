import { NextRequest, NextResponse } from "next/server";
import { requireUser, authRequired } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  adminNotificationBodySchema,
  ADMIN_NOTIF_TYPES,
} from "@/lib/validation/schemas";
import { getAdminIds, adminFeedOrFilter } from "@/lib/notifications-server";
import type { Json } from "@/lib/supabase/types";

/**
 * POST /api/notifications/admin
 *
 * Server-side endpoint for creating admin notifications.
 *
 * Why this exists: the client-side createAdminNotification() function
 * calls supabase.from("admin_notifications").insert() directly. But
 * the RLS policy on admin_notifications only allows coaches to insert
 * (public.is_coach() check). This means when a regular client user
 * triggers an event that should notify the coach (new signup, new
 * questionnaire, new ticket, new payment request), the insert silently
 * fails because the client's auth.uid() is not a coach.
 *
 * This endpoint solves it by:
 *   1. Verifying the caller is authenticated (requireUser)
 *   2. Validating the notification type against a strict allowlist
 *   3. Using supabaseAdmin (service_role key) to insert — bypasses RLS
 *
 * Security: the `type` field is validated against ALLOWED_TYPES to
 * prevent arbitrary notification injection. `title` and `body` are
 * length-capped to prevent abuse.
 *
 * Body:
 *   { type: string, title: string, body: string, link?: string,
 *     clientId?: string }
 *
 * MULTI-COACH ROUTING (owner answer 4, 2026-08-29): coach bell
 * notifications are NEVER broadcast to all staff anymore. When
 * `clientId` is provided, the notification is routed to that client's
 * ASSIGNED coach via `target_coach_id` (coach_assignments). With no
 * clientId — or no assignment — it falls back to the admin (general
 * coach). The admin also sees everything regardless.
 *
 * Returns:
 *   { ok: true, id: string } on success
 *   { error: string } on failure
 */

const ALLOWED_TYPES = new Set([
  "new_client",
  "new_ticket",
  "plan_approved",
  "questionnaire_submitted",
  "payment_request",
]);

const MAX_TITLE_LEN = 200;
const MAX_BODY_LEN = 1000;
const MAX_LINK_LEN = 200;
// STAFF-BELL-I18N-251 — payload size cap: the endpoint is open to any
// authenticated user, so the structured fields (consumed only by the
// render-side catalog) are capped before insert. Oversized/invalid
// payloads degrade to {} — the row still renders verbatim.
const MAX_PAYLOAD_JSON_LEN = 2000;

function sanitizePayload(
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  try {
    const json = JSON.stringify(payload);
    if (!json || json.length > MAX_PAYLOAD_JSON_LEN) return {};
    return payload;
  } catch {
    return {};
  }
}

/**
 * GET /api/notifications/admin — Phase 246: the ADMIN's staff-bell feed.
 *
 * Owner bug: «الاشعارات كلها تظهر للادمن». The bell's old fetch was an
 * unfiltered client-side SELECT whose only scoping was RLS — and RLS hands
 * an admin EVERY row (is_admin() branch), including pings targeted at
 * other coaches (new-client / questionnaire / plan-approval of assigned
 * coaches, page approvals, referral-commission copies).
 *
 * This feed is the precise admin view: service-role SELECT filtered to
 * `target_coach_id is null` (broadcasts) OR `target_coach_id in (admin
 * ids)` (admin-targeted rows — payment requests, page reviews, refunds…)
 * — so admins see everything admin-relevant regardless of WHICH admin an
 * emit site picked, and none of the coaches' private pings. No RLS
 * change, no migration. Coaches keep the RLS fetch (their own rows +
 * broadcasts) — the three admin-business broadcasts now target the admin
 * explicitly at emit time, so they stop ringing coaches' bells too.
 */
export async function GET(request: NextRequest) {
  if (!authRequired) {
    return NextResponse.json({ ok: true, demo: true, items: [] });
  }

  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin not configured" },
      { status: 500 },
    );
  }

  // The caller is an admin — guarantee the in-filter is never empty even
  // if the profiles query hiccups (fallback: the caller's own id).
  const adminIds = await getAdminIds();
  const scope = adminIds.length > 0 ? adminIds : [auth.id];

  const { data, error } = await supabaseAdmin
    .from("admin_notifications")
    .select("*")
    .or(adminFeedOrFilter(scope))
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[api/notifications/admin][GET] query failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!authRequired) {
    return NextResponse.json({ ok: true, demo: true });
  }

  // Require authentication — any logged-in user can create admin notifs
  // for legitimate event types (validated against ALLOWED_TYPES below)
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin not configured" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));

  // Wave 3 zod gate — shape only; the three legacy 400 classes below
  // are re-derived verbatim in legacy order on gate failure (compat
  // law) — the type enum IS the legacy ALLOWED_TYPES allowlist.
  const parsed = adminNotificationBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = (body ?? {}) as Record<string, unknown>;
    const rawType = raw.type;
    const rawTitle = raw.title;
    if (!rawType || !rawTitle) {
      return NextResponse.json(
        { error: "Missing type or title" },
        { status: 400 },
      );
    }
    if (
      typeof rawType !== "string" ||
      !(ADMIN_NOTIF_TYPES as readonly string[]).includes(rawType)
    ) {
      return NextResponse.json(
        {
          error: `Invalid notification type. Allowed: ${ADMIN_NOTIF_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { type, title, body: notifBody, link, clientId, payload, dedupKey } = parsed.data;

  if (!type || !title) {
    return NextResponse.json(
      { error: "Missing type or title" },
      { status: 400 },
    );
  }

  // Validate type against allowlist — prevents arbitrary notification injection
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: `Invalid notification type. Allowed: ${[...ALLOWED_TYPES].join(", ")}` },
      { status: 400 },
    );
  }

  // Length-cap fields to prevent abuse
  const safeTitle = String(title).slice(0, MAX_TITLE_LEN);
  const safeBody = notifBody ? String(notifBody).slice(0, MAX_BODY_LEN) : null;
  const safeLink = link ? String(link).slice(0, MAX_LINK_LEN) : null;

  // MULTI-COACH ROUTING: resolve the ONE coach this notification is for.
  // assigned coach of clientId → fallback: the admin (general coach).
  //
  // 0043 MODEL EXCEPTION — `payment_request` is ADMIN-ONLY: buying a SITE
  // membership with a manual receipt is site coaching (B2C) and per the
  // owner's terminology decree the coach never sees it, even if the buyer
  // is his own client. Skip the assignment lookup so the row lands on the
  // admin (target_coach_id = admin id), matching the /admin/payments page.
  const routeToAdminOnly = type === "payment_request";
  let targetCoachId: string | null = null;
  if (!routeToAdminOnly && typeof clientId === "string" && clientId.length > 0) {
    const { data: asg } = await supabaseAdmin
      .from("coach_assignments")
      .select("coach_id")
      .eq("client_id", clientId)
      .maybeSingle();
    targetCoachId = (asg as { coach_id: string } | null)?.coach_id ?? null;
  }
  if (!targetCoachId) {
    const { data: adm } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    targetCoachId = (adm as { id: string } | null)?.id ?? null;
  }

  // NOTIF→PLAN 2026-10-24 (owner order item 1 — تكرار الإشعارات): the
  // SERVER-SIDE dedup guard. The event identity is the explicit dedupKey
  // OR payload.dedupKey (the emit sites ride it inside the payload);
  // when a row of the same type + key exists within the window, the
  // insert is SKIPPED (idempotent success — the retry that caused it
  // must not double-ring the bell). Fail-OPEN: any guard error falls
  // through to the plain insert (a duplicate is recoverable; a lost
  // event is not). Live-DB evidence for the class: plan_approved pings
  // 5-53s apart on the same approval.
  const DEDUP_WINDOW_MS = 10 * 60 * 1000;
  const eventKey =
    (typeof dedupKey === "string" && dedupKey) ||
    (typeof payload?.dedupKey === "string" && (payload.dedupKey as string)) ||
    "";
  if (eventKey) {
    try {
      const since = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
      const { data: recent } = await supabaseAdmin
        .from("admin_notifications")
        .select("id")
        .eq("type", type)
        .gte("created_at", since)
        .contains("payload", { dedupKey: eventKey })
        .limit(1);
      if (recent && Array.isArray(recent) && recent.length > 0) {
        return NextResponse.json({ ok: true, deduped: true, id: recent[0].id });
      }
    } catch {
      // fail-open — see the comment above
    }
  }

  const { data, error } = await supabaseAdmin
    .from("admin_notifications")
    .insert({
      type,
      title: safeTitle,
      body: safeBody,
      link: safeLink,
      target_coach_id: targetCoachId,
      payload: sanitizePayload(payload) as Json,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[api/notifications/admin] insert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
