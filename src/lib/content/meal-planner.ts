import type { ToolReference } from "./tool-reference";

/**
 * Meal Planner reference — Phase SEO-GEO-6.5 (§12.19 P1-6).
 * The planner builds meals from a searchable food database with
 * per-100g macros, scales items by grams, and totals calories and
 * protein per meal and per day, saving drafts locally for free users
 * without registration (tier limits raise with membership).
 */

export const MEAL_PLANNER_CONTENT: ToolReference = {
  slug: "meal-planner",
  intro: {
    en: "A calorie target is a number; a meal plan is breakfast you will actually eat on Tuesday. This planner bridges the two: build any number of meals, search a food database for the items on your table, set the portion in grams, and watch calories and protein total per meal and per day in real time — no spreadsheet, and you start instantly. The reference below is the complete method around the tool: why planning beats improvisation, how to structure a day of meals around your training, a fully worked example day with numbers, how to turn the plan into a grocery list, and what to do when real life — restaurants, travel, Ramadan, family dinners — collides with the plan.",
    ar: "هدف السعرات رقمٌ؛ وخطة الوجبات فطورٌ ستأكله فعلًا يوم الثلاثاء. يجسر هذا المخطط بين الاثنين: ابنِ ما تشاء من الوجبات، وابحث في قاعدة أطعمة عن أصناف مائدتك، وحدّد الحصة بالغرامات، وشاهد السعرات والبروتين يتجمعان لكل وجبة ولكل يوم لحظيًا — بلا جداول بيانات، وتبدأ فورًا. والمرجع أدناه هو المنهج الكامل حول الأداة: لماذا يتفوق التخطيط على الارتجال، وكيف تنظم يوم وجبات حول تدريبك، ومثال يوم مشروح بالأرقام، وكيف تحوّل الخطة لقائمة مشتريات، وماذا تفعل حين تصطدم الحياة الواقعية — المطاعم والسفر ورمضان والعزائم — بالخطة.",
  },
  sections: [
    {
      id: "why-plan",
      heading: {
        en: "Why meal planning beats eating on instinct",
        ar: "لماذا يتفوق تخطيط الوجبات على الأكل بالغريزة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Instinct is a fuel gauge calibrated by evolution for scarcity, not for a world of cheap engineered deliciousness. In laboratory and free-living studies alike, people asked to \"eat sensibly\" without structure drift upward in intake, misremember portions by wide margins, and lose the plot entirely when tired or stressed — decision fatigue eats discipline. Planning front-loads the decision: the plan is made once, calmly, with information; eating becomes execution, not judgment, and the evening version of you inherits a decision already made by the morning version who had energy.",
            ar: "الغريزة مقياس وقود معاير بالتطور لبيئة الشح لا لعالم من اللذة الهندسية الرخيصة. ففي الدراسات المخبرية والحرة معًا، من طُلب منهم «الأكل بعقلانية» بلا بنية انجرفوا صعودًا في الاستهلاك، وأساؤوا تذكر الحصص بهوامش واسعة، وخسروا الخيط كليًا عند التعب أو التوتر — إجهادُ القرار يلتهم الانضباط. والتخطيط يحمل القرار مقدمًا: تُصنع الخطة مرة، بهدوء، بالمعلومات؛ فيصبح الأكل تنفيذًا لا حكمًا، وترث نسختك المسائية قرارًا اتخذته أصلًا نسختك الصباحية التي كانت تملك الطاقة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The measurable dividends: portion accuracy (grams on the planner versus \"a bowl\" in memory), protein distribution across the day (the planner makes a lopsided day visible at a glance), grocery precision (buy what the plan contains, waste less), and the quiet psychological dividend of a written plan — documented plans are followed roughly twice as often as intentions in behavior-change research. None of this requires perfection; it requires the plan to exist before the meal does.",
            ar: "الأرباح القابلة للقياس: دقة الحصص (غرامات على المخطط مقابل «طبق» في الذاكرة)، وتوزيع البروتين عبر اليوم (المخطط يجعل اليومَ المائل منظورًا بلمحة)، ودقة المشتريات (اشترِ ما تحتويه الخطة، أهدر أقل)، والربح النفسي الهادئ لخطة مكتوبة — الخطط الموثقة تُتبع نحو ضعف النوايا في أبحاث تغيير السلوك. لا شيء من هذا يتطلب الكمال؛ يتطلب أن توجد الخطة قبل الوجبة.",
          },
        },
      ],
    },
    {
      id: "how-planner-works",
      heading: {
        en: "How this planner works — in ninety seconds",
        ar: "كيف يعمل هذا المخطط — في تسعين ثانية",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The mechanics mirror how nutrition software works, minus the friction. Add a meal — breakfast, lunch, dinner, or any custom name — then search the food database for what is actually on your plate (from staples like rice, chicken, and lentils to branded items), and add it to the meal. Set the portion in grams; the planner scales every food's per-100-gram nutrition data to your portion and accumulates the totals per meal and per day. Rename meals, adjust grams up and down until the daily total lands on your calorie target, and the protein column tells you whether the budget is spent on structure or on filler.",
            ar: "الآليات تحاكي عمل برمجيات التغذية ناقصةَ الاحتكاك. أضف وجبة — فطورًا أو غداءً أو عشاءً أو أي اسم مخصص — ثم ابحث في قاعدة الأطعمة عما هو فعلًا على طبقك (من الأساسيات كالأرز والدجاج والعدس إلى أصناف تجارية)، وأضفه إلى الوجبة. حدّد الحصة بالغرامات؛ فيقيس المخطط بيانات التغذية لكل صنف (لكل 100 غرام) على حصتك ويجمع الإجماليات لكل وجبة ولكل يوم. أعد تسمية الوجبات، وحرّك الغرامات صعودًا وهبوطًا حتى يهبط الإجمالي اليومي على هدف سعراتك، ويخبرك عمود البروتين هل أُنفقت الميزانية على البنية أم على الحشو.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The draft saves itself as you work — your plan survives a closed tab and is waiting when you return, with the essentials free by design. Members unlock convenience at scale (more saved plans, deeper history), but planning a full day with live macro totals stays free, deliberately: the barrier between a visitor and a working plan should be zero.",
            ar: "تحفظ المسودة نفسها أثناء عملك — فخطتك تنجو من تبويب مغلق وتنتظر عند عودتك، والأساسيات مجانية دائمًا. ويفتح الأعضاء اليسرَ على نطاق أوسع (خطط محفوظة أكثر، تاريخًا أعمق)، لكن تخطيط يوم كامل بإجماليات ماكروز حية يبقى حرًا بتعمد: فالحاجز بين زائر وخطة عاملة ينبغي أن يكون صفرًا.",
          },
        },
      ],
    },
    {
      id: "structuring-a-day",
      heading: {
        en: "Structuring a day: meals around training, protein around the day",
        ar: "تنظيم اليوم: الوجبات حول التدريب، والبروتين حول اليوم",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Two rules produce good structure. Rule one — anchor protein: distribute your daily protein target across three to five meals at roughly 0.3–0.4 g per kg each (a 75 kg person: about 25–30 g per meal), because muscle protein synthesis responds to per-meal availability, not only to the daily total. Rule two — place carbohydrate where it works: around training for performance and recovery, or at the meal you socially enjoy most; fat fills the remainder as the cooking medium and satiety carrier.",
            ar: "قاعدان تنتجان بنية جيدة. القاعدة الأولى — ركّز البروتين: وزّع هدفك اليومي من البروتين على ثلاث إلى خمس وجبات بنحو 0.3–0.4 غ لكل كجم لكل وجبة (شخص 75 كجم: نحو 25–30 غ للوجبة)، لأن بناء بروتين العضلة يستجيب لتوافر الوجبة لا للإجمالي اليومي وحده. والقاعدة الثانية — ضع الكربوهيدرات حيث تعمل: حول التدريب للأداء والاستشفاء، أو عند الوجبة التي تستمتع بها اجتماعيًا أكثر؛ وتملأ الدهون الباقيَ وسيطَ طهي وحاملَ شبع.",
          },
        },
        {
          kind: "p",
          text: {
            en: "For morning trainers, that sketch reads: pre-training light carbohydrate (dates and coffee is a time-tested regional combination), a recovery-anchored breakfast, the largest carbohydrate meal at lunch, and a lighter protein-forward dinner. For evening trainers, shift the carbohydrate mass toward the post-training dinner. Intermittent fasting practitioners compress the same architecture into two larger meals — the arithmetic does not change, only the container.",
            ar: "لمتدربي الصباح تقرأ الهيكلة: كربوهيدرات خفيفة قبل التدريب (التمر والقهوة مزيج إقليمي مُختبَر عبر الزمن)، وفطور مرتكز على الاستشفاء، وأكبر وجبة كربوهيدرات غداءً، وعشاء أخف مقدّم البروتين. ولمتدربي المساء انقل كتلة الكربوهيدرات نحو عشاء ما بعد التدريب. وممارسو الصيام المتقطع يضغطون الهندسة نفسها في وجبتين أكبر — الحسبة لا تتغير، يتغير الوعاء فقط.",
          },
        },
        {
          kind: "p",
          text: {
            en: "A word on breakfast skipping: despite the folklore on both sides, controlled trials show breakfast's role is mostly caloric accounting — if skipping it makes your day easier to control, skip it; if it sends you into a 4 p.m. vending-machine spiral, eat it. The planner is agnostic: two meals or five, what counts is the day's total and its protein distribution.",
            ar: "كلمة عن تخطي الفطور: رغم الحكايات على الجانبين، تُظهر التجارب المضبوطة أن دور الفطور غالبًا محاسبيٌ سعري — فإن كان تخطيه يجعل يومك أسهل ضبطًا فتخطَّه؛ وإن كان يرسلك في دوامة آلة البيع الرابعة عصرًا فكُله. المخطط محايد: وجبتان أو خمس، ما يُحسب هو إجمالي اليوم وتوزيع بروتينه.",
          },
        },
      ],
    },
    {
      id: "worked-example",
      heading: {
        en: "A worked example day — numbers you can copy",
        ar: "مثال يوم مشروح — أرقام يمكنك نسخها",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Below is a complete day for a 2,000-kcal balanced target (roughly 150 g protein, 200 g carbohydrate, 67 g fat) built from ordinary foods — the same kind of day the planner computes when you enter the items. Portions are cooked weights.",
            ar: "أدناه يوم كامل لهدف متوازن بـ2000 سعرة (نحو 150 غ بروتين و200 غ كربوهيدرات و67 غ دهون) مبني من أطعمة عادية — اليوم نفسه الذي يحسبه المخطط حين تدخل الأصناف. الحصص أوزان مطبوخة.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Example day at 2,000 kcal (cooked weights, approximate)",
              ar: "يوم مثال عند 2000 سعرة (أوزان مطبوخة، تقريبية)",
            },
            columns: [
              { en: "Meal", ar: "الوجبة" },
              { en: "Items (g)", ar: "الأصناف (غ)" },
              { en: "kcal", ar: "سعرة" },
              { en: "Protein (g)", ar: "بروتين (غ)" },
            ],
            rows: [
              { en: ["Breakfast", "3 eggs (150) + fava beans (150) + 1 pita (60) + olive oil (5)", "560", "35"], ar: ["الفطور", "3 بيضات (150) + فول (150) + رغيف (60) + زيت زيتون (5)", "560", "35"] },
              { en: ["Lunch", "chicken breast (180) + white rice (220) + salad (200) + olive oil (10)", "660", "60"], ar: ["الغداء", "صدر دجاج (180) + أرز أبيض (220) + سلطة (200) + زيت زيتون (10)", "660", "60"] },
              { en: ["Snack", "Greek yogurt (200) + banana (120) + almonds (15)", "390", "22"], ar: ["سناك", "زبادي يوناني (200) + موزة (120) + لوز (15)", "390", "22"] },
              { en: ["Dinner", "lentils (250) + vegetables (150) + olive oil (8)", "390", "26"], ar: ["العشاء", "عدس (250) + خضروات (150) + زيت زيتون (8)", "390", "26"] },
              { en: ["Total", "—", "2,000", "143"], ar: ["الإجمالي", "—", "2000", "143"] },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "Read the structure, not just the numbers: protein lands in every meal (35 / 60 / 22 / 26), carbohydrate sits at lunch and the evening snack, fat rides in as olive oil three times, and the whole day is built from twelve cheap, familiar items. That is the planner's philosophy in one table — ordinary food, honest grams, totals that add up.",
            ar: "اقرأ البنية لا الأرقام فحسب: البروتين يهبط في كل وجبة (35 / 60 / 22 / 26)، والكربوهيدرات تجلس عند الغداء وسناك المساء، والدهون تمتطي زيت الزيتون ثلاث مرات، واليوم كله مبني من اثني عشر صنفًا رخيصًا مألوفًا. تلك فلسفة المخطط في جدول واحد — طعام عادي، وغرامات صادقة، وإجماليات تجتمع.",
          },
        },
      ],
    },
    {
      id: "grocery-list",
      heading: {
        en: "From plan to grocery list",
        ar: "من الخطة إلى قائمة المشتريات",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The plan-to-cart conversion is mechanical and worth doing weekly: sum each food's grams across the week's plans, add about 20% buffer for waste and appetite, and shop once for the staples (rice, lentils, oil, spices, frozen protein) while buying fresh produce twice weekly. This single habit attacks two failure modes at once — the \"nothing in the house\" takeaway spiral and the guilt-driven overbuying of vegetables that rot in the drawer. A household of two can plan five dinners from one protein bulk-buy and rotate the leftovers deliberately into lunches. The planner below does the arithmetic for you: the shopping-list tool right under your plan totals aggregates every item across your meals, scales it by your chosen horizon, adds the buffer, and hands you a copyable list.",
            ar: "تحويل الخطة إلى سلة ميكانيكيٌّ وجدير بالأداء أسبوعيًا: اجمع غرامات كل صنف عبر خطط الأسبوع، وأضف نحو 20% احتياطًا للهدر والشهية، وتسوّق مرة للأساسيات (الأرز والعدس والزيت والتوابل والبروتين المجمد) واشترِ المنتجات الطازجة مرتين أسبوعيًا. هذه العادة الواحدة تهاجم نمطي فشل معًا — دوامة طلبات الطعام «لا شيء في البيت»، وشراء الخضروات بدافع الذنب فتتعفن في الدرج. وبيت من شخصين يمكنه تخطيط خمس عشاءات من شراء بروتين واحد بالجملة وتدوير البقايا عمدًا إلى الغداء. والمخطط في هذه الصفحة يقوم بالحساب عنك: أداة قائمة التسوق تحت الإجمالي الكلي مباشرةً تجمع كل صنف عبر وجباتك، وتضربه في المدة التي تختارها، وتضيف الاحتياط، وتمنحك قائمة قابلة للنسخ.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Two shopping rules keep the plan honest at the store: shop from a list (unlisted items are decisions made by a marketing department, not by your plan) and read the per-100-gram column on labels rather than the per-serving figure — the per-100 g column is the planner's native currency and the only one comparable across products.",
            ar: "قاعدتا تسوق تحفظان صدق الخطة في المتجر: تسوّق من قائمة (الأصناف غير المدرجة قرارات اتخذها قسم تسويق لا خطتك)، واقرأ عمود «لكل 100 غرام» على الملصقات بدل رقم «الحصة» — فعمود المئة غرام عملة المخطط الأصلية والوحيد القابل للمقارنة عبر المنتجات.",
          },
        },
      ],
    },
    {
      id: "real-life",
      heading: {
        en: "When real life collides with the plan",
        ar: "حين تصطدم الحياة الواقعية بالخطة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Restaurants: decompose the dish (grilled protein + starch + vegetables + oil) and log the nearest equivalents; accept the ±20% error and keep such meals a minority of the week. Travel: default to the protein-plus-vegetables frame everywhere from airport cafés to hotel breakfasts, and bank protein early in the day because the evening is the least controllable meal. Family occasions and hospitality are not plan failures — log them honestly, and pull 100–200 kcal out of the neighboring days rather than punishing yourself the next morning with an empty plate.",
            ar: "المطاعم: فكك الطبق (بروتين مشوي + نشوية + خضروات + زيت) وسجّل المكافئات الأقرب؛ واقبل خطأ ±20% وأبقِ مثل هذه الوجبات أقلية الأسبوع. السفر: التزم إطار «بروتين زائد خضروات» في كل مكان من مقاهي المطارات إلى فطور الفنادق، وادّخر البروتين مبكرًا في اليوم لأن المسائية أقل الوجبات قابلية للضبط. والمناسبات العائلية والضيافة ليست إخفاقات خطة — سجّلها بصدق، واسحب 100–200 سعرة من الأيام المجاورة بدل أن تعاقب نفسك صباحَ الغد بطبق فارغ.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Ramadan deserves its own paragraph for the region this site serves: the fasting day inverts the structure — protein and fluids compress into the iftar-to-suhoor window. A workable frame: break the fast with dates and water (traditional and metabolically sensible — quick carbohydrate and rehydration), a balanced main iftar plate built like any dinner, and a suhoor emphasizing slow carbohydrates (oats, whole grains), protein, and fluids, since hydration and fullness are the fast's limiting factors. Training slots best after iftar or before suhoor, and the planner's day simply becomes an evening-weighted container — the arithmetic, again, does not change.",
            ar: "ويستحق رمضان فقرته الخاصة للمنطقة التي يخدمها هذا الموقع: يومُ الصيام يقلب البنية — فالبروتين والسوائل تنضغط في نافذة الإفطار إلى السحور. وإطار قابل للعمل: افطر بالتمر والماء (تقليدي وسليم أيضيًا — كربوهيدرات سريعة وإعادة ترطيب)، وطبق إفطار رئيس متوازن مبني كأي عشاء، وسحور يؤكد الكربوهيدرات البطيئة (الشوفان والحبوب الكاملة) والبروتين والسوائل، فالإماهة والامتلاء عاملان محددا الصوم. ومواعيد التدريب أفضل بعد الإفطار أو قبل السحور، ويوم المخطط يصير ببساطة وعاءً مسائيَّ الوزن — والحسبة مرة أخرى لا تتغير.",
          },
        },
      ],
    },
    {
      id: "adjusting-plan",
      heading: {
        en: "Reviewing and adjusting the plan weekly",
        ar: "مراجعة الخطة وتعديلها أسبوعيًا",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The plan is a hypothesis your body grades. One day a week, compare the week's weight trend with the week's planned intake: trending as intended with energy to train — change nothing; drifting up or down against intention — adjust portion sizes by 100–200 kcal in the direction the data points, then hold another week. The common beginner error is adjusting daily, which reacts to water noise; the common intermediate error is never adjusting, which turns a good plan into a slowly wrong one. Weekly is the rhythm that separates signal from noise.",
            ar: "الخطة فرضية يصحّحها جسمك. يومًا في الأسبوع، قارن اتجاه وزن الأسبوع باستخدام الأسبوع المخطط: الاتجاه كما قُصد مع طاقة للتدريب — لا تغيّر شيئًا؛ الانحراف صعودًا أو هبوطًا خلاف القصد — عدّل أحجام الحصص بمقدار 100–200 سعرة في الاتجاه الذي تشير إليه البيانات ثم اثبت أسبوعًا آخر. الخطأ الشائع للمبتدئ التعديلُ اليومي الذي يتفاعل مع ضجيج الماء؛ والخطأ الشائع للمتوسط ألا يعدّل أبدًا، فيتحول الخطة الجيدة إلى خطة تخطئ ببطء. الأسبوعي هو الإيقاع الذي يفصل الإشارة عن الضجيج.",
          },
        },
        {
          kind: "p",
          text: {
            en: "And the closing perspective: the planner is scaffolding for a skill, not a permanent dependency. After a few months of honest grams, you develop calibrated eyes — a palm of protein, a fist of rice — and the plan lives partly in your head where it is fastest to execute. Use the tool while it teaches you; keep it for the weeks that need precision (cuts, competition prep, new goals); trust the eyes it gave you the rest of the time.",
            ar: "والمنظور الختامي: المخطط سقالة لمهارة لا اعتمادٌ دائم. فبعد أشهر من الغرامات الصادقة تنمي عيونًا معايَرة — كفّ بروتين، وقبضة أرز — وتسكن الخطة جزئيًا في رأسك حيث تنفيذها أسرع. استخدم الأداة وهي تعلمك؛ واحتفظ بها للأسابيع التي تحتاج الدقة (خسارات، وتحضير منافسات، وأهداف جديدة)؛ وثق بالعيون التي منحتك إياها بقية الوقت.",
          },
        },
      ],
    },
    {
      id: "weekly-grocery-table",
      heading: {
        en: "A starter grocery list for the example week",
        ar: "قائمة مشتريات انطلاق لأسبوع المثال",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Shopping for the worked example's structure (two rotating day-templates repeated across a week for one person, plus the 20% buffer) looks like the table below. Quantities are deliberately unimpressive — real planning groceries are staples in bulk plus produce in small fresh batches, and the total basket runs cheaper than a week of delivery.",
            ar: "التسوق لبنية المثال المشروح (قالبا يوم متناوبان يتكرران عبر أسبوع لشخص واحد، زائد احتياط 20%) يشبه الجدول أدناه. الكميات غير مبهرِة بقصد — فمشتريات التخطيط الحقيقي أساسياتٌ بالجملة زائد منتجاتُ بدفعات صغيرة طازجة، والسلة الإجمالية تجري أرخص من أسبوع توصيل.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Starter basket — one person, one week (approximate)",
              ar: "سلة الانطلاق — شخص واحد، أسبوع واحد (تقريبية)",
            },
            columns: [
              { en: "Item", ar: "الصنف" },
              { en: "Quantity", ar: "الكمية" },
              { en: "Covers", ar: "يغطي" },
            ],
            rows: [
              { en: ["Chicken breast (fresh or frozen)", "1.5 kg", "Lunch protein, ~5 days"], ar: ["صدر دجاج (طازج أو مجمد)", "1.5 كجم", "بروتين الغداء، نحو 5 أيام"] },
              { en: ["Eggs", "18", "Breakfasts, ~6 days"], ar: ["بيض", "18", "الفطورات، نحو 6 أيام"] },
              { en: ["Fava beans / lentils", "1 kg dry", "Breakfasts + dinners"], ar: ["فول / عدس", "1 كجم جاف", "الفطورات + العشاءات"] },
              { en: ["Rice", "1 kg dry", "Lunch starch, full week"], ar: ["أرز", "1 كجم جاف", "نشوية الغداء، الأسبوع كامل"] },
              { en: ["Pita / whole bread", "6–8 loaves", "Breakfasts, freeze extras"], ar: ["خبز بلدي / أسمر", "6–8 أرغفة", "الفطورات، جمّد الزائد"] },
              { en: ["Greek yogurt", "1.4 kg tub", "Snacks, full week"], ar: ["زبادي يوناني", "عبوة 1.4 كجم", "السناكات، الأسبوع كامل"] },
              { en: ["Olive oil", "250 ml", "Cooking + salads"], ar: ["زيت زيتون", "250 مل", "الطهي + السلطات"] },
              { en: ["Salad vegetables + greens", "2 batches (twice weekly)", "Lunches and dinners"], ar: ["خضار سلطة + ورقيات", "دفعتان (مرتان أسبوعيًا)", "الأغدية والعشاءات"] },
              { en: ["Bananas + seasonal fruit", "1.5 kg", "Snacks"], ar: ["موز + فاكهة موسمية", "1.5 كجم", "السناكات"] },
              { en: ["Almonds", "100 g", "Snack topping"], ar: ["لوز", "100 غ", "إكمال السناك"] },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "Adapt the basket, not the principle: swap chicken for fish or beef by price and preference, rotate the legume between ful, lentils, and chickpeas, and let the produce row follow the season — the structure of protein-anchor-plus-starch-plus-produce survives every cuisine and every budget on earth.",
            ar: "كيّف السلة لا المبدأ: بدّل الدجاج بسمك أو لحم بحسب السعر والتفضيل، ودوّر البقول بين الفول والعدس والحمص، ودع صف المنتجات يتبع الموسم — فبنية «مرتكز بروتين زائد نشوية زائد منتجات» تنجو من كل مطبخ وكل ميزانية على الأرض.",
          },
        },
      ],
    },
    {
      id: "common-mistakes",
      heading: {
        en: "Ten planning mistakes — and their one-line repairs",
        ar: "عشرة أخطاء تخطيط — وإصلاحاتها في سطر واحد",
      },
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            {
              en: "Planning perfect weeks nobody can live in — repair: plan at 80% effort, keep two flexible slots.",
              ar: "تخطيط أسابيع مثالية لا يستطيع أحد العيش فيها — الإصلاح: خطّط بجهد 80%، وأبقِ فتحتين مرنتين.",
            },
            {
              en: "Zero repeats — every day novel is a part-time cooking job — repair: rotate two or three day-templates.",
              ar: "صفر تكرار — كل يوم جديد وظيفة طبخ نصف دوام — الإصلاح: دوّر قالبين أو ثلاثة.",
            },
            {
              en: "Protein arriving all at dinner — repair: distribute it, the planner shows the imbalance per meal.",
              ar: "البروتين يصل كله في العشاء — الإصلاح: وزّعه، فالمخطط يظهر الاختلال لكل وجبة.",
            },
            {
              en: "Cooking daily from scratch — repair: batch-cook proteins and starches twice a week.",
              ar: "الطبخ يوميًا من الصفر — الإصلاح: اطبخ البروتينات والنشويات دفعات مرتين أسبوعيًا.",
            },
            {
              en: "Shopping without the plan — repair: the grocery list above, generated from the plan.",
              ar: "التسوق بلا خطة — الإصلاح: قائمة المشتريات أعلاه، مولَّدة من الخطة.",
            },
            {
              en: "Ignoring vegetables until dinner — repair: anchor a vegetable portion into lunch by template.",
              ar: "تجاهل الخضروات حتى العشاء — الإصلاح: ركّز حصة خضار في الغداء ضمن القالب.",
            },
            {
              en: "Treating a missed day as a broken plan — repair: resume at the next meal, not the next Monday.",
              ar: "معاملة يوم فائت كخطة مكسورة — الإصلاح: استأنف من الوجبة التالية لا من الاثنين التالي.",
            },
            {
              en: "Planning for a body you had five years ago — repair: recalculate targets every 4–5 kg of change.",
              ar: "التخطيط لجسم كان لك قبل خمس سنوات — الإصلاح: أعد حساب الأهداف كل 4–5 كجم من التغير.",
            },
            {
              en: "Chasing new recipes weekly instead of mastering ten — repair: a ten-recipe rotation beats a hundred pinned tabs.",
              ar: "مطاردة وصفات جديدة أسبوعيًا بدل إتقان عشر — الإصلاح: تناوب عشر وصفات يتفوق على مئة تبويب مثبت.",
            },
            {
              en: "Planning food you do not actually like — repair: build the plan from the healthy foods you already enjoy.",
              ar: "تخطيط طعام لا تحبه فعلًا — الإصلاح: ابنِ الخطة من الأطعمة الصحية التي تستمتع بها أصلًا.",
            },
          ],
        },
      ],
    },
  ],
  faqs: [
    {
      q: {
        en: "Do I have to weigh food forever?",
        ar: "هل يجب أن أزن الطعام للأبد؟",
      },
      a: {
        en: "No — weighing is an apprenticeship, not a lifestyle. Six to eight weeks of gram-level logging builds calibrated eyes and hands; after that, spot-check a meal per week to keep the calibration, and rely on the planner for totals on the days that matter. The skill persists long after the scale goes back in the drawer.",
        ar: "لا — الوزنُ تدريبُ مهنة لا أسلوبُ حياة. فستة إلى ثمانية أسابيع من التسجيل بالغرام تبني عيونًا وأيديًا معايَرة؛ وبعدها راجع بفحصٍ وجبةً في الأسبوع لحفظ المعايرة، واعتمد على المخطط للإجماليات في الأيام المهمة. فالمهارة تبقى طويلًا بعد أن يعود الميزان إلى الدرج.",
      },
    },
    {
      q: {
        en: "How many meals should my plan have?",
        ar: "كم وجبة ينبغي أن تحويها خطتي؟",
      },
      a: {
        en: "The number the evidence supports for your goals is three to five, chosen by lifestyle rather than metabolism: meal frequency barely moves total daily energy expenditure or fat loss in controlled comparisons, but it strongly affects satiety, training placement, and how socially livable the plan is. Pick the count that makes your day easy, distribute protein across whatever count you chose, and let the planner verify the total.",
        ar: "العدد الذي تدعمه الأدلة لأهدافك ثلاث إلى خمس، يُختار بنمط الحياة لا بالأيض: فتواتر الوجبات بالكاد يحرك الإنفاق اليومي الكلي أو خسارة الدهون في المقارنات المضبوطة، لكنه يؤثر بقوة في الشبع وموضع التدريب وقابلية الخطة للعيش اجتماعيًا. اختر العدد الذي يجعل يومك سهلًا، ووزّع البروتين على أي عدد اخترته، ودع المخطط يتحقق من الإجمالي.",
      },
    },
    {
      q: {
        en: "Can I plan for a whole week, not just a day?",
        ar: "هل أخطط لأسبوع كامل لا يوم فحسب؟",
      },
      a: {
        en: "Yes, and the weekly view is where planning pays its best rent. Build two or three rotating day-templates (a weekday, a training day, a lighter day), repeat them through the week with deliberate variety in dinner, and the plan becomes both stable enough to shop for and varied enough to live with. Weekly totals also absorb social meals gracefully — a heavy Friday averages into a lighter Sunday without any day feeling like punishment.",
        ar: "نعم، والمنظور الأسبوعي هو حيث يدفع التخطيط أفضل إيجاره. ابنِ قالبَي أو ثلاثة من قوالب اليوم (يوم عمل، يوم تدريب، يوم أخف)، وكررها عبر الأسبوع بتنوع متعمد في العشاء، فتصبح الخطة مستقرة بما يكفي للتسوق ومتنوعة بما يكفي للعيش. والإجماليات الأسبوعية أيضًا تستوعب الوجبات الاجتماعية برشاقة — جمعة ثقيلة تتوسط مع أحد أخف بلا أن يشعر أي يومٍ بالعقاب.",
      },
    },
    {
      q: {
        en: "What if the food I ate is not in the database?",
        ar: "ماذا لو لم يكن طعامي في قاعدة البيانات؟",
      },
      a: {
        en: "Decompose it. Almost every dish is a combination of a protein source, a starch, a vegetable, and a fat — a home-cooked mahshi is rice + tomato sauce + oil; a fried snack is its base food plus oil absorption. Log the components with estimated grams, mark the entry as an estimate in your own head, and move on — an honest estimate within 20% beats an unlogged meal at 100% error.",
        ar: "فككه. فكل طبق تقريبًا تركيبٌ من مصدر بروتين ونشوية وخضار ودهن — فالملفوف المحشي المنزلي أرز + صلصة طماطم + زيت؛ والسمبوسك المقلي طعامُه الأساس زائد زيت مُمتص. سجّل المكونات بغرامات مقدَّرة، علّم المدخل في رأسك كتقدير، وأكمل — فتقدير صادق ضمن 20% يتفوق على وجبة غير مسجلة بخطأ 100%.",
      },
    },
    {
      q: {
        en: "Should my plan change on rest days?",
        ar: "هل تتغير خطتي في أيام الراحة؟",
      },
      a: {
        en: "Slightly, at most. Carbohydrate can dip on rest days and rise on training days (calories equal), which mainly helps appetite management and training fueling; the difference that matters — protein and calories — stays nearly flat. If juggling two templates is overhead you do not enjoy, run one template every day and simply move your training-day meal timing around the session.",
        ar: "بهدوء، على الأكثر. يمكن للكربوهيدرات أن تخفت أيام الراحة وترتفع أيام التدريب (السعرات متساوية)، وهذا يساعد أساسًا إدارة الشهية ووقود التدريب؛ أما الفرق الذي يهم — البروتين والسعرات — فيبقى شبه مستوٍ. وإن كانت إدارة قالبين عبئًا لا تستمتع به فشغّل قالبًا واحدًا كل يوم وانقل فقط توقيت وجبة يوم التدريب حول الجلسة.",
      },
    },
    {
      q: {
        en: "Is a meal plan the same as a diet?",
        ar: "هل خطة الوجبات حمية بعينها؟",
      },
      a: {
        en: "A diet is a set of restrictions; a meal plan is a schedule of what you will actually eat inside whatever philosophy you follow — balanced, low-carb, vegetarian, or none in particular. The planner is philosophy-agnostic: it computes grams and totals, and the macro calculator's presets tell you which totals to aim for within your chosen philosophy.",
        ar: "الحمية مجموعة قيود؛ وخطة الوجبات جدولٌ بما ستأكله فعلًا داخل أي فلسفة تتبعها — متوازنة، أو قليلة الكربوهيدرات، أو نباتية، أو لا شيء بذات. المخطط لافلسفي: يحسب الغرامات والإجماليات، وأنماط حاسبة الماكروز تخبرك بأي إجماليات تستهدف داخل فلسفتك المختارة.",
      },
    },
    {
      q: {
        en: "How do I handle Iftar and Suhoor in the planner?",
        ar: "كيف أتعامل مع الإفطار والسحور في المخطط؟",
      },
      a: {
        en: "Model the fasting day as two meals plus a snack window: iftar as a full dinner-structured meal, a light mid-evening snack, and suhoor as the strategic meal — oats or whole grains, a protein source, and generous fluids. Keep the day's calorie and protein targets the same as a normal day; only their container changes. Training lands best between iftar and suhoor, and the week of Ramadan rewards lowering expectations of variety in exchange for consistency.",
        ar: "مثّل يوم الصيام وجبتين زائد نافذة سناك: الإفطار وجبة كاملة بهيكل عشاء، وسناك خفيف منتصف الليل، والسحور الوجبة الاستراتيجية — شوفان أو حبوب كاملة، ومصدر بروتين، وسوائل سخية. أبقِ أهداف اليوم من السعرات والبروتين كما في اليوم العادي؛ يتغير وعاؤها فقط. والتدريب يهبط أفضل بين الإفطار والسحور، وأسبوع رمضان يكافئ خفض توقعات التنوع مقابل الاتساق.",
      },
    },
    {
      q: {
        en: "Why does my total not match my calorie target exactly?",
        ar: "لماذا لا يطابق إجماليّ هدفَ سعراتي بدقة؟",
      },
      a: {
        en: "Rounding and real food: per-item values round to whole numbers, and gram adjustments move in steps, so a plan landing within about ±2% of target (40 kcal on 2,000) is finished — chasing the last ten calories costs more attention than it buys physiology. Land close, hold the week, and let the weekly weight trend make the final call on whether the number needs moving.",
        ar: "التقريب والطعام الحقيقي: فقيم الأصناف تُقرب لأرقام صحيحة، وتعديلات الغرام تتحرك بخطوات، فخطة تهبط ضمن نحو ±2% من الهدف (40 سعرة على 2000) منتهيةٌ — فمطاردة آخر عشر سعرات تكلف انتباهًا أعلى مما تشتري به فسيولوجيا. اهبط قريبًا، اثبت الأسبوع، ودع اتجاه الوزن الأسبوعي يصدر الحكم الأخير على تحرك الرقم.",
      },
    },
    {
      q: {
        en: "Do I need to plan if I eat the same thing every day?",
        ar: "هل أحتاج التخطيط إن كنت آكل الشيء نفسه كل يوم؟",
      },
      a: {
        en: "Even more so — a repeated day is a plan already; writing it once into the planner verifies it meets your targets before you institutionalize it. The quiet risk of food monotony is nutritional drift: the same seven foods can undersupply fiber, minerals, or variety of protein sources without you noticing. One planner session either certifies your routine or shows you the two items to swap in.",
        ar: "بدرجة أعلى — فاليوم المكرر خطةٌ جاهزة؛ وكتابته مرة في المخطط تتحقق من مطابقته أهدافك قبل أن تؤسِّسه. وخطر الرتابة الصامت انجرافٌ غذائي: فالأطعمة السبعة نفسها قد تقصّر في الألياف أو المعادن أو تنوع مصادر البروتين دون أن تلاحظ. جلسة مخطط واحدة إما تصدّق روتينك أو تريك الصنفين اللذين تستبدلهما.",
      },
    },
    {
      q: {
        en: "What about cheat days?",
        ar: "وماذا عن يوم الغش؟",
      },
      a: {
        en: "The honest framing is budgeted flexibility, not scheduled collapse. A planned, logged, enjoyed restaurant meal inside your weekly budget is just a meal; an unlogged \"day off\" averaging +2,000 kcal erases four disciplined days and, more importantly, trains the habit that food morality resets weekly. Log everything, budget the pleasures, and the concept of cheating quietly disappears — there is nothing to cheat on a plan that includes what you love.",
        ar: "التأطير الصادق مرونةٌ مُدرجة في الميزانية لا انهيارٌ مجدول. فوجبة مطعم مخططة مسجلة ممتعة داخل ميزانيتك الأسبوعية مجردُ وجبة؛ أما «يوم الراحة» غير المسجل بمتوسط +2000 سعرة فيمحو أربعة أيام منضبطة، والأهم أنه يدرب عادةَ أن أخلاق الطعام تُصفَّر أسبوعيًا. سجّل كل شيء، ودرج الملذات، فيختفي مفهوم الغش بهدوء — فلا شيء ليغش عليه خطةً تتضمن ما تحب.",
      },
    },
    {
      q: {
        en: "How do I use the planner for a whole family?",
        ar: "كيف أستخدم المخطط لأسرة كاملة؟",
      },
      a: {
        en: "Cook one meal, plan portions individually. Family meals work when the shared dish is decomposable: a tray of protein, a pot of rice, a bowl of salad, and a sauce lets each plate be assembled at the table — the training adult takes 200 g of chicken and 220 g of rice, the child takes a third of that, the parent on a cut takes double salad and half the rice. Plan the components once in the planner, multiply the grocery list by heads, and let everyone's plate differ while the kitchen stays sane.",
        ar: "اطبخ وجبة واحدة، وخطّط الحصص فرديًا. تعمل وجبات الأسرة حين يكون الطبق المشترك قابلًا للتفكيك: صينية بروتين، وقِدر أرز، وسلطة، وصوص تُجمَّع أطباقُ كلٍّ على المائدة — فالمتدرب البالغ يأخذ 200 غ دجاج و220 غ أرز، والطفل ثلث ذلك، والوالد في خسارة يضاعف السلطة ويأخذ نصف الأرز. خطّط المكونات مرة في المخطط، واضرب قائمة المشتريات بعدد الرؤوس، ودَع أطباق الجميع تختلف والمطبخ سليمًا.",
      },
    },
    {
      q: {
        en: "I work shifts — how do I structure the plan?",
        ar: "أعمل بنظام الورديات — كيف أبني الخطة؟",
      },
      a: {
        en: "Anchor the plan to your waking window, not to the clock. Your \"breakfast\" is the first meal after your main sleep whatever hour it falls in, and protein anchors should distribute across that waking window exactly as a day-worker's do. Night shifts add two practical notes: keep the heaviest meal at the start of the shift rather than its end (sleep quality repays it), and front-load fluids early because the second half of a night shift is where hydration quietly collapses under coffee and workload.",
        ar: "اربط الخطة بنافذة يقظتك لا بالساعة. فـ«فطورك» أول وجبة بعد نومك الرئيس أيًّا كانت الساعة، وينبغي لمرتكزات البروتين أن تتوزع عبر نافذة اليقظة توزعَها عند صاحب النهار. وتضيف الورديات الليلية ملاحظتين عمليتين: أبقِ أثقل وجبة في بداية الوردية لا نهايتها (جودة النوم تسدد ثمنها)، وحمّل السوائل مبكرًا لأن النصف الثاني من الوردية الليلية هو المكان الذي ينهار فيه الترطيب بهدوء تحت القهوة وحمل العمل.",
      },
    },
    {
      q: {
        en: "Do I need to log spices and herbs?",
        ar: "هل أحتاج تسجيل التوابل والأعشاب؟",
      },
      a: {
        en: "No — at the gram scale of a teaspoon, spices are nutritionally invisible: a tablespoon of mixed spices carries single-digit calories. The flavor budget that actually matters is its carriers: the oil you toast them in, the tahini or yogurt of the sauce, the sugar in a marinade — those are the amounts to log. Season generously; measure the vehicles, not the passengers.",
        ar: "لا — فعلى مقياس غرام الملعقة الصغيرة التوابل غير مرئية تغذويًا: فملعقة كبيرة من بهارات مختلطة تحمل سعراتٍ أحادية. وميزانية النكهة التي تهم فعلًا هي نواقلها: الزيت الذي تحمّصها فيه، والطحينة أو الزبادي في الصلصة، والسكر في التتبيلة — هذه هي الكميات للتسجيل. تبّل بسخاء؛ وقِس المركبات لا الركاب.",
      },
    },
    {
      q: {
        en: "Can I use the planner to gain weight?",
        ar: "هل أستطيع استخدام المخطط لزيادة الوزن؟",
      },
      a: {
        en: "Yes — the same tool, pointed the other direction. Set a surplus target with the calorie calculator, then let the planner solve the real problem of gaining: volume. A 3,200-kcal day of chicken-and-rice austerity is miserable, but the same budget enriched with caloric density — olive oil poured rather than sprinkled, granola and nuts as snack pillars, a glass of milk with meals instead of water — goes down comfortably. Track weekly weight, add 200 kcal whenever the scale stalls for two weeks, and let the planner show you where those calories hide.",
        ar: "نعم — الأداة نفسها موجَّهة في الاتجاه الآخر. اضبط هدفًا فائضًا بحاسبة السعرات، ثم دع المخطط يحل مشكلة الزيادة الحقيقية: الحجم. فيوم بـ3200 سعرة من زهد الدجاج والأرز بائس، لكن الميزانية نفسها مثراةً بكثافة سعرية — زيت زيتون يُسكب لا يُرش، وغرانولا ومكسرات أعمدةَ سناك، وكأس لبن مع الوجبات بدل الماء — ينزل بارتياح. تتبّع الوزن الأسبوعي، وأضف 200 سعرة كلما ثبت الميزان أسبوعين، ودع المخطط يريك أين تختبئ تلك السعرات.",
      },
    },
    {
      q: {
        en: "What is the single biggest planning mistake?",
        ar: "ما أكبر خطأ تخطيط منفرد؟",
      },
      a: {
        en: "Planning a stranger's food. The plans that survive are built from the meals you already eat and enjoy, trimmed and rebalanced — not from a screenshot of someone else's perfect day. Audit what your week actually looks like, find the two or three meals you could happily eat forever, and plan from there; the planner's job is arithmetic, and the arithmetic only works on ingredients your life already contains.",
        ar: "تخطيط طعام الغرباء. فالخطط التي تنجو مبنية من الوجبات التي تأكلها أصلًا وتستمتع بها، منقّحةً وموازَنةً — لا من لقطة شاشة ليوم شخص آخر المثالي. دقّق كيف يبدو أسبوعك فعلًا، واعثر على الوجبتين أو الثلاث التي يمكنك أكلها بسعادة للأبد، وخطّط من هناك؛ وظيفة المخطط الحساب، والحساب لا يعمل إلا على مكونات تحتويها حياتك أصلًا.",
      },
    },
    {
      q: {
        en: "Do I need a food scale to use the planner?",
        ar: "هل أحتاج ميزان طعام لاستخدام المخطط؟",
      },
      a: {
        en: "You need one for two weeks, then you need your hands. A basic digital scale accurate to the gram costs less than a pizza and is the only honest bridge between the planner's gram fields and your plate — but its real product is calibration, not dependency. After a fortnight of weighing, your palm knows a 150 g portion of chicken and your cup knows 200 g of cooked rice; keep the scale in the drawer for spot-checks and for the precise missions, and plan the ordinary weeks with the eyes it trained.",
        ar: "تحتاجه أسبوعين، ثم تحتاج يديك. ميزان رقمي أساسي بدقة الغرام أرخص من بيتزا، وهو الجسر الصادق الوحيد بين حقول غرامات المخطط وطبقك — لكن منتجه الحقيقي المعايرةُ لا الاعتماد. فبعد أسبوعين من الوزن تعرف كفُّك حصة 150 غرامًا من الدجاج ويعرف كوبك 200 غرام من الأرز المطبوخ؛ أبقِ الميزان في الدرج للفحوص والمهام الدقيقة، وخطّط الأسابيع العادية بالعيون التي درّبها.",
      },
    },
  ],
};

