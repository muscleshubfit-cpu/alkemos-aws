# GSC surface scan at HEAD — 2026-11-12 (session date) / 2026-11-11 ~21:00 UTC

> **الغرض:** مسح قراءة-فقط لسطح GSC الكامل عند رأس main `3a6e9fdf` (شجرة نظيفة، متطابقة مع origin/main) — إثبات أن السطح لم يتغير منذ 2026-09-30 (سير عمل الاختبار dispatch-only + السر فقط، وصفر مستهلكين) — وهو شرط إعادة التدقيق الإلزامية (أمر المالك 2026-09-30).
> **قابلية إعادة التشغيل:** الأوامر أدناه حرفية وتُعاد من جذر المستودع بأي وقت.

## 1. المستهلكون في كود التطبيق — صفر

```bash
rg -l -i "searchconsole|webmasters|GOOGLE_SEARCH_CONSOLE" src/
# → صفر ملفات (0)
```

## 2. المستهلكون في السكربتات — صفر

```bash
rg -l -i "searchconsole|webmasters|GOOGLE_SEARCH_CONSOLE" scripts/
# → صفر ملفات (0)
```

## 3. المستهلكون في ميجريشنز قاعدة البيانات — صفر

```bash
rg -l -i "searchconsole|webmasters|GOOGLE_SEARCH_CONSOLE" supabase/
# → صفر ملفات (0)
```

## 4. إشارات GSC في سير العمل — أربعة ملفات، واحد سطح حقيقي وثلاثة تعليقات فقط

```bash
rg -l -i "searchconsole|webmasters|GOOGLE_SEARCH_CONSOLE|gsc" .github/workflows/
# gsc-connection-test.yml          ← السطح الحقيقي الوحيد (الاختبار dispatch-only نفسه)
# grounded-failover-test.yml       ← تعليق فقط (سطر 49: سابقة «permissions: {}»)
# bing-url-submission.yml          ← تعليق فقط (سطر 23: ملاحظة الاستيراد من GSC في Bing)
# gdrive-smoke-test.yml            ← تعليق فقط (سطر 232: نمط JWT في gsc-connection-test)
```

**نتيجة المسح:** سطح GSC عند HEAD = **سير عمل الاختبار وحده** (`gsc-connection-test.yml` — dispatch-only، قراءة-فقط: `sites.list` + `searchAnalytics.query` فقط) + **السر** `GOOGLE_SEARCH_CONSOLE_CREDENTIALS` (قيمته لم تُقرأ قط بهذه الجولة — تسجيله الموثق فقط: نطاق `webmasters.readonly`، حساب خدمة `alkemos-gsc-reader@muscleshub.iam.gserviceaccount.com`). **صفر جامع/تخزين/قرّاء/سير عمل مجدول/أسطح أدمن** — مطابق حرفيًا لقيد أمر المالك 2026-09-30 أثناء نافذة التأجيل (2026-10-30→2026-11-29).

## 5. قناة بيانات GSC المستخدمة أثناء فترة التأجيل — التصدير اليدوي حصرًا

كل تحليلات GSC بين 2026-09-30 وهذه الجولة (التقارير 11/13/16/17) عملت على **تصديرات CSV يدوية من المالك** (`alkemos.com-Coverage-2026-11-11.zip` + `alkemos.com-Performance-on-Search-2026-11-11.zip` — محفوظ خامها بـ`raw/gsc-coverage-2026-11-11/` و`raw/gsc-performance-2026-11-12/`) — لا استهلاك API إطلاقًا — مطابق لحرف القيد («No GSC collector… during this window»).

## 6. ملاحظة حدّ إشارية

إشارات «gsc» داخل `src/` (مثل `src/lib/seo-food-band.ts` و`sitemap-commercial.xml/route.ts`) هي **تعليقات توثيقية** تشرح خلفية القرارات (مرشّح طلب GSC لدفعة B2 · تفسير تقرير الخرائط) — لا استدعاء API ولا حتى استيراد مكتبة Google فيها (الفحص الصارم أعلاه = صفر).

---
*الخام مرافق لـ `docs/GSC-RE-AUDIT-2026-11-12.md` — المهمة SEO-PLAN-FINAL-CLOSURE-2026-11-12.*
