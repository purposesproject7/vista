#!/usr/bin/env bash
# =============================================================================
# wazuh-server.sh — install the Wazuh SIEM all-in-one on this host
#   sudo ./deploy/wazuh-server.sh
#
# Installs Wazuh manager + indexer + dashboard with the official assistant,
# then moves the dashboard off 443 (nginx owns that for the app) and points
# /etc/vista/deploy.conf at the local manager so provision.sh enrols the agent.
#
# The indexer is OpenSearch on the JVM. It is the heaviest thing on this box
# by a wide margin — heavier than MongoDB and the API combined.
# =============================================================================
set -euo pipefail

WAZUH_VERSION="${WAZUH_VERSION:-4.14}"
DASH_PORT="${DASH_PORT:-8443}"
CONF=/etc/vista/deploy.conf
WORK=/root/wazuh-install

c()  { echo -e "\033[0;36m[*]\033[0m $*"; }
ok() { echo -e "\033[0;32m[+]\033[0m $*"; }
die(){ echo -e "\033[0;31m[!]\033[0m $*" >&2; exit 1; }
trap 'rc=$?; [ $rc -ne 0 ] && echo -e "\n\033[0;31m[!] failed (exit $rc) — see /var/log/wazuh-install.log\033[0m" >&2' EXIT

[ "$(id -u)" = 0 ] || die "run as root"

# ---------------------------------------------------------------------------
# 1. Capacity check — the indexer will OOM the box if it is short on memory
# ---------------------------------------------------------------------------
RAM_GB=$(awk '/MemTotal/ {printf "%.1f", $2/1024/1024}' /proc/meminfo)
CPUS=$(nproc)
FREE_GB=$(df -BG --output=avail / | tail -1 | tr -dc '0-9')

c "this host: ${RAM_GB} GiB RAM, ${CPUS} vCPU, ${FREE_GB} GiB free on /"
echo "    Wazuh's own minimum for 1-25 endpoints is 8 GiB RAM, 4 vCPU, 50 GiB."
echo "    MongoDB, the API and nginx are already running here and are not"
echo "    counted in that figure."

if [ "${SKIP_CAPACITY_CHECK:-no}" != yes ]; then
  awk -v r="$RAM_GB" 'BEGIN{exit !(r < 7.5)}' && {
    echo
    echo "    ${RAM_GB} GiB is below Wazuh's minimum. The indexer allocates a JVM heap"
    echo "    at startup; if it cannot, it fails, and if it can it may starve mongod."
    echo "    Run with SKIP_CAPACITY_CHECK=yes to proceed anyway."
    die "insufficient RAM for an all-in-one install"
  }
fi

command -v mongod >/dev/null && ! systemctl is-active --quiet mongod \
  && echo "    note: mongod is not running"

# ---------------------------------------------------------------------------
# 2. Install
# ---------------------------------------------------------------------------
# The assistant refuses to run when 443 is taken, and the dashboard would
# collide with nginx anyway. Free the port for the duration of the install and
# move the dashboard afterwards.
NGINX_WAS_UP=no
systemctl is-active --quiet nginx && { NGINX_WAS_UP=yes; c "stopping nginx for the install"; systemctl stop nginx; }
restore_nginx() { [ "$NGINX_WAS_UP" = yes ] && systemctl start nginx 2>/dev/null || true; }
trap 'rc=$?; restore_nginx; [ $rc -ne 0 ] && echo -e "\n\033[0;31m[!] failed (exit $rc) — see /var/log/wazuh-install.log\033[0m" >&2' EXIT

mkdir -p "$WORK" && cd "$WORK"
if [ ! -f wazuh-install.sh ]; then
  c "downloading the ${WAZUH_VERSION} install assistant"
  curl -sO "https://packages.wazuh.com/${WAZUH_VERSION}/wazuh-install.sh"
fi

if [ ! -f /etc/wazuh-indexer/opensearch.yml ]; then
  c "running the all-in-one install (this takes several minutes)"
  bash ./wazuh-install.sh -a -i
else
  ok "wazuh already installed, skipping the assistant"
fi

# ---------------------------------------------------------------------------
# 3. Move the dashboard off 443
# ---------------------------------------------------------------------------
DASH_CONF=/etc/wazuh-dashboard/opensearch_dashboards.yml
if [ -f "$DASH_CONF" ]; then
  c "moving the dashboard to port ${DASH_PORT} so nginx keeps 443"
  if grep -q '^server.port:' "$DASH_CONF"; then
    sed -i "s|^server.port:.*|server.port: ${DASH_PORT}|" "$DASH_CONF"
  else
    echo "server.port: ${DASH_PORT}" >> "$DASH_CONF"
  fi
  systemctl restart wazuh-dashboard
fi

restore_nginx
trap - EXIT

# ---------------------------------------------------------------------------
# 4. Firewall
# ---------------------------------------------------------------------------
if ufw status 2>/dev/null | grep -q "Status: active"; then
  c "opening ${DASH_PORT}/tcp for the dashboard"
  ufw allow "${DASH_PORT}/tcp" >/dev/null
  # 1514/1515 are agent traffic and enrolment. Only needed for agents on OTHER
  # hosts; the local agent reaches the manager over loopback.
  echo "    agent ports 1514/1515 left closed — open them only when remote"
  echo "    machines need to report in: ufw allow 1514/tcp && ufw allow 1515/tcp"
fi

# ---------------------------------------------------------------------------
# 5. Point the deploy config at the local manager
# ---------------------------------------------------------------------------
if [ -f "$CONF" ]; then
  if grep -q '^WAZUH_MANAGER=' "$CONF"; then
    sed -i "s|^WAZUH_MANAGER=.*|WAZUH_MANAGER='127.0.0.1'|" "$CONF"
  else
    echo "WAZUH_MANAGER='127.0.0.1'" >> "$CONF"
  fi
  ok "set WAZUH_MANAGER=127.0.0.1 in $CONF"
fi

# ---------------------------------------------------------------------------
# 6. Verify
# ---------------------------------------------------------------------------
echo
c "verifying"
fail=0
for s in wazuh-indexer wazuh-manager wazuh-dashboard; do
  systemctl is-active --quiet "$s" && ok "$s active" || { echo "    $s NOT active"; fail=1; }
done
curl -sk "https://127.0.0.1:${DASH_PORT}" -o /dev/null -w '    dashboard https://127.0.0.1:%{http_code}\n' \
  --max-time 10 2>/dev/null || echo "    dashboard not answering yet (it can take a minute to warm up)"
systemctl is-active --quiet nginx && ok "nginx still running on 443" || { echo "    nginx NOT running"; fail=1; }

cat <<EOF

Dashboard:  https://$(hostname -I | awk '{print $1}'):${DASH_PORT}
Username:   admin
Password:   sudo tar -O -xf ${WORK}/wazuh-install-files.tar wazuh-install-files/wazuh-passwords.txt

The dashboard uses its own self-signed certificate, so the browser will warn.

NEXT — enrol this server as an agent:
  ${APP_DIR:-/opt/vista}/deploy/provision.sh
which installs wazuh-agent against 127.0.0.1 and ships the app, nginx and
mongod logs into the SIEM.
EOF
exit $fail
