# Food Catalog Pork & Alcohol Deletion Report
## أمر المالك 2026-11-12: «حذف جميع الأغذية المصنفة فعليًا ضمن لحوم الخنزير والكحول من كتالوج الأغذية — وليس الاكتفاء باستبعادها من التعريب أو تطبيق noindex عليها»

> **معرّف المهمة:** FOOD-PORK-ALCOHOL-DELETION-2026-11-12 · **النوع:** تنفيذ هندسي منشور (بيانات + اشتقاقات + حراس + توثيق) بأمر مالك صريح — الحذف النهائي من مصدر البيانات الأساسي.
> **القناة:** `src/lib/foods.ts` (المصفوفة الأساسية — الحذف الفعلي للصفوف) + `src/lib/foods-search-index.ts` (أعيد توليده) + `src/lib/foods-enrichment.ts` (أُزيل إثراءا الصفين المنتقين المحذوفين) + كل الإحصائيات الحالية عبر المستودع + الحراس. **صفر** مساس بسجلات المستخدمين أو أي بيانات خارج كتالوج الأغذية.
> **سجل الحذف الكامل:** الملحق §8 أدناه (668 صفًا بأسمائها وسبب حذف كل منها) — والسجل الآلي الخام `scripts/repro/food-arabization-batch5/excluded_pork.json` + `excluded_alcohol.json` (تصنيف المشروع المرجعي) مع `deletion_log.json` (النسخة الكاملة بهذا التقرير).

---

## §1. الجرد والتدقيق (إعادة الحساب من المصدر — لا أرقام قديمة)

| البند | القيمة المقيسة عند HEAD 0136d0ff (قبل التنفيذ) |
|---|---|
| إجمالي صفوف القاعدة | **8,830** (80 منسّقًا بوسوم + 8,750 ذيل USDA بلا وسوم) |
| باند التعريب `SEO_FOOD_BAND` | 8,076 (لم يتغير — كلها معرّبة) |
| خارج الباند (الاستبعادات الموثقة) | **674 بالضبط** = 597 عائلة خنزير + 77 كحول (مطابقة حرفية لقوائم `scripts/repro/food-arabization-batch5/excluded_*.json` — أُعيد إنتاجها آليًا باستقلال وتطابقت 100%) |
| المنتقاة الـ80 | فحص صفًا-صفًا بحثًا عن خنزير/كحول مؤكد خارج الـ674: وُجد صفان مؤكدان — `pork-tenderloin` (لحم خنزير تندرلوين) و`bacon` (بيكون — لحم بطن خنزير مقدد بالتعريف) |
| داخل الباند | مسح كلمات شامل للـ8,076: لا يوجد أي صف يؤكد الخنزير أو الكحول بالاسم (كل مطابقات الكلمات كانت دواجن/بقري/نباتي/خل/مشروبات غازية — §3-ج) |

**قاعدة التصنيف المعتمدة (وفق نص الأمر):** لا مطابقة كلمات وحدها؛ الصف يُحذف فقط إذا كان (أ) لحم خنزير أو مشتقه المسمى بالاسم (لارد/هم/بيكون/سلامي…) أو (ب) مشروبًا كحوليًا أو منتجًا يحتوي الكحول فعلًا. **الدرع الصريح من الأمر:** «لا تحذف الأغذية النباتية أو الدواجن أو الأسماك أو المنتجات الخالية من هذه المكونات لمجرد تشابه الاسم».

## §2. قرار الحذف النهائي (668 صفًا)

| التصنيف | العدد | التفصيل |
|---|---|---|
| **عائلة الخنزير — من استبعاد الـ674** | **591** | من 597 الموثقة، بعد إقصاء 6 صفوف محمية (§3-أ) |
| **خنزير مؤكد — من المنتقاة الـ80** | **2** | `pork-tenderloin` + `bacon` (معيار الإتمام يشمل القاعدة كلها لا الـ674 وحدها) |
| **كحول — من استبعاد الـ674** | **75** | من 77 الموثقة، بعد إقصاء صفين محميين (§3-ب) |
| **الإجمالي المحذوف** | **668** | حذف فعلي من `foods.ts` وفهارسه ومشتقاته |

توزيع عائلة الخنزير المحذوفة (591): مسمى «pork» صراحة 437 · «ham» 40 · «bacon» 33 · عائلة النقانق (sausage/salami/bologna/frankfurter/kielbasa/bratwurst/pepperoni/chorizo/mortadella/wiener/hotdog/franks/wurst) 71 · دهون الخنزير (lard/drippings/bacon grease) 6 · أغذية أطفال بخنزير/هم 9 · شوربات ومرقات مع لحم خنزير 2+ · أطعمة سريعة/علامات تجارية تحتوي بيكون/هم/سلامي خنزير · خنزير بري 2.
توزيع الكحول المحذوف (75): نبيذ 36 (أحمر/أبيض/وردي/حلو/طبخ/منزوع — انظر §3-ب) · وي سكير ساور ومكوناته 13 · بيرة 10 · مقطرات (gin/rum/vodka/tequila/whiskey) 5 · كوكتيلات معلبة (daiquiri/piña colada/tequila sunrise) 4 · ليكيور قهوة/نعناع 4 · مالت/سيدر 2 · ساكيه 1.
حسب الفئة الغذائية: بروتين 444 · سناك 131 · مشروبات 74 · كربوهيدرات 12 · دهون 7.

## §3. الصفوف الثمانية المحمية (لم تُحذف — بأمر المالك الصريح)

**أ. دواجن ونباتي داخل استبعاد الخنزير (6):** صُنفت سابقًا بمطابقة الكلمات ضمن «597 خنزير» لكنها **خالية من الخنزير فعلًا** — أمر المالك يحميها حرفيًا («لا تحذف الدواجن… لمجرد تشابه الاسم»):

| الصف | الاسم | سبب الحماية |
|---|---|---|
| `usda-commodity-turkey-ham-dark-meat-smoked-frozen` | USDA Commodity, turkey ham | **لحم ديك رومي** — «Turkey ham» منتج دواجن خالٍ من الخنزير |
| `turkey-ham-sliced-extra-lean-prepackaged-or-deli-sliced` | Turkey ham, sliced, extra lean | دواجن — كما أعلاه |
| `bacon-turkey-low-sodium` | Bacon, turkey, low sodium | **بيكون رومي** — دواجن (والباند المعتمد يتضمن أصلًا `turkey-bacon-unprepared` و`turkey-bacon-microwaved` معرّبين — سابقة معتمدة) |
| `bacon-meatless` | Bacon, meatless | **نباتي** (صويا) — بلا لحم إطلاقًا |
| `bacon-bits-meatless` | Bacon bits, meatless | نباتي — كما أعلاه |
| `school-lunch-pizza-big-daddys-ls-16-51-whole-grain-rolled-ed-6689` | BIG DADDY'S Turkey Pepperoni Pizza | **بيبروني رومي** — دواجن (برامج الغداء المدرسي الأمريكية تستخدم بيبروني الرومي لأنه خالٍ من الخنزير؛ والباند يتضمن أصلًا `hormel-turkey-pepperoni` معرّبًا) |

**ب. منتجات خالية من الكحول داخل استبعاد الكحول (2):** «منتج يحتوي فعليًا على الكحول» شرط الأمر — وهذان الصفان **خاليان منه بالتعريف**:

| الصف | الاسم | سبب الحماية |
|---|---|---|
| `beverages-wine-non-alcoholic` | Beverages, Wine, non-alcoholic | **نبيذ منزوع الكحول** — المنتج نفسه غير كحولي بالتسمية (مطابق لقرار الدفعة الخامسة المعكوس أدناه) |
| `beverages-cocktail-mix-non-alcoholic-concentrated-frozen` | Cocktail mix, non-alcoholic, concentrated | **خلاصة كوكتيل بلا كحول** — خلاطة عصائر مركزّة يضاف الكحول إليها خارجيًا إن أضيف |

ملاحظة توثيقية (نقض تاريخي مُصحَّح): تقرير الدفعة الخامسة (§1) أبقى «نبيذ منزوع الكحول» ضمن مستبعدات الكحول الاسمية «تحفظًا»؛ أمر المالك الحالي («المنتجات الخالية من هذه المكونات») أسقط ذلك التحفظ الاسمي — فبقي الصفان في القاعدة بلا تعريب (nameAr إنجليزية، خارج الباند، مرايا AR لايزدكس كما هي) وأُضيفا لحراس الحماية (§6).
**صف حدي حُسم حذفه:** `malt-beverage-includes-non-alcoholic-beer` (مشروب شعير مالت) — الصنف نفسه مشروب مالت كحولي والعبارة «يشمل البيرة غير الكحولية» ملاحظة منهجية مسح USDA على الفئة لا على المنتج؛ خلافًا لصفّي §3-ب حيث يعرّف الاسمُ المنتجَ نفسه بأنه غير كحولي. و`pace-tequila-lime-salsa` حُذف (سالسا تكيلا — التكيلا مكوّن مُسمى في المنتج).

**ج. مسح داخل الباند (8,076 صفًا) — لا مؤكد واحد:** كل مطابقات الكلمات داخل الباند فُحصت: `vinegar-cider` و`vinegar-red-wine` (خل — لا كحول متبقٍ بالتعريف) · `ginger-ale` و`root-beer` (مشروبات غازية) · نقانق/بيكون/بيبروني/بولونيا **رومي/دجاج/بقري** مسمّاة · MorningStar النباتية · `frankfurter-meat`/`meat-and-poultry` و`sausage-italian-sweet-links` (اللحم غير محدد بالاسم — ليس خنزيرًا مؤكدًا؛ صنفها المشروع ضمن المقبول وبقيت معرّبة). معيار الأمر «مؤكد» لا يلتقط أيًّا منها.

## §4. حالة القاعدة بعد الحذف

| البند | قبل | بعد | ملاحظة |
|---|---|---|---|
| إجمالي الأغذية | 8,830 | **8,162** | `FOODS_COUNT = 8162` (فحص `library-counts` يثبت التطابق) |
| المنتقاة (بوسوم — معلنة بالخريطة) | 80 | **78** | حذف pork-tenderloin + bacon — الخريطة 160→**156** رابطًا |
| ذيل USDA (بلا وسوم) | 8,750 | **8,084** | حذف 666 صف ذيل |
| المعرّب (nameAr عربية) | 8,156 | **8,154** | 78 منتقاة + 8,076 باند (الباند لم يتغير) |
| خارج الباند (nameAr إنجليزية) | 674 | **8** | الصفوف الثمانية المحمية §3 — يظل خارج الباند بلا تعريب ولا إعلان |
| إثراءات الصفحات المنتقاة | 80 | **78** | أزيل إثراء pork-tenderloin وbacon من `foods-enrichment.ts` |
| فهرس البحث | 8,830 صفًا | **8,162** | أعد توليده ب`scripts/generate-search-indexes.ts` (1,960KB) |

## §5. تحديث الإحصائيات عبر المستودع (البند 6 من الأمر — كل الأرقام الحالية)

**القاعدة:** كل رقم **حالي** يُشتق من المصدر أو يحدَّث يدويًا ليطابق 8,162/78/8,084/8,154 — **والأرقام التاريخية داخل تقارير الدفعات القديمة ودفعات المقالات (`scripts/blog-runner/*.json` و`docs/*` التاريخية) لم تُمس** (نتائج تاريخية وقت إصدارها).

