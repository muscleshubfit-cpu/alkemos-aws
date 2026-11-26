#!/usr/bin/env python3
"""Migration application probes — the declarative registry (DB-MIGRATION-PIPELINE-2026-10-27).

WHY THIS EXISTS (the 2026-10-27 incident):
  The Supabase-GitHub integration applied migrations SILENTLY — zero GitHub-side
  check runs, statuses or deployments — so when it stopped picking migrations up
  after 0100 (last applied 2026-10-02 via commit 5d3b3b2a on the PRE-cutover repo; the alkemos-aws repo was created 2026-10-09 with the integration never re-linked — 0101, the first migration on the new repo, 2026-10-25)
  and 0102 (2026-10-26) piled up unapplied while code kept deploying on top of
  them. Nothing in the repo could SEE the drift. `scripts/db/migration_state.py`
  turns "is the latest migration applied on production?" into a measurable
  question — and THIS file declares, per migration, how to measure it.

THE LAW (AGENTS.md §6 — 2026-10-27 update):
  Every NEW migration ships a probe row HERE in the same commit (alongside its
  INDEX.md row + types.ts). The state gate (`migration-state-audit.yml`) turns
  RED until the latest migration's probes PASS on production — silent drift is
  structurally impossible again. Remove a registry row only when a NEWER
  migration legitimately retires its observable (the 0083-rollback pattern) —
  the row's `retired_by` field documents it.

PROBE STRENGTH:
  "strong"  — proves the migration's body is live (an object it created /
              a behavior only its code produces).
  "weak"    — asserts the intended end-state, but the state could also be
              reached by another path (e.g. app code) — better than nothing.

CHECK TYPES:
  swagger_rpc        — RPC name present in the PostgREST OpenAPI spec.
  swagger_table      — table present in the spec.
  swagger_column     — column present on a table in the spec.
  rest_rows          — GET a PostgREST path, apply a named transform, compare.
  rpc_behavior       — call an RPC as an EPHEMERAL QA admin (auto-provisioned
                       and hard-deleted within the run by
                       scripts/db/probe_session.py — QA-TEST-ACCOUNTS-CLOSE
                       2026-10-29; the legacy QA_PROBE_* repo secrets are
                       retired) and assert fields on one returned row. THE
                       strongest: it exercises auth + RLS + the function
                       body itself. With "use_fixture": true the matched row
                       is the EPHEMERAL ISOLATED test client provisioned by
                       scripts/db/probe_fixture.py (MIGRATION-PROBE-0102-
                       ISOLATION 2026-11-24, the issue-#8 lesson) — the check
                       runs on self-owned deterministic test data and the
                       registry row carries NO client identifiers at all:
                       probes must never depend on (or name) real customers.

PRIVACY: probes must never print client PII. rpc_behavior rows are matched by
  client UUID and only the asserted fields are reported (repo is public).
"""

from __future__ import annotations

