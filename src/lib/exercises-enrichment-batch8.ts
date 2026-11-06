/**
 * EXERCISES-ENRICHMENT — BATCH 8 (exercises 37-41 of 50).
 *
 * The conditioning-flavored legs (mountain climbers, flutter kicks — the
 * movements the Arabic fat-loss queries train through), the Romanian
 * deadlift (the hinge's hamstring head), and the biceps family opens with
 * its two flags: the barbell curl and the dumbbell bicep curl.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_8: Record<string, ExerciseEnrichment> = {
  "mountain-climbers": {
    intro: {
      en: "Mountain climbers are the plank that learned to run: from the push-up position the instructions describe, the knees drive toward the chest in an alternating sprint, twenty to thirty seconds at a time, hips held level the whole ride. The library bills the quads primary with chest, hamstrings and shoulders as seconds — an honest accounting for what is really a full-body conditioning move wearing a leg costume. It anchors home fat-loss training for good reason: no equipment, no floor space beyond a mat, and a heart rate that answers within ten seconds. Our HIIT programs book it in nearly every round.",
      ar: "متسلق الجبال هو البلانك الذي تعلم الجري: من وضع الضغط الذي تصفه التعليمات، تُقاد الركبتان نحو الصدر في عدو متناوب من عشرين إلى ثلاثين ثانية، والوركان محفوظان مستويين طوال الرحلة. تسجل المكتبة الفخذ الأمامي أساسيًا مع الصدر وأوتار الفخذ والأكتاف مساعدة — محاسبة أمينة لما هو في الحقيقة حركة لياقة لكامل الجسم بزيّ ساق. وترسو في قلب خسارة الدهون المنزلية وسبب: لا معدات ولا مساحة أرض تتجاوز بساطًا، ونبض قلب يجيب خلال عشر ثوان. وبرامجنا عالية الكثافة تحجزه في كل جولة تقريبًا.",
    },
    sections: {
      en: {
        muscles: "The quads drive each knee lift — the primary billing — while the hip flexors accelerate the alternation and the glutes and hamstrings of the extended leg hold the body's line. The pressing half of the position loads the chest, shoulders and triceps isometrically, exactly as the library's secondary list records, and the abs run the show underneath: anti-extension against the hips' sag and anti-rotation against every knee drive's twist. The result is the rare movement that trains the legs' sprint pattern and the trunk's brace in the same breath — the reason conditioning coaches keep it on speed dial.",
        mistakes: [
          { error: "Hips riding up into a pike as fatigue arrives.", fix: "The hips stay level with the shoulders — the instructions' sprint happens under a plank, not on a hill; drop the knees' height before dropping the hips' line." },
          { error: "Bouncing the toes between steps like a drummer.", fix: "Each foot lands and departs deliberately — the instructions call for a controlled alternation, and the tap-dance version burns energy everywhere except the working muscles." },
          { error: "Hands creeping forward until the shoulders lag behind the wrists.", fix: "Stack the wrists under the shoulders and keep them there — the geometry is a moving plank, and the creep converts it into a decline press no one asked for." },
          { error: "Holding the breath through the whole interval.", fix: "The movement runs on a rhythm — exhale on each drive or find a two-count breathing pattern; a twenty-second hold of air ends the set for the wrong reasons." },
        ],
        alternatives: "The spider crawl — its page sits in this library — drives the knee to the elbow for a deeper rotational demand at a slower pace. Plank jacks swap the knee drive for a jumping jack of the legs; high knees deliver the same sprint pattern standing. Slow-motion climbers with a three-second hold per knee make a strength move of the pattern. Every variant keeps the family's promise: the plank's brace plus the legs' engine, in one package no equipment can improve.",
        progression: "The first dial is time: three clean rounds of twenty seconds with forty seconds of rest, then thirty-second rounds, then the same rounds with knees driving higher — height before speed, always. The tempo ladder comes next: deliberate climbers at one rep per second for control, then true sprint pace for intervals. Advanced trainees add instability (feet on a slide surface for sliding climbers) or load the pattern's cousins instead — the progression notes end where the HIIT programs' programming begins.",
        programming: "Book it inside a conditioning block or a warm-up: 3-4 rounds of 20-30 seconds of work with 30-60 seconds of rest, two to four times a week. As a warm-up primer it switches on the trunk and shoulders in one move before training; inside a HIIT circuit it is the leg-engine station between strength moves — our home fat-loss program sequences it exactly so. Because the position loads the wrists and shoulders, it earns a place after pressing work rather than before it in most sessions.",
        safety: "The wrists and the lower back share the caution file: the moving plank loads both for the whole interval. Warm the wrists before climbing sessions, and end the round when the hips sag rather than when the clock does — the sag hands the spine the job the abs just quit. Slippery floors are the one environmental hazard: a mat under the hands keeps the sprint from becoming a slide, and shoulder history decides whether the elevated-hands version is the wiser starting line.",
      },
      ar: {
        muscles: "يقود الفخذ الأمامي كل رفعة ركبة — الفاتورة الأساسية — بينما تسرّع مثنيات الورك التناوب وتحمل ألويات الساق الممدودة وأوتارها خط الجسم. ونصف الضغط من الوضعية يحمل الصدر والأكتاف والترايسبس ثباتيًا، تمامًا كما تسجل قائمة المكتبة المساعدة، والبطن يدير العرض من الأسفل: مقاومة استطالة ضد هبوط الوركين ومقاومة دوران ضد لفّة كل ركبة. والنتيجة حركة نادرة تدرّب نمط عدو الساقين وشدّ الجذع في نفس النفس — وهذا سبب إبقائها مدربو اللياقة على الاتصال السريع.",
        mistakes: [
          { error: "ارتفاع الوركين إلى وضع الخيمة مع وصول التعب.", fix: "يبقى الوركان بمستوى الكتفين — فالعدو في التعليمات يحدث تحت بلانك لا على تل؛ خفّض ارتفاع الركبتين قبل خفض خط الوركين." },
          { error: "نقر أصابع القدم بين الخطوات كعازف درامز.", fix: "تَهبط كل قدم وترحل بعمد — تشترط التعليمات تناوبًا متحكمًا، ونسخة الرقصة تحرق طاقة في كل مكان إلا العضلات العاملة." },
          { error: "زحف اليدين أمامًا حتى تتخلف الأكتاف عن الرسغين.", fix: "ركّب الرسغين تحت الكتفين وأبقهما هناك — فالهندسة بلانك متحرك، والزحف يحوله إلى دفعة مائلة لم يطلبها أحد." },
          { error: "حبس النفس طوال الفاصل.", fix: "تعمل الحركة على إيقاع — ازفر مع كل دفعة أو اعثر على نمط تنفس بثنائيتين؛ فحبس الهواء عشرين ثانية ينهي المجموعة لأسباب خاطئة." },
        ],
        alternatives: "زحف العنكبوت — صفحته في مكتبتنا — يقود الركبة إلى المرفق لمطلب دوراني أعمق بإيقاع أبطأ. وقفزات البلانك تستبدل برفع الركبة نطة رجلين، والركبتان العاليتان تقدمان نمط العدو نفسه واقفة. والمتسلقون بالحركة البطيئة مع تثبيت ثلاث ثوان لكل ركبة يحولون النمط تمرين قوة. كل تنويع يحفظ وعد العائلة: شدّ البلانك زائد محرك الساقين، في حزمة واحدة لا تستطيع أي معدات تحسينها.",
        progression: "القرص الأول هو الزمن: ثلاث جولات نظيفة من عشرين ثانية بأربعين ثانية راحة، ثم جولات الثلاثين، ثم الجولات نفسها بركبتين أعلى — الارتفاع قبل السرعة دائمًا. وسلم الإيقاع يليه: متسلقون متعمدون بتكرار في الثانية للسيطرة، ثم إيقاع عدو حقيقي للفواصل. ويضيف المتقدمون عدم استقرار — قدمان على سطح انزلاقي لمتسلقين زاحفين — أو يحملون أبناء عمومة النمط بدلًا منه، وتنتهي ملاحظات التدرج حيث يبدأ برمجة البرامج عالية الكثافة.",
        programming: "احجزه داخل كتلة لياقة أو إحماء: 3-4 جولات من 20-30 ثانية عمل براحة 30-60 ثانية، مرتين إلى أربع أسبوعيًا. وكتشغيل أولي في الإحماء يشعل الجذع والأكتاف بحركة واحدة قبل التدريب؛ وضمن دائرة عالية الكثافة هو محطة محرك الساقين بين حركات القوة — وبرنامج حرق الدهون المنزلي لدينا يرتبه هكذا بالضبط. ولأن الوضعية تحمل الرسغين والأكتاف طوال الفاصل، يكسب مكانه بعد عمل الدفع لا قبله في أغلب الجلسات.",
        safety: "الرسغان وأسفل الظهر يتقاسمان ملف الحذر: فالبلانك المتحرك يحملهما طوال الفاصل. إحمِ الرسغين قبل جلسات التسلق، وأنهِ الجولة حين تهبط الأوراك لا حين يفعل ذلك عقارب الساعة — فالهبوط يسلم العمود الوظيفة التي تركتها البطن للتو. والأرضيات الزلقة هي الخطر البيئي الوحيد: بساط تحت اليدين يمنع العدو من أن يصبح انزلاقًا، وتاريخ الكتف يقرر هل الخط الأميل لليدين هو خط انطلاق أروع.",
      },
    },
    faq: {
      en: [
        { q: "Are mountain climbers cardio or abs?", a: "Both, honestly split: the legs and heart run the cardio account, and the abs run the bracing account — the position is a plank that happens to sprint. Programs book them in cardio rounds for the engine and in core blocks for the brace; the muscle does not check the schedule, it just bills both." },
        { q: "How fast should mountain climbers be?", a: "Slow enough to keep the hips level — that is the entire speed law. A deliberate pace where each knee fully reaches is the strength version; the sprint pace belongs to interval work once the position holds. Speed that costs the hips' line is not faster climbing, it is a worse exercise wearing a stopwatch." },
        { q: "My wrists give out before my legs — options?", a: "Two standard fixes: fists or dumbbells held on the floor put the wrists in a neutral, pain-free line; forearms-down climbers ( elbows under shoulders ) shift the load off the wrists entirely at the cost of some knee height. Either keeps the pattern running while the wrists catch up." },
      ],
      ar: [
        { q: "هل متسلق الجبال كارديو أم بطن؟", a: "كلاهما بصدق منقسمًا: الساقان والقلب يديران حساب الكارديو، والبطن يدير حساب الشد — فالوضعية بلانك يحدث له أنه يعدو. تحجزه البرامج في جولات الكارديو للمحرك وفي كتل البطن للشد؛ والعضلة لا تفحص الجدول، بل تبعث الفاتورتين." },
        { q: "ما سرعة متسلق الجبال الصحيحة؟", a: "بطيئة بما يبقي الوركين مستويين — هذا قانون السرعة كله. وإيقاع متعمد تبلغ فيه كل ركبة كاملها هو نسخة القوة، وإيقاع العدو مكانه عمل الفواصل بعد أن تثبت الوضعية. والسرعة التي تشترى بخط الأوراك ليست تسلقًا أسرع، بل تمرينًا أسوأ يرتدي ساعة إيقاف." },
        { q: "رسغاي تنفدان قبل ساقيّ — ما البدائل؟", a: "إصلاحان معتادان: القبضتان أو دمبل ممسوكتان على الأرض تضعان الرسغين في خط محايد خالٍ من الألم، والمتسلقون على الساعدين — مرفقان تحت الكتفين — ينقلان الحمل عن الرسغين كليًا مقابل بعض ارتفاع الركبة. كلاهما يبقي النمط جاريًا بينما تلتحق الرسغان." },
      ],
    },
    links: [
      { hrefEn: "/exercises/spider-crawl", hrefAr: "/ar/exercises/spider-crawl", labelEn: "Spider crawl — the slower cousin", labelAr: "زحف العنكبوت — القريب الأبطأ" },
      { hrefEn: "/blog/hiit-home-fat-burning-workout", hrefAr: "/ar/blog/hiit-home-workout-guide", labelEn: "HIIT home fat-burning workout", labelAr: "دليل التمرين المنزلي عالي الكثافة" },
      { hrefEn: "/programs/home-fat-loss-hiit", hrefAr: "/ar/programs/home-fat-loss-hiit", labelEn: "Home fat-loss HIIT program", labelAr: "برنامج حرق الدهون المنزلي عالي الكثافة" },
    ],
  },

  "flutter-kicks": {
    intro: {
      en: "Flutter kicks are the swimmer's kick brought to the bench: face down with the hips at the edge, as the instructions stage it, legs lifting to hip height and alternating in small, controlled beats — the water's rhythm with the floor's honesty. The library bills the glutes primary with the hamstrings assisting, and the abs hold the trunk against the bench. It stands beside its conditioning cousins in any fat-loss or home workout: a bench or a bed edge is the whole station, and the movement punishes sloppy tempo by simply stopping working.",
      ar: "رفرفة الأرجل هي ركلة السباح منقولة إلى البنش: منبطحًا مع الوركين عند الحافة كما تجهز التعليمات، ترتفع الساقان إلى مستوى الوركين وتتبادلان في نقرات صغيرة متحكمًا فيها — إيقاع الماء بأمانة الأرض. تسجل المكتبة الألويات أساسية مع أوتار الفخذ مساعدة، والبطن يثبت الجذع على البنش. وقد كسبت مكانها عبر عائلات خسارة الدهون والتدريب المنزلي العربية نفسها التي عبر منها أبناء عمومتها اللياقيون: حافة بنش أو سرير هي المحطة كلها، والحركة تعاقب الإيقاع المهمل بالتوقف عن العمل ببساطة.",
    },
    sections: {
      en: {
        muscles: "The glutes and hamstrings lead each beat — the library's billing — lifting the leg toward hip height while the opposite side's chain controls the lower, and the smaller the kick, the more the deep hip muscles share the hold. The abs press the front of the body into the bench and brace the pelvis against the kicking's tug, and the lower back works isometrically to hold the trunk's line. The grip on the bench's front edge is the anchor the whole pattern hangs from — the instructions' holding cue is a muscle instruction, not just a safety one.",
        mistakes: [
          { error: "Kicking big, splashy beats like treading water.", fix: "The movement is small on purpose — the instructions' controlled alternation keeps the work in the glutes and hamstrings; big beats hand it to momentum and the lower back." },
          { error: "Letting the legs sink and rest on the floor between beats.", fix: "The working range hovers at hip height — the instructions' level is the floor the movement lives above, and a resting leg is a set that ended early." },
          { error: "Arching the lower back to lift the legs higher.", fix: "Height comes from the glutes within the hips' honest range — when the lower back joins, it is stealing range the joints will invoice later." },
          { error: "Tensing the neck and shoulders into the bench.", fix: "The hands hold; the rest of the upper body relaxes into the pad — the work belongs below the waist, and a shrugged set finishes the wrong muscles first." },
        ],
        alternatives: "Lying leg raises on the floor train the same chain front-side up with an abs emphasis; the glute kickback on all fours isolates the hip-extension pattern. Swimming-style straight-leg kicks in a pool carry the pattern back to its home. On the same bench, prone back extensions — the library's page — train the neighboring lower-back chain. The flutter kick remains the family's endurance head: low load, long sets, honest tempo.",
        progression: "Time is the first ladder: three rounds of twenty seconds of steady beats, then thirty, then forty-five — the movement rewards endurance with endurance. Ankle weights enter when the beats stay crisp through a full minute, in one-kilo steps. The technical progression is tempo itself: three-second beats, then alternating holds — one leg held at hip height while the other works — which doubles the difficulty at the same weight, which is usually no weight at all.",
        programming: "Book it as glute-endurance accessory work or inside a conditioning block: 3-4 rounds of 20-45 seconds of steady beats (or 15-25 reps per leg), 30-60 seconds of rest, twice a week. It suits the end of a lower session — the pattern is light enough for tired days and stubborn enough to matter — and the conditioning blocks slot it between stations as the steady-state beat between sprints. Our home programs use the bed-edge version exactly as staged.",
        safety: "The lower back is the structure the tempo protects: fast beats load it through the arch each rep, and the small-beat law is its entire insurance. The bench edge under the hip creases is the one comfort toll — a folded towel pays it. Anyone with an acute lower-back episode should wait for the all-clear before lying prone and kicking; the movement is gentle, but it does load the spine's extension position from the first beat.",
      },
      ar: {
        muscles: "تقود الألويات وأوتار الفخذ كل نقرة — فاتورة المكتبة — فترفع الساق نحو مستوى الورك بينما تضبط سلسلة الجهة المقابلة الهبوط، وكلما صغرت الرفعة زادت مشاركة عضلات الورك العميقة في التثبيت. والبطن يضغط مقدمة الجسم في البنش ويثبت الحوض ضد شدّ الرفرفة، وأسفل الظهر يعمل ثباتيًا لحفظ خط الجذع. والقبضة على الحافة الأمامية للبنش هي المرساة التي يتعلق بها النمط كله — فإشارة الإمساك في التعليمات تعليمة عضلية لا مجرد تعليمة أمان.",
        mistakes: [
          { error: "رفلات كبيرة رشاشة كمن يدوس الماء.", fix: "الحركة صغيرة عمدًا — فالتناوب المتحكم في التعليمات يبقي العمل في الألويات والأوتار؛ والرفلات الكبيرة تسلمانه للزخم وأسفل الظهر." },
          { error: "غرق الساقين والاستراحة على الأرض بين النقرات.", fix: "مدى العمل يحوم عند مستوى الوركين — فمستوى التعليمات هو الأرض التي تعيش الحركة فوقها، والساغة المستريحة مجموعة انتهت مبكرًا." },
          { error: "تقويس أسفل الظهر لرفع الساقين أعلى.", fix: "يأتي الارتفاع من الألويات داخل المدى الأمين للوركين — وحين ينضم أسفل الظهر فهو يسرق مدى ستقدمه المفاصل فاتورة لاحقًا." },
          { error: "شدّ الرقبة والأكتاف إلى البنش.", fix: "اليدان تمسكان وبقية الجسم العلوي يستلقي في الوسادة — فالعمل ملك ما تحت الخصر، والمجموعة المتجهمة تنهي العضلات الخاطئة أولًا." },
        ],
        alternatives: "رفع الساقين مستلقيًا على الأرض يدرّب السلسلة نفسها مستلقيًا على الظهر مع تركيز بطن، ورفرفة الألويات على أربع تعزل نمط مدّ الورك. وركلات الساق المستقيمة بنمط السباحة في المسبح تعيد النمط إلى بيته. وعلى البنش نفسه، تمديد الظهر الانبطاحي — صفحة المكتبة — يدرّب سلسلة أسفل الظهر المجاورة. وتبقى الرفرفة رأس الصبر في العائلة: حمل خفيف ومجموعات طويلة وإيقاع أمين.",
        progression: "الزمن هو السلم الأول: ثلاث جولات من عشرين ثانية نقرات ثابتة، ثم ثلاثون، ثم خمس وأربعون — فالحركة تكافئ الصبر بالصبر. وتدخل أثقال الكاحل حين تبقى النقرات حادة عبر دقيقة كاملة، بخطوات كيلو واحد. والتدرج الفني هو الإيقاع نفسه: نقرات ثلاث ثوان، ثم تثبيت متناوب — ساق مثبتة عند مستوى الورك بينما تعمل الأخرى — وهذا يضاعف الصعوبة بنفس الوزن، وهو عادة لا وزن أصلًا.",
        programming: "احجزه عملًا مساعدًا لصبر الألويات أو داخل كتلة لياقة: 3-4 جولات من 20-45 ثانية نقرات ثابتة أو 15-25 تكرارًا لكل ساق، براحة 30-60 ثانية، مرتين أسبوعيًا. يناسب نهاية جلسة سفلية — فالنمط خفيف بما يكفي لأيام التعب وعنيد بما يكفي ليهمنا — وكتل اللياقة تضعه بين المحطات كنقرة ثابتة بين الطلقات. وبرامجنا المنزلية تستخدم نسخة حافة السرير كما جهزت بالضبط.",
        safety: "أسفل الظهر هو البنية التي يحميها الإيقاع: فالنقرات السريعة تحمله عبر القوس في كل تكرار، وقانون النقرة الصغيرة تأمينه كله. وحافة البنش تحت ثنيات الورك هي رسوم الراحة الوحيدة — منشفة مطوية تدفعها. ومن لديه نوبة حادة في أسفل الظهر فلينتظر الإذن قبل الانبطاء والرفرفة؛ فالحركة لطيفة لكنها تحمل وضعية مدّ العمود من أول نقرة.",
      },
    },
    faq: {
      en: [
        { q: "Flutter kicks or lying leg raises?", a: "Different sides of the same coin: the flutter kicks — this page's prone version — load the glutes and hamstrings at the back of the hip; lying leg raises front-side-up load the abs and hip flexors. Prone beats train the back chain, supine beats train the front. Most programs run both across a week, and the library carries the pages for the pair." },
        { q: "How long should a flutter kick set last?", a: "Start at twenty seconds of steady beats and build toward a minute across a few weeks — the movement's honest unit is time because its beats should be identical at second fifty and second five. When a full minute stays crisp, ankle weights enter the conversation rather than longer sets." },
        { q: "Can I do flutter kicks on the floor instead of a bench?", a: "Yes, with a geometry note: on the floor the legs' beats shorten (the floor ends the kick early), which shifts the demand toward the glutes' hold and away from the kick's travel. The bench or bed edge exists to give the legs their lane — the floor version is a legitimate, slightly smaller exercise." },
      ],
      ar: [
        { q: "رفرفة الأرجل أم رفع الساقين مستلقيًا؟", a: "وجهان لعملة واحدة: الرفرفة — نسخة هذه الصفحة الانبطاحية — تحمل الألويات والأوتار عند مؤخرة الورك؛ ورفع الساقين على الظهر يحمل البطن ومثنيات الورك. النقرات انبطاحية تدرّب السلسلة الخلفية، والاستلقائية تدرّب الأمامية. تشغل أغلب البرامج كليهما عبر الأسبوع، وتحمل المكتبة صفحتين للزوج." },
        { q: "كم تدوم مجموعة الرفرفة؟", a: "ابدأ بعشرين ثانية نقرات ثابتة وابنِ نحو الدقيقة خلال أسابيع قليلة — فوحدة الحركة الأمينة هي الزمن لأن نقراتها ينبغي أن تكون متطابقة عند الثانية الخمسين والخامسة. وحين تبقى الدقيقة كاملة حادة، تدخل أثقال الكاحل المحادثة بدلًا من المجموعات الأطول." },
        { q: "هل أؤدي الرفرفة على الأرض بدل البنش؟", a: "نعم مع ملاحظة هندسية: على الأرض تقصر نقرات الساقين (تنهي الأرض الرفعة مبكرًا)، وهذا ينقل الطلب نحو تثبيت الألويات بعيدًا عن سفر الرفعة. فحافة البنش أو السرير موجودة لتمنح الساقين مسارهما — ونسخة الأرض تمرين أصغر قليلًا لكنه مشروع." },
      ],
    },
    links: [
      { hrefEn: "/exercises/leg-lift", hrefAr: "/ar/exercises/leg-lift", labelEn: "Standing leg lift — the glute companion", labelAr: "رفع الساق واقفًا — رفيق الألويات" },
      { hrefEn: "/blog/hiit-home-fat-burning-workout", hrefAr: "/ar/blog/hiit-home-workout-guide", labelEn: "HIIT home fat-burning workout", labelAr: "دليل التمرين المنزلي عالي الكثافة" },
      { hrefEn: "/programs/home-fat-loss-hiit", hrefAr: "/ar/programs/home-fat-loss-hiit", labelEn: "Home fat-loss HIIT program", labelAr: "برنامج حرق الدهون المنزلي عالي الكثافة" },
    ],
  },

  "romanian-deadlift": {
    intro: {
      en: "The Romanian deadlift is the deadlift that never touches the floor: from standing, the hips push back and the bar slides down the thighs to the hamstrings' honest limit, then the hips drive the whole thing back up — the instructions' full arc, with the shins vertical and the back straight as laws rather than suggestions. The library bills the hamstrings primary with glutes, calves and lower back assisting, and that billing is the movement's identity: where the conventional deadlift pulls from the floor with everything, the Romanian loads the posterior chain's stretch — the hinge at its most focused. It answers the hamstring-development job every leg program has to cover.",
      ar: "الديدلفت الروماني هو الديدلفت الذي لا يلمس الأرض أبدًا: من الوقوف، يندفع الوركان للخلف وينزلق البار على الفخذين إلى الحد الأمين للأوتار، ثم يقود الوركان كل شيء صاعدًا — قوس التعليمات الكامل، مع عظم الساق عموديًا والظهر مستقيمًا بوصفهما قانونين لا اقتراحين. تسجل المكتبة أوتار الفخذ أساسية مع الألويات والسمانة وأسفل الظهر مساعدة، وهذه الفاتورة هي هوية الحركة: فحيث يسحب الديدلفت التقليدي من الأرض بكل شيء، يحمل الروماني تمدد السلسلة الخلفية — المفصلة في أخصر صورها. وهي الإجابة عن مهمة تطوير أوتار الفخذ التي على كل برنامج أرجل أن يغطيها.",
    },
    sections: {
      en: {
        muscles: "The hamstrings own the eccentric — as the hips push back, the library's primary muscle lengthens under the bar's load through the longest stretch the big lifts offer, and that stretch under load is the hamstring growth stimulus in its purest form. The glutes take over the concentric, snapping the hips forward to standing; the lower back holds its isometric arch throughout, the calves steady the floor grip, and the lats pack the bar against the thighs. The grip works the whole set too — a deadlift is a deadlift — and the instructions' wrist-wrap note is the honest acknowledgment.",
        mistakes: [
          { error: "Squatting the bar down instead of hinging it.", fix: "The shins stay vertical as the instructions demand — the hips travel back, not down; a Romanian deadlift that bends at the knees is a bad squat with a barbell's manners." },
          { error: "Letting the bar drift away from the legs.", fix: "The bar rides the thighs' line the whole way — the instructions say arms straight and the lats packed; a bar that floats forward hangs its load on the lower back at the worst lever." },
          { error: "Rounding the lower back to chase floor-adjacent depth.", fix: "The range ends where the hamstrings' stretch ends — for most lifters that is mid-shin, not the floor; the instructions' back-straight law outranks the ego's depth ambitions." },
          { error: "Rushing the reps like a power movement.", fix: "The instructions call for steady and under control — three seconds down through the stretch, a strong hip drive up; speed deletes exactly the stimulus the exercise exists to deliver." },
        ],
        alternatives: "The conventional deadlift — its page sits in this library — loads the whole chain from the floor with more weight and more everything. The stiff-leg deadlift keeps the knees straighter still; single-leg RDLs expose and repair side differences with a kettlebell. Good mornings load the same hinge with the bar on the back; the glute bridge family trains hip extension from the floor. The hamstring curl machines — lying, seated, standing — train the same muscle through the knee instead of the hip, and this library carries those pages as the family's other half.",
        progression: "Earn the hinge pattern with the empty bar: two weeks of slow reps to mid-shin depth, filmed from the side, build the position every kilo after will lean on. Load climbs in 5-10 kilo jumps while the bar stays glued to the legs, and the depth law never moves — stretch to the hamstrings' limit, not the floor's. The technical progressions are tempo (a five-second lower) and pauses (a two-second hold at the deepest stretch), both of which deepen the stimulus without touching the plates.",
        programming: "Program it as the main hinge of a hamstring-focused day or the second hinge after squats: 3-4 sets of 6-10 reps with 2-3 minutes of rest, once or twice a week. It pairs famously with the squat across a lower split — squats bend the knee's side of the hips, the Romanian bends the back of it. Because the eccentric is the product, it earns slow sets rather than heavy singles, and our program templates dose it exactly that way.",
        safety: "The lower back's straightness is the whole safety law: the Romanian deadlift's stretch stimulus works only when the spine holds its arch, and every rounding rep trades hamstring growth for disc risk — a bad trade at any weight. The hamstrings will talk to you the day after honest sets; that conversation is the exercise working. Warm up thoroughly before working loads (cold hamstrings at long lengths are the classic strain story), and let the grip's limit — straps when it arrives, as the deadlift page allows — keep the focus on the hinge.",
      },
      ar: {
        muscles: "تمتلك الأوتار المرحلة السالبة — فمع اندفاع الوركين للخلف تطول العضلة الأساسية للمكتبة تحت حمل البار عبر أطول تمدد تقدمه الرفعات الكبيرة، وذلك التمدد تحت الحمل هو تحفيز نمو الأوتار في أنقى صوره. وتتولى الألويات المرحلة الموجبة قافزةً بالوركين أمامًا إلى الوقوف؛ ويحمل أسفل الظهر قوسه ثباتيًا طوال الوقت، وتثبت السمانة قبضة الأرض، وتحزم الجنبية البار إلى الفخذين. والقبضة تعمل طوال المجموعة أيضًا — فالديدلفت ديدلفت — وملاحظة أربطة المعصم في التعليمات اعتراف أمين.",
        mistakes: [
          { error: "سكواتة البار نزولًا بدل مفصلته.", fix: "يبقى عظم الساق عموديًا كما تطلب التعليمات — يسافر الوركان للخلف لا للأسفل؛ فالروماني الذي ينثني عند الركبتين سكوات سيئ بأخلاق بار." },
          { error: "انجراف البار بعيدًا عن الساقين.", fix: "يركب البار خط الفخذين طوال الطريق — تقول التعليمات ذراعان مستقيمتان وجنبية محزمة؛ فالبار الطائف أمامًا يعلق حمله على أسفل الظهر عند أسوأ رافعة." },
          { error: "تقويس أسفل الظهر لمطاردة عمق يجاور الأرض.", fix: "ينتهي المدى حيث ينتهي تمدد الأوتار — ولأغلب المتدربين هذا منتصف الساق لا الأرض؛ وقانون الظهر المستقيم في التعليمات أعلى رتبة من طموحات العمق." },
          { error: "استعجال التكرارات كحركة قوة.", fix: "تشترط التعليمات ثباتًا وتحكمًا — ثلاث ثوان نزولًا عبر التمدد ودفع ورك قوي صعودًا؛ فالسرعة تحذف بالضبط التحفيز الذي وُجد التمرين لتقديمه." },
        ],
        alternatives: "الديدلفت التقليدي — صفحته في مكتبتنا — يحمل السلسلة كاملة من الأرض بوزن أكبر وكل شيء أكبر. والديدلفت بالساق الممدودة يبقي الركبتين أكثر استقامة، والروماني بساق واحدة يكشف فروق الجهتين ويصلحها بجرس. وتمرين صباح الخير يحمل المفصلة نفسها ببار على الظهر، وعائلة جسر الألويات تدرّب مدّ الورك من الأرض. وماكينات ثني أوتار الفخذ — مستلقية وجالسة وواقفة — تدرّب العضلة نفسها عبر الركبة بدل الورك، وتحمل مكتبتنا صفحاتها كنصف العائلة الآخر.",
        progression: "اكسب نمط المفصلة ببار فارغ: أسبوعان من تكرارات بطيئة إلى عمق منتصف الساق، مصورًا من الجانب، يبنيان الوضعية التي سيرتكز عليها كل كيلوجرام بعدهما. يصعد الحمل بقفزات 5-10 كجم مع التصاق البار بالساقين، وقانون العمق لا يتحرك أبدًا — تمدد إلى حد الأوتار لا إلى حد الأرض. والتدرجات الفنية إيقاع (نزول خمس ثوان) وتوقفات (تثبيت ثانيتين عند أعمق تمدد)، وكلاهما يعمق التحفيز دون لمس الأقراص.",
        programming: "برمجه كمفصلة يوم مركز على الأوتار أو المفصلة الثانية بعد السكوات: 3-4 مجموعات من 6-10 تكرارات براحة دقيقتين إلى ثلاث، مرة أو مرتين أسبوعيًا. ويقترن شهرةً بالسكوات عبر تقسيم سفلي — فالسكوات يثني جانب الورك من جهة الركبة، والروماني يثني مؤخرته. ولأن المرحلة السالبة هي المنتج، يكسب مجموعات بطيئة لا فرديات ثقيلة، وقوالب برامجنا تجريعه هكذا بالضبط.",
        safety: "استقامة أسفل الظهر هي قانون السلامة كله: فتحفيز التمدد في الروماني لا يعمل إلا إذا حفظ العمود قوسه، وكل تكرار متقوس يقايض نمو الأوتار بمخاطرة غضروف — صفقة سيئة بأي وزن. وستخاطبك الأوتار في اليوم التالي للمجموعات الأمينة؛ وتلك المحادثة هي التمرين يعمل. إحمِ جيدًا قبل أوزان العمل (فالأوتار الباردة عند الأطوال الممدودة قصة الشد الكلاسيكية)، ودع حد القبضة — أحزمة عند وصوله كما تجيز صفحة الديدلفت — يحفظ التركيز على المفصلة.",
      },
    },
    faq: {
      en: [
        { q: "Romanian vs conventional deadlift — which one?", a: "Different jobs at the same bar: the conventional pulls from the floor with the whole chain and heavier loads; the Romanian holds the top and spends its set on the hamstrings' stretch. Strength programs run the conventional as the main lift and the Romanian as the assistant; hypertrophy and hamstring-focused blocks reverse that order. The library carries both pages because both jobs need doing." },
        { q: "How far down should the bar travel?", a: "To the hamstrings' honest limit and not one centimeter more — the instructions' controlled arc ends where the stretch ends, which for most lifters is around mid-shin with a flat back. Touching the floor is not the target; the moment the lower back rounds to reach lower, the range has ended even if the bar has not." },
        { q: "Why do I feel Romanian deadlifts in my lower back?", a: "Three usual suspects: the bar has drifted off the legs (load leaves the hamstrings' lever), the knees have bent the movement into a squat shape, or the working load simply exceeds the back's isometric hold. Film one set from the side — the culprit is usually visible within a single rep, and the fix is usually five kilos, not a new exercise." },
      ],
      ar: [
        { q: "الروماني أم التقليدي — أيهما؟", a: "وظيفتان مختلفتان على البار نفسه: التقليدي يسحب من الأرض بالسلسلة كاملة وأحمال أثقل؛ والروماني يحفظ القمة وينفق مجموعته على تمدد الأوتار. برامج القوة تشغل التقليدي كرفعة رئيسية والروماني كمساعد، وكتل التضخيم وتركيز الأوتار تعكس الترتيب. وتحمل المكتبة الصفحتين لأن الوظيفتين كلتيهما تحتاج أداءً." },
        { q: "إلى أين ينزل البار؟", a: "إلى الحد الأمين للأوتار ولا سنتيمترًا واحدًا بعده — قوس التحكم في التعليمات ينتهي حيث ينتهي التمدد، وهذا لمعظم المتدربين حول منتصف الساق بظهر مسطح. لمس الأرض ليس الهدف؛ وما إن يتقوس أسفل الظهر للنزول أكثر حتى يكون المدى قد انتهى حتى لو لم يفعل البار." },
        { q: "لماذا أشعر بالروماني في أسفل ظهري؟", a: "ثلاثة متهمين معتادين: البار انجرف عن الساقين (الحمل يغادر رافعة الأوتار)، أو الركبتان ثنيتا الحركة إلى شكل سكوات، أو حمل العمل يتجاوز ببساطة إمساك الظهر الثباتي. صوّر مجموعة من الجانب — المتهم مرئي عادة خلال تكرار واحد، والإصلاح عادة خمسة كيلوجرامات لا تمرين جديد." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-deadlift", hrefAr: "/ar/exercises/barbell-deadlift", labelEn: "Conventional deadlift — the floor version", labelAr: "الديدلفت التقليدي — نسخة الأرض" },
      { hrefEn: "/exercises/barbell-squat", hrefAr: "/ar/exercises/barbell-squat", labelEn: "Barbell squat — the knee-side pairing", labelAr: "السكوات بالبار — القرين من جهة الركبة" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "How often to train legs", labelAr: "كم مرة تدرب الأرجل أسبوعيًا" },
    ],
  },

  "barbell-curl": {
    intro: {
      en: "The barbell curl is the biceps' national anthem: stand tall, shoulder-width grip, and curl the bar from thighs to shoulder height with the elbows pinned — the instructions' whole law, plus the squeeze at the top the tips insist on. The library bills the biceps primary with the forearms as the honest second, and no other movement loads the front of the arm with such straightforward truth: what the bar weighs is what the biceps lifts, and there is nowhere to hide the difference. It is the arm-builder every beach season renews, and every serious arm program on this site books it as the first curl of the week.",
      ar: "الكيرل بالبار هو النشيد الوطني للعضلة ذات الرأسين: قف شامخًا وقبضة بعرض الكتفين ولفّ البار من الفخذين إلى ارتفاع الكتف والمرفقان مثبتان — قانون التعليمات كله، زائد العصرة في القمة التي تصر عليها النصائح. تسجل المكتبة ذات الرأسين أساسية والساعدين ثانيًا أمينًا، ولا حركة أخرى تحمل مقدمة الذراع بصدق بهذه البساطة: ما يزنه البار هو ما ترفعه العضلة، ولا مكان لإخفاء الفرق. وهي بانية الأذرع الذي يجدد كل موسم شاطئ موعده، وكل برنامج أذرع جاد في هذا الموقع يحجزها كأول كيرل في الأسبوع.",
    },
    sections: {
      en: {
        muscles: "The biceps brachii — both heads — curls the bar as the elbows flex, and the library's primary billing covers the front of the arm; the forearms' grip and brachialis work the whole set underneath, the brachialis pushing the biceps up from below and adding the thickness a front-double-biceps pose actually shows. The delts and traps hold the shoulders still, the abs brace the torso against the bar's pull. The barbell's fixed grip is the movement's quiet feature: the wrists cannot rotate the cheating in the way dumbbells permit, so the barbell curl is the family's honesty exam.",
        mistakes: [
          { error: "Swinging the torso to heave the bar off the thighs.", fix: "The tips say it plainly — curl without swinging: brace the abs, pin the elbows, and the weight the torso cannot help is the weight that belongs in the next exercise down." },
          { error: "Elbows drifting forward until the curl becomes a front raise.", fix: "Elbows pinned to the ribs — the instructions demand it; when the elbows travel, the shoulders take over and the biceps becomes a passenger in its own exercise." },
          { error: "Half-reps in the top half where the bar never leaves chest height.", fix: "The full arc runs thigh to shoulder — the instructions set both ends; the bottom half, which most lifters skip, is where the biceps loads at its longest." },
          { error: "Dropping the bar down at free-fall speed.", fix: "The tips prescribe resisting the weight on the way down — two seconds of lowering is the eccentric half of the growth, and free-fall reps are half-reps wearing a full-rep costume." },
        ],
        alternatives: "The dumbbell curl — its page in this library — frees the wrists and exposes side differences; the hammer curl trains the brachialis and forearm line; the preacher curl removes the cheating entirely with its bench. EZ-bar curls save cranky wrists with their angled grip; cable curls keep tension through both ends of the arc. The chin-up remains the family's compound cousin — biceps under a pulling load — and this library carries its page for the heavier chapters.",
        progression: "Start lighter than instinct: a load curled strictly for three sets of eight, with the torso a statue, earns the first jump. Climb by the smallest plates in the gym while the elbows stay pinned, and when the bar stalls, the honest progressions arrive — a three-second lowering, a pause at the halfway point, strict twenty-rep sets with lighter loads. Cheating curls (a controlled hip drive for the last reps) are an old-school advanced tool, borrowed only after strict work has plateaued for real.",
        programming: "Book it as the first curl of an arm session or the biceps accessory of a pull day: 3-4 sets of 8-12 reps with 60-90 seconds of rest, twice a week at most for direct curls. It earns the session's opening slot when arms are the priority — fresh elbows, honest loads — and the late slot when arms ride along after back work. Our program templates carry both placements across the week's arm volume.",
        safety: "The elbows and the wrists share the caution file: full lockouts at the bottom under heavy load bang the elbow tendons — stop just short of dead straight, as the strict arc allows; and a straight bar's fixed grip bothers some wrists (the EZ-bar note above is the standard fix). The lower back's enemy is the swing, and the brace cue is its whole prevention. Warm the elbows with a light set before working loads; cold curls are the classic tendinitis origin story.",
      },
      ar: {
        muscles: "العضلة ذات الرأسين — برأسيها — تلفّ البار مع انثناء المرفقين، وتغطي الفاتورة الأساسية للمكتبة مقدمة الذراع؛ وقبضة الساعدين والعضدية تعملان طوال المجموعة من الأسفل، فتدفع العضدية ذات الرأسين لأعلى من تحتها وتضيف السماكة التي تُظهرها فعليًا وضعية العضلات الأمامية المزدوجة. والدالية والترابيس تحفظان الكتفين ساكنتين، والبطن يشد الجذع ضد شدّ البار. والقبضة الثابتة للبار ميزة الحركة الصامتة: فالرسغان لا تستطيعان لفّ الغش بالطريقة التي تسمح بها الدمبلات، ولهذا فالكيرل بالبار اختبار الأمانة في العائلة.",
        mistakes: [
          { error: "تأرجح الجذع لانتزاع البار عن الفخذين.", fix: "تقولها النصائح بوضوح — ارفع دون تأرجح: اشدد البطن وثبّت المرفقين، والوزن الذي لا يستطيع الجذع مساعدته هو وزن ينتمي للتمرين التالي في القائمة الأدنى." },
          { error: "انجراف المرفقين أمامًا حتى يصبح الكيرل رفعة أمامية.", fix: "المرفقان مثبتان على الأضلاع — تطلب التعليمات ذلك؛ فحين يسافر المرفقان تتولى الأكتاف وتصبح ذات الرأسين راكبًا في تمرينها هي." },
          { error: "أنصاف تكرارات في النصف العلوي لا يغادر فيها البار ارتفاع الصدر.", fix: "القوس الكامل يجري من الفخذ إلى الكتف — تضع التعليمات الطرفين؛ والنصف السفلي، الذي يتخطاه أغلب المتدربين، هو حيث تُحمل ذات الرأسين عند أطول مداها." },
          { error: "إسقاط البار نزولًا بسرعة السقوط الحر.", fix: "تصف النصائح مقاومة الوزن في النزول — ثانيتان من الإنزال هما النصف السالب للنمو، والتكرارات الساقطة أنصاف تكرارات بزيّ التكرار الكامل." },
        ],
        alternatives: "الكيرل بالدمبل — صفحته في مكتبتنا — يحرر الرسغين ويكشف فروق الجهتين، وكيرل المطرقة يدرّب العضدية وخط الساعد، وكيرل الواعظ يزيل الغش كليًا ببنده. وكيرل البار المتعرج ينقذ الرسغين المتعبتين بقبضته المائلة، وكيرل الكابل يحفظ الشد عبر طرفي القوس. وتبقى العقلة السفلية القريب المركب للعائلة — ذات رأسين تحت حمل سحب — وتحمل مكتبتنا صفحتها للفصول الأثقل.",
        progression: "ابدأ أخف من الغريزة: حمل يُلف بصرامة لثلاث مجموعات من ثمان، والجذع تمثال، يكسب أول قفزة. اصعد بأصغر أقراص الصالة مع بقاء المرفقين مثبتين، وحين يتعثر البار تصل التدرجات الأمينة — نزول ثلاث ثوان، وتوقف عند المنتصف، ومجموعات عشرين صارمة بأحمال أخف. والكيرلات الغاشة (دفعة ورك متحكمة لآخر التكرارات) أداة قديمة للمتقدمين، تُستعار فقط بعد تعثر حقيقي للعمل الصارم.",
        programming: "احجزه كأول كيرل لجلسة أذرع أو عمل ذات الرأسين المساعد ليوم سحب: 3-4 مجموعات من 8-12 تكرارًا براحة 60-90 ثانية، ومرتان أسبوعيًا حد أقصى للكيرل المباشر. ويكسب خانة افتتاح الجلسة حين تكون الأذرع أولوية — مرفقان جديدان وأحمال أمينة — والخانة المتأخرة حين تركب الأذرع بعد عمل الظهر. وقوالب برامجنا تحمل الموضعين عبر حجم الأذرع الأسبوعي.",
        safety: "المرفقان والرسغان يتقاسمان ملف الحذر: فالقفل الكامل في القاع تحت حمل ثقيل يدقّ أوتار المرفق — توقف قبيل الاستقامة الميتة كما يسمح القوس الصارم؛ والقبضة الثابتة للبار المستقيم تزعج بعض الرسغين (ملاحظة البار المتعرج أعلاه هي الإصلاح القياسي). وعدو أسفل الظهر هو التأرجح، وإشارة الشدّ هي وقايته كلها. إحمِ المرفقين بمجموعة خفيفة قبل أوزان العمل؛ فالكيرلات الباردة قصة التهاب الأوتار الكلاسيكية في أولها.",
      },
    },
    faq: {
      en: [
        { q: "Why is my barbell curl so weak compared to my rows?", a: "The comparison is the point: rows and pulls hide the biceps inside a bigger movement with the back's help, while the curl isolates the small muscle alone with a terrible lever — a strict curl at a quarter of your row weight is an ordinary ratio. Track curls as curls; the arms grow on their own log, not the back's." },
        { q: "Should my elbows stay perfectly still?", a: "Pinned at the sides with a few degrees of natural travel at the top — the instructions' close-to-the-torso law is the default. Some lifters let the elbows drift slightly forward to finish the top contraction, a legitimate style; the dishonesty begins when the elbows travel to START the rep, because then the shoulders are lifting the bar." },
        { q: "Straight bar or EZ bar?", a: "Straight, as this page teaches, for the standard supinated grip and heaviest honest load; EZ when the wrists complain — its angled handles halve the wrists' rotation and let most lifters curl pain-free at the same loads. Both build the biceps; the choice is a joint decision, not a results one." },
      ],
      ar: [
        { q: "لماذا كيرل البار ضعيف جدًا مقارنة بتجديفاتي؟", a: "المقارنة هي المغزى: فالتجديف والسحب يخفيان ذات الرأسين داخل حركة أكبر بمساعدة الظهر، بينما يعزلها الكيرل وحدها برافعة سيئة — وكيرل صارم عند ربع وزن تجديفك نسبة عادية. سجّل الكيرل ككيرل؛ فالأذرع تنمو على سجلها لا سجل الظهر." },
        { q: "هل يبقى مرفقاي ساكنين تمامًا؟", a: "مثبتان على الجانبين مع درجات قليلة من السفر الطبيعي في القمة — قانون القرب من الجذع في التعليمات هو الافتراضي. ويتيح بعض المتدربين للمرفقين الانجراف قليلًا أمامًا لإتمام الانقباض العلوي، وهو أسلوب مشروع؛ ويبدأ الغش حين يسافر المرفقان لبدء التكرار، لأن الأكتاف حينها هي من يرفع البار." },
        { q: "البار المستقيم أم المتعرج؟", a: "المستقيم كما تعلم هذه الصفحة، للقبضة الكاملة والحمل الأمين الأثقل؛ والمتعرج حين تشتكي الرسغان — فمقابضه المائلة تنصّف دوران الرسغين وتتيح لأغلبهم كيرلًا بلا ألم بنفس الأحمال. كلاهما يبني ذات الرأسين؛ والاختيار قرار مفصل لا قرار نتائج." },
      ],
    },
    links: [
      { hrefEn: "/exercises/dumbbell-bicep-curl", hrefAr: "/ar/exercises/dumbbell-bicep-curl", labelEn: "Dumbbell curl — the freer version", labelAr: "الكيرل بالدمبل — النسخة الأكثر حرية" },
      { hrefEn: "/exercises/preacher-curl", hrefAr: "/ar/exercises/preacher-curl", labelEn: "Preacher curl — the strictest seat", labelAr: "كيرل الواعظ — أصرم مقعد" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log every curl — free tracker", labelAr: "سجل كل كيرل — المتتبع المجاني" },
    ],
  },

  "dumbbell-bicep-curl": {
    intro: {
      en: "The dumbbell bicep curl is the barbell curl with the truth serum: two independent bells mean each arm lifts its own weight, its own way, with no stronger side to lean on. The instructions stage the classic pattern — palms rotated forward at the start, elbows close, curl to shoulder height with a squeeze — and the library's billing matches the barbell's: biceps primary, forearms second. What the dumbbells add is diagnosis and range: a lagging arm prints itself on every set, and the free wrists travel the arc the forearm's rotation was designed for. Every arm program on this site books it beside its barbell brother, and the two carry the curl family between them.",
      ar: "الكيرل بالدمبل هو كيرل البار بعد حقنة الصدق: جرسان مستقلان يعنيان أن كل ذراع ترفع وزنها بطريقتها، بلا جانب أقوى تتكئ عليه. تجهز التعليمات النمط الكلاسيكي — راحتان مستديرتان للأمام في البداية ومرفقان قريبان ولفّ إلى ارتفاع الكتف مع عصرة — وتطابق فاتورة المكتبة فاتورة البار: ذات الرأسين أساسية والساعدان ثانيًا. وما تضيفه الدمبلات هو التشخيص والمدى: فالذراع المتخلفة تطبع نفسها على كل مجموعة، والرسغان الحرتان تسافران القوس الذي صُمم دوران الساعد لأجله. وكل برنامج أذرع في هذا الموقع يحجزه بجوار أخيه البار، ويحمل الاثنان عائلة الكيرل بينهما.",
    },
    sections: {
      en: {
        muscles: "The biceps brachii curls each bell as the library's primary billing promises — and the dumbbell version lets it do the second half of its job too: as the palm supinates through the arc (rotating up to face the ceiling), the biceps contracts through its full function of flex-plus-rotate, which the fixed barbell grip forbids. The forearms and brachialis carry the same supporting load the library lists, the grip steadying each bell's wobble, and the shoulders and trunk hold the whole frame still so the arc stays honest. Alternating arms adds a rest-between-work rhythm the simultaneous version does not know.",
        mistakes: [
          { error: "Twisting the torso to help the weaker arm's turn.", fix: "The ribs stay stacked over the hips — each bell rises on its arm's own vote; the twist is the trunk casting a ballot it does not have." },
          { error: "Swinging the bells up with a hip dip.", fix: "The same law as the barbell page — curl without swinging; the dumbbell's freedom multiplies the cheat's options, and the brace shrinks them back." },
          { error: "Curling the wrist inward to finish the rep.", fix: "The wrist stays neutral, a straight line from knuckle to elbow — a curled wrist finishes the rep for the forearm and takes it from the biceps' account." },
          { error: "Cutting the bottom range where the bells hang full length.", fix: "The instructions start from arm's length — the fully stretched bottom is where the biceps loads longest, and skipping it for a mid-range pump is trading growth for burn." },
        ],
        alternatives: "The barbell curl — its page sits alongside — loads the heaviest and locks the wrists honest; the hammer curl holds the neutral grip for the brachialis; the incline dumbbell curl stretches the biceps at the shoulder for a longer loaded arc. Concentration curls isolate one arm at a time with the elbow braced. The curl family's wardrobe is deep, and this library carries the pages — the dumbbell version is the hinge the rest of it swings on.",
        progression: "The weaker arm writes the program: its strict eight reps set the load both arms work, and the gap closes over weeks under that law. Climb one kilo per bell when the top set's last rep still squeezes, and rotate the progressions — a three-second lower, a pause at the top, the alternating pattern slowed to a strict count — before the dumbbell rack runs out of honest weights. When both arms match and the bells stall, the barbell takes the strength shift and the dumbbells keep the volume.",
        programming: "Book it beside or after the barbell curl on arm day, or as the biceps accessory of a pull day: 3 sets of 8-12 reps per arm with 45-60 seconds of rest, twice a week. Alternating curls suit the accessory slot (one arm rests while the other works); simultaneous curls suit the priority slot when the biceps gets the session's fresh energy. Our home programs run the dumbbell curl as the arm anchor — the family's most equipment-honest member.",
        safety: "The elbows carry the same laws as the barbell version — no dead-straight lockouts under load, stop just short, and the tendons stay quiet. The dumbbell's free path is its safety gift and its cheating risk: the bell can swing where the bar cannot, so the brace cue is the injury prevention and the exercise prescription in one. The wrist's neutrality is the small law with the big payoff — the wrist curl hybrid this page's mistakes section flags is the classic path to a week of gripe.",
      },
      ar: {
        muscles: "تلفّ ذات الرأسين كل جرس كما تعد الفاتورة الأساسية للمكتبة — وتتيح لها نسخة الدمبل أداء النصف الثاني من وظيفتها أيضًا: فمع استدارة الراحة عبر القوس صاعدةً نحو السقف، تنقبض ذات الرأسين عبر وظيفتها الكاملة لفّاً ودورانًا، وهو ما تحظره قبضة البار الثابتة. ويحمل الساعدان والعضدية نفس الحمل المساند الذي تسجله المكتبة، والقبضة تثبت ارتجاف كل جرس، والأكتاف والجذع يحفظون الهيكل ساكنًا كي يبقى القوس أمينًا. والتبديل بين الذراعين يضيف إيقاع راحة-عمل لا تعرفه النسخة المتزامنة.",
        mistakes: [
          { error: "لفّ الجذع لمساعدة دور الذراع الأضعف.", fix: "تبقى الأضلاع مركبة فوق الوركين — كل جرس يصعد بتصويت ذراعه وحدها؛ واللفّة جذع يدلي بصوت ليس له." },
          { error: "تأرجح الجرسين صاعدًا بانخفاضة ورك.", fix: "نفس قانون صفحة البار — ارفع دون تأرجح؛ فحرية الدمبل تضاعف خيارات الغش، والشدّ يعيدها إلى حجمها." },
          { error: "طيّ الرسغ للداخل لإتمام التكرار.", fix: "يبقى الرسغ محايدًا، خط مستقيم من المفاصل إلى المرفق — فالرسغ الملفوف يُتم التكرار للساعد ويسحبه من حساب ذات الرأسين." },
          { error: "قصر المدى السفلي حيث تتدلى الجرسان بكامل الطول.", fix: "تبدأ التعليمات من طول الذراع كاملًا — فالقاع الممدود تمامًا حيث تُحمل ذات الرأسين أطول ما يكون، وتخطيه بحثًا عن ضخ منتصف المدى مقايضة نموًا باحتراق." },
        ],
        alternatives: "الكيرل بالبار — صفحته تجاورها — يحمل الأثقل ويقفل الرسغين على الأمانة؛ وكيرل المطرقة يحفظ القبضة المحايدة للعضدية؛ وكيرل الدمبل المائل يمدّ ذات الرأسين عند الكتف لقوس محمل أطول. وكيرلات التركيز تعزل ذراعًا واحدة والمرفق مسند. خزانة عائلة الكيرل عميقة وتحمل المكتبة صفحاتها — ونسخة الدمبل هي المفصلة التي يتأرجح الباقي عليها.",
        progression: "الذراع الأضعف تكتب البرنامج: ثمانياتها الصارمة تضع الحمل الذي تعمل به الذراعان، وتلتئم الفجوة عبر أسابيع تحت ذلك القانون. اصعد كيلوجرامًا للجرس حين تظل تكرارية المجموعة الأخيرة تعصر، ودوّر التدرجات — نزول ثلاث ثوان، وتوقف في القمة، ونمط التبديل مبطأ إلى عد صارم — قبل أن تنفد الرفافة من الأوزان الأمينة. وحين تتفق الذراعان ويتعثر الجرسان، يتسلم البار نوبة القوة وتحتفظ الدمبلات بالحجم.",
        programming: "احجزه بجوار الكيرل بالبار أو بعده في يوم الأذرع، أو كعمل ذات الرأسين المساعد ليوم سحب: ثلاث مجموعات من 8-12 تكرارًا لكل ذراع براحة 45-60 ثانية، مرتين أسبوعيًا. والكيرلات المتناوبة تناسب خانة المساعد — ذراع تراحي بينما تعمل الأخرى — والمتزامنة تناسب خانة الأولوية حين تأخذ ذات الرأسين طاقة الجلسة النضرة. وبرامجنا المنزلية تشغل كيرل الدمبل كمرساة الأذرع — أكثر أفراد العائلة أمانةً مع المعدات.",
        safety: "المرفقان يحملان قوانين نسخة البار نفسها — لا قفل ميت الاستقامة تحت الحمل، توقف قبله قليلًا، فتبقى الأوتار هادئة. ومسار الدمبل الحر هديته الأمنية وخطر غشه معًا: فالجرس يستطيع التأرجح حيث لا يستطيع البار، فإشارة الشدّ وقاية إصابة ووصفة تمرين في واحدة. وحياد الرسغ قانون صغير بعائد كبير — فهجين طيّ الرسغ الذي تشير إليه فقرة الأخطاء في هذه الصفحة هو الطريق الكلاسيكي إلى أسبوع من التذمر.",
      },
    },
    faq: {
      en: [
        { q: "Alternate or curl both arms together?", a: "Both are right, and they differ in clock: alternating lets one biceps rest while the other works — longer total set, heavier per-arm weight; simultaneous curls load both at once — more systemic fatigue, tighter set. Alternating suits accessory slots, simultaneous suits priority ones; the log should note which, because the numbers differ." },
        { q: "Should I rotate my wrists as I curl?", a: "Yes — that rotation is the biceps' second function, and the dumbbell is the only mainline curl that lets it happen: start neutral at the bottom, finish with the palm up at the top, as the instructions' rotation step prescribes. The hammer curl deliberately skips the rotation to train the neighbors; this page's version is the full biceps job description." },
        { q: "One arm is noticeably weaker — should I do extra reps with it?", a: "Same load, fewer questions: let the weak arm set the weight, do your sets, and add two or three extra single-arm reps with the weaker side at the end if the gap bothers you. Never give the strong arm extra work to keep it company — that widens exactly the gap you are closing, and this library's unilateral pages make the same ruling everywhere." },
      ],
      ar: [
        { q: "أبدل الذراعين أم ألفهما معًا؟", a: "كلاهما صحيح، ويختلفان في الساعة: فالتبديل يدع ذات رأس واحدة تراحي بينما تعمل الأخرى — مجموعة إجمالية أطول ووزن أثقل لكل ذراع؛ والمتزامن يحمل الاثنتين معًا — إجهاد جهازي أكبر ومجموعة أضيق. التبديل للخانات المساعدة والمتزامن لخانات الأولوية؛ والسجل ينبغي أن يذكر أيهما، لأن الأرقام تختلف." },
        { q: "هل أدوّر رسغي أثناء اللفّ؟", a: "نعم — فذلك الدوران هو الوظيفة الثانية لذات الرأسين، والدمبل وحدها في خط الكيرل الرئيسي تسمح به: ابدأ محايدًا في القاع واختم بالراحة للأعلى في القمة كما تصف خطوة التدوير في التعليمات. وكيرل المطرقة يتخطى الدوران عمدًا ليدرّب الجيران؛ ونسخة هذه الصفحة هي وصف وظيفة ذات الرأسين الكامل." },
        { q: "ذراع أضعف بشكل ملحوظ — هل أؤدي بها تكرارات إضافية؟", a: "نفس الحمل وأسئلة أقل: دع الذراع الضعيفة تحدد الوزن، وأدِّ مجموعاتك، وأضف تكرارين أو ثلاثة إضافيين بالجهة الضعيفة في النهاية إن أزعجتك الفجوة. ولا تمنح الذراع القوية عملًا إضافيًا مؤاساةً لها — فذلك يوسع بالضبط الفجوة التي تغلقها، وصفحات المكتبة أحادية الجانب تصدر الحكم نفسه في كل مكان." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-curl", hrefAr: "/ar/exercises/barbell-curl", labelEn: "Barbell curl — the heavier sibling", labelAr: "الكيرل بالبار — الشقيق الأثقل" },
      { hrefEn: "/exercises/alternate-hammer-curl", hrefAr: "/ar/exercises/alternate-hammer-curl", labelEn: "Hammer curl — the neutral-grip cousin", labelAr: "كيرل المطرقة — القريب بالقبضة المحايدة" },
      { hrefEn: "/blog/12-week-dumbbell-band-muscle-plan", hrefAr: "/ar/blog/home-muscle-building-guide-simple-weights", labelEn: "12-week dumbbell & band muscle plan", labelAr: "بناء العضلات في المنزل بأوزان بسيطة" },
    ],
  },
};
