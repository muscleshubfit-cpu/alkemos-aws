# حصر وتصنيف مكتبة المدونة المنشورة — أساس معالجة المقالات (E5)

> **الأمر الحاكم:** أمر المالك 2026-11-01 «أمر تنفيذ المرحلة التالية — Alkemos SEO Recovery» البند 1 (معالجة شاملة للمقالات المنشورة) والبند 2 (المقالات بلا نظير باللغة الأخرى). هذا المستند = قاعدة الأدلة المقيسة للفرز، **دون إعادة تدقيق من الصفر** (يستند إلى تدقيق 2026-10-31 وتقارير الجودة السابقة + قياس حي جديد قراءة-فقط).
>
> **أداة القياس:** `scripts/blog-runner/blog-corpus-inventory.mts` (قراءة-فقط عبر PostgREST؛ قياس مقيس بتاريخ 2026-10-31) — المخرجات الكاملة بJSON عند تشغيل السكربت؛ الجداول أدناه مولدة من نفس البيانات بلا تدخل يدوي.

## 1. الخلاصة المقيسة (107 مقالة منشورة)

| المؤشر | القيمة المقيسة |
|---|---|
| إجمالي المقالات المنشورة | **107** (EN 55 · AR 52) |
| وسيط الكلمات | 1052 (EN 1220 · AR 955) |
| المستوى A (بوابات كاملة: ≥1500ك + FAQ≥3 + رابط سلطة + مراجَع) | 7 |
| المستوى B (مقبول: ≥1200ك + FAQ≥1) | 33 |
| المستوى C (يحتاج معالجة: 800–1200ك بإشارات جزئية) | 48 |
| المستوى D (سطحي: <800ك) | 19 |
| بلا روابط سلطة خارجية (غير صور Pexels) | **61** (EN 28 · AR 33) |
| حالة المراجعة | 106 مراجَعة · 1 معلقة |
| الإقران ثنائي اللغة (linked_post_id بالاتجاهين) | 14 مقالة = **7 أزواج** |
| بلا نظير باللغة الأخرى | **93** (EN 48 · AR 45) |
| بقع المولد القديم (عبارات مزروعة/ادعاء مصادر كاذب) | **0** — نظّفتها معالجة 2026-09-28 المنفذة |
| مقالات AR نسبة اللاتيني المرئي >5% | 2 (chest-muscle-bodyweight-home · women-bodyweight-muscle-workout) |

**قراءة الخلاصة:** جسم المدونة الحديث (ما بعد 2026-09-29) قوي (بوابات التوليد المحروسة تعمل). المشكلة المتبقية = **الذيل القديم**: 67 مقالة تحت مستوى البوابات (48 C + 19 D) غالبيتها AR أُنشئت بالمولد القديم (أغسطس–سبتمبر)، و93 مقالة بلا نظير باللغة الأخرى.

## 2. المستوى D — السطحي (<800 كلمة) — أولوية المعالجة القصوى (19)

| # | اللغة | المقال (slug) | كلمات | FAQ | روابط سلطة | نشر | مراجعة |
|---|---|---|---:|---:|---:|---|---|
| 1 | AR | `water-intake-athlete-guide` | 506 | 3 | 0 | 2026-09-10 | reviewed |
| 2 | AR | `best-omega-3-supplement-athletes` | 508 | 2 | 0 | 2026-09-18 | reviewed |
| 3 | AR | `choose-vitamin-d-supplement-athletes` | 510 | 4 | 1 | 2026-09-26 | reviewed |
| 4 | AR | `muscle-group-frequency-optimal` | 592 | 4 | 0 | 2026-09-19 | reviewed |
| 5 | AR | `best-dynamic-stretching-exercises-athletes-injury-prevention` | 608 | 2 | 0 | 2026-09-21 | reviewed |
| 6 | AR | `how-to-calc-daily-protein-athletes` | 614 | 2 | 0 | 2026-09-13 | reviewed |
| 7 | AR | `deload-week-guide` | 635 | 4 | 0 | 2026-09-23 | reviewed |
| 8 | AR | `choose-whey-protein-ramadan-women` | 678 | 0 | 0 | 2026-09-25 | reviewed |
| 9 | AR | `progressive-weight-increase` | 716 | 2 | 1 | 2026-09-15 | reviewed |
| 10 | AR | `choose-weightlifting-shoes-men` | 742 | 5 | 2 | 2026-09-12 | reviewed |
| 11 | AR | `muscle-building-home-workout-guide` | 759 | 2 | 0 | 2026-08-27 | reviewed |
| 12 | AR | `optimal-rest-periods-resistance-training` | 760 | 3 | 0 | 2026-08-28 | reviewed |
| 13 | AR | `calculate-daily-calories-muscle-gain-beginners-guide` | 766 | 5 | 2 | 2026-10-22 | reviewed |
| 14 | AR | `best-creatine-men-guide` | 781 | 5 | 1 | 2026-10-21 | reviewed |
| 15 | EN | `improve-gut-health-muscle-gain-4-week-plan` | 699 | 1 | 0 | 2026-09-28 | reviewed |
| 16 | EN | `creatine-cycling-long-term-gains` | 705 | 2 | 0 | 2026-09-24 | reviewed |
| 17 | EN | `train-muscle-group-frequency-fixes` | 718 | 4 | 0 | 2026-09-12 | reviewed |
| 18 | EN | `contrast-therapy-7day-recovery-plan` | 743 | 4 | 0 | 2026-09-27 | reviewed |
| 19 | EN | `best-wearable-sleep-tracking-athletes-guide` | 764 | 3 | 0 | 2026-09-19 | reviewed |

