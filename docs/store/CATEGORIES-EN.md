# التصنيف الهرمي الموسع لمتجر Alkemos Affiliate Store (إنجليزي) — الإصدار 2

> **الحالة:** **معتمد (v2) بأمر المالك لتنفيذ المرحلة الأولى (2026-11-26):** «اعتمد التصنيف الموسع v2» — الفئات الرئيسية الاثنتا عشرة والفئات الفرعية والفئات الفرعية المثلقة بهذا الإصدار صارت مصدر seed الفئات لميجريشن 0115 (موجة 1 الثماني تُزرع نشطة · موجتا 2/3 تُزرعان غير نشطة `is_active=false` حتى قرارات تفعيلهما). أمر المالك الأصلي (جلسة 2026-11-26 بتوقيت القاهرة / 2026-11-25 UTC مساءً) قرر أن قائمة الفئات السبع (v1) ليست نهائية؛ هذا الملف حل محل جدول v1.
> **النطاق القانوني:** فئات المتجر **إنجليزية** (slug/name إنجليزية بلا أعمدة عربية — التقرير الحاكم §0/§3.1) · التصنيف الداخلي للمتجر مستقل تمامًا عن تصنيف أمازون للمنتج · الحلال ومنهجية الانتقاء بقوانين التقرير الحاكم (§3.4-5) وإطار غربلة المكملات والأغذية `docs/store/SUPPLEMENTS-FOOD-SCREENING-EN.md`.
> **قانون النسب (داخلي حصرًا):** مصدر النسب هو `docs/store/COMMISSION-RATES.md` (الجدول الرسمي الموثق بتحقق 2026-11-25 UTC) — **لا تُعرض النسب للزوار في أي صفحة متجر أو بطاقة منتج أو محتوى عام ولا تُستخدم كميزة تسويقية**؛ تبقى مدخلًا داخليًا لترتيب الأولويات وقرارات اختيار المنتجات (أمر المالك نفسه). ما لم يوثق بجدول العمولات يُصاغ «يُتحقق لكل ASIN» — لا تُفترض نسب جديدة.

## 1) منهجية الدراسة الموسعة (قانون المتجر §1.5/§1.8 + معايير أمر المالك)

1. منتجات amazon.com أمريكية تخدم **قصد شراء فوريًا** قابلًا للربط بأسطح Alkemos الإنجليزية (الأدوات العشر EN · 8 hubs معدات: `barbell`/`dumbbell`/`kettlebell`/`band`/`cable`/`machine`/`bodyweight`/`none` · البرامج · الوصفات · المدونة EN).
2. منتجات **حلال** ومنهجية انتقاء تحترم حذف الخنزير/الكحول (قرار 2026-11-12) بلا استثناءات — والمكملات/الأغذية تُغربل منتجًا-منتجًا (لا حكم عم مسبق بالسماح أو المنع — إطار الغربلة بملفه).
3. قيمة تحريرية حقيقية: لكل منتج محتوى إنجليزي فريد (لا نسخ وصف أمازون) وفق أرضية التحرير الإرشادية (≥300 كلمة إرشاديًا).
4. **معايير التقييم الستة لأمر المالك (تُطبق على كل فئة):** (أ) ارتباطها بجمهور المنصة · (ب) الطلب والفرص التجارية · (ج) تنوع المنتجات · (د) القيمة المضافة للمستخدم · (هـ) القيود التنظيمية وسياسات أمازون · (و) نسبة العمولة الفعلية (داخلية — أحد المدخلات لا العامل الوحيد: **يحظر استبعاد فئة بسبب انخفاض النسبة وحده** — أمر المالك).
5. أدلة الطلب الداخلية المستخدمة (بلا اختراع أرقام خارجية): عنقود الاستعلامات البروتينية الموثق بتدقيق نوايا عائلة البروتين (GSC — `docs/seo-indexing-audit-2026-11-11/17-b3-protein-intent-audit-and-b4-recommendation.md`: عائلة 26 مقالة منها 12 EN بنية بروتين حية) · أسطح الأدوات/hubs القائمة · أمر D-أ (hubs المعدات مرشح موثق).

## 2) التصنيف الهرمي المقترح (12 فئة رئيسية · 3 موجات إطلاق)

> **قاعدة الأعمدة:** «أسطح الربط» = أسطح Alkemos الإنجليزية المرشحة لوحدات التوصية (المرحلة 2 — قانون المتجر §1.8) · «صف أمازون» = الصف الموثق بجدول العمولات الداخلي الذي تُقرأ منه النسبة (النسبة تتبع تصنيف أمازون الفعلي للـASIN وقت الشراء — لا تصنيف المتجر).

