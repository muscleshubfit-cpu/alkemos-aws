/**
 * EXERCISES-ENRICHMENT — BATCH 7 (exercises 32-36 of 50).
 *
 * The legs/glutes family's middle five: barbell lunge, leg press, barbell
 * hip thrust, standing calf raises and barbell glute bridge — the lunge
 * pattern, the machine flagship and the two glute-loading heads that own
 * the largest Arabic keyword families in the site's keyword map.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_7: Record<string, ExerciseEnrichment> = {
  "barbell-lunge": {
    intro: {
      en: "The barbell lunge is the single-leg pattern wearing a barbell: a rack-position setup identical to the squat's, then a long forward step and a controlled drop through the hips, as the instructions choreograph, before driving back to standing through the front heel. The library grades it intermediate because the movement asks two things at once — strength through one leg's full range, and balance across a base that narrows to a tightrope. It rewards the ask: quads, glutes and hamstrings share the work with the library's secondary list, and the walking variants build the hip stability that both sport and stairs charge rent for. Step length is the program's secret dial, and this page's instructions set the default: long enough to keep the front shin near vertical, torso upright.",
      ar: "الطعن بالبار هو النمط أحادي الساق يرتدي بارًا: إعداد رف مطابق لإعداد السكوات، ثم خطوة أمامية طويلة وهبوط متحكم عبر الوركين كما تصمم التعليمات الحركة، قبل الدفع عودةً إلى الوقوف عبر كعب القدم الأمامية. تصنفه المكتبة للمتوسطين لأن الحركة تطلب أمرين معًا — قوة عبر كامل مدى ساق واحدة، وتوازن فوق قاعدة تضيق إلى حبل مشدود. وتسدد الطلب: يتقاسم الفخذ الأمامي والألويات وأوتار الفخذ العمل مع قائمة المكتبة المساعدة، وتبني التنويعات المتحركة ثبات الورك الذي يفرض عليه كل من الرياضة والسلالم إيجارًا. طول الخطوة هو القرص السري للبرنامج، وتضع تعليمات هذه الصفحة الافتراضي: طويلة بما يبقي عظم الساق الأمامي شبه عمودي والجذع منتصبًا.",
    },
    sections: {
      en: {
        muscles: "The front leg carries the descent: the library bills the quads primary, and the front thigh absorbs the drop as the shin holds near-vertical; the glutes and hamstrings of the same leg drive the hip back to standing, with the calves steadying the ankle through the whole step. The rear leg works too — its hip flexors hold the extension, its calf reaches, its quad controls the trailing knee's descent. The trunk's muscles brace the bar overhead of the hips. This is the squat's muscle list split across one working leg at a time, which is exactly why lunges expose and repair the side-to-side gaps squats hide.",
        mistakes: [
          { error: "Front knee crashing far past the toes at the bottom.", fix: "The instructions warn against the knee traveling beyond the toes — take a longer step so the shin stays near vertical and the knee stacks over the ankle, and the shear leaves the joint." },
          { error: "Short choppy steps that turn the lunge into a knee grinder.", fix: "The step should be long enough that both knees reach roughly ninety degrees at the bottom, as the classic pattern intends; a short step loads the front knee and asks it for a favor." },
          { error: "Torso collapsing forward over the front leg.", fix: "Upright is the default the instructions demand — the bar rides over the hips, not the front knee; the collapse usually announces a step too short or a load too heavy." },
          { error: "Pushing off the back toe instead of the front heel.", fix: "The drive home comes through the front heel as the instructions specify — the rear leg is a kickstand, not a second engine, and toe-pushing steals the rep from the front glute." },
        ],
        alternatives: "Walking lunges trade the return step for continuous travel and more balance demand; reverse lunges step backward and are kinder to cranky front knees — the direction change cuts the knee's shear. Split squats plant both feet and remove the stepping skill; dumbbell lunges drop the bar for friendlier balance. At home, the same pattern loads with a backpack. The library's squat pages remain the two-legged spine of leg training; the lunge family is where each leg answers for itself.",
        progression: "Start with bodyweight lunges to learn the step length — a line on the floor helps — then dumbbells at the sides, then the barbell version this page teaches. Load climbs slowly: the balance system adapts slower than the muscles, and a lunge that wobbles at 20 kilos builds less than one that marches at 10. The progressions after that are pattern ones — walking lunges, deficit lunges with the front foot on a small plate, and pause lunges with a two-second hold at the bottom, each earning its slot before the bar grows again.",
        programming: "Book it after the main squat or hinge of a lower day: 2-4 sets of 6-10 reps per leg with 90-120 seconds of rest, once or twice a week. As a secondary lift it takes whatever the main lift left and spends it one leg at a time; as the main lift of a hypertrophy block it runs higher reps — 10-15 per leg with lighter loads. Our home programs slot walking lunges as the finisher of leg day exactly this way.",
        safety: "The front knee and the balance system share the caution file: knee history usually prefers reverse or walking lunges to the forward version this page teaches, because forward stepping loads the knee at its most sheared angle. Start lighter than squat instincts suggest — the barbell lunge's balance tax means 30-40 percent of a back squat load is already a working weight. And clear the lane: a lunge is a walk with a barbell, and the gym floor's traffic is the only obstacle this exercise cannot out-train.",
      },
      ar: {
        muscles: "الساق الأمامية تحمل الهبوط: تسجل المكتبة الفخذ الأمامي أساسيًا، ويمتص الفخذ الأمامي الهبطة مع بقاء عظم الساق شبه عمودي؛ وتدفع ألويات الساق نفسها وأوتارها الورك عودةً إلى الوقوف، وتثبت السمانة الكاحل طوال الخطوة. والساق الخلفية تعمل أيضًا — مثنيات وركها تحفظ الامتداد، وسمانتها تمدّ، وفخذها الأمامي يضبط هبطة الركبة المتأخرة. وعضلات الجذع تشدّ البار فوق الوركين. هذه قائمة عضلات السكوات موزعة على ساق عاملة واحدة في المرة، ولهذا بالضبط تكشف الطعنات فجوات الجهتين التي يخفيها السكوات وتصلحها.",
        mistakes: [
          { error: "اصطدام الركبة الأمامية بعيدًا خلف أصابع القدم في القاع.", fix: "تحذر التعليمات من سفر الركبة خلف أصابع القدم — خذ خطوة أطول فيبقى عظم الساق شبه عمودي وترتص الركبة فوق الكاحل، فيغادر القص المفصل." },
          { error: "خطوات قصيرة مقطوعة تحول الطعنة إلى ماكينة طحن ركبة.", fix: "ينبغي أن تكون الخطوة طويلة بما يبلغ بكلتا الركبتين نحو تسعين درجة في القاع كما يقصد النمط الكلاسيكي؛ فالخطوة القصيرة تحمل الركبة الأمامية وتطلب منها معروفًا." },
          { error: "انهيار الجذع أمامًا فوق الساق الأمامية.", fix: "الانتصاب هو الافتراضي الذي تطلبه التعليمات — يركب البار فوق الوركين لا الركبة الأمامية؛ والانهيار يعلن عادة خطوة أقصر من اللازم أو حملًا أثقل منه." },
          { error: "الدفع من طرف أصابع القدم الخلفية بدل كعب الأمامية.", fix: "يأتي الدفع للبيت عبر كعب القدم الأمامية كما تحدد التعليمات — فالساق الخلفية حامل دراجة لا محركًا ثانيًا، ودفع الأصابع يسرق التكرار من الألوية الأمامية." },
        ],
        alternatives: "الطعنات المتحركة تقايض خطوة العودة بسفر متصل ومطلب توازن أكبر، والطعنات الخلفية تخطو للخلف وألطف على الركبات المتعبة — تغيير الاتجاه يخفض قصّ الركبة. والسكوات المتقسمة تزرع القدمين وتزيل مهارة الخطو، وطعنات الدمبل تسقط البار مقابل توازن ألطف. ومنزليًا يحمل النمط نفسه بحقيبة ظهر. وتبقى صفحات السكوات في المكتبة العمود الفقري ذو الساقين لتدريب الأرجل؛ وعائلة الطعن هي حيث تجيب كل ساق عن نفسها.",
        progression: "ابدأ بطعنات وزن الجسم لتعلم طول الخطوة — خط على الأرض يساعد — ثم دمبلان على الجانبين، ثم نسخة البار التي تعلمها هذه الصفحة. يصعد الحمل ببطء: فنظام التوازن يتأقلم أبطأ من العضلات، والطعنة التي تتأرجح عند 20 كيلوجرامًا تبني أقل من واحدة تزحف عند 10. والتدرجات بعدها نمطية — طعنات متحركة، وطعنات عجز بالقدم الأمامية على قرص صغير، وطعنات توقف بثانيتين في القاع، وكل درجة تكسب خانتها قبل أن يكبر البار مجددًا.",
        programming: "احجزه بعد السكوات أو المفصلة الرئيسية ليوم سفلي: 2-4 مجموعات من 6-10 تكرارات لكل ساق براحة 90-120 ثانية، مرة أو مرتين أسبوعيًا. وكرفعة ثانوية يأخذ ما تركته الرئيسية وينفقه ساقًا بعد ساق؛ وكرافعة أساسية لكتلة تضخيم يشغل تكرارات أعلى — 10-15 لكل ساق بأحمال أخف. وبرامجنا المنزلية تضع الطعنات المتحركة ختامًا ليوم الأرجل هكذا بالضبط.",
        safety: "الركبة الأمامية ونظام التوازن يتقاسمان ملف الحذر: تاريخ الركبة يفضل عادة الطعنات الخلفية أو المتحركة على النسخة الأمامية التي تعلمها هذه الصفحة، لأن الخطو أمامًا يحمل الركبة عند أكثر زواياها قصًّا. وابدأ أخف مما توحي به غرائز السكوات — فضريبة توازن طعنة البار تعني أن 30-40 بالمئة من حمل سكوات الظهر وزن عمل فعلًا. وأخلِ الممر: فالطعنة مشي ببار، وحركة أرض الصالة هي العقبة الوحيدة التي لا يستطيع هذا التمرين التغلب عليها بالتدريب.",
      },
    },
    faq: {
      en: [
        { q: "Forward, reverse or walking lunges — which one?", a: "This page teaches the forward version, the classic pattern. Reverse lunges suit cranky knees (less shear on the joint), walking lunges add rhythm and glute demand. All three train the same muscles through the same ninety-degree geometry — the choice is a joint-preference and equipment decision, not a results verdict, and programs rotate them freely." },
        { q: "Why do my lunges wobble so much?", a: "The lunge is a balance exercise that happens to build legs — the wobble IS the training. Narrow your stance to hip width for the setup, slow the descent, and hold a doorway lightly at first if needed; the shake disappears within a few weeks of practice as the hip stabilizers learn their lines." },
        { q: "How heavy should the barbell be for lunges?", a: "Start around a third of your back squat load and treat that as a real working weight — the single-leg balance tax takes the rest. A lunge you own at 30 kilos builds more than one you survive at 60; the bar grows when the wobble dies, not before." },
      ],
      ar: [
        { q: "أمامية أم خلفية أم متحركة — أي الطعنات؟", a: "تعلم هذه الصفحة النسخة الأمامية، النمط الكلاسيكي. والخلفية تناسب الركبات المتعبة (قصّ أقل على المفصل)، والمتحركة تضيف إيقاعًا ومطلب ألويات. الثلاثة تدرّب العضلات نفسها عبر هندسة التسعين درجة نفسها — فالاختيار قرار مفصل ومعدات لا حكم نتائج، والبرامج تدور عليها بحرية." },
        { q: "لماذا تتأرجح طعناتي كل هذا الارتجاف؟", a: "الطعنة تمرين توازن يحدث أنه يبني الأرجل — فالارتجاف هو التدريب نفسه. ضيّق الوقفة إلى عرض الوركين في الإعداد، وأبطئ الهبوط، وأمسك عتبة باب بخفة أول الأمر إن لزم؛ يختفي الارتعاش خلال أسابيع قليلة من الممارسة مع تعلم مثبتات الورك خطوطها." },
        { q: "كم وزن البار المناسب للطعنات؟", a: "ابدأ حول ثلث حمل سكوات ظهرك وعامله كوزن عمل حقيقي — فضريبة توازن الساق الواحدة تأخذ الباقي. والطعنة تملكها عند 30 كيلوجرامًا تبني أكثر من تنجو منها عند 60؛ ويكبر البار حين تموت الرجفة لا قبلها." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-squat", hrefAr: "/ar/exercises/barbell-squat", labelEn: "Barbell squat — the two-legged foundation", labelAr: "السكوات بالبار — الأساس ذو الساقين" },
      { hrefEn: "/programs/home-fat-loss-hiit", hrefAr: "/ar/programs/home-fat-loss-hiit", labelEn: "Home fat-loss program — lunges included", labelAr: "برنامج حرق الدهون المنزلي — يشمل الطعنات" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log each leg separately — free tracker", labelAr: "سجل كل ساق على حدة — المتتبع المجاني" },
    ],
  },

  "leg-press": {
    intro: {
      en: "The leg press is the squat's seated parliament: the same quad-and-glute pressing pattern loaded through a sled on rails, with the balance handled by the machine and the effort spent entirely on the legs. The instructions carry the station's two laws — feet at shoulder width, never lock the knees at the top — and the safety-pin close that ends every set, pins re-engaged before the legs argue. It is the page beginners meet first on machine day and the one advanced lifters load for volume squats cannot survive; between those two seats sits the leg press's honest role: the leg builder with the safety rails installed.",
      ar: "ليج برس هو برلمان السكوات الجالس: نفس نمط دفع الفخذ والألويات محملًا عبر زحافة على قضبان، مع تولي الماكينة التوازن وإنفاق الجهد كله على الساقين. تحمل التعليمات قانوني المحطة — القدمان بعرض الكتفين ولا قفل للركبتين في القمة أبدًا — وقفل الأوتاد الذي يختم كل مجموعة، الأوتاد معادة الاشتباك قبل أن تجادل الساقان. إنها الصفحة التي يستقبلها المبتدئون أولًا في يوم الماكينات والتي يحملها المتقدمون بحجم لا ينجو منه السكوات؛ وبين المقعدين يجلس الدور الأمين للليج برس: باني الأرجل وقضبان أمانه مثبتة.",
    },
    sections: {
      en: {
        muscles: "The quads lead — the library's primary billing — pressing the platform away through the front of the thigh, while the glutes and hamstrings share the hip-extension half of every rep, and the calves stabilize the ankle bridge between foot and platform. Foot placement is the muscle dial this page's instructions hand you: higher feet recruit the hips' line more, lower feet load the quads harder, the medium stance splitting the difference. Because the back is supported and the path is fixed, the press lets those muscles work at loads the free-standing versions spend on balance — that trade is the machine's whole identity.",
        mistakes: [
          { error: "Snapping the knees straight at the top of every rep.", fix: "The instructions say it in bold — never lock the knees: stop just short of straight, keep the leg's tension, and the joint stays a passenger instead of a crash structure." },
          { error: "Lowering the sled until the lower back peels off the pad.", fix: "The bottom belongs to the legs, not the spine — stop the descent the moment the hips begin to curl, as the ninety-degree instruction implies, and the press stays a leg exercise." },
          { error: "Hands on the knees helping the press.", fix: "Hands hold the handles, always — the moment the arms join, the load has left the legs' job description, and the machine is only too happy to keep the secret." },
          { error: "Half-range pumping with the pins never approached.", fix: "The instructions define the working depth — upper and lower leg to ninety degrees — and reps above it train the movement's strongest third while pretending to train the leg." },
        ],
        alternatives: "The barbell squat — this library's flagship — trains the same muscles plus the trunk's bracing and the balance system; the hack squat and pendulum machines press from different angles with similar support. Walking lunges and split squats work one leg at a time; leg extensions and curls isolate the two halves the press combines. At home without a machine, the squat family and its progressions carry the pattern honestly.",
        progression: "The sled makes loading honest and progression linear: start with a load the legs press through the full ninety-degree depth for three sets of ten, and climb by the smallest plate pair the station owns while the depth holds. The technical progressions matter more than the plates — a three-second lower through the bottom third, a pause with the sled at the instructions' depth, one-and-a-half reps — each buys back the stimulus the machine's support subtracts. When the pins run out, the honest next step is the free squat, not a longer set.",
        programming: "Book it as the main lower lift for machine-focused sessions or as the volume press after free squats: 3-4 sets of 8-15 reps with 90-120 seconds of rest, once or twice a week. It earns the second slot on strength days — when the squat has spent the trunk's bracing, the press spends what is left purely on the legs — and the first slot on hypertrophy blocks for beginners whose balance is still in school. Our program templates place it both ways.",
        safety: "The machine's safety file is short and non-negotiable: the pins engage at the end of every set — the instructions close with that law — and the knees never lock under load. The lower back is the one structure the press can still endanger, through the depth mistake of letting the hips curl off the pad; depth stops where the back's contact does. And sleds do not forgive clothing or hands in the rails: the seat's rails are the machine's only true pinch points, and they are entirely avoidable.",
      },
      ar: {
        muscles: "يقود الفخذ الأمامي — الفاتورة الأساسية للمكتبة — دافعًا المنصة عبر مقدمة الفخذ، بينما تتقاسم الألويات وأوتار الفخذ نصف مدّ الورك من كل تكرار، وتثبت السمانة جسر الكاحل بين القدم والمنصة. وموضع القدم هو قرص العضلات الذي تناولك إياه تعليمات الصفحة: القدمان الأعلى تجندان خط الوركين أكثر، والأخفض يحمل الفخذ الأمامي أشد، والوقفة المتوسطة تقسم الفرق. ولأن الظهر مدعوم والمسار مثبت، تتيح الرفعة لتلك العضلات العمل بأحمال تنفقها النسخ الواقفة على التوازن — وتلك المقايضة هي هوية الماكينة كلها.",
        mistakes: [
          { error: "قصف الركبتين على الاستقامة في قمة كل تكرار.", fix: "تقولها التعليمات بوضوح — لا قفل للركبتين أبدًا: توقف قبيل الاستقامة واحفظ شدّ الساق، فيبقى المفصل راكبًا لا بنية اصطدام." },
          { error: "إنزال الزحافة حتى ينزع أسفل الظهر عن الوسادة.", fix: "القاع ملك الساقين لا العمود — أوقف الهبوط لحظة بدء التفاف الوركين كما يوحي قانون التسعين درجة، فتبقى الرفعة تمرين أرجل." },
          { error: "اليدان على الركبتين تساعدان الدفع.", fix: "اليدان على المقبضين دائمًا — فما إن تنضم الذراعان حتى يكون الحمل قد غادر وصف وظيفة الساقين، والماكينة سعيدة بالكتمان." },
          { error: "ضخ نصف مدى لا يقترب من الأوتاد أبدًا.", fix: "تحدد التعليمات عمق العمل — الساق العلوية والسفلية إلى تسعين درجة — والتكرارات فوقه تدرّب أقوى ثلث للحركة مدعية تدريب الساق." },
        ],
        alternatives: "السكوات بالبار — علم المكتبة — يدرّب العضلات نفسها زائد شد الجذع ونظام التوازن، وماكينتا الهاك والبندول تدفعان من زوايا مختلفة بدعم مشابه. والطعنات المتحركة والمتقسمة تعملان ساقًا واحدة، وتمديد الساق وثنيها يعزلان النصفين اللذين تجمعهما الرفعة. ومنزليًا بلا ماكينة تحمل عائلة السكوات وتدرجاتها النمط بأمانة.",
        progression: "تجعل الزحافة التحميل أمينًا والتدرج خطيًا: ابدأ بحمل تدفعه الساقان عبر عمق التسعين درجة الكامل لثلاث مجموعات من عشرة، واصعد بأصغر زوج أقراص تملكه المحطة مع بقاء العمق. والتدرجات الفنية أهم من الأقراص — نزول ثلاث ثوان عبر الثلث السفلي، وتوقف عند عمق التعليمات، وتكرار ونصف — وكل منها يستعيد التحفيز الذي يطرحه دعم الماكينة. وحين تنفد الأوتاد تكون الخطوة الأمينة التالية السكوات الحر لا مجموعة أطول.",
        programming: "احجزه كرفعة سفلية رئيسية لجلسات الماكينات أو كرفعة الحجم بعد السكوات الحر: 3-4 مجموعات من 8-15 تكرارًا براحة 90-120 ثانية، مرة أو مرتين أسبوعيًا. ويكسب الخانة الثانية في أيام القوة — فبعد أن ينفق السكوات شد الجذع تنفق الرفعة الباقي خالصًا على الساقين — والخانة الأولى في كتل التضخيم للمبتدئين الذين ما يزال توازنهم في المدرسة. وقوالب برامجنا تضعه بالطريقتين.",
        safety: "ملف أمان الماكينة قصير وغير قابل للتفاوض: تشتبك الأوتاد في نهاية كل مجموعة — تختم التعليمات بذلك القانون — ولا تقفل الركبتان تحت الحمل أبدًا. وأسفل الظهر هو البنية الوحيدة التي ما تزال تستطيع الرفعة تعريضها للخطر، عبر خطأ العمق بترك الوركين يلتفان عن الوسادة؛ يتوقف العمق حيث يتوقف تلامس الظهر. والزحافات لا تسامح الملابس أو الأيدي في القضبان: قضبان المقعد نقاط القرص الحقيقية الوحيدة للماكينة، ويمكن تجنبها كليًا.",
      },
    },
    faq: {
      en: [
        { q: "Is the leg press as good as squats?", a: "It is as good at one job and absent from another: the press loads the legs through a comparable range with the back supported, and for pure leg muscle stimulus it competes honestly. The squat adds the trunk's bracing, the balance system, and the total-body coordination the rails remove — which is why programs book both rather than crown one." },
        { q: "Where should my feet go on the platform?", a: "The instructions set the default — shoulder-width, medium placement, for overall development — and that is the position to learn first. Higher and wider feet shift work toward the glutes and hamstrings; lower and narrower loads the quads hardest. Placement is a programming dial, not a form law, and rotating it across blocks trains the whole leg evenly." },
        { q: "Why do my knees hurt on the leg press?", a: "Usually depth or foot placement: dropping the sled until the hips curl pushes the knees through their end range under load, and feet set too low hang the same angle on the joint. Film the bottom from the side once — the fix is usually visible: stop at ninety degrees with the back flat on the pad, and lift the feet one notch." },
      ],
      ar: [
        { q: "هل الليج برس بجودة السكوات؟", a: "هو بجودته في وظيفة وغائب عن أخرى: فالرفعة تحمل الساقين عبر مدى مشابه بظهر مدعوم، وفي تحفيز عضلات الأرجل الخالص ينافس بأمانة. أما السكوات فيضيف شد الجذع ونظام التوازن والتناسق الكلي الذي تزيله القضبان — ولهذا تحجز البرامج كليهما بدل تتويج واحد." },
        { q: "أين أضع قدميّ على المنصة؟", a: "تضع التعليمات الافتراضي — عرض الكتفين ووضع متوسط للتطور العام — وهو الموضع الذي يُتعلم أولًا. والقدمان الأعلى والأوسع تنقلان العمل نحو الألويات وأوتار الفخذ، والأخفض والضيق يحمل الفخذ الأمامي أقسى. الموضع قرص برمجة لا قانون وضعية، وتدويره عبر الكتل يدرّب الساق كاملة بتساوٍ." },
        { q: "لماذا تؤلمني ركبتاي على الليج برس؟", a: "غالبًا العمق أو موضع القدم: فإسقاط الزحافة حتى التفاف الوركين يدفع الركبتين عبر نهاية مداهما تحت الحمل، والقدمان المنخفضتان جدًا تعلقان نفس الزاوية على المفصل. صوّر القاع من الجانب مرة — الإصلاح مرئي عادة: توقف عند تسعين درجة والظهر مسطح على الوسادة، وارفع القدمين درجة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-squat", hrefAr: "/ar/exercises/barbell-squat", labelEn: "Barbell squat — the free version", labelAr: "السكوات بالبار — النسخة الحرة" },
      { hrefEn: "/programs/gym-beginner-fullbody", hrefAr: "/ar/programs/gym-beginner-fullbody", labelEn: "Gym beginner full-body program", labelAr: "برنامج الجسم الكامل للمبتدئين في الصالة" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "How often to train legs", labelAr: "كم مرة تدرب الأرجل أسبوعيًا" },
    ],
  },

  "barbell-hip-thrust": {
    intro: {
      en: "The barbell hip thrust is the movement that put glute training on the map this decade: shoulders on a bench, barbell padded across the hips, and a vertical drive through the feet until the hips stand at full extension — the instructions' whole arc, finished with the glutes squeezing the top like a handshake. It loads the glutes at their exact strongest line — hip extension with the knee bent — in a way no squat duplicates, which made it the anchor of every glute-focused block on this site.",
      ar: "دفع الورك بالبار هو الحركة التي وضعت تدريب الألويات على الخريطة هذا العقد: كتفان على بنش وبار مبطن عبر الوركين ودفع عمودي عبر القدمين حتى يقف الوركان عند الامتداد الكامل — قوس التعليمات كله، مختومًا بعصر الألويات للقمة كمصافحة. يحمل الألويات عند أقوى خط لهما بالضبط — مدّ الورك والركبة مثنية — بطريقة لا يكررها أي سكوات، وهو ما جعله مرساة كل كتلة مركزة على الألويات في هذا الموقع.",
    },
    sections: {
      en: {
        muscles: "The glutes own the movement — the library's primary billing, and for once the whole billing: hip extension with a bent knee hands the work to the gluteus maximus at its shortest, strongest line while the hamstrings — the usual co-drivers — are quieted by the knee's bend. The hamstrings still assist at the top, the calves steady the ground foot, and the abs brace the ribcage down so the hips do the traveling. That rib-down brace is what separates a hip thrust from a lower-back bridge: the hips extend, the spine stays neutral, and the glutes sign the rep.",
        mistakes: [
          { error: "Hyperextending the lower back at the top instead of finishing with the hips.", fix: "The finish is hips tall and ribs down — squeeze the glutes to full extension and stop; the arch past that point is the lumbar spine signing a check the glutes should cash." },
          { error: "Feet set so far forward the movement becomes a hamstring bridge.", fix: "Shin vertical at the top is the setup law — when the knees sit over the ankles at full extension, the glutes keep the driver's seat; farther feet hand it to the hamstrings." },
          { error: "Chin tucking and pushing the head back into the bench.", fix: "The neck stays neutral and the eyes forward — the instructions' shoulder-blade contact is the upper anchor, and the head is cargo, not a lever." },
          { error: "Rolling the bar up the thighs to set up and skimping the pad.", fix: "A barbell across the hip creases is the movement's entry toll — a thick pad or a folded mat pays it, and the setup roll becomes a non-event instead of a set of its own." },
        ],
        alternatives: "The glute bridge — this library's floor version — teaches the same hinge from the ground with less load; the one-leg thrust exposes and repairs side differences. Squats and deadlifts load hip extension through bigger ranges with more systemic cost. Cable and band thrusts from the floor keep constant tension when barbells travel. Every glute block on this site books at least two of these shapes: the thrust is the loaded specialty, the others the supporting cast.",
        progression: "Start with bodyweight bridges to learn the ribs-down finish, then the barbell version with a light load and the pad in place — the instructions' own staging. The load ladder climbs fast (the glutes take weight generously), and the honest progressions are positional: a two-second squeeze at the top, a pause an inch above the lap, single-leg sets when the bar stalls. The bench height law matters at every rung: shoulder blades on the top edge, as the instructions state, and no higher.",
        programming: "Program it as the main lift of a glute-focused day or the secondary hip movement after squats: 3-4 sets of 8-12 reps with 90-120 seconds of rest, once or twice a week. It earns the late-session slot too — the supported position means it works even when the trunk is spent. Our home programs run the band and bridge versions of the same arc; the barbell version here is the loaded head of that family.",
        safety: "The lower back is the one structure the form errors gang up on — the hyperextension finish is the classic mechanism, and the ribs-down cue is its entire prevention. The hip creases are the one place the bar bites: pad it properly, always, because a bar bruise there ends hip thrusting for a week out of pure discomfort. And set up with the bench against a rack or wall so it cannot slide — the bench is the movement's anchor, and an anchor that drifts is a set that ends badly.",
      },
      ar: {
        muscles: "الألويات تملك الحركة — الفاتورة الأساسية للمكتبة، وللمرة الأولى الفاتورة كلها: فمدّ الورك بركبة مثنية يسلم العمل للألوية الكبرى عند أقصر خطوطها وأقواها بينما تُسكَت أوتار الفخذ — الرفاق المعتادين — بانثناء الركبة. وما تزال الأوتار تساعد في القمة، والسمانة تثبت القدم الأرضية، والبطن يشدّ القفص الصدري لأسفل كي يسافر الوركان. ذلك الشدّ القصبي هو ما يفصل دفع الورك عن جسر أسفل الظهر: الوركان يمتدان والعمود يبقى محايدًا والألويات توقع التكرار.",
        mistakes: [
          { error: "فرط مدّ أسفل الظهر في القمة بدلًا من الإنهاء بالوركين.", fix: "الختام وركان عاليان وأضلاع منخفضة — اعصر الألويات حتى الامتداد الكامل وتوقف؛ فالقوس بعد تلك النقطة هو القطني يوقع شيكًا ينبغي أن تصرفه الألويات." },
          { error: "وضع القدمين بعيدًا للأمام حتى تصبح الحركة جسر أوتار.", fix: "عمودية عظم الساق في القمة هي قانون الإعداد — حين تجلس الركبتان فوق الكاحلين عند الامتداد الكامل تحتفظ الألويات بمقعد السائق؛ والقدمان الأبعد تسلمانه للأوتار." },
          { error: "تطويق الذقن ودفع الرأس للخلف في البنش.", fix: "تبقى الرقبة محايدة والعينان للأمام — تلامس لوحي الكتف في التعليمات هو المرساة العلوية، والرأس شحنة لا رافعة." },
          { error: "تدحرج البار على الفخذين عند الإعداد والتقتير في البطانة.", fix: "بار عبر ثنيات الورك هو رسوم دخول الحركة — بطانة سميكة أو حصيرة مطوية تدفعها، فيصبح تدحرج الإعداد حدثًا هامشيًا لا مجموعة قائمة بذاتها." },
        ],
        alternatives: "جسر الألويات — نسخة الأرض في مكتبتنا — يعلم المفصلة نفسها من الأرض بحمل أقل، والدفع بساق واحدة يكشف فروق الجهتين ويصلحها. والسكوات والديدلفت يحملان مدّ الورك عبر مدارات أكبر بكلفة جهازية أعلى. ودفع الكابل والمطاط من الأرض يحفظان شدًا دائمًا حين تسافر الأبار. كل كتلة ألويات في هذا الموقع تحجز شكلين من هذه على الأقل: الدفع هو التخصص المحمل، والبقية طاقم السند.",
        progression: "ابدأ بجسور وزن الجسم لتعلم ختام الأضلاع المنخفضة، ثم نسخة البار بحمل خفيف والبطانة مكانها — تصميم التعليمات نفسها. يصعد سلم الحمل سريعًا (الألويات كريمة مع الوزن)، والتدرجات الأمينة موضعية: عصرة ثانيتين في القمة، وتوقف على بوصة فوق الحضن، ومجموعات ساق واحدة عند تعثر البار. وقانون ارتفاع البنش يهم عند كل درجة: لوحا الكتف على الحافة العلوية كما تنص التعليمات، ولا أعلى.",
        programming: "برمجه كرفعة أساسية ليوم مركز على الألويات أو كحركة الورك الثانية بعد السكوات: 3-4 مجموعات من 8-12 تكرارًا براحة 90-120 ثانية، مرة أو مرتين أسبوعيًا. ويكسب خانة آخر الجلسة أيضًا — فالوضع المسنود يعني أنه يعمل حتى حين يكون الجذع منهكًا. وبرامجنا المنزلية تشغل نسختي المطاط والجسر للقوس نفسه؛ ونسخة البار هنا هي الرأس المحمل لتلك العائلة.",
        safety: "أسفل الظهر هو البنية الوحيدة التي تتآمر ضدها أخطاء الوضعية — والختام بفرط الامتداد هو الآلية الكلاسيكية، وإشارة الأضلاع للأسفل هي وقايته كلها. وثنيات الورك هي المكان الوحيد الذي يعض فيه البار: بطّنها جيدًا دائمًا، لأن كدمة بار هناك تنهي الدفع لأسبوع كامل من مجرد الانزعاج. وأعد الإعداد ببنش ضد رف أو حائط كي لا ينزلق — فالبنش مرساة الحركة، والمرساة التي تنجرف مجموعة تنتهي بسوء.",
      },
    },
    faq: {
      en: [
        { q: "Hip thrusts or squats for glutes?", a: "Both, and the reason is geometry: the thrust loads hip extension with the knee bent — the glutes' strongest, most isolated line — while the squat loads them through a longer range with the quads sharing. Programs that want maximal glute development book both; programs choosing one pick by goal (isolation and loadable squeeze vs. total-leg strength) rather than by rumor." },
        { q: "Why does my lower back take over at the top?", a: "The ribs are leading the finish instead of the hips — the classic thrust fault. Reset with bodyweight reps: ribs down, hips rise only as far as the glutes carry them, squeeze for a full second. If the arch still arrives under load, the weight is writing checks the glutes cannot yet cash; drop it ten kilos and rebuild the finish." },
        { q: "Do I need a barbell pad?", a: "Yes — the bar sits across the hip creases where bone, nerve and skin share thin real estate, and an unpadded bar at working weights is a bruise with a schedule. A thick pad, a folded yoga mat, a barbell specialty pad — any of them pay the toll; skipping it costs training days, not just comfort." },
      ],
      ar: [
        { q: "دفع الورك أم السكوات للألويات؟", a: "كلاهما، والسبب هندسي: فالدفع يحمل مدّ الورك بركبة مثنية — أقوى خط للألويات وأكثره عزلًا — بينما يحملها السكوات عبر مدى أطول مع مشاركة الفخذ الأمامي. البرامج الطامحة لأقصى تطوير ألويات تحجز كليهما؛ والبرامج التي تختار واحدًا تختار بالهدف (عزل وعصرة قابلة للتحميل مقابل قوة ساقين كاملة) لا بالإشاعة." },
        { q: "لماذا يتولى أسفل ظهري في القمة؟", a: "الأضلاع تقود الختام بدل الوركين — خطأ الدفع الكلاسيكي. أعد الضبط بتكرارات وزن الجسم: أضلاع لأسفل، ويرتفع الوركان فقط إلى حيث تحملهما الألويات، وعصر لثانية كاملة. وإذا وصل القوس رغم الحمل فالوزن يكتب شيكات لا تستطيع الألويات صرفها بعد؛ انزل عشرة كيلوجرامات وأعد بناء الختام." },
        { q: "هل أحتاج بطانة للبار؟", a: "نعم — فالبار يجلس عبر ثنيات الورك حيث تتقاسم العظم والعصب والجلد عقارًا رقيقًا، والبار غير المبطن عند أوزان العمل كدمة لها موعد. بطانة سميكة، أو حصيرة يوغا مطوية، أو بطانة بار مخصصة — أيها تدفع الرسوم؛ وتخطيها يكلف أيام تدريب لا الراحة فقط." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-glute-bridge", hrefAr: "/ar/exercises/barbell-glute-bridge", labelEn: "Glute bridge — the floor version", labelAr: "جسر الألويات — نسخة الأرض" },
      { hrefEn: "/exercises/leg-lift", hrefAr: "/ar/exercises/leg-lift", labelEn: "Standing leg lift — the activation move", labelAr: "رفع الساق واقفًا — حركة التنشيط" },
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home specialization program", labelAr: "برنامج التخصص المنزلي" },
    ],
  },

  "standing-calf-raises": {
    intro: {
      en: "Standing calf raises are the lower leg's one honest exercise: shoulders under the pads, balls of the feet on the block, heels hanging free — and then the highest heel rise the muscle can reach, held a beat, and a controlled lower into the stretch, exactly as the instructions draw the arc. The library bills the calves alone with no secondaries, and the muscle's stubborn reputation is the page's real context: calves respond to load, range and frequency with a patience that frustrates every other muscle's timetable. The instructions' knee law — a slight bend, never locked — quietly protects the joint while the ankle does the work, and the full stretch at the bottom is half the exercise most lifters skip.",
      ar: "رفع السمانة واقفًا هو التمرين الأمين الوحيد للساق السفلى: كتفان تحت الوسادتين وأكف القدمين على الكتلة والكعبان معلقان حرين — ثم أعلى ارتفاع كعب تبلغه العضلة، بتثبيت لحظة، وإنزال متحكم إلى التمدد، تمامًا كما ترسم التعليمات القوس. تسجل المكتبة السمانة وحدها بلا مساعدين، وسمعة العضلة العنيدة هي السياق الحقيقي للصفحة: فالسمانة تستجيب للحمل والمدى والتكرار بصبر يحبط جدول كل عضلة أخرى. وقانون الركبة في التعليمات — انثناء خفيف لا قفل أبدًا — يحمي المفصل بهدوء بينما يعمل الكاحل، والتمدد الكامل في القاع نصف التمرين الذي يتخطاه أغلب المتدربين.",
    },
    sections: {
      en: {
        muscles: "The calves' two-headed muscle does the lifting — the gastrocnemius, the visible diamond that crosses the knee joint and therefore works best with the knee near straight, and the soleus, the deeper workhorse beneath it that dominates whenever the knee is bent. Standing raises — this page's version — feed the gastrocnemius first, which is why the instructions' slight-but-never-locked knee bend matters: it protects the joint while keeping the diamond under load. The ankle's own architecture is the lever the whole exercise rides: the heel's drop off the block lengthens the muscle's working range beyond anything flat-floor training reaches.",
        mistakes: [
          { error: "Bouncing reps on the tendon like a pogo stick.", fix: "One second up to the highest point, a beat of squeeze at the top, two seconds down into the stretch — the tendon stores and returns bounce for free, and the muscle only grows on the work it is forced to do." },
          { error: "Half-inch reps in the middle of the range.", fix: "The block exists for the two ends: heels drop below the platform into the full stretch, then rise onto the toes' peak — the middle-of-range shuffle trains nothing the walk to the machine did not." },
          { error: "Locking the knees straight under the pads.", fix: "The instructions' slight bend, kept constant — locked knees turn the station into a passive bone stack and invite the knee joint into a job it never applied for." },
          { error: "Rolling the ankles outward or inward at the top.", fix: "Rise straight up over the big toe's line — the ankle rolls are the joint borrowing range the muscle should be earning, and the wobble board is a different exercise." },
        ],
        alternatives: "Seated calf raises — the bent-knee version — hand the work to the soleus, the deeper head, and the library's machine pages carry the pattern. Donkey raises lean the torso forward for a longer stretch line; single-leg raises on a step expose and repair side differences at bodyweight. The stair-climber and hill walking feed the same muscles as a bonus. For a muscle with essentially one job, the calf owns a surprisingly full wardrobe — variety here is a frequency strategy, not decoration.",
        progression: "The ladder starts with bodyweight on a step — full stretch, full rise, slow tempo — for three sets of fifteen per leg or twenty with both. Load climbs from there through the machine's pin, and the honest progressions are the ones most lifters skip: a two-second hold at the very top, a three-second lower into the very bottom, and pauses at the deepest stretch. Calves progress slowly by nature — the muscle tolerates heavy loads and high frequency together, which is the progression lever the page's programming notes pull.",
        programming: "Book it 2-4 times a week — the calf's stubbornness is a frequency problem before it is a load problem: 3-4 sets of 10-20 slow reps, 45-60 seconds of rest, at the end of any lower session. Pair one straight-knee day (standing raises — this page) with one bent-knee day (seated raises) across the week and both heads are trained. Our home programs schedule step-based raises exactly this way, alternating with the stretch work the stairs deliver free.",
        safety: "The ankle is the joint on duty, and its safety is tempo: the Achilles tendon handles enormous loads but hates sudden ones, so the controlled lower into the stretched position is the exercise's insurance policy. The knees' slight-bend law protects the joint from the pad's downward force. And the machine's edge is a genuine drop — set the shoulder pads before stepping the heels off the block, and dismount with the pins in your plan rather than your improvisation.",
      },
      ar: {
        muscles: "العضلة ذات الرأسين للسمانة تتولى الرفع — التوأمية، المعين المرئي الذي يعبر مفصل الركبة ولذلك يعمل أفضل مع ركبة شبه مستقيمة، والنعلية، حصان العمل الأعمق تحتها الذي يهيمن كلما انثنت الركبة. الرفع واقفًا — نسخة هذه الصفحة — يغذي التوأمية أولًا، ولهذا يهم قانون الركبة في التعليمات: انثناء خفيف دائمًا لا قفل؛ فيحمي المفصل مع إبقاء المعين تحت الحمل. وهندسة الكاحل نفسها هي الرافعة التي تركب عليها الحركة كلها: فهبوط الكعب عن الكتلة يطيل مدى عمل العضلة إلى أبعد مما يبلغه أي تدريب بأرض مسطحة.",
        mistakes: [
          { error: "تكرارات ناطية على الوتر كالزانة.", fix: "ثانية صعودًا إلى أعلى نقطة، ولحظة عصر في القمة، وثانيتان نزولًا إلى التمدد — فالوتر يخزن الارتداد ويعيده مجانًا، والعضلة لا تنمو إلا على العمل المفروض عليها." },
          { error: "تكرارات بنصف بوصة في وسط المدى.", fix: "الكتلة موجودة للطرفين: كعبان تهبطان أسفل المنصة إلى التمدد الكامل ثم ترتفعان إلى ذروة الأصابع — ورقصة وسط المدى لا تدرّب شيئًا لم تدرّبه المشية إلى الماكينة." },
          { error: "قفل الركبتين على الاستقامة تحت الوسادتين.", fix: "الانثناء الخفيف في التعليمات، ثابتًا — فالركبتان المقفلتان تحولان المحطة إلى رصة عظام سلبية وتدعوان المفصل إلى وظيفة لم يتقدم لها." },
          { error: "لفّ الكاحلين للخارج أو الداخل في القمة.", fix: "اصعد مستقيمًا فوق خط الإبهام — فلفات الكاحل مفصل يستعير مدى ينبغي للعضلة أن تكسبه، ولوح التوازن تمرين آخر." },
        ],
        alternatives: "رفع السمانة جالسًا — نسخة الركبة المثنية — يسلم العمل للنعلية، الرأس الأعمق، وتحمل صفحات الماكينات في المكتبة النمط. والرفع الحماري يميل الجذع أمامًا لخط تمدد أطول، والرفع بساق واحدة على درجة يكشف فروق الجهتين ويصلحها بوزن الجسم. وصاعد الدرج ومشي التلال يغذيان العضلات نفسها كهدية. ولمهمة واحدة في الأساس، تملك السمانة خزانة ملابس مفاجئ الامتلاء — فالتنويع هنا استراتيجية تكرار لا زينة.",
        progression: "يبدأ السلم بوزن الجسم على درجة — تمدد كامل وارتفاع كامل وإيقاع بطيء — لثلاث مجموعات من خمس عشرة لكل ساق أو عشرين بكلتيهما. يصعد الحمل من هناك بوتد الماكينة، والتدرجات الأمينة هي التي يتخطاها أغلب المتدربين: توقف ثانيتين في القمة العليا، ونزول ثلاث ثوان إلى القاع الأعمق، وتوقفات عند أعمق تمدد. تتقدم السمانة ببطء بطبعها — فهي تحتمل الأحمال الثقيلة والتكرار العالي معًا، وهذا هو ذراع التدرج التي تشدّها ملاحظات البرمجة في الصفحة.",
        programming: "احجزه مرتين إلى أربع أسبوعيًا — فعناد السمانة مشكلة تكرار قبل أن يكون مشكلة حمل: 3-4 مجموعات من 10-20 تكرارًا بطيئًا براحة 45-60 ثانية، في نهاية أي جلسة سفلية. اقرن يوم ركبة مستقيمة (الرفع واقفًا — هذه الصفحة) بيوم ركبة مثنية (الرفع جالسًا) عبر الأسبوع فتتدرب الرأسان معًا. وبرامجنا المنزلية تجدول رفعات الدرج هكذا بالضبط، بالتناوب مع عمل التمدد الذي تمنحه السلالم مجانًا.",
        safety: "الكاحل هو المفصل المناوب، وأمانه إيقاع: فوتر أخيل يتعامل مع أحمال هائلة لكنه يكره المفاجئ منها، فالنزول المتحكم إلى الوضع الممدود هو بوليصة التأمين للتمرين. وقانون الانثناء الخفيف للركبتين يحمي المفصل من قوة الوسادة الهابطة. وحافة الماكينة هبوط حقيقي — اضبط وسادتي الكتفين قبل خطو الكعبين عن الكتلة، وانزل بتشاور مع الأوتاد في خطتك لا بارتجالك.",
      },
    },
    faq: {
      en: [
        { q: "Why won't my calves grow?", a: "Three usual suspects, in order: range (half-reps skip the stretch where the growth stimulus lives), frequency (calves tolerate and likely need 3+ sessions a week — they are on their feet all day), and patience (the tendon-dominant muscle remodels on a slower clock than thighs). The page's tempo law plus standing/seated pairing addresses the first two; the third is calendar, not program." },
        { q: "Should I stretch my calves between sets?", a: "The exercise's own bottom position IS the loaded stretch — the heels' drop below the block — and that loaded stretch does more than relaxed stretching between sets. Add a few dedicated stretch minutes after the session for the tendon's long-term range; between sets, rest, and let the muscle spend its recovery on the next set's range." },
        { q: "Standing or seated calf raises — which first?", a: "Standing, as this page teaches — the straight knee loads the visible gastrocnemius, the head most lifters mean when they say calves. Seated work follows in the same session or on a second weekly day for the soleus. The order is a habit worth keeping: the bigger, straight-knee head first, the deeper bent-knee head after." },
      ],
      ar: [
        { q: "لماذا لا تنمو سمانتي؟", a: "ثلاثة متهمين معتادين بالترتيب: المدى (أنصاف التكرارات تتخطى التمدد حيث يسكن تحفيز النمو)، والتكرار (تتحمل السمانة وتحتاج غالبًا ثلاث جلسات فأكثر أسبوعيًا — فهي واقفة على قدميك طوال اليوم)، والصبر (فالعضلة الوترية الغالبة تعيد تشكيل نفسها بساعة أبطأ من الفخذين). قانون الإيقاع في الصفحة مع اقتران الوقوف والجلوس يعالج الأولين؛ والثالث تقويم لا برنامج." },
        { q: "هل أمدّد سمانتي بين المجموعات؟", a: "وضع القاع في التمرين نفسه هو التمدد المحمل — هبوط الكعبين أسفل الكتلة — وذلك التمدد المحمل يفعل أكثر من التمطيط المرتخي بين المجموعات. أضف دقائق تمطيط مخصصة بعد الجلسة لمدى الوتر بعيد المدى؛ وبين المجموعات استرح ودع العضلة تنفق تعافيها على مدى المجموعة التالية." },
        { q: "الرفع واقفًا أم جالسًا — أيهما أولًا؟", a: "واقفًا كما تعلم هذه الصفحة — فالركبة المستقيمة تحمل التوأمية المرئية، الرأس الذي يعنيه أغلب المتدربين بقولهم السمانة. ويتبع عمل الجلوس في الجلسة نفسها أو في يوم أسبوعي ثانٍ للنعلية. والترتيب عادة تستحق البقاء: الرأس الأكبر ذو الركبة المستقيمة أولًا، والأعمق ذو المثنية بعده." },
      ],
    },
    links: [
      { hrefEn: "/exercises/romanian-deadlift", hrefAr: "/ar/exercises/romanian-deadlift", labelEn: "Romanian deadlift — the calves' neighbor", labelAr: "الديدلفت الروماني — جار السمانة" },
      { hrefEn: "/programs/home-beginner-fullbody", hrefAr: "/ar/programs/home-beginner-fullbody", labelEn: "Home beginner program — calf work included", labelAr: "برنامج المبتدئين المنزلي — يشمل عمل السمانة" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track every set — free tracker", labelAr: "سجل كل مجموعة — المتتبع المجاني" },
    ],
  },

  "barbell-glute-bridge": {
    intro: {
      en: "The barbell glute bridge is the hip thrust's floor-level sibling: same bar, same pad across the hips, but the back lies flat on the ground instead of leaning on a bench — and the drive pushes the hips through the bar from the floor, as the instructions' three steps draw it. The lower position means a shorter range and less load than the thrust, and in exchange the floor itself guarantees the spine stays neutral — the exercise's most beginner-proof feature. For home training it is booked heavily for good reason: a barbell or even a pair of dumbbells and any floor in the world is the whole station.",
      ar: "جسر الألوية بالبار هو الشقيق الأرضي لدفع الورك: نفس البار ونفس البطانة عبر الوركين، لكن الظهر يستلقي على الأرض بدل الاتكاء على بنش — والدفع يمرر الوركين عبر البار من الأرض كما ترسمه خطوات التعليمات الثلاث. الوضع الأخفض يعني مدى أقصر وحملًا أقل من الدفع، ومقابل ذلك تضمن الأرض نفسها بقاء العمود محايدًا — أكثر ميزات الحركة حماية للمبتدئين. وفي التدريب المنزلي يحجز مكانه بكثافة وسبب: بار أو حتى زوج دمبل وأي أرض في العالم هما المحطة كاملة.",
    },
    sections: {
      en: {
        muscles: "The glutes drive the bridge — the library's primary billing — and the floor's geometry hands them the movement cleanly: with the knees bent and the back pinned to the ground, hip extension belongs almost entirely to the gluteus maximus, with the hamstrings assisting near the top and the calves steadying the feet against the slide the instructions warn about. The abs brace the ribs down so the hips do the rising. It is the same muscle recipe as the hip thrust in a smaller kitchen — less range, less load, more certainty about the spine, which is exactly the trade beginners and rehabilitating backs are buying.",
        mistakes: [
          { error: "Arching the lower back to push the hips higher.", fix: "The finish is hips tall with ribs down and glutes squeezed — the floor is the spine's proof; when the hips stop rising, the set's honest range has ended, and the arch is the lower back's forgery of progress." },
          { error: "Feet sliding out as the drive begins.", fix: "The instructions' heel-drive cue needs grip — set the feet on a mat edge or against a rack's base, wear flat shoes, and the bridge keeps its anchor." },
          { error: "Pushing through the toes instead of the heels.", fix: "Drive through the heels as the instructions specify — toe-driving recruits the quads and turns a glute exercise into a leg-morning shuffle." },
          { error: "Letting the bar roll up the ribs between reps.", fix: "The bar sits across the hip creases with the pad as its passport — re-set it there at the bottom of every rep, and the ribs stay out of the bar's travel plans." },
        ],
        alternatives: "The barbell hip thrust — its page in this library — adds the bench, extends the range, and loads heavier: the destination this bridge trains toward. The bodyweight glute bridge is the entry rung and the warm-up; the single-leg version exposes side differences; the band bridge adds resistance for home training without a bar. The deadlift family loads the same hip extension standing — the bridge remains the floor's most focused glute tool, and every program on this site finds a slot for some version of it.",
        progression: "The ladder is the family's clearest: bodyweight bridges for sets of twenty slow reps, then the barbell version light and padded — the instructions' own staging — then load in comfortable jumps while the ribs-down finish holds. The technical progressions are holds and pauses: a two-second squeeze at the top, a three-second lower, a pause halfway. When the floor version's loads get awkward (rolling a heavy bar into place becomes the workout), the bench takes over — the hip thrust page is the next chapter of the same book.",
        programming: "Program it as the main glute lift of a home or beginner block, or as the accessory/finisher of a developed lower day: 3-4 sets of 10-15 reps with 60-90 seconds of rest, twice a week pairs well with the muscle's recovery speed. It suits the end of any session — the floor position costs no trunk stability, so it works when everything else is spent. Our home programs run it as the loaded glute anchor exactly this way.",
        safety: "The floor is the safety story: with the back pinned flat, the spine cannot wander into extension the way standing or bench versions allow — the ribs-down cue is still law, but the ground enforces most of it. The bar's toll at the hip creases is the one recurring discomfort; pad it properly. And the feet's grip on the floor is the movement's one genuine failure mode — a sliding foot mid-drive turns the set into a hamstring charade, so anchor the feet before the first rep, as the mistakes section notes.",
      },
      ar: {
        muscles: "الألويات تقود الجسر — الفاتورة الأساسية للمكتبة — وهندسة الأرض تسلمها الحركة بنظافة: فمع الركبتين المثنيتين والظهر مدسوسًا في الأرض، يعود مدّ الورك للألوية الكبرى وحدها تقريبًا، مع مساعدة الأوتار قرب القمة وثبات السمانة للقدمين ضد الانزلاق الذي تحذر منه التعليمات. والبطن يشدّ الأضلاع لأسفل كي يرتفع الوركان. إنها وصفة العضلات نفسها لدفع الورك في مطبخ أصغر — مدى أقل وحمل أقل وثبات أكثر للعمود، وهي بالضبط المقايضة التي يشتريها المبتدئون والظهور المتأهلة.",
        mistakes: [
          { error: "تقويس أسفل الظهر لدفع الوركين أعلى.", fix: "الختام وركان عاليان وأضلاع منخفضة وألويات معصورة — الأرض هي برهان العمود؛ وحين يتوقف ارتفاع الوركين ينتهي المدى الأمين للمجموعة، والقوس تزوير أسفل الظهر للتقدم." },
          { error: "انزلاق القدمين مع بدء الدفع.", fix: "إشارة الدفع بالكعبين في التعليمات تحتاج قبضة — ضع القدمين على حافة بساط أو ضد قاعدة رف، والبس حذاء مسطحًا، فيحتفظ الجسر بمرساته." },
          { error: "الدفع من أطراف الأصابع بدل الكعبين.", fix: "ادفع عبر الكعبين كما تحدد التعليمات — فدفع الأصابع يجند الفخذ الأمامي ويحول تمرين ألويات إلى خبطة أرجل صباحية." },
          { error: "ترك البار يتدحرج على الأضلاع بين التكرارات.", fix: "يجلس البار عبر ثنيات الورك والبطانة جواز سفره — أعد وضعه هناك في قاع كل تكرار، فتبقى الأضلاع خارج خطط سفر البار." },
        ],
        alternatives: "دفع الورك بالبار — صفحته في مكتبتنا — يضيف البنش ويمدد المدى ويحمل أثقل: الوجهة التي يتدرب نحوها هذا الجسر. وجسر وزن الجسم هو الدرجة الأولى والإحماء، ونسخة الساق الواحدة تكشف فروق الجهتين، وجسر المطاط يضيف مقاومة للتدريب المنزلي بلا بار. وعائلة الديدلفت تحمل مدّ الورك نفسه واقفة — ويبقى الجسر أخصر أداة ألويات على الأرض، وكل برنامج في هذا الموقع يجد خانة لنسخة منه.",
        progression: "السلم أوضح سلالم العائلة: جسور وزن الجسم لمجموعات من عشرين تكرارًا بطيئًا، ثم نسخة البار خفيفة ومبطنة — تصميم التعليمات نفسه — ثم الحمل بقفزات مريحة مع بقاء ختام الأضلاع سالمًا. والتدرجات الفنية تثبيت وتوقفات: عصرة ثانيتين في القمة، ونزول ثلاث ثوان، وتوقف في منتصف الطريق. وحين تصبح أحمال نسخة الأرض محرجة (يصبح تدحريج بار ثقيل مكانه هو التمرين) يتسلم البنش — وصفحة دفع الورك هي الفصل التالي من الكتاب نفسه.",
        programming: "برمجه كرفعة الألويات الرئيسية لكتلة منزلية أو مبتدئة، أو كملحق وختام ليوم سفلي متمرس: 3-4 مجموعات من 10-15 تكرارًا براحة 60-90 ثانية، ومرتان أسبوعيًا تناسمان سرعة تعافي العضلة. يناسب نهاية أي جلسة — فوضع الأرض لا يكلف ثبات الجذع شيئًا فيعمل حين يكون كل شيء آخر منهكًا. وبرامجنا المنزلية تشغله كمرساة الألويات المحملة هكذا بالضبط.",
        safety: "الأرض هي قصة السلامة: فمع الظهر مسطحًا مدسوسًا لا يستطيع العمود التشرد إلى الامتداد كما تسمح النسخ الواقفة أو بالبنش — وإشارة الأضلاع لأسفل ما تزال قانونًا لكن الأرض تنفذ معظمه. ورسوم البار عند ثنيات الورك هي الانزعاج المتكرر الوحيد؛ بطّنها جيدًا. وقبضة القدمين على الأرض هي نمط الفشل الحقيقي الوحيد للحركة — فقدم تنزلق منتصف الدفع تحول المجموعة إلى مهزلة أوتار، فأرسِ القدمين قبل أول تكرار كما تشير فقرة الأخطاء.",
      },
    },
    faq: {
      en: [
        { q: "Glute bridge or hip thrust — which one should I do?", a: "Same family, different chapters: the bridge's floor position means shorter range, less load, and a spine the ground itself protects — the beginner and home-training default. The thrust's bench extends the range and takes heavier loads — the developed trainee's main lift. Programs graduate from bridge to thrust as strength grows, and this library carries both pages for exactly that journey." },
        { q: "Why do I feel glute bridges in my hamstrings?", a: "Feet too far forward — the classic geometry slip: when the shins lengthen at the top, the hamstrings take the drive's lead. Shuffle the feet back until the knees sit over the ankles at full extension, drive through the heels, and the burn moves to the glutes within a set or two." },
        { q: "Can I do glute bridges every day?", a: "Light bodyweight bridges daily are posture homework many coaches prescribe — the movement is gentle, floor-protected, and recovers fast. Loaded bridges belong in training sessions, 2-3 a week, with a day's gap; the daily version keeps the muscle switched on while the loaded version builds it." },
      ],
      ar: [
        { q: "جسر الألويات أم دفع الورك — أيهما أؤدي؟", a: "نفس العائلة وفصول مختلفة: وضع الأرض في الجسر يعني مدى أقصر وحملًا أقل وعمودًا تحميه الأرض نفسها — افتراضي المبتدئين والتدريب المنزلي. وبنش الدفع يمدد المدى ويأخذ أثقل — رفعة المتدرب المتمرس الأساسية. تتخرج البرامج من الجسر إلى الدفع مع نمو القوة، وتحمل مكتبتنا الصفحتين لهذه الرحلة بالضبط." },
        { q: "لماذا أشعر بجسر الألويات في أوتار فخذي؟", a: "القدمان بعيدتان للأمام — الزلقة الهندسية الكلاسيكية: فحين تتمدد عظام الساق في القمة تأخذ الأوتار قيادة الدفع. اسحب القدمين للخلف حتى تجلس الركبتان فوق الكاحلين عند الامتداد الكامل، وادفع بالكعبين، فينتقل الاحتراق إلى الألويات خلال مجموعة أو اثنتين." },
        { q: "هل أؤدي جسور الألويات يوميًا؟", a: "الجسور الخفيفة بوزن الجسم يوميًا واجب وضعية يصفه كثير من المدربين — فالحركة لطيفة محمية بالأرض وتتعافى سريعًا. والجسور المحملة مكانها الجلسات، مرتين إلى ثلاث أسبوعيًا بفارق يوم؛ فالنسخة اليومية تبقي العضلة مشتعلة بينما تبنيها النسخة المحملة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-hip-thrust", hrefAr: "/ar/exercises/barbell-hip-thrust", labelEn: "Hip thrust — the loaded progression", labelAr: "دفع الورك — تدرج التحميل" },
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-building-guide-no-equipment", labelEn: "Home training with no equipment", labelAr: "التدريب المنزلي بلا معدات" },
      { hrefEn: "/programs/home-beginner-fullbody", hrefAr: "/ar/programs/home-beginner-fullbody", labelEn: "Home beginner full-body program", labelAr: "برنامج الجسم الكامل للمبتدئين المنزلي" },
    ],
  },
};