**السمة الغالبة:** 16 من 19 مقالة عربية من ذيل المولد القديم؛ 14 من 19 بلا أي رابط سلطة واحد (المقيس بالجدول)؛ بعضها يحمل focus_keyword خاطئًا كليًا (مثل water-intake/deload/frequency وكلها تحمل كلمة «سعرات لخسارة الوزن» — بقعة المولد القديم).

## 3. المستوى C — يحتاج معالجة (48)

| # | اللغة | المقال (slug) | كلمات | FAQ | روابط سلطة | نشر | مراجعة |
|---|---|---|---:|---:|---:|---|---|
| 1 | AR | `best-creatine-supplement-for-women-guide` | 811 | 5 | 2 | 2026-10-23 | reviewed |
| 2 | AR | `choose-creatine-women-guide` | 811 | 2 | 0 | 2026-09-28 | reviewed |
| 3 | AR | `choose-best-wearable-sleep-tracker-athletes` | 825 | 5 | 0 | 2026-09-20 | reviewed |
| 4 | AR | `compare-whey-soy-protein-athletes` | 834 | 3 | 0 | 2026-09-24 | reviewed |
| 5 | AR | `bmr-calculator-athletes` | 847 | 3 | 0 | 2026-09-17 | reviewed |
| 6 | AR | `protein-supplements-veg-animal-comparison` | 856 | 5 | 0 | 2026-08-30 | reviewed |
| 7 | AR | `cold-bath-home-wellness` | 857 | 5 | 0 | 2026-08-28 | reviewed |
| 8 | AR | `how-to-start-muscle-building-beginners` | 893 | 1 | 1 | 2026-09-06 | reviewed |
| 9 | AR | `calculate-daily-calories-weight-loss-muscle-gain` | 900 | 1 | 0 | 2026-09-10 | reviewed |
| 10 | AR | `how-many-hours-sleep-for-muscle-growth` | 912 | 2 | 0 | 2026-09-07 | reviewed |
| 11 | AR | `reduce-water-retention-muscle-building` | 934 | 3 | 2 | 2026-09-27 | reviewed |
| 12 | AR | `design-diet-fat-loss-egyptian-lifestyle` | 955 | 3 | 0 | 2026-08-29 | reviewed |
| 13 | AR | `sleep-recovery-gym-results` | 955 | 1 | 2 | 2026-09-02 | reviewed |
| 14 | AR | `sleep-muscle-growth-science` | 961 | 3 | 1 | 2026-08-31 | reviewed |
| 15 | AR | `common-fat-burning-mistakes` | 972 | 1 | 0 | 2026-09-01 | reviewed |
| 16 | AR | `home-muscle-building-guide-simple-weights` | 990 | 2 | 2 | 2026-08-28 | reviewed |
| 17 | AR | `weekly-fat-burning-diet-plan` | 1022 | 5 | 2 | 2026-08-29 | reviewed |
| 18 | AR | `fat-burning-macro-diet-plan` | 1044 | 3 | 1 | 2026-08-27 | reviewed |
| 19 | AR | `creatine-water-retention-scientific-analysis-beginners-guide` | 1052 | 5 | 1 | 2026-10-28 | reviewed |
| 20 | AR | `carb-loading-plan-competition` | 1060 | 4 | 0 | 2026-09-22 | reviewed |
| 21 | AR | `beta-alanine-guide-selection` | 1077 | 10 | 0 | 2026-09-02 | reviewed |
| 22 | AR | `chest-muscle-home-workout-guide` | 1085 | 3 | 0 | 2026-08-30 | reviewed |
| 23 | AR | `creatine-beginners-guide` | 1120 | 1 | 2 | 2026-08-31 | reviewed |
| 24 | AR | `healthy-high-protein-meals-office` | 1120 | 1 | 0 | 2026-09-01 | reviewed |
| 25 | AR | `calculate-daily-calories-weight-loss` | 1164 | 1 | 0 | 2026-09-01 | reviewed |
| 26 | AR | `calorie-macro-guide-muscle-fat` | 1178 | 2 | 0 | 2026-08-28 | reviewed |
| 27 | EN | `budget-home-gym-equipment-comparison` | 821 | 3 | 0 | 2026-09-17 | reviewed |
| 28 | EN | `warm-up-before-lifting-5min-routine` | 836 | 4 | 0 | 2026-09-20 | reviewed |
| 29 | EN | `sauna-muscle-recovery-hormone-optimization` | 836 | 2 | 0 | 2026-09-26 | reviewed |
| 30 | EN | `red-light-therapy-muscle-recovery-mistakes` | 892 | 5 | 0 | 2026-09-25 | reviewed |
| 31 | EN | `best-time-to-take-creatine-guide` | 899 | 6 | 2 | 2026-10-24 | reviewed |
| 32 | EN | `foam-roller-recovery-4-week-guide` | 915 | 4 | 0 | 2026-09-15 | reviewed |
| 33 | EN | `deload-week-rest-training-guide` | 949 | 2 | 0 | 2026-09-23 | reviewed |
| 34 | EN | `choose-smart-scale-body-composition` | 969 | 4 | 0 | 2026-09-18 | reviewed |
| 35 | EN | `adjust-training-volume-cut-muscle-retention` | 1001 | 10 | 0 | 2026-09-05 | reviewed |
| 36 | EN | `heart-rate-monitor-fat-loss-guide` | 1022 | 3 | 1 | 2026-09-14 | reviewed |
| 37 | EN | `does-creatine-make-you-gain-weight-water-retention-vs-muscle` | 1036 | 7 | 3 | 2026-10-31 | pending |
| 38 | EN | `lose-belly-fat-without-losing-muscle-cardio-plan` | 1036 | 5 | 0 | 2026-09-21 | reviewed |
| 39 | EN | `how-many-calories-to-gain-muscle-and-lose-fat` | 1037 | 7 | 3 | 2026-10-29 | reviewed |
| 40 | EN | `hrv-overtraining-7day-plan-athletes` | 1043 | 6 | 1 | 2026-09-30 | reviewed |
| 41 | EN | `whey-protein-dosage-muscle-gain` | 1045 | 5 | 2 | 2026-10-30 | reviewed |
| 42 | EN | `calculate-daily-calories-fuel-fat-loss-bulking` | 1050 | 4 | 1 | 2026-09-02 | reviewed |
| 43 | EN | `choose-smartwatch-fitness-tracking` | 1053 | 3 | 1 | 2026-09-17 | reviewed |
| 44 | EN | `optimize-preworkout-nutrition-evening-training` | 1089 | 3 | 0 | 2026-09-11 | reviewed |
| 45 | EN | `magnesium-forms-sleep-recovery` | 1104 | 6 | 0 | 2026-08-28 | reviewed |
| 46 | EN | `sleep-better-faster-gym-results` | 1117 | 4 | 1 | 2026-09-04 | reviewed |
| 47 | EN | `creatine-loading-strength-hypertrophy-guide` | 1136 | 10 | 0 | 2026-09-09 | reviewed |
| 48 | EN | `calculate-maintenance-calories-muscle-gain` | 1177 | 10 | 1 | 2026-09-03 | reviewed |

