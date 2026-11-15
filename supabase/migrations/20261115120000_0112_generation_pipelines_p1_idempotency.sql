-- ============================================================================
-- 20261115120000_0112_generation_pipelines_p1_idempotency.sql
-- 0112 — AI-GENERATION-PIPELINES P1 (audit 2026-11-15, owner execution
--        order «تنفيذ جميع بنود المرحلة P1»): two additive columns.
-- ============================================================================
-- WHY (the audit's measured findings, verbatim references):
--   * INF-13 [عالية-أثر]: the plan-draft materialization is NOT idempotent —
--     a processor SUCCESS followed by a finishJob failure requeues the job,
--     the re-run inserts a SECOND plans draft for the same member, and the
--     quota's UNIQUE job_ref protects billing only, not the row count.
--     → plans.job_id: the claiming ai_jobs row's id, stamped by the runner;
--       the materializer skips a row that already exists for the job.
--   * ART-2 [عالية]: the blog RESUME walk has no failure counter — a row
--     that deterministically fails at P5 (e.g. a defective outline) is
--     resumed by EVERY slot and backstop for the whole 144h window, each
--     time burning a full P2/P3/P4 budget (the documented slot-starvation
--     self-DoS).
--     → blog_generation_queue.resume_count: incremented on every failed
--       resume; findResumableRow excludes rows at the cap (≤2).
--
-- WHAT THIS FILE DOES (additive + idempotent — the 0109/0111 pattern):
--   1. plans.job_id uuid NULL + a partial unique index (one plans row per
--      job — the idempotency key) + a btree for the lookup.
--   2. blog_generation_queue.resume_count int NOT NULL DEFAULT 0.
--
-- No data is modified or removed. RLS postures untouched (both tables keep
-- their existing policies; the new columns carry no PII). Applied by the
-- repo-owned pipeline (deploy-aws.yml migrate job).
-- ============================================================================

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

-- Verification probes: scripts/db/migration_probes.py (0112 row).
