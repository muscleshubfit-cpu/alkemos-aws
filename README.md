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
  [`docs/FOOD-DATA-ARABIZATION-PLAN-2026-09-19.md`](./docs/FOOD-DATA-ARABIZATION-PLAN-2026-09-19.md)).
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
Four tiers — Free, Premium, Pro, Coaching — with a unified monthly pool of AI
plan generations (only successful generations count; failed attempts and
edits never burn quota), weekly plan-swap quotas, saved-results capacity, and
export. Prices, quotas, and tier features are defined in a single source:
`src/lib/memberships.ts` + the quota engine `src/lib/tier-limits.ts`
(the aggregate resolver: `src/lib/membership-tier.ts`). Every paid tier
carries a 7-day conditional refund (no-features-used, ledger-based —
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
  `src/lib/diet-types.ts` is the shared contract
- **Durable swaps** — every swap kind (meal / item / exercise) on every
  surface survives a closed tab: the queue runner materializes the gated
  replacement straight into the plan row, with enqueue-time and runner-time
  ownership verification
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
  ExchangeRate-API by a scheduled workflow (`src/lib/local-prices.ts`),
  while PayPal stays USD-only

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
  inside the engine, fail-open by law.
- Long-running generation (the blog pipeline, queued AI jobs) runs on GitHub
  Actions runners instead of request handlers; every sequential path is
  budget-clamped.

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
deterministic tool links (`src/lib/blog-tool-links.ts`), the eight tool
pages carry contextual article links and every paired article carries the
reverse tool link — one pair source, both directions
(`src/lib/tool-article-links.ts`). Citations in generated articles are allowed only as links to
whitelisted health authorities, and every external link is verified live at
publish. A scheduled GEO probe measures how often Alkemos appears in AI
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
[`docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md`](./docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md)):

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
| [`docs/AUTHORITY-ENGINE-RELATION-2026-11-09.md`](./docs/AUTHORITY-ENGINE-RELATION-2026-11-09.md) | The independent Authority Growth Engine (backlinks) project — its relation to this site, isolation guarantees, and verified results (Arabic) |
| [`docs/healthy-recipes-platform/`](./docs/healthy-recipes-platform/) | The Healthy Recipes platform — the full repository audit and the executable implementation plan for the bilingual daily recipes engine (Arabic; planning approved-pending, nothing executed yet) |
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
