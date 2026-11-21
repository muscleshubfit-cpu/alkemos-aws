"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/LanguageToggle";
import { GoogleIcon } from "@/components/GoogleIcon";
import { useNav } from "@/hooks/use-nav";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { passwordBreachCount } from "@/lib/password-breach";
import { safeNext } from "@/lib/safe-redirect";
import { setCoachSlugCookie, clearCoachSlugCookie, getCoachSlugCookie } from "@/lib/coach-cookie";
import { localizeAuthError } from "@/lib/error-i18n";
import { trackGa4Event } from "@/lib/analytics";
import { passwordStrength, strengthLabel } from "@/lib/password-strength";
import { toast } from "sonner";

const SLUG_RE = /^[a-z0-9-]{3,40}$/;

export function AuthView({ mode, next, coach }: { mode: "login" | "signup"; next?: string; coach?: string }) {
  const { t, lang } = useI18n();
  const { navigate } = useNav();
  const router = useRouter();
  const { signIn, signUp, signInGoogle, profile } = useAuth();
  const isSignup = mode === "signup";
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // m-E FIX (UX-TEST-VERIFICATION-ROUND2-2026-09-21 §5 — duplicate login
  // error toast): `loading` disables the button only AFTER React re-renders,
  // so a fast double-click (or a second Enter) ran the submit handler twice
  // → two identical auth calls → two identical error toasts stacked. This
  // ref is the SYNCHRONOUS lock the state can never be.
  const submitBusyRef = useRef(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  // M2 FIX (DEEP-UX-AUDIT-2026-09-18, owner decision — no email
  // confirmation): signup with an ALREADY-REGISTERED email now shows an
  // honest «account exists — sign in» screen instead of the misleading
  // «check your email» dead-end (no email is ever sent).
  const [accountExists, setAccountExists] = useState(false);
  // I-2 (UX-TEST-REPORT-2026-09-21 §5-2 — owner «ابدأ التحسينات»
  // 2026-09-22): the forgot-password flow. `forgot` swaps the form for a
  // request screen; `forgotSent` is the honest «link sent» state. The
  // actual password set happens on /auth/reset (the recovery link lands
  // there via /auth/callback?next=/auth/reset — same PKCE cookie
  // exchange as OAuth; detectSessionInUrl=false stays untouched).
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // COACH ATTRIBUTION (0033): the signup CTA on a coach's landing page
  // links here as /auth?mode=signup&coach={slug}. Persist the slug in a
  // 30-day cookie so it survives BOTH signup paths — email metadata
  // (primary) and the Google OAuth round-trip (claimed later by the
  // CoachSlugClaimer via /api/coach/claim).
  const coachSlug = coach && SLUG_RE.test(coach) ? coach : getCoachSlugCookie();
  useEffect(() => {
    if (coach && SLUG_RE.test(coach)) setCoachSlugCookie(coach);
  }, [coach]);

  // After a successful login, redirect to `next` if provided (e.g. /checkout),
  // otherwise fall back to the role's console. Phase 51: admin gets his
  // /admin console here too (was landing on the coach's clients list).
  const goAfterLogin = (isCoach: boolean) => {
    if (next) {
      // Validate `next` to prevent open-redirect attacks (C17 fix).
      // Use a hard navigation so query params (?tier=...&months=...) are preserved.
      window.location.href = safeNext(next);
      return;
    }
    if (profile?.role === "admin") {
      router.push("/admin");
      return;
    }
    navigate(isCoach ? "coach" : "dashboard");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitBusyRef.current) return; // m-E: drop the duplicate submission
    submitBusyRef.current = true;
    setLoading(true);
    try {
      if (isSignup) {
        // Phase 134: mirror the server's password_min_length=8 client-side
        // (LOGIN keeps no minLength so legacy 6-7 char passwords still work).
        if (password.length < 8) {
          toast.error(
            isAr
              ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
              : "Password must be at least 8 characters",
          );
          return;
        }
        // Phase 134: block known-breached passwords (HIBP k-anonymity —
        // only the first 5 SHA-1 chars leave the device; fail-open so
        // signup availability never depends on a third-party API).
        const breaches = await passwordBreachCount(password);
        if (breaches > 0) {
          toast.error(
            isAr
              ? "كلمة المرور هذه ظهرت في تسريبات بيانات معروفة — اختر كلمة مرور أخرى"
              : "This password appeared in known data breaches — choose a different one",
          );
          return;
        }
        const { error, needsConfirmation: needsConf, duplicateEmail: dupEmail } = await signUp(
          email,
          password,
          fullName,
          phone,
          coachSlug,
        );
        // ORGANIC-GROWTH-P0-G (08-§4): signup_complete — ONLY when the
        // account was REALLY created: !error && !dupEmail (the duplicate
        // arm is GoTrue's fake-user answer — no account exists). Covers
        // BOTH the instant-session and needsConfirmation outcomes (the
        // auth row exists in both). method + lang + the confirmation
        // flag only — zero PII (no email/name/phone).
        if (!error && !dupEmail) {
          trackGa4Event("signup_complete", {
            method: "email",
            lang,
            ...(needsConf ? { email_confirmation_required: true } : {}),
          });
        }
        if (error) {
          // M1 fix: GoTrue's raw English strings were shown verbatim
          // inside the Arabic UI — localize at the display layer.
          // m-E fix: a stable id — sonner REPLACES a same-id toast instead
          // of stacking a second identical one.
          toast.error(localizeAuthError(error, isAr), { id: "auth-error" });
        } else if (dupEmail) {
          // M2 fix (owner decision 2026-09-18 — m9: signup stays instant,
          // no email confirmation): GoTrue's duplicate-email answer
          // (empty identities, no session). The email already has an
          // account — route to the honest «account exists — sign in»
          // screen, NOT the «check your email» dead-end.
          setAccountExists(true);
        } else if (needsConf) {
          // M6 fix: email confirmation required — don't redirect to dashboard.
          // Show a "check your email" screen instead.
          // Attribution already happened at insert time (metadata → 0033
          // trigger) — the cookie's job is done.
          clearCoachSlugCookie();
          setNeedsConfirmation(true);
        } else {
          toast.success(t("auth.accountCreated"), { id: "auth-ok" });
          goAfterLogin(false);
        }
      } else {
        const { error, profile } = await signIn(email, password);
        if (error) {
          // M1 fix (audit case ب): "Invalid login credentials" used to
          // surface raw-English inside the Arabic UI at the login moment.
          // m-E fix: stable id — no more duplicate stacked toasts.
          toast.error(localizeAuthError(error, isAr), { id: "auth-error" });
        } else {
          toast.success(t("auth.welcomeBack"), { id: "auth-ok" });
          goAfterLogin(profile?.role !== "client");
        }
      }
    } finally {
      submitBusyRef.current = false;
      setLoading(false);
    }
  };

  // I-2: request a recovery link (client-side GoTrue — the SAME dynamic
  // import pattern the lazy auth law mandates; /auth is a gated prefix).
  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitBusyRef.current) return;
    submitBusyRef.current = true;
    setForgotLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase/client");
      if (!supabase || !isSupabaseConfigured) {
        toast.error(isAr ? "خدمة البريد غير مهيأة حاليًا" : "Email service is not configured", { id: "auth-error" });
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
      });
      if (error) {
        toast.error(localizeAuthError(error.message, isAr), { id: "auth-error" });
        return;
      }
      // Honest uniform success: GoTrue never reveals whether the email
      // exists (anti-enumeration) — the «link sent» state is shown for
      // any valid request, exactly like the standard flow.
      setForgotSent(true);
    } finally {
      submitBusyRef.current = false;
      setForgotLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (submitBusyRef.current) return; // m-E: same lock for the Google button
    submitBusyRef.current = true;
    setGoogleLoading(true);
    try {
      const { error } = await signInGoogle(next);
      if (error) {
        toast.error(t("auth.googleError"), { id: "auth-error" });
        setGoogleLoading(false);
      }
    } catch {
      setGoogleLoading(false);
      toast.error(t("auth.googleError"), { id: "auth-error" });
    } finally {
      submitBusyRef.current = false;
    }
  };

  // M6 fix: show "check your email" screen when email confirmation is required
  if (needsConfirmation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 text-center text-[var(--text)]">
        <div className="mx-auto max-w-md">
          <div className="mb-6 grid h-16 w-16 mx-auto place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)]">
            <svg className="h-8 w-8 text-[var(--muted-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isAr ? "تحقق من بريدك الإلكتروني" : "Check your email"}
          </h1>
          <p className="mt-3 text-sm font-normal text-[var(--muted-foreground)]">
            {isAr
              ? `أرسلنا رابط تأكيد إلى ${email}. اضغط على الرابط لتفعيل حسابك ثم سجّل الدخول.`
              : `We sent a confirmation link to ${email}. Click the link to activate your account, then sign in.`}
          </p>
          <button
            onClick={() => {
              setNeedsConfirmation(false);
              navigate("auth", { mode: "login" });
            }}
            className="btn-chrome mt-6 px-6 py-2.5 text-sm"
          >
            {isAr ? "العودة لتسجيل الدخول" : "Back to login"}
          </button>
        </div>
      </div>
    );
  }

  // I-2: the «link sent» state — honest about what happens next (and
  // that the message may sit in spam), mirroring the M6 screen's shape.
  if (forgotSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 text-center text-[var(--text)]">
        <div className="mx-auto max-w-md">
          <div className="mb-6 grid h-16 w-16 mx-auto place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)]">
            <svg className="h-8 w-8 text-[var(--muted-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isAr ? "أرسلنا رابط الاستعادة" : "Recovery link sent"}
          </h1>
          <p className="mt-3 text-sm font-normal text-[var(--muted-foreground)]">
            {isAr
              ? `أرسلنا رابط تعيين كلمة مرور جديدة إلى ${email} — افحص بريدك (وبدل الرسائل غير المرغوبة) واضغط الرابط خلال ساعة. إن وجدت بريدًا فيه رمز من 6 أرقام فيمكنك إدخاله مباشرة بدل الرابط.`
              : `We sent a password-reset link to ${email} — check your inbox (and spam folder) and open the link within the hour. If your email shows a six-digit code, you can enter it directly instead of the link.`}
          </p>
          {/* RECOVERY-OTP MODE (owner order «نفذ خيار otp» 2026-09-22): the
              code path works from ANY browser/device — the honest rescue
              when the link path fails (verifier cookie, one-time code). */}
          {/* CTA-CRAWLABILITY (2026-11-19): pure navigation to the OTP
              reset screen → a real <Link> with the exact querystring the
              router.push() built (dynamic email param, href computed at
              render — identical destination). */}
          <Link
            href={`/auth/reset?mode=code&email=${encodeURIComponent(email.trim())}`}
            className="mt-4 text-sm font-normal text-[var(--muted-2)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
          >
            {isAr ? "لديك رمز في البريد؟ أدخله هنا" : "Have a code in your email? Enter it here"}
          </Link>
          <button
            onClick={() => {
              setForgotSent(false);
              setForgot(false);
              navigate("auth", { mode: "login" });
            }}
            className="btn-chrome mt-6 px-6 py-2.5 text-sm"
          >
            {isAr ? "العودة لتسجيل الدخول" : "Back to login"}
          </button>
        </div>
      </div>
    );
  }

  // I-2: the recovery-request screen (replaces the login form in-place —
  // same mount, so the typed email is preserved).
  if (forgot) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
        <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          {/* CTA-CRAWLABILITY (2026-11-19): the recovery-screen logo is pure
              navigation → a real language-aware <Link>. isAr here is
              cookie-resolved at SSR (the (app) group reads mhe:lang
              server-side) — the href matches what navigate("landing")
              mirrored to for every visitor, choice-holders included. */}
          <Link className="text-lg font-semibold tracking-tight" href={isAr ? "/ar" : "/"}>
            Alkemos
          </Link>
          <LanguageToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-md px-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {isAr ? "استعادة كلمة المرور" : "Reset your password"}
            </h1>
            <p className="mt-2 text-base font-normal text-[var(--muted-foreground)]">
              {isAr
                ? "اكتب بريدك المسجل وسنرسل لك رابط تعيين كلمة مرور جديدة."
                : "Enter your account email and we'll send you a password-reset link."}
            </p>
            <form onSubmit={submitForgot} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-sm font-medium">
                  {t("auth.email")}
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="btn-chrome w-full px-6 py-3 text-base disabled:opacity-50"
              >
                {forgotLoading
                  ? t("common.loading")
                  : isAr ? "أرسل رابط الاستعادة" : "Send the recovery link"}
              </button>
            </form>
            <p className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setForgot(false)}
                className="text-sm font-normal text-[var(--muted-2)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
              >
                {isAr ? "← رجوع لتسجيل الدخول" : "← Back to login"}
              </button>
            </p>
          </div>
        </main>
        <footer className="mt-auto border-t border-[var(--edge)] py-6 text-center text-xs font-normal text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Alkemos. {isAr ? "كل الحقوق محفوظة." : "All rights reserved."}
        </footer>
      </div>
    );
  }

  // M2 fix (owner decision 2026-09-18 — m9 resolved: NO email confirmation,
  // registration stays instant): signup with an already-registered email.
  // The honest answer is «this account exists — sign in»: no email was
  // sent, nothing to wait for (the old flow showed «check your email»
  // for an email that would never arrive — the audit's M2 dead-end).
  if (accountExists) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 text-center text-[var(--text)]">
        <div className="mx-auto max-w-md">
          <div className="mb-6 grid h-16 w-16 mx-auto place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)]">
            <svg className="h-8 w-8 text-[var(--muted-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isAr ? "هذا البريد مسجل بالفعل" : "Account already exists"}
          </h1>
          <p className="mt-3 text-sm font-normal text-[var(--muted-foreground)]">
            {isAr
              ? `البريد ${email} لديه حساب على Alkemos — التسجيل لدينا فوري وبلا تأكيد بريد، فلا توجد رسالة بانتظارك. سجّل دخولك بكلمة مرورك للوصول إلى حسابك مباشرة.`
              : `The email ${email} already has an Alkemos account — signup here is instant with no email confirmation, so there is no message to wait for. Sign in with your password to get straight back in.`}
          </p>
          <button
            onClick={() => {
              setAccountExists(false);
              navigate("auth", { mode: "login" });
            }}
            className="btn-chrome mt-6 px-6 py-2.5 text-sm"
          >
            {isAr ? "الانتقال لتسجيل الدخول" : "Go to login"}
          </button>
          {/* I-2 (UX-TEST-REPORT-2026-09-21 §5-2): the honest secondary
              exit — this screen is exactly where a «forgot password»
              moment happens; the recovery link shortens the way back in. */}
          <p className="mt-4">
            <button
              onClick={() => {
                setAccountExists(false);
                setForgot(true);
              }}
              className="text-sm font-normal text-[var(--muted-2)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
            >
              {isAr ? "نسيت كلمة المرور؟ استعيدها من بريدك" : "Forgot your password? Recover it via email"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        {/* CTA-CRAWLABILITY (2026-11-19): main-screen logo → real
            language-aware <Link> (cookie-resolved isAr at SSR). */}
        <Link className="text-lg font-semibold tracking-tight" href={isAr ? "/ar" : "/"}>
          Alkemos
        </Link>
        <LanguageToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Apple-style clean card — no border, no shadow, just whitespace */}
          <div className="px-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {isSignup ? t("auth.signup.title") : t("auth.login.title")}
            </h1>
            <p className="mt-2 text-base font-normal text-[var(--muted-foreground)] md:text-lg">
              {isSignup ? t("auth.signup.subtitle") : t("auth.login.subtitle")}
            </p>

            {/* Banner: explain why login is needed */}
            {next && (
              <div className="marble-card mt-6 p-4 text-sm text-[var(--text)]">
                <p className="font-medium">
                  {isAr
                    ? "سجّل الدخول لإكمال عملية الاشتراك"
                    : "Log in to continue your subscription"}
                </p>
                <p className="mt-1 text-[var(--muted-foreground)]">
                  {isAr
                    ? "ستعود تلقائيًا إلى صفحة الدفع بعد تسجيل الدخول."
                    : "You'll be returned to checkout automatically after logging in."}
                </p>
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="marble-card mt-6 p-4 text-sm font-normal text-[var(--muted-foreground)]">
                {t("auth.demoNotice")}
              </div>
            )}

            {/* Google OAuth button — Apple-style */}
            {isSupabaseConfigured && (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading || loading}
                  className="btn-outline mt-8 flex w-full items-center justify-center gap-3 px-6 py-3 text-base disabled:opacity-50"
                >
                  {googleLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
                  ) : (
                    <GoogleIcon className="h-5 w-5" />
                  )}
                  <span>{t("auth.google")}</span>
                </button>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-[#d2d2d7]" />
                  <span className="text-xs font-normal uppercase tracking-wide text-[var(--muted-foreground)]">
                    {t("auth.or")}
                  </span>
                  <div className="h-px flex-1 bg-[#d2d2d7]" />
                </div>
              </>
            )}

            <form onSubmit={submit} className="space-y-5">
              {isSignup && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-sm font-medium">
                      {t("auth.fullName")}
                    </Label>
                    <Input
                      id="fullname"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Mohamed Ali"
                      className="rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    {/* ORGANIC-GROWTH-D-C (owner decision 2026-11-21 — phone
                        NOT mandatory at registration): the `required` attr is
                        GONE from this input (the only enforcement point of
                        the old mandate — coach register and invite-adopt were
                        already optional, profiles.phone is nullable, and the
                        0001 trigger reads raw_user_meta_data->>'phone' which
                        is NULL when absent). Label marks it optional in both
                        languages via i18n "auth.phone". */}
                    <Label htmlFor="phone" className="text-sm font-medium">
                      {t("auth.phone")}
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("auth.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={isSignup ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border-[var(--edge)] bg-[var(--card)] px-4 py-3 text-base"
                  aria-describedby={isSignup ? "password-strength" : undefined}
                />
                {/* m8 fix (DEEP-UX-AUDIT-2026-09-18): live guidance under the
                    SIGNUP password field — the form used to accept weak
                    passwords silently (native minLength=8 only, no feedback
                    until submit). DISPLAY-ONLY: the enforced gates stay
                    minlength=8 + the Phase-134 HIBP breach check; the meter
                    never rejects anything, it just shows the state. */}
                {isSignup && (
                  <div id="password-strength" aria-live="polite" className="space-y-1.5">
                    {(() => {
                      const level = passwordStrength(password);
                      const bars = level === 0 ? 0 : level;
                      const color = level === 0 ? "var(--muted-2)" : level === 1 ? "#ff3b30" : level === 2 ? "#ff9500" : "#34c759";
                      return (
                        <>
                          <div className="flex items-center gap-2" dir="ltr">
                            <div className="flex h-1 flex-1 gap-1">
                              {[1, 2, 3].map((seg) => (
                                <span
                                  key={seg}
                                  className="h-full flex-1 rounded-full transition-colors"
                                  style={{ backgroundColor: seg <= bars ? color : "var(--edge)" }}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-normal" style={{ color: level === 0 ? "var(--muted-2)" : color }}>
                              {strengthLabel(level, isAr)}
                            </span>
                          </div>
                          <p className="text-xs font-normal text-[var(--muted-2)]">
                            {isAr
                              ? "٨ أحرف على الأقل — والأفضل مزج أحرف كبيرة وصغيرة وأرقام."
                              : "At least 8 characters — mixing upper & lower case letters and numbers is better."}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="btn-chrome w-full px-6 py-3 text-base disabled:opacity-50"
              >
                {loading ? t("common.loading") : isSignup ? t("auth.signUp") : t("auth.signIn")}
              </button>
            </form>

            {/* I-2 (UX-TEST-REPORT-2026-09-21 §5-2): the login form's
                recovery entry — «shortening account recovery» per the
                report. Signup keeps none (no password set yet). */}
            {!isSignup && (
              <p className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setForgot(true)}
                  className="text-sm font-normal text-[var(--muted-2)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
                >
                  {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                </button>
              </p>
            )}

            <p className="mt-8 text-center text-sm font-normal text-[var(--muted-foreground)]">
              {isSignup ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
              {/* CTA-CRAWLABILITY (2026-11-19): the login↔signup toggle is a
                  pure same-route navigation (URL query change — the view
                  switches through the mode prop) → a real <Link> to the
                  exact querystring navigate() built. */}
              <Link
                href={isSignup ? "/auth?mode=login" : "/auth?mode=signup"}
                className="font-normal text-[var(--muted-2)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
              >
                {isSignup ? t("auth.toLogin") : t("auth.toSignup")}
              </Link>
            </p>

            {/* Continue as guest — login is optional, not a wall */}
            <div className="mt-8 border-t border-[var(--edge)] pt-6">
              <p className="text-center text-sm font-normal text-[var(--muted-foreground)]">
                {isAr
                  ? "جرّب الأدوات والمدونة مجانًا فورًا — لا تحتاج إلى بطاقة ائتمانية. وحسابك المجاني يحفظ خططك ونتائجك ويزامنها عبر أجهزتك."
                  : "Try the tools and blog free, instantly — no credit card required. A free account saves your plans and results and syncs them across your devices."}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/tools"
                  className="rounded-full border border-[var(--edge)] bg-[var(--tint)] px-5 py-2 text-sm font-normal text-[var(--text)] transition-opacity hover:opacity-90"
                >
                  {isAr ? "الأدوات المجانية" : "Free Tools"}
                </a>
                <a
                  href="/blog"
                  className="rounded-full border border-[var(--edge)] bg-[var(--tint)] px-5 py-2 text-sm font-normal text-[var(--text)] transition-opacity hover:opacity-90"
                >
                  {isAr ? "المدونة" : "Blog"}
                </a>
                <Link
                  href={isAr ? "/ar" : "/"}
                  className="rounded-full border border-[var(--edge)] bg-[var(--tint)] px-5 py-2 text-sm font-normal text-[var(--text)] transition-opacity hover:opacity-90"
                >
                  {isAr ? "العودة للرئيسية" : "Back to home"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-[var(--edge)] py-6 text-center text-xs font-normal text-[var(--muted-foreground)]">
        © {new Date().getFullYear()} Alkemos. {isAr ? "كل الحقوق محفوظة." : "All rights reserved."}
      </footer>
    </div>
  );
}
