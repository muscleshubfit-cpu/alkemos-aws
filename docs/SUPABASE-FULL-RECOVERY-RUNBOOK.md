# SUPABASE-FULL-RECOVERY-RUNBOOK.md — مسار استعادة قاعدة البيانات عند فقد مشروع Supabase بالكامل

> **الغرض (P1-5 + P0-4 + P0-3 من خطة التقوية):** الخطوات المرتبة لإعادة بناء قاعدة بيانات Alkemos كاملة على مشروع Supabase جديد، من المستودع + آخر نسخة احتياطية — بما فيها إعدادات Auth اللازمة (P0-4) ووضع Storage (P0-3).
> **متى تستخدم هذا الملف:** فقط عند فقدان/إتلاف مشروع Supabase (ref `wyopqryzfjifyeyvyxfy`) بالكامل — القاعدة لا تُمس (انظر قائمة الطوارئ في `docs/EMERGENCY-RECOVERY-AUDIT-2026-09-20.md` §11). **ملاحظة بنية (2026-11-06):** أصل الإنتاج منذ 2026-10-10 هو AWS Lightsail (انظر `docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md`)، ومتغيرات البيئة الحية على الخادم تُبذَر من أسرار GitHub بمهمة النشر — فأينما تُذكر خطوات «حدّث متغيرات Vercel» أدناه فالموضع الحالي المكافئ هو أسرار GitHub ثم إعادة نشر لتُزرع في ملف env الخادم.
> **المرجع الحاكم للترتيب والتصنيف:** `supabase/migrations/INDEX.md` (سجل الميجريشنز الملزم، محروس ببوابة `docs_parity.py`). عند أي تعارض بين هذا الـ runbook وINDEX.md — **INDEX.md هو الحاكم** ويُصحح هذا الملف فورًا.
> **قيود معلومة قبل البدء (مقيسة في التقرير §2.3):** كلمات المرور غير قابلة للنسخ تقنيًا (B5) — كل المستخدمين يمرون بـ«نسيت كلمة المرور» بعد الاستعادة الكاملة · ملفات Storage تُنسخ يوميًا 06:00 UTC منذ 2026-09-20 وتُستعاد بالقسم 5.1 (كانت B4 — أُغلق بأمر المالك) · الجلسات تُبطل جميعًا.

---

## 1. قبل أن تبدأ (قرارات ومستلزمات)

| # | المتطلب | التفصيل |
|---|---|---|
| 1 | قرار مالك صريح | إنشاء مشروع Supabase جديد استهلاك/كلفة (الخطة المجانية = مشروع واحد نشط غالبًا) — قرار خارجي بنيويًا |
| 2 | مشروع Supabase جديد | نفس المنطقة المفضلة **eu-central-1** (فرانكفورت — تطابق موقع الجمهور والـ edge الأوروبي) |
| 3 | آخر نسخة احتياطية | من المستودع الخاص `muscleshubfit-cpu/musclehubeg-backups` ▸ `snapshots/<أحدث-تاريخ>/` (تشغيل يومي 05:30 UTC — تحقق أن آخر نسخة عمرها < 25 ساعة قبل البدء) |
| 4 | مفاتيح المشروع الجديد | من لوحة المشروع الجديد: URL + anon + service_role (انظر `docs/RECOVERY-SECRETS-SOURCES.md` §2.4) |
| 5 | توكن وصول للمستودع الخاص | لاستنساخ النسخة (صلاحية قراءة على `musclehubeg-backups`) |

## 2. المرحلة 1 — إعادة بناء المخطط (Schema) من الـ migrations

**التصنيف المقيس (مولّد برمجيًا من نظام الملفات 2026-09-20 ومطابق لقانون التسمية في INDEX.md):**

| العائلة | العدد | من يطبقها على مشروع جديد |
|---|---|---|
| تلقائية: `0000_*.sql` + `YYYYMMDDHHMMSS_*.sql` | 41 | **تكامل GitHub في Supabase** فور ربط المستودع بفرع `main` |
| يدوية: `RUN_ON_SUPABASE_ORIGINAL_*.sql` (أصلية 0006–0023) | 18 | SQL Editor يدويًا بالترتيب |
| يدوية: `RUN_ON_SUPABASE_*.sql` (الباقي) | 41 | SQL Editor يدويًا بالترتيب |
| تحقق قراءة فقط: `VERIFY_*.sql` | 2 | اختيارية — للفحص لا للتطبيق |

