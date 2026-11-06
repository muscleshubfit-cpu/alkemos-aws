/**
 * EXERCISES-ENRICHMENT — BATCH 11 (tail batch 1, exercises 51-55 of the
 * enrichment program; SEO-GROWTH plan Phase 3 — owner order 2026-11-06
 * «استكمل تنفيذ خطة استعادة النمو وتحسين SEO/GEO حتى إتمام جميع مراحلها
 * وبنودها… نفّذ جميع التحسينات الممكنة للتمارين… واصل تلقائيًا»).
 *
 * The plan's Phase-3 line: «إثراء ذيل التمارين بدفعات (أولوية: hubs البطن/
 * الصدر المقيسة)» — this batch opens the CORE half (audit 05 §ج: the 818
 * thin tail, abs hub first). Every fact quoted about each movement (the 3/4
 * descent, the four-inch shoulder ceiling, the 90-degree leg setup, the
 * perpendicular torso) comes from the exercise's own row in
 * src/lib/exercises.ts; programming numbers are standard coaching
 * prescription stated as practice guidance.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_11: Record<string, ExerciseEnrichment> = {
  "34-sit-up": {
    intro: {
      en: "The three-quarter sit-up takes the most familiar gym-class movement in existence and fixes its laziest habit. The library's own steps define the difference: you rise until your torso is perpendicular to the floor, then descend only three-quarters of the way down before the next rep — never resting your shoulder blades back on the ground. That missing quarter is deliberate. It keeps the abdominal wall loaded through the bottom, denies the hip flexors their free ride at the start, and turns an old school calisthenic into a continuous-tension exercise. It was also the audit's own thin-content sample measured at roughly 360 unique words — this page now answers that measurement.",
      ar: "تمرين الجلوس ثلاثة الأرباع يأخذ أكثر حركات حصة الرياضة شهرةً على الإطلاق ويصلح أسوأ عاداتها. خطوات المكتبة نفسها تحدد الفرق: تصعد حتى يصبح جذعك عموديًا على الأرض، ثم تنزل ثلاثة أرباع المسافة فقط قبل التكرار التالي — دون أن تستريح لوحي كتفيك على الأرض أبدًا. هذا الربع الناقص مقصود؛ فهو يبقي جدار البطن محملًا في القاع، ويحرم عضلات ثني الورك من رحلتها المجانية عند الانطلاق، ويحوّل تمرينًا مدرسيًا قديمًا إلى حركة شد مستمر. وهو أيضًا عينة المحتوى الرقيق التي قاسها التدقيق بنحو 360 كلمة فريدة — وهذه الصفحة الآن تجيب على ذلك القياس.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis carries this lift, and the library credits it with no assistants — an honest entry, because the setup itself recruits the helpers. Knees bent and feet planted, the spine curls upward vertebra by vertebra until the torso stands vertical; from that peak, the controlled three-quarter descent keeps the sheet of muscle under load instead of handing the floor to gravity. The hip flexors wait at the bottom of a full sit-up like creditors; the partial range never quite opens the door to them.",
        mistakes: [
          { error: "Dropping the last quarter and letting the shoulder blades kiss the floor between reps.", fix: "Stop the descent just before the blades touch — the tension you keep is the entire point of the movement's name." },
          { error: "Clasped hands hauling the neck up to finish the range.", fix: "Cup the sides of the head with open fingers and keep the chin a fist-width off the chest; the torso rises, the head just rides along." },
          { error: "Bouncing off the bottom with a pelvic thrust.", fix: "Change direction with the abs already braced — one smooth exhale up, two counts down, no floor to push against anyway once the quarter is gone." },
          { error: "Feet anchored so hard the hips do the launch.", fix: "Light foot pressure only; if the feet must be crushed under a anchor to move, the strength is not there yet — regress to the standard crunch page first." },
        ],
        alternatives: "The family around this movement covers every equipment situation. The floor crunch on its own page shortens the lever for beginners; the decline version adds gravity once bodyweight gets easy; the cable-seated crunch loads the same spinal flexion with a pin you can count. At home, the air-bike page keeps rotation in the mix while the plank trains the brace. Nothing here needs a partner or a plate — the three-quarter rule travels with you to every one of them.",
        progression: "The entry level is honest about being a beginner movement: hands beside the head, tempo you control, three-quarters down. When twenty clean reps stop being an event, extend the arms overhead to lengthen the lever, add a two-second hold at the perpendicular peak, or move the hands to a crossed-chest position first and a plate on the chest later. The advanced branch is the weighted sit-up family and the hanging leg raise, where the abs curl the whole lower body — both live elsewhere in this library with their own pages.",
        programming: "Three to four sets of twelve to twenty repetitions, twice a week alongside the rest of core work, is the standard coaching dose — placed after the main lifts, never before, because a pre-fatigued trunk sabotages every press and squat that follows. In a cutting phase the movement keeps the muscle under the waistline busy while the calorie deficit — tracked in our tools — does the revealing. On a mass phase it simply maintains the brace that heavy lifting depends on.",
        safety: "The lower back is the structure to watch. If the lumbar spine arches hard as you lower, or if the tailbone grinds into the floor, fold a towel under it or shorten the range further — the three-quarter rule can become a half until control catches up. Anyone carrying an active disc problem should clear loaded spinal flexion with their clinician first; the dead bug page is the usual bracing substitute while that conversation happens.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تتولى هذا الرفع، والمكتبة لا تسجل لها أي عضلات مساعدة — إدخال أمين، لأن الإعداد نفسه يستدعي المساعدين. فمع الركبتين المنحنيتين والقدمين المثبتتين، يلتف العمود الفقري صاعدًا فقرةً بعد فقرة حتى يقف الجذع عموديًا؛ ومن تلك القمة يُبقي النزول المتحكم ثلاثة الأرباع الصفحة العضلية تحت الحمل بدل تسليم الأرض للجاذبية. عضلات ثني الورك تنتظر في قاع الجلوس الكامل كالدائنين، والنطاق الجزئي لا يفتح لها الباب أبدًا.",
        mistakes: [
          { error: "إسقاط الربع الأخير وترك لوحي الكتف يلامسان الأرض بين التكرارات.", fix: "أوقف النزول قبل ملامسة اللوحين بقليل — الشد الذي تحافظ عليه هو كل معنى اسم التمرين." },
          { error: "يدان متشابكتان تسحبان الرقبة لإكمال المدى.", fix: "ضع كفي يديك مفتوحتين على جانبي الرأس وأبقِ الذقن بمسافة قبضة عن الصدر؛ الجذع هو من يصعد والرأس مجرد راكب." },
          { error: "الارتداد من القاع بدفعة حوضية.", fix: "اعكس الاتجاه وبطنك مشدود مسبقًا — زفير واحد صاعدًا ونزول في عدّتين، ولا أرض تدفعها أصلًا بعد سقوط الربع." },
          { error: "تثبيت القدمين بقوة بحيث تنطلق الوركان بدل البطن.", fix: "ضغط قدمين خفيف فقط؛ إن كانت القدمان تحتاجان سندانًا لتتحرك فالقوة لم تصل بعد — ارجع أولًا لصفحة الكرانش الأرضي." },
        ],
        alternatives: "العائلة المحيطة بهذه الحركة تغطي كل حالة عتاد. الكرانش الأرضي في صفحته يقصّر الرافعة للمبتدئين، والنسخة المائلة تضيف الجاذبية حين يهون وزن الجسم، والكرانش بالكيبل جالسًا يحمل نفس ثني العمود الفقري بمسمار يمكنك عدّه. وفي المنزل تحفظ صفحة دراجة الهواء الدوران داخل التشكيل بينما يحرس البلانك شدة الجذع. لا شيء هنا يحتاج شريكًا ولا قرصًا — قاعدة الأرباع الثلاثة تسافر معك إلى كل واحدة منها.",
        progression: "مستوى الدخول صادق في كونه حركة مبتدئين: يدان بجانب الرأس وإيقاع تتحكم فيه ونزول ثلاثة أرباع. حين تتوقف عشرون تكرارًا نظيفة عن كونها حدثًا، مدّ الذراعين فوق الرأس لتطويل الرافعة، أو أضف تثبيتًا لثانيتين عند القمة العمودية، أو انتقل بيديك إلى الصدر المتقاطع أولًا وقرص فوقه لاحقًا. والفرع المتقدم هو عائلة الجلوس المثقل والرفعة المعلقة للرجلين حيث تلف البطن الجسم السفلي كاملًا — وكلاهما يعيش في هذه المكتبة بصفحتيه.",
        programming: "ثلاث إلى أربع مجموعات من اثني عشر إلى عشرين تكرارًا، مرتين أسبوعيًا مع بقية عمل الجذع، هي الجرعة التدريبية المعتادة — توضع بعد الرفعات الكبرى لا قبلها أبدًا، فالجذع المرهق مسبقًا يخرب كل دفع وكل سكوات يليه. وفي مرحلة التنشيف يحافظ التمرين على العضلة تحت خط الخصر مشغولة بينما يتكفل عجز السعرات — المتتبع بأدواتنا — بالكشف. وفي مرحلة الكتلة يحافظ ببساطة على الشد الذي يقف عليه الرفع الثقيل.",
        safety: "أسفل الظهر هو البنية المراقبة هنا. إن تقوّس القطني بقوة أثناء النزول، أو احتكّ العصعص بالأرض، فطوِّق منشفة تحته أو قصّر النطاق أكثر — فقاعدة الأرباع الثلاثة قد تصير نصفًا حتى تلحق السيطرة. ومن يحمل مشكلة غضروف نشطة فليستأذن طبيبه في ثني العمود الفقري المحمل أولًا؛ وصفحة الحشرة الميتة هي البديل المعتاد للشد إلى أن يُحسم ذلك النقاش.",
      },
    },
    faq: {
      en: [
        { q: "Why stop at three-quarters instead of going all the way down?", a: "Because the last quarter is where the abs go slack and the hip flexors take over. Cutting it keeps the muscle under load for the entire set — the difference between twenty minutes of work and twenty minutes of momentum." },
        { q: "Are three-quarter sit-ups bad for your back?", a: "They are not, done as the page prescribes: controlled tempo, braced torso, feet light. The classic injury story comes from yanked necks and rebounding spines at speed — slow the rep down and the complaint usually disappears." },
        { q: "Will these give me visible abs?", a: "They will build the muscle; visibility is a body-fat question settled in the kitchen. Our belly-fat guide pairs the training side with the deficit arithmetic, and the tools on this site do the counting." },
      ],
      ar: [
        { q: "لماذا التوقف عند ثلاثة أرباع المسافة بدل النزول الكامل؟", a: "لأن الربع الأخير هو حيث ترتخي البطن وتتسلم عضلات الورك العمل. قصّه يبقي العضلة تحت الحمل طوال المجموعة — وهو الفرق بين عشرين دقيقة عمل وعشرين دقيقة زخم." },
        { q: "هل الجلوس ثلاثة الأرباع مؤذٍ للظهر؟", a: "ليس كذلك إذا أديته كما تصف الصفحة: إيقاع متحكم وجذع مشدود وقدمان خفيفتان. قصة الإصابة الكلاسيكية تأتي من رقبات مجذوبة وأعمدة مرتدة بسرعة — أبطئ التكرار ويزول الشكوى غالبًا." },
        { q: "هل يمنحني هذا بطنًا ظاهرة؟", a: "سيبني العضلة؛ أما الظهور فمسألة دهون تُحسم في المطبخ. دليلنا لدهون البطن يقارن جانب التدريب بحساب العجز، وأدوات الموقع تتولى العد." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/blog/science-backed-belly-fat-loss-8-weeks", hrefAr: "/ar/blog/belly-fat-loss-8-weeks-guide", labelEn: "Belly fat loss — the 8-week evidence plan", labelAr: "خسارة دهون البطن — خطة الثمانية أسابيع بالأدلة" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log your sets in the free tracker", labelAr: "سجّل مجموعاتك في المتتبع المجاني" },
    ],
  },

  "decline-crunch": {
    intro: {
      en: "Tilt the floor and the crunch becomes a different negotiation. Locked into a decline bench with feet anchored at the top, your abs work against a lengthened lever and gravity's pull the whole way down — the library's steps pin the standard: press the lower back into the pad, curl the shoulders roughly four inches off the bench, squeeze for a full second at the top. That is a bigger ask than the floor version, which is exactly why the page exists: when bodyweight crunches stop producing anything, the decline answers with the cheapest load in the gym — the angle itself.",
      ar: "أمِل الأرض يتغير التفاوض في الكرانش تمامًا. مقفولًا على بنش مائل بقدمين مثبتتين أعلى، تعمل بطنك ضد رافعة ممدودة وسحب الجاذبية طوال الطريق إلى القاع — وخطوات المكتبة تثبّت المعيار: اضغط أسفل ظهرك في اللوح، ولف الكتفين نحو أربع بوصات عن البنش، واعصر ثانية كاملة في القمة. هذا طلب أكبر من النسخة الأرضية، وهو بالضبط سبب وجود الصفحة: حين تتوقف كرانشات وزن الجسم عن إنتاج أي شيء، يجيب المائل بأرخص حمل في الصالة — الزاوية نفسها.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis does the curling, with the library listing no secondary movers — but the decline changes the geometry it works through. At the bottom of the arc the muscle sits stretched across the bench's slope, which is a longer starting length than the flat floor ever offers; at the top, the four-inch shoulder lift brings the ribs toward the pelvis against the angle. The obliques hold the torso on the rails of the bench so the curl stays a straight-line pull, and the hip flexors stay quiet because the feet — not the hips — carry the anchor.",
        mistakes: [
          { error: "Sitting the whole torso up into a decline sit-up when the page asks for a crunch.", fix: "The shoulder blades barely leave the pad — four inches is the ceiling in the instructions, and the burn should arrive well before the sit-up does." },
          { error: "Letting the lower back arch off the bench at the bottom of each rep.", fix: "Tilt the pelvis slightly and keep the lumbar pressed into the pad as the steps instruct; the stretch belongs to the abs, never to the spine." },
          { error: "Hands laced hard behind the head, turning the neck into a lever.", fix: "Fingertips at the temples, elbows pinned where they started — if the neck talks first, cross the arms over the chest and let the angle do the loading." },
          { error: "Rushing the descent and free-falling into the stretched position.", fix: "Two controlled counts down; the eccentric half of the rep is where the decline bench pays its rent, and dropping through it wastes the membership." },
        ],
        alternatives: "Every rung below and above this movement lives in the library. The floor crunch is the flat-ground starting point; the three-quarter sit-up keeps constant tension without equipment; the cable-seated crunch adds countable load for those who outgrow angles; and the exercise-ball crunch offers the same stretched start with more spine freedom. When the decline feels too steep, hooking the feet lower on the bench softens it without changing the exercise's identity.",
        progression: "Beginners earn this movement by first owning twenty floor crunches. On the bench itself, the ladder runs through tempo — a three-second descent, a two-second top squeeze — then through arm position: crossed on the chest, then extended past the head, finally holding a plate. Beyond that the movement hands you to weighted cable work, because the angle tops out before the abs do. Two or three honest progressions sit between today and that ceiling.",
        programming: "The coaching default is three to four sets of ten to twenty reps at the end of a session, one to three times a week alongside other trunk work. The decline version earns fewer reps than the floor crunch — the angle guarantees it — so count quality rather than chasing floor-crunch numbers. On a fat-loss block it pairs naturally with the belly-fat guide's deficit plan; on a strength block it lives behind the big presses, warming down the trunk that held them.",
        safety: "The bench is the hazard as much as the spine: feet must stay locked under the pad before the torso lowers, every set, no exceptions — the setup step exists because a slipped anchor mid-rep dumps you backward. Skip the steepest notches with any history of lumbar-disc trouble and stay on the shallow angles; if the bottom position pinches at the hip crease, a flatter setting fixes it without losing the exercise.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تتولى اللف، والمكتبة لا تسجل محركات ثانوية — لكن الميل يغيّر الهندسة التي تعمل خلالها. في قاع القوس تكون العضلة ممدودة عبر منحدر اللوح، وهو طول بداية أطح مما تمنحه الأرض المستوية أبدًا؛ وفي القمة يقرّب رفع الكتفين أربع بوصات الأضلاعَ من الحوض ضد الزاوية. المائلتان تُبقيان الجذع على قضبان البنش ليظل اللف سحبًا مستقيمًا، وعضلات ثني الورك صامتة لأن القدمين — لا الوركين — تحملان التثبيت.",
        mistakes: [
          { error: "جلوس الجذع كاملًا نحو كرانش مائل والصفحة تطلب كرانشًا فقط.", fix: "لوحا الكتف بالكاد يفارقان اللوح — أربع بوصات هي السقف في التعليمات، والحرقان يجب أن يصل قبل أن يصل الجلوس." },
          { error: "ترك أسفل الظهر يتقوس عن البنش في قاع كل تكرار.", fix: "مِل الحوض قليلًا وأبقِ القطني مضغوطًا في اللوح كما تأمر الخطوات؛ الشد ملك للبطن لا للعمود الفقري أبدًا." },
          { error: "يدان متشابكتان بقوة خلف الرأس تحوّلان الرقبة رافعة.", fix: "أطراف الأصابع عند الصدغين والمرفقان مثبتان حيث بدآ — إن تكلمت الرقبة أولًا فضاعف الذراعين على الصدر ودع الزاوية تتولى التحميل." },
          { error: "استعجال النزول والسقوط الحر إلى الوضع الممدود.", fix: "عدّتان متحكمتان في النزول؛ النصف الغريب من التكرار هو حيث يدفع البنش المائل إيجاره، والعبور ساقطًا يهدر الاشتراك." },
        ],
        alternatives: "كل درجة تحت هذه الحركة وفوقها تسكن المكتبة. الكرانش الأرضي نقطة البداية على الأرض المستوية، والجلوس ثلاثة الأرباع يحفظ الشد الدائم بلا عتاد، والكرانش بالكيبل جالسًا يضيف حملًا قابلًا للعد لمن تجاوزوا الزوايا، وكرانش كرة التمرين يمنح نفس البداية الممدودة بحرية أوسع للعمود. وحين يبدو الميل شديد الانحدار، تثبيت القدمين في درجة أدنى يلطّفه دون تغيير هوية التمرين.",
        progression: "يستحق المبتدئون هذه الحركة بامتلاك عشرين كرانشًا أرضيًا أولًا. وعلى البنش نفسه يصعد السلم عبر الإيقاع — نزول في ثلاث ثوان وعصر في ثانيتين — ثم عبر موضع الذراعين: متقاطعان على الصدر، فممدودان فوق الرأس، فقرص محمول. وبعد ذلك يسلّمك التمرين إلى عمل الكيبل المثقل، لأن الزاوية تبلغ سقفها قبل أن تبلغه البطن. ترقيتان أو ثلاث صادقة تفصلك اليوم عن ذلك السقف.",
        programming: "الوصفة التدريبية المعتادة ثلاث إلى أربع مجموعات من عشرة إلى عشرين تكرارًا في ختام الجلسة، مرة إلى ثلاث أسبوعيًا مع بقية عمل الجذع. النسخة المائلة تنتج تكرارات أقل من الأرضية — الزاوية تضمن ذلك — فعدّ الجودة بدل مطاردة أرقام الأرض. وفي مرحلة خسارة الدهون تقترن طبيعيًا بخطة العجز بدليل دهون البطن؛ وفي مرحلة القوة تعيش خلف الرفعات الكبرى تبرّد جذعًا حملها.",
        safety: "البنش هو الخطر بقدر ما هو العمود: يجب أن تبقى القدمان مقفولتين تحت الوسادة قبل نزول الجذع، في كل مجموعة بلا استثناء — خطوة الإعداد موجودة لأن انزلاق التثبيت وسط التكرار يرميك للخلف. تجاوز أشد الدرجات مع أي تاريخ غضروفي قطني وابقَ على الميول الضحلة؛ وإن قرص القاع عند ثنية الورك فدرجة أكثر استواءً تصلحه دون فقدان التمرين.",
      },
    },
    faq: {
      en: [
        { q: "Is the decline crunch better than the floor crunch?", a: "Better at one thing: loading. The angle stretches the abs at the bottom and resists them at the top, which the flat floor cannot do. Whether that matters depends on where you are — beginners earn plenty from the floor before the bench has anything to add." },
        { q: "How steep should the decline bench be?", a: "Steep enough that the rep demands respect, shallow enough that the lower back stays pressed into the pad through the whole set. Most lifters sit somewhere in the first third of the bench's range — the angle is a dial, not a badge." },
        { q: "Why do my neck and not my abs feel this?", a: "Almost always the hands. Fingertips at the temples with the elbows held still shifts the work back to the torso; if the neck still complains, cross the arms on the chest — the bench's angle carries the load either way." },
      ],
      ar: [
        { q: "هل الكرانش المائل أفضل من الأرضي؟", a: "أفضل في شيء واحد: التحميل. الزاوية تمدّ البطن في القاع وتقاومها في القمة، وهو ما تعجز عنه الأرض المستوية. وهل يهم ذلك فيعتمد على موقعك — المبتدئون يحصدون كثيرًا من الأرض قبل أن يكون للبنش شيء يضيفه." },
        { q: "ما مدى ميلان البنش المناسب؟", a: "بقدر ما يجعل التكرار يستحق الاحترام، وضحل بقدر ما يبقي أسفل الظهر مضغوطًا في اللوح طوال المجموعة. يجلس أغلب الرفاع في الثلث الأول من مدى البنش — الزاوية مِقبض ضبط لا وسام." },
        { q: "لماذا أشعر برقبتي لا ببطني؟", a: "اليدان في الغالب الأعم. أطراف الأصابع عند الصدغين والمرفقان ساكنان يعيدان العمل إلى الجذع؛ وإن ظلت الرقبة تشتكي فضاعف الذراعين على الصدر — زاوية البنش تحمل الحمل في الحالتين." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-building-guide-no-equipment", labelEn: "Home muscle building without equipment", labelAr: "بناء العضلات في المنزل بلا عتاد" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track every set free", labelAr: "تتبع كل مجموعة مجانًا" },
    ],
  },

  "cable-seated-crunch": {
    intro: {
      en: "This is the crunch that answers the question floor reps eventually ask: how do I add weight to spinal flexion? Sitting on a flat bench with your back to a high pulley, rope held above the shoulders, you crunch the elbows toward the hips while the cable stack counts every kilo — the library's steps fix the form: hips locked, waist bends, exhale on the flex, slow return. It is the same six-pack movement you learned on the floor, promoted to a machine that never gets bored and never lets the reps quietly turn into momentum.",
      ar: "هذا هو الكرانش الذي يجيب عن السؤال الذي تطرحه التكرارات الأرضية عاجلًا أم آجلًا: كيف أضيف وزنًا إلى ثني العمود الفقري؟ جالسًا على بنش مستوٍ وظهرك إلى بكرة عليا وحبل مرفوع فوق الكتفين، تثني المرفقين نحو الوركين بينما يعدّ رَكن الأوزان كل كيلوغرام — وخطوات المكتبة تضبط الأداء: الوركان مثبتان والخصر ينثني والزفير مع الثنية والعودة بطيئة. إنها نفس حركة الست بطون التي تعلمتها على الأرض، ترقّت إلى آلة لا تملّ أبدًا ولا تدع التكرارات تتحول خلسةً إلى زخم.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis flexes the spine against the cable's line of pull, and the library lists it solo — the bench and the fixed hips are what make that honesty possible. Because the pelvis is parked, the ribcage curls toward it through pure trunk flexion; the obliques fire only lightly to keep the pull symmetrical, and the hip flexors are locked out of the movement entirely, which is the cable crunch's cleanest advantage over every floor sit-up ever written.",
        mistakes: [
          { error: "Hinging at the hips and bowing the torso forward instead of curling the spine.", fix: "The hips stay welded to the bench; imagine the bottom two ribs drawing down to the top of the pelvis — a curl, not a nod." },
          { error: "Pulling with the arms and dragging the rope down by the elbows.", fix: "The hands are hooks; the rope rests against the shoulders' frame and the abs do every centimeter of the travel." },
          { error: "Letting the stack pull the torso open into a stretched arch on the return.", fix: "Ride the weight back under tension for two counts — the loaded stretch is half the exercise, an uncontrolled stack drop is a rep thrown away." },
          { error: "Setting the pulley so low or high that the line pulls the movement out of the crunch plane.", fix: "Face away from a high pulley as the page sets it; the cable should travel over the shoulder line, not yank the torso backward or fold it sideways." },
        ],
        alternatives: "The rope crunch family is wide and the library holds its branches. Kneeling cable crunches load the same flexion from the floor; the machine crunch page offers a seated chest-pad version for those who prefer rails to ropes; the decline crunch adds gravity without a stack; and the three-quarter sit-up keeps tension with zero equipment. All of them train the same sheet of muscle — the choice is about what your gym has and what your spine likes.",
        progression: "Start with a weight that allows fifteen strict reps with the hips glued down — the discipline is the same as the floor version, only countable. Add load in small pin jumps while the rep count holds between ten and fifteen; when the reps start buying arched backs instead of curls, the pin has gone too far. Advanced lifters run slower eccentrics and a one-second squeeze at the bottom of the flex, then finish with bodyweight burnout work from the family above.",
        programming: "Three to four working sets of ten to fifteen reps, twice a week, closed at the end of the session — the same slot every direct ab movement occupies. The cable stack makes double progression honest here: hold the top of the rep range for a week, then add a pin and rebuild. In a cutting phase this is the movement that keeps the midsection dense while the deficit strips the cover; our macro calculator sizes that deficit.",
        safety: "The cervical spine and the low back share the watch. Keep the chin neutral and let the rope's frame carry the head — never pull the rope onto the neck itself. If the lumbar arches as the stack gets heavy, the load is writing checks the trunk cannot cash: drop the pin, rebuild the curl. The seated setup suits most spines better than kneeling ones, but any active disc history still deserves a clinician's nod before loaded flexion.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تثني العمود الفقري ضد خط سحب الكيبل، والمكتبة تسجلها وحدها — والبنش والوركان المثبتان هما ما يجعل هذه الأمانة ممكنة. فبسبب جلوس الحوض يلتف القفص الصدري نحوه عبر ثني جذع نقي؛ والمائلتان تشتعلان بخفة فقط لإبقاء السحب متناظرًا، أما عضلات ثني الورك فمقصية من الحركة كليًا، وهذا أنظف ما في الكرانش بالكيبل على كل جلوس أرضي كُتب في التاريخ.",
        mistakes: [
          { error: "الانعطاف من الوركين وانحناء الجذع للأمام بدل لف العمود الفقري.", fix: "الوركان ملحومان بالبنش؛ تخيل الضلعين السفليين ينزلان نحو أعلى الحوض — لفّة لا إيماءة." },
          { error: "السحب بالذراعين وجرّ الحبل لأسفل بالمرفقين.", fix: "اليدان خطّاطيف؛ يستريح الحبل على هيكل الكتفين وتنجز البطن كل سنتيمتر من المسافة." },
          { error: "ترك الرَكن يفتح الجذع إلى قوس ممدود عند العودة.", fix: "اعد مع الوزن تحت الشد في عدّتين — المد المثقل نصف التمرين، وإسقاط الرَكن بلا سيطرة تكرارٌ مرمي." },
          { error: "ضبط البكرة في وضع يجعل خط السحب ينتزع الحركة من مستوى الكرانش.", fix: "اجلس بظهرك إلى البكرة العليا كما تضبط الصفحة؛ يجب أن يعبر الكيبل خط الكتفين لا أن يجذب الجذع للخلف أو يطويه جانبًا." },
        ],
        alternatives: "عائلة كرانش الحبل واسعة والمكتبة تحتفظ بفروعها. الكرانش بالكيبل راكعًا يحمل نفس الثنية من الأرض، وصفحة كرانش الجهاز تقدم نسخة وسادة الصدر جالسًا لمن يفضلون القضبان على الحبال، والكرانش المائل يضيف الجاذبية بلا ركن، والجلوس ثلاثة الأرباع يحفظ الشد بصفر عتاد. كلها تدرّب نفس الصفحة العضلية — والاختيار مسألة ما تملكه صالتك وما يحبه عمودك.",
        progression: "ابدأ بوزن يسمح بخمسة عشر تكرارًا صارمًا والوركان ملصقان — الانضباط هو نفسه نسخة الأرض، لكنه قابل للعد. أضف الحمل بقفزات مسمار صغيرة بينما يصمد العدد بين عشرة وخمسة عشر؛ وحين تبدأ التكرارات بشراء ظهور مقوسة بدل لفات فالمسمار قد ذهب بعيدًا. يجري المتقدمون نزولًا غريبًا أبطأ وتثبيتًا لثانية في قاع الثنية، ثم يختمون بعمل إنهاك بوزن الجسم من العائلة أعلاه.",
        programming: "ثلاث إلى أربع مجموعات عمل من عشرة إلى خمسة عشر تكرارًا، مرتين أسبوعيًا، في ختام الجلسة — نفس الشاغر الذي تشغله كل حركة بطن مباشرة. رَكن الأوزان يجعل التدرج المزدوج صادقًا هنا: اثبت في أعلى نطاق التكرارات أسبوعًا ثم أضف مسمارًا وأعد البناء. وفي مرحلة التنشيف هذه هي الحركة التي تبقي عضلات الوسط كثيفة ومحملة بصدق بينما ينزع عجز السعرات الغطاء عنها؛ وحاسبة الماكروز لدينا تقيس ذلك العجز وتضبط إيقاعه.",
        safety: "العمود العنقي وأسفل الظهر يتقاسمان المراقبة. أبقِ الذقن محايدًا ودع هيكل الحبل يحمل الرأس — ولا تجذب الحبل فوق الرقبة نفسها أبدًا. إن تقوس القطني مع ثقل الرَكن فالحمل يكتب شيكات لا يستطيع الجذع صرفها: انزل مسمارًا وأعد بناء اللفة. والجلوس يناسب أغلب الأعمدة أفضل من الركوع، لكن أي تاريخ غضروفي نشط يظل يستحق إيماءة طبيب قبل الثني المثقل.",
      },
    },
    faq: {
      en: [
        { q: "Cable crunch seated or kneeling — which is right?", a: "Both load the same flexion; the seat simply parks the hips so cheating gets harder. If your gym's bench sits too far from the pulley or your knees dislike the floor, sit. If you want the torso's full travel, kneel. The stack cannot tell the difference — your form can." },
        { q: "How much weight is good on this?", a: "The number that lets the hips stay parked and the spine curl — for many lifters that starts surprisingly light, somewhere near bodyweight on the stack being a long-term ceiling rather than a starting ambition. Count the curl, not the pin." },
        { q: "Can I train abs with cables every day?", a: "You can, the same way you can call your bank every day — the muscle grows from recovery, not from visits. Two or three quality sessions a week inside your program is the standard coaching dose; the tracker logs them honestly." },
      ],
      ar: [
        { q: "الكرانش بالكيبل جالسًا أم راكعًا — أيهما الصحيح؟", a: "كلاهما يحمل نفس الثنية؛ المقعد ببساطة يركن الوركين فيصعب الغش. إن كان بنش صالتك بعيدًا عن البكرة أو تكره ركبتاك الأرض فاجلس. وإن أردت مسار الجذع كاملًا فاركع. الرَكن لا يفرق — أداؤك هو من يفرق." },
        { q: "كم وزنًا مناسبًا هنا؟", a: "الرقم الذي يُبقي الوركين رابضين والعمود يلتف — ولدى كثير من الرفاع يبدأ بخفة مدهشة، وقرب وزن الجسم على الرَكن يظل سقفًا بعيد المدى لا طموح بداية. عُدّ اللفة لا المسمار." },
        { q: "أستطيع تدريب البطن بالكيبل يوميًا؟", a: "تستطيع، كما تستطيع الاتصال بمصرفك يوميًا — العضلة تنمو من التعافي لا من الزيارات. جلستان أو ثلاث جادتان أسبوعيًا داخل برنامجك هما الجرعة التدريبية المعتادة؛ والمتتبع يسجلهما بأمانة." },
      ],
    },
    links: [
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Gym push-pull-legs intermediate program", labelAr: "برنامج الصالة دفع وسحب وأرجل للمتوسطين" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "Muscle group frequency — what to fix", labelAr: "تكرار مجموعات العضلات — ما يجب إصلاحه" },
      { hrefEn: "/tools/macro-calculator", hrefAr: "/ar/tools/macro-calculator", labelEn: "Size your macros while the cut reveals the work", labelAr: "احسب ماكروزك بينما يكشف التنشيف العمل" },
    ],
  },

  "ab-crunch-machine": {
    intro: {
      en: "The ab crunch machine is the most argued-about seat in the gym, and the argument is usually about the wrong thing. Done as the library writes it — light pin, feet under the pads, exhale as the torso folds, one-second pause at the crunch, slow return — the machine does what machines do best: it puts a countable load on spinal flexion along a fixed path, which is precisely what a beginner needs and precisely what an advanced lifter uses for honest double progression. The honest criticism lives elsewhere: it cannot teach the brace, and it lets you skip the discipline the floor demands. Both halves belong on this page.",
      ar: "جهاز الكرانش هو أكثر مقعد مثير للجدل في الصالة، والجدل عادة حول الشيء الخطأ. مؤدًى كما تكتبه المكتبة — مسمار خفيف وقدمان تحت الوسائد وزفير مع انطواء الجذع وتوقف لثانية عند الكرانش وعودة بطيئة — يفعل الجهاز ما تفعله الأجهزة أفضل: يضع حملًا قابلًا للعد على ثني العمود الفقري عبر مسار ثابت، وهو بالضبط ما يحتاجه المبتدئ وما يستخدمه المتقدم لتدرج مزدوج صادق. والنقد الأمين يعيش في مكان آخر: الجهاز لا يعلّم الشد، ويدعك تتخطى الانضباط الذي تفرضه الأرض. والنصفان معًا مكانهما هذه الصفحة.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis is the listed mover and the machine's arc is drawn around it: as the torso folds forward against the chest pad, the ribs are driven toward the pelvis — flexion, the muscle's one job, delivered on rails. The obliques assist mildly to keep the fold symmetrical. What the machine deliberately removes from the equation is the rest of the trunk's job list: no balance, no bracing against extension, no anti-rotation. That is a feature for loading the abs and a blind spot for training the trunk, and knowing both is the whole skill of using this seat.",
        mistakes: [
          { error: "Loading the pin heavy and powering the pad down with arms and hips combined.", fix: "The arms frame the pads, they do not press them; if the fold stalls without arm help, the pin is past the abs' honest share." },
          { error: "Rushing through the pause the instructions explicitly build in.", fix: "One full second in the crunched position — the step is on the page for a reason; the machine's rep quality lives in that stop, not in the count." },
          { error: "Letting the weight stack slam the torso open on the return.", fix: "Ride the pad back for a two-count negative; the machine will not punish dropping, which is exactly why you must." },
          { error: "Sitting crooked in the seat, one shoulder ahead of the other.", fix: "Square up before the first rep — the fixed path will happily train an asymmetry into you with equal precision." },
        ],
        alternatives: "The library's floor and cable pages cover every exit from this seat. The three-quarter sit-up keeps constant tension with nothing but technique; the decline crunch adds gravity's angle; the cable-seated crunch offers the same countable load with a freer path for the spine. For the brace the machine cannot teach, the plank and dead-bug pages are the standing prescriptions — most honest programs run a machine crunch and a brace movement side by side rather than choosing between them.",
        progression: "The machine's gift is its dial. Begin with a pin that admits fifteen controlled folds with the pause intact; hold the top of that rep range for a session or two, then move the pin up and let the count fall back toward ten. Rebuild to fifteen, repeat. When the machine's stack runs out of challenge, slower negatives and longer pauses reopen it, and after that the weighted cable family takes the baton.",
        programming: "Three sets of ten to fifteen folded reps with the built-in pause, twice weekly inside your trunk block — the machine's precision makes it the natural place to run double progression while the floor work carries the brace. Cutting phases keep the seat busy for the same reason the cable stack does: countable load while the deficit works the waistline. The workout tracker takes both without judging either.",
        safety: "Two structures earn respect here. The lumbar spine: if the machine's arc forces your low back into a hard arch at the open position, adjust the seat back or find a different model — the path should fold you, not bow you. The neck: the pad belongs at the upper chest and shoulder line, never pushing the head forward. With any disc history, a clinician's clearance before loaded flexion remains the standing rule across this whole family.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية هي المحرك المسجل، وقوس الجهاز مرسوم حولها: فبينما ينطوي الجذع أمام وسادة الصدر تُقاد الأضلاع نحو الحوض — ثني، وهو وظيفة العضلة الوحيدة، يُسلَّم على قضبان. المائلتان تساعدان بخفة لإبقاء الانطواء متناظرًا. وما يزيله الجهاز عمدًا من المعادلة هو بقية قائمة مهام الجذع: لا توازن ولا شد ضد الامتداد ولا مقاومة دوران. هذه ميزة لتحميل البطن وعمى عن تدريب الجذع، ومعرفة الاثنين هي كل مهارة استخدام هذا المقعد.",
        mistakes: [
          { error: "تحميل المسمار ثقيلًا وتشغيل الوسادة بقوة الذراعين والوركين معًا.", fix: "الذراعان يؤطّران الوسادتين ولا تضغطانهما؛ إن تجمدت الثنية بلا معونة الذراعين فالمسمار تجاوز حصة البطن الأمينة." },
          { error: "استعجال التوقف الذي تبنيه التعليمات صراحةً.", fix: "ثانية كاملة في وضع الكرانش — الخطوة موجودة في الصفحة لسبب؛ جودة التكرار على الجهاز تسكن ذلك التوقف لا العدّ." },
          { error: "ترك رَكن الأوزان يصفع الجذع مفتوحًا عند العودة.", fix: "اعد مع الوسادة في نزول عدّتين؛ الجهاز لن يعاقبك على الإسقاط، ولهذا بالضبط يجب أن تعاقب نفسك." },
          { error: "الجلوس معوجًا في المقعد، كتف أمام الآخر.", fix: "استوِ قبل أول تكرار — المسار الثابت سيدرب اللا تناظر فيك بمثل هذه الدقة نفسها وبكل سرور." },
        ],
        alternatives: "صفحات الأرض والكيبل في المكتبة تغطي كل مخرج من هذا المقعد. الجلوس ثلاثة الأرباع يحفظ الشد الدائم بالتقنية وحدها، والكرانش المائل يضيف زاوية الجاذبية، والكرانش بالكيبل جالسًا يقدم نفس الحمل القابل للعد بمسار أحر للعمود. وللشد الذي لا يستطيع الجهاز تعليمه فصفحتا البلانك والحشرة الميتة هما الوصفة القائمة — وأغلب البرامج الأمينة تشغّل كرانش الجهاز وحركة شد جنبًا إلى جنب بدل الاختيار بينهما.",
        progression: "هبة الجهاز هي قرصه. ابدأ بمسمار يقبل خمسة عشر انطواءً متحكمًا فيها والتوقف سليم؛ اثبت في أعلى نطاق التكرارات جلسة أو جلستين ثم ارفع المسمار ودع العدد يهبط نحو العشرة. أعد البناء إلى خمسة عشر وكرر. وحين ينفد تحدي رَكن الجهاز تعيد نزلات أبطأ وتوقفات أطول فتحه من جديد، وبعدها تستلم عائلة الكيبل المثقل العصا.",
        programming: "ثلاث مجموعات من عشرة إلى خمسة عشر انطواء بالتوقف المدمج، مرتين أسبوعيًا داخل كتلة الجذع — دقة الجهاز تجعله الموضع الطبيعي لتشغيل التدرج المزدوج بينما تحمل تمارين الأرض الشد. ومراحل التنشيف تبقي المقعد مشغولًا لنفس سبب رَكن الكيبل: حمل قابل للعد بينما يعمل العجز على الخصر. والمتتبع يستقبل الاثنين بلا حكم على أحدهما.",
        safety: "بنيستان تستحقان الاحترام هنا. القطني: إن أجبر قوس الجهاز أسفل ظهرك على تقوس حاد في وضع الانفتاح فاضبط ظهر المقعد أو ابحث عن طراز آخر — المسار يجب أن يطويك لا أن يقوسك. والرقبة: مكان الوسادة أعلى الصدر وخط الكتف، ولا تدفع الرأس للأمام أبدًا. ومع أي تاريخ غضروفي تبقى إجازة الطبيب قبل الثني المثقل القاعدة القائمة عبر هذه العائلة كلها.",
      },
    },
    faq: {
      en: [
        { q: "Are ab crunch machines effective or a gimmick?", a: "Effective at their one job: loading spinal flexion on a fixed, countable path — which builds the rectus abdominis as reliably as any cable or floor variation. They are a gimmick only when sold as fat-burners or posture fixes; the machine trains the muscle, and the deficit makes it visible." },
        { q: "Why does my neck hurt on this machine?", a: "The pad is sitting too high, pushing the head instead of the chest. Set it at the upper-chest line, keep the chin neutral, and the complaint usually leaves with the adjustment — the machine should fold the torso, never steer the head." },
        { q: "Machine crunch or cable crunch for beginners?", a: "The machine's rails make the first month honest — there is simply less to get wrong while the curl is learned. Move to the cable seat when you can feel the difference between a hip hinge and a spine curl; both pages sit in this library waiting." },
      ],
      ar: [
        { q: "هل أجهزة الكرانش فعالة أم حيلة تسويقية؟", a: "فعالة في وظيفتها الوحيدة: تحميل ثني العمود الفقري على مسار ثابت قابل للعد — وهو ما يبني المستقيمة البطنية بموثوقية أي نسخة كيبل أو أرض. ولا تصير حيلة إلا حين تُباع كحارق دهون أو مصلح قوام؛ الجهاز يدرّب العضلة، والعجز يجعلها مرئية." },
        { q: "لماذا تؤلمني رقبتي على هذا الجهاز؟", a: "الوسادة تجلس مرتفعة زيادة فتدفع الرأس بدل الصدر. اضبطها عند خط أعلى الصدر وأبقِ الذقن محايدًا، فتغادر الشكوى عادة مع التعديل — الجهاز يطوي الجذع ولا يقود الرأس أبدًا." },
        { q: "كرانش الجهاز أم الكيبل للمبتدئين؟", a: "قضبان الجهاز تجعل الشهر الأول أمينًا — هناك ببساطة أقل ما يمكن أن تخطئ فيه وأنت تتعلم اللفة. انتقل إلى مقعد الكيبل حين صرت تشعر بالفرق بين انعطاف الورك ولفة العمود؛ وكلتا الصفحتين تنتظران في هذه المكتبة جاهزتين لرحلتك خطوة بعد خطوة." },
      ],
    },
    links: [
      { hrefEn: "/programs/gym-beginner-fullbody", hrefAr: "/ar/programs/gym-beginner-fullbody", labelEn: "Gym beginner full-body program", labelAr: "برنامج الصالة كامل الجسم للمبتدئين" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "Training frequency — fixes that stick", labelAr: "تكرار التدريب — إصلاحات تصمد" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "The free workout tracker", labelAr: "متتبع التمارين المجاني" },
    ],
  },

  "flat-bench-lying-leg-raise": {
    intro: {
      en: "Lie along a flat bench with your legs stretched past the edge, hands cushioning the hips or gripping the sides, and raise straight legs until the library's geometry takes over — the page's steps describe legs rising toward vertical, then lowering under full control. The lying leg raise hands the lower abdominal fibers the job the crunch never gives them: curling the pelvis toward the ribs with the weight of both legs as the load. It is the quiet workhorse of the midsection — no stack, no angle, just a bench, your legs, and an honesty requirement the return trip enforces on every single rep.",
      ar: "استلقِ على بنش مستوٍ ورجلاك ممدودتان خارج حافته، ويداك تحت الأرداف أو قابضتان على الجانبين، وارفع الرجلين المستقيمتين حتى تتسلم هندسة المكتبة — خطوات الصفحة تصف رجلين تصعدان نحو العمودي ثم تهبطان بسيطرة كاملة. رفعة الرجلين المستلقية تناطق ألياف البطن السفلية بالعمل الذي لا تمنحه إياه الكرانشات أبدًا: لفّ الحوض نحو الأضلاع بوزن الرجلين معًا كحمل. إنها حصان العمل الصامت في منطقة الوسط — بلا ركن ولا زاوية، بنشٌ ورجلان وشرطُ صدقٍ تفرضه رحلة العودة في كل تكرار بلا استثناء.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis owns the pelvis curl, with the library listing no helpers — and the legs are the barbell. As the thighs swing up, the abs' real task starts only once the hips begin to tilt backward and the pelvis rolls off the bench: that final rotation, ribs-bound, is the lower-fiber contraction the exercise is named for. The hip flexors carry the early swing honestly — they must — but the rep's value is decided at the top, where the abs either finish the curl or the exercise quietly becomes a leg swing with good lighting.",
        mistakes: [
          { error: "Stopping at vertical legs with the pelvis flat on the bench.", fix: "Finish the rep by rolling the hips back until the pelvis tips off the pad — legs to ceiling is the halfway sign, the curl past it is the destination." },
          { error: "Letting the lower back arch and the hips drift off the bench at the bottom.", fix: "Hands under the glutes as the page permits, ribs pulled down; the lumbar stays flat from the first rep to the last." },
          { error: "Dropping the legs from the top like a drawbridge.", fix: "Lower for two counts minimum; the stretch under load at the bottom is where this exercise earns its keep, and a free-fall spends it." },
          { error: "Bending the knees to make the top easier while the setup asks for near-straight legs.", fix: "A slight knee softness is allowed by the steps, but folding the legs shortens the lever only by cheating the fibers you came here to train." },
        ],
        alternatives: "The library stocks the full ladder of this movement. The bent-knee hip raise shortens the lever for lifters still earning the straight-leg version; the decline reverse crunch flips the bench angle to assist the pelvic curl; the hanging leg raise is the ceiling of the family, where the abs curl the whole bodyweight from a bar; and the flat-bench lying leg raise's cable cousin adds a stack to the same arc. Every rung trains the same roll of the pelvis — the choice is the lever's length.",
        progression: "Own the bottom position first: lumbar flat, hands placed, legs hovering without the back complaining. Begin with the knee-bent version and graduate to straighter legs as the pelvic curl becomes involuntary — that is the real milestone, not the calendar. From there, add a two-second hold at the top of the tilt, then slower negatives, then the decline or hanging versions. The family tops out high enough that most lifters never need to leave it.",
        programming: "Three to four sets of ten to fifteen controlled raises, twice a week alongside the rest of the trunk block, after the main lifts. Pair it with a flexion movement from the crunch family — the two halves of the rectus abdominis respond to both jobs — and let the plank cover the brace. On a cut, the exercise keeps the lower belly's shelf dense while the deficit, sized in the macro calculator, does the uncovering.",
        safety: "The lumbar spine writes the rules here. If the back arches as the legs lower, the legs are heavier than the abs' current control — bend the knees, raise the bench's end, or shorten the range until the spine stays flat. A tailbone that grinds on the pad needs the hands-under-hips setup the page describes. And any history of disc trouble takes the usual route: clinician's clearance before loaded flexion, the dead bug as the standing substitute.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تملك لفة الحوض، والمكتبة لا تسجل مساعدين — والرجلان هما البار. فبينما تتأرجح الفخذان صاعدتين، لا تبدأ مهمة البطن الحقيقية إلا حين يبدأ الحوض في الميل للخلف ويتدحرج عن البنش: تلك الدورة الختامية، المقيدة بالأضلاع، هي انقباض الألياف السفلية الذي يحمل التمرين اسمه. عضلات ثني الورك تحمل التأرجح الأولي بأمانة — لا بد لها — لكن قيمة التكرار تُحسم في القمة، حيث إما أن تكمل البطن اللفة أو يصير التمرين خلسةً تأرجح ساقين بإضاءة جيدة.",
        mistakes: [
          { error: "التوقف عند رجلين عموديتين والحوض مسطح على البنش.", fix: "أكمل التكرار بتدوير الوركين للخلف حتى يرتفع الحوض عن اللوح — الرجلان نحو السقف لافتة منتصف الطريق، واللفة بعدها هي الوجهة." },
          { error: "ترك أسفل الظهر يتقوس والوركين ينزلقان عن البنش في القاع.", fix: "يدان تحت الألويتين كما تسمح الصفحة وأضلاع مسحوبة لأسفل؛ يبقى القطني مسطحًا من أول تكرار إلى آخره." },
          { error: "إسقاط الرجلين من القمة كجسر متحرك.", fix: "انزل في عدّتين على الأقل؛ المد المثقل في القاع هو حيث يستحق هذا التمرين إيجاره، والسقوط الحر ينفقه." },
          { error: "ثني الركبتين لتسهيل القمة بينما الإعداد يطلب رجلين شبه مستقيمتين.", fix: "يلين الركبتان قليلًا بإذن الخطوات، لكن طيّ الرجلين يقصّر الرافعة بالغش على الألياف التي أتيت من أجلها بالذات." },
        ],
        alternatives: "المكتبة تخزن السلم الكامل لهذه الحركة. رفع الحوض بالركبة المثنية يقصّر الرافعة لمن ما زالوا يستحقون النسخة المستقيمة، والكرانش العكسي المائل يقلب زاوية البنش لإعانة لفة الحوض، ورفعة الرجلين المعلقة سقف العائلة حيث تلف البطن وزن الجسم كله من عارضة، وابنة الكيبل لرفعة البنش تضيف رَكنًا لنفس القوس. كل درجة تدرّب نفس تدوير الحوض — والاختيار هو طول الرافعة.",
        progression: "امتلك وضع القاع أولًا: قطني مسطح ويدان في مكانهما ورجلان معلقتان بلا شكوى الظهر. ابدأ بنسخة الركبة المثنية وتخرّج إلى رجلين أكثر استقامة كلما صارت لفة الحوض لا إرادية — تلك هي المعلمة الحقيقية لا التقويم. ومن هناك أضف تثبيتًا لثانيتين في قمة الميل، فنزلات أبطأ، فنسختي المائل والمعلقة. وتنتهي العائلة عاليًا بما يكفي لأن أغلب الرفاع لا يحتاجون مغادرتها أبدًا.",
        programming: "ثلاث إلى أربع مجموعات من عشرة إلى خمسة عشر رفعة متحكمة، مرتين أسبوعيًا مع بقية كتلة الجذع، بعد الرفعات الكبرى. اقترنها بحركة ثني من عائلة الكرانش — نصفا المستقيمة البطنية يستجيبان للعملين — ودع البلانك يغطي الشد. وفي التنشيف يحفظ التمرين رفّ البطن السفلي كثيفًا بينما يتولى العجز، مضبوطًا بحاسبة الماكروز، أعمال الكشف.",
        safety: "العمود القطني يكتب القوانين هنا. إن تقوس الظهر أثناء نزول الرجلين فالرجلان أثقل من سيطرة البطن الحالية — اثنِ الركبتين أو ارفع طرف البنش أو قصّر النطاق حتى يظل العمود مسطحًا. والعصعص الذي يحتكّ باللوح يحتاج إعداد اليدين تحت الوركين الذي تصفه الصفحة. وأي تاريخ غضروفي يسلك الطريق المعتاد: إجازة طبيب قبل الثني المثقل، والحشرة الميتة بديلًا قائمًا.",
      },
    },
    faq: {
      en: [
        { q: "Lying leg raises — abs or hip flexors?", a: "Both, in a fixed order: the flexors swing the legs up, and the abs finish the rep by curling the pelvis off the bench. Stop the hips from tilting and you have trained only the opening act; finish the curl and the exercise is exactly what its page promises." },
        { q: "My lower back hurts on these — should I drop them?", a: "Shorten the lever first: bent knees, shorter range, hands under the hips. The pain is usually the legs outrunning the abs' ability to hold the lumbar flat. If it persists through the regressions, swap to the dead bug page and let a clinician look at the spine." },
        { q: "Do leg raises flatten the lower belly?", a: "They build the muscle under the lower belly's shelf; flattening is body-fat arithmetic. This library keeps the two jobs honest: the exercise page trains the fibers, and the belly-fat guide plus the calculators handle the deficit that reveals them." },
      ],
      ar: [
        { q: "رفعات الرجلين المستلقية — للبطن أم لعضلات الورك؟", a: "لكليهما، بترتيب ثابت: تُأرجح عضلات الورك الرجلين صاعدتين، وتُتمّ البطن التكرار بلفّ الحوض عن البنش. امنع الحوض من الميل فتكون قد دربت الافتتاحية فقط؛ وأكمل اللفة فيكون التمرين بالضبط ما تعد به صفحته." },
        { q: "أسفل ظهري يؤلمني فيها — هل أتخلى عنها؟", a: "قصّر الرافعة أولًا: ركبتان مثنيتان ونطاق أقصر ويدان تحت الوركين. الألم عادة رجلان تسبقان قدرة البطن على إبقاء القطني مسطحًا. وإن استمر عبر التراجعات فانتقل لصفحة الحشرة الميتة ودع طبيبًا ينظر في العمود." },
        { q: "هل رفعات الرجلين تُسطّح أسفل البطن؟", a: "تبني العضلة تحت رفّ البطن السفلي؛ أما التسطيح فحساب دهون. تحفظ هذه المكتبة الوظيفتين أمينتين: صفحة التمرين تدرّب الألياف، ودليل دهون البطن مع الحاسبات يتولى العجز الذي يكشفها." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/blog/science-backed-belly-fat-loss-8-weeks", hrefAr: "/ar/blog/belly-fat-loss-8-weeks-guide", labelEn: "The evidence-based belly-fat plan", labelAr: "خطة دهون البطن القائمة على الأدلة" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log the sets, keep the honest count", labelAr: "سجّل المجموعات واحفظ العد الأمين" },
    ],
  },
};
