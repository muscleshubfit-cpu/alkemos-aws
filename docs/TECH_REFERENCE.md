# TECH_REFERENCE.md — المرجع التقني التفصيلي

> **المنشأ (Provenance):** أُنشئ بأمر المالك المباشر 2026-09-03 (Phase 111 — «استخرج منه كل المعلومات التقنية التفصيلية التالية، وانقلها إلى ملف TECH_REFERENCE.md مع تنظيمها»).
> **مصادر النقل:** `AGENTS.md` (المرجع الأساسي للأقسام 1 و2 و4) + `src/components/ui/` (القسم 3 — لأن قانون مصادر الحقيقة في المشروع يقول صراحة: أسماء المكونات مصدرها الكود نفسه، و`AGENTS.md` لا يعدّد مكونات Shadcn).
> **قاعدة الاستخدام:** هذا ملف مرجعي تعليمي — ليس بديلًا عن القانون. `AGENTS.md` يبقى ملف القوانين الملزم، و`STATE.md` يبقى مدخل أي جلسة (§3.6)، والحقيقة العليا دائمًا هي الكود (§12.8).

---

## 1. قاعدة البيانات (Supabase) — كيف تعمل في هذا المشروع

### 1.1 البنية العامة

- قاعدة البيانات **Postgres مُدارة عبر Supabase** (`*.supabase.co`)، والوصول من التطبيق عبر PostgREST (supabase-js) بمفتاحين:
  - **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) — وصول مقيد بسياسات RLS، للمتصفح.
  - **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) — يتجاوز RLS بالكامل، **سيرفر فقط** (API routes / GitHub Actions runners)، وممنوع commit أو ظهوره في العميل (§3.2).
- **مرآة الأنواع:** `src/lib/supabase/types.ts` هي المرآة اليدوية الموثوقة لشكل الجداول والدوال — أي تغيير schema إلزامه إعادة توليد هذه المرآة في نفس الكوميت (قانون فهرس الميجريشنز §6).
- **سجل الميجريشنز:** `supabase/migrations/INDEX.md` هو البيت الوحيد الموثق لنطاق الترقيم (0001 → أحدث NNNN) — كل ميجريشن جديدة تضيف صفها فيه في نفس الكوميت.
- **بوابة الانجراف:** `scripts/migration_audit.py` يفرّغ كل ملفات الميجريشنز ويقارن الشكل الناتج بمرآة types.ts + baseline مقبول موثق داخل السكربت — أي جدول/عمود فانتوم جديد = فشل الدفع (وضع `--ci`). السكربت يفهم `ALTER TABLE ... DROP COLUMN` (عمود متقاعد بشكل مشروع في ميجريشن أحدث).

### 1.2 قانون الميجريشنز (من AGENTS.md §6 — ملزم)

1. كل تغيير schema **يجب** أن يكون ملف ميجريشن مرقّمًا تحت `supabase/migrations/`.
2. التسمية الإلزامية: `YYYYMMDDHHMMSS_NNNN_<slug>.sql` — هذا هو **الشكل الوحيد** الذي تتعرف عليه عائلة التطبيق الآلي (المطبّق `scripts/db/apply_migrations.py` + بوابة النظافة `scripts/db/migration_hygiene.py` — وقبلها تكامل Supabase GitHub). **إعادة تسمية ملفات موجودة ممنوعة منعًا باتًا** (حادثة دفتر الحسابات في Phase 61)؛ الشذوذات القديمة الموثقة (0059 بالصيغة القديمة يدويًا، 0056 مؤرخة) تُترك كما هي.
3. الميجريشنز **يجب** أن تكون idempotent (`CREATE TABLE IF NOT EXISTS`، `ADD COLUMN IF NOT EXISTS`، ...) بحيث إعادة تشغيلها آمنة — الدرس المستفاد من الأعمدة التي كانت تُنشأ ad-hoc في الإنتاج (`meal_plans`، `plan_swaps`، `progress_photos`، `coach_presence`).
4. أي جدول جديد **يجب** أن يحمل سياسات RLS الخاصة به في نفس الميجريشن.
5. **قاعدة رابط الـSQL الخام (RAW-SQL-LINK — ملزمة للمسار اليدوي فقط: استثناء auth.users وعمليات البيانات وملفات RUN_ON_SUPABASE/VERIFY القديمة):** كل مهمة تنتج SQL للمسار اليدوي، تسليمها **غير صالح** ما لم تُرفق معها نسخة SQL جاهزة للتشغيل + رابطها الخام بالصيغة:
   `https://raw.githubusercontent.com/<org>/<repo>/<branch>/<path>`
   ليفتحها المالك ويلصقها مباشرة في Supabase SQL Editor بدون أي تنزيلات.
6. لكل دفعة ميجريشنز يُنشأ **بالإضافة** سكربت مجمّع واحد `supabase/migrations/RUN_ON_SUPABASE_<IDs>.sql` يحوي كل الخطوات + إغلاق `NOTIFY pgrst, 'reload schema';` + بلوك استعلامات VERIFY، على نمط ملفات `RUN_ON_SUPABASE_*` الموجودة — ويُرفق رابطه الخام أيضًا.
7. بعد تطبيق أي ميجريشن يدويًا، يشغّل المالك `NOTIFY pgrst, 'reload schema';` حتى يلتقط PostgREST التغيير.
8. **مسار التطبيق (قانون 2026-10-27 — `docs/DB-MIGRATION-PIPELINE-2026-10-27.md`، يخلف تصحيح المرحلة 120):** الميجريشنز المؤرخة `YYYYMMDDHHMMSS_NNNN` تُطبَّق على الإنتاج عبر **خط الترحيل المملوك للمستودع**: المطبّق المؤدَّى بالدفتر `scripts/db/apply_migrations.py` (المعلّق فقط بالترتيب، معاملة واحدة لكل ملف، أرضية أمان ضد إعادة تشغيل التاريخ) يعمل داخل مهمة `migrate` بـdeploy-aws.yml **قبل** حيازة الكود — والدفعة التي تشحن ميجريشن بلا قناة تطبيق **تحجب نشرها هي نفسها** (صنف حادثة 2026-10-27). تكامل Supabase–GitHub تقاعد كمطبّق موثوق (طبّق آخر ميجريشن 2026-10-02 (0100 — كوميت 5d3b3b2a) على المستودع السابق ثم أُنشئ مستودع alkemos-aws 2026-10-09 دون إعادة ربطه — فبقيت 0101/0102/0103 بلا تطبيق تحت نشرات خضراء وصفر إشارة فشل على GitHub؛ إعادة الربط مسار بديل اختياري دائمًا تحت رقابة بوابة الحالة). بوابة الحالة `migration-state-audit.yml` (فحوص `scripts/db/migration_probes.py` التصريحية — كل ميجريشن من 0102 فصاعدًا يسجل فحصه بنفس الكوميت) تتحقق من تطبيق **آخر** ميجريشن مع كل دفعة ويوميًا وتصعد بلاغ انجراف آليًا — **نجاح نشر الكود ليس دليلًا على تطبيق الميجريشنز أبدًا** (أمر المالك 2026-10-27 حرفيًا). والوكيل لا يطبق ميجريشنز على الإنتاج بنفسه أبدًا — الخط هو قناة المستودع لا قناة جلسة الوكيل؛ المسار اليدوي الوحيد = استثناء `auth.users` (نمط 0040/0050/0055/0066) وملفات `RUN_ON_SUPABASE_*`/`VERIFY_*` القديمة (§3.3). وممنوع على الوكيل تشغيل `DELETE`/`UPDATE`/`TRUNCATE`/`DROP` على قاعدة الإنتاج من سياقه؛ القراءات (`SELECT count(*) FROM blog_posts` مثلاً) مسموحة عند الضرورة للتحقق فقط. **استثناء حسابات الاختبار (أمر المالك 2026-10-26 — قناة TEST-ACCOUNTS بقانون AGENTS.md §3.3/§6 والسياسة الكاملة `docs/QA-TEST-ACCOUNTS-2026-10-26.md`):** حسابات QA بنطاق `@alkemos-test.com` المحجوز و`profiles.is_test_account=true` يجوز للوكيل إنشاؤها (عبر Admin API — بلا SQL مباشر على `auth.users`) وضبط دورها (أي دور بما فيها `admin`) واستخدامها للاختبار الحي عبر الأداة الوحيدة المحروسة `scripts/qa/test_accounts.py`، والكتابة مقصورة على صفوف تملكها حسابات الاختبار حصرًا — كل ما عدا ذلك أعلاه (الحسابات الحقيقية وDELETE بمختلف أنواعه وRLS) يظل مالكًا-يدويًا. فحوص بوابة الحالة السلوكية تستخدم **جلسة أدمن اختبارية مؤقتة** تُنشأ وتُحذف داخل كل تشغيل (`scripts/db/probe_session.py` — إغلاق QA-TEST-ACCOUNTS-CLOSE 2026-10-29؛ أسرار Actions ‏`QA_PROBE_EMAIL`/`QA_PROBE_PASSWORD` المتقاعدة حُذفت من المستودع).
9. قبل الدفع: `python3 scripts/migration_audit.py` يجب أن يبلغ **صفر انجراف جديد**، و`python3 scripts/db/migration_hygiene.py` يجب أن تكون **CLEAN** (أسماء · ازدواج إصدارات · صفوف INDEX · تسجيل الفحوص).

### 1.3 حماية الإنتاج ومسؤوليات الأدوار

