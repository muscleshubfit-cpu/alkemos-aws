# بيانات القياس الحي — جلسة 2026-11-05 (قراءة فقط من الإنتاج alkemos.com)

> سكربتات القياس المحفوظة خارج المستودع بالجلسة (نمط قابل لإعادة الإنتاج عند أول فريم تنفيذي). كل ما هنا مقاس مباشرة اليوم ما لم يُذكر مصدر آخر.

## 1. التزامن والبنية

- `/api/build-info` → `{"ok":true,"service":"alkemos","commit":"4b654363...","branch":"main","checkedAt":"2026-11-04T23:56:42Z"}` — **يطابق HEAD المستودع** (4b654363).
- تحويلات: `http://alkemos.com/` → 301 → `https://alkemos.com/` · `https://www.alkemos.com/` → 301 → apex · `https://alkemos.com/en` → **404** (صحيح: EN = الجذر) · الشرطة المائلة: 308 إلى النظيف.
- robots.txt: ‏4,099 بايت — مجموعة `User-agent: *` واحدة؛ إعلان 7 خرائط صريحًا؛ إشارات llms.txt/llms-full.txt.
- llms.txt: ‏200 · 7,215 بايت · 57 سطرًا (≈45 رابطًا). llms-full.txt: ‏200 · 23,388 بايت · 114 سطرًا.

## 2. جرد الخرائط [قياس]

| الخريطة | URLs | lastmod أدنى/أقصى | xhtml:link |
|---|---:|---|---:|
| sitemap-pages.xml | 148 | 2026-11-04 | 296 |
| sitemap-collections.xml | 48 | 2026-09-15 | 96 |
| sitemap-comparisons.xml | 8 | 2026-11-04 | 16 |
| sitemap-exercises.xml | 1,736 | 2026-11-04 | 3,472 |
| sitemap-foods.xml | 160 | 2026-11-04 | 320 |
| sitemap-blog.xml | 137 | 2026-11-03→11-04 | 144 |
| **الإجمالي** | **2,237** | | |

## 3. عينات الصفحات الرئيسة (20 صفحة ناجحة — الحالة/العنوان/الوصف/السكيما/الكلمات؛ تفاصيل الصفحات أدناه بالمجموع 44 ناجحة)

| الصفحة | st | طول العنوان | طول الوصف | كلمات | JSON-LD | hreflang |
|---|---:|---:|---:|---:|---|---:|
| / | 200 | 48 | 155 | 1,631 | Organization, WebSite, FAQPage | 5 |
| /ar | 200 | 48 | 157 | 1,572 | نفسها | 5 |
| /foods · /ar/foods | 200 | 23/56 | 149/126 | 652/754 | Organization, WebSite | 5 |
| /exercises · /ar/exercises | 200 | 26/24 | 132/103 | 602/655 | Organization, WebSite | 5 |
| /blog · /ar/blog | 200 | 34/26 | 99/82 | 3,296/3,172 | Organization, WebSite | 5 |
| /tools/calorie-calculator ×2 | 200 | 57/64 | 139/132 | 4,165/3,666 | + WebApplication (HowTo/Breadcrumb) | 5 |
| /memberships ×2 | 200 | 43/41 | 131/158 | 1,495/1,444 | + OfferCatalog | 5 |
| /coaching ×2 | 200 | 43/41 | 145/122 | 913/863 | + Service, FAQPage | 5 |
| /evo ×2 | 200 | 32/62 | 159/154 | 1,532/1,331 | + SoftwareApplication | 5 |
| /foods/methodology ×2 | 200 | 75/66 | 132/158 | 1,759/1,549 | + Article, Breadcrumb, Dataset | 5 |
| /authors ×2 | 200 | 29/29 | 132/122 | 379/374 | + Breadcrumb, ProfilePage | 5 |

**كل الصفحات:** `robots: index, follow` · canonical ذاتي 100% · hreflang (en/ar/x-default) كامل · html lang/dir صحيحان · og حاضر.

## 4. صفحات التفاصيل [قياس]

