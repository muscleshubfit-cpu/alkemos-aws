-- =====================================================================
--  RUN_ON_SUPABASE_0102_sub_pick_active_first.sql  (OWNER-RUN file)
-- =====================================================================
--  WHY THIS FILE EXISTS (2026-10-26 live QA round, Task
--  QA-TEST-ACCOUNTS-2026-10-26):
--  The live admin clients list was still picking the EXPIRED premium row
--  as the primary subscription for a client holding an ACTIVE coaching
--  renewal (measured live read-only: RPC get_admin_clients_paged returned
--  premium/active/end=2026-10-10 for samarsamy0992@gmail.com whose
--  coaching runs to 2026-11-22) — i.e. migration 0102's active-first
--  ordering is NOT in the production database even though its commit
--  (b09dae2/d488624) landed on main and the app deployed. The last
--  confirmed-applied migration is 0100 (prune_notifications exists);
--  the Supabase-GitHub auto-apply pipeline has silently stopped after it.
--
--  WHAT TO DO (owner, by hand — AGENTS.md §6 manual path, 0095/0050
--  pattern):
--    1. Open the Supabase Dashboard SQL Editor:
--       https://supabase.com/dashboard/project/wyopqryzfjifyeyvyxfy/sql/new
--    2. Paste this ENTIRE file and click Run (expect "Success").
--    3. The VERIFY grid at the bottom must show ALL FIVE columns = 1.
--  The script is idempotent (create or replace) — re-running is a no-op.
--  Content below is migration 0102 VERBATIM (no edits).
-- =====================================================================

-- ============================================================================
-- 0102 — SUB-PICK-ACTIVE-FIRST (أمر المالك 2026-10-26 — «إصلاح تجديد
-- الاشتراكات: اشتراك التدريب المجدد يظهر منتهيًا مع استمرار ظهور اشتراك
-- Premium قديم»)
-- ============================================================================
-- THE MEASURED DEFECT (reproduced live, read-only, scripts/repro/sub_pick_repro.py):
--   client 87cd7ba6 holds premium (ends 2026-10-10 — expired) + coaching
--   (renewed 2026-10-22 → ends 2026-11-22 — ACTIVE). Every staff-side
--   "primary subscription" pick orders by tier priority alone
--   (pro > premium > coaching) with NO expiry term, so the EXPIRED premium
--   masked the RENEWED-ACTIVE coaching row on ALL five surfaces:
--     · get_coach_client_list_paged  (0092 latest) — coach/admin client list
--     · get_coach_client_stats       (0092 latest) — the counters
--     · get_coach_client_list        (0043 latest) — admin assignments view
--     · get_admin_clients_paged      (0068 latest) — unified admin clients
--     · get_admin_clients_stats      (0068 latest) — admin counters
--   The list badge read the expired row → «منتهي» — the reported state:
--   the renewed TRAINING subscription looks expired while the old Premium
--   keeps showing.
--
-- THE LAW (one key added as the FIRST order term, everything else verbatim):
--   order by
--     coalesce(s.status = 'active' and s.end_date > now(), false) desc,  ← NEW
--     case s.tier when 'pro' then 3 when 'premium' then 2
--                  when 'coaching' then 1 else 0 end desc,
--     s.created_at desc
--   An effectively-ACTIVE row (any tier) now always outranks an expired one;
--   among actives the historical best-membership pick stands (pro > premium
--   > coaching); when nothing is active the historical pick shows the best
--   expired row and the surface's effective-status flag («منتهي») stays
--   honest. The coalesce guards the NULL-end_date case: a bare boolean DESC
--   would sort NULL ABOVE true (Postgres NULLS FIRST on DESC) — coalesced
--   to false, a NULL end_date can never outrank an active row.
--   Non-admin coaches are unaffected: their WHERE already restricts the
--   lateral to the single coaching row (unique(client_id, tier)).
--
-- The TS twin of this law lands in the SAME commit:
--   src/lib/subscription-view.ts pickPrimarySubscription (expiry-aware) —
--   CoachClientView's header + getSubscriptionForClient share it.
--
-- SCOPE/SAFETY: read-path presentation ONLY — no table, no RLS, no money
-- path, no signature change (all five functions keep their exact signatures
-- and argument defaults → zero caller breakage; types.ts unchanged — the
-- 0101 precedent for a no-structural-change migration). create or replace
-- is idempotent. Applied automatically by the Supabase-GitHub integration.
-- ============================================================================

