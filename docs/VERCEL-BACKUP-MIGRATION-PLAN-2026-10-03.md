# VERCEL-BACKUP-MIGRATION-PLAN-2026-10-03.md — خطة النسخة الاحتياطية على حساب Vercel الجديد

> **المصدر:** أمر المالك 2026-10-03 «ابدأ الآن بمرحلة Audit + تجهيز خطة تنفيذ النسخة الاحتياطية فقط» — Phase-aware ID: `VERCEL-BACKUP-MIGRATION-PLAN-2026-10-03` (worklog.md).
> **النطاق الحاكم:** نسخة احتياطية **قابلة للتشغيل والتحقق فقط** — **ليس** نقل Production. لا DNS cutover · لا فصل دومين · لا حذف/تعديل للحساب القديم · لا تدوير أو حذف Secrets · لا تغيير Cloudflare/Supabase/GitHub · **لا تنفيذ لأي خطوة من هذه الخطة دون أمر مالك لاحق**.
> **قانون الأسرار (§7 + `docs/RECOVERY-SECRETS-SOURCES.md`):** هذا الملف يحمل أسماء ومصادر فقط — **صفر قيم**. أي متغير مستقبلي يُضاف للنسخة يوثَّق مصدره في `RECOVERY-SECRETS-SOURCES.md` بنفس الفريم.
> **المرجعية عند التعارض:** الواقع المقيس عبر API في تاريخ هذا الفريم هو الحاكم (ملاحظة B9 مثالًا: `serverlessFunctionRegion` في API يعرض `iad1` بينما `vercel.json` هو المرجع الحاكم `fra1`).
> **سجل التنفيذ:** البند §8-2 (نقل متغيرات البيئة القابلة للقراءة آليًا) نُفّذ بأمر المالك 2026-10-03 «نفّذ الآن فقط البندين» — سجل التنفيذ والتحقق في §12. كل خطوة أخرى في هذه الخطة ما زالت تنتظر أمر مالك.
> **تحديث فريم COLD-STANDBY-AUDIT-2026-10-05 (أمر المالك «اعتماد Cold Standby / §6-B»):** المسار المعتمد صار §6-B (النسخة الباردة) بدل §6-A، **ونُفّذ فورًا على مرحلتين مقوستين** (فصل Git repository من المشروع الاحتياطي هو الآلية الحاسمة — §13.2). حالة العزل المثالية الموثقة في §2 انكسرت جزئيًا بين 10-04 و10-05 (نشرات Production + crons مزدوجة — الاكتشاف والقياس §13.1) · audit كامل للمتغيرات/الأسرار/التخزين موثق (§13.3–§13.5) · **كل حذف أو تغيير حساس ينتظر أمر مالك** (§13.6).

---

## 1. الوضع الحالي — Production (الحساب القديم، لا يُمس)

| البند | الحالة المقيسة (2026-10-03) |
|---|---|
| الحساب/الفريق | `muscleshubfit` · فريق `muscleshubfit-2941s-projects` (vercel.com/muscleshubfit-2941s-projects) · **خطة Hobby** (مؤكد من metadata النشر) |
| المشروع | `alkemos` · مربوط بـ GitHub App على `muscleshubfit-cpu/alkemos` · Production Branch: `main` · Node 24.x · framework `nextjs` |
| آخر نشر Production جاهز | `4cf5c4bc` (READY · PROMOTED) يحمل كل الأسماء: `alkemos.com` · `www.alkemos.com` (301) · `musclehubeg.vercel.app` (301) · الأسماء التلقائية للفريق |
| Crons (من `vercel.json` — المرجع الوحيد) | `/api/cron/progress-reminder` أحدًا 07:00 UTC · `/api/cron/dispatch-pipelines` يوميًا 23:40 UTC |
| الإعدادات المميزة | Web Analytics **مفعّل** · Speed Insights **معطّل** · gitForkProtection · OIDC مفعّل (غير مستخدم كوديًا) · لا Deploy Hooks · `ignoreCommand` + `[vercel skip]` يعملان (شاهد: آخر docs-commit أنتج نشرًا CANCELED بلا خدمة) |
| DNS/Cloudflare (zone-level — تبقى كما هي) | A `alkemos.com` → `76.76.21.21` (proxied) · CNAME `www` → `cname.vercel-dns.com` (proxied) — **كلاهما Vercel-generic لا يعتمد على حساب** · 3 قواعد كاش + قاعدة زواحف اجتماعية + BLOCKLIST-1 · SSL Full(strict) · MX Zoho + DKIM Brevo + SPF/DMARC |
| Supabase (لا يتغير) | مشروع واحد `wyopqryzfjifyeyvyxfy` (eu-central-1) · site_url `alkemos.com` · SMTP Brevo · redirect_allow_list يتضمن نمط `alkemos-*-muscleshubfit-2941s-projects.vercel.app/**` (مرتبط بفريق **القديم**) |
| GitHub Actions | 25 workflow نشطة · 15 سرًا · متغير واحد `SITE_URL` · الاعتماد الوحيد على Vercel القديم: سر `VERCEL_TOKEN` (توكن project-scoped يخدم `vercel-cleanup`) |

## 2. ما تم تجهيزه بالفعل — الحساب الجديد (فحص قراءة فقط عبر API)

تم بيد المالك قبل هذا الفريم، وتأكد قياسًا:

- حساب Vercel جديد (username `alkemos`) + فريق **`aalkemos`** (vercel.com/aalkemos) — الدور OWNER.
- مشروع **`alkemos`** جديد: framework `nextjs` (مكتشف تلقائيًا) · **Node 24.x مضبوط أصلًا** · `gitForkProtection` مفعّل · OIDC مفعّل (الوضع الافتراضي).
- **Git integration مربوط**: org `muscleshubfit-cpu` · repo `alkemos` · **Production Branch: `main`** · `gitProviderOptions.createDeployments: enabled` (الدفع إلى main سينشر تلقائيًا ما لم تُطبق آلية §6).
- Build/PM settings: `vercel.json` في المستودع هو المرجع (`next build` · `bun install` · regions `fra1` · headers · ignoreCommand) — لا يحتاج أي ضبط يدوي إضافي.
- **الحالة الحالية المثالية للعزل**: صفر deployments جاهزة (`targets: {}` — النشر الوحيد CANCELED من دفعة docs) · متغيرات البيئة: **نُقل 29/29 مدخلًا قابلًا للقراءة آليًا (§12) وبقيت 8 يدوية (MANUAL_REQUIRED — §12.2)** · صفر crons مسجلة (endpoint يرد not_found) · **لا integrations مثبتة على الفريق الجديد** (واجهة Vercel تعرض اقتراح ربط Supabase — **لا تُفعّل**؛ انظر §3-B7).
- نطاق المشروع التلقائي: `alkemos.vercel.app` (متاح ومحجوز للمشروع الجديد) · لا نطاقات مخصصة · لا team domains.

> **تحديث 2026-10-05 (قياس §13.1):** حالة «العزل المثالي» أعلاه كانت صحيحة يوم 10-03 فقط — بين 10-04 07:32 و22:05 UTC رُصدت **15 نشرة** كلها من GitHub App (منها 5 Production جاهزة من main) وسُجّلت الـ crons في الاحتياطي، وصار `alkemos.vercel.app` يقدم نسخة حية **علنية** بنفس commit الإنتاج (00e37ba8 — مقيس HTTP 200). عُولج المصدر (النشر التلقائي من Git) بـ §6-B/§13.2؛ الـ crons المسجلة والنشرات القائمة تنتظر قرار المالك (§13.5/§13.6).

