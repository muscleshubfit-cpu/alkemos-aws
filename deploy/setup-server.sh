#!/usr/bin/env bash
# =====================================================================
# deploy/setup-server.sh — one-time Alkemos origin provisioning
# (Ubuntu 24.04 on Lightsail — plan §9 Phase 1, region eu-north-1).
# Created on branch test/aws-lightsail-migration (owner order 2026-10-09).
#
# Run ON THE SERVER, once, as root:
#   sudo bash deploy/setup-server.sh          # production Caddy (Let's Encrypt)
#   sudo bash deploy/setup-server.sh --test   # TEST Caddy (tls internal — no DNS)
#
# Installs : Node 22 (NodeSource) · Caddy (apt) · bun (deploy user) · PM2
#            + pm2-logrotate · systemd autostart for PM2
# Creates  : /srv/alkemos/{releases,shared} · /var/log/alkemos · user `deploy`
#            · EMPTY /srv/alkemos/shared/.env (owner fills it — see below)
# Does NOT : copy any secret (owner copies the env vars by hand — plan §8
#            item 6) · open the firewall (Lightsail console: 22 owner-IP
#            only · 80 · 443) · install the crontab (Phase 2 —
#            deploy/crontab-alkemos) · create AWS resources · touch DNS.
# =====================================================================
set -euo pipefail

MODE="prod"
[ "${1:-}" = "--test" ] && MODE="test"
HERE="$(cd "$(dirname "$0")" && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "run with sudo (root required)" >&2; exit 1; }

echo "[setup] 1/6 packages: Node 22 + Caddy"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs caddy
npm install -g pm2

echo "[setup] 2/6 deploy user + directories"
useradd -m -s /bin/bash deploy 2>/dev/null || echo "  user deploy already exists — ok"
mkdir -p /srv/alkemos/releases /srv/alkemos/shared /var/log/alkemos
chown -R deploy:deploy /srv/alkemos /var/log/alkemos

echo "[setup] 3/6 bun (as deploy)"
sudo -u deploy bash -c 'curl -fsSL https://bun.sh/install | bash' || \
  { echo "  bun install script failed — is the network reachable?" >&2; exit 1; }
grep -q '.bun/bin' /home/deploy/.profile 2>/dev/null || \
  echo 'export PATH="$HOME/.bun/bin:$PATH"' >> /home/deploy/.profile

echo "[setup] 4/6 PM2 autostart at boot + log rotation"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u deploy --hp /home/deploy
sudo -u deploy env PATH="$PATH:/usr/bin" pm2 install pm2-logrotate

echo "[setup] 5/6 Caddyfile ($MODE mode)"
SRC="$HERE/Caddyfile"
[ "$MODE" = "test" ] && SRC="$HERE/Caddyfile.test"
[ -f "$SRC" ] || { echo "missing $SRC — run from the repo checkout" >&2; exit 1; }
caddy validate --config "$SRC" --adapter caddyfile
install -m 0644 "$SRC" /etc/caddy/Caddyfile
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

echo "[setup] 6/6 shared .env placeholder"
if [ ! -f /srv/alkemos/shared/.env ]; then
  touch /srv/alkemos/shared/.env
fi
chown deploy:deploy /srv/alkemos/shared/.env
chmod 600 /srv/alkemos/shared/.env

cat <<'EOF'

[setup] DONE. Remaining OWNER steps (in order — plan §9 Phase 2 + repo doc):
  1. Copy the production env vars into /srv/alkemos/shared/.env
     (editor: sudo -u deploy nano /srv/alkemos/shared/.env — the var
     list lives in .env.example at the repo root; keep mode 600).
  2. Lightsail console ▸ Networking ▸ IPv4 Firewall: allow 22 (YOUR IP
     only) · 80 · 443.
  3. (cutover only) skip in test mode — crontab + DNS are Phase 2/5.
  4. Deploy: GitHub ▸ Actions ▸ "Deploy to AWS origin (alkemos)" ▸ Run
     workflow (needs AWS_DEPLOY_HOST / AWS_DEPLOY_USER /
     AWS_DEPLOY_SSH_KEY secrets — see the migration plan doc §appendix).

EOF
echo "[setup] mode=$MODE — Caddy serving with the $MODE config"
