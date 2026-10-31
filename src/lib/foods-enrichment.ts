/**
 * FOODS-ENRICHMENT — per-food unique editorial content for the curated
 * food detail pages (SEO-ADSENSE-RECOVERY-PLAN-2026-10-31 · P1-1, owner
 * execution order 2026-11-01 «إبدأ التنفيذ»).
 *
 * WHY: the comprehensive audit (2026-10-31) measured the food family as
 * the site's dominant thin mass — 8-gram template duplication 42.8%
 * across same-family food pages (~685-715 words, almost all shared UI
 * chrome + data tables, near-zero unique prose). That block is 86% of
 * the sitemap footprint with exercises, and is the #1 measured suspect
 * behind the repeated AdSense «Low Value Content» rejections.
 *
 * WHAT: batch 1 — TWENTY curated foods (sitemap-advertised slugs only),
 * each getting a genuinely unique bilingual editorial layer:
 *   - intro   (60-100 EN words / MSA Arabic — what it is, who it fits,
 *              when to use it; every number quoted is the food's real
 *              per-100g / serving data from src/lib/foods.ts — nothing
 *              invented);
 *   - context (three labeled blocks: alternatives / how to fit it into
 *              a plan / watch-outs — actually differentiated per food,
 *              driven by the food's tags and category);
 *   - faq     (3 Q&As per language with the food's own numbers).
 *
 * LAW (plan P1-1): «لا نسخ قالب نصي واحد» — no single text template
 * copied across foods. Uniqueness is enforced by
 * src/lib/__tests__/foods-enrichment.test.ts: pairwise 8-gram Jaccard
 * between same-family enriched pages must stay ≤ 0.15, EN and AR.
 *
 * ARABIC LAW (prohibition 176 spirit): the Arabic layer is pure MSA —
 * no Latin characters (test-enforced), digits are fine, brand names
 * would need the parenthetical exception (none needed in batch 1).
 *
 * NO FAQPage JSON-LD: Google retired FAQ rich results May 2026
 * (src/lib/seo.ts law) — the FAQ layer is user-visible HTML only.
 *
 * SERVER-SAFE: plain data, no imports — usable from server components
 * and from tests alike. Consumption:
 *   getFoodEnrichment(slug) → render inside FoodDetailClient (both the
 *   EN route and the /ar mirror pass it as a prop).
 *
 * BATCH PROTOCOL: batch 1 = 20 foods (families: protein 4 · carb 4 ·
 * fat 3 · vegetable 2 · fruit 2 · dairy 2 · nuts 2 · drink 1 — snack
 * lands in batch 2). Follow-up batches append entries here in their
 * own frames; the canary test automatically covers every entry.
 */

export type EnrichedFaq = { q: string; a: string };

export type FoodEnrichmentContext = {
  /** Practical swaps when this food is unavailable or you want variety. */
  alternatives: string;
  /** How to actually slot the food into a cutting/bulking day. */
  plan: string;
  /** Honest watch-outs: calorie density, preparation pitfalls, portion traps. */
  caution: string;
};

export type FoodEnrichment = {
  intro: { en: string; ar: string };
  context: { en: FoodEnrichmentContext; ar: FoodEnrichmentContext };
  faq: { en: EnrichedFaq[]; ar: EnrichedFaq[] };
};

