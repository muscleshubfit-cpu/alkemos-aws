/**
 * SITE-CONTENT/HOME — the admin-editable homepage marketing copy
 * (SITE-CONTENT-281).
 *
 * SINGLE SOURCE LAW: these defaults ARE the copy that used to live
 * inline in LandingView.tsx, moved verbatim (byte-identical values,
 * including diacritics and punctuation) so the homepage-adoption
 * canaries can keep pinning them — at their new single source. The
 * homepage FAQ set here (5 hesitation-removers) stays SEPARATE from
 * the /faq page's 10-question set (static-pages.ts) exactly as before.
 *
 * HOME-PLATFORM-284 → HOME-POLISH-285 → HOME-REFINE-286 → CONVERSION-2026 →
 * AR-COPY-REWRITE-287 (owner order 2026-11-04 «إعادة تحرير المحتوى العربي
 * لصفحات Alkemos»): the AR defaults were re-authored as NATIVE Arabic
 * marketing copy — original MSA prose in direct address, never a literal
 * translation of the EN twin (the native-pair law). The hero subtitle is
 * a PLATFORM INTRODUCTION by the owner's correction (what Alkemos IS:
 * training + nutrition + smart tools + plan building + progress), not a
 * subscription pitch — tier names stay OUT of the hero. Every number and
 * policy restates its single source; the EN defaults are untouched.
 *
 * SCOPE GUARD (what is deliberately NOT here):
 *   - Interactive tool labels (planner buttons, quota chips) — tool
 *     UX, not marketing copy.
 *   - Count-bearing eyebrows + proof-strip labels + tier feature rows
 *     + the EVO fair-use line + the refund note — every one restates a
 *     VERIFIED number or policy from its single source (memberships.ts
 *     law / refund.ts / EVO quota); editing them from a form would let
 *     the site drift from its enforced limits.
 *   - Functional auth CTAs ("Log in / Sign up" …) — tied to auth flows.
 *
 * Admin metadata (labels/hints/groups) rides the same objects — one
 * registry drives BOTH the resolver and the /admin/site-content form.
 */

import {
  applySiteTokens,
  localeValue,
  pickFaqOverride,
  pickTextOverride,
  type SiteCopyMap,
  type SiteFaqItem,
} from "./core";

export type { SiteCopyMap, SiteFaqItem };

export type HomeCopy = {
  heroTitle: string;
  heroSubtitle: string;
  heroPillTraining: string;
  heroPillNutrition: string;
  heroPillPlanning: string;
  libraryTitle: string;
  libraryBody: string;
  trainEyebrow: string;
  trainTitle: string;
  trainBody: string;
  trainCta: string;
  eatTitle: string;
  eatBody: string;
  dietTitle: string;
  dietBody: string;
  dietCta: string;
  toolsEyebrow: string;
  toolsTitle: string;
  toolsBody: string;
  toolsCta: string;
  planEyebrow: string;
  planTitle: string;
  planBody: string;
  planAllowance: string;
  planAllowanceChip: string;
  learnTitle: string;
  learnCta: string;
  membershipsEyebrow: string;
  membershipsTitle: string;
  membershipsBody: string;
  coachingTitle: string;
  coachingBody: string;
  coachingCta: string;
  coachesTitle: string;
  coachesBody: string;
  faqEyebrow: string;
  faqTitle: string;
};

export type HomeTextField = {
  prop: keyof HomeCopy;
  key: string;
  multiline?: boolean;
  labelEn: string;
  labelAr: string;
  hintEn?: string;
  hintAr?: string;
  defaultEn: string;
  defaultAr: string;
};

export type HomeCopyGroup = {
  key: string;
  labelEn: string;
  labelAr: string;
  fields: HomeTextField[];
};

