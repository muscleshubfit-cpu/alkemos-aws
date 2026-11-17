# S5-5 / INF-13 — idempotency التجسيد بjob_id: صفر مسودة مكررة عند إعادة تشغيل وظيفة منجزة (T5)

> **البند:** INF-13 (الطبقة المشتركة — التجسيد idempotent بjob_id · إصلاح 2c8b1f48 ‏P1-م7 + ميجريشن 0112 بفهرس فريد جزئي) · **المرحلة:** T5 · **السيناريو الحامل:** S5-5 (إعادة تشغيل وظيفة منجزة لعميل الاختبار — نفس الجذر: صفر مسودة مكررة).
> **المصدر:** أمر المالك 2026-11-18 «نفّذ البند التالي مباشرة من خطة التنفيذ… دون تجاوز أي بند» — رابع إطار T5: البند التالي PENDING بترتيب جدول §8 بعد إغلاق INF-1 ‏(97926ca) وINF-3 ‏PARTIAL ‏(0cf410f) وINF-19+INF-7 ‏(63c9365).
> **الكوميت الجاري:** 0a7bd640 (HEAD main لحظة التنفيذ — docs-only فوق كود الإنتاج a08dc27) · **إصلاح البند:** 2c8b1f48 سلف مباشر لكل تشغيلات الأدلة (merge-base مؤكد).
> **التجربة الحاملة:** تشغيلة العامل [44198127954](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44198127954) (dispatch ‏23:17:58Z على HEAD ‏0a7bd640 · خاتمة success ‏23:21:12Z).

## §0 — الحكم النصي

**نجح INF-13 بدليل تشغيلي حي قابل للفتح:** الوظيفة `plan_nutrition#fb82bc7d` المنجزة (بخطة العضو المعتمدة الحالية `a2fc0c91` المختومة بjob_id) **أُعيد تشغيلها حيًا بمحاكاة جذر العيب الحرفي** — صف `processing` عالق منذ >30 دقيقة (الشكل الذي يخلفه نجاح المعالج ثم فشل `finishJob`) ← حاصد العامل أعاد إدراجه تحت السقف («reaper: 1 stale job(s) requeued (below attempts cap)») ← الالتقاط منح **المحاولة 2** ← التوليد أعاد العمل بسلسلة حقيقية كاملة (أربعة مداخل فشلت بصدق مسمى ثم فاز `groq/qwen3.8-27b` بusage حقيقي 7,146 توكن) ← وعند التجسيد أطلق العامل **سطر الـno-op المسمى حرفيًا**: `[plan job] INF-13 idempotent skip: plans#a2fc0c91-d792-4d5d-99ec-8799ac8f251f already materialized for job fb82bc7d` — والنتيجة أعادت الصف نفسه (`result.plan_id=a2fc0c91` · `materialized=true`). **الحكم الحاسم بالقاعدة (قبل/بعد): صف واحد فقط يحمل ختم الوظيفة — صفر مسودة مكررة**، ومحتوى الصف الأصلي لم يُمس (كتلة generation كما هي)، وخصم الحصة بقي **واحدًا بنيويًا** (إدراج إعادة التشغيل مات بقيد UNIQUE ‏`ai_plan_usage_job_ref_uidx` بسطر مسمى بالسجل — قانون ميجريشن 0110)، والوظيفة أنهت `done` بمحاولتين وخاتمة التشغيلة `done=1 failedPermanent=0` (خضراء حقيقية).

## §1 — المنهج (وفق §2-أ INF-13 + سيناريو S5-5 حرفيًا)

