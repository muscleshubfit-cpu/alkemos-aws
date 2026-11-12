import type { ToolReference } from "./tool-reference";

/**
 * Body Fat Calculator reference — Phase SEO-GEO-6.5 (§12.19 P1-6).
 * The calculator implements the US Navy circumference method:
 * men  495 / (1.0324 − 0.19077·log10(waist−neck) + 0.15456·log10(height)) − 450
 * women 495 / (1.29579 − 0.35004·log10(waist+hip−neck) + 0.22100·log10(height)) − 450
 * Canaries pin the 495 constant and the Navy name in this copy.
 */

export const BODY_FAT_CALCULATOR_CONTENT: ToolReference = {
  slug: "body-fat-calculator",
  intro: {
    en: "Body fat percentage answers the question BMI cannot: what your weight is actually made of. Two people at the same height and weight can carry 12% and 32% body fat — with completely different health profiles, athletic capacity, and appearance. This calculator estimates your body fat with the US Navy circumference method — a tape-measure formula developed by the US Naval Health Research Center and still used by militaries and gyms worldwide, requiring nothing more than height, neck, waist, and (for women) hip measurements. Below the tool is the full reference: the exact formulas and how they work, a measurement protocol that removes most of the error, category tables for men and women, honest accuracy comparisons against DEXA and skinfolds, and how to use the number to set real targets.",
    ar: "تجيب نسبة دهون الجسم عن السؤال الذي يعجز عنه مؤشر كتلة الجسم: مما يتكون وزنك فعلًا. فشخصان بالطول والوزن نفسيهما قد يحملان 12% و32% دهون — بملفّي صحة مختلفتين تمامًا، وقدرة رياضية ومظهر مختلفين. تقدّر هذه الحاسبة دهون جسمك بطريقة محيطات البحرية الأمريكية — صيغة شريط قياس طوّرها مركز البحرية الأمريكي لأبحاث الصحة وما تزال تستخدمها الجيوش والصالات حول العالم، ولا تحتاج أكثر من الطول والرقبة والخصر (والورك للإناث). وتحت الأداة المرجع الكامل: الصيغتان الدقيقتان وكيف تعملان، وبروتوكول قياس يمحو معظم الخطأ، وجدولا الفئات للذكور والإناث، ومقارنات دقة صادقة مقابل مسح DEXA وطريقة ثنيات الجلد، وكيف تستخدم الرقم لوضع أهداف حقيقية.",
  },
  sections: [
    {
      id: "what-is-body-fat",
      heading: {
        en: "Essential fat, storage fat, and why the percentage matters",
        ar: "الدهون الأساسية والتخزينية ولماذا تهم النسبة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "Your body fat divides into two pools. Essential fat — roughly 3% of body mass in men and 9–12% in women, concentrated in bone marrow, organs, and the reproductive system — is structurally necessary for life; dropping to or below it is dangerous, and women's higher essential fat is physiology, not a flaw. Storage fat, the subcutaneous layer under the skin and the visceral fat around internal organs, is the energy reserve the body expands and contracts. Total percentage is simply the combined weight of both pools relative to body weight.",
            ar: "تنقسم دهون جسمك إلى مجموعتين. الدهون الأساسية — نحو 3% من كتلة الجسم عند الذكور و9–12% عند الإناث، مركزة في نخاع العظم والأعضاء والجهاز التناسلي — ضرورية بنيويًا للحياة؛ والنزول إليها أو دونها خطر، وارتفاع دهون الإناث الأساسية فسيولوجيًا لا عيب. والدهون التخزينية، الطبقة تحت الجلد والدهون الحشوية حول الأعضاء الداخلية، هي احتياطي الطاقة الذي يتوسع الجسم فيه ويتقلص. والنسبة الكلية ببساطة وزن المجموعتين معًا منسوبًا إلى وزن الجسم.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The percentage matters because it is the honest denominator of body composition. A 90 kg man at 15% fat carries about 76.5 kg of lean mass — bone, muscle, water, organs — while at 30% fat the same 90 kg carries only 63 kg of lean mass: two different bodies hiding behind one scale reading. For anyone training, the number also separates the two halves of progress: losing fat while keeping (or building) muscle is \"recomposition\" — the scale may be flat for weeks while the body visibly changes. No bathroom scale can tell that story; a fat percentage trend can.",
            ar: "تهم النسبة لأنها المقام الصادق لتكوين الجسم. فرجل بوزن 90 كجم عند 15% دهون يحمل نحو 76.5 كجم كتلة عضلية — عظم وعضل وماء وأعضاء — بينما عند 30% يحمل الـ90 كجم نفسها 63 كجم فقط: جسدان مختلفان يختبئان خلف قراءة ميزان واحدة. ولكل متدرب، يفصل الرقم نصفي التقدم: خسارة الدهون مع حفظ العضلة (أو بنائها) هي «إعادة التكوين» — قد يثبت الميزان أسابيع بينما يتغير الجسم ظاهريًا. لا ميزان منزلي يحكي هذه القصة؛ أما اتجاه نسبة الدهون فيحكيها.",
          },
        },
      ],
    },
    {
      id: "navy-formula",
      heading: {
        en: "The US Navy method — the exact formulas",
        ar: "طريقة البحرية الأمريكية — الصيغتان الدقيقتان",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The method was published in 1984 by Hodgdon and Beckett of the US Naval Health Research Center, derived from measurements of thousands of naval personnel, and it estimates body fat from the relationship between circumference-derived body density and fat fraction. The equations this calculator implements, with all measurements in the same unit (centimeters or inches consistently):",
            ar: "نُشرت الطريقة عام 1984 عن Hodgdon و Beckett من مركز البحرية الأمريكي لأبحاث الصحة، واشتُقت من قياسات آلاف من أفراد البحرية، وتقدّر دهون الجسم من العلاقة بين كثافة الجسم المستنتجة من المحيطات وكسر الدهون. والمعادلتان اللتان تنفذهما هذه الحاسبة، بكل القياسات بالوحدة نفسها (سنتيمترات أو إنشات باتساق):",
          },
        },
        {
          kind: "list",
          ordered: true,
          items: [
            {
              en: "Men: 495 / (1.0324 − 0.19077 × log10(waist − neck) + 0.15456 × log10(height)) − 450",
              ar: "للذكور: 495 ÷ (1.0324 − 0.19077 × لوغاريتم(الخصر − الرقبة) + 0.15456 × لوغاريتم(الطول)) − 450",
            },
            {
              en: "Women: 495 / (1.29579 − 0.35004 × log10(waist + hip − neck) + 0.22100 × log10(height)) − 450",
              ar: "للإناث: 495 ÷ (1.29579 − 0.35004 × لوغاريتم(الخصر + الورك − الرقبة) + 0.22100 × لوغاريتم(الطول)) − 450",
            },
          ],
        },
        {
          kind: "p",
          text: {
            en: "Read the anatomy of the formula: waist and hip enter positively (fatter sites shrink the denominator's intercept and raise the result), neck enters negatively (a thicker neck relative to the torso indicates more lean mass in the frame, lowering the estimate), and height normalizes the scale. For men, the input is waist minus neck — which is why the calculator warns that the waist must measure larger than the neck; for women, the hip term joins because female fat distributes more to the hip and thigh. Two people with identical waist and neck but different heights get different percentages because the same absolute fat sits on differently sized frames.",
            ar: "اقرأ تشريح الصيغة: الخصر والورك يدخلان إيجابيًا (المواقع الأدسم تصغّر مُعترض المقام وترفع النتيجة)، والرقبة تدخل سلبيًا (رقبة أسمك نسبةً إلى الجذع تدل على كتلة عضلية أكبر في الهيكل فتخفض التقدير)، والطول يوحّد السلم. للذكور المدخل هو الخصر ناقص الرقبة — ولهذا تحذّر الحاسبة أن الخصر يجب أن يكون أكبر من الرقبة؛ وللإناث تنضم حصة الورك لأن دهون الأنثى تتوزع أكثر نحو الورك والفخذ. وشخصان بالخصر والرقبة نفسيهما لكن بطولين مختلفين يحصلان على نسبتين مختلفتين لأن الدهون المطلقة نفسها تجلس على هيكلين مختلفين.",
          },
        },
      ],
    },
    {
      id: "measurement-protocol",
      heading: {
        en: "The measurement protocol that removes most of the error",
        ar: "بروتوكول القياس الذي يمحو معظم الخطأ",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The Navy formula is only as good as the tape work that feeds it — almost all of the method's real-world error is measurement error, not formula error. Use a flexible, non-stretch tape (a fiberglass sewing tape beats a metal one; a MyoTape-style tape that holds tension is best). Measure in the morning before food, at normal body temperature — cold skin compresses differently. The tape sits flat on the skin, snug without compressing, perpendicular to the body's long axis.",
            ar: "لا تكون صيغة البحرية أفضل من عمل الشريط الذي يغذيها — فكل خطأ الطريقة الواقعي تقريبًا خطأ قياس لا خطأ صيغة. استخدم شريطًا مرنًا غير قابل للتمدد (شريط خياطة من الألياف يتفوق على المعدني؛ وشريط بنمط MyoTape الذي يحفظ الشد أفضل ما يكون). قس صباحًا قبل الطعام، بحرارة جسم طبيعية — فالجلد البارد ينضغط بشكل مختلف. يجلس الشريط مستويًا على الجلد، ملاصقًا بلا ضغط، عموديًا على المحور الطويل للجسم.",
          },
        },
        {
          kind: "list",
          items: [
            {
              en: "Neck: just below the larynx (Adam's apple), tape sloping slightly downward toward the front; shoulders relaxed, looking straight ahead.",
              ar: "الرقبة: أسفل الحنجرة مباشرة، والشريط مائلًا قليلًا نحو الأسفل في الأمام؛ الكتفان مسترخيان والنظر إلى الأمام مستقيمًا.",
            },
            {
              en: "Waist (men and women): at the navel, relaxed at the end of a normal exhale — do not pull the stomach in and do not hold your breath.",
              ar: "الخصر (للذكور والإناث): عند السرة، مسترخيًا في نهاية زفير طبيعي — لا تسحب البطن ولا تحبس نفسك.",
            },
            {
              en: "Hip (women): around the largest circumference of the glutes, feet together, weight evenly distributed.",
              ar: "الورك (للإناث): حول أوسع محيط للأليتين، القدمان ملتصقتان والوزن موزع بالتساوي.",
            },
            {
              en: "Take each measurement two to three times and average; if two readings differ by more than half a centimeter, measure again.",
              ar: "خذ كل قياس مرتين إلى ثلاثًا وتوسط؛ إن اختلف قراءان بأكثر من نصف سنتيمتر فأعد القياس.",
            },
          ],
        },
        {
          kind: "p",
          text: {
            en: "Consistency beats precision: measuring at slightly the \"wrong\" spot but always the same spot produces a meaningful trend, while chasing the perfect spot with wandering tape placement produces noise. Log the three circumferences themselves, not only the final percentage — waist trend alone is valuable health data (the visceral fat section of the BMI reference explains why), and re-measuring from logged numbers is instant.",
            ar: "الاتساق يتفوق على الدقة: القياس عند بقعة «خاطئة» قليلًا لكن دائمًا نفس البقعة ينتج اتجاهًا ذا معنى، بينما مطاردة البقعة المثالية بشريط متجول تنتج ضجيجًا. سجّل المحيطات الثلاثة نفسها لا النسبة النهائية فقط — فاتجاه الخصر وحده بيانات صحية قيمة (قسم الدهون الحشوية في مرجع مؤشر كتلة الجسم يفسر لماذا)، وإعادة القياس من الأرقام المسجلة فورية.",
          },
        },
      ],
    },
    {
      id: "categories",
      heading: {
        en: "Body fat categories for men and women",
        ar: "فئات دهون الجسم للذكور والإناث",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The standard classification (from the American Council on Exercise's widely used scale) differs by sex because essential fat itself differs. The ranges below describe general adult populations; athletes in season run lower, and the numbers are descriptive bands, not lines of health doom.",
            ar: "التصنيف القياسي (عن سلم المجلس الأمريكي للتمرين واسع الاستخدام) يختلف بين الجنسين لأن الدهون الأساسية نفسها تختلف. النطاقات أدناه تصف مجتمعات البالغين عمومًا؛ والرياضيون في الموسم يجرون أخفض؛ والأرقام أحزمة وصفية لا خطوط هلاك صحي.",
          },
        },
        {
          kind: "table",
          table: {
            caption: {
              en: "Body fat percentage categories (ACE scale)",
              ar: "فئات نسبة دهون الجسم (سلم المجلس الأمريكي للتمرين)",
            },
            columns: [
              { en: "Category", ar: "الفئة" },
              { en: "Men", ar: "الذكور" },
              { en: "Women", ar: "الإناث" },
            ],
            rows: [
              { en: ["Essential fat", "2–5%", "10–13%"], ar: ["دهون أساسية", "2–5%", "10–13%"] },
              { en: ["Athletes", "6–13%", "14–20%"], ar: ["رياضيون", "6–13%", "14–20%"] },
              { en: ["Fitness", "14–17%", "21–24%"], ar: ["لياقة", "14–17%", "21–24%"] },
              { en: ["Average", "18–24%", "25–31%"], ar: ["متوسط", "18–24%", "25–31%"] },
              { en: ["Above average", "25%+", "32%+"], ar: ["فوق المتوسط", "25% فأكثر", "32% فأكثر"] },
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "Notice again the female scale runs higher across every band — that is essential fat and reproductive physiology, not looser standards. A healthy athletic woman at 22% and a healthy athletic man at 12% are equally lean relative to their biology; comparing raw numbers across sexes is meaningless.",
            ar: "لاحظ مجددًا أن سلم الإناث يجري أعلى عبر كل حزام — تلك هي الدهون الأساسية وفسيولوجيا التناسل، لا معايير أرخى. فامرأة رياضية صحية عند 22% ورجل رياضي صحي عند 12% متساويان نحافةً نسبةً إلى بيولوجيتهما؛ ومقارنة الأرقام الخام بين الجنسين بلا معنى.",
          },
        },
      ],
    },
    {
      id: "accuracy",
      heading: {
        en: "How accurate is the tape method, honestly?",
        ar: "ما دقة طريقة الشريط بصدق؟",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The reference laboratory methods: DEXA (a low-dose X-ray scan) carries roughly ±1–2% error; hydrostatic weighing (underwater density) is similar in skilled hands; air-displacement plethysmography (Bod Pod) sits near ±2–3%. The Navy tape method, applied with the protocol above, typically lands within about 3–4 percentage points of DEXA for most people — with two known biases: it overestimates fat in very lean, thick-necked men, and it can misread people whose fat distribution is atypical for their sex (for example, men who store fat on the hips, women who store it on the abdomen).",
            ar: "الطرق المخبرية المرجعية: مسح DEXA (أشعة سينية منخفضة الجرعة) يحمل خطأ يقارب ±1–2%؛ والوزن المائي (كثافة تحت الماء) مماثل بأيدٍ ماهرة؛ وقياس إزاحة الهواء (كبسولة Bod Pod) قرب ±2–3%. وطريقة شريط البحرية، مطبقةً ببروتوكول أعلاه، تهبط عادةً في حدود 3–4 نقاط مئوية من DEXA عند معظم الناس — بانحيازين معروفين: تبالغ في تقدير دهون الرجال النحفين غليظي الرقبة جدًا، وقد تسيء قراءة من توزيع دهونهم لا نمطي بالنسبة لجنسهم (رجال يخزنون على الورك مثلًا، ونساء على البطن).",
          },
        },
        {
          kind: "p",
          text: {
            en: "Bioelectrical impedance analysis (BIA) — the hand-held and scale devices in homes and gyms — deserves its own honesty: its raw error is comparable to the tape's, but it swings additionally with hydration status, glycogen, food, and recent exercise, so day-to-day readings wobble for reasons that have nothing to do with fat. Whichever method you choose, choose one and stay with it: the trend of a consistent method beats the absolute value of a hopping one. A tape measurement repeated under the same conditions every two to four weeks is, for most people, the best cost-accuracy-habit trade in existence.",
            ar: "ويستحق تحليل المعاوقة الكهربائية الحيوية (BIA) — الأجهزة اليدوية وموازين المنازل والصالات — صدقها الخاص: خطؤها الخام مماثل لخطأ الشريط، لكنها تتأرجح إضافةً إلى ذلك بحالة الإماهة والجليكوجين والطعام والتمرين الأخير، فتتذبذب القراءات يومًا بيوم لأسباب لا علاقة لها بالدهون أصلًا. أيّ طريقة اخترتها، اختر واحدة والتزم بها: اتجاهُ طريقة ثابتة يتفوق على القيمة المطلقة لطريقة قافزة. وقياسُ شريط يُكرر بالظروف نفسها كل أسبوعين إلى أربعة هو، لمعظم الناس، أفضل مقايضة كلفة-دقة-عادة موجودة.",
          },
        },
      ],
    },
    {
      id: "targets-and-lean-mass",
      heading: {
        en: "Setting targets: fat mass, lean mass, and the math between them",
        ar: "وضع الأهداف: كتلة الدهون والكتلة العضلية والرياضيات بينهما",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The percentage becomes powerful when you convert it to kilograms and set targets in absolute terms. Fat mass = weight × percentage; lean mass = weight × (1 − percentage). A 90 kg man at 25% fat carries 22.5 kg fat and 67.5 kg lean. If he wants to reach 15% while keeping every gram of muscle, the arithmetic says: 67.5 ÷ (1 − 0.15) = 79.4 kg target weight — meaning a 10.6 kg fat loss, not a 12 kg scale loss. This is how physique goals become precise briefs: decide the target percentage, hold lean mass constant in the equation, and the required scale weight falls out of the division.",
            ar: "تصبح النسبة قوية حين تحوّلها إلى كيلوغرامات وتضع الأهداف بمصطلحات مطلقة. كتلة الدهون = الوزن × النسبة؛ والكتلة العضلية = الوزن × (1 − النسبة). فرجل بوزن 90 كجم عند 25% يحمل 22.5 كجم دهونًا و67.5 كجم كتلة عضلية. إن أراد بلوغ 15% محافظًا على كل غرام عضلة فتقول الحسبة: 67.5 ÷ (1 − 0.15) = 79.4 كجم وزن الهدف — أي خسارة 10.6 كجم دهون، لا خسارة 12 كجم على الميزان. هكذا تصبح أهداف القوام موجزًا دقيقًا: قرر النسبة المستهدفة، ثبِّت الكتلة الخالية من الدهون في المعادلة، فيسقط الوزن المطلوب على الميزان من القسمة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Realistic rates keep the plan honest: an average trainee can lose about 0.5–1% of body weight in fat per week while training and keeping protein high; ambitious recomposition (losing fat while gaining muscle simultaneously) moves both numbers slowly and works best for beginners, returning trainees, and higher body-fat starts. Muscle gain in a surplus runs roughly 0.25–1 kg per month depending on training age. A 12-week block with a 0.5%/week fat loss will visibly move a category band — patience calibrated with arithmetic, not hope.",
            ar: "الوتائر الواقعية تحفظ صدق الخطة: يمكن لمتدرب متوسط خسارة نحو 0.5–1% من وزن الجسم دهونًا أسبوعيًا مع التدريب وبروتين مرتفع؛ وإعادة التكوين الطموحة (خسارة دهون وبناء عضل معًا) تحرك الرقمين ببطء وتعمل أفضل للمبتدئين والعودين ومن ينطلقون من دهون أعلى. وبناء العضل في الفائض يجري نحو 0.25–1 كجم شهريًا بحسب العمر التدريبي. فترة 12 أسبوعًا بخسارة 0.5% أسبوعيًا ستحرك حزام فئة بشكل مرئي — صبرٌ معاير بالحساب لا بالأمل.",
          },
        },
        {
          kind: "p",
          text: {
            en: "One number deserves protection above all: lean mass. Losing weight without resistance training and adequate protein strips a meaningful fraction of every kilogram from muscle — the metabolic engine, the frame, and the thing that makes the final physique look athletic rather than merely small. The site's calorie and macro calculators set the energy and protein scaffolding for exactly this protection.",
            ar: "رقم واحد يستحق الحماية فوق كل شيء: الكتلة العضلية. فخسارة الوزن بلا تدريب مقاومة وبروتين كافٍ تسلخ كسرًا ذا معنى من كل كيلوغرام من العضلة — المحرك الأيضي، والهيكل، وما يجعل القوام النهائي يبدو رياضيًا لا صغيرًا فحسب. وحاسبتا السعرات والماكروز في الموقع تنصبان سقالة الطاقة وسقالة البروتين لهذه الحماية بالضبط.",
          },
        },
      ],
    },
    {
      id: "using-your-percentage",
      heading: {
        en: "Using your percentage: setting the target and steering the cut",
        ar: "ماذا تفعل برقمك؟ ضبط الهدف وقيادة مرحلة الخسارة",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "«ما نسبة الدهون المستهدفة؟» — the answer comes from the categories table above, not from magazine covers. A man in the fitness band (14–17%) and a woman in hers (21–24%) are both carrying an athletic, healthy amount of fat relative to their biology; the athlete bands below are seasonal homes, not permanent addresses. Pick the band that matches your life, then translate it into behavior: the number itself changes only through the energy and protein scaffolding the site's other calculators build.",
            ar: "«ما نسبة الدهون المستهدفة؟» — الجواب من جدول الفئات أعلاه لا من أغلفة المجلات. رجل في حزام اللياقة (14–17%) وامرأة في حزامها (21–24%) يحمل كلاهما مقدارًا رياضيًا صحيًا من الدهن نسبةً إلى بيولوجيته؛ وأحزمة الرياضيين تحتها مساكن موسمية لا عناوين دائمة. اختر الحزام الذي يطابق حياتك ثم ترجمه إلى سلوك: فالرقم نفسه لا يتغير إلا عبر سقالة الطاقة والبروتين التي تبنيها حاسبات الموقع الأخرى.",
          },
        },
        {
          kind: "p",
          text: {
            en: "«بأي سرعة أنزل؟» — the honest steering number is the one this page already documents: aim to lose about 0.5–1% of body weight per week in fat while training and keeping protein high. Faster than that and the deficit starts billing muscle; slower and the season stretches past motivation's shelf life. Recomposition — the slow simultaneous trade of fat for muscle at a stable weight — suits beginners, returning trainees, and higher starting percentages, and it judges progress by the measuring tape and the mirror as much as by any tape-measure formula.",
            ar: "«بأي سرعة أنزل؟» — رقم القيادة الأمين هو الموثق في هذه الصفحة نفسها: استهدف خسارة نحو 0.5–1% من وزن الجسم دهونًا أسبوعيًا مع التدريب وبروتين مرتفع. أسرع من ذلك يبدأ العجز يحاسب العضلة؛ وأبطأ يتمدد الموسم إلى ما بعد عمر التحفيز. وإعادة التكوين — المبادلة البطيئة للدهون بالعضل عند وزن ثابت — تناسب المبتدئين والعائدين ونسب البداية الأعلى، وهي تحكم التقدم بشريط القياس والمرآة بقدر ما تحكمه بأي صيغة مقاسات.",
          },
        },
        {
          kind: "p",
          text: {
            en: "«كيف أتتبع النسبة بدقة؟» — by worshipping consistency, not frequency. Measure under the same conditions the protocol section prescribes — same morning slot, same fasting state, same tape tension — and read the four-week average, because circumference formulas are sensitive enough that a salty dinner can impersonate a week of progress. Pair the monthly reading with daily morning weights (their weekly average) and monthly photos: three independent instruments agreeing is evidence; one instrument alone is a mood.",
            ar: "«كيف أتتبع النسبة بدقة؟» — بعبادة الثبات لا التكرار. قِس تحت الشروط نفسها التي يصفها قسم البروتوكول — التوقيت الصباحي نفسه وحالة الصيام نفسها وشدّ الشريط نفسه — واقرأ متوسط أربعة أسابيع، فصيغات المحيطات حساسة بما يكفي لأن عشاءً مالحًا ينتحل أسبوعًا كاملًا من التقدم. واقرن القراءة الشهرية بأوزان صباحية يومية (بمتوسطها الأسبوعي) وصور شهرية: ثلاث أدوات مستقلة تتفق هي الدليل؛ وأداة وحدها مزاج.",
          },
        },
      ],
    },
    {
      id: "limitations",
      heading: {
        en: "Limits, cautions, and who should wait",
        ar: "الحدود والتحذيرات ومن ينبغي أن ينتظر",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "The method assumes a typical adult frame and fat pattern, so it fits least comfortably on: adolescents still growing (body composition is shifting structurally), pregnant women (the formula's inputs are meaningless during pregnancy), very muscular people at low fat (the neck term over-rewards frame size), and anyone whose swelling, injury, or medical condition distorts the circumferences. Body fat percentage is also the wrong obsession for anyone with an active eating disorder — working with a treatment team outranks any home measurement, always.",
            ar: "تفترض الطريقة هيكلًا بالغًا نمطيًا ونمط دهون نمطيًا، فلتناسبها أضيق عند: المراهقين ما زالوا ينمون (التكوين يتحول بنيويًا)، والحوامل (مدخلات الصيغة بلا معنى خلال الحمل)، وعضليي الأجسام جدًا عند دهون منخفضة (حصة الرقبة تكافئ حجم الهيكل بزيادة)، ومن يشوه تورّمُهم أو إصابتُهم أو حالتُهم الطبية المحيطاتِ. والنسبة أيضًا وسواسٌ خاطئ لمن لديه اضطراب أكل نشط — فالعمل مع فريق علاجي يتقدم على أي قياس منزلي، دائمًا.",
          },
        },
        {
          kind: "p",
          text: {
            en: "And the standard closing scope note: this is an estimation tool for fitness planning, not a medical diagnostic. The number informs training and nutrition decisions; it does not diagnose anything. Where health decisions hang on body composition — medical weight management, endocrine evaluation, pre-surgery assessment — the measurement belongs in clinical hands (DEXA or equivalent) alongside the rest of the clinical picture.",
            ar: "وملاحظة النطاق الختامية المعتادة: هذه أداة تقدير لتخطيط اللياقة لا تشخيصًا طبيًا. فالرقم يُعلم قرارات التدريب والتغذية؛ ولا يشخص شيئًا. وحيث تُعلَّق قرارات صحية على تكوين الجسم — الإدارة الطبية للوزن، وتقييم الغدد الصماء، وتقييم ما قبل الجراحة — فالقياس محله أيدٍ إكلينيكية (مسح DEXA أو ما يعادله) مع بقية الصورة الإكلينيكية.",
          },
        },
      ],
    },
    {
      id: "skinfold-crosscheck",
      heading: {
        en: "The skinfold cross-check — a second tape-based method",
        ar: "فحص ثنيات الجلد المتبادل — طريقة شريط ثانية",
      },
      blocks: [
        {
          kind: "p",
          text: {
            en: "A caliper-based alternative exists alongside the Navy formula and costs only a cheap plastic caliper: skinfold measurement. The classic three-site Jackson-Pollock protocol pinches, for men, chest (diagonal fold midway between armpit and nipple), abdomen (vertical fold 2 cm beside the navel), and thigh (vertical fold on the front mid-thigh); for women, triceps (back of the arm, midway), suprailiac (diagonal fold just above the hip bone), and thigh. Each site is pinched, read in millimeters after two seconds, released, and measured again — the protocol uses the average of two matching readings (within 1–2 mm) per site, and the three values sum into a formula that converts skinfold thickness to body density to fat percentage.",
            ar: "يوجد بديل بالكاليبر إلى جانب صيغة البحرية ولا يكلف سوى كاليبر بلاستيكي رخيص: قياس ثنيات الجلد. يقرص بروتوكول Jackson-Pollock الثلاثي الكلاسيكي، للذكور، الصدر (ثنية مائلة منتصف المسافة بين الإبط والحلمة)، والبطن (ثنية رأسية على بعد 2 سم بجانب السرة)، والفخذ (ثنية رأسية منتصف الفخذ الأمامي)؛ وللإناث ثلاثية الرؤوس (مؤخرة الذراع، منتصفًا)، والعرف الحرقفي (ثنية مائلة فوق عظم الورك مباشرة)، والفخذ. يُقرص كل موقع وتُقرأ بالمليمترات بعد ثانيتين ثم يُترك ثم يُقاس مجددًا — يستخدم البروتوكول متوسط قراءتين متطابقتين (ضمن 1–2 مم) لكل موقع، وتُجمع القيم الثلاث في صيغة تحول سماكة الثنيات إلى كثافة الجسم ثم إلى نسبة الدهون.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Where each method shines: the Navy circumference formula needs no equipment beyond a tape and suits self-measurement forever; skinfolds respond more sensitively to change at a given site (a dropping abdominal skinfold is direct local evidence of fat leaving the midsection) but demand consistent technique — pinch depth and reading timing are skills, and a beginner's first week of caliper readings is usually noise. The professional move is running both: the Navy formula as the weekly headline number, skinfolds as the monthly confirmation, and agreement between the two as the confidence signal.",
            ar: "حيث يتألق كل منهج: صيغة محيطات البحرية لا تحتاج عتادًا وراء شريط وتلائم القياس الذاتي للأبد؛ وثنيات الجلد تستجيب بحساسية أكبر للتغير في موقع بعينه (ثنية بطن هابطة دليلٌ موضعي مباشر على مغادرة الدهون لمنطقة الوسط) لكنها تتطلب تقنية متسقة — فعمق القرصة وتوقيت القراءة مهارتان، وأسبوع قراءات المبتدئ الأول بالكاليبر ضجيجٌ غالبًا. والحركة الاحترافية تشغيل الاثنين: صيغة البحرية رقمَ العنوان الأسبوعي، والثنيات التأكيدَ الشهري، واتفاقهما إشارةَ الثقة.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Whatever the instrument, the law of one-method trends stands: a number is only comparable to itself. Do not average a Monday skinfold with a Friday Navy estimate; do not switch methods mid-cut and wonder why the number jumped. Pick the measurement you can repeat under identical conditions, repeat it on a schedule, and let its slope — not its level — carry the verdict.",
            ar: "أيًّا كانت الأداة، يثبت قانون اتجاه-الطريقة-الواحدة: الرقم لا يقارن إلا بنفسه. لا توسط ثنية جلد الاثنين بتقدير بحرية الجمعة؛ ولا تبدّل الطرق في منتصف خسارة ثم تتعجب لماذا قفز الرقم. اختر القياس الذي تستطيع تكراره بظروف متطابقة، وكرره بجدول، ودع ميلَه — لا مستواه — يحمل الحكم.",
          },
        },
      ],
    },
  ],
  faqs: [
    {
      q: {
        en: "How accurate is this tape calculator compared to DEXA?",
        ar: "ما دقة هذه الحاسبة بالشريط مقارنة بمسح DEXA؟",
      },
      a: {
        en: "Applied with a careful protocol, the Navy tape method usually lands within about 3–4 percentage points of a DEXA scan for typical adults — useful for tracking, imperfect for prescribing. Its known biases: it reads high on very lean, thick-necked men, and it can misjudge atypical fat distribution. DEXA itself is not error-free (±1–2%), so treat every method as an estimate with a band, and judge progress by the trend of one consistent method.",
        ar: "مطبقةً ببروتوكول متأنٍّ، تهبط طريقة شريط البحرية عادة في حدود 3–4 نقاط مئوية من مسح DEXA عند البالغين النموذجيين — مفيدة للتعقب، ناقصة للوصف. وانحيازاها المعروفان: تقرأ أعلى عند الرجال النحفين غليظي الرقبة جدًا، وقد تخطئ تقدير توزيع الدهون اللانمطي. و DEXA نفسه ليس معصومًا (±1–2%)، فتعامل مع كل طريقة كتقدير بحزام، واحكم على التقدم باتجاه طريقة واحدة ثابتة.",
      },
    },
    {
      q: {
        en: "What body fat percentage is visible abs?",
        ar: "عند أي نسبة دهون تظهر عضلات البطن؟",
      },
      a: {
        en: "For most men, clear abdominal visibility starts around 12–15% and the \"shredded\" six-pack look near 10%; for most women, visible leanness begins around 20–23% with deep definition near 17–19% — and women below roughly 14–17% enter the range where hormonal disruption risk rises. Individual anatomy (fat distribution pattern, skin thickness) moves these marks by a few points; the numbers are center-of-band, not guarantees.",
        ar: "عند معظم الذكور يبدأ ظهور البطن الواضح نحو 12–15% ومظهر «العضلات الستة» الواضحة قرب 10%؛ وعند معظم الإناث تبدأ النحافة الظاهرة نحو 20–23% والتفصيل العميق قرب 17–19% — والإناث دون نحو 14–17% يدخلن النطاق الذي يرتفع فيه خطر الاختلال الهرموني. والتشريح الفردي (نمط توزيع الدهون، سماكة الجلد) يحرك هذه العلامات بضع نقاط؛ فالأرقام مراكز أحزمة لا ضمانات.",
      },
    },
    {
      q: {
        en: "My scale says a different body fat every day — why?",
        ar: "ميزاني يقول نسبة دهون مختلفة كل يوم — لماذا؟",
      },
      a: {
        en: "Because BIA scales estimate fat from the speed of a tiny electrical current, and that current's path depends on body water — which moves with hydration, salt, carbohydrate intake, sweat, and recent exercise. A hard training day and a rest day can read 2–3% apart on identical bodies. Measure BIA under fixed conditions (morning, fasted, post-bathroom) at most weekly, or switch to the tape method whose inputs (circumferences) move only with real change.",
        ar: "لأن موازين التحليل الكهربائي تقدّر الدهون من سرعة تيار كهربائي ضئيل، ومسار ذلك التيار يتوقف على ماء الجسم — وهو يتحرك مع الإماهة والملح والكربوهيدرات والعرق والتمرين الأخير. فيوم تدريب شاق ويوم راحة قد يقرآن فرق 2–3% على جسدين متطابقين. قس بجهاز التحليل بظروف ثابتة (صباحًا، صائمًا، بعد قضاء الحاجة) أسبوعيًا على الأكثر، أو بدّل إلى طريقة الشريط التي لا تتحرك مدخلاتها (المحيطات) إلا بتغير حقيقي.",
      },
    },
    {
      q: {
        en: "Can I target belly fat specifically?",
        ar: "هل يمكنني استهداف دهون البطن تحديدًا؟",
      },
      a: {
        en: "Not through exercise selection — spot reduction by training a body area is repeatedly unsupported by research: fat leaves the body in an order set by genetics and sex, and abdominal fat (especially visceral) is usually among the first to respond to a general deficit, which is the practical good news. What does change local appearance: posture, abdominal muscle size (training builds the underlying muscle), and for the lower-pelvis \"last spot\" fat, simply more time at a sustained deficit.",
        ar: "لا باختيار التمارين — إذ لا تدعم الأبحاث مرارًا التنحيف الموضعي بتدريب منطقة ما: فالدهون تغادر الجسم بترتيب يضبطه الجنس والوراثة، ودهون البطن (الحشوية خصوصًا) عادةً من أوائل المستجيبة لعجز عام — وهذه هي البشرى العملية. ما يغيّر المظهر المحلي فعلًا: الوقفة، وحجم عضلات البطن (التدريب يبني العضلة الكامنة)، أما «آخر بقعة» أسفل الحوض فمجرد مزيد من الوقت عند عجز مستدام.",
      },
    },
    {
      q: {
        en: "What is a healthy body fat for my age?",
        ar: "ما النسبة الصحية لعمري؟",
      },
      a: {
        en: "The adult bands shift mildly with age: a fit-range percentage for a 25-year-old man (say 12%) is exceptional at 60, where 15–19% still reads lean and healthy; for women, the same drift runs about 2–4 points higher per band. The \"fitness\" band of the categories table is a defensible lifelong target for most adults; chasing athletic-range numbers past midlife is a choice, not a requirement.",
        ar: "تنزاح أحزمة البالغين بهدوء مع العمر: فنسبة حزام اللياقة لشاب خمسة وعشرين (12% مثلًا) استثنائية عند الستين، حيث يقرأ 15–19% ما يزال نحفًا وصحة؛ وللإناث يجري الانزياح نفسه أعلى بنحو 2–4 نقاط لكل حزام. حزام «اللياقة» في جدول الفئات هدفٌ مدافَع عنه مدى الحياة لمعظم البالغين؛ ومطاردة أرقام الحزام الرياضي بعد منتصف العمر خيارٌ لا واجب.",
      },
    },
    {
      q: {
        en: "Should I bulk or cut first?",
        ar: "هل أزيد أم أخسر أولًا؟",
      },
      a: {
        en: "A workable rule by current body fat: men above roughly 20% (women above 30%) cut first — insulin sensitivity and nutrient partitioning work better leaner, and a long bulk from a high start mostly builds more cut work. Men under 12% (women under 20%) are too lean to cut productively and should build. Between those marks, let the mirror and your calendar decide: gain when you have months of consistent training ahead, cut when an event or summer sits in the calendar.",
        ar: "قاعدة قابلة للعمل بحسب الدهون الحالية: الذكور فوق نحو 20% (والإناث فوق 30%) يخسرون أولًا — فحساسية الإنسولين وتوزيع المغذيات يعملان أفضل عند نحافة أكبر، والزيادة الطويلة من بداية عالية تبني غالبًا مزيدًا من عمل الخسارة اللاحق. والذكور دون 12% (والإناث دون 20%) أنحف من أن يخسروا بجدوى فينبغي أن يبنوا. وبين العلامتين، دع المرآة وتقويمك يقرران: زِد أمامك شهور تدريب متسقة، واخسر حين يجلس حدثٌ أو صيفٌ في التقويم.",
      },
    },
    {
      q: {
        en: "How long until I see a change in the number?",
        ar: "متى أرى تغيرًا في الرقم؟",
      },
      a: {
        en: "The tape inputs move slowly by nature: waist circumference drops roughly 1–2 cm per month on a disciplined moderate deficit — sometimes the tape moves before the scale does, which is exactly the recomposition signal. Re-measure every two to four weeks under identical conditions; more often than that you are re-measuring noise. Photographs every four weeks under the same lighting add a second, more forgiving progress channel.",
        ar: "مدخلات الشريط تتحرك ببطء بطبيعتها: محيط الخصر ينزل نحو 1–2 سم شهريًا على عجز معتدل منضبط — وأحيانًا يتحرك الشريط قبل الميزان، وهذا بالضبط إشارة إعادة التكوين. أعد القياس كل أسبوعين إلى أربعة بظروف متطابقة؛ وأكثر من ذلك تعيد قياس الضجيج. والصور كل أربعة أسابيع بالإضاءة نفسها تضيف قناة تقدم ثانية أكثر تسامحًا.",
      },
    },
    {
      q: {
        en: "Why does the calculator say my waist must be bigger than my neck?",
        ar: "لماذا تقول الحاسبة إن خصري يجب أن يكون أكبر من رقبتي؟",
      },
      a: {
        en: "Because the men's formula computes the logarithm of waist minus neck, and a negative or zero input has no valid logarithm — mathematically the formula stops, and anatomically the situation (neck ≥ waist) almost never describes the adult male frame the equation was built on. If you genuinely measure a neck larger than your waist, re-measure both carefully; if the numbers stand, this method is not the right instrument for your build and a clinical measurement (DEXA/skinfolds by a trained assessor) is the better route.",
        ar: "لأن صيغة الذكور تحسب لوغاريتم الخصر ناقص الرقبة، والمدخل السالب أو الصفري لا لوغاريتم صالحًا له — رياضيًا تتوقف الصيغة، وتشريحيًا لا تصف الحالة (رقبة ≥ خصر) إطار الذكر البالغ الذي بُنيت عليه المعادلة تقريبًا أبدًا. إن قست فعلًا رقبة أكبر من خصرك فأعد قياس الاثنين بعناية؛ فإن ثبتت الأرقام فليست هذه الطريقة الأداة الصحيحة لبنيتك، والقياس الإكلينيكي (DEXA أو ثنيات جلد بمُقيِّم مدرَّب) هو الطريق الأفضل.",
      },
    },
    {
      q: {
        en: "Is visceral fat different from what this measures?",
        ar: "هل الدهون الحشوية مختلفة عما تقيسه هذه الحاسبة؟",
      },
      a: {
        en: "The tape method estimates total fat percentage, of which visceral fat is one hidden compartment. They correlate but are not identical: two men at 20% total fat can carry different visceral loads, and visceral fat is the compartment most associated with metabolic risk. The free proxies for tracking visceral change are waist circumference and waist-to-height ratio (keep waist under half your height) — both drop as visceral fat drops, no scan required.",
        ar: "تقدّر طريقة الشريط نسبة الدهون الكلية، والدهون الحشوية حجرة مخفية منها. تترابطان ولا تتطابقان: فرجلان عند 20% دهون كلية قد يحملان حشويًا مختلفًا، والحشوية هي الحجرة الأكثر اقترانًا بالخطر الأيضي. والمؤشرات البديلة لتعقب تغير الحشوية هما محيط الخصر ونسبة الخصر إلى الطول (حافظ على الخصر أقل من نصف طولك) — كلاهما يهبط مع هبوط الحشوية، بلا مسح.",
      },
    },
    {
      q: {
        en: "What is lean body mass and how do I use it?",
        ar: "ما الكتلة الخالية من الدهون وكيف أستخدمها؟",
      },
      a: {
        en: "Lean body mass is everything that is not fat — muscle, bone, water, organs — computed as weight × (1 − body fat percentage). Two main uses: first, the Katch-McArdle BMR equation (370 + 21.6 × lean mass in kg) uses it directly, giving a better resting-metabolism estimate for people who know their body fat; second, protein targets can scale to lean mass in obesity management, where prescribing per kilogram of total weight overshoots. Losing weight while lean mass holds steady is the signature of a well-run cut.",
        ar: "الكتلة الخالية من الدهون هي كل ما ليس دهونًا — عضل وعظم وماء وأعضاء — وتحسب بالوزن × (1 − نسبة دهون الجسم). استخدامان رئيسيان: أولًا، معادلة Katch-McArdle لمعدل الأيض الأساسي (370 + 21.6 × الكتلة الخالية من الدهون بالكجم) تستخدمها مباشرة فتعطي تقديرًا أفضل لأيض الراحة لمن يعرف دهونه؛ وثانيًا، يمكن قياس أهداف البروتين عليها في إدارة السمنة، حيث الوصف لكل كجم من الوزن الكلي يبالغ. وخسارة الوزن مع ثبات الكتلة الخالية من الدهون هي بصمة الخسارة المُدارة جيدًا.",
      },
    },
    {
      q: {
        en: "How low can body fat safely go?",
        ar: "إلى أي حد أدنى يمكن أن تهبط دهون الجسم بأمان؟",
      },
      a: {
        en: "The physiological floors are about 2–5% for men (essential fat) and 10–13% for women, and nobody should live there: below roughly 6% in men and 14–17% in women, hormone production, immune function, and training recovery measurably deteriorate — stages this low belong to bodybuilding peak week, not to life. Durable, healthy leanness that most people can hold year-round sits near 10–15% for men and 18–23% for women; anything below that deserves a deliberate seasonal reason and an exit plan.",
        ar: "الأرضيات الفسيولوجية نحو 2–5% للذكور (الدهون الأساسية) و10–13% للإناث، ولا ينبغي لأحد العيش هناك: فدون نحو 6% عند الذكور و14–17% عند الإناث تتدهور بشكل قابل للقياس إنتاجيةُ الهرمونات ووظيفة المناعة واستشفاء التدريب — مراحلٌ كهذه لأسبوع ذروة كمال الأجسام لا للحياة. أما النحافة الصحية الدائمة التي يقدر عليها معظم الناس عامًا كاملًا فتجلس قرب 10–15% للذكور و18–23% للإناث؛ وما دونها يستحق سببًا موسميًا متعمدًا وخطة خروج.",
      },
    },
    {
      q: {
        en: "Can a phone app or photo estimate my body fat?",
        ar: "هل يستطيع تطبيق هاتف أو صورة تقدير دهون جسمي؟",
      },
      a: {
        en: "Photo-based and app estimates carry wide error bands — typically larger than the tape method's — because they infer from silhouette and lighting variables that have nothing to do with your fat. Their legitimate use is the same as any noisy instrument: consistent conditions, long intervals, trend-only readings. If an app and the tape formula disagree by more than a few points, trust the one whose inputs you controlled, and settle the argument a single time with a clinical measurement if it ever matters.",
        ar: "تقديرات الصور والتطبيقات تحمل أحزمة خطأ واسعة — أكبر نمطيًا من طريقة الشريط — لأنها تستنتج من صورة الظل ومتغيرات الإضاءة التي لا علاقة لها بدهونك. واستخدامها المشروع كأي أداة صاخبة: ظروف متسقة، فواصل طويلة، قراءات اتجاه فقط. إن اختلف تطبيق مع صيغة الشريط بأكثر من بضع نقاط فوثق بمن تحكمتَ في مدخلاته، واحسم الجدال مرة واحدة بقياس إكلينيكي إن كانت له يومًا أهمية.",
      },
    },
    {
      q: {
        en: "Why did my estimate change when nothing changed?",
        ar: "لماذا تغير تقديري ولم يتغير شيء؟",
      },
      a: {
        en: "Because the tape moved, not the body — or the body moved in ways the scale hides. The formula's inputs are circumferences, and a centimeter of tape placement drift, a meal before measuring, or a salty dinner the night before can each move the result by a full percentage point. This is exactly why the protocol fixes morning, fasted, end-of-exhale conditions and averages duplicate reads: the method rewards ceremony because ceremony removes the noise that masquerades as change.",
        ar: "لأن الشريط تحرك، لا الجسم — أو تحرك الجسم بطرق يخفيها الميزان. فمدخلات الصيغة محيطات، وسنتيمتر من انحراف وضع الشريط، أو وجبة قبل القياس، أو عشاء مالح الليلة السابقة، كلٌّ منها يحرك النتيجة نقطةً مئوية كاملة. وهذا بالضبط لماذا يثبّت البروتوكول ظروف الصباح والصوم ونهاية الزفير ويوسط القراءات المكررة: فالطريقة تكافئ الطقوس لأن الطقوس تمحو الضجيج الذي يتنكر تغيّرًا.",
      },
    },
    {
      q: {
        en: "Does the same body fat percentage mean the same fitness?",
        ar: "هل تعني نسبة الدهون نفسها اللياقة نفسها؟",
      },
      a: {
        en: "No — percentage is composition, not capacity. Two men at 15% fat can be a marathon runner and a sedentary office worker; what differs is the lean mass underneath and the engine it drives. The percentage answers \"what is the weight made of\", and fitness answers \"what can the body do\" — related questions with different instruments. Track the percentage for composition goals, and performance markers (paces, loads, recoveries) for the engine.",
        ar: "لا — النسبة تكوينٌ لا قدرة. فرجلان عند 15% دهون يمكن أن يكونا عدّاء ماراثون وموظفًا خاملًا؛ والفارق في الكتلة العضلية تحتها والمحرك الذي تشغّله. فالنسبة تجيب «مما يتكون الوزن»، واللياقة تجيب «ماذا يستطيع الجسم» — سؤالان مرتبطان بأداتين مختلفتين. تتبّع النسبة لأهداف التكوين، ومؤشرات الأداء (الوتائر والأحمال والاستشفاء) للمحرك.",
      },
    },
    {
      q: {
        en: "Why does the women's formula include the hip measurement?",
        ar: "لماذا تتضمن صيغة الإناث قياس الورك؟",
      },
      a: {
        en: "Because the equation was fitted to the way female fat actually distributes: women on average store a larger share of fat around the hips and thighs (the gynoid pattern) alongside the waist, and the hip circumference captures that compartment which the waist alone misses. Removing the hip term would systematically misread the typical female body the formula was built to serve — it is not decoration, it is the third coordinate of the female fat map.",
        ar: "لأن المعادلة ضُبطت على طريقة توزع دهون الأنثى الفعلية: تخزّن النساء في المتوسط حصة أكبر من الدهون حول الوركين والفخذين (النمط الأنثوي) إلى جانب الخصر، ويلتقط محيط الورك تلك الحجرة التي يفوّتها الخصر وحده. فنزع حصة الورك كان سيسيء قراءة الجسم الأنثوي النموذجي الذي بُنيت الصيغة لخدمته منهجيًا — فهي ليست زينة، بل الإحداثية الثالثة لخريطة دهون الأنثى.",
      },
    },
    // SEO-GROWTH-P1 (2026-11-05, owner P1 order «الأسئلة الشائعة ذات
    // الصلة» — the numeric-value pattern proven on the BMI page
    // (PRIORITY-PAGES §A-4) extended here: two "what does MY number
    // mean" answers built from the page's own category tables and the
    // calculator's own fat-mass arithmetic.
    {
      q: {
        en: "What does 25% body fat mean?",
        ar: "ماذا تعني نسبة دهون 25%؟",
      },
      a: {
        en: "It depends on the sex the bands are read against. For a man, 25% sits at the very top of the Average band (18–24%) — the boundary where the table moves to above-average, typically a soft midsection with no visible abdominal definition. For a woman, 25% is the start of her Average band (25–31%) — a perfectly ordinary, healthy-looking composition, because female essential fat alone starts near 10–13%. The same number, two different readings: never interpret a body fat percentage without its sex-specific table, and track the direction it moves rather than the single reading.",
        ar: "يتوقف المعنى على الجنس الذي تُقرأ النطاقات مقابله. فبالنسبة للذكر، تقع 25% عند الحافة العليا لنطاق المتوسط (18–24%) — الحد الذي ينتقل عنده الجدول إلى فوق المتوسط، ويرافقه عادة وسط رخو بلا ظهور لتفصيل البطن. أما بالنسبة للأنثى فـ25% بداية نطاقها المتوسط (25–31%) — تكوين عادي تمامًا ومظهر صحي، لأن الدهون الأساسية الأنثية وحدها تبدأ قرب 10–13%. الرقم نفسه بقراءتين مختلفتين: لا تفسر نسبة دهون الجسم أبدًا بلا جدول جنسها، وتتبّع اتجاه حركتها لا القراءة الواحدة.",
      },
    },
    {
      q: {
        en: "How many kilograms of fat am I actually carrying at 25%?",
        ar: "كم كيلوغرامًا من الدهون أحمل فعليًا عند نسبة 25%؟",
      },
      a: {
        en: "Multiply: fat mass = body weight × percentage ÷ 100. At 80 kg and 25%, that is 80 × 0.25 = 20 kg of fat and 60 kg of lean mass — the same arithmetic this calculator shows beside your result. The gram-level view is what makes percentage goals actionable: dropping from 25% to 20% at 80 kg is not \u201closing 5% of anything\u201d — keeping lean mass steady means reaching about 76.2 kg, i.e. losing roughly 3.8 kg of actual fat while the percentage does the rest of the arithmetic. Weigh the number in kilograms before setting any target.",
        ar: "اضرب: كتلة الدهون = وزن الجسم × النسبة ÷ 100. فعند 80 كيلوغرامًا و25%، تكون 80 × 0.25 = 20 كيلوغرامًا من الدهون و60 كيلوغرامًا من الكتلة العضلية — الحساب نفسه الذي تعرضه هذه الحاسبة بجوار نتيجتك. والمنظور بالكيلوغرامات هو ما يجعل أهداف النسبة قابلة للتنفيذ: الهبوط من 25% إلى 20% عند وزن 80 ليس «خسارة 5% من أي شيء» — فثبات الكتلة العضلية يعني الوصول إلى نحو 76.2 كجم، أي خسارة قرابة 3.8 كجم من الدهون الفعلية بينما تُكمل النسبة بقية الحساب. زِن الرقم بالكيلوغرامات قبل وضع أي هدف.",
      },
    },
  ],
};

