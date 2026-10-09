#!/usr/bin/env bash
# =====================================================================
# deploy/setup-server.sh — one-time Alkemos origin provisioning
# (Ubuntu 24.04 on Lightsail — plan §9 Phase 1, region eu-north-1).
# Created on branch test/aws-lightsail-migration (owner order 2026-10-09).
#
# Run ON THE SERVER, once, as root:
#   sudo bash deploy/setup-server.sh --test \
#        --deploy-key "ssh-ed25519 AAAA… alkemos-deploy"  # TEST Caddy (tls internal)
#   sudo bash deploy/setup-server.sh --deploy-key "…"     # production Caddy (LE)
#
# Installs : Node 22 (NodeSource) · Caddy (official binary + systemd unit
#            — cloudsmith apt quota-402'd, see FIX 2c below) · bun (deploy
#            user) · PM2 + pm2-logrotate · systemd autostart for PM2
#            + SWAP 2GB + vm.swappiness=10 (2026-10-09 (2): the $7 test
#              bundle has 1GB RAM — safety net for OG/Satori spikes and
#              apt/dpkg runs; measured app peak 356MB, see the plan's
#              second amendment block)
# Creates  : /srv/alkemos/{releases,shared} · /var/log/alkemos · user
#            `deploy` (+ its authorized_keys when --deploy-key is given)
#            · EMPTY /srv/alkemos/shared/.env (owner fills it — see below)
# Does NOT : copy any secret (owner copies the env vars by hand — plan §8
#            item 6) · open the firewall (Lightsail: 22 · 80 · 443 — 22
#            must stay reachable by GitHub Actions runners, key-only) ·
#            install the crontab (Phase 2 — deploy/crontab-alkemos) ·
#            create AWS resources · touch DNS.
#
# --deploy-key takes the PUBLIC half of the GitHub Secret
# AWS_DEPLOY_SSH_KEY (public keys are not secrets — safe on a command
# line; the private half never touches this repo or the server disk
# beyond the agent/GitHub secret store). It closes the Phase-1 gap:
# setup created the deploy user but never authorized a key for it, so
# deploy-aws.yml could not SSH in.
#
# Local-simulation env overrides (same pattern as deploy.sh — used by the
# Phase-2 harness to exercise the marked blocks below without root):
#   SWAP_SIZE (def 2G) · SWAP_FILE (def /swapfile) · FSTAB_PATH (def
#   /etc/fstab) · SYSCTL_CONF (def /etc/sysctl.d/99-alkemos-swap.conf) ·
#   DEPLOY_HOME (def /home/deploy)
# =====================================================================
set -euo pipefail

MODE="prod"
DEPLOY_KEY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --test) MODE="test" ;;
    --deploy-key) DEPLOY_KEY="${2:?--deploy-key needs a value}"; shift ;;
    --deploy-key=*) DEPLOY_KEY="${1#*=}" ;;
    *) echo "unknown argument: $1 (expected --test / --deploy-key)" >&2; exit 1 ;;
  esac
  shift
done
HERE="$(cd "$(dirname "$0")" && pwd)"

[ "$(id -u)" -eq 0 ] || { echo "run with sudo (root required)" >&2; exit 1; }

echo "[setup] 1/7 packages: Node 22 + Caddy"
# FIX 2026-10-09 (2b/2c): Caddy is NOT in Ubuntu 24.04's archive (empty
# apt-cache policy, measured) AND the official cloudsmith apt repo was
# bandwidth-quota exhausted repo-side (HTTP 402 from two vantage points,
# measured 2026-10-09) — so: official binary from caddyserver.com +
# a distro-equivalent systemd unit. Layout mirrors the deb package:
# /usr/bin/caddy · /etc/caddy · /var/lib/caddy · system user caddy.
apt-get update -qq
apt-get install -y ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2
curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" \
  -o /usr/bin/caddy.new \
  && chmod +x /usr/bin/caddy.new \
  && /usr/bin/caddy.new version \
  && mv /usr/bin/caddy.new /usr/bin/caddy
getent group caddy >/dev/null || groupadd --system caddy
getent passwd caddy >/dev/null || useradd --system --gid caddy \
  --create-home --home-dir /var/lib/caddy --shell /usr/sbin/nologin caddy
mkdir -p /etc/caddy /var/lib/caddy
chown -R caddy:caddy /var/lib/caddy
cat > /etc/systemd/system/caddy.service <<'UNIT'
[Unit]
Description=Caddy
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=512
PrivateDevices=true
ProtectHome=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload

