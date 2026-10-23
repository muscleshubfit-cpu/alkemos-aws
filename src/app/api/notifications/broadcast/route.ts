import { NextRequest, NextResponse } from "next/server";
import { requireCoach, authRequired, type AuthUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { broadcastBodySchema } from "@/lib/validation/schemas";

/**
 * POST /api/notifications/broadcast
 *
 * Staff endpoint to send notifications to:
 *   - ALL clients (target: "all")
 *   - SELECTED clients (target: "selected", userIds: string[])
 *   - A SINGLE client (target: "single", userId: string)
 *
 * Body:
 *   { target: "all" | "selected" | "single", userId?: string, userIds?: string[],
 *     title: string, body: string, link?: string }
 *
 * Uses supabaseAdmin (service_role) to bypass RLS and insert
 * notifications for all targeted clients at once.
 *
 * MULTI-COACH SCOPING (owner answer 1/7, 2026-08-29): a plain coach
 * can only message HIS assigned clients (coach_assignments). "all"
 * means all-of-MY-clients for a coach, all site clients for the
 * admin. Targets outside the coach's roster are rejected with 403.
 *
 * P1-7 (deep-audit 2026-09-16, owner-approved §7): the body passes the
 * central zod gate FIRST — title ≤200, body ≤2000, link ≤500, the
 * userIds array ≤1000 entries. These are SHAPE bounds and apply to
 * staff callers too; the staff COUNT privileges (unlimited recipients
 * via the multi-coach scoping above, the 500-batch chunking below)
 * are NOT touched. Legacy failure classes keep their exact responses
 * (the fallback re-derives each legacy message before the zod one).
 */
export async function POST(request: NextRequest) {
  let caller: AuthUser | null = null;
  if (authRequired) {
    const auth = await requireCoach(request);
    if (auth instanceof Response) return auth;
    caller = auth;
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase admin not configured" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = broadcastBodySchema.safeParse(body);
  if (!parsed.success) {
    // Legacy responses preserved verbatim (§3.8 compat law):
    const raw = (body ?? {}) as Record<string, unknown>;
    const rawTitle = raw.title;
    const rawBody = raw.body;
    const rawTarget = raw.target;
    if (!rawTitle || !rawBody) {
      return NextResponse.json(
        { error: "Missing title or body" },
        { status: 400 },
      );
    }
    if (
      !rawTarget ||
      !["all", "selected", "single"].includes(rawTarget as string)
    ) {
      return NextResponse.json(
        { error: "Invalid target. Must be 'all', 'selected', or 'single'" },
        { status: 400 },
      );
    }
    if (rawTarget === "single" && !raw.userId) {
      return NextResponse.json(
        { error: "Missing userId for single target" },
        { status: 400 },
      );
    }
    if (
      rawTarget === "selected" &&
      (!raw.userIds || !Array.isArray(raw.userIds) || raw.userIds.length === 0)
    ) {
      return NextResponse.json(
        { error: "Missing userIds array for selected target" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const { target, userId, userIds, title, body: notifBody, link } = parsed.data;

  // (title/body presence + target validity are now guaranteed by
  // broadcastBodySchema — the legacy 400s above cover every failing
  // shape with the exact original messages.)

  // --- Multi-coach scoping: resolve the caller's client roster ---
  // (caller is non-null when authRequired — requireCoach passed;
  // in demo mode there is no session and the route degrades as before)
  const isAdmin = caller?.role === "admin";
  const callerId = caller?.id ?? null;

  let allowedClientIds: Set<string> | null = null; // null = unrestricted (admin)
  if (!isAdmin && callerId) {
    const { data: assigned } = await supabaseAdmin
      .from("coach_assignments")
      .select("client_id")
      .eq("coach_id", callerId);
    allowedClientIds = new Set(((assigned ?? []) as { client_id: string }[]).map((r) => r.client_id));
  }

  const ensureAllowed = (clientId: string) =>
    !allowedClientIds || allowedClientIds.has(clientId);

  // ── NOTIF→PLAN 2026-10-24 (owner order item 2 — إشعارات الاستبيانات
  // لغير المشتركين): SURVEY-notification eligibility ──────────────────
  // A notification whose link targets the questionnaire surface
  // (/questionnaires — the questionnaire-reminder template's link) may
  // only reach ENTITLED members: clients assigned to a coach (B2B — the
  // coach's own roster) OR clients with an ACTIVE site subscription
  // (B2C — the progress-reminder cron's established eligibility rule).
  // A registered-but-unsubscribed profile is NOT entitled to coaching
  // workflow pings. The check runs BEFORE any insert; skipped ids are
  // reported honestly in the response. Non-survey links (renewal
  // reminders, announcements…) keep the legacy reach — only the survey
  // class is gated.
  const isSurveyLink = (l: string | null | undefined) =>
    typeof l === "string" && l.split("?")[0].replace(/\/+$/, "") === "/questionnaires";

  const resolveEligibleClientIds = async (candidateIds: string[]): Promise<Set<string>> => {
    const eligible = new Set<string>();
    if (candidateIds.length === 0) return eligible;
    if (!supabaseAdmin) return new Set(candidateIds); // unreachable post-guard; narrows TS
    const db = supabaseAdmin;
    try {
      const [assignedRes, subsRes] = await Promise.all([
        db.from("coach_assignments").select("client_id").in("client_id", candidateIds),
        db.from("subscriptions").select("client_id").eq("status", "active").in("client_id", candidateIds),
      ]);
      for (const r of (assignedRes.data ?? []) as { client_id: string }[]) eligible.add(r.client_id);
      for (const r of (subsRes.data ?? []) as { client_id: string }[]) eligible.add(r.client_id);
    } catch (e) {
      // Fail-open policy question: on resolver error we degrade to the
      // LEGACY behavior (everyone passes) rather than silently muting
      // the coach's send — the error is logged for the audit trail.
      console.error("[broadcast] survey-eligibility resolver failed — degrading to legacy reach:", e instanceof Error ? e.message : String(e));
      return new Set(candidateIds);
    }
    return eligible;
  };

  // --- Single client ---
  if (target === "single") {
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId for single target" },
        { status: 400 },
      );
    }
    if (!ensureAllowed(userId)) {
      return NextResponse.json(
        { error: "Forbidden — client is not assigned to you" },
        { status: 403 },
      );
    }
    // Survey eligibility (item 2) — verified BEFORE the insert.
    if (isSurveyLink(link)) {
      const eligible = await resolveEligibleClientIds([userId]);
      if (!eligible.has(userId)) {
        return NextResponse.json(
          { error: "Forbidden — this client is not eligible for questionnaire notifications (no coach assignment, no active subscription)" },
          { status: 403 },
        );
      }
    }
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        type: "coach_message",
        title,
        body: notifBody,
        link: link || "/dashboard",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, sent: 1, id: data?.id });
  }

  // --- Selected clients (multi-select) ---
  if (target === "selected") {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Missing userIds array for selected target" },
        { status: 400 },
      );
    }
    // Limit to 500 to prevent abuse
    const requested = userIds.slice(0, 500) as string[];
    let ids = allowedClientIds
      ? requested.filter((uid: string) => allowedClientIds!.has(uid))
      : requested;
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Forbidden — none of the selected clients are assigned to you" },
        { status: 403 },
      );
    }
    // Survey eligibility (item 2): ineligible ids are SKIPPED (not a 403 —
    // a mixed selection must still reach the entitled members) and the
    // count is reported honestly.
    let skippedIneligible = 0;
    if (isSurveyLink(link)) {
      const eligible = await resolveEligibleClientIds(ids);
      skippedIneligible = ids.length - ids.filter((uid: string) => eligible.has(uid)).length;
      ids = ids.filter((uid: string) => eligible.has(uid));
      if (ids.length === 0) {
        return NextResponse.json(
          { ok: true, sent: 0, skipped_ineligible: skippedIneligible, message: "None of the selected clients are eligible for questionnaire notifications" },
        );
      }
    }
    const notifications = ids.map((uid: string) => ({
      user_id: uid,
      type: "coach_message",
      title,
      body: notifBody,
      link: link || "/dashboard",
    }));
    const { error } = await supabaseAdmin
      .from("notifications")
      .insert(notifications);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, sent: notifications.length, ...(skippedIneligible > 0 ? { skipped_ineligible: skippedIneligible } : {}) });
  }

  // --- Broadcast to ALL clients ("all" = my clients for a plain coach) ---
  let clientsQuery = supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "client");
  if (allowedClientIds) {
    if (allowedClientIds.size === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No assigned clients" });
    }
    clientsQuery = clientsQuery.in("id", [...allowedClientIds]);
  }
  const { data: clients, error: clientsError } = await clientsQuery;

  if (clientsError) {
    return NextResponse.json({ error: clientsError.message }, { status: 500 });
  }

  if (!clients || clients.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No clients found" });
  }

  // Survey eligibility (item 2): the admin's "all clients" historically
  // reached EVERY role=client profile — including registered-but-
  // unsubscribed ones. Survey notifications now filter to the entitled
  // set (assigned OR actively subscribed); the skip count is reported.
  let allSkippedIneligible = 0;
  let recipients = clients as { id: string }[];
  if (isSurveyLink(link)) {
    const eligible = await resolveEligibleClientIds(recipients.map((c) => c.id));
    allSkippedIneligible = recipients.length - recipients.filter((c) => eligible.has(c.id)).length;
    recipients = recipients.filter((c) => eligible.has(c.id));
    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, skipped_ineligible: allSkippedIneligible, message: "No eligible clients for questionnaire notifications" });
    }
  }

  // Bulk insert notifications for all clients — M22 fix: batch in chunks of 500
  // to avoid Supabase's insert limit + partial failure on large client lists.
  const notifications = recipients.map((c: { id: string }) => ({
    user_id: c.id,
    type: "coach_broadcast",
    title,
    body: notifBody,
    link: link || "/dashboard",
  }));

  const BATCH_SIZE = 500;
  let totalInserted = 0;
  let lastError: string | null = null;

  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);
    const { error: batchError } = await supabaseAdmin
      .from("notifications")
      .insert(batch);
    if (batchError) {
      lastError = batchError.message;
      console.error(`[broadcast] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, batchError.message);
    } else {
      totalInserted += batch.length;
    }
  }

  if (totalInserted === 0 && lastError) {
    return NextResponse.json({ error: lastError }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    sent: totalInserted,
    total: notifications.length,
    ...(allSkippedIneligible > 0 ? { skipped_ineligible: allSkippedIneligible } : {}),
    ...(lastError ? { partialError: lastError } : {}),
  });
}