- الإنتاج (Supabase production + Vercel + روابط حية) هو المرجع الحاسم لحالة التشغيل — قبل أي ادعاء «الميزة X حية» يجب تحقق فعلي من الرابط الحي (AGENTS.md §3.7).
- أولوية الحقيقة (§12.8): **الكود والإعدادات أولاً، ثم الميجريشنز، ثم أدلة QA، ثم الوثائق، ثم سياق المحادثة** — لو الوثيقة تعارض الكود، الكود هو اللي يكسب.

### 1.4 جداول ذات قواعد خاصة موثقة في AGENTS.md

| الجدول/المنظومة | القاعدة الخاصة |
|---|---|
| `ai_jobs` (طابور الذكاء الاصطناعي، ميجريشن 0024) | المتصفح يملك **SELECT على صفوفه فقط** — أي كتابة على الجدول **حصرية للـservice role**؛ الـpayloads تمر عبر `sanitizeJobPayload()` (قائمة بيضاء) عند الإدخال |
| `evo_chat_usage` (ميجريشن 0022) | دفتر استخدام EVO **مضاد للعبث** — المحاسبة سيرفر-سايد فقط، وممنوع عد الصفوف المكتوبة من العميل |
| `evo_anon_usage` (ميجريشن 0028) | تقييد الزوار المجهولين بـ**SALTED-SHA-256(client IP)** — بلا سياسات (service-role فقط)، ولا تخزين لـIP الخام |
| `site_content` (ميجريشن 0094 — SITE-CONTENT-281) | نصوص الموقع التسويقية القابلة للتحرير من `/admin/site-content`: قراءة عامة (anon — نمط blog_posts المنشور)، كتابة أدمن فقط عبر `is_admin()`، تريغر `site_content_touch` يختم `updated_at/updated_by` — **NULL = الافتراضي المدمج في `src/lib/site-content/`** (قانون الفولباك: صف مفقود/تالف لا يفرّغ صفحة)، والحداثة عبر ISR ‏revalidate=300 (سابقة المدونة) |
| `coach_assignments` | `client_id UNIQUE` (عميل واحد ↔ مدرب واحد) — مصدر الحقيقة للإسناد؛ الإسناد للإدارة = «متابعة الإدارة» لا عميل B2B |
| `coach_wallets` / `coach_topup_requests` / `coach_fees` (**تراثي** — بأمر m7/أ 2026-09-18 خرج حقل `fee_per_client` من معادلة التكلفة وأُزيل مساره الإداري؛ الجدول يبقى بيانات جامدة بلا أي قراءة فوترة) | RLS: الإدارة كل شيء / المدرب صفوفه فقط؛ العملة USD (ميجريشن 0038) · **0098 (W0-3):** فهرس فريد جزئي `uq_coach_wtxn_topup_ref` على `coach_wallet_transactions (ref_id) WHERE kind='topup'` يحسم سباق شحن المحفظة المتزامن داخل `coach_adjust_wallet` (الخاسر يسترد الرصيد الحي بلا شحن ثانٍ) |
| `coach_payments` | دفتر تسجيل أموال المدرب الخارجية — RLS: إدارة الكل / مدرب صفوفه / العميل يقرأ ما يخصه |
| `subscription_requests` | ميجريشن 0043 أسقطت **كل** سياسات RLS الخاصة بالمدربين عليها — (select/update/delete = `is_admin()` فقط)، والمراجعة إدارة-حصرية · **0098 (W0-3):** عمود `paypal_order_id` + فهرس فريد جزئي = قفل إعادة تشغيل التقاط PayPal (الإدراج داخل `capture_paypal_subscription` هو الادعاء الذري — 23505 = «مُعالج مسبقًا») |
| `subscriptions` | تحصين 0041: المدرب يقرأ صفوف coaching فقط، وINSERT/UPDATE المباشر مسحوب (كان يسمح بتجاوز الخصم من المحفظة)؛ حارس `subscriptions_tier_model_guard` (0045) |
| `plans` | سياسة `plans_insert_coach` RLS (0041): توليد/إضافة خطة للعميل يشترط اشتراك coaching نشط + المتصل هو مدربه المُسنَد |
| `coach_pages` | صفحة عامة لكل مدرب (1:1، slug فريد `^[a-z0-9-]{3,40}$`، is_published) + أعمدة i18n الإنجليزية (0032) + إثراء عام (0037: photo_url، results_photos jsonb ≤6، سوشيال) |
| `coach_ads` (0037) + `coach_support_messages` (0037) | إعلانات ذات مدة ثابتة بخصم ذري من المحفظة (`coach_adjust_wallet`, kind 'adjust') + دعم المدربين للمنصة |
| `profiles` | `role` تعداد ثلاثي `client | coach | admin` (ميجريشن 0029) — سياسة SELECT ممتدة (0031): العميل يقرأ **فقط** صف مدربه المُسنَد عبر `coach_of(auth.uid()) = id` · **0099 (W1-2c):** عمود `invite_adopted_at` (text — توكن UUID لكل نداء) = توكن الادعاء أحادي الاستهلاك لمسار complete-invite: تحديث شرطي ذري واحد (WHERE is null) قبل كتابة كلمة المرور — الخاسر المتوازي يقرأ صفر صفوف ← ‏{ok:false} بلا كتابة إطلاقًا؛ يُكتب حصريًا من المسار (service-role) ولا يقرؤه شيء آخر |
| `coach_emails` | القائمة البيضاء للترقية — إضافة مدرب = INSERT فيها؛ `auto_promote_coach_if_allowed()` تحمي الدور عند كل دخول، ولا تُنزل أدمن أبدًا |

#### 1.4.1 الجداول الحاكمة من الموجات 0070–0087 (P3-5 — تحديث المرحلة 217؛ كان القسم متجمدًا عند 0069)

> الفهرس الكامل بالتواريخ والأسباب: `supabase/migrations/INDEX.md` (المصدر). هنا القواعد الخاصة للجداول التي تحكم سلوكًا حيًّا:

| الجدول/التغيير | الميجريشن | القاعدة الخاصة |
|---|---|---|
| `site_coach_of()` + `member_kind`/`site_member_active` | 0072 | فصل الأدوار الثلاثة (أدمن/مدرب موقع/مدرب B2B) — توسيع `is_coach_over` بفرع مدرب الموقع هو نقطة الاختناق الوحيدة لكل قراءات بيانات العميل؛ `coach_of()` الأصلية لم تُمس |
| `blog_generation_queue.pair_id` | 0076 | الإقران ثنائي اللغة: صفّان (en+ar) يشتركان في `pair_id` + sharedBrief مختومة — بلا FK عمدًا (التوأم يُدرج best-effort، غيابه حالة مشروعة تسقط للسلوك الليجاسي) |
| `evo_feedback` | 0077 | إشارة 👍/👎 على ردود EVO — insert للمصادق بصفوفه، select للأدمن، **صفر update/delete للجميع** (append-only) |
| `evo_memory` + `evo_memory_state` | 0078 | الذاكرة الدائمة: `evo_memory` بنمط chat_owner_or_coach (delete أدمن فقط)؛ `evo_memory_state` **صفر سياسات عميل** (service-role الكاتب الوحيد — عائلة evo_chat_usage المضادة للعبث) |
| `evo_followup_prefs` | 0079 | opt-in إجباري (default false — لا تسجيل صامت أبدًا)؛ الإلغاء update لا delete؛ `last_sent_at` يُختم من مسار الإرسال بـservice-role فقط |
| `evo_nutrition_patterns` | 0080 | معرفة منصة مجمعة مجهولة الهوية — **RLS مفعّل وصفر سياسات عميل عمدًا** (يستهلكها مولد الخطط server-side) |
| `evo_chat_cache` + `evo_call_stats` + `evo_eval_runs` | 0081 | كاش الأسئلة الشائعة (pg_trgm + `evo_cache_lookup()` بضربة واحدة — بلا مزود embeddings رابع) + قياس كل نداء نموذج + نتائج التقييم الأسبوعي — نفس انحراف «صفر سياسات عميل» الموثق |
| ~~`evo_api_keys`/`evo_api_usage`~~ | 0082→0083 | **شاهد قبر:** أنشِئا ثم أُسقطا بأمر المالك (إلغاء API الشركاء EVO-6) — المعرفات محظورة بguard-stale-refs ولا توجد في الإنتاج بعد 0083 |
| `ai_plan_usage` | 0085 + 0086 | **البوول الموحد**: صف لكل توليد ناجح فقط (الفشل/التعديل/العرض لا يُحتسب) — `user_id` أو `guest_key` (قيود CHECK)؛ الهوية المزدوجة للزوار: `guest_key` (تجزئة مملّحة لـUUID المتصفح) **و** `ip_key` (G6 — تنجو من النافذة الخفية ومسح التخزين؛ العرض يقرأ used=max(الاثنين))؛ حجم بوول العضو = **مجموع** حصص كل مستوى مدفوع فعّال (أمر 2026-10-28 — `resolveUnifiedPlanPoolLimit` بmembership-tier.ts)؛ RLS بلا سياسات عميل (service-role وحده) — مزيد القواعد في AGENTS.md §8 USAGE LIMIT ENFORCEMENT LAW |
| 0084 + 0087 | — | موجات بيانات فقط (توحيد جودة المحتوى + دمج النوايا بـ301s في next.config بنفس الكوميت) — types.ts بلا تغيير |
| `subscription_requests.paypal_order_id` + `capture_paypal_subscription()` | 0098 | **قانون idempotency ذرية لمسار PayPal (W0-3 — فحص 2026-10-02 S-01):** إدراج سجل الدفع = الادعاء الذري (فهرس فريد جزئي — 23505 = «مُعالج مسبقًا» ← نجاح idempotent بلا تمديد ثانٍ أبدًا) ثم `extend_subscription` **بمعاملة واحدة** (فشل التمديد يُرجع الادعاء كله — لا صف ولا تمديد ولا حالة مسمومة)؛ باب service_role حصرًا؛ `coach_adjust_wallet` يحسم سباق الشحن المتزامن ب نفس القانون (23505 مقيد باسم القيد ← إرجاع الرصيد الحي) — كاناري: `src/lib/__tests__/paypal-capture-idempotency.test.ts` |
| `profiles.invite_adopted_at` | 0099 | **قانون اعتماد الدعوة الذري (W1-2c — فحص 2026-10-02 S-05):** التوكن أحادي الاستهلاك — قيمته UUID فريد لكل نداء (عمود text لا timestamptz عمدًا: تفرد القيمة هو ما يجعل تحرير الادعاء عند فشل الكتابة عاجزًا عن سحق ادعاء لاحق ولو وُلد بنفس المللي ثانية): complete-invite يطالب بتحديث شرطي ذري واحد (`.eq(id).is(invite_adopted_at, null)`) قبل كتابة كلمة المرور — «الفائز بالادعاء» تحل محل «آخر كاتب يفوز»؛ بوابة GoTrue (invited_at + last_sign_in_at — قاعدة 13) قبل الادعاء فلا توكن لحساب مسجل ذاتيًا؛ فشل الكتابة يحرر الادعاء (مقيدًا بالتوكن) فتبدأ إعادة المحاولة نظيفة · لماذا عمود لا RPC: النصف الثاني نداء GoTrue HTTP لا ينضم لمعاملة DB — كاناري: `src/lib/__tests__/invite-adopt-atomic.test.ts` |
| `notifications` ‏(الفهرس + التقليم) | 0100 | **سياسة الاحتفاظ بالجرس (W2-1a — فحص 2026-10-02 P-03):** أول فهرس على الجدول `idx_notifications_user_created_desc (user_id, created_at desc)` يخدم قراءة الجرس ‏(eq + order desc + limit 20) وتحديث تعليم-الكل-مقروء · سياسة التقليم: RPC ‏`prune_notifications(p_retention_days default 90)` عمرية بحتة محصورة [7, 3650] (قيمة مهملة لا يمكنها مسح صفوف حديثة أبدًا) باب service_role وحده (سحب EXECUTE من PUBLIC — service_role يُبقي التنفيذ عبر امتيازات المنصة الافتراضية، مثبت حيًا بextend_subscription بعد 0042) — المشغّل الوحيد: workflow ‏notifications-prune.yml الأسبوعي (السبت 03:17 UTC) عبر scripts/notifications-prune.mjs؛ تفويت جدولة حميد (اللحاق الأسبوع التالي والفهرس يحمي كل قراءة) · **معنى عمليًا للجرس:** الصفوف الأقدم من نافذة الاحتفاظ تختفي — لا كود يقرأ ما وراء آخر 20 للمستخدم فلا سطح يتأثر — كاناري: `src/lib/__tests__/notifications-retention.test.ts` |

