-- =====================================================================
-- 20261105150000_0107_role_audit_log_text_columns.sql
-- =====================================================================
-- ROLE-AUDIT-LOG TEXT COLUMNS (إصلاح عاجل — تكملة أمر المالك نفسه).
--
-- ما الذي حدث (السجل الكامل الصادق):
--   * الإنتاج طبّق النسخة الأولى من 0105 بأعمدة old_role/new_role من
--     نوع public.user_role (التعريف الأصلي)، ثم طبّق 0106 الذي يعيد
--     تعريف التريغر بإدراجات ::text الصريحة (الموائمة مع نسخة ملف
--     0105 المحمولة لأي بيئة — الأعمدة text).
--   * النتيجة المقيسة حيًا: كل كتابة دور عبر التريغر تفشل 42804
--     («column old_role is of type user_role but expression is of
--     text») — قناة تغيير الأدوار تعطلت والدليل: بوابة الحالة نفسها
--     احمرّت خلال دقائق (فشل إنشاء جلسة الفحص المؤقتة التي ترفع دور
--     حساب اختباري عبر نفس المسار) — البوابة أمسكت الانكسار فورًا
--     ومنعت النشر (سلوك التصميم بالضبط).
--   * حساب المالك: لم يتأثر (أدمن فعلًا — القراءة سليمة ولا كتابة
--     مطلوبة) · التسجيلات الجديدة client: لم تتأثر (فرع التسجيل لا
--     يسجل إلا الأدوار غير client).
--
-- الإصلاح: تحويل عمودي السجل إلى text على الإنتاج — مطابقة حرفية
-- لتعريف ملف 0105 المحمول (text) الذي يتوقعه تريغر 0106، وإزالة
-- الاختلاف النوعي الموثق بعد التطبيق الأول. جدول 19 صفًا — لحظي.
--
-- idempotent (تحويل text→text no-op آمن) · محروس بوجود الجدول
-- (قانون 0104) · القناة: خط الترحيل قبل نشر الكود.
-- =====================================================================

do $do$
begin
  if to_regclass('public.role_audit_log') is not null then
    execute $sql$
      alter table public.role_audit_log
        alter column old_role type text using old_role::text,
        alter column new_role type text using new_role::text
    $sql$;
    raise notice '0107: role_audit_log columns converted to text (idempotent no-op if already text)';
  else
    raise notice '0107: role_audit_log absent — skipped (clean-stack skip)';
  end if;
end
$do$;

notify pgrst, 'reload schema';

-- التحقق (يدويًا بعد التطبيق):
--   1) الأعمدة text:
--      select column_name, data_type from information_schema.columns
--       where table_name='role_audit_log' and column_name in ('old_role','new_role');
--      -> text / text
--   2) كتابة دور تعمل ويسجلها السجل: أول تشغيلة لبوابة الحالة بعد
--      التطبيق تنشئ أدمنها المؤقت (client→admin عبر نفس المسار) —
--      عودة البوابة للفحوص السلوكية هي البرهان التشغيلي ذاته.
