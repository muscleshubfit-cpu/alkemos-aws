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

