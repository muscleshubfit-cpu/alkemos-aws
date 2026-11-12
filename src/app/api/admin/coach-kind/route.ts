import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authRequired } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { adminCoachKindBodySchema } from "@/lib/validation/schemas";

/**
 * ADMIN — COACH KIND TOGGLE (Phase 103, 0067).
 * Owner directive: «تفرقة بين مدربين الموقع ومدربين b2b».
 *
 * PATCH { coach_id, coach_kind: 'site' | 'b2b' }
 *   → flips profiles.coach_kind for ONE coach (role must be 'coach').
 *     'site' = a SITE coach: follows up site members (B2C) from the new
 *     roster page. 'b2b' = an external partner with his own clients,
 *     wallet and per-client billing (today's default — every existing
 *     coach stayed 'b2b' in 0067).
 *
 * The role itself is NEVER touched here — promotion/demotion stays in
 * /api/admin/staff (the auto_promote_coach_if_allowed trigger guards
 * role changes; this column is NOT role). Admin-exclusive (requireAdmin).
 */
export async function PATCH(request: NextRequest) {
  if (authRequired) {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  // Wave 3 zod gate — shape only; the enum IS the legacy check, so every
  // gate failure re-derives the legacy 400 verbatim (compat law).
  const parsed = adminCoachKindBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = (body ?? {}) as Record<string, unknown>;
    const rawCoachId = String(raw.coach_id ?? "");
    const rawKind = String(raw.coach_kind ?? "");
    if (!rawCoachId || (rawKind !== "site" && rawKind !== "b2b")) {
      return NextResponse.json(
        { error: "bad_request", message: "coach_id و coach_kind ('site' أو 'b2b') مطلوبان" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const coachId = parsed.data.coach_id;
  const kind = parsed.data.coach_kind;

  if (!coachId || (kind !== "site" && kind !== "b2b")) {
    return NextResponse.json(
      { error: "bad_request", message: "coach_id و coach_kind ('site' أو 'b2b') مطلوبان" },
      { status: 400 },
    );
  }

  // GUARD — only coach rows carry a meaningful coach_kind.
  const { data: target, error: tErr } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", coachId)
    .maybeSingle();

  if (tErr) {
    return NextResponse.json({ error: tErr.message }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: "not_found", message: "الحساب غير موجود" }, { status: 404 });
  }
  if ((target as { role: string }).role !== "coach") {
    return NextResponse.json(
      { error: "bad_request", message: "الحساب المطلوب ليس مدربًا" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ coach_kind: kind })
    .eq("id", coachId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, coach_kind: kind });
}
