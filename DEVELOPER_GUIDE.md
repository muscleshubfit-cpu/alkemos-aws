# Developer Guide — Alkemos

> **آخر تحديث:** 2026-09-24 (DOC-REMEDIATION-274 — تنفيذ خطة التقرير الخارجي: §5/§9/§11/§12 صارت إحالات لمصادرها الحاكمة، شجرة §2 لمجموعات المسارات، بريد الديمو ahmed@، متطلب Node 20.9+؛ سابقًا 2026-09-20 P2-7)
> **وظيفة الملف:** onboarding المطور + المعمارية والتدفقات والمراجع السريعة فقط
> **الجمهور المستهدف:** مطورين جدد ينضمون للمشروع، أو المطور الحالي كمرجع
> **أين تعدَّل معلوماته:** أي تغيير معمارية/تدفق/متطلب يحدّث القسم المعني بنفس الفريم (AGENTS.md §3.8)
> **مصادر الحقيقة المرتبطة:** `package.json` + `bun.lock` (الاعتماديات) · `src/lib/memberships.ts` + `src/lib/tier-limits.ts` (الباقات والحصص) · `DESIGN.md` (الهوية والألوان) · `AGENTS.md` §8 (طبقة AI) · `STATE.md` (الأرقام الحية)
> **المالك:** muscleshubfit@gmail.com · **دورية المراجعة:** شهرية + بعد كل موجة تطوير كبيرة
> **المرجع التقني العميق:** [`docs/TECH_REFERENCE.md`](./docs/TECH_REFERENCE.md) — بنية Supabase وقانون الميجريشنز وجداول القواعد الخاصة · شرح RLS التفصيلي (predicates · نمط الأدوار v2 · عوالم المال) · قائمة Shadcn كاملة بأسمائها · كل أكواد SQL المعقدة منظمة. الملف ده بيفضل مختصص: الإعداد والتدفقات والمراجع السريعة فقط.
> **Note (Phase 7):** Several stale claims in this file were reconciled
> against the actual source code. Look for `> **Phase 7 correction:**`
> notes inline. Current repository statistics live in `STATE.md`; the
> Phase-115-frozen status history is preserved at `archive/PROGRESS.md`.

---

## 📋 المحتويات

