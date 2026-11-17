# S5-2 / INF-1 — التبريد والسلسلة: قاطع الدائرة لنفاد حصة المزود على مسار السلسلة الحي (T5)

> **البند:** INF-1 (الطبقة المشتركة — عامل الطابور process-ai-jobs) · **المرحلة:** T5 · **السيناريو الحامل:** S5-2 (مرصَد كل فشل مزود طبيعي بنوافذ الخطة + البديل الموثق عند غياب 429 بنافذة T5 ذاتها).
> **المصدر:** أمر المالك 2026-11-18 «نفّذ البند التالي مباشرة من خطة التنفيذ… دون تجاوز أي بند» — أول بند PENDING بترتيب جدول §8 (كل بنود T0→T4 مغلقة والبنود PARTIAL قبله نوافذ عارضة ممتدة بقاعدة §5-ج لا تُفرض).
> **الكوميت الجاري:** b3547343 (HEAD main لحظة التنفيذ — docs-only فوق كود الإنتاج a08dc27) · **إصلاح البند:** 0f446fb8 (P0-1 — env العامل AI_PROVIDER_COOLDOWN_MS=1800000) سلف مباشر لكل تشغيلات الأدلة (مؤكد بgit merge-base).

## 0) الحكم النصي

**نجح INF-1 بدليل تشغيلي حي قابل للفتح:** ثلاثة أحداث نفاد حصة groq يومية (TPD) **طبيعية** على وظائف حقيقية بنوافذ الخطة علّمت نطاق المزود `chain:groq` لنافذة 30:00 دقيقة بالضبط، ثم **صفر نداء شبكة على groq** حتى نهاية كل تشغيلة (تخطي فوري بلا استهلاك ميزانية محاولات — الفارق المقيس 598µs بين سطر القيادة وسطر التخطي)، وخدم المزود الصحي التالي الوظائف كلها من المحاولة الأولى (176ث · 370ث · 21ث) — **لا وظيفة وصلت سقف المحاولات الثلاث بسببه**؛ وصنفا الفشل العابر (429 لكل-دقيقة TPM و413 حجم طلب) لم يجمّدا المزود (قانون P2-3) وواصل groq الخدمة بالنداء التالي؛ وعند فشل السلسلة كاملةً أُعلن التبريد بصدق بالخطأ المجمّع. +4 كناريّات سلسلة تثبّت القوانين وتمنع العودة (البطارية 6,596→6,600).

## 1) منهج التنفيذ (وفق §2-أ INF-1 + سيناريو S5-2 حرفيًّا)

1. **مراقبة تشغيلات العامل بنافذة T5:** استُدعي العامل حيًّا بنافذة T5 نفسها (تشغيلة **44167270580** على HEAD ‏b3547343 — §5 أدناه) وأُعيد جلب كل تشغيلات العامل بنوافذ الخطة T1→T4 (20 تشغيلة: 11-15→11-17) وفُحصت سجلاتها سطرًا سطرًا بحثًا عن كل فشل مزود طبيعي.
2. **قراءة سجلات السلسلة عند كل فشل مزود:** صُنّف كل حدث (صنف الفشل + مجال التبريد + أثره على الوظائف) — §2.
3. **البديل الموثق (تبعية INF-1):** لم يقع 429 طبيعي بنافذة T5 ذاتها (طابور فارغ — صفر نشاط سلسلة)، فاستُخدم البديل الذي يعتمده البند حرفيًّا: **تشغيلات تاريخية حاملة تبريدًا** من نوافذ مراحل الخطة نفسها (S5-2: «تشغيلات المراحل كلها») + **env العامل الحي** المقروء من تشغيلة بنافذة T5.
4. **حالة الصفوف:** استعلامات قراءة-فقط على ai_jobs (§6-ج) + الحالات الختامية المحفوظة بسجلات GHA غير القابلة للتعديل.
5. **كناريّات تمنع العودة:** ملف اختبار جديد بمستوى السلسلة (§4) لأن التغطية القائمة كانت بوحدة السجل (ai-provider-cooldown.test.ts) ومصفوفة النطاق (ai-provider-p1-cooldown-scope.test.ts) — ولم تثبت ذرات INF-1 بمستوى المشي الفعلي.

## 2) المرصَد المصنَّف — كل فشل مزود طبيعي بنوافذ الخطة (تشغيلات العامل)

