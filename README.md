# Alkemos — The Bilingual Smart Fitness & Nutrition Platform

> **Live:** [alkemos.com](https://alkemos.com)
> **Stack:** Next.js 16 · React 19 · TypeScript · Supabase · Tailwind CSS 4 · Vitest
> **AI:** OpenRouter · Groq · NVIDIA NIM · Google Gemini · Cloudflare Workers AI — one unified provider layer, plus Tavily & Exa grounded-search arms
> **Hosting:** AWS Lightsail origin (Caddy + PM2) behind Cloudflare
> **Quality:** every push is audited by automated CI gates — types, lint, tests, schema-drift, docs parity, anti-regression
> **Status:** in production · current live status: [`STATE.md`](./STATE.md)

Alkemos is a bilingual (English + full Arabic RTL mirror) fitness and nutrition
platform that unifies training, nutrition, and AI planning in one product:
real content libraries, free planning tools, an AI coach (**EVO**), personal
coaching, and an automated bilingual blog — backed by membership tiers, an
affiliate program, a complete B2B coach system, and a full admin platform.

This repository holds the entire production platform: the site, the API, the
database migrations, the CI/CD pipeline, and the server configuration. The code
is **proprietary and confidential** (see [License](#-license)).

---

## 🧭 What Alkemos offers

### Content libraries & free tools — no account needed
- **Exercise library** — 868 exercises with start/end position images
  (self-hosted WebP), bilingual names / instructions / tips in Modern Standard
  Arabic + English, filterable by muscle group, equipment, and level
  (`src/lib/exercises.ts`)
- **Food database** — 8,162 foods with per-100g macros and search that
  matches both the Arabic and English name fields (`src/lib/foods.ts`).
  Arabic (MSA) + English names cover the hand-curated core plus the
  arabization batches shipped so far; the long USDA-imported tail still
  carries English-only names and surfaces as-is on the Arabic pages until
  its batch is translated (governing plan:
  [`docs/archive/FOOD-DATA-ARABIZATION-PLAN-2026-09-19.md`](./docs/archive/FOOD-DATA-ARABIZATION-PLAN-2026-09-19.md)).
  Curated foods also carry an editorial enrichment layer (unique intro,
  usage context, FAQ per food, bilingual, server-rendered
  — `src/lib/foods-enrichment.ts`)
- **Workout programs** — structured, ready-to-follow programs for home,
  home-equipment, and gym, from beginner to advanced
  (`src/lib/workout-programs.ts`)
- **Free tools** — calorie calculator, BMI, macros, body-fat %, water tracker,
  and an interactive meal planner, each with optional email delivery of
  results (`src/lib/tools-shared.ts` is the single source of the tools list).
  Every tool page ends with a "how to use your result" guide strip linking
  the published articles that interpret that tool's number, and each of
  those articles links back to its tool ("try the calculator") from the
  same pair source (`src/lib/tool-article-links.ts`)
- **AI planners** — AI meal planner and AI workout planner with a free trial,
  no signup required (a plan generated without an account stays on that device
  until you create one, then syncs to the account)
- **Blog & comparison hub** — bilingual articles plus focused
  "Alkemos vs …" comparison pages (`/blog`, `/compare`)

### Alkemos Affiliate Store (Amazon Associates, English-only)
- **Curated fitness & nutrition gear** — an Amazon Associates (US) product
  store living at `/affiliate-store` (renamed from `/store` on
  2026-11-26 — the owner's unified `affiliate_store` programmatic name;
  legacy URLs 301 to the new ones): strength and home-gym equipment,
  kitchen and meal-prep tools, body-measurement devices, wearables,
  apparel, and hydration gear. Every product carries original Alkemos
  editorial content (never Amazon copy) and a single purchase unit built
  at render time from the ASIN + the environment's Associates tag —
  tagged links are never stored (`src/lib/affiliate-store-link.ts` is
  the one tag source).
- **English-only by law** — the store is entirely English; there is no
  Arabic mirror and no store link on any Arabic surface (the store's
  governing law: `docs/archive/ALKEMOS-STORE-AFFILIATE-READINESS-AUDIT-2026-11-26.md`,
  live docs under `docs/store/`).
- **Honest compliance, enforced by tests** — the Amazon Associates
  disclosure renders attached to every buy unit; prices, Amazon images,
  and Amazon ratings are absent until the Phase-4 Creators API; halal
  blocklist, claims discipline, image law (absolute ban on women in any
  store image), commission-rates-internal-only, and ASIN/link guards all
  run as publish gates + vitest canaries
  (`src/lib/affiliate-store-guards.ts`).
- **Owner-reviewed catalog (0097)** — products are born
  `review_status=pending`; the owner reviews and publishes from
  `/admin/affiliate-store` (review inbox, category/wave activation,
  StoreLinkVerify, live guard feedback in the editor). Clicks are
  measured with a non-redirecting `sendBeacon` endpoint (zero PII) + GA4
  events; the store ships its own EN-only sitemap family
  (`/sitemap-affiliate-store.xml`).
- **Live product preview in the editor (2026-11-26)** — the admin
  editor (`/admin/affiliate-store/new` and `/[id]`) carries a sticky
  preview panel that mirrors the PUBLIC surfaces (the rail card + the
  product page header: image-or-carved-icon, title, brand, summary,
  editorial score, featured badge, leaf category, the buy-unit state,
  and the honest no-price law) and re-renders on every keystroke;
  an "Open the public product page" button links the real
  `/affiliate-store/{leaf}/{slug}` URL (404 while pending — honest
  pre-publish mirror); `image_url` is validated as a DIRECT image link
  (page/document extensions BLOCK at the guard; an extension-less URL
  warns and the "Verify image" probe requires `content-type: image/*`)
  and every failed image load falls back in place to the category's
  carved icon (`AffiliateStoreProductImage` — no broken-image glyphs
  on any public surface).
- **Public store entrances (2026-11-26)** — the EN homepage carries a
  store discovery section (real category chips from the active tree +
  the featured published-products rail + one CTA to `/affiliate-store`;
  honest-empty until the owner publishes); the header shows a "Store"
  entry on desktop and an "Affiliate Store" item in the mobile drawer —
  both EN-only (`enOnly` flag: they drop out of Arabic menus, store law
  §0); EN content surfaces carry "Recommended gear" entrances wired
  from the `affiliate_store_product_links` bindings — a server rail on
  the equipment hubs and program pages, and a lazy client strip on the
  tool/planner pages (`/api/affiliate-store/suggest`, published-only,
  fail-soft). The Associates tag reaches production through
  `deploy-aws.yml`'s env-sync as a public literal (the
  `NEXT_PUBLIC_SITE_URL` precedent — it is not a secret; see
  `SECURITY.md` §2.1).

### EVO — the AI coach
- Floating chat widget on every page + a dedicated `/evo` experience, with
  live SSE streaming answers
- 10 messages/day free (subscribers unlimited), memory of goals and
  preferences, and opt-in weekly follow-up emails
- A safety layer answers self-harm / eating-disorder signals with a static
  safe redirect — those never reach a model (`src/lib/evo-safety.ts`); plan
  and swap requests are quota-gated through an intent layer
  (`src/lib/evo-intent.ts`)
- Dispatch telemetry, a frequent-question cache, and a weekly automated AR/EN
  quality eval, surfaced read-only at `/admin/evo-analytics`

### Memberships
Four tiers — Free, Premium, Pro, Coaching — with TWO unified monthly AI
quotas, a subscriber feature (the 2026-11-14 orders): plan generations
(nutrition + workout from ONE quota; only successful generations count —
failed attempts and edits never burn quota) and swaps (meal + exercise
from ONE quota), fully independent of each other, renewed on each
subscription's own cycle (parallel-entitlement engine: early renewal
extends the same row and never resets remaining quota; an upgrade runs
beside the old subscription — both benefit, nothing paid is ever lost,
`src/lib/tier-limits.ts`); saved-results capacity and export on top. Free
keeps the full free product (tools, libraries, content, EVO chat
10 messages/day) — generation and swaps start with Premium, and quota
exhaustion offers renewal/upgrade through the existing /checkout path
(`renewalCheckoutUrlFor`/`upgradeCheckoutUrlFor` in `src/lib/memberships.ts`).
Prices, quotas, and tier features are defined in a single source:
`src/lib/memberships.ts` + the quota engine `src/lib/tier-limits.ts` (the
aggregate resolver: `src/lib/membership-tier.ts`). Every paid tier carries
a 7-day conditional refund (no-features-used, ledger-based —
`src/lib/refund.ts`).

### Notifications
- **Member bell** (`src/components/NotificationBell.tsx`) — per-user rows in
  `notifications`, localized at display time from the structured payload;
  clicking deep-links to the linked item
- **Staff bell** (`src/components/AdminNotificationBell.tsx`) —
  `admin_notifications` routed per coach
- Structured emits carry event-identity keys with dedup guards — double-clicks
  and retries never double-fire

### For coaches (B2B)
- **Client dashboard** — lifecycle filters and per-client management
  (overview, subscription, plans, AI plans, questionnaires, progress); every
  staff surface shows the effectively-active subscription first with honest
  status badges
- **AI plans with gated quality** — generation draws from the client's own
  balance (ownership-checked); the nutrition generator computes all
  calories/macros server-side (Mifflin-St Jeor BMR → activity TDEE → goal
  adjustment) and re-enforces them on the parsed output. Every AI payload —
  full plans and every regeneration level — passes a mandatory validator
  (calorie targets, bounded real numbers, recomputed totals,
  food-library-grounded estimates) with one named-reason repair retry before
  an honest fallback (`src/lib/plan-ai-validation.ts`,
  `src/lib/plan-food-grounding.ts`). The coach picks the diet type
  (balanced / keto / low-carb / vegetarian / vegan) before generating —
  `src/lib/diet-types.ts` is the shared contract. Every meal may carry up to
  two validated whole-meal alternatives (owner directive #2 — same item
  constraints and keto laws as the primary meal, recomputed totals), shown
  in the member plan view, the coach editor and the print export; workout
  plans keep their AI-written overview / weekly volume / progression, ship
  a deterministic multi-week training-intelligence stamp (WOR-7: a 4-week
  periodization wave — base / loading / peak / week-4 deload — per-muscle
  weekly volume bands, warm-up & cool-down contract, and a goal-keyed
  cardio prescription; server math via `src/lib/workout-periodization.ts`,
  attached to every AI and local-fallback generation, rendered in the
  member plan view, the coach editor and both print exports), and a
  critical independent-audit finding (injury-unsafe pick, home-equipment
  mismatch) raises a needs-review banner on the plan instead of being saved
  silently. The audit's exercise lookup is world-agnostic (it resolves every
  exercise in the full library to learn its TRUE equipment, level and slug —
  so a barbell/cable/machine exercise inside a HOME client's plan surfaces
  as a critical finding instead of silently passing, GAP-19 of the
  operational test plan), rides BOTH generation paths (AI chain and local
  fallback — one attachment, `attachIndependentWorkoutAudit`), and a
  word-level gym-equipment name belt (Barbell/Cable/Machine/Smith —
  Arabic or Latin) fires the same finding even when no library entry
  matches, while the image/link enrichment keeps its client-world
  equipment honesty. AI plans also carry observable generation provenance
  (INF-4): the provider chain tags every answer with a quality tier, and a
  plan answered by the chain's small/last-resort tail models is badged
  «موديل ذيل — راجع العمق» in the coach's plan modal (the serving
  model/provider are persisted on the plan content) — plus the structured
  plan tasks sample at aligned low temperatures (INF-9: 0.5-0.6, rollback
  via `AI_ROUTER_MODE=legacy`)
