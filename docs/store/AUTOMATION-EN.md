# Alkemos Affiliate Store — Automation & Internal Marketing System (Phase 529)

> **Status:** IN PROGRESS (owner order 2026-11-27 «نفّذ مرحلة بناء منظومة الأتمتة
> والتسويق الداخلي لمتجر Affiliate Store»)
> **System:** System 2 — the EN-only Amazon Associates store (`affiliate_store_*`).
> **Law:** this document extends the governing law
> (`docs/archive/ALKEMOS-STORE-AFFILIATE-READINESS-AUDIT-2026-11-26.md`) and
> inherits every store law: EN-only (§0), no women/immodest imagery (§0.1/§0.2),
> no manual prices (§3.4-6 — API-served data only), no stored tagged links
> (§3.4-1), commissions internal-only (§6-c), separation from System 1
> (partner referrals) and System 3 (future Arabic store).

## 0. Verified ground truth before this plan (inspect-before-build)

Inspected live on 2026-11-27 (repo `main` @ `6f89d69`, production
`alkemos.com` build-info `d5996ae`, Supabase live read):

- **Tables that already exist (0115/0118/0119):** `affiliate_store_categories`
  (82 rows, 12 active mains / 64 active subs), `affiliate_store_products`
  (75 published, ASIN + m.media-amazon.com images), `affiliate_store_product_links`
  (128 surface bindings), `affiliate_store_click_events` (2 rows).
- **Already built:** public store + product pages, admin dashboard
  (`/admin/affiliate-store`), editor with guards (`affiliate-store-guards.ts`:
  image host allowlist, halal blocklist, claims discipline, price law, ninth
  guard), buy-link builder (`affiliate-store-link.ts`), click beacon
  (`/api/affiliate-store/clicks`), suggestion strip + surface rail components,
  verify endpoint (ASIN + image HEAD probes).
- **What does NOT exist (verified):** any fetch/automation table, any scheduler
  for the store, any Amazon API client, any impressions/analytics layer, any
  in-content product linking.

## 1. The official Amazon interface (the critical external fact)

**PA-API 5.0 was RETIRED by Amazon on 2026-05-15.** The official successor —
and the ONLY sanctioned program interface for Associates product data — is the
**Amazon Creators API**:

- Base: `https://creatorsapi.amazon/catalog/v1/{searchItems|getItems}`
- Auth: OAuth 2.0 `client_credentials` (Credential ID + Credential Secret →
  bearer token, 1 h, cacheable; token endpoint by region — NA:
  `https://api.amazon.com/auth/o2/token`, scope `creatorsapi::default`)
- Headers: `Authorization: Bearer …`, `Content-Type: application/json`,
  `x-marketplace: www.amazon.com`
- Resources used by this system: `images.primary.large`, `itemInfo.title`,
  `itemInfo.features`, `itemInfo.byLineInfo`, `offersV2.listings.price`,
  `offersV2.listings.availability`, `parentASIN`
- **Eligibility (external requirement on the OWNER):** an Associates account
  with ≥10 qualifying sales in the trailing 30 days registers for API access in
  Associates Central (Tools → Creators API) and issues Credential ID/Secret.
  Until then the automation runs HONESTLY DORMANT (the EXCHANGERATE_API_KEY
  precedent: recorded run with `missing-credentials`, no fake data, no mock).

**No unauthorized scraping anywhere.** The fetch pipeline talks only to the
official API above.

## 2. Components (all new code namespaced `affiliate-store-*`)

### 2.1 Database (migration `0120_affiliate_store_automation`, idempotent, RLS)

| table | purpose |
|---|---|
| `affiliate_store_automation_settings` | singleton: `is_enabled`, `frequency` (daily/weekly/monthly), `max_new_per_run`, `max_links_per_page`, `auto_link_enabled`, `link_score_threshold`, `last_run_at` |
| `affiliate_store_fetch_categories` | per-leaf-category fetch config: `keywords[]`, `browse_node_id`, `target_count`, `is_active` |
| `affiliate_store_fetch_runs` | run log: trigger, status (`running/succeeded/partial/failed/skipped`), counters (candidates/inserted/updated/unchanged/rejected/hidden), events jsonb, error summary. **Overlap lock:** partial UNIQUE index on `status='running'` |
| `affiliate_store_link_suggestions` | (page_type, page_slug, product_id) + relevance score + matched-tokens reason + status (pending/approved/rejected) |
| `affiliate_store_inline_links` | applied in-content links: page identity + product + anchor phrase + `is_active` + source (auto/manual) |
| `affiliate_store_impression_events` | daily-aggregated impressions (product × surface × day), SECURITY DEFINER increment RPC, service-role only |

Public read: `affiliate_store_inline_links` (active rows only — EN pages render
them). Everything else admin-only (RLS via `is_admin()`), impressions/clicks
deny-all (service role only).

### 2.2 Fetch pipeline (`affiliate-store-fetch.ts` + Creators API client)

