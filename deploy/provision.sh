#!/usr/bin/env bash
# =============================================================================
# provision.sh — bare-metal (no Docker) provisioning for VISTA
#   Ubuntu 22.04 / 24.04, run as root:  sudo ./deploy/provision.sh
#
# Installs + configures: Node 20 + pm2, MongoDB 8 (localhost-only, auth on),
# nginx (TLS), ufw, Wazuh agent, Tailscale, rclone, and a nightly mongodump
# cron that keeps ONE archive in Google Drive.
#
# Settings come from /etc/vista/deploy.conf (created on first run from your
# answers). Re-running is safe: generated secrets are never regenerated.
# =============================================================================
set -euo pipefail

CONF=/etc/vista/deploy.conf
SECRETS=/etc/vista/secrets.env
REPO_URL="${REPO_URL:-https://github.com/purposesproject7/vista.git}"
APP_DIR="${APP_DIR:-/opt/vista}"
BRANCH="${BRANCH:-main}"
WEB_ROOT=/var/www/vista
BACKUP_DIR=/var/backups/vista
RUN_USER="${RUN_USER:-vista}"

c()  { echo -e "\033[0;36m[*]\033[0m $*"; }
ok() { echo -e "\033[0;32m[+]\033[0m $*"; }
die(){ echo -e "\033[0;31m[!]\033[0m $*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run as root"

# ---------------------------------------------------------------------------
# 1. Settings
# ---------------------------------------------------------------------------
mkdir -p /etc/vista && chmod 700 /etc/vista

ask() { # ask VAR "prompt" "default"
  local var=$1 prompt=$2 def=${3:-} cur=${!1:-} val
  [ -n "$cur" ] && return
  read -rp "  $prompt${def:+ [$def]}: " val </dev/tty || true
  printf -v "$var" '%s' "${val:-$def}"
}

[ -f "$CONF" ] && . "$CONF"

if [ ! -f "$CONF" ]; then
  echo "First run — answer these once (stored in $CONF):"
  ask DOMAIN            "Public domain (e.g. vista.example.edu)"
  ask LE_EMAIL          "Email for Let's Encrypt notices"
  ask EMAIL_USER        "Gmail address the app sends from"
  ask EMAIL_PASS        "Gmail app password"
  ask ADMIN_EMAIL       "Initial admin email" "admin@vit.ac.in"
  ask ADMIN_PASSWORD    "Initial admin password"
  ask ADMIN_NAME        "Admin display name" "System Administrator"
  ask ADMIN_EMPLOYEE_ID "Admin employee id" "ADMIN001"
  ask ADMIN_SCHOOL      "Admin school" "SCOPE"
  ask ADMIN_DEPARTMENT  "Admin department" "CSE"
  ask WAZUH_MANAGER     "Wazuh manager IP/host (blank = skip Wazuh)"
  ask TS_AUTHKEY        "Tailscale auth key (blank = interactive login)"
  ask RCLONE_REMOTE     "rclone Google Drive remote name" "gdrive"
  ask RCLONE_PATH       "Folder in that Drive account" "vista-backups"
  ask BACKUP_CRON       "Backup schedule (cron)" "30 2 * * *"

  umask 077
  cat > "$CONF" <<EOF
DOMAIN='$DOMAIN'
LE_EMAIL='$LE_EMAIL'
EMAIL_USER='$EMAIL_USER'
EMAIL_PASS='$EMAIL_PASS'
ADMIN_EMAIL='$ADMIN_EMAIL'
ADMIN_PASSWORD='$ADMIN_PASSWORD'
ADMIN_NAME='$ADMIN_NAME'
ADMIN_EMPLOYEE_ID='$ADMIN_EMPLOYEE_ID'
ADMIN_SCHOOL='$ADMIN_SCHOOL'
ADMIN_DEPARTMENT='$ADMIN_DEPARTMENT'
WAZUH_MANAGER='$WAZUH_MANAGER'
TS_AUTHKEY='$TS_AUTHKEY'
RCLONE_REMOTE='$RCLONE_REMOTE'
RCLONE_PATH='$RCLONE_PATH'
BACKUP_CRON='$BACKUP_CRON'
EOF
  chmod 600 "$CONF"
  umask 022          # restore: a leaked 077 makes apt keyrings unreadable by _apt
  ok "wrote $CONF"
fi
[ -n "${DOMAIN:-}" ] || die "DOMAIN unset in $CONF"

# Generated-once secrets. Never regenerate: a new JWT_SECRET logs everyone out,
# a new mongo password orphans the existing database user.
if [ ! -f "$SECRETS" ]; then
  umask 077
  {
    echo "JWT_SECRET='$(openssl rand -hex 32)'"
    echo "MONGO_APP_PASSWORD='$(openssl rand -hex 24)'"
    echo "MONGO_ROOT_PASSWORD='$(openssl rand -hex 24)'"
  } > "$SECRETS"
  chmod 600 "$SECRETS"
  umask 022
  ok "generated $SECRETS"
fi
. "$SECRETS"

# ---------------------------------------------------------------------------
# 2. Base packages
# ---------------------------------------------------------------------------
c "installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl gnupg ca-certificates git ufw cron rclone \
                      nginx certbot python3-certbot-nginx

CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
# MongoDB publishes apt suites for LTS releases only. Interim releases
# (oracular, plucky, questing, resolute, ...) have no repo of their own, so
# point them at the LTS they derive from.
case "$CODENAME" in
  focal|jammy|noble) MONGO_SUITE="$CODENAME" ;;
  *)                 MONGO_SUITE="noble" ;;