### 1.5 التخزين (Storage) — من AGENTS.md §8 (UPLOAD LAW)

- الرفع يمر حصريًا عبر `POST /api/upload`: تحقق `requireUser` + قائمة سماح للباكتس (`questionnaire-photos` / `progress-photos` / `receipts`) + حراسة MIME و5MB + **إعادة بناء مسار التخزين سيرفر-سايد تحت user id الخاص بالمتصل** + كتابة service-role. **(P3-11 — المرحلة 217، بموافقة §7):** إيصالات شحن المحفظة تسلك هذا المسار كذلك منذ المرحلة 217 (كانت ترتفع من المتصفح مباشرة بالمخالفة للقانون) — ومسار `/api/coach/wallet/topup` يرفض أي `receipt_path` لا يحمل uid الطالب نفسه في مقطعه الثاني (`receipts/<uid>/<file>` = إثبات الملكية).
- القراءة عبر `GET /api/file?bucket&path` (بروكسي streaming بصلاحية owner-or-coach) — **الباكتس الخاصة تأخذ روابط same-origin دائمة**، وليست signed URLs منتهية.
- الباكتس تُنشأ بميجريشن `RUN_ON_SUPABASE_0027_STORAGE_BUCKETS.sql` (idempotent، **بدون سياسات** — service role يتجاوز RLS أصلاً).
- باكت عام `coach-public` (5MB، jpg/png/webp، مجلد `<uid>/` الخاص بكل مستخدم مفروض بـstorage RLS) — صور الصفحة العامة للمدربين؛ والـAPI تقبل فقط مسارات same-origin من `/storage/v1/object/public/coach-public/` أو روابط https.
- باكت عام `avatars` (2MB، jpg/png/webp/heic/heif، مجلد `<uid>/` مفروض بسياسات `avatars_owner_insert/update/delete` — ميجريشن 0090): **أفاتارات المستخدمين حصريًا** — رفع متصفحي مباشر من صفحة البروفايل وخدمة عبر public URL (نموذج 0071 الموثق نفسه: أفاتار المدرب يظهر في صفحات عامة فالروابط الموقعة تنتهي و`/api/file` يرد 403 للزائر). **فصل صنوف الخصوصية (0090+0091، 2026-09-20):** الأفاتارات هنا، وصور الأجسام الحساسة في باكت `questionnaire-photos` الخاص — لا يُرفع إلى `avatars` أي شيء غير الأفاتار أبدًا.

---

## 2. سياسات الأمان (RLS) — شرح تفصيلي كما وردت في AGENTS.md

### 2.1 المبادئ العامة

1. **RLS هو خط الدفاع الأساسي** على مستوى قاعدة البيانات: كل جدول جديد يولد بسياساته في نفس الميجريشن (§6 بند 4).
2. **service role يتجاوز RLS** — لذا كل API route حساس يبدأ بحارس مصادقة/تصريح خاص به (`requireUser` / `requireCoach` / `requireAdmin`) قبل لمس القاعدة؛ الاعتماد على RLS وحده لا يكفي عند استخدام service role.
3. **المتصفح دائمًا anon + RLS مقيّد** — مثال الموثق: على `ai_jobs` يحمل المتصفح SELECT على صفوفه فقط، والكتابة كلها service-role.

### 2.2 دوال الـpredicates الأساسية (لبنات بناء السياسات)

| الدالة | التعريف الحالي | الاستخدام الصحيح |
|---|---|---|
| `is_coach()` | **أعيد تعريفها** (ميجريشن 0029) لتكون `role IN ('coach','admin')` — «الفريق» = مدرب ∪ أدمن | سياسات البيانات الإدارية/الفريقية؛ كل السياسات القديمة استمرت بالعمل بدون تعديل، والأدمن يرث وصول المدرب كاملًا |
| `is_admin()` | الدور admin | الجداول الإدارية-الحصرية (tool leads، blog، referrals admin، audit_log، coach_emails) مقفلة عليها حصريًا |
| `is_coach_over(client_id)` | **المسند الرسمي لبيانات العميل**: (الأدمن) أو (المدرب المُسنَد لهذا العميل من `coach_assignments`) | **ممنوع** استخدام `is_coach()` المجردة لبيانات العملاء — دائمًا `is_coach_over()` (قانون Multi-coach 0030) |
| `coach_of(auth.uid())` | يُعيد معرف مدرب العميل المُسنَد | سياسة قراءة profiles (0031): العميل يقرأ صف مدربه فقط |

> **قانون غير قابل للتفاوض:** لا تُعاد أبدًا كتابة السياسات إلى `= 'coach'` فقط — إعادة التعريف `role IN ('coach','admin')` هي أساس نمط الدور v2 كله.

### 2.3 نمط الأدوار v2 وأثره على RLS (AGENTS.md §8 ROLE MODEL v2 LAW)

- `profiles.role` = `client | coach | admin` (ميجريشن `RUN_ON_SUPABASE_0029_ADMIN_ROLE_ALL_IN_ONE.sql` بلصقة واحدة، أو 0029A + 0029B بالترتيب — لأن `ALTER TYPE` وأول استخدام له لا يستطيعان مشاركة transaction واحدة، فالسكربت المجمّع يفصلهما بـ`commit;` صريح).
- **ممنوع للعميل تغيير دوره:** سياسة 0017 تمنع تغيير الـrole من العميل؛ و`handle_new_user()` مُحصّنة (0036): metadata التسجيل لا يمكن أن تضبط دورًا — كل profiles تولد `client` والأدوار الفريقية تُمنح سيرفر-سايد فقط (service role يتجاوز سياسة 0017 عند الترقية المشروعة).
- الترقية: قائمة `coach_emails` البيضاء → `role='coach'` فقط (الترقية التلقائية لا تنزلق أدمن أبدًا)؛ إضافة أدمن = SQL يدوي فقط.
- **فصل الأسطح:** أسطح `/admin/*` تتطلب `role==='admin'` (AdminGate)؛ أسطح العميل (/dashboard /plans /progress ...) client-only والموظفون يُحوَّلون لـ/coach.

### 2.4 RLS في منظومة المال (فصل عالمَي المال)

