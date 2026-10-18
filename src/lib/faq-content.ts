/**
 * FAQ content — single source of truth for BOTH language versions.
 *
 * FULL-SITE AUDIT + AR EXPANSION (2026-08-30): previously these arrays
 * lived inline in src/app/faq/page.tsx and fed that page's FAQPage
 * JSON-LD. With the new /ar/faq mirror (same commit) the AR page needs
 * the same data for its Arabic-first schema — so the arrays moved here
 * and both pages import them.
 *
 * PRIORITY-PAGES Implementation (2026-10-19, audit §E-2): each answer
 * now carries a destination link chip (EVO → /evo · planners → the two
 * AI planners · payments/lifecycle → /memberships · human coach →
 * /coaching). AR rows link their own /ar/* mirrors. Links are display-
 * only — the FAQPage JSON-LD on both /faq pages keeps building from
 * q/a (links are invisible to the schema).
 */

export const FAQS_EN = [
  { q: "What is Alkemos?", a: "A bilingual fitness and nutrition platform: the EVO AI engine plus a large exercise library and food database for personalized plans and smart tracking.", links: [{ label: "Try the free tools", href: "/tools" }] },
  { q: "What is EVO?", a: "EVO is the AI performance engine. It reads your data and goal, builds personalized nutrition and workout plans, and suggests smart meal and exercise swaps. Available to everyone — visitors and members alike — with tier-based limits.", links: [{ label: "Meet EVO", href: "/evo" }] },
  { q: "Is there a human coach?", a: "EVO is an AI coach. If you want human supervision, there's a separate human coaching subscription you can join via the coaching page.", links: [{ label: "Online coaching", href: "/coaching" }] },
  { q: "How many AI plans per month?", a: "One unified monthly pool covers nutrition and workout plans together: the Free tier (visitors included) gets 2 successful generations per month, Premium 4, Pro 8, and Coaching 8. Failed generations never count, and the pool resets on the 1st of each month.", links: [{ label: "AI Meal Planner", href: "/ai-meal-planner" }, { label: "AI Workout Planner", href: "/ai-workout-planner" }] },
  { q: "What are swaps and how many do I get?", a: "Swaps replace individual meals or exercises within your plan — they never regenerate the whole plan. Free: none. Premium: 3 meal/exercise swaps per week. Pro: 6 per week. Coaching: 6 per week. Swaps reset every Monday.", links: [{ label: "EVO swaps", href: "/evo" }] },
  { q: "Payment methods?", a: "PayPal (primary — instant and secure), InstaPay, and Vodafone Cash. PayPal processes automatically; manual methods require uploading a receipt which the team reviews within 24 hours.", links: [{ label: "Memberships & prices", href: "/memberships" }] },
  { q: "Is my data safe?", a: "Yes — access to your data is controlled at the database level itself: only you can view your records, along with the coach assigned to you (if any) and the authorized platform team when needed for support and operations." },
  { q: "What does a free account give me?", a: "Every plan you generate is saved to your account instead of staying on one device, synced across your devices, and manageable from your plans page. You also get your dashboard with progress tracking and questionnaires. Creating the account is free.", links: [{ label: "See the plans", href: "/memberships" }] },
  { q: "Is Alkemos mobile-friendly?", a: "Yes, fully responsive and installable as a PWA app on mobile." },
  { q: "When will I see results?", a: "Results vary by individual, consistency, starting point, and goals. Alkemos provides structured tools and guidance to help you make measurable progress over time." },
];

