-- ============================================================================
-- 0110 — AI-QUOTA SUCCESS IDEMPOTENCY (أمر المالك 2026-11-14 «إعادة هيكلة
-- سياسة الذكاء الاصطناعي والاشتراكات والأرصدة» + التوضيح المُصحِّح: النظام
-- يظل حصصًا شهرية مطوَّرة — لا أرصدة ولا محافظ. الوثيقة الحاكمة
-- docs/AI-QUOTAS-POLICY-2026-11-14.md)
-- ============================================================================
-- الغرض الوحيد: «ضمان الخصم مرة واحدة فقط لكل عملية ناجحة» بنيويًا.
-- حصة العميل تُخصم بإدراج صف نجاح واحد في ليجر الحصة:
--   * ai_plan_usage  (0085/0086) — صف لكل توليد خطة ناجح (الحصة الموحدة)
--   * plan_swaps     (63/0065)  — صف لكل تبديل ناجح (حصص التبديل لكل نوع)
-- التسجيل يحدث بعد finishJob مباشرة (قانون 2026-10-24 — نجاح-فقط)؛ الثغرة
-- المتبقية الوحيدة: إعادة تشغيل الـ runner بعد done (crash window) تضيف صفًا
-- ثانيًا لنفس المهمة = خصم الحصة مرتين.
--
-- الإصلاح: عمود job_ref uuid فريد جزئيًا على الجدولين — صف واحد حصرًا لكل
-- مهمة (ai_jobs.id). إعادة الإدراج تموت على قيد الفريدة (23505) والمسجل
-- fail-soft يتخطاها: لا خصم مزدوج أبدًا. الأعمدة NULL-able: كل الأسطح
-- المتزامنة (صفحات المخطط، نوايا EVO) تسجل بلا job_ref كما كانت.
--
-- تحويل التبديلات إلى حصص شهرية (التوضيح المُصحِّح): عدّ التبديلات ينتقل من
-- النافذة الأسبوعية إلى نافذة دورة الاشتراك الشهرية — تغيير كود صرف
-- (tier-limits.ts) بلا أي تغيير مخطط هنا؛ هذا الملف يضيف فقط ضمان
-- المرة-الواحدة.
--
-- لا جداول جديدة · لا دوال · لا RLS جديدة · لا بيانات تُمسّ.
-- Idempotent: safe to re-run (ADD COLUMN IF NOT EXISTS + CREATE UNIQUE INDEX
-- IF NOT EXISTS). Applied by the repo-owned pipeline (deploy-aws.yml migrate
-- job). فحوصه بmigration_probes.py بنفس الكوميت.
-- ============================================================================

-- 1) ai_plan_usage.job_ref — one success row per queued plan job.
alter table public.ai_plan_usage
  add column if not exists job_ref uuid;

create unique index if not exists ai_plan_usage_job_ref_uidx
  on public.ai_plan_usage (job_ref)
  where job_ref is not null;

-- 2) plan_swaps.job_ref — one swap row per queued swap/regeneration job.
alter table public.plan_swaps
  add column if not exists job_ref uuid;

create unique index if not exists plan_swaps_job_ref_uidx
  on public.plan_swaps (job_ref)
  where job_ref is not null;
