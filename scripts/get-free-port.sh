#!/usr/bin/env bash
# =============================================================================
# get-free-port.sh — Find a random available TCP port
# =============================================================================
# Checks the system for ports currently in use and finds a random free port
# within the specified range (default: 27017–27999).
#
# Usage:
#   ./get-free-port.sh                          # random port 27017–27999
#   PORT=$(./get-free-port.sh)                  # capture in variable
#   MIN_PORT=10000 MAX_PORT=60000 ./get-free-port.sh  # custom range
# =============================================================================
set -euo pipefail

MIN=${MIN_PORT:-27017}
MAX=${MAX_PORT:-27999}

# Validate range
if [ "$MIN" -lt 1024 ]; then MIN=1024; fi
if [ "$MAX" -gt 65535 ]; then MAX=65535; fi
if [ "$MIN" -ge "$MAX" ]; then
  echo "Error: MIN_PORT ($MIN) must be less than MAX_PORT ($MAX)" >&2
  exit 1
fi

# Collect currently listening TCP ports
if command -v ss &>/dev/null; then
  used_ports=$(ss -tln --no-header 2>/dev/null | awk '{print $4}' | awk -F: '{print $NF}')
elif command -v netstat &>/dev/null; then
  used_ports=$(netstat -tln 2>/dev/null | awk '{print $4}' | awk -F: '{print $NF}')
elif [ -f /proc/net/tcp ]; then
  used_ports=$(awk 'NR>1{print $2}' /proc/net/tcp | awk -F: '{print $2}' | while read -r h; do printf "%d\n" "0x${h}"; done)
else
  echo "Warning: no network detection tool found. Using blind random port." >&2
  used_ports=""
fi

used_ports=$(echo "$used_ports" | sort -u)

# Try random ports (up to 50 attempts)
for _ in $(seq 1 50); do
  port=$(( ( (RANDOM << 15) | RANDOM ) % (MAX - MIN + 1) + MIN ))
  if ! echo "$used_ports" | grep -q -w "$port" 2>/dev/null; then
    echo "$port"
    exit 0
  fi
done

# Fallback: sequential scan
for port in $(seq "$MIN" "$MAX"); do
  if ! echo "$used_ports" | grep -q -w "$port" 2>/dev/null; then
    echo "$port"
    exit 0
  fi
done

echo "Error: no free port found in range $MIN–$MAX" >&2
exit 1
