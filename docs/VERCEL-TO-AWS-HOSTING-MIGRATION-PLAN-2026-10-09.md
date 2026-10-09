# خطة نقل الاستضافة من Vercel إلى AWS — فحص وتخطيط فقط — 2026-10-09

> **النطاق:** فحص وتجهيز خطة نقل **الاستضافة فقط** (طبقة الويب Next.js) من Vercel إلى Amazon AWS، لحساب AWS على الخطة المجانية (نافذة 6 أشهر من فتح الحساب). **لا تنفيذ قبل موافقة المالك** على هذا التقرير والخطة — أمر المالك 2026-10-09. لا إنشاء موارد، لا نشر، لا DNS، لا لمس أسرار أو إعدادات إنتاج أو منطق تطبيق أو قاعدة بيانات أو مزودي AI.
> **المنهجية:** قراءة فعلية للمستودع عند رأس main ‏`17a5a66f` + **بناء وتشغيل فعلي للتطبيق خارج Vercel بالكامل** في بيئة معزولة (bun 1.3.14 بنفس `bun.lock` المجمّد، Node 24، بلا أي متغيرات بيئة = وضع demo المصمم بالكود) + أسعار وتفاصيل AWS موثقة ببحث ويب 2026-10-09. كل بند أدناه موسوم: **مقيس** (تحقق فعلي هذه الجلسة) · **موثق** (من مستندات AWS/المستودع) · **Assumption** (افتراض معلن) · **Unknown** (تعذر التحقق — لا تخمين). التقرير المالي الشامل السابق (بنية كاملة مقابل AWS): `docs/archive/AWS-COST-AUDIT-2026-10-09.md` — هذا المستند مكمله التنفيذي لطبقة الاستضافة وحدها.
> **الحصيلة بجملة:** التطبيق **متوافق توافقًا مقيسًا** مع التشغيل المباشر على Ubuntu+Node+PM2 (بُني وخدم الطلبات خارج Vercel في دقائق)، بفجوة واحدة عُلِمَت وقابلها (headers الأمان تعيش في `vercel.json` فقط)، والتوصية: **Lightsail ‏$12/ش (2 vCPU/2GB) — Node 22 + PM2 بدون Docker — بناء في GitHub Actions ونشر SSH — Caddy للـ HTTPS** = **$0 نقدًا خلال نافذة الأرصدة ثم $12/ش ثابتة**، مع تراجع آمن إلى Vercel بتغيير DNS فقط.

---

## 1. التوصية التنفيذية

