import type { ToolReference } from "./tool-reference";

/**
 * Water Tracker reference — Phase SEO-GEO-6.5 (§12.19 P1-6).
 * The tracker computes a recommended goal of 35 ml × body weight (kg),
 * clamped between 2,000 and 4,500 ml, and logs cups/custom amounts
 * per day with a 7-day history. Canaries pin 35 and the clamps.
 */

export const WATER_TRACKER_CONTENT: ToolReference = {
  slug: "water-tracker",
  intro: {
    en: "Water is the medium everything else happens in: nutrient transport, joint lubrication, temperature regulation, waste removal, and the electrical environment of your nervous system. Losing just 2% of body water measurably degrades endurance, attention, and mood — and thirst is a lagging indicator, arriving after the deficit has already begun costing you. This tracker sets a daily hydration goal scaled to your body weight (35 ml per kilogram, clamped to a safe 2–4.5 liter range), lets you log cups or custom amounts in a tap, keeps a seven-day history, and works entirely in your browser. Below the tool is the complete reference: how the 35 ml/kg rule compares with the official intake guidelines, what adjusts your personal number (heat, training, caffeine, altitude), how to recognize real dehydration and the rarer danger of overhydration, and which foods quietly carry a large share of your water budget.",
    ar: "الماء هو الوسط الذي يحدث فيه كل شيء آخر: نقل المغذيات، وتشحيم المفاصل، وتنظيم الحرارة، وإزالة الفضلات، والبيئة الكهربائية لجهازك العصبي. فخسارة 2% فقط من ماء الجسم تُضعف بشكل قابل للقياس التحمّل والانتباه والمزاج — والعطش مؤشر متأخر يصل بعد أن يبدأ العجز أصلًا في التكلفة. تضبط هذه الأداة هدف ترطيب يومي متناسبًا مع وزن جسمك (35 مل لكل كيلوغرام، محصورًا في نطاق آمن 2–4.5 لتر)، وتتيح تسجيل الأكواب أو مقادير مخصصة بلمسة، وتحفظ تاريخًا لأسبوع، وتعمل كليًا داخل متصفحك. وتحت الأداة المرجع الكامل: كيف تقارن قاعدة 35 مل/كجم بالإرشادات الرسمية للاستهلاك، وما الذي يعدّل رقمك الشخصي (الحرارة، والتدريب، والكافيين، والارتفاع)، وكيف تتعرف على الجفاف الحقيقي وعلى الخطر الأندر: الإفراط في الترطيب، وأي الأطعمة تحمل بهدوء حصة كبيرة من ميزانية مائك.",
  },
  sections: [
    {
      id: "why-hydration",
      heading: {
        en: "What water actually does in the body",
        ar: "ما يفعله الماء فعلًا في الجسم",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "An adult body is roughly 50–65% water by weight — muscle holds about 75% water, fat tissue about 10–30% — totaling about 35–40 liters for a 70 kg man and slightly less for women, whose average composition carries more fat. That water divides into intracellular (about two-thirds, the working medium of every cell) and extracellular (about one-third: blood plasma, the fluid between cells, and the connective tissue matrix). You lose roughly 2–3 liters per day through urine, breath, and skin evaporation before lifting a finger; exercise in heat multiplies skin losses several-fold.",
            ar: "جسم البالغ ماءٌ بنحو 50–65% من وزنه — فالعضلة تحمل نحو 75% ماء والنسيج الدهني نحو 10–30% — بإجمالي يقارب 35–40 لترًا لرجل بوزن 70 كجم، وأقل قليلًا عند الإناث اللائي يحمل متوسطُهنّ تركيبيّ دهونًا أكثر. وينقسم ذلك الماء إلى داخل خلوي (نحو الثلثين، وسط عمل كل خلية) وخارج خلوي (نحو الثلث: بلازما الدم، والسائل بين الخلايا، ومصفوفة النسيج الضام). وتفقد نحو 2–3 لترات يوميًا عبر البول والنفس وتبخر الجلد قبل أن ترفع إصبعًا؛ والتمرين في الحر يضاعف خسائر الجلد مرات.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Hydration state touches the things you actually care about. Cognitive work: even mild dehydration (1–2% of body mass) measurably degrades concentration, working memory, and mood in controlled studies, and registers as fatigue and headache long before you connect it to water. Physical work: blood volume shrinks when you are dry, so the heart pumps a smaller stroke volume faster to deliver the same oxygen — the same run feels harder at a higher heart rate. Kidney economy: well-hydrated kidneys concentrate urine cheaply; chronically low intake over years is associated with a higher risk of kidney stones and recurrent urinary tract infections.",
            ar: "تمسّ حالة الترطيب ما تهتم به فعلًا. العمل الذهني: فحتى الجفاف الخفيف (1–2% من كتلة الجسم) يُضعف بشكل قابل للقياس التركيز والذاكرة العاملة والمزاج في الدراسات المضبوطة، ويسجل كتعب وصداع قبل أن تربطه بالماء بزمن طويل. والعمل البدني: يصغر حجم الدم حين تكون جافًا، فيضخ القلب دفعةً أصغر بسرعة أعلى لتوصيل الأكسجين نفسه — فالجري نفسه يبدو أصعب بمعدل قلب أعلى. واقتصاد الكلى: تُركّز الكلى المُرطّبة البولَ برخص؛ والاستهلاك المنخفض المزمن عبر السنين يقترن بخطر أعلى لحصوات الكلى وعدوى المسالك البولية المتكررة.",
          },
        },
      ],
    },
    {
      id: "how-much",
      heading: {
        en: "How much water: the rule, the guidelines, and the tracker's math",
        ar: "كم من الماء: القاعدة والإرشادات وحساب الأداة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The tracker's rule is 35 ml per kilogram of body weight: a 70 kg person lands at 2,450 ml per day. That single multiplier sits deliberately between the two major official frameworks. The European Food Safety Authority sets adequate total water intake at 2.5 L/day for men and 2.0 L/day for women — where \"total water\" includes water inside food (roughly 20% of intake on a typical diet). The US Institute of Medicine sets 3.7 L/day for men and 2.7 L/day for women as total water, with about 3.0 L and 2.2 L respectively coming from drinks. The weight-scaled rule personalizes the same science: it rises for heavier bodies and sinks for lighter ones, instead of prescribing one number to every adult.",
            ar: "قاعدة الأداة هي 35 مل لكل كيلوغرام من وزن الجسم: فشخص بوزن 70 كجم يهبط عند 2450 مل يوميًا. وهذا المضاعف الواحد يجلس عمدًا بين الإطارين الرسميين الكبيرين. فالهيئة الأوروبية لسلامة الغذاء تضع الاستهلاك الكافي من الماء الكلي عند 2.5 لتر/يوم للذكور و2.0 لتر/يوم للإناث — و«الماء الكلي» يشمل الماء داخل الطعام (نحو 20% من الاستهلاك على غذاء نموذجي). ومعهد الطب الأمريكي يضع 3.7 لتر/يوم للذكور و2.7 لتر/يوم للإناث ماءً كليًا، يأتي منها نحو 3.0 لتر و2.2 لتر من المشروبات. وقاعدة الوزن تُشخصن العلم نفسه: ترتفع للأجسام الأثقل وتنخفض للأخف، بدل وصف رقم واحد لكل بالغ.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The tracker clamps the rule between 2,000 ml and 4,500 ml. The floor exists because even small, sedentary bodies need a workable daily minimum; the ceiling exists because the rule is a drinking target, not a dare — pushing far beyond it has its own risks covered in the overhydration section below. Between the clamps the number scales linearly: 55 kg → 1,925 clamped to 2,000 ml; 80 kg → 2,800 ml; 120 kg → 4,200 ml.",
            ar: "تحصر الأداة القاعدة بين 2000 مل و4500 مل. فالأرضية موجودة لأن الأجسام الصغيرة الخاملة أيضًا تحتاج حدًا أدنى قابلًا للعمل يوميًا؛ والسقف موجود لأن القاعدة هدف شرب لا تحدٍّ — فالدفع بعيدًا فوقها له مخاطره الخاصة المغطاة في قسم الإفراط أدناه. وبين الحصرين يتناسب الرقم خطيًا: 55 كجم ← 1925 محصورًا إلى 2000 مل؛ و80 كجم ← 2800 مل؛ و120 كجم ← 4200 مل.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Reference intakes compared (adults)",
              ar: "مقارنة الاستهلاكات المرجعية (البالغون)",
            },
            columns: [
              { en: "Framework", ar: "الإطار" },
              { en: "Men", ar: "الذكور" },
              { en: "Women", ar: "الإناث" },
            ],
            rows: [
              { en: ["This tracker (35 ml/kg, 70 kg body)", "2,450 ml", "2,450 ml"], ar: ["هذه الأداة (35 مل/كجم، جسم 70 كجم)", "2450 مل", "2450 مل"] },
              { en: ["EFSA — total water incl. food", "2.5 L", "2.0 L"], ar: ["الهيئة الأوروبية — ماء كلي شامل الطعام", "2.5 لتر", "2.0 لتر"] },
              { en: ["US IOM — total water incl. food", "3.7 L", "2.7 L"], ar: ["معهد الطب الأمريكي — ماء كلي شامل الطعام", "3.7 لتر", "2.7 لتر"] },
              { en: ["US IOM — from beverages alone", "3.0 L", "2.2 L"], ar: ["معهد الطب الأمريكي — من المشروبات وحدها", "3.0 لتر", "2.2 لتر"] },
            ],
          },
        },
      ],
    },
    {
      id: "adjustments",
      heading: {
        en: "What moves your personal number",
        ar: "ما الذي يحرك رقمك الشخصي",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Heat and sweat: add roughly 400–800 ml per hour of sweaty exercise — more in genuine heat or with heavy sweating. A practical field rule from sports medicine: weigh yourself before and after a hard session; each kilogram lost is about a liter of sweat, and the classic replacement guidance is to drink about 1.5 liters per kilogram lost over the hours that follow. Altitude above roughly 2,500 m increases respiratory and urinary water losses. Fever, vomiting, and diarrhea all add losses that need deliberate replacement, and air-conditioned dry air evaporates skin water silently all day.",
            ar: "الحرارة والعرق: أضف نحو 400–800 مل لكل ساعة تمرين مُعرِق — وأكثر في حر حقيقية أو عرق غزير. وقاعدة ميدانية عملية من طب الرياضة: زِن نفسك قبل جلسة شاقة وبعدها؛ فكل كيلوغرام مفقود نحو لتر عرق، والإرشاد الكلاسيكي للتعويض شرب نحو 1.5 لتر لكل كيلوغرام مفقود على الساعات التالية. والارتفاع فوق نحو 2500 متر يزيد خسائر الماء التنفسية والبولية. والحمى والقيء والإسهال كلها تضيف خسائر تحتاج تعويضًا متعمدًا، وهواء التكييف الجاف يبخّر ماء الجلد بصمت طوال اليوم.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Caffeine is weaker than folklore claims: up to about 400 mg per day (roughly four cups of coffee) does not dehydrate habitual drinkers — the water in the cup vastly outweighs the mild diuretic effect, and tolerance develops within days. Alcohol is different: it suppresses the antidiuretic hormone and genuinely increases urine output, so a drinking evening deserves deliberate water alongside. Pregnancy and breastfeeding raise needs substantially (breastfeeding adds roughly 600–700 ml/day), and those guidelines belong to the treating clinician rather than any generic calculator.",
            ar: "الكافيين أضعف مما تزعم الحكايات: فحتى نحو 400 ملغ يوميًا (أربعة أكواب قهوة تقريبًا) لا يجفّف شاربيه المعتادين — فماء الكوب يرجح كثيرًا على الأثر الإدراري الخفيف، والتحمل يتطور خلال أيام. والكحول مختلف: يثبط الهرمون المضاد للإدرار ويزيد إفراز البول فعلًا، فأمسية شرب تستحق ماءً متعمدًا إلى جانبها. والحمل والإرضاع يرفعان الاحتياج جوهريًا (يضيف الإرضاع نحو 600–700 مل/يوم)، وهذه الإرشادات من اختصاص الطبيب المعالج لا أي حاسبة عامة.",
          },
        },
      ],
    },
    {
      id: "dehydration-signs",
      heading: {
        en: "Recognizing real dehydration",
        ar: "التعرف على الجفاف الحقيقي",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The honest tell is urine, not a feeling: pale straw color says you are fine; dark amber says drink now. Volume matters too — urinating roughly every 3–4 hours with a reasonable stream is the normal rhythm; twice a day means you are running dry. By the time you feel clearly thirsty, fluid deficit has usually already passed 1% of body mass; headaches, unusual fatigue, difficulty concentrating, and constipation all arrive in the mild-dehydration band before anything dramatic. Dry lips and mouth are early local signs, not reliable overall measures.",
            ar: "الدليل الصادق هو البول لا الإحساس: فاللون القشّي الباهت يقول إنك بخير؛ والكهرمان الداكن يقول اشرب الآن. والحجم مهم أيضًا — التبول كل 3–4 ساعات تقريبًا بتيار معقول هو الإيقاع الطبيعي؛ ومرتان يوميًا تعني أنك تجري جافًا. وحين تشعر بالعطش بوضوح يكون العجز السائلي عادةً قد تجاوز أصلًا 1% من كتلة الجسم؛ فالصداع والتعب غير المعتاد وصعوبة التركيز والإمساك كلها تصل في نطاق الجفاف الخفيف قبل أي شيء درامي. والشفتان والفم الجافان علامتان موضعيتان مبكرتان، لا مقياسان موثوقان للكل.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The two situations where mild dehydration turns urgent: heavy exercise in heat, where sweat losses can reach 1–2 liters per hour and thirst lags far behind the deficit; and illness in infants and the elderly, whose thirst signals and kidney concentration ability are weaker. Dizziness on standing, confusion, cessation of sweating in heat, or urine output falling to near zero are stop-and-seek-care signs, not hydration-app territory.",
            ar: "موقفان يحول فيهما الجفاف الخفيف إلى إلحاح: التمرين الشاق في الحر، حيث تبلغ خسائر العرق 1–2 لتر في الساعة ويتخلف العطش كثيرًا عن العجز؛ والمرض عند الرُضّع وكبار السن، الذين إشاراتُ عطشهم وقدرةُ تركيز كلاهم أضعف. والدوخة عند الوقوف، والتشوش، وتوقف التعرق في الحر، وهبوط إفراز البول إلى قرب الصفر — علامات توقفٍ وطلبِ رعاية، لا أرض أداة ترطيب.",
          },
        },
      ],
    },
    {
      id: "overhydration",
      heading: {
        en: "The opposite error: overhydration and hyponatremia",
        ar: "الخطأ المعاكس: الإفراط في الترطيب ونقص الصوديوم",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Drinking far beyond need dilutes blood sodium — hyponatremia — and it is a real, occasionally fatal emergency seen in marathon and ultramarathon runners who over-drink plain water for hours, and in people persuaded that heroic gallon-per-day targets are health. Symptoms (nausea, headache, confusion, swelling) echo dehydration's, which leads sufferers to drink more — the wrong turn. The defense is built into this tracker's design: the 35 ml/kg rule with its 4.5-liter ceiling is nowhere near the danger zone for healthy kidneys, and during very long sweaty events, replace a meaningful share of losses with electrolyte-containing drinks rather than plain water alone.",
            ar: "الشرب بعيدًا جدًا عن الحاجة يخفف صوديوم الدم — نقص الصوديوم — وهو إسعاف حقيقي، قاتل أحيانًا، يُرى في عدّائي الماراثون وفوقه ممن يفرطون في شرب الماء الصافي ساعات، وفي من أُقنعوا بأن أهداف الغالون البطولية يوميًا صحة. والأعراض (غثيان، صداع، تشوش، تورم) تحاكي أعراض الجفاف، فيشرب المتألم أكثر — الانعطافة الخطأ. والدفاع مدمج في تصميم هذه الأداة: فقاعدة 35 مل/كجم بسقفها 4.5 لتر لا تقترب من منطقة الخطر لكلى سليمة، وأثناء الأحداث الطويلة المعرقة جدًا عوّض حصة ذات معنى من الخسائر بمشروبات محتوية على إلكتروليتات لا بالماء الصافي وحده.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Healthy kidneys can excrete about 0.8–1.0 liter per hour, so steady sipping across the day is effectively risk-free; the danger pattern is rapid, forced intake of several liters in a short window. Medical conditions that retain water — heart failure, cirrhosis, SIADH — follow fluid limits prescribed by physicians, not weight-scaled rules; if any of those apply to you, this tool's number is a conversation piece, not a prescription.",
            ar: "تستطيع الكلى السليمة إطراح نحو 0.8–1.0 لتر في الساعة، فالرشف الثابت عبر اليوم فعالُ الأمان بلا خطر عمليًا؛ ونمط الخطر هو الاستهلاك السريع المُكرَه لعدة لترات في نافذة قصيرة. والحالات الطبية الحابسة للماء — قصور القلب، والتليف الكبدي، ومتلازمة إفراز الهرمون المضاد للإدرار غير الملائم — تتبع حدود سوائل يصفها الأطباء لا قواعد مقيسة بالوزن؛ فإن انطبق عليك شيء منها فرقم هذه الأداة مادة حوار لا وصفة.",
          },
        },
      ],
    },
    {
      id: "water-in-food",
      heading: {
        en: "The water you eat",
        ar: "الماء الذي تأكله",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "On a typical mixed diet, roughly 20% of total water arrives inside food — more on a produce-heavy one. Logging drinks alone therefore undercounts your true intake, which is fine for a drinking target (the tracker's number is water to drink, matching how EFSA and IOM separate their figures) but worth understanding. The table shows why a cucumber-and-watermelon summer day is almost a hydration strategy by itself.",
            ar: "على غذاء مختلط نموذجي يصل نحو 20% من الماء الكلي داخل الطعام — وأكثر على غالبية المنتجات. لذا فإن تسجيل المشروبات وحدها يقلّ من استهلاكك الحقيقي، وهذا مقبول لهدف شرب (رقم الأداة ماءٌ للشرب، موافقًا لطريقة الهيئة الأوروبية ومعهد الطب في فصل أرقامهما) لكنه جدير بالفهم. ويظهر الجدول لماذا يكون يوم الخيار والبطيخ الصيفي استراتيجية ترطيب بحد ذاته تقريبًا.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Water content of common foods (per 100 g)",
              ar: "محتوى الماء في أطعمة شائعة (لكل 100 غرام)",
            },
            columns: [
              { en: "Food", ar: "الطعام" },
              { en: "Water", ar: "الماء" },
            ],
            rows: [
              { en: ["Cucumber", "95%"], ar: ["خيار", "95%"] },
              { en: ["Watermelon", "92%"], ar: ["بطيخ", "92%"] },
              { en: ["Strawberries", "91%"], ar: ["فراولة", "91%"] },
              { en: ["Tomato", "94%"], ar: ["طماطم", "94%"] },
              { en: ["Lettuce", "96%"], ar: ["خس", "96%"] },
              { en: ["Orange", "87%"], ar: ["برتقال", "87%"] },
              { en: ["Apple", "86%"], ar: ["تفاح", "86%"] },
              { en: ["Banana", "75%"], ar: ["موز", "75%"] },
              { en: ["Boiled potato", "77%"], ar: ["بطاطس مسلوقة", "77%"] },
              { en: ["Cooked rice", "69%"], ar: ["أرز مطبوخ", "69%"] },
              { en: ["Greek yogurt", "85%"], ar: ["زبادي يوناني", "85%"] },
              { en: ["Whole milk", "88%"], ar: ["لبن كامل", "88%"] },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "A 300 g portion of watermelon alone is about 275 ml of water — more than a small glass — plus electrolytes. Soup, stew, and porridge traditions across every cuisine exist partly because boiling water into food is a culturally durable way to hydrate; the salty-sweaty cuisines of hot regions pair them with pickles and teas for the electrolyte half of the equation.",
            ar: "حصة 300 غرام من البطيخ وحدها نحو 275 مل ماء — أكثر من كوب صغير — زائد إلكتروليتات. وتقاليد الشوربة والطاجن والعصيدة في كل مطبخ موجودة جزئيًا لأن غلي الماء داخل الطعام طريقة ثقافية الديمومة للترطيب؛ ومطابخ المناطق الحارة المالحة العرقة تقترن بها المخللات والشاي لنصف المعادلة الإلكتروليتي.",
          },
        },
      ],
    },
    {
      id: "tracker-features",
      heading: {
        en: "How this tracker works — features and privacy",
        ar: "كيف تعمل هذه الأداة — الخصائص والخصوصية",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The workflow takes three seconds a day: enter your weight once and the goal computes at 35 ml/kg within the safe clamps; then tap the cup button through the day (a standard 250 ml glass per tap) or log a custom amount — a bottle, a kettle, a restaurant glass. The progress ring fills toward your goal, the remaining number tells you exactly what is left, and a seven-day bar history reveals your real weekly rhythm — the pattern matters more than any single day, and a Thursday at 60% is a nudge, not a failure. Reset any day, undo a mis-tap, and adjust the goal manually whenever judgment says the rule is wrong for you.",
            ar: "يسير العمل في ثلاث ثوانٍ يوميًا: أدخل وزنك مرة فيُحسب الهدف بـ35 مل/كجم داخل الحصرين الآمنين؛ ثم انقر زر الكوب على مدار اليوم (كوب قياسي 250 مل للنقرة الواحدة) أو سجّل مقدارًا مخصصًا — قارورة، غلاية، كوب مطعم. يمتلئ حلقة التقدم نحو هدفك، ويخبرك الرقم المتبقي بما تبقى بالضبط، ويكشف تاريخ سبعة أيام إيقاعك الأسبوعي الحقيقي — فالنمط أهم من أي يوم مفرد، والخميس عند 60% نبهةٌ لا فشل. صفّر أي يوم، وتراجع عن نقرة خاطئة، وعدّل الهدف يدويًا كلما قال حكمك إن القاعدة تخطئ في حقك.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Everything stays on your device: the log and settings live in your browser's local storage, no account is required, and nothing about your water habits leaves the page unless you later choose to save results with an account. That also means the log is bound to this browser — clearing site data resets history, and switching devices starts fresh; the habit, not the archive, is the asset.",
            ar: "كل شيء يبقى على جهازك: يسكن السجلُ والإعدادات مخزنَ متصفحك المحلي، ولا حساب مطلوب، ولا شيء عن عادات مائك يغادر الصفحة ما لم تختر لاحقًا حفظ النتائج بحساب. ويعني ذلك أيضًا أن السجل مرتبط بهذا المتصفح — فمسح بيانات الموقع يصفّر التاريخ، وتبديل الجهاز يبدأ من جديد؛ فالأصل هو العادة لا الأرشيف.",
          },
        },
        {
          kind: "p",
          text: {
            en: "A closing word on the pursuit of perfect numbers: hydration is a rhythm, not a religion. The tracker's goal is a well-reasoned default from your body weight and the official frameworks; urine color and how you feel remain the ground truth. Aim to finish most days between 80% and 120% of the goal, adjust upward on hot, training, or caffeinated-and-alcoholic days, and let the seven-day picture — not the daily verdict — drive small changes.",
            ar: "كلمة ختام في مطاردة الأرقام المثالية: الترطيب إيقاعٌ لا ديانة. هدف الأداة افتراض مُحسّن جيدًا من وزنك والإطارات الرسمية؛ ولون البول وشعورك يبقيان الحقيقة الأرضية. استهدف إغلاق معظم الأيام بين 80% و120% من الهدف، وارفع في أيام الحر والتدريب والكافيين والكحول، ودع صورة الأيام السبعة — لا الحكم اليومي — تقود التغييرات الصغيرة.",
          },
        },
      ],
    },
    {
      id: "electrolytes",
      heading: {
        en: "Electrolytes — water's silent partner",
        ar: "الإلكتروليتات — الشريك الصامت للماء",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Water never travels alone: sodium, potassium, magnesium, and chloride ride with it and hold the electrical gradients that nerves, muscles, and kidneys run on. Hydration trouble is usually a pair problem — too little water, or too much water without enough electrolytes (the hyponatremia mechanism above). Ordinary days and ordinary meals handle the pairing automatically: salt in food covers sodium, and produce covers potassium. The situations that deliberately break the pairing are the ones that need deliberate repair: heavy sweating (salt leaves in sweat), long endurance events, illness with vomiting or diarrhea, very low-carbohydrate diets (which flush sodium faster in the first weeks), and scorching climates.",
            ar: "الماء لا يسافر وحده أبدًا: فالصوديوم والبوتاسيوم والمغنيسيوم والكلوريد تمتطيه وتحمل التدرجات الكهربائية التي تعمل عليها الأعصاب والعضلات والكلى. ومشكلات الترطيب غالبًا مشكلة زوج — ماء أقل من اللازم، أو ماء أكثر من اللازم بإلكتروليتات لا تكفي (آلية نقص الصوديوم أعلاه). والأيام العادية والوجبات العادية تتكفل بالاقتران تلقائيًا: فملح الطعام يغطي الصوديوم، والمنتجات تغطي البوتاسيوم. والمواقف التي تكسر الاقتران عمدًا هي التي تحتاج إصلاحًا متعمدًا: العرق الغزير (يغادر الملح مع العرق)، وأحداث التحمّل الطويلة، والمرض بقيء أو إسهال، والحميات منخفضة الكربوهيدرات جدًا (تطرد الصوديوم أسرع في الأسابيع الأولى)، والمناخات اللاهبة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The practical repair menu, from kitchen to pharmacy shelf: for training sessions, water with a pinch of salt plus a splash of citrus makes a functioning sports drink at home; for long events, commercial electrolyte mixes matter mainly for their sodium content (check the label for sodium, not for the marketing words around it); and for illness, the world's most evidence-backed rehydration recipe is the humble oral rehydration solution — water, salt, and a carbohydrate source in the ratios medicine has used for decades to save lives. On ordinary days, none of this is necessary: eat food, drink water, and let kidneys do the arithmetic they were designed for.",
            ar: "قائمة الإصلاح العملية، من المطبخ إلى رف الصيدلية: لجلسات التدريب، ماء بقبضة ملح ورشقة حمضيات يصنع مشروبًا رياضيًا عاملًا في البيت؛ وللأحداث الطويلة، تهم خلطات الإلكتروليت التجارية أساسًا لمحتواها الصوديومي (تفقد الملصق بحثًا عن الصوديوم لا عن كلمات التسويق حوله)؛ وللمرض، وصفة إعادة الإماهة الأكثر دعمًا بالأدلة في العالم هي محلول الإماهة الفموي المتواضع — ماء وملح ومصدر كربوهيدرات بالنسب التي استخدمها الطب عقودًا لإنقاذ الأرواح. وفي الأيام العادية لا شيء من هذا ضروري: كُل الطعام، واشرب الماء، ودع الكلى تؤدي الحساب الذي صُممت له.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Where the main electrolytes live (approximate per 100 g)",
              ar: "أين تسكن الإلكتروليتات الرئيسية (تقريبي لكل 100 غرام)",
            },
            columns: [
              { en: "Electrolyte", ar: "الإلكتروليت" },
              { en: "Good everyday sources", ar: "مصادر يومية جيدة" },
            ],
            rows: [
              { en: ["Sodium", "Table salt (39% sodium), bread, cheeses, pickles"], ar: ["الصوديوم", "ملح الطعام (39% صوديوم)، الخبز، الأجبان، المخللات"] },
              { en: ["Potassium", "Bananas (358 mg), potatoes, dates, leafy greens, beans"], ar: ["البوتاسيوم", "الموز (358 ملغ)، البطاطس، التمر، الورقيات، البقول"] },
              { en: ["Magnesium", "Almonds (270 mg), pumpkin seeds, whole grains, dark chocolate"], ar: ["المغنيسيوم", "اللوز (270 ملغ)، بذر اليقطين، الحبوب الكاملة، الشوكولاتة الداكنة"] },
              { en: ["Chloride", "Salt again (60% chloride), olives, seaweed"], ar: ["الكلوريد", "الملح مجددًا (60% كلوريد)، الزيتون، الأعشاب البحرية"] },
            ],
          },
        },
      ],
    },
  ],
  faqs: [
    {
      q: {
        en: "Is coffee dehydrating me?",
        ar: "هل القهوة تجففني؟",
      },
      a: {
        en: "Not in the way folklore says. Caffeine is a mild diuretic, but habitual drinkers develop tolerance within days, and the water in the cup far outweighs the extra urine it triggers — net hydration stays clearly positive up to about 400 mg of caffeine a day, roughly four cups. The honest exceptions: a first-time double espresso on an empty stomach produces a measurable short-term diuretic blip, and caffeine late in the day costs you sleep, which costs you more than any water accounting.",
        ar: "ليس بالطريقة التي تقولها الحكايات. فالكافيين مدرّ خفيف، لكن المعتادين على شربه يطورون تحملًا خلال أيام، وماء الكوب يرجح كثيرًا على البول الإضافي الذي يطلقه — فيبقى صافي الترطيب إيجابيًا بوضوح حتى نحو 400 ملغ كافيين يوميًا، أي أربعة أكواب تقريبًا. والاستثناءان الصادقان: إسبريسو مزدوج أول مرة على معدة خاوية ينتج نبضة إدرارية قصيرة الأمد قابلة للقياس، والكافيين متأخرًا في اليوم يكلفك نومك، وهذه تكلفة أعلى من أي محاسبة ماء.",
      },
    },
    {
      q: {
        en: "Does tea, juice, or soup count toward the goal?",
        ar: "هل يُحسب الشاي أو العصير أو الشوربة في الهدف؟",
      },
      a: {
        en: "Yes — all of them. The tracker's number is plain water to drink, and official frameworks (EFSA, IOM) count all beverages toward total water. Tea and coffee hydrate net (see above), milk is nearly 90% water plus electrolytes, juice is water with sugar attached, and soup is water with a meal attached. A practical habit: log sugary drinks in the tracker's custom entry but treat them as a minority of daily fluids — hydration by soda is legal but expensive in calories.",
        ar: "نعم — كلها. رقم الأداة ماء صافٍ للشرب، والإطارات الرسمية (الهيئة الأوروبية ومعهد الطب) تحسب كل المشروبات في الماء الكلي. فالشاي والقهوة يرطبان صافيًا (انظر أعلاه)، واللبن قرب 90% ماء زائد إلكتروليتات، والعصير ماء بسكر ملتصق، والشوربة ماء بوجبة ملتصقة. وعادة عملية: سجّل المشروبات السكرية في مدخل الأداة المخصص لكن عاملها أقلية من سوائل اليوم — فالترطيب بالمشروبات الغازية مشروع لكنه غالٍ بالسعرات.",
      },
    },
    {
      q: {
        en: "How do I know if I am drinking too much water?",
        ar: "كيف أعرف إن كنت أشرب ماءً أكثر من اللازم؟",
      },
      a: {
        en: "The healthy-kidney ceiling for steady sipping is far above any sane target, so routine over-drinking mostly manifests as constant clear urination and frequent night trips — an annoyance, not a danger. The genuinely dangerous pattern is rapid forced intake of multiple liters in a short window (diluting blood sodium — hyponatremia), seen in long endurance events. This tracker's ceiling of 4.5 L and its gradual daily rhythm keep you far from that territory; if you ever feel nauseated, headachy, or confused while aggressively drinking, stop and seek medical advice rather than drinking more.",
        ar: "سقف الكلى السليمة للرشف الثابت أعلى بكثير من أي هدف معقول، فالإفراط الروتيني يظهر غالبًا كتبول صافٍ متواصل وجولات ليلية متكررة — إزعاجٌ لا خطر. والنمط الخطير فعلًا هو الاستهلاك السريع المُكرَه لعدة لترات في نافذة قصيرة (تخفيف صوديوم الدم — نقص الصوديوم)، كما في أحداث التحمّل الطويلة. سقف هذه الأداة 4.5 لتر وإيقاعها اليومي التدريجي يبقيانك بعيدًا عن تلك المنطقة؛ وإن شعرت يومًا بغثيان أو صداع أو تشوش وأنت تشرب بحدّة فتوقف واطلب مشورة طبية بدل أن تشرب أكثر.",
      },
    },
    {
      q: {
        en: "Why 35 ml per kilogram and not 30 or 40?",
        ar: "لماذا 35 مل لكل كيلوغرام لا 30 أو 40؟",
      },
      a: {
        en: "Because it is the honest center of the evidence band. Weight-scaled recommendations in the nutrition literature cluster roughly between 30 and 40 ml/kg; at 35, a 70 kg adult lands at 2,450 ml — between EFSA's 2.0–2.5 L and the IOM's higher beverage figures, and comfortably inside both when the ~20% of water that arrives in food is counted. The number is a defensible default, not a law: the tracker lets you override it, and urine color remains the final referee.",
        ar: "لأنها المركز الصادق لحزام الأدلة. فالتوصيات المقيسة بالوزن في أدبيات التغذية تتكدس تقريبًا بين 30 و40 مل/كجم؛ وعند 35 يهبط البالغ بوزن 70 كجم عند 2450 مل — بين 2.0–2.5 لتر للهيئة الأوروبية وأرقام معهد الطب الأعلى للمشروبات، وبارتياح داخل الاثنين حين يُحسب نحو 20% من الماء الواصل داخل الطعام. والرقم افتراضٌ قابل للدفاع لا قانون: تتيح الأداة تجاوزه، ويبقى لون البول الحكم النهائي.",
      },
    },
    {
      q: {
        en: "Do I need 8 glasses a day like everyone says?",
        ar: "هل أحتاج 8 أكواب يوميًا كما يقول الجميع؟",
      },
      a: {
        en: "The \"8×8\" rule (eight 8-oz glasses) is a durable piece of folklore whose exact origin no one can pin down — it was never an evidence-based recommendation, and it ignores body size entirely: it prescribes 1.9 liters to a 50 kg woman and a 110 kg man alike. Your water need scales with your mass, your climate, and your training, which is precisely why this tracker anchors to body weight instead of a fixed glass count. If you are 60 kg and sedentary in a cool office, eight glasses overshoots; if you are 95 kg and training in summer, it undershoots by a lot.",
        ar: "قاعدة «8×8» (ثمانية أكواب بثمانية أونصات) قطعة فولكلور دامغة لا يستطيع أحد تثبيت أصلها الدقيق — فلم توصيةً قائمة على الأدلة يومًا، وتتجاهل حجم الجسم كليًا: فتصف 1.9 لتر لامرأة 50 كجم ورجل 110 كجم على السواء. واحتياجك من الماء يتناسب مع كتلتك ومناخك وتدريبك، وهذا بالضبط لماذا ترتكز هذه الأداة على وزن الجسم بدل عدد أكواب ثابت. فإن كنت 60 كجم خاملًا في مكتب بارد فالثمانية تجاوز؛ وإن كنت 95 كجم متدربًا في الصيف فتقصر كثيرًا.",
      },
    },
    {
      q: {
        en: "Does drinking more water help weight loss?",
        ar: "هل شرب ماء أكثر يساعد خسارة الوزن؟",
      },
      a: {
        en: "A little, through honest mechanisms rather than magic. Water drunk before meals adds gastric fullness and slightly reduces intake in some studies — the effect is real but modest. Replacing caloric drinks with water removes liquid calories, which for a soda habit is the single largest easy win available. Water also supports training quality, and dehydration is routinely mistaken for hunger or cravings. What water does not do: burn fat, \"flush toxins\" as popularly imagined, or substitute for an energy deficit. Drink enough to perform and think; create the deficit at the table.",
        ar: "قليلًا، عبر آليات صادقة لا سحر. فالماء قبل الوجبات يضيف امتلاءً معديًا ويقلل الاستهلاك قليلًا في بعض الدراسات — الأثر حقيقي لكنه متواضع. واستبدال المشروبات السكرية بالماء يزيل سعرات سائلة، وهي لعادة المشروبات الغازية أكبر مكسب سهل متاح منفردًا. ويدعم الماء جودة التدريب أيضًا، والجفاف يُظن جوعًا أو اشتهاءً روتينيًا. وما لا يفعله الماء: حرق الدهون، أو «غسل السموم» كما يتخيل الشائع، أو إنابة العجز الطاقي. اشرب ما يكفي للأداء والتفكير؛ واصنع العجز على المائدة.",
      },
    },
    {
      q: {
        en: "Should I drink during workouts, and how much?",
        ar: "هل أشرب أثناء التمارين وكم؟",
      },
      a: {
        en: "Yes, matched to sweat rate. Practical guidance for sessions up to about an hour: 400–800 ml per hour of activity, sipped in portions — enough to finish having lost no more than about 2% of body mass. For long, very sweaty sessions (over 90 minutes, heat, heavy sweaters), include electrolytes — sodium especially — because replacing liters of sweat with plain water alone is exactly the dilution path toward hyponatremia. The weigh-before-and-after method gives your personal sweat rate in one session.",
        ar: "نعم، موازنًا لمعدل العرق. والإرشاد العملي للجلسات حتى ساعة تقريبًا: 400–800 مل لكل ساعة نشاط، مرشوفةً على دفعات — بما يكفي لتنهي الجلسة وقد فقدت أكثر من نحو 2% من كتلة جسمك قليلًا أو لا شيء. وللجلسات الطويلة المعرقة جدًا (فوق 90 دقيقة، حرارة، عرق غزير) أدخل الإلكتروليتات — الصوديوم خصوصًا — لأن تعويض لترات العرق بالماء الصافي وحده هو بالضبط مسار التخفيف نحو نقص الصوديوم. وطريقة الوزن قبل وبعد تعطيك معدل عرقك الشخصي في جلسة واحدة.",
      },
    },
    {
      q: {
        en: "Does drinking water clear skin and acne?",
        ar: "هل شرب الماء يصفّي البشرة وحب الشباب؟",
      },
      a: {
        en: "Hydration supports normal skin function and severe dehydration makes skin look duller, but the leap from \"drink more\" to \"clear skin\" outruns the evidence: acne is driven by hormones, genetics, follicular biology, and specific dietary triggers, and no controlled trial shows extra water clearing it. Drink enough for systemic health and let topical and dermatological care do the skin-specific work — the water salesman's promises are the least hydrated claims in wellness.",
        ar: "يدعم الترطيبُ وظيفة الجلد الطبيعية والجفاف الشديد يجعل البشرة باهتة أكثر، لكن القفزة من «اشرب أكثر» إلى «بشرة صافية» تسبق الأدلة: فحب الشباب تقوده الهرمونات والوراثة وبيولوجيا الجُريبات ومحفزات غذائية محددة، ولا تجربة مضبوطة تظهر ماءً إضافيًا يصفّيه. اشرب ما يكفي لصحة الجملة ودع العناية الموضعية والجلدية تقوم بعمل البشرة الخاص — فوعود بائع الماء أقل الوعود ترطيبًا في صناعة العافية.",
      },
    },
    {
      q: {
        en: "Why do I wake up thirsty every night?",
        ar: "لماذا أستيقظ عطشانًا كل ليلة؟",
      },
      a: {
        en: "The common engine is the day before: dinner heavy in salt, alcohol in the evening (its rebound diuresis leaves you dry at 3 a.m.), afternoon caffeine, mouth breathing or nasal congestion drying the airway, and winter heating drying the bedroom air. Fix those levers first — earlier fluid front-loading (most of your water before 6 p.m.), a salt-lighter dinner, and a humidifier in dry rooms — before deciding you are pathologically thirsty. Persistent excessive thirst with excessive urination, however, is a classic early diabetes signal and deserves a medical check, not a bigger bottle.",
        ar: "المحرك الشائع هو اليوم الذي قبله: عشاء ثقيل الملح، وكحول في المساء (إدراره الارتدي يتركك جافًا في الثالثة فجرًا)، وكافيين بعد الظهر، وتنفس فموي أو احتقان أنفي يجفف المجرى، وتدفئة الشتاء تجفف هواء الغرفة. أصلح هذه الروافع أولًا — تحميل مبكر للسوائل (معظم مائك قبل السادسة مساءً)، وعشاء أخف ملحًا، ومرطب في الغرف الجافة — قبل أن تحكم أنك عطشان مرضيًا. لكن العطش المفرط المستمر مع تبول مفرط إشارة سكري مبكرة كلاسيكية تستحق فحصًا طبيًا لا قارورة أكبر.",
      },
    },
    {
      q: {
        en: "Is sparkling water as hydrating as still water?",
        ar: "هل الماء الفوار مرطب كالماء العادي؟",
      },
      a: {
        en: "Yes — carbonation does not change hydration: the water is absorbed the same way, and controlled comparisons show flat and sparkling hydrate equivalently. The bubbles only matter for comfort (some people feel full faster, which for a hydration goal is a minor behavioral note) and for teeth if the water carries citric acid or sugar — plain carbonated water's mild acidity is negligible for dental health in normal consumption. Choose flat or sparkling by preference; drink whichever you will actually finish.",
        ar: "نعم — الكربنة لا تغير الترطيب: فالماء يُمتص الطريقة نفسها، والمقارنات المضبوطة تظهر العادي والفوار يرطبان بشكل مكافئ. لا تهم الفقاعات إلا للراحة (يشعر بعضهم بالامتلاء أسرع، وهي لهدف الترطيب ملاحظة سلوكية صغرى) وللأسنان إن حمل الماء حمض الستريك أو السكر — حموضة الماء الفوار الصافي الخفيفة مهملة لصحة الأسنان في الاستهلاك الطبيعي. اختر العادي أو الفوار بالتفضيل؛ واشرب ما ستكمله فعلًا.",
      },
    },
    {
      q: {
        en: "Does cold water burn more calories, or hot water digest better?",
        ar: "هل الماء البارد يحرق سعرات أكثر، أم الساخن يحسن الهضم؟",
      },
      a: {
        en: "Both claims are technically true and practically meaningless. Warming a cold glass to body temperature costs a handful of calories — roughly 5–8 kcal per 500 ml — so a full day of ice water burns the equivalent of a single minute of brisk walking. Hot water neither aids nor harms digestion at ordinary temperatures; comfort is the only real difference, and comfort is a legitimate reason to choose either. Hydration is about the volume and rhythm, not the thermometer.",
        ar: "الادعاءان صحيحان تقنيًا وبلا معنى عمليًا. فتسخين كوب بارد إلى حرارة الجسم يكلف حفنة سعرات — نحو 5–8 سعرة لكل 500 مل — فيحرق يومٌ كامل من الماء المثلج ما يعادل دقيقة واحدة من المشي السريع. والماء الساخن لا يحسن الهضم ولا يضره في الحرارات العادية؛ فالراحة هي الفرق الحقيقي الوحيد، وهي سبب مشروع لاختيار أيٍّ منهما. الترطيب مسألة حجم وإيقاع، لا مقياس حرارة.",
      },
    },
    {
      q: {
        en: "Is mineral or bottled water better than tap water?",
        ar: "هل المعدني أو المعبأ أفضل من ماء الصنبور؟",
      },
      a: {
        en: "For hydration, all of them are simply water. The minerals in mineral water are real but trivial next to food — a banana outperforms most bottles for potassium — and regulated tap water in cities with sound standards hydrates identically. Choose by taste, safety of your local supply, and convenience: the bottle you enjoy drinking from beats the bottle with the best marketing chemistry, because the best water on earth is the one you actually finish.",
        ar: "لأغراض الترطيب كلها ماءٌ ببساطة. فمعادن الماء المعدني حقيقية لكنها تافهة بجانب الطعام — فموزة تتفوق على أغلب القوارير بوتاسيومها — وماء الصنبور المنظم في مدن ذات معايير سليمة يرطب تطابقًا. اختر بالطعام المحلي وسلامة إمدادك واليسر: فالقارورة التي تستمتع بالشرب منها تتفوق على القارورة بأفضل كيمياء تسويقية، لأن أفضل ماء على الأرض هو ما تُكمله فعلًا.",
      },
    },
    {
      q: {
        en: "Does adding lemon or fruit make water healthier?",
        ar: "هل إضافة الليمون أو الفاكهة تجعل الماء أصح؟",
      },
      a: {
        en: "It makes water more drinkable, which is its real power: people who dislike plain water drink meaningfully more of a version they enjoy, and the vitamin content of a squeezed slice is nutritionally invisible. So flavor your water freely if it moves your daily number — the tracker has a custom entry exactly for such home mixes — and skip the detox vocabulary that usually surrounds the practice: what changes is your intake, not your blood.",
        ar: "تجعله أكثر قابليةً للشرب، وهذه قوته الحقيقية: فمن يكرهون الماء الصافي يشربون نسخةً يستمتعون بها أكثرَ بوضوح، ومحتوى فيتامين شريحة معصورة غير مرئي تغذويًا. فنكّه ماءك بحرية إن حرك رقمك اليومي — للأداة مدخل مخصص لهذه الخلطات المنزلية بالضبط — وتجاوز مفردات إزالة السموم التي تحيط بالعادة عادةً: فما يتغير هو استهلاكك، لا دمك.",
      },
    },
  ],
};

