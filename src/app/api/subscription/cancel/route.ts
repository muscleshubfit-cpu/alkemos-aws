import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { emptyEnvelopeBodySchema } from "@/lib/validation/schemas";

/**
 * POST /api/subscription/cancel — Phase 68 (owner-approved).
 *
 * The memberships FAQ promises «ألغِ في أي وقت من صفحة حسابك» — until now
 * that promise had NO backing UI or API. This route records the member's
 * cancellation REQUEST on his active subscription
 * (subscriptions.cancel_requested_at, added by 0057):
 *
 *   - Access is NEVER cut immediately: the member paid for the period,
 *     so the subscription stays active until end_date (stated plainly in
 *     the profile dialog).
 *   - There is no auto-renewal anywhere in the payment stack (PayPal
 *     Orders are one-time; receipts are manual), so "cancel" = the
 *     subscription simply ends at end_date — the request also rings the
 *     admin bell for support/refund follow-up.
 *
 * Writes are service-role: 0041 keeps direct subscriptions UPDATE
 * admin-only, and the client may only SELECT his own rows.
 *
 * Wave 2B completion (2026-09-17): the route consumes NO request fields
 * (every input is server-derived), so the central zod gate pins the
 * ENVELOPE only (emptyEnvelopeBodySchema): real callers (profile page)
 * send no body — null/unparseable maps to {} pre-gate and any object
 * passes with unknown keys stripped, identical to legacy ignore
 * semantics. A hostile non-object JSON body (array/scalar) was a silent
 * no-op 200 in legacy and now 400s before the money-adjacent flow (the
 * saved-tool DELETE-id fail-fast class). §7 logic untouched — auth-first
 * ordering preserved (the gate never fires before requireUser).
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  // Wave 2B completion zod envelope gate — the route reads no fields; a
  // hostile non-object JSON body (legacy silent no-op 200) now 400s
  // before the money-adjacent flow. Real callers send no body at all.
  const rawBody: unknown = await request.json().catch(() => null);
  const parsedBody = emptyEnvelopeBodySchema.safeParse(rawBody ?? {});
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const nowIso = new Date().toISOString();

  // 1. Find the caller's ACTIVE subscription (mirrors getAuthUser filter)
  const { data: subs } = await supabaseAdmin
    .from("subscriptions")
    .select("id, tier, end_date, cancel_requested_at")
    .eq("client_id", auth.id)
    .eq("status", "active")
    .gt("end_date", nowIso)
    .order("end_date", { ascending: false });

  const rows = (subs ?? []) as {
    id: string;
    tier: string;
    end_date: string;
    cancel_requested_at: string | null;
  }[];

  if (rows.length === 0) {
    return NextResponse.json(
      {
        error: "no_active_subscription",
        message: "لا يوجد اشتراك نشط لإلغائه",
      },
      { status: 404 },
    );
  }

  // 2. Mark every active row cancelled-requested (idempotent — re-request
  //    keeps the original timestamp)
  const pending = rows.filter((r) => !r.cancel_requested_at);
  for (const row of pending) {
    const { error: updErr } = await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_requested_at: nowIso })
      .eq("id", row.id);
    if (updErr) {
      console.error("[api/subscription/cancel] update error:", updErr.message);
      return NextResponse.json(
        { error: "update_failed", message: "حدثت مشكلة — حاول مرة أخرى" },
        { status: 500 },
      );
    }
  }

  // 3. Ring the admin bell (best-effort, deduped per member per day).
  // FIX 2026-10-27 (live-measured duplicate): the insert ran even when
  // `pending` was empty (alreadyRequested re-request), landing a second
  // identical bell row — the documented per-member-per-day dedup is now
  // enforced by only ringing on the FIRST actual request.
  if (pending.length > 0) {
    try {
      const { data: adm } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (adm) {
        const dedupType = `subscription_cancel_request:${auth.id}:${new Date()
          .toISOString()
          .slice(0, 10)}`;
        await supabaseAdmin.from("admin_notifications").insert({
          type: dedupType,
          title: "طلب إلغاء اشتراك",
          body: `${auth.email ?? auth.id} طلب إلغاء اشتراكه (${rows[0].tier}) — يستمر الاشتراك حتى نهاية آخر مدة مدفوعة (${new Date(rows[0].end_date).toLocaleDateString("ar-EG")}). راجع صفحة المدفوعات لو محتاج تعمل استرداد.`,
          link: "/admin/payments",
          target_role: "coach",
          target_coach_id: (adm as { id: string }).id,
          payload: { email: auth.email ?? auth.id, tier: rows[0].tier, end_iso: rows[0].end_date },
          read: false,
        });
      }
    } catch (e) {
      console.error("[api/subscription/cancel] admin notification error (non-blocking):", e);
    }
  }

  return NextResponse.json({
    ok: true,
    alreadyRequested: pending.length === 0,
    tier: rows[0].tier,
    endDate: rows[0].end_date,
  });
}
