# التدقيق التحريري الشامل لمدونة Alkemos — EDITORIAL QUALITY AUDIT 2026-11-03

> **الأمر:** جلسة المراجعة التحريرية الشاملة بأمر المالك (الموثقة بSTATE.md «بانتظار موافقة المالك»): مراجعة اللغة العربية والمحتوى العلمي والجودة التحريرية لكل مقالات المعالجة قبل الاعتماد النهائي.
> **القاعدة الحاكمة:** هذه جلسة **تقييم فقط** — لم تُعدّل أي مقالة، ولم تُغيَّر أي حالة نشر أو review_status، ولم تُفتح دفعات علاج جديدة، ولم يُمس أي محتوى منشور. المخرج هو هذا التقرير + توثيق الجلسة.
> **جلسة مستقلة:** التدقيق أُجري بقراءة حرفية كاملة لنص كل مقالة (ترويسة + FAQ + BODY + جداول)، لا بعدّ كلمات ولا بأدوات آلية. **لم تُصدر أي مقالة حكمًا دون قراءتها فعلًا.**

---

## 1. الخلاصة التنفيذية

قرأنا **135/135 مقالة** منشورة (63 إنجليزية + 72 عربية) عبر 16 دفعة مراجعة (9 دفعات أزواج + 7 دفعات مفردة)، ووثقنا **452 ملاحظة تحريرية** بقصاصات حرفية من نصوص المقالات نفسها (قانون الأدلة)، مع **39 ملاحظة** عُلّمت `needs_verification` (تتطلب فحصًا حيًا لا يتاح في جلسة قراءة). كما تحققنا مباشرة من ثلاثة ادعاءات استشهادية حرجة عبر PubMed أثناء التدقيق (انظر §4.2).

**التوزيع النهائي:**

| التصنيف | العدد | النسبة | المعنى |
|---|---|---|---|
| سليم (sound) | 72 | 53.3% | يعتمد بجودته الحالية (عيوبه موثقة لكنها لا تمنع الاعتماد) |
| علمي/توثيق (science) | 31 | 23.0% | يحتاج تصحيحًا علميًا أو استشهاديًا قبل الاعتماد الكامل |
| لغة (language) | 15.6% → 21 | 15.6% | المحتوى العلمي سليم واللغة تحتاج جولة تحرير |
| إعادة كتابة (rewrite) | 11 | 8.1% | مشكلات متراكبة تستوجب إعادة كتابة تحريرية |

**الأولويات (للمقالات الـ63 غير السليمة):** عالية 21 · متوسطة 36 · منخفضة 6 · **حرجة 0** (لا توجد نصيحة قد تضر القارئ فعليًا — أخطر ما وجدناه خلل ثقة لا خطر جسدي).

**بالبصمة اللغوية:** الدين اللغوي يتركز في العربية (20 تصنيف لغة عربي مقابل 1 إنجليزي)، بينما دين المزارع التسويقية/إعادة الكتابة يتركز في الإنجليزية (7 من 11 إعادة كتابة). مقالات الموجة الأحدث (أكتوبر وما بعد 20 سبتمبر) في اللغتين أعلى جودة بوضوح من دفعة أواخر أغسطس/أوائل سبتمبر.

---

## 2. المنهجية

1. **البنية:** قُسمت المدونة إلى 16 دفعة: RP-01→RP-09 (36 زوجًا ثنائي اللغة = 72 مقالة تُقيَّم بالمعايير الستة بما فيها التكافؤ اللغوي) وRS-01→RS-07 (63 مقالة مفردة). ملفات التقييم الخام بـ`/home/z/my-project/audit/reviews/*.json` (داخل جلسة التدقيق) تحمل كل ملاحظة بقصاصة حرفية + إصلاح مقترح + علم `needs_verification` حيث يلزم.
2. **معايير التقييم الستة:** الجودة اللغوية (فصحى سليمة/إنجليزية طبيعية بلا بقايا مولّد) · الدقة العلمية (مقيسة بالإجماع الراسخ: بروتين 1.6–2.2 غ/كغ، كرياتين 3–5 غ وتحميل اختياري، تكرار العضلة مرتين، نوم 7–9 ساعات، عجز آمن 0.5–1% أسبوعيًا...) · القيمة للقارئ (إجابة سؤال العنوان) · المصادر · البنية والتحرير · التكافؤ بين اللغتين (للأزواج).
3. **التحقق من الاستشهادات:** كل استشهاد خارجي فُحص ضد جدول عناوين PubMed الحقيقية (المُستخلصة مسبقًا عبر E-utilities) — نص الرابط مقابل العنوان الفعلي للورقة، ثم مدى دعم الورقة للادعاء المرفق. **ثلاثة ادعاءات حرجة تحققنا منها حيًا عبر PubMed خلال الجلسة** (موثقة §4.2).
4. **التحقق الحسابي:** كل مثال رقمي في المقالات الحسابية أُعيد حسابه (معادلات BMR/TDEE، جداول الماكروز، مجموعات الوجبات، تكاليف الحصص).
5. **قانون الأدلة:** لا ملاحظة بلا اقتباس حرفي من نص المقالة، ولا تجميل ولا اختلاق.

---

## 3. التغطية (إثبات الـ135)

| الدفعة | النوع | المقالات | توزيع الأحكام (سليم/لغة/علمي/إعادة) |
|---|---|---|---|
| RP-01 → RP-09 | أزواج ×36 | 72 | مجمعة: sound/لغة/علمي/إعادة = 24/13/25/10 |
| RS-01 | مفردة (ع) | 9 | 5/0/0/3 |
| RS-02 | مفردة (ع) | 9 | 5/3/1/0 |
| RS-03 | مفردة (ع) | 9 | 6/1/2/0 |
| RS-04 | مفردة (ع) | 9 | 7/0/2/0 |
| RS-05 | مفردة (إ) | 9 | 6/0/2/1 |
| RS-06 | مفردة (إ) | 9 | 7/0/1/1 |
| RS-07 | مفردة (إ) | 9 | 5/1/1/2 |
| **الإجمالي** | | **135** | **72 / 21 / 31 / 11** |

تحقق آلي نهائي: مجموعة ملفات الدفعات الستة عشر مطابقة تمامًا لمجموعة الـ135 (لا ناقص ولا زائد).

---

## 4. أبرز النتائج

### 4.1 المقالات الإحدى عشرة المحالة لإعادة الكتابة (أولوية عالية إلا واحدة)

