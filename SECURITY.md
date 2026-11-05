# SECURITY.md — Alkemos Security Policy

> **Owner:** muscleshubfit@gmail.com
> **Reporting security issues:** see §8 below.

This document defines the security posture, secrets policy, and rules
for AI agents working on the Alkemos codebase. It complements
`AGENTS.md` (operating rules) and `DEVELOPER_GUIDE.md` (architecture).
The production origin is the AWS Lightsail deployment described in
`DEVELOPER_GUIDE.md` §10; this file describes the security laws that
hold regardless of host.

---

## 1. Threat Model Summary

Alkemos is a proprietary-codebase, production-deployed web app that
handles:

- User authentication (email/password + Google OAuth).
- Personally identifiable information: email, phone, body metrics,
  progress photos.
- Payment-adjacent data: payment receipts (InstaPay / Vodafone Cash
  transfer screenshots), subscription tier, billing period.
- AI-generated content (blog articles, plans, chat).
- A coach-side admin surface with access to all clients' data.

The code is proprietary and confidential (see `LICENSE`), and
authorized collaborators and AI-agent sessions read it. The security
model therefore relies on defense-in-depth that assumes the code
COULD leak:

1. Server-side enforcement (RLS, route handlers, auth helpers) —
   never trust the client.
2. Secrets that are never committed.
3. RLS policies that are correct and tested.
4. Headers that harden the deployed site (HSTS, X-Frame-Options,
   etc. — enforced at the origin edge by `deploy/Caddyfile`, kept
   byte-identical to the `vercel.json` legacy posture).

---

## 2. Secrets Policy

### 2.1 What counts as a secret

Any of the following:

- Supabase URL, anon key, service-role key.
- AI provider keys: OpenRouter / Groq / NVIDIA NIM / Gemini /
  Cloudflare Workers AI, plus the Tavily and Exa search keys (see
  §3.1 — the provider set lives in `src/lib/ai-provider.ts`).
- Stock-photo provider keys: `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`,
  `PIXABAY_API_KEY` (blog images are real photography, not
  AI-generated).
- `CRON_SECRET` (authenticates GitHub Actions → `/api/cron/*` calls)
  and `GITHUB_DISPATCH_TOKEN` (fine-grained GitHub PAT for workflow
  dispatch from `/api/cron/dispatch-pipelines` — this repo only,
  Actions: Read+write).
