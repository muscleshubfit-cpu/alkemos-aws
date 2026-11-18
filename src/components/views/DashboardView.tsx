"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useNav } from "@/hooks/use-nav";
import { MyCoachCard } from "@/components/MyCoachCard";
import { listProgress, listPlans, listSubscriptionsForClient, getQuestionnaire } from "@/lib/data";
import { getQuestionnaireStatus } from "@/lib/data/questionnaires";
import type { ProgressEntry, Plan, Subscription } from "@/lib/supabase/types";
import { supabase, isSupabaseConfigured } from "@/lib/data/helpers";
import { coachPaymentMethodLabel } from "@/lib/coach-limits";
import { getTier, type TierId } from "@/lib/plans";
import { MEMBERSHIPS } from "@/lib/memberships";
import { daysLeftOn, effectiveSubStatus } from "@/lib/subscription-view";
import { weightSummary } from "@/lib/weight-summary";
// NOTIF-I18N-250: numbers and dates speak the ACTIVE UI language —
// the AR mirror renders Arabic-Indic digits (same law as the admin
// dashboard), instead of Latin digits + US date order.
import { formatDateFor, formatNumberFor } from "@/lib/format-locale";

// Phase 247 — the member's health numbers (BMI/body-fat/health score) are
// already computed locale-aware (M-2026) and proven on the staff side; the
// member's own dashboard was the poorer surface. Dynamically imported so
// the dashboard's first paint stays lean.
const HealthMetricsDashboard = dynamic(
  () => import("@/components/HealthMetricsDashboard").then((m) => m.HealthMetricsDashboard),
  { ssr: false, loading: () => null },
);

// Deep-link handshake with ProgressView: the dashboard's «سجّل وزن اليوم»
// opens the add-entry dialog directly (it used to be two clicks deep).
const PROGRESS_OPEN_ADD_KEY = "alkemos.progress.openAdd";

