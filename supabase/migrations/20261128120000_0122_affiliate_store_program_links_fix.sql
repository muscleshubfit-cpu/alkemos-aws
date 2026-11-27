-- ============================================================================
-- 20261128120000_0122_affiliate_store_program_links_fix.sql
-- 0122 — AFFILIATE-STORE-PROGRAM-LINKS-FIX (audit 530 §6 item 1 — owner
--        order 2026-11-28 «نفّذ البند الأول من خطة التدقيق في الملف
--        docs/archive/AFFILIATE-STORE-COMPREHENSIVE-AUDIT-530-2026-11-27.md»):
--        the seven EN program pages get a LIVE "Gear for this program" rail.
-- ============================================================================
-- WHAT THIS FILE DOES (data-only + idempotent — the 0096/0101 patterns;
-- schema untouched — types.ts unaffected by law):
--   1. THE KEY RE-MAP (audit 530 §3.2-1 — the root cause): the founding
--      batches (0116/0119) seeded ABBREVIATED program keys that match NO
--      real program slug (measured live distribution: gym-strength 21 ·
--      home-workout 13 · hiit 3 · home-dumbbell 2 · home-core 1 = 40 rows)
--      so ALL SEVEN program pages rendered ZERO rail. The mapping below is
--      DOCUMENTED EVIDENCE, not guesswork — each abbreviated key is the
--      program's own image-file basename in src/lib/workout-programs.ts:
--        IMAGES.homeBodyweight = /images/programs/home-workout.webp
--          <-> slug home-beginner-fullbody
--        IMAGES.fatLoss       = /images/programs/hiit.webp
--          <-> slug home-fat-loss-hiit
--        IMAGES.absCore      = /images/programs/home-core.webp
--          <-> slug home-core-specialization
--        IMAGES.homeDumbbell = /images/programs/home-dumbbell.webp
--          <-> slug home-dumbbell-ppl
--        IMAGES.gymStrength  = /images/programs/gym-strength.webp
--          <-> slug gym-strength-5x5
--      (the same mapping pinned by audit 530 §6 item 1 and discovered by
--      the 526 frame report §surface-keys).
--   2. THE TWO EMPTY GYM PROGRAMS (audit success criterion: 7/7 program
--      pages show a live rail): gym-beginner-fullbody and
--      gym-ppl-intermediate held ZERO bindings even under the old keys —
--      four genuinely relevant PUBLISHED, shelf-qualified products are
--      bound to each (per-row rationale at each insert; the multi-binding
--      precedent is the existing data — journal/socks are bound to more
--      than one program today). All eight slugs verified live in the
--      public sitemap BEFORE this file shipped (shelf law: image + ASIN).
--   3. ZERO product rows / ZERO category rows / ZERO schema / ZERO prices /
--      ZERO stored tagged links (the purchase link builds from ASIN + env
--      tag at render time — the 529-أر law). Only
--      affiliate_store_product_links surface keys are touched.
--
-- Applied by the repo-owned pipeline (deploy-aws.yml migrate job — BEFORE
-- the code goes live, so the build's SSG prerender bakes the rail into the
-- static HTML of all seven program pages).
-- Verification probes: scripts/db/migration_probes.py (0122 row).
-- Canaries: src/lib/__tests__/affiliate-store-program-links.test.ts.
-- ============================================================================

-- ============================================================
-- 1) the key re-map: five abbreviated keys -> the five real slugs
--    (UPDATE is idempotent: a re-run matches zero rows; no rows exist
--    under the real-slug keys today — audit 530 measured all 40 program
--    rows living under the five abbreviated keys — so no unique clash)
-- ============================================================
update public.affiliate_store_product_links
set surface_key = 'gym-strength-5x5'
where surface_type = 'program'
  and surface_key = 'gym-strength';

update public.affiliate_store_product_links
set surface_key = 'home-beginner-fullbody'
where surface_type = 'program'
  and surface_key = 'home-workout';

