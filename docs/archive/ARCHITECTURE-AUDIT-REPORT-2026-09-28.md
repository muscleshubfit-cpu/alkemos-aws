# Repository Architecture Audit — Documentation · Testing · Validation · Git · CI (2026-09-28)

> **Provenance:** owner order 2026-09-28 — audit the repository's documentation, testing, validation, Git and CI architecture ONLY, modify nothing, and write the complete findings + remediation plan into ONE repository document that becomes the authoritative reference for the later implementation session. This file is that document.
> **Baseline:** `origin/main` @ `3ea85680409f30321976a8e2e427d1e42b950372` (2026-09-27 15:51 UTC — «docs: HOME-REFINE-286 — تسجيل SHA بكوميت مستقل»). Every fact below was verified against this tree or against the live GitHub/Vercel APIs on 2026-09-28.
> **Method (strictly read-only):** full clone with all refs · static file/byte inventory · git history analytics over all 1,252 commits · local re-run of the static knowledge gate (`scripts/docs_audit.py`) only — **no test suite was executed** · GitHub Actions API (workflow inventory, per-workflow run statistics, branch protection, Dependabot) · Vercel API (deployment timeline). No branch, tag, file, workflow, test, rule or documentation was modified; no application code, UI, business logic, API, database, SEO or deployment configuration was touched.
> **Sanctioned deviations (the audit order supersedes AGENTS.md §3.6/§3.8/§12.5 for this single commit — owner authority §2):** this file lands WITHOUT a `worklog.md` entry, WITHOUT a `docs/README.md` registry row, and WITHOUT a `STATE.md` refresh, because the order forbids modifying any existing file and forbids duplicate reports. The implementation session MUST land these parity updates as its first action (remediation item **P0-3**). The commit follows §10 (`docs:` prefix + `[vercel skip]` — docs-only change).
> **Lifecycle status:** **EXECUTED (2026-09-28 — remediation phases 287–293, session ARCH-REMEDIATION).** P0 = Ph 287 (RED gate fixed; report registered registry+worklog+STATE; 3 merged branches deleted; **P0-2 owner-pending**: private repos on GitHub Free cannot carry branch protection — API 403 on both branches/protection and rulesets, the same 2026-09-19 blocker; needs owner GitHub Pro or public repo, walkthrough in the DOCS-CONTEXT-MIGRATION-P6-CLOSURE worklog entry) · P1 = Ph 288–289 (worklog hard window ≤12 entries/≤128KB — check H5 + `scripts/worklog_rotate.py`, 147 entries rotated verbatim, 740.7KB→~60KB; SHA-registration commit retired, one task = one commit; STATE history ladder relocated verbatim to the archives, 31,147B→~10.7KB, ladder ≤ 2 rows; registry Last-updated column retired — check M bidirectional, check I retired, 4 unregistered docs registered) · P2 = Ph 290 (quality-gate.yml `paths-ignore` for docs-only pushes — verified live: no quality run on the docs-only push; §3.5 scope-matched local verification; canary-pinning policy) · P3 = Ph 291–292 (24 EXECUTED point-in-time reports relocated to docs/archive/ + reports-are-born-archived law, live docs/ 42→18 files; SEO-GEO §12 log extracted verbatim (~300KB), plan 341.8KB→45.4KB; AGENTS §8 narratives relocated verbatim to TECH_REFERENCE §6 with mandated session reading re-scoped to §1–§4+§12 ~17KB; DESIGN mirror unification — DESIGN.md = law, DESIGN_SYSTEM.md + design-tokens.ts pointer-only) · P4 = Ph 293 (external-mirror weekly schedule parked until owner setup; check-family budget law ≤20 with retire/merge rule; §12.5.2 monthly full pass retired → per-push M/N + quarterly gate self-review; re-measure target 2026-10-12 recorded in STATE «المفتوح الآن»). Closing numbers: live worklog 740.7KB → 59.6KB · STATE 31,147B → 10.7KB · live docs/ files 42 → 18 · mandated AGENTS read ~41KB → ~17KB · docs-only pushes running the quality battery: 0 (paths-ignore verified via API) · docs-parity gate: GREEN.

---

## 0. Executive summary

The repository runs a self-described "knowledge operating system" (STATE.md + AGENTS.md law file + append-only worklog + lifecycle registry + a 20-family static gate, `docs_audit.py`, 725 lines) that was built to stop documentation drift. It succeeds at drift *detection* but has inverted into the project's **primary consumer of execution context and commit bandwidth**: the governance layer now generates more writes, more gate runs and more reading load than the product work it governs. Verified at the baseline commit:

