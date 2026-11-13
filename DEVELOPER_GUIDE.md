# Developer Guide — Alkemos

> **وظيفة الملف:** onboarding المطور + المعمارية والتدفقات والمراجع السريعة.
> **الجمهور المستهدف:** مطورون جدد ينضمون للمشروع، أو المطور الحالي كمرجع.
> **أين تعدَّل معلوماته:** أي تغيير معماري/تدفق/متطلب يحدّث القسم المعني بنفس الكوميت (AGENTS.md §3.8).
> **مصادر الحقيقة المرتبطة:** `package.json` + `bun.lock` (الاعتماديات) · `src/lib/memberships.ts` + `src/lib/tier-limits.ts` (الباقات والحصص) · `DESIGN.md` (الهوية والألوان) · `AGENTS.md` §8 (طبقة AI) · `STATE.md` (الحالة الحية) · `src/lib/ai-provider.ts` (سلاسل المزودين).
> **المرجع التقني العميق:** [`docs/TECH_REFERENCE.md`](./docs/TECH_REFERENCE.md) — بنية Supabase وقانون الميجريشنز وجداول القواعد الخاصة وشرح RLS التفصيلي وقائمة shadcn/ui كاملة. هذا الملف يبقى مختصرًا: الإعداد والتدفقات والمراجع السريعة فقط.
> **القانون الحاكم للوكيل والمساهم:** [`AGENTS.md`](./AGENTS.md) — هذا الدليل تعليمي وليس بديلًا عن القانون.

---

## 📋 المحتويات

