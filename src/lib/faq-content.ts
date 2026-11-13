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
 * AI planners · payments/lifecycle → /memberships · personal coach →
 * /coaching). AR rows link their own /ar/* mirrors. Links are display-
 * only — the FAQPage JSON-LD on both /faq pages keeps building from
 * q/a (links are invisible to the schema).
 */

export const FAQS_EN = [
  { q: "What is Alkemos?", a: "A bilingual fitness and nutrition platform: the EVO AI engine plus a large exercise library and food database for personalized plans and smart tracking.", links: [{ label: "Try the free tools", href: "/tools" }] },
  { q: "What is EVO?", a: "EVO is the AI performance engine. It reads your data and goal, builds personalized nutrition and workout plans, and suggests smart meal and exercise swaps. Chat is free for everyone (10 messages a day); plan generation and swaps are subscriber features with monthly quotas.", links: [{ label: "Meet EVO", href: "/evo" }] },
  { q: "Is there a personal coach?", a: "EVO is an AI coach. If you want human supervision, there's a separate personal coaching subscription you can join via the coaching page.", links: [{ label: "Online coaching", href: "/coaching" }] },
  { q: "How many AI plans per month?", a: "One unified monthly quota covers nutrition and workout plans together — a subscriber feature (Premium and above): Premium 4, Pro 8, and Coaching 8 successful generations per month. Free members keep every free tool and EVO chat. Failed generations never count, and the quota renews with your subscription cycle.", links: [{ label: "AI Meal Planner", href: "/ai-meal-planner" }, { label: "AI Workout Planner", href: "/ai-workout-planner" }] },
  { q: "What are swaps and how many do I get?", a: "Swaps replace individual meals or exercises within your plan — they never regenerate the whole plan. They are a subscriber feature with ONE unified monthly quota for both: Premium 8 per month and Pro/Coaching 16 per month (a meal swap or an exercise swap each use one unit of the same quota). The quota renews with your subscription cycle.", links: [{ label: "EVO swaps", href: "/evo" }] },
  { q: "Payment methods?", a: "PayPal (primary — instant and secure), InstaPay, and Vodafone Cash. PayPal processes automatically; manual methods require uploading a receipt which the team reviews within 24 hours.", links: [{ label: "Memberships & prices", href: "/memberships" }] },
  { q: "Is my data safe?", a: "Yes — access to your data is controlled at the database level itself: only you can view your records, along with the coach assigned to you (if any) and the authorized platform team when needed for support and operations." },
  { q: "What does a free account give me?", a: "Every plan you generate is saved to your account instead of staying on one device, synced across your devices, and manageable from your plans page. You also get your dashboard with progress tracking and questionnaires. Creating the account is free.", links: [{ label: "See the plans", href: "/memberships" }] },
  { q: "Is Alkemos mobile-friendly?", a: "Yes, fully responsive and installable as a PWA app on mobile." },
  { q: "When will I see results?", a: "Results vary by individual, consistency, starting point, and goals. Alkemos provides structured tools and guidance to help you make measurable progress over time." },
];

export const FAQS_AR = [
  { q: "ما هي منصة Alkemos؟", a: "منصة لياقة وتغذية متكاملة تعمل بالعربية والإنجليزية: محرك الذكاء الاصطناعي EVO مع مكتبة تمارين وقاعدة أطعمة لتقديم خطط مخصصة وتتبع ذكي.", links: [{ label: "جرّب الأدوات المجانية", href: "/ar/tools" }] },
  { q: "ما هو EVO؟", a: "EVO هو محرك الأداء الذكي في المنصة. يقرأ بياناتك وهدفك، ويبني لك خطط تغذية وتمارين مخصصة، ويقترح تبديلات ذكية للوجبات والتمارين. المحادثة مجانية للجميع (10 رسائل يوميًا)، وتوليد الخطط والتبديلات ميزة مشتركين بحصص شهرية.", links: [{ label: "تعرّف على EVO", href: "/ar/evo" }] },
  { q: "هل يوجد مدرب خاص؟", a: "EVO هو مدرب ذكاء اصطناعي. إذا كنت ترغب في متابعة بشرية مباشرة، يتوفر اشتراك تدريب أونلاين مع مدرب خاص منفصل يمكنك الانضمام إليه عبر صفحة التدريب الأونلاين.", links: [{ label: "التدريب الأونلاين", href: "/ar/coaching" }] },
  { q: "كم خطة بالذكاء الاصطناعي أحصل عليها شهريًا؟", a: "حصة شهرية موحدة واحدة تجمع خطط التغذية والتمارين معًا — وهي ميزة مشتركين (بريميوم وأعلى): بريميوم 4، وبرو 8، والتدريب الأونلاين 8 توليدات ناجحة شهريًا. ويحتفظ المجانيون بكل أدوات المنصة المجانية ومحادثة EVO. التوليد الفاشل لا يُحتسب إطلاقًا، وتتجدد الحصة مع دورة الاشتراك.", links: [{ label: "مخطط الوجبات بالذكاء الاصطناعي", href: "/ar/ai-meal-planner" }, { label: "مخطط التمارين بالذكاء الاصطناعي", href: "/ar/ai-workout-planner" }] },
  { q: "ما هي التبديلات وكم عددها؟", a: "التبديلات تعني استبدال وجبات أو تمارين فردية داخل خطتك دون إعادة إنشاء الخطة كاملة — وهي ميزة مشتركين بحصة شهرية موحدة للوجبات والتمارين معًا: بريميوم 8 تبديلات شهريًا وبرو والتدريب الأونلاين 16 شهريًا (تبديل الوجبة أو التمرين كلاهما يستهلك وحدة من الحصة نفسها). تتجدد الحصة مع دورة الاشتراك.", links: [{ label: "تبديلات EVO", href: "/ar/evo" }] },
  { q: "ما هي طرق الدفع المتاحة؟", a: "PayPal (الطريقة الرئيسية — فورية وآمنة)، InstaPay، و Vodafone Cash. PayPal يعالج الدفع تلقائيًا؛ أما الطرق اليدوية فتتطلب رفع إيصال يقوم الفريق بمراجعته خلال 24 ساعة.", links: [{ label: "العضويات والأسعار", href: "/ar/memberships" }] },
  { q: "هل بياناتي آمنة؟", a: "نعم — الوصول إلى بياناتك محكوم على مستوى قاعدة البيانات نفسها: لا يطّلع عليها إلا أنت، والمدرب المعيّن لك إن وُجد، وفريق المنصة المصرّح له عند الحاجة للدعم والتشغيل." },
  { q: "ماذا يمنحني الحساب المجاني؟", a: "كل خطة تولّدها تُحفظ في حسابك بدلًا من البقاء على جهاز واحد، وتتزامن عبر أجهزتك، وتديرها من صفحة خططي. كما تحصل على لوحتك الخاصة بمتابعة التقدم والاستبيانات. وإنشاء الحساب مجاني.", links: [{ label: "اطّلع على الباقات", href: "/ar/memberships" }] },
  { q: "هل المنصة متوافقة مع الجوال؟", a: "نعم، الموقع متجاوب بالكامل ويمكن تثبيته كتطبيق ويب تقدمي (PWA) على الجوال." },
  { q: "متى سأرى النتائج؟", a: "تختلف النتائج من شخص لآخر حسب الانتظام ونقطة البداية والأهداف. توفر Alkemos أدوات وإرشادًا منظمًا لمساعدتك على تحقيق تقدم قابل للقياس مع الوقت." },
];
