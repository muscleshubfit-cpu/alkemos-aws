# التحقق الحي من إصلاح INF-12 (GAP-2) — أمر المالك 2026-11-16 «استكمل T1»

> **الإصلاح:** كوميت `44d0c9c0` على main (CI ‏5/5 والإنتاج حي عليه).
> **القانون الجديد:** `reapStaleJobs` حكمه مقسوم بالسقف (تحت MAX_JOB_ATTEMPTS=3 ← requeue بدلالة الاسترداد التاريخية · عند/فوق السقف ← **failed نهائي**) + `claimQueuedJobs` حارس سقف (الصف الطابور عند السقف يُنهى failed ولا يُمنح محاولة) + العامل يسجل الحكم بصدق.
> **الطريقة:** نفس منهج كشف GAP-2 الحرفي (ختم صف اختبار QA بوضع السم) مُعاد على الكود المُصلح — **بفرعي البوابة معًا**.

## الفرع (أ): الحاصد — الصف `cacf9145`

**التحضير:** وظيفة article_tool حية بقناة المدرب (`cacf9145-424b-4bae-820d-6627fadd43b6`) خُتمت QA: `processing` · `attempts=3` (السقف) · `started_at=now-35د` — **نفس شكل دليل GAP-2 الأصلي حرفيًا** (الوظيفة 3a65f8d1 سابقًا).

| | قبل الإصلاح (دليل GAP-2 · تشغيلة 43926112257) | بعد الإصلاح (19:56:51Z) |
|---|---|---|
| الحكم | الحاصد أعاده `queued` بلا مقارنة ← الالتقاط منحه **محاولة رابعة** (`attempt=4` بالسجل) | `failed` **نهائيًا** |
| attempts | 3 ← 4 (تجاوز السقف) | **3 — لم يتزحزح** |
| error_message | «reaped: processing exceeded time limit — auto-retried» | «reaped: processing exceeded time limit — attempts cap (3/3) reached, failed permanently (INF-12 — no automatic re-enqueue)» |
| finished_at | بلا | 19:56:51.011Z |
| سطر السجل الحي | `reaped 1 stale processing job(s)` | `↩︎ reaper: 0 stale job(s) requeued (below attempts cap) · 1 at-cap job(s) failed PERMANENTLY (INF-12 — no automatic re-enqueue)` (تشغيلة 43943520944) |

## الفرع (ب): حارس الالتقاط — الصف `4b5373c5`

**التحضير:** وظيفة article_tool ثانية (`4b5373c5-4b2b-4c7b-925d-4adff7553baf`) خُتمت QA: `queued` · `attempts=3` · رسالة خطأ سابقة مزروعة — **شكل السم القديم** (صف أعاد الحاصد القديم إدراجه عند السقف).

| | قبل الإصلاح (السلوك المفترض القديم) | بعد الإصلاح (19:56:26.935Z) |
|---|---|---|
| الحكم | يُلتقط ← محاولة رابعة | `failed` **نهائيًا بلا التقاط** |
| attempts | 3 ← 4 | **3 — لم يُلتقط قط** (`started_at=null` يثبت عدم المرور بالمعالج) |
| error_message | (يُستبدل) | «simulated prior failure (QA stamp) — INF-12: attempts cap (3/3) reached — failed permanently, no automatic re-enqueue; retry requires a fresh request through the unified generation paths» (سبب الخطأ السابق **محفوظ**) |
| سطر السجل الحي | — | `[ai-jobs] INF-12 cap guard: queued job 4b5373c5 at attempts 3/3 finalized as failed (no claim granted)` (تشغيلة 43943421512) |

## الدلالة التشغيلية

- **سم الوصفة مات:** الصف المنهار عند السقف لا يعود للطابور لا من الحاصد ولا من الالتقاط — لا محاولة رابعة أبدًا (قانون الأمر حرفيًا).
- **الاسترداد التاريخي سليم:** الصف تحت السقف ما زال يعاد للطابور (كناري + السلوك المتعمد المتروك) — الحاصد لم يُعطَّل بل صار يحكم.
- **إعادة المحاولة بعد الفشل النهائي:** مسار موحد بلا نظام استرداد منفصل — انظر fix-verification-retry.md.

## الكناري المثبت بالكوميت

`src/lib/__tests__/ai-jobs-inf12-permanent-failure.test.ts` (9): الحاصد المقسوم بخمسة سيناريوهات (عند السقف/فوقه/تحته/طازج/مختلط) + حارس الالتقاط بثلاثة (عند السقف يُنهى ولا يُلتقط/تحته يُلتقط ويُزاد/مختلط) + تثبيت سطر السجل الصادق.

**الحكم: INF-12/GAP-2 مُصلح ومُثبت حيًّا بالفرعين مع سجلات عامل مسمّاة — الفجوة مغلقة.**
