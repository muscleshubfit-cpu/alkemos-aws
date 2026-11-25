# VERCEL-IGNORE-STEP-ACTIVATION-2026-09-20

> **النوع:** سجل تفعيل + سجل اختبارات حية (LIVE) لميزة Vercel Ignored Build Step
> **الآمر:** المالك — موافقة تنفيذ صريحة 2026-09-20 «موافق على التنفيذ ابدأ» على خطة التفعيل المتدرجة (6 خطوات) المعتمدة من تقرير التحقق المُسلَّم في الجلسة 2026-09-19.
> **الأساس:** تقرير التحقق A–F: محاكاة كاملة لـ 151 دفعة حقيقية بترتيبها الزمني — 66 SKIP (43.7%) · 85 BUILD · **صفر نشرات مفقودة** · حالات الفجوة الخمس (دفوعات متعددة قمّتها docs وتحمل كودًا) كلها BUILD.

## 1) ما الذي نُفّذ (وبماذا انحرف عن الخطة ولماذا)

| البند | الحالة | الدليل |
|---|---|---|
| `autoExposeSystemEnvars` (خطوة 2 من الخطة) | كان مفعّلًا مسبقًا — لم يُلمس | لقطة API قبل التغيير (GET /v9/projects) |
| `ignoreCommand` (خطوة 1 من الخطة) | **مُضاف في vercel.json** — كوميت `3d8a6ad` | سطر واحد بالأمر الحرفي المعتمد (§2 أدناه) |
| Dashboard (كما نصّت الخطة حرفيًا) | بقيت دون إعداد — **لا تعارض** (vercel.json له الأسبقية) | — |

**انحراف موثّق عن حرف الخطة:** الخطة قالت «Dashboard ← Custom ← لصق الأمر». المسار البرمجي البديل كان إلزاميًا: واجهة REST API ترفض كتابة الحقل — اختُبر مباشرة على v1/v9/v10/v11/v12 وكلها رفضت بـ `400 should NOT have additional property ignoreCommand`، وإعداد الـ Dashboard يتطلب يد المالك يدويًا. `vercel.json` هو المسار البرمجي الموثّق رسميًا (خاصية `ignoreCommand` في vercel.json Configuration) ويحمل **الأمر الحرفي نفسه حرفيًا**، متتبَّع في Git، وقابل للإلغاء بحذف سطر واحد (revert بدفعة واحدة).

## 2) الأمر الفعّال (حرفيًا كما هو في vercel.json)

```bash
git diff --quiet "${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}" HEAD -- . ':!docs' ':!archive' ':!/AGENTS.md' ':!/CHANGELOG.md' ':!/CONTRIBUTING.md' ':!/DESIGN.md' ':!/DEVELOPER_GUIDE.md' ':!/LICENSE' ':!/README.md' ':!/SECURITY.md' ':!/STATE.md' ':!/worklog.md'
```

- exit **0** (لا فروق في المسارات المراقَبة منذ آخر نشر ناجح) ← النشر **CANCELED** — لا install ولا build ولا artifacts
- exit **1** (توجد فروق في مسارات مراقَبة) ← بناء كامل كالمعتاد
- exit **128**/أي خطأ ← ~~بناء (fail-safe — كل مسارات الفشل تتجه للبناء)~~ **†صُحّح بالقياس 2026-10-04:** هذا الافتراض كان خاطئًا — عند Vercel: 0 = تخطٍّ · 1 = بناء · **أي رمز آخر = فشل الـ deployment ذاته** (الحادث §6 أدناه)؛ الأمر المُحصّن (§6) لا يُخرج إلا 0 أو 1 أبدًا

**بنية الأمان (ignore-list polarity):** كل ملف غير معروف أو مستقبلي يجبر النشر تلقائيًا؛ الاستثناءات جذرية الارتكاز حصريًا (docs/ وarchive/ و10 ملفات جذر توثيقية) — أثبت تقرير التحقق أن `next build` لا يقرأ أيًّا منها.

## 3) سجل الاختبارات الحية (خطة الخطوات 3–5)

