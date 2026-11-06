import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "@/lib/auth-server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { coachInviteBodySchema } from "@/lib/validation/schemas";
import { isAdoptableInvitedUser } from "@/lib/auth-invite-adopt";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * I-1 RESEND INVITE (UX-TEST-REPORT-2026-09-21 §5-1 — the «زر إعادة
 * إرسال» that completes the B2B visibility loop next to 0092's
 * invite_pending badge; owner order «ابدأ التحسينات» 2026-09-22).
 *
 * POST /api/coach/clients/invite/resend  { email }
 *
 * Re-notifies a PENDING invitee — 0092/H1 law: the auth row was created
 * by inviteUserByEmail (invited_at set) and has NEVER signed in
 * (last_sign_in_at null). The exact gate is lib/auth-invite-adopt.ts's
 * isAdoptableInvitedUser — the SAME pure predicate the adoption route
 * enforces, so an activated or self-registered account can NEVER be
 * re-notified here (409 not_pending).
 *
 * The email deliberately carries NO GoTrue token link: since the H1-2026
 * fix (ff744b4c) the honest self-serve path is the SIGNUP FORM — the
 * invitee signs up with this email + his own password and
 * /api/auth/complete-invite adopts the shadow row instantly (token links
 * are also consumed client-side only with detectSessionInUrl=false, so a
 * fragile link would re-create the exact deadlock this batch closes).
 * The email is an instruction card (bilingual), sent via the SAME Brevo
 * account /api/send-email already uses — zero new external dependencies
 * (§7).
 *
 * Anti-abuse: staff-only (requireCoach) + 5/min/IP + 3/hour per email
 * via the shared rate-limit store (send-email's harassment guard
 * precedent) + honest 409 for already-activated rows (the coach is an
 * authenticated principal — anti-enumeration does not apply).
 */

export const runtime = "nodejs";