esac

if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1)" != "v20" ]; then
  c "installing Node 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
command -v pm2 >/dev/null || npm install -g pm2 >/dev/null

if ! command -v mongod >/dev/null; then
  c "installing MongoDB 8.0"
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
    | gpg --batch --yes --dearmor -o /usr/share/keyrings/mongodb-8.0.gpg
  echo "deb [signed-by=/usr/share/keyrings/mongodb-8.0.gpg] https://repo.mongodb.org/apt/ubuntu ${MONGO_SUITE}/mongodb-org/8.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-8.0.list
  # gpgv runs as _apt, not root — both files must be world-readable.
  chmod 644 /usr/share/keyrings/mongodb-8.0.gpg /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -qq
  apt-get install -y -qq mongodb-org
fi

id -u "$RUN_USER" >/dev/null 2>&1 || \
  useradd --system --create-home --shell /bin/bash "$RUN_USER"

# ---------------------------------------------------------------------------
# 3. MongoDB config + auth
# ---------------------------------------------------------------------------
c "configuring mongod (127.0.0.1 only, auth on)"
cat > /etc/mongod.conf <<'EOF'
storage:
  dbPath: /var/lib/mongodb
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
net:
  port: 27017
  bindIp: 127.0.0.1
processManagement:
  timeZoneInfo: /usr/share/zoneinfo
security:
  authorization: enabled
EOF

# The localhost exception only applies while no user exists, so users have to
# be created on a no-auth pass before authorization is switched on.
if [ ! -f /etc/vista/.mongo-users-created ]; then
  c "creating mongo users"
  systemctl stop mongod 2>/dev/null || true
  chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb
  sudo -u mongodb mongod --dbpath /var/lib/mongodb --bind_ip 127.0.0.1 --fork \
       --logpath /var/log/mongodb/bootstrap.log
  mongosh --quiet --eval "
    db.getSiblingDB('admin').createUser({user:'admin',pwd:'${MONGO_ROOT_PASSWORD}',
      roles:[{role:'root',db:'admin'}]});
    db.getSiblingDB('vista').createUser({user:'vista',pwd:'${MONGO_APP_PASSWORD}',
      roles:[{role:'readWrite',db:'vista'}]});"
  sudo -u mongodb mongod --dbpath /var/lib/mongodb --shutdown
  touch /etc/vista/.mongo-users-created
