# RECOVERY-SECRETS-SOURCES.md — مرجع مصادر الأسرار ومتغيرات البيئة للاستعادة

> **الغرض:** المرجع الدائم الوحيد لمعرفة **من أين تُجلب قيمة كل متغير/سر** عند إعادة بناء المشروع (مشروع Vercel جديد أو مشروع Supabase جديد) — دون تخزين أي قيمة إطلاقًا.
> **القانون الحاكم (من خطة التقوية P0-2):** هذا الملف يحمل **أسماء ومصادر فقط** — أي قيمة سرية هنا = عيب أمني فادح يُصلح فورًا. أي متغير بيئة جديد يُضاف للمشروع مستقبلًا يُوثَّق مصدره هنا في نفس الفريم (قانون تكافؤ التوثيق §3.8).
> **المصدر:** جرد مقيس حيًّا في `docs/EMERGENCY-RECOVERY-AUDIT-2026-09-20.md` §8 (2026-09-20) + تحقق الاستخدام في الكود. عند أي تعارض مستقبلي: الواقع المقاس هو الحاكم ويُحدَّث هذا الملف.

---

## 1. القواعد الذهبية (اقرأها قبل أي استعادة)

1. **لا توجد قيم هنا ولن توجد** — المصادر فقط. الجلب من اللوحات بيد المالك أو بيد من يملك وصول اللوحات.
2. **أسرار GitHub Actions للقراءة الآلية فقط:** لا يمكن لأي بشري استرجاع قيمتها بعد ضبطها (سرية باتجاه واحد). فائدتها: (أ) تشغيل الأتمتة القائمة كما هي، (ب) يمكن — بأمر مالك — كتابة workflow مؤقت يقرؤها ويعيد بذرها في مشروع Vercel جديد عبر API دون أن تراها عين بشرية.
3. **قيم Supabase كلها قابلة لإعادة الجلب من لوحة المشروع نفسه** (Project Settings ▸ API) ما دام المشروع حيًّا — وهي الأولى بين كل الأسرار في الاطمئنان.
4. **أعلى الأسرار هشاشة عند فقدان Vercel:** قيم PayPal (سر + Webhook ID) وGA وAdSense — لا نسخة لها خارج Vercel (الكتّاب الأول) — لذا خصص لها الجدول §2 صفوفًا بمصادرها الدقيقة.

## 2. جدول متغيرات الإنتاج الحية (المصدر عند الاستعادة)

### 2.1 الفئة أ — لها نسخة في GitHub Actions Secrets (استعادة شبه آلية)

