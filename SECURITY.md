# SECURITY.md — Alkemos Security Policy

> **Last updated:** 2026-09-24 (DOC-REMEDIATION-274 — repo visibility: PRIVATE by owner decision (§1/§8 updated) · §10 cache table re-derived from `vercel.json` (image-family split) · §11 `is_coach()` corrected to the migration-0029 role model v2 + demo email aligned with `src/lib/data/auth.ts` · previously 2026-09-22 improvements batch 245)
> **Owner:** muscleshubfit@gmail.com
> **Reporting security issues:** see §8 below.

This document defines the security posture, secrets policy, and rules
for AI agents working on the Alkemos codebase. It complements
`AGENTS.md` (operating rules) and `DEVELOPER_GUIDE.md` (architecture).

---

## 1. Threat Model Summary

Alkemos is a private-codebase (owner decision 2026-09-24 — the repository
was PUBLIC before that date, so history retains the public era),
production-deployed web app that handles:

- User authentication (email/password + Google OAuth).
- Personally identifiable information: email, phone, body metrics,
  progress photos.
- Payment-adjacent data: payment receipts (InstaPay / Vodafone Cash
  transfer screenshots), subscription tier, billing period.
- AI-generated content (blog articles, plans, chat).
- A coach-side admin surface with access to all clients' data.

The repository is private, but defense-in-depth still assumes the code
COULD leak (it was public until 2026-09-24, and authorized collaborators
and AI-agent sessions read it). The security model must therefore rely
on:

1. Server-side enforcement (RLS, route handlers, auth helpers) —
   never trust the client.
2. Secrets that are never committed.
3. RLS policies that are correct and tested.
4. Headers that harden the deployed site (HSTS, X-Frame-Options,
   etc. — set in `vercel.json`).

---

## 2. Secrets Policy

### 2.1 What counts as a secret

Any of the following:

- Supabase URL, anon key, service-role key.
- OpenRouter / Groq / NVIDIA NIM API keys (three-provider law since
  Phase 161, 2026-09-09 owner directive «تم اضافة مفتاح
  NVIDIA_API_KEY» — see §3.1; pre-161 docs saying "the only two"
  are stale).
- Stock-photo provider keys: `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`,
  `PIXABAY_API_KEY` (IMAGE SOURCE LAW v3 — blog images are real
  photography, not AI-generated).
- `CRON_SECRET` (used to authenticate GitHub Actions → Vercel cron
  calls) and `GITHUB_DISPATCH_TOKEN` (fine-grained GitHub PAT for
  workflow dispatch from `/api/cron/dispatch-pipelines` — this repo
  only, Actions: Read+write).
- Vercel / GitHub personal access tokens.
- Any OAuth client ID + secret pair.
- Any future `*_API_KEY` env var added to `.env.example`.

### 2.2 Storage

- Local development: `.env.local` (chmod 600, gitignored — pattern
  `.env*` in `.gitignore`).
- Production: Vercel project environment variables (plaintext at
  rest in Vercel, encrypted in transit). Never logged.
- GitHub Actions: `VERCEL_TOKEN` (project-scoped Vercel API token)
  stored ONLY as an encrypted repository secret — used exclusively by
  `vercel-cleanup.yml` / `scripts/vercel-cleanup/vercel-cleanup.mjs`
  to purge stale deployments (Phase 145, owner directive 2026-09-08).
  The runner logs deployment UIDs and HTTP statuses only — never the
  token itself (§2.3).
- The agent's own working clone of the repo: the agent must use the
  same `.env.local` pattern. The agent must NEVER commit `.env.local`
  or any file matching `.env*`.
- Non-secret feature/rollback flags are documented here (NOT secrets —
  they carry no credential value): `LATIN_REPAIR_LEGACY` (R2,
  2026-09-29) — "1" rolls the AR Latin-repair back to the pre-R2
  full-article AI call (debug/rollback lever only; the deterministic
  purity gates are byte-identical either way). Default empty/absent =
  the localized repair (dictionary pass + token-only small call).
  `GROQ_MAX_TOKENS_CLAMP` (R3, 2026-09-29) — "0" rolls the Groq
  oversized-payload guard back to the pre-R3 wholesale drop (every
  groq entry removed when the request estimate exceeds the 8k TPM
  window; debug/rollback lever only). Default empty/absent = the R3
  per-entry clamp (groq entries kept with reduced max_tokens while the
  clamp stays ≥ 3800 output tokens).

### 2.3 Forbidden actions

- Committing a secret in source code, comments, test fixtures, README
  examples, or commit messages.
- Logging a secret via `console.log`, `JSON.stringify`, error
  reporters, or analytics calls.
- Pasting a real production key into a chat conversation with a
  reviewer (use the masked form — `maskKey()` in
  `src/lib/ai-provider.ts`).
- Hard-coding a coach email or admin identifier (the codebase moved
  off `speerr@gmail.com` to `COACH_EMAILS` env var — keep it that
  way).
- Storing secrets in client-side code. Anything prefixed
  `NEXT_PUBLIC_` is exposed to the browser — only the anon Supabase
  key, GA ID, and AdSense client ID are allowed there. **The
  service-role key must NEVER be prefixed `NEXT_PUBLIC_`**.

### 2.4 If a secret is leaked

1. Stop. Do not push.
2. Notify the owner immediately.
3. Rotate the leaked credential at the provider.
4. Owner cleans git history if needed (rare — rotation is mandatory
   regardless: the repository was public until 2026-09-24, so any
   secret that ever touched history must be treated as exposed).

---

## 3. API Key Policy

### 3.1 AI provider keys

> **Updated (2026-09-09, Phase 161 — owner directive «تم اضافة مفتاح
> NVIDIA_API_KEY»):** THREE providers — OpenRouter, Groq, NVIDIA NIM.
> (The 2026-08-27 "only two providers" note was superseded; any doc
> still claiming two is stale.)

- Stored as server-side env vars only (`OPENROUTER_API`, with
  `OPENROUTER_API_KEY` accepted as an alias, `GROQ_API_KEY`, and
  `NVIDIA_API_KEY` — NIM is OpenAI-compatible at
  `integrate.api.nvidia.com`).
- Gemini native SDK / OpenAI / Anthropic / DeepSeek integrations were
  REMOVED from the codebase. Never reintroduce a direct third-party AI
  HTTP call without owner approval (§7 category: new external call).
- Read by `src/lib/ai-provider.ts` (`getOpenRouterKey()` /
  `getGroqKey()` / `getNvidiaKey()` / `getEnvConfig()`) — server-only.
  This file must NEVER be imported by a client component.
- The "AI Settings" page (admin-only) stores per-admin overrides in
  HTTP-only cookies on the admin's browser. The override path:
  `mergeOverride()` in `ai-provider.ts`. The key is never returned
  to the client — only the masked form via `getStatus()`.
- If a key is rotated, the env var must be updated in Vercel project
  settings AND in any local `.env.local`. A redeploy is required for
  Vercel to pick up the new value.

### 3.2 Supabase keys

- `NEXT_PUBLIC_SUPABASE_URL` — public (it's the API endpoint).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public-by-design (Supabase anon
  keys are designed to be shipped to the browser; RLS enforces
  authorization).
- `SUPABASE_SERVICE_ROLE_KEY` — **SECRET. Bypasses RLS.** Used only
  by `src/lib/supabase/admin.ts`. Must NEVER be imported by a client
  component, NEVER prefixed `NEXT_PUBLIC_`, NEVER logged.