export const FOODS_ENRICHMENT: Record<string, FoodEnrichment> = {
  "chicken-breast": {
    intro: {
      en: "Chicken breast is the workhorse of high-protein eating: 31 g of protein against just 165 kcal and 3.6 g of fat per 100 g, with zero carbs. That ratio is why it anchors almost every fat-loss plan — you can eat a filling 150 g portion (one medium breast) and still have room in your day for rice, vegetables, or olive oil. It is equally at home in a lean gaining phase, where it delivers protein without pushing you over your fat budget. Bland when boiled, excellent when seared, grilled, or baked with spices.",
      ar: "صدور الدجاج هي العمود الفقري لأي نظام غني بالبروتين: 31 جم بروتين مقابل 165 سعرة و3.6 جم دهون فقط لكل 100 جم، وبلا أي كربوهيدرات. هذه النسبة هي سبب اعتمادها في خطط خسارة الدهون؛ إذ يمكنك تناول قطعة متوسطة كاملة بوزن 150 جم وتظل لديك مساحة في يومك للأرز والخضار وزيت الزيتون. وهي مناسبة تمامًا لمرحلة التضخيم النظيف لأنها تمنحك البروتين دون أن ترفع ميزانية الدهون. اسلقها تصبح باهتة، لكنها ممتازة مشوية أو بالفرن مع التوابل.",
    },
    context: {
      en: {
        alternatives: "Turkey breast mirrors the profile almost exactly; canned tuna is the no-cook swap at 26 g protein per 100 g; tofu works if you want a plant base for the same meal slot.",
        plan: "On a cut, grill 150 g and pair it with a large volume of broccoli or spinach to fill the plate for almost no calories. On a lean bulk, the same breast sits naturally beside 150 g of white rice and a teaspoon of olive oil.",
        caution: "The 165 kcal belongs to cooked skinless meat — breading, deep frying, or creamy sauces can quietly triple the calorie load of the same portion.",
      },
      ar: {
        alternatives: "صدور الديك الرومي تطابق هذا الملف الغذائي تقريبًا، والتونة المعلبة بديل جاهز بلا طبخ بواقع 26 جم بروتين لكل 100 جم، والتوفو خيار نباتي لنفس موقع الوجبة.",
        plan: "في مرحلة التنشيف اشوِ 150 جم وأرفقها بكمية كبيرة من البروكلي أو السبانخ لملء الطبق بسعرات شبه معدومة، وفي التضخيم النظيف اجعلها بجانب 150 جم أرز أبيض وملعقة صغيرة من زيت الزيتون.",
        caution: "رقم 165 سعرة يخص اللحم المطبوخ بلا جلد؛ تغليفه بالبقسماط أو قليه أو إغراقه بالصلصات الكريمية قد يضاعف سعرات نفس الكمية ثلاث مرات دون أن تنتبه.",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in one medium chicken breast?", a: "A 150 g cooked breast delivers about 46 g of protein — roughly 37% of what a 90 kg trainee needs for the whole day, from one food." },
        { q: "Is chicken breast good for fat loss?", a: "Yes — at 165 kcal and 31 g protein per 100 g it gives the highest satiety-per-calorie in the protein family on this site, which is why our cutting plans lean on it heavily." },
        { q: "Can I eat chicken breast every day?", a: "You can, but rotating with tuna, eggs, and Greek yogurt keeps your fat and micronutrient intake more balanced — variety is the safer habit." },
      ],
      ar: [
        { q: "كم بروتين في صدر دجاج متوسط؟", a: "قطعة مطبوخة بوزن 150 جم تقدم نحو 46 جم بروتين، أي قرابة ثلث حاجة يوم كامل لمتدرب وزنه 90 كجم من طعام واحد." },
        { q: "هل صدور الدجاج مناسبة لخسارة الدهون؟", a: "نعم؛ بواقع 165 سعرة و31 جم بروتين لكل 100 جم تقدم أعلى إشعار شبع لكل سعرة في عائلة البروتينات بهذا الموقع، ولذلك تعتمد عليها خطط التنشيف لدينا بقوة." },
        { q: "هل يمكن تناول صدور الدجاج يوميًا؟", a: "ممكن، لكن التناوب مع التونة والبيض والزبادي اليوناني يوازن دهونك ومغذياتك الدقيقة بشكل أفضل؛ فالتنويع عادة أكثر أمانًا." },
      ],
    },
  },

  tuna: {
    intro: {
      en: "Canned tuna is the cheapest ready-to-eat protein on the shelf: 26 g of protein per 100 g for 116 kcal and almost no fat, and it needs zero cooking — open the can and eat. One standard can (about 100 g drained) covers a quarter of the protein an 80 kg lifter needs in a day. That makes it the standard emergency meal of cutting phases and travel days, in sandwiches, straight from the can, or folded into a bowl with olive oil and lemon.",
      ar: "التونة المعلبة هي أرخص بروتين جاهز للأكل على الرف: 26 جم بروتين لكل 100 جم مقابل 116 سعرة ودهون شبه معدومة، وبلا أي طبخ — افتح العلبة وكُل. علبة قياسية واحدة (نحو 100 جم مصفاة) تغطي ربع بروتين يوم كامل لرياضي وزنه 80 كجم. لهذا صارت الوجبة الطارئة المعتادة في مراحل التنشيف وأيام السفر، في السندويش أو مباشرة أو مع زيت الزيتون والليمون في طبق.",
    },
    context: {
      en: {
        alternatives: "Canned salmon carries a similar shelf-stable profile with a different flavor; cooked shrimp bumps protein density higher; cottage cheese is the fridge-based swap for the same snack slot.",
        plan: "Pair one drained can with a big salad and a tablespoon of olive oil on a cut — the fat makes the meal satisfying for barely 200 kcal total. On a bulk, two cans over white rice and a banana is a complete 600 kcal meal in five minutes.",
        caution: "Tuna daily is a mercury question, not a calorie question — keep it to a few servings a week and rotate species; tuna packed in oil adds about 100 kcal per can unless you drain it well.",
      },
      ar: {
        alternatives: "السلمون المعلب يقدم الملف نفسه بثبات تخزين مشابه ونكهة مختلفة، والجمبري المطبوخ يرفع كثافة البروتين أعلى، وجبن القريش بديل من الثلاجة لنفس فترة السناك.",
        plan: "اجمع علبة مصفاة مع سلطة كبيرة وملعقة زيت زيتون في التنشيف؛ فالدهن يجعل الوجبة مشبعة بأقل من 200 سعرة إجمالًا. وفي التضخيم: علبتان فوق أرز أبيض مع موزة = وجبة 600 سعرة كاملة في خمس دقائق.",
        caution: "التونة اليومية قضية زئبق لا سعرات؛ اجعلها بضع حصص أسبوعيًا مع تنويع الأنواع، والنوع المعبأ في الزيت يضيف نحو 100 سعرة للعلبة إن لم تصفها جيدًا.",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in one can of tuna?", a: "One standard can drains to roughly 100 g, which at 26 g protein per 100 g lands you about 26 g of complete protein for 116 kcal." },
        { q: "Is tuna good for cutting?", a: "It is one of the best: 116 kcal and 1 g fat per 100 g with no cooking needed means a high-protein meal that survives zero-prep days without breaking your deficit." },
        { q: "Water or oil packed?", a: "Water-packed keeps the can at its measured 116 kcal; oil-packed roughly doubles the calories unless drained thoroughly — choose based on whether that oil fits your fat budget." },
      ],
      ar: [
        { q: "كم بروتين في علبة تونة؟", a: "العلبة القياسية تُصفى إلى نحو 100 جم، أي قرابة 26 جم بروتين كامل مقابل 116 سعرة بمعدل 26 جم لكل 100 جم." },
        { q: "هل التونة مناسبة للتنشيف؟", a: "من الأفضل: 116 سعرة و1 جم دهون لكل 100 جم بلا أي طبخ تعني وجبة عالية البروتين تنجو في أيام الإعداد الصفري دون كسر العجز الحراري." },
        { q: "معلبة بالماء أم بالزيت؟", a: "المعبأة بالماء تحفظ رقم 116 سعرة المقيس، والمعبأة بالزيت تضاعف السعرات تقريبًا إن لم تُصفَّ جيدًا؛ اختر وفق ما إذا كان ذلك الزيت يدخل في ميزانية دهونك." },
      ],
    },
  },

  eggs: {
    intro: {
      en: "Whole eggs are the most complete food in this library: 13 g protein and 11 g fat per 100 g — about two medium eggs — for 155 kcal, plus virtually every micronutrient a lifter cares about in the yolk. The fat is not a flaw; it is what makes eggs feel like a real meal at breakfast and keeps hunger quiet until lunch. They are also the cheapest per-gram complete protein in most markets and cook in three minutes in any form: boiled, scrambled, or fried.",
      ar: "البيض الكامل هو أكثر طعام مكتمل في هذه المكتبة: 13 جم بروتين و11 جم دهون لكل 100 جم — نحو بيضتين متوسطتين — مقابل 155 سعرة، مع كل المغذيات الدقيقة التي تهم الرياضي في الصفار تقريبًا. الدهن هنا ليس عيبًا؛ بل ما يجعل البيض وجبة حقيقية في الفطور ويكتم الجوع حتى الغداء. وهو أيضًا أرخص بروتين مكتامل لكل جرام في أغلب الأسواق ويُطهى في ثلاث دقائق بأي شكل: مسلوقًا أو مقليًا أو عجة.",
    },
    context: {
      en: {
        alternatives: "Egg whites (pure protein, zero fat) when your fat budget is already spent; Greek yogurt for a spoon-ready breakfast; tofu scrambled with turmeric as the plant-based route.",
        plan: "Two whole eggs plus three whites gives ~28 g protein for under 250 kcal on a hard cut. On a bulk, a four-egg omelet with oatmeal is a 700 kcal breakfast that takes ten minutes.",
        caution: "The 155 kcal assumes no added fat — the butter or oil in the pan is often another 100 kcal that never gets counted.",
      },
      ar: {
        alternatives: "بياض البيض (بروتين صافٍ بلا دهون) عند اكتمال ميزانية دهونك، والزبادي اليوناني كفطور جاهز بالملعقة، والتوفو المقلي مع الكركم كمسار نباتي.",
        plan: "بيضتان كاملتان مع ثلاث بياضات تمنحك نحو 28 جم بروتين بأقل من 250 سعرة في تنشيف قاسٍ. وفي التضخيم: عجة من أربع بيضات مع الشوفان فطور 700 سعرة يستغرق عشر دقائق.",
        caution: "رقم 155 سعرة يفترض عدم إضافة دهون؛ فالزبدة أو الزيت في المقلاة غالبًا 100 سعرة إضافية لا تُحسب أبدًا.",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in 2 eggs?", a: "Two medium eggs (about 100 g total) give you 13 g of complete protein plus 11 g of fat for 155 kcal — the yolk carries half the protein, so do not toss it for muscle goals." },
        { q: "Are eggs good for cutting?", a: "Yes in controlled counts — the fat content makes them satiating, so two eggs plus vegetables holds hunger far better than an equal-calorie carb breakfast." },
        { q: "Whole eggs or just whites on a diet?", a: "Keep at least half your eggs whole: the yolk holds the micronutrients. Add whites only when you need more protein without more calories." },
      ],
      ar: [
        { q: "كم بروتين في بيضتين؟", a: "بيضتان متوسطتان (نحو 100 جم) تمنحان 13 جم بروتين مكتامل مع 11 جم دهون مقابل 155 سعرة؛ والصفار يحمل نصف البروتين فلا ترمه إن كان هدفك العضلات." },
        { q: "هل البيض مناسب للتنشيف؟", a: "نعم بعدد مضبوط؛ محتوى الدهن يجعله مشبعًا للشبع، فبيضتان مع خضار تكتم الجوع أفضل بكثير من فطور كربوهيدرات بنفس السعرات." },
        { q: "بيض كامل أم بياض فقط في الرجيم؟", a: "أبقِ نصف بيضك كاملًا على الأقل فالصفار يحمل المغذيات الدقيقة، وأضف البياض فقط عندما تحتاج بروتينًا أكثر بلا سعرات إضافية." },
      ],
    },
  },

  salmon: {
    intro: {
      en: "Salmon is the protein source that solves two problems at once: 20 g of protein per 100 g for muscle, wrapped in 13 g of the omega-3-heavy fat that most lifting diets badly lack. At 208 kcal per 100 g it is denser than chicken breast, which is exactly what you want in a gaining phase and what you budget carefully in a cut. A 150 g fillet covers a full meal's protein and does most of your weekly omega-3 job in one sitting. It is the fish people actually look forward to eating, which matters for consistency.",
      ar: "السلمون مصدر بروتين يحل مشكلتين معًا: 20 جم بروتين لكل 100 جم للعضلات، ملفوفة في 13 جم من الدهون الغنية بأوميغا-3 التي تفتقدها أغلب حميات الملاكمة. بواقع 208 سعرات لكل 100 جم هو أكثف من صدور الدجاج، وهذا بالضبط ما تريده في مرحلة التضخيم وما تحسب له حسابك في التنشيف. فيليه بوزن 150 جم يغطي بروتين وجبة كاملة وينجز معظم مهمتك الأسبوعية من أوميغا-3 في جلسة واحدة. وهو السمك الذي يتشوق الناس لأكله فعلًا، وهذا مهم للالتزام.",
    },
    context: {
      en: {
        alternatives: "Tilapia is the lean everyday swap when salmon does not fit the fat budget; canned tuna keeps the no-cook slot; sardines deliver the same omega-3s in a cheaper package.",
        plan: "On a bulk, a 150 g fillet with quinoa and avocado is a 750 kcal anabolic plate. On a cut, halve the fillet to 75 g and keep the olive oil for vegetables instead — the omega-3s survive the smaller portion.",
        caution: "Farm-raised and wild salmon differ in fat calories more than labels imply; weigh your fillet cooked or raw consistently, because 208 kcal is per 100 g either way.",
      },
      ar: {
        alternatives: "البلطي بديل يومي أقل دهنًا عندما لا يدخل السلمون في ميزانية الدهون، والتونة المعلبة تحفظ فترة بلا طبخ، والسردين يمنح أوميغا-3 نفسه بعبوة أرخص.",
        plan: "في التضخيم: فيليه 150 جم مع كينوا وأفوكادو طبق 750 سعرة لبناء العضلات. وفي التنشيف أنزل الفيليه إلى 75 جم وابحث عن زيت الزيتون للخضار بدلًا منه؛ فأوميغا-3 يبقى في الكمية الأصغر.",
        caution: "المستزرع والبري يختلفان في سعرات الدهون أكثر مما توحي الملصقات؛ زن الفيليه مطبوخًا أو نيئًا بثبات، فـ208 سعرة تحتسب لكل 100 جم في الحالتين.",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in a salmon fillet?", a: "A medium 150 g fillet delivers about 30 g of protein for 312 kcal — with 19.5 g of mostly omega-3 fat riding along, which is the point of choosing salmon over leaner fish." },
        { q: "Is salmon good for cutting?", a: "In 75-100 g portions, yes — the fat is satiating and omega-3s support recovery; just know it carries double the calories of tuna per gram of protein." },
        { q: "How often should I eat salmon?", a: "Twice a week is the practical cadence most nutrition bodies suggest for fatty fish — one of those slots can be a cheaper canned sardine day." },
      ],
      ar: [
        { q: "كم بروتين في فيليه سلمون؟", a: "فيليه متوسط بوزن 150 جم يقدم نحو 30 جم بروتين مقابل 312 سعرة، مع 19.5 جم دهون معظمها أوميغا-3 مرافقة، وهذا هو مغزى اختيار السلمون بدل الأسماك الأقل دهنًا." },
        { q: "هل السلمون مناسب للتنشيف؟", a: "بحصص 75-100 جم نعم؛ الدهن مشبع وأوميغا-3 يدعم الاستشفاء، لكن اعلم أنه يحمل ضعف سعرات التونة لكل جرام بروتين." },
        { q: "كم مرة آكل السلمون أسبوعيًا؟", a: "مرتان أسبوعيًا هي الوتيرة العملية التي تقترحها أغلب المراجع الغذائية للأسماك الدهنية، ويمكن أن تكون إحداهما يوم سردين معلب أرخص." },
      ],
    },
  },

  "white-rice": {
    intro: {
      en: "White rice is pure fuel, nothing else: 28 g of carbohydrate per 100 g cooked with barely 2.7 g of protein and 0.3 g of fat, at 130 kcal. That emptiness is its strength — it fills glycogen stores without competing with your protein or fat targets, digests fast enough to sit comfortably before training, and takes on any flavor next to it. One cup of cooked rice (150 g) is the classic energy base of a gaining day and the first thing scaled down on a cut.",
      ar: "الأرز الأبيض وقود صرف لا غير: 28 جم كربوهيدرات لكل 100 جم مطبوخ مع 2.7 جم بروتين و0.3 جم دهون بالكاد، بواقع 130 سعرة. هذا «الفراغ» هو قوته؛ فهو يملأ مخازن الجلايكوجين دون منافسة مع أهداف بروتينك أو دهونك، ويُهضم بسرعة تجعله مريحًا قبل التمرين، ويستقبل أي نكهة بجانبه. كوب مطبوخ واحد (150 جم) هو قاعدة الطاقة الكلاسيكية ليوم التضخيم وأول ما يُقلص في التنشيف.",
    },
    context: {
      en: {
        alternatives: "Potato matches the carbs with more satiety per calorie; brown rice adds 3 g fiber at the cost of slower digestion around training; couscous is the five-minute pantry swap.",
        plan: "Pre-training, 150 g with honey and a pinch of salt is simple fast fuel. On a bulk, two cups under a chicken-and-olive-oil bowl takes the meal past 700 kcal without effort.",
        caution: "Rice is the easiest food on the site to over-serve — a restaurant portion is often 300 g cooked, double what most people think they ate.",
      },
      ar: {
        alternatives: "البطاطس تضاهي كربوهيدراته بإشعار شبع أعلى لكل سعرة، والأرز البني يضيف 3 جم ألياف مقابل هضم أبطأ حول التمرين، والكسكس بديل الخزانة في خمس دقائق.",
        plan: "قبل التمرين: 150 جم مع عسل ورشة ملح وقود سريع بسيط. وفي التضخيم: كوبان تحت طبق دجاج وزيت زيتون يرفعان الوجبة فوق 700 سعرة بلا جهد.",
        caution: "الأرز أسهل طعام في الموقع بالإفراط في التقديم؛ فحصة المطاعم غالبًا 300 جم مطبوخ، أي ضعف ما يظنه أغلب الناس أنهم أكلوا.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a cup of cooked white rice?", a: "One cup (150 g cooked) comes to about 195 kcal, essentially all from its 42 g of carbohydrate — the 130 kcal figure is the per-100 g reference." },
        { q: "White or brown rice for muscle gain?", a: "Both build muscle identically; white wins around workouts for faster digestion, brown wins at dinner for fiber. Total calories decide the outcome, not the color." },
        { q: "Is rice good for cutting?", a: "In weighed portions it is fine and keeps meals enjoyable; the risk is unmeasured servings — a heaping scoop can quietly erase a 300 kcal deficit." },
      ],
      ar: [
        { q: "كم سعرة في كوب أرز أبيض مطبوخ؟", a: "الكوب (150 جم مطبوخ) يبلغ نحو 195 سعرة، كلها تقريبًا من 42 جم كربوهيدرات؛ فرقم 130 سعرة هو المرجع لكل 100 جم." },
        { q: "أبيض أم بني لبناء العضلات؟", a: "كلاهما يبني العضلات بالتساوي؛ الأبيض يفوز حول التمرين بهضم أسرع والبني يفوز في العشاء بالألياف. إجمالي السعرات هو ما يحسم النتيجة لا اللون." },
        { q: "هل الأرز مناسب للتنشيف؟", a: "بحصص موزونة جيد ولا بأس به ويحفظ الوجبات ممتعة؛ الخطر في التقديم بلا قياس، فغرفة متراكمة قد تمحو عجزًا حراريًا قدره 300 سعرة بصمت." },
      ],
    },
  },

  oatmeal: {
    intro: {
      en: "Oatmeal is the breakfast that carries lifters through mornings: 17 g protein per 100 g dry — unusually high for a grain — plus 10 g of the soluble fiber that keeps blood sugar steady for hours. At 389 kcal per 100 g dry it looks dense, but a real serving is only 40 g (half a cup), which cooks into a large warm bowl for 156 kcal. It is the rare carb food that helps hit protein and fiber targets simultaneously, and it takes sweet or savory toppings equally well.",
      ar: "الشوفان هو الفطور الذي يحمل الرياضيين خلال الصباح: 17 جم بروتين لكل 100 جم جاف — رقم مرتفع بشكل استثنائي للحبوب — مع 10 جم من الألياف الذائبة التي تثبت سكر الدم لساعات. يبدو مكثفًا بواقع 389 سعرة لكل 100 جم جاف، لكن الحصة الحقيقية 40 جم فقط (نصف كوب) وتتحول بعد الطبخ إلى طبق دافئ كبير بـ156 سعرة. إنه طعام الكربوهيدرات النادر الذي يساعدك على بلوغ أهداف البروتين والألياف معًا، ويستقبل الإضافات الحلوة والمالحة بذكاء.",
    },
    context: {
      en: {
        alternatives: "Quinoa when you want a complete-protein grain base for dinner instead; whole wheat bread for a portable morning; rice cakes when you need pre-workout carbs with zero prep.",
        plan: "On a bulk, cook the 40 g in milk, add a banana and peanut butter, and breakfast crosses 600 kcal. On a cut, the same oats in water with berries sit at ~230 kcal and still kill hunger until noon.",
        caution: "Flavored instant packets swap the fiber story for sugar — the 389 kcal reference is plain dry oats, and a single sachet can carry 15 g of added sugar.",
      },
      ar: {
        alternatives: "الكينوا إذا أردت قاعدة حبوب ببروتين مكتمل للعشاء، والخبز الأسمر لصباح متنقل، وكيك الأرز عندما تحتاج كربوهيدرات ما قبل التمرين بلا أي تحضير.",
        plan: "في التضخيم اطبخ 40 جم بالحليب وأضف موزة وزبدة فول سوداني فيتخطى الفطور 600 سعرة. وفي التنشيف: الشوفان نفسه بالماء مع التوت عند نحو 230 سعرة ويكتم الجوع حتى الظهيرة.",
        caution: "الأظرف المنكهة الفورية تستبدل قصة الألياف بالسكر؛ فمرجع 389 سعرة هو الشوفان الجاف السادة، والظرف الواحد قد يحمل 15 جم سكرًا مضافًا.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a bowl of oatmeal?", a: "A standard half-cup dry serving (40 g) cooks into a big bowl at about 156 kcal before toppings — milk, nut butters, and honey are where bowls quietly reach 500." },
        { q: "Is oatmeal good for muscle gain?", a: "Very — the 17 g protein per 100 g dry beats most grains, and paired with milk or Greek yogurt it becomes a genuinely anabolic breakfast carbohydrate." },
        { q: "Oats before or after workout?", a: "Both work: 60-90 minutes before training they digest into steady fuel; after training they refill glycogen cheaply. The fiber only becomes a problem right before hard running." },
      ],
      ar: [
        { q: "كم سعرة في طبق شوفان؟", a: "الحصة القياسية نصف كوب جاف (40 جم) تُطبخ في طبق كبير بنحو 156 سعرة قبل الإضافات؛ فالحليب وزبدات المكسرات والعسل هي ما يرفع الطبق بهدوء إلى 500." },
        { q: "هل الشوفان جيد لبناء العضلات؟", a: "جدًا؛ 17 جم بروتين لكل 100 جم جاف تتفوق على أغلب الحبوب، ومع الحليب أو الزبادي اليوناني يصبح كربوهيدرات فطور مولّدة للعضلات فعلًا." },
        { q: "الشوفان قبل التمرين أم بعده؟", a: "كلاهما يعمل: قبل التمرين بـ60-90 دقيقة يتحول لوقود ثابت، وبعده يعيد ملء الجلايكوجين بتكلفة منخفضة. الألياف تصبح مشكلة فقط قبل الجري العنيف مباشرة." },
      ],
    },
  },

  "sweet-potato": {
    intro: {
      en: "Sweet potato is the carbohydrate source that feels like dessert while behaving like a vegetable: 86 kcal per 100 g with 20 g of carbs, 3 g of fiber, and a natural sweetness (4.2 g sugar) that survives every diet phase. One medium tuber (150 g) is a filling 129 kcal side that most cutting plans allow twice a day. Bodybuilders have carried it through contest prep for decades because it makes reduced-calorie eating resemble normal food, and its slow digestion keeps energy flat rather than spiky.",
      ar: "البطاطا الحلوة مصدر كربوهيدرات يشبه الحلوى طعمًا ويتصرف كخضار: 86 سعرة لكل 100 جم مع 20 جم كربوهيدرات و3 جم ألياف وحلاوة طبيعية (4.2 جم سكر) تنجو في كل مراحل الحمية. حبة متوسطة واحدة (150 جم) طبق جانبي مشبع بـ129 سعرة تسمح به أغلب خطط التنشيف مرتين يوميًا. حملها لاعبو كمال الأجسام في تحضيرات المسابقات عقودًا لأنها تجعل الأكل منخفض السعرات يشبه الطعام الطبيعي، وهضمها البطيء يبقي الطاقة مستوية لا متذبذبة.",
    },
    context: {
      en: {
        alternatives: "White potato is interchangeable calorie-for-calorie with a faster flavor payoff; quinoa turns the same slot into a protein-carrier; corn adds a sweeter budget option at 96 kcal per 100 g.",
        plan: "On a cut, 200 g baked with cinnamon and a chicken breast makes a plate that feels indulgent for under 350 kcal of carbs-and-protein. On a bulk, mash it with olive oil to push the same portion past 300 kcal.",
        caution: "Toppings decide everything: butter, brown sugar, and marshmallows can turn the 129 kcal tuber into a 400 kcal dessert faster than any pastry.",
      },
      ar: {
        alternatives: "البطاطس البيضاء بديل متساوٍ سعرة بسعرة مع عائد نكهة أسرع، والكينوا يحول الموقع نفسه إلى حامل بروتين، والذرة خيار أحلى بـ96 سعرة لكل 100 جم.",
        plan: "في التنشيف: 200 جم مخبوزة مع قرفة وصدر دجاج تصنع طبقًا يبدو مبذرًا بأقل من 350 سعرة كربوهيدرات وبروتين. وفي التضخيم اهرسها بزيت الزيتون لتدفع نفس الحصة فوق 300 سعرة.",
        caution: "الإضافات تحسم كل شيء: الزبدة والسكر البني والمارشميلو قد تحول الحبة ذات الـ129 سعرة إلى حلوى 400 سعرة أسرع من أي معجنات.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in one medium sweet potato?", a: "A 150 g medium tuber lands around 129 kcal with 30 g of carbs and 4.5 g of fiber — the per-100 g reference is 86 kcal, and sizes vary widely." },
        { q: "Sweet potato or white potato for cutting?", a: "Calorie-for-calorie they are nearly identical; sweet potato wins on fiber and micronutrients, white potato wins on satiety research. Pick the one you will actually keep eating." },
        { q: "Why do bodybuilders eat sweet potato?", a: "Slow-digesting carbs that fit prep-level calorie budgets while keeping meals palatable for weeks — 86 kcal per 100 g buys a lot of plate volume." },
      ],
      ar: [
        { q: "كم سعرة في حبة بطاطا حلوة متوسطة؟", a: "حبة متوسطة بوزن 150 جم تبلغ نحو 129 سعرة مع 30 جم كربوهيدرات و4.5 جم ألياف؛ فمرجع 86 سعرة لكل 100 جم والأحجام تتفاوت كثيرًا." },
        { q: "البطاطا الحلوة أم البيضاء للتنشيف؟", a: "سعرة بسعرة متقاربتان تقريبًا؛ الحلوة تفوز بالألياف والمغذيات الدقيقة والبيضاء تفوز بأبحاث الإشعار. اختر ما ستستمر على أكله فعلًا." },
        { q: "لماذا يأكل لاعبو كمال الأجسام البطاطا الحلوة؟", a: "كربوهيدرات بطيئة الهضم تدخل ميزانيات سعرية بمستوى التحضير وتبقي الوجبات شهية لأسابيع؛ 86 سعرة لكل 100 جم تشتري حجمًا كبيرًا في الطبق." },
      ],
    },
  },

  dates: {
    intro: {
      en: "Dates are the most concentrated whole-food energy source in this library: 282 kcal per 100 g, 75 g of carbohydrate, and 8 g of fiber — sugar with structure around it. That density makes them wrong for mindless snacking and perfect for deliberate fueling: five dates (about 50 g) deliver 141 kcal of fast carbs that sit beautifully before a heavy session or break a fasting window. In the Arab kitchen they are also the default gesture of hospitality, which is why a halal-conscious fitness plan needs them handled honestly rather than banned.",
      ar: "التمر أكبر مصدر طاقة من طعام كامل في هذه المكتبة: 282 سعرة لكل 100 جم و75 جم كربوهيدرات و8 جم ألياف — سكر محاط ببنية. هذه الكثافة تجعله خاطئًا كسناك عشوائي ومثاليًا كوقود مقصود: خمس تمرات (نحو 50 جم) تقدم 141 سعرة من الكربوهيدرات السريعة التي تجلس بجمال قبل جلسة ثقيلة أو تكسر نافذة الصيام. وفي المطبخ العربي هو أيضًا رمز الضيافة المعتاد، ولهذا تحتاج أي خطة لياقة واعية ثقافيًا أن تتعامل معه بصدق لا أن تحظره.",
    },
    context: {
      en: {
        alternatives: "Banana is the lighter same-job fruit at 89 kcal per 100 g; rice cakes carry carbs with more volume; a date plus peanut butter replaces a commercial energy bar entirely.",
        plan: "Three dates with coffee 45 minutes before training is the region's cheapest pre-workout. During Ramadan-style fasting, break with two dates and water, then eat the protein meal twenty minutes later.",
        caution: "The 63 g of sugar per 100 g is natural but real — a full 500 g box eaten across an evening is over 1,400 kcal that no one remembers eating.",
      },
      ar: {
        alternatives: "الموز الفاكهة الأفتح للمهمة نفسها بواقع 89 سعرة لكل 100 جم، وكيك الأرز يحمل كربوهيدرات أكثر حجمًا، وتمرة مع زبدة فول سوداني تستبدل بار الطاقة التجاري بالكامل.",
        plan: "ثلاث تمرات مع القهوة قبل التمرين بـ45 دقيقة هي أرخص مكمّل ما قبل التمرين في المنطقة. وفي صيام رمضاني: افطر بتمرتين وماء ثم تناول وجبة البروتين بعد عشرين دقيقة.",
        caution: "الـ63 جم سكر لكل 100 جم طبيعية لكنها حقيقية؛ علبة 500 جم كاملة تُأكل على مساء واحد تعني أكثر من 1400 سعرة لا يتذكرها أحد.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in one date?", a: "A medium pitted date runs about 28 kcal — the classic serving of five dates is 141 kcal, almost entirely the 75 g carbohydrate load measured per 100 g." },
        { q: "Are dates good before a workout?", a: "Excellent — fast natural sugars with 8 g per 100 g of fiber to soften the spike; 3-5 dates with water 45 minutes out is a proven region-native pre-workout." },
        { q: "Can I eat dates while cutting?", a: "Count them like fuel, not like fruit: two dates cost 56 kcal of pure carbs, which fits a cut fine as pre-training energy and poorly as TV snacking." },
      ],
      ar: [
        { q: "كم سعرة في تمرة واحدة؟", a: "التمرة المتوسطة المنزوعة النوى نحو 28 سعرة؛ فالحصة الكلاسيكية من خمس تمرات 141 سعرة، وهي تقريبًا كل حمولة الـ75 جم كربوهيدرات المقيسة لكل 100 جم." },
        { q: "هل التمر جيد قبل التمرين؟", a: "ممتاز؛ سكريات طبيعية سريعة مع 8 جم ألياف لكل 100 جم تلطف الارتفاع، و3-5 تمرات مع ماء قبل 45 دقيقة مكمّل ما قبل تمرين محلي مجرب." },
        { q: "هل آكل التمر أثناء التنشيف؟", a: "عُدّه وقودًا لا فاكهة: تمرتان تكلفان 56 سعرة كربوهيدرات صافية، وهذا يدخل التنشيف كطاقة قبل التمرين ويدخل بشكل سيئ كسناك أمام التلفاز." },
      ],
    },
  },

  "olive-oil": {
    intro: {
      en: "Olive oil is the only food in this library that is 100% fat by design — 884 kcal per 100 g, zero protein, zero carbs — and buying it by the tablespoon (14 g, 124 kcal) is the only sane way to use it. What you are actually buying is flavor and fat quality: mostly monounsaturated fat, the cornerstone of Mediterranean eating patterns that every major health body keeps endorsing. On this site it exists to make vegetables eatable at scale: a salad that would be punishment dry becomes a real meal with one measured spoon.",
      ar: "زيت الزيتون هو الطعام الوحيد في هذه المكتبة الذي هو 100% دهن بالتصميم — 884 سعرة لكل 100 جم، صفر بروتين وصفر كربوهيدرات — وشراؤه بالملعقة (14 جم، 124 سعرة) هي الطريقة العاقبة الوحيدة لاستخدامه. ما تشتريه فعلًا هو النكهة وجودة الدهن: دهون أحادية غير مشبعة في معظمها، حجر الأساس في أنماط الغذاء المتوسطي الذي توصي به كل الهيئات الصحية الكبرى باستمرار. في هذا الموقع وجوده ليجعل الخضار قابلة للأكل بكميات: سلطة كانت عقابًا جافة تصبح وجبة حقيقية بملعقة واحدة مقيسة.",
    },
    context: {
      en: {
        alternatives: "Avocado delivers the same fat class wrapped in fiber and water for far fewer calories per volume; peanut butter is the protein-carrying fat for the same budget slot; coconut oil is the high-heat cooking alternative with a different fat profile.",
        plan: "On a cut, one tablespoon over a two-cup spinach-and-cucumber salad makes the vegetables disappear for 124 kcal. On a bulk, two tablespoons drizzled over rice and chicken adds 248 clean kcal nobody has to chew.",
        caution: "The classic error is pouring, not spooning — a two-second pour from the bottle is typically 2-3 tablespoons, quietly adding 300+ kcal to a meal you logged as light.",
      },
      ar: {
        alternatives: "الأفوكادو يمنح صنف الدهن نفسه ملفوفًا بالألياف والماء بسعرات أقل بكثير لكل حجم، وزبدة الفول السوداني هي الدهن الحامل للبروتين لنفس خانة الميزانية، وزيت جوز الهند بديل الطبخ عالي الحرارة بملف دهني مختلف.",
        plan: "في التنشيف: ملعقة كبيرة فوق سلطة سبانخ وخيار بحجم كوبين تجعل الخضار تختفي مقابل 124 سعرة. وفي التضخيم: ملعقتان فوق الأرز والدجاج تضيفان 248 سعرة نظيفة لا يحتاج أحد لمضغها.",
        caution: "الخطأ الكلاسيكي هو الصب لا الغرف؛ فصبة ثانيتين من الزجاجة تعادل عادة ملعقتين إلى ثلاث، مضافة بلا صوت أكثر من 300 سعرة لوجبة سجلتها خفيفة.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a tablespoon of olive oil?", a: "One tablespoon (14 g) is 124 kcal, all from fat — the 884 kcal figure is the per-100 g reference the bottle sells by." },
        { q: "Is olive oil good for cutting?", a: "Measured by the spoon, yes — it is what makes a large vegetable plate a real meal; unmeasured, it is the fastest deficit-killer in any kitchen on this site." },
        { q: "Can I fry with olive oil?", a: "Extra-virgin handles medium heat but loses aroma compounds at high temperatures — use it cold over finished food for full flavor, and pick another oil for deep frying." },
      ],
      ar: [
        { q: "كم سعرة في ملعقة زيت زيتون؟", a: "الملعقة الكبيرة (14 جم) تساوي 124 سعرة، كلها من الدهن — مرجع 884 سعرة محسوب لكل 100 جم كما يباع بالزجاجة." },
        { q: "هل زيت الزيتون يصلح للتنشيف؟", a: "بالملاعق المقيسة نعم وبقوة؛ هو ما يجعل طبق الخضار الكبير وجبة حقيقية، لكن بلا قياس يصبح أسرع مصدر لتعطيل العجز الحراري في المطبخ كله." },
        { q: "هل أستطيع القلي بزيت الزيتون؟", a: "الدرجات البكر تتحمل حرارة متوسطة وتفقد بعض مركباتها عند التحمير العالي؛ استخدمه باردًا فوق الطعام لتحصل على نكهته كاملة، وللحرارة العالية زيت آخر." },
      ],
    },
  },

  avocado: {
    intro: {
      en: "Avocado is fat that behaves like a vegetable: 15 g of mostly monounsaturated fat and 7 g of fiber per 100 g, wrapped in so much water that a whole half fruit costs only 160 kcal. That combination — fibrous, fatty, nearly carb-free at 9 g — makes it the keto community's favorite fruit and a cutting dieter's cream substitute. Half an avocado (100 g) on eggs or in a salad turns a technically-fine meal into one you actually want again tomorrow.",
      ar: "الأفوكادو دهن يتصرف كخضار: 15 جم دهون أحادية غير مشبعة في معظمها و7 جم ألياف لكل 100 جم، ملفوفة بماء كثير لدرجة أن نصف الحبة الكامل يكلف 160 سعرة فقط. هذا المزيج — مليء بالألياف، دهني، وبلا كربوهيدرات تقريبًا بواقع 9 جم — يجعله الفاكهة المفضلة لمجتمع الكيتو وبديل الكريمة لمن يتنشف. نصف حبة (100 جم) فوق البيض أو في السلطة يحول وجبة «مقبولة تقنيًا» إلى وجبة تريدها فعلًا غدًا.",
    },
    context: {
      en: {
        alternatives: "Olive oil covers the same fat class at a much higher calorie density; peanut butter brings protein with the fat; hummus is the spreadable Middle-Eastern route to the same slot on bread.",
        plan: "On keto or a cut, half an avocado with two eggs and spinach is a 400 kcal plate that holds hunger for five hours. On a bulk, the full avocado plus rice and chicken pushes 800 kcal of mostly whole-food energy.",
        caution: "Ripeness is a two-day window — a rock-hard avocado and a brown one are the same food wasted; lemon juice on the cut half slows the browning you will otherwise eat around.",
      },
      ar: {
        alternatives: "زيت الزيتون يغطي صنف الدهن نفسه بكثافة سعرات أعلى بكثير، وزبدة الفول السوداني تجلب البروتين مع الدهن، والحمص المتبل هو الطريق الشرقي القابل للدهن لنفس الموقع على الخبز.",
        plan: "في الكيتو أو التنشيف: نصف حبة مع بيضتين وسبانخ طبق 400 سعرة يمسك الجوع خمس ساعات. وفي التضخيم: الحبة كاملة مع أرز ودجاج تدفع نحو 800 سعرة من طاقة أطعمة كاملة في معظمها.",
        caution: "النضج نافذة يومين؛ فالحبة الصلبة كالصخرة والبنية الداكنة طعام واحد ضائع، وعصير الليمون على النصف المقطوع يبطئ الاسمراد الذي ستأكل حوله وإلا.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in half an avocado?", a: "A half average fruit (about 100 g of flesh) is 160 kcal — 15 g fat, 9 g carbs, 7 g of which is fiber, making the net carb load tiny." },
        { q: "Is avocado good for weight loss?", a: "In half-fruit portions, yes — the fiber-plus-fat profile is exceptionally satiating; the weight-gain version is the same avocado as guacamole eaten with fried chips." },
        { q: "Can I eat avocado every day?", a: "Half a fruit daily fits most budgets comfortably — that is 160 kcal for nutrients most diets miss; a whole one daily works on low-carb plans and needs trimming elsewhere." },
      ],
      ar: [
        { q: "كم سعرة في نصف حبة أفوكادو؟", a: "نصف حبة متوسطة (نحو 100 جم من اللحم) يساوي 160 سعرة — 15 جم دهون و9 جم كربوهيدرات، 7 جم منها ألياف، ما يجعل صافي الكربوهيدرات ضئيلًا." },
        { q: "هل الأفوكادو جيد لخسارة الوزن؟", a: "بحصص نصف حبة نعم؛ فملف الألياف مع الدهن استثنائي في الإشعار، أما نسخة زيادة الوزن فهي الأفوكادو نفسه غواكامولي يؤكل مع رقائق مقلية." },
        { q: "هل آكل أفوكادو يوميًا؟", a: "نصف حبة يوميًا يدخل أغلب الميزانيات براحة — 160 سعرة مقابل مغذيات تفتقدها أغلب الحميات؛ وحبة كاملة يوميًا تناسب الخطط قليلة الكربوهيدرات وتحتاج تقليصًا في مكان آخر." },
      ],
    },
  },

  "peanut-butter": {
    intro: {
      en: "Peanut butter is the most useful 200-kcal tablespoon in a gaining kitchen: 25 g protein per 100 g alongside 50 g fat, so a single tablespoon (16 g) quietly adds 94 kcal, 4 g protein, and 8 g fat to whatever it lands on. It is the food that makes weight gain easy — spread it on bread, stir it into oats, blend it into shakes — and the same property is exactly why cutting plans measure it by the spoon and never by the jar. Two-spoon discipline is the entire skill.",
      ar: "زبدة الفول السوداني هي أنفع ملعقة من 200 سعرة في مطبخ التضخيم: 25 جم بروتين لكل 100 جم مع 50 جم دهون، فملعقة واحدة (16 جم) تضيف بهدوء 94 سعرة و4 جم بروتين و8 جم دهون على أي شيء تهبط عليه. هي الطعام الذي يجعل زيادة الوزن سهلة — ادهنها على الخبز أو حركها في الشوفان أو اخلطها في الشيك — والخاصية نفسها هي سبب قياس خطط التنشيف لها بالملعقة لا بالبرطمان. الانضباط بملعقتين هو المهارة كلها.",
    },
    context: {
      en: {
        alternatives: "Almond butter is the premium profile with slightly more vitamin E; whole peanuts deliver the same macros with chewing built in (harder to overeat); hummus is the savory swap for the same spread slot.",
        plan: "On a bulk, two tablespoons stirred into oatmeal with a banana turns a 300 kcal breakfast into 550. On a cut, one measured tablespoon on rice cakes after training is a sane 130 kcal reward.",
        caution: "Read the label: the 588 kcal reference is pure peanuts — brands with added sugar and palm oil push it past 620 while calling the difference «flavor».",
      },
      ar: {
        alternatives: "زبدة اللوز هي النسخة الفاخرة بفيتامين هـ أعلى قليلًا، والفول السوداني الكامل يمنح الماكروز نفسها مع مضغ مدمج (أصعب في الإفراط)، والحمص البديل المالح لنفس خانة الدهن.",
        plan: "في التضخيم: ملعقتان محركتان في الشوفان مع موزة يحولان فطور 300 سعرة إلى 550. وفي التنشيف: ملعقة واحدة مقيسة على كيك الأرز بعد التمرين مكافأة عاقلة بـ130 سعرة.",
        caution: "اقرأ الملصق: مرجع 588 سعرة هو الفول السوداني الصافي؛ فالعلامات بسكر وزيت نخيل مضافين تدفعه فوق 620 واسمون الفرق «نكهة».",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in a tablespoon of peanut butter?", a: "One tablespoon (16 g) carries about 4 g of protein and 94 kcal — meaningful as a topping, useless as a primary protein source; the 25 g per 100 g figure needs a quarter-jar to matter." },
        { q: "Is peanut butter good for bulking?", a: "It is the single easiest clean-bulk lever: two daily tablespoons add ~190 kcal of whole-food fat and protein without any extra meal prep." },
        { q: "Can I eat peanut butter on a cut?", a: "Yes, with a measured spoon — the fat is satiating; the failure mode is the jar-plus-spoon combination after dinner, which routinely erases a whole day's deficit." },
      ],
      ar: [
        { q: "كم بروتين في ملعقة زبدة فول سوداني؟", a: "الملعقة (16 جم) تحمل نحو 4 جم بروتين و94 سعرة — مؤثرة كإضافة وعديمة القيمة كمصدر بروتين أساسي؛ فرقم 25 جم لكل 100 جم يحتاج ربع برطمان ليحسب." },
        { q: "هل زبدة الفول السوداني جيدة للتضخيم؟", a: "هي أسهل رافعة تضخيم نظيف على الإطلاق: ملعقتان يوميًا تضيفان نحو 190 سعرة من دهن وبروتين أطعمة كاملة بلا أي تحضير وجبات إضافي." },
        { q: "هل آكلها أثناء التنشيف؟", a: "نعم بملعقة مقيسة؛ الدهن مشبع، أما نمط الفشل فهو ثنائية البرطمان والملعقة بعد العشاء، التي تمحو عجز يوم كامل بروتينية معتادة." },
      ],
    },
  },

  broccoli: {
    intro: {
      en: "Broccoli is the volume food of cutting phases: 34 kcal per 100 g means a full cup (90 g) costs 31 kcal — you could eat four cups and still be under one banana. It carries 2.8 g protein, 2.6 g fiber, and only 7 g of carbs per 100 g, so it fills plates and stomachs without touching any macro budget that matters. Roasted with garlic and a spoon of olive oil it becomes the side dish that makes a chicken-and-rice cut feel like cooking rather than punishment.",
      ar: "البروكلي هو طعام الحجم في مراحل التنشيف: 34 سعرة لكل 100 جم تعني أن كوبًا كاملًا (90 جم) يكلف 31 سعرة — يمكنك أكل أربعة أكواب وتبقى أقل من موزة واحدة. يحمل 2.8 جم بروتين و2.6 جم ألياف و7 جم كربوهيدرات فقط لكل 100 جم، فيملأ الأطباق والمعدة دون لمس أي ميزانية ماكروز مهمة. مشويًا بالثوم وملعقة زيت زيتون يصبح الطبق الجانبي الذي يجعل تنشيف الدجاج والأرز يبدو طبخًا لا عقابًا.",
    },
    context: {
      en: {
        alternatives: "Cauliflower is the neutral-flavored twin for the same job; spinach swaps in raw for salads; zucchini roasts into the same sheet-pan dinner with even fewer calories.",
        plan: "On a hard cut, make broccoli half the plate by area — 300 g costs 102 kcal and physically crowds out room you might have filled with rice. On a bulk it steps aside for carb-denser sides.",
        caution: "Boiling leaches the folate and vitamin C into the water you pour away — steam or roast instead, and stop calling it diet food or you will never cook it well.",
      },
      ar: {
        alternatives: "القرنبيط هو التوأم محايد النكهة لنفس الوظيفة، والسبانخ بديله نيئًا في السلطات، والكوسا تشترك معه في نفس صينية الفرن بسعرات أقل منه أيضًا.",
        plan: "في تنشيف قاسٍ اجعل البروكلي نصف الطبق بالمساحة؛ فـ300 جم تكلف 102 سعرة وتزاحم فيزيائيًا المكان الذي كان سيمتلئ بالأرز. وفي التضخيم يتنحى للأطباق الأكثر كثافة كربوهيدراتية.",
        caution: "السلق يذيب الفولات وفيتامين سي في الماء الذي ترميه — ابخره أو اشوه، وتوقف عن تسميته طعام رجيم وإلا لن تطبخه جيدًا أبدًا.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a cup of broccoli?", a: "One cup (90 g) is about 31 kcal with 2.5 g protein and 2.3 g fiber — the per-100 g reference is 34 kcal, among the lowest of any food on this site." },
        { q: "Is broccoli high in protein?", a: "Relatively: 2.8 g per 100 g is high for a vegetable, but you would need 1.1 kg of it to match one chicken breast — treat it as a filler, not a protein source." },
        { q: "Raw or cooked for meal prep?", a: "Both are fine calorie-wise; steaming keeps the micronutrients that boiling pours off, and roasting with a measured spoon of oil is what makes people actually finish their vegetables." },
      ],
      ar: [
        { q: "كم سعرة في كوب بروكلي؟", a: "الكوب (90 جم) نحو 31 سعرة مع 2.5 جم بروتين و2.3 جم ألياف؛ فمرجع 34 سعرة لكل 100 جم من الأدنى بين كل أطعمة هذا الموقع." },
        { q: "هل البروكلي عالي البروتين؟", a: "نسبيًا: 2.8 جم لكل 100 جم رقم مرتفع لخضار، لكنك تحتاج 1.1 كجم منه لمضاهاة صدر دجاج واحد — عُدّه حاشيًا لا مصدر بروتين." },
        { q: "نيء أم مطبوخ للتحضير المسبق؟", a: "كلاهما سواء بالسعرات؛ التبخير يحفظ المغذيات التي يذيبها السلق، والتحمير بملعقة زيت مقيسة هو ما يجعل الناس ينهون خضارهم فعلًا." },
      ],
    },
  },

  spinach: {
    intro: {
      en: "Spinach is the closest thing to free food in this library: 23 kcal per 100 g, and a generous two-cup fresh serving (60 g) is 14 kcal — less than a single date. The 2.9 g protein and 2.2 g fiber per 100 g are rounding errors for macro planning but meaningful for volume eating: wilted into eggs, stirred into rice, or hidden in a shake, it adds plate weight and micronutrients while subtracting nothing. Its real job is being the green half of every high-protein meal on a cut.",
      ar: "السبانخ أقرب شيء لطعام مجاني في هذه المكتبة: 23 سعرة لكل 100 جم، وحصة سخية من كوبين طازجين (60 جم) تساوي 14 سعرة — أقل من تمرة واحدة. الـ2.9 جم بروتين والـ2.2 جم ألياف لكل 100 جم هامشية في حساب الماكروز لكنها مؤثرة في أكل الحجم: ذابلة في البيض أو محركة في الأرز أو مخفية في الشيك، تضيف وزن الطبق والمغذيات الدقيقة دون أن تخصم شيئًا. وظيفتها الحقيقية أن تكون النصف الأخضر لكل وجبة عالية البروتين في التنشيف.",
    },
    context: {
      en: {
        alternatives: "Lettuce builds the same volume in salads with even fewer calories; broccoli is the hot-side twin; frozen spinach is the identical nutrient package that waits in the freezer without rotting.",
        plan: "On a cut, wilt 150 g of spinach into your eggs or soup — it disappears, adds 35 kcal of mostly micronutrients, and visually triples the meal. On a bulk, use it as the bed under protein bowls.",
        caution: "Fresh spinach spoils in days and becomes food waste; buy frozen for cooking and fresh only for salads you will actually make this week.",
      },
      ar: {
        alternatives: "الخس يبني الحجم نفسه في السلطات بسعرات أقل منه أيضًا، والبروكلي هو التوأم في الطبق الساخن، والسبانخ المجمدة هي العبوة نفسها من المغذيات تنتظر في الفريزر دون أن تتعفن.",
        plan: "في التنشيف أذب 150 جم سبانخ في بيضك أو شوربتك؛ تختفي وتضيف 35 سعرة معظمها مغذيات دقيقة وتضاعف الوجبة بصريًا. وفي التضخيم اجعلها الفراش تحت أطباق البروتين.",
        caution: "السبانخ الطازجة تفسد في أيام وتصبح هدرًا؛ اشترِ مجمدة للطبخ وطازجة فقط لسلطات ستعملها فعلًا هذا الأسبوع.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in two cups of spinach?", a: "Two fresh cups (60 g) come to just 14 kcal — the per-100 g reference is 23 kcal, making it the lowest-calorie tagged food on this site." },
        { q: "Does spinach have protein?", a: "About 2.9 g per 100 g — respectable for a leaf, but its job in a plan is volume and micronutrients, not protein; get the protein from whatever sits on top of it." },
        { q: "Fresh or frozen spinach for cooking?", a: "Nutritionally near-identical; frozen wins on waste (no three-day rot window) and price, fresh wins only in salads where texture carries the meal." },
      ],
      ar: [
        { q: "كم سعرة في كوبين سبانخ؟", a: "كوبان طازجان (60 جم) يبلغان 14 سعرة فقط؛ فمرجع 23 سعرة لكل 100 جم يجعلها أقل أطعمة الموقع الموسومة سعرات." },
        { q: "هل السبانخ فيها بروتين؟", a: "نحو 2.9 جم لكل 100 جم — رقم محترم لورقة نبات، لكن وظيفتها في الخطة الحجم والمغذيات الدقيقة لا البروتين؛ خذ البروتين مما يستقر فوقها." },
        { q: "طازجة أم مجمدة للطبخ؟", a: "تقريبًا متطابقتان غذائيًا؛ المجمدة تفوز في الهدر (بلا نافذة تعفن ثلاثة أيام) والسعر، والطازجة تفوز فقط في السلطات حيث الملمس يحمل الوجبة." },
      ],
    },
  },

  banana: {
    intro: {
      en: "The banana is portable carbohydrate at its most practical: 89 kcal per 100 g, and one medium fruit (120 g) is 107 kcal of 27 g carbs with 2.6 g fiber, sealed in its own wrapper, needing nothing — no fridge, no spoon, no prep. That is why it owns the gym-bag slot worldwide: it digests fast enough to fuel a session, gentle enough to sit on a nervous pre-competition stomach, and sweet enough to end a meal without a dessert. It is the fruit you buy weekly and actually finish.",
      ar: "الموز كربوهيدرات متنقلة في أكثر صورها عملية: 89 سعرة لكل 100 جم، وحبة متوسطة (120 جم) تساوي 107 سعرة من 27 جم كربوهيدرات مع 2.6 جم ألياف، مغلفة بغلافها الخاص، لا تحتاج شيئًا — لا ثلاجة ولا ملعقة ولا تحضير. لهذا تملك حصة حقيبة الجيم عالميًا: يُهضم بسرعة تكفي لتوقيد جلسة، ولطيف بما يكفي ليستقر على معدة متوترة قبل المنافسة، وحلو بما يكفي ليختم الوجبة بلا حلوى. إنها الفاكهة التي تشتريها أسبوعيًا وتنهيها فعلًا.",
    },
    context: {
      en: {
        alternatives: "Dates are the regional, denser fuel at 282 kcal per 100 g; apple brings crunch and fewer calories at 52; oatmeal is the same slow-burn job in breakfast form.",
        plan: "One banana with coffee 30-45 minutes before training is the universal simple pre-workout. Post-session, banana plus a Greek yogurt covers the carb-plus-protein window for under 250 kcal.",
        caution: "Bananas ripen in days — green ones are slower-digesting, brown-spotted ones are faster sugar; the 89 kcal stays true either way, but your bowl is a countdown timer.",
      },
      ar: {
        alternatives: "التمر هو الوقود الإقليمي الأكثف بواقع 282 سعرة لكل 100 جم، والتفاح يجلب القرمشة وسعرات أقل بواقع 52، والشوفان يؤدي مهمة الاحتراق البطيء نفسها في صورة فطور.",
        plan: "موزة واحدة مع القهوة قبل التمرين بـ30-45 دقيقة هي مكمّل ما قبل التمرين البسيط الشامل. وبعد الجلسة: موزة مع زبادي يوناني يغطيان نافذة الكربوهيدرات والبروتين بأقل من 250 سعرة.",
        caution: "الموز ينضج في أيام؛ الأخضر أبطأ هضمًا والمنقّط البني أسرع تحولًا لسكر، ورقم 89 سعرة يبقى صادقًا في الحالتين، لكن سلطتك مؤقت زمني.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in one banana?", a: "A medium fruit (120 g) is about 107 kcal, essentially all from 27 g of carbohydrate — the per-100 g reference is 89 kcal, so size swings the total." },
        { q: "Is a banana good before a workout?", a: "It is the default choice: fast-digesting carbs in a self-packaged fruit with zero prep; 30-45 minutes out is the sweet spot for most trainees." },
        { q: "Banana when cutting — yes or no?", a: "Yes as deliberate pre-training fuel; the mistake is treating fruit as «free» — three bananas across a day is 320 kcal that a deficit notices." },
      ],
      ar: [
        { q: "كم سعرة في موزة؟", a: "الحبة المتوسطة (120 جم) نحو 107 سعرة، كلها تقريبًا من 27 جم كربوهيدرات؛ فمرجع 89 سعرة لكل 100 جم والحجم يحرك الإجمالي." },
        { q: "هل الموز جيد قبل التمرين؟", a: "هو الخيار الافتراضي: كربوهيدرات سريعة الهضم في فاكهة ذات تغليف ذاتي بلا تحضير؛ و30-45 دقيقة قبل الجلسة هي البقعة المثالية لأغلب المتدربين." },
        { q: "الموز أثناء التنشيف — نعم أم لا؟", a: "نعم كوقود مقصود قبل التمرين؛ والخطأ اعتبار الفاكهة «مجانية» — ثلاث موزات في اليوم 320 سعرة يشعر بها العجز الحراري." },
      ],
    },
  },

  apple: {
    intro: {
      en: "An apple is the most honest snack in the fruit bowl: 52 kcal per 100 g, so a medium one (150 g) is 78 kcal with 3.6 g of fiber that requires actual chewing — the mechanical satiety that liquid snacks never deliver. Its 10 g of sugar per 100 g comes packaged with water and pectin, giving it a slow, flat curve rather than a spike. On a cut it is the default sweet tooth settlement: crisp, portable, zero prep, and impossible to eat mindlessly because it takes five minutes.",
      ar: "التفاحة أكثر سناك صادق في سلة الفاكهة: 52 سعرة لكل 100 جم، فالحبة المتوسطة (150 جم) تساوي 78 سعرة مع 3.6 جم ألياف تتطلب مضغًا حقيقيًا — الإشعار الميكانيكي الذي لا تقدمه السناكات السائلة أبدًا. سكرها البالغ 10 جم لكل 100 جم يأتي معبأً بالماء والبكتين، فيمنحها منحنى بطيئًا مستويًا لا ارتفاع حاد. في التنشيف هي التسوية المعتادة لأسنان الحلو: مقرمشة، متنقلة، بلا تحضير، ومستحيلة الأكل بلا وعي لأنها تستغرق خمس دقائق.",
    },
    context: {
      en: {
        alternatives: "Banana when you need pre-training fuel instead of a snack; mixed berries give the same sweetness with a freezer shelf-life; dates when the goal is dense energy, not volume.",
        plan: "Pair a medium apple with a spoon of peanut butter (about 78 + 94 kcal) for a cutting snack that carries you three hours. On a bulk, the apple plays the fiber role beside denser carb sources.",
        caution: "Juice is not this food: removing the chewing and fiber turns two apples' worth of sugar into something you drink in ninety seconds.",
      },
      ar: {
        alternatives: "الموز عندما تحتاج وقود ما قبل التمرين بدل سناك، والتوت المشكل يمنح الحلاوة نفسه بعمر رف في الفريزر، والتمر حين يكون الهدف طاقة مكثفة لا حجمًا.",
        plan: "اجمع تفاحة متوسطة مع ملعقة زبدة فول سوداني (نحو 78 + 94 سعرة) لسناك تنشيف يحملك ثلاث ساعات. وفي التضخيم تلعب التفاحة دور الألياف بجانب مصادر كربوهيدرات أكثف.",
        caution: "العصير ليس هذا الطعام: نزع المضغ والألياف يحول سكر تفاحتين إلى شيء تشربه في تسعين ثانية.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a medium apple?", a: "About 78 kcal for a 150 g fruit — 21 g of carbs of which 3.6 g is fiber, with the per-100 g reference at 52 kcal." },
        { q: "Is an apple a good cutting snack?", a: "One of the best: the chewing-plus-fiber combination delivers real satiety per calorie, and it displaces the biscuit it replaces in most snack drawers." },
        { q: "Which apple for meal prep?", a: "Calorie differences between varieties are negligible — pick by texture preference; what matters is having them washed and visible, because an apple in the drawer is forgotten." },
      ],
      ar: [
        { q: "كم سعرة في تفاحة متوسطة؟", a: "نحو 78 سعرة لحبة بوزن 150 جم — 21 جم كربوهيدرات منها 3.6 جم ألياف، والمرجع لكل 100 جم هو 52 سعرة." },
        { q: "هل التفاحة سناك جيد للتنشيف؟", a: "من الأفضل: تركيبة المضغ مع الألياف تقدم إشعارًا حقيقيًا لكل سعرة، وتزيح البسكويت الذي كانت ستستبدله في أغلب أدراج السناك." },
        { q: "أي تفاح للتحضير المسبق؟", a: "فروق السعرات بين الأصناف هامشية — اختر بتفضيل الملمس؛ المهم أن تكون مغسولة ومرئية، فالتفاحة في الدرج تُنسى." },
      ],
    },
  },

  "greek-yogurt": {
    intro: {
      en: "Greek yogurt is dessert that is actually a protein food: 10 g protein per 100 g with only 59 kcal and 0.4 g fat, which means one cup (170 g) delivers 17 g of protein for 100 kcal — a ratio most protein bars cannot touch without filler ingredients. The strained texture eats like cream, the 3.2 g of natural sugar carries almost no insulin drama, and it is the base of every high-protein dessert trick: with berries, with cocoa, frozen into bark. On a cut it is the single most useful item in the fridge.",
      ar: "الزبادي اليوناني حلوى هي في الحقيقة طعام بروتين: 10 جم بروتين لكل 100 جم مع 59 سعرة و0.4 جم دهون فقط، أي أن كوبًا واحدًا (170 جم) يقدم 17 جم بروتين مقابل 100 سعرة — نسبة لا تلمسها أغلب بارات البروتين بلا مكونات حاشدة. القوام المصفى يؤكل كالكريمة، والـ3.2 جم سكر طبيعي لا تحدث درامات إنسولين تقريبًا، وهو قاعدة كل حيل الحلويات عالية البروتين: مع التوت أو الكاكاو أو مجمدًا. في التنشيف هو أنفع عنصر في الثلاجة.",
    },
    context: {
      en: {
        alternatives: "Cottage cheese is the savory twin with 11 g protein per 100 g; labneh is the regional strained classic for the same slot at breakfast; skyr-style products repeat the profile under different branding.",
        plan: "On a cut, one cup with mixed berries and cinnamon is a 150 kcal dessert that hits 17 g protein. On a bulk, stir in peanut butter and granola and it becomes a 450 kcal evening meal.",
        caution: "The 59 kcal reference is plain yogurt — the fruit-on-the-bottom cups carry added sugar that doubles the calories while keeping the health halo on the label.",
      },
      ar: {
        alternatives: "جبن القريش هو التوأم المالح بواقع 11 جم بروتين لكل 100 جم، واللبنة هي الكلاسيكية المصفاة الإقليمية لنفس موقع الفطور، ومنتجات سكير تكرر الملف نفسه بتسمية مختلفة.",
        plan: "في التنشيف: كوب مع توت مشكل وقرفة = حلوى 150 سعرة تصيب 17 جم بروتين. وفي التضخيم: حرك فيه زبدة فول سوداني وجرانولا فتصبح وجبة مسائية 450 سعرة.",
        caution: "مرجع 59 سعرة هو الزبادي السادة؛ فالأكواب المحلاة بالفاكهة في القاع تحمل سكرًا مضافًا يضاعف السعرات مع بقاء الهالة الصحية على الملصق.",
      },
    },
    faq: {
      en: [
        { q: "How much protein in a cup of Greek yogurt?", a: "One cup (170 g) provides about 17 g of protein for roughly 100 kcal — the per-100 g figures are 10 g protein and 59 kcal." },
        { q: "Is Greek yogurt good for fat loss?", a: "It is the strongest fridge-based tool: protein-per-calorie rivaling chicken, eaten as dessert, with zero cooking involved — the failure mode is only the sweetened varieties." },
        { q: "Greek yogurt vs regular yogurt?", a: "Straining removes whey, roughly doubling protein per spoon and thickening the texture; regular yogurt is cheaper and fine — the protein goal is what should pick." },
      ],
      ar: [
        { q: "كم بروتين في كوب زبادي يوناني؟", a: "الكوب (170 جم) يقدم نحو 17 جم بروتين مقابل قرابة 100 سعرة؛ فأرقام كل 100 جم هي 10 جم بروتين و59 سعرة." },
        { q: "هل الزبادي اليوناني جيد لخسارة الدهون؟", a: "هو أقوى أداة من الثلاجة: بروتين لكل سعرة ينافس الدجاج، ويؤكل كحلوى، وبلا أي طبخ — ونمط الفشل الوحيد هو الأنواع المحلاة." },
        { q: "يوناني أم زبادي عادي؟", a: "التصفية تنزع المصل فتضاعف البروتين تقريبًا بالملعقة وتكثف القوام؛ العادي أرخص وكافٍ، وهدف البروتين هو من ينبغي أن يختار." },
      ],
    },
  },

  "cottage-cheese": {
    intro: {
      en: "Cottage cheese is the slow-night protein: 11 g per 100 g with a casein-dominant profile that digests for hours, which is why it earned its bedtime reputation — half a cup (110 g) before sleep feeds muscle 12 g of protein across the night for 108 kcal. The curd texture divides people, but blended into pancakes, folded into eggs, or simply topped with black pepper and olive oil, it quietly solves the hardest meal slot on a cut: the post-dinner hunger that ruins compliance.",
      ar: "جبن القريش هو بروتين الليل البطيء: 11 جم لكل 100 جم بملف يغلب عليه الكازين يُهضم لساعات، ولهذا استحق سمعته قبل النوم — نصف كوب (110 جم) قبل النوم يغذي العضلات 12 جم بروتين على مدار الليل مقابل 108 سعرات. قوام الخثارة يفرّق الناس، لكنه مخلوطًا بالبانكيك أو مطويًا في البيض أو ببساطة مع فلفل أسود وزيت زيتون يحل بهدوء أصعب خانة وجبة في التنشيف: جوع ما بعد العشاء الذي يهدم الالتزام.",
    },
    context: {
      en: {
        alternatives: "Greek yogurt is the spoon-smooth swap with the same protein class; labneh carries the same strained tradition with a spreadable body; ricotta plays the curd role inside Italian cooking.",
        plan: "On a cut, half a cup with cucumber and mint is a 110 kcal late meal. On a bulk, blend it into pancake batter or scrambled eggs to protein-load meals without changing their flavor.",
        caution: "Sodium is the hidden line on the label — the 98 kcal reference holds for plain curds, and flavored tubs add sugar or cream that moves the number fast.",
      },
      ar: {
        alternatives: "الزبادي اليوناني بديل أملس بالملعقة بنفس صنف البروتين، واللبنة تحمل التقليد المصفى نفسه بجسد قابل للدهن، والريكوتا تلعب دور الخثارة داخل الطبخ الإيطالي.",
        plan: "في التنشيف: نصف كوب مع خيار ونعناع وجبة ليلية 110 سعرة. وفي التضخيم: اخلطه بعجينة البانكيك أو البيض المضروب لتحميل البروتين دون تغيير النكهة.",
        caution: "الصوديوم هو الخط الخفي على الملصق؛ مرجع 98 سعرة يخص الخثارة السادة، والعلب المنكهة تضيف سكرًا أو كريمة تحرك الرقم بسرعة.",
      },
    },
    faq: {
      en: [
        { q: "How much protein in half a cup of cottage cheese?", a: "Half a cup (110 g) gives about 12 g of protein for 108 kcal — the per-100 g reference is 11 g protein and 98 kcal, with almost no carbs." },
        { q: "Why do lifters eat cottage cheese before bed?", a: "Its protein is mostly casein, which digests slowly over hours — a practical way to keep amino acids circulating overnight without waking up to eat." },
        { q: "How do I make cottage cheese taste good?", a: "Black pepper plus olive oil for savory, berries for sweet, or blended into eggs and pancakes where the curds vanish entirely — the texture is the only objection, so hide it." },
      ],
      ar: [
        { q: "كم بروتين في نصف كوب جبن قريش؟", a: "نصف الكوب (110 جم) يمنح نحو 12 جم بروتين مقابل 108 سعرة؛ فمرجع كل 100 جم هو 11 جم بروتين و98 سعرة، وبكربوهيدرات تكاد تكون معدومة." },
        { q: "لماذا يأكل الملاكمون القريش قبل النوم؟", a: "بروتينه غالبية كازين يُهضم ببطء لساعات — طريقة عملية لإبقاء الأحماض الأمينية متداولة طوال الليل دون الاستيقاظ للأكل." },
        { q: "كيف أجعل طعم القريش جيدًا؟", a: "فلفل أسود مع زيت زيتون للمالح، وتوت للحلو، أو مخلوطًا في البيض والبانكيك حيث تختفي الخثارات تمامًا؛ فالقوام هو الاعتراض الوحيد — أخفه." },
      ],
    },
  },

  almonds: {
    intro: {
      en: "Almonds are the most measured food on this site for a reason: 579 kcal per 100 g with 21 g protein and 12 g fiber — excellent numbers wrapped in a fat content (50 g) that makes the honest serving one quarter-cup (35 g), which is 203 kcal. Eaten by the count, they are the professional's travel protein; eaten from the bag in front of a screen, they are the classic silent bulk. The skill with almonds is entirely in the portioning, and a kitchen scale pays for itself on this food alone.",
      ar: "اللوز أكثر طعام يحتاج قياسًا في هذا الموقع لسبب: 579 سعرة لكل 100 جم مع 21 جم بروتين و12 جم ألياف — أرقام ممتازة ملفوفة في محتوى دهون (50 جم) يجعل الحصة الصادقة ربع كوب (35 جم) أي 203 سعرة. مأكولة بالعدّ هي بروتين التنقلات للمحترفين، ومأكولة من الكيس أمام شاشة فهي التضخيم الصامت الكلاسيكي. المهارة مع اللوز كلها في التقدير، وميزان المطبخ يسدد ثمنه من هذا الطعام وحده.",
    },
    context: {
      en: {
        alternatives: "Walnuts bring omega-3 fats to the same quarter-cup slot; peanuts are the budget swap with similar macros and much cheaper per gram; pistachios slow you down with shelling built in.",
        plan: "On a cut, count 15 almonds (about 20 g, 116 kcal) as the daily nut ration instead of pouring. On a bulk, blend almonds into milk-based shakes where a 50 g serving adds 290 kcal invisibly.",
        caution: "A casual grab of almonds is 30-40 g — nearly 200 kcal eaten in ninety seconds between tasks; this is the food where unmeasured snacking defeats the whole plan.",
      },
      ar: {
        alternatives: "عين جمل يجلب دهون أوميغا-3 لنفس خانة ربع الكوب، والفول السوداني بديل الميزانية بماكروز مشابهة وسعر أرخص بكثير بالجرام، والفستق يبطئك بقشوره المدمجة.",
        plan: "في التنشيف عُدّ 15 لوزة (نحو 20 جم، 116 سعرة) كحصة المكسرات اليومية بدل الصب. وفي التضخيم اخلط اللوز في شيك بالحليب حيث تضيف حصة 50 جم نحو 290 سعرة بلا شعور.",
        caution: "القمة العابرة من الكيس 30-40 جم — قرابة 200 سعرة تؤكل في تسعين ثانية بين مهمتين؛ هذا هو الطعام الذي يهدم فيه السناك غير المقيس الخطة كلها.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a quarter cup of almonds?", a: "A quarter cup (35 g) is about 203 kcal with 7.4 g protein and 4.2 g fiber — the per-100 g reference is a dense 579 kcal." },
        { q: "Are almonds good for weight loss?", a: "In counted portions they help — protein, fiber, and mostly monounsaturated fat; by the handful they are one of the fastest ways to erase a deficit without a meal." },
        { q: "How many almonds should I eat a day?", a: "15-20 whole almonds (20-25 g) is the working ration most plans land on — enough for the nutrient payload, small enough that the 579 kcal density cannot ambush you." },
      ],
      ar: [
        { q: "كم سعرة في ربع كوب لوز؟", a: "ربع الكوب (35 جم) نحو 203 سعرة مع 7.4 جم بروتين و4.2 جم ألياف؛ فمرجع كل 100 جم كثيف بواقع 579 سعرة." },
        { q: "هل اللوز جيد لخسارة الوزن؟", a: "بحصص معدودة يساعد — بروتين وألياف ودهون أحادية في معظمها؛ وبالقبضات فهو أسرع طرق محو العجز الحراري دون وجبة." },
        { q: "كم لوزة آكل يوميًا؟", a: "15-20 لوزة كاملة (20-25 جم) هي الحصة العملية التي تستقر عليها أغلب الخطط — تكفي لحمل المغذيات وتظل صغيرة بما يمنع كثافة 579 سعرة من كمينك." },
      ],
    },
  },

  walnuts: {
    intro: {
      en: "Walnuts are the omega-3 delivery system that happens to be a snack: 654 kcal per 100 g with a fat profile that includes plant omega-3s almost no other nut matches, 15 g protein, and 6.7 g fiber. The honest serving is a quarter cup (30 g, 196 kcal) — about 12 halves — and that single serving is what makes walnuts worth their price among all the cheaper nuts. Their slightly bitter finish is actually the taste of those omega-3s oxidizing slowly, so fresh walnuts taste milder than stale ones.",
      ar: "عين جمل هو منظومة توصيل أوميغا-3 التي تصادف أنها سناك: 654 سعرة لكل 100 جم بملف دهون يشمل أوميغا-3 نباتيًا لا تضاهيه فيه مكسرة أخرى تقريبًا، مع 15 جم بروتين و6.7 جم ألياف. الحصة الصادقة ربع كوب (30 جم، 196 سعرة) — نحو 12 نصفًا — وهذه الحصة الواحدة هي ما يجعل ثمنه مستحقًا بين كل المكسرات الأرخص. مرارته الخفيفة في الحقيقة طعم تلك الأوميغا-3 تتأكسد ببطء، فالجوز الطازج ألطف طعمًا من القديم.",
    },
    context: {
      en: {
        alternatives: "Almonds carry more protein per quarter-cup; peanuts do the budget job; chia seeds are the seed-world route to the same plant omega-3 class without the calorie density.",
        plan: "On a cut, crush 12 halves over a salad instead of using them as a snack — the same 196 kcal becomes texture and fat quality on a plate you were eating anyway.",
        caution: "Bitter walnuts are oxidized walnuts: the omega-3s are fragile, so buy small quantities, keep them cold, and taste one before baking the whole bag into anything.",
      },
      ar: {
        alternatives: "اللوز يحمل بروتينًا أكثر لكل ربع كوب، والفول السوداني يقوم بمهمة الميزانية، وبذور الشيا هي طريق عالم البذور لنفس صنف أوميغا-3 النباتي دون الكثافة السعرية.",
        plan: "في التنشيف: اسحق 12 نصفًا فوق سلطة بدل استخدامها سناك؛ فنفس الـ196 سعرة تتحول إلى ملمس وجودة دهن على طبق كنت ستأكله على أي حال.",
        caution: "الجوز المر هو جوز متأكسد: الأوميغا-3 هشة، فاشترِ كميات صغيرة واحفظها باردة وذق واحدة قبل أن تخبز الكيس كله في أي شيء.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a quarter cup of walnuts?", a: "A quarter cup (30 g) is about 196 kcal — 4.5 g protein and 2 g fiber riding on 19.5 g of fat; the per-100 g reference is 654 kcal." },
        { q: "Why eat walnuts over cheaper nuts?", a: "The plant omega-3 content is the differentiator — the reason a small daily serving earns its slot; if that nutrient is not your goal, almonds or peanuts do the job for less." },
        { q: "My walnuts taste bitter — bad luck?", a: "That is oxidation of the fragile omega-3 fats, not variety: store them cold in small quantities, and bitter ones are better discarded than baked into desserts." },
      ],
      ar: [
        { q: "كم سعرة في ربع كوب عين جمل؟", a: "ربع الكوب (30 جم) نحو 196 سعرة — 4.5 جم بروتين و2 جم ألياف راكبة على 19.5 جم دهون؛ ومرجع كل 100 جم هو 654 سعرة." },
        { q: "لماذا آكل الجوز بدل مكسرات أرخص؟", a: "محتوى أوميغا-3 النباتي هو الفارق — سبب استحقاق الحصة اليومية الصغيرة لمكانها؛ وإن لم يكن ذلك المغذي هدفك فاللوز أو الفول السوداني يقومان بالوظيفة بأقل." },
        { q: "جوزي طعمه مر — هل هي حظ سيئ؟", a: "هذا أكسدة للدهون الهشة أوميغا-3 لا اختلاف صنف: خزّنها باردة بكميات صغيرة، والمر منها يُرمى أفضل من خبزه في الحلويات." },
      ],
    },
  },

  "green-tea": {
    intro: {
      en: "Green tea is the one entry in this library that is essentially calorie-free — 1 kcal per cup (240 g) — which means it earns its place through what it replaces, not what it adds: the sugary tea, the third coffee, the snack that was really just boredom. Its caffeine is gentler than coffee's, its catechins are the most-studied compounds in the beverage world, and served hot it slows your hands down at exactly the hours a cut feels hardest. Bottled sweetened versions are a different product entirely — the 1 kcal belongs to plain brewed leaves.",
      ar: "الشاي الأخضر هو المدخل الوحيد في هذه المكتبة عديم السعرات فعليًا — سعرة واحدة للكوب (240 جم) — ومعنى ذلك أنه يستحق مكانه بما يستبدله لا بما يضيفه: الشاي بالسكر، أو القهوة الثالثة، أو السناك الذي كان في الحقيقة مجرد ملل. كافيينه ألطف من كافيين القهوة، وكاتيكيناته أكثر المركبات المدروسة في عالم المشروبات، ومقدمًا ساخنًا يبطئ يديك في الساعات التي يصعب فيها التنشيف بالضبط. النسخ المعبأة المحلاة منتج مختلف تمامًا — فالسعرة الواحدة تخص الأوراق المنقوعة السادة.",
    },
    context: {
      en: {
        alternatives: "Black coffee is the zero-calorie classic with a harder caffeine hit; water with lemon when the goal is just hand-to-mouth ritual; diet soda when you specifically miss sweetness.",
        plan: "On a cut, schedule a hot cup at your two weakest hours (usually mid-afternoon and post-dinner) — it occupies the ritual slot for 1 kcal instead of the 150 kcal snack that usually fills it.",
        caution: "Sweetened bottled «green tea» drinks often carry 20-30 g of sugar per bottle; the 1 kcal figure on this page applies only to plain brewed tea.",
      },
      ar: {
        alternatives: "القهوة السوداء هي الكلاسيكية صفرية السعرات بضربة كافيين أقسى، والماء بالليمون حين يكون الهدف مجرد طقس اليد والفم، والصودا الدايت عندما تشتاق تحديدًا للحلاوة.",
        plan: "في التنشيف جدوِل كوبًا ساخنًا في ساعتَي ضعفك (عادة منتصف العشاء وما بعد العشاء) — فيشغل خانة الطقس بسعرة واحدة بدل سناك 150 سعرة يملؤها عادة.",
        caution: "مشروبات «الشاي الأخضر» المعبأة المحلاة تحمل غالبًا 20-30 جم سكرًا للزجاجة؛ فرقم السعرة الواحدة في هذه الصفحة يخص الشاي المنقوع السادة فقط.",
      },
    },
    faq: {
      en: [
        { q: "Does green tea have calories?", a: "Essentially none — 1 kcal per 240 g cup as measured in this database; whatever calories arrive in your cup come from the sugar or milk you add." },
        { q: "Does green tea help with fat loss?", a: "Not directly in any dose a human drinks — its real cutting value is behavioral: a warm, ritual-rich, near-zero-calorie replacement for the snacks and sweet drinks that actually carry calories." },
        { q: "How many cups a day is reasonable?", a: "Two to four brewed cups fits comfortably within normal caffeine limits for most adults; the constraint is caffeine and sleep, never the calories." },
      ],
      ar: [
        { q: "هل الشاي الأخضر فيه سعرات؟", a: "لا شيء يذكر — سعرة واحدة لكل كوب 240 جم كما هو مقيس في هذه القاعدة؛ وأي سعرات تصل كوبك تأتي من السكر أو الحليب الذي تضيفه." },
        { q: "هل الشاي الأخضر يساعد حرق الدهون؟", a: "ليس مباشرة بأي جرعة يشربها إنسان — قيمته الحقيقية في التنشيف سلوكية: بديل دافئ طقوسي شبه عديم السعرات للسناكات والمشروبات المحلاة التي تحمل السعرات فعلًا." },
        { q: "كم كوبًا يوميًا معقول؟", a: "كوبان إلى أربعة أكواب منقوعة يدخلون براحة ضمن حدود الكافيين الطبيعية لأغلب البالغين؛ والقيد هو الكافيين والنوم، لا السعرات أبدًا." },
      ],
    },
  },
};

/**
 * Enrichment lookup for a food slug — undefined means the slug is not in
 * an enriched batch yet (batches land frame by frame per the plan).
 * Server components call this and pass the result as a prop to
 * FoodDetailClient; the client renders nothing when absent.
 */
export function getFoodEnrichment(slug: string): FoodEnrichment | undefined {
  return FOODS_ENRICHMENT[slug];
}