| المتغير | بيئة الاستخدام | المصدر عند الاستعادة | ملاحظة |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | prod+preview+dev + Actions | لوحة Supabase (Settings ▸ API) · ونسخة Actions Secret | نفس القيمة للجميع · مستهلك إضافي: دريل الاستعادة الخارجي `offsite-restore-drill.yml` (GD-4) — نداء قراءة-فرد لقائمة buckets ضمن dry-run السكربتات (صفر كتابة) |
| `SUPABASE_SERVICE_ROLE_KEY` | prod+preview+dev + Actions | لوحة Supabase (service_role) · ونسخة Actions Secret | سر خادمي كامل الصلاحية — لا يُفك تشفيره إلا حيث يلزم · مستهلك إضافي: دريل الاستعادة الخارجي `offsite-restore-drill.yml` (GD-4) — نداء قراءة-فرد لقائمة buckets ضمن dry-run السكربتات (صفر كتابة) |
| `BREVO_API_KEY` | prod + Actions | لوحة Brevo (SMTP & API ▸ API Keys) · ونسخة Actions Secret | يخدم البريد التطبيقي REST |
| `CRON_SECRET` | prod+preview+dev + Actions | سر مشترك ذاتي — يُعاد توليده عند الحاجة مع مزامنة موضعيه (Vercel + Actions) | يحمي `/api/cron/*` |
| `GROQ_API_KEY` | prod+preview + Actions | لوحة Groq (console.groq.com ▸ API Keys) | الذراع الثانية لسلسلة AI |
| `NVIDIA_API_KEY` | prod + Actions | لوحة NVIDIA (build.nvidia.com) | الذراع الثالثة |
| `OPENROUTER_API` (+ الاسم البديل `OPENROUTER_API_KEY`) | prod+preview + Actions | لوحة OpenRouter (openrouter.ai/keys) | الاسمان لنفس القيمة — تدوير مزدوج موثق |
| `PEXELS_API_KEY` | prod+preview+dev + Actions | لوحة Pexels (pexels.com/api) | المصدر الأول لصور المدونة |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | prod+preview + Actions | لوحة Upstash (console.upstash.com ▸ REST API) | حد المعدل الموزع — اختياري مع سقوط آمن |
| `VERCEL_TOKEN` | Actions فقط | لوحة Vercel (Settings ▸ Tokens) | يخدم vercel-cleanup وأي أتمتة إعادة بذر |
| `BACKUP_REPO_TOKEN` | Actions فقط | Fine-grained PAT أنشأه المالك 2026-09-05 (ميلاد مسار النسخ): صلاحيات Contents: Read+Write على `musclehubeg-backups` + Read على `alkemos` (فحص انتهائه ودليل تجديده: بند 1 من قائمة الفحص اليدوي أدناه) | اعتماد الكتابة إلى مستودع النسخ الخاص كله: المهام اليومية الثلاث (db-backup · storage-backup · storage-inventory) + storage-restore-drill + external-mirror + **تقليم GFS الأسبوعي GD-2 (`backup-retention.yml` — أصبح أيضًا اعتماد الحذف من working tree المستودع الخاص، بكوميت واحد قابل للتتبع)** |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` | Actions فقط | Google Cloud Console (IAM & Admin ▸ Service Accounts ▸ حساب النسخ الاحتياطي ▸ Keys ▸ Add key ▸ JSON — على المشروع المفعّل به Google Drive API) | وجهة Google Drive الاحتياطية (قرار GD-0 في docs/BACKUP-STRATEGY-2026-10-03.md) — القيمة = ملف SA الكامل؛ لا يُطبع أي حقل منه في أي سجل أبدًا (نمط gsc-connection-test) |
| `GDRIVE_FOLDER_ID` | Actions فقط | معرف مجلد النسخ في Google Drive (أنشأه المالك 2026-10-04 وأعاد في اليوم نفسه تسمية الفولدر إلى «AlkemosBackups» — يُنسخ من رابط الفولدر ‎…/drive/folders/<id>‎ أو من تشاريه) | استهداف مجلد النسخ بالمعرف في `gdrive-smoke-test.yml` (GD-1) و`offsite-gdrive-upload.yml` (GD-3) ودريل الاستعادة `offsite-restore-drill.yml` (GD-4 — تنزيل قراءة-فقط) — قيمة سرّية لا تُطبع إلا مقنّعة (4+4 أحرف)؛ الـ workflow يستخرج المعرف بتسامح (رابط ‎/folders/‎ أو ‎?id=‎ أو توكن مضمّن بطول معرف) ويتحقق من محارف المستخرَج (20-60 من `[A-Za-z0-9_-]`) قبل أي استخدام — حقن الشِل متعذر مهما كان الملصوق |
| `GDRIVE_OWNER_EMAIL` | Actions فقط | البريد الشخصي للمالك — مالك حساب Google Drive صاحب مجلد «AlkemosBackups» وحصته الـ 15GB التي يُقصد خصم بايتات النسخ إليها (أُنشئ السر عبر GitHub API بأمر المالك 2026-10-04: **البريد لا يظهر في أي ملف بالمستودع إطلاقًا** — قيمته في GitHub Secrets فقط) | تجربة نقل الملكية `gdrive-ownership-experiment.yml` (GD-1-EXP): الوجهة المقترحة لنقل ملكية كائن المسبار (وصفة خارجية بأمر المالك «افحصها واعمل تجربة») — يُطبع مقنّعًا (3 أحرف + النطاق) فقط ويُستبدل خامًا في كل مخرجات السجل (نفس نمط تعقيم الـ SA في اختبار الدخان) |
| `GDRIVE_OAUTH_TOKEN` | Actions فقط | مُولَّد **مرة واحدة محليًا بيد المالك** عبر الأداة `scripts/gdrive/oauth-token-helper.html` (أمر المالك 2026-10-04 — مسار GD-1-ALT): عميل OAuth من نوع **Desktop app** على نفس مشروع GCP صاحب الـ SA (Drive API مفعّلة فيه مقيسًا) بشاشة موافقة **منشورة إلى Production** (شاشة Testing تقتل التوكن بعد 7 أيام — تحفظ §1.5-2 بالخطة) · القيمة = بنية إعداد rclone كاملة: `client_id` + `client_secret` + `scope` (drive.file الأقل صلاحية أو drive الكامل) + `token.refresh_token` — الأداة تركّبها جاهزة للصق | مصادقة النسخ **بصفة المالك**: الرفع في `offsite-gdrive-upload.yml` (GD-3) والتنزيل القراءة-فقط في `offsite-restore-drill.yml` (GD-4) — الملفات تُنشأ بصفة المالك فتُخصم بايتاتها من حصته الـ 15GB (القانون الذي استحاله قياسًا على SA) · لا يُطبع أي حقل منه أبدًا وكل المخرجات معقّمة (client_id/client_secret/refresh_token/access_token + كل بريد بنمط regex) · العميل مستقل تمامًا عن Google Login (مزوّد Google في Supabase Auth — بلا أي تداخل) · **مقيس أخضرًا 2026-10-04 (إعادة تشغيل 37184322424)**: القيمة الحالية بنطاق drive الكامل بقرار المالك (ب) لاستهداف فولدر «AlkemosBackups» القائم — النطاق ممنوح من Google والفولدر مرئي وجولة rclone كاملة داخله + حارس 12GB ✓ |
| `BACKUP_ENCRYPTION_KEY` | Actions فقط | مولّد آليًا 384-بت (openssl rand -base64 48) وأنشئ عبر GitHub API يوم 2026-10-04 بقرار المالك GD-0 ③ — **النسخة الخارجية الإلزامية: مدير كلمات المرور لدى المالك** (أُسلّمت له بملف محلي لحظة الإنشاء ومصيره الحذف بعد الحفظ) | تشفير كل ما يغادر GitHub في `offsite-gdrive-upload.yml` (GD-3): الأرشيف الأسبوعي/الشهري وbundles ‏الريبوين — وفك تشفيرها في دريل الاستعادة `offsite-restore-drill.yml` (GD-4 · الربعي): كل دريل يثبت حيًّا أن إقران مديم كلمات المرور↔السر يعمل (فشل الفك = إنذار تباعدهما الفوري) — openssl AES-256-CBC · PBKDF2 ‏600k · `-md sha256`؛ القيمة لا تُطبع أبدًا (ملف 0600 مؤقت + قائمة التعقيم) · **فقدان المفتاح = فقدان كل نسخة خارج GitHub** — لذا النسخة في مديم كلمات المرور ليست خيارًا بل شرط بقاء · أمر فك التشفير موثق حرفيًا في ملف تسليم المفتاح وفي سجل التشغيل |

### 2.2 الفئة ب — تُجلب يدويًا من لوحات المزودين (لا نسخة خارج Vercel)

| المتغير | المصدر عند الاستعادة | أثر غيابه حتى الجلب |
|---|---|---|
| `PAYPAL_CLIENT_SECRET` | PayPal Developer ▸ Applications ▸ (Live/Sandbox) ▸ Secret | **تتوقف دورة الدفع/الإيداع** — أعلى أولوية يدوية |
| `PAYPAL_WEBHOOK_ID` | PayPal Developer ▸ Webhooks (نفس التطبيق) | تعطل التحقق من إشعارات الدفع (Webhook URL نفسه يعمل — مرتبط بالدومين لا بالمشروع) |
| `PAYPAL_CLIENT_ID` / `NEXT_PUBLIC_PAYPAL_CLIENT_ID` / `PAYPAL_MODE` | نفس لوحة PayPal (Client ID عام بتصميم PayPal) | زر PayPal لا يظهر |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ▸ Admin ▸ Data Streams | انقطاع القياس |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Google AdSense ▸ Account ▸ Settings | انقطاع الإعلانات |

### 2.3 الفئة ج — ذاتية/معرفية (قيمة يعرفها المالك أو تُعاد توليدها)

| المتغير | المصدر | ملاحظة |
|---|---|---|
| `GITHUB_DISPATCH_TOKEN` | PAT جديد من GitHub (Fine-grained على **هذا المستودع فقط**: Actions Read+Write) | يخدم كرون `dispatch-pipelines` — استبداله عملية دقائق |
| `EVO_CRON_SECRET` | سر مشترك ذاتي — يولَّد جديدًا ويُضبط في مكانه الوحيد (بيئة Vercel) | مستقل عن `CRON_SECRET` عمدًا (تدوير منفصل — SECURITY §3.3) |
| `EVO_FOLLOWUP_ENABLED` / `EVO_FOLLOWUP_FROM` | قيم تشغيلية معروفة للمالك (علم + عنوان مُرسل) | مسار المتابعة الأسبوعية opt-in |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` | عناوين بريد المشروع (المُرسل عبر Brevo) | مضبوطة أصلًا كنص في `.env.example` |
| `NEXT_PUBLIC_SITE_URL` | `https://alkemos.com` — قيمة ظاهرة غير سرية (type: plain في Vercel) | — |