| المقالة | اللغة | جوهر المشكلة |
|---|---|---|
| `best-dynamic-stretching-before-gym` | ع | ~40% من المتن مزارع كلمات دخيلة (صيام/كيتو/سعرات) + جملة مبتورة «بدلاً.» + ادعاء مدى حركي مقلوب + صفر استشهادات |
| `best-protein-supplement-women-ramadan` | ع | بقايا مولد («وت disturb النوم»، «بروتين نوم ثابت») + عامية «شاك» ×5 + مزارع + صفر استشهادات |
| `calculate-calories-fat-loss` | ع | قسمان دخيلان كاملان (ساعة ذكية/بري-وورك صيف) + جملة مولدة مكسورة + عزو WHO أوسع من مصدره |
| `12-week-progressive-overload-intermediate` | إ | مزارع + بقايا مولد + استشهادات معكوسة (التفاصيل بدفعة RP-03) |
| `4-week-beginner-muscle-building-plan` | إ | مزارع FAQ وبقايا (RP-07) |
| `best-protein-timing-after-workout` | ع | مزارع شاملة (RP-07) |
| `track-macros-no-food-scale` | إ | مزارع + بقايا (RP-06) |
| `protein-after-workout-grams-guide` | إ | مزارع + بقايا (RP-06) |
| `deload-week-structure-strength-gains` | إ | **تناقض داخلي خطير**: الFAQ يوصي بخفض الشدة 40–60% بينما محور المقالة «احتفظ بالشدة» + حشو عبارات بحث خام بأحرف صغيرة في المتن + 9/10 أسئلة دخيلة + مراجع مكسورة |
| `smart-water-bottle-hydration-tracking-during-workouts` | إ | مزارع الكلمة المفتاحية الطويلة حرفيًا + عنوانان متكرران + عنوان مبتور + ادعاءات تجريبية بلا مصادر + استشهاد نصه «[1]» |
| `macro-tracking-meal-prep-1800-fat-loss` (أولوية متوسطة) | إ | 10/10 أسئلة FAQ دخيلة + صفر استشهادات رغم جرعات مكملات (جوهر الوجبات نفسه صالح) |

**النمط الزمني:** كل إعادات الكتابة تقريبًا من دفعة 27 أغسطس–5 سبتمبر 2026 أو من عنقود «الأدوات الذكية» — أي الجيل الأقدم قبل اصطياد برنامج المعالجة لها.

### 4.2 عيوب الاستشهاد المكتشفة والمتحقق منها (أخطر فئة «علمي/توثيق»)

1. **استشهاد معكوس (تحقق حي):** مقالة `compare-whey-soy-protein-athletes` تنقل عن ميتا Br J Nutr 2022 (PMID 33971994) أنها «لم تجد فروقًا جوهرية» بين الصويا ومصل اللبن — **والورقة تقول فعليًا إن المصل حسّن الكتلة الخالية معنويًا بينما الصويا لم تحقق تغيرًا معنويًا**. النقل معكوس عن نتيجة المرجع.
2. **«المورتون الخاطئ» ×2 (نمط إنتاجي مشترك):** مقالتا `calculate-daily-calories-muscle-gain-beginners-guide` (ع) و`improve-gut-health-muscle-gain-4-week-plan` (إ) تسندان لـ«Morton et al., meta-analysis» الرابط PMID 26019246 — وهي دراسة فرامنغهام الرصدية J Nutr 2015 (ليست ميتا تحليلية)، وفي الثانية الادعاء المرفق (راحة هضم البروتين) خارج موضوع الورقة تمامًا.
3. **عزو أوسع من المصدر:** «WHO: عجز 500 سعرة هو الأسلوب الأكثر أمانًا» (calculate-calories-fat-loss) و«إرشادات النشاط البدني تؤكد رفع احتياج السوائل» (water-intake-athlete-guide) — الصفحتان المرتبطتان لا تحملان هذه الصياغات (عُلّمتا needs_verification).
4. **ميتا مورتون 2018 تُستشهد لمقارنات التوقيت** التي لا تتناولها الورقة (أصلها منحنى الجرعة الكلية) في عدة مقالات — كلها بدرجة منخفضة لأن الصياغات متحفظة.
5. **نمط تكرار الاستشهادات (بنيوي، 53 ملاحظة مصادر):** الورقة الواحدة تُدرج 2–4 مرات بعناوين ربط مختلفة («ISSN position stand» + «ISSN position stand on creatine safety and efficacy») فتبدو المرجعية أوسع من حقيقتها — أسوأ حالة `red-light-therapy` بسبعة استشهادات معلنة لمرجعين فعليين فقط.

### 4.3 الدين اللغوي العربي (21 مقالة «لغة» + ملاحظات داخل مقالات سليمة)

- **بقايا مولّد آلي ظاهرة:** «وت disturb النوم» (كلمة إنجليزية داخل الجملة العربية)، «بروتين نوم ثابت» (وقت)، «جرزتك» (جرعتك)، «مخفّر»، «تدريق»، «شريط شقي»، «بالتاي»، «نبط» (نبض)، «المتحمة» (القدرة)، «اكتفلت» (اكتملت)، «لراجز» (لرافع — في مقالتين، ما يرجح خلل توليد مشترك)، «م حارقة»، «المستعيرة» (المستعجلة)، «فحصته» (حصته)، «عزة تونة»→«علوة».
- **عامية مصرية متكررة:** «شاك بروتين» ×5، «نص الكمية/فراخ/عزومة» (مقالة المطبخ المصري)، «كبير زيادة»، «ينفع»، «نزود»، «موجات العضل».
- **مصطلحات مقارنة مكسورة في أدلة شراء:** «قطرة أرضية» (وصف تمرين)، «رومانيان ستيفت».
- **تراكيب ناقصة/غامضة:** «واللون الأبيض النقي الطبيعي.» (جملة بلا خبر)، «أصلت في الأصل»، «بزوج أدلة النوم».
- **ملاحظة إيجابية:** المقالات الأحدث عربية خالية تمامًا من هذه الفئة — الالتزام ببوابة الفصحى (176) يعمل في الجيل الجديد.

### 4.4 التعارضات والتناقضات الرقمية الداخلية

- `deload-week` (إ): الFAQ يعكس توصية الشدة الأساسية (موثقة §4.1).
- `12-week-periodized` (إ): المتن يخصص الماكرو بالنسب المئوية (30% بروتين) بينما الFAQ بنفس الصفحة يستخدم الغرام/كغ — نفس «خطأ النسب الجامدة» الذي تحذر منه مقالات الموقع الأخرى.
- `fat-burning-macro-diet-plan` (ع): جدول يوم كامل يجمع ~1905 سعرة بينما الإجمالي المعلن 2250، وقيمة BMR المثال 1725 والصحيح لمعادلة ميفلين 1699.
- `calculate-maintenance-calories` (إ): قيمة TEF «رفع البروتين يرفع الإنفاق 100–150 سعرة» — الحساب يعطي 30–50 سعرة فقط (مبالغة 3–4 أضعاف) + قيمة BMR منقولة 1735 والصحيح 1728.
- `carb-loading` (ع): فقرة السعرات الإجمالية تُفكك ذاتها (2800+400+دهون ≠ «2800–3000»).
- `calculate-daily-calories-weight-loss-muscle-gain` (ع): ماكروز مثال المرأة تجمع 1655 لا 1805.
- تعارضات صغرى: فترة الديلود 4–6 مقابل 6–8 أسابيع، جرعة سيترولين 3–5 مقابل 3–6 غ.

### 4.5 نقاط القوة (يجب صونها عند أي علاج)

- **12 مقالة أنموذجية بصفر ملاحظات**، منها: `creatine-beginners-guide` (ع)، و`magnesium-forms-sleep-recovery` و`creatine-loading-strength-hypertrophy-guide` و`creatine-cycling-long-term-gains` و`optimize-preworkout-nutrition-evening-training` و`choose-smartwatch` و`choose-smart-scale` و`contrast-therapy-7day-recovery-plan` و`beef-protein-vs-whey` (إ).
- **أمانة نقل استثنائية للأدلة في الموجة الجديدة:** هولتمان 1996 منقولة بتصميمها الحرفي (31 مشاركًا، +20%، جرعة حفظ 2 غ)، ونيدلتشيفا 2010 بأرقامها (55% دهون أقل/60% عضلات أكثر)، وأنطونيو 2013 بتحفظها المنهجي (magnitude-based inference لا معنوية تقليدية)، وDrake 2013 (400 ملغ قبل النوم بـ0/3/6 ساعات)، وShcherbina 2017 (خطأ الطاقة 27–93%)، وTanaka (208−0.7×العمر بأكثر من 18,000 مشارك)، وMah & Pitre 2021 بيقينيتها المنخفضة المعلنة.
- **صدق تحريري نادر:** مقالات تعلن حدود أدلتها («أداة اتجاه لا مقياس مطلق» للميزان الذكي، «تأمين رخيص لا درع واقٍ» للإحماء، «ليس حبة نوم» للمغنيسيوم، «من يعرف حدود أدلة الحرارة» للعلاج المتباين).
- **التوطين العربي الأصيل:** مقالة المطبخ المصري (رغم ملاحظات العامية) ومقارنات البدائل الفلسطينية/المصرية وجداول التمر بجدول يوم التحميل دمج ثقافي حقيقي.