1. **Mandated per-session reading is ~90 KB before any task work starts** (STATE.md 31 KB + AGENTS.md 41 KB + top-3 worklog entries ~19 KB + last-5 commit subjects), against a documented "30-second" design goal. Total tracked Markdown is **~3.96 MB**, of which well under a quarter is live reference material.
2. **Per-phase write amplification:** every task must update 6–10 governance surfaces (worklog entry, STATE phase row + QA row, registry row dates, `Last updated` headers on 5 governed docs, README feature law, canary counts, and — since Phase 281 — a **second "SHA-registration" docs commit** per task). 5 of the last 8 commits on main were pure governance commits.
3. **STATE.md is at 97.3% of its 32,000-byte hard cap** (31,147 B / 100 lines) because it stores a 25-row phase-history ladder + 9 QA history rows; new phases now require re-compressing old rows (Phase 286 did exactly that).
4. **worklog.md regrew from ~32 KB to 740.7 KB in 9 days** after the one-time Phase-237 rotation; the rotation mechanism ran once (2026-09-18) and nothing enforces it — no byte cap exists for the worklog (only STATE has one). 135 of its 157 live entries sit below the "active" top-12 window.
5. **All push-triggered CI gates run on every push with zero path filters** — 46 docs-only `[vercel skip]` commits since 2026-09-21 each ran the full tsc + eslint + vitest (1,729 tests) battery plus Supabase Preview.
6. **The Docs & schema parity gate is RED on main right now** (check I: DESIGN.md header date) and the last two pushes landed anyway — `main` has **no branch protection** (`protected=false`), the exact F-03 item left owner-pending by the 2026-09-19 docs-context audit. 28 of the gate's last 100 runs failed.
7. **Git refs are quiet:** 3 non-main branches (all merged into main, stale since 09-05/09-19/09-21) and 2 historical tags; no workflow, gate or doc depends on them.
8. **Vercel's docs-skip works** (verified via API: docs-only commits → CANCELED deployments; code commits → READY) — Vercel runs no tsc/vitest, so the advisory CI gates are the only automated quality enforcement.
9. **Why prior cleanups didn't hold:** three doc-governance remediations in 12 days (DEEP-AUDIT 09-16 → DOCS-CONTEXT migration 09-19 → DOC-REMEDIATION-274 09-24) each *added* enforcement (the last added 9 new checks) but **never reduced the per-phase write load**; rotation stayed manual, STATE kept its history ladder, and enforcement stayed advisory. The system regrew to its old size in ~1 week (§A6).

---

# PART A — VERIFIED FACTS

## A1. What currently consumes execution context, and why

### A1.1 The context inventory (bytes, tracked files, baseline commit)

| Surface | Size | Role | Live share |
|---|---:|---|---|
| `worklog.md` | **740.7 KB** / 3,491 lines / 157 entries | Active task log — but only the **top-12-entry window (~55 KB)** is "active" per policy; **135 entries / ~685 KB below the window are still in the live file** | ~7% |
| `archive/WORKLOG_ARCHIVE.md` | 926.2 KB / 277 entries | Rotated history (pre-2026-09-10 tail, Phase-237 rotation — the only rotation that ever ran) | 0% (history) |
| `STATE.md` | **31,147 B / 100 lines — 97.3% of the 32,000 B hard cap** | "First file of every session" — ~60% of it is a 25-row phase-history ladder (Phases 286→234) + 9 QA history rows | ~40% |
| `AGENTS.md` | 40.7 KB / 284 lines | "LAW file — required reading for every AI agent before any commit" (§8 alone ≈ 25 KB of product-law narratives) | ~50% |
| `DEVELOPER_GUIDE.md` | 48.4 KB | Onboarding + architecture | high |
| `SECURITY.md` | 43.3 KB | Security policy | high |
| `DESIGN.md` | 41.4 KB | Design law — **mirrored 2 more times**: `src/docs/DESIGN_SYSTEM.md` (10.9 KB) + `src/styles/design-tokens.ts` (9.9 KB) | high |
| `README.md` | 17.9 KB | Front door + FEATURE README LAW surface (every feature change must update it, §3.8) | high |
| `docs/` suite | **1.11 MB / 42 files** | Mixed: live references + ~21 closed point-in-time reports still in the live directory (§A2) | ~50% |
| `docs/SEO-GEO-MASTER-PLAN.md` | **341.8 KB / 1,840 lines — ~64% is the §12 execution log** (starts line 662) | Plan + log fused (prior audit F-08, unfixed) | ~36% |
| `archive/` (root) + `docs/archive/` | 1.77 MB / 7 files | Correctly quarantined history (PROGRESS/QA archives + `_AUDIT`/`_NAV_MAP`) | 0% |
| `supabase/migrations/INDEX.md` | 54.7 KB | Binding migration ledger (0001→0095) | high |
| **Total tracked Markdown** | **≈ 3.96 MB** | | |

### A1.2 The mandated session loop (what every agent must read before working)

AGENTS.md §3.6 + STATE.md tail require: read STATE.md → `git fetch` → **last 3 worklog entries** (measured: 5.5 + 7.2 + 5.9 = **18.7 KB** for the current top-3) → last 5 commit subjects → "trust NO number in ANY doc — take it from its single source (the map in STATE.md)". The map then points on demand at ~20 mapped source files (types.ts, memberships.ts, INDEX.md, SEO-GEO §12, image-safety.ts, blog-msa.ts, …). `docs/README.md` lines 9–12 document a reading *budget* (STATE ~30 KB → AGENTS §1–§4+§12 ~39 KB → top-3 worklog), but AGENTS.md's own header declares the whole file "required reading", and §3.1 ("inspect before modifying") + §12.8 (code wins) push agents to open the mapped sources for every claim. In practice a homepage task reads STATE + AGENTS + top-3 worklog + LandingView + site-content + globals.css + the pinned canaries — **the governance read is comparable in size to the code read**.