Per run: settings check → credential check (honest `missing-credentials`) →
overlap lock → for each active fetch category: `searchItems` (keywords,
availability Available) → candidate filter (image present, ASIN valid,
not already in DB — batch + DB dedupe, per-category target cap) →
`getItems` (details) → **guards** (the full 527-G gate: m.media-amazon.com
image, halal blocklist, claims discipline, female/immodest vocabulary on
title+alt, no stored tagged links) → deterministic EN editorial draft
(≥250 words, never Amazon copy) → insert via the SAME guarded admin path
(auto-publish law 527-L2). Existing ASINs: sync price (into `payload` +
`price_usd` + `price_updated_at`), availability, image, title; unavailable
items → hide (`is_published=false`, availability note — never delete, slug
law). Every step logged into the run's events; failures raise admin
notifications (throttled) and RED workflow runs.

**Stored-link law (529-R remediation, 2026-11-27):** the product `payload`
carries NO `detailPageURL` — the tagged link the API returns is never
typed, read, or persisted; the stored purchase identity is the ASIN alone
and the buy destination is built at render time by `resolveAmazonBuyLink`
(env tag, merged exactly once). Two canaries in
`affiliate-store-automation-core.test.ts` make reintroduction impossible:
the payload must lack the key even when the API item carries one, and its
full serialization must be free of `tag=` / `amazon.com/dp` / `amzn.to`.

**Price display law (documented decision):** API-obtained prices are STORED
(price clause: API-served data is the allowed class), but public cards keep
showing "See price on Amazon" — Amazon's policy requires displayed pricing to
be ≤1 h fresh, and the fetch cadence (daily/weekly) cannot guarantee that.
Flip to price display is a Phase-4 owner decision with a ≤1 h refresh budget.

### 2.3 Smart internal linking (`affiliate-store-linking.ts`)

- **Relevance = category-topic map + weighted token overlap** (title ×3,
  headings ×2, body ×1 vs product title/brand/category tokens). A suggestion
  requires a category-map hit OR ≥3 distinct content-token matches. No random
  keyword stuffing.
- **Scan surfaces (EN ONLY):** blog posts (`language='en'`), recipes,
  programs, exercises, tools/nutrition pages.
- **Two render paths:** (a) in-text anchors — first-occurrence phrase wrap,
  idempotent, capped by `max_links_per_page`, links point to the INTERNAL
  product page (`/affiliate-store/[category]/[slug]`), never directly to
  Amazon, never inside existing links/headings; (b) the existing
  `AffiliateStoreSurfaceRail` blocks via `affiliate_store_product_links`.
- **Auto-apply** suggestions ≥ threshold (`auto_link_enabled`); the rest stay
  pending for admin approve/reject.
- **Hide/delete propagation:** product unpublished/hidden → its inline links +
  surface bindings deactivate + caches flushed (no dead links).
- **Language law:** the injection function is a hard no-op for `lang !== 'en'`;
  canary tests pin the (ar) tree clean and AR articles untouched.

### 2.4 Tracking & analytics (`affiliate-store-analytics.ts`)

- Impressions: batched IntersectionObserver beacon →
  `/api/affiliate-store/impressions` → RPC increment (daily aggregate, zero
  PII, rate-limited, published-product check).
- Clicks: existing `affiliate_store_click_events` beacon (unchanged).
- Aggregations (7/30/90-day windows): per product (impressions, clicks, CTR),
  per surface/page, per category, top products, top pages, zero-interaction
  products (impressions ≥ N, clicks = 0). Admin analytics tab with charts.

### 2.5 Control plane

- Cron endpoint `/api/cron/affiliate-store-automation` (CRON_SECRET,
  timing-safe): due-check by frequency → fetch + linking scan; honest codes
  (200 ok/skip, 503 missing credentials, 401 bad secret).
- GitHub workflow `affiliate-store-automation.yml`: daily 07:17 UTC fire +
  workflow_dispatch, tight concurrency group (the exchange-rate pattern).
- Admin API `/api/admin/affiliate-store/automation` (requireAdmin): settings,
  category configs, run-now, linking-scan, suggestion approve/reject, link
  toggle, analytics.
- Admin UI `/admin/affiliate-store/automation`: enable/pause, frequency,
  per-run cap, category table (keywords/targets/active), credential status
  (booleans only — never values), last/next run, run history with stats +
  errors, suggestion review, analytics dashboard.

### 2.6 Protection & quality (how each owner requirement is met)

| requirement | mechanism |
|---|---|
| official API only, no scraping | Creators API client; zero scrapers |
| request limits | sequential calls, per-run item caps, 429 backoff + honest logging |
| disclosure policy | OA disclosure line on every buy unit (existing); short disclosure near recommendation surfaces (existing); inline links point internally, buy happens on the product page with its attached disclosure |
| no broken/fake products | image + ASIN + guards on insert; sync pass detects unavailable → hides; verify probes |
| scheduled-task overlap protection | DB partial-unique running lock + workflow concurrency group + manual-run lock reuse |
| no women/immodest imagery | vocabulary gates on title/alt + image-host allowlist + person-photo-risk categories excluded from fetch defaults; the 528 vision-check discipline remains the editor's deep check |
| site performance/SEO | all renders stay server/ISR; links are internal; cache flush via existing 3-layer pattern; no new third-party JS (one tiny beacon island) |
| memberships/EVO/partners untouched | separation canaries extended to every new file (§0 law) |
