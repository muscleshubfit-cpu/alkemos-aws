import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { adminWalletAdjustBodySchema } from "@/lib/validation/schemas";

/**
 * ADMIN — MANUAL WALLET ADJUSTMENT (0035).
 * POST /api/admin/wallets/adjust  { coach_id, amount, note }
 *
 * The owner's «يكتب الرصيد يدوى» power beyond receipt approvals: credit
 * (+) or correct (−) any coach's balance by hand, note mandatory so the
 * ledger stays explainable. The wallet's ONLY writer remains
 * coach_adjust_wallet (0035) — this route is just an authenticated
 * service-role wrapper around it.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  // Wave 3 zod gate — shape only (§7 owner-approved: coach_adjust_wallet
  // math + the staff-role guard below stay route policy); the legacy
  // bad_request/bad_amount/bad_note 400s are re-derived verbatim in
  // legacy order on gate failure (compat law).
  const parsed = adminWalletAdjustBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = (body ?? {}) as Record<string, unknown>;
    const rawCoachId = String(raw.coach_id ?? "").trim();
    const rawAmount = Number(raw.amount);
    const rawNote = String(raw.note ?? "").trim().slice(0, 300);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCoachId)) {
      return NextResponse.json(
        { error: "bad_request", message: "مدرب غير صحيح" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(rawAmount) || rawAmount === 0 || Math.abs(rawAmount) > 1_000_000) {
      return NextResponse.json(
        { error: "bad_amount", message: "المبلغ لازم رقم غير صفر" },
        { status: 400 },
      );
    }
    if (!rawNote) {
      return NextResponse.json(
        { error: "bad_note", message: "اكتب سبب التعديل — الحساب لازم يفضل مفهوم" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const coachId = parsed.data.coach_id;
  const amount = Number(parsed.data.amount);
  const note = parsed.data.note.slice(0, 300);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coachId)) {
    return NextResponse.json(
      { error: "bad_request", message: "مدرب غير صحيح" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1_000_000) {
    return NextResponse.json(
      { error: "bad_amount", message: "المبلغ لازم رقم غير صفر" },
      { status: 400 },
    );
  }
  if (!note) {
    return NextResponse.json(
      { error: "bad_note", message: "اكتب سبب التعديل — الحساب لازم يفضل مفهوم" },
      { status: 400 },
    );
  }

  // Target must be staff (wallets belong to coaches/admins, not clients).
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", coachId)
    .maybeSingle();
  if (!target || !(target.role === "coach" || target.role === "admin")) {
    return NextResponse.json(
      { error: "not_staff", message: "المحافظ للمدربين فقط" },
      { status: 409 },
    );
  }

  const { data: balance, error: rpcErr } = await supabaseAdmin.rpc(
    "coach_adjust_wallet",
    {
      p_coach_id: coachId,
      p_amount: Math.round(amount * 100) / 100,
      p_kind: "adjust",
      p_ref_id: null,
      p_note: note,
      p_created_by: auth.id,
    },
  );

  if (rpcErr) {
    const hint = rpcErr.message.includes("coach_adjust_wallet")
      ? "شغّل هجرة 0035 أولًا (RUN_ON_SUPABASE_0035_COACH_WALLET.sql)"
      : rpcErr.message.includes("insufficient")
        ? "الرصيد الحالي لا يكفي لهذا الخصم"
        : rpcErr.message;
    return NextResponse.json({ error: "adjust_failed", message: hint }, { status: 502 });
  }

  await supabaseAdmin.from("notifications").insert({
    user_id: coachId,
    type: "wallet_adjusted",
    title: amount > 0 ? "تم إضافة رصيد لمحفظتك" : "تم تعديل رصيد محفظتك",
    body: `${amount > 0 ? "+" : ""}${amount}$ — ${note}`,
    link: "/coach/wallet",
    payload: { amount, note: note ?? "" },
  });

  return NextResponse.json({ ok: true, balance });
}