## 3. ما ينقص قبل أن تصبح النسخة قابلة للتشغيل والتحقق

| # | البند | التفصيل |
|---|---|---|
| A1 | **Environment Variables** (الجدول §4) | **منفّذ جزئيًا 2026-10-03 (§12)**: 29/29 مدخلًا قابلًا للقراءة نُقل آليًا بنفس الأسماء/الأهداف/الأنواع وتحقق قيم 29/29 (فك تشفير من الجديد نفسه ومقارنة). الباقي: 8 قيم Sensitive يدوية (§12.2). **شرط البناء**: `NEXT_PUBLIC_*` تُدمج وقت البناء — أول نشر كامل الميزات ينتظر الإدخال اليدوي لـ `NEXT_PUBLIC_PAYPAL_CLIENT_ID` و`NEXT_PUBLIC_ADSENSE_CLIENT` (GA وSupabase العام نُقلا آليًا) |
| A2 | **إستراتيجية منع نشر Production تلقائيًا** | مع `createDeployments: enabled` + Production Branch `main`: أول دفعة كود إلى main تنشئ أول Production Deployment في الحساب الجديد → **تسجيل الـ crons → خطر التشغيل المزدوج** (التفصيل والحل في §6) — **منفّذ 2026-10-05 بصيغة §6-B** (فصل Git link من المشروع + createDeployments=disabled كتحصين ثانوي — مقيس §13.2)؛ لكن الخطر تحقق قبل التنفيذ: الـ crons مسجلة نشطة منذ 10-04 07:26 UTC (§13.1) ومعالجتها تنتظر أمر المالك (§13.5/§13.6) |
| A3 | **أول Preview Deployment + بطارية تحقق** | §7 — لم يحدث أي نشر بعد |
| A4 | **Web Analytics** | غير مفعّل في المشروع الجديد (بيانات التحليلات لا تنتقل — تبدأ من صفر عند التفعيل؛ يُوصى بها وقت cutover لا قبله) |
| A5 | **مؤشر استخدام الحساب الجديد** | النسخ الاحتياطية اليومية تتراكم (Hobby 10GB · ~350MB/نشر · انتهاء تلقائي 30 يومًا + الاحتفاظ بـ10) — يُراقب ولا يُعدّل شيء الآن — **مقيس 10-05: تجاوز فعلي (10.62/10GB) ب11 نشرًا جاهزًا متراكمًا خلال يوم واحد بلا أي منظّف يستهدف الاحتياطي** (السبب وقائمة التنظيف الآمنة §13.5 — بانتظار أمر مالك) |
| B1 | **قيم PayPal اليدوية** | `PAYPAL_CLIENT_ID` · `PAYPAL_CLIENT_SECRET` · `PAYPAL_WEBHOOK_ID` · `PAYPAL_MODE` · `NEXT_PUBLIC_PAYPAL_CLIENT_ID` — من لوحة PayPal Developer (مصادرها في `RECOVERY-SECRETS-SOURCES.md` §2.2) |
| B2 | **قيمة AdSense اليدوية** | `NEXT_PUBLIC_ADSENSE_CLIENT` — من لوحة AdSense |
| B3 | (مؤجل بقرار المالك — **لا يُنفذ الآن**) تحديث `redirect_allow_list` في Supabase | إضافة نمط الفريق الجديد `https://alkemos-*-aalkemos.vercel.app/**` (+ `https://alkemos.vercel.app/**`) — شرط اختبار auth على preview؛ Production غير متأثر |
| B4 | (وقت cutover مستقبلًا) استبدال سر `VERCEL_TOKEN` في GitHub | بتوكن جديد من الحساب الجديد (project-scoped يكفي) — **لا يُلمس الآن** وإلا فقد `vercel-cleanup` هدفه (المشروع القديم) |
| B5 | (توصية مالك) فحص انتهاء `BACKUP_REPO_TOKEN` | الإجراء اليدوي الموثق في `RECOVERY-SECRETS-SOURCES.md` §4 — خارج نطاق هذه الخطة |
| B6 | **عدم تفعيل تكامل Vercel↔Supabase** | Production الحالي لا يستخدمه (env vars فقط). أي «ربط مباشر» من واجهة Vercel قد يقدم إنشاء مشروع Supabase جديد — **ممنوع**؛ النسخة تستهدف نفس المشروع `wyopqryzfjifyeyvyxfy` عبر env vars فقط |
| B7 | **عدم ضبط متغيرات اختيارية غير مضبوطة أصلًا** | `UNSPLASH_ACCESS_KEY` · `PIXABAY_API_KEY` (مصادر failover اختيارية) · `COACH_EMAILS` (للكود افتراضي معلوم) · `NEXT_PUBLIC_APP_URL` · `AI_PROVIDER/AI_MODEL/AI_BASE_URL` · `LATIN_REPAIR_LEGACY` · `GROQ_MAX_TOKENS_CLAMP` (أذرع rollback فارغة) — تركها فارغة = نفس سلوك Production الحرفي |

## 4. جدول Environment Variables المصنّف (أسماء فقط — صفر قيم)

> الأهداف (targets) في العمود تعكس ضبط **المشروع القديم** بالضبط — النسخة تعيد إنتاجها كما هي (production/preview/development).

### 4.1 قابلة للنقل آليًا (غير مصنفة Sensitive — قابلة للقراءة عبر API بفك تشفير per-env، أو لها نسخة في GitHub Actions Secrets)

`NEXT_PUBLIC_SUPABASE_URL` (prod+preview+dev) · `NEXT_PUBLIC_SUPABASE_ANON_KEY` (prod+preview+dev) · `SUPABASE_SERVICE_ROLE_KEY` (prod+preview+dev) · `SUPABASE_URL` (prod — alias يعرفه سكربتات التشغيل) · `CRON_SECRET` (prod+preview+dev) · `PEXELS_API_KEY` (prod+preview+dev) · `OPENROUTER_API` + `OPENROUTER_API_KEY` (prod+preview) · `GROQ_API_KEY` (prod+preview) · `NVIDIA_API_KEY` (prod) · `BREVO_API_KEY` (prod) · `EMAIL_FROM` · `EMAIL_REPLY_TO` (prod) · `GITHUB_DISPATCH_TOKEN` (prod) · `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (prod+preview) · `NEXT_PUBLIC_GA_ID` (prod) · `EVO_CRON_SECRET` · `EVO_FOLLOWUP_ENABLED` · `EVO_FOLLOWUP_FROM` (prod) · `NEXT_PUBLIC_SITE_URL` (prod+preview — قيمة ظاهرة غير سرية: `https://alkemos.com`)

**مسارات النقل المشروعة (كلها بأمر مالك لاحق):** (أ) نسخ يدوي من لوحة المشروع القديم (القيم ظاهرة في الواجهة) — الأسرع والأبسط؛ (ب) سير عمل مؤقت في GitHub Actions يقرأ الأسرار ويعيد بذرها في المشروع الجديد عبر API دون أن تراها عين بشرية (النمط الموثق في `RECOVERY-SECRETS-SOURCES.md` §1-2)؛ (ج) مفاتيح Supabase كلها قابلة لإعادة الجلب من لوحة المشروع نفسه أو Management API.

### 4.2 تحتاج إدخالًا يدويًا (مصنفة Sensitive في Vercel — **لا يمكن قراءتها عبر API إطلاقًا**)

