#!/usr/bin/env bash
# =============================================================================
# backup-mongodb.sh — Backup and restore MongoDB databases
# =============================================================================
# Uses docker exec to run mongodump/mongorestore inside the MongoDB container.
# The WAF edge proxy (vista-waf) is stopped before backup to prevent data
# changes during the dump, and restarted afterward.
# Backups are stored on the host in $PROJECT_DIR/backups/mongodb/ with
# timestamp-based naming (YYYYMMDD_HHMMSS).
#
# Usage:
#   ./backup-mongodb.sh backup              # create a new backup
#   ./backup-mongodb.sh list                # list available backups
#   ./backup-mongodb.sh restore 20260701    # restore from date prefix
#   ./backup-mongodb.sh restore-latest      # restore most recent backup
#   ./backup-mongodb.sh cron                # non-interactive cron run
#
# Cron setup (add to crontab -e):
#   0 2 * * * /path/to/scripts/backup-mongodb.sh cron
#
# Retention (cron mode):
#   KEEP_DAILY=7   # number of daily backups to retain
#   KEEP_WEEKLY=4  # number of weekly backups to retain
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_DIR}/backups/mongodb"
CONTAINER="vista-mongodb"
MONGO_USER="${MONGO_ROOT_USER:-admin}"
MONGO_AUTH_DB="admin"
LOG_FILE="${PROJECT_DIR}/backups/mongodb-backup.log"

KEEP_DAILY=${KEEP_DAILY:-90}
KEEP_WEEKLY=${KEEP_WEEKLY:-4}

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

log() {
  local level="$1" msg="$2"
  echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') [$level] $msg" >> "$LOG_FILE"
}

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
ensure_container() {
  if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
    error "Container '$CONTAINER' not found. Is it running?"
    log "ERROR" "Container '$CONTAINER' not found"
    exit 1
  fi
  if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER")" != "true" ]; then
    error "Container '$CONTAINER' is not running."
    log "ERROR" "Container '$CONTAINER' not running"
    exit 1
  fi
}

