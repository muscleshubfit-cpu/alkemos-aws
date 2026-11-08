"use client";

// ============================================================
// LandingViewIslands — SEO-P1-6 (frame 315, plan §5 step 1)
// The homepage's STATIC-IMPORT client islands. The 1,851-line
// "use client" LandingView was split (owner-ordered audit item 6,
// reference doc docs/SEO-P1-6-ISLANDS-PLAN-2026-09-30.md): the
// server body now renders every static section, and ONLY the
// interactive leaves live here — transferred VERBATIM (zero
// behavior / DOM / API / design change; the binding principles of
// plan §4):
//   · Reveal            (IO + idle/armed/shown + 1.8s failsafe)
//   · CountUp           (rAF spring + blur materialization)
//   · CarouselShell     (styled-jsx stays INSIDE a client island —
//                        unsupported in RSC, plan §4.5)
//   · LandingExerciseCard + LibraryBrowser (the muscle-group tab
//                        state — the card renders inside the island
//                        because the interactive filter owns it)
//   · EvoCard           (openEvoFloatingChat onClick)
//   · HeroCta           (NEW island: the hero's two-button pair —
//                        the ONLY hero part that reads useAuth; its
//                        initial SSR output is the GUEST pair, byte-
//                        identical to the pre-split client render)
// The two DATA-FETCH sections (#learn blog + featured coaches) live
// in LandingViewDynamicIslands.tsx behind next/dynamic so the
// @/lib/blog chain leaves the initial bundle (plan §2/§6).
// ============================================================

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { EXERCISES_COUNT, EXERCISE_CATEGORY_COUNTS } from "@/lib/exercises-shared";
import { getExerciseImageSrcSet } from "@/lib/exercise-images";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { openEvoFloatingChat } from "@/lib/evo-chat-events";
import { ThemeImg, EngravedIcon } from "@/components/ThemeImg";
import type { HomeExerciseSample, HomeSamples } from "@/lib/home-samples";

// ============================================================
// Site palette — the Marble & Chrome identity resolves through
// the CSS variables in globals.css (:root + [data-theme="dark"]).
// All tokens meet WCAG AAA on their intended backgrounds; --ai
// cyan stays reserved for AI-assistant surfaces only.
// (Duplicated from the server view verbatim — plan §4.4: the
// identity stays byte-identical on both sides of the boundary.)
// ============================================================
const PALETTE = {
  textPrim: "var(--text)",
  textSec: "var(--muted-foreground)",
  textMuted: "var(--muted-foreground)",
  border: "var(--edge)",
  surface: "var(--card)",
  sectionWhite: "var(--bg)",
  sectionGray: "var(--tint)",
  halo: "var(--tint)",
};

// Content-volume counts derive from the client-safe verified
// constants (pinned to the real arrays by library-counts.test.ts).
// "+" marks CONTENT VOLUME only.
const EX_PLUS = `${EXERCISES_COUNT.toLocaleString("en-US")}+`;

// The seven muscle families the interactive library browser exposes
// (labels mirror the hub's own vocabulary; «كور» keeps the plain
// transliterated register — VRD-V4 K-5). HOME-REFINE-271 F1: restored.
const MUSCLE_TABS = [
  { labelAr: "صدر", labelEn: "Chest", slug: "chest" },
  { labelAr: "ظهر", labelEn: "Back", slug: "back" },
  { labelAr: "أكتاف", labelEn: "Shoulders", slug: "shoulders" },
  { labelAr: "أرجل", labelEn: "Legs", slug: "legs" },
  { labelAr: "بايسبس", labelEn: "Biceps", slug: "biceps" },
  { labelAr: "ترايسبس", labelEn: "Triceps", slug: "triceps" },
  { labelAr: "كور", labelEn: "Core", slug: "core" },
] as const;