- **ثابت العدد:** `FOODS_COUNT` 8830 → **8162** (`src/lib/foods-shared.ts`) — وكل أسطحه مشتقة تلقائيًا (LandingView · memberships · profile · methodology · FoodsExplorer · macro-accuracy-guide · site-content · BlogComponents).
- **نسخ حرفية حُدّثت 8,830→8,162:** `seo.ts` (وصفا المنصة AR/EN) · `comparisons.ts` (16 موضعًا) · `tools-shared.ts` (4) · `metadata.ts` (3) · `llms-full.txt` (3) · `public/llms.txt` (3) · `public/manifest.json` · صفحة الأدوات AR/EN (2) · تخطيطات AR/EN للمخطط/الماكرو-تراكر/حاسبة السعرات/مخطط الوجبات/الويورك-تراكر/الأدلة/AI meal-planner/for-coaches · `PageBottomPromo` · `root-shell` · وصف محادثة EVO (`api/ai/chat`) — **الإجمالي 39 ملفًا**.
- **تعليقات الكود الواصفة للحالة الراهنة حُدّثت** (8,750→8,084 حيث تصف الذيل الحالي؛ و80→78/160→156 حيث تصف سياسة الخريطة الحالية) — والسرد التاريخي الموثق (فقرة «Before» بسياسة الخريطة 141) بقي حرفيًا.
- **توحيد AR/EN:** نفس الرقم المنسق «8,162+» في السطحين — يحرسه اختبار LAW 1 الجديد (§6).
- **منع التناقض مستقبلًا (طلب الأمر الصريح):** اختبار جديد `src/lib/__tests__/foods-count-consistency.test.ts` (4 فحوص): (1) تثبيت كل الإحصاءات المشتقة من المصدر (الإجمالي/المنتقى/الذيل/المعرّب/الباند/خارج الباند) — أي تغيير بيانات يكسره فيُحدَّث واعيًا؛ (2) تكافؤ AR/EN للرقم المعروض؛ (3) حظر الأرقام المتقاعدة (8,830/8,750/8,156 بصيغتيها) كلiterals حالية على أسطح المستخدم (src/app · src/components · src/lib · public) مع إعفاء السرد التاريخي والاختبارات؛ (4) بقاء الحذف محذوفًا (13 مرساة slug لا تعود) وبقاء المحميين الثمانية محميين.

## §6. الحراس والاختبارات المحدّثة

| الحراس | التحديث |
|---|---|
| `foods-ar-purity.test.ts` | إعادة تثبيت هاش الفريز: هوية الـslug للـ8,162 (بترتيبها) ومنتقاها الـ78 · حدّا الباند (خارج الباند) صارا يؤكدان **الحذف** (getFoodBySlug → undefined لمراسي الخنزير/الكحول/اللارد/البيكون) وبقاء الثمانية المحميين · رأس التوثيق |
| `foods-sitemap-policy.test.ts` | خارج الباند 674 → **8** (مع توثيق الحماية) · الباند 8,076 كما هو · الذيل >5,000 كما هو |
| `foods-enrichment.test.ts` | 80 → **78** |
| `macro-accuracy-chain.test.ts` | المنتقى 80→78 · الذيل 8,750→8,084 · فتحات النص 8,154 |
| `marketing-msa-surface.test.ts` | الحظر: أضيفت الأرقام المتقاعدة والجديدة (8162/8,162+) لقوائم منع الحرفيات على أسطح التسويق · التحقق الإيجابي للمطالبات (قاعدة 8,162+) |
| `low-fixes-p2-14` · `memberships-schema-surface` · `og-image-coverage` | تثبيتات الرقم الحالي + توسيع حظر OG |
| **جديد:** `foods-count-consistency.test.ts` | أربعة فحوص (§5) — بوابة منع الإحصائيات القديمة/المتناقضة |
| `library-counts` · `food-nutrient-lists` · `plan-food-grounding` · `regen-rootcause2` · `ymyl` · `homepage-adoption` | تلقائي/تعليقات — خضراء |

**إصلاح DATA TRUTH تبع للحذف (نص مشتق):** وصف قائمة «low-carb-high-protein-foods» كان يذكر البيكون (الصف المحذوف) بمواضع فهرسية — أعيد اشتقاقه بالاسم من الصفوف المرتبة نفسها (مراسي: بروتين الصويا المعزول المتصدر/جبنة بارميزان قليلة الصوديوم/فخذ عجل المطهوة ببطء) وفق قانون الدفعة الخامسة «بالاسم لا الفهرس»، والوصف ≤160 حرفًا.

## §7. SEO والصفحات المحذوفة والبنية

- **404 حقيقي:** مسارا `/foods/[slug]` و`/ar/foods/[slug]` يستدعيان `notFound()` لكل slug غير موجود — الصفحات المحذوفة (كانت 1,336 صفحة AR/EN) تستجيب **404** تلقائيًا بعد زوال الصف من المصدر، **بلا أي تحويل للرئيسية** (لا redirects مضافة — مطابق للأمر حرفيًا).
- **Sitemap:** صفوف الـ674 لم تكن معلنة أصلًا (بلا وسوم — سياسة 141)؛ أما الصفان المنتقيان المحذوفان (pork-tenderloin/bacon) كانا معلنين — زوالهما من `sitemap-foods.xml` **آلي** (الخريطة تُبنى من FOODS بوسومها): 160 → **156** رابطًا. تُحدث lastmod العائلة تلقائيًا (`familyLastmod`).
- **البحث والاقتراحات والقوائم:** فهرس البحث أعيد توليده بلا المحذوفين؛ القوائم المرتبة والمجموعات والمقارنات كلها مشتقة وقت التشغيل من FOODS فتطهر آليًا؛ الروابط الداخلية (ذات الصلة/القوائم التي تضم الصنف/المقارنات التي تبرزه) مشتقة كذلك — لا مراجع يتيمة (فحص شامل لكل الـ668 slug عبر المستودع: صفر مراجع معلقة خارج التوثيق والاختبارات المثبتة للحذف).
- **الصفحات السليمة AR/EN وhreflang:** لم يتغير أي slug قائم ولا أي زوج توأمة — الصفوف الثمانية المحمية بقيت بنفس وضعها (مرايا AR لايزدنس — قاعدة arabiclessName) وبدون أي أثر على أزواج hreflang القائمة.
- **robots.txt / sitemap index:** دون تغيير (السياسات نفسها؛ عدد الروابط داخل sitemap-foods فقط هو المتغير).

## §8. سجل الحذف الكامل (668 صفًا — الاسم وسبب كل صف)

ترتيب السجل: عائلة الخنزير (591+2=593) ثم الكحول (75)، كل قسم مرتب أبجديًا بالـslug. «استبعاد 597/77 الموثق» = قوائم `scripts/repro/food-arabization-batch5/excluded_*.json` (تصنيف المشروع المرجعي المعتمد).

### 8-أ. عائلة الخنزير — 593 صفًا