| الصفحة | st | robots | العنوان (ح) | الوصف | كلمات | السكيما |
|---|---:|---|---:|---:|---:|---|
| /foods/chicken-breast (منقّى مُثرى) | 200 | index | 64 | 124 | **708** | + NutritionInformation, Breadcrumb |
| /ar/foods/chicken-breast | 200 | index | 52 | 144 | 661 | كذلك — H1 «صدور دجاج» |
| **/foods/butter-salted (نطاق معرب — غير معلن)** | 200 | **index** | 64 | 117 | 354 | + NutritionInformation |
| **/ar/foods/butter-salted** | 200 | **index** | 53 | 142 | 373 | كذلك — H1 «زبدة مملحة» |
| /foods/cheese-tilsit (ذيل USDA) | 200 | index (EN) | 64 | 116 | 360 | كذلك |
| **/ar/foods/cheese-tilsit** | 200 | **noindex, follow** | 57 | 145 | 379 | H1 لاتيني «Cheese, tilsit» (قانون P2-12 حي) |
| /foods/cheese-pasteurized-process-pimento | 200 | index | **86 (>75)** | 140 | 368 | دليل مسألة عناوين الذيل (7,426 موثقة) |
| /exercises/34-sit-up (غير مُثرى) | 200 | index | 49 | 94 | 369 | + HowTo, WebPage(reviewed) |
| /ar/exercises/34-sit-up | 200 | index | 59 | 112 | 351 | كذلك |
| /blog/quick-healthy-meal-ideas… | 200 | index | 58 | 134 | 1,612 | + Article, Speakable |
| /ar/blog/hiit-home-workout-guide | 200 | index | 58 | 125 | 1,791 | كذلك |
| /muscles/chest ×2 | 200 | index | 57/58 | 157/122 | 1,408/1,383 | + ItemList, Breadcrumb |
| /compare/alkemos-vs-myfitnesspal ×2 | 200 | index | 58/58 | 139/132 | 1,041/1,034 | + Article, ItemList |
| /programs/home-beginner-fullbody ×2 | 200 | index | 51/61 | 141/134 | 1,005/923 | + FAQPage |
| /diet-plan/1200/balanced ×2 | 200 | index | 50/56 | 154/146 | 1,467/1,220 | + Breadcrumb |
| /guides/macro-tracking-accuracy ×2 | 200 | index | 70/75 | 145/150 | 2,030/1,767 | + Article, FAQPage |
| /foods?page=2 · /ar/foods?page=2 | 200 | index | 23/56 | 149/126 | 647/747 | canonical → /foods (نظيف) |

## 5. مقتطفات سجل GSC (read-only API — سجلات Actions)