1. [الإعداد المحلي](#1-الإعداد-المحلي-local-setup)
2. [هيكلية المشروع](#2-هيكلية-المشروع)
3. [البنية المعمارية وأنماط التصميم](#3-البنية-المعمارية-وأنماط-التصميم)
4. [قاعدة البيانات + RLS](#4-قاعدة-البيانات--rls)
5. [المصادقة + العضويات](#5-المصادقة--العضويات)
6. [طبقة الذكاء الاصطناعي (EVO + التوليد)](#6-طبقة-الذكاء-الاصطناعي-evo--التوليد)
7. [المدونة الآلية + خط التوليد](#7-المدونة-الآلية--خط-التوليد)
8. [مرجع مسارات API](#8-مرجع-مسارات-api)
9. [الاعتماديات](#9-الاعتماديات)
10. [النشر والاستضافة — AWS Lightsail](#10-النشر-والاستضافة--aws-lightsail)
11. [الاختبار والصيانة](#11-الاختبار-والصيانة)
12. [الاصطلاحات البرمجية](#12-الاصطلاحات-البرمجية)

---

## 1. الإعداد المحلي (Local Setup)

### المتطلبات

```bash
node --version   # 20.9+ (بوابة الجودة تعمل بـ Node 22 — أو استخدم Bun)
bun --version    # 1.3+
git --version    # أي إصدار حديث
```

### التثبيت

```bash
git clone https://github.com/muscleshubfit-cpu/alkemos-aws.git
cd alkemos-aws
bun install
```

> **الكود مملوك للمالك وخاص بموجب ترخيصه** — الاستنساخ يتطلب حسابًا بصلاحية وصول من المالك على GitHub.

### متغيرات البيئة

انسخ `.env.example` إلى `.env.local`:

```bash
cp .env.example .env.local
```

الحد الأدنى لتشغيل نسخة عاملة (المرجع الكامل المشروح في [`.env.example`](./.env.example)):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API=sk-or-v1-xxxxxxxxxxxxx
```

مفاتيح Groq وNVIDIA NIM وGemini وCloudflare تُوسّع السلسلة، ومفاتيح Tavily/Exa تفعّل ذراعي البحث المُسند.

**وضع العرض (Demo mode):** بدون متغيرات Supabase يعمل التطبيق على localStorage — حسابا عرض جاهزان (البذر في `src/lib/data/auth.ts`):

- مدرب: `ahmed@coach.app` / `coach123`
- عميل: `client@demo.app` / `client123`

### تشغيل بيئة التطوير

```bash
bun dev          # أو: npm run dev
```

ثم افتح http://localhost:3000

### Build للإنتاج (محليًا)

```bash
bun run build
```

### Lint

```bash
bun run lint
```

---

## 2. هيكلية المشروع

```
src/
├── app/                         # Next.js App Router — أربع مجموعات مسارات
│   ├── (en)/                    # الموقع العام الإنجليزي (المرجع)
│   │   ├── (home)/              # الرئيسية (LandingView)
│   │   ├── tools/               # الحاسبات المجانية (قائمة الأدوات ومصدرها الوحيد src/lib/tools-shared.ts)
│   │   ├── meal-planner/ · ai-meal-planner/ · ai-workout-planner/
│   │   ├── exercises/ · foods/ · programs/ · diet-plan/
│   │   ├── blog/ · authors/ · compare/ · collections/
│   │   ├── muscles/ · equipment/ · faq/ · for-coaches/ · coaches/ · coaching/ · evo/
│   │   ├── memberships/ · affiliate/ · about/ · contact/ · privacy/ · terms/
│   │   └── layout.tsx · not-found.tsx
│   ├── (ar)/ar/                 # المرآة العربية الكاملة RTL (نفس شجرة (en) تحت /ar)
│   ├── (app)/                   # منطقة التطبيق — layout بـ auth gate
│   │   ├── (authed)/            # العضو المسجل: dashboard · coach · plans · progress · questionnaires · referral · support
│   │   ├── admin/               # لوحة الأدمن (AdminGate — أدمن فقط): dashboard · members · clients · coaches · assignments · finances · payments · blog · coach-system · coach-pages · coach-support · external-plans · accounts · leads · referrals · saved-results · wallets · evo-analytics · site-content · local-prices
│   │   ├── auth/                # تسجيل الدخول/التسجيل/الاستعادة
│   │   └── checkout/ · profile/ · preview/
│   ├── api/                     # API Routes (المرجع الكامل §8 — العدد الحي من الكود)
│   │   ├── ai/                  # AI (chat, jobs الطابور + quota, queue-health)
│   │   ├── admin/               # Admin (external-plans, accounts, wallets, refunds, staff, blog, local-prices, site-content, …)
│   │   ├── coach/               # B2B (clients/invite, wallet, subscriptions/activate, support, …)
│   │   ├── tools/               # Tool endpoints (save-result, save-meal-plan, lead, …)
│   │   ├── cron/                # Cron (dispatch-pipelines + blog p0-p5 + exchange-rate + progress-reminder)
│   │   ├── paypal/              # PayPal (create-order, capture-order, webhook)
│   │   └── …                    # send-email, food-search, og-image, build-info, …
│   ├── globals.css              # رموز النظام البصري (الحاكم: DESIGN.md)
│   └── metadata.ts              # SEO metadata شاملة (+ خرائط sitemap*/rss في جذر app/)
├── components/
│   ├── ui/                      # shadcn/ui primitives — القائمة الكاملة بالأسماء في docs/TECH_REFERENCE.md §3
│   ├── views/                   # page-level views
│   ├── blog/                    # مكونات المدونة
│   ├── SiteHeader.tsx           # الهيدر + التنقل + الإشعارات
│   ├── AppLayout.tsx            # سايدبار الأدوار (عضو/مدرب/أدمن — عناصر الأدمن isAdmin فقط)
│   ├── EvoFloatingWidget.tsx    # EVO floating chat
│   ├── AdSenseAd.tsx            # إعلانات AdSense (tier-gated)
│   ├── SaveResultButton.tsx     # حفظ + تصدير النتائج
│   ├── NotificationBell.tsx     # إشعارات المستخدم
│   └── AdminNotificationBell.tsx # إشعارات الطاقم
├── hooks/
│   ├── use-auth.tsx             # Auth context + state (+ محرك توقيت تحميل Supabase الكسول)
│   ├── use-nav.tsx              # Navigation adapter (View → URL)
│   ├── use-membership-tier.ts   # Client-side tier resolution
│   ├── use-mobile.ts            # Mobile detection
│   └── use-toast.ts             # Toast notifications
├── lib/
│   ├── memberships.ts           # تعريف العضويات + الأسعار + الحدود
│   ├── data/                    # طبقة البيانات (Supabase أو localStorage في وضع العرض)
│   ├── auth-server.ts           # مصادقة الخادم (requireUser, requireCoach, requireAdmin)
│   ├── ai-provider.ts           # طبقة مزودي AI الموحدة (المزودون + السلاسل + محرك الاستدعاء)
│   ├── ai-registry.ts           # سجل وظائف AI الموحد (بيانات صرفة: فصيلات/سلالم/سياسات — مصدر التوجيه الوحيد)
│   ├── ai-router.ts             # موجّه AI الرقيق (dispatchAI/dispatchGrounded)
│   ├── ai-usage-meter.ts        # عدادات الاستخدام (مزود×نموذج×وظيفة + حصتا Tavily/Exa — fail-open)
│   ├── exercises.ts             # مكتبة التمارين (server-only)
│   ├── foods.ts                 # قاعدة الأطعمة (server-only)
│   ├── blog-pipeline.ts         # مراحل توليد المقالات
│   ├── blog-topics.ts           # اختيار مواضيع المدونة
│   ├── blog-admin.ts            # أدوات تحرير المدونة
│   ├── blog-server.ts           # جلب بيانات المدونة (server-side)
│   ├── blog.ts                  # جلب بيانات المدونة (client-side)
│   ├── blog-images.ts           # جلب صور المدونة
│   ├── blog-editorial-law.ts    # دستور التحرير الموحد للمقالات
│   ├── blog-quality-gates.ts    # بطارية بوابة النشر + بطارية نشر مسودات AI يدويًا
│   ├── blog-msa.ts              # قانون العربية الفصحى + كاشف اللهجات + كاشف اللاتيني السائب
│   ├── evo-chat-context.tsx     # حالة محادثة EVO
│   ├── evo-safety.ts            # طبقة سلامة EVO (إشارات إيذاء الذات)
│   ├── evo-intent.ts            # طبقة نوايا EVO (بوابات الخطط والتبديلات)
│   ├── plan-generator.ts        # توليد خطط تغذية/تمرين بـ AI (+ إعادة التوليد والاستبدال)
│   ├── plan-ai-validation.ts    # مدقق جودة مخرجات AI الإلزامي
│   ├── plan-food-grounding.ts   | تثبيت الخطط على مكتبة الأطعمة
│   ├── nutrition-totals.ts      # سلسلة إعادة الحساب النقية (صنف→وجبة→خطة)
│   ├── diet-types.ts            # عقد أنظمة الغذاء المشترك (UI + pipeline)
│   ├── ai-jobs.ts               # أنواع مهام AI الطابور + البوابات + تعقيم الحمولات
│   ├── ai-job-processors.ts     # معالجات المهام (تُشغَّل في GHA runner)
│   ├── ai-jobs-client.ts        # إرسال مهمة ومتابعتها من المتصفح
│   ├── tier-limits.ts           # محرّك الحصص (الحصة الشهرية الموحدة + تبديلات شهرية لكل نوع + حدود الحفظ)
│   ├── membership-tier.ts       | حل مستوى العضوية الفعّال (بما فيه تجميع حصص الاشتراكات المدفوعة)
│   ├── coach-limits.ts          # أسعار نظام المدربين B2B + تفعيل العملاء
│   ├── refund.ts                # أهلية استرداد 7 أيام (server-only)
│   ├── local-prices.ts          # التسعير المحلي بالجنيه وسعر الصرف (القناتان اليدويتان)
│   ├── affiliate-engine-server.ts # محرك العمولات (سيرفر)
│   ├── result-png-export.ts     # تصدير PDF/PNG (Canvas-based)
│   ├── seo.ts                   # JSON-LD schema generators
│   ├── workout-programs.ts      # برامج التدريب الجاهزة
│   ├── supabase/
│   │   ├── client.ts            # Supabase browser client (تحميل كسول ديناميكي)
│   │   ├── admin.ts             # Supabase admin client (service_role)
│   │   └── types.ts             # مرآة TypeScript لأنواع قاعدة البيانات
│   └── site-content/            # النصوص التسويقية القابلة للتحرير من الأدمن (الافتراضي المدمج)
└── middleware.ts                # Session refresh + Content-Language header
```

خارج `src/`: `supabase/migrations/` (سجل الميجريشنز + `INDEX.md` الدفتر) · `scripts/` (بوابات CI + مشغّلات الخطوط) · `.github/workflows/` (البوابات + الجداول المجدولة) · `deploy/` (أصول الخادم: Caddyfile + setup/deploy/rollback + crontab) · `docs/` (التوثيق — الفهرس `docs/README.md`) · `archive/` (السجل التاريخي المجمّد).

---

## 3. البنية المعمارية وأنماط التصميم

```
┌──────────────────────────────────────────────────┐
│                    Pages                         │
│  (App Router — server + client components)      │
├──────────────────────────────────────────────────┤
│                   Views                          │
│  (src/components/views/ — page-level UI)         │
├──────────────────────────────────────────────────┤
│               Components                         │
│  (src/components/ — reusable UI parts)           │
├──────────────────────────────────────────────────┤
│                  Hooks                           │
│  (useAuth, useNav, useMembershipTier)            │
├──────────────────────────────────────────────────┤
│             Data Layer                           │
│  (src/lib/data/ — Supabase CRUD + localStorage)  │
├──────────────────────────────────────────────────┤
│             Supabase                             │
│  (Postgres + Auth + Storage + RLS)               │
└──────────────────────────────────────────────────┘
```

### أنماط التصميم الرئيسية

1. **Dual-mode data layer**: `src/lib/data/` يعمل مع Supabase أو localStorage (وضع العرض).
2. **Server-side auth**: `auth-server.ts` يقرأ session من cookies ويحلّ المستوى من الاشتراكات الفعالة.
3. **Client-side tier resolution**: `useMembershipTier` يجلب المستوى من جدول الاشتراكات.
4. **Navigation adapter**: `useNav` يحوّل `navigate("view")` إلى URL حقيقي.
5. **AI unified layer**: كل نداء نموذج يمر عبر `src/lib/ai-provider.ts` (سلاسل متسلسلة + وضع سباق) بتوجيه من `src/lib/ai-registry.ts`.
6. **AI jobs queue**: الأعمال الطويلة (توليد الخطط، استبدالات، مدونة) صفوف في `ai_jobs` يعالجها runner على GitHub Actions — لا توليد ثقيل داخل طلبات HTTP.
7. **PDF export بدون مكتبات**: Canvas 2D → JPEG → PDF 1.4 مبنية يدويًا (`result-png-export.ts`).
8. **ISR + كاش حافة مُدار**: صفحات عامة بـ revalidate زمني + تطهير حافة Cloudflare عند التغييرات (أدمن/مدرب).

---

## 4. قاعدة البيانات + RLS

> **الشرح التقني العميق:** [`docs/TECH_REFERENCE.md`](./docs/TECH_REFERENCE.md) — بنية Supabase (anon vs service-role · مرآة `types.ts` · بوابة الانجراف `migration_audit.py`) · قانون الميجريشنز (التسمية `YYYYMMDDHHMMSS_NNNN` · idempotency · قناة التطبيق الآلي · المسار اليدوي ومتى يجوز) · جداول القواعد الخاصة (`ai_jobs` · `evo_chat_usage` · `evo_anon_usage` · تحصينات `subscriptions` · عائلة `coach_*` · `role_audit_log`) · **شرح RLS التفصيلي** (دوال predicates `is_coach`/`is_admin`/`is_coach_over`/`coach_of` · نمط الأدوار v2 · فصل عالمَي المال) · كل أكواد SQL المعقدة منظمة.

الخلاصة الملزمة هنا:

- **RLS على كل جدول يُطبَّق آليًا** — أي جدول جديد يجب أن يحمل سياساته في نفس الميجريشن.
- **سجل الميجريشنز** `supabase/migrations/INDEX.md` هو الدفتر الرابط: كل ميجريشن جديدة تضيف صفها في نفس الكوميت، وإعادة تسمية الملفات ممنوعة.
- **مرآة الأنواع** `src/lib/supabase/types.ts` تتحدث في نفس الكوميت مع أي تغيير schema، وبوابة `scripts/migration_audit.py` تفشل أي انجراف (جدول/عمود فانتوم).
- **قناة التطبيق على الإنتاج:** المطبّق المؤدَّى بالدفتر `scripts/db/apply_migrations.py` يعمل داخل مهمة النشر **قبل** حيازة الكود، وبوابة الحالة اليومية `migration-state-audit.yml` تتحقق من التطبيق — نجاح نشر الكود ليس دليلًا على تطبيق الميجريشنز. التفاصيل الحاكمة: [`docs/DB-MIGRATION-PIPELINE-2026-10-27.md`](./docs/DB-MIGRATION-PIPELINE-2026-10-27.md).
- **الوكيل لا يطبّق ميجريشنز على الإنتاج بنفسه** — القناة هي خط المستودع؛ المسار اليدوي استثناء موثق (حسابات الاختبار بسياسة `docs/QA-TEST-ACCOUNTS-2026-10-26.md`، وملفات `RUN_ON_SUPABASE_*`/`VERIFY_*` القديمة).
- **Storage buckets:** `questionnaire-photos` · `progress-photos` · `receipts` · `avatars` (عام) · `coach-public` (عام) — التفاصيل في TECH_REFERENCE §1.5.

---

## 5. المصادقة + العضويات

### تدفق المصادقة

```
User → /auth (email/password أو Google OAuth)
  → Supabase Auth (PKCE flow)
  → Cookie set via middleware
  → Profile fetched from `profiles` table
  → Role checked (client vs coach)
  → Redirect to /dashboard (client) or /coach (coach)
```

- **التحقق الخادمي:** `requireUser` / `requireCoach` / `requireAdmin` من `src/lib/auth-server.ts` — كل مسار API يعلن بوابته صراحة.
- **قانون سلامة الأدوار (ميجريشن 0105):** كتابة `profiles.role` من سياق المستخدم ممنوعة بنيويًا (تريغر + WITH CHECK) إلا عبر القنوات المصرّح بها، وتنزيل آخر أدمن مرفوض في كل السياقات، وكل تغيير دور يُوثّق في `role_audit_log`.
- **التحميل الكسول للمصادقة:** عميل Supabase في المتصفح يُحمّل ديناميكيًا وفق محرك توقيت (`src/hooks/use-auth.tsx` + `src/lib/supabase/config.ts` + `src/lib/defer-idle.ts`) — فوري للمحتوى المحجوب، عند الخمول للعائدين، أبدًا للمجهول.

### حل الـ Tier

```
Client-side:  useMembershipTier(profile) → queries subscriptions table → picks highest priority membership
Server-side:  requireUser(request) → queries subscriptions table → picks highest priority membership

Membership priority (المصدر src/lib/auth-server.ts):
  pro > premium > free

Coaching يُعالج منفصلًا — ليس مستوى أعلى: يمنح وصول EVO مكافئًا لـ Premium
لكنه لا يرفع membership_tier.
```

نوع `MembershipTier` هو `"free" | "premium" | "pro" | "coaching"` — أربعة مستويات فقط، ولا وجود لأي مستوى آخر.

### العضويات (الباقات والحصص)

> **قانون المصدر الواحد (AGENTS.md §3.8):** هذا الدليل لا يحمل أي رقم متغير — الأسعار والباقات والحصص بيتها الوحيد:
> **[`src/lib/memberships.ts`](./src/lib/memberships.ts)** (تعريف الباقات والأسعار)
> + **[`src/lib/tier-limits.ts`](./src/lib/tier-limits.ts)** (محرّك الحصص: الحصة الشهرية الموحدة لتوليد الخطط — تغذية وتمارين من حصة واحدة، نجاح-فقط — + حصص التبديلات الشهرية المستقلة لكل نوع وحدود حفظ النتائج).
> أي سؤال «كم حصة/كم سعر؟» جوابه المباشر من هذين الملفين.

**الحصص الشهرية (AI-QUOTAS 2026-11-14):** توليد الخطط للمشتركين فقط (المجاني/الزائر: حصة 0 ورسالة اشتراك 402) — حصة شهرية موحدة لتغذية وتمارين من حصة واحدة، نجاح-فقط، تتجدد وفق **دورة الاشتراك** (نافذة شهرية بمرساة يوم بدء أقدم اشتراك مدفوع فعّال — `cycleWindowStartUtc`؛ احتياط أول الشهر). **تجميع الحصص المدفوعة:** حصة العضو = مجموع حصص كل مستوى مدفوع فعّال (المصدر: `resolveUnifiedPlanPoolLimit` في `membership-tier.ts` + `checkUnifiedPlanQuota` في `tier-limits.ts`). **تبديلات شهرية مستقلة لكل نوع** (وجبات وتمارين لكلٍّ حصته — `evoSwapMonthlyLimit`). **مرة واحدة بنيويًا:** `job_ref` فريد (ميجريشن 0110) يمنع خصم أي عمل ناجح مرتين. مستوى العرض للشارات/الميزات يظل «أفضل عضوية تفوز».

---

## 6. طبقة الذكاء الاصطناعي (EVO + التوليد)

### مزودو الذكاء الاصطناعي

> **المصدر الوحيد للسلاسل والموديلات:** `src/lib/ai-provider.ts` · **القانون الكامل:** `AGENTS.md` §8.

- **مزودو التوليد (خمسة):** OpenRouter · Groq · NVIDIA NIM · Google Gemini · Cloudflare Workers AI. الأربعة الأولى تركب سلاسلًا متسلسلة بقيادة دوّارة بين المزودين (أقوى نموذج أولًا، بلا أولوية إجبارية لأي مزود — Gemini ذيل دائمًا)؛ Cloudflare يخدم أدوارًا رشيقة محددة (إقران المدونة الثنائي وتحويل اللاتيني العربي) بعدّاد نيورون مركزي ومفتاح إطفاء، وأي فشل لديه يسقط للسلسلة العادية.
- **ذراعا البحث المُسند:** Tavily وExa — بحث فقط، لا توليد أبدًا. سلم البحث مقسوم باللغة: الإنجليزية تقود بـExa والعربية بـTavily، مع Groq `browser_search` وذراع Gemini الخامل ذيلين — كل ذراع يجب أن يعيد أدلة URL حية.

### EVO — المدرب الذكي

```
EvoFloatingWidget / صفحة /evo (UI)
  → EvoChatProvider (state — localStorage + مزامنة العرض فقط)
  → /api/ai/chat (server route)
    → بوابة المستوى من الجلسة الموثقة (active + غير منتهية)
    → دفتر استخدام server-side غير قابل للعبث: evo_chat_usage — يُسجَّل قبل
      استدعاء النموذج؛ مسح المحادثة لا يؤثر على حصة الرسائل
    → طبقة النوايا (src/lib/evo-intent.ts): التبديلات فقط بوابة مشتركين؛
      نية إنشاء الخطة مفتوحة للجميع وتُقيّد بالرصيد الشهري الموحد
    → بحث المنصة (تمارين، أطعمة، برامج، أدوات) + بحث المدونة
    → dispatchAI (من السجل) → سلسلة المزودين المتشابكة ضمن جيب زمني
    → النجاح يُبث SSE (text/event-stream):
        event: delta → قطع خام أولًا بأول (المستخدم يرى الرد وهو يُكتب)
        event: final → النص الكامل المنظف + links + source
        event: error → انقطاع منتصف البث (العميل يحتفظ بالنص الجزئي)
      والأخطاء تبقى JSON — العميل يميز بالنوع (content-type)
    → تنظيف (LaTeX/تفكير/ماركداون) يحتاج النص كاملًا فيعمل بعد الجمع ويُرسل في final
    → مولد محلي احتياطي عند غياب كل المزودين (src/lib/ai-local.ts)
```

- **طبقة السلامة** (`src/lib/evo-safety.ts`): إشارات إيذاء الذات/اضطرابات الأكل تُجابَنة بردود آمنة ثابتة — لا تصل أي نموذج أبدًا.
- **الذاكرة والتعقب:** أهداف وتفضيلات يحتفظ بها EVO، ورسائل متابعة أسبوعية اختيارية (opt-in) عبر `/api/evo/followup/dispatch`.
- **التقييم:** تشغيل أسبوعي آلي يقيس جودة الردود AR/EN (`evo-weekly-eval.yml` + `evo-weekly-learning.yml`) والنتائج تظهر للقراءة في `/admin/evo-analytics`.
- **الرسائل:** المجاني له حد رسائل يومي (القيمة من `memberships.ts`) والمشتركون بلا حد؛ الزوار المجهولون يقيَّدون ببصمة مملحة لا تخزن IP الخام (`evo_anon_usage`).

### التوجيه الموحد (Registry + Router)

كل وسم توليد على المنصة (خطط/مدونة/أدوات تحرير/تواصل اجتماعي/عروض زوار/EVO) له مواصفة بيانات صرفة في **`src/lib/ai-registry.ts`**: سلّم النماذج بدليله المقيس، سياسة النداء (العمق/المهلة/الحرارة/jsonMode) بمبررها، البوابات ونقطة الدخول كمراجع. النداء يُرسل حصرًا عبر `dispatchAI`/`dispatchGrounded` من **`src/lib/ai-router.ts`** — مواقع النداء لا تحمل أي سياسة توجيه، والكاناري الذهبية في `src/lib/__tests__/ai-registry.test.ts` تثبت لكل وسم أن registry ≡ legacy ≡ مشية المحرك الفعلية. حارس CI `scripts/check-ai-router-guard.sh` يحرس مع كل دفعة: الباب الوحيد واكتمال السجل باتجاهين. المسار الرجعي `AI_ROUTER_MODE=legacy` يخدم اللقطة المجمدة قبل التوحيد.

### جودة مخرجات الخطط

كل حمولة AI — الخطط الكاملة وكل مستوى إعادة توليد (وجبة/صنف/يوم تمرين/تمرين) — تمر بمدقق إلزامي قبل العرض أو الحفظ (`src/lib/plan-ai-validation.ts` + تثبيت `src/lib/plan-food-grounding.ts`): إغلاق اليوم ضمن نسبة من الهدف الخادمي، أرقام حقيقية محدودة، إجماليات معاد حسابها من الأصناف، وتقديرات سعرات منحرفة كثيرًا عن حقيقة المكتبة تُستبدل بها. الرفض يُعطى إعادة إصلاح واحدة بسبب مسمّى، ثم تراجع صادق للمولد المحلي بعلم مراجعة (للخطط الكاملة) أو خطأ أمين يبقي العنصر الأصلي (لإعادة التوليد). التبديلات تُحرق من حصة العضو عند النجاح فقط.

### طابور مهام AI

الأعمال الطويلة صفوف في جدول `ai_jobs` (تعقيم حمولات بقائمة بيضاء `sanitizeJobPayload`، بوابات ملكية ورصيد عند الإدخال وإعادة تحقق من `requested_by` عند التنفيذ): مشغّل `process-ai-jobs.yml` يعالجها على GitHub Actions runner تحت شرط حل `react-server`، والتبديلات الدائمة يُجسّدها الـrunner مباشرة في صف الخطة (البقاء لا يعتمد على متصفح مفتوح). صحة الطابور تُقرأ في `/api/ai/queue-health` (أدمن).

---

## 7. المدونة الآلية + خط التوليد

### الجدولة والمبدأ

```
GitHub Actions — ورك فلو لكل لغة (تشغيل واحد = مقال واحد بلغة واحدة):
  blog-post-ar.yml  الاثنين + الخميس 05:00 UTC = مقالان عربيان/أسبوع
  blog-post-en.yml  الثلاثاء + الجمعة  22:00 UTC = مقالان إنجليزيان/أسبوع
  → الإجمالي 4 مقالات/أسبوع على 4 أيام منفصلة، مقال واحد كحد أقصى في اليوم
    (الإيقاع الأسبوعي — أمر المالك 2026-11-13؛ التوقيتان حسب جغرافيا جمهور
    كل لغة كما في المرحلة 119 ولم يتغيرا)

كل تشغيل يقود صف لغته في blog_generation_queue عبر المراحل (كلها موثقة بCRON_SECRET):
  p0-research → p1-outline → p2-content → p3-images → p4-review → p5-publish
  حالات الصف: researched→outlined→writing→written→images_done→reviewed→published
```

- **الفصل الثنائي:** مقال كل لغة يُبنى من الصفر بأكمله (ليس ترجمة)، والزوجان يشتركان في `pair_id` + موجز مشترك مختوم (`sharedBrief`) — ويُربطان نهائيًا ب`linked_post_id` بعد النشر. أي فشل إقران يتدهور لسلوك الصفوف المستقلة بلا حجب. الفتحة العربية تنشئ الزوج (مع صف التوأم الإنجليزي) والفتحة الإنجليزية في اليوم التالي تستهلكه (~41 ساعة — نوافذ الاقتران/الاستئناف 144 ساعة تغطي حتى أسوأ انتظار إنقاذ 137 ساعة عبر نهاية الأسبوع).
- **الموزع اليومي:** `/api/cron/dispatch-pipelines` (23:40 UTC، من كرون الخادم `/etc/cron.d/alkemos` — القناة الوحيدة منذ القطع 2026-10-10؛ كرونات Vercel مفرغة بلا قارئ) يظل يُطلق يوميًا لكنه يحكم المدونة **بمنطق أسبوعي**: فتحة كل لغة متوقعة فقط في يومها المجدول بعد سماح 90 دقيقة، والتغطية على أسبوع ISO = max(تشغيلات غير فاشلة، مقالات منشورة)، وتعويض واحد كحد أقصى لكل لغة في كل إطلاق — فلا يعود النشر اليومي من هذا المسار أبدًا (الوصفات اليومية قانونها المستقل كما هو).
- **حصتا النشر:** حارس يومي (مقال آلي واحد/لغة/يوم — المرحلة 171) + حارس أسبوعي (مقالان آليان/لغة/أسبوع ISO حسب أسبوع إنشاء الصف — `skipped_weekly_quota` عند المحاولة الثالثة) — يسريان على كل المسارات: الجدولة، التعويض، إعادة المحاولة، والتشغيل اليدوي للـworkflow. صفوف الكوتش وحدها معفاة (تجاوز مالك صريح — المرحلة 162).
- **التدفق اليدوي (مسار الكوتش):** لوحة المقالات → زر التوليد → `POST /api/ai/jobs` → إرسال `workflow_dispatch` لنفس الأنابيب عبر `blog-pipeline-dispatch.ts` (fail-open مع مولد احتياطي أحادي داخل `ai-job-processors.ts`). صفوف الكوتش معفاة من الحصتين اليومية والأسبوعية الآلية.

### البوابات التحريرية والإصلاح

- **دستور التحرير** (`src/lib/blog-editorial-law.ts`): LANG/ANSWER-FIRST/EEAT/FACT/DEPTH/FAQ + نطاقات السلطات الصحية والرياضية المسموحة للاستشهاد — مصدر واحد لكل بناة الـprompts.
- **بطارية النشر** (`src/lib/blog-quality-gates.ts`): أرضية طول، H2/FAQ، رابط سلطة واحد على الأقل، anchors، عبارات منقولة — تُطبق على النشر الآلي وعلى نشر مسودات AI يدويًا من المحرر (مسودة بمصدر `ai:article_generate` لا تُنشر دون البطارية الخفيفة؛ المقالات المكتوبة يدويًا معفاة — الكاتب البشري هو المراجعة).
- **العربية الفصحى** (`src/lib/blog-msa.ts`): كاشف لهجات + كاشف لاتيني سائب + بوابة تحويل؛ الإصلاح اللاتيني موضعي (تمريرة قاموس حتمية ثم نداء تحويل صغير لقائمة الـtokens وحدها — `LATIN_REPAIR_LEGACY=1` للإرجاع).
- **حلقة الإصلاح داخل التشغيل:** الفشل الحتمي عند P5 يُرجع `rerunTarget` قابلًا للقراءة آليًا (`src/lib/blog-repair-target.ts`)، و`scripts/blog-runner/run-step.sh` يعيد الخطوة المستهدفة على نفس الصف (≤ دورتين) — `p2-content` عبر `?force=1` مع إعادة استخدام research/outline/images. للمراجعة (P4) يتلقى التوجيه تشخيصات البوابة كتوجيه إصلاح لمرة واحدة، مع عقد حفظ الطول (المقال النهائي لا يقصر عن المسودة). لا بوابة تُضعف أبدًا — المقال الرديء لا يُنشر، والجيد المعيب يأخذ فرصة ثانية داخل التشغيل.
- **الرصد:** عدادات `repairLoop` في bundle الصف + `REPAIRS_USED` في ملخص التشغيل + عدّاد نافذة 14 يومًا في queue-health (published · afterRepair · exhausted · sharePct) — «إصلاح أولًا أم إعادة توليد» يُقرأ من قاعدة البيانات.
- **اختيار المواضيع** (`src/lib/blog-topics.ts` + `src/lib/intent-map.ts`): إزالة تكرار ضد خريطة النوايا الأساسية حتى لا تنافس المقالات الصفحات القانونية للموقع.

### مسار مراجعة المالك (E-E-A-T الصادق)

كل مقال منشور آليًا يبدأ **بانتظار مراجعة**: الصفحة تعلن بصدق «مولّد بالذكاء الاصطناعي · بانتظار المراجعة الطبية» والبيانات المهيكلة لا تحمل ادعاءات مراجعة قبل صدقها. المالك يراجع من **Admin → Blog** وزر الاعتماد يختم التاريخ الحقيقي (`review_status`/`last_reviewed_at`) فيحمله الـbyline والـschema.

---

## 8. مرجع مسارات API

> **قانون المصدر الواحد:** الجدول أدناه مبني من الكود ومُحقَّق لكل ملف (المعالجات المصدّرة + بوابات الحماية). لا يحمل هذا الدليل أي إجماليات — العدد الحي هو ما يقوله الكود، وبوابة `scripts/docs_audit.py` تمنع كتابة أي إجمالي هنا (AGENTS.md §3.8).

| Route | Method | Auth | الوظيفة |
|---|---|---|---|
| `/api/admin/accounts` | GET/PATCH/DELETE | Admin | تعليم حسابات الاختبار + حذف متسلسل |
| `/api/admin/assignments` | GET/PATCH | Admin | تعيين العملاء للمدربين + سجل التفعيلات |
| `/api/admin/blog/cleanup` | POST | Admin/Cron | إصلاح النصوص المشوهة في المقالات |
| `/api/admin/blog/revalidate` | POST | Admin | تطهير كاش صفحات المدونة بعد التعديل المباشر |
| `/api/admin/blog/review` | POST | Admin | اعتماد/رفض مراجعة المالك للمقال (يختم التاريخ الحقيقي) |
| `/api/admin/coach-kind` | POST | Admin | تحويل نوع المدرب site ↔ b2b |
| `/api/admin/coach-pages` | GET/PATCH | Admin | مراجعة صفحات المدربين (نشر/رفض) |
| `/api/admin/coach-pages/notify` | POST | Admin | إشعار مدرب بقرار مراجعة صفحته |
| `/api/admin/coach-pages/revalidate` | POST | Admin | تطهير مرايا صفحات المدربين (ISR + حافة CF) |
| `/api/admin/coach-payments` | GET | Admin | سجل تفعيلات المدربين |
| `/api/admin/coach-support` | GET/POST | Admin | صندوق دعم المدربين (رد الأدمن) |
| `/api/admin/evo-analytics` | GET | Admin | تحليلات EVO: نداءات/كاش/مزودون/نوايا/حصص/تقييم أسبوعي |
| `/api/admin/external-plans` | POST/GET/PATCH/DELETE | Admin (RLS: is_admin) | خطط AI لغير الأعضاء + إعادة توليد + سجل نسخ + استرجاع |
| `/api/admin/leads` | GET/PATCH/DELETE | Admin | قاعدة العملاء المحتملين (من الأدوات + التسجيلات) |
| `/api/admin/local-prices` | GET/POST | Admin | عرض وتعديل التسعير المحلي بالجنيه للقناتين اليدويتين |
| `/api/admin/refunds` | GET/POST | Admin | طلبات الاسترداد + قرار الإدارة (إنهاء الاشتراك + عكس العمولة) |
| `/api/admin/saved-results` | GET | Admin | النتائج المحفوظة لكل المستخدمين |
| `/api/admin/site-assignments` | GET/POST/PATCH/DELETE | Admin (service-role) | إسنادات متابعة B2C عضو↔مدرب موقع |
| `/api/admin/site-content/revalidate` | POST | Admin | تطهير كاش نصوص الموقع بعد الحفظ (بيانات + ISR + حافة) |
| `/api/admin/staff` | POST/PATCH | Admin | إدارة حسابات الموظفين |
| `/api/admin/wallets` | GET | Admin | محافظ المدربين (أرصدة + حركات) |
| `/api/admin/wallets/adjust` | POST | Admin | تعديل يدوي لمحفظة مدرب (مُدقَّق) |
| `/api/admin/wallets/topups` | PATCH | Admin | مراجعة طلبات الشحن (إيصال → اعتماد/رفض) |
| `/api/affiliate/commission` | POST | Admin | تسجيل/تسوية عمولة أفيليت |
| `/api/affiliate/payout-notify` | POST | User | إشعار الأدمن بطلب سحب أفيليت |
| `/api/affiliate/referred-coaches` | GET | User | المدربون المسجلون عبر رابط الإحالة |
| `/api/ai/chat` | POST | User (اختياري للمجهول) | محادثة EVO — النجاح يُبث SSE (delta/final) والأخطاء JSON؛ توليد الخطة يخصم من الرصيد الموحد |
| `/api/ai/feedback` | POST | User (اختياري للمجهول) | إشارة 👍/👎 على ردود EVO إلى `evo_feedback` (append-only، محدود المعدل) |
| `/api/ai/jobs` | POST/GET | User/Coach + JOB_GATE | طابور مهام AI — فحص ملكية + رصيد، مهام الموظفين محجوبة عن العملاء |
| `/api/ai/meal-plan-demo` | POST | للمشتركين (402 للمجاني/الزائر) | مولد خطة الوجبات — يحرق من الحصة الشهرية الموحدة (نجاح-فقط؛ نافذة دورة الاشتراك) · حفظ تلقائي للأعضاء |
| `/api/ai/planner-plan` | GET | User (الأعضاء فقط — الزائر 401) | ترطيب خطة المولد الأخيرة بنوعها (المصدر العابر للأجهزة) |
| `/api/ai/queue-health` | GET/DELETE | Admin | صحة الطابور + مسح سجلات المهام الفاشلة حصرًا (عقد clearableFailedJobs) |
| `/api/ai/quota` | GET | User session | عدادات الرصيد الموحد (أسبوعي + شهري + التبديلات) |
| `/api/ai/workout-plan-demo` | POST | للمشتركين (402 للمجاني/الزائر) | مولد خطة التمرين — نفس البوابة والحفظ التلقائي للأعضاء |
| `/api/auth/complete-invite` | POST | Public (rate-limited) | إكمال حساب مدعوّ عالق (كلمة مرور + تحديث الملف) لمن سبق إنشاء صفحة مصادقة فارغة بالدعوة |
| `/api/blog/fetch-images` | POST | Admin | جلب صور مقترحة للمقال |
| `/api/blog/suggest-image` | POST | Admin | اقتراح وصف صورة للمقال بـ AI |
| `/api/build-info` | GET | Public | معلومات البناء (commit الحالي) — فحص صحة النشر |
| `/api/coach/ads` | GET/POST | Coach | إعلانات المدرب على صفحته |
| `/api/coach/ai-usage` | GET | User (coach/admin) | استهلاك رصيد عميل (النافذتان الأسبوعية والشهرية) |
| `/api/coach/claim` | POST | User | مطالبة مدرب بعميل عبر كود |
| `/api/coach/clients/invite` | POST | Coach | دعوة عميل جديد — rate-limit + سقف دعوات معلقة |
| `/api/coach/clients/invite/resend` | POST | Coach | إعادة إرسال دعوة عالقة (rate-limit مماثل) |
| `/api/coach/landing` | GET/PUT | Coach | صفحة المدرب العامة (slug + محتوى) |
| `/api/coach/register` | POST | Public (hardened) | تسجيل مدرب — rate-limit + honeypot + role server-side |
| `/api/coach/subscriptions/activate` | POST | User (staff) | تفعيل اشتراك عميل — خصم المحفظة أولًا (402 نقص) + ledger |
| `/api/coach/support` | GET/POST | Coach | تذاكر دعم المدرب من جهته |
| `/api/coach/wallet` | GET | User (coach) | محفظة المدرب + الحركات |
| `/api/coach/wallet/topup` | POST | User (staff) | طلب شحن محفظة (إيصال إلزامي) |
| `/api/coaches/featured` | GET | Public | المدربون المميزون (صفحات عامة) |
| `/api/cron/blog/p0-research` | GET | Cron (CRON_SECRET) | بحث الموضوع (مرحلة 0) — يتطلب `?lang=en|ar` |
| `/api/cron/blog/p1-outline` | GET | Cron (CRON_SECRET) | مخطط المقال (مرحلة 1) |
| `/api/cron/blog/p2-content` | GET | Cron (CRON_SECRET) | كتابة المحتوى (مرحلة 2) |
| `/api/cron/blog/p3-images` | GET | Cron (CRON_SECRET) | الصور (مرحلة 3) |
| `/api/cron/blog/p4-review` | GET | Cron (CRON_SECRET) | المراجعة (مرحلة 4) |
| `/api/cron/blog/p5-publish` | GET | Cron (CRON_SECRET) | النشر (مرحلة 5) — يفرض مقالًا واحدًا لكل لغة يوميًا |
| `/api/cron/dispatch-pipelines` | GET | Cron (CRON_SECRET) | الموزع اليومي 23:40 UTC (مدونة + مهام AI) |
| `/api/cron/exchange-rate` | GET | Cron (CRON_SECRET) | تحديث سعر صرف USD→EGP اليومي للقناتين اليدويتين |
| `/api/cron/progress-reminder` | GET | Cron (CRON_SECRET) | تذكير التقدم الأسبوعي |
| `/api/csp-report` | POST | Public (Report-Only sink) | مستقبل مخالفات CSP — قراءة/تسجيل فقط |
| `/api/evo/followup/dispatch` | POST | Admin أو cron (EVO_CRON_SECRET) | مرسل رسالة المتابعة الأسبوعية من EVO (opt-in إجباري · إيقاع ≥7 أيام) |
| `/api/exercise-mini` | GET | Public (بيانات ثابتة — كاش) | مكتبة التمارين كسجلات مصغرة لعرض الخطط (قانون الحزمة) |
| `/api/file` | GET | User | قراءة ملف من التخزين للمستخدم المصرّح |
| `/api/food-search` | GET | Public | بحث الأطعمة (`?lang=ar|en` لمطابقة نتائج اللغة؛ تُغرق الصفوف غير الآمنة للكيتو عند `?diet=keto`) |
| `/api/local-prices` | GET | Public | الأسعار المحلية المعروضة (EGP) للقناتين اليدويتين |
| `/api/my/coach-whatsapp` | GET | User | رقم واتساب مدرب العميل |
| `/api/notifications/admin` | POST | User | إنشاء إشعار أدمن (service_role، بحراس dedup) |
| `/api/notifications/broadcast` | POST | Coach/Admin | بث إشعارات لمجموعة مستخدمين (استقصاء الأهلية للنشرات) |
| `/api/og-image/[slug]` | GET | Public | صورة OG ديناميكية (Satori + تشكيل عربي) |
| `/api/paypal/capture-order` | POST | User | تأكيد دفع PayPal (مصدر الحقيقة للسعر والتفعيل، idempotent) |
| `/api/paypal/create-order` | POST | User | إنشاء طلب PayPal (السعر يُحسم خادميًا) |
| `/api/paypal/webhook` | POST | PayPal (توقيع) | أحداث PayPal (سجل تدقيق) |
| `/api/plans/member-edit` | POST | User | تعديل العضو لخطته (تتبع التعديلات اليدوية — غير محدودة) |
| `/api/plans/normalize` | POST | Coach/Admin | تطبيع نص خطة يدوية إلى بنية مهيكلة |
| `/api/refund/request` | GET/POST | User | طلب استرداد العضو + فحص الأهلية (7 أيام + عدم استخدام المميزات من الدفاتر المحمية) |
| `/api/send-email` | POST | Server (service-role) | إرسال بريد عبر Brevo REST API (HTTPS) + تحقق صارم + حد يومي |
| `/api/subscription/cancel` | POST | User | إلغاء اشتراك (يمنح أهلية استرداد + عكس عمولات معلّقة) |
| `/api/support/tickets` | GET/POST | User | تذاكر الدعم بين العميل والمدرب |
| `/api/tools/lead` | POST | Public (rate-limited) | التقاط عميل محتمل من كل الأدوات |
| `/api/tools/save-meal-plan` | POST | User | حفظ خطة وجبات |
| `/api/tools/save-result` | POST | User | حفظ نتيجة أداة |
| `/api/tools/saved-meal-plans` | GET/DELETE | User | إدارة خطط الوجبات المحفوظة |
| `/api/tools/saved-results` | GET/DELETE | User | إدارة النتائج المحفوظة |
| `/api/upload` | POST | User | رفع ملف للتخزين (حدود + تعقيم) |

---

## 9. الاعتماديات

> **قانون المصدر الواحد (AGENTS.md §3.8):** البيت الوحيد للاعتماديات وإصداراتها: **[`package.json`](./package.json)** و`bun.lock` (التثبيت المقفل — نفس الشجرة التي تبني منها CI والنشر). ملاحظات قراءة: عناصر Radix UI تُستورد كحزم مستقلة تحت `@radix-ui/*`، وجرد طبقة shadcn/ui الكامل بأسمائه في `docs/TECH_REFERENCE.md` §3، والتثبيت في CI/النشر دائمًا `bun install --frozen-lockfile`.

---

## 10. النشر والاستضافة — AWS Lightsail

> **أصل الإنتاج منذ قطع DNS بتاريخ 2026-10-10.** خطة الهجرة الكاملة وسجلها: [`docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md`](./docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md). ملف [`vercel.json`](./vercel.json) يبقى فقط لمسار التراجع الموثق (DNS rollback) — Vercel لم يعد يشغّل الإنتاج.

### شكل الإنتاج

```
المتصفح ──► Cloudflare (DNS · TLS · كاش HTML/الصور/الخرائط · rate-limit /api/*)
              └─► AWS Lightsail (Ubuntu · Caddy :443)
                    └─► PM2 → Next.js start على 127.0.0.1:3000
                          └─► Supabase (Postgres/Auth/Storage)
```

- **الخادم:** Lightsail بنظام Ubuntu — التجهيز الأول مرة واحدة بـ `deploy/setup-server.sh` (Node 22 · Caddy · PM2 + pm2-logrotate · bun · SWAP).
- **العملية:** PM2 يشغّل Next.js في وضع fork (تعريف `ecosystem.config.js`) بصمام إعادة تشغيل بالذاكرة وسقف V8 old-space — الإعدادات معلقة فوق الخطة الحالية بذهبها.
- **الإصدارات:** كل إصدار يُبنى إلى `/srv/alkemos/releases/<sha>` والرابط الرمزي `current` يُقلب ذريًا (نمط capistrano) — `deploy/deploy.sh` للتفعيل الآمن و`deploy/rollback.sh` للتراجع اليدوي.
- **الحافة على الصندوق:** `deploy/Caddyfile` ينهي TLS ويعكس البروكسي ويحقن ترويسات الأمن وقواعد كاش الأصول الثابتة (مطابقة حرفية لما كان يحقنه vercel.json).
- **البيئة:** القيم الحية في `/srv/alkemos/shared/.env` — تُرحَّل من GitHub Secrets تلقائيًا مع كل نشر (دمج إضافي idempotent، ولا تُطبع القيم أبدًا في أي سجل).

### خط النشر الآلي

[`.github/workflows/deploy-aws.yml`](./.github/workflows/deploy-aws.yml) — كل دفعة كود إلى `main`:

1. **اختبارات إلزامية** (`tsc --noEmit` · ESLint · `vitest run`) بنفس بيئة CI المجمدة.
2. **مهمة `migrate`**: تطبيق الميجريشنز المعلّقة بالدفتر **قبل** حيازة الكود (دفعة تشحن ميجريشن بلا قناة تطبيق تحجب نشرها هي نفسها).
3. **بناء وتجهيز**: بناء الإصدار، ترحيل env، رفعه وتفعيله بـ`deploy.sh`.
4. **فحص صحة**: `/api/build-info` يجب أن يخدم SHA الإصدار الجديد — وإلا **تراجع تلقائي** للإصدار السابق.
5. **بطارية تحقق بعد النشر**: فحوص خادمية عبر SSH (PM2 · ذاكرة/swap · قرص · مسارات :3000 مباشرة) + فحوص حافة عبر Caddy (صفحات ثنائية اللغة · خرائط · ترويسات الأمن · توليد OG عربي · مسح SSE مجهول).

- **دفعات التوثيق فقط** (Markdown/docs/archive/scripts) تتخطى النشر كاملًا بأمان (paths filter) — GitHub Actions ما زال يشغّل البوابات.
- **`workflow_dispatch`** متاح للتمارين وإعادة التشغيل، وخيار `rollback_drill` يبرهن على `deploy/rollback.sh` نهاية-إلى-نهاية والنهاية دائمًا أحدث إصدار حي.
- **الجدولة على الخادم:** `deploy/crontab-alkemos` (نسخ احتياطي دوري وأعمال صيانة خفيفة).

### التشغيل والصيانة السريعة

```bash
# على الخادم (SSH):
pm2 status                       # حالة العملية
pm2 logs alkemos --lines 100     # آخر السجلات
tail -f /var/log/alkemos/error.log
bash /srv/alkemos/current/deploy/rollback.sh   # تراجع يدوي للإصدار السابق
```

> **قانون:** لا تشغيل يدويًا على الخادم ما يفعله خط المستودع — النشر والترحيل والتراجع كلها قنوات مؤتمتة، والتدخل اليدوي استثناء موثق بخطواته.

---

## 11. الاختبار والصيانة

### أوامر التحقق القياسية (AGENTS.md §3.5)

```bash
npx tsc --noEmit        # صفر أخطاء TypeScript (شرط الدفع)
bun run lint            # صفر أخطاء ESLint (التحذيرات الموروثة مقبولة)
bun run test            # مجموعة Vitest كاملة
bun run build           # عند مساس البناء/الرندر/المسارات
```

### بوابات الدفع (تلقائية على GitHub Actions)

- **quality-gate** — البطارية أعلاه (محددة النطاق بالمسارات: دفعات التوثيق تتخطى ما لا تستطيع تغييره).
- **docs-parity-gate** — `scripts/docs_parity.py` (ترويسة سجل الميجريشنز = الحقيقة) + `scripts/docs_audit.py` (سلامة منظومة المعرفة: STATE/السجل/الأرقام) + `scripts/migration_audit.py` (مرآة types.ts).
- **guard-stale-refs** — معرفات متقاعدة + أسلاك UI + قانون الباب الوحيد لموجه AI.
- **migration-state-audit** — فحوص قراءة-فقط أن آخر ميجريشن مطبَّق فعلًا على الإنتاج (يوميًا + مع كل دفعة).
- **Supabase Preview** — الميجريشنز على قاعدة معاينة قبل الإنتاج.

الشرح التعليمي الكامل لكل بوابة: [`docs/CI_GATES.md`](./docs/CI_GATES.md).

### صيانة دورية مفيدة

```bash
python3 scripts/docs_audit.py              # تقرير سلامة منظومة المعرفة محليًا
python3 scripts/docs_parity.py             # توافق سجل الميجريشنز
python3 scripts/migration_audit.py         # انجراف types.ts
python3 scripts/worklog_rotate.py --dry-run # حالة نافذة سجل العمل
bash scripts/check-stale-refs.sh           # معرفات متقاعدة
```

- **سجل العمل:** `worklog.md` الحي هو النافذة النشطة (سقف صلب ≤ 12 مدخلًا و ≤ 128KB بفحص H5) وكل ما دون النافذة يدور حرفيًا إلى `archive/WORKLOG_ARCHIVE.md` بنفس الكوميت عبر `python3 scripts/worklog_rotate.py` — بالقياس لا بالتقويم.
- **لقطات docs/ التاريخية المتقاعدة** تنزل إلى `docs/archive/`.
- **فحص الروابط الخارجية للمقالات** وقياس GEO عمليات مجدولة (workflows) لا خطوات يدوية.

---

## 12. الاصطلاحات البرمجية

### تسمية الملفات

- **المكونات:** `PascalCase.tsx`
- **الـ hooks:** `use-kebab-case.tsx`
- **المكتبات/الوحدات:** `kebab-case.ts`
- **مسارات API:** `kebab-case` مجلدًا وملف `route.ts` (الاستثناء الوحيد: `route.tsx` لمسار OG)

### الألوان (نظام الهوية)

> النظام الحالي **«Marble & Chrome»** برموز CSS متغيرة في `src/app/globals.css`، وبيته الحاكم: **[`DESIGN.md`](./DESIGN.md)** — السلم اللوني الكامل، الوضعان الداكن والفاتح مواطنان متساويان، والاستثناء اللوني الوحيد `--ai` سيان لأسطح مساعد الذكاء الاصطناعي. أي قيمة لونية في كود جديد تُشتق من رموز `globals.css` لا من قيم ثابتة.

### طبقة AI (المسار الموحد)

1. لا نداء نموذج خارج `src/lib/ai-provider.ts` (المحرك الوحيد).
2. كل وظيفة توليد جديدة تُسجَّل في `src/lib/ai-registry.ts` بسلّمها وسياستها ودليلها، وتُرسل عبر `dispatchAI`/`dispatchGrounded` فقط.
3. السياسات (العمق/المهلة/الحرارة/jsonMode) تُحل من السجل — لا سياسات inline في مواقع النداء.
4. جيب الزمن الكلي لكل مسار متسلسل مقيَّد داخليًا (سقف قابل للرفع بمتغير البيئة `AI_CHAIN_TOTAL_BUDGET_MS` عند الحاجة).
5. مخرجات الخطط تمر بمدقق الجودة الإلزامي — استجابة 200 من المزود ليست دليل جودة.
6. الأدوار الطويلة (مدونة/خطط) عبر طابور `ai_jobs` على GHA runner، لا داخل طلبات HTTP.

### نمط المصادقة

```typescript
// أي مسار API يبدأ ببوابة صريحة:
const auth = await requireUser(request);      // أو requireCoach / requireAdmin
// requireUser يعيد الجلسة الموثقة + المستوى المحلول من الاشتراكات الفعالة
```

- الأدوار تُقرأ من الجلسة الموثقة فقط — لا من payload العميل.
- كتابة `profiles.role` من سياق المستخدم ممنوعة بنيويًا (قانون سلامة الأدوار — `role_audit_log` يسجل كل تغيير عبر القنوات المصرّح بها).

### نمط التنقل

- في الخادم/الروابط: URLs حقيقية (`/tools/bmi-calculator`, `/ar/tools/...`).
- داخل مكونات العرض القديمة: `useNav().navigate("view")` يترجم إلى URL — لا `router.push` مباشر في الـviews.

### اللغتان

- كل سطح عام له نسختان `(en)` و`(ar)/ar` بروابط hreflang متبادلة، و`lang`/`dir` ديناميكيان على الجذر من المسار.
- النص العربي للمحتوى المنشور فصحى حديثة يحميها كاشف اللهجات (`src/lib/blog-msa.ts`) — الخلط اللاتيني السائب ممنوع (الاستثناء: إشارة بين قوسين أو اسم علامة).