| # | التشغيلة (معرف قابل للفتح) | الوقت (UTC) | كوميت | الحدث الطبيعي | الصنف → المجال | أثره على الوظائف |
|---|---|---|---|---|---|---|
| أ | [43926112257](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/43926112257) | 11-16 18:12 | 27ae957a | groq/gpt-oss-120b: **429 TPD** «Limit 200000, Used 199851, Requested 797. Please try again in 4m39.936s» | quota → `chain:groq` حتى 18:42:23.241Z (30:00.000) | السلسلة فشلت كاملة بفشلها الحقيقي (openrouter مهل 70ث ×2 + groq مستنزف) — **التبريد مُعلن بصدق بالخطأ النهائي** (المقتطف §3-أ)؛ الوظيفة 3a65f8d1 فشلت نهائيًا **بسبب poison-pill الحاصد (GAP-2/INF-12 — قبل إصلاح 44d0c9c0)** لا بسبب التبريد: المحاولة الرابعة منحها الحاصد القديم |
| ب | [43943421512](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/43943421512) | 11-16 19:53 | 44d0c9c0 | groq/gpt-oss-120b: **429 TPD** «Used 198116, Requested 4621. Please try again in 19m42.384s» | quota → `chain:groq` حتى 20:23:02.987Z (30:00.000) | **صفر نداء groq بعدها** (سطرا تخطٍ 19:54:12 · 19:55:22 بلا نداء) — نجح gemini-3.5-flash (tail) ← الوظيفة a9a1c82c **attempt=1 done في 370ث** + ظهر حارس INF-12 حيًّا («queued job 4b5373c5 at attempts 3/3 finalized as failed (no claim granted)») |
| ج | [43944757410](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/43944757410) — **الدليل المحوري** | 11-16 19:59 | 44d0c9c0 | groq/gpt-oss-120b: **429 TPD** «Used 197239, Requested 4576. Please try again in 13m4.079999999s» | quota → `chain:groq` حتى 20:29:22.403Z (30:00.000) | **صفر نداء groq بعدها عبر وظيفتين** (4 أسطر تخطٍ §3-ب) — الوظيفتان عبرتا من المحاولة الأولى: plan_nutrition#83200d08 ‏**176ث** (gemini tail) وarticle_tool#8c42b097 ‏**21ث** (nvidia strong) — خاتمة التشغيلة `done=2 failedPermanent=0` |
| د | [44078904052](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44078904052) | 11-17 12:00 | 5a9fbf6f | groq/gpt-oss-120b: **429 TPM لكل-دقيقة** «Limit 8000, Used 4785, Requested 3396. Please try again in 1.3575s» — بعد نجاح حي للمزود نفسه بالثانية السابقة (tier=strong) | **عابر — بلا تبريد** (قانون P2-3: groq429PerMinuteClass) | groq لم يُجمّد وواصل المسير؛ الوظيفة meal_regenerate#143eff1c ‏**attempt=1 done في 127ث** (الصف حي بالقاعدة — §6) |
| هـ | [44069109588](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44069109588) | 11-17 10:57 | 5a9fbf6f | groq/gpt-oss-120b: **413** «Request too large … (TPM): Limit 8000, Requested 8885» | **عابر — بلا تبريد** (صياغة لكل-دقيقة → perMinuteGroq429) | groq واصل الخدمة (gpt-oss-20b جُرّب 10:58:45 ثم qwen نجح 11:00:01)؛ الوظيفة plan_nutrition#a34dce64 ‏**attempt=1 done في 321ث** (الصف حي — §6) |

**إعادة اختبار التعافي (اليوم التالي — 11-17):** groq يخدم مجددًا بكل التشغيلات بعد إعادة تعيين TPD اليومية (qwen tail ×6 · gpt-oss-120b strong ×2 بمسار plan:nutrition/nutrition-alt/workout) — كل عامل GHA عملية جديدة على VM جديدة فالسجل يبدأ نظيفًا: **التعافي يُعاد فحصه دائمًا ولا يُفترض** (قانون التصميم بالوحدة).

## 3) المقتطفات الحرفية (أسطر الحكم من سجلات التشغيلات)

### 3-أ) الحدث أ — الإعلان الصادق بالخطأ المجمّع (43926112257)

