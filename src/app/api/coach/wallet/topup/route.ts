import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isCoachTopupMethod } from "@/lib/coach-limits";
import { coachTopupBodySchema } from "@/lib/validation/schemas";

/**
 * COACH WALLET TOP-UP REQUEST (0035).
 * POST /api/coach/wallet/topup  { amount, method, note?, receipt_path }
 *
 * The coach pays THE SITE (InstaPay / Vodafone Cash / PayPal), uploads
 * the payment receipt (already stored in the private `receipts` bucket
 * via /api/upload or uploadReceipt) and submits this request. The ADMIN
 * reviews it on /admin/wallets — approving credits the wallet through
 * coach_adjust_wallet(). Nothing here touches the balance directly:
 * coach_topup_requests is written pending-only by the coach, and ONLY
 * the admin review route may credit.
 *
 * No fixed prices by owner decree — the coach types the amount he paid.
 *
 * Wave 2A (2026-09-17): the body passes the central zod gate (types +
 * raw bounds + unknown-key stripping) — the numeric-range, method
 * allowlist and receipt-ownership checks stay the policy below, and
 * every legacy 400 class (bad_amount · bad_method · bad_receipt) is
 * re-derived verbatim on gate failure. note ≤300 (the legacy slice
 * point); receipt_path keeps its own >500 rejection.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (auth.role !== "coach" && auth.role !== "admin") {
    return NextResponse.json(
      { error: "forbidden", message: "هذه الصفحة للمدربين فقط" },
      { status: 403 },
    );
  }

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  // Wave 2A zod gate — legacy 400 classes re-derived verbatim on failure.
  const parsed = coachTopupBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = (body ?? {}) as Record<string, unknown>;
    const rawAmount = Number(raw.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0 || rawAmount > 1_000_000) {
      return NextResponse.json(
        { error: "bad_amount", message: "اكتب مبلغ شحن صحيح" },
        { status: 400 },
      );
    }
    if (!isCoachTopupMethod(raw.method)) {
      return NextResponse.json(
        { error: "bad_method", message: "طريقة الشحن غير معروفة" },
        { status: 400 },
      );
    }
    const legacyReceipt = String(raw.receipt_path ?? "").trim();
    const legacyOwner = legacyReceipt.split("/")[1] || "";
    if (
      !legacyReceipt.startsWith("receipts/") ||
      legacyReceipt.length > 500 ||
      legacyOwner !== auth.id
    ) {
      return NextResponse.json(
        { error: "bad_receipt", message: "ارفع صورة إيصال الدفع (أو PDF) الأول" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const amount = Number(parsed.data.amount);
  const method = parsed.data.method;
  const note = (parsed.data.note ?? "").toString().trim().slice(0, 300) || null;
  const receiptPath = parsed.data.receipt_path.trim();

  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return NextResponse.json(
      { error: "bad_amount", message: "اكتب مبلغ شحن صحيح" },
      { status: 400 },
    );
  }
  if (!isCoachTopupMethod(method)) {
    return NextResponse.json(
      { error: "bad_method", message: "طريقة الشحن غير معروفة" },
      { status: 400 },
    );
  }
  // Receipt is mandatory — the admin has nothing to review without it.
  // P3-11 🔐 (deep-audit confirmed 19, Phase 217 — owner §7 approval
  // «أوافق على التنفيذ كاملًا»): the path must be the caller's OWN upload.
  // /api/upload rebuilds receipt paths SERVER-SIDE as
  // receipts/<caller-uid>/<ts>-<name> (the UPLOAD LAW), so the uid
  // segment is the ownership proof — anything else (another user's
  // receipt, a fabricated path, a traversal attempt) is rejected here
  // before the request row is ever created. Legacy rows keep whatever
  // path they were stored with; this gate only guards NEW inserts.
  const receiptOwner = receiptPath.split("/")[1] || "";
  if (
    !receiptPath.startsWith("receipts/") ||
    receiptPath.length > 500 ||
    receiptOwner !== auth.id
  ) {
    return NextResponse.json(
      { error: "bad_receipt", message: "ارفع صورة إيصال الدفع (أو PDF) الأول" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("coach_topup_requests")
    .insert({
      coach_id: auth.id,
      amount: Math.round(amount * 100) / 100,
      method,
      note,
      receipt_path: receiptPath,
      // status defaults to 'pending' in the DB — made explicit for clarity.
      status: "pending",
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    const hint = error.message.includes("coach_topup_requests")
      ? "شغّل هجرة 0035 أولًا (RUN_ON_SUPABASE_0035_COACH_WALLET.sql)"
      : error.message;
    return NextResponse.json({ error: "db_error", message: hint }, { status: 503 });
  }

  return NextResponse.json({ ok: true, topup: data });
}
