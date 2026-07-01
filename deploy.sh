#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Production Deployment Script for Vista
# =============================================================================
# Automates the full deployment pipeline: generate secrets, build, deploy.
#
# Usage:
#   ./deploy.sh                         # interactive deployment
#   ./deploy.sh --quick                 # auto-generate secrets, skip prompts
#   ./deploy.sh --rebuild               # force rebuild all images
#   ./deploy.sh --no-monitoring         # deploy without monitoring stack
#   ./deploy.sh --no-waf                # deploy without WAF service
#   ./deploy.sh --help                  # show this help
#
# Prerequisites:
#   - Docker 20.10+
#   - Docker Compose 2.0+
#   - openssl
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Parse flags
QUICK=false
REBUILD=false
WITH_MONITORING=true
WITH_WAF=true

for arg in "$@"; do
  case "$arg" in
    --quick)          QUICK=true ;;
    --rebuild)        REBUILD=true ;;
    --no-monitoring)  WITH_MONITORING=false ;;
    --no-waf)         WITH_WAF=false ;;
    --help)
      sed -n '3,17p' "$0"
      exit 0
      ;;
    *)
      error "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           Vista — Production Deployment Script             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

for cmd in openssl docker; do
  if ! command -v "$cmd" &>/dev/null; then
    error "'$cmd' is required but not found. Please install it first."
    exit 1
  fi
done

# Verify docker compose plugin
if ! docker compose version &>/dev/null; then
  error "Docker Compose plugin is required. Install it first."
  exit 1
fi

info "All prerequisites satisfied."

# ---------------------------------------------------------------------------
# Generate secrets
# ---------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Step 1: Generating Secrets${NC}"
echo ""

mkdir -p secrets

generate_secret() {
  local name="$1" length="${2:-64}" mode="${3:-base64}"
  local value
  case "$mode" in
    base64) value=$(openssl rand -base64 "$length" | tr -d '\n') ;;
    hex)    value=$(openssl rand -hex "$length" | tr -d '\n') ;;
    *)      value=$(openssl rand -base64 "$length" | tr -d '\n') ;;
  esac
  echo -n "$value" > "secrets/${name}.txt"
  chmod 600 "secrets/${name}.txt"
  echo "$value"
}

# Only generate if files don't exist or --rebuild is set
REGENERATE=false
if [[ "$QUICK" == true || "$REBUILD" == true ]]; then
  REGENERATE=true
elif [[ ! -f secrets/jwt_secret.txt ]]; then
  REGENERATE=true
  info "Secrets directory is empty, generating new secrets..."
fi

if [[ "$REGENERATE" == true ]]; then
  if [[ "$QUICK" == false && "$REBUILD" == false ]]; then
    echo ""
    warn "Existing secrets will be OVERWRITTEN!"
    read -p "  Generate new secrets? [y/N]: " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy] ]]; then
      info "Keeping existing secrets."
      REGENERATE=false
    fi
  fi
fi

if [[ "$REGENERATE" == true ]]; then
  JWT_SECRET=$(generate_secret jwt_secret 64 base64)
  SIGNING_SECRET=$(generate_secret signing_secret 64 hex)
  MONGO_PASS=$(generate_secret mongo_root_password 32 base64)
  ADMIN_PASS=$(generate_secret admin_password 24 base64)
  ADMIN_PASS="${ADMIN_PASS}Aa1!"

  echo -n "$ADMIN_PASS" > secrets/admin_password.txt
  chmod 600 secrets/admin_password.txt

  ok "Secrets generated and written to ./secrets/"
  echo ""
  echo "  JWT Secret .............. written to secrets/jwt_secret.txt"
  echo "  Signing Secret .......... written to secrets/signing_secret.txt"
  echo "  MongoDB Root Password ... written to secrets/mongo_root_password.txt"
  echo "  Admin Password .......... written to secrets/admin_password.txt"
  echo ""
  warn "Store these secrets securely. They will not be shown again."
else
  info "Using existing secrets in ./secrets/"
fi

# ---------------------------------------------------------------------------
# Create .env file if not present
# ---------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Step 2: Environment Configuration${NC}"
echo ""

if [[ ! -f .env ]]; then
  if [[ "$QUICK" == true ]]; then
    cat > .env <<EOF