- **كوتشينج الموقع (B2C):** مدفوعات الاشتراكات على الموقع تُراجع من الإدارة فقط — 0043 أسقطت سياسات المدربين على `subscription_requests` (إدارة-حصرية)، والإشعارات تذهب للإدارة لا للمدرب المُسنَد.
- **نظام المدربين (B2B):** الموقع لا يلمس أموال المدرب الخارجية — يسجلها فقط في `coach_payments` (RLS: إدارة الكل / مدرب صفوفه / العميل ما يخصه)، ويأخذ رسومه بخصم من محفظة المدرب بتسعير الحزم الثابت فقط (مصدر وحيد coach-limits.ts — قرار m7/أ 2026-09-18)؛ `coach_wallets` بقيود (balance >= 0) وRLS إدارة-الكل/مدرب-صفوفه.
- **الحد الفاصل:** المدرب يرى بيانات coaching-tier فقط لعملائه؛ اشتراكات الموقع (premium/pro) غير مرئية له — مفرض سيرفر-سايد **وعلى مستوى DB** (0041: `subscriptions` RLS — المدرب يقرأ صفوف coaching فقط + سحب INSERT/UPDATE المباشر).
- عمولة الأفلييت تُحجب عن أي عميل له صف في `coach_assignments` — الفحص عند نقطتي الاختناق فقط: `reviewSubscriptionRequest()` (الموافقة اليدوية) و`serverProcessAffiliateCommission()` في `/api/paypal/capture-order` (التلقائي).
- **حساب التواريخ:** لا إدخال يدوي لتاريخ البداية/الانتهاء — `extend_subscription` (رياضيات ميجريشن 0018): اشتراك نشط بنفس الطبقة → الأشهر تُكدَّس على `end_date` المتبقي؛ وإلا الآن → الآن+الأشهر.

### 2.5 تدفق إضافة مدرب (المسار الموثق)

1. مسار إداري: `POST /api/admin/staff` (requireAdmin) — بريد مسجل كعميل → ترقية فورية؛ بريد جديد → `auth.admin.inviteUserByEmail` (المدرب يضبط كلمة مروره من الإيميل ثم يُقلب دوره `coach` سيرفر-سايد)، وكلا المسارين يرفعان البريد إلى `coach_emails`.
2. مسار ذاتي: `POST /api/coach/register` **عام** (محدود 3/10د/IP + honeypot) — ينشئ مستخدم auth سيرفر-سايد (`email_confirm: true`)، والدور لا يُؤخذ من metadata العميل إطلاقًا؛ service role يرقّي إلى coach ويملأ القائمة البيضاء ثم يبذر محفظة 0 والإشعارات.
3. كل عميل جديد/قائم يُسند تلقائيًا للإدارة (المدرب العام) حتى يُعاد إسناده؛ إيميلات الفريق المسموحة لا تُسند كعملاء أبدًا.

---

## 3. مكونات الواجهة (Shadcn/ui) — الأسماء الكاملة

> **ملاحظة مصدر صريحة:** `AGENTS.md` لا يعدّد مكونات Shadcn (لا يذكر الاسم حتى) — والقانون في المشروع (خريطة مصادر الحقيقة، STATE.md) يقول: «عدد/أسماء الـcomponents → الكود نفسه `src/components/**`». لذلك هذه القائمة مستخرجة حرفيًا من `src/components/ui/` في الكود.

### 3.1 مكونات Shadcn/ui القياسية المثبتة

> **P1-5 (فريم 312، 2026-09-30 — كنس الموتى):** أُزيلت 36 مكونًا قياسيًا و3 hooks من `src/components/ui/`/`src/hooks/` (وتوابِعها الحزمية من package.json) بعد إثبات قابلية الوصول صفرًا من أي مسار: جدول الواردات من 282 جذر مسار أثبت عدم استيراد أيٍّ منها — لائحة الإزالة: alert-dialog · alert · aspect-ratio · avatar · breadcrumb · calendar · carousel · chart · checkbox · collapsible · command · context-menu · drawer · dropdown-menu · form · hover-card · menubar · navigation-menu · pagination · progress · radio-group · resizable · scroll-area · select · separator · sheet · sidebar · skeleton · slider · switch · toast · toaster · toggle · toggle-group · tooltip · 3d-testimonials + hooks/use-mobile · use-scroll-animation · use-toast. الباقي فقط أدناه — وهي القائمة الحية (سقطت معها حزم radix الـ21 وcmdk/embla/react-day-picker/react-resizable-panels/vaul/react-hook-form وغيرها، كلها بلا أي مرجع). استرجاع أي مكوّن: `bunx shadcn@latest add <name>` + إعادة الحزمة — والتاريخ الكامل بgit.

| الفئة | المكونات (اسم الملف بدون `.tsx`) |
|---|---|
| **عرض وبنية** | `accordion` · `badge` · `card` · `table` · `tabs` |
| **أزرار وتحكم** | `button` |
| **نماذج وإدخال** | `input` · `input-otp` · `label` · `textarea` |
| **نوافذ وطبقات عائمة** | `dialog` · `popover` |
| **إشعارات** | `sonner` |

### 3.2 مكونات مضافة خاصة بالمشروع (ليست من مخزون Shadcn القياسي)

| المكون | الوظيفة |
|---|---|
| `copy-button` | زر نسخ بذاته (يستخدم في الكود والحالات القابلة للنسخ) |
| `image-with-fallback` | صورة مع سقوط آمن عند فشل التحميل |
| `modal` | غلاف `<Modal>` موحّد فوق Radix `ui/dialog.tsx` (W1-3a · فريم 333): عنوان إلزامي (Radix DialogTitle → aria-labelledby) + زر إغلاق بأيقونة وaria-label معرّب (i18n `common.close`) + مقاسات sm/md/lg + جسم قابل للتمرير — تبنّته النوافذ الثلاث بW1-3b (فريم 334): عارض خطط العضو PlansView (lg+scroll+actions) · صرف العمولة ReferralView (sm+description) · محرر خطط المدرب CoachClientView (lg+scroll+عنوان قابل للتحرير) — A-03 مغلقة · درج EVO (EvoFloatingWidget) يركب primitives الراديكس نفسها مباشرة بشكل الدرج الجانبي (W1-3c · فريم 335): الفقاعة = Radix trigger دائم التركيب يستعيد التركيز عند الإغلاق + role=dialog بعنوان موصول (DialogTitle) + قِرار إغلاق واحد (Escape/الخلفية/زر X ← onOpenChange) + منطقة الرسائل `role=log` حية (aria-live) — A-01 مغلقة · درج الموبايل بالترويسة (SiteHeader) يكمل عقد الحوار يدويًا بلا Radix (W1-3d · فريم 336 — اتجاه الخطة الحرفي «inert لا تصيير شرطي» حفاظًا على حركة الخروج): الحاوية `inert` عند الإغلاق (خارج ترتيب التبويب وشجرة AT والمؤشر — aria-hidden باقية حزامًا) + الهامبرغر `aria-expanded`/`aria-controls` موصولان بلوحة الحوار + فخ Tab يدوي (التفاف أول↔أخير وسحب الشارد) وهبوط التركيز على اللوحة عند الفتح واستعادته للهامبرغر عند كل مسارات الإغلاق — A-02 مغلقة |

> قاعدة التوسع: أي مكون جديد يدخل من مكتبة shadcn/ui القياسية أو يُكتب محليًا في `src/components/ui/` — ولا يُستورد نظام واجهة بديل بدون موافقة المالك (§3.4: ممنوع اختراع معمارية).

---

## 4. أكواد SQL والاستعلامات المعقدة المذكورة في AGENTS.md

> هذه **كل** المقاطع/الصيغ SQL التي يحملها `AGENTS.md` حرفيًا أو يوثق منطقها، مجمعة ومنظومة. التطبيق الفعلي الكامل في ملفات `supabase/migrations/` (وهي مصدر التنفيذ — هذا القسم مرجع فهم فقط).

### 4.1 تعريف دالة الفريق (نمط الدور v2 — ميجريشن 0029)

```sql
-- is_coach() أعيد تعريفها: «الفريق» = مدرب ∪ أدمن
-- كل سياسات RLS القائمة استمرت بالعمل بدون تعديل بعد هذا التغيير
role IN ('coach','admin')
```

### 4.2 المسند الرسمي لبيانات العميل (قانون Multi-coach — ميجريشن 0030)

```sql
-- is_coach_over(client_id) = الأدمن أو المدرب المُسنَد للعميل
-- أساس كل سياسات RLS الخاصة ببيانات العملاء — ممنوع is_coach() المجردة هنا
exists (
  select 1 from coach_assignments ca
  where ca.client_id = <client_id>
    and (is_admin() or ca.coach_id = auth.uid())
)
```

### 4.3 سياسة قراءة ملف المدرب المُسنَد (ميجريشن 0031)

```sql
-- profiles: العميل يقرأ صف مدربه فقط (امتداد سياسة SELECT)
coach_of(auth.uid()) = id
```

### 4.4 إعادة تحميل مخطط PostgREST (إلزامي بعد أي ميجريشن يدوية)

```sql
NOTIFY pgrst, 'reload schema';
```

### 4.5 فلتر الاشتراك النشط (المستخدم في كل حسابات الاشتراك والحدود)

```sql
-- getSubscriptionForClient + بوابات التفعيل + زر واتساب المدرب كلها
-- تقفل على نفس الشكل: نشط وغير منتهي
status = 'active' AND end_date > now()
```

### 4.6 رياضيات تمديد الاشتراك (ميجريشن 0018 — منطق extend_subscription)

```sql
-- اشتراك نشط بنفس الطبقة → الأشهر تُكدَّس على المتبقي؛ وإلا الآن → الآن+الأشهر
-- (ممنوع إدخال التواريخ يدويًا — الواجهة تعرض معاينة محسوبة فقط)
end_date = greatest(end_date, now()) + interval '<months> months'  -- حالة التكديس
end_date = now() + interval '<months> months'                      -- حالة البدء الجديد
```