fi
systemctl enable --now mongod
ok "mongod running"

# ---------------------------------------------------------------------------
# 4. Application code, .env, build
# ---------------------------------------------------------------------------
if [ -d "$APP_DIR/.git" ]; then
  c "updating $APP_DIR"
  git -C "$APP_DIR" fetch --all -q
  git -C "$APP_DIR" checkout -q "$BRANCH"
  git -C "$APP_DIR" pull -q --ff-only
else
  c "cloning into $APP_DIR"
  git clone -q -b "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

c "writing $APP_DIR/server/.env"
umask 077
cat > "$APP_DIR/server/.env" <<EOF
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
LOG_LEVEL=info

MONGO_URI=mongodb://vista:${MONGO_APP_PASSWORD}@127.0.0.1:27017/vista?authSource=vista
MONGODB_URI=mongodb://vista:${MONGO_APP_PASSWORD}@127.0.0.1:27017/vista?authSource=vista

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=1h

ALLOWED_ORIGINS=https://${DOMAIN}
FRONTEND_URL=https://${DOMAIN}

EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
EMAIL_FROM=Vista System <${EMAIL_USER}>

ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=${ADMIN_NAME}
ADMIN_EMPLOYEE_ID=${ADMIN_EMPLOYEE_ID}
ADMIN_SCHOOL=${ADMIN_SCHOOL}
ADMIN_DEPARTMENT=${ADMIN_DEPARTMENT}
EOF
chmod 640 "$APP_DIR/server/.env"
umask 022

printf 'VITE_API_BASE_URL=https://%s/api\n' "$DOMAIN" > "$APP_DIR/client/.env.production"

c "installing server deps"
(cd "$APP_DIR/server" && npm ci --omit=dev --silent)

c "building client"
(cd "$APP_DIR/client" && npm ci --silent && npm run build)
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
cp -r "$APP_DIR/client/dist/." "$WEB_ROOT/"

mkdir -p "$APP_DIR/server/logs"
chown -R "$RUN_USER":"$RUN_USER" "$APP_DIR/server" "$WEB_ROOT"

# ---------------------------------------------------------------------------
# 5. pm2
# ---------------------------------------------------------------------------
c "starting API under pm2"
PM2="sudo -u $RUN_USER HOME=/home/$RUN_USER pm2"
if $PM2 describe vista-api >/dev/null 2>&1; then
  $PM2 restart vista-api --update-env
else
  $PM2 start "$APP_DIR/server/index.js" --name vista-api \
      --cwd "$APP_DIR/server" --time --max-memory-restart 600M
fi
$PM2 save
pm2 startup systemd -u "$RUN_USER" --hp "/home/$RUN_USER" >/dev/null
ok "pm2 online"

# ---------------------------------------------------------------------------
# 6. nginx + TLS
# ---------------------------------------------------------------------------
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  # Self-signed placeholder so nginx starts before certbot has ever run.
  c "no cert yet — writing self-signed placeholder into $CERT_DIR"
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$CERT_DIR/privkey.pem" -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=$DOMAIN" 2>/dev/null
fi

c "writing /etc/nginx/sites-available/vista"
cat > /etc/nginx/sites-available/vista <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${DOMAIN};

    # --- SSL certificate paths --------------------------------------------
    ssl_certificate     ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    # ----------------------------------------------------------------------

    root ${WEB_ROOT};
    index index.html;
    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/javascript application/json image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        # bulk xlsx imports run long; server.timeout is 300s
        proxy_connect_timeout 120s;
        proxy_send_timeout    300s;
        proxy_read_timeout    300s;
    }

    location = /health {
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }

    location ~* \.(js|css|woff2?|png|jpg|jpeg|svg|ico)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / { try_files \$uri \$uri/ /index.html; }
}
EOF
ln -sf /etc/nginx/sites-available/vista /etc/nginx/sites-enabled/vista
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "nginx configured"

