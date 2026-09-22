#!/usr/bin/env bash
# =============================================================================
# provision.sh — bare-metal (no Docker) provisioning for VISTA
#   Ubuntu 22.04 / 24.04, run as root:  sudo ./deploy/provision.sh
#
# Installs + configures: Node 20 + pm2, MongoDB 8 (localhost-only, auth on,
# single-node replica set), nginx (TLS from /etc/certs), ufw, Wazuh agent,
# rclone, and a nightly mongodump cron that keeps ONE archive in Google Drive.
#
# Settings come from /etc/vista/deploy.conf (created on first run from your
# answers). Re-running is safe: generated secrets are never regenerated.
# =============================================================================
set -euo pipefail

CONF=/etc/vista/deploy.conf
SECRETS=/etc/vista/secrets.env
REPO_URL="${REPO_URL:-https://github.com/purposesproject7/vista.git}"
APP_DIR="${APP_DIR:-/opt/vista}"
BRANCH="${BRANCH:-}"          # empty = keep the branch $APP_DIR is already on
WEB_ROOT=/var/www/vista
BACKUP_DIR=/var/backups/vista
RUN_USER="${RUN_USER:-vista}"

STEP="startup"
c()  { STEP="$*"; echo -e "\033[0;36m[*]\033[0m $*"; }
ok() { echo -e "\033[0;32m[+]\033[0m $*"; }
die(){ echo -e "\033[0;31m[!]\033[0m $*" >&2; exit 1; }

# set -e otherwise aborts silently mid-run and it looks like a step was skipped.
trap 'rc=$?; echo -e "\n\033[0;31m[!] FAILED during: ${STEP} (line $LINENO, exit $rc)\033[0m\n    Everything after this step did NOT run. Fix the error above and re-run." >&2' ERR

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
  ask RCLONE_REMOTE     "rclone Google Drive remote name" "gdrive"
  ask RCLONE_PATH       "Folder in that Drive account" "vista-backups"
  ask BACKUP_CRON       "Backup schedule (cron)" "30 2 * * *"
  ask HTTP_HOSTS        "Host/IP to also serve over plain HTTP (blank = none)"

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
RCLONE_REMOTE='$RCLONE_REMOTE'
RCLONE_PATH='$RCLONE_PATH'
BACKUP_CRON='$BACKUP_CRON'
# Hosts served over plain HTTP, no redirect. Unencrypted — clear once TLS works.
HTTP_HOSTS='$HTTP_HOSTS'
# Set to yes once a CA-issued cert is installed (HSTS locks browsers to https).
ENABLE_HSTS='no'
# TLS — change these if your issued cert uses different filenames.
SSL_CERT='/etc/certs/fullchain.pem'
SSL_KEY='/etc/certs/privkey.pem'
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

# TLS material. Defaults live in /etc/certs; override SSL_CERT / SSL_KEY in
# $CONF if your issued cert uses different filenames (e.g. vista.crt /
# vista.key), or point them at /etc/letsencrypt/live/<domain>/ for certbot.
SSL_DIR="${SSL_DIR:-/etc/certs}"
SSL_CERT="${SSL_CERT:-$SSL_DIR/fullchain.pem}"
SSL_KEY="${SSL_KEY:-$SSL_DIR/privkey.pem}"

# Hosts served over plain HTTP with no redirect to https — space separated,
# normally the LAN IP, so the app is usable before TLS works. Everything on
# these, logins included, travels unencrypted. Empty once TLS is in place.
HTTP_HOSTS="${HTTP_HOSTS:-}"

# CORS: the https domain, plus http:// for every plain-HTTP host. The SPA
# calls /api on its own origin so most requests are same-origin, but the
# allowlist has to cover the origin the page was actually loaded from.
ALLOWED_ORIGINS="https://${DOMAIN}"
for h in $HTTP_HOSTS; do ALLOWED_ORIGINS="${ALLOWED_ORIGINS},http://${h}"; done

# ---------------------------------------------------------------------------
# 2. Base packages
# ---------------------------------------------------------------------------
c "installing base packages"
export DEBIAN_FRONTEND=noninteractive
# This script owns the mongodb-org repo files and rewrites the right one below
# once the major and suite are known. Drop them first: a stale list left by an
# earlier run (wrong major, or a suite that has no Release file) makes every
# apt-get update in this script fail, including this one.
rm -f /etc/apt/sources.list.d/mongodb-org-*.list
apt-get update -qq
apt-get install -y -qq curl gnupg ca-certificates git ufw cron rclone \
                      nginx certbot python3-certbot-nginx

CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")

# MongoDB 8.0+ vendors a TCMalloc that violates the rseq ABI on Linux 6.19
# through 7.0.13 and corrupts memory, so mongod refuses to start on those
# kernels (SERVER-121912). Ubuntu 26.04 ships 7.0, which lands in that range.
# MongoDB 7.0 vendors the older allocator and is unaffected, so pick it when
# the running kernel is in the broken window. Override with MONGO_MAJOR=.
ver_lt() { [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -1)" = "$1" ]; }
KVER=$(uname -r | cut -d- -f1)
if [ -z "${MONGO_MAJOR:-}" ]; then
  if ! ver_lt "$KVER" 6.19 && ver_lt "$KVER" 7.0.14; then
    MONGO_MAJOR=7.0
    echo "    kernel $KVER is in the 6.19–7.0.13 window that MongoDB 8.0 refuses"
    echo "    to run on; installing MongoDB 7.0 instead (MONGO_MAJOR= to override)"
  else
    MONGO_MAJOR=8.0
  fi
fi

# MongoDB does not publish every suite for every major — 8.0 has resolute and
# noble, 7.0 stops at jammy. Ask the repo instead of guessing, newest first,
# and take the first suite that actually exists for the chosen major.
MONGO_SUITE=""
for s in "$CODENAME" resolute noble jammy focal; do
  if curl -fsI "https://repo.mongodb.org/apt/ubuntu/dists/${s}/mongodb-org/${MONGO_MAJOR}/Release" >/dev/null 2>&1; then
    MONGO_SUITE="$s"
    break
  fi
done
[ -n "$MONGO_SUITE" ] || die "no MongoDB ${MONGO_MAJOR} apt suite exists for this release"

if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1)" != "v20" ]; then
  c "installing Node 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
command -v pm2 >/dev/null || npm install -g pm2 >/dev/null

INSTALLED_MAJOR=""
command -v mongod >/dev/null && INSTALLED_MAJOR=$(mongod --version 2>/dev/null \
  | sed -n 's/^db version v\([0-9]*\.[0-9]*\).*/\1/p')

if [ -n "$INSTALLED_MAJOR" ] && [ "$INSTALLED_MAJOR" != "$MONGO_MAJOR" ]; then
  # Switching majors downward is not a data-compatible operation, and wiping a
  # data directory is the operator's call, not this script's.
  echo >&2
  echo "MongoDB ${INSTALLED_MAJOR} is installed but ${MONGO_MAJOR} is required on kernel ${KVER}." >&2
  echo "Downgrading is not data-compatible. If /var/lib/mongodb holds nothing you" >&2
  echo "need (a fresh deploy that never took real data), remove it and re-run:" >&2
  echo >&2
  echo "  systemctl stop mongod" >&2
  echo "  apt-get purge -y mongodb-org mongodb-org-* && rm -rf /var/lib/mongodb /etc/apt/sources.list.d/mongodb-org-*.list" >&2
  echo "  rm -f /etc/vista/.mongo-users-created /etc/vista/.mongo-rs-initiated" >&2
  echo "  $0" >&2
  echo >&2
  echo "If it holds data you need, mongodump it first with a ${INSTALLED_MAJOR} toolchain." >&2
  die "refusing to change MongoDB major version automatically"
fi

# Always (re)write the repo files, not just when installing, so the host keeps
# a working mongodb-org source after the deleting pass above.
c "configuring MongoDB ${MONGO_MAJOR} apt repo (${MONGO_SUITE})"
curl -fsSL "https://www.mongodb.org/static/pgp/server-${MONGO_MAJOR}.asc" \
  | gpg --batch --yes --dearmor -o "/usr/share/keyrings/mongodb-${MONGO_MAJOR}.gpg"
echo "deb [signed-by=/usr/share/keyrings/mongodb-${MONGO_MAJOR}.gpg] https://repo.mongodb.org/apt/ubuntu ${MONGO_SUITE}/mongodb-org/${MONGO_MAJOR} multiverse" \
  > "/etc/apt/sources.list.d/mongodb-org-${MONGO_MAJOR}.list"
# gpgv runs as _apt, not root — both files must be world-readable.
chmod 644 "/usr/share/keyrings/mongodb-${MONGO_MAJOR}.gpg" \
          "/etc/apt/sources.list.d/mongodb-org-${MONGO_MAJOR}.list"