`PAYPAL_CLIENT_ID` · `PAYPAL_CLIENT_SECRET` · `PAYPAL_WEBHOOK_ID` · `PAYPAL_MODE` · `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (جميعها prod+preview) · `NEXT_PUBLIC_ADSENSE_CLIENT` (prod+preview)

> المصادر الدقيقة لكل قيمة: `docs/RECOVERY-SECRETS-SOURCES.md` §2.2 (لوحات PayPal Developer وAdSense). **Webhook URL في PayPal مرتبط بالدومين `alkemos.com` لا بمشروع Vercel** — لا يحتاج أي تغيير الآن.

### 4.3 لا يجب نقلها الآن (متغيرات ميتة موثقة — `RECOVERY-SECRETS-SOURCES.md` §3)

`SUPABASE_JWT_SECRET` · `SUPABASE_SECRET_KEY` · `SUPABASE_PUBLISHABLE_KEY` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` · `SUPABASE_ANON_KEY` (الصيغة الخادمية) · `EVO_PARTNER_API_ENABLED` (ميزة EVO-6 أزيلت — **إحياؤها انتهاك لبوابة guard-stale-refs**)

> نقل هذه القائمة يخلق نسخة موسخة من Production؛ تركها = بيئة أنظف وأقرب لسلوك الكود الفعلي. (تنظيفها من **القديم** بقرار مالك — خارج نطاق هذه الخطة.)

## 5. مخاطر تشغيل المشروعين معًا (تحليل)

1. **Double Cron (الأخطر — مواجه المستخدم):** لحظة تكوّن أول Production Deployment في الحساب الجديد تُسجَّل crons في المشروعين:
   - `progress-reminder` (أحدًا 07:00 UTC): **إشعارات/بريد مكرر يصل عملاء حقيقيين**.
   - `dispatch-pipelines` (يوميًا 23:40 UTC): نداءان على GitHub — منطق التغطية (runs-today + posts-today) يجعل النداء الثاني عادة no-op، لكن نافذة السباق بين نداءين متزامنين قد تُرسل dispatchًا مكررًا لفترة مدونة (تصدّه بوابات الحصة/التكرار في المسار — لكنه ضجيج قابل للتفادي كليًا بقانون §6).
2. **نشر تلقائي مزدوج على كل دفعة:** المستودع واحد والـ GitHub App مربوط من الحسابين → كل push كودي إلى main ينشر Production في القديم **و**Production في الجديد (مع تسجيل crons) — ما لم تُطبق §6.
3. **Storage/Usage:** كل نشر يحجز ~350MB فورًا (قانون VERCEL-USAGE) — الحساب الجديد يبدأ نظيفًا (10GB Hobby) لكن `vercel-cleanup` (التوكن الحالي) ينظف **القديم فقط**؛ تراكم previews الجديدة يُدار بانتهاء 30 يومًا التلقائي + مراقبة، وبعد أي cutover مستقبلي يُعاد توجيه التوكن.
4. **GitHub Actions لا تتضاعف:** مدونة/النسخ/المهام تعمل في GitHub ضد Supabase مباشرة — لا تتأثر بوجود نسخة Vercel (المشروعان يخدمان نفس الواجهات لكن Jobs واحدة في GitHub).
5. **النطاقات:** `alkemos.com` لا يمكن إضافته للمشروع الجديد وهو مرتبط بالقديم (domain conflict) — الحماية الطبيعية ضد «cutover بالخطأ»؛ لا DNS يتغير لأن السجلات Vercel-generic.

## 6. طريقة منع Double Cron / Double Jobs (القانون المركزي)

> **القاعدة المقيسة:** Crons تُسجَّل وتعمل ضد **آخر Production Deployment** للمشروع. المشروع الجديد الآن `targets: {}` (صفر Production Deployments) → **صفر crons ممكنة**. Preview Deployments **لا** تنشئ Production Deployment → **لا تسجل crons**.

- **6-A (المسار المستبعد بقرار المالك 2026-10-05 — «نسخة دافئة»):** ضبط Production Branch للمشروع الجديد على فرع عنصر نائب (مثل `backup-staging` — يُنشأ من main ولا يستقبل أي كود) → كل دفعة إلى main تنشر **Preview** في الجديد (تبقى النسخة متزامنة مع كل تغيير Production) بينما Production يبقى حصريًا للقديم → **لا crons إطلاقًا** — *لم يُطبق قط؛ انحرف الحساب إلى حالة «دافئة بالخطأ» عبر main نفسه (§13.1) قبل اعتماد 6-B.*
- **6-B (المعتمد والمنفّذ 2026-10-05 بأمر المالك — «نسخة باردة»):** **فصل Git repository من المشروع الجديد** عبر `DELETE /v9/projects/{id}/link` (نفس ما ينفّذه أمر `vercel git disconnect` الرسمي — رسالته الحرفية: «Your Vercel project will no longer create deployments when you push to this repository») — **منفّذ مقيسًا §13.2: link = null** → لا نشر تلقائي إطلاقًا من أي فرع (main أو المؤقتة)؛ النشر يدوي فقط (`vercel deploy` preview) وقت التحقق الدوري أو الطوارئ — الحساب الاحتياطي **لا يكون Production متزامنًا ولا يستقبل تحديثات تلقائية من main** · طبقة تحصين ثانوية: `gitProviderOptions.createDeployments: disabled` (قِيس بعد ضبطها أن معناها الفعلي منع GitHub deployment statuses لا منع البناء — التفصيل §13.2) · إعادة الوصل وقت cutover: `POST /v9/projects/{id}/link` بنفس المستودع (شكل `vercel git connect`).
- **قوانين صارمة مكملة (أي مسار):**
  1. **ممنوع `vercel --prod`** أو «Redeploy» كـ Production أو أي دفعة إلى فرع الـ Production للمشروع الجديد قبل يوم cutover معلن.
  2. دفعات docs-only تحمل `[vercel skip]` (قانون VERCEL-USAGE-6) → نشر CANCELED بلا خدمة في **الحسابين** (شاهد مقيس: آخر docs-commit أنتج CANCELED في القديم).
  3. بعد كل نشر preview: تحقق أن المشروع الجديد ما زال بلا Production Deployment/crons (لوحة المشروع أو API).
  4. أي نشر إنتاجي اضطراري في الجديد (لا يتصور حاليًا) يعني تفعيل §5-1 فورًا: إزالة الـ crons من الجديد بتعليق سطرين في `vercel.json` بنفس الفريم — لا يُترك أبدًا مشروعان بنش crons نشطة.

## 7. خطة Preview Verification (آمنة — صفر مساس بـ Production)

**شروط مسبقة:** §4.1/§4.2 مضبوطة (لا سيما `NEXT_PUBLIC_*`) + §6 مطبق + التوكنات في مكانها.

1. **إطلاق preview:** من نسخة نظيفة من `main`: `vercel deploy` (بلا `--prod`) أو دفع فرع تحقق — النتيجة URL بالنمط `alkemos-<hash>-aalkemos.vercel.app` محمي بـ Standard Protection (تسجيل دخول مالك الحساب الجديد).
2. **بطارية الدخان (مرآة بطارية RESOURCE-AUDIT-CLOSE):** `/api/build-info` (نفس commit SHA لنشر Production القديم وقتها) · الصفحة الرئيسية EN + `/ar` 200 · `sitemap.xml`/`robots.txt`/`llms-full.txt`/`rss.xml` · صورة OG عينة · `/api/cron/*` ترد **401** (fail-closed) · مقارنة هيدرز الأمان/الكاش مع Production (من `vercel.json` — متطابقة بالوراثة).
3. **إثبات env وقت البناء:** HTML يحمل Supabase URL/client keys وGA ID (NEXT_PUBLIC مدمجة)؛ مكونات PayPal تظهر عند ضبط قيمها اليدوية.
4. **اختبار auth على preview (اختياري ومؤجل):** يتطلب تحديث `redirect_allow_list` في Supabase (§3-B3) — تغيير على Supabase لا يُنفذ إلا بأمر مالك في فريم التحقق.
5. **فحص ما بعد التحقق:** crons = 0 · لا Production target · Usage الجديد ضمن الحدود.
6. **تنظيف:** حذف نشر الـ preview بعد التحقق (يحرر التخزين) — لا أثر على أي مستخدم.

