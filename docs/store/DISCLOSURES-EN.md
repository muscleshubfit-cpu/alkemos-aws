# نصوص الإفصاح الإنجليزية الإلزامية ومواقع ظهورها (Alkemos Affiliate Store)

> **الحالة:** **مثبتة** بأمر المالك بتنفيذ المرحلة صفر — النص الحرفي (د-1) **إلزامي بنص الاتفاقية** وليس خيارًا صياغيًا؛ الصياغات التوضيحية والمواضع مثبتة وفق الأمر وقواعد FTC. هذه هي النصوص التي تُنفذ حرفيًا في المرحلة 1 (البند 1.4 بالتقرير الحاكم: «وحدة الشراء والإفصاح»).
> **اللغة:** الإفصاح **بالإنجليزية حصرًا** على كل أسطح المتجر (المتجر EN بقانون §0) — لا إفصاح عربي عن المتجر بأي سطح عربي.
> **المصادر (تحقق 2026-11-25 UTC — إعادة تحقق حية بنفس اليوم):** Operating Agreement (نسخة محدثة 2025-10-15 — `affiliate-program.amazon.com/help/operating/agreement`) · Program Policies (نسخة محدثة 2026-04-14 — `affiliate-program.amazon.com/help/operating/policies`) · FTC (إرشادات الإفصاح الرقمي والجهوز — انظر §3).

## 1) النص الإلزامي الحرفي (لا يُعدَّل ولا يُترجم)

> **Operating Agreement (updated 2025-10-15) — الاقتباس الحرفي:**
> «You must clearly and prominently state the following, or any substantially similar statement previously allowed under this Agreement, on your Site or any other location where Amazon may authorize your display or other use of Program Content: **"As an Amazon Associate I earn from qualifying purchases."**»

**النص المثبت للمتجر (يُعرض كما هو):**

```text
As an Amazon Associate I earn from qualifying purchases.
```

- يُعرض **بصيغة المفرد حرفيًا** («I») — القاعدة الحاكمة للتقرير المصحح §1.7 («عبارة OA الحرفية عند كل وحدة شراء»)؛ الصيغ البديلة «substantially similar» مسموحة بنص الاتفاقية لكن **لا تستخدم** — الوضع الافتراضي المعتمد هو الحرفي.
- «clearly and prominently» = ظاهر بلا جهد، بلا إخفاء، بلا دفن (قواعد الوضع §4).

## 2) الصياغات التوضيحية المثبتة (تُعرض كما هي)

**د-2 — سطر الإفصاح القصير لصفحات المحتوى/وحدات التوصية (يُوضع قرب أول رابط شراء):**

```text
When you buy through links on our site, we may earn an affiliate commission at no extra cost to you.
```

**د-3 — سطر التذييل الدائم بصفحات المتجر الإنجليزية (مع رابط صفحة الإفصاح):**

```text
As an Amazon Associate I earn from qualifying purchases. Read our full affiliate disclosure.
```

(الرابط على «full affiliate disclosure» يشير إلى `/affiliate-disclosure`.)

**د-4 — فقرة الإفصاح الكاملة بصفحة `/affiliate-disclosure` (EN — نص الصفحة القانونية):**

```text
Alkemos is a participant in the Amazon Associates Program, an affiliate advertising
program designed to provide a means for sites to earn advertising fees by advertising
and linking to amazon.com. As an Amazon Associate I earn from qualifying purchases.

Product prices and availability are accurate as of the date/time indicated on Amazon
and are subject to change at any time. [يُدرج هذا البند حرفيًا في المرحلة 4 فقط عند
عرض أسعار من API — انظر §5]

CERTAIN CONTENT THAT APPEARS ON THIS SITE COMES FROM AMAZON. THIS CONTENT IS
PROVIDED "AS IS" AND IS SUBJECT TO CHANGE OR REMOVAL AT ANY TIME. [يُدرج حرفيًا في
المرحلة 4 فقط عند عرض محتوى نصي من API — انظر §5]
```

(الأقواس أعلاه شرح للمشغل لا تُعرض — البندان المحفوظان يحذف نصهما من الصفحة حتى تفعيل المرحلة 4.)

## 3) المواضع المثبتة (أين يظهر كل نص)