### 2.4 الفئة د — قيم Supabase (كلها من لوحة المشروع عند الحاجة)

| المتغير | ملاحظة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام المعتمد للعميل |
| `SUPABASE_URL` | اسم بديل (alias) يقبله سكربتات التشغيل (`db-backup`/`db-restore`/`retro-pair-blog`) بدلًا من `NEXT_PUBLIC_SUPABASE_URL` |

## 3. المتغيرات الميتة/الزائدة في بيئة Vercel (مرشحات للتنظيف بقرار المالك)

> نتيجة فحص الاستخدام المقيس 2026-09-20 — وجودها بلا مستهلك كودي. حذفها من Vercel قرار مالك (لا يوجد أي أثر تشغيلي متوقع، والحذر واجب قبل أي حذف: أعِد مسح الاستخدام أولًا).

| المتغير | الدليل على الموت |
|---|---|
| `SUPABASE_JWT_SECRET` | صفر مراجع في الكود كله |
| `SUPABASE_SECRET_KEY` · `SUPABASE_PUBLISHABLE_KEY` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | صفر مراجع — صيغ تسمية بديلة قديمة لنفس قيم Supabase |
| `SUPABASE_ANON_KEY` (الصيغة الخادمية) | صفر مراجع خادمية مستقلة (كل الاستخدام للصيغة `NEXT_PUBLIC_`) |
| `EVO_PARTNER_API_ENABLED` | ميزة EVO-6 أزيلت — والمرجع الوحيد المتبقي هو **حارس stale-refs الذي يحظر إحياءها** (استخدامها انتهاك للبوابة) |

