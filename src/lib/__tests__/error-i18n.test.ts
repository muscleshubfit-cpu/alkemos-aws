import { describe, it, expect } from "vitest";
import {
 localizeApiError,
 localizeAuthError,
 localizeCoachInviteError,
 localizeSendEmailError,
 localizeLeadError,
} from "../error-i18n";

/**
 * M1 canaries (DEEP-UX-AUDIT-2026-09-18) — the error-i18n display-layer
 * contract: known codes/messages localize to the UI language; unknown ones
 * fall through VERBATIM (honest fallback, never masked); the Arabic side
 * keeps the server's canonical Arabic message as the single source.
 */

describe("localizeApiError — /api/coach/subscriptions/activate errors", () => {
  const arabicWallet =
    "رصيد محفظتك (0$) لا يكفي لتفعيل 1 شهر — المطلوب 6$. اشحن محفظتك أولًا (PayPal / انستاباي / فودافون كاش) وسيتم التفعيل فورًا.";

  it("AR UI keeps the server's canonical Arabic message verbatim", () => {
    const json = { error: "insufficient_wallet", message: arabicWallet, balance: 0, cost: 6 };
    expect(localizeApiError(json, { isAr: true, months: 1 })).toBe(arabicWallet);
  });

  it("EN UI maps insufficient_wallet (full variant) with the numeric payload", () => {
    const json = { error: "insufficient_wallet", message: arabicWallet, balance: 0, cost: 6 };
    const out = localizeApiError(json, { isAr: false, months: 1 });
    expect(out).toContain("$6");
    expect(out).toContain("$0");
    expect(out).toContain("1 month");
    expect(out).not.toMatch(/[\u0600-\u06FF]/); // zero Arabic glyphs in EN UI
  });

  it("EN UI pluralizes months and uses 'months' for durations > 1", () => {
    const json = { error: "insufficient_wallet", message: arabicWallet, balance: 2, cost: 16 };
    const out = localizeApiError(json, { isAr: false, months: 3 });
    expect(out).toContain("3 months");
    expect(out).toContain("$16");
    expect(out).toContain("$2");
  });

  it("EN UI handles the debit-failure variant (no numeric payload)", () => {
    const json = { error: "insufficient_wallet", message: "رصيد محفظتك لا يكفي" };
    const out = localizeApiError(json, { isAr: false });
    expect(out).toBe(
      "Your wallet balance is not enough — top up your wallet first (InstaPay / Vodafone Cash / PayPal).",
    );
  });

  it("EN UI maps the coach-tier boundary error", () => {
    const json = { error: "coach_tier_forbidden", message: "المدرب يفعّل باقة الكوتشينج فقط" };
    expect(localizeApiError(json, { isAr: false })).not.toMatch(/[\u0600-\u06FF]/);
  });

  it("unknown error code falls back to the server message verbatim (EN too — honest)", () => {
    const json = { error: "some_future_code", message: "رسالة مستقبلية" };
    expect(localizeApiError(json, { isAr: false })).toBe("رسالة مستقبلية");
    expect(localizeApiError(json, { isAr: true })).toBe("رسالة مستقبلية");
  });

  it("null/undefined json yields an empty string (caller keeps its own fallback)", () => {
    expect(localizeApiError(null, { isAr: false })).toBe("");
    expect(localizeApiError(undefined, { isAr: true })).toBe("");
  });
});

