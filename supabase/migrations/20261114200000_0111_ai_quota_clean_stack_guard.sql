-- ============================================================================
-- 20261115090000_0111_ai_quota_clean_stack_guard.sql
-- 0111 — AI-QUOTA CLEAN-STACK GUARD (follow-up to 0110; owner order
--        2026-11-14 «إعادة هيكلة سياسة الذكاء الاصطناعي والاشتراكات والأرصدة»)
-- ============================================================================
-- WHY (the dd46903f CI evidence — the exact 0108/0109 precedent class):
--   The DB-migrate validate job ran the migration chain on the throwaway
--   LOCAL Supabase stack and 0110 FAILED as a NEW (hard-gated) file:
--     ERROR: relation "public.plan_swaps" does not exist
--   Root cause: on a clean stack the BASELINE file 0063 (which creates
--   plan_swaps) fails in its single transaction — it also alters other
--   drift tables that the manual-era bootstrap could not create there
--   (the documented «the legacy chain cannot bootstrap a fresh database»
--   reality, docs/DB-MIGRATION-PIPELINE-2026-10-27.md §4) — so its
--   `create table if not exists plan_swaps` rolls back with it, 0065/0103
--   inherit the absence, and 0110's unguarded `alter table public.plan_swaps`
--   dies at parse time. 0110 itself is IMMUTABLE: applied and probe-verified
--   on production by the dd46903f deploy.
--
-- WHAT THIS FILE DOES (additive + idempotent — the 0109 correction pattern):
--   1. Re-asserts the plan_swaps ledger in its MEASURED production shape
--      (0063's creation + 0103's live-schema reconciliation columns +
--      0110's job_ref): `create table if not exists` with the full column
--      set. On production: a verified no-op. On a clean stack: the table
--      EXISTS before 0110's statements re-assert, so the chain is
--      self-sufficient from here on.
--   2. Re-asserts 0110's body VERBATIM (both ADD COLUMN IF NOT EXISTS +
--      both partial unique indexes) — on production a no-op (0110 already
--      applied + state-gate-probed); on a clean stack it lands the
--      deduct-exactly-once columns.
--   3. Restores 0065's strict RLS posture idempotently (the same
--      tamper-proof ledger law): enable RLS + drop-any + member
--      select/insert own + coach read assigned + revoke UPDATE/DELETE —
--      guarded per the 0105 pg_proc law so a clean stack (no
--      coach_assignments yet) skips the policy that cannot parse there,
--      with an honest NOTICE.
--
-- Idempotent: safe to re-run (IF NOT EXISTS / drop-if-exists / guarded DO
-- blocks). No data is modified or removed. Applied by the repo-owned
-- pipeline (deploy-aws.yml migrate job).
-- ============================================================================

-- ============================================================
-- 1) plan_swaps — the full MEASURED production shape (0063 + 0103 + 0110)
-- ============================================================
create table if not exists public.plan_swaps (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  plan_id    uuid,
  -- 0103 live-schema reconciliation (NOT NULL on production since birth).
  plan_type  text not null,
  swap_type  text not null,
  day_index  integer,
  item_index integer,
  old_item   jsonb,
  new_item   jsonb,
  reason     text,
  -- 0110: the UNIQUE-per-job column (deduct exactly once).
  job_ref    uuid,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2) 0110's body, VERBATIM re-assertion (no-op where 0110 applied)
-- ============================================================
alter table public.ai_plan_usage
  add column if not exists job_ref uuid;

create unique index if not exists ai_plan_usage_job_ref_uidx
  on public.ai_plan_usage (job_ref)
  where job_ref is not null;

alter table public.plan_swaps
  add column if not exists job_ref uuid;

create unique index if not exists plan_swaps_job_ref_uidx
  on public.plan_swaps (job_ref)
  where job_ref is not null;

-- ============================================================
-- 3) 0065's strict RLS posture, idempotent + clean-stack guarded
-- ============================================================
alter table public.plan_swaps enable row level security;

-- Drop ANY existing policy (deterministic end-state — 0065 PART A).
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'plan_swaps'
  loop
    execute format('drop policy if exists %I on public.plan_swaps', r.policyname);
  end loop;
end $$;

create policy plan_swaps_select_own on public.plan_swaps
  for select to authenticated
  using (auth.uid() = user_id);

create policy plan_swaps_insert_own on public.plan_swaps
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Coach read on assigned clients — behind the 0105 pg_proc guard: on a
-- clean test stack coach_assignments does not exist yet (the baseline
-- 0030A family cannot bootstrap there), so the policy is SKIPPED with
-- an honest NOTICE; on production it re-asserts 0065 verbatim.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'coach_assignments'
  ) then
    execute $sql$
      create policy plan_swaps_select_assigned_coach on public.plan_swaps
        for select to authenticated
        using (
          exists (
            select 1 from public.coach_assignments ca
            where ca.client_id = plan_swaps.user_id
              and ca.coach_id = auth.uid()
          )
        );
    $sql$;
  else
    raise notice 'plan_swaps_select_assigned_coach skipped: public.coach_assignments does not exist (clean stack — 0065 law re-asserts when the chain creates it)';
  end if;
end $$;

-- Immutability belt-and-braces (0065 PART D): no UPDATE/DELETE policy
-- exists (RLS already blocks both) and the table-level grants are revoked
-- from anon+authenticated so accidental attempts fail LOUDLY.
revoke update, delete on public.plan_swaps from anon, authenticated;