# ---------------------------------------------------------------------------
# 7. ufw
# ---------------------------------------------------------------------------
c "configuring ufw"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw allow in on tailscale0 >/dev/null     # admin access over the tailnet
ufw allow out 41641/udp >/dev/null        # tailscale
# 27017 deliberately NOT opened — mongod binds 127.0.0.1 only.
ufw --force enable >/dev/null
ok "ufw active"

# ---------------------------------------------------------------------------
# 8. Tailscale
# ---------------------------------------------------------------------------
if ! command -v tailscale >/dev/null; then
  c "installing tailscale"
  curl -fsSL https://tailscale.com/install.sh | sh >/dev/null
fi
if ! tailscale status >/dev/null 2>&1; then
  if [ -n "${TS_AUTHKEY:-}" ]; then
    tailscale up --authkey "$TS_AUTHKEY" --ssh --hostname "vista-$(hostname -s)"
  else
    echo "  -> no TS_AUTHKEY in $CONF; finish with: tailscale up --ssh"
  fi
fi
ok "tailscale ready"

# ---------------------------------------------------------------------------
# 9. Wazuh agent (SIEM)
# ---------------------------------------------------------------------------
if [ -n "${WAZUH_MANAGER:-}" ]; then
  if [ ! -x /var/ossec/bin/wazuh-control ]; then
    c "installing wazuh-agent -> $WAZUH_MANAGER"
    curl -fsSL https://packages.wazuh.com/key/GPG-KEY-WAZUH \
      | gpg --batch --yes --dearmor -o /usr/share/keyrings/wazuh.gpg
    echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" \
      > /etc/apt/sources.list.d/wazuh.list
    chmod 644 /usr/share/keyrings/wazuh.gpg /etc/apt/sources.list.d/wazuh.list
    apt-get update -qq
    WAZUH_MANAGER="$WAZUH_MANAGER" WAZUH_AGENT_NAME="vista-$(hostname -s)" \
      apt-get install -y -qq wazuh-agent
  fi
  sed -i "s|<address>.*</address>|<address>${WAZUH_MANAGER}</address>|" \
      /var/ossec/etc/ossec.conf
  # Ship the app, nginx and mongo logs to the SIEM.
  if ! grep -q "vista-localfiles" /var/ossec/etc/ossec.conf; then
    cat >> /var/ossec/etc/ossec.conf <<EOF

<!-- vista-localfiles -->
<ossec_config>
  <localfile><log_format>json</log_format><location>${APP_DIR}/server/logs/combined.log</location></localfile>
  <localfile><log_format>json</log_format><location>${APP_DIR}/server/logs/error.log</location></localfile>
  <localfile><log_format>syslog</log_format><location>/var/log/nginx/access.log</location></localfile>
  <localfile><log_format>syslog</log_format><location>/var/log/nginx/error.log</location></localfile>
  <localfile><log_format>syslog</log_format><location>/var/log/mongodb/mongod.log</location></localfile>
  <localfile><log_format>syslog</log_format><location>/var/log/vista-backup.log</location></localfile>
</ossec_config>
EOF
  fi
  systemctl daemon-reload
  systemctl enable --now wazuh-agent
  systemctl restart wazuh-agent
  ok "wazuh-agent reporting to $WAZUH_MANAGER"
else
  echo "  -> WAZUH_MANAGER blank in $CONF; SIEM agent skipped"
fi

# ---------------------------------------------------------------------------
# 10. Backups: nightly mongodump -> Google Drive (latest only)
# ---------------------------------------------------------------------------
c "installing backup job"
mkdir -p "$BACKUP_DIR"
cat > /usr/local/bin/vista-backup <<'BACKUP_EOF'
#!/usr/bin/env bash
# Nightly mongodump. Local: 7 newest archives. Google Drive: exactly one —
# copyto a fixed filename overwrites in place, so no purge pass is needed.
set -euo pipefail
. /etc/vista/deploy.conf
. /etc/vista/secrets.env