-- ---------------------------------------------------------------
-- 1) get_coach_client_list_paged (0092 body + the active-first key)
-- ---------------------------------------------------------------
create or replace function public.get_coach_client_list_paged(
  p_limit   int  default 25,
  p_offset  int  default 0,
  p_search  text default null,
  p_filter  text default 'all',    -- all|active|expiring|expired|no_plan|no_questionnaire|pending_payment|premium|pro|coaching|invite_pending
  p_segment text default 'all',    -- admin split: all|coach|site (coach = REAL coach, 0068 gate)
  p_sort    text default 'newest'  -- newest|oldest|name|expiry
)
returns table (
  client_id uuid,
  client_email text,
  client_full_name text,
  client_phone text,
  client_avatar_url text,
  client_created_at timestamptz,
  sub_tier text,
  sub_status text,
  sub_end_date timestamptz,
  sub_months int,
  pending_payments int,
  nutri_q_status text,
  fit_q_status text,
  assigned_coach_id uuid,
  assigned_coach_name text,
  member_kind text,            -- 'b2b' | 'site' — how THIS caller relates to the row
  site_member_active boolean,  -- any active sub (follow-up signal, no tier exposed)
  invite_pending boolean,      -- 0092 (m-C): invited, never joined yet
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      p.id            as client_id,
      p.email         as client_email,
      p.full_name     as client_full_name,
      p.phone         as client_phone,
      p.avatar_url    as client_avatar_url,
      p.created_at    as client_created_at,

      -- 0041/0043 boundary + 0102 active-first: one lateral = the SAME
      -- best-sub row feeds all four sub_* columns (admin → best ACTIVE
      -- tier, expired rows never mask an active renewal; coach → coaching only)
      bs.tier     as sub_tier,
      bs.status   as sub_status,
      bs.end_date as sub_end_date,
      bs.months   as sub_months,

      case when public.is_admin() then
        (select count(*) from public.subscription_requests sr
          where sr.user_id = p.id and sr.status = 'pending')::int
      else 0 end as pending_payments,

      (select nq.status from public.nutrition_questionnaires nq
        where nq.client_id = p.id limit 1) as nutri_q_status,
      (select fq.status from public.fitness_questionnaires fq
        where fq.client_id = p.id limit 1) as fit_q_status,

      ca.coach_id   as assigned_coach_id,
      cp.full_name  as assigned_coach_name,
      cp.role       as assigned_coach_role,

      case
        when public.is_admin() then
          (case when cp.role = 'coach' then 'b2b' else 'site' end)
        when ca.coach_id = auth.uid() then 'b2b'
        else 'site'
      end as member_kind,

      exists (
        select 1 from public.subscriptions s2
        where s2.client_id = p.id
          and s2.status = 'active'
          and s2.end_date > now()
      ) as site_member_active,

      (au.id is not null
        and au.encrypted_password = ''
        and au.last_sign_in_at is null)                          as _invite_pending,

      -- flags used by p_filter (mirrors the JS logic in CoachView)
      (bs.status = 'active' and bs.end_date >  now())                          as _is_active,
      (bs.status = 'active' and bs.end_date >  now()
        and bs.end_date < now() + interval '14 days')                          as _is_expiring,
      (bs.tier is not null and (bs.status <> 'active'
        or bs.end_date <= now()))                                              as _is_expired,
      (bs.tier is null)                                                        as _no_plan,
      case when public.is_admin() then
        exists (select 1 from public.subscription_requests sr
          where sr.user_id = p.id and sr.status = 'pending')
      else false end                                                           as _pending,
      ((select 1 from public.nutrition_questionnaires nq
         where nq.client_id = p.id limit 1) is null
       and (select 1 from public.fitness_questionnaires fq
         where fq.client_id = p.id limit 1) is null)                           as _no_questionnaire
    from public.profiles p
    left join lateral (
      select s.tier, s.status, s.end_date, s.months
      from public.subscriptions s
      where s.client_id = p.id
        and (public.is_admin() or s.tier = 'coaching')
      order by
        coalesce(s.status = 'active' and s.end_date > now(), false) desc,
        case s.tier when 'pro' then 3 when 'premium' then 2 when 'coaching' then 1 else 0 end desc,
        s.created_at desc
      limit 1
    ) bs on true
    left join public.coach_assignments ca on ca.client_id = p.id
    left join public.profiles cp on cp.id = ca.coach_id
    left join public.site_coach_assignments sca on sca.client_id = p.id
    left join auth.users au on au.id = p.id
    where p.role = 'client'
      and (
        public.is_admin()
        or ca.coach_id = auth.uid()
        or sca.coach_id = auth.uid()
      )
  )
  select
    b.client_id, b.client_email, b.client_full_name, b.client_phone,
    b.client_avatar_url, b.client_created_at,
    b.sub_tier, b.sub_status, b.sub_end_date, b.sub_months,
    b.pending_payments, b.nutri_q_status, b.fit_q_status,
    b.assigned_coach_id, b.assigned_coach_name,
    b.member_kind, b.site_member_active,
    b._invite_pending as invite_pending,
    count(*) over () as total_count
  from base b
  where
    case coalesce(p_filter, 'all')
      when 'active'           then b._is_active
      when 'expiring'         then b._is_expiring
      when 'expired'          then b._is_expired
      when 'no_plan'          then b._no_plan
      when 'no_questionnaire' then b._no_questionnaire
      when 'pending_payment'  then b._pending
      when 'premium'          then b.sub_tier = 'premium'
      when 'pro'              then b.sub_tier = 'pro'
      when 'coaching'         then b.sub_tier = 'coaching'
      when 'invite_pending'   then b._invite_pending
      else true
    end
    and case coalesce(p_segment, 'all')
      when 'coach' then b.assigned_coach_role = 'coach'
      when 'site'  then b.assigned_coach_role is distinct from 'coach'
      else true
    end
    and (
      nullif(btrim(coalesce(p_search, '')), '') is null
      or b.client_full_name ilike '%' || btrim(p_search) || '%'
      or b.client_email     ilike '%' || btrim(p_search) || '%'
      or b.client_phone     ilike '%' || btrim(p_search) || '%'
    )
  order by
    case coalesce(p_sort, 'newest')
      when 'oldest' then b.client_created_at end asc nulls last,
    case coalesce(p_sort, 'newest')
      when 'newest' then b.client_created_at end desc nulls last,
    case coalesce(p_sort, 'newest')
      when 'name' then lower(coalesce(b.client_full_name, b.client_email, '')) end asc nulls last,
    case coalesce(p_sort, 'newest')
      when 'expiry' then b.sub_end_date end asc nulls last,
    b.client_created_at desc,
    b.client_id desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