### 3.3 CRON_SECRET / EVO_CRON_SECRET

- `CRON_SECRET` is used by the GitHub Actions blog pipelines
  (`.github/workflows/blog-post-en.yml` + `.github/workflows/blog-post-ar.yml`,
  language-split since 2026-08-27) and the Vercel cron job (progress
  reminder) to authenticate calls to `/api/cron/*` routes.
- Stored as a GitHub Secret (for Actions) and as a Vercel env var.
- The `/api/cron/*` routes verify the bearer token through
  `verifyCronAuth()` (`src/lib/cron-auth.ts`) — a CONSTANT-TIME
  comparison (`crypto.timingSafeEqual`, audit M6 2026-09-07). The
  former plain `Authorization === "Bearer …"` string compare is
  FORBIDDEN (it leaks prefix-match timing).
- `EVO_CRON_SECRET` is the EVO followup dispatcher's SEPARATE secret
  (`/api/evo/followup/dispatch`, header `x-cron-secret`). Since P1-6
  (deep-audit 2026-09-16, owner-approved §7) it is verified with the
  SAME timing-safe atom `timingSafeSecretEqual()` from
  `src/lib/cron-auth.ts`. It may hold the same value as `CRON_SECRET`
  or a different one (owner's operational choice — it rotates
  independently either way).
- If leaked: rotate in both GitHub Secrets and Vercel, then redeploy.

---

## 4. Supabase Credential Policy

- The browser client (`src/lib/supabase/client.ts`) uses
  `createBrowserClient` from `@supabase/ssr` with the anon key. This
  syncs the auth session + PKCE verifier to cookies (NOT
  localStorage) so the server-side `/auth/callback` can exchange
  the OAuth code.
- The middleware (`src/middleware.ts`) uses `createServerClient` with
  the same cookie strategy. The middleware refreshes expired
  sessions on every request.
- The admin client (`src/lib/supabase/admin.ts`) uses the
  service-role key. It is server-only and bypasses RLS. It is used
  only by trusted server contexts: cron jobs, admin API routes
  where the caller has already been verified as coach.
- Demo mode: when `NEXT_PUBLIC_SUPABASE_URL` is unset, the app falls
  back to a localStorage-backed demo mode. This is for previews and
  testing only — production must have all three Supabase env vars
  set.

---

## 5. Customer Data Policy

- Customer data is any data tied to a specific user: profile fields,
  body measurements, progress photos, meal plans, saved tool
  results, support ticket messages, questionnaires, payment
  receipts.
- Customer data lives in the production Supabase database. RLS
  policies enforce that a user can read/write only their own data,
  except for the coach who can read all clients' data (per the
  coaching service contract).