## 4. البند الإلزامي — المقالات بلا نظير باللغة الأخرى (93)

آلية الربط الرسمية: `blog_posts.linked_post_id` ثنائي الاتجاه → `buildBlogHreflang()` يبث وسوم hreflang (en/ar/x-default) + رابط اللغة البديلة بالصفحة. **المقيس: 93 مقالة بلا نظير (48 EN · 45 AR) — فجوة التغطية اللغوية الأكبر بالمكتبة.**

### 4.1 الإنجليزية بلا نظير عربي (48)

| # | المقال (slug) | كلمات | FAQ | روابط سلطة | مستوى |
|---|---|---:|---:|---:|---|
| 1 | `progressive-overload-no-weight` | 1705 | 10 | 2 | A |
| 2 | `track-macros-no-food-scale` | 1629 | 10 | 2 | A |
| 3 | `pre-workout-nutrition-guide` | 1618 | 10 | 0 | B |
| 4 | `4-day-split-hypertrophy-fat-loss` | 1612 | 10 | 0 | B |
| 5 | `macro-tracking-meal-prep-1800-fat-loss` | 1601 | 10 | 0 | B |
| 6 | `4-day-upper-lower-hypertrophy-split` | 1596 | 10 | 2 | A |
| 7 | `intermittent-fasting-muscle-gain-workout-plan` | 1591 | 10 | 0 | B |
| 8 | `protein-myths-busted-muscle-gain` | 1568 | 6 | 1 | A |
| 9 | `calorie-cycling-fat-loss-diet` | 1524 | 10 | 2 | A |
| 10 | `best-plant-based-protein-powder-muscle-gain-2026` | 1489 | 10 | 1 | B |
| 11 | `science-backed-belly-fat-loss-8-weeks` | 1466 | 10 | 0 | B |
| 12 | `choose-whey-protein-muscle-gain` | 1461 | 10 | 2 | B |
| 13 | `12-week-progressive-overload-home-workout` | 1438 | 10 | 1 | B |
| 14 | `deload-week-structure-strength-gains` | 1426 | 10 | 2 | B |
| 15 | `combine-hiit-strength-fat-loss-guide` | 1406 | 2 | 0 | B |
| 16 | `how-to-periodize-nutrition-body-recomposition` | 1376 | 10 | 3 | B |
| 17 | `12-week-progressive-overload-intermediate` | 1325 | 10 | 2 | B |
| 18 | `bfr-training-checklist` | 1325 | 10 | 0 | B |
| 19 | `post-workout-recovery-meal-plan-7-recipes` | 1307 | 10 | 0 | B |
| 20 | `4-week-beginner-muscle-building-plan` | 1256 | 10 | 0 | B |
| 21 | `12-week-periodized-muscle-building-plan` | 1246 | 10 | 2 | B |
| 22 | `schedule-cardio-muscle-gain-guide` | 1244 | 4 | 1 | B |
| 23 | `smart-water-bottle-hydration-tracking-during-workouts` | 1236 | 7 | 1 | B |
| 24 | `progressive-overload-home-food-plan` | 1230 | 2 | 0 | B |
| 25 | `protein-after-workout-grams-guide` | 1220 | 10 | 2 | B |
| 26 | `calculate-maintenance-calories-muscle-gain` | 1177 | 10 | 1 | C |
| 27 | `creatine-loading-strength-hypertrophy-guide` | 1136 | 10 | 0 | C |
| 28 | `magnesium-forms-sleep-recovery` | 1104 | 6 | 0 | C |
| 29 | `optimize-preworkout-nutrition-evening-training` | 1089 | 3 | 0 | C |
| 30 | `choose-smartwatch-fitness-tracking` | 1053 | 3 | 1 | C |
| 31 | `whey-protein-dosage-muscle-gain` | 1045 | 5 | 2 | C |
| 32 | `hrv-overtraining-7day-plan-athletes` | 1043 | 6 | 1 | C |
| 33 | `how-many-calories-to-gain-muscle-and-lose-fat` | 1037 | 7 | 3 | C |
| 34 | `does-creatine-make-you-gain-weight-water-retention-vs-muscle` | 1036 | 7 | 3 | C |
| 35 | `lose-belly-fat-without-losing-muscle-cardio-plan` | 1036 | 5 | 0 | C |
| 36 | `heart-rate-monitor-fat-loss-guide` | 1022 | 3 | 1 | C |
| 37 | `adjust-training-volume-cut-muscle-retention` | 1001 | 10 | 0 | C |
| 38 | `choose-smart-scale-body-composition` | 969 | 4 | 0 | C |
| 39 | `foam-roller-recovery-4-week-guide` | 915 | 4 | 0 | C |
| 40 | `best-time-to-take-creatine-guide` | 899 | 6 | 2 | C |
| 41 | `red-light-therapy-muscle-recovery-mistakes` | 892 | 5 | 0 | C |
| 42 | `warm-up-before-lifting-5min-routine` | 836 | 4 | 0 | C |
| 43 | `sauna-muscle-recovery-hormone-optimization` | 836 | 2 | 0 | C |
| 44 | `budget-home-gym-equipment-comparison` | 821 | 3 | 0 | C |
| 45 | `contrast-therapy-7day-recovery-plan` | 743 | 4 | 0 | D |
| 46 | `train-muscle-group-frequency-fixes` | 718 | 4 | 0 | D |
| 47 | `creatine-cycling-long-term-gains` | 705 | 2 | 0 | D |
| 48 | `improve-gut-health-muscle-gain-4-week-plan` | 699 | 1 | 0 | D |