update public.affiliate_store_product_links
set surface_key = 'home-fat-loss-hiit'
where surface_type = 'program'
  and surface_key = 'hiit';

update public.affiliate_store_product_links
set surface_key = 'home-dumbbell-ppl'
where surface_type = 'program'
  and surface_key = 'home-dumbbell';

update public.affiliate_store_product_links
set surface_key = 'home-core-specialization'
where surface_type = 'program'
  and surface_key = 'home-core';

-- ============================================================
-- 2) gym-beginner-fullbody (3-day/week gym full-body: bench press,
--    barbell squat, leg press, seated cable row, arnold press,
--    dumbbell curl, triceps pushdown — goal: foundational strength
--    AND muscle building): 4 relevant published products
-- ============================================================
-- nike-metcon-9-training-shoes — the lifting-first trainer ("the shoe
-- for gym days that include heavy barbells") for the program's
-- bench/squat sessions (already bound to gym-strength-5x5 — the
-- multi-binding precedent in the existing data).
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-beginner-fullbody' from public.affiliate_store_products p where p.slug = 'nike-metcon-9-training-shoes'
on conflict (product_id, surface_type, surface_key) do nothing;
-- hardcover-fitness-journal — the program's own methodology reads
-- "Record every session — the log IS the program" (workout-programs.ts);
-- the journal is bound to gym-strength-5x5 today (multi-binding precedent).
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-beginner-fullbody' from public.affiliate_store_products p where p.slug = 'hardcover-fitness-journal'
on conflict (product_id, surface_type, surface_key) do nothing;
-- under-armour-undeniable-duffle — the gym bag for a 3-day/week gym
-- program (gear transport to the gym; bound to gym-strength-5x5 today).
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-beginner-fullbody' from public.affiliate_store_products p where p.slug = 'under-armour-undeniable-duffle'
on conflict (product_id, surface_type, surface_key) do nothing;
-- optimum-nutrition-gold-standard-whey — protein for the program's
-- stated goal (foundational strength and muscle building); the
-- post-workout window per the product's own editorial content.
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-beginner-fullbody' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-gold-standard-whey'
on conflict (product_id, surface_type, surface_key) do nothing;

-- ============================================================
-- 3) gym-ppl-intermediate (6-day/week push-pull-legs hypertrophy:
--    bench 4x, pull-ups 4x, seated cable row 4x, squat 4x, curls,
--    deload every 6-8 weeks): 4 relevant published products
-- ============================================================
-- gymreapers-lifting-straps — "the grip insurance for heavy rows,
-- pulldowns, and shrugs" for the pull days' heaviest sets (bound to
-- gym-strength-5x5 today — multi-binding precedent).
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-ppl-intermediate' from public.affiliate_store_products p where p.slug = 'gymreapers-lifting-straps'
on conflict (product_id, surface_type, surface_key) do nothing;
-- optimum-nutrition-gold-standard-whey — the hypertrophy goal ("looking
-- to build muscle mass" per the program description): daily protein.
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-ppl-intermediate' from public.affiliate_store_products p where p.slug = 'optimum-nutrition-gold-standard-whey'
on conflict (product_id, surface_type, surface_key) do nothing;
-- nike-metcon-9-training-shoes — the stable platform under the heavy
-- bench/squat days of the split.
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-ppl-intermediate' from public.affiliate_store_products p where p.slug = 'nike-metcon-9-training-shoes'
on conflict (product_id, surface_type, surface_key) do nothing;
-- renpho-massage-gun — recovery for the 6-day volume; the program's own
-- guidance ("take one lighter week when sleep or joints complain").
insert into public.affiliate_store_product_links (product_id, surface_type, surface_key)
select p.id, 'program', 'gym-ppl-intermediate' from public.affiliate_store_products p where p.slug = 'renpho-massage-gun'
on conflict (product_id, surface_type, surface_key) do nothing;
