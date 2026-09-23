#!/usr/bin/env bash
# =============================================================================
# wazuh-server.sh — install the Wazuh SIEM on this host and publish its UI at
# https://<domain>/siem, without touching the application or its database.
#
#   sudo ./deploy/wazuh-server.sh
#
# Self-contained: installs the manager/indexer/dashboard, binds the dashboard
# to loopback under a base path, wires the nginx location, and points the
# manager at the app's logs. provision.sh is NOT required and is not called.
#
# The indexer is OpenSearch on the JVM — the heaviest process on this box by a
# wide margin, heavier than MongoDB and the API combined.
# =============================================================================
set -euo pipefail

WAZUH_VERSION="${WAZUH_VERSION:-4.14}"
DASH_PORT="${DASH_PORT:-8443}"
SIEM_PATH="${SIEM_PATH:-/siem}"
APP_DIR="${APP_DIR:-/opt/vista}"
CONF=/etc/vista/deploy.conf
SITE=/etc/nginx/sites-available/vista
APP_SNIPPET=/etc/nginx/snippets/vista-app.conf
SIEM_SNIPPET=/etc/nginx/snippets/vista-siem.conf
WORK=/root/wazuh-install

c()  { echo -e "\033[0;36m[*]\033[0m $*"; }
ok() { echo -e "\033[0;32m[+]\033[0m $*"; }
die(){ echo -e "\033[0;31m[!]\033[0m $*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run as root"
[ -f "$SITE" ] || die "$SITE not found — is the app deployed with provision.sh?"

# ---------------------------------------------------------------------------
# 1. Capacity
# ---------------------------------------------------------------------------
RAM_GB=$(awk '/MemTotal/ {printf "%.1f", $2/1024/1024}' /proc/meminfo)
c "this host: ${RAM_GB} GiB RAM, $(nproc) vCPU, $(df -BG --output=avail / | tail -1 | tr -dc '0-9') GiB free on /"
echo "    Wazuh's own minimum for 1-25 endpoints is 8 GiB RAM / 4 vCPU / 50 GiB,"
echo "    and that assumes the host does nothing else. MongoDB and the API are"
echo "    already running here."

if [ "${SKIP_CAPACITY_CHECK:-no}" != yes ]; then
  awk -v r="$RAM_GB" 'BEGIN{exit !(r < 7.5)}' && {
    echo "    The indexer allocates a JVM heap at startup; below this it either"
    echo "    fails to start or starves mongod. SKIP_CAPACITY_CHECK=yes overrides."
    die "insufficient RAM for an all-in-one install"
  }
fi

# ---------------------------------------------------------------------------
# 2. Install the stack
# ---------------------------------------------------------------------------
# The assistant refuses to run while 443 is in use, and the dashboard defaults
# to 443 as well. Free it for the install; the app is down for those minutes.
NGINX_WAS_UP=no
restore_nginx() { [ "$NGINX_WAS_UP" = yes ] && systemctl start nginx 2>/dev/null || true; }
trap 'rc=$?; restore_nginx; [ $rc -ne 0 ] && echo -e "\n\033[0;31m[!] failed (exit $rc) — see /var/log/wazuh-install.log\033[0m" >&2' EXIT

if [ ! -f /etc/wazuh-indexer/opensearch.yml ]; then
  systemctl is-active --quiet nginx && {
    NGINX_WAS_UP=yes
    c "stopping nginx for the install (the app is offline until it finishes)"
    systemctl stop nginx
  }
  mkdir -p "$WORK" && cd "$WORK"
  [ -f wazuh-install.sh ] || { c "downloading the ${WAZUH_VERSION} assistant"; curl -sO "https://packages.wazuh.com/${WAZUH_VERSION}/wazuh-install.sh"; }
  c "running the all-in-one install (several minutes)"
  bash ./wazuh-install.sh -a -i
  restore_nginx
  NGINX_WAS_UP=no
else
  ok "wazuh already installed, skipping the assistant"
fi

# ---------------------------------------------------------------------------
# 3. Dashboard: loopback only, served under $SIEM_PATH
# ---------------------------------------------------------------------------
DASH_CONF=/etc/wazuh-dashboard/opensearch_dashboards.yml
if [ -f "$DASH_CONF" ]; then
  c "binding the dashboard to 127.0.0.1:${DASH_PORT} under ${SIEM_PATH}"
  # OpenSearch Dashboards builds its own redirect and asset URLs. Without
  # basePath it sends the browser to /, where the SPA fallback answers and you
  # get the app instead of a login. rewriteBasePath makes it accept the
  # prefixed paths nginx forwards unchanged.
  set_yml() { # set_yml <key> <value>
    if grep -qE "^#?${1}:" "$DASH_CONF"; then
      sed -i "s|^#\?${1}:.*|${1}: ${2}|" "$DASH_CONF"
    else
      echo "${1}: ${2}" >> "$DASH_CONF"
    fi
  }
  set_yml server.port "${DASH_PORT}"
  set_yml server.host '"127.0.0.1"'
  set_yml server.basePath "\"${SIEM_PATH}\""
  set_yml server.rewriteBasePath true
  systemctl restart wazuh-dashboard
fi

# ---------------------------------------------------------------------------
# 4. nginx location — surgical, the app's config is not regenerated
# ---------------------------------------------------------------------------
c "writing ${SIEM_SNIPPET}"
mkdir -p /etc/nginx/snippets
cat > "$SIEM_SNIPPET" <<EOF
location ${SIEM_PATH} {
    proxy_pass https://127.0.0.1:${DASH_PORT};
    # the dashboard's own certificate is self-signed and this hop is loopback
    proxy_ssl_verify off;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    # dashboard session cookies overflow the default buffer
    proxy_buffer_size 16k;
    proxy_buffers   8 16k;
    proxy_read_timeout 300s;
}
EOF

INCLUDE_LINE="include ${SIEM_SNIPPET};"
if [ -f "$APP_SNIPPET" ]; then
  # Newer layout: both vhosts include one shared snippet, so one line covers
  # every way the site is reached.
  grep -qF "$INCLUDE_LINE" "$APP_SNIPPET" || echo "$INCLUDE_LINE" >> "$APP_SNIPPET"
  ok "included from $APP_SNIPPET"
elif grep -qF "$INCLUDE_LINE" "$SITE"; then
  ok "already included in $SITE"
else
  # Older layout: locations live directly in each server block. Insert at
  # server level, immediately before the /api/ location, in every block.
  cp "$SITE" "${SITE}.bak.$(date +%s)"
  awk -v inc="    $INCLUDE_LINE" '
    /^[[:space:]]*location \/api\/ \{/ { print inc }
    { print }
  ' "${SITE}" > "${SITE}.new" && mv "${SITE}.new" "$SITE"
  ok "inserted into $SITE (backup kept alongside)"
fi

nginx -t || die "nginx config invalid — the backup of $SITE is alongside it"
systemctl reload nginx
ok "nginx reloaded"

# ---------------------------------------------------------------------------
# 5. Feed the app's logs to the manager
# ---------------------------------------------------------------------------
# NOT wazuh-agent: the agent and manager packages both own /var/ossec and
# cannot coexist. On an all-in-one the manager reads local files directly.
OSSEC=/var/ossec/etc/ossec.conf
if [ -f "$OSSEC" ] && ! grep -q "vista-localfiles" "$OSSEC"; then
  c "adding the app, nginx and mongod logs to the manager"
  cp "$OSSEC" "${OSSEC}.bak.$(date +%s)"
  cat >> "$OSSEC" <<EOF

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
  systemctl restart wazuh-manager
fi

# ---------------------------------------------------------------------------
# 6. Firewall — the dashboard is loopback-only, its port stays shut
# ---------------------------------------------------------------------------
if ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw delete allow "${DASH_PORT}/tcp" >/dev/null 2>&1 || true
  echo "    agent ports 1514/1515 left closed — open them only when other"
  echo "    machines need to report in"
fi

# ---------------------------------------------------------------------------
# 7. Record settings so a later provision.sh run keeps /siem
# ---------------------------------------------------------------------------
if [ -f "$CONF" ]; then
  grep -q '^SIEM_PATH=' "$CONF" \
    && sed -i "s|^SIEM_PATH=.*|SIEM_PATH='${SIEM_PATH}'|" "$CONF" \
    || echo "SIEM_PATH='${SIEM_PATH}'" >> "$CONF"
  # Deliberately NOT setting WAZUH_MANAGER: that makes provision.sh install
  # wazuh-agent, which conflicts with the manager package installed here.
  grep -q '^WAZUH_MANAGER=' "$CONF" \
    && sed -i "s|^WAZUH_MANAGER=.*|WAZUH_MANAGER=''|" "$CONF" \
    || true
  ok "recorded SIEM_PATH in $CONF"
fi

trap - EXIT

# ---------------------------------------------------------------------------
# 8. Verify
# ---------------------------------------------------------------------------
echo
c "verifying"
fail=0
for s in wazuh-indexer wazuh-manager wazuh-dashboard nginx; do
  systemctl is-active --quiet "$s" && ok "$s active" || { echo "    $s NOT active"; fail=1; }
done
code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 "https://127.0.0.1${SIEM_PATH}/app/login" || echo 000)
case "$code" in
  200|302) ok "${SIEM_PATH} answers through nginx (HTTP $code)" ;;
  000)     echo "    ${SIEM_PATH} not answering yet — the dashboard takes a minute to warm up"; ;;
  *)       echo "    ${SIEM_PATH} returned HTTP $code"; fail=1 ;;
esac

DOMAIN=$(. "$CONF" 2>/dev/null; echo "${DOMAIN:-<domain>}")
cat <<EOF

  https://${DOMAIN}${SIEM_PATH}
  user: admin
  pass: tar -O -xf ${WORK}/wazuh-install-files.tar wazuh-install-files/wazuh-passwords.txt

Nothing about the application or its database was modified.
EOF
exit $fail
