"use client";

import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageBanner } from "@/components/PageBanner";
import { EngravedIcon } from "@/components/ThemeImg";
import { ShareButtons } from "@/components/ShareButtons";
import {
  MEMBERSHIPS,
  COMPARISON_ROWS,
  translateCell,
  type MembershipTier,
} from "@/lib/memberships";
import { Check } from "lucide-react";

export default function MembershipsPage({ lang: langProp }: { lang?: Lang } = {}) {
  const { lang: ctxLang } = useI18n();
  const lang = langProp ?? ctxLang;
  const isAr = lang === "ar";
  const { profile } = useAuth();

  const tiers = MEMBERSHIPS.filter((m) => !m.separate);
  const coaching = MEMBERSHIPS.find((m) => m.id === "coaching");

  // Compute CTA target per tier:
  //   - Free:   if logged in → /profile,  if logged out → /auth?mode=signup
  //   - Premium/Pro: /checkout?tier=<id>&months=1|12  (checkout requires login)
  const ctaHref = (tierId: MembershipTier, months: 1 | 12) => {
    if (tierId === "free") {
      if (profile) return "/profile";
      return "/auth?mode=signup";
    }
    return `/checkout?tier=${tierId}&months=${months}`;
  };

  const ctaLabel = (tierId: MembershipTier, isAr: boolean) => {
    if (tierId === "free") {
      if (profile) return isAr ? "اذهب لصفحتك" : "Go to your profile";
      return isAr ? "ابدأ التجربة مجانًا" : "Start free";
    }
    return isAr ? "اشترك الآن" : "Subscribe now";
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Owner artwork page banner (Phase 127 — 12 header images are PAGE banners) */}
        <PageBanner section="pricing" className="mb-10" />

        {/* Hero — the Free → Paid positioning ladder (owner directive
            2026-09-13): Free = Experience → Premium = Manage → Pro =
            Adapt & Optimize → Coaching = Human Coach + AI. Copy-only. */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "عضويات Alkemos" : "Alkemos Memberships"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "استخدم المنصة مجانًا مع مجموعة كاملة من الأدوات الأساسية. ثم ارتقِ عندما يكبر استخدامك: بريميوم لإدارة خططك وحفظها، وبرو لتكييفها وتحسينها، والتدريب الأونلاين عندما تريد مدربًا بشريًا يعمل معك، إلى جانب قوة الذكاء الاصطناعي."
              : "Use the platform free with a full set of essential tools. Upgrade when your usage grows: Premium to manage your plans, Pro to adapt & optimize them, Coaching when you want a human coach working with you, alongside the full power of AI."}
          </p>
        </div>

        {/* Pricing cards — redesigned for higher conversion */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {tiers.map((tier) => {
            const isFree = tier.id === "free";
            const isPro = tier.id === "pro";
            const hasYearly = tier.priceYearly !== null && tier.priceYearly !== undefined;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col p-6 md:p-8 transition-transform duration-300 hover:-translate-y-0.5 ${
                  isPro
                    ? "marble-card text-[#F5F5F7] md:scale-105"
                    : "marble-card"
                }`}
                style={
                  isPro
                    ? {
                        backgroundColor: "#0B0B0D",
                        color: "#F5F5F7",
                        border: "2px solid transparent",
                        backgroundImage:
                          "linear-gradient(#0B0B0D, #0B0B0D), linear-gradient(145deg, #FDFDFD 0%, #C9CED3 35%, #878E94 50%, #E6E9EC 70%, #9AA0A6 100%)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                      }
                    : undefined
                }
              >
                {isPro && (
                  <span className="seal-chip absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0B0B0D]" style={{ color: "#F5F5F7", borderColor: "#3A3F45" }}>
                    <EngravedIcon name="laurel" alt="" size={12} className="h-3 w-3" />
                    {isAr ? "موصى بها" : "Recommended"}
                  </span>
                )}

                {/* Tier name + positioning tagline + badge */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight">
                    {isAr ? tier.nameAr : tier.nameEn}
                  </h3>
                  {isFree && (
                    <span className="seal-chip">
                      {isAr ? "مجاني للأبد" : "Free forever"}
                    </span>
                  )}
                </div>
                <p className={`mt-1.5 text-xs font-normal ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}>
                  {isAr ? tier.taglineAr : tier.taglineEn}
                </p>

                {/* Monthly price (always visible) */}
                <div className="mt-5">
                  <p className={`text-xs font-medium ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}>
                    {isAr ? "شهري" : "Monthly"}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className={`text-4xl font-semibold tracking-tight ${isFree ? "" : isPro ? "chrome-text chrome-text-on-dark" : "chrome-text"}`}>
                      {/* chrome-text-on-dark (Phase 198, audit C3): the Pro card is
                          #0B0B0D in BOTH themes — light mode pins the light metal
                          ramp there; Premium keeps the dark-steel ramp. */}
                      {isFree ? (isAr ? "مجاني" : "Free") : `$${tier.priceMonthly!.toFixed(2)}`}
                    </span>
                    {!isFree && (
                      <span className={`text-sm font-normal ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}>
                        /{isAr ? "شهر" : "mo"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Yearly price (shown on the same card when available) */}
                {hasYearly && !isFree && (
                  <div className="marble-card mt-4 p-3" style={isPro ? { backgroundColor: "#141518", color: "#F5F5F7" } : undefined}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isPro ? "text-[#B9BEC4]" : "text-[var(--muted-2)]"}`}>
                        {isAr ? "سنوي" : "Yearly"}
                      </span>
                      <span className="seal-chip">-33%</span>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className={`text-xl font-semibold tracking-tight ${isPro ? "chrome-text chrome-text-on-dark" : "chrome-text"}`}>
                        ${tier.priceYearly!.toFixed(2)}
                      </span>
                      <span className={`text-xs font-normal ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}>
                        /{isAr ? "سنة" : "yr"}
                      </span>
                    </div>
                    <p className={`mt-1 text-[10px] font-normal ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}>
                      ${(tier.priceYearly! / 12).toFixed(2)}/{isAr ? "شهر" : "mo"} {isAr ? "بمعدل" : "avg"}
                    </p>
                  </div>
                )}

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-3">
                  {(isAr ? tier.features : tier.featuresEn).map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isPro ? "text-[#C9CED3]" : "text-[var(--text)]"}`} aria-hidden="true" />
                      <span className="text-sm font-normal">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA buttons — chrome identity (Phase 127) */}
                <div className="mt-6 space-y-2">
                  {isFree ? (
                    <a
                      href={ctaHref(tier.id, 1)}
                      className="btn-outline block w-full px-6 py-3.5 text-center text-sm font-semibold"
                    >
                      {ctaLabel(tier.id, isAr)}
                    </a>
                  ) : (
                    <>
                      {/* Monthly CTA — primary chrome action */}
                      <a
                        href={ctaHref(tier.id, 1)}
                        className="btn-chrome block w-full px-6 py-3.5 text-center text-sm"
                      >
                        {isAr ? `اشترك الآن — $${tier.priceMonthly!.toFixed(2)}/شهر` : `Subscribe now — $${tier.priceMonthly!.toFixed(2)}/mo`}
                      </a>
                      {/* Yearly CTA — secondary */}
                      {hasYearly && (
                        <a
                          href={ctaHref(tier.id, 12)}
                          className={`flex items-center justify-center gap-2 w-full px-6 py-3 text-center text-sm font-semibold ${
                            isPro ? "btn-outline border-[#3A3F45] text-[#F5F5F7]" : "btn-outline"
                          }`}
                        >
                          <span>{isAr ? `سنوي — $${tier.priceYearly!.toFixed(2)}` : `Yearly — $${tier.priceYearly!.toFixed(2)}`}</span>
                          <span className="seal-chip">-33%</span>
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* No-signup trial + UNIFIED SAVE LADDER (owner directive
            2026-09-13): the AI pool is visible as a core free experience,
            the save story is the same three-step ladder everywhere (no
            account → device · free account → permanent save + sync ·
            paid → broader management + per-tier benefits), and the AI
            generation quota stays clearly separated from the Meal-Planner
            save limits. Copy-only. */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm font-normal text-[var(--muted-foreground)]">
          {isAr
            ? "يمكنك تجربة توليد خطط الذكاء الاصطناعي فورًا: بدون حساب تبقى خطتك على جهازك، وبحساب مجاني تُحفظ دائمًا في حسابك وتتزامن عبر أجهزتك، ومع الباقات المدفوعة تحصل على إدارة أوسع ومزايا إضافية حسب باقتك."
            : "You can try AI plan generation instantly: no account keeps your plan on this device, a free account saves it permanently in your account & syncs it across your devices, and paid tiers add broader management and extra benefits per plan."}
        </p>

        {/* PRIORITY-PAGES Implementation 3 (2026-10-19, audit §C-1 +
            Improvement 3 — owner-approved frame): "Which plan fits you?" —
            the buyer's first decision question, unserved by any copy. Four
            honest personas, every number against memberships.ts (unified
            pool 2/4/8/8 · meal-planner saves 1/10/50/50 · saved results
            3/50/200/200 · swaps 3/6 weekly paid · ads Free+Premium only).
            The Free row's "1 nutrition + 1 workout plan a month" is the
            arithmetic of the unified pool (2 combined), never 2+2. */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "أي باقة تناسبك؟" : "Which plan fits you?"}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                tierAr: "مجاني",
                tierEn: "Free",
                fitAr: "تبدأ وتريد أرقامك وخطتك الأولى",
                fitEn: "You're starting and want your numbers and first plan",
                bodyAr: "التوليدان الشهريان يكفيان لخطة تغذية وخطة تمرين كل شهر، ومع EVO 10 رسائل يوميًا. والحساب المجاني يحفظ خططك للأبد ويزامنها عبر أجهزتك.",
                bodyEn: "The 2 monthly generations cover one nutrition plan and one workout plan a month, plus 10 EVO messages a day. A free account keeps your plans forever and syncs them across devices.",
              },
              {
                tierAr: "بريميوم",
                tierEn: "Premium",
                fitAr: "صرت تعدّل وتجرب",
                fitEn: "You're iterating and experimenting",
                bodyAr: "4 توليدات شهريًا ومحادثة غير محدودة و3 تبديلات أسبوعيًا، وسعة أكبر: 10 خطط محفوظة في مخطط الوجبات و50 نتيجة أدوات مع التصدير.",
                bodyEn: "4 generations a month, unlimited chat, and 3 weekly swaps — plus more capacity: 10 saved meal-planner plans and 50 saved tool results with export.",
              },
              {
                tierAr: "برو",
                tierEn: "Pro",
                fitAr: "تتدرب بجدية وتريد تكييفًا أسبوعيًا بلا إعلانات",
                fitEn: "You train seriously and want weekly adaptation, ad-free",
                bodyAr: "8 توليدات و6 تبديلات أسبوعيًا وتحليل أنماط تقدمك، و50 خطة محفوظة و200 نتيجة أدوات، وإعلانات مخفية.",
                bodyEn: "8 generations, 6 weekly swaps, and progress pattern analysis — 50 saved plans, 200 saved tool results, and no ads.",
              },
              {
                tierAr: "التدريب الأونلاين",
                tierEn: "Coaching",
                fitAr: "تريد مدربًا بشريًا يبني خطتك ويتابعك",
                fitEn: "You want a human coach building your plan and following up",
                bodyAr: "مدرب بشري يبني خطط تغذيتك وتمارينك ويجري التبديلات بيده، بمتابعة أسبوعية وتذكير تلقائي — ويشمل كل مزايا برو.",
                bodyEn: "A human coach builds your nutrition and workout plans and makes the swaps personally, with weekly check-ins and automatic reminders — and it includes every Pro feature.",
              },
            ].map((card) => (
              <div key={card.tierEn} className="marble-card p-6">
                <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
                  {isAr ? card.tierAr : card.tierEn}
                </h3>
                <p className="mt-1 text-sm font-medium text-[var(--muted-2)]">
                  {isAr ? card.fitAr : card.fitEn}
                </p>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {isAr ? card.bodyAr : card.bodyEn}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "قاعدة عامة: ابدأ مجانًا، وارتقِ حين يضيق رصيدك أو سعتك — التفاصيل الكاملة في جدول المقارنة والأسعار أعلاه."
              : "Rule of thumb: start free, and move up when your pool or capacity feels tight — the full details are in the comparison table and the prices above."}
          </p>
        </section>

        {/* Refund policy banner */}
        <div className="marble-card mt-12 p-6">
          <div className="flex items-start gap-3">
            <EngravedIcon name="checkseal" alt="" size={26} className="mt-0.5 h-6 w-6 shrink-0" />
            <div>
              <h3 className="text-base font-semibold">
                {isAr ? "سياسة الاسترداد" : "Refund policy"}
              </h3>
              <p className="mt-2 text-sm font-normal text-[var(--muted-foreground)]">
                {isAr
                  ? "نقدم استرداد كامل خلال 7 أيام من تفعيل الاشتراك، بشرط عدم استخدام أي ميزة مدفوعة في الخطة (توليد خطط تغذية/تمارين، تبديلات EVO، حفظ نتائج أدوات، تحميل PDF). بمجرد استخدام أي ميزة مدفوعة، يصبح الاشتراك غير قابل للاسترداد. الاشتراك المجاني لا يتطلب استرداد."
                  : "We offer a full refund within 7 days of subscription activation, provided that no paid plan features have been used (nutrition/workout plan generation, EVO swaps, saved tool results, PDF exports). Once any paid feature is used, the subscription becomes non-refundable. The Free tier requires no refund since it's free forever."}
              </p>
            </div>
          </div>
        </div>

        {/* Coaching — separate section, dark marble band (identity) */}
        {coaching && (
          <div className="marble-card mt-12 p-6 text-[#F5F5F7] md:p-10" style={{ backgroundColor: "#0B0B0D", color: "#F5F5F7" }}>
            <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="seal-chip" style={{ color: "#F5F5F7", borderColor: "#3A3F45" }}>
                    {isAr ? "مدرب بشري" : "Human Coach"}
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {isAr ? coaching.nameAr : coaching.nameEn}
                  </h3>
                </div>
                <p className="mt-3 text-sm font-normal text-[#9BA0A6]">
                  {isAr
                    ? "التدريب الأونلاين مع مدربين محترفين وأخصائيي تغذية: خطط مخصّصة، متابعة أسبوعية، وتبديلات يجريها المدرب بنفسه."
                    : "Human coaching with professional coaches and nutrition specialists: personalized plans, weekly check-ins, and swaps made by your coach."}
                </p>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(isAr ? coaching.features : coaching.featuresEn).map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C9CED3]" aria-hidden="true" />
                      <span className="text-sm font-normal">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 shrink-0 md:ms-8 md:mt-0">
                <a
                  href={isAr ? "/ar/coaching" : "/coaching"}
                  className="btn-chrome inline-flex items-center gap-2 px-8 py-4 text-sm"
                >
                  {isAr ? "ابدأ الآن ›" : "Get Started ›"}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Comparison table */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "مقارنة العضويات" : "Compare all plans"}
          </h2>
          <div className="marble-card mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--tint)]">
                  <th className="p-4 text-start text-xs font-medium text-[var(--muted-foreground)]">
                    {isAr ? "الميزة" : "Feature"}
                  </th>
                  <th className="p-4 text-center text-xs font-medium text-[var(--muted-foreground)]">Free</th>
                  <th className="p-4 text-center text-xs font-semibold text-[var(--text)]">Premium</th>
                  <th className="p-4 text-center text-xs font-semibold text-[var(--text)]">Pro</th>
                  <th className="p-4 text-center text-xs font-medium text-[var(--muted-foreground)]">Coaching</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="border-t border-[var(--edge)]">
                    <td className="p-4 text-start font-medium">{isAr ? row.feature : row.featureEn}</td>
                    <td className="p-4 text-center">
                      {row.free === "✓" ? (
                        <EngravedIcon name="checkseal" alt="" size={20} className="mx-auto h-5 w-5" />
                      ) : row.free === "—" ? (
                        <span className="text-[var(--muted-foreground)] opacity-50" aria-label={isAr ? "غير متاح" : "No"}>×</span>
                      ) : (
                        <span className="text-xs font-normal text-[var(--muted-foreground)]">{translateCell(row.free, isAr)}</span>
                      )}
                    </td>
                    <td className="p-4 text-center" style={{ backgroundColor: "var(--tint)", borderInline: "var(--border-chrome)" }}>
                      {row.premium === "✓" ? (
                        <EngravedIcon name="checkseal" alt="" size={20} className="mx-auto h-5 w-5" />
                      ) : row.premium === "—" ? (
                        <span className="text-[var(--muted-foreground)] opacity-50" aria-label={isAr ? "غير متاح" : "No"}>×</span>
                      ) : (
                        <span className="text-xs font-medium text-[var(--muted-2)]">{translateCell(row.premium, isAr)}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.pro === "✓" ? (
                        <EngravedIcon name="checkseal" alt="" size={20} className="mx-auto h-5 w-5" />
                      ) : row.pro === "—" ? (
                        <span className="text-[var(--muted-foreground)] opacity-50" aria-label={isAr ? "غير متاح" : "No"}>×</span>
                      ) : (
                        <span className="text-xs font-medium">{translateCell(row.pro, isAr)}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.coaching === "✓" ? (
                        <EngravedIcon name="checkseal" alt="" size={20} className="mx-auto h-5 w-5 opacity-70" />
                      ) : row.coaching === "—" ? (
                        <span className="text-[var(--muted-foreground)] opacity-50" aria-label={isAr ? "غير متاح" : "No"}>×</span>
                      ) : (
                        <span className="text-xs font-medium text-[var(--muted-2)]">{translateCell(row.coaching, isAr)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Unified-pool clarity + the AI-quota vs save-limits separation
              (owner directive 2026-09-13) — the two numbers most easily
              confused are actually two different budgets. */}
          <p className="mx-auto mt-4 max-w-2xl text-center text-xs font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "توليد خطط الذكاء الاصطناعي يسحب من رصيد شهري موحد واحد (التغذية والتمارين معًا، ويُحتسب التوليد الناجح فقط، ويتجدد في أول كل شهر) — وهذا الرصيد منفصل تمامًا عن حدود حفظ مخطط الوجبات وحفظ نتائج الأدوات."
              : "AI plan generation draws from ONE unified monthly pool (nutrition + workout combined, success-only counting, resets on the 1st) — and it is completely separate from the Meal-Planner save limits and the tool-results save limits."}
          </p>
          {/* Phase 195 (owner directive): «Swaps» alone could read as a full
              plan regeneration — the limits row above means MEAL/EXERCISE
              swaps inside the existing plan, never a regeneration. */}
          <p className="mx-auto mt-2 max-w-2xl text-center text-xs font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "«التبديلات» تعني استبدال وجبات أو تمارين فردية داخل خطتك دون إعادة إنشاء الخطة كاملة — وهي أسبوعية وتتجدد كل يوم اثنين."
              : "“Swaps” means replacing individual meals or exercises within your plan — never a full plan regeneration. They are weekly and reset every Monday."}
          </p>
          {/* Access-point fix (2026-09-14): the /compare vertical had ZERO
              UI access points — a natural contextual bridge from the
              plan-comparison table to the platform-comparisons library
              (Alkemos vs MyFitnessPal / Freeletics / ExRx.net). */}
          <div className="mt-8 text-center">
            <a
              href={isAr ? "/ar/compare" : "/compare"}
              className="btn-outline inline-flex items-center gap-2 px-6 py-3 text-sm"
            >
              {isAr ? "قارن Alkemos مع المنصات الأخرى" : "Compare Alkemos with other platforms"}
              <span className="rtl:rotate-180">›</span>
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "أسئلة شائعة" : "Common questions"}
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-4">
            {[
              {
                q: isAr ? "هل يمكنني الإلغاء في أي وقت؟" : "Can I cancel anytime?",
                a: isAr
                  ? "نعم — من صفحة حسابك اضغط «إلغاء الاشتراك». لا يوجد خصم تلقائي؛ تبقى باقتك فعّالة حتى نهاية المدة التي دفعتها ثم تنتهي إن لم تُجدّدها."
                  : "Yes — on your account page press “Cancel subscription”. Nothing auto-renews: your plan stays active until the period you paid for ends, then simply stops unless you pay again.",
              },
              {
                q: isAr ? "هل توجد سياسة استرداد؟" : "Is there a refund policy?",
                a: isAr
                  ? "نعم، استرداد كامل خلال 7 أيام من التفعيل بشرط عدم استخدام المميزات المدفوعة (توليد خطط، تبديلات، حفظ نتائج)."
                  : "Yes, full refund within 7 days of activation, provided no paid features (plan generation, swaps, saved results) have been used.",
              },
              {
                q: isAr ? "هل التدريب الأونلاين مشمول في Pro؟" : "Is coaching included in Pro?",
                a: isAr
                  ? "لا، التدريب الأونلاين منفصل تماماً عن العضويات: Pro يمنحك مزايا المنصة، والتدريب الأونلاين يمنحك مدربًا بشريًا يتابعك شخصيًا."
                  : "No, coaching is completely separate from memberships. Pro gives you platform features, coaching gives you a human coach.",
              },
              {
                q: isAr ? "هل توجد تجربة مجانية؟" : "Is there a free trial?",
                a: isAr
                  ? "التجربة نفسها مجانية ودائمة: افتح مخطط التمارين أو مخطط الوجبات بالذكاء الاصطناعي وولّد خطتك الأولى فورًا (توليدان ناجحان شهريًا لكل زائر، ويُحفظ ما تولّده بحساب مجاني). لا يوجد اشتراك تجريبي مؤقت — الفئة المجانية مجانية للأبد."
                  : "The trial IS the product: open the AI Workout or AI Meal Planner and generate your first plan instantly (2 successful generations per month for every visitor; a free account saves them permanently). There is no temporary trial subscription — the Free tier is free forever.",
              },
              {
                q: isAr ? "ما هي طرق الدفع؟" : "Payment methods?",
                a: isAr ? "PayPal (الطريقة الرئيسية — فورية وآمنة)، InstaPay، و Vodafone Cash. PayPal يعالج الدفع تلقائياً؛ الطرق اليدوية تتطلب رفع إيصال يراجعه الفريق خلال 24 ساعة." : "PayPal (primary — instant and secure), InstaPay, and Vodafone Cash. PayPal processes automatically; manual methods require uploading a receipt reviewed within 24 hours.",
              },
              // PRIORITY-PAGES Implementation 3 (2026-10-19, audit §C-1):
              // the two lifecycle questions the page never answered —
              // what happens to my plans, and can I change tiers. Facts:
              // plans are data, not quota (plan-persistence law — they
              // stay visible/accessible); no auto-renew (existing cancel
              // answer); limits derive from the ACTIVE tier
              // (membership-tier.ts) so a mid-cycle upgrade applies its
              // higher limits immediately.
              {
                q: isAr ? "ماذا يحدث لخططي إذا انتهى اشتراكي؟" : "What happens to my plans when my subscription ends?",
                a: isAr
                  ? "تبقى كل خطة ولّدتها أو حفظتها مرئية ومتاحة كما هي — الخطط بيانات لا رصيدًا. ما يعود إلى حدود الفئة المجانية هو التوليد الجديد وعدد التبديلات حتى تجدد. ولا خصم تلقائي: تبقى باقتك فعّالة حتى نهاية المدة المدفوعة ثم تنتهي."
                  : "Every plan you generated or saved stays visible and accessible as-is — plans are data, not quota. What returns to the free-tier limits is new generation and swap counts, until you renew. And there's no auto-charge: your plan stays active until the paid period ends, then simply stops.",
              },
              {
                q: isAr ? "هل أستطيع تغيير الباقة لاحقًا؟" : "Can I change my plan later?",
                a: isAr
                  ? "نعم، بلا أي التزام: لا تجديدًا تلقائيًا ولا عقودًا — ففي الدورة التالية اختر أي باقة أو ابقَ على المجاني. والترقية في أي لحظة تجعل حدود الباقة الأعلى سارية فورًا لأن الحدود تُشتق من باقتك الفعّالة."
                  : "Yes, with no commitment: nothing auto-renews and there are no contracts — next cycle, pick any tier or stay on Free. And upgrading at any moment applies the higher tier's limits immediately, because limits derive from your active tier.",
              },
            ].map((faq, i) => (
              <div key={i} className="marble-card p-5">
                <h3 className="text-sm font-semibold">{faq.q}</h3>
                <p className="mt-1.5 text-sm font-normal text-[var(--muted-foreground)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Share */}
        <div className="marble-card mt-8 flex items-center justify-between gap-4 p-4">
          <p className="text-sm font-medium">
            {isAr ? "شارك صفحة العضويات" : "Share memberships page"}
          </p>
          <ShareButtons path="/memberships" title={isAr ? "عضويات Alkemos" : "Alkemos Memberships"} />
        </div>
      </main>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}