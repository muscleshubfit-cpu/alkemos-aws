/**
 * EXERCISES-ENRICHMENT — BATCH 13 (tail batch 1, exercises 61-65 of the
 * enrichment program; SEO-GROWTH plan Phase 3 — owner order 2026-11-06).
 *
 * The chest half's first file — the plan's own priority order (audit 05 §ج:
 * «أولوية بالطلب المقيس (hubs البطن/الصدر أولًا)»). The decline family
 * (barbell, dumbbells, flyes, push-up) plus the standing cable press.
 * Facts quoted (grip widths, elbow paths, bench angles) come from each
 * exercise's own rows in src/lib/exercises.ts.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_13: Record<string, ExerciseEnrichment> = {
  "decline-barbell-bench-press": {
    intro: {
      en: "The decline bench press is the flat bench's stubborn sibling: same bar, same press, different angle — head lower than hips, feet hooked, and the bar's path drifting toward the bottom of the ribcage where the lower chest fibers actually live. The library lists it as a beginner-friendly press, and the reason is mechanical honesty: the decline angle shortens the bar's travel and rolls the shoulders into a protected pocket, which is why many lifters who fear flat pressing find they can move real weight here within a session or two. The page exists to make that angle earn its keep — the lower chest gets targeted only if the elbows and the bar path follow the bench's geometry instead of the flat press's habits.",
      ar: "بنش برس المائل للأسفل هو الشقيق العنيد للبنش المستوي: نفس البار ونفس الدفع وزاوية مختلفة — الرأس أدنى من الوركين، والقدمان معلقتان، ومسار البار ينحرف نحو أسفل القفص الصدري حيث تسكن ألياف الصدر السفلية فعلًا. تسجل المكتبة الحركة بوصفها دفعًا ملائمًا للمبتدئين، والسبب صدق ميكانيكي: زاوية الميل تقصّر مسار البار وتُدحرج الكتفين إلى جيب محمي، ولهذا يجد كثير ممن يخشون الدفع المستوي أنهم يحركون وزنًا حقيقيًا هنا خلال جلسة أو جلستين. وُجدت هذه الصفحة لتجعل الزاوية تستحق وجودها — فالصدر السفلي لا يستهدف إلا إذا اتبع المرفقان ومسار البار هندسة البنش لا عادات الدفع المستوي.",
    },
    sections: {
      en: {
        muscles: "The pectoralis major's sternal head is the target the bench's angle buys — the library also credits shoulders and triceps, which is every press's honest tax. With the torso tilted, the humerus travels up and slightly toward the feet, which lines the lower fibers of the chest along the push; the front delts assist without taking over the way they can on inclines, and the triceps lock out the final third as always. The steeper the bench, the more the movement belongs to the chest's bottom edge — and the less the shoulder has to argue about.",
        mistakes: [
          { error: "Setting up with the bar's path drifting toward the neck, flat-bench style.", fix: "The descent aims for the lower chest, below the nipple line where the angle points — the bench's geometry, not habit, draws the line." },
          { error: "Flaring the elbows to ninety degrees from the torso.", fix: "Tuck to a moderate angle — roughly forty-five degrees — so the shoulders sit in the protected pocket the decline is famous for." },
          { error: "Bouncing the bar off the sternum to buy momentum.", fix: "Touch light, press controlled; the decline's short stroke removes every excuse the bounce ever had." },
          { error: "Feet unhooked or pushing the body up the bench with each rep.", fix: "The hooks hold the set's anchor; if the legs are driving the torso, the press has quietly become a leg exercise wearing a bar." },
        ],
        alternatives: "The decline family stocks every aisle. The dumbbell version on its own page lets each arm find its own groove and deepens the stretch; the decline push-up delivers the same lower-chest angle with feet on a box and no barbell in sight; the flat bench press remains the family's volume base; and the dip's chest-leaning page owns the deepest overload this territory gets. Most programs run decline as one slot inside a chest day, not as the day itself.",
        progression: "The angle already gifts leverage, so progression here is refreshingly plain: add small increments while the bar path and the elbow tuck hold their shape, week after week. When the bar stalls, swap one weekly session's barbell for dumbbells to rebuild the bottom stretch, or rotate to the decline push-up for a high-rep pump block. Advanced lifters treat the decline as an accessory to dips and flat pressing — its job is the lower shelf, not the whole house.",
        programming: "Three to four sets of six to twelve reps inside a chest session, after the day's primary press. The decline slots naturally second or third — warmed by the flat work, fresh enough to carry load. A common split runs flat barbell first, dumbbell press second, decline third, flye movement fourth. During a mass phase it earns its slot with heavy doubles-and-triples blocks; during a cut it keeps the lower chest dense with moderate loads and honest tempo.",
        safety: "Two structural notes. The eyes start below the bar on a decline, which is why a spotter or safety pins matter more here than anywhere — the roll of shame runs downhill. And the shoulder pocket that makes the decline comfortable disappears the moment elbows flare wide; keep the tuck, keep the grip width matched to the page's setup, and the joint stays quiet. Any history of shoulder impingement usually gets along with declines better than flat pressing — with a clinician's blessing as always.",
      },
      ar: {
        muscles: "الرأس القصي للعضلة الصدرية الكبرى هو الهدف الذي تشتريه زاوية البنش — والمكتبة تسجل أيضًا الكتفين والترايسبس، وهذه ضريبة كل دفع أمينة. فمع ميل الجذع يسافر عظم العضد صاعدًا ومائلًا قليلًا نحو القدمين، وهو ما يصفّ الألياف السفلية للصدر على امتداد الدفعة؛ والدالية الأمامية تساعد دون أن تستحوذ كما تفعل على المائل صاعدًا، والترايسبس يقفل الثلث الأخير كالعادة. كلما ازداد ميل البنش ازدادت ملكية الحركة للحافة السفلية للصدر — وقلّ ما على الكتف أن يجادل.",
        mistakes: [
          { error: "إعداد يجعل مسار البار ينحرف نحو الرقبة على طريقة البنش المستوي.", fix: "النزول يستهدف أسفل الصدر، تحت خط الحلمة حيث تشير الزاوية — هندسة البنش هي من يرسم الخط لا العادة." },
          { error: "فتح المرفقين إلى تسعين درجة عن الجذع.", fix: "اضمّ إلى زاوية معتدلة — نحو خمس وأربعين درجة — فتجلس الكتفان في الجيب المحمي الذي اشتهر به المائل." },
          { error: "ارتداد البار عن عظم القص لشراء زخم.", fix: "لامسة خفيفة ودفع متحكم؛ مسار المائل القصير يسقط كل عذر امتلكه الارتداد في تاريخه." },
          { error: "قدمان غير معلقتين أو تدفعان الجسم أعلى البنش مع كل تكرار.", fix: "الخطاطيف تحمل مرساة المجموعة؛ إن صارت الساقان تقودان الجذع فقد صار الدفع خلسةً تمرين أرجل يرتدي بارًا." },
        ],
        alternatives: "عائلة المائل تملأ كل ممر. نسخة الدمبل في صفحتها تتيح لكل ذراع إيجاد مجراها وتعمّق المدّ، وضغط المائل للأسفل يقدم نفس زاوية الصدر السفلي بقدمين على صندوق وبلا بار إطلاقًا، وبنش برس المستوي يبقى قاعدة حجم العائلة، وصفحة الغطس المائلة للصدر تملك أعمق تحميل يحصل عليه هذا الإقليم. وأغلب البرامج تشغّل المائل كشاغر واحد داخل يوم صدر، لا كاليوم كله.",
        progression: "الزاوية تهدي الرافعة أصلًا، فالترقية هنا بسيطة منعشة: أضف مقادير صغيرة ما دام مسار البار وضم المرفق يحفظان شكلهما، أسبوعًا بعد أسبوع. وحين يتعثر البار بدّل بار جلسة أسبوعية إلى الدمبل لإعادة بناء مدّ القاع، أو دور إلى ضغط المائل لكتلة ضخ عالية التكرار. ويعامل المتقدمون المائل كإضافة للغطس والدفع المستوي — وظيفته الرفّ السفلي لا البيت كله.",
        programming: "ثلاث إلى أربع مجموعات من ستة إلى اثني عشر تكرارًا داخل جلسة صدر، بعد دفع اليوم الرئيسي. يجلس المائل طبيعيًا ثانيًا أو ثالثًا — دافئًا بعمل المستوي وطازجًا بما يكفي لحمل الثقل. تقسيم شائع يدير البار المستوي أولًا فالدمبل ثانيًا فالمائل ثالثًا فحركة تفتيح رابعة. وفي مرحلة الكتلة يستحق شاغره بكتل أوزان ثقيلة بتكرارات منخفضة؛ وفي التنشيف يحفظ الصدر السفلي كثيفًا بأحمال متوسطة وإيقاع أمين.",
        safety: "ملاحظتان بنيويتان. تبدأ العينان أسفل البار على المائل، ولهذا يهم الساعد أو مسامير الأمان هنا أكثر من أي مكان — فرحلة العار المذلة تتدحرج نحو الأسفل. وجيب الكتف الذي يجعل المائل مريحًا يختفي لحظة اتساع المرفقين؛ حافظ على الضم وحافظ على عرض قبضة مطابق لإعداد الصفحة فيظل المفصل هادئًا. وأي تاريخ انحشار كتفي يتفق عادة مع المائل أفضل من المستوي — مع بركة الطبيب كالعادة.",
      },
    },
    faq: {
      en: [
        { q: "Is the decline bench press actually necessary?", a: "Necessary, no; useful, yes. It is the press whose geometry lines up the lower chest fibers, and the one many cranky shoulders tolerate best. If flat pressing and dips already fill your week, the decline is a rotation piece, not a requirement." },
        { q: "How steep should the decline be?", a: "Gentle is the rule — most benches' first or second notch, somewhere in the fifteen-to-thirty-degree neighborhood. Past that, the angle starts trading chest work for leverage trivia and the setup gets awkward for spotting." },
        { q: "Why can I lift more on the decline than the flat bench?", a: "Shorter bar path, a shoulder-friendly pressing angle, and a leg-drive line that runs with the press instead of against it. The extra weight is geometry, not suddenly stronger muscles — count it honestly in the tracker." },
      ],
      ar: [
        { q: "هل بنش برس المائل للأسفل ضروري فعلًا؟", a: "ضراري لا؛ مفيد نعم. هو الدفع الذي تصفّ زواياه ألياف الصدر السفلية، وهو أكثر ما تتحمله الأكتاف المتعبة. فإن كان المستوي والغطس يملآن أسبوعك فالمائل قطعة تدوير لا شرط." },
        { q: "ما شدة ميلان البنش المناسبة؟", a: "اللطف هو القاعدة — الدرجة الأولى أو الثانية لأغلب البنشات، في حيّ الخمس عشرة إلى الثلاثين درجة تقريبًا. وبعدها تبدأ الزاوية بمبادلة عمل الصدر بتفاهات الرافعة ويصعب الإعداد على الساعد." },
        { q: "لماذا أرفع على المائل أكثر من المستوي؟", a: "مسار بار أقصر وزاوية دفع ودودة للكتف وخط دفع ساقين يجري مع الضغط لا ضده. الوزن الزائد هندسة لا عضلات صارت أقوى فجأة — عُده بأمانة في المتتبع." },
      ],
    },
    links: [
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training at home — the full guide", labelAr: "تدريب الصدر في المنزل — الدليل الكامل" },
      { hrefEn: "/programs/gym-strength-5x5", hrefAr: "/ar/programs/gym-strength-5x5", labelEn: "Gym strength 5x5 program", labelAr: "برنامج القوة 5×5 بالصالة" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Log every pressing set", labelAr: "سجّل كل مجموعة دفع" },
    ],
  },

  "decline-dumbbell-bench-press": {
    intro: {
      en: "Take the decline press's lower-chest angle and put a dumbbell in each hand: the bench keeps the geometry, and the independent weights change the conversation. Each arm follows its own path, the stretch at the bottom runs deeper than any bar allows, and the two sides must finish their reps together — the library's page lists it as a beginner-level press, which is honest about the movement's learnability and quiet about how demanding good dumbbell discipline becomes on a tilted bench. This is the decline family's workhorse: less bragging weight than the barbell, more honest work per centimeter of range.",
      ar: "خذ زاوية الصدر السفلي من دفع المائل وضع دمبلًا في كل يد: يحفظ البنش الهندسة، وتغيّر الأوزان المستقلة الحديث. تتبع كل ذراع مسارها الخاص، ويمتد المدّ في القاع أعمق مما يسمح به أي بار، وعلى الجانبين إنهاء تكراراتهما معًا — تسجل صفحة المكتبة الحركة دفعًا للمبتدئين، وهذا صادق عن قابلية التعلم وصامت عن مدى صعوبة انضباط الدمبل الجيد فوق بنش مائل. هذه بغلة عمل عائلة المائل: وزن تباهٍ أقل من البار، وعمل أمين أكثر لكل سنتيمتر من المدى — صفقة يوقع عليها كل من جرب أسبوعًا من الدمبلات الحرة فوق بنش مائل ولمس الفرق في صدره بيده.",
    },
    sections: {
      en: {
        muscles: "The sternal chest fibers press the weights up and together along the decline's line, with shoulders and triceps as the library's credited assistants — but the dumbbells rewrite the balance. Each arm balances its own load, so the stabilizers around the shoulder blade work the entire set; the deeper bottom position stretches the lower chest under load, which is territory the barbell's fixed grip never visits; and the top lets the hands converge slightly, adding a squeeze the straight bar forbids. Same family as the barbell decline — different currency.",
        mistakes: [
          { error: "Turning the press into a flye, hands wide and elbows collapsing inward.", fix: "The dumbbells travel up and slightly together like a bar's halves — the press's elbow angle holds; the arc belongs to the flye page." },
          { error: "Dropping into the bottom stretch and bouncing out of it.", fix: "The deep stretch is the movement's gift — pause a beat at the bottom instead of spending it on a rebound the shoulders will bill you for." },
          { error: "Letting the dumbbells drift toward the neck on the descent.", fix: "Aim the elbows toward the lower ribs, below the chest line the bench's angle points at — the same path the barbell page teaches, drawn by geometry." },
          { error: "Kicking the dumbbells into position with the legs and losing the setup.", fix: "Set the weights on the thighs, rock back with them close to the chest, then hook the feet — the tilted bench punishes a sloppy entry harder than the flat one." },
        ],
        alternatives: "The decline aisle is fully stocked in this library. The barbell version carries the heaviest loads on rails; the decline push-up copies the angle with zero equipment; the flat dumbbell press trains the mid-chest with the same independence; and the decline dumbbell flye page takes the same bench and trades press for arc. Rotating between two of these across a training block covers the lower chest more completely than loyalty to any single one.",
        progression: "Load grows in dumbbell-rack steps, which makes patience the programming. Earn the next pair when the top of the rep range arrives with the bottom pause intact; between jumps, progress via tempo — three-count lowers, one-count squeezes at the top. The advanced block pairs this press with the barbell decline on alternating weeks, letting each version load what the other misses.",
        programming: "Three to four sets of eight to twelve reps, second or third movement in a chest session after the day's primary press. The dumbbells' demand on control makes them a natural bridge between the heavy barbell work and the isolation flyes that close the day. On a strength block they hold reps lower and loads heavier; on a hypertrophy run they carry the middle of the session with fuller stretches and slower negatives.",
        safety: "The entry and exit are the hazard zones on any decline dumbbell work — weights come up on the thighs and rock back with control, and leaving the bench reverses the ritual deliberately, never with a twist under load. The shoulder pocket from the barbell page applies here too: moderate elbow tuck, descent toward the lower ribs. Shoulders that complain at the very bottom can shorten the range by an inch without losing the angle's benefit.",
      },
      ar: {
        muscles: "ألياف الصدر القصية تدفع الوزنين صاعدَين ومتقاربَين قليلًا على خط المائل، والكتفان والترايسبس مساعدان مسجلان — لكن الدمبلين يعيدان كتابة الميزان. كل ذراع توازن حملها، فتعمل مثبتات لوح الكتف طوال المجموعة؛ ووضع القاع الأعمق يمدّ الصدر السفلي تحت الحمل، وهو إقليم لا تزوره قبضة البار الثابتة أبدًا؛ والقمة تتيح لليدين التقارب قليلًا فيضيف عصرة يحظرها البار المستقيم. نفس عائلة مائل البار — لكن بعملة مختلفة تمامًا: استقلال الذراعين يكشف الفروق بين الجانبين ويصححها بمرور الوقت.",
        mistakes: [
          { error: "تحويل الدفع إلى تفتيح، يدان واسعتان ومرفقان ينفيان للداخل.", fix: "يسافر الدمبلان صاعدَين متقاربَين قليلًا كنصفَي بار — زاوية مرفق الدفع تصمد؛ القوس ملك صفحة التفتيح." },
          { error: "السقوط إلى مدّ القاع والارتداد منه.", fix: "المدّ العميق هدية الحركة — توقف لحظة في القاع بدل إنفاقه على ارتداد سيحاسبك عليه الكتفان." },
          { error: "ترك الدمبلين ينحرفان نحو الرقبة في النزول.", fix: "صوّب المرفقين نحو الأضلاع السفلى، تحت خط الصدر الذي تشير إليه زاوية البنش — نفس المسار الذي تعلمه صفحة البار، ترسمه الهندسة." },
          { error: "رفس الدمبلين إلى الوضع بالساقين وفقدان الإعداد.", fix: "ضع الوزنين على الفخذين وتدحرج للخلف وهما قريبان من الصدر ثم علّق القدمين — البنش المائل يعاقب الدخول المهمل أقسى من المستوي." },
        ],
        alternatives: "ممر المائل مخزن بالكامل في هذه المكتبة. نسخة البار تحمل أثقل الأوزان على قضبان؛ وضغط المائل للأسفل ينسخ الزاوية بصفر عتاد؛ وبنش الدمبل المستوي يدرّب وسط الصدر بنفس الاستقلال؛ وصفحة تفتيح الدمبل المائل تأخذ نفس البنش وتستبدل الدفع بقوس. والدوران بين اثنتين منها عبر كتلة تدريب كاملة يغطي الصدر السفلي تغطية أكمل من الولاء الأعمى لواحدة، ويمنح المفاصل تنويعًا يحفظها من برودة الرتابة.",
        progression: "ينمو الحمل بدرجات رف الدمبل، وهذا يجعل الصبر هو البرمجة. استحق الزوج التالي حين يصل أعلى نطاق التكرارات وتوقف القاع سليمًا؛ وبين القفزات تقدم بالإيقاع — نزلات بثلاث عدّات وعصرات لعدة عند القمة. والكتلة المتقدمة تقارن هذا الدفع بمائل البار في أسابيع متناوبة، فتحمل كل نسخة ما تفوته الأخرى: البار يبني العلوق والدمبل يبني المدى. ومن ينفد من درجات الرف يطيل التوقفات في القاع بدل الاستعجال.",
        programming: "ثلاث إلى أربع مجموعات من ثمانية إلى اثني عشر تكرارًا، حركة ثانية أو ثالثة في جلسة صدر بعد دفع اليوم الرئيسي. متطلبات الدمبل للسيطرة تجعلها جسرًا طبيعيًا بين عمل البار الثقيل وتفتيحات العزل التي تختم اليوم. وفي كتلة القوة تحفظ التكرارات أدنى والأحمال أثقل؛ وفي جولة التضخيم تحمل وسط الجلسة بمدود أكمل ونزلات أبطأ.",
        safety: "الدخول والخروج هما منطقتا الخطر في أي عمل دمبل مائل — يصعد الوزنان على الفخذين ويتدحرج الجسم للخلف بسيطرة، ومغادرة البنش تعكس الطقس عمدًا لا بليّ فوق حمل. وجيب الكتف من صفحة البار يسري هنا أيضًا: ضم مرفق معتدل ونزول نحو الأضلاع السفلى. والكتفان اللتان تشتكيان عند القاع جدًا تستطيعان تقصير المدى بوصة دون فقدان فائدة الزاوية.",
      },
    },
    faq: {
      en: [
        { q: "Dumbbells or barbell on the decline?", a: "Barbell for load, dumbbells for range — the rails of a fixed bar carry more weight; the independent dumbbells stretch deeper and expose a weak side. Run both across the week and the question answers itself in your log." },
        { q: "Why do my dumbbells clang together at the top?", a: "Because the press is turning into a squeeze contest. The hands come up and slightly together — light contact at most — with the chest finishing the rep, not the knuckles." },
        { q: "How do I get the dumbbells up on a decline bench safely?", a: "Thighs first, rock back with the weights close to the chest, feet hooked last — and the same ritual reversed to leave. If the pair is too heavy to stage, the pair is too heavy for the set." },
      ],
      ar: [
        { q: "الدمبل أم البار على المائل؟", a: "البار للحمل والدمبل للمدى — قضبان البار الثابت تحمل وزنًا أكبر؛ والدمبلان المستقلان يمتان أعمق ويكشفان جانبًا ضعيفًا. شغّل الاثنين عبر الأسبوع فيجيب السجل نفسه عن السؤال." },
        { q: "لماذا يتصادم الدمبلان في القمة؟", a: "لأن الدفع يتحول إلى مسابقة عصر. تصعد اليدان وتتقاربان قليلًا — تلامس خفيف في الأقصى — والصدر هو من يختم التكرار لا المفاصل." },
        { q: "كيف أرفع الدمبلين على بنش مائل بأمان؟", a: "الفخذان أولًا، وتدحرج للخرب بالوزنين قريبين من الصدر، وتعليق القدمين أخيرًا — والطقس نفسه معكوسًا للمغادرة. إن كان الزوجين أثقل من أن يُجهزا فالزوجان أثقل من المجموعة." },
      ],
    },
    links: [
      { hrefEn: "/blog/12-week-dumbbell-band-muscle-plan", hrefAr: "/ar/blog/home-muscle-building-guide-simple-weights", labelEn: "12-week dumbbell muscle plan", labelAr: "خطة بناء العضلات بأوزان بسيطة" },
      { hrefEn: "/programs/home-dumbbell-ppl", hrefAr: "/ar/programs/home-dumbbell-ppl", labelEn: "Home dumbbell push-pull-legs", labelAr: "دفع وسحب وأرجل بالدمبل منزليًا" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Workout tracker", labelAr: "متتبع التمارين" },
    ],
  },

  "decline-dumbbell-flyes": {
    intro: {
      en: "The decline flye trades the press's push for an arc: same tilted bench, same lower-chest territory, but the dumbbells sweep outward and inward on a widening circle that stretches the chest at the bottom and squeezes it at the top — the library's movement description keeps it pure, elbows soft and fixed, no press hiding inside the arc. It is the isolation half of the decline family's work: lighter weights, longer levers, and a burn that arrives precisely where the angle aims. Flyes do not build the press; they finish the details the press left rough.",
      ar: "تفتيح المائل يقايض دفع الكبسة بقوس: نفس البنش المائل ونفس أرض الصدر السفلي، لكن الدمبلين يكنستان خارجًا وداخلًا على دائرة تتسع فتمدّ الصدر في القاع وتعصره في القمة — ووصف المكتبة للحركة يبقيها نقية، مرفقان لينان ثابتان، ولا دفع متخفي داخل القوس. إنها نصف العزل من عمل عائلة المائل: أوزان أخف ورافعات أطول وحرقان يصل بالضبط حيث تصوب الزاوية. التفتيحات لا تبني الكبسة؛ إنها تنهي التفاصيل التي تركها الدفع خشنة، وتصقل ما تحت خط الأضلاع بصبر الحرفة لا بسرعة الكبسة ولا بغطرسة الوزن الثقيل.",
    },
    sections: {
      en: {
        muscles: "The sternal head of the pectoralis major owns the arc — the library lists it with no secondary movers, which is the point of a flye. With the elbows holding a soft, fixed bend, the chest's fibers stretch as the arms open along the decline's plane and shorten as they close above the lower chest; the shoulders and triceps that taxed the press family are bystanders here, working only to hold the elbow's curve steady. That single-joint honesty is why the weights are small and the reps burn early.",
        mistakes: [
          { error: "Bending the elbows more as the weights drop, turning the arc into a sloppy press.", fix: "The elbow angle is set at the top and carried unchanged through the whole circle — the moment it folds, the flye has quietly resigned." },
          { error: "Lowering until the shoulders scream at the extreme stretch.", fix: "Stop the descent at the chest's natural end of range — a deep stretch with control, not a depth record; the decline already adds stretch the flat bench never had." },
          { error: "Clanging the dumbbells together at the top and resting there.", fix: "Finish with the hands nearly touching and the chest squeezed — no contact, no vacation; the rep's top is a contraction, not a rest stop." },
          { error: "Pressing the elbows down toward the hips on the close.", fix: "The arc closes over the lower chest on the bench's line, palms facing each other throughout — swooping toward the hips turns a chest flye into a pullover impersonation." },
        ],
        alternatives: "The flye counter in this library has every flavor. The flat dumbbell flye page runs the same arc on a level bench; the cable crossover page keeps tension at the very top where dumbbells go light; the pec-deck's butterfly page holds the arc on rails for lifters whose shoulders prefer machinery; and the decline press remains the compound partner every flye program pairs it with. The choice between them is about where tension is wanted most, not which is 'best'.",
        progression: "Flye loads move in dumbbell-rack steps and humility: add the next pair only when the current one completes its full arc with the pause intact. Between jumps, progress by range — a deeper controlled stretch at the bottom, a fuller second of squeeze at the top — and by tempo, with three-count lowers becoming the standard. Advanced blocks run a flye movement before the press as a pre-fatigue, or after it as the day's finisher to failure.",
        programming: "Three sets of ten to fifteen slow arcs, closing a chest session after the pressing is done. The movement earns one slot, maybe two in specialization blocks — it is a detail tool, not a foundation. Pairing it with the decline press in the same session covers the lower chest from both the strength and stretch directions. In a cut, flyes keep the shape full under lighter loads when heavy pressing beats up the joints.",
        safety: "The shoulder joint writes the rules for every flye: the arc travels only as far as the chest controls it, and pain at the bottom of the stretch is the cue to shorten the circle by degrees, not to stretch harder. The elbows' soft bend is armor — locked elbows route the load into the joint itself. Setting the dumbbells up uses the same thigh-and-rock ritual as the decline press page, and leaving the bench reverses it deliberately.",
      },
      ar: {
        muscles: "الرأس القصي للصدرية الكبرى يملك القوس — والمكتبة تسجله بلا عضلات ثانوية، وهذا معنى التفتيح. فبقاء المرفقين على انحناء لين ثابت تتمدد ألياف الصدر مع افتتاح الذراعين على مستوى المائل وتقصر مع إغلاقهما فوق الصدر السفلي؛ والكتفان والترايسبس اللتان فرضا ضريبتهما على عائلة الدفع متفرجان هنا، تعملان فقط على تثبيت انحناء المرفق. تلك أمانة المفصل الواحد التي تجعل الأوزان صغيرة والتكرارات تحترق مبكرًا.",
        mistakes: [
          { error: "زيادة ثني المرفقين مع هبوط الوزنين فيتحول القوس إلى دفع مهمل.", fix: "زاوية المرفق تضبط في القمة وتُحمل دون تغيير عبر الدائرة كلها — لحظة تنطوي تكون التفتيحة قد استقالت خلسة." },
          { error: "النزول حتى تصرخ الكتفان عند المدّ الأقصى.", fix: "أوقف النزول عند النهاية الطبيعية لمدى الصدر — مدّ عميق بسيطرة لا رقم قياسي في العمق؛ فالمائل يضيف أصلًا مدًّا لم تعرفه الأرضية." },
          { error: "تصادم الدمبلين في القمة والاستراحة هناك.", fix: "اختم واليدان تلامسان تقريبًا والصدر معصور — بلا تلامس وبلا عطلة؛ قمة التكرار انقباض لا محطة راحة." },
          { error: "دفع المرفقين نحو الوركين عند الإغلاق.", fix: "يُغلق القوس فوق الصدر السفلي على خط البنش والكفان متقابلان طوال الوقت — الانقضاض نحو الوركين يحول تفتيح الصدر إلى انتحال بول أوفر." },
        ],
        alternatives: "كاونتر التفتيح في هذه المكتبة يضم كل النكهات. صفحة تفتيح الدمبل المستوي تدير نفس القوس على بنش أفقي، وصفحة التقاطع بالكيبل تحفظ الشد حتى القمة حيث تخف الدمبلات، وصفحة الفراشة (جهاز) تُبقي القوس على قضبان لمن تفضل أكتافهم الآلات، ويبقى دفع المائل الشريك المركب الذي تقترن به كل برنامج تفتيح. والاختيار بينها عن موضع الشد المطلوب لا عن أيها «أفضل».",
        progression: "أحمال التفتيح تتحرك بدرجات الرف وبالتواضع: أضف الزوج التالي فقط حين يكمل الزوج الحالي قوسه كاملًا وتوقفه سليمًا. وبين القفزات تقدم بالمدى — مدّ أعمق متحكم فيه في القاع وعصر أطول بثانية في القمة — وبالإيقاع حتى تصبح النزلات بثلاث عدّات هي المعيار. وتدير الكتل المتقدمة حركة تفتيح قبل الدفع كإجهاد مسبق أو بعده كخاتمة اليوم حتى الفشل.",
        programming: "ثلاث مجموعات من عشرة إلى خمسة عشر قوسًا بطيئًا تختم جلسة الصدر بعد انتهاء الدفع. تستحق الحركة شاغرًا واحدًا، وربما اثنين في كتل التخصص — إنها أداة تفصيل لا أساس. واقترانها بدفع المائل في الجلسة نفسها يغطي الصدر السفلي من اتجاهي القوة والمد. وفي التنشيف تحفظ التفتيحات الشكل ممتلئًا تحت أحمال أخف حين تنهك الدفع الثقيل المفاصل.",
        safety: "مفصل الكتف يكتب قواعد كل تفتيحة: يسافر القوس فقط إلى حيث يسيطر عليه الصدر، والألم في قاع المدّ إشارة لتقصير الدائرة درجات لا للتمدد أشد. ولين المرفقين درع — فالمرفقان المقفولان يوجّهان الحمل إلى المفصل نفسه. ويستخدم رفع الدمبلين إلى الوضع الطقس نفسه (الفخذ والتدحرج) من صفحة دفع المائل، ومغادرة البنش تعكسه عمدًا خطوة خطوة لا بليّة واحدة متسرعة فوق حمل ثقيل.",
      },
    },
    faq: {
      en: [
        { q: "Can I press the weight up if the flye gets hard?", a: "You can, and the moment you do the set has changed exercises. The elbow angle is the flye's identity — when it folds, finish the set with honest failure on the arc or rack the weights and move on." },
        { q: "Why flyes at all if presses exist?", a: "Different job. Presses load the chest with the shoulders and triceps sharing; flyes load the chest almost alone, through a longer stretch and a squeeze no bar offers. Programs use both because the two jobs are not substitutes." },
        { q: "Decline flyes hurt my shoulders — what now?", a: "Shrink the arc first: less depth at the bottom, same angle, same squeeze. If the ache persists, rotate to the butterfly machine page where the rails hold the arc, or the cable crossover where tension stays high without dumbbells' bottom-heavy load." },
      ],
      ar: [
        { q: "أأستطيع دفع الوزن صاعدًا إذا صعبت التفتيحة؟", a: "تستطيع، وفي اللحظة نفسها تكون المجموعة قد بدّلت التمرين. زاوية المرفق هي هوية التفتيح — حين تنطوي فاختم المجموعة بفشل أمين على القوس أو أنزل الوزنين وامضِ." },
        { q: "لماذا التفتيحات أصلًا والدفوعات موجودة؟", a: "وظيفة مختلفة. الدفع يحمل الصدر والكتفان والترايسبس تتقاسم؛ والتفتيح يحمله وحده تقريبًا، عبر مدّ أطول وعصرة لا يمنحها أي بار. تستخدم البرامج الاثنين لأن الوظيفتين ليستا بديلين." },
        { q: "تفتيحات المائل تؤلم كتفي — ماذا أفعل؟", a: "قلّص القوس أولًا: عمق أقل في القاع بنفس الزاوية ونفس العصرة. وإن استمر الألم فدور إلى صفحة جهاز الفراشة حيث تحفظ القضبان القوس، أو التقاطع بالكيبل حيث يبقى الشد عاليًا بلا حمل الدمبلات الثقيل في القاع." },
      ],
    },
    links: [
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-home-workout-guide", labelEn: "Chest training guide", labelAr: "دليل تدريب الصدر" },
      { hrefEn: "/programs/home-dumbbell-ppl", hrefAr: "/ar/programs/home-dumbbell-ppl", labelEn: "Dumbbell push-pull-legs program", labelAr: "برنامج دمبل دفع وسحب وأرجل" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Free tracker for every set", labelAr: "متتبع مجاني لكل مجموعة" },
    ],
  },

  "decline-push-up": {
    intro: {
      en: "Feet on a box, hands on the floor, body sloping downhill toward the head — the decline push-up is the flat push-up rotated until gravity's share lands on the lower chest: the library's page files it under chest with the decline's signature target, and the body becomes its own bench. The movement costs nothing, travels anywhere, and scales with the height of whatever the feet find — a step, a chair, a bed. For the lifter between benches or between gym days, it is the decline family's entire argument in one piece of furniture.",
      ar: "القدمان على صندوق واليدان على الأرض والجسد ينحدر نحو الرأس — ضغط المائل للأسفل هو الضغط الأرضي مدورًا حتى يحط نصيب الجاذبية على الصدر السفلي: صفحة المكتبة تقيده تحت الصدر بهدف المائل المعروف، ويصير الجسد بنشه الخاص. لا تكلف الحركة شيئًا وتسافر إلى أي مكان وتتدرج بارتفاع أي شيء تجده القدمان — درجة أو كرسيًا أو سريرًا. وللرياضي بين بنشين أو بين أيام صالة، إنها حجّة عائلة المائل كلها في قطعة أثاث واحدة، تجلس في أي غرفة وتنتظر بلا صيانة ولا اشتراك ولا زاوية خاصة تخصص لها.",
    },
    sections: {
      en: {
        muscles: "The pectoralis major's lower fibers press the body back up the slope, with shoulders and triceps credited as assistants — the same trio as every decline press, priced in bodyweight. The elevated feet shift the load toward the chest's bottom edge and the shoulders' front; the higher the box, the more the movement borrows from the shoulder's overhead territory and the harder the whole affair becomes. The abs and glutes run the plank that keeps the body one straight line from ankles to ears — a sagging hip converts the exercise into something else entirely.",
        mistakes: [
          { error: "Hips sagging toward the floor while the chest does the work.", fix: "Squeeze the glutes and brace — the body is a plank on a slope, and the rep counts only while the line holds." },
          { error: "Head diving first, chin reaching for the floor.", fix: "The chest leads the descent toward the floor, nose behind the breastbone's line; the neck is a passenger with a view." },
          { error: "Hands set too far forward, turning the rep into a stretched-out plank.", fix: "Hands under the shoulders' line, slightly wider — the same geometry as the flat push-up page teaches, just downhill." },
          { error: "Bouncing the chest off the floor for rebound reps.", fix: "Touch light and press up the slope under control; the floor is a depth reference, not a trampoline." },
        ],
        alternatives: "The push-up shelf in this library is deep. The flat push-up is the movement's home base; the standard page scales it for absolute beginners; the dips-chest-version page offers the parallel-bars overload the decline angle points toward; and the decline dumbbell press carries the same lower-chest angle with countable iron. When the box stops challenging, elevation grows — and past the highest box, the family hands you to the deficit or archer variations on the bodyweight pages.",
        progression: "The progression dial is the box's height: start with a low step and earn the next tier when the top of the rep range arrives with a plank that never breaks. Then tempo — three-count lowers, one-second bottom pauses — then foot elevation one notch at a time until the movement approaches a wall-facing handstand press's territory. Advanced lifters use the decline push-up as a high-rep finisher after pressing days or as hotel-room insurance on the road.",
        programming: "Three to five sets of eight to twenty reps, in a chest session's warm-up, its finisher, or a whole home-training day built around push-up variations. The movement slots anywhere because it is both warm-up tool and hypertrophy work at different elevations. Pair it with a rowing movement on home days so the week's pushing and pulling stay in balance — the library's back pages stock the partners.",
        safety: "The wrists are the first structure to speak on any elevated push-up — fingers spread, weight through the palm's heel, and a fist or handle position if the flat wrist complains. The box must be stable before the first rep; a sliding chair mid-set is an injury with good timing. Shoulder pain at the bottom means the elevation outgrew the joint — lower the box, not the standards. The plank line is the spine's protection throughout.",
      },
      ar: {
        muscles: "ألياف الصدرية الكبرى السفلى تدفع الجسد عائدًا أعلى المنحدر، والكتفان والترايسبس مساعدان مسجلان — الثلاثي نفسه لكل دفع مائل، مسعّرًا بوزن الجسم. القدمان المرتفعتان تنقلان الحمل نحو الحافة السفلى للصدر ومقدم الكتف؛ وكلما ارتفع الصندوق اقترضت الحركة أكثر من أرض الكتف العلوية وصعب الأمر كله، حتى يصبح اختيار الارتفاع نفسه أداة التدرج الأولى التي لا تحتاج ريالًا واحدًا إضافيًا. والبطن والألوية تديران البلانك الذي يبقي الجسد خطًا مستقيمًا من الكاحلين إلى الأذنين — فوركّة ورك هابطة تحول التمرين إلى شيء آخر تمامًا.",
        mistakes: [
          { error: "هبوط الوركين نحو الأرض بينما الصدر ينجز العمل.", fix: "اعصر الألوية واشدد — الجسد بلانك على منحدر، ولا يُحتسب التكرار إلا ما دام الخط صامدًا." },
          { error: "الرأس تغوص أولًا والذقن تلامس الأرض.", fix: "الصدر يقود النزول نحو الأرض والأنف خلف خط عظمة القص؛ الرقبة راكب يتمتع بالمنظر." },
          { error: "يدان موضوعتان بعيدتين للأمام فيتحول التكرار إلى بلانك ممدود.", fix: "اليدان تحت خط الكتفين أعرض قليلًا — نفس هندسة صفحة الضغط الأرضي، نازلة التل فحسب." },
          { error: "ارتداد الصدر عن الأرض لشراء تكرارات.", fix: "لامسة خفيفة ودفع أعلى المنحدر بسيطرة؛ الأرض مرجع عمق لا ترامبولين." },
        ],
        alternatives: "رف الضغط في هذه المكتبة عميق. الضغط الأرضي المستوي قاعدة الحركة، والصفحة القياسية تعايره للمبتدئين المطلقين، وصفحة الغطس بنسخة الصدر تقدم تحميل القضبان المتوازية الذي تشير إليه زاوية المائل، ودفع الدمبل المائل يحمل نفس زاوية الصدر السفلي بحديد قابل للعد. وحين يتوقف الصندوق عن التحدي يرتفع التقييد — وبعد أعلى صندوق تسلمك العائلة إلى تنويعات العجز والرامي في صفحات وزن الجسم.",
        progression: "قرص الترقية هو ارتفاع الصندوق: ابدأ بدرجة منخفضة واستحق الطبقة التالية حين يصل أعلى نطاق التكرارات وبلانك لم ينكسر قط. ثم الإيقاع — نزلات بثلاث عدّات وتوقفات لثانية في القاع — ثم رفع القدم درجة درجة حتى تقترب الحركة من أرض دفع الوقوف على اليدين مواجه الجدار. ويستعمل المتقدمون ضغط المائل كخاتمة عالية التكرارات بعد أيام الدفع أو كتأمين غرفة فندق في السفر.",
        programming: "ثلاث إلى خمس مجموعات من ثمانية إلى عشرين تكرارًا، في إحماء جلسة الصدر أو خاتمتها أو يوم منزلي كامل مبني حول تنويعات الضغط. يدخل التمرين في أي مكان لأنه أداة إحماء وعمل تضخيم في آن عند ارتفاعات مختلفة. واقترنه بحركة سحب في الأيام المنزلية ليتوازن دفع الأسبوع مع سحبه — وصفحات الظهر في المكتبة تخزن الشركاء.",
        safety: "المعصمان أول من يتكلم في أي ضغط مرتفع — أصابع مفرودة وثقل عبر كعب الكف، ووضع قبضة أو مقبض إن اشتكى المعصم المسطح. ويجب أن يكون الصندوق ثابتًا قبل أول تكرار؛ فكرسو منزلق وسط المجموعة إصابة بتوقيت ممتاز. وألم الكتف في القاع يعني أن الارتفاع تجاوز المفصل — أنزل الصندوق لا المعايير. وخط البلانك حماية العمود من البداية للنهاية.",
      },
    },
    faq: {
      en: [
        { q: "How high should my feet be?", a: "High enough that the lower chest feels like the customer — for most lifters a step to a chair's seat. Past hip height the shoulders start taking the order, and past that the movement is a different exercise wearing this one's name." },
        { q: "Are decline push-ups better than regular ones?", a: "Not better — aimed. The flat push-up spreads the load across the chest; the decline points it downhill toward the lower fibers. Home programs rotate both across the week and let the angles cover the whole muscle." },
        { q: "Can I build a chest with push-ups only?", a: "Yes — this library's bodyweight pages are built on exactly that premise. Elevation, tempo, pauses, and one-hand progressions keep the challenge ahead of the muscle; the chest-at-home guide lays the full route." },
      ],
      ar: [
        { q: "ما ارتفاع قدمي المناسب؟", a: "بقدر ما يشعر الصدر السفلي أنه العميل — ولدى أغلب الرفاع درجة حتى مقعد كرسي. وفوق مستوى الورك تبدأ الكتفان آخذة الطلب، وفوق ذلك تصير الحركة تمرينًا آخر يرتدي اسم هذا." },
        { q: "هل ضغط المائل أفضل من العادي؟", a: "ليس أفضل — بل مصوّب. الضغط المستوي يوزع الحمل عبر الصدر؛ والمائل يوجهه نازلًا نحو الألياف السفلى. وتدير البرامج المنزلية كليهما عبر الأسبوع وتدع الزوايا تغطي العضلة كاملة." },
        { q: "أستطيع بناء صدر بالضغط فقط؟", a: "نعم — صفحات وزن الجسم في هذه المكتبة مبنية على هذه الفرضية بالضبط. الارتفاع والإيقاع والتوقفات وتدرجات اليد الواحدة تُبقي التحدي جاثمًا أمام العضلة دائمًا؛ ودليل الصدر في المنزل لدينا يرسم الطريق كاملًا بمحطاته مرتبة." },
      ],
    },
    links: [
      { hrefEn: "/blog/chest-muscle-bodyweight-home-guide", hrefAr: "/ar/blog/chest-muscle-bodyweight-home", labelEn: "Chest at home — bodyweight guide", labelAr: "الصدر في المنزل بوزن الجسم" },
      { hrefEn: "/blog/home-muscle-building-no-equipment-guide", hrefAr: "/ar/blog/home-muscle-building-guide-no-equipment", labelEn: "Home muscle building without equipment", labelAr: "بناء العضلات منزليًا بلا عتاد" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track the elevation and the reps", labelAr: "تتبع الارتفاع والتكرارات" },
    ],
  },

  "cable-chest-press": {
    intro: {
      en: "Stand between two cables, handles at mid-pulley height, and press forward until the hands meet in front of the chest — the cable chest press takes the bench press's push and hands it to a machine that never lets go. Where a barbell unloads at the top and goes heaviest at the bottom, the cables pull constantly through every degree; where a bench fixes your back to a pad, standing frees the trunk to do its real job. The library lists it as a beginner-friendly chest movement, and the honest framing is this: it is the press that teaches what tension means, because it never grants a resting point.",
      ar: "قف بين كيبلين ومقبضان بارتفاع منتصف البكرة، وادفع أمامك حتى تلتقي اليدان أمام الصدر — دفع الصدر بالكيبل يأخذ كبسة بنش برس ويسلمها لآلة لا تترك أبدًا. حيث يفرغ البار في القمة ويكون أثقل ما يكون في القاع، تشد الكيبلات باستمرار عبر كل درجة؛ وحيث يثبت البنش ظهرك على لوح، يحرر الوقوف الجذع ليعمل وظيفته الحقيقية. تسجل المكتبة الحركة صدرية ملائمة للمبتدئين، والتأطير الأمين هذا: هي الدفعة التي تعلّم معنى الشد، لأنها لا تمنح نقطة راوة أبدًا.",
    },
    sections: {
      en: {
        muscles: "The pectoralis major leads the press, with shoulders and triceps as the library's credited partners — the standing setup adds the trunk's quiet shift to the ledger. The handles travel forward and slightly inward, drawing the arms across the chest's fibers in a press-flavored version of the crossover's arc; the cable's line keeps those fibers loaded at full arm extension, exactly where a dumbbell's contribution dies. One foot forward turns the body into a stable press frame; the abs and glutes hold it there for every rep.",
        mistakes: [
          { error: "Setting the pulleys high and pressing downward into a decline impersonation.", fix: "Mid-height pulleys put the press's line across the chest, as the page sets it; high cables flip the movement toward a downward crossover the shoulders did not sign up for." },
          { error: "Letting the handles drag the arms back into a shoulder-heavy stretch at the return's end.", fix: "Stop the negative just before the chest stops controlling the stretch — the constant tension that sells this movement is also the fastest way to overdo it." },
          { error: "Rocking the torso into each press like a standing incline conspiracy.", fix: "A staggered stance with a braced trunk; the handles move, the ribs stay — body English here steals the load from the chest and gives it to momentum." },
          { error: "Pressing with straight-ish arms and locked elbows from the start.", fix: "The elbows bend at the stretch and extend through the press — this is a press, and its mechanics are the barbell's, not a flye's locked-arc rules." },
        ],
        alternatives: "The standing press shelf has several exits in this library. The flat-bench cable flye page runs the same constant tension lying down; the cable crossover stays on the arc for pure adduction; the barbell and dumbbell bench pages carry the heaviest loads with gravity's help; and the push-up family answers when no gym is in reach. The cable press's niche is tension without rest points and pressing without a bench — useful on fried shoulders and crowded benches alike.",
        progression: "The pin stack makes progression arithmetic: add weight when the rep range's top arrives with form intact, and let the count settle back down. Between pin jumps, slow the negative and extend the squeeze at the hands-together finish. The advanced block runs single-arm presses to hunt the trunk's anti-rotation work or drops the weight for finisher clusters after the day's barbell pressing is done.",
        programming: "Three to four sets of eight to fifteen reps, placed after the primary pressing or as the chest day's constant-tension second act. It pairs naturally with a barbell press in the same session — the bar loads the bottom, the cable loads the top, and the chest receives both letters. In a cut, the movement keeps the chest working while joints rest from heavy iron; in a mass phase it finishes the muscle under a pump the bench cannot offer.",
        safety: "The standing frame is the safety story: staggered feet, braced trunk, ribs down — without it, the cables will happily run the rep with the spine as the hinge. The shoulders earn the usual press care: elbows tracking the chest's line, no collapse at the stretch, and a pin that respects the day's honesty. Cable machines themselves ask one thing — check the handle's clip before the first set; a flying handle is the gym's least dignified injury.",
      },
      ar: {
        muscles: "الصدرية الكبرى تقود الدفع، والكتفان والترايسبس شريكان مسجلان — ووقوف الإعداد يضيف إلى السجل التحولة الهادئة للجذع. يسافر المقبضان أمامًا وداخلًا قليلًا، فتُسحب الذراعان عبر ألياف الصدر في نسخة من قوس التقاطع بنكهة الدفع؛ وخط الكيبل يبقي تلك الألياف محملة عند الامتداد الكامل للذراع، وهو بالضبط حيث يموت إسهام الدمبل. وخطوة قدم للأمام تحول الجسد إلى إطار دفع ثابت؛ والبطن والألوية تحفظانه هناك لكل تكرار.",
        mistakes: [
          { error: "رفع البكرات عاليًا والدفع نزولًا في انتحال مائل للأسفل.", fix: "بكرات منتصف الارتفاع تضع خط الدفع عبر الصدر كما يضبطه الإعداد؛ والكيبلات العالية تقلب الحركة نحو تقاطع هابط لم توقّع عليه الكتفان." },
          { error: "ترك المقبضين يججران الذراعين إلى مدّ ثقيل على الكتف في نهاية العودة.", fix: "أوقف النزول قبل أن يتوقف الصدر عن السيطرة على المدّ — فالشد الدائم الذي يبيع هذه الحركة هو أيضًا أسرع طريق لإفراطه." },
          { error: "تمايل الجذع مع كل دفعة كمؤامرة ضغط قائمة.", fix: "وقفة متدرجة بجذع مشدود؛ المقبضان يتحركان والأضلاع تبقى — الرقص الجسدي هنا يسرق الحمل من الصدر ويمنحه للزخم." },
          { error: "الدفع بذراعين شبه مستقيمتين ومرفقين مقفولين من البداية.", fix: "ينثني المرفقان عند المدّ ويمتدان عبر الدفعة — هذه كبسة وميكانيكاها ميكانيكا البار لا قواعد القوس المقفول للتفتيح." },
        ],
        alternatives: "رف الدفع واقفًا له عدة مخارج في هذه المكتبة. صفحة تفتيح الكيبل على البنش المستوي تدير نفس الشد الدائم مستلقية، والتقاطع بالكيبل يبقى على القوس لخالص التقريب، وصفحتا البار والدمبل تحملان أثقل الأحمال بمساعدة الجاذبية، وعائلة الضغط تجيب حين لا صالة في المتناول. ومقعد دفع الكيبل هو الشد بلا نقاط راحة والدفع بلا بنش — مفيد لأكتاف منهكة وبنشات مزدحمة سواء.",
        progression: "رَكن الأوزان يجعل الترقية حسابًا: أضف وزنًا حين يصل أعلى نطاق التكرارات والأداء سليم، ودع العدد يستقر نزولًا من جديد. وبين قفزات المسمار أبطئ النزول وأطل العصرة عند خاتمة اليدين المتلاصقتين. وتدير الكتلة المتقدمة دفعات بذراع واحدة لصيد عمل الجذع المضاد للدوران أو تنزل الوزن لعناقيد ختامية بعد انتهاء دفع البار لليوم.",
        programming: "ثلاث إلى أربع مجموعات من ثمانية إلى خمسة عشر تكرارًا، توضع بعد الدفع الرئيسي أو كفصل ثانٍ ثابت الشد في يوم الصدر. تقترن طبيعيًا بدفع البار في الجلسة نفسها — البار يحمل القاع والكيبل يحمل القمة ويستلم الصدر الرسالتين معًا. وفي التنشيف تُبقي الحركة الصدر يعمل بينما ترتاح المفاصل من الحديد الثقيل؛ وفي مرحلة الكتلة تختم العضلة بضخ مستمر لا يستطيع البنش ولا الدمبل تقديمه — فلكل أداة موطن تتقدم فيه على أخرياتها.",
        safety: "الإطار الواقف هو قصة الأمان: قدمان متدرجتان وجذع مشدود وأضلاع مسحوبة — وبدونه ستدير الكيبلات التكرار راضيةً والعمود مفصلًا. والكتفان تنالان عناية الدفع المعتادة: مرفقان يتعقبان خط الصدر، ولا انهيار عند المدّ، ومسمار يحترم أمانة اليوم. وتطلب آلات الكيبل نفسها شيئًا واحدًا صريحًا — افحص مشبك المقبض قبل أول مجموعة في كل مرة؛ فالمقبض الطائر أهون إصابات الصالة في أبهج صورها.",
      },
    },
    faq: {
      en: [
        { q: "Standing cable press versus bench press — replacement or accessory?", a: "An excellent accessory, a poor replacement. The bench loads heavier through the bottom half; the cable keeps tension through the top half. Run the barbell for strength and this for tension and the chest collects both ends of the deal." },
        { q: "Why do my shoulders take over?", a: "Usually the pulleys are too high and the press has drifted downward, or the elbows are flaring. Set mid-height, tuck the elbows to the chest's line, and think 'hands meet in front of the sternum' — the shoulders cannot lead a press they are not steering." },
        { q: "One arm at a time or both together?", a: "Together is the standard and the beginner's friend — the two cables balance each other. One arm at a time is the advanced version: the trunk fights rotation while the chest presses, doubling the movement's core bill." },
      ],
      ar: [
        { q: "دفع الكيبل واقفًا مقابل بنش برس — بديل أم إضافة؟", a: "إضافة ممتازة وبديل رديء. البنش يحمل أثقل عبر النصف السفلي؛ والكيبل يحفظ الشد عبر النصف العلوي. شغّل البار للقوة وهذا للشدد ويحصد الصدر طرفي الصفقة." },
        { q: "لماذا تستحوذ كتفي على الحركة؟", a: "غالبًا البكرات مرتفعة أكثر من اللازم وانجرف الدفع نزولًا، أو المرفقان منفتحان. اضبط منتصف الارتفاع واضمم المرفقين إلى خط الصدر وفكر «تلتقي اليدان أمام عظمة القص» — لا تستطيع الكتفان قيادة دفعة لا تقودانها." },
        { q: "ذراع واحدة أم الاثنتان معًا؟", a: "معًا هي المعيار وصديق المبتدئ — يوازن الكيبلان أحدهما الآخر. وواحدة تلو الأخرى نسخة المتقدمين: يقاتل الجذع الدوران بينما يضغط الصدر، فتتضاعف فاتورة الجذع للحركة." },
      ],
    },
    links: [
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Push-pull-legs program", labelAr: "برنامج دفع وسحب وأرجل" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "Training frequency fixes", labelAr: "إصلاحات تكرار التدريب" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track pressing sessions", labelAr: "تتبع جلسات الدفع" },
    ],
  },
};