### 4.6 تكافؤ الأزواج الثلاثة والثلاثين (تقييم دفعات RP)

- التكافؤ: مكافئ 13 · تقريبي 19 · ضعيف 4 (الأزواج الأربعة الضعيفة موثقة بملفات دفعاتها).
- hreflang معلن بالاتجاهين في 30/36 زوجًا (6 أزواج فيها خلل توثيقي).
- **الروابط المتقاطعة بين طرفي الزوج: 0/36** — الأزواج تعلن hreflang لكن لا يربط طرفًا بعضهما ببعض في المتن؛ هذه أكبر فجوة بنيوية بنيوية في منظومة الأزواج وهي قرار علاج مستقبلي بسيط (لا يفتح دفعة محتوى).

---

## 5. جدول الأحكام الكامل (135 مقالة)

| # | الدفعة | اللغة | المقالة (slug) | الحكم | الأولوية | ملاحظات (العدد وأعلى شدة) |
|---|---|---|---|---|---|---|
| 1 | RP-01 | EN | `how-to-periodize-nutrition-body-recomposition` | علمي/توثيق | متوسطة | 1 (M) |
| 2 | RP-01 | AR | `nutrition-periodization-body-recomposition-guide` | علمي/توثيق | عالية | 7 (H) |
| 3 | RP-01 | EN | `quick-healthy-meal-ideas-busy-people` | سليم | — | 1 (L) |
| 4 | RP-01 | AR | `healthy-high-protein-meals-office` | لغة | متوسطة | 7 (M) |
| 5 | RP-01 | EN | `science-backed-belly-fat-loss-8-weeks` | علمي/توثيق | متوسطة | 3 (M) |
| 6 | RP-01 | AR | `belly-fat-loss-8-weeks-guide` | علمي/توثيق | عالية | 10 (M) |
| 7 | RP-01 | EN | `best-wearable-sleep-tracking-athletes-guide` | سليم | — | 1 (L) |
| 8 | RP-01 | AR | `choose-best-wearable-sleep-tracker-athletes` | سليم | — | 3 (L) |
| 9 | RP-02 | EN | `schedule-cardio-muscle-gain-guide` | علمي/توثيق | عالية | 7 (H) |
| 10 | RP-02 | AR | `cardio-scheduling-muscle-gain-guide` | سليم | — | 4 (L) |
| 11 | RP-02 | EN | `sleep-better-faster-gym-results` | سليم | — | 1 (L) |
| 12 | RP-02 | AR | `how-many-hours-sleep-for-muscle-growth` | لغة | منخفضة | 6 (L) |
| 13 | RP-02 | EN | `choose-whey-protein-muscle-gain` | لغة | متوسطة | 4 (M) |
| 14 | RP-02 | AR | `choose-whey-protein-muscle-gain-guide` | سليم | — | 6 (L) |
| 15 | RP-02 | EN | `4-day-split-hypertrophy-fat-loss` | سليم | — | 3 (L) |
| 16 | RP-02 | AR | `4-day-split-muscle-fat-loss-guide` | علمي/توثيق | متوسطة | 6 (M) |
| 17 | RP-03 | EN | `12-week-dumbbell-band-muscle-plan` | سليم | — | 3 (L) |
| 18 | RP-03 | AR | `home-muscle-building-guide-simple-weights` | لغة | متوسطة | 5 (M) |
| 19 | RP-03 | EN | `calculate-daily-calories-fuel-fat-loss-bulking` | سليم | — | 2 (M) |
| 20 | RP-03 | AR | `calculate-daily-calories-weight-loss` | لغة | متوسطة | 3 (M) |
| 21 | RP-03 | EN | `intermittent-fasting-muscle-gain-workout-plan` | سليم | — | 1 (L) |
| 22 | RP-03 | AR | `intermittent-fasting-muscle-gain-guide` | لغة | عالية | 5 (M) |
| 23 | RP-03 | EN | `12-week-progressive-overload-intermediate` | إعادة كتابة | عالية | 8 (H) |
| 24 | RP-03 | AR | `12-week-progressive-overload-intermediate-guide` | لغة | عالية | 7 (M) |
| 25 | RP-04 | EN | `deload-week-rest-training-guide` | سليم | — | 2 (L) |
| 26 | RP-04 | AR | `deload-week-guide` | لغة | متوسطة | 10 (M) |
| 27 | RP-04 | EN | `protein-myths-busted-muscle-gain` | علمي/توثيق | متوسطة | 5 (M) |
| 28 | RP-04 | AR | `protein-myths-muscle-gain-guide` | علمي/توثيق | متوسطة | 7 (M) |
| 29 | RP-04 | EN | `4-day-upper-lower-hypertrophy-split` | سليم | — | 0 |
| 30 | RP-04 | AR | `upper-lower-split-4-days-guide` | لغة | متوسطة | 5 (M) |
| 31 | RP-04 | EN | `combine-hiit-strength-fat-loss-guide` | علمي/توثيق | متوسطة | 2 (M) |
| 32 | RP-04 | AR | `hiit-strength-training-fat-loss-guide` | لغة | عالية | 8 (M) |
| 33 | RP-05 | EN | `chest-muscle-bodyweight-home-guide` | علمي/توثيق | عالية | 5 (H) |
| 34 | RP-05 | AR | `chest-muscle-bodyweight-home` | علمي/توثيق | عالية | 9 (H) |
| 35 | RP-05 | EN | `women-home-muscle-building-program-guide` | سليم | — | 2 (L) |
| 36 | RP-05 | AR | `women-bodyweight-muscle-workout` | لغة | متوسطة | 7 (M) |
| 37 | RP-05 | EN | `does-creatine-make-you-gain-weight-water-retention-vs-muscle` | علمي/توثيق | متوسطة | 6 (M) |
| 38 | RP-05 | AR | `creatine-water-retention-scientific-analysis-beginners-guide` | علمي/توثيق | متوسطة | 4 (M) |
| 39 | RP-05 | EN | `post-workout-recovery-meal-plan-7-recipes` | علمي/توثيق | متوسطة | 3 (M) |
| 40 | RP-05 | AR | `post-workout-recovery-meal-plan-guide` | علمي/توثيق | متوسطة | 5 (M) |
| 41 | RP-06 | EN | `track-macros-no-food-scale` | إعادة كتابة | عالية | 5 (H) |
| 42 | RP-06 | AR | `track-macros-without-scale-guide` | لغة | متوسطة | 6 (M) |
| 43 | RP-06 | EN | `best-protein-supplement-ramadan-guide` | سليم | — | 0 |
| 44 | RP-06 | AR | `best-protein-supplement-ramadan` | سليم | — | 1 (L) |
| 45 | RP-06 | EN | `protein-after-workout-grams-guide` | إعادة كتابة | عالية | 7 (H) |
| 46 | RP-06 | AR | `protein-grams-after-workout-guide` | سليم | — | 2 (L) |
| 47 | RP-06 | EN | `protein-per-day-muscle-build-plan` | سليم | — | 1 (L) |
| 48 | RP-06 | AR | `protein-intake-calculator-muscle-build` | سليم | — | 3 (L) |
| 49 | RP-07 | EN | `pre-workout-nutrition-guide` | سليم | — | 2 (L) |
| 50 | RP-07 | AR | `nutrition-before-workout-guide` | لغة | متوسطة | 3 (M) |
| 51 | RP-07 | EN | `best-protein-timing-after-workout-guide` | علمي/توثيق | متوسطة | 3 (M) |
| 52 | RP-07 | AR | `best-protein-timing-after-workout` | إعادة كتابة | عالية | 5 (H) |
| 53 | RP-07 | EN | `4-week-beginner-muscle-building-plan` | إعادة كتابة | عالية | 6 (H) |
| 54 | RP-07 | AR | `4-week-beginner-muscle-building-plan-guide` | سليم | — | 3 (M) |
| 55 | RP-07 | EN | `calorie-cycling-fat-loss-diet` | سليم | — | 4 (L) |
| 56 | RP-07 | AR | `calorie-cycling-fat-loss-guide` | سليم | — | 4 (M) |
| 57 | RP-08 | EN | `sauna-muscle-recovery-hormone-optimization` | سليم | — | 0 |
| 58 | RP-08 | AR | `sauna-muscle-recovery-guide` | علمي/توثيق | متوسطة | 3 (M) |
| 59 | RP-08 | EN | `home-muscle-building-no-equipment-guide` | سليم | — | 1 (L) |
| 60 | RP-08 | AR | `home-muscle-building-guide-no-equipment` | لغة | متوسطة | 3 (M) |
| 61 | RP-08 | EN | `bfr-training-checklist` | علمي/توثيق | منخفضة | 3 (L) |
| 62 | RP-08 | AR | `bfr-training-guide` | لغة | عالية | 11 (M) |
| 63 | RP-08 | EN | `build-muscle-without-supplements-guide` | علمي/توثيق | متوسطة | 3 (M) |
| 64 | RP-08 | AR | `increase-muscle-mass-no-protein-supplements` | لغة | متوسطة | 6 (M) |
| 65 | RP-09 | EN | `hiit-home-fat-burning-workout` | سليم | — | 3 (L) |
| 66 | RP-09 | AR | `hiit-home-workout-guide` | علمي/توثيق | عالية | 11 (H) |
| 67 | RP-09 | EN | `12-week-progressive-overload-home-workout` | سليم | — | 2 (L) |
| 68 | RP-09 | AR | `home-muscle-gain-8-weeks` | علمي/توثيق | عالية | 7 (H) |
| 69 | RP-09 | EN | `best-plant-based-protein-powder-muscle-gain-2026` | سليم | — | 3 (L) |
| 70 | RP-09 | AR | `best-plant-based-protein-powder-guide` | لغة | متوسطة | 5 (M) |
| 71 | RP-09 | EN | `progressive-overload-no-weight` | علمي/توثيق | متوسطة | 3 (M) |
| 72 | RP-09 | AR | `progressive-overload-without-weights-guide` | علمي/توثيق | متوسطة | 9 (M) |
| 73 | RS-01 | AR | `best-creatine-men-guide` | سليم | — | 3 (L) |
| 74 | RS-01 | AR | `best-creatine-supplement-for-women-guide` | سليم | — | 4 (L) |
| 75 | RS-01 | AR | `best-dynamic-stretching-before-gym` | إعادة كتابة | عالية | 7 (H) |
| 76 | RS-01 | AR | `best-dynamic-stretching-exercises-athletes-injury-prevention` | سليم | — | 2 (L) |
| 77 | RS-01 | AR | `best-omega-3-supplement-athletes` | سليم | — | 2 (L) |
| 78 | RS-01 | AR | `best-protein-supplement-women-ramadan` | إعادة كتابة | عالية | 7 (H) |
| 79 | RS-01 | AR | `beta-alanine-guide-selection` | سليم | — | 3 (L) |
| 80 | RS-01 | AR | `bmr-calculator-athletes` | سليم | — | 1 (L) |
| 81 | RS-01 | AR | `calculate-calories-fat-loss` | إعادة كتابة | عالية | 5 (H) |
| 82 | RS-02 | AR | `calculate-daily-calories-muscle-gain-beginners-guide` | علمي/توثيق | متوسطة | 3 (M) |
| 83 | RS-02 | AR | `calculate-daily-calories-weight-loss-muscle-gain` | سليم | — | 2 (L) |
| 84 | RS-02 | AR | `calorie-macro-guide-muscle-fat` | سليم | — | 1 (L) |
| 85 | RS-02 | AR | `carb-loading-plan-competition` | سليم | — | 3 (L) |
| 86 | RS-02 | AR | `chest-muscle-home-workout-guide` | سليم | — | 3 (L) |
| 87 | RS-02 | AR | `choose-creatine-women-guide` | لغة | منخفضة | 5 (L) |
| 88 | RS-02 | AR | `choose-vitamin-d-supplement-athletes` | سليم | — | 2 (L) |
| 89 | RS-02 | AR | `choose-weightlifting-shoes-men` | لغة | متوسطة | 4 (M) |
| 90 | RS-02 | AR | `choose-whey-protein-ramadan-women` | لغة | متوسطة | 3 (M) |
| 91 | RS-03 | AR | `cold-bath-home-wellness` | سليم | — | 3 (M) |
| 92 | RS-03 | AR | `common-fat-burning-mistakes` | سليم | — | 1 (L) |
| 93 | RS-03 | AR | `compare-whey-soy-protein-athletes` | علمي/توثيق | متوسطة | 3 (M) |
| 94 | RS-03 | AR | `creatine-beginners-guide` | سليم | — | 0 |
| 95 | RS-03 | AR | `design-diet-fat-loss-egyptian-lifestyle` | لغة | منخفضة | 1 (L) |
| 96 | RS-03 | AR | `fat-burning-macro-diet-plan` | علمي/توثيق | منخفضة | 5 (M) |
| 97 | RS-03 | AR | `how-to-calc-daily-protein-athletes` | سليم | — | 2 (L) |
| 98 | RS-03 | AR | `how-to-start-muscle-building-beginners` | سليم | — | 1 (L) |
| 99 | RS-03 | AR | `muscle-building-home-workout-guide` | سليم | — | 2 (M) |
| 100 | RS-04 | AR | `muscle-group-frequency-optimal` | سليم | — | 2 (L) |
| 101 | RS-04 | AR | `optimal-rest-periods-resistance-training` | سليم | — | 2 (L) |
| 102 | RS-04 | AR | `progressive-weight-increase` | سليم | — | 1 (L) |
| 103 | RS-04 | AR | `protein-supplements-veg-animal-comparison` | علمي/توثيق | منخفضة | 2 (L) |
| 104 | RS-04 | AR | `reduce-water-retention-muscle-building` | سليم | — | 3 (L) |
| 105 | RS-04 | AR | `sleep-muscle-growth-science` | سليم | — | 4 (L) |
| 106 | RS-04 | AR | `sleep-recovery-gym-results` | سليم | — | 2 (L) |
| 107 | RS-04 | AR | `water-intake-athlete-guide` | سليم | — | 3 (L) |
| 108 | RS-04 | AR | `weekly-fat-burning-diet-plan` | سليم | — | 1 (L) |
| 109 | RS-05 | EN | `12-week-periodized-muscle-building-plan` | علمي/توثيق | متوسطة | 6 (M) |
| 110 | RS-05 | EN | `adjust-training-volume-cut-muscle-retention` | سليم | — | 2 (L) |
| 111 | RS-05 | EN | `beef-protein-vs-whey-isolate-muscle-comparison` | سليم | — | 0 |
| 112 | RS-05 | EN | `best-time-to-take-creatine-guide` | سليم | — | 1 (L) |
| 113 | RS-05 | EN | `budget-home-gym-equipment-comparison` | سليم | — | 3 (L) |
| 114 | RS-05 | EN | `calculate-maintenance-calories-muscle-gain` | علمي/توثيق | متوسطة | 2 (M) |
| 115 | RS-05 | EN | `choose-smart-scale-body-composition` | سليم | — | 0 |
| 116 | RS-05 | EN | `choose-smartwatch-fitness-tracking` | سليم | — | 0 |
| 117 | RS-05 | EN | `contrast-therapy-7day-recovery-plan` | سليم | — | 0 |
| 118 | RS-06 | EN | `creatine-cycling-long-term-gains` | سليم | — | 0 |
| 119 | RS-06 | EN | `creatine-loading-strength-hypertrophy-guide` | سليم | — | 0 |
| 120 | RS-06 | EN | `deload-week-structure-strength-gains` | إعادة كتابة | عالية | 6 (H) |
| 121 | RS-06 | EN | `foam-roller-recovery-4-week-guide` | سليم | — | 1 (L) |
| 122 | RS-06 | EN | `heart-rate-monitor-fat-loss-guide` | سليم | — | 1 (L) |
| 123 | RS-06 | EN | `how-many-calories-to-gain-muscle-and-lose-fat` | سليم | — | 2 (L) |
| 124 | RS-06 | EN | `hrv-overtraining-7day-plan-athletes` | سليم | — | 1 (L) |
| 125 | RS-06 | EN | `improve-gut-health-muscle-gain-4-week-plan` | علمي/توثيق | متوسطة | 1 (M) |
| 126 | RS-06 | EN | `lose-belly-fat-without-losing-muscle-cardio-plan` | سليم | — | 1 (L) |
| 127 | RS-07 | EN | `macro-tracking-meal-prep-1800-fat-loss` | إعادة كتابة | متوسطة | 4 (H) |
| 128 | RS-07 | EN | `magnesium-forms-sleep-recovery` | سليم | — | 0 |
| 129 | RS-07 | EN | `optimize-preworkout-nutrition-evening-training` | سليم | — | 0 |
| 130 | RS-07 | EN | `progressive-overload-home-food-plan` | علمي/توثيق | متوسطة | 3 (M) |
| 131 | RS-07 | EN | `red-light-therapy-muscle-recovery-mistakes` | سليم | — | 1 (L) |
| 132 | RS-07 | EN | `smart-water-bottle-hydration-tracking-during-workouts` | إعادة كتابة | عالية | 4 (H) |
| 133 | RS-07 | EN | `train-muscle-group-frequency-fixes` | سليم | — | 1 (L) |
| 134 | RS-07 | EN | `warm-up-before-lifting-5min-routine` | سليم | — | 1 (L) |
| 135 | RS-07 | EN | `whey-protein-dosage-muscle-gain` | سليم | — | 1 (L) |