// ── Reveal — the living-page motion primitive ──
// The retired pre-258 reveal was jarring because it animated
// layout and re-triggered; this one is structurally incapable of
// both: it hides content ONLY after mount (SSR/no-JS users always
// see everything — the armed state never exists in markup),
// animates opacity/translateY only (zero CLS), fires once, and
// stands down entirely under prefers-reduced-motion.
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in ms (kept ≤200 so the group reads as one beat). */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // idle = server/motion-off (visible) · armed = hidden, waiting
  // for the observer · shown = revealed (stays forever).
  const [phase, setPhase] = useState<"idle" | "armed" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    // Arm AFTER the observer exists, so an element already in view
    // flips to "shown" in the observer's first callback — the
    // hidden state only ever spans one animation frame.
    setPhase("armed");
    // FAILSAFE (the jarring-reveal lesson, inverted): no content may
    // stay hidden past 1.8s in ANY environment — virtualized capture
    // viewports, IO quirks, background tabs. A fast scroller still
    // gets the entrance; a slow one simply finds everything visible.
    const failsafe = window.setTimeout(() => {
      setPhase("shown");
      io.disconnect();
    }, 1800);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  const hidden = phase === "armed";
  return (
    <div
      ref={ref}
      className={`rv ${className}`}
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
        ...(hidden ? { opacity: 0, transform: "translateY(14px)" } : null),
      }}
    >
      {children}
    </div>
  );
}

// ── CountUp — the proof numbers come ALIVE (VRD-V7 P1-4) ──
// SSR renders the final value (no-JS/hydration always shows the
// truth); when the strip scrolls into view and motion is allowed,
// the number counts up once with a SPRING settle and a light BLUR
// materialization (21st.dev-style count-up re-authored internally —
// zero dependencies, rAF-only):
//   · spring — a gentle easeOutBack overshoot (~5%) that settles back
//     onto the true value (the «living platform» beat);
//   · blur — the digits start softly defocused and sharpen as they
//     land (filter+opacity only — compositor-friendly, no layout);
//   · ZERO CLS — the final string renders as an in-flow ghost sizer
//     (.count-sizer) while the animating digits ride an absolute
//     overlay (.count-live), so the strip never wobbles;
//   · accessibility — the animated digits are aria-hidden and the
//     final value is announced once via .sr-only;
// The value stays derived from the verified constants.
export function CountUp({
  value,
  suffix = "",
  paintClass = "",
}: {
  value: number;
  suffix?: string;
  /** The wrapper's text-paint class (e.g. chrome-text). It must ride
   * the in-flow sizer AND the absolute overlay SEPARATELY: a parent's
   * background-clip:text never clips to out-of-flow descendants, so
   * the overlay has to own its own gradient or its digits vanish. */
  paintClass?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<number | null>(null);
  // Settle progress 0→1 (SSR = 1 — fully landed, zero blur).
  const [prog, setProg] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((e) => e.isIntersecting)) return;
        started = true;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1100;
        // EaseOutBack with a modest overshoot constant — the spring
        // reads as a settle, never a bounce (c1 = 0.7 → ≈5% peak).
        const c1 = 0.7;
        const c3 = c1 + 1;
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
          setDisplay(Math.max(0, Math.round(value * eased)));
          setProg(p);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  const shown = display ?? value;
  const final = `${value.toLocaleString("en-US")}${suffix}`;
  // The blur peaks at liftoff and fully resolves on landing — the
  // number materializes INTO focus (paint-only; the strip is small).
  const blur = prog < 1 ? `blur(${(3 * Math.pow(1 - prog, 1.5)).toFixed(2)}px)` : undefined;
  return (
    <span ref={ref} className="count-shell">
      <span className={`count-sizer ${paintClass}`} aria-hidden="true">
        {final}
      </span>
      <span
        className={`count-live ${paintClass}`}
        aria-hidden="true"
        style={{ filter: blur }}
      >
        {shown.toLocaleString("en-US")}
        {suffix}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}

// ── CarouselShell — the shared blog-style carousel scaffolding
//    (HOME-REFINE-270 R4: the exercise library + the diet-plan
//    library ride the SAME pattern as the blog row: a smooth
//    horizontal scroller with the RTL-aware arrow pair). The exact
//    arrow recipe the blog carousel used since Phase 257 — 44px
//    touch targets (rtl-typography leg) — lives here once.
//    SEO-P1-6: the shell is a client island that ACCEPTS
//    server-rendered children (the RSC standard pattern — the
//    program/diet cards stay server output inside the scroller).
export function CarouselShell({
  isAr,
  children,
  ariaLabel,
}: {
  isAr: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Scroll buttons */}
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={() => scroll(isAr ? "right" : "left")}
          className="grid h-9 w-9 max-md:h-11 max-md:w-11 place-items-center rounded-full transition-colors"
          style={{ backgroundColor: PALETTE.surface, color: PALETTE.textPrim, border: `1px solid ${PALETTE.border}` }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = PALETTE.halo; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = PALETTE.surface; }}
          aria-label={isAr ? "السابق" : "Previous"}
        >
          <svg className="h-4 w-4 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => scroll(isAr ? "left" : "right")}
          className="grid h-9 w-9 max-md:h-11 max-md:w-11 place-items-center rounded-full transition-colors"
          style={{ backgroundColor: PALETTE.surface, color: PALETTE.textPrim, border: `1px solid ${PALETTE.border}` }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = PALETTE.halo; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = PALETTE.surface; }}
          aria-label={isAr ? "التالي" : "Next"}
        >
          <svg className="h-4 w-4 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5-4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        aria-label={ariaLabel}
      >
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        {children}
      </div>
    </div>
  );
}

