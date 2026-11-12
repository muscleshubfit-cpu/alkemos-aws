/**
 * Comparison pages — SEO/GEO master plan §6.3 (Phase SEO-GEO-3, 2026-09-08).
 *
 * "Alkemos vs [Competitor]" pages target high-intent, high-commercial-value
 * queries from users actively comparing fitness platforms before they sign
 * up or pay. These queries have lower competition than head terms and
 * convert at 3–5× the rate of top-of-funnel blog traffic.
 *
 * Every comparison page ships:
 *   - Comparison table (features, prices, content depth, AI coach, languages)
 *   - Long-form review (~1500 words) with verdict
 *   - ItemList schema listing both products
 *   - Article schema (with author + reviewedBy Persons from Phase SEO-GEO-2)
 *   - Internal links to /memberships, /evo, /exercises, /foods
 *
 * Adding a new comparison:
 *   1. Append to COMPARISONS with slug + competitor data + verdict
 *   2. The page + sitemap pick it up automatically
 *   3. No code changes needed
 *
 * Data accuracy: prices and feature lists are based on public competitor
 * websites as of the "dataAsOf" date. Re-verify quarterly.
 */

export type ComparisonRow = {
  /** Feature label (bilingual) */
  labelEn: string;
  labelAr: string;
  /** Alkemos's value for this feature (bilingual — AR cells render on /ar) */
  alkemosValue: string;
  alkemosValueAr: string;
  /** Competitor's value for this feature (bilingual — AR cells render on /ar) */
  competitorValue: string;
  competitorValueAr: string;
  /** "win" | "loss" | "tie" — drives the row's visual treatment */
  outcome: "win" | "loss" | "tie";
};

export type Comparison = {
  slug: string;
  competitorName: string;
  competitorNameAr: string;
  competitorUrl: string;
  /**
   * The date the comparison DATA was last live-verified against the
   * competitor's public site (re-verified quarterly). Drives
   * Article.dateModified + the EXPLICIT Article.lastReviewed — the
   * same claim the visible page header makes ("Data as of … · Reviewed
   * by Ahmed Zake"). W1-1 (E-03, audit 2026-10-02).
   */
  dataAsOf: string; // ISO date
  /**
   * The comparison page's REAL first-publish date — the STABLE release
   * date for Article.datePublished. Sourced from git history (d238e96a
   * 2026-09-07 for the original three · cae890f4 2026-09-30 for
   * Cronometer). NEVER bumped on quarterly re-verification (that moves
   * dataAsOf only) — a moving publish date would be the same fabricated
   * freshness the W1-1 fix removed. W1-1 (E-03, audit 2026-10-02).
   */
  publishedAt: string; // ISO date — stable, never bumped on re-verify

  titleEn: string;
  titleAr: string;
  h1En: string;
  h1Ar: string;
  introEn: string;
  introAr: string;
  descriptionEn: string;
  descriptionAr: string;

  verdictEn: string;
  verdictAr: string;

  rows: ComparisonRow[];

  /** Long-form body sections (bilingual). Each section = {heading, paragraphs[]} */
  bodyEn: Array<{ heading: string; paragraphs: string[] }>;
  bodyAr: Array<{ heading: string; paragraphs: string[] }>;
};

