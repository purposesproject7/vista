#!/usr/bin/env bash
# =============================================================================
# prepare-image.sh — generalize this host so it can be cloned as a base image
#   sudo ./deploy/prepare-image.sh [--yes]
#   then shut down and snapshot / convert to template / capture the disk.
#
# Keeps: installed packages (node, pm2, mongodb, nginx, rclone, wazuh), the
#        /opt/vista checkout and its node_modules, the built client.
# Wipes: every secret, every per-machine identity, all application data.
#
# On a machine flashed from the resulting image, run provision.sh: it recreates
# the secrets, the database and the site config for that deployment.
#
# DESTRUCTIVE — this deletes the MongoDB data directory. Never run it on a
# server you intend to keep using.
# =============================================================================
set -euo pipefail

c()  { echo -e "\033[0;36m[*]\033[0m $*"; }
ok() { echo -e "\033[0;32m[+]\033[0m $*"; }
die(){ echo -e "\033[0;31m[!]\033[0m $*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run as root"

if [ "${1:-}" != "--yes" ]; then
  cat <<EOF
This DESTROYS this server's data and identity so it can become a base image:

  - deletes /var/lib/mongodb (the entire database)
  - deletes /etc/vista/secrets.env, deploy.conf and the mongo keyfile
  - deletes server/.env, the TLS cert and key, the nginx site
  - regenerates SSH host keys and machine-id on next boot

Afterwards this machine is NOT a working deployment until provision.sh runs.
EOF
  read -rp "Type GENERALIZE to continue: " a </dev/tty
  [ "$a" = GENERALIZE ] || die "aborted"
fi

# ---------------------------------------------------------------------------
# 1. Stop everything that holds state open
# ---------------------------------------------------------------------------
c "stopping services"
sudo -u vista HOME=/home/vista pm2 delete all >/dev/null 2>&1 || true
sudo -u vista HOME=/home/vista pm2 save --force >/dev/null 2>&1 || true
sudo -u vista HOME=/home/vista pm2 kill >/dev/null 2>&1 || true
systemctl stop mongod nginx wazuh-agent 2>/dev/null || true

# ---------------------------------------------------------------------------
# 2. Secrets and site-specific config
# ---------------------------------------------------------------------------
c "removing secrets and site config"
rm -f /etc/vista/secrets.env \
      /etc/vista/deploy.conf \
      /etc/vista/.mongo-users-created \
      /etc/vista/.mongo-rs-initiated \
      /etc/mongod-keyfile \
      /opt/vista/server/.env \
      /opt/vista/client/.env.production.local \
      /etc/nginx/sites-enabled/vista \
      /etc/nginx/sites-available/vista \
      /etc/nginx/snippets/vista-app.conf \
      /etc/cron.d/vista-backup
rm -rf /etc/certs/*
# rclone holds a Google OAuth refresh token for a specific Drive account.
rm -rf /root/.config/rclone /home/vista/.config/rclone

# ---------------------------------------------------------------------------
# 3. Application data
# ---------------------------------------------------------------------------
c "removing database and backups"
# The replica set config in `local` records this host; a clone must re-initiate.
rm -rf /var/lib/mongodb/* /var/log/mongodb/*
rm -rf /var/backups/vista/* /var/log/vista-backup.log
rm -rf /opt/vista/server/logs/*

# ---------------------------------------------------------------------------
# 4. Wazuh agent identity — a cloned agent key collides on the manager
# ---------------------------------------------------------------------------
if [ -d /var/ossec ]; then
  c "clearing wazuh agent registration"
  rm -f /var/ossec/etc/client.keys
  rm -rf /var/ossec/queue/rids/*
fi

# ---------------------------------------------------------------------------
# 5. Per-machine identity
# ---------------------------------------------------------------------------
c "clearing host identity (ssh keys, machine-id, dhcp leases)"
rm -f /etc/ssh/ssh_host_*
# Regenerate on first boot so each clone gets its own host keys.
cat > /etc/systemd/system/regenerate-ssh-host-keys.service <<'EOF'
[Unit]
Description=Regenerate SSH host keys on first boot
ConditionPathExistsGlob=!/etc/ssh/ssh_host_*_key
Before=ssh.service

[Service]
Type=oneshot
ExecStart=/usr/bin/ssh-keygen -A
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
systemctl enable regenerate-ssh-host-keys.service >/dev/null

# An empty (not missing) machine-id makes systemd generate a fresh one at boot.
truncate -s 0 /etc/machine-id
rm -f /var/lib/dbus/machine-id
ln -sf /etc/machine-id /var/lib/dbus/machine-id
rm -rf /var/lib/dhcp/* /var/lib/NetworkManager/*.lease
cloud-init clean --logs >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
# 6. Noise: logs, history, caches
# ---------------------------------------------------------------------------
c "clearing logs, history and caches"
journalctl --rotate >/dev/null 2>&1 || true
journalctl --vacuum-time=1s >/dev/null 2>&1 || true
find /var/log -type f \( -name '*.gz' -o -name '*.1' -o -name '*.old' \) -delete
find /var/log -type f -exec truncate -s 0 {} \;
apt-get clean
rm -rf /var/lib/apt/lists/*
rm -rf /root/.npm/_cacache /home/vista/.npm/_cacache
rm -f /root/.bash_history /home/*/.bash_history
rm -rf /root/.ssh/known_hosts /home/*/.ssh/known_hosts
history -c 2>/dev/null || true

ok "generalized"
cat <<EOF

Now:
  shutdown -h now
then snapshot the disk / convert the VM to a template.

On each machine flashed from it:
  /opt/vista/deploy/provision.sh
which prompts for that deployment's settings, generates fresh secrets,
bootstraps MongoDB and writes the nginx site. Packages and node_modules are
already baked in, so it finishes in a fraction of the original time.

For unattended first boot, drop a filled-in /etc/vista/deploy.conf onto the
machine before running provision.sh — it skips every prompt when that file
exists.
EOF