- **Durable swaps** — every swap kind (meal / item / exercise) on every
  surface survives a closed tab: the queue runner materializes the gated
  replacement straight into the plan row, with enqueue-time and runner-time
  ownership verification. Exercise swaps honor the client's training
  location and experience level (from the fitness questionnaire) — home
  clients get home-equipment substitutes and beginners never draw advanced
  moves
- **Plan editor** — a food-library combobox over `/api/food-search`, one pure
  recompute chain for every edit (`src/lib/nutrition-totals.ts`), a separate
  calorie-target control that regenerates the plan when the change exceeds
  the consistency band, and verified draft/plan deletion
- **Wallet system** — fixed per-client activation pricing paid to the
  platform, receipt-reviewed top-ups (InstaPay / Vodafone Cash / PayPal),
  activation gated on sufficient balance
- **Public coach pages** — claimable slug, landing editor, certificates
  (`/coaches/[slug]`), with admin approve/reject and on-demand cache
  invalidation
- **Affiliate program** — commission on referred subscription payments,
  minimum payout, holding period, automatic reversal on refunds
  (`src/lib/affiliate-engine-server.ts`)

### Site coaches (B2C) & the admin platform
- Every coach is `site` (platform-employed) or `b2b` (independent business) —
  one-tap toggle in the admin roster; site coaches follow up platform
  members 1↔1 through a dedicated assignments surface
