-- ============================================================================
-- 20261116090000_0113_generation_pipelines_p1_clean_stack_guard.sql
-- 0113 — GENERATION-PIPELINES P1 CLEAN-STACK GUARD (follow-up to 0112; owner
--        order 2026-11-15 «تنفيذ جميع بنود المرحلة P1 الواردة في التقرير
--        بالكامل» — تدقيق محركات التوليد docs/AI-GENERATION-PIPELINES-AUDIT-
--        2026-11-15.md)
-- ============================================================================
-- WHY (the 2c8b1f48 CI evidence — the exact 0108→0109 / 0110→0111 precedent
--      class, verbatim):
--   The DB-migrate validate job ran the migration chain on the throwaway
--   LOCAL Supabase stack and 0112 FAILED as a NEW (hard-gated) file:
--     ERROR: relation "public.plans" does not exist
--   Root cause: on a clean stack the BASELINE file 0001 (the ONLY file that
--   creates plans) fails in its single transaction — its own creation list
--   starts with public.profiles (FK target of plans.client_id), which the
--   manual-era bootstrap family cannot create there (the documented «the
--   legacy chain cannot bootstrap a fresh database» reality,
--   docs/DB-MIGRATION-PIPELINE-2026-10-27.md §4) — so the whole file rolls
--   back with it, plans stays absent, 0101's prune inherits the absence as
--   tolerated baseline drift, and 0112's unguarded
--   `alter table public.plans add column job_id` dies at parse time.
--   0112 itself is IMMUTABLE (the no-edit law): applied and probe-verified
--   on PRODUCTION by the 2c8b1f48 deploy's migrate job — 16/16 registered
--   probes green (plans.job_id present · blog_generation_queue.resume_count
--   present) and recipes.sat_fat_coverage verified live (default 'none').
--   (The 2c8b1f48 migration-state-audit red is the documented RACE — it
--   probed production ~3 minutes BEFORE the deploy's migrate job applied
--   0112; the same commit's deploy logs carry the post-apply verdict
--   APPLIED. The gate is probe-driven and turns green on the next run.)
--
-- WHAT THIS FILE DOES (additive + idempotent — the 0109/0111 correction
--      pattern):
--   1. Re-asserts public.plans in its MEASURED production shape (0001's
--      creation + the manual-era draft/approval workflow columns
--      status/is_current/approved_at + 0112's job_id) via
--      `create table if not exists`. On production: a verified no-op (the
--      table has existed since 0001). On a clean stack: the table EXISTS
--      before 0112's statements re-assert, so the chain is self-sufficient
--      from here on.
--      - FK to profiles OMITTED (0111 precedent: plan_swaps.user_id carries
--        none either) — profiles cannot bootstrap on a clean stack, and on
--        production this CREATE never runs.
--      - `type` as text + CHECK instead of the plan_type enum (0109
--        precedent: the enum lives in 0001's rolled-back transaction; a
--        clean stack never gets it. Production keeps its enum — no-op).
--   2. Re-asserts 0112's body VERBATIM (all three ADD COLUMN IF NOT EXISTS
--      + the partial unique index) — on production a no-op (0112 applied +
--      state-gate-probed); on a clean stack it lands the INF-13 one-row-
--      per-job key + the ART-2 resume counter + the REC-8 sat-fat coverage
--      law.
--   3. Re-asserts plans' RLS posture — the 2026-09-01 restore law
--      (20260901120000_restore_rls_after_incident_and_drop_probe.sql, the
--      LAST authority on plans policies: 0030B select/update/delete + 0041
--      paid insert) with drop+create INSIDE the same guarded DO block per
--      policy (the 0105 pg_proc law): a clean stack (no is_coach_over /
--      is_admin / subscriptions) skips the whole block with an honest
--      NOTICE — RLS stays ENABLED with zero policies = deny-all for
--      anon/authenticated; production re-asserts its exact current posture
--      atomically (each file runs in one transaction).
--
-- No data is modified or removed. Idempotent: safe to re-run (IF NOT EXISTS
-- / drop-if-exists inside guarded DO blocks). Applied by the repo-owned
-- pipeline (deploy-aws.yml migrate job).
-- ============================================================================

