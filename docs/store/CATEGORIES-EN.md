# الفئات التأسيسية المقترحة لمتجر Alkemos Product Store (إنجليزي)

> **الحالة:** **مقترحة — بانتظار اعتماد المالك** (أمر تنفيذ المرحلة صفر طلب إعداد القائمة؛ اعتمادها أو تعديلها يُحسم بأمر المالك — ويمكن دمجه بأمر فتح المرحلة 1). البنية التقنية للفئات (جدول `store_categories` — ميجريشن 0115 المقترح) لا تُبنى قبل هذا الاعتماد.
> **النطاق القانوني:** فئات المتجر **إنجليزية** (slug/name إنجليزية بلا أعمدة عربية — التقرير الحاكم §0/§3.1) · التصنيف الداخلي للمتجر مستقل تمامًا عن تصنيف أمازون للمنتج · الحلال ومنهجية الانتقاء بقوانين التقرير الحاكم (§3.4-5).
> **مصدر النسب أدناه:** `docs/store/COMMISSION-RATES.md` (الجدول الرسمي الموثق بتحقق 2026-11-25 UTC).

## 1) منهجية الانتقاء (من قانون المتجر §1.5/§1.8)

1. منتجات amazon.com أمريكية تخدم **قصد شراء فوريًا** قابلًا للربط بأسطح Alkemos الإنجليزية (أدوات · hubs معدات · برامج · وصفات · مدونة EN).
2. منتجات **حلال** ومنهجية انتقاء تحترم حذف الخنزير/الكحول (قرار 2026-11-12) بلا استثناءات.
3. قيمة تحريرية حقيقية: لكل منتج محتوى إنجليزي فريد (لا نسخ وصف أمازون) وفق أرضية التحرير الإرشادية.
4. أولوية للفئات ذات النسب الأعلى الموثقة (Kitchen 4.50% مقابل Sports 3.00%) عند تساوي القيمة التحريرية.
5. الحجم التأسيسي: **20–40 منتجًا** (3–6 لكل فئة) — دفعة seed بمراجعة المالك (قانون SOP §5.1).

## 2) الفئات المقترحة (7)

| # | الفئة (name EN) | slug | ما تضم | أسطح الربط الداخلية (EN حصرًا) | فئة أمازون المتوقعة والنسبة الموثقة |
|---|---|---|---|---|---|
| 1 | Strength Free Weights | `strength-free-weights` | Dumbbells · kettlebells · barbells & plates · resistance bands | equipment hubs: `barbell` · `dumbbell` · `kettlebell` · `band` + البرامج | **Sports — 3.00%** |
| 2 | Home Gym Equipment | `home-gym-equipment` | Benches · power racks · cable machines · pull-up bars · home gyms | equipment hubs: `machine` · `cable` · `bodyweight` + البرامج | **Sports — 3.00%** |
| 3 | Kitchen & Meal Prep | `kitchen-meal-prep` | Food scales · meal-prep containers · blenders · shakers | أدوات: `macro-calculator` · `calorie-calculator` · `ai-meal-planner` + الوصفات EN | **Kitchen — 4.50%** |
| 4 | Measurement & Body Metrics | `measurement-body-metrics` | Smart body-composition scales · body-fat calipers · tape measures | أدوات: `bmi-calculator` · `body-fat-calculator` | مختلط — **يُتحقق لكل ASIN** (قابل لأن يكون Health & Personal Care 1.00% أو غيرها) |
| 5 | Hydration | `hydration` | Water bottles · flasks · motivational bottles | أداة: `water-tracker` | مختلط — **يُتحقق لكل ASIN** (Kitchen 4.50% / Sports 3.00% بحسب تصنيف أمازون للصنف) |
| 6 | Wearables & Fitness Tech | `wearables-fitness-tech` | Fitness trackers · heart-rate monitors · sport earbuds | البرامج EN + المدونة EN | مختلط — **يُتحقق لكل ASIN** (Watches 4.00% · Headphones 3.00% · All Other Categories 4.00%) |
| 7 | Training Apparel & Accessories | `training-apparel-accessories` | Training shoes · lifting belts & straps · gym gloves · gym bags | البرامج EN + المدونة EN | **Apparel/Shoes — 4.00%** · ملحقات الرفع ضمن Sports 3.00% |

**قاعدة النسب (ملزمة الفهم):** نسبة العمولة تتبع **تصنيف أمازون الفعلي لكل ASIN** وقت الشراء لا تصنيف المتجر الداخلي — العمولة الوحيدة الموثقة هي بجدول `docs/store/COMMISSION-RATES.md`، والتحقق التشغيلي لكل منتج يتم من تقارير Associates بعد أول نقرات مؤهلة. عمود «مختلط» أعلاه **لا يفترض نتيجة** — يُقيد بالتحقق.

## 3) قرارات نطاق مقترحة مع القائمة

- **استبعاد المكملات الغذائية من الإطلاق التأسيسي:** نسبتها الرسمية 1.00% (Health & Personal Care) — أدنى من كل الفئات أعلاه — مع أعلى عبء تحريري/تنظيمي (منهجية مكملات موثقة). تُدرس لاحقًا بقرار مالك مستقل.
- **استبعاد الكتب (Physical Books — 4.50%) من الإطلاق الأول:** قيمة تحريرية عالية لكن أولوية السطح الشرائي أقل — مرشحة لتوسعة المرحلة 3.
- **عدم إنشاء فئات بلا منتجات تأسيسية جاهزة:** كل فئة أعلاه يجب أن تفتح بـ3 منتجات مراجعة على الأقل (وحدة فارغة = صفحة رقيقة تضر SEO — قانون المتجر §1.4).
- كل الفئات تحترم قانون الصور `docs/store/IMAGE-POLICY-EN.md` (أيقونة محفورة افتراضيًا أو صورة مملوكة/مرخصة).

## 4) ما يعتمده المالك عند الاعتماد

1. القائمة نفسها (إضافة/حذف/دمج فئات — الترتيب الأولوي مقترح كما بالجدول).
2. حجم الدفعة التأسيسية داخل نطاق 20–40 منتجًا (اقتراح: ~28 منتجًا).
3. إقرار الاستبعادات الثلاثة ب§3 أعلاه (أو نقض أي منها بأمر).