> مفتاح ملاحظات العمود الأخیر: العدد = إجمالي الملاحظات الموثقة بتلك المقالة، والحرف بين قوسين أعلى شدة فيها (H=عالية، M=متوسطة، L=منخفضة). القصاصات الحرفية والإصلاحات المقترحة لكل ملاحظة في ملفات دفعات التدقيق.

---

## 6. التوصيات (مرتبة — للمالك، ولا تنفَّذ من تلقاء النفس)

> **كل ما يلي توصيات تقييمية. لم يُنفذ منها شيء في هذه الجلسة.**

1. **(قرار أول) مقالات إعادة الكتابة الإحدى عشرة — أولوية عالية عدا وحدة متوسطة:** تُحال للقناة العلاجية الرسمية (article-treatment) دفعة أو دفعتين، مع أولوية `deload-week` و`smart-water-bottle` (تناقض/كسر بنيوي) قبل بقيتها. جوهر كثير منها قابل للإنقاذ — لا تحتاج تأليفًا من الصفر بل بتر المزارع وإصلاح البقايا وإعادة بناء FAQ.
2. **تصحيح الاستشهادات المعكوسة/المعطلة (3 حالات موثقة §4.2):** عكس ميتا الصويا 2022 في `compare-whey-soy`، و«المورتون الخاطئ» في مقالتي السعرات للمبتدئين وصحة الأمعاء. هذه فئة الخلل التي أزالها برنامج المعالجة ثماني مرات سابقًا (آخرها PMC4340532) — هاتان الحالتان المتبقيتان بنفس الطبقة.
3. **حملة «إزالة التكرار الاستشهادي»:** توحيد الاستشهادات المكررة (ورقة واحدة = سطر واحد) عبر المقالات المتأثرة (~15 مقالة) — تعديل شكلي منخفض المخاطر يرفع صدق المرجعية أمام محركات البحث والقراء.
4. **جولة لغوية عربية خفيفة (21 مقالة «لغة» + ملاحظات متناثرة):** قائمة الإصلاحات جاهزة نصًا في ملفات الدفعات — أغلبها كلمة أو كلمتان لكل موضع، وتصلح لدفعة علاج واحدة ميكانيكية.
5. **مصالحة الأرقام في المقالات الحسابية (§4.4):** تصحيح جداول الأمثلة لتطابق مجاميعها المعلنة — أهمها جدول يوم `fat-burning-macro-diet-plan` وقيمة TEF في `calculate-maintenance-calories`.
6. **قرار الروابط المتقاطعة للأزواج (0/36):** إدراج رابط كل طرف في متن نظيره — إجراء بنيوي بسيط يعزز التكافؤ المعلن بـhreflang ويُغلق أكبر فجوة موثقة في منظومة الأزواج.
7. **الـ39 ملاحظة المعلّمة needs_verification:** فحص حي بجلسة تشغيل قصيرة (روابط/صفحات WHO وCDC ودراسات محددة) — قائمتها في ملفات الدفعات بعلم `needs_verification: true`.