| # | الموضع | النص | ملاحظات الوضع |
|---|---|---|---|
| م-1 | **كل وحدة شراء** (`AmazonBuyButton` — صفحات المنتج وأي بطاقة بزر شراء) | د-1 الحرفي | **فوق الزر/ملاصقًا له** — لا يُفصل عنه ولا يوضع بعده؛ غير قابل للإخفاء |
| م-2 | صفحة `/affiliate-disclosure` (داخل `(en)`) | د-4 | الصفحة القانونية الكاملة — يُشار إليها من التذييل ومن صفحات المتجر |
| م-3 | **تذييل كل صفحات المتجر** الإنجليزية (`SiteFooter` نسخة EN بأسطح `/store*`) | د-3 | سطر دائم — **لا يغني أبدًا** عن م-1 |
| م-4 | رأس مقالات المدونة EN التي تتضمن «كتلة منتج» (وحدات المرحلة 2) | د-2 | قبل أول رابط شراء بالمقال — قرب المقدمة لا بالتذييل |
| م-5 | وحدات التوصية بالأدوات/hubs/البرامج (المرحلة 2) | د-2 | داخل الوحدة قبل أول زر شراء |
| م-6 | ميتا/OG لصفحات المتجر | لا نص إفصاح | الإفصاح ظاهر بالصفحة نفسها لا بالوصف — لا مطلب يفرضه بالوصف |

## 4) قواعد الوضع (FTA + OA «clearly and prominently»)

1. **القرب من محفّز القرار:** إرشاد FTC الرسمي (How to Make Effective Disclosures in Digital Advertising — ftc.gov): «Place the disclosure as close as possible to the triggering claim» — لذلك الإفصاح ملاصق لوحدة الشراء لا بمكان بعيد.
2. **الوضوح والبروز (OA):** لا يوضع النص: داخل أكورديون/عنصر مغلق · بلون يذوب بالخلفية · بحجم أصغر من نص الوحدة المحيط · خلف خطوة تفاعلية (hover/click).
3. **لا «تذييل فقط»:** إفصاح التذييل (م-3) مكمل — وجوده وحده **مخالفة** لقواعد الوضع (FTC: الدفن بالتذييل لا يعد إفصاحًا واضحًا عند نقطة القرار).
4. **نفس اللغة والسطح:** النص إنجليزي على أسطح إنجليزية — ولا يوجد أي إفصاح عن المتجر داخل الأسطح العربية (قانون الفصل اللغوي §0/§3.4-ب).
5. **الروابط نفسها:** كل رابط شراء `rel="sponsored noopener"` مباشر إلى amazon.com بوسم البيئة (لا وسطاء توجيه — البند v الموثق).
6. **حارس الاختبار (ينفذ بالمرحلة 1):** كاناري يفشل أي صفحة منتج/فئة بلا مكون الإفصاح الإنجليزي (قانون المتجر §3.4-7) — هذا الملف هو مصدر النصوص المرجعية للحارس.

## 5) نصوص محفوظة للمرحلة 4 (لا تُعرض قبلها)

| النص | متى يُفعَّل | الأساس الرسمي |
|---|---|---|
| إخلاء المحتوى النصي من API: `CERTAIN CONTENT THAT APPEARS ON THIS SITE COMES FROM AMAZON. THIS CONTENT IS PROVIDED "AS IS" AND IS SUBJECT TO CHANGE OR REMOVAL AT ANY TIME.` | عند عرض أي محتوى نصي من Program Content (مرحلة 4) | Program Policies — رخصة IP، البند (k) |
| بيان الأسعار/التوافر: `Product prices and availability are accurate as of the date/time indicated on Amazon and are subject to change at any time.` | عند عرض أسعار من API (مرحلة 4) — مع طابع التاريخ/الوقت بجوار السعر (بند i) | Program Policies — شرطا الأسعار (أ)/(ب) الموثقان |

**حتى تفعيل المرحلة 4: صفر أسعار معروضة وCTA موحد «Check price on Amazon»** (قانون المتجر §1.5-5) — لذلك البندان أعلاه محفوظان نصًا بلا تفعيل.

## 6) قانون إعادة التحقق

نصوص الإفصاح وبنودها تُعاد قراءتها من مصادرها الرسمية **قبل كل أمر تنفيذ مرحلة** وقبل كل مراجعة امتثال ربع سنوية (SOP §5.2) — أي تغيير أمازوني بالنص الإلزامي يُحدّث هنا أولًا ثم بالتنفيذ.
