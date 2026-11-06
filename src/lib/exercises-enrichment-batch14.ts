/**
 * EXERCISES-ENRICHMENT — BATCH 14 (tail batch 1, exercises 66-70 of the
 * enrichment program; SEO-GROWTH plan Phase 3 — owner order 2026-11-06).
 *
 * The chest half's closing file: the lying cable flye, the pec-deck
 * butterfly, the neutral-grip dumbbell press, the bent-arm pullover, and
 * the around-the-worlds arc. Facts quoted come from each exercise's own
 * rows in src/lib/exercises.ts.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_14: Record<string, ExerciseEnrichment> = {
  "flat-bench-cable-flyes": {
    intro: {
      en: "Drag a flat bench between two low pulleys, lie back with a handle in each hand, and flye — except now the resistance never blinks. Where dumbbells load the bottom of the arc and vanish at the top, the cables pull outward through every degree: the library's page pins the setup (low pulleys, bench between, dumbbell-style arc with palms facing) and the payoff — the squeeze at the top meets resistance that a dumbbell cannot provide. It is the flye rebuilt for lifters who fell in love with the top half of the movement and were tired of free weights only paying for the first half.",
      ar: "اسحب بنشًا مستويًا بين بكرتين سفليتين، واستلقِ بمقبض في كل يد، وفتّح — إلا أن المقاومة الآن لا تطرف. حيث يحمل الدمبل قاع القوس ويختفي عند القمة، تشد الكيبلات نحو الخارج عبر كل درجة: تثبّت صفحة المكتبة الإعداد (بكرتان منخفضتان والبنش بينهما وقوس على طريقة الدمبل والكفان متقابلان) والثمرة — العصرة في القمة تقابل شدًّا خارجيًا لا يستطيع الدمبل ولا أي وزن حر تقديمه مهما اتسع رف الأوزان في صالتك. إنها التفتيحة معاد بناؤها لمن أحبّوا النصف العلوي من الحركة وسئموا الأوزان الحرة تدفع ثمن النصف الأول وحده.",
    },
    sections: {
      en: {
        muscles: "The sternal pectoralis major draws the arms together against the cables' outward line — the library lists it without secondary movers, a flye's honest ledger. The arc is the dumbbell flye's: elbows soft and held, hands sweeping wide to deep stretch and closing over the chest. What changes is the resistance's address — every point on the circle carries load, so the fibers that go quiet near the top of a dumbbell flye keep working here until the hands nearly meet. The shoulders hold the elbow's curve; the chest spends the entire budget.",
        mistakes: [
          { error: "Turning the movement into a cable press as fatigue arrives.", fix: "The elbow bend is fixed at the top and never negotiates — the moment the press appears, the set has changed exercises; end it on the arc instead." },
          { error: "Bench set too far forward or back, so one cable's line crosses the body.", fix: "Center the bench between the pulleys before lying down — a skewed line loads one arm as a press and the other as a stretch, which is two exercises and a future ache." },
          { error: "Chasing the dumbbell flye's bottom depth and letting the shoulders roll forward at the stretch.", fix: "Stop where the chest's range ends and the shoulders' begins — the cables already deepen the effective load without borrowing joint depth." },
          { error: "Rushing the close and bouncing the hands together.", fix: "Two counts in, a one-second squeeze with the hands an inch apart, two counts out — the top of this movement is the purchase; do not spend it on speed." },
        ],
        alternatives: "The flye counter's full menu lives in this library. The flat dumbbell flye page owns the free-weight original with its heavy bottom; the cable crossover runs the same constant tension standing, high-to-low; the butterfly machine holds the arc on rails; and the decline pages aim everything at the lower shelf. The lying cable flye's specific niche: a supported back with tension at both ends — the compromise between the dumbbell's stretch and the crossover's squeeze.",
        progression: "The pin progresses exactly when form does: top of the rep range with the squeeze intact earns the next weight, and the count resets. Between jumps, lengthen the top squeeze toward two full seconds and slow the outward negative to three counts. The advanced block alternates this movement with the dumbbell flye across weeks — heavy stretch one week, constant tension the next — and the chest receives both letters of the program.",
        programming: "Three sets of ten to fifteen controlled arcs, following the day's pressing work. It slots as the chest session's tension piece — after the barbell or dumbbell press, before or instead of machine work. In specialization blocks it can lead the session as a pre-fatigue, taught light and squeezed hard. On a cut it preserves the squeeze discipline that heavy iron crowds out when recovery runs thin.",
        safety: "The shoulders write the same rules as every flye — the arc travels only the chest's range, elbows keep their soft armor, and pain at any point shortens the circle immediately. The cables add one machine-specific check: handles clipped and pulleys set at the low, mirrored positions before the first rep. The flat bench needs its own clearance from the stacks — arms sweep wide, and the pulley columns must not be swept in return.",
      },
      ar: {
        muscles: "الصدرية القصية تجمع الذراعين ضد خط الكيبلين الخارجي — والمكتبة تسجلها بلا عضلات ثانوية، سجل تفتيح أمين. القوس هو قوس تفتيح الدمبل: مرفقان لينان ثابتان ويدان تكنسان واسعتين إلى مدّ عميق وتنغلقان فوق الصدر. وما يتغير هو عنوان المقاومة — كل نقطة على الدائرة تحمل ثقلًا، فالألياف التي تخرس قرب قمة تفتيح الدمبل تواصل العمل هنا حتى تكاد اليدان تلتقيان. الكتفان تحفظان انحناء المرفق في مكانه المصون؛ والصدر وحده ينفق ميزانية المجموعة كاملة من أول درجة حتى آخرها.",
        mistakes: [
          { error: "تحويل الحركة إلى دفع بالكيبل مع وصول الإنهاك.", fix: "ثني المرفق مثبت في القمة ولا يتفاوض أبدًا — لحظة تظهر الكبسة تكون المجموعة قد بدّلت التمرين؛ اختمها على القوس بدلًا." },
          { error: "البنش بعيد للأمام أو الخلف فيعبر خط كيبل الجسد.", fix: "وسّط البنش بين البكرتين قبل الاستلقاء — الخط المائل يحمل ذراعًا كدفع والأخرى كمدّ، وهذا تمرينان ووجع مستقبلي." },
          { error: "مطاردة عمق قاع تفتيح الدمبل وترك الكتفين تتدحرجان أمامًا عند المدّ.", fix: "توقف حيث ينتهي مدى الصدر ويبدأ مدى الكتف — فالكيبلات تعمّق الحمل الفعلي أصلًا دون استلاف عمق من المفصل." },
          { error: "استعجال الإغلاق وارتطام اليدين.", fix: "عدّتان داخلًا وعصرة لثانية واليدان على بُعد بوصة، وعدّتان خارجًا — قمة هذه الحركة هي المشتريات؛ لا تنفقها على السرعة." },
        ],
        alternatives: "قائمة كاونتر التفتيح الكاملة تسكن هذه المكتبة. صفحة تفتيح الدمبل المستوي تملك الأصل بالأوزان الحرة بقاعه الثقيل، والتقاطع بالكيبل يدير نفس الشد واقفًا من أعلى إلى أسفل، وجهاز الفراشة يمسك القوس على قضبان، وصفحات المائل تصوب كل شيء نحو الرفّ السفلي. ومقعد تفتيح الكيبل المستلقي تحديدًا: ظهر مسنود بشد عند الطرفين — الحل الوسط بين مدّ الدمبل وعصرة التقاطع.",
        progression: "يتقدم المسمار بالضبط حين يتقدم الأداء: أعلى نطاق التكرارات والعصرة سليمة تستحق الوزن التالي، ويعاد ضبط العدد. وبين القفزات أطل العصرة القصوى نحو ثانيتين كاملتين وأبطئ النزلة الخارجية إلى ثلاث عدّات. وتناوب الكتلة المتقدمة هذه الحركة مع تفتيح الدمبل عبر الأسابيع — مدّ ثقيل أسبوعًا وشدّ دائمًا أسبوعًا — فيستلم الصدر رسالتي البرنامج.",
        programming: "ثلاث مجموعات من عشرة إلى خمسة عشر قوسًا متحكمًا فيه، تتبع عمل الدفع في اليوم. تجلس كقطعة الشد في جلسة الصدر — بعد دفع البار أو الدمبل وقبل عمل الآلات أو بدلًا منه. وفي كتل التخصص تستطيع قيادة الجلسة كإجهاد مسبق، خفيفة التعليم شديدة العصر. وفي التنشيف تحفظ انضباط العصرة الذي يزاحمه الحديد الثقيل حين يشح التعافي.",
        safety: "الكتفان تكتبان نفس قواعد كل تفتيحة — يسافر القوس مدى الصدر فقط، والمرفقان يحفظان درعهما اللين، والألم في أي نقطة يقصّر الدائرة فورًا. وتضيف الكيبلات فحصًا آليًا واحدًا: مقابض مشبكة وبكرتان في الوضعين المنخفضين المتناظرين قبل أول تكرار. ويحتاج البنش المستوي خلاءه من الرَكنين — فالذراعان تكنسان واسعتين، ويجب ألا تُكنس أعمدة البكرات في المقابل.",
      },
    },
    faq: {
      en: [
        { q: "Is this better than dumbbell flyes?", a: "It is better at the top, lighter at the bottom. Cables resist the squeeze where dumbbells go weightless; dumbbells load the stretch where cables feel easy. The strongest chest programs are greedy enough to use both across the week." },
        { q: "Where should the pulleys be set?", a: "Low, at the floor's height, with the bench centered between the stacks — the line of pull should fight the arc, not redirect it. High pulleys turn the same bench into a different movement aimed downhill." },
        { q: "My gym's cables are always busy — can I substitute?", a: "The butterfly machine holds the arc on rails with respectable tension, and the dumbbell flye page owns the stretch. Between the two, the cable's job description is fully covered until the stack frees up." },
      ],
      ar: [
        { q: "هل هي أفضل من تفتيح الدمبل؟", a: "أفضل في القمة وأخف في القاع. الكيبلات تقاوم العصرة حيث تتصالب الدمبلات بلا وزن؛ والدمبلات تحمل المدّ حيث تتراخى الكيبلات. وأقوى برامج الصدر طمعى بما يكفي لاستخدام الاثنين عبر الأسبوع." },
        { q: "أين تضبط البكرات؟", a: "منخفضتين عند ارتفاع الأرض، والبنش موسّط بين الرَكنين — يجب أن يقاوم خط السحب القوس لا أن يعيد توجيهه. والبكرات العالية تحول نفس البنش إلى حركة أخرى مصوبة نزولًا." },
        { q: "كيبلات صالتي مشغولة دائمًا — هل من بديل؟", a: "جهاز الفراشة يمسك القوس على قضبان بشد محترم، وصفحة تفتيح الدمبل تملك المدّ. وبين هاتين الحركتين المتاحتين يُغطى وصف وظيفة الكيبل الحقيقية بالكامل حتى يفرغ الرَكن ويحين دورك أمام الأوزان." },
      ],
    },
    links: [
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest guide — all angles", labelAr: "دليل الصدر — كل الزوايا" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Push-pull-legs program", labelAr: "برنامج دفع وسحب وأرجل" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Workout tracker", labelAr: "متتبع التمارين" },
    ],
  },

  "butterfly": {
    intro: {
      en: "The pec deck — the butterfly — is the chest's isolation movement on rails: seat set, back planted, arms on the pads, and a squeeze that brings the elbows together in front of the sternum while the machine's cam keeps the resistance honest through the whole arc. The library lists it as a beginner-level chest exercise, and that label hides a veteran truth — the deck is where advanced lifters go when the pressing is done and the chest still owes work. No balance to manage, no bar path to police: just the adduction the pectorals were designed for, priced in plates.",
      ar: "جهاز الصدر — الفراشة — هو حركة عزل الصدر على قضبان: مقعد مضبوط وظهر مزروع وذراعان على الوسائد وعصرة تجمع المرفقين أمام عظمة القص بينما يُبقي حدّافة الجهاز المقاومة أمينة عبر القوس كله. تسجل المكتبة الحركة تمرين صدر للمبتدئين، وهذه التسمية تخفي حقيقة قدامى — فالجهاز هو حيث يذهب المتقدمون حين ينتهي الدفع وما زال الصدر مدينًا بعمل. لا توازن يُدار ولا مسار بار يُراقب: التقريب الذي صُممت الصدرية الكبرى لأجله فحسب، مسعّرًا بأقراص معدنية قابلة للعد والتدرج درجة بعد درجة.",
    },
    sections: {
      en: {
        muscles: "The pectoralis major adducts — draws the arms toward the body's midline — and the library records it with no assistants, which is the machine's whole sales pitch. The pads carry the arms through a fixed arc, so the chest's fibers shorten and lengthen without any of the stabilizing work a free-weight flye charges; the front delts and triceps that elbow their way into pressing are structurally unemployed here. That purity is the deck's product: a chest-only contraction, repeatable to the degree, for as many sets as the session's budget allows.",
        mistakes: [
          { error: "Loading the stack so heavy the shoulders and torso throw each rep.", fix: "The deck rewards squeeze, not heroics — a pin that lets the pads meet in front of the sternum under control is the working definition of heavy enough." },
          { error: "Letting the pads bounce apart at the open position.", fix: "Ride the negative until the chest's stretch says stop — a rebounding stack spends the movement's best half and bills the shoulder joint." },
          { error: "Sitting too far forward or back on the seat, so the pads trace the wrong arc for your arms.", fix: "Set the seat so the pads line up with the mid-chest — the machine's geometry only keeps its promises at the height it was designed around." },
          { error: "Holding the squeeze with the elbows crushing together at the end range.", fix: "Meet, squeeze one beat, release — the pads approach each other in front of the chest without collision; contact is not the rep's finish line, the contraction is." },
        ],
        alternatives: "The isolation shelf is well stocked in this library. The cable crossover page runs the same adduction standing with free-range tension; the flat-bench cable flye pins the arc at bench height; the dumbbell flye pages trade the rails for a bottom-heavy stretch; and every press page in the chest family carries the heavier compound work the deck deliberately skips. Rotation across two of these keeps the chest's isolation diet varied.",
        progression: "The pin is the entire ladder: add weight when the top of the rep range arrives with the one-beat squeeze, and rebuild the count. Between jumps, progress the intangibles — slower negatives, a two-beat squeeze, pauses at the stretch position. The deck's ceiling is honest and low-ego: when the machine's stack tops out, slower tempos reopen it, and the crossover family takes over from there.",
        programming: "Three to four sets of ten to fifteen reps with the squeeze held, placed at the end of a chest session after the pressing — the classic finisher slot. On push days it can follow the bench work as the pump's punctuation; in specialization blocks it opens the session light as a pre-fatigue before the bar ever leaves the rack. During a cut, the deck keeps the chest's shape under load while the joints rest from iron.",
        safety: "The machine removes balance, not anatomy: the arc still ends at the chest's range, the shoulders still own the stretch, and any pinch at the front of the joint means the range is set past today's honesty — back the seat up a notch. Elbows and wrists ride the pads lightly; gripping the handles white-knuckled adds nothing. The stack pin gets the usual machine courtesy — fully seated before the first rep, every set.",
      },
      ar: {
        muscles: "الصدرية الكبرى تُقرّب — تسحب الذراعين نحو خط منتصف الجسد — والمكتبة تسجلها بلا مساعدين، وهذا كامل بند مبيعات الجهاز. تحمل الوسائد الذراعين عبر قوس ثابت، فتقصر ألياف الصدر وتمتد بلا أي من عمل التثبيت الذي تحاسب عليه تفتيحة الأوزان الحرة؛ والداليتان الأماميتان والترايسبس اللتان تتسللان إلى الدفع عاطلتان بنيويًا هنا. تلك النقاوة هي منتج الجهاز: انقباض صدري صرف قابل للتكرار بالدرجة، لمجموعات بقدر ميزانية الجلسة.",
        mistakes: [
          { error: "تحميل الرَكن بثقل يجعل الكتفين والجذع يقذفان كل تكرار.", fix: "يكافئ الجهاز العصرة لا البطولات — مسمار يتيح لقاء الوسادتين أمام القص تحت السيطرة هو تعريف «ثقيل بما يكفي» العامل." },
          { error: "ترك الوسائد ترتد مفتحةً في وضع الانفتاح.", fix: "اركب النزلة حتى يقول مدّ الصدر توقف — فالرَكن المرتد ينفق نصف الحركة الأفضل ويرسل الفاتورة إلى مفصل الكتف." },
          { error: "الجلوس بعيدًا للأمام أو الخلف على المقعد فيرسم الوسائد القوس الخطأ لذراعيك.", fix: "اضبط المقعد حتى تصطف الوسائد مع منتصف الصدر — هندسة الجهاز لا تفِ بوعودها إلا عند الارتفاع الذي صُممت حوله." },
          { error: "حبس العصرة مع تحطم المرفقين معًا عند آخر المدى.", fix: "التقاء، وعصرة نبضة، ثم إفلات — تقترب الوسادتان أمام الصدر بلا تصادم؛ فالتلامس ليس خط نهاية التكرار، الانقباض هو." },
        ],
        alternatives: "رف العزل مخزن جيدًا في هذه المكتبة. صفحة التقاطع بالكيبل تدير نفس التقريب واقفةً بشد حر المدى، وتفتيح الكيبل على البنش يثبت القوس عند ارتفاع البنش، وصفحتا تفتيح الدمبل تقايضان القضبان بمدّ سفلي ثقيل، وكل صفحة دفع في عائلة الصدر تحمل العمل المركب الأثقل الذي يتخطاه الجهاز عمدًا. والدوران بين اثنتين منها يُبقى حمية عزل الصدر متنوعة.",
        progression: "المسمار هو السلم كله: أضف وزنًا حين يصل أعلى نطاق التكرارات والعصرة النبضية سليمة، وأعد بناء العدد. وبين القفزات تقدم الملموسات — نزلات أبطأ وعصرة بنبضتين وتوقفات عند وضع المدّ. وسقف الجهاز أمين ومنخفض الأنانية: حين ينفد رَكنه تعيد الإيقاعات البطيئة فتحه من جديد، وتستلم عائلة التقاطع الراية من هناك. وبين المحطتين تبقى العصرة النبضية هي العملة التي يدفع بها الجهاز ثمن عضلة ممتلئة.",
        programming: "ثلاث إلى أربع مجموعات من عشرة إلى خمسة عشر تكرارًا والعصرة محفوظة، في ختام جلسة صدر بعد الدفع — شاغر الخاتمة الكلاسيكي. وفي أيام الدفع يتبع عمل البنش كترقيم للضخ؛ وفي كتل التخصص يفتح الجلسة خفيفًا كإجهاد مسبق قبل أن يغادر البار حاملته. وفي التنشيف يحفظ الجهاز شكل الصدر تحت الحمل بينما ترتاح المفاصل من الحديد.",
        safety: "يزيل الجهاز التوازن لا التشريح: ما زال القوس ينتهي عند مدى الصدر، وما زالت الكتفان تملكان المدّ، وأي وخز أمام المفصل يعني أن المدى مضبوط بعد أمانة اليوم — أرجع المقعد درجة. المرفقان والرسغان يركبان الوسادتين بخفة؛ وقبض المقابض بقبضة بيضاء لا يضيف شيئًا. ويأخذ مسمار الرَكن مجاملة الآلات المعتادة — جالس تمامًا قبل أول تكرار، في كل مجموعة.",
      },
    },
    faq: {
      en: [
        { q: "Pec deck or cable crossover?", a: "Same job, different rails. The deck holds the arc fixed — pure, countable, beginner-proof; the crossover adds free-range tension and body position choices. Most lifters keep both in the rotation and let the queue at the machines decide the day's order." },
        { q: "Why does the deck feel easier than flyes?", a: "Because it removes the jobs flyes charge for: no balancing, no bar path, no stabilization tax. The chest still works — often harder, at the squeeze — while everything else clocks out. 'Easy' here is the machine doing its own chores." },
        { q: "Will the pec deck alone build my chest?", a: "It will isolate it well and grow it modestly. Size lives on progressive load, and the biggest loads travel through presses. The strongest split: press for the work, deck for the finish." },
      ],
      ar: [
        { q: "جهاز الفراشة أم التقاطع بالكيبل؟", a: "نفس الوظيفة وقضبان مختلفة. الجهاز يثبت القوس — نقي وقابل للعد ومحمي من أخطاء المبتدئ؛ والتقاطع يضيف شدًا حر المدى وخيارات وضع الجسد. يحتفظ أغلب الرفاع بالاثنين في التدوير ويتركون طابور الآلات يقرر ترتيب اليوم." },
        { q: "لماذا يبدو الجهاز أسهل من التفتيحات؟", a: "لأنه يسقط الأعمال التي تحاسب عليها التفتيحات: لا توازن ولا مسار بار ولا ضريبة تثبيت. الصدر ما زال يعمل — وأقسى غالبًا عند العصرة — بينما يسجل الباقي خروجه. «السهولة» هنا هي الجهاز يؤدى أعباءه الخاصة." },
        { q: "هل يبني جهاز الفراشة صدري وحده؟", a: "يعزله جيدًا وينميه باعتدال. الحجم يسكن في الحمل المتدرج، وأكبر الأحمال تسافر عبر الدفعات. أقوى تقسيم: ادفع للعمل، والجهاز للختام." },
      ],
    },
    links: [
      { hrefEn: "/programs/gym-beginner-fullbody", hrefAr: "/ar/programs/gym-beginner-fullbody", labelEn: "Beginner full-body gym program", labelAr: "برنامج الصالة كامل الجسم للمبتدئين" },
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training guide", labelAr: "دليل تدريب الصدر" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Free workout tracker", labelAr: "متتبع التمارين المجاني" },
    ],
  },

  "dumbbell-bench-press-with-neutral-grip": {
    intro: {
      en: "Turn the dumbbells so the palms face each other and the bench press changes character: the neutral grip press keeps the elbows tracking close to the torso, the shoulders sitting in their most defensible position, and the emphasis sliding toward the center of the chest and the triceps that lock it out. The library's page files the movement at beginner level with the same credited trio as any press — chest, shoulders, triceps — but the neutral palms redraw the map. For lifters whose shoulders argue with barbell work, this is often the press that ends the argument.",
      ar: "أدر الدمبلين حتى تتقابل الكفان يتغير طبع بنش برس: يحفظ دفع القبضة المحايدة المرفقين يتعقبان قريبين من الجذع، والكتفين جالستين في أكثر مواقعهما قابلية للدفاع، والتركيز ينزلق نحو مركز الصدر والترايسبس الذي يقفله. تقيّد صفحة المكتبة الحركة للمبتدئين بنفس الثلاثي المسجل لأي دفع — صدر وكتف وترايسبس — لكن الكفين المتقابلين يعيدان رسم الخريطة. ولمن تجادل أكتافهم مع عمل البار، هذه غالبًا الدفعة التي تنهي الجدال بسلام وتُبقي حجم التدريب حيًا دون حذف قطعة واحدة من قائمة الأسبوع.",
    },
    sections: {
      en: {
        muscles: "The pectoralis major presses with the library's usual shoulders-and-triceps partners, but the neutral grip redistributes the shares: palms facing each other tuck the elbows naturally, which keeps the shoulder joint centered and quietly hands more of the lockout to the triceps. The sternal fibers still own the press's midline — the hands press up and slightly together over the lower chest — while the elbow-friendly path lets lifters train that ownership without the flare that barbell benches sometimes demand.",
        mistakes: [
          { error: "Letting the elbows flare wide until the press becomes a standard-grip copy.", fix: "The palms face each other and the elbows stay near the ribs — the neutral grip's whole identity lives in that tucked path; guard it under load." },
          { error: "Pressing the dumbbells straight up and apart, losing the slight convergence.", fix: "The hands travel up and marginally toward each other over the chest's midline, the same arc every dumbbell press page teaches — only the palms have rotated." },
          { error: "Half-repping the bottom to protect the shoulders from a stretch they no longer need protecting from.", fix: "The neutral path is the shoulder-friendliest in the press family — take the controlled full range it buys, down to the chest's natural stop." },
          { error: "Rotating the wrists mid-rep as fatigue builds.", fix: "The grip is set at the top and holds — a spinning dumbbell at arm's length is a decision the shoulder learns about instantly." },
        ],
        alternatives: "The press aisle runs the full width of this library. The standard-grip dumbbell bench page carries the wider chest emphasis; the barbell pages hold the heaviest loads; the decline versions aim the same presses at the lower shelf; and for the shoulder-sore lifter, the neutral grip here pairs naturally with the floor press idea — shorter range, same joint kindness. Programs rotate grips across weeks the way chefs rotate knives: by job.",
        progression: "Rack steps, same as every dumbbell press: earn the next pair at the top of the rep range with the tucked path intact. Between jumps, slow the lower and add a one-count pause at the chest's stop. The advanced block alternates neutral and standard grips across sessions — the triceps-heavy week and the chest-wide week — and lets the log show which one the body was missing.",
        programming: "Three to four sets of eight to twelve reps as a chest-day primary or secondary press. The neutral version slots beautifully as the day's second press after a barbell, or as the primary on deload weeks and shoulder-sensitive blocks. In a hypertrophy run it carries the mid-chest with a triceps bonus; in strength blocks it keeps pressing volume alive when the shoulders need a gentler path but the program cannot afford a day off.",
        safety: "The neutral grip is famous precisely because it protects — but the setup rituals stay: dumbbells staged on the thighs, rock back with control, feet planted. The wrists stay neutral to match the palms; bending them backward reroutes load into joints that did not volunteer. And the bottom's stretch still obeys the chest's range — a depth that hurts is depth the press does not need, whatever the grip.",
      },
      ar: {
        muscles: "الصدرية الكبرى تدفع مع شريكيها المعتادين المسجلين كتفين وترايسبس، لكن القبضة المحايدة تعيد توزيع الأسهم: تقابل الكفين يضمان المرفقين طبيعيًا، وهذا يُبقي مفصل الكتف متمركزًا ويسلّم بهدوء أكثر من القفل الختامي إلى الترايسبس. ما تزال الألياف القصية تملك خط منتصف الدفعة — تضغط اليدان صاعدتين ومتقاربتين قليلًا فوق الصدر السفلي — بينما يتيح مسار ودّ المرفق للرفاع تدريب تلك الملكية كاملة بلا الانفتاح الذي يطلبه بنش البار أحيانًا، وهذا سبب بقاء الحركة في برامج من يتدربون بأوجاع قديمة.",
        mistakes: [
          { error: "ترك المرفقين ينفتحان واسعين حتى تصير الكبسة نسخة من القبضة القياسية.", fix: "الكفان متقابلان والمرفقان قرب الأضلاع — هوية القبضة المحايدة كلها تسكن ذلك المسار المضموم؛ احرسه تحت الحمل." },
          { error: "دفع الدمبلين مستقيمين صاعدًا ومفترقين فيضيع التقارب.", fix: "تسافر اليدان صاعدتين وهامشيًا نحو بعضهما فوق خط منتصف الصدر، نفس قوس كل صفحة دفع دمبل — لم يتغير إلا دوران الكفين." },
          { error: "تكرارات نصفية في القاع لحماية كتفين من مدّ لم يعودا يحتاجان الحماية منه.", fix: "المسار المحايد أود مسارات العائلة للكتف — خذ المدى الكامل المتحكم الذي يشتريه، نزولًا حتى توقفة الصدر الطبيعية." },
          { error: "تدوير الرسغين وسط التكرار مع تراكم الإنهاك.", fix: "القبضة تضبط في القمة وتصمد — فالدمبل الدوّار بطول الذراع قرار يعرف الكتف به فورًا." },
        ],
        alternatives: "ممر الدفع يمتد بكامل عرض هذه المكتبة. صفحة دفع الدمبل بالقبضة القياسية تحمل التركيز الصدري الأوسع، وصفحتا البار تحتضنان أثقل الأحمال، ونسختا المائل تصوبان نفس الدفعات نحو الرفّ السفلي، وللرياضي متوجع الكتف تقترن المحايدة هنا طبيعيًا بفكرة الدفع من الأرض — مدى أقصر بنفس ودّ المفصل. وتدير البرامج القبضات عبر الأسابيع كما يدير الطهاة السكاكين: حسب الوظيفة لا حسب الموضة، فتجد القياسية في يوم الحجم والمحايدة في يوم حماية المفاصل.",
        progression: "درجات الرف، ككل دفع دمبل: استحق الزوج التالي عند أعلى نطاق التكرارات والمسار المضموم سليم. وبين القفزات أبطئ النزلة وأضف توقفًا لعدة عند توقفة الصدر. وتناوب الكتلة المتقدمة المحايدة والقياسية عبر الجلسات — أسبوع الترايسبس الثقيل وأسبوع الصدر الواسع — ويُظهر السجل أيهما كان ينقص الجسد.",
        programming: "ثلاث إلى أربع مجموعات من ثمانية إلى اثني عشر تكرارًا كدفع رئيسي أو ثانوي في يوم الصدر. تجلس النسخة المحايدة بجمال كدفع اليوم الثاني بعد البار، أو كالرئيسي في أسابيع التفريغ وكتل حساسية الكتف. وفي جولة التضخيم تحمل وسط الصدر مع مكافأة ترايسبس؛ وفي كتل القوة تُبقي حجم الدفع حيًا حين تحتاج الأكتاف مسارًا ألطف ولا يستطيع البرنامج يوم عطلة.",
        safety: "اشتهرت المحايدة بالحماية بالضبط — لكن طقوس الإعداد تبقى: دمبلان على الفخذين، وتدحرج للخلف بسيطرة، وقدمان مزروعتان. والرسغان يبقيان محايدين مطابقين للكفين؛ ثنيهما للخلف يعيد توجيه الحمل إلى مفاصل لم تتطوع. ومدّ القاع ما يزال يطيع مدى الصدر — عمق يؤلم عمقٌ لا تحتاجه الكبسة، أيًا كانت القبضة.",
      },
    },
    faq: {
      en: [
        { q: "Neutral grip vs regular dumbbell press — which builds more chest?", a: "The regular grip flares the elbows and widens the chest's stretch; the neutral grip tucks them and spares the shoulder. For raw chest emphasis the standard grip edges it; for training without shoulder complaints — or with them — the neutral version wins the week." },
        { q: "Can I use the neutral grip on a barbell?", a: "Only with a specialty multi-grip bar — a straight bar's fixed hands forbid the palms-facing position. With dumbbells the rotation is free, which is exactly why this page lives in the dumbbell family." },
        { q: "Why does my triceps feel this more than regular presses?", a: "Geometry: palms facing means elbows tucked, and tucked elbows put the triceps closer to the press's line of power. The chest still leads — the triceps simply gets a bigger invoice than it does on wide-grip days." },
      ],
      ar: [
        { q: "القبضة المحايدة أم الدفع العادي بالدمبل — أيهما يبني صدرًا أكثر؟", a: "القبضة القياسية تفتح المرفقين وتوسّع مدّ الصدر؛ والمحايدة تضمّهما وتعفي الكتف. للتأكيد الصدري الخام تتقدم القياسية؛ وللتدريب بلا شكاوى كتفية — أو معها — تفوز المحايدة بالأسبوع." },
        { q: "أستطيع استخدام القبضة المحايدة على البار؟", a: "فقط ببار خاص متعدد القبضات — فيدا البار المستقيم تمنعان وضع تقابل الكفين. وبالدمبلين يبقى الدوران حرًا متاحًا في كل لحظة من المجموعة، ولهذا السبب بالضبط تسكن هذه الصفحة عائلة الدمبل لا عائلة البار." },
        { q: "لماذا يشعر ترايسبسي بها أكثر من الدفعات العادية؟", a: "الهندسة: تقابل الكفين يعني مرفقين مضمومين، والمضمومان يضعان الترايسبس أقرب إلى خط قوة الدفعة. الصدر ما زال يقود — الترايسبس ببساطة يستلم فاتورة أكبر مما يستلمها في أيام القبضة الواسعة." },
      ],
    },
    links: [
      { hrefEn: "/blog/12-week-dumbbell-band-muscle-plan", hrefAr: "/ar/blog/home-muscle-building-guide-simple-weights", labelEn: "12-week dumbbell plan", labelAr: "خطة الدمبل لاثني عشر أسبوعًا" },
      { hrefEn: "/programs/home-dumbbell-ppl", hrefAr: "/ar/programs/home-dumbbell-ppl", labelEn: "Dumbbell push-pull-legs", labelAr: "دمبل دفع وسحب وأرجل" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track every press", labelAr: "تتبع كل كبسة" },
    ],
  },

  "bent-arm-dumbbell-pullover": {
    intro: {
      en: "The bent-arm pullover is the gym's oldest bridge: lying across or along a bench, one dumbbell held in cupped hands above the chest, elbows bent and held, the weight arcs overhead toward the floor and returns — and the chest and lats split the work down the middle, exactly as the library's ledger records them (chest first, lats, shoulders, triceps behind). The bent elbows are the movement's whole trick: they hand the chest a share of the arc the straight-arm version gives away to the back, and they let heavier iron travel a path the shoulder can defend. It built rib cages in gyms decades before this library existed; the page exists because it still earns the slot.",
      ar: "البول أوفر بالمرفق المثني هو أقدم جسور الصالة: مستلقيًا عبر بنش أو على طوله، ودمبل واحد في كفين مقعّرتين فوق الصدر، والمرفقان مثنيان محفوظان، يقوس الوزن فوق الرأس نحو الأرض ثم يعود — ويتقاسم الصدر والظهر العمل من منتصفه بالضبط كما يسجل دفتر المكتبة (الصدر أولًا ثم الظهر والكتفان والترايسبس). المرفقان المثنيان هما حيلة الحركة كلها: يمنحان الصدر حصة من القوس تهديها النسخة ذات الذراع المستقيمة للظهر، ويسمحان لحديد أثقل بالسفر في مسار يستطيع الكتف الدفاع عنه. بنى هذا التمرين أقفاصًا صدريّة في صالات قديمة قبل وجود هذه المكتبة بعقود؛ ووُجدت الصفحة لأنه ما زال يستحق الشاغر.",
    },
    sections: {
      en: {
        muscles: "The library's order tells the story: chest leads, lats, shoulders and triceps assist. As the dumbbell arcs behind the head, the pectorals — especially their upper fibers — lengthen under load while the lats stretch in the same reach; the return is a pullover-flavored press, the chest pulling the arms back over the sternum with the lats hauling alongside. The bent elbows shorten the lever so the shoulder's small rotators can steward the arc, and the scapulae are free to ride the ribcage through the reach — the movement is as much a stretch position as it is a lift.",
        mistakes: [
          { error: "Dropping the hips toward the floor on the across-bench setup until the movement becomes a horrible bridge.", fix: "The hips stay in the line the page sets — the arc belongs to the shoulders, not to a gymnastics routine the spine never trained for." },
          { error: "Straightening the arms as the weight descends, quietly switching exercises.", fix: "The bent elbow is the exercise's name and its mechanism — the angle set at the top holds for every degree of the arc." },
          { error: "Lowering past the shoulder's comfortable reach to chase a deeper stretch.", fix: "The stretch ends where the shoulder says it ends — the arc's depth grows with training age, never with courage on a Tuesday." },
          { error: "Flaring the ribs and arching the low back to press the weight back up.", fix: "Exhale on the return, ribs knitted down; the trunk stays a platform, and the arms do the traveling." },
        ],
        alternatives: "The pullover shelf in this library holds the family's branches. The straight-arm versions hand the movement to the lats almost entirely; the cable pullover pages keep tension constant where the dumbbell's arc lightens; and for the chest-first job this page trains, the upper-chest incline presses and flyes are the modern staples most programs rotate it with. The bent-arm dumbbell version keeps its seat for one reason: nothing else stretches and loads the chest-and-lat border quite like it.",
        progression: "Depth first, load second: the arc grows an inch at a time as the shoulder earns the reach, and the weight climbs only when the full controlled arc is old news. The advanced block runs slow negatives with a two-count pause at the bottom reach, or pairs the pullover with an upper-chest press in a superset that pre-fatigues the fibers the arc targets. The movement rewards decades — patience is the programming.",
        programming: "Two to three sets of ten to fifteen deliberate reps, usually late in a chest or back session — its dual citizenship suits either passport. Classic programs ran it on leg days as a rib-expander with light breathing squats; contemporary ones slot it as the chest day's stretch piece or the back day's opener. On a mass phase it serves the stretch-under-load niche; on a cut it keeps the ribcage's frame working while the loads stay polite.",
        safety: "The shoulder girdle is the whole caution file. The arc travels only the range today's shoulder owns — the bottom position is a stretch, not a goal, and impingement-style pinches mean the arc shrinks immediately. The neck stays neutral, jaw loose, eyes on the ceiling, with the head supported on the bench in the along-bench setup. Anyone with a history of shoulder instability gets the standing referral: clinician first, straight-arm cable versions as the quieter substitute.",
      },
      ar: {
        muscles: "ترتيب المكتبة يروي القصة: الصدر يقود، والظهر والكتفان والترايسبس تعاون. فبينما يقوس الدمبل خلف الرأس تتمدد الصدرية — وبخاصة أليافها العلوية — تحت الحمل بينما يتمدد الظهرية في نفس المدّ؛ والعودة دفعة بنكهة بول أوفر، الصدر يسحب الذراعين عائدتين فوق عظمة القص والظهرية تجذب بجانبه. المرفقان المثنيان يقصران الرافعة فتستطيع دوارات الكتف الصغيرة رعاية القوس، واللوحان حرّان يركبان القفص الصدري عبر المدّ — فالحركة وضع مدّ بقدر ما هي رفعة.",
        mistakes: [
          { error: "إسقاط الوركين نحو الأرض في إعداد العرض عبر البنش حتى تصير الحركة جسرًا مرعبًا.", fix: "يبقى الوركان في الخط الذي تضبطه الصفحة — القوس ملك الكتفين لا روتين جمبازي لم يتدرب عليه العمود يومًا." },
          { error: "تمديد الذراعين مع نزول الوزن، فيتبدل التمرين خلسةً.", fix: "المرفق المثني اسم التمرين وآليته — الزاوية المضبوطة في القمة تصمد لكل درجة من القوس." },
          { error: "النزول بعد مدى راحة الكتف مطاردةً لمدّ أعمق.", fix: "ينتهي المدّ حيث يقول الكتف انتهى — عمق القوس ينمو مع أعمار التدريب لا بشجاعة يوم ثلاثاء." },
          { error: "نفخ الأضلاع وتقويس أسفل الظهر لدفع الوزن عائدًا.", fix: "ازفر مع العودة والأضلاع مخيطة لأسفل؛ الجذع منصة والذراعان من تسافران." },
        ],
        alternatives: "رف البول أوفر في هذه المكتبة يحتفظ بفروع العائلة. نسخ الذراع المستقيمة تُسلّم الحركة للظهرية تقريبًا بالكامل، وصفحتا البول أوفر بالكيبل تحفظان شدًّا دائمًا حيث يخف قوس الدمبل، وللوظيفة الصدرية الأولى التي تدرّبها هذه الصفحة تبقى دفعات وتفتيحات الصدر العلوي المائلة هي البضاعة الحديثة التي تُدار معها. وتحتفظ نسخة المرفق المثني بمقعدها لسبب واحد: لا شيء يمدّ ويحمل حدود الصدر والظهر معًا كما تفعل.",
        progression: "العمق أولًا والحمل ثانيًا: ينمو القوس بوصة في المرة كلما استحق الكتف المدّ، ولا يصعد الوزن إلا حين يصبح القوس الكامل المتحكم خبرًا قديمًا. وتدير الكتلة المتقدمة نزلات بطيئة بتوقف عدّتين عند المدّ السفلي، أو تقارن البول أوفر بدفع صدر علوي في تتابع يُجهز مسبقًا الألياف التي يستهدفها القوس. تكافئ الحركة العقود — والصبر هو البرمجة.",
        programming: "جلستان إلى ثلاث من عشرة إلى خمسة عشر تكرارًا متأنية، عادة في أواخر جلسة صدر أو ظهر — وجنسها المزدوج يليق بجوازي السفر. شغّلت البرامج الكلاسيكية التمرين في أيام الأرجل كموسّع أضلاع بستقائلات تنفس خفيفة؛ والحديثة تضعه كقطعة مدّ ليوم الصدر أو افتتاحية ليوم الظهر. وفي مرحلة الكتلة يخدم نافذة المدّ تحت الحمل؛ وفي التنشيف يُبقي إطار القفص يعمل بينما تبقى الأحمال مهذبة.",
        safety: "حزام الكتف هو ملف الحذر كله. يسافر القوس مدى كتف اليوم فقط — وضع القاع مدّ لا هدف، ووخز الانحشاء يعني تقليص القوس فورًا. والرقبة محايدة وفك مسترخٍ وعينان في السقف والرأس مسنود على البنش في إعداد الاستلقاء على طول البنش. وكل تاريخ عدم استقرار كتفي يأخذ الإحالة القائمة: الطبيب أولًا، ونسخ الكيبل ذات الذراع المستقيمة بديلًا أهدأ.",
      },
    },
    faq: {
      en: [
        { q: "Pullover for chest or for lats?", a: "Both, and the grip decides the split: bent elbows — this page — keep the chest in the contract; straight arms hand the deal to the lats. The library records the same order on this row: chest first, back behind it." },
        { q: "Across the bench or along it?", a: "Across-bench drops the hips and lets the shoulders reach deeper — advanced and dramatic; along-bench supports the whole spine and suits most lifters. The arc is the same animal in both cages; pick the one your shoulders sleep well in." },
        { q: "My shoulders click at the bottom — is that a stop sign?", a: "A painless click at the arc's end is common and usually just tendons announcing the stretch. Pain, pinching, or apprehension — the shoulder's fear of falling deeper — is the stop sign: shorten the arc and let a clinician hear it once." },
      ],
      ar: [
        { q: "البول أوفر للصدر أم للظهر؟", a: "لكليهما، والقبضة تقرر التقسيم: المرفقان المثنيان — هذه الصفحة — يُبقيان الصدر داخل العقد؛ والذراعان المستقيمتان تسلمان الصفقة للظهرية. وتسجل المكتبة نفس الترتيب في هذا الصف: الصدر أولًا والظهر خلفه." },
        { q: "عبر البنش أم على طوله؟", a: "العرض عبر البنش يهبط بالوركين ويدع الكتفين يمدّان أعمق — متقدم ومسرحي؛ والطولي يسند العمود كله ويناسب أغلب الرفاع. القوس نفس الحيوان في القفصين؛ اختر الذي تنام فيه أكتافك جيدًا." },
        { q: "أكتافي تطرقع في القاع — هل هذه إشارة توقف؟", a: "طقطقة بلا ألم عند نهاية القوس شائعة وغالبًا مجرد أوتار تعلن المدّ. أما الألم أو الوخز أو التوجس — خوف الكتف من السقوط أعمق — فهو إشارة التوقف: قصّر القوس ودع طبيبًا يسمعها مرة." },
      ],
    },
    links: [
      { hrefEn: "/blog/4-day-split-hypertrophy-fat-loss", hrefAr: "/ar/blog/4-day-split-muscle-fat-loss-guide", labelEn: "4-day split — hypertrophy and fat loss", labelAr: "تقسيم أربعة أيام — تضخيم وخسارة دهون" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Push-pull-legs program", labelAr: "برنامج دفع وسحب وأرجل" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track the arc honestly", labelAr: "تتبع القوس بأمانة" },
    ],
  },

  "around-the-worlds": {
    intro: {
      en: "Around-the-worlds is the chest movement that refuses to press: lying on a flat bench with a light dumbbell in each hand, the arms sweep a full circle — from the hips, out wide, up overhead, and back — tracing the rim of a clock around the torso. The library files it under chest with shoulders assisting, and the level it assigns is intermediate, which is the exercise's honest confession: nothing about it is heavy, and everything about it is control. It is the rare movement that takes the shoulder through nearly its entire map while the chest loads the journey — a mobility drill wearing hypertrophy's clothes.",
      ar: "حول العالم هي حركة الصدر التي ترفض الدفع: مستلقيًا على بنش مستوٍ ودمبل خفيف في كل يد، تكنس الذراعان دائرة كاملة — من الوركين، خارجًا واسعًا، فوق الرأس، وعودة — ترسم حافة ساعة حول الجذع. تقيّد المكتبة الحركة تحت الصدر بمساعدة الكتفين، والمستوى الذي تمنحه متوسط، وهذا اعتراف الحركة الأمين: لا شيء فيها ثقيل، وكل شيء فيها سيطرة. إنها الحركة النادرة التي تأخذ الكتف عبر خريطته كلها تقريبًا بينما يحمل الصدر الرحلة — تمرين مرونة كامل المدى يرتدي ثياب التضخيم ويؤدي الوظيفتين معًا في اللفة الواحدة دون تنازل عن أي منهما.",
    },
    sections: {
      en: {
        muscles: "The chest works the long way around: the pectorals load as the arms travel the low arc past the hips, stretch as the circle widens at shoulder height, and finish contracting overhead where the upper fibers and the shoulders — the library's credited assistants — share the final territory. No pressing happens anywhere in the circle; the dumbbells never cross over the chest the way a flye closes. The deltoids steer the rim, the rotator cuff stewards the turns, and the chest pays the tolls along the entire route — small tolls, many times.",
        mistakes: [
          { error: "Loading dumbbells heavy enough to turn the circle into a struggle for survival.", fix: "The movement's weight class is 'light' with a capital L — the circle's size and speed are the loads that actually progress here." },
          { error: "Bending the elbows to shrink the circle as fatigue builds.", fix: "The arms stay long for the full rim — a folding elbow quietly shortens the arc and steals the stretch the movement exists to provide." },
          { error: "Rushing the circle until the dumbbells orbit on momentum.", fix: "The rim travels at one deliberate speed with a beat at the top and the bottom — around-the-worlds is a lap, not a spin cycle." },
          { error: "Arching the low back and heaving the hips to help the arms overhead.", fix: "The torso is the clock face and it stays flat against the bench; the arms go around it, never the other way with it." },
        ],
        alternatives: "The arc-and-stretch department of this library keeps several specialists. The bent-arm pullover page travels the overhead half of this circle with heavier iron and a shorter path; the flye family loads the front half; the face-pull and lateral-raise pages train the shoulders' steering that this movement borrows. Around-the-worlds keeps its seat for the full-rim job — nothing else in the library takes the shoulder around the whole clock under chest-backed load.",
        progression: "The dial is the circle itself: rim speed first (slow, with pauses at twelve and six o'clock), then rim diameter (wider arcs as the shoulders earn the reach), then dumbbell weight in the smallest increments the rack owns. Advanced lifters run it as a finisher — two slow laps to nowhere after the day's pressing — or as a warm-up drill that greases the entire shoulder map before heavier work arrives.",
        programming: "Two to three sets of eight to twelve slow laps, placed at a session's edges: as a shoulder-and-chest warm-up before pressing, or as the day's final pump when the compounds are done. It will never be the main course — the loads are too small and the ego too uninvolved — but as mobility under load it bookends a chest day better than almost anything. In a cut, it keeps the shoulders moving through their full map on days when heavy pressing is off the menu.",
        safety: "The shoulder's full map is exactly what this movement drives through — which is why the weight stays small and the circles stay deliberate. Overhead discomfort at twelve o'clock shrinks the rim rather than the exercise: stop the arc at the top of the comfortable range and let it grow. The low back stays pinned to the bench with ribs down throughout, and any history of shoulder impingement gets the standing referral before the first lap.",
      },
      ar: {
        muscles: "يعمل الصدر من الطريق الطويل: تحمل الصدرية بينما تسافر الذراعان القوس المنخفض عند الوركين، وتمتد مع اتساع الدائرة عند ارتفاع الكتف، وتختم منقبضة فوق الرأس حيث تتقاسم الألياف العلوية والكتفان — المساعدان المسجلان — الإقليم الأخير. لا كبسة تحدث في أي مكان من الدائرة؛ فالدمبلان لا تعبران فوق الصدر كما تُغلق تفتيحة. الدالية تقود الحافة والكفة المدورة ترعى المنعطفات، والصدر يدفع الرسوم عبر المسار كله — رسوم صغيرة مرات كثيرة.",
        mistakes: [
          { error: "تحميل دمبلات بثقل يحول الدائرة إلى صراع بقاء.", fix: "فئة وزن الحركة «خفيف» بحرف كبير — حجم الدائرة وسرعتها هما الحملان اللذان يتقدمان هنا فعلًا." },
          { error: "ثني المرفقين لتقليص الدائرة مع تراكم الإنهاك.", fix: "تبقى الذراعان طويلتين للحافة الكاملة — فالمرفق المنطوي يقصّر القوس خلسةً ويسرق المدّ الذي وُجدت الحركة لتقديمه." },
          { error: "استعجال الدائرة حتى تدور الدمبلات بالزخم.", fix: "تسافر الحافة بسرعة واحدة متعمدة بنبضة عند القمة والقاع — حول العالم لفة لا دورة غسيل." },
          { error: "تقويس أسفل الظهر ورفع الوركين لمعاونة الذراعين فوق الرأس.", fix: "الجذع هو وجه الساعة ويظل مسطحًا على البنش؛ الذراعان تدوران حوله، ولا العكس معه أبدًا." },
        ],
        alternatives: "قسم القوس والمد في هذه المكتبة يحتفظ بعدة متخصصين. صفحة البول أوفر بالمرفق المثني تسافر النصف العلوي من هذه الدائرة بحديد أثقل ومسار أقصر، وعائلة التفتيح تحمل النصف الأمامي، وصفحتا سحب الوجه والرفرفة الجانبية تدرّبان توجيه الكتفين الذي تقترضه الحركة. وتحتفظ حول العالم بمقعدها لوظيفة الحافة الكاملة — فلا شيء آخر في المكتبة يأخذ الكتف حول الساعة كلها تحت حمل صدري.",
        progression: "القرص هو الدائرة نفسها: سرعة الحافة أولًا (بطيئة مع توقفات عند الثانية عشرة والسادسة)، ثم قطرها (أقواس أوسع كلما استحقت الأكتاف المدّ)، ثم وزن الدمبل بأصغر زيادات يملكها الرف. ويديرها المتقدمون كخاتمة — لفتان بطيئتان إلى لا مكان بعد دفع اليوم — أو كتدريب إحماء يشحم خريطة الكتف كلها قبل وصول العمل الأثقل.",
        programming: "جلستان إلى ثلاث من ثماني إلى اثنتي عشرة لفة بطيئة، توضع عند حافتي الجلسة: إحماء كتف وصدر قبل الدفع، أو ضخّة اليوم الأخيرة حين تنتهي المركبات. لن تكون الطبق الرئيسي أبدًا — الأحمال أصغر من ذلك والأنا غير مدعوة — لكنها بوصفها مرونة تحت حمل تؤطر يوم الصدر أفضل من أي شيء تقريبًا. وفي التنشيف تُبقي الأكتاف تتحرك عبر خريطتها الكاملة في الأيام التي يُشطب فيها الدفع الثقيل من القائمة، فتصبح الحركة بديلًا ذكيًا يحفظ المدى ولا يستنزف التعافي الشحيح أصلًا.",
        safety: "خريطة الكتف الكاملة هي بالضبط ما تقود الحركة عبرها — ولهذا يبقى الوزن صغيرًا والدوائر متعمدة. انزعاج فوق الرأس عند الثانية عشرة يقلّص الحافة لا التمرين: أوقف القوس عند أعلى المدى المريح ودعه ينمو. ويظل أسفل الظهر مثبتًا على البنش والأضلاع مسحوبة طوال الوقت، وكل تاريخ انحشاء كتفي يأخذ الإحالة القائمة قبل اللفة الأولى.",
      },
    },
    faq: {
      en: [
        { q: "What does around-the-worlds actually train?", a: "The chest through a long loaded stretch and the shoulders through nearly their whole map — as mobility work wearing hypertrophy's clothes. It will not add kilos to your bench; it will keep the machinery that benches move with oiled and honest." },
        { q: "How heavy should the dumbbells be?", a: "Light enough that the circle's shape never negotiates — for most lifters that is a pair they would laugh at for pressing. The day the rim speed and the pauses progress, the weight may join the program; not before." },
        { q: "Why is it called around-the-worlds?", a: "Because each rep is a full orbit — hips to overhead and back — the arms tracing the world's rim around the torso's clock face. The name is the instructions." },
      ],
      ar: [
        { q: "ما الذي تدرّبه حول العالم فعلًا؟", a: "الصدر عبر مدّ طويل محمل والأكتاف عبر خريطتها كلها تقريبًا — عمل مرونة يرتدي ثياب التضخيم. لن تضيف كيلوغرامات لبنشك؛ ستحفظ الآلة التي يتحرك بها البنش مشحومة وأمينة وسلسة الحركة على مدى أشهر التدريب المتعاقبة." },
        { q: "ما ثقل الدمبلات المناسب؟", a: "خفيفة بما يكفي ألا تتفاوض شكل الدائرة أبدًا — ولدى أغلب الرفاع زوج يضحكون منه للدفع. في اليوم الذي تتقدم فيه سرعة الحافة والتوقفات قد ينضم الوزن للبرنامج؛ وليس قبله." },
        { q: "لماذا اسمها حول العالم؟", a: "لأن كل تكرار مدار كامل — من الوركين إلى فوق الرأس وعودة — والذراعان ترسمان حافة العالم حول وجه ساعة الجذع. الاسم هو التعليمات." },
      ],
    },
    links: [
      { hrefEn: "/blog/warm-up-before-lifting-5min-routine", hrefAr: "/ar/blog/best-dynamic-stretching-before-gym", labelEn: "Warm-up routines before lifting", labelAr: "روتين الإحماء قبل الرفع" },
      { hrefEn: "/programs/home-dumbbell-ppl", hrefAr: "/ar/programs/home-dumbbell-ppl", labelEn: "Dumbbell push-pull-legs program", labelAr: "برنامج دمبل دفع وسحب وأرجل" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log the laps too", labelAr: "سجّل اللفات أيضًا" },
    ],
  },
};