grant execute on function public.get_coach_client_list_paged(int, int, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------
-- 2) get_coach_client_stats (0092 body + the active-first key)
-- ---------------------------------------------------------------
create or replace function public.get_coach_client_stats()
returns table (
  total            bigint,
  active           bigint,
  expiring         bigint,
  no_plan          bigint,
  no_questionnaire bigint,
  pending_payment  bigint,
  expired          bigint,
  premium          bigint,
  pro              bigint,
  coaching         bigint,
  coach_clients    bigint,
  site_clients     bigint,
  pending_invites  bigint
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      p.id,
      (ca.coach_id is not null and cp.role = 'coach') as _has_b2b_coach,
      bs.tier,
      (bs.status = 'active' and bs.end_date > now())                          as _is_active,
      (bs.status = 'active' and bs.end_date > now()
        and bs.end_date < now() + interval '14 days')                         as _is_expiring,
      (bs.tier is not null and (bs.status <> 'active'
        or bs.end_date <= now()))                                             as _is_expired,
      case when public.is_admin() then
        exists (select 1 from public.subscription_requests sr
          where sr.user_id = p.id and sr.status = 'pending')
      else false end                                                          as _pending,
      ((select 1 from public.nutrition_questionnaires nq
         where nq.client_id = p.id limit 1) is null
       and (select 1 from public.fitness_questionnaires fq
         where fq.client_id = p.id limit 1) is null)                          as _no_questionnaire,
      (au.id is not null
        and au.encrypted_password = ''
        and au.last_sign_in_at is null)                                       as _invite_pending
    from public.profiles p
    left join lateral (
      select s.tier, s.status, s.end_date
      from public.subscriptions s
      where s.client_id = p.id
        and (public.is_admin() or s.tier = 'coaching')
      order by
        coalesce(s.status = 'active' and s.end_date > now(), false) desc,
        case s.tier when 'pro' then 3 when 'premium' then 2 when 'coaching' then 1 else 0 end desc,
        s.created_at desc
      limit 1
    ) bs on true
    left join public.coach_assignments ca on ca.client_id = p.id
    left join public.profiles cp on cp.id = ca.coach_id
    left join public.site_coach_assignments sca on sca.client_id = p.id
    left join auth.users au on au.id = p.id
    where p.role = 'client'
      and (
        public.is_admin()
        or ca.coach_id = auth.uid()
        or sca.coach_id = auth.uid()
      )
  )
  select
    count(*),
    count(*) filter (where _is_active),
    count(*) filter (where _is_expiring),
    count(*) filter (where tier is null),
    count(*) filter (where _no_questionnaire),
    count(*) filter (where _pending),
    count(*) filter (where _is_expired),
    count(*) filter (where tier = 'premium'),
    count(*) filter (where tier = 'pro'),
    count(*) filter (where tier = 'coaching'),
    count(*) filter (where _has_b2b_coach),
    count(*) filter (where not _has_b2b_coach),
    count(*) filter (where _invite_pending)
  from base
