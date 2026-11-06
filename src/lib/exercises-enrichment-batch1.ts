/**
 * EXERCISES-ENRICHMENT — BATCH 1 (exercises 1-5 of 50).
 *
 * The GSC-measured demand winners (comprehensive audit 2026-10-31 §2.3-2.4):
 * the five exercise pages with the strongest real query-demand evidence —
 * tricep-dumbbell-kickback (16 impressions, the site's #1 exercise page),
 * crunches (9 impressions at position 7.4 — first page), leg-lift (9),
 * kettlebell-pistol-squat (AR mirror, 4 impressions at 6.25) and
 * exercise-ball-crunch (AR mirror, index-verified).
 *
 * Every fact quoted about the movement (angles, positions, tempo cues)
 * comes from the exercise's own row in src/lib/exercises.ts; programming
 * numbers are standard coaching prescription stated as practice guidance.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_1: Record<string, ExerciseEnrichment> = {
  "tricep-dumbbell-kickback": {
    intro: {
      en: "The dumbbell kickback is the one triceps move where the muscle works its hardest exactly where most exercises go easy: the fully shortened position. Your data page already tells you why — you hinge forward until your torso is almost parallel to the floor, pin your upper arm against your side, and move only the forearm through that 90-degree starting angle. Because the arm hangs behind the body, the long head of the triceps stays under tension at lockout, which pushdowns never achieve. It is also the triceps move that needs the least equipment in the library: one dumbbell and a strict hinge are the whole setup, which is why it travels equally well from the busiest gym to the smallest home corner. The trade-off is honest — it punishes ego loading. A weight you can swing is a weight you cannot kick back.",
      ar: "تمرين الكيك باك بالدمبل هو الحركة الوحيدة للترايسبس التي تعمل فيها العضلة بأقصى ما يمكن في الوضع الذي تتجاهله معظم التمارين الأخرى: وضع الانقباض الكامل. بيانات صفحة التمرين نفسها تشرح السبب؛ إذ تنحني للأمام حتى يصبح جذعك موازيًا للأرض تقريبًا، وتثبّت أعلى ذراعك بمحاذاة جسمك، ثم تحرّك الساعد وحده انطلاقًا من زاوية 90 درجة في وضع البداية. ولأن الذراع تتدلى خلف الجسم، يظل الرأس الطويل للترايسبس مشدودًا عند مد الذراع بالكامل، وهو ما لا تحققه تمارين الدفع السفلية أبدًا. وهو أيضًا حركة الترايسبس الأقل متطلبات في المكتبة كلها: دمبل واحد وانحناءة منضبطة هما الإعداد كله، ولهذا تنتقل الحركة بالكفاءة نفسها من أكثر الصالات ازدحامًا إلى أصغر زاوية في المنزل. والثمن واضح وصادق: التمرين يعاقب الأوزان الكبيرة المتسرعة، فأي وزن تستطيع تأرجحه هو وزن لا تستطيع أداء الكيك باك به.",
    },
    sections: {
      en: {
        muscles: "The triceps brachii does essentially all of the lifting here, and it does it alone — the library lists no secondary muscles for this movement, which is exactly right. All three heads extend the elbow, but the setup is what shifts the emphasis: because the upper arm is pinned parallel to the floor and slightly behind the torso, the long head — the one that crosses the shoulder joint — is held in a lengthened, loaded position throughout the set. Your rear delts and lats quietly hold the hinge position, but if your lats feel the burn, your elbow has drifted and the triceps has stopped being the mover.",
        mistakes: [
          { error: "Upper arm swings with each rep, turning the movement into a mini row.", fix: "Pretend your elbow is bolted to your ribcage; only the forearm is allowed to travel." },
          { error: "Loading a dumbbell so heavy the arm never reaches full lockout.", fix: "Drop to a weight you can hold squeezed for a full second at extension — kickbacks are a feel exercise, not a numbers exercise." },
          { error: "Rounding the lower back in the hinge and letting the head drop.", fix: "Set the hinge with a slight knee bend, chest lifted and eyes forward, exactly as the starting-position step describes, and re-set it between reps." },
          { error: "Snapping the forearm back with momentum, then letting it free-fall.", fix: "Exhale up for one count, squeeze, then lower for two; the return trip is half the exercise." },
        ],
        alternatives: "No dumbbells or a cranky elbow? A cable column set at the bottom gives the same behind-the-body arm path with constant tension — our triceps pushdown page covers the setup. Overhead rope extensions train the long head in the opposite position (stretched under load), and the decline close-grip bench to skull crusher builds the kind of heavy pressing strength kickbacks deliberately skip. At home, a resistance band anchored under the front foot reproduces the kickback pattern for almost no cost.",
        progression: "As a beginner-flagged movement, the entry bar is low: master the hinge and the frozen elbow with 2-3 kg before touching anything heavier. Once 15 strict reps feel easy, progress along one of three paths — add load in small increments, switch to single-arm kickbacks with the free hand braced on a bench so each side works alone, or introduce a two-second pause at full extension to make light weights feel heavy again. Advanced trainees can superset kickbacks after a press or pushdown so the triceps is already fatigued when the precise work begins.",
        programming: "Kickbacks earn their slot as a finisher, not a foundation. Two to 3 sets of 10-15 reps per arm at the end of a push session, resting 45-60 seconds, is the standard prescription — the muscle is small and recovers fast, and by this point in the session it is already warm. If triceps is a priority block, pair kickbacks with a heavy compound press earlier in the same workout (the close-grip family) so the long head gets both loaded and shortened work in one session. Train it 2-3 times per week at most, with at least a day between direct triceps sessions.",
        safety: "The elbow is the structure to respect here. If you feel pinching at the back of the joint during lockout, shorten the range to just before the pinch and build back out gradually — never push through sharp elbow pain. Lifters with cranky shoulders often struggle to hold the deep hinge; elevating one hand on a bench fixes the position without changing the exercise.",
      },
      ar: {
        muscles: "العضلة ثلاثية الرؤوس تتولى العمل هنا وحدها تقريبًا، وهذه حقيقة تؤكدها بيانات المكتبة نفسها التي لا تسجل أي عضلات مساعدة لهذه الحركة. الرؤوس الثلاث تمدّ المرفق، لكن الإعداد هو ما يصنع التمييز: فبسبب تثبيت أعلى الذراع موازيًا للأرض وقليلًا خلف الجذع، يظل الرأس الطويل — الوحيد الذي يعبر مفصل الكتف — في وضع ممد ومحمّل طوال المجموعة. عضلات الكتف الخلفية والظهر تحافظ على وضعية الانحناء بصمت، لكن إذا شعرت بالحرقان في عضلات ظهرك فاعلم أن مرفقك انحرف وخرج الترايسبس من مساحة العمل.",
        mistakes: [
          { error: "تأرجح أعلى الذراع مع كل تكرار فيتحول التمرين إلى تجديف مصغّر.", fix: "تخيل أن مرفقك مثبّت بمسمار في قفصك الصدري؛ الساعد وحده مسموح له بالحركة." },
          { error: "اختيار دمبل ثقيل لدرجة أن الذراع لا تصل إلى المد الكامل أبدًا.", fix: "انزل إلى وزن تستطيع تثبيته معصورًا لثانية كاملة عند الامتداد؛ الكيك باك تمرين إحساس لا تمرين أرقام." },
          { error: "تقوّس أسفل الظهر أثناء الانحناء وإسقاط الرأس للأمام.", fix: "اضبط وضعية الانحناء بثني الركبتين قليلًا ورفع الصدر والنظر للأمام كما تصف خطوة وضع البداية تمامًا، وأعد ضبطها بين التكرارات." },
          { error: "قذف الساعد للخلف بالزخم ثم تركه يسقط بحرية.", fix: "ازفر أثناء الرفع في عدّة واحدة، اعصر العضلة، ثم انزل في عدّتين؛ رحلة العودة نصف فائدة التمرين." },
        ],
        alternatives: "لا توجد دمبلات أو مرفق مزعج؟ عمود الكابل المثبت في الأسفل يمنح نفس مسار الذراع خلف الجسم مع شد مستمر، وصفحة دفع الترايسبس لدينا تشرح الإعداد بالتفصيل. تمارين مد الذراع فوق الرأس بالحبل تدرّب الرأس الطويل في الوضع المعاكس (ممد تحت الحمل)، بينما يبني البنش القريب القبضة المائل لبناء قوة الدفع الثقيلة التي يتجاوزها الكيك باك عمدًا. وفي المنزل، يعيد مطاط المقاومة المثبت تحت القدم الأمامية إنتاج نمط الكيك باك بتكلفة شبه معدومة.",
        progression: "بما أن التمرين مصنف للمبتدئين، فإن عتبة الدخول منخفضة: أتقن وضعية الانحناء والمرفق المجمد بوزن 2-3 كجم قبل أي زيادة. وحين تصبح 15 تكرارًا نظيفة سهلة، تدرّج عبر أحد ثلاثة مسارات: زيادة الحمل بمقادير صغيرة، أو التحويل إلى كيك باك بذراع واحدة مع تثبيت اليد الحرة على بنش ليعمل كل جانب بمفرده، أو إضافة توقف لثانيتين عند الامتداد الكامل لتصبح الأوزان الخفيفة ثقيلة من جديد. ويمكن للمتقدمين إلحاق الكيك باك بعد تمرين دفع أو دفع سفلي بحيث تبدأ العضلة عملها الدقيق وهي متعبة أصلًا.",
        programming: "يستحق الكيك باك مكانه كحركة ختامية لا كحركة أساسية. مجموعتان إلى ثلاث من 10-15 تكرارًا لكل ذراع في نهاية جلسة دفع، مع راحة 45-60 ثانية، هي الوصفة المعتادة؛ فالعضلة صغيرة وتتعافى سريعًا، وهي أصلًا دافئة عند هذه النقطة من الجلسة. إذا كان الترايسبس أولوية في مرحلتك، فاقرن الكيك باك بحركة دفع مركبة ثقيلة في بداية نفس الجلسة لتأخذ العضلة نصيبها من الشدد الموجّه والمختصر معًا. درّبه مرتين إلى ثلاث أسبوعيًا على الأكثر مع يوم فاصل بين أي جلستين مباشرتين للترايسبس.",
        safety: "المرفق هو البنية التي تستحق الاحترام هنا. إذا شعرت بوخز مؤلم في مؤخرة المفصل أثناء المد الكامل، فقصّر المدى إلى ما قبل الوخز مباشرة ثم وسّعه تدريجيًا، ولا تتجاوز ألم المرفق الحاد أبدًا. وغالبًا ما يجد أصحاب الأكتاف الحساسة صعوبة في تثبيت الانحناء العميق؛ رفع إحدى اليدين على بنش يصلح الوضعية دون تغيير التمرين نفسه.",
      },
    },
    faq: {
      en: [
        { q: "Why can't I lift as much on kickbacks as on pushdowns?", a: "Because the leverage is terrible on purpose. The arm hangs behind the body, so the triceps lifts the weight through its weakest, fully shortened position. A dumbbell you can curl is often heavier than one you can kick back — that is the exercise working as designed." },
        { q: "Should both arms kick back at the same time?", a: "The library's instructions describe a dumbbell in each hand, and that is the standard setup. If one side lags or your form breaks, switch to single-arm kickbacks with the free hand braced on a bench — the chest-supported position makes cheating almost impossible." },
        { q: "Do kickbacks build the whole triceps?", a: "They train all three heads at the elbow, but the long head is the star because the arm-behind-torso position keeps it loaded at lockout. Pair them with an overhead movement for the stretched position and a close-grip press for heavy loading, and the three-headed muscle has covered all its bases." },
      ],
      ar: [
        { q: "لماذا لا أستطيع رفع نفس وزن الدفع السفلي في الكيك باك؟", a: "لأن الرافعة الميكانيكية سيئة عمدًا. الذراع تتدلى خلف الجسم فيرفع الترايسبس الوزن من خلال أضعف أوضاعه وهو وضع الانقباض الكامل. غالبًا ما تكون الدمبل التي ترفعها بالكيرل أثقل من تلك التي تؤدي بها الكيك باك، وهذا دليل على أن التمرين يعمل كما صُمم." },
        { q: "هل أؤدي الحركة بالذراعين معًا أم منفردتين؟", a: "تعليمات المكتبة تصف دمبلًا في كل يد وهذا هو الإعداد القياسي. إذا تأخر أحد الجانبين أو اختلت وضعيتك فانتقل إلى الكيك باك بذراع واحدة مع تثبيت اليد الحرة على بنش؛ وضعية الصدر المسنودة تجعل الغش شبه مستحيل." },
        { q: "هل يبني الكيك باك الترايسبس كاملًا؟", a: "يدرّب الرؤوس الثلاثة عند المرفق، لكن الرأس الطويل هو النجم لأن وضع الذراع خلف الجذع يبقيه محملًا عند مد الذراع. اقرنه بحركة فوق الرأس لوضع المد، وحركة بنش بقبضة ضيقة للحمل الثقيل، فتكون العضلة ثلاثية الرؤوس قد غطت جوانبها كلها." },
      ],
    },
    links: [
      { hrefEn: "/blog/12-week-dumbbell-band-muscle-plan", hrefAr: "/ar/blog/home-muscle-building-guide-simple-weights", labelEn: "12-week dumbbell & band muscle plan", labelAr: "دليل بناء العضلات في المنزل بأوزان بسيطة" },
      { hrefEn: "/exercises/triceps-pushdown", hrefAr: "/ar/exercises/triceps-pushdown", labelEn: "Triceps pushdown — the cable alternative", labelAr: "دفع الترايسبس بالكابل — البديل بالجهاز" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log this in the free workout tracker", labelAr: "سجّل تمرينك في متتبع التمارين المجاني" },
    ],
  },

  "crunches": {
    intro: {
      en: "The crunch is the most recognizable abs exercise on earth and the gateway to direct core training: no equipment, no setup, no excuses. That status makes sense, because the crunch is the purest form of what the abs actually do: flex the spine. Your exercise page keeps the movement honest — shoulders rise about four inches off the floor, the lower back never leaves it, and the hands stay light at the sides of the head with fingers deliberately unclasped. Done this way the rectus abdominis does the curling and momentum does nothing. The crunch is not a fat-burner and does not pretend to be; it is a builder of the muscle that sits under whatever the kitchen takes care of.",
      ar: "الكرانش هو أشهر تمرين بطن على الإطلاق وبوابة التدريب المباشر للجذع: لا معدات ولا إعدادًا ولا أعذار. وهذه المكانة منطقية، لأن الكرانش هو أنقى صورة لوظيفة عضلات البطن الحقيقية: ثني العمود الفقري. صفحة التمرين تحفظ للحركة أمانتها: الكتفان يرتفعان نحو أربع بوصات فقط عن الأرض، وأسفل الظهر لا يفارقها أبدًا، واليدان تبقيان خفيفتين على جانبي الرأس بأصابع غير متشابكة عمدًا. بهذه الطريقة تنجز العضلة المستقيمة البطنية الحركة كاملة ولا يفعل الزخم شيئًا. الكرانش ليس حارقًا للدهون ولا يدّعي ذلك؛ إنه بانٍ للعضلة التي تجلس تحت ما تتكفل به التغذية.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis — the six-pack sheet running from ribs to pelvis — is the prime mover and the library lists it with no helpers, which keeps the story clean: as the shoulders peel off the floor, the abs shorten and pull the ribcage toward the pelvis, flexing the spine one vertebra at a time. The obliques on each side work as stabilizers to stop the torso twisting, and the hip flexors are deliberately benched — that is the whole difference between a crunch and a sit-up. Press the small of your back into the floor before every rep and you will feel exactly which muscle is supposed to be burning.",
        mistakes: [
          { error: "Yanking the head forward with clasped fingers until the neck does the lifting.", fix: "Fingertips rest at the temples and the chin stays a fist-width from the chest — if the neck aches, cross the arms over the chest instead." },
          { error: "Sitting all the way up, which hands the work to the hip flexors.", fix: "Stop when the shoulder blades clear the floor; the four-inch ceiling in the instructions is the range, not a suggestion." },
          { error: "Bouncing reps off the floor at double speed.", fix: "One second up with the exhale, a full second squeeze at the top, two seconds down — the abs respond to time under tension, not to tempo tricks." },
          { error: "Feet anchored so heavily the hips do the curling.", fix: "If your feet must be pinned to move at all, the load is wrong; keep the feet light on the floor or on a bench as the instructions allow, never hooked under furniture." },
        ],
        alternatives: "The floor crunch is the entry point of a family, not a monopoly. The exercise-ball version pre-stretches the abs over the ball's curve and gives a longer range for the same effort. Lying leg raises flip the job to the lower fibers, the cable crunch adds load without needing a partner, and the plank trains the abs the way they work all day — bracing against extension rather than curling. If your neck complains no matter what, the dead bug delivers the same bracing lesson with zero neck involvement.",
        progression: "Start where the page starts: feet on the floor, arms at the sides, and a tempo you could hold a conversation over. When 20 clean reps become routine, extend the arms past the head to lengthen the lever, pause two seconds at the top of every rep, or move the feet onto a bench as the instructions permit. From there the family tree forks — weighted crunches with a plate on the chest, cable crunches for measurable load, and eventually hanging leg raises where the abs curl the whole lower body. The progression rule is simple: earn the next variation with strict reps, not with calendar weeks.",
        programming: "Abs recover faster than any other muscle group, which is why the standard prescription is 3-4 sets of 15-25 controlled reps, 2-4 times a week, at the end of a session — never before, because a fatigued core undermines every big lift that follows. Pair the crunch with an anti-extension move (plank or dead bug) in the same block so the muscle trains both jobs. On a cutting phase, keep the reps and add sets rather than adding endless minutes; visible abs come from the calorie deficit tracked in our tools, and the crunch's job is only to make the muscle underneath worth revealing.",
        safety: "The spine is the watch-point. If the lower back arches off the floor on the way down, the range is too big for your current control — shorten it until the lumbar stays glued down, exactly as the instructions demand. Acute neck pain means the hands are pulling; switch to arms crossed on the chest. The crunch suits almost everyone, but anyone managing an active disc issue should tolerate spinal flexion only as advised by their clinician — the dead bug is the usual standing substitute.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية — صفحة الست بطون الممتدة من الأضلاع إلى الحوض — هي المحرك الأساسي، والمكتبة تسجلها بلا عضلات مساعدة، وهذا ما يجعل الصورة نظيفة: فبينما تنطلق الكتفان من الأرض تقصر العضلة وتشد القفص الصدري نحو الحوض مثنيةً العمود الفقري فقرةً بعد فقرة. العضلتان المائلتان على الجانبين تعملان كمثبّتين تمنعان دوران الجذع، أما عضلات ثني الورك فأُخرجت من التشكيل عمدًا، وهذا بالضبط الفرق بين الكرانش والجلوس الكامل. اضغط أسفل ظهرك في الأرض قبل كل تكرار وستشعر بدقة أي عضلة يفترض أن تحترق.",
        mistakes: [
          { error: "شد الرأس للأمام بأصابع متشابكة حتى تتولى الرقبة الرفع.", fix: "أطراف الأصابع تستريح عند الصدغين والذقن يبقى بمسافة قبضة عن الصدر؛ إذا تألمت الرقبة فواضع الذراعين المتقاطعتين على الصدر بديل فوري." },
          { error: "الجلوس الكامل نحو الأرض فتنتقل الحركة إلى عضلات ثني الورك.", fix: "توقف لحظة ارتفاع لوحي الكتف عن الأرض؛ سقف الأربع بوصات في التعليمات هو نطاق الحركة نفسه لا اقتراحًا قابلًا للتجاوز." },
          { error: "تكرارات مرتدة عن الأرض بسرعة مضاعفة.", fix: "ثانية واحدة صعودًا مع الزفير، وعصر كامل لثانية في الأعلى، وثانيتان نزولًا؛ عضلات البطن تستجيب لمدة الشد لا لخدع السرعة." },
          { error: "تثبيت القدمين بقوة تجعل الوركين هما من يلتف.", fix: "إذا احتجت وتدًا ثقيلًا لتتحرك أصلًا فالحمل خاطئ؛ أبقِ القدمين خفيفتين على الأرض أو على بنش كما تجيز التعليمات، ولا تدسهما أبدًا تحت أثاث." },
        ],
        alternatives: "الكرانش الأرضي هو بوابة عائلة كاملة لا احتكار لها. نسخة كرة التمارين تمدّ عضلات البطن فوق منحنى الكرة فتمنح مدى أطول بنفس الجهد. رفع الساقين مستلقيًا يقلب المهمة نحو الألياف السفلية، والكرانش بالكيبل يضيف حملًا قابلًا للقياس دون شريك، بينما يدرّب البلانك البطن بالطريقة التي يعمل بها طوال اليوم: صدامًا ضد الاستطالة لا التفافًا. وإذا اشتكت رقبتك مهما عدّلت، فإن تمرين الحشرة الميتة يقدم نفس الدرس بلا أي حمل على الرقبة.",
        progression: "ابدأ من حيث تبدأ الصفحة: القدمان على الأرض والذراعان على الجانبين وإيقاع هادئ تستطيع أن تحادث شخصًا أثناءه. وحين تصبح 20 تكرارًا نظيفة أمرًا روتينيًا، مدّ الذراعين خلف الرأس لإطالة الرافعة، أو أضف توقفًا لثانيتين في قمة كل تكرار، أو انقل القدمين إلى بنش كما تسمح التعليمات. من هناك تتفرع شجرة العائلة: كرانش موزون بقرص على الصدر، ثم كرانش بالكيبل بحمل يُقاس، وصولًا إلى رفع الساقين معلقًا حيث تلف البطن الجسم السفلي كاملًا. قاعدة التدرج بسيطة: اكسب التنويع التالي بتكرارات نظيفة لا بمرور الأسابيع.",
        programming: "عضلات البطن تتعافى أسرع من أي مجموعة أخرى، ولذلك الوصفة المعتادة هي 3-4 مجموعات من 15-25 تكرارًا منضبطًا، مرتين إلى أربع أسبوعيًا، في نهاية الجلسة لا بدايتها؛ فالجذع المتعب يقوّض كل رفعة كبيرة تليه. اقرن الكرانش بحركة مقاومة استطالة مثل البلانك أو الحشرة الميتة في نفس الكتلة لتتدرب العضلة على وظيفتيها معًا. وفي مرحلة التنشيف حافظ على التكرارات وزد المجموعات بدلًا من إضافة دقائق لا تنتهي؛ فالبطن الظاهر يأتي من العجز الحراري الذي تتتبعه أدواتنا، ووظيفة الكرانش أن يجعل العضلة تحته جديرة بالظهور فقط.",
        safety: "العمود الفقري هو نقطة المراقبة. إذا ابتعد أسفل الظهر عن الأرض أثناء النزول فالمدى أكبر من سيطرتك الحالية؛ قصّره حتى يظل القطني ملتصقًا بالأرض تمامًا كما تشترط التعليمات. ألم الرقبة الحاد يعني أن اليدين تشدان؛ حوّل الذراعين إلى وضع التقاطع على الصدر. يناسب الكرانش الجميع تقريبًا، لكن من يتابع مشكلة غضروفية نشطة عليه ألا يقبل ثني العمود الفقري إلا بمشورة طبيبه، والحشرة الميتة هي البديل المعتاد.",
      },
    },
    faq: {
      en: [
        { q: "How many crunches should I do a day for visible abs?", a: "None — visibility is a body-fat question, not a rep-count question. Crunches build the muscle; the kitchen and your calorie deficit decide whether it shows. Our body-fat and calorie tools settle that side of the equation in two minutes." },
        { q: "Why do my neck and not my abs hurt during crunches?", a: "Almost always the hands: pulling the head forward loads the neck exactly the way the instructions warn against. Rest fingertips at the temples, keep the chin off the chest, or cross the arms over the chest — the burn moves to the abs within a set or two." },
        { q: "Crunches or sit-ups — which is better?", a: "They are different jobs. The crunch isolates the abs by stopping the shoulders at four inches; the sit-up continues past that point and hands the extra range to the hip flexors. For training the abs specifically, the crunch wins; for sport-specific hip-flexor work, the sit-up has a case." },
      ],
      ar: [
        { q: "كم كرانشًا أؤدي يوميًا لظهور عضلات البطن؟", a: "صفرًا؛ فالظهور سؤال نسبة دهون لا سؤال عدد تكرارات. الكرانش يبني العضلة، والمطبخ والعجز الحراري يقرران ظهورها. أدوات حاسبة الدهون والسعرات لدينا تحسم هذا الجانب في دقيقتين." },
        { q: "لماذا تتألم رقبتي ولا يتألم بطني أثناء الكرانش؟", a: "السبب في الغالب اليدان: شد الرأس للأمام يحمل الرقبة تمامًا كما تحذر التعليمات. ضع أطراف أصابعك عند الصدغين وأبعد الذقن عن الصدر أو اضرب الذراعين على صدرك، وسينتقل الاحتراق إلى البطن خلال مجموعة أو اثنتين." },
        { q: "أيهما أفضل: الكرانش أم الجلوس الكامل؟", a: "لكل منهما وظيفة مختلفة. الكرانش يعزل البطن بتوقف الكتفين عند أربع بوصات، أما الجلوس فيتجاوز تلك النقطة ويسلّم المدى الزائد لعضلات ثني الورك. لتدريب البطن تحديدًا يفوز الكرانش، وللأغراض الرياضية التي تحتاج عضلات الورك للجول الكامل مكان للجلوس." },
      ],
    },
    links: [
      { hrefEn: "/blog/lose-belly-fat-without-losing-muscle-cardio-plan", hrefAr: "/ar/blog/belly-fat-loss-8-weeks-guide", labelEn: "Lose belly fat without losing muscle", labelAr: "دليل خسارة دهون البطن في 8 أسابيع" },
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص عضلات البطن المنزلي" },
      { hrefEn: "/tools/body-fat-calculator", hrefAr: "/ar/tools/body-fat-calculator", labelEn: "Measure your starting point — body-fat calculator", labelAr: "قِس نقطة انطلاقك — حاسبة نسبة الدهون" },
    ],
  },

  "leg-lift": {
    intro: {
      en: "The standing leg lift is one of the quietest movements in the library and one of the most practical: it answers the question every desk-bound trainee eventually asks — how do I wake up my glutes with zero equipment? The movement is deliberately small: you brace one hand on a rack or chair, keep the working leg straight, and lift it behind you as the instructions describe, one controlled rep at a time. No weight, no burnout, no fanfare — just the hip-extensor pattern that desk life switches off, re-taught to the exact muscles that forgot it. It is the kind of movement that looks like nothing and fixes a very specific something.",
      ar: "رفع الساق واقفًا من أهدأ حركات المكتبة وأكثرها عملية: فهو يجيب عن السؤال الذي يصل إليه حتمًا كل من يقضي يومه جالسًا — كيف أوقظ عضلات الأرداف بلا أي معدات؟ الحركة صغيرة عمدًا: تسند إحدى يديك على رف أو كرسي، وتبقي الساق العاملة مستقيمة، وترفعها خلفك كما تصف التعليمات، تكرارًا منضبطًا واحدًا في المرة. لا أوزان ولا إنهاك ولا ضجيج؛ فقط نمط مد الورك الذي يطفئه الجلوس المكتب يُعاد تعليمه للعضلات ذاتها التي نسيته. إنه النوع من الحركات الذي يبدو بلا شيء لكنه يعالج شيئًا محددًا جدًا.",
    },
    sections: {
      en: {
        muscles: "This is a glute exercise first — the library marks the glutes as primary with the hamstrings assisting, and the mechanics agree: lifting a straight leg behind the body is hip extension, and the gluteus maximus is the hip's extensor-in-chief. Because the knee stays locked, the hamstrings run the movement isometrically as they hold the leg straight, while the standing-side glute works overtime just keeping you upright — the stance leg gets an invisible workout every set. Ankle weights, which the instructions mention as optional, sharpen the burn without changing which muscle does the job.",
        mistakes: [
          { error: "Arching the lower back to lift the leg higher.", fix: "The leg rises only as far as the glute can take it with a neutral spine — past that point the range belongs to the lower back, not the hip." },
          { error: "Bending the working knee and turning the lift into a standing leg curl.", fix: "Keep the leg straight as the instructions state; the hamstring is a stabilizer here, not the prime mover." },
          { error: "Leaning the whole torso forward as the leg goes back.", fix: "Brace firmly on the rack or chair, keep the chest tall, and let the leg move while the trunk stays quiet — the counterbalance hand is there to make this possible." },
          { error: "Rushing 30 sloppy reps to feel the burn.", fix: "One second up, a beat of squeeze at the top, two seconds down; fifteen honest reps beat thirty fast ones for a muscle that responds to tension, not speed." },
        ],
        alternatives: "The same glute pattern comes in heavier costumes. The glute kickback on all fours trains the identical hip-extension groove from the floor; the glute bridge and hip thrust load it with a barbell once bodyweight stops being enough; and the one-legged cable kickback adds resistance through the exact arc this page teaches. If standing balance is the problem rather than the point, do the floor versions first and return here — the single-leg stance is one of the movement's hidden benefits, not a bug.",
        progression: "Beginners earn their first progression simply by touching the wall instead of a rack and holding each top position for a full second — balance arrives before strength. Add light ankle weights in one-kilo steps once 15 controlled reps per leg feel automatic, exactly as the instructions anticipate. From there the ladder forks: tempo work with a three-second lower, or a graduate to the barbell glute bridge where the same muscles meet real load. Advanced lifters rarely need more than this move as a warm-up activator — two light sets before squats or deadlifts switch the glutes on for the heavy work ahead.",
        programming: "Treat it as activation or accessory work, never as the main lift: 2-3 sets of 12-15 reps per leg, resting 30-45 seconds, either in the warm-up before lower-body training or at the tail end of a glute-focused session. On rehabilitation-style programs the dose can double, since the load is trivial and the movement's job is re-education, not fatigue. If glute development is the block's priority, follow it immediately with a loaded movement — bridge, thrust or kickback on cables — so the activated muscle meets resistance while it is switched on.",
        safety: "The lower back is the structure the mistakes all gang up on: arch for height and the lumbar spine absorbs the rep. Stop the range at the first hint of arch and the exercise stays honest. Anyone with an acute hamstring strain should wait for the all-clear before swinging a straight leg behind them; the movement is gentle, but it does load the hamstring at length.",
      },
      ar: {
        muscles: "هذا تمرين أرداف أولًا؛ المكتبة تصنف الألوية كعضلة أساسية مع أوتار الفخذ مساعدة، والميكانيكا توافقها: فرفع ساق مستقيمة خلف الجسم هو مدٌ للورك، والعضلة الألوية الكبرى هي مسؤولته الأولى. ولأن الركبة تبقى مقفلة، تعمل أوتار الفخذ انقباضيًا ثابتة وهي تحفظ الساق مستقيمة، بينما تتضاعف مهمة أرداف ساق الوقوف في إبقائك منتصبًا؛ فالساق الثابتة تحصل على تمرين غير مرئي في كل مجموعة. أثقال الكاحل التي تذكرها التعليمات كخيار تزيد الاحتراق دون أن تغير العضلة العاملة.",
        mistakes: [
          { error: "تقويس أسفل الظهر لرفع الساق أعلى.", fix: "ترتفع الساق فقط إلى الحد الذي تحمله الألوية مع عمود فقري محايد؛ ما بعد تلك النقطة يصبح المدى ملكًا للظهر لا للورك." },
          { error: "ثني ركبة الساق العاملة فيتحول الرفع إلى تجعيد ساق واقفًا.", fix: "أبقِ الساق مستقيمة كما تنص التعليمات؛ أوتار الفخذ مثبّت هنا لا محرك أساسي." },
          { error: "ميل الجذع كله للأمام مع رجوع الساق للخلف.", fix: "استند بثبات على الرف أو الكرسي، وأبقِ صدرك مرفوعًا، ودع الساق تتحرك بينما يبقى الجذع ساكنًا؛ يد التوازن موجودة لتحقيق هذا بالضبط." },
          { error: "الاندفاع في 30 تكرارًا مهملًا طلبًا للاحتراق.", fix: "ثانية صعودًا، وعصرة لحظة في الأعلى، وثانيتان نزولًا؛ خمسة عشر تكرارًا صادقًا تغلب ثلاثين سريعة في عضلة تستجيب للشد لا للسرعة." },
        ],
        alternatives: "النمط الألوية نفسه يتوفر بأزياء أثقل. رفرفة الألوية على أربع يدرّب مسار مد الورك ذاته من الأرض، وجسر الألوية ودفع الورك يحملانه ببار حقيقي حين يكف وزن الجسم عن الكفاية، ورفرفة الكابل بساق واحدة تضيف مقاومة عبر القوس نفسه الذي تعلمه هذه الصفحة. إذا كانت مشكلة التوازن عائقًا لا هدفًا فابدأ بالنسخ الأرضية ثم عد هنا؛ فالوقوف على ساق واحدة من فوائد الحركة الخفية لا عيبًا فيها.",
        progression: "المبتدئ يكسب أول تدرج بمجرد لمس الحائط بدلًا من الرف مع تثبيت كل وضع علوي لثانية كاملة؛ فالتوازن يصل قبل القوة. أضف أثقال كاحل خفيفة بخطوات كيلو واحد حين تصبح 15 تكرارًا منضبطة لكل ساق أمرًا تلقائيًا، تمامًا كما تتنبأ التعليمات. من هناك تتفرع السلم: عمل إيقاع بنزول ثلاث ثوان، أو الانتقال إلى جسر الألوية بالبار حيث تلتقي العضلات نفسها بحمل حقيقي. أما المتقدمون فنادرًا ما يحتاجون أكثر من هذه الحركة كمشعل تنشيط: مجموعتان خفيفتان قبل السكوات أو الديدلفت يشعلان الألويات للعمل الثقيل القادم.",
        programming: "تعامل معه كتنشيط أو تمرين مساعد لا كرفعة أساسية: 2-3 مجموعات من 12-15 تكرارًا لكل ساق، براحة 30-45 ثانية، إما في الإحماء قبل جلسة الأجزاء السفلية أو في ذيل جلسة تركز على الأرداف. وفي البرامج ذات الطابع التأهيلي يمكن مضاعفة الجرعة لأن الحمل تافه ومهمة الحركة إعادة تعليم لا إهاك. وإذا كان تطوير الألويات أولوية المرحلة، فأتبق الحركة فورًا بحركة محملة — جسر أو دفع ورك أو رفرفة كابل — لتلتقي العضلة المنشّطة بالمقاومة وهي ما تزال مشتعلة.",
        safety: "أسفل الظهر هو البنية التي تتآمر الأخطاء كلها ضدها: تقوّس طلبًا للارتفاع فيبتلع القطني التكرار. أوقف المدى عند أول إحساس بالتقوّس يظل التمرين أمينًا. ومن يعاني شدًا حادًا في أوتار الفخذ فلينتظر الإذن قبل أن يرج ساقًا مستقيمة خلفه؛ فالحركة لطيفة لكنها تحمل الأوتار وهي ممدودة.",
      },
    },
    faq: {
      en: [
        { q: "Can I do the standing leg lift without holding anything?", a: "You can, and free-standing sets are a legitimate progression — the hand on the rack exists to keep the trunk still, not to make the exercise easy. But the moment your torso starts swaying to lift the leg, the balance demand is stealing the reps from your glutes. Hold on, and let the hip do the work." },
        { q: "Why does my lower back ache after these?", a: "Almost always range theft: the leg went higher than the glute could honestly take, and the lumbar spine arched to donate the difference. Cut the height, keep the spine neutral, and the ache disappears within a few sessions." },
        { q: "Are ankle weights worth adding?", a: "Yes, once 15 controlled reps per leg feel easy — the instructions list them as the natural next step. Keep the increments small; this movement rewards precision, and a heavy ankle weight quickly reintroduces the swinging you just eliminated." },
      ],
      ar: [
        { q: "هل أستطيع أداء رفع الساق دون الإمساك بشيء؟", a: "تستطيع، والمجموعات الحرة تدرج مشروع؛ فاليد على الرف موجودة لإبقاء الجذع ساكنًا لا لتسهيل التمرين. لكن ما إن يتأرجح جذعك لرفع الساق حتى يسرق مطلب التوازن التكرارات من أردافك. استند ودع الورك يعمل." },
        { q: "لماذا يؤلمني أسفل الظهر بعد هذه التمرين؟", a: "غالبًا سرقة مدى: رتف الساق أعلى مما تحتمله الألوية بصدق فتقوّس القطني معوضًا الفرق. قلّل الارتفاع وحافظ على عمود محايد ويختفي الألم خلال جلسات قليلة." },
        { q: "هل يستحق إضافة أثقال الكاحل؟", a: "نعم حين تصبح 15 تكرارًا منضبطة لكل ساق سهلة؛ التعليمات تذكرها كخطوة تالية طبيعية. أبقِ الزيادات صغيرة؛ فالحركة تكافئ الدقة، وثقل الكاحل سرعان ما يعيد التأرجح الذي أزلته للتو." },
      ],
    },
    links: [
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-building-guide-no-equipment", labelEn: "Build muscle at home with no equipment", labelAr: "بناء العضلات في المنزل بلا معدات" },
      { hrefEn: "/exercises/barbell-glute-bridge", hrefAr: "/ar/exercises/barbell-glute-bridge", labelEn: "Barbell glute bridge — the loaded next step", labelAr: "جسر الألوية بالبار — الخطوة المحملة التالية" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track every set — free workout tracker", labelAr: "تتبع كل مجموعة — متتبع التمارين المجاني" },
    ],
  },

  "kettlebell-pistol-squat": {
    intro: {
      en: "The pistol squat is the hardest bodyweight leg movement to earn — a milestone lift that takes months of deliberate progressions before the first clean rep lands on each side. It deserves exactly that patience. This is a one-legged squat to full depth with the other leg held off the floor in front of you, and the kettlebell — gripped by the horns and held out front as the instructions describe — works as a counterweight that lets your torso stay upright enough to complete the rep. Nothing else in the gym tests ankle mobility, hip range, single-leg strength and balance in one shot. Most lifters should treat it as a destination, not a starting point, and the progressions below exist precisely because of that.",
      ar: "السكوات رجل واحدة بالكيتل بيل أصعب حركات الأرجل بوزن الجسم اكتسابًا — رافعة معلم تستغرق شهورًا من التدرجات المدروسة قبل أن يهبط أول تكرار نظيف على كل جانب. وهو يستحق هذا الصبر كله. إنها قرفصاء على ساق واحدة حتى العمق الكامل مع تثبيت الساق الأخرى مرفوعة أمامك، والكيتل بيل — ممسكًا من المقبضين ومحفوظًا أمام الجسم كما تصف التعليمات — يعمل كثقل موازن يسمح لجذعك بالبقاء منتصبًا بما يكفي لإتمام التكرار. لا شيء آخر في الصالة يختبر مرونة الكاحل ومدى الورك وقوة الساق الواحدة والتوازن في طلقة واحدة. وعلى معظم المتدربين اعتباره وجهة لا نقطة انطلاق، والتدرجات أدناه موجودة لهذا السبب بالذات.",
    },
    sections: {
      en: {
        muscles: "The library's own label calls the quads primary with calves, glutes, hamstrings and even the shoulders as seconds — an unusually long list that tells the truth about this movement. The front leg's quads drive the descent and ascent through a range no barbell squat reaches; the glutes and hamstrings control the hips on the way down; the calves stabilize the ankle through the deepest knee bend in the library; and the shoulders work isometrically to hold the bell out front. The lifted leg is not resting either — its hip flexors keep it from touching the floor for the entire set.",
        mistakes: [
          { error: "Collapsing the ankle and letting the heel lift off the floor at depth.", fix: "The rep starts at the ankle: if the heel rises, the joint lacks the range today — elevate it slightly on a small plate or book and work the mobility separately." },
          { error: "Letting the free leg drift down and tap the floor between reps.", fix: "Hold the non-working leg locked out in front for the whole set as the instructions describe; every floor tap is a rep the hip flexors stole." },
          { error: "Dropping into the hole and bouncing out of the bottom.", fix: "The instructions prescribe a one-second hold in the bottom position — use it. Pistol strength is built on the way down, and the pause is what keeps the rep honest." },
          { error: "Rushing to bodyweight pistols before owning the progressions.", fix: "Earn the movement through the ladder in the progression notes; skipping rungs does not speed the journey, it just installs compensations that take months to uninstall." },
        ],
        alternatives: "The same single-leg pattern scales infinitely. A box pistol — squatting to a bench and back up — keeps the depth honest while cutting the balance demand. The split squat and lunge family trains one leg at a time with both feet available for rescue, and the front squat builds the upright-torso strength the pistol demands. If the counterweight is the issue, a plate held at the chest is a gentler starting point than a kettlebell; if balance is the issue, a hand on a rack or TRX strap is a legitimate training wheels phase, not a cheat.",
        progression: "The ladder has rungs and none of them are optional. First own the deep bodyweight squat — heels down, chest up, full depth. Then come box pistols to a bench, then box pistols to a lower target, then assisted pistols with one hand on a rack, then plate-loaded pistols with the counterweight at the chest, and finally the kettlebell version this page teaches. Each rung is earned with three clean sets of five per leg, not with optimism. Advanced trainees graduate to a heavier bell or a slower three-second descent — the movement never runs out of ways to humble anyone.",
        programming: "This is skill work first and strength work second: 3-5 sets of 3-5 reps per leg, with full rest — two to three minutes — because balance and coordination collapse under fatigue before the muscles do. Slot it early in the session, right after the warm-up, while the nervous system is fresh; chasing pistols after heavy squats is programming theater. Once a week is enough for most lifters, twice at most during a dedicated single-leg block, always paired with the mobility work the movement exposes as missing.",
        safety: "Knees and load-placement are the two honest risks. The knee travels far over the toes at depth by design — that is healthy for a prepared joint and aggravating for an unprepared one, so knee history decides the timeline. The bell is held out front where a dropped weight lands on nothing precious; keep the grip dry and chalked, and set the bell down the moment the hold starts failing rather than mid-rep.",
      },
      ar: {
        muscles: "تصنيف المكتبة نفسه يضع الفخذ الأمامي أساسيًا مع السمانة والألويات وأوتار الفخذ وحتى الأكتاف مساعدة؛ قائمة طويلة غير معتادة تقول الحقيقة كاملة عن هذه الحركة. فأرباعية الساق العاملة تقود الهبوط والصعود عبر مدى لا يبلغه أي سكوات بالبار، والألويات وأوتار الفخذ تضبطان الوركين في النزول، والسمانة تثبت الكاحل عند أعمق انثناء للركبة في المكتبة كلها، بينما تعمل الأكتاف ثباتيًا على رفع الجرس أمام الجسم. والساق المرفوعة ليست في عطلة أيضًا؛ فمثنيات الورك لديها تمنعها من ملامسة الأرض طوال المجموعة.",
        mistakes: [
          { error: "انهيار الكاحل وارتفاع الكعب عن الأرض في العمق.", fix: "التكرار يبدأ من الكاحل: إن ارتفع الكعب فالمفصل يفتقر إلى المدى اليوم — ارفعه قليلًا على قرص صغير أو كتاب واعمل على المرونة بشكل منفصل." },
          { error: "نزول الساق الحرة ولمس الأرض بين التكرارات.", fix: "ثبّت الساق غير العاملة ممدودة أمامك طوال المجموعة كما تصف التعليمات؛ كل لمسة أرض تكرار سرقته مثنيات الورك." },
          { error: "التقدم إلى مسدسات وزن الجسم قبل امتلاك درجات السلم.", fix: "اكسب الحركة عبر السلم في ملاحظات التدرج؛ فتخطي الدرجات لا يسرّع الرحلة بل يزرع تعويضات يستغرق اقتلاعها شهورًا." },
          { error: "إسقاط الجرس من القبضة عند أول تعب في الذراعين.", fix: "أنزل الجرس بوعي لحظة بدء القبضة بالضعف لا في منتصف التكرار، فالسقوط الحر أمام الجسم خطأ يتكرر بلا ضرورة." },
        ],
        alternatives: "النمط أحادي الساق نفسه يتدرج بلا حدود. السكوات رجل واحدة على صندوق — قرفصاء إلى بنش ثم صعود — يحفظ عمقًا أمينًا مع خفض مطلب التوازن. عائلة الطعن والانقسام تدرّب ساقًا واحدة مع توفر القدمين للإنقاذ، والسكوات الأمامي يبني قوة الجذع المنتصب التي يطلبها المسدس. إذا كانت المشكلة الثقل الموازن فالقرص المحمول عند الصدر بداية ألطف من الكيتل بيل، وإذا كانت المشكلة التوازن فاليد على رف أو حزام تعليق مرحلة عجلات تدريب مشروعة لا غش.",
        progression: "للسلم درجات ولا واحدة منها اختيارية. أولًا أتقن السكوات العميق بوزن الجسم: كعبان على الأرض وصدر مرفوع وعمق كامل. ثم مسدسات الصندوق إلى بنش، ثم إلى هدف أخفض، ثم مسدسات بمساعدة يد على رف، ثم مسدسات بقرص موازن عند الصدر، وأخيرًا نسخة الكيتل بيل التي تعلمها هذه الصفحة. كل درجة تُكسب بثلاث مجموعات نظيفة من خمس تكرارات لكل ساق لا بالتفاؤل. والمتقدمون يتخرجون إلى جرس أثقل أو نزول أبطأ بثلاث ثوان؛ فالحركة لا تنفد من طرق التواضيع.",
        programming: "هذا عمل مهاري أولًا وقوي ثانيًا: 3-5 مجموعات من 3-5 تكرارات لكل ساق، براحة كاملة — دقيقتان إلى ثلاث — لأن التوازن والتناسق ينهاران تحت التعب قبل العضلات. ضعه مبكرًا في الجلسة بعد الإحماء مباشرة والجهاز العصبي في كامل نشاطه؛ فمطاردة المسدسات بعد سكوات ثقيل مسرحية تدريبية لا أكثر. مرة أسبوعيًا تكفي لمعظم المتدربين، ومرتين كحد أقصى في مرحلة أحادية الساق المخصصة، مع عمل المرونة الذي تكشفه الحركة ناقصًا دائمًا.",
        safety: "الركبتان وموضع الحمل هما المخاطرتان الصادقتان. فالركبة تتقدم كثيرًا فوق أصابع القدم في العمق بالتصميم؛ هذا صحي لمفصل مهيأ ومهيج لمفصل غير مهيأ، وتاريخ ركبتك يحدد الجدول الزمني. أما الجرس فيُحمل أمام الجسم حيث لا يسقط الثقل على شيء ثمين؛ أبقِ القبضة جافة ومغطاة بالمغناطيس، وأنزل الجرس لحظة بدء القبضة بالانهيار لا في منتصف التكرار.",
      },
    },
    faq: {
      en: [
        { q: "Why does the kettlebell make pistol squats easier, not harder?", a: "Because it is a counterweight, not just load: holding mass in front of your chest shifts your balance point backward, which lets the torso stay more upright at depth. That is why the instructions have you holding it by the horns out front — though past a certain point the arms tire of the hold before the legs tire of the squat, and the bell that helped becomes the bell that stops you." },
        { q: "How long does it take to get a first pistol squat?", a: "Honest answer: months, not weeks, for most adults — the movement bottlenecks on ankle and hip mobility that years of sitting took away, and those tissues remodel slowly. Run the ladder in the progression notes twice a week and most trainees land their first clean rep somewhere between three and twelve months." },
        { q: "My heel lifts at the bottom — should I stretch more?", a: "Probably, but not only: limited ankle dorsiflexion is usually the culprit, and it responds to both stretching and loaded mobility work — deep squat holds with the heels down are the cheapest fix. In the short term, a small heel elevation lets you train the strength pattern honestly while the mobility catches up." },
      ],
      ar: [
        { q: "لماذا يسهّل الكيتل بيل السكوات رجل واحدة بدلًا من تصعيده؟", a: "لأنه ثقل موازن لا مجرد حمل: فحمل كتلة أمام صدرك يحرك نقطة توازنك للخلف، وهذا يسمح للجذع بالبقاء أكثر انتصابًا في العمق. لهذا تجعلك التعليمات ممسكًا به من المقبضين ممدودًا أمامك؛ فجرس أخف محمولًا بطريقة صحيحة كثيرًا ما يفتح تكرارات يستحيلها جرس أثقل." },
        { q: "كم يستغرق إتقان أول سكوات رجل واحدة؟", a: "الإجابة الصادقة: أشهر لا أسابيع لمعظم البالغين؛ فالحركة تنحصر عند مرونة الكاحل والورك اللتين سرقهما سنوات من الجلوس، وهذه الأنسجة تتشكل ببطء. نفّذ سلم التدرج مرتين أسبوعيًا وسيحقق أغلب المتدربين أول تكرار نظيف بين ثلاثة أشهر واثني عشر." },
        { q: "كعبي يرتفع في القاع — هل أزيد التمطي؟", a: "غالبًا، لكن ليس وحده: محدودية ثني الكاحل هي المتهم المعتاد، وهي تستجيب للتمطي ولمسؤول الحمل معًا، ووقفات القرفصاء العميقة بكعبين ملتصقين أرخص علاج. وكملاذ قصير المدى يتيح رفع الكعب قليلًا تدريب النمط القوي بأمانة حتى تلحق المرونة." },
      ],
    },
    links: [
      { hrefEn: "/blog/progressive-overload-no-weight", hrefAr: "/ar/blog/progressive-overload-without-weights-guide", labelEn: "Progressive overload without weights", labelAr: "التدرج بالحمل بدون أوزان" },
      { hrefEn: "/exercises/barbell-squat", hrefAr: "/ar/exercises/barbell-squat", labelEn: "Barbell squat — build the base first", labelAr: "السكوات بالبار — ابنِ الأساس أولًا" },
      { hrefEn: "/blog/budget-home-gym-equipment-comparison", hrefAr: "/ar/blog/choose-weightlifting-shoes-men", labelEn: "Budget home gym equipment compared", labelAr: "دليل اختيار أحذية رفع الأثقال" },
    ],
  },

  "exercise-ball-crunch": {
    intro: {
      en: "The exercise-ball crunch takes the internet's most-searched abs move and gives it a longer runway. On the floor, your spine stops flexing the moment your back flattens; draped over a ball as the instructions describe — lower back pressed into the curve, feet planted, upper torso hanging off the top — the abs start every rep from a pre-stretched position no floor allows, then curl through a visibly larger range. That is the entire sales pitch: same muscle, more distance, harder rep. For a home-training audience with a ball sitting in the corner, it answers a very practical question: what is that thing actually for?",
      ar: "الكرانش على كرة التمارين يأخذ أشهر حركة بطن على الإنترنت ويمنحها مدرجًا أطول. على الأرض يتوقف ثني عمودك الفقري لحظة استواء ظهرك؛ أما منثنيًا فوق الكرة كما تصف التعليمات — أسفل الظهر مضغوطًا في المنحنى والقدمان ثابتتان والجذع العلوي متدلٍ من القمة — فتبدأ عضلات البطن كل تكرار من وضع ممد مسبقًا لا تسمح به أي أرضية، ثم تلتف عبر مدى أكبر واضحًا للعين. هذه هي الحجّة كلها: نفس العضلة، مسافة أطول، تكرار أصعب. ولجمهور يتدرب في المنزل وتقف كرة في إحدى زواياه، تجيب عن سؤال عملي جدًا: لماذا هذه الكرة موجودة أصلًا؟",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis leads, and the ball changes its job description: because the spine starts extended over the ball's curve, the muscle begins each rep lengthened and must flex the spine through that pre-stretch before the familiar crunching happens — more total work per rep for the same joint. The obliques assist as anti-rotation brakes, working harder than they do on the floor because the ball is a moving surface that punishes any twist. Note what the library lists as absent: hip flexors. The feet stay planted and the hips stay still, which is precisely what keeps this a pure spinal-flexion movement.",
        mistakes: [
          { error: "Planting the feet too close together and rolling off the ball mid-set.", fix: "Widen the stance to at least hip width — the instructions demand feet pressed firmly into the floor, and a wide base is what makes that pressure honest." },
          { error: "Bouncing the torso off the ball's stretch position like a springboard.", fix: "Lower into the stretch for two full seconds, let the abs take over from the momentum, then curl up — the ball's elasticity is a hazard, not a feature." },
          { error: "Craning the neck upward with every rep.", fix: "The instructions insist the neck stays stationary — pick a ceiling spot, lock the gaze, and let the ribcage, not the chin, lead the curl." },
          { error: "Letting the hips rise and fall so the ball becomes a seesaw.", fix: "Flex the waist with the hips locked, exactly as the movement description orders; if the hips travel, the set has drifted into a ball hip-extension hybrid." },
        ],
        alternatives: "The floor crunch is the calmer sibling — less range, less balance demand, identical lesson. The cable crunch adds load for lifters past the bodyweight ceiling, and the hanging leg raise flips the same abs-shortening job to the lower fibers. If the ball itself is the problem — unavailable, or intimidating at first — the same pre-stretch effect comes from a small rolled towel placed under the lower back on a flat bench, a trick borrowed from the decline bench family in this library.",
        progression: "Ball size quietly sets the difficulty: the instructions describe draping the lower back over the top, and a bigger ball pushes the stretch further. Arms set the next dial — alongside the body is the easiest position, as the instructions note, crossed on the chest is harder, and hands at the temples harder still. When 20 slow reps stop registering, add a two-second squeeze at the top, then a plate held at the chest, and only then consider the weighted family. The regression path is equally clear: feet wider, ball smaller, range shorter — there is no fitness level this movement cannot meet somewhere.",
        programming: "The standard dose is 3-4 sets of 12-20 slow reps, 2-3 times a week at the end of a session, with 45-60 seconds of rest — the pre-stretch makes each rep worth more than a floor crunch, so the totals stay modest. Because the ball trains balance as a side effect, avoid slotting it before heavy squats or deadlifts on the same day; a tired trunk undermines the barbell work. In a core-specialization block it pairs beautifully with the plank for the anti-extension half of the abs' job description.",
        safety: "The ball is an unstable surface, and that is the whole risk profile: the first set of anyone's first session tends to involve a roll-away. Anchor the feet wide, keep the area around the ball clear, and sit onto the ball before lying back rather than diving. Anyone with acute lower-back disc symptoms should treat the stretched starting position with respect and clear spinal extension over a ball with a clinician first — the movement is designed to load the abs at length, and length under load is exactly what a healing disc does not want.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تتقدم المشهد، والكرة تغيّر وصف وظيفتها: فبسبب بدء العمود الفقري ممدودًا فوق منحنى الكرة، تنطلق العضلة في كل تكرار من وضع ممدود وعليها أن تثني العمود عبر هذا التمطي المسبق قبل أن يبدأ الالتفاف المألوف؛ عمل إجمالي أكبر في كل تكرار لنفس المفصل. العضلتان المائلتان تساعدان كفرامل ضد الدوران، وتعملان هنا أشد من الأرض لأن الكرة سطح متحرك يعاقب أي التفافة. ولاحظ ما تسجله المكتبة غائبًا: مثنيات الورك. فالقدمان ثابتتان والوركان ساكنان، وهذا بالضبط ما يُبقي الحركة ثنيًا خالصًا للعمود الفقري.",
        mistakes: [
          { error: "تثبيت القدمين متقاربتين جدًا فتتدحرج عن الكرة في منتصف المجموعة.", fix: "وسّع القاعدة إلى عرض الوركين على الأقل؛ فالتعليمات تشترط قدمين مضغوطتين بقوة في الأرض، والقاعدة الواسعة هي ما يجعل هذه الضغطة صادقة." },
          { error: "ارتداد الجذع من وضع المد فوق الكرة كأنها لوح قفز.", fix: "انزل إلى وضع التمدد في ثانيتين كاملتين ودع البطن تتسلم من الزخم ثم التفّ صعودًا؛ فمرونة الكرة خطر لا ميزة." },
          { error: "مدّ الرقبة للأعلى مع كل تكرار.", fix: "التعليمات تصر على ثبات الرقبة؛ اختر نقطة في السقف وثبّت النظر ودع القفص الصدري لا الذقن يقود الالتفاف." },
          { error: "صعود الوركين وهبوطهما حتى تصبح الكرة أرجوحة.", fix: "اثنِ الخصر والوركان مقفولان تمامًا كما يأمر وصف الحركة؛ إذا تحرك الوركان فقد انزلقت المجموعة إلى خليط غير مقصود." },
        ],
        alternatives: "الكرانش الأرضي هو الأخ الأهدأ: مدى أقل ومطلب توازن أقل ودرس واحد. الكرانش بالكيبل يضيف حملًا لمن تجاوز سقف وزن الجسم، ورفع الساقين معلقًا يقلب مهمة تقصير البطن ذاتها نحو الألياف السفلية. وإذا كانت الكرة نفسها هي العائق — غير متاحة أو مرهبة في البداية — فيأتي نفس أثر التمطي المسبق من منشفة ملفوفة صغيرة تحت أسفل الظهر على بنش مسطح، وهي حيلة مستعارة من عائلة البنش المائل في هذه المكتبة.",
        progression: "حجم الكرة يضبط الصعوبة بصمت: التعليمات تصف ثني أسفل الظهر فوق القمة، والكرة الأكبر تدفع التمدد أبعد. الذراعان هما القرص التالي: على جانبي الجسم أسهل وضع كما تلاحظ التعليمات، ثم متقاطعتان على الصدر أصعب، ثم اليدان عند الصدغين أصعبها جميعًا. وحين تتوقف 20 تكرارًا بطيئة عن إحداث أثر، أضف عصرة ثانيتين في الأعلى، ثم قرصًا على الصدر، وعندها فقط فكر في العائلة الموزونة. ومسار التراجع واضح بنفس القدر: قدمان أوسع، كرة أصغر، مدى أقصر؛ لا يوجد مستوى لياقة لا تلتقيه هذه الحركة في نقطة ما.",
        programming: "الجرعة المعتادة 3-4 مجموعات من 12-20 تكرارًا بطيئًا، مرتين إلى ثلاث أسبوعيًا في نهاية الجلسة، براحة 45-60 ثانية؛ فالتمطي المسبق يجعل كل تكرار يساوي أكثر من كرانش أرضي ولهذا تبقى الأعداد معتدلة. ولأن الكرة تدرّب التوازن كأثر جانبي، تجنب وضعها قبل السكوات أو الديدلفت الثقيل في اليوم نفسه؛ فالجذع المتعب يقوّض عمل البار. وفي مرحلة تخصص البطن تقترن بأناقة مع البلانك الذي يغطي النصف المضاد للاستطالة من وصف وظيفة البطن.",
        safety: "الكرة سطح غير مستقر وهذا ملخص ملف المخاطر كله: المجموعة الأولى في أول جلسة لأي شخص تنتهي غالبًا بتدحرج الكرة. ثبّت القدمين بعرض واسع، وأبقِ المنطقة حول الكرة خالية، واجلس عليها قبل الاستلقاء بدلًا من الانقضاض. ومن لديه أعراض غضروف حادة في أسفل الظهر فليتعامل باحترام مع وضع البداية الممدود، وليستأذن طبيبه قبل مدّ العمود الفقري فوق كرة؛ فالحركة مصممة لتحميل البطن وهي ممدودة، والطول تحت الحمل هو آخر ما يريحه غضروف في طور الشفاء.",
      },
    },
    faq: {
      en: [
        { q: "What size exercise ball do I need for crunches?", a: "A ball that lets your lower back drape over the top with your feet flat and knees near 90 degrees — for most adults that is a 65 cm ball, with taller lifters happier on 75 cm. The instructions' real test is simpler: if the stretch feels like a stretch and your feet stay planted without drama, the size is right." },
        { q: "Are ball crunches better than floor crunches?", a: "Different, and honestly better at one specific thing: range. The ball lets the spine start extended, so each rep travels farther and the abs work through a longer stretch — our exercise page is built on exactly that geometry. The floor crunch wins on convenience and stability; both build the same muscle." },
        { q: "My lower back clicks over the ball — is that dangerous?", a: "Clicks without pain over a stretch position are usually just the spine moving through range it never visits on the floor. Keep the motion slow and controlled, and stop at the depth where you still own the movement. Pain — sharp, localized, or lingering — is the signal that ends the set and, if it persists, starts a conversation with a clinician." },
      ],
      ar: [
        { q: "ما حجم الكرة المناسب للكرانش؟", a: "كرة تسمح لأسفل ظهرك بالانثناء فوق قمتها وقدميك مسطحتان وركبتاك قرب 90 درجة؛ لمعظم البالغين تعني 65 سم، ويطمئن الأطول قليلًا إلى 75. والاختبار الحقيقي في التعليمات أبسط: إذا كان التمدد يشبه التمدد وبقيت قدماك مثبتتين بلا دراما فالحجم صحيح." },
        { q: "هل كرانش الكرة أفضل من الكرانش الأرضي؟", a: "مختلفة، وأفضل بصدق في شيء واحد محدد: المدى. فالكرة تسمح للعمود بالبدء ممدودًا فيقطع كل تكرار مسافة أطول وتعمل البطن عبر تمدد أشمل، وعلى هذا الهندسة نفسها بُنيت صفحة التمرين. والكرانش الأرضي يفوز بالسهولة والثبات، وكلتاهما تبنيان العضلة ذاتها." },
        { q: "أسفل ظهري يُصدر طقطقة فوق الكرة — هل هذا خطير؟", a: "الطقطقة بلا ألم في وضع تمدد هي غالبًا العمود الفقري يتحرك عبر مدى لا يزوره أبدًا على الأرض. أبقِ الحركة بطيئة متحكمًا فيها، وتوقف عند العمق الذي ما تزال تملك الحركة عنده. أما الألم — حادًا أو موضعيًا أو متاخمًا — فهو الإشارة التي تختم المجموعة، وإن استمر بدأت محادثة مع طبيب." },
      ],
    },
    links: [
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/muscle-building-home-workout-guide", labelEn: "Home training with minimal equipment", labelAr: "دليل التمرين المنزلي بلا معدات" },
      { hrefEn: "/exercises/crunches", hrefAr: "/ar/exercises/crunches", labelEn: "Floor crunches — the base movement", labelAr: "الكرانش الأرضي — الحركة الأساس" },
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص البطن المنزلي" },
    ],
  },
};