### الموجة الأولى (الإطلاق التأسيسي — المرحلة 1.8)

| # | الفئة (name EN) | slug | الفئات الفرعية (EN) | أسطح الربط | صف أمازون (داخلي) |
|---|---|---|---|---|---|
| 1 | Strength & Free Weights | `strength-free-weights` | Adjustable & Fixed Dumbbells · Kettlebells · Barbells, Plates & Collars · Resistance Bands & Tubes · Functional & Plyometric Tools (medicine balls, battle ropes, sandbags, agility) · Weight Storage | hubs: `barbell` · `dumbbell` · `kettlebell` · `band` + البرامج EN | **Sports — 3.00%** (الأوزان) · الأحزمة/القفازات ضمن Sports كذلك |
| 2 | Home Gym & Cardio Equipment | `home-gym-cardio-equipment` | Home Gyms & Cable Stations · Power Racks, Benches & Pull-up Bars · Treadmills & Walking Pads · Exercise & Spin Bikes · Rowing Machines · Ellipticals & Steppers · Smart & Compact Gym Systems · Gym Flooring & Setup | hubs: `machine` · `cable` · `bodyweight` + البرامج EN | **Sports — 3.00%** |
| 3 | Yoga, Mobility & Recovery | `yoga-mobility-recovery` | Yoga Mats & Props · Foam Rollers & Massage Tools · Percussive Massagers · Stretching & Mobility Equipment · Pilates Tools | البرامج EN + المدونة EN (محتوى التعافي) | مختلط — **يُتحقق لكل ASIN** (Sports 3.00% / Health & Personal Care 1.00% / غيرها) |
| 4 | Kitchen & Meal Prep | `kitchen-meal-prep` | Digital Food Scales & Measuring Tools · Meal Prep Containers & Storage · Blenders & Personal Blenders · Healthy Cooking Appliances (air fryers, grills, steamers) · Prep Tools & Accessories | أدوات: `macro-calculator` · `calorie-calculator` · `macro-tracker` · `ai-meal-planner` · `meal-planner` + الوصفات EN | **Kitchen — 4.50%** |
| 5 | Body Measurement & Composition | `body-measurement-composition` | Smart Body-Composition Scales · Body-Fat Calipers & Measuring Tapes · Health Monitoring Devices (ضغط/أوكسجين — لاحقًا) | أدوات: `bmi-calculator` · `body-fat-calculator` | مختلط — **يُتحقق لكل ASIN** (قابل لأن يكون Health & Personal Care 1.00% أو غيرها) |
| 6 | Wearables & Fitness Tech | `wearables-fitness-tech` | Fitness Smartwatches & GPS Watches · Activity & Sleep Trackers · Heart-Rate Monitors (chest/arm) · Sport Earbuds & Headphones · Connected Training Tech | أدوات: `workout-tracker` · `ai-workout-planner` + البرامج EN + المدونة EN | مختلط — **يُتحقق لكل ASIN** (Watches 4.00% · Headphones 3.00% · All Other Categories 4.00%) |
| 7 | Training Apparel & Footwear | `training-apparel-footwear` | Training & Gym Footwear · Running Footwear · Men's Training Apparel · Women's Training Apparel · Socks & Base Layers · Lifting Belts, Straps & Gloves · Gym & Training Bags | البرامج EN + المدونة EN | **Apparel/Shoes — 4.00%** · ملحقات الرفع ضمن Sports 3.00% · الحقائب: Luggage 3.00%/غيرها — يُتحقق لكل ASIN |
| 8 | Hydration & On-the-Go | `hydration-on-the-go` | Insulated & Smart Water Bottles · Shaker & Mixer Bottles · Flasks, Tumblers & Travel Mugs · Hydration Packs & Running Belts · Cooler Bags & Meal Carriers | أداة: `water-tracker` + الوصفات EN (حمل الوجبات) | مختلط — **يُتحقق لكل ASIN** (Kitchen 4.50% / Sports 3.00% بحسب تصنيف أمازون للصنف) |

### الموجة الثانية (التوسعة الأولى بعد الإطلاق — نافذة المرحلة 2/3 · بعد أول تشغيلة إنتاجية لإطار الغربلة)