# ---- [swap-block] BEGIN — $7/1GB-RAM safety net (owner order 2026-10-09) ----
SWAP_SIZE="${SWAP_SIZE:-2G}"
SWAP_FILE="${SWAP_FILE:-/swapfile}"
FSTAB_PATH="${FSTAB_PATH:-/etc/fstab}"
SYSCTL_CONF="${SYSCTL_CONF:-/etc/sysctl.d/99-alkemos-swap.conf}"
echo "[setup] 2/7 swap ($SWAP_SIZE) — 1GB-RAM bundle safety net"
swap_mb() { case "$1" in *G) echo $(( ${1%G} * 1024 ));; *M) echo ${1%M};; *) echo 2048;; esac; }
if swapon --show=NAME --noheadings 2>/dev/null | grep -q .; then
  echo "  swap already active — keeping it as-is"
else
  if [ ! -f "$SWAP_FILE" ]; then
    fallocate -l "$SWAP_SIZE" "$SWAP_FILE" 2>/dev/null \
      || dd if=/dev/zero of="$SWAP_FILE" bs=1M count="$(swap_mb "$SWAP_SIZE")" status=none
  fi
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE" >/dev/null
  swapon "$SWAP_FILE" || echo "  WARNING: swapon failed — continuing WITHOUT swap (investigate!)"
  grep -q "^$SWAP_FILE " "$FSTAB_PATH" 2>/dev/null \
    || echo "$SWAP_FILE none swap sw 0 0" >> "$FSTAB_PATH"
fi
# Prefer RAM until real pressure; persist across reboots.
sysctl -w vm.swappiness=10 >/dev/null
printf 'vm.swappiness=10\n' > "$SYSCTL_CONF"
echo "  swappiness=10 persisted to $SYSCTL_CONF"
# ---- [swap-block] END ---------------------------------------------------------

echo "[setup] 3/7 deploy user + directories"
useradd -m -s /bin/bash deploy 2>/dev/null || echo "  user deploy already exists — ok"
mkdir -p /srv/alkemos/releases /srv/alkemos/shared /var/log/alkemos
chown -R deploy:deploy /srv/alkemos /var/log/alkemos

# ---- [deploy-key-block] BEGIN — GHA deploy access (2026-10-09 (2)) ------------
if [ -n "$DEPLOY_KEY" ]; then
  DEPLOY_HOME="${DEPLOY_HOME:-/home/deploy}"
  mkdir -p "$DEPLOY_HOME/.ssh"
  printf '%s\n' "$DEPLOY_KEY" > "$DEPLOY_HOME/.ssh/authorized_keys"
  chown -R deploy:deploy "$DEPLOY_HOME/.ssh"
  chmod 700 "$DEPLOY_HOME/.ssh"
  chmod 600 "$DEPLOY_HOME/.ssh/authorized_keys"
  echo "  deploy user authorized_keys installed (GHA deploy access)"
else
  echo "  NOTE: --deploy-key not given — GitHub Actions deploys will fail"
  echo "  until ~deploy/.ssh/authorized_keys exists (plan ملحق و steps 6-7)"
fi
# ---- [deploy-key-block] END ---------------------------------------------------

echo "[setup] 4/7 bun (as deploy)"
sudo -u deploy bash -c 'curl -fsSL https://bun.sh/install | bash' || \
  { echo "  bun install script failed — is the network reachable?" >&2; exit 1; }
grep -q '.bun/bin' /home/deploy/.profile 2>/dev/null || \
  echo 'export PATH="$HOME/.bun/bin:$PATH"' >> /home/deploy/.profile

echo "[setup] 5/7 PM2 autostart at boot + log rotation"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u deploy --hp /home/deploy
sudo -u deploy env PATH="$PATH:/usr/bin" pm2 install pm2-logrotate

echo "[setup] 6/7 Caddyfile ($MODE mode)"
SRC="$HERE/Caddyfile"
[ "$MODE" = "test" ] && SRC="$HERE/Caddyfile.test"
[ -f "$SRC" ] || { echo "missing $SRC — run from the repo checkout" >&2; exit 1; }
caddy validate --config "$SRC" --adapter caddyfile
install -m 0644 "$SRC" /etc/caddy/Caddyfile
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

echo "[setup] 7/7 shared .env placeholder"
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
  2. Lightsail console ▸ Networking ▸ IPv4 Firewall: 22 (key-only; must
     also cover GitHub Actions runner ranges) · 80 · 443.
  3. (cutover only) skip in test mode — crontab + DNS are Phase 2/5.
  4. Deploy: GitHub ▸ Actions ▸ "Deploy to AWS origin (alkemos)" ▸ Run
     workflow (needs AWS_DEPLOY_HOST / AWS_DEPLOY_USER /
     AWS_DEPLOY_SSH_KEY secrets — see the migration plan doc §appendix).

EOF
echo "[setup] mode=$MODE — Caddy serving with the $MODE config (swap + deploy-key handled above)"