### 4.2 العربية بلا نظير إنجليزي (45)

| # | المقال (slug) | كلمات | FAQ | روابط سلطة | مستوى |
|---|---|---:|---:|---:|---|
| 1 | `increase-muscle-mass-no-protein-supplements` | 1753 | 2 | 0 | B |
| 2 | `home-muscle-building-guide-no-equipment` | 1604 | 2 | 0 | B |
| 3 | `hiit-home-workout-guide` | 1396 | 4 | 2 | B |
| 4 | `best-protein-supplement-women-ramadan` | 1385 | 5 | 0 | B |
| 5 | `best-protein-supplement-ramadan` | 1375 | 1 | 0 | B |
| 6 | `best-dynamic-stretching-before-gym` | 1351 | 1 | 0 | B |
| 7 | `calculate-calories-fat-loss` | 1310 | 2 | 2 | B |
| 8 | `best-protein-timing-after-workout` | 1261 | 3 | 0 | B |
| 9 | `chest-muscle-bodyweight-home` | 1246 | 3 | 0 | B |
| 10 | `women-bodyweight-muscle-workout` | 1235 | 2 | 0 | B |
| 11 | `home-muscle-gain-8-weeks` | 1220 | 2 | 2 | B |
| 12 | `calorie-macro-guide-muscle-fat` | 1178 | 2 | 0 | C |
| 13 | `creatine-beginners-guide` | 1120 | 1 | 2 | C |
| 14 | `chest-muscle-home-workout-guide` | 1085 | 3 | 0 | C |
| 15 | `beta-alanine-guide-selection` | 1077 | 10 | 0 | C |
| 16 | `carb-loading-plan-competition` | 1060 | 4 | 0 | C |
| 17 | `creatine-water-retention-scientific-analysis-beginners-guide` | 1052 | 5 | 1 | C |
| 18 | `fat-burning-macro-diet-plan` | 1044 | 3 | 1 | C |
| 19 | `weekly-fat-burning-diet-plan` | 1022 | 5 | 2 | C |
| 20 | `common-fat-burning-mistakes` | 972 | 1 | 0 | C |
| 21 | `sleep-muscle-growth-science` | 961 | 3 | 1 | C |
| 22 | `design-diet-fat-loss-egyptian-lifestyle` | 955 | 3 | 0 | C |
| 23 | `sleep-recovery-gym-results` | 955 | 1 | 2 | C |
| 24 | `reduce-water-retention-muscle-building` | 934 | 3 | 2 | C |
| 25 | `calculate-daily-calories-weight-loss-muscle-gain` | 900 | 1 | 0 | C |
| 26 | `how-to-start-muscle-building-beginners` | 893 | 1 | 1 | C |
| 27 | `cold-bath-home-wellness` | 857 | 5 | 0 | C |
| 28 | `protein-supplements-veg-animal-comparison` | 856 | 5 | 0 | C |
| 29 | `bmr-calculator-athletes` | 847 | 3 | 0 | C |
| 30 | `compare-whey-soy-protein-athletes` | 834 | 3 | 0 | C |
| 31 | `best-creatine-supplement-for-women-guide` | 811 | 5 | 2 | C |
| 32 | `choose-creatine-women-guide` | 811 | 2 | 0 | C |
| 33 | `best-creatine-men-guide` | 781 | 5 | 1 | D |
| 34 | `calculate-daily-calories-muscle-gain-beginners-guide` | 766 | 5 | 2 | D |
| 35 | `optimal-rest-periods-resistance-training` | 760 | 3 | 0 | D |
| 36 | `muscle-building-home-workout-guide` | 759 | 2 | 0 | D |
| 37 | `choose-weightlifting-shoes-men` | 742 | 5 | 2 | D |
| 38 | `progressive-weight-increase` | 716 | 2 | 1 | D |
| 39 | `choose-whey-protein-ramadan-women` | 678 | 0 | 0 | D |
| 40 | `how-to-calc-daily-protein-athletes` | 614 | 2 | 0 | D |
| 41 | `best-dynamic-stretching-exercises-athletes-injury-prevention` | 608 | 2 | 0 | D |
| 42 | `muscle-group-frequency-optimal` | 592 | 4 | 0 | D |
| 43 | `choose-vitamin-d-supplement-athletes` | 510 | 4 | 1 | D |
| 44 | `best-omega-3-supplement-athletes` | 508 | 2 | 0 | D |
| 45 | `water-intake-athlete-guide` | 506 | 3 | 0 | D |