apt-get update -qq

if [ -z "$INSTALLED_MAJOR" ]; then
  c "installing MongoDB ${MONGO_MAJOR}"
  apt-get install -y -qq mongodb-org
fi

id -u "$RUN_USER" >/dev/null 2>&1 || \
  useradd --system --create-home --shell /bin/bash "$RUN_USER"

# ---------------------------------------------------------------------------
# 3. MongoDB daemon: config file, auth, single-node replica set
# ---------------------------------------------------------------------------
REPL_SET="${REPL_SET:-rs0}"
# Not under /etc/vista: that directory is 0700 root-owned, and mongod runs as
# the mongodb user, which cannot traverse into it to read the key.
KEYFILE=/etc/mongod-keyfile
MONGO_URI="mongodb://vista:${MONGO_APP_PASSWORD}@127.0.0.1:27017/vista?authSource=vista&replicaSet=${REPL_SET}"

write_mongod_conf() { # write_mongod_conf <with-auth: yes|no>
  cat > /etc/mongod.conf <<EOF
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
replication:
  replSetName: ${REPL_SET}
EOF
  # Replica set members authenticate to each other with a shared keyfile.
  # mongod refuses to start a replica set with authorization on and no
  # keyFile, even for a single-member set. keyFile implies authorization.
  [ "$1" = yes ] && cat >> /etc/mongod.conf <<EOF
security:
  authorization: enabled
  keyFile: ${KEYFILE}
EOF
  return 0
}

# mongosh defaults to a 30s server-selection timeout, which turns any retry
# loop into a multi-minute hang. Always connect with a short timeout, and
# directConnection so an uninitiated replica set member is still reachable.
MURI="mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000"
msh() { mongosh "$MURI" --quiet "$@"; }

mongod_died() { # print why instead of retrying a process that already exited
  echo
  echo "--- systemctl status mongod ---" >&2
  systemctl --no-pager --lines=5 status mongod 2>&1 | sed 's/^/    /' >&2
  # A config-parse error happens before mongod opens its logfile, so the only
  # copy of that message is in the journal.
  echo "--- journalctl -u mongod ---" >&2
  journalctl -u mongod -n 20 --no-pager -o cat 2>/dev/null | sed 's/^/    /' >&2
  echo "--- last 20 lines of /var/log/mongodb/mongod.log ---" >&2
  tail -20 /var/log/mongodb/mongod.log 2>/dev/null | sed 's/^/    /' >&2
  echo "--- /etc/mongod.conf ---" >&2
  sed 's/^/    /' /etc/mongod.conf >&2
  die "$1"
}

start_mongod() {
  systemctl restart mongod || true
  for _ in $(seq 1 30); do
    systemctl is-active --quiet mongod || mongod_died "mongod exited on startup"
    msh --eval 'db.adminCommand({ping:1})' >/dev/null 2>&1 && return 0
    sleep 1
  done
  mongod_died "mongod is running but never accepted connections"
}

wait_primary() { # wait_primary [auth-args...]
  for _ in $(seq 1 30); do
    [ "$(mongosh "$@" --quiet --eval 'db.hello().isWritablePrimary' 2>/dev/null)" = "true" ] \
      && return 0
    sleep 1
  done
  return 1
}

# Bootstrap needs a pass with auth OFF: the localhost exception only applies
# while admin has no user, and rs.initiate() on an uninitiated member is
# simpler to do unauthenticated. mongod is bound to 127.0.0.1 and ufw has not
# been opened yet at this point, so nothing off-box can reach it meanwhile.
if [ ! -f /etc/vista/.mongo-users-created ] || [ ! -f /etc/vista/.mongo-rs-initiated ]; then
  c "bootstrapping mongod: replica set ${REPL_SET} + users"
  chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb
  write_mongod_conf no
  start_mongod

  if ! msh --eval 'rs.status().ok' >/dev/null 2>&1; then
    msh --eval \
      "rs.initiate({_id:'${REPL_SET}',members:[{_id:0,host:'127.0.0.1:27017'}]})" >/dev/null
  fi
  wait_primary "$MURI" || mongod_died "replica set ${REPL_SET} did not reach PRIMARY"
  touch /etc/vista/.mongo-rs-initiated

  # Idempotent: re-running must not fail on users that already exist.
  msh --eval "
    const a = db.getSiblingDB('admin');
    if (!a.getUser('admin')) a.createUser({user:'admin',pwd:'${MONGO_ROOT_PASSWORD}',
      roles:[{role:'root',db:'admin'}]});
    const v = db.getSiblingDB('vista');
    if (!v.getUser('vista')) v.createUser({user:'vista',pwd:'${MONGO_APP_PASSWORD}',
      roles:[{role:'readWrite',db:'vista'}]});" >/dev/null
  touch /etc/vista/.mongo-users-created