export const FAQS_AR = [
  { q: "ما هي منصة Alkemos؟", a: "منصة لياقة وتغذية متكاملة تعمل بالعربية والإنجليزية: محرك الذكاء الاصطناعي EVO مع مكتبة تمارين وقاعدة أطعمة لتقديم خطط مخصصة وتتبع ذكي.", links: [{ label: "جرّب الأدوات المجانية", href: "/ar/tools" }] },
  { q: "ما هو EVO؟", a: "EVO هو محرك الأداء الذكي في المنصة. يقرأ بياناتك وهدفك، ويبني لك خطط تغذية وتمارين مخصصة، ويقترح تبديلات ذكية للوجبات والتمارين. متاح للجميع، للزوار والأعضاء على حد سواء، وفق حدود الاستخدام.", links: [{ label: "تعرّف على EVO", href: "/ar/evo" }] },
  { q: "هل يوجد مدرب بشري؟", a: "EVO هو مدرب ذكاء اصطناعي. إذا كنت ترغب في متابعة بشرية مباشرة، يتوفر اشتراك تدريب أونلاين مع مدرب بشري منفصل يمكنك الانضمام إليه عبر صفحة التدريب الأونلاين.", links: [{ label: "التدريب الأونلاين", href: "/ar/coaching" }] },
  { q: "كم خطة بالذكاء الاصطناعي أحصل عليها شهرياً؟", a: "رصيد شهري موحد واحد يجمع خطط التغذية والتمارين معاً: الباقة المجانية (والزوار ضمنها) توليدان ناجحان شهرياً، وبريميوم 4، وبرو 8، والتدريب الأونلاين 8. التوليد الفاشل لا يُحتسب إطلاقاً، ويتجدد الرصيد في أول كل شهر.", links: [{ label: "مخطط الوجبات بالذكاء الاصطناعي", href: "/ar/ai-meal-planner" }, { label: "مخطط التمارين بالذكاء الاصطناعي", href: "/ar/ai-workout-planner" }] },
  { q: "ما هي التبديلات وكم عددها؟", a: "التبديلات تعني استبدال وجبات أو تمارين فردية داخل خطتك دون إعادة إنشاء الخطة كاملة. الباقة المجانية: لا توجد. بريميوم: 3 تبديلات للوجبات أو التمارين أسبوعيًا. برو: 6 أسبوعيًا. التدريب الأونلاين: 6 أسبوعيًا. تتجدد كل يوم اثنين.", links: [{ label: "تبديلات EVO", href: "/ar/evo" }] },
  { q: "ما هي طرق الدفع المتاحة؟", a: "PayPal (الطريقة الرئيسية — فورية وآمنة)، InstaPay، و Vodafone Cash. PayPal يعالج الدفع تلقائياً؛ أما الطرق اليدوية فتتطلب رفع إيصال يقوم الفريق بمراجعته خلال 24 ساعة.", links: [{ label: "العضويات والأسعار", href: "/ar/memberships" }] },
  { q: "هل بياناتي آمنة؟", a: "نعم — الوصول إلى بياناتك محكوم على مستوى قاعدة البيانات نفسها: لا يطّلع عليها إلا أنت، والمدرب المعيّن لك إن وُجد، وفريق المنصة المصرّح له عند الحاجة للدعم والتشغيل." },
  { q: "ماذا يمنحني الحساب المجاني؟", a: "كل خطة تولّدها تُحفظ في حسابك بدلًا من البقاء على جهاز واحد، وتتزامن عبر أجهزتك، وتديرها من صفحة خططي. كما تحصل على لوحتك الخاصة بمتابعة التقدم والاستبيانات. وإنشاء الحساب مجاني.", links: [{ label: "اطّلع على الباقات", href: "/ar/memberships" }] },
  { q: "هل المنصة متوافقة مع الجوال؟", a: "نعم، الموقع متجاوب بالكامل ويمكن تثبيته كتطبيق ويب تقدمي (PWA) على الجوال." },
  { q: "متى سأرى النتائج؟", a: "تختلف النتائج من شخص لآخر حسب الانتظام ونقطة البداية والأهداف. توفر Alkemos أدوات وإرشادًا منظمًا لمساعدتك على تحقيق تقدم قابل للقياس مع الوقت." },
];