BACKUP_DIR=/var/backups/vista
STAMP=$(date -u +%Y%m%d_%H%M%S)
ARCHIVE="$BACKUP_DIR/vista_${STAMP}.archive.gz"
log() { echo "$(date -u +%FT%TZ) $*" >> /var/log/vista-backup.log; }

mkdir -p "$BACKUP_DIR"
mongodump --uri="mongodb://vista:${MONGO_APP_PASSWORD}@127.0.0.1:27017/vista?authSource=vista" \
          --archive="$ARCHIVE" --gzip --quiet
log "dumped $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

ls -1t "$BACKUP_DIR"/vista_*.archive.gz 2>/dev/null | tail -n +8 | xargs -r rm -f

if rclone listremotes 2>/dev/null | grep -qx "${RCLONE_REMOTE}:"; then
  rclone copyto "$ARCHIVE" "${RCLONE_REMOTE}:${RCLONE_PATH}/vista-latest.archive.gz" \
         --drive-use-trash=false
  log "uploaded ${RCLONE_REMOTE}:${RCLONE_PATH}/vista-latest.archive.gz"
else
  log "WARN rclone remote '${RCLONE_REMOTE}' not configured; upload skipped"
fi
BACKUP_EOF
chmod 750 /usr/local/bin/vista-backup
touch /var/log/vista-backup.log

cat > /etc/cron.d/vista-backup <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
${BACKUP_CRON:-30 2 * * *} root /usr/local/bin/vista-backup
EOF
chmod 644 /etc/cron.d/vista-backup
systemctl restart cron
ok "cron: '${BACKUP_CRON:-30 2 * * *}' -> /usr/local/bin/vista-backup"

rclone listremotes 2>/dev/null | grep -qx "${RCLONE_REMOTE}:" || \
  echo "  -> Drive not linked. Run once: rclone config  (remote '${RCLONE_REMOTE}', type=drive, headless auth)"

# ---------------------------------------------------------------------------
# 11. Verify — the runnable check for everything above
# ---------------------------------------------------------------------------
echo
c "verifying"
fail=0
nginx -t >/dev/null 2>&1 && ok "nginx config valid" || { echo "    nginx config INVALID"; fail=1; }
systemctl is-active --quiet mongod && ok "mongod active" || { echo "    mongod NOT active"; fail=1; }
mongosh "mongodb://vista:${MONGO_APP_PASSWORD}@127.0.0.1:27017/vista?authSource=vista" \
        --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1 \
  && ok "mongo app user can authenticate" || { echo "    mongo auth FAILED"; fail=1; }
sleep 3
curl -fsS http://127.0.0.1:5000/health >/dev/null \
  && ok "API /health 200" || { echo "    API health FAILED — check: pm2 logs vista-api"; fail=1; }
[ -s "$WEB_ROOT/index.html" ] && ok "client build present in $WEB_ROOT" || { echo "    client build MISSING"; fail=1; }
ufw status | grep -q "Status: active" && ok "ufw active" || { echo "    ufw not active"; fail=1; }
curl -fskS "https://${DOMAIN}/health" >/dev/null \
  && ok "https://${DOMAIN}/health reachable" \
  || echo "    (https check failed — expected until DNS + certbot are done)"

echo
if [ ! -s "/etc/letsencrypt/renewal/${DOMAIN}.conf" ]; then
  echo "NEXT — point DNS at this host, then replace the self-signed cert:"
  echo "  certbot certonly --webroot -w /var/www/html -d ${DOMAIN} \\"
  echo "          -m ${LE_EMAIL:-you@example.com} --agree-tos -n && systemctl reload nginx"
fi
echo "NEXT — seed the admin account:"
echo "  sudo -u ${RUN_USER} bash -c 'cd ${APP_DIR}/server && npm run setup-admin'"
exit $fail