- **Agents must not read customer data.** If a task requires
  verifying something against the production database (e.g. "do any
  blog posts still have author = 'Ahmed Zake'"), the agent ships
  the SQL as a snippet in the final report and the owner runs it.
  The agent does not run `SELECT` against production from its
  context.
- **Agents must not modify customer data.** No `UPDATE`, `DELETE`,
  `TRUNCATE` against production. Any required data migration goes
  through `supabase/migrations/NNNN_*.sql` and is applied by the
  owner (see `AGENTS.md` §6).
- Progress photos and questionnaire photos are stored in Supabase
  Storage buckets (`progress-photos`, `questionnaire-photos`,
  `receipts`) — all PRIVATE: objects are served exclusively through
  the authenticated `/api/file` proxy (owner-or-coach). Bucket
  policies must enforce that only the owner (or coach for their
  clients) can read these objects.
- Member avatars live in the separate PUBLIC `avatars` bucket
  (migration 0090, 2026-09-20) — public URLs by design, because coach
  avatars render on public pages. ONLY avatars may be routed there;
  physique/questionnaire photos must never be uploaded to it.

---

## 6. Production Database Policy

- The production Supabase project URL is hardcoded in
  `archive/RUN_ON_SUPABASE.sql` header comment as
  `https://supabase.com/dashboard/project/wyopqryzfjifyeyvyxfy/sql/new`.
  This is the dashboard URL, not a connection string — it's safe to
  keep in the repo.
- Agents do not hold production database credentials and never run
  write SQL (`DELETE`/`UPDATE`/`TRUNCATE`/`DROP`) against production
  (AGENTS.md §3.3; read-only verification queries are allowed when
  necessary).
- **QA Test-Accounts Channel exception (owner directive 2026-10-26 —
  AGENTS.md §3.3/§6, full policy
  `docs/QA-TEST-ACCOUNTS-2026-10-26.md`):** agents may use the
  service-role key from the environment (`SUPABASE_SERVICE_ROLE_KEY` —
  never committed, never printed) for the guarded QA test-account
  lifecycle ONLY: creating/logging in as/resetting accounts under the
  reserved domain `@alkemos-test.com` with `profiles.is_test_account=true`,
  exclusively via `scripts/qa/test_accounts.py` (auth user through the
  Supabase admin API — no direct `auth.users` SQL; every write
  domain-guarded; the tool refuses every non-test target). This covers
  test accounts of ANY role including admin, used for live interface
  testing through the real app. Every other write-SQL rule in this
  section is unchanged: real rows, real accounts, `DELETE`/`TRUNCATE`/
  `DROP` of any kind, and RLS stay owner-only.
- Migrations are applied to production by the **repo-owned pipeline**
  (owner directive 2026-10-27 — `docs/DB-MIGRATION-PIPELINE-2026-10-27.md`):
  the ledger-driven applier `scripts/db/apply_migrations.py` runs inside
  deploy-aws.yml's `migrate` job BEFORE the code goes live, and the
  `migration-state-audit` gate verifies on every push + daily that the
  latest migration is actually applied (filing a `migration-drift` issue
  on drift). The previously trusted Supabase–GitHub integration applied
  0100 on 2026-10-02 (PRE-cutover repo) and never followed the project
  to the alkemos-aws repo created 2026-10-09 — 0101/0102/0103 landed
  unapplied under green deploys, with zero GitHub-side failure signals;
  a green code deploy is NEVER proof of DB migration application. This is the
  DEFAULT and only ordinary path — the same law lives in AGENTS.md
  §3.3/§6.
- The ONLY manual path is the documented exception set: the
  `auth.users` migrations (0040/0050/0055/0066 — an auto-migration
  failing on integration-role auth privileges would block the whole
  pipeline: the 0054 lesson) plus the legacy
  `RUN_ON_SUPABASE_*`/`VERIFY_*` files. Those deliveries attach the
  raw GitHub link + ONE consolidated `RUN_ON_SUPABASE_<IDs>.sql`
  (closing `NOTIFY pgrst, 'reload schema';` + VERIFY block) and the
  owner runs them via the Supabase SQL Editor (see AGENTS.md §6).
- Schema changes are written as **idempotent** migrations so
  re-running them is safe (this matters because production may
  already have the change applied via ad-hoc SQL).

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

### Analytics & advertising consent (GDPR/ePrivacy — Phase 178, 2026-09-12)

- The `CookieConsent` banner (`src/components/CookieConsent.tsx`) is the
  single consent surface: equal-prominence Accept/Reject, cookie
  categories in a zero-JS `<details>`, in-banner privacy-policy link,
  365-day consent record (`localStorage mhe_cookie_consent`), and
  withdrawal-as-easy-as-giving via the privacy page's "Cookie settings"
  button (`alkemos:consent-reopen`).
- **GA/AdSense gating (Consent Mode v2):** the `consent-mode-v2` script in
  `src/components/root-shell.tsx` renders ALWAYS (independent of
  `GA_ID` — AdSense is
  the live Google tag in production) and declares
  `gtag('consent', 'default', …denied)` BEFORE any Google tag loads — the
  order Google requires — then applies the visitor's STORED choice
  pre-tag. Before Phase 178, `gtag('config')` ran with no consent state
  (when GA_ID was set), so GA set cookies and shipped pageviews for
  visitors who had not consented; and with GA_ID unset there was NO gtag
  on the page at all, so the banner's `consent update` could never reach
  AdSense. AdSense reads the same gtag consent state. Owner order: «حل
  مشاكل بانر الكوكيز إن وجدت» (2026-09-12).
- No analytics/advertising cookies are set before consent; the
  `alkemos-consent-init` pre-paint script only reads localStorage to
  stamp a visibility attribute (no network, no cookie writes).

### Data subject rights

- **Access / export:** users can view their profile and saved
  results from the UI. A full export requires a manual SQL query by
  the owner.
- **Deletion:** account deletion is via Supabase Auth (cascades to
  user-owned rows per RLS / FK rules). The owner handles deletion
  requests manually.
- **Rectification:** users can edit their profile, questionnaires,
  and progress entries from the UI.

### Data residency

- Supabase region: configured at project creation (the production
  project ref is `wyopqryzfjifyeyvyxfy` — see
  `archive/RUN_ON_SUPABASE.sql` header).
- Vercel deployment region: `fra1` (Frankfurt) — see `vercel.json`
  (P3-3, deep-audit confirmed 20, Phase 217: this line claimed `sin1`
  for months — the doc now matches the actual `regions` field).
- Agents must NOT change the deployment region without explicit
  owner approval (data residency / latency trade-off).

---

## 8. Security Vulnerability Reporting

If you discover a security vulnerability in Alkemos:

1. **DO NOT open a public GitHub issue.** The repository is private
   (2026-09-24), but disclosure must still stay out of any tracked
   surface — report privately so a fix can ship before anyone could
   exploit the vulnerability.
2. Email the owner directly at `muscleshubfit@gmail.com` with the
   subject line `[SECURITY] Alkemos — <short summary>`.
3. Include:
   - Affected file(s) / route(s) / component(s).
   - A minimal proof-of-concept (curl commands, request bodies,
     etc.).
   - The impact (what an attacker could do).
   - Suggested fix, if any.
4. The owner will acknowledge within 72 hours and coordinate a fix
   + disclosure timeline.

Responsible disclosure is appreciated. We will credit reporters in
the commit that ships the fix (unless they prefer to remain
anonymous).

---

## 9. Rules for AI Agents (Security-Specific)

These are in addition to the general operating rules in `AGENTS.md`:

1. **Never commit secrets.** See §2.
2. **Never log request bodies, response bodies, or env vars** in
   production code paths. Audit `console.log` / `JSON.stringify`
   calls before committing.
3. **Never import server-only modules into client components.** The
   rule of thumb: if a file reads `process.env.SECRET_NAME` (without
   `NEXT_PUBLIC_`), it must NOT be imported by a file with
   `"use client"` at the top.
4. **Never weaken RLS policies.** Any migration that modifies an RLS
   policy requires explicit owner approval (see `AGENTS.md` §7).
5. **Never disable authentication on a route.** If a route needs to
   be public (e.g. a webhook), it must use a different auth
   mechanism (e.g. `CRON_SECRET` for cron routes).
6. **Never add a new external HTTP call** without owner approval.
   New external calls expand the attack surface (SSRF, data
   exfiltration, vendor trust).
7. **Always validate user input.** Use zod schemas at the boundary
   of every API route that accepts a body or query params.
   (Enforced since the Phase-141/216/219/220/221/222 waves —
   `src/lib/validation/schemas.ts` now gates all four route families:
   public + coach + user + payment/admin/cron/affiliate; the
   payment/admin/cron/affiliate wave landed 2026-09-17 under the
   owner's explicit §7 approval «اعتبر مسارات الدفع ضمن نطاق التنفيذ
   مع بوابات الأمان المطلوبة» — shape-only tightening, all
   money/signature/RLS logic untouched; every legacy 400 class is
   re-derived verbatim on gate failure; auth-first ordering preserved
   everywhere — the gate never fires before requireAdmin/requireUser/
   verifyCronAuth/the PayPal signature check.)
8. **Always use `requireUser` / `requireCoach`** in API routes that
   touch user data. The auth helpers are in `src/lib/auth-server.ts`.
   In demo mode they return `null` — the route must decide whether
   to 401 or fall through to a local fallback.
9. **Always set `maxDuration`** on long-running API routes to stay
   within the Vercel Hobby plan's 60s default (or 300s for the explicit
   long pipeline routes — the blog content and review steps,
   `src/app/api/cron/blog/p2-content/route.ts` and
   `src/app/api/cron/blog/p4-review/route.ts`; P3-3 Phase 217 replaced
   the retired `step2-generate` citation from the pre-v3 pipeline).
10. **Never expose the service-role key to the browser.** The
    service-role key bypasses RLS — if it leaks, the database is
    fully compromised.
11. **Never apply SQL to production yourself.** Migrations are
    idempotent files under `supabase/migrations/`; the repo-owned
    pipeline applies them (`scripts/db/apply_migrations.py`, ledger-
    driven, inside deploy-aws.yml before the code goes live — owner
    directive 2026-10-27; the agent never runs them from a session).
    The migration-state audit gate verifies application and flags
    drift loudly. The owner runs SQL by hand ONLY on the
    documented manual path (the `auth.users` exception + legacy
    `RUN_ON_SUPABASE_*`/`VERIFY_*` files) — AGENTS.md §3.3/§6.
    Exception (owner directive 2026-10-26): QA test accounts under
    the reserved `@alkemos-test.com` domain follow the Test-Accounts
    Channel (admin-API user creation + domain-scoped profile writes
    via `scripts/qa/test_accounts.py`) — see §6 above; everything
    else here is unchanged.
12. **Always update this file** when adding a new env var, a new
    external service, a new auth flow, or a new data category.
13. **Auth-flow change — complete-invite adoption (H1-2026 fix,
    2026-09-21).** `POST /api/auth/complete-invite` +
    `lib/auth-invite-adopt.ts` + the `signUpEmail` duplicate-branch
    wiring. §7 pre-approval trail: the owner ordered «ابدأ تنفيذ
    الخطوة التالية» immediately after being shown the proposed next
    step «إصلاح H1-2026» (the auth signup deadlock documented in
    `docs/archive/UX-TEST-REPORT-2026-09-21.md` §3, reproduced live twice with
    SQL proof). Invariants: the password write is gated on
    `invited_at` set + `last_sign_in_at` null (pending invites ONLY —
    self-registered or activated accounts can never have their
    password rewritten); uniform `{ok:false}` answers for every
    non-adoptable case (anti-enumeration); rate-limited 5/10min/IP;
    no new external HTTP calls (HIBP stays client-side); no schema,
    RLS, or money-path change (service-role admin auth API + bounded
    profiles update by primary key only).