### 4.3 سياسة الاستحقاق (معيار قرار موثق)

إنشاء النظير مقصور على المقالات ذات القيمة المثبتة:
1. **المستوى A/B أولًا** (25 EN + 11 AR من غير المقترنة) — محتوى أثبت قيمته تحريريًا وجدير بالتوسع للغة الأخرى.
2. **مواضيع النواة** (بروتين/كرياتين/نوم/تدريب تكراري/خطط) قبل مواضيع الحافة (أجهزة/مقارنات أدوات).
3. **المقالات D لا تُنشأ لها نظير قبل معالجتها** — إنشاء نظير لمقال سطحي يضاعف المشكلة لا يحلها.
4. المقالات المتبقية (أجهزة قابلة للاستبدال، مواضيع موسمية ضيقة) **توثق بلا نظير مع السبب** بدل إنشاء محتوى ضعيف لمجرد استكمال العدد.

### 4.4 فحص تكافؤ الأزواج القائمة (7 أزواج)

| # | الزوج الإنجليزي | الزوج العربي | كلمات EN/AR | تقييم التكافؤ |
|---|---|---|---|---|
| 1 | `deload-week-rest-training-guide` (949ك) | `deload-week-guide` (635ك) | 949/635 | مكافئ ✓ — كلاهما أسبوع الحمل التنازلي/الراحة |
| 2 | `12-week-dumbbell-band-muscle-plan` (1762ك) | `home-muscle-building-guide-simple-weights` (990ك) | 1762/990 | مكافئ-تقريبي — EN خطة 12 أسبوعًا بالدمبل/المطاط ↔ AR دليل عام بأوزان بسيطة — نفس النية (بناء عضلات منزلًا بأوزان بسيطة) |
| 3 | `quick-healthy-meal-ideas-busy-people` (1293ك) | `healthy-high-protein-meals-office` (1120ك) | 1293/1120 | غير مكافئ بدقة ⚠️ — EN وجبات سريعة للمشغولين (عام) ↔ AR وجبات مكتبية عالية البروتين (أضيق) — نية متجاورة لا متطابقة |
| 4 | `sleep-better-faster-gym-results` (1117ك) | `how-many-hours-sleep-for-muscle-growth` (912ك) | 1117/912 | غير مكافئ بدقة ⚠️ — EN تحسين جودة النوم ↔ AR كم ساعة نوم يحتاجها الرياضي — زاويتا بحث مختلفتان |
| 5 | `calculate-daily-calories-fuel-fat-loss-bulking` (1050ك) | `calculate-daily-calories-weight-loss` (1164ك) | 1050/1164 | غير مكافئ بدقة ⚠️ — EN خسارة+تضخيم معًا ↔ AR خسارة الوزن فقط — AR أضيق |
| 6 | `protein-per-day-muscle-build-plan` (1505ك) | `protein-intake-calculator-muscle-build` (1293ك) | 1505/1293 | مكافئ ✓ — كلاهما كمية البروتين اليومية لبناء العضلات |
| 7 | `best-wearable-sleep-tracking-athletes-guide` (764ك) | `choose-best-wearable-sleep-tracker-athletes` (825ك) | 764/825 | مكافئ ✓ — كلاهما اختيار جهاز تتبع النوم للرياضيين |

**القرار الموثق:** الأزواج الثلاثة «غير المكافئة بدقة» تُبقى مؤقتًا (نية متجاورة، ليست ضارة) وتُعالج بإعادة توجيه الاقتران عند إنشاء نظير أدق في الدفعات اللاحقة — لا يُفك اقتران قائم بلا بديل جاهز (منع dangling hreflang).

## 5. خطة المعالجة (دفعات قابلة للاختبار — قناة العلاج الرسمية)

| الدفعة | النطاق | القناة | البوابة |
|---|---|---|---|
| **T1** (جارٍ بالجلسة) | 9 مقالات: أضعف 8 D (كلها AR) + التوأم الإنجليزي الضعيف لأسبوع الحمل (deload EN) — إعادة كتابة كاملة + إصلاح focus_keyword الخاطئ + تصنيفات + FAQ 4-7 + روابط سلطة متحقق منها + صور داخلية ملائمة | سكربت المعالجة `scripts/blog-runner/article-treatment.mts` + دفعة JSON بسكربتات المستودع (dispatch-only، DRY_RUN افتراضيًا — نمط content-audit-db-remediation) | كاناري عمق/FAQ/سلطة قبل الدفع + تحقق حي بعد النشر |
| **T2+** | بقية D (11) ثم أسوأ C (48) بدفعات 8-10 | نفس القناة | نفس البوابة |
| **L1** (جارٍ بالجلسة) | نظائر لـ4 مقالات عالية القيمة غير مقترنة (2 EN→AR + 2 AR→EN) — محتوى تحريري أصيل متكامل لا ترجمة حرفية | إدراج عبر قناة المعالجة نفسها + ربط `linked_post_id` ثنائي الاتجاه عبر سير `retro-pair-blog.yml` (القناة الحصرية الموثقة) | hreflang حي مقيس + تكافؤ موضوعي موثق |
| **L2+** | بقية المستحق وفق §4.3 | نفس القناة | نفس البوابة |

**قانون المعالجة:** لا حذف ولا دمج لأي مقالة (قيد الأمر)؛ العنوان/slug لا يمس (قانون ثبات الروابط)؛ `updated_at` و`reading_time` يُحدّثان فقط عند تغيير حقيقي؛ كل مفتاح بحث خاطئ يُصحح لنية المقال الفعلية.