### 4.7 بصمة IP المجهولة المملحة (ميجريشن 0028 — evo_anon_usage)

```text
SALTED-SHA-256(client IP)
-- بلا سياسات RLS (service-role فقط) — ولا يُخزن IP خام أبدًا
```

### 4.8 حارس طبقة الاشتراك مقابل الموديل (ميجريشن 0045)

```text
subscriptions_tier_model_guard
-- صفوف الاشتراك تُكتب دائمًا بطبقات الموديل القانونية عبر canonicalModelTier()
-- (starter → premium · elite → pro) في مساري التفعيل معًا
-- (PayPal capture-order بالـservice role + موافقة الإدارة اليدوية)
```

### 4.9 الترقية التلقائية المحمية للمدربين

```text
auto_promote_coach_if_allowed()
-- تحمي role='coach' عند كل تسجيل دخول لمن في قائمة coach_emails
-- ولا تنزلق أدمن أبدًا (never downgrade an admin)
```

### 4.10 حذف جماعي بالأشكال المثبتة (درس إنتاج 2026-08-28n)

```typescript
// الشكل المثبت الذي يعمل في الإنتاج (مثلاً مسح إشعارات الفشل):
const ids = [...];            // select ids أولًا
await supabase.from("ai_jobs").delete().in("id", ids);
// المتغير الذي مات في الإنتاج: .delete(null, { count: "exact" }) — خطأ غير-JSON
```

### 4.11 استعلامات التحقق المقروءة (مسموحة للوكيل من §3.3)

```sql
SELECT count(*) FROM blog_posts;  -- نمط القراءة الوحيد المسموح به للتحقق
```

### 4.12 أنماط ملفات الميجريشنز الإلزامية (أسماء وأشكال، وليست SQL تنفيذية)

```text
supabase/migrations/YYYYMMDDHHMMSS_NNNN_<slug>.sql     -- التسمية الوحيدة للتطبيق التلقائي
supabase/migrations/RUN_ON_SUPABASE_<IDs>.sql          -- السكربت المجمّع الجاهز للصق
supabase/migrations/VERIFY_SCHEMA_DRIFT.sql            -- فحص المالك للقراءة فقط
-- قواعد المحتوى: IF NOT EXISTS في المقدمة (idempotent) · سياسات RLS لكل جدول جديد
-- · NOTIFY pgrst, 'reload schema'; في الخاتمة · بلوك VERIFY
```

### 4.13 مخطط مسارات Multi-coach (ميجريشن 0030 — ترتيب اللصق)

```text
RUN AS THE 4-PART PASTE-FRIENDLY SPLIT, IN ORDER:
  0030A schema → 0030B client-RLS → 0030C admin-RLS+notifs → 0030D RPC+reload
RUN_ON_SUPABASE_0030_MULTI_COACH.sql = نسخة مرجعية مطابقة بايت-بايت (ليست للصق)
-- نمط عام: ALTER TYPE وأول استخدامه لا يتشاركان transaction واحدة → فصل بـcommit; صريح
```

---

## 5. طبقة الكاش في الإنتاج (Cloudflare) — القرار الرسمي

> **الأمر المالك (2026-09-16، المرحلة 215 / P1-5):** «اعتمد الخيار (ب)» — Cloudflare هي طبقة الكاش **الرسمية** لصفحات HTML العامة في الإنتاج، والتوثيق يطابق الواقع المقاس.

### 5.1 البنية

```
المتصفح ──► Cloudflare (alkemos.com) ──► Vercel (الدوال/الأصول) ──► Supabase
             ▲ طبقة الحافة الرسمية
```

- الطلب يمر عبر Cloudflare قبل Vercel، وقاعدتا كاش في المنطقة (zone) تملكان سلوك كاش الإنتاج: قاعدة HTML العام (SEO-GEO-4) وقاعدة بطاقات OG (ت-1).
- إعداد المنطقة Browser-Cache-TTL = **Respect Existing Headers** (تحقق خارجي 2026-09-16) — أي أن **القاعدة** وليست إعداد المنطقة هي المصدر.

### 5.2 الـ ruleset وقواعده الأربع «alkemos cache rules (SEO-GEO-4 2026-09-08)»

> **VERCEL-USAGE-3 (2026-09-16، أمر المالك «نفّذ ت-1 وت-3»):** صارت المنطقة تحمل **قاعدتين** في نفس الـ ruleset (phase `http_request_cache_settings`).
> **VERCEL-USAGE-4 (2026-09-19، أمر المالك «مطلوب تنفيذ حل لمشكلة تجاوز الاستخدام الحالية»):** Edge TTL للقاعدة 1 رُفع **14400 → 43200 ث (12 ساعة — T-3b)** لخفض رندرات الأصل ÷3 حمايةً لسقف Fluid Active CPU على Hobby (كان متجاوزًا: 4h10s/4h).
> **VERCEL-USAGE-7 (2026-10-02، أمر المالك «أعد التدقيق والإصلاح بناءً على Usage الحالي»):** أُضيفت **القاعدة 3** — كاش حافة ساعة واحدة لـ sitemap*/rss.xml/llms*/robots.txt (حارس نقل جلبات الزواحف من الأصل — تحقق حي MISS→HIT).
> **VERCEL-USAGE-9 (2026-10-09، أمر المالك «نفّذ الحلول في فرع تجريبي»):** أُضيفت **القاعدة 4** — **تجاوز كاش (bypass)** لطلبات RSC (تعبير `?_rsc` أو ترويسة `RSC: 1`)؛ قواعد الكاش **تراكمية والقاعدة المطابقة الأخيرة تحسم التعارض** (قانون CF الرسمي) لذا تجلس رابعة/أخيرة فتُلغي `cache=true` للقاعدة 1 على طلبات RSC فقط — كان CF يقدّم HTML المخزّن 12س لتنقل React الناعم (مفتاح الكاش يتجاهل `Vary: rsc`) فيكسره ويرغم على تحميل صفحة كاملة؛ تحقق حي: طلب RSC الآن `text/x-component` + `cf-cache-status: DYNAMIC`، وHTML الطبيعي ما زال `HIT`. التراجع: حذف القاعدة الوحيدة.

| العنصر | القاعدة 1: HTML العام | القاعدة 2: بطاقات OG (ت-1) | القاعدة 3: خرائط/خلاصات (VERCEL-USAGE-7) | القاعدة 4: تجاوز RSC (VERCEL-USAGE-9) |
|---|---|---|---|---|
| الوصف الحرفي | `alkemos-public-html-cache (+browser_ttl Phase 189 — deep-audit P2-1); edge TTL 3600->14400s (T-3 VERCEL-USAGE-3 2026-09-16) -> 43200s (T-3b VERCEL-USAGE-4 2026-09-19, Fluid CPU overage guard)` | `alkemos og-image cache (T-1 VERCEL-USAGE-3 2026-09-16)` | `alkemos sitemap-rss-llms cache (VERCEL-USAGE-7 2026-10-02 — bot-fetch transfer guard, edge TTL 1h)` | `alkemos RSC cache bypass (VERCEL-USAGE-9 2026-10-09)` |
| آخر تحديث | VERCEL-USAGE-3 (2026-09-16) — كانت آخر تحديث بالمرحلة 189 | منشأة في VERCEL-USAGE-3 (2026-09-16) | منشأة في VERCEL-USAGE-7 (2026-10-02) | منشأة في VERCEL-USAGE-9 (2026-10-09) |
| التعبير | قائمة استثناءات المسارات الخاصة بـ SEO-GEO-4 (api/admin/auth/checkout/dashboard/questionnaires/progress/plans/profile/support/referral/preview/coach) + المسارات الخالية من النقاط — أي صفحات HTML العامة فقط | `starts_with(http.request.uri.path, "/api/og-image/")` | `starts_with(http.request.uri.path, "/sitemap") or http.request.uri.path in {"/rss.xml" "/robots.txt"} or starts_with(http.request.uri.path, "/llms")` | `(http.request.uri.query contains "_rsc") or (http.request.headers["rsc"][0] in {"1"})` |
| السلوك | `cache=true` · Edge TTL override **43200 ث (12 ساعة — T-3b، كان 14400/4 ساعات ثم 3600/ساعة)** · Browser TTL override **300 ث** | `cache=true` · Edge TTL override **86400 ث (يوم كامل)** · Browser TTL **respect_origin** (المسار يرسل أصلًا `public, max-age=86400`) | `cache=true` · Edge TTL override **3600 ث (ساعة — مطابقة لـ ISR المسار نفسه)** · Browser TTL **respect_origin** | `cache=false` (**BYPASS**) · ترتيب أخير = تحسم التعارض مع القاعدة 1 لطلبات RSC فقط |

- المسارات المنقوطة (الأصول الثابتة) والأسطح الخاصة **خارج** القاعدة 1، وكل ما ليس `og-image` خارج القاعدة 2 — خرائط الموقع/RSS/llms/robots لهم **القاعدة 3** حصريًا (كاش ساعة واحدة — أسوأ حداثة للزاحف ساعتان: 1 CF + 1 ISR، بلا أي تأثير على إيقاع اكتشاف الزواحف) — القواعد الأربع غير متداخلة في الأثر (القاعدة 1 تستثني `/api*` صراحة؛ القاعدة 4 تستهدف فئة طلبات RSC فقط وتتجاوز الكاش لصالح كاش ISR لدى Vercel).
- تحقق `src/lib/sitemap-xml.ts:23` يضع ترويسات خرائط الموقع بنفسه (Vercel يخزنها مؤقتًا ISR؛ CF يكاشها الآن ساعة عبر القاعدة 3 — كانت `DYNAMIC` قبل VERCEL-USAGE-7).