get_password() {
  if [ -f "${PROJECT_DIR}/secrets/mongo_root_password.txt" ]; then
    cat "${PROJECT_DIR}/secrets/mongo_root_password.txt"
  else
    error "Secret file not found: secrets/mongo_root_password.txt"
    log "ERROR" "Secret file not found"
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

WAF_CONTAINER="vista-waf"

ng_stop() {
  if docker inspect "$WAF_CONTAINER" >/dev/null 2>&1 && [ "$(docker inspect -f '{{.State.Running}}' "$WAF_CONTAINER")" = "true" ]; then
    info "Stopping WAF (${WAF_CONTAINER}) to prevent data changes during backup..."
    docker stop "$WAF_CONTAINER" >/dev/null
    ok "WAF stopped"
    log "INFO" "WAF stopped for backup"
  fi
}

ng_start() {
  if docker inspect "$WAF_CONTAINER" >/dev/null 2>&1 && [ "$(docker inspect -f '{{.State.Status}}' "$WAF_CONTAINER")" = "exited" ]; then
    info "Starting WAF (${WAF_CONTAINER}) after backup..."
    docker start "$WAF_CONTAINER" >/dev/null
    ok "WAF started"
    log "INFO" "WAF started after backup"
  fi
}

cmd_backup() {
  ensure_container
  local password; password=$(get_password)
  mkdir -p "$BACKUP_DIR"

  local timestamp
  timestamp=$(date -u '+%Y%m%d_%H%M%S')
  local container_path="/tmp/backup_${timestamp}"
  local host_path="${BACKUP_DIR}/${timestamp}"

  info "Starting backup: ${timestamp}"

  ng_stop

  # Run mongodump inside container
  docker exec "$CONTAINER" mongodump \
    --username "$MONGO_USER" \
    --password "$password" \
    --authenticationDatabase "$MONGO_AUTH_DB" \
    --out "$container_path" \
    --quiet

  # Copy backup to host
  docker cp "${CONTAINER}:${container_path}" "$host_path" >/dev/null

  # Cleanup inside container
  docker exec "$CONTAINER" rm -rf "$container_path"

  ng_start

  local size
  size=$(du -sh "$host_path" 2>/dev/null | awk '{print $1}' || echo "unknown")

  ok "Backup saved: ${host_path} (${size})"
  log "INFO" "Backup: ${timestamp} (${size})"
}

cmd_list() {
  if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR")" ]; then
    info "No backups found in ${BACKUP_DIR}"
    return
  fi

  echo ""
  echo -e "${CYAN}Available backups:${NC}"
  echo "──────────────────────────────────────────────────"
  printf "%-20s %12s %s\n" "DATE" "SIZE" "PATH"
  echo "──────────────────────────────────────────────────"

  for dir in "$BACKUP_DIR"/*/; do
    [ -d "$dir" ] || continue
    local name; name=$(basename "$dir")
    local size; size=$(du -sh "$dir" 2>/dev/null | awk '{print $1}' || echo "?")
    local date_display
    if [[ "$name" =~ ^([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{2})([0-9]{2})([0-9]{2})$ ]]; then
      date_display="${BASH_REMATCH[1]}-${BASH_REMATCH[2]}-${BASH_REMATCH[3]} ${BASH_REMATCH[4]}:${BASH_REMATCH[5]}:${BASH_REMATCH[6]}"
    else
      date_display="$name"
    fi
    printf "%-20s %12s %s\n" "$date_display" "$size" "$name"
  done

  local total_count; total_count=$(find "$BACKUP_DIR" -maxdepth 1 -type d | wc -l)
  total_count=$((total_count - 1))
  local total_size; total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}' || echo "?")
  echo "──────────────────────────────────────────────────"
  echo "  ${total_count} backup(s), total ${total_size}"
  echo ""
}

cmd_restore() {
  ensure_container
  local target="$1"
  local password; password=$(get_password)
  local restore_source

  if [ -d "$BACKUP_DIR/$target" ]; then
    restore_source="$BACKUP_DIR/$target"
  else
    restore_source=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "${target}*" | sort | tail -1)
  fi

  if [ -z "$restore_source" ] || [ ! -d "$restore_source" ]; then
    error "No backup found matching: ${target}"
    log "ERROR" "Restore target not found: ${target}"
    cmd_list
    exit 1
  fi

  local backup_name; backup_name=$(basename "$restore_source")
  warn "About to restore backup: ${backup_name}"
  warn "This will REPLACE all existing data in MongoDB!"

  if [ "${CRON_MODE:-false}" != "true" ]; then
    read -p "  Continue? [y/N]: " confirm
    if [[ ! "$confirm" =~ ^[Yy] ]]; then
      info "Restore cancelled."
      exit 0
    fi
  fi

  info "Restoring from: ${backup_name}"

  # Copy backup to container
  local container_path="/tmp/restore_${backup_name}"
  docker cp "$restore_source" "${CONTAINER}:${container_path}" >/dev/null

  # Run mongorestore inside container
  docker exec "$CONTAINER" mongorestore \
    --username "$MONGO_USER" \
    --password "$password" \
    --authenticationDatabase "$MONGO_AUTH_DB" \
    --drop \
    "$container_path" \
    --quiet

  # Cleanup inside container
  docker exec "$CONTAINER" rm -rf "$container_path"

  ok "Restore completed: ${backup_name}"
  log "INFO" "Restore: ${backup_name}"
}

cmd_restore_latest() {
  local latest
  latest=$(find "$BACKUP_DIR" -maxdepth 1 -type d | sort | tail -1)
  if [ -z "$latest" ] || [ "$latest" = "$BACKUP_DIR" ]; then
    error "No backups found to restore."
    exit 1
  fi
  cmd_restore "$(basename "$latest")"
}

# ---------------------------------------------------------------------------
# Retention (cron mode)
# ---------------------------------------------------------------------------
run_retention() {
  info "Running retention policy: keep ${KEEP_DAILY} daily + ${KEEP_WEEKLY} weekly"

  # Remove backups older than KEEP_DAILY days (except weekly)
  while IFS= read -r dir; do
    [ -z "$dir" ] && continue
    local name; name=$(basename "$dir")
    local ts="${name%%_*}"
    [ ${#ts} -ne 8 ] && continue
    local cutoff
    cutoff=$(date -u -d "${KEEP_DAILY} days ago" '+%Y%m%d' 2>/dev/null || date -u -v-${KEEP_DAILY}d '+%Y%m%d' 2>/dev/null || echo "")
    [ -z "$cutoff" ] && { warn "Cannot compute retention date. Skipping."; break; }
    if [ "$ts" -lt "$cutoff" ]; then
      # Check if this backup falls on a weekly boundary (Sunday)
      local dow
      dow=$(date -u -d "${ts}" '+%u' 2>/dev/null || date -u -j -f '%Y%m%d' "$ts" '+%u' 2>/dev/null || echo "")
      if [ "$dow" = "7" ]; then
        # Keep weekly backups up to KEEP_WEEKLY count
        continue
      fi
      rm -rf "$dir"
      log "INFO" "Retention: removed ${name}"
    fi
  done < <(find "$BACKUP_DIR" -maxdepth 1 -type d | sort)

  # Keep only KEEP_WEEKLY most recent Sunday backups
  local sunday_count=0
  while IFS= read -r dir; do
    [ -z "$dir" ] && continue
    sunday_count=$((sunday_count + 1))
    if [ "$sunday_count" -gt "$KEEP_WEEKLY" ]; then
      rm -rf "$dir"
      log "INFO" "Retention: removed weekly backup $(basename "$dir")"
    fi
  done < <(find "$BACKUP_DIR" -maxdepth 1 -type d | while read -r d; do
    local name; name=$(basename "$d")
    local ts="${name%%_*}"
    [ ${#ts} -ne 8 ] && continue
    local dow
    dow=$(date -u -d "${ts}" '+%u' 2>/dev/null || date -u -j -f '%Y%m%d' "$ts" '+%u' 2>/dev/null || echo "")
    [ "$dow" = "7" ] && echo "$d"
  done | sort -r)
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
usage() {
  sed -n '3,18p' "$0"
  exit 1
}

mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"

case "${1:-}" in
  backup)
    cmd_backup
    ;;
  list)
    cmd_list
    ;;
  restore)
    [ -z "${2:-}" ] && { error "Usage: $0 restore <date-pattern>"; cmd_list; exit 1; }
    cmd_restore "$2"
    ;;
  restore-latest)
    cmd_restore_latest
    ;;
  cron)
    CRON_MODE=true
    info "Cron backup started"
    log "INFO" "Cron backup started"
    cmd_backup
    run_retention
    ok "Cron backup completed"
    log "INFO" "Cron backup completed"
    ;;
  *)
    usage
    ;;
esac
