"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import { AdSenseAd } from "@/components/AdSenseAd";
import { OtherTools } from "@/components/OtherTools";
import { ReviewInviteCard } from "@/components/ReviewInviteCard";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { getFallbackSVG } from "@/lib/exercise-images";
import {
  workoutEquipmentOptions,
  workoutGoalOptions,
  workoutLevelOptions,
  type WorkoutPlan,
} from "@/lib/ai-workout-planner";
import {
  ensureGuestId,
  loadGuestPlan,
  saveGuestPlan,
} from "@/lib/plan-persistence";
import { Loader2, Sparkles, RotateCcw, HardDriveDownload, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * /ai-workout-planner — the AI workout planner page (§12.32 → Phase
 * 183, owner decree 2026-09-13 «البوول الموحد» — spec "Alkemos —
 * Membership & Plan Changes") — the workout twin of the meal-planner
 * page: unified monthly pool (guest 2/month — no signup wall; member
 * 2/4/8/8 by tier), success-only counting, and the PERSISTENCE LAW:
 *   - GUEST: plan mirrored to localStorage, re-hydrated on mount —
 *     navigation, exercise-detail visits, back buttons, and refreshes
 *     never lose it; it stays rendered after the pool is exhausted.
 *   - MEMBER: the route auto-saves to the account (`plans` table);
 *     hydration prefers the account copy (cross-device).
 * The signup nudge for guests is SOFT (benefits, never a block).
 */

type DemoLibraryMatch = {
  slug: string;
  name: string;
  category: string;
  image: string;
};
type DemoExercise = { name: string; sets: number; reps: number | string; library?: DemoLibraryMatch | null };
type DemoDay = { name: string; focus?: string; exercises: DemoExercise[] };
type DemoPlan = { days: DemoDay[] };

type QuotaInfo = { used: number; limit: number; remaining: number };

export default function AiWorkoutPlannerPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { profile } = useAuth();

  const [goal, setGoal] = useState("muscle");
  const [level, setLevel] = useState("beginner");
  const [days, setDays] = useState("3");
  const [equipment, setEquipment] = useState("full-gym");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DemoPlan | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [accountSaved, setAccountSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // I-4 (UX-TEST-REPORT-2026-09-21 §5-4 — «تسمية الخطط المولدة»): the
  // auto-saved row's id + title, surfaced as an editable pre-filled name
  // field (the auto title is the suggestion, the member owns the name).
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const goals = workoutGoalOptions(isAr ? "ar" : "en");
  const levels = workoutLevelOptions(isAr ? "ar" : "en");
  const equipments = workoutEquipmentOptions(isAr ? "ar" : "en");

  // ── HYDRATION: restore the plan so navigation/refresh never loses it.
  // Member → account copy (cross-device); guest → localStorage copy.
  // HOME HAND-OFF (owner directive 2026-09-24: «الخطة المولده لا تظهر
  // فى صفحة الأداة»): the homepage builders persist their generated
  // plans via the SAME plan-persistence envelope — so the localStorage
  // copy is now ALSO the member's floor when the account copy is
  // absent or the fetch fails (a plan generated on the homepage must
  // NEVER arrive at an empty tool). ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let restored = false;
      if (profile) {
        try {
          const res = await fetch("/api/ai/planner-plan?kind=workout");
          if (res.ok) {
            const data = await res.json();
            if (!cancelled && data?.plan) {
              setPlan(data.plan as DemoPlan);
              setAccountSaved(true);
              // I-4: the hydration response carries the saved row's id +
              // title — the rename field pre-fills from the account copy.
              if (typeof data.planId === "string") setSavedPlanId(data.planId);
              if (typeof data.title === "string") {
                setSavedTitle(data.title);
                setNameValue(data.title);
              }
              const inputs = data?.inputs ?? null;
              if (inputs) {
                if (typeof inputs.goal === "string") setGoal(inputs.goal);
                if (typeof inputs.level === "string") setLevel(inputs.level);
                if (typeof inputs.days === "number") setDays(String(inputs.days));
                if (typeof inputs.equipment === "string") setEquipment(inputs.equipment);
                if (typeof inputs.notes === "string") setNotes(inputs.notes);
              }
              restored = true;
            }
          }
        } catch {
          /* offline → localStorage fallback below */
        }
      }
      // Guests always land here; members only when the account copy is
      // absent/failed — the localStorage mirror is the persistence floor.
      if (!cancelled && !restored) {
        const stored = loadGuestPlan("workout");
        if (stored) {
          setPlan(stored.plan as unknown as DemoPlan);
          const inputs = stored.inputs ?? null;
          if (inputs) {
            if (typeof inputs.goal === "string") setGoal(inputs.goal);
            if (typeof inputs.level === "string") setLevel(inputs.level);
            if (typeof inputs.days === "number") setDays(String(inputs.days));
            if (typeof inputs.equipment === "string") setEquipment(inputs.equipment);
            if (typeof inputs.notes === "string") setNotes(inputs.notes);
          }
        }
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  // ── Initial quota readout (guest id only minted in the browser). ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const guestId = profile ? "" : ensureGuestId();
        const url = guestId ? `/api/ai/quota?guestId=${encodeURIComponent(guestId)}` : "/api/ai/quota";
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.plans && typeof data.plans.limit === "number") {
          setQuota({
            used: data.plans.used ?? 0,
            limit: data.plans.limit,
            remaining: data.plans.unlimited ? data.plans.limit : data.plans.remaining ?? 0,
          });
        }
      } catch {
        /* quota chip is best-effort display, never a blocker */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const guestId = profile ? undefined : ensureGuestId() || undefined;
      const res = await fetch("/api/ai/workout-plan-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          level,
          days: Number(days),
          equipment,
          language: isAr ? "ar" : "en",
          notes: notes || undefined,
          guestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (isAr ? "تعذّر التوليد — حاول مرة أخرى." : "Generation failed — try again."));
        // 429 quota-exhausted / 422 shape-drift: the existing plan
        // STAYS rendered (spec: plans never disappear with the quota).
        if (data?.quota) {
          setQuota({
            used: data.quota.used ?? quota?.used ?? 0,
            limit: data.quota.limit ?? quota?.limit ?? 0,
            remaining: data.quota.remaining ?? 0,
          });
        }
        return;
      }
      const newPlan = data.plan as DemoPlan;
      setPlan(newPlan);
      setModel(data.model ?? null);
      setAccountSaved(Boolean(data?.saved));
      // I-4: the auto-save returns the row id + the auto title it wrote —
      // the editable name field appears pre-filled right at save time.
      if (typeof data?.saved?.planId === "string") setSavedPlanId(data.saved.planId);
      if (typeof data?.saved?.title === "string") {
        setSavedTitle(data.saved.title);
        setNameValue(data.saved.title);
      }
      if (data?.quota) {
        setQuota({
          used: data.quota.used ?? 0,
          limit: data.quota.limit ?? 0,
          remaining: data.quota.remaining ?? 0,
        });
      }
      // LocalStorage mirror — guests' primary copy, members' offline
      // cache (the enriched plan — library links survive re-render).
      saveGuestPlan("workout", newPlan as unknown as WorkoutPlan, {
        goal,
        level,
        days: Number(days),
        equipment,
        notes,
      });
    } catch {
      setError(isAr ? "تعذّر التوليد — حاول مرة أخرى." : "Generation failed — try again.");
    } finally {
      setLoading(false);
    }
  };

  // I-4: persist a renamed title (mode:"rename" — ownership-gated,
  // title-only; the plan content is unreachable from this path).
  const renamePlan = async () => {
    const next = nameValue.trim();
    if (!savedPlanId || next.length < 3 || next === savedTitle) return;
    setRenaming(true);
    try {
      const res = await fetch("/api/plans/member-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rename", planId: savedPlanId, title: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setSavedTitle(next);
        toast.success(isAr ? "تم تحديث اسم الخطة" : "Plan name updated");
      } else {
        toast.error(data?.message || data?.error || (isAr ? "تعذر حفظ الاسم" : "Rename failed"));
      }
    } catch {
      toast.error(isAr ? "تعذر حفظ الاسم" : "Rename failed");
    } finally {
      setRenaming(false);
    }
  };

  const quotaChip =
    quota && quota.limit > 0
      ? isAr
        ? `رصيد الشهر: ${quota.remaining} متبقٍ من ${quota.limit}`
        : `This month: ${quota.remaining} of ${quota.limit} left`
      : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "مخطط التمارين بالذكاء الاصطناعي" : "AI Workout Planner"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "ولّد نظاماً تدريبياً أسبوعياً متوازناً في ثوانٍ — مجانًا فورًا."
              : "Generate a balanced weekly split in seconds — free to try, no credit card required."}
          </p>
          <div className="seal-chip mt-4 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--muted-2)]" aria-hidden="true" />
            {isAr ? "مجاني: توليدان شهريًا لكل زائر" : "Free: 2 generations per month for every visitor"}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <ShareButtons
            path="/ai-workout-planner"
            title={isAr ? "مخطط التمارين بالذكاء الاصطناعي — Alkemos" : "AI Workout Planner — Alkemos"}
          />
        </div>

        {/* Trial form */}
        <div className="marble-card mt-8 p-5 md:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="demo-goal" className="text-sm font-medium text-[var(--text)]">
                {isAr ? "هدفك" : "Your goal"}
              </label>
              <select
                id="demo-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
              >
                {goals.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {isAr ? "الهدف يحدد تكرارات التمارين وترتيب الأيام." : "The goal shapes rep ranges and weekly order."}
              </p>
            </div>
            <div>
              <label htmlFor="demo-level" className="text-sm font-medium text-[var(--text)]">
                {isAr ? "مستواك" : "Your level"}
              </label>
              <select
                id="demo-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
              >
                {levels.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {isAr ? "المستوى يحدد حجم التمرين وعدد الحركات." : "Level sets volume and exercise count."}
              </p>
            </div>
            <div>
              <label htmlFor="demo-days" className="text-sm font-medium text-[var(--text)]">
                {isAr ? "أيام التمرين أسبوعياً" : "Training days per week"}
              </label>
              <select
                id="demo-days"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
              >
                {[2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>
                    {isAr ? `${d} أيام` : `${d} days`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {isAr ? "النظام المولّد يطابق هذا الرقم بالضبط." : "The generated split matches this number exactly."}
              </p>
            </div>
            <div>
              <label htmlFor="demo-equipment" className="text-sm font-medium text-[var(--text)]">
                {isAr ? "معداتك" : "Your equipment"}
              </label>
              <select
                id="demo-equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
              >
                {equipments.map((eq) => (
                  <option key={eq.slug} value={eq.slug}>
                    {eq.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {isAr ? "نختار التمارين بما يناسب المعدات المتاحة لديك." : "Exercises are picked to match what you have."}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="demo-notes" className="text-sm font-medium text-[var(--text)]">
              {isAr ? "ملاحظات اختيارية" : "Optional constraints"}
            </label>
            <input
              id="demo-notes"
              type="text"
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAr
                  ? "مثال: أتجنب الضغط على الركبة اليسرى…"
                  : "e.g. avoid loading the left knee…"
              }
              className="mt-1.5 w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={generate}
              disabled={loading}
              className="btn-chrome inline-flex items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : plan ? (
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {loading
                ? isAr ? "جاري التوليد…" : "Generating…"
                : plan
                  ? isAr ? "ولّد نظاماً آخر" : "Generate another split"
                  : isAr ? "ولّد نظامي المجاني" : "Generate my free split"}
            </button>
            {quotaChip && (
              <span className="text-xs font-normal text-[var(--muted-foreground)]" data-testid="quota-chip">
                {quotaChip}
              </span>
            )}
          </div>
          {error && (
            <p className="mt-3 text-sm font-medium text-[#ff3b30]" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* PRIORITY-PAGES Implementation 1 (2026-10-19, audit §A-9 +
            Improvement 1 — owner-approved frame): a real-shape example of
            what generation returns, shown BEFORE the first click — the
            measured decision gap was "best measured demand (14 impr @
            13.93) on the thinnest copy (190 words, zero FAQ)". The split
            below is explicitly labeled illustrative; its movement
            families, set/rep bounds, and the 3-8-exercises-per-day shape
            all mirror the actual generator prompt + validator
            (ai-workout-planner.ts) so the example never promises what the
            tool does not deliver. */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
            {isAr ? "مثال لمخرج توليد حقيقي — قبل أن تضغط" : "An example of a real generated split"}
          </h2>
          <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "تقسيمة توضيحية لمبتدئ بتجهيزة دمبل منزلية و4 أيام — كل يوم باسمه وعضلاته المستهدفة، وكل تمرين بمجموعاته وتكراراته. المخرج الفعلي يتولد من مدخلاتك أنت: هدفك ومستواك وأيامك ومعداتك."
              : "An illustrative split for a beginner with home dumbbells on 4 days — every day named with its target muscles, every exercise with sets and reps. Your real one is generated from your own inputs: goal, level, days, and equipment."}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                dayAr: "اليوم الأول — صدر وترايسبس",
                dayEn: "Day 1 — chest & triceps",
                itemsAr: "بنش برس بالدمبل 4×8-10 · تفتيح دمبل مائل 3×10-12 · ضغط أرضي 3×10-15 · غطس بمسند 3×10-15",
                itemsEn: "Dumbbell bench press 4×8-10 · Incline dumbbell fly 3×10-12 · Push-ups 3×10-15 · Bench dips 3×10-15",
              },
              {
                dayAr: "اليوم الثاني — ظهر وبايسبس",
                dayEn: "Day 2 — back & biceps",
                itemsAr: "تجديف بالدمبل منحنيًا 4×8-10 · رفعة ميتة بالدمبل 3×10-12 · بايسبس دمبل واقفًا 3×10-12 · بايسبس مطرقة 3×10-12",
                itemsEn: "Bent-over dumbbell row 4×8-10 · Dumbbell deadlift 3×10-12 · Standing dumbbell curl 3×10-12 · Hammer curl 3×10-12",
              },
              {
                dayAr: "اليوم الثالث — أرجل",
                dayEn: "Day 3 — legs",
                itemsAr: "سكوات كوبلت 4×10-12 · طعن بالدمبل 3×10-12 لكل رجل · رفعة رومانية بالدمبل 3×10-12 · رفعة سمانة واقفًا 4×15-20",
                itemsEn: "Goblet squat 4×10-12 · Dumbbell lunge 3×10-12 per leg · Dumbbell Romanian deadlift 3×10-12 · Standing calf raise 4×15-20",
              },
              {
                dayAr: "اليوم الرابع — كتف وبطن",
                dayEn: "Day 4 — shoulders & core",
                itemsAr: "ضغط كتف بالدمبل واقفًا 4×8-10 · تفتيح جانبي 3×12-15 · بلانك 3×45-60 ثانية · رفع أرجل معلقًا 3×12-15",
                itemsEn: "Standing dumbbell shoulder press 4×8-10 · Lateral raise 3×12-15 · Plank 3×45-60 sec · Hanging leg raise 3×12-15",
              },
            ].map((d) => (
              <div key={d.dayEn} className="rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                  {isAr ? d.dayAr : d.dayEn}
                </h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {isAr ? d.itemsAr : d.itemsEn}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "وكل حركة مطابقة في مكتبة التمارين تظهر في مخرجك الفعلي بصورتها وتنقل إلى صفحة شرحها الكامل — 868+ تمرينًا بالأداء الصحيح."
              : "In your real output, every movement matched in the exercise library carries its image and links to its full how-to page — 868+ exercises with proper form."}
          </p>
        </section>

        {/* Generated plan — restored across navigation/refresh; stays
            rendered even when the monthly pool is exhausted. */}
        {hydrated && plan && (
          <section aria-live="polite" className="mt-8">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
                {isAr ? "نظامك المولّد لهذا الأسبوع" : "Your generated week"}
              </h2>
              <span className="text-sm text-[var(--muted-foreground)]">
                {isAr ? `${plan.days.length} أيام تمرين` : `${plan.days.length} training days`}
              </span>
            </div>
            {accountSaved && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-2)]">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {isAr ? "محفوظة في حسابك — متاحة من أي جهاز" : "Saved to your account — available on any device"}
              </p>
            )}
            {/* I-4: the editable plan name — the auto title is the
                suggestion; the saved name shows on /plans. */}
            {accountSaved && savedPlanId && (
              <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="plan-name-row">
                <label htmlFor="plan-name" className="text-xs font-medium text-[var(--muted-foreground)]">
                  {isAr ? "اسم الخطة" : "Plan name"}
                </label>
                <input
                  id="plan-name"
                  type="text"
                  maxLength={120}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="w-full max-w-xs rounded-full border border-[var(--edge)] bg-[var(--card)] px-4 py-1.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
                />
                <button
                  type="button"
                  onClick={renamePlan}
                  disabled={renaming || nameValue.trim().length < 3 || nameValue.trim() === savedTitle}
                  className="rounded-full border border-[var(--edge)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {renaming
                    ? isAr ? "جارٍ الحفظ…" : "Saving…"
                    : isAr ? "حفظ الاسم" : "Save name"}
                </button>
              </div>
            )}
            {/* §12.35 — the results use the site's own exercise library:
                matched movements carry the library's real images and link
                into its bilingual pages (868+ exercises). */}
            <p className="mt-1 text-sm font-normal text-[var(--muted-foreground)]">
              {isAr
                ? "الحركات المطابقة في مكتبة التمارين تظهر بصورها من المكتبة وترتبط بصفحة شرحها الكامل — 868+ تمرينًا بالأداء الصحيح."
                : "Movements that match our exercise library carry its images and link to their full how-to pages — 868+ exercises with proper form."}
            </p>
            <div className="mt-4 space-y-4">
              {plan.days.map((day) => (
                <div key={day.name} className="rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">{day.name}</h3>
                    {day.focus && (
                      <span className="text-xs font-normal text-[var(--muted-foreground)]">{day.focus}</span>
                    )}
                  </div>
                  <ul className="mt-2 divide-y divide-[var(--edge)]/60">
                    {day.exercises.map((ex, i) => {
                      const lib = ex.library ?? null;
                      const href = lib ? `${isAr ? "/ar" : ""}/exercises/${lib.slug}` : null;
                      return (
                        <li key={`${ex.name}-${i}`} className="flex items-center gap-3 py-2 text-sm font-normal">
                          {lib && href ? (
                            <>
                              <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden="true">
                                <span className="block h-12 w-12 overflow-hidden rounded-lg border border-[var(--edge)]/60 bg-[var(--card)]">
                                  <ImageWithFallback
                                    src={lib.image}
                                    alt={isAr ? `صورة ${ex.name}` : `${ex.name} illustration`}
                                    width={48}
                                    height={48}
                                    className="h-12 w-12 object-contain"
                                    fallbackSrc={getFallbackSVG(lib.category)}
                                  />
                                </span>
                              </Link>
                              <Link
                                href={href}
                                className="min-w-0 flex-1 text-[var(--text)] underline decoration-[var(--edge)] underline-offset-4 transition-colors hover:decoration-[var(--chrome-edge)]"
                              >
                                {ex.name}
                              </Link>
                            </>
                          ) : (
                            <span className="min-w-0 flex-1 text-[var(--muted-foreground)]">{ex.name}</span>
                          )}
                          <span className="whitespace-nowrap text-[var(--muted-foreground)]" dir="ltr">
                            {ex.sets} × {ex.reps}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "النظام تقدير تعليمي قابل للنسخ — راجع أداء كل حركة على أدائك أنت، وابدأ بأوزان تُتقن بها الشكل الكامل قبل التدرج. نظامك يبقى معك على هذا الجهاز في التنقل والتحديث، ولا يختفي عند استنفاد رصيد الشهر."
                : "This split is a copyable educational estimate — review every movement against your own performance, and start with weights you can own with full form before climbing. Your split stays with you on this device across navigation and refreshes — and never disappears when the month's quota runs out."}
            </p>

            {/* SOFT signup nudge (guests only) — benefits, never a wall. */}
            {!profile && (
              <div className="mt-6 rounded-2xl border border-[var(--chrome-edge)]/50 bg-[var(--card)] p-5">
                <h3 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--text)]">
                  <HardDriveDownload className="h-4 w-4" aria-hidden="true" />
                  {isAr ? "احفظ نظامك في حساب — مجاناً" : "Save your split to a free account"}
                </h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {isAr
                    ? "نظامك الآن محفوظ على هذا الجهاز فقط. بإنشاء حساب مجاني تُحفظ كل خطة تولّدها تلقائيًا في حسابك وتصل إليها من أي جهاز، وتديرها من صفحة خططي. ومع بريميوم يرتفع رصيدك إلى 4 توليدات شهريًا (و8 مع برو) مع الحفظ والإدارة الكاملة."
                    : "Right now your split lives on this device only. Create a free account and every plan you generate is saved to it automatically — reachable from any device and managed from your plans page. Premium lifts your monthly pool to 4 generations (8 with Pro) plus full plan saving and management."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Phase 203 (copy refinement fix 2026-09-15): the auth
                      route has NO /ar mirror BY DESIGN (the page is
                      bilingual via i18n) — the old /ar/auth?mode=signup
                      variant 404'd. One EN path for both locales. */}
                  <Link
                    href="/auth?mode=signup"
                    className="btn-chrome inline-flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {isAr ? "أنشئ حساباً مجانياً" : "Create a free account"}
                  </Link>
                  <Link
                    href={isAr ? "/ar/memberships" : "/memberships"}
                    className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]"
                  >
                    {isAr ? "قارن العضويات" : "Compare memberships"}
                  </Link>
                </div>
              </div>
            )}

            {/* Review invite (SEO-GEO-6.3 §12.22 + §12.24) — generation
                achievement surface, same law as the other tools. */}
            <div className="mt-6">
              <ReviewInviteCard />
            </div>
          </section>
        )}

        {/* AdSense */}
        <AdSenseAd format="auto" />
        <OtherTools current="/ai-workout-planner" />

        {/* Honest explainer */}
        <section className="mt-10 space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              {isAr ? "ماذا يحسّنه التوليد بالذكاء الاصطناعي؟" : "What does AI generation actually add?"}
            </h2>
            <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "معرفة التمارين خطوة أولى؛ أما التحدي فهو تركيبها في أسبوع متوازن يطابق أهدافك ومستواك وأيامك ومعداتك. التوليد يحل مشكلة «من أين أبدأ هذا الأسبوع؟» بوضع نظام كامل أمامك في ثوانٍ — بدل الاعتماد على برنامج عام لم يُصمم لأهدافك. النموذج يلتزم بقواعد صارمة (عدد الأيام يطابق طلبك بالضبط، 3 إلى 8 تمارين لكل يوم، مجموعات وتكرارات معقولة) وكل نظام يُفحص قبل عرضه؛ فإن خرج عن الشكل يُرفض لا يُعرض — ولا يُخصم من رصيدك إلا التوليد الناجح."
                : "Knowing the exercises is step one; the real challenge is assembling them into a balanced week that matches your goals, level, days, and equipment. Generation solves the \"where do I even start this week?\" problem by laying out a complete split in seconds — instead of leaning on a generic program never designed for your goals. The model follows strict rules (the day count matches your request exactly, 3 to 8 exercises per day, sane sets and reps) and every split is validated before display; a drifted one is rejected, never shown — and only successful generations are deducted from your quota."}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              {isAr ? "حدود الاستخدام — وبقية المسارات" : "The usage limits — and the rest of the paths"}
            </h2>
            <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "كل زائر يحصل على توليديْن ناجحيْن شهريًا من رصيده الشهري المجاني — والرصيد يُحسب للتوليد الناجح فقط، وخططك السابقة تبقى متاحة بعد استنفاده. بإنشاء حساب مجاني تُحفظ خططك من أي جهاز؛ ومع بريميوم يرتفع الرصيد إلى 4 توليدات شهريًا (و8 مع برو). للتصفح الجاهز فوراً، برامج التدريب الجاهزة معروضة لكل مستوى وهدف؛ ولكل حركة بشرحها، مكتبة التمارين تضم 868+ تمرينًا — ولنظامك الغذائي، مخطط الوجبات بالذكاء الاصطناعي ينتظر رقم سعراتك."
                : "Every visitor gets 2 successful generations per month from a free monthly allowance — no credit card required, and only successful generations count; your previous plans stay available after the quota runs out. Create a free account and your plans are saved from any device; Premium lifts the pool to 4 generations a month (8 with Pro). For instant browsing, the ready workout programs are laid out for every level and goal; for every movement explained, the exercise library holds 868+ exercises — and for the diet side of your week, the AI meal planner is waiting for your calorie number."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={isAr ? "/ar/programs" : "/programs"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "برامج جاهزة" : "Ready programs"}
              </Link>
              <Link href={isAr ? "/ar/exercises" : "/exercises"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "مكتبة التمارين" : "Exercise library"}
              </Link>
              <Link href={isAr ? "/ar/ai-meal-planner" : "/ai-meal-planner"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "مخطط الوجبات بالذكاء الاصطناعي" : "AI Meal Planner"}
              </Link>
              <Link href={isAr ? "/ar/tools/calorie-calculator" : "/tools/calorie-calculator"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "حاسبة السعرات" : "Calorie calculator"}
              </Link>
              {/* Intent-map audit (2026-09-14, item 8): the planners feed
                  the EVO hub — the reverse leg of the AI-coach cluster. */}
              <Link href={isAr ? "/ar/evo" : "/evo"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "مدرب EVO الذكي" : "EVO AI coach"}
              </Link>
              {/* P0 SEO audit (2026-09-30): the workout-tracker landing page —
                  the plan→progress path this tool feeds. */}
              <Link href={isAr ? "/ar/workout-tracker" : "/workout-tracker"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "تتبّع تقدّمك" : "Track your progress"}
              </Link>
              <Link href={isAr ? "/ar/coaching" : "/coaching"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "التدريب الأونلاين" : "Human coaching"}
              </Link>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              {isAr ? "ملاحظة مهمة حول الصحة والسلامة" : "An important health & safety note"}
            </h2>
            <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "الأنظمة المولّدة عامة لبالغين أصحاء. إن كان لديك ألم أو إصابة — خصوصاً في الظهر أو الركبة أو الكتف — أو وضع صحي مزمن، فالحركات المناسبة لك تُضبط مع مختص يرى ملفك كاملاً؛ استعمل النظام مادة نقاش ممتازة معه لا بديلاً عنه، وأي تمرين يؤلمك اليوم يُستبدل لا يُجاهد."
                : "Generated splits are general guidance for healthy adults. If you live with pain or an injury — especially in the back, knees, or shoulders — or a chronic condition, the right movements for you are set with a professional who sees your full file; use the split as an excellent discussion piece with them, never a replacement — and any exercise that hurts today gets swapped, not fought."}
            </p>
          </div>
        </section>

        {/* PRIORITY-PAGES Implementation 1 (2026-10-19) — the FAQ this
            page never had (audit: 190 words, zero FAQ, on the site's best
            measured demand). Plain visible HTML (no accordion) so the
            answers ship in the server HTML for non-JS crawlers; every
            number verified against src/lib/memberships.ts (unified pool:
            visitor/free 2, premium 4, pro/coaching 8 — success-only
            counting) and ai-workout-planner.ts (3-8 exercises/day). */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
            {isAr ? "أسئلة شائعة حول المخطط" : "Workout planner FAQ"}
          </h2>
          <div className="mt-4 space-y-4">
            {[
              {
                q: isAr ? "هل أحتاج حسابًا لتوليد التقسيمة؟" : "Do I need an account to generate a split?",
                a: isAr
                  ? "لا — كل زائر يحصل على توليدين ناجحين شهريًا بلا تسجيل ولا بطاقة: رصيدك الشهري مجاني من دخولك الأول. والحساب المجاني يجعل كل خطة تولّدها تُحفظ في حسابك وتصل إليها من أي جهاز."
                  : "No — every visitor gets 2 successful generations a month with no signup and no card: your monthly pool is free from your very first visit. A free account saves every plan you generate to your account, reachable from any device.",
              },
              {
                q: isAr ? "هل أحتاج ناديًا؟" : "Do I need a gym?",
                a: isAr ? (
                  <>
                    لا — اختر تجهيزتك عند التوليد: وزن الجسم بلا معدات، أو دمبل منزلي، أو نادٍ كامل، وستُختار الحركات بما يناسبها. وكل حركة مطابقة في{" "}
                    <Link
                      href="/ar/exercises"
                      className="text-[var(--text)] underline decoration-[var(--edge)] underline-offset-4 transition-colors hover:decoration-[var(--chrome-edge)]"
                    >
                      مكتبة التمارين
                    </Link>{" "}
                    (868+ تمرينًا) تظهر بصورتها وتنقل إلى صفحة شرحها الكامل.
                  </>
                ) : (
                  <>
                    No — pick your equipment at generation time: bodyweight only, home dumbbells, or a full gym, and the movements are chosen to match. Every movement matched in the{" "}
                    <Link
                      href="/exercises"
                      className="text-[var(--text)] underline decoration-[var(--edge)] underline-offset-4 transition-colors hover:decoration-[var(--chrome-edge)]"
                    >
                      exercise library
                    </Link>{" "}
                    (868+ exercises) carries its image and links to its full how-to page.
                  </>
                ),
              },
              {
                q: isAr ? "هل التقسيمة مناسبة لمبتدئ؟" : "Is the split suitable for a beginner?",
                a: isAr
                  ? "نعم — اختر «مبتدئ» وسيوزع المولد الحركات الأساسية بأحجام مريحة (3 إلى 8 تمارين لكل يوم). لست متأكدًا من مستواك؟ ابدأ بـ«مبتدئ» — الترقية في التوليد القادم أسهل من العكس، وإن وجدت أسبوعك سهلًا فالمستوى التالي قرارك في المرة التالية."
                  : "Yes — pick \"beginner\" and the generator lays out the foundational movements at comfortable volumes (3 to 8 exercises per day). Not sure about your level? Start with beginner — moving up in your next generation is easier than the reverse, and if the week feels easy, the next level is your call next time.",
              },
              {
                q: isAr ? "كم توليدًا متاحًا؟ وماذا بعد نفاد الرصيد؟" : "How many generations do I get — and what happens when the pool runs out?",
                a: isAr
                  ? "رصيد شهري موحد واحد يجمع خطط التغذية والتمارين معًا: توليدان ناجحان شهريًا لكل زائر بلا حساب، ويرتفع إلى 4 مع بريميوم و8 مع برو والتدريب الأونلاين — ولا يُحتسب إلا التوليد الناجح. بعد نفاد الرصيد تبقى كل خطة ولّدتها مرئية ومتاحة؛ ما يتوقف هو التوليد الجديد حتى يتجدد الرصيد أول الشهر."
                  : "One unified monthly pool covers nutrition and workout plans together: 2 successful generations a month for every visitor with no account, rising to 4 with Premium and 8 with Pro and Coaching — only successful generations count. After the pool runs out, every plan you generated stays visible and accessible; what pauses is new generation until the pool resets on the 1st.",
              },
              {
                q: isAr ? "هل أستطيع تعديل التقسيمة أو طلب غيرها؟" : "Can I change the split or ask for another one?",
                a: isAr
                  ? "نعم — زر «ولّد نظاماً آخر» يولّد تقسيمة جديدة من رصيدك الشهري بمدخلات معدلة إن أردت. ومع الاشتراك يستطيع EVO تبديل تمارين فردية داخل خطتك أسبوعيًا (3 تبديلات مع بريميوم و6 مع برو)، وللتبديل اليدوي الكامل برامج التدريب الجاهزة معروضة لكل مستوى وهدف."
                  : "Yes — the \"Generate another split\" button draws a new split from your monthly pool, with edited inputs if you like. With a subscription, EVO can swap individual exercises inside your plan weekly (3 swaps with Premium, 6 with Pro), and for full manual control the ready workout programs are laid out for every level and goal.",
              },
              {
                q: isAr ? "ما الفرق بين هذه الأداة وبين EVO؟" : "How is this different from EVO?",
                a: isAr ? (
                  <>
                    المخطط يولّد خطة كاملة من نموذج في ثوانٍ؛{" "}
                    <Link
                      href="/ar/evo"
                      className="text-[var(--text)] underline decoration-[var(--edge)] underline-offset-4 transition-colors hover:decoration-[var(--chrome-edge)]"
                    >
                      EVO
                    </Link>{" "}
                    محادثة تكيّف خطتك القائمة وتجيب أسئلتك لحظيًا على مدار الساعة. كثير من المستخدمين يبدأون هنا ثم يكملون مع EVO لحاجاتهم اليومية.
                  </>
                ) : (
                  <>
                    This planner generates a complete plan from a model in seconds;{" "}
                    <Link
                      href="/evo"
                      className="text-[var(--text)] underline decoration-[var(--edge)] underline-offset-4 transition-colors hover:decoration-[var(--chrome-edge)]"
                    >
                      EVO
                    </Link>{" "}
                    is a conversation that adapts your existing plan and answers your questions instantly, around the clock. Many users start here, then keep EVO for the day-to-day.
                  </>
                ),
              },
            ].map((faq) => (
              <div key={faq.q} className="marble-card p-5">
                <h3 className="text-sm font-semibold text-[var(--text)]">{faq.q}</h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}