# --- registry (ordered by migration version) -------------------------------
# fmt: off
PROBES: list[dict] = [
    # 0094 — site content editor (anchor: table exists)
    {
        "file": "20260929120000_0094_site_content_editor.sql",
        "label": "0094 SITE-CONTENT-EDITOR",
        "strength": "strong",
        "checks": [
            {"type": "swagger_table", "table": "site_content"},
        ],
    },
    # 0098 — PayPal capture idempotency (anchor: column on
    # subscription_requests — NOT subscriptions — plus its RPC)
    {
        "file": "20261002120000_0098_paypal_capture_idempotency.sql",
        "label": "0098 PAYPAL-CAPTURE-IDEMPOTENCY",
        "strength": "strong",
        "checks": [
            {"type": "swagger_column", "table": "subscription_requests",
             "column": "paypal_order_id"},
        ],
    },
    # 0099 — invite adoption atomic claim (anchor: column on profiles)
    {
        "file": "20261002130000_0099_invite_adoption_atomic_claim.sql",
        "label": "0099 INVITE-ADOPTION-ATOMIC-CLAIM",
        "strength": "strong",
        "checks": [
            {"type": "swagger_column", "table": "profiles",
             "column": "invite_adopted_at"},
        ],
    },
    # 0100 — notifications index + retention (anchor: the RPC it created —
    # ALSO the historical proof the integration was alive through 2026-10-02)
    {
        "file": "20261003060000_0100_notifications_index_and_retention.sql",
        "label": "0100 NOTIFICATIONS-INDEX-RETENTION",
        "strength": "strong",
        "checks": [
            {"type": "swagger_rpc", "rpc": "prune_notifications"},
        ],
    },
    # 0101 — duplicate AI-draft hygiene (data-only: weak end-state assert —
    # the newest-draft-per-group survival is also produced by the app's
    # replacePlanId path, so a pass here does NOT prove the migration ran)
    {
        "file": "20261025120000_0101_prune_duplicate_ai_plan_drafts.sql",
        "label": "0101 DRAFT-HYGIENE",
        "strength": "weak",
        "checks": [
            {"type": "rest_rows",
             "path": ("/rest/v1/plans?select=id,client_id,type"
                      "&status=eq.draft&is_current=eq.false"
                      "&notes=eq.Generated%20by%20AI&limit=1000"),
             "transform": "duplicate_draft_groups",
             "expect": 0},
        ],
    },
    # 0102 — SUB-PICK-ACTIVE-FIRST (THE reported defect, measured on an
    # ISOLATED ephemeral fixture — MIGRATION-PROBE-0102-ISOLATION 2026-11-24,
    # the issue-#8 lesson: the original probe asserted a REAL production
    # client's mutable subscription state and false-RED'd from 2026-11-23 the
    # moment that client's coaching lapsed, while the migration's law was
    # live. The fixture (scripts/db/probe_fixture.py) reproduces the EXACT
    # defect shape on self-owned test data — an EXPIRED higher-tier premium
    # row that must never mask a renewed ACTIVE lower-tier coaching row —
    # so the probe keeps its full behavioral strength (auth + RLS + the
    # function body through the real admin code path) with zero dependence
    # on real customers and zero time-rot (the coaching row's end_date is
    # 10 years out). A drift back to the pre-0102 tier-priority pick turns
    # this RED the same day.)
    {
        "file": "20261026120000_0102_sub_pick_active_first.sql",
        "label": "0102 SUB-PICK-ACTIVE-FIRST",
        "strength": "strong",
        "checks": [
            {"type": "rpc_behavior",
             "rpc": "get_coach_client_list_paged",
             "use_fixture": True,
             "expect": {"sub_tier": "coaching", "sub_status": "active"},
             "field_rules": [{"field": "sub_end_date", "op": "gt_now"}]},
        ],
    },
    # 0103 — PLAN-SWAPS live-schema reconciliation (created by the parallel
    # QA-LIVE-ROUND 2026-10-27 frame: production carried a NOT NULL plan_type
    # column the repo never had — the ledger inserts died silently on it;
    # 0103 reconciles additively = guaranteed no-op on production). Probe:
    # the live column the round measured directly (strong).
    {
        "file": "20261027120000_0103_plan_swaps_live_schema_reconciliation.sql",
        "label": "0103 PLAN-SWAPS-SCHEMA-RECONCILIATION",
        "strength": "strong",
        "checks": [
            {"type": "swagger_column", "table": "plan_swaps",
             "column": "plan_type"},
        ],
    },
    # 0104 — LOCAL-PAYMENT-EGP (owner order 2026-11-05): the three new
    # tables + the subscription_requests.amount-lock column. The tables
    # are created only by this migration (nothing else could produce
    # them) → strong probes on all three; price_egp column is the
    # amount-lock observable.
    {
        "file": "20261105064700_0104_local_payment_egp_prices.sql",
        "label": "0104 LOCAL-PAYMENT-EGP-PRICES",
        "strength": "strong",
        "checks": [
            {"type": "swagger_table", "table": "local_prices"},
            {"type": "swagger_table", "table": "exchange_rate_updates"},
            {"type": "swagger_table", "table": "local_price_settings"},
            {"type": "swagger_column", "table": "subscription_requests",
             "column": "price_egp"},
        ],
    },
    # 0105 — ADMIN-ROLE-INTEGRITY (owner order 2026-11-05 «تحقيق أمني عاجل
    # وإصلاح فقدان صلاحية Admin»): four probes —
    #   1. role_audit_log table (every role change is now attributed)
    #   2. admin_set_user_role RPC (the sanctioned channel)
    #   3. at_least_one_admin (the restore + the last-admin invariant:
    #      production must NEVER carry zero admins again — the exact state
    #      this incident measured)
    #   4. self_role_patch_rejected — THE DRIFT GUARD: the ephemeral QA
    #      admin session must NOT be able to change its own role through
    #      PostgREST (profiles_update_self WITH CHECK + profiles_role_guard
    #      trigger). This is the exact hole that let the owner's role be
    #      rewritten (live-proven HTTP 204 pre-fix). If this probe ever
    #      goes red, the Phase-61 drift class returned — loudly, same day.
    {
        "file": "20261105140000_0105_admin_role_integrity.sql",
        "label": "0105 ADMIN-ROLE-INTEGRITY",
        "strength": "strong",
        "checks": [
            {"type": "swagger_table", "table": "role_audit_log"},
            {"type": "swagger_rpc", "rpc": "admin_set_user_role"},
            {"type": "rest_rows",
             "path": "/rest/v1/profiles?select=role&role=eq.admin&limit=1000",
             "transform": "at_least_one_admin",
             "expect": 1},
            {"type": "self_role_patch_rejected"},
        ],
    },
    # 0107 — ROLE-AUDIT-LOG TEXT COLUMNS (urgent fix, same owner order):
    # production had applied the FIRST 0105 (enum columns) and then 0106
    # (the ::text-cast trigger from the portable 0105 file) — every role
    # write failed 42804. The gate caught it within minutes (probe-session
    # create performs a live audited role write — its failure turned the
    # state gate red and blocked the deploy: the canary worked). 0107
    # converts the columns to text = the portable definition. The
    # BEHAVIORAL proof of this migration is the revival of every
    # rpc_behavior probe + the probe session itself (each performs a live
    # role write through the trigger); these registry rows assert the
    # columns remain live — honestly weak on type, strong in effect.
    {
        "file": "20261105150000_0107_role_audit_log_text_columns.sql",
        "label": "0107 ROLE-AUDIT-TEXT-COLUMNS",
        "strength": "weak",
        "checks": [
            {"type": "swagger_column", "table": "role_audit_log",
             "column": "old_role"},
            {"type": "swagger_column", "table": "role_audit_log",
             "column": "new_role"},
        ],
    },
    # 0106 — ROLE-GUARD WHITELIST (same owner order, the audit log
    # surfaced the theoretical empty-string reset bypass on pooled
    # connections): the user-context rejection is now a WHITELIST (only
    # 'auto-promote'/'admin-rpc' pass) — any reset value ('' NULL 'off'
    # future contamination) is refused. Behavioral coverage stays the
    # daily self_role_patch_rejected probe (0105's row); this row asserts
    # the objects 0106 redefines remain live — honestly weak: the
    # whitelist vs blacklist distinction is not HTTP-observable
    # deterministically (needs both steps on one pooled connection).
    {
        "file": "20261105145000_0106_role_guard_whitelist.sql",
        "label": "0106 ROLE-GUARD-WHITELIST",
        "strength": "weak",
        "checks": [
            {"type": "swagger_rpc", "rpc": "admin_set_user_role"},
            {"type": "swagger_table", "table": "role_audit_log"},
        ],
    },
    # 0108 — HEALTHY-RECIPES-FOUNDATION (owner order 2026-11-10): the six
    # recipe-pair tables + the two atomic publish RPCs. Strong probes: the
    # tables/RPCs this migration creates exist in the PostgREST spec.
    {
        "file": "20261110100000_0108_healthy_recipes_foundation.sql",
        "label": "0108 HEALTHY-RECIPES-FOUNDATION",
        "strength": "strong",
        "checks": [
            {"type": "swagger_table", "table": "nutrient_reference"},
            {"type": "swagger_table", "table": "recipes"},
            {"type": "swagger_table", "table": "recipe_versions"},
            {"type": "swagger_table", "table": "recipe_ingredients"},
            {"type": "swagger_table", "table": "recipe_generation_queue"},
            {"type": "swagger_table", "table": "recipe_favorites"},
            {"type": "swagger_rpc", "rpc": "publish_recipe_pair"},
            {"type": "swagger_rpc", "rpc": "unpublish_recipe_pair"},
        ],
    },
    # 0109 — RECIPES-FOUNDATION CLEAN-STACK GUARD (owner order 2026-11-10
    # «استكمال مشروع Healthy Recipes»): re-asserts 0108's foundation
    # idempotently with the 0105 pg_proc guard on the 11 admin-write
    # policies (the clean-stack is_admin() failure fix). Honest weak
    # strength: on production it is a verified NO-OP over 0108 (same
    # tables/RPCs — 0108's strong probe already covers them); its OWN
    # observable effect through PostgREST is simply that the same six
    # tables remain present after it, which is exactly what these
    # checks pin.
    {
        "file": "20261110140000_0109_recipes_foundation_clean_stack_guard.sql",
        "label": "0109 RECIPES-CLEAN-STACK-GUARD",
        "strength": "weak",
        "checks": [
            {"type": "swagger_table", "table": "nutrient_reference"},
            {"type": "swagger_table", "table": "recipes"},
            {"type": "swagger_table", "table": "recipe_versions"},
            {"type": "swagger_table", "table": "recipe_ingredients"},
            {"type": "swagger_table", "table": "recipe_generation_queue"},
            {"type": "swagger_table", "table": "recipe_favorites"},
        ],
    },
    # 0110 — AI-QUOTA SUCCESS IDEMPOTENCY (owner order 2026-11-14 «إعادة
    # هيكلة سياسة الذكاء الاصطناعي والاشتراكات والأرصدة» + the corrective
    # clarification: the system STAYS monthly quotas, developed — no
    # credits/wallets. Governing doc docs/AI-QUOTAS-POLICY-2026-11-14.md):
    # job_ref uuid columns (unique partial index) on ai_plan_usage and
    # plan_swaps — one success row per queued job, structurally no double
    # deduction. Strong probes: both columns present in the PostgREST spec.
    {
        "file": "20261114150000_0110_ai_quota_success_idempotency.sql",
        "label": "0110 AI-QUOTA-SUCCESS-IDEMPOTENCY",
        "strength": "strong",
        "checks": [
            {"type": "swagger_column", "table": "ai_plan_usage",
             "column": "job_ref"},
            {"type": "swagger_column", "table": "plan_swaps",
             "column": "job_ref"},
        ],
    },
    # 0111 — AI-QUOTA CLEAN-STACK GUARD (the 0108/0109 precedent class,
    # dd46903f CI evidence): on production a verified NO-OP (0110 already
    # applied — its strong probe row covers the two columns); on a clean
    # test stack it recreates plan_swaps + lands 0110's columns + restores
    # 0065's RLS posture so the chain is self-sufficient. Honest weak
    # strength: the same two columns remain present after it, which is
    # exactly what these checks pin.
    {
        "file": "20261114200000_0111_ai_quota_clean_stack_guard.sql",
        "label": "0111 AI-QUOTA-CLEAN-STACK-GUARD",
        "strength": "weak",
        "checks": [
            {"type": "swagger_column", "table": "ai_plan_usage",
             "column": "job_ref"},
            {"type": "swagger_column", "table": "plan_swaps",
             "column": "job_ref"},
        ],
    },
    # 0112 — GENERATION-PIPELINES P1 IDEMPOTENCY (audit 2026-11-15):
    # plans.job_id (INF-13) + blog_generation_queue.resume_count (ART-2).
    # Honest weak strength: additive columns only — presence is the law.
    {
        "file": "20261115120000_0112_generation_pipelines_p1_idempotency.sql",
        "label": "0112 GENERATION-PIPELINES-P1-IDEMPOTENCY",
        "strength": "weak",
        "checks": [
            {"type": "swagger_column", "table": "plans",
             "column": "job_id"},
            {"type": "swagger_column", "table": "blog_generation_queue",
             "column": "resume_count"},
        ],
    },
    # 0113 — GENERATION-PIPELINES P1 CLEAN-STACK GUARD (the 0109/0111
    # precedent class, 2c8b1f48 CI evidence): on production a verified
    # NO-OP (0112 already applied — its probe row covers the two columns);
    # on a clean test stack it recreates plans + lands 0112's three
    # columns + re-asserts plans' RLS posture so the chain is
    # self-sufficient. Honest weak strength: the same columns remain
    # present after it, which is exactly what these checks pin. Carries
    # recipes.sat_fat_coverage (REC-8) — closing the gap 0112's own row
    # left (it pinned only two of the three columns it created).
    {
        "file": "20261116090000_0113_generation_pipelines_p1_clean_stack_guard.sql",
        "label": "0113 GENERATION-PIPELINES-P1-CLEAN-STACK-GUARD",
        "strength": "weak",
        "checks": [
            {"type": "swagger_column", "table": "plans",
             "column": "job_id"},
            {"type": "swagger_column", "table": "blog_generation_queue",
             "column": "resume_count"},
            {"type": "swagger_column", "table": "recipes",
             "column": "sat_fat_coverage"},
        ],
    },
    # 0114 — AI-JOBS RETRY BACKOFF (audit AI-GENERATION-PIPELINES 2026-11-15,
    # P2-5 / INF-14): ai_jobs.next_attempt_at — the scheduled retry gate.
    # failJob stamps it on requeue (short window for transient failures,
    # the 30-minute provider-cooldown window for quota-class terminal
    # errors) and claimQueuedJobs only claims rows whose value is NULL or
    # past. Honest weak strength: additive column only — presence is the
    # law. INF-15's status-CAS writers (finishJob/failJob) are pure code,
    # pinned by the ai-jobs-p2-5-retry-backoff canaries instead.
    {
        "file": "20261116140000_0114_ai_jobs_retry_backoff.sql",
        "label": "0114 AI-JOBS-RETRY-BACKOFF",
        "strength": "weak",
        "checks": [
            {"type": "swagger_column", "table": "ai_jobs",
             "column": "next_attempt_at"},
        ],
    },
    # 0115 — STORE-FOUNDATION (owner order 2026-11-26 «تنفيذ المرحلة الأولى»
    # per docs/store/PHASE-1-SCOPE.md): the Alkemos Product Store family
    # (System 2, EN-only). Strong probe — new tables with their spec
    # columns, incl. the ratified amendment (a) parent_id tree column.
    # The category seed (wave 1 active / waves 2-3 inactive) is data, not
    # schema; the product batch ships separately as 0116.
    # 0118 RENAME (owner order 2026-11-26 «توحيد الاسم البرمجي إلى
    # affiliate_store»): the family's tables now live under their
    # affiliate_store_* names — the probes verify the migration's EFFECT
    # (the spec columns exist on the renamed family), the same law the
    # 0083-rollback pattern set: the newest migration owns the
    # observable's final name.
    {
        "file": "20261126120000_0115_store_foundation.sql",
        "label": "0115 STORE-FOUNDATION",
        "strength": "strong",
        "checks": [
            {"type": "swagger_table", "table": "affiliate_store_categories"},
            {"type": "swagger_table", "table": "affiliate_store_products"},
            {"type": "swagger_table", "table": "affiliate_store_product_links"},
            {"type": "swagger_table", "table": "affiliate_store_click_events"},
            {"type": "swagger_column", "table": "affiliate_store_categories",
             "column": "parent_id"},
            {"type": "swagger_column", "table": "affiliate_store_categories",
             "column": "is_active"},
            {"type": "swagger_column", "table": "affiliate_store_categories",
             "column": "icon_key"},
            {"type": "swagger_column", "table": "affiliate_store_products",
             "column": "asin"},
            {"type": "swagger_column", "table": "affiliate_store_products",
             "column": "slug"},
            {"type": "swagger_column", "table": "affiliate_store_products",
             "column": "review_status"},
            {"type": "swagger_column", "table": "affiliate_store_products",
             "column": "is_published"},
            {"type": "swagger_column", "table": "affiliate_store_products",
             "column": "editorial_rating"},
            {"type": "swagger_column", "table": "affiliate_store_products",
             "column": "price_usd"},
            {"type": "swagger_column", "table": "affiliate_store_products",
             "column": "payload"},
            {"type": "swagger_column", "table": "affiliate_store_product_links",
             "column": "surface_type"},
            {"type": "swagger_column", "table": "affiliate_store_click_events",
             "column": "surface_key"},
            {"type": "swagger_column", "table": "affiliate_store_click_events",
             "column": "day"},
        ],
    },
    # 0116 — STORE-SEED-BATCH-1 (owner order 2026-11-26 «إطلاق 24–32
    # منتجًا»): the founding batch — 27 products across the eight wave-1
    # mains, ALL born review_status='pending' + is_published=false (the
    # 0097 review inbox). Strong probe: the count of the SEEDED SLUG SET
    # (filtered by slug — immutable by the slug law, so the probe stays
    # true as the owner reviews/publishes/adds more) must equal 27.
    # Run with the SERVICE key (RLS hides unpublished rows from anon —
    # by design). 0118 RENAME (owner order 2026-11-26 «توحيد الاسم
    # البرمجي إلى affiliate_store»): the row set is queried through the
    # affiliate_store_products name the family carries since 0118.
    {
        "file": "20261126140000_0116_store_seed_batch_1.sql",
        "label": "0116 STORE-SEED-BATCH-1",
        "strength": "strong",
        "checks": [
            {"type": "rest_rows",
             "path": ("/rest/v1/affiliate_store_products?select=slug&slug=in."
                      "(cap-barbell-300lb-olympic-weight-set,"
                      "bowflex-selecttech-552-adjustable-dumbbells,"
                      "yes4all-solid-cast-iron-kettlebell,"
                      "fit-simplify-resistance-loop-bands-set,"
                      "yosuda-indoor-cycling-bike,"
                      "sunny-health-sf-rw5515-rowing-machine,"
                      "flybird-adjustable-weight-bench,"
                      "walkingpad-a1-pro-foldable-treadmill,"
                      "triggerpoint-grid-foam-roller-13,"
                      "gaiam-premium-yoga-mat-6mm,renpho-massage-gun,"
                      "escali-primo-digital-food-scale,"
                      "prepnaturals-glass-meal-prep-containers,"
                      "nutribullet-pro-900-blender,"
                      "cosori-air-fryer-pro-gen-2-5-8qt,"
                      "renpho-smart-body-fat-scale,"
                      "accu-measure-body-fat-caliper,myotape-body-tape-measure,"
                      "fitbit-charge-6,polar-h10-heart-rate-monitor,"
                      "soundcore-sport-x10-earbuds,"
                      "nike-metcon-9-training-shoes,"
                      "brooks-ghost-16-running-shoes,"
                      "harbinger-padded-leather-lifting-belt,"
                      "hydro-flask-wide-mouth-32oz,"
                      "blenderbottle-classic-v2-shaker,"
                      "flipbelt-zipper-running-belt)&limit=100"),
             "transform": "count_rows",
             "expect": 27},
        ],
    },
    # 0117 — STORE-CLEAN-STACK-GUARD + SEED-FIX (completes the a1279af1
    # Phase-1 push): 0116's CAP Barbell row matched
    # 'barbell-plates-collars' (singular) against 0115's seeded
    # 'barbells-plates-collars' (plural) — a select-based INSERT with
    # ON CONFLICT (slug) DO NOTHING inserts ZERO rows silently, so the
    # founding batch measured 26/27. 0117 re-asserts the store family +
    # batch with the corrected reference. Strong probe: the missing
    # product must now exist. Run with the SERVICE key (RLS hides
    # unpublished rows from anon — by design). 0118 RENAME: the row is
    # queried through the affiliate_store_products name.
    {
        "file": "20261126150000_0117_store_clean_stack_guard_seed_fix.sql",
        "label": "0117 STORE-CLEAN-STACK-GUARD-SEED-FIX",
        "strength": "strong",
        "checks": [
            {"type": "rest_rows",
             "path": ("/rest/v1/affiliate_store_products?select=slug,review_status"
                      "&slug=eq.cap-barbell-300lb-olympic-weight-set"),
             "transform": "count_rows",
             "expect": 1},
        ],
    },
    # 0118 — AFFILIATE-STORE-RENAME (owner order 2026-11-26 «اعتمد
    # affiliate_store الاسم البرمجي الرسمي والموحد لمتجر منتجات
    # الأفلييت»): the transitional rename of the store_* family to
    # affiliate_store_* — tables, indexes, policies, constraints and
    # the identity sequence, with ZERO data change (0115/0116/0117 are
    # applied history: never edited, never re-run — this file is the
    # sanctioned correction channel, the 0107/0117 pattern). Strong
    # probes: (1) the renamed tables serve through the PostgREST
    # surface under their NEW names; (2) the founding 27-slug batch
    # STILL counts 27 THROUGH the new table name — the rename preserved
    # every row (the same immutable slug-set law as 0116). Service key:
    # RLS hides unpublished rows from anon by design.
    {
        "file": "20261126180000_0118_affiliate_store_rename.sql",
        "label": "0118 AFFILIATE-STORE-RENAME",
        "strength": "strong",
        "checks": [
            {"type": "swagger_table", "table": "affiliate_store_categories"},
            {"type": "swagger_table", "table": "affiliate_store_products"},
            {"type": "swagger_table", "table": "affiliate_store_product_links"},
            {"type": "swagger_table", "table": "affiliate_store_click_events"},
            {"type": "rest_rows",
             "path": ("/rest/v1/affiliate_store_products?select=slug&slug=in."
                      "(cap-barbell-300lb-olympic-weight-set,"
                      "bowflex-selecttech-552-adjustable-dumbbells,"
                      "yes4all-solid-cast-iron-kettlebell,"
                      "fit-simplify-resistance-loop-bands-set,"
                      "yosuda-indoor-cycling-bike,"
                      "sunny-health-sf-rw5515-rowing-machine,"
                      "flybird-adjustable-weight-bench,"
                      "walkingpad-a1-pro-foldable-treadmill,"
                      "triggerpoint-grid-foam-roller-13,"
                      "gaiam-premium-yoga-mat-6mm,renpho-massage-gun,"
                      "escali-primo-digital-food-scale,"
                      "prepnaturals-glass-meal-prep-containers,"
                      "nutribullet-pro-900-blender,"
                      "cosori-air-fryer-pro-gen-2-5-8qt,"
                      "renpho-smart-body-fat-scale,"
                      "accu-measure-body-fat-caliper,myotape-body-tape-measure,"
                      "fitbit-charge-6,polar-h10-heart-rate-monitor,"
                      "soundcore-sport-x10-earbuds,"
                      "nike-metcon-9-training-shoes,"
                      "brooks-ghost-16-running-shoes,"
                      "harbinger-padded-leather-lifting-belt,"
                      "hydro-flask-wide-mouth-32oz,"
                      "blenderbottle-classic-v2-shaker,"
                      "flipbelt-zipper-running-belt)&limit=100"),
             "transform": "count_rows",
             "expect": 27},
        ],
    },
    # 0119 — AFFILIATE-STORE-EXPANSION (owner order 2026-11-27 «تحويل
    # المتجر لمتجر لياقة وتغذية متكامل»): the category-tile image column,
    # the two new commercial mains, and the 48-product verified batch.
    {
        "file": "20261127120000_0119_affiliate_store_expansion.sql",
        "label": "0119 AFFILIATE-STORE-EXPANSION",
        "strength": "strong",
        "checks": [
            {"type": "swagger_column", "table": "affiliate_store_categories", "column": "image_url"},
            # the two NEW commercial mains exist and are active
            {"type": "rest_rows",
             "path": ("/rest/v1/affiliate_store_categories"
                      "?select=slug,is_active&slug=in.(sports-nutrition,workout-accessories)&limit=10"),
             "transform": "count_rows",
             "expect": 2},
            # every main carries its tile image (0119's own observable)
            {"type": "rest_rows",
             "path": ("/rest/v1/affiliate_store_categories"
                      "?select=slug&is_active=is.true&parent_id=is.null&image_url=not.is.null&limit=50"),
             "transform": "count_rows",
             "expect": 12},
            # the 48-product verified batch (fixed slug set — the count is eternal)
            {"type": "rest_rows",
             "path": ("/rest/v1/affiliate_store_products?select=slug&slug=in."
                      "(optimum-nutrition-gold-standard-whey,"
                      "vega-premium-plant-protein,"
                      "optimum-nutrition-gold-standard-casein,"
                      "optimum-nutrition-micronized-creatine,"
                      "optimum-nutrition-amino-energy,"
                      "animal-pak-multivitamin,"
                      "naturewise-vitamin-d3-5000,"
                      "sports-research-omega-3-fish-oil,"
                      "doctors-best-magnesium-glycinate,"
                      "vital-proteins-collagen-peptides,"
                      "nutririse-organic-ashwagandha,"
                      "quest-chocolate-chip-cookie-dough-bars,"
                      "rxbar-chocolate-sea-salt,"
                      "one-reeses-peanut-butter-lovers-bars,"
                      "justins-classic-peanut-butter,"
                      "pbfit-organic-peanut-butter-powder,"
                      "wonderful-pistachios-no-shells,"
                      "terrasoul-organic-chia-seeds,"
                      "epic-beef-sea-salt-pepper-bites,"
                      "anthonys-blanched-almond-flour,"
                      "bigelow-classic-green-tea,"
                      "c4-sport-pre-workout,"
                      "optimum-gold-standard-pre-workout,"
                      "liquid-iv-hydration-multiplier,"
                      "nuun-sport-electrolyte-tablets,"
                      "clif-bloks-energy-chews,"
                      "gu-energy-original-gel,"
                      "lock-jaw-oly-barbell-collars,"
                      "jfit-slam-ball,"
                      "iron-gym-doorway-pull-up-bar,"
                      "incstores-foam-flooring-tiles,"
                      "gymreapers-lifting-straps,"
                      "cramer-gym-chalk-block,"
                      "wod-nation-speed-jump-rope,"
                      "under-armour-undeniable-duffle,"
                      "gaiam-premium-yoga-strap,"
                      "manta-original-sleep-mask,"
                      "prosourcefit-acupressure-mat-set,"
                      "fitbit-inspire-3,"
                      "garmin-forerunner-165,"
                      "pyrex-2-cup-measuring-cup,"
                      "hanes-cool-dri-performance-t-shirt,"
                      "nike-everyday-cushioned-crew-socks,"
                      "simple-modern-40oz-tumbler,"
                      "periodization-theory-and-methodology,"
                      "531-forever-book,"
                      "beyond-531-kindle,"
                      "hardcover-fitness-journal)&limit=100"),
             "transform": "count_rows",
             "expect": 48},
        ],
    },
]# fmt on


# --- named transforms for rest_rows probes ----------------------------------


def duplicate_draft_groups(rows: list[dict]) -> int:
    """Count (client_id, type) groups holding MORE THAN one qualifying AI
    draft — 0101's invariant is exactly zero such groups."""
    seen: dict[tuple, int] = {}
    for r in rows:
        key = (r.get("client_id"), r.get("type"))
        seen[key] = seen.get(key, 0) + 1
    return sum(1 for c in seen.values() if c > 1)


def at_least_one_admin(rows: list[dict]) -> int:
    """0105's invariant: production carries at least one admin profile.
    Returns 1 when the fetched admin-role rows contain any row, else 0.
    (The exact incident state this migration fixed was ZERO admins.)"""
    return 1 if any(r.get("role") == "admin" for r in rows) else 0


def count_rows(rows: list[dict]) -> int:
    """0116's invariant: the number of rows a query returns (used with a
    slug-set filter so the count is immutable — slugs are never deleted)."""
    return len(rows)


TRANSFORMS = {
    "duplicate_draft_groups": duplicate_draft_groups,
    "at_least_one_admin": at_least_one_admin,
    "count_rows": count_rows,
}
