/**
 * EXERCISES-ENRICHMENT — BATCH 10 (exercises 47-50 of 50 — FINAL).
 *
 * Closes the triceps family with bench dips (the home-station member the
 * «تمارين صدر/ترايسبس في البيت» queries train through) and finishes the
 * core family with the ab roller, dead bug and cable crunch — the anti-
 * extension flagship, the rehabilitation classic and the loaded flexion
 * head. At 50/50 the P1-2 batch protocol completes.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_10: Record<string, ExerciseEnrichment> = {
  "bench-dips": {
    intro: {
      en: "Bench dips are the triceps dip that fits in a corner: hands on a bench's edge, legs extended forward, and the body lowered between the arms to the ninety-degree elbow the instructions define — then pressed back up by the triceps carrying most of the bodyweight. The library bills the triceps primary with chest and shoulders second, the family's honest cast. No bars, no rack, no gym: a bench, a chair's edge, a park seat — the movement travels anywhere two stable hands can rest, which is why it rarely leaves a home-training program for long.",
      ar: "ديبس البنش هو ديبس الترايسبس الذي يسع في زاوية: يدان على حافة بنش وساقان ممدودتان أمامًا والجسم ينزل بين الذراعين إلى مرفق التسعين درجة الذي يحدده التعليمات — ثم يُدفع صاعدًا بترايسبس تحمل معظم وزن الجسم. تسجل المكتبة الترايسبس أساسية والصدر والأكتاف ثانيين، تشكيل العائلة الأمين. لا قضبان ولا رف ولا صالة: بنش أو حافة كرسي أو مقعد حديقة — الحركة تسافر حيثما استراحت يدان ثابتتان، ولهذا لا يغادر التمرين طويلًا أي برنامج تدريب منزلي.",
    },
    sections: {
      en: {
        muscles: "The triceps presses the body up from the bottom — the primary billing — with all three heads extending the elbows through a serious share of bodyweight: the straighter and more elevated the legs, the heavier the family's lightest setup becomes. The chest and shoulders hold the bottom position and share the press's lower third, exactly as the library's secondary list records, and the forearms grip the edge for the whole ride. The shoulder blades' position is the quiet key the instructions mention: the shoulders stay down away from the ears, so the joint presses from a packed, protected base.",
        mistakes: [
          { error: "Sinking far past the ninety-degree elbow because depth felt free.", fix: "The instructions' slightly-under-ninety bottom is the range's law — past it the shoulder rotates into its impingement corner, and free depth is never actually free." },
          { error: "Hips drifting forward away from the bench.", fix: "The body stays close to the edge — the instructions' perpendicular setup keeps the triceps' line honest; hips that drift turn the dip into a strange push-up with a bench's manners." },
          { error: "Elbows flaring out wide as fatigue arrives.", fix: "The tips' close-elbows law — keep the upper arms brushing the ribs through the whole rep; flaring hands the joint's load to the shoulder at its worst angle." },
          { error: "Shrugging the shoulders up to the ears at the bottom.", fix: "Shoulders packed down — the tips say it for a reason; shrugged shoulders surrender the joint's stable base exactly when the load is heaviest." },
        ],
        alternatives: "The parallel-bar triceps dip — its page in this library — is the pattern's full-load flagship; the machine dip dials the load below bodyweight for the building phase. Close-grip push-ups load the same extension with the shoulders supported. The triceps pushdown and overhead extensions cover the family's two isolated positions. Bench dips remain the family's traveling member — the one that keeps the pattern alive in hotel rooms and living rooms without a single plate.",
        progression: "The ladder is leg position: knees bent and feet close is the entry — roughly half bodyweight; feet extended is the standard; feet elevated on a second bench loads the pattern toward the parallel bars. From there, a plate on the lap is the honest loading step, and the parallel bars themselves are the graduation this page trains toward. Each rung is earned with twelve to fifteen clean reps at the ninety-degree law, never with deeper sinks.",
        programming: "Book it as the main triceps movement of a home session or the finisher of a gym push day: 3 sets of 8-15 reps with 60-90 seconds of rest, twice a week. At home it often carries the whole triceps load — our home programs slot it exactly so — while in the gym it finishes the muscle after the heavier bars. The bench version suits high-rep finisher work better than any other dip: the load is right for it, and the setup takes seconds.",
        safety: "The shoulder is the joint the range law protects — the classic bench-dip injury story is deep, fast dipping on cold shoulders, and the ninety-degree law plus a slow first set is its entire prevention. The wrists prefer the fingers-forward grip the instructions stage; wrists that ache want the hands turned slightly out or a parallel-grip pair of handles. And check the bench before the first rep: a sliding bench under a loaded dip is an accident with excellent production values, and a wall anchor ends the genre.",
      },
      ar: {
        muscles: "تدفع الترايسبس الجسم صاعدًا من القاع — الفاتورة الأساسية — والرؤوس الثلاثة تمدّ المرفقين عبر نصيب جاد من وزن الجسم: فكلما استقامت الساقان وارتفعتا صار أخف إعداد في العائلة أثقل. ويحمل الصدر والأكتاف وضع القاع ويتقاسمان الثلث الأسفل من الدفعة، تمامًا كما تسجل قائمة المكتبة المساعدة، والساعدان يمسكان الحافة طوال الرحلة. وموضع لوحي الكتف هو المفتاح الصامت الذي تذكره التعليمات: تبقى الكتفان منخفضتين بعيدتين عن الأذنين، فيدفع المفصل من قاعدة محزومة محمية.",
        mistakes: [
          { error: "الغوص بعيدًا خلف مرفق التسعين لأن العمق بدا مجانيًا.", fix: "قاع ما-تحت-التسعين-قليلًا في التعليمات هو قانون المدى — فبعده يدور الكتف إلى زاوية انحشاره، والعمق المجاني ليس مجانيًا أبدًا في الحقيقة." },
          { error: "انجراف الوركين أمامًا بعيدًا عن البنش.", fix: "يبقى الجسم قريبًا من الحافة — إعداد العمودية في التعليمات يحفظ لخط الترايسبس أمانته؛ فالوركان السادران يحولان الديبس إلى ضغطة غريبة بأخلاق بنش." },
          { error: "تفتيح المرفقين مع وصول التعب.", fix: "قانون المرفقين القريبين في النصائح — دع أعلى الذراعين يمسّ الأضلاع طوال التكرار؛ فالتفتيح يسلم حمل المفصل للكتف عند أسوأ زواياه." },
          { error: "هزّ الكتفين نحو الأذنين في القاع.", fix: "كتفان محزومتان لأسفل — تقولها النصائح لسبب؛ فالكتفان المهزوزتان تستسلمان قاعدة المفصل المستقرة بالضبط حين يكون الحمل أثقله." },
        ],
        alternatives: "ديبس الترايسبس على القضبان المتوازية — صفحته في مكتبتنا — علم العائلة محمل القوة الكامل، وماكينة الديبس تضبط الحمل تحت وزن الجسم لمرحلة البناء. والضغط القريب القبضة يحمل المدّ نفسه بأكتاف مدعومة. والدفعة السفلية والمدات فوق الرأس تغطيان الوضعين المعزولين للعائلة. ويبقى ديبس البنش عضو العائلة المسافر — الذي يبقي النمط حيًا في غرف الفنادق والصالونات دون قرص واحد.",
        progression: "السلم موضع الساقين: ركبتان مثنيتان وقدمان قريبتان هي البوابة — نحو نصف وزن الجسم؛ والقدمان الممدودتان هو المعيار؛ والقدمان المرفوعتان على بنش ثانٍ يحملان النمط نحو القضبان المتوازية. ومن هناك، قرص على الحافة خطوة التحميل الأمينة، والقضبان نفسها هي التخرج الذي تتدرب نحوه هذه الصفحة. وكل درجة تُكسب باثني عشر إلى خمسة عشر تكرارًا نظيفًا عند قانون التسعين، لا بغوصات أعمق أبدًا.",
        programming: "احجزه كحركة الترايسبس الرئيسية لجلسة منزلية أو ختامًا ليوم دفع في الصالة: ثلاث مجموعات من 8-15 تكرارًا براحة 60-90 ثانية، مرتين أسبوعيًا. ومنزليًا يحمل غالبًا كل حمل الترايسبس — وبرامجنا المنزلية تضعه هكذا بالضبط — بينما يختم في الصالة العضلة بعد القضبان الأثقل. ونسخة البنش تناسب عمل الختام عالي التكرار أفضل من أي ديبس آخر: فالحمل مناسب لذلك والإعداد يستغرق ثوان.",
        safety: "الكتف هو المفصل الذي يحميه قانون المدى — وقصة إصابة ديبس البنش الكلاسيكية غوص عميق سريع على أكتاف باردة، وقانون التسعين مع أول مجموعة بطيئة هما وقايته كلها. ويفضل الرسغان قبضة الأصابع-للأمام التي تجهزها التعليمات؛ والرسغان المتألمتان يريدان يدين مستديرتين قليلًا للخارج أو زوج مقابض متوازية. وافحص البنش قبل أول تكرار: فالبنش المنزلق تحت ديبس محمل حادث بإنتاج عالٍ، ومرساة حائط تنهي النوع كله.",
      },
    },
    faq: {
      en: [
        { q: "Should my feet be on the floor or elevated?", a: "Floor with extended legs is the standard this page teaches; bent knees with feet close is the honest regression, and feet on a second bench is the load's next rung. The legs are the exercise's volume dial — each change of position is roughly a plate's worth of bodyweight shifted onto the triceps." },
        { q: "Are bench dips bad for the shoulders?", a: "Only past the ninety-degree law — the instructions' slightly-under-ninety bottom keeps the joint inside its comfortable range, and the complaints the exercise is famous for come from deeper, faster dipping. Keep the shoulders down, the elbows close, the bottom controlled, and bench dips earn their keep honestly." },
        { q: "How do I make bench dips harder at home?", a: "In order: extend the legs fully, elevate the feet on a chair, add a backpack with books on the lap, then slow the lowering to three seconds. That ladder carries most trainees months deep into home training — and the parallel-bar dips at a local park are the graduation ceremony this page has been rehearsing." },
      ],
      ar: [
        { q: "هل قدماي على الأرض أم مرفوعتان؟", a: "الأرض بساقين ممدودتين هي المعيار الذي تعلمه هذه الصفحة؛ والركبتان المثنيتان بقدمين قريبتين تراجع أمين، والقدمان على بنش ثانٍ درجة الحمل التالية. فالساقان قرص حجم التمرين — وكل تغيير موضع يعادل تقريبًا قرصًا من وزن الجسم منقولًا إلى الترايسبس." },
        { q: "هل ديبس البنش سيء للأكتاف؟", a: "فقط خلف قانون التسعين — فقاع ما-تحت-التسعين في التعليمات يبقي المفصل داخل مداه المريح، والشكاوى التي اشتهر بها التمرين تأتي من غوص أعمق وأسرع. أبقِ الكتفين منخفضتين والمرفقين قريبين والقاع متحكمًا فيه، ويكسب ديبس البنش رزقه بأمانة." },
        { q: "كيف أصعّب ديبس البنش منزليًا؟", a: "بالترتيب: مدّ الساقين كاملًا، ثم ارفع القدمين على كرسي، ثم أضف حقيبة ظهر كتبًا على الحضن، ثم أبطئ النزول إلى ثلاث ثوان. ذلك السلم يحمل أغلب المتدربين شهورًا داخل التدريب المنزلي — وديبس القضبان المتوازية في حديقة قريبة هو حفل التخرج الذي كانت هذه الصفحة تتمرن عليه." },
      ],
    },
    links: [
      { hrefEn: "/exercises/dips-triceps-version", hrefAr: "/ar/exercises/dips-triceps-version", labelEn: "Bar dips — the full-load graduation", labelAr: "ديبس القضبان — تخرج الحمل الكامل" },
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-building-guide-no-equipment", labelEn: "No-equipment home training guide", labelAr: "دليل التدريب المنزلي بلا معدات" },
      { hrefEn: "/programs/home-beginner-fullbody", hrefAr: "/ar/programs/home-beginner-fullbody", labelEn: "Home beginner full-body program", labelAr: "برنامج الجسم الكامل للمبتدئين المنزلي" },
    ],
  },

  "ab-roller": {
    intro: {
      en: "The ab roller is the smallest machine with the biggest honesty problem: a wheel, a handle, and a rollout that looks easy until the abs realize they are the only thing between a straight body and the floor. The instructions carry the movement's two laws — roll out as far as control allows, keep the abs tight the whole ride — and the library grades it intermediate because the exercise demands a bracing strength most first attempts discover is missing. It trains the abs the way they actually work — resisting the spine's extension under a moving load — and it scales from a gentle knee rollout to a full standing descent, which is why programs from rehab to elite athletics keep a wheel in the drawer.",
      ar: "عجلة البطن أصغر ماكينة وأكبر مشكلة صدق: عجلة ومقبض ومدحرجة تبدو سهلة حتى تدرك البطن أنها الشيء الوحيد بين جسم مستقيم والأرض. تحمل التعليمات قانوني الحركة — دحرج خارجًا إلى أقصى ما تسمح السيطرة وأبقِ البطن مشدودة طوال الرحلة — وتصنفها المكتبة للمتوسطين لأن التمرين يطلب قوة شد تكتشف أغلب المحاولات الأولى أنها مفقودة. تدرّب البطن بالطريقة التي تعمل بها فعلًا — مقاومة استطالة العمود تحت حمل متحرك — وتتدرج من مدحرجة ركبة لطيفة إلى هبوط واقف كامل، ولهذا تحتفظ برامج من التأهيل إلى الرياضات النخبة بعجلة في الدرج.",
    },
    sections: {
      en: {
        muscles: "The abs run the show eccentrically — as the wheel rolls out and the body lengthens into a moving plank, the rectus abdominis fights the spine's extension link by link, which is the muscle's actual job description in daily life. The obliques brace against the twist, the lats and shoulders press the wheel and hold the arm's line, the library's secondary billing covering them — and the deeper transverse abdominis cinches the whole cylinder. No other abs tool loads the anti-extension pattern through such a long, traveling range; the plank holds the same job at a standstill.",
        mistakes: [
          { error: "Rolling out past the point where the lower back arches.", fix: "The wheel stops where the ribs stay down and the spine stays long — the instructions' as-far-as-you-can clause means as far as you can WITHOUT the arch; the hips sagging is the exercise saying no for your abs." },
          { error: "Rolling from the arms — shoulders doing the traveling.", fix: "The arms stay over the wheel, the body pivots from the knees or feet; when the shoulders shrug and reach, the rollout becomes a weird overhead press and the abs clock out early." },
          { error: "Rushing the rollout and yanking the return.", fix: "Three seconds out through control, one second back with the abs' pull — the instructions demand tight abs throughout; speed is the theft of the exercise's entire currency." },
          { error: "Holding the breath for the whole rep.", fix: "Exhale slowly on the way out, inhale on the return, as the bracing tips across this library teach — braced never means breathless." },
        ],
        alternatives: "The plank is the pattern's static sibling — its page sits in this library — and the dead bug teaches the same rib-down brace lying down. Stir the pot (forearms on a ball, small circles) adds a twist dimension; the walkout from the hands (no wheel needed) carries the same rollout on any floor. The wheel's advantage is the long traveling range that none of the alternatives match — which is also why it earns the intermediate grade they do not.",
        progression: "The ladder is range, then lever: knee rollouts to a partial arc come first, then the full knee rollout, then toe rollouts (the same arc from the feet), and finally the standing rollout — the family's summit, where the body is one long lever from heel to wheel. Each rung is earned with five slow, arch-free reps, and no rung is skipped — the standing rollout is not a knee rollout with courage, it is a different exercise with a year of prerequisites. A pause at the rollout's farthest point buys depth at every level.",
        programming: "Book it as a core block's main lift or a finisher: 3-4 sets of 5-10 slow rollouts with 60-90 seconds of rest, twice a week. The movement's intensity makes low volumes honest — five perfect rollouts outrank twenty fast ones by a distance no other abs exercise matches. It slots early in a session (fresh nervous system for the bracing) or last (the day's final exam for the trunk), and our program templates carry both placements.",
        safety: "The lower back is the canary: the moment it arches, the set is over — the rollout's value lives entirely inside the ribs-down range, and every arching rep trades training for spinal stress. The shoulders take real work too; the packed-shoulder cue keeps them out of impingement's corner. Wrist complaints usually want the hands fully stacked over the wheel or a roller with angled grips; and beginners with a history of disc trouble should earn the dead bug and plank first — the wheel waits, patiently.",
      },
      ar: {
        muscles: "تقود البطن العرضَ سالبًا — فمع دحرجة العجلة خارجًا وامتداد الجسم إلى بلانك متحرك، تقاوم المستقيمة البطنية استطالة العمود فقرةً بعد فقرة، وهذا وصف وظيفتها الفعلي في الحياة اليومية. والمائلتان تشدّان ضد اللفّ، والجنبية والأكتاف تضغطان العجلة وتحفظان خط الذراع، وتغطيهما الفاتورة المساعدة للمكتبة — والمستعرضة الأعمق تشدّ الأسطوانة كلها. ولا أداة بطن أخرى تحمل نمط مقاومة الاستطالة عبر مدى مسافر بهذا الطول؛ فالبلانك يؤدي الوظيفة نفسها واقفًا بلا حراك.",
        mistakes: [
          { error: "المدحرجة بعد نقطة تقوّس أسفل الظهر.", fix: "تتوقف العجلة حيث تبقى الأضلاع منخفضة والعمود طويلًا — وبند «إلى أقصى ما تستطيع» في التعليمات يعني أقصاه بلا قوس؛ فهبوط الوركين هو التمرين يقول لا بدلًا من بطنك." },
          { error: "الدحرجة من الذراعين — الأكتاف هي من يسافر.", fix: "تبقى الذراعان فوق العجلة ويتمحور الجسم من الركبتين أو القدمين؛ فحين تتجهم الأكتاف وتمدّ، تصبح المدحرجة دفعة فوق رأس غريبة وتخرج البطن مبكرًا." },
          { error: "استعجال الخروج وانتزاع العودة.", fix: "ثلاث ثوان خارجًا بسيطرة وثانية عودة بجذب البطن — تشترط التعليمات بطنًا مشدودة طوال الوقت؛ فالسرقة سرقة عملة التمرين كلها." },
          { error: "حبس النفس طوال التكرار.", fix: "ازفر ببطء في الخروج وخذ الشهيق في العودة، كما تعلم نصائح الشد في أرجاء هذه المكتبة — فالمشدود لا يعني المختنق أبدًا." },
        ],
        alternatives: "البلانك الشقيق الثابت للنمط — صفحته في مكتبتنا — والحشرة الميتة تعلّم نفس شدّ الأضلاع-للأسفل مستلقية. و«تحريك القدر» — ساعدان على كرة ودوائر صغيرة — يضيف بُعدًا لفّيًا، والمشية من اليدين بلا عجلة تحمل نفس المدحرجة على أي أرض. وميزة العجلة المدى المسافر الطويل الذي لا تجاريه البدائل — وهو أيضًا سبب وسمها متوسطة دونها.",
        progression: "السلم مدى ثم رافعة: مدحرجات ركبة بقوس جزئي أولًا، ثم مدحرجة الركبة الكاملة، ثم مدحرجات القدمين — نفس القوس من القدمين — وأخيرًا المدحرجة الواقفة، قمة العائلة حيث يكون الجسم رافعة واحدة طويلة من الكعب إلى العجلة. وكل درجة تُكسب بخمس مدحرجات بطيئة بلا قوس، ولا درجة تُتخطى — فالواقفة ليست مدحرجة ركبة بشجاعة، بل تمرين مختلف بسنة من المتطلبات. وتوقف في أبعد نقطة بالخروج يشتري عمقًا عند كل مستوى.",
        programming: "احجزه كرفعة كتلة البطن الرئيسية أو ختامًا: 3-4 مجموعات من 5-10 مدحرجات بطيئة براحة 60-90 ثانية، مرتين أسبوعيًا. تجعل شدة الحركة الأحجام المنخفضة أمينة — فخمس مدحرجات كاملة تتفوق على عشرين سريعة بمسافة لا تجاريها أي حركة بطن أخرى. ويستقر مبكرًا في الجلسة — جهاز عصبي ناضر للشد — أو آخرها — امتحان الجذع النهائي لليوم — وقوالب برامجنا تحمل الموضعين.",
        safety: "أسفل الظهر هو الكناري: ما إن يقوس حتى تنتهي المجموعة — فقيمة المدحرجة تسكن كليًا داخل مدى الأضلاع-للأسفل، وكل تكرار مقوّس يقايض تدريبًا بإجهاد فقري. والأكتاف تعمل عملًا حقيقيًا أيضًا؛ وإشارة الكتف المحزوم تبقيها خارج زاوية الانحشار. وشكاوى الرسغ تريد عادة يدين مركبتين تمامًا فوق العجلة أو بكرة بمقابض مائلة؛ ومن لديه تاريخ غضروف من المبتدئين فليكسب الحشرة الميتة والبلانك أولًا — فالعجلة تنتظر بصبر.",
      },
    },
    faq: {
      en: [
        { q: "My lower back arches on every rollout — am I doing it wrong?", a: "You are doing it too far: the arch is the range's honest boundary, and the fix is rolling out only to the point before it appears — even if that is a foot of travel. The arch-free range grows week by week as the bracing strengthens; the exercise's honesty is the point, and a short strict rollout outranks a long arched one every time." },
        { q: "Knee rollouts or toe rollouts?", a: "Knees first — the shorter lever loads the same brace at a manageable level, and the instructions' kneeling setup is the standard version for exactly that reason. Toes arrive when knee rollouts feel controlled through their full arc; the standing rollout after them is the family's summit, months further on. The wheel does not care which level you train — the abs do." },
        { q: "Is the ab roller better than crunches?", a: "Different jobs, honestly compared: the roller trains the abs' anti-extension role through a long traveling range; crunches train the flexion role through a short one. The muscle's full job description wants both, which is why this library carries both pages and our core templates pair them — roller first, crunches after." },
      ],
      ar: [
        { q: "أسفل ظهري يتقوس في كل مدحرجة — هل أؤديها خطأ؟", a: "أنت تؤديها أبعد من اللازم: فالقوس هو الحد الأمين للمدى، والإصلاح هو المدحرجة إلى ما قبل ظهوره فقط — ولو كان ذلك قدمًا واحدة من السفر. ينمو المدى الخالي من القوس أسبوعًا بعد أسبوع مع قوة الشد؛ وأمانة التمرين هي المغزى، والمدحرجة القصيرة الصارمة تتفوق على الطويلة المقوسة في كل مرة." },
        { q: "مدحرجات الركبة أم القدمين؟", a: "الركبة أولًا — فالرافعة الأقصر تحمل نفس الشد بمستوى يمكن إدارته، وإعداد الركوع في التعليمات هو النسخة القياسية لذلك السبب بالذات. وتصل القدمان حين تشعر مدحرجات الركبة بالتحكم عبر قوسها الكامل؛ والواقفة بعدهما قمة العائلة، على بعد شهور. لا تهتم العجلة بأي مستوى تدرب — بل تهتم البطن." },
        { q: "هل عجلة البطن أفضل من الكرانش؟", a: "وظيفتان مختلفتان مقارنتان بصدق: فالعجلة تدرّب دور البطن المضاد للاستطالة عبر مدى مسافر طويل، والكرانش يدرّب دور الانثناء عبر مدى قصير. ووصف وظيفة العضلة الكامل يريد الاثنين، ولهذا تحمل مكتبتنا الصفحتين وتقترن قوالب البطن لدينا بهما — العجلة أولًا والكرانش بعدها." },
      ],
    },
    links: [
      { hrefEn: "/exercises/plank", hrefAr: "/ar/exercises/plank", labelEn: "Plank — the static sibling", labelAr: "البلانك — الشقيق الثابت" },
      { hrefEn: "/exercises/dead-bug", hrefAr: "/ar/exercises/dead-bug", labelEn: "Dead bug — the floor-school version", labelAr: "الحشرة الميتة — نسخة مدرسة الأرض" },
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص البطن المنزلي" },
    ],
  },

  "dead-bug": {
    intro: {
      en: "The dead bug is the core exercise with the unglamorous name and the impeccable resume: lying on your back, the instructions stage a pressurized starting position — ribs down, lower back flat, pelvis curled — and then the opposite arm and leg extend toward the floor while everything above the waist refuses to move. It is the rehabilitation world's favorite and the strength world's warm-up, and both book it for the same reason: it teaches the deep trunk to hold the spine still while the limbs travel, which is the core's actual job in every step, lift and sprint. The library grades it beginner, and that grade is the invitation — this is where bracing is learned, not where it is tested.",
      ar: "الحشرة الميتة تمرين المركز بالاسم غير الجذاب والسيرة التي لا تُدان: مستلقيًا على ظهرك، تجهز التعليمات وضع بداية مضغوطًا — أضلاع لأسفل وأسفل ظهر مسطح وحوض ملفوف — ثم تمتد الذراع والساق المتقابلان نحو الأرض بينما يرفض كل ما فوق الخصر أن يتحرك. إنها المفضلة لعالم التأهيل وإحماء عالم القوة، وكلاهما يحجزها للسبب نفسه: فهي تعلم الجذع العميق إمساك العمود ساكنًا بينما تسافر الأطراف، وهذه وظيفة المركز الفعلية في كل خطوة ورفعة وعدوة. تصنفها المكتبة للمبتدئين، وهذا التصنيف هو الدعوة — هنا يُتعلم الشد، لا هنا يُختبر.",
    },
    sections: {
      en: {
        muscles: "The deep trunk runs the show — the transverse abdominis and the internal obliques cinch the midsection as the instructions' pressurized start describes, while the rectus abdominis holds the ribs down against the extending limbs' pull. The library bills the abs alone, and the billing is clean: the extending arm and leg work their own muscles, but the exercise's target is the cylinder that stops them from dragging the lower back into an arch. Every rep is a referendum on whether the spine can stay still while the limbs move — the most functional question a core exercise can ask.",
        mistakes: [
          { error: "Lower back peeling off the floor as the leg extends.", fix: "The instructions' flat-back law is absolute — extend the leg only as far as the lumbar stays glued down; a hand slid under the low back gives instant feedback when the space appears." },
          { error: "Rushing the extensions like a cycling motion.", fix: "Three seconds out, three seconds back, with the exhale the instructions prescribe — the dead bug's currency is control, and speed bankrupts it completely." },
          { error: "Holding the breath instead of pressurizing.", fix: "The instructions' hard exhale at the start is the brace's ignition — breathe shallowly and steadily through the reps; a held breath is a brace that fails the moment it matters." },
          { error: "Extending the limbs toward the ceiling and calling it range.", fix: "The extension travels toward the floor, not the sky — the instructions lower the leg to just above the ground; height is easy, control is the exercise." },
        ],
        alternatives: "The plank — its page in this library — holds the same anti-extension brace without limb travel; the ab roller takes the pattern loaded through a long range; bird-dog work (this library's core pages carry it) extends opposite limbs from all fours. The dead bug remains the pattern's floor school: the position removes gravity's tricks, the hands give feedback, and the progression travels from here to every other anti-extension exercise in the family.",
        progression: "The ladder is range and lever, in that order: partial extensions first (the heel slides along the floor while the ribs stay down), then the full hovering extensions this page teaches, then the slow counts — three seconds out, a one-second hover, three seconds back. Weights enter last: a light dumbbell in the extending hand, then a band around the extending foot. The graduating exam is simple and merciless: can the lower back stay flat while the extended leg hovers an inch off the floor for five slow seconds?",
        programming: "Book it as a warm-up, a rehabilitation block or a beginner's main core work: 2-3 sets of 8-12 slow reps per side with 30-45 seconds of rest, three to five times a week — the movement is gentle enough for near-daily practice and foundational enough to deserve it. It pairs before every heavy squat, deadlift and pressing day in our programs as the brace's rehearsal, and it carries whole early-phase core blocks on its own while the planks mature.",
        safety: "The dead bug is among the safest exercises in this library by design — the floor supports the spine, the load is a limb, and the range is yours to choose. The one honest law is the flat back: any rep that arches the lumbar is teaching the spine to move, which is the opposite of the exercise's lesson, so shorten the range and keep the contract. Pregnant trainees and anyone in a disc flare-up run the version with the foot sliding the floor — the ribs-down brace stays, the leg travel shrinks.",
      },
      ar: {
        muscles: "الجذع العميق يقود العرض — فالمستعرضة والمائلة الداخلية تشدّان الوسط كما يصف وضع البداية المضغوط في التعليمات، بينما تحفظ المستقيمة البطنية الأضلاع منخفضة ضد شدّ الأطراف الممتدة. تسجل المكتبة البطن وحدها، والفاتورة نظيفة: فالذراع والساق الممتدان تعملان عضلاتهما الخاصة، لكن هدف التمرين هو الأسطوانة التي تمنعهما من جرّ أسفل الظهر إلى قوس. كل تكرار استفتاء عن هل يستطيع العمود البقاء ساكنًا بينما تتحرك الأطراف — أكثر أسئلة أي تمرين بطن وظيفية.",
        mistakes: [
          { error: "تقشّر أسفل الظهر عن الأرض مع امتداد الساق.", fix: "قانون الظهر المسطح في التعليمات مطلق — مدّ الساق فقط إلى الحد الذي يبقى فيه القطني ملصقًا؛ ويد مزالة تحت أسفل الظهر تعطي رجعًا فوريًا حين تظهر الفجوة." },
          { error: "استعجال المدّات كحركة دراجة.", fix: "ثلاث ثوان خارجًا وثلاث عودة، مع الزفير الذي تصفه التعليمات — فعملة الحشرة الميتة السيطرة، والسررة تفلسها كليًا." },
          { error: "حبس النفس بدل الضغط.", fix: "الزفير القوي عند البداية في التعليمات هو إشعال الشد — تنفس ضحلًا وثابتًا عبر التكرارات؛ فالنَفَس المحبوس شدّ يفشل لحظة احتياله." },
          { error: "مدّ الأطراف نحو السقف وتسميته مدى.", fix: "يسافر المدّ نحو الأرض لا نحو السماء — تنزل التعليمات الساق إلى ما فوق الأرض قليلًا؛ فالارتفاع سهل، والسيطرة هي التمرين." },
        ],
        alternatives: "البلانك — صفحته في مكتبتنا — يحمل نفس الشد المضاد للاستطالة بلا سفر أطراف؛ وعجلة البطن تأخذ النمط محملًا عبر مدى طويل؛ وعمل الطائر-الكلب — تحمل صفحات المركز في مكتبتنا — يمدّ الطرفين المتقابلين من وضع الأربع. وتبقى الحشرة الميتة مدرسة الأرض للنمط: الوضع يزيل حيل الجاذبية، واليدان تعطيان رجعًا، ويتدرج الطريق من هنا إلى كل تمرين مضاد للاستطالة آخر في العائلة.",
        progression: "السلم مدى ثم رافعة بهذا الترتيب: مدّات جزئية أولًا — الكعب ينزلق على الأرض والأضلاع منخفضة — ثم المدّات المعلقة الكاملة التي تعلمها هذه الصفحة، ثم العدّات البطيئة — ثلاث ثوان خارجًا وتحليق ثانية وثلاث عودة. وتدخل الأوزان أخيرًا: دمبل خفيفة في اليد الممتدة، ثم مطاط حول القدم الممتدة. وامتحان التخرج بسيط وقاسٍ: هل يبقى أسفل الظهر مسطحًا بينما تحلق الساق الممتدة على بوصة من الأرض خمس ثوان بطيئة؟",
        programming: "احجزه إحماءً أو كتلة تأهيل أو عمل مركز رئيسيًا للمبتدئ: 2-3 مجموعات من 8-12 تكرارًا بطيئًا لكل جهة براحة 30-45 ثانية، ثلاث إلى خمس مرات أسبوعيًا — فالحركة لطيفة بما يكفي لممارسة شبه يومية وأساسية بما يكفي لتستحقها. وتقترن قبل كل يوم سكوات وديدلفت ودفع ثقيل في برامجنا كبروفة الشد، وتحمل كتل المركز المبكرة كاملة بمفردها بينما تنضج البلانكات.",
        safety: "الحشرة الميتة من أأمن تمارين هذه المكتبة بالتصميم — الأرض تسند العمود، والحمل طرف، والمدى اختيارك. والقانون الأمين الوحيد هو الظهر المسطح: فكل تكرار يقوس القطني يعلّم العمود الحركة، وهو عكس درس التمرين، فقصّر المدى واحفظ العقد. والمتدربات الحوامل ومن في نوبة غضروفية يشغلن النسخة بقدم تنزلق على الأرض — يبقى شدّ الأضلاع-للأسفل ويتقلص سفر الساق.",
      },
    },
    faq: {
      en: [
        { q: "Why is it called a dead bug?", a: "Because of the shape at the top of the setup: arms and legs raised toward the ceiling, torso flat on the floor — the position a beetle on its back wears. The name is the exercise's only silly feature; the pattern is the most respected brace-teaching tool in rehabilitation and strength coaching alike." },
        { q: "How slow should each rep be?", a: "Slow enough that the lower back's story stays boring: three seconds extending out, a beat at the far end, three seconds returning — around eight to ten seconds per rep at a working pace. If the lumbar arches before the leg reaches its range, the rep is faster than your control, and the fix is always the same: slow down or shorten." },
        { q: "When do I graduate from dead bugs?", a: "When the extended-side hover holds five slow seconds with a flat back and steady breathing — then the pattern's loaded versions (the ab roller's page here) and dynamic ones (bird-dog, plank reaches) take over. Most trainees keep dead bugs in warm-ups for life, and that is not a failure to graduate — it is the exercise doing its job in two minutes flat." },
      ],
      ar: [
        { q: "لماذا اسمها الحشرة الميتة؟", a: "بسبب الشكل في قمة الإعداد: ذراعان وساقان مرفوعتان نحو السقف وجذع مسطح على الأرض — الوضعية التي يرتديها خنفساء على ظهرها. الاسم هو ميزة التمرين السخيفة الوحيدة؛ أما النمط فأمحترم أداة تعليم شد في عالمي التأهيل وتدريب القوة على السواء." },
        { q: "ما بطء التكرار الصحيح؟", a: "ببطء يجعل قصة أسفل الظهر مملة: ثلاث ثوان امتدادًا، ولحظة عند الطرف البعيد، وثلاث عودة — نحو ثمان إلى عشر ثوان للتكرار بإيقاع العمل. وإذا تقوّس القطني قبل بلوغ الساق مداها فالتكرار أسرع من سيطرتك، والإصلاح واحد دائمًا: أبطئ أو قصّر." },
        { q: "متى أتخرج من الحشرة الميتة؟", a: "حين يثبت تحليق الجهة الممتدة خمس ثوان بطيئة بظهر مسطح وتنفس ثابت — عندها تتولى نسخ النمط المحملة — صفحة عجلة البطن هنا — والديناميكية: الطائر-الكلب ومدّات البلانك. ويبقي أغلب المتدربين الحشرة الميتة في إحماءاتهم مدى الحياة، وهذا ليس فشلًا في التخرج — بل التمرين يؤدي وظيفته في دقيقتين مسطحتين." },
      ],
    },
    links: [
      { hrefEn: "/exercises/plank", hrefAr: "/ar/exercises/plank", labelEn: "Plank — the next brace lesson", labelAr: "البلانك — درس الشد التالي" },
      { hrefEn: "/exercises/ab-roller", hrefAr: "/ar/exercises/ab-roller", labelEn: "Ab roller — the loaded graduation", labelAr: "عجلة البطن — تخرج التحميل" },
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-building-guide-no-equipment", labelEn: "No-equipment home training", labelAr: "التدريب المنزلي بلا معدات" },
    ],
  },

  "cable-crunch": {
    intro: {
      en: "The cable crunch is the abs exercise that answers the only honest question about them: can they be loaded like every other muscle? A rope on a high pulley, kneeling beneath it, hips still and the waist flexing to bring the elbows toward the thighs — the instructions' whole geometry — and a weight stack that finally lets flexion progress beyond bodyweight boredom. The library bills the abs alone, and the stack's pin is the page's whole argument: measured, incremental, honest loading of the six-pack's actual function. Readers chasing visible abs arrive expecting a shortcut; the page teaches them the muscle underneath — and the kitchen's role above it.",
      ar: "الكرانش بالكيبل هو تمرين البطن الذي يجيب عن السؤال الأمين الوحيد عنها: هل يمكن تحميلها مثل كل عضلة أخرى؟ حبل على بكرة عالية، راكعًا تحتها، والوركان ساكنان والخصر ينثني ليقود المرفقين نحو الفخذين — هندسة التعليمات كاملة — ورصة أوزان تتيح أخيرًا للانثناء تقدمًا وراء ملل وزن الجسم. تسجل المكتبة البطن وحدها، ووتد الرصة هو حجة الصفحة كلها: تحميل مقيس ومتدرج وأمين لوظيفة الست بطنات الفعلية. والقارئ الذي يطارد بطنًا ظاهرة يصل متوقعًا اختصارًا؛ والصفحة تعلمه العضلة التي تحته — ودور المطبخ فوقه.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis flexes the spine against the cable's pull — the library's solo billing, and the purest flexion load in the core family. The obliques assist the crunch's line and hold against the rope's slight sideways arguments, the hip flexors are benched by the kneeling position (the instructions' stationary-hips law), and the abs do the visible work of dragging the ribcage toward the pelvis. The stack's pin makes the muscle's loading honest in a way floor crunches never manage: when the weight climbs, it climbed because the abs moved it.",
        mistakes: [
          { error: "Crunching at the hips instead of the waist.", fix: "The instructions' stationary-hips law is the exercise's identity — the torso curls spine-by-spine; if the hips hinge, the hip flexors took the rep and the abs watched from the bench." },
          { error: "Pulling the rope down with the arms and lats.", fix: "The hands are hooks beside the face — the instructions stage them there; arms that pull convert the crunch into a lat pulldown kneeling down, with worse posture." },
          { error: "Loading so heavy the stack falls through the bottom.", fix: "The instructions warn about exactly this — a weight the lower back catches is a weight the abs never curled; the pin should leave the stack's honesty intact on the way down too." },
          { error: "Rushing reps and riding the stack's rebound.", fix: "Two seconds down into the crunch, a one-second squeeze, two seconds back — the instructions' constant-tension note dies the moment the reps turn into cardio." },
        ],
        alternatives: "The floor crunch — this library's most-viewed core page — carries the same flexion pattern at bodyweight; the exercise-ball version pre-stretches it; weighted decline crunches load it with plates. Hanging leg raises load the abs from the pelvis' side of the contraction. The cable version keeps the family's middle seat: loaded like the weighted versions, constant-tension like the hanging ones, and joint-honest like neither at their worst.",
        progression: "The pin writes the ladder: a stack weight allowing three sets of twelve strict waist-flexions comes first, and the climb is a plate at a time while the hips stay still and the squeeze stays honest. The technical progressions precede the plates — a two-second squeeze at the bottom, a three-second return through the top stretch, and pauses an inch from full flexion. When the stack's top becomes routine, slower tempo and single-arm rope crunches carry the stimulus onward.",
        programming: "Book it as the main loaded flexion of a core block: 3-4 sets of 10-15 reps with 60-90 seconds of rest, twice a week. It pairs with an anti-extension move — the plank or ab roller's pages here — to cover the abs' two job descriptions in one block. On fat-loss programs it rides along exactly as the floor crunch does: building the muscle that the calorie deficit, tracked in our tools, will eventually reveal.",
        safety: "The lower back is the structure the form protects: the instructions' warning about heavy loads and the lumbar catching the work is the page's own safety chapter — the weight belongs to the abs' flexion, not the spine's shock absorption. The neck stays neutral with the hands framing the face rather than pulling the head. And the kneeling position asks a moment of knee comfort: a folded mat under the knees pays that toll for the whole set.",
      },
      ar: {
        muscles: "تثني المستقيمة البطنية العمودَ ضدّ شدّ الكابل — الفاتورة المنفردة للمكتبة، وأنقى حمل انثناء في عائلة البطن كلها. وتساعد المائلتان خطّ الكرانش ويحملان ضد جدالات الحبل الجانبية الطفيفة، وتُخرَج مثنيات الورك من التشكيل بوضع الركوع — قانون الوركين الساكنين في التعليمات — والبطن تؤدي العمل المرئي بجرّ القفص الصدري نحو الحوض. ووتد الرصة يجعل تحميل العضلة أمينًا بطريقة لا تحققها الكرانشات الأرضية أبدًا: فحين يصعد الوزن يكون قد صعد لأن البطن حرّكته.",
        mistakes: [
          { error: "الكرنش من الوركين بدل الخصر.", fix: "قانون الوركين الساكنين في التعليمات هو هوية التمرين — يلتف الجذع فقرةً بعد فقرة؛ فإذا انعطرت الوركان أخذت مثنيات الورك التكرار وتفرجت البطن على البنش." },
          { error: "سحب الحبل نزولًا بالذراعين والجنبية.", fix: "اليدان خطاطيف بجانب الوجه — تضعهما التعليمات هناك؛ فالذراعان الساحبتان تحولان الكرانش إلى سحب أمامي راكعًا، بوضعية أسوأ." },
          { error: "تحميل ثقيل حتى تسقط الرصة عبر القاع.", fix: "تحذر التعليمات من هذا بالضبط — فالوزن الذي يلتقطه أسفل الظهر وزن لم تلفّه البطن أبدًا؛ وينبغي للوتد أن يترك أمانة الرصة سليمة في النزول أيضًا." },
          { error: "استعجال التكرارات وركوب ارتداد الرصة.", fix: "ثانيتان نزولًا إلى الكرانش وعصرة ثانية وثانيتان عودة — تموت ملاحظة الشد الدائم في التعليمات لحظة تحول التكرارات إلى كارديو." },
        ],
        alternatives: "الكرانش الأرضي — أكثر صفحات المركز مشاهدة في مكتبتنا — يحمل نمط الانثناء نفسه بوزن الجسم، ونسخة الكرة تمدّه مسبقًا، والكرانشات المائلة الموزونة تحمله بالأقراص. ورفع الساقين معلقًا يحمل البطن من جهة الحوض في الانقباض. وتحتفظ نسخة الكيبل بالكرسي الأوسط للعائلة: محملة كالنسخ الموزونة، وثابتة الشد كالمعلقة، وأمينة للمفصل كما لا تكون أي منهما في أسوأ حالاتها.",
        progression: "الوتد يكتب السلم: وزن رصة يسمح بثلاث مجموعات من اثني عشر انثناء خصر صارمًا أولًا، والصعود قرصًا في المرة مع بقاء الوركين ساكنين والعصرة أمينة. والتدرجات الفنية تسبق الأقراص — عصرة ثانيتين في القاع، وعودة ثلاث ثوان عبر التمدد العلوي، وتوقفات على بوصة من الانثناء الكامل. وحين تصبح قمة الرصة روتينًا، يحمل الإيقاع الأبطأ وكرانشات الحبل بذراع واحدة التحفيز قدمًا.",
        programming: "احجزه كالانثناء المحمل الرئيسي لكتلة مركز: 3-4 مجموعات من 10-15 تكرارًا براحة 60-90 ثانية، مرتين أسبوعيًا. ويقترن بحركة مضادة للاستطالة — صفحتا البلانك أو العجلة هنا — لتغطية وصفي وظيفة البطن في كتلة واحدة. وفي برامج خسارة الدهون يركب كما يركب الكرانش الأرضي تمامًا: بانيًا العضلة التي سيكشفها العجز الحراري، المتتبع بأدواتنا، في النهاية.",
        safety: "أسفل الظهر هو البنية التي تحميها الوضعية: فتحذير التعليمات من الأحمال الثقيلة والتقاط القطني للعمل هو فصل السلامة الخاص بالصفحة نفسها — فالوزن ملك انثناء البطن لا امتصاص صدمات العمود. وتبقى الرقبة محايدة واليدان يؤطران الوجه بدل شدّ الرأس. ووضع الركوع يطلب لحظة من راحة الركبة: حصيرة مطوية تحتهما تدفع تلك الرسوم عن المجموعة كلها.",
      },
    },
    faq: {
      en: [
        { q: "Why do I feel cable crunches in my hips more than my abs?", a: "The hips joined the movement — the classic fault the instructions' stationary-hips law exists to prevent. Reset lighter: kneel with the hips fixed over the knees, let the torso curl from the upper back down, hands framing the face, and the burn relocates within one set. If the hips still argue, the kneeling distance from the pulley needs a small step back." },
        { q: "How heavy should the cable crunch be?", a: "Heavy enough that the twelfth rep slows and no heavier — the instructions' own warning draws the line: a load the lower back catches is a load the abs never curled. Most trainees work somewhere between a quarter and half of their bodyweight over their first year; the stack's pin measures progress more honestly than any rep count." },
        { q: "Do cable crunches burn belly fat?", a: "No — and no honest page would claim they do: the exercise builds the muscle beneath the fat, and the fat itself answers to the calorie deficit our tools track. What loaded crunches genuinely deliver is a six-pack with structure — when the deficit does its work, there is something worth revealing underneath." },
      ],
      ar: [
        { q: "لماذا أشعر بالكرانش بالكيبل في وركيّ أكثر من بطني؟", a: "انضمت الوركان إلى الحركة — الخطأ الكلاسيكي الذي وُجد قانون الوركين الساكنين في التعليمات لمنعه. أعد الضبط أخف: اركع والوركان مثبتان فوق الركبتين، ودع الجذع يلتف من أعلى الظهر نازلًا، واليدان يؤطران الوجه، فينتقل الاحتراق خلال مجموعة واحدة. وإذا جادلت الوركان رغم ذلك فمسافة الركوع من البكرة تحتاج خطوة للخلف." },
        { q: "كم ثقل الكرانش بالكيبل المناسب؟", a: "ثقيلًا بما يبطئ التكرار الثاني عشر ولا أثقل — خط التحذير في التعليمات نفسها يرسم الحد: فالحمل الذي يلتقطه أسفل الظهر حمل لم تلفّه البطن أبدًا. يعمل أغلب المتدربين في السنة الأولى بين ربع وزن الجسم ونصفه؛ ووتد الرصة يقيس التقدم بأمانة أكبر من أي عدد تكرارات." },
        { q: "هل يحرق الكرانش بالكيبل دهون البطن؟", a: "لا — ولا تدّعي أي صفحة أمينة ذلك: فالتمرين يبني العضلة تحت الدهن، والدهن نفسه يجيب على العجز الحراري الذي تتتبعه أدواتنا. وما تقدمه الكرانشات المحملة حقًا هو ست بطنات ذات بنية — فحين يؤدي العجز عمله يكون هناك شيء يستحق الكشف تحته." },
      ],
    },
    links: [
      { hrefEn: "/exercises/crunches", hrefAr: "/ar/exercises/crunches", labelEn: "Floor crunches — the bodyweight base", labelAr: "الكرانش الأرضي — أساس وزن الجسم" },
      { hrefEn: "/exercises/plank", hrefAr: "/ar/exercises/plank", labelEn: "Plank — the anti-extension pairing", labelAr: "البلانك — القرين المضاد للاستطالة" },
      { hrefEn: "/tools/calorie-calculator", hrefAr: "/ar/tools/calorie-calculator", labelEn: "The deficit that reveals them — calorie calculator", labelAr: "العجز الذي يكشفها — حاسبة السعرات" },
    ],
  },
};
