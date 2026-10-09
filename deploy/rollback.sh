#!/usr/bin/env bash
# =====================================================================
# deploy/rollback.sh — MANUAL rollback of the Alkemos AWS origin to the
# previous (or a named) release. Companion of deploy/deploy.sh.
#
# Usage (as the deploy user, on the server):
#   bash deploy/rollback.sh                # roll back to the newest
#                                          # release that is NOT current
#   bash deploy/rollback.sh /srv/alkemos/releases/<sha>   # named target
#
# Behavior: atomic symlink switch → PM2 reload → /api/build-info must
# serve the target's SHA. Exits 0 only on a VERIFIED rollback.
# The failed/current release is left on disk for inspection (deploy.sh
# prunes it later per KEEP_RELEASES).
# =====================================================================
set -euo pipefail

APP_ROOT="${APP_ROOT:-/srv/alkemos}"
CURRENT="$APP_ROOT/current"
PORT="${PORT:-3000}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"

log() { printf '[rollback] %s\n' "$*" >&2; }
die() { printf '[rollback] FATAL: %s\n' "$*" >&2; exit 1; }

command -v pm2 >/dev/null || die "pm2 not found"
[ -L "$CURRENT" ] || die "no current symlink yet — nothing to roll back from"
CUR="$(readlink "$CURRENT")"

# ------------------------------------------------------------- target
TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  TARGET="$(ls -1dt "$APP_ROOT"/releases/*/ 2>/dev/null | grep -vF "$CUR" | head -n1)"
  TARGET="${TARGET%/}"
fi
[ -n "$TARGET" ] && [ -d "$TARGET" ] || die "rollback target not found (pass a release dir)"
SHA="$(basename "$TARGET")"

log "current = $CUR"
log "target  = $TARGET (sha $SHA)"

# ------------------------------------------ atomic switch + reload + verify
ln -sfn "$TARGET" "$CURRENT.tmp"
mv -T "$CURRENT.tmp" "$CURRENT"
pm2 startOrReload "$TARGET/ecosystem.config.js" --update-env

log "health check: /api/build-info must serve $SHA"
waited=0 out=""
while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
  if out="$(curl -fsS -m 5 "http://127.0.0.1:${PORT}/api/build-info" 2>/dev/null)"; then
    if printf '%s' "$out" | grep -q "$SHA"; then
      log "ROLLBACK VERIFIED — serving $SHA"
      exit 0
    fi
  fi
  sleep 2; waited=$((waited + 2))
done
die "rollback did NOT verify (build-info lacks $SHA) — check: pm2 logs alkemos"