## 8. خطوات جعل النسخة الاحتياطية جاهزة (دون Cutover) — للتنفيذ لاحقًا بأمر مالك

1. إدخال قيم §4.2 يدويًا من اللوحات (المالك).
2. نقل §4.1 — **منفّذ 2026-10-03 (§12)**: المسار (ب) وكيل بأمر مالك عبر API (نقل آلي 29/29 مدخلًا + تحقق قيم — شمل بأمر المالك مفاتيح §4.3 القابلة للقراءة أيضًا؛ انظر §12.4-2).
3. تطبيق §6 — **منفّذ 2026-10-05 بصيغة 6-B (Cold Standby) بأمر المالك** (فصل Git link + تحصين ثانوي — §13.2)؛ بقيت معالجة أثر ما قبل التنفيذ (النشرات/crons — §13.5/§13.6).
4. أول preview deployment + بطارية §7 كاملة + توثيق نتيجتها في worklog وتحديث عمود حالة هذا الملف في `docs/README.md`.
5. (اختياري وقت cutover لا قبله) تفعيل Web Analytics.
6. **المراقبة الدورية:** صفر crons · صفر production targets في الجديد · Production القديم يخدم `alkemos.com` كالمعتاد · usage الحسابين سليم.
7. النسخة «باردة» (6-B المعتمد): **لا مزامنة تلقائية مع main** — الجاهزية تُثبت دوريًا بنشر preview يدوي (§7)، وأي تحديث وقت الطوارئ يدوي صريح؛ مسار 6-A أعلاه مستبعد بقرار المالك 2026-10-05.

## 9. خطة Rollback لهذه المرحلة

- **النسخة الاحتياطية قابلة للإلغاء الكامل بلا أي أثر:** حذف المشروع الجديد (أو فصل Git فقط) لا يمس Production/DNS/Cloudflare/Supabase/GitHub — لأن شيئًا منها لم يتغير.
- أي rollback أعمق غير مطلوب في هذه المرحلة (لا يوجد cutover). خطة rollback الـ cutover المستقبلية: §10/§11.

## 10. شروط مستقبلية — فقط عند اضطرارنا لنقل Production (سيناريو Pause في الحساب القديم)

**المُفعِّل الوحيد المفترض:** إيقاف/تعليق الحساب القديم (Hobby overage pause مثلًا) أو أمر مالك صريح بالنقل. عند تحققه فقط، وبترتيب «فرع مخصص»:

1. تجميد الدفعات إلى main (نافذة هادئة بعيدة عن 23:40 UTC و07:00 UTC أحدًا).
2. المشروع الجديد: Production Branch يعود إلى `main` → نشر Production أول (أو `vercel --prod`) من نفس commit آخر نشر جاهز.
3. تحقق `build-info` على `alkemos.vercel.app` (نفس SHA).
4. فصل `alkemos.com`/`www` من المشروع القديم (**إن كان الحساب القديم متاحًا**؛ إن كان مقفولًا/معلقًا: تذكرة دعم Vercel لتحرير الدومين — هذه بالضبط القيمة التأمينية للنسخة الاحتياطية).
5. إضافة الدومينين للمشروع الجديد (www كـ redirect 301 كما في القديم؛ اختياريًا `musclehubeg.vercel.app`) — **لا تغيير DNS** (السجلات generic).
6. تحقق فوري على الدومين ثم Purge كاش Cloudflare (edge TTL يصل 43200s — المحتوى نفسه لكنها خطوة صحية).
7. استبدال سر `VERCEL_TOKEN` في GitHub بتوكن الحساب الجديد (يعيد توجيه `vercel-cleanup`) + تحديث `redirect_allow_list` في Supabase إن لزم للـ previews.
8. مراقبة 48 ساعة (crons تشتغل من الجديد وحده · Jobs · صفحات · مدفوعات) قبل أي قرار على القديم.

## 11. قائمة التحقق النهائية قبل أي Cutover مستقبلي

- [ ] §4.1 ✓ منفّذ (§12: 29/29 بنفس الأسماء والأهداف والقيم) + §4.2 إدخال يدوي بالمالك (8 قيم MANUAL_REQUIRED — §12.2) — البند يكتمل بإدخالها.
- [ ] بطارية §7 خضراء على آخر commit Production.
- [ ] §6 ما زال مطبقًا (صفر crons/production في الجديد) حتى لحظة الـ cutover نفسها — يتطلب أولًا تنفيذ قرار §13.5 (تنظيف نشرات الاحتياطي/إلغاء الـ crons القائمة منذ 10-04).
- [ ] قرار تنظيف نشرات الاحتياطي (§13.5: الخيار أ الموصى به = حذف الكل فيتحقق صفر-crons تلقائيًا، أو الخيار ب = إبقاء آخر نشر + تعطيل يدوي للـ crons من اللوحة) منفّذ وموثّق.
- [ ] نافذة زمنية بعيدة عن جدولا الـ crons.
- [ ] `redirect_allow_list` (Supabase) محدث بنمط الفريق الجديد (عند الحاجة للـ previews).
- [ ] نسخة احتياطية من آخر deployment قديم جاهزة للعودة (`4cf5c4bc` أو أحدث) + خطة عكس الخطوات موثقة.
- [ ] Purge كاش Cloudflare بعد التبديل.
- [ ] سر `VERCEL_TOKEN` في GitHub مستبدل ومُختبَر (تشغيل `vercel-cleanup` يدويًا dry-run).
- [ ] مسار دعم Vercel جاهز (إن كان القديم مقفولًا والدومين محتجزًا).
- [ ] مراقبة 48 ساعة خضراء قبل أي تفكيك للحساب القديم (المحذوف أبدًا قبل انتهائها).

## 12. سجل تنفيذ نقل متغيرات البيئة (2026-10-03 — أمر المالك «نفّذ الآن فقط البندين»)

> **ما نُفّذ في هذا الفريم:** البند 2 من §8 فقط (نقل متغيرات البيئة القابلة للقراءة آليًا إلى المشروع الاحتياطي) + هذا التوثيق. **لم يُنفّذ أي شيء آخر:** لا نشر Production (إنشاء متغيرات البيئة لا يشغّل أي بناء — مقيس)، لا DNS، لا cutover، لا Cloudflare، لا Supabase، لا تعديل كود. **المشروع القديم لم يُمس** (قراءة فقط — مقيس ببصمة المداخل قبل/بعد).

### 12.1 ما نُقل فعليًا — 29/29 مدخلًا آليًا (نفس المفتاح/الأهداف/النوع حرفيًا)

النقل عبر Vercel API: قراءة القيم من المشروع القديم بفك التشفير per-env (المصدر)، والإنشاء في المشروع الجديد بتوكن الفريق الجديد — **بنية مدخلات مطابقة حرفيًا للقديم** (25 مفتاحًا فريدًا = 29 مدخلًا؛ التفصيل في 12.4-1):