fi

c "configuring mongod daemon (127.0.0.1 only, auth on, replSet ${REPL_SET})"
if [ ! -s "$KEYFILE" ]; then
  # Single-member set, so regenerating the key costs nothing; clean up the
  # earlier unreadable location if it is still around.
  rm -f /etc/vista/mongo-keyfile
  openssl rand -base64 756 > "$KEYFILE"
fi
chown mongodb:mongodb "$KEYFILE"
chmod 400 "$KEYFILE"
sudo -u mongodb test -r "$KEYFILE" \
  || die "mongodb user cannot read $KEYFILE — check the permissions on $(dirname "$KEYFILE")"

write_mongod_conf yes
systemctl enable mongod >/dev/null
start_mongod

ADMIN_URI="mongodb://admin:${MONGO_ROOT_PASSWORD}@127.0.0.1:27017/?authSource=admin&directConnection=true&serverSelectionTimeoutMS=2000"
MSH="mongosh $ADMIN_URI --quiet"
wait_primary "$ADMIN_URI" || mongod_died "mongod is up but ${REPL_SET} is not PRIMARY"
ok "mongod running as ${REPL_SET} PRIMARY, auth on"

# ---------------------------------------------------------------------------
# 4. nginx + TLS (written before the app build, so a build failure still
#    leaves a valid server config on disk)
# ---------------------------------------------------------------------------
mkdir -p "$SSL_DIR"

# HSTS pins the browser to https for a year. Sent while the cert is still the
# self-signed placeholder, it makes Chrome refuse to let anyone click past the
# warning — the site becomes unreachable for testing. Turn it on in $CONF once
# the CA-issued cert is installed.
if [ "${ENABLE_HSTS:-no}" = yes ]; then
  HSTS_HEADER='    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;'
else
  HSTS_HEADER='    # HSTS off until a CA-issued cert is installed: set ENABLE_HSTS=yes in /etc/vista/deploy.conf'
fi

c "writing /etc/nginx/sites-available/vista"
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/snippets "$WEB_ROOT"

# Everything that is identical for every way the app is reached. Kept in a
# snippet so the https vhost and the plain-http one cannot drift apart.
cat > /etc/nginx/snippets/vista-app.conf <<EOF
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
EOF

# Plain HTTP, no redirect, for the hosts in HTTP_HOSTS (typically the LAN IP).
# Lets the app be used before a usable TLS certificate exists. Traffic here is
# unencrypted, including logins — clear HTTP_HOSTS once TLS works.
if [ -n "$HTTP_HOSTS" ]; then
  HTTP_BLOCK="server {
    listen 80;
    listen [::]:80;
    server_name ${HTTP_HOSTS};

    include /etc/nginx/snippets/vista-app.conf;
}"
else
  HTTP_BLOCK=""
fi

cat > /etc/nginx/sites-available/vista <<EOF
${HTTP_BLOCK}

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
    ssl_certificate     ${SSL_CERT};
    ssl_certificate_key ${SSL_KEY};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    # ----------------------------------------------------------------------

${HSTS_HEADER}

    include /etc/nginx/snippets/vista-app.conf;
}
EOF
ln -sf /etc/nginx/sites-available/vista /etc/nginx/sites-enabled/vista
rm -f /etc/nginx/sites-enabled/default

# Debian/Ubuntu's nginx.conf includes sites-enabled/*, but a hand-edited or
# upstream-packaged nginx.conf may only include conf.d/*.conf — in which case
# the site above is written but never loaded.
if ! grep -qE '^\s*include\s+.*sites-enabled' /etc/nginx/nginx.conf; then
  c "nginx.conf does not include sites-enabled — bridging via conf.d"
  echo 'include /etc/nginx/sites-enabled/*;' > /etc/nginx/conf.d/vista-sites-enabled.conf
fi

[ -L /etc/nginx/sites-enabled/vista ] || die "sites-enabled/vista symlink missing"
ok "nginx configured: /etc/nginx/sites-available/vista -> sites-enabled/vista"