### 5.3 الأثر المقاس حيًّا (أدلة 2026-09-16 — قبل/بعد VERCEL-USAGE-3)

- صفحات HTML العامة: تصل للمتصفح بترويسة `private, max-age=300, must-revalidate` (إعادة كتابة Browser TTL بواسطة القاعدة) مع `cf-cache-status: HIT` ما دام مدخل الحافة طازجًا (حتى **43200 ث** منذ T-3b — كان 14400 ثم 3600)؛ عند انتهاء صلاحية مدخل الحافة يعيد CF الجلب عبر دالة Vercel (`x-vercel-cache: MISS`) ثم يعيد التخزين. **مقايضة T-3b الموثقة:** تعديل/إضافة مقال قد يستغرق حتى 12 ساعة ليظهر على PoP دافئ (URLs الجديدة ليست مخاكشة أصلًا فتُخدم فورًا — لا تأثير على اكتشاف الزواحف عبر sitemap/RSS).
- بطاقات `/api/og-image/*`: كانت `cf-cache-status: DYNAMIC` قبل ت-1 → بعدها `MISS` عند أول جلب ثم `HIT` على كل إعادة طلب (بطاقة ثابتة وبطاقات مقالات، AR/EN، ومدخل cache-buster جديد) — مدخل حافة يوم كامل لكل slug×lang بلا Set-Cookie وصفر دوال/صفر Supabase/صفر Satori عند إعادة الجلب.
- المستثنيات بقيت كما هي (تحقق حي بعد التطبيق): `/auth` = DYNAMIC · `/api/build-info` = DYNAMIC · `sitemap.xml` صارت MISS→HIT بعد القاعدة 3 (كانت DYNAMIC).
- قاعدة `next.config.ts` (SEO-GEO-4) تبقى **سياسة المصدر** (Origin): ما يُخرِجه Vercel وما يستلمه كل مسار لا يمر بـ CF (روابط المعاينة، الوصول المباشر لـ Vercel).

### 5.4 القانون التبعي

أي تعديل مستقبلي على كاش HTML في الإنتاج = **تغيير في لوحة Cloudflare أولًا**، مع تحديث هذا القسم + `SECURITY.md` §10 في نفس الفريم (§3.8) — تغيير كود فقط يخالف هذه القاعدة يُعد عيب توثيق. المرجع الكامل للسياق الأمني: `SECURITY.md` §10.

## 6. سرد قوانين §8 (AI) الكامل — المنقول حرفيًا من AGENTS.md

> **Provenance (المرحلة 292 — ARCH-REMEDIATION، أمر المالك بتنفيذ تقرير تدقيق المعمارية 2026-09-28 بند P3-2):** هذا القسم هو نص §8 الكامل كما كان بAGENTS.md حتى المرحلة 291 (الحوادث والقرارات والسرد التفصيلي) — §8 نفسه صار قانونًا مضغوطًا (اسم + جوهر ملزم + إحالة هنا). عند أي تعارض: الجوهر الملزم الملخص بAGENTS.md §8 هو الحاكم، وهذا القسم سياقه الكامل؛ والكود أولًا فوق الاثنين (هرم §12.8).

> **Revised (2026-08-27, owner directive).** Slimmed 2026-09-03 (Phase 113, owner «الأمر الثالث»): every law keeps its name + binding core (one to two lines); the long narratives, SQL, and full tables live in the code and `docs/TECH_REFERENCE.md` (§12.8: code wins).