## 6. حدود القياس الموثقة

- القياس read-only لجدول `blog_posts` المنشورة (is_published=true) بتاريخ 2026-10-31؛ أي تغيير لاحق يحتاج إعادة تشغيل السكربت.
- «روابط السلطة» = نطاق خارجي من قائمة `EDITORIAL_AUTHORITY_DOMAINS` الأربع عشرة (صور Pexels مستبعدة بحكم كونها صورًا لا استشهادات).
- تقدير التكافؤ الموضوعي للأزواج حسب العنوان/النية البحثية (حكم تحريري موثق أعلاه) — ليس قياسًا آليًا.

---

## 7. الملحق — الحالة المقيسة بعد معالجة الجلسة الأولى (E6/E7، 2026-11-01)

إعادة جرد مقيسة بنفس الأداة بعد تطبيق دفعتي T1 وL1 (تشغيلا 41249869553 و41250177193 — 9/9 ثم 4/4 مطبقان، صفر فشل):

| المؤشر | قبل | بعد |
|---|---|---|
| المقالات المنشورة | 107 (55EN/52AR) | **111 (57EN/54AR)** — +4 نظائر |
| المستوى D (سطحي) | 19 | **11** (−8: أضعف المقالات أعيدت كتابتها) |
| المستوى B | 33 | 34 (+build-muscle EN الجديد) |
| الأزواج ثنائية اللغة | 7 أزواج (14 مقالة) | **11 زوجًا (22 مقالة)** |
| بلا نظير | 93 (48EN/45AR) | **89 (46EN/43AR)** |
| بانتظار اعتماد المالك | 1 | **5** (1 قديم + 4 نظائر جديدة بحالة pending الصادقة) |

**فحوص حية مقيسة على الإنتاج (2026-11-01):** صفحات deload AR+EN تخدم المحتوى المعاد كتابته (مقيس بالبحث عن الأقسام الجديدة بHTML الصفحات) · الأزواج الأربعة الجديدة تخدم hreflang (en/ar/x-default) بالفحص المباشر لعلامات `<link rel="alternate">` · صفحات معاد كتابتها تخدم كاش CDN عمره دقائق (سلوك stale-while-revalidate الموثق بالجلسة السابقة E-4 — تتجدد تلقائيًا أو بتطهير Cloudflare بيد المالك).

**قياس تكافؤ الأزواج الدائم (E8، أول تشغيل):** 3/11 أزواج سليمة التكافؤ، **8/11 معلَّمة** (تفصيلها بالمخارج الكاملة لسير blog-corpus-audit) — أساس ترتيب دفعات T2 (إكمال معالجة بقية D ثم C) وL2 (النظائر المؤهلة التالية من سجل الـ89).

---

## 8. الملحق الثاني — الحالة المقيسة بعد T2 (E10، 2026-11-01)

أمر المالك «الغاء بند bing، اكمل التنفيذ التالى فى الخطة» → الدفعة التالية بالخطة كانت T2 (بقية D). دفعة `article-treatment-batch-t2.json` **12 مقالة** (الـ11 D المتبقية + نظير AR لمقالة النوم لقانون تكافؤ الأزواج):

| المؤشر | قبل T2 (بعد T1/L1) | بعد T2 (تدقيق 41262780210) |
|---|---|---|
| المقالات المنشورة | 111 | **112** (+1: مقالة يومية مجدولة 01:21) |
| المستوى D (سطحي) | 11 | **0** — الطبقة السطحية اختفت كاملة |
| المستويات | A7/B34/C48 | **A7/B34/C71** (المعاد كتابتها 1000-1130ك + المقالة اليومية) |
| وسيط الكلمات | 1052 | **1085** |
| أزواج hreflang | 11 (تكافؤ سليم 3) | 11 (تكافؤ سليم **4** — زوج النوم صار مكافئًا) |
| بلا نظير | 89 | **90** (47EN/43AR — الفارق هو المقالة اليومية الجديدة) |
| بانتظار اعتماد المالك | 5 | **6** (+المقالة اليومية) |

**إصلاحات النوايا بالدفعة:** تصحيح 4 تصنيفات مغلوطة (progressive: wellness→workout · calories: recipes→nutrition · contrast: weight-loss→wellness · wearable EN: recipes→wellness + gut: muscle-gain→nutrition + cycling: fitness→supplements + frequency: health→workout) · حذف إحصاءتين مختلقتين بلا مصدر من مقال فترات الراحة (70% من ممارسي المقاومة / خسارة 25% من مكاسب القوة — استُبدلت بتجربة Schoenfeld 2016 المحكمة المقيسة) · إصلاح التلوث اللاتيني والمقاطع المكسورة بمقال الراحة (metabolites/compte/moderate/ي.restون) · استبدال الادعاءات غير الموثقة (مايو/ACSM بلا روابط بمقال الحذاء) بمراجعة PubMed محققة.

**المسار التالي للمعالجة (T3+):** المستوى C=71 بدفعات 8-10 بترتيب الجرد (الأدنى كلمات والأقل إشارات أولًا) ثم L2 (32 مؤهلة A/B من سجل الـ90).

---

## 9. الملحق الثالث — الحالة المقيسة بعد T3-1 (E11، 2026-11-01)

أمر المالك «ابدأ تنفيذ التالى من الخطة» → الدفعة التالية بالخطة كانت T3 (المستوى C). دفعة `article-treatment-batch-t3.json` **10 مقالات** (أضعف C غير المعالجة بترتيب الجرد: 6 AR + 4 EN، كلها غير مقترنة — لا التزامات أزواج):

