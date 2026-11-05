-- =====================================================================
-- 20261105140000_0105_admin_role_integrity.sql
-- =====================================================================
-- ADMIN-ROLE-INTEGRITY (أمر المالك 2026-11-05 — «تحقيق أمني عاجل وإصلاح
-- فقدان صلاحية Admin في Alkemos» لحساب speerr@gmail.com).
--
-- الحادثة المقيسة (الأدلة الحية موثقة بـ
-- docs/ADMIN-ROLE-LOSS-FORENSICS-AND-FIX-2026-11-05.md):
--   * الإنتاج يحمل الآن صفر حسابات admin (كان speerr@gmail.com أدمنًا
--     مثبتًا بتاريخ 2026-09-01 (بذر tool_leads type='admin' من 0060)
--     وبـ2026-10-05 (هدف إشعار new_coach أول أدمن) — ودوره الآن coach).
--   * السبب الجذري المُثبت حيًا (مسبار سلوكي على الإنتاج): سياسة
--     profiles_update_self فقدت WITH CHECK — انحراف صنف حادثة Phase-61
--     عاد بصمت (أي مستخدم مصادق يستطيع كتابة دوره بنفسه عبر PostgREST،
--     بما فيهم الترقية الذاتية إلى admin).
--   * ثلاث فجوات بنيوية مكّنت الحادثة وجعلتها قابلة للتكرار:
--     (1) لا شيء يجعل الدور غير قابل للتغيير على مستوى القاعدة بمعزل
--         عن صياغة السياسة — السياسة وحدها كانت خط الدفاع الوحيد.
--     (2) لا سجل تدقيق لأي تغيير دور — استحالة نسب الحادثة لفاعل/زمن.
--     (3) لا «حارس آخر أدمن» — المنصة وصلت لصفر أدمن بصمت تام.
--
-- ماذا يفعل هذا الميجريشن (idempotent — الأمان على أي بيئة):
--   PART 1  جدول role_audit_log: كل تغيير دور (insert/update/delete
--           لأدوار غير client) يُسجَّل بـ: من الفاعل (uid/email أو null
--           للسياق الخدمي) + القديم/الجديد + السياق (اسم القناة التي
--           سمحت بالكتابة) — قراءته للأدمن فقط عبر RLS، والكتابة من
--           التريغر حصرًا (SECURITY DEFINER). بلا FK عمدًا: سجل التدقيق
--           يبقى بعد حذف صف البروفايل نفسه.
--   PART 2  تريغر profiles_role_guard (BEFORE INSERT OR UPDATE):
--           - INSERT بسياق مستخدم (JWT) لا يولد إلا client — أي دور
--             آخر في الحمولة يُجبر إلى client (يغلق مسار الاستعادة
--             الاحتياطي في fetchProfile نهائيًا).
--           - UPDATE يمنع تغيير الدور بسياق مستخدم إلا عبر دوال
--             SECURITY DEFINER مصرّحة ترفع علم الجلسة
--             alkemos.role_write (القيمة نفسها تُوثَّق كسياق بالسجل).
--           - الحارس الأخير: رفض تنزيل آخر أدمن (row-level).
--   PART 3  حارس عبارة (AFTER UPDATE/DELETE بجداول الانتقال): يمسك
--           التنزيل الجماعي للأدمن بعبارة واحدة (UPDATE/DELETE متعدد
--           الصفوف) حيث لا يرى تريغر الصف الآخرين — نفس قانون آخر
--           أدمن لكن على مستوى العبارة، + توثيق حذف صفوف الأدمن.
--   PART 4  تعليق التريغرات على profiles (محمي بوجود الجدول).
--   PART 5  auto_promote_coach_if_allowed() إصدار 3: نفس قانون 0029B
--           (ترقية client→coach فقط، لا يمس أدمن أبدًا) + يرفع علم
--           الجلسة قبل التحديث ليصر المسار الوحيد المصرّح به من
--           المتصفح، والسياق يُسجَّل 'auto-promote'.
--   PART 6  admin_set_user_role(uuid, user_role): القناة الخادمية
--           الموحدة لتغيير الأدوار (أدمن عبر جلسة، أو سياق خدمي) —
--           ترفض تنزيل آخر أدمن، وتوثّق كل تغيير.
--   PART 7  إعادة تطبيق سياسة profiles_update_self بصياغة 0017 الحصينة
--           (WITH CHECK: الدور غير قابل للتغيير بالتحديث الذاتي) —
--           الحزام فوق السبوسرز الذي وفره تريغر PART 2.
--   PART 8  استعادة admin لبريد المالك speerr@gmail.com (الأمر الصريح)
--           — تُنفَّذ بعد تفعيل التدقيق فيصبح الاستعادة نفسها أول سطر
--           بالسجل (سياق '0105-restore'، الفاعل: خط الترحيل الخدمي).
--
-- قابلية التطبيق على أي بيئة (قانون 0104): كل جزء يعتمد على كائن قد
-- لا يوجد على استاك اختبار نظيف (profiles / user_role / is_admin /
-- get_profile_role — كلها من عصر RUN_ON اليدوي) محروس بكتل $do$
-- شرطية ترفع notice وتكمل — على الإنتاج كل الكائنات موجودة (مثبتة
-- بالمسبارات الحية) فيطبق الملف كاملًا.
--
-- الاسترجاع (لو لزم بأمر مالك): drop trigger profiles_role_guard +
-- profiles_role_guard_after_upd + profiles_role_guard_after_del على
-- profiles · drop function profiles_role_guard/admin_set_user_role/
-- profiles_role_guard_after_upd/profiles_role_guard_after_del · الجداول
-- والسياسات تعاد لصياغة ما قبل 0105 من التاريخ — لا يُنصح (الملف
-- يحمل حماية تفقد بالعودة).
-- =====================================================================