**الخطوات:**

1. اربط تكامل GitHub: Supabase ▸ Project ▸ Integrations ▸ GitHub ▸ اختر `muscleshubfit-cpu/alkemos` ▸ فرع `main`. ستنطلق الميجريشنز التلقائية الـ41 بالترتيب الزمني للاسم.
2. راقب سجل الميجريشنز حتى اكتمال آخر ملف تلقائي (لا تُنفّذ اليدوية قبل اكتمال التلقائية — منها ميجريشنز تعتمد على هياكل أوجدها التكامل).
3. نفّذ المسار اليدوي بالترتيب الحرفي التالي من SQL Editor (شغّل ملفًا واحدًا في المرة وانتظر نجاحه):

```
RUN_ON_SUPABASE_ORIGINAL_0006_tool_leads.sql
RUN_ON_SUPABASE_ORIGINAL_0007_saved_results.sql
RUN_ON_SUPABASE_ORIGINAL_0008_meal_plans.sql
RUN_ON_SUPABASE_ORIGINAL_0009_water_tracker_constraint.sql
RUN_ON_SUPABASE_ORIGINAL_0010_subscription_requests.sql
RUN_ON_SUPABASE_ORIGINAL_0011_multi_subscriptions.sql
RUN_ON_SUPABASE_ORIGINAL_0012_rename_price_egp_to_price_usd.sql
RUN_ON_SUPABASE_ORIGINAL_0013_blog_posts_author_default_musclehub.sql
RUN_ON_SUPABASE_ORIGINAL_0014_add_blog_posts_source.sql
RUN_ON_SUPABASE_ORIGINAL_0015_affiliate_engine.sql        ← راجع ملاحظة 0015 في INDEX.md (لم يُطبق إطلاقًا تاريخيًا — 0057 هو الأساس الحي)
RUN_ON_SUPABASE_ORIGINAL_0016_add_paypal_to_payment_method.sql
RUN_ON_SUPABASE_ORIGINAL_0017_security_rls_hardening.sql  ← بديلها المدمج: RUN_ON_SUPABASE_SECURITY_0017_0018.sql
RUN_ON_SUPABASE_ORIGINAL_0018_extend_subscription.sql     ← (اختر أحد الصيغين وفق خريطة INDEX.md — لا الاثنان معًا)
RUN_ON_SUPABASE_ORIGINAL_0019_audit_log.sql               ← بديلها المدمج: RUN_ON_SUPABASE_0019_0020.sql
RUN_ON_SUPABASE_ORIGINAL_0020_coach_client_list_rpc.sql   ← (نفس القاعدة: صيغة واحدة فقط)
RUN_ON_SUPABASE_ORIGINAL_0021_blog_queue_topic_ar.sql     ← بديلها: RUN_ON_SUPABASE_0021_0022.sql
RUN_ON_SUPABASE_ORIGINAL_0022_evo_chat_usage.sql
RUN_ON_SUPABASE_ORIGINAL_0023_pipeline_v2_statuses.sql    ← بديلها: RUN_ON_SUPABASE_0023.sql
RUN_ON_SUPABASE_0024.sql
RUN_ON_SUPABASE_0026_LANG_SPLIT.sql
RUN_ON_SUPABASE_0027_STORAGE_BUCKETS.sql                  ← ينشئ الـ Buckets الثلاثة الخاصة (انظر §5)
RUN_ON_SUPABASE_0028_EVO_ANON_USAGE.sql
RUN_ON_SUPABASE_0029B_ADMIN_ROLE.sql                      ← النسخة الفعالة الموثقة (0029A و 0029_ADMIN_ROLE_ALL_IN_ONE بدائل تاريخية — لا تُنفذ جميعها)
RUN_ON_SUPABASE_0030A_MULTI_COACH_SCHEMA.sql
RUN_ON_SUPABASE_0030B_MULTI_COACH_CLIENT_RLS.sql
RUN_ON_SUPABASE_0030C_MULTI_COACH_ADMIN_RLS_NOTIFS.sql
RUN_ON_SUPABASE_0030D_MULTI_COACH_RPC_RELOAD.sql          ← (0030_MULTI_COACH.sql النسخة الشاملة الأصلية — بديل للمجموعة A–D: اختر مجموعة واحدة وفق INDEX.md)
RUN_ON_SUPABASE_0031_COACH_PAGES.sql
RUN_ON_SUPABASE_0032_COACH_PAGES_I18N.sql
RUN_ON_SUPABASE_0033_CLIENT_ATTRIBUTION.sql
RUN_ON_SUPABASE_0034_COACH_ACTIVATION.sql
RUN_ON_SUPABASE_0035_COACH_WALLET.sql
RUN_ON_SUPABASE_0036_HARDEN_SIGNUP_ROLE.sql
RUN_ON_SUPABASE_0037_COACH_BOOST.sql                      ← ينشئ bucket ‏coach-public العام (انظر §5)
RUN_ON_SUPABASE_0038_GLOBAL_USD.sql
RUN_ON_SUPABASE_0039_SIGNUP_DIAGNOSTIC.sql
RUN_ON_SUPABASE_0040_SIGNUP_HOTFIX.sql
RUN_ON_SUPABASE_0041_COACH_CLIENT_BOUNDARY.sql
RUN_ON_SUPABASE_0042_EXTEND_SUBSCRIPTION_EVIDENCE_GATE.sql
RUN_ON_SUPABASE_0043_PAYMENTS_ADMIN_ONLY.sql
RUN_ON_SUPABASE_0044_SR_POLICY_SWEEP.sql
RUN_ON_SUPABASE_0045_COACHING_PRODUCT_FIX_TEST_ACCOUNTS.sql
RUN_ON_SUPABASE_0046_COACH_PAGE_REVIEW.sql
RUN_ON_SUPABASE_0047_CLIENT_LIST_PAGED.sql
RUN_ON_SUPABASE_0048_COACH_PAGES_RLS_REVIEW.sql
RUN_ON_SUPABASE_0049_COACH_CERTIFICATES.sql
RUN_ON_SUPABASE_0050_TEST_ADMIN_ACCOUNT.sql               ← حساب أدمن تجريبي — يُلغى لاحقًا بـ 0066 (كلاهما موثق في INDEX.md)
RUN_ON_SUPABASE_0054_REPAIR_MIGRATION_LEDGER.sql
RUN_ON_SUPABASE_0055_RESTORE_SECURITY_GUARDS.sql
RUN_ON_SUPABASE_0059_TOOL_LEADS_NAME_TYPE_NEWSLETTER.sql
RUN_ON_SUPABASE_0066_DELETE_TEST_ADMIN_ACCOUNT.sql
```