| # | الاختبار | الدفعة | المتوقع | الفعلي |
|---|---|---|---|---|
| 0 | التفعيل (vercel.json فقط) | `3d8a6ad` | READY — vercel.json مسار مراقَب | **READY ✓** dpl_838w16Px — PROMOTED خلال ~47 ثانية (2026-09-20 16:37 UTC) |
| A | docs-only خالص (هذا الملف + سجل docs/README.md + مدخل worklog.md) | `e125dd9` | **CANCELED** | **CANCELED ✓** dpl_2BDGNu9v — خلال ~16 ثانية (16:41 UTC) |
| B | كود تافه (تعليق في `src/lib/utils.ts`) | `642a706` | **READY** | **READY ✓** dpl_DB2qWbG8 — PROMOTED خلال ~62 ثانية · تأكيد جانبي: أساس المقارنة كان `3d8a6ad` (آخر نشر ناجح) وليس `e125dd9` الملغى — سلوك PREVIOUS_SHA صحيح |
| C | **الحاسم:** دفعة كوميتين معًا — كود (`src/lib/slug.ts`) ثم docs (تحديث هذا الجدول) في القمة | `5acdd4d` (قمة docs فوق كوميت الكود `bff0cc5`) | **READY** — إثبات حي أن `VERCEL_GIT_PREVIOUS_SHA` يغطي الدفعات المتعددة (القاعدة الساذجة `HEAD^` كانت ستعطي CANCELED وتضيّع نشر الكود — حالات الفجوة الخمس في تقرير التحقق) | **READY ✓** dpl_8Tx1g2UL — PROMOTED خلال ~47 ثانية · القاعدة الساذجة `HEAD^` كانت ستعطي CANCELED وتضيّع نشر `src/lib/slug.ts` — **الفارق الجوهري مثبت حيًّا** |

**شرط الإيقاف المعتمد من المالك:** إن أعطى اختبار C نتيجة CANCELED ← إيقاف الميزة فورًا (revert لكوميت vercel.json — دفعة واحدة، صفر خطر على الإنتاج القائم) والعودة إلى مرحلة التحقق.

## 4) ماذا يعني هذا تشغيليًا

- **التوفير المتوقع:** ~44% من الدفعات ستُصبح CANCELED (المحاكاة: 66/151) — أي تخفيض ~6–9 بناءات/يوم من معدل ~20.9/يوم، مع ما يرافقه من تقليل إبطال كاش `_next/static` للزوار النشطين.
- الـ CANCELED يُحسب ضمن حصة النشر اليومية (ثوانٍ لأمر git) لكنه **لا يرفع** Deployment/Functions Storage (لا artifacts ولا تشغيل).
- سلاسل docs أطول من 9 كوميتات متتالية بلا أي نشر كودي ← خروج `VERCEL_GIT_PREVIOUS_SHA` عن نطاق الاستنساخ الضحل (depth=10) ← فشل diff ← exit 128 ← ~~بناء (اتجاه آمن)~~ **فشل deployment كامل — مُقيس 2026-10-04 عند فجوة 27 كوميت (الحادث §6).** الحد لمس بعد فعليًا: هبوط GD-1 دفع 22 كوميت docs/workflows دفعة واحدة (fast-forward) فقفزت الفجوة من 7 إلى 27
- **مسار التعافي اليدوي:** أي نشر مطلوب تُخُطِّي يومًا ما ← Redeploy من الـ Dashboard مع مربع «Use project's Ignore Build Step» = بناء قسري بضغطة زر.
- الفروع الأخرى: كل فرع يقارن ضد آخر نشر ناجح **لنفس الفرع** — لا تفاعل متوقع مع فروع docs/audit-reports-delivery وfix/perf-audit-2026-09-05.

## 5) الخلاصة النهائية (2026-09-20 ~16:45 UTC)

**الميزة فعّالة ومُتحقق منها حيًّا في الإنتاج — كل الاختبارات خضراء:**

| الاختبار | الكوميت | النتيجة | النشر | المدة |
|---|---|---|---|---|
| التفعيل | `3d8a6ad` | READY | dpl_838w16Px (PROMOTED) | ~47ث |
| A — docs-only | `e125dd9` | **CANCELED** | dpl_2BDGNu9v | ~16ث |
| B — كود | `642a706` | READY | dpl_DB2qWbG8 (PROMOTED) | ~62ث |
| C — دفعة كود+docs | `5acdd4d` | READY | dpl_8Tx1g2UL (PROMOTED) | ~47ث |

- **صفر نشرات مفقودة** عبر الاختبارات الأربعة — وشرط الإيقاف لم يُستثر (لم يكن لازمًا)
- الحالة التشغيلية من هذه اللحظة: ~44% من الدفعات المتوقعة (docs-only) ستُلغى تلقائيًا — مع بقاء كل دفعة كود أو config أو أصول أو ملف جديد مجبِرة للنشر بحكم بنية ignore-list
- الإلغاء عند الحاجة: revert لكوميت `3d8a6ad` (سطر vercel.json الواحد) أو Redeploy يدوي مع تجاوز القاعدة
- ملاحظة الحصص: الـ CANCELED يحسب ضمن حصة النشر اليومية (ثوانٍ) لكنه لا يرفع Storage ولا يشغّل install/build

