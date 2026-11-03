/**
 * EXERCISES-ENRICHMENT — BATCH 2 (exercises 6-10 of 50).
 *
 * Completes the GSC-evidence group (press-sit-up and spider-crawl — both
 * index-verified in the audit §2.4) and anchors the core family with the
 * three most-searched abs movements that the Arabic keyword map makes
 * explicit: plank, russian twist and hanging leg raise.
 *
 * Every fact quoted about the movement comes from the exercise's own row
 * in src/lib/exercises.ts; programming numbers are standard coaching
 * prescription stated as practice guidance.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_2: Record<string, ExerciseEnrichment> = {
  "press-sit-up": {
    intro: {
      en: "The press sit-up is what happens when a core exercise refuses to stay a core exercise. The library grades it advanced, and the instructions explain why: you lie on a bench with a barbell resting on your chest, then — in one continuous effort — curl the torso through a sit-up while pressing the bar overhead. Abs, chest, shoulders and triceps all take a turn, which is exactly the secondary-muscle list the data page shows. It is a conditioning move more than a bodybuilding one: light bar, full-body coordination, honest breathing. Search engines surfaced this page from the site's index, and it answers a niche but real query — what does combining a sit-up with a press actually train?",
      ar: "برس مع ست أب هو ما يحدث حين يرفض تمرين البطن أن يظل تمرين بطن فقط. تصنفه المكتبة ضمن المستوى المتقدم، وتشرح التعليمات السبب: تستلقي على بنش وبار مستقر على صدرك، ثم — في مجهود واحد متصل — تلف الجذع عبر جلوس كامل بينما تدفع البار فوق رأسك. البطن والصدر والأكتاف والترايسبس كلها تأخذ دورها، وهذه بالضبط قائمة العضلات المساعدة التي تعرضها صفحة البيانات. إنها حركة لياقة بدنية أكثر منها حركة كمال أجسام: بار خفيف وتناسق لكامل الجسم وتنفس صادق. وقد أظهرت محركات البحث هذه الصفحة من فهرس الموقع، وهي تجيب عن استعلام محدود لكنه حقيقي: ماذا يدرّب الدمج بين الجلوس والدفعة فعلًا؟",
    },
    sections: {
      en: {
        muscles: "The abs are the engine — the instructions have them contracting with the glutes from the first moment of the sit-up phase, flexing the spine off the bench. But the library's secondary list reads like a push-day lineup: chest and triceps drive the bar off the torso, shoulders finish the overhead lockout, and all three hold the bar isometrically on the way down while the abs control the descent. The glutes deserve their billing too — braced the whole set, they anchor the pelvis so the hip flexors cannot hijack the curl. Few movements make four muscle groups earn the same rep.",
        mistakes: [
          { error: "Loading the bar like a bench press and grinding out half-rep sit-ups.", fix: "This is a coordination lift — start with an empty bar or a light fixed barbell, as the advanced grading implies, and add weight only when the whole pattern flows." },
          { error: "Pressing first, then sitting up in two separate motions.", fix: "The instructions call the curl and the press simultaneous — one movement, one breath out; separating them turns the exercise into a mediocre pair of exercises." },
          { error: "Letting the feet slide and the hips do the lifting.", fix: "Secure the legs under the bench extension exactly as the starting position requires; anchored feet keep the abs, not the hip flexors, as the prime mover." },
          { error: "Dropping the torso and the bar back to the start in a free fall.", fix: "Lower both on a controlled exhale-in — the instructions specify breathing in on the descent — so the bar path stays over the chest instead of over the face." },
        ],
        alternatives: "The movement splits cleanly if the combination defeats you: plain sit-ups build the curl, and standing military presses build the overhead drive, and recombining them later is easy. A medicine ball pressed overhead during sit-ups preserves the synchronized timing with far less risk overhead — literally. In the library's own family, weighted sit-ups with bands offer loaded flexion, and the cable crunch trains the abs under load without any pressing coordination at all.",
        progression: "Respect the advanced tag and earn the movement in stages. First own strict sit-ups for 15 clean reps, then sit-ups with a light plate pressed out in front — arms locked — to rehearse the overhead demand, and only then the barbell version. Loading progresses in the smallest plates the gym owns; the abs were never the bottleneck, the coordination was. Advanced trainees can slow the descent to three seconds, which doubles the abs' work without touching the bar's weight.",
        programming: "Program it as a finisher or a conditioning block, 2-3 sets of 8-12 reps with 60-90 seconds of rest, once or twice a week — it is too demanding as a daily driver and too light to serve as a primary strength lift. It slots naturally at the end of a full-body or push session, after the real pressing is done. Because the abs are the engine, avoid scheduling it the day after a heavy squat session; a fatigued core makes the bar path wobbly, and a wobbly bar over the face is a programming error, not an accident.",
        safety: "The bar travels over the face and throat — that is the headline risk, and it is managed entirely by load selection and control: light bar, secure grip, no fatigue-compromised sets, and a spotter for anything adventurous. The bench-anchored position also loads the hip flexors hard at the top; anyone with a history of lower-back flare-ups should master the plain sit-up first and treat any lumbar arching as a signal to stop the set.",
      },
      ar: {
        muscles: "البطن هو المحرك؛ فالتعليمات تجعله ينقبض مع الألويات من اللحظة الأولى لمرحلة الجلوس، مثنيًا العمود الفقري عن البنش. لكن قائمة المكتبة للمساعدة تشبه تشكيلة يوم دفع كاملة: الصدر والترايسبس يقودان البار عن الجذع، والأكتاف تتم القفل فوق الرأس، والثلاثة تحمل البار ثباتيًا في النزول بينما يضبط البطن الهبوط. والألويات تستحق مكانها المعلن أيضًا؛ فهي مشدودة طوال المجموعة ترسّخ الحوض كي لا تختطف مثنيات الورك الحركة. قليل من الحركات تجعل أربع مجموعات عضلية تكسب نفس التكرار.",
        mistakes: [
          { error: "تحميل البار كأنه بنش برس ثم جرّ جلوس نصف تكرار.", fix: "هذه رفعة تناسق — ابدأ ببار فارغ أو بار خفيف ثابت كما يوحي تصنيف المتقدم، ولا تزد الوزن إلا حين يسيل النمط كاملًا بسلاسة." },
          { error: "الدفع أولًا ثم الجلوس في حركتين منفصلتين.", fix: "التعليمات تصف الالتفاف والدفعة متزامنين — حركة واحدة وزفير واحد؛ وفصلهما يحول التمرين إلى زوج رديء من التمارين." },
          { error: "انزلاق القدمين وتولي الوركين للرفع.", fix: "ثبّت الساقين تحت امتداد البنش تمامًا كما يقتضي وضع البداية؛ القدمان الموثقتان تُبقيان البطن لا مثنيات الورك محركًا أساسيًا." },
          { error: "إسقاط الجذع والبار معًا في سقوط حر نحو البداية.", fix: "أنزل كليهما بتحكم مع الشهيق — التعليمات تنص على التنفس الداخلي في الهبوط — فيبقى مسار البار فوق الصدر لا فوق الوجه." },
        ],
        alternatives: "تنقسم الحركة بنظافة إذا هزمك الدمج: الجلوس البسيط يبني الالتفاف، والبرس العسكري واقفًا يبني الدفعة العلوية، وإعادة الدمج لاحقًا سهلة. والكرة الطبية المدفوعة فوق الرأس أثناء الجلوس تحفظ التوقيت المتزامن بخطر أقل بكثير — حرفيًا. وفي عائلة المكتبة نفسها، الجلوس الموزون بالمطاط يقدم انثناء محملًا، والكرانش بالكيبل يدرّب البطن تحت حمل دون أي تنسيق دفع.",
        progression: "احترم وسم المتقدم واكسب الحركة على مراحل. أولًا أتقن الجلوس الصارم 15 تكرارًا نظيفًا، ثم جلوسًا بقرص خفيف مدفوع أمامك — ذراعان مقفلتان — لتمرين المطلب العلوي، وعندها فقط نسخة البار. يتقدم الحمل بأصغر أقراص تملكها الصالة؛ فالبطن لم يكن يومًا عنق الزجاجة، بل التناسق. والمتقدمون يمكنهم إبطاء الهبوط إلى ثلاث ثوان، وهذا يضاعف عمل البطن دون مساس بوزن البار.",
        programming: "برمجه كحركة ختامية أو كتلة لياقة بدنية: 2-3 مجموعات من 8-12 تكرارًا براحة 60-90 ثانية، مرة أو مرتين أسبوعيًا؛ فهو أكثر إجهادًا من أن يكون حركة يومية، وأخف من أن يخدم كرفعة قوة أساسية. ومكانه الطبيعي نهاية جلسة جسم كامل أو جلسة دفع بعد انتهاء الدفع الحقيقي. ولأن البطن هو المحرك، تجنب جدولته في اليوم التالي لجلسة سكوات ثقيلة؛ فالجذع المنهك يجعل مسار البار متمايلًا، والبار المتمايل فوق الوجه خطأ برمجي لا حادث.",
        safety: "البار يسافر فوق الوجه والحلق — هذا هو الخطر الرئيسي، وإدارته كلها في اختيار الحمل والتحكم: بار خفيف، وقبضة آمنة، ولا مجموعات منهكة، ومساعد لأي مغامرة. كما أن وضع الانغراس تحت البنش يحمل مثنيات الورك بشدة في القمة؛ ومن لديه تاريخ نوبات أسفل الظهر فليتقن الجلوس البسيط أولًا، وليعامل أي تقوّس قطني كإشارة لإنهاء المجموعة.",
      },
    },
    faq: {
      en: [
        { q: "How much weight should I use on the press sit-up?", a: "Start with an empty bar or the lightest fixed barbell in the gym — the exercise is graded advanced not because of the load but because of the coordination. Most trainees stay somewhere between 5 and 20 kg for high-quality sets; the moment the sit-up slows before the press does, the bar is too heavy." },
        { q: "Can I do it with dumbbells instead of a barbell?", a: "Yes, and it is a sensible variation — a dumbbell in each hand pressed overhead during the curl keeps the same timing with a shorter learning curve and no bar-over-face risk. Keep both dumbbells moving together; alternating presses turn the timing game into a juggling one." },
        { q: "Is this a good ab exercise on its own?", a: "It is a good full-body conditioning exercise that happens to include the abs. The instructions make the abs and glutes the initiators, but the press dilutes the direct flexion work. For pure ab development, the library's crunch and cable-crunch pages give more per minute; the press sit-up buys you coordination the others cannot." },
      ],
      ar: [
        { q: "ما الوزن المناسب لبرس مع ست أب؟", a: "ابدأ ببار فارغ أو أخف بار ثابت في الصالة؛ فالتمرين مصنف متقدمًا لا بسبب الحمل بل بسبب التناسق. يبقى أغلب المتدربين بين 5 و20 كجم لمجموعات عالية الجودة، وما إن يبطئ الجلوس قبل الدفعة حتى يعلم الجميع أن البار صار ثقيلًا." },
        { q: "هل أستطيع أداءه بدمبل بدل البار؟", a: "نعم، وهو تنويع حكيم؛ فدمبل في كل يد تدفع فوق الرأس أثناء الالتفاف يحفظ التوقيت نفسه بمنحنى تعلم أقصر وبلا خطر البار فوق الوجه. حافظ على تحرك الدمبلتين معًا؛ فالتبادل يحول لعبة التوقيت إلى لعبة تهريج." },
        { q: "هل هو تمرين بطن جيد بذاته؟", a: "إنه تمرين لياقة لكامل الجسم يتضمن البطن ضمنًا. التعليمات تجعل البطن والألويات بادئتين، لكن الدفعة تخفف عمل الانثناء المباشر. لتطوير البطن الخالص تمنح صفحتا الكرانش والكرانش بالكيبل في مكتبتنا أكثر في الدقيقة؛ أما برس مع ست أب فيشتري لك تناسقًا لا تمنحه الأولى." },
      ],
    },
    links: [
      { hrefEn: "/blog/12-week-progressive-overload-intermediate", hrefAr: "/ar/blog/12-week-progressive-overload-intermediate-guide", labelEn: "12-week progressive overload — intermediate plan", labelAr: "خطة التدرج بالحمل 12 أسبوعًا للمتوسطين" },
      { hrefEn: "/exercises/standing-military-press", hrefAr: "/ar/exercises/standing-military-press", labelEn: "Standing military press — the overhead half", labelAr: "البرس العسكري واقفًا — نصف الحركة العلوي" },
      { hrefEn: "/ai-workout-planner", hrefAr: "/ar/ai-workout-planner", labelEn: "Build a program around it — AI workout planner", labelAr: "ابنِ برنامجًا حولها — مخطط التمارين الذكي" },
    ],
  },

  "spider-crawl": {
    intro: {
      en: "The spider crawl looks like something you did as a child and forgot, which is precisely why it works: braced on hands and toes as the instructions describe, you drive one knee toward its same-side elbow while the rest of the body fights to stay flat. Nothing about it is heavy, and nothing about it is easy. Search engines surfaced this page from the site's index because the query is real — people want a core move that trains the abs the way athletes use them, resisting wobble instead of crunching. It costs nothing, travels nowhere, and quietly hammers the abs, shoulders and chest all at once, which is the exact secondary-muscle list on the data page.",
      ar: "زحف العنكبوت يبدو شيئًا فعلته طفلًا ثم نسيته، وهذا بالضبط سبب نجاحه: مسنودًا على اليدين وأطراف القدمين كما تصف التعليمات، تدفع ركبة واحدة نحو مرفق نفس الجهة بينما يقاوم بقية الجسم البقاء مستويًا. لا شيء فيه ثقيل، ولا شيء فيه سهل. أظهرت محركات البحث هذه الصفحة من فهرس الموقع لأن الاستعلام حقيقي؛ فالناس يريدون حركة بطن تدرّب العضلة بالطريقة التي يستخدمها الرياضيون: مقاومة الترنح بدل الالتفاف. لا تكلف شيئًا ولا تحتاج مكانًا، وتطرق البطن والأكتاف والصدر دفعة واحدة، وهذه بالضبط قائمة العضلات المساعدة في صفحة البيانات.",
    },
    sections: {
      en: {
        muscles: "The abs do the invisible job: with the body held straight as the instructions demand, they fight extension and rotation at the same time — every knee drive is a rotation the obliques must refuse, and every crawl step is a sag the rectus abdominis must stop. The library's secondary list explains the rest: the chest, shoulders and triceps hold the plank half of the position, bearing most of your bodyweight on hands that never really rest. This is anti-movement training — the muscle works by keeping something from happening, which is how it works in every sport that matters.",
        mistakes: [
          { error: "Hips sagging toward the floor as soon as the knee starts traveling.", fix: "The body stays straight from heels to head — if the hips dip, shorten the range of the knee drive before you shorten the quality of the plank." },
          { error: "Rushing the reps until the crawl becomes a bounce.", fix: "One controlled knee-to-elbow per second, with a beat at the top; the abs are doing anti-rotation work that speed deletes." },
          { error: "Letting the opposite hip rotate open so the knee meets the elbow sideways.", fix: "Keep both hips square to the floor and bring the knee forward under the body, as the instructions describe — external rotation is the movement's honest range, not a cheat to touch further." },
          { error: "Holding the breath through the whole set.", fix: "Exhale on each knee drive, as the page's bracing tip implies — braced does not mean breathless, and a oxygen-starved set ends early for the wrong reasons." },
        ],
        alternatives: "The same anti-extension family lives elsewhere in this library: the plank is the static parent of this crawl, the mountain climber is its faster, flatter sibling, and the dead bug trains the identical bracing pattern lying on your back — the gentlest entry point of all. Spider crawls with the hands elevated on a bench cut the difficulty for beginners; crawling backward or laterally, once forward is mastered, adds a coordination dimension the basic version never touches.",
        progression: "The first progression is distance: crawl ten clean steps per side, then twenty, then thirty — the exercise is self-limiting, and form failure arrives before strength failure, which makes it safe to push. From there, slow each knee drive to a three-second count, pause with the knee an inch from the elbow, or crawl with the feet on a smooth floor and hands on a mat — the reversed friction bias changes everything. Advanced trainees can wear a light backpack or crawl uphill; the movement never needs a gym to keep escalating.",
        programming: "Slot it as a core block or a conditioning finisher: 3-4 rounds of 20-30 seconds of crawling, resting 45-60 seconds between rounds, two or three times a week. It pairs perfectly at the start of a session as an activation — the abs and shoulders wake up without fatigue — or at the very end when nothing heavy is left to protect. In fat-loss blocks it doubles as low-impact conditioning, keeping the heart rate honest with zero equipment, which is why our home programs lean on the crawl family.",
        safety: "The wrists bear the load in a bent-back position, and they are the joint most likely to complain first — stretch the wrists beforehand and shift weight toward the knuckles if pressure pinches. Shoulder history decides hand width: wider hands make the base stabler for cranky shoulders. The movement is safe for the spine by design — the whole point is keeping it still — but anyone with an acute wrist or shoulder injury should pick the dead bug and return to crawling later.",
      },
      ar: {
        muscles: "البطن يؤدي العمل غير المرئي: فمع بقاء الجسم مستقيمًا كما تشترط التعليمات، يقاوم الاستطالة والدوران في آن واحد — كل دفعة ركبة دورانٌ ترفضه العضلات المائلة، وكل خطوة زحف هبوطٌ توقفه المستقيمة البطنية. وقائمة المكتبة للمساعدة تشرح الباقي: الصدر والأكتاف والترايسبس يحملون نصف البلانك من الوضعية، فيتحملون معظم وزنك على يدين لا تجدان راحة حقيقية. هذا تدريب مضاد للحركة؛ فالعضلة تعمل بمنع شيء من الحدوث، وهكذا تعمل في كل رياضة تستحق الاسم.",
        mistakes: [
          { error: "هبوط الوركين نحو الأرض فور بدء تحرك الركبة.", fix: "يبقى الجسم مستقيمًا من الكعبين إلى الرأس؛ إذا انخفض الوركان فقصّر مدى دفع الركبة قبل أن تقصّر جودة البلانك." },
          { error: "استعجال التكرارات حتى يصبح الزحف ارتدادًا.", fix: "ركبة إلى مرفق واحدة في الثانية بضبط، مع لحظة توقف في القمة؛ فالبطن يقوم بعمل مضاد للدوران تمسحه السرعة." },
          { error: "انفتال الورك المقابل جانبًا فتلتقي الركبة بالمرفق بالعرض.", fix: "أبقِ الوركين متوازيين مع الأرض وأحضر الركبة أمامًا تحت الجسم كما تصف التعليمات؛ فالتدوير الخارجي هو المدى الأمين للحركة لا حيلة للّمس أبعد." },
          { error: "حبس النفس طوال المجموعة.", fix: "ازفر مع كل دفعة ركبة كما توحي نصيحة الشد بالصفحة؛ فالمشدود لا يعني المختنق، والمجموعة المقطوعة الأكسجين تنتهي مبكرًا لأسباب خاطئة." },
        ],
        alternatives: "العائلة المضادة للاستطالة نفسها تسكن مكان آخر في هذه المكتبة: البلانك هو الأصل الثابت لهذا الزحف، ومتسلق الجبال شقيقه الأسرع والأكثر استواءً، والحشرة الميتة تدرّب نمط الشد ذاته مستلقيًا على ظهرك وهي ألطف بوابة على الإطلاق. والزحف بيدين مرتفعتين على بنش يخفض الصعوبة للمبتدئين، أما الزحف للخلف أو جانبًا بعد إتقان الأمامي فيضيف بُعد تناسق لا تمسه النسخة الأساسية.",
        progression: "أول تدرج هو المسافة: زحف عشر خطوات نظيفة لكل جهة ثم عشرون ثم ثلاثون؛ فالتمرين محدود ذاتيًا، وفشل الوضعية يسبق فشل القوة وهذا ما يجعل دفعه آمنًا. من هناك أبطئ كل دفعة ركبة إلى عد ثلاث ثوان، أو توقف والركبة على بُعد بوصة من المرفق، أو زحف بقدمين على أرضية ملساء ويدين على بساط؛ فانعكاس توزيع الاحتكاك يغير كل شيء. والمتقدمون يستطيعون حمل حقيبة خفيفة أو الزحف صاعدًا؛ فالحركة لا تحتاج صالة لترفع سقفها أبدًا.",
        programming: "ضعه ككتلة بطن أو ختام لياقة: 3-4 جولات من 20-30 ثانية زحفًا، براحة 45-60 ثانية بين الجولات، مرتين أو ثلاثًا أسبوعيًا. ويقترن بأناقة في بداية الجلسة كتنشيط — فالبطن والأكتاف يستيقظان دون إنهاك — أو في النهاية تمامًا حين لا يبقى شيء ثقيل يستحق الحماية. وفي مراحل خسارة الدهون يعمل كلياقة منخفضة الصدم تحفظ نبض القلب صادقًا بلا معدات، ولهذا تعتمد برامجنا المنزلية على عائلة الزحف.",
        safety: "الرسغان يحملان الوزن في وضعية انثناء خلفي وهما المفصل الأرجح شكوى أولًا — مدّ الرسغين قبل البدء وانقل الضغط نحو براجم اليد إذا تألمت. تاريخ الكتف يحدد عرض اليدين: يدان أوسع تجعلان القاعدة أثبت لأكتاف متعبة. والحركة آمنة للعمود الفقري بالتصميم — فغايتها كلها إبقاؤه ساكنًا — لكن من لديه إصابة رسغ أو كتف حادة فليختر الحشرة الميتة ويعود للزحف لاحقًا.",
      },
    },
    faq: {
      en: [
        { q: "Spider crawl or mountain climbers — what's the difference?", a: "Range and intent. The mountain climber, as its own page here describes, alternates legs fast for conditioning; the spider crawl drives the knee all the way to the elbow and back, slower and deeper, which makes it a mobility-plus-core exercise rather than a cardio one. Both belong in a program; they just clock in for different shifts." },
        { q: "Why can't I keep my hips from sagging?", a: "Usually the plank base is missing, not the movement: the instructions start from a rigid prone position with arms bent to 90 degrees, and the crawl inherits whatever that position lacks. Build strict plank holds first — thirty clean seconds is the honest entry ticket — and the sag fixes itself within a few crawl sessions." },
        { q: "How far should the knee actually travel?", a: "As far forward as the instructions promise — toward the elbow, under the body, with hips still square to the floor. If the hip has to rotate open for the knee to arrive, the knee has traveled far enough for today; honest range grows with practice, and cheating it just moves the work out of the abs." },
      ],
      ar: [
        { q: "زحف العنكبوت أم متسلق الجبال — ما الفرق؟", a: "المدى والقصد. متسلق الجبال كما تصفه صفحته هنا يبدل الساقين بسرعة لأجل اللياقة، أما زحف العنكبوت فيدفع الركبة حتى المرفق ثم يعيدها، أبطأ وأعمق، وهذا يجعله تمرين مرونة وبطن لا تمرين كارديو. كلاهما يستحق مكانه في البرنامج، لكن لكل منهما نوبته المختلفة." },
        { q: "لماذا لا أستطيع منع هبوط وركي؟", a: "السبب غالبًا غياب أساس البلانك لا الحركة نفسها؛ فالتعليمات تبدأ من وضع انبطال صارم بذراعين مثنيتين 90 درجة، والزحف يرث كل ما ينقص تلك الوضعية. ابنِ وقفات بلانك صارمة أولًا — ثلاثون ثانية نظيفة هي تذكرة الدخول الأمينة — وسيُصلح الهبوط نفسه خلال جلسات زحف قليلة." },
        { q: "إلى أي مدى يجب أن تصل الركبة فعلًا؟", a: "إلى الأمام بمقدار ما تعد التعليمات — نحو المرفق، تحت الجسم، مع بقاء الوركين متوازيين مع الأرض. إذا اضطر الورك للانفتال لتصل الركبة فقد سافرت لأقصى مدى اليوم؛ فالمدى الأمين ينمو مع التمرين، وخداعه لا يفعل شيئًا سوى نقل العمل خارج البطن." },
      ],
    },
    links: [
      { hrefEn: "/blog/hiit-home-fat-burning-workout", hrefAr: "/ar/blog/hiit-home-workout-guide", labelEn: "HIIT home fat-burning workout", labelAr: "دليل التمرين المنزلي عالي الكثافة" },
      { hrefEn: "/exercises/mountain-climbers", hrefAr: "/ar/exercises/mountain-climbers", labelEn: "Mountain climbers — the faster sibling", labelAr: "متسلق الجبال — الشقيق الأسرع" },
      { hrefEn: "/programs/home-fat-loss-hiit", hrefAr: "/ar/programs/home-fat-loss-hiit", labelEn: "Home fat-loss HIIT program", labelAr: "برنامج حرق الدهون المنزلي عالي الكثافة" },
    ],
  },

  "plank": {
    intro: {
      en: "The plank is the most famous isometric in fitness and the quiet backbone of the core family on this site: the instructions are two steps long — forearms under shoulders, body straight, hold — and entire professions have been built on making it look complicated. What the movement actually does is teach the abs their everyday job: resisting the lower back from sagging and the hips from piking, without a single repet. It appears in every home program we publish because it needs nothing, scales from a beginner's twenty seconds to an athlete's weighted minutes, and pairs with every other movement in this library. The Arabic query space it serves — تمارين بطن للمبتدئين — is one of the largest in the site's keyword map.",
      ar: "البلانك أشهر تمرين ثابت في عالم اللياقة والعمود الفقري الصامت لعائلة البطن في هذا الموقع: تعليماته خطوتان فقط — ساعدان تحت الكتفين وجسم مستقيم وثبات — وبُنيت مهن كاملة على تصويره معقدًا. ما تفعله الحركة فعلًا هو تعليم البطن وظيفتها اليومية: مقاومة هبوط أسفل الظهر وصعود الوركين، بلا تكرار واحد. تظهر في كل برنامج منزلي ننشره لأنها لا تحتاج شيئًا، وتتدرج من عشرين ثانية للمبتدئ إلى دقائق موزونة للرياضي، وتقترن بكل حركة أخرى في هذه المكتبة. ومساحة الاستعلام التي تخدمها عربيًا — تمارين بطن للمبتدئين — من أكبر مساحات خريطة الكلمات في الموقع.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis runs the show isometrically — it is the cable holding the ribcage and pelvis from collapsing toward the floor, as the straight-body law in the instructions demands. The deeper transverse abdominis acts like a corset, bracing from the inside, while the obliques police the sides against any twist. The library lists no secondary muscles, and that is honest about the prime mover, but the shoulders, glutes and quads all work statically to keep the line straight — which is why a full-body tremble is normal in the final third of a hard hold.",
        mistakes: [
          { error: "Hips sagging until the lower back takes the load.", fix: "Tilt the pelvis slightly under — think of bringing your belt buckle toward your ribs — and the sag disappears; a mirror or a phone video beside you makes the line honest." },
          { error: "Piking the hips into a tent to make the hold easier.", fix: "The pike is the sag's cousin and just as dishonest — set the shoulders over the elbows, squeeze the glutes, and let the body be one flat line, not a mountain silhouette." },
          { error: "Head drooping down or craning up to watch the clock.", fix: "The neck is part of the line: eyes to the floor a foot ahead of your hands, and let someone else watch the clock." },
          { error: "Chasing minutes with sloppy form and calling it progress.", fix: "A 30-second plank that is genuinely flat beats a 90-second one that is negotiating with gravity — end the set when the line breaks, log the honest number, and watch it grow." },
        ],
        alternatives: "The family branches in every direction. The side plank shifts the work to the obliques and is the natural second exercise; the push-up-to-side-plank page combines both with a press; the dead bug trains the same bracing lying down for those who find floor supports uncomfortable; and the spider crawl, elsewhere in this library, makes the plank move. When holding gets easy, the long-lever versions — elbows further forward — or a weight plate resting on the mid-back do more than extra minutes ever will.",
        progression: "The ladder is beautifully boring: build a flat 20-second hold, then 30, then 45, then 60 — always ending sets on form failure, never on the clock's terms. The instructions themselves hand you the next rung: raise an arm or a leg to cut the support base and double the demand. After that, three-second longitudinal drags of the elbow, weight plates on the back, or the long-lever front plank finish the climb. Total beginners start on the knees with the same rigid line — the position is the lesson, and the knees are a legitimate classroom.",
        programming: "The standard dose is 3 sets of 20-60 seconds, three to five times a week — the abs recover quickly, and isometrics are gentle enough for near-daily practice. Use it as a finisher for the core, a warm-up primer before big lifts, or a daily movement snack between desk hours. In programs it pairs with dynamic abs work on the same day: a flexion move like the crunch plus the plank covers both halves of the muscle's job description, and our home core program is built around exactly that pairing.",
        safety: "The wrists and shoulders are the usual complainers — forearms flat on the floor, as the instructions prescribe, already removes the bent-wrist problem the push-up family suffers. Lower-back pain during a hold is almost always the sag in disguise: stop the set, reset the pelvis, and shorten holds until the line holds itself. Pregnant trainees commonly switch to incline planks (hands on a bench) as the belly grows — a legitimate scaling, not a defeat.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تقود المشهد ثباتيًا؛ فهي الكابل الذي يمنع القفص الصدري والحوض من الانهيار نحو الأرض كما يفرض قانون الجسم المستقيم في التعليمات. والمستعرضة الأعمق تعمل كمشدة تشد من الداخل، بينما تحرس المائلتان الجانبين ضد أي التواءة. والمكتبة لا تسجل عضلات مساعدة، وهذا صادق بشأن المحرك الأساسي، لكن الأكتاف والألويات والفخذ الأمامي تعمل كلها سكونيًا للحفاظ على الخط المستقيم — ولهذا يعتبر الارتجاف لكامل الجسم طبيعيًا في الثلث الأخير من ثبات صعب.",
        mistakes: [
          { error: "هبوط الوركين حتى يتولى أسفل الظهر الحمل.", fix: "أمل الحوض قليلًا للأسفل — تخيل شد أبازيم حزامك نحو أضلاعك — فيختفي الهبوط؛ والمرآة أو فيديو الهاتف بجانبك يجعل الخط أمينًا." },
          { error: "رفع الوركين كالخيمة لتسهيل الثبات.", fix: "الخيمة ابنة عم الهبوط وبنفس القدر من الخيانة — ضع الكتفين فوق المرفقين، واعصر الألويات، ودع الجسم خطًا مستويًا واحدًا لا ظل جبل." },
          { error: "إسدال الرأس أو رفعه لمراقبة الساعة.", fix: "الرقبة جزء من الخط: العينان إلى الأرض عند قدم أمام يديك، ودع غيرك يراقب الساعة." },
          { error: "مطاردة الدقائق بوضعية مهملة وتسميتها تقدمًا.", fix: "بلانك ثلاثين ثانية مستوٍ فعلًا يغلب بلانك تسعين ثانية تساوم الجاذبية — أنهِ المجموعة حين ينكسر الخط، وسجّل الرقم الأمين، وراقبه ينمو." },
        ],
        alternatives: "تتفرع العائلة في كل اتجاه. البلانك الجانبي ينقل العمل إلى المائلتين وهو التمرين الثاني الطبيعي، وصفحة الضغط إلى البلانك الجانبي تجمع بينهما مع دفعة، والحشرة الميتة تدرّب الشد نفسه مستلقيًا لمن تزعجهم الأسنادات الأرضية، وزحف العنكبوت في مكان آخر من هذه المكتبة يجعل البلانك يتحرك. وحين يصبح الثبات سهلًا، تقدم النسخ طويلة الرافعة — مرفقان أبعد أمامًا — أو قرص وزن على منتصف الظهر أكثر مما تقدمه الدقائق الإضافية أبدًا.",
        progression: "السلم ممل بجمال: ابنِ ثباتًا مستويًا عشرين ثانية ثم ثلاثين ثم خمسًا وأربعين ثم ستين — مع إنهاء المجموعات دائمًا عند فشل الوضعية لا بشروط الساعة. والتعليمات نفسها تناولك الدرجة التالية: ارفع ذراعًا أو ساقًا لتقليص قاعدة السند ومضاعفة المطلب. وبعد ذلك يكتمل التسلق بسحبات مرفق طولية بثلاث ثوان، أو أقراص وزن على الظهر، أو البلانك الأمامي طويل الرافعة. أما المبتدئون تمامًا فيبدؤون على الركبتين بنفس الخط الصارم؛ فالوضعية هي الدرس، والركبتان قاعة درس مشروعة.",
        programming: "الجرعة المعتادة ثلاث مجموعات من 20-60 ثانية، ثلاث إلى خمس مرات أسبوعيًا؛ فالبطن يتعافى سريعًا، والتمارين الثابتة لطيفة بما يكفي لممارسة شبه يومية. استخدمه كختام لعضلات البطن، أو كتشغيل أولي قبل الرفعات الكبيرة، أو وجبة حركة يومية بين ساعات المكتب. وفي البرامج يقترن بحركة بطن ديناميكية في اليوم نفسه: حركة انثناء مثل الكرانش مع البلانك تغطيان نصفي وصف وظيفة العضلة، وبرنامج البطن المنزلي لدينا مبني حول هذا الاقتران بالذات.",
        safety: "الرسغان والكتفان هما الشاكيان المعتادان — والساعدان مسطحان على الأرض كما تصف التعليمات يزيلان مشكلة الرسغ المثني التي تعاني منها عائلة الضغط. وآلام أسفل الظهر أثناء الثبات هي غالبًا الهبوط متنكرًا: أوقف المجموعة، وأعد ضبط الحوض، وقصّر المدد حتى يثبت الخط وحده. وتنتقل المتدربات الحوامل عادة إلى بلانك مائل — يدان على بنش — مع نمول البطن، وهو تدرج مشروع لا هزيمة.",
      },
    },
    faq: {
      en: [
        { q: "How long should a beginner hold a plank?", a: "Start with 20 honest seconds — flat line, glutes squeezed, breathing steady — and extend by five to ten seconds per week. The instructions' own difficulty lever is raising an arm or leg; most beginners reach a strict 60-second hold within two months, and that is the moment to change the exercise rather than chase three boring minutes." },
        { q: "Is the plank enough for abs on its own?", a: "It covers half the job. The plank trains the abs to resist extension — one of the muscle's two main tasks — while movements like the crunch or hanging leg raise train the other half, flexion. A program that pairs one of each, a few times a week, has the core covered; our core specialization program is arranged around exactly this logic." },
        { q: "Why do I shake so much near the end of a hold?", a: "Shaking is the nervous system recruiting muscle fibers it rarely talks to — it is normal, it fades as the position becomes familiar, and it is not a reason to stop. Stop when the line breaks: hips sagging or piking means the working muscles have clocked out and the joints are covering the shift." },
      ],
      ar: [
        { q: "كم يثبت المبتدئ على البلانك؟", a: "ابدأ بعشرين ثانية أمينة — خط مستوٍ وألويات معصورة وتنفس ثابت — وزد خمس إلى عشر ثوان أسبوعيًا. ذراع الصعوبة في التعليمات نفسها هو رفع ذراع أو ساق؛ ويصل أغلب المبتدئين إلى ثبات صارم مدته ستون ثانية خلال شهرين، وهذه لحظة تغيير التمرين لا مطاردة ثلاث دقائق مملة." },
        { q: "هل يكفي البلانك وحده لبناء البطن؟", a: "يغطي نصف الوظيفة. فالبلانك يدرّب البطن على مقاومة الاستطالة — إحدى مهمتيها الرئيسيتين — بينما تدرّب حركات مثل الكرانش أو رفع الساقين معلقًا النصف الآخر: الانثناء. برنامج يجمع واحدة من كل عائلة مرات قليلة أسبوعيًا يكون قد غطى المركز، وبرنامج تخصص البطن لدينا مرتب حول هذا المنطق بالضبط." },
        { q: "لماذا أرتجف كثيرًا قرب نهاية الثبات؟", a: "الارتجاف هو الجهاز العصبي يجند ألياف عضلية قليلة الكلام معه؛ وهو طبيعي، ويتلاشى مع ألفة الوضعية، وليس سببًا للتوقف. توقف حين ينكسر الخط: هبوط الوركين أو صعودهما يعني أن العضلات العاملة غادرت والأنسجة المؤقتة تسد النوبة." },
      ],
    },
    links: [
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-gain-8-weeks", labelEn: "No-equipment home muscle guide", labelAr: "بناء العضلات منزليًا في 8 أسابيع" },
      { hrefEn: "/exercises/push-up-to-side-plank", hrefAr: "/ar/exercises/push-up-to-side-plank", labelEn: "Push-up to side plank — the moving upgrade", labelAr: "الضغط إلى البلانك الجانبي — الترقية المتحركة" },
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص البطن المنزلي" },
    ],
  },

  "russian-twist": {
    intro: {
      en: "The Russian twist is the obliques' appointment card. Sitting in the V-position the instructions describe — feet anchored, torso elevated, arms extended — you rotate the torso side to side while everything below the ribs argues it would rather stay still. The library grades it intermediate, and that is fair: the position is a held crunch, and rotation on top of a hold is a coordination tax most floor abs work never charges. It earned its top-50 place on demand — the query space around twists, waist and obliques is large in both languages this site serves — and it rewards honest loading with a waist that rotates the way sport actually demands: from the ribcage, not the arms.",
      ar: "اللف الروسي هو بطاقة موعد العضلات المائلة. جالسًا في وضع الڤي الذي تصفه التعليمات — قدمان مثبتتان وجذع مرفوع وذراعان ممدودتان — تدور بجذعك يمينًا ويسارًا بينما يجادل كل ما تحت الأضلاع أنه يفضل البقاء ساكنًا. تصنفه المكتبة ضمن المتوسط، وهذا عادل: فالوضعية كرانش مثبت، والدوران فوق الثبات ضريبة تناسق لا تفرضها معظم تمارين البطن الأرضية أبدًا. وقد كسب مكانه في الخمسين الأولى بالطلب؛ فمساحة الاستعلام حول اللف والخصر والمائلات كبيرة في اللغتين اللتين يخدمهما الموقع، وهو يكافئ التحميل الأمين بخصر يدور بالطريقة التي تطلبها الرياضة فعلًا: من القفص الصدري لا من الذراعين.",
    },
    sections: {
      en: {
        muscles: "The obliques — the diagonal walls framing the rectus abdominis — own this movement: they rotate the ribcage against a stable pelvis and then brake it at each end of the twist. The library's secondary list adds the lower back, whose erectors co-contract to hold the V-position spine tall instead of rounded. The rectus abdominis works the whole set too, isometrically holding the crunch position the rotation rides on. What should NOT be working: the arms. If the shoulders burn, the arms are swinging the weight and the obliques are watching.",
        mistakes: [
          { error: "Swinging the arms side to side while the ribcage stays square.", fix: "Rotate from the ribs — lead with the breastbone, let the hands follow; a fist-sized gap between chin and chest keeps the twist honest." },
          { error: "Rounding into a slouch as the set wears on.", fix: "Grow tall through the spine at every turn — the V-shape in the instructions is held by the erectors, and slouching quietly fires them and reassigns the work." },
          { error: "Letting the feet dance off the anchor.", fix: "The instructions are explicit: feet under something immovable or a partner's hands. Free-floating feet convert the twist into a balance act with the obliques as spectators." },
          { error: "Rushing turns at double speed to reach the count.", fix: "One second per side, a beat of squeeze at each end — rotation is the exercise; speed is just the theft of it." },
        ],
        alternatives: "Loaded or unloaded, the family serves every level. The cable russian twist adds stack-loaded resistance through the same arc; the plate twist is its home cousin with any flat weight. If the V-position aggravates the lower back, the seated barbell twist keeps the torso more upright, and lying rotational moves — the dead bug with a reach, for example — train the same obliques with the spine fully supported. The side plank is the family's isometric sibling: same muscles, opposite job.",
        progression: "The first variable is foot contact: anchored feet make the hold honest, and lifting them — the true V — doubles the difficulty when you are ready. Load comes second: a small plate held at the chest, then extended with the arms, then a medicine ball or dumbbell. Tempo is the third dial — three seconds per rotation with a squeeze at the end range turns a light weight into serious work. The instructions describe breathing out on each twist; master that timing before touching any of the other dials.",
        programming: "Standard dosing is 3 sets of 10-20 total turns (5-10 per side), resting 45-60 seconds, two or three times a week at the end of a session. It slots beside the plank in a core block: the plank resists rotation, the twist produces it — the obliques' full job description covered in two exercises. On throwing, swinging or combat-sport programs it earns earlier slots and more volume, because rotation against load is literally the sport's skill.",
        safety: "The spine's story here is rotation under load, so respect earns interest: keep the pelvis anchored, rotate from the ribcage, and never chase range the torso will not give honestly — forced end-range twisting with weight is the classic recipe for disc irritation. Anyone with active lower-back pain should keep the range short and the feet down, or move to the supported-lying alternatives until symptoms settle. Neck strain means the chin is leading the twist; the chin loses that job immediately.",
      },
      ar: {
        muscles: "العضلات المائلة — الجدران القطرية المؤطرة للمستقيمة البطنية — تملك هذه الحركة: فهي تدير القفص الصدري فوق حوض ثابت ثم تكبحه عند كل طرف من اللفة. وقائمة المكتبة للمساعدة تضيف أسفل الظهر، الذي تتحد باسطاته لرفع عمود وضعية الڤي بدلًا من تقويسه. والمستقيمة البطنية تعمل أيضًا طوال المجموعة، ثباتيًا تحمل وضعية الكرانش التي يركب عليها الدوران. وما لا ينبغي أن يعمل: الذراعان. إذا احترقت الكتفان فالذراعان تتأرجحان بالوزن والمائلات تتفرجان.",
        mistakes: [
          { error: "تأرجح الذراعين يمينًا ويسارًا بينما يبقى القفص الصدري مواجهًا للأمام.", fix: "دُر من الأضلاع — قِد بعظمة القص ودع اليدين تتبعان؛ فجوة بحجم قبضة بين الذقن والصدر تحفظ للفة أمانتها." },
          { error: "التقوس في انحناء متثاقل مع تقدم المجموعة.", fix: "امتد طويلًا عبر العمود عند كل لفة؛ فشكل الڤي في التعليمات تحمله الباسطات، والترهل يطردها بهدوء ويعيد توزيع العمل." },
          { error: "ترك القدمين ترقصان بعيدًا عن المثبت.", fix: "التعليمات صريحة: القدمان تحت شيء ثابت أو كفي شريك. والقدمان الطليقتان تحولان اللفة إلى لعبة توازن والمائلات متفرجة." },
          { error: "استعجال اللفات بسرعة مضاعفة للوصول إلى العدد.", fix: "ثانية لكل جهة، مع عصرة عند كل طرف؛ فالدوران هو التمرين، والسرعة مجرد سرقته." },
        ],
        alternatives: "محملة أو فارغة، تخدم العائلة كل مستوى. اللف الروسي بالكيبل يضيف مقاومة رفّ معلقة عبر نفس القوس، ولففة القرص قريبتها المنزلية بأي وزن مسطح. وإذا أغاض وضع الڤي أسفل ظهرك فاللف الجالس بالبار يبقي الجذع أكثر انتصابًا، والحركات الدورانية المستلقية — الحشرة الميتة مع مدّ — تدرّب المائلتين نفسيهما وعمود مدعوم تمامًا. والبلانك الجانبي هو الشقيق الثابت للعائلة: نفس العضلات ووظيفة معاكسة.",
        progression: "المتغير الأول هو تلامس القدمين: القدمان المثبتتان تجعلان الثبات أمينًا، ورفعهما — الڤي الحقيقي — يضاعف الصعوبة حين تكون جاهزًا. يأتي الحمل ثانيًا: قرص صغير عند الصدر، ثم ممدود مع الذراعين، ثم كرة طبية أو دمبل. والإيقاع هو القرص الثالث — ثلاث ثوان لكل لفة مع عصرة عند أقصى مدى تحول وزنًا خفيفًا إلى عمل جاد. تصف التعليمات الزفير مع كل لفة؛ أتقن هذا التوقيت قبل لمس أي قرص آخر.",
        programming: "الجرعة القياسية ثلاث مجموعات من 10-20 لفة إجمالية (5-10 لكل جهة) براحة 45-60 ثانية، مرتين أو ثلاثًا أسبوعيًا في نهاية الجلسة. ويستقر بجانب البلانك في كتلة البطن: البلانك يقاوم الدوران واللفة تنتجه، وبذلك يكتمل وصف وظيفة المائلتين في تمرينين. وفي برامج الرمي والمضرب والقتال يستحق خانات أبكر وحجمًا أكبر، لأن الدوران ضد الحمل هو حرفيًا مهارة الرياضة.",
        safety: "قصة العمود هنا دوران تحت حمل، فالاحترام يدر فوائد: ثبّت الحوض، ودُر من القفص الصدري، ولا تطارد أبدًا مدى لن يمنحه الجذع بأمانة؛ فاللف القسري عند أقصى المدى بوزن هو الوصفة الكلاسيكية لتهييج الغضاريف. ومن لديه ألم نشط في أسفل الظهر فليبقِ المدى قصيرًا والقدمين مثبتتين، أو ينتقل إلى البدائل المستلقية المدعومة حتى تهدأ الأعراض. وإجهاد الرقبة يعني أن الذقن تقود اللفة؛ وتفقد الذقن هذه الوظيفة فورًا.",
      },
    },
    faq: {
      en: [
        { q: "Do Russian twists slim the waist — or widen it?", a: "Neither, honestly: spot-shaping is not how fat works, and the obliques are not a muscle group that grows dramatically from twisting a few kilos. Twists strengthen rotation; the waist's visible size is decided by the fat layer above the muscle, which is a nutrition job — our calorie and macro tools handle that side." },
        { q: "Should my heels stay on the floor?", a: "For most lifters, yes — anchored or lightly touching, as the instructions allow, keeps the pelvis honest and the rotation coming from the ribcage. Lifting the feet into the full V is a legitimate progression once the anchored version stops challenging you, but it is a difficulty upgrade, not the default form." },
        { q: "What weight should a beginner use?", a: "None at first — bodyweight twists for the first few sessions teach the ribs-lead-arms-follow pattern. When that feels dialed in, a 2-5 kg plate or medicine ball is the standard starting load, and the weight is right when the last two turns per side are slow but clean." },
      ],
      ar: [
        { q: "هل ينحّف اللف الروسي الخصر أم يوسّعه؟", a: "لا هذا ولا ذاك بصدق: فالنحت الموضعي ليس طريقة عمل الدهون، والمائلات ليست مجموعة تنمو بشكل درامي من لف بضعة كيلوجرامات. اللفة تقوي الدوران؛ وحجم الخصر الظاهر تقرره طبقة الدهون فوق العضلة، وهي مهمة تغذية تتولى أدوات السعرات والماكروز لدينا جانبها." },
        { q: "هل تبقى الكعبان على الأرض؟", a: "لأغلب المتدربين نعم — مثبتتين أو ملامستين بخفة كما تجيز التعليمات — فهذا يبقي الحوض أمينًا والدوران صادرًا من القفص الصدري. ورفع القدمين إلى الڤي الكامل تدرج مشروع حين تتوقف النسخة المثبتة عن تحديك، لكنه ترقية صعوبة لا الشكل الافتراضي." },
        { q: "ما الوزن المناسب للمبتدئ؟", a: "لا وزن أول الأمر؛ فلفات وزن الجسم في الجلسات الأولى تعلم نمط الأضلاع تقود والذراعان تتبعان. وحين يستقر الإحساس، يصبح قرص 2-5 كجم أو كرة طبية نقطة البداية المعتادة، والوزن صحيح حين تصبح آخر لفتين لكل جهة بطيئتين لكن نظيفتين." },
      ],
    },
    links: [
      { hrefEn: "/blog/combine-hiit-strength-fat-loss-guide", hrefAr: "/ar/blog/hiit-strength-training-fat-loss-guide", labelEn: "Combine HIIT and strength for fat loss", labelAr: "دمج التمارين عالية الكثافة والقوة لخسارة الدهون" },
      { hrefEn: "/exercises/cable-crunch", hrefAr: "/ar/exercises/cable-crunch", labelEn: "Cable crunch — load the flexion half", labelAr: "الكرانش بالكيبل — حمّل نصف الانثناء" },
      { hrefEn: "/tools/calorie-calculator", hrefAr: "/ar/tools/calorie-calculator", labelEn: "The waist's other half — calorie calculator", labelAr: "النصف الآخر للخصر — حاسبة السعرات" },
    ],
  },

  "hanging-leg-raise": {
    intro: {
      en: "The hanging leg raise is the advanced diploma of the abs family, and the library grades it exactly that way. Hanging from a bar with arms extended, as the instructions describe, you raise straight legs until they meet the torso at ninety degrees — and the data page lists no secondary muscles, because the abs do all the work the moment the movement is done right. The challenge is not strength alone but sequencing: the pelvis must curl first, the legs merely follow, and that distinction separates a genuine hanging leg raise from an expensive swing. It anchors the top of this site's abs-progression ladder for a reason — every easier movement on the way up is building the pieces this one assembles.",
      ar: "رفع الساقين معلقًا هو الدبلوم المتقدم لعائلة البطن، والمكتبة تصنفه هكذا بالضبط. فمعلقًا من بار بذراعين ممدودتين كما تصف التعليمات، ترفع ساقين مستقيمتين حتى تلتقيا بالجذع عند تسعين درجة — وصفحة البيانات لا تسجل عضلات مساعدة، لأن البطن يتولى العمل كله لحظة أداء الحركة بطريقة صحيحة. التحدي ليس القوة وحدها بل التتابع: يجب أن يلتف الحوض أولًا وتتبع الساقان فحسب، وهذا التمييز يفصل رفع ساقين حقيقيًا عن أرجحة مكلفة. وهو يرسو في قمة سلم تدرج البطن في هذا الموقع لسبب وجيه: فكل حركة أسهل في الطريق تبني القطع التي تجمعها هذه الحركة.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis, especially its lower fibers, is the prime mover and the library's no-secondaries label is a clue: when the pelvis posteriorly tilts — rolling under, as the starting position describes — the abs are the only muscle that can do it. The hip flexors will happily contribute if you let the legs lead, which is the movement's central battle. Meanwhile the forearms and grip fight gravity the whole set, the lats brace the shoulder girdle so the body does not swing, and the quads hold the knees locked — silent work from a long cast, with one muscle billed above the title.",
        mistakes: [
          { error: "Swinging the legs up with momentum and calling it a rep.", fix: "Dead hangs kill momentum: pause two seconds at the bottom of every rep, initiate from the pelvis, and accept the lower, cleaner range as the real one." },
          { error: "Letting the body rock so the bar becomes a pendulum pivot.", fix: "Squeeze the lats and press the shoulders down away from the ears — a hollow-body hang is the antidote to the swing, and regripping with a thumb-around grip steadies it further." },
          { error: "Bending the knees to make the top easier.", fix: "Bent knees are the official regression, not a cheat inside the straight-leg version — choose one honestly: strict straight legs for fewer reps, or knee raises as the logged progression." },
          { error: "Dropping the legs fast and yanking the spine at the bottom.", fix: "Lower for two to three seconds with the abs still braced; the eccentric is where the lower fibers earn their name, and a free fall taxes the discs instead of the muscle." },
        ],
        alternatives: "The ladder below this movement is long and well-lit. Lying leg raises train the same pelvic curl flat on the floor; the flat-bench lying leg raise adds range with no grip demand; the captain's-chair version removes the grip bottleneck entirely while keeping the hip-flexion pattern. If grip fails before abs do, lifting straps are a legitimate tool — the library's deadlift page makes the same allowance. And for the other end of the abs' job, the plank family waits on the floor.",
        progression: "The sequence is canonical: knee raises first — hanging or on the captain's chair — until 10 strict reps, then knee raises with a two-second hold at the top, then partial straight-leg raises to forty-five degrees, then the full ninety-degree version this page teaches. When strict full reps reach 12-15, the toes-to-bar progression begins — and the instructions' own 90-degree checkpoint is the honest gate on the way. Advanced trainees add ankle weights or slow eccentrics; both change the exercise more than they look like they would.",
        programming: "Dose it like a strength skill, not a burnout: 3-4 sets of 6-12 strict reps with 90-120 seconds of rest, at the START of the core block when the grip and nervous system are fresh — after heavy pulling days the grip is already spent and becomes the limiting factor. Twice a week is the sweet spot for most; hanging work taxes the shoulder connective tissue more than trainees expect at first. Pair it with a flexion-floor move and an anti-extension move and the core program is complete.",
        safety: "The shoulders and the lower back split the caution. Unaccustomed shoulders need weeks of plain dead hangs before loaded raising — build the hang time first, the legs later. At the bottom of each rep, the lumbar spine takes a stretch under load if the legs drop uncontrolled; the controlled-lower cue is not style advice, it is disc insurance. And grip failure mid-set means falling, not failing — chalk up, use straps when needed, and end the set when the hands say so.",
      },
      ar: {
        muscles: "المستقيمة البطنية، وأليافها السفلية خاصة، هي المحرك الأساسي، ووسم المكتبة بلا مساعدة دليل: فحين يميل الحوض خلفيًا — يتدحرج للأسفل كما يصف وضع البداية — تكون البطن العضلة الوحيدة القادرة على ذلك. وستسهم مثنيات الورك بكل سرور إذا تركت الساقين تقودان، وهذه معركة الحركة المركزية. وفي الأثناء يقاوم الساعمان والقبضة الجاذبية طوال المجموعة، وتشد العضلة الجنبية حزام الكتف كي لا يتأرجح الجسم، وتمسك الفخذ الأمامي الركبتين مقفلتين — عمل صامت من طاقم طويل، وعضلة واحدة فوق العنوان.",
        mistakes: [
          { error: "أرجحة الساقين للأعلى بالزخم وتسميته تكرارًا.", fix: "التعليق الميت يقتل الزخم: توقف ثانيتين في قاع كل تكرار، وابدأ من الحوض، واقبل المدى الأدنى الأنظف بوصفه المدى الحقيقي." },
          { error: "ترك الجسم يتأرجح حتى يصبح البار محور بندول.", fix: "اعصر الجنبية واضغط بالكتفين مبتعدًا عن الأذنين؛ فالتعليق المجوف ترياق الأرجحة، والقبضة بإبهام كامل تثبته أكثر." },
          { error: "ثني الركبتين لتسهيل القمة.", fix: "الركبتان المثنيتان تراجع رسمي لا غش داخل نسخة الساق المستقيمة؛ فاختر واحدًا بأمانة: ساقان مستقيمتان صارمتان بتكرارات أقل، أو رفع ركبتين بوصفه التدرج المسجل." },
          { error: "إسقاط الساقين سريعًا وشد العمود الفقري في القاع.", fix: "انزل في ثانيتين إلى ثلاث والبطن ما يزال مشدودًا؛ فالمرحلة السالبة هي حيث تكسب الألياف السفلية اسمها، والسقوط الحر يفرض الضرائب على الأقراص بدل العضلة." },
        ],
        alternatives: "السلم تحت هذه الحركة طويل ومضاء جيدًا. رفع الساقين مستلقيًا يدرّب اللف الحوضي نفسه مسطحًا على الأرض، ورفع الساقين على بنش مسطح يضيف مدى بلا مطلب قبضة، ونسخة كرسي الكابتن تزيل عنق زجاجة القبضة كليًا مع إبقاء نمط ثني الورك. وإذا فشلت القبضة قبل البطن فأحزمة الرفع أداة مشروعة — وصفحة الديدلفت في مكتبتنا تجيز الشيء نفسه. وفي الطرف الآخر من وظيفة البطن تنتظر عائلة البلانك على الأرض.",
        progression: "التتابع قانوني معروف: رفع الركبتين أولًا — معلقًا أو على كرسي الكابتن — حتى 10 تكرارات صارمة، ثم رفع ركبتين بتثبيت ثانيتين في القمة، ثم رفع ساق مستقيمة جزئيًا إلى خمس وأربعين درجة، ثم النسخة الكاملة ذات التسعين درجة التي تعلمها هذه الصفحة. وحين تبلغ التكرارات الصارمة الكاملة 12-15 يبدأ تدرج أصابع القدم إلى البار، ونقطة التحقق ذات التسعين درجة في التعليمات هي البوابة الأمينة في الطريق. ويضيف المتقدمون أثقال كاحل أو نزولًا بطيئًا؛ وكلاهما يغير التمرين أكثر مما يبدو.",
        programming: "اجرعه كعمل مهاري قوي لا كإحراق نهائي: 3-4 مجموعات من 6-12 تكرارًا صارمًا براحة 90-120 ثانية، في بداية كتلة البطن والقبضة والجهاز العصبي نضجان؛ فبعد أيام سحب ثقيلة تكون القبضة قد صرفت وتصبح العامل المحدد. مرتان أسبوعيًا هي النقطة المثلى لمعظم الناس؛ فالعمل المعلق يفرض على أنسجة الكتف أكثر مما يتوقع المتدربون أول الأمر. اقرنه بحركة انثناء أرضية وحركة مقاومة استطالة فيكتمل برنامج المركز.",
        safety: "الكتفان وأسفل الظهر يتقاسمان الحذر. فالأكتاف غير المتعلمة تحتاج أسابيع من تعليق الموت الصافي قبل أي رفع محمل — ابنِ زمن التعليق أولًا والساقين لاحقًا. وفي قاع كل تكرار يتحمل القطني تمددًا تحت حمل إن هبطت الساقان بلا سيطرة؛ فتلميح النزول المتحكم ليس نصيحة أناقة بل تأمين للأقراص. وفشل القبضة في منتصف المجموعة يعني سقوطًا لا فشلًا — استخدم المغناطيس، وأحزمة عند الحاجة، وأنهِ المجموعة حين تقول اليدان كفى.",
      },
    },
    faq: {
      en: [
        { q: "My grip gives out before my abs — what should I do?", a: "That is the standard bottleneck and the library's deadlift advice applies here: straps are a legitimate fix, and so is rotating to the captain's-chair version on grip-heavy days. A cheaper long-term fix is building plain dead-hang time — most trainees double their usable hang within a month of three 20-second hangs after each session." },
        { q: "Should my legs stay perfectly straight?", a: "The instructions describe straight legs with the pelvis rolling slightly back, and that is the target form — but a slight knee bend is an honest intermediate stage on the way, not a failure. The dishonest version is swinging; a controlled raise with soft knees still trains the abs hard and can be logged as its own progression." },
        { q: "Why do my lower back and not my abs feel this?", a: "Legs leading and pelvis following — the classic sequence inversion. The cue that fixes it: start every rep by curling the tailbone up and forward as if trying to point it at the bar, and only then let the legs rise. If the lower-back feeling persists, drop to lying raises for two weeks and rebuild the pattern." },
      ],
      ar: [
        { q: "قبضتي تنفد قبل بطني — ما الحل؟", a: "هذا هو عنق الزجاجة المعتاد، وينطبق هنا نصيب مكتبتنا من الديدلفت: الأحزمة حل مشروع، وكذلك التدوير إلى نسخة كرسي الكابتن في أيام القبضة المزدحمة. والحل الأرخص بعيد المدى بناء زمن تعليق صافٍ؛ فأغلب المتدربين يضاعفون تعليقهم المفيد خلال شهر من ثلاث تعليقات بعشرين ثانية بعد كل جلسة." },
        { q: "هل تبقى ساقاي مستقيمتين تمامًا؟", a: "تصف التعليمات ساقين مستقيمتين مع تدحرج الحوض قليلًا للخلف، وهذا هو الشكل المستهدف — لكن انثناء ركبة خفيفًا مرحلة وسطى أمينة في الطريق لا فشلًا. النسخة غير الأمينة هي الأرجحة؛ فرفع متحكم بركبتين لينتين يظل يدرّب البطن بجد ويسجل تدرجًا مستقلًا." },
        { q: "لماذا أشعر بأسفل ظهري لا ببطني؟", a: "الساقان تقودان والحوض يتبع — انعكاس التتابع الكلاسيكي. والإشارة التي تصلحه: ابدأ كل تكرار بلف عظمة الذيل لأعلى وللأمام كأنك تحاول توجيهها نحو البار، وعندها فقط دع الساقين ترتفعان. وإذا استمر إحساس أسفل الظهر فانزل إلى الرفع المستلقي أسبوعين وأعد بناء النمط." },
      ],
    },
    links: [
      { hrefEn: "/blog/progressive-overload-no-weight", hrefAr: "/ar/blog/progressive-overload-without-weights-guide", labelEn: "Progressive overload without weights", labelAr: "التدرج بالحمل بدون أوزان" },
      { hrefEn: "/exercises/crunches", hrefAr: "/ar/exercises/crunches", labelEn: "Crunches — the flexion foundation", labelAr: "الكرانش — أساس الانثناء" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log your core progress — free tracker", labelAr: "سجل تقدم بطنك — المتتبع المجاني" },
    ],
  },
};
