# S1-3 — وظيفة article_generate عبر الطابور بحساب مدرب اختبار (وصل + خط أنابيب حي بممارسة إصلاح كاملة)

> **البند الحامل:** S1-3 (§4 T1) — RL-9 (article_generate) + INF-13 مقاربة أولى.
> **القناة:** `POST /api/ai/jobs` بحساب المدرب الاختباري `qa.coach.t1@alkemos-test.com` (كوكي جلسة فعلي) — الكوميت 27ae957af (== beacon 2afd61c6 كودًا).
> **الزمن:** 18:23 UTC.

## 1) الوظيفة (صف ai_jobs — الوصل)

- **معرف الوظيفة:** `2bde154b-8836-4020-b5a2-f397f5e64fbf` (article_generate · requested_by = المدرب الاختباري).
- الطلب: `{"language":"en","topic":"Resistance training basics for beginners over fifty","clientId":"<العضو البالغ الاختباري>"}`.
- **الاستجابة الفورية:** `{"jobId":"2bde154b…","pipelineDispatched":true,"etaMinutes":45,"message":"المقال دخل نفس خط التوليد الآلي…"}` — **قانون COACH PIPELINE PARITY (Phase 162) ممارس حيًّا**: مسار المدرب = نفس خط التوليد الآلي، والصف وصلة.
- **الصف النهائي:** status=**done** · finished_at=18:23:14 · result=`{"topic":"Resistance training basics for beginners over fifty","language":"en","workflow":"blog-post-en.yml","pipelineDispatched":true}` · attempts=0 (لم يمسّه العامل —Dispatch نجح فسدّ الوظيفة فورًا وفق القانون).
- **الحصص:** لا حصة مقالات للمدربين (أداة تحرير غير محدودة — بوابة الحصة الموحدة لplan_* حصرًا) — الرصيد قبل/بعد للعضو: بلا تغيير (صفر صفوف ai_plan_usage جديدة) — موثق.
- **RL-9 (إعادة article_generate الموجهة داخل العامل):** مسار العامل لم يُبلغ (نجاح Dispatch يجنّبه أصلًا) — يظل **رصدًا** وفق نص الخطة («الفشل العارض غير قابل للإحداث المتعمد — رصد + الوظيفة السليمة تنجح»): الوظيفة السليمة نجحت كوصلة، والإعادة الموجهة مورست حيًّا بمسار خط الأنابيب نفسه (انظر §2).

## 2) خط الأنابيب المنطلق (blog-post-en.yml — تشغيلة 43928255597): ممارسة كاملة لمنظومة الإصلاح

- **P0 (استئناف موثق):** `[blog/p0-research] RESUME: my en row 857bdcf0… is "researched" (≤144h, unpublished) — continuing it instead of creating a new row` — التوأم الإنجليزي لزوج الصباح استُؤنف (بروتوكول الاستئناف يعمل).
- P1→P3: مخطط ← محتوى ← صور — نجحت.
- **P5 محاولة 1 — رفض مسمّى بعقد:** `article too short (955 prose words, FAQ excluded, < 1000-word floor) — rerun p2-content` + rerunTarget=p2-content.
- **دورة إصلاح 1/2 (موجّهة):** إعادة p2-content (force=1 بالحزمة المحفوظة) ← p3 ← p4 — ثم **رفض مسمّى جديد مختلف:** `quality-gate battery failed — FAQ count 2 outside the 4-7 range — rerun p4-review` + **repairDiagnostics بأسماء الأسئلة المسبوعة حرفيًا** («How much protein do I need per day to build muscle?»…) — عقد العيب المسمّى (RL-1) حيًّا.
- **دورة إصلاح 2/2 (توجيه B1 مرفق):** إعادة p4-review موجهة → `[blog-pipeline] P4 en done` بـ `words:1317 · repairDirected:true` ← **P5 محاولة 3:** `article too short (997 prose words < 1000)` — على بعد 3 كلمات من الأرضية.
- **الفشل الصادق:** `❌ [p5-publish] repair budget exhausted (2 cycle(s), last target: p2-content) — honest failure (markFailed stands)` — exit 1 بلا نجاح كاذب ولا قناع.
- **السلوك المرصود (لتقرير المالك):** ذبذبة «قصر/FAQ» — إصلاح FAQ قصّر النثر تحت الأرضية مجددًا (955→1317→997) — الحلقة أظهرت تقدمًا جزئيًّا لكل دورة لكن الأهداف المتقابلة لم تُقفل معًا خلال الميزانية — **سلوك لا-تقدم متقاطع موثق** (مادة لقرار علاج: توجيه B1 لp2+p4 معًا أو رفع ذكاء التوجيه).
- **حدث جانبي موثق:** خطآن عابران `stampQueueBundleField write failed: supabase.co 520` (18:27 و18:29 UTC) — ختم الحزمة بالقاعدة فشل عابرًا **لكن دورة الإصلاح استمرت** لأن التوجيه سافر برد المسار نفسه — مرونة مقصودة عملت، والختم الفاشل قابلية فقدان تشخيص لو انقطع الاتصال بين الرفض والإعادة (رصد).

## 3) الحكم

- **S1-3: EXECUTED (نجاح الوظيفة كوصلة + ممارسة حية كاملة لمنظومة الإصلاح على خط المدونة EN):** الوظيفة done بوصلة صادقة، والخط مارس عقد العيب والتوجيه والدورتين والفشل الصادق — **شرط نجاح T1 رقم 3 («تنجح أو ترمي بمحاولتين مسميتين») مستوفٍ من الجهتين.**
- **أثر النشر:** لا مقال EN منشورًا من هذه التشغيلة (الفشل الصادق عند P5) — خانة EN للأسبوع ما زالت حرّة (الحارس الأسبوعي لم يُستحق).
