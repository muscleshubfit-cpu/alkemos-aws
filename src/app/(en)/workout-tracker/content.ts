/**
 * WORKOUT-TRACKER shared content — FAQ pairs consumed by BOTH the client
 * landing page (src/app/(en)/workout-tracker/page.tsx) and the server
 * layout's JSON-LD (src/app/(en)/workout-tracker/layout.tsx). One source
 * of truth so the visible copy and the structured data can never drift
 * apart (same pattern as for-coaches/content.ts).
 *
 * P0 SEO audit (2026-09-30, finding #1): the site had ZERO pages matching
 * "workout tracker" / "workout tracking app" intents. This landing page
 * targets that intent and routes it to what the product ACTUALLY ships.
 *
 * HONESTY LAW (capability inventory verified 2026-09-30):
 *   - Alkemos has NO per-session set/rep workout logging. The FAQ below
 *     states this explicitly — the page pivots to what exists: AI plan
 *     generation (subscriber feature — monthly quotas), ready-made
 *     programs, the 868+ exercise library, and ProgressView's body-metric
 *     tracking (weight, waist, chest, hips, arm, neck, energy, adherence,
 *     progress photos, weight chart, weekly check-in reminders).
 *   - "adherence" is a SELF-REPORTED 1–10 score in the weekly check-in,
 *     never a computed workout-completion metric.
 */

export const WORKOUT_TRACKER_FAQ_EN: Array<{ q: string; a: string }> = [
  {
    q: "Is Alkemos a workout tracker?",
    a: "Alkemos is a workout planning and progress-tracking platform. It generates personalized workout plans with AI (a subscriber feature with monthly quotas for Premium and above), offers ready-made programs for home and gym, and tracks your results — weight, five body measurements, progress photos, and weekly check-in scores — in one free account. It does not log individual sets and reps per session; the tracking lives at the plan-and-progress level.",
  },
  {
    q: "How do I track my workout progress on Alkemos?",
    a: "Log a weekly check-in inside the app: enter your weight, waist, chest, hips, arm, and neck measurements, rate your energy and plan adherence from 1 to 10, and add notes. Your weight history renders as an interactive chart, your progress photos sit in a dated gallery, and a weekly reminder nudges you if you have not logged that week.",
  },
  {
    q: "Can I get a workout plan without signing up?",
    a: "You can browse everything without an account, but AI plan generation is a subscriber feature (Premium and above). With a Premium subscription the AI Workout Planner builds your complete weekly split — pick your goal, level, training days, and equipment — validated before display. A free account saves your plans across devices and unlocks limited EVO AI coach access (10 messages/day).",
  },
  {
    q: "Does Alkemos log sets and reps for each workout?",
    a: "No — and we say that plainly. Alkemos does not have a per-session set-and-rep log. Your plan lists every exercise with sets, reps, and rest, and your weekly check-in captures a self-reported adherence score (1–10) plus body measurements and photos, so you can see whether the plan is working without tapping through every set.",
  },
  {
    q: "What do the ready-made programs include?",
    a: "Structured training blocks for every goal and level, at home or in the gym, each built from the 868+ exercise library. Every exercise carries step-by-step instructions, target muscles, and equipment details — in English and Arabic.",
  },
  {
    q: "Does Alkemos track nutrition too?",
    a: "On the planning side: the free meal planner builds meals from 8,162+ foods with live calorie and macro totals, and the macro calculator sets your protein, carb, and fat targets before you plan. See the Macro Tracker page for the full nutrition workflow.",
  },
  {
    q: "Is the workout tracker free?",
    a: "Yes. The exercise library, food database, all 8 free tools, the manual planners, plan browsing, and progress tracking are free with an account. AI plan generation is a subscriber feature (Premium and above) with monthly quotas, and paid tiers add deeper features.",
  },
];