-- ═══════════════ PART 1 — role_audit_log (سجل تدقيق الأدوار) ═══════════════

create table if not exists public.role_audit_log (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null,                 -- بلا FK عمدًا: السجل يبقى بعد حذف البروفايل
  email       text,
  old_role    public.user_role,              -- null عند الولادة (INSERT)
  new_role    public.user_role,              -- null عند الحذف (DELETE)
  actor_uid   uuid,                          -- auth.uid() للجلسة؛ null = سياق خدمي/SQL
  actor_email text,                          -- بريد فاعل الجلسة إن وُجد
  context     text not null default 'service', -- القناة: auto-promote | admin-rpc | 0105-restore | service | insert
  created_at  timestamptz not null default now()
);

create index if not exists role_audit_log_profile_idx on public.role_audit_log (profile_id, created_at desc);
create index if not exists role_audit_log_created_idx on public.role_audit_log (created_at desc);

alter table public.role_audit_log enable row level security;

-- القراءة للأدمن فقط (السجل يحمل بريدًا)؛ الكتابة من تريغر SECURITY
-- DEFINER حصرًا — لا سياسة insert/update/delete إطلاقًا.
do $do$
begin
  if exists (select 1 from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
             where p.proname = 'is_admin' and n.nspname = 'public') then
    execute $sql$
      drop policy if exists role_audit_log_select_admin on public.role_audit_log;
      create policy role_audit_log_select_admin
        on public.role_audit_log for select
        to authenticated
        using (public.is_admin());
      -- السياسة بلا grant صمّاء: امنح القراءة للمصادقين — RLS تقصرها على الأدمن
      grant select on public.role_audit_log to authenticated
    $sql$;
  else
    raise notice '0105: is_admin() absent — role_audit_log RLS stays deny-all (clean-stack skip)';
  end if;
end
$do$;

-- ═══════════════ PART 2 — تريغر الصف: حارس الدور + التدقيق ═══════════════

create or replace function public.profiles_role_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other_admins int;
  v_ctx          text := coalesce(nullif(current_setting('alkemos.role_write', true), 'off'), 'service');
  v_actor        uuid := auth.uid();
  v_actor_email  text := null;
