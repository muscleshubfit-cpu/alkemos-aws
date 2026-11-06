/**
 * BLOG CATEGORY CONTENT — the unique bilingual intro copy for the
 * crawlable category pages (P2-11, §12.19 item 11: «تصنيف مدونة قابل
 * للزحف: صفحات فئات/وسوم فعلية بروابط سياقية» → §12.36).
 *
 * LAWS:
 *   - UNIQUE PER CATEGORY: no shared sentence between any two categories
 *     in either language (canary-pinned, the §12.25 no-shared-block law).
 *   - MSA for Arabic (blog law 175/176) — zero dialect markers; the
 *     scanner used for articles also guards these strings.
 *   - HONEST: no invented statistics, no fabricated studies; the copy
 *     describes what the category covers and links into real surfaces.
 */

export interface BlogCategoryContent {
  titleEn: string;
  titleAr: string;
  introEn: string;
  introAr: string;
}

export const BLOG_CATEGORY_CONTENT: Record<string, BlogCategoryContent> = {
  nutrition: {
    titleEn: "Nutrition Articles",
    titleAr: "مقالات التغذية",
    introEn:
      "What you eat decides most of what your training produces: energy for the session, material for recovery, and the calorie balance that moves your weight in whichever direction you choose. This section gathers our Arabic-and-English nutrition writing — macronutrients explained with numbers, food choices compared on real per-100g data, and meal structures that fit an ordinary kitchen rather than a laboratory. Every article cites its reasoning, and every number can be re-checked with our free calculators, from the calorie calculator to the macro calculator.",
    introAr:
      "ما تأكله يحدد معظم ما ينتجه تمرينك: وقود الجلسة، ومادة الاستشفاء، وميزان السعرات الذي يحرّك وزنك في الاتجاه الذي تختاره. يجمع هذا القسم مقالاتنا في التغذية باللغتين — شرح المغذيات الكبرى بالأرقام، ومقارنات خيارات الطعام على بيانات حقيقية لكل 100 جرام، وهياكل وجبات تناسب مطبخًا عاديًا لا مختبرًا. كل مقال يذكر منطقه، وكل رقم فيه يمكن التحقق منه بحاسباتنا المجانية، من حاسبة السعرات إلى حاسبة الماكروز.",
  },
  workout: {
    titleEn: "Workout Articles",
    titleAr: "مقالات التمارين",
    introEn:
      "A good program is not a pile of exercises — it is an order, a dose, and a progression you can repeat next week. These articles cover training the way it is actually programmed: how splits are built around recovery, why rep ranges differ between strength and muscle goals, and when to add load instead of adding volume. The movement standards we reference match our exercise library of 868+ entries, so every exercise an article names has a page with images and step-by-step form.",
    introAr:
      "البرنامج الجيد ليس كومًا من التمارين — بل ترتيبٌ وجرعةٌ وتدرّج تستطيع تكراره الأسبوع القادم. تغطي هذه المقالات التدريب كما يُبرمَج فعلًا: كيف تُبنى التقسيمات حول الاستشفاء، ولماذا تختلف نطاقات التكرار بين أهداف القوة وبناء العضلات، ومتى تضيف وزنًا بدل أن تضيف حجمًا. معايير الأداء التي نرجع إليها تطابق مكتبة تماريننا البالغة 868+ تمرينًا، فكل حركة تذكرها مقال لها صفحة بصور وخطوات أداء.",
  },
  supplements: {
    titleEn: "Supplement Articles",
    titleAr: "مقالات المكملات",
    introEn:
      "The supplement aisle is where marketing outspends evidence, so this section reads it the other way around: what a compound actually does, at what dose, for whom, and what the law requires on the label. We separate the short list with strong human evidence from the long list of promising-but-unproven ingredients, and we say plainly when food does the same job for less money. Nothing here is a sales pitch — our store sells coaching and tools, not powders, so we have no reason to inflate a supplement's reputation.",
    introAr:
      "رفّ المكملات هو المكان الذي ينفق فيه التسويق أكثر من الدليل، لذا نقرأ هذا القسم بالاتجاه المعاكس: ماذا يفعل المركب فعلًا، وبأي جرعة، ولمن، وما الذي يفرضه القانون على الملصق. نفصل القائمة القصيرة ذات الأدلة البشرية القوية عن القائمة الطويلة من المكونات الواعدة غير المثبتة، ونقول بوضوح حين يؤدي الطعام المهمة نفسها بمال أقل. لا شيء هنا عرضٌ بيعي — متجرنا يبيع التدريب والأدوات لا المساحيق، فلا سبب لدينا لتضخيم سمعة أي مكمل.",
  },
  "weight-loss": {
    titleEn: "Weight Loss Articles",
    titleAr: "مقالات خسارة الوزن",
    introEn:
      "Losing weight is arithmetic plus adherence: a deficit your body can tolerate long enough, wrapped in meals you are willing to eat for months. These articles cover both halves — how to size the deficit from your real maintenance calories, and how protein, volume-rich food, and sleep keep hunger from deciding the outcome. We also mark the honest failure modes: plateaus that are water, not fat, and the difference between losing weight and keeping it off, which is the part most plans skip.",
    introAr:
      "خسارة الوزن حسابٌ والتزامٌ معًا: عجزٌ يحتمله جسدك مدةً كافية، مغلَّفٌ بوجبات تقبل تناولها لشهور. تغطي هذه المقالات النصفين — كيف تحدد حجم العجز من سعرات ثباتك الحقيقية، وكيف يحفظ البروتين والطعام الغني بالحجم والنومُ اتزانَ الجوع عن حسم النتيجة. ونرسم أيضًا مواضع الفشل الصادقة: الثباتات التي ماءٌ لا شحم، والفرق بين خسارة الوزن والحفاظ عليه، وهو الجزء الذي تتخطاه معظم الخطط.",
  },
  "muscle-gain": {
    titleEn: "Muscle Gain Articles",
    titleAr: "مقالات بناء العضلات",
    introEn:
      "Muscle grows from three honest inputs: a small calorie surplus, enough protein spread across the day, and training that gets heavier or harder over months — everything else is seasoning. This section explains how to set each input with numbers instead of folklore, why the scale moves unevenly during a lean gaining phase, and how to tell real progress from pump and glycogen. The programs we reference are the same ready-made ones in our training library, scaled by level and days per week.",
    introAr:
      "تنمو العضلة من ثلاثة مدخلات صادقة: فائض سعرات صغير، وبروتين كافٍ موزَّع على اليوم، وتدريب يزداد ثقلًا أو صعوبة عبر الشهور — وكل ما عداه توابل. يشرح هذا القسم كيف تضبط كل مدخل بالأرقام لا بالحكايات، ولماذا يتحرك الميزان بشكل غير منتظم في مرحلة الزيادة النظيفة، وكيف تفرق التقدم الحقيقي عن الانتفاخ والغليكوجين. والبرامج التي نحيل إليها هي نفسها الجاهزة في مكتبة تدريبنا، مرتَّبة بالمستوى وعدد أيام الأسبوع.",
  },
  health: {
    titleEn: "Health Articles",
    titleAr: "مقالات الصحة",
    introEn:
      "Fitness sits inside a larger health envelope: sleep, stress, blood markers, joints, and the medical realities that decide how hard you can safely train. These articles handle that boundary honestly — what training does for metabolic health, when a symptom means stop and see a professional, and how chronic conditions change exercise choices rather than cancel them. Where the evidence is genuinely contested, we say so instead of picking the louder side.",
    introAr:
      "اللياقة تقع داخل غلاف صحي أكبر: النوم والضغط ومؤشرات الدم والمفاصل والحقائق الطبية التي تحدد كم يمكنك التدرب بأمان. تعالج هذه المقالات تلك الحدود بصدق — ما يفعله التدريب للصحة الأيضية، ومتى يعني العَرَض التوقفَ ومراجعة مختص، وكيف تغيّر الأمراض المزمنة خيارات التمرين بدل أن تلغيها. وحيثما كان الدليل مختلفًا فيه فعلًا نقول ذلك بدل أن نختار الجانب الأعلى صوتًا.",
  },
  recipes: {
    titleEn: "Healthy Recipes",
    titleAr: "وصفات صحية",
    introEn:
      "A recipe is a macro target wearing an apron: same calories, same protein, but cooked into something you would actually make twice. This section builds meals around ordinary supermarket ingredients across Arabic and Western kitchens, with per-serving calories and macros stated the way our calculators count them. We keep the equipment list short and the substitutions explicit, because the difference between a recipe used and a recipe scrolled past is usually one missing ingredient.",
    introAr:
      "الوصفة هدفٌ من الماكروز يرتدي مِريلة المطبخ: السعرات نفسها والبروتين نفسه، لكنه مطبوخ في شيء ستعدّه فعلًا مرة ثانية. يبني هذا القسم وجباته حول مكونات السوبرماركت العادية في المطبخين العربي والغربي، مع سعرات الحصة وماكروزها محسوبة بالطريقة نفسها التي تحسب بها حاسباتنا. نبقي قائمة الأدوات قصيرة والبدائل صريحة، لأن الفرق بين وصفة تُستخدم ووصفة تُتجاوز هو غالبًا مكوّن واحد ناقص.",
  },
  science: {
    titleEn: "Training & Nutrition Science",
    titleAr: "علم التدريب والتغذية",
    introEn:
      "This is the section for readers who want to see the machinery: studies, mechanisms, and the difference between what a paper measured and what a headline claimed it measured. We walk through the research on hypertrophy ranges, protein timing, and energy balance with the actual numbers attached, and we grade the strength of the evidence rather than presenting every finding as settled. Where the field has changed its mind, we say which way it moved and why.",
    introAr:
      "هذا القسم للقراء الذين يريدون رؤية الآلة الداخلية: الدراسات والآليات، والفرق بين ما قاسته الورقة العلمية وما زعم العنوان أنها قاسته. نستعرض أبحاث نطاقات ضخامة العضلة وتوقيت البروتين وميزان الطاقة بأرقامها الفعلية، ونرتب قوة الدليل بدل تقديم كل نتيجة وكأنها محسومة. وحيثما غيّر المجال رأيه، نقول في أي اتجاه تحرك ولماذا.",
  },
  fitness: {
    titleEn: "Fitness Articles",
    titleAr: "مقالات اللياقة",
    introEn:
      "General fitness is the broad middle of the map: conditioning, mobility, habit design, and the practical questions that sit between sedentary and sport. These articles cover building a first routine from nothing, choosing between cardio styles when time is short, and keeping training alive through travel, exams, and ramadan schedules. The through-line is sustainability — a modest plan you keep beats a perfect plan you quit in week three.",
    introAr:
      "اللياقة العامة هي القسم الأوسع من الخريطة: الإعداد الحركي والمرونة وتصميم العادات والأسئلة العملية الواقعة بين الخمول والرياضة. تغطي هذه المقالات بناء أول روتين من الصفر، والاختيار بين أنماط الكارديو حين يقصر الوقت، وإبقاء التدريب حيًا عبر السفر والامتحانات وجداول رمضان. والخيط الناظم هو الاستدامة — خطة متواضعة تواصلها أفضل من خطة مثالية تتركها في الأسبوع الثالث.",
  },
  wellness: {
    titleEn: "Wellness Articles",
    titleAr: "مقالات العافية",
    introEn:
      "Wellness, done honestly, is the maintenance schedule of a training body: sleep architecture, recovery days, stress load, and the unglamorous routines that keep the machine serviceable for decades. This section writes about those without miracle language — what recovery tools have measurable effects, how to read tiredness versus under-recovery, and why the boring fundamentals keep outperforming exotic protocols. It pairs with our tools: the water tracker and the body-fat calculator bookend the daily habits covered here.",
    introAr:
      "العافية، حين تُمارَس بصدق، هي جدول الصيانة لجسدٍ يتدرب: بنية النوم وأيام الاستشفاء وحمل الضغط والروتين غير اللامع الذي يبقي الآلة صالحة لعقود. يكتب هذا القسم عن ذلك بلا لغة المعجزات — أي أدوات الاستشفاء ذات تأثيرات قابلة للقياس، وكيف تقرأ التعبَ مقابل الاستشفاء الناقص، ولماذا تتفوق الأساسيات المملة باستمرار على البروتوكولات الغريبة. وهو يتكامل مع أدواتنا: متتبع الماء وحاسبة دهون الجسم يحصران عادات اليوم المشروحة هنا.",
  },
};