1. **الفحص قبل التعديل:** (أ) الكود المنفذ منذ 2c8b1f48: ‏`materializePlanDraftRow` (ai-job-processors.ts:797-911) يبحث أولًا بـ`.eq("job_id", jobId).limit(1).maybeSingle()` ويعيد الموجود as-is بسطر مسمى، والإدراج الجديد يختم `job_id`، والمسار القديم (بلا jobId) يحفظ سلوك الإدراج التاريخي، والخطأ العابر بالبحث يهبط للمسار القديم (catch) — والعدّاد `ProcessorCtx.jobId` يمرر من العامل (process.mts:244). (ب) الصفوف قبل التجربة: الوظيفة `done/attempts=1/finished 10:43:14Z` وخطة واحدة معتمدة حالية وخصم واحد. (ج) الطابور فارغ (صفر queued/processing) — عزل التجربة.
2. **اختيار الوظيفة (قناة QA حصرًا):** `fb82bc7d-51f4-48e2-96bd-e268502334f8` — وظيفة T4 الأصلية للعضو الاختبار `c050b509` (profiles.is_test_account=true · النطاق المحجوز @alkemos-test.com) — الكتابة الوحيدة فوق صف مملوك لحساب الاختبار (قانون قناة الاختبار · AGENTS §6).
3. **محاكاة جذر العيب الحرفي (وليس مجرد صف queued):** PATCH واحد فوق صف الوظيفة: `status=processing` + `started_at=now−35min` + `finished_at=null` — الشكل الحرفي لما يخلفه فشل finishJob بعد نجاح المعالج (بدأ ولم يختم) — فتدور التجربة بالسلسلة الكاملة: **حاصد ← إعادة إدراج ← التقاط ← محاولة 2 ← توليد حقيقي ← تجسيد idempotent ← ختم done**.
4. **إطلاق العامل:** workflow_dispatch على `process-ai-jobs.yml` (ref=main · max_jobs=10) — التشغيلة 44198127954.
5. **المراقبة:** سجل التشغيلة سطرًا سطرًا + فحص القاعدة قبل/بعد (قراءة PostgREST مباشرة).

## §2 — التسلسل الحي بالساعة (كل الأوقات UTC — من سجل التشغيلة 44198127954)

| # | الخطوة | الوقت | السطر الحرفي (مقتطف §4) |
|---|---|---|---|
| 1 | إعادة الضبط (قناة QA) | 23:17:41 | صف الوظيفة: processing · started_at=22:42:40 (عالق 35د) · finished_at=null |
| 2 | إطلاق العامل | 23:17:58 | dispatch ‏44198127954 على HEAD ‏0a7bd640 |
| 3 | **الحاصد يعيد الإدراج تحت السقف** | 23:18:21.280 | `[ai-jobs] ↩︎ reaper: 1 stale job(s) requeued (below attempts cap) · 0 at-cap job(s) failed PERMANENTLY (INF-12 — no automatic re-enqueue)` |
| 4 | **الالتقاط يمنح المحاولة 2** | 23:18:22.027 | `[ai-jobs] ▶ processing plan_nutrition#fb82bc7d attempt=2` |
| 5 | التوليد الحقيقي (سلسلة كاملة) | 23:18:24→23:21:08 | مشبك R3 حي (payload ~9084t → groq entries بmax_tokens 5116t) ثم 4 محاولات فاشلة **صادقة مسماة** (openrouter abort ‏70s · groq-120b finish_reason=length · groq-20b length · nvidia abort ‏70s) ثم `[ai-fallback-chain] [plan:nutrition] groq/qwen/qwen3.8-27b succeeded (tier=tail)` |
| 6 | العداد الحقيقي للنداء الفائز | 23:21:08.352 | `[ai-meter] … outcome=ok … tokens_in=3870 tokens_out=3276 tokens_total=7146 cost_cents=0` (INF-19 حي: usage حاضر ⇒ tokens_est=-) |
| 7 | **التجسيد idempotent — جوهر INF-13** | 23:21:09.940 | `[plan job] INF-13 idempotent skip: plans#a2fc0c91-d792-4d5d-99ec-8799ac8f251f already materialized for job fb82bc7d` |
| 8 | الإرجاع (الصف نفسه) | 23:21:09.940 | `[plan_nutrition] draft materialized: plans#a2fc0c91-d792-4d5d-99ec-8799ac8f251f` |
| 9 | **خصم الحصة مرة واحدة بنيويًا** | 23:21:11.711 | `[tier-limits] recordUnifiedPlanUsage error: duplicate key value violates unique constraint "ai_plan_usage_job_ref_uidx"` (إدراج إعادة التشغيل مات بالقيد — قانون 0110) |
| 10 | ختم الوظيفة | 23:21:11.711 | `[ai-jobs] ✓ plan_nutrition#fb82bc7d attempt=2 done in 170s` |
| 11 | خاتمة التشغيلة | 23:21:12.504 | `[ai-jobs] ══ summary: done=1 failedPermanent=0` + `✅ every processed job succeeded — this green run is genuine.` |