begin
  if TG_OP = 'INSERT' then
    -- سياق المستخدم لا يولد إلا client (الافتراضي الآمن)؛ أي محاولة
    -- ولادة بدور ستاف من المتصفح تُجبر إلى client. السياق الخدمي
    -- (service/SQL — auth.uid() null) يمر كما هو ويُوثَّق.
    if v_actor is not null
       and new.role is not null
       and new.role::text <> 'client'
       and v_ctx = 'service' then
      new.role := 'client'::public.user_role;
    end if;
    if new.role is not null and new.role::text <> 'client' then
      insert into public.role_audit_log
        (profile_id, email, old_role, new_role, actor_uid, actor_email, context)
      values (new.id, new.email, null, new.role, v_actor, null, 'insert');
    end if;
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if new.role is not distinct from old.role then
      return new;  -- تحرير بروفايل عادي: الدور لم يُمس — لا حارسة ولا سجل
    end if;

    -- قانون آخر أدمن (مستوى الصف): تنزيل الأدمن الأخير مرفوض دائمًا
    if old.role::text = 'admin' and new.role::text <> 'admin' then
      select count(*) into v_other_admins
        from public.profiles
       where role::text = 'admin' and id <> old.id;
      if v_other_admins = 0 then
        raise exception 'ALKEMOS-ROLE-GUARD: refusing to demote the LAST admin (profile %) — promote another admin first', old.id
          using errcode = 'check_violation';
      end if;
    end if;

    -- سياق المستخدم (JWT) لا يغيّر دورًا أبدًا إلا عبر دالة مصرّحة
    -- رفعت علم alkemos.role_write (auto-promote / admin-rpc)
    if v_actor is not null and v_ctx = 'service' then
      raise exception 'ALKEMOS-ROLE-GUARD: role changes are server-side only (profile %: % -> %)', old.id, old.role::text, new.role::text
        using errcode = 'insufficient_privilege';
    end if;

    -- تغيير مسموح (سياق خدمي أو قناة مصرّحة): وثّقه
    select email into v_actor_email from public.profiles where id = v_actor;
    insert into public.role_audit_log
      (profile_id, email, old_role, new_role, actor_uid, actor_email, context)
    values (old.id, old.email, old.role, new.role, v_actor, v_actor_email, v_ctx);
    return new;
  end if;

  return null; -- غير مُستدعى لـ DELETE (الحارس مستوى العبارة أدناه)
end;
$$;

-- ═══════════════ PART 3 — حارس العبارة: آخر أدمن + توثيق حذف الأدمن ═══════════════
-- تريغر الصف يرى لقطة العبارة: عبارة واحدة تنزّل/تحذف كل الأدمن دفعة
-- واحدة سترى كل صف «آخرَ أدمن مع بقية الأدمن» — هذا الحارس مستوى
-- العبارة (بجداول الانتقال) هو الذي يمسك الحالة الجماعية ويلغي
-- العبارة كلها.

create or replace function public.profiles_role_guard_after_upd()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admins_after int;
begin
  if exists (select 1 from guard_old_rows o
             join guard_new_rows n on n.id = o.id
             where o.role::text = 'admin' and n.role::text <> 'admin') then
    select count(*) into v_admins_after from public.profiles where role::text = 'admin';
    if v_admins_after = 0 then
      raise exception 'ALKEMOS-ROLE-GUARD: the statement would leave ZERO admins — refused (bulk demote guard)'
        using errcode = 'check_violation';
    end if;
  end if;
  return null;
end;
$$;

create or replace function public.profiles_role_guard_after_del()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admins_after int;
  v_ctx         text := coalesce(nullif(current_setting('alkemos.role_write', true), 'off'), 'service');
