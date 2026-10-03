#!/usr/bin/env bash
# =============================================================================
# docker-cleanup.sh — Maintenance script for Docker environment
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

case "${1:-}" in
  logs)
    echo -e "${YELLOW}Pruning all unused logs...${NC}"
    docker system df
    echo ""
    # Truncate all container logs
    logs=$(find /var/lib/docker/containers/ -name '*-json.log' 2>/dev/null || true)
    if [[ -n "$logs" ]]; then
      truncate -s 0 $logs 2>/dev/null || true
      echo -e "${GREEN}Logs truncated.${NC}"
    fi
    ;;
  volumes)
    echo -e "${YELLOW}Removing dangling volumes...${NC}"
    docker volume prune -f
    ;;
  images)
    echo -e "${YELLOW}Removing dangling images...${NC}"
    docker image prune -f
    ;;
  all)
    echo -e "${YELLOW}Full cleanup...${NC}"
    docker system prune -af --volumes
    ;;
  df)
    docker system df
    ;;
  stats)
    docker stats --no-stream
    ;;
  *)
    echo "Usage: $0 {logs|volumes|images|all|df|stats}"
    echo ""
    echo "  logs     Prune container logs"
    echo "  volumes  Remove unused Docker volumes"
    echo "  images   Remove unused Docker images"
    echo "  all      Full Docker system prune (WARNING: deletes everything unused)"
    echo "  df       Show Docker disk usage"
    echo "  stats    Show container resource usage"
    exit 1
    ;;
esac
