-- =====================================================================
-- RUN_ON_SUPABASE_QA_TEST_ACCOUNTS_WIPE_2026-10-29.sql
-- =====================================================================
-- الهدف (أمر المالك 2026-10-29 «إغلاق مهمة اختبار الحسابات» —
-- QA-TEST-ACCOUNTS-CLOSE):
--   مسح حسابات الاختبار الـ18 المعلّمة بالكامل من الإنتاج مع بياناتها
--   التابعة، بعد إغلاق جولات 371-377 (قناة حسابات الاختبار —
--   docs/QA-TEST-ACCOUNTS-2026-10-26.md) — دون المساس بأي حساب حقيقي
--   أو مدفوعات أو بيانات عملاء.
--
--   النطاق محصور بشرطي القناة معًا (لا بقائمة بريدية يدوية):
--     is_test_account = true  AND  email LIKE '%@alkemos-test.com'
--                          OR  email LIKE '%@musclehub-test.com' (القديم)
--   == 18 حسابًا بالضبط (مقيسة 2026-10-29: 17 تحت النطاق الحالي +
--   qa.admin1431 القديم المعلم — نفس ما تعرضه `test_accounts.py show`).
--
--   حسابان تحت النطاق المحجوز بلا العلم (qa.signup.1029 ·
--   qa.invited.1029 — أُنشئا بجولة 377 عبر التسجيل العام/الدعوة) خارج
--   هذا المسح عمدًا: لا يحققان تعريف القناة، والملك لم يأمر بمسهما —
--   استعلام التحقق الأخير يعرضهما بشفافية للمالك.
--
-- ليه سكريبت يدوي مش تهجيرة تلقائية؟
--   قانون 0095/0066 حرفيًا: العملية تلمس auth.users (لا يقربها خط
--   الترحيل أبدًا) — SQL Editor بيتنفذ بدور postgres.
--
-- خريطة المسح (نمط 0095 v2 نفسها بعد تدقيق كل الجداول بعدها):
--   الخطوة 0: كل صف يحقق شرطي القناة — مش موجود → إقفال آمن.
--   الخطوة 1: صفوف الجداول بلا FK حي يوصلها الكاسكيد:
--              chat_messages.client_id · saved_results.user_id ·
--              meal_plans.user_id · plan_swaps.user_id ·
--              coach_presence.coach_id · progress_photos.user_id ·
--              subscription_requests.user_id
--            + حذف وقائي: evo_chat_usage.user_id ·
--              ticket_messages.sender_id · evo_call_stats.user_id
--            + tool_leads بالإيميل (بلا FK)
--            + coach_wallet_transactions.created_by → NULL (حماية
--              حركات المحافظ — لو أُنشئت بحساب اختبار تُحفظ محايدة)
--   الخطوة 2: حذف profiles — يشغّل الكاسكيد الحي المثبت:
--              subscriptions · notifications · admin_notifications ·
--              coach_ads/fees/payments/wallets/topup_requests ·
--              support_messages/pages · coach_assignments +
--              site_coach_assignments · referrals/earnings/payouts ·
--              affiliate_transactions/commissions · refund_requests ·
--              external_plans · questionnaires/progress_entries/plans ·
--              evo_memory + evo_memory_state · evo_followup_prefs
--   الخطوة 3: حذف auth.users — كاسكيد داخلية (identities · sessions ·
--              refresh tokens) + storage.objects + ai_plan_usage
--              (0085 CASCADE) · ai_jobs.requested_by → NULL ·
--              evo_feedback.client_id → NULL · site_content.updated_by
--              → NULL
--
-- الأمان:
--   * المسح محصور بشرطي القناة (النطاق + العلم) — مستحيل يمس حسابًا
--     حقيقيًا (كل الحسابات الحقيقية خارج النطاقين وبلا العلم).
--   * كل حساب في معاملة ذرّية واحدة (DO block = transaction واحد —
--     أي فشل يرجع كل شيء، صفر مسح جزئي).
--   * audit_log.changed_by يظل NULL (سجل تاريخي محايد — مقصود).
--   * صفر تغيير في المخطط → types.ts لا يحتاج إعادة توليد.
--   * Idempotent: التشغيل أكثر من مرة آمن تمامًا.
--
-- ملاحظة تنفيذ 2026-10-29: قبل هذا الملف نُفّذ المسح المكافئ له حرفيًا
--   (نفس التسلسل ونفس النطاق) عبر Supabase Admin API + PostgREST بأمر
--   المالك الصريح — التفاصيل والتحقق البعدي بتقرير الإغلاق
--   docs/QA-ACCOUNTS-CLOSE-2026-10-29.md. الملف يبقى القناة الموثقة
--   لإعادة التنفيذ عند الحاجة (نمط 0095) ولتنظيف الحسابين غير
--   المعلّمين لو قرر المالك ذلك لاحقًا.
--
-- RUN: Supabase Dashboard → SQL Editor → paste → Run
-- التحقق: استعلام التحقق الأخير يعرض wiped=0 المتبقي المعلّم
-- =====================================================================