14.  **Auth-adjacent data visibility — invite-pending marker (0092,
    2026-09-22, phase 244).** `get_coach_client_list_paged` /
    `get_coach_client_stats` gain an `invite_pending` boolean /
    `pending_invites` counter (UX-TEST-REPORT-2026-09-21 m-C+m-D;
    owner order «ابدأ»). The security-definer RPCs (postgres owner,
    unchanged signatures, no new grants beyond the existing
    `authenticated` execute) read `auth.users` internally to derive
    the marker: `encrypted_password = '' AND last_sign_in_at IS NULL`
    — the EXACT predicate of the H1-2026 adoption gate (rule 13), so
    the flag is true ONLY for a pending invite and flips false the
    moment any signup/adoption/OAuth join happens; a self-registered
    or activated account can never match. Only the derived boolean
    crosses the RPC boundary — no auth column, hash, or timestamp is
    exposed. No RLS, table, or money-path change.
15.  **Auth-flow addition — self-serve password recovery + invite
    resend (batch 245, 2026-09-22).** (أ) «Forgot password?» entries
    (login form, the M2 «Account already exists» screen, request
    screen) call GoTrue `resetPasswordForEmail` CLIENT-SIDE with
    `redirectTo=/auth/callback?next=/auth/reset` — the SAME server
    route OAuth uses exchanges the PKCE code with the shared cookie
    strategy (detectSessionInUrl=false untouched; no token ever parsed
    by app code) — then `/auth/reset` sets the new password via
    `updateUser` (min 8 + confirm-match client gates, honest
    expired-link error, GoTrue's uniform anti-enumeration answer kept).
    (ب) `POST /api/coach/clients/invite/resend` re-notifies a PENDING
    invitee ONLY — the exact `isAdoptableInvitedUser` predicate of
    rule 13's adoption gate (an activated or self-registered account
    answers honest 409) — rate-limited 5/min/IP + 3/hour/email, and
    the email carries NO GoTrue token link: it is an instruction card
    pointing at the signup form whose duplicate-branch completes the
    adoption (rule 13) — sent via the EXISTING Brevo account
    (no new external service, no new env var). §7 pre-approval trail:
    the owner ordered «ابدأ التحسينات» after the report listed these
    exact items in §5-1/§5-2 (UX-TEST-REPORT-2026-09-21), the
    same «order = pre-approval» pattern as rule 13.
16. **Email existence lookups are EXACT, never a pattern (W1-2a —
    finding S-04 of the 2026-10-02 full-stack audit, Phase 330,
    2026-10-02).** The four email-matching routes (`POST
    /api/coach/register` · `POST /api/auth/complete-invite` · `POST
    /api/coach/clients/invite` · `POST /api/coach/clients/invite/resend`)
    look the profiles email up with `.eq("email",
    email.toLowerCase())` — NEVER `.ilike`: user input is DATA, not a
    match pattern (`a%@x.com` used to match `ahmed@x.com`, widening
    the existence check into an account-state enumeration oracle and
    rejecting legitimate registrations/invites with false 409s).
    Correctness depends on the stored-lowercase contract — the zod
    `emailSchema` (src/lib/validation/schemas.ts) trims + lowercases
    at every boundary. coach/register's two `already_registered`
    exits (the profile check + the createUser-422 fallback) return
    the ONE unified 409 message. §7 pre-approval trail: the owner
    ordered «ابدأ البند التالى» executing the approved remediation
    plan's W1-2a row (docs/FULL-STACK-AUDIT-AND-REMEDIATION-PLAN-
    2026-10-02.md — the plan is the sole source), the same
    order-citing-the-plan pattern as the W0-3 §7 approval. Pinned by
    `src/lib/__tests__/email-exact-match.test.ts` (13 canaries).
    Scope note: admin/staff's own `.ilike` usage is a different,
    admin-gated surface NOT listed in S-04's locations — untouched
    by W1-2a (documented in the worklog entry).