**ملحوظات إلزامية على القائمة:**
- الملفان `RUN_ON_SUPABASE_PURGE_BLOG_CONTENT.sql` و`RUN_ON_SUPABASE_SECURITY_0017_0018.sql` عمليات تاريخية مشروطة (تنقية محتوى / زوج بديل) — **لا تنفذها على مشروع جديد** إلا بقرار مالك موثق وقراءة صفّيهما في INDEX.md أولًا.
- ملفات `VERIFY_*.sql` قراءة فقط — استخدمها للفحص بعد الاستعادة لا قبلها.
- **إعادة تحميل مخطط PostgREST إلزامية بعد آخر ميجريشن يدوي** (TECH_REFERENCE §4.4): من SQL Editor نفّذ `NOTIFY pgrst, 'reload schema';` — وإلا ظلت الواجهة الخدمية ترى الهياكل القديمة.
- بعد اكتمال المسارين: شغّل محليًا `python3 scripts/migration_audit.py --ci` (تماثل الميجريشنز مع `src/lib/supabase/types.ts`) — أخضر = الهيكل مطابق للمرآة الحية.

## 3. المرحلة 2 — استعادة البيانات من آخر نسخة

```bash
# 1) استنسخ مستودع النسخ (قراءة فقط) وحدد أحدث لقطة:
git clone https://github.com/muscleshubfit-cpu/musclehubeg-backups.git /tmp/backups
ls /tmp/backups/snapshots/            # اختر أحدث تاريخ

# 2) تشغيل تجريبي أولًا (dry-run — لا يكتب شيئًا إطلاقًا):
SUPABASE_URL=https://<المشروع-الجديد>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<مفتاح-المشروع-الجديد> \
  node scripts/db-restore.mjs /tmp/backups/snapshots/<أحدث-تاريخ>

# 3) عند نجاح الجاف وطابق العدادات المتوقعة (انظر manifest.json داخل اللقطة) — التطبيق الفعلي:
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/db-restore.mjs /tmp/backups/snapshots/<أحدث-تاريخ> --apply
```

