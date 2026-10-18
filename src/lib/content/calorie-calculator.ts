import type { ToolReference } from "./tool-reference";

/**
 * Calorie Calculator reference — Phase SEO-GEO-6.5 (§12.19 P1-6).
 * The calculator implements Mifflin-St Jeor with the standard activity
 * multipliers (1.2 / 1.375 / 1.55 / 1.725 / 1.9), a −500 deficit for
 * loss, a +400 surplus for gain, and a 40/30/30 macro preview — every
 * number in this copy matches the code (accuracy-to-code canaries pin
 * 1.2, 1.9, 500, 400, and the three named equations).
 */

export const CALORIE_CALCULATOR_CONTENT: ToolReference = {
  slug: "calorie-calculator",
  intro: {
    en: "This calorie calculator estimates your daily energy needs using the Mifflin-St Jeor equation — the research standard for predicting resting metabolism — and then adjusts the result for your activity level and goal. You get three numbers that work together: your BMR (the energy you burn at complete rest), your TDEE (the energy you burn in a normal day), and your daily calorie target for losing, maintaining, or gaining weight. Below the calculator you will find the complete reference: how each equation works, how to choose your activity level honestly, how fast you can safely lose or gain weight, calorie tables for common foods and exercises, and evidence-based answers to the questions people actually search for.",
    ar: "تحسب هذه الحاسبة احتياجك اليومي من الطاقة باستخدام معادلة Mifflin-St Jeor — المعيار البحثي المعتمد للتنبؤ بمعدل الأيض في حالة الراحة — ثم تُعدّل النتيجة وفق مستوى نشاطك وهدفك. تحصل على ثلاثة أرقام تعمل معاً: معدل الأيض الأساسي (BMR) وهو الطاقة التي تحرقها في راحة تامة، والإنفاق اليومي الكلي (TDEE) وهو الطاقة التي تحرقها في يوم عادي، والهدف اليومي من السعرات لخسارة الوزن أو تثبيته أو زيادته. وستجد أسفل الحاسبة المرجع الكامل: كيف تعمل كل معادلة، وكيف تختار مستوى نشاطك بصدق، وبأي سرعة يمكنك خسارة الوزن أو زيادته بأمان، وجداول سعرات لأشهر الأطعمة والتمارين، وإجابات مبنية على الأدلة للأسئلة التي يبحث عنها الناس فعلاً.",
  },
  sections: [
    {
      id: "what-are-calories",
      heading: {
        en: "What are calories, exactly?",
        ar: "ما هي السعرات الحرارية بالضبط؟",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "A calorie is a unit of energy. In nutrition, what we call a \"Calorie\" on food labels is technically a kilocalorie (kcal): the amount of energy needed to raise the temperature of one liter of water by one degree Celsius. When we say a banana contains about 89 calories, we mean your body can extract roughly 89 kcal of usable energy from it. Your body spends this energy on everything: keeping your heart beating, your lungs breathing, your brain thinking, your body warm, and your muscles moving.",
            ar: "السعرة الحرارية وحدة لقياس الطاقة. في علم التغذية، ما نسميه «سعرة» على ملصقات الأطعمة هو تقنياً كيلو سعرة (kcal): مقدار الطاقة اللازم لرفع حرارة لتر واحد من الماء درجةً مئوية واحدة. عندما نقول إن موزة تحتوي نحو 89 سعرة، فالمقصود أن جسمك يستخلص منها تقريباً 89 كيلو سعرة من الطاقة القابلة للاستخدام. ينفق جسمك هذه الطاقة في كل شيء: إبقاء القلب ينبض، والرئتين تتنفسان، والدماغ يفكر، والجسم دافئاً، والعضلات تتحرك.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The three macronutrients carry different amounts of energy per gram, known as the Atwater factors: protein and carbohydrates each provide about 4 kcal per gram, while fat provides about 9 kcal per gram — more than double. Alcohol provides 7 kcal per gram but is not a nutrient. This is why two meals of identical weight can have completely different calorie counts: 100 grams of cucumber is about 15 kcal, while 100 grams of olive oil is 884 kcal. Energy density, not just portion size, determines the total.",
            ar: "تحمل المغذيات الكبرى الثلاث مقادير مختلفة من الطاقة لكل غرام، وتُعرف هذه القيم بعوامل Atwater: البروتين والكربوهيدرات يوفر كل منهما نحو 4 كيلو سعرة للغرام، بينما توفر الدهون نحو 9 كيلو سعرة للغرام — أي أكثر من الضعف. أما الكحول فيوفر 7 كيلو سعرة للغرام لكنه ليس مغذياً. لهذا يمكن لوجبتين بالوزن نفسه أن تحملا عدد سعرات مختلفاً تماماً: 100 غرام من الخيار نحو 15 سعرة، بينما 100 غرام من زيت الزيتون 884 سعرة. كثافة الطاقة، لا حجم الحصة وحده، هي ما يحدد الإجمالي.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Energy balance is the master variable of body weight. If you consistently eat fewer calories than you burn, your body draws the difference mainly from stored fat and you lose weight; if you consistently eat more, you store the surplus and gain weight. Everything else — meal timing, carb cycling, exotic foods — modifies the margins of that equation, not the equation itself. Getting your personal numbers right is therefore the single highest-leverage step in any nutrition plan, which is exactly what this calculator does.",
            ar: "توازن الطاقة هو المتغير الحاكم لوزن الجسم. إذا تناولت باستمرار سعرات أقل مما تحرق، سحب جسمك الفارق أساساً من الدهون المخزنة فخسرت وزناً؛ وإذا تناولت أكثر، خزّن الفائض فزاد وزنك. كل ما عدا ذلك — توقيت الوجبات، تناوب الكربوهيدرات، الأطعمة الاستثنائية — يعدّل هوامش هذه المعادلة لا المعادلة نفسها. لذا فإن معرفة أرقامك الشخصية بدقة هي الخطوة الأعلى أثراً في أي خطة تغذية، وهذا بالضبط ما تقوم به هذه الحاسبة.",
          },
        },
      ],
    },
    {
      id: "how-it-works",
      heading: {
        en: "How this calorie calculator works",
        ar: "كيف تعمل هذه الحاسبة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The calculation runs in three steps. First, the calculator computes your BMR (Basal Metabolic Rate) from your weight, height, age, and sex using the Mifflin-St Jeor equation. Second, it multiplies your BMR by the activity factor you select — from 1.2 for a sedentary day to 1.9 for an athlete's training load — to produce your TDEE (Total Daily Energy Expenditure). Third, it adjusts the TDEE for your goal: minus 500 kcal for fat loss, plus 400 kcal for weight gain, or unchanged for maintenance. It also converts your final target into a starter macro split of 40% carbohydrates, 30% protein, and 30% fat, which you can refine with the dedicated macro calculator.",
            ar: "يجري الحساب في ثلاث خطوات. أولاً تحسب الحاسبة معدل الأيض الأساسي (BMR) من وزنك وطولك وعمرك وجنسك باستخدام معادلة Mifflin-St Jeor. ثانياً تضرب BMR في معامل النشاط الذي تختاره — من 1.2 ليوم خامل إلى 1.9 لحمل تدريب رياضي محترف — لتحصل على الإنفاق اليومي الكلي (TDEE). ثالثاً تعدّل الـ TDEE وفق هدفك: ناقص 500 سعرة لخسارة الدهون، زائد 400 سعرة لزيادة الوزن، أو كما هو للتثبيت. كما تحوّل هدفك النهائي إلى توزيع ماكروز افتتاحي من 40% كربوهيدرات و30% بروتين و30% دهون، يمكنك تنقيحه لاحقاً بحاسبة الماكروز المخصصة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The inputs matter more than most people expect. Use your real, current weight — not the one from your last doctor visit two years ago. Measure height without shoes. For age, enter your age in years. If you are unsure which activity level describes you, resist the temptation to round up: overestimating activity is the most common cause of a calculator telling someone to eat more than they actually burn. When in doubt, pick the lower level; you can always adjust after two weeks of real-world scale data.",
            ar: "المدخلات أهم مما يتوقع معظم الناس. استخدم وزنك الحالي الحقيقي — لا وزن زيارتك الأخيرة للطبيب قبل عامين. قس الطول بلا حذاء. وفي العمر أدخل سنيك كاملة. إن لم تتعيّن أي مستوى نشاط يصفك، قاوم إغراء المبالغة: المبالغة في تقدير النشاط هي السبب الأشيع لاحتساب الحاسبة لشخصٍ أن يأكل أكثر مما يحرق فعلاً. عند الشك اختر المستوى الأدنى؛ يمكنك التعديل دائماً بعد أسبوعين من بيانات الميزان الواقعية.",
          },
        },
        {
          kind: "p",
          text: {
            en: "A note on units: the calculator works in metric (kilograms and centimeters) and converts internally. If you think in pounds and inches, convert first (1 kg = 2.2 lb, 1 inch = 2.54 cm) — small unit errors produce large calorie errors because weight and height both feed the equation directly.",
            ar: "ملاحظة عن الوحدات: تعمل الحاسبة بالنظام المتري (كيلوغرام وسنتيمتر) وتحوّل داخلياً. إن كنت تفكر بالرطل والإنش فحوّل أولاً (1 كجم = 2.2 رطل، 1 إنش = 2.54 سم) — فأخطاء الوحدات الصغيرة تنتج أخطاء سعرات كبيرة لأن الوزن والطول كليهما يدخلان المعادلة مباشرة.",
          },
        },
      ],
    },
    {
      id: "bmr-equations",
      heading: {
        en: "The BMR equations: Mifflin-St Jeor vs Harris-Benedict vs Katch-McArdle",
        ar: "معادلات معدل الأيض الأساسي: Mifflin-St Jeor مقابل Harris-Benedict مقابل Katch-McArdle",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Scientists have proposed many equations to predict resting metabolism from simple body measurements. Three of them dominate the field, and this calculator uses the one with the best evidence behind it. Understanding all three helps you know exactly what your number does and does not represent.",
            ar: "اقترح العلماء معادلات عديدة للتنبؤ بأيض الراحة من قياسات جسم بسيطة، وتهيمن ثلاث منها على المجال، وهذه الحاسبة تستخدم صاحبة أقوى أدلة منها. معرفة الثلاث معاً تساعدك على فهم ما يمثله رقمك بالضبط وما لا يمثله.",
          },
        },
        {
          kind: "h3",
          text: {
            en: "1. Mifflin-St Jeor (1990) — used by this calculator",
            ar: "1. معادلة Mifflin-St Jeor (1990) — التي تستخدمها هذه الحاسبة",
          },
        },
        {
          kind: "p",
          text: {
            en: "For men: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5. For women: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161. In validation studies against indirect calorimetry (the laboratory gold standard that measures breath gases), Mifflin-St Jeor predicts resting metabolism within roughly 10% for most adults — the best accuracy of any equation that needs nothing more than a scale and a tape measure. That is why it became the default recommendation in clinical nutrition reviews, and why this site uses it.",
            ar: "للذكور: BMR = 10 × الوزن(كجم) + 6.25 × الطول(سم) − 5 × العمر + 5. للإناث: BMR = 10 × الوزن(كجم) + 6.25 × الطول(سم) − 5 × العمر − 161. في دراسات التحقق مقابل القياس الحراري غير المباشر (المعيار المختبري الذهبي الذي يقيس غازات النفس)، تنبأت Mifflin-St Jeor بأيض الراحة في حدود 10% تقريباً لمعظم البالغين — وهي أدق دقة بين المعادلات التي لا تحتاج أكثر من ميزان وشريط قياس. لهذا غدت التوصية الافتراضية في مراجعات التغذية الإكلينيكية، ولهذا يستخدمها هذا الموقع.",
          },
        },
        {
          kind: "h3",
          text: {
            en: "2. Harris-Benedict (1919, revised 1984) — the historic classic",
            ar: "2. معادلة Harris-Benedict (1919، المنقحة 1984) — الكلاسيكية التاريخية",
          },
        },
        {
          kind: "p",
          text: {
            en: "The original Harris-Benedict equations were published in 1919 from laboratory measurements on a few hundred subjects; Roza and Shizgal revised the constants in 1984. The revised version for men reads: BMR = 88.362 + 13.397 × weight(kg) + 4.799 × height(cm) − 5.677 × age; for women: BMR = 447.593 + 9.247 × weight(kg) + 3.098 × height(cm) − 4.330 × age. The problem is drift: the populations measured a century ago were smaller and leaner per kilogram than today's, so Harris-Benedict systematically overestimates energy needs in modern adults — often by 5% or more. Many popular websites still use it, which is one reason their numbers run higher than ours for the same inputs.",
            ar: "نُشرت معادلتا Harris-Benedict الأصليتان عام 1919 من قياسات مخبرية على بضع مئات من الأشخاص؛ ثم نقّح Roza و Shizgal ثوابتَها عام 1984. النسخة المنقحة للذكور: BMR = 88.362 + 13.397 × الوزن(كجم) + 4.799 × الطول(سم) − 5.677 × العمر؛ وللإناث: BMR = 447.593 + 9.247 × الوزن(كجم) + 3.098 × الطول(سم) − 4.330 × العمر. المشكلة هي الانحراف: فالأشخاص الذين قياسوا قبل قرن كانوا أنحف لكل كيلوغرام من الناس اليوم، لذا تبالغ Harris-Benedict منهجياً في تقدير احتياجات الطاقة للبالغين المعاصرين — غالباً بنسبة 5% أو أكثر. ما تزال مواقع شائعة كثيرة تستخدمها، وهذا أحد أسباب كون أرقامها أعلى من أرقامنا للمدخلات نفسها.",
          },
        },
        {
          kind: "h3",
          text: {
            en: "3. Katch-McArdle — the lean-mass specialist",
            ar: "3. معادلة Katch-McArdle — متخصصة الكتلة العضلية",
          },
        },
        {
          kind: "p",
          text: {
            en: "Katch-McArdle computes BMR from lean body mass alone: BMR = 370 + 21.6 × LBM(kg), where LBM = body weight × (1 − body fat percentage). Metabolically, lean mass is what actually burns energy — fat tissue is comparatively inert — so this equation is the most precise of the three for people who know their body fat percentage: muscular athletes, people who have done a DEXA scan or a reliable body-composition measurement. Its weakness is practical: most people do not know their body fat percentage, and a guessed value imports that error straight into the result.",
            ar: "تحسب Katch-McArdle معدل الأيض من الكتلة العضلية وحدها: BMR = 370 + 21.6 × الكتلة العضلية(كجم)، حيث الكتلة العضلية = وزن الجسم × (1 − نسبة دهون الجسم). فأيضياً، الكتلة العضلية هي ما يحرق الطاقة فعلاً — إذ نسيج الدهون شبه خامل — لذا تُعد هذه المعادلة الأدق بين الثلاث لمن يعرف نسبة دهونه: الرياضيين العضليين، ومن أجرى مسح DEXA أو قياساً موثوقاً لتكوين الجسم. ضعفها عملي: فمعظم الناس لا يعرفون نسبة دهونهم، وأي قيمة مُخمَّنة تنقل خطأها مباشرة إلى النتيجة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The accuracy commentary, in one paragraph: every equation above is a statistical estimate fitted to populations, not a measurement of you. Real individual metabolisms scatter around these predictions because of genetics, muscle mass, brown fat activity, hormonal status, and measurement noise. Treat your calculated number as a starting hypothesis with about a 10% confidence band, then let two to three weeks of scale and intake data confirm or correct it. That discipline beats switching between calculators hoping for a different answer.",
            ar: "تعليق الدقة في فقرة واحدة: كل معادلة مما سبق تقديرٌ إحصائي مضبوط على مجتمعات، لا قياسٌ لجسمك أنت. فالأيض الفردي الحقيقي يتوزع حول هذه التنبؤات بفعل الوراثة والكتلة العضلية ونشاط الدهون البنية والحالة الهرمونية وضجيج القياس. تعامل مع رقمك المحسوب كفرضية أولية بهامش ثقة نحو 10%، ثم دع أسبوعين إلى ثلاثة من بيانات الميزان والاستهلاك تؤكدها أو تصححها. هذا الانضباط أفضل من التنقل بين الحاسبات طلباً لإجابة مختلفة.",
          },
        },
      ],
    },
    {
      id: "activity-levels",
      heading: {
        en: "Activity levels: the multiplier that matters most",
        ar: "مستويات النشاط: المضاعف الأكثر أثراً",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Your BMR only covers existence. Everything above it — walking to work, training, fidgeting, digesting food — is stacked on top through an activity multiplier. The calculator uses the five standard factors shown in the table below. The gap between the lowest and the highest is 58% of your entire daily budget, which is why honest selection here changes the result more than any other single input.",
            ar: "يغطي معدل الأيض الأساسي الوجودَ وحده. وكل ما فوقه — المشي إلى العمل، والتدريب، والحركة اللاواعية، وهضم الطعام — يُضاف إليه عبر مضاعف النشاط. تستخدم الحاسبة المعاملات القياسية الخمسة في الجدول أدناه. والفارق بين الأدنى والأعلى يبلغ 58% من ميزانيتك اليومية كلها، ولهذا فإن الاختيار الصادق هنا يغيّر النتيجة أكثر من أي مدخل آخر منفرد.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "The five activity factors used by the calculator",
              ar: "معاملات النشاط الخمسة التي تستخدمها الحاسبة",
            },
            columns: [
              { en: "Level", ar: "المستوى" },
              { en: "Typical week", ar: "الأسبوع النموذجي" },
              { en: "Factor", ar: "المعامل" },
            ],
            rows: [
              {
                en: ["Sedentary", "Desk job, little or no exercise", "1.2"],
                ar: ["خامل", "عمل مكتبي، رياضة قليلة أو معدومة", "1.2"],
              },
              {
                en: ["Lightly active", "Exercise 1–3 days/week", "1.375"],
                ar: ["نشاط خفيف", "تمرين 1–3 أيام/أسبوع", "1.375"],
              },
              {
                en: ["Moderately active", "Exercise 3–5 days/week", "1.55"],
                ar: ["نشاط متوسط", "تمرين 3–5 أيام/أسبوع", "1.55"],
              },
              {
                en: ["Very active", "Hard exercise 6–7 days/week", "1.725"],
                ar: ["نشاط عالٍ", "تمرين شاق 6–7 أيام/أسبوع", "1.725"],
              },
              {
                en: ["Extra active", "Athlete: 2×/day or physical job", "1.9"],
                ar: ["نشاط شديد جداً", "رياضي: مرتان يومياً أو عمل بدني", "1.9"],
              },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "Three honest rules for choosing. First, count only deliberate exercise and genuinely physical work — a 20-minute stroll is real but small, and most people over-credit it. Second, if your week varies (for example three gym days plus a football match on Friday), average it out over seven days rather than classifying by your best day. Third, if you are overweight, run the calculation at your current weight, not your target weight; your current body is the one burning today's calories, and updating the inputs every 4–5 kg of change keeps the estimate honest.",
            ar: "ثلاث قواعد صادقة للاختيار. أولاً، لا تحسب سوى التمارين المقصودة والعمل البدني الحقيقي — فالمشي عشرين دقيقة حقيقي لكنه صغير، وأكثر الناس يمنحونه فضلاً أكبر من استحقاقه. ثانياً، إن كان أسبوعك متفاوتاً (ثلاثة أيام صالة ومباراة كرة يوم الجمعة مثلاً) فخُذ متوسطه على سبعة أيام بدل التصنيف بأفضل يومك. ثالثاً، إن كان وزنك زائداً فأجرِ الحساب بوزنك الحالي لا المستهدف؛ فجسمك الحالي هو ما يحرق سعرات اليوم، وتحديث المدخلات كل 4–5 كجم من التغيير يبقي التقدير صادقاً.",
          },
        },
      ],
    },
    {
      id: "tdee-explained",
      heading: {
        en: "TDEE: where your daily energy actually goes",
        ar: "الإنفاق اليومي الكلي (TDEE): أين تذهب طاقتك فعلاً",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Total Daily Energy Expenditure has four components. The largest is your BMR — typically 60–70% of the total — which pays for heartbeat, breathing, brain function, cell repair, and body temperature. The second is NEAT (non-exercise activity thermogenesis): all unconscious movement like walking, posture, gestures, and fidgeting, which can quietly range from 100 to 700 kcal a day between two people of identical size. The third is TEF (thermic effect of food): the energy cost of digesting and processing what you eat, about 10% of intake, with protein costing the most to process. The fourth is deliberate exercise — usually the smallest slice for the average office worker, and the most variable for an athlete in season.",
            ar: "يتألف الإنفاق اليومي الكلي من الطاقة من أربعة مكونات. الأكبر هو معدل الأيض الأساسي — نحو 60–70% من الإجمالي — الذي يدفع نبض القلب والتنفس ووظائف الدماغ وإصلاح الخلايا وحرارة الجسم. والثاني هو NEAT (التوليد الحراري للنشاط غير الرياضي): كل حركة لا واعية كالمشي والوقفة والإيماءات والتململ، ويمكن أن يتراوح بصمت بين 100 و700 سعرة يومياً بين شخصين متطابقين في الحجم. والثالث هو TEF (التأثير الحراري للطعام): كلفة هضم ما تأكله ومعالجته، وهي نحو 10% من الاستهلاك، والبروتين أغلاها في المعالجة. والرابع التمارين المقصودة — عادةً أصغر حصة لموظف مكتبي، وأكثرها تقلباً لرياضي في موسم المنافسة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The practical consequences of this breakdown are worth remembering. Exercise burns fewer calories than most people assume, which is why adding a workout rarely out-runs a poor diet; NEAT differences explain why your friend eats like you but stays leaner; and a high-protein diet quietly spends more calories on digestion than a high-fat one. When your calculator says \"TDEE 2,400\", that single number is the sum of all four components for an ordinary day — not just your gym hour.",
            ar: "عواقب هذا التفصيل جديرة بالتذكر. التمارين تحرق سعرات أقل مما يفترض معظم الناس، ولهذا نادراً ما تتفوق جلسةُ تمرين على تغذية سيئة؛ وفروق الـ NEAT تفسّر كيف يأكل صديقك مثلك ويظل أنحف منك؛ والحمية الغنية بالبروتين تنفق بهدوء سعرات أكثر على الهضم من الحمية الغنية بالدهون. عندما تقول الحاسبة «TDEE 2400» فذلك الرقم الواحد هو مجموع المكونات الأربعة ليوم عادي — لا ساعة ناديك وحدها.",
          },
        },
      ],
    },
    {
      id: "weight-goals",
      heading: {
        en: "Calorie targets for losing, maintaining, and gaining weight",
        ar: "أهداف السعرات للخسارة والتثبيت والزيادة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "For fat loss, the calculator subtracts 500 kcal from your TDEE. Body fat stores roughly 7,700 kcal per kilogram, so a 500-kcal daily deficit drains about 0.45–0.5 kg per week — the rate almost every clinical guideline considers sustainable, because it preserves muscle, adapts to slowly, and leaves room for social life. Faster is possible but costs you: crash deficits strip muscle, crash energy, and crash adherence. If you have a lot of weight to lose (a starting BMI above 30), a slightly larger deficit is medically reasonable under supervision; otherwise treat 500 as the ceiling of comfort.",
            ar: "لخسارة الدهون تطرح الحاسبة 500 سعرة من الـ TDEE. فكل كيلوغرام من دهون الجسم يخزّن نحو 7700 سعرة، لذا فإن عجزاً يومياً قدره 500 سعرة يستنزف نحو 0.45–0.5 كجم أسبوعياً — وهي السرعة التي تعتبرها الإرشادات الإكلينيكية بإجماعٍ شبه تام مستدامة، لأنها تحافظ على العضلات وتتكيف ببطء وتترك مساحة للحياة الاجتماعية. الزيادة في السرعة ممكنة لكن ثمنها باهظ: العجوزات القاسية تسلخ العضلات والطاقة والالتزام معاً. إن كان لديك وزن كبير يجب خسارته (مؤشر كتلة بداية أعلى من 30) فعجز أكبر قليلاً مبرر طبياً بإشراف متخصص؛ وإلا فاعتبر 500 سقفَ الراحة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "For weight gain, the calculator adds 400 kcal. Muscle synthesis is a slow factory: beyond a modest surplus, extra energy is partitioned disproportionately to fat. A lean-gain target of about 0.25–0.5% of body weight per month in your first years of training uses the surplus efficiently; force-feeding 1,000 extra calories mostly buys fat and indigestion. Skinny beginners can sit at the top of that range; advanced lifters should sit near the bottom.",
            ar: "لزيادة الوزن تضيف الحاسبة 400 سعرة. بناء العضلات مصنع بطيء: فما يتجاوز فائضاً معتدلاً من الطاقة يتجه بنصيب غير متكافئ إلى الدهون. هدف الزيادة العضلية بنحو 0.25–0.5% من وزن الجسم شهرياً في سنواتك التدريبية الأولى يستثمر الفائض بكفاءة؛ أما حشر 1000 سعرة إضافية فيشتري أساساً دهوناً وعسر هضم. يمكن للمبتدئين النحافين الجلوس عند الحد الأعلى من هذا النطاق؛ والمتدربون المتقدمون عند الحد الأدنى.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Maintenance deserves respect too. Extended periods eating at your calculated TDEE — deliberately, after a cut or a gaining phase — let hormones related to hunger and metabolism recover, give you a truthful reference point for future adjustments, and break the psychological pattern of permanent dieting. Plan maintenance phases, not just deficits.",
            ar: "والتثبيت يستحق احتراماً كذلك. فترات طويلة من الأكل عند الـ TDEE المحسوب — عمداً، بعد مرحلة خسارة أو زيادة — تتيح للهرمونات المرتبطة بالجوع والأيض أن تتعافى، وتمنحك نقطة مرجعية صادقة لتعديلات المستقبل، وتكسر النمط النفسي للدايت الدائم. خطط لمراحل تثبيت، لا لعجزٍ فقط.",
          },
        },
      ],
    },
    {
      id: "macro-preview",
      heading: {
        en: "From calories to macros",
        ar: "من السعرات إلى الماكروز",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Alongside your calorie target, this calculator shows a starter macro split of 40% carbohydrates, 30% protein, and 30% fat — a balanced default that supports training, recovery, and satiety for most people. Translated to grams: protein and carbohydrates each carry 4 kcal per gram and fat 9 kcal per gram, so the calculator divides your protein and carb calories by 4 and your fat calories by 9.",
            ar: "إلى جانب هدف السعرات تعرض الحاسبة توزيع ماكروز افتتاحياً من 40% كربوهيدرات و30% بروتين و30% دهون — افتراض متوازن يدعم التدريب والاستشفاء والشبع لدى معظم الناس. وترجمةً إلى غرامات: البروتين والكربوهيدرات يحمل كل منهما 4 سعرة للغرام والدهون 9 سعرة للغرام، لذا تقسم الحاسبة سعرات البروتين والكربوهيدرات على 4 وسعرات الدهون على 9.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The starter split is a floor, not a verdict. If you train hard, prefer low-carb eating, follow a ketogenic diet, or need higher protein while cutting, the dedicated macro calculator redistributes the same calorie budget across five preset patterns (balanced, low-carb, high-protein, keto, low-fat) with full gram breakdowns and the reasoning behind each split. Calories decide whether your weight moves; macros decide what the weight consists of and how the diet feels.",
            ar: "هذا التوزيع الافتتاحي أرضية لا حكماً نهائياً. إن كنت تتدرب بقوة، أو تفضل الأكل قليل الكربوهيدرات، أو تتبع حمية الكيتو، أو تحتاج بروتيناً أعلى أثناء الخسارة، فحاسبة الماكروز المخصصة تعيد توزيع ميزانية السعرات نفسها عبر خمسة أنماط جاهزة (متوازن، قليل الكربوهيدرات، عالي البروتين، كيتو، قليل الدهون) بتفصيل الغرامات الكامل ومسوّغات كل توزيع. السعرات تحدد هل يتحرك وزنك؛ والماكروز تحدد مما يتكون هذا الوزن وكيف تشعر الحمية.",
          },
        },
      ],
    },
    {
      id: "accuracy-limitations",
      heading: {
        en: "How accurate is any calorie calculator?",
        ar: "ما دقة أي حاسبة سعرات؟",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Honest answer: good enough to start, never good enough to obey blindly. Prediction equations carry roughly a 10% error band against lab measurements, and your true burn also moves day to day with sleep, stress, and activity. On a 2,500-kcal estimate, 10% is 250 kcal — the difference between losing and stalling if you treat the number as gospel. The correct workflow is: calculate, eat accordingly for two to three weeks while logging intake and weighing yourself under consistent conditions (same time, same scale, morning), then adjust by 100–200 kcal based on what your body actually did.",
            ar: "الإجابة الصادقة: دقة تكفي للبداية، ولا تكفي أبداً للطاعة العمياء. فمعادلات التنبؤ تحمل هامش خطأ يقارب 10% مقابل القياس المخبري، وحرقك الحقيقي يتغير يوماً بيوم مع النوم والتوتر والنشاط. على تقدير 2500 سعرة يعادل الـ10% نحو 250 سعرة — الفارق بين الخسارة والثبات إذا تعاملت مع الرقم كوحي. سير العمل الصحيح: احسب، ثم كُل وفقه أسبوعين إلى ثلاثة مع تسجيل ما تأكله ووزن نفسك بظروف متسقة (الوقت نفسه، الميزان نفسه، صباحاً)، ثم عدّل بمقدار 100–200 سعرة بناءً على ما فعله جسمك فعلاً.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Three specific limitations to know. First, the equations assume a healthy adult population: pregnancy, thyroid disease, and several medications shift real metabolism away from the prediction. Second, energy tracking has its own noise — nutrition labels are legally allowed to be off by up to 20% in many jurisdictions, restaurant estimates more — so your \"1,800-kcal day\" is really 1,600–2,000. Third, metabolism adapts: after weeks of dieting, NEAT falls unconsciously and the burn you calculated no longer matches the burn you have, which is precisely when a small recalculated deficit or a maintenance break helps.",
            ar: "ثلاثة حدود محددة يجب معرفتها. أولاً، المعادلات تفترض مجتمعاً من البالغين الأصحاء: فالحمل وأمراض الغدة الدرقية وبعض الأدوية تُبعد الأيض الحقيقي عن التنبؤ. ثانياً، لتتبع الطاقة ضجيجه الخاص — فملصقات التغذية يسمح القانون في كثير من الدول بخطئها حتى 20%، وتقديرات المطاعم أكثر — فـ«يومك ذو الـ1800 سعرة» هو في الحقيقة بين 1600 و2000. ثالثاً، الأيض يتكيف: بعد أسابيع من الدايت يهبط الـ NEAT بلا وعي ولا يعود الحرق الذي حسبته مطابقاً للحرق الذي تملكه، وهنا بالضبط يجدي عجزٌ أُعيد حسابه قليلاً أو فترة تثبيت.",
          },
        },
        {
          kind: "p",
          text: {
            en: "One final scope note: a calculator is a planning tool for generally healthy adults, not a medical device. If you live with a chronic condition — diabetes, thyroid disorders, kidney or liver disease — or you are pregnant, breastfeeding, or taking medications that affect appetite or weight, the numbers here are still a useful starting point for the conversation, but the final targets should be set with a physician or a registered dietitian who can see your full picture. The same applies to adolescents, whose energy needs change with growth spurts and who should never run aggressive deficits without supervision.",
            ar: "ملاحظة نطاق أخيرة: الحاسبة أداة تخطيط لبالغين أصحاء عموماً، وليست جهازاً طبياً. إن كنت تعيش مع حالة مزمنة — السكري أو اضطرابات الغدة الدرقية أو أمراض الكلى أو الكبد — أو كنتِ حاملاً أو مرضعاً، أو تتناول أدوية تؤثر في الشهية أو الوزن، فتبقى الأرقام هنا نقطة انطلاق مفيدة للحوار، لكن ينبغي أن تُضبط الأهداف النهائية مع طبيب أو أخصائي تغذية مسجل يرى صورتك الكاملة. وينطبق الأمر نفسه على المراهقين، الذين تتغير احتياجاتهم من الطاقة مع طفرات النمو ولا يجوز أن يخوضوا عجزاً عدوانياً بلا إشراف.",
          },
        },
      ],
    },
    {
      id: "practical-tracking",
      heading: {
        en: "Practical tips that make the number work",
        ar: "نصائح عملية تجعل الرقم يعمل فعلاً",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "A calorie target only works if your intake reporting is honest, and honesty has a technique. Weigh food raw where possible (rice and pasta more than double in weight when cooked, and cooked-weight entries are inconsistently labeled); use grams rather than \"one serving\" or \"one spoon\" — a heaped tablespoon of peanut butter can hold double the flat one; scan barcodes for packaged goods instead of guessing from photos; and log drinks, cooking oils, and \"bites while cooking\", which are the three most universally forgotten sources. People who adopt gram-level tracking for just two weeks typically report being off by 300–500 kcal a day before they started — enough to erase an entire planned deficit.",
            ar: "لا يعمل هدف السعرات إلا إذا كان تسجيلك لاستهلاكك صادقاً، وللصدقة تقنية. زِن الطعام نيئاً ما أمكن (فالأرز والمكرونة يتضاعف وزنها أكثر من مرتين بعد الطهي، ومدخلات الوزن المطهو مسجلة بلا اتساق)؛ واستخدم الغرامات بدل «حصة واحدة» أو «ملعقة» — فملعقة ممتلئة من زبدة الفول السوداني قد تحمل ضعف الملعقة المسطحة؛ وامسح الباركود للأغلفة بدل التخمين من الصور؛ وسجّل المشروبات وزيوت الطهي و«لقمات أثناء الطبخ» — فهي أكثر ثلاثة مصادر تُنسى عالمياً. من يتبنى التسجيل بالغرام أسبوعين فقط يذكر عادة أنه كان مخطئاً بـ 300–500 سعرة يومياً قبل أن يبدأ — أي ما يكفي لمحو عجزٍ كامل مخطط له.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Structure your day around anchor meals: two or three fixed, repeatable meals that cover 80% of your calories make the budget predictable and the logging light. Reserve a planned, logged treat inside the budget rather than moralizing food into forbidden categories — unexplained forbidden foods are the engine of binge-restrict cycles. And when eating out, choose the dish you can estimate: grilled protein with rice and salad decomposes cleanly into numbers, while a mixed casserole does not.",
            ar: "نظّم يومك حول وجبات مرتكزة: وجبتان أو ثلاث ثابتة قابلة للتكرار تغطيان 80% من سعراتك تجعلان الميزانية متوقعة والتسجيل خفيفاً. واحتفظ بمكافأة مخططة ومسجلة داخل الميزانية بدل تحويل الطعام إلى فئات محرمة أخلاقياً — فالأطعمة المحرمة بلا تفسير هي محرك دورات الانهيار والحرمان. وعند الأكل خارج البيت اختر الطبق الذي تستطيع تقديره: بروتين مشوي مع أرز وسلطة يتحلل نظيفاً إلى أرقام، بخلاف طاجن مختلط.",
          },
        },
      ],
    },
    {
      id: "after-the-number",
      // PRIORITY-PAGES-2 (2026-10-19, audit §A-2 + report §9.4-4): the
      // conversion bridge the page lacked — it computed the number and
      // stopped. Plain-text routing to the site's own next steps (the
      // ContentBlock type is text-only by law; the linked destinations
      // live one screen up in the page chrome). Every number below is the
      // page's own documented arithmetic (−500 / +400 / 40-30-30).
      heading: {
        en: "What to do with your number after the calculation",
        ar: "ماذا تفعل بالرقم بعد حسابه؟",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "A number is a starting point, not a plan — the value appears when you convert it into decisions. First, split it: the macro calculator turns your daily target into protein, carbohydrate, and fat grams (a 40/30/30 starter split the calculator already previews), because \"2,000 calories\" becomes manageable only as food on a plate. Second, give it a schedule: the diet-plan library holds twenty-four ready days — six calorie levels from 1200 to 3000 across four systems (balanced, high-protein, keto, vegetarian) written in grams per item — so your exact number has a ready-made menu you open and follow today, or the AI meal planner generates a complete day from your number, system, and preferences in seconds.",
            ar: "الرقم نقطة بداية لا خطة — وقيمته تظهر حين تحوّله إلى قرارات. أولًا وزّعه: حاسبة الماكروز تحوّل هدفك اليومي إلى غرامات بروتين وكربوهيدرات ودهون (بتوزيع افتتاحي 40/30/30 تعرضه الحاسبة مسبقًا)، لأن «2000 سعرة» لا تصبح قابلة للإدارة إلا كطعام في طبق. ثانيًا امنحه جدولًا: مكتبة الخطط الغذائية تضم أربعة وعشرين يومًا جاهزًا — ستة مستويات سعرات من 1200 إلى 3000 عبر أربعة أنظمة (المتوازن وعالي البروتين والكيتوني والنباتي) مكتوبة بالغرام لكل صنف — فرقمك بالضبط له قائمة جاهزة تفتحها وتتبعها اليوم، أو يولّد مخطط الوجبات بالذكاء الاصطناعي يومًا كاملًا من رقمك ونظامك وملاحظاتك في ثوانٍ.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Third, pair it with training: a calorie target without training keeps muscle on the sidelines — the workout-programs library lays out ready schedules for every level and location, from a no-equipment home beginner plan to an advanced barbell 5×5, and the AI workout planner builds a split from your goal, level, days, and equipment. Fourth, close the loop: weigh the weekly average (not single mornings) under the same conditions, give each adjustment two to three honest weeks, and recalculate every 4–5 kilograms of body-weight change — the number you own is the one you re-measure. Along the way, the body-fat and water-intake calculators track what the scale alone cannot see.",
            ar: "ثالثًا اقرنه بالتدريب: هدف سعرات بلا تدريب يُبقي العضلة خارج الملعب — مكتبة برامج التدريب تعرض جداول جاهزة لكل مستوى ومكان، من برنامج منزلي للمبتدئين بلا معدات إلى برنامج بار 5×5 للمتقدمين، ومخطط التمارين بالذكاء الاصطناعي يبني تقسيمة من هدفك ومستواك وأيامك ومعداتك. رابعًا أغلق الحلقة: زِن المتوسط الأسبوعي (لا الصباحات المفردة) بالظروف نفسها، وامنح كل تعديل أسبوعين إلى ثلاثة بصدق، وأعد الحساب كل 4–5 كيلوغرامات من تغير وزنك — فالرقم الذي تملكه هو الذي تعيد قياسه. وفي الطريق تتابع حاسبتا دهون الجسم وشرب الماء ما لا يراه الميزان وحده.",
          },
        },
      ],
    },
    {
      id: "food-calorie-table",
      heading: {
        en: "Calorie table for common foods",
        ar: "جدول سعرات أشهر الأطعمة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The table below lists approximate calories and protein per 100 grams of foods that appear constantly in everyday cooking — including staples of Middle Eastern kitchens. Values are rounded reference figures for raw or plainly cooked items without added fats; preparation can change totals significantly (frying adds oil at 884 kcal per 100 g).",
            ar: "يسرد الجدول أدناه السعرات والبروتين التقريبيين لكل 100 غرام من أطعمة تحضر باستمرار في المطابخ اليومية — بما فيها أساسيات المطبخ الشرقي. القيم مراجع مقربة لأصناف نيئة أو مطبوخة ببساطة بلا دهون مضافة؛ والتحضير قد يغير الإجماليات كثيراً (القلي يضيف زيتاً بكثافة 884 سعرة لكل 100 غرام).",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Calories and protein per 100 g (approximate reference values)",
              ar: "السعرات والبروتين لكل 100 غرام (قيم مرجعية تقريبية)",
            },
            columns: [
              { en: "Food", ar: "الطعام" },
              { en: "Calories", ar: "السعرات" },
              { en: "Protein (g)", ar: "بروتين (غ)" },
            ],
            rows: [
              { en: ["Chicken breast, skinless cooked", "165", "31"], ar: ["صدر دجاج بلا جلد مطبوخ", "165", "31"] },
              { en: ["Egg, whole boiled", "155", "13"], ar: ["بيضة كاملة مسلوقة", "155", "13"] },
              { en: ["Tuna, canned in water", "116", "26"], ar: ["تونة معلبة بالماء", "116", "26"] },
              { en: ["Lean beef, cooked", "250", "26"], ar: ["لحم بقري قليل الدهن مطبوخ", "250", "26"] },
              { en: ["Salmon, cooked", "208", "20"], ar: ["سلمون مطبوخ", "208", "20"] },
              { en: ["White rice, cooked", "130", "2.7"], ar: ["أرز أبيض مطبوخ", "130", "2.7"] },
              { en: ["Brown rice, cooked", "123", "2.7"], ar: ["أرز بني مطبوخ", "123", "2.7"] },
              { en: ["Oats, dry", "389", "17"], ar: ["شوفان جاف", "389", "17"] },
              { en: ["Lentils, cooked", "116", "9"], ar: ["عدس مطبوخ", "116", "9"] },
              { en: ["Fava beans, cooked", "110", "7.6"], ar: ["فول مدمس", "110", "7.6"] },
              { en: ["Chickpeas, cooked", "164", "8.9"], ar: ["حمص مطبوخ", "164", "8.9"] },
              { en: ["Pita bread", "275", "9"], ar: ["خبز شعير/بلدي", "275", "9"] },
              { en: ["Greek yogurt, nonfat", "59", "10"], ar: ["زبادي يوناني خالي الدسم", "59", "10"] },
              { en: ["Dates, Medjool", "277", "1.8"], ar: ["تمر مجدول", "277", "1.8"] },
              { en: ["Banana", "89", "1.1"], ar: ["موزة", "89", "1.1"] },
              { en: ["Apple", "52", "0.3"], ar: ["تفاحة", "52", "0.3"] },
              { en: ["Potato, boiled", "87", "1.9"], ar: ["بطاطس مسلوقة", "87", "1.9"] },
              { en: ["Cucumber", "15", "0.7"], ar: ["خيار", "15", "0.7"] },
              { en: ["Olive oil", "884", "0"], ar: ["زيت زيتون", "884", "0"] },
              { en: ["Full-fat milk", "61", "3.2"], ar: ["لبن كامل الدسم", "61", "3.2"] },
            ],
          },
        },
      ],
    },
    {
      id: "exercise-calorie-table",
      heading: {
        en: "Calories burned by common activities",
        ar: "السعرات التي تحرقها الأنشطة الشائعة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Approximate energy expenditure for a 70 kg adult; heavier people burn proportionally more, lighter people less. These are honest averages — real values vary with intensity, terrain, and skill.",
            ar: "إنفاق طاقة تقريبي لبالغ وزنه 70 كجم؛ فالأثقل وزناً يحرق أكثر تناسبياً والأخف أقل. هذه متوسطات صادقة — تختلف القيم الحقيقية بالشدة والتضاريس والمهارة.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Calories burned in 30 minutes (70 kg person, approximate)",
              ar: "السعرات المحروقة في 30 دقيقة (شخص 70 كجم، تقريبية)",
            },
            columns: [
              { en: "Activity", ar: "النشاط" },
              { en: "kcal / 30 min", ar: "سعرة / 30 دقيقة" },
            ],
            rows: [
              { en: ["Walking, casual (4 km/h)", "105"], ar: ["مشي عادي (4 كم/س)", "105"] },
              { en: ["Brisk walking (5.6 km/h)", "140"], ar: ["مشي سريع (5.6 كم/س)", "140"] },
              { en: ["Running (8 km/h)", "300"], ar: ["جري (8 كم/س)", "300"] },
              { en: ["Running (12 km/h)", "450"], ar: ["جري (12 كم/س)", "450"] },
              { en: ["Cycling, moderate (16–19 km/h)", "240"], ar: ["دراجة معتدلة (16–19 كم/س)", "240"] },
              { en: ["Swimming, freestyle moderate", "220"], ar: ["سباحة حرة معتدلة", "220"] },
              { en: ["Weight training, moderate", "110"], ar: ["تدريب أثقال معتدل", "110"] },
              { en: ["HIIT circuit", "300"], ar: ["دائرة هيت عالية الشدة", "300"] },
              { en: ["Jump rope", "350"], ar: ["نط الحبل", "350"] },
              { en: ["Yoga, general", "100"], ar: ["يوغا عامة", "100"] },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "Read the table with the right expectations: 30 minutes of casual walking burns about one Medjool date's worth of premium over resting — exercise is superb for health, muscle, and appetite regulation, but it is a poor primary strategy for creating a calorie deficit. Use it to build the body; use the kitchen to build the deficit.",
            ar: "اقرأ الجدول بتوقعات صحيحة: 30 دقيقة من المشي العادي تحرق قيمة تمرة مجدول واحدة تقريباً فوق معدل الراحة — فالتمرين رائع للصحة والعضلات وتنظيم الشهية، لكنه استراتيجية فقيرة أساسيةً لخلق عجز سعرات. استخدمه لبناء الجسم؛ واستخدم المطبخ لبناء العجز.",
          },
        },
      ],
    },
  ],
  faqs: [
    {
      q: {
        en: "How many calories should I eat per day to lose weight?",
        ar: "كم سعرة يجب أن آكل يومياً لخسارة الوزن؟",
      },
      a: {
        en: "There is no universal number — it is your TDEE minus a deficit. Calculate your maintenance with your current weight, age, height, sex, and honest activity level, then subtract 500 kcal for roughly half a kilogram per week of fat loss. A 90 kg man who trains three times a week and a 55 kg woman with a desk job will get completely different targets from the same calculator, as they should.",
        ar: "لا يوجد رقم واحد للجميع — إنه الـ TDEE الخاص بك ناقص عجزٍ ما. احسب سعرات التثبيت بوزنك وعمرك وطولك وجنسك ومستوى نشاطك الصادق، ثم اطرح 500 سعرة لنحو نصف كيلوغرام أسبوعياً من الدهون. رجل وزنه 90 كجم يتدرب ثلاث مرات أسبوعياً وامرأة وزنها 55 كجم بعمل مكتبي سيحصلان على هدفين مختلفين تماماً من الحاسبة نفسها — وهذا هو الصواب.",
      },
    },
    {
      q: {
        en: "Is eating 1,200 calories a day safe?",
        ar: "هل أكل 1200 سعرة يومياً آمن؟",
      },
      a: {
        en: "For a small, sedentary woman, 1,200 kcal can be a legitimate calculated target; for most adults it is an aggressive deficit that risks muscle loss, micronutrient gaps, low energy, and rebound eating. It should not be a default anyone copies from the internet. If your calculated target comes out near or below 1,200, prefer adding activity or accepting a slower loss rate, and if you have any medical condition, discuss the plan with a clinician first.",
        ar: "لأنثى صغيرة الحجم خاملة يمكن أن تكون 1200 سعرة هدفاً محسوباً مشروعاً؛ أما لمعظم البالغين فهي عجز عدواني يهدد العضلات ويفتح ثغرات المغذيات الدقيقة والطاقة ويدفع لأكل ارتدادي. لا يصح أن تكون رقماً افتراضياً ينسخه الناس من الإنترنت. إن خرج هدفك المحسوب قرب 1200 أو دونها ففضّل زيادة النشاط أو قبول خسارة أبطأ، وإن كان لديك أي وضع صحي فناقش الخطة مع طبيب أولاً.",
      },
    },
    {
      q: {
        en: "Why am I not losing weight even though I eat at my calculated deficit?",
        ar: "لماذا لا أخسر وزناً رغم أني آكل عند العجز المحسوب؟",
      },
      a: {
        en: "In order of likelihood: your intake is under-reported (oils, drinks, weekends — studies show average self-reports miss 300+ kcal/day), your activity is over-estimated (choosing \"moderate\" for a desk-job week), water is masking fat loss (salt, carbohydrate refills, menstrual cycle, new training soreness all hold water for days), or enough time has not passed (weigh trends over 2–3 weeks, not single days). Fix the first two, judge by the trend, and only then adjust the number by 100–200 kcal.",
        ar: "بحسب الاحتمال: استهلاكك مقيَّد بأقل من الحقيقة (الزيوت والمشروبات وعطلات نهاية الأسبوع — تُظهر الدراسات أن التقارير الذاتية تفوّت أكثر من 300 سعرة يومياً في المتوسط)، أو نشاطك مُقدَّر بأكثر من الحقيقة (اختيار «متوسط» لأسبوع مكتبي)، أو الماء يحجب خسارة الدهون (الملء والكربوهيدرات المعاد تخزينها والدورة الشهرية ووجع التمرين الجديد كلها تحبس الماء أياماً)، أو لم يمر وقت كافٍ (زِن الاتجاه عبر 2–3 أسابيع لا الأيام المفردة). أصلح الأولين واحكم بالاتجاه، وعندها فقط عدّل الرقم بمقدار 100–200 سعرة.",
      },
    },
    {
      q: {
        en: "Should I eat back the calories my watch says I burned?",
        ar: "هل آكل ثانية السعرات التي يقول ساعتي إني حرقتها؟",
      },
      a: {
        en: "Generally no, or only a fraction. Wrist devices and gym machines systematically overestimate exercise energy by a wide margin in validation studies — often 20–90% for common activities. If your target already includes your activity level multiplier, eating back full device estimates double-counts the same workout and quietly erases your deficit. A reasonable compromise is eating back at most half of what the device claims, and only on genuinely hard training days.",
        ar: "عموماً لا، أو جزءاً يسيراً فقط. فالأجهزة المعصمية وأجهزة الصالات تبالغ منهجياً في طاقة التمرين بهامش واسع في دراسات التحقق — غالباً 20–90% للأنشطة الشائعة. إن كان هدفك يتضمن أصلاً مضاعف مستوى نشاطك، فإن أكل تقديرات الجهاز كاملة يحسب التمرين نفسه مرتين ويمحو عجزك بهدوء. حل وسط معقول: أكل نصف ما يدّعيه الجهاز على الأكثر، وفي أيام التدريب الشاقة فعلاً فقط.",
      },
    },
    {
      q: {
        en: "What is the difference between BMR and TDEE?",
        ar: "ما الفرق بين معدل الأيض الأساسي والإنفاق اليومي الكلي؟",
      },
      a: {
        en: "BMR is the energy your body burns at complete rest just to stay alive — heart, lungs, brain, temperature. TDEE is BMR plus everything else in a real day: walking, working, digesting, training. Never eat below your BMR as a strategy — deficits should come out of your TDEE, and this calculator is built exactly that way.",
        ar: "معدل الأيض الأساسي هو الطاقة التي يحرقها جسمك في راحة تامة ليبقى حياً فحسب — القلب والرئتان والدماغ والحرارة. والإنفاق اليومي الكلي هو الأيض الأساسي زائد كل ما عدا ذلك في يوم حقيقي: المشي والعمل والهضم والتدريب. لا تأكل أبداً دون معدل أساسك بوصفه استراتيجية — فالعجز يُقتطع من الإنفاق الكلي، وهذه الحاسبة مبنية بهذا الشكل بالضبط.",
      },
    },
    {
      q: {
        en: "Do calories from fruit and vegetables count?",
        ar: "هل تُحسب سعرات الفواكه والخضروات؟",
      },
      a: {
        en: "Yes — everything with energy counts, though volume matters. A full kilogram of cucumbers is only about 150 kcal, which is why generous vegetables are encouraged on a deficit: they add fullness, fiber, and micronutrients at a trivial energy cost. But dates, grapes, mangoes, and dried fruits are dense enough that \"it is just fruit\" can add hundreds of calories to a day. Log the dense ones; eat the watery ones freely.",
        ar: "نعم — كل ما يحمل طاقة يُحسب، وإن كان الحجم مهماً. كيلوغرام كامل من الخيار لا يتجاوز نحو 150 سعرة، ولهذا يُنصح بالخضروات الوفيرة أثناء الخسارة: تضيف شبعاً وأليافاً ومغذيات دقيقة بكلفة طاقة زهيدة. لكن التمر والعنب والمانجو والفواكه المجففة كثيفة بما يكفي لأن «مجرد فاكهة» تضيف مئات السعرات لليوم. سجّل الكثيفة؛ وكل المائية بحرية.",
      },
    },
    {
      q: {
        en: "How often should I recalculate my calories?",
        ar: "كم مرة أعيد حساب سعراتي؟",
      },
      a: {
        en: "Every 4–5 kilograms of body-weight change, or whenever your training volume or job changes noticeably. As you lose weight your TDEE falls with it — the 92 kg version of you burns more than the 82 kg version — and as you gain muscle it rises. Recalculate at those milestones, then let the 2–3 week scale trend confirm the new number before making further changes.",
        ar: "كل 4–5 كيلوغرامات من تغير وزن الجسم، أو كلما تغير حجم تدريبك أو عملك بشكل ملحوظ. فكلما خسرت وزناً هبط إنفاقك الكلي معه — نسختك التي وزنها 92 كجم تحرق أكثر من نسختك التي وزنها 82 كجم — وكلما بنيت عضلاً ارتفع. أعد الحساب عند هذه المحطات، ثم دع اتجاه الميزان عبر 2–3 أسابيع يؤكد الرقم الجديد قبل أي تغييرات إضافية.",
      },
    },
    {
      q: {
        en: "Are \"Calories\" on food labels the same as kcal?",
        ar: "هل «السعرات» على ملصقات الأطعمة هي نفسها الكيلو سعرة؟",
      },
      a: {
        en: "Yes. In nutrition labeling, \"Calorie\" (capital C) is the kilocalorie — the energy to warm one liter of water by one degree Celsius. A 200-Calorie snack provides 200 kcal. Some countries print \"kcal\" or \"kJ\" (1 kcal = 4.184 kJ) instead, but they are all the same energy in different costumes; this calculator and every serious nutrition source speak kcal.",
        ar: "نعم. في ملصقات التغذية، «السعرة» بحرف كبير هي الكيلو سعرة — الطاقة اللازمة لتسخين لتر ماء درجة مئوية واحدة. سناك بـ 200 سعرة يوفر 200 كيلو سعرة. بعض الدول تطبع «kcal» أو «kJ» (1 كيلو سعرة = 4.184 كيلوجول) بدلاً منها، لكنها كلها الطاقة نفسها بأزياء مختلفة؛ وهذه الحاسبة وكل مصدر تغذية جدي يتحدث بالكيلو سعرة.",
      },
    },
    {
      q: {
        en: "Does metabolism really slow down with age?",
        ar: "هل يتباطأ الأيض فعلاً مع العمر؟",
      },
      a: {
        en: "Less than folklore claims, and mostly for fixable reasons. A large 2021 study across 29 countries found energy expenditure per kilogram is remarkably stable from roughly age 20 to 60, then declines. What actually drops for most adults is muscle mass and daily movement — both trainable. Keeping resistance training and daily steps high through your forties and beyond keeps the calculator's age penalty small.",
        ar: "أقل مما تدّعي الخرافة، وأغلبه لأسباب قابلة للإصلاح. دراسة كبيرة عام 2021 عبر 29 دولة وجدت أن الإنفاق لكل كيلوغرام مستقر بدهشة من نحو العشرين حتى الستين ثم ينخفض. ما يتراجع فعلاً عند معظم البالغين هو الكتلة العضلية والحركة اليومية — وكلاهما قابل للتدريب. المحافظة على تدريب المقاومة والخطوات اليومية في الأربعينيات وما بعدها يبقي غرامة العمر في الحاسبة صغيرة.",
      },
    },
    {
      q: {
        en: "I hit my target exactly for a month and the scale did not move — is the calculator wrong?",
        ar: "التزمت بهدفي تماماً شهراً كاملاً ولم يتحرك الميزان — هل الحاسبة مخطئة؟",
      },
      a: {
        en: "Possibly — but first audit the two silent saboteurs: weekend intake (a 2,000-kcal Saturday erases four disciplined 500-kcal-deficit days) and measurement conditions (weigh naked, after the bathroom, before breakfast, on the same scale, and compare weekly averages rather than single mornings). If both are clean for three full weeks and the trend is still flat, your true TDEE is simply lower than the prediction — subtract another 150–200 kcal and re-test. The calculator gives you the hypothesis; your data runs the experiment.",
        ar: "ربما — لكن دقق أولاً في مخربّين صامتين: استهلاك نهاية الأسبوع (سبت بـ 2000 سعرة يمحو أربعة أيام منضبطة بعجز 500 سعرة) وظروف القياس (زِن بلا ملابس، بعد قضاء الحاجة، قبل الفطور، على الميزان نفسه، وقارن المتوسطات الأسبوعية لا الصباحات المفردة). إن كان الاثنان نظيفين ثلاثة أسابيع كاملة والاتجاه ما يزال مستوياً فإن إنفاقك الحقيقي أدنى من التنبؤ ببساطة — اطرح 150–200 سعرة أخرى وأعد الاختبار. الحاسبة تعطيك الفرضية؛ وبياناتك تدير التجربة.",
      },
    },
    {
      // PRIORITY-PAGES-2 (2026-10-19, audit Improvement 4 remainder +
      // report §9.4-3): the Arabic use-case pack's muscle-building half —
      // the loss half ("How many calories should I eat per day to lose
      // weight?") already existed; the surplus twin did not. Numbers are
      // the page's own documented arithmetic: +400 for gain (header
      // comment + weight-goals section), 0.25-0.5% of body weight per
      // month, protein 1.6-2.2 g/kg (macro-calculator content).
      q: {
        en: "How many calories do I need to build muscle?",
        ar: "كم سعرة أحتاج لبناء العضل؟",
      },
      a: {
        en: "Your calculated maintenance (TDEE) plus a modest surplus — this calculator adds 400 kcal for its gaining target. Muscle synthesis is a slow factory: a lean gain of about 0.25-0.5% of body weight per month in your first training years uses that surplus efficiently, while force-feeding a thousand extra calories mostly buys fat and indigestion. Hold protein at roughly 1.6-2.2 g per kg of body weight, train with real loads, and judge by the weekly scale trend and your lifts — not by appetite or a single good week.",
        ar: "سعرات التثبيت المحسوبة لك (الإنفاق اليومي الكلي) زائد فائض معتدل — هذه الحاسبة تضيف 400 سعرة لهدف الزيادة. بناء العضلات مصنع بطيء: زيادة عضلية بنحو 0.25-0.5% من وزن الجسم شهرياً في سنواتك التدريبية الأولى تستثمر هذا الفائض بكفاءة، بينما حشر ألف سعرة إضافية يشتري أساساً دهوناً وعسر هضم. ثبّت البروتين عند نحو 1.6-2.2 غ لكل كجم من وزنك، وتدرب بأحمال حقيقية، واحكم باتجاه الميزان الأسبوعي وأرقام رفعاتك — لا بشهيتك أو أسبوع جيد واحد.",
      },
    },
  ],
};