| slug | الاسم (USDA) | الفئة | سبب الحذف |
|---|---|---|---|
| `animal-fat-bacon-grease` | Animal fat, bacon grease | fat | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-apples-with-ham-strained` | Babyfood, apples with ham, strained | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-cereal-egg-yolks-and-bacon-junior` | Babyfood, cereal, egg yolks and bacon, junior | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-dinner-potatoes-with-cheese-and-ham-toddler` | Babyfood, dinner, potatoes with cheese and ham, toddler | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-dinner-vegetables-and-bacon-strained` | Babyfood, dinner, vegetables and bacon, strained | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-dinner-vegetables-and-ham-junior` | Babyfood, dinner, vegetables and ham, junior | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-dinner-vegetables-and-ham-strained` | Babyfood, dinner, vegetables and ham, strained | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-meat-ham-junior` | Babyfood, meat, ham, junior | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-meat-ham-strained` | Babyfood, meat, ham, strained | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `babyfood-meat-pork-strained` | Babyfood, meat, pork, strained | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bacon` | Bacon | fat | خنزير مؤكد — بيكون (لحم بطن الخنزير المقدد) ضمن المنتقاة |
| `bacon-and-beef-sticks` | Bacon and beef sticks | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bacon-pre-sliced-reducedlow-sodium-unprepared` | Bacon, pre-sliced, reduced/low sodium, unprepared | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `barbecue-loaf-pork-beef` | Barbecue loaf, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `beans-baked-canned-with-franks` | Beans, baked, canned, with franks | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `beans-baked-canned-with-pork` | Beans, baked, canned, with pork | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `beans-baked-canned-with-pork-and-sweet-sauce` | Beans, baked, canned, with pork and sweet sauce | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `beans-baked-canned-with-pork-and-tomato-sauce` | Beans, baked, canned, with pork and tomato sauce | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `beerwurst-beer-salami-pork` | Beerwurst, beer salami, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `beerwurst-beer-salami-pork-and-beef` | Beerwurst, beer salami, pork and beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `beerwurst-pork-and-beef` | Beerwurst, pork and beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `blood-sausage` | Blood sausage | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bockwurst-pork-veal-raw` | Bockwurst, pork, veal, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bologna-beef-and-pork` | Bologna, beef and pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bologna-beef-and-pork-low-fat` | Bologna, beef and pork, low fat | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bologna-chicken-pork` | Bologna, chicken, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bologna-chicken-pork-beef` | Bologna, chicken, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bologna-chicken-turkey-pork` | Bologna, chicken, turkey, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bologna-pork` | Bologna, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bologna-pork-and-turkey-lite` | Bologna, pork and turkey, lite | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bologna-pork-turkey-and-beef` | Bologna, pork, turkey and beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bratwurst-beef-and-pork-smoked` | Bratwurst, beef and pork, smoked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bratwurst-pork-beef-and-turkey-lite-smoked` | Bratwurst, pork, beef and turkey, lite, smoked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `bratwurst-pork-cooked` | Bratwurst, pork, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `braunschweiger-a-liver-sausage-pork` | Braunschweiger (a liver sausage), pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `brotwurst-pork-beef-link` | Brotwurst, pork, beef, link | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `burger-king-croissanwich-with-sausage-and-cheese` | BURGER KING, CROISSAN'WICH with Sausage and Cheese | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `burger-king-croissanwich-with-sausage-egg-and-cheese` | BURGER KING, CROISSAN'WICH with Sausage, Egg and Cheese | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-brown-sugar-and-bacon-flavored-baked-beans` | Campbell's Brown Sugar And Bacon Flavored Baked Beans | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-chunky-soups-baked-potato-with-cheddar-bacon-bits-` | CAMPBELL'S CHUNKY Soups, Baked Potato with Cheddar & Bacon Bits Soup | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-chunky-soups-hearty-bean-n-ham-soup` | CAMPBELL'S CHUNKY Soups, Hearty Bean 'N' Ham Soup | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-chunky-soups-old-fashioned-potato-ham-chowder` | CAMPBELL'S CHUNKY Soups, Old Fashioned Potato Ham Chowder | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-chunky-soups-split-pea-n-ham-soup` | CAMPBELL'S CHUNKY Soups, Split Pea 'N' Ham Soup | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-pork-and-beans` | Campbell's Pork and Beans | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-red-and-white-bean-with-bacon-soup-condensed` | CAMPBELL'S Red and White, Bean with Bacon Soup, condensed | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-red-and-white-split-pea-with-ham-and-bacon-soup-co` | CAMPBELL'S Red and White, Split Pea with Ham and Bacon Soup, condensed | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `campbells-soup-on-the-go-cheesy-potato-with-bacon-flavor-sou` | CAMPBELL'S Soup on the Go, Cheesy Potato with Bacon Flavor Soup | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `canadian-bacon-cooked-pan-fried` | Canadian bacon, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `canadian-bacon-unprepared` | Canadian bacon, unprepared | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `cereals-quaker-instant-grits-country-bacon-flavor-dry` | Cereals, QUAKER, Instant Grits, Country Bacon flavor, dry | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `cereals-quaker-instant-grits-ham-n-cheese-flavor-dry` | Cereals, QUAKER, Instant Grits, Ham 'n' Cheese flavor, dry | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `cereals-quaker-instant-grits-redeye-gravy-country-ham-flavor` | Cereals, QUAKER, Instant Grits, Redeye Gravy & Country Ham flavor, dry | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `cheesefurter-cheese-smokie-pork-beef` | Cheesefurter, cheese smokie, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `chorizo-pork-and-beef` | Chorizo, pork and beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `cowpeas-common-blackeyes-crowder-southern-mature-seeds-canne-4766` | Cowpeas, common (blackeyes, crowder, southern), mature seeds, canned with pork | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `digiorno-pizza-pepperoni-topping-cheese-stuffed-crust-frozen` | DIGIORNO Pizza, pepperoni topping, cheese stuffed crust, frozen, baked | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `digiorno-pizza-pepperoni-topping-rising-crust-frozen-baked` | DIGIORNO Pizza, pepperoni topping, rising crust, frozen, baked | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `digiorno-pizza-pepperoni-topping-thin-crispy-crust-frozen-ba` | DIGIORNO Pizza, pepperoni topping, thin crispy crust, frozen, baked | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `dominos-14-pepperoni-pizza-classic-hand-tossed-crust` | DOMINO'S 14" Pepperoni Pizza, Classic Hand-Tossed Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `dominos-14-pepperoni-pizza-crunchy-thin-crust` | DOMINO'S 14" Pepperoni Pizza, Crunchy Thin Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `dominos-14-pepperoni-pizza-ultimate-deep-dish-crust` | DOMINO'S 14" Pepperoni Pizza, Ultimate Deep Dish Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `dominos-14-sausage-pizza-classic-hand-tossed-crust` | DOMINO'S 14" Sausage Pizza, Classic Hand-Tossed Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `dominos-14-sausage-pizza-crunchy-thin-crust` | DOMINO'S 14" Sausage Pizza, Crunchy Thin Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `dominos-14-sausage-pizza-ultimate-deep-dish-crust` | DOMINO'S 14" Sausage Pizza, Ultimate Deep Dish Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `dutch-brand-loaf-chicken-pork-and-beef` | Dutch brand loaf, chicken, pork and beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `egg-rolls-pork-refrigerated-heated` | Egg rolls, pork, refrigerated, heated | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-food-pizza-chain-14-pizza-pepperoni-topping-regular-cru` | Fast Food, Pizza Chain, 14" pizza, pepperoni topping, regular crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-food-pizza-chain-14-pizza-pepperoni-topping-thick-crust` | Fast Food, Pizza Chain, 14" pizza, pepperoni topping, thick crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-food-pizza-chain-14-pizza-pepperoni-topping-thin-crust` | Fast Food, Pizza Chain, 14" pizza, pepperoni topping, thin crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-food-pizza-chain-14-pizza-sausage-topping-regular-crust` | Fast Food, Pizza Chain, 14" pizza, sausage topping, regular crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-food-pizza-chain-14-pizza-sausage-topping-thick-crust` | Fast Food, Pizza Chain, 14" pizza, sausage topping, thick crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-food-pizza-chain-14-pizza-sausage-topping-thin-crust` | Fast Food, Pizza Chain, 14" pizza, sausage topping, thin crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-bagel-with-egg-sausage-patty-cheese-and-condiment` | Fast foods, bagel, with egg, sausage patty, cheese, and condiments | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-biscuit-with-egg-and-bacon` | Fast foods, biscuit, with egg and bacon | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-biscuit-with-egg-and-ham` | Fast foods, biscuit, with egg and ham | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-biscuit-with-egg-and-sausage` | Fast Foods, biscuit, with egg and sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-biscuit-with-egg-cheese-and-bacon` | Fast foods, biscuit, with egg, cheese, and bacon | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-biscuit-with-ham` | Fast foods, biscuit, with ham | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-biscuit-with-sausage` | Fast foods, biscuit, with sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-breakfast-burrito-with-egg-cheese-and-sausage` | Fast foods, breakfast burrito, with egg, cheese, and sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-cheeseburger-single-large-patty-with-condiments-a` | Fast foods, cheeseburger; single, large patty; with condiments and bacon | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-cheeseburger-single-large-patty-with-condiments-v` | Fast foods, cheeseburger; single, large patty; with condiments, vegetables and ham | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-crispy-chicken-bacon-and-tomato-club-sandwich-wit` | Fast foods, crispy chicken, bacon, and tomato club sandwich, with cheese, lettuce, and mayonnaise | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-croissant-with-egg-cheese-and-bacon` | Fast foods, croissant, with egg, cheese, and bacon | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-croissant-with-egg-cheese-and-ham` | Fast foods, croissant, with egg, cheese, and ham | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-croissant-with-egg-cheese-and-sausage` | Fast foods, croissant, with egg, cheese, and sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-english-muffin-with-cheese-and-sausage` | Fast foods, english muffin, with cheese and sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-english-muffin-with-egg-cheese-and-canadian-bacon` | Fast foods, english muffin, with egg, cheese, and canadian bacon | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-english-muffin-with-egg-cheese-and-sausage` | Fast foods, english muffin, with egg, cheese, and sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-griddle-cake-sandwich-egg-cheese-and-bacon` | Fast foods, griddle cake sandwich, egg, cheese, and bacon | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-griddle-cake-sandwich-egg-cheese-and-sausage` | Fast foods, griddle cake sandwich, egg, cheese, and sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-griddle-cake-sandwich-sausage` | Fast foods, griddle cake sandwich, sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-grilled-chicken-bacon-and-tomato-club-sandwich-wi` | Fast foods, grilled chicken, bacon and tomato club sandwich, with cheese, lettuce, and mayonnaise | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-hotdog-plain` | Fast foods, hotdog, plain | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-hotdog-with-chili` | Fast foods, hotdog, with chili | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-hotdog-with-corn-flour-coating-corndog` | Fast foods, hotdog, with corn flour coating (corndog) | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-submarine-sandwich-bacon-lettuce-and-tomato-on-wh` | Fast foods, submarine sandwich, bacon, lettuce, and tomato on white bread | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-submarine-sandwich-ham-on-white-bread-with-lettuc` | Fast foods, submarine sandwich, ham on white bread with lettuce and tomato | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `fast-foods-submarine-sandwich-turkey-roast-beef-and-ham-on-w` | Fast foods, submarine sandwich, turkey, roast beef and ham on white bread with lettuce and tomato | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `frankfurter-beef-pork-and-turkey-fat-free` | Frankfurter, beef, pork, and turkey, fat free | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `frankfurter-low-sodium` | Frankfurter, low sodium | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `frankfurter-pork` | Frankfurter, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `frybread-made-with-lard-apache` | Frybread, made with lard (Apache) | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `frybread-made-with-lard-navajo` | Frybread, made with lard (Navajo) | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `game-meat-boar-wild-cooked-roasted` | Game meat, boar, wild, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `game-meat-boar-wild-raw` | Game meat, boar, wild, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `gravy-campbells-country-style-sausage` | Gravy, CAMPBELL'S, country style sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `gravy-campbells-golden-pork` | Gravy, CAMPBELL'S, golden pork | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `gravy-pork-dry-powder` | Gravy, pork, dry, powder | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-and-cheese-loaf-or-roll` | Ham and cheese loaf or roll | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-and-cheese-spread` | Ham and cheese spread | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-chopped-canned` | Ham, chopped, canned | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-chopped-not-canned` | Ham, chopped, not canned | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-honey-smoked-cooked` | Ham, honey, smoked, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-minced` | Ham, minced | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-salad-spread` | Ham salad spread | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-sliced-packaged-96-fat-free-water-added` | Ham, sliced, packaged (96% fat free, water added) | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-sliced-regular-approximately-11-fat` | Ham, sliced, regular (approximately 11% fat) | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `ham-smoked-extra-lean-low-sodium` | Ham, smoked, extra lean, low sodium | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `headcheese-pork` | Headcheese, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `hormel-always-tender-boneless-pork-loin-fresh-pork` | HORMEL ALWAYS TENDER, Boneless Pork Loin, Fresh Pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `hormel-always-tender-center-cut-chops-fresh-pork` | HORMEL ALWAYS TENDER, Center Cut Chops, Fresh Pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `hormel-always-tender-pork-loin-filets-lemon-garlic-flavored` | HORMEL ALWAYS TENDER, Pork Loin Filets, Lemon Garlic-Flavored | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `hormel-always-tender-pork-tenderloin-peppercorn-flavored` | HORMEL ALWAYS TENDER, Pork Tenderloin, Peppercorn-Flavored | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `hormel-always-tender-pork-tenderloin-teriyaki-flavored` | HORMEL ALWAYS TENDER, Pork Tenderloin, Teriyaki-Flavored | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `hormel-canadian-style-bacon` | HORMEL Canadian Style Bacon | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `hormel-cure-81-ham` | HORMEL, Cure 81 Ham | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `hot-pockets-ham-n-cheese-stuffed-sandwich-frozen` | HOT POCKETS Ham 'N Cheese Stuffed Sandwich, frozen | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `jimmy-dean-sausage-egg-and-cheese-breakfast-biscuit-frozen-u` | JIMMY DEAN, Sausage, Egg, and Cheese Breakfast Biscuit, frozen, unprepared | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `kelloggs-eggo-biscuit-scramblers-bacon-egg-cheese` | KELLOGG'S, EGGO, Biscuit Scramblers, Bacon, Egg & Cheese | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `kielbasa-fully-cooked-grilled` | Kielbasa, fully cooked, grilled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `kielbasa-fully-cooked-pan-fried` | Kielbasa, fully cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `kielbasa-fully-cooked-unheated` | Kielbasa, fully cooked, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `knackwurst-knockwurst-pork-beef` | Knackwurst, knockwurst, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `kraft-foods-shake-n-bake-original-recipe-coating-for-pork-dr` | KRAFT FOODS, SHAKE 'N' BAKE ORIGINAL RECIPE, Coating for Pork, dry | carb | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `lard` | Lard | fat | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `lean-pockets-ham-n-cheddar` | LEAN POCKETS, Ham N Cheddar | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `little-caesars-14-original-round-pepperoni-pizza-regular-cru` | LITTLE CAESARS 14" Original Round Pepperoni Pizza, Regular Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `little-caesars-14-pepperoni-pizza-large-deep-dish-crust` | LITTLE CAESARS 14" Pepperoni Pizza, Large Deep Dish Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `liver-cheese-pork` | Liver cheese, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `liver-sausage-liverwurst-pork` | Liver sausage, liverwurst, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `liverwurst-spread` | Liverwurst spread | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `luncheon-meat-pork-and-chicken-minced-canned-includes-spam-l` | Luncheon meat, pork and chicken, minced, canned, includes SPAM Lite | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `luncheon-meat-pork-canned` | Luncheon meat, pork, canned | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `luncheon-meat-pork-ham-and-chicken-minced-canned-reduced-sod` | Luncheon meat, pork, ham, and chicken, minced, canned, reduced sodium, added ascorbic acid, includes SPAM, 25% less sodium | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `luncheon-meat-pork-with-ham-minced-canned-includes-spam-horm` | Luncheon meat, pork with ham, minced, canned, includes SPAM (Hormel) | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `luncheon-sausage-pork-and-beef` | Luncheon sausage, pork and beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `luxury-loaf-pork` | Luxury loaf, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `macaroni-and-cheese-loaf-chicken-pork-and-beef` | Macaroni and cheese loaf, chicken, pork and beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-bacon-egg-cheese-biscuit` | McDONALD'S, Bacon Egg & Cheese Biscuit | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-bacon-egg-cheese-mcgriddles` | McDONALD'S, Bacon, Egg & Cheese McGRIDDLES | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-bacon-ranch-salad-with-crispy-chicken` | McDONALD'S Bacon Ranch Salad with Crispy Chicken | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-bacon-ranch-salad-with-grilled-chicken` | McDONALD'S, Bacon Ranch Salad with Grilled Chicken | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-bacon-ranch-salad-without-chicken` | McDONALD'S, Bacon Ranch Salad without chicken | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-hotcakes-and-sausage` | McDONALD'S, Hotcakes and Sausage | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-sausage-biscuit` | McDONALD'S, Sausage Biscuit | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-sausage-biscuit-with-egg` | McDONALD'S, Sausage Biscuit with Egg | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-sausage-burrito` | McDONALD'S, Sausage Burrito | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-sausage-egg-cheese-mcgriddles` | McDONALD'S, Sausage, Egg & Cheese McGRIDDLES | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-sausage-mcgriddles` | McDONALD'S, Sausage McGRIDDLES | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-sausage-mcmuffin` | McDONALD'S, Sausage McMUFFIN | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mcdonalds-sausage-mcmuffin-with-egg` | McDONALD'S, Sausage McMUFFIN with Egg | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `meat-drippings-lard-beef-tallow-mutton-tallow` | Meat drippings (lard, beef tallow, mutton tallow) | fat | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mortadella-beef-pork` | Mortadella, beef, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `mothers-loaf-pork` | Mother's loaf, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `new-england-brand-sausage-pork-beef` | New england brand sausage, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `olive-loaf-pork` | Olive loaf, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `oscar-mayer-braunschweiger-liver-sausage-sliced` | OSCAR MAYER, Braunschweiger Liver Sausage (sliced) | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `oscar-mayer-ham-chopped-with-natural-juice` | OSCAR MAYER, Ham (chopped with natural juice) | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `oscar-mayer-salami-hard` | OSCAR MAYER, Salami (hard) | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `oscar-mayer-smokies-sausage-little-cheese-pork-turkey` | OSCAR MAYER, Smokies Sausage Little Cheese (pork, turkey) | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `papa-johns-14-pepperoni-pizza-original-crust` | PAPA JOHN'S 14" Pepperoni Pizza, Original Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pasta-with-sliced-franks-in-tomato-sauce-canned-entree` | Pasta with Sliced Franks in Tomato Sauce, canned entree | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `peppered-loaf-pork-beef` | Peppered loaf, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pepperoni-beef-and-pork-sliced` | Pepperoni, beef and pork, sliced | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pickle-and-pimiento-loaf-pork` | Pickle and pimiento loaf, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `picnic-loaf-pork-beef` | Picnic loaf, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-hut-12-pepperoni-pizza-hand-tossed-crust` | PIZZA HUT 12" Pepperoni Pizza, Hand-Tossed Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-hut-12-pepperoni-pizza-pan-crust` | PIZZA HUT 12" Pepperoni Pizza, Pan Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-hut-14-pepperoni-pizza-hand-tossed-crust` | PIZZA HUT 14" Pepperoni Pizza, Hand-Tossed Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-hut-14-pepperoni-pizza-pan-crust` | PIZZA HUT 14" Pepperoni Pizza, Pan Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-hut-14-pepperoni-pizza-thin-n-crispy-crust` | PIZZA HUT 14" Pepperoni Pizza, THIN 'N CRISPY Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-hut-14-sausage-pizza-hand-tossed-crust` | PIZZA HUT 14" Sausage Pizza, Hand-Tossed Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-hut-14-sausage-pizza-pan-crust` | PIZZA HUT 14" Sausage Pizza, Pan Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-hut-14-sausage-pizza-thin-n-crispy-crust` | PIZZA HUT 14" Sausage Pizza, THIN 'N CRISPY Crust | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pizza-pepperoni-topping-regular-crust-frozen-cooked` | Pizza, pepperoni topping, regular crust, frozen, cooked | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `polish-sausage-pork` | Polish sausage, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-and-beef-sausage-fresh-cooked` | Pork and beef sausage, fresh, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-and-turkey-sausage-pre-cooked` | Pork and turkey sausage, pre-cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-bacon-rendered-fat-cooked` | Pork, bacon, rendered fat, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-bacon-cooked-baked` | Pork, cured, bacon, cooked, baked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-bacon-cooked-broiled-pan-fried-or-roasted-reduced` | Pork, cured, bacon, cooked, broiled, pan-fried or roasted, reduced sodium | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-bacon-cooked-microwaved` | Pork, cured, bacon, cooked, microwaved | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-bacon-pre-sliced-cooked-pan-fried` | Pork, cured, bacon, pre-sliced, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-bacon-unprepared` | Pork, cured, bacon, unprepared | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-breakfast-strips-raw-or-unheated` | Pork, cured, breakfast strips, raw or unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-feet-pickled` | Pork, cured, feet, pickled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-rump-bone-in-separable-lean` | Pork, cured, ham and water product, rump, bone-in, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-rump-bone-in-separable-lean-2714` | Pork, cured, ham and water product, rump, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-rump-bone-in-separable-lean-2733` | Pork, cured, ham and water product, rump, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-rump-bone-in-separable-lean-2743` | Pork, cured, ham and water product, rump, bone-in, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-shank-bone-in-separable-lea` | Pork, cured, ham and water product, shank, bone-in, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-shank-bone-in-separable-lea-2732` | Pork, cured, ham and water product, shank, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-shank-bone-in-separable-lea-2744` | Pork, cured, ham and water product, shank, bone-in, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-shank-bone-in-unheated-sepa` | Pork, cured, ham and water product, shank, bone-in, unheated, separable lean only | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-slice-bone-in-separable-lea` | Pork, cured, ham and water product, slice, bone-in, separable lean only, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-slice-bone-in-separable-lea-2715` | Pork, cured, ham and water product, slice, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-slice-bone-in-separable-lea-2731` | Pork, cured, ham and water product, slice, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-slice-bone-in-separable-lea-2745` | Pork, cured, ham and water product, slice, bone-in, separable lean and fat, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-slice-boneless-separable-le` | Pork, cured, ham and water product, slice, boneless, separable lean only, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-slice-boneless-separable-le-2746` | Pork, cured, ham and water product, slice, boneless, separable lean and fat, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-whole-boneless-separable-le` | Pork, cured, ham and water product, whole, boneless, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-whole-boneless-separable-le-2699` | Pork, cured, ham and water product, whole, boneless, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-whole-boneless-separable-le-2730` | Pork, cured, ham and water product, whole, boneless, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-and-water-product-whole-boneless-separable-le-2747` | Pork, cured, ham and water product, whole, boneless, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-boneless-extra-lean-and-regular-roasted` | Pork, cured, ham, boneless, extra lean and regular, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-boneless-extra-lean-and-regular-unheated` | Pork, cured, ham, boneless, extra lean and regular, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-boneless-extra-lean-approximately-5-fat-roast` | Pork, cured, ham, boneless, extra lean (approximately 5% fat), roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-boneless-low-sodium-extra-lean-and-regular-ro` | Pork, cured, ham, boneless, low sodium, extra lean and regular, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-boneless-low-sodium-extra-lean-approximately-` | Pork, cured, ham, boneless, low sodium, extra lean (approximately 5% fat), roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-boneless-regular-approximately-11-fat-roasted` | Pork, cured, ham, boneless, regular (approximately 11% fat), roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-center-slice-country-style-separable-lean-onl` | Pork, cured, ham, center slice, country-style, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-center-slice-separable-lean-and-fat-unheated` | Pork, cured, ham, center slice, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-extra-lean-and-regular-canned-roasted` | Pork, cured, ham, extra lean and regular, canned, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-extra-lean-and-regular-canned-unheated` | Pork, cured, ham, extra lean and regular, canned, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-extra-lean-approximately-4-fat-canned-roasted` | Pork, cured, ham, extra lean (approximately 4% fat), canned, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-extra-lean-approximately-4-fat-canned-unheate` | Pork, cured, ham, extra lean (approximately 4% fat), canned, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-low-sodium-lean-and-fat-cooked` | Pork, cured, ham, low sodium, lean and fat, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-patties-unheated` | Pork, cured, ham, patties, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-regular-approximately-13-fat-canned-roasted` | Pork, cured, ham, regular (approximately 13% fat), canned, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-rump-bone-in-separable-lean-and-fat-heated-ro` | Pork, cured, ham, rump, bone-in, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-rump-bone-in-separable-lean-and-fat-unheated` | Pork, cured, ham, rump, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-rump-bone-in-separable-lean-only-heated-roast` | Pork, cured, ham, rump, bone-in, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-rump-bone-in-separable-lean-only-unheated` | Pork, cured, ham, rump, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-separable-fat-boneless-heated` | Pork, cured, ham, separable fat, boneless, heated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-separable-fat-boneless-unheated` | Pork, cured, ham, separable fat, boneless, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-shank-bone-in-separable-lean-and-fat-heated-r` | Pork, cured, ham, shank, bone-in, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-shank-bone-in-separable-lean-and-fat-unheated` | Pork, cured, ham, shank, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-shank-bone-in-separable-lean-only-heated-roas` | Pork, cured, ham, shank, bone-in, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-shank-bone-in-separable-lean-only-unheated` | Pork, cured, ham, shank, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-slice-bone-in-separable-lean-and-fat-heated-p` | Pork, cured, ham, slice, bone-in, separable lean and fat, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-slice-bone-in-separable-lean-and-fat-unheated` | Pork, cured, ham, slice, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-slice-bone-in-separable-lean-only-heated-pan-` | Pork, cured, ham, slice, bone-in, separable lean only, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-slice-bone-in-separable-lean-only-unheated` | Pork, cured, ham, slice, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-steak-boneless-extra-lean-unheated` | Pork, cured, ham, steak, boneless, extra lean, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-rump-bone-in-separable-lean-and-f` | Pork, cured, ham -- water added, rump, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-rump-bone-in-separable-lean-and-f-2738` | Pork, cured, ham -- water added, rump, bone-in, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-rump-bone-in-separable-lean-only-` | Pork, cured, ham -- water added, rump, bone-in, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-rump-bone-in-separable-lean-only--2693` | Pork, cured, ham -- water added, rump, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-shank-bone-in-separable-lean-and-` | Pork, cured, ham -- water added, shank, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-shank-bone-in-separable-lean-and--2739` | Pork, cured, ham -- water added, shank, bone-in, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-shank-bone-in-separable-lean-only` | Pork, cured, ham -- water added, shank, bone-in, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-shank-bone-in-separable-lean-only-2712` | Pork, cured, ham -- water added, shank, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-slice-bone-in-separable-lean-and-` | Pork, cured, ham -- water added, slice, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-slice-bone-in-separable-lean-and--2740` | Pork, cured, ham -- water added, slice, bone-in, separable lean and fat, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-slice-bone-in-separable-lean-only` | Pork, cured, ham -- water added, slice, bone-in, separable lean only, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-slice-bone-in-separable-lean-only-2713` | Pork, cured, ham -- water added, slice, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-slice-boneless-separable-lean-and` | Pork, cured, ham -- water added, slice, boneless, separable lean and fat, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-slice-boneless-separable-lean-onl` | Pork, cured, ham -- water added, slice, boneless, separable lean only, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-whole-boneless-separable-lean-and` | Pork, cured, ham -- water added, whole, boneless, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-whole-boneless-separable-lean-and-2742` | Pork, cured, ham -- water added, whole, boneless, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-whole-boneless-separable-lean-onl` | Pork, cured, ham -- water added, whole, boneless, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-water-added-whole-boneless-separable-lean-onl-2707` | Pork, cured, ham -- water added, whole, boneless, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-whole-separable-lean-and-fat-unheated` | Pork, cured, ham, whole, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-whole-separable-lean-only-roasted` | Pork, cured, ham, whole, separable lean only, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-whole-separable-lean-only-unheated` | Pork, cured, ham, whole, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-rump-bone-in-separable-le` | Pork, cured, ham with natural juices, rump, bone-in, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-rump-bone-in-separable-le-2717` | Pork, cured, ham with natural juices, rump, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-rump-bone-in-separable-le-2729` | Pork, cured, ham with natural juices, rump, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-rump-bone-in-separable-le-2748` | Pork, cured, ham with natural juices, rump, bone-in, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-shank-bone-in-separable-l` | Pork, cured, ham with natural juices, shank, bone-in, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-shank-bone-in-separable-l-2718` | Pork, cured, ham with natural juices, shank, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-shank-bone-in-separable-l-2728` | Pork, cured, ham with natural juices, shank, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-shank-bone-in-separable-l-2749` | Pork, cured, ham with natural juices, shank, bone-in, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-slice-bone-in-separable-l` | Pork, cured, ham with natural juices, slice, bone-in, separable lean only, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-slice-bone-in-separable-l-2719` | Pork, cured, ham with natural juices, slice, bone-in, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-slice-bone-in-separable-l-2727` | Pork, cured, ham with natural juices, slice, bone-in, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-slice-bone-in-separable-l-2750` | Pork, cured, ham with natural juices, slice, bone-in, separable lean and fat, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-slice-boneless-separable-` | Pork, cured, ham with natural juices, slice, boneless, separable lean only, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-slice-boneless-separable--2751` | Pork, cured, ham with natural juices, slice, boneless, separable lean and fat, heated, pan-broil | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-spiral-slice-boneless-sep` | Pork, cured, ham with natural juices, spiral slice, boneless, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-spiral-slice-boneless-sep-2726` | Pork, cured, ham with natural juices, spiral slice, boneless, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-spiral-slice-boneless-sep-2752` | Pork, cured, ham with natural juices, spiral slice, boneless, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-spiral-slice-meat-only-bo` | Pork, cured, ham with natural juices, spiral slice, meat only, boneless, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-whole-boneless-separable-` | Pork, cured, ham with natural juices, whole, boneless, separable lean only, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-whole-boneless-separable--2711` | Pork, cured, ham with natural juices, whole, boneless, separable lean only, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-whole-boneless-separable--2725` | Pork, cured, ham with natural juices, whole, boneless, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-ham-with-natural-juices-whole-boneless-separable--2753` | Pork, cured, ham with natural juices, whole, boneless, separable lean and fat, heated, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-salt-pork-raw` | Pork, cured, salt pork, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-separable-fat-from-ham-and-arm-picnic-roasted` | Pork, cured, separable fat (from ham and arm picnic), roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-separable-fat-from-ham-and-arm-picnic-unheated` | Pork, cured, separable fat (from ham and arm picnic), unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-shoulder-arm-picnic-separable-lean-and-fat-roaste` | Pork, cured, shoulder, arm picnic, separable lean and fat, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-shoulder-arm-picnic-separable-lean-only-roasted` | Pork, cured, shoulder, arm picnic, separable lean only, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-shoulder-blade-roll-separable-lean-and-fat-roaste` | Pork, cured, shoulder, blade roll, separable lean and fat, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-cured-shoulder-blade-roll-separable-lean-and-fat-unheat` | Pork, cured, shoulder, blade roll, separable lean and fat, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-backfat-raw` | Pork, fresh, backfat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-backribs-separable-lean-and-fat-cooked-roasted` | Pork, fresh, backribs, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-backribs-separable-lean-and-fat-raw` | Pork, fresh, backribs, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-belly-raw` | Pork, fresh, belly, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-blade-chops-boneless-separable-lean-and-fat-cooke` | Pork, fresh, blade, (chops), boneless, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-carcass-separable-lean-and-fat-raw` | Pork, fresh, carcass, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-separable-fat-with-added-solution-co` | Pork, fresh, composite of separable fat, with added solution, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-separable-fat-with-added-solution-ra` | Pork, fresh, composite of separable fat, with added solution, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-leg-loin-shoulder-and-sparer` | Pork, fresh, composite of trimmed leg, loin, shoulder, and spareribs, (includes cuts to be cured), separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-retail-cuts-leg-loin-and-sho` | Pork, fresh, composite of trimmed retail cuts (leg, loin, and shoulder), separable lean only, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-retail-cuts-leg-loin-shoulde` | Pork, fresh, composite of trimmed retail cuts (leg, loin, shoulder), separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-retail-cuts-leg-loin-shoulde-2633` | Pork, fresh, composite of trimmed retail cuts (leg, loin, shoulder, and spareribs), separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-retail-cuts-leg-loin-shoulde-2634` | Pork, fresh, composite of trimmed retail cuts (leg, loin, shoulder, and spareribs), separable lean and fat, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-retail-cuts-loin-and-shoulde` | Pork, fresh, composite of trimmed retail cuts (loin and shoulder blade), separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-retail-cuts-loin-and-shoulde-2671` | Pork, fresh, composite of trimmed retail cuts (loin and shoulder blade), separable lean and fat, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-retail-cuts-loin-and-shoulde-2672` | Pork, fresh, composite of trimmed retail cuts (loin and shoulder blade), separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-composite-of-trimmed-retail-cuts-loin-and-shoulde-2673` | Pork, fresh, composite of trimmed retail cuts (loin and shoulder blade), separable lean only, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-enhanced-loin-tenderloin-separable-lean-only-raw` | Pork, fresh, enhanced, loin, tenderloin, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-ground-cooked` | Pork, fresh, ground, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-ground-raw` | Pork, fresh, ground, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-rump-half-separable-lean-and-fat-cooked-r` | Pork, fresh, leg (ham), rump half, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-rump-half-separable-lean-and-fat-raw` | Pork, fresh, leg (ham), rump half, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-rump-half-separable-lean-only-cooked-roas` | Pork, fresh, leg (ham), rump half, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-rump-half-separable-lean-only-raw` | Pork, fresh, leg (ham), rump half, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-shank-half-separable-lean-and-fat-cooked-` | Pork, fresh, leg (ham), shank half, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-shank-half-separable-lean-and-fat-raw` | Pork, fresh, leg (ham), shank half, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-shank-half-separable-lean-only-cooked-roa` | Pork, fresh, leg (ham), shank half, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-shank-half-separable-lean-only-raw` | Pork, fresh, leg (ham), shank half, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-whole-separable-lean-and-fat-cooked-roast` | Pork, fresh, leg (ham), whole, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-whole-separable-lean-and-fat-raw` | Pork, fresh, leg (ham), whole, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-whole-separable-lean-only-cooked-roasted` | Pork, fresh, leg (ham), whole, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-leg-ham-whole-separable-lean-only-raw` | Pork, fresh, leg (ham), whole, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-bone-in-separable-lean-and-fat-c` | Pork, fresh, loin, blade (chops), bone-in, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-bone-in-separable-lean-and-fat-c-2505` | Pork, fresh, loin, blade (chops), bone-in, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-bone-in-separable-lean-and-fat-c-2624` | Pork, fresh, loin, blade (chops), bone-in, separable lean and fat, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-bone-in-separable-lean-only-cook` | Pork, fresh, loin, blade (chops), bone-in, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-bone-in-separable-lean-only-cook-2509` | Pork, fresh, loin, blade (chops), bone-in, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-bone-in-separable-lean-only-cook-2590` | Pork, fresh, loin, blade (chops), bone-in, separable lean only, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-boneless-separable-lean-only-bon` | Pork, fresh, loin, blade (chops), boneless, separable lean only, boneless, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-or-roasts-bone-in-separable-lean` | Pork, fresh, loin, blade (chops or roasts), bone-in, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-or-roasts-bone-in-separable-lean-2507` | Pork, fresh, loin, blade (chops or roasts), bone-in, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-or-roasts-boneless-separable-lea` | Pork, fresh, loin, blade (chops or roasts), boneless, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-chops-or-roasts-boneless-separable-lea-2804` | Pork, fresh, loin, blade (chops or roasts), boneless, separable lean and fat only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-roasts-bone-in-separable-lean-and-fat-` | Pork, fresh, loin, blade (roasts), bone-in, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-roasts-bone-in-separable-lean-only-coo` | Pork, fresh, loin, blade (roasts), bone-in, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-roasts-boneless-separable-lean-and-fat` | Pork, fresh, loin, blade (roasts), boneless, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-blade-roasts-boneless-separable-lean-only-co` | Pork, fresh, loin, blade (roasts), boneless, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-bone-in-separable-lean-and` | Pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-bone-in-separable-lean-and-2512` | Pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-bone-in-separable-lean-and-2513` | Pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-bone-in-separable-lean-and-2625` | Pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-bone-in-separable-lean-onl` | Pork, fresh, loin, center loin (chops), bone-in, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-bone-in-separable-lean-onl-2516` | Pork, fresh, loin, center loin (chops), bone-in, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-bone-in-separable-lean-onl-2517` | Pork, fresh, loin, center loin (chops), bone-in, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-bone-in-separable-lean-onl-2622` | Pork, fresh, loin, center loin (chops), bone-in, separable lean only, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-boneless-separable-lean-an` | Pork, fresh, loin, center loin (chops), boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-boneless-separable-lean-an-2635` | Pork, fresh, loin, center loin (chops), boneless, separable lean and fat, cooked, pan-broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-boneless-separable-lean-on` | Pork, fresh, loin, center loin (chops), boneless, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-chops-boneless-separable-lean-on-2610` | Pork, fresh, loin, center loin (chops), boneless, separable lean only, cooked, pan-broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-roasts-bone-in-separable-lean-an` | Pork, fresh, loin, center loin (roasts), bone-in, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-loin-roasts-bone-in-separable-lean-on` | Pork, fresh, loin, center loin (roasts), bone-in, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-bone-in-separable-lean-and-` | Pork, fresh, loin, center rib (chops), bone-in, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-bone-in-separable-lean-and--2521` | Pork, fresh, loin, center rib (chops), bone-in, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-bone-in-separable-lean-and--2626` | Pork, fresh, loin, center rib (chops), bone-in, separable lean and fat, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-bone-in-separable-lean-only` | Pork, fresh, loin, center rib (chops), bone-in, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-bone-in-separable-lean-only-2525` | Pork, fresh, loin, center rib (chops), bone-in, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-bone-in-separable-lean-only-2623` | Pork, fresh, loin, center rib (chops), bone-in, separable lean only, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-boneless-separable-lean-and` | Pork, fresh, loin, center rib (chops), boneless, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-boneless-separable-lean-and-2640` | Pork, fresh, loin, center rib (chops), boneless, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-boneless-separable-lean-and-2641` | Pork, fresh, loin, center rib (chops), boneless, separable lean and fat, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-boneless-separable-lean-onl` | Pork, fresh, loin, center rib (chops), boneless, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-boneless-separable-lean-onl-2645` | Pork, fresh, loin, center rib (chops), boneless, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-boneless-separable-lean-onl-2646` | Pork, fresh, loin, center rib (chops), boneless, separable lean only, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-or-roasts-bone-in-separable` | Pork, fresh, loin, center rib (chops or roasts), bone-in, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-or-roasts-bone-in-separable-2523` | Pork, fresh, loin, center rib (chops or roasts), bone-in, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-or-roasts-boneless-separabl` | Pork, fresh, loin, center rib (chops or roasts), boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-chops-or-roasts-boneless-separabl-2643` | Pork, fresh, loin, center rib (chops or roasts), boneless, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-roasts-bone-in-separable-lean-and` | Pork, fresh, loin, center rib (roasts), bone-in, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-roasts-bone-in-separable-lean-onl` | Pork, fresh, loin, center rib (roasts), bone-in, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-roasts-boneless-separable-lean-an` | Pork, fresh, loin, center rib (roasts), boneless, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-center-rib-roasts-boneless-separable-lean-on` | Pork, fresh, loin, center rib (roasts), boneless, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-and-fat-bo` | Pork, fresh, loin, country-style ribs, separable lean and fat, bone-in, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-and-fat-bo-2806` | Pork, fresh, loin, country-style ribs, separable lean and fat, boneless, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-and-fat-bo-2807` | Pork, fresh, loin, country-style ribs, separable lean and fat, bone-in, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-and-fat-bo-2808` | Pork, fresh, loin, country-style ribs, separable lean and fat, boneless, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-and-fat-co` | Pork, fresh, loin, country-style ribs, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-and-fat-ra` | Pork, fresh, loin, country-style ribs, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-only-bone-` | Pork, fresh, loin, country-style ribs, separable lean only, bone-in, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-only-bone--2801` | Pork, fresh, loin, country-style ribs, separable lean only, bone-in, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-only-bonel` | Pork, fresh, loin, country-style ribs, separable lean only, boneless, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-only-bonel-2802` | Pork, fresh, loin, country-style ribs, separable lean only, boneless, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-only-cooke` | Pork, fresh, loin, country-style ribs, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-country-style-ribs-separable-lean-only-raw` | Pork, fresh, loin, country-style ribs, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-bone-in-separable-lean-and-fat` | Pork, fresh, loin, sirloin (chops), bone-in, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-bone-in-separable-lean-and-fat-2529` | Pork, fresh, loin, sirloin (chops), bone-in, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-bone-in-separable-lean-only-co` | Pork, fresh, loin, sirloin (chops), bone-in, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-bone-in-separable-lean-only-co-2533` | Pork, fresh, loin, sirloin (chops), bone-in, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-boneless-separable-lean-and-fa` | Pork, fresh, loin, sirloin (chops), boneless, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-boneless-separable-lean-and-fa-2656` | Pork, fresh, loin, sirloin (chops), boneless, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-boneless-separable-lean-only-c` | Pork, fresh, loin, sirloin (chops), boneless, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-boneless-separable-lean-only-c-2660` | Pork, fresh, loin, sirloin (chops), boneless, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-or-roasts-bone-in-separable-le` | Pork, fresh, loin, sirloin (chops or roasts), bone-in, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-or-roasts-bone-in-separable-le-2531` | Pork, fresh, loin, sirloin (chops or roasts), bone-in, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-or-roasts-boneless-separable-l` | Pork, fresh, loin, sirloin (chops or roasts), boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-chops-or-roasts-boneless-separable-l-2658` | Pork, fresh, loin, sirloin (chops or roasts), boneless, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-roasts-bone-in-separable-lean-and-fa` | Pork, fresh, loin, sirloin (roasts), bone-in, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-roasts-bone-in-separable-lean-only-c` | Pork, fresh, loin, sirloin (roasts), bone-in, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-roasts-boneless-separable-lean-and-f` | Pork, fresh, loin, sirloin (roasts), boneless, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-sirloin-roasts-boneless-separable-lean-only-` | Pork, fresh, loin, sirloin (roasts), boneless, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-and-fat-cooked-bro` | Pork, fresh, loin, tenderloin, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-and-fat-cooked-roa` | Pork, fresh, loin, tenderloin, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-and-fat-raw` | Pork, fresh, loin, tenderloin, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-and-fat-with-added` | Pork, fresh, loin, tenderloin, separable lean and fat, with added solution, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-and-fat-with-added-2775` | Pork, fresh, loin, tenderloin, separable lean and fat, with added solution, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-only-cooked-broile` | Pork, fresh, loin, tenderloin, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-only-cooked-roaste` | Pork, fresh, loin, tenderloin, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-only-raw` | Pork, fresh, loin, tenderloin, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-tenderloin-separable-lean-only-with-added-so` | Pork, fresh, loin, tenderloin, separable lean only, with added solution, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-and-f` | Pork, fresh, loin, top loin (chops), boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-and-f-2538` | Pork, fresh, loin, top loin (chops), boneless, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-and-f-2539` | Pork, fresh, loin, top loin (chops), boneless, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-and-f-2632` | Pork, fresh, loin, top loin (chops), boneless, separable lean and fat, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-and-f-2686` | Pork, fresh, loin, top loin (chops), boneless, separable lean and fat, with added solution, cooked, pan-broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-and-f-2772` | Pork, fresh, loin, top loin (chops), boneless, separable lean and fat, with added solution, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-and-f-2773` | Pork, fresh, loin, top loin (chops), boneless, separable lean and fat, with added solution, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-only-` | Pork, fresh, loin, top loin (chops), boneless, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-only--2542` | Pork, fresh, loin, top loin (chops), boneless, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-only--2543` | Pork, fresh, loin, top loin (chops), boneless, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-only--2627` | Pork, fresh, loin, top loin (chops), boneless, separable lean only, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-only--2685` | Pork, fresh, loin, top loin (chops), boneless, separable lean only, with added solution, cooked, pan-broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-only--2770` | Pork, fresh, loin, top loin (chops), boneless, separable lean only, with added solution, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-chops-boneless-separable-lean-only--2771` | Pork, fresh, loin, top loin (chops), boneless, separable lean only, with added solution, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-roasts-boneless-separable-lean-and-` | Pork, fresh, loin, top loin (roasts), boneless, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-roasts-boneless-separable-lean-and--2668` | Pork, fresh, loin, top loin (roasts), boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-roasts-boneless-separable-lean-only` | Pork, fresh, loin, top loin (roasts), boneless, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-top-loin-roasts-boneless-separable-lean-only-2669` | Pork, fresh, loin, top loin (roasts), boneless, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-whole-separable-lean-and-fat-cooked-braised` | Pork, fresh, loin, whole, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-whole-separable-lean-and-fat-cooked-broiled` | Pork, fresh, loin, whole, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-whole-separable-lean-and-fat-cooked-roasted` | Pork, fresh, loin, whole, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-whole-separable-lean-and-fat-raw` | Pork, fresh, loin, whole, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-whole-separable-lean-only-cooked-braised` | Pork, fresh, loin, whole, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-whole-separable-lean-only-cooked-broiled` | Pork, fresh, loin, whole, separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-whole-separable-lean-only-cooked-roasted` | Pork, fresh, loin, whole, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-loin-whole-separable-lean-only-raw` | Pork, fresh, loin, whole, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-separable-fat-cooked` | Pork, fresh, separable fat, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-separable-fat-raw` | Pork, fresh, separable fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-arm-picnic-separable-lean-and-fat-cooked` | Pork, fresh, shoulder, arm picnic, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-arm-picnic-separable-lean-and-fat-cooked-2551` | Pork, fresh, shoulder, arm picnic, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-arm-picnic-separable-lean-and-fat-raw` | Pork, fresh, shoulder, arm picnic, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-arm-picnic-separable-lean-only-cooked-br` | Pork, fresh, shoulder, arm picnic, separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-arm-picnic-separable-lean-only-cooked-ro` | Pork, fresh, shoulder, arm picnic, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-arm-picnic-separable-lean-only-raw` | Pork, fresh, shoulder, arm picnic, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-blade-boston-roasts-separable-lean-and-f` | Pork, fresh, shoulder, blade, boston (roasts), separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-blade-boston-roasts-separable-lean-only-` | Pork, fresh, shoulder, blade, boston (roasts), separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-blade-boston-steaks-separable-lean-and-f` | Pork, fresh, shoulder, blade, boston (steaks), separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-blade-boston-steaks-separable-lean-only-` | Pork, fresh, shoulder, blade, boston (steaks), separable lean only, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-boston-butt-blade-steaks-separable-lean-` | Pork, fresh, shoulder, (Boston butt), blade (steaks), separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-boston-butt-blade-steaks-separable-lean--2556` | Pork, fresh, shoulder, (Boston butt), blade (steaks), separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-boston-butt-blade-steaks-separable-lean--2559` | Pork, fresh, shoulder, (Boston butt), blade (steaks), separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-boston-butt-blade-steaks-separable-lean--2560` | Pork, fresh, shoulder, (Boston butt), blade (steaks), separable lean only, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-boston-butt-blade-steaks-separable-lean--2768` | Pork, fresh, shoulder, (Boston butt), blade (steaks), separable lean only, with added solution cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-boston-butt-blade-steaks-separable-lean--2769` | Pork, fresh, shoulder, (Boston butt), blade (steaks), separable lean only, with added solution, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-boston-butt-blade-steaks-separable-lean--2776` | Pork, fresh, shoulder, (Boston butt), blade (steaks), separable lean and fat,with added solution, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-boston-butt-blade-steaks-separable-lean--2777` | Pork, fresh, shoulder, (Boston butt), blade (steaks), separable lean and fat, with added solution, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-whole-separable-lean-and-fat-cooked-roas` | Pork, fresh, shoulder, whole, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-whole-separable-lean-and-fat-raw` | Pork, fresh, shoulder, whole, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-whole-separable-lean-only-cooked-roasted` | Pork, fresh, shoulder, whole, separable lean only, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-shoulder-whole-separable-lean-only-raw` | Pork, fresh, shoulder, whole, separable lean only, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-spareribs-separable-lean-and-fat-cooked-braised` | Pork, fresh, spareribs, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-spareribs-separable-lean-and-fat-cooked-roasted` | Pork, fresh, spareribs, separable lean and fat, cooked, roasted | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-spareribs-separable-lean-and-fat-raw` | Pork, fresh, spareribs, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-brain-cooked-braise` | Pork, fresh, variety meats and by-products, brain, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-brain-raw` | Pork, fresh, variety meats and by-products, brain, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-chitterlings-cooked` | Pork, fresh, variety meats and by-products, chitterlings, cooked, simmered | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-chitterlings-raw` | Pork, fresh, variety meats and by-products, chitterlings, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-ears-frozen-cooked-` | Pork, fresh, variety meats and by-products, ears, frozen, cooked, simmered | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-ears-frozen-raw` | Pork, fresh, variety meats and by-products, ears, frozen, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-feet-cooked-simmere` | Pork, fresh, variety meats and by-products, feet, cooked, simmered | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-feet-raw` | Pork, fresh, variety meats and by-products, feet, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-heart-cooked-braise` | Pork, fresh, variety meats and by-products, heart, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-heart-raw` | Pork, fresh, variety meats and by-products, heart, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-jowl-raw` | Pork, fresh, variety meats and by-products, jowl, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-kidneys-cooked-brai` | Pork, fresh, variety meats and by-products, kidneys, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-kidneys-raw` | Pork, fresh, variety meats and by-products, kidneys, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-leaf-fat-raw` | Pork, fresh, variety meats and by-products, leaf fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-liver-cooked-braise` | Pork, fresh, variety meats and by-products, liver, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-liver-raw` | Pork, fresh, variety meats and by-products, liver, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-lungs-cooked-braise` | Pork, fresh, variety meats and by-products, lungs, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-lungs-raw` | Pork, fresh, variety meats and by-products, lungs, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-mechanically-separa` | Pork, fresh, variety meats and by-products, mechanically separated, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-pancreas-cooked-bra` | Pork, fresh, variety meats and by-products, pancreas, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-pancreas-raw` | Pork, fresh, variety meats and by-products, pancreas, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-spleen-cooked-brais` | Pork, fresh, variety meats and by-products, spleen, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-spleen-raw` | Pork, fresh, variety meats and by-products, spleen, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-stomach-cooked-simm` | Pork, fresh, variety meats and by-products, stomach, cooked, simmered | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-stomach-raw` | Pork, fresh, variety meats and by-products, stomach, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-tail-cooked-simmere` | Pork, fresh, variety meats and by-products, tail, cooked, simmered | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-tail-raw` | Pork, fresh, variety meats and by-products, tail, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-tongue-cooked-brais` | Pork, fresh, variety meats and by-products, tongue, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-fresh-variety-meats-and-by-products-tongue-raw` | Pork, fresh, variety meats and by-products, tongue, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-ground-72-lean-28-fat-cooked-crumbles` | Pork, ground, 72% lean / 28% fat, cooked, crumbles | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-ground-72-lean-28-fat-cooked-pan-broiled` | Pork, ground, 72% lean / 28% fat, cooked, pan-broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-ground-84-lean-16-fat-cooked-crumbles` | Pork, ground, 84% lean / 16% fat, cooked, crumbles | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-ground-84-lean-16-fat-cooked-pan-broiled` | Pork, ground, 84% lean / 16% fat, cooked, pan-broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-ground-84-lean-16-fat-raw` | Pork, ground, 84% lean / 16% fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-ground-96-lean-4-fat-cooked-crumbles` | Pork, ground, 96% lean / 4% fat, cooked, crumbles | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-ground-96-lean-4-fat-cooked-pan-broiled` | Pork, ground, 96% lean / 4% fat, cooked, pan-broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-ground-96-lean-4-fat-raw` | Pork, ground, 96% lean / 4% fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-leg-cap-steak-boneless-separable-lean-and-fat-raw` | Pork, Leg Cap Steak, boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-leg-sirloin-tip-roast-boneless-separable-lean-and-fat-c` | Pork, Leg sirloin tip roast, boneless, separable lean and fat, cooked, braised | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-leg-sirloin-tip-roast-boneless-separable-lean-and-fat-r` | Pork, Leg sirloin tip roast, boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-loin-fresh-backribs-bone-in-cooked-roasted-lean-only` | Pork loin, fresh, backribs, bone-in, cooked-roasted, lean only | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-loin-fresh-backribs-bone-in-raw-lean-only` | Pork loin, fresh, backribs, bone-in, raw, lean only | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-loin-leg-cap-steak-boneless-separable-lean-and-fat-cook` | Pork, loin, leg cap steak, boneless, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-oriental-style-dehydrated` | Pork, oriental style, dehydrated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-pickled-pork-hocks` | Pork, pickled pork hocks | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-sausage-linkpatty-cooked-pan-fried` | Pork sausage, link/patty, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-sausage-linkpatty-fully-cooked-microwaved` | Pork sausage, link/patty, fully cooked, microwaved | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-sausage-linkpatty-fully-cooked-unheated` | Pork sausage, link/patty, fully cooked, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-sausage-linkpatty-reduced-fat-cooked-pan-fried` | Pork sausage, link/patty, reduced fat, cooked, pan-fried | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-sausage-linkpatty-reduced-fat-unprepared` | Pork sausage, link/patty, reduced fat, unprepared | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-sausage-linkpatty-unprepared` | Pork sausage, link/patty, unprepared | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-sausage-reduced-sodium-cooked` | Pork sausage, reduced sodium, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-sausage-rice-links-brown-and-serve-cooked` | Pork sausage rice links, brown and serve, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-shoulder-breast-boneless-separable-lean-and-fat-cooked-` | Pork, Shoulder breast, boneless, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-shoulder-breast-boneless-separable-lean-and-fat-raw` | Pork, Shoulder breast, boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-shoulder-petite-tender-boneless-separable-lean-and-fat-` | Pork, shoulder, petite tender, boneless, separable lean and fat, cooked, broiled | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-shoulder-petite-tender-boneless-separable-lean-and-fat--2784` | Pork, Shoulder petite tender, boneless, separable lean and fat, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pork-tenderloin` | Pork Tenderloin | protein | خنزير مؤكد — قطعة لحم خنزير (تندرلوين) ضمن المنتقاة |
| `potsticker-or-wonton-pork-and-vegetable-frozen-unprepared` | Potsticker or wonton, pork and vegetable, frozen, unprepared | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `prego-pasta-italian-sausage-and-garlic-italian-sauce-ready-t` | PREGO Pasta, Italian Sausage and Garlic Italian Sauce, ready-to-serve | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `pulled-pork-in-barbecue-sauce` | Pulled pork in barbecue sauce | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `restaurant-chinese-sweet-and-sour-pork` | Restaurant, Chinese, sweet and sour pork | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `restaurant-latino-pupusas-del-cerdo-pupusas-pork` | Restaurant, Latino, pupusas del cerdo (pupusas, pork) | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `restaurant-latino-tamale-pork` | Restaurant, Latino, tamale, pork | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `salad-dressing-bacon-and-tomato` | Salad dressing, bacon and tomato | fat | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `salami-cooked-beef-and-pork` | Salami, cooked, beef and pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `salami-dry-or-hard-pork` | Salami, dry or hard, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `salami-dry-or-hard-pork-beef` | Salami, dry or hard, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `salami-italian-pork` | Salami, Italian, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `salami-italian-pork-and-beef-dry-sliced-50-less-sodium` | Salami, Italian, pork and beef, dry, sliced, 50% less sodium | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `salami-pork-beef-less-sodium` | Salami, pork, beef, less sodium | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sandwich-spread-pork-beef` | Sandwich spread, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-berliner-pork-beef` | Sausage, Berliner, pork, beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-chicken-beef-pork-skinless-smoked` | Sausage, chicken, beef, pork, skinless, smoked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-egg-and-cheese-breakfast-biscuit` | Sausage, egg and cheese breakfast biscuit | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-italian-pork-cooked` | Sausage, Italian, pork, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-italian-pork-raw` | Sausage, Italian, pork, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-polish-pork-and-beef-smoked` | Sausage, Polish, pork and beef, smoked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-pork-and-beef-with-cheddar-cheese-smoked` | Sausage, pork and beef, with cheddar cheese, smoked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-pork-turkey-and-beef-reduced-sodium` | Sausage, pork, turkey, and beef, reduced sodium | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-smoked-link-sausage-pork-and-beef` | Sausage, smoked link sausage, pork and beef | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-summer-pork-and-beef-sticks-with-cheddar-cheese` | Sausage, summer, pork and beef, sticks, with cheddar cheese | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `sausage-vienna-canned-chicken-beef-pork` | Sausage, Vienna, canned, chicken, beef, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `school-lunch-pizza-pepperoni-topping-thick-crust-whole-grain` | School Lunch, pizza, pepperoni topping, thick crust, whole grain, frozen, cooked | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `school-lunch-pizza-pepperoni-topping-thin-crust-whole-grain-` | School Lunch, pizza, pepperoni topping, thin crust, whole grain, frozen, cooked | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `school-lunch-pizza-sausage-topping-thick-crust-whole-grain-f` | School Lunch, pizza, sausage topping, thick crust, whole grain, frozen, cooked | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `school-lunch-pizza-sausage-topping-thin-crust-whole-grain-fr` | School Lunch, pizza, sausage topping, thin crust, whole grain, frozen, cooked | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `school-lunch-pizza-tonys-breakfast-pizza-sausage-frozen` | School Lunch, pizza, TONY'S Breakfast Pizza Sausage, frozen | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `school-lunch-pizza-tonys-smartpizza-whole-grain-4x6-pepperon` | School Lunch, pizza, TONY'S SMARTPIZZA Whole Grain 4x6 Pepperoni Pizza 50/50 Cheese, frozen | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `scrapple-pork` | Scrapple, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `shortening-household-lard-and-vegetable-oil` | Shortening, household, lard and vegetable oil | fat | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `shortening-industrial-lard-and-vegetable-oil` | Shortening industrial, lard and vegetable oil | fat | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `smoked-link-sausage-pork` | Smoked link sausage, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `smoked-link-sausage-pork-and-beef-nonfat-dry-milk-added` | Smoked link sausage, pork and beef, nonfat dry milk added | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `snacks-pork-skins-barbecue-flavor` | Snacks, pork skins, barbecue-flavor | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `snacks-pork-skins-plain` | Snacks, pork skins, plain | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-bean-ham-canned-reduced-sodium-prepared-with-water-or-r` | Soup, bean & ham, canned, reduced sodium, prepared with water or ready-to-serve | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-bean-with-bacon-condensed-single-brand` | Soup, bean with bacon, condensed, single brand | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-bean-with-frankfurters-canned-condensed` | Soup, bean with frankfurters, canned, condensed | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-bean-with-frankfurters-canned-prepared-with-equal-volum` | Soup, bean with frankfurters, canned, prepared with equal volume water | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-bean-with-ham-canned-chunky-ready-to-serve` | Soup, bean with ham, canned, chunky, ready-to-serve | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-bean-with-pork-canned-condensed` | Soup, bean with pork, canned, condensed | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-bean-with-pork-canned-prepared-with-equal-volume-water` | Soup, bean with pork, canned, prepared with equal volume water | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-lentil-with-ham-canned-ready-to-serve` | Soup, lentil with ham, canned, ready-to-serve | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-pea-split-with-ham-canned-chunky-ready-to-serve` | Soup, pea, split with ham, canned, chunky, ready-to-serve | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-pea-split-with-ham-canned-condensed` | Soup, pea, split with ham, canned, condensed | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-pea-split-with-ham-canned-prepared-with-equal-volume-wa` | Soup, pea, split with ham, canned, prepared with equal volume water | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-potato-ham-chowder-chunky-ready-to-serve-single-brand` | Soup, potato ham chowder, chunky, ready-to-serve, single brand | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-split-pea-with-ham-and-bacon-canned-condensed-single-br` | Soup, split pea with ham and bacon, canned, condensed, single brand | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `soup-split-pea-with-ham-chunky-reduced-fat-reduced-sodium-re` | Soup, split pea with ham, chunky, reduced fat, reduced sodium, ready-to-serve, single brand | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `spaghettios-spaghettios-with-sliced-franks` | SPAGHETTIOS, SpaghettiOs with Sliced Franks | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `split-pea-with-ham-soup-canned-reduced-sodium-prepared-with-` | Split pea with ham soup, canned, reduced sodium, prepared with water or ready-to-serve | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `subway-black-forest-ham-sub-on-white-bread-with-lettuce-and-` | SUBWAY, black forest ham sub on white bread with lettuce and tomato | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `subway-blt-sub-on-white-bread-with-bacon-lettuce-and-tomato` | SUBWAY, B.L.T. sub on white bread with bacon, lettuce and tomato | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `supper-bakes-meal-kits-savory-pork-chops-with-herb-stuffing-` | SUPPER BAKES MEAL KITS, Savory Pork Chops with herb stuffing (pork chop not included) | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `swisswurst-pork-and-beef-with-swiss-cheese-smoked` | Swisswurst, pork and beef, with swiss cheese, smoked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `tamales-masa-and-pork-filling-hopi` | Tamales, masa and pork filling (Hopi) | snack | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `thuringer-cervelat-summer-sausage-beef-pork` | Thuringer, cervelat, summer sausage, beef, pork | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `turkey-and-pork-sausage-fresh-bulk-patty-or-link-cooked` | Turkey and pork sausage, fresh, bulk, patty or link, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `turkey-pork-and-beef-sausage-low-fat-smoked` | Turkey, pork, and beef sausage, low fat, smoked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `usda-commodity-pork-canned` | USDA Commodity, pork, canned | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `usda-commodity-pork-cured-ham-boneless-cooked-heated` | USDA Commodity, pork, cured, ham, boneless, cooked, heated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `usda-commodity-pork-cured-ham-boneless-cooked-unheated` | USDA Commodity, pork, cured, ham, boneless, cooked, unheated | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `usda-commodity-pork-ground-finecoarse-frozen-cooked` | USDA Commodity, pork, ground, fine/coarse, frozen, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `usda-commodity-pork-ground-finecoarse-frozen-raw` | USDA Commodity, pork, ground, fine/coarse, frozen, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `usda-commodity-pork-sausage-bulklinkspatties-frozen-cooked` | USDA Commodity, pork, sausage, bulk/links/patties, frozen, cooked | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |
| `usda-commodity-pork-sausage-bulklinkspatties-frozen-raw` | USDA Commodity, pork sausage, bulk/links/patties, frozen, raw | protein | عائلة الخنزير — ضمن استبعاد 597 الموثق |