- **تشغيل #9 (2026-11-03، نافذة 2026-10-06→11-02):** `RESULT property=sc-domain:alkemos.com clicks=5 impressions=31 ctr=16.13% position=13.84`؛ السلسلة اليومية 14 يومًا: 0-2 أغلب الأيام (ذروة 7 يوم 10-31؛ 4 انطباعات و1 نقرة يوم 10-24).
- **تشغيل #8 (2026-10-31، نافذة 2026-10-03→10-30):** 544 انطباعًا · 5 نقرات · CTR ‏0.92% · موقع 45.06 (مجموع الأجهزة: موبايل 171/5 نقرات @14.34؛ سطح مكتب 371/0 @59.43؛ لوحي 2). الدول: usa ‏146@57.6 · egy ‏48+3 نقرات @23.69 · esp ‏40 · gbr ‏32 · sau ‏31@19.13 · irq ‏17@8.18 · are ‏12+1 · dza ‏7@8.43 · jor/mar ‏7 · sdn/lbn ‏3@5-7.67 · tun ‏3@10.
- **أعلى الصفحات (نافذة #8):** tools/body-fat ‏31@79.84 · exercises/tricep-dumbbell-kickback ‏16@75.38 · tools/calorie ‏12@84.5 · / ‏10+3نقرات@1.1 · bmi ‏10@79.7 · macro ‏10@37.2 · crunches ‏9@7.44 · **ar/foods/chicken-breast ‏8@8.0** · leg-lift ‏9@47.89 · **ar/foods/olive-oil ‏5@6.8 · ar/foods/tuna ‏5@5.4 · equipment/kettlebell ‏5@7.2** · **ar/exercises/kettlebell-pistol-squat ‏4@6.25 · ar/foods/cottage-cheese ‏4@4.75** · blog/best-wearable-sleep ‏4@9.5 · **ar/exercises/cable-wrist-curl ‏3@6.0 · leg-lift(ar) ‏3@3.0 · one-knee-to-chest(ar) ‏3@8 · side-leg-raises(ar) ‏3@5 · ar/foods/green-tea ‏3@4.0** · iliotibial-tract-smr ‏3@2.0 · (وذيل تمارين EN ‏3-6 انطباعات @54-89).

## 6. مسبار GEO (تشغيل 2026-11-01 — run 41313672290)

`Result: 0/24 answered queries mentioned Alkemos (0%) · 0 chain failure(s) · EN 0/12 · AR 0/12` عبر groq:openai/gpt-oss-120b — الأسئلة الـ24 معروضة بالسجل (12 EN + 12 AR: سعرات/بروتين/تمارين منزل/نوم/كرياتين/فوم رولر/ماء/توقيت بروتين/ماكروز/ساونا/التهاب العضلات/PPL). القراءتان السابقتان: 0/24 (2026-09-29 أساس) و0/24 (2026-10-10).

## 7. سير العمل (Actions) [قياس]

- IndexNow: تشغيلات #14→#19 خضراء يوميًا (2026-10-30→11-04).
- GEO الشهري: تشغيل #2 خضراء (2026-11-01) — مجدول أول كل شهر.
- GSC test: ‏#9 خضراء (2026-11-03) — dispatch فقط.
- Bing submission: تشغيلات 1-3 فاشلة (2026-10-31، بند ملغى بقرار مالك) — موثقة للسياق فقط.

## 8. فحوص SERP الحية (2026-11-05 — استعلامات وأبرز من يتصدر)

- «كم سعرة في الموز»: Medanta(ar)، Webteb، Altibbi، مقتطفات محتوى اجتماعي.
- «حاسبة السعرات الحرارية»: moh.gov.sa، Elconsolto(BMR)، rc2.med.sa، mohap.gov.ae، تطبيقات Play.
- «كم بروتين في البيضة المسلوقة»: Care Hospitals(ar)، Medanta(ar)، Webteb، moh.gov.bh (دليل غذائي).
- «أطعمة غنية بالبروتين لبناء العضلات»: Aljazeera Health، Dr.Nutrition، Chefaa، Continental Hospitals.
- «جدول تمارين صدر للمبتدئين»: GoldenForma، FreeWorkoutForAll(ar)، محتوى اجتماعي.
- «calories in banana per 100g»: EatThisMuch، Dole، FatSecret، PrecisionNutrition، FoodStruct.
- «protein in chicken breast per 100g»: Healthline، EatThisMuch، Saura، ATHLEAN-X.
- «MyFitnessPal Arabic language support»: صفحة اللغات الرسمية (لا عربية بالقائمة) + نقاش مجتمع «Why is there no Arabic» (2023) + مراجعة App Store تطلب العربية.
- «ElCoach»: موقع elcoach.me (تطبيق coaching عربي) + تسعير بالجنيه عبر صفحات كوبونات (3 أشهر ≈1,525 EGP) — لا منصة محتوى.
- «Trainera fit»: trainera.fit (28 لغة، 1,800+ تمرينًا و1,100+ وصفة، عربية أولًا — متاجر التطبيقات).

## 9. ملاحظات صدق

- رقم 544 (نافذة 10-03→30) يتضمن ~522 انطباعًا من أيام الانهيار 10-03→05 (459+49+14 موثقة بتدقيق الانهيار) — لذا النافذة الأحدث (31) هي المرآة الصحيحة للحالة الراهنة.
- كل أعداد الكلمات = نص مرئي بعد إزالة script/style (عدّاد بسيط، للاستدلال النسبي لا للمطابقة الحرفية مع مقاييس المستودع الداخلية).
