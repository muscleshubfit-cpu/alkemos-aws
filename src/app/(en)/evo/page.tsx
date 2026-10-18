"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { ShareButtons } from "@/components/ShareButtons";
import {
  Brain,
  TrendingUp,
  RefreshCw,
  MessageCircle,
  Dumbbell,
  Apple,
  BarChart3,
  Sparkles,
  GraduationCap,
  ArrowRight,
  Info,
  Zap,
  Clock,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { ThemeImg } from "@/components/ThemeImg";
import { openEvoFloatingChat } from "@/lib/evo-chat-events";
import { EVO_FAQ } from "@/lib/evo-faq";

export default function EvoPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const features = [
    {
      icon: Brain,
      titleAr: "رد مبني على قياساتك",
      titleEn: "Answers Based On Your Measurements",
      descAr: "مع اشتراك فعّال يأخذ EVO قياساتك الأخيرة في الحسبان (الوزن ومحيط الخصر) عند صياغة إجاباته لك.",
      descEn: "With an active subscription EVO factors in your latest measurements (weight & waist) when answering.",
      color: "#0071e3",
    },
    {
      icon: TrendingUp,
      titleAr: "خطط محفوظة في حسابك",
      titleEn: "Plans Saved To Your Account",
      descAr: "مع اشتراك فعّال يمكنك حفظ الخطة التي يبنيها EVO لك في حسابك كخطة كاملة في لوحة خططك — لا مجرد نص في محادثة.",
      descEn: "With an active subscription, plans EVO builds for you can be saved to your account as full plans in your plans dashboard — not just chat text.",
      color: "#34c759",
    },
    {
      icon: RefreshCw,
      titleAr: "استبدالات ذكية بعداد",
      titleEn: "Smart Swaps With A Counter",
      descAr: "استبدل أي وجبة أو تمرين بضغطة واحدة، مع عداد واضح يبيّن رصيدك الأسبوعي — وتُحفظ النتيجة في خطتك تلقائيًا.",
      descEn: "Swap any meal or exercise in one tap, with a clear weekly counter — and the result is saved into your plan.",
      color: "#ff9500",
    },
    {
      icon: MessageCircle,
      titleAr: "استشارات فورية على مدار الساعة",
      titleEn: "Instant Consultations 24/7",
      descAr: "اسأل EVO أي سؤال عن التغذية، التمارين، المكملات، أو التحفيز — في أي وقت.",
      descEn: "Ask EVO any question about nutrition, exercises, supplements, or motivation — anytime.",
      color: "#8b5cf6",
    },
    {
      icon: Dumbbell,
      titleAr: "تبديل التمارين بذكاء",
      titleEn: "Smart Exercise Swaps",
      descAr: "لا ترغب في تمرين معيّن؟ يقترح EVO بديلًا يناسب عضلاتك ومستواك ومعداتك.",
      descEn: "Don't want a specific exercise? EVO suggests alternatives matching your muscles, level, and equipment.",
      color: "#ff3b30",
    },
    {
      icon: Apple,
      titleAr: "تبديل الوجبات بذكاء",
      titleEn: "Smart Meal Swaps",
      descAr: "لا تحب وجبة معيّنة؟ يقترح EVO بديلًا بنفس الماكروز والسعرات تمامًا.",
      descEn: "Don't like a meal? EVO suggests alternatives with the exact same macros and calories.",
      color: "#34c759",
    },
    {
      icon: BarChart3,
      titleAr: "تتبع تقدمك",
      titleEn: "Progress Tracking",
      descAr: "يقرأ EVO وزنك وقياساتك وتقدمك، ويستخدمها في بناء خططك.",
      descEn: "EVO reads your weight, measurements, and progress, and uses them to build your plans.",
      color: "#0071e3",
    },
    {
      icon: GraduationCap,
      titleAr: "يتعلم من خطط المنصة",
      titleEn: "Learns From Platform Plans",
      descAr: "يستخلص EVO أسبوعيًا المعرفة الغذائية من كل الخطط الحقيقية على المنصة (مجهولة الهوية بالكامل) — خطط المدربين المعتمدة وخطط المستخدمين وأنماط الاستبدال الفعلية — فتتطور خططك مع سلوك حقيقي لا قوالب ثابتة.",
      descEn: "EVO weekly distills nutrition knowledge from every real plan on the platform (fully anonymized) — approved coach plans, user plans, and actual swap behavior — so your plans evolve with real behavior, not static templates.",
      color: "#af52de",
    },
    {
      icon: Sparkles,
      titleAr: "متاح للجميع — مجانًا",
      titleEn: "Available to Everyone — Free",
      descAr: "افتح EVO وابدأ فورًا: 10 رسائل يوميًا، ورصيد شهري موحد لتوليد خطط التغذية والتمارين (توليدان للمجاني، ويرتفع إلى 8 مع أعلى الباقات) — المشتركون يحصلون على رصيد أكبر ومزايا أعمق.",
      descEn: "Open EVO and start instantly: 10 messages/day, plus one unified monthly pool for nutrition & workout plan generation (2 on Free, up to 8 on the top tiers) — subscribers get a bigger pool and deeper features.",
      color: "#ff9500",
    },
  ];

  const differences = [
    {
      chatbotAr: "يجيب بإجابات عامة",
      chatbotEn: "Replies with generic answers",
      evoAr: "يجيب بناءً على بياناتك أنت",
      evoEn: "Replies based on YOUR data",
    },
    {
      chatbotAr: "معرفته ثابتة لا تتغيّر",
      chatbotEn: "Static knowledge that never grows",
      evoAr: "يتعلّم أسبوعيًا من خطط المنصة الحقيقية (مجهولة الهوية)",
      evoEn: "Learns weekly from real platform plans (anonymized)",
    },
    {
      chatbotAr: "لا ذاكرة لجسمك",
      chatbotEn: "No memory of your body",
      // PHASE 194 (owner directive — Copy Refinement Pass): Memory is
      // stated explicitly — EVO remembers your fitness data, goals,
      // preferences, and progress (evo_memory, 0078).
      evoAr: "يتذكّر بياناتك وأهدافك وتفضيلاتك وتقدّمك",
      evoEn: "Remembers your fitness data, goals, preferences, and progress",
    },
    {
      chatbotAr: "لا يتدخّل في خطتك",
      chatbotEn: "Doesn't interact with your plan",
      evoAr: "يستطيع حفظ خطتك في لوحة خططك",
      evoEn: "Can save your plan to your plans dashboard",
    },
    {
      chatbotAr: "لا تحليل للأنماط",
      chatbotEn: "No pattern analysis",
      evoAr: "يأخذ قياساتك الأخيرة في الحسبان",
      evoEn: "Factors in your latest measurements",
    },
    {
      chatbotAr: "متاح للمشتركين فقط عادةً",
      chatbotEn: "Usually for subscribers only",
      evoAr: "متاح للجميع بحدود مختلفة",
      evoEn: "Available to everyone with different limits",
    },
    {
      chatbotAr: "تضيع محادثتك بمجرّد إغلاق الصفحة",
      chatbotEn: "Your chat vanishes when you close the page",
      // PHASE 194: Chat History is distinct from Memory — history is
      // saved and synced according to your plan (cross-device restore is
      // a subscriber benefit; free accounts keep history on their device).
      evoAr: "تُحفظ محادثتك ويمكن مزامنتها عبر أجهزتك حسب خطتك",
      evoEn: "Your chat history can be saved and synced across devices according to your plan",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader variant="landing" />

      <main className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center">
          <div className="marble-card mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <ThemeImg
              light="/images/brand/evo-widget-light.webp"
              dark="/images/brand/evo-widget-dark.webp"
              alt="EVO"
              width={80}
              height={80}
              className="h-20 w-20 rounded-2xl object-cover"
            />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            {/* CONTENT-AUDIT P2-5 (audit §2.5): bare "EVO" told neither
                engine nor reader anything out of context — the H1 now
                carries the entity descriptor, matching the canonical
                «مدربك الذكي» used across the site. */}
            EVO — {isAr ? "مدربك الذكي" : "your AI coach"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-lg font-normal text-[var(--muted-foreground)] md:text-xl">
            {isAr
              ? "محرك أداء ذكي — ليس مجرد روبوت محادثة."
              : "An intelligent performance engine — not just a chatbot."}
          </p>

          {/* Two CTAs — visually different */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {/* Start Conversation — opens the floating EVO chat drawer
                (EVO CHAT SURFACE LAW 2026-08-27: the widget is the only
                chat surface — this used to link to the removed /chat) */}
            <button
              type="button"
              onClick={openEvoFloatingChat}
              className="btn-chrome group inline-flex cursor-pointer items-center gap-3 px-6 py-3 text-base"
            >
              <ThemeImg
                light="/images/brand/evo-widget-light.webp"
                dark="/images/brand/evo-widget-dark.webp"
                alt="EVO"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span>{isAr ? "ابدأ المحادثة مع EVO" : "Start chatting with EVO"}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>

            {/* Learn More — different visual style (outline) */}
            <a
              href="#features"
              className="btn-outline px-6 py-3 text-base font-normal"
            >
              <Info className="h-4 w-4" />
              <span>{isAr ? "اعرف أكثر عن EVO" : "Learn more about EVO"}</span>
            </a>
          </div>

          {/* Owner's EVO warrior artwork (transparent cutout — white page bg
              keeps the cutout edges invisible) */}
          <div className="relative mx-auto mt-10 max-h-[520px] w-fit">
            <Image
              src="/images/brand/evo-character.webp"
              alt={isAr ? "محارب EVO بالدرع السبارتي — مدربك الذكي من Alkemos" : "EVO warrior in Spartan armor — Alkemos smart assistant"}
              width={874}
              height={1000}
              sizes="(max-width: 768px) 90vw, 480px"
              className="mx-auto h-auto max-h-[520px] w-auto object-contain"
              priority
            />
          </div>
        </section>

        {/* What is EVO? — marble-card (identity) */}
        <section className="marble-card mt-16 p-6 md:p-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "ما هو EVO؟" : "What is EVO?"}
          </h2>
          <p className="mt-4 text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "EVO هو محرك أداء ذكي مبني على الذكاء الاصطناعي، صُمم خصيصًا لمساعدتك على الوصول إلى أهدافك الرياضية والغذائية بشكل أسرع وأذكى. ليس مجرد روبوت محادثة يجيب على أسئلتك — بل يحلّل EVO بياناتك، ويفهم جسمك، ويتابع تقدّمك ويتذكّر ما تخبره به ليقدّم لك نصائح مخصّصة لك وحدك، ويتعلّم أسبوعيًا من خطط المنصة الحقيقية."
              : "EVO is an AI-powered performance engine designed specifically to help you reach your fitness and nutrition goals faster and smarter. Not just a chatbot that answers your questions — EVO analyzes your data, understands your body, follows your progress, and remembers what you tell it to give you personalized advice, while learning weekly from real platform plans."}
          </p>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)] md:text-lg">
            {isAr
              ? "يدمج معرفة المدربين البشريين مع سرعة ودقة الذكاء الاصطناعي في نظام واحد متكامل."
              : "It combines human coach expertise with AI speed and precision in one integrated system."}
          </p>
        </section>

        {/* EVO vs Chatbot — the key difference (identity: EVO column gets
            the tint + chrome inline treatment like the Alkemos column in
            the homepage comparison table) */}
        <section id="features" className="mt-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "ما الفرق بين EVO وروبوت المحادثة العادي؟" : "What's the difference between EVO and a regular chatbot?"}
          </h2>
          <div className="marble-card mt-8 overflow-hidden">
            <div className="grid grid-cols-3 bg-[var(--tint)]">
              <div className="p-4 text-center text-xs font-medium text-[var(--muted-foreground)]">
                {isAr ? "المقارنة" : "Comparison"}
              </div>
              <div className="border-s border-[var(--edge)] p-4 text-center text-xs font-medium text-[var(--muted-foreground)]">
                {isAr ? "روبوت محادثة عادي" : "Regular Chatbot"}
              </div>
              <div className="p-4 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text)]">
                EVO
              </div>
            </div>
            {differences.map((diff, i) => (
              <div key={i} className="grid grid-cols-3 border-t border-[var(--edge)]">
                <div className="p-4 text-sm font-medium text-[var(--text)]">
                  {i + 1}
                </div>
                <div className="border-s border-[var(--edge)] p-4 text-sm font-normal text-[var(--muted-foreground)]">
                  <span className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted-foreground)] opacity-60" />
                    <span>{isAr ? diff.chatbotAr : diff.chatbotEn}</span>
                  </span>
                </div>
                <div className="bg-[var(--tint)] p-4 text-sm font-normal text-[var(--text)]" style={{ borderInline: "var(--border-chrome)" }}>
                  <span className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#878E94" }} />
                    <span>{isAr ? diff.evoAr : diff.evoEn}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section className="mt-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "ما الذي يفعله EVO؟" : "What can EVO do?"}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="marble-card p-6 transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--edge)] bg-[var(--tint)]">
                      <Icon className="h-6 w-6 text-[var(--muted-2)]" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight">
                        {isAr ? feature.titleAr : feature.titleEn}
                      </h3>
                      <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                        {isAr ? feature.descAr : feature.descEn}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How EVO works — marble-card (identity) */}
        <section className="marble-card mt-16 p-6 text-[var(--text)] md:p-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "كيف يعمل EVO؟" : "How does EVO work?"}
          </h2>
          <div className="mt-6 space-y-6">
            {[
              {
                num: "01",
                titleAr: "يجمع بياناتك",
                titleEn: "Collects your data",
                descAr: "يقرأ EVO استبياناتك ووزنك وقياساتك وخططك وتقدّمك.",
                descEn: "EVO reads your questionnaires, weight, measurements, plans, and progress.",
              },
              {
                num: "02",
                titleAr: "يفهم هدفك",
                titleEn: "Understands your goal",
                descAr: "يقرأ استبياناتك وهدفك ومستواك قبل بناء أي خطة.",
                descEn: "Reads your questionnaires, goal, and level before building any plan.",
              },
              {
                num: "03",
                titleAr: "يبني خطتك",
                titleEn: "Builds your plan",
                descAr: "خطط تغذية وتمارين مخصّصة بناءً على بياناتك، ضمن حدود عضويتك.",
                descEn: "Personalized nutrition and workout plans based on your data, within your membership limits.",
              },
              {
                num: "04",
                titleAr: "يقترح التعديلات",
                titleEn: "Suggests adjustments",
                descAr: "كلما احتجت، يقترح EVO بدائل ذكية للوجبات والتمارين فورًا.",
                descEn: "Whenever you need, EVO suggests smart meal and exercise swaps on the spot.",
              },
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)] text-sm font-semibold text-[var(--text)]">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-base font-semibold">
                    {isAr ? step.titleAr : step.titleEn}
                  </h3>
                  <p className="mt-1 text-sm font-normal text-[var(--muted-foreground)]">
                    {isAr ? step.descAr : step.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRIORITY-PAGES Implementation 2 (2026-10-19, audit §B-1 +
            Improvement 2): "What to ask EVO?" — EVO holds the site's best
            measured standing position (26 impr @ 4.65) yet shipped with no
            conversation sample and no FAQ. This section shows the product
            in action before the first message. The sample exchange is
            explicitly labeled an illustrative model (نموذج توضيحي) — the
            arithmetic inside it is USDA-consistent (120g drained tuna ≈
            116 kcal + 40g wholegrain bread ≈ 95 → "about 200 kcal",
            ~28g protein → "nearly 30g"). */}
        <section className="marble-card mt-16 p-6 text-[var(--text)] md:p-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "ماذا تسأل EVO؟" : "What would you ask EVO?"}
          </h2>
          <p className="mt-3 text-base font-normal leading-relaxed text-[var(--muted-foreground)]">
            {isAr
              ? "أسئلة من واقع الحياة اليومية — اطرحها كما هي، أو صُغها بأسلوبك:"
              : "Questions from everyday training life — ask them as written, or in your own words:"}
          </p>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              isAr ? "عندي مناسبة الجمعة وأريد تركيزًا على الكتف — رتب لي الأسبوع."
                : "I have an event this Friday and want a shoulder focus — rearrange my week for me.",
              isAr ? "سفري الأسبوع القادم بلا نادٍ — بدّل لي تمارين الأسبوع بما يناسب وزن الجسم."
                : "I'm traveling next week with no gym — swap my week to bodyweight work.",
              isAr ? "أكلت خارج الخطة اليوم بـ300 سعرة — كيف أعوّض دون كسر الأسبوع؟"
                : "I ate 300 kcal over plan today — how do I make it up without breaking the week?",
              isAr ? "كم أرفع وزنًا هذا الأسبوع على أساس تقدمي؟"
                : "How much weight should I add this week based on my progress?",
              isAr ? "بدّل تمرين اليوم لآخر لعضلة الفخذ وأنا مسافر."
                : "Swap today's exercise for another quad movement — I'm away.",
              isAr ? "وجبة غنية بالبروتين مما تبقى في مطبخي الليلة؟"
                : "A high-protein meal from what's left in my kitchen tonight?",
              isAr ? "ما الفرق بين النظام العالي البروتين والمتوازن لعادتي؟"
                : "What's the difference between high-protein and balanced for my routine?",
              isAr ? "خطة يوم كامل بـ2,000 سعرة واحفظها في لوحة خططي."
                : "Build me a full 2,000-calorie day and save it to my plans.",
            ].map((example) => (
              <li
                key={example}
                className="flex items-start gap-2.5 rounded-2xl border border-[var(--edge)] bg-[var(--tint)] p-4 text-sm font-normal leading-relaxed text-[var(--text)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted-2)]" aria-hidden="true" />
                <span>{example}</span>
              </li>
            ))}
          </ul>
          {/* The sample exchange — labeled illustrative; real answers are
              built from the user's own data. */}
          <div className="mt-8 rounded-2xl border border-[var(--edge)] bg-[var(--card)] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {isAr ? "نموذج توضيحي لشكل المحادثة" : "An illustrative sample of the conversation"}
            </p>
            <div className="mt-4 space-y-3 text-sm font-normal leading-relaxed">
              <p className="text-[var(--text)]">
                {isAr ? "أنت: «عندي 200 سعرة فاضلة اليوم — أين أصرفها؟»" : "You: \"I have 200 kcal to spare today — where should I spend them?\""}
              </p>
              <p className="text-[var(--muted-foreground)]">
                {isAr
                  ? "EVO: «الأسهل بعد تمرينك: تونة مصفاة 120غ مع 40غ خبز أسمر — نحو 200 سعرة وقرابة 30غ بروتين تخدم اليوم بلا أن تكسر أسبوعك. وإن كنت تدّخرها لغدٍ فاجعلها جزءًا من فطور أطول.» — والمخرج الفعلي يُبنى على بياناتك أنت."
                  : "EVO: \"Easiest after your workout: 120g drained tuna with 40g wholegrain bread — about 200 kcal and nearly 30g of protein, serving today without breaking your week. And if you'd rather save them for tomorrow, fold them into a longer breakfast.\" — your real answer is built from your own data."}
              </p>
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Zap, labelAr: "فوري", labelEn: "Instant", descAr: "ردود في ثواني", descEn: "Replies in seconds" },
            { icon: Clock, labelAr: "24/7", labelEn: "24/7", descAr: "متاح في كل وقت", descEn: "Always available" },
            { icon: Shield, labelAr: "آمن", labelEn: "Secure", descAr: "بياناتك مشفرة", descEn: "Your data is encrypted" },
            { icon: Sparkles, labelAr: "متاح", labelEn: "Available", descAr: "للجميع", descEn: "For everyone" },
          ].map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div key={i} className="marble-card p-4 text-center">
                <Icon className="mx-auto h-6 w-6 text-[var(--muted-2)]" />
                <p className="mt-2 text-sm font-semibold">
                  {isAr ? badge.labelAr : badge.labelEn}
                </p>
                <p className="mt-0.5 text-xs font-normal text-[var(--muted-foreground)]">
                  {isAr ? badge.descAr : badge.descEn}
                </p>
              </div>
            );
          })}
        </section>

        {/* Free vs Subscriber comparison — EVO/Subscriber column gets the
            identity tint + chrome treatment. PHASE 183 rewrite (owner
            directive 2026-09-13): the old pre-unified-pool rows are gone —
            every cell below mirrors the ACTUAL enforcement (ai_plan_usage
            unified pool · swaps weekly paid-only · measurements paid-only ·
            memory free-with-account D1 · cross-device history paid-only).
            The old "blog summary vs full summary" split was never
            implemented — removed. Phase 185 (owner directive, same day):
            the intro carries the UNIFIED SAVE LADDER (no account → device ·
            free account → permanent save + cross-device sync · paid →
            broader management + per-tier benefits), mirroring
            plan-persistence.ts, and the plan-save row is scoped to the
            EVO-chat surface (the widget save button is subscriber-gated —
            EvoFloatingWidget isSubscriber && planKind). */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "EVO للمجاني مقابل EVO للمشتركين" : "EVO on Free vs Subscribers"}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm font-normal text-[var(--muted-foreground)]">
            {isAr
              ? "EVO متاح للجميع: توليد خطط التغذية والتمارين يسحب من رصيد شهري موحد واحد، والمحادثة اليومية عدّاد منفصل عنه — والمشتركون يحصلون على رصيد أكبر ومزايا أعمق. وفي حفظ الخطط: بدون حساب تبقى خطتك على جهازك، وبحساب مجاني تُحفظ دائمًا في حسابك وتتزامن عبر أجهزتك، ومع الاشتراك تحصل على إدارة أوسع ومزايا إضافية حسب باقتك."
              : "EVO is available to everyone: nutrition & workout plan generation draws from ONE unified monthly pool, daily chat is a separate counter — and subscribers get a bigger pool and deeper features. On saving plans: no account keeps your plan on this device, a free account saves it permanently in your account & syncs it across your devices, and a subscription adds broader management and extra benefits per plan."}
          </p>

          <div className="marble-card mt-8 overflow-hidden">
            <div className="grid grid-cols-3 bg-[var(--tint)]">
              <div className="p-4 text-center text-xs font-medium text-[var(--muted-foreground)]">
                {isAr ? "الميزة" : "Feature"}
              </div>
              <div className="border-s border-[var(--edge)] p-4 text-center text-xs font-medium text-[var(--muted-foreground)]">
                {isAr ? "المجاني / الزائر" : "Free / Visitor"}
              </div>
              <div className="p-4 text-center text-xs font-semibold text-[var(--text)]">
                {isAr ? "مشترك" : "Subscriber"}
              </div>
            </div>
            {[
              {
                featAr: "توليد خطط AI (تغذية + تمرين من رصيد واحد)",
                featEn: "AI plan generation (nutrition + workout, one pool)",
                freeAr: "✓ توليدان شهريًا — لكل زائر",
                freeEn: "✓ 2/month — for every visitor",
                subAr: "✓ 4–8 شهريًا حسب باقتك",
                subEn: "✓ 4–8/month by tier",
              },
              {
                featAr: "المحادثة",
                featEn: "Chat",
                freeAr: "✓ 10 رسائل يوميًا",
                freeEn: "✓ 10 messages a day",
                subAr: "✓ غير محدود",
                subEn: "✓ Unlimited",
              },
              {
                featAr: "التوجيه لصفحات المنصة",
                featEn: "Platform page guidance",
                freeAr: "✓",
                freeEn: "✓",
                subAr: "✓",
                subEn: "✓",
              },
              {
                featAr: "الإجابة من مدونة المنصة مع الروابط",
                featEn: "Answers with platform blog links",
                freeAr: "✓",
                freeEn: "✓",
                subAr: "✓",
                subEn: "✓",
              },
              {
                featAr: "حفظ خطط EVO من المحادثة إلى لوحة خططك",
                featEn: "Save EVO chat plans to your plans dashboard",
                freeAr: "✗ (يبقى نصًا في محادثتك)",
                freeEn: "✗ (stays as chat text)",
                subAr: "✓ في لوحة خططك",
                subEn: "✓ in your plans dashboard",
              },
              {
                featAr: "تبديل الوجبات/التمارين داخل خطتك",
                featEn: "Meal/exercise swaps in your plan",
                freeAr: "✗ (نصائح عامة)",
                freeEn: "✗ (general tips)",
                subAr: "✓ 3–6 أسبوعيًا حسب باقتك",
                subEn: "✓ 3–6/week by tier",
              },
              {
                featAr: "رد مبني على قياساتك (الوزن والخصر)",
                featEn: "Answers based on your measurements (weight & waist)",
                freeAr: "✗",
                freeEn: "✗",
                subAr: "✓",
                subEn: "✓",
              },
              {
                featAr: "ذاكرة EVO الدائمة (أهدافك وتفضيلاتك)",
                featEn: "EVO permanent memory (your goals & preferences)",
                freeAr: "✓ (بحساب مجاني)",
                freeEn: "✓ (with a free account)",
                subAr: "✓",
                subEn: "✓",
              },
              {
                featAr: "استرجاع سجل المحادثة الكامل عبر الأجهزة",
                featEn: "Full chat-history restore across devices",
                freeAr: "✗ (على جهازك فقط)",
                freeEn: "✗ (on your device only)",
                subAr: "✓",
                subEn: "✓",
              },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-t border-[var(--edge)]">
                <div className="p-3 text-xs font-medium text-[var(--text)]">
                  {isAr ? row.featAr : row.featEn}
                </div>
                <div className="border-s border-[var(--edge)] p-3 text-xs font-normal text-[var(--muted-foreground)]">
                  {isAr ? row.freeAr : row.freeEn}
                </div>
                <div className="bg-[var(--tint)] p-3 text-xs font-medium text-[var(--text)]" style={{ borderInline: "var(--border-chrome)" }}>
                  {isAr ? row.subAr : row.subEn}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* One subscription for everything — dark marble band with a chrome
            ring (identity premium treatment; replaces the old
            black-to-blue gradient — zero-blue law) */}
        <section className="mt-12 rounded-[var(--radius-chrome)] bg-black p-8 text-center text-white md:p-12" style={{ boxShadow: "0 0 0 2px #C9CED3, var(--shadow)" }}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "اشتراك واحد. كل الخدمات." : "One subscription. Everything."}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-medium text-white/80">
            {isAr
              ? "يشمل اشتراك التدريب الأونلاين: EVO بكل ميزاته + خطط تغذية مخصّصة + برامج تمارين + متابعة شخصية + كل أدوات المنصة. بلا أي زيادة في السعر."
              : "Coaching subscription includes: EVO with full features + personalized nutrition plans + workout programs + personal follow-up + all platform tools. No extra cost."}
          </p>
          <a
            href="/memberships"
            className="btn-chrome mt-6 inline-block px-6 py-3 text-base"
          >
            {isAr ? "اطّلع على الباقات ›" : "See plans ›"}
          </a>
        </section>

        {/* EVO internal-linking hub (intent-map audit 2026-09-14, item 8):
            EVO is the single primary page for the AI-coach intent — this
            grid ties the surrounding AI surfaces (the two planners), the
            human-coaching path, the free tools, and the program library
            into it, so the intent cluster is one crawlable hop away in
            BOTH directions. Language-aware hrefs: the AR mirror links its
            own /ar/* versions. */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "تكامل EVO مع باقي المنصة" : "How EVO fits the platform"}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                href: isAr ? "/ar/ai-meal-planner" : "/ai-meal-planner",
                titleAr: "مخطط الوجبات بالذكاء الاصطناعي",
                titleEn: "AI Meal Planner",
                descAr: "ولّد خطة تغذية كاملة — مجانًا.",
                descEn: "Generate a full nutrition plan — free to try.",
              },
              {
                href: isAr ? "/ar/ai-workout-planner" : "/ai-workout-planner",
                titleAr: "مخطط التمارين بالذكاء الاصطناعي",
                titleEn: "AI Workout Planner",
                descAr: "ولّد تقسيمة أسبوعية لتمارينك من بياناتك.",
                descEn: "Generate your weekly training split from your data.",
              },
              {
                href: isAr ? "/ar/coaching" : "/coaching",
                titleAr: "التدريب الأونلاين مع مدربين بشريين",
                titleEn: "Human Online Coaching",
                descAr: "مدرب بشري يبني خططك ويتابعك أسبوعيًا.",
                descEn: "A human coach builds your plans and checks in weekly.",
              },
              {
                href: isAr ? "/ar/tools" : "/tools",
                titleAr: "الأدوات والحاسبات المجانية",
                titleEn: "Free Fitness Tools",
                descAr: "سعرات، ماكروز، BMI، دهون الجسم، ومتتبع الماء.",
                descEn: "Calories, macros, BMI, body fat, and water tracker.",
              },
              {
                href: isAr ? "/ar/programs" : "/programs",
                titleAr: "برامج التدريب الجاهزة",
                titleEn: "Ready Workout Programs",
                descAr: "برامج جاهزة من المنزل والنادي لكل المستويات.",
                descEn: "Ready home & gym programs for every level.",
              },
              {
                href: isAr ? "/ar/memberships" : "/memberships",
                titleAr: "العضويات والأسعار",
                titleEn: "Memberships & Pricing",
                descAr: "قارن الباقات وحدود الاستخدام بشفافية.",
                descEn: "Compare tiers and limits transparently.",
              },
            ].map((card) => (
              <a
                key={card.href}
                href={card.href}
                className="marble-card block p-5 transition-opacity hover:opacity-90"
              >
                <p className="text-base font-semibold tracking-tight text-[var(--text)]">
                  {isAr ? card.titleAr : card.titleEn}
                </p>
                <p className="mt-1 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">
                  {isAr ? card.descAr : card.descEn}
                </p>
              </a>
            ))}
          </div>
        </section>

        {/* PRIORITY-PAGES Implementation 2 (2026-10-19): the FAQ this page
            never had — the decision questions (privacy, data, limits) lived
            only inside the comparison tables, never in the indexable
            Q&A format. Plain visible HTML from the same single-source
            array (src/lib/evo-faq.ts) that the language layouts emit as
            FAQPage JSON-LD (the coaching-faq.ts precedent, audit P1-2). */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "أسئلة شائعة حول EVO" : "EVO frequently asked questions"}
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-4">
            {EVO_FAQ[isAr ? "ar" : "en"].map((faq) => (
              <div key={faq.q} className="marble-card p-5">
                <h3 className="text-sm font-semibold text-[var(--text)]">{faq.q}</h3>
                <p className="mt-1.5 text-sm font-normal leading-relaxed text-[var(--muted-foreground)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA — two buttons again. Dark marble band in BOTH themes
            (identity premium treatment), so the text is pinned to the
            light-on-dark pair instead of var(--text) (which would render
            black-on-black in light mode). */}
        <section className="marble-card mt-12 p-8 text-center text-[#F5F5F7] md:p-12" style={{ backgroundColor: "#0B0B0D" }}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isAr ? "هل أنت جاهز لتجربة EVO؟" : "Ready to try EVO?"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base font-medium text-[#9BA0A6]">
            {isAr
              ? "ابدأ المحادثة الآن — مجانًا. وعندما يكبر استخدامك: بريميوم لإدارة خططك وحفظها، وبرو لتكييفها وتحسينها، ولكي يرافقك مدرب بشري — التدريب الأونلاين."
              : "Start chatting now — free to try. When your usage grows: Premium to manage your plans, Pro to adapt & optimize them, and Coaching for a human coach in your corner."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={openEvoFloatingChat}
              className="btn-chrome inline-flex cursor-pointer items-center gap-3 px-6 py-3 text-base"
            >
              <ThemeImg
                light="/images/brand/evo-widget-light.webp"
                dark="/images/brand/evo-widget-dark.webp"
                alt="EVO"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span>{isAr ? "ابدأ المحادثة" : "Start chatting"}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
            <a
              href="/memberships"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              <span>{isAr ? "اطّلع على الباقات" : "See all plans"}</span>
            </a>
          </div>
        </section>

        {/* Share buttons */}
        <div className="marble-card mt-8 flex items-center justify-between gap-4 p-4">
          <p className="text-sm font-medium text-[var(--text)]">
            {isAr ? "شارك صفحة EVO" : "Share EVO page"}
          </p>
          <ShareButtons
            path="/evo"
            title={isAr ? "EVO — مدرب ذكاء اصطناعي | Alkemos" : "EVO — AI Coach | Alkemos"}
            text={isAr ? "محرك أداء ذكي ليس مجرد روبوت محادثة — متاح للجميع" : "An intelligent performance engine, not just a chatbot — available to everyone"}
          />
        </div>
      </main>
    </div>
  );
}