| # | الفئة | slug | الفئات الفرعية | أسطح الربط | صف أمازون (داخلي) |
|---|---|---|---|---|---|
| 9 | Sports Supplements & Vitamins | `sports-supplements-vitamins` | Protein Powders (whey/casein/plant) · Creatine & Amino Acids · Vitamins, Minerals & Omegas · Pre-Workout & Energy Formulas · Recovery & Electrolyte Supplements · Joint & Bone Support · Herbal & Adaptogenic Supplements | المدونة EN (عائلة البروتين 12 مقالة) + أدوات الماكرو/السعرات + مقالات «بلا مكملات» | **Health & Personal Care — 1.00%** (الغالب) — يُتحقق لكل ASIN |
| 10 | Healthy Foods & Sports Snacks | `healthy-foods-sports-snacks` | Protein Bars & Functional Snacks · Nut Butters & Spreads · Nuts, Seeds & Trail Mixes · Electrolyte & Sports Drinks · Low-Sugar & Diet-Friendly Foods · Specialty Baking & Cooking Ingredients (مُحليات/دقيق بروتين) · Coffees & Teas | الوصفات EN + أدوات الماكرو/السعرات + المدونة EN | **Grocery — 1.00%** — يُتحقق لكل ASIN |

> **عدم الاستبعاد المسبق (أمر المالك):** استبعاد v1 للمكملات كان مبنيًا على النسبة (1.00%) أساسًا — أُلغي هذا الأساس؛ الفئة الآن **داخل التصنيف** بترتيب موجة ثانية. مسوّغات الترتيب المتبقية (شرعية وغير نسبية): (أ) إطار الغربلة `SUPPLEMENTS-FOOD-SCREENING-EN.md` يحتاج أول تشغيلة إنتاجية موثقة قبل التوسع بكتالوج كامل · (ب) العبء التحريري (محتوى فريد + انضباط الادعاءات) يُوزَّع بعد استقرار موجة الإطلاق · (ج) النسبة 1.00% الموثقة تبقى مدخلًا داخليًا في ترتيب الأولوية (لا سبب استبعاد). **يمكن للمالك تقديم الفئة لأمر فتح مستقل إن أراد.**

### الموجة الثالثة (توسعات لاحقة — المرحلة 3+ بقرارات مستقلة)

| # | الفئة | slug | الفئات الفرعية | ملاحظات |
|---|---|---|---|---|
| 11 | Educational Media & Training Guides | `educational-media-guides` | Fitness & Nutrition Books · Training Logs & Planners | **Physical Books — 4.50%** (موثقة) — كانت مؤجلة بالنسخة v1 للمرحلة 3 (قيمة تحريرية عالية · أولوية سطح شرائي أقل) |
| 12 | Endurance & Outdoor Accessories | `endurance-outdoor-accessories` | Running Accessories & Lights · Cycling Accessories · Outdoor Training Gear | مختلط — يُتحقق لكل ASIN · تُدرس جدواها بقرار المرحلة 3 (جمهور المنصة جيم/تغذية أولًا) |

## 3) تقييم الفئات الرئيسية بمعايير أمر المالك الستة

> مقياس نوعي (عالٍ/متوسط/منخفض) بلا أرقام خارجية مخترعة؛ النسب من الجدول الداخلي حصرًا.

