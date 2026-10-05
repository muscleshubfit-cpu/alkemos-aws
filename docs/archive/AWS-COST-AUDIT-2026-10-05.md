# AWS Cost Audit — Alkemos (قراءة فقط) — 2026-10-05

> **النطاق:** Audit مالي قراءة-فقط لتقدير تكلفة تشغيل Alkemos على بنية AWS، مع مقارنة استخدام AWS بموارد خارجية ومكونات Open Source (SST Ion/OpenNext) — **صفر تعديل كود، صفر migration، صفر تغيير بنية.**
> **المنهجية (مصادر حقيقية لا افتراضات):** الكود الفعلي على `main` (0dfceec0) + قياسات API حية 2026-10-05 (Vercel Projects/Deployments · Supabase Management · اختبار توكنات Cloudflare) + القياسات المثبتة في المستودع (دريل الاستعادة 37238006004: 54 جدولًا · 22 مستخدم auth · 30 كائنًا/10 باكت · خط أساس GSC المقيس 4,172 انطباعًا/28 يومًا) + أسعار أكتوبر 2026 (AWS on-demand · Supabase · Vercel). كل رقم غير مقيس موسوم **Assumption**، وكل بيانات غير متاحة موسومة **Unknown** — لا تخمين.
> **دقة التقديرات:** ±30% · عملة USD شهريًا · أسعار on-demand كخط أساس مع إشارة أثر التزامات التوفير (Savings Plans/Reserved) حيث يلزم.

---

## 1. البنية الفعلية المقيسة → ما يقابلها على AWS

| المكوّن | الحالي (مقيس من الكود/API) | المقابل على AWS | ملاحظة الانتقال |
|---|---|---|---|
| Compute | Vercel Serverless (fra1، Hobby، Node 24) — Next.js 16، 61 مسار API، ISR 300s، 2,033 مسارًا مُسبق التصيير | Lambda arm64 (OpenNext) أو ECS Fargate | SSE للـ EVO يستلزم Lambda response streaming — مدعوم ويستوجب اختبارًا |
| CDN/حافة | **Cloudflare Free أمام Vercel** — طبقة كاش HTML الرسمية (edge_ttl 3600s، Phase 215) | CloudFront (+ WAF اختياري) | يُنصح بإبقاء Cloudflare أماميًا في كل الخيارات — يمتص معظم الـ egress |
| DB + Auth | Supabase **Free** (PG 17.6، eu-central-1، 54 جدولًا، RLS شامل، GoTrue، 22 مستخدمًا) | RDS PostgreSQL + Cognito/بديل | **أعلى بند مخاطرة**: إعادة كتابة RLS عبر 61 مسار API |
| Storage | Supabase Storage — 10 باكت (حدود 2–10MB)، 30 كائنًا فقط | S3 + CloudFront OAC للملفات الخاصة | سهل نسبيًا — بروكسي `/api/file` يبقى نمطه نفسه |
| AI/API | سلسلة مجانية: OpenRouter (أساسي) → Groq → NVIDIA NIM — $0 الآن | تبقى خارج AWS (Bedrock عند حاجة لاحقة فقط) | أرخص ما عندك — لا تلمسه |
| Email | Brevo REST (مجاني 300/يوم) | SES ($0.10/1K) | SES أرخص عند النمو، Brevo كافٍ حاليًا |
| Background jobs | 2 Vercel cron + ~12 GitHub workflow مجدولًا (مدونة EN/AR يوميًا، نسخ يومي، تقليم، تقييم EVO) | EventBridge Scheduler + Lambda | Actions مجانية (ريبو عام) — لا داعي لنقلها |
| Rate limiting | Upstash Redis free (اختياري) | DynamoDB TTL (always-free 25GB) أو ElastiCache ~$14 | DynamoDB أرخص بديل AWS-native |
| Backups | Actions → ريبو خاص + Google Drive مشفر (GFS 7/5/6، ~2GB، $0) | S3 + Glacier Deep Archive ($0.00099/GB) | **أول ما يستحق الهجرة لـ AWS** عند تجاوز 12GB |
| Payments/مراقبة | PayPal · GA4/CF Insights/Vercel Analytics | بلا تغيير · CloudWatch | رسوم PayPal معاملات خارج نطاق هذا التدقيق |