- **Admin panel** (`/admin`, admin-only): unified client roster with
  role/lifecycle filters, finances (site money vs coach money), payments and
  the refund console, blog CMS, coach-system center, wallets, leads,
  referrals, saved results, EVO analytics, admin-editable site copy
  (`/admin/site-content`), and local EGP pricing
- **Payments** — PayPal (create / capture / webhook, idempotent capture) plus
  manual review (InstaPay / Vodafone Cash / bank transfer); the Egyptian
  manual rails display an auto-converted EGP twin refreshed daily from
  ExchangeRate-API by a scheduled workflow (`src/lib/local-prices.ts`)
- **Dual-currency price display (site-wide)** — every price surface shows
  USD first with its EGP equivalent beside it («$14.99 أو 830 جنيه مصري» /
  «$14.99 or 830 EGP»): landing, memberships, coaching, checkout (including
  the PayPal total, where the twin is labeled indicative — the charge stays
  USD), about, comparison tables, the affiliate page and the coach app
  (`src/lib/egp-display.tsx` + `src/components/egp/EgpTwin.tsx`). One shared
  client reader reuses the daily ExchangeRate-API layer — one
  `/api/local-prices` request per page load, no parallel conversion system,
  and zero changes to any charge amount or transaction currency; the
  manual rails keep the exact locked EGP transfer figure. Governing report:
  `docs/DUAL-CURRENCY-DISPLAY-2026-11-13.md`

---

## 🏗️ Architecture at a glance

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 · Tailwind CSS 4 · shadcn/ui |
| Language | TypeScript 5 (strict) |
| Database | Supabase — Postgres, Auth, Storage, Row Level Security |
| AI | OpenRouter · Groq · NVIDIA NIM · Gemini · Cloudflare Workers AI + Tavily/Exa search — one unified layer (`src/lib/ai-provider.ts`) |
| Payments | PayPal + manual review rails |
| Email | Brevo REST API |
| Charts | Recharts (lazy-loaded) |
| Testing | Vitest + Testing Library |
| PWA | manifest + service worker (installable) |
| Origin | AWS Lightsail — PM2 + Caddy |
| Edge | Cloudflare (DNS, TLS, cache, rate limiting) |

