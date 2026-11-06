/**
 * Food-collection depth content (guide + FAQ) — Phase SEO-GEO-5.2.
 * Scope: all 10 food collections (every one has library rows — no exempt
 * collections in this family).
 *
 * Every food named below is verified to exist in src/lib/foods.ts inside
 * the given collection's tag filter (anti-fabrication law). Nutrition
 * figures use established, rounded reference values (USDA-style) with
 "approximate" phrasing — never fabricated precision.
 */

import type { HubDepthContent } from "./hub-depth";

export const COLLECTION_DEPTH: Record<string, HubDepthContent> = {
  "high-protein-foods": {
    guideEn:
      "Protein is the raw material of every repair and growth process in the body: muscle tissue, enzymes, immune cells. It is also the most satiating macronutrient and the most expensive to digest — which is why high-protein eating helps muscle gain and fat loss alike. How much: sedentary adults do fine near 0.8 g per kg of bodyweight daily, while regular resistance training pushes the useful range toward 1.6–2.2 g/kg, spread across 3–4 meals.\n\n" +
      "This collection holds the protein leaders of the library — chicken breast (about 31 g protein per 100 g), lean beef, salmon, tuna, eggs and egg whites — alongside other dense picks, each with its full nutrition profile and serving data.\n\n" +
      "How to use it:\n" +
      "- Anchor every meal with one item from this collection (25–40 g protein per meal works well)\n" +
      "- Balance lean picks (chicken breast, egg whites) with fatty-acid sources (salmon, eggs)\n" +
      "- Set your personal target with the macro calculator, then build meals backwards from it",
    guideAr:
      "البروتين هو المادة الخام لكل عمليات الترميم والنمو في الجسم: النسيج العضلي، والإنزيمات، وخلايا المناعة. وهو أيضًا أكثر المغذيات الكبيرة إشباعًا وأغلاها هضمًا — ولهذا يساعد الأكل الغني بالبروتين في بناء العضل وخسارة الدهون معًا. الكمية: البالغون غير النشطين يكفيهم نحو 0.8 جم لكل كجم من وزن الجسم يوميًا، أما التدريب بالمقاومة المنتظم فيدفع النطاق المفيد نحو 1.6–2.2 جم/كجم موزعة على 3–4 وجبات.\n\n" +
      "تضم هذه المجموعة أبطال البروتين في المكتبة — صدر الدجاج (نحو 31 جم بروتين لكل 100 جم)، واللحم البقري قليل الدهن، والسلمون، والتونة، والبيض وبياض البيض — مع باقي الاختيارات الكثيفة، وكل منها بملفه الغذائي الكامل وبيانات حصته.\n\n" +
      "كيف تستخدمها:\n" +
      "- اجعل عنصرًا من هذه المجموعة مرساة كل وجبة (25–40 جم بروتين للوجبة يعمل جيدًا)\n" +
      "- وازن بين الاختيارات الخالية (صدر الدجاج، بياض البيض) ومصادر الأحماض الدهنية (السلمون، البيض)\n" +
      "- اضبط هدفك الشخصي بحاسبة الماكروز ثم ابنِ الوجبات رجوعًا منه",
    faq: [
      {
        qEn: "How much protein do I need per day?",
        aEn:
          "Two anchors: roughly 0.8 g per kg of bodyweight daily is the long-established baseline for generally active adults, and regular resistance training pushes the evidence-backed working range toward 1.6–2.2 g/kg. For a 75 kg trainee that is roughly 120–165 g daily, spread over 3–4 meals. Use our macro calculator for a personalized number, then let this collection fill it.",
        qAr: "كم أحتاج من البروتين يوميًا؟",
        aAr:
          "مرساتان: نحو 0.8 جم لكل كجم من وزن الجسم يوميًا هي خط الأساس الراسخ للبالغين نشيطي الحركة عمومًا، والتدريب المنتظم بالمقاومة يدفع النطاق المدعوم بالأدلة نحو 1.6–2.2 جم/كجم. لمتدرب وزنه 75 كجم يعني ذلك تقريبًا 120–165 جم يوميًا موزعة على 3–4 وجبات. استخدم حاسبة الماكروز لرقم مخصص ثم دع هذه المجموعة تملأه.",
      },
      {
        qEn: "What are the leanest high-protein foods?",
        aEn:
          "The lean champions in this collection: chicken breast (about 31 g protein per 100 g with minimal fat), tuna, egg whites (nearly pure protein), turkey breast, shrimp and tilapia. These let you hit aggressive protein targets without spending your fat or calorie budget — exactly what a cutting phase or a high-volume training block calls for.",
        qAr: "ما أخف الأطعمة الغنية بالبروتين دهونًا؟",
        aAr:
          "أبطال الخفة في هذه المجموعة: صدر الدجاج (نحو 31 جم بروتين لكل 100 جم بأقل الدهون)، والتونة، وبياض البيض (بروتين شبه خالص)، وصدر الديك الرومي، والجمبري، وسمك البلطي. هذه تتيح بلوغ أهداف بروتين طموحة دون صرف ميزانية الدهون أو السعرات — تمامًا ما يطلبه مرحلة التنشيف أو كتلة تدريب عالية الحجم.",
      },
      {
        qEn: "Do I need animal protein to build muscle?",
        aEn:
          "No — muscle builds from amino acids, whatever their source. Animal proteins arrive with complete profiles by default, while plant eaters cover completeness through daily variety, which the vegan and vegetarian collections organize. Total daily protein and progressive training decide results; the food kingdom you source them from is a preference, ethics and digestion decision, not a physiology barrier.",
        qAr: "هل أحتاج بروتين حيواني لبناء العضلات؟",
        aAr:
          "لا — العضلات تُبنى من الأحماض الأمينية أيا كان مصدرها. البروتينات الحيوانية تصل بمقاطع كاملة تلقائيًا، بينما يغطي آكلو النبات الاكتمال عبر التنويع اليومي الذي تنظمه مجموعتا النباتي الصرف والنباتي. إجمالي البروتين اليومي والتدريب المتدرج هما من يحددان النتائج؛ ومملكة طعامك مصدرُ تفضيلٍ وأخلاق وهضم، لا حاجز فسيولوجي.",
      },
      {
        qEn: "Can I eat too much protein?",
        aEn:
          "For healthy kidneys, high intakes are well tolerated — the practical ceiling is usefulness, not danger. Beyond roughly 2.2 g/kg daily, extra protein mostly displaces carbs and fats that fuel training, and pushes out food variety. There is also the honest budget note: protein is the priciest macro. Aim for your target range, not for maxing the scale on it.",
        qAr: "هل يمكن الإفراط في البروتين؟",
        aAr:
          "للكلى السليمة، الكميات العالية تُحتمل جيدًا — والسقف العملي هو النفع لا الخطر. فبعد نحو 2.2 جم/كجم يوميًا، يبدل البروتين الإضافي أغلب النشويات والدهون التي تُوقِد التدريب، ويزيح تنويع الطعام. وهناك ملاحظة الميزانية الصادقة أيضًا: البروتين أغلى المغذيات الكبيرة. استهدف نطاقك لا استطاعة الموازين فيه.",
      },
      {
        qEn: "Does protein timing matter — is there an anabolic window?",
        aEn:
          "Total daily intake is what the evidence weighs most; the so-called anabolic window is wider than gym legend suggests — hours, not minutes. A practical habit that covers you: 25–40 g of protein within a couple of hours after training, and evenly spaced meals across the day. Worry about hitting your daily total first; the timing details refine an already-correct plan.",
        qAr: "هل توقيت البروتين مهم — وهل هناك نافذة بنائية؟",
        aAr:
          "إجمالي الكمية اليومية هو ما تزنه الأدلة أكثر؛ والنافذة البنائية المزعومة أوسع مما توحي به أسطورة النادي الرياضي — ساعات لا دقائق. عادة عملية تكفيك: 25–40 جم بروتين خلال ساعتين بعد التدريب، ووجبات موزعة بانتظام عبر اليوم. انشغل أولًا ببلوغ إجماليك اليومي؛ تفاصيل التوقيت تُنقّح لخطة صحيحة أصلًا.",
      },
      {
        qEn: "How do I hit my protein target without meat?",
        aEn:
          "Eggs and dairy anchor the vegetarian collection, tofu and legumes anchor the vegan one, and both sit alongside grains that add meaningful amounts (oatmeal, whole-wheat bread, pasta). The strategy is stacking: each meal pairs a dense source (eggs, tofu) with a supportive one (bread, oatmeal). Numbers still decide — track one full day and adjust from there.",
        qAr: "كيف أبلغ هدفي من البروتين بلا لحم؟",
        aAr:
          "البيض ومنتجات الألبان مرساة المجموعة النباتية، والتوفو والبقوليات مرساة مجموعة النباتي الصرف، وكلاهما يجلس بجانب حبوب تضيف كميات معتبرة (الشوفان، خبز القمح الكامل، المكرونة). الاستراتيجية هي التراكم: كل وجبة تقرن مصدرًا كثيفًا (بيض، توفو) بمساند (خبز، شوفان). الأرقام ما تزال تحسم — تتبّع يومًا كاملًا واحدًا وعدّل من هناك.",
      },
    ],
  },

  "low-carb-foods": {
    guideEn:
      "Carbohydrates are the body's preferred fuel for hard training — which makes low-carb eating a tool, not a religion. Used deliberately, it compresses calorie budgets, steadies appetite, and suits days without intense training. Used blindly, it under-fuels the gym. The sensible frame: match carbohydrate intake to training demand rather than deleting a macronutrient.\n\n" +
      "This collection gathers the library's low-carbohydrate staples — chicken breast, lean beef, salmon, tuna, eggs and egg whites among them — protein-forward foods that anchor a low-carb day while the vegetables and fats you add around them carry texture and satiety.\n\n" +
      "How to use it:\n" +
      "- Build training days around protein + vegetables, and place denser carbs around sessions if you train hard\n" +
      "- Watch hidden carbs in sauces and drinks; the collection itself is clean\n" +
      "- If performance in the gym drops for over a week, reintroduce carbs before sessions — that signal matters more than any template",
    guideAr:
      "النشويات هي وقود الجسم المفضل للتدريب الشاق — وهذا يجعل الطعام قليل النشويات أداة لا عقيدة. المستخدمة بوعي، تخفّض ميزانية السعرات وتضبط الشهية وتناسب أيامًا بلا تدريب مكثف. والمستخدمة بعمى، تُجوّع تدريبك. الإطار الصائب: طابق تناول النشويات مع طلب التدريب بدل حذف المغذيات الكبيرة من قاموسك.\n\n" +
      "تجمع هذه المجموعة ركائز المكتبة قليلة النشويات — صدر الدجاج واللحم البقري قليل الدهن والسلمون والتونة والبيض وبياض البيض بينها — أطعمة بروتينية التوجه ترسو عليها يوم منخفض النشويات بينما تحمل الخضروات والدهون من حولها القوام والإشباع.\n\n" +
      "كيف تستخدمها:\n" +
      "- ابنِ أيام التدريب حول البروتين + الخضار، وضع النشويات الأكثف حول الجلسات إن كنت تتدرب بشدة\n" +
      "- راقب النشويات المخفية في الصلصات والمشروبات؛ المجموعة نفسها نظيفة\n" +
      "- إن تراجع أداؤك في النادي الرياضي أكثر من أسبوع، أعد النشويات قبل الجلسات — هذه الإشارة أهم من أي قالب",
    faq: [
      {
        qEn: "What actually counts as low carb?",
        aEn:
          "There is no single official threshold. Common working definitions: under 100–150 g daily for a general low-carb pattern, and under 50 g for ketogenic levels. What matters more than the label is the swap logic — replacing calorie-dense refined carbs with protein and vegetables, which this collection makes easy. Track a typical day first; most people discover their real intake is higher than they assumed.",
        qAr: "ما الذي يُعد فعلًا قليل النشويات؟",
        aAr:
          "لا عتبة رسمية واحدة. تعريفات عملية شائعة: أقل من 100–150 جم يوميًا لنمط منخفض عام، وأقل من 50 جم لمستويات الكيتوجينية. والأهم من التسمية منطق الاستبدال — تحويل النشويات المكررة الكثيفة السعرات إلى بروتين وخضار، وهذه المجموعة تسهّله. تتبّع يومًا نمطيًا أولًا؛ أغلب الناس يكتشفون أن تناولهم الحقيقي أعلى مما افترضوا.",
      },
      {
        qEn: "Is low carb better for weight loss?",
        aEn:
          "Calorie deficit decides weight loss — carbohydrate level decides how comfortably you reach it. Some people find low-carb eating naturally suppresses appetite and simplifies choices; others feel flat without carbs and adhere worse. The best diet for fat loss is the deficit you can keep. If low carb makes your deficit feel effortless, this collection is your toolbox; if not, eat the carbs and count them.",
        qAr: "هل قليل النشويات أفضل لخسارة الوزن؟",
        aAr:
          "العجز الحراري هو من يحسم خسارة الوزن — ومستوى النشويات يحدد مدى راحتك في بلوغه. يجد البعض أن الأكل قليل النشويات يكتم الشهية طبيعيًا ويبسّط القرارات؛ وآخرون يشعرون بالفراغ دونه ويتراجع التزامهم. أفضل نظام لخسارة الدهون هو العجز الذي تستطيع الاستمرار عليه. إن جعل قليل النشويات عجزك بلا جهد، فهذه المجموعة صندوق أدواتك؛ وإلا فكُل النشويات واحسبها.",
      },
      {
        qEn: "Can I train hard on a low-carb diet?",
        aEn:
          "For moderate-intensity training, most people adapt fine within a couple of weeks. For repeated high-intensity sessions — heavy squats, sprints, hard conditioning — performance often drops noticeably without carbohydrates, because those efforts burn glycogen. Practical compromise: keep general days low-carb and place a modest portion of carbs in the meal before and after hard sessions. Your gym log will tell you quickly which side of that line you sit on.",
        qAr: "هل أتدرب بشدة على نظام قليل النشويات؟",
        aAr:
          "للتدريب متوسط الشدة، يتأقلم أغلب الناس جيدًا خلال أسبوعين. وللجلسات المتكررة عالية الشدة — سكوات ثقيل، عدو سريع، تكييف عنيف — يتراجع الأداء غالبًا بوضوح دون نشويات، لأن تلك الجهود تحرق الغلايكوجين. حل وسط عملي: أبقِ الأيام العامة قليلة النشويات وضع حصة متوسطة منها في الوجبة قبل الجلسات الشاقة وبعدها. سجل جيمك سيخبرك سريعًا على أي جانب من ذلك الخط تجلس.",
      },
      {
        qEn: "What are the best low-carb protein sources?",
        aEn:
          "The backbone of this collection: chicken breast, salmon, tuna, lean beef and eggs — complete proteins with essentially no carbohydrate. Egg whites push the ratio furthest (protein with nothing else). Build each meal around one of these, add fiber-rich vegetables for volume, and the day lands low-carb almost by accident.",
        qAr: "ما أفضل مصادر البروتين قليلة النشويات؟",
        aAr:
          "العمود الفقري لهذه المجموعة: صدر الدجاج، والسلمون، والتونة، واللحم البقري قليل الدهن، والبيض — بروتينات كاملة بلا نشويات تقريبًا. وبياض البيض يدفع النسبة لأقصاها (بروتين لا شيء غيره). ابنِ كل وجبة حول أحدها، وأضف خضارًا غنية بالألياف للحجم، فيهبط اليوم قليل النشويات بالصدفة تقريبًا.",
      },
      {
        qEn: "Do I need carbs before a workout?",
        aEn:
          "It depends on the session and the person. Light-to-moderate training runs fine on a normal meal a couple of hours earlier. Heavy, long or high-intensity sessions benefit from carbs beforehand — performance, not health, is the question. Try both for two weeks each and compare your log; pre-workout carbs are a tool for hard days, not a universal law.",
        qAr: "هل أحتاج نشويات قبل التمرين؟",
        aAr:
          "يعتمد على الجلسة والشخص. التدريب الخفيف إلى المتوسط يسير جيدًا بوجبة عادية قبل ساعتين. أما الجلسات الثقيلة أو الطويلة أو عالية الشدة فتستفيد من النشويات قبلها — والسؤال أداء لا صحة. جرّب الاثنين أسبوعين لكل منهما وقارن سجلك؛ نشويات ما قبل التمرين أداة للأيام الشاقة لا قانون شامل.",
      },
      {
        qEn: "Which hidden carbs should I watch out for?",
        aEn:
          "The usual suspects: sauces and dressings (ketchup, sweet chili, most bottled dressings), flavored yogurts, juices and smoothies, lattes, and \"healthy\" granola or cereal portions. The foods in this collection are naturally low-carb; the carbs sneak in around them. Read labels for total carbohydrates per serving, and remember drinks — several daily glasses of juice can quietly out-carb an entire plate of rice.",
        qAr: "أي نشويات مخفية أنتبه لها؟",
        aAr:
          "المشتبه بهم المعتادون: الصلصات والتوابل السائلة (الكتشب، الشيلي الحلو، أغلب الدريسنغ المعلبة)، والزبادي المنكّه، والعصائر والعصائر المخفوقة، واللاتيه، وحصص الغرانولا أو الحبوب «الصحية». أطعمة هذه المجموعة قليلة النشويات طبيعيًا؛ والنشويات تتسلل حولها. اقرأ الملصقات لإجمالي النشويات لكل حصة، وتذكّر المشروبات — كأسان عصير يوميًا قد تتفوقان بهدوء على طبق أرز كامل.",
      },
    ],
  },

  "keto-friendly-foods": {
    guideEn:
      "The ketogenic diet keeps carbohydrates low enough — typically under 20–50 g net carbs daily — that the body shifts to burning fat and ketone bodies as its primary fuel. Ketoadaptation takes days to weeks, changes appetite patterns noticeably, and demands attention to electrolytes during the transition, because low insulin stores mean the body flushes water and minerals faster.\n\n" +
      "This collection holds the library's keto staples: chicken breast, salmon, tuna, eggs, shrimp and avocado among them — high-fat-capable proteins and fats that anchor a ketogenic day while keeping protein sufficient for training.\n\n" +
      "How to use it:\n" +
      "- Anchor meals with these proteins, then add fats (olive oil, avocado) and above-ground vegetables for volume\n" +
      "- Salt your food deliberately during the first two weeks; sodium loss causes most \"keto flu\" complaints\n" +
      "- Keep protein adequate (1.6–2.2 g/kg if training) — keto is not a protein-restriction diet",
    guideAr:
      "يُبقي النظام الكيتوجيني النشويات منخفضة بما يكفي — عادة تحت 20–50 جم صافي يوميًا — فيتحول الجسم لحرق الدهون وأجسام الكيتون وقودًا رئيسيًا. والتأقلم الكيتوني يأخذ أيامًا إلى أسابيع، ويغيّر أنماط الشهية بوضوح، ويتطلب انتباهًا للإلكتروليتات خلال الانتقال، لأن انخفاض مخازن الإنسولين يعني أن الجسم يغسل الماء والمعادن أسرع.\n\n" +
      "تحتفظ هذه المجموعة بركائز الكيتو في المكتبة: صدر الدجاج والسلمون والتونة والبيض والجمبري والأفوكادو بينها — بروتينات تحتمل الدهون العالية ودهونًا ترسو عليها يوم كيتوجيني مع إبقاء البروتين كافيًا للتدريب.\n\n" +
      "كيف تستخدمها:\n" +
      "- اجعل هذه البروتينات أساس الوجبات ثم أضف دهونًا (زيت زيتون، أفوكادو) وخضارًا فوق الأرض للحجم\n" +
      "- أضف الملح إلى طعامك بوعي خلال الأسبوعين الأولين؛ فقدان الصوديوم يسبب أغلب شكاوى «إنفلونزا الكيتو»\n" +
      "- أبقِ البروتين كافيًا (1.6–2.2 جم/كجم إن كنت تتدرب) — الكيتو ليس نظامًا لتقييد البروتين",
    faq: [
      {
        qEn: "What is the ketogenic diet in simple terms?",
        aEn:
          "A carbohydrate-restricted eating pattern — usually under 20–50 g net carbs per day — low enough that the body switches from glucose to fat-derived ketones as its main fuel. In practice: proteins and fats anchor every meal, starches and sugars nearly disappear, and above-ground vegetables provide fiber. It is a legitimate tool for appetite control and metabolic goals, not a magic state — calories still govern weight.",
        qAr: "ما النظام الكيتوجيني بعبارات بسيطة؟",
        aAr:
          "نمط أكل مقيّد النشويات — عادة تحت 20–50 جم صافي يوميًا — منخفض بما يكفي ليتحول الجسم من الجلوكوز إلى الكيتونات المشتقة من الدهون وقودًا رئيسيًا. عمليًا: بروتينات ودهون ترسو لكل وجبة، والنشويات والسكريات تكاد تختفي، وخضار فوق الأرض توفر الألياف. إنه أداة مشروعة للتحكم بالشهية والأهداف الأيضية، لا حالة سحرية — السعرات ما تزال تحكم الوزن.",
      },
      {
        qEn: "What is \"keto flu\" and how do I avoid it?",
        aEn:
          "The transitional cluster — headache, fatigue, irritability, lightheadedness — that some feel in the first week as the body sheds water and sodium with its emptied glycogen stores. Prevention is simple: drink water generously and salt food deliberately during weeks one and two (sodium loss causes most symptoms); potassium and magnesium from vegetables and supplements help. It passes within days to a week for most people.",
        qAr: "ما «إنفلونزا الكيتو» وكيف أتجنبها؟",
        aAr:
          "عنقود الانتقال — صداع وإرهاق وتهيّج ودوخة — يشعر به البعض في الأسبوع الأول بينما يُفرغ الجسم الماء والصوديوم مع مخازن الغلايكوجين. والوقاية بسيطة: اشرب الماء بسخاء وأضف الملح إلى الطعام بوعي خلال الأسبوعين الأولين (فقدان الصوديوم يسبب أغلب الأعراض)؛ ويساعد البوتاسيوم والمغنيسيوم من الخضار والمكملات. تزول خلال أيام إلى أسبوع لأغلب الناس.",
      },
      {
        qEn: "Which foods in this collection fit keto best?",
        aEn:
          "Eggs, salmon, tuna, shrimp, chicken breast and avocado are the collection's keto backbone: protein and fat with negligible carbs. Chicken and tuna lean toward the protein side, so pair them with added fats (olive oil, avocado) to keep the ketogenic ratio. The collection's 17 foods all fit the carb ceiling — your job is composing them into meals you actually enjoy.",
        qAr: "أي أطعمة هذه المجموعة تناسب الكيتو أكثر؟",
        aAr:
          "البيض والسلمون والتونة والجمبري وصدر الدجاج والأفوكادو هي العمود الفقري الكيتوني للمجموعة: بروتين ودهون بنشويات مهملة. يميل الدجاج والتونة لجانب البروتين، فاقرنهما بدهون مضافة (زيت زيتون، أفوكادو) للحفاظ على النسبة الكيتوجينية. أطعمة المجموعة الـ17 كلها تناسب سقف النشويات — ومهمتك تأليفها لوجبات تستمتع بها فعلًا.",
      },
      {
        qEn: "How long does it take to enter ketosis?",
        aEn:
          "Typically 2–4 days of strict carbohydrate restriction — faster with lower intake and activity, slower with higher reserves. Confirmation comes from breath or blood ketone testing rather than feelings, which lag behind the metabolic switch. Full performance adaptation, where training stops feeling flat, takes two or more weeks — plan lighter gym sessions into the first week rather than testing new personal records.",
        qAr: "كم يستغرق دخول الحالة الكيتوجينية؟",
        aAr:
          "عادة 2–4 أيام من التقييد الصارم للنشويات — أسرع بتقييد أدخل ونشاط أعلى، وأبطأ بمخازن أكبر. والتأكيد يأتي من فحص الكيتونات بالنفس أو الدم لا من الإحساس، الذي يتأخر عن التبديل الأيضي. أما التأقلم الكامل للأداء — حيث يتوقف التدريب عن الشعور بالفراغ — فيأخذ أسبوعين أو أكثر؛ فخطط جلسات صالة أخف للأسبوع الأول بدل اختبار أرقام قياسية جديدة.",
      },
      {
        qEn: "Does keto work for fat loss better than other diets?",
        aEn:
          "Trials comparing keto with moderate-carb deficits at equal protein find broadly similar fat loss — the ketogenic advantage shows up mainly in appetite control for some people. If ketosis makes eating fewer calories effortless for you, it is an excellent tool; if it makes social life and training miserable, it is the wrong tool. Choose the pattern that makes your deficit sustainable and let this collection do the shopping.",
        qAr: "هل الكيتو أفضل من الأنظمة الأخرى لخسارة الدهون؟",
        aAr:
          "تُجارب مقارنة الكيتو بعجز معتدل النشويات عند بروتين متساوٍ إلى فقدان دهون متشابه عمومًا — وميزة الكيتوجينية تظهر أساسًا في التحكم بالشهية عند بعض الناس. إن جعلت الحالة الكيتوجينية تناول سعرات أقل بلا جهد، فهي أداة ممتازة؛ وإن جعلت الحياة الاجتماعية والتدريب بؤسًا، فهي الأداة الخطأ. اختر النمط الذي يجعل عجزك مستدامًا ودع هذه المجموعة تُدير المشتريات.",
      },
      {
        qEn: "Can I build muscle on keto?",
        aEn:
          "Yes, with attention: keep protein at training levels (1.6–2.2 g/kg), eat enough total calories, and expect high-intensity performance to feel different until adapted. Studies on trained lifters show comparable muscle gain on well-formulated ketogenic diets, though some report easier volume on moderate-carb days. If strength stalls for weeks on keto, a targeted carb feed before hard sessions is the standard experiment.",
        qAr: "هل أبني عضلات على الكيتو؟",
        aAr:
          "نعم بانتباه: أبقِ البروتين على مستوى التدريب (1.6–2.2 جم/كجم)، وكُل سعرات كافية إجمالًا، وتوقّع أن يبدو الأداء عالي الشدة مختلفًا حتى التأقلم. تُظهر دراسات على رافعين مدرّبين نموًا عضليًا متكافئًا على أنظمة كيتوجينية جيدة التركيب، وإن ذكر البعض سهولة أكبر للحجم في أيام النشويات المعتدلة. وإن توقفت القوة أسابيع على الكيتو، فتغذية نشويات موجّهة قبل الجلسات الشاقة هي التجربة المعيارية.",
      },
    ],
  },

  "low-fat-foods": {
    guideEn:
      "Dietary fat is essential — hormones, vitamin absorption and cell membranes depend on it — so low-fat eating means trimming the excess, not erasing the macro. Fat carries 9 calories per gram versus 4 for protein and carbs, which makes fatty cuts and oils the fastest way to inflate a calorie budget unnoticed. Trimming that density while keeping protein high is exactly what low-fat eating is for.\n\n" +
      "This collection's 47 foods are the library's leanest: chicken breast, tuna, egg whites, turkey breast, shrimp and tilapia lead it — protein-dense foods whose fat content stays naturally low, no artificial trimming required.\n\n" +
      "How to use it:\n" +
      "- Keep a floor of healthy fats (roughly 20–35% of calories is the common guideline); add them deliberately — olive oil, nuts, fatty fish\n" +
      "- Use this collection to hold protein high while calories stay controlled\n" +
      "- Cook lean picks with methods that add no fat: grilling, baking, poaching, steaming",
    guideAr:
      "الدهون الغذائية ضرورية — الهرمونات وامتصاص الفيتامينات وأغشية الخلايا تعتمد عليها — لذا فالأكل قليل الدهون يعني تقليم الزائد لا محو المغذيات. تحمل الدهون 9 سعرات لكل جرام مقابل 4 للبروتين والنشويات، وهذا يجعل القطع الدهنية والزيوت أسرع طريق لتضخيم ميزانية السعرات دون ملاحظة. تقليم هذه الكثافة مع إبقاء البروتين عاليًا هو بالضبط غاية الأكل قليل الدهون.\n\n" +
      "أطعمة هذه المجموعة الـ47 هي الأخف في المكتبة: صدر الدجاج والتونة وبياض البيض وصدر الديك الرومي والجمبري وسمك البلطي في المقدمة — أطعمة كثيفة البروتين يبقى محتواها الدهني منخفضًا طبيعيًا بلا تقليم صناعي.\n\n" +
      "كيف تستخدمها:\n" +
      "- احتفظ بأرضية دهون صحية (نحو 20–35% من السعرات هي الإرشاد الشائع)؛ أضفها بوعي — زيت زيتون، مكسرات، سمك دهني\n" +
      "- استخدم هذه المجموعة لإبقاء البروتين عاليًا بينما تبقى السعرات متحكَّمة\n" +
      "- اطبخ الاختيارات الخالية بطرق تضيف لا دهون: شواء، فرن، سلق، بخار",
    faq: [
      {
        qEn: "Is fat bad for you?",
        aEn:
          "No — dietary fat is essential for hormone production, absorption of fat-soluble vitamins, and cell structure. The problem is excess, not existence: fat is the densest macro at 9 calories per gram, so low-fat eating is a calorie-control strategy, not a health ideology. Keep roughly 20–35% of calories from fat with emphasis on unsaturated sources, and let this collection handle the lean side of the plate.",
        qAr: "هل الدهون ضارة؟",
        aAr:
          "لا — الدهون الغذائية ضرورية لإنتاج الهرمونات وامتصاص الفيتامينات الذائبة في الدهون وبنية الخلايا. المشكلة الزيادة لا الوجود: الدهون أكثف المغذيات بـ9 سعرات للجرام، لذا فالأكل قليل الدهون استراتيجية تحكم حراري لا أيديولوجيا صحية. احتفظ بنحو 20–35% من السعرات دهونًا مع التركيز على المصادر غير المشبعة، ودع هذه المجموعة تدير الجانب الخالي من طبقك.",
      },
      {
        qEn: "What are the best low-fat, high-protein foods?",
        aEn:
          "This collection's leaders: chicken breast (about 31 g protein per 100 g at minimal fat), tuna, shrimp, tilapia, turkey breast and egg whites — the leanest protein sources the library tracks. They share a pattern: protein density with naturally low fat, which means large, filling portions inside a tight calorie budget.",
        qAr: "ما أفضل الأطعمة قليلة الدهون غنية البروتين؟",
        aAr:
          "قادة هذه المجموعة: صدر الدجاج (نحو 31 جم بروتين لكل 100 جم بأدنى دهون)، والتونة، والجمبري، وسمك البلطي، وصدر الديك الرومي، وبياض البيض — أخف مصادر البروتين التي تتبعها المكتبة. تشترك جميعها في نمط: كثافة بروتين بدهون منخفضة طبيعيًا، أي حصص كبيرة مُشبِعة داخل ميزانية سعرات ضيقة.",
      },
      {
        qEn: "Low fat or low carb for weight loss?",
        aEn:
          "Both work — controlled trials find no meaningful fat-loss difference at equal calories and protein. The deciding factor is personal adherence: some people feel lighter and more energetic on low fat, others on low carb. Pick the one that makes your daily eating feel easy, keep protein high either way, and hold the deficit. That trio outweighs any macro fashion.",
        qAr: "قليل الدهون أم قليل النشويات لخسارة الوزن؟",
        aAr:
          "كلاهما ينجح — التجارب المتحكمة لا تجد فرقًا ذا معنى في فقدان الدهون عند تساوي السعرات والبروتين. العامل الحاسم هو الالتزام الشخصي: يشعر البعض بالخفة والطاقة على قليل الدهون، وآخرون على قليل النشويات. اختر ما يجعل أكلك اليومي سهلًا، وأبقِ البروتين عاليًا في الحالتين، وثبّت العجز. هذه الثلاثية تتفوق على أي موضة مغذيات.",
      },
      {
        qEn: "How little fat is too little?",
        aEn:
          "Persistently below roughly 20% of calories invites problems: hormone production, fat-soluble vitamin absorption and skin health all draw on dietary fat. Practical floor for most adults is somewhere near 0.5–0.7 g per kg of bodyweight daily. If you train hard, sleep poorly and feel chronically flat on a very low-fat diet, the diet — not your motivation — is the prime suspect.",
        qAr: "كم من قلة الدهون يصبح قليلًا أكثر من اللازم؟",
        aAr:
          "الاستمرار تحت نحو 20% من السعرات يدعو للمشاكل: إنتاج الهرمونات وامتصاص الفيتامينات الدهنية وصحة الجلد كلها تستمد من الدهون الغذائية. والأرضية العملية لأغلب البالغين قرب 0.5–0.7 جم لكل كجم من الوزن يوميًا. وإن كنت تتدرب بشدة وتنام سيئًا وتشعر بالفراغ المزمن على نظام خالٍ جدًا من الدهون، فالنظام — لا حماسك — هو المشتبه الأول.",
      },
      {
        qEn: "Are egg whites better than whole eggs?",
        aEn:
          "Different tools. Egg whites are nearly pure protein — ideal for high-protein, low-fat targets, and this collection features them for that reason. Whole eggs carry the yolk's micronutrients, choline and healthy fats. Most trainees land on a mix: some whole eggs for nutrition, extra whites for volume. Neither is \"better\" — they answer different questions.",
        qAr: "هل بياض البيض أفضل من البيض الكامل؟",
        aAr:
          "أداتان مختلفتان. بياض البيض بروتين شبه خالص — مثالي لأهداف بروتين عالٍ ودهون منخفضة، وتبرزه هذه المجموعة لهذا السبب. والبيض الكامل يحمل مغذيات الصفار الدقيقة والكولين والدهون الصحية. يهبط أغلب المتدربين على خليط: بيض كامل للتغذية وبياض إضافي للحجم. لا «أفضل» بينهما — كل منهما يجيب سؤالًا مختلفًا.",
      },
      {
        qEn: "Which cooking methods keep fat low?",
        aEn:
          "Grilling, baking, poaching, steaming and air-frying keep added fat near zero while the food's own fat stays where it belongs. Frying multiplies calories by absorbing oil — a breaded fried chicken breast can carry triple the calories of the grilled one, same bird. Marinades, spices, citrus and herbs carry flavor without the oil, which is the low-fat cook's entire toolkit.",
        qAr: "أي طرق الطبخ تُبقي الدهون منخفضة؟",
        aAr:
          "الشواء والفرن والسلق والبخار والقلي الهوائي تُبقي الدهون المضافة قرب الصفر بينما يبقى دهن الطعام نفسه في مكانه. والقلي يضاعف السعرات بامتصاص الزيت — صدر دجاج مقلي ومغطس قد يحمل ثلاثة أضعاف سعرات المشوي، من الطائر نفسه. والتتبيلات والتوابل والحمضيات والأعشاب تحمل النكهة بلا الزيت، وهذا صندوق أدوات الطاهي قليل الدهون كله.",
      },
    ],
  },

  "vegan-protein-sources": {
    guideEn:
      "Plant-based eating covers protein needs completely when variety does the work: different plants carry different amino-acid profiles, and a day that mixes legumes, grains, soy and vegetables composes the full set without arithmetic at every meal. Add the environmental and ethical motivations many vegans hold, and the pattern becomes one of the fastest-growing ways of eating worldwide.\n\n" +
      "This collection's 51 plant-based foods include the anchors: tofu, oatmeal, potato, sweet potato, whole-wheat bread and pasta — protein-capable staples alongside energy-dense bases that make plant-based calories easy to reach.\n\n" +
      "How to use it:\n" +
      "- Hit the same protein targets as everyone else (1.6–2.2 g/kg for regular training) — plants change the sourcing, not the physiology\n" +
      "- Pair a dense source (tofu) with a supportive one (bread, oatmeal) at each meal\n" +
      "- Consider a B12 supplement — it is the one nutrient plant-only eating reliably lacks; a professional can confirm your needs",
    guideAr:
      "يغطي الأكل النباتي احتياجات البروتين كاملة حين يقوم التنويع بالعمل: النباتات المختلفة تحمل مقاطع أحماض أمينية مختلفة، ويوم يمزج البقوليات والحبوب والصويا والخضار يُركّب الطاقم الكامل بلا حسابات لكل وجبة. أضف الدوافع البيئية والأخلاقية التي يحملها كثير من النباتيين، فيصبح النمط واحدًا من أسرع طرق الأكل نموًا عالميًا.\n\n" +
      "تضم أطعمة هذه المجموعة النباتية الـ51 المراسيات: التوفو والشوفان والبطاطس والبطاطا الحلوة وخبز القمح الكامل والمكرونة — ركائز قادرة على البروتين بجانب قواعد كثيفة الطاقة تجعل الوصول إلى سعرات النظام النباتي أمرًا ميسورًا.\n\n" +
      "كيف تستخدمها:\n" +
      "- اسعَ إلى أهداف البروتين نفسها المعتادة (1.6–2.2 جم/كجم للتدريب المنتظم) — النبات يغيّر المصدر لا الفسيولوجيا\n" +
      "- اقرن مصدرًا كثيفًا (توفو) بمساند (خبز، شوفان) في كل وجبة\n" +
      "- فكّر في مكمّل B12 — إنه المغذّي الوحيد الذي ينقص الأكل النباتي الصرف بثبات؛ ويمكن لمختص تأكيد احتياجك",
    faq: [
      {
        qEn: "How do vegans get enough protein?",
        aEn:
          "The same way everyone does — by hitting a daily total — with plant sources doing the fetching: tofu and tempeh among the densest, legumes and lentils close behind, and grains like oatmeal and whole-wheat bread adding meaningful support. This collection's 51 foods are filtered exactly for that job. Track one typical day; most new vegans discover they are closer to their target than feared once meals are anchored.",
        qAr: "كيف يحصل النباتيون على بروتين كافٍ؟",
        aAr:
          "الطريقة نفسها المعتادة — ببلوغ إجمالٍ يومي — مع قيام المصادر النباتية بالجلب: التوفو والتيمبه الأكثف، والبقوليات والعدس على مقربة، وحبوب كالشوفان وخبز القمح الكامل تضيف مساندة معتبرة. أطعمة هذه المجموعة الـ51 مُرشّحة لهذه المهمة بالضبط. تتبّع يومًا نمطيًا واحدًا؛ يكتشف أغلب النباتيين الجدد قربهم من الهدف أكثر مما خشوا بمجرد ترسيخ الوجبات.",
      },
      {
        qEn: "Is plant protein complete?",
        aEn:
          "Some plants are complete on their own (soy stands out), while others run low in one or two essential amino acids. The old advice of careful combining at every meal has softened — current understanding favors daily variety: legumes plus grains across the day complete each other naturally. If your day contains tofu and oatmeal and bread and vegetables, the math resolves itself.",
        qAr: "هل بروتين النبات مكتمل؟",
        aAr:
          "بعض النباتات مكتملة وحدها (الصويا تبرز)، وبعضها منخفض في حمض أو اثنين أساسيين. والإرشاد القديم بالدمج الدقيق في كل وجبة تلطّف — والفهم الحالي يفضّل تنويع اليوم: بقوليات وحبوب عبر اليوم يكملان بعضهما طبيعيًا. إن ضمّ يومك توفو وشوفان وخبزًا وخضارًا، فقد حُلّت الحسابية من تلقاء نفسها.",
      },
      {
        qEn: "Do I need vegan protein powder?",
        aEn:
          "No — food first. Powder is a convenience: useful on high-target days, travel, or appetite-poor mornings, and unnecessary otherwise. If shakes help you hit 1.6–2.2 g/kg consistently, keep them; if your meals from this collection already land the number, save the money. The muscle cannot tell whether its amino acids arrived in a shaker or a bowl.",
        qAr: "هل أحتاج مسحوق بروتين نباتي؟",
        aAr:
          "لا — الطعام أولًا. المسحوق راحة: نافع في أيام الأهداف العالية والسفر وصباحات الشهية الفقيرة، وغير ضروري سواها. إن ساعدتك مخفوقات البروتين على بلوغ 1.6–2.2 جم/كجم بثبات، فأبقِ عليها؛ وإن كانت وجباتك من هذه المجموعة تبلغ الرقم أصلًا، فوفر المال. لا تستطيع العضلة تمييز وصول أحماضها الأمينية في قارورة خضّ أم في طبق.",
      },
      {
        qEn: "What are the best vegan foods for bulking?",
        aEn:
          "Calorie-dense staples carry the surplus: pasta, white and brown rice, oatmeal, potatoes and whole-wheat bread — all in this collection — provide train-friendly energy without enormous plate volume. Pair them with dense proteins (tofu, legumes) and fats (nuts, oils) and a 200–500 calorie surplus becomes two normal meals plus a snack rather than a force-feeding project.",
        qAr: "ما أفضل الأطعمة النباتية للتضخيم؟",
        aAr:
          "الركائز كثيفة السعرات تحمل الفائض: المكرونة والأرز الأبيض والبني والشوفان والبطاطس وخبز القمح الكامل — كلها في هذه المجموعة — تقدم طاقة صديقة للتدريب دون حجم أطباق هائل. اقرنها ببروتينات كثيفة (توفو، بقوليات) ودهون (مكسرات، زيوت) فيصير فائض 200–500 سعرة وجبتين عاديتين ووجبة خفيفة لا مشروع إطعام قسري.",
      },
      {
        qEn: "Which nutrients should vegans watch?",
        aEn:
          "The evidence-backed shortlist: vitamin B12 (supplementation is the standard, evidence-based recommendation for plant-only eaters), iron (pair plant iron with vitamin C for absorption), omega-3s (algae-based sources), and vitamin D depending on sun exposure. None of these make vegan eating impractical — they make it informed. A professional can check your levels and tailor the list.",
        qAr: "أي مغذيات يراقبها النباتيون؟",
        aAr:
          "القائمة المختصرة المدعومة بالأدلة: فيتامين B12 (المكمل هو التوصية المعيارية المدعومة بالأدلة لآكلي النبات الصرف)، والحديد (اقرن حديد النبات بفيتامين C للامتصاص)، وأوميغا-3 (مصادر الطحالب)، وفيتامين D بحسب تعرضك للشمس. لا شيء منها يجعل الأكل النباتي غير عملي — بل يجعله واعيًا. يستطيع مختص فحص مستوياتك وتخصيص القائمة.",
      },
      {
        qEn: "Can I build muscle on a vegan diet?",
        aEn:
          "Yes — muscle builds from total protein and progressive training, and plant sources deliver both. Studies on resistance-trained individuals show comparable hypertrophy when daily protein is matched, plant or animal. The practical requirements: hit 1.6–2.2 g/kg from dense sources like tofu and legumes, keep calories up (plants are filling — this collection's dense staples help), and train with the same progression as anyone else.",
        qAr: "هل أبني عضلات على نظام نباتي؟",
        aAr:
          "نعم — العضلات تُبنى من إجمالي البروتين والتدريب المتدرج، ومصادر النبات توفرهما. تُظهر دراسات على أفراد مدرّبين بالمقاومة تكافؤ التضخيم عند تساوي البروتين اليومي نباتًا كان أو حيوانًا. المتطلبات العملية: بلوغ 1.6–2.2 جم/كجم من مصادر كثيفة كالتوفو والبقوليات، وإبقاء السعرات مرتفعة (النبات مُشبِع — ركائز هذه المجموعة الكثيفة تساعد)، والتدريب بالتدرج نفسه المتبع لدى أي متدرب.",
      },
    ],
  },

  "vegetarian-protein-sources": {
    guideEn:
      "Vegetarian eating adds eggs and dairy back into the plant frame, and those two additions change the protein arithmetic substantially: eggs arrive with a complete amino-acid profile, dairy contributes dense protein in convenient forms, and the combination removes the one supplement conversation (B12) that strict plant-only eaters must have.\n\n" +
      "This collection's 62 foods lead with the anchors: eggs, tofu, oatmeal, potato, sweet potato and whole-wheat bread — a workable day built entirely from it needs no exotic ingredients and no protein powder.\n\n" +
      "How to use it:\n" +
      "- Anchor breakfast with eggs — the single easiest protein win of the day\n" +
      "- Use tofu and legumes for lunch and dinner volume, grains for energy\n" +
      "- Same targets as everyone: 1.6–2.2 g/kg for regular resistance training",
    guideAr:
      "يضيف الأكل النباتي البيض ومنتجات الألبان إلى الإطار النباتي، وهاتان الإضافتان تغيّران حسابات البروتين جوهريًا: البيض يصل بمقطع أحماض أمينية كامل، ومنتجات الألبان تسهم ببروتين كثيف بأشكال ميسّرة، والجمع يلغي حوار المكمّل الواحد (B12) الذي لا بد لآكلي النبات الصرف منه.\n\n" +
      "تتقدم أطعمة هذه المجموعة الـ62 المراسيات: البيض والتوفو والشوفان والبطاطس والبطاطا الحلوة وخبز القمح الكامل — يوم عملي مبني منها بالكامل بلا مكونات غريبة ولا مسحوق بروتين.\n\n" +
      "كيف تستخدمها:\n" +
      "- رسّ الإفطار بالبيض — أسهل كسب بروتين في اليوم على الإطلاق\n" +
      "- استخدم التوفو والبقوليات لحجم الغداء والعشاء، والحبوب للطاقة\n" +
      "- الأهداف نفسها المعتادة: 1.6–2.2 جم/كجم للتدريب المنتظم بالمقاومة",
    faq: [
      {
        qEn: "What is the difference between vegetarian and vegan protein?",
        aEn:
          "Vegetarian eating includes eggs and dairy alongside plants; vegan eating excludes all animal products. Practically, the vegetarian version gets complete protein from eggs and dairy by default and finds the daily target easier to reach — this collection's 62 foods versus 51 in the vegan one tells that story. Both hit the same physiological targets; the difference is convenience and sourcing.",
        qAr: "ما الفرق بين بروتين النباتي والنباتي الصرف؟",
        aAr:
          "الأكل النباتي يشمل البيض ومنتجات الألبان مع النبات؛ والنباتي الصرف يستبعد كل المنتجات الحيوانية. عمليًا، تحصل النسخة النباتية على بروتين كامل من البيض والألبان تلقائيًا وتبلغ الهدف اليومي بسهولة أكبر — أطعمة هذه المجموعة الـ62 مقابل 51 في مجموعة النباتي الصرف تحكي تلك القصة. كلاهما يبلغ الأهداف الفسيولوجية نفسها؛ والفرق راحةٌ ومصدر.",
      },
      {
        qEn: "Do vegetarians need more protein than meat eaters?",
        aEn:
          "The target is the same — around 1.6–2.2 g/kg for regular resistance training. Some research suggests plant proteins digest slightly less efficiently, which is a reason for a modest buffer and daily variety, not a different goalpost. Eggs and dairy being complete proteins, most lacto-ovo vegetarians sit comfortably in range once meals are anchored with them.",
        qAr: "هل يحتاج النباتيون بروتينًا أكثر من آكلي اللحم؟",
        aAr:
          "الهدف واحد — نحو 1.6–2.2 جم/كجم للتدريب المنتظم بالمقاومة. وتوحي بعض الأبحاث بأن بروتين النبات يُهضم بكفاءة أدنى قليلًا، وهذا سبب لهامش متواضع وتنويع يومي لا لهدف مختلف. والبيض والألبان بروتينات كاملة، فأغلب النباتيين (بالبيض والألبان) يجلسون داخل النطاق بارتياح بمجرد ترسيخ الوجبات بهما.",
      },
      {
        qEn: "Can vegetarians build muscle effectively?",
        aEn:
          "Absolutely — eggs, dairy, tofu and legumes deliver complete or complementary protein, and resistance training does not check the grocery receipt. Evidence on lacto-ovo vegetarians shows muscle gain comparable to omnivores at matched protein intake. Anchor meals with eggs and dairy, add tofu and legumes for volume, keep calories honest, and progress in the gym exactly as anyone would.",
        qAr: "هل يبني النباتيون عضلات بفعالية؟",
        aAr:
          "قطعًا — البيض والألبان والتوفو والبقوليات توفر بروتينًا كاملًا أو متكاملًا، والتدريب بالمقاومة لا يفحص فاتورة البقالة. الأدلة على النباتيين (بالبيض والألبان) تُظهر نموًا عضليًا متكافئًا مع آكلي كل شيء عند تساوي البروتين. اجعل البيض والألبان أساس الوجبات، وأضف التوفو والبقوليات للحجم، وأبقِ السعرات صادقة، وتدرّج في التدريب كما يفعل أي متدرب آخر.",
      },
      {
        qEn: "What are the best vegetarian protein foods in this collection?",
        aEn:
          "Eggs lead for completeness and convenience, tofu follows as the dense plant option, and dairy (where you include it) covers snacks and recovery meals. Grains — oatmeal, whole-wheat bread, pasta — carry meaningful supporting protein while doing their energy job. Compose any meal from these four groups and the day lands near target without effort.",
        qAr: "ما أفضل أطعمة البروتين النباتية في هذه المجموعة؟",
        aAr:
          "البيض يتقدم للاكتمال والسهولة، والتوفو يليه كخيار النبات الأكثف، والألبان (حيث تضمّنها) تغطي الوجبات الخفيفة والاستشفاء. والحبوب — الشوفان وخبز القمح الكامل والمكرونة — تحمل بروتينًا مساندًا معتبرًا وهي تؤدي وظيفة الطاقة. ألّف أي وجبة من هذه المجموعات الأربع فيهبط اليوم قرب الهدف بلا جهد.",
      },
      {
        qEn: "How do vegetarians get enough iron?",
        aEn:
          "Plant iron (non-heme) absorbs less efficiently than meat iron, but the fix is dietary pairing: vitamin C alongside the iron source multiplies absorption — vegetables or citrus with your lentils, tofu or fortified grains. Tea and coffee close to meals inhibit it, so separate them by an hour. If fatigue persists, ask a professional to check actual levels before supplementing blindly.",
        qAr: "كيف يحصل النباتيون على حديد كافٍ؟",
        aAr:
          "حديد النبات (غير الهيمي) يُمتص بكفاءة أدنى من حديد اللحم، لكن العلاج اقتران غذائي: فيتامين C بجانب مصدر الحديد يضاعف الامتصاص — خضار أو حمضيات مع عدسك أو التوفو أو الحبوب المدعّمة. والشاي والقهوة قرب الوجبات يعيقانه، فافصلهما بساعة. وإن استمر الإرهاق، فاطلب من مختص فحص المستويات الفعلية قبل المكمّلات العمياء.",
      },
      {
        qEn: "What does a high-protein vegetarian day look like?",
        aEn:
          "A workable template from this collection: eggs and oatmeal at breakfast; tofu with vegetables and rice or bread at lunch; a dairy snack (yogurt or cheese) mid-afternoon; lentils or tofu with potato and vegetables at dinner. Anchored like this, most vegetarians reach 1.6 g/kg comfortably — and the collection's food pages give you exact numbers per serving to fine-tune it.",
        qAr: "كيف يبدو يوم نباتي غني بالبروتين؟",
        aAr:
          "قالب عملي من هذه المجموعة: بيض وشوفان للإفطار؛ توفو مع خضار وأرز أو خبز للغداء؛ وجبة ألبان خفيفة (زبادي أو جبن) بعد الظهيرة؛ عدس أو توفو مع بطاطس وخضار للعشاء. بهذا التوزيع يبلغ أغلب النباتيين 1.6 جم/كجم بارتياح — وصفحات أطعمة المجموعة تمنحك الأرقام الدقيقة لكل حصة لتضبطها.",
      },
    ],
  },

  "foods-for-cutting": {
    guideEn:
      "A cutting phase is a calorie deficit held long enough to lose fat while training keeps the muscle underneath. Food choice serves that in two ways: protein protects muscle tissue and costs the most calories to digest, while low-calorie-density foods fill the plate and the stomach for few calories. This collection is filtered for exactly those two properties.\n\n" +
      "Its 28 foods lead with chicken breast, tuna, egg whites, turkey breast, shrimp and tilapia — lean proteins that let a deficit feel like eating rather than arithmetic suffering.\n\n" +
      "How to use it:\n" +
      "- Set the deficit first with the calorie calculator (a moderate 300–500 kcal daily deficit is the standard starting point)\n" +
      "- Anchor every meal with one food from here, 25–40 g protein each\n" +
      "- Fill remaining plate space with vegetables — volume is your hunger insurance\n" +
      "- Keep training heavy: the deficit is when the body needs the strongest reason to keep muscle",
    guideAr:
      "مرحلة التنشيف عجزٌ حراري يُستمر فيه طويلًا بما يكفي لفقدان الدهون بينما يحافظ التدريب على العضل تحتها. وخدمة اختيار الطعام لذلك تأتي من جهتين: البروتين يحمي النسيج العضلي ويكلّف أغلى سعرات في الهضم، والأطعمة قليلة الكثافة الحرارية تملأ الطبق والمعدة لسعرات قليلة. وهذه المجموعة مُرشّحة لهاتين الخاصيتين بالضبط.\n\n" +
      "تتقدم أطعمة هذه المجموعة الـ28 صدر الدجاج والتونة وبياض البيض وصدر الديك الرومي والجمبري وسمك البلطي — بروتينات خالية تجعل العجز يشبه الأكل لا المعاناة الحسابية.\n\n" +
      "كيف تستخدمها:\n" +
      "- اضبط العجز أولًا بحاسبة السعرات (عجز معتدل 300–500 سعرة يوميًا هو نقطة البداية المعيارية)\n" +
      "- رسّ كل وجبة بطعام من هنا، 25–40 جم بروتين لكل وجبة\n" +
      "- املأ باقي الطبق خضارًا — الحصيلة وثيقة تأمينك ضد الجوع\n" +
      "- أبقِ التدريب ثقيلًا: العجز هو حين يحتاج الجسم أقوى سبب لإبقاء العضل",
    faq: [
      {
        qEn: "What makes a food good for cutting?",
        aEn:
          "Two properties decide: high protein per calorie (protection and satiety) and low calorie density per volume (a full plate for few calories). Chicken breast, tuna, shrimp and egg whites exemplify both — 100+ grams of protein-rich food for 100–150 calories. Everything else in a cut (vegetables, portioned carbs and fats) arranges itself around that anchor.",
        qAr: "ما الذي يجعل طعامًا جيدًا للتنشيف؟",
        aAr:
          "خاصيتان تحسمان: بروتين مرتفع لكل سعرة (حماية وإشباع) وكثافة حرارية منخفضة لكل حجم (طبق ممتلئ لسعرات قليلة). صدر الدجاج والتونة والجمبري وبياض البيض نموذج للاثنين — أكثر من 100 جرام طعام غني بالبروتين بـ100–150 سعرة. وكل ما عداه في التنشيف (خضار، نشويات ودهون مقننة) يرتّب نفسه حول هذه المرساة.",
      },
      {
        qEn: "How large should my calorie deficit be?",
        aEn:
          "Moderate wins: 300–500 kcal below maintenance daily is the standard starting point, targeting roughly 0.5–1% of bodyweight lost per week. Aggressive deficits shed scale weight faster but cost muscle and adherence; gentle ones crawl. Calculate maintenance with our calorie calculator, subtract 300–500, adjust after two weeks of real-world data — the mirror and the log outrank the formula.",
        qAr: "ما حجم عجزي الحراري المناسب؟",
        aAr:
          "الاعتدال يفوز: 300–500 سعرة تحت إجمالي الصيانة يوميًا هي نقطة البداية المعيارية، بهدف فقدان نحو 0.5–1% من وزن الجسم أسبوعيًا. العجز العنيف يُسقط وزن الميزان أسرع لكنه يكلف عضلًا والتزامًا؛ واللطيف يزحف. احسب الصيانة بحاسبة السعرات، واطرح 300–500، وعدّل بعد أسبوعين من بيانات الواقع — المرآة والسجل يتفوقان على المعادلة.",
      },
      {
        qEn: "Which proteins are best during a cut?",
        aEn:
          "The leanest, densest ones this collection leads with: chicken breast, tuna, egg whites, shrimp, tilapia and turkey breast. They deliver maximum protein per calorie — the macro that both preserves muscle in a deficit and digests expensively enough to help satiety. Fattier proteins (salmon, beef) still fit; they simply cost more of a cutting calorie budget per gram of protein.",
        qAr: "أي البروتينات أفضل أثناء التنشيف؟",
        aAr:
          "الأخف والأكثف التي تتقدم بها هذه المجموعة: صدر الدجاج والتونة وبياض البيض والجمبري وسمك البلطي وصدر الديك الرومي. توفر أقصى بروتين لكل سعرة — المغذي الذي يحمي العضل في العجز ويكلّف هضمه بما يخدم الإشباع. والبروتينات الأعلى دهنًا (السلمون، اللحم البقري) ما تزال مناسبة؛ غير أن حصتها تكلّف ميزانية أكبر من ميزانية خسارة الدهون لكل جرام بروتين.",
      },
      {
        qEn: "Can I cut without feeling hungry all the time?",
        aEn:
          "Mostly, yes — hunger management is a design problem. Lean protein at every meal, vegetables for volume, water before and with meals, slower eating, and enough sleep (short sleep measurably raises hunger) cover most of it. Expect some hunger in a real deficit — that is normal and survivable — but constant ravenous hunger usually means the deficit is too aggressive or meals are built wrong.",
        qAr: "هل أنشف دون جوع دائم؟",
        aAr:
          "في الغالب نعم — إدارة الجوع مشكلة تصميم. بروتين خالٍ في كل وجبة، وخضار للحجم، وماء قبل الوجبات ومعها، وأكل أبطأ، ونوم كافٍ (النوم القصير يرفع الجوع بشكل مقيس) تغطي أغلب الأمر. توقّع جوعًا ما في عجز حقيقي — وهذا طبيعي ومحتمل — لكن الجوع المزمن المتوحش يعني عادة أن العجز عنيف أكثر من اللازم أو الوجبات مبنية خطأ.",
      },
      {
        qEn: "Should I do cardio or just diet for a cut?",
        aEn:
          "The deficit comes from the kitchen — no amount of cardio out-runs an unmanaged diet. Training's role in a cut is keeping muscle, which means lifting stays heavy. Cardio then serves as a flexible deficit tool: 2–4 weekly sessions of whatever you tolerate (walking counts) adds burn without touching recovery much. Use it to widen the deficit modestly, not to justify eating it back.",
        qAr: "أكارديو أم أكتفي بالنظام في التنشيف؟",
        aAr:
          "العجز يأتي من المطبخ — لا كمية كارديو تركض أمام نظام غير مُدار. ودور التدريب في التنشيف إبقاء العضل، وهذا يعني أن الرف يبقى ثقيلًا. ثم يعمل الكارديو أداة عجز مرنة: 2–4 جلسات أسبوعيًا مما تحتمله (المشي يُحتسب) تضيف حرقًا دون لمس الاستشفاء كثيرًا. استخدمه لتوسيع العجز باعتدال لا لتبرير أكل ما حرقته.",
      },
      {
        qEn: "How fast should I lose weight while cutting?",
        aEn:
          "The common guideline: 0.5–1% of bodyweight per week — for a 80 kg trainee, roughly 0.4–0.8 kg weekly. Faster losses look better on the scale and worse in the mirror (muscle leaves with the fat). Weigh daily under the same conditions, average the week, and adjust the deficit when the trend stalls for two-plus weeks. Speed that survives months beats speed that lasts days.",
        qAr: "ما سرعة فقدان الوزن السليمة في التنشيف؟",
        aAr:
          "الإرشاد الشائع: 0.5–1% من وزن الجسم أسبوعيًا — لمتدرب 80 كجم تقريبًا 0.4–0.8 كجم أسبوعيًا. الفقدان الأسرع يبدو أجمل على الميزان وأقبح في المرآة (العضل يرحل مع الدهون). زِن يوميًا بالشروط نفسها، واحسب متوسط الأسبوع، وعدّل العجز حين يتوقف الاتجاه أسبوعين فأكثر. السرعة التي تصمد شهورًا تتفوق على سرعة تدوم أيامًا.",
      },
    ],
  },

  "foods-for-bulking": {
    guideEn:
      "Bulking is the mirror of cutting: a deliberate calorie surplus held while progressive training converts the extra energy into muscle. The craft is in the size of the surplus — large enough to support growth, small enough that most of it does not become fat. A 200–500 kcal daily surplus is the standard working range; protein stays at training levels throughout.\n\n" +
      "This collection's 36 foods are filtered for the job: lean beef, salmon, ground beef (lean), white rice, brown rice and oatmeal lead it — energy-dense staples that make the surplus achievable without force-feeding, plus quality proteins to hold the muscle-building side.\n\n" +
      "How to use it:\n" +
      "- Calculate maintenance with the calorie calculator, then add 200–500 kcal\n" +
      "- Anchor protein as always (1.6–2.2 g/kg), then use rice, oatmeal and pasta to carry the surplus\n" +
      "- Weigh in weekly under fixed conditions; gain faster than ~0.5–1% bodyweight weekly and most of the extra is fat\n" +
      "- Sleep and progressive overload remain the actual muscle-building machinery — food only fuels them",
    guideAr:
      "التضخيم مرآة التنشيف: فائض حراري مقصود يُستمر فيه بينما يحوّل التدريب المتدرج الطاقة الزائدة إلى عضل. والحِرفة في حجم الفائض — كبير بما يكفي لدعم النمو، صغير بما يكفي ألا يصير أغلبه دهونًا. فائض 200–500 سعرة يوميًا هو النطاق العملي المعياري؛ والبروتين يبقى على مستوى التدريب طوال الوقت.\n\n" +
      "أطعمة هذه المجموعة الـ36 مُرشّحة للوظيفة: اللحم البقري قليل الدهن والسلمون واللحم المفروم الخالي والأرز الأبيض والبني والشوفان في المقدمة — ركائز كثيفة الطاقة تجعل الفائض قابلًا للبلوج دون إطعام قسري، مع بروتينات نوعية لحمل الجانب البنّاء للعضل.\n\n" +
      "كيف تستخدمها:\n" +
      "- احسب الصيانة بحاسبة السعرات ثم أضف 200–500 سعرة\n" +
      "- رسّ البروتين كالعادة (1.6–2.2 جم/كجم) ثم استخدم الأرز والشوفان والمكرونة لحمل الفائض\n" +
      "- زِن أسبوعيًا بشروط ثابتة؛ زيادة أسرع من ~0.5–1% من وزن الجسم أسبوعيًا تعني أن أغلب الزيادة دهون\n" +
      "- النوم والزيادة التدريجية يبقيان آلية بناء العضل الفعلية — الطعام يُوقدهما فقط",
    faq: [
      {
        qEn: "What does bulking actually mean?",
        aEn:
          "Eating more calories than you burn — deliberately and consistently — while resistance training signals the body to turn that surplus into muscle rather than storing it. The surplus is the building budget; training is the construction crew. Without the training signal, the same surplus simply becomes fat. Without the surplus, training signals a builder with no materials.",
        qAr: "ماذا يعني التضخيم فعلًا؟",
        aAr:
          "أكل سعرات أكثر مما تحرق — بوعي وباستمرار — بينما يُشير التدريب بالمقاومة للجسم أن يحوّل الفائض إلى عضل لا أن يخزّنه. الفائض ميزانية البناء؛ والتدريب طاقم التنفيذ. بلا إشارة التدريب، يصير الفائض نفسه دهونًا ببساطة. وبلا فائض، إشارة تدريب لبنّاء بلا مواد.",
      },
      {
        qEn: "Clean bulk or dirty bulk?",
        aEn:
          "The evidence and the mirror agree on a moderate approach. A controlled surplus of 200–500 kcal builds close to the maximum trainable muscle while adding minimal fat; pushing calories far beyond that accelerates fat gain without speeding muscle synthesis — the body's muscle-building machinery has a rate limit. \"Dirty\" bulking mostly buys a longer, harder cut afterwards.",
        qAr: "تضخيم نظيف أم قذر؟",
        aAr:
          "الأدلة والمرآة متفقان على المقاربة المعتدلة. فائض متحكَّم من 200–500 سعرة يبني قرب أقصى عضل قابل للتدريب مع إضافة دهون دنيا؛ ودفع السعرات أبعد من ذلك يُسرّع اكتساب الدهون دون تسريع تصنيع العضل — آلية بناء العضل في الجسم لها حد معدل. والتضخيم «القذر» يشتري أغلب الوقت تنشيفًا أطول وأصعب بعده.",
      },
      {
        qEn: "How much of a surplus do I need?",
        aEn:
          "Start at 200–500 kcal above maintenance daily — beginners and underweight trainees sit at the top of that range, experienced lifters near the bottom. Watch the weekly trend: gaining 0.25–0.5% of bodyweight per week means the surplus is working without overfeeding. Adjust in 100-kcal steps, not in pantry-sized jumps.",
        qAr: "كم فائضًا أحتاج؟",
        aAr:
          "ابدأ بـ200–500 سعرة فوق الصيانة يوميًا — المبتدئون وقليلو الوزن في أعلى ذلك النطاق، والرافعون المخضرمون قرب قاعه. راقب الاتجاه الأسبوعي: زيادة 0.25–0.5% من وزن الجسم أسبوعيًا تعني أن الفائض يعمل دون إطعام زائد. عدّل بخطوات 100 سعرة لا بقفزات بحجم خزانة المؤن.",
      },
      {
        qEn: "What are the best carbs for bulking?",
        aEn:
          "Trainable, digestible energy: white rice, brown rice, oatmeal, potatoes and pasta — the collection's carbohydrate backbone. They carry large calorie amounts without excessive volume or fiber that crowds out protein, which matters when appetite is the limiting factor. Place the denser servings around training, and the surplus stops feeling like a chore.",
        qAr: "ما أفضل النشويات للتضخيم؟",
        aAr:
          "طاقة قابلة للتدريب وهضم: الأرز الأبيض والبني، والشوفان، والبطاطس، والمكرونة — العمود النشوي لهذه المجموعة. تحمل كميات سعرات كبيرة دون حجم أو ألياف زائدة تزيح البروتين، وهذا مهم حين تكون الشهية هي العامل الحاكم. ضع الحصص الأكثف حول التدريب فيتوقف الفائض عن الشعور كواجب روتيني.",
      },
      {
        qEn: "How much protein do I need while bulking?",
        aEn:
          "The same 1.6–2.2 g/kg that governs every other phase — a surplus does not replace protein, it rides on top of it. Practical order of operations: set protein first, fill the remaining calorie budget with carbs and fats. The collection's lean staples (lean beef, salmon, ground beef) hold the protein line while rice and oatmeal carry the surplus.",
        qAr: "كم بروتينًا أحتاج أثناء التضخيم؟",
        aAr:
          "النطاق نفسه 1.6–2.2 جم/كجم الذي يحكم كل المراحل — الفائض لا يستبدل البروتين بل يركب فوقه. ترتيب العمليات العملي: اضبط البروتين أولًا، ثم املأ باقي ميزانية السعرات نشويات ودهون. ركائز المجموعة الخالية (اللحم البقري قليل الدهن، السلمون، المفروم الخالي) تحمل خط البروتين بينما يحمل الأرز والشوفان الفائض.",
      },
      {
        qEn: "How fast should I gain weight while bulking?",
        aEn:
          "Roughly 0.25–0.5% of bodyweight weekly — for a 70 kg trainee, about 0.2–0.35 kg per week. Beginners can sit at the top of the range; experienced lifters creep along the bottom, because trainable muscle gain slows as training age grows. Gaining faster mostly pre-pays your next cutting phase. Slow, boring, logged consistency is what muscle is built out of.",
        qAr: "ما سرعة زيادة الوزن السليمة في التضخيم؟",
        aAr:
          "نحو 0.25–0.5% من وزن الجسم أسبوعيًا — لمتدرب 70 كجم تقريبًا 0.2–0.35 كجم أسبوعيًا. المبتدئون يجلسون أعلى النطاق؛ والمخضرمون يتسللون قاعه، لأن مكسب العضل القابل للتدريب يتباطأ مع تقدم عمر التدريب. الزيادة الأسرع تسلّف أغلب تنشيفك القادم. الثبات البطيء الممل الموثّق هو ما يُبنى منه العضل.",
      },
    ],
  },

  "no-cook-foods": {
    guideEn:
      "Real life includes days without a kitchen: office lunches, travel, dorm rooms, or simply evenings when cooking is the last available energy. A no-cook food system is not a diet hack — it is infrastructure for eating well when conditions are poor. The principles stay ordinary: protein anchors, whole-grain bases, and something from the produce aisle.\n\n" +
      "This collection's 52 foods need zero heat: chicken breast (ready-cooked), tuna, whole-wheat bread, cereal, granola and avocado among them — enough variety to assemble breakfast, lunch and snacks without a single pan.\n\n" +
      "How to use it:\n" +
      "- Anchor each meal with a ready protein (tuna, pre-cooked chicken, eggs where available)\n" +
      "- Add a grain base (whole-wheat bread, cereal) and a fat source (avocado, nuts)\n" +
      "- Watch sodium on ready-to-eat items — rotate fresh options where you can\n" +
      "- Keep perishables refrigerated and mind storage guidance; convenience never outranks safety",
    guideAr:
      "الحياة الحقيقية تضم أيامًا بلا مطبخ: غداء المكتب، والسفر، وغرف السكن الجامعي، أو مجرد أمسيات يكون فيها الطبخ آخر طاقة متاحة. نظام الأكل بلا طهي ليس خدعة غذائية — إنه بنية تحتية للأكل جيدًا حين تكون الظروف سيئة. والمبادئ تبقى عادية: بروتين مرساة، وقواعد حبوب كاملة، وشيء من رف الخضار.\n\n" +
      "أطعمة هذه المجموعة الـ52 لا تحتاج حرارة: صدر الدجاج (مطبوخ جاهزًا)، والتونة، وخبز القمح الكامل، والحبوب، والغرانولا، والأفوكادو بينها — تنويع كافٍ لتأليف إفطار وغداء ووجبات خفيفة بلا قدر واحد.\n\n" +
      "كيف تستخدمها:\n" +
      "- رسّ كل وجبة ببروتين جاهز (تونا، دجاج مطبوخ مسبقًا، بيض حيثما توفر)\n" +
      "- أضف قاعدة حبوب (خبز قمح كامل، حبوب) ومصدر دهون (أفوكادو، مكسرات)\n" +
      "- راقب الصوديوم في الجاهزات — نوّع الخيارات الطازجة حيثما استطعت\n" +
      "- أبقِ سريعي التلف مبرّدين وانتبه لإرشادات التخزين؛ الراحة لا تتفوق أبدًا على السلامة",
    faq: [
      {
        qEn: "Are no-cook meals actually healthy?",
        aEn:
          "Health is a property of composition, not cooking temperature. Tuna with whole-wheat bread and vegetables outperforms most hot canteen meals; a granola-and-fruit bowl beats most vending machines. The watch-items are sodium in processed ready foods and the quality of the grain base — pick whole-grain versions and rotate fresh produce in, and no-cook becomes a legitimate daily system.",
        qAr: "هل الوجبات بلا طهي صحية فعلًا؟",
        aAr:
          "الصحة خاصية التركيب لا حرارة الطهي. التونة مع خبز القمح الكامل والخضار تتفوق على أغلب وجبات المطاعم الساخنة؛ وطبق غرانولا وفواكه يهزم أغلب ماكينات البيع. عناصر الانتباه هي الصوديوم في الجاهزات المصنعة وجودة قاعدة الحبوب — اختر نسخ الحبوب الكاملة وأدخل الخضار الطازجة، فيصير بلا طهي نظامًا يوميًا مشروعًا.",
      },
      {
        qEn: "What are the best no-cook protein sources?",
        aEn:
          "The collection's leaders: canned tuna, ready-to-eat chicken breast, eggs (boiled ahead or bought pre-boiled), and dairy-based options where available. Tuna is the classic for a reason — shelf-stable, dense, and affordable. Pair any of them with whole-wheat bread and you have a 25–30 g protein meal assembled in two minutes.",
        qAr: "ما أفضل مصادر البروتين بلا طهي؟",
        aAr:
          "قادة المجموعة: التونة المعلبة، وصدر الدجاج الجاهز للأكل، والبيض (مسلوق مسبقًا أو مشترى مسلوقًا)، وخيارات الألبان حيثما توفر. التونة كلاسيكية لسبب — تتحمل الرف، وكثيفة، وميسورة. اقرن أيًا منها بخبز القمح الكامل فتملك وجبة 25–30 جم بروتين مؤلَّفة في دقيقتين.",
      },
      {
        qEn: "What quick no-cook meals can I assemble?",
        aEn:
          "Three templates cover a day: breakfast — granola or cereal with milk or yogurt and fruit; lunch — tuna or ready chicken with whole-wheat bread, avocado and vegetables; snack — nuts, fruit, or a dairy cup. Same rules as cooked eating: protein anchor, grain base, produce. The collection exists so the assembly takes minutes, not decisions.",
        qAr: "أي وجبات سريعة أُلّفها بلا طهي؟",
        aAr:
          "ثلاثة قوالب تغطي يومًا: إفطار — غرانولا أو حبوب مع حليب أو زبادي وفواكه؛ غداء — تونا أو دجاج جاهز مع خبز قمح كامل وأفوكادو وخضار؛ وجبة خفيفة — مكسرات أو فواكه أو كوب ألبان. القواعد نفسها للأكل المطبوخ: مرساة بروتين، قاعدة حبوب، خضار وفواكه. المجموعة موجودة ليأخذ التأليف دقائق لا قرارات.",
      },
      {
        qEn: "Is canned tuna okay to eat regularly?",
        aEn:
          "As a protein convenience, yes — it is shelf-stable, lean and inexpensive. Two watch-items keep it honest: mercury (larger predatory fish accumulate more; rotating tuna with smaller fish and other proteins is the standard sensible advice) and sodium in brined varieties, solved by rinsing or choosing water-packed versions. For personalized frequency — especially in pregnancy — a professional's guidance applies.",
        qAr: "هل التونة المعلبة تصلح للأكل المنتظم؟",
        aAr:
          "كراحة بروتين، نعم — تتحمل الرف، وخالية، وميسورة. وعنصرا انتباه يُبقيانها صادقة: الزئبق (الأسماك المفترسة الكبيرة تتراكم أكثر؛ وتناوب التونة مع أسماك أصغر وبروتينات أخرى هو النصيحة العملية المعقولة) والصوديوم في الأنواع المملحة، ويُحل بالشطف أو اختيار المعلبة بالماء. وللتكرار المخصص — خصوصًا في الحمل — يُرجع لإرشاد مختص.",
      },
      {
        qEn: "How do I keep no-cook foods safe to eat?",
        aEn:
          "Refrigerate perishables within two hours of purchase or preparation, keep the cooler chain intact on travel days, respect the storage guidance on packaging, and when in doubt about anything — smell, texture, date — throw it out. A skipped meal costs minutes; food poisoning costs days. Convenience systems only work while the safety layer holds.",
        qAr: "كيف أحفظ أطعمة بلا طهي آمنة للأكل؟",
        aAr:
          "برّد سريعي التلف خلال ساعتين من الشراء أو التحضير، وأبقِ سلسلة التبريد سليمة أيام السفر، واحترم إرشادات التخزين على العبوة، وعند أي شك — رائحة، قوام، تاريخ — ارمه. وجبة ملغاة تكلف دقائق؛ والتسمم الغذائي يكلف أيامًا. أنظمة الراحة لا تعمل إلا ما دامت طبقة السلامة صامدة.",
      },
      {
        qEn: "Can I build a whole day of eating without cooking?",
        aEn:
          "Yes — the collection holds 52 options across every meal slot. Template: breakfast (cereal or granola with dairy and fruit), lunch (tuna or chicken with bread and avocado), snacks (nuts, fruit), dinner (ready protein with bread and vegetables). Track it once in the macro calculator and you will find a full, balanced day — no stove required.",
        qAr: "هل أبني يوم أكل كاملًا بلا طبخ؟",
        aAr:
          "نعم — المجموعة تحتفظ بـ52 خيارًا عبر كل فترات الوجبات. قالب: إفطار (حبوب أو غرانولا مع ألبان وفواكه)، غداء (تونا أو دجاج مع خبز وأفوكادو)، وجبات خفيفة (مكسرات، فواكه)، عشاء (بروتين جاهز مع خبز وخضار). تتبّعه مرة في حاسبة الماكروز وستجد يومًا كاملًا متوازنًا — بلا موقد.",
      },
    ],
  },

  "quick-prep-foods": {
    guideEn:
      "Quick-prep cooking is the middle path between restaurant dependence and meal-prep Sundays: foods that go from storage to plate in minutes with minimal equipment and no recipe. The category is defined by speed, not by compromise — eggs, tuna, rice and oatmeal are staples of elite nutrition programs, not shortcuts from one.\n\n" +
      "This collection's 15 foods are the fastest of the fast: tuna, eggs, egg whites, white rice, oatmeal and whole-wheat bread among them — each pairing into balanced meals in under ten minutes.\n\n" +
      "How to use it:\n" +
      "- Keep a permanent stock: eggs, canned tuna, rice, oatmeal, bread — the five-minute pantry\n" +
      "- Rice and oatmeal both cook well in the microwave in minutes\n" +
      "- Speed comes from repetition: two or three breakfasts and dinners you can make half-asleep\n" +
      "- Add one vegetable and one fruit daily and the system stays nutritionally complete",
    guideAr:
      "الطبخ السريع هو الطريق الأوسط بين التبعية للمطاعم وأحداث تحضير الوجبات الأسبوعية: أطعمة تنتقل من التخزين إلى الطبق في دقائق بأقل المعدات ودون وصفة. تُعرَّف الفئة بالسرعة لا بالتنازل — البيض والتونة والأرز والشوفان ركائز في برامج تغذية النخبة لا اختصارات عنها.\n\n" +
      "أطعمة هذه المجموعة الـ15 هي الأسرع بين السريعين: التونة والبيض وبياض البيض والأرز الأبيض والشوفان وخبز القمح الكامل بينها — كل منها يُقرن في وجبات متوازنة في أقل من عشر دقائق.\n\n" +
      "كيف تستخدمها:\n" +
      "- احتفظ بمخزون دائم: بيض، تونا معلبة، أرز، شوفان، خبز — مخزن الخمس دقائق\n" +
      "- الأرز والشوفان كلاهما يُطهى جيدًا في الميكروويف في دقائق\n" +
      "- السرعة تأتي من التكرار: إفطاران وعشائان تستطيع صنعهما وأنت نصف نائم\n" +
      "- أضف خضرة وفاكهة يوميًا فيبقى النظام مغذيًا كاملًا",
    faq: [
      {
        qEn: "What counts as quick prep?",
        aEn:
          "Minutes, not hours: a meal is quick-prep when its hands-on time is under ten minutes with no technique required. Eggs, canned tuna, microwave rice, oatmeal and bread define the category — which is why this collection holds the library's 15 fastest foods. If a recipe needs a shopping trip or a technique tutorial, it is a weekend project, not quick prep.",
        qAr: "ما الذي يُعد تحضيرًا سريعًا؟",
        aAr:
          "دقائق لا ساعات: الوجبة سريعة التحضير حين لا يتجاوز وقت العمل الفعلي فيها عشر دقائق بلا تقنية مطلوبة. البيض والتونة المعلبة والأرز بالميكروويف والشوفان والخبز هي التي تحدد الفئة — ولهذا تحتفظ هذه المجموعة بأسرع 15 طعامًا في المكتبة. وإن احتاجت الوصفة رحلة تسوق أو درس تقنية، فهي مشروع نهاية أسبوع لا تحضير سريع.",
      },
      {
        qEn: "Are quick meals less healthy than cooked ones?",
        aEn:
          "No — nutrition is a property of ingredients, not preparation time. An omelet with vegetables, tuna with rice, and oatmeal with fruit are quick meals that outrank most slow-cooked restaurant plates. The only genuine risk of speed is defaulting to processed convenience foods; this collection exists precisely so the fast option is also the good one.",
        qAr: "هل الوجبات السريعة أقل صحة من المطبوخة؟",
        aAr:
          "لا — التغذية خاصية المكونات لا زمن التحضير. عجة بالخضار، وتونا بالأرز، وشوفان بالفواكه وجبات سريعة تتفوق على أغلب أطباق المطاعم بطيئة الطهي. الخطر الحقيقي الوحيد للسرعة هو الوقوع الافتراضي في الجاهزات المصنعة؛ وهذه المجموعة موجودة بالضبط ليكون الخيار السريع أيضًا الخيار الجيد.",
      },
      {
        qEn: "What is the fastest high-protein meal?",
        aEn:
          "A tie between two classics: scrambled or boiled eggs with whole-wheat bread (about five minutes, complete protein plus grains), and canned tuna with rice or bread (about three minutes if the rice is ready). Both land 25–35 g of protein with ingredients that live permanently in the pantry. Add a fruit and the meal is done in every sense.",
        qAr: "ما أسرع وجبة عالية البروتين؟",
        aAr:
          "تعادل بين كلاسيكيتين: بيض مقلي أو مسلوق مع خبز القمح الكامل (نحو خمس دقائق، بروتين كامل مع حبوب)، وتونا معلبة مع أرز أو خبز (نحو ثلاث دقائق إن كان الأرز جاهزًا). كلتاهما تبلغ 25–35 جم بروتين بمكونات تسكن المخزن دائمًا. أضف فاكهة وانتهت الوجبة بكل المعاني.",
      },
      {
        qEn: "Is quick prep a replacement for meal prep?",
        aEn:
          "They are different tools. Meal prep batches hours into one weekly session — better for rigid schedules and portion control. Quick prep spends small daily minutes and adapts to appetite and plans — better for variable weeks. Many people run both: batch-prep two staples (rice, a protein) on Sunday, then quick-prep everything else fresh. Pick per week, not per ideology.",
        qAr: "هل التحضير السريع بديل عن تحضير الوجبات الأسبوعي؟",
        aAr:
          "أداتان مختلفتان. تحضير الوجبات يُجمّع الساعات في جلسة أسبوعية — أفضل للجداول الصارمة وضبط الحصص. والتحضير السريع ينفق دقائق يومية صغيرة ويتكيف مع الشهية والخطط — أفضل للأسابيع المتغيرة. يشغّل كثيرون الاثنين: حضّر ركيزتين (أرز، بروتين) يوم الأحد ثم جهّز الباقي طازجًا سريعًا. اختر لكل أسبوع لا لكل أيديولوجيا.",
      },
      {
        qEn: "Can rice and oatmeal really be made in the microwave?",
        aEn:
          "Both, reliably. Rice: one part rice to two parts water, covered, high power for 10–12 minutes then rested — fluffy without a pot. Oatmeal: oats and liquid at roughly 1:2, high for 2–3 minutes watching for overflow. Both are standard dorm-and-office techniques, and both land exactly where stovetop versions do nutritionally.",
        qAr: "هل الأرز والشوفان يُصنعان فعلًا في الميكروويف؟",
        aAr:
          "كلاهما، بثبات. الأرز: جزء أرز لجزأين ماء، مغطى، قدرة عالية 10–12 دقيقة ثم راحة — منفوش بلا قدر. الشوفان: شوفان وسائل بنحو 1:2، قدرة عالية 2–3 دقائق مع مراقبة الفيض. كلتاهما تقنية معيارية للسكن الجامعي والمكتب، وكلتاهما تهبط مغذيًا حيث تهبط نسختا الموقد تمامًا.",
      },
      {
        qEn: "How do I add variety to the same quick staples?",
        aEn:
          "Vary the accents, not the architecture: eggs become omelet, scramble or sandwich depending on the day; tuna shifts by seasoning — lemon-pepper, yogurt-based dressings, spices; rice and oatmeal accept different toppings weekly. Keep five or six flavor additions in rotation and the same fifteen-minute pantry produces a month of distinct meals.",
        qAr: "كيف أضيف تنويعًا لنفس الركائز السريعة؟",
        aAr:
          "غيّر التوابل لا الهندسة: البيض يصير عجة أو مخفوقًا أو ساندويتش بحسب اليوم؛ والتونة تتبدل بالتتبيل — ليمون وفلفل، صلصات أساسها زبادي، توابل؛ والأرز والشوفان يقبلان إضافات مختلفة كل أسبوع. احتفظ بخمس أو ست إضافات نكهة في التدوير فينتج المخزن نفسه شهرًا من الوجبات المتمايزة.",
      },
    ],
  },
};
