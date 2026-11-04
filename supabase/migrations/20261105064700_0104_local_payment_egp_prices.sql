-- ============================================================================
-- 0104 — LOCAL-PAYMENT-EGP-PRICES (owner order 2026-11-05 — LOCAL-PAYMENT-EGP:
-- «الزبون يرى السعر بالدولار وحوله بالجنيه المصري… مع InstaPay/Vodafone Cash
-- وPayPal محفوظة كاملة بالدولار فقط» — resolves the currency TODO left open
-- by STATE phase 416 §بانتظار موافقة المالك)
-- ============================================================================
-- WHAT THIS ADDS (all additive — zero existing table is modified except one
-- nullable column; PayPal integration files are NOT touched at all):
--   1. public.local_prices           — the EGP twin per plan×duration
--   2. public.exchange_rate_updates  — ONE row per UTC day (the idempotency
--                                       lock): success rate or failure record
--   3. public.local_price_settings   — single row id=1: mode auto|manual
--   4. subscription_requests.price_egp — the AMOUNT LOCK: the EGP figure the
--                                       member saw is snapshotted into the
--                                       request row at creation time; later
--                                       rate changes / mode flips never
--                                       rewrite it. Existing subscriptions
--                                       (different table) are untouched.
--
-- THE RATE BOOTSTRAP (honest, measured, self-replacing):
--   Seed row = 55.3706 EGP/USD — LIVE-MEASURED on 2026-11-05 through the
--   owner-provided ExchangeRate-API v6 key (GET /v6/<key>/latest/USD →
--   result "success", conversion_rates.EGP = 55.3706, API's own
--   time_last_update_utc = 2026-11-04T00:00:01Z). The owner's chat
--   reference was 54.72; the live API value was used because it is the
--   same source the daily job will read. This is a ONE-TIME bootstrap so
--   the checkout EGP twin is valid on deploy day; the first
--   GET /api/cron/exchange-rate run (06:47 UTC daily, deploy/crontab-
--   alkemos) overwrites it with the then-current rate automatically.
--
-- THE SEED PRICES (all derived, zero hand-typed numbers):
--   computed by the same code path the cron job uses
--   (src/lib/local-prices.ts computeAutoLocalPrices) — USD prices read
--   from memberships.ts + plans.ts (the resolvePlanPrice sources),
--   rounded to the nearest 5 EGP (cash-friendly — the Egyptian manual
--   transfer convention; documented in the governing report):
--     premium  1mo  $14.99 → 830     premium  12mo $119  → 6590
--     pro      1mo  $29.99 → 1660    pro      12mo $239  → 13235
--     coaching 1mo  $39.99 → 2215    coaching 12mo $359  → 19880
--     starter  1mo  $20    → 1105    starter  12mo $200  → 11075
--     elite    1mo  $40    → 2215    elite    12mo $400  → 22150
--   A canary test (local-payment-egp.test.ts) recomputes these from the
--   live source files and pins the SQL to them — drift is impossible.
--
-- ACCESS MODEL (post-0055 defense-in-depth posture):
--   - READ: public (anon + authenticated) — these are display prices for
--     a public checkout page; USD prices are equally public.
--   - WRITE: SERVICE ROLE ONLY (no insert/update/delete policies exist).
--     The daily job (cron route) and the admin editor
--     (/api/admin/local-prices → requireAdmin + supabaseAdmin) are the
--     only writers. Admins CANNOT write through the browser client.
--
-- FAILURE POSTURE (fail-safe, never fail-zero):
--   API failure/quota/invalid key → the day's row records status
--   'failure'; the LAST SUCCESSFUL row keeps serving; prices are not
--   recomputed; the admin bell rings with the last-success date.
--
-- IDEMPOTENCY: every statement is if-not-exists / on-conflict-do-nothing;
--   re-running is a guaranteed no-op.
-- ROLLBACK: drop the three tables + the price_egp column (nothing else
--   references them).
-- ============================================================================

-- ============================================================
-- 1. local_prices — the EGP twin per plan×duration
-- ============================================================
create table if not exists public.local_prices (
  id uuid primary key default gen_random_uuid(),
  plan_tier text not null,
  duration_months integer not null check (duration_months in (1, 12)),
  price_egp numeric not null check (price_egp > 0),
  -- 'auto' = computed by the daily job · 'manual' = admin hand-set
  source text not null default 'auto' check (source in ('auto', 'manual')),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  unique (plan_tier, duration_months)
);

