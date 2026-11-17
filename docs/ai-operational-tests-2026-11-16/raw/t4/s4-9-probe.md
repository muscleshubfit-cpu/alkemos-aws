# S4-9 — المسبار القياسي (plan-ai-probe.yml): أحمر صادق ثم أخضر

> **البند الحامل:** S4-9 (§4 T4) — NUT-2/4 قياسًا مستقلًا · INF-4/5.
> **القناة:** `workflow_dispatch` على `plan-ai-probe.yml` (المسبار الرسمي: نداءات مزود حقيقية · صفر كتابات DB · جهاز عميل تركيبي كيتو/حساسية/1800 سعرة).

## 1) المحاولة 1 — التشغيلة [44082125752](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44082125752): **فشل صادق (RED)**

- السلسلة: nemotron-ultra ‏abort ×2 · groq-120b/20b ‏finish_reason=length صادقان · **qwen نجح tier=tail مرتين** لكن بوابة الجودة رفضت المخرج: `بوابة الجودة رفضت المخرجات: model returned no meals array` — ثم سقوط محلي.
- **قانون الخروج عمل كما صُمم:** `❌ PLAN-AI-PROBE the real chain did not deliver a gate-passing keto plan (local fallback) — the paid quality bar was not met live` — المسبار أحمر لأن موجة المزود الحالية (الذيل) لم تقدم خطة عالية الجودة — **لا نجاح كاذب**.
- سبب موثف لقاعدة التكرار §5-أ-5: عارض نموذج (نموذج الذيل أعاد مخرجًا بلا meals مرتين).

## 2) المحاولة 2 — التشغيلة [44083095937](https://github.com/muscleshubfit-cpu/alkemos-aws/actions/runs/44083095937): **نجاح كامل (GREEN)**

- **مقتطف حرفي:**
  ```
  ═══ 1) full keto plan @ 1800 kcal (real provider chain) ═══
  [ai-fallback-chain] [plan:nutrition] groq/qwen/qwen3.8-27b succeeded (tier=tail)
  [ai-meter] fn=plan_nutrition provider=groq model=qwen_qwen3.8-27b outcome=ok tokens_in=3279 tokens_out=2911 tokens_total=6190 cost_cents=0
  ═══ 2) independent audit (recomputed from the raw items) ═══
  ═══ 3) meal regeneration under keto (the swap path) ═══
  [plan-generator] meal swap fell back to the local food DB (provider chain failed): All AI providers failed. (system: plan:nutrition-alt)
  source: local-fallback:meal-swap · replacement meal «الفطار» · 4 items · sum 194 kcal vs target 194 (±20% band: 155-233)
  ✅ PLAN-AI-PROBE PASSED — a real provider delivered a keto plan + keto swap that passed the full gate and the independent audit with zero critical findings.
  ```
- **القياسات المستقلة:** خطة كيتو حقيقية 1800 سعرة عبر سلسلة حية (qwen ذيل · 6190 توكن usage حقيقي · cost_cents=0) + تدقيق مستقل **صفر نتائج حرجة** + تبديل وجبة كيتو **متعادل تمامًا** (194 مقابل هدف 194) حتى بمسار سقوط محلي صادق مسمّى.

## 3) الأحكام

- **NUT-2 (قياس مستقل):** التدقيق المستقل قارن kcal_from_macros بالهدف على مسبار حي (صفر حرج) — ذرة القياس ‏EXECUTED (ذرة المعايرة على المسار المحلي فاشلة بGAP-22 من ملف الموجة الثانية).
- **NUT-4 (قياس مستقل):** خطة الكيتو نظيفة من التوكنات الحرام (صفر نتائج) — بوابة الحلال قيست مستقلًا.
- **INF-4:** ختم tier=tail حي بالسجل.
- **INF-5:** صفر نداء للنموذج الميت (nemotron-3-super-120b-a12b:free) عبر **كل** أسطر ai-meter بتشغيلات T4 ‏12 نداءً موزعة (نِمْرُو-أولترا/qwen/gpt-oss فقط).
- **الحكم:** S4-9 ‏**EXECUTED** — المسبار مارَس بوابة الجودة والتدقيق المستقل على المزود الحي بالاتجاهين (رفض صادق + قبول كامل) — الشكل النجاحي المطلوب بالخطة (المحاولة الثانية بقاعدة التكرار).
