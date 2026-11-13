"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CoachShareButtons } from "@/components/CoachShareButtons";
import { COACH_FAQ_AR, COACH_FAQ_EN } from "./content";

/**
 * FOR-COACHES — recruitment landing page (owner directive 2026-08-29:
 * «صفحة داخل الموقع عربى وانجليزى دعايا وشرح لجذب المدربين»).
 *
 * OWNER LAW baked into the copy:
 *   - Coach authority is over HIS OWN clients, never the site's
 *     («صلاحيات المدربين تكون مع عملائهم وليس للموقع والشات الذكى»).
 *   - Client prices belong to the coach: he sets them freely and
 *     collects them freely («اسعار عملائهم خاصة بيهم يحددوها براحتهم
 *     ويحصلوا براحتهم») — the site takes a FIXED activation fee, never
 *     a percentage (business model law).
 *   - Coaches can subscribe to site memberships for the site's own
 *     premium features («يمكنهم الاشتراك فى عضويات الموقع»).
 *   - No icons / no emojis on this page — text, cards and buttons only.
 *
 * Images are URL-string references (Phase 215 / P1-8, owner-approved
 * remediation plan) — the pattern used everywhere else on the site:
 * next/image still optimizes them into responsive AVIF/WebP through the
 * default /_next/image loader (owner intent «الاستيراد مع التحويل
 * لتخفيف السرعة» preserved); explicit width/height carry the intrinsic
 * aspect ratios. The previous STATIC imports (`../../../public/…`) broke
 * the clean-clone `tsc --noEmit` gate (4× TS2307 — next-env.d.ts is
 * gitignored), the exact finding المؤكد 12 of the 2026-09-16 deep audit.
 */

const REGISTER_HREF_BASE = "/for-coaches/register";