### Repository layout

```
alkemos/
├── src/
│   ├── app/                    # Next.js App Router — public site, /ar Arabic
│   │                           #   mirror, authenticated member area, /admin,
│   │                           #   and /api routes
│   ├── components/             # Page-level views, shadcn/ui primitives,
│   │                           #   shared components (header, footer, EVO widget)
│   ├── hooks/                  # React hooks (auth, nav, tier, voice input…)
│   ├── lib/                    # Business logic, data layer, datasets, AI,
│   │                           #   i18n, share links, SEO — e.g.
│   │                           #   memberships.ts (tiers/pricing single source),
│   │                           #   tier-limits.ts (quota engine),
│   │                           #   exercises.ts / foods.ts (server-only datasets),
│   │                           #   ai-provider.ts (unified AI layer),
│   │                           #   seo.ts (JSON-LD generators)
│   └── supabase/               # Clients + generated DB types
│   └── middleware.ts           # Session refresh + locale/lang/dir handling
├── supabase/migrations/        # Versioned migration registry (INDEX.md = ledger)
├── scripts/                    # CI gate scripts + pipeline runners
├── .github/workflows/          # CI gates + scheduled content/ops pipelines
├── deploy/                     # Server-side deploy assets (Caddyfile, PM2,
│                               #   setup/deploy/rollback scripts)
├── docs/                       # Project documentation (index: docs/README.md)
├── public/                     # Static assets, exercise images, PWA files
├── archive/                    # Frozen historical records (append-only)
├── STATE.md                    # Live project status (official status file)
├── DEVELOPER_GUIDE.md          # Developer onboarding + architecture
└── SECURITY.md · CONTRIBUTING.md · LICENSE
```

### Bilingual by architecture
- A full Arabic RTL mirror at `/ar/*` — every public surface exists in both
  languages with reciprocal hreflang pairs
- Dynamic `lang` / `dir` on the root HTML tag per route locale, and a
  `Content-Language` header from middleware
- A custom lightweight i18n provider (no next-intl) with shared AR/EN copy in
  the source; Arabic content follows a Modern-Standard-Arabic purity law
  enforced by CI-tested detectors (`src/lib/blog-msa.ts`)
- **Unified Choice Law (phase 450, superseding 449's two-governor split):**
  the RECORDED choice (`mhe:lang` — cookie-first, localStorage fallback)
  governs the UI language on EVERY surface for anyone who has one: the
  dynamic (app) layout server-renders the account surfaces'
  (/admin /auth /checkout /profile + the (authed) subtree) lang/dir from
  the FIRST HTML, and one central structural mirror map (`mirrorPath` in
  `src/lib/surface-locale.ts`, canary-pinned against the route folders)
  is consumed by the language toggle, `use-nav` (every chrome view
  navigation — logo, account buttons, logout landing — lands directly in
  the chosen tree) and the `UrlLocaleSync` client safety net (a
  wrong-tree public URL — edge-cache HIT, external link — is replaced to
  its mirror; a first `/ar` visit is passively recorded so a first-time
  Arabic reader gets an Arabic `/auth`). Choice-less visitors and
  crawlers keep the 447 URL law byte-identical (zero redirects, public
  cache untouched); single-language content (blog articles without a
  linked twin) serves in its own language, both directions
- **Boundary Recorder (phase 451 — the choice handoff is
  generation-proof):** the 450 client enforcers ship in the PUBLIC
  pages' JS chunks, which the Cloudflare edge can serve up to 12h stale
  after a deploy — so a language choice made on a public page during
  that window never reached the cookie and the account surfaces (whose
  SSR reads only the cookie) rendered English first. The always-fresh
  server twin now lives in the middleware: a crossing INTO a special
  surface with NO recorded choice derives the reading language from a
  same-origin `/ar` referer, injects it into the request cookies (the
  (app) layout renders the right lang/dir from the FIRST HTML — zero
  flip) and persists it via Set-Cookie (private surfaces only — public
  responses stay Set-Cookie-free); a recorded choice is never
  overridden, no redirect is ever issued, and every verified deploy
  purges the CF edge for the two entry roots (`/` + `/ar`) so the
  current client law goes live immediately

### Data layer
- Supabase Postgres with **Row Level Security on every auto-applied table**
  and role-aware RPCs for the admin roster
- The schema evolves through a **versioned migration registry** —
  `supabase/migrations/` with [`INDEX.md`](./supabase/migrations/INDEX.md) as
  the binding ledger; migrations apply to production through the repo-owned
  pipeline (the ledger-driven applier `scripts/db/apply_migrations.py` runs
  inside the deploy workflow *before* the code goes live, and the
  migration-state audit verifies application daily + on every push — see
  [`docs/DB-MIGRATION-PIPELINE-2026-10-27.md`](./docs/DB-MIGRATION-PIPELINE-2026-10-27.md))
- TypeScript DB types mirror the schema (`src/lib/supabase/types.ts`) and are
  audited against the migrations on every push
  (`scripts/migration_audit.py`)
- **Affiliate store family (`affiliate_store_*`, migrations 0115–0118)** —
  the affiliate store's EN-only tables (categories with a two-level
  `parent_id` tree, products with ASIN identity + the 0097 review flow,
  internal-surface bindings, insert-only click events) — RLS: public
  reads of published/active rows only, admin writes via the canonical
  channels, click events service-role-only. Renamed from `store_*` by
  the transitional migration 0118 (owner order 2026-11-26, zero data
  change) and fully independent from the site partner-referral family
  (`affiliate_transactions`/`affiliate_commissions`/`referral_*`) — the
  naming law of the store's governing document as amended by the rename
  order.