describe("localizeAuthError — Supabase GoTrue raw strings", () => {
  it("EN UI passes GoTrue's English message through unchanged", () => {
    expect(localizeAuthError("Invalid login credentials", false)).toBe("Invalid login credentials");
  });

  it("AR UI maps the wrong-password message (audit case ب)", () => {
    expect(localizeAuthError("Invalid login credentials", true)).toBe(
      "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    );
  });

  it("AR UI maps rate-limit and network errors", () => {
    expect(localizeAuthError("Too many requests. Please try again later.", true)).not.toBe(
      "Too many requests. Please try again later.",
    );
    expect(localizeAuthError("Network request failed", true)).not.toBe("Network request failed");
  });

  it("unknown auth messages fall through verbatim in both languages (honest)", () => {
    const unknown = "Signups not allowed for this instance";
    expect(localizeAuthError(unknown, true)).toBe(unknown);
    expect(localizeAuthError(unknown, false)).toBe(unknown);
  });

  it("RECOVERY-OTP: wrong/expired code localizes in AR and passes through in EN", () => {
    const ar = localizeAuthError("Email OTP has expired or is invalid", true);
    expect(ar).toContain("رمز الاستعادة");
    expect(ar).not.toBe("Email OTP has expired or is invalid");
    expect(localizeAuthError("Email OTP has expired or is invalid", false)).toBe(
      "Email OTP has expired or is invalid",
    );
  });

  it("RECOVERY-OTP: gotrue's LIVE verifyOtp failure string (browser-proven 2026-09-22) localizes in AR", () => {
    // Captured live: submitting a wrong 6-digit code returns exactly
    // «Token has expired or is invalid» — not the docs-era "Email OTP…" string.
    const ar = localizeAuthError("Token has expired or is invalid", true);
    expect(ar).toContain("رمز الاستعادة");
    expect(ar).not.toBe("Token has expired or is invalid");
    expect(localizeAuthError("Token has expired or is invalid", false)).toBe(
      "Token has expired or is invalid",
    );
  });

  it("RECOVERY-OTP: consumed/expired link localizes with the code-entry alternative", () => {
    const ar = localizeAuthError(
      "Email link is invalid or has already been used",
      true,
    );
    expect(ar).toContain("رابط الاستعادة");
    expect(ar).toContain("الرمز");
    expect(localizeAuthError("Email link is invalid or has already been used", false)).toBe(
      "Email link is invalid or has already been used",
    );
  });

  it("empty/null input yields an empty string", () => {
    expect(localizeAuthError(null, true)).toBe("");
    expect(localizeAuthError("", false)).toBe("");
  });
});

/**
 * I18N-SWEEP-255 canaries — client-facing API surfaces localize from
 * stable codes at the toast site; unknown codes fall through (honest
 * fallback, never masked).
 */
describe("localizeCoachInviteError — invite/resend codes (255)", () => {
 it("known codes localize both ways", () => {
 expect(localizeCoachInviteError("invalid_email", false)).toBe("Please enter a valid email address");
 expect(localizeCoachInviteError("invalid_email", true)).toBe("اكتب بريدًا إلكترونيًا صحيحًا");
 expect(localizeCoachInviteError("already_registered_client", false)).toMatch(/only the admin/);
 expect(localizeCoachInviteError("already_registered_staff", true)).toMatch(/فريق العمل/);
 expect(localizeCoachInviteError("not_pending", false)).toMatch(/already activated/);
 });

 it("unknown/missing codes return null — caller keeps passthrough", () => {
 expect(localizeCoachInviteError("something_new", true)).toBeNull();
 expect(localizeCoachInviteError(undefined, false)).toBeNull();
 expect(localizeCoachInviteError("String must contain at most 120 characters", false)).toBeNull();
 });
});

describe("localizeSendEmailError / localizeLeadError — public tools (255)", () => {
 it("send-email codes localize; unknown passes through", () => {
 expect(localizeSendEmailError("daily_limit", true)).toMatch(/الحد اليومي/);
 expect(localizeSendEmailError("daily_limit", false)).toMatch(/Daily email limit/);
 expect(localizeSendEmailError("not_configured", true)).toMatch(/غير مهيأة/);
 expect(localizeSendEmailError("mystery", false)).toBeNull();
 });

 it("lead codes localize; unknown passes through", () => {
 expect(localizeLeadError("invalid_email", true)).toMatch(/بريد/);
 expect(localizeLeadError("save_failed", false)).toMatch(/went wrong/);
 expect(localizeLeadError("internal", true)).toMatch(/حدث خطأ/);
 expect(localizeLeadError("mystery", true)).toBeNull();
 });
});