# Production environment — auto-generated by deploy.sh
MONGO_ROOT_USER=admin
JWT_EXPIRE=1h
ALLOWED_ORIGINS=http://localhost,http://localhost:80
HOST_PORT_HTTP=80
HOST_PORT_HTTPS=443
ADMIN_EMAIL=admin@vit.ac.in
ADMIN_NAME=System Administrator
ADMIN_EMPLOYEE_ID=ADMIN001
ADMIN_SCHOOL=SCOPE
ADMIN_DEPARTMENT=CSE
EOF
    ok ".env file created with defaults (edit for production)."
  else
    # Prompt for key values
    read -p "  MongoDB root username [admin]: " MONGO_ROOT_USER
    MONGO_ROOT_USER="${MONGO_ROOT_USER:-admin}"

    read -p "  JWT token expiry [1h]: " JWT_EXPIRE
    JWT_EXPIRE="${JWT_EXPIRE:-1h}"

    read -p "  CORS allowed origins [http://localhost,http://localhost:80]: " ALLOWED_ORIGINS
    ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost,http://localhost:80}"

    read -p "  Host HTTP port [80]: " HOST_PORT_HTTP
    HOST_PORT_HTTP="${HOST_PORT_HTTP:-80}"

    read -p "  Host HTTPS port [443]: " HOST_PORT_HTTPS
    HOST_PORT_HTTPS="${HOST_PORT_HTTPS:-443}"

    read -p "  Admin email [admin@vit.ac.in]: " ADMIN_EMAIL
    ADMIN_EMAIL="${ADMIN_EMAIL:-admin@vit.ac.in}"

    read -p "  Admin name [System Administrator]: " ADMIN_NAME
    ADMIN_NAME="${ADMIN_NAME:-System Administrator}"

    read -p "  Admin employee ID [ADMIN001]: " ADMIN_EMPLOYEE_ID
    ADMIN_EMPLOYEE_ID="${ADMIN_EMPLOYEE_ID:-ADMIN001}"

    read -p "  Admin school [SCOPE]: " ADMIN_SCHOOL
    ADMIN_SCHOOL="${ADMIN_SCHOOL:-SCOPE}"

    read -p "  Admin department [CSE]: " ADMIN_DEPARTMENT
    ADMIN_DEPARTMENT="${ADMIN_DEPARTMENT:-CSE}"

    read -p "  SMTP email user (leave blank to skip): " EMAIL_USER
    if [[ -n "$EMAIL_USER" ]]; then
      read -s -p "  SMTP email password: " EMAIL_PASS
      echo ""
      read -p "  SMTP from address [Vista System <$EMAIL_USER>]: " EMAIL_FROM
      EMAIL_FROM="${EMAIL_FROM:-Vista System <$EMAIL_USER>}"
    fi

    cat > .env <<EOF
# Production environment — generated by deploy.sh
MONGO_ROOT_USER=${MONGO_ROOT_USER}
JWT_EXPIRE=${JWT_EXPIRE}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
HOST_PORT_HTTP=${HOST_PORT_HTTP}
HOST_PORT_HTTPS=${HOST_PORT_HTTPS}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_NAME=${ADMIN_NAME}
ADMIN_EMPLOYEE_ID=${ADMIN_EMPLOYEE_ID}
ADMIN_SCHOOL=${ADMIN_SCHOOL}
ADMIN_DEPARTMENT=${ADMIN_DEPARTMENT}
EOF

    if [[ -n "${EMAIL_USER:-}" ]]; then
      cat >> .env <<EOF
EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
EMAIL_FROM=${EMAIL_FROM:-Vista System <$EMAIL_USER>}
EOF
    fi

    ok ".env file created."
  fi
else
  info ".env file already exists, using it."
fi

# ---------------------------------------------------------------------------
# Build and deploy
# ---------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Step 3: Building and Deploying${NC}"
echo ""

COMPOSE_FILES="-f docker-compose.yml"

if [[ "$WITH_MONITORING" == false ]]; then
  export WITH_MONITORING=false
  info "Monitoring stack excluded."
fi

if [[ "$WITH_WAF" == false ]]; then
  export WITH_WAF=false
  info "WAF service excluded."
fi

BUILD_FLAG=""
if [[ "$REBUILD" == true ]]; then
  BUILD_FLAG="--build"
  info "Forcing image rebuild."
fi

info "Starting deployment..."
if [[ -n "$BUILD_FLAG" ]]; then
  docker compose $COMPOSE_FILES up -d $BUILD_FLAG
else
  docker compose $COMPOSE_FILES up -d
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete                                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Application:  http://localhost:${HOST_PORT_HTTP:-80}"
echo "  API:          http://localhost:${HOST_PORT_HTTP:-80}/api"
echo "  Health:       http://localhost:${HOST_PORT_HTTP:-80}/health"
echo ""

if [[ "$WITH_MONITORING" == true ]]; then
  echo "  Monitoring:"
  echo "    Prometheus: http://localhost:9090"
  echo "    Grafana:    http://localhost:3001 (admin:admin)"
  echo "    cAdvisor:   http://localhost:8080"
  echo "    Node Exp:   http://localhost:9100"
  echo ""
fi

echo "  Admin login:"
echo "    Email:    ${ADMIN_EMAIL:-admin@vit.ac.in}"
echo "    Password: (see secrets/admin_password.txt)"
echo ""

info "Run 'docker compose logs -f' to follow logs."

# ---------------------------------------------------------------------------
# Verify deployment
# ---------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Step 4: Verification${NC}"
echo ""

sleep 5

if curl -sf http://localhost:${HOST_PORT_HTTP:-80}/health > /dev/null 2>&1; then
  ok "Application health check passed."
else
  warn "Health check pending. Check logs: docker compose logs -f"
fi

echo ""
ok "Deployment finished successfully."