// ─── HOME-EXPERIENCE-269: real-content sample cards (exercises /
//     foods / programs). Every card is a plain <a> into its detail
//     page — a real content entry point. The samples arrive as
//     precomputed serializable props from the server
//     (getHomeSamples) — zero library imports here. ───

// SEO-P1-6: LandingExerciseCard rides INSIDE the LibraryBrowser
// island (the interactive per-family filter owns its render path);
// the other six display cards stay server-side in LandingView.
function LandingExerciseCard({ ex, isAr }: { ex: HomeExerciseSample; isAr: boolean }) {
  const name = isAr ? ex.nameAr : ex.nameEn;
  return (
    <a
      href={`${isAr ? "/ar" : ""}/exercises/${ex.slug}`}
      className="marble-card card-lift group flex flex-col"
    >
      {/* Real exercise image (start-position frame from the library
          artwork) — object-contain keeps the full-body framing honest.
          P1-2 (PERFORMANCE-AUDIT-2026-11-08): prebuilt responsive srcset
          (400w/200w) — the audit measured ~80% waste per card photo at
          ~175px display; mobile now ships ~3-8KB instead of 12-22KB. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--card)]">
        {ex.image ? (
          <ImageWithFallback
            src={ex.image}
            alt={name}
            fill
            srcSet={getExerciseImageSrcSet(ex.image)}
            sizes="(max-width: 768px) 45vw, 22vw"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            fallbackElement={
              <div className="grid h-full w-full place-items-center">
                <EngravedIcon name="dumbbell" alt="" size={40} className="h-10 w-10 opacity-60" />
              </div>
            }
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <EngravedIcon name="dumbbell" alt="" size={40} className="h-10 w-10 opacity-60" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 text-start">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: PALETTE.textMuted }}>
          {isAr ? ex.categoryLabelAr : ex.categoryLabelEn}
        </p>
        <h3 className="mt-1 text-base font-semibold leading-tight tracking-tight line-clamp-2" style={{ color: PALETTE.textPrim }}>
          {name}
        </h3>
        {/* Level + equipment — the two facts a browser filters by. */}
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: PALETTE.textSec }}>
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: ex.levelColor }}
            aria-hidden="true"
          />
          {isAr ? ex.levelLabelAr : ex.levelLabelEn}
          <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
          <span className="truncate">{isAr ? ex.equipmentLabelAr : ex.equipmentLabelEn}</span>
        </p>
        <p className="chrome-text mt-3 text-xs font-semibold">{isAr ? "اعرض التمرين ›" : "View exercise ›"}</p>
      </div>
    </a>
  );
}