$$;

grant execute on function public.get_coach_client_stats() to authenticated;

-- ---------------------------------------------------------------
-- 3) get_coach_client_list (0043 body + the active-first key)
-- ---------------------------------------------------------------
create or replace function public.get_coach_client_list()
returns table (
  client_id uuid,
  client_email text,
  client_full_name text,
  client_phone text,
  client_avatar_url text,
  client_created_at timestamptz,
  sub_tier text,
  sub_status text,
  sub_end_date timestamptz,
  sub_months int,
  pending_payments int,
  nutri_q_status text,
  fit_q_status text,
  assigned_coach_id uuid,
  assigned_coach_name text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.avatar_url,
    p.created_at,

    -- 0102 active-first: the four sub_* columns read the SAME row (0043
    -- fix stands) and an ACTIVE row now outranks any expired one.
    (
      select s.tier
      from public.subscriptions s
      where s.client_id = p.id
        and (public.is_admin() or s.tier = 'coaching')
      order by
        coalesce(s.status = 'active' and s.end_date > now(), false) desc,
        case s.tier when 'pro' then 3 when 'premium' then 2 when 'coaching' then 1 else 0 end desc,
        s.created_at desc
      limit 1
    ),
    (
      select s.status
      from public.subscriptions s
      where s.client_id = p.id
        and (public.is_admin() or s.tier = 'coaching')
      order by
        coalesce(s.status = 'active' and s.end_date > now(), false) desc,
        case s.tier when 'pro' then 3 when 'premium' then 2 when 'coaching' then 1 else 0 end desc,
        s.created_at desc
      limit 1
    ),
    (
      select s.end_date
      from public.subscriptions s
      where s.client_id = p.id
        and (public.is_admin() or s.tier = 'coaching')
      order by
        coalesce(s.status = 'active' and s.end_date > now(), false) desc,
        case s.tier when 'pro' then 3 when 'premium' then 2 when 'coaching' then 1 else 0 end desc,
        s.created_at desc
      limit 1
    ),
    (
      select s.months
      from public.subscriptions s
      where s.client_id = p.id
        and (public.is_admin() or s.tier = 'coaching')
      order by
        coalesce(s.status = 'active' and s.end_date > now(), false) desc,
        case s.tier when 'pro' then 3 when 'premium' then 2 when 'coaching' then 1 else 0 end desc,
        s.created_at desc
      limit 1
    ),

    case when public.is_admin() then
    (
      select count(*)
      from public.subscription_requests sr
      where sr.user_id = p.id and sr.status = 'pending'
    )::int
    else 0 end::int,

    (
      select nq.status
      from public.nutrition_questionnaires nq
      where nq.client_id = p.id
      limit 1
    ),

    (
      select fq.status
      from public.fitness_questionnaires fq
      where fq.client_id = p.id
      limit 1
    ),

    ca.coach_id,
    cp.full_name

  from public.profiles p
  left join public.coach_assignments ca on ca.client_id = p.id
  left join public.profiles cp on cp.id = ca.coach_id
  where p.role = 'client'
    and (public.is_admin() or ca.coach_id = auth.uid())
  order by p.created_at desc
$$;

grant execute on function public.get_coach_client_list() to authenticated;

-- ---------------------------------------------------------------
-- 4) get_admin_clients_paged (0068 body + the active-first key)
-- ---------------------------------------------------------------
create or replace function public.get_admin_clients_paged(
  p_limit   int  default 25,
  p_offset  int  default 0,
  p_search  text default null,
  p_filter  text default 'all',   -- all|active|expiring|expired|no_plan|pending_payment|premium|pro|coaching
  p_type    text default 'all',   -- all|member_site|client_of_coach|coach|coach_site|coach_b2b|admin
  p_test    text default 'all',   -- all|test|real
  p_sort    text default 'newest' -- newest|oldest|name|expiry
)
returns table (
  client_id uuid,
  client_email text,
  client_full_name text,
  client_phone text,
  client_avatar_url text,
  client_created_at timestamptz,
  role text,
  coach_kind text,
  is_test_account boolean,
  sub_tier text,
  sub_status text,
  sub_end_date timestamptz,
  sub_months int,
  pending_payments int,
  assigned_coach_id uuid,
  assigned_coach_name text,
  assigned_coach_role text,
  site_coach_id uuid,
  site_coach_name text,
  b2b_clients int,
  site_members int,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      p.id            as client_id,
      p.email         as client_email,
      p.full_name     as client_full_name,
      p.phone         as client_phone,
      p.avatar_url    as client_avatar_url,
      p.created_at    as client_created_at,
      p.role          as role,
      coalesce(p.coach_kind, 'b2b') as coach_kind,
      p.is_test_account as is_test_account,

      bs.tier     as sub_tier,
      bs.status   as sub_status,
      bs.end_date as sub_end_date,
      bs.months   as sub_months,

      (select count(*) from public.subscription_requests sr
        where sr.user_id = p.id and sr.status = 'pending')::int as pending_payments,

      ca.coach_id   as assigned_coach_id,
      cp.full_name  as assigned_coach_name,
      cp.role       as assigned_coach_role,
      sca.coach_id  as site_coach_id,
      scp.full_name as site_coach_name,

      (select count(*) from public.coach_assignments cax
        where cax.coach_id = p.id)::int as b2b_clients,
      (select count(*) from public.site_coach_assignments scax
        where scax.coach_id = p.id)::int as site_members,

      (ca.coach_id is not null and cp.role = 'coach')            as _has_b2b_coach,

      (bs.status = 'active' and bs.end_date >  now())                          as _is_active,
      (bs.status = 'active' and bs.end_date >  now()
        and bs.end_date < now() + interval '14 days')                          as _is_expiring,
      (bs.tier is not null and (bs.status <> 'active'
        or bs.end_date <= now()))                                              as _is_expired,
      (bs.tier is null)                                                        as _no_plan,
      exists (select 1 from public.subscription_requests sr
        where sr.user_id = p.id and sr.status = 'pending')                     as _pending
    from public.profiles p
    left join lateral (
      select s.tier, s.status, s.end_date, s.months
      from public.subscriptions s
      where s.client_id = p.id
      order by
        coalesce(s.status = 'active' and s.end_date > now(), false) desc,
        case s.tier when 'pro' then 3 when 'premium' then 2 when 'coaching' then 1 else 0 end desc,
        s.created_at desc
      limit 1
    ) bs on true
    left join public.coach_assignments ca on ca.client_id = p.id
    left join public.profiles cp on cp.id = ca.coach_id
    left join public.site_coach_assignments sca on sca.client_id = p.id
    left join public.profiles scp on scp.id = sca.coach_id
  )
  select
    b.client_id, b.client_email, b.client_full_name, b.client_phone,
    b.client_avatar_url, b.client_created_at,
    b.role, b.coach_kind, b.is_test_account,
    b.sub_tier, b.sub_status, b.sub_end_date, b.sub_months,
    b.pending_payments,
    b.assigned_coach_id, b.assigned_coach_name, b.assigned_coach_role,
    b.site_coach_id, b.site_coach_name,
    b.b2b_clients, b.site_members,
    count(*) over () as total_count
  from base b
  where
    public.is_admin()
    and case coalesce(p_filter, 'all')
      when 'active'           then b._is_active
      when 'expiring'         then b._is_expiring
      when 'expired'          then b._is_expired
      when 'no_plan'          then b._no_plan
      when 'pending_payment'  then b._pending
      when 'premium'          then b.sub_tier = 'premium'
      when 'pro'              then b.sub_tier = 'pro'
      when 'coaching'         then b.sub_tier = 'coaching'
      else true
    end
    and case coalesce(p_type, 'all')
      when 'member_site'     then b.role = 'client' and not b._has_b2b_coach
      when 'client_of_coach' then b.role = 'client' and b._has_b2b_coach
      when 'coach'           then b.role = 'coach'
      when 'coach_site'      then b.role = 'coach' and b.coach_kind = 'site'
      when 'coach_b2b'       then b.role = 'coach' and b.coach_kind = 'b2b'
      when 'admin'           then b.role = 'admin'
      else true
    end
    and case coalesce(p_test, 'all')
      when 'test' then coalesce(b.is_test_account, false)
      when 'real' then not coalesce(b.is_test_account, false)
      else true
    end
    and (
      nullif(btrim(coalesce(p_search, '')), '') is null
      or b.client_full_name ilike '%' || btrim(p_search) || '%'
      or b.client_email     ilike '%' || btrim(p_search) || '%'
      or b.client_phone     ilike '%' || btrim(p_search) || '%'
    )
  order by
    case coalesce(p_sort, 'newest')
      when 'oldest' then b.client_created_at end asc nulls last,
    case coalesce(p_sort, 'newest')
      when 'newest' then b.client_created_at end desc nulls last,
    case coalesce(p_sort, 'newest')
      when 'name' then lower(coalesce(b.client_full_name, b.client_email, '')) end asc nulls last,
    case coalesce(p_sort, 'newest')
      when 'expiry' then b.sub_end_date end asc nulls last,
    b.client_created_at desc,
    b.client_id desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

