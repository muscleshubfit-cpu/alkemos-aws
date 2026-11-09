#!/usr/bin/env bash
# File (or dedupe) the migration-drift issue — the FULL lifecycle owner.
#
# Two modes, one law: "This issue stays open until the state gate is green."
#   (default)          RED run  — file a new drift issue or comment fresh
#                      evidence on the open one (the visibility law).
#   --close-on-green   GREEN run — close every OPEN migration-drift issue
#                      with the green evidence attached.
#
# WHY THE CLOSE MODE EXISTS (2026-11-10 — MIGRATION-GATE-ISSUE3):
#   issue #3 stayed OPEN for 5 consecutive GREEN days after the
#   0105/0106/0107 chain was reconciled (green since 2026-11-05T14:23Z,
#   40+ consecutive green runs) — because the repo owned only the OPEN
#   half of the lifecycle. A stale open drift issue is its own honesty
#   problem: the label keeps screaming "drift!" while production is
#   verified green, training everyone to ignore it.
#
# Env: GH_TOKEN (issues:write) · STATE_JSON (optional state.json) · REPO
set -euo pipefail

LABEL="migration-drift"
TITLE="MIGRATION DRIFT: latest migration not applied on production"

verdict_block() {
  python3 - <<'PY'
import json, os
try:
    d = json.load(open(os.environ.get("STATE_JSON", "/nonexistent")))
    print(f"{d.get('verdict','?')} — {d.get('reason','')[:400]}")
    print()
    print("| migration | verdict | evidence |")
    print("|---|---|---|")
    for p in d.get("probes", []):
        ev = "<br>".join(c["detail"] for c in p["checks"])
        print(f"| {p['label']} | {'PASS' if p['passed'] else 'FAIL'} | {ev} |")
except Exception:
    print("(state.json unavailable — see the workflow log table)")
PY
}

ensure_label() {
  gh label create "$LABEL" --color D93F0B \
    --description "Latest repo migration is not proven applied on production" \
    --repo "$REPO" 2>/dev/null || true
}

open_issue_numbers() {
  gh issue list --repo "$REPO" --label "$LABEL" --state open \
    --json number --jq '.[].number' 2>/dev/null || true
}

close_on_green() {
  local closed=0
  for NUM in $(open_issue_numbers); do
    VERDICT="$(verdict_block)"
    BODY="$(cat <<EOF
State gate GREEN — closing per this issue's own law ("this issue stays open until the state gate is green"):

\`\`\`
${VERDICT}
\`\`\`

The gate now proves the latest repo migration APPLIED on production — every registered probe green, evidence above. If drift ever returns, the daily/push gate files a fresh deduplicated migration-drift issue with the new evidence automatically.
EOF
)"
    echo "green run: closing drift issue #$NUM with the green evidence"
    gh issue comment "$NUM" --repo "$REPO" --body "$BODY"
    gh issue close "$NUM" --repo "$REPO"
    closed=$((closed + 1))
  done
  if [ "$closed" -eq 0 ]; then
    echo "green run: no open migration-drift issue — nothing to close (clean)"
  fi
}

# ---- mode dispatch ----------------------------------------------------------
if [ "${1:-}" = "--close-on-green" ]; then
  close_on_green
  exit 0
fi

# ---- RED path (file / dedupe — unchanged behavior) --------------------------
VERDICT="$(verdict_block)"

BODY="$(cat <<EOF
## Migration state gate: RED

\`\`\`
${VERDICT}
\`\`\`

**The law (AGENTS.md §6, 2026-10-27):** a code deploy is NOT proof of DB
migration application. This issue stays open until the state gate is green.

### Fix path A — provision the pipeline secret (repo self-sufficient forever)
1. Supabase dashboard → your project → **Settings → Database → Connection
   string → URI** (session pooler URI is fine) and copy it.
2. GitHub repo → **Settings → Secrets and variables → Actions → New
   repository secret** → name \`SUPABASE_DB_URL\`, paste the URI.
3. Re-run this workflow (or push anything): \`db-migrate\` then applies the
   pending migrations IN ORDER through the ledger-driven applier
   (\`scripts/db/apply_migrations.py\`) and this gate verifies them.

### Fix path B — revive the Supabase–GitHub integration
Supabase dashboard → **Integrations → GitHub** → reconnect the repository
(the integration stopped picking migrations up after 0100 — applied
2026-10-02 on the PRE-cutover repository (commit 5d3b3b2a); the alkemos-aws
repo was created 2026-10-09 (AWS cutover) and the integration was never
re-linked — 0101 (the first migration on the new repo) was missed with zero
GitHub-side failure signals; the 2026-10-25 session's "integration alive"
proof was the existence of an 0100-era RPC, which only proves the past).
After reconnecting, the next push applies the backlog — and THIS gate keeps
watching it forever either way.

### Manual path (last resort, owner-run)
\`supabase/migrations/RUN_ON_SUPABASE_0102_sub_pick_active_first.sql\`
already exists (verified byte-identical to the timestamped file) — raw
link + \`NOTIFY pgrst, 'reload schema';\` per AGENTS.md §6.

Full incident analysis + design: docs/DB-MIGRATION-PIPELINE-2026-10-27.md
EOF
)"

NUM="$(gh issue list --repo "$REPO" --label "$LABEL" --state open \
  --json number --jq '.[0].number' 2>/dev/null || echo "")"
if [ -n "${NUM:-}" ]; then
  echo "open drift issue #$NUM exists — commenting fresh evidence"
  gh issue comment "$NUM" --repo "$REPO" --body "State gate still RED:

\`\`\`
${VERDICT}
\`\`\`
"
else
  ensure_label
  gh issue create --repo "$REPO" --title "$TITLE" --label "$LABEL" \
    --body "$BODY"
fi