## 7. ما لم يُفعل في هذه الجلسة (حدود ملتزمة)

- لم تُعدّل أي مقالة أو أي حالة نشر/مراجعة (review_status كما هي).
- لم تُفتح أي دفعة علاج (article-treatment) ولا أمر تشغيل.
- لا مساس بملفات الموقع أو الكود أو قواعد البيانات — التدقيق قراءة فقط.
- لم يُعد تقديم AdSense ولم تُفتح أي نوافذ نشر أو استرجاع.
- كل ما في هذا التقرير أحكام وتوصيات تنتظر قرار المالك.

## 8. المرفقات والمراجع

- ملفات أحكام الدفعات الستة عشر (JSON بقصاصات حرفية وإصلاحات لكل ملاحظة): `audit/reviews/RP-01.json … RS-07.json` (بيئة جلسة التدقيق).
- جداول عناوين PubMed المستخدمة في التحقق: `audit/reviews/*-citations.json` لكل دفعة.
- التحقق الحي المباشر (خلال الجلسة): PMIDs ‏33670701 (حيواني/نباتي — لا فرق قوة، أفضلية كتلة لصغير البالغين) · 25911631 (جليكوجين:ماء = 1:3 مؤكدة) · 33971994 (المصل تفوق معنويًا في الكتلة الخالية — عكس ما نقلته مقالة الصويا).
- توزيع الملاحظات الموثقة 452: لغة 189 · علمي 131 · مصادر 53 · بنية 47 · قيمة 32 — الشدات: منخفضة 299 · متوسطة 125 · عالية 28 · حرجة 0.