# nginx -t fails while $SSL_CERT does not exist yet. That is expected until the
# college hands over the cert, so warn and carry on instead of aborting the run.
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  ok "nginx reloaded"
else
  echo "    nginx -t failed — port 80 keeps serving, 443 will not until the cert exists:"
  echo "      ${SSL_CERT}"
  echo "      ${SSL_KEY}"
  echo "    Drop them in, then: nginx -t && systemctl reload nginx"
fi

# ---------------------------------------------------------------------------
# 5. Application code, .env, build
# ---------------------------------------------------------------------------
if [ -d "$APP_DIR/.git" ]; then
  # Stay on whatever branch the checkout is already on unless BRANCH was set
  # explicitly — otherwise a clone made with -b <branch> silently gets moved.
  TARGET_BRANCH="${BRANCH:-$(git -C "$APP_DIR" rev-parse --abbrev-ref HEAD)}"
  c "updating $APP_DIR (branch $TARGET_BRANCH)"
  git -C "$APP_DIR" fetch --all -q
  # client/.env.production is tracked. An earlier version of this script wrote
  # to it, which leaves the tree dirty and makes checkout refuse. Put it back;
  # deployment overrides now go in the gitignored .env.production.local.
  git -C "$APP_DIR" checkout -q -- client/.env.production 2>/dev/null || true
  git -C "$APP_DIR" checkout -q "$TARGET_BRANCH"
  git -C "$APP_DIR" pull -q --ff-only
else
  TARGET_BRANCH="${BRANCH:-main}"
  c "cloning into $APP_DIR (branch $TARGET_BRANCH)"
  git clone -q -b "$TARGET_BRANCH" "$REPO_URL" "$APP_DIR"
fi

c "writing $APP_DIR/server/.env"
umask 077
cat > "$APP_DIR/server/.env" <<EOF
NODE_ENV=production
PORT=5000
HOST=127.0.0.1
LOG_LEVEL=info

MONGO_URI=${MONGO_URI}
MONGODB_URI=${MONGO_URI}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=1h

ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
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

# Client env lives in the client folder, server env in the server folder.
# Vite inlines VITE_* at BUILD time, so this must exist before `npm run build`.
#
# Not .env: the repo tracks client/.env.production, and a mode-specific file
# beats plain .env, so anything written there is silently ignored in a
# production build. .env.production.local has the highest precedence and is
# gitignored (.env.*.local), so it overrides without dirtying the tree.
#
# Relative /api, matching the repo default: nginx proxies /api/ to the API on
# the same origin, so the bundle stays portable across the domain, a bare IP
# and localhost instead of baking one hostname in.
c "writing $APP_DIR/client/.env.production.local"
printf 'VITE_API_BASE_URL=/api\n' > "$APP_DIR/client/.env.production.local"
rm -f "$APP_DIR/client/.env"   # written by an earlier version; had no effect

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
# 6. pm2
# ---------------------------------------------------------------------------
c "starting API under pm2"
# Run from a directory $RUN_USER can traverse. If the script is invoked from
# somewhere only the invoking user can read (e.g. another user's home), node
# inherits that cwd and every spawn dies with EACCES.
cd "$APP_DIR/server"
install -d -o "$RUN_USER" -g "$RUN_USER" -m 755 "/home/$RUN_USER"
PM2="sudo -u $RUN_USER HOME=/home/$RUN_USER pm2"
if $PM2 describe vista-api >/dev/null 2>&1; then
  $PM2 restart vista-api --update-env
else
  $PM2 start "$APP_DIR/server/index.js" --name vista-api \
      --cwd "$APP_DIR/server" --time --max-memory-restart 600M
fi
$PM2 save
pm2 startup systemd -u "$RUN_USER" --hp "/home/$RUN_USER" >/dev/null
cd /
ok "pm2 online"

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
# 27017 deliberately NOT opened — mongod binds 127.0.0.1 only.
ufw --force enable >/dev/null
ok "ufw active"

# ---------------------------------------------------------------------------
# 8. Wazuh agent (SIEM)
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
# 9. Backups: nightly mongodump -> Google Drive (latest only)
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

