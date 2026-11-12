/**
 * MACRO-TRACKER shared content — FAQ pairs consumed by BOTH the client
 * landing page (src/app/(en)/macro-tracker/page.tsx) and the server
 * layout's JSON-LD (src/app/(en)/macro-tracker/layout.tsx). One source
 * of truth so the visible copy and the structured data can never drift
 * apart (same pattern as for-coaches/content.ts).
 *
 * P0 SEO audit (2026-09-30, finding #1): the site had ZERO pages
 * matching "macro tracker" / "macro tracking app" intents.
 *
 * HONESTY LAW (capability inventory verified 2026-09-30):
 *   - Alkemos has NO daily food diary / intake logging. Macro tracking
 *     on Alkemos lives at the PLANNING level: macro calculator targets
 *     → meal planner with live per-meal & per-day macro totals (8,162+
 *     foods, free, no signup) → AI meal-plan generation (2 free/month,
 *     no signup) → weight/measurement tracking to verify the results.
 *     The FAQ below states the no-diary scope explicitly.
 */

export const MACRO_TRACKER_FAQ_EN: Array<{ q: string; a: string }> = [
  {
    q: "Is Alkemos a macro tracker?",
    a: "Alkemos tracks your macros at the planning level. The macro calculator sets your daily protein, carb, and fat targets, the meal planner totals the macros of every meal you build from 8,162+ foods in real time, and the AI meal planner generates a full day of eating in grams from your calorie target. You can plan a complete day with live macro totals without an account.",
  },
  {
    q: "Does Alkemos have a daily food diary?",
    a: "No — Alkemos is a macro planning platform, not an intake diary. There is no log-what-I-ate-today screen and no barcode scanner. You build or generate your day's meals, watch the live macro totals per meal and per day, then verify the results with your weekly weight and measurement check-ins.",
  },
  {
    q: "How do I calculate my macro targets?",
    a: "Use the free macro calculator: enter your body stats, goal, and activity level, and it splits your daily calories into protein, carbs, and fat. The result feeds directly into the meal planner — every food you add updates the totals against your targets live.",
  },
  {
    q: "Can I see the macros of individual foods?",
    a: "Yes. The food database lists calories, protein, carbs, and fat for 8,162+ foods with smart serving sizes — browsable for free in English and Arabic, with curated collections for high-protein, low-carb, and keto picks.",
  },
  {
    q: "Can I generate a full meal plan for my macros?",
    a: "Yes. The AI Meal Planner generates a complete day of meals in grams from your calorie target and diet system — 2 successful generations per month free, no signup required, with meal swaps available through the EVO AI coach.",
  },
  {
    q: "How do I know the plan is working?",
    a: "Track the outcome: weekly check-ins capture your weight, five body measurements, energy, and plan adherence (1–10), with progress photos and an interactive weight chart in the same free account — so your macros and your results sit in one place.",
  },
  {
    q: "Is the macro tracker free?",
    a: "Yes. The macro calculator, the food database, the meal planner's live macro totals, and 2 free AI meal-plan generations per month all work without paying. Paid tiers raise the AI generation pool and add deeper features.",
  },
];

export const MACRO_TRACKER_FAQ_AR: Array<{ q: string; a: string }> = [
  {
    q: "هل Alkemos متتبّع ماكروز؟",
    a: "Alkemos يتتبّع ماكروزك على مستوى التخطيط. حاسبة الماكروز تضبط أهدافك اليومية من البروتين والكربوهيدرات والدهون، ومخطط الوجبات يجمع ماكروز كل وجبة تبنيها من 8,162+ صنفًا غذائيًا لحظيًا، ومخطط الوجبات بالذكاء الاصطناعي يولّد يومًا كاملًا بالغرامات من رقم سعراتك. يمكنك تخطيط يوم كامل بمجاميع ماكروز حيّة دون أي حساب.",
  },
  {
    q: "هل لدى Alkemos يوميات طعام يومية؟",
    a: "لا — Alkemos منصة تخطيط ماكروز لا يوميات استهلاك. لا توجد شاشة «سجّل ما أكلته اليوم» ولا ماسح باركود. أنت تبني أو تولّد وجبات يومك، وتراقب مجاميع الماكروز الحيّة لكل وجبة ولكل يوم، ثم تتحقق من النتائج بتسجيلاتك الأسبوعية للوزن والقياسات.",
  },
  {
    q: "كيف أحسب أهداف الماكروز؟",
    a: "استخدم حاسبة الماكروز المجانية: أدخل بيانات جسمك وهدفك ومستوى نشاطك، فتوزّع سعراتك اليومية على بروتين وكربوهيدرات ودهون. النتيجة تُغذّى مباشرة في مخطط الوجبات — كل صنف تضيفه يحدّث المجاميع مقابل أهدافك لحظيًا.",
  },
  {
    q: "هل يمكنني رؤية ماكروز كل صنف غذائي؟",
    a: "نعم. قاعدة الأطعمة تعرض السعرات والبروتين والكربوهيدرات والدهون لـ8,162+ صنفًا بمقاسات تقديم ذكية — متاحة للتصفح مجانًا بالعربية والإنجليزية، مع مجموعات منتقاة للأطعمة عالية البروتين ومنخفضة الكربوهيدرات والكيتو.",
  },
  {
    q: "هل يمكنني توليد خطة وجبات كاملة لماكروزي؟",
    a: "نعم. مخطط الوجبات بالذكاء الاصطناعي يولّد يومًا كاملًا من الوجبات بالغرامات من رقم سعراتك ونظامك الغذائي — توليدان ناجحان شهريًا مجانًا بلا تسجيل، مع تبديلات وجبات متاحة عبر مدرب EVO الذكي.",
  },
  {
    q: "كيف أعرف أن الخطة تعمل؟",
    a: "تتبّع النتيجة: التسجيلات الأسبوعية تلتقط وزنك وخمسة قياسات جسم وطاقتك والتزامك بالخطة (1–10)، مع صور تقدّم ومخطط وزن تفاعلي في نفس الحساب المجاني — فتجلس ماكروزك ونتائجك في مكان واحد.",
  },
  {
    q: "هل متتبّع الماكروز مجاني؟",
    a: "نعم. حاسبة الماكروز وقاعدة الأطعمة ومجاميع الماكروز الحيّة في مخطط الوجبات وتوليدَا خطة الوجبات الشهريان المجانيان — كلها تعمل بلا دفع. الباقات المدفوعة ترفع رصيد التوليد بالذكاء الاصطناعي وتضيف مزايا أعمق.",
  },
];
