import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  COACH_ACTIVATABLE_TIERS,
  coachActivationCostUsd,
  isCoachPaymentMethod,
  type CoachPaymentMethod,
} from "@/lib/coach-limits";
import { coachActivationBodySchema } from "@/lib/validation/schemas";
import { processCoachClientActivationServer } from "@/lib/affiliate-engine-server";

/**
 * COACH ACTIVATES A CLIENT'S SUBSCRIPTION AFTER OFFLINE PAYMENT (0034)
 * + WALLET GATE (0035).
 *
 * OWNER MODEL: the coach collects the money from HIS client OUTSIDE the
 * site (cash / Vodafone Cash / InstaPay / bank transfer) and then
 * activates the subscription from the client's page. BUT the coach also
 * pays THE SITE the FIXED package price per client ($6 / 1 month,
 * $16 / 3 months, any other duration $6 × months — m7 owner decision
 * «أ» 2026-09-18: fee_per_client is out of the equation) from his
 * WALLET: since 0035 a coach can only activate when his wallet
 * balance covers the full cost — the cost is debited
 * atomically (coach_adjust_wallet) BEFORE extending, and refunded if
 * the activation itself fails. ADMINS are exempt (no wallet check).
 * The site still never touches the coach↔client money — it RECORDS it
 * (coach_payments) and the client sees the receipt on his dashboard.
 *
 * POST /api/coach/subscriptions/activate
 *   { client_id, tier, months, amount?, method?, note? }
 *
 * - coach: may ONLY activate for his own assigned clients (verified
 *   against coach_assignments — poaching-proof, mirrors /api/coach/claim).
 * - admin: may activate for anyone (wallet-exempt manual override).
 * - The extension itself runs extend_subscription() (0018 math, now
 *   0034-guarded) through the service role, then a coach_payments row
 *   is written and the client gets a notification.
 *
 * Wave 2A (2026-09-17): the body passes the central zod gate (types +
 * raw bounds + unknown-key stripping) BEFORE the domain checks below —
 * the zod gate is SHAPE only: UUID_RE / tier allowlist / months 1-12 /
 * amount 0-10M / payment-method allowlist stay the policy here, and
 * every legacy 400 class (bad_request · bad_tier · bad_months ·
 * bad_amount · bad_method) is re-derived verbatim on gate failure.
 * The months/amount string-union members preserve the legacy Number()
 * coercion for numeric strings; note ≤500 (the legacy slice point).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // Wave 2A zod gate — shape only; every legacy 400 class below is
  // re-derived verbatim on gate failure (compat law).
  const parsed = coachActivationBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = (body ?? {}) as Record<string, unknown>;
    const rawClientId = String(raw.client_id ?? "").trim();
    const rawTier = String(raw.tier ?? "").trim();
    const rawMonths = Number(raw.months);
    if (!UUID_RE.test(rawClientId)) {
      return NextResponse.json(
        { error: "bad_request", message: "عميل غير صحيح" },
        { status: 400 },
      );
    }
    if (!(COACH_ACTIVATABLE_TIERS as readonly string[]).includes(rawTier)) {
      return NextResponse.json(
        { error: "bad_tier", message: "اختر باقة صحيحة (بريميوم / برو / التدريب الأونلاين)" },
        { status: 400 },
      );
    }
    if (!Number.isInteger(rawMonths) || rawMonths < 1 || rawMonths > 12) {
      return NextResponse.json(
        { error: "bad_months", message: "المدة من شهر إلى ١٢ شهر" },
        { status: 400 },
      );
    }
    if (
      raw.amount !== undefined &&
      raw.amount !== null &&
      raw.amount !== ""
    ) {
      const n = Number(raw.amount);
      if (!Number.isFinite(n) || n < 0 || n > 10_000_000) {
        return NextResponse.json(
          { error: "bad_amount", message: "المبلغ غير صحيح" },
          { status: 400 },
        );
      }
    }
    if (!isCoachPaymentMethod(raw.method ?? "cash")) {
      return NextResponse.json(
        { error: "bad_method", message: "طريقة دفع غير معروفة" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const clientId = parsed.data.client_id.trim();
  const tier = parsed.data.tier.trim();
  const months = Number(parsed.data.months);
  const amountRaw = parsed.data.amount;
  const method = (parsed.data.method ?? "cash") as CoachPaymentMethod;
  const note =
    (parsed.data.note ?? "").toString().trim().slice(0, 500) || null;

  if (!UUID_RE.test(clientId)) {
    return NextResponse.json(
      { error: "bad_request", message: "عميل غير صحيح" },
      { status: 400 },
    );
  }
  if (!(COACH_ACTIVATABLE_TIERS as readonly string[]).includes(tier)) {
    return NextResponse.json(
      { error: "bad_tier", message: "اختر باقة صحيحة (بريميوم / برو / التدريب الأونلاين)" },
      { status: 400 },
    );
  }
  // ── OWNER DECREE (2026-08-30): «المدرب شايف اشتراك العميل فى الموقع
  // نفسه ده خطأ» — coaches sell ONLY their coaching package. Site
  // memberships (premium/pro) are sold on the site itself, never from
  // the coach dashboard. Admins keep the manual override for all tiers.
  if (auth.role === "coach" && tier !== "coaching") {
    return NextResponse.json(
      {
        error: "coach_tier_forbidden",
        message:
          "المدرب يفعّل باقة الكوتشينج فقط — عضويات الموقع (بريميوم / برو) تُباع من الموقع مباشرة وليست لدى المدرب.",
      },
      { status: 403 },
    );
  }
  if (!Number.isInteger(months) || months < 1 || months > 12) {
    return NextResponse.json(
      { error: "bad_months", message: "المدة من شهر إلى ١٢ شهر" },
      { status: 400 },
    );
  }
  let amount: number | null = null;
  if (amountRaw !== undefined && amountRaw !== null && amountRaw !== "") {
    const n = Number(amountRaw);
    if (!Number.isFinite(n) || n < 0 || n > 10_000_000) {
      return NextResponse.json(
        { error: "bad_amount", message: "المبلغ غير صحيح" },
        { status: 400 },
      );
    }
    amount = Math.round(n * 100) / 100;
  }
  if (!isCoachPaymentMethod(method)) {
    return NextResponse.json(
      { error: "bad_method", message: "طريقة دفع غير معروفة" },
      { status: 400 },
    );
  }

  // Target must be a real CLIENT (staff emails are never clients).
  const { data: target, error: targetErr } = await supabaseAdmin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", clientId)
    .maybeSingle();

  if (targetErr || !target) {
    return NextResponse.json(
      { error: "not_found", message: "العميل غير موجود" },
      { status: 404 },
    );
  }
  if (target.role !== "client") {
    return NextResponse.json(
      { error: "not_a_client", message: "ده مش عميل — أعضاء الفريق لا تُفعَّل لهم اشتراكات" },
      { status: 409 },
    );
  }

  // Coaches activate ONLY their own clients; admins pass.
  if (auth.role === "coach") {
    const { data: owned } = await supabaseAdmin
      .from("coach_assignments")
      .select("client_id")
      .eq("client_id", clientId)
      .eq("coach_id", auth.id)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json(
        { error: "not_your_client", message: "هذا العميل ليس من عملائك" },
        { status: 403 },
      );
    }
  }

  // ── 0035 WALLET GATE — no paid slot, no activation (coaches only). ──
  // OWNER PRICING (2026-08-30): «اسعار المدربين لكل عميل ٣٠٠ الشهر /
  // ٨٠٠ ٣ شهور» + GLOBAL USD decree («٣٠٠ جنيه تصبح ٦ دولار») — package
  // prices for 1 and 3 months ALWAYS win in USD ($6 / $16); any other
  // duration is linear on the fixed $6 monthly rate. FIXED PRICING ONLY
  // (2026-09-18 — audit m7 owner decision «أ»): coach_fees.fee_per_client
  // is no longer read here — the debit is a pure function of duration.
  const paymentId = crypto.randomUUID();
  let walletCost = 0;
  if (auth.role === "coach") {
    const walletRes = await supabaseAdmin
      .from("coach_wallets")
      .select("balance")
      .eq("coach_id", auth.id)
      .maybeSingle();
    walletCost = coachActivationCostUsd(months);
    if (walletCost > 0) {
      const missingTable = walletRes.error?.message.includes("coach_wallet");
      if (missingTable) {
        return NextResponse.json(
          {
            error: "db_error",
            message: "شغّل هجرة 0035 أولًا (RUN_ON_SUPABASE_0035_COACH_WALLET.sql)",
          },
          { status: 503 },
        );
      }
      const balance = Number(walletRes.data?.balance ?? 0);
      if (balance < walletCost) {
        return NextResponse.json(
          {
            error: "insufficient_wallet",
            message: `رصيد محفظتك (${balance}$) مش كفاية لتفعيل ${months} ${months === 1 ? "شهر" : "شهور"} — المطلوب ${walletCost}$. اشحن المحفظة الأول (PayPal / انستاباي / فودافون كاش) وهيتم التفعيل فورًا.`,
            balance,
            cost: walletCost,
          },
          { status: 402 },
        );
      }
    }
  }

  // ── Debit the wallet FIRST (atomic) so no failure can leave a free
  // slot; refunded below if the activation itself fails.
  if (walletCost > 0) {
    const { error: debitErr } = await supabaseAdmin.rpc("coach_adjust_wallet", {
      p_coach_id: auth.id,
      p_amount: -walletCost,
      p_kind: "activation",
      p_ref_id: paymentId,
      p_note: `تفعيل ${months} ${months === 1 ? "شهر" : "شهور"} — عميل ${target.full_name ?? clientId}`,
      p_created_by: auth.id,
    });
    if (debitErr) {
      const insufficient = debitErr.message.includes("insufficient");
      return NextResponse.json(
        {
          error: "insufficient_wallet",
          message: insufficient
            ? "رصيد محفظتك مش كفاية — اشحن المحفظة الأول (انستاباي / فودافون كاش / PayPal)."
            : "فشل خصم رسوم التفعيل من المحفظة — حاول تاني.",
        },
        { status: 402 },
      );
    }
  }

  // Extend / create the subscription (0018 math — preserves paid days).
  // Service-role call → passes the 0034 guard.
  const subscriptionType = tier === "coaching" ? "coaching" : "membership";
  const { data: subscription, error: rpcErr } = await supabaseAdmin.rpc(
    "extend_subscription",
    {
      p_client_id: clientId,
      p_tier: tier,
      p_months: months,
      p_subscription_type: subscriptionType,
      // 0042: the wallet debit + ledger row above ARE the evidence here
      p_request_id: null,
    },
  );

  if (rpcErr || !subscription) {
    const msg = rpcErr?.message ?? "سبب غير معروف";
    const friendly = msg.includes("assigned coach")
      ? "هذا العميل ليس من عملائك"
      : `فشل تفعيل الاشتراك: ${msg}`;
    // Refund the wallet debit — the coach never pays for a failed slot.
    if (walletCost > 0) {
      await supabaseAdmin.rpc("coach_adjust_wallet", {
        p_coach_id: auth.id,
        p_amount: walletCost,
        p_kind: "adjust",
        p_ref_id: paymentId,
        p_note: "استرداد — فشل تفعيل الاشتراك",
        p_created_by: auth.id,
      });
    }
    return NextResponse.json(
      { error: "activation_failed", message: friendly },
      { status: 502 },
    );
  }

  // Ledger row — the admin's audit trail of offline collections.
  const { error: payErr } = await supabaseAdmin
    .from("coach_payments")
    .insert({
      id: paymentId,
      coach_id: auth.id,
      client_id: clientId,
      subscription_id: subscription.id,
      tier,
      months,
      amount,
      currency: "USD",
      method,
      note,
    });

  if (payErr) {
    // Subscription is ACTIVE — never fail the coach over ledger trouble.
    console.error("[api/coach/subscriptions/activate] ledger insert failed:", payErr.message);
  }

  // ── PHASE 66 — OWNER DECREE (2026-09-01): «لو مدرب جديد اشترك عن طريق
  // رابط افيليت ودفع للموقع اشتراك عن عملاءه يتم احتساب عمولة للداعى».
  // A COACH who joined via an affiliate link pays the site for every
  // client activation — his inviter earns 20% of that site fee. Fired
  // AFTER the successful wallet debit (the real revenue moment), keyed on
  // paymentId so retries can never double-pay. Skipped for admins
  // (walletCost = 0 — no site revenue) and for coaches who joined without
  // a referral. Best-effort: never blocks the activation.
  if (auth.role === "coach" && walletCost > 0) {
    try {
      const commission = await processCoachClientActivationServer(
        auth.id,
        walletCost,
        paymentId,
        { clientId, tier, months },
      );
      if (commission) {
        console.log(
          `[api/coach/subscriptions/activate] affiliate commission $${commission.amount} → ${commission.affiliate_user_id} (coach activation ${paymentId})`,
        );
      }
    } catch (commissionError) {
      console.error(
        "[api/coach/subscriptions/activate] affiliate commission error (non-blocking):",
        commissionError,
      );
    }
  }

  // Tell the client his subscription is live.
  // 0093: payload carries the ISO end date — the bell's catalog formats it
  // per UI language (ar-EG renders Arabic-Indic; en-US renders English).
  const end = subscription.end_date
    ? new Date(subscription.end_date).toLocaleDateString("ar-EG")
    : "";
  await supabaseAdmin.from("notifications").insert({
    user_id: clientId,
    type: "subscription_activated",
    title: "تم تفعيل اشتراكك 🎉",
    body: `مدربك قام بتفعيل اشتراكك لمدة ${months} ${months === 1 ? "شهر" : "شهور"} — ساري حتى ${end}.`,
    link: "/dashboard",
    payload: { months, end: subscription.end_date ?? "" },
  });

  return NextResponse.json({
    ok: true,
    subscription,
    payment_id: payErr ? null : paymentId,
  });
}