export const HOME_COPY_GROUPS: HomeCopyGroup[] = [
  {
    key: "home.hero",
    labelEn: "Hero",
    labelAr: "المقدمة (Hero)",
    fields: [
      {
        prop: "heroTitle",
        key: "home.hero.title",
        labelEn: "Headline (H1)",
        labelAr: "العنوان الرئيسي (H1)",
        defaultEn: "Train smarter. Eat with precision.",
        defaultAr: "تدرّب بذكاء. وتغذَّ بدقة.",
      },
      {
        prop: "heroSubtitle",
        key: "home.hero.subtitle",
        multiline: true,
        labelEn: "Subtitle paragraph",
        labelAr: "الفقرة التمهيدية",
        defaultEn:
          "You know your goal — the missing part is a plan that actually fits it. Alkemos builds your weekly workouts and your full day of meals around your body, your gear, and your kitchen, with exact macros in grams — and EVO, your AI coach, keeps adjusting the plan whenever life does — in Arabic and English.",
        // AR-COPY-REWRITE-287 (owner correction): the AR hero subtitle is a
        // WHOLESOME PLATFORM INTRODUCTION — the four pillars the owner named
        // (training + nutrition + smart tools + plan building/progress) —
        // NOT a sales pitch; no tier names, no problem-first framing. The
        // closing bilingual fact is pinned by the homepage canaries.
        defaultAr:
          "كل ما تحتاجه في رحلتك الرياضية والغذائية في منصة واحدة: تمارين موثقة بالصور والإرشادات، وأطعمة بسعراتها وماكروزها، وأدوات ذكية تحسب أرقامك وتتبع تقدمك نحو هدفك — ومعها EVO، مدرّبك الذكي الذي يبني خطتك على مقاسك ويعدّلها كلما تغيرت ظروفك — بالعربية والإنجليزية.",
      },
      {
        prop: "heroPillTraining",
        key: "home.hero.pill.training",
        labelEn: "Pillar chip 1",
        labelAr: "شارة الركيزة 1",
        defaultEn: "Training",
        defaultAr: "التدريب",
      },
      {
        prop: "heroPillNutrition",
        key: "home.hero.pill.nutrition",
        labelEn: "Pillar chip 2",
        labelAr: "شارة الركيزة 2",
        defaultEn: "Nutrition",
        defaultAr: "التغذية",
      },
      {
        prop: "heroPillPlanning",
        key: "home.hero.pill.planning",
        labelEn: "Pillar chip 3",
        labelAr: "شارة الركيزة 3",
        defaultEn: "Smart Planning",
        defaultAr: "التخطيط الذكي",
      },
    ],
  },
  {
    key: "home.tools",
    labelEn: "Tools section (#tools)",
    labelAr: "قسم الأدوات (#tools)",
    fields: [
      {
        prop: "toolsEyebrow",
        key: "home.tools.eyebrow",
        labelEn: "Section eyebrow chip",
        labelAr: "شريحة العنوان الصغير",
        defaultEn: "FREE TOOLS — FREE TO TRY",
        defaultAr: "أدوات مجانية — بلا تسجيل",
      },
      {
        prop: "toolsTitle",
        key: "home.tools.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "Know your numbers before anything else.",
        defaultAr: "اعرف أرقامك قبل أي خطوة.",
      },
      {
        prop: "toolsBody",
        key: "home.tools.body",
        multiline: true,
        labelEn: "Section paragraph",
        labelAr: "فقرة القسم",
        defaultEn:
          "Accurate calculators that give you your numbers in seconds, the manual meal planner, and a daily water tracker — each tool opens on its own page, free to try, no credit card required.",
        defaultAr:
          "حاسبات دقيقة تمنحك أرقامك في ثوانٍ، ومخطط وجبات تبنيه بنفسك، ومتتبع يومي لشرب الماء — كل أداة تعمل مباشرة في صفحتها، مجانًا ودون أي بطاقة ائتمانية.",
      },
      {
        prop: "toolsCta",
        key: "home.tools.cta",
        labelEn: "Section CTA button",
        labelAr: "زر الدعوة للإجراء",
        defaultEn: "All tools",
        defaultAr: "كل الأدوات",
      },
    ],
  },
  {
    key: "home.plan",
    labelEn: "AI planning section (#plan)",
    labelAr: "قسم التخطيط بالذكاء الاصطناعي (#plan)",
    fields: [
      {
        prop: "planEyebrow",
        key: "home.plan.eyebrow",
        labelEn: "Section eyebrow chip",
        labelAr: "شريحة العنوان الصغير",
        defaultEn: "AI PLANNING",
        defaultAr: "التخطيط بالذكاء الاصطناعي",
      },
      {
        prop: "planTitle",
        key: "home.plan.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "Your complete plan, in seconds.",
        defaultAr: "خطتك كاملة، في ثوانٍ.",
      },
      {
        prop: "planBody",
        key: "home.plan.body",
        multiline: true,
        labelEn: "Section paragraph",
        labelAr: "فقرة القسم",
        defaultEn:
          "You don't just count numbers — AI builds your complete plan: a weekly workout split with its exercises and sets, or a full day of meals with quantities in grams — and EVO stays with you to answer and adjust anytime.",
        defaultAr:
          "الأرقام وحدها لا تكفي — الذكاء الاصطناعي يبني لك الخطة كاملة: نظامًا تدريبيًا أسبوعيًا بتمارينه ومجموعاته، أو خطة وجبات ليوم كامل بكمياتها بالغرامات — ويبقى EVO معك للإجابة والتعديل في أي وقت.",
      },
      {
        prop: "planAllowance",
        key: "home.plan.allowance",
        multiline: true,
        labelEn: "Quota-policy bar text",
        labelAr: "نص شريط سياسة الحصص",
        // AI-QUOTAS 2026-11-14: generation is SUBSCRIBER-ONLY — the band
        // states the honest policy (free members keep the full free product;
        // generation & swaps ride monthly quotas for Premium and above). The
        // homepage-adoption canary pin was updated in the same commit (the
        // 287 precedent).
        defaultEn:
          "AI plan generation & swaps are subscriber features (Premium and above) — monthly quotas that renew with your subscription cycle. The libraries, tools, calculators and EVO chat (10 messages/day) stay free for everyone.",
        defaultAr:
          "توليد الخطط والتبديلات بالذكاء الاصطناعي ميزة لمشتركي بريميوم وأعلى — بحصص شهرية تتجدد مع دورة الاشتراك. وتظل المكتبات والأدوات والحاسبات ومحادثة EVO (10 رسائل يوميًا) مجانية للجميع.",
      },
      {
        prop: "planAllowanceChip",
        key: "home.plan.allowanceChip",
        labelEn: "Generation chip",
        labelAr: "شريحة التوليد",
        defaultEn: "AI GENERATION",
        defaultAr: "توليد بالذكاء الاصطناعي",
      },
    ],
  },
  {
    key: "home.library",
    labelEn: "Exercise library section (#library)",
    labelAr: "قسم مكتبة التمارين (#library)",
    fields: [
      {
        prop: "libraryTitle",
        key: "home.library.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "The exercise library",
        defaultAr: "مكتبة التمارين",
      },
      {
        prop: "libraryBody",
        key: "home.library.body",
        multiline: true,
        labelEn: "Section paragraph",
        labelAr: "فقرة القسم",
        defaultEn:
          "Pick a muscle group and browse real exercises from the {exercises} library — every card is a documented exercise with form photos and technique cues, one tap from its full page.",
        defaultAr:
          "اختر مجموعة عضلية واستعرض تمارين حقيقية من مكتبة تضم {exercises} تمرينًا — كل بطاقة تمرين موثّق بصور الأداء وشرح واضح، وضغطة واحدة تنقلك إلى صفحته الكاملة.",
      },
    ],
  },
  {
    key: "home.eat",
    labelEn: "Food library section (#eat)",
    labelAr: "قسم مكتبة الأطعمة (#eat)",
    fields: [
      {
        prop: "eatTitle",
        key: "home.eat.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "The food library",
        defaultAr: "مكتبة الأطعمة",
      },
      {
        prop: "eatBody",
        key: "home.eat.body",
        multiline: true,
        labelEn: "Section paragraph",
        labelAr: "فقرة القسم",
        defaultEn:
          "Browse the categories and real foods from the {foods} food database — every card carries the food's per-100g calories and macros, one tap from its full page.",
        defaultAr:
          "تصفح الفئات وأصنافًا حقيقية من قاعدة تضم {foods} صنف غذائي — كل بطاقة تعرض سعرات الصنف وماكروزه لكل 100 جرام، وصفحته الكاملة على بُعد ضغطة.",
      },
    ],
  },
  {
    key: "home.train",
    labelEn: "Ready-made programs section (#train)",
    labelAr: "قسم البرامج الجاهزة (#train)",
    fields: [
      {
        prop: "trainEyebrow",
        key: "home.train.eyebrow",
        labelEn: "Section eyebrow chip",
        labelAr: "شريحة العنوان الصغير",
        defaultEn: "READY-MADE PROGRAMS",
        defaultAr: "برامج جاهزة",
      },
      {
        prop: "trainTitle",
        key: "home.train.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "Ready-made training programs",
        defaultAr: "برامج التمارين الجاهزة",
      },
      {
        prop: "trainBody",
        key: "home.train.body",
        multiline: true,
        labelEn: "Section paragraph",
        labelAr: "فقرة القسم",
        defaultEn:
          "Structured workout routines with schedules, exercises, sets, and reps — follow one as-is, or make it your starting point and adapt it to your gear.",
        defaultAr:
          "برامج تدريبية متكاملة بجداولها وتمارينها ومجموعاتها وتكراراتها — اتبعها كما هي، أو اجعلها نقطة انطلاق وعدّلها بحسب وقتك ومعداتك.",
      },
      {
        prop: "trainCta",
        key: "home.train.cta",
        labelEn: "Section CTA button",
        labelAr: "زر الدعوة للإجراء",
        defaultEn: "All programs",
        defaultAr: "كل البرامج",
      },
    ],
  },
  {
    key: "home.diet",
    labelEn: "Diet-plan library section (#diet)",
    labelAr: "قسم الخطط الغذائية (#diet)",
    fields: [
      {
        prop: "dietTitle",
        key: "home.diet.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "The ready-made diet-plan library",
        defaultAr: "مكتبة الخطط الغذائية الجاهزة",
      },
      {
        prop: "dietBody",
        key: "home.diet.body",
        multiline: true,
        labelEn: "Section paragraph",
        labelAr: "فقرة القسم",
        defaultEn:
          "Balanced diet plans with exact grams and calories per food, from real-world kitchens — from 1,200 to 3,000 kcal.",
        defaultAr:
          "أنظمة غذائية متوازنة بكميات محددة بالغرامات والسعرات لكل صنف، من مطبخ عربي مألوف ومكونات يومية — من 1200 إلى 3000 سعرة.",
      },
      {
        prop: "dietCta",
        key: "home.diet.cta",
        labelEn: "Section CTA button",
        labelAr: "زر الدعوة للإجراء",
        defaultEn: "Open the diet-plan library",
        defaultAr: "افتح مكتبة الخطط الغذائية",
      },
    ],
  },
  {
    key: "home.learn",
    labelEn: "Blog section (#learn)",
    labelAr: "قسم المدونة (#learn)",
    fields: [
      {
        prop: "learnTitle",
        key: "home.learn.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "Latest Articles",
        defaultAr: "أحدث المقالات",
      },
      {
        prop: "learnCta",
        key: "home.learn.cta",
        labelEn: "Section CTA button",
        labelAr: "زر الدعوة للإجراء",
        defaultEn: "Explore the articles",
        defaultAr: "استكشف المحتوى",
      },
    ],
  },
  {
    key: "home.memberships",
    labelEn: "Memberships section (#memberships)",
    labelAr: "قسم العضويات (#memberships)",
    fields: [
      {
        prop: "membershipsEyebrow",
        key: "home.memberships.eyebrow",
        labelEn: "Section eyebrow chip",
        labelAr: "شريحة العنوان الصغير",
        defaultEn: "MEMBERSHIPS & COACHING",
        defaultAr: "العضويات والتدريب الأونلاين",
      },
      {
        prop: "membershipsTitle",
        key: "home.memberships.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "Premium memberships",
        defaultAr: "العضويات المميزة",
      },
      {
        prop: "membershipsBody",
        key: "home.memberships.body",
        multiline: true,
        labelEn: "Section paragraph",
        labelAr: "فقرة القسم",
        defaultEn:
          "Start free — the Free tier is permanent, not a trial. When your training becomes consistent and you need more plans, weekly adaptation, and full exports, the tiers grow with you: Premium to manage your plans, Pro to adapt & optimize them — no ads.",
        // AR-COPY-REWRITE-287: the progression ladder survives (the
        // CONVERSION-2026 decision D2) in native phrasing — upgrade is
        // framed as the USER's call («قرارك وحدك»), echoing no-auto-renewal.
        defaultAr:
          "ابدأ بالمجاني — مستوى دائم لا تجربة مؤقتة. وحين ينتظم تدريبك وتكبر احتياجاتك، تنمو الباقات معك: بريميوم لإدارة خططك وحفظها، وبرو لتكييفها أسبوعيًا بلا إعلانات — والترقية، متى ما حان وقتها، قرارك وحدك.",
      },
    ],
  },
  {
    key: "home.coaching",
    labelEn: "Online coaching band",
    labelAr: "شريط التدريب الأونلاين",
    fields: [
      {
        prop: "coachingTitle",
        key: "home.coaching.title",
        labelEn: "Band heading",
        labelAr: "عنوان الشريط",
        defaultEn: "1-on-1 Online Coaching",
        defaultAr: "التدريب الأونلاين مع مدربك الشخصي",
      },
      {
        prop: "coachingBody",
        key: "home.coaching.body",
        multiline: true,
        labelEn: "Band paragraph",
        labelAr: "فقرة الشريط",
        defaultEn:
          "A dedicated certified coach builds your training and nutrition plans, reads your numbers every week, and adjusts your course around your real life — travel, kitchen, and schedule — with all Pro features included.",
        defaultAr:
          "مدرب معتمد مخصص لك وحدك: يبني خطط تدريبك وتغذيتك، ويقرأ أرقامك أسبوعيًا، ويعدّل مسارك حول حياتك الحقيقية — سفرك ومطبخك وجدولك — وتشمل باقتك كل مزايا برو.",
      },
      {
        prop: "coachingCta",
        key: "home.coaching.cta",
        labelEn: "Band CTA button",
        labelAr: "زر الدعوة للإجراء",
        defaultEn: "Explore online coaching ›",
        defaultAr: "استكشف التدريب الأونلاين ›",
      },
    ],
  },
  {
    key: "home.coaches",
    labelEn: "Featured coaches section",
    labelAr: "قسم المدربين المميزين",
    fields: [
      {
        prop: "coachesTitle",
        key: "home.coaches.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "Featured Coaches on Alkemos",
        defaultAr: "مدربون معتمدون على Alkemos",
      },
      {
        prop: "coachesBody",
        key: "home.coaches.body",
        multiline: true,
        labelEn: "Section paragraph",
        labelAr: "فقرة القسم",
        defaultEn:
          "Certified professional coaches ready to guide you step by step — tap any coach to visit their profile.",
        defaultAr:
          "مدربون محترفون معتمدون جاهزون لمرافقتك خطوة بخطوة — اضغط على أي مدرب لتتعرف على ملفه وخبراته.",
      },
    ],
  },
  {
    key: "home.faq",
    labelEn: "FAQ section (#faq)",
    labelAr: "قسم الأسئلة الشائعة (#faq)",
    fields: [
      {
        prop: "faqEyebrow",
        key: "home.faq.eyebrow",
        labelEn: "Section eyebrow chip",
        labelAr: "شريحة العنوان الصغير",
        defaultEn: "COMMON QUESTIONS",
        defaultAr: "الأسئلة الشائعة",
      },
      {
        prop: "faqTitle",
        key: "home.faq.title",
        labelEn: "Section heading",
        labelAr: "عنوان القسم",
        defaultEn: "Questions, answered.",
        defaultAr: "أسئلة قبل أن تبدأ.",
      },
    ],
  },
];