## 4. جدول صلاحية التوكنات (مقيس 2026-09-20 — من ملحق أ بالتقرير)

| التوكن | الحالة | صلاحياته المقيسة | الاستخدام الآمن |
|---|---|---|---|
| GitHub الثاني (`ghp_SVSr…`) | **حي** | repo + workflow | قراءة/كتابة المستودعات + workflows |
| GitHub fine-grained (`github_pat_…`) | **حي** | admin على المستودعين (alkemos + musclehubeg-backups) | توكن الاسترداد الرئيسي |
| GitHub الأول (`ghp_4zzo…`) | **ميت** (أُعيد إثباته حيًا 2026-09-20 مساءً: 401 Bad credentials) | — | يُسحب من اللوحة (خطوات الواجهة أدناه — P2-10) |
| Vercel الثاني (`vcp_5GKJ…`) | **حي** | OWNER على الفريق | إدارة المشروع |
| Vercel الأول (`vcp_7Hxo…`) | **ميت** (أُعيد إثباته حيًا 2026-09-20 مساءً: 404 User not found) | — | يُسحب من اللوحة (خطوات الواجهة أدناه — P2-10) |
| Supabase (`sbp_…`) | **حي** | Management API | قراءة/إدارة المشروع |
| Cloudflare الأول (`cfut_…`) | **حي** | قراءة DNS + الإعدادات | فحص/تعديل سجلات المنطقة |
| Cloudflare الثاني (`cfut_…`) | **حي** | قراءة المناطق (بلا DNS) | فحص عام |