begin
  if exists (select 1 from guard_del_rows where role::text = 'admin') then
    -- توثيق حذف صفوف الأدمن (الحذف نفسه يمر إن لم يكن أخيرًا)
    insert into public.role_audit_log
      (profile_id, email, old_role, new_role, actor_uid, actor_email, context)
    select d.id, d.email, d.role, null, auth.uid(), null, v_ctx || ':delete'
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
$$;

-- ═══════════════ PART 4 — تعليق التريغرات على profiles ═══════════════

do $do$
begin
  if to_regclass('public.profiles') is not null then
    drop trigger if exists profiles_role_guard on public.profiles;
    execute 'create trigger profiles_role_guard
               before insert or update on public.profiles
               for each row execute function public.profiles_role_guard()';
    drop trigger if exists profiles_role_guard_after_upd on public.profiles;
    execute 'create trigger profiles_role_guard_after_upd
               after update on public.profiles
               referencing new table as guard_new_rows old table as guard_old_rows
               for each statement execute function public.profiles_role_guard_after_upd()';
    drop trigger if exists profiles_role_guard_after_del on public.profiles;
    execute 'create trigger profiles_role_guard_after_del
               after delete on public.profiles
               referencing old table as guard_del_rows
               for each statement execute function public.profiles_role_guard_after_del()';
  else
    raise notice '0105: public.profiles absent — triggers skipped (clean-stack skip)';
  end if;
end
$do$;

-- ═══════════════ PART 5 — auto_promote_coach_if_allowed() إصدار 3 ═══════════════
-- قانون 0029B محفوظ حرفيًا (client→coach فقط — الأدمن لا يُمس أبدًا)
-- + رفع علم الجلسة ليصبح المسار المصرّح الوحيد من المتصفح + السياق
-- يُوثَّق بالسجل ('auto-promote').

create or replace function public.auto_promote_coach_if_allowed()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from public.profiles where id = auth.uid();
  if v_email is null then
    return false;
  end if;

  if exists (
    select 1 from public.coach_emails
    where lower(email) = lower(v_email)
  ) then
    -- القناة المصرّحة الوحيدة لترقية client→coach من المتصفح
    perform set_config('alkemos.role_write', 'auto-promote', true);
    update public.profiles
       set role = 'coach'
     where id = auth.uid()
       and role = 'client';
    return true;
  end if;

  return false;
end;
$$;

-- ═══════════════ PART 6 — admin_set_user_role: القناة الخادمية الموحدة ═══════════════

do $do$
begin
  if exists (select 1 from pg_type t
             join pg_namespace n on n.oid = t.typnamespace
             where t.typname = 'user_role' and n.nspname = 'public') then
    execute $fn$
      create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
      returns jsonb
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        v_old          public.user_role;
        v_other_admins int;
        v_caller       uuid := auth.uid();
      begin
        -- البوابة: جلسة مستخدم لا يقبلها إلا الأدمن؛ السياق الخدمي
        -- (service-role / خط الترحيل) يمر — وكل شيء يُوثَّق
        if v_caller is not null and not public.is_admin() then
          raise exception 'ALKEMOS-ROLE-GUARD: admin_set_user_role requires an admin session'
            using errcode = 'insufficient_privilege';
        end if;

        select role into v_old from public.profiles where id = p_user_id;
        if v_old is null then
          raise exception 'profile % not found', p_user_id
            using errcode = 'foreign_key_violation';
        end if;
        if v_old = p_role then
          return jsonb_build_object('ok', true, 'unchanged', true, 'role', p_role);
        end if;

        -- قانون آخر أدمن
        if v_old::text = 'admin' and p_role::text <> 'admin' then
          select count(*) into v_other_admins
            from public.profiles
           where role::text = 'admin' and id <> p_user_id;
          if v_other_admins = 0 then
            raise exception 'ALKEMOS-ROLE-GUARD: refusing to demote the LAST admin'
              using errcode = 'check_violation';
          end if;
        end if;

        perform set_config('alkemos.role_write', 'admin-rpc', true);
        update public.profiles set role = p_role where id = p_user_id;
        return jsonb_build_object('ok', true, 'unchanged', false,
                                  'old_role', v_old, 'role', p_role);
      end;
      $body$
    $fn$;
    revoke execute on function public.admin_set_user_role(uuid, public.user_role) from public;
    grant  execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;
  else
    raise notice '0105: user_role type absent — admin_set_user_role skipped (clean-stack skip)';
  end if;
