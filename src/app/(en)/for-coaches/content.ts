/**
 * FOR-COACHES shared content — FAQ pairs consumed by BOTH the client
 * landing page (src/app/for-coaches/page.tsx) and the server layout's
 * JSON-LD FAQPage schema (src/app/for-coaches/layout.tsx).
 * One source of truth so the visible copy and the structured data
 * can never drift apart.
 *
 * NOTE (seo.ts law): FAQPage rich results were retired by Google in
 * May 2026 — this schema is kept for non-Google semantic value, per
 * the existing site convention (getFAQSchema is still exported).
 */

export const COACH_FAQ_AR: Array<{ q: string; a: string }> = [
  {
    q: "هل التسجيل مدفوع؟",
    a: "لا — التسجيل كمدرب على المنصة مجاني. تدفع رسم تفعيل شهري ثابت لكل عميل وقت تفعيل اشتراكه من محفظتك، ولا توجد أي نسبة من دخلك.",
  },
  {
    q: "من يحدد أسعار عملائي؟",
    a: "أنت وحدك. سعر كل عميل قرارك بالكامل، وتحصّله بنفسك خارج المنصة بالوسيلة التي تريحك — نقدًا أو محفظة إلكترونية أو تحويل بنكي.",
  },
  {
    q: "كيف أستلم أموالي من العملاء؟",
    a: "العميل يدفع لك مباشرة — المنصة ليست وسيط دفع بينك وبين عميلك. أنت تحدد السعر، والعميل يحوّل المبلغ لك، ثم تفعّل اشتراكه من محفظتك على المنصة.",
  },
  {
    q: "ما الذي يدفعه المدرب للمنصة؟",
    a: "رسم تفعيل شهري ثابت ومعلن لكل عميل مفعّل، يُخصم من محفظتك على المنصة. ويمكنك شحن المحفظة عبر InstaPay أو فودافون كاش أو PayPal.",
  },
  {
    q: "ما حدود الذكاء الاصطناعي؟",
    a: "توليد الخطط لعميلك يسحب من حصته الموحدة حسب باقته — حصة شهرية واحدة تجمع خطط التغذية والتمارين معًا: بريميوم 4 توليدات شهريًا، وبرو 8، والتدريب الأونلاين 8 (ويورّث كل مزايا برو). وهي الحصة نفسها التي يستخدمها عميلك بنفسه من EVO وصفحات المخططات؛ تتجدد مع دورة اشتراكه، ولا يُحتسب إلا التوليد الناجح — الفاشل لا يحرق حصة. وتبديلات الوجبات والتمارين تسحب من حصة التبديلات الشهرية الموحدة للعميل (بريميوم 8 · برو والتدريب الأونلاين 16). أما التعديل بيدك ورفع الخطط اليدوية وأدوات التحرير التحريرية (إعادة توليد صنف غذائي أو يوم كامل) — فكلها غير محدودة تمامًا ولا تخصم من حصة العميل.",
  },
  {
    q: "هل سينتمي عملاؤي إلى الموقع؟",
    a: "لا. عملاؤك مسجّلون باسمك أنت وصلاحيات إدارتهم كلها لك — والموقع لا يقدّم لهم تدريبًا أونلاين من عنده ولا يستخدم بياناتهم في أعماله.",
  },
  {
    q: "هل يمكنني الاشتراك في مميزات الموقع كمدرب؟",
    a: "بالتأكيد. مثل أي عضو، يمكنك الاشتراك في عضوية Premium أو Pro والحصول على مميزات المنصة كاملة: محادثة EVO بلا حدود، ومخطط الوجبات، وحفظ نتائجك وتصديرها.",
  },
];

export const COACH_FAQ_EN: Array<{ q: string; a: string }> = [
  {
    q: "Does registration cost anything?",
    a: "No — registering as a coach is free. You pay a fixed monthly activation fee per client when you activate his subscription from your wallet, and never a percentage of your income.",
  },
  {
    q: "Who sets my clients' prices?",
    a: "You alone. Every client's price is entirely your call, and you collect it yourself outside the platform however you prefer — cash, mobile wallet, or bank transfer.",
  },
  {
    q: "How do I get paid?",
    a: "Clients pay you directly — the platform is not a payment middleman between you and them. You set the price, the client pays you, then you activate his subscription from your on-platform wallet.",
  },
  {
    q: "What does the coach pay the platform?",
    a: "A fixed, published monthly activation fee per activated client, debited from your on-platform wallet. You top the wallet up via InstaPay, Vodafone Cash, or PayPal.",
  },
  {
    q: "What are the AI limits?",
    a: "Generating a client's plans draws from his own unified monthly quota by tier — ONE quota for nutrition AND workouts combined: Premium 4 generations per month, Pro 8, and Coaching 8 (coaching inherits every Pro benefit). It is the same quota your client spends himself through EVO and the planner pages; it renews with his subscription cycle, and only successful generations count — failed ones never burn quota. Meal and exercise swaps draw from the client's ONE unified monthly swap quota (Premium 8 · Pro and Coaching 16). Hand-editing, manual uploads, and the staff editorial regeneration tools (food item / whole day) are all unlimited and never burn the client's quota.",
  },
  {
    q: "Will my clients belong to the site?",
    a: "No. Your clients are registered under your name and every management permission is yours — the site never coaches them itself and never uses their data for its own business.",
  },
  {
    q: "Can I subscribe to the site's features as a coach?",
    a: "Absolutely. Like any member, you can subscribe to Premium or Pro and unlock everything: unlimited EVO chat, the meal planner, and exportable saved results.",
  },
];