export default function ForCoachesPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  // AR mirror (2026-08-30): the register CTA follows the mirror so an
  // /ar/for-coaches visitor lands on the Arabic registration URL.
  const REGISTER_HREF = isAr ? `/ar${REGISTER_HREF_BASE}` : REGISTER_HREF_BASE;

  const shareMsg = isAr
    ? "اعمل مدربًا على Alkemos — عملاؤك بأسعارك وأموالك بين يديك:"
    : "Coach on Alkemos — your clients, your prices, your money:";

  return (
    /* Phase 132 (owner feedback: «باقي الموقع إعادة التنسيق ليتبع هوية
       الصفحة الرئيسية»): the coach-recruitment page joins the Marble &
       Chrome identity — token surfaces/text, marble-cards, seal-chip
       eyebrow, chrome-text stat numbers, btn-chrome/btn-outline CTAs. */
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      {/* ================= HERO ================= */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 md:grid-cols-2 md:pt-16">
        <div>
          <span className="seal-chip">
            {isAr ? "للمدربين وأخصائيي التغذية" : "For coaches & nutrition specialists"}
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-5xl md:leading-tight">
            {/* SEO/GEO audit (2026-09-28): explicit strings with a trailing
                space keep the H1 textContent readable ("… at your prices —
                and keep your money" / "درِّب عملاءك بأسعارك وأموالك بين
                يديك") — raw JSX lines around <br/> collapse to no space
                for crawlers and screen readers. Visual output unchanged. */}
            {isAr ? (
              <>
                {"درِّب عملاءك بأسعارك "}
                <br />
                {"وأموالك بين يديك"}
              </>
            ) : (
              <>
                {"Train your clients at your prices — "}
                <br />
                {"and keep your money"}
              </>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "Alkemos يمنحك منصة كاملة تدير عملك من خلالها: خطط تغذية وتمارين بالذكاء الاصطناعي، ومتابعة تقدّم لكل عميل، وصفحة عامة باسمك. أنت من يحدد سعر اشتراك عميلك، وأنت من يحصّله — تحتفظ بكل ما تحصّله، وتقتصر المنصة على رسم ثابت لكل عميل نشط."
              : "Alkemos gives you a complete platform to run your business: AI-generated nutrition and workout plans, progress tracking for every client, and your own public page. You set each client's price and get paid directly — you keep 100% of what you charge; the platform applies a fixed fee per active client only."}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href={REGISTER_HREF}
              className="btn-chrome px-7 py-3 text-sm font-semibold"
            >
              {isAr ? "سجّل كمدرب مجانًا — في دقيقة" : "Register as a coach — free, 1 minute"}
            </Link>
            <Link
              href="#money"
              className="btn-outline px-7 py-3 text-sm font-semibold"
            >
              {isAr ? "اعرف التفاصيل" : "See the details"}
            </Link>
          </div>
          <p className="mt-5 text-xs font-medium text-[var(--muted-foreground)]">
            {isAr
              ? "تفعيل فوري بلا انتظار • بلا بطاقة ائتمان • عملاؤك على المنصة عملاؤك أنت"
              : "Instant activation • No credit card • Your clients stay yours"}
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl shadow-2xl shadow-[#1d1d1f]/10">
          <Image
            src="/images/coach-portrait.jpg"
            alt={isAr ? "مدرب شخصي في النادي الرياضي" : "Personal trainer in the gym"}
            width={1122}
            height={1402}
            className="h-auto w-full object-cover"
            priority
            sizes="(max-width: 768px) 90vw, 420px"
          />
        </div>
      </section>

      {/* Trust strip — chrome stat numbers (identity) */}
      <section className="border-y border-[var(--edge)] bg-[var(--tint)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
          {[
            {
              n: "868+",
              t: isAr ? "تمرين بأدلة أداء كاملة" : "Exercises with guides",
            },
            {
              n: "8,162+",
              t: isAr ? "صنف غذائي بالسعرات والماكروز" : "Foods with full macros",
            },
            {
              n: "EVO",
              t: isAr ? "محرك ذكاء اصطناعي للخطط" : "AI plan engine",
            },
            {
              // PHASE 194 (owner directive — Copy Refinement Pass): «0%
              // commission» invites misreading — the stat now leads with
              // what the coach KEEPS, with the fixed platform fee stated
              // beside it (business model unchanged).
              n: "100%",
              t: isAr
                ? "من ما تحصّله تبقى لك — بلا عمولة، ورسم منصة ثابت لكل عميل نشط"
                : "of what you charge stays yours — 0% revenue commission, fixed platform fee per active client",
            },
          ].map((s) => (
            <div key={s.t}>
              <p className="chrome-text text-2xl font-semibold tracking-tight md:text-3xl">
                {s.n}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--muted-foreground)] md:text-sm">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= YOUR PRICES, YOUR MONEY ================= */}
      <section id="money" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
            {isAr ? "سعر عميلك... قرارك وحدك" : "Your client's price — your call alone"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "لدينا قاعدة واضحة: أسعار عملائك ملكك. أنت من يحدد قيمة الاشتراك وأنت من يحصّل، ودور المنصة أن تسلّحك بأدوات تعمل بها — لا أن تتدخل في سعرك."
              : "One clear rule: your clients' prices belong to you. You decide what to charge, you collect the payment, and the platform's job is to arm you with the tools — not to touch your pricing."}
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              title: isAr ? "حدّد سعرك بحرية" : "Price freely",
              body: isAr
                ? "شهريًا أو بباقة — قيمة اشتراك كل عميل قرارك أنت؛ لكل عميل سعر يناسب عمله، بلا تدخل من أحد."
                : "Monthly or per package — what each client pays is entirely your decision. Every client gets the price that fits your service, with zero interference.",
            },
            {
              title: isAr ? "احصل على أموالك بنفسك" : "Collect yourself",
              body: isAr
                ? "كاش أو فودافون كاش أو InstaPay أو PayPal — العميل يدفع لك مباشرة خارج المنصة، وأموالك معك من اللحظة الأولى بلا أي وسيط."
                : "Cash, Vodafone Cash, InstaPay, or PayPal — clients pay you directly, outside the platform. Your money reaches you first, no middleman in between.",
            },
            {
              title: isAr ? "احتفظ بكل ما تحصّله" : "Keep 100% of what you charge",
              body: isAr
                ? "المنصة لا تأخذ أي نسبة مئوية من دخلك — 0% عمولة إيرادات. ما ينطبق هو رسم منصة ثابت ومعلن لكل عميل نشط فقط، واضح من اليوم الأول بلا مفاجآت."
                : "The site never takes a percentage of your income — 0% revenue commission. Instead, a fixed platform fee applies per active client, transparent from day one, no surprises.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="marble-card p-7"
            >
              <h3 className="text-lg font-bold tracking-tight">{c.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted-foreground)]">{c.body}</p>
            </div>
          ))}
        </div>
        <div className="marble-card mt-6 p-6 text-center">
          <p className="text-sm font-medium leading-relaxed text-[var(--muted-2)]">
            {isAr
              ? "تتم تفعيل اشتراكات عملائك من محفظتك على المنصة: تشحن محفظتك (انستاباي / فودافون كاش / PayPal) وتفعّل اشتراك عميلك بضغطة واحدة."
              : "Client activations run from your on-platform wallet: top it up (InstaPay / Vodafone Cash / PayPal) and activate a client's subscription with one click."}
          </p>
          {/* SEO-GROWTH-P2 (2026-11-05, owner order «إضافة روابط داخلية من
              المقالات والأدوات ذات الصلة»): coaches are the program's
              most natural partner audience — one contextual line, not a
              banner; teaching/coaching stays the page's purpose. */}
          <p className="mt-3 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr ? (
              <>
                لا تريد إدارة عملاء مباشرة الآن؟ يمكنك أيضًا التوصية بالمنصة
                لجمهورك وكسب عمولة عبر{" "}
                <Link href="/ar/affiliate" className="font-medium underline underline-offset-4 hover:text-[var(--text)]">
                  برنامج الأفلييت (الشركاء)
                </Link>
                .
              </>
            ) : (
              <>
                Not ready to manage clients directly yet? You can also
                recommend the platform to your audience and earn a
                commission through the{" "}
                <Link href="/affiliate" className="font-medium underline underline-offset-4 hover:text-[var(--text)]">
                  Alkemos Affiliate Program
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </section>

      {/* ================= YOUR CLIENTS, YOUR AUTHORITY ================= */}
      <section className="bg-[var(--tint)] py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
              {isAr ? "عملاؤك أنت... وصلاحياتك معهم" : "Your clients — and your authority over them"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted-foreground)]">
              {isAr
                ? "المدرب في Alkemos شريك لا موظف. عملاؤك على المنصة عملاؤك أنت — لا عملاء الموقع — وصلاحيات إدارتهم كلها بيدك: استبياناتهم وخططهم وتقدّمهم ودعمهم. والمساعد الذكي (EVO) يعمل في خدمة عملك مع عملائك، ولا يقدّم تدريبًا أونلاين لعملاء من لدن المنصة."
                : "A coach on Alkemos is a partner, not an employee. Your clients on the platform are YOUR clients — not the site's — and every management tool is in your hands: their questionnaires, plans, progress, and support. The AI chat (EVO) works for YOUR business with YOUR clients — the site never coaches them behind your back."}
            </p>
            <ul className="mt-6 space-y-3">
              {[
                isAr ? "إدارة كل عملائك من مكان واحد" : "Manage every client in one place",
                isAr ? "استبيان صحي كامل لكل عميل" : "Full health questionnaire per client",
                isAr ? "متابعة أوزان وصور تقدم" : "Weight logs and progress photos",
                isAr ? "محادثة دعم مباشرة مع كل عميل" : "Direct chat with each client",
              ].map((li) => (
                <li key={li} className="flex items-start gap-2.5 text-sm font-medium">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#878E94" }} />
                  {li}
                </li>
              ))}
            </ul>
            <div className="marble-card mt-6 p-6">
              <h3 className="text-sm font-bold">
                {isAr ? "خطط الذكاء الاصطناعي — رصيد شهري موحد" : "AI plans — one unified monthly balance"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {isAr
                  ? "توليد الخطط لعميلك يسحب من حصته الموحدة حسب باقته — حصة واحدة شهرية تجمع التغذية والتمارين معًا: بريميوم 4 توليدات شهريًا · برو 8 · التدريب الأونلاين 8 (ويورّث كل مزايا برو). وهي الحصة نفسها التي يستخدمها عميلك من EVO وصفحات المخططات؛ تتجدد مع دورة اشتراكه، ولا يُحتسب إلا التوليد الناجح — الفاشل لا يحرق حصة. أما التعديل بيدك ورفع الخطط اليدوية وإعادة توليد أي وجبة أو صنف أو يوم تدريب أو تمرين بالذكاء الاصطناعي — فكلها غير محدودة تمامًا."
                  : "Generating a client's plans draws from their own tier's unified monthly quota — ONE quota for nutrition AND workouts combined: Premium 4 generations/month · Pro 8 · Coaching 8 (inherits every Pro benefit). It is the same quota they spend through EVO and the planner pages; it renews with their subscription cycle, and only successful generations count — failed ones never burn quota. Hand-editing, manual uploads, and AI-regenerating any meal, item, workout day, or exercise are all unlimited."}
              </p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="overflow-hidden rounded-3xl shadow-xl shadow-[#1d1d1f]/10">
              {/* P0-4 (PERFORMANCE-AUDIT-2026-11-08): coaching-1 JPG →
                  responsive WebP triplet (640/828/1200) — displayed at
                  ≤520px here so mobile picks the 640w file (60.3KB vs the
                  old 160KB JPG). Same prebuilt-variant plain-<img> pattern
                  (unoptimized law). */}
              {/* eslint-disable-next-line @next/next/no-img-element -- prebuilt responsive WebP variants (unoptimized law) */}
              <img
                src="/images/hero/coaching-1.webp"
                srcSet="/images/hero/coaching-1-640.webp 640w, /images/hero/coaching-1-828.webp 828w, /images/hero/coaching-1.webp 1200w"
                sizes="(max-width: 768px) 90vw, 520px"
                alt={isAr ? "مدرب يتابع عميله أثناء التمرين" : "Coach guiding a client through training"}
                width={1200}
                height={800}
                className="h-auto w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= MEMBERSHIPS UPSELL ================= */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        {/* Dark band with a chrome ring — identity premium treatment */}
        <div className="rounded-[var(--radius-chrome)] bg-black p-8 text-white md:p-12" style={{ boxShadow: "0 0 0 2px #C9CED3, var(--shadow)" }}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "تريد مميزات الموقع كاملة؟ اشترك في عضوية" : "Want every site feature? Grab a membership"}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#9BA0A6]">
            {isAr
              ? "مثل أي عضو على المنصة، يمكنك الاشتراك في عضوية Premium أو Pro والحصول على كل مميزات الموقع لنفسك: محادثة EVO بلا حدود، ومخطط الوجبات الذكي، وحفظ نتائج الحاسبات وتصديرها — إلى جانب عملك مع عملائك."
              : "Like anyone on the platform, you can subscribe to Premium or Pro and unlock the full site for yourself: unlimited EVO chat, the smart meal planner, and saved, exportable calculator results — all alongside your work with your own clients."}
          </p>
          <div className="mt-6">
            <Link
              href={isAr ? "/ar/memberships" : "/memberships"}
              className="btn-chrome inline-block px-7 py-3 text-sm font-semibold"
            >
              {isAr ? "استعرض العضويات" : "Explore memberships"}
            </Link>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how" className="mx-auto max-w-6xl px-4 pb-16 md:pb-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
            {isAr ? "ابدأ عملك في 4 خطوات" : "Start in 4 steps"}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {[
            {
              n: "1",
              t: isAr ? "سجّل مجانًا" : "Register free",
              b: isAr
                ? "دقيقة واحدة وتفعيل فوري — بلا انتظار مراجعة ولا أوراق."
                : "One minute, instant activation — no review queue, no paperwork.",
            },
            {
              n: "2",
              t: isAr ? "أضف عملاءك" : "Add your clients",
              b: isAr
                ? "كل عميل له مساحته الخاصة: استبيانه، خططه، ومتابعة تقدمه."
                : "Each client gets a private space: questionnaire, plans, progress.",
            },
            {
              n: "3",
              t: isAr ? "جهّز الخطط" : "Build the plans",
              b: isAr
                ? "ولّد خططًا بالذكاء الاصطناعي أو ارفع خططك اليدوية — كلاهما متاح."
                : "Generate plans with AI or upload your own — both work, always.",
            },
            {
              n: "4",
              t: isAr ? "حدد سعرك وفعّل" : "Price it & activate",
              b: isAr
                ? "أنت من يحصّل من عميلك، ثم تفعّل اشتراكه من محفظتك على المنصة."
                : "You get paid by your client, then activate them from your wallet.",
            },
          ].map((s) => (
            <div key={s.n} className="marble-card p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)] text-sm font-bold text-[var(--text)]">
                {s.n}
              </span>
              <h3 className="mt-3.5 text-base font-bold tracking-tight">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES WITH IMAGES ================= */}
      <section className="mx-auto max-w-6xl space-y-10 px-4 pb-16 md:pb-20">
        {[
          {
            img: "/images/meal-nutrition.jpg",
            w: 1254,
            h: 1254,
            alt: isAr ? "خطة تغذية صحية" : "Healthy nutrition plan",
            t: isAr ? "خطط تغذية بالذكاء الاصطناعي" : "AI nutrition plans",
            b: isAr
              ? "يولّد محرك EVO لكل عميل خطة تغذية تناسب هدفه واحتياجاته بالسعرات والماكروز — عدّل كل وجبة بيدك، أو أعد توليد أي وجبة أو صنف غذائي بالذكاء الاصطناعي بضغطة زر حتى تناسب ذوق عميلك."
              : "The EVO engine builds each client a nutrition plan around his goal, with full calorie and macro targets — hand-tune every meal, or AI-regenerate any meal or food item with one tap until it fits your client perfectly.",
          },
          {
            img: "/images/dumbbell-gym.jpg",
            w: 1920,
            h: 1080,
            alt: isAr ? "دمبل في النادي الرياضي" : "Dumbbells in the gym",
            t: isAr ? "برامج تمارين من مكتبة 868+ تمرين" : "Workout programs from an 868+ exercise library",
            b: isAr
              ? "برامج تمارين متكيّفة بمستويات مختلفة، ومكتبة تمارين مشروحة خطوة بخطوة يمكنك بناء أي جلسة منها — ويمكنك أيضًا إعادة توليد أي يوم تدريبي كامل أو استبدال أي تمرين بالذكاء الاصطناعي."
              : "Adaptive workout programs across levels, plus a fully-guided exercise library you can build any session from — and you can AI-regenerate any full training day or swap any exercise.",
          },
        ].map((f) => (
          <div
            key={f.t}
            className="marble-card grid items-center gap-8 p-6 md:grid-cols-2 md:p-8"
          >
            <div className="overflow-hidden rounded-2xl">
              <Image
                src={f.img}
                alt={f.alt}
                width={f.w}
                height={f.h}
                className="h-auto w-full object-cover"
                sizes="(max-width: 768px) 90vw, 480px"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight md:text-2xl">{f.t}</h3>
              <p className="mt-3 text-base leading-relaxed text-[var(--muted-foreground)]">{f.b}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="mx-auto max-w-4xl px-4 pb-16 md:pb-20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
            {isAr ? "أسئلة المدربين" : "Coach FAQs"}
          </h2>
        </div>
        <div className="mt-10 space-y-4">
          {(isAr ? COACH_FAQ_AR : COACH_FAQ_EN).map((f) => (
            <div key={f.q} className="marble-card p-6">
              <h3 className="text-base font-bold tracking-tight">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SHARE (TEXT-ONLY BUTTONS) ================= */}
      <section className="border-t border-[var(--edge)] bg-[var(--tint)] py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            {isAr ? "تعرف مدربًا يستحق أن يعمل معنا؟" : "Know a coach who should be here?"}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {isAr
              ? "شاركه هذه الصفحة — عمل كامل بأسعاره وفلوسه في يده."
              : "Send him this page — a full business at his own prices, in his own hands."}
          </p>
          <div className="mt-6">
            <CoachShareButtons
              path="/for-coaches"
              message={shareMsg}
              labels={{
                facebook: isAr ? "فيسبوك" : "Facebook",
                x: "X",
                telegram: "Telegram",
                copy: isAr ? "نسخ الرابط" : "Copy link",
                copied: isAr ? "تم النسخ" : "Copied",
              }}
            />
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
          {isAr ? "جاهز لتبني عملك على منصة تليق به؟" : "Ready to build your business on a platform that fits it?"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-[var(--muted-foreground)]">
          {isAr
            ? "سجّل الآن — يتفعّل حسابك فورًا، وتبدأ بإضافة عملائك وتحديد أسعارك من اليوم الأول."
            : "Sign up now — your account activates instantly, and you can add clients and set your prices from day one."}
        </p>
        <Link
          href={REGISTER_HREF}
          className="btn-chrome mt-7 inline-block px-9 py-3.5 text-sm font-semibold"
        >
          {isAr ? "أنشئ حسابك كمدرب — مجانًا" : "Create your coach account — free"}
        </Link>
      </section>


      {/* Access-point fix (2026-09-14): shared marble footer — this
          public page now carries the same persistent link grid as the
          homepage (SiteFooter component). */}
      <SiteFooter />
    </div>
  );
}