17. **Coach client-invite rate limits + per-coach pending-invite cap
    (W1-2b — finding S-03 of the 2026-10-02 full-stack audit, Phase
    331, 2026-10-02).** `POST /api/coach/clients/invite` carries the
    resend sibling's EXACT limit pair — 5/min/IP (with
    `Retry-After: 60`) + 3/hour/email via the shared cross-instance
    limiter (`src/lib/rate-limit.ts`) — under its OWN `invite-send:`
    namespace (a fresh invitation and a resend re-notification are
    DIFFERENT actions; their counters neither starve nor inflate each
    other), and the IP window runs BEFORE the body parse so junk
    floods burn it (the sibling's order). COACH-role invitations are
    additionally capped at 30 PENDING invites: the count is the 0092
    single source itself — `get_coach_client_stats().pending_invites`
    (invited_at set + never signed in) — read through the REQUESTER's
    own session (anon key + request cookies: the SECURITY DEFINER
    RPC scopes by `auth.uid()`, which the service-role client cannot
    provide); at/above the cap the route answers an honest 429
    `pending_invite_cap` carrying the live count. ADMIN inviters are
    exempt from the CAP (owner-controlled staff — the S-03 threat is
    the PUBLIC coach signup) but NOT from the rate limits. If the
    stats RPC errors (or the anon auth env is missing) the cap FAILS
    OPEN, logged — the rate limits still bound the abuse window, and
    a database outage breaks `inviteUserByEmail` itself (no rows are
    minted through a dead database). No auth/RLS/payment/cookie
    surface was touched (the plan's binding rule (2) §7 list —
    W0-3 · W1-2c · W2-4 salt · W3-8 · W3-9 — does NOT include
    W1-2b). §7 pre-approval trail: the owner ordered «ابدأ البند
    التالى» executing the approved remediation plan's W1-2b row
    (docs/FULL-STACK-AUDIT-AND-REMEDIATION-PLAN-2026-10-02.md — the
    plan is the sole source), the same order-citing-the-plan pattern
    as W0-3/W1-2a. Pinned by
    `src/lib/__tests__/invite-rate-limit.test.ts` (14 canaries).
18. **Auth-flow change — atomic invite adoption, single-consumption
    claim (W1-2c — finding S-05 of the 2026-10-02 full-stack audit,
    Phase 332, 2026-10-02; migration 0099).** The adoption path
    `POST /api/auth/complete-invite` was a TOCTOU race: `getUserById`
    → gate (invited_at set + last_sign_in_at null, rule 13) →
    `updateUserById` — three NON-ATOMIC steps; two concurrent
    requests (or an attacker who knows a pending invitee's email
    racing the real invitee) BOTH passed the gate and BOTH wrote a
    password — the last writer silently owned the account and the
    loser's `{ok:true}` was a lie. The fix (the plan's §6.2 row W1-2c
    primary direction, verbatim: «اعتماد ذري شرطي — حارس على مستوى
    DB/توكن أحادي الاستهلاك»): `profiles.invite_adopted_at` (text,
    migration 0099) is a single-consumption claim TOKEN — the route's
    conditional UPDATE (`.eq("id", …).is("invite_adopted_at", null)`,
    one atomic statement via the service-role client) transitions
    NULL → a per-call UUID (`crypto.randomUUID()` — unique per call,
    which is why the column is text, not timestamptz: the
    failure-release keyed by the token can NEVER clobber a later
    claim, not even one born in the same millisecond); every other
    concurrent caller reads 0 rows → the uniform `{ok:false}` (rule
    13's anti-enumeration answer) WITHOUT ever writing a password —
    «first claimer wins» replaces the racy «last writer wins». The
    GoTrue gate still runs FIRST, so no token is ever minted for a
    self-registered or activated account. A password-write failure
    RELEASES the claim (token-keyed) — no poisoned state, the
    invitee retries clean and the emailed invite link remains the
    documented alternative exit. Honest residual (accepted): (أ) if
    the route dies BETWEEN claim and password write, the claim stays
    set with no password — complete-invite then answers `{ok:false}`
    for that email and the invitee's exit is the emailed link
    (always valid); (ب) the GoTrue link-vs-complete-invite write race
    is outside this route's reach — `updateUserById` is unconditional
    by API design, and the window predates the fix. No new external
    call, no RLS change (the column is written exclusively by the
    service-role route), no money-path touch. §7 pre-approval trail:
    the owner ordered «اوافق على التنفيذ، ابدأ البند التالى»
    executing the approved remediation plan's W1-2c row — the row
    itself is §7-marked in the plan (auth) and the owner's approval
    explicitly preceded implementation. Pinned by
    `src/lib/__tests__/invite-adopt-atomic.test.ts` (14 canaries:
    source pins + the race — sequential replay, the parallel race's
    single winner, write-failure release + clean retry, no claim for
    non-adoptable users, anti-enumeration parity of the loser's
    answer).

---

## 10. Security Headers (Production)

Enforced via `vercel.json`:

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years, include subdomains, opt into browser preload list |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking via iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage to cross-origin requests |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()` | Disable browser APIs the app doesn't use |

Cache headers (set in `vercel.json` + `next.config.ts` — image-family
split since the VERCEL-USAGE waves):

- `/images/*` → `public, max-age=86400` (24 hours)
- `/images/exercises/*` → `public, max-age=31536000, immutable` (1 year)
- `/images/brand/*` → `public, max-age=300, stale-while-revalidate=604800`
- `/_next/static/*` → `public, max-age=31536000, immutable` (1 year)
- `/_next/image*` → `public, max-age=86400` (24 hours)
- `/sw.js` → `public, max-age=0, must-revalidate` (always revalidated)

### CSP-Report-Only (VERCEL-USAGE-7, 2026-10-02 — report-noise whitelist)

The `Content-Security-Policy-Report-Only` header (report sink
`/api/csp-report`, route C4) had drifted from the LIVE third-party
stack: every pageview fired ~7 violation reports for resources the
site legitimately loads — GA4 loader (`www.googletagmanager.com`),
GA collect (`*.google-analytics.com`, `analytics.google.com`), CF Web
Analytics beacon (`static.cloudflareinsights.com`), AdSense anti-fraud
sodar (`*.adtrafficquality.google` — scripts, XHR and iframe), and
AdSense's internal reCAPTCHA aframe (`www.google.com` in `frame-src`).
Each report = one wasted function invocation (measured 2026-10-02:
7/pageview on `/`, 14 on article pages — the single largest
human-traffic driver of the Function Invocations meter).

The whitelist additions are **additive, Report-Only, zero behavior
change**: nothing starts or stops loading; browsers simply stop
POSTing reports for the KNOWN stack, so the remaining reports become
genuine enforcement signal (the original intent of the C4 Report-Only
phase). Origins added in VERCEL-USAGE-7: `script-src` +=
`www.googletagmanager.com` `static.cloudflareinsights.com`
`*.adtrafficquality.google`; `connect-src` += `*.google-analytics.com`
`analytics.google.com` `*.adtrafficquality.google`; `frame-src` +=
`www.google.com` `*.adtrafficquality.google`. Rollout note: CF-cached
HTML entries carry the old header until their 12h edge TTL expires —
the report-volume drop ramps in over ~12h after deploy (no CF purge:
a purge would itself spike origin invocations).

**VERCEL-USAGE-9 (2026-10-09) — `report-uri` removed entirely:** the
remaining report traffic (violations the whitelist cannot silence —
third-party script churn, browser extensions, scanner-injected
headers) still POSTed to `/api/csp-report` on routes where browsers
enforce the RO header, and each POST = one function invocation that
can never be CDN-cached. The `report-uri /api/csp-report` directive
is deleted from `vercel.json` (the policy itself is unchanged —
Report-Only stays live for future enforcement decisions). The route
file stays (204 on direct hits) but browsers no longer send reports,
so the invocation stream goes to zero. Same 12h CF edge-TTL rollout
note as above: cached HTML carries the old header (and old report
behavior) until it expires.

### Cloudflare — the OFFICIAL production HTML cache layer (P1-5, owner decision 2026-09-16 «اعتمد الخيار (ب)»)

`alkemos.com` resolves through Cloudflare BEFORE Vercel, and the zone
runs FOUR cache rules that own the production caching behavior (the
deep-audit P1-5 forensic verified the zone Browser-Cache-TTL is
`Respect Existing Headers` — the RULES, not the zone setting, are the
source):

- **Ruleset:** «alkemos cache rules (SEO-GEO-4 2026-09-08)» — one
  ruleset, FOUR rules since VERCEL-USAGE-9 (2026-10-09; rule 4 bypasses
  the HTML cache for RSC requests); rule 1 edge TTL raised 14400s → 43200s by
  VERCEL-USAGE-4 T-3b (2026-09-19, owner order «مطلوب تنفيذ حل
  لمشكلة تجاوز الاستخدام الحالية» — Fluid CPU overage guard).
- **Rule 1 — public HTML cache** («alkemos-public-html-cache», created
  with SEO-GEO-4 2026-09-08; browser TTL added by Phase 189; edge TTL
  raised to 14400s by VERCEL-USAGE-3 T-3, then to 43200s by
  VERCEL-USAGE-4 T-3b): **Expression:** the SEO-GEO-4
  private-path exclusion list (api/admin/auth/checkout/dashboard/
  questionnaires/progress/plans/profile/support/referral/preview/
  coach) + paths without a dot — i.e. public HTML pages only; dotted
  files (sitemaps, robots, assets) and private surfaces are OUTSIDE
  the rule. **Behavior:** `cache=true` · Edge TTL override **43200s**
  (12h) · Browser TTL override 300s. Trade-off (documented): edits to
  an already-cached page can take up to 12h to appear on a warm PoP —
  NEW URLs are never pre-cached, so crawler discovery via
  sitemap/RSS is unaffected.
- **Rule 2 — OG image cache** («alkemos og-image cache», created by
  VERCEL-USAGE-3 T-1 2026-09-16): **Expression:**
  `starts_with(http.request.uri.path, "/api/og-image/")`. **Behavior:**
  `cache=true` · Edge TTL override **86400s** (1 day) · Browser TTL
  `respect_origin` (the route already sends `public, max-age=86400`).
  The two rules never overlap (rule 1 explicitly excludes `/api*`).
- **Rule 3 — sitemap/RSS/llms/robots cache** («alkemos sitemap-rss-llms
cache», created by VERCEL-USAGE-7 2026-10-02 — bot-fetch transfer
guard): **Expression:** `starts_with(http.request.uri.path,
"/sitemap") or http.request.uri.path in {"/rss.xml" "/robots.txt"} or
starts_with(http.request.uri.path, "/llms")`. **Behavior:**
`cache=true` · Edge TTL override **3600s** (1 hour — matches the
routes' own ISR revalidate) · Browser TTL `respect_origin`. Effect:
bot sitemap/RSS/llms fetches (Google/Bing/AI crawlers re-fetch these
continuously) stop transferring from the Vercel origin on every hit;
worst-case staleness for a bot = 2h (1h CF + 1h ISR) — crawler
discovery cadence is unaffected. Verified live 2026-10-02:
`sitemap.xml` and `sitemap-exercises.xml` MISS→HIT on consecutive
fetches.
- **Verified production effect (2026-09-16, after T-1/T-3):** public
  HTML serves to browsers as `private, max-age=300, must-revalidate`
  (the rule's browser-TTL rewrite) with `cf-cache-status: HIT` while
  the edge entry is fresh (age up to 43200s since T-3b); on edge
  expiry CF
  re-fetches through to the Vercel function (`x-vercel-cache: MISS`)
  and re-caches. OG cards serve `MISS` on first fetch then `HIT` for
  a full day, cookie-free (was `DYNAMIC` before T-1). Sitemaps/RSS/
  llms/robots were `cf-cache-status: DYNAMIC` until VERCEL-USAGE-7
  rule 3 (2026-10-02) — now edge-cached 1h (verified MISS→HIT live)
  while Vercel keeps its own ISR cache (`x-vercel-cache: HIT`).
- **Rule 4 — RSC cache bypass** («alkemos RSC cache bypass», created by
  VERCEL-USAGE-9 2026-10-09 — soft-navigation correctness guard):
  **Expression:** `(http.request.uri.query contains "_rsc") or
  (http.request.headers["rsc"][0] in {"1"})`. **Behavior:**
  `cache=false` (BYPASS). Cache Rules are stackable and the LAST
  matching rule wins for conflicting settings, so rule 4 sits AFTER
  rule 1 in the list and overrides its `cache=true` for RSC requests
  only. Effect: CF was serving its 12h-cached HTML entry to Next.js
  RSC fetches (cache key ignores `Vary: rsc`) — client-side soft
  navigation received `text/html` instead of the `text/x-component`
  RSC payload, broke, and fell back to a FULL page load (extra
  invocation + transfer per click). Verified live 2026-10-09: RSC
  request now returns `text/x-component` + `cf-cache-status: DYNAMIC`
  (never HIT), while normal HTML requests keep `cf-cache-status: HIT`
  (rule 1 untouched). After the VERCEL-USAGE-9 ISR deploy, the RSC
  request lands on Vercel's ISR cache (`x-vercel-cache: HIT`) — zero
  function renders for soft navigation. Rollback: delete the single
  rule.
- **Layering law:** the `next.config.ts` SEO-GEO-4 headers rule stays
  the ORIGIN-side policy (what Vercel emits; what every non-CF path —
  preview URLs, direct Vercel hits — receives). Any future change to
  production HTML caching is a CLOUDFLARE dashboard change first,
  with this section + `docs/TECH_REFERENCE.md` §5 updated in the same
  phase (§3.8) — a code-only cache change that contradicts this rule
  is a documentation defect.

---

## 11. Authentication & Authorization Summary

### Authentication

- Email/password via Supabase Auth.
- Google OAuth via PKCE flow (the `@supabase/ssr` cookie-based
  strategy is critical — see `src/middleware.ts` header comment for
  the failure mode if middleware is missing).
- Session refresh handled in middleware — VERCEL-USAGE-9 (2026-10-09)
  scopes it: anonymous requests (no `sb-*` cookies) and non-auth
  `/api/*` requests skip the Supabase client + `getUser()` hop (route
  handlers validate their own sessions via `getAuthUser()`); the
  OAuth/PKCE surface (`/auth/*`) and every authenticated page request
  keep the full cookie-sync + refresh path.
- Demo mode (no Supabase env vars): two seeded demo accounts
  (`ahmed@coach.app` / `coach123`, `client@demo.app` / `client123`)
  backed by localStorage (single source: the seed in
  `src/lib/data/auth.ts`).

### Authorization

- **Client-side tier resolution:** `useMembershipTier(profile)` hook
  queries the `subscriptions` table and picks the highest-priority
  active membership.
- **Server-side tier resolution (SINGLE SOURCE OF TRUTH, Phase 141 —
  2026-09-07, owner-approved §7 change):** `resolveMembershipTier()`
  in `src/lib/membership-tier.ts` is the one resolver shared by BOTH
  server entry points — `getAuthUser()` (API routes via
  requireUser/requireCoach/requireAdmin) and
  `getAuthUserFromHeaders()` (server components / coach preview).
  Before Phase 141 the two functions carried drifted copies and
  `getAuthUserFromHeaders()` missed the 0045 legacy map, so a stray
  legacy `starter`/`elite` row resolved as "free" in server
  components while resolving correctly in API routes. Pinned by
  `src/lib/__tests__/membership-tier.test.ts` (18 canaries:
  staff / free / premium / pro / coaching / legacy / combined
  coaching+membership / unknown-tier defensive).
- **Tier priority order (verified from code):**
  `pro` (3) > `premium` (2) > `free` (0). `coaching` is treated
  separately — it grants EVO access equivalent to Premium but is NOT
  a higher membership tier. Live products have no `elite`/`starter`
  rows (migration 0045 remapped them all); the resolver keeps a
  defensive `starter → premium` / `elite → pro` map so a stray
  legacy row can never DOWNGRADE a paying client to "free"
  (an older doc claim that there is "NO elite tier" was about the
  product catalog — see `archive/PROGRESS.md` for the discrepancy).
- **RLS:** every table in the database has RLS policies enforced.
  See `DEVELOPER_GUIDE.md` §4 for the per-table policy summary.
- **`is_coach()` SQL function:** SECURITY DEFINER function used by
  RLS policies to check staff status: `profiles.role IN ('coach',
  'admin')` (ROLE MODEL v2 — migration 0029 redefined it from the v1
  coach-only form; migration 0002 only granted EXECUTE). NEVER rewrite
  policies back to `= 'coach'` only. Full predicate set
  (`is_coach`/`is_admin`/`is_coach_over`/`coach_of`):
  `docs/TECH_REFERENCE.md` §2.2.

### Coach Self-Registration (2026-08-29, migration 0036)

- **Endpoint:** `POST /api/coach/register` — PUBLIC (it must be: it is
  the signup form behind `/for-coaches/register`). Hardened:
  - Rate limited: 3 attempts / 10 min / IP through the shared
    cross-instance limiter `src/lib/rate-limit.ts` — fixed-window
    counters in Upstash Redis (shared across ALL serverless instances,
    survive cold starts) when `UPSTASH_REDIS_REST_URL`/
    `UPSTASH_REDIS_REST_TOKEN` are set, with the per-instance in-memory
    Map as the dev/demo-only fallback (P3-3 Phase 217: this line said
    "in-memory" — the H3 upgrade made that stale).
  - Honeypot field `website`: filled → fake success, nothing created.
  - Password minimum 8 chars enforced server-side (not just HTML).
- **Role assignment law:** the role is NEVER read from client-sent
  signup metadata. The auth user is created server-side with plain
  metadata; the service role then promotes the profile to `coach` and
  upserts `coach_emails` (0017 `auto_promote_coach_if_allowed()`
  re-protects the role on every future login).
- **Migration 0036** hardens `handle_new_user()`: profiles are ALWAYS
  born `role='client'` — before it, the trigger trusted
  `raw_user_meta_data->>'role'`, so a hand-crafted signup API call
  could self-promote to coach. That hole is closed for ALL signup
  paths (email, OAuth, admin invite — none of them legitimately send
  a role in metadata).
- **Instant activation trade-off (accepted by owner «التسجيل الفورى»):**
  accounts are created with `email_confirm: true`, so the email is not
  verified at signup. Spam risk is mitigated by the rate limit +
  honeypot; switch to invite/confirm flows later if abuse appears.
- **Instant signup RESTORED (2026-09-08, migration 0074, owner
  directive «التسجيل بدون رسالة تأكيد كما كانت سابقا»):** the Supabase
  dashboard still lists `mailer_autoconfirm=false` (which, with
  unconfigured SMTP, left every new signup permanently locked out),
  so a DB-side `BEFORE INSERT` trigger on `auth.users`
  (`public.alkemos_autoconfirm_email`, SECURITY DEFINER, pinned
  search_path) now stamps `email_confirmed_at` at insert and the
  signup flow retries an instant password login when GoTrue withholds
  the session. To switch BACK to email verification later: configure
  SMTP in the Supabase dashboard, then run the two DROP statements
  documented inside the 0074 migration file (trigger, then function).

### Coach Boost Security Notes (2026-08-30, migration 0037)

- **Public storage bucket `coach-public`:** the ONLY public bucket in
  the project — required because coach profile photos must render for
  ANONYMOUS visitors on public pages (private-bucket `/api/file` URLs
  403 for logged-out users). Mitigations:
  - Writes are authenticated-only, scoped to the coach's own
    `<auth.uid()>/` folder via storage RLS (`storage.foldername`).
  - Bucket caps: 5 MB/file, mime jpg/png/webp only; the landing API
    additionally accepts only same-origin
    `/storage/v1/object/public/coach-public/…` paths or https URLs and
    caps results_photos at 6 entries with 120-char captions.
  - **Content-risk trade-off (accepted):** a coach can publish
    arbitrary images on HIS OWN published page. Owner moderation lever:
    flip `coach_pages.is_published` off (the page and its gallery
    disappear everywhere, including the ads strip — /api/coaches/
    featured only surfaces coaches whose profile role passed the
    service-side check and whose pages are published).
- **Ads (`coach_ads`):** no client-side write policies at all — every
  purchase runs through the server route, which debits the wallet
  atomically (refund on failure) and validates the package against the
  server-side constants. The debit uses ledger kind `adjust` with an
  «إعلان — …» note (0035's `coach_adjust_wallet` kind check is
  intentionally NOT altered to avoid function drift).
- **Coach support messages:** RLS = coach reads/inserts his own rows;
  admin replies are service-role only (admin API is AdminGate-guarded
  by role='admin' server-side).
- **Pricing authority (m7 owner decision «أ», 2026-09-18):**
  `coachActivationCostUsd(months)` (coach-limits.ts) is the single
  debit calculator and takes ONLY the duration — fixed package pricing
  ($6 / 1 month · $16 / 3 months · $6 × months for any other duration).
  `coach_fees.fee_per_client` is RETIRED from the equation: the
  per-coach fee API (/api/admin/coach-fees) and its admin setter UI
  were removed in the same phase, and the coach_fees table stays as
  inert legacy data (read by nothing on the billing path). The audit
  root — a self-signed coach with no fee row falling on the `?? 0`
  fallback — is closed by design: every activatable duration now costs
  more than zero, identical for every coach (canaries in
  coach-activation-cost.test.ts).
- **Wallet top-up receipt ownership (P3-11, Phase 217 — owner §7
  approval «أوافق على التنفيذ كاملاً», deep-audit confirmed 18/19):**
  `POST /api/coach/wallet/topup` accepts ONLY the requesting coach's
  own receipt upload — receipts ride `POST /api/upload` (the UPLOAD
  LAW), which rebuilds the storage path server-side as
  `receipts/<caller-uid>/<file>`, and the top-up route rejects any
  path whose uid segment does not match the authenticated caller
  (another user's receipt, a fabricated path, or a traversal never
  creates a review row). The retired browser-side Storage write is
  banned by guard `receipt-ownership.test.ts`; legacy rows keep the
  path they were stored with (read-only surfaces are unaffected).

---

## 12. PayPal Payment Security

PayPal is the primary payment method (added 2026-08-24). Manual
payment receipts (InstaPay / Vodafone Cash) remain as alternative
flows; PayPal is the only automated online flow.

### 12.1 Credential surface

| Env var | Scope | Notes |
|---|---|---|
| `PAYPAL_CLIENT_ID` | Server-only | Used by `src/lib/paypal.ts` for OAuth2 + Orders API v2 |
| `PAYPAL_CLIENT_SECRET` | Server-only | NEVER prefix `NEXT_PUBLIC_`. Bypasses nothing on its own (PayPal REST is stateless) but enables Order creation/capture |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Public (browser) | Loaded by `@paypal/react-paypal-js`. PayPal's design — safe to expose |
| `PAYPAL_WEBHOOK_ID` | Server-only | Used by `/api/paypal/webhook` for `verify-webhook-signature` |
| `PAYPAL_MODE` | Server-only | `sandbox` (default) \| `live` |

`src/lib/paypal.ts` is a server-only module. It must NEVER be imported
by a client component. The `PAYPAL_CLIENT_SECRET` is read via
`process.env` directly (no `NEXT_PUBLIC_` prefix) — Next.js guarantees
these are not shipped to the browser.

### 12.2 Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/paypal/create-order` | POST | User (logged-in) | Create a PayPal Order server-side. **Price is resolved server-side** from `resolvePlanPrice()` (`src/lib/paypal.ts`) — the client NEVER sends the price. Client sends only `planTier` + `durationMonths`. |
| `/api/paypal/capture-order` | POST | User (logged-in) | Capture a PayPal Order server-side. **This is the AUTHORITATIVE payment confirmation** — the client-side `onApprove` callback only signals user intent. After a successful capture, the route calls ONE atomic RPC — `capture_paypal_subscription()` (migration 0098) — which inserts the payment record in `subscription_requests` (status=`approved`, `paypal_order_id` = the replay lock) and runs `extend_subscription()` in the SAME transaction, then triggers `processSubscriptionInitialPayment()` for affiliate commission. A replayed capture (sequential or the loser of a parallel race) resolves to an idempotent 200 with zero duplicate side effects. |
| `/api/paypal/webhook` | POST | PayPal (signature-verified) | Receives webhook events (`PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`, `CHECKOUT.ORDER.APPROVED`). **Audit trail only** — does NOT activate subscriptions or commissions. This prevents double-activation if both the webhook and the capture endpoint fire for the same order. |

### 12.3 Idempotency

PayPal's Capture API is idempotent by design. The integration stacks
four idempotency layers (the 0098 layer is the one that guards the
SITE's side of the money — PayPal only protects the buyer from being
charged twice):

1. **`PayPal-Request-Id` header** — `create-order` uses
   `mhe-create-${userId}-${Date.now()}` and `capture-order` uses
   `mhe-capture-${orderId}`. Same ID returns the same result without
   double-charging.
2. **HTTP 422 / `ORDER_ALREADY_CAPTURED`** — if the order was already
   captured (e.g., webhook fired before the capture call), the route
   treats 422 as success and fetches the order details via
   `fetchPayPalOrderDetails()` to retrieve the capture result.
3. **DB claim-first atomic gate (migration 0098 — W0-3, 2026-10-02)** —
   the money decision lives in the DATABASE, not the application:
   - `subscription_requests.paypal_order_id` carries a PARTIAL unique
     index (`uq_subscription_requests_paypal_order`); the RPC
     `capture_paypal_subscription()` inserts the payment record FIRST
     as the atomic claim — a 23505 unique violation means "already
     processed" → idempotent success, NEVER a second extension — then
     calls `extend_subscription()` in the SAME transaction, so an
     extension failure rolls the claim back (no row, no extension,
     clean retry). The route answers replays with the same 200 success
     shape and skips duplicate notifications.
   - `coach_wallet_transactions (ref_id)` carries a PARTIAL unique
     index for `kind='topup'` (`uq_coach_wtxn_topup_ref`);
     `coach_adjust_wallet()` catches that specific 23505
     (constraint-name-scoped via `GET STACKED DIAGNOSTICS`) and
     returns the LIVE balance without a second credit — a parallel
     top-up race resolves to exactly ONE credit. Admin adjustments
     (`ref_id=null`) and coach activations (`kind='activation'`) are
     outside the index and unaffected.
4. **Affiliate commission idempotency** — `affiliate_commissions` has
   a unique constraint `uq_aff_comm_transaction` on `transaction_id`;
   the `orderId` is used as `external_reference` so a duplicate
   capture call cannot create a duplicate commission.

### 12.4 Webhook signature verification

`/api/paypal/webhook` rejects any request whose signature does not
verify. Verification calls PayPal's
`/v1/notifications/verify-webhook-signature` API with:

- `transmission_id`, `transmission_time`, `cert_url`, `auth_algo`,
  `transmission_sig` — all from the incoming PayPal headers
  (`PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-TIME`,
  `PAYPAL-CERT-URL`, `PAYPAL-AUTH-ALGO`, `PAYPAL-TRANSMISSION-SIG`).
- `webhook_id` — from `PAYPAL_WEBHOOK_ID` env var.

If `verifyWebhookSignature()` returns false OR
`isPaypalConfigured` is false OR `PAYPAL_WEBHOOK_ID` is missing,
the route responds **401** and the event is dropped (not logged as
successful). This prevents forged webhooks from polluting the audit
trail.

### 12.5 What is NEVER logged

- `PAYPAL_CLIENT_SECRET` value — never `console.log`'d, never returned
  in any response.
- The PayPal OAuth2 access token — cached in-memory in `paypal.ts`
  per process; never persisted to disk or DB; never sent to the
  browser.
- The raw webhook body is logged for the audit trail (event type +
  resource ID + timestamp), but the buyer's PII from PayPal's
  response (shipping address, phone, etc.) is NOT logged — only the
  capture status and amount.
- The `custom_id` JSON (`{user_id, plan_tier, duration_months}`) IS
  logged because it's our own metadata (no PayPal-injected PII).

### 12.6 Database touchpoints

| Table | Use |
|---|---|
| `subscription_requests` | After capture: a row is inserted with `status='approved'`, `payment_method='paypal'`, `price_usd` (server-resolved) and `paypal_order_id` (migration 0098 — the partial unique index on it is the replay lock; the insert happens INSIDE the atomic RPC, claim-first, before the extension). Migration `0016` extended `payment_method` to include `paypal`. |
| `coach_wallet_transactions` | Wallet top-up captures: one `kind='topup'` row per PayPal order, keyed by the deterministic UUID5 `ref_id` (migration 0035 + 0098's partial unique index `uq_coach_wtxn_topup_ref` — the parallel-race lock). |
| `affiliate_commissions` | If the user was referred, `processSubscriptionInitialPayment()` awards the commission using the PayPal Order ID as `external_reference` for idempotency. |
| `admin_notifications` | A bell notification is inserted so the coach sees the PayPal payment in real time. |

### 12.7 Live-mode readiness

The integration is sandbox-tested and live-ready when the owner sets
in Vercel Production env vars:

- `PAYPAL_MODE=live`
- `PAYPAL_CLIENT_ID` + `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (same value)
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID` (obtained from the live PayPal app's webhook
  configuration — points to the URL `/api/paypal/webhook` on the
  production domain)
- Migration `0016` applied to production Supabase.

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
3. **Investigation:** review Vercel logs, Supabase audit log, GitHub
   Actions runs.
4. **Recovery:** ship a fix, redeploy, verify.
5. **Postmortem:** written within 7 days, added to this file as a
   new section ("Past Incidents").

---

## 14. Past Incidents

_None recorded to date._

(When an incident happens, add a section here with: date, summary,
impact, root cause, fix, lessons learned. Keep it factual — no blame,
no marketing spin.)

---

## 15. Security-Relevant Additions (2026-09-01 / 2026-09-02)

Features shipped in Phases 72-81 with direct security relevance —
recorded here so the policy stays the single reference:

### 15.1 Queued AI Jobs — Staff Gates (JOB_GATE)

- `src/lib/ai-jobs.ts` classifies every job type; **staff-gated** types
  (admin/coach privileged work, e.g. `food_item_regenerate`,
  `day_regenerate`) are refused with **403** for plain clients at
  enqueue time (`/api/ai/jobs`) and again at processing time (GHA
  runner re-checks).
- Coach-path plan generation re-verifies **ownership** against
  `coach_assignments` before spending the client's quota — a coach can
  never bill another coach's client.

### 15.2 Admin-Only Non-Member Plans (external_plans)

- `external_plans` (migration 0058) carries **RLS: `is_admin()` only**
  for every operation (insert/select/update/delete).
- `/api/admin/external-plans` is wrapped in `requireAdmin` — a coach
  session receives **403 "Forbidden — admin only"** (verified live,
  Phase 80), and `/admin/external-plans` UI redirects coaches to
  `/coach` via AdminGate.

### 15.3 Email Hardening (Phases 72-73)

- `src/lib/email-validation.ts` — strict syntax + domain validation on
  **both** the client form and the `/api/send-email` server path.
- `/api/send-email` enforces a **daily cap of 100 messages / rolling
  24h** counted from the `tool_leads` rows the flow itself creates
  (DB-derived, exact — checked before the lead is saved), plus per-IP
  and per-email rolling caps through the shared Upstash-backed limiter
  (`src/lib/rate-limit.ts`) to contain SMTP abuse; the
  cron-secret-protected paths are the only bulk senders. (P3-3 Phase
  217: this section claimed a per-instance in-memory ledger — stale
  since the H3 limiter migration and the DB-counted daily cap.)

### 15.4 Refunds + Payout Safety (Phase 76)

- Refund eligibility ("no features used") is computed **server-side
  from tamper-proof ledgers** (evo chats/plans/swaps/coach
  plans/saved results) — never from client-supplied state
  (`src/lib/refund.ts`, `refund_requests` migration 0062, RLS:
  admin-all + owner-read).
- Approving a refund **ends the subscription** and **reverses
  pending affiliate commissions** automatically.
- Affiliate subscription commissions are held for **7 days**
  (`referral_earnings.available_at`): balances exclude held amounts
  and FIFO payout unlocking honors cancellations/refunds — a refunded
  payment can never be paid out as commission.
