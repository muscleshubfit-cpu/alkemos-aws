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

  "lean-beef": {
    intro: {
      en: "Lean beef is the flavor anchor of a muscle-building kitchen: 26 g of protein and 12 g of fat for 217 kcal per 100 g, with zero carbohydrates. A 150 g piece delivers 39 g of protein — enough to carry the post-training meal of most lifters — while staying fatty enough to actually taste like a celebration. That balance is why it lives in gaining phases: it pushes calories up without the blandness that makes chicken-only diets collapse. Sear it hot and slice it against the grain.",
      ar: "اللحم البقري القليل الدهن هو مرساة النكهة في مطبخ بناء العضلات: 26 جم بروتين و12 جم دهون مقابل 217 سعرة لكل 100 جم وبلا كربوهيدرات. قطعة 150 جم تقدم 39 جم بروتين — ما يكفي لحمل وجبة ما بعد التدريب لأغلب الرياضيين — وتبقى دهينة بما يكفي لتشبه وجبة احتفالية فعلًا. هذا التوازن سبب حضورها في مراحل التضخيم: ترفع السعرات دون البهوت الذي يُسقط أنظمة الدجاج فقط. اطبخها على نار عالية وقطّعها عكس اتجاه الليف.",
    },
    context: {
      en: {
        alternatives: "Chicken breast is the leaner daily driver; lean ground beef is the same muscle-building package in a form that absorbs sauces; salmon adds omega-3 fats when the budget allows.",
        plan: "In a gaining phase, 150 g beside 200 g of rice and vegetables turns the post-workout window into a full meal. On a cut it still fits — just trade the rice for a large salad and keep the searing fat minimal.",
        caution: "The 217 kcal reference is for trimmed cooked meat; marbling, butter-based pan sauces, or restaurant cuts can quietly double the fat of the same plate.",
      },
      ar: {
        alternatives: "صدور الدجاج هي الحصان اليومي الأقل دهنًا، واللحم المفروم القليل الدهن الحزمة نفسها بصيغة تشرب الصوصات، والسلمون يضيف دهون أوميغا-3 حين تسمح الميزانية.",
        plan: "في مرحلة التضخيم اجعل 150 جم بجوار 200 جم أرز وخضار فتتحول نافذة ما بعد التمرين لوجبة كاملة. وفي التنشيف تبقى مناسبة — فقط استبدل الأرز بسلطة كبيرة وأبقِ دهن الطبخ عند حدها الأدنى.",
        caution: "مرجع 217 سعرة يخص اللحم المطبوخ المُنظّف من الشحوم؛ الرخاوة المرمرية أو صوصات الزبدة أو قطع المطاعم قد تضاعف دهون الطبق نفسه خلسة.",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in a 150 g piece of lean beef?", a: "About 39 g — from a single food item, with 326 kcal and 18 g of fat riding along; the per-100 g figure is 26 g of protein." },
        { q: "Is lean beef good for cutting?", a: "It fits, but it is not the most efficient choice — at 12 g of fat per 100 g it carries more calories per gram of protein than turkey breast or shrimp; keep portions moderate and sides lean." },
        { q: "Which cut should I buy?", a: "Eye of round, sirloin, and top round are the classic lean picks; whatever the cut, trimming visible fat before cooking keeps the plate close to this page's numbers." },
      ],
      ar: [
        { q: "كم بروتين في قطعة 150 جم من اللحم قليل الدهن؟", a: "نحو 39 جم — من طعام واحد، معها 326 سعرة و18 جم دهون؛ ورقم كل 100 جم هو 26 جم بروتين." },
        { q: "هل اللحم البقري قليل الدهن مناسب للتنشيف؟", a: "يدخل ضمن الخطة لكنه ليس الخيار الأكفأ — فبـ12 جم دهون لكل 100 جم يحمل سعرات أكثر لكل جرام بروتين من صدور الرومي أو الجمبري؛ فاعتدل بالحصص واجعل المرافقات خفيفة." },
        { q: "أي قطعة أشتري؟", a: "عين الروند والسرلوين وأعلى الروند هي الاختيارات القليلة الدهن الكلاسيكية؛ وأيًّا كانت القطعة، نزع الدهن الظاهر قبل الطبخ يُبقي الطبق قريبًا من أرقام هذه الصفحة." },
      ],
    },
  },

  "egg-whites": {
    intro: {
      en: "Egg whites are protein stripped to its essentials: 11 g of protein riding on just 52 kcal and 0.2 g of fat per 100 g. Four whites (120 g) pour 13 g of protein into a pan for 63 calories — no other whole food in this library lets you eat that much volume for that little energy. They are the rescue ration of contest prep and aggressive cuts, folded into omelets when whole eggs blow the fat budget. What you trade away is flavor and most of the egg's micronutrients, which live in the discarded yolk.",
      ar: "بياض البيض بروتين مُجرَّد إلى أساسياته: 11 جم بروتين فوق 52 سعرة و0.2 جم دهون فقط لكل 100 جم. أربعة بياضات (120 جم) تصب 13 جم بروتين في المقلاة مقابل 63 سعرة — لا طعام كامل آخر بهذه المكتبة يمنحك هذا الحجم بهذه الطاقة القليلة. هو حصة إنقاذ تجهيزات البطولات والتنشيف القاسي، تُطوى في العجة حين يفجّر الصفار ميزانية الدهون. وما تخسره هو النكهة وأغلب مغذيات البيض الدقيقة الساكنة في الصفار المرمي.",
    },
    context: {
      en: {
        alternatives: "Whole eggs give you the same protein with the flavor, fat and nutrients intact — each yolk costs about 55 kcal; liquid egg-white cartons are the no-cracking shortcut; shrimp offers similar leanness from the sea.",
        plan: "On a hard cut, a ten-white omelet with vegetables creates a massive pan of food for under 200 kcal. While gaining, mix one or two whole eggs into the whites — flavor and micronutrients return without flooding the calorie budget.",
        caution: "Raw whites from uncooked batter block biotin absorption and carry salmonella risk; the 52 kcal figure assumes cooked product, and meringue-style recipes undo the leanness with sugar.",
      },
      ar: {
        alternatives: "البيض الكامل يمنحك البروتين نفسه بنكهته ودهونه ومغذياته سليمة — كل صفار يكلف نحو 55 سعرة؛ وعبوات بياض البيض السائل اختصار بلا تكسير؛ والجمبري يقدم رشاقة مشابهة من البحر.",
        plan: "في التنشيف القاسي تصنع عجة من عشرة بياضات بالخضار كمية هائلة من الطعام بأقل من 200 سعرة. وفي التضخيم اخلط بيضة أو اثنتين كاملتين مع البياض — تعود النكهة والمغذيات دون إغراق ميزانية السعرات.",
        caution: "البياض النيء من الخليط غير المطبوخ يعيق امتصاص البيوتين ويحمل خطر السالمونيلا؛ ورقم 52 سعرة يفترض منتجًا مطبوخًا، ووصفات المرينغ تهدم الرشاقة بالسكر.",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in four egg whites?", a: "About 13 g across 120 g for just 63 kcal — the highest protein-per-calorie ratio of any animal food tracked in this database." },
        { q: "Are egg whites healthier than whole eggs?", a: "Not better, just leaner: the yolk holds the vitamins and half the protein, so whites are a tool for fat-budget control on cuts, not an upgrade for everyday eating." },
        { q: "Can I drink pasteurized liquid egg whites?", a: "Carton whites labeled pasteurized are safe to drink and behave identically in recipes; farm-fresh raw ones are not, and cooking costs you none of the protein." },
      ],
      ar: [
        { q: "كم بروتين في أربعة بياضات؟", a: "نحو 13 جم عبر 120 جم مقابل 63 سعرة فقط — أعلى نسبة بروتين لكل سعرة بين كل الأطعمة الحيوانية المسجلة في هذه القاعدة." },
        { q: "هل بياض البيض أصح من البيض الكامل؟", a: "ليس أفضل، بل أميل للرشاقة فقط: الصفار يحمل الفيتامينات ونصف البروتين، فالبياض أداة لضبط ميزانية الدهون في التنشيف لا ترقية للأكل اليومي." },
        { q: "هل أشرب بياض البيض السائل المُبستر؟", a: "العبوات الموسومة بالمُبستر آمنة للشرب وتتصرف بالوصفات تصرفًا مطابقًا؛ البيض الريفي النيء ليس كذلك، والطبخ لا يكلفك شيئًا من البروتين." },
      ],
    },
  },

  "turkey-breast": {
    intro: {
      en: "Turkey breast takes the chicken formula and trims it further: 30 g of protein against 135 kcal and a single gram of fat per 100 g. That fat figure — one gram — is the leanest this database records among whole-protein staples, which is why physique athletes rotate it in during the final weeks of a cut. The trade is real though: with almost no fat to baste it, it turns chalky fast, so brining or a quick high-heat sear is not optional. Ground versions make it burger night without breaking the deficit.",
      ar: "صدور الديك الرومي تأخذ معادلة الدجاج وتشذّبها أكثر: 30 جم بروتين مقابل 135 سعرة وجرام دهون واحد لكل 100 جم. رقم الدهون هذا — جرام واحد — هو الأقل الذي تسجله هذه القاعدة بين مصادر البروتين الكاملة، ولذلك يُدخلها رياضيو القوام في أسابيع التنشيف الأخيرة. لكن المقايضة حقيقية: بلا دهن يبلّلها تتحول طباشيرية سريعًا، فالنقع في محلول ملحي أو شواء سريع على حرارة عالية ليس رفاهية. والنسخ المفرومة تجعل منها ليلة برجر دون كسر العجز.",
    },
    context: {
      en: {
        alternatives: "Chicken breast is the closest everyday equivalent at 3.6 g fat; pork tenderloin matches its leanness with a different flavor; tofu covers the same slot for plant-based plans.",
        plan: "Treat it as the deficit-breaker: 200 g at dinner costs 270 kcal yet lands 60 g of protein. In a lean-gaining phase, drizzle olive oil over the sliced meat to re-add the fat flavor it lacks.",
        caution: "Many whole birds sold «self-basting» or kosher have been injected with salt solution — check labels, because that sodium can dwarf anything you would season with yourself.",
      },
      ar: {
        alternatives: "صدور الدجاج المكافئ اليومي الأقرب بـ3.6 جم دهون؛ ولحم التندرلوين يطابق رشاقته بنكهة مختلفة؛ والتوفو يملأ الخانة نفسها في الخطط النباتية.",
        plan: "عاملها كقاطعة العجز: 200 جم على العشاء تكلف 270 سعرة وتُهبط 60 جم بروتين. وفي التضخيم النظيف رشّ زيت زيتون فوق الشرائح لتعيد نكهة الدهن الغائبة عنها.",
        caution: "كثير من الطيور الكاملة المباعة «ذاتية الترطيب» أو المملحة محقونة بمحلول ملحي — اقرأ الملصقات، فذلك الصوديوم قد يبتلع أي تتبيل كنت ستصنعه بنفسك.",
      },
    },
    faq: {
      en: [
        { q: "Is turkey breast leaner than chicken?", a: "Yes — 1 g of fat per 100 g versus 3.6 g in chicken breast, at essentially the same 30 g protein level; the gap is small but real on deep cuts." },
        { q: "Why does my turkey always come out dry?", a: "It carries almost no fat to keep it moist, so it overcooks in minutes — pull it at the first sign of done, rest it covered, and slice against the grain." },
        { q: "Is deli turkey the same food?", a: "No — this page's 135 kcal belongs to plain cooked breast; processed slices add sodium, sugars and sometimes oils that change the numbers." },
      ],
      ar: [
        { q: "هل صدور الديك الرومي أقل دهنًا من الدجاج؟", a: "نعم — جرام دهن واحد لكل 100 جم مقابل 3.6 جم في صدور الدجاج، وعلى مستوى بروتين 30 جم نفسه تقريبًا؛ الفجوة صغيرة لكنها حقيقية في التنشيف العميق." },
        { q: "لماذا يخرج الرومي جافًا دائمًا؟", a: "لا يحمل دهنًا يكفي لإبقائه رطبًا فيتجاوز الطبخ في دقائق — ارفعه عند أول علامة نضج، واتركه مغطى يرتاح، وقطّع عكس الليف." },
        { q: "هل شرائح الرومي المعلبة الطعام نفسه؟", a: "لا — 135 سعرة بهذه الصفحة تخص الصدر المطبوخ السادة؛ الشرائح المصنعة تضيف صوديومًا وسكريات وأحيانًا زيوتًا تغير الأرقام." },
      ],
    },
  },

  "shrimp": {
    intro: {
      en: "Shrimp is nearly a pure protein delivery vehicle: 24 g of protein, 0.3 g of fat and 99 kcal per 100 g — a macro sheet that reads like a supplement label. The 150 g serving arrives at 148 kcal and 36 g of protein while taking under five minutes in a hot pan, which makes it the fastest real-food dinner in a cutting week. It plays neutral in almost every cuisine — garlic, chili, coconut milk, lemon — so flavor fatigue has no excuse. Its cholesterol content, feared for decades, no longer carries a limit in current guidance.",
      ar: "الجمبري شبه مركب توصيل بروتين صرف: 24 جم بروتين و0.3 جم دهون و99 سعرة لكل 100 جم — ورقة ماكروز تُقرأ كملصق مكمل غذائي. حصة 150 جم تصل بـ148 سعرة و36 جم بروتين وتحتاج أقل من خمس دقائق في مقلاة ساخنة، ما يجعلها أسرع عشاء طعام حقيقي في أسبوع تنشيف. وهو محايد في كل مطبخ تقريبًا — ثوم أو فلفل حار أو حليب جوز الهند أو ليمون — فلا عذر لإرهاق الحواس. رقم الكوليسترول أخاف الناس عقودًا؛ والإرشادات الغذائية الحالية لم تعد تعامله كسقف لأغلب البالغين.",
    },
    context: {
      en: {
        alternatives: "Tilapia is the budget fish swap with a similar lean profile; chicken breast covers the same macro slot on land; canned tuna wins when you need zero cooking.",
        plan: "Stir-fry 150 g with a bag of frozen vegetables and a splash of soy sauce for a plate that lands a third of your daily protein under 300 kcal. On gaining days, cook it in butter and serve over pasta.",
        caution: "Breaded fried shrimp and creamy restaurant sauces bury this leanness — the 99 kcal reference is for peeled, plain-cooked meat; frozen peeled raw is the cheapest honest format.",
      },
      ar: {
        alternatives: "البلطي بديل السمك الاقتصادي بملف رشيق مشابه؛ وصدور الدجاج تملأ خانة الماكرو نفسها على اليابسة؛ والتونة المعلبة تفوز حين تحتاج صفر طبخ.",
        plan: "قِلِ 150 جم مع كيس خضار مجمد ورشة صوص صويا لطبق يهبط بثلث بروتين يومك تحت 300 سعرة. وفي أيام التضخيم اطبخه بالزبدة وقدمه فوق الباستا.",
        caution: "الجمبري المغلف بالبقسماط المقلي وصوصات المطاعم الكريمية تدفن هذه الرشاقة — مرجع 99 سعرة يخص اللحم المقشر المطبوخ سادة؛ والمجمد المقشر الخام أرخص صيغة صادقة.",
      },
    },
    faq: {
      en: [
        { q: "How much protein in a 150 g shrimp serving?", a: "36 g, arriving with just 148 kcal and under half a gram of fat — one of the strongest protein-per-calorie trades in the entire library." },
        { q: "Is shrimp okay on keto?", a: "Yes — practically zero carbs, so it fits without adjustment; just watch what you cook it in, since butter and cream decide the meal's final macros." },
        { q: "Fresh or frozen shrimp?", a: "Unless you live beside the dock, frozen is genuinely fresher — it was locked at the harbor; thaw under cold water ten minutes before cooking." },
      ],
      ar: [
        { q: "كم بروتين في حصة جمبري 150 جم؟", a: "36 جم تصل مع 148 سعرة فقط وأقل من نصف جرام دهون — من أقوى صفقات البروتين لكل سعرة في المكتبة كلها." },
        { q: "هل الجمبري مسموح في الكيتو؟", a: "نعم — كربوهيدرات شبه معدومة فيدخل بلا تعديل؛ راقب فقط ما تطبخه به، فالزبدة والكريمة تحدد ماكرو الوجبة النهائي." },
        { q: "جمبري طازج أم مجمد؟", a: "إن لم تكن تسكن بجوار الميناء فالمجمد أكثر حداثة فعلًا — حُبس عند المرفأ؛ وذوّبه تحت ماء بارد عشر دقائق قبل الطبخ." },
      ],
    },
  },

  "tilapia": {
    intro: {
      en: "Tilapia is the workhorse white fish for anyone eating on a budget: 26 g of protein for 128 kcal and 3 g of fat per 100 g, at a price per kilo that usually undercuts every other animal protein on the counter. A 150 g fillet lands 39 g of protein for 192 kcal and cooks from raw to plate in about ten minutes. Its mild — critics say blank — flavor is actually the feature: it carries whatever marinade, spice rub or sauce you give it, so it never gets boring if your seasoning shelf is alive.",
      ar: "البلطي هو سمك أبيض الحصان العام لكل من يأكل بميزانية محدودة: 26 جم بروتين مقابل 128 سعرة و3 جم دهون لكل 100 جم، بسعر للكيلو يقلل عادة كل بروتين حيواني آخر على الطاولة. فيليه 150 جم يهبط بـ39 جم بروتين مقابل 192 سعرة ويُطهى من خام إلى طبق في نحو عشر دقائق. ونكهته المعتدلة — يقول النقاد الفارغة — هي الميزة فعلًا: يحمل أي تتبيلة أو بهارات جافة أو صوص تمنحه، فلا يمل أبدًا ما دام رفّ توابلك حيًا.",
    },
    context: {
      en: {
        alternatives: "Shrimp covers the same lean-fish slot at triple the price; canned tuna is the no-cook backup; chicken breast fills in for people who simply dislike fish.",
        plan: "Bake two fillets on Sunday with lemon and cumin and keep them for two days of lunches. During a bulk, a butter-and-garlic sauce over the same fillet adds two hundred easy calories without touching protein.",
        caution: "Fish-shop fried portions are a different food — batter soaks oil and multiplies calories; and because tilapia is farmed, sourcing matters more than with wild species.",
      },
      ar: {
        alternatives: "الجمبري يملأ خانة السمك الرشيق نفسها بثلاثة أضعاف السعر؛ والتونة المعلبة الاحتياطي بلا طبخ؛ وصدور الدجاج تسد لمن لا يحب السمك أصلًا.",
        plan: "اخبز فيليهين يوم الأحد بالليمون والكمون واحفظهما لغداء يومين. وفي التضخيم يضيف صوص الزبدة والثوم على الفيليه نفسه مئتي سعرة سهلة دون مساس البروتين.",
        caution: "حصص محلات السمك المقلية طعام آخر — البقسماط يشرب الزيت ويضاعف السعرات؛ ولأن البلطي مستزرَع فمصدره أهم مما هو عليه مع الأنواع البرية.",
      },
    },
    faq: {
      en: [
        { q: "Is tilapia a healthy protein?", a: "Per this database it delivers 26 g of protein at 128 kcal per 100 g with almost no saturated-fat load; its omega-3 content is modest next to salmon, which is a reason to rotate both." },
        { q: "How do I cook tilapia without it falling apart?", a: "Pat it dry, use a hot pan with a little oil, and flip once — the flesh is delicate, so breading or a gentle oven-bake protects it better than rough stirring." },
        { q: "How much tilapia per meal?", a: "One 150 g fillet is the designed serving — 192 kcal and 39 g of protein, a natural anchor for lunch on any plan." },
      ],
      ar: [
        { q: "هل البلطي بروتين صحي؟", a: "بحسب هذه القاعدة يقدم 26 جم بروتين عند 128 سعرة لكل 100 جم وبلا حمل دهون مشبعة يذكر؛ ومحتواه من أوميغا-3 متواضع أمام السلمون، وهذه سبب لتناوب الاثنين." },
        { q: "كيف أطبخ البلطي دون أن يتفتت؟", a: "جففه جيدًا، واستخدم مقلاة ساخنة بقليل من الزيت، واقلبه مرة واحدة — لحمه رقيق، فالتغليف أو الخبز الهادئ بالفرن يحميه أفضل من التقليب العنيف." },
        { q: "كم بلطي في الوجبة؟", a: "فيليه واحد 150 جم هو الحصة المصممة — 192 سعرة و39 جم بروتين، مرساة طبيعية لغداء أي خطة." },
      ],
    },
  },

  "ground-beef-lean": {
    intro: {
      en: "Lean ground beef is the shape-shifter of the protein shelf: 27 g of protein and 9 g of fat per 100 g at 193 kcal, in a form that becomes kebabs, pasta sauce, chili, stuffed peppers or burger patties within minutes. That versatility is worth real money on a repetitive diet — the number one reason people quit high-protein eating is boredom, and mince is the cheapest cure for it. The 150 g serving delivers 40 g of protein. Choose the 90-percent-lean packs; cheaper blends quietly add ten grams of fat you never taste but always pay for.",
      ar: "اللحم المفروم قليل الدهن متحوّل رف البروتين: 27 جم بروتين و9 جم دهون لكل 100 جم عند 193 سعرة، بصيغة تصبح كفتة أو صوص باستا أو تشيلي أو فلفلًا محشيًا أو أقراص برجر خلال دقائق. هذه المرونة تساوي مالًا حقيقيًا في نظام متكرر — السبب الأول لهجر الأكل عالي البروتين هو الملل، والمفروم أرخص علاج له. حصة 150 جم تقدم 40 جم بروتين. اختر عبوات اللحم الأقل دهنًا بنسبة تسعين بالمئة؛ فالخلطات الأرخص تضيف خلسة عشرة جرامات دهن لن تتذوقها أبدًا وستدفع ثمنها دائمًا.",
    },
    context: {
      en: {
        alternatives: "Beef sirloin slices for grilling nights; ground turkey runs leaner still; lentils give the same sauce-friendly texture for plant-based dinners.",
        plan: "Cook a 500 g pack at once and split it across three meals — taco night, pasta night and stuffed-vegetable night all flow from one pan. On a cut, drain the rendered fat before saucing.",
        caution: "The 9 g of fat per 100 g assumes a drained lean pack; regular mince and restaurant grinds can double that, and sauces built on cream erase the leanness entirely.",
      },
      ar: {
        alternatives: "شرائح سرلوين البقر لليالي الشواء؛ والرومي المفروم أميل للرشاقة بعيدًا؛ والعدس يمنح القوام الصوصي نفسه لعشائات نباتية.",
        plan: "اطبخ عبوة 500 جم دفعة واحدة وقسمها على ثلاث وجبات — ليلة التاكو وليلة الباستا وليلة الخضار المحشي كلها تتدفق من مقلاة واحدة. وفي التنشيف صفِّ الدهن المُنصهر قبل الصوص.",
        caution: "9 جم دهون لكل 100 جم تفترض عبوة قليلة الدهن مصفاة؛ المفروم العادي وخلطات المطاعم قد تضاعفها، والصوصات القائمة على الكريمة تمحو الرشاقة تمامًا.",
      },
    },
    faq: {
      en: [
        { q: "How much protein in 150 g of lean ground beef?", a: "About 40 g for 290 kcal — one of the best protein-per-money trades at the butcher counter." },
        { q: "Should I rinse cooked ground beef?", a: "Draining on paper towels removes a useful share of the rendered fat on deep cuts; rinsing with water washes flavor away too — most cooks should simply buy a leaner blend." },
        { q: "Is it okay to eat red meat twice a day?", a: "It fits the macros, but variety is the safer habit — rotate with fish, poultry and legumes across the week rather than leaning on any single protein." },
      ],
      ar: [
        { q: "كم بروتين في 150 جم لحمًا مفرومًا قليل الدهن؟", a: "نحو 40 جم مقابل 290 سعرة — من أفضل صفقات البروتين مقابل المال على طاولة الجزار." },
        { q: "هل أغسل اللحم المفروم بعد الطبخ؟", a: "التصفية على مناديل الورق تزيل حصة مفيدة من الدهن المنصهر في التنشيف العميق؛ والغسل بالماء يجرف النكهة معه — على أغلب الطباخين ببساطة شراء خلطة أقل دهنًا." },
        { q: "هل يصح أكل اللحم الأحمر مرتين يوميًا؟", a: "يدخل ضمن الماكروز، لكن التنويع عادة أأمن — بدّل مع السمك والدواجن والبقوليات عبر الأسبوع بدل الاتكاء على بروتين واحد." },
      ],
    },
  },

  "pork-tenderloin": {
    intro: {
      en: "Pork tenderloin is the cut nobody expects to be lean: 26 g of protein and only 3.5 g of fat for 143 kcal per 100 g — numbers that stand next to chicken breast while wearing a completely different flavor. A 150 g roast serving brings 39 g of protein home for 215 kcal. It roasts whole in twenty-five minutes, slices neatly for meal-prep containers, and takes sweet, smoky and herby marinades equally well. For anyone tired of the chicken-and-turkey rotation, this is the cheapest escape route that doesn't cost a single macro.",
      ar: "لحم التندرلوين هو القطعة التي لا أحد يتوقع أن تكون قليلة الدهن: 26 جم بروتين و3.5 جم دهون فقط مقابل 143 سعرة لكل 100 جم — أرقام تقف بجوار صدور الدجاج بنكهة مختلفة تمامًا. حصة مشوية 150 جم تحضر 39 جم بروتين إلى البيت مقابل 215 سعرة. تُشوى كاملة في خمس وعشرين دقيقة، وتُقطع بشكل أنيق لحاويات تحضير الوجبات، وتستقبل التتبيلات الحلوة والمدخنة والعشبية بالتساوي. ولكل من سئم دورة الدجاج والرومي، هذا أرخص طريق هروب لا يكلف ماكرو واحدًا.",
    },
    context: {
      en: {
        alternatives: "Chicken and turkey breast remain the reference leans; beef sirloin adds a bolder flavor at higher calories; tofu takes the slot on meatless days.",
        plan: "Roast one tenderloin on Sunday, slice it thin, and you have sandwich protein plus two salads for the first half of the week. During gaining phases, pair it with rice and a walnut-olive oil dressing.",
        caution: "Do not confuse tenderloin with pork loin — the loin is a bigger, fattier roast with different numbers; and packaged «flavored» loins often carry sugary injections.",
      },
      ar: {
        alternatives: "الدجاج والرومي يبقيان المرجعين الرشيقين؛ وسرلوين البقر يضيف نكهة أجرأ بسعرات أعلى؛ والتوفو يأخذ الخانة في أيام اللحوم.",
        plan: "اشوِ تندرلوين واحدًا يوم الأحد وقطّعه رقيقًا، فتحصل على بروتين ساندويتش وسلطتين للنصف الأول من الأسبوع. وفي مراحل التضخيم رافقه بالأرز وصلصة الجوز وزيت الزيتون.",
        caution: "لا تخلط بين التندرلوين ولحم الخاصرة — الخاصرة مشوية أكبر وأدهن بأرقام مختلفة؛ وعبوات «المنكّهة» تحمل غالبًا حقنًا سكرية.",
      },
    },
    faq: {
      en: [
        { q: "Is pork tenderloin actually lean?", a: "Yes — 3.5 g of fat and 143 kcal per 100 g put it shoulder to shoulder with chicken breast; it is among the leanest cuts of any animal in this library." },
        { q: "What's the best way to cook it without drying?", a: "Sear the outside hard, finish in a hot oven to the first sign of done, then rest under foil ten minutes — its small fat margin forgives nothing." },
        { q: "How much protein in a tenderloin serving?", a: "A 150 g serving carries about 39 g of protein for 215 kcal — a full anchor for any meal of the day." },
      ],
      ar: [
        { q: "هل التندرلوين قليل الدهن فعلًا؟", a: "نعم — 3.5 جم دهون و143 سعرة لكل 100 جم تضعه كتفًا بكتف مع صدور الدجاج؛ وهو من أرشق قطع أي حيوان بهذه المكتبة." },
        { q: "ما أفضل طريقة لطبخه دون جفاف؟", a: "حمّر السطح بعنف، وأكمله في فرن ساخن حتى أول علامة نضج، ثم اتركه مغطى بورق قصدير عشر دقائق — هامش دهونه الصغير لا يغفر شيئًا." },
        { q: "كم بروتين في حصة تندرلوين؟", a: "حصة 150 جم تحمل نحو 39 جم بروتين مقابل 215 سعرة — مرساة كاملة لأي وجبة في اليوم." },
      ],
    },
  },

  "tofu": {
    intro: {
      en: "Tofu is the plant protein that behaves like food rather than a supplement: 17 g of protein, 9 g of fat and 3 g of carbs for 144 kcal per 100 g — a complete amino-acid profile from soy, the only common plant source that can claim that. Its magic is textural: press it firm and it sears into something meaty; crumble it and it becomes scramble; blend silken styles into sauces and desserts. Flavor-wise it arrives as a blank canvas that drinks up marinades within minutes. For mixed diets it is the cheapest way to skip the meat.",
      ar: "التوفو هو البروتين النباتي الذي يتصرف كطعام لا كمكمل: 17 جم بروتين و9 جم دهون و3 جم كربوهيدرات مقابل 144 سعرة لكل 100 جم — بروفايل أحماض أمينية كامل من الصويا، المصدر النباتي الشائع الوحيد القادر على ذلك. سحره في القوام: اضغطه فيتشوى شيئًا يشبه اللحم، وفّته فيصبح بيضًا مقليًا نباتيًا، واخفق الأنواع الحريرية في الصوصات والحلويات. وفي النكهة يصل لوحة فارغة تشرب التتبيلات خلال دقائق. وللأنظمة المختلطة هو أرخص طريقة لتعليم ليلة اللحم تخطي اللحم.",
    },
    context: {
      en: {
        alternatives: "Lentils and chickpeas carry protein with fiber but no complete profile; tempeh is the fermented, nuttier sibling; a scoop of soy or pea protein fills the gap in shakes.",
        plan: "Press firm tofu twenty minutes, cube it, and stir-fry with vegetables for a 200 g plate at 288 kcal and 34 g of protein. On gaining days, toss those cubes in cornstarch before frying for extra crunch and calories.",
        caution: "The 144 kcal belongs to plain firm tofu; pre-marinated and fried varieties from the store can run double, and silken styles behave like a different food entirely.",
      },
      ar: {
        alternatives: "العدس والحمص يحملان البروتين مع الألياف بلا اكتمال؛ والتيمبه الشقيق المخمر أميز جوزًا؛ ومغرفة بروتين الصويا أو البازلاء تسد الفجوة في المشروبات.",
        plan: "اضغط التوفو الصلب عشرين دقيقة وقطّعه مكعبات وقِلِه بالخضار لطبق 200 جم عند 288 سعرة و34 جم بروتين. وفي أيام التضخيم غلف تلك المكعبات بالنشا قبل القلي لمقرمشية وسعرات إضافية.",
        caution: "144 سعرة تخص التوفو الصلب السادة؛ الأنواع المتبلة مسبقًا والمقلية من المتجر قد تصل للضعف، والأنواع الحريرية تتصرف كطعام مختلف كليًا.",
      },
    },
    faq: {
      en: [
        { q: "Is tofu a complete protein?", a: "Yes — soy provides all essential amino acids, which is rare for plants; its 17 g per 100 g sits between meat and legumes." },
        { q: "How do I make tofu taste like something?", a: "Press out the water, then marinate in something strong — soy, garlic, smoked paprika — for at least fifteen minutes before searing in a genuinely hot pan." },
        { q: "How much tofu equals a chicken breast?", a: "Roughly 270 g of firm tofu matches the 46 g of protein in a 150 g cooked chicken breast — at about 389 kcal versus the breast's 248." },
      ],
      ar: [
        { q: "هل التوفو بروتين كامل؟", a: "نعم — الصويا توفر كل الأحماض الأمينية الأساسية، وهي حالة نادرة بين النباتات؛ و17 جم لكل 100 جم تجلس بين اللحوم والبقوليات." },
        { q: "كيف أجعل للتوفو طعمًا؟", a: "اعصر الماء منه ثم تبّله بشيء قوي — صويا أو ثومًا أو بابريكا مدخنة — خمس عشرة دقيقة على الأقل قبل تحميره في مقلاة ساخنة حقًا." },
        { q: "كم توفو يعادل صدر دجاج؟", a: "نحو 270 جم من التوفو الصلب تعادل 46 جم بروتين في صدر دجاج مطبوخ 150 جم — بنحو 389 سعرة مقابل 248 للصدر." },
      ],
    },
  },

  "brown-rice": {
    intro: {
      en: "Brown rice is white rice with its jacket still on: 123 kcal and 26 g of carbs per 100 g cooked, plus 1.8 g of fiber and a measurable magnesium dose that the polished grain loses in milling. The bran layer makes it chew nuttier, cook twenty minutes longer, and release its energy steadier through a long afternoon. A 150 g cup makes the quiet base under any stir-fry or stew. It is not magic — the calorie gap versus white rice is small — it is simply the whole version of the world's most eaten grain.",
      ar: "الأرز البني هو الأرز الأبيض وما زالت سترته عليه: 123 سعرة و26 جم كربوهيدرات لكل 100 جم مطبوخ، مع 1.8 جم ألياف وجرعة مغنيسيوم ملموسة يفقدها الحب المصقول أثناء الطحن. طبقة النخاع سبب مضغه الجوزي، وسبب احتياجه عشرين دقيقة إضافية في الحلة، وسبب تثبيته طاقتك عبر ظهيرة طويلة بدل دفعها فجأة للأعلى. كوب 150 جم يشكل القاعدة الهادئة تحت أي طبخ مقلي أو يخنة. وهو ليس سحرًا — فجوة سعراته مقابل الأبيض صغيرة — إنه ببساطة النسخة الكاملة لأكثر حبوب الأرض أكلًا.",
    },
    context: {
      en: {
        alternatives: "White rice digests faster around hard training days; quinoa brings more protein per cup; riced cauliflower simulates the fork-feel at a fraction of the carbs.",
        plan: "Batch-cook one pot on Sunday — it holds four days refrigerated. Around training, 150 g under chicken and olive oil is the standard builder plate; on rest days keep the portion at half a cup.",
        caution: "The chewier the better is not the rule — undercooked bran is genuinely hard to digest; and rice left warm for hours carries Bacillus risk, so cool leftovers fast.",
      },
      ar: {
        alternatives: "الأرز الأبيض يُهضم أسرع حول أيام التدريب الشاق؛ والكينوا تجلب بروتينًا أكثر لكل كوب؛ وقرنبيط المبروش يحاكي إحساس الشوكة بجزء يسير من الكربوهيدرات.",
        plan: "اطبخ حلة واحدة يوم الأحد — تصمد أربعة أيام بالثلاجة. حول التدريب، 150 جم تحت الدجاج وزيت الزيتون هي طبق البناء القياسي؛ وفي أيام الراحة اجعل الحصة نصف كوب.",
        caution: "ليست القاعدة «كلما ازداد قسوة كان أفضل» — النخاع غير المطبوخ جيدًا عسر الهضم حقًا؛ والأرز المتروك دافئًا ساعات يحمل خطر الباسيلوس، فبرّد البقايا سريعًا.",
      },
    },
    faq: {
      en: [
        { q: "Is brown rice much better than white for fat loss?", a: "The difference is modest — 123 versus 130 kcal per 100 g cooked — the real gains are 1.8 g of fiber and steadier hunger, not a calorie miracle." },
        { q: "Why does brown rice take so long to cook?", a: "The bran and germ slow water entry — about 40 minutes on the stove, or 20 with pre-soaking; a pressure cooker cuts it further." },
        { q: "How many calories in a cup of brown rice?", a: "About 185 for a 150 g cooked cup, carrying 40 g of carbs, 4 g of protein and almost no fat." },
      ],
      ar: [
        { q: "هل الأرز البني أفضل بكثير من الأبيض لخسارة الدهون؟", a: "الفرق متواضع — 123 مقابل 130 سعرة لكل 100 جم مطبوخ — المكاسب الحقيقية 1.8 جم ألياف وجوع أثبت، لا معجزة سعرات." },
        { q: "لماذا يحتاج الأرز البني وقتًا طويلًا للطبخ؟", a: "النخاع والجنين يبطئان دخول الماء — نحو 40 دقيقة على الموقد، أو 20 مع نقع مسبق؛ وإناء الضغط يقصها أكثر." },
        { q: "كم سعرة في كوب أرز بني؟", a: "نحو 185 لكوب مطبوخ 150 جم، يحمل 40 جم كربوهيدرات و4 جم بروتين وبلا دهون تقريبًا." },
      ],
    },
  },

  "potato": {
    intro: {
      en: "The ordinary potato is the most underrated food in bodybuilding kitchens: 77 kcal, 17 g of carbs and 2.2 g of fiber per 100 g — an energy density so low that large, filling portions cost almost nothing. It also tops classic satiety research, beating rice, pasta and bread by a wide margin in how full people report feeling per calorie. A medium 150 g baked potato is 115 kcal; the same weight of cooked pasta is 237. What ruins its reputation is the company it keeps — oil, cheese and deep fryers — not the tuber itself.",
      ar: "البطاطس العادية هي الطعام الأكثر بخسًا في مطابخ كمال الأجسام: 77 سعرة و17 جم كربوهيدرات و2.2 جم ألياف لكل 100 جم — كثافة طاقة منخفضة حد أن الحصص الكبيرة المُشبعة لا تكلف شيئًا تقريبًا. وهي أيضًا تتقدم أبحاث الشبع الكلاسيكية، متفوقة على الأرز والباستا والخبز بهامش واسع في إحساس الناس بالامتلاء لكل سعرة. حبة متوسطة 150 جم مشوية هي 115 سعرة؛ والوزن نفسه من الباستا المطبوخة 237. ما يدمّر سمعتها هو رفقاؤها — الزيت والجبن والمقالي — لا الدرنة نفسها.",
    },
    context: {
      en: {
        alternatives: "Sweet potato is the orange sibling with a different micronutrient story; rice and pasta carry similar carbs at higher density; cauliflower florets roast into a low-carb side.",
        plan: "Bake four on Sunday for the week's lunches — they reheat well. On a cut, a 300 g potato plate with cottage cheese feels like a feast for 330 kcal; while gaining, mash them with milk and butter.",
        caution: "Frying multiplies calories nearly threefold and restaurant mash hides cream and butter; also, green-tinged skin signals solanine — cut it away deeply.",
      },
      ar: {
        alternatives: "البطاطا الحلوة الشقيقة البرتقالية بقصة مغذيات مختلفة؛ والأرز والباستا يحملان الكربوهيدرات المشابهة بكثافة أعلى؛ وزهرات القرنبيط تُشوى كطبق جانبي قليل الكربوهيدرات.",
        plan: "اخبز أربعًا يوم الأحد لغداءات الأسبوع — تُعاد تسخينها جيدًا. في التنشيف، طبق بطاطس 300 جم مع الجبن القريش يشبه وليمة بـ330 سعرة؛ وفي التضخيم اهرسها بالحليب والزبدة.",
        caution: "القلي يضاعف السعرات قرابة ثلاث مرات ومهروس المطاعم يخفي كريمة وزبدة؛ وأيضًا الجلد المخضرّ يشير إلى السولانين — قصّه بعمق.",
      },
    },
    faq: {
      en: [
        { q: "Are potatoes good for weight loss?", a: "Yes, with plain preparation — at 77 kcal per 100 g with top-tier satiety they let you eat volume; the moment they meet the fryer the story inverts." },
        { q: "Potato or rice for bulking?", a: "Rice wins on calories-per-bite and digestion speed around training; potatoes win on fullness — most gaining plans use rice near workouts and potatoes at dinner." },
        { q: "How many calories in a medium potato?", a: "A 150 g medium bake runs about 115 kcal with 26 g of carbs — before any topping arrives." },
      ],
      ar: [
        { q: "هل البطاطس جيدة لخسارة الوزن؟", a: "نعم مع تحضير سادة — عند 77 سعرة لكل 100 جم وبشبع من الطراز الأول تتيح لك أكل الحجم؛ وما أن تلتقِ المقلي حتى تنعكس الحكاية." },
        { q: "بطاطس أم أرز للتضخيم؟", a: "الأرز يفوز بالسعرات لكل لقمة وسرعة الهضم حول التدريب؛ والبطاطس تفوز بالامتلاء — أغلب خطط التضخيم تستخدم الأرز قرب التمرين والبطاطس على العشاء." },
        { q: "كم سعرة في حبة بطاطس متوسطة؟", a: "حبة مشوية متوسطة 150 جم تجري نحو 115 سعرة مع 26 جم كربوهيدرات — قبل وصول أي إضافة." },
      ],
    },
  },

  "whole-wheat-bread": {
    intro: {
      en: "Whole wheat bread is the carb that keeps a normal life running: 247 kcal per 100 g sounds high until you remember a slice is 30 g — 74 kcal, 12 g of carbs and a genuine 2.1 g of fiber, with 3.9 g of protein from the wheat itself. That fiber-plus-protein pairing separates it from white loaves: steadier on hunger, gentler on blood sugar. Two slices with peanut butter is the training-day breakfast that needs no stove, no pan and no plan. Read labels anyway — «wheat bread» without the word whole is white flour in a tan coat.",
      ar: "الخبز الأسمر هو الكربوهيدرات الذي يُبقي الحياة الطبيعية دائرة: 247 سعرة لكل 100 جم تبدو مرتفعة حتى تتذكر أن الشريحة 30 جم — 74 سعرة و12 جم كربوهيدرات و2.1 جم ألياف حقيقية، مع 3.9 جم بروتين من القمح نفسه. اقتران الألياف بالبروتين هذا هو ما يفصله عن أرغفة الساندويتش الأبيض: أثبت على الجوع وألطف على سكر الدم. شريحتان بزبدة الفول السوداني هما فطور يوم التدريب الذي لا يحتاج موقدًا ولا مقلاة ولا خطة. واقرأ الملصقات رغم ذلك — «خبز القمح» بلا كلمة الأسمر الكامل هو دقيق أبيض بمعطف أسمر.",
    },
    context: {
      en: {
        alternatives: "Rice cakes are the lower-calorie carrier; oatmeal serves the same morning slot warm; whole-grain pita opens the door for Mediterranean fillings.",
        plan: "Pre-training, bread's fast carbs are a feature: two slices with honey sixty minutes before lifting. On cuts, one slice as the burger bun halves the carb cost of the meal.",
        caution: "Portion drift is the real risk — toast points disappear two at a time, and jam or chocolate spread turns 74 kcal into 200 before the egg arrives.",
      },
      ar: {
        alternatives: "كيك الأرز الحامل الأقل سعرات؛ والشوفان يخدم خانة الصباح نفسها ساخنًا؛ وخبز البيتا الكامل يفتح الباب لحشوات المتوسط.",
        plan: "قبل التدريب، سرعة كربوهيدرات الخبز ميزة: شريحتان بالعسل قبل الرفع بستين دقيقة. وفي التنشيف، شريحة واحدة كغطاء البرجر تنصف كلفة الكربوهيدرات.",
        caution: "انجراف الحصص هو الخطر الحقيقي — شرائح التوست تختفي اثنتين اثنتين، والمربى أو الشوكولاتة القابلة للدهن تحول 74 سعرة إلى 200 قبل وصول البيضة.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a slice of whole wheat bread?", a: "About 74 for a 30 g slice, with 12 g of carbs, 2 g of fiber and 4 g of protein — numbers worth checking per brand, since slice weights wander." },
        { q: "Is whole wheat bread okay on a cut?", a: "Yes in counted slices — the fiber keeps hunger civil; the failure mode is uncounted grazing, never the bread chemistry itself." },
        { q: "What does «whole» mean on the label?", a: "The flour retains bran and germ; if the ingredient list says enriched or just wheat flour, the fiber was milled away and added back only partly." },
      ],
      ar: [
        { q: "كم سعرة في شريحة خبز أسمر؟", a: "نحو 74 لشريحة 30 جم، مع 12 جم كربوهيدرات و2 جم ألياف و4 جم بروتين — أرقام تستحق التحقق لكل علامة، فأوزان الشرائح تترحل." },
        { q: "هل الخبز الأسمر مسموح في التنشيف؟", a: "نعم بشرائح معدودة — الألياف تُبقي الجوع مهذبًا؛ وطريقة الفشل هي الرعي غير المحسوب، لا كيمياء الخبز نفسها أبدًا." },
        { q: "ماذا تعني كلمة «أسمر كامل» على الملصق؟", a: "أن الدقيق أبقى على النخاع والجنين؛ فإن قائمة المكونات تقول مُدعّم أو دقيق قمح فحسب، فالألياف طُحنت وأُعيد جزء منها فقط." },
      ],
    },
  },

  "pasta": {
    intro: {
      en: "Pasta is the reason Italian kitchens never feared carbs, and neither should you: 158 kcal and 31 g of carbohydrates per 100 g cooked — a figure that surprises everyone who assumed the plate was heavier. A one-cup 140 g serving is 221 kcal before sauce, and its dense chew makes it feel like far more. Cooked al dente it digests slowly enough to keep energy even through evening training. The calorie trouble never lived in the noodles; it lives in the cream, the parmesan snowfall and the garlic bread beside them.",
      ar: "الباستا سبب ألا تخاف المطابخ الإيطالية الكربوهيدرات، وألا تخاف أنت: 158 سعرة و31 جم كربوهيدرات لكل 100 جم مطبوخ — رقم يفاجئ كل من ظن الطبق أثقل. حصة الكوب الواحد 140 جم هي 221 سعرة قبل الصوص، ومضغها الكثيف يجعلها تبدو أكثر بكثير. ومطبوخة سنجد تهضم ببطء يكفي لإبقاء الطاقة متساوية عبر تدريب المساء. مشكلة السعرات لم تسكن النودلز أبدًا؛ بل تسكن الكريمة وتساقط البارميزان الثلجي وخبز الثوم بجوارها.",
    },
    context: {
      en: {
        alternatives: "Couscous cooks in five minutes for the same job; rice fits Asian-leaning plates; lentil or chickpea pasta doubles the protein at a texture cost.",
        plan: "Post-workout, 140 g with tomato sauce and lean beef hits the recovery window at moderate calories. On gaining days, add olive oil and grated cheese freely — the base is cheap fuel.",
        caution: "Restaurant portions run 250-300 g dry — triple a home serving — and creamy sauces can carry more calories than the noodles themselves; order tomato-based when eating out.",
      },
      ar: {
        alternatives: "الكسكس يُطهى في خمس دقائق للوظيفة نفسها؛ والأرز يناسب الأطباق الآسيوية؛ وباستا العدس أو الحمص تضاعف البروتين بكلفة قوام.",
        plan: "بعد التمرين، 140 جم بصوص الطماطم واللحم قليل الدهن تصيب نافذة الاستشفاء بسعرات معتدلة. وفي أيام التضخيم أضف زيت الزيتون والجبن المبشور بحرية — القاعدة وقود رخيص.",
        caution: "حصص المطاعم تجري 250-300 جم جافًا — ثلاثة أضعاف حصة المنزل — والصوصات الكريمية قد تحمل سعرات أكثر من النودلز نفسها؛ اطلب الطماطمية عند الأكل بالخارج.",
      },
    },
    faq: {
      en: [
        { q: "What does one cup of cooked pasta cost calorically?", a: "About 221 kcal for 140 g, with 43 g of carbs and 8 g of protein; the dry weight on the box is roughly half the cooked weight." },
        { q: "Does pasta have protein?", a: "A modest 5.8 g per 100 g cooked — meaningful but never the main event; pairing it with meat sauce or shrimp is what makes the plate anabolic." },
        { q: "Is pasta bad for cutting?", a: "Not in weighed portions — a 140 g cup fits most plans; it is the unmeasured family pot and the oil-heavy sauces that break deficits." },
      ],
      ar: [
        { q: "كم تكلف سعريًا حصة كوب واحد من الباستا المطبوخة؟", a: "نحو 221 سعرة لـ140 جم، مع 43 جم كربوهيدرات و8 جم بروتين؛ والوزن الجاف على العلبة قرابة نصف الوزن المطبوخ." },
        { q: "هل في الباستا بروتين؟", a: "5.8 جم متواضعة لكل 100 جم مطبوخ — مؤثرة لكنها ليست الحدث الرئيسي أبدًا؛ فاقترانها بصوص اللحم أو الجمبري هو ما يجعل الطبق بنّاءً." },
        { q: "هل الباستا سيئة للتنشيف؟", a: "ليست كذلك بحصص موزونة — كوب 140 جم يدخل أغلب الخطط؛ الفشل من حلة العائلة غير المقاسة والصوصات الغارقة بالزيت." },
      ],
    },
  },

  "quinoa": {
    intro: {
      en: "Quinoa is the seed that grocery shelves file with grains, and the only one of them carrying a complete protein: 4.4 g of it per 100 g cooked, alongside 21 g of carbs, 2.8 g of fiber and 120 kcal. That completeness — every essential amino acid from a plant — plus a quick fifteen-minute cook made it the base layer of vegetarian meal prep everywhere. Its texture pops, its flavor is faintly grassy, and a 185 g cup fluffs up enough to anchor grain bowls, stuffed peppers or a curry bed without stealing the show.",
      ar: "الكينوا بذرة تصنفها أرفف البقالة مع الحبوب، وهي الوحيدة بينها الحاملة لبروتين كامل: 4.4 جم منه لكل 100 جم مطبوخ، إلى جانب 21 جم كربوهيدرات و2.8 جم ألياف و120 سعرة. هذا الاكتمال — كل حمض أميني أساسي من نبتة — مع طبخ خمس عشرة دقيقة سريع جعلها طبقة الأساس لتحضير الوجبات النباتية في كل مكان. قوامها يفرقع، ونكهتها عشبية خفيفة، وكوب 185 جم ينتفخ بما يكفي لحمل أطباق الحبوب أو الفلفل المحشي أو فراش الكاري دون سرقة المشهد.",
    },
    context: {
      en: {
        alternatives: "Brown rice plays the same base role cheaper; couscous is the faster cousin; lentils double the protein but behave like a stew rather than a bed.",
        plan: "Cook a big pot in broth instead of water — flavor for free. One cup under beans and vegetables is a complete vegan dinner; athletes in gaining phases stir in olive oil and seeds.",
        caution: "Unrinsed quinoa tastes soapy — the saponin coating must wash off before cooking; and its 120 kcal sits close to rice, so it is a quality upgrade, not a calorie cut.",
      },
      ar: {
        alternatives: "الأرز البني يلعب دور الأساس نفسه بأرخص؛ والكسكس ابن العم الأسرع؛ والعدس يضاعف البروتين لكنه يتصرف كيخنة لا كفراش.",
        plan: "اطبخ حلة كبيرة بمرق بدل الماء — نكهة بلا ثمن. كوب واحد تحت البقول والخضار عشاء نباتي كامل؛ ولاعبو مراحل التضخيم يخفقون فيه زيت زيتون وبذورًا.",
        caution: "الكينوا غير المغسولة طعمها صابوني — غلاف السابونين يجب أن يُغسل قبل الطبخ؛ و120 سعرة تجلس قرب الأرز، فهي ترقية جودة لا خفض سعرات.",
      },
    },
    faq: {
      en: [
        { q: "Is quinoa a complete protein?", a: "Yes — it carries all nine essential amino acids, which no common grain does; with 4.4 g per cooked 100 g it supports, but never replaces, a protein scoop." },
        { q: "Quinoa or rice for meal prep?", a: "Quinoa if the pot feeds vegetarians or you want the amino profile; rice when calories-per-bite matter most — the two cost almost the same per cup." },
        { q: "How much cooked quinoa does one dry cup make?", a: "About three cups — 185 g each at 120 kcal, so one dry cup feeds a family dinner or four meal-prep boxes." },
      ],
      ar: [
        { q: "هل الكينوا بروتين كامل؟", a: "نعم — تحمل الأحماض الأمينية الأساسية التسعة، ولا حبة شائعة تفعلها؛ وبـ4.4 جم لكل 100 جم مطبوخ تسند مغرفة البروتين ولا تحل محلها أبدًا." },
        { q: "كينوا أم أرز لتحضير الوجبات؟", a: "الكينوا إن كانت الحلة تطعم نباتيين أو أردت البروفايل الأميني؛ والأرز حين تهم السعرات لكل لقمة — الاثنان يكلفان الشيء نفسه تقريبًا لكل كوب." },
        { q: "كم كوب كينوا مطبوخة يصنع كوب جاف واحد؟", a: "نحو ثلاثة أكواب — 185 جم لكل منها عند 120 سعرة، فكوب جاف واحد يطعم عشاء أسرة أو أربعة صناديق وجبات." },
      ],
    },
  },

  "couscous": {
    intro: {
      en: "Couscous is the fastest starch in the pantry: pour boiling water over it, cover, five minutes, done — 112 kcal and 23 g of carbs per 100 g cooked, with 3.8 g of protein riding along. Technically a pasta — tiny durum semolina beads — it eats like a grain and takes seasoning beautifully: lemon, herbs and olive oil disappear into it instantly. A 157 g cup makes the bed under chickpea stews and grilled fish across an entire region of North Africa, for good reason. For meal prep in a hurry, nothing else fills the carb slot this fast.",
      ar: "الكسكس أسرع نشويات في الخزانة: صب عليه ماءً مغليًا وغطِّه خمس دقائق وانتهى — 112 سعرة و23 جم كربوهيدرات لكل 100 جم مطبوخ، مع 3.8 جم بروتين مرافق. هو تقنيًا باستا — خرزات سيمولينا قمح قاسي دقيقة — لكنه يُؤكل كحبة ويستقبل التتبيل بالطريقة التي تتمناها الأرز: الليمون والأعشاب وزيت الزيتون تختفي فيه فورًا. كوب 157 جم يفرش الأساس تحت يخنات الحمص والسمك المشوي عبر إقليم كامل من شمال أفريقيا، لسبب وجيه. لتحضير الوجبات على عجل، لا شيء آخر يملأ خانة الكربوهيدرات بهذه السرعة.",
    },
    context: {
      en: {
        alternatives: "Quinoa offers the complete-protein upgrade at the same speed; rice is the universal fallback; bulgur keeps more fiber if you can find it.",
        plan: "Weeknight template: couscous, canned chickpeas, cucumber, tomato, lemon — a 500 kcal dinner in ten minutes. Post-training, stir honey and milk into the leftovers for a gaining bowl.",
        caution: "It is easy to overshoot — the dry cup triples in volume, so weigh before hydration; and instant cups with seasoning sachets often carry a full day of salt.",
      },
      ar: {
        alternatives: "الكينوا ترقية البروتين الكامل بالسرعة نفسها؛ والأرز الملاذ الشامل؛ والبرغل يحفظ أليافًا أكثر إن وجدته.",
        plan: "قالب ليلة الأسبوع: كسكس وحمص معلب وخيار وطماطم وليمون — عشاء 500 سعرة في عشر دقائق. وبعد التمرين اخفق العسل والحليب في البقايا لوعاء تضخيم.",
        caution: "من السهل تجاوز الحصة — الكوب الجاف يتضاعف حجمه ثلاثًا، فزن قبل الترطيب؛ وأكواب التحضير السريع بأكياس التوابل تحمل غالبًا ملح يوم كامل.",
      },
    },
    faq: {
      en: [
        { q: "Is couscous healthier than rice?", a: "They sit within a few calories of each other; couscous cooks faster and takes flavor better, while brown rice brings more fiber — pick by plate, not by health halo." },
        { q: "How many calories in a cup of couscous?", a: "The 157 g cooked cup runs about 176 kcal with 36 g of carbs and 6 g of protein — slightly lighter than the same cup of rice." },
        { q: "Is couscous whole grain?", a: "Traditional whole-wheat versions exist, but the common instant kind is refined semolina — treat it as a quick, neutral carb, not a fiber source." },
      ],
      ar: [
        { q: "هل الكسكس أصح من الأرز؟", a: "يفترقان بسعرات قليلة؛ الكسكس يُطهى أسرع ويستقبل النكهة أفضل، والأرز البني يجلب أليافًا أكثر — اختر بحسب الطبق لا بهالة الصحة." },
        { q: "كم سعرة في كوب كسكس؟", a: "كوب 157 جم المطبوخ يجري نحو 176 سعرة مع 36 جم كربوهيدرات و6 جم بروتين — أخف قليلًا من الكوب نفسه من الأرز." },
        { q: "هل الكسكس حبة كاملة؟", a: "توجد نسخ القمح الكامل التقليدية، لكن الشائع الفوري سيمولينا مصقولة — عاملوه ككربوهيدر سريع محايد لا مصدر ألياف." },
      ],
    },
  },

  "lentils": {
    intro: {
      en: "Lentils are the double agent of the pantry: 9 g of protein and 7.9 g of fiber per 100 g cooked, for only 116 kcal — the rare common food carrying that much of both at that price. The fiber is the headline: a single 198 g cup delivers over half of many adults' daily target, which is why lentil lunches keep afternoons quiet and evenings controlled. They need no soaking, simmer in twenty-five minutes, and become dal, soup, salads or burger patties without complaint. Of everything on the plant shelf, this is the food meat eaters should steal.",
      ar: "العدس صاحب الوجهين في الخزانة: 9 جم بروتين و7.9 جم ألياف لكل 100 جم مطبوخ، مقابل 116 سعرة فقط — الطعام الشائع النادر الحامل هذا القدر من الاثنين بهذا السعر. الألياف هي العنوان: كوب 198 جم واحد يقدم أكثر من نصف هدف يومي لكثير من البالغين، ولهذا تُبقي غداءات العدس الظهيرة هادئة والمساء منضبطًا. لا يحتاج نقعًا، ويغلي في خمس وعشرين دقيقة، ويتحول إلى دال أو شوربة أو سلطات أو أقراص برجر بلا اعتراض. ومن كل ما على الرف النباتي، هذا الطعام الذي ينبغي أن يسرقه آكلو اللحم.",
    },
    context: {
      en: {
        alternatives: "Chickpeas are the firmer, nuttier swap; black beans anchor Latin pots; tofu covers the protein side when fiber is already handled.",
        plan: "Cook a 500 g bag into a pot of soup — five lunches, each with 15 g protein and 15 g fiber. On gaining days, finish the pot with olive oil and serve beside rice for the classic pairing.",
        caution: "Lentil pasta and flours concentrate calories — the 116 kcal belongs to plain cooked seeds; and undercooked lentils fight digestion harder than any bean.",
      },
      ar: {
        alternatives: "الحمص البديل الأصلب والأكثر جوزية؛ والفول الأسود يرسي قدور المطبخ اللاتيني؛ والتوفو يغطي جانب البروتين حين تكون الألياف مدبَّرة.",
        plan: "اطبخ كيس 500 جم في حلة شوربة — خمسة غداءات، كل منها بـ15 جم بروتين و15 جم ألياف. وفي أيام التضخيم أنهِ الحلة بزيت الزيتون وقدمها بجوار الأرز للثنائية الكلاسيكية.",
        caution: "باستا العدس ودقيقه يركزان السعرات — 116 سعرة تخص البذور المطبوخة السادة؛ والعدس ناقص الطبخ يحارب الهضم أشد من أي فول.",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in a cup of lentils?", a: "About 18 g per 198 g cooked cup, alongside 16 g of fiber and 230 kcal — the best protein-fiber bundle per calorie in this database." },
        { q: "Do lentils count as protein or carbs?", a: "Both honestly — 20 g of carbs ride with the 9 g of protein per 100 g; treat them as a base layer that happens to carry protein, not a gram-for-gram meat replacement." },
        { q: "Do I need to soak lentils?", a: "No — unlike most dried beans they cook straight from the bag in about 25 minutes; soaking only shaves a few minutes off." },
      ],
      ar: [
        { q: "كم بروتين في كوب عدس؟", a: "نحو 18 جم لكل كوب مطبوخ 198 جم، مع 16 جم ألياف و230 سعرة — أفضل حزمة بروتين وألياف لكل سعرة في هذه القاعدة." },
        { q: "هل يُحسب العدس بروتينًا أم كربوهيدرات؟", a: "الاثنين بصدق — 20 جم كربوهيدرات تركب مع 9 جم بروتين لكل 100 جم؛ عاملوه كطبقة أساس تحمل بروتينًا بالصدفة، لا بديلًا للحم جرامًا بجرام." },
        { q: "هل أحتاج نقع العدس؟", a: "لا — بخلاف أغلب البقول المجففة يُطهى من الكيس مباشرة في نحو 25 دقيقة؛ والنقص يحلق دقائق قليلة فقط." },
      ],
    },
  },

  "chickpeas": {
    intro: {
      en: "Chickpeas run every Middle Eastern kitchen for good reason: 9 g of protein, 7.6 g of fiber and 27 g of carbs in 164 kcal per 100 g cooked — a nutritional triangle that keeps a whole region's plates standing. The 164 g cup is the backstage unit of hummus, the anchor of falafel, the easiest salad topping in the canned aisle, and a roasting candidate that turns into crunchy croutons in half an hour. Their starch drinks sauces like a sponge, which is why every stew with chickpeas in it tastes thicker than its ingredient list says.",
      ar: "الحمص يدير كل مطبخ شرق أوسطي لسبب وجيه: 9 جم بروتين و7.6 جم ألياف و27 جم كربوهيدرات في 164 سعرة لكل 100 جم مطبوخ — مثلث غذائي يُبقي أطباق إقليم كامل واقفة. كوب 164 جم هو وحدة الكواليس خلف الحمص المتبل، ومرساة الفلافل، وأسهل إضافة سلطة في رف المعلبات، ومرشح تحميص يتحول إلى كريوتونات مقرمشة في نصف ساعة. ونشاؤه يشرب الصوصات كالإسفنجة، ولهذا كل يخنة بها حمص تتذوق أثقل مما تقوله قائمة مكوناتها.",
    },
    context: {
      en: {
        alternatives: "Lentils cook faster with the same fiber story; black beans for the Latin direction; edamame if you want the protein doubled.",
        plan: "Blend a can with tahini, lemon and garlic for a protein-rich dip that carries carrot sticks through a cut. Over rice, the combo quietly forms a complete amino profile.",
        caution: "Falafel is deep-fried chickpeas — delicious and caloric, a different entry entirely; and canned versions carry sodium worth rinsing off.",
      },
      ar: {
        alternatives: "العدس يُطهى أسرع بقصة الألياف نفسها؛ والفول الأسود للتوجه اللاتيني؛ والإيدامامي إن أردت مضاعفة البروتين.",
        plan: "اخلط علبة مع الطحينة والليمون والثوم لغموس غني بالبروتين يحمل أعواد الجزر عبر التنشيف. وفوق الأرز، يشكل الثنائي بهدوء بروفايلًا أمينيًا كاملًا.",
        caution: "الفلافل حمص مقلي بالزيت الغزير — لذيذة وسعراتها عالية، ومدخل مختلف كليًا؛ والنسخ المعلبة تحمل صوديومًا يستحق الشطف.",
      },
    },
    faq: {
      en: [
        { q: "How much protein in a cup of chickpeas?", a: "Around 15 g per 164 g cup with 12 g of fiber at 270 kcal — solid plant numbers that still sit well below a chicken portion gram-for-gram." },
        { q: "Are chickpeas good for weight loss?", a: "Their fiber-and-protein pair keeps portions satisfying; the catch is preparation — boiled into salads they cut well, whipped with tahini oil they creep upward." },
        { q: "Canned or dried chickpeas?", a: "Canned wins on convenience at a small sodium cost you rinse away; dried wins on price if you will simmer them yourself on a weekend." },
      ],
      ar: [
        { q: "كم بروتين في كوب حمص؟", a: "حوالي 15 جم لكل كوب 164 جم مع 12 جم ألياف عند 270 سعرة — أرقام نباتية متينة تجلس مع ذلك دون حصة الدجاج جرامًا بجرام." },
        { q: "هل الحمص جيد لخسارة الوزن؟", a: "ثنائية أليافه وبروتينه تُبقي الحصص مُشبعة؛ والفخ في التحضير — مسلوقًا في السلطات ينفع للتنشيف، ومخفوقًا بزيت الطحينة يتسلل لأعلى." },
        { q: "حمص معلب أم مجفف؟", a: "المعلب يفوز بالسهولة بكلفة صوديوم صغيرة تشطفها؛ والمجفف يفوز بالسعر إن كنت ستسلقه بنفسك في عطلة أسبوع." },
      ],
    },
  },

  "black-beans": {
    intro: {
      en: "Black beans are the fiber champion of this entire library: 8.7 g per 100 g cooked — a 172 g cup carrying 15 g of it, alongside 15 g of protein and 41 g of carbs at 227 kcal. That fiber load is why beans-and-rice plates keep blood sugar steadier than the same carbs alone. It cooks down creamy, holds its shape in soups, mashes into burger patties and refried-style dips, and turns a burrito bowl from a rice pile into a meal. The dark skin means anthocyanins — the same pigment family as berries — as a free bonus.",
      ar: "الفول الأسود بطل الألياف في هذه المكتبة كلها: 8.7 جم لكل 100 جم مطبوخ — كوب 172 جم يحمل 15 جم منها، مع 15 جم بروتين و41 جم كربوهيدرات عند 227 سعرة. هذا الحمل من الألياف سبب بقاء أطباق أمريكا اللاتينية المبنية على الفول والأرز أثبت في سكر الدم من الكربوهيدرات نفسها وحدها. والحبة تُطبخ قشدية، وتحمل شكلها في الشوربات، وتُهرس في أقراص برجر وغموسات، وتحول وعاء البوريتو من كومة أرز إلى وجبة. والقشرة الداكنة تعني أنثوسيانين — عائلة الصبغة نفسها في التوت — كمكافأة مجانية.",
    },
    context: {
      en: {
        alternatives: "Lentils skip the soak; chickpeas swing Middle Eastern; refried pintos are the traditional mash swap.",
        plan: "A drained can over rice with lime and hot sauce is a 15-minute vegan dinner with a complete amino profile. During gaining phases, blend them into brownies — the internet recipe genuinely works.",
        caution: "The canned sodium rinses off in a colander; the real trap is sugary baked-bean styles, which are a dessert wearing a bean costume.",
      },
      ar: {
        alternatives: "العدس يتخطى النقع؛ والحمص يميل شرق أوسطيًا؛ والبينتو المهروس البديل التقليدي للهرس.",
        plan: "علبة مصفاة فوق الأرز مع الليمون الحامض والصوص الحار عشاء نباتي في 15 دقيقة ببروفايل أميني كامل. وفي مراحل التضخيم اخفقهم في كيك البراوني — وصفة الإنترنت تعمل حقًا.",
        caution: "صوديوم المعلب يُشطف في المصفاة؛ والفخ الحقيقي أنماط الفول المخبوز السكري، وهي حلوى بزيّ فول.",
      },
    },
    faq: {
      en: [
        { q: "How much fiber in a cup of black beans?", a: "15 g in a 172 g cup — half or more of a typical day's target from one food, with 15 g of protein arriving on the same spoon." },
        { q: "Are black beans a complete protein?", a: "Not alone — they run low in methionine, which rice happens to supply; the beans-and-rice pairing is the classic fix and the reason the combo exists everywhere." },
        { q: "Why do beans upset my stomach?", a: "Their oligosaccharides feed gut bacteria noisily; rinsing canned beans thoroughly, starting with small portions, and cooking with cumin all soften the effect." },
      ],
      ar: [
        { q: "كم ألياف في كوب فول أسود؟", a: "15 جم في كوب 172 جم — نصف هدف يوم نموذجي أو أكثر من طعام واحد، مع 15 جم بروتين تصل بالملعقة نفسها." },
        { q: "هل الفول الأسود بروتين كامل؟", a: "ليس وحده — ينخفض فيه الميثيونين، والأرز يوفره بالمصادفة؛ وثنائية الفول والأرز هي الإصلاح الكلاسيكي وسبب وجود التوليفة في كل مكان." },
        { q: "لماذا يزعج الفول معدتي؟", a: "سكرياته القليلة التعدد تطعم بكتيريا الأمعاء بضجيج؛ وشطف المعلب جيدًا، والبدء بحصص صغيرة، والطبخ بالكمون، كلها تلطف الأثر." },
      ],
    },
  },

  "corn": {
    intro: {
      en: "Corn is the vegetable that acts like a grain: 19 g of carbs and 86 kcal per 100 g, sweet enough to feel like a treat while still carrying 2.7 g of fiber. A single medium ear at 100 g is a summer side that needs nothing but heat and salt. Kernels off the cob jump into salsas, salads, chowder and stir-fries, and frozen bags keep the sweetness locked for months. Its sugar converts to starch fast after picking — which is exactly why the frozen version often beats the «fresh» ear that traveled for days.",
      ar: "الذرة خضار يتصرف كحبة: 19 جم كربوهيدرات و86 سعرة لكل 100 جم، حلوة بما يكفي لتشبه الحلوى وما زالت تحمل 2.7 جم ألياف. كوز متوسط واحد عند 100 جم طبق صيفي لا يحتاج سوى النار والملح. والحبوب خارج الكوز تقفز إلى الصلصات والسلطات وشوربة الذرة والتقليب السريع، وأكياس المجمد تحبس الحلاوة شهورًا. وسكرها يتحول نشا بسرعة بعد القطف — وهذا بالضبط سبب تفوق النسخة المجمدة غالبًا على الكوز «الطازج» الذي سافر أيامًا.",
    },
    context: {
      en: {
        alternatives: "Peas fill the sweet-green slot; potato plays the starchy side at similar calories; cauliflower bites cover the low-carb evenings.",
        plan: "Cut the kernels off two ears into a pan with bell pepper and cumin — a five-minute side with color and fiber. In gaining shakes, corn blends fine with banana and oats.",
        caution: "Butter and mayo-based street-corn dressings can double the calories; and popcorn is a different food entirely — this page's numbers belong to the fresh or frozen kernel.",
      },
      ar: {
        alternatives: "ال بازلاء يملأ خانة الحلاوة الخضراء؛ والبطاطس تلعب الجانب النشوي بسعرات مشابهة؛ وقرّيبات القرنبيط تغطي أمسيات قلة الكربوهيدرات.",
        plan: "انزع حبوب كوزين في مقلاة مع الفلفل الملون والكمون — طبق جانبي بخمس دقائق فيه لون وألياف. وفي مشروبات التضخيم تُخفق الذرة جيدًا مع الموز والشوفان.",
        caution: "الزبدة وصلصات ذرة الباعة القائمة على المايونيز قد تضاعف السعرات؛ والفشار طعام آخر كليًا — أرقام هذه الصفحة تخص الحبة الطازجة أو المجمدة.",
      },
    },
    faq: {
      en: [
        { q: "Is corn a vegetable or a grain?", a: "Botanically a grain, culinarily both — at 86 kcal per 100 g with 2.7 g of fiber it behaves like a moderate starch either way." },
        { q: "How many calories in an ear of corn?", a: "A medium 100 g ear runs about 86 kcal and 19 g of carbs — and count the butter separately." },
        { q: "Is corn too sugary for a diet?", a: "Its 3.2 g of sugars per 100 g is modest — less than carrots portion for portion; the reputation comes from syrup, not from the cob." },
      ],
      ar: [
        { q: "هل الذرة خضار أم حبة؟", a: "نباتيًا حبة، وطبيخيًا كلاهما — عند 86 سعرة لكل 100 جم مع 2.7 جم ألياف تتصرف كنشويات معتدلة في الحالتين." },
        { q: "كم سعرة في كوز ذرة؟", a: "كوز متوسط 100 جم يجري نحو 86 سعرة و19 جم كربوهيدرات — واحسب الزبدة على حدة." },
        { q: "هل الذرة سكرية أكثر من اللازم للدايت؟", a: "3.2 جم سكريات لكل 100 جم رقم متواضع — أقل من الجزر حصة بحصة؛ السمعة تأتي من الشراب السكري لا من الكوز." },
      ],
    },
  },

  "cereal": {
    intro: {
      en: "Corn flakes are the honest end of the cereal aisle: 357 kcal per 100 g dry sounds alarming, but the designed serving is a 28 g cup — 100 kcal and 24 g of carbs, before milk. As a quick pre-training carb or a six-a.m. child-compatible breakfast, nothing beats its zero-effort timeline. The nutrition story depends entirely on the box you grab: this plain version carries 10 g of sugar per 100 g, while the cartoon-character shelf next to it can triple that. Read the line that says sugars — it is the whole review.",
      ar: "كورن فليكس هو الطرف الصادق من رف السيريال: 357 سعرة لكل 100 جم جاف تبدو مخيفة، لكن الحصة المصممة كوب 28 جم — 100 سعرة و24 جم كربوهيدرات، قبل الحليب. ككربوهيدر سريع قبل التدريب أو فطور السادسة صباحًا المتوافق مع الأطفال، لا شيء يضاهي جدوله الزمني صفر الجهد. والقصة الغذائية تعتمد كليًا على العلبة التي تمسكها: هذه النسخة السادة تحمل 10 جم سكر لكل 100 جم، بينما رف شخصيات الكرتون المجاور قد يضاعفها ثلاث مرات. اقرأ سطر السكريات — فهو المراجعة كلها.",
    },
    context: {
      en: {
        alternatives: "Oatmeal is the slower-digesting swap with more fiber; rice cakes play the same crunch dry; eggs are the breakfast that holds you to lunch.",
        plan: "Use it as the fast pre-gym carb: one cup with milk sits light and clears the stomach before heavy sessions. On cuts, replace the milk with skim or pour a protein shake over it instead.",
        caution: "The serving-to-bowl gap is where cereal diets die — a family bowl of flakes passes 400 kcal dry before any milk lands.",
      },
      ar: {
        alternatives: "الشوفان البديل أبطأ هضمًا بألياف أكثر؛ وكيك الأرز يلعب المقرمشية نفسها جافًا؛ والبيض هو الفطور الذي يمسكك حتى الغداء.",
        plan: "استخدمه ككربوهيدر ما قبل التمرين السريع: كوب واحد بالحليب يجلس خفيفًا ويفرغ المعدة قبل الجلسات الثقيلة. وفي التنشيف استبدل الحليب بالخالي الدسم أو اسكب فوقه مشروب بروتين.",
        caution: "فجوة الحصة-إلى-الوعاء هي حيث تموت حميات السيريال — وعاء عائلي من الرقائق يتجاوز 400 سعرة جافًا قبل نزول أي حليب.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a cup of corn flakes?", a: "About 100 for the 28 g cup, with 24 g of carbs — plus 2 g of protein if you pour skim milk over it." },
        { q: "Is cereal good after a workout?", a: "As a fast carb it works fine alongside a real protein source; alone it is half a recovery meal waiting for the missing half." },
        { q: "What should I check on the cereal box?", a: "The sugars line and the serving size — brands quietly shrink the printed serving to make numbers look tamer than your actual bowl." },
      ],
      ar: [
        { q: "كم سعرة في كوب كورن فليكس؟", a: "نحو 100 لكوب 28 جم، مع 24 جم كربوهيدرات — وزيادة 2 جم بروتين إن سكبت فوقه حليبًا خالي الدسم." },
        { q: "هل السيريال جيد بعد التمرين؟", a: "ككربوهيدر سريع يعمل جيدًا بجانب مصدر بروتين حقيقي؛ وحده نصف وجبة استشفاء تنتظر نصفها الغائب." },
        { q: "ماذا أفحص على علبة السيريال؟", a: "سطر السكريات وحجم الحصة — العلامات تقلص الحصة المطبوعة خلسة لتُظهر أرقامًا أهدأ من وعائك الفعلي." },
      ],
    },
  },

  "granola": {
    intro: {
      en: "Granola is the most efficient calorie-delivery system disguised as health food in this library: 471 kcal, 64 g of carbs and 20 g of fat per 100 g — numbers a candy bar would not blush at. That density is precisely its value for hard gainers and endurance mornings: a 60 g half-cup pours 283 kcal of oats, nuts and oil into a bowl that feels like a responsible choice. The trap is equally efficient — pour it freely over yogurt and the «healthy breakfast» quietly clears 500 kcal. Weigh it once and the relationship stays honest.",
      ar: "الجرانولا أكفأ منظومة توصيل سعرات متنكرة في زي الطعام الصحي داخل هذه المكتبة: 471 سعرة و64 جم كربوهيدرات و20 جم دهون لكل 100 جم — أرقام لا يخجل منها لوح الحلوى. وهذه الكثافة هي قيمتها بالضبط لمن يجدون صعوبة في زيادة الوزن وصباحات التحمّل: نصف كوب 60 جم يصب 283 سعرة من الشوفان والمكسرات والزيت في وعاء يشبه خيارًا مسؤولًا. والفخ بالكفاءة نفسها — اسكبه بحرية على الزبادي فيعبر «الفطور الصحي» 500 سعرة بهدوء. زنه مرة واحدة وتبقى العلاقة صادقة.",
    },
    context: {
      en: {
        alternatives: "Plain oats give the same base at one-third the density; muesli skips the added oil; nuts alone deliver the crunch with the protein intact.",
        plan: "For gainers it is a shortcut: 60 g over whole milk adds more than 400 kcal to breakfast without volume struggles. On a cut, use it as a topping measured in tablespoons, never as the bowl.",
        caution: "Clusters are bound with oil and syrup — the 20 g of fat and 20 g of sugars per 100 g are structural, not accidental; «low-fat» versions usually pay in sugar.",
      },
      ar: {
        alternatives: "الشوفان السادي يمنح الأساس نفسه بثلث الكثافة؛ والميوسلي يتخطى الزيت المضاف؛ والمكسرات وحدها توصل المقرمشية والبروتين سليمًا.",
        plan: "لطلاب التضخيم هو اختصار: 60 جم فوق الحليب الكامل يضيف أكثر من 400 سعرة للفطور بلا صراع مع الحجم. وفي التنشيف استخدمه كإضافة تُقاس بملعقات المائدة، لا كوعاء أبدًا.",
        caution: "التكتلات مربوطة بالزيت والشراب — 20 جم دهون و20 جم سكريات لكل 100 جم بنيوية لا عرضية؛ ونسخ «قليلة الدهن» تدفع عادة من السكر.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in half a cup of granola?", a: "About 283 for 60 g — with 38 g of carbs and 12 g of fat; the handful you grab walking past the jar adds another hundred." },
        { q: "Is granola healthy?", a: "The oats and nuts inside are; the binding oil and syrup decide the verdict — compare grams of sugar per 100 g across brands and the shelf sorts itself." },
        { q: "Granola or oats for cutting?", a: "Oats, clearly — the same grain at one-third the calorie density lets you eat triple the volume; granola on a deficit is a measured condiment." },
      ],
      ar: [
        { q: "كم سعرة في نصف كوب جرانولا؟", a: "نحو 283 لـ60 جم — مع 38 جم كربوهيدرات و12 جم دهون؛ والقبضة التي تلتقطها مارًّا بالبرطمان تضيف مئة أخرى." },
        { q: "هل الجرانولا صحية؟", a: "الشوفان والمكسرات بداخلها كذلك؛ والزيت والشراب الرابطان يقرران الحكم — قارن جرامات السكر لكل 100 جم بين العلامات فيرتّب الرف نفسه." },
        { q: "جرانولا أم شوفان للتنشيف؟", a: "الشوفان بوضوح — الحبة نفسها بثلث كثافة السعرات تتيح لك أكل ثلاثة أضعاف الحجم؛ والجرانولا في العجز بمقياس مقتصد." },
      ],
    },
  },

  "coconut-oil": {
    intro: {
      en: "Coconut oil is pure fat in a jar — 862 kcal per 100 g, every gram of it fat, with a tablespoon (14 g) costing 121 kcal. What earns it shelf space is behavior, not macros: solid at room temperature, it binds no-bake protein bars and pastry-style crusts without refrigeration, and its sweet nuttiness suits curries and baking in a way olive oil never could. A notable share of its saturated fat comes as medium-chain triglycerides, a form the body handles somewhat differently — a real but modest effect, nowhere near the marketing claims that once surrounded it.",
      ar: "زيت جوز الهند دهن صرف في مرطبان — 862 سعرة لكل 100 جم، كل جرام منها دهن، وملعقة كبيرة (14 جم) تكلف 121 سعرة. ما يستحق به مكانه على الرف هو السلوك لا الماكروز: صلب في حرارة الغرفة، فيربط ألواح البروتين الخالية من الخبز وقشور المعجنات بلا ثلاجة، وحلاوته الجوزية تناسب الكاري والخبز بطريقة لا يقدر عليها زيت الزيتون أبدًا. ونصيب ملموس من دهونه المشبعة يأتي ثلاثي الغليسريد متوسط السلسلة، صورة يتعامل معها الجسم باختلاف ما — أثر حقيقي لكنه متواضع، لا يقترب من ادعاءات التسويق التي أحاطت به زمانًا.",
    },
    context: {
      en: {
        alternatives: "Olive oil is the daily driver for savory cooking; butter matches it in baking with a dairy note; avocado oil handles high-heat searing neutrally.",
        plan: "On a bulk, a spoon stirred into rice or a blender of oats adds 121 easy kcal that change nothing about fullness. Keto cooks use it as their default fat where its sweetness fits the plate.",
        caution: "At 862 kcal per 100 g it is the most calorie-dense entry in this library with olive oil — measure it by the teaspoon, never free-pour, and count it even in «healthy» bars.",
      },
      ar: {
        alternatives: "زيت الزيتون هو الحصان اليومي للطبخ المالح؛ والزبدة تطابقه في الخبز بنوتة لبنية؛ وزيت الأفوكادو يتعامل مع القلي العالي الحرارة بحياد.",
        plan: "في التضخيم، ملعقة مخفوقة في الأرز أو خلاط الشوفان تضيف 121 سعرة سهلة لا تغير شيئًا في الإشباع. وطباخو الكيتو يتخذونه دهنهم الافتراضي حيث تناسب حلاوته الطبق.",
        caution: "عند 862 سعرة لكل 100 جم هو أثقل مدخلات هذه المكتبة مع زيت الزيتون — قِسه بالملعقة الصغيرة ولا تسكبه حرًّا أبدًا، واحسبه حتى داخل الألواح «الصحية».",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a tablespoon of coconut oil?", a: "121 for the 14 g tablespoon — identical to olive oil spoon for spoon, since both are 100 percent fat; only the flavor and the melting behavior differ." },
        { q: "Does coconut oil burn fat?", a: "No — its medium-chain triglycerides are metabolized a little differently than long-chain fats, but the effect is small and easily drowned by the 121 kcal each spoon brings along." },
        { q: "Can I fry with coconut oil?", a: "Yes — it handles moderate frying heat and lends a sweetness that works for Asian-leaning dishes; for neutral searing, avocado oil is the cleaner tool." },
      ],
      ar: [
        { q: "كم سعرة في ملعقة كبيرة من زيت جوز الهند؟", a: "121 لملعقة 14 جم — مطابقة لزيت الزيتون ملعقة بملعقة، فكلاهما دهن مئة بالمئة؛ والفارق فقط في النكهة وسلوك الانصهار." },
        { q: "هل زيت جوز الهند يحرق الدهون؟", a: "لا — ثلاثياته متوسطة السلسلة تستقلب باختلاف طفيف عن الدهون طويلة السلسلة، لكن الأثر صغير يغرقه بسهولة كل أكراه 121 سعرة المرافقة." },
        { q: "هل أقلي بزيت جوز الهند؟", a: "نعم — يتحمل حرارة قلي معتدلة ويمنح حلاوة تناسب الأطباق الآسيوية؛ وللقلي المحايد يبقى زيت الأفوكادو الأداة الأنظف." },
      ],
    },
  },

  "butter": {
    intro: {
      en: "Butter is fat with a flavor no substitute fully copies: 717 kcal and 81 g of fat per 100 g, with a 14 g tablespoon landing 100 kcal. In a fitness kitchen it is a precision tool, not a base — the finish on vegetables, the reason restaurant eggs taste like restaurant eggs, the difference between a dry and an edible protein pancake. It was demonized for decades while its industrial trans-fat rival got a pass; current guidance treats it as simply a calorie-dense fat to count rather than fear.",
      ar: "الزبدة دهن بنكهة لا ينسخها بديل كامل: 717 سعرة و81 جم دهون لكل 100 جم، وملعقة كبيرة 14 جم تهبط بمئة سعرة. في مطبخ اللياقة هي أداة دقيقة لا أساس — اللمسة الأخيرة على الخضار، وسبب أن بيض المطاعم يشبه بيض المطاعم، والفرق بين بان كيك بروتين جاف وآخر يؤكل. شيطنت لعقود بينما نال منافسها الصناعي المحمّل بالدهون المتحولة براءة؛ والإرشادات الحالية تعاملها ببساطة كدهن كثيف السعرات يُحسب لا يُخاف.",
    },
    context: {
      en: {
        alternatives: "Olive oil covers daily cooking at the same spoon-cost with a friendlier fat profile; ghee is butter with the milk solids removed for higher heat; coconut oil brings sweetness to baking.",
        plan: "On a gaining phase, finishing rice or vegetables with a tablespoon adds 100 invisible kcal. On a cut, butter earns its slot by making vegetables finishable — count the spoon and keep it.",
        caution: "The numbers belong to plain butter — whipped tubs spread air (fewer kcal per spoon, but people double the spoon), and restaurant «butter sauces» are mostly more butter.",
      },
      ar: {
        alternatives: "زيت الزيتون يغطي الطبخ اليومي بكلفة الملعقة نفسها ببروفايل دهون ألطف؛ والسمن زبدة منزوعة المواد الصلبة لحرارة أعلى؛ وزيت جوز الهند يجلب الحلاوة للخبز.",
        plan: "في مرحلة التضخيم، إنهاء الأرز أو الخضار بملعقة كبيرة يضيف 100 سعرة غير مرئية. وفي التنشيف تستحق الزبدة مكانها بجعلها الخضار تُؤكل حتى الآخر — احسب الملعقة وأبقها.",
        caution: "الأرقام تخص الزبدة السادة — العلب المخفوقة تنشر هواء (سعرات أقل للملعقة لكن الناس يضاعفونها)، و«صلصات الزبدة» بالمطاعم زبدة فوق زبدة في الأغلب.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a tablespoon of butter?", a: "100 for 14 g — the same spoonful of fat as any oil; what changes is the flavor it brings, which is precisely why it is worth spending carefully." },
        { q: "Butter or olive oil for daily cooking?", a: "Olive oil for the everyday pan — its fat profile is the reason it anchors the Mediterranean pattern; keep butter for the finishes where its flavor is the whole point." },
        { q: "Is butter allowed on keto?", a: "Yes — nearly zero carbs at 81 g of fat per 100 g, which is why it is a staple there; keto still counts calories when the goal is fat loss." },
      ],
      ar: [
        { q: "كم سعرة في ملعقة كبيرة زبدة؟", a: "100 لكل 14 جم — الملعقة نفسها من الدهن كأي زيت؛ والمتغير هو النكهة التي تجلبها، وهذا بالضبط سبب استحقاقها إنفاقًا حذرًا." },
        { q: "زبدة أم زيت زيتون للطبخ اليومي؟", a: "زيت الزيتون للمقلاة اليومية — بروفايل دهونه سبب ترسيخه النمط المتوسطي؛ وأبقِ الزبدة للَّمسات الأخيرة حيث نكهتها هي القصة كلها." },
        { q: "هل الزبدة مسموحة في الكيتو؟", a: "نعم — كربوهيدرات شبه معدومة عند 81 جم دهون لكل 100 جم، ولهذا هي ركن هناك؛ والكيتو نفسه يظل يحسب السعرات حين يكون الهدف حرق الدهون." },
      ],
    },
  },

  "cheese-cheddar": {
    intro: {
      en: "Cheddar is the cheese that makes high-protein eating livable: 25 g of protein and 33 g of fat for 403 kcal per 100 g — numbers that read like fatty meat until you remember a slice is 30 g. That slice (120 kcal, 7.5 g protein) melts over eggs, folds into a burger, or eats straight from the block when the protein target still has a gap. At 1.3 g of carbs per 100 g it is fully keto, and its calcium arrives in the most willing package on the dairy shelf. The challenge: stopping at one or two slices.",
      ar: "الشيدر هو الجبن الذي يجعل الأكل عالي البروتين قابلًا للحياة: 25 جم بروتين و33 جم دهون مقابل 403 سعرة لكل 100 جم — أرقام تُقرأ كلحم دهني حتى تتذكر أن الشريحة 30 جم. تلك الشريحة (120 سعرة و7.5 جم بروتين) تذوب فوق البيض، أو تنطوي داخل البرجر، أو تُؤكل مباشرة من الكتلة حين لا يزال في هدف بروتين اليوم فجوة. وعند 1.3 جم كربوهيدرات لكل 100 جم هو كيتو بالكامل، وكالسيومه يصل في أكثر عبوة رغبة على رف الألبان. والتحدي الوحيد الحقيقي هو التوقف عند شريحة أو اثنتين.",
    },
    context: {
      en: {
        alternatives: "Mozzarella is the melt-friendly sibling with less fat; feta covers the salty-crumbly direction; parmesan is the protein-dense finisher for grating.",
        plan: "Two slices over a four-egg omelet turn a boring protein meal into the one you look forward to — 240 kcal for the pair, with 15 g of protein arriving with them. On a cut, one slice as the finish usually survives the budget.",
        caution: "Aged versions concentrate flavor AND sodium — check the label if salt matters to you; and «cheese product» slices are a different industrial food with different numbers entirely.",
      },
      ar: {
        alternatives: "الموزاريلا الشقيق الصديق للذوبان بدهون أقل؛ والفيتا يغطي الاتجاه المالح المتفتت؛ والبارميزان الخاتم الكثيف بروتينًا للبشر.",
        plan: "شريحتان فوق عجة أربع بيضات تحولان وجبة بروتين مملة إلى التي تنتظرها — 240 سعرة للاثنتين، ومعهما 15 جم بروتين. وفي التنشيف تنجو شريحة واحدة كخاتمة غالبًا من الميزانية.",
        caution: "النسخ المعقة تركز النكهة والصوديوم معًا — افحص الملصق إن كان الملح يهمك؛ وشرائح «منتج الجبن» صنف صناعي مختلف بأرقام مختلفة تمامًا.",
      },
    },
    faq: {
      en: [
        { q: "How much protein is in a slice of cheddar?", a: "About 7.5 g for a 30 g slice, at 120 kcal — one of the few protein foods that needs zero preparation and survives any lunch bag." },
        { q: "Is cheddar keto-friendly?", a: "Yes — 1.3 g of carbs per 100 g rounds to nearly nothing per slice; it is the fat and the calorie density that need counting, never the carbs." },
        { q: "How much cheddar is a serving?", a: "The designed serving here is one 30 g slice; two slices (240 kcal) still fit most plans as the flavor layer of a high-protein meal." },
      ],
      ar: [
        { q: "كم بروتين في شريحة شيدر؟", a: "نحو 7.5 جم لشريحة 30 جم، عند 120 سعرة — من أطعمة البروتين القليلة التي تحتاج صفر تحضير وتصمد في أي حقيبة غداء." },
        { q: "هل الشيدر صديق للكيتو؟", a: "نعم — 1.3 جم كربوهيدرات لكل 100 جم تتقرب من الصفر لكل شريحة؛ الذي يحتاج الحساب هو الدهون وكثافة السعرات، لا الكربوهيدرات أبدًا." },
        { q: "كم شيدر في الحصة؟", a: "الحصة المصممة هنا شريحة واحدة 30 جم؛ وشريحتان (240 سعرة) تدخلان أغلب الخطط كطبقة النكهة في وجبة عالية البروتين." },
      ],
    },
  },

  "parmesan": {
    intro: {
      en: "Parmesan is the most protein-dense food in the cheese aisle: 38 g of protein per 100 g — more than most meats carry — for 431 kcal and 29 g of fat. The designed serving is smaller than you fear: a quarter-cup of grated (25 g) seasons an entire plate with 9.5 g of protein and 108 kcal — its umami is so concentrated that a little travels far. Aged for a year or more, it carries almost no lactose and turns plain vegetables into plates people actually finish. It is the only «seasoning» that brings protein.",
      ar: "البارميزان أكثف طعام بالبروتين في ممر الجبن: 38 جم بروتين لكل 100 جم — أكثر مما تحمله أغلب اللحوم — مقابل 431 سعرة و29 جم دهون. والحصة المصممة أصغر مما تخشى: ربع كوب مبشور (25 جم) يتبّل طبقًا كاملًا بـ9.5 جم بروتين و108 سعرات، لأن نكهته الخامسة مركزة حد أن القليل يسافر بعيدًا. ومُعتق لعام أو أكثر، يحمل لاكتوزًا شبه معدوم، ويصمد شهورًا في الدرج، ويحول الخضار السادة إلى أطباق ينهيها الناس فعلًا. هو «التتبيلة» الوحيدة في مطبخ اللياقة التي تجلب بروتينًا.",
    },
    context: {
      en: {
        alternatives: "Pecorino romano is the sharper, saltier cousin; cheddar shreds melt smoother over burgers; a spoon of nutritional yeast covers the vegan direction with a similar savory note.",
        plan: "Grate it over the vegetable plates that bore you — the 108 kcal quarter-cup makes two cups of broccoli disappear on cutting days. On gaining pasta nights it is basically free flavor protein.",
        caution: "Its concentration cuts both ways: the sodium per gram is among the highest on the shelf, so blood-pressure-aware eaters should treat it as the salt source it is.",
      },
      ar: {
        alternatives: "البكورينو رومانو ابن العم الأحدّ والأكثر ملوحة؛ وشيدر المبشور يذوب أنعم فوق البرجر؛ وملعقة خميرة غذائية تغطي الاتجاه النباتي بنوتة خامسة مشابهة.",
        plan: "ابشره فوق أطباق الخضار التي تملّها — ربع الكوب بـ108 سعرات يجعل كوبين من البروكلي يختفيان في أيام التنشيف. وفي ليالي باستا التضخيم هو بروتين نكهة شبه مجاني.",
        caution: "تركيزه سلاح ذو حدين: صوديومه لكل جرام من الأعلى بالرف، فمن يراقب ضغط الدم يعامله كمصدر الملح الذي هو عليه.",
      },
    },
    faq: {
      en: [
        { q: "How much protein in a serving of parmesan?", a: "9.5 g in the 25 g grated quarter-cup, for 108 kcal — a protein-per-calorie trade few seasonings can match." },
        { q: "Why is parmesan so high in protein?", a: "Aging removes water and concentrates everything else — a year in the wheel turns milk into something closer to a meat than a spread." },
        { q: "Is parmesan worth the price?", a: "By serving it is cheaper than it looks: one wedge grates across a dozen plates at 9.5 g protein each, which no other seasoning delivers." },
      ],
      ar: [
        { q: "كم بروتين في حصة بارميزان؟", a: "9.5 جم في ربع الكوب المبشور 25 جم، مقابل 108 سعرات — صفقة بروتين لكل سعرة تعجز تتبيلات قليلة عن مجاراتها." },
        { q: "لماذا بروتين البارميزان مرتفع هكذا؟", a: "التعتيق يزيل الماء ويركز كل ما عداه — عام في العجلة يحول الحليب إلى شيء أقرب للحم منه للدهان." },
        { q: "هل يستحق البارميزان سعره؟", a: "بالحصة أرخص مما يبدو: قطعة واحدة تُبشر عبر عشرة أطباق بـ9.5 جم بروتين لكل منها، ولا تتبيلة أخرى تفعل ذلك." },
      ],
    },
  },

  "bacon": {
    intro: {
      en: "Bacon is the flavor multiplier of the protein world: 37 g of protein riding on 541 kcal and 42 g of fat per 100 g — a ratio that disqualifies it as a protein source and rehires it as a seasoning. Two slices (30 g) cost 162 kcal and bring 11 g of protein alongside the smoky fat that makes eggs, salads and sprouts disappear from plates. On a cut it is a measured luxury; on a bulk it is breakfast's best argument. Its saturated fat and sodium deserve the caution they get — honesty, not panic.",
      ar: "البيكون مضاعف النكهة في عالم البروتين: 37 جم بروتين تركب 541 سعرة و42 جم دهون لكل 100 جم — نسبة تخرجه من مصادر البروتين وتعيد توظيفه تتبيلة. شريحتان (30 جم) تكلفان 162 سعرة وتجلبان 11 جم بروتين مع الدهن المدخن الذي يجعل البيض والسلطات والبروكلي يختفي من الأطباق. في التنشيف رفاهية مضبوطة؛ وفي التضخيم أقوى حجج الفطور. ودهونه المشبعة وصوديومه يستحقان الحذر الذي ينالانه — بصدق لا بذعر.",
    },
    context: {
      en: {
        alternatives: "Turkey bacon runs leaner at a flavor cost; smoked salmon delivers the salty-smoky hit with better fats; a teaspoon of smoked paprika in oil fakes the aroma for zero-meat plates.",
        plan: "On a bulk, two slices beside four eggs and two slices of toast is the classic 700-kcal morning. On a cut, crumble ONE slice over a salad — the flavor distributes further than the calories.",
        caution: "Restaurants cook bacon in its own rendered fat, stacking beyond the 541 kcal reference; and «maple» or «honey» cured styles add a sugar layer the plain number never carried.",
      },
      ar: {
        alternatives: "بيكون الرومي أميل للرشاقة بكلفة نكهة؛ والسلمون المدخن يوصل ضربة المالح المدخن بدهون أفضل؛ وملعقة صغيرة بابريكا مدخنة في الزيت تزيّن الرائحة للأطباق الخالية من اللحم.",
        plan: "في التضخيم، شريحتان بجوار أربع بيضات وشريحتي توست هي صباح 700 سعرة الكلاسيكي. وفي التنشيف، فتّت شريحة واحدة فوق سلطة — النكهة تتوزع أبعد من السعرات.",
        caution: "المطاعم تطبخ البيكون في دهنه المنصهر، فتتجاوز مرجع 541 سعرة؛ وأنماط «القيقب» أو «العسل» المعالجة تضيف طبقة سكر لم تحملها الأرقام السادية قط.",
      },
    },
    faq: {
      en: [
        { q: "How much protein in two slices of bacon?", a: "About 11 g for 30 g of bacon, arriving on 162 kcal — protein is a passenger here, not the vehicle." },
        { q: "Can I eat bacon while cutting?", a: "Yes, as a seasoning — one crumbled slice flavors a whole salad for 81 kcal; treating it as the protein anchor of a meal is where cuts go to die." },
        { q: "Is bacon that unhealthy?", a: "Its processed-meat classification means «limit», not «never»: sodium and saturated fat are the load-bearing concerns, and portion control handles both." },
      ],
      ar: [
        { q: "كم بروتين في شريحتي بيكون؟", a: "نحو 11 جم لكل 30 جم بيكون، تصل على 162 سعرة — البروتين هنا راكب لا مركبة." },
        { q: "هل آكل البيكون أثناء التنشيف؟", a: "نعم، كتتبيلة — شريحة واحدة مفتتة تنكّه سلطة كاملة بـ81 سعرة؛ أما اتخاذه مرساة بروتين الوجبة فهنا حيث تموت خطط التنشيف." },
        { q: "هل البيكون غير صحي إلى هذا الحد؟", a: "تصنيفه ضمن اللحوم المصنعة يعني «اعتدل» لا «أبدًا»: الصوديوم والدهون المشبعة هما الخطران الحاملان، وضبط الحصة يكفيهما." },
      ],
    },
  },

  "cucumber": {
    intro: {
      en: "Cucumber is water with structure: 15 kcal per 100 g — tied for the lowest-energy solid food in this library — with 3.6 g of carbs and 0.5 g of fiber. A whole medium cucumber (150 g) costs 23 kcal, which is why it appears wherever dieting humans need volume: sliced into snack jars with salt and chili, shredded into yogurt bowls, or doubling the apparent size of a chicken salad without moving the calorie needle. Its mild freshwater taste is the point — it is a carrier for salt, lemon, dill and dip, never the feature.",
      ar: "الخيار ماء له بنية: 15 سعرة لكل 100 جم — بتعادل أدنى طاقة لطعام صلب بهذه المكتبة — مع 3.6 جم كربوهيدرات و0.5 جم ألياف. خيار متوسط كامل (150 جم) يكلف 23 سعرة، ولهذا يظهر حيثما احتاج البشر المتننفون حجمًا: مقطعًا في برطمانات السناك بالملح والفلفل، أو مبروشًا في أطباق الزبادي، أو مضاعفًا الحجم الظاهري لسلطة الدجاج دون تحريك إبرة السعرات. وطعمه العذب الخفيف هو المقصود — ناقل للملح والليمون والشبت والغموس، لا الحدث أبدًا.",
    },
    context: {
      en: {
        alternatives: "Celery plays the same crunch-and-water role; zucchini takes the slot in cooked dishes; lettuce covers the bulk-foundation job under hot fillings.",
        plan: "On a cut, pre-cut a jar of cucumber spears with salt, lemon and chili — it is the hand-to-mouth fix that costs 23 kcal a cucumber. In bulking salads it adds eating time without calories.",
        caution: "The peel carries the fiber and a share of the nutrients — peeling for softness trades away most of what little the vegetable offers; waxed skins deserve a scrub.",
      },
      ar: {
        alternatives: "الكرفس يلعب دور المقرمش والماء نفسه؛ والكوسة تأخذ الخانة في الأطباق المطبوخة؛ والخس يغطي وظيفة أساس الحجم تحت الحشوات الساخنة.",
        plan: "في التنشيف، قطّع مسبقًا برطمان أصابع خيار بالملح والليمون والفلفل — إنه إصلاح اليد والفم الذي يكلف 23 سعرة للخيارة. وفي سلطات التضخيم يضيف وقت أكل بلا سعرات.",
        caution: "القشرة تحمل الألياف ونصيبًا من المغذيات — تقشيرها لطلب الليونة يبدد أغلب القليل الذي يقدمه الخضار؛ وقشور الشمع تستحق فركًا.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a whole cucumber?", a: "About 23 for a medium 150 g one — you could eat four of them and still sit under a single banana at 89 kcal per 100 g." },
        { q: "Does cucumber have any protein?", a: "Around 1 g per medium cucumber — real but nutritionally decorative; cucumber solves volume and crunch, never protein." },
        { q: "Should I peel cucumbers?", a: "No — the skin is where the fiber and much of the value lives; a quick scrub handles the wax, and the peel is what keeps spears rigid for dipping." },
      ],
      ar: [
        { q: "كم سعرة في خيارة كاملة؟", a: "نحو 23 لمتوسطة 150 جم — يمكنك أكل أربعة منها وتبقى دون موزة واحدة عند 89 سعرة لكل 100 جم." },
        { q: "هل في الخيار بروتين؟", a: "حوالي 1 جم للخيارة المتوسطة — حقيقي لكنه زخرفي تغذويًا؛ الخيار يحل مشكلة الحجم والمقرمشية، لا البروتين أبدًا." },
        { q: "هل أقشر الخيار؟", a: "لا — القشرة حيث تسكن الألياف وأغلب القيمة؛ فرك سريع يكفي للشمع، والقشرة ما يُبقي الأصابع صلبة للغموس." },
      ],
    },
  },

  "tomato": {
    intro: {
      en: "The tomato is the vegetable that seasons the world: 18 kcal and 3.9 g of carbs per 100 g, with a medium specimen (123 g) at just 22 kcal. Raw it is the salad base and the burger's only rebuttal; cooked down it becomes the sauce that carries pasta, eggs and beans across a dozen cuisines — and gentle cooking concentrates its lycopene, the red pigment nutrition research keeps returning to. Fresh on the counter or canned in the pantry, it earns its ubiquity at a calorie price nobody notices paying.",
      ar: "الطماطم الخضار الذي يتبّل العالم: 18 سعرة و3.9 جم كربوهيدرات لكل 100 جم، والنسخة المتوسطة (123 جم) عند 22 سعرة فقط. نيئة هي أساس السلطة والرد الوحيد للبرجر؛ ومطبوخة تُصبح الصوص الذي يحمل الباستا والبيض والفول عبر عشرات المطابخ — والطبخ الهادئ يركز الليكوبين، الصبغة الحمراء التي يعود إليها بحث التغذية دومًا. طازجة على الطاولة أو معلبة في الخزانة، تستحق حضورها الكوني بسعر سعري لا ينتبه أحد لدفعه.",
    },
    context: {
      en: {
        alternatives: "Canned crushed tomatoes are the sauce-making workhorse at the same numbers; cherry tomatoes turn snacking portable; roasted red peppers cover the sweet-savory slot raw.",
        plan: "A quick shakshuka base — canned tomatoes, onion, cumin, eggs — is the highest-protein-per-calorie hot breakfast this page can build. On a cut, tomatoes flavor everything for free.",
        caution: "Fresh winter tomatoes are a pale imitation of summer ones — the can is the honest choice off-season; and storing ripe tomatoes in the fridge dulls the flavor (room temperature wins).",
      },
      ar: {
        alternatives: "الطماطم المعلبة المهروسة هي حصان صناعة الصوصات بالأرقام نفسها؛ وطماطم الكرز تجعل السناك محمولًا؛ والفلفل الأحمر المشوي يغطي خانة الحلو المالح نيئًا.",
        plan: "أساس شكشوكة سريع — طماطم معلبة وبصل وكمون وبيض — هو أعلى فطور ساخن بروتينًا لكل سعرة تبنيه هذه الصفحة. وفي التنشيف تنكّه الطماطم كل شيء مجانًا.",
        caution: "طماطم الشتاء الطازجة نسخة باهتة من الصيفية — العلبة الخيار الصادق خارج الموسم؛ وتخزين الناضجة بالثلاجة يبهّت النكهة (حرارة الغرفة تفوز).",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a medium tomato?", a: "About 22 for a 123 g specimen — the reason tomatoes appear in every cutting recipe ever written: flavor infrastructure at no cost." },
        { q: "Is a tomato a fruit or a vegetable?", a: "Botanically a fruit, culinarily a vegetable, and for your macros neither — at 3.9 g of carbs per 100 g it simply never matters which label wins." },
        { q: "Are canned tomatoes as good as fresh?", a: "For cooking, arguably better — they are picked at peak ripeness, and the canning heat boosts lycopene availability; keep fresh for eating raw." },
      ],
      ar: [
        { q: "كم سعرة في حبة طماطم متوسطة؟", a: "نحو 22 لحبة 123 جم — سبب ظهور الطماطم في كل وصفة تنشيف كُتبت: بنية تحتية للنكهة بلا كلفة." },
        { q: "هل الطماطم فاكهة أم خضار؟", a: "نباتيًا فاكهة، وطبيخيًا خضار، ولماكروزك لا هذا ولا ذاك — عند 3.9 جم كربوهيدرات لكل 100 جم لا يهم أبدًا أي لقب يفوز." },
        { q: "هل الطماطم المعلبة جيدة كالطازجة؟", a: "للطبخ، أفضل حجةً — تُقطف في ذروة النضج، وحرارة التعليب ترفع توفر الليكوبين؛ أبقِ الطازجة للأكل نيئًا." },
      ],
    },
  },

  "carrot": {
    intro: {
      en: "A carrot is the sweetest vegetable most diets allow freely: 41 kcal and 10 g of carbs per 100 g, of which 4.7 g is natural sugar — still fewer calories per bite than an apple carries. The medium root (61 g) is 25 kcal, two of them make a snack bag that survives a gym bag, and their crunch does real psychological work replacing chip habits during a cut. The orange beta-carotene is a free bonus; the honest job is volume, fiber and sweetness at a price of nearly nothing.",
      ar: "الجزر أحلى خضار تسمح به أغلب الحميات بحرية: 41 سعرة و10 جم كربوهيدرات لكل 100 جم، منها 4.7 جم سكر طبيعي — وما زال أقل سعرات للقمة مما تحمله تفاحة. والجذرة المتوسطة (61 جم) 25 سعرة، واثنتان منها تصنعان كيس سناك يصمد في حقيبة الجيم، ومقرشيتهما يقوم بعمل نفسي حقيقي باستبدال عادة الشيبسي في التنشيف. والبيتا كاروتين البرتقالي مكافأة مجانية؛ والوظيفة الصادقة هي الحجم والألياف والحلاوة بثمن شبه معدوم.",
    },
    context: {
      en: {
        alternatives: "Bell pepper covers the crunch slot with no sweetness attached; cucumber handles pure volume; roasted carrots play the sweet-savory side when the oven is already hot.",
        plan: "Pre-portion sticks with a hummus or labneh pot — the fat slows the sugar and the pairing holds you to dinner. On gaining days, carrots disappear into stews and rice pilafs unnoticed.",
        caution: "Juicing concentrates the sugar and deletes the fiber that slows it — five juiced carrots hit harder than five chewed ones ever could; and «baby» carrots are just carved big ones at a convenience markup.",
      },
      ar: {
        alternatives: "الفلفل الملون يغطي خانة المقرمشية بلا حلاوة مرفقة؛ والخيار يتولى الحجم الخالص؛ والجزر المشوي يلعب الجانب الحلو المالح حين يكون الفرن مشتعلًا أصلًا.",
        plan: "جهّز أصابعًا بجرعة حمص أو لبنة — الدهن يبطئ السكر والثنائي يمسكك حتى العشاء. وفي أيام التضخيم يختفي الجزر في اليخنات وأرز البيلوف دون ملاحظة.",
        caution: "العصر يركز السكر ويحذف الألياف التي تبطئه — خمس جزرات معصورات تضرب أقوى من خمس مضغات أبدًا؛ و«جزر الأطفال» مجرد جزرات كبيرة منحوتة بعلاوة سعر للراحة.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in one carrot?", a: "About 25 for a medium 61 g root — the classic dieter's default for the crunch-craving hours, at a price that never registers." },
        { q: "Are carrots too sweet for keto?", a: "At 10 g of carbs per 100 g they are the borderline vegetable — half a carrot fits most keto budgets; a juiced glass of them never will." },
        { q: "Do baby carrots differ from regular ones?", a: "Same plant, peeled and shaped — you pay for convenience and lose the peel's fiber edge; a bag of whole carrots is the identical food for less." },
      ],
      ar: [
        { q: "كم سعرة في جزرة واحدة؟", a: "نحو 25 لجذرة متوسطة 61 جم — الخيار الافتراضي الكلاسيكي للدايتر في ساعات اشتياق المقرمشية، بثمن لا يُحس أبدًا." },
        { q: "هل الجزر حلو أكثر من اللازم للكيتو؟", a: "عند 10 جم كربوهيدرات لكل 100 جم هو الخضار الحدودي — نصف جزرة يدخل أغلب ميزانيات الكيتو؛ وكوب معصور منها لن يدخل أبدًا." },
        { q: "هل جزر الأطفال يختلف عن العادي؟", a: "النبتة نفسها، مقشر ومنحوت — تدفع ثمن الراحة وتخسر أفضلية ألياف القشرة؛ وكيس الجزر الكامل الطعام ذاته بأقل." },
      ],
    },
  },

  "bell-pepper": {
    intro: {
      en: "Bell pepper is the vegetable that makes a plate look intentional: 31 kcal and 6 g of carbs per 100 g, with a full medium pepper (120 g) costing 37 kcal while carrying more vitamin C, gram for gram, than the orange people reach for instead. Red peppers are the ripened, sweetest stage of the same fruit; green ones are its bitter, cheaper youth. Stuffed with minced meat and rice, roasted until the skin blisters, raw beside a dip, or sliced into a stir-fry, it holds its structure under heat better than almost anything else in the crisper drawer.",
      ar: "الفلفل الملون هو الخضار الذي يجعل الطبق يبدو مقصودًا: 31 سعرة و6 جم كربوهيدرات لكل 100 جم، وحبة متوسطة كاملة (120 جم) تكلف 37 سعرة وهي تحمل فيتامين سي أكثر، جرامًا بجرام، من البرتقالة التي يمد الناس أيديهم إليها بدلًا منه. الأحمر هو طور النضج الأحلى للثمرة نفسها؛ والأخضر شبابها المر الأرخص. محشيًا باللحم المفروم والأرز، أو مشويًا حتى تتفجر قشرته، أو نيئًا بجوار غموس، أو مقطعًا في قلي سريع — يحمل بنيته تحت الحرارة أفضل من أي شيء آخر تقريبًا في درج الخضار.",
    },
    context: {
      en: {
        alternatives: "Roasted red peppers from a jar cover the sweet-depth direction; cucumber takes the raw-crunch duty on leaner days; zucchini absorbs stuffings the same way for fewer carbs.",
        plan: "The stuffed-pepper template — ground beef, rice, tomato, one pepper per person — is a complete 500-kcal meal that meal-preps three days deep. On cuts, strips replace crackers at the hummus jar.",
        caution: "Green peppers are unripe — cheaper and sharper, but half the sweetness; and the bulk-bagged mini peppers often run sweeter than the label implies, which matters only on strict carb budgets.",
      },
      ar: {
        alternatives: "الفلفل الأحمر المشوي من المرطبان يغطي اتجاه العمق الحلو؛ والخيار يتولى واجب المقرمشية النيئة في الأيام الأقل؛ والكوسة تمتص الحشوات بالطريقة نفسها بكربوهيدرات أقل.",
        plan: "قالب الفلفل المحشي — لحم مفروم وأرز وطماطم وفلفلة للفرد — وجبة 500 سعرة كاملة تتحضر لثلاثة أيام. وفي التنشيف تحل الشرائح محل البسكويت عند برطمان الحمص.",
        caution: "الفلفل الأخضر غير ناضج — أرخص وأحدّ، لكنه نصف الحلاوة؛ والفلفلات الصغيرة المعبأة أكياسًا أغلبًا أحلى مما يوحي الملصق، وهذا يهم فقط في ميزانيات الكربوهيدرات الصارمة.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a whole bell pepper?", a: "About 37 for a medium 120 g one — one of the cheapest volumes of color, crunch and vitamin C a cutting week can buy." },
        { q: "Red, yellow or green pepper?", a: "Same plant at three ripeness stages — green is bitter and cheap, yellow sits between, red is sweetest and carries the most pigments; price usually decides honestly." },
        { q: "Do bell peppers fit keto?", a: "Half a pepper at 6 g of carbs per 100 g fits comfortably; the full stuffed-pepper recipe is where keto budgets start asking questions." },
      ],
      ar: [
        { q: "كم سعرة في فلفلة كاملة؟", a: "نحو 37 لمتوسطة 120 جم — من أرخص كميات اللون والمقرمشية وفيتامين سي تشتريها أسابيع التنشيف." },
        { q: "فلفل أحمر أم أصفر أم أخضر؟", a: "النبتة نفسها بثلاثة أطوار نضج — الأخضر مر ورخيص، والأصفر بين بين، والأحمر الأحلى والأغنى بالصبغات؛ والسعر يقرر بصدق غالبًا." },
        { q: "هل الفلفل الملون يدخل الكيتو؟", a: "نصف فلفلة عند 6 جم كربوهيدرات لكل 100 جم تدخل بارتياح؛ ووصفة الفلفل المحشي الكاملة هي حيث تبدأ ميزانيات الكيتو بطرح الأسئلة." },
      ],
    },
  },

  "onion": {
    intro: {
      en: "The onion is the aromatics backbone of nearly every savory dish on earth: 40 kcal and 9 g of carbs per 100 g, of which a recipe rarely spends more than a quarter — a medium bulb (110 g) is 44 kcal, split across four plates in most pots. Its job is chemistry, not nutrition: caramelized slowly it delivers sweet depth, sweated in oil it builds the base of soups and sauces, raw it cuts through rich meat. The tear factor is water-soluble — chill the bulb before cutting and it mostly behaves.",
      ar: "البصل العمود الفقري للعطرية في كل طبق مالح على الأرض تقريبًا: 40 سعرة و9 جم كربوهيدرات لكل 100 جم، لا ينفق منها الوصف أكثر من ربع عادة — والبصلة المتوسطة (110 جم) 44 سعرة تتوزع على أربعة أطباق في أغلب القُدر. وظيفته كيميائية لا تغذوية: مكرملًا ببطء يمنح عمقًا حلوًا، ومعرّقًا في الزيت يبني قاعدة الشوربات والصوصات، ونيئًا يشق طريقه عبر اللحم الدسم. وعامل الدموع ذائب في الماء — برّد البصلة قبل التقطيع فتلتزم إلى حد كبير.",
    },
    context: {
      en: {
        alternatives: "Shallots are the milder, finer sibling for dressings; leeks carry the same family flavor gently in soups; scallions finish plates raw where cooking is not on the table.",
        plan: "Start nearly any savory dish the same way — diced onion in an oiled pan until translucent — and the rest of the recipe inherits depth almost for free at under 20 kcal per serving.",
        caution: "The 9 g of carbs per 100 g surprises keto cooks who treat onion as a garnish — a whole caramelized onion in one bowl is real carbs; measure it like the ingredient it is.",
      },
      ar: {
        alternatives: "الشالوت الشقيق الألطف والأدق للتتبيلات؛ والكراث يحمل نكهة العائلة نفسها برفق في الشوربات؛ والبصل الأخضر ينهي الأطباق نيئًا حيث لا طبخ على الطاولة.",
        plan: "ابدأ أي طبق مالح تقريبًا بالطريقة نفسها — بصل مفروم في مقلاة مدهونة حتى يشفّ — فيرث باقي الوصفة العمق شبه مجانًا بأقل من 20 سعرة للحصة.",
        caution: "9 جم كربوهيدرات لكل 100 جم تفاجئ طباخي الكيتو الذين يعاملون البصل زينة — بصلة كاملة مكرملة في وعاء واحد كربوهيدرات حقيقية؛ قِسه كمكوّن لا كتجميل.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a medium onion?", a: "About 44 for 110 g — and most recipes spread one onion across four servings, which is why onion barely registers in any food log." },
        { q: "Why do onions make you cry?", a: "Cutting ruptures cells that release a sulfur compound into the air; chilling the onion first slows the chemistry, and a sharp knife ruptures fewer cells to begin with." },
        { q: "Do onions have carbs?", a: "9 g per 100 g — modest per slice, but a keto cook caramelizing three onions into one sauce has quietly added 27 g and should count them." },
      ],
      ar: [
        { q: "كم سعرة في بصلة متوسطة؟", a: "نحو 44 لكل 110 جم — وأغلب الوصفات توزع بصلة على أربع حصص، لهذا بالكاد يسجل البصل في أي سجل طعام." },
        { q: "لماذا يبكي البصل؟", a: "التقطيع يفجر خلايا تطلق مركب كبريتيًا في الهواء؛ وتبريد البصلة أولًا يبطئ الكيمياء، والسكين الحاد يفجر خلايا أقل من البداية." },
        { q: "هل في البصل كربوهيدرات؟", a: "9 جم لكل 100 جم — متواضعة للشريحة، لكن طباخ كيتو يكرمل ثلاث بصلات في صوص واحد أضاف خلسة 27 جم وعليه حسابها." },
      ],
    },
  },

  "zucchini": {
    intro: {
      en: "Zucchini is the squash diets would have invented: 17 kcal and 3.1 g of carbs per 100 g — so light that a whole medium one (120 g) costs 20 kcal. Its real role in fitness kitchens is impersonation: spiralized it becomes the noodle bed under pasta sauce, halved and hollowed it is a boat for minced meat, sliced lengthwise it stands in for lasagna sheets for everyone dodging bread's numbers. Unlike cucumber it survives cooking, taking on grill marks and soaking up tomato sauce like it was born for the job.",
      ar: "الكوسة قرعٌ كانت الحميات ستخترعه: 17 سعرة و3.1 جم كربوهيدرات لكل 100 جم — خفة تجعل حبة متوسطة كاملة (120 جم) تكلف 20 سعرة. ودورها الحقيقي في مطابخ اللياقة الانتحال: مبرومة تصبح فراش النودلز تحت صوص الباستا، ومشطوفة نصفين تصبح قاربًا للحم المفروم، ومقطوعة طوليًا تحل محل شرائح اللازانيا لكل من يتفادى أرقام الخبز. وبخلاف الخيار تنجو من الطبخ، تحمل علامات الشواء وتشرب صوص الطماطم كأنها وُلدت للوظيفة.",
    },
    context: {
      en: {
        alternatives: "Cucumber covers the raw-water slot; cauliflower rices into grains where zucchini noodles; eggplant takes the roasted-boat role with more body and more calories.",
        plan: "On a cut, swap 140 g of cooked pasta for 400 g of zoodles under the same sauce — you trade 221 kcal for 68 and the fork experience barely notices. On gains, zucchini boats hide extra olive oil gracefully.",
        caution: "Zoodles release water — salt them lightly and drain before saucing, or the plate floods; and giant «bargain» zucchinis are woodier and seedier than the small ones.",
      },
      ar: {
        alternatives: "الخيار يغطي خانة الماء النيء؛ والقرنبيط يُبرش حبوبًا حيث تتوحى الكوسة نودلز؛ والباذنجان يأخذ دور القارب المشوي بجسامة وسعرات أكثر.",
        plan: "في التنشيف، استبدل 140 جم باستا مطبوخة بـ400 جم كوسة مبرومة تحت الصوص نفسه — تقايض 221 سعرة بـ68 وتجربة الشوكة بالكاد تلاحظ. وفي التضخيم تخفي قوارب الكوسة زيت الزيتون الإضافي بأناقة.",
        caution: "الكوسة المبرومة تُطلق ماءً — ملّحها خفيفًا وصفّها قبل الصوص وإلا فاض الطبق؛ وكوسات «الصفقة» العملاقة أكثر خشونة وبذورًا من الصغيرة.",
      },
    },
    faq: {
      en: [
        { q: "Zucchini noodles vs pasta — what do I save?", a: "About 153 kcal per plate: 400 g of zoodles run 68 kcal where 140 g of cooked pasta runs 221, with the same sauce riding on top." },
        { q: "Is zucchini keto?", a: "Comfortably — 3.1 g of carbs per 100 g means even a 400 g zoodle bowl stays under 13 g before the sauce; it is the pasta-shaped answer keto was waiting for." },
        { q: "Why is my zucchini bitter?", a: "Stress-grown fruit concentrates cucurbitacins — rare in store-bought, common in garden gluts; a bitter one should be discarded, not cooked through." },
      ],
      ar: [
        { q: "نودلز الكوسة مقابل الباستا — ماذا أوفّر؟", a: "نحو 153 سعرة للطبق: 400 جم كوسة مبرومة تجري 68 سعرة حيث تجري 140 جم باستا مطبوخة 221، والصوص نفسه يركب فوقها." },
        { q: "هل الكوسة كيتو؟", a: "بارتياح — 3.1 جم كربوهيدرات لكل 100 جم تعني أن وعاء 400 جم يبقى تحت 13 جم قبل الصوص؛ إنها إجابة الباستا التي انتظرها الكيتو." },
        { q: "لماذا كوستي مُرّة؟", a: "الثمار المنهكة نموًا تركز الكوكوربيتاسين — نادر بالمشتريات وشائع في وفنات الحدائق؛ والمرة تُرمى ولا تُطهى للنهاية." },
      ],
    },
  },

  "cauliflower": {
    intro: {
      en: "Cauliflower is the master of disguise in the vegetable drawer: 25 kcal and 5 g of carbs per 100 g, keto-approved, and morphing into rice, pizza base, mash and even buffalo «wings» in the right hands. A 100 g cup of florets is one-fifth the carbs of the same weight of cooked rice while still reading as dinner. Eaten plain it is polite and faintly cabbage-like; roasted hard with olive oil and cumin until the edges brown, it converts skeptics. The florets' surface area is the whole trick — it grabs fat, spice and char better than almost anything.",
      ar: "القرنبيط سيد التنكر في درج الخضار: 25 سعرة و5 جم كربوهيدرات لكل 100 جم، معتمد بالكيتو، ويتحول إلى أرز وقاعدة بيتزا وبيوريه وحتى «أجنحة» بافلو بالأيدي المناسبة. كوب 100 جم من الزهرات هو خُمس كربوهيدرات الوزن نفسه من الأرز المطبوخ مع بقائه يُقرأ كعشاء. مأكولًا سادة مهذب وبطعم كرنب خفيف؛ ومشويًا بقوة بزيت الزيتون والكمون حتى تحمر الحواف، يصير الخضار الذي يحوّل المشككين. ومساحة سطح الزهرات هي الحيلة كلها — تمسك بالدهن والبهارة والفحم أفضل من أي شيء تقريبًا.",
    },
    context: {
      en: {
        alternatives: "Broccoli is the tree-shaped sibling with more protein per cup; zucchini noodles where pasta mimicry is the goal; cabbage shreds into the same slaw role cheaper.",
        plan: "Rice a head on Sunday: the florets blitz in seconds and the crumb reheats all week under curries and stir-fries at 25 kcal per 100 g. On gaining days, roast it in a full tablespoon of olive oil.",
        caution: "Boiling leaches its virtues into water nobody drinks — roast, steam or air-fry instead; and pre-riced bags spoil far faster than a whole head holds.",
      },
      ar: {
        alternatives: "البروكلي الشقيق الشجري الشكل ببروتين أكثر للكوب؛ والكوسة المبرومة حيث التقليد هدف؛ والكرنب يُبرش في دور الكول سلو نفسه بأرخص.",
        plan: "ابرش رأسًا يوم الأحد: الزهرات تُخفق في ثوانٍ والفتات يُعاد تسخينه الأسبوع كله تحت الكاري والقلي السريع عند 25 سعرة لكل 100 جم. وفي أيام التضخيم اشوهِه بملعقة كبيرة كاملة من زيت الزيتون.",
        caution: "السلق يذيب فضائله في ماء لا يشربه أحد — اشوِ أو ابخّر أو اقلِ بالهواء بدلًا منه؛ وأكياس المبروش الجاهز تفسد أسرع بكثير مما يصمد رأس كامل.",
      },
    },
    faq: {
      en: [
        { q: "Cauliflower rice vs white rice?", a: "25 versus 130 kcal per 100 g — swap the base under any curry and the same plate drops over a hundred calories without touching what makes it taste like dinner." },
        { q: "Does cauliflower have protein?", a: "A modest 1.9 g per 100 g — useful, never decisive; its job is replacing carbs and volume, and the protein should come from what rides on top." },
        { q: "Why do keto plans love cauliflower?", a: "Five grams of carbs per 100 g plus a chameleon texture — it is the closest thing to rice, mash and dough the carb budget can actually afford." },
      ],
      ar: [
        { q: "أرز القرنبيط أم الأرز الأبيض؟", a: "25 مقابل 130 سعرة لكل 100 جم — بدّل القاعدة تحت أي كاري فيهبط الطبق نفسه بأكثر من مئة سعرة دون مساس ما يجعله يتذوق كعشاء." },
        { q: "هل في القرنبيط بروتين؟", a: "1.9 جم متواضعة لكل 100 جم — مفيدة لا حاسمة أبدًا؛ وظيفته استبدال الكربوهيدرات والحجم، والبروتين يأتي مما يركب فوقه." },
        { q: "لماذا تحب خطط الكيتو القرنبيط؟", a: "خمسة جرامات كربوهيدرات لكل 100 جم مع قوام الحرباء — أقرب شيء للأرز والبيوريه والعجين تستطيع ميزانية الكربوهيدرات تحمله فعلًا." },
      ],
    },
  },

  "lettuce": {
    intro: {
      en: "Lettuce is the volume engine of every cutting phase: 15 kcal per 100 g — a two-cup serving (80 g) costs 12 kcal, meaning the entire head costs less than a single rice cake. Its 1.4 g of protein per 100 g is real but never the point; the point is the crunch, the water, and the fork activity that turns a bowl of chicken into a whole event. Romaine brings the structure wraps need; butter lettuce is the burger bun that saves a bread slice's 12 g of carbs. The dressing is where the calories actually live.",
      ar: "الخس محرك الحجم في كل مرحلة تنشيف: 15 سعرة لكل 100 جم — حصة الكوبين (80 جم) تكلف 12 سعرة، أي أن الرأس كاملًا أرخص من كيكة أرز واحدة. و1.4 جم بروتين لكل 100 جم فيه حقيقية لكنها ليست القصد أبدًا؛ القصد هو المقرمشية والماء ونشاط الشوكة الذي يحول وعاء دجاج إلى حدث كامل. والرومين يجلب البنية التي تحتاجها اللفائف؛ وخس الزبدة هو غلاف البرجر الذي يوفر 12 جم كربوهيدرات شريحة الخبز. والصوص هو حيث تسكن السعرات فعلًا.",
    },
    context: {
      en: {
        alternatives: "Cucumber delivers the water without the leaf structure; cabbage shreds hold up under hot fillings; spinach covers the same bowl with more micronutrients per leaf.",
        plan: "Butter-lettuce cups turn any minced-meat stir-fry into hand food with zero bread — two cups of the lettuce itself cost 12 kcal. On gaining days, lettuce is the burger's honest vehicle.",
        caution: "The dressing is the budget: two tablespoons of creamy ranch can carry more calories than the entire salad beneath it; lemon, vinegar and a measured spoon of oil are the honest ceiling.",
      },
      ar: {
        alternatives: "الخيار يوصل الماء دون بنية الورقة؛ والكرنب المبروش يصمد تحت الحشوات الساخنة؛ والسبانخ يغطي الوعاء نفسه بمغذيات أكثر للورقة.",
        plan: "أكواب خس الزبدة تحول أي قلي سريع باللحم المفروم إلى طعام يد بلا خبز — كوبان من الخس نفسه يكلفان 12 سعرة. وفي أيام التضخيم الخس هو مركبة البرجر الصادقة.",
        caution: "الصوص هو الميزانية: ملعقتان كبيرتان من الرانش الكريمي قد تحملان سعرات أكثر من السلطة كلها تحتهما؛ والليمون والخل وملعقة زيت مقيسة هي السقف الصادق.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in two cups of shredded lettuce?", a: "Twelve — for 80 g of crunch and fork-work; it is the cheapest volume in this entire library and the reason salads start here." },
        { q: "Is lettuce nutritious?", a: "Mildly — mostly water with small amounts of fiber, folate and vitamin K depending on the darkness of the leaf; it is a vehicle and a volume, never a multivitamin." },
        { q: "Which lettuce works for wraps?", a: "Butter lettuce and romaine hearts — their cupped, flexible leaves hold hot fillings without tearing; iceberg shatters where those two bend." },
      ],
      ar: [
        { q: "كم سعرة في كوبين من الخس المفروم؟", a: "اثنتا عشرة — مقابل 80 جم من المقرمشية وعمل الشوكة؛ إنه أرخص حجم بهذه المكتبة كلها وسبب بدء السلطات هنا." },
        { q: "هل الخس مغذٍ؟", a: "باعتدال — ماء بالأساس مع مقادير صغيرة من الألياف والفولات وفيتامين ك بحسب غمق الورقة؛ هو مركبة وحجم، لا فيتامين متعدد أبدًا." },
        { q: "أي خس يصلح للف؟", a: "خس الزبدة وقلوب الرومين — أوراقهما الكأسية المرنة تحمل الحشوات الساخنة دون تمزق؛ والآيسبرغ يتشظى حيث ينحني هذان." },
      ],
    },
  },

  "orange": {
    intro: {
      en: "An orange is the original vitamin-C delivery: 47 kcal and 12 g of carbs per 100 g, with the medium whole fruit (130 g) at 61 kcal and 2.4 g of fiber that juice strips away. That fiber is the difference between a snack and a blood-sugar blip — the fruit forces your jaw and gut to slow what a glass delivers in ten seconds. As the portable post-workout companion it has no rival: it survives a gym bag, needs no washing, and splits into segments that seem designed for shaking hands.",
      ar: "البرتقالة توصيل فيتامين سي الأصلي: 47 سعرة و12 جم كربوهيدرات لكل 100 جم، والثمرة الكاملة المتوسطة (130 جم) عند 61 سعرة و2.4 جم ألياف تجردها العصارة. تلك الألياف هي الفرق بين سناك وقفزة سكر دم — الثمرة تجبر فكك وأمعاءك على إبطاء ما يوصله كوب في عشر ثوان. وكنديب ما بعد التمرين المحمول لا منافس له: يصمد في حقيبة الجيم، ولا يحتاج غسلًا، وينشق فصوصًا تبدو مصممة للأيدي المرتجفة.",
    },
    context: {
      en: {
        alternatives: "A fresh-juice glass costs 112 kcal for the same weight with the fiber deleted; kiwi covers the vitamin-C slot smaller; mandarins are the travel-format sibling.",
        plan: "Pair one orange with a protein shake post-training — the fast carbs restock glycogen while the shake handles repair, and the whole duo stays under 250 kcal on a cut.",
        caution: "The 61 kcal belongs to the whole fruit — juicing three of them into one glass stacks 183 kcal of sugar-water without the chewing that slows it down.",
      },
      ar: {
        alternatives: "كوب العصير الطازج يكلف 112 سعرة للوزن نفسه والألياف محذوفة؛ والكيوي يغطي خانة فيتامين سي أصغر؛ واليوسفي الشقيق بصيغة السفر.",
        plan: "رافق برتقالة بمشروب بروتين بعد التدريب — الكربوهيدرات السريعة تعيد ملء الجلايكوجين والمشروب يتولى الإصلاح، والثنائي كاملًا يبقى تحت 250 سعرة في التنشيف.",
        caution: "61 سعرة تخص الثمرة كاملة — عصر ثلاث منها في كوب يكدس 183 سعرة من ماء السكر بلا مضغ يبطئها.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a medium orange?", a: "About 61 for 130 g of whole fruit — with 2.4 g of fiber riding along, which is exactly what the juiced version leaves behind." },
        { q: "Orange or juice — which one?", a: "The fruit, on every count that matters: same vitamin, retained fiber, and a jaw that stops you at one; a juice glass makes three oranges disappear unnoticed." },
        { q: "Can I eat an orange on a cut?", a: "Yes — it is one of the best sweet finishes a deficit allows: 61 kcal, real satiety from the chewing, and water volume that helps the evening feel finished." },
      ],
      ar: [
        { q: "كم سعرة في برتقالة متوسطة؟", a: "نحو 61 لكل 130 جم من الثمرة الكاملة — ومعها 2.4 جم ألياف، وهي بالضبط ما تتركه النسخة المعصورة خلفها." },
        { q: "برتقال أم عصير — أيهما؟", a: "الثمرة، في كل عدّ مهم: الفيتامين نفسه، والألياف محفوظة، وفك يوقفك عند واحدة؛ وكوب العصير يجعل ثلاث برتقالات تختفي بلا انتباه." },
        { q: "هل آكل برتقالة أثناء التنشيف؟", a: "نعم — من أفضل الخواتم الحلوة التي يسمح بها العجز: 61 سعرة، وإشباع حقيقي من المضغ، وحجم مائي يساعد المساء على الشعور بالاكتمال." },
      ],
    },
  },

  "mixed-berries": {
    intro: {
      en: "Mixed berries are dessert at produce pricing: 57 kcal and 14 g of carbs per 100 g with 3.6 g of fiber, deep color, and a sugar load (10 g) gentler than grapes' by a wide margin. A 150 g cup lands 86 kcal — the same mouthful of pleasure as a scoop of ice cream at a quarter of the energy. Frozen they are arguably better: cheaper, never moldy, and they turn a blender of yogurt and protein powder into something that eats like soft-serve. The mix is the strategy — each berry brings its own pigment family.",
      ar: "التوت المشكل حلوى بأسعار الخضار: 57 سعرة و14 جم كربوهيدرات لكل 100 جم مع 3.6 جم ألياف، ولون غامق، وحمل سكر (10 جم) ألطف بكثير من العنب. كوب 150 جم يهبط بـ86 سعرة — اللقمة نفسها من المتعة ككرة آيس كريم بربع الطاقة. ومجمدة أفضل حجةً: أرخص، لا تعفن أبدًا، وتحول خلاط الزبادي ومسحوق البروتين إلى شيء يُؤكل كالآيس كريم الطري. والخلطة نفسها هي الاستراتيجية — كل حبة تجلب عائلة صبغتها الخاصة إلى الوعاء.",
    },
    context: {
      en: {
        alternatives: "Strawberries run even lower per calorie; banana adds creaminess and potassium to blends; frozen mango covers the tropical direction at double the sugar.",
        plan: "The cutting dessert: a 150 g cup over Greek yogurt with a drizzle — under 150 kcal total and it closes the evening honestly. On gains, blend the same cup into the mass-shaker with oats.",
        caution: "«Dried berries» and berry-flavored products are different foods — drying concentrates the sugar toward dates territory, and the flavored aisle mostly never met the fruit.",
      },
      ar: {
        alternatives: "الفراولة تجري أخفض حتى لكل سعرة؛ والموز يضيف قوامًا كريميًا وبوتاسيومًا للخلطات؛ والمانجو المجمد يغطي الاتجاه الاستوائي بضعف السكر.",
        plan: "حلوى التنشيف: كوب 150 جم فوق زبادي يوناني برشة — تحت 150 سعرة إجمالًا وتغلق المساء بصدق. وفي التضخيم اخفق الكوب نفسه في الخلاط الكبير مع الشوفان.",
        caution: "«التوت المجفف» والمنتجات بنكهة التوت أطعمة أخرى — التجفيف يركز السكر نحو أراضي التمر، ورف النكهات لم يقابل الفاكهة أصلًا في الأغلب.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a cup of mixed berries?", a: "About 86 for 150 g — with 5.4 g of fiber and only 15 g of sugars, which is why the dessert recipes on this site start with them." },
        { q: "Frozen or fresh berries?", a: "Frozen wins on economics and calendar — picked ripe, locked at peak, immune to the fridge's three-day mold deadline; fresh wins only for eating out of hand." },
        { q: "Are berries good for fat loss?", a: "As good as sweet gets on a deficit: high water, real fiber, moderate sugar — the failure mode is what gets poured on top of them, never the berries." },
      ],
      ar: [
        { q: "كم سعرة في كوب توت مشكل؟", a: "نحو 86 لكل 150 جم — مع 5.4 جم ألياف و15 جم سكريات فقط، ولهذا تبدأ وصفات الحلوى بهذا الموقع منها." },
        { q: "توت مجمد أم طازج؟", a: "المجمد يفوز اقتصاديًا وتقويميًا — يُقطف ناضجًا ويُقفل في الذروة ويعصي مهلة العفن الثلاثية بالثلاجة؛ والطازج يفوز للأكل باليد فقط." },
        { q: "هل التوت جيد لخسارة الدهون؟", a: "بأفضل ما تصل إليه الحلاوة في عجز سعري: ماء كثير وألياف حقيقية وسكر معتدل — وطريقة الفشل هي ما يُسكب فوقها، لا التوت أبدًا." },
      ],
    },
  },

  "strawberry": {
    intro: {
      en: "Strawberries are the lowest-sugar sweet fruit in this library: 32 kcal, 7.7 g of carbs and only 4.9 g of sugars per 100 g. A full 152 g cup costs 49 kcal, which is why they anchor the dessert course of every fat-loss plan worth the name: over Greek yogurt with a drizzle, they end an evening without breaking the deficit. Their fragility is the only tax — buy them ripe, wash them just before eating, and freeze whatever the week will not finish for the smoothie jar.",
      ar: "الفراولة أقل الفواكه الحلوة سكرًا بهذه المكتبة: 32 سعرة و7.7 جم كربوهيدرات و4.9 جم سكريات فقط لكل 100 جم. كوب 152 جم كامل يكلف 49 سعرة، ولهذا ترسي على طبق الحلوى في كل خطة تنشيف تستحق الاسم: فوق زبادي يوناني برشة، تُنهي مساء دون كسر العجز. وهشاشتها هي الضريبة الوحيدة — اشترها ناضجة، واغسلها قبل الأكل مباشرة، وجمّد ما لن يُنهيه الأسبوع لبرطمان السموذي.",
    },
    context: {
      en: {
        alternatives: "Mixed berries cover the same bowl with more color variety; banana brings creaminess and sugar for training days; apple slices give the crunch direction raw.",
        plan: "The standard cutting dessert: 152 g of strawberries over 170 g of Greek yogurt — around 150 kcal together, with the protein doing the real closing shift.",
        caution: "Their shelf life is measured in days — refrigerate dry and unwashed, and slice off the soft spots early; chocolate-dipped strawberries are a dessert with a dessert's numbers.",
      },
      ar: {
        alternatives: "التوت المشكل يغطي الوعاء نفسه بتنوع لوني أكبر؛ والموز يجلب القوام الكريمي والسكر لأيام التدريب؛ وشرائح التفاح تعطي اتجاه المقرمشية نيئة.",
        plan: "حلوى التنشيف القياسية: 152 جم فراولة فوق 170 جم زبادي يوناني — نحو 150 سعرة معًا، والبروتين يقوم بنوبة الإغلاق الحقيقية.",
        caution: "عمرها الرفي يُقاس بأيام — برّدها جافة غير مغسولة، وقصّ البقع اللينة مبكرًا؛ والفراولة المغمسة بالشوكولاتة حلوى بأرقام الحلوى.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a cup of strawberries?", a: "About 49 for a generous 152 g cup — the widest dessert margin in the fruit drawer, at 4.9 g of sugars per 100 g." },
        { q: "Strawberries or banana for cutting?", a: "Strawberries, by a factor of three: 32 versus 89 kcal per 100 g — you eat nearly triple the weight for the same calories, and the sweetness survives." },
        { q: "How do I store strawberries?", a: "Refrigerated, dry and unwashed until the moment of eating — moisture launches the mold clock; hull and freeze the surplus for smoothies at almost no quality loss." },
      ],
      ar: [
        { q: "كم سعرة في كوب فراولة؟", a: "نحو 49 لكوب سخي 152 جم — أوسع هامش حلوى في درج الفواكه، عند 4.9 جم سكريات لكل 100 جم." },
        { q: "فراولة أم موز للتنشيف؟", a: "الفراولة بثلاثة أضعاف: 32 مقابل 89 سعرة لكل 100 جم — تأكل قرابة ثلاثة أضعاف الوزن بالسعرات نفسها، والحلاوة تبقى." },
        { q: "كيف أخزن الفراولة؟", a: "مبردة جافة غير مغسولة حتى لحظة الأكل — الرطوبة تشغل ساعة العفن؛ وأزل الأعناق وجمّد الفائض للسموذي بلا خسارة تُذكر." },
      ],
    },
  },

  "grapes": {
    intro: {
      en: "Grapes are nature's candy with the receipt attached: 69 kcal and 18 g of carbs per 100 g, of which 16 g is sugar — the highest sugar density in the fruit drawer alongside mango. A 150 g cup is 104 kcal that disappears in about ninety seconds, which is exactly why portion discipline matters more here than anywhere else in the bowl. Frozen, they transform: the sugar concentrates into little sorbet pellets that stretch a snack to twenty minutes. The dark skins carry the antioxidant family that made red wine famous for a decade.",
      ar: "العنب حلوى الطبيعة بإيصالها المرفق: 69 سعرة و18 جم كربوهيدرات لكل 100 جم، منها 16 جم سكر — أعلى كثافة سكر في درج الفواكه مع المانجو. كوب 150 جم هو 104 سعرة تختفي في نحو تسعين ثانية، وهذا بالضبط سبب أهمية انضباط الحصة هنا أكثر من أي مكان آخر في الوعاء. ومجمدة تتحول: السكر يتركز في حبيبات سوربيه صغيرة تمدد السناك إلى عشرين دقيقة. والقشور الداكنة تحمل عائلة مضادات الأكسدة التي أشهرت النبيذ الأحمر لعقد كامل.",
    },
    context: {
      en: {
        alternatives: "Berries deliver the pop-and-sweet experience at half the sugar; watermelon covers cold sweetness with water volume; apple segments give the slow-eating format grapes refuse.",
        plan: "On a cut, pre-portion 150 g into a bowl and freeze it — the thawing pace becomes the portion control. On gaining days, grapes blend into the mass-shaker unnoticed beside banana and oats.",
        caution: "The 0.9 g of fiber per 100 g is nearly nothing — nothing slows 16 g of sugar, so the bowl empties at snacking speed; weigh the portion before it becomes two.",
      },
      ar: {
        alternatives: "التوت يقدم تجربة الانفجار والحلاوة بنصف السكر؛ والبطيخ يغطي البرودة والحلاوة بحجم مائي؛ وقطاعات التفاح تعطي صيغة الأكل البطيء التي يرفضها العنب.",
        plan: "في التنشيف، وزّع 150 جم مسبقًا في وعاء وجمّدها — وتيرة الذوبان تصبح ضبط الحصة. وفي أيام التضخيم يُخفق العنب في الخلاط الكبير بلا انتباه بجوار الموز والشوفان.",
        caution: "0.9 جم ألياف لكل 100 جم لا شيء تقريبًا — لا شيء يبطئ 16 جم سكر، فالوعاء يفرغ بسرعة السناك؛ زِن الحصة قبل أن تصبح اثنين.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a cup of grapes?", a: "About 104 for 150 g — delicious and gone in seconds, which is the entire risk: the cup is a unit, not a suggestion." },
        { q: "Why don't grapes fill me up?", a: "Nearly zero fiber at 0.9 g per 100 g and a high sugar pace — they bypass every fullness signal on the way down; eat them as a planned portion, not an open bowl." },
        { q: "Are frozen grapes a real trick?", a: "Yes — freezing turns the same 104 kcal cup into a twenty-minute, sorbet-paced snack; the temperature does the portion control you forgot to." },
      ],
      ar: [
        { q: "كم سعرة في كوب عنب؟", a: "نحو 104 لكل 150 جم — لذيذ ومختفٍ في ثوان، وهذا هو الخطر كله: الكوب وحدة لا اقتراح." },
        { q: "لماذا لا يُشبعني العنب؟", a: "ألياف شبه معدومة عند 0.9 جم لكل 100 جم وسرعة سكر عالية — يتجاوز كل إشارات الشبع في طريقه للأسفل؛ كله كحصة مخططة لا وعاء مفتوح." },
        { q: "هل العنب المجمد حيلة حقيقية؟", a: "نعم — التجميد يحول كوب 104 سعرة نفسه إلى سناك بوتيرة سوربيه لعشرين دقيقة؛ الحرارة تقوم بضبط الحصة الذي نسيته." },
      ],
    },
  },

  "watermelon": {
    intro: {
      en: "Watermelon is the hydration fruit: 30 kcal and 8 g of carbs per 100 g, over ninety percent water by weight — a 280 g slice is 84 kcal of the most refreshing food a hot training day can offer. Its glycemic index is high and famously beside the point: the glycemic load of that whole slice stays modest because there is simply little sugar in each watery bite. Post-workout on a summer cut, cold watermelon competes with any engineered recovery snack for satisfaction — and wins on honesty.",
      ar: "البطيخ فاكهة الترطيب: 30 سعرة و8 جم كربوهيدرات لكل 100 جم، وأكثر من تسعين بالمئة ماء بالوزن — شريحة 280 جم هي 84 سعرة من أكثر طعام منعش يمكن ليوم تدريب حار أن يقدمه. ودليله الجلايسيمي مرتفع ومشهور بوقوفه خارج الجدل: الحمل الجلايسيمي للشريحة كاملة يبقى متواضعًا لأن السكر قليل ببساطة في كل لقمة مائية. وبعد التمرين في تنشيف صيفي، البطيخ البارد ينافس أي سناك استشفاء هندسيًا في الرضا — ويفوز بالصدق.",
    },
    context: {
      en: {
        alternatives: "Cucumber delivers the same cold-water crunch for savory plates; coconut water bottles the electrolytes without the eating; berries give the sweetness with fiber attached.",
        plan: "On a hot cut, a 280 g slice is the post-training reward at 84 kcal — water, sugar and volume arriving where a deficit usually collects its complaints.",
        caution: "The numbers belong to the red flesh — the rind-adjacent white part is blander but nearly identical nutritionally, and the seed-spitting contests are free cardio.",
      },
      ar: {
        alternatives: "الخيار يقدم المقرمشية المائية الباردة نفسها للأطباق المالحة؛ وماء جوز الهند يعبئ الإلكتروليتات بلا أكل؛ والتوت يعطي الحلاوة بألياف مرفقة.",
        plan: "في تنشيف حار، شريحة 280 جم هي مكافأة ما بعد التدريب عند 84 سعرة — ماء وسكر وحجم يصل حيث يجمع العجز شكواه عادة.",
        caution: "الأرقام تخص اللحم الأحمر — الجزء الأبيض المجاور للقشرة أميل للطفوح لكنه متطابق تغذويًا تقريبًا، ومسابقات بصق البذور كارديو مجاني.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a slice of watermelon?", a: "About 84 for a generous 280 g wedge — mostly water, 6 g of sugars per 100 g, and the closest thing to eating a cold drink." },
        { q: "Is watermelon too sugary?", a: "No — 6 g per 100 g is under half of grapes' 16; the high glycemic index gets quoted a lot, but a watery fruit simply cannot deliver much sugar per bite." },
        { q: "Is watermelon good after a workout?", a: "As a summer recovery it works — water for rehydration and fast sugar for glycogen, at 84 kcal a slice; it replaces the urge, not the protein shake." },
      ],
      ar: [
        { q: "كم سعرة في شريحة بطيخ؟", a: "نحو 84 لوتد سخي 280 جم — ماء بالأغلب، و6 جم سكريات لكل 100 جم، وأقرب شيء لأكل مشروب بارد." },
        { q: "هل البطيخ سكري أكثر من اللازم؟", a: "لا — 6 جم لكل 100 جم أقل من نصف الـ16 للعنب؛ ويُقتبس دليله الجلايسيمي المرتفع كثيرًا، لكن فاكهة مائية عاجزة ببساطة عن توصيل سكر كثير للقمة." },
        { q: "هل البطيخ جيد بعد التمرين؟", a: "كاستشفاء صيفي يعمل — ماء لإعادة الترطيب وسكر سريع للجلايكوجين، عند 84 سعرة للشريحة؛ إنه يستبدل الرغبة لا مشروب البروتين." },
      ],
    },
  },

  "pineapple": {
    intro: {
      en: "Pineapple is the tropical fruit with a working résumé: 50 kcal and 13 g of carbs per 100 g, carrying bromelain — a genuine protein-digesting enzyme family that survives fresh eating but not cooking, which is why it both tenderizes meat in marinades and stars in old recovery-bowl lore. A 165 g slice is 83 kcal with 1.4 g of fiber and more sweetness than almost anything at that price. Its 10 g of sugars per 100 g are real sugars, so a deficit still counts them — but as dessert, it dominates anything from a wrapper.",
      ar: "الأناناس الفاكهة الاستوائية بسيرة عمل حقيقية: 50 سعرة و13 جم كربوهيدرات لكل 100 جم، حاملة البروميلين — عائلة إنزيمات هاضمة للبروتين فعلية تنجو من الأكل الطازج لا من الطبخ، ولهذا ترقّق اللحم في التتبيلات وتتصدر حكايا أطباق الاستشفاء القديمة. شريحة 165 جم هي 83 سعرة مع 1.4 جم ألياف وحلاوة أكثر من أي شيء تقريبًا بهذا الثمن. و10 جم سكريات لكل 100 جم فيه سكريات حقيقية، فالعجز يظل يحسبها — لكن كحلوى، يهيمن على أي شيء يأتي من غلاف.",
    },
    context: {
      en: {
        alternatives: "Mango carries the tropical flag sweeter and softer; frozen pineapple chunks blend tangy for shakes; kiwi covers the enzyme-and-tang direction smaller and greener.",
        plan: "Post-training, a slice beside the shake covers fluids, fast carbs and the enzyme folklore at 83 kcal. On a cut it is the dessert that makes the plan survivable in summer.",
        caution: "Fresh over canned-in-syrup every time — the can's syrup adds a sugar layer the fresh numbers never carried; and eating it before it is ripe costs your mouth real irritation.",
      },
      ar: {
        alternatives: "المانجو يحمل العلم الاستوائي أحلى وأنعم؛ وقطعات الأناناس المجمد تُخفق بحموضة للمشروبات؛ والكيوي يغطي اتجاه الإنزيم والحموضة أصغر وأخضر.",
        plan: "بعد التدريب، شريحة بجوار المشروب تغطي السوائل والكربوهيدرات السريعة وحكايا الإنزيم عند 83 سعرة. وفي التنشيف هي الحلوى التي تجعل الخطة قابلة للعيش في الصيف.",
        caution: "الطازج على المعلب بالشراب كل مرة — شراب العلبة يضيف طبقة سكر لم تحملها أرقام الطازج أبدًا؛ وأكله قبل نضوجه يكلف فمك استثارة حقيقية.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a slice of pineapple?", a: "About 83 for a 165 g ring — tangy, sweet and watery enough that the eating itself slows you down more than grapes ever do." },
        { q: "Does bromelain really digest protein?", a: "It is a real enzyme family that breaks proteins down — the reason fresh pineapple tenderizes a marinade; cooking destroys it, and the recovery-bowl stories carry a kernel of chemistry." },
        { q: "Why does pineapple sting my mouth?", a: "That is the bromelain working on the lining of your mouth while you chew — fully ripe fruit carries less punch, and the sting is harmless for most people." },
      ],
      ar: [
        { q: "كم سعرة في شريحة أناناس؟", a: "نحو 83 لحلقة 165 جم — حامضة حلوة ومائية بما يكفي لأن الأكل نفسه يبطئك أكثر مما يفعله العنب أبدًا." },
        { q: "هل يهضم البروميلين البروتين فعلًا؟", a: "هي عائلة إنزيمات حقيقية تفكك البروتينات — سبب ترقيق الأناناس الطازج للتتبيلة؛ والطبخ يدمّرها، وحكايا أطباق الاستشفاء فيها نواة كيمياء." },
        { q: "لماذا يلسع الأناناس فمي؟", a: "هذا البروميلين يعمل على بطانة فمك وأنت تمضغ — الفاكهة الناضجة تمامًا أخف ضربة، واللسعة غير مؤذية لأغلب الناس." },
      ],
    },
  },

  "mango": {
    intro: {
      en: "Mango is the sweetest thing in this library's fruit drawer: 60 kcal and 15 g of carbs per 100 g, of which 14 g is sugar — dessert that arrives in its own peel. The medium whole fruit (200 g) is 120 kcal, two-thirds of a candy bar's load wearing fiber and vitamin A instead of guilt. In season, sliced over Greek yogurt, it is unbeatable; out of season, frozen chunks keep most of the argument. Portion awareness, not avoidance, is the play — half a mango finishes a meal beautifully.",
      ar: "المانجو أحلى ما في درج الفواكه بهذه المكتبة: 60 سعرة و15 جم كربوهيدرات لكل 100 جم، منها 14 جم سكر — حلوى تصل في قشرتها الخاصة. والثمرة الكاملة المتوسطة (200 جم) 120 سعرة، ثلثا حمل لوح الشوكولاتة بزيّ الألياف وفيتامين أ بدل الذنب. في الموسم، مقطعة فوق زبادي يوناني، لا تُقهر؛ وخارج الموسم تحتفظ القطعات المجمدة بأغلب الحجة. والوعي بالحصة لا التجنب هو اللعب — نصف مانجو يختم وجبة بجمال.",
    },
    context: {
      en: {
        alternatives: "Pineapple delivers tropical tang with less sugar; strawberries run half the calories; frozen mango chunks keep the smoothie direction honest year-round.",
        plan: "On a cut, half a fruit (100 g, 60 kcal) over yogurt is the dessert; on a bulk, the whole 200 g mango blends into the mass-shaker with oats and milk for a tropical 500 kcal glass.",
        caution: "The 14 g of sugars per 100 g is the fruit-drawer ceiling — delicious, but a whole large mango can clear 200 kcal the same way a candy bar does, only with fiber as a partial alibi.",
      },
      ar: {
        alternatives: "الأناناس يقدم الحموضة الاستوائية بسكر أقل؛ والفراولة تجري بنصف السعرات؛ وقطعات المانجو المجمدة تُبقي اتجاه السموذي صادقًا طوال العام.",
        plan: "في التنشيف، نصف ثمرة (100 جم و60 سعرة) فوق الزبادي هو الحلوى؛ وفي التضخيم، المانجو كاملة 200 جم تُخفق في الخلاط الكبير مع الشوفان والحليب لكوب استوائي 500 سعرة.",
        caution: "14 جم سكريات لكل 100 جم سقف درج الفواكه — لذيذة، لكن مانجو كبيرة كاملة قد تصفّي 200 سعرة كما يفعل لوح الشوكولاتة، فقط والألياف عذر جزئي.",
      },
    },
    faq: {
      en: [
        { q: "How many calories in a whole mango?", a: "About 120 for a medium 200 g fruit — a candy bar's neighborhood, which is why the half-fruit portion is the cutting standard." },
        { q: "Can I eat mango on a cut?", a: "Yes, in halves — 100 g costs 60 kcal and finishes a meal like nothing else at that price; the whole-fruit habit is where deficits quietly leak." },
        { q: "Is mango high in sugar?", a: "At 14 g per 100 g it tops this library's fruit drawer alongside grapes — real fruit sugar with fiber attached, but still the first place a strict budget looks." },
      ],
      ar: [
        { q: "كم سعرة في مانجو كاملة؟", a: "نحو 120 لثمرة متوسطة 200 جم — حي لوح الشوكولاتة، ولهذا حصة نصف الثمرة معيار التنشيف." },
        { q: "هل آكل مانجو أثناء التنشيف؟", a: "نعم، بأنصاف — 100 جم تكلف 60 سعرة وتختم وجبة كما لا يفعل شيء آخر بهذا الثمن؛ وعادة الثمرة الكاملة هي حيث تتسرب العجوز خلسة." },
        { q: "هل المانجو عالية السكر؟", a: "عند 14 جم لكل 100 جم تتصدر درج فواكه هذه المكتبة مع العنب — سكر فاكهة حقيقي بألياف مرفقة، لكنها مع ذلك أول مكان تنظر إليه الميزانية الصارمة." },
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

