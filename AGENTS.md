# AGENTS.md — Alkemos AI Agent Operating System

> **Status:** Active — binding on every AI agent (and human contributor) before any commit, PR, or production change.
> **Reading scope (Phase 292 — ARCH-REMEDIATION, audit P3-2):** the SESSION read is §1–§4 + §12 (with STATE.md + the top-3 worklog entries — the budget in `docs/README.md`); §5–§11 are binding law read ON DEMAND when their scope is touched; §8's full narratives (incidents, decisions, history) live in `docs/TECH_REFERENCE.md` §6.
> **Last updated:** 2026-10-31 (AI-PROVIDERS-PHASE5-B — owner directive 2026-10-31: «دمج وتفعيل Exa في منظومة البحث» (§8 PROVIDER LAYER — the §6-أ grounded ladder's FINAL language-split state: EN exa→tavily→groq→gemini-dormant · AR tavily→groq→exa(EN-equivalent query)→gemini-dormant, + the §6-أ/§12-2 optional full-text deepening with the researchDepth stamp; NO forced provider priority — every slot measured). Previously 2026-10-31 PHASE5-A.)
> **Owner:** muscleshubfit@gmail.com (project owner + human supervisor).
> **Deep technical detail** (Supabase · full RLS · migration law · special-rules tables · storage · Shadcn inventory · SQL snippets) lives in [`docs/TECH_REFERENCE.md`](docs/TECH_REFERENCE.md); the CI-gates narrative lives in [`docs/CI_GATES.md`](docs/CI_GATES.md). This file stays the LAW file.

---

## 1. Purpose

Operating rules for AI agents on Alkemos: the repo is **private** (owner decision 2026-09-24 — it was public before; history retains the public era, and the code is still treated as leakable), **proprietary** as a product, **production-deployed** (real customers, payments, PII) and **agent-assisted**. Agents are implementers and reviewers — never autonomous product owners: they execute well-scoped tasks, document the work, and hand control back to a human supervisor.

---

## 2. Roles

| Role | Who | Authority |
|---|---|---|
| **Project Owner / Human Supervisor** | `muscleshubfit@gmail.com` (Ahmed) | Final say on every change. Approves features, fixes, schema, security, deploys. |
| **Technical Reviewer** | Any AI assistant the Owner designates for the active session. | Reviews proposals, drafts task commands, flags risks. Does NOT commit code directly. |
| **Implementation Agent** | GML (this agent) + any sub-agent it delegates to. | Writes code, runs tests, updates docs, pushes commits — every change reviewed/approved by the human supervisor. |

The owner may designate additional agents or reviewers; until then the table above is authoritative.

---

## 3. Operating Rules (Binding on All Agents)

### 3.1 Inspect Before Modifying

Read the actual source, config, and migrations before changing anything — docs can lag (hierarchy: §12.8); on conflict verify the code and document the discrepancy in `worklog.md`. Quote file paths + line numbers in commits and reports so the human reviewer can verify.

### 3.2 Do Not Expose Secrets

Never commit or paste credentials anywhere (code, comments, fixtures, docs, chat, server logs — Vercel logs leak). New env vars go into `.env.example` EMPTY + documented in `SECURITY.md`. Suspected leak → STOP, alert the owner, do NOT push.

### 3.3 Do Not Modify Production Data

No agent-run `DELETE` / `UPDATE` / `TRUNCATE` / `DROP` on production Supabase; read-only verification queries (e.g. `SELECT count(*) FROM blog_posts`) allowed when necessary. Data migrations ship as idempotent SQL files under `supabase/migrations/` and are applied to production by the **repo-owned migration pipeline** (owner directive 2026-10-27 — `docs/DB-MIGRATION-PIPELINE-2026-10-27.md`: the ledger-driven applier `scripts/db/apply_migrations.py` runs in deploy-aws.yml's `migrate` job BEFORE the code goes live, and the `migration-state-audit` gate verifies application on every push + daily). The previously trusted Supabase–GitHub integration last applied a migration on 2026-10-02 (0100, commit 5d3b3b2a, on the PRE-cutover repo); the alkemos-aws repo was created 2026-10-09 (AWS cutover, history imported) and the integration was NEVER re-linked — 0101 (2026-10-25) was the first migration to land on the new repo and nothing picked it up, while deploys stayed green (repo-internal Actions are blind to the external app's death); a green code deploy is NEVER proof of DB migration application (owner directive, verbatim). The owner runs SQL by hand ONLY on the documented manual path (§6: the `auth.users` exception 0040/0050/0055/0066 + legacy `RUN_ON_SUPABASE_*`/`VERIFY_*` files).

**Test-Accounts Channel carve-out (owner directive 2026-10-26 — §6 + `docs/QA-TEST-ACCOUNTS-2026-10-26.md`):** the law above governs REAL production data. For QA test accounts — emails under the reserved domain `@alkemos-test.com` carrying `profiles.is_test_account = true` — agents MAY run `INSERT`/`UPDATE` on rows those accounts own (their own `profiles` row; subscriptions/assignments/plans/swaps created for the test), create their auth users via the Supabase admin API, and drive the real app logged in as them for live interface testing of ANY role including admin. `DELETE`/`TRUNCATE`/`DROP` remain owner-only in all cases (cleanup = owner-run `RUN_ON_SUPABASE_*` file, the 0095 pattern); every write is domain-guarded (the single tool `scripts/qa/test_accounts.py` refuses every non-test target); real rows, real accounts, RLS and auth code stay untouched.

### 3.4 Do Not Invent Architecture

No precedent in the codebase → propose the design in plain prose FIRST, get owner/reviewer sign-off, only then implement. Never introduce a new state/ORM/auth/payment/AI/deployment stack without explicit owner approval — the stack is documented in `DEVELOPER_GUIDE.md`; stay inside it.

### 3.5 Verify Changes

> **Canonical command set — do NOT duplicate these commands elsewhere.**
> §4 (Definition of Done) and `archive/QA_CHECKLIST.md` (Verification Protocol —
> frozen at Phase 115)
> MUST reference this section by pointer instead of restating the commands.

The canonical verification command set:

```bash
# 1. TypeScript — must report 0 errors
npx tsc --noEmit

# 2. ESLint — must report 0 errors (warnings are acceptable if pre-existing)
npx eslint .

# 3. Next.js build — must exit 0 (run when changes touch rendering,
#    routes, or anything that could break the build)
npx next build

# 4. Git push — forward-only (never `--force` without explicit Owner directive)
git push origin main

# 5. Sync verification — both must be identical
git fetch origin --quiet
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] && echo "SYNCED" || echo "DRIFT"

# 6. Working tree clean check
git status --short
# Expected: empty (or only pre-existing drift)
```

**Scope-matched verification (Phase 290 — ARCH-REMEDIATION, audit P2-2 — codifies the Phase-223/283 precedent):** the battery is scoped to what the frame actually touches. A **docs-only frame** (only `**.md` · `docs/**` · `archive/**` · `.github/**` · `scripts/**` — zero `src/`/`supabase/`/build-config change) runs ONLY the static docs gates locally — `python3 scripts/docs_parity.py` + `python3 scripts/docs_audit.py` (+ `python3 scripts/migration_audit.py` and the two guard scripts when touching their scope) — NOT tsc/eslint/vitest/build: a change that cannot alter a test outcome does not pay the code battery (CI mirrors this via `quality-gate.yml` `paths-ignore`). A frame touching `src/**`, `supabase/**`, or build config runs the FULL set above. Claiming PASS outside the matching scope is a §4 violation.

Additional rules: smoke-test touched API routes locally with `curl` before claiming success; "it compiles" is not "it works" — functional verification > smoke test > type check.

### 3.6 Session Protocol — STATE.md First (Owner directive 2026-09-03 — approved study «المنظومة المعرفية للمشروع كلها»)

Every session opens with: (0) read `STATE.md` — the official always-current state (~30 s); (1) `git fetch origin --quiet` + last 3 `worklog.md` entries + last 5 commit subjects; (2) trust NO number in ANY doc — take it from its single source (the map in `STATE.md`); (3) survival law — the workspace is EPHEMERAL, so any knowledge that must live is committed & pushed in the SAME session. End-of-task duty: `STATE.md` is refreshed in the same phase/commit that changes the state it describes — a stale STATE.md is an INCOMPLETE change (same severity as §3.8).

### 3.7 Always Verify Against `origin/main` Before Any Decision or Report

The local clone and conversation memory are NOT sources of truth. Before any state claim, new task, audit, or refusal: `git fetch origin --quiet` and confirm HEAD == `origin/main`; behind → `git pull --ff-only` (or cite `git show origin/main:<path>`); ahead/dirty → surface to the Owner, never `reset --hard` / `push --force` / `checkout -- .` without explicit instruction. Runtime claims ("X is live", "Y returns 200") require verification against the production URL or a verifiable recent record — memory is not evidence.

### 3.8 Documentation Parity Law (Owner directive 2026-09-02 — «دايماً عدل التوثيقات وملفات هيكل المشروع علشان ميحصلش لغبطة» + Phase 107 single-source extension)

Every code change ships its docs in the SAME phase — never "later". Minimum per phase (append-only, newest on top): `worklog.md` entry · `STATE.md` refresh (§3.6 duty — since Phase 115, owner directive «الأمر الخامس», STATE.md is the SINGLE living status file: المرحلة + المفتوح + الممنوعات + ملخص جودة المرحلة; `PROGRESS.md`/`QA_CHECKLIST.md` were merged into it and FROZEN verbatim in `archive/`) — plus every file describing the changed behavior (`README.md`, `DEVELOPER_GUIDE.md`, `AGENTS.md`, the `build-info` `aiTopology` label). **FEATURE README LAW (owner directive 2026-09-05):** any NEW feature, or any important modification of an existing feature, MUST be documented in `README.md` in the SAME phase — what it does, where it lives, how to use it; a feature missing from README is an INCOMPLETE change. **Single-source number law:** README/DEVELOPER_GUIDE carry ZERO variable counts — numbers live in the code or `supabase/migrations/INDEX.md`; `scripts/docs_audit.py` fails the push on any count there, on duplicate section numbers in this file, and on STATE consistency (phase + required sections + QA summary). Wrong-but-confident docs are worse than missing docs — fix or delete; dead code and stale references are deleted in the same phase (git preserves). Docs-only changes are allowed; commit starts with `docs:`. Obsolete sections move to `archive/` (append-only) or carry a `> **Deprecated (date):** reason` marker; resurrecting `PROGRESS.md`/`QA_CHECKLIST.md` at the root is gated (docs_audit F).

---

## 4. Definition of Done

A task is "Done" only when ALL of the following are true:

- [ ] Code written, formatted, committed with a clear message.
- [ ] §3.5 command set executed — all checks pass, no new errors/warnings beyond pre-existing.
- [ ] Affected routes/pages smoke-tested locally.
- [ ] Documentation updated (§3.8 minimum set + every file describing the changed behavior).
- [ ] `STATE.md` refreshed when phase / open items / prohibitions changed.
- [ ] `worklog.md` gained a new entry per §12.5.1.
- [ ] No secrets, no customer data, no production-only config committed.
- [ ] Change pushed and the human supervisor notified for deployment.
- [ ] Final report (§12.9) filed.

"Do not claim PASS unless the acceptance criteria are actually met." — non-negotiable.

---

## 5. Source-of-Truth Hierarchy

> **Deprecated (2026-08-24):** Superseded by §12.8. Do not use this hierarchy.

---

## 6. Rules for Database / Schema Changes

Every schema change = numbered migration under `supabase/migrations/` with the timestamped name `YYYYMMDDHHMMSS_NNNN_<slug>.sql` — **idempotent** (`IF NOT EXISTS`), **RLS policies for any new table in the same file**, applied to production by the **repo-owned pipeline** (owner directive 2026-10-27 — DB-MIGRATION-PIPELINE: `scripts/db/apply_migrations.py`, ledger-driven — applies ONLY unrecorded migrations in order, one transaction each — wired into deploy-aws.yml BEFORE the deploy; a push that ships migration files with no apply channel BLOCKS its own deploy, the exact 2026-10-27 incident class), NEVER renamed after landing (Phase 61 incident); the agent still NEVER applies SQL to production itself — the pipeline is the repo's channel, never an agent session. The Supabase–GitHub integration is RETIRED as the trusted applier (2026-10-27: last applied 0100 on 2026-10-02 (commit 5d3b3b2a) on the PRE-cutover repo; the alkemos-aws repo was created 2026-10-09 (AWS cutover) with the integration never re-linked — 0101, the first migration on the new repo, was never picked up, and 0102/0103 piled up under green deploys; re-linking it is optional Path B of the runbook, always under the state gate's supervision). The ONLY manual path is the `auth.users` exception (0040/0050/0055/0066 — an auto-migration failing on integration-role auth privileges would block the whole pipeline: the 0054 lesson) plus legacy `RUN_ON_SUPABASE_*`/`VERIFY_*` files; those manual-SQL deliveries MUST attach the RAW GitHub link of a ready-to-run file plus ONE consolidated `RUN_ON_SUPABASE_<IDs>.sql` (closing `NOTIFY pgrst, 'reload schema';` + VERIFY block) — describing manual SQL without the runnable file + raw link is an INVALID delivery. **MIGRATION INDEX LAW:** every new migration adds its row to `supabase/migrations/INDEX.md`, regenerates `src/lib/supabase/types.ts`, **registers its probe in `scripts/db/migration_probes.py`** (from 0102 onward — the state gate is blind without it) in the same commit; `python3 scripts/migration_audit.py` must report no NEW drift before push, and `python3 scripts/db/migration_hygiene.py` must be CLEAN (names · duplicate versions · INDEX rows · probes). Full migration law + per-table rules + storage: [`docs/TECH_REFERENCE.md`](docs/TECH_REFERENCE.md) §1.2–§1.5.

**TEST-ACCOUNTS CHANNEL (owner directive 2026-10-26 — supersedes the blanket effect of the 2026-09-27 wipe order (0095) for NEW QA accounts):** the `auth.users` manual-only law applies to REAL accounts. A QA test account — reserved email domain `@alkemos-test.com`, `profiles.is_test_account=true` (column live since 0045) — may be created, password-reset, and used for live role testing (ANY role including `admin`) BY THE AGENT, exclusively through the single guarded tool `scripts/qa/test_accounts.py`: the auth user is created via the Supabase admin API (`POST /auth/v1/admin/users`, `email_confirm:true` — NO direct `auth.users` SQL), the role + flag land via a domain-scoped `profiles` UPDATE, and login uses the public password grant. Hard bounds: the service key comes from env ONLY (never committed, never printed) · the tool refuses every non-`@alkemos-test.com` target · zero writes outside test-owned rows (the §3.3 carve-out is the ONLY write class) · RLS/auth-server code changes keep the full §7 process · passwords are one-time random, living in session memory + the owner report only, never in the repo · every create/reset/use is logged in `worklog.md` (email + purpose — never the password) · deletion/cleanup stays an owner-run SQL file (0095 pattern) — test accounts are REUSABLE by default. Full policy + execution runbook: [`docs/QA-TEST-ACCOUNTS-2026-10-26.md`](docs/QA-TEST-ACCOUNTS-2026-10-26.md).

---

## 7. Rules for Security-Sensitive Changes

Explicit human approval BEFORE implementation (not just after) for: auth (`auth-server.ts`, `middleware.ts`, `auth/*`) · RLS policies · payment logic (`api/tools/*`, `subscription_requests`, receipts, coach approval) · AI key handling (`ai-provider.ts`, AI Settings) · cookies/sessions/OAuth callbacks · CORS/CSP/HSTS or any `vercel.json` header · PII processing · any new external HTTP call. Process: prose proposal → human review (§2) → implement → `tsc`/lint/smoke → `SECURITY.md` updated → commit prefix `security:`. **Pre-approved class (owner directive 2026-10-26):** routine QA test-account lifecycle operations that conform EXACTLY to the Test-Accounts Channel (§6) need no per-instance approval — the channel policy itself is the approval. Anything touching real accounts, RLS, auth-server code, cookies/sessions, or anything outside that channel keeps the full §7 process unchanged.

---

## 8. Rules for AI Functionality Changes

> **Slimmed twice:** Phase 113 (owner «الأمر الثالث») · Phase 292 (ARCH-REMEDIATION, audit P3-2): every law keeps its name + binding core only — the full narratives (incidents, decisions, chronology) live verbatim in `docs/TECH_REFERENCE.md` §6; on any conflict the summary below governs and §12.8 (code wins) sits above both.

- **PROVIDER LAYER:** `src/lib/ai-provider.ts` is the SINGLE source of AI calls — generation providers OpenRouter + Groq + NVIDIA NIM + **Gemini (native generativelanguage adapter inside ai-provider.ts — owner order 2026-10-06; FREE tier, auth key)** + **Cloudflare Workers AI (native `/accounts/{id}/ai/run/{model}` adapter inside ai-provider.ts — Phase 5-C / stage ج, owner order 2026-10-31 «نفّذ جميع المراحل المتبقية» approving §12-3; FREE tier 10,000 neurons/day, no card, `CLOUDFLARE_AI_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` — FIRST-WAVE AGILE ROLES ONLY: the `blog:pairing` chain tag leads with `@cf/meta/llama-3.3-70b-instruct-fp8-fast` and `blog:latin-tokens-ar` leads with `@cf/meta/llama-4-scout-17b-16e-instruct`; NEVER the heavy chains, NEVER the streaming/fast chain — no streaming in JSON mode, EVO excluded STRUCTURALLY; `llama-3.1-8b*` EXCLUDED from every JSON role — live Phase-3 proof; neuron meter `src/lib/ai-cf-usage.ts` (§8-ج): every call meters `result.usage.neurons` into the Upstash daily key, WARNING ≥80% (queue-health strip) · BARRIER ≥95% skips every new CF call honestly and the role falls to the ordinary chain — the free allocation is never drained to zero; rollback without code: `CF_ARM_ENABLED=0` or absent secrets — the role entries are skipped without consuming attempt budget)**, plus **TWO search arms (search/extraction ONLY, never generators): Tavily (Phase 5-A owner order 2026-10-31 «تنفيذ ذراع البحث Tavily» — free Researcher plan, `TAVILY_API_KEY`) and Exa (Phase 5-B owner order 2026-10-31 «دمج وتفعيل Exa» — free $10/month recurring credit, no card, `EXA_API_KEY`)**. **GEMINI-FIRST LAW (343) — CANCELLED (owner order 2026-10-31 «إلغاء قانون Gemini-First نهائيًا، بما يشمل السلاسل الثقيلة، وإزالة أي أولوية إجبارية لـ Gemini»):** gemini rides both chains as an ordinary TAIL entry (never a lead — the pre-343 3-way rotation openrouter→groq→nvidia runs on EVERY strongest-chain call); with the key absent the entries are skipped without consuming attempt budget. **NO-FORCED-PRIORITY LAW (owner order 2026-10-31 «لا أولوية إجبارية لمزود بعينه — الاختيار حسب الكفاءة والتوافر والحصص ونوع المهمة»):** every chain slot, arm slot and role assignment is a MEASURED efficiency/availability/quota/task-type decision, and every arm/provider fails over honestly — none is pinned by decree (the CF role leads are measured Phase-3 picks that fall to the ordinary chain on ANY failure). **GROUNDED-SEARCH LADDER (§6-أ FINAL language-split state, Phase 5-B):** EN: exa(search API: REAL semantic search on its own free credit + optional /contents full-text deepening + research-JSON synthesis on the ordinary chain, live-URL evidence gate) → tavily(search API) → groq(browser_search) → gemini(googleSearch DORMANT last arm); AR: tavily(search API) → groq(browser_search) → exa(search API WITH the ENGLISH-EQUIVALENT query — Exa's semantic map measured 2/40 Arabic results) → gemini(DORMANT). Ops knobs: `GEMINI_GROUNDED_ENABLED=0` removes the dormant arm without a deploy; `GROUNDED_ARM_ORDER` overrides the whole walk (diagnostics/rollback). The §6-أ/§12-2 optional deepening NEVER fails an article — a failed deepening = a snippets-only bundle stamped `researchDepth:"snippets"` (Exa /contents primary, Tavily Extract the documented alternative; Tavily's own raw_content rides the stamp free). The OpenRouter web-plugin arm is REMOVED from the effective ladder (dead default model 404 + paid plugin 402 — P0-2) and its code stays for diagnostics only; NVIDIA honestly excluded (no search tool). Gemini usage is tracked per-tag to Upstash (`src/lib/ai-usage-gemini.ts`, fail-soft, zero schema) feeding `docs/ai/gemini-weekly-usage-report.md` (weekly workflow); CF neuron usage is metered per call by `src/lib/ai-cf-usage.ts` (same Upstash store, fail-open, in-process degradation without it). The ONE intentional path is `callFreeAIFallbackChain()` (sequential strongest-first, budget-clamped ≤52s — never collapse or bypass it; `callFreeOpenRouterRace` was REMOVED 2026-10-31 by the Phase 5-F cleanup frame: zero consumers since the legacy swap route retired, its "swap only" description in this law was the P2-2 drift); consumers never fetch provider URLs themselves (the 2026-08-27 consumer-side ban stands — only ai-provider.ts speaks the native shape); scheduled/batch AI follows the native-GHA pattern (`scripts/blog-runner/run-step.mts`), never new Vercel-capped endpoints.
- **BLOG PIPELINE v3 + BILINGUAL PAIRING (Phase 157):** six phases p0→p5 under `/api/cron/blog/` with REQUIRED `?lang=en|ar`; one queue row = ONE article in ONE language; 1 slot/day/language (EN 22:00 UTC · AR 05:00 UTC); the ONE daily topic yields TWO rows sharing `pair_id` + sealed `sharedBrief` (adopt ≤72h · join ≤48h — widened from 48h/30h by AUDIT §9-2.5, 2026-09-29; PAIRING_MAX_ATTEMPTS raised 2→3 with maxModels 4 by Phase 5-E/§10-هـ-2, and queue-health surfaces the 7-day adoption rate; **RESUME PAIRS (Phase 5-E/§10-هـ-1, owner order 2026-10-31): an UNPAIRED resumable row gets its own pairing attempt before the resume proceeds — `runResumePairingSelection` (blog-pairing.ts) constrains each language's candidate set to the ROW's OWN topic, so the anti-blind law holds by construction (the call only picks the shared angle; any mismatch/topic-rewrite is rejected and the row degrades to the exact plain-resume behavior); `findResumePairCandidate` + `attachPairToQueueRow` (blog-queue.ts) bind BOTH rows into the fresh pair — the measured 0/6 alert root (pairing was CREATE-only; resumed rows published unpaired forever) is closed**); each language runs its FULL pipeline from scratch (never translation), P5 fills `linked_post_id` bidirectionally; ANY pairing failure degrades to legacy independent-row behavior. **MANUAL-PUBLISH BATTERY (Phase 5-D / stage د, owner order 2026-10-31 «نفّذ جميع المراحل المتبقية» approving §12-5):** a draft with `source='ai:article_generate'` can NEVER be published from the editor without passing the light deterministic battery (`runAiDraftPublishBattery` in `src/lib/blog-quality-gates.ts` — word floor 1000 · G4 authority ≥1 · HEAD link verification; confirmed-dead links named for the human, inconclusive fail-open) — manual articles are exempt (a human who wrote the content IS the review); the battery reuses the SAME laws the automated P5 publish enforces, closing the Phase-2 §7-د gap (3/3 published AI drafts had zero authority links).
- **ai_jobs TOPOLOGY:** every batch AI call is an `ai_jobs` row (0024) processed natively by `process-ai-jobs.yml` every 10 min via `scripts/ai-jobs-runner/process.mts`; the ONLY direct-model exception is EVO chat; Vercel routes may ENQUEUE but NEVER call a model; new AI feature = new job_type + processor entry + JOB_GATE row; browser = SELECT-own-row RLS only, writes service-role exclusive.
- **PROVIDER BALANCE + DUAL-KEY POOL:** the chain rotates the leading provider per call across ALL THREE non-gemini providers (the rotation is ALWAYS active — the Phase 5-A cancellation restored it; gemini is never a lead), rotates BOTH OpenRouter accounts round-robin, retries the SAME model on the other account on 401/402/403/429 before falling down the ladder; `callAIWithFallback` stays EXACT (one config → one provider, honest errors — never a silent cross-provider stage); Groq oversized-payload guard is PER-ENTRY (R3, Execution-Path Audit 2026-09-29): when a call's est. size exceeds the 7.2k window, a groq entry's max_tokens is clamped to the remaining window and the entry STAYS in the chain while the clamp keeps ≥3800 output tokens (P2 content re-enters Groq at ~4.8–4.9k max_tokens — the platform's best live survivor, previously evicted from exactly the heaviest calls); below the floor the entry is dropped as before (P4 review stays OpenRouter/NVIDIA-only BY DESIGN). Rollback: `GROQ_MAX_TOKENS_CLAMP=0` restores the pre-R3 global drop verbatim. Canaries: `ai-provider-r3-groq-clamp.test.ts` (P2/P4 payload classes, floor boundary, rollback flag, fast-chain exemption, small-payload no-op).
- **UNIVERSAL MODEL SWITCHER COVERAGE:** every AI subsystem rides the chain with an observational `tag` (subsystem+provider+model+key event); a bare provider fetch outside the chain is banned; new consumers import from `ai-provider.ts` AND register their tag.
- **IMAGE SAFETY v1/v2 (SUPERSEDED):** the retired negation-suffix constant is BANNED by guard-stale-refs; canaries replay the incident prompts.
- **IMAGE SOURCE LAW v3 — PEXELS-FIRST (current):** AI image generation RETIRED; every blog image is REAL stock photography (Pexels primary, Unsplash/Pixabay failover, Pixabay safesearch=true); normal people allowed, nudity/immodesty NOT — `sanitizeImageQuery()` strips NSFW (EN+AR) + negations, `hasNsfwVocabulary()` screens every alt-text; delivery via Pexels src.landscape + next/image WebP; deterministic rotation per `variationKey`; FAIL-FAST without the key.
- **BLOG BODY IMAGE RENDER LAW:** `renderMarkdown()` converts `![alt](url)` → lazy `<img>` BEFORE the link rule; unsafe schemes dropped — guarded by `blog-markdown-images.test.ts`.
- **EVO CHAT SURFACE & HISTORY LAW:** the floating widget is the ONLY EVO chat surface (`/chat` permanently redirects; CTAs open it via `openEvoFloatingChat()`); back-button CLOSES the drawer; assistant links persist INSIDE `body` markdown and render as anchors; persistence is hydration-gated (empty mount-time write must never wipe history); reopening lands on the LATEST message; system prompt carries a hard capability whitelist, answers render plain text only; floating icon ≥48px.
- **EVO-5 CACHE / EVAL / ANALYTICS LAW:** the frequent-question cache (0081, pg_trgm — NO embeddings, NO 4th provider) serves ONLY context-free requests via the pure gate `isCacheEligibleMessage`; a cache-served message KEEPS consuming quota and the cache is fail-open; the system prompt lives in `evo-system-prompt.ts` (single source — `buildSystemPrompt` may never be forked); weekly eval judges the AR/EN reference set into `evo_eval_runs` (zero scored → RED, honest); every model dispatch writes `evo_call_stats`. **EVAL FIDELITY (Phase 5-A, owner order 2026-10-31 — the §12-7 key-add REJECTED):** the eval workflow deliberately carries NO `GEMINI_API_KEY` — it rides the SAME selection mechanism as production (`callFreeAIFallbackChain`, chain:"fast"), which the Gemini-first cancellation aligned; the gemini tail entry sits beyond the eval's maxModels clamp and is skipped keyless anyway. Never add a gemini key to `evo-weekly-eval.yml` to "fix" fidelity — the mechanism alignment is the fix.
- **EVO-6 PARTNER API — REMOVED (owner order 2026-09-10):** do NOT resurrect any partner API/embed surface without a new owner order (retired identifiers banned by guard-stale-refs; 0083 dropped the tables; `EVO_PARTNER_API_ENABLED` is dead config); `evo-cache-server.ts` SURVIVES as the platform chat route's cache module.
- **AI SURFACE DEEP-AUDIT LAW:** every UI control calling an API must target an existing route (CI: `check-ui-wiring.sh`); uploads go through `POST /api/upload` + `GET /api/file` only; AppLayout `coachExtraLinks` lists EVERY `/admin/*` page for isAdmin only; re-audit after ANY new button+endpoint pair.
- **ROLE MODEL v2 LAW (0029+):** `profiles.role` = `client | coach | admin`; STAFF = coach ∪ admin; `is_coach()` = `role IN ('coach','admin')` — NEVER rewrite policies back to `= 'coach'` only; client-data RLS uses `is_coach_over()`; `/admin/*` is admin-exclusive; client surfaces staff-blocked; staff bypass consumer quotas; promotion via the `coach_emails` allowlist (never downgrades an admin) or manual SQL; `coach_assignments` is the 1:1 source of truth. QA test accounts (`@alkemos-test.com`, `is_test_account=true`) may hold ANY role including admin for live interface testing (Test-Accounts Channel §6) — staff lists surface them flagged as test accounts (0067/0102 `p_type='test'`) and they never modify real clients' rows.
- **COACH ACTIVATION + OFFLINE PAYMENTS (0034+):** the coach collects OUTSIDE the site and the site RECORDS it (`coach_payments`) — never touches that money; `extend_subscription()` is guarded (service role / admin / assigned coach); `/api/coach/subscriptions/activate` verifies assignment + role, activates tier 'coaching' ONLY, debits the wallet atomically BEFORE extending (402 `insufficient_wallet`; admins wallet-exempt), refunds on failure; PLAN-BALANCE QUOTA: one unified monthly pool (`ai_plan_usage`, 0085, success-only — nutrition + workout COMBINED: free 2 · premium 4 · pro 8 · coaching 8; guests keyed by hashed browser id); editing + manual uploads UNLIMITED.
- **COACH WALLET LAW (0035+):** `coach_adjust_wallet()` is the ONLY wallet writer (SECURITY DEFINER, row-locked, never negative); top-ups: manual receipt review OR PayPal automated (purpose `wallet_topup`, USD 1:1, deterministic UUID5 — replays idempotent; webhook LOG-ONLY, never credits); quota counts the CURRENT UTC calendar month; self-registration PUBLIC (rate-limited + honeypot; role granted server-side only — 0036).
- **COACH BOOST PACKAGE (0037+):** per-client fees are PACKAGE-based (single debit calculator in coach-limits.ts); coach ads by ATOMIC wallet debit; public profile via the coach-public bucket; coach-only support at `/coach/help`; the WhatsApp share target is REMOVED by decree; the coach's WhatsApp number is served ONLY via `/api/my/coach-whatsapp` (ACTIVE subscription + assignment, never public, never a share target); affiliate commission EXCLUDED for coach-assigned clients (both choke points).
- **COACH CLIENT BOUNDARY + TERMINOLOGY LAW:** SITE COACHING (B2C, admin-reviewed only — 0043) vs COACH SYSTEM (B2B, wallet fee) are TWO money worlds; coaches never see site memberships (0041) and never generate plans without an ACTIVE coaching subscription + assignment (server 402 + DB RLS `plans_insert_coach`); dates are NEVER hand-edited — `extend_subscription` (0018) computes/stacks; coaching prices Starter $20 / Elite $40 (0046); subscription rows always via `canonicalModelTier()`.
- **GLOBAL USD LAW (0038):** fixed owner rate 50 EGP = $1 — every platform-side money figure is USD ONLY (source: `coach-limits.ts`; legacy EGP ÷50 for compat); user-facing money strings never show EGP/ج.م.
- **BRAND NAME LAW:** the site name is written EXACTLY «Alkemos» in every user-visible string; pre-rebrand spellings («Musclehubeg» + variants) are FORBIDDEN in new code; lowercase technical identifiers stay as-is forever.
- **USAGE LIMIT ENFORCEMENT LAW:** every limit advertised in `memberships.ts` MUST be enforced SERVER-SIDE at the only consuming route, and the client UI mirrors the SAME resolved tier; anonymous chat throttled SERVER-SIDE via salted-hash `evo_anon_usage` (fail-open); plan intents consume the UNIFIED monthly pool (success-only) — sized 2026-10-28 (owner order «تجميع حصص الاشتراكات المدفوعة») as the AGGREGATE of every distinct effectively-active paid tier (`resolveUnifiedPlanPoolLimit` — premium 4 + pro 8 = 12; coaching stacks its 8; one contribution per tier per month, ends with its paid period; usage never zeroed nor double-counted); swap/regenerate stays on the WEEKLY quota — never double-count one message in both; advertised numbers change ONLY in memberships.ts.
- **SCHEDULE HEALTH LAW:** any "blog stopped" report starts with schedule forensics (`GET /actions/runs?event=schedule`), NOT code re-reading; backstop `/api/cron/dispatch-pipelines` (CRON_SECRET, fail-closed, daily 23:40 UTC; slot expected 90 min after its hour; coverage = max(non-failed runs, posts published today); P5 refuses a second same-day automated article) + stale-worker re-dispatch; requires `GITHUB_DISPATCH_TOKEN`; diagnose quota BEFORE schedules, schedules BEFORE code.
- **PLAN JOB RECOVERY LAW:** enqueued plan jobs are SURVIVABLE state — persist in localStorage (24h TTL) with mount-reattached watchers; finished jobs surface as one-click recovery cards (never double-saved); regeneration enqueues the replacement FIRST and deletes the old draft only after the new plan arrives and only while still a draft; staff requesters bypass the swap quota.
- **EVENT-DRIVEN AI DISPATCH LAW:** enqueue alone is NOT enough — every enqueue path push-triggers the runner (`src/lib/ai-runner-dispatch.ts`, fail-open); `POST /api/ai/jobs` answers honest `runnerDispatched` + `etaMinutes`; `GITHUB_DISPATCH_TOKEN` is REQUIRED in production; new job types register in FOUR places (AI_JOB_TYPES + JOB_GATE + sanitizeJobPayload + processor registry); completed `article_generate` jobs are ALWAYS materialized (pipeline-dispatched PUBLISH through P5; fallback land as DRAFTS); the runner exits NON-ZERO on permanent failure.
- **COACH PIPELINE PARITY (Phase 162):** `article_generate` rides the SAME paired pipeline as automatic generation — enqueue dispatches `blog-post-{ar|en}.yml` via workflow_dispatch (`src/lib/blog-pipeline-dispatch.ts`, FAIL-OPEN) and the row becomes a dispatch RECEIPT; an optional coach topic (≥10 chars) rides `PIPELINE_TOPIC` → P0 seals it into MY side of the brief; the single-shot generator stays the FALLBACK; the automatic cron slots, concurrency groups and one-article-per-day quota are UNTOUCHED.
- **ARTICLE QUALITY FLOOR + ANTI-FORMULA (numbers corrected 2026-09-29, AUDIT_REPORT §9-0.4 — the old «ASK = 1100-1400 words, 6-9 sections» described the FALLBACK generator, not the standard):** MAIN PIPELINE ask = **1500-2500 words** (P2 mandatory ask) with **execution floors ≥1000 at BOTH writing steps** (1200 until 2026-10-02 — lowered to 1000 by owner order, Phase 323; R4, Execution-Path Audit 2026-09-29 — `BLOG_EXECUTION_WORD_FLOOR`: P2 generation and P4 review reject short output AT THEIR OWN STEP, where the ×3 retry is a cheap fresh model draw; the old 400-word parse nets let 419-1271-word drafts AND review shrinkage (live-measured 1201→752) burn images+review and die at P5; the R1 repair loop's p2 force regeneration covers any residual short class — the former 1200-1300 band vanished when both floors aligned at 1000) and a deterministic **P5 publish floor ≥1000 words** (1300 until 2026-10-02 — lowered to 1000 by the same owner order, Phase 323; too-short drafts fail honestly at P5 and the day's slot is topped up — same mechanism as the Latin gate), **5-7 H2 sections**, FAQ 4-7 article-specific questions to faq_json (deterministic `filterFaqsByRelevance` gate ≥2 shared words; `splitFaqSection` lifts the markdown FAQ section in three LIFT-ONLY formats — `**bold**`, `### H3`, and R4's conservative plain-text question line (≤25 words, ends ?/؟, never steals an answer's first line) that recovered the live «FAQ count 0» deaths of row 38f230fb), 2-3 real internal links, distinct meta_title; floors are rejection NETS; random opening archetype; shallow drafts requeue; the single-shot fallback (ai-job-processors) keeps its own 1100-1400 DRAFT spec (coach-review drafts — never auto-published); lowering any contract requires owner approval in the same commit message.
- **P5 QUALITY BATTERY (AUDIT_REPORT §9-1.4, 2026-09-29 — expanded publish gate, all deterministic):** besides the 1000-word floor (lowered from 1300 by owner order 2026-10-02, Phase 323), P5 enforces via `src/lib/blog-quality-gates.ts`: H2 sections ≥5 · final FAQ count within 4-7 (`EDITORIAL_FAQ_COUNT_RANGE`) · ≥1 external link to an AUTHORITY domain (`EDITORIAL_AUTHORITY_DOMAINS` — the whole blog is YMYL, so the floor applies to every article) · anchor-grammar gate (raw keyword-list anchors / >5-word stacks rejected unless an exact published-title anchor) · quoted-search-phrase gate (the §C4 lowercase pasted-query pattern, EN+AR). ANY violation → the row fails honestly with the gate diagnostic → the 23:40 backstop tops the day up (same mechanism as Latin/length gates). Weaker drafts are REJECTED, never silently published.
- **UNIFIED EDITORIAL CONSTITUTION (AUDIT_REPORT §9-1.2, 2026-09-29):** the article writing laws — LANG / ANSWER-FIRST / E-E-A-T / FACT GUARD / DEPTH-OVER-LENGTH / FAQ CONTRACT / authority-domain whitelist / anchor-grammar law — live ONCE in `src/lib/blog-editorial-law.ts` and are composed byte-exact by P1/P2/P4 AND the coach-path fallback generator (the AR_MSA_EDITOR_LAW Phase-175 pattern, generalized). Forking a law text into any prompt builder is FORBIDDEN — the no-fork canaries (blog-editorial-law.test.ts + blog-faq-quality source pins) fail the build on drift.
- **RESEARCH FALLBACK VISIBILITY (AUDIT_REPORT §9-1.3, 2026-09-29):** a P0 run whose model chain fails and falls to the static curated pool is stamped `researchSource:"fallback"` on the queue row's bundle + a loud P0-route alert in the run log + a queue-health panel issue (24h window) — fallback is never silent again. The GSC real-search source remains owner-blocked (needs the owner's Search Console API credentials).
- **OWNER REVIEW WORKFLOW (AUDIT_REPORT §9-2.1, 2026-09-29 · migration 0097):** every pipeline-published article lands `review_status='pending'` with `last_reviewed_at` NULL — its page shows the honest «AI-generated · medical review pending» byline and the Article schema OMITS `reviewedBy`/`lastReviewed` (seo.ts honest-review law). The claims flip to TRUE only when the owner actually reviews: the admin-gated `POST /api/admin/blog/review` action (BlogAdminView «اعتماد» button) or the owner's own editor publish/save stamps `review_status='reviewed'` + the real `last_reviewed_at`. NEVER set last_reviewed_at automatically — the old template printed a fabricated review claim on every article (audit C2/F2).
- **HONEST CITATION POLICY + LINK-VERIFY GATE (AUDIT_REPORT §9-2.2, 2026-09-29):** citing evidence is allowed ONLY as markdown links to `EDITORIAL_AUTHORITY_DOMAINS` (WHO/NIH/CDC/Mayo + the sport-science bodies ACSM/ISSN/NSCA/health.gov/NASM/ACE/eatright — audit-2 owner order 2026-09-29: the corpus is training/nutrition-heavy, not purely medical, so sports articles now have natural citation targets for the G4 floor) — the FACT GUARD law text carries it; P5 then HEAD-verifies every external link in the final body (`src/lib/blog-link-verify.ts`): confirmed-dead citations (404/410) are removed to their anchor text BEFORE the quality battery, so the G4 authority floor measures the verified state; inconclusive verdicts (403/405/429/timeout) keep the link (fail-open — an authority that refuses HEAD must never cost a good citation). Fabricating studies/authors/titles/URLs/statistics remains absolutely forbidden.
- **QUARTERLY EDITORIAL-LAW PRUNING (AUDIT_REPORT §9-2.6, 2026-09-29):** first week of Jan/Apr/Jul/Oct (same cadence as the §12.5.2 docs-gate spot-check), review the live instruction set as «قانون حي × حارس × أثر مقاس»: every prompt law must name its guard (or be unguarded by explicit choice) and show measured effect in the sample; a law with no measured effect merges into a sibling or is deleted in that frame, its narrative moving verbatim to `archive/PROMPT-LAW-HISTORY.md` (the append-only prompt-law history — prompt files keep CURRENT-LAW comments only, never phase chronologies). The cycle exists because instruction accumulation is a measured root cause (audit C9/F15: 190+ phase layers, 10-12 parallel law blocks per prompt).
- **ARABIC PURITY LAW (Phase 176):** AR articles carry ZERO bare Latin/English words inside Arabic prose — exceptions: parenthetical glosses after the Arabic term and brand names; detection is DETERMINISTIC (`scanLatinContamination` in blog-msa.ts), enforced at P4 (targeted repair + re-gate) and P5 (final body gate fails honestly; contaminated FAQ answers drop); one law, three surfaces (AR_MSA_EDITOR_LAW / LANG_RULE.ar / coach prompt) — no fork. **Localized repair (R2, Execution-Path Audit §9-4, 2026-09-29):** the P4 repair no longer regenerates the whole article (~9.5k-token payload — excluded Groq, returned English junk; 5 of 7 AR final failures in the audit window): `repairArabicLatinContamination` runs a DETERMINISTIC dictionary pass first (`LATIN_REPAIR_DICTIONARY` in blog-pipeline.ts — the Phase-176 prompt's own table + audit-window-measured tokens, phrase keys before fragments; zero AI calls for the covered class), then a SMALL token-only conversion call (tag `blog:latin-tokens-ar`; payload = the token list, est. <1k tokens ⇒ Groq-eligible again; JSON {token→arabic} per-value-gated — only pure-MSA Arabic terms accepted, Latin/dialect/junk values rejected) applied through the scanner-mirroring engine (fences/glosses/URLs/link-targets never touched); the judges `validateMsaConversion`/`scanLatinContamination` stay byte-identical (blog-msa.ts untouched by R2). Rollback: `LATIN_REPAIR_LEGACY=1` restores the pre-R2 full-article path verbatim. Canaries: `blog-latin-repair-r2.test.ts` (the five live failure classes + payload/whitelist-collision/engine-protection pins).
- **QUALITY-FIRST LAW — OWNER GENERAL CONDITION:** maximum quality for EVERYTHING; prompts, floors, and model order preserve-or-raise the ask; smaller models are last-resort fallbacks; resilience work increases AVAILABILITY of strong models, never substitutes weak output.
- **SEO-SLUG + IMAGE BUNDLE LAW:** every article_generate draft lands COMPLETE — model-produced English SEO slug (translates the MEANING, never transliterates; latin-only nets with the dated fallback as LAST net) + 3-5 ENGLISH image_queries resolved Pexels-first (images[0] = featured + cover_alt; images[1..] at section boundaries); slug/image enrichment can NEVER fail the article.
- **ONE-SLUG-LAW:** ALL slug logic lives ONLY in `src/lib/slug.ts` — canaries fail the build if a local copy reappears; the M15 save gate remains the boundary verifier.
- **TOOL RESULTS UX LAWS:** the editor AI-results panel is APPEND-ONLY with DONE-job hydration (≤24h) + manual refresh; dismissed ids persist in localStorage; «نسخ» copies ONLY the paste-able deliverable; failed-row alerts dismissible via the `.delete().in("id", ids)` shape; every standalone image block carries its own safe swap button replacing EXACTLY that occurrence.
- **CANARY PINNING POLICY (Phase 290 — ARCH-REMEDIATION, audit P2-3):** canaries pin BEHAVIOR and STRUCTURE first — exact cosmetic COUNTS only where the count is itself the law (image-safety v3, MSA purity, slug law, UI-wiring parity); a copy tweak must not require same-commit test edits, and a cosmetic count should be asserted structurally (exists/ordered/once) instead of numerically. True regression pins are never weakened.
- **GUARD-COMMITMENT COROLLARY:** a guard that is not COMMITTED is not a guard — any script a workflow references must appear in the SAME commit.
- **PROJECT-WIDE PREVENTION LAW:** button → dead target (`check-ui-wiring.sh`), type without processor / orphan processor (CI + ai-jobs-visibility parity), dishonest success (explicit non-zero exits), silent rot (`/api/ai/queue-health`). Feature DoD: button → route exists, job → processor, visible materialization, honest runner exit, docs in the SAME commit.
- **RATE-LIMIT RESILIENCE LAW:** free-tier 429s are TRANSIENT — retries must OUTLIVE the window, not re-burn it (70s sleep after a rate-limit requeue; heavy article calls walk the model chain — corrected 2026-09-29 (AUDIT_REPORT §9-0.4): P1 `maxModels: 2`, P2 `maxModels: 3` (R3, Execution-Path Audit 2026-09-29 — was 2; the 480s chain budget funds the third entry, Groq re-admitted via the per-entry clamp), P4 `maxModels: 4`, latin-repair `maxModels: 3` — the old «maxModels 5» matched no call site; R2 (2026-09-29) split the latin-repair site: the live token call `blog:latin-tokens-ar` runs `maxModels: 3`, the legacy full-article path — reachable only via the LATIN_REPAIR_LEGACY rollback flag — keeps its original 3).
- **REPAIR LOOP LAW (Execution-Path Audit §8.2 R1, 2026-09-29):** a deterministic P5 gate failure is a REPAIR DIRECTIVE, never a terminal event by itself — the 500 body carries a machine-readable `rerunTarget` from the closed-set message↔target map (`src/lib/blog-repair-target.ts`, unit-pinned to the live failure messages so wording drift breaks a canary), `run-step.mts` translates it to exit code 3 + a `RERUN_TARGET=<step>` stdout line, and `run-step.sh` EXECUTES the directive in-run: it re-runs the targeted step and every step between it and P5 on the SAME queue row — ≤ `MAX_REPAIRS` (2) cycles — before the honest markFailed of today (`p2-content` repair rides `?force=1`: regenerate content over the draft, research0/outline/images preserved; P0–P4 keep their plain ×3 transient retry; quota/duplicate skips are 200s and never enter the loop). The loop changes WHO recovers a failed row and WHEN — NEVER what is acceptable: no gate, threshold, or editorial rule is weakened. Rollback = exit code 3 → 1 (the loop stalls itself). Loop mechanics are pinned by `scripts/blog-runner/run-step-loop-test.sh` (simulated-GHA integration matrix, committed evidence). **Directed repair (B1, audit §8.2 B1 — owner order 2026-10-01):** when the target is `p4-review`, the P5 500 body additionally carries the gate violations as `repairDiagnostics` (the message minus the `p5: ` prefix and the `— rerun p4-review` tail), `run-step.mts` re-emits them as a `RERUN_DIAGNOSTICS_B64=` stdout line, and the wrapper threads them to the p4-review child via the inline `P4_REPAIR_DIAGNOSTICS` env (never GITHUB_ENV) → the P4 route passes them into `reviewAndEnhance` as a ONE-SHOT repair directive in the review prompt — repair guidance naming the exact violations, NOT a new editorial layer (absent on every normal run; each repair cycle captures its own fresh diagnostics). Paired with it, the P4 review prompt pins the always-on LENGTH-PRESERVATION CONTRACT (final ≥ measured draft words; deletions offset by depth, never filler — owner quality-first law). Canaries: `blog-repair-directive-b1.test.ts` + `blog-repair-directive-b1-route.test.ts` + loop-test sc10–sc12. **Repair observability (R5, same audit §10 Phase R5, 2026-09-30):** every directive STAMPS a cumulative `repairLoop` marker into the row's bundle (`stampQueueRowRepairDirective` — survives the chain because p2-force/p4 spread the bundle; the researchSource/coachRequested stamp precedent) and increments the run's `REPAIRS_USED` GITHUB_ENV export, so the workflow Summary line + the `/api/ai/queue-health` `repair` counter (14-day window: published · afterRepair · exhausted · sharePct · recoveryPct) measure «repair-first vs regenerate» from DB truth. Pure observability — no gate, status, or budget behavior changes. Canaries: `blog-repair-r5-observability.test.ts` + the R5 describe in `blog-repair-contract.test.ts`.
- Never log the AI response in production paths (PII / partial reasoning); local fallbacks (`src/lib/ai-local.ts`) stay for graceful degradation; any change to the AI system prompt requires owner approval; EVO chat quota accounting stays server-side in the tamper-proof `evo_chat_usage` ledger (0022) — never client-written rows again.

## 9. Final Report Format

> **Deprecated (2026-08-24):** Superseded by §12.9. Do not use this format.

---

## 10. Git & Commit Conventions

- Branch off `main` for non-trivial changes; the owner may merge feature branches or commit directly to `main` for small fixes.
- **Commit author email (LAW — hardened 2026-09-29, GIT-IDENTITY):** `muscleshubfit@gmail.com` for BOTH author and committer on every commit, no exceptions (audit/report commits included). Agents keep their display name (`Super Z`, `Alkemos Agent`…) but MUST set this email first: `git config user.email muscleshubfit@gmail.com`. WHY: Vercel's Git integration authorizes each push-triggered deployment by matching the commit author email against the members of the `muscleshubfit-2941` team — any other address (`*@alkemos.local`, `*@alkemos.com`, `z@container`, `*@users.noreply.github.com`, ad-hoc audit identities) yields «attempted to deploy … not a member of the team» and the deployment is BLOCKED. Incident 2026-09-29: audit commit `fe613c04` signed `Independent Audit <audit@alkemos.local>` → Vercel refused the deploy (GitHub Actions itself green; production unaffected — docs-only commit). Recovery: NO history rewrite — the next member-email commit supersedes the blocked deployment. Pre-push identity check (extends §3.5): `git log -1 --format='%ae'` must print `muscleshubfit@gmail.com`.
- Prefixes: `feat:` new feature · `fix:` bug fix · `docs:` documentation only · `refactor:` no behavior change · `security:` security-sensitive (pre-approved per §7) · `chore:` tooling, deps, build config.
- **Commit-message budget (Phase 237 — migration Phase 5; applies from Phase 237 forward, history untouched):** subject ≤ 72 chars; body ≤ 500 chars; the body POINTS at the task's `worklog.md` entry (Task ID) instead of restating it — one narrative per change, three surfaces that agree (audit F-06: worklog + STATE + commit message must not triple-store the same prose).
- **Deploy-skip law (VERCEL-USAGE-6, 2026-09-21 — enacts audit doc §10.5-2(a)):** a commit touching ONLY `docs/**`, `archive/**`, `.github/**`, `scripts/**`, or any `**.md` MUST carry `[vercel skip]` in its subject — Vercel then skips the build entirely while GitHub Actions still runs it (`[vercel skip]` is Vercel-specific and does NOT mute the push-triggered cleanup workflow the way `[skip ci]` would). Why: every build books +0.42GB Deployment / +0.29GB Functions on the usage meters instantly while deletions deduct only at the period reset (audit §10.3/§10.7) — docs-only builds are pure meter cost with zero site change. Never add the token when `src/**`, `public/**`, `supabase/**`, or build config (`next.config.*`, `package.json`, `tsconfig.json`) changed — those need a real deploy. Mechanical backstop (owner, one-time — Project ▸ Settings ▸ Git ▸ Ignored Build Step ▸ Custom): `bash -c "git diff --name-only HEAD^ HEAD | grep -vE '^(docs/|archive/|\.github/|scripts/)' | grep -vE '\.md$' | grep -q . && exit 0 || exit 1"` (exit 0 = build, exit 1 = skip).
- **Audit-request budget law (VERCEL-USAGE-7, 2026-10-02 — enacts audit doc §11.5):** any audit/repair/verification session hitting PRODUCTION must obey: (1) sample over sweep — ≤30 URLs per route-type, full-sitemap crawls (19,498 URLs) are for legitimate crawlers only; (2) no bulk cache-busting (`?cb=`/`?_=`) — every new cache key per PoP = a fresh origin invocation; (3) rate ≤1 req/s for sequential scans; (4) repeated Lighthouse/load tests (5+) go against a PREVIEW deployment, not production; (5) session cap ≤5K production requests total; (6) open AND close every session by reading `GET /v2/usage?teamId=…&type=requests&from=<ISO.000Z>&to=<ISO.000Z>` to measure the session's own footprint. Why: ONE intensive audit day (2026-09-28, working-hours pattern 08–17 UTC) burned 190,042 function invocations + 1.97GB origin transfer + ~2.5× the daily Fluid CPU — a full week of normal traffic in a single day, and 20% of the rolling 30-day invocation meter.
- Push to `origin` only after the local verification step (§3.5) passes — if `tsc --noEmit` fails, do not push.

---

## 11. When in Doubt

Ask the human supervisor — early, not after a half-built feature. Cite the exact file + line + observed behavior. Prefer reversible changes (a new file is reversible, a dropped column is not). Document assumptions in the final report under "Potential risks" / "Implementation findings".

---

## 12. Project Workflow Rules (Adopted 2026-08-21)

> **Status:** Active binding policy — applies to every task from 2026-08-21 onward; changeable only by explicit Owner directive. These rules supplement §3 and §4; where they conflict with an older section of this file, these rules win.

### 12.1 Communication

Reports short and direct; no repeated explanations or already-executed steps; no scope expansion or reopening finished tasks without a reason; stop and ask the Owner only on genuine ambiguity.

### 12.2 Execution Flow

Every task executes in this order inside the same task:

```
IMPLEMENT → VALIDATE → DOCUMENT → COMMIT → PUSH
```

Do NOT wait for a separate instruction to validate, document, commit, or push — unless the Owner explicitly asked to skip one of these steps (for example, "show me the report before commit").

### 12.3 No Redundant Verification

Do not create a separate command to re-verify what was already verified; results belong in the task's own report; after success, move directly to the next task.

### 12.4 Task Continuity

Do not redo completed steps; preserve the current task's state; with queued tasks, advance automatically; never start a new task from memory or guessing — use the project's actual state (code, migrations, docs, worklog).

### 12.5 Documentation

Document every completed task while executing it, using the existing files (`STATE.md`, `worklog.md`, `AGENTS.md`, `DEVELOPER_GUIDE.md`, `SECURITY.md`, `README.md` — status history frozen in `archive/` since Phase 115) — no new documentation system if the existing one suffices; one comprehensive review pass is allowed at the end of a large body of work.

> **Consolidated (2026-08-24; repointed 2026-09-19 — Phase 236, migration Phase 4):** doc lifecycle statuses live in `docs/README.md` (the registry). Do not create new documentation files — except `STATE.md` (Phase 107, owner-approved knowledge operating system; §3.6/§3.8), `CONTRIBUTING.md` (Phase 115, owner-directed contribution policy), and `docs/README.md` (Phase 236, migration-plan-sanctioned registry).

#### 12.5.1 `worklog.md` Entry Template (Binding)

Every task MUST append exactly one entry to `worklog.md` following this template. No free-form entries are allowed.

```markdown
---
Task ID: <unique ID, e.g. AFFILIATE-BANNERS-2026-08-24>
Agent: <agent name, e.g. Main (Z User)>
Task: <one-line description of the task>

Work Log:
- <concrete step 1>
- <concrete step 2>
- ...

Stage Summary:
- <key results / important decisions / produced artifacts>
- Push status: <pushed | not-pushed>
- Commit SHA (optional, post-push): <sha>
```

Rules: the `---` separator before each entry is mandatory (append-only log); `Task ID` MUST be unique across the file (search before adding); `Work Log` is bulleted, factual, chronological; `Stage Summary` records the push status (matches §12.9). **SHA law (Phase 288 — ARCH-REMEDIATION, audit RC-1):** the commit SHA is OPTIONAL post-push provenance only — `git log` is the authoritative ledger (check B already ancestor-verifies STATE's recorded commit). A commit can never contain its own SHA: the «تسجيل SHA بكوميت مستقل» follow-up-commit practice is RETIRED (it doubled every task's commits and re-ran 4 workflows + Supabase Preview per task). **One task = one commit.**

**Entry budget + evidence (Phase 237 — migration Phase 5; hardened Phase 288 — ARCH-REMEDIATION):** each entry ≤ 60 lines (LIVE-VERIF entries ≤ 40); detail belongs in committed scripts or `docs/README.md` registry rows, not prose. An entry that cites a verification script or any evidence artifact must point at a **committed** path (`scripts/live-verify/<task>.sh` or similar) or state explicitly «local-only, not preserved» — a log referencing evidence that exists nowhere is a false log (audit F-11). **The live file IS the active window (Phase 288 hard law, audit P1-1): ≤ 12 entries AND ≤ 128 KB, enforced by `scripts/docs_audit.py` check H5** — anything below the window rotates verbatim to `archive/WORKLOG_ARCHIVE.md` in the SAME commit via `python3 scripts/worklog_rotate.py` (size-driven, never calendar-driven, never one-shot).

#### 12.5.2 Documentation Audit (exception-driven — Phase 293)

> **Rewritten (2026-09-28 — ARCH-REMEDIATION, audit P4-3):** the mandatory MONTHLY full-registry pass is RETIRED — it audited what the per-push gate already verifies (check M re-validates every registry row's paths and coverage on EVERY push; check N re-verifies CI_GATES coverage), and its DOC-AUDIT worklog entries grew the worklog it was auditing (the audit-of-the-audit recursion, RC-5). The registry is now maintained EXCEPTION-DRIVEN:

- **Per push (automatic):** checks M/N (registry bidirectional + workflow coverage) + the full `scripts/docs_audit.py` battery — a drift the old monthly pass could catch is caught at push time instead.
- **Quarterly spot-check (first week of Jan/Apr/Jul/Oct):** review the gate itself, not the registry — per-check-family failure rates over the quarter (a check that never fails is a candidate to retire/merge; one that fails constantly is a fix-up generator), plus the check-family budget below. Log it as a `DOC-AUDIT-YYYY-MM-DD` worklog entry ONLY if it changes something.
- **After any force-push or major git operation (within 24 hours):** one `docs_audit.py` + `docs_parity.py` run — the standing rule, unchanged.

**Check-family budget (audit P4-2, law):** `scripts/docs_audit.py` is capped at its current check families; any NEW check must RETIRE or MERGE an existing one in the same commit (H5 merged into H and check I was retired to pay for it — the precedent). The gate governs the docs; this budget governs the gate.

### 12.6 Duplicate Tasks

Treat EVO AI and AI Chat as ONE task (`EVO AI / AI Chat`); never record the same function as two tasks under different names; check whether an equivalent task already exists before adding any.

### 12.7 AI Master Roadmap

Aggregate AI task lists from actual source code, `STATE.md`, `worklog.md`, `DEVELOPER_GUIDE.md`, and context; classify each task as `COMPLETED` / `IN PROGRESS` / `DEFERRED` / `NOT STARTED`; do NOT start implementation merely because a missing task was discovered — stick to the task the Owner assigns.

### 12.8 Source of Truth

Priority (highest wins):

1. Actual Code & Config (`src/**`, `next.config.ts`, `tsconfig.json`, `package.json`, `vercel.json`)
2. Database / Migrations (`supabase/migrations/*.sql`)
3. QA Evidence (`STATE.md` ملخص جودة المرحلة · `archive/QA_CHECKLIST.md` frozen at Phase 115, manual smoke tests in commit messages)
4. Project Documentation (`README.md`, `DEVELOPER_GUIDE.md`, `STATE.md`, `AGENTS.md`, `SECURITY.md`)
5. Conversation Context
6. General Knowledge

If documentation conflicts with code, **code wins**.

### 12.9 Final Report

After every task: what was done · verification result · commit SHA · push status · next task · raw SQL links (mandatory for schema/DB tasks — §6). **PLAIN-STEP EXECUTION GUIDE (BINDING):** any task requiring a MANUAL owner action (run SQL, trigger a workflow, set an env var, redeploy, click anything) ships a short numbered plain-language walkthrough: exact URL → exact button/tab → what to paste/select → what success looks like → how to roll back. Assume a non-technical reader; reporting a manual step without this guide is an INVALID delivery (same severity as §6 without the raw link).

### 12.10 Out-of-Scope Prohibited

Do not add steps or improvements outside the current task's scope; do not wait for a new instruction to validate / document / commit / push after task completion, unless the Owner asked otherwise.