- **Food catalog CI build pipeline (`scripts/food-catalog/`, owner order
  2026-11-28 — Wave-1 item F3-أ of the openCalory integration review)** — a
  forked, self-contained pipeline that compiles upstream open food datasets
  into a deduplicated catalog and exports a **data-only, idempotent SQL
  artifact** for the upcoming Supabase `food_catalog` tables (the F3-b
  frame owns the migration). It runs on GitHub Actions ONLY
  (`.github/workflows/food-catalog-build.yml`) — never on the production
  origin — with a full acceptance gate (documented count deviation, zero
  critical-missing rows, replay idempotency, determinism, size cap) plus a
  Rust deep-audit of the package; every run uploads its artifacts and
  reports for the import frame. See
  [`scripts/food-catalog/README.md`](./scripts/food-catalog/README.md)
- **Open food catalog tables (`food_catalog` + `food_catalog_aliases`,
  migrations 0123-0132 — Wave-1 item F3-ب)** — the ODbL open catalog, SEPARATE from
  the private Alkemos library by storage law (source rows verbatim; the
  logical merge happens at the query layer, never inside storage). RLS:
  public read, zero client write policies — the data lands through the
  repo's migration channel ONLY: the validated F3-a CI artifact's statements
  ship as data-only migration files applied by the re-linked
  Supabase-GitHub integration (each file atomic + upsert-idempotent, byte-
  identical to the artifact, provenance headers + integrity-gated), and the
  `food-catalog-import` workflow is the DIRECT import/verification track
  (artifact integrity sha256-gate → migrations-first → single-transaction
  import → live verification + table-size cap) available once
  `SUPABASE_DB_URL` is provisioned, running read-only verification until
  then. The data licenses + per-source attribution ledger:
  [`LICENSES-DATA.md`](./LICENSES-DATA.md)
- Daily automated JSON backups run to a **private** repository
  (`.github/workflows/db-backup.yml`) — user data never lands in this repo

### AI layer
One unified provider layer (`src/lib/ai-provider.ts`) is the only path to any
model:

- **Generation providers** — OpenRouter, Groq, NVIDIA NIM, and Google Gemini
  ride sequential strongest-model chains with a three-way lead rotation that
  spreads load across providers on every call; Cloudflare Workers AI serves
  specific agile roles (bilingual blog pairing, Arabic latin-token
  conversion) under a central neuron meter with a kill switch. No provider
  holds a forced priority — every arm fails over honestly.
- **Grounded-search arms** — blog research rides a language-split ladder of
  real search APIs: English leads with Exa semantic search, Arabic leads with
  Tavily, with Groq `browser_search` and a dormant Gemini grounding arm as
  tails; every arm must return live URL evidence.
- **Routing policy is data, not folklore** — every AI generation function on
  the platform (plans, the blog pipeline, editorial tools, social posts,
  visitor demos, EVO chat/eval) is registered in the data-only AI Function
  Registry (`src/lib/ai-registry.ts`: model ladder, call policy, gates,
  metering, rationale) and dispatched through the thin router
  (`src/lib/ai-router.ts`); call sites carry no inline routing policy, and a
  CI guard keeps the sole-door law on every push
  (`scripts/check-ai-router-guard.sh`).
- **Quality is gated, not hoped for** — plan generation and regeneration
  outputs pass the mandatory validator with food-library grounding; usage
  meters (provider × model × function, plus search-credit counters) ride
  inside the engine, fail-open by law, and record the provider-reported
  token usage of every response (not a chars/4 estimate) against a
  per-model cost table (`src/lib/ai-usage-meter.ts`).
- **Detected defects get REPAIRED, not just rejected** — a shared
  quality-repair core (`src/lib/quality-repair/`) turns every generation
  domain's deterministic gates into a directed repair cycle: defects are
  reported as structured records (kind + location + cause + actionable fix
  instruction), repaired by an escalating strategy ladder (deterministic
  dictionary → localized AI conversion → directed re-review), re-validated
  with a no-new-defect check, and every cycle must ACTUALLY change the
  content and strictly reduce the blocking defects — a retry that returns
  the same result is excluded, never repeated. When a defect cannot be
  repaired after the studied attempts, the honest ledger (defect, every
  strategy tried, why each failed) is recorded and the case NEVER passes
  as success. Live riders: the blog's Arabic dialect + Latin repair passes
  (the «حاجة» failure class), the P4/P5 repair contracts, the recipes
  authoring repair directives (preserved through the runner reset), the
  queued-article directed retry, and EVO chat's language/dialect repair
  (one directed regeneration, final replaces the streamed text).