-- ---------- الخطوة 0: جرد ما سيُمسح (للمعاينة قبل Run) ----------
select p.email, p.role, p.created_at::date as created
  from public.profiles p
 where p.is_test_account = true
   and (p.email like '%@alkemos-test.com'
        or p.email like '%@musclehub-test.com')
 order by p.created_at;
-- المتوقع: 18 صفًا (17 بالنطاق الحالي + qa.admin1431 القديم)

do $$
declare
  r record;
begin
  for r in select p.id, p.email from public.profiles p
            where p.is_test_account = true
              and (p.email like '%@alkemos-test.com'
                   or p.email like '%@musclehub-test.com')
  loop
    raise notice 'جاري مسح حساب الاختبار «%»: %', r.email, r.id;

    -- ---------- الخطوة 1: الجداول بلا FK حي (بقايا مضمونة لو اتسابت) ----------
    if to_regclass('public.chat_messages') is not null then
      delete from public.chat_messages         where client_id = r.id;
    end if;

    if to_regclass('public.saved_results') is not null then
      delete from public.saved_results         where user_id   = r.id;
    end if;

    if to_regclass('public.meal_plans') is not null then
      delete from public.meal_plans            where user_id   = r.id;
    end if;

    if to_regclass('public.plan_swaps') is not null then
      delete from public.plan_swaps            where user_id   = r.id;
    end if;

    -- (0066 v2): العمود الحي في الإنتاج هو coach_id — مش user_id
    if to_regclass('public.coach_presence') is not null then
      delete from public.coach_presence        where coach_id  = r.id;
    end if;

    if to_regclass('public.progress_photos') is not null then
      delete from public.progress_photos       where user_id   = r.id;
    end if;

    if to_regclass('public.subscription_requests') is not null then
      delete from public.subscription_requests where user_id   = r.id;
    end if;

    -- وقائي (لو الـ FK cascade فعلًا يبقى الأثر صفر):
    if to_regclass('public.evo_chat_usage') is not null then
      delete from public.evo_chat_usage        where user_id   = r.id;
    end if;

    if to_regclass('public.ticket_messages') is not null then
      delete from public.ticket_messages       where sender_id = r.id;
    end if;

    -- (0081) عمود إحصائيات بلا FK إطلاقًا — حذف وقائي
    if to_regclass('public.evo_call_stats') is not null then
      delete from public.evo_call_stats        where user_id   = r.id;
    end if;

    if to_regclass('public.tool_leads') is not null then
      delete from public.tool_leads            where email     = r.email;
    end if;

    -- عمود نسبة بلا حذف صف (حماية لحركات المحافظ):
    if to_regclass('public.coach_wallet_transactions') is not null then
      update public.coach_wallet_transactions
         set created_by = null
       where created_by = r.id;
    end if;

    -- ---------- الخطوة 2: البروفايل (يشغّل الكاسكيد الحي) ----------
    delete from public.profiles where id = r.id;

    -- ---------- الخطوة 3: مستخدم المصادقة (كاسكيد auth + التخزين) ----------
    delete from auth.users where id = r.id;

    raise notice 'تم مسح «%» بالكامل.', r.email;

  end loop;
end $$;

-- ---------- PostgREST schema reload ----------
notify pgrst, 'reload schema';

-- ---------- التحقق النهائي ----------
select
  (select count(*) from public.profiles
    where is_test_account = true
      and (email like '%@alkemos-test.com'
           or email like '%@musclehub-test.com'))         as flagged_test_accounts_left,   -- لازم 0
  (select count(*) from auth.users
    where email like '%@alkemos-test.com'
       or email like '%@musclehub-test.com')              as auth_users_under_test_domains, -- 0 بعد المسح الكامل
  (select count(*) from public.profiles
    where is_test_account = false
      and email like '%@alkemos-test.com')                as unflagged_strays_left;         -- معروضة للمالك أدناه

-- شفافية: الحسابان تحت النطاق بلا العلم (خارج المسح عمدًا — قرار المالك)
select email, role, created_at::date as created
  from public.profiles
 where is_test_account = false
   and email like '%@alkemos-test.com';