### A1.3 The write amplification per phase (why small changes touch many files)

The binding minimum per phase (AGENTS.md §3.8 + §12.5 + DoD §4): `worklog.md` entry (≤60 lines, template-enforced) · `STATE.md` refresh (phase row + QA row + compression when near cap) · every file describing the changed behavior — README feature law, DEVELOPER_GUIDE, AGENTS, `build-info` aiTopology label · `docs/README.md` registry rows whose date must never lag git (check M) · `Last updated` headers on the 5 governed docs (check I) · DESIGN.md + DESIGN_SYSTEM.md + design-tokens.ts mirrors for UI changes · same-commit canary updates ("قانون الكاناري بنفس الكوميت"). Verified example — Phase 286 (a copy/visual tweak): 5 source files + **6 governance files** (README, DESIGN, STATE, docs/README, worklog, homepage-adoption.test.ts). Measured repo-wide: **avg 18.8 files/commit** (last 300 commits); **406 of 1,252 commits (32.5%) touch docs-only paths**; `docs:` is the single largest commit prefix (333).

### A1.4 Phase-number inflation under iterative product work

Phases 274–286 (13 phases) all landed 2026-09-24→09-27 — mostly homepage iteration waves (VRD-V6→V8R, HOME-PLATFORM/POLISH/REFINE). At 3–5 phases/day, every governance surface that scales "per phase" (STATE rows, QA rows, worklog entries, registry dates, SHA-registration commits) grows several times per day, which is exactly why STATE hit its cap and the worklog regrew within days of each cleanup.

### A1.5 The commit-level overhead (measured on the last 8 commits)

| Commit | Type |
|---|---|
| `3ea85680` docs: HOME-REFINE-286 — تسجيل SHA بكوميت مستقل [vercel skip] | **SHA-registration overhead** |
| `1327c6f6` feat: HOME-REFINE-286 — actual feature | work |
| `e4954f72` docs: HOME-POLISH-285 — تسجيل SHA [vercel skip] | **SHA-registration overhead** |
| `5d7635b3` fix(docs): bump README last-updated header + registry rows (docs_audit I…) | **date-truth fix-up overhead** |
| `e4719c8d` feat: HOME-POLISH-285 — actual feature | work |
| `2b429591` docs: HOME-PLATFORM-284 — تسجيل SHA [vercel skip] | **SHA-registration overhead** |
| `6b020b83` feat: HOME-PLATFORM-284 — actual feature | work |
| `7d95cfdc` docs: QA-PURGE-283 — تسجيل SHA [vercel skip] | **SHA-registration overhead** |

