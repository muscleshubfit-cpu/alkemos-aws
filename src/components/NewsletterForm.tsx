"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { localizeLeadError } from "@/lib/error-i18n";
import {
  validateEmailStrict,
  emailErrorMessage,
} from "@/lib/email-validation";
import { trackGa4Event } from "@/lib/analytics";

/**
 * NewsletterForm — Phase 72 (owner request)
 *
 * Daily/weekly newsletter subscription form. Lives on the homepage
 * (variant="home") — the SINGLE newsletter surface since 2026-09-03, when
 * the duplicate footer card was removed per owner («النشرة البريدية
 * المجانية مكررة في الصفحة الرئيسية»). The compact variant="footer"
 * styles are kept for potential reuse.
 *
 * On submit the subscriber is saved in the `tool_leads` table with
 * tool_slug="newsletter" and type="newsletter" (via POST /api/tools/lead).
 * No email is sent on subscription — just a confirmation message.
 */
export function NewsletterForm({ variant = "footer" }: { variant?: "footer" | "home" }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);

    // Phase 73: strict client-side filtering — nothing is sent before the
    // email passes the format/characters rules.
    const emailCheck = validateEmailStrict(email);
    if (!emailCheck.ok) {
      setError(emailErrorMessage(emailCheck.issue, isAr));
      return;
    }

    const cleanEmail = emailCheck.email;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tools/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_slug: "newsletter",
          email: cleanEmail,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || (isAr ? "حدث خطأ" : "Something went wrong"));
        return;
      }
      setDone(true);
      // ORGANIC-GROWTH-P0-G (08-§4): lead_capture — ONLY after the server
      // confirmed the subscription row (res.ok). tool="newsletter" + lang
      // only — the email NEVER enters the analytics payload (zero PII).
      trackGa4Event("lead_capture", { tool: "newsletter", lang });
    } catch (e) {
      setError(e instanceof Error ? e.message : (isAr ? "حدث خطأ" : "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses =
    variant === "home"
      ? "w-full rounded-full border bg-[var(--bg)] px-5 py-3 text-base font-normal outline-none focus:border-[var(--chrome-edge)]"
      : "w-full rounded-xl border bg-[var(--bg)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]";

  // ---- Success state ----
  if (done) {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-[#34c759]/30 bg-[#34c759]/5 ${
          variant === "home" ? "p-5" : "p-4"
        }`}
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#34c759]" />
        <div>
          <p className={`font-medium text-[var(--text)] ${variant === "home" ? "text-base" : "text-sm"}`}>
            {isAr ? "تم الاشتراك بنجاح!" : "You're subscribed!"}
          </p>
          <p className="mt-0.5 text-xs font-normal text-[var(--muted-foreground)]">
            {isAr
              ? "ستصلك أحدث النصائح والعروض أولًا بأول — مجانًا."
              : "You'll receive our latest tips and offers — free."}
          </p>
        </div>
      </div>
    );
  }

  // ---- Form ----
  return (
    <div>
      {variant === "home" ? (
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--tint)]">
            <Mail className="h-6 w-6 text-[var(--text)]" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">
            {/* Phase 117 H2 correction (supervisor order 2026-09-04): the
                home-variant H2 follows the owner's new headline list —
                «اشترك في نشرتنا البريدية» (was question-form, read
                boring); the compact footer variant below is a <p> and
                stays a label. */}
            {isAr ? "اشترك في نشرتنا البريدية" : "Subscribe to Our Newsletter"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-base font-normal text-[var(--muted-foreground)]">
            {isAr
              ? "نصائح تدريب وتغذية يومية توصلك على بريدك، مجانًا تمامًا."
              : "Daily training and nutrition tips straight to your inbox — completely free."}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">
            {isAr ? "النشرة البريدية المجانية" : "Free newsletter"}
          </p>
          <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">
            {isAr
              ? "نصائح تدريب وتغذية توصلك أولًا بأول."
              : "Training & nutrition tips, straight to you."}
          </p>
        </div>
      )}

      <div className={variant === "home" ? "mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row" : "mt-3"}>
        {/* Phase 198 Batch 3 (audit M7): the long placeholder (with the
            example address) truncated inside the sm row layout — the
            short form fits every breakpoint; validation errors still
            carry the full guidance. */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
          // P3-10/م26 (deep-audit Phase 217): placeholder-only labeling
          // disappears while typing — the field needs a persistent
          // accessible name.
          aria-label={isAr ? "بريدك الإلكتروني" : "Your email address"}
          dir="ltr"
          maxLength={254}
          inputMode="email"
          className={inputClasses}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className={`btn-chrome flex shrink-0 items-center justify-center gap-2 font-normal disabled:opacity-50 ${
            variant === "home"
              ? "rounded-full px-6 py-3 text-sm"
              : "mt-2 w-full rounded-xl px-4 py-3 text-sm sm:mt-0"
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isAr ? "جارٍ الاشتراك..." : "Subscribing..."}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {isAr ? "اشترك مجانًا" : "Subscribe free"}
            </>
          )}
        </button>
      </div>

      {error && (
        <p role="alert" className={`mt-2 text-sm font-normal text-[#ff3b30] ${variant === "home" ? "text-center" : ""}`}>
          {error}
        </p>
      )}

      <p className={`mt-2 text-xs font-normal text-[#8e8e93] ${variant === "home" ? "text-center" : ""}`}>
        {isAr ? "لا رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت." : "No spam. Unsubscribe anytime."}
      </p>
    </div>
  );
}
