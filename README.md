# Alkemos — The Smart Fitness & Nutrition Platform

> **Live:** [alkemos.com](https://alkemos.com)
> **Stack:** Next.js 16 · React 19 · TypeScript · Supabase · Tailwind CSS 4 · OpenRouter + Groq + NVIDIA NIM (AI) · Vercel
> **Quality:** every push is audited by automated CI gates — types, lint, tests, schema-drift, docs parity, anti-regression
> **Status:** in production · current live status: [`STATE.md`](./STATE.md)
> **Last updated:** 2026-09-27 (Ph 286 — HOME-REFINE-286: the exact AI-allowance wording, four-fact colored macro cells on every food card (homepage + /foods), the complete wrapped category set, and a fully static hero)

Alkemos is a bilingual (English + full Arabic RTL mirror) fitness and nutrition
platform that unifies training, nutrition, and AI planning in one product:
real content libraries, free planning tools, an AI coach (**EVO**), human
coaching, and an automated bilingual blog — backed by membership tiers, an
affiliate program, a complete B2B coach system, and a full admin platform.

This repository holds the entire production platform. The repository is
**private** (owner decision 2026-09-24) — the code is **proprietary and
confidential**, accessible only to owner-authorized collaborators
(see [License](#-license)).

---

## 🧭 What Alkemos offers

### The platform homepage (`src/components/views/LandingView.tsx`)
The homepage is a true PLATFORM homepage — concise sections with CARDS
that link to the real pages, mirroring the header's service nav
(HOME-PLATFORM-284, polished by HOME-POLISH-285, refined by
HOME-REFINE-286): a Training section
(the muscle-group browser previewing SIX real exercises per family,
fed by the server-provided curated samples), a Programs carousel, a
FOOD LIBRARY section previewing the `/foods` hub the same way the
exercise library is previewed (the complete nine-category set,
WRAPPED at every viewport — never a single scrolling row — routes into
`/foods?cat=…` filtered views; SIX real curated food cards — each
carrying the SAME four-fact labeled macro cells as the `/foods` cards
(calories · protein · carbs · fat, in the food pages' own colors) —
link into the food
detail pages), the diet-systems carousel, a Tools section of VISUAL
TILES (the five calculators/tracker PLUS the manual Meal Planner
«ابنِها بنفسك», every tile linking to its tool page — the tools
derive from `src/lib/tools-shared.ts` and never run on the homepage),
the honest free-allowance band (the free monthly plan quota, placed
right before the AI section so it introduces the planners), and an
AI Planning section — deliberately distinct from the tools — carrying
TWO strong explicitly-AI-powered planner cards with filled chrome
CTAs (the AI Workout Planner, and the AI Meal Planner promising a
STRUCTURED full-day plan with portions in grams — not mere
suggestions) plus EVO as a full-width card with a chat button that
opens the real floating widget (the chat-surface law). NO tool runs
on the homepage — the pages own the doing; the homepage owns the
navigation. The hero carries exactly two CTAs (login/signup + the
memberships page) over a compact one-row proof strip; memberships
render as small cards (prices derive from `memberships.ts` — never
literals; each card lists its tier's REAL limit-derived feature rows
with the same checkseal mark the memberships page uses) — PRO wears
the section's single dark highlighted card — each tier carries a
clear visible CTA (`.btn-outline` on the light cards,
`.btn-outline-dark` on the dark Pro card), plus one online-coaching
card. The FAQ closes the page as a directly-visible grid of Q&A
cards (no accordion). Motion is once-only, transform/opacity-only,
and fully `prefers-reduced-motion`-safe (DESIGN.md §7.1.2/§7.4.2) —
and the HERO is fully static (HOME-REFINE-286: no animated diagram,
no entrance beats, no arrows on its CTAs).

### Free content & tools — no account needed
- **Exercise library** — 868 exercises with start/end position images
  (self-hosted WebP), bilingual names / instructions / tips in modern standard
  Arabic + English, filterable by muscle group, equipment, and level
  (`src/lib/exercises.ts`)
- **Food database** — 8,830 foods with per-100g macros, bilingual labels and
  search (`src/lib/foods.ts`); the hand-curated foods plus a bounded,
  batch-expanded USDA band carry real Arabic names (`SEO_FOOD_BAND` in
  `src/lib/seo-food-band.ts` is the single source for the band;
  `/api/food-search` takes `?lang=ar|en` for language-matched result names)
- **Workout programs** — 7 structured, ready-to-follow programs for home,
  home-equipment, and gym, from beginner to advanced
  (`src/lib/workout-programs.ts`)
- **Free tools** — calorie calculator, BMI, macros, body-fat %, water tracker,
  and an interactive meal planner, each with email delivery of results and
  bilingual inline validation (`src/lib/tools-shared.ts` is the single source
  of the tools list)
- **AI planners** — AI meal planner and AI workout planner with a free trial,
  no signup required (a plan generated without an account stays on that device
  until you create one, then syncs to the account)
- **Blog & comparison hub** — bilingual articles plus focused
  "Alkemos vs …" comparison pages (`/blog`, `/compare`)

### EVO — the AI coach
- Floating chat widget on every page + a dedicated `/evo` experience, with
  **live SSE streaming** answers (raw tokens arrive as they are generated)
- **10 messages/day free** (subscribers unlimited), free memory of goals and
  preferences, and opt-in weekly follow-up emails
- A safety layer answers self-harm / eating-disorder signals with a static safe
  redirect — those never reach a model (`src/lib/evo-safety.ts`); plan and
  swap requests are quota-gated through an intent layer (`src/lib/evo-intent.ts`)
- Dispatch telemetry, a frequent-question cache, and a weekly automated AR/EN
  quality eval, surfaced read-only at `/admin/evo-analytics`

### Memberships

| Tier | Price | AI plan generations / month* | EVO chat | Plan swaps | Saved results |
|---|---|---|---|---|---|
| Free (& guests, no signup) | $0 | 2 | 10 msgs/day | — | 3 |
| Premium | $14.99/mo · $119/yr | 4 | Unlimited | 3/week | 50 + export |
| Pro | $29.99/mo · $239/yr | 8 | Unlimited | 6/week | 200 + export, ad-free |
| Coaching | $39.99/mo · $359/yr | 8 + human coach | Unlimited | 6/week | 200 + export |

\* One unified monthly pool for nutrition + workout generations combined —
only successful generations count; failed attempts and edits never burn quota.
Prices, quotas, and tier features are defined in a single source:
`src/lib/memberships.ts` + the quota engine `src/lib/tier-limits.ts`.
Every paid tier carries a 7-day conditional refund (no-features-used,
ledger-based — `src/lib/refund.ts`).

### Notifications (member bell + staff bell)
- **Member bell** (`src/components/NotificationBell.tsx`) — per-user rows in
  `notifications`, localized at display time from the structured `payload`
  (migration 0093). Clicking a notification marks it read and deep-links to
  the linked item: `plan_activated` opens THE plan's modal directly
  (`/plans?plan=<id>` auto-opens it), questionnaire statuses open the
  questionnaires, support replies the support thread view
- **Staff bell** (`src/components/AdminNotificationBell.tsx`) —
  `admin_notifications` routed per coach (`target_coach_id`).
  `questionnaire_submitted` / `new_client` / `plan_approved` open the
  client's manager page (`/coach/<id>`) directly; `new_ticket` opens the
  ticket's thread (`/coach/support?ticket=<id>`); coach-targeted events
  (wallet top-ups, coach-support replies) dual-write into the staff bell
  following the affiliate-engine precedent
- **Dedup guards (NOTIF→PLAN 2026-10-24)** — every structured emit carries an
  event-identity key (`plan_id` / request id / ticket id / order id) and the
  emitters + `POST /api/notifications/admin` skip a re-fire of the SAME
  event inside its window (double-clicks, network retries, the PayPal
  wallet parallel-race loser). Guards fail-open: a lost event is worse than
  a duplicate; the weekly progress cron keeps its own per-week dedup
- **Survey-notification eligibility (NOTIF→PLAN 2026-10-24)** — broadcasts
  whose link targets `/questionnaires` only reach ENTITLED members: clients
  assigned to a coach OR holding an active subscription; ineligible ids are
  skipped and reported (`skipped_ineligible`) instead of silently muted

### For coaches (B2B)
- **Client dashboard** — lifecycle filter tabs and per-client management
  (overview, subscription, plans, AI plans, questionnaires, progress).
  **The subscription shown is the ACTIVE one first (2026-10-26):** every
  staff surface (client list, counters, assignments view, admin clients,
  the client page header) picks the primary subscription by
  effectively-ACTIVE first, then tier (pro > premium > coaching) — an
  EXPIRED premium can never mask a RENEWED-ACTIVE coaching row (the
  measured live state: a renewed training subscription rendered «منتهي»
  while an old expired Premium kept being shown). Status badges render
  the honest effective status (an `active` row past its end date reads
  «منتهي»/Expired, never «مؤكد»/Confirmed)
- **AI plans** — generation draws from the client's own balance
  (ownership-checked); manual edits and per-element regeneration are unlimited.
  The nutrition generator computes ALL calories/macros server-side
  (`computeNutritionTargets` — Mifflin-St Jeor BMR, activity TDEE, goal
  adjustment from BOTH the goal text (Arabic spelling drift tolerated) AND
  the target-weight diff, then re-enforces them on the parsed output and
  REBUILDS the overview text so one plan can never carry two contradicting
  number sets). The coach picks the **diet type** (متوازن/كيتو/لو كارب/
  نباتي/نباتي صرف) BEFORE generating — the pick (or the questionnaire's
  classified diet) drives the macro policy (keto = very low carb) and the
  AI's food selection (`src/lib/diet-types.ts` is the zero-dependency
  contract shared by the UI and the job pipeline). Missing basic data or
  extreme results stamp `needs_review` flags that render as a review banner
  in the coach viewer — the plan stays a draft until the coach approves it.
  **Output quality is GATED, not hoped for (2026-10-24):** every AI payload —
  full plans AND every regeneration level (meal / food item / workout day /
  exercise) — passes a mandatory validator before it is returned, displayed,
  or saved: the day must close within ±25% of the server target, a
  regenerated meal within ±20% of its own calories, a swapped item within
  ±15%, items carry bounded REAL numbers (string numbers are coerced), meal
  totals are recomputed from the items (model-claimed totals are never
  trusted), and calorie estimates that deviate >35% from the food library's
  per-100g × grams truth are REPLACED by it. A rejected payload gets ONE
  repair retry whose prompt names the exact reason; a second rejection falls
  back to the local rule-based generator with a visible review flag (full
  plans) or throws honestly so the original element stays untouched
  (regenerations). Regenerations also carry the client's own context
  (allergies, diet, goal, injuries, training location), and the member's
  weekly swap quota is burned only when a swap actually SUCCEEDS.
  Cultural-context defaults (2026-10-25): tofu never surfaces as a
  default protein outside vegan/vegetarian plans, day-level rotation
  keeps a food from repeating across the day's meals (cooking fats
  excepted on keto), portions are physically bounded (no 533g egg-white
  items), and the local food bench gained three USDA-anchored Egyptian
  vegetables (arugula, beetroot, artichoke)
- **Durable swaps — «حتى نجاح الحفظ» (2026-10-25, extended 2026-10-26)** —
  EVERY swap kind (meal / item / exercise) on EVERY surface (the coach's
  plan editor AND the member's `/plans` page) now SURVIVES a closed tab:
  the swap payload names the owning plan (`planId`/`clientId`/bounded
  indices through the enqueue whitelist) and the queue RUNNER materializes
  the gated replacement straight into the `plans` row (fresh fetch → the
  swap delta only → the editor's own `recomputeNutritionTotals` for meal
  plans), so the result never again depends on a live browser poller (the
  measured 2026-10-25 failure: both live swap jobs finished `done` in
  `ai_jobs` while neither result ever reached the saved plan;
  2026-10-26 closed the remaining gaps — the member's swaps carried no
  plan targets and exercise swaps had no server-side persistence at all).
  **Plan-target ownership gate (2026-10-26):** a swap whose payload names
  a plan is verified at ENQUEUE time against the requester (member → his
  own plan; coach → his assignment roster; admin → any) and re-verified by
  the runner from `ai_jobs.requested_by` before the write — a hostile
  member can no longer target another member's plan through the queue.
  Best-effort by design — a materialization hiccup never fails the job;
  the in-editor path keeps applying the result live, and the success toast
  says whether it auto-saved.
- **Keto dairy law — MANDATORY (2026-10-25)** — regular milk (ANY fat
  percentage — full-fat alone proves nothing), rayeb and regular yogurt
  are excluded from keto plans BY DEFAULT, sweetened/flavored dairy
  (including fruit/vanilla Greek yogurt and sweetened plant milks) is
  banned outright, and UNSWEETENED Greek yogurt is the single
  yogurt-family exception (its portion still rides the 12g-per-item carb
  ceiling). One shared rule (`ketoDairyViolation`) governs all three
  surfaces: the local generator's pools, the external-generation quality
  gate (named-reason rejection + one repair retry), and the manual swap
  gates. A new 25g-per-meal keto carb ceiling rides the same gates, and
  the local engine closes its own meal-carb budget deterministically.
  The manual-edit drawer passes `?diet=keto` to `/api/food-search`:
  keto-unsafe rows sink to the bottom carrying a «غير كيتو» badge —
  visible and pickable, the coach decides.
- **Mobile food drawer (2026-10-25)** — on phones (≤639px) the food
  picker is a full-width BOTTOM SHEET (a portal dialog no clipping
  container can trap): its own scroll region with overscroll-containment
  (no scroll chaining into the plan modal), 44px touch rows, the
  «المزيد من المكتبة…» progressive-load button INSIDE the scrollable
  list (the deep library tail is thumb-reachable), a 16px search field
  (no iOS viewport zoom), and close-without-pick commits the typed text
  exactly like the desktop blur law. The desktop popover combobox is
  unchanged.
- **Plan editor (2026-10-24)** — the coach's plan modal header WRAPS on
  phones (the measured root of the clipped screen + unreachable
  تعديل/توليد buttons was an unwrappable `shrink-0` action cluster:
  639px min-content inside a 280px dialog at 360px), the per-item AI swap
  and per-meal regenerate are available in BOTH view and edit modes, and
  the food-name cell is a **food-library combobox** (`FoodPickerCell` —
  portal dropdown over `/api/food-search`; picking a row prefills its
  default serving grams). Every pick/grams/calories edit recomputes the
  WHOLE plan through one pure chain (`src/lib/nutrition-totals.ts`:
  item macros → meal totals → the meals' ACTUAL sum → macro grams + 4/4/9
  kcal splits); gram edits recalc from the library row the coach actually
  picked (session binding, invalidated on AI swaps/regens/removals), and
  count-based amounts («2 بيضة») never guess macros
- **Calorie-target editing with a real effect (2026-10-24)** — the daily
  calorie TARGET is preserved separately from the meals' actual sum (the
  السعرات card shows the actual, read-only — editing it was a number-only
  illusion, and any later item edit used to silently clobber the target
  back to the meals' sum). The dedicated «تعديل الهدف» control in the plan
  editor is the only way the target changes: a change within the
  platform's consistency band (±max(120 kcal, 7%)) updates the target
  field (the meals already track it); anything bigger REGENERATES the
  whole plan content (meals, quantities, totals) with the new target as
  the generation override — preserving the client's questionnaires
  (allergies, diet, goal, measurements), recovering the plan's original
  diet type, and swapping the old DRAFT only after the replacement
  arrives (approved plans are never touched until the new draft is
  approved). The member's calorie cards read the actual meals sum
  (`displayCalories`) so they keep tracking every meal swap
- **Draft & plan deletion (2026-10-24)** — the coach can delete a draft
  (or, with a stronger explicit warning, an approved/current plan) from
  the plans list: an in-UI confirmation dialog (no `window.confirm` —
  suppressed in mobile in-app browsers) names exactly what is deleted
  (the one plans row — never AI-job receipts, swap history or
  notifications), the delete is VERIFIED against the database (the
  Supabase error is captured AND the row is confirmed gone before
  success), and the list refreshes from the same all-plans source it
  renders
- **Regeneration reliability (2026-10-24)** — the queue worker
  (`process-ai-jobs.yml`) runs the AI runner under Node's
  `react-server` resolution condition so the `server-only`-guarded food
  library loads (the grounding was silently dead in the runner since the
  gate landed), the AI validators coerce Arabic-Indic/Persian digit
  numbers («٢٥٠» = 250 — a live rejection class) and unwrap
  wrapper-nested payloads (`{item:{…}}` / `{replacement:{…}}` — the
  16-token provider payloads that failed item regeneration permanently),
  and the member's swap counter rolls back to server truth when a
  regeneration FAILS (the quota is success-only, and the UI now shows
  it)
- **Wallet system** — fixed per-client activation pricing paid to the platform,
  receipt-reviewed top-ups (InstaPay / Vodafone Cash / PayPal), activation
  gated on sufficient balance
- **Public coach page** — claimable slug, landing editor, ads, certificates
  (`/coaches/[slug]`); the coach's save (PUT `/api/coach/landing`) and the
  admin's approve/reject flip both invalidate the public mirrors on demand
  (ISR paths + targeted Cloudflare edge purge — CACHE-POLICY-AUDIT
  2026-10-22), and `POST /api/admin/coach-pages/revalidate` is the manual
  cache lever after direct Supabase edits
- **Affiliate program** — 20% commission on referred subscription payments,
  $10 minimum payout, 7-day hold, automatic reversal on refunds
  (`src/lib/affiliate-engine-server.ts`)

### Site coaches (B2C) & the admin platform
- Every coach is `site` (platform-employed) or `b2b` (independent business) —
  one-tap toggle in the admin roster
- Site coaches follow up platform members 1↔1 through a dedicated assignments
  surface, deliberately separate from the B2B money relation
- **Admin Panel** (`/admin`, admin-only): unified client roster with
  role/lifecycle filters, finances (site money vs coach money), payments and
  the refund console, blog CMS, coach-system center, wallets, leads,
  referrals, saved results, and EVO analytics
- **Payments** — PayPal (create / capture / webhook) plus manual review
  (InstaPay / Vodafone Cash / bank transfer)

---

## 🏗️ Architecture at a glance

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 · Tailwind CSS 4 · shadcn/ui |
| Language | TypeScript 5 (strict) |
| Database | Supabase — Postgres, Auth, Storage, Row Level Security |
| AI | OpenRouter + Groq + NVIDIA NIM, one unified layer (`src/lib/ai-provider.ts`) |
| Payments | PayPal + manual review |
| Email | Brevo REST API |
| Charts | Recharts (lazy-loaded) |
| Forms | react-hook-form + zod |
| Testing | Vitest + Testing Library |
| PWA | manifest + service worker (installable) |
| Deployment | Vercel (Frankfurt — fra1) |

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
│   │   └── supabase/           # Clients + generated DB types
│   └── middleware.ts           # Session refresh + locale/lang/dir handling
├── supabase/migrations/        # Versioned migration registry (INDEX.md = ledger)
├── scripts/                    # CI gate scripts + pipeline runners
├── .github/workflows/          # CI gates + scheduled content/ops pipelines
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
  the source

### Data layer
- Supabase Postgres with **Row Level Security on every auto-applied table**
  and role-aware RPCs for the admin roster
- The schema evolves through a **versioned migration registry** —
  `supabase/migrations/` with [`INDEX.md`](./supabase/migrations/INDEX.md) as
  the binding ledger; migrations apply to production through the repo-owned
  pipeline (`deploy-aws.yml` runs the ledger-driven applier
  `scripts/db/apply_migrations.py` BEFORE the code goes live, and the
  `migration-state-audit` gate verifies application daily + on every push —
  a green deploy is never assumed as proof; see
  [`docs/DB-MIGRATION-PIPELINE-2026-10-27.md`](./docs/DB-MIGRATION-PIPELINE-2026-10-27.md))
- TypeScript DB types are generated from the schema
  (`src/lib/supabase/types.ts`)
- Daily automated JSON backups run to a **private** repository
  (`.github/workflows/db-backup.yml`) — user data never lands in this repo

### Admin-editable site copy (no deploy needed)
The site's static marketing copy — the homepage sections and the
about / privacy / terms / FAQ pages, in **Arabic and English separately** —
is editable by the site owner from the admin panel at
`/admin/site-content` («نصوص الموقع», in the Content section of the admin
sidebar). A save writes the `site_content` table (RLS: public read,
admin-only writes, migration `0094`). A successful save or reset also
fires an on-demand cache refresh (admin-gated
`POST /api/admin/site-content/revalidate` — CACHE-POLICY-AUDIT
2026-10-22): the data-cache tag + the ten consuming pages' ISR + the
Cloudflare edge copies invalidate immediately, so the edit is **live on
the next request** instead of waiting out the 300 s window (which
remains the safety net, alongside the 12 h edge TTL). **No git commit,
no CI run, no deploy**. The copy that ships in the code
(`src/lib/site-content/`) is the built-in default for every field, so a
missing or malformed row always renders the current wording verbatim — the
page can never go blank. Clearing a field in the editor restores its
built-in text; `{exercises}` / `{foods}` inside paragraphs keep showing the
live library sizes. Prices, plan limits, quota lines, and other
policy/number restatements are deliberately **not** editable there — they
derive from their single sources (`memberships.ts`, `refund.ts`, …).

### AI layer
One unified provider layer (`src/lib/ai-provider.ts`) is the only path to any
model — OpenRouter, Groq, and NVIDIA NIM — offering sequential
strongest-model chains, a `Promise.any` race mode for fast swaps, and SSE
streaming for chat. Every sequential path is budget-clamped so
`maxModels × timeoutMs` never exceeds ~52s (the serverless limit), and
long-running generation (the blog pipeline, queued AI jobs) runs on GitHub
Actions runners instead of serverless functions. Gemini leads both chains
when its key is configured. Plan generation and regeneration outputs pass a
mandatory quality gate (`src/lib/plan-ai-validation.ts`) with food-library
grounding (`src/lib/plan-food-grounding.ts`) — a provider answering 200 is
not evidence of quality.

### Automated content pipeline
The bilingual blog is generated end-to-end — research → outline → article →
images → review → publish — as scheduled GitHub Actions workflows, one English
and one Arabic article per day. The pipeline carries editorial gates: Arabic
modern-standard purity checks, image-safety rules, FAQ single-display, and
topic selection deduplicated against the search-intent map
(`src/lib/intent-map.ts`) so articles never compete with canonical pages.
When a deterministic publish gate rejects a draft (length, quality battery,
Arabic purity), the runner repairs it **inside the same run** instead of
discarding it: the failure names the offending step as a machine-readable
`rerunTarget` (`src/lib/blog-repair-target.ts`), and
`scripts/blog-runner/run-step.sh` re-runs that step on the same queue row
(≤ 2 repair cycles; `p2-content` regenerates the draft via `?force=1` while
research, outline and images are reused) before falling back to the honest
mark-failed + next-day backstop. No gate is weakened — a bad article is
still never published; a good-but-flawed one gets a second chance in-run.
For `p4-review` targets the repair is **directed**: the P5 500 body also
carries the gate violations as `repairDiagnostics`, the runner threads them
to the P4 re-run, and the review prompt receives them as a one-shot repair
directive ("fix exactly these named violations") — never as a permanent
editorial law. The P4 review prompt also pins a length-preservation
contract (the final article is never shorter than the measured draft;
deletions are offset by depth, never filler), because free-tier review
models were measurably shrinking complete drafts below the publish floor.
The repair path is MEASURABLE (R5): every directive stamps a `repairLoop`
marker into the queue row's bundle, the workflow Summary prints the run's
cycle count (`REPAIRS_USED`), and `GET /api/ai/queue-health` (admin) carries
a `repair` counter over a 14-day window — `published` · `afterRepair` ·
`exhausted` · `sharePct` · `recoveryPct` — so «repair-first vs regenerate»
is read from database truth, not guessed.
Arabic Latin-purity repair is likewise **localized**: a deterministic
dictionary pass arabizes known fitness/supplement terms with zero AI
calls, and only the remaining tokens go to a tiny conversion call
(token list only — small enough for the Groq free tier, which the old
full-article repair payload excluded). The purity gates themselves are
unchanged; rollback is the `LATIN_REPAIR_LEGACY` env flag.
The generation chain itself also widened (R3): the chain budget on the
GitHub Actions runners rose from 360s to 480s per step and the content
phase (P2) now walks three models instead of two, with Groq re-admitted
via a **per-entry max-tokens clamp** — when a request would exceed Groq's
8k-token-per-minute window, Groq's entry keeps its own reduced max_tokens
instead of being evicted wholesale (the platform's most reliable free
provider was previously dropped from exactly the heaviest calls). Review-
class payloads still exclude Groq by design (the clamp floor of 3800
output tokens is not met there). Rollback: `GROQ_MAX_TOKENS_CLAMP=0`
restores the old guard verbatim; the budget reverts via the workflow env.

### Owner review workflow (honest E-E-A-T)
Every pipeline-published article lands in the **pending review** state — its
page honestly says "AI-generated · medical review pending" (النسخة العربية:
«مولّد بالذكاء الاصطناعي · بانتظار المراجعة الطبية») and the structured data
carries no review claims until one is true. The owner reviews from
**Admin → Blog**: each published article row shows its review state, and the
**Approve / اعتماد** button (or simply publishing/saving the article yourself
in the editor) marks it reviewed with the real review date
(`blog_posts.review_status` / `last_reviewed_at`, migration 0097) — the byline
and Article schema then carry the true "Reviewed by Ahmed Zake" claims.

### SEO / GEO
JSON-LD structured data across the site (`src/lib/seo.ts`), dynamic XML
sitemaps (pages, blog, foods, exercises, collections, comparisons), a
`robots.txt` that welcomes AI crawlers, `llms.txt` + `llms-full.txt` for
generative engines, bilingual RSS feeds, and dedicated Open Graph cards per
surface family. Citations in generated articles are allowed only as links to
whitelisted health authorities (WHO/NIH/CDC/Mayo/ACSM/ISSN), and every
external link is verified live at publish (dead citations are removed). A
monthly GEO probe measures how often Alkemos appears in AI answers
(`.github/workflows/geo-answer-visibility.yml` + the protocol in
[`docs/SEO-GEO-MASTER-PLAN.md`](./docs/SEO-GEO-MASTER-PLAN.md) §8.4).

### Automated quality gates
Every push and pull request is audited on GitHub Actions by gates that
re-derive the truth from the code itself:

- **quality** — `tsc --noEmit` (0 errors), ESLint, and the full Vitest suite
- **parity** — migration-registry heading vs filesystem truth, schema ↔ types
  mirror audit, and the knowledge-system consistency audit
- **guard** — anti-regression scan for retired identifiers
- **Supabase Preview** — migrations run against a preview database before
  production

Full narrative — what each gate derives and why: [`docs/CI_GATES.md`](./docs/CI_GATES.md)

---

## 🚀 Getting started

### Prerequisites
- **Node.js 20.9+** (CI runs Node 22 — or **Bun 1.3+**)
- A **Supabase** project (free tier works)
- An **OpenRouter** API key (free tier works — the platform uses free models;
  Groq and NVIDIA NIM keys extend the fallback chain)

### Install & run

```bash
git clone https://github.com/muscleshubfit-cpu/alkemos.git   # private repo — requires owner-granted access
cd alkemos
bun install                  # or: npm install
cp .env.example .env.local   # then fill in your keys
bun dev                      # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
[`supabase/migrations/INDEX.md`](./supabase/migrations/INDEX.md). On THIS
repo's production the apply is automated by the repo-owned pipeline
(`.github/workflows/db-migrate.yml` + the `migrate` job in `deploy-aws.yml`, ledger-driven
`scripts/db/apply_migrations.py`), with application verified by the
migration-state audit — see
[`docs/DB-MIGRATION-PIPELINE-2026-10-27.md`](./docs/DB-MIGRATION-PIPELINE-2026-10-27.md).

### Deployment (AWS Lightsail — production origin)

The production line is the AWS Lightsail origin (DNS cutover completed
2026-10-10). Every code push to `main` runs the required tests
(`tsc --noEmit` • `eslint` • `vitest`) in
[`.github/workflows/deploy-aws.yml`](./.github/workflows/deploy-aws.yml)
and deploys automatically on green — doc-only pushes (Markdown, `docs/`,
`archive/`, `scripts/`) skip the deploy safely, and manual
`workflow_dispatch` stays for drills and re-runs. Activation is safe by
construction: atomic `current` symlink switch + `/api/build-info` health
check + automatic rollback to the previous release on failure
(`deploy/rollback.sh` for manual flips), followed by a post-deploy verify
battery (server vitals over SSH + edge checks). Server-side assets live
under [`deploy/`](./deploy/) and the root `ecosystem.config.js` (PM2);
`deploy/Caddyfile` replicates the vercel.json security headers and image
cache rules. [`vercel.json`](./vercel.json) keeps the legacy Vercel
posture for the DNS-rollback path documented in
[`docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md`](./docs/VERCEL-TO-AWS-HOSTING-MIGRATION-PLAN-2026-10-09.md);
site URL, analytics, and ads integrations are env-configured.

---

## 📚 Documentation

| Doc | What it covers |
|---|---|
| [`STATE.md`](./STATE.md) | Live project status — the single official status file |
| [`docs/README.md`](./docs/README.md) | Documentation index & lifecycle registry |
| [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) | Developer onboarding + architecture deep-dive |
| [`docs/TECH_REFERENCE.md`](./docs/TECH_REFERENCE.md) | Supabase, RLS, migrations, storage — deep technical reference |
| [`docs/CI_GATES.md`](./docs/CI_GATES.md) | The CI quality gates — what each derives and why |
| [`supabase/migrations/INDEX.md`](./supabase/migrations/INDEX.md) | Binding migration registry |
| [`.env.example`](./.env.example) | Annotated environment variable reference |
| [`SECURITY.md`](./SECURITY.md) | Security policy |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Contribution policy (proprietary — issues only) |
| [`LICENSE`](./LICENSE) | Proprietary license terms |

---

## 📝 License

This project is **proprietary**. All rights reserved.

The repository is **private** (owner decision 2026-09-24). Access is granted
solely at the owner's discretion, and the code is **NOT open source** — you may
NOT redistribute it, deploy a competing service, remove the license notice, or
use it to train commercial code-generation models. Production infrastructure,
customer data, financial data, and confidential business information never
appear in this repository.

Full terms: [`LICENSE`](./LICENSE) · security policy: [`SECURITY.md`](./SECURITY.md) ·
contributions: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