end
$do$;

-- ═══════════════ PART 7 — استعادة الحزام: profiles_update_self الحصينة ═══════════════
-- إعادة تطبيق صياغة 0017/0055 حرفيًا (WITH CHECK عبر get_profile_role):
-- التحديث الذاتي لا يستطيع تغيير الدور — كان هذا هو الانحراف المُثبت
-- حيًا (المسبار B: HTTP 204 لتغيير الدور الذاتي) وهو الآن مزدوج الحماية
-- مع تريغر PART 2.

do $do$
begin
  if to_regclass('public.profiles') is not null
     and exists (select 1 from pg_proc p
                 join pg_namespace n on n.oid = p.pronamespace
                 where p.proname = 'get_profile_role' and n.nspname = 'public') then
    execute $sql$
      drop policy if exists profiles_update_self on public.profiles;
      create policy profiles_update_self
        on public.profiles for update
        using (auth.uid() = id)
        with check (
          auth.uid() = id
          and role is not distinct from public.get_profile_role(auth.uid())
        )
    $sql$;
  else
    raise notice '0105: profiles/get_profile_role absent — policy re-apply skipped (clean-stack skip)';
  end if;
end
$do$;

-- ═══════════════ PART 8 — استعادة admin لبريد المالك (الأمر الصريح) ═══════════════
-- speerr@gmail.com: الأدمن الأساسي الموثق (0029B: المالك هو الأدمن
-- العام) — الاستعادة تسير عبر الحارس نفسه فيوثَّق كأول سطر بالسجل
-- (سياق '0105-restore'). محمية: لا تمس إلا هذا البريد ولا تعمل إلا
-- إن كان دوره ليس admin.

do $do$
begin
  -- الحارس المزدوج: الجدول موجود + قيمة 'admin' نفسها داخل الـenum
  -- (0029A قد يفشل على استاك نظيف — قانون 0104 لأي بيئة)
  if to_regclass('public.profiles') is not null
     and exists (select 1 from pg_enum e
                 join pg_type t on t.oid = e.enumtypid
                 join pg_namespace n on n.oid = t.typnamespace
                where t.typname = 'user_role' and e.enumlabel = 'admin') then
    perform set_config('alkemos.role_write', '0105-restore', true);
    update public.profiles
       set role = 'admin'
     where email = 'speerr@gmail.com'
       and role::text <> 'admin';
    raise notice '0105: owner admin restore executed for speerr@gmail.com (0-or-1 row, idempotent)';
  else
    raise notice '0105: profiles/admin-enum absent — restore skipped (clean-stack skip)';
  end if;
end
$do$;

notify pgrst, 'reload schema';

-- ═══════════════ التحقق (شغّل يدويًا بعد التطبيق) ═══════════════
-- 1) الأدمن مستعاد (سطر واحد role=admin):
--    select id, email, role from public.profiles where role = 'admin';
-- 2) سجل التدقيق حمل الاستعادة (context='0105-restore'):
--    select profile_id, email, old_role, new_role, context, created_at
--      from public.role_audit_log order by created_at desc limit 5;
-- 3) الحارس يعمل (متوقع رفض 42501/raise):
--    -- بجلسة مستخدم عادي: update public.profiles set role='admin'
--    --   where id=auth.uid();
-- 4) التريغرات معلقة:
--    select tgname from pg_trigger
--     where tgrelid='public.profiles'::regclass and not tgisinternal;
--    -- متوقع: profiles_role_guard + profiles_role_guard_after_upd
--    --        + profiles_role_guard_after_del (+ on_auth_user_created
--    --        + تريغرات 0057/0060 التاريخية إن وجدت)