---

---

## 9. سجل التنفيذ (EDITORIAL-REMEDIATION E-24→E-33 — جلسة 2026-11-03)

> **هذا القسم أُضيف بعد التدقيق:** تنفيذ التوصيات بأمر المالك (استكمال 2026-11-03) عبر القناة العلاجية الرسمية (article-treatment) — 10 دفعات (E-24→E-33) كلها مطبقة ومتحقق منها حيًا. **قانون الأدلة ظل حاكمًا:** كل خلل مشتبه أُعيد التثبت منه على مستوى البايت ضد المحتوى الحي قبل أي تعديل، وكل PMID تحقق حيًا ضد PubMed، ولم يُقبل أي تصحيح بلا دليل.

### 9.1 مصالحة التصنيفات قبل التنفيذ (النتيجة المثبتة)

- **قراءة التدقيق تداخلت زمنيًا مع دفعات L2-6/L2-7** (طُبقتا 2026-11-02 15:26 و2026-11-03 00:05 أثناء نافذة قراءة التدقيق): أحكام «إعادة كتابة» للأزواج الأربعة المعالجة بتلك الدفعات كانت عن نصوص سابقة لتطبيقها — إعادة القراءة الحرفية الحية وجدتها صالحة مع بقايا موضعية محددة، فعولجت جراحيًا لا بإعادة كتابة كاملة (استثناء واحد كامل: track-macros-no-food-scale لم يُعالج قط).
- **عرض الروابط في جلسة العمل كان يبتلع تسلسل «[m» و«[h»** فبدت روابط «acro calculator]» و«ow many...» مكسورة وهي سليمة بايتًا — أُثبت ذلك بالفحص البايتي ولم تُمس الروابط السليمة.
- **PMID 27102172** (ميتا التكرار) تحقق حيًا: خلاصة الورقة نفسها تدعم «مرتين أسبوعيًا تتفوق عند تساوي الحجم» (ES 0.49 مقابل 0.30، P=0.002) — ادعاءات المقالات بقيت دون تغيير (لا دليل على عكسها).
- **23360586** هو مراجعة منشورة بمجلة JISSN وليس بيان موقف ISSN — صياغتا «بيان»/«analysis» صُححتا باللغتين.

### 9.2 جدول التوصيات السبع → حالة التنفيذ

| # | التوصية | الحالة |
|---|---|---|
| 1 | إحالات إعادة الكتابة الإحدى عشرة | **منجزة 11/11** — E-25 (2 انكسارات بنيوية) · E-26 (4 غير مقترنة) · E-28 (5 أزواج بطرفيها: إعادة كتابة كاملة لـtrack-macros EN + 9 معالجات جراحية مثبتة) |
| 2 | الاستشهادات المعكوسة/المعطلة (3 حالات §4.2) | **منجزة 3/3** — E-24 (ميتا الصويا 33971994 + مورتون الخاطئ 26019246 ×2) + E-32 (عزو WHO لصفحة النشاط البدني — أثبت الفحص الحي أن الصفحة بلا أي ذكر للسوائل؛ استُبدل ببيان ACSM 17277604) |
| 3 | إزالة التكرار الاستشهادي (~15 مقالة) | **منجزة** — E-30: 36 مقالة (وجد حيًا أكثر من تقدير التدقيق) + 6 أعمدة تكافؤ = 42 مدخلًا؛ ~63 موضعًا وحّد فيها نص الرابط لكل ورقة (الرابط الأقصر القائم — بلا اختراع)؛ صفر تكرار متبقٍ داخل نطاق التدقيق |
| 4 | الجولة اللغوية العربية (21 مقالة + متناثرة) | **منجزة** — E-27 (15 غير مقترنة) · E-28 (الأزواج الخمسة + 22 إصلاحًا كلمة-بكلمة) · E-29 (الثلاث عالية الأولوية + آخر بقايا §4.3 الموثقة: فحصته) · E-31 (الشاكر المؤجلة) · E-33 (آخر 3 غير سليمة: التغطية 63/63 لغير السليم) |
| 5 | مصالحة الأرقام الحسابية (5 جداول §4.4) | **منجزة** — E-24 (الجداول الخمسة أُعيد حسابها) + E-28/E-29 (تناقضا جدول اليوم في IF وقالب أسابيع 4-week — حُلا باللغتين) |
| 6 | الروابط المتقاطعة للأزواج (0/36) | **منجزة 36/36 بالاتجاهين** — E-31: 72 مدخلًا (كل طرف بنظيره) + تحقق حي: 36/36 ثنائية الاتجاه بـlinked_post_id (خلل hreflang الموثق 30/36 أغلقته إقرانات L2 — حُفظ بتحقق حي) |
| 7 | الـ39 ملاحظة needs_verification | **جزئيًا بمسار منهجي** — قائمة الملاحظات التفصيلية فُقدت مع بيئة جلسة التدقيق (غير مرفوعة للمستودع)؛ المسار المنهجي المكتمل: (أ) حالتا §4.2/3 الموثقتان حُلّتا (E-26 + E-32) (ب) فحص حي لكل الروابط الخارجية في نطاق التدقيق: **182/182 حية** (172 مباشرة + 10 محجوبة عن الروبوتات أثبتت حياتها بالجلب: ODS×4 · CDC×5 · Mayo×1) (ج) 25+ PMID تحققت حية مقابل ادعاءاتها في E-28/E-29 بصفر تعارض |

### 9.3 دفعات التنفيذ (كلها عبر القناة الرسمية: DRY ثم APPLY ثم تحقق حي)

| الدفعة | المقالات | الجوهر |
|---|---|---|
| E-24 (science) | 8 | الاستشهادات المعكوسة الثلاثة + مصالحة الجداول الحسابية الخمسة + النسب الجامدة → غ/كغ |
| E-25 (rewrites 1) | 2 | deload-structure (تناقض الشدة حُل على Bosquet 17762369) + smart-water-bottle |
| E-26 (rewrites 2) | 4 | الأربع غير المقترنة: stretching AR · ramadan-women AR · calories-fat-loss AR (WHO→Garthe) · macro-tracking-meal-prep EN |
| E-27 (لغة 1) | 15 | غير المقترنة: 30 إصلاحًا كلمة-بكلمة مدفوعة بمسح المدونة |
| E-28 (أزواج 1) | 10 | الأزواج الخمسة الباقية بطرفيها: إعادة كتابة track-macros EN كاملة (المزارع + FAQ 10→6 + PMC6156185 + التصنيف) + 9 جراحية + حل تناقض قالب أسابيع 4-week |
| E-29 (لغة 2) | 7 | عالية الأولوية: IF (تناقض نافذة يوم محلول باللغتين) · hiit · bfr + فحصته |
| E-30 (استشهادات) | 42 | توحيد الاستشهادات المكررة (36 + 6 أعمدة تكافؤ) |
| E-31 (روابط متقاطعة) | 72 | كل الأزواج الـ36 بالاتجاهين + الشاكر المؤجلة |
| E-32 (تحقق حي) | 1 | عزو WHO→ACSM + مسح حي 182/182 رابطًا |
| E-33 (تغطية ختامية) | 3 | آخر غير السليم: whey-ramadan-women · veg-animal · home-food-plan (صورة تيكيلا دخيلة + FAQ 2→5) |

**البطارية النهائية:** tsc صفر · eslint صفر (تحذير واحد موروث) · vitest **5,206/5,206** · كاناري الدفعات 2,130/2,130 · كل دفعة: planned=applied failures=0.

### 9.4 جدول حالة كل مقالة من الـ135 (أي دفعة علاجية E-24→E-33 مسّتها)

| # | المقالة | ل | حكم التدقيق | الدفعات |
|---|---|---|---|---|
| 1 | how-to-periodize-nutrition-body-recomposition | إ | علمي/توثيق | E31 |
| 2 | nutrition-periodization-body-recomposition-guide | ع | علمي/توثيق | E31 |
| 3 | quick-healthy-meal-ideas-busy-people | إ | سليم | E31 |
| 4 | healthy-high-protein-meals-office | ع | لغة | E31 |
| 5 | science-backed-belly-fat-loss-8-weeks | إ | علمي/توثيق | E31 |
| 6 | belly-fat-loss-8-weeks-guide | ع | علمي/توثيق | E31 |
| 7 | best-wearable-sleep-tracking-athletes-guide | إ | سليم | E31 |
| 8 | choose-best-wearable-sleep-tracker-athletes | ع | سليم | E31 |
| 9 | schedule-cardio-muscle-gain-guide | إ | علمي/توثيق | E31 |
| 10 | cardio-scheduling-muscle-gain-guide | ع | سليم | E31 |
| 11 | sleep-better-faster-gym-results | إ | سليم | E31 |
| 12 | how-many-hours-sleep-for-muscle-growth | ع | لغة | E31 |
| 13 | choose-whey-protein-muscle-gain | إ | لغة | E31 |
| 14 | choose-whey-protein-muscle-gain-guide | ع | سليم | E31 |
| 15 | 4-day-split-hypertrophy-fat-loss | إ | سليم | E31 |
| 16 | 4-day-split-muscle-fat-loss-guide | ع | علمي/توثيق | E31 |
| 17 | 12-week-dumbbell-band-muscle-plan | إ | سليم | E31 |
| 18 | home-muscle-building-guide-simple-weights | ع | لغة | E31 |
| 19 | calculate-daily-calories-fuel-fat-loss-bulking | إ | سليم | E31 |
| 20 | calculate-daily-calories-weight-loss | ع | لغة | E31 |
| 21 | intermittent-fasting-muscle-gain-workout-plan | إ | سليم | E29، E31 |
| 22 | intermittent-fasting-muscle-gain-guide | ع | لغة | E29، E31 |
| 23 | 12-week-progressive-overload-intermediate | إ | إعادة كتابة | E28، E31 |
| 24 | 12-week-progressive-overload-intermediate-guide | ع | لغة | E28، E31 |
| 25 | deload-week-rest-training-guide | إ | سليم | E31 |
| 26 | deload-week-guide | ع | لغة | E31 |
| 27 | protein-myths-busted-muscle-gain | إ | علمي/توثيق | E30، E31 |
| 28 | protein-myths-muscle-gain-guide | ع | علمي/توثيق | E30، E31 |
| 29 | 4-day-upper-lower-hypertrophy-split | إ | سليم | E31 |
| 30 | upper-lower-split-4-days-guide | ع | لغة | E31 |
| 31 | combine-hiit-strength-fat-loss-guide | إ | علمي/توثيق | E29، E30، E31 |
| 32 | hiit-strength-training-fat-loss-guide | ع | لغة | E29، E30، E31 |
| 33 | chest-muscle-bodyweight-home-guide | إ | علمي/توثيق | E31 |
| 34 | chest-muscle-bodyweight-home | ع | علمي/توثيق | E31 |
| 35 | women-home-muscle-building-program-guide | إ | سليم | E31 |
| 36 | women-bodyweight-muscle-workout | ع | لغة | E31 |
| 37 | does-creatine-make-you-gain-weight-water-retention-vs-muscle | إ | علمي/توثيق | E30، E31 |
| 38 | creatine-water-retention-scientific-analysis-beginners-guide | ع | علمي/توثيق | E30، E31 |
| 39 | post-workout-recovery-meal-plan-7-recipes | إ | علمي/توثيق | E31 |
| 40 | post-workout-recovery-meal-plan-guide | ع | علمي/توثيق | E31 |
| 41 | track-macros-no-food-scale | إ | إعادة كتابة | E28، E31 |
| 42 | track-macros-without-scale-guide | ع | لغة | E28، E31 |
| 43 | best-protein-supplement-ramadan-guide | إ | سليم | E31 |
| 44 | best-protein-supplement-ramadan | ع | سليم | E31 |
| 45 | protein-after-workout-grams-guide | إ | إعادة كتابة | E28، E30، E31 |
| 46 | protein-grams-after-workout-guide | ع | سليم | E28، E30، E31 |
| 47 | protein-per-day-muscle-build-plan | إ | سليم | E30، E31 |
| 48 | protein-intake-calculator-muscle-build | ع | سليم | E30، E31 |
| 49 | pre-workout-nutrition-guide | إ | سليم | E30، E31 |
| 50 | nutrition-before-workout-guide | ع | لغة | E30، E31 |
| 51 | best-protein-timing-after-workout-guide | إ | علمي/توثيق | E28، E30، E31 |
| 52 | best-protein-timing-after-workout | ع | إعادة كتابة | E28، E30، E31 |
| 53 | 4-week-beginner-muscle-building-plan | إ | إعادة كتابة | E28، E30، E31 |
| 54 | 4-week-beginner-muscle-building-plan-guide | ع | سليم | E28، E30، E31 |
| 55 | calorie-cycling-fat-loss-diet | إ | سليم | E31 |
| 56 | calorie-cycling-fat-loss-guide | ع | سليم | E31 |
| 57 | sauna-muscle-recovery-hormone-optimization | إ | سليم | E30، E31 |
| 58 | sauna-muscle-recovery-guide | ع | علمي/توثيق | E30، E31 |
| 59 | home-muscle-building-no-equipment-guide | إ | سليم | E30، E31 |
| 60 | home-muscle-building-guide-no-equipment | ع | لغة | E30، E31 |
| 61 | bfr-training-checklist | إ | علمي/توثيق | E29، E31 |
| 62 | bfr-training-guide | ع | لغة | E29، E31 |
| 63 | build-muscle-without-supplements-guide | إ | علمي/توثيق | E30، E31 |
| 64 | increase-muscle-mass-no-protein-supplements | ع | لغة | E30، E31 |
| 65 | hiit-home-fat-burning-workout | إ | سليم | E31 |
| 66 | hiit-home-workout-guide | ع | علمي/توثيق | E31 |
| 67 | 12-week-progressive-overload-home-workout | إ | سليم | E30، E31 |
| 68 | home-muscle-gain-8-weeks | ع | علمي/توثيق | E30، E31 |
| 69 | best-plant-based-protein-powder-muscle-gain-2026 | إ | سليم | E31 |
| 70 | best-plant-based-protein-powder-guide | ع | لغة | E31 |
| 71 | progressive-overload-no-weight | إ | علمي/توثيق | E31 |
| 72 | progressive-overload-without-weights-guide | ع | علمي/توثيق | E31 |
| 73 | best-creatine-men-guide | ع | سليم | E27 |
| 74 | best-creatine-supplement-for-women-guide | ع | سليم | E30 |
| 75 | best-dynamic-stretching-before-gym | ع | إعادة كتابة | E26، E30 |
| 76 | best-dynamic-stretching-exercises-athletes-injury-prevention | ع | سليم | — |
| 77 | best-omega-3-supplement-athletes | ع | سليم | — |
| 78 | best-protein-supplement-women-ramadan | ع | إعادة كتابة | E26 |
| 79 | beta-alanine-guide-selection | ع | سليم | — |
| 80 | bmr-calculator-athletes | ع | سليم | E27 |
| 81 | calculate-calories-fat-loss | ع | إعادة كتابة | E26 |
| 82 | calculate-daily-calories-muscle-gain-beginners-guide | ع | علمي/توثيق | E24 |
| 83 | calculate-daily-calories-weight-loss-muscle-gain | ع | سليم | E24، E27 |
| 84 | calorie-macro-guide-muscle-fat | ع | سليم | — |
| 85 | carb-loading-plan-competition | ع | سليم | E24 |
| 86 | chest-muscle-home-workout-guide | ع | سليم | — |
| 87 | choose-creatine-women-guide | ع | لغة | E27، E30 |
| 88 | choose-vitamin-d-supplement-athletes | ع | سليم | — |
| 89 | choose-weightlifting-shoes-men | ع | لغة | E27 |
| 90 | choose-whey-protein-ramadan-women | ع | لغة | — |
| 91 | cold-bath-home-wellness | ع | سليم | E27 |
| 92 | common-fat-burning-mistakes | ع | سليم | — |
| 93 | compare-whey-soy-protein-athletes | ع | علمي/توثيق | E24، E30 |
| 94 | creatine-beginners-guide | ع | سليم | — |
| 95 | design-diet-fat-loss-egyptian-lifestyle | ع | لغة | E27 |
| 96 | fat-burning-macro-diet-plan | ع | علمي/توثيق | E24، E27، E29، E30 |
| 97 | how-to-calc-daily-protein-athletes | ع | سليم | E27 |
| 98 | how-to-start-muscle-building-beginners | ع | سليم | — |
| 99 | muscle-building-home-workout-guide | ع | سليم | E27 |
| 100 | muscle-group-frequency-optimal | ع | سليم | — |
| 101 | optimal-rest-periods-resistance-training | ع | سليم | E27 |
| 102 | progressive-weight-increase | ع | سليم | — |
| 103 | protein-supplements-veg-animal-comparison | ع | علمي/توثيق | — |
| 104 | reduce-water-retention-muscle-building | ع | سليم | E27 |
| 105 | sleep-muscle-growth-science | ع | سليم | E27 |
| 106 | sleep-recovery-gym-results | ع | سليم | E27 |
| 107 | water-intake-athlete-guide | ع | سليم | E27، E32 |
| 108 | weekly-fat-burning-diet-plan | ع | سليم | — |
| 109 | 12-week-periodized-muscle-building-plan | إ | علمي/توثيق | E24 |
| 110 | adjust-training-volume-cut-muscle-retention | إ | سليم | E30 |
| 111 | beef-protein-vs-whey-isolate-muscle-comparison | إ | سليم | — |
| 112 | best-time-to-take-creatine-guide | إ | سليم | E30 |
| 113 | budget-home-gym-equipment-comparison | إ | سليم | E30 |
| 114 | calculate-maintenance-calories-muscle-gain | إ | علمي/توثيق | E24 |
| 115 | choose-smart-scale-body-composition | إ | سليم | — |
| 116 | choose-smartwatch-fitness-tracking | إ | سليم | — |
| 117 | contrast-therapy-7day-recovery-plan | إ | سليم | — |
| 118 | creatine-cycling-long-term-gains | إ | سليم | — |
| 119 | creatine-loading-strength-hypertrophy-guide | إ | سليم | — |
| 120 | deload-week-structure-strength-gains | إ | إعادة كتابة | E25، E30 |
| 121 | foam-roller-recovery-4-week-guide | إ | سليم | E30 |
| 122 | heart-rate-monitor-fat-loss-guide | إ | سليم | E30 |
| 123 | how-many-calories-to-gain-muscle-and-lose-fat | إ | سليم | E30 |
| 124 | hrv-overtraining-7day-plan-athletes | إ | سليم | E30 |
| 125 | improve-gut-health-muscle-gain-4-week-plan | إ | علمي/توثيق | E24 |
| 126 | lose-belly-fat-without-losing-muscle-cardio-plan | إ | سليم | E30 |
| 127 | macro-tracking-meal-prep-1800-fat-loss | إ | إعادة كتابة | E26 |
| 128 | magnesium-forms-sleep-recovery | إ | سليم | — |
| 129 | optimize-preworkout-nutrition-evening-training | إ | سليم | — |
| 130 | progressive-overload-home-food-plan | إ | علمي/توثيق | — |
| 131 | red-light-therapy-muscle-recovery-mistakes | إ | سليم | E30 |
| 132 | smart-water-bottle-hydration-tracking-during-workouts | إ | إعادة كتابة | E25، E30 |
| 133 | train-muscle-group-frequency-fixes | إ | سليم | — |
| 134 | warm-up-before-lifting-5min-routine | إ | سليم | E30 |
| 135 | whey-protein-dosage-muscle-gain | إ | سليم | E30 |

> عمود الدفعات = دفعات E-24→E-33 فقط (دفعات L2/T3 السابقة للتدقيق خارج هذا الجدول). «—» = لم تمسها دفعات العلاج هذه (24 مقالة: 21 سليمة لم تستدعِ علاجًا + انظر §9.5).

### 9.5 ما لم يُنفّذ ولماذا (حدود صادقة)

1. **ملاحظات needs_verification الـ37 غير الموثقة تفصيليًا:** قصاصاتها الحرفية كانت بملفات دفعات التدقيق داخل بيئة جلسته (خارج المستودع) ولم تصل لهذه الجلسة — استُبدلت بمسار منهجي مكافئ (فحص حي شامل للروابط والاستشهادات كما في §9.2/7) بدل ادعاء تنفيذ قائمة لا يمكن التثبت منها.
2. **بقايا جمالية محتملة في المقالات «السليمة»:** أحكام «سليم» (72) تحمل ملاحظات منخفضة الشدة أغلبيتها جمالية — لم تُعالج فرديًا (لا قصاصات متاحة، والقيمة التحريرية هامشية مقابل مخاطرة اللمس العشوائي). مسح المدونة لبقايا §4.3 الموثقة = **صفر متبقٍ**.
3. **مطابقة ملاحظة-بملاحظة ضد قصاصات الـ452 الأصلية:** سجلات E-24→E-33 توثق كل إصلاح في حقل note لكل مقالة داخل ملفات الدفعات JSON بالمستودع — لكن المطابقة الحرفية ضد قصاصات التدقيق مستحيلة بعد فقدان ملفات الجلسة الأصلية.

---

*التقرير أُنجز بأمر المالك (جلسة المراجعة التحريرية الشاملة) بتاريخ 2026-11-03 — تقييم فقط، بلا أي تعديل محتوى. §9 أُضيف بجلسة التنفيذ (استكمال 2026-11-03): E-24→E-33 منفذة ومتحقق منها حيًا.*
