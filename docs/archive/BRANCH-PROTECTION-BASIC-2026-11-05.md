# BRANCH-PROTECTION-BASIC-2026-11-05 — تفعيل حماية أساسية لفرع main عبر GitHub API

> **أمر المالك (2026-11-05):** «نفّذ الآن تفعيل حماية أساسية لفرع main في مستودع muscleshubfit-cpu/alkemos-aws» — بالإعدادات: منع حذف الفرع · منع Force Push · السماح بالدفع المباشر دون اشتراط Pull Request · عدم فرض Status Checks إلزامية حاليًا · عدم اشتراط مراجعات أو موافقات — مع القيود الصريحة: لا تغيير خصوصية المستودع (إبقاؤه عامًا قرار مقصود بسبب حدود دقائق GitHub Actions) · لا تعديل الكود أو إعدادات النشر أو سير عمل CI أو الأسرار · التحقق بعد التفعيل عبر GitHub API · وعند التعذر: تحديد السبب بدقة دون ادعاء نجاح.
> **الوكيل:** Main (Z.ai) · **المرحلة:** 426 · **الإطار:** إعداد مستودع عبر GitHub API (قاعدة حماية فرع فقط) + توثيق (صفر تغيير تحت `src/` أو `supabase/` أو `.github/` أو `deploy/`).
> **المنهجية:** كل ادعاء أدناه مقيس عبر GitHub API (قبل التفعيل وبعده) أو من git — لا ادعاء بلا دليل.

---

## 1. الفحص المسبق — إعدادات المستودع والصلاحيات المتاحة (مقيس)

| البند | القيمة المقيسة (2026-11-05 ≈19:30Z) |
|---|---|
| هوية التوكن | المستخدم `muscleshubfit-cpu` — **مالك المستودع** (نوع الحساب User) |
| نطاقات التوكن (`X-OAuth-Scopes`) | `repo, workflow` — كافية لإدارة حماية الفروع |
| صلاحيات التوكن على المستودع | `admin: true · maintain: true · push: true · triage: true · pull: true` |
| المستودع | عام (`private: false`) — قرار تشغيلي مقصود لم يُمس · الفرع الافتراضي `main` · غير مؤرشف وغير معطل |
| الحماية قبل التفعيل | `GET /branches/main/protection` → **404 «Branch not protected»** · `GET /branches/main` → `protected: false` — مطابق لتوثيق 425 §4 |

**الخلاصة:** الصلاحيات كافية للتفعيل (توكن المالك بنطاق `repo` وصلاحية `admin` على المستودع) — والمستودعات العامة تدعم حماية الفروع بالخطة المجانية، فلا مانع من التنفيذ.

## 2. الإعدادات المطبقة (PUT — استجابة 200 OK)

`PUT /repos/muscleshubfit-cpu/alkemos-aws/branches/main/protection` بالجسم:

```json
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false
}
```

مطابقة الإعدادات لأمر المالك حرفيًا:

| المطلوب بأمر المالك | الإعداد | القيمة المطبقة |
|---|---|---|
| منع حذف الفرع | `allow_deletions` | `false` |
| منع Force Push | `allow_force_pushes` | `false` |
| السماح بالدفع المباشر دون اشتراط PR | `required_pull_request_reviews` | `null` |
| عدم فرض Status Checks إلزامية حاليًا | `required_status_checks` | `null` |
| عدم اشتراط مراجعات أو موافقات قبل الدفع | `required_pull_request_reviews` + `restrictions` | `null` (لا مراجعات · لا قيود دافعين) |
| خارج نص الأمر — التفضيل الموثق 425 §4 | `enforce_admins` | `false` (OFF) |

## 3. التحقق بعد التفعيل (GET مستقل — مقيس 2026-11-05T19:43:51Z)

- `GET /repos/muscleshubfit-cpu/alkemos-aws/branches/main` → **`"protected": true`**
- `GET /repos/muscleshubfit-cpu/alkemos-aws/branches/main/protection` → 200 بالقيم:

```json
{"allow_deletions":false,"allow_force_pushes":false,"required_status_checks":null,"required_pull_request_reviews":null,"restrictions":null,"enforce_admins":false}
```

(وبقية المفاتيح `required_linear_history` · `block_creations` · `required_conversation_resolution` · `lock_branch` — كلها `enabled: false`.)

- **التحقق حرفي:** كل قيمة أعلاه تطابق الإعدادات الخمسة المطلوبة بالأمر — الحماية مطبقة فعلًا على `main` كما طُلب، والنجاح مقيس لا مُفترض (بند التعذر 6 لم يُفعَّل — لم يتعذر شيء).
- **إثبات عضوي مرتقب لهذه الدفعة:** كوميت التوثيق هذا نفسه يُدفع مباشرة إلى `main` بعد التفعيل — قبوله (دون رفض) إثبات عملي إضافي أن الدفع المباشر يعمل تحت الحماية الجديدة.

## 4. ملاحظات وحدود الحماية المطبقة

- **`enforce_admins` = OFF** (كالتفضيل الموثق في 425 §4: «Do not allow bypassing = OFF»): قاعدتا منع الحذف وforce-push تسريان على غير المشرفين؛ **المالك/المشرفون خارج القاعدة** — لو أراد المالك سريانها عليه أيضًا يفعّل «Include administrators» من Settings ▸ Branches بأمر لاحق.
- **التوصية المتبقية (اختيارية — لم تُنفَّذ بأمر اليوم لأن نصه يمنع الفحوصات الإلزامية حاليًا):** ترقية القاعدة لاشتراط الفحوص الأربعة الحية (quality · parity · guard · migration-audit) عندما يقرر المالك — توصية 425 §4 باقية كما هي.
- **الخصوصية لم تُمس:** المستودع عام بقرار تشغيلي مقصود (حدود دقائق GitHub Actions — أمر المالك الموثق في STATE.md/الممنوعات النشطة).
- **صفر مساس بالكود أو النشر أو CI أو الأسرار:** التغيير غير التوثيقي الوحيد هو قاعدة حماية الفرع ذاتها (إعداد مستودع عبر API) — لا كوميتات كود ولا تعديل سير عمل ولا قراءة/تعديل أسرار.

## 5. النطاق — ما لم يُمس إطلاقًا

`src/` · `supabase/` · `.github/` · `deploy/` · قاعدة البيانات · إعدادات المستودع الأخرى (الوصف/homepage/الخصوصية كما تركتها 424/425) · الإنتاج (خط النشر يتخطى دفعات docs-only بقانون النطاق — الإنتاج يبقى يخدم `dbbe84e6`).

## 6. نتائج الفحوص قبل الدفع (على نسخة العمل الكاملة)

| الفحص | النتيجة |
|---|---|
| `python3 scripts/docs_audit.py` | **✓ متسقة** — STATE ‏98 سطرًا/29,439B (الحد 32,000) · المرحلة 426 · worklog ‏12/12 · ‏79 ملف docs/*.md كلها مسجلة (بما فيها هذا التقرير) |
| `python3 scripts/docs_parity.py --ci` | **✓** ترويسة سجل الميجريشنز = حقيقة القرص |
| `python3 scripts/migration_audit.py --ci` | **✓** صفر انحراف جديد عن الأساس المقبول |
| تدوير worklog (`scripts/worklog_rotate.py`) | **✓** مدخل واحد (5,865B) انتقل حرفيًا للأرشيف بنفس الكوميت — النافذة 12/12 · ‏74,513B |
| `check-stale-refs.sh` محليًا | غير مشغَّل محليًا عمدًا: نطاق فحصه كود `src/scripts/.github` فقط (ts/tsx/yml/...) وهذه الدفعة لا تلمس أيًا منها — بوابة guard ستشتغل على CI وتُثبت النتيجة الحية |
| صفر تغيير كود | `git status`: ملفات `.md` فقط — لا شيء تحت `src/` أو `supabase/` أو `.github/` أو `deploy/` |
