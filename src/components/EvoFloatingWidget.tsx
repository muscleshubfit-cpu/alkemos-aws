"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ThemeImg } from "@/components/ThemeImg";
import { useEvoChat } from "@/lib/evo-chat-context";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
// PHASE 182: supabase is fetched via dynamic import() at its call sites —
// this widget chunk loads at idle on EVERY page, so it must not drag
// @supabase/ssr (~68KB) with it for anonymous visitors.
import { buildFollowupPrefWrite } from "@/lib/evo-followup";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Send, X, ExternalLink, Loader2, Sparkles, Bookmark, Check, ThumbsUp, ThumbsDown, Mail } from "lucide-react";
import { VoiceMicButton } from "@/components/VoiceMicButton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCallback } from "react";

/**
 * EvoFloatingWidget — floating EVO chat icon + slide-in drawer.
 *
 * Appears on ALL pages (added to root layout).
 * The icon floats at the bottom corner with a pulse animation.
 * Clicking opens a side drawer (the user stays on the page).
 *
 * W1-3c (2026-10-02, remediation plan A-01): the drawer is a REAL modal
 * dialog on @radix-ui/react-dialog — role=dialog + a named Title
 * (aria-labelledby), Escape to close, focus trap + focus restore to the
 * trigger bubble, modal isolation (aria-hidden + outside pointer-events
 * off while open), and the messages area is role="log" (live region) so
 * the SSE token stream is announced to screen readers. The floating
 * bubble is the Radix trigger and stays MOUNTED while the drawer is open
 * (under the overlay) — that is what makes focus restore possible.
 *
 * Features:
 *   - EVO profile image in the floating button
 *   - Drawer with chat history + input
 *   - Typing indicator (3 animated dots)
 *   - Links in AI responses (clickable, open in same tab)
 *   - Rate limit indicator for anonymous users
 *   - Clear chat button
 *   - Doesn't navigate away from current page
 */

/**
 * MessageText — renders assistant message content with markdown-lite
 * inline link support: [label](url) becomes a real anchor. URLs are
 * restricted to site-relative or http(s) — safe by construction.
 * (Live answers arrive with a separate links[] array; this renderer
 * covers model-written markdown and any legacy persisted bodies.)
 */