export const WORKOUT_TRACKER_FAQ_AR: Array<{ q: string; a: string }> = [
  {
    q: "هل Alkemos متتبّع تمارين؟",
    a: "Alkemos منصة تخطيط تمارين وتتبّع تقدّم. يولّد لك خطط تمارين مخصّصة بالذكاء الاصطناعي (ميزة مشتركين بحصة شهرية تتجدد مع دورة الاشتراك)، ويقدّم برامج جاهزة مجانية للمنزل والنادي، ويتتبّع نتائجك — الوزن وخمسة قياسات جسم وصور تقدّم ودرجات تسجيل أسبوعية — في حساب مجاني واحد. لا يسجّل المجموعات والتكرارات لكل جلسة على حدة؛ التتبّع عندنا على مستوى الخطة والتقدّم.",
  },
  {
    q: "كيف أتابع تقدّمي في التمارين على Alkemos؟",
    a: "سجّل تسجيلًا أسبوعيًا داخل التطبيق: أدخل وزنك وقياسات الخصر والصدر والأرداف والذراع والرقبة، وقيّم طاقتك والتزامك بالخطة من 1 إلى 10، وأضف ملاحظاتك. يظهر سجل وزنك كمخطط تفاعلي، وصور تقدّمك في معرض بتواريخها، وتذكير أسبوعي ينبهك إن لم تسجّل في الأسبوع.",
  },
  {
    q: "هل يمكنني الحصول على خطة تمارين بدون تسجيل؟",
    a: "يمكنك تصفّح كل شيء بدون حساب، لكن توليد الخطط بالذكاء الاصطناعي ميزة مشتركين (بريميوم وأعلى). مع اشتراك بريميوم يبني لك مخطط التمارين نظامك الأسبوعي الكامل — اختر هدفك ومستواك وأيام تدريبك ومعداتك — ويُفحص النظام قبل عرضه. والحساب المجاني يحفظ خططك عبر أجهزتك ويفتح وصولًا محدودًا لمدرب EVO الذكي (10 رسائل يوميًا).",
  },
  {
    q: "هل يسجّل Alkemos المجموعات والتكرارات لكل تمرين؟",
    a: "لا — ونقولها بوضوح. لا يوجد لدى Alkemos سجل مجموعات وتكرارات لكل جلسة. خطتك تعرض كل تمرين بمجموعاته وتكراراته وراحاته، وتسجيلك الأسبوعي يلتقط درجة التزام ذاتية (1–10) مع قياسات جسمك وصورك، فترى هل الخطة تعمل دون أن تلمس هاتفك بعد كل مجموعة.",
  },
  {
    q: "ماذا تتضمن البرامج الجاهزة؟",
    a: "كتلًا تدريبية منظّمة لكل هدف ومستوى، في المنزل أو النادي، مبنية كلها من مكتبة الـ868+ تمرينًا. كل تمرين يحمل شرحًا خطوة بخطوة والعضلات المستهدفة وتفاصيل المعدات — بالإنجليزية والعربية.",
  },
  {
    q: "هل يتتبّع Alkemos التغذية أيضًا؟",
    a: "على جانب التخطيط: مخطط الوجبات المجاني يبني وجباتك من 8,162+ صنفًا غذائيًا بمجاميع سعرات وماكروز حيّة، وحاسبة الماكروز تضبط أهداف البروتين والكربوهيدرات والدهون قبل التخطيط. اطّلع على صفحة متتبّع الماكروز لمسار التغذية كاملًا.",
  },
  {
    q: "هل متتبّع التمارين مجاني؟",
    a: "نعم. مكتبة التمارين وقاعدة الأطعمة وكل الأدوات الثماني المجانية (الحاسبات ومتتبع الماء والمخطط اليدوي ومخططا الذكاء الاصطناعي) وتصفّح الخطط وتتبّع التقدّم — كلها مجانية بحساب. توليد الخطط بالذكاء الاصطناعي ميزة مشتركين (بريميوم وأعلى) بحصة شهرية تتجدد مع دورة الاشتراك، والباقات المدفوعة ترفع حصة التوليد وتضيف مزايا أعمق.",
  },
];