## 2. الاستخدام الحالي المقيس (وما هو Unknown)

**مقيس:** عمر الموقع ~شهران (المشروع أُنشئ 2026-08-01) · فاتورة شهرية فعلية **$0** (كل الاستخدام داخل الخطط المجانية) · 4,172 انطباع GSC/28 يومًا مقابل 4 نقرات (pos 55.5) · الحجم الكلي للنسخ الاحتياطية ~MBs لا GBs.
**Unknown (مسجل لا مخمَّن):** الزيارات/الصفحات الفعلية شهريًا (لا وصول لـ GA أو Vercel Analytics)، حجم DB بالبايت، حركة Cloudflare (توكن الزون بلا صلاحية Analytics — فشل 10000)، استخدام Vercel بالبندايت/الاستدعاءات (usage API للـ Pro فقط)، حجم نداءات AI الفعلي (جدول `evo_call_stats` غير مقروء في هذا التدقيق)، الإيرادات الشهرية.

## 3. السيناريوهات الثلاثة (افتراضات معلنة)

| المؤشر | S1 — الحالي (مقيس) | S2 — 3–6 أشهر **Assumption** | S3 — 1–3 سنوات **Assumption** |
|---|---|---|---|
| صفحات/شهر | <5K (غالبية زواحف) | Min 50K / Exp 150K / High 500K | Min 1M / Exp 3M / High 10M |
| مستخدمون نشطون (MAU) | 22 (auth) | Min 1K / Exp 3K / High 10K | Min 50K / Exp 100K / High 300K |
| حجم DB | <500MB (بحدود Free) | 0.5–2GB | 10–100GB |
| تخزين ملفات | 30 كائنًا (~MBs) | 2–10GB | 100GB–1TB |
| Egress للزوار | <5GB | 10–100GB | 0.5–3TB (قبل كاش CF) |
| نداءات AI/شهر | ~2–5K | 10K–150K | 0.5M–5M |
| إيميلات/شهر | <2K | 5K–30K | 100K–1M |

## 4. التقديرات الشهرية (USD، on-demand)

> **(أ) AWS فقط:** OpenNext على Lambda arm64 + CloudFront + RDS PG + S3 + DynamoDB/ElastiCache + SES + EventBridge + CloudWatch.
> **(ب) AWS + خارجي:** Lambda/Fargate للـ compute فقط، وتبقى Supabase (DB/Auth/Storage) + Cloudflare + Upstash + Brevo/SES + Actions.
> **(ج) AWS + SST Ion:** SST مجاني مفتوح المصدر يُدير نفس مكدس (أ) عبر OpenNext — **تكلفته = تكلفة (أ) نفسها +$0 للأداة**؛ الفرق تشغيلي (IaC/DX) لا مالي.
> **(د) خط الأساس — البقاء على الوضع الحالي.**

