/**
 * src/lib/evo-faq.ts — the /evo FAQ, single source (EN + AR).
 *
 * PRIORITY-PAGES Implementation 2 (2026-10-19, audit §B-1 + Improvement 2
 * — owner-approved frame): EVO holds the site's best measured standing
 * position (26 impr @ 4.65 + 1 click) yet shipped with no FAQ and no
 * conversation sample. This module follows the coaching-faq.ts precedent
 * (CONTENT-AUDIT P1-2): the page renders the same array as visible HTML,
 * and each language layout emits it as FAQPage JSON-LD — Google retired
 * FAQ rich results (May 2026) but AI answer engines parse JSON-LD from
 * the server HTML (the GEO citation gap this closes).
 *
 * Every number verified against src/lib/memberships.ts on 2026-10-19:
 * free chat 10/day · unified pool 2/4/8/8 (free/premium/pro/coaching) ·
 * swaps 3/week premium, 6/week pro & coaching · cross-device chat-history
 * restore paid-only · memory free-with-account · chat plans saved to the
 * dashboard subscriber-gated.
 */

export type EvoFaqItem = { q: string; a: string };

export const EVO_FAQ: Record<"en" | "ar", EvoFaqItem[]> = {
  en: [
    {
      q: "Is EVO free?",
      a: "Yes, for every visitor: 10 messages a day, plus one unified monthly pool for nutrition & workout plan generation (2 on Free, 4 on Premium, 8 on Pro and Coaching). Subscribers get unlimited chat, persistent memory, full chat-history restore across devices, and weekly meal/exercise swaps (3 a week on Premium, 6 on Pro).",
    },
    {
      q: "What data does EVO see?",
      a: "Your questionnaires, weight, measurements, plans, and progress — all visible to you in your profile. With an active subscription, your latest measurements (weight & waist) factor into the answers.",
    },
    {
      q: "How is EVO different from a regular chatbot?",
      a: "Generic answers versus answers built on your data: EVO reads your weight, measurements, and plans, can save the plan it builds straight into your plans dashboard instead of leaving it as chat text, and learns weekly from the platform's real (fully anonymized) plans.",
    },
    {
      q: "What's the difference between EVO and the two AI planners?",
      a: "The planners generate a complete plan from a model in seconds; EVO is a conversation that adapts your existing plan and answers your questions instantly. Many people generate the plan first, then keep EVO for the day-to-day.",
    },
    {
      q: "Is my conversation saved?",
      a: "Yes. With a free account your chat history is kept on your device; with a subscription it is restored in full across your devices.",
    },
    {
      q: "Can EVO swap a meal or exercise inside my plan?",
      a: "Yes, with a subscription: 3 swaps a week on Premium and 6 on Pro — one tap, and the result is saved into your plan automatically.",
    },
    {
      q: "Can it build a full plan from the chat?",
      a: "Yes — plans EVO builds in the conversation can be saved, with a subscription, to your plans dashboard as full plans you can manage, not just chat text.",
    },
    {
      q: "How do I start?",
      a: "Press \"Start chatting\" at the top of the page — the EVO drawer opens instantly, and you get 10 messages a day with no signup.",
    },
  ],
  ar: [
    {
      q: "هل EVO مجاني؟",
      a: "نعم، لكل زائر: 10 رسائل يوميًا، ورصيد شهري موحد واحد لتوليد خطط التغذية والتمارين (توليدان للمجاني، و4 مع بريميوم، و8 مع برو والتدريب الأونلاين). والمشتركون يحصلون على محادثة غير محدودة وذاكرة دائمة واسترجاع سجل المحادثة كاملًا عبر الأجهزة وتبديلات أسبوعية (3 أسبوعيًا مع بريميوم و6 مع برو).",
    },
    {
      q: "ما البيانات التي يقرأها EVO؟",
      a: "استبياناتك ووزنك وقياساتك وخططك وتقدمك — ويمكنك رؤيتها كلها من ملفك. ومع اشتراك فعّال تؤخذ قياساتك الأخيرة (الوزن ومحيط الخصر) في الحسبان عند صياغة الإجابات.",
    },
    {
      q: "ما الفرق بين EVO وروبوت المحادثة العادي؟",
      a: "إجابات عامة مقابل إجابات مبنية على بياناتك: يقرأ EVO وزنك وقياساتك وخططك، ويستطيع حفظ الخطة التي يبنيها مباشرة في لوحة خططك بدل بقائها نصًا في محادثة، ويتعلم أسبوعيًا من الخطط الحقيقية على المنصة (مجهولة الهوية بالكامل).",
    },
    {
      q: "ما الفرق بين EVO والمخططين بالذكاء الاصطناعي؟",
      a: "المخططان يولّدان خطة كاملة من نموذج في ثوانٍ؛ EVO محادثة تكيّف خطتك القائمة وتجيب أسئلتك لحظيًا. كثيرون يولّدون الخطة أولًا ثم يبقون مع EVO لليوم الطويل.",
    },
    {
      q: "هل تُحفظ محادثتي؟",
      a: "نعم — بحساب مجاني يبقى سجل محادثتك على جهازك؛ ومع الاشتراك يُستعاد كاملًا عبر أجهزتك.",
    },
    {
      q: "هل يستطيع EVO تبديل وجبة أو تمرين داخل خطتي؟",
      a: "نعم مع الاشتراك: 3 تبديلات أسبوعيًا مع بريميوم و6 مع برو — بضغطة واحدة، والنتيجة تُحفظ في خطتك تلقائيًا.",
    },
    {
      q: "هل يستطيع بناء خطة كاملة من المحادثة؟",
      a: "نعم — الخطط التي يبنيها EVO في المحادثة يمكن حفظها مع الاشتراك في لوحة خططك كخطط كاملة قابلة للإدارة، لا مجرد نص في محادثة.",
    },
    {
      q: "كيف أبدأ؟",
      a: "اضغط «ابدأ المحادثة» أعلى الصفحة — تفتح نافذة EVO فورًا، ولك 10 رسائل يوميًا بلا تسجيل.",
    },
  ],
};