| المفاتيح | Targets (كما في القديم) | النوع |
|---|---|---|
| `CRON_SECRET` · `PEXELS_API_KEY` · `SUPABASE_SERVICE_ROLE_KEY` | production+preview+development | encrypted |
| `NEXT_PUBLIC_SITE_URL` | production+preview | **plain** (كما في القديم — قيمة ظاهرة غير سرية `https://alkemos.com`) |
| `OPENROUTER_API` · `OPENROUTER_API_KEY` · `GROQ_API_KEY` · `UPSTASH_REDIS_REST_URL` · `UPSTASH_REDIS_REST_TOKEN` | production+preview | encrypted |
| `NEXT_PUBLIC_SUPABASE_URL` | production · preview · development — **ثلاثة مداخل منفصلة** (كما في القديم) | encrypted |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production · preview · development — **ثلاثة مداخل منفصلة** (كما في القديم) | encrypted |
| `NEXT_PUBLIC_GA_ID` · `NVIDIA_API_KEY` · `BREVO_API_KEY` · `EMAIL_FROM` · `EMAIL_REPLY_TO` · `GITHUB_DISPATCH_TOKEN` · `EVO_CRON_SECRET` · `EVO_FOLLOWUP_ENABLED` · `EVO_FOLLOWUP_FROM` · `EVO_PARTNER_API_ENABLED` | production | encrypted |
| `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_PUBLISHABLE_KEY` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | production | encrypted |

### 12.2 ما بقي — 8 قيم MANUAL_REQUIRED (مصنفة Sensitive في القديم: لا تُقرأ عبر API إطلاقًا)

| المفتاح | Targets في القديم | المصدر/الحالة |
|---|---|---|
| `PAYPAL_CLIENT_ID` | production+preview | لوحة PayPal Developer (`RECOVERY-SECRETS-SOURCES.md` §2.2) |
| `PAYPAL_CLIENT_SECRET` | production+preview | نفس المصدر |
| `PAYPAL_WEBHOOK_ID` | production+preview | نفس المصدر (الـ Webhook مرتبط بالدومين `alkemos.com` لا بمشروع Vercel — لا تغيير مطلوب) |
| `PAYPAL_MODE` | production+preview | نفس المصدر |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | production+preview | نفس المصدر — **يُدمج وقت البناء** (لا تعمل مكونات PayPal في أي نشر قبل إدخاله) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | production+preview | لوحة AdSense — **يُدمج وقت البناء** |
| `SUPABASE_JWT_SECRET` | production | MANUAL_REQUIRED تنفيذًا للأمر — **بترتيب §4.3: متغير ميت موثق؛ التوصية عدم إدخاله إطلاقًا** (الإدخال بلا أثر وظيفي؛ القرار للمالك) |
| `SUPABASE_SECRET_KEY` | production | نفس الترتيب (§4.3) |

> **قاعدة التنفيذ الصارمة (التُزمت بها):** لم تُقرأ أي قيمة Sensitive، ولم يُخمَّن أو يُنشأ أي بديل/placeholder — مقيس: **صفر مداخل مصنفة sensitive في المشروع الجديد**.

### 12.3 التحقق بعد النقل (كله مقيس عبر API في نفس الفريم)

- **الأسماء:** 29/29 موجودة في الجديد · **الأهداف:** 29/29 مطابقة مجموعة-بمجموعة للقديم · **الأنواع:** مطابقة (plain/encrypted).
- **القيم (التحقق الذهبي):** فُكّ تشفير كل مدخل من **المشروع الجديد نفسه** وقورن بالقيمة المقروءة من القديم → **29/29 متطابقة**.
- **لا ناقص:** صفر مداخل مفقودة · **لا متعارض:** صفر تكرارات (مفتاح+أهداف) · **لا دخيل:** صفر مداخل غير مخططة.
- **المشروع القديم لم يُمس:** بصمة الـ 37 مدخلًا (id/key/target/type/updatedAt) متطابقة قبل/بعد — 37 كما هي (8 Sensitive + 29 مقروءة).
- **أثر جانبي صفري على النشر:** لا بناء أُشعل — آخر نشر في الجديد ما زال CANCELED (دفعة docs `ec6977a5`) · endpoint الـ crons ما زال يرد not_found (صفر crons — عزلة §6 قائمة).

### 12.4 الاختلافات والملاحظات المكتشفة أثناء النقل

1. **بنية المداخل لا بنية المفاتيح:** §4.1 وثّق `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` بصيغة مدخل واحد (prod+preview+dev) — الواقع المقيس: **كل منهما 3 مداخل منفصلة** (مدخل لكل target). النقل أعاد إنتاج البنية الحرفية (29 مدخلًا لا 21) — لذا عدد مداخل الجديد = عدد مداخل القديم القابلة للقراءة بالضبط.
2. **تجاوز §4.3 بأمر المالك (قرار موثّق):** أمر هذا الفريم نصّ «انقل جميع القيم التي يمكن قراءتها آليًا» فشمل النقل 4 مفاتيح §4.3 القابلة للقراءة (`EVO_PARTNER_API_ENABLED` · `SUPABASE_ANON_KEY` · `SUPABASE_PUBLISHABLE_KEY` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). **أثرها صفر على سلوك الكود** (متغيرات ميتة لا يقرؤها الكود) — بيئة النسخة صارت «مرآة كاملة» بدل «النسخة النظيفة» التي أوصت بها §4.3؛ التوصية الأصلية تظل سارية للتنظيف من **القديم** (بقرار مالك، خارج نطاق هذه الخطة).
3. **تقاطع Sensitive ∩ §4.3:** `SUPABASE_JWT_SECRET` و`SUPABASE_SECRET_KEY` حسّاسيتان (غير مقروءتين) وموثقتان ميتتين في §4.3 — سُجلتا MANUAL_REQUIRED تنفيذًا لأمر المالك، مع توصية §4.3 بعدم إدخالهما يدويًا إطلاقًا (§12.2).
4. **النوع محفوظ حرفيًا:** `NEXT_PUBLIC_SITE_URL` نُقل **plain** كما في القديم؛ البقية encrypted؛ لم يُنشأ أي مدخل sensitive في الجديد (النوع sensitive بلا القيمة الحقيقية لا معنى له).
5. **بوابة أول نشر كامل الميزات:** `NEXT_PUBLIC_PAYPAL_CLIENT_ID` و`NEXT_PUBLIC_ADSENSE_CLIENT` يدمرج مع البناء — أول نشر للنسخة قبل إدخالهما اليدوي يعمل لكن بلا مكونات PayPal/AdSense (بينما GA وSupabase العام نُقلا آليًا) — يرفع أهمية ترتيب §8: الإدخال اليدوي (الخطوة 1) قبل أول preview كامل الميزات.
6. **`hiddenProductionEnvCount = 0`** في القديم — لا متغيرات مخفية إضافية وراء العداد؛ الـ 37 هي الكل.

## 13. سجل تحويل Cold Standby + الـ Audit الكامل (2026-10-05 — أمر المالك «اعتماد Cold Standby / §6-B»)

> **نطاق هذا الفريم:** audit قراءة-فقط عبر API على الحساب الاحتياطي (فريق `aalkemos`) + تنفيذ التغيير الآمن الوحيد المطلوب (تعطيل نشر Git) + هذا التوثيق. **صفر حذف** (متغيرات/أسرار/نشرات) · صفر مساس Production القديم/DNS/Cloudflare/Supabase/GitHub Actions التشغيلية · لا cutover · لا نشر Production في الاحتياطي · لا تخمين أو عرض أي قيمة سرية (أسماء فقط طوال القسم).