---
*اكتمل السجل. هذا الكوميت الأخير docs-only — متوقَّع CANCELED (تأكيد إضافي للسلوك بعد اكتمال التوثيق). مرجع القرار الكامل: تقرير التحقق 2026-09-19 (محاكاة 151 دفعة) + محادثة موافقة المالك 2026-09-20.*

## 6) حادث 2026-10-04 + التحصين (قانون 0/1) — VERCEL-IGNORE-HARDENING

> **المصدر:** بريد فشل نشر Production من Vercel أرسله المالك — deployment على main عند `afc4d40` فشل 2026-10-04 07:34 UTC.

### السلسلة السببية المقيسة

- آخر نشر Production حقيقي = `4cf5c4b` (CSP-RO · VERCEL-USAGE-7)؛ بعده 27 كوميت على main كلها docs/workflows تخطّت البناء (ignoreCommand يعمل كما صُمم — التوفير المطلوب متحقق) — فبقي `VERCEL_GIT_PREVIOUS_SHA` عالقًا عند كوميت صار خارج استنساخ Vercel الضحل (depth=10).
- الاستنساخ لا يحوي الكوميت → `git diff` → `fatal: bad object 4cf5c4bc…` → **exit 128** → Vercel عدّه **فشل deployment** لا بناءً احتياطيًا (الافتراض الخطأ أعلاه §2) — القانون الفعلي المقيس: **0 = تخطٍّ · 1 = بناء · أي رمز آخر = فشل النشر ذاته**.
- ملاحظة جانبية مقيسة: توكن `[vercel skip]` في عنوان `afc4d40` **لم يمنع** انطلاق النشر — آلية التخطي الفعلية الوحيدة هي ignoreCommand ذاته.
- قياس داعم: GitHub **يسمح** بجلب كوميت قديم بمعرفه الكامل `git fetch origin <sha> --depth=1` (مُقيس مباشرة من هذا المستودع) — متاح كذلك داخل حاوية بناء Vercel (نفس الخادم).
- لاحقًا (07:37:26Z): النشر الإنتاجي ذاته اكتمل بنجاح بعد ~3 دقائق (إعادة محاولة على نفس المعرف — عبر الاحتياط HEAD^ أو بتجاوز قاعدة التخطي بُني النشر ونجح) — الإنتاج أخضر الآن وPREV تصفّرت إلى afc4d40، لكن السبب الجذري ظل مفتوحًا حتى هذا التحصين: أي فجوة قادمة > depth تكرّر الحادث.
- **الجولة الثانية (قياس d7be1a6 — 08:11:48Z):** الأمر المحصّن المضمّن (498 محرفًا) رُفض فورًا في نطاقَي Vercel (فشلان خلال ثانيتين، صفر بناء): مخطّط Vercel الرسمي يفرض **maxLength = 256** على `ignoreCommand` — والأمر الأصلي (251 محرفًا) ظل تحت السقف بالكاد طوال الوقت. الحل النهائي: **التفويض** — `ignoreCommand` = `sh scripts/vercel/ignore-step.sh` (32 محرفًا) والقانون الكامل داخل السكربت المتتبَّع بلا حد طول.

### الشكل النهائي (بعد الجولة الثانية) — تفويض إلى سكربت

**vercel.json (حرفيًا — 32 محرفًا ≤ 256):**

```bash
sh scripts/vercel/ignore-step.sh
```

**القانون الكامل حرفيًا كما هو في `scripts/vercel/ignore-step.sh`** (المصدر الوحيد للحقيقة — النسخة هنا للسجل، يفحص تطابقَها آليًا منصة التحقق المحلية):