function MessageText({ content }: { content: string }) {
  const MD_LINK = /\[([^\]]+)\]\(([^()\s]+)\)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_LINK.exec(content)) !== null) {
    if (m.index > last) parts.push(content.slice(last, m.index));
    const [, label, url] = m;
    const safe = /^(https?:\/\/|\/|#)/i.test(url);
    if (safe) {
      const external = /^https?:\/\//i.test(url);
      parts.push(
        external ? (
          <a
            key={m.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#0071e3] underline underline-offset-2"
          >
            {label}
          </a>
        ) : (
          <a
            key={m.index}
            href={url}
            className="font-medium text-[#0071e3] underline underline-offset-2"
          >
            {label}
          </a>
        ),
      );
    } else {
      parts.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < content.length) parts.push(content.slice(last));
  // dir="auto": each message renders by its own first strong character —
  // Arabic messages flow RTL, English LTR, so mixed AR/EN text keeps its
  // logical word order instead of scrambling between the two directions.
  return (
    <p dir="auto" className="text-sm font-normal leading-relaxed whitespace-pre-wrap">
      {parts}
    </p>
  );
}

export function EvoFloatingWidget() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const router = useRouter();
  const {
    isOpen,
    isTyping,
    messages,
    dailyCount,
    dailyLimit,
    dailyLimitReached,
    isPaidTier,
    quota,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
  } = useEvoChat();

  // EVO-3/D4 (166.2) — the weekly check-in opt-in lives INSIDE the widget
  // (owner request: «ضيف تفعيل المتابعه الاسبوعيه داخل ويدجيت ايفو نفسه
  // بالاعلى») so a PHONE-ONLY, non-technical user can enable the feature
  // and fire the real first email WITHOUT any terminal step: the
  // «إرسال الآن» trigger is ADMIN-ONLY and calls the same documented
  // dispatch endpoint with the admin session cookie (requireAdmin — the
  // documented second caller, no x-cron-secret needed). Writes reuse the
  // tested buildFollowupPrefWrite planner under 0079 RLS — the /profile
  // card stays the full control surface (language + last-sent) and both
  // reflect each other (same row, reloaded on every drawer open).
  const { profile, isAdmin } = useAuth();
  const [fuRow, setFuRow] = useState<{
    opted_in: boolean;
    language: string;
    last_sent_at: string | null;
  } | null>(null);
  const [fuLoaded, setFuLoaded] = useState(false);
  const [fuBusy, setFuBusy] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const fuOptedIn = !!fuRow?.opted_in;

  const loadFollowupRow = useCallback(() => {
    if (!profile?.id) {
      setFuRow(null);
      setFuLoaded(true);
      return;
    }
    // PHASE 182: Supabase client chunk fetched on demand.
    void import("@/lib/supabase/client").then(({ supabase }) => {
      if (!supabase) {
        setFuRow(null);
        setFuLoaded(true);
        return;
      }
      supabase
        .from("evo_followup_prefs")
        .select("opted_in, language, last_sent_at")
        .eq("client_id", profile.id)
        .maybeSingle()
        .then(({ data }) => {
          setFuRow(data ?? null);
          setFuLoaded(true);
        });
    });
  }, [profile]);

  useEffect(() => {
    // reload on every drawer open — /profile edits reflect immediately
    if (isOpen) {
      setFuLoaded(false);
      loadFollowupRow();
    }
  }, [isOpen, loadFollowupRow]);

  const applyFollowupWrite = async (
    nextOptedIn: boolean,
    language: "ar" | "en",
  ) => {
    if (!profile?.id) return;
    // PHASE 182: Supabase client chunk fetched on demand.
    const { supabase } = await import("@/lib/supabase/client");
    if (!supabase) return;
    const write = buildFollowupPrefWrite(profile.id, fuRow, {
      optedIn: nextOptedIn,
      language,
    });
    if (!write) return; // no-op — no write churn
    setFuBusy(true);
    try {
      const res =
        write.mode === "insert"
          ? await supabase.from("evo_followup_prefs").insert(write.values)
          : await supabase
              .from("evo_followup_prefs")
              .update(write.values)
              .eq("client_id", profile.id);
      if (res.error) throw res.error;
      setFuRow((prev) => ({
        opted_in: nextOptedIn,
        language: nextOptedIn ? language : (prev?.language ?? language),
        last_sent_at: prev?.last_sent_at ?? null,
      }));
      toast.success(
        nextOptedIn
          ? isAr
            ? "تم تفعيل المتابعة الأسبوعية من EVO — أول رسالة مع أول دورة إرسال"
            : "Weekly EVO check-in enabled — first email with the next send cycle"
          : isAr
            ? "تم إيقاف المتابعة الأسبوعية"
            : "Weekly EVO check-in disabled",
      );
    } catch {
      toast.error(isAr ? "حدث خطأ — حاول مرة أخرى" : "Something went wrong");
    } finally {
      setFuBusy(false);
    }
  };

  // ADMIN-ONLY — the phone-friendly replacement for the terminal dispatch:
  // same endpoint, same gates (admin session instead of x-cron-secret).
  const sendFollowupNow = async () => {
    setSendingNow(true);
    try {
      const res = await fetch("/api/evo/followup/dispatch", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok)
        throw new Error(body?.error || "dispatch failed");
      const { sent = 0, failed = 0, skipped = 0, scanned = 0 } = body;
      if (scanned === 0) {
        toast.success(
          isAr
            ? "لا يوجد مستلمون مستحقون الآن — فعّل المتابعة وتوصلك أول رسالة مع أول دورة"
            : "No recipients due right now — enable the check-in and the first cycle will reach you",
        );
      } else {
        toast.success(
          isAr
            ? `تم الإرسال: ${sent} · فشل: ${failed} · تخطي: ${skipped}`
            : `Sent: ${sent} · failed: ${failed} · skipped: ${skipped}`,
        );
      }
      loadFollowupRow(); // last_sent_at may have moved for this account
    } catch {
      toast.error(isAr ? "فشل الإرسال — حاول مرة أخرى" : "Send failed — try again");
    } finally {
      setSendingNow(false);
    }
  };

  // PHASE 69 — «احفظ كخطة»: persists the EVO plan text as a REAL plan row
  // via /api/plans/member-edit (plans RLS is coach-write-only, so the
  // member path runs server-side with ownership checks).
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [savedPlanIds, setSavedPlanIds] = useState<Set<string>>(new Set());

  // EVO-1 (W5.1) — 👍/👎 quality signal on assistant replies.
  // ratedIds is session-local UI state (NOT persisted — the ledger is the
  // record of truth); reason input opens only for 👎 and is optional.
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());
  const [ratingInFlightId, setRatingInFlightId] = useState<string | null>(null);
  const [reasonForId, setReasonForId] = useState<string | null>(null);
  const [feedbackReason, setFeedbackReason] = useState("");
  const sendFeedback = useCallback(
    async (
      msg: { id: string; content: string },
      feedback: "up" | "down",
      reason: string | null,
    ) => {
      if (ratingInFlightId) return;
      setRatingInFlightId(msg.id);
      // Context snippets for the admin weekly review: the last user message
      // before this reply (same content already visible in chat_messages).
      const ratedIdx = messages.findIndex((m) => m.id === msg.id);
      const prevUser = [...messages.slice(0, ratedIdx < 0 ? messages.length : ratedIdx)]
        .reverse()
        .find((m) => m.role === "user");
      try {
        // Telemetry fire-and-forget: failures are silent — never disturb chat UX.
        await fetch("/api/ai/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback,
            reason,
            messageId: msg.id.slice(0, 80),
            question: prevUser?.content?.slice(0, 500) ?? null,
            reply: msg.content.slice(0, 500),
          }),
        }).catch(() => null);
        setRatedIds((prev) => new Set(prev).add(msg.id));
      } finally {
        setRatingInFlightId(null);
        setReasonForId(null);
        setFeedbackReason("");
      }
    },
    [messages, ratingInFlightId],
  );
  const savePlan = useCallback(
    async (msg: { id: string; content: string; planKind?: string; planRequest?: string }) => {
      if (!msg.planKind || savingPlanId) return;
      setSavingPlanId(msg.id);
      try {
        const res = await fetch("/api/plans/member-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "save-evo",
            kind: msg.planKind,
            title:
              msg.planRequest?.slice(0, 80) ||
              (isAr ? "خطة من EVO" : "Plan from EVO"),
            text: msg.content,
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) {
          throw new Error(json?.message || "save failed");
        }
        setSavedPlanIds((prev) => new Set(prev).add(msg.id));
        toast.success(
          isAr ? "تم حفظ الخطة في صفحة خططي ✓" : "Plan saved to your plans page ✓",
          { action: { label: isAr ? "افتح" : "Open", onClick: () => router.push("/plans") } },
        );
      } catch (e) {
        toast.error(
          e instanceof Error && e.message !== "save failed"
            ? e.message
            : isAr ? "تعذر حفظ الخطة — حاول مرة أخرى" : "Could not save the plan",
        );
      } finally {
        setSavingPlanId(null);
      }
    },
    [isAr, savingPlanId, router],
  );

  const [input, setInput] = useState("");
 // OWNER DIRECTIVE #1: voice questions (Web Speech API) — Arabic or English.
 const voiceLang = isAr ? "ar-EG" : "en-US";
 const handleVoiceTranscript = useCallback(
 (text: string) => setInput((prev) => (prev ? `${prev} ${text}` : text)),
 [],
 );
  const inputRef = useRef<HTMLInputElement>(null);

  // ── SCROLL LAW (OWNER 2026-08-27): the chat ALWAYS opens at the END of
  // the conversation, never the beginning. The old effect keyed on
  // [messages, isTyping] never fired on open — history had already loaded
  // while the drawer was closed (ref was null), so reopening showed the
  // TOP of the conversation. Now we scroll the CONTAINER itself:
  //   • on drawer open / history restore  → instant snap to the latest message
  //   • on new messages while open        → smooth follow
  // Container.scrollTo also avoids scrollIntoView's side effect of scrolling
  // the whole page behind the drawer.
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const pendingSnapRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) pendingSnapRef.current = true;
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior) => {
    const el = scrollBodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Double rAF: wait for the drawer layout (and restored history DOM) to
    // be committed, then snap/follow. Instant on open — smooth afterwards.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        scrollToLatest(pendingSnapRef.current ? "auto" : "smooth");
        pendingSnapRef.current = false;
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isOpen, messages, isTyping, scrollToLatest]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current && !dailyLimitReached) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, dailyLimitReached]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || dailyLimitReached) return;
    sendMessage(input);
    setInput("");
  };

  // Welcome message when chat is empty
  const showWelcome = messages.length === 0;
  // T-AI-DEEP-AUDIT-V2 (D2 fix): "subscriber" = PAID tier from the resolved
  // membership, NOT merely being logged in. The old `!!profile` made free
  // accounts look unlimited: no countdown, no warning, and — after the
  // server 429 — an enabled-but-dead input (locks were gated on
  // `!isSubscriber`). Now every quota UI keys off dailyLimit/isPaidTier
  // which mirror the server's actual tier resolution.
  const isSubscriber = isPaidTier;

  // W1-3c (A-01): every Radix dismissal (Escape · overlay click · the X
  // button's DialogClose) funnels into ONE call of closeChat; opening
  // stays a single call of openChat (the lazy quota refresh rides it). A
  // single funnel is also what guarantees the back-button sentinel's
  // history back can never double-fire (two close paths used to be the
  // classic way to lose an extra history entry).
  const handleDrawerOpenChange = (open: boolean) => {
    if (open) openChat();
    else closeChat();
  };

  return (
    <>
      <DialogPrimitive.Root open={isOpen} onOpenChange={handleDrawerOpenChange}>
      {/* Floating Button — always mounted: it is now the Radix dialog TRIGGER
          (W1-3c/A-01) — focus returns to it when the drawer closes and it
          carries aria-haspopup/aria-expanded for free.
          (OWNER 2026-08-27: enlarged 36px → 48px.)
          NO-COVER LAW: lifts above the cookie-consent banner via the
          --mhe-cookie-bar-h variable published by CookieConsent — a new
          visitor must always be able to reach EVO. While the drawer is open
          the bubble sits inert UNDER the modal overlay (Radix aria-hides +
          disables outside pointer events) instead of unmounting — the old
          conditional unmount is what used to break focus restore. */}
      <DialogPrimitive.Trigger asChild>
        <button
          className="evo-bubble-ring fixed z-50 cursor-pointer rounded-full bg-[var(--tint)] p-1 transition-all hover:scale-105"
          style={{
            [isAr ? "left" : "right"]: "20px",
            bottom: "calc(20px + var(--mhe-cookie-bar-h, 0px))",
          } as React.CSSProperties}
          aria-label={isAr ? "افتح محادثة EVO" : "Open EVO chat"}
        >
          {/* EVO avatar — mission §5: circular 56px, light/dark pair, dark
              mode gets a 2px glow ring in var(--ai) (.evo-bubble-ring). */}
          <span className="relative block">
            <ThemeImg
              light="/images/brand/evo-widget-light.webp"
              dark="/images/brand/evo-widget-dark.webp"
              alt="EVO"
              width={56}
              height={56}
              /* PERF-220: lazy — the widget itself mounts post-idle via
                  EvoWidgetLazy, so eager buys nothing (the bubble paints at
                  mount-time layout either way); eager made Chrome ALSO
                  fetch the hidden light variant on dark-theme visits.
                  Lazy kills that duplicate ~16KB fetch per dark pageview. */
              className="h-14 w-14 rounded-full object-cover"
            />
            <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[var(--ai)] opacity-15" />
            {/* Online indicator */}
            <span className="absolute bottom-0.5 end-0.5 h-3.5 w-3.5 rounded-full bg-[#34c759] ring-2 ring-[var(--bg)]" />
          </span>
        </button>
      </DialogPrimitive.Trigger>

      {/* Drawer — W1-3c (A-01): a REAL modal dialog on the Radix primitives
          (the same @radix-ui/react-dialog the ui/modal wrapper rides): role=
          dialog, Escape, focus trap + restore, modal isolation — while keeping
          the slide-in side-drawer shape and animation. The portal mounts only
          while open (Presence on the controlled root — same lifecycle as the
          old conditional render). */}
      <DialogPrimitive.Portal>
          {/* Backdrop — now the Radix overlay. z-50 (ties with the drawer;
            portal DOM order puts the content above it) also dims the
            always-mounted trigger bubble while the drawer is open. Clicking
            it is an outside pointer-down → ONE onOpenChange(false) — the
            exact role the old backdrop's onClick carried. */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20" />

          {/* Drawer */}
          <DialogPrimitive.Content asChild aria-describedby={undefined}>
          <aside
            className="fixed bottom-0 top-0 z-50 flex w-full sm:max-w-[380px] flex-col bg-[var(--bg)] shadow-2xl"
            style={{
              [isAr ? "left" : "right"]: 0,
              animation: isAr
                ? "slideInRight 0.3s ease-out"
                : "slideInLeft 0.3s ease-out",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--edge)] p-4" style={{ backgroundColor: "#141518", color: "var(--text)" }}>
              <div className="flex items-center gap-3">
                <ThemeImg
                  light="/images/brand/evo-widget-light.webp"
                  dark="/images/brand/evo-widget-dark.webp"
                  alt="EVO"
                  width={40}
                  height={40}
                  className="ai-ring h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    {/* W1-3c: the visible name IS the accessible name — Radix
                        wires DialogTitle into the dialog's aria-labelledby
                        (an unnamed dialog does not translate; W1-3a law). */}
                    <DialogPrimitive.Title className="text-base font-semibold">
                      EVO
                    </DialogPrimitive.Title>
                    <Sparkles className="ai-accent h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#34c759]" />
                    <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      {isAr ? "متاح الآن" : "Online now"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* W1-3c: DialogClose — the click routes through Radix's
                    single onOpenChange(false) (no direct closeChat call,
                    so Escape/X/overlay can never double-fire). */}
                <DialogPrimitive.Close asChild>
                  <button
                    className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10"
                    aria-label={isAr ? "إغلاق" : "Close"}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* EVO-3/D4 — weekly check-in opt-in INSIDE the widget (owner:
                «ضيف تفعيل المتابعه الاسبوعيه داخل ويدجيت ايفو نفسه بالاعلى»).
                Logged-in only (an account is required — anonymous has no
                prefs row); admin gets the phone-friendly «إرسال الآن»
                trigger — the same documented dispatch endpoint with his
                admin session, replacing any terminal step. */}
            {profile && (
              <div
                className="flex items-center gap-2 border-b border-[var(--edge)] px-4 py-2"
                style={{ backgroundColor: "var(--bg)" }}
              >
                <Mail className="ai-accent h-3.5 w-3.5 shrink-0" />
                <span
                  className="flex-1 text-[11px] font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {isAr ? "المتابعة الأسبوعية" : "Weekly check-in"}
                </span>
                <button
                  type="button"
                  disabled={fuBusy || !fuLoaded}
                  onClick={() =>
                    applyFollowupWrite(!fuOptedIn, isAr ? "ar" : "en")
                  }
                  aria-pressed={fuOptedIn}
                  aria-label={
                    isAr
                      ? "تفعيل أو إيقاف المتابعة الأسبوعية من EVO"
                      : "Toggle the weekly EVO check-in"
                  }
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                    fuOptedIn ? "bg-[#34c759]" : "bg-[#d2d2d7]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                      fuOptedIn ? "start-[18px]" : "start-0.5"
                    }`}
                  />
                </button>
                {isAdmin && fuOptedIn && (
                  <button
                    type="button"
                    disabled={sendingNow}
                    onClick={sendFollowupNow}
                    className="shrink-0 rounded-full bg-[#0071e3] px-2.5 py-1 text-[10px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {sendingNow
                      ? isAr
                        ? "جارٍ الإرسال…"
                        : "Sending…"
                      : isAr
                        ? "إرسال الآن"
                        : "Send now"}
                  </button>
                )}
              </div>
            )}

            {/* PHASE 69 — QUOTA METER: the advertised plan quotas are now
                VISIBLE (same tamper-proof ledger the server counts).
                Phase 183 (2026-09-13 «البوول الموحد»): ONE unified
                monthly pool — nutrition + workout COMBINED; the old
                per-kind + weekly split display is retired. Owner
                order 2026-10-28 «تجميع حصص الاشتراكات المدفوعة»:
                a member's pool AGGREGATES every distinct active paid
                tier (2/4/8/8; premium+pro = 12) — the meter below
                reads the same enforcement counts either way.
                Owner directive 2026-09-13: the meter is for EVERYONE —
                free users and guests see their own pool too (the quota
                route reads the same enforcement counts via ?guestId). */}
            {quota && (
              <div className="border-b border-[#d2d2d7] bg-white px-4 py-1.5 text-center text-[10px] font-normal text-[#6e6e73]">
                <span>
                  {quota.plans
                    ? isAr
                      ? `خطط AI هذا الشهر (تغذية + تمرين): ${quota.plans.used}/${quota.plans.unlimited ? "∞" : quota.plans.limit}`
                      : `AI plans this month (nutrition + workout): ${quota.plans.used}/${quota.plans.unlimited ? "∞" : quota.plans.limit}`
                    : isAr
                      ? `الخطط الشهرية: ${quota.nutrition.used}/${quota.nutrition.unlimited ? "∞" : quota.nutrition.limit}`
                      : `Monthly plans: ${quota.nutrition.used}/${quota.nutrition.unlimited ? "∞" : quota.nutrition.limit}`}
                </span>
              </div>
            )}

            {/* Messages area — W1-3c (A-01): role="log" makes the transcript a
                live region (implicit aria-live=polite; the explicit attribute
                covers legacy AT) — user messages, the SSE token-stream growth,
                and typing/limit states are now ANNOUNCED instead of silently
                re-rendering. The container persists across the welcome↔chat
                swap so the live region's element identity never breaks. */}
            <div
              ref={scrollBodyRef}
              role="log"
              aria-live="polite"
              className="flex-1 overflow-y-auto bg-[var(--tint)] p-4"
            >
              {showWelcome ? (
                /* Welcome screen */
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ThemeImg
                    light="/images/brand/evo-widget-light.webp"
                    dark="/images/brand/evo-widget-dark.webp"
                    alt="EVO"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                  <h3 className="mt-4 text-lg font-semibold">EVO</h3>
                  <p className="mt-1 max-w-[260px] text-sm font-normal text-[#6e6e73]">
                    {isAr
                      ? "محرك أداء ذكي. اسألني عن التمارين، والأطعمة، والتغذية، أو أي موضوع يخص اللياقة."
                      : "Smart performance engine. Ask me about exercises, foods, nutrition, or anything fitness."}
                  </p>
                  {/* Suggested questions */}
                  <div className="mt-6 w-full space-y-2">
                    {[
                      isAr
                        ? "كم سعرة صدور دجاج؟"
                        : "How many calories in chicken breast?",
                      isAr
                        ? "كيف أقوم بتمرين بنش بريس؟"
                        : "How to do bench press?",
                      isAr
                        ? "أريد برنامجًا للمبتدئين"
                        : "I want a beginner program",
                      isAr
                        ? "ما هو أفضل بروتين؟"
                        : "What's the best protein?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          sendMessage(q);
                        }}
                        className="block w-full rounded-2xl bg-white p-3 text-start text-sm font-normal text-[#1d1d1f] transition-colors hover:bg-[#e5e5e7]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat messages */
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.role === "user"
                            ? "bg-[var(--text)] text-[var(--bg)]"
                            : "bg-[var(--card)] text-[var(--text)]"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p dir="auto" className="text-sm font-normal leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        ) : (
                          <MessageText content={msg.content} />
                        )}
                        {/* EVO-1 (W5.1) — 👍/👎 on final assistant replies.
                            Quota/error bubbles («⏰»/«عذراً») are not model
                            output — rating them is noise for the review. */}
                        {msg.role === "assistant" &&
                          msg.content &&
                          !msg.content.startsWith("⏰") &&
                          !msg.content.startsWith("عذراً") && (
                            <div className="mt-1.5">
                              {ratedIds.has(msg.id) ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                                  <Check className="h-3 w-3" />
                                  {isAr ? "شكرًا لتقييمك" : "Thanks for your feedback"}
                                </span>
                              ) : reasonForId === msg.id ? (
                                <div className="flex flex-col gap-1.5">
                                  <input
                                    value={feedbackReason}
                                    onChange={(e) => setFeedbackReason(e.target.value)}
                                    maxLength={300}
                                    dir="auto"
                                    placeholder={
                                      isAr
                                        ? "ما الذي ينقص الرد؟ (اختياري)"
                                        : "What was wrong? (optional)"
                                    }
                                    className="w-full rounded-lg border border-black/10 bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-[#0071e3]"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        sendFeedback(msg, "down", feedbackReason.trim() || null)
                                      }
                                      disabled={ratingInFlightId === msg.id}
                                      className="btn-chrome inline-flex items-center gap-1 px-2.5 py-1 text-[11px]"
                                    >
                                      {ratingInFlightId === msg.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <ThumbsDown className="h-3 w-3" />
                                      )}
                                      {isAr ? "أرسل" : "Send"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReasonForId(null);
                                        setFeedbackReason("");
                                      }}
                                      className="px-2 py-1 text-[11px] text-[var(--muted-foreground)]"
                                    >
                                      {isAr ? "تخطي" : "Skip"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 opacity-50 transition-opacity hover:opacity-100">
                                  <button
                                    onClick={() => sendFeedback(msg, "up", null)}
                                    disabled={ratingInFlightId === msg.id}
                                    aria-label={isAr ? "رد مفيد" : "Helpful reply"}
                                    className="p-1 text-[var(--muted-foreground)] hover:text-[#34c759]"
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setReasonForId(msg.id)}
                                    disabled={ratingInFlightId === msg.id}
                                    aria-label={isAr ? "رد غير مفيد" : "Not helpful"}
                                    className="p-1 text-[var(--muted-foreground)] hover:text-red-500"
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        {/* PHASE 69 — «احفظ كخطة» on the reply that answered a
                            plan-creation request (paid tiers) */}
                        {msg.role === "assistant" && isSubscriber && msg.planKind && (
                          <div className="mt-2 border-t border-black/10 pt-2">
                            {savedPlanIds.has(msg.id) ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#34c759]">
                                <Check className="h-3 w-3" />
                                {isAr ? "محفوظة في خططي" : "Saved to my plans"}
                              </span>
                            ) : (
                              <button
                                onClick={() => savePlan(msg)}
                                disabled={savingPlanId === msg.id}
                                className="btn-chrome inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                              >
                                {savingPlanId === msg.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Bookmark className="h-3 w-3" />
                                )}
                                {isAr ? "احفظ كخطة" : "Save as plan"}
                              </button>
                            )}
                          </div>
                        )}
                        {/* Links */}
                        {msg.links && msg.links.length > 0 && (
                          <div className="mt-2 space-y-1 border-t border-black/10 pt-2">
                            {msg.links.map((link, i) => (
                              <a
                                key={i}
                                href={link.url}
                                className="flex items-center gap-1.5 text-xs font-medium text-[#0071e3] hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1 rounded-2xl bg-[var(--card)] px-4 py-3">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--ai)] [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--ai)] [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--ai)]" />
                      </div>
                    </div>
                  )}

                  {/* Rate limit warning — D2: keyed on the RESOLVED limit,
                      not on being logged in. */}
                  {dailyLimitReached && !isSubscriber && (
                    <div className="rounded-2xl bg-[#ff9500]/10 p-4 text-center">
                      <p className="text-sm font-medium text-[#ff9500]">
                        {isAr
                          ? `وصلت الحد المجاني (${dailyLimit} رسائل يوميًا)`
                          : `Free limit reached (${dailyLimit} messages a day)`}
                      </p>
                      <p className="mt-1 text-xs font-normal text-[#6e6e73]">
                        {isAr
                          ? "اشترك لمتابعة المحادثة بلا حدود"
                          : "Subscribe to continue chatting without limits"}
                      </p>
                      <a
                        href="/memberships"
                        className="btn-chrome mt-3 px-4 py-2 text-xs"
                      >
                        {isAr ? "اشترك الآن" : "Subscribe now"}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input area — D2: the countdown shows only for limited tiers
                (dailyLimit !== null); paid tiers chat without counters. */}
            {/* m2 fix (DEEP-UX-AUDIT-2026-09-18): the composer row was the
                narrowest input in the product on the most-used screen —
                on a 390px phone the drawer cap (380) + p-3 + two gap-2
                slots + the 40px mic + 40px send left only ~252px for the
                field (~218px of typing space). Three width recoveries,
                none of them touching the 40px touch targets (m1 spirit):
                (1) full-bleed drawer on phones — `sm:max-w-[380px]` keeps
                the desktop/tablet cap at 380px exactly; (2) composer
                padding p-3→p-2; (3) row gap gap-2→gap-1.5 and input side
                padding px-4→px-3. Net on 390px: field ≈288px and typing
                space ≈262px (+20%). */}
            <div className="border-t border-[var(--edge)] bg-[var(--bg)] p-2">
              {!isSubscriber && dailyLimit !== null && (
                <div className="mb-2 text-center text-[10px] font-normal text-[#6e6e73]">
                  {isAr
                    ? `${dailyLimit - dailyCount} رسائل متبقية اليوم`
                    : `${dailyLimit - dailyCount} messages left today`}
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  dir="auto"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    dailyLimitReached && !isSubscriber
                      ? isAr
                        ? "وصلت الحد المجاني"
                        : "Limit reached"
                      : isAr
                        ? "اكتب سؤالك..."
                        : "Type your question..."
                  }
                  disabled={isTyping || (dailyLimitReached && !isSubscriber)}
                  className="flex-1 rounded-full border border-[var(--edge)] bg-[var(--tint)] px-3 py-2.5 text-sm font-normal outline-none focus:border-[var(--ai)] disabled:opacity-50"
                />
                <VoiceMicButton
                  lang={voiceLang}
                  onTranscript={handleVoiceTranscript}
                  disabled={isTyping || (dailyLimitReached && !isSubscriber)}
                />
                <button
                  type="submit"
                  disabled={
                    !input.trim() || isTyping || (dailyLimitReached && !isSubscriber)
                  }
                  className="ai-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--text)] text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-50"
                  aria-label={isAr ? "إرسال" : "Send"}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 rtl:rotate-180" />
                  )}
                </button>
              </form>
            </div>
          </aside>
          </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