| الخيار | S1 Min/Exp/High | S2 Min/Exp/High | S3 Min/Exp/High | أهم بنود كل مرحلة |
|---|---|---|---|---|
| **(أ) AWS فقط** | 18 / 25 / 45 | 30 / 50 / 130 | 180 / 400 / 1,500 | S1: أرضية RDS (db.t4g.micro ~$14 + تخزين). S2: DB ثم Lambda GB-s. S3: Lambda GB-s ($130–230) ثم RDS Multi-AZ ($130–260) ثم CloudFront بعد 1TB |
| **(ب) AWS + خارجي** | 0 / 3 / 12 | 25 / 35 / 65 | 60 / 190 / 520 | S2: Supabase Pro $25 (محفزه: DB>500MB) + Lambda $2–10. S3: Lambda $130–230 + Supabase Pro+overage $25–200 |
| **(ج) AWS + SST Ion** | = (أ) | = (أ) | = (أ) | الأداة $0 — لا وفر مالي إضافي، فقط ملكية البنية وIaC |
| **(د) البقاء (خط الأساس)** | 0 / 0 / 0 | 25 / 45 / 80 | 50 / 160 / 650 | S2: Supabase Pro $25 + Vercel Pro $20. S3: تجاوز 1TB Vercel بـ **$0.15/GB** = $150–450 (الأغلى بالسوق) |
| AI tokens (مشترك فوق الجدول) | 0 | 0–30 | 50–500 | يتكرر في **كل** الخيارات — أكبر متغير مستقبلٍ لا يحسمه اختيار المزود |

ملاحظات التسعير: أرقام (أ) assume **لا free tier** (steady-state بعد 12 شهرًا من فتح حساب AWS جديد — RDS 750h وS3 5GB وSES 3K مجانية أول عام فقط؛ Lambda 1M req+400K GB-s وCloudFront 1TB always-free). مع free tier ينخفض S1-Min إلى ~$3–5 مؤقتًا. High في (أ) يشمل NAT ($32.85 أرضية) عند اختيار VPC + Multi-AZ. أثر Savings Plans/RDS Reserved عند الاعتماد: −30% إلى −60% على بنود Compute/DB الثابتة في S3 — قرار لاحق بعد استقرار الحمل.

## 5. ما يُبقى خارج AWS / ما يُشغَّل على AWS

- **يبقى خارج AWS (وفر مؤكد):** Cloudflare (DNS+CDN+كاش HTML — يمتص الـ egress قبل أي مزود أصل)، Supabase (حتى 8GB DB/100K MAU/250GB egress بـ Pro)، Upstash، GitHub Actions (ريبو عام = مجاني)، سلسلة AI المجانية (OpenRouter/Groq/NVIDIA)، Brevo (حتى 300/يوم)، Drive للنسخ (حتى 12GB).
- **الأولى بالتشغيل على AWS عند النمو:** (1) **النسخ الاحتياطي** → S3 + Glacier Deep Archive عند اقتراب سقف 12GB (أرخص بند في AWS كله)، (2) **الإيميل** → SES عند تجاوز 9K/شهر، (3) **Compute** → Lambda/Fargate فقط عند تجاوز حدود Vercel أو حاجة ملكية كاملة، (4) **RDS** فقط عند DB>8GB أو حاجة تحكم أداء — لا قبل ذلك.

## 6. مصادر Bill Shock والتكاليف المخفية

1. **NAT Gateway** — $32.85/شهر أرضية + $0.045/GB: أول مفاجأة لمن يدخل Lambda في VPC ليلمس RDS خاصًا (تجنبُه ممكن بـ Lambda عام + SG صارم أو DynamoDB).
2. **CloudFront بعد 1TB** ($0.085–0.116/GB) — ولو الكاش سيئ فكل الحركة تصل الأصل وتُحسب مرتين.
3. **RDS:** Multi-AZ يضاعف الحساب، وضع burst `t4g unlimited` يفوتر الكريدت صمتًا، snapshots الزائدة عن الاستهلاك المجاني.
4. **CloudWatch Logs** $0.50/GB ingested — سجلات Next.js الإفرودية عند 10M طلب = عشرات الدولارات شهريًا.
5. **Lambda memory:** Next.js SSR يحتاج عمليًا 1024–1769MB — الفوترة بـ GB-s تتضاعف مع كل زيادة ذاكرة غير مدروسة.
6. **Secrets Manager** عند كل استدعاء بلا كاش ($0.05/10K) + **cross-AZ transfer** ($0.01/GB ×2).
7. **Fargate 24/7:** أرضية $18–36+/شهر لكل task — لا يُختار إلا لجوب long-running حقيقي (Actions يغطي حالك مجانًا).
8. **على البقاء (د):** تجاوز 1TB Vercel بـ $0.15/GB هو أغلى egress في المقارنة؛ و**التشغيل التجاري (PayPal) على Hobby مخالف لشروط الاستخدام** — أول بند مالي يجب معالجته بغض النظر عن AWS.
9. **على Supabase:** egress $0.09/GB بعد المشمول — نقطته الضعيفة الوحيدة عند النمو (كاش CF أمامي يخففها).
10. **AI:** انتقال صامت من الخطط المجانية إلى المدفوعة مع نمو EVO — راقب `evo_call_stats` شهريًا.

