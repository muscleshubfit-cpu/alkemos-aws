/**
 * EXERCISES-ENRICHMENT — BATCH 3 (exercises 11-15 of 50).
 *
 * The chest family — the master plan's single biggest English keyword
 * cluster ("best chest exercises for mass" 1K-10K/mo, §5.1 Tier 2) plus
 * the Arabic "تمارين صدر في البيت" (100-1K/mo). Opens with the two
 * barbell press heads, the dumbbell press, the bodyweight entry point
 * and the chest dip. The three presses share a movement pattern, so the
 * uniqueness law (Jaccard ≤0.15) is won by writing each page about what
 * its variation actually changes: grip mechanics, angle, load path.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_3: Record<string, ExerciseEnrichment> = {
  "barbell-bench-press-medium-grip": {
    intro: {
      en: "The flat barbell bench press is the exercise the whole gym measures itself by, and the medium grip this page teaches is the honest version of it: hands set so the forearms meet the upper arms at ninety degrees in the middle of the rep, as the instructions define — wide enough for chest, narrow enough for triceps, and exactly the balance point between the two. The library grades it beginner, and that is true of the pattern, not of the loading: this is the movement you can progressively load for decades. Every serious program page on Alkemos references this lift.",
      ar: "البنش برس بالبار على البنش المسطح هو التمرين الذي تقيس به الصالة كلها نفسها، والقبضة المتوسطة التي تعلمها هذه الصفحة هي النسخة الأمينة منه: يدان مثبتتان بحيث يلتقي الساعد بالذراع العليا عند تسعين درجة في منتصف الحركة كما تحدد التعليمات — اتساع يكفي للصدر، وضيق يكفي للترايسبس، ونقطة التوازن بينهما بالضبط. تصنفه المكتبة للمبتدئين، وهذا صحيح عن النمط لا عن التحميل؛ فهذه الحركة التي تستطيع تحميلها تقدميًا لعقود. وكل صفحة برنامج جادة في الموقع تشير إلى هذه الرفعة.",
    },
    sections: {
      en: {
        muscles: "The chest does the pressing and the library gives it top billing, but the fine print matters: the medium grip puts the pectorals through their strongest line while the shoulders front-delts and triceps take the two supporting roles the data page lists. The triceps lock out the top third of every rep — which is why a failed lockout is a triceps problem, not a chest one — and the front delts handle the bottom transition where the bar leaves the chest. The medium grip is the geometry that lets all three contribute without any of them dominating.",
        mistakes: [
          { error: "Bouncing the bar off the chest and riding the rebound.", fix: "The instructions call for a brief pause where the bar touches — let the chest settle under the bar for a beat, then press; the pause is worth more than the bounce ever paid." },
          { error: "Flaring the elbows to a straight-out line, shoulder-first.", fix: "Keep the elbows at a natural 45-to-70-degree angle from the torso, as the steady-path tip demands — the bar path becomes a shallow J, and the shoulders stop auditioning for the lead role." },
          { error: "Lifting the hips off the bench to help the sticking point.", fix: "Hips stay planted; if the sticking point wins, the weight is the problem — the rep you lift with your hips is a rep your chest never got." },
          { error: "Unracking with straight arms and walking the bar out over the face.", fix: "Set up with eyes under the bar, pull it out over the j-cups with the lats, then lower — a bar controlled from the rack is a bar controlled to the chest." },
        ],
        alternatives: "The dumbbell bench press trades a little load for a deeper stretch at the bottom and independent arms that expose and fix side-to-side differences. The machine press holds the path steady for pure hypertrophy blocks, and push-ups deliver the same pressing pattern at home — this library's push-up page is the natural companion. Incline variations shift the work up the chest; this flat version remains the total-chest anchor of the family.",
        progression: "A beginner's first month is about the bar path, not the plates: empty bar, five sets of eight, learning the touch point at mid-chest the instructions describe. Load climbs from there in the smallest jump the gym allows, while every set stays at a rhythm where lowering takes twice as long as pressing — the tempo law this page's own tips state. After a year of honest loading, progress continues through periodization: five-by-five strength blocks and eight-to-twelve hypertrophy blocks, traded every few months.",
        programming: "The standard split gives the bench 3-4 sets of 5-8 reps in strength phases or 3-4 sets of 8-12 in hypertrophy phases, with 2-3 minutes of rest — heavy pressing rewards full recoveries. Once or twice a week is the frequency most joints tolerate, and pressing twice is best spaced three days apart. Warm the shoulders with light sets before the work weight, and respect the beginner tag on load selection: the first session's ego is the most common injury mechanism in the gym.",
        safety: "Benching heavy without uprights or a spotter is the sport's classic preventable accident — use a rack with safety pins set just below chest height, or a human spotter on any set you are not certain of. Thumbless (suicide) grips turn a tired wrist into a dropped bar; wrap the thumbs. And a shoulder that pinches at the bottom of every rep is asking for a narrower grip or a temporary switch to dumbbells, not for heroism.",
      },
      ar: {
        muscles: "الصدر يتولى الدفع وتمنحه المكتبة الصدارة، لكن التفاصيل الدقيقة هي المهمة: فالقبضة المتوسطة تَمُرّ العضلة الصدرية عبر أقوى خط لها بينما تتولى الأكتاف الأمامية والترايسبس الدورين المساعدين اللذين تسجلهما صفحة البيانات. الترايسبس يقفل الثلث الأعلى من كل تكرار — ولهذا فإن فشل القفل مشكلة ترايسبس لا صدر — والأكتاف الأمامية تدير الانتقال السفلي حيث يفارق البار الصدر. والقبضة المتوسطة هي الهندسة التي تسمح للثلاثة بالإسهام دون أن تسيطر واحدة منها.",
        mistakes: [
          { error: "ارتداد البار عن الصدر وركوب النطّة.", fix: "تشترط التعليمات توقفًا قصيرًا عند ملامسة البار؛ دع الصدر يستقر تحت البار لحظة ثم ادفع — التوقف يساوي أكثر مما دفعته النطّة يومًا." },
          { error: "تفتيح المرفقين على خط مستقيم جانبيًا فتتقدم الأكتاف.", fix: "أبقِ المرفقين بزاوية طبيعية بين 45 و70 درجة من الجذع كما يفرض قانون المسار الثابت؛ فيصبح مسار البار حرف جاي ضحلًا وتتوقف الأكتاف عن الترشح للدور الأول." },
          { error: "رفع الوركين عن البنش لعبور نقطة الالتصاق.", fix: "يبقى الوركان مزروعين؛ إن انتصرت نقطة الالتصاق فالوزن هو المشكلة — والتكرار الذي ترفعه بوركك هو تكرار لم يحصل عليه صدرك أبدًا." },
          { error: "إخراج البار من الرف بذراعين ممدودتين وسحبه فوق الوجه.", fix: "اضبط وضعك بعينين تحت البار، واسحبه فوق حوامل الرف بالعضلة الجنبية ثم انزل؛ فالبار المتحكم به من الرف هو بار متحكم به حتى الصدر." },
        ],
        alternatives: "البنش بالدمبل يضحي بشيء من الحمل مقابل تمدد أعمق في القاع وذراعين مستقلتين تكشفان الفروق بين الجهتين وتصلحانها. البنش بالماكينة يثبت المسار لكتل البناء الخالص، والضغط يقدم نفس نمط الدفع منزليًا — وصفحة تمرين الضغط في مكتبتنا هي الرفيقة الطبيعية. تنويعات الميل تنقل العمل أعلى الصدر؛ وتبقى هذه النسخة المسطحة مرساة الصدر الكامل للعائلة.",
        progression: "شهر المبتدئ الأول عن مسار البار لا عن الأقراص: بار فارغ، خمس مجموعات من ثمانية، وتعلم نقطة اللمس بمنتصف الصدر التي تصفها التعليمات. يصعد الحمل من هناك بأصغر قفزة تسمح بها الصالة، مع بقاء كل مجموعة على إيقاع يجعل النزول أطول من الضغط مرتين — قانون الإيقاع الذي تنص عليه نصائح الصفحة نفسها. وبعد سنة تحميل أمين يستمر التقدم عبر التخطيط الدوري: كتل قوة بخمس×خمس وكتل تضخيم بثمانية إلى اثني عشر، تتبادلان كل بضعة أشهر.",
        programming: "الانقسام المعتاد يمنح البنش 3-4 مجموعات من 5-8 تكرارات في مراحل القوة أو 3-4 مجموعات من 8-12 في مراحل التضخيم، براحة دقيقتين إلى ثلاث؛ فالدفع الثقيل يكافئ الاستشفاء الكامل. مرة أو مرتين أسبوعيًا هي التكرار الذي تتحمله معظم المفاصل، والأفضل تباعد الجلستين ثلاثة أيام. إحمِ الأكتاف بمجموعات خفيفة قبل وزن العمل، واحترم وسم المبتدئ في اختيار الحمل: فكبرياء الجلسة الأولى أشهر آلية إصابات الصالة كلها.",
        safety: "البنش الثقيل بلا حوائم أو مساعد هو الحادث القابل للمنع الكلاسيكي في الرياضة — استخدم رفًا بأوتاد أمان تحت مستوى الصدر قليلًا، أو مساعدًا بشريًا في أي مجموعة لست متأكدًا منها. القبضة بلا إبهام تحوّل رسغًا متعبًا إلى بار ساقط؛ لفّ الإبهامين. والكتف الذي يوخز في قاع كل تكرار يطلب قبضة أضيق أو تحويلًا مؤقتًا إلى الدمبل، لا بطولة.",
      },
    },
    faq: {
      en: [
        { q: "How wide should my grip actually be?", a: "The instructions give the working definition: a grip that creates a 90-degree angle between forearms and upper arms at the movement's midpoint. For most lifters that lands a hand-width or two outside the shoulders. Test it with an empty bar — if your forearms stay vertical at the bottom, the width is right." },
        { q: "Should the bar touch my chest every rep?", a: "Yes — the instructions bring the bar down until it touches mid-chest with a brief pause, and that touch is the rep's honest bottom. Stopping inches above is a partial: fine as an occasional overload tool, dishonest as a default. If the touch hurts the shoulders, fix the grip width or the elbow angle before shortening the range." },
        { q: "Bench press or dumbbell press for chest growth?", a: "Both grow the chest, and the honest answer is the dumbbell version stretches it further while the barbell loads it heavier — which is why programs alternate them rather than crown one. Dumbbells also expose a weak side instantly; the barbell hides it inside the stronger arm's work." },
      ],
      ar: [
        { q: "ما عرض القبضة الصحيح فعلًا؟", a: "تعطي التعليمات التعريف العامل: قبضة تخلق زاوية 90 درجة بين الساعدين والذراعين عند منتصف الحركة. لمعظم المتدربين تقع هذه على عرض يد أو اثنين خارج الكتفين. اختبرها ببار فارغ؛ إن بقي الساعدان عموديين في القاع فالعرض صحيح." },
        { q: "هل يلمس البار صدري في كل تكرار؟", a: "نعم — تنزل التعليمات بالبار حتى يلامس منتصف الصدر مع توقف قصير، وهذه اللمسة هي القاع الأمين للتكرار. التوقف فوقها ببوصات تكرار جزئي: مقبول كأداة تحميل استثنائية، غير أمين كعرف دائم. وإذا آلمت اللمسة الأكتاف فأصلح عرض القبضة أو زاوية المرفق قبل قصر المدى." },
        { q: "البنش بالبار أم بالدمبل لنمو الصدر؟", a: "كلاهما ينمي الصدر، والإجابة الأمينة أن نسخة الدمبل تمده أبعد بينما يحمله البار أثقل — لهذا تناوبهما البرامج بدل تتويج أحدهما. كما تكشف الدمبلات الجهة الأضعف فورًا، بينما يخفيها البار داخل عمل الذراع الأقوى." },
      ],
    },
    links: [
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training at home — the complete guide", labelAr: "تمارين الصدر في المنزل — الدليل الكامل" },
      { hrefEn: "/exercises/barbell-incline-bench-press-medium-grip", hrefAr: "/ar/exercises/barbell-incline-bench-press-medium-grip", labelEn: "Incline bench press — the upper-chest half", labelAr: "البنش المائل — نصف الصدر العلوي" },
      { hrefEn: "/programs/gym-strength-5x5", hrefAr: "/ar/programs/gym-strength-5x5", labelEn: "5×5 strength program — bench included", labelAr: "برنامج القوة 5×5 — يشمل البنش" },
    ],
  },

  "barbell-incline-bench-press-medium-grip": {
    intro: {
      en: "The incline bench press is the flat bench's more demanding sibling: same bar, same medium grip, but the bench tilts the whole press uphill, and the chest's upper fibers — the ones the flat press underworks — suddenly own the movement. The instructions put the touch point on the upper chest, which is the entire point of the angle. It is the lift that fills the shelf between collarbone and pec line, and the reason every physique program pairs it with flat work — the two angles together cover the chest more completely than either one alone.",
      ar: "البنش المائل بالبار هو الشقيق الأكثر تطلبًا للبنش المسطح: نفس البار ونفس القبضة المتوسطة، لكن البنش يرفع كل الدفع صاعدًا، فتتملك الحركة فجأة الألياف العليا للصدر — تلك التي يقصّر فيها البنس المسطح. تضع التعليمات نقطة اللمس على الصدر العلوي، وهذا هو مغزى الزاوية كلها. إنها الرفعة التي تملأ الرف الواقع بين الترقوة وخط الصدر، وسبب اقتران كل برنامج فيزيكي بها مع العمل المسطح — فالزاويتان معًا تغطيان الصدر أكمل مما تغطيه أي منهما وحدها.",
    },
    sections: {
      en: {
        muscles: "The upper pectoral fibers — the clavicular head — take the lead here, and the steeper the bench, the more the press becomes a shoulder-front-delt exercise with chest assistance, which is why the standard teaching keeps the angle moderate. The shoulders and triceps fill the same secondary roles the data page lists, but their shares shift: the front delts work visibly harder than in the flat press, and the triceps still own the lockout. The medium grip keeps the elbows from flaring into the shoulder joint on the uphill path — the same geometry law as the flat press, worth more here.",
        mistakes: [
          { error: "Setting the bench so steep the front delts take over the set.", fix: "The incline is a tilt, not a shoulder press — keep the bench at the moderate angle your gym's notches offer around 30-to-45 degrees, and the chest keeps the lead role." },
          { error: "Touching the bar to the neck or chin line, the classic incline fear reflex.", fix: "The instructions are specific — the bar meets the UPPER CHEST — aim for the collarbone shelf, not the throat, and the shoulders stay out of the danger zone." },
          { error: "Sliding down the bench as the set gets heavy.", fix: "Plant the feet and drive them into the floor before the first rep; the body stays locked on the incline, and the bar path stops migrating toward the face." },
          { error: "Pressing the bar straight up from the chest instead of back over the eyes.", fix: "The press finishes over the upper face in a slight back-arc, exactly the path the instructions' start-and-end positions describe — straight-up pressing grinds the shoulders." },
        ],
        alternatives: "The dumbbell incline press is the family's most-loved variation — freer shoulder path, deeper bottom stretch, and the honest exposure of a weaker side. The Smith-machine incline removes balance from the equation for hypertrophy focus, and low-to-high cable flyes trace the same upper-chest line under constant tension. At home, the decline push-up — feet elevated — reproduces the same shift of emphasis with nothing but a chair, and this library carries its own page for it.",
        progression: "Start lighter than your flat press — a common working rule is to begin around two-thirds of the flat bench number, then climb as the groove smooths — and earn load through the same touch-point discipline: bar to upper chest, brief pause, press on the slight arc. The progression ladder after that mirrors the flat press: five-by-five blocks for strength, eight-to-twelve blocks for size, with grip and angle held constant long enough to measure progress honestly. Changing the bench angle every session measures nothing.",
        programming: "Program it beside or after the flat press on chest day: 3-4 sets of 8-12 reps with 2-3 minutes of rest, once or twice a week. As the second press of the session it takes the hypertrophy dosing — the upper chest responds to volume and stretch more than to maximal singles. In upper-lower splits it anchors the upper day; in push-pull-legs it follows the flat press inside push day, and our gym PPL program places it exactly there.",
        safety: "The shoulder is the joint the incline press argues with: a too-steep bench plus a too-wide grip plus bouncing reps is the recipe for front-delt impingement. Keep the angle moderate, the grip medium, the touch point on the upper chest, and the reps controlled. The bar-over-face rule from the flat press applies doubled here — the incline's failed rep falls toward the throat, so safety pins or a spotter on anything uncertain.",
      },
      ar: {
        muscles: "الألياف الصدرية العليا — الرأس الترقوي — تقود هنا، وكل ما اشتد ميل البنش تحول الدفع أكثر نحو تمرين كتف أمامي بمساعدة صدر، ولهذا تحفظ التعليمات القياسية على الزاوية باعتدال. تتولى الأكتاف والترايسبس الدورين المساعدين اللذين تسجلهما صفحة البيانات، لكن نصيبهما يتزحزح: تعمل الأكتاف الأمامية بجهد مرئي أكبر من البنش المسطح، ويظل الترايسبس مالك القفل. والقبضة المتوسطة تمنع المرفقين من التفتيح داخل مفصل الكتف في المسار الصاعد — قانون الهندسة نفسه للبنش المسطح، وأثمن هنا.",
        mistakes: [
          { error: "ضبط البنش شديد الميل فتستولي الأكتاف الأمامية على المجموعة.", fix: "الميل إمالة لا برس أكتاف — أبقِ البنش على الزاوية المعتدلة التي تتيحها درجات رف الصالة حول 30-45 درجة، فيحتفظ الصدر بالدور الأول." },
          { error: "ملامسة البار لخط الرقبة أو الذقن، وهو منعكس الخوف الكلاسيكي في المائل.", fix: "التعليمات محددة — يلتقي البار بالصدر العلوي — صوّب نحو رف الترقوة لا الحلق، وتبقى الأكتاف خارج منطقة الخطر." },
          { error: "الانزلاق على البنش مع ثقل الحمل.", fix: "اغرس القدمين وادفع بهما في الأرض قبل أول تكرار؛ يبقى الجسم مقفلًا على الميل ويتوقف مسار البار عن الهجرة نحو الوجه." },
          { error: "دفع البار مستقيمًا فوق الصدر بدل رجوعه فوق العينين.", fix: "ينتهي الدفع فوق أعلى الوجه في قوس خلفي خفيف، وهو المسار نفسه الذي تصفه مواضع البداية والنهاية في التعليمات؛ فالدفع العمودي يسحق الأكتاف." },
        ],
        alternatives: "البنش المائل بالدمبل أشهر تنويعات العائلة وأحبها: مسار كتف أحر وتمدد سفلي أعمق وكشف صادق لجهة أضعف. وماكينة سميث المائلة ترفع التوازن من المعادلة لصالح التضخيم، وتفتيح الكابل من الأسفل للأعلى يرسم نفس خط الصدر العلوي تحت شد دائم. ومنزليًا، الضغط المائل — قدمان مرتفعتان — يعيد إنتاج نفس انزياح التركيز بكرسي فقط، وتحمل مكتبتنا صفحته الخاصة.",
        progression: "ابدأ أخف من بنشك المسطح — قاعدة عمل شائعة أن تبدأ حول ثلثي رقم البنش المسطح ثم تصعد مع انسياب الأخدود — واكسب الحمل عبر انضباط نقطة اللمس نفسها: بار إلى الصدر العلوي، توقف قصير، دفع على القوس الخفيف. وسلم التدرج بعدها يطابق المسطح: كتل خمس×خمس للقوة وكتل ثمانية إلى اثني عشر للحجم، مع تثبيت القبضة والزاوية مدة كافية لقياس التقدم بأمانة. تغيير زاوية البنش كل جلسة لا يقيس شيئًا.",
        programming: "برمجه بجانب البنش المسطح أو بعده في يوم الصدر: 3-4 مجموعات من 8-12 تكرارًا براحة دقيقتين إلى ثلاث، مرة أو مرتين أسبوعيًا. وبوصفه الرفعة الثانية في الجلسة يأخذ جرعة التضخيم؛ فالصدر العلوي يستجيب للحجم والتمدد أكثر من الفرديات القصوى. في التقسيم علوي-سفلي يرسو في اليوم العلوي، وفي دفع-سحب-أرجل يتبع البنش المسطح داخل يوم الدفع، وبرنامج الصالة لدينا يضعه هناك بالضبط.",
        safety: "الكتف هو المفصل الذي يتشاجر معه البنش المائل: ميل شديد زائد قبضة واسعة زائد تكرارات مرتدة هي وصفة انحشار الكتف الأمامي. أبقِ الزاوية معتدلة والقبضة متوسطة ونقطة اللمس على الصدر العلوي والتكرارات متحكمًا فيها. وقانون البار فوق الوجه من البنش المسطح يتضاعف هنا؛ فالتكرار الفاشل في المائل يسقط نحو الحلق، فأوتاد الأمان أو مساعد في أي أمر غير مؤكد.",
      },
    },
    faq: {
      en: [
        { q: "What angle should the incline bench be?", a: "The library's instructions leave the angle to the bench and put the law on the touch point instead — bar to upper chest. In practice the moderate notches around 30-45 degrees keep the upper-pec fibers leading; past that, the press keeps tilting toward a shoulder exercise and the chest's share shrinks with every degree." },
        { q: "Why is my incline so much weaker than my flat bench?", a: "Everyone's is — the incline recruits a smaller, less-trained muscle region and takes the strongest pressing angle away from the chest. A flat-press number around one-and-a-half times the incline is ordinary. Track them as two lifts with two logs; comparing them is like comparing your sprint to your run." },
        { q: "Can I build a full chest with incline only?", a: "You can build most of it — the incline does reach the whole pectoral, just with the emphasis shifted upward. The honest gap is the bottom-pec line and heavy-load work, which the flat press and dips cover better. Incline-only is a workable solution for shoulders that dislike flat pressing, not the optimal default." },
      ],
      ar: [
        { q: "ما زاوية البنش المائل الصحيحة؟", a: "تترك تعليمات المكتبة الزاوية للبنش وتضع القانون على نقطة اللمس بدلًا منها — بار إلى الصدر العلوي. وعمليًا تحافظ الدرجات المعتدلة حول 30-45 درجة على تقدم ألياف الصدر العليا؛ فبعد ذلك يميل الدفع أكثر نحو تمرين أكتاف ويتقلص نصيب الصدر مع كل درجة." },
        { q: "لماذا مائلي أضعف كثيرًا من بنشي المسطح؟", a: "هكذا حال الجميع؛ فالمائل يجند منطقة عضلية أصغر وأقل تدريبًا ويسلب الصدر أقوى زاوية دفع. رقم مساحته يساوي نحو مرة ونصف رقم المائل شيء عادي. سجّلهما رفعتين بسجلين؛ فمقارنتهما كمقارنة عدوك بجريك." },
        { q: "هل أبني صدرًا كاملًا بالمائل وحده؟", a: "تبني معظمه؛ فالمائل يصل الصدر كله لكن بترجيح النحو الأعلى. الفجوة الأمينة هي خط الصدر السفلي وعمل الحمل الثقيل، وهما ما يغطيه البنش المسطح والديبس أفضل. المائل وحده حل عملي لأكتاف تكره الدفع المسطح، لا الخيار الأمثل الافتراضي." },
      ],
    },
    links: [
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training at home — the complete guide", labelAr: "تمارين الصدر في المنزل — الدليل الكامل" },
      { hrefEn: "/exercises/dumbbell-bench-press", hrefAr: "/ar/exercises/dumbbell-bench-press", labelEn: "Dumbbell bench press — the freer variation", labelAr: "البنش بالدمبل — التنويع الأكثر حرية" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track both presses separately — free tracker", labelAr: "سجل الرفعتين منفصلتين — المتتبع المجاني" },
    ],
  },

  "dumbbell-bench-press": {
    intro: {
      en: "The dumbbell bench press is the flat press with the safety rails removed and the truth installed: two independent weights mean the stronger arm can no longer carry the weaker one, and every side-to-side gap you have been hiding under a barbell gets printed on the set. The instructions carry the classic setup choreography — dumbbells up on the thighs, kick them back one at a time, rotate the wrists — because the challenge of this lift starts before the first rep. What you buy with that choreography is a deeper bottom stretch than any bar allows, a wrist angle you control, and a chest that has to balance the load as well as press it. Home and gym lifters press it for the same reason: it grows the chest and tells the truth.",
      ar: "البنش بالدمبل هو البنش المسطح بعد إزالة قضبان الأمان وتركيب الصدق: وزنان مستقلان يعنيان أن الذراع الأقوى لم تعد تستطيع حمل الأضعف، وكل فجوة بين الجهتين كنت تخفيها تحت بار أصبحت مطبوعة على المجموعة. تحمل التعليمات التصميم الكلاسيكي الكامل — دمبلان على الفخذين، رفعهما للخلف واحدًا واحدًا، تدوير الرسغين — لأن تحدي هذه الرفعة يبدأ قبل أول تكرار. وما تشتريه بهذا الترتيب هو تمدد سفلي أعمق من أي بار، وزاوية رسغ تتحكم فيها، وصدرٌ عليه أن يوازن الحمل كما يدفعه. ويتدرب عليه أصحاب المنزل والصالة للسبب نفسه: يبني الصدر ويقول الحقيقة.",
    },
    sections: {
      en: {
        muscles: "The chest leads and the library's secondary list — shoulders, triceps — matches the barbell press, but the dumbbell version changes the mechanics around that cast: with each arm free, the dumbbells can travel slightly outward and downward at the bottom, taking the pectoral fibers through a longer stretch than a fixed bar permits. The shoulders work harder as stabilizers of two separate loads, the triceps still close out the lockout, and the forearms join the crew in a role the barbell never gave them — balancing each bell so it neither tips in nor out.",
        mistakes: [
          { error: "Letting the dumbbells drift toward the midline at the top, turning the press into a sloppy close-fly.", fix: "Press to shoulder width and stop — the bells finish above the chest, not clanging together, and the chest stays under tension at the top." },
          { error: "Dropping into the bottom stretch fast and bouncing the elbows.", fix: "The instructions' tempo law applies doubled with free weights — lowering takes twice as long as pressing, and the bottom stretch is a place to pass through under control, not to visit violently." },
          { error: "Flaring the wrists back so the bells sit behind the forearm line.", fix: "Stack the wrists over the elbows and keep them neutral, as the tips' steady-hand law implies — a back-bent wrist under a heavy dumbbell is a bell waiting to fall." },
          { error: "Kicking the second dumbbell up before the first is settled.", fix: "The one-at-a-time setup in the instructions exists for a reason: first bell locked at the top, then the kick, then the second — the choreography is the safety system." },
        ],
        alternatives: "The barbell press loads heavier and is the strength benchmark; the machine chest press removes stabilizer demand for pure hypertrophy. Push-ups at home cover the pattern load-free, and this library's push-up page scales them for every level. For the stretch-hungry, dumbbell flyes take the same bottom position and remove the pressing entirely — a companion move rather than a substitute, and the flye page here covers it.",
        progression: "The ladder starts with bells you can press for clean sets of ten with a pause at the chest — most beginners own that number faster than they expect. Climb in two-kilo jumps per bell when the top rep of every set feels repeatable, and use the same two-block rhythm as the barbell: strength blocks of five-to-eight reps, hypertrophy blocks of eight-to-twelve. The dumbbell press also carries a progression the barbell cannot offer — a three-second lower through the bottom stretch — which builds size without another kilo on the bells.",
        programming: "Standard dosing is 3-4 sets of 8-12 reps with 90-120 seconds of rest, once or twice a week — either as the main press of the day (dumbbell-first lifters) or as the second press after barbell work. It earns its session-starter slot on shoulder-sensitive days: the free wrist angle and the independent path are gentler on cranky shoulders than a fixed bar. Pair it with a flye movement in the same session and the chest has covered both its pressing and stretching jobs.",
        safety: "The getting-in-and-out is the risky part, not the pressing: the kick-up choreography in the instructions protects the shoulders, so never skip it — and never press bells you cannot safely kick into place or lower to the floor at the end. A failed rep with dumbbells has a built-in escape hatch (drop them sideways from the bottom), but that hatch only works with clear floor on both sides of the bench. Collared dumbbells that shift mid-set change their balance without warning — check the collars between sets.",
      },
      ar: {
        muscles: "الصدر يقود وقائمة المكتبة للمساعدة — أكتاف وترايسبس — تطابق البنش بالبار، لكن نسخة الدمبل تغيّر الميكانيكا حول هذا التشكيل: مع تحرر كل ذراع تستطيع الدمبلات السفر قليلًا للخارج وللأسفل في القاع، فتمرر الألياف الصدرية عبر تمدد أطول مما يسمح به بار ثابت. الأكتاف تعمل أجهد مثبتتين لحمولتين منفصلتين، والترايسبس يظل يختم القفل، والساعدان ينضمان للطاقم بدور لم يمنحه البار يومًا: موازنة كل جرس كي لا يميل لداخل أو خارج.",
        mistakes: [
          { error: "انجراف الدمبلتين نحو منتصف الجسم في القمة فتتحول الرفعة إلى تفتيح ضيق مهمل.", fix: "ادفع إلى عرض الكتفين وتوقف — تنتهي الجرسان فوق الصدر لا متصادمتين، ويبقى الصدر تحت الشد في القمة." },
          { error: "السقوط السريع إلى التمدد السفلي وارتداد المرفقين.", fix: "قانون الإيقاع في التعليمات يتضاعف مع الأوزان الحرة — النزول ضعف الضغط — وقاع التمدد مكان تعبره بسيطرة لا مكان تزوره بعنف." },
          { error: "طي الرسغين للخلف حتى تجلس الجرسان خلف خط الساعد.", fix: "ركّب الرسغين فوق المرفقين وبقِهما محايدين كما يوحي قانون اليد الثابتة في النصائح؛ فالرسغ المثني خلفيًا تحت دمبل ثقيلة جرس ينتظر السقوط." },
          { error: "رفع الدمبل الثانية بالرَكل قبل استقرار الأولى.", fix: "إعداد الواحدة-تلو-الأخرى في التعليمات موجود لسبب: الجرس الأولى مقفلة في الأعلى، ثم الرفسة، ثم الثانية — الترتيب هو نظام الأمان." },
        ],
        alternatives: "البنش بالبار يحمل أثقل وهو معيار القوة، وبنش الصدر بالماكينة يزيل مطلب الثبات للتضخيم الخالص. والضغط منزليًا يغطي النمط بلا حمل، وصفحة الضغط في مكتبتنا تدرّجه لكل مستوى. ولمن يعشق التمدد، تفتيح الدمبل يأخذ نفس وضع القاع ويزيل الدفع كليًا — حركة مرافقة لا بديل، وصفحته هنا تغطيه.",
        progression: "يبدأ السلم بجرسين تستطيع دفعهما لمجموعات نظيفة من عشرة مع توقف عند الصدر — وأغلب المبتدئين يمتلكون هذا الرقم أسرع مما يتوقعون. اصعد بقفزات كيلوجرامين لكل جرس حين تصبح تكرارية القمة الأخيرة مكررة بسهولة، واستخدم إيقاع الكتلتين نفسه للبار: كتل قوة بخمس إلى ثمانية، وكتل تضخيم بثمانية إلى اثني عشر. كما تحمل رفعة الدمبل تدرجًا لا يمنحه البار — نزول ثلاث ثوان عبر التمدد السفلي — يبني حجمًا بلا كيلو إضافي على الجرسين.",
        programming: "الجرعة القياسية 3-4 مجموعات من 8-12 تكرارًا براحة 90-120 ثانية، مرة أو مرتين أسبوعيًا — إما كرفعة اليوم الأولى (لمحبي الدمبل أولًا) أو كرفعة ثانية بعد عمل البار. وتستحق خانة افتتاح الجلسة في أيام الأكتاف الحساسة؛ فزاوية الرسغ الحرة والمسار المستقل ألطف على كتف متعب من بار ثابت. اقرنها بحركة تفتيح في الجلسة نفسها فيكون الصدر قد غطى وظيفتيه: الدفع والتمدد.",
        safety: "الدخول والخروج هما الجزء الخطر لا الدفع نفسه: تصميم الرفسة في التعليمات يحمي الأكتاف فلا تتجاوزه أبدًا — ولا تدفع أبدًا جرسين لا تستطيع رفعهما بأمان للوضع أو إنزالهما للأرض في النهاية. التكرار الفاشل بالدمبل يملك مخرج نجاة مدمجًا (إسقاطهما جانبًا من القاع)، لكن المخرج يعمل فقط بأرض خالية على جانبي البنش. والدمبل المقفلة التي تنزاح منتصف المجموعة تغير توازنها بلا إنذار — افحص الأقفال بين المجموعات.",
      },
    },
    faq: {
      en: [
        { q: "How much lighter should dumbbells be than my barbell press?", a: "Add the two bells together and expect roughly 80-90 percent of your barbell number once you own the coordination — two 30 kg bells against a 70 kg bar press is a normal, healthy spread. The dumbbell number lags most in the first month and closes as the stabilizers learn the job." },
        { q: "Should I lower the dumbbells deeper than the bar would go?", a: "Slightly, yes — that deeper, slightly outward stretch is the dumbbell press's signature benefit, and the instructions' arc allows it. The limit is the point where your elbows stop tracking and the shoulders start rolling; depth is a guest of good form, not its landlord." },
        { q: "One arm always fails first — what do I do?", a: "That is the dumbbell press doing its diagnostic job. Let the weaker arm set the weight for both for a few weeks, add a few single-arm dumbbell presses (the library's one-arm row page shows the bench support setup that works here too), and the gap closes. Never let the strong arm do extra reps — that widens it." },
      ],
      ar: [
        { q: "كم أخف يجب أن تكون الدمبل من بنشي بالبار؟", a: "اجمع الجرسين وتوقع نحو 80-90 بالمئة من رقم البار بعد امتلاك التناسق — جرسا 30 كجم مقابل بنش 70 كجم بالبار فارق صحي طبيعي. يتخلف رقم الدمبل أكثر في الشهر الأول ثم يلتئم مع تعلم المثبتات وظيفتها." },
        { q: "هل أنزل بالدمبل أعمق مما ينزل البار؟", a: "قليلًا نعم — فذلك التمدد الأعمق المائل للخارج هو فائدة رفعة الدمبل المميزة، وقوس التعليمات يسمح به. والحد هو النقطة التي يتوقف فيها مسار المرفقين ويبدأ تتدحرج الأكتاف؛ فالعمق ضيف الوضعية الجيدة لا مالكها." },
        { q: "ذراع تفشل دائمًا أولًا — ما الحل؟", a: "هذه رفعة الدمبل تؤدي وظيفتها التشخيصية. دع الذراع الأضعف تحدد الوزن للاثنتين بضعة أسابيع، وأضف بضع رفعات دمبل بذراع واحدة (صفحة التجديف بذراع واحدة في المكتبة تعرض إسناد البنش الذي يصلح هنا أيضًا)، وستلتئم الفجوة. ولا تدع الذراع القوية تؤدي تكرارات إضافية أبدًا؛ فذلك يوسعها." },
      ],
    },
    links: [
      { hrefEn: "/blog/12-week-dumbbell-band-muscle-plan", hrefAr: "/ar/blog/home-muscle-building-guide-simple-weights", labelEn: "12-week dumbbell & band muscle plan", labelAr: "بناء العضلات في المنزل بأوزان بسيطة" },
      { hrefEn: "/exercises/dumbbell-flyes", hrefAr: "/ar/exercises/dumbbell-flyes", labelEn: "Dumbbell flyes — the stretch companion", labelAr: "تفتيح الدمبل — الرفيق الممدّد" },
      { hrefEn: "/programs/home-dumbbell-ppl", hrefAr: "/ar/programs/home-dumbbell-ppl", labelEn: "Home dumbbell PPL program", labelAr: "برنامج دفع-سحب-أرجل المنزلي بالدمبل" },
    ],
  },

  "pushups": {
    intro: {
      en: "The push-up is the most-performed exercise on earth and the front door of home training: every «chest workout at home» journey starts here. The instructions keep the classic standard: hands about thirty-six inches apart, chest to a breath above the floor, press up with a squeeze. No equipment, no setup, no excuses — and no ceiling either, because the variations climb from knee push-ups to one-arm work without ever needing a gym. It earns its keep on merit: the same pressing pattern as the bench, taught free, scaled forever, and honest about your bodyweight the whole way.",
      ar: "تمرين الضغط هو أكثر تمرين يؤدى على وجه الأرض والباب الأمامي للتدريب المنزلي: كل رحلة «تمارين صدر في البيت» تبدأ من هنا. تحفظ التعليمات المعيار الكلاسيكي: يدان على بعد نحو ستة وثلاثين بوصة، وصدرٌ على أنفاس من الأرض، ودفع صاعد مع عصر. لا معدات ولا إعداد ولا أعذار — ولا سقف أيضًا؛ فالتنويعات تتسلق من الضغط على الركبتين إلى العمل بذراع واحدة دون حاجة لصالة أبدًا. ويحتفظ بمكانه بالجدارة وحدها: نفس نمط الدفع كالبنش، يُدرَّس مجانًا، ويُدرَّج إلى الأبد، ويظل صادقًا مع وزن جسمك في كل خطوة.",
    },
    sections: {
      en: {
        muscles: "The chest presses, and the library's secondary list — shoulders, triceps — reads exactly like the bench press's, because the movement IS a bench press turned upside down: instead of pushing a load away from the body, the body pushes itself away from the floor. The front delts share the pressing, the triceps lock out every rep, and unlike the bench, the abs and quads work the entire set as the floor's replacement for a bench — a sagging middle is a failed rep even if the arms keep moving. That hidden plank is what makes the push-up a full-body exercise wearing a chest costume.",
        mistakes: [
          { error: "Hips sagging so the lower back does the bearing.", fix: "Squeeze the glutes and brace as if someone is about to drop a weight on your belly — the body is one plank from heels to head, and every rep rides that plank." },
          { error: "Half-reps with the head bobbing to the floor while the chest stays high.", fix: "The instructions set the honest bottom — chest almost touching — the nose and chest arrive together, and the reps you cannot reach that low are knee-pushups, legitimately, not partials." },
          { error: "Hands set way out wide and ahead of the shoulders.", fix: "The thirty-six-inch standard from the instructions puts hands just outside the chest line; wider hands shift load onto the shoulders in a way most of them resent." },
          { error: "Flaring the elbows straight out to the sides.", fix: "The steady-elbow-path tip on this page is the same law as the bench's — elbows at a natural angle to the torso, forearms near vertical, and the shoulders keep their job description." },
        ],
        alternatives: "Every chest device in this library maps back to the push-up. The bench press loads the same pattern heavier; the dip shifts it vertical; the dumbbell flye isolates the stretch. Within the push-up family itself the variations branch by need: incline push-ups (hands raised) regress the movement, decline push-ups (feet raised) load it, and this site's home programs sequence all three. When bodyweight stops being enough, a backpack with books quietly becomes the cheapest loading tool in training.",
        progression: "The ladder is the most famous in fitness: wall push-ups, then hands-on-a-table, then knee push-ups, then the full standard this page teaches, then feet elevated, then a pause at the bottom of every rep, then — for the patient — the one-arm progression begins. Move up a rung when you own three clean sets of ten on the current one, and measure honesty by the chest-nearly-touches standard, never by a count. The ceiling is far: weight on the back, tempo slows, and archer push-ups all keep growing the movement without a single piece of equipment.",
        programming: "As a beginner's main press: 3-4 sets of as many honest reps as possible (leaving one or two in the tank), three times a week. As an experienced lifter's tool: 3 sets of 15-25 as accessory work on push days, or as a finisher that flushes the chest after pressing. In home programs the push-up often carries the whole pressing load — our home beginner program leans on it exactly that way — and progress is then measured in reps and in harder variations, two ladders that always have another step.",
        safety: "The wrists are the push-up's tax collectors — they bear the load in extension, and they complain in beginners and veterans alike. Fists or push-up handles (or dumbbells held neutral) give the wrists a vacation without changing the exercise. The lower back is the other watch-point: the plank law is a spine law, and any pinching at the lumbar means the set ended before the arms agreed. Shoulder pinchers at the bottom should narrow the hands a touch and add incline work while the joints acclimate.",
      },
      ar: {
        muscles: "الصدر يدفع، وقائمة المكتبة للمساعدة — أكتاف وترايسبس — تقرأ تمامًا كقائمة البنش، لأن الحركة بنش برس مقلوب: فبدل دفع حمل بعيدًا عن الجسم، يدفع الجسم نفسه بعيدًا عن الأرض. الأكتاف الأمامية تتقاسم الدفع، والترايسبس يقفل كل تكرار، وخلافًا للبنش يعمل البطن والفخذ الأمامي طوال المجموعة بديلًا عن البنش — فالوسط الهابط تكرار فاشل حتى لو استمرت الذراعان. هذا البلانك الخفي هو ما يجعل الضغط تمرين جسم كامل بزيّ صدر.",
        mistakes: [
          { error: "هبوط الوركين حتى يتولى أسفل الظهر الحمل.", fix: "اعصر الألويات واشدّ كأن أحدهم سي إسقاط ثقل على بطنك؛ فالجسم بلانك واحد من الكعبين إلى الرأس، وكل تكرار يركب ذلك البلانك." },
          { error: "تكرارات نصفية يتقافز فيها الرأس نحو الأرض بينما يبقى الصدر مرتفعًا.", fix: "تضع التعليمات القاع الأمين — الصدر يكاد يلمس — فيصل الأنف والصدر معًا، والتكرارات التي لا تبلغ تلك النقطة ضغط على الركبتين بشرعية لا تكرارات جزئية." },
          { error: "وضع اليدين بعيدتين جدًا للخارج وأمام الكتفين.", fix: "معيار الستة والثلاثين بوصة في التعليمات يضع اليدين خارج خط الصدر قليلًا فقط؛ فاليومان الأوسع تنقلان الحمل إلى أكتاف لا تحب معظمها ذلك." },
          { error: "تفتيح المرفقين جانبيًا على الاستقامة.", fix: "نصيبة المسار الثابت للمرفقين في هذه الصفحة هي قانون البنش نفسه — مرفقان بزاوية طبيعية من الجذع وسواعد شبه عمودية — فتحتفظ الأكتاف بوصف وظيفتها." },
        ],
        alternatives: "كل جهاز صدر في هذه المكتبة يعود إلى الضغط. البنش بالبار يحمل النمط نفسه أثقل، والديبس يرفعه عموديًا، وتفتيح الدمبل يعزل التمدد. وداخل عائلة الضغط نفسها تتفرع التنويعات حسب الحاجة: الضغط المائل (يدان مرتفعتان) يسهّل الحركة، والمائل بالقدمين (قدمان مرتفعتان) يحملها، وبرامجنا المنزلية ترتب الثلاثة معًا. وحين يكف وزن الجسم، تصبح حقيبة ظهر مليئة بالكتب أرخص أداة تحميل في التدريب.",
        progression: "السلم أشهر سلم في اللياقة: ضغط على الحائط، ثم على طاولة، ثم على الركبتين، ثم المعيار الكامل الذي تعلمه هذه الصفحة، ثم قدمان مرتفعتان، ثم توقف في قاع كل تكرار، ثم — للصبورين — يبدأ تدرج الذراع الواحدة. اصعد درجة حين تمتلك ثلاث مجموعات نظيفة من عشر على الحالية، وقس الأمانة بمعيار الصدر يكاد يلمس لا بالعد. والسقف بعيد: وزن على الظهر، وإبطاء الإيقاع، وضغط الرامي، كلها تنمي الحركة بلا قطعة معدات واحدة.",
        programming: "كرفعة أساسية للمبتدئ: 3-4 مجموعات بأقصى عدد تكرارات أمين (مع ترك تكرار أو اثنين في الخزان) ثلاث مرات أسبوعيًا. وكسلاح للمتقدم: ثلاث مجموعات من 15-25 كعمل مساعد في أيام الدفع أو كختام يغسل الصدر بعد الدفع. وفي البرامج المنزلية يحمل الضغط غالبًا كل حمل الدفع — وبرنامج المبتدئ المنزلي لدينا يتكئ عليه هكذا بالضبط — ويقاس التقدم حينها بالتكرارات وبالتنويعات الأصعب، سلمان لا ينفدان دومًا درجة أخرى.",
        safety: "الرسغان جابا ضريبة الضغط — يحملان الوزن في وضع ممتد ويشتكيان لدى المبتدئين والمحترفين سواء. القبضتان أو مقابض الضغط (أو دمبل محمولة بقبضة محايدة) تمنح الرسغين عطلة دون تغيير التمرين. وأسفل الظهر هو نقطة المراقبة الأخرى: قانون البلانك قانون عمود فقري، وأي وخز قطني يعني أن المجموعة انتهت قبل موافقة الذراعين. ومن يوخزه كتفه في القاع فليضيّق اليدين قليلًا وليضف عملًا مائلًا حتى تألف المفاصل.",
      },
    },
    faq: {
      en: [
        { q: "How many push-ups a day is a good number?", a: "There is no magic count — the honest frame is quality sets, not daily totals. Three or four sets close to failure, three times a week, with the chest-nearly-touches standard beats a hundred sloppy daily reps. When twenty clean reps per set arrive, the answer is not more reps; it is a harder variation, and the progression notes on this page supply them." },
        { q: "Why do my wrists hurt more than my chest?", a: "Because the standard hand position loads the wrist in full extension — an angle most desk jobs never train. Distribute the pressure through the knuckles, try fists or handles for a while, and the pain usually leaves within two weeks while the chest's workload never notices the change." },
        { q: "Can push-ups replace the bench press?", a: "For building a chest, nearly — the pattern is identical and the load is your bodyweight. What the bench adds is unlimited loading for continued strength progression, which matters once twenty-plus reps become easy. Weighted push-ups (backpack, plates on the back) close most of that gap at home; our home dumbbell program covers the in-between." },
      ],
      ar: [
        { q: "كم ضغطة يوميًا رقم جيد؟", a: "لا يوجد عدد سحري — الإطار الأمين مجموعات ذات جودة لا مجاميع يومية. ثلاث أو أربع مجموعات قرب الفشل، ثلاث مرات أسبوعيًا، بمعيار الصدر يكاد يلمس، تغلب مئة ضغطة مهملة يوميًا. وحين تصل عشرون تكرارًا نظيفًا للمجموعة فالجواب ليس تكرارات أكثر بل تنويعًا أصعب، وملاحظات التدرج في هذه الصفحة تمدّها." },
        { q: "لماذا يتألم رسغاي أكثر من صدري؟", a: "لأن وضع اليد القياسي يحمل الرسغ في مدّ كامل — زاوية لا يدرّبها أغلب أعمال المكتب أبدًا. وزّع الضغط عبر براجم اليد، وجرّب القبضتين أو المقابض مدة، ويغادر الألم عادة خلال أسبوعين بينما لا تلاحظ حصة الصدر الفرق." },
        { q: "هل يستطيع الضغط تعويض البنش برس؟", a: "لبناء الصدر، تقريبًا — النمط متطابق والحمل وزن جسمك. ما يضيفه البنش هو تحميل بلا سقف لتقدم قوة مستمر، وهذا يهم حين تصبح عشرون تكرارًا فأكثر سهلة. الضغط الموزون — حقيبة ظهر أو أقراص على الظهر — يسد معظم تلك الفجوة منزليًا؛ وبرنامج الدمبل المنزلي لدينا يغطي ما بينهما." },
      ],
    },
    links: [
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-bodyweight-home", labelEn: "Bodyweight chest training at home", labelAr: "تمارين الصدر بوزن الجسم في المنزل" },
      { hrefEn: "/exercises/decline-push-up", hrefAr: "/ar/exercises/decline-push-up", labelEn: "Decline push-up — the loaded progression", labelAr: "الضغط المائل للأسفل — تدرج التحميل" },
      { hrefEn: "/programs/home-beginner-fullbody", hrefAr: "/ar/programs/home-beginner-fullbody", labelEn: "Home beginner full-body program", labelAr: "برنامج الجسم الكامل للمبتدئين المنزلي" },
    ],
  },

  "dips-chest-version": {
    intro: {
      en: "Chest dips are the upper-body squat: bodyweight, brutal, and honest. The instructions define the chest version precisely — torso leaning forward about thirty degrees, elbows flared slightly, lower until the chest stretches, drive back up with a squeeze. That forward lean is the entire secret separating this from the triceps version in the same library: the same bars, tilted intentions, different muscles leading. The lift earns its intermediate grade honestly, because the shoulder has to be strong enough to control the deepest dip position most pressing never visits. It built the chests of gymnasts and old-school bodybuilders long before the bench press became the gym's currency, and it still out-loads push-ups the moment your toes leave the floor.",
      ar: "ديبس الصدر هو سكوات الجزء العلوي: بوزن الجسم، وحشي، وصادق. تحدد التعليمات النسخة الصدرية بدقة — جذع مائل للأمام نحو ثلاثين درجة، ومرفقان متفتحان قليلًا، وانزل حتى يتمدد الصدر، ثم ادفع صاعدًا مع عصر. هذا الميل الأمامي هو السر كله الفاصل بينها وبين نسخة الترايسبس في المكتبة نفسها: نفس القضبان، ونوايا مائلة، وعضلات مختلفة تتقدم. تكسب الرفعة وسم المتوسط بصدق، لأن الكتف يجب أن يكون قويًا بما يكفي للسيطرة على أعمق وضع ديبس لا تزوره معظم حركات الدفع أبدًا. بنت هذه الرفعة صدور لاعبي الجمباز ولاعبي كمال الأجسام القدامى قبل أن يصبح البنش عملة الصالة، وما تزال تتفوق على الضغط في الحمل لحظة أن تفارق أصابع قدميك الأرض.",
    },
    sections: {
      en: {
        muscles: "The chest leads from the lean — the instructions' thirty-degree forward tilt tips the fiber line of the pectorals into the pressing path, especially the lower and sternal fibers the flat bench under-reaches. The shoulders and triceps carry the secondary billing the data page gives them: the front delts hold the bottom position under a stretch most presses never see, and the triceps extend the elbows through every inch of the drive. Serratus and lats stabilize the ribcage on the way down — the dipping athlete hangs from bars, and hanging is a back-and-chest job as much as a pressing one.",
        mistakes: [
          { error: "Staying bolt upright, which converts the dip into its triceps cousin.", fix: "The forward lean is not optional styling — chin over the bars, chest aiming slightly down-and-forward, exactly as the instructions describe, and the chest takes its lead back." },
          { error: "Dropping into the bottom and bouncing out of the stretch.", fix: "Lower under control until the chest stretch registers, then drive — a bounced bottom loads the shoulder capsule at its weakest angle, and the capsule keeps receipts." },
          { error: "Sinking so deep the shoulders shrug toward the ears.", fix: "Depth is earned shoulder by shoulder: stop the descent where the chest stretch ends and the shoulder shrug begins, and let range grow as the joint adapts." },
          { error: "Kipping the legs for upward momentum.", fix: "Cross the ankles behind you and let the body be a still pendulum — the moment the legs start swinging, the set has quietly ended and the reps are borrowed." },
        ],
        alternatives: "The bench press family loads the same chest fibers with the shoulders supported — the natural swap for cranky shoulders. The decline press mimics the dip's lower-chest emphasis from a bench. At home, the decline push-up — feet on a chair — is the closest free approximation, and this library carries the page. Between them sits the dip machine, which lets you dial exact loads below bodyweight — a legitimate bridge back to the bars for anyone rebuilding.",
        progression: "The ladder starts below bodyweight: jump-and-hold negatives (step up, lower slowly) build the eccentric strength first, then band-assisted dips, then full dips to a chest-stretch depth — the intermediate grade on this page is the destination, not the start. From there: added load on a dip belt, pauses at the bottom, or three-second lowers keep the movement growing for years. The depth law never changes — earn each extra inch of range with weeks of ownership, never with one brave set.",
        programming: "Program it as a main press or a heavy accessory: 3-4 sets of 6-12 reps with 2-3 minutes of rest, once or twice a week. As the second exercise on a push day it follows the bench press and deepens the lower-chest stimulus; as the main press of a short session it carries the whole load. Dips pair famously with chin-ups as a complete upper-body minimal-equipment day — four sets each, bars only, and most gyms' corner holds both.",
        safety: "The shoulder is the whole safety story: the bottom of a dip puts it under load at maximum stretch, which is the exact position sloppy reps injure. The honest depth cue — stop where the chest stretch ends — protects it. Anyone with a history of anterior shoulder pain or AC-joint issues should treat the dip as a specialist tool: partial range, slow tempo, and a gradual return, or the machine version while the joint decides. Sternum pinching at the bottom is a stop signal, not a stretch signal.",
      },
      ar: {
        muscles: "الصدر يقود من الميل — فميل الثلاثين درجة الأمامي في التعليمات يرصف خط ألياف الصدرية إلى مسار الدفع، خاصة الألياف السفلية والقصية التي لا يبلغها البنش المسطح. الأكتاف والترايسبس يحملان الفاتورة المساعدة التي تمنحهما صفحة البيانات: الأكتاف الأمامية تحفظ الوضع السفلي تحت تمدد لا تراه معظم حركات الدفع، والترايسبس يمدّ المرفقين عبر كل شبر من الدفعة. والمنشارية والجنبية تثبتان القفص الصدري في النزول — فمتدرب الديبس معلق من القضبان، والتعليق عمل ظهر وصدر بقدر ما هو عمل دفع.",
        mistakes: [
          { error: "البقاء منتصبًا تمامًا فيتحول الديبس إلى قريبه الترايسبس.", fix: "الميل الأمامي ليس ترفًا شكليًا — الذقن فوق القضبان والصدر يصوّب قليلًا نحو الأسفل والأمام تمامًا كما تصف التعليمات — فيستعيد الصدر قيادته." },
          { error: "السقوط إلى القاع والارتداد من التمدد.", fix: "انزل بسيطرة حتى يسجل تمدد الصدر ثم ادفع؛ فالقاع المرتد يحمل محفظة الكتف في أضعف زواياها، والمحفظة لا تنسى." },
          { error: "الغوص عميقًا حتى تتجهم الأكتاف نحو الأذنين.", fix: "العمق يُكسب كتفًا بعد كتف: أوقف الهبوط حيث ينتهي تمدد الصدر ويبدأ تجهم الكتف، ودع المدى ينمو مع تأقلم المفصل." },
          { error: "رفس الأرجل لاقتناص زخم صاعد.", fix: "اضرب الكاحلين خلفك ودع الجسم بندولًا ساكنًا؛ فما إن تبدأ الأرجل بالتأرجح حتى تكون المجموعة قد انتهت بصمت والتكرارات مستعارة." },
        ],
        alternatives: "عائلة البنش تحمل الألياف الصدرية نفسها وأكتاف مدعومة — وهي البديل الطبيعي للأكتاف المتعبة. البنش المائل للأسفل يحاكي تركيز الديبس على الصدر السفلي من على بنش. ومنزليًا، الضغط المائل بقدمين على كرسي أقرب تقريب حر، وتحمل مكتبتنا صفحته. وبينهما تجلس ماكينة الديبس التي تتيح ضبط أحمال دقيقة تحت وزن الجسم — جسر مشروعة للعودة إلى القضبان لمن يعيد البناء.",
        progression: "يبدأ السلم تحت وزن الجسم: سالبات القفز والثبات (اصعد درجة وأنزل ببطء) تبني القوة السالبة أولًا، ثم ديبس بمطاط مساعد، ثم ديبس كامل حتى عمق تمدد الصدر — وسم المتوسط في هذه الصفحة وجهة لا نقطة بداية. ومن هناك: حمل مضاف بحزام ديبس، أو توقفات في القاع، أو نزول ثلاث ثوان، تجعل الحركة تنمو لسنوات. وقانون العمق لا يتغير أبدًا — اكسب كل بوصة مدى إضافية بأسابيع من الامتلاك لا بمجموعة شجاعة واحدة.",
        programming: "برمجه كرفعة دفع رئيسية أو كعمل مساعد ثقيل: 3-4 مجموعات من 6-12 تكرارًا براحة دقيقتين إلى ثلاث، مرة أو مرتين أسبوعيًا. وكتمرين ثانٍ في يوم دفع يتبع البنش فيعمّق تحفيز الصدر السفلي، وكرفعة أولى في جلسة قصيرة يحمل الحمل كله. ويقترن الديبس شهرةً بالعقلة يومًا كاملًا للجزء العلوي بأدنى معدات — أربع مجموعات لكل منهما وقضبان فقط، وركن أغلب الصالات يحمل الاثنين.",
        safety: "الكتف هو قصة السلامة كلها: قاع الديبس يضعه تحت حمل عند أقصى تمدد، وهو بالضبط الموضع الذي تصيبه التكرارات المهملة. إشارة العمق الأمينة — توقف حيث ينتهي تمدد الصدر — تحميه. ومن لديه تاريخ ألم أمامي بالكتف أو مشكلات المفصل الأخرمي فليعامل الديبس كأداة اختصاصي: مدى جزئي، وإيقاع بطيء، وعودة تدريجية، أو نسخة الماكينة حتى يقرر المفصل. ووخز القص في القاع إشارة توقف لا إشارة تمدد.",
      },
    },
    faq: {
      en: [
        { q: "Chest dips or triceps dips — how do I tell them apart?", a: "By the torso: this page's instructions build the chest version on a thirty-degree forward lean with slight elbow flare, while the triceps version keeps the body vertical and the elbows tight. Same bars, different lifts — and doing both in one session double-books the shoulders, so pick a lead and let the other visit another day." },
        { q: "Dips hurt my shoulders at the bottom — am I too deep?", a: "Usually, or too fast. Depth in dips is joint-dependent: the honest bottom is where YOUR chest stretch ends, which may be shallower than the lifter on the next bars. Add a controlled two-second lower and shorten the range to the pain-free zone for a few weeks before re-testing deeper." },
        { q: "How do I add weight to dips?", a: "With a dip belt once bodyweight reps reach twelve to fifteen clean — a belt with a chain threaded through plates, or a dumbbell held between crossed ankles as the budget option. Add roughly 5 kg at a time and let the rep count fall back to the 6-10 range; the load climbs from there on the same schedule as any press." },
      ],
      ar: [
        { q: "ديبس الصدر أم ديبس الترايسبس — كيف أفرّق بينهما؟", a: "بالجذع: تعليمات هذه الصفحة تبني نسخة الصدر على ميل أمامي ثلاثين درجة مع تفتيح خفيف للمرفقين، بينما تحفظ نسخة الترايسبس الجسم عموديًا والمرفقين مضمومين. نفس القضبان ورفعتان مختلفتان — وأداء الاثنين في جلسة واحدة يحجز الأكتاف مرتين، فاختر قائدًا ودع الآخر يزور يومًا آخر." },
        { q: "الديبس يؤلم أكتافي في القاع — هل أنزل عميقًا أكثر من اللازم؟", a: "غالبًا، أو أسرع من اللازم. العمق في الديبس يتوقف على المفصل: فالقاع الأمين هو حيث ينتهي تمدد صدرك أنت، وقد يكون أضحل من المتدرب على القضبان المجاورة. أضف نزولًا متحكمًا بثانيتين وقصّر المدى إلى منطقة بلا ألم بضعة أسابيع قبل إعادة اختبار العمق." },
        { q: "كيف أضيف وزنًا إلى الديبس؟", a: "بحزام ديبس حين تبلغ تكرارات وزن الجسم اثني عشر إلى خمسة عشر نظيفة — حزام بسلسلة تخترق الأقراص، أو دمبل ممسكة بين كاحلين مضروبين كخيار اقتصادي. أضف نحو 5 كجم في المرة ودع عدّ التكرارات يهبط إلى نطاق 6-10، ثم يصعد الحمل من هناك على جدول أي رفعة دفع." },
      ],
    },
    links: [
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training at home — the complete guide", labelAr: "تمارين الصدر في المنزل — الدليل الكامل" },
      { hrefEn: "/exercises/dips-triceps-version", hrefAr: "/ar/exercises/dips-triceps-version", labelEn: "Triceps dips — the vertical cousin", labelAr: "ديبس الترايسبس — القريب العمودي" },
      { hrefEn: "/blog/budget-home-gym-equipment-comparison", hrefAr: "/ar/blog/choose-weightlifting-shoes-men", labelEn: "Budget home gym equipment compared", labelAr: "دليل اختيار أحذية رفع الأثقال" },
    ],
  },
};
