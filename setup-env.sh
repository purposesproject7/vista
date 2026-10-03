#!/usr/bin/env bash
# =============================================================================
# setup-env.sh — Interactive environment setup for Docker deployment
# =============================================================================
# This script:
#   1. Generates cryptographically strong secrets
#   2. Prompts for environment-specific values
#   3. Writes a complete .env file for docker-compose
#   4. Optionally runs docker-compose up
#
# Usage:
#   ./setup-env.sh                          # interactive mode
#   ./setup-env.sh --non-interactive        # auto-generate everything
# =============================================================================
set -euo pipefail

SCRIPT_ARGS=("$@")

# --- Docker & Docker Compose installation ------------------------------------
ensure_docker() {
  if ! command -v docker &>/dev/null; then
    warn "Docker not found."
    read -p "  Install Docker now? [Y/n]: " INSTALL_DOCKER
    INSTALL_DOCKER="${INSTALL_DOCKER:-Y}"
    if [[ "$INSTALL_DOCKER" =~ ^[Yy] ]]; then
      info "Installing Docker via get.docker.com..."
      curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
      sh /tmp/get-docker.sh
      if ! command -v docker &>/dev/null; then
        error "Docker installation failed. Install manually: https://docs.docker.com/engine/install/"
        exit 1
      fi
      ok "Docker installed."
    else
      error "Docker is required. Install it first: https://docs.docker.com/engine/install/"
      exit 1
    fi
  fi

  if ! docker info &>/dev/null; then
    if [[ "$(id -u)" -eq 0 ]]; then
      error "Docker daemon is not running. Start it with: systemctl start docker"
      exit 1
    else
      warn "Cannot access Docker socket (permission denied)."
      warn "Options:"
      warn "  1. Run this script with sudo: sudo $0"
      warn "  2. Add your user to the docker group and re-login:"
      warn "     sudo usermod -aG docker \$USER && newgrp docker"
      warn "  3. Start Docker if not running: sudo systemctl start docker"
      read -p "  Try with sudo now? [Y/n]: " TRY_SUDO
      TRY_SUDO="${TRY_SUDO:-Y}"
      if [[ "$TRY_SUDO" =~ ^[Yy] ]]; then
        exec sudo "$0" "${SCRIPT_ARGS[@]}"
      fi
      exit 1
    fi
  fi

  if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
    warn "Docker Compose not found."
    read -p "  Install Docker Compose now? [Y/n]: " INSTALL_DC
    INSTALL_DC="${INSTALL_DC:-Y}"
    if [[ "$INSTALL_DC" =~ ^[Yy] ]]; then
      info "Installing Docker Compose plugin..."
      mkdir -p /usr/local/lib/docker/cli-plugins
      COMPOSE_VERSION=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | cut -d '"' -f 4)
      curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
      chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
      if docker compose version &>/dev/null; then
        ok "Docker Compose installed."
      else
        error "Docker Compose installation failed. Install manually."
        exit 1
      fi
    else
      error "Docker Compose is required. Install it first."
      exit 1
    fi
  fi
}

# --- helpers ----------------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# --- prereqs ----------------------------------------------------------------
for cmd in openssl; do
  if ! command -v "$cmd" &>/dev/null; then
    error "'$cmd' is required but not found. Please install it first."
    exit 1
  fi
done

ensure_docker

# --- source secret generator ------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRETS_SCRIPT="${SCRIPT_DIR}/generate-secrets.sh"

if [[ ! -f "$SECRETS_SCRIPT" ]]; then
  error "generate-secrets.sh not found alongside this script."
  exit 1
fi

# shellcheck source=./generate-secrets.sh
source "$SECRETS_SCRIPT"

INTERACTIVE=true
if [[ "${1:-}" == "--non-interactive" ]]; then
  INTERACTIVE=false
fi

# --- banner -----------------------------------------------------------------
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║             Vista — Docker Environment Setup               ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# --- prompt helper ---------------------------------------------------------
prompt() {
  local var_name="$1" default_val="$2" prompt_text="$3" is_secret="${4:-false}"
  local user_input
  if [[ "$INTERACTIVE" == false ]]; then
    printf -v "$var_name" "%s" "$default_val"
    return
  fi
  while true; do
    if [[ "$is_secret" == true ]]; then
      read -s -p "  ${prompt_text} [default: hidden]: " user_input
      echo ""
    else
      read -p "  ${prompt_text} [${default_val}]: " user_input
    fi
    user_input="${user_input:-$default_val}"
    if [[ -z "$user_input" ]]; then
      warn "Value cannot be empty."
    else
      break
    fi
  done
  printf -v "$var_name" "%s" "$user_input"
}

# --- gather configuration ---------------------------------------------------
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Basic Configuration${NC}"
echo ""

prompt MONGO_ROOT_USER "admin" "MongoDB root username"
prompt MONGO_ROOT_PASSWORD "${GENERATED_MONGO_ROOT_PASSWORD}" "MongoDB root password" true
prompt JWT_SECRET "${GENERATED_JWT_SECRET}" "JWT signing secret" true
prompt JWT_EXPIRE "${GENERATED_JWT_EXPIRE}" "JWT token expiry (e.g. 1h, 24h, 7d)"
prompt SIGNING_SECRET "${GENERATED_SIGNING_SECRET}" "Internal signing secret (HMAC)" true
prompt ALLOWED_ORIGINS "http://localhost,http://localhost:80" "CORS allowed origins (comma-separated)"
prompt NODE_ENV "production" "Node environment (production/development)"