| المؤشر | قبل T3-1 (بعد T2) | بعد T3-1 (تدقيق 41269480285) |
|---|---|---|
| المقالات المنشورة | 112 | **112** (لا تغيير — إعادة كتابة فقط) |
| المستويات | A7/B34/C71/D0 | A7/**B36**/**C69**/D0 (مقالتا EN فوق 1200ك: budget ‏1309 · sauna ‏1356) |
| وسيط الكلمات | 1085 | **1110** |
| بلا روابط سلطة | 45 (22EN/23AR) | **36** (18EN/18AR) |
| أزواج hreflang | 11 (4 سليمة) | 11 (4 سليمة — الدفعة كلها غير مقترنة فصفر مساس) |
| بانتظار اعتماد المالك | 6 | **0** — المالك اعتمد الستّ بين الجلسات (D-6 مكتمل) |
| غير المقترن (المؤهل A/B) | 90 (32) | 90 (**34** — المقالتان الصاعدتان إلى B) |

**إصلاحات النوايا بالدفعة:** 7 تصنيفات خاطئة صُححت (choose-creatine: nutrition→supplements · best-creatine: science→supplements · budget: supplements→fitness · compare-whey: workout→supplements · sauna: supplements→wellness · warmup: science→workout · bmr: weight-loss→nutrition) · استبدال رابط ODS الميت المقيس (Creatine-HealthProfessional ‏404) بالمسار الجديد ExerciseAndAthleticPerformance-HealthProfessional · تمايز المقالتين النديتين بكرياتين النساء بزاويتين (دليل التسوق مقابل دليل الاستخدام) مع وصلات متبادلة · كل روابط السلطة متحقق منها فرديًا قبل الكتابة (14 PubMed جديد + ODS/CDC/ACE بجلب فعلي + إعادة تأكيد معاد استخدام T1/T2).

**المسار التالي للمعالجة (T3-2+):** بقية C غير المعالجة (37 مقالة بعد إسقاط المعالَجة والصاعدة) بدفعات 8-10 بنفس ترتيب الجرد ثم L2 (34 مؤهلة A/B) بأمر مالك.

---

## 10. الملحق الرابع — الحالة المقيسة بعد T3-2 (E12، 2026-11-01)

تكملة أمر التنفيذ: دفعة `article-treatment-batch-t3-2.json` **10 مقالات** (أضعف C غير المعالجة التالية بترتيب الجرد: 6 AR + 4 EN، كلها غير مقترنة — لا التزامات أزواج):

| المؤشر | قبل T3-2 (بعد T3-1) | بعد T3-2 (تدقيق 41316746077) |
|---|---|---|
| المقالات المنشورة | 112 | **112** (لا تغيير — إعادة كتابة فقط) |
| المستويات | A7/B36/C69/D0 | A7/**B37**/**C68**/D0 (الميزان الذكي عبرت للB ‏1316ك) |
| وسيط الكلمات | 1109 | **1117** |
| بلا روابط سلطة | 36 (18EN/18AR) | **32** |
| أزواج hreflang | 11 (4 سليمة) | 11 (4 سليمة — الدفعة كلها غير مقترنة فصفر مساس) |
| بانتظار اعتماد المالك | 0 | **0** |
| غير المقترن (المؤهل A/B) | 90 (34) | 90 (**35** — الصاعدة إلى B) |

**إصلاحات النوايا بالدفعة:** 6 تصنيفات خاطئة صُححت (توقيت الكرياتين: workout→supplements · حساب السعرات AR: workout→nutrition · احتباس الماء: weight-loss→nutrition · النظام المصري: workout→nutrition · استشفاء النوم: workout→wellness · الميزان الذكي: muscle-gain→fitness) · **رابطان ميتان قيسا واستُبدلا** (ODS ‏Creatine-Consumer · Mayo omega-3) · **استشهاد معكوس صُحح** (PMC6132589 ‏جراحة عظام أطفال كان مُسندًا زورًا كدراسة نوم → Lamon ‏33400856) · روابط ACSM/ISSN الرئيسية العامة استُبدلت بمصادر محددة (Valenzuela ‏31242624 · DIAAS) · تمايز مقالتي النوم النديتين بزاويتين (العلم المعمق × البروتوكول العملي) مع وصلات متبادلة · كل روابط السلطة متحقق منها فرديًا قبل الكتابة (15 PubMed جديد بالملخصات + 3 معاد + WHO صوديوم جديد بجلب فعلي + 5 صفحات معاد تأكيدها).

**المسار التالي للمعالجة (T3-3+):** بقية C غير المعالجة (27 مقالة: 21 غير مقترنة + 6 مقترنة تُعالج بطرفيها معًا بقانون تكافؤ الأزواج) بدفعات 8-10 بنفس ترتيب الجرد ثم L2 (35 مؤهلة A/B) بأمر مالك.

## 11. الملحق الخامس — الحالة المقيسة بعد T3-3 (E13، 2026-11-01)

تكملة أمر التنفيذ: دفعة `article-treatment-batch-t3-3.json` **10 مقالات** (أضعف C غير المعالجة **غير المقترنة** التالية بترتيب الجرد: 3 AR + 7 EN — الجوانب الـ9 المقترنة من C أُجّلت عمدًا لدفعات «الزوج كاملًا» بقانون تكافؤ الأزواج المطبق آليًا بالكاناري):