```sh
#!/bin/sh
# =====================================================================
# VERCEL-IGNORE-HARDENING-2026-10-04 — Vercel Ignored Build Step.
#
# vercel.json delegates here (sh scripts/vercel/ignore-step.sh) because
# the inline ignoreCommand field is HARD-CAPPED at 256 chars by Vercel's
# official schema (measured against https://openapi.vercel.sh/vercel.json,
# 2026-10-04) — the hardened law below does not fit inline (498 chars —
# the d7be1a6 deployment was rejected instantly for exceeding the cap;
# the old 251-char command had sat just under it the whole time).
#
# MEASURED LAWS this script enforces (full record:
# docs/VERCEL-IGNORE-STEP-ACTIVATION-2026-09-20.md §6):
#   * Vercel: exit 0 = SKIP · exit 1 = BUILD · ANY OTHER CODE = the
#     deployment itself FAILS. The bare `git diff $PREV HEAD` exited 128
#     (fatal: bad object) at afc4d40 when VERCEL_GIT_PREVIOUS_SHA sat 27
#     commits behind HEAD — outside Vercel's shallow clone — so nothing
#     but 0/1 may ever escape this script.
#   * GitHub allows fetching an old commit by full SHA
#     (git fetch origin <sha> --depth=1 — measured 2026-10-04), which
#     restores skip accuracy across long docs-only streaks.
#   * The 12 root-anchored excludes are the owner-approved polarity
#     (2026-09-20 activation §2): unknown/future files force a deploy.
#
# The common case (gap <= clone depth) makes ZERO network calls.
# =====================================================================

P="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"

# 1) resolve PREV locally; if absent, fetch exactly that one commit
git cat-file -e "$P" 2>/dev/null || git fetch -q origin "$P" --depth=1 2>/dev/null || true

# 2) diff against PREV when resolvable — exit 0 (docs-only -> SKIP) or
#    1 (watched paths changed -> BUILD); any git crash is sanitized to 1
if git cat-file -e "$P" 2>/dev/null; then
  git diff --quiet "$P" HEAD -- . \
    ':!docs' ':!archive' \
    ':!/AGENTS.md' ':!/CHANGELOG.md' ':!/CONTRIBUTING.md' ':!/DESIGN.md' \
    ':!/DEVELOPER_GUIDE.md' ':!/LICENSE' ':!/README.md' ':!/SECURITY.md' \
    ':!/STATE.md' ':!/worklog.md' || exit 1
  exit 0
fi

# 3) PREV unresolvable (beyond shallow depth / rewritten history) ->
#    BUILD (the safe direction; a build also resets the PREV gap)
echo "ignore-step: PREV $P unresolvable in clone (shallow depth) -> BUILD fallback"
exit 1
```

### قانون الأمر الجديد — لا يُخرج إلا 0 أو 1 أبدًا

| المسار | الناتج |
|---|---|
| PREV داخل الاستنساخ (الحالة الغالبة، فجوة ≤ depth) | كما كان تمامًا: 0 تخطٍّ للـ docs-only · 1 بناء — صفر نداءات شبكية |
| PREV خارج الاستنساخ + جلب SHA نجح | **استعادة دقة التخطي عبر الفجوات الطويلة** (جديد) — جلب كوميت واحد بتكلفة شبكية ضئيلة |
| PREV خارج الاستنساخ + جلب فشل (SHA معدوم/تاريخ أُعيد كتابته) | 1 = بناء (fail-safe حقيقي) — وبعد البناء تتصفّر الفجوة تلقائيًا |
| أي انهيار في diff ذاته | 1 = بناء (وليس 128 = فشل النشر) |

الصياغة `A || B || true` + `if/then/else` مأمونة تحت `set -e` (كل موضع فشل محمي) — والمسار الغالب (فجوة ≤ depth) لا يدفع أي ثمن شبكي إضافي.

### التحقق المحلي قبل الدفع (كله أخضر)

JSON ✓ (القيمة = نص التفويض حرفيًا، 32 ≤ 256) · السكربت موجود بمساره المُفوَّض ✓ · سينتاكس sh/bash للسكربت ✓ · تطابق حرفي بين السكربت والنسخة المضمّنة أعلاه ✓ · **محاكاة معملية** بمستودع مؤقت ببنية الاستثناءات نفسها — 9 سيناريوهات: docs-only داخل الاستنساخ→تخطٍّ · كود→بناء · docs-only بعد كود→تخطٍّ · SHA معدوم→بناء (لا 128 أبدًا) · PREV غير معبّر (HEAD^) · PREV=HEAD (فارغ→تخطٍّ) · **استنساخ ضحل depth=1 مع استعادة جلب SHA عبر الفجوة: docs-only→تخطٍّ · كود→بناء** · إعادة SHA-المعدوم تحت `sh -e`/`bash -e`→بناء — **صفر حالات 128 في كل التشغيلات** + البوابات الخمس (docs_parity · docs_audit · migration_audit · check-stale-refs · check-ui-wiring) ✓

### التحقق الحي

الجولتان موثقتان بالقياس (exit 128 عند afc4d40 ثم تجاوز maxLength=256 عند d7be1a6) — ودفعة التفويض هي الاختبار الحي للشكل النهائي: مسارات مُراقَبة تغيّرت (vercel.json + scripts/ + .gitignore) → **بناء إلزامي** → نشر أخضر متوقع (صفر تغيير على `src/` منذ آخر نشر ناجح) — والنتيجة توثَّق في `worklog.md` إدخال `VERCEL-IGNORE-HARDENING-2026-10-04`.
