#!/usr/bin/env bash
# =====================================================================
# deploy/cutover.sh — one-time DNS-cutover TLS activation for the
# Alkemos AWS origin (Lightsail) — owner order 2026-10-10 «نفّذ نقل
# الإنتاج». Run ON THE SERVER as root (Lightsail browser console:
# ubuntu user + sudo), AFTER the Cloudflare DNS switch:
#
#   sudo bash /srv/alkemos/current/deploy/cutover.sh activate
#
# What "activate" does (idempotent — safe to re-run any number of
# times; it never touches app code, releases, PM2, crontab, or DNS):
#   1. validates deploy/Caddyfile (production shape — the ONLY
#      difference vs the installed test file is tls internal →
#      automatic Let's Encrypt; rules are byte-identical otherwise)
#   2. backs up /etc/caddy/Caddyfile → /etc/caddy/Caddyfile.backup-<ts>
#      (rollback point — the newest backup is what `restore` reinstalls)
#   3. installs it as /etc/caddy/Caddyfile
#   4. systemctl reload caddy (graceful; restart as fallback)
#   5. waits up to 240s for the Let's Encrypt certificate. HTTP-01
#      passes through the Cloudflare proxy on port 80 (measured
#      2026-10-09: /.well-known/acme-challenge/* reaches the origin as
#      plain HTTP — no forced redirect), so issuance works even with
#      SSL mode left at Full-strict the whole time.
#   6. verifies local HTTPS against the SYSTEM trust store (no -k) and
#      prints the cert issuer / subject / expiry for the record.
#
# Other modes:
#   sudo bash deploy/cutover.sh status    — current mode + cert issuer (read-only)
#   sudo bash deploy/cutover.sh restore   — reinstall the newest backup
#
# ROLLBACK TO VERCEL (plan §12) at any time = revert the Cloudflare DNS
# records to the saved Vercel values (≈1 minute, no server action
# needed). `restore` only puts the internal-cert test Caddyfile back —
# useful if you abort the cutover while DNS still points at AWS.
# =====================================================================
set -euo pipefail

MODE="${1:-status}"
ETC_CADDY="/etc/caddy/Caddyfile"
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
PROD_CADDYFILE="$DEPLOY_DIR/Caddyfile"

log()  { printf '[cutover] %s\n' "$*" >&2; }
die()  { printf '[cutover] FATAL: %s\n' "$*" >&2; exit 1; }

issuer_info() { # prints issuer/subject/enddate of the cert Caddy serves now
  echo | openssl s_client -connect 127.0.0.1:443 -servername alkemos.com 2>/dev/null \
    | openssl x509 -noout -issuer -subject -enddate 2>/dev/null || true
}

wait_for_le() { # succeeds when 443 locally serves a SYSTEM-TRUSTED cert
  local i
  for i in $(seq 1 48); do
    if curl -fsS --resolve alkemos.com:443:127.0.0.1 -m 8 \
         https://alkemos.com/api/build-info >/dev/null 2>&1; then
      return 0
    fi
    sleep 5
  done
  return 1
}

