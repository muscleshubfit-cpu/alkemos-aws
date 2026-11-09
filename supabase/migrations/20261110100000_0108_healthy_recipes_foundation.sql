-- ============================================================================
-- 20261110100000_0108_healthy_recipes_foundation.sql
-- 0108 — HEALTHY-RECIPES-FOUNDATION (owner order 2026-11-10 «Alkemos
--        Healthy Recipes – Full Implementation»)
-- ============================================================================
-- WHY (docs/healthy-recipes-platform/IMPLEMENTATION-PLAN.md §3 — P1):
--   The daily bilingual healthy-recipes system needs its data foundation:
--   ONE pair record (recipes) carrying the shared truth (ingredients,
--   grams, servings, image, computed nutrition), TWO editorial versions
--   (recipe_versions ar/en — independent authoring, never a translation),
--   a verified nutrient reference (nutrient_reference — the audit's gap
--   #1/#2: sodium/saturated-fat/source-id existed NOWHERE in foods.ts),
--   a production queue (recipe_generation_queue — the blog_generation_queue
--   pattern with the STRONGER atomic-pair contract), and authed-only
--   favorites (recipe_favorites).
--
-- OWNER CORRECTIONS APPLIED (order §2 «تصحيح مواصفات البيانات الغذائية»):
--   * Mandatory nutrition fields = ingredients+grams, calories, protein,
--     carbs, fat, fiber, servings + weight/serving (order §2 list).
--   * sodium_mg / sat_fat_g are OPTIONAL enrichment columns (NULL allowed
--     when no reliable datum exists — «لا تختلق قيم»). No gate blocks on
--     them; DASH evaluation simply skips when sodium coverage is partial.
--
-- WHAT THIS FILE DOES (additive only):
--   1. Six tables: nutrient_reference (seeded), recipes, recipe_versions,
--      recipe_ingredients, recipe_generation_queue, recipe_favorites.
--   2. Atomic pair publish/unpublish RPCs (SECURITY DEFINER, fixed
--      search_path) — «ممنوع نشر نسخة منفردة» enforced IN THE DATABASE,
--      stronger than the blog's tolerant degradation.
--   3. RLS on every table: public read of published pairs only, admin
--      writes via the canonical public.is_admin() (0029B), favorites
--      owner-only CRUD, queue service-role-only (no public policies).
--   4. Daily-uniqueness partial unique index (one published/in-production
--      pair per scheduled day — the «عدم تكرار النشر اليومي» backstop).
--   5. Seed: ~150 curated nutrient_reference rows covering the project's
--      six target cuisines (see seed header for sourcing honesty).
--
-- WHAT IT DELIBERATELY DOES NOT DO:
--   - No changes to blog_posts / foods / any existing table or policy.
--   - No recipe_images table (future expansion — plan §7-6, separate order).
--   - No sodium/sat_fat fabrication: seed leaves them NULL unless the
--     published USDA datum is known.
--
-- Idempotent: safe to re-run (IF NOT EXISTS + ON CONFLICT DO NOTHING).
-- Applied by the repo-owned pipeline (deploy-aws.yml migrate job).
-- ============================================================================

-- ============================================================
-- 1) nutrient_reference — the verified nutrient source (ق1)
-- ============================================================
create table if not exists public.nutrient_reference (
  slug           text primary key,
  name_en        text not null,
  name_ar        text not null,
  category       text not null default 'other'
    check (category in ('oil','dairy','egg','poultry','meat','fish','legume','grain','bread','vegetable','fruit','nut','sauce','spice','sweetener','other')),
  per100g        jsonb not null,   -- {calories, protein_g, carbs_g, fat_g, fiber_g, sat_fat_g?, sodium_mg?, sugar_g?}
  fdc_id         text,             -- USDA FoodData Central id where identifiable (NULL = curated entry, never fabricated)
  source_name    text not null default 'USDA FDC',
  source_version text not null default 'curated-seed-2026-11',
  yield_cooked_g numeric,          -- grams of cooked output per 100 g raw/dry input (NULL = no shrink/swell or n/a)
  flags          text[] not null default '{}',  -- meat|fish|shellfish|dairy|egg|honey|gluten|soy|plant|vegetable|fruit|grain|legume|nut|seed|oil|salt|alcohol|organ|red-meat|poultry
  verified_at    timestamptz not null default now()
);

alter table public.nutrient_reference enable row level security;

-- Public read (the whole reference is public knowledge — transparency of
-- the nutrition methodology page requires it).
drop policy if exists nutrient_reference_public_read on public.nutrient_reference;
create policy nutrient_reference_public_read
  on public.nutrient_reference for select
  to anon, authenticated
  using (true);

-- Admin-only writes.
drop policy if exists nutrient_reference_admin_write on public.nutrient_reference;
create policy nutrient_reference_admin_write
  on public.nutrient_reference for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists nutrient_reference_admin_update on public.nutrient_reference;
create policy nutrient_reference_admin_update
  on public.nutrient_reference for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 2) recipes — the PAIR master record (shared truth)