- **Prompt-injection containment on every user-text surface** — any
  untrusted text that enters a generation prompt (live search results,
  client/coach free text: notes, allergies, injuries, swap reasons,
  article topics, demo notes) rides inside an explicit
  `<<<DATA — NOT INSTRUCTIONS>>>` boundary produced by one shared engine
  (`src/lib/prompt-injection-guard.ts`) with a paired directive that
  honors preferences WITHIN the standing laws while ignoring any line
  that tries to override the system instructions, the output contract, or
  the safety gates — the deterministic validators stay the hard
  enforcement either way (P2-4 of the generation-engines audit).
- **The daily recipes pipeline verifies its images by DISH FAMILY, not by
  meal slot** — the recipe pair's cover image is searched and matched
  against a family keyword derived from the dish's own bilingual theme
  (`src/lib/recipes-images.ts`: soup/salad/curry/… via a fixed
  dictionary, Arabic arms included), never against mealType
  (lunch/dinner), and a stock photo whose alt carries only generic
  food words is rejected — the walk continues, then an honest hold. The
  Arabic alt text is built from the Arabic ingredient names, and the
  publish battery scans that alt with the same MSA/no-latin law as the
  prose (holding with a rerun-r4-image directive), while the authoring
  schema mirrors the meta-title budgets per language (70 Arabic / 60
  English) so an over-budget title is rejected at the parse, before the
  image cycle ever runs (P2-7 of the generation-engines audit).