# Direct connection on purpose: mongodump does not need replica-set discovery,
# and this avoids the backup depending on the set name.
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
# 10. Verify — the runnable check for everything above
# ---------------------------------------------------------------------------
echo
c "verifying"
fail=0
[ -s /etc/nginx/sites-available/vista ] && ok "sites-available/vista written" || { echo "    sites-available/vista MISSING"; fail=1; }
[ -L /etc/nginx/sites-enabled/vista ] && ok "sites-enabled/vista linked" || { echo "    sites-enabled/vista MISSING"; fail=1; }
grep -q "ssl_certificate  *${SSL_CERT};" /etc/nginx/sites-available/vista \
  && ok "nginx points at ${SSL_CERT}" || { echo "    cert path NOT in site config"; fail=1; }
if nginx -t >/dev/null 2>&1; then
  ok "nginx config valid"
  nginx -T 2>/dev/null | grep -q "server_name ${DOMAIN}" \
    && ok "nginx loaded the vista site" || { echo "    vista site NOT loaded by nginx"; fail=1; }
elif [ ! -s "$SSL_CERT" ]; then
  # Expected: the 443 block names a cert that has not been issued yet.
  echo "    nginx -t fails because ${SSL_CERT} does not exist yet (expected)"
else
  echo "    nginx config INVALID"; fail=1
fi
[ -s "$APP_DIR/server/.env" ] && ok "server/.env written" || { echo "    server/.env MISSING"; fail=1; }
[ -s "$APP_DIR/client/.env.production.local" ] && ok "client/.env.production.local written" \
  || { echo "    client/.env.production.local MISSING"; fail=1; }
# The dev fallback in client/src/shared/constants/config.js is
# http://localhost:5000/api. If that string reached the bundle, the env file
# was not picked up and every browser would call its own machine.
grep -rqs "localhost:5000" "$WEB_ROOT"/assets 2>/dev/null \
  && { echo "    client bundle contains localhost:5000 — client env not applied at build time"; fail=1; } \
  || ok "client bundle has no localhost fallback baked in"
git -C "$APP_DIR" diff --quiet -- client/.env.production \
  && ok "tracked client/.env.production left clean" \
  || { echo "    tracked client/.env.production is dirty — next checkout will fail"; fail=1; }
systemctl is-active --quiet mongod && ok "mongod active" || { echo "    mongod NOT active"; fail=1; }
mongosh "${MONGO_URI}" \
        --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1 \
  && ok "mongo app user can authenticate over the ${REPL_SET} URI" \
  || { echo "    mongo auth FAILED"; fail=1; }
[ "$($MSH --eval 'db.hello().isWritablePrimary' 2>/dev/null)" = "true" ] \
  && ok "replica set ${REPL_SET} is PRIMARY" || { echo "    ${REPL_SET} NOT primary"; fail=1; }
grep -q "replicaSet=${REPL_SET}" "$APP_DIR/server/.env" \
  && ok "server/.env MONGO_URI carries replicaSet=${REPL_SET}" \
  || { echo "    replicaSet missing from server/.env"; fail=1; }
sleep 3
curl -fsS http://127.0.0.1:5000/health >/dev/null \
  && ok "API /health 200" || { echo "    API health FAILED — check: pm2 logs vista-api"; fail=1; }
[ -s "$WEB_ROOT/index.html" ] && ok "client build present in $WEB_ROOT" || { echo "    client build MISSING"; fail=1; }
ufw status | grep -q "Status: active" && ok "ufw active" || { echo "    ufw not active"; fail=1; }
curl -fsS "http://127.0.0.1/health" >/dev/null 2>&1 \
  && ok "http://127.0.0.1/health reachable through nginx" \
  || echo "    (nginx health check failed)"

echo
if [ ! -s "$SSL_CERT" ]; then
  echo "NEXT — TLS. nginx is already pointed at these paths; drop the files in:"
  echo "  ${SSL_CERT}   <- full chain (server cert + intermediates)"
  echo "  ${SSL_KEY}   <- private key"
  echo "  then: nginx -t && systemctl reload nginx"
  echo "  Different filenames? Set SSL_CERT / SSL_KEY in ${CONF} and re-run."
fi
echo "Deployed branch: $(git -C "$APP_DIR" rev-parse --abbrev-ref HEAD) @ $(git -C "$APP_DIR" rev-parse --short HEAD)"
if grep -q '"setup-admin"' "$APP_DIR/server/package.json"; then
  echo "NEXT — seed the admin account:"
  echo "  sudo -u ${RUN_USER} bash -c 'cd ${APP_DIR}/server && npm run setup-admin'"
else
  echo "NOTE — this branch has no setup-admin script; create the admin account"
  echo "       by hand, or deploy a branch that ships one: BRANCH=<name> $0"
fi
exit $fail