**5 of 8 commits (62.5%) are governance artifacts**, each triggering 4 workflows + Supabase Preview. The SHA-registration pattern (born Phase 281: the §12.5.1 template requires the code commit's SHA *inside* the worklog entry that is committed *with* the code — impossible without a follow-up commit) is a self-inflicted double-commit loop (§B-RC1).

## A2. What documentation is truly active versus historical

### A2.1 Classification by the repo's own registry (`docs/README.md`, 48 rows + 4 unregistered files)

| Class | Count | Examples |
|---|---:|---|
| **LIVE — core operating sphere (root)** | 10 | STATE, AGENTS, worklog (window), README, DEVELOPER_GUIDE, SECURITY, DESIGN, CONTRIBUTING, CHANGELOG (pointer), `docs/README.md` itself |
| **LIVE — reference/plan suite (docs/)** | ~17 | TECH_REFERENCE, CI_GATES, DESIGN_SYSTEM (src/docs), SEO-GEO-MASTER-PLAN, SEO-EEAT/SCHEMA/CWV, EVO-MASTER-PLAN, 4 recovery runbooks/refs, RECOVERY-SECRETS-SOURCES, RECOVERY-MIRROR-SETUP, VERCEL-IGNORE-STEP-ACTIVATION, INVESTOR-TECHNICAL-MASTER, VISUAL-REDESIGN-AUDIT (kept LIVE as the VRD record) |
| **EXECUTED (closed point-in-time)** | **21** | DEEP-AUDIT-PLAN/REPORT, VERCEL-USAGE-AUDIT, DEEP-UX-AUDIT-REPORT, UI-AUDIT-HOMEPAGE, UI-IMPLEMENTATION-PLAN, DOCS-CONTEXT-AUDIT-REPORT + MIGRATION-PLAN, FOOD-DATA-LANGUAGE-AUDIT, FOOD-ARABIZATION PILOT/PHASE-2/BATCH-3 reports, RECOVERY-DRILL-1/2 reports, UX-TEST-PLAN/REPORT/ROUND2, RECOVERY-LINK-ERROR-FIX, RECOVERY-OTP-MODE, ADMIN-DASH-246, DASH-WAVE-247 |
| **EXECUTING (gated remainder)** | 1 | FOOD-DATA-ARABIZATION-PLAN (further batches await GSC-gated owner orders) |
| **HISTORICAL (quarantined)** | 2 | `docs/archive/_AUDIT.md`, `docs/archive/_NAV_MAP.md` (moved there by Phase 274) |
| **FROZEN / ARCHIVE (root archive/)** | 5 | archive/PROGRESS.md + QA_CHECKLIST.md (J-check frozen), PROGRESS/WORKLOG/QA archives (append-only) |
| **UNREGISTERED — no registry row (registry blind spot)** | **4** | `docs/content-strategy.md` (24.2 KB), `docs/CONTENT-REWRITE-REPORT-2026-09-20.md`, `docs/NOTIF-I18N-250-2026-09-22.md`, `docs/STAFF-BELL-I18N-251-2026-09-22.md` |

### A2.2 The structural finding

- **Truly active** documentation ≈ 27–30 files (root operating sphere + live references) ≈ **600–700 KB**.
- **Historical material inside live directories** ≈ 21 EXECUTED reports (~350 KB) in `docs/` root + the SEO-GEO §12 execution log (~220 KB inside a live plan) + STATE's history ladder (~18 KB) + worklog's below-window mass (~685 KB).
- **Correctly quarantined** ≈ 1.77 MB in `archive/` + `docs/archive/` (never read by policy, only downloaded).
- The archive **mechanism exists and works** (`docs/archive/` relocation precedent, Phase 274; root `archive/` append-only rituals) but is **applied one file at a time by owner order** — 21 closed reports never got moved, and the `M` check only validates registry-row→file direction, so files without rows (the 4 above) are invisible to the gate.
- `AGENTS.md` §12.5 ("Do not create new documentation files") vs reality: 42 files in `docs/`, 40 registered — the registry is the sanctioned exception mechanism, and it works, but each new report (this one included) widens the reading surface unless closed reports move out.

## A3. Which tests / gates / canaries are unnecessarily triggered

### A3.1 The validation inventory

| Layer | What | Scope today |
|---|---|---|
| Local §3.5 battery | `tsc --noEmit` · `eslint .` · `next build` (when rendering touched) · push · sync-check · status | **Every change, regardless of scope** (precedent exists for scoped docs-frames: Phases 223/283 legitimately skipped vitest/build) |
| Vitest suite | **101 files / 1,729 tests** (incl. canaries) | Single suite, no scoping, no path filters |
| Canaries | `homepage-adoption.test.ts` (pins exact UI counts: chev=10, card-lift=11, tile/FAQ structure), `image-safety.test.ts` v3, `blog-msa.test.ts`, `rtl-typography.test.ts`, `ai-jobs-visibility.test.ts`, og-image coverage, slug law | Pinned-behavior tests — by law updated in the SAME commit as the behavior they pin |
| CI quality-gate.yml | tsc + eslint + **full vitest** on Node 22 + frozen bun install | **Every push to main + every PR — no path filters** |
| CI docs-parity-gate.yml | docs_parity.py + docs_audit.py (20 check families) + migration_audit.py --ci | Every push/PR (full-history checkout) |
| CI guard-stale-refs.yml | check-stale-refs.sh (banned-identifier grep) + check-ui-wiring.sh | Every push/PR |
| CI vercel-cleanup.yml | Vercel deployment purge | Every push + hourly |
| Supabase Preview | Migration apply per push | Every push (incl. docs-only) |
| §12.5.2 periodic doc audit | Re-verify EVERY registry row + re-run Appendix-A one-liners of the 09-19 report; appends `DOC-AUDIT-YYYY-MM-DD` worklog entries | Monthly + after any major feature + after any force-push |

### A3.2 What is unnecessarily triggered (verified)

1. **Docs-only pushes run the entire quality battery.** 46 `[vercel skip]` docs commits since 2026-09-21 — each ran tsc + eslint + 1,729 tests in CI + a Supabase Preview pass + 3 other workflows. Zero of them could change a test outcome.
2. **Every push re-runs migration_audit over 108 migration files + INDEX.md** even when `supabase/**` is untouched.
3. **The canary-count pins couple unrelated surfaces:** a homepage copy tweak must edit `homepage-adoption.test.ts` (Phase 286 did — chev counter 14→10), and the STATE QA row must then record the new suite total (101/1,729) — three surfaces for one visual change.
4. **The §12.5.2 periodic audit is now redundant with the per-push `M`/`N` checks** (the gate re-verifies registry paths/dates and workflow coverage on every push) yet still mandates a manual full-table pass + a fresh worklog entry — an audit of the audit, which itself grows the worklog.
5. **The gates validate the documentation ABOUT the system as heavily as the system**: header dates (I), registry dates (M), CI_GATES coverage (N), backticked paths (R), documented commands (T) — 5 of the 20 check families police prose metadata rather than product truth.

## A4. Git branches, tags and references — existence and purpose

| Ref | Last activity | State | Verified purpose/dependency |
|---|---|---|---|
| `main` | 2026-09-27 | default, **protected = false** | The only ref any workflow triggers on (`push/pull_request: branches: [main]`); the only deploy source |
| `docs/audit-reports-delivery` | 2026-09-19 (cc73f83d) | **MERGED into main** (ahead=0, behind=132) | None. All its content is in main; no workflow, gate or doc references it |
| `fix/perf-audit-2026-09-05` | 2026-09-05 (669e1120) | **MERGED into main** (behind=504) | None |
| `perf/vercel-usage-phase3` | 2026-09-21 (f3e421fe) | **MERGED into main** (behind=97) | None |
| Tag `archive/patch-1-uploads-20260819` | 2026-08-19 | historical marker (ef8dc909) | None — no releases reference it; only the (dormant) external-mirror would copy it (`--mirror` push) |
| Tag `backup/clean-2026-08-25` | 2026-08-25 | historical marker (28bf154f) | None — same |

**Conclusion:** the 3 branches and 2 tags have **zero active purpose or dependency**. Their cost is not CI (nothing triggers on them) but noise: every clone/fetch carries them, session-protocol inspections list them, and agents may mistake them for active work. Deletion is safe after owner confirmation (branches are fully merged; tags are recoverable from reflog/SHA and are pure markers — keep or delete is an owner call).

## A5. CI / validation mechanisms — working vs broken vs bypassed

### A5.1 Measured run statistics (GitHub Actions API, 100 most recent runs per workflow)

| Workflow | Total runs | Last | Result mix (last 100) | Verdict |
|---|---:|---|---|---|
| quality-gate (tsc·eslint·vitest) | 417 | 09-27 | 91 ✅ / 1 ❌ / 8 🚫cancelled | **WORKING** (cancelled = superseded rapid pushes) |
| guard-stale-refs | 704 | 09-27 | 98 ✅ / 2 🚫 | **WORKING** |
| docs-parity-gate | 511 | 09-27 | 68 ✅ / **28 ❌** / 4 🚫 | **MECHANICALLY WORKING, CURRENTLY RED + BYPASSED** |
| vercel-cleanup | 232 | 09-27 | 100 ✅ (70 push + 30 schedule) | **WORKING** |
| blog-post-ar / blog-post-en | 73 / 67 | 09-27 | schedules firing; 19/11 failures (content-pipeline failures, documented) | WORKING (schedules healthy) |
| process-ai-jobs (*/10) | 494 | 09-27 | 100 ✅ | WORKING |
| db-backup · storage-backup · storage-inventory | 25/8/11 | 09-27 | all ✅ | WORKING |
| evo-weekly-eval / learning | 6 / 3 | 09-24 / 09-20 | 5✅1❌ / 3✅ | WORKING |
| external-mirror | 2 | 09-27 | **2 ❌** | **FAILING BY DESIGN** (dormant until owner setup; weekly red noise) |
| legacy-ar-cleanup | 17 | 09-11 | 4✅/**13❌** | DORMANT, historically flaky |
| meta-title-remediation · retro-pair · remediate-images · restore-drill | 4/6/9/1 | — | on-demand | WORKING as designed |

### A5.2 The three verified failures of enforcement

1. **RED on main, right now:** the latest docs-parity run (36331114405 on `3ea85680`) failed at step 4 — `docs_audit.py` check **I/last-updated-truth**: «DESIGN.md claims Last updated 2026-09-26 but was modified by a commit dated 2026-09-27». Reproduced locally. The two pushes before it also landed on a red parity gate.
2. **No branch protection:** API confirms `main.protected = false` (and the prior audit's Phase-6 owner action — required status checks — was never completed; the agent's 2026-09-19 attempt got HTTP 403, documented in worklog `DOCS-CONTEXT-MIGRATION-P6-CLOSURE`). Consequence: **every gate in the repo is advisory**; CI_GATES.md §1's claim that "البوابة الواقفة بتمنع الدمج" (a standing gate prevents merging) is **not true today** — it describes intent, not enforcement.
3. **Advisory red normalizes drift:** 28/100 parity failures + pushes landing anyway = the exact F-01 pattern the 09-19 audit documented, recurring.

### A5.3 Local ↔ GitHub CI ↔ Vercel ↔ documented rules — the mismatch map

| Surface | What it actually runs | Mismatch |
|---|---|---|
| Local (§3.5, agent discipline) | tsc + eslint + build(conditional) + full vitest before every push | No scoping for docs-only frames (contradicts its own Phase-223/283 precedent); unenforced — pure discipline |
| GitHub CI | Full battery on EVERY push (no path filters) + static gates | Wasteful for docs-only pushes; **advisory only** (no required checks) |
| Vercel | `next build` + deploy; `ignoreCommand` skips docs-only commits (verified live: docs commits → CANCELED deployments, code commits → READY); `[vercel skip]` convention doubles the mechanism | **Vercel runs NO tsc/vitest** (documented in quality-gate.yml's rationale) — so between an undisciplined push and the advisory gates, nothing enforces quality |
| CI_GATES.md / README narrative | "Gates prevent merging", "docs can't lie" | Aspirational until branch protection exists; the docs narrative itself is a drift vector (check N exists because CI_GATES once drifted) |
| Supabase Preview | Applies migrations on every push | Works; runs even for docs-only pushes (no-op cost) |

## A6. Why the previous documentation cleanup did not prevent the current problem

The 2026-09-19 DOCS-CONTEXT audit (F-01…F-14, RC-1…RC-7) and its executed migration plan (Phases 232–238) fixed **formats and boundaries** — registry, byte cap, entry schema, derived tail invariant, one rotation, README de-numbering. Verified reasons the problem returned within ~1 week:

1. **The per-phase write load was never reduced.** The plan changed HOW entries look, not HOW MANY surfaces every phase must touch. Phase 274 (09-24) then **added 9 more check families** (D2/H4/L/M/N/P/Q/R/T) — each new check is a new way to fail, a new fix-up obligation, and (in the case of M) a new per-change editing duty (registry dates). Gate failure rate is now 28%.
2. **Rotation is one-shot and unenforced.** The Phase-237 rotation moved the pre-2026-09-10 tail once; the policy line still says "rolling date buffer, currently back to 2026-09-10" — the buffer never advanced. No byte cap exists for worklog.md (the 32 KB cap applies to STATE.md only), and the H-check verifies ORDER, not SIZE. Result: 740.7 KB live file, 135 entries below the window, 9 days later.
3. **STATE kept its history ladder.** F-07 ("المرحلة الحالية is a history ladder, not current state") was treated by compression, not by relocation: 25 phase rows + 9 QA rows remain, the 32 KB cap is at 97.3%, and Phase 286 already had to re-compress historical rows to fit — a recurring editing tax on "history" inside the file that's supposed to be a 30-second read.
4. **Enforcement stayed advisory.** F-03 (branch protection) required an owner UI action; it was attempted, hit 403, and remains open. Red gates + unprotected main = the failure mode the whole system was built to prevent.
5. **The registry became a new maintenance surface.** The fix for F-09 (no lifecycle index) created a 48-row table whose date column must be hand-synced with git on every governed-doc change (check M) — the same class of duplicated truth the system was escaping (git already knows every date).

**Root sentence:** every cleanup so far has added *more law* to a system already saturated with law, while the actual drivers — per-phase write amplification, unbounded monologue files, advisory enforcement — were left running.

---

# PART B — ROOT-CAUSE MAP (the recursive / circular mechanisms)

| ID | Mechanism | Chain |
|---|---|---|
| **RC-1** | **The SHA self-reference loop** | §12.5.1 requires the code commit's SHA inside the worklog entry → the entry is committed WITH the code → its own SHA can't be known → follow-up docs commit «تسجيل SHA بكوميت مستقل» (5 since Phase 281) → that commit is a push → 4 workflows + Supabase Preview re-run → its own date can trip check I/M → more fix-ups. **One task = two commits = ~8 gate runs.** |
| **RC-2** | **Date-truth duplication** | git already records every file's last-commit date, but check I (5 headers) + check M (registry rows) re-maintain the same fact in prose → any doc edit demands same-day header + registry bumps (verified fix-up `5d7635b3`) → more commits → more drift surface → more checks. |
| **RC-3** | **STATE as a log** | every phase appends a phase row + QA row → 32 KB cap fills → new phases re-compress OLD rows (editing "history" inside a "status" file) → diff noise + QA-summary churn (suite totals like 101/1729 must be re-recorded per phase). |
| **RC-4** | **Unbounded monologue files** | per-entry budget exists (≤60 lines) but no file-size cap or automatic rotation for worklog.md → 740 KB live; the top-12 "window" policy describes a boundary nothing enforces. |
| **RC-5** | **Audit-of-the-audit recursion** | §12.5.2 mandates periodic re-verification of the registry (already per-push gated) → appends DOC-AUDIT worklog entries → worklog grows → next audit is bigger; every remediation (274) adds checks → more failures → more remediation. Three governance remediations in 12 days, each net-adding law. |
| **RC-6** | **One-size-fits-all validation** | no path filters locally or in CI; canary laws pin exact counts → a copy tweak edits code + canary + STATE QA total + README + DESIGN + registry dates; a docs tweak runs 1,729 tests. |
| **RC-7** | **Advisory enforcement** | red gate + unprotected main → failures are visible but consequence-free → drift accumulates → periodic big cleanups (which add law — RC-5) instead of continuous small enforcement. |

---

# PART C — THE MINIMUM ARCHITECTURE (so a change updates only relevant documentation and runs only relevant validation)

Design principles: **scope-matched documentation · derive-don't-duplicate · enforce at the boundary that actually exists · archive by default.**

1. **STATE.md = state, not history.** Keep only: current phase (1–2 rows max), open items, owner-pending, active prohibitions, source-of-truth map, CURRENT-phase QA summary. Phase history lives in worklog/archive (one line each is already there). Target ≤ 24 KB with real headroom under the existing 32 KB cap. The cap then stops being a compression treadmill.
2. **worklog.md = hard-capped active window.** Add to `docs_audit.py`: live file ≤ **128 KB AND ≤ 12 dated entries**; anything below the window must be in the archive (same-commit rotation via a tiny `scripts/worklog_rotate.py`). Rotation becomes mechanical and size-driven — never calendar-driven, never one-shot.
3. **Kill the SHA-registration commit.** Amend §12.5.1: the Stage Summary records "push status" only; the commit SHA field becomes optional/post-push (git is the ledger — `git log` is authoritative and already ancestor-checked by check B for STATE). One task = one commit.
4. **Registry without hand-maintained dates.** Drop the Last-updated column (the gate already derives true dates from git — surface them in the gate REPORT, not in hand-edited prose). Add the missing direction to check M: **every `docs/*.md` must have a row** (catches the 4 unregistered files). Same logic retires most check-I header bumps (Last-updated headers become optional provenance, not gated truth).
5. **Path-scoped CI.** `quality-gate.yml` gains `paths-ignore: ['**.md', 'docs/**', 'archive/**', '.github/**', 'scripts/**']` — docs-only pushes skip tsc/eslint/vitest (they cannot change outcomes). Keep docs-parity + guard on every push (they are cheap, static, and ARE the docs gates). Codify the existing scoped-verification precedent (Phases 223/283) into §3.5: docs-only frames run docs_parity + docs_audit locally, not the code battery.
6. **docs/ = active reference only; reports are born archived.** Point-in-time audits/plans/reports land directly in `docs/archive/` with a registry row (status EXECUTED + closing phases). Move the ~21 closed reports now. The live `docs/` surface then equals the ~17 live references.
7. **AGENTS.md = binding law only (≤ ~20 KB).** §8 keeps one-to-two-line laws + pointers; the incident narratives move to TECH_REFERENCE/archive (the Phase-113 slimming precedent, applied consistently).
8. **Enforcement made real (owner, 10 minutes):** required status checks on main (quality · parity · guard · Supabase Preview), "Do not allow bypassing" OFF to preserve the owner's fast path. This single action converts the whole gate stack from advisory to enforcing and ends the red-normalization cycle.
9. **Git hygiene:** delete the 3 merged branches (safe, verified merged); tags are zero-cost historical markers — keep or delete by owner preference.
10. **§12.5.2 cadence → exception-driven.** The per-push M/N checks already verify the registry; the manual monthly full pass is retired (or reduced to a quarterly spot-check of check families themselves — see 11).
11. **Check-family budget for the gate itself:** cap `docs_audit.py` at its current 20 families; any new check must retire or merge an existing one. The gate must be governed like any other growing surface (RC-5).

**What this preserves (verified-healthy — do not break):** single-source number law (D/D2), STATE ancestry check (B), archive freeze (J), migration parity + mirror audit, guard-as-code pattern (born from real incidents), provenance/owner-order culture, Vercel ignoreCommand + `[vercel skip]` discipline, frozen-lockfile installs, scheduled-workflow health law with the dispatch-pipelines backstop.

---

# PART D — REMEDIATION PLAN (ordered by priority)

**P0 — unblock truth (first session, ~1 hour total)**

| # | Action | Owner | Effort |
|---|---|---|---|
| P0-1 | Fix the RED gate: bump DESIGN.md «Last updated» header to 2026-09-27 (satisfies check I; one line) | agent | 5 min |
| P0-2 | Enable required status checks on main (Settings ▸ Branches ▸ Add rule `main` ▸ Require status checks: Quality gate · Docs & schema parity gate · Anti-regression guard · Supabase Preview; "Do not allow bypassing" = OFF per owner preference). This closes prior-audit F-03 | **owner** (UI) | 10 min |
| P0-3 | Land THIS document's parity updates: `docs/README.md` registry row + `worklog.md` entry (+ STATE pointer) — deferred here by the audit order's no-modification constraint | agent | 20 min |
| P0-4 | Delete the 3 merged branches (`docs/audit-reports-delivery`, `fix/perf-audit-2026-09-05`, `perf/vercel-usage-phase3`) — verified merged, zero dependents | **owner confirm** → agent | 5 min |

**P1 — stop the context bleed (the core fix, 2–3 phases)**

| # | Action | Effect |
|---|---|---|
| P1-1 | worklog hard cap + automatic rotation: `docs_audit.py` new check (≤128 KB / ≤12 dated entries above the archive) + `scripts/worklog_rotate.py`; rotate the current 135 below-window entries (≈685 KB) to the archive in the same commit | live worklog 740 KB → ≤128 KB, permanently |
| P1-2 | Amend §12.5.1: drop the mandatory Commit-SHA field (post-push optional); declare the «SHA-registration commit» practice retired | 1 task = 1 commit; −4 workflows/task |
| P1-3 | STATE history-ladder relocation: keep ≤2 most-recent phase rows; move the other 23 rows + 8 QA rows verbatim to `archive/` (append-only ritual); STATE lands ≤ ~15 KB | real headroom under the cap; no more history re-compression |
| P1-4 | Registry de-dating: remove the hand-maintained Last-updated column (gate report shows git-derived dates); add the files→rows direction to check M (registers the 4 unregistered docs) | removes the most frequent fix-up class (check M/I date bumps) |

**P2 — scope the validation (1 phase)**

| # | Action | Effect |
|---|---|---|
| P2-1 | `quality-gate.yml` + `docs-parity-gate.yml`: `paths-ignore` for `**.md`/`docs/**`/`archive/**` on the quality battery (parity + migration audit stay on all pushes — they're the docs gates); document in CI_GATES.md (check N) | docs-only pushes stop running 1,729 tests |
| P2-2 | Codify scoped local verification in §3.5 (docs-only frames: docs_parity + docs_audit only — the Phase-223/283 precedent) | small doc fixes stop paying the code-battery tax |
| P2-3 | Canary pinning policy: prefer behavior/structure assertions over exact counts where the count is cosmetic (keep true regression pins like image-safety/MSA/slug laws) | fewer same-commit test edits for cosmetic tweaks |

**P3 — relocate history & slim the law (1–2 phases)**

| # | Action | Effect |
|---|---|---|
| P3-1 | Move the ~21 EXECUTED point-in-time reports from `docs/` to `docs/archive/` (registry rows updated to archive paths, statuses unchanged); declare "reports are born archived" for future audits | live docs/ = active references only (~17 files) |
| P3-2 | AGENTS.md §8 slim-down: one-liner laws + pointers; narratives → TECH_REFERENCE/archive (Phase-113 precedent) | required reading ~41 KB → ≤ ~20 KB |
| P3-3 | SEO-GEO-MASTER-PLAN §12 execution log (≈220 KB) → separate archived log file; plan keeps a status row | plan becomes maintainable |
| P3-4 | DESIGN mirror unification decision: DESIGN.md = law; DESIGN_SYSTEM.md/design-tokens.ts = generated or pointer-only (single source) | UI changes touch one doc, not three |

**P4 — guardrails on the governance system itself (ongoing)**

| # | Action | Effect |
|---|---|---|
| P4-1 | external-mirror.yml: complete the owner setup (RECOVERY-MIRROR-SETUP) OR disable the weekly schedule until setup — end the by-design weekly red | Actions tab reflects real health |
| P4-2 | Check-family budget for docs_audit.py (cap 20; new check must retire one) + quarterly review of failure rates per check | the gate stops growing unboundedly (RC-5) |
| P4-3 | Retire the manual §12.5.2 monthly full pass (superseded by per-push M/N) — keep a quarterly spot-check of the check families | removes the audit-of-the-audit recursion |
| P4-4 | Re-measure after 2 weeks: live worklog KB, STATE KB, docs-only commits running the quality battery, parity-gate failure rate — target: 0 avoidable failures, docs-only pushes = 0 vitest runs | verification of the fix itself |

**Explicitly NOT in scope (per the audit order and verified-healthy list):** application code, UI, business logic, APIs, database schema, SEO configuration, deployment configuration, the frozen archives' content, the provenance culture, and the guard-as-code pattern.

---

## Appendix A — verification commands (reproducible, read-only)

```bash
git clone https://github.com/muscleshubfit-cpu/alkemos && cd alkemos && git rev-parse HEAD   # 3ea85680…
wc -c STATE.md AGENTS.md worklog.md README.md DESIGN.md DEVELOPER_GUIDE.md SECURITY.md     # 31,147 · 41.6K · 740.7K · …
python3 scripts/docs_audit.py            # → 1 violation: I/last-updated-truth (DESIGN.md) — the RED gate (A5.2)
python3 scripts/docs_parity.py           # → PASS
grep -c "^Task ID:" worklog.md archive/WORKLOG_ARCHIVE.md  # 157 live · 277 archived
python3 - <<'PY'                          # top-3 entry + top-12 window sizes (A1.2)
c=open('worklog.md').read(); p=c.split('---\nTask ID:')
print(sum(len(x) for x in p[1:4]), sum(len(x) for x in p[1:13]), len(p)-13)
PY
git log --format="%ad" --date=short | sort | uniq -c        # 20–39 commits/day (A1.4)
git log --oneline --grep="vercel skip" | wc -l              # 46 since 2026-09-21 (A3.2)
git log --oneline --grep="تسجيل SHA" | wc -l                # 5 SHA-registration commits (A1.5)
git branch -r --merged origin/main                          # the 3 stale branches (A4)
git tag -l                                                  # 2 historical tags (A4)
# GitHub API (owner PAT, read): /actions/workflows → 18 active; /actions/runs?per_page=100 per workflow (A5.1)
#   → docs-parity-gate: 68✅/28❌/4🚫 · quality-gate: 91✅/1❌/8🚫 · guard: 98✅ · external-mirror: 2❌ (by design)
# /branches → main protected=false · /branches/main/protection → 403 · /vulnerability-alerts → 204 (Dependabot ON)
# Vercel API: /v6/deployments?app=alkemos → docs-only commits CANCELED, code commits READY (A5.3)
```

## Appendix B — files and surfaces examined (evidence index)

`AGENTS.md` (all 284 lines) · `STATE.md` (all 100 lines) · `docs/README.md` registry (48 rows) · `docs/CI_GATES.md` · `CONTRIBUTING.md` · `docs/DOCS-CONTEXT-AUDIT-REPORT-2026-09-19.md` + `DOCS-CONTEXT-MIGRATION-PLAN-2026-09-19.md` (the prior cleanup, §A6) · `docs/archive/_AUDIT.md` header · all 18 `.github/workflows/*.yml` trigger blocks · `scripts/docs_audit.py` (725 lines, all 20 check families) · `docs_parity.py` · `check-stale-refs.sh` · `check-ui-wiring.sh` (sizes/roles) · `package.json` · `vitest.config.ts` · `vercel.json` (ignoreCommand) · 101 test files (inventory + doc-coupled canaries: homepage-adoption, rtl-typography, low-fixes-p2-14, foods-ar-purity) · `worklog.md` top entries + rotation policy + archive boundary · `supabase/migrations/INDEX.md` · full git ref/branch/tag inventory · live GitHub Actions statistics (100 runs × 18 workflows) · live Vercel deployment timeline.