- **Generation engines stay clean by proof, not by promise** — the dead
  code and incoherences the 2026-11-15 audit identified were removed in
  one no-behavior frame (P2-8): the recipes publish battery's stamped
  gate count now derives from a single `GATE_IDS` list that a canary
  proves equals the gates the code actually emits; a missing nutrient
  reference at R2 holds the pair for a grounded R1 rebuild (the
  route's documented contract) instead of a terminal failure; the R1
  master slug can never collide on the global unique index; the
  latin-repair placeholder mechanism is NUL-collision-proof; the blog
  runner threads the queue id from P0 only; ONE `topicMatchesRecentPost`
  helper owns the topic-dedup call that used to be copy-pasted five
  times; the visitor demos' retry reminder speaks the prompt's language
  and the endurance goal is labeled endurance (`src/lib/recipes-quality-gates.ts`,
  `src/lib/blog-topics.ts`, P2-8 of the generation-engines audit).
- Long-running generation (the blog pipeline, queued AI jobs) runs on GitHub
  Actions runners instead of request handlers; every sequential path is
  budget-clamped, and the shared `ai_jobs` queue retries failures on a
  DB-scheduled backoff (`next_attempt_at` — a short window for transient
  errors, the 30-minute provider-cooldown window for quota-class ones,
  classified by the terminal error line) with processing-only CAS writes,
  so a failed job is never re-burned immediately and a late writer can
  never stamp over a row that changed state underneath it. A job that
  exhausts its attempts ceiling (`MAX_JOB_ATTEMPTS`) fails **permanently**:
  the stale-row reaper's verdict is split by the cap (below-cap rows
  requeue; at-cap rows are finalized as `failed`) and the claim itself
  refuses to grant an attempt beyond the cap — a collapsed job can never
  re-enter the queue automatically (INF-12 of the operational test plan).
  Retry after a final failure is a fresh request through the same unified
  generation paths (the member's own Plans section for site memberships,
  the coach's client page for trainer memberships); quota is success-only,
  so a failed attempt never burns the requester's balance.
- **Nutrition plans carry a clinical-safety layer and a medical disclosure**
  (`src/lib/plan-clinical-safety.ts`, NUT-12 of the operational test plan) —
  the member's declared health conditions (diabetes, hypertension, thyroid,
  pregnancy, celiac, … Arabic + English, spelling-drift tolerant) are
  classified deterministically from the questionnaire and steer generation
  three ways: a mandatory clinical block in the prompt (carb distribution
  for diabetes, sodium for hypertension, …), a hard item gate that rejects
  clinically prohibited foods exactly like allergens (the
  concentrated-sugar family for diabetics — dates/raisins/dibs included,
  with exercise-wording and lemon-juice dressing guards — and the gluten
  family for celiacs), and a client-facing **medical disclosure** stamped
  on EVERY generated plan — the clear warning to review the plan with a
  doctor or a qualified nutritionist BEFORE applying it, rendered on both
  the member's plan viewer and the coach's, with `data_analysis.health`
  echoing the questionnaire truth. The declared text is extracted through
  ONE canonical helper (`declaredHealthText`) that reads the REAL form's
  `medical` field (the live questionnaire key) with `health`/
  `medical_conditions` as legacy fallbacks — every clinical consumer
  (detection, prompt steering, item gate, disclosure) shares the same
  extraction, so a condition declared in the actual form can never again
  ride the payload invisible (GAP-18 of the operational test plan,
  hardened by an independent clinical-dietitian review: Egyptian-context
  keywords — hepatitis C/غدة/حصوات/جلطة… — a hypotension directional
  guard so «ضغط منخفض» never receives the low-sodium rule, a
  fasting/Ramadan-aware diabetes rule with hypoglycemia guidance, a
  diabetes×celiac merge line, and glucose-monitoring + stop-on-symptoms
  sentences in the condition-aware disclosure). Deliberately NOT a review
  hold: no trainer or in-platform approval is required — the member
  receives the plan with the warning. The warning itself (owner
  clarification 2026-11-17) does NOT depend on the 13-condition table:
  any NON-EMPTY declared health text that the table cannot classify
  (thalassemia, IBD, cancer…) still receives the EXPLICIT warning —
  consult a qualified specialist in clinical nutrition before following
  the plan; the plan does not replace medical consultation — while
  negative answers («لا يوجد», "none"…) keep the general form, and the
  same single `medicalDisclosureFor` builds it on every surface: the AI +
  local generation paths, the AI meal planner (/ai-meal-planner, its
  saved account copy and its on-page banner), coach-pasted plans (from
  the client's questionnaire), the member's print/PDF export, EVO-saved
  diet plans, and the admin external-plans text export.

### Automated content pipeline
The bilingual blog is generated end-to-end — research → outline → article →
images → review → publish — as scheduled GitHub Actions workflows, one English
and one Arabic article per day. The pipeline carries editorial gates: Arabic
Modern-Standard purity, image-safety rules, FAQ single-display, and topic
selection deduplicated against the search-intent map (`src/lib/intent-map.ts`)
so articles never compete with canonical pages. When a deterministic publish
gate rejects a draft, the runner repairs it inside the same run (≤ 2 repair
cycles with machine-readable `rerunTarget` routing) before falling back to
the honest mark-failed + next-day backstop — no gate is ever weakened.

### Owner review workflow (honest E-E-A-T)
Every pipeline-published article lands in the **pending review** state — its
page honestly says "AI-generated · medical review pending" and the structured
data carries no review claims until one is true. The owner reviews from
**Admin → Blog**; approval stamps the real review date
(`blog_posts.review_status` / `last_reviewed_at`), after which the byline and
Article schema carry the true reviewed-by claims.

### SEO / GEO
JSON-LD structured data across the site (`src/lib/seo.ts`), dynamic XML
sitemaps (pages, blog, foods, exercises, collections, comparisons) with
truthful `lastmod` anchors, a `robots.txt` that welcomes AI crawlers,
`llms.txt` + `llms-full.txt` for generative engines, bilingual RSS feeds,
IndexNow + Bing submission, and dedicated Open Graph cards per surface
family. The internal-linking net is deliberate: generated articles get
deterministic tool links (`src/lib/blog-tool-links.ts` — Arabic articles link
the `/ar/` mirrors, and any EN tool URL a review model plants inside an AR
article is rewritten to the mirror), the eight tool
pages carry contextual article links and every paired article carries the
reverse tool link — one pair source, both directions
(`src/lib/tool-article-links.ts`). Citations in generated articles are allowed only as links to
whitelisted health authorities, and every external link is verified live at
publish. Internal `/blog/` links are verified deterministically at publish too
(`src/lib/blog-link-verify.ts`): each must resolve to a published slug of the
article's own language, and a dead or wrong-language link is unwrapped to its
anchor text. The article writer itself is grounded on the research stage's
extracted evidence — the top full-text pages (≤3 excerpts) ride the writing
prompt inside a data boundary, so body facts follow the live evidence instead
of model memory. A scheduled GEO probe measures how often Alkemos appears in AI
answers (`.github/workflows/geo-answer-visibility.yml`).

### Automated quality gates
Every push and pull request is audited on GitHub Actions by gates that
re-derive the truth from the code itself:

- **quality** — `tsc --noEmit` (0 errors), ESLint, and the full Vitest suite
  (path-scoped: doc-only pushes skip what they cannot change)
- **parity** — migration-registry heading vs filesystem truth, schema ↔ types
  mirror audit, and the knowledge-system consistency audit (state file
  integrity, number-free docs, registry coverage)
- **guard** — anti-regression scan for retired identifiers + broken UI wiring
  + the AI-router sole-door law
- **Supabase Preview** — migrations run against a preview database before
  production

Full narrative — what each gate derives and why: [`docs/CI_GATES.md`](./docs/CI_GATES.md)

---

## 🚀 Getting started

### Prerequisites
- **Node.js 20.9+** (CI runs Node 22 — or **Bun 1.3+**)
- A **Supabase** project (free tier works)
- An **OpenRouter** API key (free tier works — the platform uses free models;
  Groq, NVIDIA NIM, Gemini, and Cloudflare keys extend the chain)

### Install & run

```bash
git clone https://github.com/muscleshubfit-cpu/alkemos-aws.git
cd alkemos-aws
bun install                  # or: npm install
cp .env.example .env.local   # then fill in your keys
bun dev                      # or: npm run dev
```

Open http://localhost:3000.

Minimum environment for a working instance (full annotated reference in
[`.env.example`](./.env.example)):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API=sk-or-v1-xxxxxxxxxxxxx
```

**Demo mode:** without Supabase variables the app runs on localStorage —
demo coach `ahmed@coach.app` / `coach123`, demo client
`client@demo.app` / `client123` (seeded in `src/lib/data/auth.ts`).

### Database setup
Apply `supabase/migrations/` to your Supabase project (numeric files first,
then timestamped files in order — or simply `supabase db push` with the CLI).
The registry, naming laws, and manual-script rules live in
[`supabase/migrations/INDEX.md`](./supabase/migrations/INDEX.md). On this
repo's production the apply is automated by the repo-owned pipeline (the
`migrate` job in `deploy-aws.yml` + the daily migration-state audit), with
application verified — a green deploy is never assumed as proof.

---

## 🌍 Production hosting & deployment

The production origin is an **AWS Lightsail** instance (DNS cutover from
Vercel completed 2026-10-10; the migration record lives in
[`docs/archive/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md`](./docs/archive/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md)):

- **Runtime** — PM2 runs the Next.js server on `127.0.0.1:3000` in fork mode
  with a memory-restart valve (`ecosystem.config.js`); releases live under
  `/srv/alkemos/releases/<sha>` with an atomic `current` symlink flip
  (capistrano-style)
- **Edge on the box** — Caddy terminates TLS and reverse-proxies to PM2;
  `deploy/Caddyfile` replicates the platform's security headers and static
  cache rules
- **Global edge** — Cloudflare fronts the domain (DNS, TLS, the production
  HTML/image/sitemap cache layers, and `/api/*` rate limiting)
- **Deploy pipeline** — every code push to `main` runs the required tests
  (`tsc --noEmit` • ESLint • Vitest) in
  [`.github/workflows/deploy-aws.yml`](./.github/workflows/deploy-aws.yml)
  and deploys automatically on green: build → stage env (values synced from
  GitHub Secrets, never echoed) → safe activation with a
  `/api/build-info` health check → **automatic rollback** to the previous
  release on failure → a post-deploy verify battery (server vitals over SSH +
  edge checks). Doc-only pushes skip the deploy safely; manual
  `workflow_dispatch` stays for drills and re-runs. Manual rollback:
  `deploy/rollback.sh` on the server
- **Legacy posture** — [`vercel.json`](./vercel.json) is kept only for the
  documented DNS-rollback path; site URL, analytics, and ads integrations are
  env-configured

---

## 📚 Documentation

| Doc | What it covers |
|---|---|
| [`STATE.md`](./STATE.md) | Live project status — the single official status file |
| [`docs/README.md`](./docs/README.md) | Documentation index & lifecycle registry |
| [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) | Developer onboarding + architecture deep-dive (Arabic) |
| [`docs/TECH_REFERENCE.md`](./docs/TECH_REFERENCE.md) | Supabase, RLS, migrations, storage — deep technical reference (Arabic) |
| [`docs/CI_GATES.md`](./docs/CI_GATES.md) | The CI quality gates — what each derives and why |
| [`supabase/migrations/INDEX.md`](./supabase/migrations/INDEX.md) | Binding migration registry |
| [`.env.example`](./.env.example) | Annotated environment variable reference |
| [`SECURITY.md`](./SECURITY.md) | Security policy |
| [`docs/archive/AUTHORITY-ENGINE-RELATION-2026-11-09.md`](./docs/archive/AUTHORITY-ENGINE-RELATION-2026-11-09.md) | The independent Authority Growth Engine (backlinks) project — its relation to this site, isolation guarantees, and verified results (Arabic) |
| [`docs/healthy-recipes-platform/`](./docs/healthy-recipes-platform/) | The Healthy Recipes platform — the full repository audit and the executable implementation plan for the bilingual daily recipes engine (Arabic; executed in full P1→P9 on 2026-11-10; the daily pair's failure forensics + root-cause fix lives in `docs/archive/RECIPES-WORKFLOW-FAILURE-FORENSICS-2026-11-12.md`) |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Contribution policy (proprietary — issues only) |
| [`worklog.md`](./worklog.md) | Active task log (full history in `archive/`) |
| [`CHANGELOG.md`](./CHANGELOG.md) | How change history is tracked in this repo |
| [`LICENSE`](./LICENSE) | Proprietary license terms |

Living docs stay slim by law; the dated files under `docs/` are the governing
reports of past work (audit, incident, and implementation records), and
`archive/` holds the frozen history.

---

## 🤝 Contributing & security

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the contribution policy
(proprietary project — issues first, no unauthorized redistribution) and
[`SECURITY.md`](./SECURITY.md) for the security policy, secrets handling, and
vulnerability reporting. Agents and automation working on this repo are bound
by [`AGENTS.md`](./AGENTS.md).

---

## 📝 License

This project is **proprietary**. All rights reserved — see
[`LICENSE`](./LICENSE).

You may **NOT** redistribute it, deploy a competing service, remove the
license notice, or use it to train commercial code-generation models.
Production infrastructure, customer data, financial data, and confidential
business information never appear in this repository.