grant execute on function public.get_admin_clients_paged(int, int, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------
-- 5) get_admin_clients_stats (0068 body + the active-first key)
-- ---------------------------------------------------------------
create or replace function public.get_admin_clients_stats()
returns table (
  total           bigint,
  member_site     bigint,
  client_of_coach bigint,
  coach_site      bigint,
  coach_b2b       bigint,
  admin_count     bigint,
  test_count      bigint,
  active          bigint,
  expiring        bigint,
  expired         bigint,
  pending_payment bigint
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      p.role,
      coalesce(p.coach_kind, 'b2b') as coach_kind,
      coalesce(p.is_test_account, false) as is_test_account,
      (ca.coach_id is not null and cp.role = 'coach') as _has_b2b_coach,
      bs.tier,
      (bs.status = 'active' and bs.end_date > now())                          as _is_active,
      (bs.status = 'active' and bs.end_date > now()
        and bs.end_date < now() + interval '14 days')                         as _is_expiring,
      (bs.tier is not null and (bs.status <> 'active'
        or bs.end_date <= now()))                                             as _is_expired,
      exists (select 1 from public.subscription_requests sr
        where sr.user_id = p.id and sr.status = 'pending')                    as _pending
    from public.profiles p
    left join lateral (
      select s.tier, s.status, s.end_date
      from public.subscriptions s
      where s.client_id = p.id
      order by
        coalesce(s.status = 'active' and s.end_date > now(), false) desc,
        case s.tier when 'pro' then 3 when 'premium' then 2 when 'coaching' then 1 else 0 end desc,
        s.created_at desc
      limit 1
    ) bs on true
    left join public.coach_assignments ca on ca.client_id = p.id
    left join public.profiles cp on cp.id = ca.coach_id
    where public.is_admin()
  )
  select
    count(*),
    count(*) filter (where role = 'client' and not _has_b2b_coach),
    count(*) filter (where role = 'client' and _has_b2b_coach),
    count(*) filter (where role = 'coach' and coach_kind = 'site'),
    count(*) filter (where role = 'coach' and coach_kind = 'b2b'),
    count(*) filter (where role = 'admin'),
    count(*) filter (where is_test_account),
    count(*) filter (where _is_active),
    count(*) filter (where _is_expiring),
    count(*) filter (where _is_expired),
    count(*) filter (where _pending)
  from base