**قراءة التسلسل:** من إعادة الإدراج (خطوة 3) إلى الالتقاط (خطوة 4) **1.75 ثانية** — ومن الالتقاط إلى الختم 170 ثانية (التوليد الحقيقي كاملًا: المحاكاة لم تختصر شيئًا من العمل — الفارق الوحيد عن التشغيلة الأولى هو خطوة التجسيد: ‏no-op مسمى بدل إدراج).

## §3 — الحكم الحاسم بالقاعدة (قبل/بعد — قراءة PostgREST مباشرة)

| الجدول | قبل التجربة | بعد التجربة | الحكم |
|---|---|---|---|
| `ai_jobs` ‏(`id=fb82bc7d…`) | done · attempts=1 · started 10:40:28 · finished 10:43:14 | **done · attempts=2** · started 23:18:21 · finished 23:21:09 · error_message=null | إعادة التشغيل عبرت كاملة بلا فشل |
| `plans` ‏(`job_id=fb82bc7d…`) | **صف واحد**: a2fc0c91 (approved · is_current=true · خطة تغذية QA member) | **صف واحد نفسه** — والمحتوى الأصلي لم يُمس (generation: ‏qwen/qwen3.8-27b/groq/tail · daily_calories=2254 كما كانا) | **صفر مسودة مكررة — شرط نجاح البند حرفيًا** («صف واحد بمعرف الوظيفة») |
| `ai_plan_usage` ‏(`job_ref=fb82bc7d…`) | صف واحد (أُنشئ 10:43:14 بالإدراج الأصلي) | **صف واحد** — إدراج إعادة التشغيل مات بالفهرس الفريد (السطر الحرفي بخطوة 9) | الخصم مرة واحدة بنيويًا (لا حرق مضاعف لإعادة التشغيل) |
| `ai_jobs.result` | ‏plan_id=a2fc0c91 · materialized=true (النتيجة الأصلية) | ‏**plan_id=a2fc0c91** · materialized=true · quality_tier=tail · source=groq:qwen/qwen3.8-27b | النتيجة الجديدة تشير للصف الأصلي — المراقب الطرفي يرى materialized=true فلا يدرج (لا ازدواج طرفي) |

## §4 — المقتطفات الحرفية (سجل التشغيلة 44198127954 — منقّى بلا PII ولا مفاتيح)