case "$MODE" in
  status)
    echo "== caddy service: $(systemctl is-active caddy) =="
    if grep -q 'tls internal' "$ETC_CADDY" 2>/dev/null; then
      echo "== /etc/caddy/Caddyfile: TEST mode (tls internal) =="
    else
      echo "== /etc/caddy/Caddyfile: PRODUCTION mode (Let's Encrypt) =="
    fi
    echo "== cert Caddy is serving now =="
    issuer_info
    echo "== backups present =="
    ls -1t /etc/caddy/Caddyfile.backup-* 2>/dev/null | head -5 || echo "  (none)"
    ;;

  activate)
    [ "$(id -u)" -eq 0 ] || die "run as root (sudo bash $0 activate)"
    [ -f "$PROD_CADDYFILE" ] || die "production Caddyfile not found: $PROD_CADDYFILE"
    command -v caddy >/dev/null || die "caddy binary not found"

    log "1/6 validating production Caddyfile"
    caddy validate --config "$PROD_CADDYFILE" --adapter caddyfile \
      || die "caddy validate FAILED — nothing was changed"

    if ! grep -q 'tls internal' "$ETC_CADDY" 2>/dev/null; then
      log "note: /etc/caddy/Caddyfile is already production-shaped (re-run)"
    fi

    log "2/6 backing up current Caddyfile"
    BACKUP="/etc/caddy/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)"
    cp -a "$ETC_CADDY" "$BACKUP"
    log "backup: $BACKUP"

    log "3/6 installing production Caddyfile"
    install -m 0644 "$PROD_CADDYFILE" "$ETC_CADDY"

    log "4/6 reloading caddy"
    systemctl reload caddy || { log "reload failed — trying restart"; systemctl restart caddy; }
    sleep 2
    [ "$(systemctl is-active caddy)" = "active" ] || die "caddy is NOT active after reload"

    log "5/6 waiting for the Let's Encrypt certificate (up to 240s)"
    if wait_for_le; then
      log "6/6 VERIFIED — 443 locally serves a publicly-trusted certificate:"
      issuer_info
      echo ""
      log "CUTOVER TLS ACTIVATION: SUCCESS"
      log "next: run the post-cutover verify battery (GitHub Actions / agent),"
      log "then (only if you flipped it) return Cloudflare SSL to Full-strict."
    else
      echo ""
      log "LE certificate NOT obtained within 240s — honest failure report:"
      echo "== caddy: $(systemctl is-active caddy) =="
      issuer_info
      echo "== last caddy log lines (acme/tls) =="
      journalctl -u caddy --since '-10 min' --no-pager 2>/dev/null \
        | grep -iE 'acme|challenge|certificate|error|tls' | tail -25 || true
      echo ""
      log "likely causes, in order of probability:"
      log "  1. DNS not switched yet (alkemos.com must resolve, via Cloudflare,"
      log "     to THIS server before the ACME challenge can reach it)"
      log "  2. Cloudflare SSL mode set to 'Full (strict)' AND 'Always Use"
      log "     HTTPS' enabled (redirects the port-80 challenge) — temporarily"
      log "     set SSL mode to 'Full' (non-strict), re-run, then restore"
      log "  3. port 80 not reachable through Cloudflare to this origin"
      log ""
      log "The production Caddyfile is KEPT installed — caddy retries ACME"
      log "automatically in the background. Fix the cause and re-run:"
      log "  sudo bash $0 activate"
      log "Or abort and put the test file back:"
      log "  sudo bash $0 restore"
      exit 1
    fi
    ;;

  restore)
    [ "$(id -u)" -eq 0 ] || die "run as root (sudo bash $0 restore)"
    BACKUP="$(ls -1t /etc/caddy/Caddyfile.backup-* 2>/dev/null | head -1 || true)"
    [ -n "$BACKUP" ] || die "no backup found to restore"
    log "restoring $BACKUP"
    install -m 0644 "$BACKUP" "$ETC_CADDY"
    systemctl reload caddy || systemctl restart caddy
    sleep 2
    [ "$(systemctl is-active caddy)" = "active" ] || die "caddy is NOT active after restore"
    if curl -fsSk --resolve alkemos.com:443:127.0.0.1 -m 8 \
         https://alkemos.com/api/build-info >/dev/null 2>&1; then
      log "RESTORED — serving again on the internal test certificate"
    else
      log "restored the Caddyfile but the local HTTPS probe failed — check: journalctl -u caddy -n 30"
      exit 1
    fi
    log "reminder: full Vercel rollback = revert the Cloudflare DNS records (plan §12)"
    ;;

  *)
    die "usage: sudo bash $0 {activate|status|restore}"
    ;;
esac
