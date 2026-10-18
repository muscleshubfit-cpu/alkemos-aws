"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { COACHING_FAQ } from "@/lib/coaching-faq";
import { useNav } from "@/hooks/use-nav";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShareButtons } from "@/components/ShareButtons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { listBlogPosts, getCategoryLabel, type BlogPostCard } from "@/lib/blog";
import { deferIdle } from "@/lib/defer-idle";
import { Dumbbell, Apple, BarChart3, Bot, Check, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

// PHASE 193 (copy audit — claims honesty): the previous data here was 9
// fabricated testimonials (stock-avatar portraits + invented names and
// results like «-12kg in 3 months») plus a fabricated client-count claim — all
// unverifiable and contrary to the honesty/E-E-A-T law (§12.50-أ-1).
// The section now sells TRUST with only verifiable facts (founder review,
// transparent limits, 7-day refund) — no names, no numbers, no photos.


// Disabled Reveal — animations were causing jarring "shake" effects
// during scroll. Now just renders children directly.
function Reveal({
  children,
  className = "",
  delay: _delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}

function CenteredSection({
  children,
  bg = "bg-[var(--bg)]",
}: {
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <section className={`${bg} px-4 py-16 md:py-24`}>
      <div className="mx-auto max-w-4xl text-center">{children}</div>
    </section>
  );
}

export default function CoachingPage() {
  const { lang } = useI18n();
  const { navigate } = useNav();
  const router = useRouter();
  const { profile } = useAuth();
  const isAr = lang === "ar";
  const [latestPosts, setLatestPosts] = useState<BlogPostCard[]>([]);

  // Smooth scroll to pricing section
  const scrollToPricing = () => {
    document.getElementById("coaching-pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 0046 OWNER DECREE — «الأسعار اللي شيلتها هي الصحيحة والمربوطة مع باي بال،
  // والسعر الجديد 39 هو الغلط»: this page keeps selling the ORIGINAL
  // Starter ($20/mo) / Elite ($40/mo) products — the PayPal-tied prices.
  // The 0045 unified $39.99/$359 cards here were REVERTED. The real 0045
  // fix (the /memberships coaching card dead-end) stays: /checkout accepts
  // starter/elite AND coaching. At activation these legacy products are
  // written under their canonical model tiers (starter → premium,
  // elite → pro) via canonicalModelTier() so feature gates + the 0045 DB
  // guard keep working — clients pay the exact price they clicked.
  const goToCheckout = (tier: string) => {
    const checkoutUrl = `/checkout?tier=${tier}&months=1`;
    if (profile) {
      router.push(checkoutUrl);
    } else {
      router.push(`/auth?mode=signup&next=${encodeURIComponent(checkoutUrl)}`);
    }
  };

  useEffect(() => {
    // PHASE 182: below-fold latest-posts strip — its fetch pulls the
    // Supabase client chunk on demand, deferred past the LCP window.
    deferIdle(() => {
      void (async () => {
        const posts = await listBlogPosts(lang);
        setLatestPosts(posts.slice(0, 3));
      })();
    }, 2500);
  }, [lang]);

  const blogHref = isAr ? "/ar/blog" : "/blog";

  const features = [
    {
      icon: Apple,
      titleAr: "خطط تغذية مخصصة",
      titleEn: "Personalized Nutrition Plans",
      descAr: "خطة تغذية بالجرام والسعرات والماكروز بناءً على هدفك، وزنك، وعاداتك الغذائية. مع تبديل الوجبات بذكاء.",
      descEn: "Nutrition plan with precise macros, calories, and gram-level detail based on your goal, weight, and dietary habits. Smart meal swaps included.",
      color: "#34c759",
    },
    {
      icon: Dumbbell,
      titleAr: "برامج تمارين متكيفة",
      titleEn: "Adaptive Workout Programs",
      descAr: "برنامج تمارين يتكيف مع مستواك، معداتك المتاحة، وتقدمك. مع تبديل التمارين بذكاء والشرح الكامل لكل تمرين.",
      descEn: "Workout program that adapts to your level, available equipment, and progress. Smart exercise swaps with full instructions.",
      color: "#0071e3",
    },
    {
      icon: BarChart3,
      titleAr: "تتبع التقدم الذكي",
      titleEn: "Smart Progress Tracking",
      descAr: "تتبع وزنك، قياساتك، وصورك. يُحلّل EVO أنماط تقدمك ويخبرك بما ينجح وما يحتاج تعديلًا.",
      descEn: "Track your weight, measurements, and photos. EVO analyzes your progress patterns and tells you what's working and what needs adjustment.",
      color: "#ff9500",
    },
    {
      icon: Bot,
      titleAr: "EVO — مدربك الذكي على مدار الساعة",
      titleEn: "EVO — Your AI Assistant 24/7",
      descAr: "اسأل EVO أي سؤال عن التغذية أو التمارين أو التحفيز في أي وقت — محرك ذكي يقرأ بياناتك ويتذكّرها، ويتعلّم أسبوعيًا من خطط المنصة الحقيقية (مجهولة الهوية).",
      descEn: "Ask EVO anything about nutrition, training, or motivation, anytime — a smart engine that reads and remembers your data, and learns weekly from real (anonymized) platform plans.",
      color: "#8b5cf6",
    },
  ];

  return (
    /* Phase 132 (owner feedback: «باقي الموقع إعادة التنسيق ليتبع هوية
       الصفحة الرئيسية»): the coaching page joins the Marble & Chrome
       identity — token surfaces/text, marble-cards, seal-chip eyebrow,
       btn-chrome/btn-outline CTAs, chrome-text result numbers, helmet
       brand mark. The old Apple palette (bg-white / #f5f5f7 stripes /
       #0071e3 blue CTAs) and the flag emojis (zero-emoji law) are
       retired. */
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main>
        {/* ===================== HERO ===================== */}
        {/* Image 1 (coaching-1) directly under the title */}
        <section className="bg-gradient-to-b from-[var(--tint)] to-[var(--bg)] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <span className="seal-chip">
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? "التدريب الأونلاين" : "Online Coaching"}
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              {/* SEO/GEO audit (2026-09-28): the trailing space keeps the
                  H1 textContent "Professional coaches & nutrition
                  specialists." — without it, crawlers/screen readers read
                  the <br/>-split heading as "coaches& nutrition". Visual
                  output (two lines) is unchanged. */}
              {isAr ? "مدربون وأخصائيو " : "Professional coaches "}
              <br />
              {isAr ? "تغذية محترفون." : "& nutrition specialists."}
            </h1>
            {/* Image 1 — directly under the hero title */}
            <div className="relative mt-8 aspect-[3/2] w-full overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src="/images/hero/coaching-1.jpg"
                alt={isAr ? "التدريب الأونلاين مع مدربك على Alkemos" : "Online fitness coaching with your Alkemos coach"}
                fill
                className="object-cover"
                loading="eager"
              />
            </div>
            <p className="mx-auto mt-8 max-w-xl text-lg font-normal leading-snug text-[var(--muted-foreground)] md:text-xl">
              {isAr
                ? "خطط تغذية مخصصة، برامج تمارين متكيفة، متابعة شخصية، ومحرك ذكاء اصطناعي (EVO) متاح على مدار الساعة."
                : "Personalized nutrition plans, adaptive workout programs, personal follow-up, and an AI engine (EVO) available 24/7."}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={scrollToPricing}
                className="btn-chrome px-7 py-3 text-base font-medium"
              >
                {isAr ? "ابدأ التدريب الأونلاين الآن" : "Start coaching now"}
              </button>
              <a
                href="#how-it-works"
                className="btn-outline px-7 py-3 text-base"
              >
                {isAr ? "كيف يعمل التدريب الأونلاين؟" : "How coaching works"}
              </a>
            </div>
          </div>
        </section>

        {/* ===================== HOW IT WORKS ===================== */}
        <section id="how-it-works" className="scroll-mt-20 bg-[var(--bg)] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <h2 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
                {isAr ? "رحلتك في 4 خطوات." : "Your journey in 4 steps."}
              </h2>
            </Reveal>
            <div className="mt-12 space-y-8 md:space-y-12">
              {[
                { n: "01", title: isAr ? "أنشئ حسابك" : "Create your account", desc: isAr ? "في ثوانٍ. بالإيميل أو Google." : "In seconds. Email or Google." },
                { n: "02", title: isAr ? "أكمل الاستبيانات" : "Complete questionnaires", desc: isAr ? "أخبرنا عن هدفك، وزنك، عاداتك." : "Tell us your goal, weight, habits." },
                { n: "03", title: isAr ? "EVO يحلل ويخطط" : "EVO analyzes & plans", desc: isAr ? "مدربون بشريون وEVO معًا يولّدون خططك المخصصة." : "Coaches + EVO generate your plans." },
                { n: "04", title: isAr ? "ابدأ التحوّل" : "Start transforming", desc: isAr ? "تتبع، استبدل، واسأل EVO." : "Track, swap, and ask EVO." },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <div className="grid grid-cols-[auto_1fr] gap-6 border-t border-[var(--edge)] pt-6 md:grid-cols-[120px_1fr] md:gap-12 md:pt-8">
                    <div className="text-sm font-normal text-[var(--muted-foreground)]">{s.n}</div>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight md:text-3xl">{s.title}</h3>
                      <p className="mt-2 text-base font-normal text-[var(--muted-foreground)] md:text-lg">{s.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== PRIORITY-PAGES Implementation 3
            (2026-10-19, audit §D-1 + Improvement 3): "Your week with the
            coach, as it actually happens" — the highest-priced page's
            copy never showed the weekly follow-up mechanism. Every step
            below mirrors the verified service set (memberships.ts):
            weekly check-in with automatic reminder · manual swaps made by
            the coach · direct contact · EVO 24/7 between check-ins. */}
        <section className="bg-[var(--tint)] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <h2 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
                {isAr ? "أسبوعك مع المدرب كما يحدث فعلًا." : "Your week with the coach, as it actually happens."}
              </h2>
            </Reveal>
            <div className="mt-12 space-y-6">
              {[
                {
                  n: "01",
                  titleAr: "يوم المتابعة: يصلك التذكير تلقائيًا",
                  titleEn: "Check-in day: the reminder arrives automatically",
                  descAr: "ترسل وزنك وقياساتك وأي ملاحظات في دقائق — لا تقارير ولا جلسات.",
                  descEn: "You send your weight, measurements, and any notes in minutes — no reports, no sessions.",
                },
                {
                  n: "02",
                  titleAr: "خلال يوم: مدربك يرد بتعديلات الأسبوع القادم",
                  titleEn: "Within a day: your coach replies with next week's adjustments",
                  descAr: "تبديل وجبة أو تمرين بيده حسب أرقامك — ويسألك عن أي عائق يواجهك.",
                  descEn: "A meal or exercise swapped by hand to match your numbers — and a question about anything standing in your way.",
                },
                {
                  n: "03",
                  titleAr: "بين المتابعات: EVO معك على مدار الساعة",
                  titleEn: "Between check-ins: EVO is with you around the clock",
                  descAr: "أسئلتك اليومية تجيب فورًا، والمدرب على مسافة رسالة مباشرة إن احتجته.",
                  descEn: "Your daily questions get instant answers, and the coach is one direct message away if you need them.",
                },
              ].map((s) => (
                <Reveal key={s.n}>
                  <div className="grid grid-cols-[auto_1fr] gap-6 border-t border-[var(--edge)] pt-6 md:gap-12 md:pt-8">
                    <div className="text-sm font-normal text-[var(--muted-foreground)]">{s.n}</div>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                        {isAr ? s.titleAr : s.titleEn}
                      </h3>
                      <p className="mt-2 text-base font-normal text-[var(--muted-foreground)] md:text-lg">
                        {isAr ? s.descAr : s.descEn}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={200}>
              <p className="mx-auto mt-10 max-w-xl text-center text-base font-normal text-[var(--muted-foreground)] md:text-lg">
                {isAr
                  ? "هذا كل الالتزام: دقائق أسبوعية منك، ومدرب يقرأ أرقامك ويعدّل مسارك حول حياتك — سفرك ومطبخك وجدولك."
                  : "That's the whole commitment: minutes a week from you, and a coach reading your numbers and adjusting your course around your life — your travel, your kitchen, your schedule."}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ===================== FEATURES ===================== */}
        <section className="bg-[var(--tint)] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
                {isAr ? "كل ما تحتاجه في منصة واحدة." : "Every tool you need."}
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={i} delay={i * 100}>
                    <div className="marble-card h-full p-8">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--edge)] bg-[var(--tint)]">
                        <Icon className="h-7 w-7 text-[var(--muted-2)]" />
                      </span>
                      <h3 className="mt-5 text-xl font-semibold tracking-tight">
                        {isAr ? f.titleAr : f.titleEn}
                      </h3>
                      <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                        {isAr ? f.descAr : f.descEn}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================== COACHING VISUALS ===================== */}
        {/* Image 2 (coaching-2) — placed between Features and EVO sections */}
        <section className="bg-[var(--bg)] px-4 py-12 md:py-20">
          <div className="relative mx-auto aspect-[3/2] w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl">
            <Image
              src="/images/hero/coaching-2.jpg"
              alt={isAr ? "تدريب احترافي بالذكاء الاصطناعي" : "Professional AI-assisted training"}
              fill
              className="object-cover"
              loading="lazy"
            />
          </div>
        </section>

        {/* ===================== EVO INTEGRATION ===================== */}
        <section className="bg-[var(--tint)] px-4 py-16 text-[var(--text)] md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              {isAr ? "المدرب + EVO معك على مدار الساعة." : "Your coach + EVO, 24/7."}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-lg font-normal text-[var(--muted-foreground)] md:text-xl">
              {/* Phase 196 (owner directive): EVO is part of EVERY Alkemos
                  membership (free tier + Premium/Pro) — the old wording said
                  EVO belongs to the coaching package and framed it against a
                  hypothetical separate subscription, which implied
                  exclusivity. The unified message keeps the coaching
                  reassurance (included in full) without the exclusivity
                  implication — zero entitlement change. */}
              {isAr
                ? "محرك أداء ذكي يقرأ بياناتك وهدفك، ويبني لك خططًا مخصّصة، ويقترح تبديلات ذكية للوجبات والتمارين — EVO جزء من كل عضويات Alkemos، وباقة التدريب الأونلاين تشمله بكل ميزاته بلا أي اشتراك إضافي."
                : "A smart engine that reads your data and goal, builds personalized plans, and suggests smart meal and exercise swaps — EVO is part of every Alkemos membership, and your coaching plan includes it in full with no extra subscription."}
            </p>
            {/* Owner directive 2026-08-30: EVO is a service inside the
                subscriptions, NOT a CTA. The old twin promo buttons
                ("Learn more about EVO" + "Start chatting") are demoted to a
                single quiet informational link. */}
            <div className="mt-6">
              <a
                href="/evo"
                className="btn-outline inline-flex items-center gap-2 px-5 py-2.5 text-sm"
              >
                {isAr ? "اعرف أكثر عن EVO" : "Learn more about EVO"}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </a>
            </div>
          </div>
        </section>

        {/* ===================== TRUST (replaces fabricated testimonials, Phase 193) ====
            Honest trust section: only verifiable facts — founder-led human
            review (About-page owner content), fully published limits, 7-day
            refund. No invented names, numbers, or photos. ===================== */}
        <section className="bg-[var(--tint)] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <h2 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
                {isAr ? "التزام يمكن الاعتماد عليه." : "A commitment you can count on."}
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mx-auto mt-4 max-w-xl text-center text-lg font-normal text-[var(--muted-foreground)] md:text-xl">
                {isAr
                  ? "التدريب الأونلاين في Alkemos مبني على إشراف بشري حقيقي وقواعد واضحة تنشر كما هي — بلا وعود مبالغ فيها."
                  : "Coaching at Alkemos is built on real human oversight and clear rules published as they are — no inflated promises."}
              </p>
            </Reveal>

            {/* Alkemos brand mark — helmet emblem (identity) */}
            <Reveal delay={200}>
              <div className="mt-10 flex flex-col items-center">
                {/* PHASE 137: loading=lazy (kills the React Float auto-preload
                    of this artwork on the critical path). */}
                {/* eslint-disable-next-line @next/next/no-img-element -- local fixed asset (helmet mark, decorative) */}
                <img
                  src="/images/brand/mark-helmet.png"
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  className="h-14 w-14 object-contain"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold">Alkemos</p>
                <p className="text-xs font-normal text-[var(--muted-foreground)]">
                  {isAr ? "منصة اللياقة والتغذية الذكية المتكاملة" : "The smart, all-in-one fitness & nutrition platform"}
                </p>
              </div>
            </Reveal>

            {/* Honest trust cards — every claim verified in §12.50-أ */}
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: isAr ? "إشراف بشري على كل خطة" : "Human oversight on every plan",
                  // PRIORITY-PAGES Implementation 3 (2026-10-19, audit §D-1):
                  // the four certification bodies are now named on the page
                  // (verified source: the author page + llms-full route —
                  // "certified fitness & nutrition coach — ACSM, ACE, ISSA
                  // and NASM"), and the card links to the author page where
                  // the certificates are shown as issued (strongest E-E-A-T
                  // surface, authors/ahmed-zake renders the certificate scans).
                  body: isAr
                    ? "المؤسس أحمد زكي — مدرب لياقة وتغذية معتمد (شهادات من ACSM و ACE و ISSA و NASM) بخبرة تدريبية تناهز عشرين عامًا، نحو عشر منها تدريب أونلاين — يشرف على المحتوى والخطط، ويُراجع كل مقال للدقة العلمية قبل النشر."
                    : "Founder Ahmed Zake — a certified fitness and nutrition coach (ACSM, ACE, ISSA, and NASM certifications) with about twenty years of training experience, around ten of them coaching online — oversees the platform's content and reviews every article for accuracy before publication.",
                  href: isAr ? "/ar/authors/ahmed-zake" : "/authors/ahmed-zake",
                  cta: isAr ? "شهادات المؤسس كما صدرت ›" : "The founder's certificates, as issued ›",
                },
                {
                  title: isAr ? "حدود شفافة بلا شروط خفية" : "Transparent limits, no fine print",
                  body: isAr
                    ? "كل الأسعار وحدود الاستخدام (توليد الخطط، التبديلات، الحفظ) منشورة بالكامل على صفحة العضويات — ما تراه هو ما تحصل عليه."
                    : "Every price and usage limit (plan generations, swaps, saves) is published in full on the memberships page — what you see is what you get.",
                  href: isAr ? "/ar/memberships" : "/memberships",
                  cta: isAr ? "قارن العضويات ›" : "Compare memberships ›",
                },
                {
                  title: isAr ? "استرداد كامل خلال 7 أيام" : "Full 7-day refund",
                  body: isAr
                    ? "إن لم تُستخدم أي ميزة مدفوعة، نعيد لك كامل قيمة الاشتراك خلال 7 أيام من التفعيل — شروط واضحة، بلا التزام محفوف بالمخاطرة."
                    : "If no paid feature has been used, we refund your full subscription within 7 days of activation — the conditions are simple and stated up front.",
                  href: isAr ? "/ar/memberships" : "/memberships",
                  cta: isAr ? "سياسة الاسترداد ›" : "Refund policy ›",
                },
              ].map((card, i) => (
                <Reveal key={i} delay={250 + i * 80}>
                  <div className="marble-card flex h-full flex-col p-6">
                    <h3 className="text-base font-semibold tracking-tight">{card.title}</h3>
                    <p className="mt-2 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">{card.body}</p>
                    <a
                      href={card.href}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text)] underline decoration-[var(--edge)] underline-offset-4 transition-opacity hover:opacity-70"
                    >
                      {card.cta}
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== PRICING ===================== */}
        <section id="coaching-pricing" className="scroll-mt-20 bg-[var(--bg)] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
                {isAr ? "مدرب بشري. باقة واحدة." : "A human coach. One simple plan."}
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mx-auto mt-4 max-w-xl text-center text-lg font-normal text-[var(--muted-foreground)] md:text-xl">
                {isAr ? "$39.99 شهريًا، وتشمل كل مميزات Pro مع متابعة المدرب." : "$39.99/month, including every Pro feature plus your coach's follow-up."}
              </p>
            </Reveal>
            {/* PHASE 68 (owner-approved): the legacy Starter $20 / Elite $40
                cards are REMOVED from display — they silently remapped to
                premium/pro at activation and confused pricing. The canonical
                Coaching membership (memberships.ts) is the single offer.
                Old checkout links (?tier=starter/elite) stay valid. */}
            <div className="mx-auto mt-16 max-w-xl">
              <Reveal>
                {/* Dark marble card with a 2px chrome ring — the identity
                    treatment of premium cards (mirrors the Pro card on
                    /memberships). Dark in BOTH themes by design. */}
                <div className="h-full rounded-[var(--radius-chrome)] bg-black p-8 text-white md:p-10" style={{ boxShadow: "0 0 0 2px #C9CED3, var(--shadow)" }}>
                  <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {isAr ? "التدريب الأونلاين" : "Coaching"}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    {/* chrome-text-on-dark (Phase 198, audit C3): black card in BOTH themes */}
                    <span className="chrome-text chrome-text-on-dark text-4xl font-semibold tracking-tight md:text-5xl">$39.99</span>
                    <span className="text-base font-normal opacity-60">{isAr ? "/شهر" : "/mo"}</span>
                  </div>
                  <p className="mt-1 text-sm font-normal opacity-60">{isAr ? "أو $359 سنويًا" : "or $359/yr"}</p>
                  <ul className="mt-8 space-y-3 text-base font-normal">
                    {/* 2026-09-15 (consistency fix — memberships.ts says
                        coaching inherits every Pro limit; this card now says
                        so explicitly, same numbers, copy-only): */}
                    {[isAr ? "كل مميزات Pro (8 خطط AI شهريًا، 6 تبديلات أسبوعيًا، بلا إعلانات)" : "All Pro features (8 AI plans/month, 6 swaps/week, ad-free)",
                      isAr ? "خطط تغذية وتمارين من مدرب بشري" : "Nutrition + workout plans from a human coach",
                      isAr ? "EVO: محادثة غير محدودة وذاكرة دائمة" : "EVO: unlimited chat + cross-session memory",
                      isAr ? "متابعة أسبوعية بتذكير تلقائي" : "Weekly check-in reminders",
                      isAr ? "تبديلات يدوية من المدرب" : "Manual swaps by the coach",
                      isAr ? "دعم أولوية" : "Priority support",
                      isAr ? "تواصل مباشر مع المدرب" : "Direct contact with the coach"].map((f, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 opacity-60" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => goToCheckout("coaching")}
                    className="btn-chrome mt-8 w-full px-6 py-3 text-base"
                  >
                    {isAr ? "ابدأ الآن" : "Get Started"}
                  </button>
                  <a
                    href={isAr ? "/ar/memberships" : "/memberships"}
                    className="mt-4 block text-center text-sm font-normal opacity-60 transition-opacity hover:opacity-90"
                  >
                    {isAr ? "مقارنة كل الباقات ›" : "Compare all memberships ›"}
                  </a>
                </div>
              </Reveal>
            </div>
            <Reveal delay={400}>
              <div className="mt-12 text-center">
                <button onClick={scrollToPricing} className="font-normal text-[var(--muted-2)] underline-offset-4 transition-opacity hover:opacity-70 hover:underline">
                  {isAr ? "كل التفاصيل ›" : "See all details ›"}
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===================== FAQ ===================== */}
        <section className="bg-[var(--tint)] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
                {isAr ? "أسئلة شائعة" : "Coaching questions"}
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <Accordion type="single" collapsible className="mt-12">
                {/* CONTENT-AUDIT P1-2 (2026-09-28): the FAQ array moved to
                    src/lib/coaching-faq.ts (single source) so the language
                    layouts can emit the same Q&A as FAQPage JSON-LD — the
                    closed Accordion panels are not in the served DOM, and
                    non-JS crawlers (AI answer engines) need the answers in
                    the server HTML. */}
                {COACHING_FAQ[isAr ? "ar" : "en"].map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b border-[var(--edge)]">
                    <AccordionTrigger className="py-5 text-start text-lg font-normal hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        {/* ===================== FINAL CTA ===================== */}
        <section className="bg-[var(--bg)] px-4 py-16 text-center md:py-24">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              {isAr ? "مدربك جاهز عندما تكون جاهزًا." : "Your coach is ready when you are."}
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <button
                onClick={scrollToPricing}
                className="btn-chrome px-7 py-3 text-base font-medium"
              >
                {isAr ? "ابدأ التدريب الأونلاين الآن" : "Start coaching now"}
              </button>
              {/* Owner 2026-08-30: removed the old "اعرف عن EVO ›" link —
                  EVO is part of the subscription, not a destination CTA. */}
            </div>
          </Reveal>
        </section>

        {/* ===================== SHARE ===================== */}
        <div className="mx-auto max-w-4xl px-4 pb-12">
          <div className="marble-card flex items-center justify-between gap-4 p-4">
            <p className="text-sm font-medium text-[var(--text)]">
              {isAr ? "شارك صفحة التدريب الأونلاين" : "Share coaching page"}
            </p>
            <ShareButtons
              path="/coaching"
              title={isAr ? "التدريب الأونلاين | Alkemos" : "Online Coaching | Alkemos"}
              text={isAr ? "مدرب بشري يبني خططك ويتابعك أسبوعيًا — مع EVO بلا حدود. $39.99/شهر." : "A human coach builds your plans and checks in weekly — with unlimited EVO. $39.99/mo."}
            />
          </div>
        </div>
      </main>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}