## 7. تكلفة الانتقال نفسها (تقدير — لا يُنفَّذ في هذا الإطار)

- **هندسيًا:** تكييف OpenNext/SST + نشر موازٍ: 1–2 أسبوع. ترحيل DB+Auth (GoTrue→بديل + إعادة كتابة RLS عبر 61 مسار API): 3–8 أسابيع — **البند الحاكم للقرار**. الإجمالي: 4–10 أسابيع مهندس فرصة عمل ضائعة، تُلغى تقريبًا في خيار (ب) الذي يترك Supabase كما هو.
- **نقديًا مباشرة:** $0 أدوات (كلها OSS) · Route53 $0.50/شهر · فترة تشغيل مزدوج ~شهر واحد (≈ شهر من تكلفة الوجهة) · سحب بيانات Supabase (داخل 250GB المشمولة بـ Pro).
- **مخاطر الانتقال:** Auth/RLS أعلاها · SSE للـ EVO على Lambda (يستلزم جولة قياس) · PayPal webhooks · إعادة تسجيل crons · فقدان Preview Deployments الخاص بـ Vercel.

## 8. التوصية النهائية

1. **الآن (S1): لا انتقال.** البقاء يكلف $0 مقيسًا، وأرخص AWS-only يبدأ من أرضية ~$18–25/شهر ثابتة (RDS). لا يوجد أي سائق تكلفة يبرر الدفع اليوم مقابل قدرات مطابقة.
2. **(S2): الترقيات الطبيعية أولًا** — Supabase Pro ($25) عند تجاوز 500MB، ثم Vercel Pro ($20) لمعالجة التجارية. خيار (ب) يصبح منطقيًا فقط إن توفرت جاهزية هندسية ورغبة ملكية — لا يوفر مالًا في هذا النطاق، بل ينقل التكلفة من رسوم منصة إلى جهد تشغيل.
3. **(S3): عند تفعّل أي محفز أدناه، ابدأ بخيار (ب)** (AWS للـ compute + Supabase خارجيًا) — أقل مخاطرة وأرخص من AWS-only في المنتصف، ثم انقل DB إلى RDS لاحقًا عند الحاجة فقط. SST Ion هو الوجهة الموصى بها كأداة نشر حينها ($0 + IaC موحد).
4. **محفزات إعادة النظر (tripwires — تجاوز أيٍّ منها يفتح قرار Migration):** فاتورة (Vercel+Supabase) > $150/شهر · bandwidth Vercel > 800GB/شهر · DB > 7GB · MAU > 80K · إنفاق AI > $100/شهر · اقتراب نسخ Drive من 12GB.

## 9. الافتراضات والقيود

أرقام S2/S3 افتراضات نمو مبنية على قاعدة مقيسة صغيرة (لا توقعات مؤكدة) · أسعار on-demand بتاريخ 2026-10-05 وقابلة للتغير (بما فيها خطط CloudFront ذات السعر الثابت المعلنة 2026 التي قد تغيّر معادلة الـ egress) · ±30% · بيانات Unknown بالقسم 2 تحتاج قياسًا لاحقًا (خصوصًا `evo_call_stats` وحجم DB بالبايت وusage Vercel من الداشبورد) قبل أي قرار نهائي · هذا التقرير لا يُغني عن AWS Calculator جولة نهائية عند تفعّل أي محفز.
