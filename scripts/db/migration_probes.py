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
                       body itself.

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
    # 0102 — SUB-PICK-ACTIVE-FIRST (THE reported defect, measured through the
    # app's own admin list code path: the renewed-ACTIVE coaching of client
    # 87cd7ba6 (samarsamy0992@gmail.com) must be the picked primary — the
    # expired premium row may never mask it again)
    {
        "file": "20261026120000_0102_sub_pick_active_first.sql",
        "label": "0102 SUB-PICK-ACTIVE-FIRST",
        "strength": "strong",
        "checks": [
            {"type": "rpc_behavior",
             "rpc": "get_coach_client_list_paged",
             "body": {"p_limit": 5, "p_search": "samar"},
             "find_client": "87cd7ba6-9e25-4fec-a7b6-b75ed1e2e09b",
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


TRANSFORMS = {
    "duplicate_draft_groups": duplicate_draft_groups,
    "at_least_one_admin": at_least_one_admin,
}
