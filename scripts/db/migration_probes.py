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
]
# fmt: on

# --- named transforms for rest_rows probes ----------------------------------


def duplicate_draft_groups(rows: list[dict]) -> int:
    """Count (client_id, type) groups holding MORE THAN one qualifying AI
    draft — 0101's invariant is exactly zero such groups."""
    seen: dict[tuple, int] = {}
    for r in rows:
        key = (r.get("client_id"), r.get("type"))
        seen[key] = seen.get(key, 0) + 1
    return sum(1 for c in seen.values() if c > 1)


TRANSFORMS = {
    "duplicate_draft_groups": duplicate_draft_groups,
}