const IP_WINDOW = 60 * 1000;
const IP_MAX = 5;
const EMAIL_WINDOW = 60 * 60 * 1000;
const EMAIL_MAX = 3;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://alkemos.com").replace(/\/$/, "");

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(coachName: string, isAr: boolean): string {
  const dir = isAr ? "rtl" : "ltr";
  const align = isAr ? "right" : "left";
  const greeting = coachName
    ? isAr
      ? `دعاك ${esc(coachName)} ليكون مدربك على Alkemos.`
      : `${esc(coachName)} invited you to be his client on Alkemos.`
    : isAr
      ? "مدربك دعاك إلى Alkemos."
      : "Your coach invited you to Alkemos.";
  const steps = isAr
    ? [
        "افتح صفحة إنشاء الحساب من الزر أدناه.",
        "سجّل بنفس البريد الذي وصلتك به هذه الرسالة واختر كلمة مرورك.",
        "حسابك يتفعل فورًا ويُربط بحساب مدربك تلقائيًا — بلا أي خطوة إضافية.",
      ]
    : [
        "Open the signup page from the button below.",
        "Sign up with the same email this message was sent to and choose your password.",
        "Your account activates instantly and is linked to your coach automatically — no extra step.",
      ];
  const list = steps
    .map((s) => `<li style="margin:0 0 10px;padding:0;color:#424245;line-height:1.9;">${esc(s)}</li>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${dir}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,'Segoe UI',Tahoma,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;" dir="${dir}">
    <div style="background:#1d1d1f;border-radius:18px 18px 0 0;padding:28px 24px;text-align:center;">
      <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.3px;">Alkemos</div>
      <div style="color:#a1a1a6;font-size:14px;margin-top:6px;">${isAr ? "دعوة تدريب" : "Coaching invitation"}</div>
    </div>
    <div style="background:#ffffff;padding:32px 28px;text-align:${align};">
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1d1d1f;">${isAr ? "أهلًا بك،" : "Hi there,"}</p>
      <p style="margin:0 0 24px;color:#6e6e73;line-height:1.9;">${greeting}</p>
      <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1d1d1f;">${isAr ? "لتفعيل حسابك (دقيقة واحدة):" : "To activate your account (one minute):"}</p>
      <ul style="margin:0;padding:0 20px 0 0;list-style:decimal;" dir="${dir}">${list}</ul>
      <div style="text-align:center;margin:32px 0 8px;">
        <a href="${SITE_URL}/auth?mode=signup"
          style="display:inline-block;background:#0071e3;color:#ffffff;text-decoration:none;
          padding:14px 36px;border-radius:999px;font-weight:600;font-size:15px;">
          ${isAr ? "أنشئ حسابك الآن" : "Create your account now"}
        </a>
      </div>
    </div>
    <div style="background:#1d1d1f;border-radius:0 0 18px 18px;padding:20px 24px;text-align:center;">
      <p style="margin:0;color:#8e8e93;font-size:12px;line-height:1.8;">
        ${isAr
          ? "وصلتك هذه الرسالة لأن مدربك أرسل لك دعوة تدريب على Alkemos."
          : "You received this email because your coach sent you a coaching invitation on Alkemos."}<br />
        © ${new Date().getFullYear()} Alkemos — ${isAr ? "كل الحقوق محفوظة" : "All rights reserved"}
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const auth = await requireCoach(request);
  if (auth instanceof Response) return auth;

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const ip = clientIp(request);
  const ipLimit = await rateLimit(`invite-resend:ip:${ip}`, IP_MAX, IP_WINDOW);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "محاولات كثيرة — انتظر دقيقة ثم حاول مرة أخرى" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const parsed = coachInviteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_email", message: "اكتب بريدًا إلكترونيًا صحيحًا" },
      { status: 400 },
    );
  }
  const email = parsed.data.email;

  const emailLimit = await rateLimit(`invite-resend:email:${email}`, EMAIL_MAX, EMAIL_WINDOW);
  if (!emailLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "تم إرسال عدة رسائل لهذا البريد مؤخرًا — حاول بعد ساعة" },
      { status: 429 },
    );
  }

  // The invite flow guarantees a profiles row (trigger + the invite
  // route's own safety net) — its id IS the auth user id.
  // W1-2a (S-04, Phase 330): EXACT match — the old `.ilike` treated the
  // input as a PATTERN (`a%@x.com` matched `ahmed@x.com`), surfacing
  // other people's pending invites as this email's. Emails are stored
  // lowercase (zod emailSchema lowercases).
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!profile?.id || profile.role !== "client") {
    return NextResponse.json(
      { error: "not_found", message: "لا توجد دعوة معلقة لهذا البريد" },
      { status: 404 },
    );
  }

  // PENDING-INVITE GATE (the 0092/H1 law): invited_at set + never signed
  // in. Anything else (activated invitee, self-registered client, staff)
  // is refused — the coach is told the truth instead of spamming mail.
  const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  const gtu = userData?.user;
  if (userErr || !gtu || !isAdoptableInvitedUser(gtu)) {
    return NextResponse.json(
      {
        error: "not_pending",
        message: "هذا العميل فعّل حسابه بالفعل — لا حاجة لإعادة الإرسال",
      },
      { status: 409 },
    );
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("[api/coach/clients/invite/resend] BREVO_API_KEY is not configured");
    return NextResponse.json(
      { error: "email_not_configured", message: "خدمة البريد غير مهيأة — أبلغ الدعم" },
      { status: 500 },
    );
  }

  const isAr = true; // bilingual card — Arabic first (the coach's client base)
  const coachName = (auth.full_name ?? "").trim();
  const fromRaw = process.env.EMAIL_FROM ?? "Alkemos <no-reply@alkemos.com>";
  const fromMatch = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(fromRaw);
  const fromEmail = fromMatch?.[2] ?? fromRaw;
  const fromName = fromMatch?.[1] || "Alkemos";

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email }],
      subject: isAr
        ? `دعوتك على Alkemos — أكمل تفعيل حسابك`
        : `Your Alkemos invitation — activate your account`,
      htmlContent: buildEmailHtml(coachName, isAr),
      textContent: isAr
        ? [
            coachName ? `دعاك ${coachName} ليكون مدربك على Alkemos.` : "مدربك دعاك إلى Alkemos.",
            "لتفعيل حسابك: افتح " + SITE_URL + "/auth?mode=signup وسجّل بنفس هذا البريد واختر كلمة مرورك — حسابك يتفعل فورًا ويُربط بمدربك تلقائيًا.",
          ].join("\n\n")
        : [
            coachName ? `${coachName} invited you to be his client on Alkemos.` : "Your coach invited you to Alkemos.",
            "To activate: open " + SITE_URL + "/auth?mode=signup, sign up with this same email, and choose your password — your account activates instantly and links to your coach automatically.",
          ].join("\n\n"),
    }),
  });

  if (!brevoRes.ok) {
    const errBody = await brevoRes.text();
    console.error(`[api/coach/clients/invite/resend] Brevo API ${brevoRes.status}: ${errBody.slice(0, 300)}`);
    return NextResponse.json(
      { error: "send_failed", message: "تعذر إرسال البريد — حاول مرة أخرى بعد قليل" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, action: "reinvited", email });
}