export const HOME_TEXT_FIELDS: HomeTextField[] = HOME_COPY_GROUPS.flatMap((g) => g.fields);

/** The homepage's own 5-question FAQ set (hesitation-removers). */
export const HOME_FAQ_DEFAULT: { en: SiteFaqItem[]; ar: SiteFaqItem[] } = {
  en: [
    {
      q: "Can I use Alkemos for free?",
      a: "Yes. Access is completely free — exercises, food database, routines, and smart calculators work instantly without signup, plus 10 messages a day with EVO. AI meal and workout plan generation is a subscriber feature (Premium and above) with monthly quotas. Creating a free account syncs and saves your plans across devices.",
    },
    {
      q: "How does EVO work?",
      a: "EVO is your specialized AI fitness and nutrition coach, accessible from the bubble on every page. Ask questions, request custom workout and meal splits tailored to your stats, and make smart instant swaps for foods and exercises.",
    },
    {
      q: "Do I need a subscription?",
      a: "No subscription is required to enjoy the core platform. Memberships are completely optional, unlocking higher AI plan limits, unlimited EVO coaching conversations, full exports, and an ad-free experience.",
    },
    {
      q: "Does Alkemos suit beginners?",
      a: "Absolutely. Every movement is paired with clear visual form cues to help you train safely and reduce injury risk, while our structured programs start from zero-equipment home basics and progress alongside you.",
    },
    {
      q: "What's the difference between a membership and online coaching?",
      a: "A membership expands your digital toolkit with unlimited EVO chat, more AI plans, and an ad-free workspace. Online coaching pairs you with a dedicated certified coach who personally designs your routine, tracks your weekly progress, and stays in direct touch — with all Pro perks included.",
    },
  ],
  ar: [
    {
      q: "هل يمكنني استخدام Alkemos مجانًا؟",
      a: "نعم. التصفح مجاني بالكامل: التمارين والأطعمة والبرامج والأدوات تعمل مباشرة دون أي تسجيل، مع 10 رسائل يوميًا مع EVO. وتوليد خطط التغذية والتمارين ميزة لمشتركي بريميوم وأعلى بحصص شهرية. وأنشئ حسابًا مجانيًا لتحفظ خططك للأبد وتجدها على جميع أجهزتك.",
    },
    {
      q: "كيف يعمل EVO؟",
      a: "EVO هو مدربك الذكي في اللياقة والتغذية، تجده في أسفل كل صفحة. استشره في التمارين والأنظمة الغذائية، أو اطلب منه خطة مصممة خصيصًا لهدفك وظروفك، مع تبديل ذكي وفوري لأي تمرين أو وجبة.",
    },
    {
      q: "هل أحتاج إلى اشتراك؟",
      a: "لا يلزمك أي اشتراك لاستخدام المنصة والاستفادة من ميزاتها الأساسية. العضويات اختيارية تمامًا، وتوسّع ما تفعله داخل المنصة: حصة أكبر لتوليد الخطط الذكية، ومحادثة بلا حدود مع EVO، وتصديرًا كاملًا — ومن مستوى برو فما فوق، تجربة بلا إعلانات.",
    },
    {
      q: "هل يناسبني Alkemos إذا كنت مبتدئًا؟",
      a: "نعم بالتأكيد. كل تمرين مصحوب بصور توضيحية وتعليمات للأداء الصحيح، لتتدرب بأمان وتقلل خطر الإصابة. والبرامج التدريبية تبدأ من مستوى المبتدئين وتمارين المنزل، ثم تتدرج معك خطوة بخطوة.",
    },
    {
      q: "ما الفرق بين العضوية والتدريب الأونلاين؟",
      a: "العضوية توسّع المنصة نفسها بين يديك: توليد خطط أكثر، ومحادثة غير محدودة مع EVO، وتصدير كامل، وتجربة بلا إعلانات من مستوى برو. أما التدريب الأونلاين فيضيف إلى كل ذلك مدربًا معتمدًا يصمم خططك بنفسه ويتابع تقدمك أسبوعيًا بتواصل مباشر — وتشمل باقته كل مزايا برو.",
    },
  ],
};

/**
 * Resolve the full homepage copy set for the active locale. One pass,
 * typed output — LandingView reads plain properties afterwards.
 */
export function resolveHomeCopy(copy: SiteCopyMap | undefined, isAr: boolean): HomeCopy {
  const out = {} as HomeCopy;
  for (const field of HOME_TEXT_FIELDS) {
    const override = pickTextOverride(localeValue(copy?.[field.key], isAr));
    out[field.prop] = applySiteTokens(override ?? (isAr ? field.defaultAr : field.defaultEn));
  }
  return out;
}

/** Resolve the homepage FAQ items (visible accordion + JSON-LD source). */
export function resolveHomeFaq(copy: SiteCopyMap | undefined, isAr: boolean): SiteFaqItem[] {
  const override = pickFaqOverride(localeValue(copy?.["home.faq"], isAr));
  return override ?? (isAr ? HOME_FAQ_DEFAULT.ar : HOME_FAQ_DEFAULT.en);
}