$$;

grant execute on function public.get_admin_clients_stats() to authenticated;

notify pgrst, 'reload schema';

-- ============================================================
-- VERIFY — one grid, all five surfaces (expect ALL true)
-- ============================================================
select
  (select count(*) from pg_catalog.pg_proc
    where proname = 'get_coach_client_list_paged'
      and pg_get_functiondef(oid) like '%coalesce(s.status = ''active'' and s.end_date > now(), false) desc%')
    as paged_active_first,
  (select count(*) from pg_catalog.pg_proc
    where proname = 'get_coach_client_stats'
      and pg_get_functiondef(oid) like '%coalesce(s.status = ''active'' and s.end_date > now(), false) desc%')
    as stats_active_first,
  (select count(*) from pg_catalog.pg_proc
    where proname = 'get_coach_client_list'
      and pg_get_functiondef(oid) like '%coalesce(s.status = ''active'' and s.end_date > now(), false) desc%')
    as legacy_active_first,
  (select count(*) from pg_catalog.pg_proc
    where proname = 'get_admin_clients_paged'
      and pg_get_functiondef(oid) like '%coalesce(s.status = ''active'' and s.end_date > now(), false) desc%')
    as admin_paged_active_first,
  (select count(*) from pg_catalog.pg_proc
    where proname = 'get_admin_clients_stats'
      and pg_get_functiondef(oid) like '%coalesce(s.status = ''active'' and s.end_date > now(), false) desc%')
    as admin_stats_active_first;

-- END OF SCRIPT 0102