// ── The interactive muscle-group library browser (HOME-REFINE-271
//    F1 — RESTORED from the living-product rebuild): real curated
//    samples filtered in-page by muscle group, with a quiet
//    crossfade on every swap. The chips mirror the hub vocabulary
//    and carry the VERIFIED per-family counts (the drift-tested
//    EXERCISE_CATEGORY_COUNTS); the CTA opens the full library. ──
export function LibraryBrowser({ samples, isAr }: { samples: HomeSamples; isAr: boolean }) {
  const [cat, setCat] = useState<string>("chest");
  const filtered = samples.exercises.filter((e) => e.categorySlug === cat);

  return (
    <div>
      {/* The muscle chips — the SAME hub vocabulary, now answering */}
      <div>
        <p className="text-center text-xs font-semibold uppercase tracking-wider" style={{ color: PALETTE.textMuted }}>
          {isAr ? "اختر مجموعة عضلية" : "Pick a muscle group"}
        </p>
        <div className="chips-row mt-3">
          {MUSCLE_TABS.map((c) => {
            const active = c.slug === cat;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCat(c.slug)}
                aria-pressed={active}
                className="seal-chip transition-transform duration-300 hover:-translate-y-0.5"
                style={
                  active
                    ? {
                        background: "var(--text)",
                        color: "var(--bg)",
                        borderColor: "var(--text)",
                      }
                    : undefined
                }
                title={isAr ? `${EXERCISE_CATEGORY_COUNTS[c.slug] ?? 0} تمرينًا` : `${EXERCISE_CATEGORY_COUNTS[c.slug] ?? 0} exercises`}
              >
                {isAr ? c.labelAr : c.labelEn}
                <span className="font-semibold">{EXERCISE_CATEGORY_COUNTS[c.slug] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* The live swap — real cards re-render per selection.
          HOME-PLATFORM-284: SIX curated samples per family now fill
          a full 2×3 grid on md+ (was 2-3 cards on a 4-col row). */}
      {filtered.length > 0 ? (
        <div key={cat} className="swap-fade mt-7 grid grid-cols-2 gap-4 md:grid-cols-3">
          {filtered.map((ex) => (
            <LandingExerciseCard key={ex.slug} ex={ex} isAr={isAr} />
          ))}
        </div>
      ) : (
        <p className="mt-7 text-center text-sm" style={{ color: PALETTE.textSec }}>
          {isAr ? "لا عينات منسقة لهذه المجموعة بعد — افتح المكتبة الكاملة." : "No curated samples for this group yet — open the full library."}
        </p>
      )}

      <p className="mt-6 text-center text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
        {isAr
          ? `تمارين حقيقية من مكتبة تضم ${EX_PLUS} تمرينًا — بصور الأداء الصحيح وشرح واضح داخل صفحة كل تمرين.`
          : `Real exercises from a library of ${EX_PLUS} — with form photos and clear instructions one tap away.`}
      </p>
      <div className="mt-5 text-center">
        <a href={isAr ? "/ar/exercises" : "/exercises"} className="btn-outline px-7 py-3 text-sm font-medium md:text-base">
          {isAr ? "استكشف مكتبة التمارين كاملة" : "Explore the full exercise library"}
          <span className="chev rtl:rotate-180" aria-hidden="true">›</span>
        </a>
      </div>
    </div>
  );
}

// ── EvoCard — the AI coach's section card. NOT a full-card link:
//    the chat surface law keeps the REAL chat on the floating
//    widget (openEvoFloatingChat — the button dispatches it), while
//    the quiet «learn more» link routes to the EVO page. The avatar
//    is the widget's own character art wearing the .ai-ring (the
//    cyan AI-surface law — one of the few places cyan may touch).
//    HOME-POLISH-285: the card widened to FULL WIDTH under the two
//    planner cards (the section's hierarchy: the planners lead, EVO
//    accompanies) — a horizontal band on md+, stacked on touch. ──
export function EvoCard({ isAr }: { isAr: boolean }) {
  return (
    <div className="marble-card card-lift flex flex-col p-5 text-start md:flex-row md:items-center md:gap-8 md:p-7">
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="flex items-center gap-3">
          <ThemeImg
            light="/images/brand/evo-widget-light.webp"
            dark="/images/brand/evo-widget-dark.webp"
            alt="EVO"
            width={64}
            height={64}
            className="ai-ring h-11 w-11 shrink-0 rounded-full border border-[var(--edge)] object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold leading-tight tracking-tight" style={{ color: PALETTE.textPrim }}>
              {isAr ? "EVO — مدربك الذكي" : "EVO — your AI coach"}
            </h3>
            <span className="seal-chip mt-1.5 py-1! text-[11px]!">
              <span className="live-dot" aria-hidden="true" />
              {isAr ? "متاح الآن" : "LIVE NOW"}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm font-normal leading-relaxed" style={{ color: PALETTE.textSec }}>
          {isAr
            ? "اسأله بالعربية أو الإنجليزية: يجيبك بأرقام، ويقترح بدائل ذكية لتمارينك ووجباتك، ويعدّل خطتك مع تقدمك."
            : "Ask in Arabic or English: it answers with real numbers, suggests smart swaps for your exercises and meals, and adjusts your plan as you progress."}
        </p>
        {/* The honest visitor quota (EVO fair use — a VERIFIED policy
            restatement, not marketing copy). */}
        <p className="mt-2 text-xs font-normal leading-relaxed" style={{ color: PALETTE.textMuted }}>
          {isAr
            ? "الزوار يحصلون على 10 رسائل يوميًا مع EVO — جرّبه مجانًا، ولا تحتاج إلى بطاقة ائتمانية."
            : "Visitors get 10 messages a day with EVO — free to try, no credit card required."}
        </p>
      </div>
      <div className="mt-4 flex shrink-0 flex-col items-start gap-3 md:mt-0 md:items-end">
        <button
          type="button"
          onClick={openEvoFloatingChat}
          className="btn-outline px-5 py-2 text-sm font-medium"
        >
          <span className="live-dot" aria-hidden="true" />
          {isAr ? "تحدث مع EVO الآن" : "Chat with EVO now"}
        </button>
        <a
          href={isAr ? "/ar/evo" : "/evo"}
          className="text-sm font-medium underline decoration-[var(--edge)] underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: PALETTE.textSec }}
        >
          {isAr ? "اعرف المزيد ›" : "Learn more ›"}
        </a>
      </div>
    </div>
  );
}

// ── HeroCta — SEO-P1-6's NEW small island (plan §5 step 1): the
//    hero's two-button pair, lifted verbatim out of the static
//    hero. It is the ONLY hero part that derives from useAuth —
//    SSR renders the GUEST pair exactly as the pre-split client
//    component did (profile starts null), and the member flip
//    still lands when the deferred auth resolve fires at idle. ──
export function HeroCta({ isAr }: { isAr: boolean }) {
  const { isCoach, isAdmin, profile } = useAuth();
  // The hero CTA stays account-driven for the PRIMARY action; the
  // secondary CTA is the memberships page (HOME-REFINE-270 R1 — the
  // owner's two-button directive overrides the old funnel-free-hero
  // law): guests get login/signup + memberships, signed-in members
  // get their console + memberships.
  const isLoggedIn = !!profile;
  const memberHref = isAdmin ? "/admin" : isCoach ? "/coach" : "/dashboard";

  return (
    <div className="mt-5 flex flex-col items-stretch justify-center gap-3 md:mt-6 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-x-5 md:gap-y-3">
      {isLoggedIn ? (
        <>
          <a href={memberHref} className="btn-chrome w-full px-7 py-3 text-sm md:w-auto md:px-8 md:py-3 md:text-base">
            {isAr ? "انتقل إلى لوحة التحكم" : "Go to your dashboard"}
          </a>
          <a
            href={isAr ? "/ar/memberships" : "/memberships"}
            className="btn-outline w-full px-6 py-2.5 text-sm font-medium md:w-auto md:py-2.5 md:text-base"
          >
            {isAr ? "العضويات المميزة" : "Premium memberships"}
          </a>
        </>
      ) : (
        <>
          <a href="/auth?mode=signup" className="btn-chrome w-full px-7 py-3 text-sm md:w-auto md:px-8 md:py-3 md:text-base">
            {isAr ? "تسجيل الدخول / حساب جديد" : "Log in / Sign up"}
          </a>
          <a
            href={isAr ? "/ar/memberships" : "/memberships"}
            className="btn-outline w-full px-6 py-2.5 text-sm font-medium md:w-auto md:py-2.5 md:text-base"
          >
            {isAr ? "العضويات المميزة" : "Premium memberships"}
          </a>
        </>
      )}
    </div>
  );
}