### 13.1 الوضع المكتشف (قياس API مباشر 2026-10-04/05 — الواقع الحاكم عند التعارض)

انكسرت عزلة §6 الموثقة يوم 10-03 خلال يوم واحد — الأخطر أن خطر **§5-1 (Double Cron) تحقق فعليًا**:

| البند | الحالة المقيسة |
|---|---|
| النشرات في الاحتياطي | **16 سجلًا كلها مصدرها GitHub App** (meta.githubDeployment=1 — لا CLI ولا workflow): **11 جاهزة** (6 Preview من الفروع المؤقتة `gd2-retention`/`gd3-offsite`/`gd4-restore-drill` + **5 Production من `main`**) + 5 CANCELED (أربعة لدفعات docs-only القديمة + واحد لدفعة توثيق هذا الفريم 947d4fc5 — بلا بناء) — كلها بين 10-04 07:32 و10-05 00:04 UTC |
| أول Production Deployment | `dpl_DPucaBSTiq` (afc4d40a · 07:32 UTC) → سجّل الـ crons فورًا (enabledAt 07:26 UTC) — «صفر production» في §6 انكسر |
| Crons الاحتياطي | **نشطة**: تعريفان (`dispatch-pipelines` يوميًا 23:40 UTC · `progress-reminder` أحدًا 07:00 UTC) ضد آخر Production `dpl_B4bkpHdP` (00e37ba8) — **Double Cron حي منذ 10-04** |
| قياس نافذة 23:40 UTC (10-04) | dispatch واحد فقط لكل workflow (`37244856253` EN · `37244857704` AR · `37244859175` ai-jobs) — بوابات coverage صدّت التكرار هذه الليلة؛ نافذة السباق (§5-1) تبقى قائمة حتى المعالجة |
| النطاق التلقائي | `alkemos.vercel.app` مخصص للمشروع ويخدم **علنًا** HTTP 200 بنفس commit الإنتاج `00e37ba8` (مقيس `/api/build-info` في الحسابين) — مرآة دافئة حية كاملة |
| لماذا لم يمنع `[vercel skip]`؟ | `ignoreCommand` (`scripts/vercel/ignore-step.sh`) هو الحاكم لا وسم الرسالة: قاعدة مسارات — الدفعات التي لمست `.github/` أو `scripts/` **بُنيت رغم الوسم** (مقيس: afc4d40a · 02cea8a4 · 4fddbe24 · 97dadd0d · 00e37ba8 جاهزة؛ docs-only فقط أُلغيت) |
| Web Analytics | `id` محجوز (`Bxt53V…`) بلا بيانات (speedInsights hasData=false) — يظل بند A4 كما هو |
| مصدر «التحديث التلقائي من main» | **GitHub App وحده** (كل النشرات Git-App) — لا يوجد أي GitHub Action ينشر إلى الاحتياطي، فلا حاجة لتعطيل أي workflow لتحقيق البرودة |

### 13.2 ما نُفّذ فعليًا (تنفيذًا لأمر المالك — على مرحلتين مقوستين، والثانية هي الحاسمة)

- **الإجراء 1 — `PATCH /v9/projects/prj_ILK40M1oXXrfPspR676sqDKgoV6v`**: `gitProviderOptions.createDeployments: enabled → disabled` (23:52 UTC · GET بعدي يؤكد `disabled`). **الاكتشاف القياسي بعده**: دفعة توثيق هذا الفريم الأولى (947d4fc5 · docs-only) أنشأت رغم ذلك سجل نشر في الاحتياطي (`dpl_82Mtc8sAYk` · CANCELED) — تحليل أحداث النشرة أثبت أن الإلغاء جاء من **`ignore-step.sh` exit 0** (events: clone 2.3s → «Running sh scripts/vercel/ignore-step.sh» → «canceled because the Ignored Build Step command returned exit code 0») وليس من الإعداد؛ التوثيق الرسمي (Vercel SDK — نموذج GitProviderOptions) يحسمها: **`createDeployments` = «Whether the Vercel bot should automatically create GitHub deployments» (GitHub Deployments API) — لا علاقة له ببناء Vercel نفسه**. القرار: الإبقاء عليه `disabled` كطبقة تحصين ثانوية (يمنع ضجيج الـ statuses على GitHub) مع توثيق معناه الحقيقي هنا.
- **الإجراء 2 (الحاسم — تنفيذ §6-B الفعلي): `DELETE /v9/projects/prj_ILK40M1oXXrfPspR676sqDKgoV6v/link`** → **مقيس: `link: null`** (كان: github/`muscleshubfit-cpu`/`alkemos` · productionBranch `main` · deployHooks فارغة) — نفس أمر `vercel git disconnect` الرسمي: «لن ينشئ المشروع نشرات عند الدفع إلى هذا المستودع». المشروع يبقى جاهزًا للنشر اليدوي وقت الطوارئ (بيئة كاملة + توكن النشر)، وإعادة الوصل وقت cutover بـ `POST /v9/projects/{id}/link` بنفس المستودع.
- **التحقق الذهبي البعدي (دفعة تصحيح هذا الفريم نفسها — docs-only بعد الفصل):** **صفر سجلات نشر جديدة في الاحتياطي** (لا حتى CANCELED — العدد بقي 16) بينما أنشأ الأساسي سجل CANCELED المعتاد بلا بناء → **البرودة مثبتة قياسًا من الطرفين**.
- **أثر جانبي صفري مقيس**: لا بناء أُشعل بأي من الإجراءين (سجل 947d4fc5 الوحيد أُلغي من ignore-step قبل البناء — صفر تخزين) · المشروع القديم لم يُمس طوال الفريم (قراءة فقط) · لا DNS/دومين/Cloudflare/Supabase/GitHub · **Environment Variables لم تحذف ولم تعدّل** (الـ 29 كما نُقلت في §12).
- **حدود التعطيل**: النشرات القائمة (11 جاهزة) والـ crons المسجلة لا يزيلها الفصل (تعمل ضد آخر Production) — معالجتها §13.5/§13.6 (بانتظار أمر مالك).

### 13.3 تصنيف Environment Variables الاحتياطية — 29 مدخلًا (25 مفتاحًا) — أسماء فقط، صفر قيم

> **المنهجية (قياس لا تخمين):** grep مقيس للكود المُنشأ (`src/`) + مسح 31 ملف workflow في `.github/workflows/` + قائمة أسرار GitHub عبر API (أسماء فقط، 20 سرًا). **وجود السر في GitHub Secrets ليس دليل استخدام** — الاستخدام يُثبت بمرجع `secrets.NAME` فعلي داخل workflow محدد.