1. [الإعداد المحلي](#1-الإعداد-المحلي-local-setup)
2. [هيكلية الملفات التفصيلية](#2-هيكلية-الملفات-التفصيلية)
3. [طبقات البناء المعماري](#3-طبقات-البناء-المعماري-architecture-layers)
4. [قاعدة البيانات + RLS](#4-قاعدة-البيانات--rls)
5. [نظام المصادقة + العضويات](#5-نظام-المصادقة--العضويات)
6. [EVO AI Chat](#6-evo-ai-chat)
7. [نظام المدونة + AI Generation](#7-نظام-المدونة--ai-generation)
8. [API Routes Reference](#8-api-routes-reference)
9. [الاعتماديات الكاملة](#9-الاعتماديات-الكاملة-dependencies)
10. [الـ Deploy على Vercel](#10-الـ-deploy-على-vercel)
11. [الاختبار + الصيانة](#11-الاختبار--الصيانة)
12. [الاصطلاحات البرمجية](#12-الاصطلاحات-البرمجية-conventions)

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
git clone https://github.com/muscleshubfit-cpu/alkemos.git
cd alkemos
bun install
```

> **المستودع خاص** (قرار المالك 2026-09-24): الاستنساخ يتطلب حسابًا بصلاحية وصول من المالك على GitHub.

> **المستودع خاص** (قرار المالك 2026-09-24): الاستنساخ يتطلب حسابًا بصراحة وصول من المالك على GitHub.

### متغيرات البيئة

انسخ `.env.example` إلى `.env.local`:

```bash
cp .env.example .env.local
```

الحد الأدنى المطلوب للتشغيل:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

بدون هذه المتغيرات، يعمل الموقع في **demo mode** (localStorage):
- Coach تجريبي: `ahmed@coach.app` / `coach123` (المصدر: البذر في `src/lib/data/auth.ts`)
- Client تجريبي: `client@demo.app` / `client123`

### تشغيل البيئة التطويرية

```bash
bun dev          # يشغل Next.js على المنفذ 3000
# أو: npm run dev
```

افتح: http://localhost:3000

### Build للإنتاج

```bash
bun run build    # يضغط الصور + يبني Next.js
bun start        # يشغل نسخة الإنتاج محلياً
```

### Lint

```bash
bun run lint     # ESLint
```

> **Phase 7 correction (2026-08-19):** The previous claim that
> `typescript.ignoreBuildErrors: true` is set in `next.config.ts` is
> **incorrect**. Verified by reading `next.config.ts` — the property
> is NOT present. TypeScript strict checks are enabled, all
> `@ts-nocheck` pragmas have been removed, and `tsc --noEmit` is
> clean (0 errors).
>
> The previous claim that ESLint is "disabled" is also incorrect.
> Next.js 16 dropped the `eslint` config block from `next.config.ts`
> entirely (the inline comment in `next.config.ts` documents this).
> ESLint runs via the `bun run lint` script using the flat config
> in `eslint.config.mjs` (next core-web-vitals + typescript presets).

---

## 2. هيكلية الملفات التفصيلية

```
src/
├── app/                         # Next.js App Router — أربع مجموعات مسارات
│   ├── (en)/                    # الموقع العام الإنجليزي (المرجع)
│   │   ├── (home)/              # الرئيسية (LandingView)
│   │   ├── tools/               # الحاسبات المجانية (قائمة الأدوات وعددها بمصدرها الوحيد src/lib/tools-shared.ts)
│   │   ├── meal-planner/ · ai-meal-planner/ · ai-workout-planner/
│   │   ├── exercises/ · foods/ · programs/ · diet-plan/
│   │   ├── blog/ · authors/ · compare/ · collections/
│   │   ├── muscles/ · equipment/ · faq/ · for-coaches/ · coaches/ · coaching/ · evo/
│   │   ├── memberships/ · affiliate/ · about/ · contact/ · privacy/ · terms/
│   │   └── layout.tsx · not-found.tsx
│   ├── (ar)/ar/                 # المرآة العربية الكاملة RTL (نفس شجرة (en) تحت /ar)
│   ├── (app)/                   # منطقة التطبيق — layout بـ auth gate
│   │   ├── (authed)/            # العضو المسجل: dashboard · coach · plans · progress · questionnaires · referral · support
│   │   ├── admin/               # لوحة الأدمن (AdminGate — أدمن فقط): dashboard · members · clients · coaches · assignments · finances · payments · blog · coach-system · coach-pages · coach-support · external-plans · accounts · leads · referrals · saved-results · wallets · evo-analytics
│   │   ├── auth/                # تسجيل الدخول/التسجيل/الاستعادة
│   │   └── checkout/ · profile/ · preview/
│   ├── api/                     # API Routes (count = code truth — see §8)
│   │   ├── ai/                  # AI (chat, jobs الطابور + quota, queue-health)
│   │   ├── admin/               # Admin (external-plans, accounts, wallets, refunds, staff, blog, …)
│   │   ├── coach/               # B2B (clients/invite, wallet, subscriptions/activate, support, …)
│   │   ├── tools/               # Tool endpoints (save-result, save-meal-plan, lead, …)
│   │   ├── cron/                # Cron (dispatch-pipelines 23:40 UTC + blog p0-p5 + progress-reminder)
│   │   ├── paypal/              # PayPal (create-order, capture-order, webhook)
│   │   └── …                    # send-email, food-search, og-image, build-info, …
│   ├── globals.css              # رموز النظام البصري (الحاكم: DESIGN.md)
│   └── metadata.ts              # SEO metadata شاملة (+ خرائط sitemap*/rss في جذر app/)
├── components/
│   ├── ui/                      # shadcn/ui primitives — القائمة الكاملة بالأسماء في docs/TECH_REFERENCE.md §3
│   ├── views/                   # page-level views (منها AdminExternalPlansView — توليد غير الأعضاء)
│   ├── blog/                    # مكونات المدونة
│   ├── SiteHeader.tsx           # الهيدر + التنقل + الإشعارات
│   ├── AppLayout.tsx            # سايدبار الأدوار (عضو/مدرب/أدمن — عناصر الأدمن isAdmin فقط)
│   ├── EvoFloatingWidget.tsx    # EVO floating chat
│   ├── AdSenseAd.tsx            # إعلانات AdSense (tier-gated)
│   ├── SaveResultButton.tsx    # حفظ + تصدير النتائج
│   ├── NotificationBell.tsx     # إشعارات المستخدم
│   ├── AdminNotificationBell.tsx # إشعارات الكوتش
│   └── ...
├── hooks/
│   ├── use-auth.tsx             # Auth context + state
│   ├── use-nav.tsx              # Navigation adapter (View → URL)
│   ├── use-membership-tier.ts   # Client-side tier resolution
│   ├── use-mobile.ts            # Mobile detection
│   └── use-toast.ts              # Toast notifications
├── lib/
│   ├── memberships.ts           # تعريف العضويات + الأسعار + الحدود
│   ├── data/                    # طبقة البيانات (13 وحدة: auth, blog, chat, coach, plans,
│   │                            #   progress, questionnaires, referrals, subscriptions,
│   │                            #   tickets, notifications + helpers + index re-export)
│   ├── auth-server.ts           # مصادقة الخادم (requireUser, requireCoach)
│   ├── ai-provider.ts           # موفر AI موحد (OpenRouter + fallbacks)
│   ├── ai-registry.ts           # سجل وظائف AI الموحد (بيانات صرفة: فصيلات/سلالم/سياسات بأدلتها — مصدر التوجيه الوحيد)
│   ├── ai-router.ts             # موجّه AI الرقيق (dispatchAI/dispatchGrounded + AI_ROUTER_MODE=legacy)
│   ├── ai-usage-meter.ts        # عدادات الاستخدام (مزود×نموذج×وظيفة + حصتا Tavily/Exa — fail-open)
│   ├── exercises.ts             # 868 تمرين
│   ├── foods.ts                 # 8,830 أكلة
│   ├── blog-pipeline.ts         # مراحل توليد المقالات (P1/P2/P4 + المحلل المحصّن)
│   ├── blog-topics.ts           # اختيار مواضيع المدونة
│   ├── blog-admin.ts            # أدوات تحرير المدونة
│   ├── blog-server.ts           # جلب بيانات المدونة (server-side)
│   ├── blog.ts                  # جلب بيانات المدونة (client-side)
│   ├── blog-images.ts           # جلب صور المدونة
│   ├── evo-chat-context.tsx     # حالة محادثة EVO (تُحرَّك مع الودجت المؤجل — Phase 216)
│   ├── evo-chat-events.ts     # مُوزّع حدث فتح ودجت EVO (بلا اعتماديات — Critical path خفيف، Phase 216)
│   ├── evo-search.ts            # بحث المنصة لـ EVO
│   ├── plan-generator.ts        # توليد خطط تغذية/تمرين بـ AI (+ regenerateMeal/FoodItem/WorkoutDay, substituteExercise)
│   ├── external-plan-text.ts    # أنواع خطط غير الأعضاء المهيكلة + تصييرها نصًا
│   ├── ai-jobs.ts               # أنواع مهام AI الطابير + البوابات (JOB_GATE) + تعقيم الحمولات
│   ├── ai-job-processors.ts     # معالجات المهام (تُشغّل في GHA runner) + تجسيد مسودات الخطط
│   ├── ai-jobs-client.ts        # إرسال مهمة ومتابعتها من المتصفح (poll حتى done)
│   ├── tier-limits.ts           # حدود الباقات (شات/تبديلات/رصيد خطط العميل الموحد — سقف أسبوعي 1+1 + إجمالي شهري 4+4، برو 2×)
│   ├── coach-limits.ts          # أسعار نظام المدربين B2B + تفعيل العملاء (الرصيد الموحد في tier-limits)
│   ├── refund.ts                # أهلية استرداد 7 أيام (server-only)
│   ├── referral.ts              # نظام الإحالات + العمولات
│   ├── referral-cookie.ts       # تتبع كوكيز الإحالة
│   ├── result-png-export.ts     # تصدير PDF/PNG (Canvas-based)
│   ├── seo.ts                   # JSON-LD schema generators
│   ├── plans.ts                 # أنظمة الاشتراكات القديمة (legacy)
│   ├── workout-programs.ts      # برامج التدريب الجاهزة
│   ├── exercise-images.ts       # حل روابط صور التمارين (self-hosted WebP — batch 2)
│   ├── supabase/
│   │   ├── client.ts            # Supabase browser client
│   │   ├── admin.ts             # Supabase admin client (service_role)
│   │   └── types.ts             # TypeScript types (قديم جزئياً)
│   └── ...
├── middleware.ts                # Session refresh + Content-Language header
└── ...
```

---

## 3. طبقات البناء المعماري (Architecture Layers)

```
┌──────────────────────────────────────────────────┐
│                    Pages                        │
│  (App Router — server + client components)      │
├──────────────────────────────────────────────────┤
│                   Views                          │
│  (src/components/views/ — page-level UI)         │
├──────────────────────────────────────────────────┤
│               Components                         │
│  (src/components/ — reusable UI parts)           │
├──────────────────────────────────────────────────┤
│                  Hooks                           │
│  (useAuth, useNav, useMembershipTier)             │
├──────────────────────────────────────────────────┤
│             Data Layer                           │
│  (src/lib/data/ — Supabase CRUD + localStorage)  │
├──────────────────────────────────────────────────┤
│             Supabase                             │
│  (Postgres + Auth + Storage + RLS)               │
└──────────────────────────────────────────────────┘
```

### أنماط التصميم الرئيسية:

1. **Dual-mode data layer**: `src/lib/data/` يعمل مع Supabase أو localStorage (demo mode)
2. **Server-side auth**: `auth-server.ts` يقرأ session من cookies + يحلل الـ tier
3. **Client-side tier resolution**: `useMembershipTier` hook يجلب الـ tier من `subscriptions` table
4. **Navigation adapter**: `useNav` يحوّل `navigate("view")` إلى URL حقيقي
5. **AI fallback chain**: `callAIWithFallback` يجرب سلسلة النماذج بالترتيب (OpenRouter + Groq + NVIDIA NIM)
6. **PDF export without libraries**: Canvas 2D → JPEG → minimal PDF 1.4

---

## 4. قاعدة البيانات + RLS

> **الشرح التقني العميق انتقل** (أمر المالك 2026-09-03 — Phase 112): [`docs/TECH_REFERENCE.md`](./docs/TECH_REFERENCE.md) — بنية Supabase (anon vs service-role · مرآة `types.ts` · بوابة الانجراف `migration_audit.py`) · قانون الميجريشنز (التسمية `YYYYMMDDHHMMSS_NNNN` · التطبيق تلقائي عبر تكامل Supabase–GitHub عند الهبوط على main — تصحيح المرحلة 120 · idempotency · RAW-SQL-LINK للمسار اليدوي · نمط RUN_ON_SUPABASE) · جداول القواعد الخاصة (`ai_jobs` · `evo_chat_usage` · `evo_anon_usage` · تحصينات `subscriptions` · عائلة `coach_*`) · **شرح RLS التفصيلي** (دوال الـpredicates `is_coach`/`is_admin`/`is_coach_over`/`coach_of` · نمط الأدوار v2 · فصل عالمَي المال · تدفقات إضافة المدربين) · كل أكواد SQL المعقدة المذكورة في AGENTS.md مجمعة ومنظمة.
>
> **الحقيقة الحالية:** `src/lib/supabase/types.ts` (الأعمدة والعلاقات) +
> `supabase/migrations/INDEX.md` (الترقيم والسجل) — الكود هو الحقيقة.
> جدول جديد = ميجريشن جديدة بسياسات RLS الخاصة به + صف في `INDEX.md` +
> تحديث المرآة في نفس الكوميت، والقواعد الخاصة تتوثق في
> `TECH_REFERENCE.md` §1.4.
>
> **Storage buckets:** `questionnaire-photos` · `progress-photos` · `receipts` + الباكت العام `avatars` (صور الأفاتار — ميجريشن 0090) + باكت العام `coach-public` (التفاصيل: TECH_REFERENCE §1.5).

---

## 5. نظام المصادقة + العضويات

### تدفق المصادقة

```
User → /auth (email/password أو Google OAuth)
  → Supabase Auth (PKCE flow)
  → Cookie set via middleware
  → Profile fetched from `profiles` table
  → Role checked (client vs coach)
  → Redirect to /dashboard (client) or /coach (coach)
```

### حل الـ Tier

```
Client-side:  useMembershipTier(profile) → queries subscriptions table → picks highest priority membership
Server-side:  requireUser(request) → queries subscriptions table → picks highest priority membership

Membership priority (verified from src/lib/auth-server.ts):
  pro (3) > premium (2) > free (0)

Coaching is treated SEPARATELY — it is NOT a higher membership tier.
It grants EVO access equivalent to Premium, but does not upgrade
the membership_tier field.
```

> **Phase 7 correction (2026-08-19):** The previous claim of
> `coaching (4) > pro (3) > premium (2) > elite (1) > free (0)` is
> **incorrect**. There is NO `elite` tier in the actual implementation
> (verified by reading `src/lib/memberships.ts` and
> `src/lib/auth-server.ts`). The `MembershipTier` type is
> `"free" | "premium" | "pro" | "coaching"` — four tiers only.

### العضويات (الباقات والحصص)

> **قانون المصدر الواحد (AGENTS.md §3.8):** هذا الدليل لا يحمل أي رقم متغير —
> الأسعار والباقات والحصص بيتها الوحيد:
> **[`src/lib/memberships.ts`](src/lib/memberships.ts)** (تعريف الباقات والأسعار)
> + **[`src/lib/tier-limits.ts`](src/lib/tier-limits.ts)** (محرّك الحصص: البوول
> الشهري الموحد لتوليد الخطط — تغذية وتمارين من رصيد واحد نجاح-فقط — + حصص
> التبديلات وحدود حفظ النتائج). الجدول المكافئ في `README.md` يُشتق منهما
> أيضًا. أي سؤال «كم حصة/كم سعر؟» جوابه المباشر من هذين الملفين.

---

## 6. EVO AI Chat

### البنية

```
EvoFloatingWidget / ChatView (UI)
  → EvoChatProvider (state — localStorage + chat_messages sync للعرض فقط — تركب مع الودجت بعد load، Phase 216)
  → /api/ai/chat (server route)
    → Tier gate — auth.membership_tier من الجلسة الموثقة (active + غير منتهية)
    → دفتر استخدام server-side غير قابل للعبث: evo_chat_usage (migration 0022)
      يُسجَّل قبل استدعاء الـ AI للرسائل — مسح المحادثة لا يؤثر على حصة الرسائل
      (توليد الخطط يُحتسب على البوول الموحد الناجح-فقط: ai_plan_usage
      ميجريشن 0085 — المرحلة 183)
    → بوابة المشتركين (المرحلة 183): للتبديلات فقط — أما نية إنشاء
      الخطة فمفتوحة للجميع (زائر/مجاني/مدفوع) وتُقيّد بالرصيد الشهري
      الموحد (2/4/8/8)
    → Platform search (تمارين، أكلات، برامج، أدوات) + بحث المدونة
    → callFreeAIFallbackChain (OpenRouter + Groq + NVIDIA interleaved، ≤52s budget)
      — Phase 89: خيار onDelta يمرر قطع الرد الخام لحظياً
    → النجاح يُبث SSE (text/event-stream):
        event: delta  → قطع خام أول بأول (المستخدم يشوف الرد وهو بيتكتب)
        event: final  → النص الكامل المنظف + links + source (يستبدل القطع الخام)
        event: error  → انقطاع منتصف البث (العميل يحتفظ بالنص الجزئي)
      والأخطاء/429 تبقى JSON — العميل يميز بالنوع (content-type)
    → التنظيف (LaTeX/تفكير/ماركداون) يحتاج النص كاملاً فيعمل بعد الجمع
      وبيتبعت في final — ممكن يختلف شوية عن القطع الخام بالتصميم
    → Local fallback عند عدم توفر المزودين (يبث final محلياً)
```

> **2026-08-27:** زر "مسح المحادثة" أُزيل نهائياً من الـ widget وصفحة /chat
> (توجيه المالك #4). كان يسمح بمسح صفوف chat_messages التي كان العداد
> القديم يعتمد عليها → تجاوز الحد اليومي.

### السلسلة المتشابكة

> **قائمة الموديلات الحية بيتها الوحيد:** `src/lib/ai-provider.ts` (سلسلة
> متشابكة بقيادة دوّارة بين المزودين، أقوى نموذج أولاً) — والقانون الكامل
> بمزوديه ومسارَيه القانونيين: `AGENTS.md` §8. **مصدر سياسات التوجيه
> (التوحيد المعتمد 2026-10-31):** كل وسم توليد (فصيلات خطط/مدونة/أدوات/
> تواصل/عروض/EVO) له مواصفة بيانات صرفة بـ`src/lib/ai-registry.ts`
> (السلم بدليله المقيس · السياسة بمبرر قوانين الحوادث · البوابات ونقطة
> الدخول كمراجع) ويُرسل حصرًا عبر `dispatchAI`/`dispatchGrounded` من
> `src/lib/ai-router.ts` — **مواقع النداء لا تحمل أي سياسة توجيه**
> (العمق/المهلة/الحرارة/jsonMode تُحل من السجل وحده؛ قائمة التجاوزات
> المغلقة ترفض مس السياسة، والمسار الرجعي `AI_ROUTER_MODE=legacy` يخدم
> اللقطة المجمدة قبل الهجرة). الكاناري الذهبية
> `src/lib/__tests__/ai-registry.test.ts` تثبت آليًا لكل وسم أن
> registry ≡ legacy ≡ مشية المحرك الفعلية، وحارس CI
> `scripts/check-ai-router-guard.sh` يحرس مع كل دفعة: الباب الوحيد (لا
> نداء محرك خارج المركز) واكتمال السجل باتجاهين (لا وسم غير مسجل ولا
> تسجيل ميت). عمق كل وظيفة ومهلتها الحرفيان بالسجل (doc.evidence يشير
> لموقع النداء التاريخي) مع ضمانة أن العمق × المهلة ≤ جيب الزمن داخليًا
> في `ai-provider.ts` (سقف دوال Vercel serverless؛ السيرات ترفعه عبر
> `AI_CHAIN_TOTAL_BUDGET_MS`).

### Subscriber Gating (المرحلة 183 «البوول الموحد»)

18 نمط regex بالعربية + الإنجليزية لنوايا الميزات (خطط/تبديل/regenerate):
- **التبديلات فقط** بوابة مشتركين — لا اشتراك فعلي → رسالة مع رابط `/memberships`
- **إنشاء الخطط** لم يبقَ بوابة مشتركين: الزائر والمجاني والمدفوع —
  الجميع يولّد ضمن البوول الشهري الموحد (ai_plan_usage): مجاني 2 ·
  بريميوم 4 · برو 8 · كوتشينج 8 — تغذية وتمارين من رصيد واحد،
  نجاح-فقط، يتصفّر أول الشهر
- **تجميع الحصص المدفوعة** (أمر المالك 2026-10-28): بوول العضو =
  مجموع حصص كل مستوى مدفوع فعّال (بريميوم 4 + برو 8 = 12؛ كوتشينج
  يتراكم مثله) — الاستهلاك قبل الترقية يبقى محسوبًا على المجموع
  (استُهلك 2 ← المتبقي 10، لا تصفير ولا احتساب مرتين؛ مساهمة
  المستوى تنتهي بانتهاء فترته المدفوعة) — المصدر الوحيد:
  `resolveUnifiedPlanPoolLimit` ‏(membership-tier.ts) + `checkUnifiedPlanQuota`
  ‏(tier-limits.ts)؛ مستوى العرض للشارات/الميزات يظل «أفضل عضوية تفوز»
- paid tier = اشتراك active وغير منتهية (Premium/Pro/Coaching) من الجلسة الموثقة

---

## 7. نظام المدونة + AI Generation

### التدفق اليدوي (مسار الكوتش — Phase 162)

```
Coach → لوحة المقالات → زر التوليد
  → /api/ai/jobs (enqueue — لا نداء نموذج من Vercel)
  → blog-pipeline-dispatch.ts يُرسل workflow_dispatch لنفس مسار الأتوماتيكي
    (blog-post-{en|ar}.yml عبر GITHUB_DISPATCH_TOKEN — fail-open)
  → نفس الأنابيب P0→P5 (بحث ← مخطط ← محتوى ← صور ← مراجعة ← نشر)
  → موضوع الكوتش (≥10 أحرف) يُختم في جهته من الـsharedBrief
  → صف ai_jobs = إيصال إرسال (done + pipelineDispatched)
الاحتياط عند فشل الإرسال: المولد الأحادي runArticleGenerate داخل
  ai-job-processors.ts (المحصّن 161.4/161.5) — لا مسار ثالث.
(Phase 171: صفوف الكوتش معفاة من حصة المقال الآلي اليومي — أمر مالك).
```

### التدفق الآلي (Cron)

```
GitHub Actions — TWO language workflows (ONE run == ONE article in ONE language):
  blog-post-en.yml  22:00 UTC  = 1 EN article/day (18:00 US Eastern — evening peak)
  blog-post-ar.yml  05:00 UTC  = 1 AR article/day (08:00 Cairo EEST — morning window)
  → TOTAL 2 articles/day — different times per audience geography (Phase 119)

Each run drives that language's queue row through the pipeline steps
  (all CRON_SECRET-authed):
  p0-research → p1-outline → p2-content → p3-images → p4-review → p5-publish
  Row statuses: researched→outlined→writing→written→images_done→reviewed→published

Vercel cron /api/cron/dispatch-pipelines (daily 23:40 UTC — Phase 171: after
  both daily slots AND past the 90-minute scheduler-delay grace window)
  TOPS UP any genuinely missed slots only — a slot counts as expected 90 min
  after its hour (GitHub's documented cron delay), coverage = max(non-failed
  runs today, posts published today) — it never exceeds the 1+1 quota
  (Phase 119: one article per language per day, now also enforced at P5
  itself: an automated row cannot publish a second same-day article).

State tracked in blog_generation_queue table (one row per language).
```

---

## 8. API Routes Reference

> **Phase 82 parity fix (2026-09-02) + Phase 104 docs-parity (2026-09-03)
> + Phase 107 single-source law:** the table below was rebuilt from the
> code and re-verified per file (exported handlers + auth guards). This
> doc deliberately carries NO endpoint totals — the live count is
> whatever `find src/app/api -name "route.ts*" | wc -l` says, and
> `scripts/docs_audit.py` fails any total written here (AGENTS.md §3.8).

| Route | Method | Auth | الوظيفة |
|---|---|---|---|
| `/api/admin/accounts` | GET/PATCH/DELETE | Admin | تعليم حسابات الاختبار + حذف متسلسل |
| `/api/admin/assignments` | GET/PATCH | Admin | تعيين العملاء للمدربين + سجل التفعيلات |
| `/api/admin/blog/cleanup` | POST | Admin/Cron | إصلاح النصوص المشوهة في المقالات |
| `/api/admin/coach-fees` | GET/PATCH | Admin | رسوم نظام المدربين الشهرية لكل عميل |
| `/api/admin/coach-kind` | POST | Admin | تحويل نوع المدرب site ↔ b2b (profiles.coach_kind — Phase 103) |
| `/api/admin/coach-pages` | GET/PATCH | Admin | مراجعة صفحات المدربين (نشر/رفض) |
| `/api/admin/coach-pages/notify` | POST | Admin | إشعار مدرب بقرار مراجعة صفحته |
| `/api/admin/coach-payments` | GET | Admin | سجل تفعيلات المدربين (coach_payments) |
| `/api/admin/coach-support` | GET/POST | Admin | صندوق دعم المدربين (رد الأدمن) |
| `/api/admin/evo-analytics` | GET | Admin | تحليلات EVO (EVO-5): نداءات/كاش/مزودون/نوايا/حصص/تقييم أسبوعي — قراءة service-role لجداول 0081 |
| `/api/admin/external-plans` | POST/GET/PATCH/DELETE | Admin (RLS: is_admin) | خطط AI لغير الأعضاء + إعادة توليد (خطة/وجبة/صنف/يوم/تمرين) + سجل نسخ (5) + استرجاع |
| `/api/admin/leads` | GET/PATCH/DELETE | Admin | قاعدة العملاء (leads من الأدوات + التسجيلات) |
| `/api/admin/refunds` | GET/POST | Admin | طلبات الاسترداد 7 أيام + قرار الإدارة (إنهاء الاشتراك + عكس العمولة) |
| `/api/admin/saved-results` | GET | Admin | كل النتائج المحفوظة لكل المستخدمين |
| `/api/admin/site-assignments` | GET/POST/PATCH/DELETE | Admin (service-role) | إسنادات متابعة B2C عضو↔مدرب موقع (site_coach_assignments — Phase 103) |
| `/api/admin/staff` | POST/PATCH | Admin | إدارة حسابات الموظفين |
| `/api/admin/wallets` | GET | Admin | محافظ المدربين (أرصدة + حركات) |
| `/api/admin/wallets/adjust` | POST | Admin | تعديل يدوي لمحفظة مدرب (مُدقَّق) |
| `/api/admin/wallets/topups` | PATCH | Admin | مراجعة طلبات الشحن (إيصال → اعتماد/رفض) |
| `/api/affiliate/commission` | POST | Admin | تسجيل/تسوية عمولة أفيليت (20%) |
| `/api/affiliate/payout-notify` | POST | User | إشعار الأدمن بطلب سحب أفيليت |
| `/api/affiliate/referred-coaches` | GET | User | المدربون المسجلون عبر رابط الإحالة |
| `/api/ai/chat` | POST | User (اختياري للمجهول) | محادثة EVO — توليد الخطة يخصم من الرصيد الموحد (429 يميز أسبوعي/شهري) · النجاح يُبث SSE (delta/final) والأخطاء JSON |
| `/api/ai/feedback` | POST | User (اختياري للمجهول — EVO-1) | إشارة 👍/👎 على ردود EVO إلى `evo_feedback` (append-only، حد 20/دقيقة/IP) — الكتابة service-role بعد تحقق نقي |
| `/api/ai/jobs` | POST/GET | User/Coach + JOB_GATE | طابور مهام AI (توليد/استبدال/إعادة توليد) — فحص ملكية + رصيد العميل، مهام الموظفين محجوبة عن العملاء |
| `/api/ai/meal-plan-demo` | POST | مجاني للجميع (بواب البوول الموحد) | مولد خطة الوجبات التجريبي — الزائر والعضو يحرقان من البوول الموحد (هوية الزائر مزدوجة الأبعاد: متصفح + IP) · حفظ تلقائي للأعضاء |
| `/api/ai/planner-plan` | GET | User (الأعضاء فقط — الزائر 401) | ترطيب خطة المولد الأخيرة بنوعها (المصدر العابر للأجهزة) — خطة التمرين تُخزّن خامًا وتُثرى وقت القراءة من مكتبة التمارين |
| `/api/ai/queue-health` | GET/DELETE | Admin | صحة الطابور + مسح سجلات المهام الفاشلة حصرًا (عقد clearableFailedJobs: الزر يظهر فقط عند >0 — تنبيهات الحالة الحية لا تُمس بل تزول بزوال سببها) |
| `/api/ai/quota` | GET | User session | عدادات الرصيد الموحد (أسبوعي + شهري + التبديلات) |
| `/api/ai/workout-plan-demo` | POST | مجاني للجميع (بواب البوول الموحد) | مولد خطة التمرين التجريبي — نفس بواب البوول الموحد والحفظ التلقائي للأعضاء |
| `/api/blog/fetch-images` | POST | Admin | جلب صور مقترحة للمقال |
| `/api/blog/suggest-image` | POST | Admin | اقتراح وصف صورة للمقال بـ AI |
| `/api/build-info` | GET | Public | معلومات البناء (commit الحالي) |
| `/api/coach/ads` | GET/POST | Coach | إعلانات المدرب على صفحته |
| `/api/coach/ai-usage` | GET | User (coach/admin) | استهلاك رصيد عميل (النافذتان الأسبوعية والشهرية) |
| `/api/coach/claim` | POST | User | مطالبة مدرب بعميل عبر كود |
| `/api/coach/clients/invite` | POST | Coach | دعوة عميل جديد للمدرب — rate-limit 5/دقيقة/IP + 3/ساعة/إيميل (W1-2b) + سقف 30 دعوة معلقة/مدرب |
| `/api/coach/landing` | GET/PUT | Coach | صفحة المدرب العامة (slug + محتوى) |
| `/api/coach/register` | POST | Public (hardened) | تسجيل مدرب — rate-limit 3/10min + honeypot + role server-side |
| `/api/coach/subscriptions/activate` | POST | User (staff) | تفعيل اشتراك عميل — خصم المحفظة أولاً (402 نقص) + ledger |
| `/api/coach/support` | GET/POST | Coach | تذاكر دعم المدرب من جهته |
| `/api/coach/wallet` | GET | User (coach) | محفظة المدرب + الحركات |
| `/api/coach/wallet/topup` | POST | User (staff) | طلب شحن محفظة (إيصال إلزامي) |
| `/api/coaches/featured` | GET | Public | المدربون المميزون (صفحات عامة) |
| `/api/cron/blog/p0-research` | GET | Cron (CRON_SECRET) | بحث الموضوع (مرحلة 0) |
| `/api/cron/blog/p1-outline` | GET | Cron (CRON_SECRET) | مخطط المقال (مرحلة 1) |
| `/api/cron/blog/p2-content` | GET | Cron (CRON_SECRET) | كتابة المحتوى AR+EN (مرحلة 2) |
| `/api/cron/blog/p3-images` | GET | Cron (CRON_SECRET) | الصور (مرحلة 3) |
| `/api/cron/blog/p4-review` | GET | Cron (CRON_SECRET) | المراجعة (مرحلة 4) |
| `/api/cron/blog/p5-publish` | GET | Cron (CRON_SECRET) | النشر (مرحلة 5) |
| `/api/cron/dispatch-pipelines` | GET | Cron (CRON_SECRET) | الموزع اليومي 23:40 UTC (مدونة + مهام AI — فترة سماح 90 دقيقة وحصر 1+1 يفرضها P5) |
| `/api/cron/progress-reminder` | GET | Cron (CRON_SECRET) | تذكير التقدم الأسبوعي (الأحد 07:00 UTC) |
| `/api/csp-report` | POST | Public (Report-Only sink) | مستقبل مخالفات CSP — قراءة/تسجيل فقط وصفر كتابة (204 دائمًا)؛ مصدر قرار تفعيل السياسة الكاملة لاحقًا |
| `/api/evo/followup/dispatch` | POST | Admin أو cron (x-cron-secret — EVO_CRON_SECRET) | مرسل رسالة التحقق الأسبوعية من EVO (opt-in إجباري D4 · إيقاع ≥7 أيام · 404 ما لم يكن EVO_FOLLOWUP_ENABLED=true حرفيًا) |
| `/api/exercise-mini` | GET | Public (بيانات ثابتة — كاش 24س) | مكتبة التمارين كسجلات MINI (~30KB مضغوط) لعرض الخطط — البديل عن إدخال مصفوفة 1.6MB للمتصفح (قانون الحزمة) |
| `/api/file` | GET | User | قراءة ملف من التخزين للمستخدم المصرّح |
| `/api/food-search` | GET | Public | بحث الأكلات (محلي + Open Food Facts) |
| `/api/my/coach-whatsapp` | GET | User | رقم واتساب مدرب العميل |
| `/api/notifications/admin` | POST | User | إنشاء إشعار أدمن (service_role) |
| `/api/notifications/broadcast` | POST | Coach/Admin | بث إشعارات لمجموعة مستخدمين |
| `/api/og-image/[slug]` | GET | Public (edge) | صورة OG ديناميكية للمقالات (route.tsx) |
| `/api/paypal/capture-order` | POST | User | تأكيد دفع PayPal (مصدر الحقيقة للسعر والتفعيل) |
| `/api/paypal/create-order` | POST | User | إنشاء طلب PayPal (السعر يُحسم خادمياً) |
| `/api/paypal/webhook` | POST | PayPal (توقيع) | أحداث PayPal (سجل تدقيق) |
| `/api/plans/member-edit` | POST | User | تعديل العضو لخطته (تتبع التعديلات اليدوية — غير محدودة) |
| `/api/plans/normalize` | POST | Coach/Admin | تطبيع نص خطة يدوية إلى بنية مهيكلة |
| `/api/refund/request` | GET/POST | User | طلب استرداد العضو + فحص الأهلية (7 أيام + عدم استخدام المميزات من الدفاتر المحمية) |
| `/api/send-email` | POST | Server (service-role) | إرسال بريد عبر Brevo REST API (HTTPS) + تحقق صارم + حد 100/24h |
| `/api/subscription/cancel` | POST | User | إلغاء اشتراك (يمنح أهلية استرداد + عكس عمولات معلّقة) |
| `/api/support/tickets` | GET/POST | User | تذاكر الدعم بين العميل والمدرب |
| `/api/tools/lead` | POST | Public (rate-limited) | التقاط عميل محتمل من كل الأدوات (مصدر العدد: tools-shared.ts) |
| `/api/tools/save-meal-plan` | POST | User | حفظ خطة وجبات |
| `/api/tools/save-result` | POST | User | حفظ نتيجة أداة |
| `/api/tools/saved-meal-plans` | GET/DELETE | User | إدارة خطط الوجبات المحفوظة |
| `/api/tools/saved-results` | GET/DELETE | User | إدارة النتائج المحفوظة |
| `/api/upload` | POST | User | رفع ملف للتخزين (حدود + تعقيم) |

**Total:** عمدًا غير مكتوب — الكود هو الحقيقة (`find src/app/api -name "route.ts*" | wc -l`)، والبوابة `scripts/docs_audit.py` تمنع كتابة أي إجمالي هنا (AGENTS.md §3.8 — Phase 107).

---

## 9. الاعتماديات (Dependencies)

> **قانون المصدر الواحد (AGENTS.md §3.8):** حُذف جدولا الاعتماديات من هذا
> الدليل (كانا قد انجرفا عن الحقيقة — إصلاح م-03/ت-4). البيت الوحيد
> للاعتماديات وإصداراتها: **[`package.json`](package.json)** و`bun.lock`
> (التثبيت المقفل — نفس الشجرة التي تبني منها CI وVercel). ملاحظات قراءة:
> primitives ‏Radix UI تُستورد كحزم مستقلة تحت `@radix-ui/*` (عددها الحي
> بpackage.json)، وجرد طبقة shadcn/ui الكامل بأسمائه في
> `docs/TECH_REFERENCE.md` §3، والتثبيت في CI/التشغيل دائمًا
> `bun install --frozen-lockfile`.


---

## 10. الـ Deploy على Vercel

### الخطوات

1. ادفع الكود إلى GitHub
2. اذهب إلى [vercel.com](https://vercel.com) → New Project → اختر الريبو
3. أضف متغيرات البيئة (Settings → Environment Variables)
4. اضغط Deploy

### إعدادات Vercel (مدمجة في `vercel.json`)

```json
{
  "framework": "nextjs",
  "regions": ["fra1"],
  "installCommand": "bun install",
  "buildCommand": "next build",
  "headers": [
    { "source": "/(.*)", "headers": [/* security headers */] },
    { "source": "/images/(.*)", "headers": [/* 1yr cache */] },
    { "source": "/_next/static/(.*)", "headers": [/* 1yr cache */] }
  ]
}
```

### GitHub Actions (التدفق الآلي للمدونة — pipeline v3 فصل اللغات)

منذ 2026-08-27 يوجد ورك فلو مستقل لكل لغة، مقال واحد في كل تشغيل:
- `.github/workflows/blog-post-ar.yml` — مقال عربي واحد يوميًا (05:00 UTC = 08:00 بتوقيت القاهرة صيفًا — نافذة الصباح؛ تصبح 07:00 شتاءً)
- `.github/workflows/blog-post-en.yml` — مقال إنجليزي واحد يوميًا (22:00 UTC = 18:00 بتوقيت شرق أمريكا — ذروة ما بعد العمل؛ تصبح 17:00 شتاءً)
- المرحلة 119 (أمر المالك 2026-09-04): مقال واحد لكل لغة يوميًا في مواعيد مختلفة حسب التوقيت الجغرافي لجمهور كل لغة — كانت 3+3 يوميًا قبلها
- الخطوات P0…P5 تُنفَّذ أصليًا داخل الأكشن عبر `scripts/blog-runner/run-step.mts`
- متطلبات Secrets: `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY` + واحد من `OPENROUTER_API` أو `OPENROUTER_API_KEY` (يمكن الاثنين — تدوير مزدوج)
- اللغة تُمرَّر عبر `PIPELINE_LANG` (ar/en) — خطوة P0 ترفض العمل بدونها

---

## 11. الاختبار + الصيانة

### الحالة الحالية (Phase 7 correction — 2026-08-19, re-verified 2026-08-25)

| النوع | الحالة |
|---|---|
| Unit tests (vitest) | ✅ تعمل — `npx vitest run` (عدد الملفات/الحالات الحية ببيتها الوحيد STATE.md «ملخص جودة المرحلة» — ممنوع تثبيتها هنا بقانون الأرقام §3.8) |
| Integration tests | ❌ غير موجود |
| E2E tests | ❌ غير موجود |
| Type checking | ✅ مُفعّل (0 errors — `tsc --noEmit` clean, `@ts-nocheck` removed, `ignoreBuildErrors` NOT in `next.config.ts`) |
| ESLint | ✅ مُفعّل عبر `bun run lint` (Next.js 16 dropped eslint config from `next.config.ts`; runs via `eslint.config.mjs` flat config) |
| Smoke tests (manual) | ⚠️ Phase 1 + Phase 5 — 95 + 30 نقطة تم فحصها يدوياً عبر curl + agent-browser. هذه **smoke tests** وليست functional verification |
| Build (local) | ✅ يعمل — `bun run build` exits 0 (B18 fixed in Phase 7 Master Repair Batch 001; the obsolete `node scripts/compress-images.js &&` prefix was removed from the build script) |
| Build (Vercel production) | ✅ يعمل (يستخدم `vercel.json` buildCommand `next build`) |

### أوامر مفيدة للصيانة

```bash
# فحص TypeScript (دون إيقاف الـ build)
npx tsc --noEmit

# تشغيل ESLint
bun run lint

# Build للإنتاج (محلياً)
bun run build
```

---

## 12. الاصطلاحات البرمجية (Conventions)

### تسمية الملفات

- **Pages:** `page.tsx` (Next.js App Router convention)
- **Views:** `PascalCase.tsx` (مثل `CoachView.tsx`, `LandingView.tsx`)
- **Components:** `PascalCase.tsx` (مثل `SiteHeader.tsx`, `SaveResultButton.tsx`)
- **Hooks:** `use-kebab-case.tsx` (مثل `use-auth.tsx`, `use-membership-tier.ts`)
- **Libs:** `kebab-case.ts` (مثل `ai-provider.ts`, `blog-pipeline.ts`)

### الـ Colors (نظام الهوية)

> **حُذف قسم الألوان الثابتة من هذا الدليل** (كان لنظام Apple الأزرق ما قبل
> إعادة التصميم البصري — إصلاح م-03/ت-6، وكان يحمل إحالة ميتة إلى
> DESIGN.md §2.2). النظام الحالي **«Marble & Chrome»** برموز CSS متغيرة في
> `src/app/globals.css`، وبيته الحاكم: **[`DESIGN.md`](DESIGN.md)** — السلم
> اللوني الكامل (عاجي دافئ/غرافيتي/كروم دافئ)، الوضعان الداكن والفاتح
> مواطنان متساويان، والاستثناء اللوني الوحيد `--ai` سيان لأسطح مساعد
> الذكاء الاصطناعي. أي قيمة لونية في كود جديد تُشتق من رموز `globals.css`
> لا من قيم ثابتة.

### الـ AI Layer (المسار الموحد)

> **المزودون خمسة + ذراعا بحث:** OpenRouter + Groq + NVIDIA NIM + Gemini (إدخال ذيل عادي بكلتا السلسلتين — **قانون gemini-first أُلغي بأمر المالك 2026-10-31**؛ التدوير الثلاثي يقود كل نداء) + **Cloudflare Workers AI (المزود الخامس — المرحلة ج 2026-10-31: أدوار الموجة الأولى الرشيقة حصرًا — وسم blog:pairing يقوده 70b-fp8-fast ووسم blog:latin-tokens-ar يقوده scout؛ لا يدخل السلاسل الثقيلة ولا سلسلة البث أبدًا؛ عدّاد عصبونات مركزي بتحذير 80% وحاجز 95% من 10K/يوم؛ مقبض CF_ARM_ENABLED=0 للتعطيل بلا نشر)** + **ذراعا البحث Tavily وExa** بالسلم المُسنَد المقسوم باللغة (بحث/استخراج فقط — لا توليد أبدًا؛ **لا أولوية إجبارية لأي مزود — كل موضع قرار مقيس**) — القانون الكامل
> (المساران القانونيان، سلم البحث المُسنَد النهائي إ: exa→tavily→groq→gemini خامدة · ع: tavily→groq→exa بالاستعلام الإنجليزي المكافئ، ميزانية الـ52 ثانية) بيتُه
> **`AGENTS.md` §8**، والتنفيذ وخريطة الموديلات الحية بيتُها
> **`src/lib/ai-provider.ts`**. خلاصة الدوال:

| الدالة | متى تستخدمها | السلوك |
|---|---|---|
| `callAI(prompt, options)` | المدخل العام الموحد | موجّه لمزود واحد بالإعدادات — أخطاء صادقة (لا تبديل صامت بين المزودين) |
| `callAIWithFallback(prompt, options)` | **Plans, Articles, Research** — جودة عالية | Sequential — أقوى نموذج أولاً ثم التالي عند الفشل |
| `callFreeAIFallbackChain(prompt, options)` | **EVO chat وكل المسارات المجانية** | سلسلة متشابكة خماسية المزودين (تدوير ثلاثي openrouter↔groq↔nvidia للرائد + Gemini ذيلًا — قانون gemini-first أُلغي 2026-10-31؛ + مدخل دور CF الرشيق في رأس المشية لوسمي blog:pairing وblog:latin-tokens-ar فقط — فشله يسقط للسلسلة العادية بلا حرق محاولات) بميزانية مقيدة ≤52s — بلا مفتاح Gemini يُتخطى الإدخال بلا استهلاك محاولات |
| `callGroundedSearch(prompt, options)` | **البحث المُسنَد (P0 بحث المدونة)** | سلم §6-أ النهائي المقسوم باللغة — إ: Exa (بحث دلالي حقيقي برصيده المجاني + استخراج /contents اختياري + توليف JSON على السلسلة العادية ببوابة أدلة URL حية) → Tavily → Groq browser_search → Gemini خامدة · ع: Tavily → Groq → Exa (بالاستعلام الإنجليزي المكافئ) → Gemini خامدة (`GEMINI_GROUNDED_ENABLED=0` و`GROUNDED_ARM_ORDER` مقبضا تشغيل بلا نشر؛ التعميق الفاشل = حزمة snippets بختم researchDepth — لا يفشل المقال أبدًا) — ذراع OR web خارج السلم |
| `callFreeOpenRouterRace(prompt, options, raceCount)` | **التبديلات (Swap) فقط** — سرعة | سباق توازي — أول رد ناجح يفوز |
| local fallback (`src/lib/ai-local.ts`) | فشل كل المزودات | مولّد محلي حتمي لتدهور رشيق |

```typescript
// للجودة (plans, articles):
import { callAIWithFallback } from "@/lib/ai-provider";
const { text, model } = await callAIWithFallback(prompt, {
  temperature: 0.7,
  maxTokens: 4000,
  jsonMode: true,
  timeoutMs: 52_000,  // clamp ≤52s
});

// للمحادثة (EVO chat — سلسلة متشابكة، ليس سباقًا):
import { callFreeAIFallbackChain } from "@/lib/ai-provider";
const { text, model } = await callFreeAIFallbackChain(prompt, {
  maxModels: 3,        // budget: maxModels × timeoutMs ≤ 52s (داخلي)
});
```

### الـ Auth Pattern

```typescript
// Server-side (API routes):
const auth = await requireUser(request);  // أو requireCoach
if (auth instanceof Response) return auth; // 401/403

// Client-side (components):
const { profile } = useAuth();
const { tier } = useMembershipTier(profile);
```

### الـ Navigation Pattern

```typescript
const { navigate } = useNav();
navigate("memberships");                    // → /memberships
navigate("checkout", { tier: "premium", months: 12 }); // → /checkout?tier=premium&months=12
navigate("coach-client", { clientId: "xxx" }); // → /coach/xxx
```

---

## 13. Phase 5: إصلاحات قاعدة البيانات (2026-08-19)

### جداول تم إنشاؤها/إصلاحها على Supabase الإنتاجي

| الجدول | الحالة قبل | الإصلاح |
|---|---|---|
| `meal_plans` | ❌ غير موجود (migration 0008 لم يُطبّق) | `CREATE TABLE meal_plans` + RLS policies |
| `support_tickets.priority` | ❌ العمود غير موجود | `ADD COLUMN priority text` + CHECK constraint |
| `support_tickets.status` | ❌ العمود غير موجود | `ADD COLUMN status text` + CHECK constraint |
| `subscription_requests.price_usd` | ❌ معرّف كـ INTEGER (يرفض 14.99) | `ALTER COLUMN price_usd TYPE numeric(10,2)` |
| `plan_swaps` | ❌ غير موجود في أي migration | `CREATE TABLE plan_swaps` + RLS policies |
| `progress_photos` | ❌ غير موجود في أي migration | `CREATE TABLE progress_photos` + RLS policies |
| `coach_presence` | ❌ غير موجود في أي migration | `CREATE TABLE coach_presence` + RLS policies |

### ملفات SQL للصيانة

ملفات SQL التى أُنشِئَت لإصلاحات Phase 5 تم توقيعها كـ migration files
تحت `supabase/migrations/` أو تم تطبيقها مباشرة على Supabase SQL Editor.
انظر `archive/PROGRESS_ARCHIVE.md` (المرحلة 5) للتفاصيل.

### تحديث Supabase Schema Cache

بعد أي تعديل على schema، يجب تشغيل:

```sql
NOTIFY pgrst, 'reload schema';
```

في Supabase SQL Editor لتحديث PostgREST schema cache.

---

## 14. ميزانية AI الزمنية + GHA Orchestration (محدّث 2026-08-27)

> **Revised:** هذا القسم حلّ محل جدول Phase 6 القديم بعد توجيه المالك
> 2026-08-27 (قصر المزودين + علاج حد Vercel 60s عبر GitHub Actions).

### 1. قاعدة الميزانية الزمنية (Vercel Hobby = 60s)

`callFreeAIFallbackChain()` في `src/lib/ai-provider.ts` يفرض داخلياً:

```
effTimeoutMs = min(callerTimeoutMs, floor(52_000 / maxModels))
maxModels افتراضي = 2 (يمكن تمريره عبر options.maxModels)
```

أي أنه مستحيل نظرياً أن يتجاوز مسار AI واحد الـ 55 ثانية داخل الدالة —
كل الـ `maxDuration=300/180` القديمة تم clamping إلى 60.

| المسار | maxModels | timeoutMs | Worst case |
|---|---|---|---|
| EVO chat | 3 | 16s | ~48s |
| Article EN (blog p2-content) | 2 | 26s | ~52s |
| Article AR (blog p2-content) | 2 | 26s | ~52s |
| Topic pick | 2 | 22s | ~44s |
| Research (LLM-based) | 2 | 26s | ~52s |
| Plan nutrition/workout | 2 | 26s | ~52s |
| regenerate-meal | 2 | 24s | ~48s |
| normalize coach plan | 2 | 26s | ~52s |
| Swap (race) | 3 متوازي | 30s | ~30s |

### 2. دور GitHub Actions كطبقة إعادة المحاولة

خطوات البايبلاين تُنفَّذ **أصليًا داخل الأكشن** (in-process، بدون Vercel
hop — منذ pipeline v2/v3)، لكن إعادة المحاولة ما زالت على مستوى الـorchestration
في `.github/workflows/blog-post-en.yml` + `blog-post-ar.yml`:

- كل خطوة من خطوات البايبلاين (P0…P5) لها retry loop حتى 3 محاولات مع
  backoff 120/240 ثانية بينها (عبر scripts/blog-runner/run-step.sh).
- المسارات تقبل معالجة الصفوف status="failed" → إعادة المحاولة فعالة
  فعلاً لا مجرد تشغيل متكرر.
- عند فشل نموذج داخل محاولة واحدة، تتولى المحاولة التالية (أو النموذج
  التالي في السلسلة المتبادلة Groq/OpenRouter) بنافذة زمنية جديدة.
- **حلقة الإصلاح داخل التشغيل (R1، 2026-09-29 — تدقيق مسار التنفيذ §8.2):**
  الفشل الحتمي عند P5 (أرضية الطول/البطارية/اللاتيني على bundle ثابت) لا
  يُعاد بمحاولة عمياء — المسار يرجع `rerunTarget` آلة-قابل-للقراءة في جسم
  500 (خريطة حتمية `src/lib/blog-repair-target.ts`)، وrun-step.mts يترجمه
  exit code 3 + سطر `RERUN_TARGET=<step>`، وrun-step.sh ينفّذه على نفس صف
  الطابور: يعيد الخطوة المستهدفة وكل ما بينها وبين P5 (≤ دورتين —
  MAX_REPAIRS)، وإصلاح p2-content يتم عبر `?force=1` (توليد فوق المسودة
  مع بقاء research/outline/images). الأدلة: اختبارات blog-repair-target
  وblog-repair-contract + مصفوفة تكامل run-step-loop-test.sh.
- **رصد حلقة الإصلاح (R5، 2026-09-30 — نفس التدقيق §10 المرحلة R5):**
  حلقة الإصلاح صارت **قابلة للقياس**: كل توجيه إصلاح يختم عدّادًا تراكميًا
  `repairLoop` في bundle صف الطابور (`stampQueueRowRepairDirective`
  بsrc/lib/blog-queue.ts — ينجو عبر سلسلة الإصلاح لأن p2-force/p4
  ينشران الـbundle؛ سابقة researchSource/coachRequested)، وكل دورة تصدّر
  `REPAIRS_USED` إلى GITHUB_ENV يطبعها سطر ملخص التشغيل بblog-post-{en,ar}.yml،
  و`GET /api/ai/queue-health` يحمل عدّاد `repair` بنافذة 14 يومًا
  (published · afterRepair · exhausted · sharePct · recoveryPct) يقيس
  «repair-first vs regenerate» من قاعدة البيانات لا من التخمين. رصد خالص —
  صفر تغيير في أي بوابة أو حالة أو ميزانية إصلاح. الأدلة:
  blog-repair-r5-observability.test.ts + وصف R5 بblog-repair-contract.test.ts
  + سيناريوهي sc8/sc9 بمصفوفة run-step-loop-test.sh.
- **الإصلاح اللاتيني الموضعي (R2، 2026-09-29 — نفس التدقيق §9 بند 4):**
  إصلاح اللاتيني السائب في المقالات العربية لم يعد يعيد توليد المقال
  كاملًا بنداء ~9.5k tokens (كان يقصي Groq ويعيد نصًا إنجليزيًا — 5 من 7
  فشل AR): تمريرة قاموس حتمية أولًا (جدول الـprompt نفسه + مقيسات نافذة
  التدقيق في `LATIN_REPAIR_DICTIONARY` بsrc/lib/blog-pipeline.ts — تصلح
  الفئة الشائعة بصفر نداءات AI)، وما تبقى يذهب لنداء تحويل صغير يحمل
  قائمة الـtokens وحدها (<1k ⇒ يدخل Groq مجددًا) يعيد JSON {token→عربي}
  يُطبَّق حتميًا عبر نفس محرك الفحص، والبوابات
  (`validateMsaConversion`/`scanLatinContamination`) بالبايت كما هي. الإرجاع:
  `LATIN_REPAIR_LEGACY=1` يعيد المسار القديم حرفيًا. الأدلة:
  blog-latin-repair-r2.test.ts (حالات الفشل الخمس الحية + الكناريات).
- **توسيع السلسلة الفعّالة (R3، 2026-09-29 — نفس التدقيق §10 المرحلة R3):**
  حارس Groq 8k TPM صار **لكل مدخل** بدل إسقاط كل مداخل Groq دفعة واحدة:
  عند تجاوز الحجم المقدّر للنافذة يُقص max_tokens لمدخل Groq إلى النافذة
  المتبقية (7200 − prompt − 800) ويبقى بالسلسلة ما دام القصّ ≥ 3800 توكن
  إخراج (محتوى P2 ‏~8.7k يعيد Groq بـ~4.9k — أفضل ناجٍ حي 85.3% — بعدما
  كان مقصيًا من أثقل النداءات)، وتحت الحد يُسقط كالسابق (مراجعة P4
  ‏~10.4k تبقى OpenRouter/NVIDIA فقط **بالتصميم**)؛ مع رفع ميزانية
  السلسلة في blog-post-{en,ar}.yml من 360s إلى 480s (سابقة
  process-ai-jobs) وmaxModels P2 من 2 إلى 3 (مهلة النموذج 150s كما هي
  — 480/3=160s). الإرجاع: `GROQ_MAX_TOKENS_CLAMP=0` يعيد سلوك الإسقاط
  الكامل القديم حرفيًا + قيمة الميزانية بالـ workflow. الأدلة:
  ai-provider-r3-groq-clamp.test.ts (فئتا P2/P4 المقيستان حيًا + حد 3800
  بالضبط + علم الإرجاع + إعفاء fast chain + الحمولة الصغيرة بلا تغيير).

### 3. الأسعار والتكلفة

كل الموديلات المستخدمة ضمن FREE tiers من OpenRouter + Groq + NVIDIA NIM؛ الميزانية
الزمنية فوق هي أيضاً سقف لاستهلاك rate limits.

---

> **Deprecated (2026-08-27؛ والحذف الفعلي 2026-10-31 بفريم نظافة المرحلة و):**
> تفاصيل Phase 6 القديمة (callFreeOpenRouterRace للمحادثة، timeouts 45/35s،
> Gemini SDK للتوليد) أصبحت تاريخية — والدالة نفسها حُذفت من الكود نهائيًا
> (صفر مستهلكين منذ تقاعد مسار التبديل القديم) — الكود الفعلي هو المرجع
> (§12.8). انظر أرشيف Git لإصدار ما قبل التوجيه إذا لزم.

---

سياسة الأرشفة: worklog.md الحي هو النافذة النشطة نفسها — سقف صلب **≤ 12 مدخلًا و ≤ 128KB** (فحص H5 ب`scripts/docs_audit.py`، المرحلة 288) وكل ما دون النافذة يدور حرفيًا إلى `archive/WORKLOG_ARCHIVE.md` بنفس الكوميت عبر `python3 scripts/worklog_rotate.py` (بالقياس لا بالتقويم)؛ ولقطات docs/ التاريخية المتقاعدة تنزل إلى `docs/archive/`.
