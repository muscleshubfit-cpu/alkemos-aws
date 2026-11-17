# S4-3/S4-4/S4-5 — التبديلات وإعادة توليد اليوم (NUT-6 · WOR-3 · WOR-13/20)

> **البنود الحاملة:** S4-3 (تبديل وجبة ×2 — NUT-6) · S4-4 (تبديل تمرين — WOR-3/WOR-20) · S4-5 (إعادة توليد يوم — WOR-13).
> **القناة:** واجهة العضو نفسها (`POST /api/ai/jobs` بحمولة PlansView الحرفية) للتبديلين + قناة المدرب لإعادة اليوم (`runAiJob("day_regenerate")`).
> **العامل:** التشغيلات [44078689673](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44078689673) · [44078904052](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44078904052) · [44079412198](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44079412198) · [44079676086](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44079676086) — **الكوميت:** beacon ‏44d0c9c0.

## 1) S4-3 — تبديلا وجبة متتاليان (NUT-6)

| المرحلة | الوجبات (سعرة) | مجموع الأصناف | الحقل اليومي |
|---|---|---|---|
| قبل | 365 · 633 · 345 · 581 | 1924 | daily_calories=2254 (هدف) |
| بعد التبديل 1 (الفطار) | **364** · 633 · 345 · 581 | 1923 | meals_total_calories=1923 |
| بعد التبديل 2 (الغداء) | 364 · **635** · 345 · 581 | **1925** | meals_total_calories=1925 |

- **الوظيفتان:** `05c9bb61-95f7-4292-893a-4c17b26ee286` (meal_regenerate · done) و`143eff1c-bc26-4a6b-b4cf-d32bc06868f0` (done) — كلتاهما بحمولة العضو الحرفية (planId+clientId+mealIdx+avoid_names+حمية الخطة).
- **الانجراف اليومي بعد التبديلين:** 1925 مقابل هدف 2254 = **−14.6% — ضمن حيز ±25%** ✓ (البديلان جاءا متعادلين مع الهدف: 364 مقابل 365 · 635 مقابل 633).
- **الحصص:** swaps 0→**2** من 16 (سطرا `usage recorded: meal_regenerate → plan_swaps(c050b509… · client self-service)` بالسجل) — خصم نجاح لكل تبديل.
- **سلوك السلسلة الحي:** التبديل الأول سقط للمكتبة الغذائية المحلية بصدق (`meal swap fell back to the local food DB … All AI providers failed`) والثاني خدمه groq-120b (strong · 5586 توكن) ثم رفضته بوابة الجودة فرسم المحلي — كلاهما أنتج بديلًا متعادل السعرات.
- **الحكم:** NUT-6 ‏**EXECUTED** — تبديلان متتاليان واليوم ضمن الميزانية وخصمان صادقان.

## 2) S4-4 — تبديل تمرين لعميل منزلي (WOR-3 · WOR-20)

- **الهدف:** `Barbell Bench Press - Medium Grip` (تمرين جيم بخطة العضو المنزلي) — اليوم «الإثنين» · الوظيفة `b208f2c4-a1c3-478e-ae53-7068dea702a1`.
- **الحمولة:** سياق WOR-3 الحرفي (location=home + استبيان اللياقة كامل بالسياق) — حمولة PlansView نفسها.
- **البديل الناتج:** `Decline Dumbbell Bench Press` (4×10-12 · راحة دقيقتان) بملاحظات عربية «يوفر تنويعًا جيدًا للضغط الصدري باستخدام الدمبلز… مناسب للمبتدئين».
- **الفحص:** صفر توكنات barbell/cable/machine/باربيل/كيبل/جهاز بالاسم والملاحظات — **بديل منزلي مناسب لمبتدئ** ✓ — خدمه openrouter nemotron-ultra (strong · 1365 توكن حقيقي).
- **الحصص:** swaps 2→**3**.
- **الحكم:** WOR-3 ‏**EXECUTED** (الدليل الحي المعلق بسجل P0 أُغلق) · WOR-20 رصد: الصف الناتج عادل (لا نية سواپ ظاهرة تُخالف) — الاستثناء الحي (libraryMatched للتمرين الحالي) لم يُمارَس — نافذة ممتدة.

## 3) S4-5 — إعادة توليد يوم (قناة المدرب — WOR-13)

- **الوظيفة:** `cd356114-ae04-4a03-b1d4-a8ff7865f05a` (day_regenerate · done · 13ث · openrouter strong).
- **اليوم:** «السبت — ساقين وكور» (4 تمارين قبل) → البديل: **5 تمارين** Dumbbell Goblet Squat · Dumbbell Step Ups · Dumbbell Hip Thrust · London Bridges · Push Up to Side Plank.
- **focus:** «ساقين وكور» == «ساقين وكور» **محفوظ حرفيًا** — لا انجراف تركيز بهذه العينة (WOR-13 كشف: البوابة تقبل أي نص focus ولا تفحص انجرافه — الفجوة الكودية قائمة، العينة الحية لم تمارس الانجراف).
- **منع التكرار:** صفر تداخل مع قائمة avoid (تمارين الأيام الستة الأخرى) ✓.
- **مناسبة المنزل:** كل البدائل دمبل/وزن جسم — متسقة مع عميل منزلي (رغم أن البوابة لا تفرض ذلك — سلوك العينة).
- **الحكم:** WOR-13 ‏**EXECUTED ككشف**: العينة نظيفة (focus محفوظ + صفر تكرار) والفجوة البنيوية (قبول أي focus) موثقة كوديًا — NUT-6-رصد: لا ميزانية سعرية لمسار التمرين (لا ينطبق).

## 4) عداد العامل للتبديلات (INF-19 مادة T5)

```
[ai-meter] fn=plan_nutrition-alt provider=groq model=openai_gpt-oss-120b outcome=ok tokens_total=5586 cost_cents=0
[ai-meter] fn=plan_exercise-corrective provider=openrouter model=nvidia_nemotron-3-ultra-550b-a55b_free outcome=ok tokens_total=1365
[ai-meter] fn=plan_day-regen provider=openrouter model=nvidia_nemotron-3-ultra-550b-a55b_free outcome=ok tokens_total=1491
```

توكنات usage حقيقية بكل نداء ناجح (لا تقدير chars/4) — صفر نداء للنموذج الميت nemotron-3-super-120b بكل تشغيلات النافذة (INF-5 قياس حي).