### 8-ب. الكحول — 75 صفًا

| slug | الاسم (USDA) | الفئة | سبب الحذف |
|---|---|---|---|
| `alcoholic-beverage-beer-light` | Alcoholic beverage, beer, light | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-beer-light-bud-light` | Alcoholic beverage, beer, light, BUD LIGHT | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-beer-light-budweiser-select` | Alcoholic beverage, beer, light, BUDWEISER SELECT | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-beer-light-higher-alcohol` | Alcoholic beverage, beer, light, higher alcohol | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-beer-light-low-carb` | Alcoholic beverage, beer, light, low carb | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-beer-regular-all` | Alcoholic beverage, beer, regular, all | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-beer-regular-budweiser` | Alcoholic beverage, beer, regular, BUDWEISER | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-creme-de-menthe-72-proof` | Alcoholic beverage, creme de menthe, 72 proof | drink | كحول — ليكيور نعناع 72 بروف |
| `alcoholic-beverage-daiquiri-canned` | Alcoholic beverage, daiquiri, canned | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-daiquiri-prepared-from-recipe` | Alcoholic beverage, daiquiri, prepared-from-recipe | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-all-gin-rum-vodka-whiskey-100-p` | Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 100 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-all-gin-rum-vodka-whiskey-80-pr` | Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 80 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-all-gin-rum-vodka-whiskey-86-pr` | Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 86 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-all-gin-rum-vodka-whiskey-90-pr` | Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 90 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-all-gin-rum-vodka-whiskey-94-pr` | Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 94 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-gin-90-proof` | Alcoholic beverage, distilled, gin, 90 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-rum-80-proof` | Alcoholic beverage, distilled, rum, 80 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-vodka-80-proof` | Alcoholic beverage, distilled, vodka, 80 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-distilled-whiskey-86-proof` | Alcoholic beverage, distilled, whiskey, 86 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-liqueur-coffee-53-proof` | Alcoholic beverage, liqueur, coffee, 53 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-liqueur-coffee-63-proof` | Alcoholic beverage, liqueur, coffee, 63 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-liqueur-coffee-with-cream-34-proof` | Alcoholic beverage, liqueur, coffee with cream, 34 proof | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-malt-beer-hard-lemonade` | Alcoholic beverage, malt beer, hard lemonade | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-pina-colada-canned` | Alcoholic beverage, pina colada, canned | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-pina-colada-prepared-from-recipe` | Alcoholic beverage, pina colada, prepared-from-recipe | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-rice-sake` | Alcoholic beverage, rice (sake) | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-tequila-sunrise-canned` | Alcoholic beverage, tequila sunrise, canned | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-whiskey-sour` | Alcoholic beverage, whiskey sour | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-whiskey-sour-canned` | Alcoholic beverage, whiskey sour, canned | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-whiskey-sour-prepared-from-item-14028` | Alcoholic beverage, whiskey sour, prepared from item 14028 | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-whiskey-sour-prepared-with-water-whiskey-` | Alcoholic beverage, whiskey sour, prepared with water, whiskey and powder mix | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-cooking` | Alcoholic beverage, wine, cooking | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-dessert-dry` | Alcoholic beverage, wine, dessert, dry | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-dessert-sweet` | Alcoholic beverage, wine, dessert, sweet | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-light` | Alcoholic beverage, wine, light | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-all` | Alcoholic beverage, wine, table, all | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red` | Alcoholic beverage, wine, table, red | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-barbera` | Alcoholic Beverage, wine, table, red, Barbera | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-burgundy` | Alcoholic Beverage, wine, table, red, Burgundy | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-cabernet-franc` | Alcoholic Beverage, wine, table, red, Cabernet Franc | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-cabernet-sauvignon` | Alcoholic Beverage, wine, table, red, Cabernet Sauvignon | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-carignane` | Alcoholic Beverage, wine, table, red, Carignane | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-claret` | Alcoholic Beverage, wine, table, red, Claret | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-gamay` | Alcoholic Beverage, wine, table, red, Gamay | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-lemberger` | Alcoholic Beverage, wine, table, red, Lemberger | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-merlot` | Alcoholic Beverage, wine, table, red, Merlot | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-mouvedre` | Alcoholic Beverage, wine, table, red, Mouvedre | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-petite-sirah` | Alcoholic Beverage, wine, table, red, Petite Sirah | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-pinot-noir` | Alcoholic Beverage, wine, table, red, Pinot Noir | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-sangiovese` | Alcoholic Beverage, wine, table, red, Sangiovese | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-syrah` | Alcoholic Beverage, wine, table, red, Syrah | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-red-zinfandel` | Alcoholic Beverage, wine, table, red, Zinfandel | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white` | Alcoholic beverage, wine, table, white | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-chardonnay` | Alcoholic beverage, wine, table, white, Chardonnay | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-chenin-blanc` | Alcoholic beverage, wine, table, white, Chenin Blanc | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-fume-blanc` | Alcoholic beverage, wine, table, white, Fume Blanc | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-gewurztraminer` | Alcoholic beverage, wine, table, white, Gewurztraminer | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-late-harvest` | Alcoholic beverage, wine, table, white, late harvest | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-late-harvest-gewurztrami` | Alcoholic beverage, wine, table, white, late harvest, Gewurztraminer | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-muller-thurgau` | Alcoholic beverage, wine, table, white, Muller Thurgau | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-muscat` | Alcoholic beverage, wine, table, white, Muscat | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-pinot-blanc` | Alcoholic beverage, wine, table, white, Pinot Blanc | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-pinot-gris-grigio` | Alcoholic beverage, wine, table, white, Pinot Gris (Grigio) | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-riesling` | Alcoholic beverage, wine, table, white, Riesling | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-sauvignon-blanc` | Alcoholic beverage, wine, table, white, Sauvignon Blanc | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverage-wine-table-white-semillon` | Alcoholic beverage, wine, table, white, Semillon | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverages-beer-higher-alcohol` | Alcoholic beverages, beer, higher alcohol | drink | كحول — ضمن استبعاد 77 الموثق |
| `alcoholic-beverages-wine-rose` | Alcoholic beverages, wine, rose | drink | كحول — ضمن استبعاد 77 الموثق |
| `beverages-amber-hard-cider` | Beverages, AMBER, hard cider | drink | كحول — ضمن استبعاد 77 الموثق |
| `beverages-malt-liquor-beverage` | Beverages, Malt liquor beverage | drink | كحول — ضمن استبعاد 77 الموثق |
| `beverages-whiskey-sour-mix-bottled` | Beverages, Whiskey sour mix, bottled | drink | كحول — ضمن استبعاد 77 الموثق |
| `beverages-whiskey-sour-mix-powder` | Beverages, Whiskey sour mix, powder | drink | كحول — ضمن استبعاد 77 الموثق |
| `malt-beverage-includes-non-alcoholic-beer` | Malt beverage, includes non-alcoholic beer | drink | كحول — ضمن استبعاد 77 الموثق |
| `pace-tequila-lime-salsa` | PACE, Tequila Lime Salsa | snack | كحول — ضمن استبعاد 77 الموثق |
| `whiskey-sour-mix-bottled-with-added-potassium-and-sodium` | Whiskey sour mix, bottled, with added potassium and sodium | drink | كحول — ضمن استبعاد 77 الموثق |

## §9. البطارية والنشر والتحقق الحي

- **البطارية المحلية:** tsc --noEmit **0** · eslint **0 أخطاء** (تحذيران موجودان مسبقًا عند HEAD) · vitest **5,897/5,897** (كانت 5,893 + 4 فحوص حماية جديدة) · next build — انظر سطر النشر أدناه.
- **النشر:** كوميت مباشر على main (أمر المالك «اعمل مباشرة على main») + متابعة CI (deploy-aws يشغّل الاختبارات ثم البناء والنشر الآمن بالتراجع التلقائي) + التحقق الحي.
- **خطة التحقق الحي بعد النشر:** (1) صف محذوف يعطي 404 في المسارين (مثل `/foods/lard` و`/ar/foods/bacon`) — لا تحويل للرئيسية؛ (2) صف محمي حي 200 (مثل `/foods/bacon-turkey-low-sodium`)؛ (3) `sitemap-foods.xml` = 156 رابطًا وخالٍ من الصفين المحذوفين المنتقيين؛ (4) صفحة المنهجية تعرض 8,162/78/8,084/8,154؛ (5) البحث الداخلي عن «bacon» لا يعيد صفوف خنزير محذوفة (يعيد البيكون الرومي/النباتي المحمي فقط)؛ (6) صفحة قائمة low-carb تعرض الأسماء المشتقة الجديدة.
- **ما لم يتغير (حدود النطاق):** لا مساس بسجلات المستخدمين التاريخية أو أي جدول خارج كتالوج الأغذية · لا تغيير سياسات robots/الخريطة المركّبة (قرار ربط الباند بالخريطة ما زال معلقًا بقرار مالك) · الباند 8,076 كما هو حرفيًا.