-- ============================================================
-- 1) plans — the full MEASURED production shape
--    (0001 + manual-era status/is_current/approved_at + 0112 job_id)
-- ============================================================
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  -- FK to public.profiles omitted (0111 precedent): profiles cannot
  -- bootstrap on a clean stack; on production this CREATE never runs.
  client_id   uuid not null,
  -- plan_type enum → text + CHECK (0109 precedent: the enum cannot
  -- bootstrap on a clean stack either; production keeps its enum).
  type        text not null check (type in ('meal', 'workout')),
  title       text not null,
  notes       text,
  file_url    text,
  content     jsonb,
  -- the manual-era draft/approval workflow columns (types.ts mirror —
  -- the ACCEPTED_PHANTOM_COLS baseline line pruned in this same commit).
  status      text,
  is_current  boolean,
  approved_at timestamptz,
  created_at  timestamptz not null default now(),
  -- 0112 (INF-13): the claiming ai_jobs row's id — one plans row per job.
  job_id      uuid
);

-- ============================================================
-- 2) 0112's body, VERBATIM re-assertion (no-op where 0112 applied)
-- ============================================================

-- 1) plans.job_id — the INF-13 idempotency key.
alter table public.plans
  add column if not exists job_id uuid;

-- One plans row per job (NULLs never collide — legacy rows stay as-is).
create unique index if not exists plans_job_id_key
  on public.plans (job_id)
  where job_id is not null;

-- 2) blog_generation_queue.resume_count — the ART-2 resume cap counter.
alter table public.blog_generation_queue
  add column if not exists resume_count int not null default 0;

-- 3) recipes.sat_fat_coverage — REC-8 (audit P1): the SAME coverage law
--    sodium_coverage already carries, for saturated fat (a partial sum
--    used to display as a confident total).
alter table public.recipes
  add column if not exists sat_fat_coverage text not null default 'none'
  check (sat_fat_coverage in ('none','partial','complete'));

-- ============================================================
-- 3) plans' RLS posture — the 2026-09-01 restore law, guarded
--    (drop + create inside the SAME guarded DO block per policy, so a
--    clean stack skips both halves together — nothing is ever dropped
--    without being re-created in the same transaction)
-- ============================================================
alter table public.plans enable row level security;

-- owner-or-coach SELECT (needs is_coach_over — 0105 pg_proc guard)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_coach_over'
  ) then
    execute $sql$drop policy if exists plans_owner_or_coach on public.plans$sql$;
    execute $sql$
      create policy plans_owner_or_coach
        on public.plans for select
        using (auth.uid() = client_id or public.is_coach_over(client_id))
    $sql$;
  else
    raise notice 'plans_owner_or_coach skipped: public.is_coach_over does not exist (clean stack — the 2026-09-01 law re-asserts where the chain creates it)';
  end if;
end $$;

-- coach + paid-subscription INSERT (needs is_coach_over + is_admin +
-- subscriptions — all three guarded; 0041 REV 4 body verbatim)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_coach_over'
  ) and exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'subscriptions'
  ) then
    execute $sql$drop policy if exists plans_insert_coach on public.plans$sql$;
    execute $sql$
      create policy plans_insert_coach
        on public.plans for insert
        with check (
          public.is_coach_over(client_id)
          and (
            public.is_admin()
            or exists (
              select 1 from public.subscriptions s
              -- 0041 REV 4: outer ref MUST be qualified as plans.client_id.
              where s.client_id = plans.client_id
                and s.tier = 'coaching'
                and s.status = 'active'
                and (s.end_date is null or s.end_date > now())
            )
          )
        )
    $sql$;
  else
    raise notice 'plans_insert_coach skipped: clean stack (is_coach_over/is_admin/subscriptions absent) — the 2026-09-01 law re-asserts where the chain creates them';
  end if;
end $$;

-- coach UPDATE (needs is_coach_over)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_coach_over'
  ) then
    execute $sql$drop policy if exists plans_update_coach on public.plans$sql$;
    execute $sql$
      create policy plans_update_coach
        on public.plans for update
        using (public.is_coach_over(client_id))
    $sql$;
  else
    raise notice 'plans_update_coach skipped: public.is_coach_over does not exist (clean stack — the 2026-09-01 law re-asserts where the chain creates it)';
  end if;
end $$;

-- coach DELETE (needs is_coach_over)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_coach_over'
  ) then
    execute $sql$drop policy if exists plans_delete_coach on public.plans$sql$;
    execute $sql$
      create policy plans_delete_coach
        on public.plans for delete
        using (public.is_coach_over(client_id))
    $sql$;
  else
    raise notice 'plans_delete_coach skipped: public.is_coach_over does not exist (clean stack — the 2026-09-01 law re-asserts where the chain creates it)';
  end if;
end $$;

-- Verification probes: scripts/db/migration_probes.py (0113 row).
