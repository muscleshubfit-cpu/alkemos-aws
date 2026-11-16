# T0 — خط الأساس وقاعدة الأدلة (S0-2) — 2026-11-16

> **الإطار:** AI-OPERATIONAL-TEST-PLAN §4 المرحلة T0 · أمر المالك «نفّذ T1 وفق ترتيبها المعتمد» (T0 شرط دخول T1 — §3-أ).
> **المنفّذ:** وكيل Alkemos عبر قناة QA (docs/QA-TEST-ACCOUNTS-2026-10-26.md) — قراءة إنتاج + كتابات على صفوف حسابات الاختبار حصرًا.

## 1) مطابقة الكود (git + beacon)

- `git fetch origin main` → `HEAD == origin/main == 27ae957af68c93c08a54e276068a6a1331578a6a` (كوميت اعتماد الخطة — docs-only).
- beacon الإنتاج `GET https://alkemos.com/api/build-info` (17:58:03Z):

```json
{"ok":true,"service":"alkemos","commit":"2afd61c67769a00326d49cdee4d815783a461f54","commitShort":"2afd61c","branch":"main","checkedAt":"2026-11-16T17:58:03.838Z"}
```

- **حكم المطابقة:** الإنتاج حي على `2afd61c6` = آخر كوميت **كود** على main (إغلاق AI-QUALITY-REPAIR-LOOP الحي: مصلّحات r3 المشتركة). الكوميتان الأعلى منه (`817a797c` توثيقي · `27ae957a` خطة) docs-only فتخطّاهما نشر AWS بقانون deploy-skip (paths-ignore: `**.md` · `docs/**` · `archive/**` · `scripts/**`) — **ليس انحراف beacon**: تشغيلة Deploy على 2afd61c6 (run 43909467899) نجحت ولا كود أحدث منها.
- سجل الدفعات الأربع الأخيرة: `78dd0bcc` → `817a797c` (docs) → `2afd61c6` (آخر كود — عليه الإنتاج) → `27ae957a` (docs — الخطة).

## 2) CI لآخر كوميت (27ae957a) — أخضر

| check | النتيجة |
|---|---|
| Supabase Preview | completed / success |
| guard (stale refs) | completed / success |
| state probes (read-only) | completed / success |
| parity (docs & schema) | completed / success |

(الإطار docs-only فلا quality-gate/deploy بقانون مطابقة النطاق — Phase 290.)

## 3) لقطة queue-health (18:00 UTC تقريبًا — عبر /api/ai/queue-health بحساب أدمن اختبار)

```json
{
  "counts": {"queued": 0, "processing": 0, "done": 74, "failed": 0},
  "oldestQueuedMinutes": null,
  "lastDone": {"type": "article_tool", "finishedAt": "2026-11-09T10:39:56.749+00:00"},
  "lastRunnerRunAt": "2026-11-16T08:12:56Z",
  "repair": {"windowDays": 14, "published": 9, "afterRepair": 7, "exhausted": 3, "sharePct": 78, "recoveryPct": 70},
  "cfNeurons": {"used": 95, "warnThreshold": 8000, "dayLimit": 10000},
  "ok": true, "issues": []
}
```

- **عمق الطابور صفر** (لا queued ولا processing) وأعلام repair حاضرة (نافذة 14 يومًا: 9 منشورات، 7 عبر الإصلاح، 3 مستنفدة).
- عداد المزودين (نافذة 24 ساعة، 23 صفًّا): **44 نداء · prompt 74,845 · completion 67,678 · الإجمالي 142,523 توكن · 0 سنت** (كلها فئة free). Tavily: 22/1000 رصيد شهري · Exa: 9/1000 سنت شهريًا.

## 4) آخر تشغيلات السير الخمسة المعنية (قبل بدء T1)

| السير | آخر تشغيلة | الحالة |
|---|---|---|
| blog-post-ar.yml | 43875066747 (schedule، 13:22 UTC، c286e06e) | **failure** — خانة الاثنين فشلت (الحالة المرجعية «حاجة» بالخطة: موت p4 الأعمى سابقًا) — لا مقال AR منشور هذا الأسبوع بعد |
| blog-post-en.yml | 43543717232 (schedule، الجمعة 14 نوفمبر) | failure — لا مقال EN هذا الأسبوع بعد |
| recipe-post.yml | 43905022279 (schedule، 16:13 UTC، 817a797c) | **failure** — فئة رصد-ورفض عند r3 (أُغلقت بـ2afd61c6) — لا زوج منشور اليوم |
| process-ai-jobs.yml | 43829447764 (schedule، 08:12 UTC) | success — الطابور فارغ بعدها |
| plan-ai-probe.yml | dispatch-only | (لم يُشغَّل بهذا الإطار — غير مطلوب بT1) |

## 5) حسابات الاختبار (S0-1) — منشأة ومتحقق من دخولها

| الحساب | الدور | الغرض | الدخول |
|---|---|---|---|
| qa.coach.t1@alkemos-test.com | coach | تشغيلات المدرب (S1-3 · NUT-12 عبر قناة B2B) | ✓ LOGIN OK |
| qa.member.adult@alkemos-test.com | client | العضو البالغ بملف كامل (S0-1/1) | ✓ LOGIN OK |
| qa.member.minor@alkemos-test.com | client | العضو القاصر 13 سنة (S0-1/2 — لT4 لاحقًا) | ✓ LOGIN OK |
| qa.member.diabetes@alkemos-test.com | client | سكري النوع الثاني + حساسية مكسرات (S0-1/3 — حامل NUT-12) | ✓ LOGIN OK |
| qa.admin.t1@alkemos-test.com | admin | قراءة queue-health (لوحة الإنذار المبكر) | ✓ LOGIN OK |

- الإنشاء عبر الأداة المحروسة `scripts/qa/test_accounts.py` (قناة QA §3.3) — كلمات مرور عشوائية أحادية بذاكرة الجلسة، لا تدخل المستودع (§3.2).
- التجهيزات: المدرب معيَّن للعضوَين adult وdiabetes (`coach_assignments` — إعادة توجيه الإسناد التلقائي 0030A) · عضو السكري عليه premium منتهي + **coaching فعّال حتى 2026-12-16** (حالة 0102 — يفتح بوابة توليد B2B).
- ملفات الاستبيان مكتوبة ومتحقق منها قراءةً: adult (30 سنة/85كجم/178سم) · minor (13 سنة/48كجم/158سم) · diabetes (48 سنة/92كجم/175سم + «سكري النوع الثاني — أتناول دواء الميتفورمين مرتين يوميًا» + «حساسية مكسرات (فول سوداني وعين جمل)»).

## 6) حكم T0

- **شرط النجاح متحقق:** الحسابات عاملة (5/5 دخول) وخط الأساس مثبت بالمجسات الحية أعلاه.
- **لا انحراف beacon:** الإنتاج على آخر كوميت كود (تفسير deploy-skip موثق §1) — لا إيقاف ولا تصعيد.
- T0 تُغلق **EXECUTED** ويُفتح الطريق لتنفيذ T1 (بأمر المالك القائم نفسه).