> **إجراءات المالك لواجهات التوكنات (2026-09-20 — لا مسار API لأي منها؛ حد منصة لا نقص صلاحيات):**
> 1. **فحص انتهاء `BACKUP_REPO_TOKEN` (أهم بند — B3):** من متصفح حساب المالك: `github.com/settings/personal-access-tokens` (fine-grained) ▸ ابحث بين الـ fine-grained عن توكن منشأ حوالي 2026-09-05 (ميلاد مسار النسخ — إن لم تعرفه بالاسم فهو المرشح الوحيد المخصص لمستودع النسخ؛ أسماؤه وإنشاؤه بيد المالك) ▸ افتح صفحته ▸ اقرأ حقل **Expiration** وتاريخ آخر استخدام (Last used) — آخر استخدام يومي ناجح = هو التوكن الصحيح. لو تبقّى ≤30 يومًا: أنشئ بديلًا بصلاحيات Contents: Read+Write على مستودع `musclehubeg-backups` فقط + Read على `alkemos`، ثم حدّث الـ secret من صفحة المستودع ▸ Settings ▸ Secrets ▸ Actions ▸ `BACKUP_REPO_TOKEN` ▸ Update. النجاح: أول نسخة يومية تلو التحديث خضراء (05:30/05:45/06:00 UTC) والباقي بلا تغيير.
> 2. **سحب التوكن الميت الأول (GitHub):** `github.com/settings/tokens` ▸ تبويب Tokens (classic) ▸ حدد الصف الذي يطابق `ghp_4zzo…` (GitHub يعرض أول أحرف فقط) ▸ Delete ▸ أدخل كلمة المرور للتأكيد. النجاح: يختفي الصف — لا أثر تشغيليًا (التوكن ميت أصلًا).
> 3. **سحب التوكن الميت الثاني (Vercel):** `vercel.com/account/settings/tokens` ▸ حدد الصف المطابق لـ `vcp_7Hxo…` ▸ View/Delete ▸ Confirm. النجاح: يختفي الصف — لا أثر تشغيليًا (ميت أصلًا). راجع عادةً قائمة التوكنات كاملة وأزل أي إدخال آخر غير مستخدم.
>
> **ملاحظة انحراف موثقة (B9):** حقل `serverlessFunctionRegion` في API المشروع يعرض `iad1` بينما التشغيل الفعلي الحاكم هو `fra1` من `vercel.json` (شهد حي: `x-vercel-id: …::fra1`). `vercel.json` هو المرجع دائمًا.

## 5. قواعد التدوير والإضافة (تمنع تكرار الفجوة)

1. **متغير جديد = صف جديد هنا + سطر في `.env.example` بنفس الفريم** (إن كان حيًّا كوديًا) — وإلا فهو تغيير ناقص (§3.8).
2. **التدوير المزدوج:** كل سر مشترك بين Vercel وGitHub Actions (`CRON_SECRET` مثلًا) يُحدَّث في الموضعين بنفس العملية — نسيان أحدهما يعطل مسارًا صامتًا.
3. **السر الذاتي** (المولَّد لدينا: `CRON_SECRET` · `EVO_CRON_SECRET`) يُدوَّر بتوليد قيمة جديدة ثم تحديث مواضعه المذكورة أعلاه فقط.
4. **سر مزود خارجي** يُدوَّر من لوحة المزود أولًا ثم يُحدَّث موضعاه (Vercel/Actions) — الترتيب مهم لضمان استمرارية الخدمة.
