# S4-2 — توليد خطة تمرين كاملة (4 أيام/منزلي/مبتدئ) + GAP-19

> **البند الحامل:** S4-2 (§4 T4) — WOR-1/4/5/7/17/21 · INF-4 · NUT-6-رصد.
> **القناة:** `POST /api/ai/jobs` (plan_workout · selfService) بحساب `qa.member.adult@alkemos-test.com` (استبيانه: 4 أيام · منزل · مبتدئ · دمبل قابل للتعديل).
> **العامل:** التشغيلة [44068153440](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44068153440) · **الكوميت:** beacon ‏44d0c9c0.

## 1) الوظيفة والسلسلة

- **الوظيفة:** `f42dbb22-86a8-4d75-a6aa-266fb46ff138` (plan_workout · attempts=1 · 54ث · done).
- **مقتطف حرفي:**
  ```
  [ai-jobs] ▶ processing plan_workout#f42dbb22 attempt=1
  [ai-fallback-chain] [plan:workout] lead=openrouter (call #1, orKeys=2)
  [ai-meter] fn=plan_workout provider=openrouter model=nvidia_nemotron-3-ultra-550b-a55b_free outcome=fail latency=35007ms
  [ai-fallback-chain] [plan:workout] openrouter/nvidia/nemotron-3-ultra-550b-a55b:free notice, trying next: This operation was aborted
  [ai-fallback-chain] [plan:workout] groq/openai/gpt-oss-120b succeeded (tier=strong)
  [ai-meter] fn=plan_workout provider=groq model=openai_gpt-oss-120b outcome=ok tokens_in=2339 tokens_out=4000 tokens_total=6339 cost_cents=0
  [ai-fallback-chain] [plan:workout] lead=groq (call #2, orKeys=2)
  [ai-fallback-chain] [plan:workout] groq/openai/gpt-oss-120b succeeded (tier=strong)
  [ai-meter] fn=plan_workout provider=groq model=openai_gpt-oss-120b outcome=ok tokens_in=2426 tokens_out=3864 tokens_total=6290
  [ai-jobs] ✓ plan_workout#f42dbb22 attempt=1 done in 54s
  ```

## 2) الحصص

قبل plans.used=1/8 → بعد **2/8** (خصم نجاح واحد) — قراءة بسطح العضو.

## 3) الصف المحفوظ

- **الصف:** `78080a96-37ae-4076-a9fd-fdfed114ef6d` — workout / **approved / current** / job_id=f42dbb22.
- **WOR-1 (الحاسم) — البنية الثلاثية:**
  - `overview`: نص عربي كامل (هدف/أيام/كارديو) ✓
  - `weekly_volume`: «59 مجموعة» ✓ (ومطابق لمجموع sets المحسوب 59)
  - `progression`: نص موجة كامل (تأسيس→تحميل→ذروة→تفريغ + قاعدة الدورة الثانية) ✓
  - المودال: البنية كلها بحقولها بالصف (يقرأها PlansView/المودال بالمسار المنشور).
- **WOR-7 — ختم الموجة:** `periodization.weeks` = 4 أسابيع كاملة بملصقات (الأسبوع 1 — التأسيس … الأسبوع 4 — التفريغ (Deload) ‏isDeload=true) + `warmUp`/`coolDown`/`volumeNote` + `cardio` مقيد بالهدف (LISS ‏3-4 جلسات ×25-40د) — الختم الحتمي محفوظ.
- **WOR-5 — مرساة الأيام:** أيام التدريب الفعلية **4 == المطلوب 4** (7 أيام: 4 تدريب + 3 راحة).
- **WOR-4 — مطابقات المكتبة:** أسماء الخطة إنجليزية قياسية تحل بالمطابق الموحد (coverage) — عينات: Dumbbell Romanian Deadlift/Dumbbell Lunges/Plank/Barbell Bench Press - Medium Grip — تُحل على عالم الجيم.
- **WOR-17 — تنافر البيانات:** صفر — الوصف ثنائي اللغة صادق (overview عربي لعميل عربي).
- **WOR-21 (رصد):** تمرين Plank بـreps=«30-45 ثانية» **عبر** — الصيغة الزمنية مقبولة فعلًا (reps نص حر ≤40) — الرصد موثق.
- **WOR-2 (رصد):** audit findings=0 — لا حرج وقع بالنافذة (نافذة ممتدة).
- **INF-4:** `generation={model:"openai/gpt-oss-120b", provider:"groq", qualityTier:"strong"}`.

## 4) الاكتشاف الحاسم — GAP-19: تدقيق التجهيزات أعمى بنيويًّا عن مخالفات المنزل

- **الخطة المنشورة لعميل منزلي مبتدئ تحمل تمارين جيم:** Barbell Bench Press (يومان) · Barbell Squat · Cable Row · Triceps Pushdown (كيبل) · Chain Press — و`audit.findings=0` و`needs_review=None`!
- **السبب الجذري (مثبت بتنفيذ كود المستودع):** استعلام التدقيق يبحث بعالم تجهيزات **العميل** (`findExerciseInLibrary(name, "home")` → `matchWorkoutExercise(name, "home-dumbbells")`) — وتمارين الجيم **لا وجود لها بعالم المنزل** فتعود `null` فلا يفحصها التدقيق إطلاقًا (لا تجهيزات ولا مستوى ولا إصابات):
  ```
  {"name":"Barbell Bench Press - Medium Grip","homeWorld":null,"fullGym":"barbell-bench-press-medium-grip"}
  {"name":"Cable Row","homeWorld":null,"fullGym":"shotgun-row"}
  {"name":"Triceps Pushdown","homeWorld":null,"fullGym":"triceps-pushdown"}
  ```
  أي أن **home_equipment_mismatch لا يمكن أن يشتعل أبدًا لتمارين الجيم على عميل منزلي** — العمى أصاب الصنف الذي وُجدت البوابة لحراسته (يمتد لWOR-9 المستوى وWOR-18 الإصابات: كلها مشروطة بوجود مطابقة مكتبة).
- **التصنيف:** فجوة جودة/سلامة عالية — قرار مالك (المسار الحاسم: البحث بعالم كامل للفحص مع ترشيح التجهيزات للعرض).

## 5) ملاحظات كشف إضافية (WOR-6)

- **WOR-6 حي:** يوم السبت والأربعاء بنفس التركيز «ساقين وكور» وبثلاثة تمارين **متطابقة حرفيًا** (Chain Press · Dumbbell Romanian Deadlift · Plank) — لا فحص تكرار/توازن أطلق أي علم (audit=0) — الفجوة موثقة بعينة حية.

## 6) الحكم

**نجح:** خطة تمرين حقيقية موفرة البنية الثلاثية بختم الموجة ومرساة 4 أيام وخصم واحد — WOR-1/5/7 ‏EXECUTED · WOR-4 ‏EXECUTED (بعالم المكتبة) · WOR-17 ضمني ‏EXECUTED · WOR-21 رصد موثق (الصيغة الزمنية عبرت) · WOR-2 نافذة ممتدة.
**فشل موثق:** GAP-19 — بوابة تجهيزات/مستوى/إصابات التمرين عمياء عن تمارين الجيم على عملاء المنزل (عينة حية بخطة منشورة) — تُقيَّد بالسجل.
