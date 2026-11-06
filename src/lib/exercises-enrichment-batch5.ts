/**
 * EXERCISES-ENRICHMENT — BATCH 5 (exercises 21-25 of 50).
 *
 * The back family's loaded half: the two rowing heads the gym economy
 * runs on (wide-grip lat pulldown, bent-over barbell row, one-arm
 * dumbbell row, seated cable row) and the barbell deadlift — the
 * library's most secondary-muscle-rich row and the anchor of every
 * strength program page this site publishes.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_5: Record<string, ExerciseEnrichment> = {
  "wide-grip-lat-pulldown": {
    intro: {
      en: "The wide-grip lat pulldown is the pull-up's adjustable alter ego: the same pulling geometry — palms forward, torso leaned back some thirty degrees, bar drawn to the upper chest — with the load dialed to whatever today requires instead of whatever gravity insists. The instructions carry the full grip law this library teaches, from wide beyond the shoulders down to close inside them, and the wide setting this page is named for makes the lats do the work at their longest, most horizontal line. It is the exercise every first pull-up chases and every advanced back day still books: the machine that lets the back train at any strength, on any day, at any rep count the program demands.",
      ar: "السحب الأمامي الواسع هو التوأم القابل للضبط للعقلة: نفس هندسة السحب — راحتان للأمام وجذع مائل للخلف نحو ثلاثين درجة وبار يُسحب إلى الصدر العلوي — لكن الحمل مضبوط على ما يطلبه اليوم بدل ما تصر عليه الجاذبية. تحمل التعليمات قانون القبضة الكامل الذي تعلمه هذه المكتبة، من الواسعة خارج الكتفين إلى الضيقة داخلها، والوضع الواسع الذي تحمل الصفحة اسمه يجعل اللات تعمل على أطول خط لها وأفقّه. إنه التمرين الذي يطارد به كل مبتدئ أول عقلة وما يزال يحجزه كل يوم ظهر متقدم: ماكينة تتيح للظهر التدرب بأي قوة وفي أي يوم وبأي عدد تكرارات تطلبه البرنامج.",
    },
    sections: {
      en: {
        muscles: "The lats run the wide pulldown — the instructions' cue of drawing the shoulders and upper arms down and back is the lat's own line of pull, made literal by the machine. The mid-back's rhomboids gather the shoulder blades as the bar arrives, the biceps bend the elbows on contract, and the shoulders hold the wide grip open, a job the library lists among its seconds. The knee pad matters more than it looks: it pins the body down so the lats pull the bar, not the bar pull the body — the difference between a back exercise and a ride.",
        mistakes: [
          { error: "Leaning way back and rowing the bar to the collarbone with body English.", fix: "The instructions specify around thirty degrees of lean, held still — the torso is a ramp, not a rowboat; every extra inch of lean is a rep the lats never pulled." },
          { error: "Pulling with the biceps and forearms, elbows driving down in front.", fix: "Lead with the elbows and think shoulders-down-and-back — the page's own tips say it: initiate from the shoulder blades, and the forearms are hooks, not engines." },
          { error: "Letting the stack yank the arms back up between reps.", fix: "Control the return until the lats are fully stretched, as the instructions stage it — the lengthened position is where the wide grip pays its rent, and a free-falling return skips the payment." },
          { error: "Half-reps that never let the bar reach the upper chest.", fix: "The touchpoint is the top of the chest, not the chin — when the bar stops rising, the set's honest range is over; count full pulls or drop the pin." },
        ],
        alternatives: "Pull-ups — this library's own page — are the same pattern at bodyweight and the destination the pulldown trains you for. The close-grip and medium-grip settings shift work toward the mid-back and arms; the one-arm lat pulldown exposes and fixes side differences. On the floor of the same family, the seated cable row — its page sits elsewhere in this library — pulls horizontally for mid-back thickness, making the two stations the classic width-and-thickness pairing every back program books.",
        progression: "The machine's pin makes the ladder unusually honest: start at a load allowing three clean sets of ten with the thirty-degree lean intact, and climb one plate when the last set's final rep still touches the chest. The richer progressions are technical — a two-second squeeze at the contracted position, a three-second stretch at the top, a one-second pause with the bar an inch off the chest — each worth more than the next pin. And the proudest progression runs outside the machine: as the pulldown climbs toward bodyweight, the first pull-up approaches, and this page's FAQ neighbor charts that road.",
        programming: "Program it as the main pull of a back session or the second exercise after pull-ups: 3-4 sets of 8-12 reps with 90-120 seconds of rest, once or twice a week. On beginner programs it carries the entire vertical-pulling slot while the pull-up develops; on intermediate splits it alternates with pull-ups across the week — heavy pulldown day, bodyweight pull-up day. It pairs naturally before horizontal rowing: width first, thickness after, the order most back sessions inherit.",
        safety: "The shoulder is the joint the wide grip negotiates with: taken past your natural width, the grip pinches the front of the joint at the stretch. Wide means just outside the shoulders-plus-a-hand, not the collarbone's ends. The knee pad is a safety feature, not a cushion — set it snug, or the load you are pulling becomes a load pulling you. And heavy half-reps with a yanked stack are the machine's classic rotator-cuff tax; the pin is adjustable, the cuff is not.",
      },
      ar: {
        muscles: "اللات تشغل السحب الواسع — فإشارة التعليمات بشدّ الكتفين والذراعين العلويين للأسفل والخلف هي خط السحب الخاص باللات نفسه، مجسدًا بالماكينة. ومعينات الظهر تجمع لوحي الكتف مع وصول البار، والعضلة ذات الرأسين تثني المرفقين عند العقد، والأكتاف تحمل القبضة الواسعة مفتوحة، وهي وظيفة تسجلها المكتبة بين مساعديها. ووسادة الركبة أهم مما تبدو: إنها تدسّ الجسم أرضًا كي تسحب اللات البار، لا ليسحب البار الجسم — وهذا الفرق بين تمرين ظهر ورحلة.",
        mistakes: [
          { error: "الانحناء بعيدًا للخلف وتجديف البار إلى الترقوة بمكر الجسد.", fix: "تحدد التعليمات نحو ثلاثين درجة من الميل ثابتة — فالجذع منحدر لا قارب تجديف؛ وكل شبر ميل إضافي تكرار لم تسحبه اللات أبدًا." },
          { error: "السحب بالذراعين والساعدين والمرفقان يقودان أمامًا.", fix: "قِد بالمرفقين وفكر كتفان-أسفل-وخلف — تقولها نصائح الصفحة نفسها: ابدأ من لوحي الكتف، والساعدان خطاطيف لا محركات." },
          { error: "ترك الرصة تقتلع الذراعين صاعدًا بين التكرارات.", fix: "اضبط العودة حتى تتمدد اللات كاملة كما تجهز التعليمات؛ فالوضع الممدود حيث تدفع القبضة الواسعة إيجارها، والعودة الساقطة تتخطى الدفع." },
          { error: "أنصاف تكرارات لا تصل بالبار إلى الصدر العلوي أبدًا.", fix: "نقطة اللمس أعلى الصدر لا الذقن — وحين يتوقف البار عن الصعود ينتهي المدى الأمين للمجموعة؛ عُدّ السحبات الكاملة أو انزل بالوتد." },
        ],
        alternatives: "العقلة — صفحتها في مكتبتنا — هي النمط نفسه بوزن الجسم، والوجهة التي يدربك لها السحب. والوضعان الضيق والمتوسط ينقلان العمل نحو منتصف الظهر والذراعين، والسحب بذراع واحدة يكشف الفروق بين الجهتين ويصلحها. وعلى أرض العائلة نفسها، تجديف الكابل جالسًا — صفحته في مكان آخر من هذه المكتبة — يسحب أفقيًا لسماكة منتصف الظهر، فتصبح المحطتان ثنائي العرض والسماكة الكلاسيكي الذي يحجزه كل برنامج ظهر.",
        progression: "وتد الماكينة يجعل السلم أمينًا على نحو غير معتاد: ابدأ بحمل يسمح بثلاث مجموعات نظيفة من عشرة مع بقاء ميل الثلاثين درجة سالمًا، واصعد قرصًا حين تظل تكرارية المجموعة الأخيرة تلامس الصدر. والتدرجات الأغنى فنية — عصرة ثانيتين عند الوضع المنقبض، وتمدد ثلاث ثوان في الأعلى، وتوقف ثانية والبار على بوصة من الصدر — وكل منها يساوي أكثر من الوتد التالي. وأشرف التدرجات يجري خارج الماكينة: كلما صعد السحب نحو وزن الجسم اقتربت أول عقلة، وجار هذه الصفحة في الأسئلة يرسم ذلك الطريق.",
        programming: "برمجه كسحبة اليوم الرئيسية لجلسة ظهر أو تمرينًا ثانيًا بعد العقلة: 3-4 مجموعات من 8-12 تكرارًا براحة 90-120 ثانية، مرة أو مرتين أسبوعيًا. وفي برامج المبتدئين يحمل خانة السحب العمودي كاملة بينما تنضج العقلة؛ وفي تقسيمات الوسط يتناوب مع العقلة عبر الأسبوع — يوم سحب ثقيل بالماكينة ويوم عقلة بوزن الجسم. ويقترن طبيعيًا قبل التجديف الأفقي: العرض أولًا والسماكة بعده، وهو الترتيب الذي ترثه أغلب جلسات الظهر.",
        safety: "الكتف هو المفصل الذي يتفاوض معه الوضع الواسع: فالقبضة المدفوعة أبعد من عرضك الطبيعي توخز مقدمة المفصل عند التمدد. الواسع تعني خارج الكتفين بيد لا أطراف الترقوة. ووسادة الركبة ميزة أمان لا مخدة — اضبطها محكمة، وإلا صار الحمل الذي تسحبه حملًا يسحبك. وأنصاف التكرارات الثقيلة برصة مغتصبة ضريبة الكفة الدوارة الكلاسيكية للماكينة؛ الوتد قابل للضبط والكفة لا.",
      },
    },
    faq: {
      en: [
        { q: "Wide grip or close grip for lats?", a: "Wide for the lat line at its longest — that is this page's version and the width-building default. Close and medium grips let the mid-back and arms share more, and they suit lifters whose shoulders grumble at wide work. The honest program runs both across a block, exactly as the grip law in the instructions lays the options out." },
        { q: "Can pulldowns replace pull-ups?", a: "As training, nearly: the pattern and muscles match, and every lifter not yet at pull-ups builds the strength here first. As a test, never — the pull-up's bodyweight standard is a fixed star the pulldown can point at but never replace. The practical rule: pulldown until the pin nears your bodyweight, then test the bar, then alternate both." },
        { q: "Why do my biceps burn before my back tires?", a: "The arms are the louder partner in every pull until you learn to lead from the shoulder blades — this page's own tips name the fix. A lighter pin plus the cue elbows-down-and-back moves the burn within two sessions; grip the bar like hooks rather than handles, and the biceps stop auditioning for the lead." },
      ],
      ar: [
        { q: "القبضة الواسعة أم الضيقة للات؟", a: "الواسعة لخط اللات في أطوله — وهي نسخة هذه الصفحة وافتراضي بناء العرض. والقبضتان الضيقة والمتوسطة تدعان منتصف الظهر والذراعين تتقاسمان أكثر، وتناسبان من تتذمر أكتافهم من العمل الواسع. والبرنامج الأمين يشغل الاثنتين عبر كتلة، تمامًا كما يرتب قانون القبضة في التعليمات الخيارات." },
        { q: "هل يستطيع السحب تعويض العقلة؟", a: "كتدريب، تقريبًا: النمط والعضلات متطابقة، وكل من لم يبلغ العقلة بعد يبني القوة هنا أولًا. كاختبار، أبدًا — فمعيار وزن الجسم للعقلة نجم ثابت يشير إليه السحب ولا يستبدله. والقاعدة العملية: اسحب حتى يقترب الوتد من وزنك، ثم اختبر البار، ثم ناوب بينهما." },
        { q: "لماذا تحترق ذراعاي قبل تعب ظهري؟", a: "الذراعان الشريك الأعلى صوتًا في كل سحبة حتى تتعلم القيادة من لوحي الكتف — وتسمي نصائح هذه الصفحة الإصلاح. وتد أخف مع إشارة مرفقان-أسفل-وخلف تنقل الاحتراق خلال جلستين؛ امسك البار كخطاطيف لا كمقابض، فتتوقف الذراعان عن الترشح للبطولة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/pullups", hrefAr: "/ar/exercises/pullups", labelEn: "Pullups — the bodyweight destination", labelAr: "العقلة — وجهة وزن الجسم" },
      { hrefEn: "/exercises/seated-cable-rows", hrefAr: "/ar/exercises/seated-cable-rows", labelEn: "Seated cable rows — the thickness half", labelAr: "تجديف الكابل جالسًا — نصف السماكة" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "How often should you train back?", labelAr: "كم مرة تدرب الظهر أسبوعيًا؟" },
    ],
  },

  "bent-over-barbell-row": {
    intro: {
      en: "The bent-over barbell row is the back's barbell bench: one bar, one hinge, one honest measure of how much weight you can row with your torso locked at almost parallel to the floor — the position the instructions demand, head up, back straight, knees softly bent. It is the old-school thickness builder, the movement that piles load onto the mid-back, lats and traps at once, and it hides a second exercise inside it: the isometric hinge your posterior chain holds for every rep of the set. It is the row most lifters meet first and the one serious back training never retires.",
      ar: "التجديف بالبار منحنيًا هو بنش الظهر بالبار: بار واحد ومفصلة واحدة ومقياس أمين واحد لكم وزنًا تستطيع تجديفه وجذعك مقفول عند شبه موازاة للأرض — الوضع الذي تطلبه التعليمات: رأس مرفوع وظهر مستقيم وركبتان مثنيتان برفق. إنه باني السماكة القديم، الحركة التي تكدس الحمل على منتصف الظهر واللات والترابيس معًا، وتخفي تمرينًا ثانيًا داخلها: المفصلة الثابتة التي يحملها سلسلة ظهرك الخلفية طوال كل تكرار في المجموعة. وهو التجديف الذي يلتقي به أغلب المتدربين أولًا والذي لا تقاعدنه أبدًا برامج الظهر الجادة.",
    },
    sections: {
      en: {
        muscles: "The mid-back leads — the library's primary billing — with the rhomboids and mid-traps pulling the bar into the torso, and the lats joining from their lower fibers as the elbows pass the ribs. The biceps and shoulders fill their secondary seats, but the row's hidden payroll is the hinge: hamstrings, glutes and spinal erectors hold the bent-over position isometrically for the whole set, which is why heavy rows feel like two exercises happening to one body. The forearms grip, the back pulls, and the posterior chain pays the rent on the position that makes both possible.",
        mistakes: [
          { error: "Standing up rep by rep until the row becomes a shrug.", fix: "The torso angle is fixed cargo — set the hinge at almost parallel as the instructions state, and if the load pulls you upright, the load is lying to you about being rowable." },
          { error: "Yanking the bar with a lurching torso for momentum.", fix: "The page's tips are blunt — keep the torso still: the lats and mid-back pull the bar while the trunk stays a statue; momentum rows feed nothing but ego." },
          { error: "Rounding into a scared cat as the set gets heavy.", fix: "Head up, chest proud, back straight — the instructions' hinge law — and the spine stays stacked under load; the moment the round arrives, the set has ended even if the bar keeps moving." },
          { error: "Rowing to the chest with flared elbows.", fix: "Elbows travel close to the ribs, bar to the lower torso — flared elbows hand the rep to the rear delts and shrug muscles, and the mid-back watches from the bench." },
        ],
        alternatives: "The one-arm dumbbell row — its page sits in this same library — trains each side alone with a bench to support the hinge, the friendlier entry and the permanent diagnostic. The seated cable row holds the torso still by design and loads the mid-back through a longer constant-tension arc. The chest-supported row removes the lower back from the payroll entirely. Pendlay rows (from the floor each rep) trade some load for strictness; T-bar machines give the same arc with balance handled — every variation keeps the family promise: the bar pulled into the torso by the back.",
        progression: "Earn the position before the plates: two weeks of light rows at the almost-parallel hinge build the isometric hinge the movement stands on. Load then climbs in small jumps while the angle holds — the row's true gauge is not the weight moved but the weight moved at the same angle. Intermediate lifters rotate the grip law this page inherits from the library: overhand for mid-back, underhand to invite the lats, and the same bar becomes two exercises. When the hinge starts failing under heavy sets, the belt earns its place.",
        programming: "Book it as the main row of a back day: 3-4 sets of 6-12 reps with 2-3 minutes of rest, once or twice a week — heavy rows are taxing on the lower back, so space row-heavy days from deadlift days by at least 48 hours. It slots naturally after the vertical pull: pulldown or pull-up for width, barbell row for thickness, the sequence most back sessions inherit. In full-body plans it often alternates with the deadlift across the week — one hinge per session, two jobs split honestly.",
        safety: "The lower back is the row's whole risk ledger: the bent-over position under load is where spine discipline pays or injures. The instructions' setup law — head up, back straight, knees soft — is the insurance policy, and any set that cannot hold it is too heavy regardless of the bar's opinion. Lifters with a cranky lower back should let the supported versions carry the load while the hinge retrains, and everyone should treat the row as the technical lift it is rather than the ego canvas it is not.",
      },
      ar: {
        muscles: "منتصف الظهر يقود — الفاتورة الأساسية للمكتبة — والمعينات والترابيس الوسطى تسحبان البار إلى الجذع، واللات تنضم من أليافها السفلى حين تجتاز المرفقان الأضلاع. والذراعان والكتفان تملآن مقعديهما المساعدين، لكن كشف أجور الخفي في التجديف هو المفصلة: فأوتار الفخذ والألويات وباسطات العمود تحمل وضع الانحناء ثباتيًا طوال المجموعة، ولهذا تبدو الصفوف الثقيلة تمرينين يحدثان لجسد واحد. الساعدان تمسكان والظهر يسحب وسلسلة الظهر الخلفية تدفع إيجار الوضع الذي يجعل كليهما ممكنًا.",
        mistakes: [
          { error: "النهوض تكرارًا بعد تكرار حتى يصير التجديف هزًّا للكتفين.", fix: "زاوية الجذع شحنة ثابتة — اضبط المفصلة عند شبه الموازاة كما تنص التعليمات، وإذا شدّك الحمل واقفًا فالحمل يكذب عليك بأنه قابل للتجديف." },
          { error: "انتزاع البار بحركة جذع متدافعة طلبًا للزخم.", fix: "نصائح الصفحة صريحة — ثبّت الجذع: اللات ومنتصف الظهر يسحبان البار بينما يبقى الجذع تمثالًا؛ فالتجديفات بالزخم تطعم الأنا لا شيء غيرها." },
          { error: "التقوس في هيئة قطة خائفة مع ثقل المجموعة.", fix: "رأس مرفوع وصدر شامخ وظهر مستقيم — قانون المفصلة في التعليمات — فيبقى العمود مكدسًا تحت الحمل؛ وما إن يصل التقوس حتى تكون المجموعة انتهت حتى لو واصل البار الحركة." },
          { error: "التجديف إلى الصدر بمرفقين متفتحين.", fix: "يسافر المرفقان قريبين من الأضلاع والبار إلى الجذع الأسفل — فالمرفقان المتفتحان يسلمان التكرار للكتف الخلفية وعضلات الهز، ومنتصف الظهر يتفرج على البنش." },
        ],
        alternatives: "تجديف الدمبل بذراع واحدة — صفحته في هذه المكتبة نفسها — يدرّب كل جهة وحدها مع بنش يسند المفصلة، وهو المدخل الألطف والتشخيص الدائم. وتجديف الكابل جالسًا يثبت الجذع بالتصميم ويحمل منتصف الظهر عبر قوس شد أطول. وتجديف الصدر المسنود يخرج أسفل الظهر من كشف الأجور كليًا. وتجديفات بندلي (من الأرض كل تكرار) تقايض بعض الحمل بالصرامة، وماكينات التي-بار تعطي القوس نفسه مع تولي التوازن — كل تنويع يحفظ وعد العائلة: بار يُسحب إلى الجذع بالظهر.",
        progression: "اكسب الوضع قبل الأقراص: أسبوعان من صفوف خفيفة عند مفصلة شبه الموازاة تبنيان الثبات الذي تقف عليه الحركة. ثم يصعد الحمل بقفزات صغيرة مع بقاء الزاوية — فمقياس التجديف الحقيقي ليس الوزن المحرك بل الوزن المحرك بنفس الزاوية. ويدور المتوسطون بقانون القبضة الذي ترثه هذه الصفحة من المكتبة: علوية لمنتصف الظهر، وسفلية لدعوة اللات، فيصبح البار نفسه تمرينين. وحين تبدأ المفصلة بالفشل تحت المجموعات الثقيلة يستحق الحزام مكانه.",
        programming: "احجزه كتجديف يوم الظهر الرئيسي: 3-4 مجموعات من 6-12 تكرارًا براحة دقيقتين إلى ثلاث، مرة أو مرتين أسبوعيًا — فالصفوف الثقيلة باهظة على أسفل الظهر، فباعد بين أيام التجديف الثقيل وأيام الديدلفت ثمانٍ وأربعين ساعة على الأقل. ويستقر طبيعيًا بعد السحب العمودي: سحب أو عقلة للعرض وتجديف بالبار للسماكة، التسلسل الذي ترثه أغلب جلسات الظهر. وفي خطط الجسم الكامل يتناوب غالبًا مع الديدلفت عبر الأسبوع — مفصلة واحدة لكل جلسة ووظيفتان منقسمتان بأمانة.",
        safety: "أسفل الظهر هو دفتر مخاطر التجديف كله: فوضع الانحناء تحت الحمل هو المكان الذي يدفع فيه انضباط العمود أرباحه أو إصاباته. وقانون الإعداد في التعليمات — رأس مرفوع وظهر مستقيم وركبتان لينتان — هو بوليصة التأمين، وأي مجموعة لا تحفظه ثقيلة أكثر من اللازم مهما كان رأي البار. ومن لديه أسفل ظهر متعب فليدع النسخ المسنودة تحمل الحمل بينما تعاد المفصلة تدريبًا، وعلى الجميع معاملة التجديف كرفعة تقنية هي، لا كلية أنانية ليست.",
      },
    },
    faq: {
      en: [
        { q: "How far should I bend over?", a: "The instructions set the honest target — torso almost parallel to the floor, back straight, head up. That full hinge maximizes the mid-back's job and is the standard this page teaches; a 45-degree cheat-lean is a legitimate heavier variation some programs rotate in, but it should be a choice, never the accidental default the load decides for you." },
        { q: "Overhand or underhand grip?", a: "Overhand, as this page's instructions stage it, keeps the mid-back and traps the focus and the elbows tracking the ribs. Underhand invites the lats and biceps to pull more and lets most lifters row heavier — a different exercise at the same bar. Run overhand in thickness blocks, underhand in lat blocks, and log them separately." },
        { q: "My lower back gives out before my upper back — fix?", a: "The hinge is undertrained relative to the pull, the classic case in desk-bound athletes. Two weeks of lighter rows with the position locked, plus a few sets of back extensions on off days, usually rebalance the ledger; if the back still rounds under modest loads, the chest-supported row carries your thickness work while the hinge catches up." },
      ],
      ar: [
        { q: "كم أنحني؟", a: "تضع التعليمات الهدف الأمين — جذع شبه موازٍ للأرض بظهر مستقيم ورأس مرفوع. فتلك المفصلة الكاملة تعظم وظيفة منتصف الظهر وهي المعيار الذي تعلمه هذه الصفحة؛ وميل الخمس وأربعين درقة الغشّاش تنويع أثقل مشروع تدور به بعض البرامج، لكن يجب أن يكون اختيارًا لا افتراضيًا عرضيًا يقرره الحمل عنك." },
        { q: "قبضة علوية أم سفلية؟", a: "العلوية كما تجهز تعليمات هذه الصفحة تحفظ تركيز منتصف الظهر والترابيس ومسار المرفقين على الأضلاع. والسفلية تدعو اللات والذراعين للسحب أكثر وتتيح لأغلب المتدربين تجديفًا أثقل — تمرين مختلف على البار نفسه. شغّل العلوية في كتل السماكة والسفلية في كتل اللات وسجّلهما منفصلين." },
        { q: "أسفل ظهري ينفد قبل ظهري العلوي — ما الحل؟", a: "المفصلة أقل تدريبًا من السحب، وهي الحالة الكلاسيكية لدى الرياضيين المكتبين. أسبوعان من صفوف أخف بوضع مقفول، مع بضع مجموعات تمديد ظهر في أيام الراحة، يعيدان الدفتر لتوازنه غالبًا؛ وإن استمر التقوس تحت أحمال متواضعة فليحمل تجديف الصدر المسنود عمل سماكتك حتى تلتحق المفصلة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/one-arm-dumbbell-row", hrefAr: "/ar/exercises/one-arm-dumbbell-row", labelEn: "One-arm dumbbell row — the supported version", labelAr: "تجديف الدمبل بذراع واحدة — النسخة المسنودة" },
      { hrefEn: "/exercises/barbell-deadlift", hrefAr: "/ar/exercises/barbell-deadlift", labelEn: "Barbell deadlift — the other hinge", labelAr: "الديدلفت — المفصلة الأخرى" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "Training frequency — how often per muscle", labelAr: "تكرار تدريب كل مجموعة عضلية" },
    ],
  },

  "one-arm-dumbbell-row": {
    intro: {
      en: "The one-arm dumbbell row is the back exercise that tells the truth about your sides: one hand on the bench, one bell in the working hand, and nowhere for a stronger arm to hide. The instructions stage the classic three-point stance — same-side knee and hand on the bench, torso parallel to the floor — and the row that follows pulls the dumbbell straight up to the side of the chest while the trunk refuses to rotate. It is the most-booked row in gym history precisely because it needs one bench, one dumbbell, and nothing else: the entry point for beginners, the diagnostic for the advanced, and the permanent resident of every back day between them.",
      ar: "تجديف الدمبل بذراع واحدة هو تمرين الظهر الذي يقول الحقيقة عن جهتيك: يد على البنش وجرس في اليد العاملة، ولا مكان لذراع أقوى لتختبئ فيه. تجهز التعليمات الوقفة ثلاثية النقاط الكلاسيكية — الركبة واليد من نفس الجهة على البنش والجذع موازٍ للأرض — ويتبعها تجديف يسحب الدمبل مستقيمًا إلى جانب الصدر بينما يرفض الجذع الدوران. إنه أكثر تجديف حجزًا في تاريخ الصالات تحديدًا لأنه يحتاج بنشًا ودمبلًا ولا شيء غيرهما: بوابة المبتدئين، وتشخيص المتقدمين، والمقيم الدائم لكل يوم ظهر بينهما.",
    },
    sections: {
      en: {
        muscles: "The mid-back owns the pull — the library's primary list — with the lats pulling from underneath as the bell climbs the ribs and the rhomboids cinching the shoulder blade toward the spine at the top. The biceps handle their share of elbow duty, and the shoulders stabilize the working arm's line. The hidden cast works the stance: the non-working side's lat and the whole trunk brace against rotation, making this as much an anti-rotation core exercise as a row — the bell pulls the body around, and the trunk's entire job is to say no.",
        mistakes: [
          { error: "Twisting the torso to heave the bell higher.", fix: "The chest points at the floor the whole set — the instructions lock the torso; if the bell will not rise without a twist, it has risen far enough, honestly." },
          { error: "Rowing with the elbow flared out to the side.", fix: "The instructions draw the upper arm close to the side, bell to the side of the chest — the elbow leads back toward the hip, not out toward the wall, and the lats finally clock in." },
          { error: "Yanking the bell up and letting it free-fall down.", fix: "One second up with a squeeze, two seconds down — the page's tips demand the pause at full contraction, and the return trip is where half the lat's tension lives." },
          { error: "Rounding the supporting back into a hammock.", fix: "The support arm stays long, the back flat and parallel as the instructions set it — a sagging bench-side spine turns a back builder into a spine bender." },
        ],
        alternatives: "The barbell row — its page sits alongside — loads both sides at once and taxes the hinge; the chest-supported row removes the trunk's bracing job entirely for pure upper-back focus. The seated cable row gives the same unilateral idea through a handle and constant tension. At home, a row with a band anchored to a door, or a backpack row over the edge of a bed, keeps the pattern alive with zero equipment — the family's real gift is how little it demands.",
        progression: "The ladder starts lighter than symmetry suggests: begin with a bell the weaker side can row for ten strict reps, and let that side set the terms for both. Climb in two-kilo jumps when the top rep still reaches the chest without torso twist. The technical progressions follow the same law as every row — a two-second squeeze at the top, a three-second lower, a pause with the bell an inch off the floor at the stretch — and one more this row owns: the dead-stop version, bell resting on the floor between reps, kills every ounce of bounce.",
        programming: "Book it as the main row of a beginner back session or the second row of an advanced one: 3-4 sets of 8-12 reps per side with 60-90 seconds of rest, once or twice a week. Unilateral rows suit every program because the bench does the bracing: heavy days, tired days, lower-back-tender days — the dumbbell row is always open. Pair it with a vertical pull and the day's back work is structurally complete; our home dumbbell program books exactly that pairing on pull days.",
        safety: "The support-side shoulder takes more load than lifters notice — keep the support arm long but not locked, and shift the hand inward if it aches. The working shoulder is safe by geometry so long as the torso stays square; rotation under load is the mechanism that ruins it. And the bell's return path passes the bench's edge: keep the floor clear, because a dropped bell on the way down is this exercise's only common accident, and it is entirely avoidable by lowering under control.",
      },
      ar: {
        muscles: "منتصف الظهر يملك السحب — القائمة الأساسية للمكتبة — واللات تسحب من الأسفل مع صعود الجرس على الأضلاع والمعينات تشدّ لوح الكتف نحو العمود في القمة. والعضلة ذات الرأسين تتولى نصيبها من وظيفة المرفق، والأكتاف تثبتان خط الذراع العاملة. والطاقم الخفي يعمل في الوقفة: فلات الجهة غير العاملة والجذع كله يقاومان الدوران، وهذا يجعل الحركة تمرين بطن مضاد للدوران بقدر ما هي تجديف — فالجرس يشدّ الجسم ليديره، ووظيفة الجذع كلها أن تقول لا.",
        mistakes: [
          { error: "لف الجذع لرفع الجرس أعلى.", fix: "يصوب الصدر نحو الأرض طوال المجموعة — تقفل التعليمات الجذع؛ وإذا لم يرتفع الجرس بلا لفّة فقد ارتفع بما يكفي بأمانة." },
          { error: "التجديف بمرفق متفتح للجانب.", fix: "تسحب التعليمات أعلى الذراع قريبًا من الجانب والجرس إلى جانب الصدر — يقود المرفق للخلف نحو الورك لا نحو الحائط، فتحضر اللات أخيرًا." },
          { error: "انتزاع الجرس صاعدًا وتركه يسقط حرًا هابطًا.", fix: "ثانية صعودًا مع عصرة وثانيتان نزولًا — تطلب نصائح الصفحة التوقف عند أقصى انقباض، ورحلة العودة تسكن نصف شدّ اللات." },
          { error: "تقويس ظهر السند في هيئة أرجوحة.", fix: "تبقى ذراع السند طويلة والظهر مسطحًا موازيًا كما يضبطه الإعداد — فالعمود المتدلي من جهة البنش يحول بانيًا للظهر إلى حانٍ للعمود." },
        ],
        alternatives: "التجديف بالبار — صفحته تجاورها — يحمل الجهتين معًا ويفرض ضريبة على المفصلة، وتجديف الصدر المسنود يزيل وظيفة شد الجذع كليًا لتركيز علوي خالص. وتجديف الكابل جالسًا يعطي الفكرة الأحادية نفسها عبر مقبض وشد دائم. ومنزليًا، تجديف بمطاط مرتكز على باب أو تجديف حقيبة ظهر من حافة سرير يبقيان النمط حيًا بلا معدات — وهبة العائلة الحقيقية هي قلة مطالبها.",
        progression: "يبدأ السلم أخف مما توحي به التناظرية: ابدأ بجرس تستطيع الجهة الأضعف تجديفها عشر تكرارات صارمة، ودع تلك الجهة تحدد الشروط للاثنتين. اصعد بقفزات كيلوجرامين حين تظل التكرارية الأخيرة تبلغ الصدر بلا لفّ جذع. وتتبع التدرجات الفنية نفس قانون كل تجديف — عصرة ثانيتين في القمة، ونزول ثلاث ثوان، وتوقف والجرس على بوصة من الأرض عند التمدد — وزيادة تملكها هذه الحركة وحدها: نسخة التوقف الميت، الجرس يرتاح على الأرض بين التكرارات، تقتل كل أونصة ارتداد.",
        programming: "احجزه كتجديف جلسة ظهر المبتدئ الرئيسي أو التجديف الثاني للمتقدم: 3-4 مجموعات من 8-12 تكرارًا لكل جهة براحة 60-90 ثانية، مرة أو مرتين أسبوعيًا. التجديف الأحادي يناسب كل برنامج لأن البنش يتولى الشد: أيام ثقيلة وأيام تعب وأيام ظهر حساس — تجديف الدمبل مفتوح دائمًا. اقرنه بسحب عمودي فيكون عمل ظهر اليوم مكملًا بنيويًا؛ وبرنامج الدمبل المنزلي لدينا يحجز هذا الاقتران بالضبط في أيام السحب.",
        safety: "كتف جهة السند تحمل أكثر مما يلاحظ المتدربون — أبقِ ذراع السند طويلة غير مقفلة، وأزح اليد للداخل إن تألمت. والكتف العاملة آمنة بالهندسة ما بقي الجذع مربعًا؛ فالدوران تحت الحمل هو الآلية التي تفسدها. ومسار عودة الجرس يمر بحافة البنش: أبقِ الأرض خالية، لأن سقوط الجرس في النزول هو الحادث الشائع الوحيد لهذا التمرين، وهو قابل للمنع كليًا بالنزول المتحكم.",
      },
    },
    faq: {
      en: [
        { q: "Should the knee stay on the bench?", a: "The three-point stance this page teaches — hand and same-side knee on the bench — is the classic and stablest setup. The two-point version (feet on the floor, hand only on the bench) loads the anti-rotation demand higher and suits experienced lifters; both are right, and the choice is a difficulty dial, not a form verdict." },
        { q: "How heavy should the dumbbell be?", a: "The weaker side decides: pick the bell it can row for ten clean reps with a square torso, and work both sides at that weight — the strength gap closes fastest under that rule. A bell the strong side loves and the weak side swings is not a training tool; it is a diagnostic result you already knew." },
        { q: "Why do I feel this in my triceps of all places?", a: "Grip death-grip — squeezing the handle for dear life recruits the forearm and its neighbors before the back ever pulls. Hook the hand, focus the squeeze on the shoulder blade at the top, and the triceps goes back to being a bystander within a session or two." },
      ],
      ar: [
        { q: "هل تبقى الركبة على البنش؟", a: "الوقفة ثلاثية النقاط التي تعلمها هذه الصفحة — اليد والركبة من نفس الجهة على البنش — هي الكلاسيكية الأثبت. ونسخة النقطتين — القدمان على الأرض واليد وحدها على البنش — ترفع مطلب مقاومة الدوران وتناسب المتدربين المتمرنين؛ وكلاهما صحيح، والاختيار قرص صعوبة لا حكم على الوضعية." },
        { q: "كم وزن الدمبل المناسب؟", a: "الجهة الأضعف تقرر: اختر الجرس التي تجديفه عشر تكرارات نظيفة بجذع مربع، ودرب الجهتين بهذا الوزن — فالفجوة تلتئم أسرع تحت هذه القاعدة. والجرس تحبه القوية وتتأرجح بها الضعيفة ليست أداة تدريب؛ إنها نتيجة تشخيص كنت تعرفها أصلًا." },
        { q: "لماذا أشعر بهذه الحركة في ترايسبسي من كل الأماكن؟", a: "قبضة الموت — فالشد على المقبض بكل قوة الحياة يجند الساعد وجيرانه قبل أن يسحب الظهر أصلًا. علّق اليد، وركّز العصرة على لوح الكتف في القمة، فتعود العضلة ثلاثية الرؤوس متفرجة خلال جلسة أو اثنتين." },
      ],
    },
    links: [
      { hrefEn: "/exercises/bent-over-barbell-row", hrefAr: "/ar/exercises/bent-over-barbell-row", labelEn: "Bent-over barbell row — the barbell version", labelAr: "التجديف بالبار — النسخة بالبار" },
      { hrefEn: "/blog/12-week-dumbbell-band-muscle-plan", hrefAr: "/ar/blog/home-muscle-building-guide-simple-weights", labelEn: "12-week dumbbell & band muscle plan", labelAr: "بناء العضلات في المنزل بأوزان بسيطة" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track each side separately — free tracker", labelAr: "سجل كل جهة على حدة — المتتبع المجاني" },
    ],
  },

  "barbell-deadlift": {
    intro: {
      en: "The barbell deadlift is the library's biggest muscle list wrapped around its simplest instruction: pick the bar up, stand at attention, put it back down. The instructions keep the classic law — back straight, medium overhand grip, drive with the legs, chest out at the top like a soldier — and the exercise's secondary billing runs to nine muscle groups, from quads and glutes to traps, forearms and lats. Nothing else in this library recruits so much of the body against one bar. It anchors every strength program this site publishes and half of its beginner guides, and it earned the seat: the deadlift is the number from which all gym conversations measure distance.",
      ar: "الديدلفت بالبار هو أكبر قائمة عضلات في المكتبة ملتفة حول أبسط تعليماتها: ارفع البار عن الأرض، قف منتبهًا، أعده أرضًا. تحفظ التعليمات القانون الكلاسيكي — ظهر مستقيم وقبضة علوية متوسطة ودفع بالساقين وصدر مبروز في القمة كجندي — وتمتد الفاتورة المساعدة للحركة إلى تسع مجموعات عضلية، من الفخذ الأمامي والألويات إلى الترابيس والساعدين واللات. لا شيء آخر في هذه المكتبة يجند هذا الكم من الجسم ضد بار واحد. يرسو في كل برنامج قوة ينشره هذا الموقع ونصف أدلة المبتدئين فيه، وقد استحق المقعد: فالديدلفت هو الرقم الذي تقيس منه كل أحاديث الصالة مسافاتها.",
    },
    sections: {
      en: {
        muscles: "The posterior chain does the lifting and the library's billing reads like an anatomy tour: lower back as the primary, with glutes and hamstrings extending the hips, quads driving the bar off the floor, lats packing it against the body, traps and forearms holding everything that hangs. The lift's real magic is positional: every one of those muscles works at its strongest length simultaneously, which is why the deadlift moves more weight than any other exercise and why its technique is a full-time study. The grip is the movement's doorway — the instructions' alternate grip and straps note is the door policy.",
        mistakes: [
          { error: "Rounding the lower back to reach the bar.", fix: "Hips higher than the knees, chest over the bar, back locked straight before the pull — the instructions' starting law; if the back cannot stay flat at that setup, the hips are too low or the mobility is a project." },
          { error: "Yanking the bar off the floor with a jerk.", fix: "Pull the slack out first — bar against the plates, body tight, then drive; a jerk start breaks position before the lift begins and the spine files the complaint." },
          { error: "Hyperextending the lower back at the lockout.", fix: "The finish is the soldier's attention stance the instructions describe — chest up, glutes squeezed, standing tall; leaning back past vertical adds risk and lifts nothing." },
          { error: "Squatting the deadlift: hips dropping, shins far forward.", fix: "The deadlift is a hinge with bent knees, not a squat from the floor — shoulders slightly ahead of the bar, hips higher than a squat's, and the bar drags up the shins' line." },
        ],
        alternatives: "The Romanian deadlift — its page sits in this same library — holds the top position and loads the hamstrings through a longer arc; the trap bar trades the straight bar's technique tax for a friendlier center of gravity. Rack pulls shorten the range for overload blocks; sumo widens the stance for lifters whose hips prefer it. At home, the pattern lives in the hip thrust family and heavy backpack lifts — the hinge is portable even when the barbell is not.",
        progression: "Earn the pattern with the empty bar before the plates: five sets of five at a load where the back stays visibly flat, filmed from the side — the camera is the deadlift's most honest coach. Load climbs in 5-10 kilo jumps while the positions hold, and the intermediate lifter's ladder is the classic three-step: five sets of five for volume, three reps for load, singles at 85 percent and up for peaking. Between blocks, the Romanian deadlift keeps the hinge honest while the full lift rests.",
        programming: "Program it as the main lift of a lower or full-body day: 3-5 work sets of 3-6 reps with 3-5 minutes of rest, once a week for most lifters — the deadlift's systemic cost is the highest in the gym, and twice-weekly pulling is a specialist's schedule. It pairs with squats across the week rather than inside one session; our 5×5 program alternates them on opposite days. After the top set, back-off sets at 80-90 percent build volume without another maximal exposure.",
        safety: "The lower back is the whole safety conversation, and its protection is positional, not optional: a flat back under a modest load out-trains a rounded back under any load. Belts help trained lifters brace at heavy percentages; they do not fix a broken setup. And the deadlift punishes fatigue accumulations quietly — the rep that feels fine and rounds anyway is the one that ends quarters, so end sessions while the position is still sharp, not when the arms are empty.",
      },
      ar: {
        muscles: "السلسلة الخلفية تتولى الرفع وتقرأ فاتورة المكتبة كجولة تشريح: أسفل الظهر أساسيًا، والألويات وأوتار الفخذ تمدّان الوركين، والفخذ الأمامي يقود البار عن الأرض، واللات تحزمه إلى الجسم، والترابيس والساعدان يحملان كل ما يتدلى. وسحر الرفعة الحقيقي مكاني: فكل عضلة من تلك تعمل عند أقوى طول لها في وقت واحد، ولهذا يحرك الديدلفت وزنًا أكثر من أي تمرين آخر ولهذا تقنيته دراسة دوام كامل. والقبضة باب الحركة — وملاحظة التعليمات عن القبضة المتبادلة والأحزمة هي سياسة الباب.",
        mistakes: [
          { error: "تقويس أسفل الظهر للوصول إلى البار.", fix: "وركان أعلى من الركبتين وصدر فوق البار وظهر مقفول مستقيم قبل السحب — قانون البداية في التعليمات؛ وإن تعذر الظهر المستوي بهذا الإعداد فالوركان منخفضان أكثر من اللازم أو المرونة مشروع." },
          { error: "انتزاع البار عن الأرض برفة.", fix: "اسحب الارتخاء أولًا — البار ملاصق للأقراص والجسم مشدود ثم ادفع؛ فالبداية بالرف تكسر الوضعية قبل أن تبدأ الرفعة ويقدّم العمود شكواه." },
          { error: "فرط مدّ أسفل الظهر عند القفل.", fix: "الختام وضع انتباه الجندي الذي تصفه التعليمات — صدر أعلى وألويات معصورة ووقوف شامخ؛ والميل خلف الاستقامة يضيف خطرًا ولا يرفع شيئًا." },
          { error: "سكواتة الديدلفت: هبوط الوركين وتقدم الساقين كثيرًا للأمام.", fix: "الديدلفت مفصلة بركب مثنية لا سكوات من الأرض — كتفان قليلًا أمام البار ووركان أعلى من السكوات، والبار يتسلق خط الساقين." },
        ],
        alternatives: "الديدلفت الروماني — صفحته في هذه المكتبة نفسها — يحفظ الوضع العلوي ويحمل أوتار الفخذ عبر قوس أطول، وبار المصيدة يقايض ضريبة تقنية البار المستقيم بمركز ثقل ألطف. والرفعات من الرف تقصّر المدى لكتل التحميل، والسومو يوسع الوقفة لمن تناسب وركيه. ومنزليًا يعيش النمط في عائلة دفع الورك ورفعات الحقيبة الثقيلة — فالمفصلة قابلة للنقل حتى حين لا يكون البار كذلك.",
        progression: "اكسب النمط ببار فارغ قبل الأقراص: خمس مجموعات من خمس بحمل يبقى فيه الظهر مستويًا مرئيًا، مصورًا من الجانب — فالكاميرا أصدق مدرب للديدلفت. يصعد الحمل بقفزات 5-10 كيلوجرامات مع ثبات المواضع، وسلم المتوسط هو الثلاثية الكلاسيكية: خمس×خمس للحجم، وثلاثيات للحمل، وفرديات عند 85 بالمئة فأعلى للذروة. وبين الكتل يحفظ الروماني أمانة المفصلة بينما ترتاح الرفعة الكاملة.",
        programming: "برمجه كرفعة اليوم الرئيسية لجلسة سفلية أو جسم كامل: 3-5 مجموعات عمل من 3-6 تكرارات براحة 3-5 دقائق، مرة أسبوعيًا لأغلب المتدربين — فكلفة الديدلفت الجهازية أعلى ما في الصالة، والسحب مرتين أسبوعيًا جدول اختصاصي. يقترن بالسكوات عبر الأسبوع لا داخل جلسة واحدة؛ وبرنامج 5×5 لدينا يناوبهما في أيام متقابلة. وبعد المجموعة القصوى تبني مجموعات التراجع عند 80-90 بالمئة حجمًا بلا تعرض أقصى آخر.",
        safety: "أسفل الظهر هو محادثة السلامة كلها، وحمايته موضعية لا اختيارية: فالظهر المستوي تحت حمل متواضع يتدرب أفضل من الظهر المقوس تحت أي حمل. والأحزمة تساعد المتدربين المتمرنين على الشد عند النسب الثقيلة، ولا تصلح إعدادًا مكسورًا. والديدلفت يعاقب تراكمات التعب بصمت — فالتكرار الذي يبدو سليمًا ويتقوس رغم ذلك هو الذي يُنهي الأرباع، فاختم الجلسات والوضعية ما تزال حادة لا حين تفرغ الذراعان.",
      },
    },
    faq: {
      en: [
        { q: "Mixed grip, straps, or double overhand?", a: "Double overhand as the default — it trains the grip the lift depends on, as this page's instructions set up. Mixed grip (one hand reversed) when the bar starts rolling out of overhand hands at heavy loads; straps when the target is the posterior chain and the grip is the meeting's weakest attendee. Each choice is a tool, and the log should note which one the number belongs to." },
        { q: "Do deadlifts build the whole back?", a: "They load it: the library's own secondary list runs from lats and traps through mid-back — isometrically, under more absolute load than any row can offer. Direct rowing work builds the back's pulling shape through movement; the deadlift builds its ability to hold heavy things while standing. Programs that want both, book both." },
        { q: "Should the bar touch my shins?", a: "It starts against them and stays close the whole way — the bar dragging up the shins' vertical line is the geometry that keeps the load under the shoulders and the back flat. Pants or tall socks are the deadlifter's uniform for exactly this reason; a bar drifting forward of the mid-foot is a back angle leaking, and the shins are where you feel it first." },
      ],
      ar: [
        { q: "قبضة مختلطة أم أحزمة أم علوية مزدوجة؟", a: "العلوية المزدوجة افتراضيًا — فهي تدرب القبضة التي تعتمد عليها الرفعة كما تجهز تعليمات هذه الصفحة. والقبضة المختلطة (يد معكوسة) حين يبدأ البار بالدوران خارج اليدين تحت الأحمال الثقيلة، والأحزمة حين يكون الهدف السلسلة الخلفية والقبضة أضعف الحاضرين في الاجتماع. كل خيار أداة، والسجل يجب أن يذكر أيّها يخص الرقم." },
        { q: "هل يبني الديدلفت الظهر كله؟", a: "يحمّله: قائمة المكتبة المساعدة تمتد من اللات والترابيس إلى منتصف الظهر — ثباتيًا وتحت حمل مطلق أكبر مما يقدمه أي تجديف. وعمل التجديف المباشر يبني شكل سحب الظهر عبر الحركة، والديدلفت يبني قدرته على حمل الأشياء الثقيلة واقفًا. والبرامج التي تريد الاثنين تحجز الاثنين." },
        { q: "هل يلامس البار ساقيّ؟", a: "يبدأ ملاصقًا لهما ويبقى قريبًا طوال الطريق — فتسلق البار الخط العمودي للساقين هو الهندسة التي تحفظ الحمل تحت الكتفين والظهر مستويًا. والبنطلونات الطويلة أو الجوارب العالية زي لاعب الديدلفت لهذا السبب بالضبط؛ فالبار المنحرف أمام منتصف القدم تسريب لزاوية الظهر، والساقان أول مكان تشعر فيه بذلك." },
      ],
    },
    links: [
      { hrefEn: "/exercises/romanian-deadlift", hrefAr: "/ar/exercises/romanian-deadlift", labelEn: "Romanian deadlift — the hinge companion", labelAr: "الديدلفت الروماني — رفيق المفصلة" },
      { hrefEn: "/programs/gym-strength-5x5", hrefAr: "/ar/programs/gym-strength-5x5", labelEn: "5×5 strength program — deadlift day included", labelAr: "برنامج القوة 5×5 — يشمل يوم الديدلفت" },
      { hrefEn: "/blog/deload-week-rest-training-guide", hrefAr: "/ar/blog/optimal-rest-periods-resistance-training", labelEn: "Deload and rest — the recovery side of pulling", labelAr: "فترات الراحة للرفعات الثقيلة" },
    ],
  },

  "seated-cable-rows": {
    intro: {
      en: "The seated cable row is the back's thickness station: a V-handle on a low pulley, feet planted, torso at ninety degrees to the legs, and the instructions' full-length law — arms extended, a stretch felt in the lats, then the handles pulled to the abdominals with a hard squeeze. Where the pulldown builds the wings' width from above, the cable row builds the back's density from the front of you, and the stack keeps the tension honest through every millimeter of the pull. It is the row most programs actually run: joint-friendly, endlessly loadable, and honest about the squeeze most freestyle rows fake.",
      ar: "تجديف الكابل جالسًا هو محطة سماكة الظهر: مقبض مزدوج على بكرة سفلية وقدمان مغروستان وجذع بتسعين درجة من الساقين، وقانون الطول الكامل في التعليمات — ذراعان ممدودتان وتمدد يُحسّ في اللات ثم سحب المقابض إلى البطن بعصرة شديدة. فحيث يبني السحب الأمامي عرض الأجنحة من الأعلى، يبني تجديف الكابل كثافة الظهر من أمامه، وتحفظ الرصة الشد أمينًا عبر كل ملليمتر من السحب. وهو التجديف الذي تؤديه البرامج فعلًا: لطيفًا على المفاصل وقابلًا للتحميل بلا نهاية وصادقًا بشأن العصرة التي تزيّفها أغلب التجديفات الحرة.",
    },
    sections: {
      en: {
        muscles: "The mid-back takes the primary billing — rhomboids and mid-traps pulling the shoulder blades together as the handle meets the abdomen — and the lats run the first half of every rep from the fully stretched start the instructions insist on. The biceps share elbow duty, the shoulders steady the arms, and the erectors hold the ninety-degree torso like a mast. The V-bar's neutral grip is a quiet gift: palms facing each other let the elbows track close and the back do the pulling without the wrists negotiating angles the straight bar demands.",
        mistakes: [
          { error: "Rocking the torso back and forth like a rowing machine.", fix: "The instructions lock the torso at ninety degrees with a slight arch — the trunk is a mast, not a pendulum; every inch of rock is a rep the stack, not the back, pulled." },
          { error: "Shrugging the shoulders up toward the ears on every pull.", fix: "Shoulders down and back — the squeeze happens between the blades, and a shrugged row is a trap exercise wearing a back exercise's clothes." },
          { error: "Cutting the stretch short at the front of the rep.", fix: "The instructions demand arms fully extended and the lats stretched before the pull begins — the lengthened start is half the exercise, and half-rep rows build half backs." },
          { error: "Letting the handle yank the body forward between reps.", fix: "Control the return with the trunk braced — the stack's pull on the way out is the row's second half, not a free ride to a shorter range." },
        ],
        alternatives: "The barbell row loads heavier and taxes the hinge; the one-arm dumbbell row diagnoses sides; the chest-supported machine row removes the trunk entirely. The close-grip handle this page teaches emphasizes the mid-back, while a wide bar on the same pulley shifts work outward to the lats — the station is a wardrobe. At home, band rows anchored low around a post reproduce the pattern, and this library's home programs run them exactly as seated-row deputies.",
        progression: "The pin is the honest ladder: begin with a load allowing three sets of ten with the mast law intact, and climb when the final rep still reaches the abdomen without torso rock. The progression that matters more is range: a full stretch at the front, a two-second squeeze at the back, and the discipline to refuse the pin's next plate when either end shortens. Advanced rowers add tempo — three seconds out through the stretch — which turns a modest pin into serious back work.",
        programming: "Book it as the horizontal pull of a back day, after the vertical pull: 3-4 sets of 10-12 reps with 90 seconds of rest, once or twice a week. It suits every slot on the weekly map — heavy day, volume day, tired day — because the seated position spends nothing on balance and the stack spends everything on the back. In push-pull-legs it anchors pull day's thickness half; in upper-lower splits it rides the upper days, and our program templates place it precisely there.",
        safety: "The cable row is among the back family's gentlest — the load path is fixed, the weight is a pin, and the seat removes the hinge entirely. The two honest cautions live at the rep's ends: control the stretch so the stack does not yank the shoulders forward at speed, and keep the lower back's slight arch instead of rounding to meet the handle — the instructions' ninety-degree law with chest out exists for exactly that. Knee discomfort means the seat is set too close; slide back until the legs are quiet passengers.",
      },
      ar: {
        muscles: "منتصف الظهر يأخذ الفاتورة الأساسية — المعينات والترابيس الوسطى تسحبان لوحي الكتف معًا حين يلتقي المقبض بالبطن — واللات تدير النصف الأول من كل تكرار من البداية الممدودة تمامًا التي تصر عليها التعليمات. والعضلة ذات الرأسين تتقاسم وظيفة المرفق، والأكتاف تثبتان الذراعين، والباسطات تحمل الجذع ذا التسعين درجة كصارية. والقبضة المحايدة للمقبض المزدوج هدية صامتة: راحتان متقابلتان تدعان المرفقين يسلكان قريبين والظهر يسحب دون أن تتفاوض الرسغان على زوايا يطلبها البار المستقيم.",
        mistakes: [
          { error: "تأرجح الجذع ذهابًا وإيابًا كأنك على ماكينة تجديف.", fix: "تقفل التعليمات الجذع عند تسعين درجة بتقوس خفيف — فالجذع صارية لا بندول؛ وكل شبر تأرجح تكرار سحبته الرصة لا الظهر." },
          { error: "هزّ الكتفين نحو الأذنين مع كل سحبة.", fix: "كتفان أسفل وخلف — فالعصرة تحدث بين اللوحين، والتجديف المهزوز تمرين ترابيس يلبس ثياب تمرين ظهر." },
          { error: "قصر التمدد في مقدمة التكرار.", fix: "تطالب التعليمات بذراعين ممدودتين كاملتين ولات ممدودة قبل بدء السحب — فالبداية الممدودة نصف التمرين، وتجديفات نصف المدى تبني أنصاف ظهور." },
          { error: "ترك المقبض يقتلع الجسم أمامًا بين التكرارات.", fix: "اضبط العودة والجذع مشدود — فشدّ الرصة في طريق الخروج نصف التجديف الآخر لا مجانية نحو مدى أقصر." },
        ],
        alternatives: "التجديف بالبار يحمل أثقل ويفرض ضريبة على المفصلة، وتجديف الدمبل بذراع واحدة يشخّص الجهتين، وماكينة التجديف المسنودة تزيل الجذع كليًا. والمقبض الضيق الذي تعلمه هذه الصفحة يركز منتصف الظهر، بينما ينقل بار واسع على البكرة نفسها العمل خارجًا إلى اللات — فالمحطة خزانة ملابس. ومنزليًا، تجديف المطاط المرتكز منخفضًا حول عماد يعيد إنتاج النمط، وبرامجنا المنزلية تشغّله كنائب عن التجديف الجالس بالضبط.",
        progression: "الوتد هو السلم الأمين: ابدأ بحمل يسمح بثلاث مجموعات من عشر وقانون الصارية سالم، واصعد حين تظل التكرارية الأخيرة تبلغ البطن بلا تأرجح جذع. والتدرج الأهم هو المدى: تمدد كامل في المقدمة وعصرة ثانيتين في المؤخرة، والانضباط برفض القرص التالي حين يقصر أي الطرفين. ويضيف المتقدمون الإيقاع — ثلاث ثوان خروجًا عبر التمدد — فتحول وتدًا متواضعًا إلى عمل ظهر جاد.",
        programming: "احجزه كسحبة أفقية ليوم ظهر بعد السحب العمودي: 3-4 مجموعات من 10-12 تكرارًا براحة تسعين ثانية، مرة أو مرتين أسبوعيًا. يناسب كل خانة في الخريطة الأسبوعية — يوم ثقيل ويوم حجم ويوم تعب — لأن الجلوس لا ينفق شيئًا على التوازن والرصة تنفق كل شيء على الظهر. وفي دفع-سحب-أرجل يرسو في نصف السماكة ليوم السحب؛ وفي علوي-سفلي يركب الأيام العلوية، وقوالب برامجنا تضعه هناك بدقة.",
        safety: "تجديف الكابل من ألطف أفراد عائلة الظهر — مسار الحمل ثابت والوزن وتد والمقعد يزيل المفصلة كليًا. والتحذيران الأمينان يسكنان طرفي التكرار: اضبط التمدد كي لا تقتلع الرصة الكتفين أمامًا بسرعة، وحافظ على التقوس الخفيف لأسفل الظهر بدل التقوس لملاقاة المقبض — فقانون التسعين درجة بصدر مبروز في التعليمات موجود لهذا بالضبط. وإنزعاج الركبة يعني أن المقعد قريب جدًا؛ انزلق للخلف حتى تصبح الساقان راكبتين هادئتين.",
      },
    },
    faq: {
      en: [
        { q: "Should I lean back during the pull?", a: "A slight lean with the pull is natural and fine — the instructions' ninety-degree frame allows the torso to travel a few degrees with the rep. A big layback that heaves the stack is the theft this page's tips warn about: the back builds when it pulls the handle, not when the trunk rows the stack." },
        { q: "Why don't I feel cable rows in my back?", a: "Almost always the arms: grip like hooks, lead with the elbows, and squeeze the blades together for a full second at the abdomen. The second suspect is a shortened range — no stretch at the front means no loaded lat at the start. Two sessions with a lighter pin and those two cues usually relocate the burn." },
        { q: "Close handle or wide bar on the same station?", a: "Close, as this page teaches, for mid-back thickness — elbows down, blades squeezing. A wide bar with an overhand grip turns the station into a horizontal lat exercise, elbows flaring slightly out. Two different rows at one machine; most programs rotate them across a block rather than defend one." },
      ],
      ar: [
        { q: "هل أميل للخلف أثناء السحب؟", a: "ميل خفيف مع السحبة طبيعي وسليم — فإطار التسعين درجة في التعليمات يسمح للجذع بالسفر درجات قليلة مع التكرار. أما الاستلقاء الكبير الذي يقلب الرصة فهو السرقة التي تحذر منها نصائح هذه الصفحة: فالظهر يُبنى حين يسحب المقبض لا حين يجدف الجذع الرصة." },
        { q: "لماذا لا أشعر بتجديف الكابل في ظهري؟", a: "السبب دائمًا تقريبًا الذراعان: امسك كخطاطيف وقِد بالمرفقين واعصر اللوحين معًا ثانية كاملة عند البطن. والمتهم الثاني مدى مقصوص — فلا تمدد في المقدمة يعني لا لات محملة في البداية. جلستان بوتد أخف مع هاتين الإشارتين تنقلان الاحتراق عادة." },
        { q: "المقبض الضيق أم البار الواسع على المحطة نفسها؟", a: "الضيق كما تعلم هذه الصفحة لسماكة منتصف الظهر — مرفقان للأسفل ولوحان يعصران. والبار الواسع بقبضة علوية يحول المحطة إلى تمرين لات أفقي بمرفقين متفتحين قليلًا. صفّان مختلفان على ماكينة واحدة؛ وأغلب البرامج تدور عليهما عبر الكتلة بدل الدفاع عن أحدهما." },
      ],
    },
    links: [
      { hrefEn: "/exercises/wide-grip-lat-pulldown", hrefAr: "/ar/exercises/wide-grip-lat-pulldown", labelEn: "Wide-grip lat pulldown — the width half", labelAr: "السحب الأمامي الواسع — نصف العرض" },
      { hrefEn: "/exercises/one-arm-dumbbell-row", hrefAr: "/ar/exercises/one-arm-dumbbell-row", labelEn: "One-arm dumbbell row — the diagnostic", labelAr: "تجديف الدمبل بذراع واحدة — التشخيص" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "Training frequency — how often per muscle", labelAr: "تكرار تدريب كل مجموعة عضلية" },
    ],
  },
};