```
2026-11-16T18:12:23.2419458Z [ai-fallback-chain] [ai-job:paraphrase] groq/openai/gpt-oss-120b notice, trying next: AI API error 429 from groq: {"error":{"message":"Rate limit reached for model `openai/gpt-oss-120b` … on tokens per day (TPD): Limit 200000, Used 199851, Requested 797. Please try again in 4m39.936s. …"}}
2026-11-16T18:12:23.2427148Z Active quota-cooldowns: chain:groq until 2026-11-16T18:42:23.241Z
```

### 3-ب) الحدث ج — الدليل المحوري الكامل (43944757410): التعليل ← التخطي بلا نداء ← الوظيفتان تعبران

```
2026-11-16T19:58:09.9068933Z [ai-jobs] ▶ processing plan_nutrition#83200d08 attempt=1
2026-11-16T19:59:22.4031792Z [ai-meter] fn=plan_nutrition provider=groq model=openai_gpt-oss-120b outcome=quota latency=176ms tokens_est=-
2026-11-16T19:59:22.4089749Z [ai-fallback-chain] [plan:nutrition] groq/openai/gpt-oss-120b notice, trying next: AI API error 429 from groq: {"error":{"message":"Rate limit reached for model `openai/gpt-oss-120b` … on tokens per day (TPD): Limit 200000, Used 197239, Requested 4576. Please try again in 13m4.079999999s. …"}}
2026-11-16T19:59:22.4091644Z [ai-fallback-chain] [plan:nutrition] groq in quota-cooldown → skipping its entries until 2026-11-16T20:29:22.403Z
2026-11-16T20:00:32.4111616Z [ai-fallback-chain] [plan:nutrition] groq in quota-cooldown → skipping its entries until 2026-11-16T20:29:22.403Z
2026-11-16T20:01:03.8808013Z [gemini-usage] tag=plan_nutrition model=gemini-3.5-flash ok=1 … latency=31469ms
2026-11-16T20:01:04.1257484Z [ai-fallback-chain] [plan:nutrition] gemini/gemini-3.5-flash succeeded (tier=tail)
2026-11-16T20:01:06.3183155Z [ai-jobs] ✓ plan_nutrition#83200d08 attempt=1 done in 176s
2026-11-16T20:01:06.3207731Z [ai-jobs] ▶ processing article_tool#8c42b097 attempt=1
2026-11-16T20:01:06.3208116Z [ai-fallback-chain] [ai-job:paraphrase] lead=groq (call #2, orKeys=2)
2026-11-16T20:01:06.3208714Z [ai-fallback-chain] [ai-job:paraphrase] groq in quota-cooldown → skipping its entries until 2026-11-16T20:29:22.403Z
2026-11-16T20:01:18.9004793Z [ai-fallback-chain] [ai-job:paraphrase] groq in quota-cooldown → skipping its entries until 2026-11-16T20:29:22.403Z
2026-11-16T20:01:26.9148218Z [ai-fallback-chain] [ai-job:paraphrase] nvidia/nvidia/nemotron-3-ultra-550b-a55b succeeded (tier=strong)
2026-11-16T20:01:27.4790049Z [ai-jobs] ✓ article_tool#8c42b097 attempt=1 done in 21s
2026-11-16T20:01:27.7088578Z [ai-jobs] ══ summary: done=2 failedPermanent=0
```