export function DashboardView() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { navigate } = useNav();
  const isAr = lang === "ar";
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allSubs, setAllSubs] = useState<Subscription[]>([]);
  // 0034: coach-activated receipts — subscription_id → payment row. The
  // client sees «مفعّلة بواسطة مدربك» on subscriptions his coach activated
  // after collecting payment outside the site.
  type CoachPayRow = {
    subscription_id: string | null;
    amount: number | null;
    currency: string;
    method: string;
    note: string | null;
    created_at: string;
  };
  const [coachPays, setCoachPays] = useState<Record<string, CoachPayRow>>({});
  const [loading, setLoading] = useState(true);
  // Phase 247 (honest-degradation law): a failed load used to render as a
  // silently EMPTY account — indistinguishable from a fresh signup. Now the
  // member gets an honest error card with a retry.
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Nutrition questionnaire full row (status for the strip + data for the
  // health panel); fitness needs its STATUS only for the strip.
  const [nutriQ, setNutriQ] = useState<Awaited<ReturnType<typeof getQuestionnaire>>>(null);
  const [fitQStatus, setFitQStatus] = useState<
    "draft" | "submitted" | "approved" | "needs_info" | null
  >(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const [p, pl, subs, nq, fqStatus] = await Promise.all([
          listProgress(profile.id),
          listPlans(profile.id),
          listSubscriptionsForClient(profile.id),
          getQuestionnaire(profile.id, "nutrition").catch(() => null),
          getQuestionnaireStatus(profile.id, "fitness").catch(() => null),
        ]);
        if (cancelled) return;
        setProgress(p);
        setPlans(pl);
        setAllSubs(subs);
        setNutriQ(nq);
        setFitQStatus(fqStatus);
        // Coach-payment receipts (RLS: client reads only his own rows).
        if (isSupabaseConfigured && supabase && subs.length > 0) {
          const { data: pays } = await supabase
            .from("coach_payments")
            .select("subscription_id, amount, currency, method, note, created_at")
            .eq("client_id", profile.id);
          const map: Record<string, CoachPayRow> = {};
          for (const row of (pays as CoachPayRow[] | null) ?? []) {
            if (row?.subscription_id) map[row.subscription_id] = row;
          }
          setCoachPays(map);
        }
      } catch (e) {
        console.error("[DashboardView] load failed:", e);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, reloadKey]);

  if (loading)
    return (
      <div className="space-y-12">
        <div>
          <div className="h-9 w-64 animate-pulse rounded-xl bg-[#f5f5f7]" />
          <div className="mt-3 h-4 w-40 animate-pulse rounded bg-[#f5f5f7]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-[#f5f5f7]" />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-[#f5f5f7]" />
      </div>
    );

  if (loadError)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[#ff9500]/30 bg-[#ff9503]/[0.04] p-8 text-center">
        <p className="text-base font-medium">{t("dash.errorLoad")}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-4 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90"
        >
          {t("dash.retry")}
        </button>
      </div>
    );

  const weight = weightSummary(progress);

  // Phase 247 — needs-attention strip (the member-side twin of the admin
  // dashboard's law): appears ONLY when something genuinely needs the
  // member, and stays silent at zero. Expiring/expired subscriptions and a
  // coach-requested questionnaire edit used to render with the same grey
  // weight as a plan count.
  const activeSubs = allSubs.filter((s) => effectiveSubStatus(s) === "active");
  const expiredSubs = allSubs.filter((s) => effectiveSubStatus(s) === "expired");
  const soonestDays = activeSubs.reduce<number | null>((min, s) => {
    const d = daysLeftOn(s.end_date);
    return d === null ? min : min === null ? d : Math.min(min, d);
  }, null);
  const expiringSoon = soonestDays !== null && soonestDays <= 14;
  const expiredOnly = activeSubs.length === 0 && expiredSubs.length > 0;
  const needsInfo = nutriQ?.status === "needs_info" || fitQStatus === "needs_info";

  // First-run guidance: a brand-new member saw «Not set», a buy button and
  // two "0 plans" tiles that read as broken. The actual unlock chain is
  // questionnaire → weight → plan appears.
  const firstRun = plans.length === 0 && progress.length === 0;
  const questionnaireDone =
    !!nutriQ &&
    nutriQ.status !== "draft" &&
    nutriQ.status !== "needs_info";
  const weightDone = progress.length > 0;
  const questionnairePending =
    !nutriQ ||
    !fitQStatus ||
    nutriQ.status === "draft" ||
    nutriQ.status === "needs_info" ||
    fitQStatus === "draft" ||
    fitQStatus === "needs_info";

  const openWeightAdd = () => {
    try {
      sessionStorage.setItem(PROGRESS_OPEN_ADD_KEY, "1");
    } catch {
      /* private mode — the navigation alone still works */
    }
    navigate("progress");
  };

  // CTA-CRAWLABILITY (2026-11-19): every attention CTA was pure
  // navigation → the list now carries the REAL href and renders <Link>s
  // (language-aware for the public memberships target — the exact URL
  // navigate() mirrored to). Byte-faithful behavior, crawlable surface.
  const attentionItems: Array<{
    key: string;
    emoji: string;
    title: string;
    sub: string;
    cta: string;
    href: string;
  }> = [];
  if (expiringSoon && soonestDays !== null) {
    attentionItems.push({
      key: "expiring",
      emoji: "⏳",
      title:
        soonestDays <= 0
          ? isAr
            ? "اشتراكك ينتهي اليوم"
            : "Your subscription ends today"
          : isAr
            ? `اشتراكك ينتهي خلال ${soonestDays} ${soonestDays === 1 ? "يوم" : soonestDays === 2 ? "يومين" : soonestDays <= 10 ? "أيام" : "يوم"}`
            : `Your subscription ends in ${soonestDays} day${soonestDays === 1 ? "" : "s"}`,
      sub: isAr ? "جدّد الآن للحفاظ على خططك ومتابعتك" : "Renew now to keep your plans and tracking",
      cta: t("dash.renewNow"),
      href: isAr ? "/ar/memberships" : "/memberships",
    });
  }
  if (expiredOnly) {
    attentionItems.push({
      key: "expired",
      emoji: "⚠️",
      title: isAr ? "انتهى اشتراكك" : "Your subscription has expired",
      sub: isAr ? "جدّد لاستعادة خططك ومتابعة نتائجك" : "Renew to restore your plans and tracking",
      cta: t("dash.renewNow"),
      href: isAr ? "/ar/memberships" : "/memberships",
    });
  }
  if (needsInfo) {
    attentionItems.push({
      key: "needs_info",
      emoji: "📋",
      title: isAr ? "مطلوب تحديث استبيانك" : "Your questionnaire needs updates",
      sub: isAr
        ? "مدربك طلب تعديلًا على إجاباتك — حدِّثها ليكتمل إعداد خطتك"
        : "Your coach asked for edits — update your answers so your plan can be finalized",
      cta: t("dash.openQuestionnaires"),
      href: "/questionnaires",
    });
  }

  const tierName = (tier: string) => {
    const m = MEMBERSHIPS.find((x) => x.id === tier);
    if (m) return isAr ? m.nameAr : m.nameEn;
    const legacy = getTier(tier as TierId);
    if (legacy) return t(legacy.nameKey);
    return tier;
  };

  // CTA-CRAWLABILITY (2026-11-19): quick actions split — the weight-log
  // entry keeps its <button> (it writes sessionStorage then navigates —
  // functional), the pure-navigation entries carry real hrefs → <Link>s.
  const quickActions: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }> = [
    { label: t("dash.logWeightToday"), onClick: openWeightAdd },
    // The questionnaires entry is daily-use only while something is still
    // open (draft / needs_info / never filled) — the Phase 142 law keeps the
    // full navigation map in the sidebar.
    ...(questionnairePending
      ? [{ label: t("dash.fillQuestionnaires"), href: "/questionnaires" }]
      : []),
    { label: t("dash.viewPlans"), href: "/plans" },
    // Phase 246 (owner: dashboards of ALL account types): support stays —
    // a member with a billing or coaching question must not need to know
    // /support exists.
    { label: t("nav.support"), href: "/support" },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("dash.greeting")}, {profile?.full_name || t("common.welcome")}
        </h1>
        <p className="mt-2 text-base font-normal text-[#6e6e73] md:text-lg">
          {t("dash.statsOverview")}
        </p>
      </div>

      {/* Needs-attention strip — conditional, silent at zero (admin law) */}
      {attentionItems.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {attentionItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-[#ff9500]/30 bg-[#ff9503]/[0.06] p-4 text-start transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <span>
                  <span className="block font-medium">{item.title}</span>
                  <span className="text-xs text-[#6e6e73]">{item.sub}</span>
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-[#c77700] transition-transform group-hover:translate-x-0.5 rtl:rotate-180">
                {item.cta} ›
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* First-run guidance — replaces the broken-feeling «0 plans» dead end */}
      {firstRun && (
        <div className="rounded-3xl bg-[#f5f5f7] p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{t("dash.startHere")}</h2>
          <p className="mt-1 text-sm font-normal text-[#6e6e73]">{t("dash.startSub")}</p>
          <ol className="mt-5 space-y-3">
            {[
              { done: questionnaireDone, label: t("dash.step1") },
              { done: weightDone, label: t("dash.step2") },
              { done: false, label: t("dash.step3") },
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    step.done ? "bg-[#34c759] text-white" : "bg-white text-[#6e6e73] ring-1 ring-[#d2d2d7]"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </span>
                <span className={`text-sm ${step.done ? "text-[#6e6e73] line-through" : "font-medium"}`}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
          {!questionnaireDone && (
            <Link
              href="/questionnaires"
              className="mt-5 rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90"
            >
              {t("dash.startCta")}
            </Link>
          )}
        </div>
      )}

      {/* Stat cards — Apple-style minimal; one honest status per row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Subscription — show ALL subscriptions with their honest status */}
        <div className="rounded-2xl bg-[#f5f5f7] p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal uppercase tracking-wide text-[#6e6e73]">
              {t("dash.subscription")}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {allSubs.length > 0 ? (
              allSubs.map((s) => {
                const status = effectiveSubStatus(s);
                const days = status === "active" ? daysLeftOn(s.end_date) : null;
                const pay = coachPays[s.id];
                return (
                  <div key={s.id} className="flex items-center justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          s.tier === "premium" ? "bg-[#0071e3]/10 text-[#0071e3]"
                          : s.tier === "pro" ? "bg-[#1d1d1f]/10 text-[#1d1d1f]"
                          : s.tier === "coaching" ? "bg-[#8b5cf6]/10 text-[#8b5cf6]"
                          : "bg-[#6e6e73]/10 text-[#6e6e73]"
                        }`}>
                          {tierName(s.tier)}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          status === "active"
                            ? "bg-[#34c759]/10 text-[#34c759]"
                            : "bg-[#ff3b30]/10 text-[#ff3b30]"
                        }`}>
                          {status === "active" ? t("dash.active") : t("dash.expired")}
                        </span>
                      </div>
                      {days !== null && (
                        <p className={`mt-1 text-xs font-normal ${days <= 14 ? "font-medium text-[#ff9500]" : "text-[#6e6e73]"}`}>
                          {formatNumberFor(days, lang)} {t("dash.daysLeft")}
                        </p>
                      )}
                      {pay && (
                        <p className="mt-0.5 text-[10px] font-medium text-[#34c759]">
                          {isAr ? "مفعّلة بواسطة مدربك" : "Activated by your coach"}
                          {pay.method ? ` · ${coachPaymentMethodLabel(pay.method, isAr ? "ar" : "en")}` : ""}
                          {pay.amount != null ? ` · ${Number(pay.amount).toLocaleString()} ${pay.currency || "USD"}` : ""}
                        </p>
                      )}
                      <Link
                        href={isAr ? "/ar/memberships" : "/memberships"}
                        className="mt-1 text-[10px] font-normal text-[#0071e3] transition-opacity hover:opacity-70"
                      >
                        {t("dash.renew")} ›
                      </Link>
                    </div>
                    {s.end_date && (
                      <p className="text-[10px] text-[#6e6e73]">
                        {formatDateFor(s.end_date, lang)}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <>
                <p className="text-lg font-semibold">{t("dash.notSet")}</p>
                <Link
                  href={isAr ? "/ar/memberships" : "/memberships"}
                  className="mt-3 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-normal text-white transition-opacity hover:opacity-90"
                >
                  {t("pricing.cta")}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Weight — one delta law shared with ProgressView (weight-summary) */}
        <div className="rounded-2xl bg-[#f5f5f7] p-6">
          <span className="text-xs font-normal uppercase tracking-wide text-[#6e6e73]">
            {t("dash.latestWeight")}
          </span>
          {weight?.latest ? (
            <>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {formatNumberFor(weight.latest, lang)}
                <span className="ml-1 text-base font-normal text-[#6e6e73]">{t("common.kg")}</span>
              </p>
              {weight.delta !== null && weight.delta !== 0 && (
                <p
                  className={`mt-1 text-xs font-normal ${
                    weight.direction === "down" ? "text-[#34c759]" : "text-[#ff9500]"
                  }`}
                >
                  {weight.direction === "down" ? "↓" : "↑"} {formatNumberFor(Math.abs(weight.delta), lang, { maximumFractionDigits: 1 })}{" "}
                  {t("common.kg")} {t("dash.change")}
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-sm font-normal text-[#6e6e73]">{t("dash.noWeight")}</p>
          )}
        </div>

        {/* Meal plans — the «View plans ›» link only earns its place when
            there is something to view (the old 0-count tile read as broken
            and duplicated the same link three times on one screen) */}
        <div className="rounded-2xl bg-[#f5f5f7] p-6">
          <span className="text-xs font-normal uppercase tracking-wide text-[#6e6e73]">
            {t("dash.mealPlans")}
          </span>
          <p className="mt-4 text-3xl font-semibold tracking-tight">
            {formatNumberFor(plans.filter((p) => p.type === "meal").length, lang)}
          </p>
          {plans.some((p) => p.type === "meal") && (
            <Link
              href="/plans"
              className="mt-2 text-xs font-normal text-[#0071e3] transition-opacity hover:opacity-70"
            >
              {t("dash.viewPlans")} ›
            </Link>
          )}
        </div>

        {/* Workout plans */}
        <div className="rounded-2xl bg-[#f5f5f7] p-6">
          <span className="text-xs font-normal uppercase tracking-wide text-[#6e6e73]">
            {t("dash.workoutPlans")}
          </span>
          <p className="mt-4 text-3xl font-semibold tracking-tight">
            {formatNumberFor(plans.filter((p) => p.type === "workout").length, lang)}
          </p>
          {plans.some((p) => p.type === "workout") && (
            <Link
              href="/plans"
              className="mt-2 text-xs font-normal text-[#0071e3] transition-opacity hover:opacity-70"
            >
              {t("dash.viewPlans")} ›
            </Link>
          )}
        </div>
      </div>

      {/* MULTI-COACH 2B: the client's assigned coach (hidden until assigned).
          Phase 247: moved BELOW the numbers so its late pop-in never
          displaces them — numbers first, exactly like the admin dashboard. */}
      <MyCoachCard />

      {/* The member's own health numbers — the same panel his coach sees
          (staff side), locale-aware since M-2026. Only with data. */}
      {progress.length > 0 && (
        <HealthMetricsDashboard
          progress={progress}
          questionnaire={(nutriQ?.data ?? null) as Record<string, unknown> | null}
          lang={lang}
        />
      )}

      {/* Quick actions — daily-use cards, not a second sidebar */}
      <div>
        <h2 className="mb-6 text-xl font-semibold tracking-tight md:text-2xl">
          {t("dash.quickActions")}
        </h2>
        <div className="divide-y divide-[#d2d2d7] rounded-2xl bg-[#f5f5f7]">
          {quickActions.map((action) =>
            action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className="flex w-full items-center justify-between px-6 py-5 text-start transition-colors hover:bg-[#ececf0]"
              >
                <span className="text-base font-normal md:text-lg">{action.label}</span>
                <span className="text-[#6e6e73]">›</span>
              </Link>
            ) : (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex w-full items-center justify-between px-6 py-5 text-start transition-colors hover:bg-[#ececf0]"
              >
                <span className="text-base font-normal md:text-lg">{action.label}</span>
                <span className="text-[#6e6e73]">›</span>
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