# Host ports
echo ""
echo -e "  ${YELLOW}Host Ports (change if ports are in use)${NC}"
echo ""
DEFAULT_HTTP=80
DEFAULT_HTTPS=443
# Use the generated random ports from generate-secrets.sh if available
if [[ -n "${GENERATED_HTTP_PORT:-}" ]]; then
  DEFAULT_HTTP="$GENERATED_HTTP_PORT"
fi
if [[ -n "${GENERATED_HTTPS_PORT:-}" ]]; then
  DEFAULT_HTTPS="$GENERATED_HTTPS_PORT"
fi

prompt HOST_PORT_HTTP "${HOST_PORT_HTTP:-$DEFAULT_HTTP}" "Host port for HTTP"
prompt HOST_PORT_HTTPS "${HOST_PORT_HTTPS:-$DEFAULT_HTTPS}" "Host port for HTTPS"

# Email
echo ""
echo -e "  ${YELLOW}Email Configuration (for password reset, notifications)${NC}"
echo ""
prompt EMAIL_USER "" "SMTP email username (leave blank to skip)"
if [[ -n "$EMAIL_USER" ]]; then
  prompt EMAIL_PASS "" "SMTP email app password" true
  prompt EMAIL_FROM "Vista System <${EMAIL_USER}>" "Email from address"
fi

# Admin
echo ""
echo -e "  ${YELLOW}Initial Admin Account${NC}"
echo ""
prompt ADMIN_EMAIL "admin@vit.ac.in" "Admin email address"
prompt ADMIN_PASSWORD "${GENERATED_ADMIN_PASSWORD}" "Admin password" true
prompt ADMIN_NAME "System Administrator" "Admin display name"
prompt ADMIN_EMPLOYEE_ID "ADMIN001" "Admin employee ID"
prompt ADMIN_SCHOOL "SCOPE" "Admin school code"
prompt ADMIN_DEPARTMENT "CSE" "Admin department"

# --- write .env -------------------------------------------------------------
ENV_FILE="${SCRIPT_DIR}/.env"
cat > "$ENV_FILE" <<ENVEOF
# =============================================================================
# Vista Environment Configuration
# Auto-generated by setup-env.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ⚠  This file contains secrets. Never commit it to version control.
# =============================================================================

# --- MongoDB ----------------------------------------------------------------
MONGO_ROOT_USER=${MONGO_ROOT_USER}
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}

# --- Server -----------------------------------------------------------------
PORT=5000
HOST=0.0.0.0
NODE_ENV=${NODE_ENV}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=${JWT_EXPIRE}
SIGNING_SECRET=${SIGNING_SECRET}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

# --- Host Ports (WAF / Nginx) -----------------------------------------------
HOST_PORT_HTTP=${HOST_PORT_HTTP}
HOST_PORT_HTTPS=${HOST_PORT_HTTPS}

# --- Email ------------------------------------------------------------------
EMAIL_USER=${EMAIL_USER}
ENVEOF

if [[ -n "${EMAIL_USER:-}" ]]; then
  cat >> "$ENV_FILE" <<ENVEOF
EMAIL_PASS=${EMAIL_PASS}
EMAIL_FROM=${EMAIL_FROM}
ENVEOF
fi

# shellcheck disable=SC2129
cat >> "$ENV_FILE" <<ENVEOF

# --- Admin ------------------------------------------------------------------
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=${ADMIN_NAME}
ADMIN_EMPLOYEE_ID=${ADMIN_EMPLOYEE_ID}
ADMIN_SCHOOL=${ADMIN_SCHOOL}
ADMIN_DEPARTMENT=${ADMIN_DEPARTMENT}
ENVEOF

ok ".env file written to ${ENV_FILE}"

# --- summary ----------------------------------------------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete                                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Application will be available at:"
echo "    http://localhost:${HOST_PORT_HTTP}"
echo "    https://localhost:${HOST_PORT_HTTPS}  (if TLS configured)"
echo ""
echo "  Admin login:"
echo "    Email:    ${ADMIN_EMAIL}"
echo "    Password: (see .env ADMIN_PASSWORD)"
echo ""
echo "  Secrets are stored in: ${ENV_FILE}"
echo "  Keep this file safe and never commit it."
echo ""

# --- optional deploy --------------------------------------------------------
if [[ "$INTERACTIVE" == true ]]; then
  read -p "  Start deployment with Docker Compose now? [Y/n]: " DEPLOY_NOW
  DEPLOY_NOW="${DEPLOY_NOW:-Y}"
  if [[ "$DEPLOY_NOW" =~ ^[Yy] ]]; then
    echo ""
    info "Starting docker-compose..."
    cd "$SCRIPT_DIR"
    RUN_ADMIN_SETUP=true docker compose up -d --build
    ok "Deployment started. Run 'docker compose logs -f' to follow."
  fi
fi
