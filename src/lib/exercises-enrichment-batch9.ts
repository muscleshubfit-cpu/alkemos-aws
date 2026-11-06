/**
 * EXERCISES-ENRICHMENT — BATCH 9 (exercises 42-46 of 50).
 *
 * Closes the biceps family (alternate hammer curl, preacher curl) and
 * opens the triceps family's loaded half: triceps pushdown, the decline
 * close-grip bench to skull crusher, and the triceps version of dips.
 * The "best dumbbell exercises for triceps" keyword (100-1K/mo, master
 * plan §5.1 Tier 3) lands on this family's pages.
 */

import type { ExerciseEnrichment } from "@/lib/exercises-enrichment";

export const BATCH_9: Record<string, ExerciseEnrichment> = {
  "alternate-hammer-curl": {
    intro: {
      en: "The hammer curl is the biceps exercise that trains what the mirror forgets: with the palms facing the torso the whole way — the instructions' neutral grip — the load shifts from the biceps' showy front to the brachialis and brachioradialis, the two muscles that push the arm's thickness up from underneath and run down the forearm's line. The alternating pattern the page teaches gives each arm a work-rest rhythm inside one set. It is the curl that makes arms look bigger from the side, which is the angle most of life actually sees them from, and every arm block on this site books it beside its supinated brothers.",
      ar: "كيرل المطرقة هو تمرين ذات الرأسين الذي يدرّب ما ينساه المرآة: فبراحتين مواجهتين للجذع طوال الطريق — القبضة المحايدة في التعليمات — ينتقل الحمل من واجهة ذات الرأسين الاستعراضية إلى العضدية والعضدية الكعبرية، العضلتين اللتين تدفعان سماكة الذراع من تحتها وتجريان أسفل خط الساعد. ونمط التبديل الذي تعلمه الصفحة يمنح كل ذراع إيقاع عمل-راحة داخل مجموعة واحدة. إنه الكيرل الذي يجعل الأذرع تبدو أكبر من الجانب، وهو الزاوية التي تراها الحياة منها فعلًا، وكل كتلة أذرع في هذا الموقع تحجزه بجوار أخوته المستديرين.",
    },
    sections: {
      en: {
        muscles: "The brachialis is the movement's quiet hero — the library bills the biceps primary with the forearms second, and the neutral grip hands the deepest elbow flexor its biggest job: unlike the biceps, the brachialis only flexes, so the hammer position loads it without competition. The brachioradialis, the forearm's long muscle, carries the grip-side of the arc — the library's forearm billing is not decoration here. The biceps still works, just as the second fiddle it rarely plays, and the alternating pattern keeps each side's rest honest.",
        mistakes: [
          { error: "Rotating the palms up mid-arc into a regular curl.", fix: "The hammer's law is the neutral grip from bottom to top — thumbs up, like holding hammers; the rotation belongs to the dumbbell curl's page, not this one." },
          { error: "Elbows drifting forward as the bells rise.", fix: "Elbows pinned to the ribs — the instructions say it; forward-drifting elbows convert the curl into a front raise and the forearm muscle clock out early." },
          { error: "Swinging the torso to launch each bell.", fix: "Brace and curl — the tips on this page repeat the family's anti-swing law; alternating reps make cheating easier, which is why the brace matters more here, not less." },
          { error: "Rushing the alternation into a juggling act.", fix: "One full rep per arm at a time — up in a second, squeeze, down in two — the instructions' alternating fashion is a rhythm, not a race." },
        ],
        alternatives: "The rope hammer curl on a cable keeps the neutral grip under constant tension; the cross-body hammer curl adds a slight across-torso line. The barbell and dumbbell curls — both pages sit in this library — carry the supinated half of the family; the reverse curl takes the forearm emphasis further still. For arm thickness, the hammer curl pairs with the preacher curl's strict stretch — the two together cover what straight curling alone leaves on the table.",
        progression: "The hammer curl runs stronger than the supinated version — the brachialis is a workhorse — so expect slightly heavier bells than your regular curl from the start. Climb in one-kilo jumps while the elbows stay pinned, and rotate the tempo dials: a three-second lower, a one-second squeeze at the top, then the simultaneous version (both bells at once) when the alternating rhythm stops challenging. The family's ceiling is grip and patience, and the dumbbell rack usually runs out of both before the brachialis does.",
        programming: "Book it beside the barbell or dumbbell curl in an arm session: 3 sets of 8-12 reps per arm with 45-60 seconds of rest, twice a week. The pairing logic is standard across our programs — one supinated curl for the biceps' front, one neutral curl for the thickness underneath — the two grips covering the arm's whole cross-section in one block. It suits the pull-day accessory slot equally well when arms ride along after back work.",
        safety: "The elbows own the same laws as every curl — no dead lockouts, stop just short, tendons stay quiet — and the neutral grip is actually the elbow-friendliest of the family's three positions, which is why it appears in rehab protocols more than its brothers. The wrist stays neutral by design here; the movement's one honest caution is the alternating pattern's swing temptation, and the braced torso is its whole prevention. Warm the grip up with the first light set; cold forearms complain early.",
      },
      ar: {
        muscles: "العضدية هي بطلة الحركة الصامتة — تسجل المكتبة ذات الرأسين أساسية والساعدين ثانيًا، والقبضة المحايدة تسلم أعمق مثنية للمرفق أكبر وظائفها: فبخلاف ذات الرأسين، العضدية تثني فقط، فيحملها وضع المطرقة بلا منافسة. والعضدية الكعبرية، العضلة الطويلة للساعد، تحمل جانب القبضة من القوس — ففاتورة الساعد للمكتبة ليست هنا زينة. وذات الرأسين ما تزال تعمل، كالكمان الثاني الذي نادرًا ما تعزفه، ونمط التبديل يحمي راحة كل جهة أمينة.",
        mistakes: [
          { error: "تدوير الراحتين للأعلى منتصف القوس إلى كيرل عادي.", fix: "قانون المطرقة هو القبضة المحايدة من القاع إلى القمة — الإبهامان للأعلى كحمل مطرقتين؛ فالدوران يخص صفحة كيرل الدمبل لا هذه." },
          { error: "انجراف المرفقين أمامًا مع صعود الجرسين.", fix: "المرفقان مثبتان على الأضلاع — تقوله التعليمات؛ فالمرفقان السائران يحولان الكيرل إلى رفعة أمامية وتخرج عضلة الساعد مبكرًا." },
          { error: "تأرجح الجذع لإطلاق كل جرس.", fix: "اشدد وارفع — تكرر نصائح هذه الصفحة قانون العائلة ضد التأرجح؛ والتكرارات المتناوبة تجعل الغش أسهل، ولهذا يهم الشد هنا أكثر لا أقل." },
          { error: "استعجال التبديل حتى يصير بهلوانية.", fix: "تكرار كامل واحد لكل ذراع في المرة — صعود في ثانية وعصر ونزول في ثانيتين — فـ«التبادل» في التعليمات إيقاع لا سباق." },
        ],
        alternatives: "كيرل المطرقة بالحبل على كابل يحفظ القبضة المحايدة تحت شد دائم، وكيرل المطرقة العرضي يضيف خطًا عابرًا للجذع. وكيرلا البار والدمبل — الصفحتان في مكتبتنا — يحملان النصف المستدير للعائلة، والكيرل المعكوس يأخذ تركيز الساعد أبعد. وللسماكة، يقترن كيرل المطرقة بتمدد الواعظ الصارم — والاثنان معًا يغطيان ما تتركه اللفات المستقيمة وحدها على الطاولة.",
        progression: "يجري كيرل المطرقة أقوى من النسخة المستديرة — فالعضدية حصان عمل — فتوقع جرسين أثقل قليلًا من كيرلك العادي من البداية. اصعد بقفزات كيلوجرام مع بقاء المرفقين مثبتين، ودوّر أقراص الإيقاع: نزول ثلاث ثوان، وعصرة ثانية في القمة، ثم النسخة المتزامنة — الجرسان معًا — حين يتوقف إيقاع التبديل عن التحدي. وسقف العائلة هو القبضة والصبر، وعادة تنفد الرفافة من كليهما قبل أن تنفد العضدية.",
        programming: "احجزه بجوار الكيرل بالبار أو الدمبل في جلسة أذرع: ثلاث مجموعات من 8-12 تكرارًا لكل ذراع براحة 45-60 ثانية، مرتين أسبوعيًا. ومنطق الاقتران معياري عبر برامجنا — كيرل مستدير لواجهة ذات الرأسين، وكيرل محايد للسماكة تحتها — فتغطي القبضتان مقطع الذراع كاملًا في كتلة واحدة. ويناسب خانة المساعد ليوم السحب بالقدر نفسه حين تركب الأذرع بعد عمل الظهر.",
        safety: "المرفقان يحملان قوانين كل كيرل — لا قفل ميت الاستقامة، توقف قبله — والقبضة المحايدة في الحقيقة ألطف القبضات الثلاث على المرفق، ولهذا تظهر في بروتوكولات التأهيل أكثر من أخواتها. والرسغ يبقى محايدًا بالتصميم هنا؛ والتحذير الأمين الوحيد هو إغراء تأرجح التبديل، والجذع المشدود وقايته كلها. إحمِ القبضة بالمجموعة الخفيفة الأولى؛ فالأسبئة الباردة تشتكي مبكرًا.",
      },
    },
    faq: {
      en: [
        { q: "Hammer curls vs regular curls — what's the difference in results?", a: "Width vs front: the supinated regular curl loads the biceps' two heads for the peak the front view shows; the hammer's neutral grip loads the brachialis and forearm for the thickness the side view shows. They are complementary, not competing — which is why arm blocks on this site book both, usually in the same session." },
        { q: "Can hammer curls fix skinny forearms?", a: "Partly, and honestly: the brachioradialis is a real forearm muscle and the hammer curl loads it directly, so forearms grow — but the forearm's full development also wants grip work and the reverse curl's line. The hammer curl is the forearm's best-dressed contributor, not its whole wardrobe." },
        { q: "Why do hammer curls feel easier than regular curls?", a: "Because the leverage is better: the neutral grip lets the brachialis — a pure, strong flexor — take the lead, and the brachioradialis adds a strong assist. Heavier bells with the same strictness is the normal result, not a form failure; log them as their own lift and let the numbers climb on their own page." },
      ],
      ar: [
        { q: "كيرل المطرقة أم العادي — ما الفرق في النتائج؟", a: "عرض أمام واجهة: فالكيرل المستدير يحمل رأسي ذات الرأسين للقمة التي يظهرها المنظر الأمامي؛ والمطرقة بمقبضها المحايد تحمل العضدية والساعد للسماكة التي يظهرها الجانب. وهما مكمّلان لا متنافسان — ولهذا تحجز كتل الأذرع في هذا الموقع كليهما، غالبًا في الجلسة نفسها." },
        { q: "هل تصلح مطارق الكيرل ساعدًا نحيفًا؟", a: "جزئيًا وبصدق: فالعضدية الكعبرية عضلة ساعد حقيقية وكيرل المطرقة يحملها مباشرة فتنمو الأسبئة — لكن التطور الكامل للساعد يريد عمل قبضة وخط الكيرل المعكوس أيضًا. فكيرل المطرقة أناقة مساهمة الساعد لا خزانته كلها." },
        { q: "لماذا تبدو مطارق الكيرل أسهل من العادية؟", a: "لأن الرافعة أفضل: فالقبضة المحايدة تدع العضدية — مثنية خالصة قوية — تقود، والعضدية الكعبرية تضيف مساعدة قوية. فالجرسان الأثقل بنفس الصرامة نتيجة طبيعية لا فشل وضعية؛ سجّلها رفعة مستقلة ودع الأرقام تتسلق على صفحتها." },
      ],
    },
    links: [
      { hrefEn: "/exercises/dumbbell-bicep-curl", hrefAr: "/ar/exercises/dumbbell-bicep-curl", labelEn: "Dumbbell curl — the supinated half", labelAr: "كيرل الدمبل — النصف المستدير" },
      { hrefEn: "/exercises/barbell-curl", hrefAr: "/ar/exercises/barbell-curl", labelEn: "Barbell curl — the family's flag", labelAr: "الكيرل بالبار — علم العائلة" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track every rep — free tracker", labelAr: "سجل كل تكرار — المتتبع المجاني" },
    ],
  },

  "preacher-curl": {
    intro: {
      en: "The preacher curl is the bench that tells the truth: chest against the pad, upper arms planted on the incline, and nowhere for a swing, a lean or a hip to hide. The instructions stage the EZ-bar's classic setup — inner handles, palms forward and slightly tilted — and the arc that follows curls from full stretch at the bottom to a hard squeeze at shoulder height. The library bills the biceps alone, no secondaries, because the bench has already fired the assisting cast: this is the most isolated curl in the family, the one where the muscle meets its load without any negotiation. Its reputation rides the bench itself: the strictest seat in the arm room, and the one every honest biceps block visits.",
      ar: "كيرل الواعظ هو البنش الذي يقول الحقيقة: صدر على الوسادة وأعلى الذراعين مزروع على الميل، ولا مكان لتأرجح أو ميل أو ورك ليختبئ. تجهز التعليمات إعداد البار المتعرج الكلاسيكي — المقابض الداخلية والراحتان أمامًا بميل خفيف — والقوس الذي يليه يلف من تمدد كامل في القاع إلى عصرة شديدة عند ارتفاع الكتف. تسجل المكتبة ذات الرأسين وحدها بلا مساعدين، لأن البنش صرف بالفعل طاقم المساعدة: فهذا أشد كيرلات العائلة عزلًا، الذي تلتقي فيه العضلة بحملها بلا أي تفاوض. وسمعتها تركب البنش نفسه: أصرم مقعد في غرفة الأذرع، والذي تزوره كل كتلة بنسبة صادقة.",
    },
    sections: {
      en: {
        muscles: "The biceps works alone and from the longest position the family offers: the pad's incline holds the upper arm at an angle that stretches the biceps at the shoulder before the curl even begins — the library's solo billing is anatomical honesty. The brachialis assists underneath as always, and the forearms run the grip, but the bench's geometry strips every other helper out of the movement. That stretch-loaded start is the exercise's whole signature, and it is also why the bottom third of the rep demands respect: the biceps is strongest at the top of most curls and most vulnerable at the bottom of this one.",
        mistakes: [
          { error: "Lifting the elbows off the pad to finish the top.", fix: "The upper arms stay glued to the incline — the instructions pin them there; elbows that float hand the rep to the shoulders and the bench's truth-telling job is over." },
          { error: "Dropping the bar into the bottom stretch at speed.", fix: "The instructions' slow lower is law — the fully stretched biceps under a falling bar is the family's classic injury story, and control is its only prevention." },
          { error: "Heaving the chest off the pad for a last rep.", fix: "The chest stays planted; the moment it lifts, the set has ended — the bench exists precisely to make that verdict visible." },
          { error: "Stopping the arc halfway down to avoid the stretched bottom.", fix: "The bottom is half the exercise — the instructions extend the arm until the biceps is fully stretched; skipping it builds the peak and starves the length, and injured-short curls are built exactly that way." },
        ],
        alternatives: "The spider curl — chest against the pad's other side — takes the stretch even further; the machine preacher curl fixes the path and spares the setup. The dumbbell preacher curl works one arm at a time with the bench's same honesty. Free-standing curls — the barbell and dumbbell pages in this library — trade the strictness for load and freedom; the preacher bench keeps its place as the family's courtroom, where every rep testifies.",
        progression: "The EZ-bar starts light — the stretched position runs 20-30 percent behind a standing curl's load, and that is the bench being honest, not weak. Climb in small jumps while the bottom stays controlled, and progress the tempo first: a three-second lower through the stretch, a one-second pause at the very bottom, a hard squeeze at the top. Advanced lifters run the drop-set tradition here — the bench's strictness makes the strip-and-continue format honest — and our arm templates carry that option.",
        programming: "Book it as the strict centerpiece of an arm session's biceps half: 3 sets of 8-12 slow reps with 60-90 seconds of rest, once or twice a week. It earns the middle slot — after the heavier standing curls, before the burnout work — because it delivers the stretch stimulus the standing versions cannot, and tired-but-honest is exactly how it should arrive. On arm-specialization blocks it can lead the session when the elbow joints want light loads and high standards.",
        safety: "The bottom position is the safety story: the fully stretched biceps under load is the arm family's most injury-prone sight, and the slow-lower law is the entire insurance policy — never bounce out of the stretch, never let gravity set the tempo. The elbows' crease against the pad takes some getting used to; a sleeve or a towel softens the contact while the skin adapts. And the bench's setup demands the seat height right: shoulders over the pad's top edge, as the instructions stage, so the joint — not the machine — decides the arc.",
      },
      ar: {
        muscles: "تعمل ذات الرأسين وحدها ومن أطول وضع تقدمه العائلة: فميل الوسادة يحمل أعلى الذراع بزاوية تمدّ ذات الرأسين عند الكتف قبل أن يبدأ الكيرل أصلًا — ووسم المكتبة المنفرد صدق تشريحي. والعضدية تساعد من الأسفل كعادتها، والساعدان يديران القبضة، لكن هندسة البنش تجرّد الحركة من كل مساعد آخر. تلك البداية الممدودة المحملة هي بصمة التمرين كلها، وهي أيضًا سبب مطالبة الثلث السفلي من التكرار بالاحترام: فذات الرأسين أقوى ما تكون في قمة أغلب الكيرلات وأكثرها هشاشة في قاع هذا.",
        mistakes: [
          { error: "رفع المرفقين عن الوسيدة لإتمام القمة.", fix: "يبقى أعلى الذراعين ملصقًا بالميل — تدسّهما التعليمات هناك؛ فالمرفقان الطائران يسلمان التكرار للأكتاف وتنتهي وظيفة البنش في قول الحقيقة." },
          { error: "إسقاط البار نحو تمدد القاع بسرعة.", fix: "الإنزال البطيء في التعليمات قانون — فذات الرأسين الممدودة تمامًا تحت بار ساقط هي قصة إصابة العائلة الكلاسيكية، والسيطرة وقايتها الوحيدة." },
          { error: "انتزاع الصدر عن الوسيدة لآخر تكرار.", fix: "يبقى الصدر مزروعًا؛ وما إن يرتفع حتى تكون المجموعة انتهت — فالبنش موجود بالضبط ليجعل ذلك الحكم مرئيًا." },
          { error: "إيقاف القوس منتصف النزول هربًا من القاع الممدود.", fix: "القاع نصف التمرين — تمدّ التعليمات الذراع حتى تتمدد ذات الرأسين كاملة؛ وتخطيه يبني القمة و يجوّع الطول، وهكذا تُبنى بالضبط الكيرلات المبتورة المُصابة." },
        ],
        alternatives: "كيرل العنكبوت — صدر على الجهة الأخرى من الوسادة — يأخذ التمدد أبعد، وماكينة كيرل الواعظ تثبت المسار وتوفر الإعداد. وكيرل الواعظ بالدمبل يعمل ذراعًا واحدة بنفس أمانة البنش. والكيرلات الحرة — صفحتا البار والدمبل في مكتبتنا — تقايضان الصرامة بالحمل والحرية؛ ويحتفظ بنش الواعظ بمكانه محكمة العائلة، حيث يشهد كل تكرار.",
        progression: "يبدأ البار المتعرج خفيفًا — فالوضع الممدود يجري متأخرًا بنسبة 20-30 بالمئة عن حمل الكيرل الواقف، وهذا هو البنش أمين لا ضعيف. اصعد بقفزات صغيرة مع بقاء القاع متحكمًا فيه، وقدّم الإيقاع أولًا: نزول ثلاث ثوان عبر التمدد، وتوقف ثانية عند القاع ذاته، وعصرة شديدة في القمة. ويشغّل المتقدمون تقليد المجموعة التنازلية هنا — صرامة البنش تجعل صيغة انزع-وواصل أمينة — وقوالب الأذرع لدينا تحمل ذلك الخيار.",
        programming: "احجزه قلبًا صارمًا لنصف ذات الرأسين في جلسة أذرع: ثلاث مجموعات من 8-12 تكرارًا بطيئًا براحة 60-90 ثانية، مرة أو مرتين أسبوعيًا. ويكسب الخانة الوسطى — بعد الكيرلات الواقفة الأثقل وقبل عمل الإحراق — لأنه يسدد تحفيز التمدد الذي لا تقدمه النسخ الواقفة، ومتعبًا-لكن-أمينًا هو بالضبط كيف ينبغي أن يصل. وفي كتل تخصص الأذرع يستطيع قيادة الجلسة حين تريد مفاصل المرفق أحمالًا خفيفة ومعايير عالية.",
        safety: "وضع القاع هو قصة السلامة: فذات الرأسين الممدودة كليًا تحت الحمل أكثر مشاهد العائلة عرضة للإصابة، وقانون الإنزال البطيء هو بوليصة التأمين كلها — لا ترتد أبدًا من التمدد، ولا تدع الجاذبية تضع الإيقاع أبدًا. وطيّة المرفق على الوسيدة تحتاج تألفًا؛ وكمّ أو منشفة يلطفان التلامس حتى تألف البشرة. وإعداد البنش يطلب ارتفاع المقعد صحيحًا: الكتفان فوق الحافة العلوية للوسادة كما تجهز التعليمات، كي يقرر المفصل — لا الماكينة — القوس.",
      },
    },
    faq: {
      en: [
        { q: "Why is my preacher curl so much lighter than my standing curl?", a: "Because the bench removed every assistant: standing curls borrow swing, lean and shoulder; the preacher pad strips them all and adds the shoulder-stretched start, where the biceps is longest and weakest. A preacher load 20-30 percent under your standing number is the ordinary honest spread — log them as two different lifts." },
        { q: "Preacher curls or incline dumbbell curls for the stretch?", a: "Both train the long-stretched position the standing curls skip, from opposite ends: the preacher bench stretches the biceps behind the body with the elbow planted; the incline bench stretches it with the arm hanging behind. Most arm blocks run one or the other per mesocycle — the choice is equipment and elbow comfort, not results doctrine." },
        { q: "Should I fully straighten my arms at the bottom?", a: "To the full stretch the instructions describe — yes, with the tempo law attached: the controlled lower is what makes the bottom safe and productive. If the elbows complain at full extension, stop a breath short and let the range grow as the tendons adapt; the honest arc is earned in weeks, not forced in one set." },
      ],
      ar: [
        { q: "لماذا كيرل الواعظ أخف كثيرًا من كيرلي الواقف؟", a: "لأن البنش صرف كل مساعد: فالكيرلات الواقفة تستعير تأرجحًا وميلًا وكتفًا؛ ووسيدة الواعظ تجردهم جميعًا وتضيف بداية الكتف الممدود حيث ذات الرأسين أطول وأضعف. وحمل واعظ أقل بنسبة 20-30 بالمئة من رقمك الواقف فارق أمين عادي — سجّلهما رفعتين مختلفتين." },
        { q: "كيرل الواعظ أم كيرل الدمبل المائل للتمدد؟", a: "كلاهما يدرّب الوضع الممدود الطويل الذي تتخطاه الكيرلات الواقفة، من طرفين متقابلين: بنش الواعظ يمدّ ذات الرأسين خلف الجسم والمرفق مزروع؛ والبنش المائل يمدها والذراع متدلية خلفه. تشغل أغلب كتل الأذرع أحدهما أو الآخر في كل دورة — والاختيار معدات وراحة مرفق لا عقيدة نتائج." },
        { q: "هل أستقيم بذراعيّ تمامًا في القاع؟", a: "إلى التمدد الكامل الذي تصفه التعليمات — نعم، مع قانون الإيقاع مرفقًا: فالإنزال المتحكم هو ما يجعل القاع آمنًا ومنتجًا. وإذا اشتكى المرفقان عند الامتداد الكامل فتوقف قبيله بأنفاس ودع المدى ينمو مع تأقلم الأوتار؛ فالقوس الأمين يُكسب في أسابيع لا يُفرض في مجموعة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/barbell-curl", hrefAr: "/ar/exercises/barbell-curl", labelEn: "Barbell curl — the standing half", labelAr: "الكيرل بالبار — نصف الوقوف" },
      { hrefEn: "/exercises/alternate-hammer-curl", hrefAr: "/ar/exercises/alternate-hammer-curl", labelEn: "Hammer curl — the thickness half", labelAr: "كيرل المطرقة — نصف السماكة" },
      { hrefEn: "/blog/train-muscle-group-frequency-fixes", hrefAr: "/ar/blog/muscle-group-frequency-optimal", labelEn: "Arm training frequency", labelAr: "تكرار تدريب الأذرع أسبوعيًا" },
    ],
  },

  "triceps-pushdown": {
    intro: {
      en: "The triceps pushdown is the triceps' home station: a bar on a high pulley, elbows pinned to the ribs, and the forearms driving the bar down to full extension — the instructions' whole arc, with the squeeze at the bottom the tips demand. The library bills the triceps alone, and the movement earns the solo billing: with the upper arms locked at the sides, extension of the elbow belongs to the three-headed muscle and nothing else. It is the exercise every push day ends on: light enough to load safely, honest enough to matter, and stackable in a way no free-weight triceps movement matches.",
      ar: "دفع الترايسبس للأسفل هو محطة الترايسبس الرئيسية: بار على بكرة عالية والمرفقان مثبتان على الأضلاع والساعدان يقودان البار نزولًا إلى الامتداد الكامل — قوس التعليمات كله، مع العصرة في القاع التي تطلبها النصائح. تسجل المكتبة الترايسبس وحدها، والحركة تستحق الفاتورة المنفردة: فمع تثبيت أعلى الذراعين على الجانبين يعود مدّ المرفق للعضلة ثلاثية الرؤوس ولا شيء غيرها. إنه التمرين الذي تنتهي عليه كل أيام الدفع: أخف من أن يُحمل بأمان، وأمين بما يكفي ليهمنا، وقابل للتركيب بطريقة لا تجاريها أي حركة ترايسبس حرة.",
    },
    sections: {
      en: {
        muscles: "All three triceps heads extend the elbow here — the library's solo billing covers the whole muscle — and the setup decides the shares: with the elbows pinned and the arms at the sides, the lateral and medial heads carry the mid-range and lockout, while the long head (the one that crosses the shoulder) works hardest when the arm drifts slightly in front or the cable's line pulls from above. The rope attachment — this library's rope-attachment page — invites the long head more by letting the hands rotate outward at the bottom. The abs and lats quietly hold the torso still; the triceps does the visible work.",
        mistakes: [
          { error: "Elbows flaring forward and back with each rep.", fix: "The instructions pin the upper arms — elbows stay glued to the ribs while only the forearms travel; a pumping elbow converts the pushdown into a half-dip with a cable's costume." },
          { error: "Leaning the whole body onto the bar to move weight.", fix: "A slight forward lean is fine, the instructions allow it — the torso leaning and unbending to press is a push-press in disguise; when the trunk moves to finish the rep, the pin is lying about the load." },
          { error: "Short stroking the last inches before full extension.", fix: "The bar travels until the arms are straight — the instructions say thighs, and they mean it; the lockout is where the triceps' strongest squeeze lives, and skipping it trims the exercise's best third." },
          { error: "Letting the stack crash the forearms back up between reps.", fix: "Two seconds up, still squeezed — the return is half the rep; a crashing stack deletes the tension the exercise exists to keep." },
        ],
        alternatives: "The rope attachment — its own page here — rotates the hands at the lockout for a deeper squeeze; the V-bar and reverse-grip versions shift the heads' shares. Overhead extensions load the long head at its longest; skull crushers and close-grip presses load the whole muscle with more weight; dips and bench dips carry the pattern at bodyweight. The pushdown remains the family's volume engine: the safest place to pile triceps reps when the elbows have already worked.",
        progression: "Start with a pin allowing three strict sets of twelve — the elbows pinned, the bar to the thighs — and climb one plate when the last set's last rep still locks out clean. The honest progressions before the plates: a two-second squeeze at the bottom, a pause with the bar an inch from the thighs, single-arm pushdowns — the library's one-arm page — to expose side differences. Advanced trainees finish with drop sets; the stack's pin makes the format frictionless.",
        programming: "Book it at the end of a push day or as the second triceps exercise of an arm session: 3-4 sets of 10-15 reps with 45-60 seconds of rest, twice a week. It earns the closing slot because it loads the triceps without asking the elbows' heaviest positions — after pressing, the muscle is warm and the joint is spent, and the pushdown spends the first and spares the second. Our push-day templates close with it exactly this way.",
        safety: "The elbow is the joint on duty, and its law is position: pinned elbows with a controlled return keep the tendon under smooth, honest load; flaring elbows and crashing stacks are the two mechanisms that irritate it. The wrists prefer a neutral line — the straight bar's fixed grip bothers some, and the rope or V-bar note above is the standard fix. Warm the elbows with a light first set before any working pin; cold pushdowns at heavy pins are the classic lateral-head tendinitis opener.",
      },
      ar: {
        muscles: "تمدّ رؤوس الترايسبس الثلاثة المرفق هنا — فاتورة المكتبة المنفردة تغطي العضلة كاملة — والإعداد يقرر الحصص: فمع تثبيت المرفقين والذراعين على الجانبين، يحمل الرأسان الجانبي والإنسي منتصف المدى والقفل، بينما يعمل الرأس الطويل — الذي يعبر الكتف — أشد حين تنجرف الذراع قليلًا أمامًا أو يسحب خط الكابل من فوق. والمقبض الحبلي — صفحة المقبض الحبلي في مكتبتنا — يستدعي الرأس الطويل أكثر بإعطائه اليدين دورة خارجية في القاع. والبطن والجنبية يثبتان الجذع بهدوء؛ والترايسبس يؤدي العمل المرئي.",
        mistakes: [
          { error: "تفتيح المرفقين أمامًا وخلفًا مع كل تكرار.", fix: "تثبّت التعليمات أعلى الذراعين — يبقى المرفقان ملصقين بالأضلاع بينما يسافر الساعدان فقط؛ فالمرفق المضخخ يحول الدفعة إلى ديبس نصف بكابل بزيّ تنكر." },
          { error: "إلقاء الجسم كله على البار لتحريك الوزن.", fix: "ميل أمامي خفيف سليم وتسمح به التعليمات — أما الجذع الذي يميل ويستقيم ليضغط فهو دفعة-برس متنكرة؛ وحين يتحرك الجذع لإتمام التكرار يكذب الوتد عن الحمل." },
          { error: "قصر الضربة قبل بوصات من الامتداد الكامل.", fix: "يسافر البار حتى تستقيم الذراعان — تقول التعليمات الفخذين وتعنيها؛ فالقفل حيث تسكن أقوى عصرة للترايسبس، وتخطيه يقصّ أفضل ثلث للتمرين." },
          { error: "ترك الرصة تحطم الساعدين صاعدين بين التكرارات.", fix: "ثانيتان صعودًا والعضلة ما تزال معصورة — فالعودة نصف التكرار؛ والرصة المتحطمة تحذف الشد الذي وُجد التمرين لحفظه." },
        ],
        alternatives: "المقبض الحبلي — صفحته الخاصة هنا — يدير اليدين عند القفل لعصرة أعمق، ومقبضا الڤي والقبضة المعكوسة ينقلان حصص الرؤوس. والمدات فوق الرأس تحمل الرأس الطويل عند أطوله، والسكول كراشر والبنش القريب القبضة يحملان العضلة كاملة بوزن أكبر، والديبس وديبس البنش يحملان النمط بوزن الجسم. وتبقى الدفعة محرك الحجم للعائلة: أأمن مكان لتكديس تكرارات الترايسبس بعد أن يكون المرفقان قد عملا.",
        progression: "ابدأ بوتد يسمح بثلاث مجموعات صارمة من اثني عشر — المرفقان مثبتان والبار إلى الفخذين — واصعد قرصًا حين تظل تكرارية المجموعة الأخيرة تقفل نظيفة. والتدرجات الأمينة قبل الأقراص: عصرة ثانيتين في القاع، وتوقف والبار على بوصة من الفخذين، ودفع بذراع واحدة — صفحة الذراع الواحدة في المكتبة — لكشف فروق الجهتين. ويختم المتقدمون بمجموعات تنازلية؛ ووتد الرصة يجعل الصيغة بلا احتكاك.",
        programming: "احجزه في نهاية يوم دفع أو كتمرين الترايسبس الثاني لجلسة أذرع: 3-4 مجموعات من 10-15 تكرارًا براحة 45-60 ثانية، مرتين أسبوعيًا. ويكسب خانة الختام لأنه يحمل الترايسبس دون طلب أثقل مواضع المرفقين — فبعد الدفع تكون العضلة دافئة والمفصل منهكًا، والدفعة تنفق الأولى وتوفر الثاني. وقوالب يوم الدفع لدينا تختم به هكذا بالضبط.",
        safety: "المرفق هو المفصل المناوب، وقانونه الموضع: فالمرفقان المثبتان مع عودة متحكمة يبقيان الوتر تحت حمل أملس أمين؛ والتفتيح والرصص المتحطمة هما الآليتان اللتان تهيجانه. ويفضل الرسغان خطًا محايدًا — وقبضة البار المستقيم الثابتة تزعج بعضهم، وملاحظة الحبل أو الڤي أعلاه هي الإصلاح القياسي. إحمِ المرفقين بمجموعة خفيفة أولى قبل أي وتد عمل؛ فالدفعات الباردة على أوتاد ثقيلة مقدمة التهاب الوتر الجانبي الكلاسيكية.",
      },
    },
    faq: {
      en: [
        { q: "Rope, straight bar, or V-bar on the pushdown?", a: "Different hands, different shares: the straight bar — this page's classic — loads the lateral head heaviest with a fixed grip; the rope lets the hands rotate apart at the lockout for a fuller squeeze; the V-bar sits between. All three extend the elbow identically; rotating attachments across a block trains the whole muscle evenly, and this library carries the rope's page for exactly that." },
        { q: "Why do my elbows ache after pushdowns?", a: "Usually one of the two laws broke: elbows flared off the ribs during the set, or the stack crashed the forearms home between reps — both load the tendon in jerks. Pin the elbows, slow the return to two seconds, drop the pin one plate for a week, and the ache typically leaves; if it stays past that, the overhead-extension family usually needs a season off too." },
        { q: "Can pushdowns alone build big triceps?", a: "They build two-thirds honestly: the lateral and medial heads thrive on the elbows-at-side line this station provides. The long head — the triceps' biggest slab — crosses the shoulder joint and loads best overhead, which is why our arm templates pair pushdowns with an overhead movement rather than letting either work alone." },
      ],
      ar: [
        { q: "حبل أم بار مستقيم أم ڤي في الدفعة؟", a: "أيدٍ مختلفة وحصص مختلفة: البار المستقيم — كلاسيكية هذه الصفحة — يحمل الرأس الجانبي أثقل بقبضة ثابتة؛ والحبل يتيح لليدين الانفراج عند القفل لعصرة أكمل؛ والڤي يجلس بينهما. الثلاثة تمدّ المرفق بالتطابق؛ وتدوير المقابض عبر الكتلة يدرّب العضلة كاملة بتساوٍ، وتحمل مكتبتنا صفحة الحبل لذلك بالضبط." },
        { q: "لماذا يؤلمني مرفقي بعد الدفعات؟", a: "عادةً انكسر أحد القانونين: تفتّح المرفقان عن الأضلاع خلال المجموعة، أو حطمت الرصة الساعدين للبيت بين التكرارات — وكلاهما يحمل الوتر بنطعات. ثبّت المرفقين، وأبطئ العودة إلى ثانيتين، وانزل وتدًا قرصًا لأسبوع، فيغادر الألم عادة؛ وإن بقي بعد ذلك فتحتاج عائلة المدات فوق الرأس إجازة موسم أيضًا." },
        { q: "هل تبني الدفعات وحدها ترايسبس كبيرًا؟", a: "تبني ثلثين بصدق: فالرأسان الجانبي والإنسي يزدهران على خط المرفقين-على-الجانب الذي تقدمه المحطة. أما الرأس الطويل — أكبر لوح في الترايسبس — فيعبر مفصل الكتف ويُحمل أفضل ما يكون فوق الرأس، ولهذا تقترن الدفعات في قوالب الأذرع لدينا بحركة علوية بدل ترك أيٍّ منهما يعمل وحده." },
      ],
    },
    links: [
      { hrefEn: "/exercises/tricep-dumbbell-kickback", hrefAr: "/ar/exercises/tricep-dumbbell-kickback", labelEn: "Triceps kickback — the shortened-position partner", labelAr: "كيك باك الترايسبس — شريك الوضع المختصر" },
      { hrefEn: "/exercises/bench-dips", hrefAr: "/ar/exercises/bench-dips", labelEn: "Bench dips — the bodyweight version", labelAr: "ديبس البنش — نسخة وزن الجسم" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Push day templates — PPL program", labelAr: "قوالب يوم الدفع — برنامج دفع-سحب-أرجل" },
    ],
  },

  "decline-close-grip-bench-to-skull-crusher": {
    intro: {
      en: "The decline close-grip bench to skull crusher is two triceps lifts sharing one set — the instructions run them fused: a close-grip press off the decline bench's bottom, then, arms still loaded overhead, a skull-crusher arc that brings the bar toward the forehead before the triceps press it home. It is the most technical movement in the triceps family and the only double movement of its kind, graded intermediate by the library for exactly that reason. The payback for the choreography is a full-spectrum hit: the press loads the muscle compressed, the crusher loads it stretched, and one bar visits both in under ten seconds.",
      ar: "البنش المائل للأسفل بقبضة ضيقة إلى سكول كراشر هو رفعتا ترايسبس تتقاسمان مجموعة واحدة — تشغلهما التعليمات مدمجتين: دفعة بقبضة ضيقة من قاع البنش المائل، ثم والذراعان ما تزالان محملتين فوق الرأس، قوس سكول كراشر يقرب البار نحو الجبهة قبل أن تعصره الترايسبس إلى بيته. إنها أكثر حركات عائلة الترايسبس تقنية والحركة المزدوجة الوحيدة من نوعها، مصنفة متوسطة من المكتبة لذلك السبب بالذات. وعائد التصميم ضربة كاملة الطيف: فالدفعة تحمل العضلة مضغوطة، والكراشر يحملها ممدودة، وبار واحد يزور الاثنتين في أقل من عشر ثوان.",
    },
    sections: {
      en: {
        muscles: "The triceps carries both halves — the library bills it primary with chest and shoulders as the press's seconds. In the close-grip press, all three heads extend the elbow out of the bottom while the chest helps from below and the elbows-in line keeps their share small; in the skull-crusher half, the upper arm holds still overhead and the triceps alone extends the forearm through the longest arc the family owns — the stretched position the long head lives for. The rotator cuff works the whole set in the background, which is why the instructions prescribe a spotter for the unrack.",
        mistakes: [
          { error: "Flaring the elbows outward during the press half.", fix: "The instructions keep the elbows in — the close grip's whole point; flared elbows hand the bottom of the press to the chest and shoulder, and the triceps loses its set's opening act." },
          { error: "Letting the upper arms drift back during the crusher half.", fix: "The skull-crusher law is a frozen upper arm — only the forearms move the bar's arc toward the forehead; drifting arms convert the crusher into a pullover and the triceps into a spectator." },
          { error: "Bouncing the bar off the forehead line at the bottom of the arc.", fix: "The touch is a hover, not a landing — the instructions' slight-touch description is the safety margin; a bouncing bar tests the skull's load rating, which is not the exercise." },
          { error: "Loading for the press and surviving the crusher.", fix: "The crusher is the weaker half — set the load by what the stretched arc controls, and let the press half feel light; a balanced bar makes both halves honest, an unbalanced one makes the set dangerous." },
        ],
        alternatives: "The pure skull crusher — flat or decline — takes the movement's second half alone; the close-grip bench press takes the first. EZ-bar skull crushers save the wrists with their angled grip; dumbbell versions work one arm at a time. The triceps pushdown — its page in this library — covers the compressed position with none of the overhead risk; the overhead rope extension loads the long head at length with a friendlier failure mode. This fused page remains the family's technical summit: the movement you earn after owning both halves separately.",
        progression: "Own the halves first: a season of close-grip presses and a season of skull crushers before fusing them, exactly as the intermediate grading implies. The fused set starts light — a load the crusher half controls through its full arc for eight reps — and climbs in the smallest plates while both halves keep their laws. The progressions are pauses: a one-second hold at the press's top, a one-second hover at the crusher's bottom, each buying tension the bar's weight alone cannot.",
        programming: "Program it as the technical centerpiece of a triceps block: 3 sets of 6-10 fused reps with 90-120 seconds of rest, once a week — the double movement's fatigue is honest but its skill demand is high, and once weekly keeps both fresh. It suits an arm-specialization day or the closing third of a push day when the elbows are warm. Our intermediate templates slot it exactly there, after the pressing, before the pump work.",
        safety: "The bar travels over the face and forehead — that is the movement's headline risk, and the instructions' spotter note is the insurance: a spotter on every working set, or a decline rack with pins set at chin height. The rotator cuff's awkward angle at the unrack is the second caution — the instructions flag it themselves — so the handoff matters as much as the rep. Elbows that ache during the crusher half mean the load is set by the press half's ego; drop to the crusher's honest weight and both joints stay in the conversation.",
      },
      ar: {
        muscles: "تحمل الترايسبس النصفين معًا — تسجلها المكتبة أساسية والصدر والأكتاف ثانيين للدفعة. ففي الدفعة الضيقة القبضة، تمدّ الرؤوس الثلاثة المرفق خارج القاع بينما يساعد الصدر من الأسفل وخط المرفقين-الداخل يبقي نصيبه صغيرًا؛ وفي نصف الكراشر، يحمل أعلى الذراع ساكنًا فوق الرأس وتمد الترايسبس وحدها الساعد عبر أطول قوس تملكه العائلة — الوضع الممدود الذي يعيشه الرأس الطويل من أجله. والكفة الدوارة تعمل طوال المجموعة في الخلفية، ولهذا توصي التعليمات بمساعد لإخراج البار.",
        mistakes: [
          { error: "تفتيح المرفقين للخارج خلال نصف الدفعة.", fix: "تحفظ التعليمات المرفقين داخلًا — وهذا مغزى القبضة الضيقة كله؛ فالمرفقان المتفتحان يسلمان قاع الدفعة للصدر والكتف، وتخسر الترايسبس الافتتاحية." },
          { error: "انجراف أعلى الذراعين للخلف خلال نصف الكراشر.", fix: "قانون السكول كراشر ذراع علوي مجمد — الساعدان فقط تحركان قوس البار نحو الجبهة؛ فالذراعان السادرتان تحولان الكراشر إلى بول أوفر والترايسبس إلى متفرجة." },
          { error: "ارتداد البار عن خط الجبهة في قاع القوس.", fix: "اللمسة تحليق لا هبوط — ووصف اللمسة الخفيفة في التعليمات هامش الأمان؛ فالبار المرتد يختبر تصنيف تحمل الجمجمة، وهذا ليس التمرين." },
          { error: "التحميل لأجل الدفعة والنجاة بالكراشر.", fix: "الكراشر هو النصف الأضعف — اضبط الحمل بما يتحكم به القوس الممدود، ودع نصف الدفعة يشعر بالخفة؛ فالبار المتوازن يجعل النصفين أمينين، وغير المتوازن يجعل المجموعة خطرة." },
        ],
        alternatives: "السكول كراشر الخالص — مسطحًا أو مائلًا — يأخذ النصف الثاني وحده، والبنش القريب القبضة يأخذ الأول. وسكول كراشر البار المتعرج ينقذ الرسغين بقبضته المائلة، ونسخ الدمبل تعمل ذراعًا واحدة. ودفع الترايسبس — صفحته في مكتبتنا — يغطي الوضع المضغوط بلا أي خطر علوي؛ والمدّ بالحبل فوق الرأس يحمل الرأس الطويل ممدودًا بنمط فشل ألطف. وتبقى هذه الصفحة المدمجة قمة العائلة التقنية: الحركة التي تكسبها بعد امتلاك النصفين منفصلين.",
        progression: "امتلك النصفين أولًا: موسم من البنش القريب القبضة وموسم من السكول كراشر قبل الدمج، تمامًا كما يوحي وسم المتوسط. تبدأ المجموعة المدمجة خفيفة — حمل يتحكم به نصف الكراشر عبر قوسه الكامل لثمانية تكرارات — وتصعد بأصغر الأقراص مع حفظ النصفين لقوانينهما. والتدرجات توقفات: توقف ثانية في قمة الدفعة، وتحليق ثانية في قاع الكراشر، وكل واحدة تشتري شدًّا لا يستطيع وزن البار وحده شراءه.",
        programming: "برمجه القلب التقني لكتلة ترايسبس: ثلاث مجموعات من 6-10 تكرارات مدمجة براحة 90-120 ثانية، مرة أسبوعيًا — فإجهاد الحركة المزدوجة أمين لكن مطلبها المهاري عالٍ، والمرة الأسبوعية تحفظ الاثنين ناضجين. يناسب يوم تخصص أذرع أو الثلث الأخير من يوم دفع والمرفقان دافئان. وقوالبنا للمتوسطين تضعه هناك بالضبط، بعد الدفع وقبل عمل الضخ.",
        safety: "يسافر البار فوق الوجه والجبهة — هذا هو الخطر الرئيسي للحركة، وملاحظة المساعد في التعليمات هي التأمين: مساعد في كل مجموعة عمل، أو رف مائل بأوتاد عند ارتفاع الذقن. وزاوية الكفة الدوارة المحرجة عند الإخراج هي التحذير الثاني — تشير إليها التعليمات نفسها — فالتسليم يهم بقدر التكرار. والمرفقان اللذان يؤلمان خلال نصف الكراشر يعنيان أن الحمل وضعه كبرياء نصف الدفعة؛ انزل إلى وزن الكراشر الأمين فيبقى المفصلان في المحادثة.",
      },
    },
    faq: {
      en: [
        { q: "Why combine a press and a skull crusher at all?", a: "Because they load opposite ends of the triceps' job: the press trains the muscle compressed (elbow bent under load), the crusher trains it stretched (forearm falling under load) — the two positions that drive the muscle's full adaptation, visited inside one set. It is a density choice, not a doctrine; running them as separate exercises works the same math over more minutes." },
        { q: "Should the bar actually touch my forehead?", a: "Hover, not touch, is the working standard — the instructions describe the slight touch as the arc's bottom marker, and control is what makes it safe. Lifters with cranky elbows often stop the arc at the hairline; the honest range is the one the triceps still controls, and it grows with practice." },
        { q: "Decline, flat or incline for the fused version?", a: "This page teaches the decline — the angle keeps the bar's travel over the triceps' line and away from the face's center. Flat is the classic skull-crusher home and slightly longer-arc; incline shifts the stretch toward the long head. The decline version's real gift is the fused press's bottom position, which the other angles cannot stage as cleanly." },
      ],
      ar: [
        { q: "لماذا دمج دفعة مع سكول كراشر أصلًا؟", a: "لأنهما يحملان طرفين متقابلين من وظيفة الترايسبس: فالدفعة تدرّب العضلة مضغوطة (المرفق مثني تحت حمل)، والكراشر يدرّبها ممدودة (الساعد يهوي تحت حمل) — الوضعان اللذان يقودان تكيف العضلة الكامل، ويُزاران داخل مجموعة واحدة. إنه اختيار كثافة لا عقيدة؛ وتشغيلهما تمرينين منفصلين يحسب نفس الحساب عبر دقائق أكثر." },
        { q: "هل يلمس البار جبهتي فعلًا؟", a: "التحليق لا اللمس هو المعيار العامل — تصف التعليمات اللمسة الخفيفة كعلامة قاع القوس، والسيطرة ما تجعله آمنًا. وكثيرًا ما يوقف أصحاب المرفقين المتعبين القوس عند خط الشعر؛ فالمدى الأمين هو ما ما تزال الترايسبس تتحكم فيه، وهو ينمو بالممارسة." },
        { q: "مائل للأسفل أم مسطح أم مائل للأعلى للنسخة المدمجة؟", a: "تعلم هذه الصفحة المائل للأسفل — فالزاوية تحفظ سفر البار فوق خط الترايسبس بعيدًا عن مركز الوجه. والمسطح بيت السكول كراشر الكلاسيكي بقوس أطول قليلًا، والمائل للأعلى ينقل التمدد نحو الرأس الطويل. وهبة النسخة المائلة الحقيقية هي وضع قاع الدفعة المدمج، الذي لا تستطيع الزاويتان الأخريان تجهيزه بنفس النظافة." },
      ],
    },
    links: [
      { hrefEn: "/exercises/triceps-pushdown", hrefAr: "/ar/exercises/triceps-pushdown", labelEn: "Triceps pushdown — the safe volume partner", labelAr: "دفع الترايسبس — شريك الحجم الآمن" },
      { hrefEn: "/exercises/dips-triceps-version", hrefAr: "/ar/exercises/dips-triceps-version", labelEn: "Triceps dips — the bodyweight press", labelAr: "ديبس الترايسبس — الدفعة بوزن الجسم" },
      { hrefEn: "/programs/gym-ppl-intermediate", hrefAr: "/ar/programs/gym-ppl-intermediate", labelEn: "Intermediate PPL program", labelAr: "برنامج دفع-سحب-أرجل للمتوسطين" },
    ],
  },

  "dips-triceps-version": {
    intro: {
      en: "The triceps dip is the chest dip's upright sibling: same bars, but the instructions stage the difference precisely — torso held vertical, elbows traveling close to the body, lowering to the ninety-degree angle at the elbow and pressing back with the triceps in the lead. The library bills the triceps primary with chest and shoulders as seconds, the mirror image of the chest version's billing. It is one of the heaviest triceps exercises in existence without a single plate involved: bodyweight on two locked arms, controlled through the family's deepest elbow range. Every serious arm program's heavier chapters run through these bars.",
      ar: "ديبس الترايسبس هو الشقيق المنتصب لديبس الصدر: نفس القضبان، لكن تجهز التعليمات الفرق بدقة — جذع عمودي ومرفقان يسافران قريبين من الجسم وهبوط إلى زاوية التسعين درجة عند المرفق ودفع عودة والترايسبس تقود. تسجل المكتبة الترايسبس أساسية والصدر والأكتاف ثانيين، صورة مرآتية لفاتورة نسخة الصدر. إنها من أثقل تمارين الترايسبس وجودًا بلا قرص واحد: وزن الجسم على ذراعين مقفلتين، متحكمًا فيه عبر أعمق مدى مرفق في العائلة. وكل فصول برنامج أذرع جاد الأثقل تمر عبر هذين القضيبين.",
    },
    sections: {
      en: {
        muscles: "The triceps owns the vertical dip — the library's primary billing — because the upright torso takes the chest's lean out of the leverage: all three heads extend the elbows through the deepest bend the family offers, with the long head loaded hardest at the bottom's stretch. The chest and shoulders take their secondary shares in the bottom third, and the grip and forearms carry the whole body's argument with gravity for the set's duration. The torso's vertical line is the technical law that keeps the billing honest: lean forward and the exercise changes families.",
        mistakes: [
          { error: "Leaning the torso forward into the chest version's shape.", fix: "The instructions are explicit — torso upright, elbows in; the lean hands the rep to the chest and the triceps demotes itself in its own exercise." },
          { error: "Bouncing out of the bottom's ninety-degree bend.", fix: "The instructions' ninety-degree mark is a controlled stop, not a trampoline; the deep stretch under bodyweight is where the muscle grows and where the joint needs manners." },
          { error: "Sinking deeper than the shoulders can legally travel.", fix: "Depth ends at the ninety-degree elbow the instructions describe — past it the shoulder joint takes loads it never asked for, and dips' bad reputation is written exactly there." },
          { error: "Kipping with the legs for the final reps.", fix: "Cross the ankles, still body, strict presses — a dipped knee is a rep the triceps did not lift, and the logbook knows the difference even when the count does not." },
        ],
        alternatives: "The bench dip — its page sits in this library — takes the pattern to any bench at a fraction of the load; the dip machine loads below bodyweight for the building phase. The close-grip press family loads the same elbow extension with the shoulders supported; the pushdown covers the compressed position safely. Between them, the assisted dip and the negative dip (jump up, lower slowly) are the honest roads to the first strict rep on these bars.",
        progression: "The ladder is the family's: negatives first — jump to the top, lower for five seconds — then band-assisted reps, then strict singles, then sets of five and beyond, each rung earned while the vertical torso law holds. Loading begins with a dip belt once twelve strict reps arrive, climbing in five-kilo jumps. The depth law never moves with the numbers: ninety degrees at the elbow is the honest bottom at bodyweight, at twenty added kilos, and at fifty — the range that made the reps is the range that keeps them.",
        programming: "Program it as the main triceps lift of a push or arm day: 3-4 sets of 6-12 reps with 2-3 minutes of rest, once or twice a week. As a bodyweight flagship it earns the early slot — fresh shoulders, honest reps — before the pressing assistance work. It pairs famously with the skull-crusher family (heavy loaded stretch after heavy bodyweight press), and our arm templates run exactly that pairing on specialization days.",
        safety: "The shoulder is the joint the depth law protects: the bottom of a deep dip loads it at maximum stretch, and past the ninety-degree elbow the structures complain in the order they were stressed. Sternum pinching, shoulder slipping or numbness are stop signals, not stretch signals. The wrists prefer the bars' natural angle or parallel-bar handles; and the first failure on dips should be practiced, not experienced — know the bail (feet down, knees bent) before the weight ever argues with you.",
      },
      ar: {
        muscles: "تمتلك الترايسبس الديبس العمودي — الفاتورة الأساسية للمكتبة — لأن الجذع المنتصب يخرج ميل الصدر من الرافعة: فالرؤوس الثلاثة تمدّ المرفقين عبر أعمق انثناء تقدمه العائلة، ويُحمل الرأس الطويل أقسى عند تمدد القاع. ويأخذ الصدر والأكتاف نصيبهما الثانوي في الثلث السفلي، والقبضة والساعدان يحملان حجة الجسم كلها مع الجاذبية طوال المجموعة. وخط الجذع العمودي هو القانون التقني الذي يحفظ للفاتورة أمانتها: مِل أمامًا وتغير التمرين عائلاته.",
        mistakes: [
          { error: "ميل الجذع أمامًا إلى شكل نسخة الصدر.", fix: "التعليمات صريحة — جذع عمودي ومرفقان داخل؛ فالميل يسلم التكرار للصدر وتُنزل الترايسبس نفسها في تمرينها هي." },
          { error: "الارتداد من انثناء التسعين في القاع.", fix: "علامة التسعين في التعليمات توقف متحكم لا نطّاحة؛ فالتمدد العميق تحت وزن الجسم هو حيث تنمو العضلة وحيث يحتاج المفصل الذوق." },
          { error: "الغوص أعمق مما تستطيع الأكتاف سفره قانونيًا.", fix: "ينتهي العمق عند مرفق التسعين الذي تصفه التعليمات — فبعده يتلقى مفصل الكتف أحمالًا لم يطلبها، وسمعة الديبس السيئة تُكتب هناك بالضبط." },
          { error: "الرفس بالرجلين للتكرارات الأخيرة.", fix: "اضرب الكاحلين وجسم ساكن ودفعات صارمة — فالركبة المغمورة تكرار لم ترفعه الترايسبس، ودفتر السجل يعرف الفرق حتى حين لا يعرفه العدّ." },
        ],
        alternatives: "ديبس البنش — صفحته في مكتبتنا — يأخذ النمط إلى أي بنش بجزء يسير من الحمل، وماكينة الديبس تحمل تحت وزن الجسم لمرحلة البناء. وعائلة البنش القريب القبضة تحمل مدّ المرفق نفسه بأكتاف مدعومة، والدفعة السفلية تغطي الوضع المضغوط بأمان. وبينهما، الديبس بمساعدة المطاط والديبس السالب — اقفز لأعلى وانزل ببطء — طريقان أمينان لأول تكرار صارم على هذين القضيبين.",
        progression: "السلم سلم العائلة: سالبات أولًا — اقفز للقمة وانزل خمس ثوان — ثم تكرارات بمطاط مساعد، ثم فرديات صارمة، ثم مجموعات خمس وما بعدها، وكل درجة تُكسب مع بقاء قانون الجذع العمودي. ويبدأ التحميل بحزام ديبس عند وصول اثني عشر تكرارًا صارمًا، صاعدًا بقفزات الخمسة كيلوجرامات. وقانون العمق لا يتحرك مع الأرقام أبدًا: مرفق التسعين هو القاع الأمين عند وزن الجسم وعند عشرين كيلوجرامًا مضافة وعند خمسين — فالمدى الذي صنع التكرارات هو المدى الذي يحفظها.",
        programming: "برمجه كرفعة الترايسبس الرئيسية ليوم دفع أو أذرع: 3-4 مجموعات من 6-12 تكرارًا براحة دقيقتين إلى ثلاث، مرة أو مرتين أسبوعيًا. وكعلم بوزن الجسم يكسب الخانة المبكرة — أكتاف نضرة وتكرارات أمينة — قبل أعمال الدفع المساعدة. ويقترن شهرةً بعائلة السكول كراشر (تمدد محمل ثقيل بعد دفع ثقيل بوزن الجسم)، وقوالب الأذرع لدينا تشغل ذلك الاقتران بالضبط في أيام التخصص.",
        safety: "الكتف هو المفصل الذي يحميه قانون العمق: فقاع الديبس العميق يحمله عند أقصى تمدد، وبعد مرفق التسعين تشتكي البنيات بترتيب إجهادها. ووخز القص أو انزلاق الكتف أو التنميل إشارات توقف لا إشارات تمدد. ويفضل الرسغان زاوية القضبان الطبيعية أو مقابض القضبان المتوازية؛ وأول فشل على الديبس ينبغي أن يتدرب لا أن يعاش — اعرف الهروب — القدمان أرضًا والركبتان مثنيتان — قبل أن يجادلك الوزن أبدًا.",
      },
    },
    faq: {
      en: [
        { q: "Triceps dips or bench dips for a beginner?", a: "Bench dips, almost always first: the feet-on-the-floor version loads a fraction of bodyweight, trains the same vertical press, and needs no bars. The full bars arrive when bench dips pass fifteen clean reps — the machine or band-assisted versions bridge the gap honestly, and this library carries the bench-dip page as the family's ground floor." },
        { q: "Why do my shoulders hurt at the bottom of dips?", a: "Depth past the shoulder's comfortable stretch is the usual verdict — the ninety-degree elbow law exists exactly there. Shorten the range to the pain-free zone, add the bench or machine version for volume while the joint adapts, and if the pinch persists past two weeks, a clinician's look is cheaper than a season off. Dips are a great exercise at the depth your shoulders vote for." },
        { q: "How do I add weight to dips?", a: "With a dip belt once twelve to fifteen strict reps are owned — the belt's chain threads plates, and the knees-locked dumbbell hold is the budget stand-in. Climb about five kilos at a time and let the reps fall back to the six-to-ten range; the belt's advantage over the backpack is simple: the load hangs under the hips and never argues with your balance." },
      ],
      ar: [
        { q: "ديبس الترايسبس أم ديبس البنش للمبتدئ؟", a: "ديبس البنش أولًا دائمًا تقريبًا: فنسخة القدمين على الأرض تحمل جزءًا من وزن الجسم وتدرّب نفس الدفعة العمودية ولا تحتاج قضبانًا. وتصل القضبان الكاملة عند تجاوز ديبس البنش خمس عشرة تكرارًا نظيفة — وماكينة أو نسخة المطاط تسد الفجوة بأمانة، وتحمل مكتبتنا صفحة ديبس البنش كطابق العائلة الأرضي." },
        { q: "لماذا تؤلمني أكتافي في قاع الديبس؟", a: "العمق الماضي على تمدد الكتف المريح هو الحكم المعتاد — وقانون مرفق التسعين موجود هناك بالضبط. قصّر المدى إلى منطقة بلا ألم، وأضف نسخة البنش أو الماكينة للحجم بينما يتأقلم المفصل، وإن استمر الوخز أسبوعين فنظرة طبيب أرخص من موسم إجازة. الديبس تمرين عظيم عند العمق الذي تصوت له أكتافك." },
        { q: "كيف أضيف وزنًا إلى الديبس؟", a: "بحزام ديبس عند امتلاك اثني عشر إلى خمسة عشر تكرارًا صارمًا — سلسلة الحزام تخترق الأقراص، ومسك الدمبل بين ركبتين مضروبتين بديل الميزانية. اصعد نحو خمسة كيلوجرامات في المرة ودع التكرارات تهبط إلى نطاق الستة إلى العشرة؛ وميزة الحزام على الحقيبة بسيطة: الحمل يتدلى تحت الوركين ولا يجادل توازنك أبدًا." },
      ],
    },
    links: [
      { hrefEn: "/exercises/bench-dips", hrefAr: "/ar/exercises/bench-dips", labelEn: "Bench dips — the ground floor", labelAr: "ديبس البنش — الطابق الأرضي" },
      { hrefEn: "/exercises/dips-chest-version", hrefAr: "/ar/exercises/dips-chest-version", labelEn: "Chest dips — the leaning cousin", labelAr: "ديبس الصدر — القريب المائل" },
      { hrefEn: "/workout-tracker", hrefAr: "/ar/workout-tracker", labelEn: "Track every rep — free tracker", labelAr: "سجل كل تكرار — المتتبع المجاني" },
    ],
  },
};