- السكربت ينفذ UPSERT بجولتين لحل الاعتماديات المرجعية، ولا يحذف صفًا أبدًا (`scripts/db-restore.mjs`).
- **وجه السكربت للمشروع الجديد فقط** — راجع متغيرَي البيئة مرتين قبل `--apply`.
- العدّادات المرجعية لآخر لقطة موثقة في تقرير التدقيق §2.2 (مثال 2026-09-20: 53 جدولًا · 1121 صفًا · 28 مستخدم auth).

## 4. المرحلة 3 — إعدادات Auth (من لوحة التحكم — P0-4)

> القيم **الوصفية** المقيسة حيًّا في التقرير §6.3. أعد إدخالها على المشروع الجديد من اللوحة (Authentication ▸ Settings / Providers):

| الإعداد | القيمة المطلوبة | مصدر القيمة |
|---|---|---|
| Site URL | `https://alkemos.com` | ثابتة (الدومين الرسمي) |
| Email provider | مفعل | إعداد افتراضي + التحقق |
| **Google OAuth** | مفعل + Client ID/Secret | Google Cloud Console (نفس تطبيق الإنتاج — Authorized JavaScript origins ومواقع إعادة التوجيه تُحدَّث لعنوان المشروع) |
| **SMTP مخصص (Brevo)** | مضبوط (Host/User/Pass/Sender) | حساب Brevo — نفس بيانات مرحلة DNS الموثقة في التقرير §7.1 (سجلات `brevo1/2._domainkey` موجودة أصلًا في Cloudflare ولا تلمس) |
| Confirm email | `autoconfirm = OFF` | النمط المعتمد: التأكيد التلقائي يجري **بالتريغر الكودي** في ميجريشن 0074 (يُستعاد تلقائيًا مع المسار التلقائي) — لا تفعّل autoconfirm من اللوحة |
| Signup | مفتوح (`disable_signup = OFF`) | الإعداد الحي |
| كلمات المرور | غير قابلة للاستعادة (B5) | أعلن للمستخدمين مسار «نسيت كلمة المرور» بعد الاستعادة — 28 مستخدمًا آخر قياس |

## 5. المرحلة 4 — Storage (من P0-3)

**الحاويات (Buckets) — الحقيقة الحية المقاسة أول مرة بالجرد الآلي 2026-09-20 (9 حاويات، وليست 4 كما في الميجريشنز فقط) + باكت `avatars` من ميجريشن 0090 (نفس اليوم) = 10:**

| Bucket | النوع (حي مقيسًا) | تعريفه الموثق | طريقة الوصول الكودية |
|---|---|---|---|
| `questionnaire-photos` | **خاص ✓ (أُغلق بميجريشن 0091، 2026-09-20 — كان عامًا انحرافًا عن 0027 منذ ولادة الباكت قبله؛ الفاصل: باكت `avatars` من 0090)** | `RUN_ON_SUPABASE_0027_STORAGE_BUCKETS.sql` + `20260920173000_0091_qphotos_private.sql` (5MB، صور) | رفع `/api/upload` + قراءة `/api/file` (الاسم في قائمتي allowlist) — الأفاتار القديم الوحيد أعيدت كتابته لصيغة `/api/file` بنفس 0091 |
| `progress-photos` | خاص (يطابق 0027) | نفس الملف 0027 | نفس النمط |
| `receipts` | خاص (يطابق 0027) | نفس الملف 0027 (يقبل PDF) | نفس النمط |
| `coach-public` | عام (يطابق 0037) | `RUN_ON_SUPABASE_0037_COACH_BOOST.sql` | قراءة عامة `/storage/v1/object/public/coach-public/…` |
| `avatars` | عام (0090 — فصل الأفاتار 1/2، 2026-09-20) | `20260920171500_0090_storage_avatars_bucket.sql` | رفع متصفحي من `/profile` + قراءة عامة `/storage/v1/object/public/avatars/…` |
| `meal-plans` | خاص | **غير معرّف في أي ميجريشن — حاوية ليجاسي حية** | مسار كودي ميت واحد (PlansView §5.2) |
| `plan-pdfs` | خاص | غير معرّف — ليجاسي حي | لا مسار كودي إطلاقًا |
| `qr-codes` | **عام** | غير معرّف — ليجاسي حي | لا مسار كودي إطلاقًا |
| `ticket-attachments` | خاص | غير معرّف — ليجاسي حي | لا مسار كودي إطلاقًا (لا عمود مرفقات في جداول التذاكر) |
| `workout-plans` | خاص | غير معرّف — ليجاسي حي | مسار كودي ميت واحد (PlansView §5.2) |

