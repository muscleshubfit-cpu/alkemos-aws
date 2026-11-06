import type { ToolReference } from "./tool-reference";

/**
 * Macro Calculator reference — Phase SEO-GEO-6.5 (§12.19 P1-6).
 * The calculator implements five diet presets — balanced 30/40/30
 * (P/C/F), low-carb 40/20/40, high-protein 45/35/20, keto 25/5/70,
 * low-fat 35/55/10 — and converts calories to grams at 4/4/9 kcal
 * per gram. Every number in this copy matches the code (canaries pin
 * 70 for keto fat, 45 for high-protein, and the 4/4/9 factors).
 */

export const MACRO_CALCULATOR_CONTENT: ToolReference = {
  slug: "macro-calculator",
  intro: {
    en: "Calories decide whether your weight moves; macros decide what that weight is made of, how you feel while moving it, and how well you perform. This macro calculator takes your daily calorie budget and splits it into protein, carbohydrate, and fat grams across five diet patterns — balanced, low-carb, high-protein, keto, and low-fat — so the same 2,000 calories can become a muscle-retention cut, an endurance machine's fuel plan, or a ketogenic protocol. Below the tool you will find the complete reference: what each macro actually does in your body, the evidence behind protein targets, how to choose a split for your specific goal, how to turn daily grams into real meals, and honest answers to the questions people argue about most.",
    ar: "السعرات تحدد هل يتحرك وزنك؛ والماكروز تحدد مما يتكون هذا الوزن، وكيف تشعر أثناء تحركه، ومستوى أدائك. تأخذ حاسبة الماكروز هذه ميزانية سعراتك اليومية وتوزعها إلى غرامات بروتين وكربوهيدرات ودهون عبر خمسة أنماط غذائية — متوازن، قليل الكربوهيدرات، عالي البروتين، كيتو، قليل الدهون — بحيث يمكن لسعرات الـ2000 نفسها أن تصبح خطة خسارة تحافظ على العضلات، أو وقوداً لآلة تحمل، أو بروتوكول كيتوجيني. وتحت الأداة ستجد المرجع الكامل: ما يفعله كل مغذٍّ منها فعلاً في جسمك، والأدلة وراء أهداف البروتين، وكيف تختار توزيعاً لهدفك تحديداً، وكيف تحوّل الغرامات اليومية إلى وجبات حقيقية، وإجابات صادقة عن أكثر الأسئلة جدلاً.",
  },
  sections: [
    {
      id: "what-are-macros",
      heading: {
        en: "What are macronutrients?",
        ar: "ما هي المغذيات الكبرى؟",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Macronutrients are the three nutrient families your body needs in large quantities: protein, carbohydrates, and fat. Each carries a fixed energy density known as the Atwater factors — protein 4 kcal per gram, carbohydrates 4 kcal per gram, and fat 9 kcal per gram. Those three numbers are the entire mathematics of macro planning: a 2,000-kcal day is 2,000 kcal no matter how you arrange it, but the arrangement determines what your body does with those calories.",
            ar: "المغذيات الكبرى هي العائلات المغذية الثلاث التي يحتاجها جسمك بكميات كبيرة: البروتين والكربوهيدرات والدهون. لكل منها كثافة طاقة ثابتة تُعرف بعوامل Atwater — البروتين 4 سعرة للغرام، والكربوهيدرات 4 سعرة للغرام، والدهون 9 سعرة للغرام. هذه الأرقام الثلاثة هي كل رياضيات تخطيط الماكروز: فاليوم ذو الـ2000 سعرة يبقى 2000 سعرة أيّاً كان ترتيبها، لكن الترتيب هو ما يحدد ما يفعله جسمك بهذه السعرات.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The three macros are not interchangeable fuel. Protein is primarily structural material — it builds and repairs muscle, enzymes, hormones, and immune cells, and the body has no significant protein storage, so a daily supply matters. Carbohydrates are the preferred fuel for high-intensity work and the central nervous system; they are stored as glycogen in muscle and liver. Fat is the dense energy reserve, the carrier of the fat-soluble vitamins A, D, E, and K, and the raw material for key hormones including testosterone and estrogen. Cutting any one of them to zero has consequences; the skill is proportioning them to your goal.",
            ar: "المغذيات الثلاث ليست وقوداً قابلاً للتبادل. فالبروتين مادة بنائية بالدرجة الأولى — يبني العضلات ويصلحها، والإنزيمات، والهرمونات، وخلايا المناعة، ولا يملك الجسم مخزوناً بروتينياً كبيراً، لذا فالإمداد اليومي مهم. والكربوهيدرات الوقود المفضل للعمل عالي الشدة والجهاز العصبي المركزي؛ وتُخزن جليكوجيناً في العضلة والكبد. والدهون احتياطي الطاقة الكثيف، وناقل الفيتامينات الذوابة في الدهون A و D و E و K، والمادة الخام لهرمونات رئيسية بينها التستوستيرون والإستروجين. وخفض أيٍّ منها إلى الصفر له عواقب؛ والمهارة في تناسبها مع هدفك.",
          },
        },
        {
          kind: "p",
          text: {
            en: "A useful mental model: protein sets your structure, fat sets your hormones and health floor, and carbohydrates fill the remaining budget around your activity. This is why the presets below all keep protein and fat deliberate and let carbs be the flexible variable — and why \"how many carbs per day\" has a different answer for a marathoner than for an office worker with the same calorie target.",
            ar: "نموذج ذهني مفيد: البروتين يحدد بنيتك، والدهون تحدد هرموناتك وأرضية صحتك، والكربوهيدرات تملأ الميزانية المتبقية حول نشاطك. لهذا تحافظ الأنماط أدناه كلها على بروتين ودهون مقصودين وتترك الكربوهيدرات متغيراً مرناً — ولهذا يختلف جواب «كم كربوهيدرات في اليوم» لعدّاء ماراثون عن موظف مكتبي بالهدف السعري نفسه.",
          },
        },
      ],
    },
    {
      id: "how-it-works",
      heading: {
        en: "How the macro calculator works — the five presets",
        ar: "كيف تعمل حاسبة الماكروز — الأنماط الخمسة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "You enter your daily calorie budget (from the calorie calculator or your own tracking data) and pick a diet pattern; the calculator converts each percentage into calories and then into grams — protein and carbohydrate calories divided by 4, fat calories divided by 9. The five presets are fixed, named patterns with defined logic rather than arbitrary sliders, which keeps the result reproducible and explainable.",
            ar: "تُدخل ميزانية سعراتك اليومية (من حاسبة السعرات أو من بيانات تسجيلك) وتختار نمطاً غذائياً؛ فتحوّل الحاسبة كل نسبة إلى سعرات ثم إلى غرامات — سعرات البروتين والكربوهيدرات تُقسم على 4، وسعرات الدهون على 9. الأنماط الخمسة أنماط مسماة ثابتة بمنطق محدد لا منزلقات اعتباطية، وهذا ما يجعل النتيجة قابلة للتكاثر والتفسير.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "The five diet presets (percent of calories: protein / carbs / fat)",
              ar: "الأنماط الغذائية الخمسة (نسبة السعرات: بروتين / كربوهيدرات / دهون)",
            },
            columns: [
              { en: "Preset", ar: "النمط" },
              { en: "Protein", ar: "البروتين" },
              { en: "Carbs", ar: "الكربوهيدرات" },
              { en: "Fat", ar: "الدهون" },
            ],
            rows: [
              { en: ["Balanced", "30%", "40%", "30%"], ar: ["متوازن", "30%", "40%", "30%"] },
              { en: ["Low carb", "40%", "20%", "40%"], ar: ["قليل الكربوهيدرات", "40%", "20%", "40%"] },
              { en: ["High protein", "45%", "35%", "20%"], ar: ["عالي البروتين", "45%", "35%", "20%"] },
              { en: ["Keto", "25%", "5%", "70%"], ar: ["كيتو", "25%", "5%", "70%"] },
              { en: ["Low fat", "35%", "55%", "10%"], ar: ["قليل الدهون", "35%", "55%", "10%"] },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "Each preset exists for a real use case. Balanced is the default for general health and mixed training. Low carb suits people who control appetite better with fewer starches without needing ketosis. High protein serves cutting phases and muscle-focused diets where sparing muscle outranks fuel variety. Keto is the therapeutic-and-performance protocol that restricts carbohydrates to about 5% to shift the body into ketone metabolism — a commitment with real adaptation costs, not a casual slider. Low fat is the classic endurance-athlete pattern that maximizes carbohydrate room for high training volumes.",
            ar: "لكل نمط حالة استخدام حقيقية. «المتوازن» افتراضي الصحة العامة والتدريب المختلط. و«قليل الكربوهيدرات» يناسب من يضبط شهيته بشكل أفضل بنشويات أقل دون حاجة للكيتوزس. و«عالي البروتين» يخدم مراحل الخسارة والحميات العضلية حيث توفيرُ العضلة يتقدم على تنوع الوقود. و«كيتو» بروتوكول علاجي-أدائي يقيد الكربوهيدرات إلى نحو 5% لنقل الجسم إلى أيض الكيتونات — التزام بكلفة تكيف حقيقية لا منزلق عابر. و«قليل الدهون» النمط الكلاسيكي لرياضيي التحمّل الذي يعظّم حصة الكربوهيدرات لأحجام تدريب عالية.",
          },
        },
      ],
    },
    {
      id: "protein-deep-dive",
      heading: {
        en: "Protein: the macro that pays for muscle",
        ar: "البروتين: المغذي الذي يدفع ثمن العضلات",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Protein is made of amino acids; nine of them are essential — the body cannot make them and must receive them from food. Digestion breaks dietary protein down, and the body reassembles the amino acids into its own structures: contractile muscle fibers, enzymes, antibodies, transport proteins, and hormones. Resistance training signals which structures to build; dietary protein supplies the bricks. Without the signal, extra protein is not stored as muscle; without the bricks, the signal cannot be executed.",
            ar: "يتكون البروتين من أحماض أمينية؛ تسعة منها أساسية — لا يستطيع الجسم تصنيعها ويجب أن يتلقاها من الطعام. يفكّ الهضم البروتينَ الغذائي، ثم يعيد الجسم تجميع الأحماض الأمينية في بُنى خاصة: ألياف العضلات المتقلصة، والإنزيمات، والأجسام المضادة، وبروتينات النقل، والهرمونات. فتدريب المقاومة يُشير إلى أي البُنى تُبنى؛ والبروتين الغذائي يوفر الطوب. من دون الإشارة لا يُخزَّن البروتين الزائد عضلاً؛ ومن دون الطوب لا تُنفَّذ الإشارة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "How much do you need? The recommended dietary allowance (about 0.8 g per kg of body weight) is the minimum to prevent deficiency in sedentary adults — not an optimum for anyone training. Research on people who lift consistently supports a range of roughly 1.6–2.2 g per kg of body weight per day to maximize muscle retention and growth; during a calorie deficit the upper half of that range is the safer residence because protein's thermic effect and satiety both help the diet, and muscle preservation becomes harder in an energy shortage. Spread across three to five feedings of at least 0.3 g per kg each, this fits comfortably into ordinary meals.",
            ar: "كم تحتاج؟ البدل الغذائي الموصى به (نحو 0.8 غ لكل كجم من وزن الجسم) هو الحد الأدنى لمنع النقص عند البالغين الخاملين — وليس أمثليةً لأي شخص يتدرب. تدعم الأبحاث على من يرفع الأثقال باستمرار نطاقاً يقارب 1.6–2.2 غ لكل كجم من وزن الجسم يومياً لتعظيم حفظ العضلات ونموها؛ وأثناء عجز السعرات فالنصف الأعلى من النطاق مقرّ أأمن، لأن التأثير الحراري للبروتين وشبعه كليهما يخدمان الحمية، ولأن الحفاظ على العضلة يصير أصعب في نقص الطاقة. موزعةً على ثلاث إلى خمس وجبات لا تقل كل منها عن 0.3 غ لكل كجم، تدخل هذه الكمية في وجبات عادية بارتياح.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Protein quality varies with leucine content and digestibility, but over a full day of mixed eating, variety handles quality for you: animal proteins (meat, fish, eggs, dairy) are complete, and complementary plant pairs — legumes with grains, such as the fava beans and bread of a traditional Middle Eastern breakfast — together cover the essential amino acids. The table below gives honest per-100 g reference values for the proteins that actually appear in everyday kitchens.",
            ar: "تتفاوت جودة البروتين بمحتوى الليوسين وقابلية الهضم، لكن على مدى يوم كامل من أكل مختلط تتكفل التنوعُ بالجودة نيابةً عنك: فبروتينات الحيوان (اللحم والسمك والبيت واللبن) كاملة، والأزواج النباتية المتكاملة — البقول مع الحبوب، مثل فول الخبز في فطور شرقي تقليدي — تغطي معاً الأحماض الأمينية الأساسية. يقدم الجدول أدناه قيماً مرجعية صادقة لكل 100 غرام من البروتينات التي تحضر فعلاً في المطابخ اليومية.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Protein content of common foods (per 100 g, approximate)",
              ar: "محتوى البروتين في أطعمة شائعة (لكل 100 غرام، تقريبي)",
            },
            columns: [
              { en: "Food", ar: "الطعام" },
              { en: "Protein (g)", ar: "بروتين (غ)" },
              { en: "Calories", ar: "السعرات" },
            ],
            rows: [
              { en: ["Chicken breast, cooked", "31", "165"], ar: ["صدر دجاج مطبوخ", "31", "165"] },
              { en: ["Tuna, canned in water", "26", "116"], ar: ["تونة معلبة بالماء", "26", "116"] },
              { en: ["Lean beef, cooked", "26", "250"], ar: ["لحم بقري قليل الدهن", "26", "250"] },
              { en: ["Salmon, cooked", "20", "208"], ar: ["سلمون مطبوخ", "20", "208"] },
              { en: ["Shrimp, cooked", "24", "99"], ar: ["جمبري مطبوخ", "24", "99"] },
              { en: ["Egg, whole", "13", "155"], ar: ["بيضة كاملة", "13", "155"] },
              { en: ["Greek yogurt, nonfat", "10", "59"], ar: ["زبادي يوناني خالي الدسم", "10", "59"] },
              { en: ["Cottage cheese", "11", "98"], ar: ["جبن قريش", "11", "98"] },
              { en: ["Whey protein powder", "80", "400"], ar: ["مسحوق بروتين المصل (Whey)", "80", "400"] },
              { en: ["Lentils, cooked", "9", "116"], ar: ["عدس مطبوخ", "9", "116"] },
              { en: ["Chickpeas, cooked", "8.9", "164"], ar: ["حمص مطبوخ", "8.9", "164"] },
              { en: ["Fava beans, cooked", "7.6", "110"], ar: ["فول مدمس", "7.6", "110"] },
              { en: ["Tofu, firm", "8", "76"], ar: ["توفو متماسك", "8", "76"] },
              { en: ["Peanut butter", "25", "588"], ar: ["زبدة الفول السوداني", "25", "588"] },
              { en: ["Almonds", "21", "579"], ar: ["لوز", "21", "579"] },
              { en: ["Full-fat milk", "3.2", "61"], ar: ["لبن كامل الدسم", "3.2", "61"] },
              { en: ["White rice, cooked", "2.7", "130"], ar: ["أرز أبيض مطبوخ", "2.7", "130"] },
              { en: ["Oats, dry", "17", "389"], ar: ["شوفان جاف", "17", "389"] },
            ],
          },
        },
      ],
    },
    {
      id: "carbs-deep-dive",
      heading: {
        en: "Carbohydrates: the performance macro",
        ar: "الكربوهيدرات: مغذي الأداء",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "All carbohydrates end up as glucose, but the packaging differs: sugars hit the bloodstream quickly, starches arrive in chains that digest at various speeds, and fiber — technically a carbohydrate — mostly feeds gut bacteria and slows everything else down. The quality question is not \"how many grams\" but \"in what wrapper\": 100 g of carbohydrate from oats, lentils, fruit, and vegetables comes packaged with fiber, water, vitamins, and slow digestion; the same 100 g from soft drinks and candy arrives naked and fast.",
            ar: "تنتهي كل الكربوهيدرات غلوكوز، لكن الغلاف يختلف: فالسكريات تصل الدم سريعاً، والنشويات تصل في سلاسل تُهضم بسرعات متنوعة، والألياف — كربوهيدرات تقنياً — تُطعم بكتيريا الأمعاء بالدرجة الأولى وتبطئ كل ما عداها. سؤال الجودة ليس «كم غراماً» بل «في أي غلاف»: فـ100 غرام كربوهيدرات من الشوفان والعدس والفاكهة والخضروات تأتي مغلّفة بألياف وماء وفيتامينات وهضم بطيء؛ والمئة غرام نفسها من المشروبات الغازية والحلويات تصل عارية وسريعة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Carbohydrates are stored as glycogen — roughly 300–500 g across muscle and liver in an average adult — and that storage is the tank for intense effort: lifting, sprinting, sparring, interval work. This is why the low-fat preset (55% carbs) exists for high-volume endurance training and why a keto athlete must go through weeks of adaptation before high-intensity performance normalizes. If you train hard most days, the 40% balanced default or higher serves you; if you train lightly or prioritize fat loss appetite control over performance, the low-carb and keto patterns trade some top-end fuel for steadier hunger.",
            ar: "تُخزَّن الكربوهيدرات جليكوجيناً — نحو 300–500 غرام في العضلات والكبد عند بالغ متوسط — وذلك المخزون هو خزان الجهد الشاق: رفع الأثقال، والعدو، والنزال، والعمل المتقطع. لهذا وُجد نمط «قليل الدهون» (55% كربوهيدرات) لتدريب التحمّل عالي الحجم، ولهذا يحتاج ريااضي الكيتو أسابيع تكيف قبل أن يعود أداؤه عالي الشدة إلى طبيعته. إن كنت تتدرب بقوة معظم الأيام فالافتراضي المتوازن 40% أو أعلى يخدمك؛ وإن كنت تتدرب بخفة أو تقدم ضبط شهية الخسارة على الأداء فنمطا «قليل الكربوهيدرات» و«كيتو» يستبدلان بعض وقود القمة بجوع أكثر استقراراً.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Fiber deserves its own sentence: target roughly 25–38 g per day (14 g per 1,000 kcal is the common guideline), which on any preset is best reached through legumes, vegetables, fruit, and intact grains rather than supplements. Fiber slows glucose delivery, feeds the microbiome, and is the difference between a 40%-carb diet that feels steady and one that swings you between sugar highs and crashes.",
            ar: "تستحق الألياف جملة خاصة: استهدف نحو 25–38 غراماً يومياً (14 غراماً لكل 1000 سعرة هو الإرشاد الشائع)، وهو على أي نمط يُبلَغ أفضل عبر البقول والخضروات والفاكهة والحبوب الكاملة لا المكمّلات. فالألياف تبطئ تسليم الغلوكوز وتغذي ميكروبيوم الأمعاء، وهي الفارق بين حمية 40% كربوهيدرات تشعر فيها بالاستقرار وأخرى تتأرجح بك بين نشوة السكر وانهياره.",
          },
        },
      ],
    },
    {
      id: "fat-deep-dive",
      heading: {
        en: "Fat: the health floor you must not drill through",
        ar: "الدهون: أرضية الصحّة التي لا يجوز اختراقها",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Dietary fat carries the fat-soluble vitamins, builds cell membranes, and provides the raw material for steroid hormones. Two fatty acids — linoleic acid (omega-6) and alpha-linolenic acid (omega-3) — are essential: the body cannot synthesize them, and a diet that drills fat too low eventually develops deficiency symptoms. This is why every preset in this calculator keeps fat at or above roughly 0.5–0.6 g per kg of body weight when translated to a typical calorie budget, and why the low-fat preset still reserves 10% of calories for fat.",
            ar: "تحمل الدهون الغذائية الفيتامينات الذوابة فيها، وتبني أغشية الخلايا، وتوفر المادة الخام للهرمونات الستيرويدية. حمضان دهنيان — اللينوليك (أوميغا 6) والألفا-لينولينيك (أوميغا 3) — أساسيان: لا يستطيع الجسم تصنيعهما، وأي حمية تخفض الدهون كثيراً تطور في النهاية أعراض نقص. لهذا تحفظ كل أنماط هذه الحاسبة الدهون عند نحو 0.5–0.6 غ لكل كجم من وزن الجسم على الأقل حين تُترجم إلى ميزانية سعرات نموذجية، ولهذا يبقى نمط «قليل الدهون» محتفظاً بـ10% من السعرات للدهون.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Within the fat budget, the type distribution matters as much as the total. Emphasize monounsaturated fats (olive oil, nuts, avocado) and polyunsaturated fats including the marine omega-3s EPA and DHA from fatty fish; keep saturated fat moderate; and treat industrial trans fats — the hydrogenated oils of cheap pastries and fried fast food — as a minimize-always category, since they remain the one fat class with consistently negative cardiovascular evidence. On a keto preset at 70% fat, these quality rules stop being decoration and become the whole diet's character: build the fat tower on olive oil, eggs, fish, nuts, and dairy rather than processed meats and seed-oil fryers.",
            ar: "داخل ميزانية الدهون يهم توزيع الأنواع كما يهم الإجمالي. ركّز على الدهون الأحادية غير المشبعة (زيت الزيتون، المكسرات، الأفوكادو) والمتعددة غير المشبعة بما فيها أوميغا 3 البحري EPA و DHA من الأسماك الدهنية؛ وأبقِ الدهون المشبعة معتدلة؛ وتعامل مع الدهون المتحولة الصناعية — زيوت الهدرجة في المعجنات الرخيصة والوجبات السريعة المقلية — كفئة «قلّلها دائماً»، فهي طبقة الدهون الوحيدة ذات الأدلة القلبية الوعائية السلبية باستمرار. وعلى نمط الكيتو بـ70% دهون تتوقف هذه القواعد عن كونها زينة وتصير طبع الحمية كله: ابنِ برج الدهون على زيت الزيتون والبيض والسمك والمكسرات والألبان، لا على اللحوم المصنعة ومقالي زيوت البذور.",
          },
        },
      ],
    },
    {
      id: "choosing-your-split",
      heading: {
        en: "Which split fits your goal?",
        ar: "أي توزيع يناسب هدفك؟",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "For fat loss, bias toward the high-protein preset (45/35/20) or run balanced with protein pinned at the top of the 1.6–2.2 g/kg range: protein defends muscle in an energy shortage, keeps satiety manageable, and costs slightly more calories to digest. Do not drop fat below the health floor chasing bigger deficits — cut from carbohydrates first, because dietary fat is structural while carbohydrate is operational fuel.",
            ar: "لخسارة الدهون، مِل إلى نمط «عالي البروتين» (45/35/20) أو شغّل «المتوازن» مع تثبيت البروتين عند الحد الأعلى من نطاق 1.6–2.2 غ/كجم: فالبروتين يدافع عن العضلة في نقص الطاقة، ويبقي الشبع قابلاً للإدارة، ويكلف سعرات أكثر قليلاً في الهضم. ولا تنزل بالدهون دون أرضية الصحّة طلباً لعجز أكبر — اقتطع من الكربوهيدرات أولاً، لأن الدهون الغذائية بنائية والكربوهيدرات وقود تشغيلي.",
          },
        },
        {
          kind: "p",
          text: {
            en: "For muscle gain, the balanced preset (30/40/30) with a modest calorie surplus is the workhorse: carbohydrates fuel the training that builds the stimulus, and the extra insulin environment supports recovery. Skin-and-bones beginners can push carbs higher; anyone gaining fat faster than muscle should trim the surplus, not the protein. For general health and long-term maintenance, the honest answer is that several splits work: the Mediterranean-style balanced pattern wins adherence studies not through magic ratios but through food quality, fiber, and enjoyable meals — the split you can live with beats the split you can only survive for two weeks.",
            ar: "لبناء العضلات، النمط المتوازن (30/40/30) مع فائض سعري معتدل هو حصان العمل: فالكربوهيدرات تزود التدريب الذي يبني التحفيز، والبيئة الأنسولينية المضافة تدعم الاستشفاء. يمكن للنحافين المبتدئين دفع الكربوهيدرات أعلى؛ ومن يتكسب دهناً أسرع من العضلات يقلّص الفائض لا البروتين. وللصحة العامة والتثبيت طويل الأمد، الإجابة الصادقة أن عدة توزيعات تصلح: فالنمط المتوازن على طريقة المتوسط يفوز في دراسات الالتزام لا بنسب سحرية بل بجودة الطعام والألياف والوجبات الممتعة — التوزيع الذي تستطيع العيش معه يتفوق على التوزيع الذي تنجو منه أسبوعين فقط.",
          },
        },
        {
          kind: "p",
          text: {
            en: "A special word on keto (25/5/70): it is a legitimate, well-studied pattern — for epilepsy management historically, and for people whose appetite and adherence genuinely improve in ketosis — but it is not a faster route to fat loss despite water-scale impressions in week one. That early drop is glycogen and its stored water, not fat. Choose keto because your life works better inside it, not because the internet said it burns fat faster; the research repeatedly shows energy balance still rules.",
            ar: "كلمة خاصة عن الكيتو (25/5/70): نمط مشروع مدروس جيداً — لإدارة الصرع تاريخياً، ولمن تتحسن شهويتهم والتزامهم فعلاً داخل الكيتوزس — لكنه ليس طريقاً أسرع لخسارة الدهون رغم انطباعات ميزان الماء في الأسبوع الأول. فذلك الهبوط المبكر جليكوجين وماؤه المخزون لا دهون. اختر الكيتو لأن حياتك تعمل أفضل داخله، لا لأن الإنترنت قال إنه يحرق الدهون أسرع؛ فالأبحاث تكرر أن توازن الطاقة ما يزال يحكم.",
          },
        },
      ],
    },
    {
      id: "macros-by-goal",
      heading: {
        en: "Using the calculator by goal: cutting, building, holding",
        ar: "كيف تستخدم الحاسبة لهدفك؟ تخسيس أم بناء أم ثبات",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Macros for fat loss (the Arabic searcher's «حساب الماكروز للتخسيس») start from the energy side: set the calorie target a few hundred below maintenance — the site's documented working band is roughly 300–500 kcal — then defend muscle from inside the shortage. That means protein parked at the top of the 1.6–2.2 g/kg range or the high-protein preset, fat kept above its health floor, and the cut taken from carbohydrates first, exactly as the split-choosing section prescribes. Track the weekly average of your morning weight, not any single day's reading: the scale swings with water and glycogen, and decisions belong to the trend line.",
            ar: "ماكروز التخسيس («حساب الماكروز للتخسيس») تبدأ من جهة الطاقة: اضبط هدف السعرات أدنى من الثبات بمقدار مئات قليلة — نطاق العمل الموثق في الموقع يقارب 300–500 سعرة — ثم دافع عن العضلة من داخل العجز. يعني هذا بروتيناً مثبتاً عند أعلى نطاق 1.6–2.2 غرام للكيلوغرام أو إعداد البروتين المرتفع، ودهوناً فوق أرضيتها الصحية، والخفض من الكربوهيدرات أولاً كما يصف قسم اختيار التوزيع بالضبط. وتابع متوسط الأسبوع لوزن صباحك لا قراءة يوم واحد: فالميزان يتأرجح بالماء والجليكوجين، والقرارات ملك خط الاتجاه.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Macros for muscle gain («كم أحتاج لبناء العضل؟») flip the energy sign without flipping the discipline: a modest surplus — not a feast — rides on top of the balanced preset, protein stays in the same protective range, and carbohydrates earn their share by fueling the training that supplies the stimulus. The honest pace marker is the mirror and the lifts alongside a weight that climbs slowly; when fat arrives faster than muscle, the prescription is trimming the surplus, never the protein. Gaining is a longer project than losing — plan in months and log honestly.",
            ar: "ماكروز بناء العضل («كم أحتاج لبناء العضل؟») تقلب إشارة الطاقة دون أن تقلب الانضباط: فائض متواضع — لا وليمة — فوق الإعداد المتوازن، وبروتين يظل في النطاق الوقائي نفسه، وكربوهيدرات تكسب حصتها بوقودها للتدريب الذي يمنح التحفيز. ومؤشر الوتيرة الأمين هو المرآة والأوزان المرفوعة مع وزن يصعد ببطء؛ وحين تصل الدهون أسرع من العضل تكون الوصفة تقليم الفائض لا تقليم البروتين أبداً. البناء مشروع أطول من الخسارة — خطط بالشهرين وسجّل بأمانة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Macros for holding weight («ماكروز الثبات») are the quietest and most underrated job: eat at maintenance with protein still high, and let training plus time do the slow work of recomposition — trading a little fat for a little muscle at a stable scale number. This suits beginners, returners, and anyone whose weight goal is already met; the body-fat calculator's own page documents that recomposition moves both numbers slowly and works best from those starting points. Maintenance is also the season's rest stop between cutting and building blocks — visiting it deliberately beats falling into it exhausted.",
            ar: "ماكروز الثبات أهدأ الوظائف وأكثرها إهمالاً: كُل عند الثبات وبروتينك ما زال مرتفعاً، ودع التدريب والزمن ينجزا عمل إعادة التكوين البطيء — مبادلة قليل من الدهون بقليل من العضل عند رقم ثابت على الميزان. هذا يناسب المبتدئين والعودين ومن حقق هدف وزنه أصلاً؛ وصفحة حاسبة دهون الجسم نفسها توثق أن إعادة التكوين تحرك الرقمين ببطء وتعمل أفضل من نقاط البداية تلك. والثبات أيضاً محطة راحة الموسم بين كتل التنشيف والبناء — زيارته عمداً أفضل من السقوط فيه منهكاً.",
          },
        },
      ],
    },
    {
      id: "grams-to-meals",
      heading: {
        en: "From daily grams to actual meals",
        ar: "من الغرامات اليومية إلى الوجبات الفعلية",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "A macro plan becomes real when it survives contact with a kitchen. The practical method: divide your daily protein across three to five meals first (protein anchors each meal and keeps per-meal amino acid availability useful), then attach carbohydrates where they serve you — around training, or at the meal you enjoy most — and let fat fill in as the cooking medium and flavor carrier. On a 2,000-kcal balanced target this might look like: breakfast of eggs with ful (fava beans) and a slice of bread; a lunch of chicken with rice and a large salad with olive oil; a dinner of fish or lentils with vegetables; and a yogurt-and-fruit snack in between.",
            ar: "تصبح خطة الماكروز حقيقية حين تنجو من الاحتكاك بالمطبخ. الطريقة العملية: وزّع بروتينك اليومي على ثلاث إلى خمس وجبات أولاً (البروتين يرسّخ كل وجبة ويبقي توافر الأحماض الأمينية لكل وجبة نافعاً)، ثم ألصق الكربوهيدرات حيث تخدمك — حول التدريب، أو عند الوجبة التي تستمتع بها أكثر — ودع الدهون تكتمل وسيطَ طهي وحاملَ نكهة. على هدف متوازن بـ2000 سعرة قد يبدو الأمر هكذا: فطور بيض مع فول وربع رغيف؛ غداء دجاج مع أرز وسلطة كبيرة بزيت الزيتون؛ عشاء سمك أو عدس مع خضروات؛ وسناك زبادي وفاكهة بينها.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Two habits carry most of the value. First, build repeatable meal templates — the same breakfast on weekdays, two rotating lunches — so logging becomes effortless and intake variance collapses; variety lives in dinner and seasonings. Second, think in \"portion units\" you can eyeball: a palm of protein, a fist of carbohydrate, a thumb of fat, unlimited watery vegetables. Eyeballing is less precise than a scale, but a plan you can execute at a restaurant with your eyes is worth more than a perfect plan that only works at home with a food scale. The dedicated meal planner tool turns these templates into a full day with per-item macros and a running total.",
            ar: "عادتان تحملان معظم القيمة. الأولى: ابنِ قوالب وجبات قابلة للتكرار — الفطور نفسه أيام العمل، غذاءان متناوبان — فيصبح التسجيل بلا جهد وينهار تباين الاستهلاك؛ والتنوع يسكن العشاء والتوابل. الثانية: فكر «بوحدات حصص» تقدّرها بعينك: كفّ بروتين، قبضة كربوهيدرات، إبهام دهون، وخضروات مائية بلا حدود. التقدير البصري أدق أقل من الميزان، لكن الخطة التي تنفذها في مطعم بعينك أفضل من خطة مثالية تعمل في البيت فقط بميزان طعام. أداة مخطط الوجبات المخصصة تحوّل هذه القوالب إلى يوم كامل بماكروز لكل صنف وإجمالي متراكم.",
          },
        },
      ],
    },
    {
      id: "adjusting-over-time",
      heading: {
        en: "Adjusting the split as your body responds",
        ar: "تعديل التوزيع مع استجابة جسمك",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Run any chosen split for two to three weeks under consistent measurement — same scale, same time of day, weekly averages — before judging it. If weight trend, training performance, hunger, and digestion all point the right way, change nothing. If fat loss stalls with everything else clean, the first lever is total calories, not the macro ratio; if you feel flat and weak in training on low carbs, raise carbohydrate (and reduce fat to keep calories equal) before abandoning the plan. The split serves the outcome, never the reverse.",
            ar: "شغّل أي توزيع تختاره أسبوعين إلى ثلاثة تحت قياس متسق — الميزان نفسه، الوقت نفسه من اليوم، متوسطات أسبوعية — قبل الحكم عليه. إن أشار اتجاه الوزن وأداء التدريب والجوع والهضم كلها إلى الاتجاه الصحيح فلا تغيّر شيئاً. إن توقفت خسارة الدهون وكل ما عدا ذلك نظيف، فالرافعة الأولى إجمالي السعرات لا نسبة الماكروز؛ وإن شعرت بالخمول والضعف في التدريب على قليل الكربوهيدرات فارفع الكربوهيدرات (واخفض الدهون لتبقى السعرات متساوية) قبل التخلي عن الخطة. التوزيع يخدم النتيجة، ولا عكس أبداً.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Recalculate after every 4–5 kg of body-weight change, because a smaller body spends less and your protein floor shifts with it. Diets that succeed long-term are revisited, not abandoned: the preset that carried you through a 12-week cut will need re-balancing for the maintenance that follows, and the muscle-gain split of a 70 kg beginner is not the split of the 82 kg intermediate he becomes.",
            ar: "أعد الحساب بعد كل 4–5 كجم من تغير وزن الجسم، فالجسم الأصغر ينفق أقل وأرضية بروتينك تتحرك معه. الحميات التي تنجح على المدى الطويل تُزار ولا تُهجر: النمط الذي حملك عبر خسارة 12 أسبوعاً سيحتاج إعادة موازنة للتثبيت الذي يليها، وتوزيع بناء عضلات مبتدئ بوزن 70 كجم ليس توزيع المتوسط صاحب الـ82 كجم الذي يصيره.",
          },
        },
      ],
    },
    {
      id: "practical-tracking",
      heading: {
        en: "Tracking macros in the real world",
        ar: "تتبع الماكروز في العالم الحقيقي",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "A gram target is only as good as the logging habit that feeds it. The professional workflow: read the per-100-gram column on the package (not the per-serving figure, which the manufacturer chooses to flatter), weigh the portion in the state you will actually eat it (cooked weight for rice and pasta, with a one-time calibration of your household cups and spoons against the scale), and enter the grams. For whole foods without labels, a food database or this site's food library covers the per-100 g values. Two weeks of this builds a calibrated eye that stays accurate within about 10% — good enough for every purpose except final-stage cuts.",
            ar: "هدف الغرامات لا يكون أفضل من عادة التسجيل التي تغذيه. سير العمل الاحترافي: اقرأ عمود «لكل 100 غرام» على العلبة (لا رقم «الحصة» الذي يختاره المصنّع مجاملةً)، وزِن الحصة في الحالة التي ستأكلها فعلاً (وزن مطبوخ للأرز والمكرونة، مع معايرة لمرة واحدة لأكواب وملاعق بيتك مقابل الميزان)، وأدخل الغرامات. وللأطعمة الكاملة بلا ملصقات، قاعدة بيانات أطعمة أو مكتبة الأطعمة في هذا الموقع تغطي قيم كل 100 غرام. أسبوعان من هذا يبنيان عيوناً معايَرة تبقى دقيقة ضمن نحو 10% — كافية لكل غرض عدا الخسارات النهائية.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The three errors that quietly ruin otherwise honest logs: the cooking oil error (a tablespoon of oil added to the pan is 120 kcal that evaporates from memory the moment it leaves the bottle — log it), the weekend amnesia error (two relaxed days per week can carry a third of the week's calories and undo four disciplined days), and the liquid calorie error (juices, lattes, and sugary teas bypass the fullness system almost entirely). Correct those three and most \"my macros do not work\" cases resolve themselves; the macro calculator was never the broken part.",
            ar: "الأخطاء الثلاثة التي تفسد بهدوء سجلاتٍ صادقة فيما عداها: خطأ زيت الطهي (ملعقة زيت في المقلاة 120 سعرة تتبخر من الذاكرة لحظة مغادرتها الزجاجة — سجّلها)، وخطأ فقدان ذاكرة نهاية الأسبوع (يوما استرخاء أسبوعياً قد يحملان ثلث سعرات الأسبوع ويمحوان أربعة أيام منضبطة)، وخطأ السعرات السائلة (العصائر واللاتيه والشاي المحلى تتجاوز نظام الشبع كلياً تقريباً). صحّح هذه الثلاثة فتُحلّ أغلب حالات «ماكروزي لا تعمل» من تلقاء نفسها؛ فحاسبة الماكروز لم تكن الجزء المعطوب قط.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Finally, know when to stop: the goal of tracking is a plan you can execute, not a surveillance state over food. Hit weekly averages, accept 10% error as the natural noise floor of real kitchens, and graduate to eyeballed portions once your weight trend proves the eyes are calibrated. Precision is a tool you pick up for specific missions — plateaus, deadlines, competition prep — and put down again when the mission ends.",
            ar: "وأخيراً، اعرف متى تتوقف: هدف التتبع خطةٌ تستطيع تنفيذها، لا دولة مراقبة فوق الطعام. التزم بالمتوسطات الأسبوعية، واقبل خطأ 10% أرضيةَ الضجيج الطبيعية للمطابخ الحقيقية، وارتقِ إلى الحصص المقدَّرة بالعين متى أثبت اتجاهُ وزنك أن عينيك معايَرتان. الدقة أداة ترفعها لمهام محددة — الثبات، والمواعيد النهائية، وتحضير المنافسات — وتضعها حين تنتهي المهمة.",
          },
        },
      ],
    },
  ],
  faqs: [
    {
      q: {
        en: "How many grams of protein per day do I really need?",
        ar: "كم غرام بروتين يومياً أحتاج فعلاً؟",
      },
      a: {
        en: "If you train with weights or play sport seriously, research supports roughly 1.6–2.2 g per kg of body weight daily — a 75 kg person lands between 120 and 165 g. Sedentary adults are fine near 0.8–1.0 g per kg, which is the deficiency-prevention level, not an optimum. During a fat-loss diet, live in the upper half of the range: muscle is easiest to lose when calories are short.",
        ar: "إن كنت تتدرب بالأثقال أو تمارس رياضة بجدية، فالأبحاث تدعم نحو 1.6–2.2 غ لكل كجم من وزن الجسم يومياً — شخص بوزن 75 كجم يقع بين 120 و165 غراماً. والخاملون بخير قرب 0.8–1.0 غ لكل كجم، وهو مستوى منع النقص لا الأمثلية. وأثناء حمية خسارة الدهون اسكن النصف الأعلى من النطاق: فالعضلة أسهل ما تُفقد حين تكون السعرات شحيحة.",
      },
    },
    {
      q: {
        en: "Do macro ratios matter if calories are right?",
        ar: "هل تهم نسب الماكروز ما دامت السعرات صحيحة؟",
      },
      a: {
        en: "For body weight alone, calories dominate — controlled feeding studies show weight change tracks energy intake regardless of ratio. For body composition, performance, hunger, and health, the ratio matters a lot: adequate protein preserves muscle in a deficit, carbohydrate availability sets training quality, and fat below the floor damages hormones and vitamin absorption. Get calories right first, then use the ratio to decide what the weight is made of and how the diet feels.",
        ar: "لوزن الجسم وحده تهيمن السعرات — فتجارب التغذية المضبوطة تُظهر أن تغير الوزن يتبع الطاقة المتناولة أيّاً كانت النسبة. أما لتكوين الجسم والأداء والجوع والصحة فالنسبة تهم كثيراً: فالبروتين الكافي يحفظ العضلة أثناء العجز، وتوافر الكربوهيدرات يحدد جودة التدريب، والدهون دون الأرضية تضر بالهرمونات وامتصاص الفيتامينات. اضبط السعرات أولاً، ثم استخدم النسبة لتحديد مما يتكون الوزن وكيف تشعر الحمية.",
      },
    },
    {
      q: {
        en: "Is the keto split safe long-term?",
        ar: "هل توزيع الكيتو آمن على المدى الطويل؟",
      },
      a: {
        en: "For most healthy adults, nutritional ketosis at 25/5/70 is tolerable for months and shows respectable outcomes in weight-loss trials. The honest caveats: the first one to two weeks carry the \"keto flu\" adaptation; fiber often runs low unless vegetables are deliberate; athletic top-end intensity can suffer; and anyone with kidney disease, liver disease, or on glucose-lowering medication needs medical clearance first. It is one legitimate pattern among five — not a superiority claim.",
        ar: "عند معظم البالغين الأصحاء، الكيتوزس الغذائي بتوزيع 25/5/70 محتمل لأشهر ويظهر نتائج محترمة في تجارب خسارة الوزن. التحفظات الصادقة: الأسابيع الأولى إلى الثانية تحمل «إنفلونزا الكيتو» التكيفية؛ والألياف تجري منخفضة غالباً ما لم تُتعمد الخضروات؛ وشدة القمة الرياضية قد تتأثر؛ وأي شخص بأمراض الكلى أو الكبد أو على أدوية خافضة للغلوكوز يحتاج تصريحاً طبياً أولاً. هو نمط مشروع واحد بين خمسة — لا ادعاء تفوق.",
      },
    },
    {
      q: {
        en: "Can I eat more protein than the calculator says?",
        ar: "هل يمكنني أكل بروتيناً أكثر مما تقوله الحاسبة؟",
      },
      a: {
        en: "Yes, within reason. Healthy kidneys handle substantially more protein than sedentary guidelines recommend, and slightly overshooting your target costs little — excess protein is mostly oxidized for energy, which does displace carbohydrate calories if your calorie budget is fixed. The practical ceiling is where protein crowds out so much fat and carbohydrate that meals become monotonous, fiber drops, and training fuel suffers. People with diagnosed kidney disease are the population that should treat protein as a prescribed number, not a floor.",
        ar: "نعم، في حدود المعقول. فالكلى السليمة تتعامل مع بروتين يفوق كثيراً توصيات الخاملين، وتجاوز هدفك قليلاً يكلف قليلاً — فالبروتين الفائض يُؤكسد للطاقة بالدرجة الأولى، وهذا يزاحم سعرات الكربوهيدرات فعلاً إن كانت ميزانيتك السعرة ثابتة. السقف العملي هو حيث يزاحم البروتين من الدهون والكربوهيدرات ما يجعل الوجبات رتيبة والألياف تهبط ووقود التدريب يتضرر. ومرضى الكلى المشخّصون هم من يجب أن يتعاملوا مع البروتين كرقم موصوف لا كأرضية.",
      },
    },
    {
      q: {
        en: "Do carbs at night turn into fat?",
        ar: "هل تتحول الكربوهيدرات ليلاً إلى دهون؟",
      },
      a: {
        en: "No more than carbs at noon do. Fat gain follows the total energy balance over days, not the clock; controlled studies feeding the identical calories either earlier or later show no meaningful difference in fat outcomes. Night carbs can even aid sleep and next-day training recovery. What actually matters at night is total daily intake discipline and not eating half the day's calories from dessert-quality sources after dinner.",
        ar: "لا أكثر مما تتحول عند الظهر. فاكتساب الدهون يتبع توازن الطاقة الكلي عبر الأيام لا الساعة؛ والدراسات المضبوطة التي تُطعم السعرات نفسها مبكرة أو متأخرة لا تظهر فرقاً ذا معنى في نتائج الدهون. بل قد تعين كربوهيدرات الليل على النوم واستشفاء تدريب الغد. ما يهم ليلاً فعلاً هو انضباط الاستهلاك اليومي الكلي، وألا تأكل نصف سعرات اليوم من مصادر بجودة الحلويات بعد العشاء.",
      },
    },
    {
      q: {
        en: "What is a macro cycle or refeed?",
        ar: "ما هو تناوب الماكروز أو وجبة إعادة التغذية؟",
      },
      a: {
        en: "A refeed is a planned higher-carbohydrate day (often +50–100 g, calories near maintenance) inserted into a long diet, typically once or twice a week. The mechanism that matters is practical: restored glycogen for training, a psychological break, and better adherence — not the metabolic \"starvation mode reset\" of popular lore. Refeeds earn their place on long cuts; on a short 4-week diet they are mostly a preference.",
        ar: "وجبة إعادة التغذية يومٌ أعلى الكربوهيدرات مخطط له (غالباً +50–100 غرام، والسعرات قرب التثبيت) يُدخل داخل حمية طويلة، عادةً مرة أو مرتين أسبوعياً. الآلية التي تهم عملية: جليكوجين معاد لتدريب أفضل، واستراحة نفسية، والتزامٌ أجود — لا «تصفير نمط المجاعة» الأيضي الذي ترويه الحكايات الشائعة. تستحق هذه الوجبات مكانها في الخسارات الطويلة؛ وفي حمية قصيرة 4 أسابيع هي غالباً تفضيل.",
      },
    },
    {
      q: {
        en: "How do I count macros in mixed dishes?",
        ar: "كيف أحسب الماكروز في الأطباق المختلطة؟",
      },
      a: {
        en: "Decompose the dish into its components and log each: a piece of mahshi, a stew, or a koshari bowl is still rice + protein source + fat + vegetables in known proportions. For home cooking, log the raw ingredients you actually used divided by portions served — that is more accurate than any database entry for \"one plate\". Restaurant meals: pick the nearest decomposed equivalent, accept ±20% error, and keep such meals a minority of the week.",
        ar: "فكك الطبق إلى مكوناته وسجّل كل واحد: فالملوخية أو الطاجن أو طبق كشري ما يزال أرزاً + مصدر بروتين + دهون + خضروات بنسب معلومة. وللطبخ المنزلي: سجّل المكونات النيئة التي استخدمتها فعلاً مقسومة على الحصص المقدمة — أدق من أي مدخلة قاعدة بيانات لـ«طبق واحد». ووجبات المطاعم: اختر المكافئ المفكك الأقرب، واقبل خطأ ±20%، وأبقِ مثل هذه الوجبات أقلية في أسبوعك.",
      },
    },
    {
      q: {
        en: "Is 30% protein too much for kidneys?",
        ar: "هل 30% بروتين كثيرٌ على الكلى؟",
      },
      a: {
        en: "For people with healthy kidneys, no — years of higher-protein diets in athletic populations show no adverse renal outcomes in the research. The 30% figure on a 2,000-kcal budget is 150 g, squarely inside the evidence-supported range for a training adult. The caution belongs to diagnosed kidney disease and to combined extremes (very high protein plus very low hydration for long periods). If you have a kidney diagnosis, set protein targets with your physician.",
        ar: "لمن كلاهما سليمان، لا — فسنوات من الحميات الأعلى بروتيناً في المجتمعات الرياضية لا تظهر مآل كلوية سيئاً في الأبحاث. والرقم 30% على ميزانية 2000 سعرة يعادل 150 غراماً، داخل النطاق المدعوم بالأدلة لبالغ متدرب. والتحذير يخص مرضى الكلى المشخّصين والتركيبات المتطرفة (بروتين عالٍ جداً مع إماهة منخفضة جداً لفترات طويلة). إن كان لديك تشخيص كلوي فضبط أهداف البروتين مع طبيبك.",
      },
    },
    {
      q: {
        en: "Should macros be exact every day?",
        ar: "هل يجب أن تكون الماكروز دقيقة كل يوم؟",
      },
      a: {
        en: "No — hit weekly averages instead. Protein behaves best as a daily anchor (within about ±20 g), but carbohydrate and fat can swing meaningfully day to day as long as the week totals land near plan. This is what makes social life compatible with a macro diet: a heavier Saturday and a lighter Tuesday average out. Precision is a tool for plateau-breaking, not a forever lifestyle.",
        ar: "لا — التزم بالمتوسطات الأسبوعية. فالبروتين يعمل أفضل كمرتكز يومي (ضمن نحو ±20 غراماً)، أما الكربوهيدرات والدهون فيمكن أن تتأرجح يوماً بيوم ما دامت إجماليات الأسبوع تهبط قرب الخطة. هذا ما يجعل الحياة الاجتماعية متوافقة مع حمية الماكروز: سبتٌ أثقل وثلاثاءٌ أخف يتوسطان. الدقة أداة لكسر الثبات، لا أسلوب حياة أبدي.",
      },
    },
    {
      q: {
        en: "Which preset should a beginner choose?",
        ar: "أي نمط يختار المبتدئ؟",
      },
      a: {
        en: "Balanced (30/40/30), almost always. A beginner's results come from training consistency and overall diet adherence, not ratio optimization; the balanced preset teaches the skill of combining a protein source, a carbohydrate source, vegetables, and a sensible fat portion at every meal — a template that transfers to any future goal. Graduate to high-protein for a serious cut, or experiment with keto only if appetite control is your specific battle.",
        ar: "المتوازن (30/40/30)، في كل الأحوال تقريباً. فنتائج المبتدئ تأتي من اتساق التدريب والالتزام الغذائي الكلي، لا من أمثلية النسب؛ والنمط المتوازن يعلمه مهارة جمع مصدر بروتين ومصدر كربوهيدرات وخضروات وحصة دهون معقولة في كل وجبة — قالب ينتقل إلى أي هدف مستقبلي. ارتقِ إلى «عالي البروتين» لخسارة جدية، أو جرب الكيتو فقط إن كانت معركتك الخاصة ضبط الشهية.",
      },
    },
    // SEO-GROWTH-P1 (2026-11-05, owner P1 order «الأسئلة الشائعة ذات
    // الصلة» — the measured numeric-value pattern from the BMI page
    // (PRIORITY-PAGES §A-4: "users search for THEIR numeric value")
    // extended to this tool: these two answer the "what does my number
    // mean / how do I convert it" tail directly, with the page's own
    // documented Atwater arithmetic (4/4/9).
    {
      q: {
        en: "What does 30/40/30 mean in grams on a 2,000-calorie day?",
        ar: "ماذا يعني توزيع 30/40/30 بالغرامات على يوم بسعرات 2000؟",
      },
      a: {
        en: "Percentages become grams through the Atwater factors: grams = (percentage × daily calories) ÷ energy density. On 2,000 kcal, balanced 30/40/30 gives protein 30% × 2,000 = 600 kcal ÷ 4 = 150 g, carbohydrates 40% × 2,000 = 800 kcal ÷ 4 = 200 g, and fat 30% × 2,000 = 600 kcal ÷ 9 ≈ 67 g — the number that surprises most people, because fat's 9 kcal per gram makes its gram budget the smallest of the three. Run the same division at your own calorie target and every preset on this page collapses into plain gram counts you can build meals from.",
        ar: "تتحول النسب إلى غرامات عبر عوامل Atwater: الغرامات = (النسبة × السعرات اليومية) ÷ كثافة الطاقة. فعلى ميزانية 2000 سعرة يعطي المتوازن 30/40/30: بروتين 30% × 2000 = 600 سعرة ÷ 4 = 150 غراماً، وكربوهيدرات 40% × 2000 = 800 سعرة ÷ 4 = 200 غرام، ودهون 30% × 2000 = 600 سعرة ÷ 9 ≈ 67 غراماً — وهو الرقم الذي يفاجئ معظم الناس، لأن 9 سعرة لكل غرام من الدهون تجعل ميزانية غراماتها الأصغر بين الثلاثة. أجرِ القسمة نفسها على هدفك السعري الخاص، وينهار كل نمط في هذه الصفحة إلى عدّاد غرامات صريح تبني منه وجباتك.",
      },
    },
    {
      q: {
        en: "My coach says 2 g of protein per kg — what percentage is that?",
        ar: "مدربي يقول 2 غرام بروتين لكل كيلوغرام — كم تساوي كنسبة مئوية؟",
      },
      a: {
        en: "Depends on your weight and your calorie budget, because grams-per-kg and percentages are two different rulers. The conversion: grams × 4 = kcal of protein; that ÷ total calories × 100 = the percentage. An 80 kg trainee at 2 g/kg eats 160 g = 640 kcal — that is 32% of a 2,000-kcal day but only 26.7% of 2,400. This is why the two worlds rarely agree: a fixed gram target keeps protein anchored to your body weight while a fixed percentage floats it with your calorie budget. When they conflict, anchor protein to grams (the body-weight ruler) and let carbs and fat absorb the difference.",
        ar: "يتوقف ذلك على وزنك وميزانية سعراتك، لأن الغرامات لكل كيلوغرام والنسب المئوية مسطرتان مختلفتان. والتحويل: الغرامات × 4 = سعرات البروتين؛ وهذه ÷ إجمالي السعرات × 100 = النسبة. فمتدرب بوزن 80 كيلوغراماً عند 2 غرام/كجم يأكل 160 غراماً = 640 سعرة — وهي 32% من يوم بسعرات 2000، لكنها 26.7% فقط من يوم بـ2400. لهذا نادراً ما يتفق العالمان: الهدف الغرامي الثابت يرسّخ البروتين إلى وزن جسمك بينما النسبة الثابتة تجعله يطفو مع ميزانية سعراتك. وعند التعارض، رسّخ البروتين بالغرامات (مسطرة وزن الجسم) ودع الكربوهيدرات والدهون تمتصان الفارق.",
      },
    },
  ],
};

