/**
 * EXERCISES-ENRICHMENT — BATCH 6 (exercises 26-31 of 50).
 *
 * Closes the back family (superman — the beginner lower-back anchor the
 * home programs lean on, and the barbell shrug) and the shoulder family
 * (side laterals to front raise, face pull — the two isolation shapes),
 * then opens the legs/glutes family at its head: the barbell squat and
 * the front squat, the family's two barbell flags.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_6: Record<string, ExerciseEnrichment> = {
  superman: {
    intro: {
      en: "The superman is the lower back's kindergarten: lie face down, arms long in front, and lift arms, legs and chest together for a two-second hold — the flying pose that named the exercise, exactly as the instructions draw it. There is no load on the bar because there is no bar; the bodyweight alone, in that simultaneous lift, is enough stimulus for the muscles desk-life switches off. Our home programs book it for two jobs at once — as the beginner's first lower-back strength lesson and as the warm-up activation before deadlifts and rows — and the library's beginner grading is the whole invitation: this is a movement you already can do, done correctly.",
      ar: "سوبرمان هو روضة أسفل الظهر: استلقِ على وجهك وذراعان ممدودتان أمامًا وارفع الذراعين والساقين والصدر معًا بتثبيت ثانيتين — وضعية الطيران التي أعطت التمرين اسمه، كما ترسمها التعليمات بالضبط. لا حمل على البار لأن لا بار أصلًا؛ وزن الجسم وحده، في ذلك الرفع المتزامن، تحفيز كافٍ للعضلات التي يطفئها الجلوس المكتب. تحجزه برامجنا المنزلية لوظيفتين معًا — كأول درس قوة لأسفل الظهر للمبتدئ وكتنشيط إحماء قبل الديدلفت والتجديف — ووسم المكتبة للمبتدئين هو الدعوة كاملة: حركة تستطيع أداءها أصلًا، تؤدَّى بطريقة صحيحة.",
    },
    sections: {
      en: {
        muscles: "The library bills the lower back first and the glutes and hamstrings as seconds, and the simultaneous lift explains the cast: the erector muscles along the spine contract to raise the chest, while the glutes and hamstrings lift the legs — a coordinated chain from shoulders to calves, with the lower back as the meeting point. Because both ends of the body rise at once, the spine extends under the lift's own resistance, which is precisely the job those erectors do all day when you stand, bend, and carry. The exercise is a rehearsal of standing tall, performed lying down.",
        mistakes: [
          { error: "Cranking the head up to look at the wall.", fix: "The neck is part of the long line — eyes down, crown long, and the lift comes from the shoulder blades and hips, not the chin." },
          { error: "Jerking into the hold with a fast bounce.", fix: "The instructions' two-second hold is the exercise — lift smoothly, hold, lower slowly; a bounce spends the rep on momentum the spine never agreed to." },
          { error: "Lifting the legs only and forgetting the arms and chest.", fix: "All three rise together as the instructions order — arms, legs, chest — the lift is one coordinated chain, and the missing third turns it into a partial." },
          { error: "Holding the breath through every rep.", fix: "Exhale as you lift, breathe through the hold — the instructions say so — because a braced spine and a purple face are different achievements." },
        ],
        alternatives: "Back extensions over a bench or a Roman chair — the hyperextension pages in this library — load the same chain harder and are the natural next step. The glute bridge trains the hips' half of the chain from the floor. The bird-dog style work teaches the same coordination with an opposite-arm-leg lift, and good mornings load the pattern with a barbell for advanced trainees. The superman remains the family's free floor: nothing to buy, nothing to set up, nothing to fail under.",
        progression: "The ladder is seconds, then reps, then leverage: two-second holds for ten reps, then three-second holds, then five-second holds with fewer reps. After that the arms travel — hands by the ears, then hands overhead like a diver — each shift lengthening the lever and deepening the demand. Only when all of that feels like rehearsal does external load enter (a small plate held at the chest in a back-extension setup), and the beginner grading on this page says most trainees take months before that door is worth opening.",
        programming: "Book it as a warm-up or a beginner's mainstay: 2-3 sets of 10-15 slow holds, 30-45 seconds of rest, three to five times a week — the movement is gentle enough for near-daily practice and strong enough as a teaching tool to deserve it. Before deadlifts or rows, one or two sets switch the erectors on; on its own in a beginner block, it IS the lower-back program for the first weeks. Our home beginner program schedules it exactly that way.",
        safety: "The superman loads the spine by extension, so the range law matters more than the effort law: lift only as high as the muscles hold comfortably, never to the joint's end, and the exercise stays in the safe zone it was designed for. Acute disc flare-ups are the one honest contraindication — extension feels good for many backs but a clinician should clear the pattern first during an active episode. Neck pain means the eyes are leading; eyes down, and the neck goes quiet.",
      },
      ar: {
        muscles: "تقدم المكتبة أسفل الظهر أولًا والألويات وأوتار الفخذ مساعدتين، والرفع المتزامن يشرح التشكيل: تنقبض باسطات العمود الممتدة على طول الظهر لرفع الصدر، بينما ترفع الألويات وأوتار الفخذ الساقين — سلسلة منسقة من الكتفين إلى السمانة وأسفل الظهر نقطة الالتقاء. ولأن طرفي الجسم يرتفعان معًا يتمدد العمود تحت مقاومة الرفع نفسها، وهي بالضبط الوظيفة التي تؤديها تلك الباسطات طوال اليوم حين تقف وتنحني وتحمل. التمرين بروفة الوقوف شامخًا، مؤداة مستلقية.",
        mistakes: [
          { error: "رفع الرأس بعنف للنظر إلى الحائط.", fix: "الرقبة جزء من الخط الطويل — عينان للأرض وقمة رأس ممدودة — والرفع يأتي من لوحي الكتف والوركين لا من الذقن." },
          { error: "الاندفاع إلى الثبات بنطة سريعة.", fix: "تثبيت الثانيتين في التعليمات هو التمرين — ارفع بنعومة واثبت وانزل ببطء؛ فالنطّة تنفق التكرار على زخم لم يوافق عليه العمود." },
          { error: "رفع الساقين فقط ونسيان الذراعين والصدر.", fix: "الثلاثة ترتفع معًا كما تأمر التعليمات — ذراعان وساقان وصدر — فالرفع سلسلة منسقة واحدة، والثلث الغائب يحوله إلى جزئي." },
          { error: "حبس النفس في كل تكرار.", fix: "ازفر مع الرفع وتنفس خلال الثبات — تقول التعليمات ذلك — لأن العمود المشدود والوجه الأرجواني إنجازان مختلفان." },
        ],
        alternatives: "تمديد الظهر فوق بنش أو كرسي روماني — صفحتا التمديد في هذه المكتبة — تحملان السلسلة نفسها أثقل وهما الخطوة التالية الطبيعية. وجسر الألويات يدرّب نصف الوركين من السلسلة على الأرض. وتمرين الطائر-الكلب يعلم التنسيق نفسه برفع ذراع وساق متقابلتين، وتمرين صباح الخير يحمل النمط ببار للمتقدمين. ويبقى سوبرمان أرض العائلة الحرة: لا شيء للشراء ولا شيء للإعداد ولا شيء يُفشل تحته.",
        progression: "السلم ثوان ثم تكرارات ثم رافعة: ثبات ثانيتين لعشرة تكرارات، ثم ثبات ثلاث، ثم خمس بتكرارات أقل. وبعدها تسافر الذراعان — اليدان عند الأذنين ثم مرفوعتان فوق الرأس كغواص — كل إزاحة تطيل الرافعة وتعمّق المطلب. وفقط حين يصبح كل ذلك بروفة يستحق الباب الدخول — حمل خارجي (قرص صغير على الصدر في إعداد تمديد الظهر) — ووسم المبتدئ في هذه الصفحة يقول إن معظم المتدربين يحتاجون شهورًا قبل أن يستحق ذلك الباب الفتح.",
        programming: "احجزه إحماءً أو ركنًا أساسيًا للمبتدئ: 2-3 مجموعات من 10-15 ثباتًا بطيئًا براحة 30-45 ثانية، ثلاث إلى خمس مرات أسبوعيًا — فالحركة لطيفة بما يكفي لممارسة شبه يومية وقوية بما يكفي كأداة تعليم لتستحقها. وقبل الديدلفت أو التجديف تشعل مجموعة أو اثنتان الباسطات؛ وبمفرده في كتلة مبتدئين هو برنامج أسفل الظهر كاملًا للأسابيع الأولى. وبرنامج المبتدئ المنزلي لدينا يجدوله هكذا بالضبط.",
        safety: "يحمل سوبرمان العمود بالامتداد، فقانون المدى أهم من قانون الجهد: ارفع فقط إلى الحد الذي تحمله العضلات بارتياح، لا إلى نهاية المفصل أبدًا، وتبقى الحركة في منطقة الأمان التي صممت لها. نوبات الغضروف الحادة هي المانع الأمين الوحيد — فالامتداد يريح ظهورًا كثيرة لكن على طبيب أن يجلي النمط أولًا خلال نوبة نشطة. وألم الرقبة يعني أن العينين تقودان؛ عينان للأرض فتهدأ الرقبة.",
      },
    },
    faq: {
      en: [
        { q: "How high should I lift into the hold?", a: "Only as high as the muscles carry the lift comfortably — a few inches off the floor is a full repetition, and the instructions' flying-pose note describes the shape, not an altitude record. End-range cranking adds joint stress without adding muscle work; the two-second squeeze is the entire target." },
        { q: "Is the superman good for back pain?", a: "For most healthy and most achy-from-sitting backs, gentle extension work like this is exactly what the deconditioned erectors need — and our home programs use it as the on-ramp. For acute disc episodes the honest answer is a clinician's clearance first: extension helps many discs and aggravates some, and that distinction is above any exercise page's pay grade." },
        { q: "Can I do supermans every day?", a: "You can — the movement is gentle, equipment-free, and recovers fast, which is why it doubles as daily posture homework in our beginner guides. Daily practice of one to two easy sets builds the habit; the strength ladder in the progression notes still belongs in your training sessions two or three times a week." },
      ],
      ar: [
        { q: "إلى أي ارتفاع أرفع في الثبات؟", a: "فقط إلى الحد الذي تحمل العضلات فيه الرفع بارتياح — بضع بوصات عن الأرض تكرار كامل، وملاحظة وضعية الطيران في التعليمات تصف الشكل لا رقم قياسيًا للارتفاع. اللفّ عند نهاية المدى يضيف إجهاد مفصل بلا عمل عضلي إضافي؛ فالعصرة الثانوية هي الهدف كله." },
        { q: "هل سوبرمان مفيد لآلام الظهر؟", a: "لأغلب الظهور السليمة والمتألمة من الجلوس، العمل الامتدادي اللطيف كهذا هو بالضبط ما تحتاجه الباسطات المهمشة — وتستخدمه برامجنا المنزلية كبوابة انضمام. أما نوبات الغضروف الحادة فالجواب الأمين تصريح طبيب أولًا: فالامتداد يفيد أقراصًا كثيرة ويهيج أخرى، وذلك التمييز أعلى من رتبة أي صفحة تمرين." },
        { q: "هل أؤدي سوبرمان يوميًا؟", a: "تستطيع — فالحركة لطيفة وبلا معدات وتتعافى سريعًا، ولهذا تعمل كواجب وضع يومي في أدلة المبتدئين لدينا. الممارسة اليومية بمجموعة أو اثنتين سهلتين تبني العادة؛ وسلم القوة في ملاحظات التدرج يبقى مكانه في جلسات تدريبك مرتين أو ثلاثًا أسبوعيًا." },
      ],
    },
    links: [
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-building-guide-no-equipment", labelEn: "No-equipment home training guide", labelAr: "دليل التدريب المنزلي بلا معدات" },
      { hrefEn: "/exercises/barbell-glute-bridge", hrefAr: "/ar/exercises/barbell-glute-bridge", labelEn: "Glute bridge — the hips' half of the chain", labelAr: "جسر الألويات — نصف الوركين من السلسلة" },
      { hrefEn: "/programs/home-beginner-fullbody", hrefAr: "/ar/programs/home-beginner-fullbody", labelEn: "Home beginner full-body program", labelAr: "برنامج الجسم الكامل للمبتدئين المنزلي" },
    ],
  },

  "barbell-shrug": {
    intro: {
      en: "The barbell shrug is the traps' direct line: stand tall, bar in the hands, and raise the shoulders toward the ears as far as they travel — hold a beat, lower. The instructions are disarmingly simple, and the movement's simplicity is the point: the trapezius works through a short arc no other big lift isolates, and the shrug gives it that arc with as much weight as the grip can hold. The library bills the traps alone with no secondaries — an honest label for a muscle that carries the bar's whole argument by itself. The neck-to-shoulder line it builds is one of the most visible strength signals a physique can send.",
      ar: "هزّ الكتفين بالبار هو الخط المباشر للترابيس: قف منتصبًا والبار في اليدين وارفع الكتفين نحو الأذنين إلى أقصى مسارهما — لحظة ثبات، ثم انزل. التعليمات بسيطة إلى حد نزع السلاح، وبساطة الحركة هي المغزى: فالترابيس تعمل عبر قوس قصير لا تعزله أي رفعة كبيرة أخرى، ويمنحها الهزّ ذلك القوس بقدر ما تحمله القبضة من وزن. تسجل المكتبة الترابيس وحدها بلا مساعدين — وسم أمين لعضلة تحمل حجة البار كاملة بمفردها. فالخط من الرقبة إلى الكتف الذي تبنيه من أوضح إشارات القوة التي يرسلها الجسد.",
    },
    sections: {
      en: {
        muscles: "The trapezius — specifically its upper fibers, the sheet from the neck out over the shoulder — does the lifting, and the library's no-secondaries billing is anatomically fair: shrugging is elevation, and elevation is the upper trap's own movement. The grip and forearms are the silent partners holding the bar while the traps work, which is why the instructions' wrist-wrap note exists — heavy shrugs are a grip exercise whether you asked for one or not. The middle and lower trap fibers stabilize quietly; the rhomboids watch from next door.",
        mistakes: [
          { error: "Rolling the shoulders in circles under load.", fix: "Straight up, hold, straight down — the instructions' line; the rolling version adds joint grind, not muscle, and the traps never asked for a lap." },
          { error: "Bending the elbows to make the shoulders look higher.", fix: "The arms are ropes — the instructions warn against lifting with the biceps; elbows stay long and the elevation belongs entirely to the shoulders." },
          { error: "Bouncing reps with a knee-dip kick.", fix: "A shrug with a dip is a power clean's poorer cousin; stillness is the exercise — the torso does not move, only the shoulders climb." },
          { error: "Loading so heavy the shoulders never reach full height.", fix: "The trap's arc is short, and the top of it is the exercise — pick a weight the shoulders can carry all the way up, and every partial rep shrunk by ego is a rep the trap never took." },
        ],
        alternatives: "Dumbbell shrugs let each shoulder work alone with a freer line — the dumbbell pages of this library carry the pattern. The Smith machine shrug fixes the path for pure loading; the cable shrub keeps tension through the whole arc, top to bottom. Beyond the shrug family, the traps grow as passengers in every deadlift, rack pull and farmer carry — the carry pages here are a shrug with a walk attached, and heavy carries build traps that shrugs then sharpen.",
        progression: "Start with a load the shoulders can elevate fully for sets of twelve — the arc is short, so full height is the only honest rep. Climb in small jumps while the top of every rep still touches the ears' direction, and let the grip be the referee: when the hands open before the traps tire, straps enter, exactly as the deadlift page teaches. The advanced progression is tempo — a three-second lower from the top — because the trap's short arc hides more time-under-tension than most lifters ever collect.",
        programming: "Book it as an accessory: 3-4 sets of 10-15 reps with 60-90 seconds of rest, once or twice a week, usually at the end of a pull or shoulder session when the traps are already warm. It pairs naturally after deadlifts (the traps held the bar; now they train) and before or after lateral raises on shoulder days. High-rep finishers — twenty-plus reps with a moderate bar — are the bodybuilder's classic trap recipe, and our program templates carry that option.",
        safety: "The neck shares the neighborhood: a shrug performed with the chin jutting or the head dropping loads the cervical spine's neighborhood, so keep the neck neutral and let the shoulders do the traveling. The grip is the other honest limit — an open hand mid-set drops a bar on toes and shins; chalk, straps, or lighter loads solve it. And the rolling-shoulder habit this page's mistakes section flags is the movement's classic joint complaint: straight up and down is both safer and stronger.",
      },
      ar: {
        muscles: "الترابيس — أليافها العلوية تحديدًا، الصفيحة من الرقبة إلى ما فوق الكتف — تتولى الرفع، ووسم المكتبة بلا مساعدين منصف تشريحيًا: فالهزّ ارتفاع، والارتفاع حركة الترابية العلوية الخاصة. والقبضة والساعدان شريكان صامتان يحملان البار بينما تعمل الترابيس، ولهذا وُجدت ملاحظة أربطة المعصم في التعليمات — فالهزّ الثقيل تمرين قبضة طلبت ذلك أم لا. والألياف الوسطى والسفلى للترابيس تثبت بصمت، والمعينات تتفرج من الجوار.",
        mistakes: [
          { error: "تدوير الكتفين في دوائر تحت الحمل.", fix: "أعلى مباشرة، ثبات، أسفل مباشرة — خط التعليمات؛ فالنسخة الدوارة تضيف جريفًا للمفصل لا عضلًا، والترابيس لم تطلب دورة سباحة." },
          { error: "ثني المرفقين لتظهر الكتفان أعلى.", fix: "الذراعان حبال — تحذر التعليمات من الرفع بالعضلة ذات الرأسين؛ يبقى المرفقان ممدودين والارتفاع ملكًا خالصًا للكتفين." },
          { error: "تكرارات ناطة برفسة ركبة.", fix: "الهزّ بانخفاض رجل قريب أفقر من رفعة القوة؛ السكون هو التمرين — الجذع لا يتحرك والكتفان فقط تتسلقان." },
          { error: "تحميل ثقيل حتى لا تبلغ الكتفان كامل الارتفاع أبدًا.", fix: "قوس الترابية قصير وقمته هي التمرين — اختر وزنًا تحمله الكتفان حتى أعلى نقطة، وكل تكرار يقزّمه الكبرياء تكرار لم تأخذه الترابية." },
        ],
        alternatives: "هزّ الدمبل يدع كل كتف تعمل وحدها بخط أحر — صفحات الدمبل في مكتبتنا تحمل النمط. وهزّ ماكينة سميث يثبت المسار لتحميل خالص، وهزّ الكابل يحفظ الشد عبر القوس كله من قمته إلى قاعه. وخارج عائلة الهزّ تنمو الترابيس كركاب في كل ديدلفت ورفعة رف وحمل مزارع — وصفحات الحمل هنا هزّة بمعية مشي، والأحمال الثقيلة تبني ترابيس يشحذها الهزّ بعدها.",
        progression: "ابدأ بحمل ترفعه الكتفان كاملًا لمجموعات من اثني عشر — القوس قصير فالارتفاع الكامل هو التكرار الأمين الوحيد. اصعد بقفزات صغيرة مع بقاء قمة كل تكرار تلامس اتجاه الأذنين، ودع القبضة تكون الحكم: حين تنفتح اليدان قبل تعب الترابيس تدخل الأحزمة، تمامًا كما تعلم صفحة الديدلفت. والتدرج المتقدم إيقاعي — نزول ثلاث ثوان من القمة — لأن قوس الترابية القصير يخفي زمن شد أكبر مما يجمعه أغلب المتدربين أبدًا.",
        programming: "احجزه كعمل مساعد: 3-4 مجموعات من 10-15 تكرارًا براحة 60-90 ثانية، مرة أو مرتين أسبوعيًا، غالبًا في نهاية جلسة سحب أو أكتاف والترابيس دافئة أصلًا. يقترن طبيعيًا بعد الديدلفت (فالترابيس حملت البار؛ حان تدريبها) وقبل الرفع الجانبي أو بعده في أيام الأكتاف. والختامات عالية التكرار — عشرين فأكثر ببار متوسط — وصفة كمال الأجسام الكلاسيكية للترابيس، وقوالب برامجنا تحمل ذلك الخيار.",
        safety: "الرقبة تشارك الحي: فالهزّ بذقن متقدم أو رأس متدلٍ يحمل جوار العمود العنقي، فأبقِ الرقبة محايدة ودع الكتفين تسافران. والقبضة هي الحد الأمين الآخر — يد تنفتح منتصف المجموعة تسقط بارًا على أصابع وساقين؛ والمغناطيس والأحزمة والأحمال الأخف تحلها. وعادة تدوير الكتفين التي تشير إليها فقرة الأخطاء في هذه الصفحة هي شكوى المفصل الكلاسيكية للحركة: أعلى وأسفل مباشرة أأمن وأقوى معًا.",
      },
    },
    faq: {
      en: [
        { q: "Should I roll my shoulders at the top?", a: "No — straight up and down is the line this page's instructions draw. Rolling under load grinds the shoulder joints through their least stable positions while adding almost nothing to the trap's actual job, which is elevation. The roll feels productive for the same reason a squeaky wheel feels busy." },
        { q: "Why can't I shrug as much as I deadlift-grip?", a: "You usually can grip it — the gap is elevation: standing with a heavy bar and lifting your shoulders to your ears is a different demand than hanging on. Straps close that gap when the target is the traps, and the deadlift page in this library makes the same allowance for the same reason." },
        { q: "High reps or heavy weight for traps?", a: "Both schools graduate students — the traps are built for endurance carriage all day and respond to both. The practical split most programs run: one heavier session in the 8-12 range and one high-rep finisher in the 15-25 range per week, which covers the muscle's two jobs without forcing a philosophical commitment." },
      ],
      ar: [
        { q: "هل أدوّر كتفيّ في القمة؟", a: "لا — أعلى وأسفل مباشرة هو الخط الذي ترسمه تعليمات هذه الصفحة. فالتدوير تحت الحمل يجرف مفاصل الكتف عبر أقل مواضعها استقرارًا بينما لا يضيف شيئًا لوظيفة الترابية الفعلية وهي الارتفاع. والدوران يبدو منتجًا للسبب نفسه الذي تبدو به العجلة الصرارة مشغولة." },
        { q: "لماذا لا أهزّ بقدر ما تشد قبضتي في الديدلفت؟", a: "غالبًا تستطيع الإمساك — فالفجوة في الارتفاع: الوقوف ببار ثقيل ورفع كتفيك إلى أذنيك طلب مختلف عن التعلق. والأحزمة تسد تلك الفجوة حين يكون الهدف الترابيس، وصفحة الديدلفت في مكتبتنا تجيز الشيء نفسه للسبب نفسه." },
        { q: "تكرارات عالية أم وزن ثقيل للترابيس؟", a: "المدرستان تتخرج فيهما دفعات — فالترابيس مبنية للحمل التحملي طوال اليوم وتستجيب للاثنين. والتقسيم العملي الذي تشغله أغلب البرامج: جلسة أثقل في نطاق 8-12 وختام عالي التكرار في 15-25 أسبوعيًا، فيغطي ذلك وظيفتي العضلة دون فرض التزام فلسفي." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-deadlift", hrefAr: "/ar/exercises/barbell-deadlift", labelEn: "Deadlift — the traps' other job", labelAr: "الديدلفت — وظيفة الترابيس الأخرى" },
      { hrefEn: "/exercises/side-laterals-to-front-raise", hrefAr: "/ar/exercises/side-laterals-to-front-raise", labelEn: "Side laterals — the shoulder-day pairing", labelAr: "الرفع الجانبي — قرين يوم الأكتاف" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track every set — free tracker", labelAr: "سجل كل مجموعة — المتتبع المجاني" },
    ],
  },

  "side-laterals-to-front-raise": {
    intro: {
      en: "Side laterals to front raise is two isolation exercises sharing one set: the instructions alternate a lateral raise — arms out to the sides — with a front raise — arms straight ahead — rep by rep, so both halves of the shoulder's raising job get their turn under the dumbbells. It is a combo built for one goal — wide shoulders: the side-raise half targets the lateral delt that builds shoulder width, the front-raise half the anterior delt that presses already hammer. The library bills the shoulders primary with the traps as seconds, and the simple alternation lets a pair of light dumbbells cover more raising territory than either exercise alone — a superset that fits inside a single rest period.",
      ar: "الرفع الجانبي إلى الأمامي تمرينا عزل يتقاسمان مجموعة واحدة: تبدل التعليمات رفعًا جانبيًا — ذراعان للجانبين — برفع أمامي — ذراعان مستقيمتان أمامًا — تكرارًا بعد تكرار، فيأخذ نصفا كتف الرفاعة دورهما تحت الدمبلتين. إنها الحركة المبنية لهدف عرض الأكتاف: نصف الرفع الجانبي يستهدف الدالية الجانبية التي تبني عرض الكتف، والنصف الأمامي الدالية الأمامية التي تدقها الرفعات أصلًا. تسجل المكتبة الأكتاف أساسية والترابيس مساعدة، ويتيح التبديل البسيط لزوج دمبل خفيف تغطية مساحة رفع أكبر مما يغطيه أي من التمرينين وحده — سوبرست يسكن فترة راحة واحدة.",
    },
    sections: {
      en: {
        muscles: "The lateral raise half loads the side delt — the muscle that, seen from the front, decides whether shoulders read wide — with the traps assisting the top of the arc, as the library's secondary billing notes. The front-raise half hands the load to the anterior delt, the pressing muscle that every push day already trains. Alternating the two keeps the rest-between-raises honest (one head rests while the other works) and covers the shoulder's two raising lines in one continuous set, with the rotator cuff quietly stabilizing every inch of both arcs.",
        mistakes: [
          { error: "Swinging the dumbbells with a torso bounce.", fix: "The instructions say it outright — avoid swinging or cheating: stand tall, let the arms rise on their own strength, and a lighter bell done cleanly outranks a heavier one done with a dip." },
          { error: "Raising past shoulder height and shrugging to get there.", fix: "The arcs stop at shoulder level — the delt's strongest range — and the traps take over beyond it; higher is not more work, it is a different, worse exercise." },
          { error: "Leading the lateral raise with the hands and thumbs up.", fix: "Keep the elbow slightly above the wrist through the side arc, pinkies drifting a touch up — lead with the elbow, and the side delt finally takes its own appointment." },
          { error: "Turning the front raise into an awkward shoulder-cross.", fix: "Arms travel straight ahead to shoulder height, shoulder-width apart, as the instructions stage it — crossing or wide circling hands the rep to the traps and momentum." },
        ],
        alternatives: "Pure lateral raises and pure front raises — the family's two singles — let each head take a full set alone; the cable versions of each keep tension through the entire arc, and this library carries both pages. The Arnold press builds the same heads inside a press. Machine lateral raises brace the torso for lifters whose swinging refuses correction. At home, a pair of water bottles or bands books the same appointment: the shoulders' raising job is load-honest at almost any weight.",
        progression: "The ladder is ruled by strictness, not kilos: begin with bells light enough that both arcs stay clean to shoulder height — for most lifters that means starting around 2-5 kg per hand — and climb one kilo at a time when the top set's final reps stay smooth. The honest progressions are tempo and pauses: a two-second pause at the top of each arc, a three-second lower, or the alternating pattern held to a strict one-second-up count. The exercise's ceiling is not weight but standards — it stays hard forever, which is exactly why programs keep it.",
        programming: "Book it as shoulder isolation after pressing: 3 sets of 10-16 total raises (alternating sides rep by rep), 45-60 seconds of rest, once or twice a week. It slots into the accessory window of any push or shoulder day — after the presses, before or after shrugs — and the alternation makes a superset's stimulus fit a single set's clock. On hypertrophy blocks for shoulders, it pairs with rear-delt work so all three delt heads leave the session trained.",
        safety: "The shoulder's small muscles meet the gym's most commonly cheated exercise here, so the loading law is simple: the weight you can raise without your torso moving is the weight that trains you; everything above that trains the hips. Elbow tendons complain when the side arc leads with the hand — the elbow-leads cue fixes the line and the complaint together. Impingement-prone lifters should keep the side arc slightly in front of the body's side line, a small geometry change this page's arcs allow.",
      },
      ar: {
        muscles: "نصف الرفع الجانبي يحمل الدالية الجانبية — العضلة التي تقرر من الأمام هل تُقرأ الأكتاف عريضة — مع مساعدة الترابيس لقمة القوس كما تسجل الفاتورة المساعدة للمكتبة. والنصف الأمامي يسلّم الحمل للدالية الأمامية، عضلة الدفع التي يدرّبها كل يوم دفع أصلًا. والتبديل بينهما يحمي الراحة بين الرفعات (رأس يرتاح بينما يعمل الآخر) ويغطي خطي رفع الكتف في مجموعة واحدة متصلة، والكفة الدوارة تثبت بصمت كل شبر من القوسين.",
        mistakes: [
          { error: "تأرجح الدمبلتين بنطة جذع.", fix: "تقولها التعليمات مباشرة — تجنب الأرجحة والغش: قف شامخًا ودع الذراعين ترتفعان بقوتهما، فالجرس الأخف نظيفةً يتفوق على الأثقل بنطةً." },
          { error: "الرفع فوق ارتفاع الكتف والهزّ للوصول.", fix: "يتوقف القوسان عند مستوى الكتف — أقوى مدى للدالية — والترابيس تتولى بعده؛ فالأعلى ليس عملًا أكثر بل تمرينًا آخر أسوأ." },
          { error: "قيادة الرفع الجانبي باليدين والإبهامين لأعلى.", fix: "أبقِ المرفق أعلى قليلًا من الرسغ عبر القوس الجانبي والخنصر ينحرف لأعلى قليلًا — قُد بالمرفق فتأخذ الدالية الجانبية موعدها أخيرًا." },
          { error: "تحويل الرفع الأمامي إلى تقاطع أكتاف محرج.", fix: "تسافر الذراعان مستقيمتين أمامًا إلى ارتفاع الكتف بعرضه كما تجهز التعليمات — فالتقاطع أو الدوران الواسع يسلمان التكرار للترابيس والزخم." },
        ],
        alternatives: "الرفع الجانبي الخالص والأمامي الخالص — مفردا العائلة — يدعان كل رأس يأخذ مجموعة كاملة وحده، ونسختا الكابل لكل منهما تحفظان الشد عبر القوس كاملًا وتحمل مكتبتنا الصفحتين. وبرس أرنولد يبني الرأسين نفسيهما داخل رفعة دفع. وماكينة الرفع الجانبي تثبت الجذع لمن يرفض تأرجحه التصحيح. ومنزليًا، زجاجتا ماء أو مطاطان يحجزان الموعد نفسه: فرسالة رفع الكتفين أمينة مع الحمل عند أي وزن تقريبًا.",
        progression: "يحكم السلم الصرامة لا الكيلوجرامات: ابدأ بجرسين خفيفين حتى يبقى القوسان نظيفين حتى ارتفاع الكتف — ولأغلب المتدربين يعني البدء حول 2-5 كجم لكل يد — واصعد كيلوجرامًا واحدًا في المرة حين تبقى تكراريات المجموعة الأخيرة سلسة. والتدرجات الأمينة إيقاع وتوقفات: توقف ثانيتين في قمة كل قوس، ونزول ثلاث ثوان، أو نمط التبديل على عد صاعد ثانية واحدة صارم. وسقف التمرين ليس الوزن بل المعايير — يبقى صعبًا للأبد، ولهذا تحتفظ به البرامج.",
        programming: "احجزه عزلًا للأكتاف بعد الدفع: ثلاث مجموعات من 10-16 رفعة إجمالية (تبديلًا تكرارًا بعد تكرار) براحة 45-60 ثانية، مرة أو مرتين أسبوعيًا. يستقر في نافذة الأعمال المساعدة لأي يوم دفع أو أكتاف — بعد الرفعات وقبل الهزّ أو بعده — ويجعل التبديل تحفيز سوبرست يسكن ساعة مجموعة واحدة. وفي كتل تضخيم الأكتاف يقترن بعمل الدالية الخلفية فتغادر الرؤوس الثلاثة الجلسة مدربة.",
        safety: "تلقي عضلات الكتف الصغيرة أشهر تمرين يُغش في الصالة، فقانون التحميل بسيط: الوزن الذي ترفعه دون أن يتحرك جذعك هو الوزن الذي يدرّبك، وما فوقه يدرّب الوركين. وأوتار المرفق تشتكي حين يقود القوس الجانبي باليد — وإشارة المرفق يقود تصلح الخط والشكوى معًا. والمعرضون للانحشار فليبقوا القوس الجانبي قليلًا أمام الخط الجانبي للجسم، تعديل هندسي صغير تسمح به أقواس هذه الصفحة.",
      },
    },
    faq: {
      en: [
        { q: "Why alternate the two raises instead of doing sets of each?", a: "Efficiency with honesty: while one head lifts, the other rests, so a set of alternations keeps both heads working without lengthening the rest clock — a superset that fits in one set's costume. Purists who prefer straight sets lose nothing by splitting them; the alternation is a scheduling choice, not a physiological law." },
        { q: "How heavy should the dumbbells be for this?", a: "Lighter than instinct suggests: 2-5 kg per hand covers most trainees' honest range for both arcs, because the delts are small and the leverage is terrible — that is the exercise working as designed. If the torso moves, the weight has left the shoulders' job description; the climb from there is one kilo at a time, earned over months." },
        { q: "Do I need front raises if I already press?", a: "Mostly no — the front delt is the pressing delt, and presses train it thoroughly; this page's alternating pattern exists because the side raise needed a partner, not because the front raise was starving. Many programs run the lateral half alone or with rear-delt work, and that is a defensible reading of the same evidence." },
      ],
      ar: [
        { q: "لماذا أبدل الرفعتين بدل مجموعات لكل منهما؟", a: "كفاءة بأمانة: فبينما يرفع رأس يرتاح الآخر، فمجموعة تبديلات تبقي الرأسين يعملان دون تمديد ساعة الراحة — سوبرست بزيّ مجموعة واحدة. والنقاة الذين يفضلون المجموعات المستقيمة لا يخسرون شيئًا بفصلهما؛ فالتبديل اختيار جدولة لا قانون فسيولوجيا." },
        { q: "كم وزن الدمبل المناسب هنا؟", a: "أخف مما يوحي به الغريزة: 2-5 كجم لكل يد تغطي المدى الأمين لأغلب المتدربين في القوسين، لأن الداليات صغيرة والرافعة سيئة — وهذا التمرين يعمل كما صمم. وإذا تحرك الجذع فقد الوزن وصف وظيفة الأكتاف؛ والصعود من هناك كيلوجرام في المرة، مكسبًا عبر شهور." },
        { q: "هل أحتاج الرفع الأمامي إن كنت أدفع أصلًا؟", a: "غالبًا لا — فالدالية الأمامية دالية الدفع، والرفعات تدربها جيدًا؛ ونمط التبديل في هذه الصفحة موجود لأن الرفع الجانبي احتاج شريكًا لا لأن الأمامي كان يتضور جوعًا. كثير من البرامج تشغل النصف الجانبي وحده أو مع عمل الدالية الخلفية، وهي قراءة قابلة للدفاع عنها لنفس الأدلة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/dumbbell-shoulder-press", hrefAr: "/ar/exercises/dumbbell-shoulder-press", labelEn: "Dumbbell shoulder press — the pressing half", labelAr: "برس الكتف بالدمبل — نصف الدفع" },
      { hrefEn: "/exercises/face-pull", hrefAr: "/ar/exercises/face-pull", labelEn: "Face pull — the rear-delt balance", labelAr: "سحب الوجه — توازن الدالية الخلفية" },
      { hrefEn: "/blog/12-week-dumbbell-band-muscle-plan", hrefAr: "/ar/blog/home-muscle-building-guide-simple-weights", labelEn: "12-week dumbbell & band muscle plan", labelAr: "بناء العضلات في المنزل بأوزان بسيطة" },
    ],
  },

  "face-pull": {
    intro: {
      en: "The face pull is the counterweight of modern training: one movement, one rope on a high pulley, and a pull toward the face that trains the exact muscles the desk and the bench press leave behind — rear delts, mid-back, and the shoulder's external rotators. The instructions compress it to a single line, and that line holds everything: pull to the face, separate the hands, upper arms parallel to the floor. It has become the accessory every program with a conscience books, because it strengthens the pulling side of the shoulder's balance sheet. For anyone whose shoulders live rounded over a desk or a barbell, it is the small, light, quietly protective movement that keeps the joint healthy — which is why it never leaves a balanced program.",
      ar: "سحب الوجه هو الثقل الموازن للتدريب الحديث: حركة واحدة وحبل واحد على بكرة عالية وسحب نحو الوجه يدرّب العضلات التي يتركها المكتب والبنش برس خلف الظهر — الدالية الخلفية ومنتصف الظهر ومديرات الكتف الخارجية. تضغط التعليمات كل شيء في سطر واحد، وذلك السطر يحمل كل شيء: اسحب نحو الوجه وافصل اليدين والذراعان العلويتان موازيتان للأرض. صار الملحق الذي يحجزه كل برنامج لديه ضمير، لأنه يقوي جانب السحب من ميزان الكتف. ولكل من تعيش أكتافه منحنية فوق مكتب أو بار، هي الحركة الصغيرة الخفيفة الواقية بهدوء التي تحفظ صحة المفصل — ولهذا لا تغادر أبدًا برنامجًا متوازنًا.",
    },
    sections: {
      en: {
        muscles: "The rear delts lead — the library's primary billing — pulling the upper arms back and out as the hands separate beside the face. The mid-back's rhomboids and mid-traps pull the shoulder blades together behind the rep, and the external rotators — the rotator cuff's small steering muscles — work through the pull's final twist in a way almost no other gym movement trains. That final twist is the exercise's quiet gift: the cuff gets loaded in its protective role, at a load a rope and a stack can safely deliver, which is precisely what the heavy pressing movements never provide.",
        mistakes: [
          { error: "Loading heavy and rowing to the chest with elbows down.", fix: "Keep the elbows high and wide, upper arms parallel to the floor as the instructions state — a heavy face pull with low elbows is just a row wearing a rope's costume." },
          { error: "Leaning back to meet the rope halfway.", fix: "The body stays tall; the rope travels to the face, not the face to the rope — every inch of leanback is a rep the rear delts never pulled." },
          { error: "Skipping the external-rotation finish at the end of the pull.", fix: "The hands finish beside the ears with knuckles rotated back — the instructions' separating-hands cue exists to load the cuff's twist; a pull that stops short is half the exercise." },
          { error: "Rushing reps so the stack clatters between pulls.", fix: "Two seconds out with the squeeze at the face, two seconds back — the movement's value is tension in small muscles, and speed deletes exactly that." },
        ],
        alternatives: "Band face pulls — anchored anywhere, identical pattern — are the home version this library's band pages echo, and many lifters prefer them for the feel of the resistance rising through the pull. Rear-delt flyes load the same muscle without the rotation component. Wide-grip rows to the chest hit the mid-back more and the cuff less. The reverse pec deck offers a machine-steady rear-delt alternative. None of them twist the cuff the way the rope does — the twist is this movement's fingerprint.",
        progression: "The ladder climbs by feel and strictness, not by plates: begin with a load allowing three sets of fifteen with the elbows-high law intact, and progress by adding reps to twenty before adding weight. The honest progressions are technical — a two-second hold beside the ears, a slower return, kneeling instead of standing to strip the leanback escape route. Advanced trainees add sets rather than load; the movement's ceiling is concentration, and concentration is not measured in kilograms.",
        programming: "Book it as daily-ish insurance or a session accessory: 2-4 sets of 12-20 slow reps, 45-60 seconds of rest, two to four times a week — it is light enough to run between heavy sessions and valuable enough to run that often. The classic slot is the end of an upper or push day, balancing the session's pressing; the ambitious slot is every training day, as posture homework between bigger lifts. Our program templates carry it in both slots.",
        safety: "The face pull is itself a safety feature — it strengthens the cuff that heavier movements endanger — and its own risks are almost entirely self-inflicted: heavy loads collapse the form into a row, and the collapsing version stops protecting anyone. Keep the elbows high, the load modest, and the tempo slow; if the shoulders clunk or pinch at the end-range twist, shorten the final rotation to the comfortable zone and let it grow. Rotator-cuff rehabilitation is a clinician's program — this page is the healthy-shoulder maintenance one.",
      },
      ar: {
        muscles: "الدالية الخلفية تقود — الفاتورة الأساسية للمكتبة — فتسحب أعلى الذراعين للخلف والخارج مع انفصال اليدين بجانب الوجه. ومعينات الظهر وترابيسه الوسطى تجمعان لوحي الكتف خلف التكرار، ومديرات الكتف الخارجية — عضلات الكفة الدوارة الصغيرة الموجِّهة — تعمل عبر اللفّة الأخيرة من السحب بطريقة لا يدرّبها أي تمرين صالة آخر تقريبًا. تلك اللفة الأخيرة هدية الحركة الصامتة: فالكفة تُحمل في دورها الوقائي، بحمل يستطيع حبل ورصة تسليمه بأمان، وهذا بالضبط ما لا توفره حركات الدفع الثقيلة أبدًا.",
        mistakes: [
          { error: "التحميل الثقيل والتجديف إلى الصدر بمرفقين منخفضين.", fix: "أبقِ المرفقين عاليين واسعين والذراعين العلويتين موازيتين للأرض كما تنص التعليمات — فالسحب الثقيل بمرفقين منخفضين مجرد تجديف بزيّ حبل." },
          { error: "الميل للخلف لملاقاة الحبل في منتصف الطريق.", fix: "يبقى الجسم شامخًا؛ فالحبل يسافر إلى الوجه لا الوجه إلى الحبل — وكل شبر ميل خلفي تكرار لم تسحبه الدالية الخلفية." },
          { error: "تخطي لفّة المديرات الخارجية في نهاية السحب.", fix: "تنتهي اليدان بجانب الأذنين والمفاصل مستديرة للخلف — فإشارة انفصال اليدين في التعليمات موجودة لتحميل لفّة الكفة؛ والسحب المتوقف قبلها نصف التمرين." },
          { error: "استعجال التكرارات حتى تقرقع الرصة بين السحبات.", fix: "ثانيتان خارجًا مع العصرة عند الوجه وثانيتان عودة — فقيمة الحركة شدّ في عضلات صغيرة، والسرعة تحذف ذلك بالضبط." },
        ],
        alternatives: "سحب الوجه بالمطاط — مرتكز في أي مكان والنمط مطابق — هو النسخة المنزلية التي ترددها صفحات المطاط في مكتبتنا، ويفضله كثيرون لإحساس المقاومة تصعد خلال السحب. وتفتيح الدالية الخلفية يحمل العضلة نفسها بلا مكون الدوران. والتجديف الواسع إلى الصدر يصيب منتصف الظهر أكثر والكفة أقل. وماكينة الصدر الخلفي تقدم بديلًا خلفيًا ثابت الماكينة. ولا يلفّ أحد منها الكفة كما يفعل الحبل — فاللفّة بصمة هذه الحركة.",
        progression: "يصعد السلم بالإحساس والصرامة لا بالأقراص: ابدأ بحمل يسمح بثلاث مجموعات من خمس عشرة وقانون المرفقين العاليين سالمًا، وتقدم بإضافة التكرارات إلى عشرين قبل إضافة الوزن. والتدرجات الأمينة فنية — توقف ثانيتين بجانب الأذنين، وعودة أبطأ، والركوع بدل الوقوف لقطع طريق هروب الميل الخلفي. ويضيف المتقدمون مجموعات لا حملًا؛ فسقف الحركة التركيز، والتركيز لا يقاس بالكيلوجرام.",
        programming: "احجزه تأمينًا شبه يومي أو ملحق جلسة: 2-4 مجموعات من 12-20 تكرارًا بطيئًا براحة 45-60 ثانية، مرتين إلى أربع أسبوعيًا — فهو أخف من أن يجري بين الجلسات الثقيلة وثمين من أن يجري بهذا الكثرة. والخانة الكلاسيكية نهاية يوم علوي أو دفع توازنًا لدفع الجلسة؛ والخانة الطموحة كل يوم تدريب كواجب وضعية بين الرفعات الأكبر. وقوالب برامجنا تحمله في الخانتين.",
        safety: "سحب الوجه نفسه ميزة أمان — فلقوي الكفة التي تهددها الحركات الأثقل — ومخاطره الذاتية كلها تقريبًا ذاتية المنشأ: الأحمال الثقيلة تنهار الوضعية إلى تجديف، والنسخة المنهارة تتوقف عن حماية أي أحد. أبقِ المرفقين عاليين والحمل متواضعًا والإيقاع بطيئًا؛ وإذا جلبت الأكتاف أو وخزت عند لفّة النهاية فقصّر الدوران الأخير إلى منطقة الراحة ودعه ينمو. وتأهيل الكفة الدوارة برنامج طبيب — وهذه الصفحة برنامج صيانة الكتف السليم.",
      },
    },
    faq: {
      en: [
        { q: "Where should the pulley be set?", a: "High, as this page's single-line instruction stages it — slightly above head height is the classic setting, so the pull travels down-and-toward the face. A mid or low anchor changes the arc's angle (and some programs rotate anchors deliberately); learn the high version first because it is the one the shoulder's rear line reads most naturally." },
        { q: "Why is the face pull so light compared to my other lifts?", a: "Because the target muscles are small and the leverage is long — the rear delt and cuff are steering muscles, not towing muscles. A stack weight most lifters can move with one arm is a working load here; the moment the load forces body English, it has left the exercise's job description and started training your ego instead." },
        { q: "Can I do face pulls every day?", a: "Yes — with light loads and strict form, daily face pulls are the posture homework many coaches assign between sessions. The practical frame: two to four quality sessions a week covers the maintenance job; daily adds a little polish at no real cost, so long as the elbows stay high and the stack stays modest." },
      ],
      ar: [
        { q: "أين أضبط البكرة؟", a: "عالية كما يجيزها سطر التعليمات الوحيد في هذه الصفحة — فوق مستوى الرأس قليلًا هو الإعداد الكلاسيكي، فيسافر السحب نحو الأسفل والأمام نحو الوجه. والارتكاز الأوسط أو المنخفض يغير زاوية القوس (وتدير بعض البرامج الارتكازات عمدًا)؛ تعلم النسخة العالية أولًا لأنها التي تقرأها الخط الخلفي للكتف أكثر طبيعية." },
        { q: "لماذا سحب الوجه خفيف جدًا مقارنة برفعاتي الأخرى؟", a: "لأن العضلات المستهدفة صغيرة والرافعة طويلة — فالدالية الخلفية والكفة عضلات توجيه لا قطر. وزن رصة يحركه أغلب المتدربين بذراع واحدة حمل عمل هنا؛ وما إن يفرض الحمل مكر الجسد حتى يكون قد غادر وصف وظيفة التمرين وبدأ تدريب أناك بدلًا منك." },
        { q: "هل أؤدي سحب الوجه يوميًا؟", a: "نعم — بأحمال خفيفة ووضع صارم، السحب اليومي للوجه واجب الوضعية الذي يكلفه كثير من المدربين بين الجلسات. والإطار العملي: جلستان إلى أربع جودة أسبوعيًا تغطيان وظيفة الصيانة؛ واليومي يضيف لمسة صقل بلا كلفة حقيقية ما بقي المرفقان عاليين والرصة متواضعة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/side-laterals-to-front-raise", hrefAr: "/ar/exercises/side-laterals-to-front-raise", labelEn: "Side laterals — the other delt heads", labelAr: "الرفع الجانبي — رؤوس الدالية الأخرى" },
      { hrefEn: "/blog/warm-up-before-lifting-5min-routine", hrefAr: "/ar/blog/best-dynamic-stretching-before-gym", labelEn: "5-minute warm-up before lifting", labelAr: "الإحماء الديناميكي قبل الجيم" },
      { hrefEn: "/blog/deload-week-structure-strength-gains", hrefAr: "/ar/blog/deload-week-guide", labelEn: "Deload weeks — when shoulders rest", labelAr: "أسبوع التفريغ — حين ترتاح الأكتاف" },
    ],
  },

  "barbell-squat": {
    intro: {
      en: "The barbell back squat is the lift the whole library organizes itself around: bar on the shoulders, medium stance, descend until the thigh-calf angle passes just below ninety degrees, drive the floor away. The instructions carry the full law — rack for safety, head up, back straight, knees tracking the toes — and the exercise pays the fullest dividend in muscle of anything on two legs: quads front and center with glutes, hamstrings, calves and lower back on the library's own secondary list. Legs carry the site's largest keyword families in both languages, and every serious program page on Alkemos routes through this bar. It is the movement you spend a lifetime learning and never finish.",
      ar: "السكوات بالبار على الظهر هو الرفعة التي تنظم المكتبة كلها نفسها حولها: بار على الكتفين ووقفة متوسطة وهبوط حتى تتجاوز زاوية الفخذ والسمانة تسعين درجة قليلًا ثم دفع الأرض بعيدًا. تحمل التعليمات القانون كاملًا — رف للأمان ورأس مرفوع وظهر مستقيم وركبتان تتبعان أصابع القدم — وتدفع الحركة أوسع عائد عضلي لأي شيء على ساقين: الفخذ الأمامي في الصدارة والألويات وأوتار الفخذ والسمانة وأسفل الظهر على قائمة المكتبة المساعدة نفسها. تحمل الأرجل أكبر عائلتي كلمات مفتاحية في الموقع باللغتين، وكل صفحة برنامج جادة في الموقع تمر عبر هذا البار. إنها الحركة التي تقضي عمرًا تتعلمها ولا تتمها أبدًا.",
    },
    sections: {
      en: {
        muscles: "The quads extend the knee out of the bottom — the primary billing the library assigns — and the glutes and hamstrings extend the hip alongside them, which is why squat depth is a hip exercise as much as a knee one. The lower back holds the torso's angle isometrically for every second of every set, the calves stabilize the ankle through the whole descent, and the whole trunk braces like a pressure cylinder around the bar's argument with gravity. The instructions' knee law — tracking the toes, not past them — is the geometry that keeps all of these working in their strongest lines.",
        mistakes: [
          { error: "Knees collapsing inward as the weight gets heavy.", fix: "Spread the floor — screw the feet outward like standing on two dinner plates — and the knees ride their toes' line; the collapse is a hip-strength memo, and the fix is the cue plus stronger hips." },
          { error: "Losing the chest and folding forward out of the bottom.", fix: "Head up, chest loaded, back straight — the instructions' checklist; a folding squat is a upper-back-and-core problem wearing a leg costume, and lighter loads fix the angle faster than heavier loads break it." },
          { error: "Cutting depth above parallel and calling it a squat.", fix: "The instructions define the bottom — slightly below ninety degrees at the thigh — and half-squats train half the muscle; if depth fails at a load, the load is a ceiling, not the depth is a flaw." },
          { error: "Bouncing out of the bottom with a loose trunk.", fix: "Brace before the descent and keep the brace through the turn — a bounce with a soft trunk spends the rep on the spine's patience rather than the legs' strength." },
        ],
        alternatives: "The front squat — its page sits in this library — moves the bar forward and the torso upright, trading load for quad focus. The leg press loads the same muscles with the balance handled; the goblet and dumbbell squats teach the pattern with friendlier loads. Lunges and split squats work one leg at a time and expose side differences. At home, the bodyweight squat and its jump variations keep the pattern alive — this library's home programs are built on exactly that squat ladder.",
        progression: "Earn the pattern with the empty bar: the first weeks are ankle, knee and hip learning to share one rhythm, filmed from the side until the thigh-parallel bottom is visible and repeatable. Load climbs in 2.5-5 kilo jumps while the positions hold, and the classic ladder then alternates blocks — five-by-five for strength, eights-to-twelves for hypertrophy — with a deload week when the bar starts winning arguments. Depth before load, load before volume, and the order is never up for vote.",
        programming: "Program it as the main lift of a lower day: 3-5 work sets of 3-10 reps with 3-5 minutes of rest, once or twice a week — two squat days suits intermediate blocks, spaced three days apart, and our 5×5 program schedules exactly that. It pairs with the deadlift across the week rather than inside one session, with the hinge work following the squat inside the same day for most lifters. After the work sets, lighter back-off sets build volume at the same groove.",
        safety: "The rack is the safety system — set the pins just below the deepest bottom, so a failed rep ends on steel rather than on you; the instructions open with the rack for exactly this reason. The lower back's flatness under load is the lift's whole insurance policy: a rounding squat is a failing squat no matter the weight. Knee tracking stays over the toes, depth goes only as deep as the hips allow with a neutral spine, and lifters with knee history should let painless range set the depth law rather than any page's geometry.",
      },
      ar: {
        muscles: "يمدّ الفخذ الأمامي الركبة خارج القاع — الفاتورة الأساسية التي تسندها المكتبة — وتمدّ الألويات وأوتار الفخذ الورك رفيقةً، ولهذا فعمق السكوات تمرين ورك بقدر ما هو تمرين ركبة. ويحمل أسفل الظهر زاوية الجذع ثباتيًا كل ثانية من كل مجموعة، وتثبت السمانة الكاحل طوال الهبوط، ويُشدّ الجذع كله كأسطوانة ضغط حول حجة البار مع الجاذبية. وقانون الركبة في التعليمات — تتبع أصابع القدم لا تجاوزها — هو الهندسة التي تبقي الجميع يعمل في أقوى خطوطه.",
        mistakes: [
          { error: "انهيار الركبتين للداخل مع ثقل الوزن.", fix: "افرح الأرض — فُتّ القدمين للخارج كأنك تقف على طبقي عشاء — فتركب الركبتان خط أصابعهما؛ والانهيار مذكرة قوة وركين، والإصلاح هو الإشارة زائد وركان أقوى." },
          { error: "فقدان الصدر والانطواء أمامًا خارج القاع.", fix: "رأس مرفوع وصدر محمل وظهر مستقيم — قائمة تحقق التعليمات؛ فالسكوات المنطوي مشكلة ظهر علوي وجذع بزيّ ساق، والأحمال الأخف تصلح الزاوية أسرع مما يكسرها الأثقل." },
          { error: "قصر العمق فوق الموازاة وتسميته سكوات.", fix: "تحدد التعليمات القاع — تحت تسعين درجة قليلًا عند الفخذ — وأنصاف السكوات تدرّب نصف العضلة؛ وإذا فشل العمق عند حمل فالحمل سقف لا العمق عيب." },
          { error: "الارتداد من القاع بجذع مرتخ.", fix: "اشدد قبل الهبوط واحفظ الشدّ عبر المنعطف — فالنطة بجذع لين تنفق التكرار على صبر العمود لا على قوة الساقين." },
        ],
        alternatives: "السكوات الأمامي — صفحته في هذه المكتبة — يحرك البار أمامًا والجذع أعلى، مقايضًا حملًا بتركيز فخذ أمامي. وليج برس يحمل العضلات نفسها مع تولي التوازن، وسكوات الجوبلت والدمبل يعلمان النمط بأحمال ألطف. والطعنات والسكوات المتقسمة تعملان ساقًا واحدة وتكشفان فروق الجهتين. ومنزليًا، سكوات وزن الجسم وقفزاته يبقيان النمط حيًا — وبرامجنا المنزلية مبنية على سلم السكوات هذا بالضبط.",
        progression: "اكسب النمط ببار فارغ: الأسابيع الأولى كاحل وركبة وورك يتعلمان مشاركة إيقاع واحد، مصورًا من الجانب حتى يصبح قاع موازاة الفخذ مرئيًا قابلًا للتكرار. يصعد الحمل بقفزات 2.5-5 كجم مع ثبات المواضع، ثم يناوب السلم الكلاسيكي الكتل — خمس×خمس للقوة وثمانيات إلى ثنيات عشر للتضخيم — مع أسبوع تفريغ حين يبدأ البار بكسب الجدالات. العمق قبل الحمل والحمل قبل الحجم، والترتيب لا يطرح للتصويت أبدًا.",
        programming: "برمجه كرفعة اليوم الرئيسية ليوم سفلي: 3-5 مجموعات عمل من 3-10 تكرارات براحة 3-5 دقائق، مرة أو مرتين أسبوعيًا — يومان للسكوات يناسبان كتل الوسط بتباعد ثلاثة أيام، وبرنامج 5×5 لدينا يجدول ذلك بالضبط. يقترن بالديدلفت عبر الأسبوع لا داخل جلسة، وعمل المفصلة يتبع السكوات داخل اليوم نفسه لأغلب المتدربين. وبعد مجموعات العمل تبني مجموعات التراجع الأخف حجمًا على الأخدود نفسه.",
        safety: "الرف هو نظام الأمان — اضبط الأوتاد تحت أعمق قاع قليلًا، فينتهي التكرار الفاشل على الفولاذ لا عليك؛ ولهذا تفتتح التعليمات بالرف تحديدًا. واستواء أسفل الظهر تحت الحمل بوليصة التأمين كلها للرفعة: فالسكوات المتقوس سكوات فاشل مهما كان الوزن. تبقى مسار الركبة فوق أصابع القدم، وينزل العمق فقط إلى ما تسمحه الوركان بعمود محايد، ومن لديه تاريخ ركبة فليدع المدى الخالي من الألم يضع قانون العمق لا هندسة أي صفحة.",
      },
    },
    faq: {
      en: [
        { q: "How deep should I squat?", a: "The instructions draw the line: descend until the upper-leg-to-calf angle is slightly less than ninety degrees — commonly read as just below parallel — with a straight back throughout. Depth beyond that belongs to lifters whose hips allow it painlessly; depth short of it is a load-management decision that should be deliberate, not accidental." },
        { q: "Do squats damage the knees?", a: "Squats done to the depth the hips allow, with knees tracking the toes and loads that respect the form, are the knees' best friend — the library's own instructions build exactly that geometry. Knee pain in squatting usually announces a load, a depth, or a tracking error rather than a verdict on the exercise itself; the fix is technical, and our home squat progressions teach it." },
        { q: "Low-bar or high-bar position?", a: "The instructions place the bar slightly below the neck across the back of the shoulders — the high-bar default this page teaches, upright enough for general training. Low-bar sits a hand lower down the back, tips the torso forward, and lets powerlifters move more weight. Both are squats; the page's version is the one every general program starts from." },
      ],
      ar: [
        { q: "ما عمق السكوات الصحيح؟", a: "ترسم التعليمات الخط: انزل حتى تصبح زاوية الفخذ مع السمانة أقل من تسعين درجة قليلًا — وتقرأ عادة كأسفل الموازاة بقليل — مع ظهر مستقيم طوال الوقت. وما بعد ذلك عمق لمن تسمح وركاه به بلا ألم؛ وما قبله قرار إدارة حمل ينبغي أن يكون مقصودًا لا عرضيًا." },
        { q: "هل يؤذي السكوات الركبتين؟", a: "السكوات المأدى إلى عمق تسمحه الوركان، وبركبتين تتبعان أصابع القدم وأحمال تحترم الوضعية، أفضل صديق للركبتين — وتعليمات المكتبة نفسها تبني تلك الهندسة بالضبط. وألم الركبة أثناء السكوات يعلن عادة خطأ حمل أو عمق أو مسارًا لا حكمًا على التمرين نفسه؛ والإصلاح تقني، وسلوم السكوات المنزلية لدينا تعلمه." },
        { q: "وضع البار المنخفض أم المرتفع؟", a: "تضع التعليمات البار أسفل الرقبة قليلًا عبر ظهر الكتفين — الوضع المرتفع الافتراضي الذي تعلمه هذه الصفحة، منتصب بما يكفي للتدريب العام. والوضع المنخفض يجلس أقل بكف على الظهر، يميل الجذع أمامًا، ويتيح للاعبي القوة تحريك وزن أكبر. كلاهما سكوات؛ ونسخة الصفحة هي التي يبدأ منها كل برنامج عام." },
      ],
    },
    links: [
      { hrefEn: "/exercises/front-squat-clean-grip", hrefAr: "/ar/exercises/front-squat-clean-grip", labelEn: "Front squat — the upright variation", labelAr: "السكوات الأمامي — التنويع المنتصب" },
      { hrefEn: "/programs/gym-strength-5x5", hrefAr: "/ar/programs/gym-strength-5x5", labelEn: "5×5 strength program — squats at the center", labelAr: "برنامج القوة 5×5 — السكوات في المركز" },
      { hrefEn: "/blog/deload-week-structure-strength-gains", hrefAr: "/ar/blog/optimal-rest-periods-resistance-training", labelEn: "Deload weeks for strength gains", labelAr: "فترات الراحة للرفعات الثقيلة" },
    ],
  },

  "front-squat-clean-grip": {
    intro: {
      en: "The front squat takes the barbell squat's argument and moves it to the front of the body: bar racked on the deltoids against the collarbones, fingertips holding it steady, torso bolt-upright because the bar's position leaves no alternative. The instructions carry the clean grip's two laws — elbows high, bar touching lightly at the throat — and the exercise repays the discipline with the most honest quad work in the library and a trunk that has no choice but to brace. It is the intermediate's squat: humbler loads than the back squat, straighter lines, and a front-rack position that doubles as mobility training every single set.",
      ar: "السكوات الأمامي يأخذ حجة سكوات البار وتنقلها إلى مقدمة الجسم: بار مستقر على الداليات مقابل الترقوتين وأطراف أصابع تثبته وجذع منتصب تمامًا لأن موضع البار لا يترك بديلًا. تحمل التعليمات قانوني قبضة الكلين — مرفقان عاليان وبار يلامس الحلق برفق — وتسدد الحركة أمانة الانضباط بأصدق عمل فخذ أمامي في المكتبة وجذع لا خيار له إلا الشد. إنه سكوات المتوسطين: أحمال أكثر تواضعًا من سكوات الظهر وخطوط أكثر استقامة ووضع رف أمامي يخدم تمرين مرونة في كل مجموعة.",
    },
    sections: {
      en: {
        muscles: "The quads carry the front squat's primary billing — the upright torso stacks the load over the knees and the quads lift it — with the abs working harder than in any back squat variation, as the library's secondary list notes first. The glutes and hamstrings still extend the hips, the upper back fights to keep the elbows and chest tall, and the whole anterior chain holds the bar's shelf. The clean grip is not decoration: it demands wrist, elbow and shoulder mobility the back rack never asks about, which is why the front squat quietly doubles as the most specific mobility work a barbell can assign.",
        mistakes: [
          { error: "Elbows dropping until the bar tries to roll off the chest.", fix: "Elbows up is the lift's first law — the instructions say it twice; think of pointing both elbows at the wall ahead, and the bar's shelf stays level through the whole squat." },
          { error: "Rounding forward and catching the bar with bent wrists.", fix: "The upright torso is not a style choice but the exercise's physics — when the chest falls, the bar goes with it; drop the load until the position holds for every rep." },
          { error: "Gripping the bar with a full fist and choking the wrists.", fix: "Fingertips only, as the instructions prescribe — one, two or three fingers per side; the grip holds the bar's balance, the shoulders and chest hold its weight, and the wrists stay guests, not hosts." },
          { error: "Squatting to a depth the upright torso cannot afford.", fix: "Depth is a hip-and-ankle decision under an upright spine — take the depth where the elbows stay high and the spine stays tall, and let the range grow as the front rack matures." },
        ],
        alternatives: "The back squat — this library's flat-flagship page — loads heavier and forgives the torso angle; the goblet squat teaches the same upright pattern with a bell held at the chest and no rack demands. The Zercher squat carries the bar in the elbows for the brave; leg press removes the trunk entirely. The front squat itself is the Olympic lifter's assistant lift and the general trainee's posture medicine — the alternatives orbit it, not the reverse.",
        progression: "The front rack is the first ladder: wrist stretches, then the bar-in-rack hold with rising elbow height, then empty-bar front squats — weeks of pattern before the first plate. Load climbs conservatively — the front squat typically runs 15-25 kilos behind a lifter's back squat for years — and the honest progressions are positional: elbows higher, depth deeper, tempo slower. When the rack position fatigues before the legs, the set is over; training past a collapsing rack teaches the bar bad habits about your collarbones.",
        programming: "Program it as a secondary squat or the main lift of a quad-focused block: 3-4 sets of 5-8 reps with 2-4 minutes of rest, once a week for most programs — the movement's bracing cost runs high even at modest bar loads. It slots beautifully after back squats on a lower day, or as the primary squat on a day dedicated to the quads' straight lines. In our program templates it rotates with the back squat across blocks, the two squats trading the spotlight.",
        safety: "The rack position is the whole safety story: the bar sits at the throat — lightly, as the instructions specify, never crushing the airway — and the fingertips hold a bar that would otherwise have opinions about your face. Failed reps exit forward off the chest onto the pins; practice the bail with an empty bar before you ever need it under load. Wrist complaints are a grip-width and mobility memo, not a badge; the crossed-arms grip is a legitimate variation this library acknowledges when the clean grip needs a season off.",
      },
      ar: {
        muscles: "يحمل الفخذ الأمامي الفاتورة الأساسية للسكوات الأمامي — فالجذع المنتصب يكدس الحمل فوق الركبتين والفخذ يرفعه — ويعمل البطن أجهد من أي تنويع لسكوات الظهر كما تسجل قائمة المكتبة المساعدة أولًا. وما تزال الألويات وأوتار الفخذ تمدّان الوركين، والظهر العلوي يقاتل لإبقاء المرفقين والصدر عاليين، والسلسلة الأمامية كلها تحمل رفّ البار. وقبضة الكلين ليست زينة: فهي تطلب مرونة رسغ ومرفق وكتف لا يسأل عنها الرف الخلفي أبدًا، ولهذا يخدم السكوات الأمامي بصمت كأخصر عمل مرونة يكلف به البار.",
        mistakes: [
          { error: "هبوط المرفقين حتى يحاول البار التدحرج عن الصدر.", fix: "المرفقان أعلى هو القانون الأول للرفعة — تقوله التعليمات مرتين؛ تخيل توجيه المرفقين نحو الحائط أمامك فيبقى رفّ البار مستويًا طوال السكوات." },
          { error: "الانطواء أمامًا والتقاط البار برسغين مثنيين.", fix: "الجذع المنتصب ليس خيار أسلوب بل فيزياء التمرين — فحين يسقط الصدر يذهب البار معه؛ انزل بالحمل حتى تثبت الوضعية لكل تكرار." },
          { error: "القبض على البار بقبضة كاملة وخنق الرسغين.", fix: "أطراف الأصابع فقط كما تصف التعليمات — إصبع أو اثنان أو ثلاثة لكل جهة؛ فالقبضة تحفظ توازن البار والكتفان والصدر يحملان وزنه، ويبقى الرسغان ضيفين لا مضيفين." },
          { error: "السكوات إلى عمق لا يتحمله الجذع المنتصب.", fix: "العمق قرار ورك وكاحل تحت عمود منتصب — خذ العمق حيث يبقى المرفقان عاليين والعمود شامخًا، ودع المدى ينمو مع نضج الرف الأمامي." },
        ],
        alternatives: "سكوات الظهر — صفحة العلم المسطح في هذه المكتبة — يحمل أثقل ويسامح زاوية الجذع؛ وسكوات الجوبلت يعلم النمط المنتصب نفسه بجرس على الصدر بلا مطالب رف. وسكوات زيرتشر يحمل البار في المرفقين للشجعان، وليج برس يزيل الجذع كليًا. والسكوات الأمامي نفسه رفعة مساعدة للاعب الأولمبي ودواء وضعية للمتدرب العام — والبدائل تدور حوله لا العكس.",
        progression: "الرف الأمامي هو السلم الأول: تمطيط رسغين، ثم تثبيت البار في الرف مع صعود ارتفاع المرفقين، ثم سكوات أمامي ببار فارغ — أسابيع من النمط قبل أول قرص. يصعد الحمل بتحفظ — فالسكوات الأمامي يتخلف عادة 15-25 كيلوجرامًا عن سكوات الظهر لسنوات — والتدرجات الأمينة موضعية: مرفقان أعلى وعمق أعمق وإيقاع أبطأ. وحين يتعب وضع الرف قبل الساقين تنتهي المجموعة؛ فالتدرب بعد انهيار الرف يعلم البار عادات سيئة عن ترقوتك.",
        programming: "برمجه سكواتًا ثانويًا أو رفعة أساسية لكتلة مركزة على الفخذ الأمامي: 3-4 مجموعات من 5-8 تكرارات براحة 2-4 دقائق، مرة أسبوعيًا لأغلب البرامج — فكلفة الشد في الحركة عالية حتى مع أحمال بار متواضعة. يستقر بجمال بعد سكوات الظهر في يوم سفلي، أو سكواتًا رئيسيًا في يوم مخصص لخطوط الفخذ المستقيمة. وفي قوالب برامجنا يتناوب مع سكوات الظهر عبر الكتل، متبادلًا الضوءين.",
        safety: "وضع الرف هو قصة السلامة كلها: فالبار يجلس عند الحلق — برفق كما تحدد التعليمات، دون سحق مجرى الهواء أبدًا — وأطراف الأصابع تحمل بارًا سيكون له رأي في وجهك غير ذلك. التكرارات الفاشلة تخرج أمامًا عن الصدر إلى الأوتاد؛ تمرن على الهروب ببار فارغ قبل أن تحتاجه يومًا تحت حمل. وشكاوى الرسغ مذكرة عرض قبضة ومرونة لا وسامًا؛ والقبضة المتقاطعة تنويع مشروع تقر به هذه المكتبة حين تحتاج قبضة الكلين إجازة موسم.",
      },
    },
    faq: {
      en: [
        { q: "I can't get my elbows up — is the front squat impossible for me?", a: "Not impossible, just scheduled: the clean grip needs wrist and shoulder range most adults must rebuild, and the library's own instructions meet you there with the fingertips-only hold. Weeks of front-rack holds and wrist stretches open the position for most lifters; the crossed-arms grip is the standing bridge while the range arrives." },
        { q: "Why is my front squat so much lighter than my back squat?", a: "Geometry: the upright torso takes the hips' strongest leverage away and hands the load to the quads and a braced trunk — a front squat around 80 percent of your back squat is an ordinary, healthy spread. The gap is not a weakness to close but two different exercises to log separately, exactly as this library treats them." },
        { q: "Is the front squat better for posture than the back squat?", a: "It trains the upright-position muscles — upper back, trunk, the posture chain — through every loaded rep, which is why coaches prescribe it as posture medicine; the back squat trains the same trunk harder in a different angle. Better is the wrong yardstick: the front squat is more specific to standing tall under load, and that specificity is its gift." },
      ],
      ar: [
        { q: "لا أستطيع رفع مرفقيّ — هل السكوات الأمامي مستحيل لي؟", a: "ليس مستحيلًا بل مجدول: فقبضة الكلين تحتاج مدى رسغ وكتف يعيد أغلب البالغين بناءه، وتستقبلك تعليمات المكتبة نفسها هناك بمسك أطراف الأصابع فقط. أسابيع من تثبيت الرف الأمامي وتمطيط الرسغين تفتح الوضع لأغلب المتدربين؛ والقبضة المتقاطعة الجسر القائم حتى يصل المدى." },
        { q: "لماذا سكواتي الأمامي أخف كثيرًا من الخلفي؟", a: "الهندسة: فالجذع المنتصب يسلب الوركين أقوى رافعةما ويسلم الحمل للفخذ الأمامي وجذع مشدود — وسكوات أمامي حول 80 بالمئة من خلفيك فارق عادي صحي. والفجوة ليست ضعفًا يُسد بل تمرينان مختلفان يسجلان منفصلين، تمامًا كما تعاملهما هذه المكتبة." },
        { q: "هل السكوات الأمامي أفضل للوضعية من الخلفي؟", a: "يدرّب عضلات الوضع المنتصب — الظهر العلوي والجذع وسلسلة الوضع — عبر كل تكرار محمل، ولهذا يصفه المدربون دواءً للوضعية؛ وسكوات الظهر يدرّب الجذع نفسه أشد في زاوية مختلفة. و«أفضل» مسطرة خاطئة: فالأمامي أكثر تخصصًا في الوقوف شامخًا تحت الحمل، وذلك التخصص هديته." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-squat", hrefAr: "/ar/exercises/barbell-squat", labelEn: "Barbell back squat — the heavier sibling", labelAr: "سكوات الظهر بالبار — الشقيق الأثقل" },
      { hrefEn: "/blog/warm-up-before-lifting-5min-routine", hrefAr: "/ar/blog/best-dynamic-stretching-before-gym", labelEn: "5-minute warm-up for the front rack", labelAr: "الإحماء الديناميكي قبل الجيم" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Intermediate gym program", labelAr: "برنامج الصالة للمتوسطين" },
    ],
  },
};
