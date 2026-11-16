# S2-3 — التوأم الثنائي hreflang: الاقتران الصحيح والربط المتبادل (قراءات حية 2026-11-16 ~21:10Z)

> **البند الحامل:** S2-3 (§4 T2) — ART (النشر الذري للزوج) — القراءة المطلوبة: الأزواج المنشورة بالنافذة (hreflang متبادل + اقتران صحيح).

## 1) الزوج المكتمل المرجعي — pair ba2a0159 (منشور الطرفين)

**صفا الطابور (blog_generation_queue):**

| الصف | اللغة | الحالة | post_id المربوط |
|---|---|---|---|
| 20735494-7162… | en | published | en_post_id = 9275b48b-3ff1-4edc-8a9a-0654a32422a2 |
| 69c14a13-5545… | ar | published | ar_post_id = d8db5f8d-903c-4805-a16d-fa39367f6518 |

**صفا المدونة (blog_posts) — الربط المتبادل:**

- EN «How to Train After 40 for Metabolic Health and Muscle Retention» (slug: train-after-40-metabolic-health-muscle-retention) → `linked_post_id = d8db5f8d…` (العربية).
- AR «كيف أغير تغذيتي وتدريبي بعد الأربعين…» (slug: nutrition-training-athletes-over-40-metabolic-hormonal-adaptation) → `linked_post_id = 9275b48b…` (الإنجليزية).

**الصفحتان الحيتان (hreflang بالرأس):**

- `GET /blog/train-after-40-metabolic-health-muscle-retention` → **200**:
  - `rel="alternate" hrefLang="en" href="https://alkemos.com/blog/train-after-40-metabolic-health-muscle-retention"` (ذاتي)
  - `rel="alternate" hrefLang="ar" href="https://alkemos.com/ar/blog/nutrition-training-athletes-over-40-metabolic-hormonal-adaptation"` (التوأم)
  - `rel="alternate" hrefLang="x-default" href="…/blog/train-after-40…"` (الافتراضي → EN)
- `GET /ar/blog/nutrition-training-athletes-over-40-metabolic-hormonal-adaptation` → **200**:
  - `rel="alternate" hrefLang="ar" href="…/ar/blog/nutrition-training…"` (ذاتي)
  - `rel="alternate" hrefLang="en" href="…/blog/train-after-40…"` (التوأم)

**الحكم:** الاقتران صحيح والربط متبادل حي على المسار المنشور (صفوف + رؤوس) — آلية التوأم تعمل كما صُممت.

## 2) زوج نافذة T2 — pair 2363d559 (الحالة النصفية الموثقة)

- الطرف العربي منشور: f4966eec → ar_post_id = **8dd64290** (مقال S2-1، صفحة حية 200 تحمل `hrefLang="ar"` ذاتيًا + x-default → ar — **بلا توأم en**).
- الطرف الإنجليزي 75b8d1a7 (researched أُنشئ 18:33 بتشغيلة T1-AR): استُأنف بتشغيلة S2-2 الأولى (43954016076) وفشل بثلاثة فشل p5 متتالية بكبسولة واحدة (انظر ملف s2-2) → `resume_count=3` → **استُبعد من الاستئناف بقانون السقف ART-2** — الزوج يبقى نصف مكتمل بهذه النافذة والعربية المنشورة بلا hreflang توأم.
- **تصنيف الملاحظة (لا إصلاح بهذا الإطار — §5-أ-6):** تفاعل غير موثق سابقًا بين سقف الاستئناف (يعدّ كل فشل p5 بما فيها ما تستعيده حلقة الإصلاح داخل التشغيلة) وميزانية الإصلاح (دورتان) — ثلاث فشول p5 بتشغيلة واحدة تسمّ الصف نهائيًا فيُيتم الزوج المنشور طرفه الآخر أرملًا. قُيّد بسجل الفجوات (GAP-13) لقرار المالك.

## 3) زوج تشغيلة S2-2 (إن نجحت)

- تُنشئ التشغيلة الإنجليزية زوجًا جديدًا (pairMode=created) بتوأم ar researched — الطرف EN يُنشر بالتشغيلة والطرف AR ينتظر خانة الخميس المجدولة (05:00 UTC — داخل نافذة 144 ساعة) — **اكتمال الزوج موثق بمتابعة النافذة لا بالجلسة** (تُحدّث الحالة بمتابعة الخميس).

## 4) الحكم

**S2-3: EXECUTED بدليل مفتوح + حالة نافذة موثقة** — آلية التوأم مثبتة حية بزوج مكتمل مرجعي (ربط DB متبادل + hreflang متبادل بالصفحتين)؛ حالة زوج النافذة 2363d559 النصفية موثقة بسببها الجذري (سقف الاستئناف) بقيد فجوة، وزوج S2-2 الجديد يكمل بالخانة المجدولة داخل النافذة.