**قراءة الأرقام:** (1) التعليل عند 19:59:22.403 حتى 20:29:22.403 = **30:00.000 دقيقة بالضبط** (AI_PROVIDER_COOLDOWN_MS=1800000). (2) الوظيفة الثانية كان **groq قائدها** (lead=groq call #2): الفارق بين سطر القيادة (…3208116) وسطر التخطي (…3208714) = **598 ميكروثانية** — تخطي فوري بلا أي نداء شبكة على المزود الميت. (3) groq لم يُسأل مرة أخرى حتى نهاية التشغيلة (20:01:27) والمزود الصحي التالي خدم الوظيفتين من المحاولة الأولى.

### 3-ج) الصنف العابر — 429 لكل-دقيقة لا يجمّد (44078904052)

```
2026-11-17T12:00:34.9963349Z [ai-fallback-chain] [plan:nutrition-alt] groq/openai/gpt-oss-120b succeeded (tier=strong)
2026-11-17T12:00:35.2273016Z [ai-fallback-chain] [plan:nutrition-alt] groq/openai/gpt-oss-120b notice, trying next: AI API error 429 from groq: {"error":{"message":"Rate limit reached for model `openai/gpt-oss-120b` … on tokens per minute (TPM): Limit 8000, Used 4785, Requested 3396. Please try again in 1.3575s. …"}}
2026-11-17T12:01:32.6492824Z [ai-fallback-chain] [plan:nutrition-alt] groq/openai/gpt-oss-20b notice, trying next: … honest failure, the chain moves to the next entry
2026-11-17T12:01:34.5737405Z [ai-jobs] ✓ meal_regenerate#143eff1c attempt=1 done in 127s
```
(لا سطر تبريد إطلاقًا — groq-20b جُرّب فعليًّا بعد الـ429 العابرة: المزود لم يُجمّد لتعطيش ثوانٍ.)

## 4) الكناريّات المضافة (+4 — تمنع عودة المشكلة)

ملف جديد `src/lib/__tests__/ai-provider-inf1-cooldown-walk.test.ts` بمستوى **مشي السلسلة الفعلي** (كانت التغطية القائمة بوحدة السجل ومصفوفة النطاق فقط)، بأجسام 429 الحية الحرفية من التشغيلات أعلاه (معرف المؤسسة منقّى):

1. **قانون عدم إعادة المشي:** 429-TPD يعلّل `chain:groq` ← النداء التالي بنفس العملية يتخطى كل مداخل groq **بصفر نداءات شبكة** (groqCalls يبقى 1) والمزود التالي يخدم — مع تحقق نافذة 30 دقيقة (>29 دقيقة) وسبب التعليل `quota: groq/…`.
2. **قانون عدم استهلاك الميزانية:** بmaxModels=2 ومدخلا groq ميتان قبل nvidia — التخطي لا يستهلك محاولة فيصل nvidia وتنجح الوظيفة (لو استهلك التخطي لفشلت — هذا هو انحدار ما قبل 0f446fb8 الذي دفع الوظائف لسقف الثلاث محاولات).
3. **الصنف العابر:** 429-TPM بأقل-من-دقيقة (تلميح 1.3575s) لا يعلّل المزود — كلا مدخلي groq يُسألان فعليًّا (groqCalls=2) والنداء التالي كذلك (=4) و`cooldownState("chain:groq")` فارغ.
4. **الصدق عند الفشل الكامل:** عند فشل nvidia أيضًا، الخطأ المجمّع يحمل حرفيًّا «groq: quota-cooldown until … — entries skipped, no call made» + «Active quota-cooldowns: chain:groq until …» (توقيع 43926112257) — groq يُسأل مرة واحدة فقط عبر النداءين.

## 5) env العامل الحي (نافذة T5 — التشغيلة المنفذة بهذا الإطار)

- **تشغيلة T5 المنفذة:** [44167270580](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44167270580) (workflow_dispatch على HEAD ‏b3547343 — 2026-11-17T20:14:54Z) — تُطبع حيًّا `AI_PROVIDER_COOLDOWN_MS: 1800000` بالبيئة، والطابور فارغ (`done=0 failedPermanent=0` — green run) — لا حدث 429 بنافذة T5 ذاتها (البديل الموثق §1-3).
- تشغيلة الجدولة الأخيرة قبلها [44157264043](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44157264043) (على a08dc27 = beacon الإنتاج — 19:19:03Z): نفس طباعة env الحية وطابور فارغ.

## 6) حالة الصفوف (استعلامات قراءة-فقط — ضوابط §6-ج)

**استعلام 1 — صفوف الوظائف المعنية بنافذة 11-17 (حيّة):**
```
GET /rest/v1/ai_jobs?id=eq.143eff1c-bc26-4a6b-b4cf-d32bc06868f0&select=*
→ [{"id":"143eff1c-bc26-4a6b-b4cf-d32bc06868f0","job_type":"meal_regenerate",
    "status":"done","attempts":1,
    "created_at":"2026-11-17T11:59:09.662299+00:00",
    "finished_at":"2026-11-17T12:01:34.002+00:00"}]
GET /rest/v1/ai_jobs?job_type=eq.plan_nutrition&select=id,status,attempts&order=created_at.desc&limit=40
→ a34dce64 | plan_nutrition | done | attempts=1   (حدث هـ — 413)
→ 60d2bde8 | plan_nutrition | done | attempts=1   (تشغيلة 44110982069)
→ fb82bc7d | plan_nutrition | done | attempts=1   (خطة T4 الموثقة s4-1)
```

**استعلام 2 — لقطة الطابور وقت الإطار:** `GET /rest/v1/ai_jobs?status=in.(queued,processing)&select=id,job_type,status,attempts` → `[]` (صفر صفوف مفتوحة — 2026-11-17T20:16:39Z).

**صفوف أحداث 11-16 (83200d08 · 8c42b097 · a9a1c82c · 3a65f8d1):** حُذفت بأمر المالك (تنظيف حسابات الاختبار — 8 صفوف ai_jobs ضمن 67 صفًا، موثق بworklog مدخل التنظيف) — حالاتها الختامية محفوظة بسجلات GHA غير القابلة للتعديل (المقتطفات §3: `attempt=1 done` للثلاث الأولى و`attempt=4 FAILED` لpoison-pill GAP-2 المغلقة) وبملفات أدلة T1/T2 (fix-verification-nut12: plans#ffef6b37 ‏approved+current لحظتها).

## 7) ما تعذّر إجراؤه (موثق بصراحة)

1. **429 طبيعي بنافذة T5 ذاتها:** الطابور فارغ منذ إغلاق T4 فلم يقع أي نداء سلسلة بنافذة T5 (التشغيلتان 44157264043/44167270580 بصفر معالجة) — استُخدم البديل المعتمد بالبند («تشغيلة تاريخية حاملة تبريدًا») من نوافذ مراحل الخطة نفسها، وهو مسار S5-2 الحرفي («عند غياب 429 طبيعي: توثيق سلوك من تشغيلة تاريخية حاملة تبريدًا + env العامل الحي»).
2. **مراقبة انتهاء النافذة داخل نفس التشغيلة:** كلتا التشغيلتين الحاملتين للتبريد انتهتا (20:01) قبل انقضاء نافذة الثلاثين دقيقة (20:23/20:29) — لا يوجد رصد ضمني لإعادة المشي بعد انتهاء النافذة داخل تشغيلة واحدة؛ إعادة الاختبار مثبتة عابرًا للتشغيلات (اليوم التالي: groq يخدم من أول تشغيلة — §2 ذيل الجدول) وكل عامل GHA عملية جديدة على VM جديدة بحكم التصميم («Fresh runner = fresh state = quota recovery is always re-probed, never assumed»).
3. **ذرة «gone» من INF-3 (404 نموذج ميت طبيعي):** لم يقع أي 404 بمزود بنوافذ الخطة كلها — نطاق INF-3 يبقى لبنده (هذا الإطار ينفذ INF-1 حصرًا؛ رُصدت ذرة quota منه فقط: التجميد بمجال المزود كاملًا + انضباط الصنف العابر).
4. **صفوف DB لأحداث 11-16:** حُذفت بأمر المالك قبل هذا الإطار — عُوّضت بسجلات GHA غير القابلة للتعديل (أنظر §6).

## 8) التحقق البرمجي المرافق (البطارية — ليس دليلًا بذاته بقانون §الحاكم)

`tsc --noEmit` صفر · `eslint` (الملف الجديد) صفر · **vitest 260 ملفًا / 6,600 من 6,600** (كانت 6,596 — +4 كناريّات INF-1 بلا سقوط أي اختبار) · `build` ‏2,323 صفحة.

**نتائج كوميت الدفع 97926ca الفعلية (main):**
| البوابة | التشغيلة | النتيجة |
|---|---|---|
| Quality gate (tsc · eslint · vitest) | [44168154969](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44168154969) | ✅ success |
| Deploy to AWS origin | [44168154931](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44168154931) | ✅ success |
| Docs & schema parity gate | [44168154983](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44168154983) | ✅ success |
| Anti-regression guard (stale refs) | [44168154935](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44168154935) | ✅ success |
| Migration state audit | [44168154956](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44168154956) | ✅ success |

**beacon الإنتاج بعد النشر:** `GET /api/build-info` (2026-11-17T20:30:50Z) → `{"ok":true,"service":"alkemos","commit":"97926ca794a5c2519d7d6aa3cc9ad83e165a59ea","commitShort":"97926ca","branch":"main"}` — الإنتاج يخدم كوميت التنفيذ الحامل للكناريّات الأربع.