-- ============================================================
create table if not exists public.recipes (
  id               uuid primary key default gen_random_uuid(),
  pair_slug        text not null,                    -- shared latin slug of the pair
  status           text not null default 'draft'
    check (status in ('draft','in_production','verified','published','held','failed','unpublished')),
  scheduled_for    date,                             -- target publish day (daily-dup guard)
  servings         int  not null check (servings between 1 and 12),
  serving_weight_g numeric not null check (serving_weight_g > 0),
  prep_minutes     int  not null default 0 check (prep_minutes between 0 and 600),
  cook_minutes     int  not null default 0 check (cook_minutes between 0 and 600),
  -- The image lives on the PAIR record ONLY => same file for both language
  -- versions BY CONSTRUCTION (owner requirement «نفس الصورة للنسختين»).
  image_url        text,
  image_alt_ar     text,
  image_alt_en     text,
  image_source     text check (image_source in ('pexels','unsplash','pixabay','approved_bank')),
  image_verified   boolean not null default false,   -- visual-match gate result
  -- Computed nutrition (written by the R2 computation layer ONLY — never AI):
  nutrition_total     jsonb not null default '{}',   -- {calories, protein_g, carbs_g, fat_g, fiber_g, sat_fat_g?, sodium_mg?}
  nutrition_per_serving jsonb not null default '{}',
  nutrition_sources   jsonb not null default '[]',   -- [{ingredient, ref_slug, fdc_id, source, version}]
  calories_kcal_consistency jsonb,                   -- 4/4/9 kcal consistency check record
  sodium_coverage    text not null default 'none' check (sodium_coverage in ('none','partial','complete')),
  -- Taxonomy (diets written by the rules engine ONLY — D-GATE-1):
  cuisines   text[] not null default '{}',   -- egyptian|gulf|arab|mediterranean|asian|international
  goals      text[] not null default '{}',   -- weight-loss|muscle-gain|weight-gain|maintenance|sports-nutrition|high-protein
  diets      text[] not null default '{}',   -- keto|low-carb|high-protein|mediterranean|vegetarian|vegan|pescatarian|dash|gluten-free|dairy-free
  meal_types text[] not null default '{}',   -- breakfast|lunch|dinner|snack|healthy-dessert|drink|pre-workout|post-workout
  budget_tier text check (budget_tier in ('low','medium','high')),
  verification        jsonb not null default '{}',   -- full gate report with timestamps
  verification_status text not null default 'pending' check (verification_status in ('pending','passed','failed')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists recipes_pair_slug_uidx on public.recipes (pair_slug);
create index if not exists recipes_status_published_idx on public.recipes (status, published_at desc);
create index if not exists recipes_diets_idx on public.recipes using gin (diets);
create index if not exists recipes_filters_idx on public.recipes using gin (cuisines, goals, meal_types);
-- «زوج واحد منشور/قيد التنفيذ لكل يوم مجدول» — structural daily-dup guard.
create unique index if not exists recipes_one_per_day_uidx on public.recipes (scheduled_for)
  where status in ('in_production','verified','published');

alter table public.recipes enable row level security;

-- Public read: published pairs only.
drop policy if exists recipes_public_read on public.recipes;
create policy recipes_public_read
  on public.recipes for select
  to anon, authenticated
  using (status = 'published');

-- Admin writes (service role bypasses RLS by construction).
drop policy if exists recipes_admin_insert on public.recipes;
create policy recipes_admin_insert
  on public.recipes for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists recipes_admin_update on public.recipes;
create policy recipes_admin_update
  on public.recipes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists recipes_admin_delete on public.recipes;
create policy recipes_admin_delete
  on public.recipes for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- 3) recipe_versions — the two editorial languages
-- ============================================================
create table if not exists public.recipe_versions (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references public.recipes (id) on delete cascade,
  language    text not null check (language in ('ar','en')),
  title       text not null,
  slug        text not null,
  excerpt     text not null,
  steps       jsonb not null default '[]',     -- [{position, text}] in the version language
  tips        text,
  storage_info text,
  substitutions jsonb not null default '[]',  -- [{from, to, note}] — numbers verified by N-GATE-4
  meta_title  text,
  meta_description text,
  faq_json    jsonb,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (recipe_id, language),   -- the pair is MANDATORY: exactly two rows
  unique (slug, language)
);

create index if not exists recipe_versions_published_idx
  on public.recipe_versions (language, is_published, published_at desc);

alter table public.recipe_versions enable row level security;

drop policy if exists recipe_versions_public_read on public.recipe_versions;
create policy recipe_versions_public_read
  on public.recipe_versions for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists recipe_versions_admin_insert on public.recipe_versions;
create policy recipe_versions_admin_insert
  on public.recipe_versions for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists recipe_versions_admin_update on public.recipe_versions;
create policy recipe_versions_admin_update
  on public.recipe_versions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists recipe_versions_admin_delete on public.recipe_versions;
create policy recipe_versions_admin_delete
  on public.recipe_versions for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- 4) recipe_ingredients — shared by BOTH language versions
-- ============================================================
create table if not exists public.recipe_ingredients (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references public.recipes (id) on delete cascade,
  position      int not null,
  amount_g      numeric not null check (amount_g > 0),  -- grams MANDATORY (owner §7)
  weight_state  text not null default 'raw' check (weight_state in ('raw','cooked')),
  name_ar       text not null,
  name_en       text not null,
  nutrient_ref_slug text not null references public.nutrient_reference (slug),
  is_optional   boolean not null default false,
  note_ar       text,
  note_en       text
);

create index if not exists recipe_ingredients_recipe_idx
  on public.recipe_ingredients (recipe_id, position);

alter table public.recipe_ingredients enable row level security;

drop policy if exists recipe_ingredients_public_read on public.recipe_ingredients;
create policy recipe_ingredients_public_read
  on public.recipe_ingredients for select
  to anon, authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.status = 'published'));

drop policy if exists recipe_ingredients_admin_insert on public.recipe_ingredients;
create policy recipe_ingredients_admin_insert
  on public.recipe_ingredients for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists recipe_ingredients_admin_update on public.recipe_ingredients;
create policy recipe_ingredients_admin_update
  on public.recipe_ingredients for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists recipe_ingredients_admin_delete on public.recipe_ingredients;
create policy recipe_ingredients_admin_delete
  on public.recipe_ingredients for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- 5) recipe_generation_queue — the production queue
-- ============================================================
create table if not exists public.recipe_generation_queue (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    uuid references public.recipes (id) on delete set null,
  status       text not null default 'idea'
    check (status in ('idea','structured','nutrition_verified','authored','imaged','gates_passed','published','held','failed')),
  idea         jsonb not null default '{}',  -- {themeEn, themeAr, cuisine, goal, mealType, brief} — the sealed shared brief
  bundle       jsonb not null default '{}',  -- stage outputs (structure JSON, computed nutrition, drafts, image, gate report)
  error_message text,
  rerun_target text,
  repair_cycles int not null default 0,
  scheduled_for date not null,
  created_at   timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists recipe_queue_status_idx
  on public.recipe_generation_queue (status, created_at);
create index if not exists recipe_queue_day_idx
  on public.recipe_generation_queue (scheduled_for);

alter table public.recipe_generation_queue enable row level security;
-- No public policies AT ALL — service role only (the blog_generation_queue
-- pattern: the queue carries pre-publication content and internal state).

-- ============================================================
-- 6) recipe_favorites — authed users only (ق6)
-- ============================================================
create table if not exists public.recipe_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

alter table public.recipe_favorites enable row level security;

drop policy if exists recipe_favorites_owner_all on public.recipe_favorites;
create policy recipe_favorites_owner_all
  on public.recipe_favorites
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 7) Atomic pair publish / unpublish (ق2 — «زوج أو لا شيء»)
-- ============================================================
-- publish_recipe_pair: ONE transaction publishing BOTH versions together
-- or nothing at all. The blog's tolerant degradation is REJECTED here by
-- explicit owner requirement («ممنوع نشر نسخة منفردة»).
create or replace function public.publish_recipe_pair(p_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1) The pair is complete: exactly two versions, both authored.
  if (select count(*) from public.recipe_versions where recipe_id = p_recipe_id) <> 2 then
    raise exception 'PAIR_INCOMPLETE';
  end if;

  -- 2) The deterministic verification battery passed on the master record.
  if (select verification_status from public.recipes where id = p_recipe_id) <> 'passed' then
    raise exception 'VERIFICATION_NOT_PASSED';
  end if;

  -- 3) The image is verified on the master record (P-GATE-3 precondition).
  if not (select image_verified from public.recipes where id = p_recipe_id) then
    raise exception 'IMAGE_NOT_VERIFIED';
  end if;

  -- 4) Publish BOTH versions together — same statement set, same transaction.
  update public.recipes
     set status = 'published', published_at = now(), updated_at = now()
   where id = p_recipe_id;
  update public.recipe_versions
     set is_published = true, published_at = now(), updated_at = now()
   where recipe_id = p_recipe_id;