export const COMPARISONS: Comparison[] = [
  // ==========================================================================
  // 1. Alkemos vs MyFitnessPal
  // ==========================================================================
  {
    slug: "alkemos-vs-myfitnesspal",
    competitorName: "MyFitnessPal",
    competitorNameAr: "MyFitnessPal",
    competitorUrl: "https://www.myfitnesspal.com",
    // 2026-09-15: affiliate-program row added after live re-verification
    // (MFP runs its program via agency/partner networks — Acceleration
    // Partners, announced on accelerationpartners.com 2023-04-03).
    dataAsOf: "2026-09-15",
    // First shipped with the comparison surface (git d238e96a).
    publishedAt: "2026-09-07",

    titleEn: "Alkemos vs MyFitnessPal — Full Comparison (2026) | Alkemos",
    titleAr: "Alkemos مقابل MyFitnessPal — مقارنة كاملة (2026) | Alkemos",
    h1En: "Alkemos vs MyFitnessPal",
    h1Ar: "Alkemos مقابل MyFitnessPal",
    introEn:
      "A head-to-head comparison between Alkemos and MyFitnessPal — two platforms that overlap on food tracking but differ sharply on coaching, exercise instruction, AI features, and pricing model. MyFitnessPal is the established calorie tracker with 200M+ users; Alkemos is a newer platform that combines food tracking with a full exercise library, workout programs, free tools, and an AI coach. This page breaks down where each wins.",
    introAr:
      "مقارنة مباشرة بين Alkemos و MyFitnessPal — منصتان تتقاطعان في تتبّع الطعام لكنهما تختلفان اختلافًا جوهريًا في التدريب، شرح التمارين، ميزات الذكاء الاصطناعي، ونموذج التسعير. MyFitnessPal هو متتبّع السعرات المعروف بأكثر من 200 مليون مستخدم؛ Alkemos منصة أحدث تجمع بين تتبّع الطعام ومكتبة تمارين كاملة، برامج تدريب، أدوات مجانية، ومدرب ذكاء اصطناعي. هذه الصفحة تُفصّل أين يتفوّق كل منهما.",
    descriptionEn:
      "Alkemos vs MyFitnessPal 2026 comparison: food tracking, exercise library, AI coach, pricing, languages, and which platform fits your goals.",
    descriptionAr:
      "مقارنة Alkemos مقابل MyFitnessPal 2026: تتبّع الطعام، مكتبة التمارين، مدرب الذكاء الاصطناعي، الأسعار، اللغات، وأي منصة تناسب أهدافك.",

    verdictEn:
      "Pick MyFitnessPal if you only want calorie tracking and already have a workout routine. Pick Alkemos if you want a complete platform — exercise instruction, workout programs, AI coaching, and food data — in one place, especially if you read Arabic.",
    verdictAr:
      "اختر MyFitnessPal إذا كنت تريد تتبّع السعرات فقط ولديك روتين تمارين بالفعل. اختر Alkemos إذا كنت تريد منصة كاملة — شرح التمارين، برامج التدريب، تدريب ذكاء اصطناعي، وبيانات أطعمة — في مكان واحد، خاصة إذا كنت تقرأ بالعربية.",

    rows: [
      {
        labelEn: "Food database size",
        labelAr: "حجم قاعدة الأطعمة",
        alkemosValue: "8,162+ foods (USDA-backed + curated)",
        alkemosValueAr: "8,162+ صنف غذائي (بمعايير USDA ومنسّقة بدقة)",
        competitorValue: "Millions (user-contributed, varying accuracy)",
        competitorValueAr: "ملايين الأصناف (مدخلات من المستخدمين بدقة متفاوتة)",
        outcome: "loss",
      },
      {
        labelEn: "Exercise library",
        labelAr: "مكتبة التمارين",
        alkemosValue: "868+ exercises with step-by-step instructions",
        alkemosValueAr: "868+ تمرينًا بشرح خطوة بخطوة",
        competitorValue: "No exercise library",
        competitorValueAr: "لا توجد مكتبة تمارين",
        outcome: "win",
      },
      {
        labelEn: "Workout programs",
        labelAr: "برامج التدريب",
        alkemosValue: "Ready-made programs (home & gym, all levels)",
        alkemosValueAr: "برامج جاهزة (للمنزل والنادي الرياضي، كل المستويات)",
        competitorValue: "No workout programs",
        competitorValueAr: "لا توجد برامج تدريب",
        outcome: "win",
      },
      {
        labelEn: "AI coach",
        labelAr: "مدرب الذكاء الاصطناعي",
        alkemosValue: "EVO AI — plan generation, meal & exercise swaps, 24/7 chat",
        alkemosValueAr: "EVO AI — توليد خطط، تبديلات وجبات وتمارين، ومحادثة على مدار الساعة",
        competitorValue: "No AI coach (premium has basic insights)",
        competitorValueAr: "لا مدرب ذكاء اصطناعي (النسخة المدفوعة فيها رؤى أساسية)",
        outcome: "win",
      },
      {
        labelEn: "Free tools & calculators",
        labelAr: "الأدوات والحاسبات المجانية",
        // 2026-09-15 accuracy fix: the hub serves 4 calculators + a water
        // tracker (tools-shared.ts) — the old cell counted the water
        // tracker as a fifth calculator.
        alkemosValue: "8 free tools (4 calculators, water tracker, meal planner, 2 AI planners)",
        alkemosValueAr: "8 أدوات مجانية (4 حاسبات، متتبع ماء، مخطط وجبات، ومخططَي ذكاء اصطناعي)",
        competitorValue: "Premium-only calculators",
        competitorValueAr: "حاسبات مدفوعة فقط",
        outcome: "win",
      },
      {
        labelEn: "Arabic language support",
        labelAr: "دعم اللغة العربية",
        alkemosValue: "Full bilingual (Arabic + English) with RTL",
        alkemosValueAr: "ثنائي اللغة بالكامل (عربية + إنجليزية) مع دعم RTL",
        competitorValue: "No Arabic interface",
        competitorValueAr: "لا تدعم العربية",
        outcome: "win",
      },
      {
        labelEn: "Pricing (premium)",
        labelAr: "التسعير (النسخة المدفوعة)",
        alkemosValue: "$14.99/mo or $119/yr",
        alkemosValueAr: "$14.99 شهريًا أو $119 سنويًا",
        competitorValue: "$19.99/mo or $79.99/yr",
        competitorValueAr: "$19.99 شهريًا أو $79.99 سنويًا",
        outcome: "tie",
      },
      {
        labelEn: "Barcode scanner",
        labelAr: "ماسح الباركود",
        alkemosValue: "Not available",
        alkemosValueAr: "غير متوفر",
        competitorValue: "Yes (extensive packaged-food database)",
        competitorValueAr: "نعم (قاعدة واسعة من الأطعمة المعلّبة)",
        outcome: "loss",
      },
      {
        labelEn: "Personal coaching",
        labelAr: "التدريب الخاص",
        alkemosValue: "Available — $39.99/mo with a personal coach",
        alkemosValueAr: "متوفر — $39.99 شهريًا مع مدرب خاص",
        competitorValue: "Not available",
        competitorValueAr: "غير متوفر",
        outcome: "win",
      },
      {
        // 2026-09-15 (owner directive — comparison tables must reflect the
        // current Alkemos service set): the public affiliate program is a
        // live Alkemos service (COMMISSION_RATE 20%, affiliate-constants.ts).
        // MFP verified to run an affiliate program through partner
        // networks/agency (Acceleration Partners) — honest tie.
        labelEn: "Affiliate program",
        labelAr: "برنامج الأفلييت (الشركاء)",
        alkemosValue: "Public program — 20% commission on subscriptions",
        alkemosValueAr: "برنامج علني — عمولة 20% على الاشتراكات",
        competitorValue: "Affiliate program via partner networks",
        competitorValueAr: "برنامج أفلييت عبر شبكات شريكة",
        outcome: "tie",
      },
    ],

    bodyEn: [
      {
        heading: "Where MyFitnessPal wins",
        paragraphs: [
          "MyFitnessPal has the largest food database on the internet — millions of user-contributed entries, including restaurant meals, packaged foods, and regional brands. If your primary goal is calorie tracking and you eat a lot of packaged foods, MyFitnessPal's barcode scanner (premium feature) and 14-million-food database are unmatched. Alkemos's 8,162+-food database is curated and USDA-backed for accuracy, but it cannot compete on raw count.",
          "MyFitnessPal also has a 20-year head start on mobile UX. The app is polished, syncs with every wearable (Apple Watch, Garmin, Fitbit), and has social features that Alkemos does not (friend feeds, challenges). If you want a pure tracker that integrates with your existing fitness ecosystem, MyFitnessPal remains the safer bet.",
        ],
      },
      {
        heading: "Where Alkemos wins",
        paragraphs: [
          "Alkemos wins decisively on platform breadth. MyFitnessPal is a calorie tracker — Alkemos is a complete fitness platform. The 868+-exercise library with step-by-step form instructions, ready-made workout programs for every goal and equipment setup, eight free tools — four calculators (calorie, BMI, macro, body fat), a water tracker, a meal planner, and two AI planners — and the EVO AI coach together cover what would cost you 3–4 separate subscriptions on the MyFitnessPal model.",
          "The EVO AI coach is the single biggest differentiator. MyFitnessPal's premium tier offers 'insights' — basic charts and trends. Alkemos's EVO reads your health data, builds you a personalized nutrition and workout plan, suggests meal and exercise swaps based on your preferences, and answers fitness questions 24/7. This is closer to having a personal coach than a tracker.",
          "Arabic speakers have no real choice: MyFitnessPal ships in many languages but offers no Arabic interface. Alkemos is fully bilingual with native RTL support, including Arabic exercise names, Arabic food names, and an Arabic AI coach. For the 400M+ Arabic speakers underserved by Western fitness apps, this alone is the deciding factor.",
        ],
      },
      {
        heading: "Pricing comparison",
        paragraphs: [
          "MyFitnessPal Premium is $19.99/month or $79.99/year, and a Premium+ tier ($24.99/month or $99.99/year) adds its Meal Planner. Alkemos Premium is $14.99/month or $119/year — slightly cheaper monthly, slightly more annually, but with dramatically more features included. Alkemos Pro ($29.99/month) raises the unified AI pool to 8 plan generations/month with 6 meal/exercise swaps per week and removes ads; MyFitnessPal has no equivalent tier. Alkemos Coaching ($39.99/month) adds a personal coach; MyFitnessPal offers no personal coaching at any price.",
          "The free tier comparison is even sharper. Alkemos Free includes the full exercise library, the full food database, all eight free tools, and limited EVO AI access. MyFitnessPal Free is a calorie counter with ads — barcode scanning and its deeper insights are Premium-only. For users who want to evaluate the platform before paying, Alkemos Free is meaningfully more useful.",
        ],
      },
    ],
    bodyAr: [
      {
        heading: "أين يتفوّق MyFitnessPal",
        paragraphs: [
          "MyFitnessPal يملك أكبر قاعدة أطعمة على الإنترنت — ملايين المدخلات المُساهمة من المستخدمين، بما في ذلك وجبات المطاعم، الأطعمة المُعلّبة، والعلامات الإقليمية. إذا كان هدفك الأساسي تتبّع السعرات وتتناول الكثير من الأطعمة المُعلّبة، ماسح الباركود في MyFitnessPal (ميزة مدفوعة) وقاعدة الـ14 مليون طعام لا تُضاهى. قاعدة الـ8,162+ صنفًا غذائيًا في Alkemos مُختارة ومستندة لـ USDA للدقّة، لكنها لا تنافس في حجم القاعدة الخام.",
          "لدى MyFitnessPal أيضًا نحو عشرين عامًا من السبق في تجربة الاستخدام على الجوال. التطبيق مصقول، يتزامن مع كل ساعة ذكية (Apple Watch، Garmin، Fitbit)، وله ميزات اجتماعية لا يملكها Alkemos (موجز منشورات الأصدقاء، التحدّيات). إذا كنت تريد متتبّعًا خالصًا يتكامل مع نظام لياقتك الحالي، MyFitnessPal يبقى الخيار الأكثر أمانًا.",
        ],
      },
      {
        heading: "أين يتفوّق Alkemos",
        paragraphs: [
          "Alkemos يتفوّق بوضوح في اتساع المنصة. MyFitnessPal متتبّع سعرات — Alkemos منصة لياقة كاملة. مكتبة الـ868+ تمرينًا مع شرح خطوة بخطوة، برامج التدريب الجاهزة لكل هدف وتجهيز، ثماني أدوات مجانية (أربع حاسبات: سعرات، BMI، ماكروز، نسبة دهون — إضافة إلى متتبع الماء ومخطط الوجبات ومولدا خطط الذكاء الاصطناعي)، ومدرب الذكاء الاصطناعي EVO مجتمعةً تغطّي ما كلّفك 3–4 اشتراكات منفصلة في نموذج MyFitnessPal.",
          "مدرب EVO الذكي هو الفارق الأكبر. النسخة المدفوعة من MyFitnessPal تُقدّم «رؤى» — رسوم بيانية واتجاهات أساسية. EVO في Alkemos يقرأ بياناتك الصحية، يبني لك خطة تغذية وتمارين مخصصة، يقترح تبديلات للوجبات والتمارين حسب تفضيلاتك، ويُجيب على أسئلة اللياقة على مدار الساعة. هذا أقرب لامتلاك مدرب خاص من امتلاك متتبّع.",
          "الناطقون بالعربية ليس لديهم خيار حقيقي: MyFitnessPal يدعم لغات عديدة لكنه لا يوفر واجهة عربية. Alkemos ثنائي اللغة بالكامل مع دعم RTL أصلي، بما في ذلك أسماء التمارين بالعربية، أسماء الأطعمة بالعربية، ومدرب ذكاء اصطناعي عربي. وبما أن تطبيقات اللياقة الغربية لا تخدم أكثر من 400 مليون ناطق بالعربية، فهذه الميزة وحدها كفيلة بحسم القرار.",
        ],
      },
      {
        heading: "مقارنة الأسعار",
        paragraphs: [
          "MyFitnessPal Premium بسعر $19.99/شهر أو $79.99/سنة، وهناك مستوى Premium+ ($24.99/شهر أو $99.99/سنة) يضيف مخطط الوجبات. Alkemos Premium بسعر $14.99/شهر أو $119/سنة — أرخص قليلًا شهريًا، أغلى قليلًا سنويًا، لكن بميزات أكثر بكثير. Alkemos Pro ($29.99/شهر) يرفع الرصيد الموحد إلى 8 توليدات بالذكاء الاصطناعي شهريًا مع 6 تبديلات للوجبات أو التمارين أسبوعيًا ويُزيل الإعلانات؛ MyFitnessPal لا يملك مستوى مكافئ. التدريب الأونلاين في Alkemos ($39.99/شهر) يُضيف مدربًا خاصًا؛ MyFitnessPal لا يُقدّم تدريبًا خاصًا بأي سعر.",
          "مقارنة المستوى المجاني أوضح. Alkemos مجاني يضم مكتبة التمارين الكاملة، قاعدة الأطعمة الكاملة، كل الأدوات الثماني، ووصول محدود لـ EVO. MyFitnessPal مجاني عدّاد سعرات مع إعلانات — ماسح الباركود والرؤى الأعمق ميزات مدفوعة. للمستخدمين الذين يريدون تقييم المنصة قبل الدفع، Alkemos مجاني أكثر فائدة بشكل معنوي.",
        ],
      },
    ],
  },

  // ==========================================================================
  // 2. Alkemos vs Freeletics
  // ==========================================================================
  {
    slug: "alkemos-vs-freeletics",
    competitorName: "Freeletics",
    competitorNameAr: "Freeletics",
    competitorUrl: "https://www.freeletics.com",
    // 2026-09-15: free-tools + affiliate rows added after live
    // re-verification (Freeletics runs an affiliate program via networks
    // such as FlexOffers/Awin; its site offers no free tools hub).
    dataAsOf: "2026-09-15",
    // First shipped with the comparison surface (git d238e96a).
    publishedAt: "2026-09-07",

    // SEO title ceiling (comprehensive audit 2026-11-04): 78 → 64 chars —
    // brand suffix dropped (blog-article convention) to fit the site's
    // measured ≤75 healthy range; every keyword survives.
    titleEn: "Alkemos vs Freeletics — AI Coaching & Bodyweight Training (2026)",
    // Same audit: AR <title> renders through the /ar layout template
    // `%s — Alkemos` (10 chars appended), so the input must stay ≤65
    // to keep the RENDERED title ≤75. "مدرب ذكاء اصطناعي" is also the
    // sharper intent match (Freeletics' product IS an AI coach).
    titleAr: "Alkemos مقابل Freeletics — مدرب ذكاء اصطناعي وتمارين الجسم (2026)",
    h1En: "Alkemos vs Freeletics",
    h1Ar: "Alkemos مقابل Freeletics",
    introEn:
      "Alkemos and Freeletics both offer AI-driven fitness coaching, but they target very different users. Freeletics built its reputation on bodyweight HIIT workouts for busy people; Alkemos is a broader platform covering gym training, nutrition, food tracking, and calculators alongside its AI coach. This comparison helps you pick the right one for your training style.",
    introAr:
      "Alkemos و Freeletics كلاهما يُقدّم تدريب لياقة بالذكاء الاصطناعي، لكنهما يستهدفان مستخدمين مختلفين جدًا. Freeletics بنى سمعته على تمارين HIIT بوزن الجسم للأشخاص المشغولين؛ Alkemos منصة أوسع تغطّي تدريب الجيم، التغذية، تتبّع الطعام، والحاسبات بجانب مدربه الذكي. هذه المقارنة تساعدك في اختيار المناسبة لأسلوب تدريبك.",
    descriptionEn:
      "Alkemos vs Freeletics 2026: AI coach quality, exercise variety, nutrition tracking, pricing, and which fits your training style.",
    descriptionAr:
      "Alkemos مقابل Freeletics 2026: جودة مدرب الذكاء الاصطناعي، تنوّع التمارين، تتبّع التغذية، الأسعار، وأيها يناسب أسلوب تدريبك.",

    verdictEn:
      "Pick Freeletics if you want pure bodyweight HIIT with a focus on quick, intense sessions. Pick Alkemos if you train at a gym, want nutrition + training in one platform, or read Arabic.",
    verdictAr:
      "اختر Freeletics إذا كنت تريد HIIT بوزن الجسم بتركيز على جلسات سريعة مكثّفة. اختر Alkemos إذا كنت تتدرّب في نادٍ رياضي، تريد التغذية + التدريب في منصة واحدة، أو تقرأ بالعربية.",

    rows: [
      {
        labelEn: "Training focus",
        labelAr: "تركيز التدريب",
        alkemosValue: "Full-spectrum (gym, home, bodyweight, equipment-based)",
        alkemosValueAr: "تدريب شامل (نادٍ رياضي، منزل، وزن الجسم، بالمعدات)",
        competitorValue: "Bodyweight HIIT only",
        competitorValueAr: "تمارين HIIT بوزن الجسم فقط",
        outcome: "win",
      },
      {
        labelEn: "Exercise library size",
        labelAr: "حجم مكتبة التمارين",
        alkemosValue: "868+ exercises across all equipment",
        alkemosValueAr: "868+ تمرينًا بكل أنواع المعدات",
        competitorValue: "AI-built workouts from a bodyweight movement pool (no public library)",
        competitorValueAr: "تمارين يبنيها الذكاء الاصطناعي من مجموعة حركات وزن الجسم (لا مكتبة معلنة)",
        outcome: "win",
      },
      {
        labelEn: "AI coach",
        labelAr: "مدرب الذكاء الاصطناعي",
        alkemosValue: "EVO AI — plan generation + 24/7 chat + meal & exercise swaps",
        alkemosValueAr: "EVO AI — توليد خطط + محادثة على مدار الساعة + تبديلات وجبات وتمارين",
        competitorValue: "AI Coach (workout personalization)",
        competitorValueAr: "مدرب ذكي (تخصيص التمارين)",
        outcome: "tie",
      },
      {
        labelEn: "Nutrition tracking",
        labelAr: "تتبّع التغذية",
        alkemosValue: "8,162+ food database + AI meal planner",
        alkemosValueAr: "قاعدة 8,162+ صنف غذائي + مخطط وجبات بالذكاء الاصطناعي",
        competitorValue: "AI Nutrition Coach (meal plans & recipes — no food tracking)",
        competitorValueAr: "مدرب تغذية ذكي (خطط وجبات ووصفات — بلا تتبّع للطعام)",
        outcome: "win",
      },
      {
        labelEn: "Workout programs",
        labelAr: "برامج التدريب",
        alkemosValue: "Ready-made + AI-generated",
        alkemosValueAr: "برامج جاهزة + مولّدة بالذكاء الاصطناعي",
        competitorValue: "AI-generated + preset training plans",
        competitorValueAr: "مولّدة بالذكاء الاصطناعي + خطط جاهزة",
        outcome: "tie",
      },
      {
        labelEn: "Free tools & calculators",
        labelAr: "الأدوات والحاسبات المجانية",
        // 2026-09-15 (owner directive — service coverage): Freeletics has
        // no free tools/calculators hub (subscription app) — absence-based
        // cell, same pattern as the MFP "no exercise library" cells.
        alkemosValue: "8 free tools (4 calculators, water tracker, meal planner, 2 AI planners)",
        alkemosValueAr: "8 أدوات مجانية (4 حاسبات، متتبع ماء، مخطط وجبات، ومخططَي ذكاء اصطناعي)",
        competitorValue: "No free tools or calculators (subscription app)",
        competitorValueAr: "لا أدوات أو حاسبات مجانية (تطبيق باشتراك)",
        outcome: "win",
      },
      {
        labelEn: "Arabic language",
        labelAr: "اللغة العربية",
        alkemosValue: "Full Arabic + RTL",
        alkemosValueAr: "عربية كاملة + دعم RTL",
        competitorValue: "English + 9 more languages (no Arabic)",
        competitorValueAr: "إنجليزية + 9 لغات أخرى (بلا عربية)",
        outcome: "win",
      },
      {
        labelEn: "Pricing",
        labelAr: "التسعير",
        alkemosValue: "Premium $14.99/mo ($119/yr) · Pro $29.99/mo ($239/yr)",
        alkemosValueAr: "بريميوم $14.99 شهريًا ($119 سنويًا) · برو $29.99 شهريًا ($239 سنويًا)",
        competitorValue: "Training Coach ~$80/yr (12-mo) — nutrition bundle costs more",
        competitorValueAr: "مدرب التدريب ~$80 سنويًا (خطة 12 شهرًا) — حزمة التغذية بتكلفة إضافية",
        outcome: "tie",
      },
      {
        labelEn: "Personal coaching",
        labelAr: "التدريب الخاص",
        alkemosValue: "Available — $39.99/mo with a personal coach",
        alkemosValueAr: "متوفر — $39.99 شهريًا مع مدرب خاص",
        competitorValue: "AI coaching only — no personal coaches",
        competitorValueAr: "تدريب ذكي فقط — لا مدربين خاصين",
        outcome: "win",
      },
      {
        labelEn: "Audio coaching",
        labelAr: "التدريب الصوتي",
        alkemosValue: "Not available",
        alkemosValueAr: "غير متوفر",
        competitorValue: "Yes (motivational audio cues)",
        competitorValueAr: "نعم (تحفيز صوتي أثناء التمرين)",
        outcome: "loss",
      },
      {
        labelEn: "Community",
        labelAr: "المجتمع",
        alkemosValue: "Coach marketplace + affiliate program",
        alkemosValueAr: "سوق مدربين + برنامج أفلييت",
        competitorValue: "Large global community + challenges",
        competitorValueAr: "مجتمع عالمي كبير + تحدّيات",
        outcome: "tie",
      },
      {
        // 2026-09-15 (owner directive — service coverage): affiliate row —
        // Freeletics runs a real affiliate program (FlexOffers/Awin +
        // application form) — honest tie.
        labelEn: "Affiliate program",
        labelAr: "برنامج الأفلييت (الشركاء)",
        alkemosValue: "Public program — 20% commission on subscriptions",
        alkemosValueAr: "برنامج علني — عمولة 20% على الاشتراكات",
        competitorValue: "Affiliate program via affiliate networks",
        competitorValueAr: "برنامج أفلييت عبر شبكات أفلييت",
        outcome: "tie",
      },
    ],

    bodyEn: [
      {
        heading: "Where Freeletics wins",
        paragraphs: [
          "Freeletics is the gold standard for bodyweight HIIT. If you have zero equipment, 20 minutes a day, and want to sweat hard, Freeletics's AI Coach generates workouts that are genuinely tough and well-paced. The audio coaching (premium feature) calls out exercises and rep counts so you can keep your phone on the floor — a small UX touch that matters a lot during a burpee set.",
          "Freeletics also has a large, active global community with weekly challenges and leaderboards. For users motivated by social accountability, this is a real feature, not a marketing bullet. Alkemos does not yet have a comparable community surface.",
        ],
      },
      {
        heading: "Where Alkemos wins",
        paragraphs: [
          "Alkemos wins on platform breadth. Freeletics is a bodyweight-only app — if you ever want to lift a barbell, use a cable machine, or follow a structured 4-day gym split, Freeletics cannot help you. Alkemos covers every equipment type: barbell, dumbbell, cable, machine, kettlebell, band, and bodyweight. The 868+-exercise library across every equipment type has no equivalent in Freeletics's bodyweight-only catalog.",
          "Nutrition is the other major gap. Freeletics offers an AI Nutrition Coach with meal plans and recipes but no food tracking — you'd need a separate app (usually MyFitnessPal) for that. Alkemos ships an 8,162+ food database, eight free tools (four calculators, a water tracker, a meal planner, and two AI planners), and full macro tracking inside the same subscription. Paying for Freeletics + MyFitnessPal Premium costs more than Alkemos Premium and gives you less integration.",
          "The pricing picture is nuanced. Freeletics Training Coach is about $80/year on the 12-month plan, with its nutrition bundle costing extra. Alkemos Premium is $119/year and bundles training plans, the 8,162+-food database, the free tools, and EVO in one subscription. For the same training + nutrition use case, Alkemos is the better value.",
        ],
      },
    ],
    bodyAr: [
      {
        heading: "أين يتفوّق Freeletics",
        paragraphs: [
          "Freeletics هو المعيار الذهبي لتمارين HIIT بوزن الجسم. إذا كان لديك صفر معدات، 20 دقيقة يوميًا، وتريد التعرّق بقوة، مدرب Freeletics الذكي يولّد تمارين صعبة فعلًا وإيقاعها جيد. التدريب الصوتي (ميزة مدفوعة) يُنادي على التمارين وعدد التكرارات لتُبقي هاتفك على الأرض — لمسة UX صغيرة تهمّ كثيرًا خلال سلسلة بيربي.",
          "Freeletics أيضًا لديه مجتمع عالمي كبير ونشط مع تحدّيات أسبوعية ولوحات صدارة. للمستخدمين الذين يحفّزهم المساءلة الاجتماعية، هذه ميزة حقيقية وليست نقطة تسويق. Alkemos لا يملك بعد سطح مجتمع مكافئ.",
        ],
      },
      {
        heading: "أين يتفوّق Alkemos",
        paragraphs: [
          "Alkemos يتفوّق في اتساع المنصة. Freeletics تطبيق بوزن الجسم فقط — إذا أردت يومًا رفع بار، استخدام ماكينة كابل، أو اتباع تقسيم 4 أيام جيم منظّم، Freeletics لا يستطيع مساعدتك. Alkemos يغطّي كل أنواع المعدات: بار، دمبل، كابل، ماكينة، كيتل بيل، مطاط، ووزن الجسم. مكتبة الـ868+ تمرين عبر كل أنواع المعدات لا نظير لها في كتالوج Freeletics المحدود بوزن الجسم.",
          "التغذية هي الفجوة الكبرى الأخرى. Freeletics يُقدّم مدرب تغذية ذكي بخطط وجبات ووصفات لكن بلا تتبّع للطعام — ستحتاج تطبيقًا منفصلًا (عادة MyFitnessPal) لذلك. Alkemos يُقدّم قاعدة 8,162+ صنف غذائي، وثماني أدوات مجانية (أربع حاسبات، ومتتبع ماء، ومخطط وجبات، ومولدا خطط بالذكاء الاصطناعي)، وتتبّع ماكروز كامل داخل نفس الاشتراك. دفع Freeletics + MyFitnessPal Premium يكلّف أكثر من Alkemos Premium ويمنحك تكاملًا أقل.",
          "صورة التسعير فيها تفاصيل تستحق الانتباه. مدرب تدريب Freeletics حوالي $80/سنة في الخطة السنوية، وحزمة التغذية تكلف إضافيًا. Alkemos Premium بـ$119/سنة ويجمع برامج التدريب وقاعدة 8,162+ صنف غذائي والأدوات المجانية وEVO في اشتراك واحد. لنفس حالة الاستخدام تدريب + تغذية، Alkemos قيمة أفضل.",
        ],
      },
    ],
  },

  // ==========================================================================
  // 3. Alkemos vs ExRx.net
  // ==========================================================================
  {
    slug: "alkemos-vs-exrx",
    competitorName: "ExRx.net",
    competitorNameAr: "ExRx.net",
    competitorUrl: "https://exrx.net",
    // 2026-09-15: free-tools + affiliate rows added after live
    // re-verification (ExRx serves an extensive free calculator library;
    // no affiliate program found on its site).
    dataAsOf: "2026-09-15",
    // First shipped with the comparison surface (git d238e96a).
    publishedAt: "2026-09-07",

    titleEn: "Alkemos vs ExRx.net — Exercise Library Comparison (2026) | Alkemos",
    titleAr: "Alkemos مقابل ExRx.net — مقارنة مكتبة التمارين (2026) | Alkemos",
    h1En: "Alkemos vs ExRx.net",
    h1Ar: "Alkemos مقابل ExRx.net",
    introEn:
      "ExRx.net has been the internet's exercise reference since 1999 — a 2,200+ exercise database used by coaches, physical therapists, and kinesiology students worldwide. Alkemos is newer and smaller (868+ exercises) but ships with a modern UI, AI coach, Arabic translations, and full workout programs. This comparison helps you choose the right tool for your use case.",
    introAr:
      "ExRx.net كان مرجع التمارين على الإنترنت منذ 1999 — قاعدة 2,200+ تمرين يستخدمها المدربون وأخصائيو العلاج الطبيعي وطلاب علم الحركة حول العالم. Alkemos أحدث وأصغر (868+ تمرينًا) لكنه يأتي بواجهة حديثة، مدرب ذكاء اصطناعي، ترجمات عربية، وبرامج تمارين كاملة. هذه المقارنة تساعدك في اختيار الأداة المناسبة لحالتك.",
    descriptionEn:
      "Alkemos vs ExRx.net 2026: exercise count, UI quality, AI coach, Arabic support, pricing model, and best use case for each.",
    descriptionAr:
      "Alkemos مقابل ExRx.net 2026: عدد التمارين، جودة الواجهة، مدرب الذكاء الاصطناعي، الدعم العربي، نموذج التسعير، وأفضل حالة استخدام لكل منهما.",

    verdictEn:
      "Use ExRx.net as a free reference if you are a coach or kinesiology student. Use Alkemos if you want exercise instruction + AI coaching + nutrition + programs in one modern, bilingual platform.",
    verdictAr:
      "استخدم ExRx.net كمرجع مجاني إذا كنت مدربًا أو طالب علم حركة. استخدم Alkemos إذا كنت تريد شرح تمارين + تدريب ذكاء اصطناعي + تغذية + برامج في منصة حديثة ثنائية اللغة واحدة.",

    rows: [
      {
        labelEn: "Exercise count",
        labelAr: "عدد التمارين",
        alkemosValue: "868+ exercises",
        alkemosValueAr: "868+ تمرينًا",
        competitorValue: "2,200+ exercises",
        competitorValueAr: "2,200+ تمرين",
        outcome: "loss",
      },
      {
        labelEn: "Mobile UX",
        labelAr: "تجربة الجوال",
        alkemosValue: "Modern responsive design + PWA installable",
        alkemosValueAr: "تصميم حديث متجاوب + تطبيق PWA قابل للتثبيت",
        competitorValue: "Legacy 1999 design, poor on mobile",
        competitorValueAr: "تصميم قديم من عام 1999، ضعيف على الجوال",
        outcome: "win",
      },
      {
        labelEn: "AI coach",
        labelAr: "مدرب الذكاء الاصطناعي",
        alkemosValue: "EVO AI — plan generation + 24/7 chat",
        alkemosValueAr: "EVO AI — توليد خطط + محادثة على مدار الساعة",
        competitorValue: "No AI (static reference)",
        competitorValueAr: "لا ذكاء اصطناعي (مرجع ثابت)",
        outcome: "win",
      },
      {
        labelEn: "Arabic translations",
        labelAr: "الترجمات العربية",
        alkemosValue: "Full Arabic + RTL for every exercise",
        alkemosValueAr: "عربية كاملة + دعم RTL لكل تمرين",
        competitorValue: "English-only",
        competitorValueAr: "إنجليزية فقط",
        outcome: "win",
      },
      {
        labelEn: "Workout programs",
        labelAr: "برامج التدريب",
        alkemosValue: "Ready-made programs + AI-generated",
        alkemosValueAr: "برامج جاهزة + مولّدة بالذكاء الاصطناعي",
        competitorValue: "Workout templates (advanced)",
        competitorValueAr: "قوالب تمارين (متقدمة)",
        outcome: "tie",
      },
      {
        labelEn: "Nutrition database",
        labelAr: "قاعدة بيانات التغذية",
        alkemosValue: "8,162+ foods + AI meal planner",
        alkemosValueAr: "8,162+ صنف غذائي + مخطط وجبات بالذكاء الاصطناعي",
        competitorValue: "No food database",
        competitorValueAr: "لا توجد قاعدة أطعمة",
        outcome: "win",
      },
      {
        labelEn: "Personal coaching",
        labelAr: "التدريب الخاص",
        alkemosValue: "Available — $39.99/mo with a personal coach",
        alkemosValueAr: "متوفر — $39.99 شهريًا مع مدرب خاص",
        competitorValue: "Not available",
        competitorValueAr: "غير متوفر",
        outcome: "win",
      },
      {
        labelEn: "Pricing",
        labelAr: "التسعير",
        alkemosValue: "Free tier + $14.99–$39.99/mo",
        alkemosValueAr: "فئة مجانية + $14.99–$39.99 شهريًا",
        competitorValue: "Free, ad-supported website + paid exercise apps",
        competitorValueAr: "موقع مجاني بإعلانات + تطبيقات تمارين مدفوعة",
        outcome: "loss",
      },
      {
        labelEn: "Kinesiology depth",
        labelAr: "عمق علم الحركة",
        alkemosValue: "Basic muscle + equipment metadata",
        alkemosValueAr: "بيانات أساسية عن العضلات والمعدات",
        competitorValue: "Deep joint articulation + muscle architecture",
        competitorValueAr: "تفاصيل عميقة عن حركات المفاصل وبنية العضلات",
        outcome: "loss",
      },
      {
        // 2026-09-15 (owner directive — service coverage): ExRx serves an
        // extensive FREE calculator library (1RM, body fat, TDEE…) — the
        // honest grade is a tie, not a win.
        labelEn: "Free tools & calculators",
        labelAr: "الأدوات والحاسبات المجانية",
        alkemosValue: "8 free tools (4 calculators, water tracker, meal planner, 2 AI planners)",
        alkemosValueAr: "8 أدوات مجانية (4 حاسبات، متتبع ماء، مخطط وجبات، ومخططَي ذكاء اصطناعي)",
        competitorValue: "Extensive free calculators (1RM, body fat, TDEE, and more)",
        competitorValueAr: "حاسبات مجانية واسعة (1RM، نسبة الدهون، TDEE، وأكثر)",
        outcome: "tie",
      },
      {
        // 2026-09-15 (owner directive — service coverage): no affiliate
        // program found on exrx.net (verified 2026-09-15).
        labelEn: "Affiliate program",
        labelAr: "برنامج الأفلييت (الشركاء)",
        alkemosValue: "Public program — 20% commission on subscriptions",
        alkemosValueAr: "برنامج علني — عمولة 20% على الاشتراكات",
        competitorValue: "Not available",
        competitorValueAr: "غير متوفر",
        outcome: "win",
      },
    ],

    bodyEn: [
      {
        heading: "Where ExRx.net wins",
        paragraphs: [
          "ExRx.net is unmatched as a kinesiology reference. Every exercise page documents joint articulations, primary and secondary muscle actions, and the biomechanics behind the movement. For physical therapists, kinesiology students, and strength coaches who need to understand WHY an exercise works (not just HOW to do it), ExRx.net is the gold standard and will remain so for the foreseeable future.",
          "ExRx.net is also free and ad-supported. If you only need a reference you can look up exercises on occasionally, paying nothing beats any Alkemos subscription. The 2,200+ exercise count also wins on raw volume — Alkemos cannot match it today.",
        ],
      },
      {
        heading: "Where Alkemos wins",
        paragraphs: [
          "Alkemos wins on every axis except raw exercise count and kinesiology depth. The UI is modern, mobile-first, and installable as a PWA — ExRx.net's 1999 design is painful on a phone. Every exercise on Alkemos ships with Arabic translations and RTL layout; ExRx.net is English-only.",
          "Alkemos is also a complete training platform, not just a reference. The EVO AI coach builds you a personalized plan using exercises from the library, suggests exercise swaps based on your equipment and goals, and answers your training questions 24/7. ExRx.net has workout templates, but they are static — you do the programming yourself. Alkemos also includes a full food database, free calculators, and workout programs that ExRx.net does not offer at all.",
          "For the average trainee (not a coach or PT), Alkemos is the better daily driver. Use ExRx.net as a free reference when you want to dig deeper into the biomechanics of a specific movement; use Alkemos for your actual training, nutrition, and progress tracking.",
        ],
      },
    ],
    bodyAr: [
      {
        heading: "أين يتفوّق ExRx.net",
        paragraphs: [
          "ExRx.net لا يُضاهى كمرجع لعلم الحركة. كل صفحة تمرين توثّق مفاصل العظام، تأثيرات العضلات الأساسية والثانوية، والبيوميكانيك خلف الحركة. لأخصائيي العلاج الطبيعي، طلاب علم الحركة، ومدربي القوة الذين يحتاجون إلى فهم لماذا يعمل التمرين (وليس فقط كيف يؤدّى)، ExRx.net هو المعيار الذهبي وسيبقى كذلك للمستقبل المنظور.",
          "ExRx.net أيضًا مجاني ومدعوم بالإعلانات. إذا كنت تحتاج فقط مرجعًا تبحث فيه عن التمارين أحيانًا، عدم الدفع يتفوّق على أي اشتراك Alkemos. كما يفوز عدد التمارين 2,200+ بحجم القاعدة الخام — Alkemos لا يضاهيه اليوم.",
        ],
      },
      {
        heading: "أين يتفوّق Alkemos",
        paragraphs: [
          "Alkemos يتفوّق على كل محور عدا عدد التمارين الصرف وعمق علم الحركة. الواجهة حديثة، mobile-first، وقابلة للتثبيت كـ PWA — تصميم ExRx.net من 1999 مؤلم على الهاتف. كل تمرين في Alkemos يأتي بترجمات عربية وتخطيط RTL؛ ExRx.net إنجليزي فقط.",
          "Alkemos أيضًا منصة تدريب كاملة، ليس مجرد مرجع. مدرب EVO الذكي يبني لك خطة مخصصة باستخدام تمارين من المكتبة، يقترح تبديلات للتمارين حسب معداتك وأهدافك، ويُجيب على أسئلة تدريبك على مدار الساعة. ExRx.net لديه قوالب تمارين، لكنها ثابتة — أنت تبرمج بنفسك. Alkemos أيضًا يضم قاعدة أطعمة كاملة، حاسبات مجانية، وبرامج تمارين لا يُقدّمها ExRx.net إطلاقًا.",
          "للمتدرّب العادي (ليس مدربًا أو أخصائي علاج طبيعي)، Alkemos هو الأفضل للاستخدام اليومي. استخدم ExRx.net كمرجع مجاني عندما تريد التعمّق في بيوميكانيك حركة معيّنة؛ استخدم Alkemos لتدريبك الفعلي، تغذيتك، وتتبّع تقدّمك.",
        ],
      },
    ],
  },

  // ==========================================================================
  // 4. Alkemos vs Cronometer
  //    P0 SEO audit (2026-09-30, finding #5): the external report flagged
  //    Cronometer as the closest competitor and the site had no answer page
  //    for "alkemos vs cronometer" queries. Facts below are web-verified
  //    against Cronometer's public positioning as of the dataAsOf date
  //    (Gold $10.99/mo·$59.99/yr per Sep-2026 sources; 80+ micronutrients;
  //    NCCDB/USDA-sourced curated database; barcode + photo logging;
  //    ShareASale affiliate program; no exercise library, no workout
  //    programs, no AI-coach chat, no Arabic UI).
  //    HONESTY NOTE: Cronometer genuinely wins the pure nutrition-logging
  //    rows (4 losses below) — Alkemos has no daily food diary, no barcode
  //    scanner, and no micronutrient tracking; do not soften those cells.
  // ==========================================================================
  {
    slug: "alkemos-vs-cronometer",
    competitorName: "Cronometer",
    competitorNameAr: "Cronometer",
    competitorUrl: "https://cronometer.com",
    dataAsOf: "2026-09-30",
    // First shipped with the P0 tracking-pages frame (git cae890f4).
    publishedAt: "2026-09-30",

    titleEn: "Alkemos vs Cronometer — Nutrition Tracking Comparison (2026) | Alkemos",
    titleAr: "Alkemos مقابل Cronometer — مقارنة تتبّع التغذية (2026) | Alkemos",
    h1En: "Alkemos vs Cronometer",
    h1Ar: "Alkemos مقابل Cronometer",
    introEn:
      "Alkemos and Cronometer overlap on food data and macro planning but serve different core jobs. Cronometer is a nutrition tracker built for data depth — a curated NCCDB/USDA database and 80+ tracked micronutrients in a daily food diary. Alkemos is a complete training-and-nutrition platform — exercise instruction, workout programs, an AI coach, and meal planning with live macro totals, fully bilingual in English and Arabic. This page breaks down where each one wins so you can pick by your actual goal.",
    introAr:
      "Alkemos و Cronometer يتقاطعان في بيانات الأطعمة وتخطيط الماكروز لكنهما يخدمان هدفين مختلفين. Cronometer متتبّع تغذية مبني لعمق البيانات — قاعدة منسّقة من مصادر NCCDB وUSDA وأكثر من 80 مغذيًا دقيقًا في يوميات طعام يومية. Alkemos منصة كاملة للتدريب والتغذية — شرح تمارين، برامج تدريب، مدرب ذكاء اصطناعي، وتخطيط وجبات بمجاميع ماكروز حيّة، وثنائية اللغة بالكامل بالعربية والإنجليزية. هذه الصفحة تُفصّل أين يتفوّق كل منهما لتختار حسب هدفك الفعلي.",
    descriptionEn:
      "Alkemos vs Cronometer 2026: micronutrient tracking, food diary, exercise library, AI coach, pricing, Arabic support, and which fits your goal.",
    descriptionAr:
      "مقارنة Alkemos مقابل Cronometer 2026: تتبّع المغذيات الدقيقة، يوميات الطعام، مكتبة التمارين، المدرب الذكي، الأسعار، الدعم العربي، وأيهما يناسب هدفك.",

    verdictEn:
      "Pick Cronometer if nutrition data depth is your whole world — a verified food database, 80+ micronutrients, and a daily diary with barcode and photo logging. Pick Alkemos if you want training and nutrition in one platform — exercise instruction, workout programs, AI planning and coaching, meal planning with live macro totals — especially if you read Arabic.",
    verdictAr:
      "اختر Cronometer إذا كان عمق بيانات التغذية هو عالمك كله — قاعدة أطعمة موثّقة، أكثر من 80 مغذيًا دقيقًا، ويوميات يومية بمسح باركود وتسجيل بالصور. اختر Alkemos إذا أردت التدريب والتغذية في منصة واحدة — شرح تمارين، برامج تدريب، تخطيط ومدرب بالذكاء الاصطناعي، وتخطيط وجبات بمجاميع ماكروز حيّة — خاصة إذا كنت تقرأ بالعربية.",

    rows: [
      {
        // Honest loss: Cronometer's NCCDB/USDA-sourced database is curated
        // by dietitians and widely cited as the accuracy standard.
        labelEn: "Nutrition-data accuracy",
        labelAr: "دقّة بيانات التغذية",
        alkemosValue: "8,162+ foods (USDA-backed + curated)",
        alkemosValueAr: "8,162+ صنف غذائي (بمعايير USDA ومنسّقة بدقة)",
        competitorValue: "Curated NCCDB/USDA database — the accuracy benchmark",
        competitorValueAr: "قاعدة منسّقة من مصادر NCCDB وUSDA — معيار الدقّة",
        outcome: "loss",
      },
      {
        // Honest loss: Alkemos foods carry calories/protein/carbs/fat only.
        labelEn: "Micronutrient tracking",
        labelAr: "تتبّع المغذيات الدقيقة",
        alkemosValue: "Macros only (calories, protein, carbs, fat)",
        alkemosValueAr: "الماكروز فقط (سعرات، بروتين، كربوهيدرات، دهون)",
        competitorValue: "80+ micronutrients (vitamins, minerals, amino acids)",
        competitorValueAr: "أكثر من 80 مغذيًا دقيقًا (فيتامينات، معادن، أحماض أمينية)",
        outcome: "loss",
      },
      {
        // Honest loss: Alkemos plans meals with live macro totals but has
        // no daily intake diary (verified product inventory 2026-09-30).
        labelEn: "Daily food logging",
        labelAr: "تسجيل الطعام اليومي",
        alkemosValue: "Meal planning with live macro totals (no intake diary)",
        alkemosValueAr: "تخطيط وجبات بمجاميع ماكروز حيّة (بلا يوميات طعام)",
        competitorValue: "Full daily food diary with barcode + photo logging",
        competitorValueAr: "يوميات طعام كاملة بمسح باركود وتسجيل بالصور",
        outcome: "loss",
      },
      {
        labelEn: "Barcode scanner",
        labelAr: "ماسح الباركود",
        alkemosValue: "Not available",
        alkemosValueAr: "غير متوفر",
        competitorValue: "Yes (packaged-food scanning)",
        competitorValueAr: "نعم (مسح الأطعمة المعلّبة)",
        outcome: "loss",
      },
      {
        labelEn: "Exercise library",
        labelAr: "مكتبة التمارين",
        alkemosValue: "868+ exercises with step-by-step instructions",
        alkemosValueAr: "868+ تمرينًا بشرح خطوة بخطوة",
        competitorValue: "No exercise library (exercise logged as calorie burn only)",
        competitorValueAr: "لا مكتبة تمارين (التمرين يُسجَّل كحرق سعرات فقط)",
        outcome: "win",
      },
      {
        labelEn: "Workout programs",
        labelAr: "برامج التدريب",
        alkemosValue: "Ready-made programs (home & gym, all levels)",
        alkemosValueAr: "برامج جاهزة (للمنزل والنادي الرياضي، كل المستويات)",
        competitorValue: "No workout programs",
        competitorValueAr: "لا توجد برامج تدريب",
        outcome: "win",
      },
      {
        labelEn: "AI coach",
        labelAr: "مدرب الذكاء الاصطناعي",
        alkemosValue: "EVO AI — plan generation, meal & exercise swaps, 24/7 chat",
        alkemosValueAr: "EVO AI — توليد خطط، تبديلات وجبات وتمارين، ومحادثة على مدار الساعة",
        competitorValue: "No AI coach (reports and insights only)",
        competitorValueAr: "لا مدرب ذكاء اصطناعي (تقارير ورؤى فقط)",
        outcome: "win",
      },
      {
        // Honest tie: Cronometer's free tier genuinely includes full
        // calorie/macro/micronutrient tracking — a different shape from
        // Alkemos's 8-tool hub at the same "free" price.
        labelEn: "Free tools & calculators",
        labelAr: "الأدوات والحاسبات المجانية",
        alkemosValue: "8 free tools (4 calculators, water tracker, meal planner, 2 AI planners)",
        alkemosValueAr: "8 أدوات مجانية (4 حاسبات، متتبع ماء، مخطط وجبات، ومخططَي ذكاء اصطناعي)",
        competitorValue: "Free tier covers calorie/macro/micronutrient tracking (no tools hub)",
        competitorValueAr: "الفئة المجانية تغطي تتبّع السعرات والماكروز والمغذيات الدقيقة (بلا مركز أدوات)",
        outcome: "tie",
      },
      {
        labelEn: "Arabic language support",
        labelAr: "دعم اللغة العربية",
        alkemosValue: "Full bilingual (Arabic + English) with RTL",
        alkemosValueAr: "ثنائي اللغة بالكامل (عربية + إنجليزية) مع دعم RTL",
        competitorValue: "No Arabic interface",
        competitorValueAr: "لا تدعم العربية",
        outcome: "win",
      },
      {
        labelEn: "Personal coaching",
        labelAr: "التدريب الخاص",
        alkemosValue: "Available — $39.99/mo with a personal coach",
        alkemosValueAr: "متوفر — $39.99 شهريًا مع مدرب خاص",
        competitorValue: "Not available",
        competitorValueAr: "غير متوفر",
        outcome: "win",
      },
      {
        // Verified Sep-2026 sources: Gold $10.99/mo or $59.99/yr (some
        // earlier-cached pages still list $8.99/$49.99).
        labelEn: "Pricing (premium)",
        labelAr: "التسعير (النسخة المدفوعة)",
        alkemosValue: "$14.99/mo or $119/yr",
        alkemosValueAr: "$14.99 شهريًا أو $119 سنويًا",
        competitorValue: "Gold $10.99/mo or $59.99/yr",
        competitorValueAr: "Gold بـ$10.99 شهريًا أو $59.99 سنويًا",
        outcome: "loss",
      },
      {
        // Both platforms log body metrics; Cronometer Gold adds blood-test
        // import, Alkemos adds progress photos + weekly adherence check-ins.
        labelEn: "Progress tracking",
        labelAr: "تتبّع التقدّم",
        alkemosValue: "Weight + 5 body measurements, progress photos, weight chart, weekly check-in reminders",
        alkemosValueAr: "الوزن + 5 قياسات جسم، صور تقدّم، مخطط وزن، وتذكيرات تسجيل أسبوعية",
        competitorValue: "Weight, measurements & biometrics + blood-test import (Gold)",
        competitorValueAr: "الوزن والقياسات والقياسات الحيوية + استيراد تحاليل الدم (Gold)",
        outcome: "tie",
      },
      {
        // Verified 2026-09-30: Cronometer runs a ShareASale affiliate
        // program + a direct "Partner With Us" form — honest tie.
        labelEn: "Affiliate program",
        labelAr: "برنامج الأفلييت (الشركاء)",
        alkemosValue: "Public program — 20% commission on subscriptions",
        alkemosValueAr: "برنامج علني — عمولة 20% على الاشتراكات",
        competitorValue: "Affiliate program via ShareASale + partner form",
        competitorValueAr: "برنامج أفلييت عبر ShareASale + نموذج شراكة",
        outcome: "tie",
      },
    ],

    bodyEn: [
      {
        heading: "Where Cronometer wins",
        paragraphs: [
          "Cronometer is the accuracy pick for nutrition logging, and it earns that reputation honestly. Its food database is curated from NCCDB and USDA sources rather than crowdsourced, and every food carries a full micronutrient profile — 80+ vitamins, minerals, and amino acids — so you can see not just your calories and macros but your iron, vitamin D, and omega-3 intake too. If you are managing a deficiency, working with a dietitian, or simply want lab-grade nutrition data, nothing in this comparison matches it.",
          "The daily logging workflow is also more mature. A food diary with barcode scanning and (on Gold) photo logging makes tracking an actual meal fast, and the free tier already includes the core tracking experience. Gold at $10.99/month or $59.99/year is cheaper than Alkemos Premium, and adds deeper reports, custom nutrient targets, and blood-test imports. For a pure nutrition tracker, Cronometer is simply the more focused tool.",
        ],
      },
      {
        heading: "Where Alkemos wins",
        paragraphs: [
          "Alkemos wins on everything that happens outside the food diary. Cronometer has no exercise library, no workout programs, and no AI coach — exercise appears only as a calorie-burn entry. Alkemos ships 868+ exercises with step-by-step instructions, ready-made programs for home and gym, and the EVO AI coach that builds personalized nutrition and workout plans, suggests meal and exercise swaps, and answers your questions 24/7. If your goal is a training plan plus a nutrition plan in one place, Alkemos covers both sides of the equation.",
          "The nutrition side is planned rather than logged. The free meal planner lets you build meals from an 8,162+ food database with live calorie and macro totals per meal and per day, the AI meal planner generates a full day of eating in grams from your calorie target, and the macro calculator sets your protein/carb/fat split before you plan. Alkemos does not pretend to be a micronutrient diary — it is a planning platform with real food data, and the honest split is spelled out in the table above.",
          "Arabic speakers again have no real choice: Cronometer ships no Arabic interface, while Alkemos is fully bilingual with native RTL — Arabic exercise names, Arabic food names, and an Arabic AI coach. Personal coaching at $39.99/month with a real coach is also something Cronometer does not offer at any price.",
        ],
      },
      {
        heading: "Pricing comparison",
        paragraphs: [
          "Cronometer's free tier is genuinely usable — calorie, macro, and micronutrient tracking without paying — and Gold costs $10.99/month or $59.99/year (verified September 2026; some earlier sources still list $8.99/$49.99 from before the price change). Alkemos Free includes the full exercise library, the full food database, all eight free tools, and limited EVO AI access. Alkemos Premium is $14.99/month or $119/year, Pro ($29.99/month) raises the unified AI plan-generation pool, and Coaching ($39.99/month) adds a personal coach.",
          "The value calculation depends on what you are paying for. If you only need nutrition logging, Cronometer Gold is cheaper and deeper. If you need training and nutrition together, the honest comparison is Cronometer Gold plus a separate workout app versus one Alkemos subscription — and that stack usually costs more while integrating less. For bilingual users the arithmetic ends immediately.",
        ],
      },
    ],
    bodyAr: [
      {
        heading: "أين يتفوّق Cronometer",
        paragraphs: [
          "Cronometer هو الخيار الأدق لتسجيل التغذية، وسمعته هذه مكتسبة بصدق. قاعدة أطعمته منسّقة من مصادر NCCDB وUSDA لا من إسهامات الجمهور، وكل صنف غذائي يحمل ملفًا كاملًا للمغذيات الدقيقة — أكثر من 80 فيتامينًا ومعدنًا وحمضًا أمينيًا — فلا ترى سعراتك وماكروزك فقط بل حديدك وفيتامين د وأوميغا-3 أيضًا. إن كنت تتابع نقصًا غذائيًا أو تعمل مع أخصائي تغذية أو تريد ببساطة بيانات تغذية بجودة المختبر، لا يضاهيه شيء في هذه المقارنة.",
          "سير عمل التسجيل اليومي أنضج أيضًا. يوميات طعام بمسح باركود وتسجيل بالصور (على Gold) تجعل تسجيل وجبة فعلية سريعًا، والفئة المجانية تشمل تجربة التتبّع الأساسية أصلًا. Gold بسعر $10.99 شهريًا أو $59.99 سنويًا أرخص من Alkemos Premium، ويضيف تقارير أعمق وأهدافًا مخصّصة للمغذيات واستيراد تحاليل الدم. كمتتبّع تغذية خالص، Cronometer أداة أكثر تركيزًا ببساطة.",
        ],
      },
      {
        heading: "أين يتفوّق Alkemos",
        paragraphs: [
          "Alkemos يتفوّق في كل ما يحدث خارج يوميات الطعام. Cronometer بلا مكتبة تمارين ولا برامج تدريب ولا مدرب ذكاء اصطناعي — التمرين يظهر لديه كقياس حرق سعرات فقط. Alkemos يُقدّم 868+ تمرينًا بشرح خطوة بخطوة، برامج جاهزة للمنزل والنادي، ومدرب EVO الذكي الذي يبني خطط تغذية وتمارين مخصّصة، ويقترح تبديلات للوجبات والتمارين، ويُجيب على أسئلتك على مدار الساعة. إذا كان هدفك خطة تدريب وخطة تغذية في مكان واحد، Alkemos يغطّي جانبي المعادلة.",
          "جانب التغذية لدينا مخطَّط لا مسجَّل. مخطط الوجبات المجاني يتيح بناء وجباتك من قاعدة 8,162+ صنفًا غذائيًا بمجاميع سعرات وماكروز حيّة لكل وجبة ولكل يوم، ومخطط الوجبات بالذكاء الاصطناعي يولّد يومًا كاملًا بالغرامات من رقم سعراتك، وحاسبة الماكروز تضبط توزيع البروتين والكربوهيدرات والدهون قبل التخطيط. Alkemos ليس يوميات مغذيات دقيقة — بل منصة تخطيط ببيانات أطعمة حقيقية، والفصل الصادق موضّح بالجدول أعلاه.",
          "الناطقون بالعربية مرة أخرى بلا خيار حقيقي: Cronometer لا يُصدر واجهة عربية، بينما Alkemos ثنائي اللغة بالكامل بدعم RTL أصلي — أسماء تمارين بالعربية، أسماء أطعمة بالعربية، ومدرب ذكاء اصطناعي عربي. والتدريب الخاص ($39.99 شهريًا) مع مدرب حقيقي خدمة أيضًا لا يُقدّمها Cronometer بأي سعر.",
        ],
      },
      {
        heading: "مقارنة الأسعار",
        paragraphs: [
          "الفئة المجانية في Cronometer قابلة للاستخدام فعلًا — تتبّع السعرات والماكروز والمغذيات الدقيقة الدقيقة بلا دفع — وGold تكلف $10.99 شهريًا أو $59.99 سنويًا (موثّق سبتمبر 2026؛ بعض المصادر الأقدم ما تزال تذكر $8.99/$49.99 قبل تغيير السعر). Alkemos المجاني يشمل مكتبة التمارين الكاملة، قاعدة الأطعمة الكاملة، كل الأدوات الثماني، ووصولًا محدودًا لـ EVO. Alkemos Premium بـ$14.99 شهريًا أو $119 سنويًا، وPro ($29.99 شهريًا) يرفع الرصيد الموحد لتوليد الخطط بالذكاء الاصطناعي، والتدريب الأونلاين ($39.99 شهريًا) يضيف مدربًا خاصًا.",
          "حساب القيمة يعتمد على ما تدفع مقابله. إن احتجت إلى تسجيل تغذية فقط، Cronometer Gold أرخص وأعمق. إن احتجت إلى التدريب والتغذية معًا، فالمقارنة الصادقة هي Cronometer Gold زائد تطبيق تمارين منفصل مقابل اشتراك Alkemos واحد — وهذا المزيج يكلّف أكثر عادةً مع تكامل أقل. وللمستخدم الثنائي اللغة ينتهي الحساب فورًا.",
        ],
      },
    ],
  },
];

export function getComparisonBySlug(slug: string): Comparison | null {
  return COMPARISONS.find((c) => c.slug === slug) ?? null;
}