| المفتاح | الكود `src/` (الموقع المقيس) | GitHub Actions (workflow + الغرض) | الحكم |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ 42 مرجعًا (عميل Supabase) | ✓ **23 workflow** (blog-post-ar/en · process-ai-jobs · db-backup · storage-backup/inventory/restore-drill · offsite-restore-drill · remediations الخمس · notifications-prune · retro-pair-blog · evo-weekly-learning/eval · legacy-ar-cleanup — اتصال Supabase) | **أساسية · build-time + runtime + Actions** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ 20 (عميل المتصفح) | — (الworkflows تمرر سر URL فقط) | **أساسية · build-time** |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ 29 (admin) | ✓ **22 workflow** (كل ما أعلاه) | **أساسية** |
| `CRON_SECRET` | ✓ (بوابات `src/lib/cron-auth.ts` لكل `/api/cron/*`) | ✓ blog-post-ar/en (نداء API الموقع من الـ runner) | **أساسية** |
| `GITHUB_DISPATCH_TOKEN` | ✓ 11 (`/api/cron/dispatch-pipelines` · `src/lib/blog-pipeline-dispatch.ts` · `ai-runner-dispatch`) | — | **أساسية** (محرك الـ backstop) |
| `PEXELS_API_KEY` | ✓ (blog-images + `/api/blog/*`) | ✓ 4 (blog-post-ar/en · process-ai-jobs · remediate-blog-images — جلب الصور) | **أساسية** |
| `OPENROUTER_API` | ✓ (endpoint مزوّد AI) | ✓ 6 (blog-post-ar/en · process-ai-jobs · evo-weekly-eval · geo-answer-visibility · legacy-ar-cleanup) | **أساسية** |
| `OPENROUTER_API_KEY` | ✓ | ✓ نفس الستة | **أساسية** |
| `GROQ_API_KEY` | ✓ | ✓ نفس الستة | **أساسية** |
| `NVIDIA_API_KEY` | ✓ | ✓ نفس الستة | **أساسية** |
| `BREVO_API_KEY` | ✓ (send-email · evo-followup · coach invite/resend) | **لا** — السر موجود في GitHub **بلا أي مرجع في أي workflow** (مقيس) | **runtime فقط** |
| `EMAIL_FROM` | ✓ (send-email · invite) | — | **runtime فقط** |
| `EMAIL_REPLY_TO` | ✓ (send-email) | — | **runtime فقط** |
| `UPSTASH_REDIS_REST_URL` | ✓ (`src/lib/rate-limit.ts`) | **لا** — السر في GitHub بلا أي مرجع (مقيس) | **runtime فقط** |
| `UPSTASH_REDIS_REST_TOKEN` | ✓ (نفس الملف) | **لا** — كذلك | **runtime فقط** |
| `NEXT_PUBLIC_GA_ID` | ✓ (`src/components/root-shell.tsx` — وسم GA) | — | **build-time** |
| `NEXT_PUBLIC_SITE_URL` | ✓ 9 | — | **build-time (plain)** |
| `EVO_CRON_SECRET` | ✓ (`/api/evo/followup/dispatch`) | — | **runtime فقط** |
| `EVO_FOLLOWUP_ENABLED` | ✓ (نفس المسار) | — | **runtime فقط** |
| `EVO_FOLLOWUP_FROM` | ✓ (نفس المسار) | — | **runtime فقط** |
| `SUPABASE_URL` | **—** (التطبيق المنشأ لا يقرؤه) | سكربتات تشغيل فقط كـ fallback: `scripts/db-backup.mjs` · `storage-backup.mjs` · `storage-inventory.mjs` · `storage-restore.mjs` · `db-restore.mjs` · `notifications-prune.mjs` (`SUPABASE_URL \|\| NEXT_PUBLIC_SUPABASE_URL` — والworkflows تمرر `NEXT_PUBLIC_*`) | **alias تشغيلي** — يبقى لمرآة التطابق مع القديم |
| `EVO_PARTNER_API_ENABLED` | **صفر استخدام** | صفر | **ميتة** (§4.3 — ضمن نمط guard-stale-refs) |
| `SUPABASE_ANON_KEY` | **صفر** (الكود يستخدم `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | صفر | **ميتة** (§4.3) |
| `SUPABASE_PUBLISHABLE_KEY` | **صفر** | صفر | **ميتة** (§4.3) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **صفر** | صفر | **ميتة** (§4.3) |

- **مفاتيح build-time `NEXT_PUBLIC_*` (تُدمج في الـ bundle وقت البناء):** المتوفرة `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `NEXT_PUBLIC_SITE_URL` · `NEXT_PUBLIC_GA_ID` — والمفقودة (تحتاج إدخالًا يدويًا قبل أي نشر كامل الميزات): `NEXT_PUBLIC_PAYPAL_CLIENT_ID` · `NEXT_PUBLIC_ADSENSE_CLIENT` (§12.2).
- **الـ 8 Sensitive الغائبة (MANUAL_REQUIRED — §12.2) لا تزال غائبة**: `PAYPAL_CLIENT_ID` · `PAYPAL_CLIENT_SECRET` · `PAYPAL_MODE` · `PAYPAL_WEBHOOK_ID` · `NEXT_PUBLIC_PAYPAL_CLIENT_ID` · `NEXT_PUBLIC_ADSENSE_CLIENT` + توصية §4.3 بعدم إدخال `SUPABASE_JWT_SECRET`/`SUPABASE_SECRET_KEY` إطلاقًا.
- **مكررة/غير ضرورية للـ rescue:** مداخل `development` الخمسة (على `NEXT_PUBLIC_SUPABASE_URL`/`ANON`/`SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET`/`PEXELS_API_KEY`) — خاصة بـ `vercel dev` المحلي لا بالاستعادة؛ **تبقى** (مرآة تطابق مع القديم، بلا أي أثر تشغيلي) والمفاتيح الأربعة الميتة أعلاه (ميراث §12.4-2 الموثق — استبعادها قرار مالك §13.6).
- **مقارنة الأساسي ↔ الاحتياطي (مقيسة):** 37 مدخلًا في القديم = 29 منقولة (متطابقة أسماء/أهداف/أنواع — §12.3) + 8 Sensitive غائبة. **كل ما يجب أن يبقى في الاحتياطي موجود**؛ الوحيدة القابلة للاستبعاد مستقبلًا بلا أي أثر: المفاتيح الأربعة الميتة + (اختياريًا) مداخل development — كلاهما بانتظار أمر مالك.

### 13.4 علاقة Vercel Environment Variables ↔ GitHub Actions Secrets (طلب صريح من المالك)

- سر GitHub **`VERCEL_TOKEN`** (موجود منذ 2026-09-07): يستخدمه **workflow واحد فقط: `vercel-cleanup.yml`** (مرجعان فيه: preflight + خطوة التنظيف) — **الغرض: حذف النشرات القديمة في الحساب الأساسي حصرًا** (توكن project-scoped للمشروع القديم `prj_y4pHM9…` في فريق `muscleshubfit-2941s` — مقيس: لا يرى فريق `aalkemos` إطلاقًا 403). لا ينشر كودًا ولا يمس الاحتياطي. **لم يُلمس ولن يُلمس** (لا نقل/حذف/تدوير — الاستبدال بند B4 وقت cutover فقط).
- **لا يحتاج أي تغيير الآن**: استمرار `vercel-cleanup` في تنظيف الأساسي هو المطلوب (وهو الحل الموثق لتجاوز 10GB في الأساسي).
- **أسرار GitHub موجودة بلا أي مرجع فعلي في workflows (مقيس):** `BREVO_API_KEY` · `UPSTASH_REDIS_REST_URL` · `UPSTASH_REDIS_REST_TOKEN` · `REPO_ACCESS_TOKEN` — لا تُمس (قرار تنظيفها للمالك؛ القيم غير قابلة للقراءة عبر API أصلًا).
- **المتغيرات المشتركة بالتصميم**: `CRON_SECRET` ومفاتيح Supabase موجودة في Vercel (الجهتين) وGitHub Secrets معًا — كل جهة تستهلكها مستقلة؛ لا علاقة مزامنة بينهما.
- **قاعدة هذا الفريم:** صفر قراءة قيم · صفر نقل · صفر حذف · صفر تعديل لأي Secret من GitHub (قائمة الأسماء فقط عبر API للقراءة).

### 13.5 سبب Deployment Storage + التنظيف الآمن المقترح (لا شيء نُفّذ — كله بانتظار أمر مالك)

**السبب المقيس (ثلاثة عوامل تضافرت خلال 10-04 وحده):**
1. `createDeployments: enabled` + Production Branch `main` → كل دفعة إلى main بنت نشرًا Production، وكل دفعة إلى الفروع المؤقتة بنت Preview — **15 نشرة في ~15 ساعة**.
2. قاعدة مسارات `ignore-step.sh` → الدفعات التي لمست `.github/`/`scripts/` بُنيت **رغم وسم `[vercel skip]`** (5 Production جاهزة منها).
3. **لا آلية تنظيف تستهدف الاحتياطي إطلاقًا**: `vercel-cleanup` (التوكن الوحيد المتاح لـ GitHub) project-scoped للقديم — مقيس 403 على فريق `aalkemos` — بينما انتهاء الـ 30 يومًا التلقائي بعيد (نشرات 10-04) → **11 نشرة جاهزة تراكمت فوق حصة Hobby 10GB** (لوحة المالك: **10.62 GB / 10 GB**). سجلات CANCELED الخمسة بلا بناء → استهلاكها للتخزين صفري تقريبًا (الحذف التنظيفي يستهدف الجاهزة).

**حدود القياس (موثقة بشفافية):** أحجام البايت لكل نشر غير قابلة للقراءة بتوكنات هذا الفريم (endpoint ملفات النشرة 404 · usage API محصور في Pro/Enterprise — مقيس) — القياس المرجعي الموثق في `vercel-cleanup.yml`: ~350MB+ للنشر (مكتبة صور كبيرة) — 11 جاهزة ≈ استنفاد الحصة، متسقًا مع رقم اللوحة.

**قائمة التنظيف المقترحة (كلها قابلة لإعادة الإنتاج من git — الحذف حصرًا بأمر مالك):**

| المجموعة | النشرات | الأمان |
|---|---|---|
| **آمنة حتمًا (10)** | 6 Previews: `dpl_GUqorFCv` · `dpl_8R3RsUA8` · `dpl_7JV7FRTm` · `dpl_ZZtkgP6G` · `dpl_BemTGzhc` (من `gd3-offsite`/`gd4-restore-drill`) · `dpl_8XhNUn91` (من `gd2-retention`) — الفروع موجودة | لا aliases · قابلة لإعادة البناء من الفروع |
| | 4 Production متجاوزة: `dpl_Ges29CBi` · `dpl_9U2iBfbx` · `dpl_7FVrsvkB` · `dpl_DPucaBSTiq` — كلها قبل آخر جاهز | لا تخدم أي اسم (الاسم على الأحدث) |
| **قرار المالك (1)** | آخر Production الجاهز `dpl_B4bkpHdP` (00e37ba8 — يخدم `alkemos.vercel.app` وتسجل عليه الـ crons) | انظر الخيارين أدناه |

- **الخيار (أ) — الموصى به لنسخة باردة حقيقية:** حذفه هو أيضًا → يتحقق قانون §6 حرفيًا: **صفر Production → الـ crons تُلغى تلقائيًا** (القاعدة المقيسة: الـ crons تعمل ضد آخر Production) → الحساب بارد تمامًا + التخزين يُحرَّر بالكامل (~الحد الأقصى المتاح) + `alkemos.vercel.app` يتوقف عن التقديم العلني (مطلوب لبرودة كاملة؛ النشر قابل لإعادة الإنتاج من `00e37ba8` في أي لحظة).
- **الخيار (ب):** إبقاؤه نسخة قابلة للتصفح + **تعطيل الـ crons يدويًا من لوحة Vercel** (Project ▸ Settings ▸ Cron Jobs — لا يوجد API عام لتعطيل الـ crons المسجلة؛ قِست المحاولات: PATCH يرفض الحقل وendpoints الـ crons ترجع not-found) → يبقى نشر علني حي + **التخزين يظل فوق الحدة** (قد يمنع أي نشر طوارئ — عكس هدف الجاهزية) — لهذا لا يُوصى به.
- **إعادة توجيه `vercel-cleanup` للاحتياطي: غير مطلوب ولا موصى به** بعد التنظيف (باردة = لا تراكم جديد بعد تعطيل النشر التلقائي §13.2).

### 13.6 ما ينتظر أمر المالك (لا شيء منها نُفّذ في هذا الفريم)

1. **تنظيف النشرات** (§13.5): الخيار (أ) الموصى به (حذف 11) أو (ب) (حذف 10 + إبقاء الأخير + تعطيل يدوي للـ crons من اللوحة).
2. **إدخال الـ 8 قيم MANUAL_REQUIRED** (§12.2) من لوحات PayPal/AdSense (وقت الحاجة لنشر كامل الميزات — لا للاستعادة الأساسية).
3. (اختياري، بلا أثر تشغيلي) حذف المفاتيح الأربعة الميتة ومداخل development من الاحتياطي (§13.3).
4. (لاحقًا، للتحقق الدوري) أول preview يدوي + بطارية §7 — بعد استقرار التخزين.
5. (ثابت) كل ما عدا ذلك في الخطة يبقى كما هو — لا cutover ولا DNS ولا أي مساس بالأساسي.

---

> **امتثال:** إطار docs-only (§79 — بوابات docs الثابتة فقط محليًا) · `[vercel skip]` في الالتزام (VERCEL-USAGE-6) · لا أسرار ولا قيم (§7) · صف في `docs/README.md` بنفس الفريم · مدخل `worklog.md` أعلى الملف · المصادر أحادية: أسماء/مصادر env من `RECOVERY-SECRETS-SOURCES.md`، حالة Production من القياس الحي، حالة الجديد من API الفريق الجديد (قراءة فقط).
> **تحديث فريم ENV-TRANSFER-BACKUP-2026-10-03 (أمر المالك «نفّذ الآن فقط البندين»):** أُضيف §12 (سجل نقل المتغيرات المنفّذ) وحُدّثت §2/§3-A1/§8-2/§11 — **القيم المنقولة لم تُخزَّن في أي ملف داخل المستودع** (أسماء/أهداف/عدادات فقط؛ التقرير الكامل بالقيم محلي خارج المستودع). ما نُفّذ: البند §8-2 وحده؛ عزلة §6 ما زالت قائمة (صفر deployments جاهزة · صفر crons).
> **تحديث فريم COLD-STANDBY-AUDIT-2026-10-05 (أمر المالك «نفّذ الآن Audit + تعديل خطة حساب Vercel الاحتياطي فقط»):** أُضيف §13 (سجل الاكتشاف والتنفيذ والتصنيف) وحُدّثت الترويسة/§2/§3-A2-A5/§6/§8-3/§8-7/§11. ما نُفّذ فعليًا: **فصل Git repository من المشروع الاحتياطي** (`DELETE /v9/projects/{id}/link` — مقيس link=null §13.2) + `createDeployments: disabled` كتحصين ثانوي (قِيس أن معناه الفعلي GitHub deployment statuses فقط) — كل ما عداه توثيق ينتظر أمر مالك (§13.6)؛ صفر حذف · صفر قيم · الأساسي/DNS/Cloudflare/Supabase/GitHub Actions لم تُمس (الأساسي قراءة-فقط طوال الفريم — آخر نشر جاهز فيه 00e37ba8 كما هو).
