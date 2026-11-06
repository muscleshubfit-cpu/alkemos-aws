/**
 * EXERCISES-ENRICHMENT — BATCH 16 (tail batch 2, exercises 76-80 of the
 * enrichment program; growth-plan Phase 3 — owner order 2026-11-06
 * «حسّن صفحات التمارين والأطعمة الموجودة بالفعل، وفق احتياجات الجودة
 * والبحث والفهرسة» — direction-correction session, the proven 430 pattern
 * on EXISTING thin pages, zero new routes).
 *
 * Chest half #2: five classic mid-library movements (incline-dumbbell-press
 * · incline-dumbbell-flyes · push-ups-with-feet-elevated ·
 * wide-grip-barbell-bench-press · medicine-ball-chest-pass). Every fact
 * quoted about each movement (the palms-facing start, the 30-degree incline
 * cap, the 36-inch hand set, the three-inches-past-shoulder grip, the
 * partner-or-wall throw) comes from the exercise's own row in
 * src/lib/exercises.ts; programming numbers are standard coaching
 * prescription stated as practice guidance.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_16: Record<string, ExerciseEnrichment> = {
  "incline-dumbbell-press": {
    intro: {
      en: "The incline dumbbell press is where upper-chest training stops being an afterthought. The library's steps run the full choreography: bells kicked up one at a time with the thighs' help, palms rotated forward at shoulder width, then a chest-driven press to a locked, held peak — with the descent prescribed at twice the speed of the ascent. Where a barbell locks the hands in one line, two independent dumbbells let each shoulder find its own path, which is why this page is the fix most lifters reach for when the flat press stalls.",
      ar: "برس الدمبل المائل هو حيث يتوقف تدريب الصدر العلوي عن كونه فكرة لاحقة. خطوات المكتبة تدير الاستعراض كاملًا: جرسان يُرفعان واحدًا بعد الآخر بمساعدة الفخذين، وراحتان تستديران للأمام عند عرض الكتفين، ثم دفعة يقودها الصدر إلى قمة مقفلة تُثبت — مع وصفة نزول تستهلك ضعف زمن الصعود. وحيث يقفل البار اليدين على خط واحد، يتيح دمبلان مستقلان لكل كتف أن يجد مساره الخاص، ولهذا تكون هذه الصفحة هي الحل الذي يمده أغلب الرافعين حين يتعطل البرس المسطح.",
    },
    sections: {
      en: {
        muscles: "The upper fibers of the pectoralis major own the press, and the incline is what recruits them — the steeper the bench, the more the load shifts from the whole chest toward the clavicular head and the front delts, which is why the flye page caps its own angle at thirty degrees. The library's seconds — shoulders and triceps — split the remaining bill: the anterior deltoid guards the front of the shoulder through the bottom, and the triceps lock out the top. Each arm balancing its own bell turns the stabilizers of the shoulder blade into quiet workers all set long.",
        mistakes: [
          { error: "Setting the bench past the useful angle.", fix: "Keep the incline in the classic range — the steeper the bench, the more the front delt takes over the chest's shift; thirty degrees and a little above is where the upper fibers do the paying." },
          { error: "Flaring the elbows to a straight-out line on the descent.", fix: "Let the elbows travel at a natural angle from the torso — a forty-five-degree sweep keeps the shoulder safe and the chest loaded; a flat flare hands the joint its least stable position under load." },
          { error: "Clanging the bells together at the top and losing the squeeze.", fix: "Stop the bells an inch short of touching — the chest's job at the peak is a held contraction, and the collision only spends it on noise." },
          { error: "Bouncing the bells out of the bottom.", fix: "The library prescribes a descent twice as slow as the press — the bottom position is a loaded stretch, not a launchpad; pause a breath there and the chest does the whole pushing." },
        ],
        alternatives: "The incline family on this site covers every tool. The barbell incline press loads the same angle heavier; the incline dumbbell flye isolates the same fibers through a stretch; and the hammer-grip version rotates the palms for lifters whose shoulders prefer neutrality. When dumbbells are out of reach, the incline push-up — its own page — trains the same upper fibers with the floor as the load. Our gym PPL program schedules this press inside push day with sets and reps written.",
        progression: "Beginners start with a weight both arms can press for ten strict reps — the uneven-press problem is why the dumbbell press exposes weaknesses a barbell hides. Add load in small jumps while the rep range holds; when the tenth rep stops being honest, drop to eights and build again. The advanced rungs are the one-arm version, tempo work with a three-count descent, or pairing with the incline flye as a compound-then-isolation block.",
        programming: "Three to four sets of eight to twelve repetitions, once or twice a week inside a push session, is the standard prescription — placed after the day's heaviest horizontal press, or as the main press itself on a dumbbell day. In a hypertrophy block the independent bells double as balance work; in a strength block they keep the upper chest growing while the flat bar gets the intensity. Our workout tracker logs both arms so drift cannot hide.",
        safety: "The shoulder is the structure to respect. Getting the bells into position — the thigh-kick the library describes — is where most incidents live, not the pressing; take that setup slowly. If the bottom position pinches the front of the shoulder, narrow the flare and check the bench angle before touching the weight.",
      },
      ar: {
        muscles: "الألياف العليا للصدرية الكبرى تملك الدفعة، والميل هو ما يستدعيها — فكلما زاد ميل البنش انتقل الحمل من الصدر كله نحو الرأس الترقوي والدالية الأمامية، ولهذا تحدد صفحة التفتيح زاويتها بثلاثين درجة. ومساعدا المكتبة — الكتف والترايسبس — يتقاسمان الفاتورة الباقية: الدالية الأمامية تحرس مقدمة الكتف عبر القاع، والترايسبس يقفل القمة. وتوازن كل ذراع جرسها يحوّل مثبتات لوح الكتف إلى عمال صامتين طوال المجموعة — وهذه الضريبة الخفية هي ما يشعر به الرافع فرقًا غريبًا في اليوم التالي: عضلات صغيرة لم تسألها تعمل أكثر مما اعتادت.",
        mistakes: [
          { error: "ضبط البنش فوق الزاوية النافعة.", fix: "أبقِ الميل في النطاق الكلاسيكي — فكلما ازداد الميل تسلمت الدالية الأمامية نصيب الصدر؛ وثلاثون درجة وما فوقها قليلًا هي حيث تدفع الألياف العليا الفاتورة." },
          { error: "تفتيح المرفقين على خط مستقيم في النزول.", fix: "دع المرفقين يسافران بزاوية طبيعية من الجذع — فمسح الخمس والأربعين درجة يحفظ الكتف محملًا وآمنًا؛ والتفتيح المسطح يسلم المفصل أقل أوضاعه استقرارًا تحت الحمل." },
          { error: "تصادم الجرسين في القمة وضياع العصرة.", fix: "أوقف الجرسين قبل التلامع بوصة — وظيفة الصدر في القمة انقباض مثبت، والتصادم ينفقه ضجيجًا فقط." },
          { error: "ارتداد الجرسين من القاع.", fix: "المكتبة تصف نزولًا أبطأ من الدفع مرتين — فوضع القاع تمدد محمل لا منصة إطلاق؛ تنفّس هناك ولوحظ الصدر يؤدي الدفع كله." },
        ],
        alternatives: "عائلة الميل بهذا الموقع تغطي كل عتاد. برس المائل بالبار يحمل الزاوية نفسها أثقل، وتفتيح المائل بالدمبل يعزل الألياف نفسها عبر تمدد، ونسخة القبضة المطرقية تدير الراحتين لمن تفضل أكتافهم الحياد. وحين تغيب الدمبلات، يدرّب الضغط المائل — بصفحته — الألياف العلوية نفسها والأرض هي الحمل. وبرنامج الدفع/السحب/الأرجل بالصالة لدينا يجدول هذه الدفعة داخل يوم الدفع بمجموعات وتكرارات مكتوبة، ويترك لك حرية الترتيب بين البار والدمبل وفق ما يشفى كتفك لا ما يشتهي عقلك.",
        progression: "يبدأ المبتدئون بوزن تستطيع كلتا الذراعين دفعه لعشرة تكرارات صارمة — فمشكلة الدفع غير المتكافئ هي سبب كون برس الدمبل يكشف ضعفًا يخفيه البار. أضف الحمل بقفزات صغيرة والمدى محفوظ والجرسان يتحركان كقطار واحد لا كطائرين متفرقين؛ وحين تتوقف العاشرة عن أمانتها انزل إلى ثمانٍ وابنِ من جديد — فالرافعة المزدوجة تكافئ الصبر: من يضيف كيلوغرامًا كل أسبوعين يملك بعد عامين صدرًا لا يعرف رقم بدايته. والدرجات المتقدمة هي نسخة الذراع الواحدة التي تفتح باب المضاد للدوران، أو عمل الإيقاع بنزول ثلاث عدّات يضاعف زمن الشد، أو إقران تفتيح المائل بها ككتلة مركب-ثم-عزل تُنهي الصدر قبل أن تتكلم الذراعان.",
        programming: "ثلاث إلى أربع مجموعات من ثماني إلى اثني عشر تكرارًا، مرة أو مرتين أسبوعيًا داخل جلسة دفع، هي الوصفة المعيارية — توضع بعد أثقل دفعة أفقية في اليوم، أو كالدفع الرئيس نفسه في يوم الدمبل. وفي كتلة التضخم يضاعف الجرسان المستقلان عمل التوازن؛ وفي كتلة القوة يبقيان الصدر العلوي ناميًا بينما يأخذ البار المسطح الكثافة. ومتتبع التمارين لدينا يسجل الذراعين معًا فلا يختبئ الانحراف.",
        safety: "الكتف هو البنية المراقبة. إدخال الجرسين إلى الوضع — برفسة الفخذ التي تصفها المكتبة — هو حيث تسكن أغلب الحوادث لا الدفع ذاته؛ خذ ذلك الإعداد ببطء. وإن قرص مقدمة الكتف في القاع فضيّق التفتيح وافحص زاوية البنش قبل أن تمس الوزن، فأغلب آلام الكتف في المائل ليست من الحركة بل من زاوية زائدة حولت التمرين إلى دفعة أمامية بزي صدر.",
      },
    },
    faq: {
      en: [
        { q: "What incline angle is best for the upper chest?", a: "The classic range sits around thirty degrees — low enough that the pectorals keep the majority of the load, high enough that the clavicular fibers actually earn it. Steeper benches mostly transfer the work to the front delts." },
        { q: "Why press dumbbells instead of a barbell on the incline?", a: "Two independent paths let each shoulder move the way its joint prefers, expose and fix side-to-side weakness, and stretch the chest through a slightly deeper bottom — at the cost of loading lighter than the bar. Most programs use both." },
        { q: "How do I get the dumbbells up safely on an incline bench?", a: "The library's own steps: kick each bell up with the thighs one at a time, then rotate the palms forward. Never muscle both bells from the floor while lying back — the kick costs nothing and saves the shoulder." },
      ],
      ar: [
        { q: "ما زاوية الميل الأفضل للصدر العلوي؟", a: "النطاق الكلاسيكي عند نحو ثلاثين درجة — منخفض بما يكفي لتحتفظ الصدرية بأغلب الحمل، ومرتفع بما يكفي لتكسب الألياف الترقوية نصيبها فعلًا. والميول الأشد تنقل العمل غالبًا إلى الأمامية." },
        { q: "لماذا أدفع بالدمبل بدل البار على المائل؟", a: "مساران مستقلان يدعان كل كتف يتحرك كما يفضل مفصله، ويكشفان ضعف جانب-لجانب ويصلحانه، وتمدّان الصدر عبر قاع أعمق قليلًا — مقابل تحميل أخف من البار. أغلب البرامج تستعمل الاثنين." },
        { q: "كيف أرفع الدمبلين بأمان على البنش المائل؟", a: "خطوات المكتبة نفسها: ارفس كل جرس بفخذك واحدًا بعد الآخر ثم أدر الراحتين للأمام. لا تشد الجرسين من الأرض مستلقيًا قط — الرفسة لا تكلف شيئًا وتنقذ الكتف." },
      ],
    },
    links: [
      { hrefEn: "/exercises/incline-dumbbell-flyes", hrefAr: "/ar/exercises/incline-dumbbell-flyes", labelEn: "Incline dumbbell flyes — the isolation pair", labelAr: "تفتيح المائل بالدمبل — قرين العزل" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Intermediate PPL program", labelAr: "برنامج الدفع/السحب/الأرجل المتوسط" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track both arms in the free tracker", labelAr: "تتبّع الذراعين في المتتبع المجاني" },
    ],
  },

  "incline-dumbbell-flyes": {
    intro: {
      en: "The incline dumbbell flye is the upper chest's stretch movement — the page's own law caps the bench at thirty degrees, and the library's steps freeze the shape: a slight elbow bend held for the whole rep, pinkies turned toward each other at the top, wrists rotating as the arms sweep down until the palms face the ceiling at the bottom. It is the same arc the flat flye made famous, tilted uphill to the fibers the flat bench underreaches. No press lives here — the chest lowers the weight against its own length and hugs it back up.",
      ar: "تفتيح الدمبل المائل هو حركة تمدد الصدر العلوي — قانون الصفحة نفسه يحدد سقف البنش بثلاثين درجة، وخطوات المكتبة تجمد الشكل: ثني مرفق خفيف يُحفظ طوال التكرار، وخنصران يتقابلان في الأعلى، ومعصمان يدوران مع هبوط الذراعين حتى تواجه الراحتان السقف في القاع. إنه القوس نفسه الذي شهره التفتيح المسطح، مرفوعًا على التلة نحو الألياف التي يقصر عنها المسطح. لا دفعة هنا — الصدر ينزل الوزن ضد طوله ويحتضنه صاعدًا.",
    },
    sections: {
      en: {
        muscles: "The clavicular head of the pectoralis major takes the primary billing, and the thirty-degree cap is what keeps it there — flyes on a steeper bench become a front-delt exercise wearing a chest costume. The library lists the shoulders as seconds, honest about the joint the arms hang from: the anterior deltoid and the rotator cuff spend the set holding the humerus steady while the chest stretches and shortens across it. The biceps guard the elbow's soft bend like a hinge that must not fold.",
        mistakes: [
          { error: "Pressing the bells up instead of hugging them.", fix: "Think arms-around-a-barrel — the elbow bend stays constant from top to bottom; if the bend grows and shrinks with the rep, the press has quietly replaced the flye and the triceps cashed the set." },
          { error: "Dropping below the chest's comfortable stretch.", fix: "Stop the descent where the chest says so, not the shoulders — depth is earned by flexibility, and one inch above the honest floor beats six months off with a torn pec." },
          { error: "Setting the bench steep to feel more.", fix: "The thirty-degree cap on this page is the deal: steeper angles move the stretch into the front delt and the shoulder's least protected corner. What feels like more chest is usually more risk." },
          { error: "Clanking the dumbbells at the top of every rep.", fix: "Finish with the pinkies close, not colliding — the peak contraction lives in the chest's squeeze, and the collision only announces a rep the muscle did not finish." },
        ],
        alternatives: "The flye family branches by angle and tool. The flat dumbbell flye on its own page stretches the mid-chest; the incline cable flye keeps tension at the very bottom where dumbbells go quiet; and the crossover family runs the same arc standing. When the shoulders want a day off, the pec deck or the machine flye holds the shape with the joints guided. Our PPL program pairs one flye with one press per push day, sets already written.",
        progression: "The honest first level is a weight the chest can hug for twelve strict reps with the elbow bend frozen. Load grows in small jumps only while the arc stays wide — when the rep starts looking like a press, the weight outran the movement. Advanced rungs add a two-second pause at the bottom stretch, a slow three-count descent, or pre-exhaust: flyes first, press after, so the chest fails before the triceps can.",
        programming: "Three sets of ten to fifteen repetitions, once or twice a week after the day's pressing, is the standard dose — the flye is a finisher, not a foundation, and its value is the loaded stretch more than the load itself. In a hypertrophy block it widens the chest's work; in a cutting block it keeps the shape busy at weights the joints forgive.",
        safety: "The shoulder and the pec's own tendon are the watch list. Descend only as far as the chest stretches comfortably, and never bounce out of the bottom — the flye's bottom is the most loaded stretch in chest training, and it deserves respect on every rep. Shoulders that pinch at the bottom should narrow the arc before they narrow the weight.",
      },
      ar: {
        muscles: "الرأس الترقوي للصدرية الكبرى يأخذ الفاتورة الأساسية، وسقف الثلاثين درجة هو ما يبقيها هناك — فالتفتيح على بنش أشد يصبح تمرين دالية أمامية بزي صدر. وتسجل المكتبة الكتف مساعدًا، أمينة مع المفصل الذي تتدلى منه الذراعان: الدالية الأمامية والكفة المدورة تنفقان المجموعة تحافظان على عظمة العضد ثابتة بينما يتمدد الصدر ويقصر عبرها. والعضلة ذات الرأسين تحرس ثني المرفق الخفيف كمفصلة لا يجوز أن تنطوي، والظهر العلوي يستقر على اللوح فلا يفارقه — فالثبات فوق البنش جزء من التمرين لا مجرد مقدمة له.",
        mistakes: [
          { error: "دفع الجرسين للأعلى بدل احتضانهما.", fix: "فكر ذراعان-حول-برميل — ثني المرفق يبقى ثابتًا من القمة للقاع؛ فإن كبر الثني وصغر مع التكرار فقد استبدلت الدفعةُ التفتيحَ بصمت وصرف الترايسبس المجموعة." },
          { error: "الهبوط تحت تمدد الصدر المريح.", fix: "أوقف النزول حيث يقوله الصدر لا الكتفان — فالعمق يُكتسب بالمرونة، وبوصة فوق الأرض الأمينة أفضل من ستة أشهر تعويضًا عن تمزق." },
          { error: "رفع ميل البنش لتحس بأكثر.", fix: "سقف الثلاثين درجة بهذه الصفحة هو العقد: الزوايا الأشد تنقل التمدد إلى الأمامية وأقل زوايا الكتف حماية. وما تحسه صدرًا أكثر هو غالبًا مخاطرة أكثر." },
          { error: "تصادم الدمبلات في قمة كل تكرار.", fix: "أنهِ والخنصران متقاربان لا متصادمان — فانقباض القمة يسكن في عصرة الصدر، والتصادم يعلن فقط تكرارًا لم تنهه العضلة." },
        ],
        alternatives: "عائلة التفتيح تتفرع بالزاوية والعتاد. تفتيح الدمبل المسطح في صفحته يمدد منتصف الصدر، وتفتيح المائل بالكيبل يحفظ الشد في القاع ذاته حيث تصمت الدمبلات، وعائلة الكروس أوفر تدير القوس نفسه واقفًا. وحين تريد الكتفان يومًا حرًا، يحفظ جهاز الصدر الشكل والمفاصل موجهة. وبرنامج الدفع/السحب/الأرجل لدينا يقترن تفتيحًا واحدًا بدفعة واحدة في كل يوم دفع، بمجموعات مكتوبة سلفًا — فالترتيب ليس جماليًا: الدفعة أولًا حين تكون العضلة طازجة، والتفتيح آخرًا حين يكفيها تمدد بسيط.",
        progression: "المستوى الأول الأمين وزن يستطيع الصدر احتضانه لاثني عشر تكرارًا صارمًا وثني المرفق مجمدًا. ينمو الحمل بقفزات صغيرة فقط ما دام القوس واسعًا — وحين يبدأ التكرار في الشكل كدفعة فقد تجاوز الوزن الحركة. والدرجات المتقدمة تضيف تثبيت ثانيتين في تمدد القاع، أو نزولًا بثلاث عدّات، أو الإجهاد المسبق: التفتيح أولًا والدفعة بعده حتى يعجز الصدر قبل الترايسبس — خطة يذوق فيها الصدر تعبًا لم تعرفه في الدفعات المباشرة وتكتشف فيها الرافعة صوتها الحقيقي.",
        programming: "ثلاث مجموعات من عشرة إلى خمسة عشر تكرارًا، مرة أو مرتين أسبوعيًا بعد دفع اليوم، هي الجرعة المعيارية — فالتفتيح خاتمة لا أساس، وقيمته التمدد المحمل أكثر من الحمل نفسه. وفي كتلة التضخم يوسع عمل الصدر بعد الدفعات المركبة حين تكون الذراعان أقوى من استقبال مزيد؛ وفي كتلة التنشيف يبقي الشكل مشغولًا بأوزان تغفرها المفاصل التي تضيق هوامشها مع هبوط الوزن — وهذه رحمة لا يمنحها أي حمل أقصى في هذه العائلة — فالتفتيح يبني الشكل بلا فاتورة عصبية، والميزان ينزل والمفصل يبتسم معه.",
        safety: "الكتف ووتر الصدرية هما قائمة المراقبة. انزل فقط بقدر ما يتمدد الصدر بارتياح، ولا ترتد من القاع أبدًا — فقاع التفتيح أشد تمدد محمل في تدريب الصدر، ويستحق الاحترام في كل تكرار. والكتفان اللذان يقرصان في القاع ينبغي أن يضيقا القوس قبل أن يضيقا الوزن، فقاع التفتيح موضع لا يغتفر الاستعجال: أنزل بيتّ بيت حتى تملك الأرض التي تقف عليها عضلتك.",
      },
    },
    faq: {
      en: [
        { q: "Why does this page cap the incline at thirty degrees?", a: "Because that is where the upper-chest fibers keep the stretch while the shoulder stays out of its weakest corner. Above it, the front delt takes over — more angle is not more chest, it is a different exercise." },
        { q: "Should my elbows be bent or straight in the flye?", a: "Slightly bent and frozen that way — the library's own steps prescribe it. The bend protects the elbow and the constant arc is what makes it a flye; straighten or fold it mid-rep and you are pressing." },
        { q: "Dumbbell flyes or cable flyes for the upper chest?", a: "Dumbbells load the stretch hardest; cables keep tension at the very top where dumbbells go light. The strongest answer is both across the week — this page and the cable version each own what the other lacks." },
      ],
      ar: [
        { q: "لماذا تحدد هذه الصفحة الميل بثلاثين درجة؟", a: "لأنها حيث تحتفظ ألياف الصدر العلوي بالتمدد بينما يبقى الكتف بعيدًا عن أضعف زواياه. وفوقها تتسلم الأمامية — الزاوية الأكبر ليست صدرًا أكثر، بل تمرينًا مختلفًا." },
        { q: "أأثني مرفقيّ في التفتيح أم أمدّهما؟", a: "مثنيان قليلًا ومجمدان هكذا — خطوات المكتبة نفسها تصف ذلك. الثني يحمي المرفق، والقوس الثابت هو ما يجعله تفتيحًا؛ مدّه أو ثنيه أثناء التكرار يعني أنك تدفع." },
        { q: "تفتيح الدمبل أم الكيبل للصدر العلوي؟", a: "الدمبل يحمل التمدد أقوى؛ والكيبل يحفظ الشد في القمة ذاتها حيث يخف الدمبل. وأقوى جواب هو الاثنان عبر الأسبوع — هذه الصفحة ونسخة الكيبل يملك كل منهما ما ينقص الآخر." },
      ],
    },
    links: [
      { hrefEn: "/exercises/incline-dumbbell-press", hrefAr: "/ar/exercises/incline-dumbbell-press", labelEn: "Incline dumbbell press — the press pair", labelAr: "برس المائل بالدمبل — قرين الدفع" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Intermediate PPL program", labelAr: "برنامج الدفع/السحب/الأرجل المتوسط" },
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training at home — the full guide", labelAr: "تدريب الصدر في المنزل — الدليل الكامل" },
    ],
  },

  "push-ups-with-feet-elevated": {
    intro: {
      en: "Elevating the feet turns the push-up into the decline bench of the floor. The library's steps keep the standard: hands about thirty-six inches apart, toes on a flat bench, chest lowered until it nearly touches the floor, then pressed back up with a squeeze — and the page's own note explains the dial: the higher the bench, the higher the resistance. Bodyweight stays constant; the angle decides how much of it the upper chest and shoulders carry. It is the cheapest load increase in training — a bench does all the work a plate would do on a bench press.",
      ar: "رفع القدمين يحوّل تمرين الضغط إلى البنش المائل لأرضية الصالة. خطوات المكتبة تحفظ المعيار: يدان على بعد نحو ست وثلاثين بوصة، وأصابع على بنش مسطح، وصدر ينزل حتى يلامس الأرض تقريبًا ثم يُدفع صاعدًا مع عصرة — وملاحظة الصفحة نفسها تشرح مزودة التحكم: كلما ارتفع البنش زادت المقاومة. وزن الجسم ثابت؛ والزاوية تقرر كم منه يحمله الصدر العلوي والكتفان. إنه أرخص رفع للحمل في التدريب — بنش يؤدي كل العمل الذي يؤديه قرص على البنش برس.",
    },
    sections: {
      en: {
        muscles: "The upper pectoral fibers take over from the flat push-up as the feet rise — the library bills chest primary with shoulders and triceps as seconds, and the elevation shifts the emphasis uphill exactly as a decline bench would. The shoulders now carry a bigger share of the pressing angle, the triceps lock out every rep, and the abs work harder than anyone expects: the decline angle makes the body a lever the core must keep rigid from ankles to head, or the hips sag and the rep dies in the middle.",
        mistakes: [
          { error: "Sagging hips as the set wears on.", fix: "Squeeze the glutes and brace the abs before the first rep and keep the body one plank from ankle to ear; a sagging middle steals the load from the chest and parks it in the lumbar spine." },
          { error: "Planting the feet too high for the strength on hand.", fix: "The page's own dial: higher bench, higher resistance. Start at a low step and climb only when fifteen clean reps exist — the chest grows from the angle it can control." },
          { error: "Flaring the elbows to a T.", fix: "Keep the elbows sweeping back at roughly forty-five degrees from the torso — the wide T hand position already stretches the chest without adding a shoulder-unfriendly flare on top of it." },
          { error: "Half reps at the bottom when fatigue lands.", fix: "The library's standard is chest-near-floor every rep; when the depth goes, end the set — partial reps on a decline angle grind the shoulder for pennies." },
        ],
        alternatives: "The push-up family climbs by elevation. The standard push-up on its own page is the entry; this feet-elevated version is the middle rung; the wall handstand push-up family waits at the top. When a bench is not around, a bed, a step, or a curb takes the job. Our home programs sequence the climb with reps and rest written, and the chest-at-home guide places the whole family in one plan.",
        progression: "The dial is the bench height. Begin with a low step and the full chest-near-floor standard; each time twenty clean reps live at a height, raise the feet one level. When the highest stable surface stops being enough, add a backpack with books, slow the descent to a three-count, or move one hand onto a ball for an anti-rotation challenge. The advanced branch hands off to deficit push-ups or the plyo push-up page.",
        programming: "Three to five sets of ten to twenty repetitions, twice a week inside a push day or as a finisher after benching, is the standard dose. In a hypertrophy block the angle does the loading; in a cutting block the movement keeps pressing volume alive while bodyweight falls with the scale. Our workout tracker counts the reps so the bench height and the number grow together, honestly.",
        safety: "The wrist and the shoulder share the watch. Fingers spread and knuckles forward save the wrists under the decline angle; if the shoulders pinch at the bottom, drop the feet a level first and widen slightly second. The lower back is the silent partner — the moment the hips sag, the set is over regardless of the count.",
      },
      ar: {
        muscles: "الألياف العلوية للصدر تتسلم من الضغط المسطح مع ارتفاع القدمين — فالمكتبة تسجل الصدر أساسيًا والكتف والترايسبس مساعدين، والرفع ينقل التركيز صعودًا تمامًا كما يفعل البنش المائل. والكتفان يحملان الآن نصيبًا أكبر من زاوية الدفع، والترايسبس يقفل كل تكرار، والبطن تعمل أكثر مما يتوقعه أي أحد: فزاوية الميل تجعل الجسم رافعة يجب على الجذع حفظها صلبة من الكاحل إلى الرأس، وإلا هبطت الوركان ومات التكرار في منتصفه. والألويات شريك صامت هنا — عصرها ليس تجميلًا بل إقفال للسلسلة الخلفية التي تمنع الحوض من السقوط.",
        mistakes: [
          { error: "هبوط الوركين مع طول المجموعة.", fix: "اعصر الألويات واشدد البطن قبل أول تكرار وأبقِ الجسم بلانكًا واحدًا من الكاحل إلى الأذن؛ فالوسط الهابط يسرق الحمل من الصدر ويوقفه في القطني." },
          { error: "وضع القدمين أعلى من القوة المتاحة.", fix: "مزودة الصفحة نفسها: بنش أعلى، مقاومة أعلى. ابدأ بدرجة منخفضة واصعد فقط حين توجد خمسة عشر تكرارًا نظيفًا — فالصدر ينمو من الزاوية التي يقدر على ضبطها." },
          { error: "تفتيح المرفقين على شكل تي.", fix: "أبقِ المرفقين يجتاحان للخلف بنحو خمس وأربعين درجة من الجذع — فوضعية اليدين الواسعة تمدد الصدر أصلًا دون إضافة تفتيح يؤذي الكتف فوقها." },
          { error: "تكرارات نصفية في القاع حين يحل الإجهاد.", fix: "معيار المكتبة صدر-قرب-الأرض في كل تكرار؛ وحين يذهب العمق فأنهِ المجموعة — فالنصفية على زاوية ميل تسحق الكتف بدراهم." },
        ],
        alternatives: "عائلة الضغط تصعد بالارتفاع. الضغط القياسي بصفحته هو المدخل، وهذه النسخة بالقدمين المرفوعتين هي الدرجة الوسطى، وعائلة الضغط بالوقوف على اليدين تنتظر في القمة. وحين لا يوجد بنش فسرير أو درجة أو رصيف يتولى الوظيفة. وبرامجنا المنزلية ترتّب الصعود بتكرارات وراحات مكتوبة، ودليل الصدر في المنزل يضع العائلة كلها في خطة واحدة متدرجة، فلا تحتاج سوى أرض وحافة وكرسي لتفتح مقعد التدريب بالكامل — والباقي إصرار يشتريه الشخص لا المتجر.",
        progression: "المزودة هي ارتفاع البنش. ابدأ بدرجة منخفضة ومعيار الصدر-قرب-الأرض كاملًا؛ وكلما وُجد عشرون تكرارًا نظيفًا على ارتفاع، ارفع القدمين مستوى. وحين تتوقف أعلى سطح مستقر عن الكفاية، أضف حقيبة ظهر مليئة كتبًا، أو أبطئ النزول إلى ثلاث عدّات، أو ضع يدًا على كرة لتحدي مضاد الدوران. والفرع المتقدم يسلم لضغط العجز أو صفحة الضغط البليومتري.",
        programming: "ثلاث إلى خمس مجموعات من عشر إلى عشرين تكرارًا، مرتين أسبوعيًا داخل يوم دفع أو كختام بعد البنش برس، هي الجرعة المعيارية. وفي كتلة التضخم تتولى الزاوية التحميل؛ وفي كتلة التنشيف تبقي الحركة حجم الدفع حيًا بينما يهبط وزن الجسم مع الميزان. ومتتبع التمارين لدينا يعدّ التكرارات فينمو ارتفاع البنش والرقم معًا بأمانة — والقاعدة العملية للجدولة: كلما ارتفع مستوى القدمين في الأسبوع، خُفف عدد المجموعات وحدة واحدة، فالزاوية تسبق الحجم دائمًا في سلم الأولويات.",
        safety: "المعصم والكتف يتقاسمان الحراسة. أصابع مبسوطة ومفاصل أصابع للأمام تنقذ المعصمين تحت زاوية الميل؛ وإن قرص الكتفان في القاع فأنزل القدمين مستوى أولًا ووسّع قليلًا ثانيًا. وأسفل الظهر هو الشريك الصامت — فبمجرد هبوط الوركين تنتهي المجموعة مهما قال العدّاد، وخير عادة هنا أن تجعل عينيك تراقب وركيك في نهاية كل مجموعة: ما تنكسر صورته اليوم يُقاس غدًا ألمًا.",
      },
    },
    faq: {
      en: [
        { q: "How high should my feet be for a decline push-up?", a: "Start with a low step and climb as strength allows — the page's own rule is that higher elevation means higher resistance. A bench height that allows ten to fifteen clean reps is the right working level today." },
        { q: "Do feet-elevated push-ups work the upper chest?", a: "Yes — the angle shifts the load toward the clavicular fibers the same way a decline bench press does, with the shoulders and triceps carrying their usual share. The standard push-up page remains the mid-chest version." },
        { q: "Why do my hips sag on these but not on floor push-ups?", a: "The decline angle turns your body into a longer lever that the core must hold rigid — fatigue shows up there first. Brace before the set, squeeze the glutes, and end the set when the plank shape breaks." },
      ],
      ar: [
        { q: "كم ينبغي أن يكون ارتفاع قدميّ في الضغط المائل؟", a: "ابدأ بدرجة منخفضة واصعد مع القوة — فقاعدة الصفحة نفسها أن الارتفاع الأعلى يعني مقاومة أعلى. وارتفاع بنش يسمح بعشر إلى خمس عشرة نظيفة هو مستوى العمل الصحيح اليوم." },
        { q: "هل الضغط بالقدمين المرفوعتين يدرّب الصدر العلوي؟", a: "نعم — فالزاوية تنقل الحمل نحو الألياف الترقوية تمامًا كما يفعل البنش برس المائل، والكتفان والترايسبس يحملان نصيبهما المعتاد. وتبقى صفحة الضغط القياسي نسخة منتصف الصدر، والضغط المائل بوضع اليدين مرتفعًا نسخة التراجع لمن لا يبلغ العشر بعد — فعائلة كاملة تصعد وتنزل بميزان واحد اسمه ارتفاع القدمين." },
        { q: "لماذا يهبط وركيّ هنا ولا يهبط في ضغط الأرض؟", a: "زاوية الميل تحوّل جسمك رافعة أطول يجب على الجذع حفظها صلبة — فيظهر الإجهاد هناك أولًا. اشدد قبل المجموعة واعصر الألويات وأنهِ المجموعة عند انكسار شكل البلانك." },
      ],
    },
    links: [
      { hrefEn: "/exercises/pushups", hrefAr: "/ar/exercises/pushups", labelEn: "The standard push-up — the entry rung", labelAr: "الضغط القياسي — درجة الدخول" },
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training at home — the full guide", labelAr: "تدريب الصدر في المنزل — الدليل الكامل" },
      { hrefEn: "/programs/home-beginner-fullbody", hrefAr: "/ar/programs/home-beginner-fullbody", labelEn: "Home beginner full-body program", labelAr: "برنامج الجسم الكامل المنزلي للمبتدئين" },
    ],
  },

  "wide-grip-barbell-bench-press": {
    intro: {
      en: "The wide-grip bench press is the flat press with the flinch removed — the library's setup puts each hand roughly three inches beyond shoulder width, and the shorter bar path that follows spends less time in triceps territory and more across the chest's own line. The steps read like the classic press they descend from: slow descent to the middle chest, a second's pause, then a chest-driven drive to a locked, squeezed top. The grip does the deciding — three inches changes who pays for the rep.",
      ar: "بنش برس بالبار بقبضة واسعة هو البرس المسطح بعد نزع التردد — إعداد المكتبة يضع كل يد أبعد بثلاث بوصات تقريبًا من عرض الكتفين، ومسار البار الأقصر الذي يليه يقضي وقتًا أقل في أرض الترايسبس ووقتًا أكثر عبر خط الصدر نفسه. والخطوات تُقرأ كالبرس الكلاسيكي المنحدر منه: نزول بطيء إلى منتصف الصدر، وتوقف لثانية، ثم دفعة يقودها الصدر إلى قمة مقفلة معصورة. القبضة هي من يقرر — ثلاث بوصات تغير من يدفع ثمن التكرار.",
    },
    sections: {
      en: {
        muscles: "The pectoralis major takes the biggest share a bench can give it — the wide grip shortens the range and hands the sternal fibers the lever, while the library's seconds (shoulders and triceps) split what remains. The triceps still lock out every rep but lose their mid-range earning to the chest; the front delts steady the shoulder joint through a bottom position that sits wider than the standard press. The wider the hands, the more the chest's outer fibers stretch at the bottom — and the more the shoulder joint asks for respect.",
        mistakes: [
          { error: "Gripping so wide the wrists fold under the bar.", fix: "Three inches past the shoulders per hand is the page's own prescription — wider makes the wrist the weakest link; stack the forearm under the bar and the extra width stays honest." },
          { error: "Bouncing the bar off the chest to restart the drive.", fix: "The library's steps prescribe a full second's pause on the middle chest — the pause is not a delay, it is the proof that the chest, not the ribcage's rebound, is doing the pressing." },
          { error: "Elbows flaring to a dead-flat line.", fix: "Even wide, the elbows keep a slight tuck — a flat flare at this grip puts the shoulder in its most open corner under the heaviest point of the rep." },
          { error: "Pressing the bar back toward the face on the way up.", fix: "Drive the bar up and slightly back toward the rack along the natural J-curve; a straight vertical press fights the shoulder and robs the chest of its line." },
        ],
        alternatives: "The bench family around this grip covers every width. The medium-grip press on its own page is the standard and the healthiest all-rounder; the close-grip version hands the mid-range to the triceps; and the dumbbell press lets each hand choose its path. When the shoulders want kindness, the machine bench press or the smith version holds the bar's line steady. Our gym PPL program writes the width rotation into push day.",
        progression: "Weight grows only as the pause survives: add load while the bar rests its full second on the chest every rep. The intermediate rungs are tempo work — a three-count descent with the wide grip stretches the outer fibers longer — and paused reps at 80 percent. The advanced branch rotates grips across sessions: wide for the chest's line, medium for load, close for the arms, one width per week.",
        programming: "Four sets of six to ten repetitions with the pause intact, once a week as the secondary press or every other week as the main one, is the standard placement — the wide grip earns its keep as a chest builder, not a max-load lift. In a hypertrophy block it widens the chest's stimulus; in a strength block it supports the medium grip by overloading the fibers the standard press shares with the triceps.",
        safety: "The shoulder and the wrist top the watch list at this width. Warm the rotator cuff before the working sets, keep the forearm stacked under the bar, and treat any pinch at the bottom as the signal to narrow by an inch — three inches wide is the prescription, not a dare. A spotter or safety pins belong under any bar press; the wide grip's bottom position is the least forgiving of surprises.",
      },
      ar: {
        muscles: "الصدرية الكبرى تأخذ أكبر نصيب يستطيع البنش منحه — فالقبضة الواسعة تقصر المدى وتناول الألياف القصية الرافعة، بينما يتقاسم مساعدا المكتبة (الكتف والترايسبس) الباقي. الترايسبس ما يزال يقفل كل تكرار لكنه يفقد مكاسبه في منتصف المدى لصالح الصدر؛ والأماميتان تثبتان مفصل الكتف عبر قاع أوسع من وقفة البرس القياسي. وكلما اتسعت اليدان ازداد تمدد الألياف الخارجية للصدر في القاع — وازداد المفصل طلبًا للاحترام. ولهذا لا يُوصى بالقبضة الواسعة لمن دون ستة أشهر من البنش المنتظم: المفصل يتعلم الأمان قبل أن يستحق هذا القاع.",
        mistakes: [
          { error: "قبضة أوسع من أن تحمل المعصمان البار.", fix: "ثلاث بوصات خارج الكتفين لكل يد هي وصفة الصفحة نفسها — والأوسع من ذلك يجعل المعصم أضعف حلقة في سلسلة لا ترحم؛ ركّز الساعد تحت البار يبقى العرض الإضافي أمينًا." },
          { error: "ارتداد البار عن الصدر لإعادة إطلاق الدفع.", fix: "خطوات المكتبة تصف توقف ثانية كاملة على منتصف الصدر — فالتوقف ليس تأخيرًا، بل الدليل على أن الصدر لا ارتداد القفص هو من يدفع." },
          { error: "تفتيح المرفقين على خط ميت مسطح.", fix: "حتى مع العرض يبقي المرفقان انحناءة لصيقة خفيفة — فالتفتيح المسطح بهذه القبضة يضع الكتف في أفتح زواياه تحت أثقل نقطة في التكرار." },
          { error: "دفع البار نحو الوجه صاعدًا.", fix: "ادفع البار لأعلى وقليلًا للخلف نحو الحامل على منحنى الجي الطبيعي؛ فالدفع العمودي المستقيم يحارب الكتف ويسلب الصدر خطه." },
        ],
        alternatives: "عائلة البنش حول هذه القبضة تغطي كل عرض. البرس بقبضة متوسطة بصفحته هو المعيار والأصح عمومًا، ونسخة القبضة الضيقة تسلم منتصف المدى للترايسبس، وبرس الدمبل يدع كل يد تختار مسارها. وحين تريد الكتفان لطفًا، يحفظ جهاز البنش أو نسخة السميث خط البار ثابتًا. وبرنامج الدفع/السحب/الأرجل بالصالة لدينا يكتب تدوير العروض في يوم الدفع كما يليق بمن يفهم أن الصدر لا يُبنى بعرض واحد مهما أعجبك إياه — فالعضلة تملك أليافًا بزوايا متعددة، ومن يحترم زواياها يرى أثرها في المرآة.",
        progression: "لا ينمو الوزن إلا مع نجاة التوقف: أضف الحمل ما دام البار يرتاح ثانيته الكاملة على الصدر في كل تكرار. والدرجات المتوسطة هي عمل الإيقاع — نزول ثلاث عدّات بالقبضة الواسعة يمدد الألياف الخارجية أطول — والتكرارات المتوقفة عند ثمانين بالمئة. والفرع المتقدم يدير العروض عبر الجلسات: واسع لخط الصدر، ومتوسط للحمل، وضيق للذراعين، عرض واحد كل أسبوع.",
        programming: "أربع مجموعات من ستة إلى عشرة تكرارات مع بقاء التوقف سليمًا، مرة أسبوعيًا كبرس ثانوي أو كل أسبوعين كأساسي، هي الوضع المعياري — فالقبضة الواسعة تكسب رزقها كبانية صدر لا كرفعة حمل أقصى. وفي كتلة التضخم توسع مثير الصدر؛ وفي كتلة القوة تسند المتوسطة بتحميل ألياف يتقاسمها البرس القياسي مع الترايسبس، ويعرف مدربو القوة هذه العلاقة بالتناوب: أسبوع على المتوسطة للحمل وأسبوع على الواسعة للخط، فلا تغار إحداهما من الأخرى.",
        safety: "الكتف والمعصم في مقدمة قائمة المراقبة على هذا العرض. أحمِ الكفة المدورة قبل المجموعات العاملة، وأبقِ الساعد متراصًا تحت البار، وعامل أي قرصة في القاع كإشارة لتضييق بوصة — ثلاث بوصات وصفة لا تحدٍّ. ومساعد أو أوتار أمان تحت أي بنش بالبار؛ فقاع القبضة الواسعة أقل ما يغتفر المفاجآت، والقاعدة العملية: إن كان البار أثقل من أن ترفعه عن صدرك بعد توقف كامل، فهو أثقل من أن تكون وحدك تحته.",
      },
    },
    faq: {
      en: [
        { q: "How wide is a wide grip on the bench press?", a: "This page's prescription is about three inches beyond shoulder width per hand — wide enough to shift work to the chest, narrow enough to keep the wrist stacked and the shoulder out of trouble. Thumbs around the bar, always." },
        { q: "Does a wide grip build a wider chest?", a: "It builds the pectoral fibers along their own line with less triceps help, which is the stimulus — the chest's visual width is muscle plus body fat, not grip geometry. The movement widens the training, not the bone." },
        { q: "Why is my wide-grip press weaker than my standard one?", a: "It is supposed to be — the shorter range removes the triceps' strongest stretch and the bottom position sits wider. Compare wide-grip numbers to wide-grip numbers; the standard press is a different event." },
      ],
      ar: [
        { q: "ما عرض القبضة الواسعة في البنش برس؟", a: "وصفة هذه الصفحة نحو ثلاث بوصات خارج عرض الكتفين لكل يد — واسعة بما ينقل العمل للصدر، وضيقة بما يبقي المعصم متراصًا والكتف بعيدًا عن المتاعب. والإبهام حول البار دائمًا." },
        { q: "هل تبني القبضة الواسعة صدرًا أعرض؟", a: "تبني الألياف الصدرية على خطها الخاص بمساعدة أقل من الترايسبس، وهذا هو المثير — أما عرض الصدر المرئي فعضلة زائد دهون، لا هندسة قبضة. الحركة توسع التدريب لا العظم." },
        { q: "لماذا برسي بالقبضة الواسعة أضعف من القياسي؟", a: "هكذا يُفترض — فالمدى الأقصر يحذف أقوى تمدد للترايسبس والقاع أوسع وقفة. قارن أرقام الواسعة بالواسعة؛ فالبرس القياسي مسابقة مختلفة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-bench-press-medium-grip", hrefAr: "/ar/exercises/barbell-bench-press-medium-grip", labelEn: "Medium-grip bench press — the standard", labelAr: "بنش برس بقبضة متوسطة — المعيار" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Intermediate PPL program", labelAr: "برنامج الدفع/السحب/الأرجل المتوسط" },
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training at home — the full guide", labelAr: "تدريب الصدر في المنزل — الدليل الكامل" },
    ],
  },

  "medicine-ball-chest-pass": {
    intro: {
      en: "The medicine ball chest pass is the press that leaves your hands. The library's steps keep it social — facing a partner, ball pulled to the chest, then thrown outward by extending through the elbows — and honest about the solo option: a wall takes the partner's job with no waiting. The movement trains the same pressing pattern as the bench, but at the one speed the bench forbids: full send. That is its entire value — power is force times velocity, and a throw is the only press that measures the second half of the equation.",
      ar: "تمرير الكرة الطبية للصدر هو البرس الذي يفارق يديك. خطوات المكتبة تحفظه اجتماعيًا — مواجهة شريك، وكرة تُسحب إلى الصدر، ثم تُرمى للخارج بمدٍّ عبر المرفقين — وأمينة مع خيار الفردي: جدار يتولى وظيفة الشريك بلا انتظار. الحركة تدرّب نمط الدفع نفسه كالبنش، لكن بالسرعة الوحيدة التي يحظرها البنش: الإطلاق الكامل. تلك قيمتها كلها — فالقدرة قوة في سرعة، والرمية هي الدفعة الوحيدة التي تقيس النصف الثاني من المعادلة.",
    },
    sections: {
      en: {
        muscles: "The pectorals fire the throw exactly as they fire a press — the library bills chest primary with shoulders and triceps as seconds — but the contract changes: instead of grinding a heavy load slowly, the muscles deliver a light load at maximum speed. The front delts and triceps extend the arms violently, the core braces the trunk so the chest's push actually reaches the ball, and the legs quietly join whenever the step-throw variation the library mentions is used. Catching the return is the eccentric half most throws skip.",
        mistakes: [
          { error: "Passing with a basketball-style overhead flick.", fix: "Pull the ball to the chest and push it away by extending the elbows — a chest pass, not a shot; the moment the hands rotate under the ball, the shoulders take over the chest's throw." },
          { error: "Standing bolt upright with a soft middle.", fix: "Brace the torso like any press — a soft trunk absorbs the push before it reaches the ball, and the partner receives a lob instead of a pass." },
          { error: "Using a ball too heavy to be fast.", fix: "Power work lives at the fast end — a ball you can only heave slowly trains slow strength, which the bench already does better. Choose the weight that keeps the throw quick." },
          { error: "Catching with straight arms and a rigid chest.", fix: "Receive the throw with bent elbows and let the ball come to the chest — the catch is the eccentric half of the rep, and straight-arm absorbing dumps it into the shoulder joints." },
        ],
        alternatives: "The explosive-press family has several doors. The plyo push-up on its own page delivers the same speed to the floor; the drop push trains reacting off a depth; and the bench press with bands adds speed work to the bar. When no partner and no solid wall exist, the flat floor push press family covers vertical power. Our home HIIT program schedules ball throws inside conditioning rounds with reps written.",
        progression: "The dial is speed, not weight: a ball light enough to throw hard, thrown harder every week. Quality lives in sets of five to eight explosive passes with full rest between — power is a skill and fatigue teaches it slowly. The advanced rungs add the step-throw the library mentions, a partner walking backward to increase distance, or the plyo push-up for the same training at zero equipment.",
        programming: "Three to five sets of five to eight passes, once or twice a week before the main lifting while the nervous system is fresh, is the standard dose — throws placed after heavy work train slowness. In a strength block they maintain the speed heavy grinding steals; in a cutting block they keep the chest explosive while the scale drops. Our workout tracker logs throws as their own line so the intent survives the program.",
        safety: "The shoulders and the fingers share the watch. Warm the shoulders before the first full-send pass, and check the ball's surface — sweaty hands and a hard shell send balls into faces. Against a wall, stand far enough to catch with bent arms; the wall returns everything eventually, at the speed you lent it.",
      },
      ar: {
        muscles: "الصدرية تشعل الرمية تمامًا كما تشعل الدفعة — فالمكتبة تسجل الصدر أساسيًا والكتف والترايسبس مساعدين — لكن العقد يتغير: بدل طحن حمل ثقيل ببطء، تسلم العضلات حملًا خفيفًا بأقصى سرعة. الأماميتان والترايسبس يمدّان الذراعين بعنف، والجذع يشدد القائمة كي يصل دفع الصدر إلى الكرة فعلًا، والساقان تنضمان بصمت كلما استُخدمت رمية الخطوة التي تذكرها المكتبة — فخطوة الأمام ليست زخرفة بل نقل للقوة من الأرض إلى الصدر، وهي نفسها سلسلة الحركة التي تستعملها في دفع أي شيء ثقيل في الحياة. والتقاط الرد هو النصف السالب الذي تتخطاه أغلب الرميات.",
        mistakes: [
          { error: "التمرير بقلب كرة السلة فوق الرأس.", fix: "اسحب الكرة إلى صدرك وادفعها بمدّ المرفقين — تمريرة صدر لا تسديدة؛ فبمجرد دوران اليدين تحت الكرة تتسلم الكتفان رمية الصدر." },
          { error: "الوقوف منتصبًا بجذع رخو.", fix: "اشدد القائمة كأي دفعة — فالجذع الرخو يمتص الدفع قبل وصوله الكرة، ويتلقى الشريك رمية قوسية لا تمريرة." },
          { error: "استعمال كرة أثقل من أن تكون سريعة.", fix: "عمل القدرة يسكن الطرف السريع — الكرة التي لا تستطيع إلا قذفها ببطء تدرّب قوة بطيئة يتقنها البنش أصلًا بشكل أفضل. اختر الوزن الذي يبقي الرمية خاطفة." },
          { error: "التقاط بذراعين مستقيمتين وصدر متحجر.", fix: "استقبل الرمية بمرفقين مثنيين ودع الكرة تأتي إلى الصدر — فالتقاط هو النصف السالب من التكرار، والامتصاص بالذراع الممدودة يلقبه في مفاصل الكتف." },
        ],
        alternatives: "لعائلة الدفع المتفجر عدة أبواب. الضغط البليومتري بصفحته يسلم السرعة نفسها إلى الأرض، ودفع الهبوط يدرّب رد الفعل من عمق، والبنش برس بالمطاطات يضيف عمل السرعة إلى البار. وحين لا شريك ولا جدار صلب، تغطي عائلة الدفع من الأرض القدرة الرأسية. وبرنامج الهيت المنزلي لدينا يجدول رميات الكرة داخل جولات اللياقة بتكرارات مكتوبة، ولمن يبني كتلة قوة فالرميات قبل الرفع الثقيل بمئة فائدة وبعده بصفر: الجهاز العصبي الطازج هو وحده من يتعلم السرعة.",
        progression: "المزودة هي السرعة لا الوزن: كرة خفيفة بما يكفي لرميها بقوة، تُرمى أقوى كل أسبوع. الجودة تسكن في مجموعات من خمس إلى ثماني تمريرات متفجرة مع راحة كاملة بينها — فالقدرة مهارة والإجهاد يعلّمها ببطء. والدرجات المتقدمة تضيف رمية الخطوة، أو شريكًا يتراجع للخلف لزيادة المسافة فتصبح الرمية أطول وأخف، أو الضغط البليومتري للتدريب نفسه بصفر عتاد. والقاسم واحد في كلها: السرعة قبل الوزن، دائمًا.",
        programming: "ثلاث إلى خمس مجموعات من خمس إلى ثماني تمريرات، مرة أو مرتين أسبوعيًا قبل الرفع الرئيسي والجهاز العصبي طازج، هي الجرعة المعيارية — فالرميات الموضوعة بعد العمل الثقيل تدرّب البطء. وفي كتلة القوة تحافظ على السرعة التي يسرقها الطحن الثقيل؛ وفي كتلة التنشيف تبقي الصدر متفجرًا بينما يهبط الميزان. ومتتبع التمارين لدينا يسجل الرميات سطرًا مستقلًا عن الرفعات فتنجو نية السرعة من نسيان البرنامج ويبقى القياس فرقًا محسوبًا لا انطباعًا — فارميتك اليوم تُقارن برميتك قبل شهرين، وهذه هي الطريقة الوحيدة التي تكبر بها السرعة دون أن تدري.",
        safety: "الكتفان والأصابع يتقاسمان الحراسة. أحمِ الكتفين قبل أول تمريرة بإطلاق كامل، وافحص سطح الكرة — فالأيدي العرقانية والقشرة الصلبة ترسل الكرات إلى الوجوه. وأمام الجدار قف بمسافة تسمح بالتقاط بمرفقين مثنيين؛ فالجدار يعيد كل شيء في النهاية، بالسرعة نفسها التي أقرضته إياها — وهي نصيحة يتعلمها كل من ضحك على الكرة قبل أن ترتد عن الجدار وتلقنه الأدب.",
      },
    },
    faq: {
      en: [
        { q: "What weight medicine ball should I use for chest passes?", a: "Light enough to throw fast — for most adults that means two to six kilograms. If the throw slows down or turns into a heave, the ball is doing strength work, and the bench press already owns that job." },
        { q: "Can I do chest passes without a partner?", a: "Yes — the library's own note sends you to a solid wall. Stand far enough to catch with bent arms, throw hard, and receive the return as your eccentric half; the wall never gets tired of you." },
        { q: "How is a chest pass different from a bench press?", a: "Same muscles, opposite contract: the press moves a heavy load slowly, the pass moves a light load at maximum speed. Training both builds power — the product of force and velocity — which is why throws belong before lifting, not after." },
      ],
      ar: [
        { q: "ما وزن الكرة الطبية المناسب لتمرير الصدر؟", a: "خفيفة بما ترميها بسرعة — ولأغلب البالغين هذا يعني اثنين إلى ستة كيلوغرامات. إن تباطأت الرمية أو تحولت إلى قذف فالكرة تمارس عمل قوة، والبنش برس يملك تلك الوظيفة أصلًا." },
        { q: "هل أستطيع التمرير دون شريك؟", a: "نعم — ملاحظة المكتبة نفسها ترسلك إلى جدار صلب. قف بمسافة تسمح بالتقاط بمرفقين مثنيين، وارمِ بقوة، واستقبل الرد نصفك السالب؛ فالجدار لا يملّ منك أبدًا." },
        { q: "كيف يختلف تمرير الصدر عن البنش برس؟", a: "نفس العضلات وعقد معاكس: الدفعة تحرك حملًا ثقيلًا ببطء، والتمريرة تحرك حملًا خفيفًا بأقصى سرعة. وتدريب الاثنين يبني القدرة — حاصل ضرب القوة في السرعة — ولهذا تنتمي الرميات قبل الرفع لا بعده." },
      ],
    },
    links: [
      { hrefEn: "/exercises/plyo-push-up", hrefAr: "/ar/exercises/plyo-push-up", labelEn: "Plyo push-up — the floor explosive press", labelAr: "الضغط البليومتري — الدفع المتفجر الأرضي" },
      { hrefEn: "/programs/home-fat-loss-hiit", hrefAr: "/ar/programs/home-fat-loss-hiit", labelEn: "Home fat-loss HIIT program", labelAr: "برنامج الهيت المنزلي لخسارة الدهون" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log your throws in the free tracker", labelAr: "سجّل رمياتك في المتتبع المجاني" },
    ],
  },
};