- على مشروع جديد: تعريف الحاويات الخمس الموثقة يأتي من المسارين أعلاه (0027 + 0037) + ميجريشن 0090 الآلي (`avatars`) — **الحاويات الليجاسي الخمس لن تُنشأ تلقائيًا** (لا ميجريشن لها) وهي اليوم فارغة بالكامل (0 كائنات — مقيس حيًا 2026-09-20 على مستوى storage.objects) فلا محتوى مفقود بغيابها.
- مصدر الحقيقة الدائم للأعداد والأحجام: `storage-inventory/YYYY-MM-DD/` في المستودع الخاص (جرد يومي metadata-only).

### 5.1 نسخ الملفات الفعلية (P0-3(ج) — منفّذ بأمر المالك 2026-09-20)

- **الآلية:** `scripts/storage-backup.mjs` + `.github/workflows/storage-backup.yml` — يوميًا 06:00 UTC (بعد نسخة 05:30 والجرد 05:45) يُنزّل **كل كائن في كل الباكتات العشر** مع بصمة sha256 لكل ملف إلى `storage-backups/YYYY-MM-DD/` في المستودع الخاص (manifest + الملفات بمساراتها الأصلية — المسارات تضم معرفات المستخدمين لهذا تبقى في الخاص حصرًا). القياس الأول الموثق: **10 باكتات / 24 كائنًا / 4,738,252 بايت / failed=0**.
- **التحقق من السلامة:** كل تنزيل يهضم sha256 ويقارن الحجم مقابل ميتاداتا الـ API؛ أي فشل واحد يفشل الـ workflow بصوت عالٍ (قانون B3) — لا يُرفع نسخ جزئي أبدًا. سقوف أمان عالية الصوت: 20,000 كائن / 1 GiB.
- **الاستعادة:** `scripts/storage-restore.mjs <backupDir>` — افتراضيًا dry-run يتحقق من سلامة كل ملف على القرص مقابل بصمات الـ manifest ويحدد الباكتات الناقصة في المشروع الهدف؛ `--execute --confirm-original` للاستعادة الحقيقية على مشروع جديد (يرفض انطلاقًا إن نقصت أي باكت — تعريفاتها من الميجريشنز أعلاه، وupsert بنفس المسارات)؛ `--execute --into-bucket restore-drill-* --create-bucket` للتدريب (بند الإثبات أدناه).
- **الإثبات (Drill #2):** `.github/workflows/storage-restore-drill.yml` (تشغيل يدوي فقط) — استعادة كاملة إلى باكت مؤقتة `restore-drill-<run>` خاصة + قراءة كل كائن راجعًا ومطابقة sha256 حرفيًا + حذف الباكت المؤقتة في نفس التشغيل (`if: always()`). التنفيذ الأول موثق حرفيًا في `docs/RECOVERY-DRILL-2-STORAGE-REPORT-2026-09-20.md` (رفع 24/24 · تحقق راجع sha256 24/24 · تنظيف كامل · الإنتاج سليم).
- **حدود معلومة (ما زالت قائمة من B4):** النافذة الزمنية — ملف رُفع بعد آخر نسخة يومية (06:00 UTC) وفُقد قبل التي تليها يُفقد؛ لا نسخ للـ buckets definitions خارج المانيفست (الميجريشنز هي المصدر) ولا لميتاداتا خارج المسار/الحجم/النوع/البصمة.

### 5.2 مصير الحاويات الليجاسي الخمس (أمر المالك 2026-09-20 مساءً — تحقيق بالأدلة، لا حذف)

**الأدلة المُقاسة حيًا 2026-09-20 (قراءة فقط):** الخمس وُلدت دفعة واحدة 2026-08-02 قبل عصر الميجريشنز · **صفر كائنات في كلها** (مستوى `storage.objects` لا جرد الـ API فقط) · **صفر سياسات RLS** (0071 أسقط سياسة الليجاسي العلنية ولم تنشئ لها بديلة — الوصول الفعلي service-role حصرًا) · **صفر إشارات في قاعدة البيانات**: مسح 88 عمودًا نصيًا/jsonb في كل جداول public عن مسارات أي من الخمس = صفر صف · **`plans.file_url` = NULL في كل الصفوف الـ14 الحية**.

| الباكت | المرجع الكودي الوحيد | لماذا هو ميت | المصير الموصى به |
|---|---|---|---|
| `meal-plans` | `PlansView.tsx` openFile (زر يظهر فقط عند وجود `plan.file_url` — وهو NULL 14/14) | الزر غير قابل للظهور بالبيانات الحية؛ ولو ظهر لفشل `createSignedUrl` المتصفحي (لا سياسات على الباكت) | **حذف آمن بصفر فقد بيانات** بقرار مالك (فراغة 0 كائنات + صفر مراجع DB) |
| `workout-plans` | نفس المسار (نفس الزر، النصف الآخر) | نفسه | نفسه |
| `plan-pdfs` | لا شيء إطلاقًا في `src/` | وُلدت لفكرة PDF خطط لم تُنفذ | نفسه |
| `qr-codes` | لا شيء إطلاقًا | الوحيدة **العامة** من الخمس وبلا حدود mime — سطح تعرض بلا وظيفة | **مرشح الحذف الأول** (الوحيدة ذات أثر أمني موجب بالحذف) |
| `ticket-attachments` | لا شيء إطلاقًا (جداول `support_tickets`/`ticket_messages` بلا أي عمود مرفقات) | وُلدت لنظام تذاكر لم يستخدم المرفقات | نفسه |

**القرار:** لا حذف بلا أمر مالك صريح (قاعدة الأمر الحاكمة). عند قرار الحذف القناة القانونية ميجريشن واحد idempotent يسقط صفوف الخمس من `storage.buckets` (فارغة فلا كائنات تُسقط معها) + صف INDEX.md + تحديث هذا الجدول بنفس الفريم؛ والبديل المحايد: إبقاؤها (خاملة تمامًا، والنسخة اليومية الجديدة تغطيها بالتصميم — لو دخلتها ملفات يومًا دخلت النسخة تلقائيًا).

**إرشاد المالك للحذف (§12.9):** عند موافقتك: أبلغ الوكيل «احذف الحاويات الليجاسي الخمس» فيُنفذ ميجريشن الحذف بالقناة الآلية المعتادة (Supabase Preview يحرسه قبل الإنتاج) — لا خطوة واجهة يدوية مطلوبة. التراجع المستحيل محدود بالفراغ: إعادة إنشاء باكت فارغة سطر SQL واحد موثق في هذا الجدول.

## 6. المرحلة 5 — الفحص بعد الاستعادة (بترتيب الأولوية)

1. `NOTIFY pgrst, 'reload schema';` ثم فحص جدولين حرجين من Dashboard ▸ Table Editor: `profiles` و`subscriptions` (وجود الصفوف بعد الاستعادة).
2. تسجيل دخول تجريبي عبر «نسيت كلمة المرور» (يختبر: auth + SMTP/Brevo + جدول profiles + قوالب البريد).
3. تشغيل `python3 scripts/migration_audit.py --ci` محليًا (تماثل المخطط).
4. فحص RLS: من SQL Editor — `SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' ORDER BY tablename;` (مقارنة سريعة العدد مع المرآة في `src/lib/supabase/types.ts` / INDEX.md).
5. استدعاء `/api/build-info` على بيئة Vercel المربوطة بالمشروع الجديد + اختبار مسار EVO وأداة عامة واحدة.
6. **استعادة ملفات Storage:** استنساخ المستودع الخاص ثم `node scripts/storage-restore.mjs musclehubeg-backups/storage-backups/<أحدث تاريخ> --execute --confirm-original` (بعد إنشاء الباكتات من الميجريشنز — القسم 5 أعلاه) ثم التحقق من صورة أفاتار وصورة مدرب واحدة من الواجهة.
7. تحديث متغيرات Supabase في Vercel (URL + anon + service_role) إن تغير ref المشروع — من `docs/RECOVERY-SECRETS-SOURCES.md` §2.4.

## 7. ما لا يفعله هذا الـ runbook

- لا يُنفَّذ آليًا ولا بلا قرار مالك (كلفة/موارد المشروع الجديد).
- لا يستعيد كلمات المرور (مستحيل تقنيًا) ولا بيانات Vercel Analytics — ملفات Storage صارت قابلة للاستعادة من نسخة 06:00 UTC اليومية (القسم 5.1).
- لا يلمس Cloudflare/DNS إطلاقًا (خارج سيناريوه — راجع التقرير §7).
- عند أي تعارض مع `INDEX.md` أو سلوك الكود: الواقع الحاكم يُوثَّق ويُصحح هذا الملف في نفس الفريم (§3.8).