- **PROVIDER LAYER:** `src/lib/ai-provider.ts` is the SINGLE source of truth for AI calls — providers OpenRouter + Groq + NVIDIA NIM ONLY (NVIDIA added 2026-09-09 owner directive «تم اضافة مفتاح NVIDIA_API_KEY» — integrate.api.nvidia.com, OpenAI-compatible). Two intentional paths: `callFreeAIFallbackChain()` (sequential strongest-first, budget-clamped ≤52s on Vercel) and `callFreeOpenRouterRace()` (parallel fastest-wins, swap only) — never collapse or bypass them; consumers never fetch provider URLs themselves. Scheduled/batch AI work follows the native-GHA pattern (`scripts/blog-runner/run-step.mts` in-process; GHA-only `AI_CHAIN_TOTAL_BUDGET_MS` override — 480000 in the blog workflows since R3 2026-09-29, was 360000 since Phase 119; process-ai-jobs has run 480000 since 161.4), never new Vercel-capped endpoints.
- **BLOG PIPELINE v3 — LANGUAGE SPLIT (supersedes v2) + BILINGUAL PAIRING (Phase 157):** six phases `p0-research → p1-outline → p2-content → p3-images → p4-review → p5-publish` under `/api/cron/blog/` with REQUIRED `?lang=en|ar`; one queue row == ONE article in ONE language; 1 slot/day/language since Phase 119 (owner directive 2026-09-04: ONE AR + ONE EN article per day at different geography-anchored times — EN 22:00 UTC = 18:00 ET · AR 05:00 UTC = 08:00 Cairo) via independent `blog-post-en.yml` / `blog-post-ar.yml` (concurrency groups independent on purpose). Phase 157 (owner «نفذ توصيتك» = Proposal 1): the ONE daily topic yields TWO rows sharing `pair_id` + a sealed `sharedBrief` (adopt ≤48h · join ≤30h · create protocols; migration 0076) — each language still runs its FULL P1→P5 pipeline itself, written from scratch (never translation), and P5 fills `linked_post_id` bidirectionally (hreflang + LanguageToggle light up per pair); ANY pairing failure degrades to the exact legacy independent-row behavior (blind pairing forbidden). Legacy step1/step2a..step3 routes and dual-language statuses are retired.
- **ai_jobs TOPOLOGY:** every batch AI call is an `ai_jobs` row (migration 0024) processed natively by `process-ai-jobs.yml` every 10 min via `scripts/ai-jobs-runner/process.mts`; types: `plan_nutrition | plan_workout | meal_regenerate | exercise_regenerate | article_tool | social_post`; the ONLY direct-model exception is EVO chat (Vercel streaming, chain "fast"). Vercel routes may ENQUEUE (`/api/ai/jobs`) but NEVER call a model; retired routes/components stay guard-banned. New AI feature = new job_type + processor entry in `ai-job-processors.ts` + JOB_GATE row. Browser: SELECT-own-row RLS only; writes service-role exclusive (TECH_REFERENCE §1.4).
- **PROVIDER BALANCE + DUAL-KEY POOL:** the chain rotates the leading provider per call across ALL THREE providers (openrouter → groq → nvidia, 3-way since 2026-09-09; fast chain stays groq-first), rotates BOTH OpenRouter accounts round-robin (`OPENROUTER_API` #2 + `OPENROUTER_API_KEY` #1), retries the SAME model on the other account on 401/402/403/429 before falling down the ladder; `callAIWithFallback` stays EXACT (one config → one provider, honest errors) — never a silent cross-provider stage inside it. Groq oversized-payload guard is PER-ENTRY (R3, Execution-Path Audit 2026-09-29): when a call's est. size exceeds the 7.2k window, a groq entry's max_tokens is clamped to the remaining window and the entry STAYS in the chain while the clamp keeps ≥3800 output tokens (P2 content re-enters Groq at ~4.8–4.9k max_tokens); below the floor the entry is dropped (P4 review stays OpenRouter/NVIDIA-only by design). Rollback: `GROQ_MAX_TOKENS_CLAMP=0` restores the pre-R3 global drop verbatim.
- **UNIVERSAL MODEL SWITCHER COVERAGE:** every AI subsystem rides the chain with an observational `tag` naming subsystem+provider+model+key event — live registry is the code (`ai-provider.ts` + call sites); a bare provider fetch outside the chain is banned; new consumers import from `ai-provider.ts` AND register their tag; Vercel Production env carries the same keys as GHA secrets.
- **IMAGE SAFETY v1/v2 (SUPERSEDED):** negation-suffix prompts FAILED (diffusion treats negation as attractor) and semantic person-scene attractors defeated token sanitization — the retired constant is BANNED by guard-stale-refs; canary suites replay the incident prompts.
- **IMAGE SOURCE LAW v3 — PEXELS-FIRST (current):** AI image generation RETIRED; every blog image is REAL stock photography (Pexels primary + `PEXELS_API_KEY`, Unsplash/Pixabay failover, Pixabay safesearch=true). Normal people allowed, nudity/immodesty NOT: `sanitizeImageQuery()` strips NSFW (EN+AR) + negations, `hasNsfwVocabulary()` screens every alt-text; lightweight delivery via Pexels src.landscape + the site's next/image WebP system; deterministic rotation per `variationKey` (article, position); FAIL-FAST without the key (required in GHA secrets AND Vercel Production); canaries in `image-safety.test.ts` v3.
- **BLOG BODY IMAGE RENDER LAW:** `renderMarkdown()` converts `![alt](url)` → lazy `<img>` BEFORE the link rule (else images degrade to bare links); unsafe schemes dropped (XSS guard) — guarded by `blog-markdown-images.test.ts`.
- **EVO CHAT SURFACE & HISTORY LAW:** the floating widget is the ONLY EVO chat surface (`/chat` permanently redirects to `/evo`; CTAs open the widget via `openEvoFloatingChat()`); back-button CLOSES the drawer (sentinel history entry); assistant links persist INSIDE `body` markdown (`evo-chat-links.ts`) and render as anchors; persistence is hydration-gated (an empty mount-time write must never wipe history); reopening lands on the LATEST message (scroll-ref snap — never key on `[messages, isTyping]`, never `scrollIntoView`); system prompt carries a hard capability whitelist (EVO says "I can't" rather than inventing tools) and answers render plain text only (`evo-chat-format.ts`); floating icon ≥48px.
- **EVO-5 CACHE / EVAL / ANALYTICS LAW (2026-09-11):** the frequent-question cache (`evo_chat_cache`, 0081, pg_trgm — NO embeddings; the pre-343 «NO 4th provider» clause was superseded by owner order 2026-10-06 adding the gemini arm to `ai-provider.ts` — the CACHE itself still uses zero embeddings) serves ONLY context-free requests via the pure gate `isCacheEligibleMessage` (empty history · no subscriber context · no memory · no plan/swap intent · no first-meeting · no crisis); a cache-served message KEEPS consuming quota (record-before-dispatch precedes the lookup) and the cache is fail-open (any error → normal dispatch). The system prompt lives in `evo-system-prompt.ts` (single source — the chat route AND the eval harness must evaluate the REAL prompt; `buildSystemPrompt` may never be forked). Weekly eval (GHA `evo-weekly-eval.yml` + `evo-eval-runner.ts`) judges the reference AR/EN set with a cheap chain model into `evo_eval_runs` — a run with zero scored questions exits RED (honest color). Every model dispatch writes one best-effort `evo_call_stats` row (static crisis/gate/429 replies are NOT dispatches) powering `/admin/evo-analytics`.
- **EVO-6 PARTNER API — REMOVED (2026-09-10, owner order «مطلوب الغاء فكره api الشركاء», deep-audit session):** the public partner surface shipped in Phase 169 (`/api/evo/v1/chat` + `/embed/evo.js` + `/embed/widget` + `/admin/evo-partners` + `evo-partner.ts` + `evo-embed-script.ts` + migration 0082 tables `evo_api_keys`/`evo_api_usage` + `docs/EVO-PARTNER-API.md` (file deleted with the surface)) was CANCELLED by the owner days after shipping — everything deleted and the tables dropped by migration 0083 in the SAME phase; `EVO_PARTNER_API_ENABLED` is dead config (the owner removes the env var from Vercel; the code no longer reads it) and the audit's rate-limit finding (Upstash per-instance fallback) died with the surface. Do NOT resurrect any partner API/embed surface without a new owner order — the retired identifiers are banned by guard-stale-refs. `evo-cache-server.ts` SURVIVES the removal: it is the shared cache-module of the platform chat route (single cache semantics, the evo-system-prompt pattern).
- **AI SURFACE DEEP-AUDIT LAW:** every UI control calling an API must target an existing route (CI: `check-ui-wiring.sh`); uploads go through `POST /api/upload` + `GET /api/file` (bucket allowlist, MIME+5MB, server-rebuilt paths, service-role write, permanent same-origin URLs for private buckets — TECH_REFERENCE §1.5); AppLayout `coachExtraLinks` lists EVERY `/admin/*` page for isAdmin only; re-audit after ANY new button+endpoint pair.
- **ROLE MODEL v2 LAW (migration 0029+):** `profiles.role` = `client | coach | admin`; STAFF = coach ∪ admin; `is_coach()` = `role IN ('coach','admin')` — NEVER rewrite policies back to `= 'coach'` only; client-data RLS uses `is_coach_over()` (TECH_REFERENCE §2.2). `/admin/*` is admin-exclusive (AdminGate); client surfaces are staff-blocked (ROLE SURFACE LAW); staff bypass consumer quotas; no sales funnel for staff; promotion via the `coach_emails` allowlist (never downgrades an admin) or manual SQL for admins. Multi-coach (0030–0033): `coach_assignments` is the 1:1 source of truth (auto-assign to admin until reassigned); coach_pages powers the bilingual public landing (0032); team management is one lifecycle on `/admin/assignments` + `/api/admin/staff` (add → assign → demote). Full flows: TECH_REFERENCE §2.
- **COACH ACTIVATION + OFFLINE PAYMENTS (0034+):** the coach collects OUTSIDE the site and activates the subscription himself; the site NEVER touches that money — it RECORDS it (`coach_payments`). `extend_subscription()` is guarded (service role / admin / assigned coach only). `/api/coach/subscriptions/activate` verifies assignment + role, activates tier 'coaching' ONLY, debits the wallet atomically BEFORE extending (402 `insufficient_wallet`; admins wallet-exempt), refunds on failure. PLAN-BALANCE QUOTA: plan generation draws from the CLIENT'S one unified monthly pool (`ai_plan_usage`, migration 0085, success-only — nutrition + workout COMBINED; owner order 2026-10-28 «تجميع حصص الاشتراكات المدفوعة»: the member pool size is the AGGREGATE of every distinct effectively-active paid tier — free 2 · premium 4 · pro 8 · coaching 8; premium+pro = 12; guests keyed by hashed browser id; `resolveUnifiedPlanPoolLimit()` in membership-tier.ts is the single source); editing + manual uploads UNLIMITED (legacy per-kind split + weekly caps retired by the 2026-09-13 «البوول الموحد» decree).
- **COACH WALLET LAW (0035+):** `coach_adjust_wallet()` is the ONLY wallet writer (SECURITY DEFINER, row-locked, never negative). Top-ups: manual receipt review on `/admin/wallets` OR PayPal automated (purpose `wallet_topup`, USD 1:1, DETERMINISTIC UUID5 ledger ref — replays idempotent; the webhook stays LOG-ONLY, never credits). Monthly quota: coach AI usage counts only the CURRENT UTC calendar month. Self-registration PUBLIC (`/api/coach/register`, rate-limited + honeypot; role granted server-side only — 0036 hardened `handle_new_user()` so signup metadata can never set a role).
- **COACH BOOST PACKAGE (0037+):** per-client fees are PACKAGE-based (COACH_CLIENT_PACKAGES + the single debit calculator in coach-limits.ts); coach ads by ATOMIC wallet debit (homepage «مدربون مميزون» strip); public profile enrichment via the coach-public bucket; coach-only support channel at `/coach/help` (client support belongs to the coach); share icons allowed but the WhatsApp share target is REMOVED by decree; the coach's WhatsApp number is served ONLY via `/api/my/coach-whatsapp` gated on ACTIVE subscription + assignment (never public, never a share target); affiliate commission EXCLUDED for any client with a `coach_assignments` row (both choke points); staff clients surface splits عملاء المدربين / عملاء الموقع.
- **COACH CLIENT BOUNDARY + TERMINOLOGY LAW:** TWO money worlds share the word «كوتشينج» — SITE COACHING (B2C: sold on the site, admin-reviewed only — 0043 dropped every coach RLS policy on `subscription_requests`) vs COACH SYSTEM (B2B: coach collects outside, site records + takes its wallet fee; coaching tier only). Coaches never see site memberships (0041: subscriptions RLS hardened, direct insert/update revoked) and never generate plans without an ACTIVE coaching subscription + assignment (server 402 + DB RLS `plans_insert_coach`). Dates are NEVER hand-edited — `extend_subscription` (0018) computes/stacks them; UI shows a preview only. Coaching-page prices reverted to Starter $20 / Elite $40 (0046); subscription rows always written via `canonicalModelTier()` (starter → premium, elite → pro).
- **GLOBAL USD LAW (0038):** fixed owner rate 50 EGP = $1 — every platform-side money figure is USD ONLY; source of truth `coach-limits.ts`; legacy EGP payloads accepted and ÷50 for compat; user-facing money strings never show EGP/ج.م.
- **BRAND NAME LAW:** the site name is written EXACTLY «Alkemos» in every user-visible string (metadata, i18n, legal, landing, affiliate, AI prompts, PayPal descriptions); pre-rebrand spellings are FORBIDDEN in new code — «Musclehubeg» (the canonical legacy name) plus its variants «MuscleHubFit» / «MuscleHubEG» / «MuscleHub Egypt» / «MuscleHub» (the Phase-121 case-sensitive sweep chain, commit a3e2bfc4); lowercase technical identifiers stay as-is and must never be rewritten (GitHub org `muscleshubfit-cpu`, backup repo `musclehubeg-backups`, `supabase/config.toml` project_id, owner email).
- **USAGE LIMIT ENFORCEMENT LAW:** every limit advertised in `memberships.ts` MUST be enforced SERVER-SIDE at the only route that can consume it, and the client UI mirrors the SAME resolved tier — display/enforcement drift is a defect. Anonymous chat throttled SERVER-SIDE via salted-hash `evo_anon_usage` (fail-open on ledger errors). Plan intents consume the UNIFIED monthly pool (success-only, ONE budget for nutrition + workout combined); swap/regenerate stays on the WEEKLY quota — never double-count one message in both; advertised numbers change ONLY in memberships.ts.
- **SCHEDULE HEALTH LAW:** GitHub can silently DE-REGISTER scheduled workflows repo-wide — any "blog stopped" report starts with schedule forensics (`GET /actions/runs?event=schedule`), NOT code re-reading; remedy = re-enable every workflow + a touching commit to re-register. Backstop (never trust the scheduler alone): `/api/cron/dispatch-pipelines` (CRON_SECRET, fail-closed, daily 23:40 UTC — Phase 171: after both Phase-119 daily slots AND past the 90-minute scheduler-delay grace window) tops pipelines up to their publishing quota (ONE article per language per day — a slot is "expected" only 90 min after its hour; coverage = max(non-failed runs, posts actually published today); the same law is enforced at P5: an automated row refuses to publish a second same-day article, coach-requested rows exempt) + re-dispatches a stale ai-jobs worker; requires `GITHUB_DISPATCH_TOKEN` (never committed — §3.2). Diagnose quota (429s) BEFORE schedules; schedules BEFORE code.
- **PLAN JOB RECOVERY LAW:** queue jobs that materialize user-visible artifacts are SURVIVABLE state — enqueued plan jobs persist in localStorage (`src/lib/plan-jobs.ts`, 24h TTL) with mount-reattached watchers, finished jobs surface as one-click recovery cards (never double-saved); regeneration enqueues the replacement FIRST and deletes the old draft only after the new plan arrives and only while still a draft; staff requesters bypass the swap quota (plan-editing tools, not self-service).
- **EVENT-DRIVEN AI DISPATCH LAW:** enqueue alone is NOT enough on a cron worker — every enqueue path push-triggers the runner (`src/lib/ai-runner-dispatch.ts`, fail-open); `POST /api/ai/jobs` answers honest `runnerDispatched` + `etaMinutes`; `GITHUB_DISPATCH_TOKEN` is a REQUIRED production secret. New job types register in FOUR places (AI_JOB_TYPES + JOB_GATE + sanitizeJobPayload + processor registry; required fields throw `JobPayloadError` → 400). Completed `article_generate` jobs are ALWAYS materialized — pipeline-dispatched ones PUBLISH through P5 (the row is the dispatch receipt), fallback ones land as blog_posts DRAFTS (never only inside ai_jobs.result); auto topics use the smart-topic brain with pillar rotation; the runner exits NON-ZERO on permanent failure (GREEN == done=N failedPermanent=0); GHA actions pinned v5, node 22.
- **COACH PIPELINE PARITY (Phase 162, owner «مطلوب مسار الكوتش للتوليد يكون نفس مسار التوليد الالى دون تعطيل للتوليد الالى»):** `article_generate` rides the SAME paired pipeline as the automatic daily generation — the enqueue route dispatches `blog-post-{ar|en}.yml` via workflow_dispatch (`src/lib/blog-pipeline-dispatch.ts`, same `GITHUB_DISPATCH_TOKEN`, FAIL-OPEN) and the ai_jobs row becomes a dispatch RECEIPT (done + `pipelineDispatched` result; `blog_generation_queue` tracks the real work); an optional coach topic (≥10 chars — brief-sealable) rides inputs → `PIPELINE_TOPIC` → P0, which seals it into MY side of the shared brief (`withCoachTopic` — the twin keeps its researched topic; adopted/joined pairs ignore the override); the single-shot draft generator stays the FALLBACK on dispatch failure; the automatic cron slots, concurrency groups and one-article-per-day quota are UNTOUCHED — a dispatch only queues another run of the same workflow.
- **ARTICLE QUALITY FLOOR + ANTI-FORMULA (numbers corrected 2026-09-29, AUDIT_REPORT §9-0.4; floors aligned R4 2026-09-30, Execution-Path Audit):** the ASK is always the maximum bar — MAIN PIPELINE 1500-2500 words / 5-7 H2 sections (the 1100-1400 × 6-9 numbers describe the single-shot FALLBACK generator only), with EXECUTION floors ≥1000 at BOTH writing steps (1200 until 2026-10-02 — lowered to 1000 by owner order, Phase 323; `BLOG_EXECUTION_WORD_FLOOR`: P2 generation and P4 review reject short output at their own step — the 400-word parse nets let 419-1271-word drafts and review shrinkage (1201→752 measured) die at P5; the R1 repair loop covers any residual short class — the former 1200-1300 band vanished when both floors aligned at 1000) and the deterministic P5 publish floor ≥1000 (1300 until 2026-10-02 — same owner order, Phase 323); FAQ 4-7 ARTICLE-SPECIFIC questions persisted to faq_json (Phase 172, owner order «FAQ يخدم نية بحث المقال لا عدداً ثابتاً»; faq_json is lifted from the reviewed markdown's own FAQ section — never the niche-generic P0 set; the `splitFaqSection` lift accepts three LIFT-ONLY formats: `**bold**`, `### H3`, and R4's plain-text question line (≤25 words, ends ?/؟, never steals an answer's first line); Phase 176: the lift passes the DETERMINISTIC `filterFaqsByRelevance` gate ≥2 shared title/focus words — relevant-but-fewer beats padded-but-off-topic), 2-3 real internal links, distinct meta_title; floors are rejection NETS below the ask (never the target); each generation draws a random opening archetype; shallow drafts requeue; lowering any contract requires explicit owner approval in the same commit message.
- **ARABIC PURITY LAW (Phase 176 — owner report «التعديلات الجديدة اختفت مرة أخرى»):** AR articles carry ZERO bare Latin/English words inside Arabic prose — every term is Arabic or transliterated; the ONLY exceptions are parenthetical glosses after the Arabic term (مصل اللبن (Whey)) and brand names. Detection is DETERMINISTIC (`scanLatinContamination` in blog-msa.ts: gloss/link/image/whitelist-aware + the glued-token rule), enforced at P4 (targeted AI repair `repairArabicLatinContamination` + full validateMsaConversion re-gate) and P5 (final body gate fails the publish honestly; contaminated FAQ answers drop); the law text lives in AR_MSA_EDITOR_LAW / LANG_RULE.ar and the coach single-shot prompt (one law, three surfaces, no fork). The legacy cleanup runner's queue gate is dialect OR Latin, and its FAQ_HYGIENE=1 opt-in fixes faq_json (labels + relevance) deterministically. The P0 curated fallback pool is concept-tag diversified (15 topics/language, root-level freshness — no returning sleep/calorie concepts).
- **QUALITY-FIRST LAW — OWNER GENERAL CONDITION:** maximum quality for EVERYTHING is the site's primary goal: prompts, floors, and model order preserve-or-raise the ask; smaller models are last-resort fallbacks never promoted above stronger ones; resilience work (multi-bucket chains, cooldowns) increases AVAILABILITY of strong models, never substitutes weak output.
- **SEO-SLUG + IMAGE BUNDLE LAW:** every article_generate draft lands COMPLETE — model-produced English SEO slug (translates the MEANING, never transliterates; latin-only nets with the dated fallback as LAST net) + 3-5 ENGLISH image_queries resolved Pexels-first (images[0] = featured + cover_alt; images[1..] embedded at section boundaries); slug/image enrichment can NEVER fail the article (graceful degrade).
- **ONE-SLUG-LAW:** ALL slug logic lives ONLY in `src/lib/slug.ts` — canaries read the sources and FAIL THE BUILD if a local copy reappears; improvement tools are text transformers (copy-only panel); the M15 save gate remains the boundary verifier.
- **TOOL RESULTS UX LAWS (recovery · all-results · copy-vs-display · clear-failed · clear-persists · per-image-swap):** the editor AI-results panel is APPEND-ONLY (same tool twice = two cards) with DONE-job hydration (≤24h) + manual refresh; dismissed ids persist in localStorage (a clear that resurrects on navigation is broken); «نسخ» copies ONLY the paste-able deliverable; failed-row health alerts are dismissible via a JSON-only handler using the proven `.delete().in("id", ids)` shape; every standalone image block carries its own safe swap button replacing EXACTLY that occurrence through the same suggest-image pipeline.
- **CANARY PINNING POLICY (Phase 290 — ARCH-REMEDIATION, audit P2-3):** canaries pin BEHAVIOR and STRUCTURE first — exact cosmetic COUNTS only where the count is itself the law (image-safety v3, MSA purity, slug law, UI-wiring parity); a copy tweak must not require same-commit test edits (the Phase-286 chev 14→10 class), and a count whose only role is cosmetics should be asserted structurally (exists/ordered/once) instead of numerically. True regression pins are never weakened.
- **GUARD-COMMITMENT COROLLARY:** a guard that is not COMMITTED is not a guard — any script a workflow references must appear in the SAME commit.
- **PROJECT-WIDE PREVENTION LAW:** the recurring incident classes are permanently guarded — button → dead target (`check-ui-wiring.sh`), type without processor / orphan processor (CI + ai-jobs-visibility.test.ts exact parity), dishonest success (explicit non-zero exit paths in every runner), silent rot (`/api/ai/queue-health`). Feature DoD: button → route exists (CI), job → processor (CI), visible materialization, honest runner exit, docs in the SAME commit.
- **RATE-LIMIT RESILIENCE LAW:** free-tier 429s are TRANSIENT — retries must OUTLIVE the window, not re-burn it (70s sleep after a rate-limit requeue; heavy article calls walk the model chain — P1 2 · P2 3 since R3 2026-09-29 (the 480s budget funds the third entry, Groq re-admitted via the per-entry clamp) · P4 4 · latin-repair 3); back-to-back retries dying inside one TPM window are a runner bug, not provider fate.
- Never log the AI response in production paths (PII / partial reasoning); local fallbacks (`src/lib/ai-local.ts`) stay for graceful degradation; any change to the AI system prompt requires owner approval; EVO chat quota accounting stays server-side in the tamper-proof `evo_chat_usage` ledger (migration 0022) — never client-written rows again.

> **Deprecated (2026-08-27):** the previous note describing `callFreeOpenRouter()` / `callFreeOpenRouterLimited()` as one of the two canonical paths — those functions were removed as dead code and the documented trade-off now lives in `callFreeAIFallbackChain`.

---


---

> **تذكير قانوني ختامي:** هذا الملف مرجع تنظيمي منقول. عند أي تعارض بينه وبين الكود أو الميجريشنز أو `AGENTS.md`، يُعتمد الأعلى في هرم §12.8 (الكود أولًا)، ويُصحح هذا الملف في نفس الفريم وفق §3.8 (قانون تكافؤ التوثيق).