```
2026-11-17T23:18:21.2809965Z [ai-jobs] ↩︎ reaper: 1 stale job(s) requeued (below attempts cap) · 0 at-cap job(s) failed PERMANENTLY (INF-12 — no automatic re-enqueue)
2026-11-17T23:18:22.0277939Z [ai-jobs] ▶ processing plan_nutrition#fb82bc7d attempt=2
2026-11-17T23:18:24.0274632Z [ai-fallback-chain] [plan:nutrition] payload ~9084t exceeds Groq 8k TPM window → R3 clamp: groq entries kept with max_tokens 5116t (floor 3800)
2026-11-17T23:18:24.0275748Z [ai-fallback-chain] [plan:nutrition] lead=openrouter (call #1, orKeys=2)
2026-11-17T23:19:34.0381225Z [ai-meter] fn=plan_nutrition provider=openrouter model=nvidia_nemotron-3-ultra-550b-a55b_free outcome=fail latency=70010ms tokens_est=-
2026-11-17T23:19:34.0391999Z [ai-fallback-chain] [plan:nutrition] openrouter/nvidia/nemotron-3-ultra-550b-a55b:free notice, trying next: This operation was aborted
2026-11-17T23:19:45.1093428Z [ai-meter] fn=plan_nutrition provider=groq model=openai_gpt-oss-120b outcome=fail latency=11070ms tokens_est=-
2026-11-17T23:19:45.1102879Z [ai-fallback-chain] [plan:nutrition] groq/openai/gpt-oss-120b notice, trying next: groq/openai/gpt-oss-120b spent the completion budget on reasoning and hit max_tokens before any final answer (finish_reason=length, no content) — honest failure, the chain moves to the next entry
2026-11-17T23:19:51.0670750Z [ai-meter] fn=plan_nutrition provider=groq model=openai_gpt-oss-20b outcome=fail latency=5956ms tokens_est=-
2026-11-17T23:19:51.0678206Z [ai-fallback-chain] [plan:nutrition] groq/openai/gpt-oss-20b notice, trying next: groq/openai/gpt-oss-20b spent the completion budget on reasoning and hit max_tokens before any final answer (finish_reason=length, no content) — honest failure, the chain moves to the next entry
2026-11-17T23:21:01.0684406Z [ai-meter] fn=plan_nutrition provider=nvidia model=nvidia_nemotron-3-ultra-550b-a55b outcome=fail latency=70001ms tokens_est=-
2026-11-17T23:21:01.0688909Z [ai-fallback-chain] [plan:nutrition] nvidia/nvidia/nemotron-3-ultra-550b-a55b notice, trying next: This operation was aborted
2026-11-17T23:21:08.3521133Z [ai-fallback-chain] [plan:nutrition] groq/qwen/qwen3.8-27b succeeded (tier=tail)
2026-11-17T23:21:08.3522652Z [ai-meter] fn=plan_nutrition provider=groq model=qwen_qwen3.8-27b outcome=ok latency=7283ms tokens_est=- tokens_in=3870 tokens_out=3276 tokens_total=7146 cost_cents=0
2026-11-17T23:21:09.9408653Z [plan job] INF-13 idempotent skip: plans#a2fc0c91-d792-4d5d-99ec-8799ac8f251f already materialized for job fb82bc7d
2026-11-17T23:21:09.9409714Z [plan_nutrition] draft materialized: plans#a2fc0c91-d792-4d5d-99ec-8799ac8f251f
2026-11-17T23:21:11.7116615Z [tier-limits] recordUnifiedPlanUsage error: duplicate key value violates unique constraint "ai_plan_usage_job_ref_uidx"
2026-11-17T23:21:11.7118611Z [ai-jobs] usage recorded: plan_nutrition → ai_plan_usage(client c050b509…, requester client/b2b)
2026-11-17T23:21:11.7119192Z [ai-jobs] ✓ plan_nutrition#fb82bc7d attempt=2 done in 170s
2026-11-17T23:21:12.5041335Z [ai-jobs] ══ summary: done=1 failedPermanent=0
2026-11-17T23:21:12.5042197Z [ai-jobs] ✅ every processed job succeeded — this green run is genuine.
```

**ولقطة إعادة الضبط (قبل التشغيلة):** `ai_jobs` قبل: `done · attempts=1 · finished_at=2026-11-17T10:43:14.267+00:00` ← بعد ‏PATCH ‏(23:17:41Z): `processing · attempts=1 · started_at=2026-11-17T22:42:40.406+00:00 · finished_at=null` (الشكل الحرفي للصف العالق — بدأ ولم يختم).

## §5 — الكناريّات المانعة للعودة (+5 — ملف جديد بمستوى المعالج الفعلي)

**ملف جديد `src/lib/__tests__/ai-jobs-inf13-idempotent-materialization.test.ts`** — التغطية القائمة قبل هذا الإطار كانت صفرًا على التجسيد الخادمي (ملف plan-jobs.test.ts يخص سجل المتصفح localStorage فقط) — الكناريّات الخمس تثبّت القانون من مدخل PROCESSORS نفسه الذي يستدعيه عامل GHA:

1. **الـno-op المسمى (القانون الأساسي):** وظيفة مجسدة سلفًا ← إعادة التشغيل تعيد **معرف الصف نفسه** ب**صفر إدراج** + سطر `[plan job] INF-13 idempotent skip: plans#… already materialized for job …` حرفيًا + البحث مر بمفتاح `job_id` البنيوي.
2. **جذر S5-5 كاملًا بمحاكاة حتمية:** نجاح ← إعادة إدراج ← إعادة تشغيل بنفس المعرف ← **إدراج واحد فقط عبر الدورتين** (صف حتمي بالحالة) ونتيجة الدورة الثانية تحمل معرف الدورة الأولى وسطر التخطي أطلق مرة واحدة بالدورة الثانية حصرًا.
3. **الإدراج الطازج يختم المفتاح:** لا صف موجود ← إدراج واحد يحمل `job_id` + مسار الخدمة الذاتية يهبط `approved + is_current + approved_at` (شكل a2fc0c91 الحي).
4. **المسار القديم محفوظ:** سياق بلا jobId (وظائف ما قبل 0112 / احتياط المتصفح) ← **لا بحث بjob_id ولا ختم** والإدراج يمشي كالمعتاد — وjobId غير الـUUID يُتجاهل بالحارس نفسه.
5. **الهبوط الصادق عند فشل البحث:** خطأ عابر بالاستعلام (عمود غير مطبق بعد) ← catch يمشي بالإدراج القديم (الوظيفة لا تُبتلع ولا تتكرر) — إدراج واحد بالضبط.

## §6 — ملاحظة صياغة موثقة (لا نقص تنفيذ)

مصفوفة §2-أ للبند تذكر «إعادة تشغيل وظيفة article_generate منجزة» بطريقة التنفيذ — **سهو صياغة بالخطة**: البند الأصلي بالتدقيق الحاكم (AI-GENERATION-PIPELINES-AUDIT-2026-11-15 §النتائج الحرجة INF-13: «صفّا draft مكرر… الإدراج بلا مفتاح job_id») وصف النتيجة المتوقعة بالصف نفسه («plans.job_id يمنع التكرار بنيويًا») وشرطا النجاح/الفشل («صف واحد بمعرف الوظيفة · صفان بنفس الجذر») وقناة الأدلة («صفوف plans المعنية») كلها تخص **مسودة الخطط** حصرًا — و`runArticleGenerate` لا يكتب أي جدول أصلًا (نتيجته نصية فقط — فحص الكود بهذا الإطار). فنُفذ السيناريو على وظيفة خطة حقيقية منجزة (`plan_nutrition#fb82bc7d` — وظيفة T4 الموثقة بخطة معتمدة حالية) وهو التطبيق الأمين للبند؛ التوجيه الصياغي لا يغير شيئًا من الحكم (الذي سقطته التجربة: ازدواج صفوف plans عند إعادة التشغيل).

## §7 — ختم الزمن والتشغيلات

- **إطار التجربة:** 2026-11-17 23:17:41Z (إعادة الضبط) → 2026-11-17 23:21:12Z (خاتمة التشغيلة) — العرض كله بالتوقيت العالمي.
- **التشغيلة الحاملة:** [44198127954](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44198127954) (process-ai-jobs · workflow_dispatch · HEAD ‏0a7bd640 · success) — السجل الخام مرفوع بأرشيف GitHub غير القابل للتعديل.
- **الصفوف المعنية (معرفات قابلة للفتح):** الوظيفة `fb82bc7d-51f4-48e2-96bd-e268502334f8` · الخطة `a2fc0c91-d792-4d5d-99ec-8799ac8f251f` · سجل الخصم `a1cc66aa-aafb-489c-b9b3-ef973a45307d` — كلها لحساب العضو الاختبار `c050b509` (قناة QA).
- **الحالة النهائية للوظيفة:** done · attempts=2 · error_message=null — نفس حالتها قبل التجربة مع محاولة إضافية موثقة (الصف عاد لحالته الوظيفية الكاملة).

## §8 — النتائج الفعلية بعد الدفع (كوميت التنفيذ)

*(يُستكمل بكوميت الإغلاق بعد تحقق CI والنشر — نفس قانون الأطر السابقة.)*

---
*ملف الأدلة — أمر المالك «نفّذ البند التالي» 2026-11-18 · إطار 483 · INF-13 ‏EXECUTED بدليل حي (تشغيلة 44198127954 + صفوف القاعدة قبل/بعد).*
