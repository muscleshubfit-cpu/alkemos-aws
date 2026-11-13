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
// BILINGUAL-CONTENT Phase 2 (2026-11-04, audit §3 item 2-أ): the FAQ now
// renders from the single source src/lib/memberships-faq.ts (the
// coaching-faq.ts precedent) so both language layouts can emit the SAME
// Q&A as FAQPage JSON-LD in the server HTML. Texts moved verbatim (one
// verified fix: AR q3 «Pro» → «برو» — the audit's Latin-mixing law أ-2).
import { MEMBERSHIPS_FAQ } from "@/lib/memberships-faq";
import { EgpTwin } from "@/components/egp/EgpTwin";
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
      if (profile) return isAr ? "اذهب إلى صفحتك" : "Go to your profile";
      return isAr ? "ابدأ مجانًا" : "Start free";
    }
    // BILINGUAL-CONTENT Phase 2 (owner order: «وحّد أزرار الاشتراك بإزالة
    // «الآن» دون إضعاف الدعوة للاشتراك»): the pressure word «الآن»/"now"
    // is retired from the subscription CTAs — one editorial law for every
    // surface, matching the /coaching precedent (AR-COPY-REWRITE-287).
    return isAr ? "اشترك" : "Subscribe";
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Owner artwork page banner (Phase 127 — 12 header images are PAGE banners) */}
        <PageBanner section="pricing" className="mb-10" />

        {/* Hero — the Free → Paid positioning ladder (owner directive
            2026-09-13): Free = Experience → Premium = Manage → Pro =
            Adapt & Optimize → Coaching = Personal Coach + AI. Copy-only.
            CONVERSION-2026 (competitor study §2): opens with the buyer's
            felt problem (a generic template that doesn't know their body
            or week) before the ladder — the Trainwell/Freeletics arc
            (problem → solution → progression), copy-only. */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            {isAr ? "عضويات Alkemos" : "Alkemos Memberships"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base font-normal text-[var(--muted-foreground)] md:text-lg">
            {/* AR-COPY-REWRITE-287 (owner order 2026-11-04 «إعادة تحرير
                المحتوى العربي»): native MSA re-authoring of the same
                problem-first ladder (CONVERSION-2026 D1+D2 kept) — EN twin
                untouched. */}
            {isAr
              ? "الخطة الجاهزة لا تعرف جسمك ولا جدول أسبوعك — Alkemos يبني خطتك على مقاسك: هدفك، وزنك، معداتك، ومطبخك. ابدأ بالمجاني الدائم، وارتقِ حين يكبر استخدامك: بريميوم لإدارة خططك، وبرو لتكييفها أسبوعيًا، والتدريب الأونلاين حين تريد مدربًا خاصًا يرافقك إلى جانب قوة الذكاء الاصطناعي."
              : "Generic templates don't know your body or your week — that's why Alkemos builds YOUR plan. Start free with a full set of essential tools, then upgrade as your usage grows: Premium to manage your plans, Pro to adapt & optimize them, Coaching when you want a personal coach working with you alongside the full power of AI."}
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
                  {/* EGP-DISPLAY (owner order 2026-11-13): the daily EGP twin
                      under every paid price — USD stays the priced currency
                      (memberships.ts single source; the twin reads the exact
                      local_prices row, fallback stored-rate conversion). The
                      Free tier carries no twin (free has no equivalent). */}
                  {!isFree && (
                    <EgpTwin
                      block
                      usd={tier.priceMonthly!}
                      planTier={tier.id}
                      durationMonths={1}
                      isAr={isAr}
                      className={`text-xs font-medium ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}
                    />
                  )}
                </div>

                {/* Yearly price (shown on the same card when available) */}
                {hasYearly && !isFree && (
                  <div className="marble-card mt-4 p-3" style={isPro ? { backgroundColor: "#141518", color: "#F5F5F7" } : undefined}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isPro ? "text-[#B9BEC4]" : "text-[var(--muted-2)]"}`}>
                        {isAr ? "سنوي" : "Yearly"}
                      </span>
                      {/* GROWTH-PLAN batch 10 (owner order «إبراز القيمة التي تدفع المستخدم للاشتراك»): the savings chip is now DERIVED from memberships.ts (the single source of truth) instead of the hardcoded -33% — any future price change updates the chip automatically (no-drift law). */}
                      <span className="seal-chip">-{Math.round((1 - tier.priceYearly! / (12 * tier.priceMonthly!)) * 100)}%</span>
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className={`text-xl font-semibold tracking-tight ${isPro ? "chrome-text chrome-text-on-dark" : "chrome-text"}`}>
                        ${tier.priceYearly!.toFixed(2)}
                      </span>
                      <span className={`text-xs font-normal ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}>
                        /{isAr ? "سنة" : "yr"}
                      </span>
                    </div>
                    {/* EGP-DISPLAY (2026-11-13): the yearly twin — the exact
                        local_prices row for the 12-month product. */}
                    <EgpTwin
                      block
                      usd={tier.priceYearly!}
                      planTier={tier.id}
                      durationMonths={12}
                      isAr={isAr}
                      className={`text-[11px] font-medium ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}
                    />
                    <p className={`mt-1 text-[10px] font-normal ${isPro ? "text-[#9BA0A6]" : "text-[var(--muted-foreground)]"}`}>
                      {/* EGP-DISPLAY: the derived monthly average also carries
                          its twin (stored-rate conversion — a derived figure has
                          no row; the savings chip stays a pure USD arithmetic
                          difference by the same law it always had). */}
                      ${(tier.priceYearly! / 12).toFixed(2)}/{isAr ? "شهر" : "mo"} {isAr ? "بمعدل" : "avg"}{" "}
                      <EgpTwin usd={tier.priceYearly! / 12} isAr={isAr} />
                    </p>
                    {/* GROWTH-PLAN batch 10: the explicit dollar saving — pure arithmetic from the same source (12 × monthly − yearly), stated at the decision moment so the yearly value needs no mental math. */}
                    <p className={`mt-0.5 text-[10px] font-medium ${isPro ? "text-[#C9CED3]" : "text-[var(--text)]"}`}>
                      {isAr
                        ? `وفّر $${(12 * tier.priceMonthly! - tier.priceYearly!).toFixed(2)} مقابل الشهري`
                        : `Save $${(12 * tier.priceMonthly! - tier.priceYearly!).toFixed(2)} vs monthly`}
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
                        {/* BILINGUAL-CONTENT Phase 2: pressure-free CTA —
                          «الآن»/"now" removed (owner order), the plan NAME
                          added instead, so the primary money button is MORE
                          specific, not weaker. Price/destination untouched.
                          EGP-DISPLAY (2026-11-13): the button price gains its
                          twin too — the owner's order covers every visible
                          price figure, CTA buttons included. */}
                        {isAr ? `اشترك في ${tier.nameAr} — $${tier.priceMonthly!.toFixed(2)}/شهر` : `Subscribe to ${tier.nameEn} — $${tier.priceMonthly!.toFixed(2)}/mo`}{" "}
                        <EgpTwin
                          usd={tier.priceMonthly!}
                          planTier={tier.id}
                          durationMonths={1}
                          isAr={isAr}
                          className="text-xs font-normal opacity-90"
                        />
                      </a>
                      {/* Yearly CTA — secondary */}
                      {hasYearly && (
                        <a
                          href={ctaHref(tier.id, 12)}
                          className={`flex items-center justify-center gap-2 w-full px-6 py-3 text-center text-sm font-semibold ${
                            isPro ? "btn-outline border-[#3A3F45] text-[#F5F5F7]" : "btn-outline"
                          }`}
                        >
                          <span>
                            {isAr ? `سنوي — $${tier.priceYearly!.toFixed(2)}` : `Yearly — $${tier.priceYearly!.toFixed(2)}`}{" "}
                            <EgpTwin
                              usd={tier.priceYearly!}
                              planTier={tier.id}
                              durationMonths={12}
                              isAr={isAr}
                              className="text-xs font-normal opacity-90"
                            />
                          </span>
                          <span className="seal-chip">-{Math.round((1 - tier.priceYearly! / (12 * tier.priceMonthly!)) * 100)}%</span>
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CONVERSION-2026 (competitor study §4 — MFP/Trainwell/Ladder all
            surface trial/refund/cancel terms directly under the pricing
            grid): Alkemos states its REAL policies here — no invented
            trial. No auto-renewal (checkout writes one-period rows; the
            memberships FAQ below documents it), cancel from the account
            page, and the honest 7-day conditional refund (refund.ts). */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm font-medium leading-relaxed text-[var(--muted-foreground)]">
          {isAr
            ? "لا تجديد تلقائي — تدفع مرة واحدة، ولا يتجدد اشتراكك إلا برغبتك · إلغاء في أي وقت من صفحة حسابك · استرداد كامل خلال 7 أيام ما لم تُستخدم المزايا المدفوعة"
            : "No auto-renewal — you pay once and renew only if you choose · Cancel anytime from your account page · Full refund within 7 days if no paid features were used"}
        </p>

        {/* No-signup trial + UNIFIED SAVE LADDER (owner directive
            2026-09-13): the AI pool is visible as a core free experience,
            the save story is the same three-step ladder everywhere (no
            account → device · free account → permanent save + sync ·
            paid → broader management + per-tier benefits), and the AI
            generation quota stays clearly separated from the Meal-Planner
            save limits. Copy-only. */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm font-normal text-[var(--muted-foreground)]">
          {isAr
            ? "جرّب توليد الخطط بالذكاء الاصطناعي فورًا ومن دون حساب — خطتك تبقى على جهازك. وأنشئ حسابًا مجانيًا لتحفظ خططك للأبد وتتزامن عبر أجهزتك. ومع الباقات المدفوعة تتوسع الإدارة والسعات والتصدير بحسب باقتك."
            : "You can try AI plan generation instantly: no account keeps your plan on this device, a free account saves it permanently in your account & syncs it across your devices, and paid tiers add broader management and extra benefits per plan."}
        </p>

        {/* CONVERSION-2026 (competitor study §3 — the Freeletics/MyFitnessPal
            free-vs-paid tables): the "why paid at all?" bridge the buyer
            needs between the pricing grid and the persona cards. Four REAL
            paid deltas, every number against memberships.ts (unified pool
            2/4/8 · swaps 3/6 weekly paid · saved results 3/50/200 ·
            meal-planner saves 1/10/50 · ads Free+Premium only — Pro and
            Coaching ad-free). Direct numbers only (the 2026-09-13 owner
            directive — no multiplier phrasing). Copy-only. */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "ما الذي يضيفه الاشتراك فعلًا؟" : "What a subscription actually adds"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "المجاني كامل ويبقى مجانيًا — والاشتراك يوسّع أربع قدرات محددة، بأرقامها كما هي:"
              : "Free is complete and stays free — a subscription widens four specific capacities, with their exact numbers:"}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "macros",
                titleAr: "خطط أكثر كل شهر",
                titleEn: "More plans every month",
                bodyAr: "رصيدك الشهري من الخطط الذكية — تغذية وتمارين من رصيد واحد — يتوسع من 2 في المجاني إلى 4 مع بريميوم و8 مع برو.",
                bodyEn: "Your unified AI-plan pool (nutrition + workout combined) grows from 2 on Free to 4 with Premium and 8 with Pro.",
              },
              {
                icon: "runner",
                titleAr: "تكييف أسبوعي لخطتك",
                titleEn: "Weekly plan adaptation",
                bodyAr: "تبديلات EVO للوجبات والتمارين داخل خطتك القائمة: 3 أسبوعيًا مع بريميوم و6 مع برو — فتتطور خطتك مع تقدمك بدل أن تبدأ من الصفر كل مرة.",
                bodyEn: "EVO meal & exercise swaps inside your plan: 3 per week with Premium, 6 with Pro — it evolves with your progress instead of starting over.",
              },
              {
                icon: "scroll",
                titleAr: "ملكية كاملة لنتائجك وخططك",
                titleEn: "Full ownership of your work",
                bodyAr: "تصدير كامل لنتائجك وخططك، وسعة حفظ تتوسع معك: نتائج الأدوات من 3 إلى 50 ثم 200، وجداول الوجبات من 1 إلى 10 ثم 50.",
                bodyEn: "Full export of your results and plans, with capacity that grows: tool results from 3 to 50 then 200, meal-planner saves from 1 to 10 then 50.",
              },
              {
                icon: "laurel",
                titleAr: "تركيز بلا إعلانات",
                titleEn: "Focus, ad-free",
                bodyAr: "من مستوى برو فما فوق تختفي الإعلانات نهائيًا — تجربة صافية تولّد فيها خططك وتتابع تقدمك دون تشتيت.",
                bodyEn: "From Pro upward, ads disappear entirely — a clean experience while you generate plans and track progress.",
              },
            ].map((card) => (
              <div key={card.titleEn} className="marble-card flex h-full flex-col p-5 text-start">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)]">
                  <EngravedIcon name={card.icon} alt="" size={22} className="h-[22px] w-[22px]" />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight">
                  {isAr ? card.titleAr : card.titleEn}
                </h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {isAr ? card.bodyAr : card.bodyEn}
                </p>
              </div>
            ))}
          </div>
        </section>

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
                fitAr: "في بداية الطريق: تريد أرقامك وخطة أولى تجربها",
                fitEn: "You're starting and want your numbers and first plan",
                bodyAr: "التوليدان الشهريان يكفيان لخطة تغذية وخطة تمرين في الشهر، ومعهما 10 رسائل يوميًا مع EVO — والحساب المجاني يحفظ خططك للأبد ويزامنها عبر أجهزتك.",
                bodyEn: "The 2 monthly generations cover one nutrition plan and one workout plan a month, plus 10 EVO messages a day. A free account keeps your plans forever and syncs them across devices.",
              },
              {
                tierAr: "بريميوم",
                tierEn: "Premium",
                fitAr: "صرت تعدّل وتجرب وتولّد أكثر",
                fitEn: "You're iterating and experimenting",
                bodyAr: "رصيد شهري من 4 خطط، ومحادثة بلا حدود مع EVO، و3 تبديلات أسبوعية — مع سعة أكبر: 10 جداول وجبات محفوظة، و50 نتيجة أدوات قابلة للتصدير.",
                bodyEn: "4 generations a month, unlimited chat, and 3 weekly swaps — plus more capacity: 10 saved meal-planner plans and 50 saved tool results with export.",
              },
              {
                tierAr: "برو",
                tierEn: "Pro",
                fitAr: "تتدرب بجدية وتريد خطة تتكيف معك أسبوعيًا — بلا إعلانات",
                fitEn: "You train seriously and want weekly adaptation, ad-free",
                bodyAr: "8 خطط شهريًا و6 تبديلات أسبوعية، وتحليل لأنماط تقدمك — مع 50 جدول وجبات محفوظًا، و200 نتيجة أدوات، وتجربة خالية من الإعلانات.",
                bodyEn: "8 generations, 6 weekly swaps, and progress pattern analysis — 50 saved plans, 200 saved tool results, and no ads.",
              },
              {
                tierAr: "التدريب الأونلاين",
                tierEn: "Coaching",
                fitAr: "تريد مدربًا خاصًا يبني خططك ويتابعك أسبوعيًا",
                fitEn: "You want a personal coach building your plan and following up",
                bodyAr: "مدرب معتمد يبني خطط تغذيتك وتمارينك ويجري التبديلات بنفسه، مع متابعة أسبوعية بتذكير تلقائي وتواصل مباشر — وتشمل باقتك كل مزايا برو.",
                bodyEn: "A personal coach builds your nutrition and workout plans and makes the swaps personally, with weekly check-ins and automatic reminders — and it includes every Pro feature.",
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
              ? "القاعدة بسيطة: ابدأ بالمجاني، وارتقِ حين يصبح رصيدك أو سعتك أضيق من استخدامك — والتفاصيل الكاملة في جدول المقارنة والأسعار أعلاه."
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
                  ? "استرداد كامل خلال 7 أيام من تفعيل الاشتراك، بشرط ألا تكون قد استخدمت أي ميزة مدفوعة (توليد خطط التغذية أو التمارين، تبديلات EVO، حفظ نتائج الأدوات، تحميل PDF). وبمجرد استخدام أي ميزة مدفوعة يصبح الاشتراك غير قابل للاسترداد. أما المجاني فلا يحتاج إلى استرداد أصلًا."
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
                    {isAr ? "مدرب خاص" : "Personal Coach"}
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {isAr ? coaching.nameAr : coaching.nameEn}
                  </h3>
                </div>
                <p className="mt-3 text-sm font-normal text-[#9BA0A6]">
                  {isAr
                    ? "التدريب الأونلاين مع مدربين محترفين وأخصائيي تغذية: خطط تُبنى لك وحدك، متابعة أسبوعية، وتبديلات يجريها المدرب بيده."
                    : "Personal coaching with professional coaches and nutrition specialists: personalized plans, weekly check-ins, and swaps made by your coach."}
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
                  {/* BILINGUAL-CONTENT Phase 2: pressure-free + specific —
                      mirrors the /coaching page's own hero CTA exactly
                      («ابدأ التدريب الأونلاين» / "Start coaching"). */}
                  {isAr ? "ابدأ التدريب الأونلاين ›" : "Start coaching ›"}
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
                  {/* BILINGUAL-CONTENT Phase 2 (owner order: «عرّب ترويسة جدول
                      المقارنة بالكامل», audit أ-2): the column headers now
                      derive from memberships.ts nameAr/nameEn — the Arabic
                      surface reads «مجاني/بريميوم/برو/التدريب الأونلاين»
                      like the cards above it, and can never drift from the
                      single source. */}
                  {((["free", "premium", "pro", "coaching"] as const).map((id) => {
                    const m = MEMBERSHIPS.find((t) => t.id === id)!;
                    const isHighlight = id === "premium";
                    return (
                      <th
                        key={id}
                        className={`p-4 text-center text-xs ${isHighlight ? "font-semibold text-[var(--text)]" : "font-medium text-[var(--muted-foreground)]"}`}
                      >
                        {isAr ? m.nameAr : m.nameEn}
                      </th>
                    );
                  }))}
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
              ? "توليد خطط الذكاء الاصطناعي يسحب من رصيد شهري واحد موحد (التغذية والتمارين معًا، ويُحتسب التوليد الناجح فقط، ويتجدد مع أول كل شهر) — وهذا الرصيد منفصل كليًا عن حدود الحفظ في مخطط الوجبات ونتائج الأدوات."
              : "AI plan generation draws from ONE unified monthly pool (nutrition + workout combined, success-only counting, resets on the 1st) — and it is completely separate from the Meal-Planner save limits and the tool-results save limits."}
          </p>
          {/* Phase 195 (owner directive): «Swaps» alone could read as a full
              plan regeneration — the limits row above means MEAL/EXERCISE
              swaps inside the existing plan, never a regeneration. */}
          <p className="mx-auto mt-2 max-w-2xl text-center text-xs font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "«التبديلات» تعني استبدال وجبات أو تمارين فردية داخل خطتك دون إعادة إنشاء الخطة كاملة — وهي أسبوعية وتتجدد كل يوم اثنين."
              : "“Swaps” means replacing individual meals or exercises within your plan — never a full plan regeneration. They are weekly and reset every Monday."}
          </p>{/* Access-point fix (2026-09-14): the /compare vertical had ZERO
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

        {/* FAQ — BILINGUAL-CONTENT Phase 2: rendered from the single
            source src/lib/memberships-faq.ts (verbatim move — see the
            file header); the language surfaces emit the same array as
            FAQPage JSON-LD so AI answer engines read the answers in the
            server HTML (the coaching-faq.ts precedent). */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "أسئلة شائعة" : "Common questions"}
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-4">
            {MEMBERSHIPS_FAQ[isAr ? "ar" : "en"].map((faq, i) => (
              <div key={i} className="marble-card p-5">
                <h3 className="text-sm font-semibold">{faq.q}</h3>
                <p className="mt-1.5 text-sm font-normal text-[var(--muted-foreground)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BILINGUAL-CONTENT Phase 2 (§ب — the hesitant-payer conversion
            review): the page previously dead-ended at the FAQ. A hesitant
            buyer's objections are resolved exactly HERE (the cancel/refund
            answers above), so the zero-risk next step — starting free —
            belongs at this decision point, with coaching one tap away.
            Pressure-free by law (no «الآن»); every fact already published
            on this page (free-forever · upgrade-when-usage-grows · no
            auto-renewal · no contracts); reuses the existing ctaHref/
            ctaLabel logic — zero new routes or behavior. */}
        <section className="mt-16">
          <div className="marble-card mx-auto max-w-2xl p-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {isAr ? "ابدأ حيث يناسبك." : "Start where it fits you."}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "المجاني كامل وبلا حد زمني — ابدأ به وارتقِ حين يكبر استخدامك. لا تجديد تلقائي ولا عقود."
                : "Free is complete with no time limit — start there and upgrade as your usage grows. No auto-renewal, no contracts."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={ctaHref("free", 1)}
                className="btn-chrome px-6 py-3 text-sm"
              >
                {ctaLabel("free", isAr)}
              </a>
              <a
                href={isAr ? "/ar/coaching" : "/coaching"}
                className="btn-outline px-6 py-3 text-sm"
              >
                {isAr ? "التدريب مع مدرب خاص" : "Coaching with a personal coach"}
                <span className="rtl:rotate-180">›</span>
              </a>
            </div>
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