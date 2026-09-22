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
SIEM_PATH="${SIEM_PATH:-/siem}"
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
# 3. Put the dashboard on loopback behind nginx at $SIEM_PATH
# ---------------------------------------------------------------------------
DASH_CONF=/etc/wazuh-dashboard/opensearch_dashboards.yml
if [ -f "$DASH_CONF" ]; then
  c "binding the dashboard to 127.0.0.1:${DASH_PORT} under ${SIEM_PATH}"
  # OpenSearch Dashboards builds its own redirect and asset URLs. Without
  # basePath it sends the browser back to / and the app's SPA answers instead;
  # rewriteBasePath makes it accept the prefixed paths nginx forwards.
  set_yml() { # set_yml <key> <value>
    if grep -qE "^#?${1}:" "$DASH_CONF"; then
      sed -i "s|^#\?${1}:.*|${1}: ${2}|" "$DASH_CONF"
    else
      echo "${1}: ${2}" >> "$DASH_CONF"
    fi
  }
  set_yml server.port "${DASH_PORT}"
  set_yml server.host "\"127.0.0.1\""
  set_yml server.basePath "\"${SIEM_PATH}\""
  set_yml server.rewriteBasePath true
  systemctl restart wazuh-dashboard
fi

# ---------------------------------------------------------------------------
restore_nginx
trap - EXIT

# ---------------------------------------------------------------------------
# 4. Firewall
# ---------------------------------------------------------------------------
if ufw status 2>/dev/null | grep -q "Status: active"; then
  # The dashboard listens on loopback only and is reached through nginx on
  # 443, so its own port must NOT be open. Remove the rule if a previous run
  # of this script added it.
  ufw delete allow "${DASH_PORT}/tcp" >/dev/null 2>&1 || true
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
  if grep -q '^SIEM_PATH=' "$CONF"; then
    sed -i "s|^SIEM_PATH=.*|SIEM_PATH='${SIEM_PATH}'|" "$CONF"
  else
    echo "SIEM_PATH='${SIEM_PATH}'" >> "$CONF"
  fi
  ok "set WAZUH_MANAGER=127.0.0.1 and SIEM_PATH=${SIEM_PATH} in $CONF"
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

Password:   tar -O -xf ${WORK}/wazuh-install-files.tar wazuh-install-files/wazuh-passwords.txt
Username:   admin

The dashboard is bound to 127.0.0.1:${DASH_PORT} and is NOT reachable directly.

NEXT — publish it at ${SIEM_PATH} and enrol this host as an agent:
  ${APP_DIR:-/opt/vista}/deploy/provision.sh

That run adds the ${SIEM_PATH} location to the nginx site and installs
wazuh-agent against 127.0.0.1, shipping the app, nginx and mongod logs into
the SIEM. Afterwards:

  https://$(. /etc/vista/deploy.conf 2>/dev/null; echo "${DOMAIN:-<domain>}")${SIEM_PATH}
EOF
exit $fail
