#!/usr/bin/env bash
# =====================================================================
# deploy/deploy.sh — SAFE activation of one release on the Alkemos AWS
# origin (Lightsail). Called by .github/workflows/deploy-aws.yml after
# the release tarball is uploaded + extracted; can also be run by hand
# on the server for a manual release flip.
#
# Usage (as the deploy user):
#   bash deploy/deploy.sh <release_dir> [app_root]
#     release_dir : /srv/alkemos/releases/<commit-sha>  (basename MUST
#                   be the commit SHA — it becomes the /api/build-info
#                   beacon and the rollback verification key)
#     app_root    : default /srv/alkemos
#
# What "safe" means here (owner order 2026-10-09 — «النشر الآمن
# والتراجع عند الفشل»):
#   1. installs production deps INSIDE the new release (bun frozen)
#   2. builds the release .env = /srv/alkemos/shared/.env + this
#      release's identity (GITHUB_SHA/GITHUB_REF_NAME) → the
#      /api/build-info beacon reports the truth after every flip
#   3. switches the `current` symlink ATOMICALLY (ln + mv -T — never a
#      window where current is missing or half-written)
#   4. reloads PM2 (startOrReload — also starts on first deploy)
#   5. HEALTH CHECK: /api/build-info must serve THIS release's SHA
#   6. on failure → AUTOMATIC ROLLBACK to the previous release +
#      re-verification (the deploy still exits 1 — failure stays loud)
#   7. on success → prunes old releases (keeps the newest
#      KEEP_RELEASES, never touching current or previous)
#
# Env overrides (used by the local simulation harness):
#   PORT / HEALTH_TIMEOUT (seconds, default 60) / KEEP_RELEASES (def 5)
#   DEPLOY_REF (branch name for the beacon — default: release basename)
#
# Secrets policy: nothing secret is ever printed. The shared env file
# is only ever `cat`ed into the release .env (chmod 600).
# =====================================================================
set -euo pipefail

# FIX 2026-10-09 (2f): bun (deploy user) lives in ~/.bun/bin — non-
# interactive SSH sessions (GitHub Actions / drone-ssh) don't source
# ~/.profile, so bun was invisible and the preflight died. Put it on PATH
# explicitly (harmless when already there).
export PATH="$HOME/.bun/bin:$PATH"

RELEASE="${1:?usage: deploy.sh <release_dir> [app_root]}"
APP_ROOT="${2:-${APP_ROOT:-/srv/alkemos}}"
CURRENT="$APP_ROOT/current"
SHARED_ENV="$APP_ROOT/shared/.env"
PORT="${PORT:-3000}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

log()  { printf '[deploy] %s\n' "$*" >&2; }
die()  { printf '[deploy] FATAL: %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------- checks
[ -d "$RELEASE" ]            || die "release dir not found: $RELEASE"
RELEASE="$(cd "$RELEASE" && pwd)"
SHA="$(basename "$RELEASE")"
[ -n "$SHA" ]                || die "cannot derive SHA from release dir"
[ -f "$RELEASE/package.json" ]     || die "no package.json in release (bad extract?)"
[ -f "$RELEASE/ecosystem.config.js" ] || die "no ecosystem.config.js in release"
[ -d "$RELEASE/.next" ]      || die "no .next in release — build artifact missing"
[ -f "$SHARED_ENV" ]         || die "shared env missing: $SHARED_ENV (owner copies the Vercel vars once — plan §8 item 6)"
command -v bun >/dev/null    || die "bun not found on server (run deploy/setup-server.sh)"
command -v pm2 >/dev/null    || die "pm2 not found on server (run deploy/setup-server.sh)"

# ------------------------------------------------------- previous target
PREV=""
if [ -L "$CURRENT" ]; then
  PREV="$(readlink "$CURRENT")"
  [ -d "$PREV" ] || PREV=""
fi

# ---------------------------------------------------------------- helpers
switch_to() { # atomic symlink flip: tmp symlink + rename(2)
  local target="$1"
  ln -sfn "$target" "$CURRENT.tmp"
  mv -T "$CURRENT.tmp" "$CURRENT"
}

reload_pm2() { # (re)start the app from whatever `current` points to now
  local rel="$1"
  pm2 startOrReload "$rel/ecosystem.config.js" --update-env
}

verify() { # poll /api/build-info until it serves the wanted SHA
  local want="$1" waited=0 out=""
  while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
    if out="$(curl -fsS -m 5 "http://127.0.0.1:${PORT}/api/build-info" 2>/dev/null)"; then
      if printf '%s' "$out" | grep -q "$want"; then return 0; fi
    fi
    sleep 2; waited=$((waited + 2))
  done
  return 1
}

rollback() { # back to PREV + re-verify; ALWAYS exits nonzero (deploy failed)
  if [ -z "$PREV" ]; then
    log "NO previous release to roll back to — current stays on the FAILED release;"
    log "fix manually: pm2 logs alkemos · /var/log/alkemos/error.log"
    exit 1
  fi
  log "HEALTH CHECK FAILED — rolling back to $PREV"
  switch_to "$PREV"
  if ! reload_pm2 "$PREV"; then
    log "ROLLBACK reload failed — start the previous release manually:"
    log "  pm2 start $PREV/ecosystem.config.js"
    exit 1
  fi
  if verify "$(basename "$PREV")"; then
    log "ROLLBACK OK — serving $(basename "$PREV") (the NEW release $SHA stays on disk for inspection)"
    exit 1
  fi
  log "ROLLBACK VERIFICATION ALSO FAILED — manual intervention required (pm2 logs alkemos)"
  exit 1
}

# ----------------------------------------------------- 1) production deps
log "installing production deps in $RELEASE (bun frozen)"
(cd "$RELEASE" && bun install --frozen-lockfile --production) \
  || die "bun install failed — release not activated, nothing to roll back"

# ----------------------------------------------------- 2) release env
ENV_FILE="$RELEASE/.env"
cat "$SHARED_ENV" > "$ENV_FILE"
printf '\n# injected by deploy.sh — deploy beacon (kept truthful across rollbacks)\nGITHUB_SHA=%s\nGITHUB_REF_NAME=%s\n' \
  "$SHA" "${DEPLOY_REF:-$SHA}" >> "$ENV_FILE"
chmod 600 "$ENV_FILE"
log "release env assembled ($SHARED_ENV + beacon $SHA)"

# ----------------------------------------------------- 3) atomic switch
log "switching current -> $RELEASE (atomic)"
switch_to "$RELEASE"

# ----------------------------------------------------- 4) reload
log "reloading PM2 (startOrReload)"
reload_pm2 "$RELEASE" || rollback

# ----------------------------------------------------- 5) health check
log "health check: /api/build-info must serve $SHA (timeout ${HEALTH_TIMEOUT}s)"
if verify "$SHA"; then
  log "DEPLOY VERIFIED — serving $SHA"
else
  rollback
fi

# ----------------------------------------------------- 6) prune old releases
log "pruning old releases (keep newest $KEEP_RELEASES, never current/previous)"
CUR_NOW="$(readlink "$CURRENT" || true)"
ls -1dt "$APP_ROOT"/releases/*/ 2>/dev/null | tail -n +"$((KEEP_RELEASES + 1))" | while read -r r; do
  r="${r%/}"
  [ "$r" = "$CUR_NOW" ] && continue
  [ -n "$PREV" ] && [ "$r" = "$PREV" ] && continue
  log "pruning $r"
  rm -rf "$r"
done

log "DONE — release $SHA is live"