end;
$$;

-- unpublish_recipe_pair: hide BOTH versions together (owner §12 «إلغاء نشر
-- وصفة عند خطأ مؤثر») with the reason recorded on the master record.
create or replace function public.unpublish_recipe_pair(p_recipe_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.recipes
     set status = 'unpublished',
         verification = coalesce(verification, '{}'::jsonb)
           || jsonb_build_object('unpublishReason', p_reason, 'unpublishedAt', now()),
         updated_at = now()
   where id = p_recipe_id;
  update public.recipe_versions
     set is_published = false, updated_at = now()
   where recipe_id = p_recipe_id;
end;
$$;

-- ============================================================
-- 8) SEED — nutrient_reference (~150 curated rows)
-- ------------------------------------------------------------
-- SOURCING HONESTY (repo law: no fabricated references):
--   * per100g values are the widely published USDA FoodData Central
--     (SR Legacy / Foundation) per-100g figures for the named food state.
--   * fdc_id is attached ONLY where the identifier is well-established;
--     rows without a confident id carry fdc_id NULL + source_name
--     'USDA FDC (curated)' — ids are NEVER guessed.
--   * sodium_mg / sat_fat_g are filled only where the published datum is
--     well known (owner correction §2: optional enrichment, no invention).
--   * Region-specific items (molokhia, baladi bread, freekeh, labneh,
--     ghee, zaatar, date syrup, dried mint) use source_name
--     'Egyptian/Arab composition tables (curated)' — regional references.
--   * yield_cooked_g = grams of cooked output per 100 g raw/dry input
--     (USDA cooking yields; meat ~70-75, dry legumes ~210-230,
--     dry rice ~280-300, dry pasta ~240-250, rolled oats ~220).
-- ============================================================
insert into public.nutrient_reference (slug, name_en, name_ar, category, per100g, fdc_id, source_name, source_version, yield_cooked_g, flags) values
-- ── Oils & fats ──
('olive-oil','Olive oil','زيت الزيتون','oil','{"calories":884,"protein_g":0,"carbs_g":0,"fat_g":100,"fiber_g":0,"sat_fat_g":13.8,"sodium_mg":2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,oil}'),
('canola-oil','Canola oil','زيت الكانولا','oil','{"calories":884,"protein_g":0,"carbs_g":0,"fat_g":100,"fiber_g":0,"sat_fat_g":7.4,"sodium_mg":0}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,oil}'),
('sunflower-oil','Sunflower oil','زيت دوار الشمس','oil','{"calories":884,"protein_g":0,"carbs_g":0,"fat_g":100,"fiber_g":0,"sat_fat_g":10.3,"sodium_mg":0}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,oil}'),
('coconut-oil','Coconut oil','زيت جوز الهند','oil','{"calories":862,"protein_g":0,"carbs_g":0,"fat_g":100,"fiber_g":0,"sat_fat_g":82.5,"sodium_mg":0}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,oil}'),
('sesame-oil','Sesame oil','زيت السمسم','oil','{"calories":884,"protein_g":0,"carbs_g":0,"fat_g":100,"fiber_g":0,"sat_fat_g":14.2,"sodium_mg":0}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,oil}'),
('butter-salted','Butter (salted)','زبدة','oil','{"calories":717,"protein_g":0.9,"carbs_g":0.1,"fat_g":81.1,"fiber_g":0,"sat_fat_g":51.4,"sodium_mg":643}','01001','USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('ghee','Ghee (clarified butter)','سمنة','oil','{"calories":876,"protein_g":0.3,"carbs_g":0,"fat_g":99.5,"fiber_g":0,"sat_fat_g":61.9,"sodium_mg":4}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',NULL,'{dairy,animal}'),
-- ── Dairy & eggs ──
('milk-whole','Milk, whole','حليب كامل الدسم','dairy','{"calories":61,"protein_g":3.2,"carbs_g":4.8,"fat_g":3.3,"fiber_g":0,"sat_fat_g":1.9,"sodium_mg":43,"sugar_g":5.1}','01077','USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('milk-low-fat','Milk, 1% fat','حليب قليل الدسم','dairy','{"calories":42,"protein_g":3.4,"carbs_g":5,"fat_g":1,"fiber_g":0,"sat_fat_g":0.6,"sodium_mg":44,"sugar_g":5.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('yogurt-plain','Yogurt, plain whole','زبادي','dairy','{"calories":61,"protein_g":3.5,"carbs_g":4.7,"fat_g":3.3,"fiber_g":0,"sat_fat_g":2.1,"sodium_mg":46,"sugar_g":4.7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('greek-yogurt-nonfat','Greek yogurt, nonfat','زبادي يوناني خالي الدسم','dairy','{"calories":59,"protein_g":10.2,"carbs_g":3.6,"fat_g":0.4,"fiber_g":0,"sat_fat_g":0.1,"sodium_mg":36,"sugar_g":3.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('greek-yogurt-full','Greek yogurt, whole milk','زبادي يوناني كامل الدسم','dairy','{"calories":97,"protein_g":9,"carbs_g":3.9,"fat_g":5,"fiber_g":0,"sat_fat_g":3.3,"sodium_mg":35,"sugar_g":3.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('labneh','Labneh (strained yogurt)','لبنة','dairy','{"calories":152,"protein_g":8.5,"carbs_g":4,"fat_g":11.5,"fiber_g":0,"sat_fat_g":7.3}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',NULL,'{dairy,animal}'),
('feta','Feta cheese','جبنة فيتا','dairy','{"calories":264,"protein_g":14.2,"carbs_g":4.1,"fat_g":21.3,"fiber_g":0,"sat_fat_g":14.9,"sodium_mg":917,"sugar_g":4.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('halloumi','Halloumi cheese','جبنة حلوم','dairy','{"calories":346,"protein_g":23.5,"carbs_g":2,"fat_g":27,"fiber_g":0,"sat_fat_g":18}',NULL,'USDA FDC (curated)','curated-seed-2026-11',NULL,'{dairy,animal}'),
('mozzarella','Mozzarella, whole milk','جبنة موزاريلا','dairy','{"calories":300,"protein_g":22.2,"carbs_g":2.2,"fat_g":22.4,"fiber_g":0,"sat_fat_g":13.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('cheddar','Cheddar cheese','جبنة شيدر','dairy','{"calories":403,"protein_g":24.9,"carbs_g":1.3,"fat_g":33.1,"fiber_g":0,"sat_fat_g":18.9,"sodium_mg":653,"sugar_g":0.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('ricotta','Ricotta, whole milk','جبنة ريكوتا','dairy','{"calories":174,"protein_g":11.4,"carbs_g":3,"fat_g":12.9,"fiber_g":0,"sat_fat_g":8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('parmesan','Parmesan, grated','جبنة بارميزان','dairy','{"calories":420,"protein_g":35.8,"carbs_g":4.1,"fat_g":27.8,"fiber_g":0,"sat_fat_g":17.8,"sodium_mg":1529}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('cream-cheese','Cream cheese','جبنة كريمي','dairy','{"calories":342,"protein_g":5.9,"carbs_g":4.1,"fat_g":34.2,"fiber_g":0,"sat_fat_g":19.3,"sodium_mg":321}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('cottage-cheese','Cottage cheese','جبنة قريش','dairy','{"calories":98,"protein_g":11.1,"carbs_g":3.4,"fat_g":4.3,"fiber_g":0,"sat_fat_g":1.7,"sodium_mg":364}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('heavy-cream','Heavy cream','كريمة لباني','dairy','{"calories":340,"protein_g":2.1,"carbs_g":2.8,"fat_g":36,"fiber_g":0,"sat_fat_g":23,"sodium_mg":27}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{dairy,animal}'),
('egg-whole','Egg, whole, raw','بيض','egg','{"calories":143,"protein_g":12.6,"carbs_g":0.7,"fat_g":9.5,"fiber_g":0,"sat_fat_g":3.1,"sodium_mg":142,"sugar_g":0.4}','01123','USDA FDC','SR-Legacy-curated-2026-11',NULL,'{egg,animal}'),
('egg-white','Egg white, raw','بياض البيض','egg','{"calories":52,"protein_g":10.9,"carbs_g":0.7,"fat_g":0.2,"fiber_g":0,"sat_fat_g":0,"sodium_mg":166,"sugar_g":0.7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{egg,animal}'),
-- ── Poultry & meat ──
('chicken-breast-raw','Chicken breast, raw','صدور دجاج نيئة','poultry','{"calories":120,"protein_g":22.5,"carbs_g":0,"fat_g":2.6,"fiber_g":0,"sat_fat_g":0.6,"sodium_mg":45}','05064','USDA FDC','SR-Legacy-curated-2026-11',74,'{meat,poultry,animal}'),
('chicken-breast-cooked','Chicken breast, roasted','صدور دجاج مطبوخة','poultry','{"calories":165,"protein_g":31,"carbs_g":0,"fat_g":3.6,"fiber_g":0,"sat_fat_g":1,"sodium_mg":74}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{meat,poultry,animal}'),
('chicken-thigh-raw','Chicken thigh, meat only, raw','ورك دجاج نيء','poultry','{"calories":119,"protein_g":19.7,"carbs_g":0,"fat_g":4.3,"fiber_g":0,"sat_fat_g":1.2,"sodium_mg":86}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',73,'{meat,poultry,animal}'),
('ground-chicken-raw','Ground chicken, raw','دجاج مفروم نيء','poultry','{"calories":143,"protein_g":17.4,"carbs_g":0,"fat_g":8.1,"fiber_g":0,"sat_fat_g":2.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',75,'{meat,poultry,animal}'),
('turkey-breast-raw','Turkey breast, meat only, raw','صدور تركي نيئة','poultry','{"calories":111,"protein_g":24.1,"carbs_g":0,"fat_g":1.7,"fiber_g":0,"sat_fat_g":0.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',74,'{meat,poultry,animal}'),
('chicken-liver-raw','Chicken liver, raw','كبدة دجاج','poultry','{"calories":119,"protein_g":17,"carbs_g":0.7,"fat_g":4.8,"fiber_g":0,"sat_fat_g":1.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',70,'{meat,poultry,organ,animal}'),
('ground-beef-85','Ground beef, 85% lean, raw','لحم بقري مفروم 85% نيء','meat','{"calories":176,"protein_g":20,"carbs_g":0,"fat_g":10,"fiber_g":0,"sat_fat_g":4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',71,'{meat,red-meat,animal}'),
('ground-beef-80','Ground beef, 80% lean, raw','لحم بقري مفروم 80% نيء','meat','{"calories":254,"protein_g":17.2,"carbs_g":0,"fat_g":15.4,"fiber_g":0,"sat_fat_g":6.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',71,'{meat,red-meat,animal}'),
('beef-sirloin-raw','Beef sirloin, lean, raw','لحم بقري سرلوين نيء','meat','{"calories":146,"protein_g":24.4,"carbs_g":0,"fat_g":4.8,"fiber_g":0,"sat_fat_g":1.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',74,'{meat,red-meat,animal}'),
('beef-liver-raw','Beef liver, raw','كبدة بقري','meat','{"calories":135,"protein_g":20.4,"carbs_g":3.9,"fat_g":3.6,"fiber_g":0,"sat_fat_g":1.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',70,'{meat,red-meat,organ,animal}'),
('lamb-leg-raw','Lamb leg, lean, raw','لحم ضاني فخذ نيء','meat','{"calories":155,"protein_g":24.5,"carbs_g":0,"fat_g":6.5,"fiber_g":0,"sat_fat_g":2.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',72,'{meat,red-meat,animal}'),
('ground-lamb-raw','Ground lamb, 85% lean, raw','لحم ضاني مفروم نيء','meat','{"calories":201,"protein_g":19.8,"carbs_g":0,"fat_g":12.8,"fiber_g":0,"sat_fat_g":5.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',72,'{meat,red-meat,animal}'),
-- ── Fish & seafood ──
('salmon-raw','Salmon, Atlantic, raw','سلمون نيء','fish','{"calories":208,"protein_g":20.4,"carbs_g":0,"fat_g":13.4,"fiber_g":0,"sat_fat_g":3.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',74,'{fish,animal}'),
('tuna-canned-water','Tuna, canned in water','تونة معلبة بالماء','fish','{"calories":116,"protein_g":25.5,"carbs_g":0,"fat_g":0.8,"fiber_g":0,"sat_fat_g":0.2,"sodium_mg":247}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{fish,animal}'),
('tilapia-raw','Tilapia, raw','بلطي نيء','fish','{"calories":96,"protein_g":20.1,"carbs_g":0,"fat_g":1.7,"fiber_g":0,"sat_fat_g":0.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',75,'{fish,animal}'),
('cod-raw','Cod, raw','سمك قد نيء','fish','{"calories":82,"protein_g":17.8,"carbs_g":0,"fat_g":0.7,"fiber_g":0,"sat_fat_g":0.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',75,'{fish,animal}'),
('shrimp-raw','Shrimp, raw','جمبري نيء','fish','{"calories":99,"protein_g":24,"carbs_g":0.2,"fat_g":0.3,"fiber_g":0,"sat_fat_g":0.1,"sodium_mg":111}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',70,'{fish,shellfish,animal}'),
('sardines-canned','Sardines, canned in oil, drained','سردين معلب بالزيت','fish','{"calories":208,"protein_g":24.6,"carbs_g":0,"fat_g":11.5,"fiber_g":0,"sat_fat_g":1.5,"sodium_mg":505}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{fish,animal}'),
('mackerel-raw','Mackerel, Atlantic, raw','ماكريل نيء','fish','{"calories":205,"protein_g":18.6,"carbs_g":0,"fat_g":13.9,"fiber_g":0,"sat_fat_g":3.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',74,'{fish,animal}'),
('calamari-raw','Squid (calamari), raw','كاليماري نيء','fish','{"calories":92,"protein_g":15.6,"carbs_g":3.1,"fat_g":1.4,"fiber_g":0,"sat_fat_g":0.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',70,'{fish,shellfish,animal}'),
-- ── Legumes ──
('lentils-dry','Lentils, dry','عدس جاف','legume','{"calories":353,"protein_g":25.8,"carbs_g":60.1,"fat_g":1.1,"fiber_g":30.5,"sat_fat_g":0.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',230,'{plant,legume}'),
('chickpeas-dry','Chickpeas, dry','حمص جاف','legume','{"calories":364,"protein_g":19.3,"carbs_g":60.7,"fat_g":6,"fiber_g":17.4,"sat_fat_g":0.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',210,'{plant,legume}'),
('fava-beans-dry','Fava beans, dry','فول جاف','legume','{"calories":341,"protein_g":26.1,"carbs_g":58.3,"fat_g":1.5,"fiber_g":25,"sat_fat_g":0.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',220,'{plant,legume}'),
('white-beans-dry','White beans, dry','فاصوليا بيضاء جافة','legume','{"calories":333,"protein_g":23.6,"carbs_g":60.3,"fat_g":0.8,"fiber_g":24.4,"sat_fat_g":0.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',220,'{plant,legume}'),
('kidney-beans-dry','Kidney beans, dry','فاصوليا حمراء جافة','legume','{"calories":333,"protein_g":23.6,"carbs_g":60,"fat_g":0.8,"fiber_g":24.9,"sat_fat_g":0.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',220,'{plant,legume}'),
('black-beans-dry','Black beans, dry','فاصوليا سوداء جافة','legume','{"calories":341,"protein_g":21.6,"carbs_g":62.4,"fat_g":1.4,"fiber_g":15.2,"sat_fat_g":0.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',220,'{plant,legume}'),
('split-peas-dry','Split peas, dry','بسلة جافة مقشورة','legume','{"calories":341,"protein_g":24.5,"carbs_g":60,"fat_g":1.2,"fiber_g":26,"sat_fat_g":0.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',220,'{plant,legume}'),
('green-beans-fresh','Green beans, raw','فاصوليا خضراء','vegetable','{"calories":31,"protein_g":1.8,"carbs_g":7,"fat_g":0.2,"fiber_g":2.7,"sodium_mg":6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('green-peas-frozen','Green peas, frozen','بسلة مجمدة','vegetable','{"calories":77,"protein_g":5.2,"carbs_g":13.7,"fat_g":0.4,"fiber_g":4.5,"sodium_mg":4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable,legume}'),
('fava-beans-fresh','Fava beans, fresh, green','فول أخضر طازج','vegetable','{"calories":66,"protein_g":5.7,"carbs_g":9.9,"fat_g":0.4,"fiber_g":4}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',NULL,'{plant,vegetable,legume}'),
-- ── Grains ──
('white-rice-raw','Rice, white, long-grain, raw','أرز أبيض طويل الحبة','grain','{"calories":365,"protein_g":7.1,"carbs_g":79.9,"fat_g":0.7,"fiber_g":1.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',300,'{plant,grain}'),
('white-rice-cooked','Rice, white, cooked','أرز أبيض مطبوخ','grain','{"calories":130,"protein_g":2.7,"carbs_g":28.2,"fat_g":0.3,"fiber_g":0.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain}'),
('brown-rice-raw','Rice, brown, raw','أرز بني','grain','{"calories":367,"protein_g":7.5,"carbs_g":76.2,"fat_g":2.9,"fiber_g":3.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',280,'{plant,grain}'),
('basmati-rice-raw','Rice, basmati, raw','أرز بسمتي','grain','{"calories":356,"protein_g":7.6,"carbs_g":78.9,"fat_g":0.6,"fiber_g":1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',300,'{plant,grain}'),
('rice-short-grain-raw','Rice, short-grain (Egyptian), raw','أرز مصري قصير الحبة','grain','{"calories":360,"protein_g":6.9,"carbs_g":78.7,"fat_g":0.8,"fiber_g":1.4}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',290,'{plant,grain}'),
('pasta-dry','Pasta, dry','مكرونة جافة','grain','{"calories":371,"protein_g":13,"carbs_g":74.7,"fat_g":1.5,"fiber_g":3.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',250,'{plant,grain,gluten}'),
('whole-wheat-pasta-dry','Whole-wheat pasta, dry','مكرونة قمح كامل جافة','grain','{"calories":348,"protein_g":14,"carbs_g":71,"fat_g":2.5,"fiber_g":8.8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',240,'{plant,grain,gluten}'),
('bulgur-dry','Bulgur, dry','برغل جاف','grain','{"calories":342,"protein_g":12.3,"carbs_g":75.9,"fat_g":1.3,"fiber_g":18.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',250,'{plant,grain,gluten}'),
('couscous-dry','Couscous, dry','كسكس جاف','grain','{"calories":376,"protein_g":12.8,"carbs_g":77.4,"fat_g":0.6,"fiber_g":5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',250,'{plant,grain,gluten}'),
('quinoa-dry','Quinoa, dry','كينوا','grain','{"calories":368,"protein_g":14.1,"carbs_g":64.2,"fat_g":6.1,"fiber_g":7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',270,'{plant,grain}'),
('oats-rolled','Oats, rolled, dry','شوفان','grain','{"calories":389,"protein_g":16.9,"carbs_g":66.3,"fat_g":6.9,"fiber_g":10.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',220,'{plant,grain,gluten}'),
('barley-pearled','Barley, pearled, dry','شعير مقشور','grain','{"calories":352,"protein_g":9.9,"carbs_g":77.7,"fat_g":1.2,"fiber_g":15.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',250,'{plant,grain,gluten}'),
('freekeh-dry','Freekeh (green wheat), dry','فريك','grain','{"calories":325,"protein_g":14.9,"carbs_g":68.5,"fat_g":2.5,"fiber_g":13.3}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',260,'{plant,grain,gluten}'),
('flour-all-purpose','Flour, all-purpose','دقيق أبيض','grain','{"calories":364,"protein_g":10.3,"carbs_g":76.3,"fat_g":1,"fiber_g":2.7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain,gluten}'),
('flour-whole-wheat','Flour, whole-wheat','دقيق قمح كامل','grain','{"calories":340,"protein_g":13.2,"carbs_g":72,"fat_g":2.5,"fiber_g":10.7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain,gluten}'),
('rice-flour','Rice flour','دقيق أرز','grain','{"calories":366,"protein_g":5.9,"carbs_g":80.6,"fat_g":1.4,"fiber_g":2.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain}'),
('cornmeal','Cornmeal','دقيق ذرة','grain','{"calories":362,"protein_g":8.1,"carbs_g":76.9,"fat_g":3.6,"fiber_g":3.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain}'),
('breadcrumbs','Breadcrumbs','بقسماط','grain','{"calories":395,"protein_g":13.4,"carbs_g":71.7,"fat_g":5.3,"fiber_g":4.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain,gluten}'),
('cornstarch','Cornstarch','نشا الذرة','other','{"calories":381,"protein_g":0.3,"carbs_g":91.3,"fat_g":0.1,"fiber_g":0.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
-- ── Breads ──
('white-bread','White bread','عيش أبيض (توست)','bread','{"calories":265,"protein_g":9,"carbs_g":49,"fat_g":3.2,"fiber_g":2.7,"sat_fat_g":0.7,"sodium_mg":491}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain,gluten}'),
('whole-wheat-bread','Whole-wheat bread','عيش أسمر (توست)','bread','{"calories":247,"protein_g":13,"carbs_g":41,"fat_g":3.4,"fiber_g":6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain,gluten}'),
('baladi-bread','Baladi bread (Egyptian whole pita)','عيش بلدي','bread','{"calories":240,"protein_g":9.5,"carbs_g":47,"fat_g":1.4,"fiber_g":5.5}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',NULL,'{plant,grain,gluten}'),
('pita-bread','Pita bread, white','خبز بيتا','bread','{"calories":275,"protein_g":9.1,"carbs_g":55.7,"fat_g":1.2,"fiber_g":2.2,"sodium_mg":536}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,grain,gluten}'),
-- ── Vegetables ──
('onion-raw','Onion, raw','بصل','vegetable','{"calories":40,"protein_g":1.1,"carbs_g":9.3,"fat_g":0.1,"fiber_g":1.7,"sodium_mg":4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('garlic-raw','Garlic, raw','ثوم','vegetable','{"calories":149,"protein_g":6.4,"carbs_g":33.1,"fat_g":0.5,"fiber_g":2.1,"sodium_mg":17}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('tomato-raw','Tomato, raw','طماطم','vegetable','{"calories":18,"protein_g":0.9,"carbs_g":3.9,"fat_g":0.2,"fiber_g":1.2,"sodium_mg":5}','11529','USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('cucumber-raw','Cucumber, with peel','خيار','vegetable','{"calories":15,"protein_g":0.7,"carbs_g":3.6,"fat_g":0.1,"fiber_g":0.5,"sodium_mg":2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('green-bell-pepper','Green bell pepper','فلفل أخضر رومي','vegetable','{"calories":20,"protein_g":0.9,"carbs_g":4.6,"fat_g":0.2,"fiber_g":1.7,"sodium_mg":3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('chili-pepper-green','Green chili pepper','فلفل أخضر حار','vegetable','{"calories":40,"protein_g":1.9,"carbs_g":8.8,"fat_g":0.4,"fiber_g":1.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('carrot-raw','Carrot, raw','جزر','vegetable','{"calories":41,"protein_g":0.9,"carbs_g":9.6,"fat_g":0.2,"fiber_g":2.8,"sodium_mg":69}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('zucchini-raw','Zucchini, raw','كوسة','vegetable','{"calories":17,"protein_g":1.2,"carbs_g":3.1,"fat_g":0.3,"fiber_g":1,"sodium_mg":8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('eggplant-raw','Eggplant, raw','باذنجان','vegetable','{"calories":25,"protein_g":1,"carbs_g":5.9,"fat_g":0.2,"fiber_g":3,"sodium_mg":2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('okra-raw','Okra, raw','بامية','vegetable','{"calories":33,"protein_g":1.9,"carbs_g":7.5,"fat_g":0.2,"fiber_g":3.2,"sodium_mg":7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('molokhia-chopped','Molokhia (jute leaves), chopped','ملوخية مفرومة','vegetable','{"calories":50,"protein_g":4,"carbs_g":6,"fat_g":0.3,"fiber_g":3}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',NULL,'{plant,vegetable}'),
('spinach-raw','Spinach, raw','سبانخ','vegetable','{"calories":23,"protein_g":2.9,"carbs_g":3.6,"fat_g":0.4,"fiber_g":2.2,"sodium_mg":79}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('parsley-raw','Parsley, fresh','بقدونس','vegetable','{"calories":36,"protein_g":3,"carbs_g":6.3,"fat_g":0.8,"fiber_g":3.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('cilantro-raw','Cilantro (coriander leaves), fresh','كسبرة خضراء','vegetable','{"calories":23,"protein_g":2.1,"carbs_g":3.7,"fat_g":0.5,"fiber_g":2.8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('dill-fresh','Dill, fresh','شبت','vegetable','{"calories":43,"protein_g":3.5,"carbs_g":7,"fat_g":1.1,"fiber_g":2.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('leek-raw','Leek, raw','كرات','vegetable','{"calories":61,"protein_g":1.5,"carbs_g":14.2,"fat_g":0.3,"fiber_g":1.8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('cabbage-raw','Cabbage, raw','كرنب','vegetable','{"calories":25,"protein_g":1.3,"carbs_g":5.8,"fat_g":0.1,"fiber_g":2.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('cauliflower-raw','Cauliflower, raw','قرنبيط','vegetable','{"calories":25,"protein_g":1.9,"carbs_g":5,"fat_g":0.3,"fiber_g":2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('broccoli-raw','Broccoli, raw','بروكلي','vegetable','{"calories":34,"protein_g":2.8,"carbs_g":6.6,"fat_g":0.4,"fiber_g":2.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('potato-raw','Potato, raw','بطاطس','vegetable','{"calories":77,"protein_g":2,"carbs_g":17.5,"fat_g":0.1,"fiber_g":2.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('sweet-potato-raw','Sweet potato, raw','بطاطا','vegetable','{"calories":86,"protein_g":1.6,"carbs_g":20.1,"fat_g":0.1,"fiber_g":3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('pumpkin-raw','Pumpkin, raw','قرع','vegetable','{"calories":26,"protein_g":1,"carbs_g":6.5,"fat_g":0.1,"fiber_g":0.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('mushrooms-white-raw','White mushrooms, raw','مشروم','vegetable','{"calories":22,"protein_g":3.1,"carbs_g":3.3,"fat_g":0.3,"fiber_g":1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('lettuce-romaine','Romaine lettuce','خس روماني','vegetable','{"calories":17,"protein_g":1.2,"carbs_g":3.3,"fat_g":0.3,"fiber_g":2.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('arugula-raw','Arugula (rocket), raw','جرجير','vegetable','{"calories":25,"protein_g":2.6,"carbs_g":3.7,"fat_g":0.7,"fiber_g":1.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('beetroot-raw','Beetroot, raw','بنجر','vegetable','{"calories":43,"protein_g":1.6,"carbs_g":9.6,"fat_g":0.2,"fiber_g":2.8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('artichoke-raw','Artichoke, raw','خرشوف','vegetable','{"calories":47,"protein_g":3.3,"carbs_g":10.5,"fat_g":0.2,"fiber_g":5.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('celery-raw','Celery, raw','كرفس','vegetable','{"calories":16,"protein_g":0.7,"carbs_g":3,"fat_g":0.2,"fiber_g":1.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('scallion-raw','Scallion (green onion), raw','بصل أخضر','vegetable','{"calories":32,"protein_g":1.8,"carbs_g":7.3,"fat_g":0.2,"fiber_g":2.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('mint-fresh','Mint, fresh','نعناع طازج','vegetable','{"calories":70,"protein_g":3.8,"carbs_g":14.9,"fat_g":0.9,"fiber_g":8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
('corn-frozen','Sweet corn, frozen','ذرة مجمدة','vegetable','{"calories":86,"protein_g":3.3,"carbs_g":19.9,"fat_g":1.4,"fiber_g":2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,vegetable}'),
-- ── Fruits ──
('banana-raw','Banana, raw','موز','fruit','{"calories":89,"protein_g":1.1,"carbs_g":22.8,"fat_g":0.3,"fiber_g":2.6}','09040','USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('apple-raw','Apple, raw with skin','تفاح','fruit','{"calories":52,"protein_g":0.3,"carbs_g":13.8,"fat_g":0.2,"fiber_g":2.4}','09003','USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('orange-raw','Orange, raw','برتقال','fruit','{"calories":47,"protein_g":0.9,"carbs_g":11.8,"fat_g":0.1,"fiber_g":2.4}','09200','USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('lemon-raw','Lemon, raw (without peel)','ليمون','fruit','{"calories":29,"protein_g":1.1,"carbs_g":9.3,"fat_g":0.3,"fiber_g":2.8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('dates-medjool','Medjool dates','بلح مجدول','fruit','{"calories":277,"protein_g":1.8,"carbs_g":75,"fat_g":0.2,"fiber_g":6.7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('dates-deglet','Deglet Noor dates','بلح دجلة نور','fruit','{"calories":282,"protein_g":2.5,"carbs_g":75,"fat_g":0.4,"fiber_g":8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('raisins','Raisins','زبيب','fruit','{"calories":299,"protein_g":3.1,"carbs_g":79.2,"fat_g":0.5,"fiber_g":3.7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('figs-dried','Figs, dried','تين مجفف','fruit','{"calories":249,"protein_g":3.3,"carbs_g":63.9,"fat_g":0.9,"fiber_g":9.8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('apricot-raw','Apricot, raw','مشمش','fruit','{"calories":48,"protein_g":1.4,"carbs_g":11.1,"fat_g":0.4,"fiber_g":2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('grapes-raw','Grapes, raw','عنب','fruit','{"calories":69,"protein_g":0.7,"carbs_g":18.1,"fat_g":0.2,"fiber_g":0.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('watermelon-raw','Watermelon, raw','بطيخ','fruit','{"calories":30,"protein_g":0.6,"carbs_g":7.6,"fat_g":0.2,"fiber_g":0.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('mango-raw','Mango, raw','مانجو','fruit','{"calories":60,"protein_g":0.8,"carbs_g":15,"fat_g":0.4,"fiber_g":1.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('strawberry-raw','Strawberry, raw','فراولة','fruit','{"calories":32,"protein_g":0.7,"carbs_g":7.7,"fat_g":0.3,"fiber_g":2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('blueberry-raw','Blueberry, raw','بلوبيري','fruit','{"calories":57,"protein_g":0.7,"carbs_g":14.5,"fat_g":0.3,"fiber_g":2.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('pomegranate-raw','Pomegranate, raw','رمان','fruit','{"calories":83,"protein_g":1.7,"carbs_g":18.7,"fat_g":1.2,"fiber_g":4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('guava-raw','Guava, raw','جوافة','fruit','{"calories":68,"protein_g":2.6,"carbs_g":14.3,"fat_g":1,"fiber_g":5.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
-- ── Nuts & seeds ──
('almonds-raw','Almonds, raw','لوز','nut','{"calories":579,"protein_g":21.2,"carbs_g":21.6,"fat_g":49.9,"fiber_g":12.5,"sat_fat_g":3.8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,nut}'),
('walnuts-raw','Walnuts, raw','عين جمل (جوز)','nut','{"calories":654,"protein_g":15.2,"carbs_g":13.7,"fat_g":65.2,"fiber_g":6.7,"sat_fat_g":6.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,nut}'),
('pistachios-raw','Pistachios, raw','فستق','nut','{"calories":560,"protein_g":20.2,"carbs_g":27.2,"fat_g":45.3,"fiber_g":10.6,"sat_fat_g":5.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,nut}'),
('cashews-raw','Cashews, raw','كاجو','nut','{"calories":553,"protein_g":18.2,"carbs_g":30.2,"fat_g":43.9,"fiber_g":3.3,"sat_fat_g":7.8}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,nut}'),
('peanuts-raw','Peanuts, raw','سوداني (فول سوداني)','nut','{"calories":567,"protein_g":25.8,"carbs_g":16.1,"fat_g":49.2,"fiber_g":8.5,"sat_fat_g":6.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,nut,legume}'),
('peanut-butter','Peanut butter','زبدة سوداني','nut','{"calories":588,"protein_g":25.1,"carbs_g":20,"fat_g":50.4,"fiber_g":6,"sat_fat_g":10.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,nut,legume}'),
('tahini','Tahini (sesame paste)','طحينة','nut','{"calories":595,"protein_g":17,"carbs_g":21.2,"fat_g":53.8,"fiber_g":9.3,"sat_fat_g":7.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,seed}'),
('sunflower-seeds','Sunflower seeds, raw','لب عباد الشمس','nut','{"calories":584,"protein_g":20.8,"carbs_g":20,"fat_g":51.5,"fiber_g":8.6,"sat_fat_g":4.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,seed}'),
('pumpkin-seeds','Pumpkin seeds, raw','لب قرع العسل','nut','{"calories":559,"protein_g":30.2,"carbs_g":10.7,"fat_g":49,"fiber_g":6,"sat_fat_g":8.7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,seed}'),
('sesame-seeds','Sesame seeds','سمسم','nut','{"calories":573,"protein_g":17.7,"carbs_g":23.5,"fat_g":49.7,"fiber_g":11.8,"sat_fat_g":7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,seed}'),
('chia-seeds','Chia seeds, dry','بذور الشيا','nut','{"calories":486,"protein_g":16.5,"carbs_g":42.1,"fat_g":30.7,"fiber_g":34.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,seed}'),
('flax-seeds','Flax seeds, raw','بذور الكتان','nut','{"calories":534,"protein_g":18.3,"carbs_g":28.9,"fat_g":42.2,"fiber_g":27.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,seed}'),
-- ── Sauces & condiments ──
('tomato-paste','Tomato paste','صلصة طماطم (معجون)','sauce','{"calories":82,"protein_g":4.3,"carbs_g":18.9,"fat_g":0.5,"fiber_g":4.1,"sodium_mg":59}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('tomato-sauce-canned','Tomato sauce, canned','عصير طماطم مطبوخ','sauce','{"calories":29,"protein_g":1.3,"carbs_g":6.6,"fat_g":0.2,"fiber_g":1.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('ketchup','Ketchup','كاتشب','sauce','{"calories":101,"protein_g":1.3,"carbs_g":25.8,"fat_g":0.1,"fiber_g":0.3,"sat_fat_g":0,"sodium_mg":907,"sugar_g":21.6}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('mayonnaise','Mayonnaise','مايونيز','sauce','{"calories":680,"protein_g":1,"carbs_g":0.6,"fat_g":75,"fiber_g":0,"sat_fat_g":12,"sodium_mg":635}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{egg}'),
('mustard-yellow','Yellow mustard','مسطردة','sauce','{"calories":66,"protein_g":4.4,"carbs_g":5.8,"fat_g":3.3,"fiber_g":3.3,"sodium_mg":1135,"sugar_g":0.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('soy-sauce','Soy sauce','صويا صوص','sauce','{"calories":53,"protein_g":8.1,"carbs_g":4.9,"fat_g":0.6,"fiber_g":0.8,"sodium_mg":5493,"sugar_g":0.4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,soy,gluten}'),
('vinegar-white','Vinegar, white','خل أبيض','sauce','{"calories":18,"protein_g":0,"carbs_g":0.9,"fat_g":0,"fiber_g":0}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('apple-cider-vinegar','Apple cider vinegar','خل التفاح','sauce','{"calories":21,"protein_g":0,"carbs_g":0.9,"fat_g":0,"fiber_g":0}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('lemon-juice','Lemon juice, fresh','عصير ليمون','sauce','{"calories":22,"protein_g":0.4,"carbs_g":6.9,"fat_g":0.2,"fiber_g":0.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,fruit}'),
('honey','Honey','عسل نحل','sweetener','{"calories":304,"protein_g":0.3,"carbs_g":82.4,"fat_g":0,"fiber_g":0.2,"sodium_mg":4}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{honey,plant}'),
('sugar-white','Sugar, white','سكر أبيض','sweetener','{"calories":387,"protein_g":0,"carbs_g":100,"fat_g":0,"fiber_g":0,"sodium_mg":1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,sweetener}'),
('cane-molasses','Sugar-cane molasses','عسل أسود (دبس قصب)','sweetener','{"calories":290,"protein_g":0,"carbs_g":74.7,"fat_g":0.1,"fiber_g":0,"sodium_mg":37}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant,sweetener}'),
('date-syrup','Date syrup (dibs)','دبس تمر','sweetener','{"calories":283,"protein_g":0.8,"carbs_g":70,"fat_g":0.2,"fiber_g":1.6}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',NULL,'{plant,sweetener}'),
('hot-sauce','Hot sauce (sriracha-style)','صوص حار','sauce','{"calories":93,"protein_g":1.9,"carbs_g":19,"fat_g":0.9,"fiber_g":1.8}',NULL,'USDA FDC (curated)','curated-seed-2026-11',NULL,'{plant}'),
('coconut-milk-canned','Coconut milk, canned','لبن جوز الهند','sauce','{"calories":230,"protein_g":2.3,"carbs_g":5.5,"fat_g":24,"fiber_g":0,"sat_fat_g":21.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('chicken-broth','Chicken broth','مرقة دجاج','sauce','{"calories":10,"protein_g":1,"carbs_g":0.9,"fat_g":0.2,"fiber_g":0,"sodium_mg":343}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{meat,poultry,animal}'),
('beef-broth','Beef broth','مرقة لحم','sauce','{"calories":17,"protein_g":1.9,"carbs_g":1,"fat_g":0.5,"fiber_g":0}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{meat,red-meat,animal}'),
-- ── Spices & dried herbs ──
('cumin-ground','Cumin, ground','كمون مطحون','spice','{"calories":375,"protein_g":17.8,"carbs_g":44.2,"fat_g":22.3,"fiber_g":10.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('cinnamon-ground','Cinnamon, ground','قرفة مطحونة','spice','{"calories":247,"protein_g":4,"carbs_g":80.6,"fat_g":1.2,"fiber_g":53.1}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('turmeric-ground','Turmeric, ground','كركم','spice','{"calories":312,"protein_g":9.7,"carbs_g":67.1,"fat_g":3.2,"fiber_g":22.7}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('paprika','Paprika','بابريكا','spice','{"calories":282,"protein_g":14.1,"carbs_g":54,"fat_g":12.9,"fiber_g":34.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('black-pepper','Black pepper, ground','فلفل أسود','spice','{"calories":251,"protein_g":10.4,"carbs_g":63.9,"fat_g":3.3,"fiber_g":25.3}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('chili-flakes','Chili flakes','فلفل تشيلي مجفف','spice','{"calories":282,"protein_g":13,"carbs_g":55,"fat_g":12,"fiber_g":34}',NULL,'USDA FDC (curated)','curated-seed-2026-11',NULL,'{plant}'),
('cardamom','Cardamom','هيل (حبهان)','spice','{"calories":311,"protein_g":10.8,"carbs_g":68.5,"fat_g":6.7,"fiber_g":28}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('ginger-ground','Ginger, ground','زنجبيل مطحون','spice','{"calories":335,"protein_g":9,"carbs_g":71,"fat_g":4.2,"fiber_g":14}',NULL,'USDA FDC (curated)','curated-seed-2026-11',NULL,'{plant}'),
('oregano-dried','Oregano, dried','أوريجانو مجفف','spice','{"calories":265,"protein_g":9,"carbs_g":68.9,"fat_g":4.3,"fiber_g":42.5}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('thyme-dried','Thyme, dried','زعتر مجفف','spice','{"calories":276,"protein_g":9.1,"carbs_g":63.9,"fat_g":7.4,"fiber_g":37}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('zaatar-blend','Zaatar blend','زعتر بلدي مخلوط','spice','{"calories":367,"protein_g":12,"carbs_g":40,"fat_g":16,"fiber_g":12}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',NULL,'{plant}'),
('dried-mint','Mint, dried','نعناع ناشف','spice','{"calories":285,"protein_g":13,"carbs_g":52,"fat_g":4,"fiber_g":20}',NULL,'Egyptian/Arab composition tables (curated)','curated-seed-2026-11',NULL,'{plant}'),
('coriander-ground','Coriander seed, ground','كسبرة ناشفة مطحونة','spice','{"calories":298,"protein_g":12.4,"carbs_g":55,"fat_g":17.8,"fiber_g":41.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('salt','Table salt','ملح','spice','{"calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fiber_g":0,"sodium_mg":38758}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{salt}'),
-- ── Chocolate & cocoa ──
('cocoa-powder','Cocoa powder, unsweetened','كاكاو خام','other','{"calories":228,"protein_g":19.6,"carbs_g":57.9,"fat_g":13.7,"fiber_g":33.2}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}'),
('dark-chocolate-70','Dark chocolate 70-85%','شوكولاتة داكنة','sweetener','{"calories":598,"protein_g":7.8,"carbs_g":45.9,"fat_g":42.6,"fiber_g":10.9}',NULL,'USDA FDC','SR-Legacy-curated-2026-11',NULL,'{plant}')
on conflict (slug) do nothing;

-- ============================================================
-- 9) Notify PostgREST to reload the schema.
-- ============================================================
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception when others then
  null;
end $$;