| المؤشر | قبل T3-3 (بعد T3-2) | بعد T3-3 (تدقيق 41325372251) |
|---|---|---|
| المقالات المنشورة | 112 | **112** (لا تغيير — إعادة كتابة فقط) |
| المستويات | A7/B37/C68/D0 | A7/**B38**/**C67**/D0 (الكرياتين/الوزن عبرت للB ‏1228ك) |
| وسيط الكلمات | 1117 | **1126** |
| بلا روابط سلطة | 32 (16EN/16AR) | **29** (3 مقالات حصلت على أول استشهاداتها) |
| أزواج hreflang | 11 (4 سليمة) | 11 (4 سليمة — الدفعة كلها غير مقترنة فصفر مساس) |
| بانتظار اعتماد المالك | 0 | **0** |
| غير المقترن (المؤهل A/B) | 90 (35) | 90 (**36** — الصاعدة إلى B) |

**إصلاحات النوايا بالدفعة:** 7 تصنيفات خاطئة صُححت (weight-loss×2 · nutrition×3 · wellness · supplements) · **3 استشهادات معكوسة قيست وصُححت بمصادرها الحقيقية** (مجلة جراحة روسية كدراسة توقيت كرياتين→أنطونيو · زراعة أعضاء كدراسة تاناكا للنبض→تاناكا الحقيقية · أعصاب أطفال كمرجع ميفلين→ميفلين الحقيقي) · **4 روابط ميتة قيست واستُبدلت** (ODS Creatine-Consumer · ISSN-online.org ×3 بنطاق ميت) · روابط رئيس نطاق مجردة استُبدلت بصفحات محدقة · كل روابط السلطة متحقق منها فرديًا قبل الكتابة (12 PubMed جديد بالملخصات + رصد انعكاس ذاتي: 28615987 سكتة دماغية لا بيان ISSN بروتين — الصحيح 28642676 · 5 معاد · 6 صفحات ويب معاد تأكيدها).

**تقوية البوابة:** قائمة الأزواج المعروفة بالكاناري اكتملت من 7 إلى 11 زوجًا ثنائي الاتجاه (4 أزواج أنشأتها L1 كانت ناقصة) — قانون «الزوج يُعالج بطرفيه معًا» صار يحرس الواقع الكامل.

**المسار التالي للمعالجة (T3-4+):** بقية C غير المعالجة (20 مقالة: **11 غير مقترنة** بدفعات 8-10 بنفس ترتيب الجرد + **9 جوانب مقترنة عبر 7 أزواج** تُعالج بطرفيها معًا — أضعفها زوج النوم 912+1117 وزوج المنزل 990 مقابل EN-A) ثم L2 ‏(36 مؤهلة A/B) بأمر مالك.

## 12. الملحق السادس — الحالة المقيسة بعد T3-4a (E14، 2026-11-01)

تكملة أمر التنفيذ: دفعة `article-treatment-batch-t3-4.json` **10 مقالات** (أضعف C غير المعالجة **غير المقترنة** تالية جرد طازج قيس قبل الاختيار — تشغيل 41333704316: 112 مقالة بلا تغيير عن تدقيق T3-3 — 5 AR + 5 EN؛ الجوانب المقترنة من C أُجّلت عمدًا لدفعة T3-4b «الزوج كاملًا» بقانون تكافؤ الأزواج المطبق آليًا بالكاناري):

| المؤشر | قبل T3-4a (بعد T3-3) | بعد T3-4a (تدقيق 41338428705) |
|---|---|---|
| المقالات المنشورة | 112 | **112** (لا تغيير — إعادة كتابة فقط) |
| المستويات | A7/B38/C67/D0 | A7/B38/**C67**/D0 (كلمات الدفعة 1009-1137 فلا عبور B هذا الدفعة) |
| وسيط الكلمات | 1126 | **1126** |
| بلا روابط سلطة | 29 (14EN/15AR) | **23** (11EN/12AR — 6 مقالات حصلت على أول استشهاداتها المحققة) |
| أزواج hreflang | 11 (4 سليمة) | 11 (4 سليمة — الدفعة كلها غير مقترنة فصفر مساس) |
| بانتظار اعتماد المالك | 0 | **0** |

**إصلاحات النوايا بالدفعة:** 8 تصنيفات خاطئة صُححت (supplements×4 · nutrition×3 · fitness) · **استشهادان معكوسان قيسا واستُبدلا بمصادرها الحقيقية** (PMC6132494 ورقة 1983 عن تدريب مساعدي الأطباء كانت مُسندة كأبحاث كرياتين NIH · PMC6156400 دراسة 1980 عن إنزيم كبد الفئران كانت مُسندة كدليل سرعة التحميل) · رابط Mayo الميت art-20046491 قيس واستُبدل · روابط استشهاد markdown خام غير مصيّرة صُوّبت · حرف عبري دخيل أُزيل · «دراسات حالة» بأرقام مختلقة أُسقطت · مزرعة كلمات مفتاحية كاملة أعيدت دليلًا حقيقيًا (أسابيع 2-6 بمقال كرياتين المبتدئين كانت صيامًا/نباتيًا/ظهرًا/موسيقى/أحذية) · كل روابط السلطة متحقق منها فرديًا قبل الكتابة (23 PubMed جديد بالملخصات + 7 معاد + ODS/CDC أحيّة بجلب المتصفح).

**المسار التالي للمعالجة (T3-4b):** ختام المستوى C — بقية غير المعالجة **7 مقالات**: `calorie-macro-guide-muscle-fat` AR غير المقترنة (1178ك) + **6 جوانب C مقترنة عبر 4 أزواج تُعالج بطرفيها معًا** (زوج النوم 912 AR + 1117 EN · زوج المنزل 990 AR + نظيره A · زوج السعرات 1164 AR + 1050 EN · زوج الوجبات 1120 AR + نظيره B) ثم L2 (36 مؤهلة A/B) بأمر مالك.
