import type { ToolReference } from "./tool-reference";

/**
 * BMI Calculator reference — Phase SEO-GEO-6.5 (§12.19 P1-6).
 * The calculator implements BMI = weight(kg) / height(m)² with WHO
 * category cutoffs (18.5 / 25 / 30) and an ideal-weight range derived
 * from the healthy BMI band 18.5–24.9 multiplied by height squared.
 * Canaries pin 18.5, 24.9, 25 and 30 in this copy.
 */

export const BMI_CALCULATOR_CONTENT: ToolReference = {
  slug: "bmi-calculator",
  intro: {
    en: "Body Mass Index (BMI) is the most widely used screening number in the world for classifying body weight against height: your weight in kilograms divided by the square of your height in meters. This calculator computes your BMI, places it in the World Health Organization category scale, and derives the healthy weight range for your exact height — the weight span at which your BMI would sit between 18.5 and 24.9. The complete reference below covers what the index can and cannot tell you: its formula and history, how to interpret the categories honestly, why it misreads athletes and older adults, how it compares with waist-based measures, and the classic ideal-weight formulas alongside the range method this tool uses.",
    ar: "مؤشر كتلة الجسم هو رقم الفحص الأوسع استخداماً في العالم لتصنيف وزن الجسم مقابل الطول: وزنك بالكيلوغرام مقسوماً على مربع طولك بالمتر. تحسب هذه الحاسبة مؤشرك، وتضعه على سلم فئات منظمة الصحة العالمية، وتستخرج نطاق الوزن الصحي لطولك تحديداً — مدى الوزن الذي يقف عنده مؤشرك بين 18.5 و24.9. ويغطي المرجع الكامل أدناه ما يستطيع المؤشر قوله وما لا يستطيع: صيغته وتاريخه، وكيف تقرأ الفئات بصدق، ولماذا يسيء قراءة الرياضيين وكبار السن، وكيف يقارن بمقاييس الخصر، والمعادلات الكلاسيكية للوزن المثالي إلى جانب طريقة النطاق التي تستخدمها هذه الأداة.",
  },
  sections: [
    {
      id: "what-is-bmi",
      heading: {
        en: "What is BMI and where did it come from?",
        ar: "ما هو مؤشر كتلة الجسم ومن أين جاء؟",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "BMI = weight (kg) / height (m)². A person weighing 75 kg at 1.75 m has a BMI of 75 ÷ 3.0625 ≈ 24.5. The index was devised in the 1830s by the Belgian astronomer and statistician Adolphe Quetelet — not by a physician, and not for individual diagnosis, but as a population-level descriptor of \"average man\" in social statistics. Almost two centuries later, Ancel Keys's 1972 paper renamed it \"body mass index\" and it entered clinical screening, precisely because weight alone is meaningless without a height to scale it against: 85 kg tells you nothing until you know whether it stands on a 1.60 m frame or a 1.95 m one.",
            ar: "المؤشر = الوزن (كجم) ÷ مربع الطول (م)². فشخص وزنه 75 كجم وطوله 1.75 متر له مؤشر 75 ÷ 3.0625 ≈ 24.5. ابتُكر المؤشر في ثلاثينيات القرن التاسع عشر على يد الفلكي والإحصائي البلجيكي Adolphe Quetelet — لا على يد طبيب، وليس لتشخيص الأفراد، بل كواصفٍ سكّي لمستوى المجتمعات لـ«الإنسان المتوسط» في الإحصاء الاجتماعي. وبعد قرنين تقريباً، أعادت ورقة Ancel Keys عام 1972 تسميته «مؤشر كتلة الجسم» فدخل الفحص الإكلينيكي، وتحديداً لأن الوزن وحده بلا معنى دون طولٍ يُنسب إليه: 85 كجم لا تخبرك شيئاً حتى تعرف إن كانت تقف على هيكل 1.60 متر أم 1.95 متر.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The division by height squared — rather than height cubed, which would scale like a solid object — comes from empirical observation that body weight across adults scales roughly with height to the power of two. That choice is exactly why BMI is a screening index and not a body-composition measurement: it deliberately ignores what the weight consists of, trading precision for the ability to be computed anywhere, instantly, with a scale and a tape.",
            ar: "القسمة على مربع الطول — بدل مكعبه الذي كان سيقيس مثل جسم صلب — جاءت من ملاحظة تجريبية مفادها أن وزن الجسم عبر البالغين يتناسب تقريباً مع الطول مرفوعاً لقوة اثنين. وهذا الاختيار تحديداً هو سبب كون المؤشر فهرسَ فحص لا قياسَ تكوين جسم: فهو يتجاهل عمداً مما يتكون الوزن، مقابل قابلية حسابه في أي مكان وفوراً بميزان وشريط قياس.",
          },
        },
      ],
    },
    {
      id: "categories",
      heading: {
        en: "The WHO category scale and what each band means",
        ar: "سلم فئات منظمة الصحة العالمية ومعنى كل نطاق",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The World Health Organization classifies adult BMI into the bands below. The thresholds are statistical compromises chosen for their association with health risk across enormous populations — a BMI above 25 is where average metabolic risk begins climbing measurably, and above 30 where it climbs steeply. Within overweight, the medical literature often subdivides class I (30–34.9), class II (35–39.9), and class III (40+) obesity for treatment decisions.",
            ar: "تصنف منظمة الصحة العالمية مؤشر البالغين في النطاقات أدناه. والعتبات تسويات إحصائية اختيرت لاقترانها بالخطر الصحي عبر مجتمعات هائلة — فعند المؤشر فوق 25 يبدأ متوسط الخطر الأيضي صعوداً قابلاً للقياس، وفوق 30 يصعد بحدّة. وداخل السمنة يقسّم الأدبي الطبي غالباً إلى الصنف الأول (30–34.9) والثاني (35–39.9) والثالث (40+) لقرارات العلاج.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "WHO adult BMI categories (this calculator's scale)",
              ar: "فئات مؤشر البالغين وفق منظمة الصحة العالمية (سلم هذه الحاسبة)",
            },
            columns: [
              { en: "BMI", ar: "المؤشر" },
              { en: "Category", ar: "الفئة" },
              { en: "Reading", ar: "القراءة" },
            ],
            rows: [
              { en: ["Below 18.5", "Underweight", "Insufficient energy reserves; check causes"], ar: ["أقل من 18.5", "نقص في الوزن", "احتياطي طاقة غير كافٍ؛ افحص الأسباب"] },
              { en: ["18.5 – 24.9", "Normal weight", "Lowest average statistical health risk"], ar: ["18.5 – 24.9", "وزن طبيعي", "أدنى متوسط خطر صحي إحصائي"] },
              { en: ["25.0 – 29.9", "Overweight", "Moderate average risk; worth attention"], ar: ["25.0 – 29.9", "زيادة في الوزن", "خطر متوسط في المتوسط؛ يستحق انتباهاً"] },
              { en: ["30.0 and above", "Obese", "High average risk; clinical evaluation advised"], ar: ["30.0 فأكثر", "سمنة", "خطر عالٍ في المتوسط؛ يُنصح بتقييم طبي"] },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "Read the categories as actuarial statements, not verdicts. A BMI of 26 with a 90 cm waist, no metabolic abnormalities, and regular training carries a different real risk than a BMI of 26 with a 104 cm waist and pre-diabetes — the index alone cannot see that difference, which is why clinicians pair BMI with waist circumference and blood work before concluding anything. Conversely, a \"normal\" BMI with a large waist and low muscle — sometimes called normal-weight obesity — is not automatically safe; the index can flatter as well as alarm.",
            ar: "اقرأ الفئات كعبارات اكتوارية لا كأحكام. فمؤشر 26 مع خصر 90 سم وبلا اضطرابات أيضية وتدريب منتظم يحمل خطراً واقعياً مختلفاً عن مؤشر 26 مع خصر 104 سم ومقدمات سكري — الفهرس وحده لا يرى هذا الفرق، ولهذا يقرن الأطباء المؤشر بمحيط الخصر والتحاليل قبل أي استنتاج. وبالعكس، فمؤشر «طبيعي» مع خصر كبير وعضل ضعيف — ما يسمى أحياناً السمنة بوزن طبيعي — ليس آمناً تلقائياً؛ فالفهرس يجامل كما ينبّه.",
          },
        },
        {
          kind: "p",
          text: {
            en: "One honest note on ethnicity: some health authorities in Asian populations observe metabolic risk climbing at lower BMIs, and WHO expert consultations have flagged public-health action points near 23 and 27.5 for such populations as screening guidance — individuals should not diagnose themselves with these adjusted cutoffs, but they explain why two doctors in two countries may describe the same BMI slightly differently.",
            ar: "ملاحظة صادقة عن الأعراق: تلاحظ بعض جهات الصحة في مجتمعات آسيوية أن الخطر الأيضي يصعد عند مؤشرات أدنى، وأشارت مشاورات خبراء المنظمة إلى نقاط تدخل صحي عام قرب 23 و27.5 لمثل هذه المجتمعات كإرشاد فحص — ولا ينبغي للأفراد تشخيص أنفسهم بهذه العتبات المعدلة، لكنها تفسّر لماذا قد يصف طبيبان في بلدين المؤشر نفسه وصفاً مختلفاً قليلاً.",
          },
        },
      ],
    },
    {
      id: "how-to-measure",
      heading: {
        en: "How to measure so the index is meaningful",
        ar: "كيف تقيس ليكون المؤشر ذا معنى",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Weigh yourself under consistent conditions — morning, after the bathroom, before eating or drinking, with minimal clothing, always on the same scale — and average three mornings rather than trusting any single day, since body water alone can swing daily weight by 1–2 kg. Measure height once, properly: standing straight against a wall, heels together, looking forward with the Frankfort plane (lower eye socket edge aligned with the ear canal) horizontal, marked at the top of the head. Shoes, thick hair buns, and a shrugging \"about 175\" posture quietly bias the result.",
            ar: "زِن نفسك بظروف متسقة — صباحاً، بعد قضاء الحاجة، قبل الأكل والشرب، بملابس خفيفة، وعلى الميزان نفسه دائماً — وخذ متوسط ثلاثة صباحات بدل الوثوق بيوم مفرد، فماء الجسم وحده يستطيع تحريك الوزن اليومي 1–2 كجم. وقس الطول مرة واحدة كما ينبغي: واقفاً مستقيماً عند جدار، الكعبان ملتصقان، النظر إلى الأمام والمستوى الفرنكفورتي (الحافة السفلية لمحجر العين محاذية لقناة الأذن) أفقياً، والعلامة عند قمة الرأس. فالحذاء والكعكة السميكة ووقفة «نحو 175» المتهاوية تنحرف بالنتيجة بهدوء.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The calculator accepts metric or imperial and converts internally (1 inch = 2.54 cm, 1 kg = 2.2046 lb); entering mixed units is the classic way to manufacture a nonsense BMI like 2,000 or 0.7. Children and teenagers should not use the adult scale at all — their BMI is compared against age-and-sex percentile charts, a different instrument entirely.",
            ar: "تقبل الحاسبة النظام المتري أو الإمبراطوري وتحوّل داخلياً (1 إنش = 2.54 سم، 1 كجم = 2.2046 رطل)؛ وإدخال وحدات مختلطة هو الطريقة الكلاسيكية لتصنيع مؤشر عبثي مثل 2000 أو 0.7. أما الأطفال والمراهقون فلا ينبغي لهم استخدام سلم البالغين أصلاً — فمؤشرهم يُقارن بمنحنيات مئينية حسب العمر والجنس، وهي أداة مختلفة تماماً.",
          },
        },
      ],
    },
    {
      id: "ideal-weight",
      heading: {
        en: "Your ideal weight range — and the classic formulas",
        ar: "نطاق وزنك المثالي — والمعادلات الكلاسيكية",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "This calculator defines your ideal weight as a range, not a single number: the weights at which your height's BMI sits between 18.5 and 24.9 — the healthy band's floor and ceiling multiplied by your height squared. At 1.75 m that range spans roughly 56.7–76.3 kg, a 20-kilogram window. The range approach is honest because \"ideal weight\" is genuinely a band: where you feel energetic, train well, and hold healthy bloodwork inside that band is a personal matter no formula can locate.",
            ar: "تُعرّف هذه الحاسبة وزنك المثالي نطاقاً لا رقماً واحداً: الأوزان التي يقف عندها مؤشر طولك بين 18.5 و24.9 — أرضية نطاق الصحة وسقفه مضروبين في مربع طولك. عند طول 1.75 متر يمتد النطاق تقريباً من 56.7 إلى 76.3 كجم — نافذة بعشرين كيلوغراماً. وطريقة النطاق صادقة لأن «الوزن المثالي» حزامٌ حقاً: أين تشعر بالطاقة وتتدرب جيداً وتحمل تحاليل صحية داخل هذا الحزام شأنٌ شخصي لا تحدده أي معادلة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "For historical completeness, the single-number formulas still circulate — Devine (1974, originally for drug dosing): 50 kg + 2.3 kg per inch over 5 feet for men, 45.5 kg + 2.3 kg per inch for women; Hamwi (1964): 48 kg + 2.7 kg per inch for men, 45.5 + 2.2 for women; and Robinson (1983), a revision of Devine. They disagree with each other by several kilograms at the same height, which is precisely the argument for the range method: when the classics cannot agree on one number, the honest answer is a band.",
            ar: "لاكتمال تاريخي، ما تزال معادلات الرقم الواحد متداولة — Devine (1974، لأغراض جرعات الدواء أصلاً): 50 كجم + 2.3 كجم لكل إنش فوق خمسة أقدام للذكور، و45.5 كجم + 2.3 للإناث؛ و Hamwi (1964): 48 كجم + 2.7 كجم لكل إنش للذكور و45.5 + 2.2 للإناث؛ و Robinson (1983) تنقيحٌ لـ Devine. وهي تختلف فيما بينها كيلوغرامات عند الطول نفسه، وهذا بالضبط حجّة طريقة النطاق: حين تعجز الكلاسيكيات عن الاتفاق على رقم واحد، فالإجابة الصادقة حزام.",
          },
        },
        {
          kind: "p",
          text: {
            en: "A practical way to use the range: pick your current BMI, and if it sits outside 18.5–24.9, the nearest band edge is your first milestone — not the middle. Moving from a BMI of 32 to 28 delivers most of the measurable health benefit of the entire journey to 24; the final kilometers inside the healthy band are polish, not medicine.",
            ar: "طريقة عملية للنطاق: خُذ مؤشرك الحالي، وإن كان خارج 18.5–24.9 فحافة النطاق الأقرب هي محطتك الأولى — لا منتصفه. فالانتقال من مؤشر 32 إلى 28 يحقق معظم الفائدة الصحية القابلة للقياس في الرحلة كلها إلى 24؛ والكيلومترات الأخيرة داخل حزام الصحة صقلٌ لا دواء.",
          },
        },
      ],
    },
    {
      id: "limitations",
      heading: {
        en: "Where BMI fails — and who should ignore it",
        ar: "حيث يفشل المؤشر — ومن ينبغي أن يتجاهله",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "BMI's blind spot is by design: it cannot see body composition. Muscle is denser than fat, so heavily muscled people routinely score \"overweight\" or worse while carrying low body fat — the classic case is a 1.80 m, 95 kg rugby forward with 12% body fat scoring a BMI of 29.3. If you train seriously with weights, treat BMI as noise and track body fat percentage and waist instead. In the opposite direction, BMI overrates leanness in older adults: muscle and bone are lost with age while internal (visceral) fat accumulates, so an unchanged BMI can hide a meaningfully worse composition — the \"normal-weight obesity\" pattern.",
            ar: "نقطة عمى المؤشر مقصودة في تصميمه: لا يرى تكوين الجسم. فالعضلة أكثف من الدهون، لذا يسجل عضليو الأجسام «زيادة وزن» أو أسوأ رغم حملهم دهوناً قليلة — والحالة الكلاسيكية مهاجم رغبي بطول 1.80 متر ووزن 95 كجم ودهون 12% يسجل مؤشر 29.3. إن كنت تتدرب بجدية بالأثقال فتعامل مع المؤشر كضجيج وتتبع نسبة دهون الجسم والخصر بدلاً منه. وفي الاتجاه المعاكس، يجامل المؤشر النحافة عند كبار السن: تُفقد العضلة والعظم مع العمر وتتراكم الدهون الداخلية (الحشوية)، فيخفي مؤشرٌ ثابت تكويناً أسوأ بما فيه معنى — نمط «السمنة بوزن طبيعي».",
          },
        },
        {
          kind: "p",
          text: {
            en: "Other known distortions: BMI overestimates fatness in tall people slightly and underestimates it in short people (an artifact of the height-squared scaling); it is invalid in pregnancy, after bariatric surgery in the first year, in limb amputation without adjustment, and in childhood (use BMI-for-age percentiles); and it says nothing about fat distribution, which matters — visceral fat around the organs carries more metabolic risk than the same fat volume under the skin. This is why the waist-based companions exist.",
            ar: "تشوهات أخرى معروفة: يبالغ المؤشر قليلاً في تقدير بدانة طوال القامص ويقللها عند قصارهم (أثر قياس مربع الطول)؛ وهو غير صالح في الحمل، وفي السنة الأولى بعد جراحات السمنة، وبعد بتر الأطراف دون تعديل، وفي الطفولة (استخدم منحنيات المئين حسب العمر)؛ ولا يقول شيئاً عن توزيع الدهون، وهو مهم — فالدهون الحشوية حول الأعضاء تحمل خطراً أيضياً أكبر من الحجم نفسه تحت الجلد. لهذا وُجدت رفيقات الخصر.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The single best complement costs nothing: waist circumference, measured at the midpoint between the bottom rib and the top of the hip bone, relaxed, at the end of a normal exhale. The consensus risk thresholds sit near 94 cm for men and 80 cm for women (with substantially increased risk above 102 and 88). An even simpler screen growing in research use is waist-to-height ratio: keep your waist less than half your height. BMI plus waist-together catch most of what either misses alone; this site's body fat calculator adds the composition dimension on top.",
            ar: "أفضل مكمّل وحده بلا كلفة: محيط الخصر، مقاساً عند منتصف المسافة بين أسفل الضلع وأعلى عظم الورك، مسترخياً، في نهاية زفير طبيعي. عتبات الخطر التوافقية تقبع قرب 94 سم للذكور و80 سم للإناث (مع خطر متزايد جوهرياً فوق 102 و88). وشاشة أبسط تنمو في الاستخدام البحثي: نسبة الخصر إلى الطول — حافظ على خصرك أقل من نصف طولك. المؤشر والخصر معاً يلتقطان معظم ما يفوّته كلٌّ وحده؛ وحاسبة دهون الجسم في هذا الموقع تضيف بعد التكوين فوقهما.",
          },
        },
      ],
    },
    {
      id: "health-context",
      heading: {
        en: "What the bands mean for health — without panic",
        ar: "ما تعنيه النطاقات للصحة — بلا هلع",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Across population studies, rising BMI above 25 correlates with higher average risk of type 2 diabetes, hypertension, cardiovascular disease, several cancers, and joint disease — the relationship is real, graded, and monotonic on average. Correlation on populations, however, is not a diagnosis for one person: fitness, fat distribution, diet quality, sleep, smoking, and genetics all move individual risk substantially within any BMI band. A trained, well-sleeping, non-smoking person at BMI 27 frequently outperforms a sedentary smoker at BMI 23 on real health markers.",
            ar: "عبر الدراسات السكانية، يقترن صعود المؤشر فوق 25 بمتوسط خطر أعلى للسكري من النوع الثاني وارتفاع ضغط الدم والأمراض القلبية الوعائية وسرطانات عدة وأمراض المفاصل — العلاقة حقيقية ومتدرجة ورتيبة في المتوسط. لكن الاقتران على المجتمعات ليس تشخيصاً لشخص واحد: فاللياقة وتوزيع الدهون وجودة الغذاء والنوم والتدخين والوراثة كلها تحرك الخطر الفردي جوهرياً داخل أي نطاق. فشخص متدرب نائم جيداً غير مدخن عند مؤشر 27 يتفوق غالباً على خاملٍ مدخن عند 23 على مؤشرات الصحة الحقيقية.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The encouraging, well-replicated finding for anyone above the healthy band: risk responds to modest change. Losing roughly 5–10% of body weight meaningfully improves blood pressure, blood glucose, and blood lipids in most people with elevated values — for a 100 kg person that is 5–10 kg, an achievable first milestone, not the full distance to the healthy band. And the behaviors that produce the loss — regular activity, better food structure, sleep — carry benefits that outrun the scale itself.",
            ar: "والاكتشاف المشجّع المتكرر لكل من هو فوق حزام الصحة: الخطر يستجيب لتغيير متواضع. فخسارة نحو 5–10% من وزن الجسم تحسّن بشكل ذي معنى ضغط الدم وغلوكوز الدم ودهونه عند معظم من لديهم قيم مرتفعة — لشخص بوزن 100 كجم يعني ذلك 5–10 كجم، محطة أولى قابلة للتحقق، لا المسافة كاملة إلى حزام الصحة. والسلوكيات التي تنتج الخسارة — نشاط منتظم، وبنية غذاء أفضل، ونوم — تحمل منافع تسبق الميزان نفسه.",
          },
        },
      ],
    },
    {
      id: "using-with-other-tools",
      heading: {
        en: "BMI inside this site's toolchain",
        ar: "المؤشر داخل سلسلة أدوات هذا الموقع",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "BMI answers \"is my weight, scaled for height, in the statistical healthy band?\" — a two-minute triage. The natural next questions and their tools: \"what does the weight consist of?\" → the body fat calculator (US Navy tape method); \"how much should I eat to change it?\" → the calorie calculator (Mifflin-St Jeor); \"how do I split those calories?\" → the macro calculator; and \"how do I turn the numbers into actual meals?\" → the meal planner. Used in that order, the tools take you from screening to a plan without ever leaving the site.",
            ar: "يجيب المؤشر عن سؤال «هل وزني، منسوباً لطولي، داخل حزام الصحة الإحصائي؟» — فرزٌ في دقيقتين. والأسئلة التالية الطبيعية وأدواتها: «مما يتكون الوزن؟» ← حاسبة دهون الجسم (طريقة الشريط البحرية الأمريكية)؛ «كم آكل لأغيّره؟» ← حاسبة السعرات (Mifflin-St Jeor)؛ «كيف أوزّع هذه السعرات؟» ← حاسبة الماكروز؛ و«كيف أحوّل الأرقام إلى وجبات فعلية؟» ← مخطط الوجبات. بهذا الترتيب تأخذك الأدوات من الفحص إلى خطة دون مغادرة الموقع أصلاً.",
          },
        },
        {
          kind: "p",
          text: {
            en: "One more reassurance for the number-anxious: BMI moves slowly by design. At a steady 500-kcal daily deficit the index drops roughly half a point per month for an average adult — a number designed for months and years of tracking, not morning-to-morning. Weigh under consistent conditions, log weekly averages, and let the trend, not any single reading, tell the story.",
            ar: "طمأنة أخيرة لقلقي الأرقام: المؤشر يتحرك ببطء بقصد. عند عجز يومي ثابت قدره 500 سعرة يهبط الفهرس نحو نصف نقطة شهرياً عند بالغ متوسط — رقم مصمم للتعقب عبر شهور وسنين، لا صباحاً بصباح. زِن بظروف متسقة، وسجّل المتوسطات الأسبوعية، ودع الاتجاه لا أي قراءة مفردة يحكي القصة.",
          },
        },
      ],
    },
    {
      id: "height-weight-table",
      heading: {
        en: "Healthy weight range for every height — the reference table",
        ar: "نطاق الوزن الصحي لكل طول — الجدول المرجعي",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The table below is the calculator's ideal-weight math, precomputed for the full adult height span: for each height, the minimum weight is the weight at BMI 18.5 and the maximum is the weight at BMI 24.9, both as weight = BMI × height². Find your height row and read your band — or use it in reverse to see which heights a given weight is healthy for. Values are rounded to the nearest half kilogram.",
            ar: "الجدول أدناه حسبة الوزن المثالي في الحاسبة، محسوبة سلفاً لمدى أطوال البالغين كاملاً: لكل طول، الحد الأدنى هو الوزن عند مؤشر 18.5 والحد الأقصى الوزن عند 24.9، وكلاهما بالصيغة: الوزن = المؤشر × مربع الطول. ابحث صف طولك واقد حزامك — أو استخدمه بالمقلوب لترى لأي أطوال وزنٌ معطى يكون صحياً. القيم مقربة لأقرب نصف كيلوغرام.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Healthy weight (kg) by height — BMI 18.5–24.9 band",
              ar: "الوزن الصحي (كجم) حسب الطول — حزام المؤشر 18.5–24.9",
            },
            columns: [
              { en: "Height", ar: "الطول" },
              { en: "Min weight", ar: "الحد الأدنى" },
              { en: "Max weight", ar: "الحد الأقصى" },
            ],
            rows: [
              { en: ["150 cm", "41.6", "56.0"], ar: ["150 سم", "41.6", "56.0"] },
              { en: ["155 cm", "44.5", "59.9"], ar: ["155 سم", "44.5", "59.9"] },
              { en: ["160 cm", "47.4", "63.7"], ar: ["160 سم", "47.4", "63.7"] },
              { en: ["165 cm", "50.4", "67.8"], ar: ["165 سم", "50.4", "67.8"] },
              { en: ["170 cm", "53.5", "71.9"], ar: ["170 سم", "53.5", "71.9"] },
              { en: ["175 cm", "56.7", "76.3"], ar: ["175 سم", "56.7", "76.3"] },
              { en: ["180 cm", "60.0", "80.7"], ar: ["180 سم", "60.0", "80.7"] },
              { en: ["185 cm", "63.3", "85.2"], ar: ["185 سم", "63.3", "85.2"] },
              { en: ["190 cm", "66.8", "89.9"], ar: ["190 سم", "66.8", "89.9"] },
              { en: ["195 cm", "70.3", "94.7"], ar: ["195 سم", "70.3", "94.7"] },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "Three reading notes for the table. First, the band is wide on purpose — a 1.75 m person has a 19.6-kilogram-wide healthy corridor, and where you settle inside it is a matter of where you feel strongest and most energetic, not a number to converge on. Second, muscular trainees may legitimately sit above the maximum while being metabolically healthy — the table inherits BMI's blind spot, and the body fat calculator covers what it cannot see. Third, the boundaries are statistical conveniences as explained in the categories section: approach them as a map, not as walls, and let trend, waist, and bloodwork vote alongside the number.",
            ar: "ثلاث ملاحظات قراءة للجدول. أولاً، الحزام عريض بقصد — فشخص بطول 1.75 متر لديه ممر صحي عرضه 19.6 كيلوغراماً، وأين تستقر داخله مسألةُ أين تشعر بالقوة والطاقة أكثر، لا رقمٌ يجب التقارب عليه. ثانياً، قد يجلس المتدربون العضليون فوق الحد الأقصى وهم صحيحون أيضياً مشروعاً — فالجدول يرث نقطة عمى المؤشر، وحاسبة دهون الجسم تغطي ما لا يراه. ثالثاً، الحدود تسويات إحصائية كما فُسر في قسم الفئات: قرّبها كخريطة لا كجدران، ودع الاتجاه والخصر والتحاليل تصوّت مع الرقم.",
          },
        },
      ],
    },
    {
      id: "history-screening",
      heading: {
        en: "Why a 190-year-old index still runs every clinic on earth",
        ar: "لماذا ما يزال فهرسُ عمره 190 عاماً يدير كل عيادة على الأرض",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "BMI survives in every clinic and every national health survey for one unglamorous reason: at the population scale, nothing cheaper collects more signal. A scale and a stadiometer in sixty seconds produce an index that, across millions of people, correlates with disease burden, healthcare costs, and mortality well enough to steer screening programs, set public-health priorities, and define obesity prevalence maps that guide national policy. The index that is too blunt for one athlete is sharp enough for a country.",
            ar: "ينجو المؤشر في كل عيادة وكل مسح صحي وطني لسببٍ غير براق: فعلى مقياس المجتمعات لا يجمع شيءٌ أرخص إشارةً أكثر. فميزان ومقياس طول في ستين ثانية ينتجان فهرساً يرتبط، عبر ملايين البشر، بعبء المرض وكلفة الرعاية والوفيات ارتباطاً كافياً لتوجيه برامج الفحص وضبط أولويات الصحة العامة ورسم خرائط انتشار السمنة التي تقود السياسات الوطنية. الفهرس الأبلط من أن يصف رياضياً واحداً حادٌّ بما يكفي لبلد كامل.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Inside individual care, modern practice uses BMI exactly as this page teaches: a first-line triage number that triggers better measurements, never a diagnosis that ends them. A reading outside the band invites the second question — waist circumference, body composition, bloodwork, family history — and the individual verdict comes from those. Knowing this division of labor keeps you using the tool correctly: track your BMI as the coarse trend it was built to be, and read the fine print with the companion measurements described above.",
            ar: "داخل الرعاية الفردية، تستخدم الممارسة الحديثة المؤشر تماماً كما تعلّمه هذه الصفحة: رقمَ فرزٍ خطٍّ أول يستدعي قياسات أفضل، لا تشخيصاً يُنهيها. فالقراءة خارج الحزام تستدعي السؤال الثاني — محيط الخصر، وتكوين الجسم، والتحاليل، والتاريخ العائلي — ويأتي الحكم الفردي من هذه. معرفة هذا التقسيم في العمل تحفظك تستخدم الأداة صحيحةً: تتبّع مؤشرك كالاتجاه الخشن الذي بُني ليكونه، واقرأ التفاصيل الدقيقة بقياسات الرفيق الموصوفة أعلاه.",
          },
        },
      ],
    },
  ],
  faqs: [
    {
      q: {
        en: "What is a good BMI for my age?",
        ar: "ما المؤشر الجيد لعمري؟",
      },
      a: {
        en: "For adults aged 20–65 the WHO bands apply uniformly — 18.5–24.9 remains the statistical healthy range regardless of whether you are 25 or 55. After roughly 65, some geriatric research associates slightly higher BMIs (up to about 27) with better survival, likely through reserves during illness; clinicians treat the target more individually there. Under 18, the adult scale does not apply at all — BMI-for-age percentiles are the correct instrument.",
        ar: "للبالغين بين 20 و65 تنطبق نطاقات المنظمة بشكل موحد — يبقى 18.5–24.9 النطاق الصحي الإحصائي سواء كنت في الخامسة والعشرين أو الخامسة والخمسين. وبعد نحو 65، تربط بعض أبحاث طب المسنين مؤشرات أعلى قليلاً (حتى نحو 27) ببقاء أفضل، غالباً عبر الاحتياطي أثناء المرض؛ فيعالج الأطباء الهدف هناك بمزيد من الفردية. ودون الثامنة عشرة لا ينطبق سلم البالغين أصلاً — منحنيات المئين حسب العمر هي الأداة الصحيحة.",
      },
    },
    {
      q: {
        en: "My BMI says overweight but I look fit — am I?",
        ar: "مؤشري يقول زيادة وزن لكن مظهري رياضي — هل أنا كذلك؟",
      },
      a: {
        en: "If you resistance-train seriously, quite possibly not. BMI cannot distinguish 85 kg of mostly muscle from 85 kg of mostly fat at the same height. The tie-breakers are waist circumference (near or above 94 cm for men, 80 cm for women suggests the weight is not all muscle), body fat percentage from the tape method, and basic bloodwork. If those are clean, treat the BMI label as a known artifact of muscularity rather than a health verdict.",
        ar: "إن كنت تتدرب بالمقاومة بجدية، فالأرجح لا. فالمؤشر لا يميز 85 كجم معظمها عضلة عن 85 كجم معظمها دهون عند الطول نفسه. والحكّات الفاصلة: محيط الخصر (قرب 94 سم للذكور أو فوقها، و80 للإناث يوحي بأن الوزن ليس كله عضلاً)، ونسبة دهون الجسم بطريقة الشريط، وتحاليل أساسية. فإن كانت نظيفة فتعامل مع وسم المؤشر كأثر معروف للعضلية لا كحكم صحي.",
      },
    },
    {
      q: {
        en: "How much weight do I need to lose to drop one BMI point?",
        ar: "كم كجم أحتاج لخفض نقطة واحدة من المؤشر؟",
      },
      a: {
        en: "One BMI point equals height-squared in kilograms: at 1.70 m that is about 2.9 kg; at 1.80 m about 3.24 kg. Notice the unfairness physics hands tall people — they must move more kilograms per point. The healthy-band math follows directly: to fall from 29 to 24.9 at 1.75 m you need to lose about (29 − 24.9) × 3.06 ≈ 12.5 kg.",
        ar: "النقطة الواحدة تعادل مربع طولك بالكيلوغرامات: عند 1.70 متر نحو 2.9 كجم؛ وعند 1.80 متر نحو 3.24 كجم. ولاحظ الظلم الذي تفرضه الفيزياء على طوال القامص — عليهم تحريك كيلوغرامات أكثر لكل نقطة. وحساب حزام الصحة يتبع مباشرة: للهبوط من 29 إلى 24.9 عند 1.75 متر تحتاج خسارة نحو (29 − 24.9) × 3.06 ≈ 12.5 كجم.",
      },
    },
    // PRIORITY-PAGES Implementation (2026-10-19, audit §A-4 + §3.3): the
    // measured pattern "users search for THEIR numeric value" — five
    // BMI-value queries in GSC run 39152491179 (e.g. "27.0 bmi" @ 72,
    // "30.9 bmi" @ 78, "43 bmi" @ 77) — all returning zero clicks at
    // positions 72-86: the page explains the bands but never answers
    // "my number means what?". This pair serves that tail with the
    // page's own documented arithmetic (one point = height-squared kg).
    {
      q: {
        en: "What does a BMI of 27 mean?",
        ar: "مؤشر 27 يعني ماذا؟",
      },
      a: {
        en: "A BMI of 27 sits inside the overweight band (25.0–29.9) — roughly one height-squared in kilograms above the healthy edge (about 3.1 kg at 1.75 m), i.e. 2–4 kg for most heights. Read it as a screening signal, not a verdict: what matters more is where the weight sits (waist circumference) and what it is made of (body fat percentage). If those companions are healthy, treat 27 as a flag to hold the trend — and watch the direction of your readings over the following weeks rather than the single number.",
        ar: "مؤشر 27 يقع داخل نطاق زيادة الوزن (25.0–29.9) — أي نحو مربع طولك بالكيلوغرامات فوق حافة النطاق الصحي (قرابة 3.1 كجم عند 1.75 متر)، أي 2–4 كجم لأغلب الأطوال. اقرأه إشارةَ فرزٍ لا حكمًا: الأهم بعد الرقم أين يجلس الوزن (محيط الخصر) وممّ يتكون (نسبة دهون الجسم). فإن كان هذان الرفيقان سليمين فاعتبر 27 رايةً تُمسك الاتجاه — وراقب اتجاه قراءاتك خلال الأسابيع التالية لا الرقم الواحد.",
      },
    },
    {
      q: {
        en: "Is BMI 24.9 to 25.0 a real boundary?",
        ar: "هل الحد بين 24.9 و25.0 حقيقي؟",
      },
      a: {
        en: "No — it is a convention, not a cliff. Risk rises smoothly with the index; the cutoffs are round numbers chosen where average population risk crossed thresholds worth flagging. A BMI of 24.7 and 25.2 describe nearly identical bodies; the bands exist for screening systems and statistics, not to be lived in fear of one decimal. Trends and companions (waist, bloodwork) matter more than which side of a line you sit.",
        ar: "لا — هو اصطلاح لا هاوية. فالخطر يصعد بسلاسة مع الفهرس؛ والعتبات أرقام مقربة اختيرت حيث عبر متوسط الخطر السكاني مستويات تستحق التنبيه. فمؤشر 24.7 و25.2 يصفان جسدين متطابقين تقريباً؛ والنطاقات موجودة لأنظمة الفحص والإحصاء، لا لتُعاش في رعب من خانة عشرية. الاتجاهات والرفيق (الخصر والتحاليل) أهم من جهة الخط التي تقف عليها.",
      },
    },
    {
      q: {
        en: "Why is my BMI different on different websites?",
        ar: "لماذا يختلف مؤشري بين مواقع مختلفة؟",
      },
      a: {
        en: "Three usual suspects: imperial-to-metric conversion rounding, category boundaries that differ by authority (some countries use 23 for Asian populations), or — most commonly — a site using a different rounding of your inputs. The formula itself is universal; enter identical units and the result is identical everywhere. What legitimately varies is the interpretation bands, not the arithmetic.",
        ar: "ثلاثة مشتبهون معتادون: تقريب تحويل الوحدات، وحدود فئات تختلف باختلاف الجهة (بعض الدول تستخدم 23 لمجتمعات آسيوية)، أو — الأشيع — موقع يقرب مدخلاتك بشكل مختلف. الصيغة نفسها كونية؛ أدخل وحدات متطابقة تحصل على النتيجة نفسها في كل مكان. ما يختلف بشكل مشروع هو نطاقات التفسير لا الحساب.",
      },
    },
    {
      q: {
        en: "Can BMI tell how much body fat I have?",
        ar: "هل يستطيع المؤشر إخباري بكمية دهوني؟",
      },
      a: {
        en: "Only on average. Regression equations mapping BMI to body fat exist but carry standard errors of several percent — at the individual level they routinely miss by wide margins for muscular and older adults. If you want a usable body fat estimate without lab equipment, the tape-measure method in this site's body fat calculator (based on neck, waist, and hip circumferences) is a meaningful upgrade over BMI for that specific question.",
        ar: "في المتوسط فقط. توجد معادلات انحدار تربط المؤشر بدهون الجسم لكنها تحمل أخطاء معيارية بنسب عدة — وعلى المستوى الفردي تخيب عادة بهوامش واسعة مع العضليين وكبار السن. إن أردت تقديراً قابلاً للاستخدام لدهون جسمك بلا معدات مخبرية، فطريقة الشريط في حاسبة دهون الجسم بهذا الموقع (المبنية على محيطات الرقبة والخصر والورك) ترقية ذات معنى فوق المؤشر لهذا السؤال تحديداً.",
      },
    },
    {
      q: {
        en: "I am underweight — should I just eat everything?",
        ar: "أنا ناقص الوزن — هل آكل كل شيء ببساطة؟",
      },
      a: {
        en: "Quantity matters, but quality and causes matter more. First rule out medical causes — thyroid overactivity, digestive absorption problems, eating disorders, chronic illness — with a physician if the underweight is new, unexplained, or accompanied by symptoms. Then gain deliberately: a 300–500 kcal surplus with resistance training directs most of the gain toward muscle; junk-food flooding gains fat, indigestion, and nothing durable. Aim for roughly 0.25–0.5 kg per week.",
        ar: "الكمية مهمة، لكن الجودة والأسباب أهم. استبعد أولاً الأسباب الطبية — فرط نشاط الدرق، ومشكلات الامتصاص الهضمي، واضطرابات الأكل، والمرض المزمن — مع طبيب إن كان النقص حديثاً أو غير مفسر أو مصحوباً بأعراض. ثم اكتسب بتعمد: فائض 300–500 سعرة مع تدريب المقاومة يوجه معظم الكسب إلى العضلة؛ وإغراق الوجبات السريعة يكسب دهوناً وعسر هضم ولا شيء يدوم. استهدف نحو 0.25–0.5 كجم أسبوعياً.",
      },
    },
    {
      q: {
        en: "How often should I check my BMI?",
        ar: "كم مرة أتحقق من مؤشري؟",
      },
      a: {
        en: "Monthly is the right rhythm for individuals — the index moves slowly, and more frequent checks just measure water. Population screening guidelines often measure annually; a motivated person actively changing weight can check monthly under consistent conditions. Log the value alongside weekly weight averages and waist every few weeks, and you have a complete home panel.",
        ar: "شهرياً هو الإيقاع الصحيح للأفراد — فالفهرس يتحرك ببطء، والفحوص الأكثر تكراراً لا تقيس سوى الماء. إرشادات فحص المجتمعات تقيس سنوياً غالباً؛ والشخص المتحمس الذي يغيّر وزنه فعلاً يمكنه الفحص شهرياً بظروف متسقة. سجّل القيمة مع متوسطات الوزن الأسبوعية والخصر كل بضعة أسابيع، فتملك لوحة منزلية كاملة.",
      },
    },
    {
      q: {
        en: "Does BMI work for children?",
        ar: "هل يصلح المؤشر للأطفال؟",
      },
      a: {
        en: "Not the adult version. A child's BMI must be interpreted against age-and-sex percentile charts — a BMI of 17 is normal for a 9-year-old girl near her growth curve but would be underweight in a 16-year-old. Pediatric overweight sits above the 85th percentile and obesity above the 95th for their age and sex. Any parental concern about a child's weight belongs with a pediatrician, not with adult-band calculators.",
        ar: "ليس النسخة الخاصة بالبالغين. فمؤشر الطفل يجب تفسيره مقابل منحنيات المئين حسب العمر والجنس — فمؤشر 17 طبيعي لفتاة تسعة أعوام قرب منحنى نموها لكنه ناقص وزن عند بنتٍ في السادسة عشرة. تقع زيادة الوزن عند الأطفال فوق المئين 85 والسمنة فوق 95 لعمرهم وجنسهم. وأي قلق والدي بشأن وزن طفل محله طبيب أطفال، لا حاسبات نطاقات البالغين.",
      },
    },
    {
      q: {
        en: "What is the fastest healthy way to move my BMI?",
        ar: "ما أسرع طريقة صحية لتحريك مؤشري؟",
      },
      a: {
        en: "There is no fast, only sustainable: a 500-kcal daily deficit (or surplus) plus resistance training plus 8,000–10,000 daily steps moves the index about half a point per month while protecting muscle — and because the habits are livable, the movement continues. \"Fast\" protocols move water for two weeks, then return it with interest. Set the first milestone at the nearest healthy-band edge, not the middle of the band.",
        ar: "لا يوجد سريع، بل مستدام فقط: عجز يومي 500 سعرة (أو فائض) مع تدريب المقاومة و8000–10000 خطوة يومياً يحرك الفهرس نحو نصف نقطة شهرياً وهو يحمي العضلة — ولأن العادات قابلة للعيش يستمر التحرك. البروتوكولات «السريعة» تحرك الماء أسبوعين ثم تعيده بفوائده. اجعل محطتك الأولى حافة حزام الصحة الأقرب، لا منتصف الحزام.",
      },
    },
    {
      q: {
        en: "I lost 5 kg but my BMI barely moved — is something wrong?",
        ar: "خسرت 5 كجم لكن مؤشري بالكاد تحرك — هل ثمة خطب ما؟",
      },
      a: {
        en: "Nothing is wrong — the arithmetic is just height-weighted. One BMI point costs height-squared in kilograms (about 3.1 kg at 1.75 m), so five kilograms move the index roughly 1.6 points: from 29.3 to 27.7, for example. Two honest re-readings: that 1.6-point move crosses most of the risk gradient between \"overweight\" and the healthy band's edge, so it matters more than it looks; and the scale's first weeks often contain water alongside fat, while later kilograms are structurally more meaningful even when the number moves slower.",
        ar: "لا خطب — الحسبة مثقلة بالطول فحسب. فالنقطة الواحدة تكلف مربع الطول كيلوغرامات (نحو 3.1 كجم عند 1.75 متر)، فخمسة كيلوغرامات تحرك الفهرس قرابة 1.6 نقطة: من 29.3 إلى 27.7 مثلاً. وقراءتان صادقتان: تلك الحركة بـ1.6 نقطة تعبر معظم انحدار الخطر بين «زيادة الوزن» وحافة حزام الصحة، فأهميتها أكبر من مظهرها؛ وأسابيع الميزان الأولى تحمل غالباً ماءً إلى جانب الدهون، بينما الكيلوغرامات اللاحقة أكثر بنيةً ومعنى حتى حين يتحرك الرقم أبطأ.",
      },
    },
    {
      q: {
        en: "Does BMI account for frame size or \"big bones\"?",
        ar: "هل يحتسب المؤشر حجم الهيكل أو «العظام الكبيرة»؟",
      },
      a: {
        en: "It does not, and the effect is smaller than folklore suggests. Skeleton mass varies between roughly 6% and 9% of body weight across small and large frames — a spread worth about 2–3 kg at the same height, which shifts BMI by under one point. Genuine wide-frame people exist; they are rarer than the number of people who explain their BMI with the phrase. The honest frame-size adjustments are the wrist-ratio charts anthropologists use, and they mostly confirm the main tool: if you truly carry a large frame, your waist and body fat readings, not your BMI alone, should be the ones defending you.",
        ar: "لا يحتسبه، والأثر أصغر مما توحي الحكايات. فكتلة الهيكل تتفاوت بين نحو 6% و9% من وزن الجسم عبر الهياكل الصغيرة والكبيرة — انتشار يعادل نحو 2–3 كجم عند الطول نفسه، وهو يزحزح المؤشر أقل من نقطة. يوجد فعلاً واسعو الهيكل؛ لكنهم أندر من عدد من يفسرون مؤشرهم بالعبارة. وتعديلات حجم الهيكل الصادقة هي مخططات نسبة المعصم التي يستخدمها علماء الأنثروبولوجيا، وهي غالباً تؤكد الأداة الرئيسة: إن كنت تحمل هيكلاً كبيراً حقاً فقراءات خصرك ودهونك، لا مؤشرك وحده، هي التي ينبغي أن تدافع عنك.",
      },
    },
    {
      q: {
        en: "Is BMI interpreted differently for women and men?",
        ar: "هل يُفسَّر المؤشر تفسيراً مختلفاً للنساء والرجال؟",
      },
      a: {
        en: "The bands are identical for both sexes — 18.5–24.9 is the healthy band for everyone — but the bodies behind the same number differ: at an identical BMI, women on average carry a higher body fat percentage and a more subcutaneous (hip-thigh) distribution, while men carry more visceral (abdominal) fat, which is the riskier depot. That is why the waist thresholds differ by sex (94/102 cm for men, 80/88 cm for women) even though the BMI bands do not. Use the same scale, read it with the sex-specific waist companion.",
        ar: "الأحزمة متطابقة للجنسين — 18.5–24.9 حزام الصحة للجميع — لكن الأجساد خلف الرقم نفسه تختلف: فبنفس المؤشر تحمل النساء في المتوسط نسبة دهون أعلى وتوزيعاً أكثر تحت الجلد (الورك والفخذ)، بينما يحمل الرجال دهوناً حشوية (بطنية) أكثر وهي المستودع الأخطر. لهذا تختلف عتبات الخصر بين الجنسين (94/102 سم للذكور، و80/88 للإناث) مع أن أحزمة المؤشر لا تختلف. استعمل السلم نفسه، واقرأه برفيق الخصر المختص بالجنس.",
      },
    },
  ],
};