- `EVO_CRON_SECRET` (the EVO followup dispatcher's separate secret).
- GitHub personal access tokens.
- Any OAuth client ID + secret pair.
- Any future `*_API_KEY` env var added to `.env.example`.

### 2.2 Storage

- Local development: `.env.local` (chmod 600, gitignored — pattern
  `.env*` in `.gitignore`).
- **Production:** secret values live as **GitHub repository Secrets**
  and are staged by the deploy pipeline onto the server's shared env
  file (`/srv/alkemos/shared/.env`) at every deploy — an additive,
  idempotent merge that logs key NAMES only, never values. The server
  env file itself is root-only on the box. Values are never logged
  anywhere.
- **GitHub Actions:** every secret consumed by a workflow (provider
  keys, `CRON_SECRET`, `BING_WEBMASTER`, backup tokens, QA probe
  credentials…) is stored ONLY as an encrypted repository secret.
  Runner logs carry statuses, counts, and masked forms exclusively.
- The agent's own working clone of the repo: the agent must use the
  same `.env.local` pattern. The agent must NEVER commit `.env.local`
  or any file matching `.env*`.
- Non-secret feature/rollback flags are documented here (NOT secrets —
  they carry no credential value): `LATIN_REPAIR_LEGACY` ("1" rolls
  the AR Latin-repair back to the full-article AI call — debug/
  rollback lever only) · `GROQ_MAX_TOKENS_CLAMP` ("0" rolls the Groq
  oversized-payload guard back to wholesale drop) ·
  `GEMINI_GROUNDED_ENABLED=0` (removes the dormant Gemini search arm)
  · `CF_ARM_ENABLED=0` (Cloudflare role kill switch) ·
  `GROUNDED_ARM_ORDER` (overrides the search-arm walk) ·
  `AI_ROUTER_MODE=legacy` (frozen pre-unification router snapshot).

### 2.3 Forbidden actions

- Committing a secret in source code, comments, test fixtures, README
  examples, or commit messages.
- Logging a secret via `console.log`, `JSON.stringify`, error
  reporters, or analytics calls.
- Pasting a real production key into a chat conversation with a
  reviewer (use the masked form — `maskKey()` in
  `src/lib/ai-provider.ts`).
- Hard-coding a coach email or admin identifier (the codebase moved
  off a hard-coded maintainer email to the `COACH_EMAILS` env var —
  keep it that way).
- Storing secrets in client-side code. Anything prefixed
  `NEXT_PUBLIC_` is exposed to the browser — only the anon Supabase
  key, GA ID, and AdSense client ID are allowed there. **The
  service-role key must NEVER be prefixed `NEXT_PUBLIC_`**.

### 2.4 If a secret is leaked

1. Stop. Do not push.
2. Notify the owner immediately.
3. Rotate the leaked credential at the provider.
4. Owner cleans git history if needed (rotation is mandatory
   regardless: any secret that ever touched a public surface must be
   treated as exposed).

---

## 3. API Key Policy

### 3.1 AI provider keys

**FIVE generation providers — OpenRouter, Groq, NVIDIA NIM, Google
Gemini, Cloudflare Workers AI — plus TWO search arms: Tavily and Exa
(search/extraction only, never generators).** No provider holds a
forced priority; every slot in every ladder is a measured decision,
and every arm fails over honestly. The single source for providers,
models, and ladders is `src/lib/ai-provider.ts`; routing policy lives
in the data-only registry `src/lib/ai-registry.ts` (dispatched via
`src/lib/ai-router.ts`).

- Stored as server-side env vars only: `OPENROUTER_API` (alias
  `OPENROUTER_API_KEY` accepted), `GROQ_API_KEY`, `NVIDIA_API_KEY`,
  `GEMINI_API_KEY` (single optional tail key — a second Gemini key is
  retired permanently; no code path reads one), `TAVILY_API_KEY`,
  `EXA_API_KEY`, `CLOUDFLARE_AI_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.
- **Gemini** rides a native adapter inside `src/lib/ai-provider.ts`
  (`x-goog-api-key` header; the Gemini SDK stays banned). A gemini
  entry is a TAIL slot of both chains (skipped keyless without
  consuming attempt budget) and the dormant last arm of grounded
  search. Usage tracked per-tag (`src/lib/ai-usage-gemini.ts`,
  fail-soft).
- **Tavily** (free Researcher plan, no card): consumed by
  `callTavilySearch` only — the FIRST arm of the Arabic grounded
  ladder and second on English. Real search → live-URL evidence gate
  → research-JSON synthesis. NEVER a generation provider.
- **Exa** (free plan with recurring monthly credit, no card):
  consumed by `callExaSearch` only — the FIRST arm of the English
  ladder (semantic search) and third on Arabic with the
  English-equivalent query. Optional full-text deepening (Exa
  /contents with Tavily /extract as the alternative) never fails an
  article. NEVER a generation provider.
- **Cloudflare Workers AI** (free tier daily neuron allocation, no
  card): consumed by the first-wave AGILE ROLES only — the bilingual
  blog-pairing call and the Arabic latin-token conversion — under a
  central neuron meter (warning threshold + drain-guard barrier that
  skips every new CF call honestly so the allocation is never drained
  to zero; `src/lib/ai-cf-usage.ts`). NEVER the heavy generation
  chains, never the streaming chat (EVO is excluded structurally).
  Rollback without code: `CF_ARM_ENABLED=0` or absent secrets — the
  role entries are skipped without consuming attempt budget.
- Direct third-party AI HTTP calls outside `src/lib/ai-provider.ts`
  are forbidden (new external calls are a §7 pre-approval category).
- Read by `src/lib/ai-provider.ts` (the `get*Key()` accessors +
  `getEnvConfig()`) — server-only. This file must NEVER be imported
  by a client component.
- The "AI Settings" page (admin-only) stores per-admin overrides in
  HTTP-only cookies on the admin's browser (`mergeOverride()` in
  `ai-provider.ts`). The key is never returned to the client — only
  the masked form via `getStatus()`.
- If a key is rotated: update the GitHub repository secret (the next
  deploy stages it to the server) and any local `.env.local`.

### 3.2 Supabase keys

- `NEXT_PUBLIC_SUPABASE_URL` — public (it's the API endpoint).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public-by-design (Supabase anon
  keys are designed to be shipped to the browser; RLS enforces
  authorization).
- `SUPABASE_SERVICE_ROLE_KEY` — **SECRET. Bypasses RLS.** Used only
  by `src/lib/supabase/admin.ts`. Must NEVER be imported by a client
  component, NEVER prefixed `NEXT_PUBLIC_`, NEVER logged.

### 3.3 CRON_SECRET / EVO_CRON_SECRET

- `CRON_SECRET` authenticates the scheduled GitHub Actions pipelines
  (blog EN/AR, dispatchers) calling the `/api/cron/*` routes.
- Stored as a GitHub Secret (for Actions) and in the server
  environment (staged by the deploy pipeline).
- The `/api/cron/*` routes verify the bearer token through
  `verifyCronAuth()` (`src/lib/cron-auth.ts`) — a CONSTANT-TIME
  comparison (`crypto.timingSafeEqual`). A plain
  `Authorization === "Bearer …"` string compare is FORBIDDEN (it
  leaks prefix-match timing).
- `EVO_CRON_SECRET` is the EVO followup dispatcher's SEPARATE secret
  (`/api/evo/followup/dispatch`, header `x-cron-secret`), verified
  with the same timing-safe atom `timingSafeSecretEqual()`. It may
  hold the same value as `CRON_SECRET` or a different one (owner's
  operational choice — it rotates independently either way).
- If leaked: rotate the GitHub Secret and re-deploy so the server
  picks up the new value.

---

## 4. Supabase Credential Policy

- The browser client (`src/lib/supabase/client.ts`) uses
  `createBrowserClient` from `@supabase/ssr` with the anon key. This
  syncs the auth session + PKCE verifier to cookies (NOT
  localStorage) so the server-side `/auth/callback` can exchange the
  OAuth code.
- The middleware (`src/middleware.ts`) uses `createServerClient` with
  the same cookie strategy. The middleware refreshes expired sessions
  on every request (scoped: anonymous requests and non-auth `/api/*`
  requests skip the Supabase client hop; route handlers validate
  their own sessions).
- The admin client (`src/lib/supabase/admin.ts`) uses the
  service-role key. It is server-only and bypasses RLS. It is used
  only by trusted server contexts: cron jobs, admin API routes where
  the caller has already been verified.
- Demo mode: when `NEXT_PUBLIC_SUPABASE_URL` is unset, the app falls
  back to a localStorage-backed demo mode. This is for previews and
  testing only — production must have all three Supabase env vars
  set.

---

## 5. Customer Data Policy

- Customer data is any data tied to a specific user: profile fields,
  body measurements, progress photos, meal plans, saved tool results,
  support ticket messages, questionnaires, payment receipts.
- Customer data lives in the production Supabase database. RLS
  policies enforce that a user can read/write only their own data,
  except for the coach who can read all clients' data (per the
  coaching service contract).
- **Agents must not read customer data.** If a task requires
  verifying something against the production database, the agent
  ships the SQL as a snippet in the final report and the owner runs
  it. Read-only verification queries are allowed only when necessary.
- **Agents must not modify customer data.** No `UPDATE`, `DELETE`,
  `TRUNCATE` against production. Any required data migration goes
  through `supabase/migrations/` and the repo-owned apply pipeline
  (see §6).
- Progress photos and questionnaire photos are stored in Supabase
  Storage buckets (`progress-photos`, `questionnaire-photos`,
  `receipts`) — all PRIVATE: objects are served exclusively through
  the authenticated `/api/file` proxy (owner-or-coach). Bucket
  policies must enforce that only the owner (or coach for their
  clients) can read these objects.
- Member avatars live in the separate PUBLIC `avatars` bucket —
  public URLs by design, because coach avatars render on public
  pages. ONLY avatars may be routed there; physique/questionnaire
  photos must never be uploaded to it.

---

## 6. Production Database Policy

- Agents do not hold production database credentials and never run
  write SQL (`DELETE`/`UPDATE`/`TRUNCATE`/`DROP`) against production
  (`AGENTS.md` §3.3; read-only verification queries are allowed when
  necessary).
- **QA Test-Accounts Channel exception** (full policy:
  `docs/QA-TEST-ACCOUNTS-2026-10-26.md`): agents may use the
  service-role key from the environment (`SUPABASE_SERVICE_ROLE_KEY`
  — never committed, never printed) for the guarded QA test-account
  lifecycle ONLY: creating/logging in as/resetting accounts under the
  reserved domain `@alkemos-test.com` with
  `profiles.is_test_account=true`, exclusively via
  `scripts/qa/test_accounts.py` (auth users through the Supabase
  admin API — no direct `auth.users` SQL; every write domain-guarded;
  the tool refuses every non-test target). This covers test accounts
  of ANY role including admin, used for live interface testing through
  the real app. Every other write-SQL rule in this section is
  unchanged: real rows, real accounts, `DELETE`/`TRUNCATE`/`DROP` of
  any kind, and RLS stay owner-only.
- **Migrations are applied to production by the repo-owned pipeline**
  (`docs/DB-MIGRATION-PIPELINE-2026-10-27.md`): the ledger-driven
  applier `scripts/db/apply_migrations.py` runs inside the deploy
  workflow's `migrate` job BEFORE the code goes live, and the
  `migration-state-audit` gate verifies on every push + daily that
  the latest migration is actually applied (filing an automated
  drift report on drift). A green code deploy is NEVER proof of DB
  migration application — this is the DEFAULT and only ordinary
  path.
- The ONLY manual path is the documented exception set: the
  `auth.users` migrations plus the legacy `RUN_ON_SUPABASE_*`/
  `VERIFY_*` files. Those deliveries attach the raw GitHub link + ONE
  consolidated `RUN_ON_SUPABASE_<IDs>.sql` (closing
  `NOTIFY pgrst, 'reload schema';` + VERIFY block) and the owner runs
  them via the Supabase SQL Editor (see `AGENTS.md` §6).
- Schema changes are written as **idempotent** migrations so
  re-running them is safe.
- A migration batch that ships without its apply channel **blocks its
  own deploy** (the incident class that built this pipeline).

---

## 7. Personal Data Policy

Alkemos processes the following categories of personal data:

| Category | Examples | Storage | Retention |
|---|---|---|---|
| Identity | email, display name | Supabase Auth + `profiles` table | Until account deletion |
| Contact | phone number | `profiles` table | Until account deletion |
| Body metrics | weight, body-fat %, measurements | `progress_entries` table | Until account deletion |
| Body photos | progress photos | Supabase Storage `progress-photos` bucket | Until account deletion |
| Questionnaire data | nutrition + fitness intake | `nutrition_questionnaires`, `fitness_questionnaires` | Until account deletion |
| Payment-adjacent | InstaPay/Vodafone receipt screenshots | Supabase Storage `receipts` bucket + `subscription_requests` row | Per financial record-keeping requirements |
| Support communication | support ticket messages | `support_tickets`, `ticket_messages` | Until account deletion |
| AI chat history | EVO chat messages (subscribers only) | `chat_messages` table (synced fire-and-forget) | Until account deletion |
| Tool leads | name, email, phone captured from free tools | `tool_leads` table | Per marketing consent |

### Analytics & advertising consent (GDPR/ePrivacy)

- The `CookieConsent` banner (`src/components/CookieConsent.tsx`) is
  the single consent surface: equal-prominence Accept/Reject, cookie
  categories in a zero-JS `<details>`, in-banner privacy-policy link,
  365-day consent record, and withdrawal-as-easy-as-giving via the
  privacy page's "Cookie settings" button.
- **GA/AdSense gating (Consent Mode v2):** the `consent-mode-v2`
  script renders ALWAYS and declares `gtag('consent', 'default',
  …denied)` BEFORE any Google tag loads — the order Google requires —
  then applies the visitor's STORED choice pre-tag. AdSense reads the
  same gtag consent state.
- No analytics/advertising cookies are set before consent; the
  `alkemos-consent-init` pre-paint script only reads localStorage to
  stamp a visibility attribute (no network, no cookie writes).

### Data subject rights

- **Access / export:** users can view their profile and saved results
  from the UI. A full export requires a manual SQL query by the
  owner.
- **Deletion:** account deletion is via Supabase Auth (cascades to
  user-owned rows per RLS / FK rules). The owner handles deletion
  requests manually.
- **Rectification:** users can edit their profile, questionnaires,
  and progress entries from the UI.

### Data residency

- Supabase region: configured at project creation (the production
  project ref is `wyopqryzfjifyeyvyxfy`).
- The AWS Lightsail origin runs in the region chosen by the hosting
  migration plan (eu-north-1 — `docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md`),
  fronted by the Cloudflare edge.
- Agents must NOT change hosting regions without explicit owner
  approval (data residency / latency trade-off).

---

## 8. Security Vulnerability Reporting

If you discover a security vulnerability in Alkemos:

1. **DO NOT open a public GitHub issue.** Disclosure must stay out of
   any tracked surface — report privately so a fix can ship before
   anyone could exploit the vulnerability.
2. Email the owner directly at `muscleshubfit@gmail.com` with the
   subject line `[SECURITY] Alkemos — <short summary>`.
3. Include:
   - Affected file(s) / route(s) / component(s).
   - A minimal proof-of-concept (curl commands, request bodies,
     etc.).
   - The impact (what an attacker could do).
   - Suggested fix, if any.
4. The owner will acknowledge within 72 hours and coordinate a fix +
   disclosure timeline.

Responsible disclosure is appreciated. We will credit reporters in
the commit that ships the fix (unless they prefer to remain
anonymous).

---

## 9. Rules for AI Agents (Security-Specific)

These are in addition to the general operating rules in `AGENTS.md`:

1. **Never commit secrets.** See §2.
2. **Never run write SQL against production.** See §6.
3. **Never weaken an RLS policy.** Any change to a policy must keep
   or strengthen its predicate; deletions require the raw link +
   owner review (§7 category).
4. **Never add a client-side write path** to a table that is
   service-role/admin-only today.
5. **Route ALL AI calls through `src/lib/ai-provider.ts`** (sole
   engine; dispatch via the router) — no direct provider HTTP calls
   from features.
6. **Never bypass the auth helpers** (`requireUser` / `requireCoach` /
   `requireAdmin`) with raw header parsing.
7. **Validate every API input with zod schemas** at the boundary
   (`src/lib/validation/schemas.ts`), with calibrated size limits.
8. **Rate-limit every public write surface** through the shared
   limiter `src/lib/rate-limit.ts` (Upstash-backed when configured).
9. **New security-relevant behavior must update this file in the same
   commit** (AGENTS.md §3.8).
10. **Treat `.env*` as toxic** in diffs, logs, screenshots, and
    reports — masked forms only.

---

## 10. Security Headers (Production)

Enforced at the origin edge by `deploy/Caddyfile` (which replicates
the `vercel.json` header block byte-for-byte — the legacy posture is
kept for the documented DNS-rollback path):

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years, include subdomains, opt into browser preload list |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking via iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage to cross-origin requests |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()` | Disable browser APIs the app doesn't use |

Cache headers (origin + edge consistent):

- `/images/*` → `public, max-age=86400` (24 hours)
- `/images/exercises/*` → `public, max-age=31536000, immutable` (1 year)
- `/images/brand/*` → `public, max-age=300, stale-while-revalidate=604800`
- `/_next/static/*` → `public, max-age=31536000, immutable` (1 year)
- `/_next/image*` → `public, max-age=86400` (24 hours)
- `/sw.js` → `public, max-age=0, must-revalidate` (always revalidated)

### CSP (Report-Only)

The `Content-Security-Policy-Report-Only` header carries a whitelist
matching the LIVE third-party stack (GA4, Cloudflare Web Analytics,
AdSense anti-fraud + reCAPTCHA frames) so remaining reports are
genuine enforcement signal. The `report-uri` directive is NOT set
(each browser report would burn an uncacheable origin request); the
`/api/csp-report` route stays as a 204 sink. The policy remains
Report-Only pending an owner enforcement decision.

### Cloudflare — the OFFICIAL production HTML cache layer

`alkemos.com` resolves through Cloudflare BEFORE the origin, and the
zone runs FOUR cache rules that own the production caching behavior
(the zone Browser-Cache-TTL is `Respect Existing Headers` — the
RULES, not the zone setting, are the source):

- **Rule 1 — public HTML cache** (`alkemos-public-html-cache`):
  applies to public HTML pages only (private-path exclusion list:
  api/admin/auth/checkout/dashboard/questionnaires/progress/plans/
  profile/support/referral/preview/coach + dotless page paths).
  Behavior: `cache=true` · Edge TTL **43200s** (12h) · Browser TTL
  300s. Trade-off (documented): edits to an already-cached page can
  take up to 12h to appear on a warm PoP; NEW URLs are never
  pre-cached, so crawler discovery via sitemap/RSS is unaffected.
- **Rule 2 — OG image cache** (`alkemos og-image-cache`):
  `/api/og-image/*` · `cache=true` · Edge TTL **86400s** · Browser
  TTL respect-origin. Never overlaps rule 1 (which excludes `/api*`).
- **Rule 3 — sitemap/RSS/llms/robots cache**: `/sitemap*`,
  `/rss.xml`, `/robots.txt`, `/llms*` · Edge TTL **3600s** (matches
  the routes' own ISR revalidate) · Browser TTL respect-origin.
  Bot fetches stop hitting the origin on every crawl; worst-case
  staleness = 2h (1h edge + 1h ISR).
- **Rule 4 — RSC cache bypass**: requests with `_rsc` query or `RSC:
  1` header · `cache=false`. Cache Rules are stackable and the LAST
  matching rule wins, so this rule sits after rule 1 and overrides
  its `cache=true` for RSC requests only — soft navigation receives
  the `text/x-component` payload instead of cached HTML.
- **Layering law:** the `next.config.ts` headers rule stays the
  ORIGIN-side policy (what the origin emits on every non-CF path).
  Any future change to production HTML caching is a CLOUDFLARE
  dashboard change first, with this section + `docs/TECH_REFERENCE.md`
  updated in the same commit (§3.8) — a code-only cache change that
  contradicts this rule is a documentation defect.

---

## 11. Authentication & Authorization Summary

### Authentication

- Email/password via Supabase Auth.
- Google OAuth via PKCE flow (the `@supabase/ssr` cookie-based
  strategy is critical — see `src/middleware.ts` header comment for
  the failure mode if middleware is missing).
- Session refresh handled in middleware (scoped: anonymous requests
  and non-auth `/api/*` requests skip the Supabase client hop; route
  handlers validate their own sessions via `getAuthUser()`).
- Demo mode (no Supabase env vars): two seeded demo accounts
  (`ahmed@coach.app` / `coach123`, `client@demo.app` / `client123`)
  backed by localStorage (single source: the seed in
  `src/lib/data/auth.ts`).

### Authorization

- **Client-side tier resolution:** `useMembershipTier(profile)` hook
  queries the `subscriptions` table and picks the highest-priority
  active membership.
- **Server-side tier resolution (SINGLE SOURCE OF TRUTH):**
  `resolveMembershipTier()` in `src/lib/membership-tier.ts` is the
  one resolver shared by BOTH server entry points — `getAuthUser()`
  (API routes via requireUser/requireCoach/requireAdmin) and
  `getAuthUserFromHeaders()` (server components / coach preview).
  Pinned by `src/lib/__tests__/membership-tier.test.ts`.
- **Tier priority order (verified from code):**
  `pro` > `premium` > `free`. `coaching` is treated separately — it
  grants EVO access equivalent to Premium but is NOT a higher
  membership tier. The resolver keeps a defensive legacy-row map so a
  stray legacy row can never DOWNGRADE a paying client to "free".
- **RLS:** every auto-applied table in the database has RLS policies
  enforced. Per-table policy summary: `DEVELOPER_GUIDE.md` §4 and
  `docs/TECH_REFERENCE.md` §2.
- **Role integrity:** `profiles.role` is structurally server-side
  only. A BEFORE INSERT/UPDATE trigger (`profiles_role_guard`)
  force-clamps any user-context INSERT to `client` and refuses every
  user-context role UPDATE unless a sanctioned SECURITY DEFINER
  function raised the transaction-local `alkemos.role_write` flag
  (`auto_promote_coach_if_allowed` / `admin_set_user_role`). A triple
  last-admin guard (row + statement-with-transition-tables + delete)
  makes "zero admins" impossible in any context. Every role change
  is attributed in `role_audit_log` (actor, channel, timestamp). The
  daily migration-state gate re-tests the guard live
  (`self_role_patch_rejected` + `at_least_one_admin` probes).
- **`is_coach()` SQL function:** SECURITY DEFINER function used by
  RLS policies to check staff status: `profiles.role IN ('coach',
  'admin')` (ROLE MODEL v2 — migration 0029 redefined it from the v1
  coach-only form). NEVER rewrite policies back to `= 'coach'` only.
  Full predicate set (`is_coach`/`is_admin`/`is_coach_over`/
  `coach_of`): `docs/TECH_REFERENCE.md` §2.2.

### Coach Self-Registration

- **Endpoint:** `POST /api/coach/register` — PUBLIC (it must be: it
  is the signup form behind `/for-coaches/register`). Hardened:
  - Rate limited through the shared cross-instance limiter
    `src/lib/rate-limit.ts` (fixed-window counters in Upstash Redis
    when configured, with the per-instance in-memory Map as the
    dev/demo-only fallback).
  - Honeypot field `website`: filled → fake success, nothing created.
  - Password minimum 8 chars enforced server-side (not just HTML).
- **Role assignment law:** the role is NEVER read from client-sent
  signup metadata. The auth user is created server-side with plain
  metadata; the service role then promotes the profile to `coach` and
  upserts `coach_emails` (`auto_promote_coach_if_allowed()`
  re-protects the role on every future login).
- The `handle_new_user()` trigger hardening: profiles are ALWAYS born
  `role='client'` — the trigger never trusts
  `raw_user_meta_data->>'role'`, so a hand-crafted signup API call
  cannot self-promote to coach on ANY signup path (email, OAuth,
  admin invite).
- **Instant activation trade-off (accepted by owner):** accounts are
  created with `email_confirm: true` — a DB-side trigger on
  `auth.users` stamps `email_confirmed_at` at insert (the dashboard
  autoconfirm setting is off and SMTP unconfigured). To switch back
  to email verification later: configure SMTP in the Supabase
  dashboard, then run the two DROP statements documented inside the
  0074 migration file.

### Coach-System Security Notes

- **Public storage bucket `coach-public`:** the only public bucket
  besides `avatars` — required because coach profile photos must
  render for ANONYMOUS visitors on public pages. Mitigations:
  - Writes are authenticated-only, scoped to the coach's own
    `<auth.uid()>/` folder via storage RLS.
  - Bucket caps: 5 MB/file, mime jpg/png/webp only; the landing API
    accepts only same-origin storage paths or https URLs and caps
    gallery entries with bounded captions.
  - **Content-risk trade-off (accepted):** a coach can publish
    arbitrary images on HIS OWN published page. Owner moderation
    lever: flip `coach_pages.is_published` off.
- **Ads (`coach_ads`):** no client-side write policies at all — every
  purchase runs through the server route, which debits the wallet
  atomically (refund on failure) and validates the package against
  the server-side constants.
- **Coach support messages:** RLS = coach reads/inserts his own rows;
  admin replies are service-role only (admin API is admin-guarded by
  role server-side).
- **Pricing authority:** `coachActivationCostUsd(months)`
  (`coach-limits.ts`) is the single debit calculator and takes ONLY
  the duration — fixed package pricing identical for every coach. The
  legacy per-coach fee table is RETIRED from the billing equation
  (inert legacy data, read by nothing on the billing path); its
  retired admin API must not be reintroduced.
- **Wallet top-up receipt ownership:** `POST /api/coach/wallet/topup`
  accepts ONLY the requesting coach's own receipt upload — receipts
  ride `POST /api/upload`, which rebuilds the storage path
  server-side as `receipts/<caller-uid>/<file>`, and the top-up route
  rejects any path whose uid segment does not match the authenticated
  caller. Browser-side Storage writes are banned by a guard test.

---

## 12. PayPal Payment Security

PayPal is the primary automated online payment method. Manual payment
receipts (InstaPay / Vodafone Cash) remain as alternative flows.

### 12.1 Credential surface

| Env var | Scope | Notes |
|---|---|---|
| `PAYPAL_CLIENT_ID` | Server-only | Used by `src/lib/paypal.ts` for OAuth2 + Orders API v2 |
| `PAYPAL_CLIENT_SECRET` | Server-only | NEVER prefix `NEXT_PUBLIC_`. Enables Order creation/capture |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Public (browser) | Loaded by `@paypal/react-paypal-js`. PayPal's design — safe to expose |
| `PAYPAL_WEBHOOK_ID` | Server-only | Used by `/api/paypal/webhook` for `verify-webhook-signature` |
| `PAYPAL_MODE` | Server-only | `sandbox` (default) \| `live` |

`src/lib/paypal.ts` is a server-only module. It must NEVER be
imported by a client component. The `PAYPAL_CLIENT_SECRET` is read
via `process.env` directly — Next.js guarantees these are not shipped
to the browser.

### 12.2 Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/paypal/create-order` | POST | User (logged-in) | Create a PayPal Order server-side. **Price is resolved server-side** from `resolvePlanPrice()` — the client NEVER sends the price, only `planTier` + `durationMonths`. |
| `/api/paypal/capture-order` | POST | User (logged-in) | Capture a PayPal Order server-side. **This is the AUTHORITATIVE payment confirmation** — the client-side `onApprove` callback only signals user intent. After a successful capture, the route calls ONE atomic RPC — `capture_paypal_subscription()` — which inserts the payment record and runs `extend_subscription()` in the SAME transaction, then triggers the affiliate commission. A replayed capture (sequential or the loser of a parallel race) resolves to an idempotent 200 with zero duplicate side effects. |
| `/api/paypal/webhook` | POST | PayPal (signature-verified) | Receives webhook events. **Audit trail only** — does NOT activate subscriptions or commissions. This prevents double-activation if both the webhook and the capture endpoint fire for the same order. |

### 12.3 Idempotency

PayPal's Capture API is idempotent by design. The integration stacks
four idempotency layers (the DB layer is the one that guards the
SITE's side of the money — PayPal only protects the buyer from being
charged twice):

1. **`PayPal-Request-Id` header** — same ID returns the same result
   without double-charging.
2. **HTTP 422 / `ORDER_ALREADY_CAPTURED`** — treated as success; the
   route fetches the order details to retrieve the capture result.
3. **DB claim-first atomic gates** — the money decision lives in the
   DATABASE, not the application:
   - `subscription_requests.paypal_order_id` carries a PARTIAL unique
     index; the RPC inserts the payment record FIRST as the atomic
     claim — a unique violation means "already processed" →
     idempotent success, NEVER a second extension — then calls
     `extend_subscription()` in the SAME transaction, so an extension
     failure rolls the claim back.
   - `coach_wallet_transactions (ref_id)` carries a PARTIAL unique
     index for top-ups; the wallet RPC catches that specific
     violation and returns the LIVE balance without a second credit
     — a parallel top-up race resolves to exactly ONE credit.
4. **Affiliate commission idempotency** — `affiliate_commissions` has
   a unique constraint on `transaction_id`; the PayPal order ID is
   used as `external_reference` so a duplicate capture call cannot
   create a duplicate commission.

### 12.4 Webhook signature verification

`/api/paypal/webhook` rejects any request whose signature does not
verify. Verification calls PayPal's
`/v1/notifications/verify-webhook-signature` API with all five
transmission headers + `webhook_id` from `PAYPAL_WEBHOOK_ID`. If
verification fails OR the config is incomplete, the route responds
**401** and the event is dropped (not logged as successful). This
prevents forged webhooks from polluting the audit trail.

### 12.5 What is NEVER logged

- `PAYPAL_CLIENT_SECRET` value — never logged, never returned.
- The PayPal OAuth2 access token — cached in-memory per process;
  never persisted to disk or DB; never sent to the browser.
- The buyer's PII from PayPal's response (shipping address, phone,
  etc.) is NOT logged — only the capture status and amount.
- The `custom_id` JSON (our own metadata) is safe to log.

### 12.6 Database touchpoints

| Table | Use |
|---|---|
| `subscription_requests` | After capture: a row with `status='approved'`, `payment_method='paypal'`, server-resolved `price_usd`, and `paypal_order_id` (the replay lock). |
| `coach_wallet_transactions` | Wallet top-up captures: one `kind='topup'` row per PayPal order, keyed by the deterministic `ref_id` (the parallel-race lock). |
| `affiliate_commissions` | If the user was referred, the commission is awarded using the PayPal Order ID as `external_reference` for idempotency. |
| `admin_notifications` | A bell notification is inserted so staff sees the PayPal payment in real time. |

### 12.7 Live-mode readiness

The integration is sandbox-tested and live-ready when the owner sets
the live credentials as repository secrets (staged to the server env
by the next deploy):

- `PAYPAL_MODE=live`
- `PAYPAL_CLIENT_ID` + `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (same value)
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID` (from the live PayPal app's webhook
  configuration — points to `/api/paypal/webhook` on the production
  domain)

No code changes are required to switch sandbox → live; the
`PAYPAL_BASE_URL` resolution in `paypal.ts` switches on
`PAYPAL_MODE`.

---

## 13. Incident Response

If a security incident occurs (e.g. suspected data leak, RLS bypass,
compromised key):

1. **Owner** is the incident commander. Notify immediately.
2. **Containment:** rotate the leaked key, revoke sessions
   (`supabase.auth.signOut()` for affected users), disable the
   affected endpoint if needed.
3. **Investigation:** review server logs (PM2/Caddy at
   `/var/log/alkemos/`), the Supabase audit log, and GitHub Actions
   runs.
4. **Recovery:** ship a fix, redeploy, verify.
5. **Postmortem:** written within 7 days, added to this file as a new
   section ("Past Incidents").

---

## 14. Past Incidents

_None recorded to date._

(When an incident happens, add a section here with: date, summary,
impact, root cause, fix, lessons learned. Keep it factual — no blame,
no marketing spin.)

---

## 15. Security-Relevant Feature Laws

Features with direct security relevance — recorded here so the policy
stays the single reference:

### 15.1 Queued AI Jobs — Staff Gates (JOB_GATE)

- `src/lib/ai-jobs.ts` classifies every job type; **staff-gated**
  types (admin/coach privileged work) are refused with **403** for
  plain clients at enqueue time (`/api/ai/jobs`) and again at
  processing time (the runner re-checks).
- Coach-path plan generation re-verifies **ownership** against
  `coach_assignments` before spending the client's quota — a coach
  can never bill another coach's client.

### 15.2 Admin-Only Non-Member Plans (external_plans)

- `external_plans` carries **RLS: `is_admin()` only** for every
  operation.
- `/api/admin/external-plans` is wrapped in `requireAdmin` — a coach
  session receives 403, and the `/admin/external-plans` UI redirects
  coaches via AdminGate.

### 15.3 Email Hardening

- `src/lib/email-validation.ts` — strict syntax + domain validation
  on both the client form and the `/api/send-email` server path.
- `/api/send-email` enforces a daily message cap counted from the
  `tool_leads` rows the flow itself creates (DB-derived, exact), plus
  per-IP and per-email rolling caps through the shared Upstash-backed
  limiter to contain abuse; the cron-secret-protected paths are the
  only bulk senders.

### 15.4 Refunds + Payout Safety

- Refund eligibility ("no features used") is computed **server-side
  from tamper-proof ledgers** (EVO chats/plans/swaps/coach
  plans/saved results) — never from client-supplied state
  (`src/lib/refund.ts`).
- Approving a refund **ends the subscription** and **reverses
  pending affiliate commissions** automatically.
- Affiliate subscription commissions are held for a holding period
  (`referral_earnings.available_at`): balances exclude held amounts
  and FIFO payout unlocking honors cancellations/refunds — a
  refunded payment can never be paid out as commission.
