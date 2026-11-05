-- =====================================================================
-- 20261105145000_0106_role_guard_whitelist.sql
-- =====================================================================
-- ROLE-GUARD WHITELIST (تكملة 0105 — أمر المالك نفسه «منع فقدانها مرة
-- أخرى… مع التأكد من أن الإصلاح لا يفتح ثغرة»).
--
-- ما الذي كشفه سجل التدقيق بعد 0105:
--   صفان بسياق '' (فارغ) ظهرا بعد استدعاءات admin_set_user_role على
--   نفس الاتصال المُجمّع: سلوك PostgreSQL المعروف أن set_config(..., true)
--   عند نهاية المعاملة يعيد المتغير إلى '' وليس NULL في بعض مسارات
--   التجميع. منطق 0105 كان قائمة سوداء (ارفض فقط حين v_ctx='service')
--   — القيمة '' لا تساوي 'service' فلا يُرفض طلب سياق-مستخدم نظريًا
--   هبط على اتصال ملوّث هكذا (لم يقع فعليًا — الصفان المقيسان كانا
--   بسياق خدمي actor=null الذي يُسمح له بالتصميم — لكن المنطق كان
--   يحمل فجوة تمرير).
--
-- الإصلاح — قائمة بيضاء بدل السوداء:
--   سياق المستخدم (auth.uid ليس null) يُرفض تغيير دوره ALWAYS إلا إذا
--   كانت قيمة alkemos.role_write هي حرفيًا اسم قناة مصرّحة
--   ('auto-promote' أو 'admin-rpc') — أي قيمة أخرى (NULL · '' · 'off'
--   · أي تلوث مستقبلي) = رفض. لا يمكن لقيمة إعادة تعيين أن تفتح
--   الثغرة لأن القائمة مقفلة على القناتين المعروفتين.
--   + تطبيع السياق بالسجل: '' يعود 'service' (توثيق أنظف).
--
-- idempotent · الإنتاج: إعادة تعريف الدالة فقط (لاschema) · القناة:
-- خط الترحيل المملوك قبل نشر الكود · قانون 0104 قابلية أي بيئة: لا
-- تبعيات خارج دالة موجودة من 0105 (تحرس كتلة $do$ بوجود الدالة).
-- =====================================================================

do $do$
begin
  if exists (select 1 from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
             where p.proname = 'profiles_role_guard' and n.nspname = 'public') then
    execute $fn$
      create or replace function public.profiles_role_guard()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_raw          text := current_setting('alkemos.role_write', true);
        v_sanctioned   boolean := coalesce(v_raw, '') in ('auto-promote', 'admin-rpc');
        v_ctx          text := coalesce(nullif(coalesce(v_raw, ''), ''), 'service');
        v_other_admins int;
        v_actor        uuid := auth.uid();
        v_actor_email  text := null;
      begin
        if TG_OP = 'INSERT' then
          -- سياق المستخدم لا يولد إلا client — إلا عبر قناة مصرّحة (whitelist)
          if v_actor is not null
             and new.role is not null
             and new.role::text <> 'client'
             and not v_sanctioned then
            new.role := 'client'::public.user_role;
          end if;
          if new.role is not null and new.role::text <> 'client' then
            insert into public.role_audit_log
              (profile_id, email, old_role, new_role, actor_uid, actor_email, context)
            values (new.id, new.email, null, new.role::text, v_actor, null, 'insert');
          end if;
          return new;
        end if;

        if TG_OP = 'UPDATE' then
          if new.role is not distinct from old.role then
            return new;
          end if;

          -- قانون آخر أدمن (مستوى الصف) — كما في 0105
          if old.role::text = 'admin' and new.role::text <> 'admin' then
            select count(*) into v_other_admins
              from public.profiles
             where role::text = 'admin' and id <> old.id;
            if v_other_admins = 0 then
              raise exception 'ALKEMOS-ROLE-GUARD: refusing to demote the LAST admin (profile %) — promote another admin first', old.id
                using errcode = 'check_violation';
            end if;
          end if;

          -- 0106: قائمة بيضاء — سياق المستخدم مرفوض دائمًا إلا بقناة
          -- مصرّحة بالاسم الحرفي؛ '' وNULL و'off' وأي تلوث إعادة تعيين
          -- كلها مرفوضة
          if v_actor is not null and not v_sanctioned then
            raise exception 'ALKEMOS-ROLE-GUARD: role changes are server-side only (profile %: % -> %)', old.id, old.role::text, new.role::text
              using errcode = 'insufficient_privilege';
          end if;

          select email into v_actor_email from public.profiles where id = v_actor;
          insert into public.role_audit_log
            (profile_id, email, old_role, new_role, actor_uid, actor_email, context)
          values (old.id, old.email, old.role::text, new.role::text, v_actor, v_actor_email, v_ctx);
          return new;
        end if;

        return null;
      end;
      $body$
    $fn$;
  else
    raise notice '0106: profiles_role_guard absent — skipped (clean-stack skip)';
  end if;
end
$do$;

-- تطبيع سياق حذف صفوف الأدمن ('' -> 'service') في حارس العبارة
do $do$
begin
  if exists (select 1 from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
             where p.proname = 'profiles_role_guard_after_del' and n.nspname = 'public') then
    execute $fn$
      create or replace function public.profiles_role_guard_after_del()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_admins_after int;
        v_raw          text := current_setting('alkemos.role_write', true);
        v_ctx          text := coalesce(nullif(coalesce(v_raw, ''), ''), 'service');
      begin
        if exists (select 1 from guard_del_rows where role::text = 'admin') then
          insert into public.role_audit_log
            (profile_id, email, old_role, new_role, actor_uid, actor_email, context)
          select d.id, d.email, d.role::text, null, auth.uid(), null, v_ctx || ':delete'
            from guard_del_rows d
           where d.role::text = 'admin';
          select count(*) into v_admins_after from public.profiles where role::text = 'admin';
          if v_admins_after = 0 then
            raise exception 'ALKEMOS-ROLE-GUARD: the delete would leave ZERO admins — refused (last-admin delete guard)'
              using errcode = 'check_violation';
          end if;
        end if;
        return null;
      end;
      $body$
    $fn$;
  else
    raise notice '0106: profiles_role_guard_after_del absent — skipped (clean-stack skip)';
  end if;
end
$do$;

notify pgrst, 'reload schema';

-- التحقق (يدويًا بعد التطبيق):
--   select prosrc from pg_proc where proname='profiles_role_guard';
--   -> الجسم يحمل 'v_sanctioned' و'in (''auto-promote'', ''admin-rpc'')'
--   والفحص اليومي self_role_patch_rejected يبقى الحارس السلوكي.