| البند | التوصية | البديل |
|---|---|---|
| **طريقة التشغيل** | **Next.js مباشرة على Ubuntu 24.04: Node 22 LTS + PM2 + `next start`** — بدون Docker ولا تعديل `next.config.ts` ولا `output: standalone` | Docker على Lightsail/EC2: يرفع التعقيد (registry/صور/بناء) بلا أي منفعة لهذا التطبيق (§7) |
| **الحساب** | **Lightsail ‏$12/ش — 2 vCPU / 2GB RAM / 60GB SSD / 3TB نقل** — المنطقة **eu-central-1 (فرانكفورت)** لمجاورة Supabase (eu-central-1) ومطابقة fra1 الحالية | EC2 ‏t4g.small (2GB) + EBS 30GB ‏≈ $15–16/ش — نفس الأداء، فواصل فوترة وموارد منفصلة وأوامر أكثر |
| **التكلفة خلال نافذة الأرصدة (6 أشهر)** | **$0 نقدًا** — الأرصدة $200 تغطي Lightsail (وثّقت AWS ذلك على re:Post كبديل تجربة الـ3 أشهر القديمة) — **شرط التحقق 0-أ قبل الشراء** | إن لم تنطبق الأرصدة على Lightsail بحسابك: ‏EC2 t4g.small مغطاة بالأرصدة قطعًا → $0 نقدًا طوال النافذة |
| **التكلفة بعد النافذة** | **$12/ش ثابتة شاملة** (لا فوترة منفصلة للقرص/النقل/IP الثابت) | خطة توفير لاحقة: Lightsail ‏$7/ش (2 vCPU/1GB) إن أظهر القياس ذاكرة مستقرة <700MB — قرار بقياس فعلي بعد أسبوعين |
| **خط النشر** | بناء في **GitHub Actions** (نفس بيئة quality-gate المثبتة: bun frozen + Node 22) → نقل `.next + public + bun.lock` عبر SSH → `bun install --production` على الخادم (ثوانٍ) → `pm2 reload` | البناء على الخادم نفسه: ممكن (94 ثانية مقيسة) لكنه يستهلك RAM/وحدة المعالجة ويُستبقى كخطة طوارئ فقط |
| **HTTPS** | **Caddy** (تلقائي Let's Encrypt) + إبقاء **Cloudflare** أماميًا كما هو (كاش HTML الرسمي + القواعد الأربع الحية) | nginx+certbot: نفس النتيجة بضبط يدوي أكثر |
| **التراجع إلى Vercel** | **تغيير DNS فقط** (5–15 دقيقة) — مشروع Vercel يظل حيًا يبني مع كل push (شرط قانون `[vercel skip]` للتوثيق فقط) | — |

**لماذا هذا الخيار هو «الأبسط والأقل تكلفة والأنسب» معًا:** التطبيق عديم الحالة (صفر كتابات على نظام ملفات الخادم — مقيس بالفحص)، كل حمل الـAI الثقيل (توليد المقالات p0–p5 ومعالجة `ai_jobs`) يعمل **in-process على GitHub Actions runners** (مقيس: `run-step.mts` يستورد معالجات المسارات مباشرة ولا يلمس الـURL الحي)، والنسخ الاحتياطي كله (DB/Storage/Drive) يعمل من Actions — أي أن الخادم مجرد **خادم ويب خفيف**: الحمل المقيس بعد ISR ‏~10–15K استدعاء/يوم (≈ ‏0.2 طلب/ثانية) وصادر 10.69GB/30 يوم وCPU ‏20.014 GBh/30 يوم (توثيق worklog ‏VERCEL-USAGE-9). هذا حجم لا يبرر Docker ولا حوسبة مُدارة ولا أكثر من 2GB RAM.

---

## 2. ما تم قياسه فعليًا هذه الجلسة (الأدلة — بيئة معزولة خارج Vercel)

| القياس | النتيجة | الدلالة |
|---|---|---|
| `bun install --frozen-lockfile` | 637 حزمة في **3.7 ث** | نفس شجرة إنتاج CI/Vercel بالضبط (لا انحراف npm) |
| `next build` (بلا أي env = وضع demo) | **نجح في 94 ثانية** — توليد Static/SSG/ISR/Dynamic كاملًا | البناء لا يحتاج Vercel إطلاقًا |
| صفحات مسبقة التصيير (demo) | **2,102 صفحة HTML** (مع env الحقيقي: 2,294 موثقة بSTATE 346 — الفرق صفحات blog/foods/coaches التي تسحب بيانات Supabase) | `generateStaticParams` ‏24 مسارًا + `revalidate` ‏33 ملفًا (60ث→7أيام) يعملان خارج Vercel |
| `GET /` (EN) | **200 · ‏288KB · ‏21ms** + هيدرز `content-language: en-US` و`x-pathname: /` | **middleware يعمل كاملًا** (لوكل + كوكيز + جلسات) |
| `GET /` هيدر Cache-Control | `public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400` | **سياسة SEO-GEO-4 من `next.config.ts` headers() تنبعث من الأصل** كما هي |
| `GET /ar` · `/robots.txt` · `/sitemap.xml` | 200 · ‏304KB · ‏808B | الصفحات العربية وSEO سليمة |
| `GET /api/og-image/test?lang=en` | **200 · image/png · ‏99KB · ‏0.53 ث** | **مسار الـedge-runtime الوحيد يعمل على Node عادي** (ساندبوكس edge داخل `next start`) — لم يعد قيدًا |
| `GET /_next/image` | **410 Gone** | حرس حصة الصور يعمل (لا sharp ولا محسّن صور مطلوب — قانون `unoptimized: true`) |
| `GET /api/build-info` | 200 ‏JSON بلا commit (متوقع بلا env) | **fallback ‏`GITHUB_SHA`/`GITHUB_REF_NAME` جاهز بالكود** — خط النشر سيضخهما |
| هيدرز الأمان (CSP/HSTS/X-Frame-Options…) | **غائبة من استجابة الأصل** | **الفجوة الوحيدة** — تعيش في `vercel.json` فقط ‏→ §4 (نسخها الحرفي في Caddy) |

> **قياس لم يُنفَّذ ويُصرَّح به:** البناء بمفاتيح Supabase الحقيقية (سرية، لا تتوفر لهذه الجلسة القراءة-فقط) — سيحدث حتمًا في أول تشغيل لسير عمل النشر داخل Actions التي تملك الأسرار أصلًا. تشغيل OAuth/PayPal الحقيقي يحتاج الدومين — مؤجل لبطارية التحقق (§9 مرحلة 4).

---

## 3. مصفوفة التوافق الكاملة

| العنصر | النتيجة | التفصيل |
|---|---|---|
| **API Routes (77 مسارًا/25 مجموعة)** | ✅ متوافقة | كلها Node runtime ما عدا og-image (edge — ‏**مقيس يعمل**). لا استخدام لأي API خاص بـVercel |
| **Middleware** | ✅ **مقيس** | Supabase session refresh + PKCE + لوكل + حرس 410 — كله قياسي ويعمل بـ`next start` |
| **ISR / SSG** | ✅ **مقيس** | `revalidate` ‏60ث/5د/1س/1ي/7ي + `generateStaticParams` + `dynamicParams=true` — كاش ISR داخل `.next/cache` على الخادم |
| **SSR/Dynamic** | ✅ | `(app)` layouts ‏`force-dynamic` — عادي على خادم دائم (أفضل من serverless: لا cold start إطلاقًا) |
| **المصادقة والكوكيز** | ✅ متوافقة | `@supabase/ssr` كوكيز `sb-*` قياسية — لا تعتمد على الاستضافة. الجولة الكاملة (OAuth/دعوات/OTP) **غير مقيسة** هنا — بطارية مرحلة 4 |
| **Supabase (DB/Auth/Storage)** | ✅ لا تتأثر إطلاقًا | خدمة خارجية (eu-central-1) — الخادم يتصل بها كما يتصل Vercel. **لا تغيير على RLS ولا الميجريشنز** |
| **متغيرات البيئة** | ✅ نقل يدوي واحد | 29 مفتاحًا مصنفًا سلفًا بـ`VERCEL-BACKUP-MIGRATION-PLAN-2026-10-03.md` §12/§13 (منها 8 Sensitive يدويًا) — نسخة إلى `/srv/alkemos/shared/.env` |
| **Bun** | ✅ مدير حزم فقط | Runtime هو Node. الخادم: Node 22 (نفس CI) + bun لتثبيت `--frozen-lockfile --production` بثوانٍ |
| **بث EVO (SSE)** | ✅ متوافقة | `ReadableStream` + `text/event-stream` قياسي + `after()` (Next 16). Caddy افتراضيًا لا يخزّن مؤقتًا (مع `flush_interval -1` صراحةً) |
| **`maxDuration` (21 مسارًا)** | ✅ يُتجاهل بأمان | تلميح Vercel فقط — على خادم دائم لا سقف 60ث؛ مسارات الـ300ث ستكمل (وهي أصلًا تعمل on-runners لا على الويب) |
| **next/image** | ✅ صفر اعتماد | `unoptimized: true` قانونًا — لا sharp، لا `/_next/image` (410) |
| **`VERCEL_GIT_*`** | ✅ fallback جاهز | build-info يقرأ `GITHUB_SHA`/`GITHUB_REF_NAME` — سير عمل النشر يضخهما (منارة النشر تبقى صادقة) |
| **@vercel/analytics (root-shell)** | ⚠️ no-op خارج Vercel | يُبقى كما هو (تماثل التراجع + لا يضر)؛ إزالته لاحقًا اختيارية تجميلية |
| **vercel.json (كله)** | ⚠️ يقرؤه Vercel فقط | crons → §5 · headers الأمان → §4 · يبقى الملف سليمًا لأن Vercel يظل هدف التراجع |
| **`ignoreCommand`/ignore-step.sh** | ✅ لا معنى له على AWS | يظل يحكم بناء Vercel فقط — سير عمل النشر الجديد يشغَّل يدويًا (workflow_dispatch) حتى القطع |
| **Upstash (حد المعدل)** | ✅ كما هو | أو fallback الذاكرة الداخلية — على خادم واحد يصبح **أدق** من serverless (عدّاد واحد) |

---

## 4. الفجوة الوحيدة: هيدرز الأمان — والعلاج

`vercel.json` يضخ على حافة Vercel سبعة هيدرز أمان (`X-Content-Type-Options` · `X-Frame-Options` · `Referrer-Policy` · `HSTS` · `Permissions-Policy` · `CSP` · `CSP-Report-Only`) — **غابت كلها عن أصل AWS المقيس** لأن `next.config.ts` لم يكررها. العلاج (بدون أي تعديل كود): **نسخها الحرفي في `Caddyfile`** (الملحق ب) — مقارنة بايت-ببايت قبل القطع (مرحلة 4). لاحظ أن CSP-Report-Only يسمح بـ`va.vercel-scripts.com` و`static.cloudflareinsights.com` — يبقى كما هو (تماثل التراجع). هيدرز `Cache-Control` **لا تنقل** — مصدرها الصحيح `next.config.ts` headers() وهي **تعمل مقيسًا**.

---

## 5. المهام المجدولة وسير عمل GitHub Actions واعتمادات Vercel

### 5.1 الوظيفتان المجدولتان على Vercel (crons بـvercel.json)

| المهمة | الجدول (UTC) | بدلها على AWS | تغيير كود؟ |
|---|---|---|---|
| `/api/cron/progress-reminder` | الأحد 07:00 | سطر crontab على الخادم بنفس الجدول + `Authorization: Bearer $CRON_SECRET` مباشرة إلى `127.0.0.1:3000` | **صفر** — المسار محمي أصلًا بـ`verifyCronAuth` (timing-safe، fail-closed) |
| `/api/cron/dispatch-pipelines` | يوميًا 23:40 | مثلها | **صفر** — يستدعي GitHub API بـ`GITHUB_DISPATCH_TOKEN` (متغير بيئة يُنسخ للمخدم) — يعمل من أي مكان |

الوثيقة داخل الكود نفسه تقول حرفيًا: «Vercel cron (**أو خدمة cron خارجية**) تضرب هذا الـendpoint» — المسار مصمم للاستقلال عن مجدول Vercel. crontab الكامل بالملحق ج.

### 5.2 خريطة الـ30 سير عمل (قراءة فعلية)

- **28 سير عمل مستقل تمامًا عن الاستضافة** (يعملون على ubuntu runners ويضربون Supabase/AI/Drive مباشرة): المدونة blog-post-en/ar (22:00/05:00 UTC) · معالجة ai_jobs (كل 10 دقائق + repository_dispatch) · النسخ اليومي db-backup ‏05:30 → ريبو خاص + storage-backup + offsite-gdrive + backup-retention + restore-drills · evo-weekly-* · gemini-weekly · التقارير والمعالجات · external-mirror · **quality-gate** (tsc/eslint/vitest — نفس بيئة البناء المقترحة للنشر) — **لا يتغير منها شيء**.
- **سير عمل واحد مرتبط بـVercel**: `vercel-cleanup.yml` (تنقية deployments لسقوف Hobby التخزينية) — **يبقى يعمل أثناء فترة الازدواج** (Vercel يظل يبني مع كل push كود)، ويصبح مرشحًا للإيقاف بعد استقرار القطع نهائيًا (قرار مالك لاحق، ليس ضمن الخطة).
- **بوابات docs** (docs-parity + guard-stale-refs) تعمل مع كل push — كوميت التوثيق هذا مرّ عليها محليًا قبل الدفع.

### 5.3 اعتمادات Vercel الفعلية الثلاث في الكود (لا رابع لها)

1. `@vercel/analytics` في `root-shell.tsx` — no-op خارج Vercel، يبقى (تماثل تراجع).
2. `VERCEL_GIT_COMMIT_SHA/REF` في build-info — له fallback جاهز.
3. `vercel.json` نفسه (crons + headers) — يقرؤه Vercel وحده ويبقى سليمًا.
(البقية أوهام تاريخية: مسار OG هجر `@vercel/og` إلى `next/og` منذ Phase 151؛ `maxDuration` تلميح نشر لا كود تشغيل.)

---

## 6. مقارنة خيارات AWS (الأهلية للمجانية · الأرصدة · التكلفة بعد العرض · الموارد)

**قاعدة الأرصدة أصلًا (موثقة 2026-10-09):** حسابات ما بعد 2025-07-15 تحصل على خطة مجانية 6 أشهر بـ**أرصدة حتى $200** تغطي الخدمات المؤهلة؛ إجابة AWS الرسمية على re:Post تؤكد أن **Lightsail مشمول بالأرصدة** (بديلًا عن تجربته القديمة «3 أشهر») و**EC2/EBS مشمولان**، بينما **AWS Support مستثنى** و**Route 53 يُفوتر** (لا نحتاجه — DNS يبقى على Cloudflare مجانًا). سقف 750 ساعة t2/t3.micro القديم أصبح **للحسابات القديمة فقط**. الأرصدة تنفد أو تنتهي بعد 6 أشهر من فتح الحساب — أيهما أسبق.

| الخيار | الموارد | الأهلية للأرصدة | خلال النافذة | **بعد النافذة (شهريًا)** | لماذا نعم/لا |
|---|---|---|---|---|---|
| **Lightsail ‏$12 ⭐ الموصى به** | 2 vCPU · 2GB · 60GB SSD · **3TB نقل** · IP ثابت | ✅ (تحقق 0-أ) | **$0 نقدًا** | **$12 شاملة كل شيء** | أبسط فاتورة وأدق تسعير؛ كافٍ بفارق كبير للحمل المقيس؛ لقطة (snapshot) بزر |
| Lightsail ‏$7 | 2 vCPU · 1GB · 40GB · 2TB | ✅ (تحقق 0-أ) | $0 نقدًا | $7 | خيار توفير بعد قياس RAM — 1GB تعمل لكن بهامش أضيق مع OG/satori |
| Lightsail ‏$5 | 2 vCPU · **0.5GB** · 20GB · 1TB | ✅ | $0 نقدًا | $5 | **غير موصى به للإنتاج**: نصف GB تحت `next start` + OG + تحديثات = خطر OOM |
| **EC2 t4g.small (بديل)** | 2 vCPU · 2GB + EBS 30GB | ✅ مؤكدة | $0 نقدًا | ~$12.3 (us-east-1) · **~$13–14 + ‏$2.7 EBS ≈ $15–16 (eu-central-1، تقديرية +5–10%)** + النقل بعد 100GB بـ~$0.09–0.12/GB | نفس الأداء؛ فواصل فوترة (حوسبة+قرص+نقل) وضبط SG/EBS — خذها فقط إن استثنت الأرصدةُ Lightsailَ |
| EC2 t3.micro | 2 vCPU · 1GB | ✅ | $0 | ~$7.6 + ‏$2.4 EBS ≈ **$10** (us-east-1) | x86 قابلة للاندفاع (CPU credits) — أدنى من t4g قيمةً |
| App Runner | 0.25 vCPU · 0.5GB | ✅ (يحرق أرصدة) | $0 | **~$14+** ‏($0.064/vCPU-س + $0.007/GB-س مقيسة بصفحة الأسعار) | أغلى من Lightsail بموارد أضعف + يفرض صور Docker/ECR + لا SSH للتشخيص — مرفوض |
| ECS Fargate | 0.25 vCPU · 0.5GB + ALB | ✅ | $0 | ~$9 حوسبة + **ALB ~$16** ≈ **$25+** | أرضية ALB تقتل الجدوى عند هذا الحجم (موثق أيضًا بتدقيق التكلفة §bill-shock) |
| Amplify Hosting | مُدار usage-based | جزئي | — | ~$5–25 متغيرة (بناء $0.01/د · ‏**نقل $0.15/GB** · رسوم SSR) | «Vercel آخر» بفوترة استخدام — لا تحل مشكلة البساطة وتضيف مخاطرة فاتورة متغيرة |

**المنطقة:** eu-central-1 (فرانكفورت) — تطابق Supabase (eu-central-1) وVercel ‏fra1 الحالية؛ أسعار Lightsail موحدة المناطق، وEC2 فيها أعلى ~5–10% من us-east-1 (أرقام us-east-1 هي المقيسة أعلاه).

---

## 7. لماذا Node+PM2 مباشرة وليس Docker (بلا افتراض أن Docker «ضروري»)

1. **الكود نفسه لا يطلب حاوية:** لا `Dockerfile` ولا `docker-compose` بالمستودع، والتطبيق عديم الحالة (صفر كتابات FS — مقيس) — الحاوية لا تحل أي مشكلة قائمة.
2. **الدليل العملي حاضر:** بناء+تشغيل+استجابة كاملة على Node عادي في <3 دقائق (§2) — بما فيها مسار الـedge الوحيد.
3. **الكلفة التشغيلية لـDocker هنا:** خط إضافي كامل (بناء صورة → دفع لـregistry (ECR) → سحب على الخادم → إدارة إصدارات الصور) + مساحة قرص للصور + فقدان بساطة «عدّل ملفًا وأعد التشغيل» — مقابل صفر منفعة لخادم تطبيق واحد.
4. **Docker يصبح منطقيًا مستقبلًا فقط عند:** تعدد خدمات على نفس الخادم، أو اشتراط توحيد بيئات فريق متعدد، أو حاجة عزل صارم — لا شيء منها قائم.
5. **PM2 يغطي كل ما كانت ستغطيه الحاوية:** إعادة تشغيل عند الانهيار، cluster mode عند الحاجة، إدارة سجلات، تشغيل عند الإقلاع (`pm2 startup`).

---

## 8. التغييرات المطلوبة (كلها إضافية additive — لا تنفَّذ إلا بعد موافقتك)

| # | التغيير | الملف | السبب | الأثر | المخاطرة |
|---|---|---|---|---|---|
| 1 | سير عمل نشر جديد | `.github/workflows/deploy-aws.yml` (جديد — **workflow_dispatch فقط** في مرحلة التحقق؛ تفعيل trigger الـpush عند القطع) | خط النشر من GitHub إلى الخادم | صفر على الإنتاج — لا يعمل إلا بيدك | منخفضة (شغل يدوي + concurrency مضاد) |
| 2 | صف بوابة له | `docs/CI_GATES.md` (صف واحد) | قانون docs_audit: كل ملف workflow يجب أن يكون مغطى | توثيقي | صفر |
| 3 | تعريف عملية PM2 | `ecosystem.config.js` (جديد بالجذر — الملحق أ) | إدارة العملية + إقلاع تلقائي + سجلات | ملف خامل لا يمس Vercel | صفر |
| 4 | إعداد الوكيل العكسي | `deploy/Caddyfile` (جديد — الملحق ب) بالهيدرز الحرفية | HTTPS + هيدرز الأمان (الفجوة §4) + بث SSE | ملف جديد | منخفضة (يُراجع بايت-ببايت بمرحلة 4) |
| 5 | أسرار GitHub جديدة | `AWS_DEPLOY_HOST` · `AWS_DEPLOY_USER` · `AWS_DEPLOY_SSH_KEY` + التأكد من `NEXT_PUBLIC_SUPABASE_ANON_KEY` كسر/متغير (مفتاح عام بطبيعته) | يملك سير العمل ما يلزم للبناء والاتصال | إعدادات GitHub فقط — لا لمس Vercel | منخفضة |
| 6 | ملف بيئة الخادم | `/srv/alkemos/shared/.env` **يجهزه المالك يدويًا** بنسخ قيم Vercel (29 مفتاحًا مصنفًا سلفًا بخطة النسخ الاحتياطي §12/§13) + `GITHUB_SHA/GITHUB_REF_NAME` تُضخ آليًا مع كل نشر | التطبيق يقرأ نفس المتغيرات من أي مكان | لا تغيير كود | تدقيق يدوي (8 قيم Sensitive) |
| 7 | crontab الخادم | سطران بنفس جداول UTC (الملحق ج) | بديل مشغّل Vercel cron | صفر كود | منخفضة |
| 8 | **ما لن يُمَس إطلاقًا** | `src/**` · `next.config.ts` (لا standalone — القانون الموثق بملفه يمنعه على Vercel، وخط النشر يشحن `.next` كاملًا فيستغني عنه) · `vercel.json` · `supabase/**` · كل الـworkflows القائمة · DNS · مفاتيح AI | — | — | — |

> ملاحظة `output: standalone`: ممنوعة بالمستودع صراحةً لأنها تكسر خطوة Vercel. الخطة المختارة (شحن `.next` كاملًا + `bun install --production` على الخادم) **لا تحتاجها أصلًا** — وبذلك يبقى ملف الإعداد بلا أي تعديل. إن رُغب مستقبلًا في تقليص حزمة النشر، فالبديل الآمن هو شرط بيئة (`output: process.env.AWS_STANDALONE === "1" ? "standalone" : undefined`) — مؤجل بلا حاجة.

---

## 9. خطة التنفيذ المختصرة (قابلة للتنفيذ عند الموافقة — المدد تقديرية)

**المرحلة 0 — تحقق المالك قبل أي شيء (~15 دقيقة):** (أ) من وحدة تحكم AWS ‏(`Billing ▸ Credits`): أن الأرصدة نشطة ومتبقية وأن **Lightsail من الخدمات المشمولة** — إن لم يكن: البديل EC2 ‏t4g.small فورًا؛ (ب) صلاحية توكن `GITHUB_DISPATCH_TOKEN` (سيُنسَل إلى بيئة الخادم)؛ (ج) مراجعة قائمة الـ29 متغيرًا من Vercel.

**المرحلة 1 — تجهيز الخادم (~45 دقيقة):** إنشاء Lightsail ‏$12 ‏eu-central-1 ‏Ubuntu 24.04 + IP ثابت → جدار الحماية: ‏22 (IPك فقط) · 80 · 443 → تثبيت Node 22 (NodeSource) + bun + PM2 + Caddy → إنشاء `/srv/alkemos/{releases,shared}` ومستخدم نشر بمفتاح SSH. (سكربت التجهيز الكامل: الملحق هـ.)

**المرحلة 2 — ملفات التطبيق على الخادم (~15 دقيقة):** `ecosystem.config.js` + `Caddyfile` (بالملحقين) + `/srv/alkemos/shared/.env` (نسخة المالك) + crontab (الملحق ج) + `pm2 startup && pm2 save`.

**المرحلة 3 — خط النشر (~45 دقيقة):** إضافة أسرار GitHub → فتح PR بالتغييرات 1–4 (فوق فرع، لا main مباشرة) → دمج → **تشغيل deploy-aws.yml يدويًا** → تحقق `build-info` يطابق SHA.

**المرحلة 4 — بطارية التحقق على الأصل قبل أي DNS (~60 دقيقة):** فحص الخادم عبر IP مع `--resolve alkemos.com:<IP>:443` (أو نطاق فرعي مؤقت): الصفحات الستة الكبرى ISR ‏(`x-nextjs-cache`/عمر الكاش) · مقارنة **هيدرز الأمان بايت-ببايت** مع حافة Vercel الحالية · `/api/build-info` · robots/sitemaps/rss/llms · جولة OAuth كاملة (دخول Google + PKCE) · رفع صورة (Supabase Storage) · بث EVO (SSE حي) · OG عربي/إنجليزي · PayPal sandbox (إنشاء طلب + webhook) · المساران المجدولان يدويًا بـBearer · سقوط متعمد لعملية PM2 والتحقق من النهوض. **لا يُتجاوز هذا الباب إلا باخضرار كل بند.**

**المرحلة 5 — القطع (~15 دقيقة + مراقبة 48 ساعة):** خفض TTL سجل DNS إلى 300 (مسبقًا بيوم) → في Cloudflare: توجيه `alkemos.com` ‏A/AAAA إلى IP الخادم (بروكسي CF كما هو، SSL ‏**Full-strict**) و`www` كالعادة → مراقبة: `build-info` · معدل الأخطاء · سجلات PM2 · CF Analytics · مؤشر الاستخدام (إن ظهر Vercel يستقبل شيئًا فشيء خاطئ).

**المرحلة 6 — ما بعد الاستقرار:** تنبيه **AWS Budget ($5/ش)** (مجاني) + مراقب uptime خارجي (UptimeRobot/Better Stack مجاني) على `/api/build-info` + `pm2-logrotate` + لقطة أسبوعية للخادم (سناربشوت — كلفة سنتات) + بعد أسبوعين: قرار خطة الـ$7 (إن ثبت RAM ‏<700MB) أو البقاء على $12.

**التقدير الزمني الكلي:** ~4–5 ساعات عمل فعلي موزعة على يوم–يومين، مع نافذة قطع 15 دقيقة وتراجع دائمًا متاح خلالها وبعدها.

---

## 10. HTTPS وCloudflare (بلا أي تغيير DNS الآن)

الوضع الحالي: DNS على Cloudflare (زون Free) ببروكسي أمامي وكاش HTML رسمي (قاعدة `alkemos cache rules` + RSC bypass — أربع قواعد حية موثقة). الخطة **لا تغير شيئًا في Cloudflare سوى عنوان الأصل** وقت القطع (سجل A/AAAA واحد). شهادة الأصل: **Caddy يجلب Let's Encrypt تلقائيًا** عبر HTTP-01 — يعمل خلف بروكسي CF طالما SSL mode = Full-strict (الحالي). البديل إن حدث تعارض: شهادة **Cloudflare Origin CA** (15 سنة، من لوحة CF، توضع في Caddy يدويًا). الحجب: ‏80/443 فقط، وSSH مقيد بعنوان المالك.

---

## 11. المراقبة والنسخ الاحتياطي

- **النسخ الاحتياطي لا يتغير إطلاقًا:** DB يومي 05:30 UTC → الريبو الخاص (db-backup) · Storage → GDrive خارجي (GFS ‏7/5/6 · ‏0.291GiB/12GB مقيس) · استعادة مجربة بدريلات — كلها من GitHub Actions ومستقلة عن الاستضافة. الخادم نفسه عديم الحالة → «نسخته» = ملفات Git + `.env` + سكربتات الملحقات (لقطة سناربشوت الأسبوعية تحفظ الإعداد كله كضمانة رابعة).
- **المراقبة:** `pm2 monit` + سجلات مُدارة (logrotate) · فحص خارجي مجاني على `build-info` · مقاييس Lightsail/EC2 الأساسية (مجانية: CPU/شبكة/قرص) · منارة النشر `/api/build-info` (العقد محفوظ بالكود) · AWS Budget كحارس Bill Shock. لا CloudWatch تفصيلي مدفوع.

---

## 12. التراجع الآمن إلى Vercel (متاح في أي لحظة — قبل القطع وبعده)

| الخطوة | الفعل | الزمن |
|---|---|---|
| 1 | في Cloudflare: إعادة سجل `alkemos.com` إلى قيم Vercel (A/CNAME كما كانت — محفوظة بمرحلة 5) | دقيقة |
| 2 | الانتظار حتى TTL (خُفض إلى 300 قبل القطع) | 5–15 دقيقة |
| 3 | تحقق: `build-info` يظهر نشر Vercel الحالي + جولة دخول | دقائق |
| 4 | (اختياري) إيقاف سير عمل النشر إلى AWS + إيقاف/حذف الخادم | عند الرغبة |

**لماذا التراجع نظيف بهذه الدرجة:** كل التغييرات إضافية (لا كود تطبيق تغيّر) · مشروع Vercel ظل يبني مع كل push طوال فترة الازدواج (نفس آخر SHA) · قاعدة البيانات لم تفارق Supabase · Vercel-cleanup ظل يدير الاحتفاظ. **لا خطوة تراجع تلمس الكود أو البيانات.** (حساب Vercel الاحتياطي البارد `aalkemos` — خطة النسخ §13 — أصل DR منفصل، لا دور له هنا ويبقى كما هو.)

---

## 13. التكلفة المتوقعة (تفصيل شهري USD)

| البند | خلال نافذة الأرصدة (حتى 6 أشهر من فتح الحساب) | بعدها |
|---|---|---|
| Lightsail ‏$12 (الموصى به) | **$0 نقدًا** (يستهلك ~$72 من أرصدة الـ$200 على 6 أشهر) | **$12.00** |
| سناربشوت أسبوعي (~2–5GB مستخدمة) | $0–0.25 | ~$0.10–0.25 |
| بيانات صادرة | $0 (ضمن 3TB الخطة) | $0 (10.69GB/30ي مقيس ≪ 3TB) |
| Route 53 / DNS | $0 (يبقى Cloudflare) | $0 |
| **الإجمالي** | **$0 نقدًا** (ضمن الأرصدة — شرط تحقق 0-أ) | **≈ $12–13/ش** |

سنة أولى تقديرية: **~$75–95 إجمالًا** (6 أشهر $0 + 6 أشهر × $12–13). مقارنة مرجعية: Vercel Pro ‏$20/ش ($240/سنة) للطريق التجاري، وخيار (ب) بتدقيق التكلفة (Lambda+خارجي) ‏$0–3/ش لكنه ليس نقل استضافة بل إعادة بناء. البدائل بعد النافذة: EC2 ‏t4g.small ‏eu-central-1 ≈ $15–16/ش (مؤهلة للأرصدة قطعًا إن بدأت بها)، Lightsail ‏$7 ≈ خيار توفير بقياس RAM.

---

## 14. نقاط لم يتم التحقق منها (Unknown — مسجلة بلا تخمين)

1. **أهلية Lightsail لأرصدة حسابك تحديدًا** (الموثق عام على re:Post؛ حسابك قد يختلف وضعه) — بند التحقق 0-أ الحاسم، وبديله الجاهز EC2.
2. **الرصيد المتبقي** من الـ$200 في حسابك (استُهلك شيء؟ — يظهر في Billing).
3. **البناء بمفاتيح Supabase الحقيقية على AWS runner** (الأسرار غير متاحة لهذه الجلسة) — أول تشغيل لسير العمل سيحسمه؛ البنية المؤشر عليها خضراء (demo-mode بنى 2,102 صفحة، وCI نفسه يبني بنجاح لمفاتيح Vercel).
4. **جولات OAuth/PayPal-webhook الحية ضد أصل AWS** — تحتاج الدومين؛ مؤجلة لبطارية مرحلة 4 المتعمدة.
5. **استهلاك RAM/CPU الفعلي تحت حركة الإنتاج** (لا وصول للقياسات هذه الجلسة) — الحمل المقيس (~0.2 req/s بعد ISR) يرجّح راحة كبيرة على 2GB؛ القياس الفعلي أسبوع ما بعد القطع يقرر خطة الـ$7.
6. **تكافؤ أداء أول تحميل (PSI) بين الأصلين** — نفس البنية ونفس الكاش الأمامي (CF) فالتوقع التكافؤ، ويُقاس بمرحلة 4.
7. **حالة مفاتيح فردية** (Brevo/PayPal live؟/GITHUB_DISPATCH_TOKEN صلاحية) — يملكها المالك وحده عند نسخ `.env`.

---

## 15. ما أنتظره منك قبل أي تنفيذ

- [ ] **موافقة صريحة** على هذا التقرير والخطة (أو تعديلاتك عليها).
- [ ] ناتج التحقق 0-أ (أرصدة/Lightsail من Billing console) — يحدد Lightsail مقابل EC2.
- [ ] عند التنفيذ فقط: نسخ الـ29 متغيرًا إلى `.env` الخادم + إنشاء مفتاح SSH للنشر وإضافته كأسرار GitHub.

بعد موافقتك تُنفَّذ المراحل 0→6 بالترتيب، وكل مرحلة توقف تفتيشي قبل التي تليها، والقطع (مرحلة 5) بأمر منفصل منك بعد اكتشاف بطارية المرحلة 4 بالكامل.

---

## ملحق أ: `ecosystem.config.js` (PM2 — يُنشأ عند التنفيذ)

```js
// PM2 process definition — Alkemos production origin (AWS).
// صفر اقتران بـVercel؛ worker واحد كافٍ للحمل المقيس (~0.2 req/s بعد ISR)
// — ارفع instances إلى 2 عند الحاجة (cluster mode) بعد قياس RAM.
module.exports = {
  apps: [
    {
      name: "alkemos",
      cwd: "/srv/alkemos/current",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      exec_mode: "fork", // cluster عند الحاجة لاحقًا
      instances: 1,
      max_memory_restart: "1500M", // صمام أمان على خطة 2GB
      env: { NODE_ENV: "production", PORT: "3000", HOSTNAME: "127.0.0.1" },
      time: true,
      out_file: "/var/log/alkemos/out.log",
      error_file: "/var/log/alkemos/error.log",
    },
  ],
};
```

## ملحق ب: `deploy/Caddyfile` (الهيدرز حرفية من `vercel.json` — تُراجع بايت-ببايت بمرحلة 4)

```caddyfile
# Alkemos — Caddy origin (AWS). TLS تلقائي (Let's Encrypt HTTP-01)
alkemos.com {
        encode zstd gzip
        header {
                X-Content-Type-Options "nosniff"
                X-Frame-Options "SAMEORIGIN"
                Referrer-Policy "strict-origin-when-cross-origin"
                Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
                Permissions-Policy "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()"
                Content-Security-Policy "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'"
                Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://static.cloudflareinsights.com https://*.adtrafficquality.google https://va.vercel-scripts.com https://www.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.groq.com https://api.github.com https://api.pwnedpasswords.com https://*.google-analytics.com https://analytics.google.com https://*.adtrafficquality.google; frame-src https://www.paypal.com https://www.sandbox.paypal.com https://googleads.g.doubleclick.net https://td.doubleclick.net https://www.youtube.com https://www.google.com https://*.adtrafficquality.google; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
                -Server
        }
        # بث SSE بلا تخزين مؤقت + مهل مفتوحة تكفي مسارات الـ300ث
        reverse_proxy 127.0.0.1:3000 {
                flush_interval -1
        }
}
www.alkemos.com {
        redir https://alkemos.com{uri} permanent
}
```

> ملاحظة: هيدرز `Cache-Control` **غير موجودة هنا عمدًا** — مصدرها `next.config.ts` headers() وهي تعمل مقيسًا من الأصل، والكاش الرسمي هو قاعدة Cloudflare الحالية.

## ملحق ج: crontab الخادم (بديل Vercel crons — نفس الجداول UTC حرفيًا)

```cron
# /etc/cron.d/alkemos  —  CRON_SECRET من /srv/alkemos/shared/.env
CRON_SECRET_FILE=/srv/alkemos/shared/.cron_secret
# progress-reminder — الأحد 07:00 UTC (كانت Vercel: "0 7 * * 0")
0 7 * * 0 deploy curl -fsS -m 150 -H "Authorization: Bearer $(cat $CRON_SECRET_FILE)" http://127.0.0.1:3000/api/cron/progress-reminder >> /var/log/alkemos/cron.log 2>&1
# dispatch-pipelines — يوميًا 23:40 UTC (كانت Vercel: "40 23 * * *")
40 23 * * * deploy curl -fsS -m 90 -H "Authorization: Bearer $(cat $CRON_SECRET_FILE)" http://127.0.0.1:3000/api/cron/dispatch-pipelines >> /var/log/alkemos/cron.log 2>&1
```

## ملحق د: `.github/workflows/deploy-aws.yml` (يُنشأ عند التنفيذ — workflow_dispatch فقط)

```yaml
name: Deploy to AWS origin (alkemos)
on:
  workflow_dispatch: {}          # عند القطع: أضف push→main مع paths-filter
concurrency: { group: deploy-aws, cancel-in-progress: false }
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      NEXT_PUBLIC_SITE_URL: https://alkemos.com
      NEXT_TELEMETRY_DISABLED: "1"
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 22 }
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: "1.3.14" }     # نفس إصدار CI/Vercel
      - run: bun install --frozen-lockfile
      - run: bun run build
      - name: Package release
        run: tar -czf release.tgz .next public package.json bun.lock next.config.ts ecosystem.config.js
      - name: Upload release
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.AWS_DEPLOY_HOST }}
          username: ${{ secrets.AWS_DEPLOY_USER }}
          key: ${{ secrets.AWS_DEPLOY_SSH_KEY }}
          source: "release.tgz"
          target: "/srv/alkemos/releases/${{ github.sha }}"
      - name: Activate, install, reload, verify
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.AWS_DEPLOY_HOST }}
          username: ${{ secrets.AWS_DEPLOY_USER }}
          key: ${{ secrets.AWS_DEPLOY_SSH_KEY }}
          script: |
            set -e
            R=/srv/alkemos/releases/${{ github.sha }}
            cd "$R" && tar -xzf release.tgz && rm release.tgz
            bun install --frozen-lockfile --production
            # منارة النشر: عقد الكوميت للـruntime (عقد build-info محفوظ)
            printf '\nGITHUB_SHA=%s\nGITHUB_REF_NAME=%s\n' '${{ github.sha }}' '${{ github.ref_name }}' >> /srv/alkemos/shared/.env.deploy
            cat /srv/alkemos/shared/.env /srv/alkemos/shared/.env.deploy > "$R/.env"
            ln -nfs "$R" /srv/alkemos/current
            mkdir -p /var/log/alkemos
            cd /srv/alkemos/current
            pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
            sleep 3
            curl -fsS http://127.0.0.1:3000/api/build-info | tee /dev/stderr | grep -q '${{ github.sha }}' && echo "DEPLOY VERIFIED"
```

## ملحق هـ: سكربت تجهيز الخادم (مرة واحدة — Ubuntu 24.04)

```bash
#!/usr/bin/env bash
# deploy/setup-server.sh — يُشغَّل مرة واحدة على Lightsail/EC2
set -euo pipefail
# Node 22 + bun + PM2 + Caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs caddy
curl -fsSL https://bun.sh/install | bash && ~/.bun/bin/bun --version
sudo npm i -g pm2
# بنية الإصدارات + المستخدم + السجلات
sudo mkdir -p /srv/alkemos/{releases,shared} /var/log/alkemos
sudo useradd -m deploy || true && sudo chown -R deploy:deploy /srv/alkemos /var/log/alkemos
# بيئة التطبيق (الملك ينسخ القيم من Vercel):
sudo -u deploy cp /dev/null /srv/alkemos/shared/.env   # ← ثم حرّره بالقيم الـ29
# إقلاع تلقائي + دوران السجلات
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
pm2 install pm2-logrotate
```

> **تنبيه أمني دائم (خارج نطاق هذه الخطة):** المفاتيح التي شاركتَها نصًا في محادثات سابقة (GitHub/Vercel/Supabase/Cloudflare) يجب **تدويرها** في أقرب فرصة — ظهورها نصًا يعتبر تسريبًا بغض النظر عن هذا التقرير. (مُسجَّل أيضًا بمدخل worklog لتدقيق التكلفة.)