alter table public.local_prices enable row level security;

-- Public read (checkout display). NO write policies exist → only the
-- service role (cron job + requireAdmin routes) can write.
drop policy if exists local_prices_public_read on public.local_prices;
create policy local_prices_public_read
  on public.local_prices
  for select
  using (true);

-- ============================================================
-- 2. exchange_rate_updates — one row per UTC day (the lock)
-- ============================================================
create table if not exists public.exchange_rate_updates (
  id uuid primary key default gen_random_uuid(),
  -- THE IDEMPOTENCY LOCK: unique per calendar day → a second server or a
  -- re-fire the same UTC day can never trigger a second API request.
  rate_date date not null unique,
  -- null on a failure row (the day burned its one request without a rate)
  usd_to_egp numeric check (usd_to_egp > 0),
  status text not null check (status in ('success', 'failure')),
  error text,
  source text not null default 'exchangerate-api',
  fetched_at timestamptz not null default now()
);

create index if not exists idx_exchange_rate_updates_date
  on public.exchange_rate_updates(rate_date desc);

alter table public.exchange_rate_updates enable row level security;

-- Public read (the checkout "prices update daily" surface shows the rate;
-- exchange rates are public data). No write policies → service role only.
drop policy if exists exchange_rate_updates_public_read on public.exchange_rate_updates;
create policy exchange_rate_updates_public_read
  on public.exchange_rate_updates
  for select
  using (true);

-- ============================================================
-- 3. local_price_settings — single row: mode auto|manual
-- ============================================================
create table if not exists public.local_price_settings (
  id integer primary key default 1 check (id = 1),
  mode text not null default 'auto' check (mode in ('auto', 'manual')),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- The settings row must EXIST (mode lookups never see zero rows).
insert into public.local_price_settings (id, mode)
values (1, 'auto')
on conflict (id) do nothing;

alter table public.local_price_settings enable row level security;

-- Public read (the checkout shows the current mode context). No write
-- policies → service role only (the admin route flips the mode).
drop policy if exists local_price_settings_public_read on public.local_price_settings;
create policy local_price_settings_public_read
  on public.local_price_settings
  for select
  using (true);

-- ============================================================
-- 4. subscription_requests.price_egp — the AMOUNT LOCK
-- ============================================================
alter table public.subscription_requests
  add column if not exists price_egp numeric;

comment on column public.subscription_requests.price_egp is
  'LOCAL-PAYMENT-EGP 0104 amount lock: the EGP figure the member saw at request creation (manual InstaPay/Vodafone rails). NULL for PayPal requests and pre-0104 rows. Never rewritten by rate updates or mode flips.';

-- ============================================================
-- 5. Bootstrap seed (see header: live-measured 2026-11-05, replaced by
--    the first daily cron run)
-- ============================================================
insert into public.exchange_rate_updates (rate_date, usd_to_egp, status, source)
values ('2026-11-05', 55.3706, 'success', 'owner-bootstrap')
on conflict (rate_date) do nothing;

insert into public.local_prices (plan_tier, duration_months, price_egp, source)
values
  ('premium', 1, 830, 'auto'),
  ('premium', 12, 6590, 'auto'),
  ('pro', 1, 1660, 'auto'),
  ('pro', 12, 13235, 'auto'),
  ('coaching', 1, 2215, 'auto'),
  ('coaching', 12, 19880, 'auto'),
  ('starter', 1, 1105, 'auto'),
  ('starter', 12, 11075, 'auto'),
  ('elite', 1, 2215, 'auto'),
  ('elite', 12, 22150, 'auto')
on conflict (plan_tier, duration_months) do nothing;

-- ============================================================
-- 6. Reload PostgREST schema cache (new tables must be visible
--    to the REST layer immediately)
-- ============================================================
notify pgrst, 'reload schema';

-- VERIFY (read-only):
--   select plan_tier, duration_months, price_egp, source
--     from public.local_prices order by plan_tier, duration_months;  -- 10 rows
--   select rate_date, usd_to_egp, status, source
--     from public.exchange_rate_updates order by rate_date desc limit 5;
--   select mode from public.local_price_settings where id = 1;      -- auto
--   select price_egp from public.subscription_requests limit 1;     -- runs (null)

-- END OF SCRIPT 0104
