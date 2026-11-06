/**
 * EXERCISES-ENRICHMENT — BATCH 15 (tail batch 2, exercises 71-75 of the
 * enrichment program; growth-plan Phase 3 — owner order 2026-11-06
 * «حسّن صفحات التمارين والأطعمة الموجودة بالفعل، وفق احتياجات الجودة
 * والبحث والفهرسة» — the direction-correction session continuing the
 * proven 430 pattern on EXISTING thin pages, zero new routes).
 *
 * Core half #2: five classic mid-library movements (reverse-crunch ·
 * scissor-kick · alternate-heel-touchers · hanging-pike · pallof-press).
 * Every fact quoted about each movement (the rolling pelvis, the 6-inch
 * heel line, the 45-degree scissor split, the shin-to-bar peak, the
 * shoulder-height cable) comes from the exercise's own row in
 * src/lib/exercises.ts; programming numbers are standard coaching
 * prescription stated as practice guidance.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_15: Record<string, ExerciseEnrichment> = {
  "reverse-crunch": {
    intro: {
      en: "The reverse crunch flips the classic on its head — literally. Instead of curling the ribcage toward a fixed pelvis, you keep the torso flat on the floor and roll the pelvis toward the ribcage, exactly as the library's steps describe: legs rise until the thighs stand perpendicular, then the hips curl off the floor until the knees meet the chest. That single inversion moves the work to the lower fibers of the abdominal wall and removes the neck from the equation entirely. Hands stay planted beside the torso for the whole set — they are anchors, not engines.",
      ar: "الكرانش العكسي يقلب الكلاسيكي على رأسه — حرفيًا. فبدل أن تلف القفص الصدري نحو حوض ثابت، تُبقي الجذع ملقى على الأرض وتدحرج الحوض نحو القفص، تمامًا كما تصف خطوات المكتبة: ترتفع الساقان حتى يقف الفخذان عموديًا، ثم يلتف الوركان عن الأرض حتى تلتقي الركبتان بالصدر. هذا القلب وحده ينقل العمل إلى الألياف السفلية لجدار البطن ويزيل الرقبة من المعادلة كليًا. اليدان تبقيان مثبتتين بجانب الجذع طوال المجموعة — مرسات لا محركات.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis owns the lift through its lower attachment, and the library's entry — abs primary, no listed seconds — is honest with one coaching footnote: the hip flexors hold the thighs perpendicular isometrically while the abs do the visible curling. The pelvis rolling backward is the entire rep; the legs are just the counterweight the abs lift. When the lower back presses flat into the floor before every rep, the obliques join as quiet stabilizers keeping the roll straight rather than tilted.",
        mistakes: [
          { error: "Swinging the legs with hip power and skipping the pelvic roll.", fix: "Start every rep by tilting the pelvis — think knees-to-nose — so the hips curl first and the legs only follow; if the knees travel without the tailbone lifting, the set has already left the abs." },
          { error: "Letting the lower back arch off the floor between reps.", fix: "Press the lumbar flat and keep it pressed; the moment the arch returns, the hip flexors take the job back and the abs become passengers." },
          { error: "Dropping the hips from the top at free-fall speed.", fix: "Lower on a two-count exhale so the descent stays part of the rep — the return is where the lower fibers work eccentrically, which is exactly the range this movement exists to train." },
          { error: "Pushing the palms into the floor to launch the hips.", fix: "Fingertips only, arms relaxed; the hands locate you on the floor, they do not fund the rep — if pressing down helps, the tempo is too fast for the strength you have." },
        ],
        alternatives: "When floor space is the only equipment you own, the family around this movement covers every angle. The bent-knee hip raise on its own page shortens the lever for beginners; the flat bench leg pull-in does the same roll from a bench; and the suspended reverse crunch adds instability for advanced trainees. When a bar is available, the hanging pike page carries the same pelvis-first pattern into a far longer lever. Our home core specialization program sequences several of these together with sets and reps already written.",
        progression: "The honest first level is bent knees and a slow two-count descent. When fifteen clean reps feel ordinary, extend the legs degree by degree until the knees stay straight through the roll — the straighter the legs, the longer the lever, the heavier the rep without adding a single plate. The next rungs are the decline version with the head lower than the hips, then a small dumbbell gripped between the ankles. The advanced branch hands off to the hanging leg raise family, where the abs curl the whole bodyweight.",
        programming: "Three to four sets of twelve to twenty slow repetitions, twice a week at the end of a session, is the standard dose — the movement earns its slot after the big lifts, never before, because a pre-fatigued abdominal wall weakens every squat and press that follows. In a cutting block it keeps the lower wall loaded while the deficit, tracked in our calorie calculator, handles visibility. In a mass block it maintains the brace the heavy work depends on.",
        safety: "The lower back is the structure to respect. If the lumbar spine arches off the floor at the top of the roll or aches the day after, shorten the range — curl the pelvis only an inch or two and rebuild. Anyone with an active disc issue should clear repeated spinal flexion with a clinician first; the plank holds the same muscles isometrically while that conversation happens.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تتولى الرفع من ارتباطها السفلي، وإدخال المكتبة — البطن أساسية بلا مساعدين مسجلين — أمين مع حاشية تدريبية واحدة: مثنيات الورك تحفظ الفخذين عموديين بعمل ثابت بينما تؤدي البطن اللف المرئي. فتدحرج الحوض للخلف هو التكرار كله، والساقان مجرد ثقل موازن ترفعه البطن. وحين يُضغط أسفل الظهر مسطحًا في الأرض قبل كل تكرار، تنضم المائلتان كملزمتين صامتتين تحفظان التدحرج مستقيمًا لا مائلًا، وتعمل الحشوية المستعرضة من الداخل كمشدد خفي يخفض الضغط عن القطني ويثبته.",
        mistakes: [
          { error: "تأرجح الساقين بقوة الورك وتخطي تدحرج الحوض.", fix: "ابدأ كل تكرار بإمالة الحوض — فكر ركبة-إلى-أنف — فيلتف الوركان أولًا وتتبع الساقان فقط؛ فإن تحركت الركبتان دون أن يرتفع العصعص فقد غادرت المجموعة البطن من أصلها." },
          { error: "ترك أسفل الظهر يتقوس عن الأرض بين التكرارات.", fix: "اضغط القطني مسطحًا وحافظ عليه؛ فبمجرد عودة التقوس تستعيد مثنيات الورك الوظيفة وتصير البطن ركابًا." },
          { error: "إسقاط الوركين من القمة بسرعة السقوط الحر.", fix: "انزل في عدّتين مع الزفير ليبقى الهبوط جزءًا من التكرار — فالعودة هي حيث تعمل الألياف السفلية انقباضيًا سالبًا، وهذا بالضبط النطاق الذي وُجد التمرين ليدرّبه." },
          { error: "دفع الكفين في الأرض لإطلاق الوركين.", fix: "أطراف الأصابع فقط والذراعان مرتاحتان؛ اليدان تحددان مكانك على الأرض ولا تمولان التكرار — فإن أفاد الدفع لأسفل فالإيقاع أسرع من قوتك." },
        ],
        alternatives: "حين تكون مساحة الأرض كل ما تملكه من عتاد، تغطي عائلة هذه الحركة كل زاوية. رفع الورك بالركبتين مثنيتين في صفحته يقصّر الرافعة للمبتدئين، وسحب الساقين من البنش المسطح يؤدي الدور نفسه من فوق بنش، والكرانش العكسي المعلق يضيف عدم استقرار للمتقدمين. وحين يتاح بار، تحمل صفحة الطي المعلق النمط نفسه — الحوض أولًا — إلى رافعة أطول بكثير. وبرنامج تخصص الجذع المنزلي لدينا يرتب عدة من هذه الحركات معًا بمجموعات وتكرارات مكتوبة سلفًا.",
        progression: "المستوى الأول الأمين ركبتان مثنيتان ونزول بطيء في عدّتين. حين تصير خمسة عشر تكرارًا نظيفًا أمرًا عاديًا، مدّ الساقين درجة بعد درجة حتى تبقى الركبتان مستقيمتين طوال اللف — فكلما استقامت الساقان طالت الرافعة وثقل التكرار دون إضافة قرص واحد. والدرجات التالية هي النسخة المائلة بالرأس أدنى من الوركين، ثم دمبل صغير مقبوض بين الكاحلين. والفرع المتقدم يسلم لعائلة رفع الرجلين معلقًا حيث تلف البطن وزن الجسم كله. وبين كل درجة وأختها لا يوجد اختصار: من رفع الركبتين إلى أصابع-إلى-البار سلم واحد لا يقفز، ومن حاول القفز قابلته الجاذبية بالتمايل.",
        programming: "ثلاث إلى أربع مجموعات من اثني عشر إلى عشرين تكرارًا بطيئًا، مرتين أسبوعيًا في نهاية الجلسة، هي الجرعة المعتادة — يستحق التمرين مكانه بعد الرفعات الكبرى لا قبلها أبدًا، فجدار البطن المرهق مسبقًا يضعف كل سكوات ودفعة تليه. وفي كتلة التنشيف يحفظ الجدار السفلي محملًا بينما يتولى العجز — المتتبع بحاسبة السعرات لدينا — شؤون الظهور. وفي كتلة الكتلة يحافظ على الشد الذي يقف عليه العمل الثقيل.",
        safety: "أسفل الظهر هو البنية المراقبة هنا. إن تقوس القطني عن الأرض في قمة اللف أو استيقظت عليه ألم في اليوم التالي، فقصّر النطاق — لف الحوض بوصة أو اثنتين وأعد البناء. ومن يحمل مشكلة غضروف نشطة فليستأذن طبيبه في ثني العمود المتكرر أولًا؛ فالبلانك يحفظ العضلات نفسها بعمل ثابت إلى أن يُحسم ذلك النقاش.",
      },
    },
    faq: {
      en: [
        { q: "Why do my lower abs never feel the reverse crunch?", a: "Nine times out of ten the pelvis is not rolling — the legs are swinging on hip power instead. Start each rep by curling the tailbone up toward the ribs and the burn finds the lower wall within a set or two." },
        { q: "Are reverse crunches safer for the back than regular ones?", a: "They remove the neck and reduce the leverage on the lumbar spine, which many backs appreciate — but the pelvis still rolls the spine into flexion. Control the tempo, keep the lower back flat between reps, and clear it with a clinician if you carry a disc issue." },
        { q: "How do I make them harder without weights?", a: "Straighten the legs through the roll, slow the descent to a three-count, or pause two seconds at the top with the knees at the chest. Each one lengthens the lever or the time under tension without a single plate." },
      ],
      ar: [
        { q: "لماذا لا أشعر ببطني السفلية في الكرانش العكسي أبدًا؟", a: "تسع مرات من عشر الحوض لا يتدحرج — الساقان تتأرجحان بقوة الورك بدلًا من ذلك. ابدأ كل تكرار بلف العصعص نحو الأضلاع وسيجد الاحتراق الجدار السفلي خلال مجموعة أو اثنتين." },
        { q: "هل الكرانش العكسي أأمن للظهر من العادي؟", a: "يزيل الرقبة ويخفض الرافعة على القطني وهو ما تقدره كثير من الظهور — لكن الحوض ما يزال يلف العمود إلى الانثناء. اضبط الإيقاع وحافظ على أسفل الظهر مسطحًا بين التكرارات واستأذن طبيبك إن كنت تحمل مشكلة غضروف." },
        { q: "كيف أصعّبه دون أوزان؟", a: "استقم الساقان طوال اللف، أو أبطئ الهبوط إلى ثلاث عدّات، أو ثبت ثانيتين في القمة والركبتان عند الصدر. كل واحدة تطيل الرافعة أو زمن الشد دون قرص واحد." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/blog/science-backed-belly-fat-loss-8-weeks", hrefAr: "/ar/blog/belly-fat-loss-8-weeks-guide", labelEn: "Belly fat loss — the 8-week evidence plan", labelAr: "خسارة دهون البطن — خطة الثمانية أسابيع بالأدلة" },
      { hrefEn: "/tools/calorie-calculator", hrefAr: "/ar/tools/calorie-calculator", labelEn: "Calculate your daily calories", labelAr: "احسب سعراتك اليومية" },
    ],
  },

  "scissor-kick": {
    intro: {
      en: "The scissor kick turns the floor into a metronome. Set up exactly as the library writes it: back pressed flat, arms extended to the sides with palms down, heels lifted about six inches off the floor with a slight knee bend. From there the legs split — one rises toward forty-five degrees while its partner drops until the heel hangs two to three inches from the ground — and trade places in a rhythm you set. Nothing moves but the legs, and nothing guards the lower back but the abs holding it flat.",
      ar: "الرفرفة المقصية تحوّل الأرض إلى مترنوم. استعد تمامًا كما تكتبه المكتبة: الظهر ملاصق مسطحًا والذراعان ممتدتان إلى الجانبين والكفان للأسفل والكعبان مرفوعان نحو ست بوصات عن الأرض مع ثني ركبتين خفيف. من هناك تنشق الساقان — واحدة ترتفع نحو خمس وأربعين درجة بينما تهبط أختها حتى يتعلق كعبها على بوصتين أو ثلاث من الأرض — وتبادلان المكان بإيقاع تضبطه أنت. لا شيء يتحرك إلا الساقان، ولا شيء يحرس أسفل الظهر إلا بطن تحفظه مسطحًا.",
    },
    sections: {
      en: {
        muscles: "The abdominal wall works the entire set as the floor's police force — the library bills the abs alone with no seconds, and the reason is the position: with the lumbar spine held flat and both legs off the ground, the rectus abdominis fights the pull of the hip flexors on the pelvis for every second of the hold. The hip flexors themselves work hard raising each leg, but their pull is exactly what the abs must resist, which is why the lower belly burns first and the quads tire second.",
        mistakes: [
          { error: "Letting the lower back arch off the floor as the legs lower.", fix: "If the lumbar lifts, the legs have dropped below the strength line — raise the working height an inch or bend the knees further; the abs' job is keeping the spine flat, not surviving it." },
          { error: "Kicking fast to hide the lack of control.", fix: "Slow the switch to a full second each way; speed borrows from momentum what the abs should earn from tension, and the metronome only counts when it can be heard." },
          { error: "Fully locking the knees with pointed toes.", fix: "Keep the soft bend the library's setup prescribes; locked knees hand the leverage to the hip flexors and light up the hamstrings instead of the wall under the navel." },
          { error: "Head and shoulders curling up off the floor.", fix: "Keep the neck long and the shoulders down — this is a lower-wall movement, and craning the torso just spends the neck budget the abs never asked for." },
        ],
        alternatives: "The floor family around this movement covers every level. Flutter kicks on their own page run the same alternating pattern with smaller splits for beginners; the leg pull-in curls the pelvis instead of holding it; and the lying leg raise lifts both legs together for the heaviest straight-lever version. When a bench is free, the flat bench leg pull-in moves the same work onto padding. Our home core program sequences these in order with sets and reps already written.",
        progression: "The entry level is honest about its demand: a thirty-second hold with the six-inch line respected on both legs. Extend the time first — thirty seconds becomes forty-five becomes sixty — then lower the bottom leg's hover line an inch at a time until strength allows the two-to-three-inch floor the library describes. The advanced rungs add ankle weights or move to the hanging leg raise family, where gravity gets a longer lever to pull.",
        programming: "Timed sets fit this movement better than counted reps: three to four rounds of twenty to forty seconds, twice a week at the end of a session. Because the abs hold the spine flat for the whole round, the movement pairs well after heavy squats or deadlifts as a low-fatigue finisher. In a cutting phase it keeps the wall under the navel busy while the deficit — counted in our tools — reveals it.",
        safety: "The lower back is the report card. The moment the lumbar arches, the set is over regardless of the clock — arching means the hip flexors are winning the tug-of-war at the pelvis, and the spine pays the difference. Shorten the range before you shorten the honesty; anyone with a disc history should treat the flat-back rule as absolute.",
      },
      ar: {
        muscles: "جدار البطن يعمل طوال المجموعة شرطةً للأرض — فالمكتبة تسجل البطن وحدها بلا مساعدين، والسبب هو الوضعية: مع القطني محفوظًا مسطحًا والساقين مرفوعتين عن الأرض، تقاوم المستقيمة البطنية سحب مثنيات الورك على الحوض في كل ثانية من الثبات. مثنيات الورك نفسها تعمل بجد في رفع كل ساق، لكن سحبها هو بالضبط ما يجب على البطن مقاومته، ولهذا يحترق أسفل البطن أولًا وتتعب الفخذيات ثانيًا. والمدى الضيق المتكرر يجعل الحركة زمنية بطبيعتها: العضلة لا ترتاح بين التبديلتين ولا تجد نقطة تسليم.",
        mistakes: [
          { error: "ترك أسفل الظهر يتقوس عن الأرض مع نزول الساقين.", fix: "إن ارتفع القطني فقد هبطت الساقان تحت خط القوة — ارفع ارتفاع العمل بوصة أو زد ثني الركبتين؛ وظيفة البطن حفظ العمود مسطحًا لا النجاة بحفظه." },
          { error: "الرفرفة السريعة لإخفاء غياب السيطرة.", fix: "أبطئ التبديل إلى ثانية كاملة في كل اتجاه؛ فالسرعة تقترض من الزخم ما ينبغي أن تكسبه البطن من الشد، والمترنوم لا يُعدّ إلا حين يُسمع." },
          { error: "قفل الركبتين تمامًا مع أصابع ممدودة.", fix: "حافظ على الثني الخفيف الذي يشترطه إعداد المكتبة؛ فالركبتان المقفلتان تسلمان الرافعة لمثنيات الورك وتشعلان الخلفية بدل الجدار الذي تحت السرة." },
          { error: "رفع الرأس والكتفين عن الأرض.", fix: "أبقِ الرقبة ممتدة والكتفين لأسفل — هذه حركة الجدار السفلي، ومدّ الجذع ينفق فقط ميزانية رقبة لم تطلبها البطن قط." },
        ],
        alternatives: "عائلة الأرض حول هذه الحركة تغطي كل مستوى. الرفرفة في صفحتها تدير النمط المتبادل نفسه بانشقاقات أصغر للمبتدئين، وسحب الساقين يلف الحوض بدل تثبيته، ورفع الساقين المستلقي يرفع كلتيهما معًا لأثقل نسخة برافعة مستقيمة. وحيث يتفرغ بنش، ينقل سحب الساقين من البنش المسطح العمل نفسه فوق حشوة تجعل الذيل العصعي أرحم على الأرض الصلبة. ولمن يريد رفع العيار دون أي عتاد، تمنح الرفرفة بوضع الوركين على حافة بنش زاوية أثقل تُشبه ما يفعله الميل بالضغط. وبرنامج الجذع المنزلي لدينا يرتبها بالترتيب بمجموعات وتكرارات مكتوبة سلفًا، فلا تحتاج آلة حاسبة لتعرف ماذا بعد.",
        progression: "مستوى الدخول أمين مع تطلبه: ثلاثون ثانية ثبات مع احترام خط الست بوصات في الساقين. مدّ الزمن أولًا — الثلاثون تصير خمسًا وأربعين تصير ستين — ثم أنزل خط تحليق الساق السفلى بوصة كل مرة حتى تسمح القوة بأرضية البوصتين والثلاث التي تصفها المكتبة. والدرجات المتقدمة تضيف أثقال كاحل أو تنتقل لعائلة رفع الرجلين معلقًا حيث تنال الجاذبية رافعة أطول تسحبها — وكل درجة تشترى بصبر لا بعجلة، فالأرض المنخفضة التي تُحتقر اليوم هي نفسها التي تبني الجدار الذي يُحترم غدًا.",
        programming: "المجموعات الزمنية تناسب هذه الحركة أكثر من التكرارات المعدودة: ثلاث إلى أربع جولات من عشرين إلى أربعين ثانية، مرتين أسبوعيًا في نهاية الجلسة. ولأن البطن تحفظ العمود مسطحًا طوال الجولة، تناسب الحركة أن تُختم بها الجلسات بعد السكوات أو الديدلفت الثقيل كختام منخفض الإجهاد. وفي مرحلة التنشيف تبقي الجدار تحت السرة مشغولًا بلا أثر مفصلي بينما يتولى العجز — المحسوب بأدواتنا — كشفه.",
        safety: "أسفل الظهر هو ورقة التقرير. بمجرد تقوس القطني تنتهي المجموعة مهما قال الساعة — فالتقوس يعني أن مثنيات الورك تفوز بشد الحبل والحوض يدفع العمود الفرق. قصّر النطاق قبل أن تقصر الأمانة، فبوصة واحدة من الارتفاع تشتري دقائق إضافية من الشد النظيف. ومن يحمل تاريخًا غضروفيًا فليعامل قاعدة الظهر المسطح كقاعدة مطلقة لا استثناء فيها، وله في البلانك بديل يحفظ الجدار نفسه دون أي زاوية.",
      },
    },
    faq: {
      en: [
        { q: "Why does my lower back hurt during scissor kicks?", a: "The legs have dropped lower than the abs can hold the pelvis flat — the lumbar arches to pay for it. Raise the working height an inch or bend the knees more, and the ache disappears the same session." },
        { q: "How long should a scissor kick set last?", a: "Start at twenty to thirty seconds of clean switching and build to a minute; the clock only counts while the lower back stays glued flat. One honest minute beats five sloppy ones." },
        { q: "Do scissor kicks build the lower abs?", a: "They keep them under continuous tension, which builds endurance and size in the wall under the navel — but no floor movement reveals the muscle. Visibility is body fat, settled by the deficit our calorie calculator counts." },
      ],
      ar: [
        { q: "لماذا يؤلمني أسفل الظهر أثناء الرفرفة المقصية؟", a: "هبطت الساقان أدنى من قدرة البطن على حفظ الحوض مسطحًا — فيتقوس القطني ليدفع الفرق. ارفع ارتفاع العمل بوصة أو زد ثني الركبتين وسيختفي الألم في الجلسة نفسها." },
        { q: "كم تستغرق مجموعة الرفرفة المقصية؟", a: "ابدأ بعشرين إلى ثلاثين ثانية من التبديل النظيف وابنِ حتى الدقيقة؛ فالساعة لا تعدّ إلا ما دام أسفل الظهر ملصقًا مسطحًا. دقيقة أمينة تتفوق على خمس فوضوية." },
        { q: "هل تبني الرفرفة المقصية البطن السفلية؟", a: "تبقيها تحت شد متواصل، وهذا يبني التحمل والحجم في الجدار تحت السرة — لكن لا حركة أرضية تكشف العضلة. الظهور دهون جسم تُحسم بعجز تحسبه حاسبة السعرات لدينا." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-building-guide-no-equipment", labelEn: "Build muscle at home — no equipment guide", labelAr: "بناء العضل في المنزل — بلا معدات" },
      { hrefEn: "/tools/body-fat-calculator", hrefAr: "/ar/tools/body-fat-calculator", labelEn: "Track your body fat percentage", labelAr: "تتبّع نسبة دهونك" },
    ],
  },

  "alternate-heel-touchers": {
    intro: {
      en: "Alternate heel touchers give the obliques their own floor movement — small, honest, and famously humbling. The library's setup puts the knees bent, feet planted eighteen to twenty-four inches apart, arms extended by the sides; the rep itself is a three-to-four-inch side crunch that carries one hand to its same-side heel and holds the squeeze for a full second before the slow return. The distance is deliberately tiny — the obliques rotate and side-flex the spine over exactly the range they own, and no further.",
      ar: "لمس الكعبين بالتبادل يمنح المائلتين حركتهما الأرضية الخاصة — صغيرة وأمينة وشهيرة بإذلال أقوياء الناس. إعداد المكتبة يجعل الركبتين مثنيتين والقدمين مثبتتين على بعد ثمانية عشر إلى أربعة وعشرين بوصة والذراعين ممتدتين إلى الجانبين؛ والتكرار نفسه كرانش جانبي بثلاث إلى أربع بوصات يحمل يدًا إلى كعب جهتها نفسها ويثبت العصرة ثانية كاملة قبل العودة البطيئة. المسافة صغيرة عمدًا — فالمائلتان تديران العمود وتحنانه جانبيًا على مداهما بالضبط، ولا أبعد.",
    },
    sections: {
      en: {
        muscles: "The obliques — the diagonal walls framing the six-pack — take the primary billing and deserve it: side-flexion toward the working heel is their purest shortening action, and the library's no-seconds entry keeps the spotlight honest. The rectus abdominis co-contracts to hold the three-to-four-inch crunch off the floor while each reach happens, and the neck stays neutral throughout because the arms travel, not the head. Every reach is one side's turn to work while its partner stretches — a built-in rest that lets quality survive higher reps.",
        mistakes: [
          { error: "Sliding the shoulder along the floor to reach the heel.", fix: "Crunch the torso up first, then reach — the hand travels because the ribcage side-bent, not because the arm elongated; a longer arm is not a harder oblique." },
          { error: "Snatching the heel and bouncing off it.", fix: "Touch, squeeze for the second the library prescribes, then return slowly — the tap is a checkpoint, not a trampoline, and the rep lives in the hold." },
          { error: "Letting the opposite shoulder leave the floor completely.", fix: "Keep the resting side's shoulder blade weighted; rotating the whole torso turns an oblique curl into a twist and steals the stretch from the working side." },
          { error: "Feet creeping wider to shorten the reach.", fix: "Hold the eighteen-to-twenty-four-inch stance the setup names — a wider stance is an easier test, and the movement's honesty is worth more than the rep count." },
        ],
        alternatives: "The oblique family around this page covers every angle. The decline oblique crunch adds gravity to the same side-curl; the Russian twist page trains rotation instead of side-flexion; and the cable wood chop carries the pattern standing into the cable stack. On the floor, the plank with a side reach stretches the same walls isometrically. Our core specialization program sequences the floor pair together with reps already written.",
        progression: "Beginners earn quality with slow single-side sets — eight touches per side with the full-second squeeze. When twenty clean alternating touches pass without the form notes appearing, hold a light dumbbell in each hand so the reach carries weight, or pause two seconds at each heel. The advanced branch moves to the weighted side bend or the hanging knee raise with a twist, both elsewhere in this library.",
        programming: "Three to four sets of sixteen to twenty-four total touches, twice a week after the main work, is the standard dose — the obliques recover like the rest of the abdominal wall, fast and often. In a cutting phase the movement keeps the side walls busy while the deficit does the sculpting; in a mass phase it maintains the rotation strength that carries over to every press and throw.",
        safety: "The neck and the lumbar spine share the watch. Reach with a long neck and eyes on the ceiling — craning toward the heel recruits the sternocleidomastoid, not the oblique. If the lower back aches, check the foot width and the rep speed before anything else; this movement should feel like a side wall working, never like the spine being wrung.",
      },
      ar: {
        muscles: "المائلتان — الجدران المائلة المؤطرة لعضلات البطن — تأخذان الفاتورة الأساسية وتستحقانها: فالثني الجانبي نحو الكعب العامل أنقى فعل تقصير لهما، وإدخال المكتبة بلا مساعدين يبقي الضوء أمينًا. وتشترك المستقيمة البطنية بعمل ثابت يحفظ الكرانش مرفوعًا ثلاثًا إلى أربع بوصات أثناء كل لمسة، وتبقى الرقبة محايدة طوال الوقت لأن الذي يسافر هو الذراعان لا الرأس. وكل لمسة هي دور جهة في العمل بينما تتمدد أختها — راحة مدمجة تُبقي الجودة حية حتى في التكرارات الأعلى، ولهذا تناسب الحركة نهايات الجلسات حين يكون العدّ آخر ما تبقى من طاقة.",
        mistakes: [
          { error: "تزحلج الكتف على الأرض للوصول إلى الكعب.", fix: "ارفع الجذع بالكرانش أولًا ثم امدّ يدك — فاليد تسافر لأن الضلوع انحنت جانبيًا لا لأن الذراع استطالت؛ الذراع الأطول ليست مائلة أقوى." },
          { error: "خطف الكعب والارتداد عنه.", fix: "المس واعصر الثانية التي يصفها القانون ثم عد ببطء — فاللمسة نقطة تفتيش لا ترامبولين، والتكرار يعيش في التثبيت لا في العدّ — فالعضلة التي تعصر ثانية كاملة عند كل كعب تتعلم فرقًا لا تعلمه المجموعات المتعجلة." },
          { error: "ترك كتف الجهة الأخرى يفارق الأرض كليًا.", fix: "أبقِ لوح كتف الراحة مثقلًا بالأرض؛ فدوران الجذع كله يحول اللف الجانبي إلى لفٍّ يسرق التمدد من الجهة العاملة." },
          { error: "زحف القدمين أوسع لتقصير اللمسة.", fix: "حافظ على وقفة البوصات الثمانية عشر إلى الأربع والعشرين التي يسميها الإعداد — فالوقفة الأوسع اختبار أسهل، وأمانة الحركة أثمن من عدد التكرارات." },
        ],
        alternatives: "عائلة المائلتين حول هذه الصفحة تغطي كل زاوية. الكرانش الجانبي المائل يضيف الجاذبية إلى نفس اللف الجانبي، وصفحة اللف الروسي تدرّب الدوران بدل الثني الجانبي، ودفع الحطب بالكيبل يحمل النمط واقفًا إلى رصة الكيبل. وعلى الأرض، يمدّ البلانك مع لمسة جانبية الجدران نفسها بعمل ثابت. وبرنامج تخصص الجذع لدينا يرتب الزوج الأرضي معًا بتكرارات مكتوبة سلفًا.",
        progression: "يبدأ المبتدئون بجودة مجموعات بطيئة أحادية الجانب — ثماني لمسات لكل جهة بالعصرة الكاملة للثانية. وحين تمر عشرون لمسة متبادلة نظيفة دون ظهور ملاحظات الشكل، أمسك دمبلًا خفيفًا في كل يد لتحمل اللمسة وزنًا، أو ثبت ثانيتين عند كل كعب قبل أن تسمح لنفسك بالعودة — فثانيتان عند المائلة تحت الجاذبية أطول مما تظن وأثمن مما تتوقع. والفرع المتقدم ينتقل إلى الثني الجانبي المثقل أو رفع الركبتين معلقًا مع لفّة، وكلاهما في هذه المكتبة.",
        programming: "ثلاث إلى أربع مجموعات من ست عشرة إلى أربع وعشرين لمسة إجمالية، مرتين أسبوعيًا بعد العمل الرئيسي، هي الجرعة المعتادة — فالمائلتان تتعافان كبقية جدار البطن: سريعًا وغالبًا. وفي مرحلة التنشيف تحفظ الحركة الجدران الجانبية مشغولة بينما يتولى العجز النحت؛ وفي مرحلة الكتلة تحافظ على قوة الدوران التي تنتقل إلى كل دفعة وكل رمية، ولمن يجلس ساعات طويلة فهي مرساة يومية تذكّر الجدران الجانبية بعملها بعد يوم كامل من السكون.",
        safety: "الرقبة والقطني يتقاسمان الحراسة. امدّ رقبتك طويلة وعيناك إلى السقف — فالمدّ نحو الكعب يستدعي العضلة القترائية لا المائلة. وإن استيقظ ألم بأسفل الظهر فافحص عرض القدمين وسرعة التكرار قبل أي شيء آخر؛ ينبغي أن تُحسّ هذه الحركة كجدار جانبي يعمل، لا كعمود يُعصر — وإن ظهر القرص فاستبدل مسافة اللمسة بمسافة أقصر بدل الاستغناء عنها، فالجدار يحتاج عملًا لا إجازة.",
      },
    },
    faq: {
      en: [
        { q: "Should my heels touch my hands or my hands touch my heels?", a: "The hands travel — the heels stay planted exactly where the setup put them. If you find yourself dragging a foot inward to close the gap, the stance has crept; reset to the eighteen-to-twenty-four-inch width and let the oblique close the distance instead." },
        { q: "Why are heel touchers so hard despite the tiny range?", a: "Because the obliques own only a few inches of side-flexion, and the movement spends every one of them under a held squeeze. Small range plus strict tempo equals a muscle that cannot hide — the same reason a slow crunch humbles a fast one." },
        { q: "Will heel touchers slim my waist?", a: "They build the side walls; a slimmer waist is a body-fat question, and side-flexion does not burn localized fat. The deficit our calorie calculator sets handles the size, while this movement handles the shape underneath." },
      ],
      ar: [
        { q: "هل يلمس الكعبُ اليدَ أم اليدُ الكعبَ؟", a: "اليد هي التي تسافر — الكعبان يبقيان مثبتين حيث وضعهما الإعداد بالضبط. إن وجدت نفسك تجرّ قدمًا للداخل لتقليص المسافة فقد زحفت الوقفة؛ أعد ضبطها على عرض الثمانية عشر إلى الأربع والعشرين بوصة ودع المائلة تقفل المسافة." },
        { q: "لماذا لمس الكعبين بهذه الصعوبة رغم النطاق الضئيل؟", a: "لأن المائلتين لا تملكان سوى بوصات قليلة من الثني الجانبي، والحركة تنفقها كلها تحت عصرة مثبتة. نطاق صغير مع إيقاع صارم يساوي عضلة لا تستطيع الاختباء — السبب نفسه الذي يجعل الكرانش البطيء يذلّ السريع." },
        { q: "هل يُنحّي لمس الكعبين خصري؟", a: "يبني الجدران الجانبية؛ أخصر أنحف مسألة دهون جسم، والثني الجانبي لا يحرق دهونًا موضعية. العجز الذي تضبطه حاسبة السعرات لدينا يتولى الحجم، بينما تتولى هذه الحركة الشكل تحته." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/exercises/russian-twist", hrefAr: "/ar/exercises/russian-twist", labelEn: "Russian twist — the rotation sibling", labelAr: "اللف الروسي — شقيق الدوران" },
      { hrefEn: "/tools/calorie-calculator", hrefAr: "/ar/tools/calorie-calculator", labelEn: "Set your deficit with the calorie calculator", labelAr: "اضبط عجزك بحاسبة السعرات" },
    ],
  },

  "hanging-pike": {
    intro: {
      en: "The hanging pike is the ceiling of the floor-abs conversation. Hanging from a bar with an overhand, slightly-beyond-shoulder grip, you fold at the hips until your shins nearly touch the bar above you — the library's own peak — then lower under control with the anti-swing discipline its tips demand. Where the reverse crunch rolls the pelvis an inch, the pike must curl the entire lower body from a dead hang, which is why the library grades it advanced and why one honest rep outweighs a set of kipped ones.",
      ar: "الطي الجسم معلقًا هو سقف حديث بطن الأرض. متعلقًا من بار بقبضة علوية أوسع قليلًا من الكتفين، تنطوي من الوركين حتى تلامس سمانتك تقريبًا البار فوقك — قمة المكتبة نفسها — ثم تنزل بتحكم مع انضباط منع التمايل الذي تشترطه نصائحها. وحيث يلف الكرانش العكسي الحوض بوصة، يجب على الطي أن يلف الجسم السفلي كله من تعليق ميت، ولهذا تصنفه المكتبة متقدمًا ولهذا يزن تكرار أمين واحد أكثر من مجموعة كاملة بالزخم.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis is the engine of the fold, and the library's no-seconds entry hides a long payroll: the hip flexors raise the legs toward the torso, the lats and grip hold the hanging body quiet against the bar's pull, and the forearms spend their whole budget just staying attached. Because the knees start bent at ninety degrees — the library's own starting position — the fold is a curl of the pelvis plus a lift of the thighs, and the abs must choreograph both or the rep becomes a swing.",
        mistakes: [
          { error: "Kipping — using a leg swing and body whip to reach the bar.", fix: "Start each rep from a two-second dead hang; if the shins cannot reach without a swing, the strength is not there yet — the hanging knee raise page is the honest exit." },
          { error: "Letting the body pendulum between reps.", fix: "Lower on a three-count and wait out the sway before the next fold; the anti-swing tip in the library's steps is the rep's spine, not decoration." },
          { error: "Craning the neck to watch the bar.", fix: "Eyes forward, chin packed — the shins know where the bar is; the neck craning steals bracing from the abs and hands the pull to the traps." },
          { error: "Dropping from the peak instead of lowering.", fix: "The descent is the strength builder — control it like the tips demand and the next rep starts from discipline rather than from a correction." },
        ],
        alternatives: "The hanging family ladders up to this fold. The knee raise on the same bar is the standard first rung; the straight-leg raise lengthens the lever; this pike closes the legs to the bar itself. Off the bar, the lying leg raise trains the same fold on the floor, and the reverse crunch rehearses the pelvic curl without any grip tax. Our workout tracker logs every rung so the ladder stays honest.",
        progression: "The ladder is strict and worth respecting: bent-knee raises first, straight-leg raises second, toes-to-bar third, and the pike with its shin-to-bar peak last. Grip gives out before the abs on most first attempts — chalk and a slightly wider grip buy time. When three clean pikes exist, add a two-second hold at the top, then a slower four-count descent; ankle weights come only after the anti-swing law survives them.",
        programming: "Quality lives at low numbers here: three to five sets of three to six controlled reps, once or twice a week, placed at the end of a pulling session when the grip has already warmed up. In a program built for strength, the pike maintains midline stiffness that carries to squats and presses; in a cutting phase it is the movement that keeps the whole abdominal wall earning while the deficit does the revealing.",
        safety: "The shoulders and grip are the gates. Hang from the lats — shoulders pulled slightly down, not stretched loose — and end the set when the grip fails, because a slipping hand teaches the body bad priorities. Shoulder-history lifters should treat the dead hang itself as the first checkpoint; if hanging hurts, the fold waits.",
      },
      ar: {
        muscles: "المستقيمة البطنية محرك الطي، وإدخال المكتبة بلا مساعدين يخفي كشف أجور طويلًا: مثنيات الورك ترفع الساقين نحو الجذع، واللاتان والقبضة يحفظان الجسم المعلق هادئًا ضد سحب البار، والساعدان ينفقان ميزانيتهما كلها في مجرد البقاء ملتصقين، وهذا الحساب المشترك هو ما يجعل التمرين متقدمًا: لا عضلة تنجو لمصلحة أخرى، فالقبضة تنفد قبل البطن في أغلب المحاولات الأولى والجذع كله يدفع الثمن معًا. ولأن الركبتين تبدآن مثنيتين بتسعين درجة — وضع البداية الذي تكتبه المكتبة نفسها — فالطي لفٌّ للحوض ورفعٌ للفخذين معًا، وعلى البطن أن توزع الاثنين وإلا صار التكرار تأرجحًا.",
        mistakes: [
          { error: "الكيب — استخدام تأرجح الساقين وجلد الجسم للوصول إلى البار.", fix: "ابدأ كل تكرار من تعليق ميت لثانيتين؛ إن لم تصل السمانتان دون تأرجح فالقوة لم تصل بعد — وصفحة رفع الركبتين معلقًا هي المخرج الأمين." },
          { error: "ترك الجسم يتأرجح كبندول بين التكرارات.", fix: "انزل في ثلاث عدّات وانتظر اضطراب التمايل قبل الطية التالية؛ فنصيحة منع التمايل بخطوات المكتبة هي عمود التكرار لا زينة له." },
          { error: "مدّ الرقبة لمراقبة البار.", fix: "العينان للأمام والذقن محشوة — السمانتان تعرفان مكان البار؛ ومدّ الرقبة يسرق الشد من البطن ويسلم السحب للمصائد." },
          { error: "الإسقاط من القمة بدل النزول.", fix: "الهبوط هو باني القوة — تحكم فيه كما تشترط النصائح فيبدأ التكرار التالي من الانضباط لا من التصحيح." },
        ],
        alternatives: "العائلة المعلقة تصعد سلمًا حتى هذا الطي. رفع الركبتين على البار نفسه هو الدرجة الأولى المعيارية، ورفع الساقين المستقيمة يطيل الرافعة، وهذا الطي يغلق الساقين إلى البار ذاته. وبعيدًا عن البار، يدرّب رفع الساقين المستلقي الطية نفسها على الأرض بلا قبضة ولا تعليق، ويتدرب الكرانش العكسي على لف الحوض وحده، ومن يملك كرسيًا رومانيًا يجد فيه منتصف الطريق: ثقل الجسم معلق من وركين محميين لا من معصمين عزلاء. ومتتبع التمارين لدينا يسجل كل درجة باسمها فيبقى السلم أمينًا لا تختلط فيه الأرقام ولا تدّعي درجة لم تصل.",
        progression: "السلم صارم ويستحق الاحترام: رفع الركبتين مثنيتين أولًا، ثم رفع الساقين المستقيمة، ثم أصابع-إلى-البار ثالثًا، ثم هذا الطي بقمة السمانة-إلى-البار أخيرًا. القبضة تنفد قبل البطن في أغلب المحاولات الأولى — والطباشير وقبضة أوسع قليلًا يشتريان وقتًا. وحين توجد ثلاث طيات نظيفة، أضف تثبيت ثانيتين في الأعلى ثم هبوطًا في أربع عدّات؛ ولا تأتي أثقال الكاحل إلا بعد أن ينجو قانون منع التمايل منها.",
        programming: "الجودة تسكن الأرقام المنخفضة هنا: ثلاث إلى خمس مجموعات من ثلاثة إلى ستة تكرارات متحكم فيها، مرة أو مرتين أسبوعيًا، توضع في نهاية جلسة سحب والقبضة ساخنة أصلًا. وفي برنامج قوة يحافظ الطي على صلابة خط الوسط التي تنتقل إلى السكوات والدفعة، ولهذا يضعه مدربو القوة في ذيل جلسات السحب لا في بدايتها؛ وفي مرحلة التنشيف هو الحركة التي تبقي جدار البطن كله يكسب بينما يتولى العجز الكشف.",
        safety: "الكتفان والقبضة هما البوابتان. علّق من اللاتين — الكتفان مسحوبان قليلًا لأسفل لا ممدودان مرتخيين — وأنهِ المجموعة عند فشل القبضة، فاليد المنزلقة تعلم الجسم أولويات سيئة. وأصحاب تاريخ الكتف فليعاملوا التعليق الميت نفسه كنقطة التفتيش الأولى؛ إن كان التعليق يؤلم فلينتظر الطي — فالسلم لا يغلق أبوابه، والدرجة الأدنى تحقق نصف الفائدة بصفر مخاطرة — صفقة لا يقدمها أي تمرين متقدم آخر بهذا الكرم.",
      },
    },
    faq: {
      en: [
        { q: "What is the difference between a hanging pike and toes-to-bar?", a: "The pike folds with bent knees rising toward the bar; toes-to-bar keeps the legs straight throughout. The library's own steps set the pike's start at ninety-degree knees — a shorter lever that trades a little range for a lot of control." },
        { q: "Why do I swing so much on every rep?", a: "The swing is momentum left over from the previous rep — lower on a slow three-count and let the body settle before folding again. The anti-swing tip on this page is the difference between training the abs and demonstrating a pendulum." },
        { q: "How many hanging pikes should I aim for?", a: "Three clean ones beat ten ugly ones — this is an advanced fold, and the library grades it that way for a reason. Build from hanging knee raises until five strict pikes exist, then add pauses, not reps." },
      ],
      ar: [
        { q: "ما الفرق بين الطي المعلق وأصابع-إلى-البار؟", a: "الطي ينطوي بركبتين مثنيتين ترتفعان نحو البار؛ وأصابع-إلى-البار يحفظ الساقين مستقيمتين من أول الحركة لآخرها. خطوات المكتبة نفسها تجعل بداية الطي بركبتين بتسعين درجة — رافعة أقصر تقايض قليلًا من المدى بكثير من السيطرة." },
        { q: "لماذا أتمايل كثيرًا في كل تكرار؟", a: "التمايل زخم متبقٍ من التكرار السابق — انزل في ثلاث عدّات بطيئة ودع الجسم يستقر قبل الطي التالي. نصيحة منع التمايل بهذه الصفحة هي الفرق بين تدريب البطن وعرض بندول." },
        { q: "كم طية معلقة ينبغي أن أستهدفها؟", a: "ثلاث نظيفة تتفوق على عشر قبيحة — هذا طي متقدم والمكتبة تصنفه كذلك لسبب. ابنِ من رفع الركبتين معلقًا حتى توجد خمس طيات صارمة، ثم أضف التثبيتات لا التكرارات." },
      ],
    },
    links: [
      { hrefEn: "/exercises/hanging-leg-raise", hrefAr: "/ar/exercises/hanging-leg-raise", labelEn: "Hanging leg raise — the family ladder", labelAr: "رفع الساقين معلقًا — سلم العائلة" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Intermediate PPL program", labelAr: "برنامج الدفع/السحب/الأرجل المتوسط" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log every rep in the free tracker", labelAr: "سجّل كل تكرار في المتتبع المجاني" },
    ],
  },

  "pallof-press": {
    intro: {
      en: "The Pallof press is the anti-rotation exercise that taught the fitness world why the abs exist. Standing side-on to a cable at shoulder height — the library's preferred setup — you press a single handle straight out from the chest and hold it there while the stack tries to wrench you toward the tower. Nothing rotates, and that is the entire point: the press gives the cable a lever, and the abs' job is refusing to let it cash in. The library's hold prescription — several seconds per rep — turns a small-looking press into a full conversation between the obliques and the weight stack.",
      ar: "برس بالوف هو تمرين مضاد الدوران الذي علّم عالم اللياقة لماذا توجد البطن أصلًا. واقفًا بجانبك لكيبل بارتفاع الكتف — الإعداد المفضل للمكتبة — تدفع مقبضًا واحدًا مستقيمًا من صدرك وتثبته هناك بينما تحاول الرصة أن تفتلك نحو البرج. لا شيء يدور، وهذا هو المقصود كله: الدفعة تمنح الكيبل رافعة، ووظيفة البطن أن ترفض صرفها. ووصفة التثبيت بالمكتبة — عدة ثوانٍ لكل تكرار — تحوّل دفعة تبدو صغيرة إلى حوار كامل بين المائلتين ورصة الأوزان — فالمقاومة الحقيقية ليست في الوزن بل في الالتواء الذي يجب ألا يحدث.",
    },
    sections: {
      en: {
        muscles: "The obliques nearest the tower take the primary billing, and the library's seconds list — chest, shoulders, triceps — reads like the press half of the movement, which is exactly how it feels: the arms push, the abs veto. The rectus abdominis braces the front wall, the glutes and quads hold the stance against the sideways torque, and the deep spinal stabilizers work the way they do in every real-world load — by refusing motion, not creating it. This is the abs' actual job description, rehearsed standing up.",
        mistakes: [
          { error: "Letting the torso rotate toward the tower as the arms extend.", fix: "Press the hands out, not the ribs around — if the chest starts to open toward the cable, shorten the range and rebuild the hold; the stack wins by degrees, not by force." },
          { error: "Standing square to the cable instead of side-on.", fix: "Reset the stance the library describes — feet hip-width, side to the tower — because square stance hands the torque to the shoulders and takes it off the obliques entirely." },
          { error: "Rushing the hold and bouncing the reps.", fix: "The library prescribes several seconds per repetition; count them. The movement's value lives in the isometric refusal, and speed deletes precisely that." },
          { error: "Locking the elbows out with shrugged shoulders.", fix: "Press to full extension with shoulders down and chest proud — a shrugged finish trades the anti-rotation brace for a shoulder isometric nobody asked for." },
        ],
        alternatives: "The anti-rotation family branches in three directions from here. The Pallof press with rotation — its own page — adds a controlled turn at full extension for advanced trainees; the cable wood chop trains the same refusal across a bigger diagonal; and the standing cable lift flips the diagonal to the other hip. Off the cables, the front plank holds the same brace without equipment. Our core program places these as the stiffness work between heavier lifts.",
        progression: "Start light enough that the hold is a question, not a verdict: a modest stack setting, two-second holds, six presses per side. Grow the hold first — two seconds to four to five — then the distance from the tower one step at a time, since stepping away lengthens the lever and the torque alike. Only after both does the weight pin move. The advanced rung is the press with rotation or a half-kneeling stance, which removes the legs from the stability bill.",
        programming: "Three sets of six to eight presses per side with honest holds, twice a week, slots cleanly after the main lifts — the movement taxes the brace without fatiguing the pressing muscles. Athletes benefit from it before speed work as an activation; lifters benefit from it after heavy pulling as maintenance. In a cutting phase it keeps the deep walls working while the deficit handles visibility.",
        safety: "The lower back and the knees share the watch. If the lumbar arches or the hips twist to cheat the hold, the weight is a conversation the abs are losing — drop the stack before the form drops. Half-kneeling is the standard regression for cranky knees or hips, and it teaches the same refusal with a smaller stability bill.",
      },
      ar: {
        muscles: "المائلة الأقرب للبرج تأخذ الفاتورة الأساسية، وقائمة مساعدي المكتبة — صدر وأكتاف وترايسبس — تُقرأ كنصف الدفعة من الحركة، وهو بالضبط شعورها: الذراعان تدفعان والبطن تنسخ. المستقيمة البطنية تشدّ الجدار الأمامي أمام الحمل، والألويات والفخذيات تحفظان الوقفة ضد الالتواء الجانبي وتمنعان الركبتين عن أن تكونا صمام أمان يسرح بزاوية، والمثبتات العميقة تعمل كما تعمل في كل حمل حقيقي بالعالم — برفض الحركة لا بصنعها. هذه بطاقة وصف البطن الفعلية، تُتدرب واقفًا — لا استلقاءً على حصيرة، وهي النسخة القريبة من كل مرة تحمل فيها صندوقًا ثقيلًا بيد واحدة أو تعبر بابًا مثقلًا بجانب واحد.",
        mistakes: [
          { error: "ترك الجذع يلتف نحو البرج مع مدّ الذراعين.", fix: "ادفع اليدين للخارج لا الأضلاع حولك — إن بدأ الصدر ينفتح نحو الكيبل فقصّر المدى وأعد بناء التثبيت؛ فالرصة تكسب بالدرجات لا بالقوة." },
          { error: "الوقوف مواجهًا للكيبل بدل الوقوف بجانبه.", fix: "أعد ضبط الوقفة كما تصفها المكتبة — قدمان بعرض الوركين والجانب للبرج — لأن المواجهة تسلم الالتواء للأكتاف وتريح المائلتين تمامًا." },
          { error: "استعجال التثبيت وارتداد التكرارات.", fix: "المكتبة تصف عدة ثوانٍ لكل تكرار؛ عُدّها. قيمة الحركة تسكن في الرفض الثابت، والسرعة تحذف هذا بالذات." },
          { error: "قفل المرفقين مع كتفين مرفوعتين.", fix: "ادفع إلى امتداد كامل والكتفان لأسفل والصدر مرفوع — فالنهاية المرفوعة تقايض شد مضاد الدوران بشد كتف لم يطلبه أحد." },
        ],
        alternatives: "عائلة مضاد الدوران تتفرع في ثلاثة اتجاهات من هنا. برس بالوف مع الدوران — بصفحته — يضيف لفة متحكم بها عند الامتداد الكامل للمتقدمين، ودفع الحطب بالكيبل يدرّب الرفض نفسه عبر قطر أكبر، والرفع بالكيبل واقفًا يقلب القطر إلى الورك الآخر. وبعيدًا عن الكيبل، يحفظ البلانك الأمامي الشد نفسه بلا عتاد. وبرنامج الجذع لدينا يضع هذه كعمل صلابة بين الرفعات الأثقل.",
        progression: "ابدأ بوزن يجعل التثبيت سؤالًا لا حكمًا: رصة متواضعة وتثبيت ثانيتين وست دفعات لكل جهة. نمِّ التثبيت أولًا — من ثانيتين إلى أربع إلى خمس — ثم المسافة عن البرج خطوة كل مرة، فالابتعاد يطيل الرافعة والالتواء معًا. وبعد الاثنين فقط يتحرك وتد الوزن. والدرجة المتقدمة هي الدفعة مع الدوران أو وقفة الركبة النصفية التي تحذف الساقين من فاتورة الاستقرار وتجبر الجذع على دفعها وحده — درجة تصفية تكشف أي تسريب في الشد مهما صغر.",
        programming: "ثلاث مجموعات من ست إلى ثماني دفعات لكل جهة بتثبيت أمين، مرتين أسبوعيًا، تدخل بسلاسة بعد الرفعات الرئيسية دون أن تسرق من طاقة اليوم شيئًا يذكر — فالحركة تفرض ضريبة على الشد دون إرهاق عضلات الدفع. ويستفيد الرياضيون منها قبل العمل السريع كتفعيل، والرافعون بعد السحب الثقيل كصيانة. وفي مرحلة التنشيف تبقي الجدران العميقة تعمل بينما يتولى العجز الظهور، ولأنها لا تُنهك الجهاز العصبي كالرفعات الثقيلة يمكن جدولتها حتى في أسابيع الطاقة المنخفضة دون خسارة تذكر — مرونة جدولية لا تملكها الرفعات الكبرى.",
        safety: "أسفل الظهر والركبتان يتقاسمان الحراسة. إن تقوس القطني أو التفت الوركان لغش التثبيت فالوزن حوار تخسره البطن — أنزل الرصة قبل أن تنزل الصورة. ووقفة الركبة النصفية هي التراجع المعياري للركبتين والوركين المتعبين، وتعلّم الرفض نفسه بفاتورة استقرار أصغر — درجة ينبغي ألا تُقرأ كتراجع بل كتغيير زاوية للسينوغرافيا نفسها: الجذع يعمل وحده بينما الساقان ترتاحان.",
      },
    },
    faq: {
      en: [
        { q: "Which side faces the cable in a Pallof press?", a: "Stand side-on, per the library's setup — the cable pulls across the front of your body toward the tower. The obliques on the near side resist the twist; switch sides and the far wall takes its turn." },
        { q: "Why press at all if the abs do the work?", a: "The press gives the cable its lever — extending the arms turns a manageable pull into a torque the whole trunk must refuse. Without the press there is nothing to resist; the arms are the mischief, the abs are the law." },
        { q: "Is the Pallof press better than side bends for the obliques?", a: "They are different jobs: side bends flex the spine under load, the Pallof refuses rotation — the second is closer to what the obliques do all day. Most programs want both, and this page's family covers each." },
      ],
      ar: [
        { q: "أي جهة تواجه الكيبل في برس بالوف؟", a: "قف بجانبه وفق إعداد المكتبة — فالكيبل يسحب عبر مقدمة جسمك نحو البرج. المائلة في الجهة القريبة تقاوم اللف؛ وتبديل الجهات يعطي الجدار البعيد دوره." },
        { q: "لماذا ندفع أصلًا إن كانت البطن تؤدي العمل؟", a: "الدفعة تمنح الكيبل رافعته — مدّ الذراعين يحوّل سحبًا محتملًا إلى التواء يجب على الجذع كله رفضه. بلا دفعة لا يوجد ما يُقاوم؛ فالذراعان هي الفتنة والبطن هي القانون." },
        { q: "هل برس بالوف أفضل من الثني الجانبي للمائلتين؟", a: "وظيفتان مختلفتان: الثني الجانبي يحني العمود تحت حمل، وبالوف يرفض الدوران — والثاني أقرب لما تفعله المائلتان طوال اليوم. أغلب البرامج تريد الاثنين، وعائلة هذه الصفحة تغطي كليهما." },
      ],
    },
    links: [
      { hrefEn: "/exercises/standing-cable-wood-chop", hrefAr: "/ar/exercises/standing-cable-wood-chop", labelEn: "Cable wood chop — the diagonal sibling", labelAr: "دفع الحطب بالكيبل — الشقيق القطري" },
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/exercises/plank", hrefAr: "/ar/exercises/plank", labelEn: "The plank — the equipment-free brace", labelAr: "البلانك — الشد بلا معدات" },
    ],
  },
};
