# CF Cache Rule Fix — /auth prefix swallows /authors (2026-11-12)

> **المهمة:** SEO-CF-CACHE-RULE-AUTHORS-2026-11-12 · **النوع:** إصلاح تشغيلي موثق — إغلاق البند الوحيد المتبقي من التقرير 14 §5-1 بعد تحديث المالك لصلاحيات مفتاح Cloudflare (أمر الجلسة: «تم تحديث صلاحيات مفتاح cloud flare»).
> **القناة:** سير العمل `cf-cache-rule-authors-fix.yml` (workflow_dispatch فقط — وضعا probe/apply) — التوكن لا يغادر خادم الأصل أبدًا (يُقرأ من `/srv/alkemos/shared/.env` ويستدعى API منه).

## 1. العيب المقيس (قبل الإصلاح)

| المسار | cf-cache-status قبل | بعد |
|---|---|---|
| `/authors` | **DYNAMIC** (معطل) | **HIT** ✓ |
| `/authors/ahmed-zake` | **DYNAMIC** (معطل) | **HIT** ✓ |
| `/ar/authors` (ضابط — لا يبدأ بـ/auth) | HIT | HIT ✓ |
| `/` (ضابط) | HIT | HIT ✓ |
| `/auth` (ضابط — مسار خاص no-store) | DYNAMIC | **DYNAMIC** ✓ (يظل مستثنى صحيحًا) |

السبب: قاعدة الكاش `alkemos-public-html-cache` (الرولست `d9f2c38e782043369d0815caef91cb60` بمرحلة `http_request_cache_settings`) تستثني المسارات الخاصة ومنها `/auth` **بمطابقة بادئة** `starts_with` تبتلع عائلة `/authors` العامة — أضعف صفحتين ربطًا بالخريطة كلها (تقرير 13 §6-نمط 5: `/authors` بروابط داخلية 2 — مركز E-E-A-T الذي تسلسل عبره كل Person) وكانتا الصفحتين العامتين الوحيدتين المحرومتين من كاش الحافة.

## 2. الإصلاح الجراحي (حد واحد داخل تعبير القاعدة `40fb6ba2cc1c4b368b03176c669c71d0`)

```
قبل: not starts_with(http.request.uri.path,"/auth")
بعد:  not (http.request.uri.path eq "/auth" or starts_with(http.request.uri.path,"/auth/"))
```

- الدلالة محفوظة لكل المسارات الخاصة (`/auth` و`/auth/*`) ومحررة لعائلة `/authors` — كل حدود الاستثناء الأخرى Untouched بايت-ببايت (`/api` `/admin` `/checkout` `/dashboard` `/questionnaires` `/progress` `/plans` `/profile` `/support` `/referral` `/preview` + `ne "/coach"` + `starts_with /coach/` + `not contains "."`)
- نقطة الاستدعاء: `PATCH /zones/{z}/rulesets/{rs}/rules/{rule_id}` بجسم كامل التعريف (expression + action + enabled + description + action_parameters — منها edge_ttl 43200 وbrowser_ttl 300 كما كانت)
- **لا Purge:** المساران كانا DYNAMIC (لا شيء مخزن تحتهما) فالقاعدة الجديدة تحكم أول طلب تالٍ — والتنقية كانت ستكيل طلبات على الأصل (نمط الحماية الموثق بdeploy.sh)

## 3. سجل التنفيذ (التشغيلات)

| التشغيلة | الكوميت | الوضع | النتيجة | ملاحظة |
|---|---|---|---|---|
| 43058162958 | 16010a35 | probe | **نجاح** | كشف غلاف `{"result":{...}}` الذي كسر قراءة الجرد (فشل أمين لاحقًا لا تغيير) — القاعدة الهدف مؤكدة وحيدة تحيل لـ/auth |
| 43058806044 | 3f972b75 | apply | **فشل أمين (405/10405)** | `PUT` على نقطة تحديث القاعدة الواحدة مرفوض — التوثيق الرسمي: النقطة تقبل **PATCH** حصرًا (PUT لاستبدال الرولست كله) — صفر تغيير حدث |
| 43059518589 | 4ae3ad0e | apply | **نجاح كامل** | الجراحة ← PATCH 200 (success: True) ← تحقق بعدي (مجموعة القواعد متطابقة · القاعدة الهدف فقط تغيرت · description/enabled/action/action_parameters محفوظة) ← رولست version 7→8 ← تحقق حي من الrunner: المساران HIT بالطلب الثاني و`/auth` يظل DYNAMIC |
| 43059787320 | 4ae3ad0e | probe (بعدي) | **نجاح** | التقاط حالة ما بعد الإصلاح كاملة للتوثيق — الحالة الحية من الأصل: HIT/HIT/HIT/HIT/DYNAMIC كما بالجدول أعلاه |

## 4. التحقق الحي المستقل (من جلسة التوثيق — خارج الrunner)

- `/authors` و`/authors/ahmed-zake`: **HIT** بطلبين متتاليين (كانا DYNAMIC بالقياس القبلي من الجلسة نفسها)
- بهوية Googlebot: `/authors` → 200 مع `cf-cache-status: HIT` (لا انقسام كاش حسب UA)
- الضوابط: `/ar/authors` و`/` = HIT · `/auth` = DYNAMIC (المسار الخاص لا يُخزن أبدًا — `Cache-Control: private, no-cache, no-store`)

## 5. الخام القابل لإعادة التشغيل

- `pre-ruleset.json` — الرولست الكامل قبل التغيير (النسخة الاحتياطية الحرفية — version 7)
- `post-ruleset.json` — الرولست الكامل بعد التغيير (version 8)
- سير العمل نفسه قابل لإعادة التشغيل دائمًا: `.github/workflows/cf-cache-rule-authors-fix.yml` (وضع probe قراءة-فقط · وضع apply idempotent — يعيد no-op نظيفًا إذا كان الشكل المقطعي موجودًا)
- التراجع الموثق: PATCH للتعبير الأصلي (المطبوع بحرفيته في `pre-ruleset.json` → القاعدة `40fb6ba2cc1c4b368b03176c669c71d0`)

## 6. الحدود الصادقة

- هذا الإصلاح يعيد صفحتي كيان E-E-A-T إلى كاش الحافة (أداء/استقرار خدمة للزاحف والزائر) — **ولا يُقدَّم بوصفه علاجًا للانهيار**: السبب الجذري الأرجح (قرار تقييم موقعي + عجز السلطة) لم يتغير (تقرير 14 §7) وأثر الفهرسة يُقاس ببيانات GSC اللاحقة حصرًا.
- صلاحية التوكن المطلوبة (موثقة من المصدر الرسمي cache-rules/create-api + rulesets-api/update-rule): إحدى قائمة تقاطع تشمل **Cache Settings Write (≡ Zone > Cache Rules > Edit)** — نجح الاستدعاء بها بعد تحديث المالك.