| الفئة | ارتباط الجمهور | الطلب/الفرص | تنوع المنتجات | قيمة المستخدم | القيود (تنظيم/سياسات) | العمولة (داخلي) | الحكم |
|---|---|---|---|---|---|---|---|
| Strength & Free Weights | عالٍ جدًا (8 hubs) | عالٍ | عالٍ | عالية (عتاد البرامج) | منخفضة | Sports 3.00% | **موجة 1** |
| Home Gym & Cardio | عالٍ جدًا (hubs الآلات) | عالٍ | عالٍ | عالية | منخفضة | Sports 3.00% | **موجة 1** |
| Yoga, Mobility & Recovery | عالٍ | عالٍ | عالٍ | عالية (تعافٍ) | صور 173 (صور منتج فقط/أيقونات) | مختلط/ASIN | **موجة 1** |
| Kitchen & Meal Prep | عالٍ جدًا (5 أدوات + وصفات) | عالٍ | عالٍ | عالية | منخفضة | Kitchen 4.50% | **موجة 1** |
| Body Measurement | عالٍ جدًا (أداتا BMI/دهون) | متوسط-عالٍ | متوسط | عالية (قياس تقدم) | انضباط ادعاءات صحي خفيف | مختلط/ASIN | **موجة 1** |
| Wearables & Fitness Tech | عالٍ | عالٍ | عالٍ | عالية | منخفضة | Watches 4.00%/مختلط | **موجة 1** |
| Apparel & Footwear | عالٍ | عالٍ جدًا | عالٍ جدًا | عالية | **صور 173: صور المنتج فقط بلا عارضات** (النسائية خاصة) | Apparel/Shoes 4.00% | **موجة 1** |
| Hydration & On-the-Go | عالٍ جدًا (أداة الماء) | عالٍ | عالٍ | عالية | منخفضة | مختلط/ASIN | **موجة 1** |
| Supplements & Vitamins | عالٍ جدًا (عنقود بروتين موثق) | عالٍ جدًا | عالٍ جدًا | عالية | **الأعلى: غربلة حلال لكل منتج (جيلاتين/كحول) + انضباط ادعاءات صارم (FDA/أمازون) + بوابات بائع أمازون** | H&PC 1.00% (الأدنى الموثق) | **موجة 2** (بإطار الغربلة — لا استبعاد) |
| Healthy Foods & Snacks | عالٍ جدًا (وصفات/ماكرو) | عالٍ | عالٍ | عالية | غربلة مكونات لكل منتج (جيلاتين/كحول/خنزير) + انضباط ادعاءات | Grocery 1.00% | **موجة 2** (بإطار الغربلة) |
| Educational Media | متوسط-عالٍ | متوسط | متوسط | عالية (تعلم) | منخفضة | Books 4.50% | **موجة 3** |
| Endurance & Outdoor | متوسط | متوسط | متوسط | متوسطة | منخفضة | مختلط/ASIN | **موجة 3** (تدرس) |

## 4) نطاق المنتجات التأسيسية (مقترح مبرَّر — يحل محل «20–40»)

- **حجم الإطلاق:** **24–32 منتجًا** عند فتح المتجر (الفئات الثماني × 3–4) — يحترم حد «لا صفحة رقيقة» (≥3 منتجات مراجعة لكل فئة — قانون المتجر §1.4) ويقع داخل سقف التحرير الموثق للمرحلة 1 (15–35 ساعة ≈ 20–40 منتجًا بقانون المتجر §2).
- **هدف النمو خلال نافذة ما بعد الإطلاق:** **40–56 منتجًا** (5–7 لكل فئة) خلال أسابيع الإطلاق الأولى عبر الإدخال الشاشي الدوري (كل منتج يُنشر مستقلًا بـ`is_published` — لا يلزم اكتمال الدفعة) — تجاوز سقف v1 مبرَّر باتساع التصنيف (8 فئات حية مقابل 7 مختلطة) وتوزيع العبء على نافذة ISR.
- **موجة 2:** +16–24 منتجًا للمكملات/الأغذية بعد أول تشغيلة إنتاجية لإطار الغربلة (كل منتج بمراجعة مالك — نمط 0097).
- **قاعدة النشر:** كل منتج يفتح بمحتوى إنجليزي فريد (أرضية ≥300 كلمة إرشاديًا) + صورة مملوكة/مرخصة أو أيقونة محفورة (قانون الصور) + بيانات الأسطح المرتبطة.
- **لا فئة بلا منتجات جاهزة:** الفئة لا تُنششر قبل 3 منتجات مراجعة على الأقل (وحدة فارغة = صفحة رقيقة تضر SEO — قانون المتجر §1.4).

## 5) قرارات المالك المعتمدة (أمر تنفيذ المرحلة الأولى — 2026-11-26)

1. **التصنيف الهرمي (12 رئيسية + الفروع والموجات):** **معتمد** كما هو بهذا الإصدار (الأمر: «اعتمد التصنيف الموسع v2 في docs/store/CATEGORIES-EN.md»).
2. **حجم الدفعة التأسيسية:** **معتمد** — 24–32 منتجًا عند الفتح → 40–56 نموًا (الأمر: «إطلاق 24–32 منتجًا، مع قابلية التوسع إلى 40–56»).
3. **ترتيب المكملات/الأغذية بموجة 2:** **معتمد** — تجهيزًا للتوسعة وفق إطار الغربلة المعتمد دون تجاوز بوابات المراجعة (الأمر نفسه).
4. **موجات 3** (الكتب/التحمل الخارجي): تُترك لقرار المرحلة 3 كما هي (موجتا 2/3 تُزرعان غير نشطتين حتى قرارات التفعيل).
5. **تطبيق الاعتماد:** هذا الملف هو مصدر seed الفئات لميجريشن 0115 (بنية `parent_id` المعتمدة — قرار أ من أمر الفتح) والتنفيذ جارٍ بأمر فتح المرحلة 1.
