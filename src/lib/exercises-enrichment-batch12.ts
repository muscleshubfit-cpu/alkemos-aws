/**
 * EXERCISES-ENRICHMENT — BATCH 12 (tail batch 1, exercises 56-60 of the
 * enrichment program; SEO-GROWTH plan Phase 3 — owner order 2026-11-06).
 *
 * The core half's second file: the reverse-crunch pair (decline + cable),
 * the stability-ball cable twist, the loaded-barbell rollout, and the
 * bicycle floor movement. Every quoted fact (the 90-degree start, the
 * quarter-turn spec, the hips-high rollout cue) comes from the exercise's
 * own instruction rows in src/lib/exercises.ts.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_12: Record<string, ExerciseEnrichment> = {
  "decline-reverse-crunch": {
    intro: {
      en: "Flip the crunch's direction and the decline bench becomes a different machine. Lying head-up on the slope, arms hugging the top of the bench, you draw the knees toward the torso while the pelvis rolls back and the hips lift clear of the pad — the library's own sequence for the movement, ending in a contraction that brings the knees to the chest before a slow, counted return. The reverse family trains the same lower-fiber territory as the lying leg raise, but the decline's grip gives the torso an anchor the flat bench never had, letting the pelvis curl harder without the lower back buying the ticket.",
      ar: "اعكس اتجاه الكرانش يتحول البنش المائل إلى آلة أخرى. مستلقيًا برأسك نحو أعلى المنحدر وذراعيك تعانقان أعلى البنش، تشدّ الركبتين نحو الجذع بينما يتدحرج الحوض للخلف وترتفع الوركان عن اللوح بوضوح — هذا تسلسل المكتبة نفسه للحركة، ويُختم بانقباض يوصل الركبتين إلى الصدر قبل عودة بطيئة معدودة. تع درب عائلة الكرانش العكسي نفس أرضية الألياف السفلية التي تخدمها رفعة الرجلين، لكن قبضة المائل تمنح الجذع مرساةً لم تملكها الأرضية أبدًا، فتلتف الحوض أقوى دون أن يدفع أسفل الظهر التذكرة.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis pulls the pelvis toward the ribcage — the library lists it alone, and the grip makes that isolation real. Because the hands hug the bench's crown, the lats and arms become scaffolding instead of movers: the knees travel, the hips peel off the pad, and the tailbone-led curl is pure lower-abdominal work. The obliques stabilize the twist out of the path; the hip flexors act only as cables connecting the legs to the curling pelvis, which is the honest division of labor the reverse family exists to enforce.",
        mistakes: [
          { error: "Swinging the knees toward the face with the pelvis glued flat to the bench.", fix: "The rep begins when the hips tip backward — lead with the tailbone and let the knees simply follow the pelvis up the curl." },
          { error: "Letting the body slide down the decline between reps.", fix: "Hug the bench top hard for the whole set as the setup step warns; losing the anchor mid-set turns the movement into a grip exercise with scenery." },
          { error: "Dropping the hips from the top and bouncing into the next rep.", fix: "One second in the contracted position the page prescribes, then a two-count descent — the decline's stretch under control is the payload, not an obstacle." },
          { error: "Knees chopping open and shut with every rep.", fix: "Keep the knees and feet glued together as the steps instruct; a quiet knee line keeps the curl symmetric and the obliques from staging a takeover." },
        ],
        alternatives: "The reverse-crush family tree is well stocked in this library. The flat-bench lying leg raise runs the same pelvic curl with straight legs and no angle; the cable reverse crunch adds a stack's resistance to the identical arc; the bent-knee hip raise is the floor's gentler cousin; and the hanging leg raise waits at the family's ceiling for when the decline runs out of challenge. Each rung keeps the pelvis-curl job and re-prices the lever — pick by equipment and by how much curl your spine tolerates.",
        progression: "Start with the shallow end of the bench: small hip tips, knees bent, feet together, the whole set owned before the angle deepens. Progress by steepening the bench one notch at a time, then by slowing the descent to a three-count, then by pausing longer at the knees-to-chest contraction. When the steepest notch feels like a rumor, straighten the legs a few degrees per week or move the movement to the hanging bar, where gravity renegotiates everything.",
        programming: "Three to four sets of ten to fifteen controlled curls, twice a week in the trunk block after the main work — the same slot the whole core family shares. Pair it with a top-down flexion movement (any crunch on these pages) so the rectus abdominis trains from both ends of its length. During a cut it preserves the lower shelf while the deficit — counted in our tools — removes the cover; during a mass phase it keeps the pelvis honest under squats and pulls.",
        safety: "The neck is a passenger here — keep it neutral and let the arms hold the bench, never the cervical spine haul the body up the slope. The watch-point is the lumbar spine at the bottom of the return: the hips should settle onto the pad before the next curl, not hover in an arch. Any disc history keeps its standing appointment with a clinician before loaded flexion; the dead bug remains the household substitute.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تشدّ الحوض نحو القفص الصدري — والمكتبة تسجلها وحدها، والقبضة تجعل هذا العزل حقيقيًا. فبسبب تعانق اليدين قمة البنش تصبح العضلات الظهرية والذراعان سقالة لا محركات: تسافر الركبتان وتتقشر الوركان عن اللوح، واللفة التي يقودها العصعص عمل بطني سفلي نقي. المائلتان تثبتان الدوران خارج المسار؛ وعضلات ثني الورك تعمل أسلاكًا تصل الرجلين بالحوض الملتف فحسب، وهذا التقسيم الأمين للعمل الذي وُجدت العائلة العكسية لفرضه.",
        mistakes: [
          { error: "تأرجح الركبتين نحو الوجه والحوض ملزوق مسطحًا بالبنش.", fix: "يبدأ التكرار حين يميل الحوض للخلف — قد بالعصعص ودع الركبتين تتبعان الحوض صاعدتين في اللفة ببساطة." },
          { error: "ترك الجسم ينزلق أسفل المائل بين التكرارات.", fix: "عانق قمة البنش بقوة طوال المجموعة كما تحذر خطوة الإعداد؛ فقدان المرساة وسط المجموعة يحول الحركة إلى تمرين قبضة بمنظر." },
          { error: "إسقاط الوركين من القمة والارتداد إلى التكرار التالي.", fix: "ثانية في وضع الانقباض الذي تصفه الصفحة، ثم نزول في عدّتين — مد المائل تحت السيطرة هو الحمولة لا العقبة." },
          { error: "فتح الركبتين وغلقهما مع كل تكرار.", fix: "ألصق الركبتين والقدمين معًا كما تأمر الخطوات؛ خط ركبة هادئ يبقي اللفة متناظرة ويمنع المائلتين من انقلاب." },
        ],
        alternatives: "شجرة عائلة الكرانش العكسي مخزنة جيدًا في هذه المكتبة. رفعة الرجلين على البنش المستوي تدير نفس لفة الحوض برجلين مستقيمتين بلا زاوية، والكرانش العكسي بالكيبل يضيف مقاومة رَكن لنفس القوس، ورفع الحوض بالركبة المثنية ابن عم الأرض الألطف، ورفعة الرجلين المعلقة تنتظر عند سقف العائلة حين ينفد تحدي المائل. كل درجة تحفظ وظيفة لفة الحوض ويعيد تسعير الرافعة — فاختر بالعتاد وبمقدار ما يتحمله عمودك من لف.",
        progression: "ابدأ من الطرف الضحل للبنش: ميلات ورك صغيرة وركبتان مثنيتان وقدمان متلاصقتان، وامتلاك المجموعة كاملة قبل أن يتعمق الميل. تقدم بتعميق البنش درجة كل مرة، ثم بإبطاء النزول إلى ثلاث عدّات، ثم بإطالة التثبيت عند انقباض الركبتين إلى الصدر. وحين تصير أشد الدرجات إشاعة، مدّ الرجلين بضع درجات أسبوعيًا أو انقل الحركة إلى العارضة المعلقة حيث تعيد الجاذبية التفاوض على كل شيء.",
        programming: "ثلاث إلى أربع مجموعات من عشرة إلى خمسة عشر لفة متحكمة، مرتين أسبوعيًا في كتلة الجذع بعد العمل الرئيسي — نفس الشاغر الذي تتقاسمه عائلة الجذع كلها. اقترنها بحركة ثني من الأعلى (أي كرانش بهذه الصفحات) لتتدرب المستقيمة البطنية من طرفي طولها. وفي التنشيف تحفظ الرفّ السفلي بينما يرفع العجز — المعدود بأدواتنا — الغطاء؛ وفي مرحلة الكتلة تُبقي الحوض أمينًا تحت السكوات والسحب.",
        safety: "الرقبة راكب هنا — أبقها محايدة ودعي الذراعين تحملان البنش، ولا تدع العمود العنقي يجذب الجسم صاعدًا المنحدر أبدًا. ونقطة المراقبة هي القطني في قاع العودة: يجب أن يستقر الحوض على اللوح قبل اللفة التالية لا أن يعلو مقوسًا. وأي تاريخ غضروفي يحتفظ بموعده القائم مع طبيب قبل الثني المثقل؛ وتبقى الحشرة الميتة بديل البيت.",
      },
    },
    faq: {
      en: [
        { q: "Reverse crunch on a decline — why not just flat on the floor?", a: "The floor version is the family's entry door and a fine one. The decline adds two things the floor cannot: a pre-stretched starting position and gravity pulling against the pelvic curl, which lets the movement grow with you notch by notch instead of topping out at bodyweight." },
        { q: "Should my knees touch my chest?", a: "The library's sequence ends that way at the top of the curl — knees travel toward the torso until the contraction peaks. If the knees arrive without the hips having rolled off the pad, shorten the swing and re-lead with the pelvis; the touch is a byproduct of the curl, not the rep itself." },
        { q: "How is this different from the decline sit-up?", a: "Direction of travel. The sit-up curls the ribcage down toward a fixed pelvis; the reverse crunch curls the pelvis up toward a fixed ribcage. Same muscle, opposite end of the sheet — the strongest programs book both directions in the same block." },
      ],
      ar: [
        { q: "كرانش عكسي على المائل — لماذا لا الأرض المستوية؟", a: "نسخة الأرض باب العائلة وباب جيد. المائل يضيف ما لا تقدر عليه الأرض: وضع بداية ممدود مسبقًا وجاذبية تسحب ضد لفة الحوض، فينمو التمرين معك درجة بعد درجة بدل أن يتوقف عند وزن الجسم." },
        { q: "هل يجب أن تلامس الركبتان الصدر؟", a: "تسلسل المكتبة يُختم هكذا في قمة اللفة — تسافر الركبتان نحو الجذع حتى يبلغ الانقباض ذروته. وإن وصلت الركبتان دون أن يكون الحوض قد تدحرج عن اللوح فقصّر التأرجح وقد بالحوض من جديد؛ اللمسة ناتج جانبي للفة لا التكرار نفسه." },
        { q: "ما الفرق بينه وبين الجلوس المائل؟", a: "اتجاه السفر. الجلوس يلف القفص الصدري نازلًا نحو حوض ثابت؛ والعكسي يلف الحوض صاعدًا نحو قفص ثابت. نفس العضلة من الطرف المقابل للصفحة — وأقوى البرامج تحجز الاتجاهين في الكتلة نفسها." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/blog/deload-week-rest-training-guide", hrefAr: "/ar/blog/optimal-rest-periods-resistance-training", labelEn: "Deload week — the rest that restores", labelAr: "فترات راحة تناسب العمل" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Free workout tracker", labelAr: "متتبع التمارين المجاني" },
    ],
  },

  "cable-reverse-crunch": {
    intro: {
      en: "Anchor the pelvis to a stack and the reverse crunch learns arithmetic. The library's setup runs a strap from the low pulley to the body, a mat on the floor in front of it, legs raised to a ninety-degree start with the cable running parallel to the thighs — and from there the movement is pure pelvis work: knees drive toward the torso, the hips peel off the floor, a held contraction, then a controlled return that the stack resists every centimeter of. This is the floor reverse crunch with a meter attached, for the lifter who wants the lower-fiber curl to progress past what bodyweight and gravity are willing to negotiate.",
      ar: "اربط الحوض برَكن أوزان يتعلم الكرانش العكسي الحساب. إعداد المكتبة يمدّ حزامًا من البكرة السفلية إلى الجسم، وبساطًا على الأرض أمامها، ورجلين مرفوعتين إلى بداية تسعين درجة والكيبل موازٍ للفخذين — ومن هناك تصبح الحركة عمل حوض خالصًا: تقود الركبتان نحو الجذع، وتتقشر الوركان عن الأرض، وانقباض مثبت، ثم عودة متحكمة يقاومها الرَكن كل سنتيمتر. هذا هو الكرانش العكسي الأرضي بعدلاد قياس، لمن يريد لفة الألياف السفلية أن تتقدم على ما يقبل وزنُ الجسم والجاذبية التفاوض عليه.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis curls the pelvis toward the ribs — solo, as the library records it — and the cable's line turns that curl into measurable work. With the thighs held at ninety degrees and the strap's pull running parallel to them, the hip flexors are neutralized as prime movers: they hold the angle, while the abs perform the rollback that lifts the hips off the mat. Every pin on the stack prices the same contraction the floor version gives away for free, which is the entire point of bolting this movement to a machine.",
        mistakes: [
          { error: "Using the legs to swing the stack while the pelvis stays parked on the mat.", fix: "The legs are passengers holding the ninety-degree angle — initiate with the tailbone rollback and let the stack follow the pelvis, not the thighs." },
          { error: "Letting the cable's pull yank the hips open at the return's end.", fix: "Stop the negative just before the lower back arches; the last few centimeters are the abs' job to control, and that is where the rep is actually won." },
          { error: "Setting the pulley so the line drags across the legs instead of running parallel.", fix: "Re-seat on the mat until thighs and cable share one plane, as the setup step instructs — a skewed line turns the curl into a tug of war with your own setup." },
          { error: "Bouncing reps off the stretched bottom.", fix: "A one-count pause at full curl, a two-count return; the strap makes cheating obvious, which is exactly why honest lifters keep it in the program." },
        ],
        alternatives: "The library holds the whole reverse family at different prices. The decline reverse crunch offers gravity's angle with a bench grip; the floor bent-knee version is the free starter; the flat-bench lying leg raise runs the straight-leg variant without equipment; and the hanging leg raise sells the same curl at the family's premium. The cable model's niche is precise, repeatable loading — nothing else in the family lets you add exactly two and a half kilos to a pelvic curl.",
        progression: "Begin with the pin set light enough that fifteen curls finish with the tailbone still leading each one. Progress by the pin in small steps while the form holds, and by tempo once the stack runs out of patience — three-count negatives, two-second holds at the top of the rollback. The advanced branch pairs this movement with its decline sibling in alternating sessions, loading the same fibers from two angles across the week.",
        programming: "Three sets of ten to fifteen curls with the pause intact, twice weekly in the trunk block. The stack invites double progression: earn the top of the rep range, then raise the pin and rebuild — the same arithmetic the machine crunch runs, aimed at the other end of the muscle. In a cutting phase the cable keeps the lower fibers under honest load while the deficit, sized by the macro calculator, handles visibility.",
        safety: "The strap and the spine share the caution list. The strap sits snug — a loose cuff under load becomes a projectile; check it between sets as part of the rest. The lumbar spine stays flat on the mat through the return: if the cable's pull arches it, the pin is too heavy or the pulley is set wrong. Disc histories keep the standing rule across the whole curl family — clinician first, dead bug in the meantime.",
      },
      ar: {
        muscles: "العضلة المستقيمة البطنية تلف الحوض نحو الأضلاع — منفردة كما تسجلها المكتبة — وخط الكيبل يحوّل تلك اللفة إلى عمل قابل للقياس. فمع تثبيت الفخذين على تسعين درجة وسحب الحزام موازيًا لهما تُحيَّد عضلات ثني الورك كمحركات: تحفظ الزاوية، بينما تنجز البطن التدحرج الذي يرفع الوركين عن البساط. كل مسمار على الرَكن يسعّر نفس الانقباض الذي تمنحه النسخة الأرضية مجانًا، وهذا كمعنى تثبيت هذه الحركة على آلة.",
        mistakes: [
          { error: "استخدام الرجلين لتأرجح الرَكن بينما الحوض رابض على البساط.", fix: "الرجلان راكبتان تحفظان زاوية التسعين — ابدأ بتدحرج العصعص ودع الرَكن يتبع الحوض لا الفخذين." },
          { error: "ترك سحب الكيبل يخطف الوركين مفتوحين في نهاية العودة.", fix: "أوقف النزول قبل أن يتقوس أسفل الظهر مباشرة؛ السنتيمترات الأخيرة عمل البطن أن تسيطر عليها، وهناك تُربح اللفة فعلًا." },
          { error: "ضبط البكرة بحيث يجرّ الخط عبر الرجلين بدل موازاتها.", fix: "أعد الجلوس على البساط حتى يتشارك الفخذان والكيبل مستوى واحدًا كما تأمر خطوة الإعداد — الخط المائل يحول اللفة إلى شدّ حبل مع إعدادك أنت." },
          { error: "ارتداد التكرارات من القاع الممدود.", fix: "توقف لعدة واحدة عند اكتمال اللفة، وعودة في عدّتين؛ الحزام يجعل الغش مكشوفًا، ولهذا بالضبط يُبقيه الأمينون في البرنامج." },
        ],
        alternatives: "تحتفظ المكتبة بالعائلة العكسية كاملة بأسعار مختلفة. الكرانش العكسي المائل يقدم زاوية الجاذبية بقبضة بنش، والأرضي بالركبة المثنية بداية مجانية، ورفعة الرجلين على البنش المستوي تدير النسخة مستقيمة الرجلين بلا عتاد، ورفعة الرجلين المعلقة تبيع نفس اللفة بسعر العائلة المميز. ومقعد نسخة الكيبل هو التحميل الدقيق المتكرر — لا شيء آخر في العائلة يتيح إضافة اثنين ونصف كيلوغرام بالضبط إلى لفة حوض.",
        progression: "ابدأ بمسمار خفيف بما يكفي لتنتهي خمس عشرة لفة والعصعص ما زال يقود كل واحدة. تقدم بالمسمار خطوات صغيرة ما دام الأداء صامدًا، وبالإيقاع حين ينفد صبر الرَكن — نزلات بثلاث عدّات وتثبيت لثانيتين في قمة التدحرج. والفرع المتقدم يقارن هذه الحركة بأختها المائل في جلسات متناوبة، محملًا نفس الألياف السفلية من زاويتين مختلفتين عبر الأسبوع، فيتعلم الجذع اللفة من كل اتجاهاتها الممكنة.",
        programming: "ثلاث مجموعات من عشرة إلى خمسة عشر لفة والتوقف سليم، مرتين أسبوعيًا في كتلة الجذع. يدعوك الرَكن إلى التدرج المزدوج: استحق أعلى نطاق التكرارات ثم ارفع المسمار وأعد البناء — نفس حساب كرانش الجهاز موجهًا إلى الطرف الآخر من العضلة. وفي التنشيف يبقي الكيبل الألياف السفلية تحت حمل أمين بينما يتولى العجز، مضبوطًا بحاسبة الماكروز، شؤون الظهور.",
        safety: "الحزام والعمود يتقاسمان قائمة الحذر. يجلس الحزام محكمًا — رباط فضفاض تحت الحمل يصير قذيفة؛ افحصه بين المجموعات كجزء من الراحة. ويبقى القطني مسطحًا على البساط طوال العودة: إن أقوسه سحب الكيبل فالمسمار أثقل من اللازم أو البكرة في غير وضعها. وتواريخ الغضروف تحفظ القاعدة القائمة عبر عائلة اللف كلها — الطبيب أولًا، والحشرة الميتة في الأثناء.",
      },
    },
    faq: {
      en: [
        { q: "Where exactly does the strap go?", a: "Follow the library's setup: the strap anchors to the low pulley and the body, with the mat placed so the raised legs and the cable run parallel at the ninety-degree start — the geometry on the page is the difference between a pelvis curl and a leg fight with a machine." },
        { q: "Why a cable reverse crunch instead of the floor version?", a: "Progression. The floor rep costs bodyweight and no more; the stack lets the same pelvic curl be loaded in steps your notebook can follow. Lifters who outgrow the floor usually skip straight to decline or hanging — the cable is the middle rung that keeps the curl exact." },
        { q: "Can this replace regular crunches?", a: "It replaces the half of the job crunches miss. The reverse curl loads the pelvis-to-ribs direction while crunches own the ribs-to-pelvis one — run both in the same block and the muscle trains its full length, which every core program in this library takes advantage of." },
      ],
      ar: [
        { q: "أين يوضع الحزام بالضبط؟", a: "اتبع إعداد المكتبة: يرتبط الحزام بالبكرة السفلية وبالجسم، ويوضع البساط بحيث تجري الرجلان المرفوعتان والكيبل بالتوازي عند بداية التسعين درجة — هندسة الصفحة هي الفرق بين لفة حوض ومصارعة أرجل مع آلة." },
        { q: "لماذا العكسي بالكيبل بدل الأرضي؟", a: "التدرج. التكرار الأرضي يكلف وزن الجسم لا أكثر؛ والرَكن يتيح تحميل نفس لفة الحوض بخطوات يتتبعها دفترك. ومن تجاوز الأرض يقفزون عادة إلى المائل أو المعلق — والكيبل هو الدرجة الوسطى التي تحفظ اللفة دقيقة." },
        { q: "هل يعوض الكرانشات العادية؟", a: "يعوض نصف الوظيفة التي تفوتها الكرانشات. اللفة العكسية تحمل اتجاه الحوض-نحو-الأضلاع بينما تملك الكرانشات اتجاه الأضلاع-نحو-الحوض — شغّل الاتجاهين في الكتلة نفسها فتتدرب العضلة كامل طولها، وهو ما تستثمره كل برامج الجذع في هذه المكتبة." },
      ],
    },
    links: [
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Intermediate push-pull-legs program", labelAr: "برنامج دفع وسحب وأرجل للمتوسطين" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "Fixing training frequency", labelAr: "إصلاح تكرار التدريب" },
      { hrefEn: "/tools/macro-calculator", hrefAr: "/ar/tools/macro-calculator", labelEn: "Macro calculator", labelAr: "حاسبة الماكروز" },
    ],
  },

  "cable-russian-twists": {
    intro: {
      en: "Lie shoulder-blades on a stability ball, body perpendicular to a mid-height cable, arms extended over the chest on the pulley's line — and rotate the torso a quarter turn away from the stack, hips held high, abs braced, lateral tension still whispering at the rest position. That is the library's version of the Russian twist, and it is a different animal from the seated floor original: the ball frees the spine to rotate while the cable resists it through the exact arc the movement is named for. The obliques finally get a loaded, honest job — turning the ribcage against a pull instead of waving a weight from side to side.",
      ar: "استلقِ بلوحتي كتفيك على كرة استقرار، وجسمك عمودي على كيبل بارتفاع متوسط، وذراعاك ممدودتان فوق الصدر على خط البكرة — ثم أدر الجذع ربع دورة بعيدًا عن الرَكن، والوركان مرفوعتان والبطن مشدودة وشدٌّ جانبي ما زال يهمس عند وضع الراحة. هذه نسخة المكتبة من اللف الروسي، وهي كائن مختلف عن الأصلية الأرضية الجالسة: الكرة تحرر العمود ليدور بينما يقاومه الكيبل عبر القوس نفسه الذي تحمل الحركة اسمه. المائلتان تنالان أخيرًا عملًا محملًا أمينًا — تدوير القفص الصدري ضد سحب مقاوم بدل تلويح وزن يمينًا ويسارًا على الأرض، وهي فروق تصنع عضلات مختلفة لا مجرد زوايا مختلفة للتمرين نفسه.",
    },
    sections: {
      en: {
        muscles: "The obliques own this movement's story even though the library files it under the abs' name — rotation is their signature job. As the ribcage turns away from the pulley, the far-side obliques shorten against the cable's pull while the near-side ones brake the arc; the rectus abdominis braces the whole drum so the spine rotates rather than folds, and the glutes and hamstrings hold the bridge that keeps the shoulders rolling on the ball instead of sliding off it. It is a chain from knees to shoulders, steered by the turning ribcage.",
        mistakes: [
          { error: "Pushing the handle with the arms instead of turning the ribcage.", fix: "The arms are a rigid frame extended from the chest — rotate the torso and the handle travels; if the shoulders do the work, the obliques are just an audience." },
          { error: "Letting the hips sag toward the floor mid-set.", fix: "Hips high is a standing order in the steps; the bridge is what makes the ball a pivot instead of a hammock." },
          { error: "Rotating the head and shoulders only, leaving the ribcage behind.", fix: "Lead with the breastbone — a quarter turn of the torso means the ribs travel with it, which is the movement's entire range as the page defines it." },
          { error: "Sitting fully upright and turning into a seated twist.", fix: "Shoulder blades stay on the ball with the body straight, as the setup builds it; the perpendicular lying angle is what loads the obliques against the cable's line." },
        ],
        alternatives: "The rotation shelf in this library has several levels. The classic floor Russian twist trains the same turn with bodyweight and momentum; the plank family trains the obliques' other job — resisting rotation; the cable woodchop pattern runs the diagonal version of the same pull. For lifters whose ball setup never feels stable, the seated floor page is the honest retreat, and the standing cable column is the progressive upgrade once the quarter turn is strong.",
        progression: "The first progression is the ball itself — owning the bridge and the perpendicular line at the lightest pin on the stack. From there, load rises in small steps while the quarter turn stays a torso event; then tempo work enters, with a two-count pause at full rotation. The advanced lifter runs both sides in strict alternation and finishes blocks with the woodchop family, loading the same obliques through a longer diagonal arc.",
        programming: "Two to three sets of eight to twelve turns per side, twice a week inside the trunk block — rotation is a low-rep discipline compared to flexion, because the arc is shorter and the honest loads heavier. Pair it with an anti-rotation hold (any plank on these pages) so the obliques learn both halves of their job description. On a cut, keep the load and the turn quality; the waistline is a deficit matter, and the calculators handle it.",
        safety: "The ball is the watch item: shoulders roll, they do not bounce, and the feet stand wide enough that the bridge cannot tip sideways under the cable's pull. The lumbar spine stays long — rotation happens at the ribcage and upper back, never as a twist of the low back under load. Any disc history or shoulder instability takes the usual route: clinician's clearance, and the floor twist or plank as the standing substitute.",
      },
      ar: {
        muscles: "المائلتان تملكان قصة هذه الحركة رغم أن المكتبة تقيدها باسم البطن — فالدوران توقيعهما الوظيفي. فبينما يستدير القفص الصدري بعيدًا عن البكرة تقصر المائلة البعيدة ضد سحب الكيبل بينما تكبح القريبة القوس؛ والمستقيمة البطنية تشدّ الطبل كله ليدور العمود بدل أن ينطوي، والألويتان والمأبضيان يحملان الجسر الذي يُبقي الكتفين تتدحرجان على الكرة بدل الانزلاق عنها. إنها سلسلة من الركبتين إلى الكتفين يقودها القفص الصدري الدوار.",
        mistakes: [
          { error: "دفع المقبض بالذراعين بدل تدوير القفص الصدري.", fix: "الذراعان إطار صلب ممتد من الصدر — أدر الجذع ليسافر المقبض؛ وإن أنجز الكتفان العمل فالمائلتان مجرد جمهور." },
          { error: "ترك الوركين يهبطان نحو الأرض وسط المجموعة.", fix: "الوركان مرتفعان أمر دائم في الخطوات؛ الجسر هو ما يجعل الكرة محورًا لا أرجوحة." },
          { error: "تدوير الرأس والكتفين فقط وترك القفص خلفًا.", fix: "قد بعظمة القص — ربع دورة للجذع تعني سفر الأضلاع معه، وهو نطاق الحركة كله كما تحدده الصفحة." },
          { error: "الجلوس منتصبًا تمامًا والتحول إلى لفة جالسة.", fix: "تبقى لوحتا الكتف على الكرة والجسم مستقيم كما يبنيه الإعداد؛ الزاوية المستلقية العمودية هي ما يحمل المائلتين ضد خط الكيبل." },
        ],
        alternatives: "رف الدوران في هذه المكتبة ذو درجات عدة. اللف الروسي الأرضي الكلاسيكي يدرّب نفس الدورة بوزن الجسم والزخم، وعائلة البلانك تدرّب الوظيفة الأخرى للمائلتين — مقاومة الدوران، ونمط قطع الحطب بالكيبل يدير النسخة القطرية لنفس السحب. ولمن لا يستقر إعداد الكرة عندهم أبدًا، صفحة الأرضية الجالسة انسحاب أمين، وعمود الكيبل الواقف ترقية تقدمية حين تقوى ربع الدورة.",
        progression: "الترقية الأولى هي الكرة نفسها — امتلاك الجسر والخط العمودي عند أخف مسمار على الرَكن. ومن هناك يرتفع الحمل بخطوات صغيرة ما دامت ربع الدورة حدثًا جذعيًا؛ ثم يدخل عمل الإيقاع بتوقف عدّتين عند اكتمال الدوران. ويشغل المتقدم الجانبين بتبادل صارم ويختم الكتل بعائلة قطع الحطب، محملًا نفس المائلتين عبر قوس قطري أطول.",
        programming: "جلستان إلى ثلاث من ثماني إلى اثنتي عشرة دورة لكل جانب، مرتين أسبوعيًا داخل كتلة الجذع — الدوران انضباط تكرارات منخفض مقارنة بالثني لأن القوس أقصر والأحمال الأمينة أثقل. اقترنها بتثبيت مضاد للدوران (أي بلانك بهذه الصفحات) لتتعلم المائلتان نصفي وصفهما الوظيفي. وفي التنشيف احفظ الحمل وجودة الدوران معًا؛ فالخصر مسألة عجز حسابي لا تمرين، وحاسبات الموقع تتولى العجز وتترك لربع الدورة أن تبني العضلة التي سيكشفها.",
        safety: "الكرة هي بند المراقبة: الكتفان تتدحرجان ولا تقفزان، والقدمان تقفان باتساع يمنع الجسر من الانقلاب جانبًا تحت سحب الكيبل. ويبقى القطني ممدودًا — الدوران يحدث عند القفص والظهر الأعلى، ولا يحدث أبدًا كليّ للأسفل تحت الحمل. وأي تاريخ غضروفي أو عدم استقرار كتف يسلك الطريق المعتاد: إجازة الطبيب، واللف الأرضي أو البلانك بديلًا قائمًا.",
      },
    },
    faq: {
      en: [
        { q: "Why is this Russian twist done on a ball?", a: "Because the ball lets the shoulder line rotate freely while the hips stay bridged — the floor seated version pins the pelvis and hands the work to momentum. The cable adds the other half: resistance through the turn instead of only at its end." },
        { q: "My shoulders ache more than my obliques — what is wrong?", a: "The arms are pressing instead of hanging. Think of the handle as welded to the sternum: the torso turns, the arms carry the cable's line, and the shoulders merely hold position. Drop the pin until the turn is honest again." },
        { q: "Is rotation training safe for the spine?", a: "Rotating the ribcage over a braced, neutral lower back is a normal, trained capacity — that is precisely what this page coaches. What spines dislike is fast, loaded end-range twisting from the lumbar itself; the quarter-turn spec and the hips-high cue exist to keep the movement out of that territory." },
      ],
      ar: [
        { q: "لماذا يؤدى هذا اللف الروسي على كرة؟", a: "لأن الكرة تتيح لخط الكتف الدوران بحرية بينما يبقى الحوض جسرًا — النسخة الجالسة على الأرض تثبت الحوض وتسلّم العمل للزخم. والكيبل يضيف النصف الآخر: مقاومة عبر الدوران لا عند نهايته فقط." },
        { q: "كتفا تؤلمانني أكثر من مائلتّي — ما الخلل؟", a: "الذراعان تضغطان بدل أن تتدليا. تخيل المقبض ملحومًا بعظمة القص: يستدير الجذع وتحمل الذراعان خط الكيبل، والكتفان تحفظان الوضع فحسب. أنزل المسمار حتى تعود الدورة أمينة." },
        { q: "هل تدريب الدوران آمن للعمود؟", a: "تدوير القفص الصدري فوق قطني مشدود محايد قدرة طبيعية متدرَّبة — وهذا بالضبط ما تدرببه هذه الصفحة. وما يكرهه العمود هو الليّ المحمل السريع عند آخر المدى من القطني نفسه؛ ومواصفات ربع الدورة وأمر الوركين المرتفعين وُجدت لإبقاء الحركة خارج تلك المنطقة." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Home core specialization program", labelAr: "برنامج تخصص الجذع المنزلي" },
      { hrefEn: "/blog/warm-up-before-lifting-5min-routine", hrefAr: "/ar/blog/best-dynamic-stretching-before-gym", labelEn: "Five-minute warm-up before lifting", labelAr: "الإحماء الديناميكي قبل الجيم" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Workout tracker", labelAr: "متتبع التمارين" },
    ],
  },

  "barbell-ab-rollout": {
    intro: {
      en: "Set a loaded Olympic bar on the floor, grip its knurling from a push-up position, and roll it toward your feet while the hips rise and the abs fight the collapse — that is the library's barbell rollout, the ab wheel's barbell cousin with one honest advantage: the plates set the height and the bar's width forces a stable, shoulder-wide grip. The steps describe the arc exactly: slight back bend held, hips lift, exhale on the roll out, a second of contraction at the top, controlled return. It is one of the few abdominal movements where the load is your entire body negotiating with gravity over a moving axle — and the abs either hold the line or the movement tells on them instantly.",
      ar: "ضع بارًا أولمبيًا محملًا على الأرض، واقبض على خشونته من وضع الضغط، ودحرجه نحو قدميك بينما يرتفع الحوض وتقاوم البطن الانهيار — هذه دحرجة البار من المكتبة، ابنة عم عجلة البطن بميزة أمينة واحدة: الأقراص تضبط الارتفاع وعرض البار يفرض قبضة ثابتة بعرض الكتفين. تصف الخطوات القوس بدقة: انحناء ظهري خفيف محفوظ، ورفع الوركين، وزفير مع التدحرج للخارج، وثانية انقباض في الأعلى، وعودة متحكمة. إنها من حركات البطن القليلة التي يكون حملها جسدك كله يتفاوض مع الجاذبية فوق محور متحرك — والبطن إما أن تحفظ الخط أو تشي بها الحركة فورًا.",
    },
    sections: {
      en: {
        muscles: "The rectus abdominis works here in its bracing job — anti-extension — with the library also crediting the lower back and shoulders, which is the honest ledger for a rollout. As the bar travels away, the torso lengthens into a moving plank and the abs fight to keep the spine from arching; the lats and shoulders stack over the rolling axle, the glutes and hip extensors hold the hips-high line the steps demand. No curl happens anywhere in this movement — the abs never shorten; they hold a lengthening front, which is why rollouts pair with crunches instead of replacing them.",
        mistakes: [
          { error: "Letting the hips sag as the bar rolls out, turning the movement into a collapsing plank.", fix: "Hips stay high through the whole arc — the library's cue is explicit; if the pelvis drops before the bar has traveled, shorten the range and rebuild the brace." },
          { error: "Rolling so far the lower back arches hard at full extension.", fix: "The range ends where the spine's neutral line ends; a half-rollout with a flat back outbuilds a full one with a banana shape every time." },
          { error: "Pulling the bar back with the arms instead of closing the hips.", fix: "The return is a hip hinge driven by the abs pulling the pelvis under — the arms roll the bar, they do not row it home." },
          { error: "Rushing reps and skipping the prescribed one-second top contraction.", fix: "The pause at the hips-high position is where the abs' hold is most visible; treat each rep as two beats out, two beats hold, two beats home." },
        ],
        alternatives: "The rollout family in this library spans every setup. The ab-roller page is the classic wheel version, narrower and lower; the plank trains the same anti-extension brace without the rolling axle; the dead bug teaches the brace lying down for anyone not ready to hold their bodyweight on the descent. In a gym without plates, a barbell loaded with small rounds on a smooth floor reproduces this exact movement at a friendlier height.",
        progression: "Earn the movement from the knees or from a short range first: bar rolls thirty centimeters, hips high, spine long. Extend the range a hand's width per week while the back stays flat — that is the entire progression, and it can run for a year. Advanced lifters roll from the toes, slow the eccentric to four counts, or finish blocks with a one-second hold at full extension, where the abs hold the longest front they will ever own.",
        programming: "Three to four sets of six to twelve slow reps, once or twice a week — anti-extension work is dense and the joints vote quickly. Program it after the main lifts, never before squats or pulls that need a fresh trunk. It pairs naturally with any crunch page in the same block: the abs' two jobs, hold and curl, trained in one session. On a cut the movement keeps the midsection strong without adding spinal fatigue to a tired lifter.",
        safety: "The lumbar spine is the whole caution list. The slight back bend the steps permit is a position, not a road — the moment the low back arches deeper as the bar travels, the range has outgrown the brace, and the fix is always less distance, not more courage. Shoulders that complain when stacked over the bar can start from the knees with a narrower grip. Disc histories get the standing referral: clinician before loaded extension work, plank family in the meantime.",
      },
      ar: {
        muscles: "تعمل المستقيمة البطنية هنا في وظيفتها الشدّية — مضادة الامتداد — والمكتبة تسجل أيضًا أسفل الظهر والكتفين، وهذا سجل أمين لدحرجة. فبينما يسافر البار بعيدًا يتمدد الجذع إلى بلانك متحرك وتقاوم البطن تقوس العمود؛ والظهرية والكتفان يتراصّان فوق المحور المتدحرج، والألويتان وباسطات الورك يحفظان خط الوركين المرتفع الذي تطلبه الخطوات. لا لفّة تحدث في أي مكان من هذه الحركة — البطن لا تقصر أبدًا؛ إنها تحمل جبهة متمددة، ولهذا تقترن الدحرجات بالكرانشات بدل أن تحل محلها.",
        mistakes: [
          { error: "ترك الوركين يهبطان مع تدحرج البار فتصير الحركة بلانكًا منهارًا.", fix: "يبقى الحوض مرتفعًا عبر القوس كله — إشارة المكتبة صريحة؛ إن هبط الحوض قبل أن يسافر البار فقصّر النطاق وأعد بناء الشد." },
          { error: "التدحرج بعيدًا حتى يتقوس أسفل الظهر بعنف عند الامتداد الكامل.", fix: "ينتهي النطاق حيث ينتهي خط العمود المحايد؛ دحرجة نصفية بظهر مسطح تبني أكثر من كاملة بشكل موزة في كل مرة." },
          { error: "سحب البار عائدًا بالذراعين بدل إغلاق الوركين.", fix: "العودة مفصل ورك تقوده البطن تشدّ الحوض تحتها — الذراعان تدحرجان البار ولا تجذفانه إلى البيت." },
          { error: "استعجال التكرارات وقفز تثبيت الثانية الموصف في الأعلى.", fix: "التوقف عند وضع الوركين المرتفع هو حيث يكون شد البطن أوضح؛ عامل كل تكرار كعدّتين خارجًا وعدّتين تثبيتًا وعدّتين عودة." },
        ],
        alternatives: "عائلة الدحرجة في هذه المكتبة تغطي كل إعداد. صفحة عجلة البطن هي نسخة العجلة الكلاسيكية أضيق وأخفض، والبلانك يدرّب نفس شد مضاد الامتداد بلا محور متحرك، والحشرة الميتة تعلّم الشد مستلقيًا لمن لم يجهز بعد لحمل جسده على النزول. وفي صالة بلا أقراص يعيد بار محمل بأقراص صغيرة على أرض ملساء إنتاج هذه الحركة بالضبط بارتفاع ألطف.",
        progression: "استحق الحركة من الركبتين أو من نطاق قصير أولًا: البار يدحرج ثلاثين سنتيمترًا، والوركان مرتفعان، والعمود ممتد. وسّع النطاق بعرض كف أسبوعيًا ما دام الظهر مسطحًا — هذه هي الترقية كلها، وقد تسير سنة. والمتقدمون يدحرجون من أصابع القدم، ويبطئون النزول إلى أربع عدّات، ويختمون الكتل بتثبيت ثانية عند الامتداد الكامل، حيث تحمل البطن أطول جبهة ستمتلكها في حياتها.",
        programming: "ثلاث إلى أربع مجموعات من ست إلى اثني عشر تكرارًا بطيئًا، مرة أو مرتين أسبوعيًا — عمل مضاد الامتداد كثيف والمفاصل تصوّت سريعًا. برمجه بعد الرفعات الكبرى ولا تضعه قبل سكوات أو سحب يحتاج جذعًا طازجًا أبدًا. ويقترن طبيعيًا بأي صفحة كرانش في الكتلة نفسها: وظيفتا البطن، الحمل واللف، تتدربان في جلسة واحدة. وفي التنشيف يحفظ التمرين قوة الوسط دون إضافة إنهاك عمودي لرياضي متعب.",
        safety: "العمود القطني هو قائمة الحذر بأكملها. الانحناء الخفيف الذي تسمح به الخطوات وضعٌ لا طريق — لحظة يتعمق تقوس أسفل الظهر مع سفر البار يكون النطاق قد تجاوز الشدّ، والعلاج دائمًا مسافة أقل لا شجاعة أكثر. والكتفان اللتان تشتكيان فوق البار تبدآن من الركبتين بقبضة أضيق. وتواريخ الغضروف تأخذ الإحالة القائمة: الطبيب قبل عمل الامتداد المحمل، وعائلة البلانك في الأثناء.",
      },
    },
    faq: {
      en: [
        { q: "Barbell rollout or ab wheel — which is better?", a: "Same muscle, same brace, different axle. The wheel sits lower and demands more from the shoulders; the barbell's plates set a higher, adjustable height and its width locks the grip steady — which makes it the friendlier entry for many lifters. The library carries the wheel's page for the day you outgrow the bar's height." },
        { q: "How far should I roll out?", a: "Exactly as far as the spine stays neutral and the hips stay high — for most lifters that starts well short of full extension and grows over months. The movement's value lives in the held front, not in the distance; the tape measure is the back, not the floor." },
        { q: "Why do rollouts hurt my lower back?", a: "Because the range outran the brace — the pelvis dropped and the lumbar arch took the load the abs could not hold. Shorten the roll, squeeze the glutes to lock the hips high, and retest; if the ache persists even on short rolls, spend a block on planks and dead bugs first." },
      ],
      ar: [
        { q: "دحرجة البار أم عجلة البطن — أيهما أفضل؟", a: "نفس العضلة ونفس الشد ومحور مختلف. العجلة أخفض وتطلب أكثر من الكتفين؛ وأقراص البار تضبط ارتفاعًا أعلى قابلًا للتعديل وعرضُه يثبّت القبضة — وهذا يجعله مدخلًا ألطف لكثيرين. وتحمل المكتبة صفحة العجلة لليوم الذي تتجاوز فيه ارتفاع البار." },
        { q: "إلى أي مدى أدحرج؟", a: "بالضبط إلى حيث يبقى العمود محايدًا والوركان مرتفعين — ولدى أغلب الرفاع يبدأ ذلك أقصر كثيرًا من الامتداد الكامل وينمو عبر أشهر. قيمة الحركة تسكن الجبهة المحفوظة لا المسافة؛ شريط القياس هو الظهر لا الأرض." },
        { q: "لماذا تؤلمني الدحرجات في أسفل الظهر؟", a: "لأن النطاق سبق الشدّ — هبط الحوض وتولى القوس القطني حملاً لم تحمله البطن. قصّر الدحرجة، واعصر الألويتين لقفل الوركين مرتفعين، وأعد الاختبار؛ فإن استمر الألم حتى على الدحرجات القصيرة فاقضِ كتلة على البلانك والحشرة الميتة أولًا." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-core-specialization", hrefAr: "/ar/programs/home-core-specialization", labelEn: "Core specialization program", labelAr: "برنامج تخصص الجذع" },
      { hrefEn: "/blog/warm-up-before-lifting-5min-routine", hrefAr: "/ar/blog/best-dynamic-stretching-before-gym", labelEn: "Warm up before this one", labelAr: "أحمِ قبل هذه الحركة" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track the slow reps honestly", labelAr: "تتبع التكرارات البطيئة بأمانة" },
    ],
  },

  "air-bike": {
    intro: {
      en: "The air bike — the bicycle crunch — is the floor movement that made rotation famous: shoulder blades off the mat, knees lifted to ninety degrees, opposite elbow and knee closing toward each other while the other leg extends into a slow pedal. The library's steps run it as a deliberate alternating cycle, exhale on each cross, with the small of the back pressed into the floor as the fixed point of the whole machine. It bundles three jobs into one rep — flexion, rotation, and coordination — which is why it burns early, why form dies young on it, and why this page exists to keep the machine honest.",
      ar: "دراجة الهواء — الكرانش الدراج — هي الحركة الأرضية التي أشهرت الدوران: لوحا الكتف خارجان عن البساط، والركبتان مرفوعتان إلى تسعين درجة، والمرفق المقابل والركبة المقابلة ينغلقان نحو بعضهما بينما تمدد الساق الأخرى في دواسة بطيئة. تشغّل خطوات المكتبة دورة متبادلة متعمدة، بزفير مع كل تقاطع، وأسفل الظهر مضغوط في الأرض كنقطة ثابتة للآلة كلها. إنها تحزم ثلاث وظائف في تكرار واحد — ثني ودوران وتنسيق — ولهذا تحترق مبكرًا، ولماذا يموت الأداء صغيرًا عليها، ولهذا وُجدت هذه الصفحة لتبقى الآلة أمينة.",
    },
    sections: {
      en: {
        muscles: "The library credits the abs alone, and the three-in-one rep explains how: the rectus abdominis holds the shoulders off the mat and drives the trunk's curl, while the obliques — one side shortening, the other braking — produce the cross that gives the movement its bicycle name. The extended leg's hip flexor works as the pedal's cable, and the whole pattern is anchored by the pressed lumbar spine. No other floor movement lets the abs train flexion and rotation inside the same breath, which is both the exercise's selling point and its trap.",
        mistakes: [
          { error: "Yanking the head with clasped hands to force the elbow across.", fix: "Fingertips at the temples, elbows wide; the shoulder travels toward the opposite knee — the elbow is a passenger, not the engine." },
          { error: "Bouncing the extended leg on the floor between crosses.", fix: "The pedal never touches down — the long leg hovers and the slow tempo the steps prescribe is what keeps the abs loaded through the switch." },
          { error: "Rushing the alternation into a sprint.", fix: "One deliberate cross per two counts, exhale included; speed hides the rotation and converts the movement into a floor show of momentum." },
          { error: "Letting the lower back arch off the mat as fatigue arrives.", fix: "The pressed lumbar is the machine's anchor; when it lifts, the set is over — end on form, log the honest count, and rebuild next session." },
        ],
        alternatives: "The rotation family spreads across this library at every level. The floor Russian twist runs the turn with the torso alone; the stability-ball cable twist loads the same obliques against a stack; the plank family trains the anti-rotation half of the job; and the plain crunch page covers pure flexion for days the coordination demands too much. The air bike's niche is the bundle — three jobs, zero equipment, one mat.",
        progression: "The first progression is tempo, not reps: slow the pedal until each cross takes two full counts with the pause at the squeeze. Then extend the lever by reaching the straight leg longer and lower without touching down; then raise the working counts per set while the lumbar stays pressed. Advanced lifters add sets before adding speed, because this movement's ceiling is control, not cardio — it stops being an ab exercise exactly when it becomes a sprint.",
        programming: "Two to four sets of ten to twenty crosses per side, two or three times a week, closed at the session's end. Because the rep bundles flexion and rotation, the air bike can stand in for a crunch-plus-twist pairing on short sessions — but it does not replace anti-rotation work, so the plank keeps its separate line in the program. In a cutting phase it earns its keep as a high-density trunk finisher while the deficit does the unveiling.",
        safety: "The neck and the lumbar spine share the watch, in that order: open hands at the temples keep the cervical spine out of the pull, and the pressed-flat lumbar defines the set's end. If the tailbone grinds on hard floors, a folded mat fixes it without changing the exercise. Rotation under fatigue is the specific risk this page guards against — when the cross starts arriving from momentum instead of the obliques, the set has ended, whatever the clock says.",
      },
      ar: {
        muscles: "تقيّد المكتبة البطن وحدها، والتكرار الثلاثي يفسر كيف: تحمل المستقيمة البطنية الكتفين خارج البساط وتقود لفة الجذع، بينما المائلتان — واحدة تقصر والأخرى تكبح — تنتجان التقاطع الذي يمنح الحركة اسمها الدراج. وعضلة ثني الورك للساق الممدودة تعمل كابل الدواسة، والنمط كله مرساةً له العمود القطني المضغوط. لا حركة أرضية أخرى تتيح للبطن تدريب الثني والدوران في نفس النَّفَس، وهذا بند البيع للحركة وفخها معًا.",
        mistakes: [
          { error: "انتزاع الرأس بيدين متشابكتين لقسر المرفق عبر الجسم.", fix: "أطراف الأصابع عند الصدغين والمرفقان واسعان؛ الكتف هو من يسافر نحو الركبة المقابلة — المرفق راكب لا محرك." },
          { error: "ارتداد الساق الممدودة على الأرض بين التقاطعات.", fix: "الدواسة لا تلمس الأرض أبدًا — الساق الطويلة معلقة والإيقاع البطيء الذي تصفه الخطوات هو ما يبقي البطن محملة عبر التبديل." },
          { error: "تحويل التناوب إلى سباق.", fix: "تقاطع واحد متعمد كل عدّتين مع الزفير؛ السرعة تخفي الدوران وتحول الحركة إلى عرض أرضي من الزخم." },
          { error: "ترك أسفل الظهر يتقوس عن البساط مع وصول الإنهاك.", fix: "القطني المضغوط هو مرساة الآلة؛ حين يرتفع تنتهي المجموعة — اختم على أداء سليم وسجّل العدد الأمين وأعد البناء في الجلسة القادمة." },
        ],
        alternatives: "عائلة الدوران تنتشر عبر هذه المكتبة في كل مستوى. اللف الروسي الأرضي يدير الدورة بالجذع وحده، ولف الكرة بالكيبل يحمل نفس المائلتين ضد رَكن، وعائلة البلانك تدرّب النصف المضاد للدوران من الوظيفة، وصفحة الكرانش الصافي تغطي الثني الخالص للأيام التي يكثر فيها الطلب على التنسيق. ومقعد دراجة الهواء هو الحزمة — ثلاث وظائف وصفر عتاد وبساط واحد.",
        progression: "الترقية الأولى إيقاع لا تكرارات: أبطئ الدواسة حتى يأخذ كل تقاطع عدّتين كاملتين مع تثبيت عند العصر. ثم طوّل الرافعة بمدّ الساق المستقيمة أطول وأخفض دون ملامسة؛ ثم ارفع عدّات العمل في المجموعة والقطني مضغوط. يضيف المتقدمون مجموعات قبل إضافة السرعة، لأن سقف هذه الحركة سيطرة لا كارديو — وتتوقف عن كونها تمرين بطن في اللحظة نفسها التي تصبح فيها سباقًا.",
        programming: "جلستان إلى أربع من عشرة إلى عشرين تقاطعًا لكل جانب، مرتين أو ثلاثًا أسبوعيًا، في ختام الجلسة. ولأن التكرار يحزم ثنيًا ودورانًا تستطيع دراجة الهواء أن تحل محل ثنائية كرانش-ولف في الجلسات القصيرة — لكنها لا تعوض عمل مضاد الدوران، فيحتفظ البلانك بسطره المستقل في البرنامج. وفي التنشيف تستحق مكانها كخاتمة جذع عالية الكثافة بينما يتولى العجز أعمال الكشف.",
        safety: "الرقبة والقطني يتقاسمان المراقبة بهذا الترتيب: كفّان مفتوحان عند الصدغين يبقيان العنقي خارج السحب، والقطني المسطح يحدد نهاية المجموعة. وإن احتكّ العصعص بأرض صلبة فبساط مطوي يصلحه دون تغيير التمرين. والدوران تحت الإنهاك هو الخطر النوعي الذي تحرسه هذه الصفحة — حين يبدأ التقاطع يصل بالزخم بدل المائلتين تكون المجموعة قد انتهت، أيًا كان ما يقوله العقرب.",
      },
    },
    faq: {
      en: [
        { q: "Does the air bike burn belly fat?", a: "It burns calories modestly and builds the muscle underneath — the fat itself is a deficit matter. This library keeps the jobs separate on purpose: the training pages build, the belly-fat guide and calculators subtract, and both logs live in the free tracker." },
        { q: "Elbow to knee or shoulder to knee?", a: "Shoulder to knee — the elbow never needs to touch anything. Traveling the shoulder across keeps the turn in the ribcage; chasing the elbow contact usually drags the head and hands into a pull the neck remembers for days." },
        { q: "Why do my hips click on the extended leg?", a: "Usually the pedal is traveling too wide or too fast for the hip's current range — narrow the arc, slow the extension, and keep the lumbar pressed. A click without pain is common and generally harmless; a click with pain earns a professional look before the next set." },
      ],
      ar: [
        { q: "هل تحرق دراجة الهواء دهون البطن؟", a: "تحرق سعرات باعتدال وتبني العضلة تحتها — أما الدهن نفسه فمسألة عجز. تحفظ هذه المكتبة الوظائف منفصلة عمدًا: صفحات التدريب تبني الأساس، ودليل دهون البطن مع الحاسبات يطرح الغطاء، وكلا السجلين يعيشان معًا في المتتبع المجاني لدينا." },
        { q: "المرفق إلى الركبة أم الكتف إلى الركبة؟", a: "الكتف إلى الركبة — المرفق لا يحتاج لمس أي شيء. سفر الكتف عبر الجسم يبقي الدوران في القفص الصدري؛ وملاحقة تلامس المرفق تسحب عادةً الرأس واليدين إلى شدّ تتذكره الرقبة لأيام." },
        { q: "لماذا يطقطق وركي في الساق الممدودة؟", a: "غالبًا لأن الدواسة تسافر أوسع أو أسرع من مدى الورك الحالي — ضيّق القوس وأبطئ المدّ وأبقِ القطني مضغوطًا. الطقطقة بلا ألم شائعة وغير مؤذية عمومًا؛ والطقطقة بألم تستحق نظرة متخصص قبل المجموعة التالية." },
      ],
    },
    links: [
      { hrefEn: "/programs/home-beginner-fullbody", hrefAr: "/ar/programs/home-beginner-fullbody", labelEn: "Home beginner full-body program", labelAr: "برنامج منزلي كامل الجسم للمبتدئين" },
      { hrefEn: "/blog/science-backed-belly-fat-loss-8-weeks", hrefAr: "/ar/blog/belly-fat-loss-8-weeks-guide", labelEn: "Belly fat — the evidence plan", labelAr: "دهون البطن — الخطة بالأدلة" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Free workout tracker", labelAr: "متتبع التمارين المجاني" },
    ],
  },
};
