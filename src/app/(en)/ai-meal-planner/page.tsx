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
import { demoSystemOptions, type DemoPlan } from "@/lib/ai-meal-planner";
import {
  ensureGuestId,
  loadGuestPlan,
  saveGuestPlan,
} from "@/lib/plan-persistence";
import { Loader2, Sparkles, RotateCcw, HardDriveDownload, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * /ai-meal-planner — the AI meal planner page (§12.28 → Phase 183,
 * owner decree 2026-09-13 «البوول الموحد» — spec "Alkemos —
 * Membership & Plan Changes").
 *
 * The bilingual client page behind /ai-meal-planner and its AR mirror
 * /ar/ai-meal-planner (re-export). Generation via
 * /api/ai/meal-plan-demo within the caller's unified monthly pool
 * (guest 2/month — no signup wall; member 2/4/8/8 by tier), counted
 * ONLY on success.
 *
 * PERSISTENCE LAW (the disappearing-plan fix): the generated plan is
 * never "render-only state" anymore —
 *   - GUEST: mirrored to localStorage (plan-persistence.ts) and
 *     re-hydrated on mount, so navigation, food-detail visits, back
 *     buttons, and refreshes all keep the plan. It stays visible even
 *     after the monthly pool is exhausted (plans are data, not quota).
 *   - MEMBER: the route auto-saves to the account (`plans` table) —
 *     hydration prefers the account copy (cross-device), localStorage
 *     stays as the offline cache.
 * The signup nudge for guests is SOFT: benefits only, never a block.
 */

type QuotaInfo = { used: number; limit: number; remaining: number };

export default function AiMealPlannerPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { profile } = useAuth();

  const [calories, setCalories] = useState("2000");
  const [system, setSystem] = useState("balanced");
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

  const systems = demoSystemOptions(isAr ? "ar" : "en");

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
          const res = await fetch("/api/ai/planner-plan?kind=nutrition");
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
                if (typeof inputs.calories === "number") setCalories(String(inputs.calories));
                if (typeof inputs.system === "string") setSystem(inputs.system);
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
        const stored = loadGuestPlan("nutrition");
        if (stored) {
          setPlan(stored.plan);
          const inputs = stored.inputs ?? null;
          if (inputs) {
            if (typeof inputs.calories === "number") setCalories(String(inputs.calories));
            if (typeof inputs.system === "string") setSystem(inputs.system);
            if (typeof inputs.notes === "string") setNotes(inputs.notes);
          }
        }
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]); // re-run when the login state settles

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
      // Guests: stable per-browser id — the server hashes it into the
      // unified-pool ledger key. Members: cookie auth identifies them.
      const guestId = profile ? undefined : ensureGuestId() || undefined;
      const res = await fetch("/api/ai/meal-plan-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calories: Number(calories),
          system,
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
      // cache. Storage failures are swallowed by the lib.
      saveGuestPlan("nutrition", newPlan, {
        calories: Number(calories),
        system,
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
            {isAr ? "مخطط الوجبات بالذكاء الاصطناعي" : "AI Meal Planner"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "ولّد خطة يوم كاملة بالغرامات والسعرات في ثوانٍ — مجانًا فورًا."
              : "Generate a complete day plan in grams and calories in seconds — free to try, no credit card required."}
          </p>
          <div className="seal-chip mt-4 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--muted-2)]" aria-hidden="true" />
            {isAr ? "مجاني: توليدان شهريًا لكل زائر" : "Free: 2 generations per month for every visitor"}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <ShareButtons
            path="/ai-meal-planner"
            title={isAr ? "مخطط الوجبات بالذكاء الاصطناعي — Alkemos" : "AI Meal Planner — Alkemos"}
          />
        </div>

        {/* Trial form */}
        <div className="marble-card mt-8 p-5 md:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="demo-calories" className="text-sm font-medium text-[var(--text)]">
                {isAr ? "سعرات اليوم المستهدفة" : "Daily calorie target"}
              </label>
              <input
                id="demo-calories"
                type="number"
                inputMode="numeric"
                min={1200}
                max={4000}
                step={50}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
                dir="ltr"
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {isAr ? "من 1,200 إلى 4,000 — لا تعرف رقمك؟ " : "From 1,200 to 4,000 — don't know yours? "}
                <Link href={isAr ? "/ar/tools/calorie-calculator" : "/tools/calorie-calculator"} className="underline decoration-[var(--edge)] underline-offset-4 hover:text-[var(--text)]">
                  {isAr ? "حاسبة السعرات" : "the calorie calculator"}
                </Link>
              </p>
            </div>
            <div>
              <label htmlFor="demo-system" className="text-sm font-medium text-[var(--text)]">
                {isAr ? "النظام الغذائي" : "Diet system"}
              </label>
              <select
                id="demo-system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
              >
                {systems.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {isAr ? "أنظمة مطابقة لمكتبة الخطط الغذائية الجاهزة: متوازن، عالي البروتين، كيتو، نباتي." : "The site's own systems — matching the diet plan library: balanced, high-protein, keto, vegetarian."}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="demo-notes" className="text-sm font-medium text-[var(--text)]">
              {isAr ? "ملاحظات اختيارية" : "Optional preferences"}
            </label>
            <input
              id="demo-notes"
              type="text"
              maxLength={200}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAr
                  ? "مثال: بلا منتجات الألبان، سمك مرتين أسبوعياً…"
                  : "e.g. no dairy, fish twice a week…"
              }
              className="mt-1.5 w-full rounded-full border border-[var(--edge)] bg-[var(--card)] px-5 py-2.5 text-sm font-normal outline-none focus:border-[var(--chrome-edge)]"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={generate}
              disabled={loading || !calories}
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
                  ? isAr ? "ولّد خطة أخرى" : "Generate another plan"
                  : isAr ? "ولّد خطتي المجانية" : "Generate my free plan"}
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

        {/* PRIORITY-PAGES Implementation 1 (2026-10-19, audit §A-8 +
            Improvement 1 — owner-approved frame): a concrete example of a
            generated day, shown before the first click. The arithmetic is
            exact and USDA-consistent: 465 + 700 + 835 = 2,000 kcal; item
            kcal within each meal sum to the meal total. The day matches
            the form's DEFAULTS (balanced system, 2,000 kcal) so the
            example never promises what the tool does not deliver; meal
            count (3), the ±20% accuracy gate, and 3-5 meals all mirror
            ai-meal-planner.ts. */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
            {isAr ? "مثال لمخرج توليد حقيقي — قبل أن تضغط" : "An example of a real generated day"}
          </h2>
          <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "يوم كامل بالنظام المتوازن وهدف 2,000 سعرة — الإعداد الافتراضي في النموذج أعلاه. ثلاث وجبات بالغرامات، وسعرات كل صنف مذكورة، والإجمالي يطابق الهدف."
              : "A complete day on the balanced system at a 2,000-calorie target — the form's default above. Three meals in grams, every item's calories listed, and the total lands on the target."}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                mealAr: "الفطور",
                mealEn: "Breakfast",
                kcal: 465,
                itemsAr: "بيض مسلوق 150غ (215) · خبز أسمر 60غ (140) · جبنة قريش 100غ (98) · خيار 100غ (12)",
                itemsEn: "Boiled eggs 150g (215) · wholegrain bread 60g (140) · cottage cheese 100g (98) · cucumber 100g (12)",
              },
              {
                mealAr: "الغداء",
                mealEn: "Lunch",
                kcal: 700,
                itemsAr: "صدر دجاج مشوي 180غ (300) · أرز أبيض مطبوخ 200غ (260) · سلطة خضراء 200غ (50) · زيت زيتون 10غ (90)",
                itemsEn: "Grilled chicken breast 180g (300) · cooked white rice 200g (260) · green salad 200g (50) · olive oil 10g (90)",
              },
              {
                mealAr: "العشاء",
                mealEn: "Dinner",
                kcal: 835,
                itemsAr: "سمك مشوي 250غ (300) · بطاطا حلوة مشوية 300غ (255) · خبز أسمر 60غ (140) · جبنة قريش 50غ (50) · زيت زيتون 10غ (90)",
                itemsEn: "Baked fish 250g (300) · baked sweet potato 300g (255) · wholegrain bread 60g (140) · cottage cheese 50g (50) · olive oil 10g (90)",
              },
            ].map((m) => (
              <div key={m.mealEn} className="rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                    {isAr ? m.mealAr : m.mealEn}
                  </h3>
                  <span className="whitespace-nowrap text-sm font-normal text-[var(--muted-foreground)]" dir="ltr">
                    {m.kcal} kcal
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {isAr ? m.itemsAr : m.itemsEn}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "الإجمالي: 2,000 سعرة بالضبط — وكل خطة مولّدة تُفحص قبل عرضها: يجب أن يقع إجماليها ضمن ±20% من هدفك، وما خرج عن الشكل يُرفض لا يُعرض."
              : "Day total: exactly 2,000 kcal — and every generated plan is validated before display: its total must land within ±20% of your target; a drifted one is rejected, never shown."}
          </p>
        </section>

        {/* Generated plan — restored across navigation/refresh; stays
            rendered even when the monthly pool is exhausted. */}
        {hydrated && plan && (
          <section aria-live="polite" className="mt-8">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
                {isAr ? "خطتك المولّدة لهذا اليوم" : "Your generated day"}
              </h2>
              <span className="text-sm text-[var(--muted-foreground)]" dir="ltr">
                {plan.kcal} kcal
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
            <div className="mt-4 space-y-4">
              {plan.meals.map((meal) => (
                <div key={meal.name} className="rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">{meal.name}</h3>
                    <span className="text-sm text-[var(--muted-foreground)]" dir="ltr">
                      {meal.kcal} kcal
                    </span>
                  </div>
                  <ul className="mt-2 divide-y divide-[var(--edge)]/60">
                    {meal.items.map((item, i) => (
                      <li key={`${item.food}-${i}`} className="flex items-baseline justify-between gap-3 py-1.5 text-sm font-normal">
                        <span className="text-[var(--muted-foreground)]">{item.food}</span>
                        <span className="whitespace-nowrap text-[var(--muted-foreground)]" dir="ltr">
                          {item.grams} g · {item.kcal} kcal
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "الخطة تقدير تعليمي قابل للنسخ — راجعها وعدّل كمياتها على مائدتك، وقِس أثرها بالاتجاه الأسبوعي لا بقراءة يوم. خطتك تبقى معك على هذا الجهاز في التنقل والتحديث، ولا تختفي عند استنفاد رصيد الشهر."
                : "This plan is a copyable educational estimate — review it, adjust the portions to your table, and measure its effect on the weekly trend, not a single reading. Your plan stays with you on this device across navigation and refreshes — and never disappears when the month's quota runs out."}
            </p>

            {/* SOFT signup nudge (guests only) — benefits, never a wall. */}
            {!profile && (
              <div className="mt-6 rounded-2xl border border-[var(--chrome-edge)]/50 bg-[var(--card)] p-5">
                <h3 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--text)]">
                  <HardDriveDownload className="h-4 w-4" aria-hidden="true" />
                  {isAr ? "احفظ خطتك في حساب — مجاناً" : "Save your plan to a free account"}
                </h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {isAr
                    ? "خطتك الآن محفوظة على هذا الجهاز فقط. بإنشاء حساب مجاني تُحفظ كل خطة تولّدها تلقائيًا في حسابك وتصل إليها من أي جهاز، وتديرها من صفحة خططي. ومع بريميوم يرتفع رصيدك إلى 4 توليدات شهريًا (و8 مع برو) مع حفظ وتحميل كامل الخطط."
                    : "Right now your plan lives on this device only. Create a free account and every plan you generate is saved to it automatically — reachable from any device and managed from your plans page. Premium lifts your monthly pool to 4 generations (8 with Pro) plus full plan saving and export."}
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
        <OtherTools current="/ai-meal-planner" />

        {/* Honest explainer */}
        <section className="mt-10 space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              {isAr ? "ماذا يحسّنه التوليد بالذكاء الاصطناعي؟" : "What does AI generation actually add?"}
            </h2>
            <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "حساب السعرات سهل. الصعب هو معرفة ماذا تأكل اليوم. التوليد بالذكاء الاصطناعي يحول هدفك وسعراتك ونظامك الغذائي إلى يوم كامل من الوجبات والكميات — في ثوانٍ."
                : "Counting calories is easy. The hard part is knowing what to eat today. AI generation turns your goal, calories, and diet into a full day of meals and portions — in seconds."}
            </p>
            <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "لا يُخصم من رصيدك إلا التوليد الناجح — وكل خطة تُفحص قبل عرضها؛ فإن خرجت عن الشكل تُرفض لا تُعرض."
                : "Only successful generations are deducted from your quota — every plan is validated before display; a drifted one is rejected, never shown."}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              {isAr ? "حدود الاستخدام — وبقية المسارات" : "The usage limits — and the rest of the paths"}
            </h2>
            <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "كل زائر يحصل على توليديْن ناجحيْن شهريًا من رصيده الشهري المجاني — والرصيد يُحسب للتوليد الناجح فقط. بإنشاء حساب مجاني تبقى خططك محفوظة في حسابك من أي جهاز؛ ومع بريميوم يرتفع الرصيد إلى 4 توليدات شهريًا (و8 مع برو) مع الحفظ والإدارة الكاملة. للتحكم اليدوي بلا أي حد، افتح مخطط الوجبات وابنِ يومك صنفاً صنفاً بإجماليات حية؛ ولتصفح جاهز فوري، مصفوفة خطط الطعام تضم 24 خطة يوم معروضة بالغرامات."
                : "Every visitor gets 2 successful generations per month from a free monthly allowance — no credit card required, and only successful generations count. Create a free account and your plans are saved to it from any device; Premium lifts the pool to 4 generations a month (8 with Pro) with full saving and management. For manual control with no limits at all, open the meal planner and build your day item by item with live totals; for instant browsing, the diet-plan matrix holds 24 complete daily plans laid out in grams."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={isAr ? "/ar/meal-planner" : "/meal-planner"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "المخطط اليدوي الكامل" : "Full manual planner"}
              </Link>
              <Link href={isAr ? "/ar/diet-plan" : "/diet-plan"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "24 خطة جاهزة" : "24 ready-made plans"}
              </Link>
              <Link href={isAr ? "/ar/tools/calorie-calculator" : "/tools/calorie-calculator"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "حاسبة السعرات" : "Calorie calculator"}
              </Link>
              {/* Intent-map audit (2026-09-14, item 8): the planners feed
                  the EVO hub — the reverse leg of the AI-coach cluster. */}
              <Link href={isAr ? "/ar/evo" : "/evo"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "مدرب EVO الذكي" : "EVO AI coach"}
              </Link>
              {/* P0 SEO audit (2026-09-30): the macro-tracker landing page —
                  the targets→meals→results path this tool feeds. */}
              <Link href={isAr ? "/ar/macro-tracker" : "/macro-tracker"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "تتبّع ماكروزك" : "Track your macros"}
              </Link>
              <Link href={isAr ? "/ar/coaching" : "/coaching"} className="rounded-full border border-[var(--edge)] px-4 py-2 text-sm font-normal text-[var(--text)] transition-colors hover:border-[var(--chrome-edge)]">
                {isAr ? "التدريب الأونلاين" : "Human coaching"}
              </Link>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              {isAr ? "تذكير الصحة المعتاد" : "The usual health reminder"}
            </h2>
            <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "الخطط المولّدة عامة لبالغين أصحاء. إن كان لديك وضع صحي مزمن — سكري أو كلى أو حمل أو اضطراب أكل — فالأرقام المناسبة لك تُضبط مع مختص يرى ملفك كاملاً؛ استعمل الخطة مادة نقاش ممتازة معه لا بديلاً عنه."
                : "Generated plans are general guidance for healthy adults. If you live with a chronic condition — diabetes, kidney disease, pregnancy, or an eating disorder — the right numbers for you are set with a professional who sees your full file; use the plan as an excellent discussion piece with them, never a replacement."}
            </p>
          </div>
        </section>

        {/* PRIORITY-PAGES Implementation 1 (2026-10-19, audit §A-8): the
            "four planning paths" orientation — the audit's measured finding
            was that this page (the product's first free-experience gateway)
            never answers the shopper's most common confusion: generator vs
            manual planner vs ready plans vs EVO. Rows mirror the verified
            service set (manual planner: no limits; ready plans: 24; EVO
            swaps: subscription-gated weekly counter). */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
            {isAr ? "أربعة مسارات للتخطيط — أيها يناسبك؟" : "Four ways to plan — which fits you?"}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                titleAr: "المولد (هذه الصفحة)",
                titleEn: "The generator (this page)",
                descAr: "يوم كامل بالغرامات في ثوانٍ — من رصيدك الشهري المجاني (توليدان شهريًا بلا حساب).",
                descEn: "A complete day in grams in seconds — from your free monthly pool (2 a month, no account).",
              },
              {
                titleAr: "المخطط اليدوي",
                titleEn: "The manual planner",
                descAr: "تحكم كامل بلا أي حد: ابنِ يومك صنفًا صنفًا من قاعدة 8,830+ صنفًا بإجماليات حية.",
                descEn: "Full control with no limits at all: build your day item by item from 8,830+ foods with live totals.",
              },
              {
                titleAr: "24 خطة جاهزة",
                titleEn: "24 ready-made plans",
                descAr: "تصفح فوري بالغرامات لكل مستويات السعرات والأنظمة الأربعة — بلا توليد ولا انتظار.",
                descEn: "Instant browsing in grams across every calorie level and all four systems — no generation, no waiting.",
              },
              {
                titleAr: "EVO للتكييف المستمر",
                titleEn: "EVO for continuous adaptation",
                descAr: "مع الاشتراك: تبديل أي وجبة داخل خطتك أسبوعيًا بضغطة واحدة، والنتيجة تُحفظ تلقائيًا.",
                descEn: "With a subscription: swap any meal in your plan weekly in one tap, and the result saves automatically.",
              },
            ].map((path) => (
              <div key={path.titleEn} className="marble-card p-5">
                <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                  {isAr ? path.titleAr : path.titleEn}
                </h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {isAr ? path.descAr : path.descEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PRIORITY-PAGES Implementation 1 (2026-10-19) — the FAQ this
            page never had (audit: 230 words, zero FAQ, the product's
            first free-experience gateway). Plain visible HTML; every
            number verified against memberships.ts (pool 2/4/8/8) and
            ai-meal-planner.ts (3-5 meals, ±20% kcal gate, notes field
            passed as hard constraints). */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
            {isAr ? "أسئلة شائعة حول المخطط" : "Meal planner FAQ"}
          </h2>
          <div className="mt-4 space-y-4">
            {[
              {
                q: isAr ? "هل الخطة المجانية كاملة؟" : "Is the free plan complete?",
                a: isAr
                  ? "نعم — توليدان ناجحان شهريًا لكل زائر بلا حساب، وكل توليد يوم كامل بثلاث إلى خمس وجبات بالغرامات والسعرات. وما ولّدته يبقى على جهازك بدون حساب، ويُحفظ دائمًا بحساب مجاني."
                  : "Yes — two successful generations a month for every visitor with no signup, and each is a complete day of three to five meals in grams and calories. What you generate stays on your device without an account, and is saved permanently with a free one.",
              },
              {
                q: isAr ? "هل الخطة المولدة يوم واحد أم أسبوع؟" : "Is the generated plan one day or a week?",
                a: isAr
                  ? "توليد واحد = يوم كامل بالغرامات والسعرات. تستطيع توليد يوم مختلف في المرة التالية من رصيدك، ومع الاشتراك يستطيع EVO تبديل أي وجبة من خطتك القائمة."
                  : "One generation = one complete day in grams and calories. You can generate a different day next time from your pool, and with a subscription EVO can swap any meal in your existing plan.",
              },
              {
                q: isAr ? "هل يحترم التوليد قيودي الغذائية؟" : "Does it respect my dietary constraints?",
                a: isAr
                  ? "نعم — حقل الملاحظات يمرر قيودك إلى المولد كقيود صريحة يجب احترامها (مثال: بلا منتجات الألبان، سمك مرتين أسبوعيًا). والأنظمة الأربعة جاهزة كذلك: متوازن، عالي البروتين، كيتو، نباتي."
                  : "Yes — the optional-notes field passes your constraints to the generator as explicit rules it must respect (e.g. no dairy, fish twice a week). The four systems are ready too: balanced, high-protein, keto, vegetarian.",
              },
              {
                q: isAr ? "ماذا يحدث بعد نفاد رصيد التوليد؟" : "What happens when the pool runs out?",
                a: isAr
                  ? "تبقى كل خطة ولّدتها مرئية ومتاحة في لوحة خططك — ما يتوقف هو التوليد الجديد فقط، حتى يتجدد رصيدك في أول الشهر."
                  : "Every plan you generated stays visible and accessible in your plans dashboard — only new generation pauses, until your pool resets on the 1st of the next month.",
              },
              {
                q: isAr ? "ما الفرق بين المولد والمخطط اليدوي والخطط الجاهزة؟" : "Generator vs manual planner vs ready plans?",
                a: isAr
                  ? "المولد يخرج يومًا كاملًا في ثوانٍ من رصيدك؛ المخطط اليدوي يعطيك تحكمًا كاملًا بلا حدود؛ والـ24 خطة الجاهزة للتصفح الفوري بالغرامات. القسم أعلاه («أربعة مسارات للتخطيط») يفصلها كلها."
                  : "The generator produces a complete day in seconds from your pool; the manual planner gives you full control with no limits; and the 24 ready-made plans are there for instant browsing in grams. The section above (\"Four ways to plan\") lays them all out.",
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