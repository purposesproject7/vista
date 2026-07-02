#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Production Deployment for Vista
# =============================================================================
# Interactive script that:
#   1. Prompts for domain/IP, HTTPS/SSL, and multi-service
#   2. Generates secrets, config files, and .env
#   3. Builds and deploys everything with docker compose
#
# Usage:
#   ./deploy.sh                    # interactive (recommended)
#   ./deploy.sh --quick            # skip prompts, auto-detect
#   ./deploy.sh --help             # show help
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_ARGS=("$@")
cd "$SCRIPT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

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

QUICK=false
[[ "${1:-}" == "--quick" ]] && QUICK=true
[[ "${1:-}" == "--help" ]] && { sed -n '3,12p' "$0"; exit 0; }

# =============================================================================
# Preflight
# =============================================================================
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           Vista — Production Deployment                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

for cmd in openssl; do
  if ! command -v "$cmd" &>/dev/null; then
    error "'$cmd' is required but not found."
    exit 1
  fi
done

ensure_docker

# =============================================================================
# User input
# =============================================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Configuration${NC}"
echo ""

# --- Domain / IP -----------------------------------------------------------
DEFAULT_DOMAIN=$(ip route get 1 2>/dev/null | awk '{print $NF; exit}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
DOMAIN=""
if [[ "$QUICK" == true ]]; then
  DOMAIN="$DEFAULT_DOMAIN"
else
  read -p "  Server domain or IP [${DEFAULT_DOMAIN}]: " DOMAIN
  DOMAIN="${DOMAIN:-$DEFAULT_DOMAIN}"
fi
ok "Domain: ${DOMAIN}"

# --- Host HTTP port --------------------------------------------------------
if [[ "$QUICK" == true ]]; then
  HOST_PORT_HTTP=""
else
  read -p "  Host HTTP port [80]: " HOST_PORT_HTTP
  HOST_PORT_HTTP="${HOST_PORT_HTTP:-80}"
fi
if [[ "$HOST_PORT_HTTP" != "80" ]]; then
  ok "Using alternate port: ${HOST_PORT_HTTP}"
fi

# --- HTTPS / SSL -----------------------------------------------------------
HTTPS=false
SSL_CERT=""
SSL_KEY=""
if [[ "$QUICK" == false ]]; then
  read -p "  Enable HTTPS? (requires SSL certificate) [y/N]: " HTTPS_ANS
  if [[ "$HTTPS_ANS" =~ ^[Yy] ]]; then
    HTTPS=true
    while true; do
      read -p "  SSL certificate path: " SSL_CERT
      [[ -n "$SSL_CERT" ]] && break
    done
    while true; do
      read -p "  SSL certificate key path: " SSL_KEY
      [[ -n "$SSL_KEY" ]] && break
    done
    if [[ ! -f "$SSL_CERT" ]]; then
      error "Certificate not found: $SSL_CERT"
      exit 1
    fi
    if [[ ! -f "$SSL_KEY" ]]; then
      error "Key not found: $SSL_KEY"
      exit 1
    fi
    # Resolve to absolute paths for Docker bind mount
    SSL_CERT=$(realpath "$SSL_CERT")
    SSL_KEY=$(realpath "$SSL_KEY")
    ok "SSL enabled"
  fi
else
  # In quick mode, try to detect existing certs
  for cert_dir in /etc/nginx/ssl /etc/letsencrypt/live/$DOMAIN /etc/ssl; do
    cert="${cert_dir}/fullchain.pem"
    key="${cert_dir}/privkey.pem"
    [[ -f "$cert" && -f "$key" ]] && { SSL_CERT="$cert"; SSL_KEY="$key"; HTTPS=true; break; }
  done
fi

# --- Multi-service ---------------------------------------------------------
MULTI=false
if [[ "$QUICK" == false ]]; then
  read -p "  Deploy multi-service? (separate DB for /multi/ routing) [y/N]: " MULTI_ANS
  [[ "$MULTI_ANS" =~ ^[Yy] ]] && MULTI=true
fi
if [[ "$MULTI" == true ]]; then
  ok "Multi-service enabled (separate MongoDB + backend)"
else
  info "Multi-service disabled"
fi

# --- Prompts for env values ------------------------------------------------
read -p "  MongoDB root username [admin]: " MONGO_ROOT_USER
MONGO_ROOT_USER="${MONGO_ROOT_USER:-admin}"

read -p "  JWT token expiry [1h]: " JWT_EXPIRE
JWT_EXPIRE="${JWT_EXPIRE:-1h}"

read -p "  CORS allowed origins [http://${DOMAIN}]: " ALLOWED_ORIGINS
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://${DOMAIN}}"

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

# =============================================================================
# Generate secrets
# =============================================================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Generating secrets${NC}"
echo ""

mkdir -p secrets

generate_secret() {
  local name="$1" length="${2:-64}" mode="${3:-base64}"
  local value
  case "$mode" in
    base64) value=$(openssl rand -base64 "$length" | tr -d '\n') ;;
    hex)    value=$(openssl rand -hex "$length" | tr -d '\n') ;;
  esac
  echo -n "$value" > "secrets/${name}.txt"
  chmod 600 "secrets/${name}.txt"
  echo "$value"
}

generate_secret jwt_secret 64 base64 > /dev/null
generate_secret signing_secret 64 hex > /dev/null
generate_secret mongo_root_password 32 base64 > /dev/null
ADMIN_PASS=$(generate_secret admin_password 24 base64)${RANDOM}Aa1!
echo -n "$ADMIN_PASS" > secrets/admin_password.txt
chmod 600 secrets/admin_password.txt

# Ensure secrets are readable by Docker (running as root)
chown -R root:root secrets 2>/dev/null || true

ok "Secrets written to ./secrets/"

# =============================================================================
# Generate random MongoDB host port
# =============================================================================
MONGO_HOST_PORT=""
if [[ -x scripts/get-free-port.sh ]]; then
  MONGO_HOST_PORT=$(scripts/get-free-port.sh 2>/dev/null || echo "27017")
else
  MONGO_HOST_PORT="27017"
fi
ok "MongoDB host port: ${MONGO_HOST_PORT}"

# =============================================================================
# Generate .env
# =============================================================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Writing .env${NC}"
echo ""

cat > .env <<ENVEOF
# Generated by deploy.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ⚠ This file contains deployment-specific values. Never commit it.
DOMAIN=${DOMAIN}
HOST_PORT_HTTP=${HOST_PORT_HTTP:-80}
MONGO_ROOT_USER=${MONGO_ROOT_USER}
MONGO_HOST_PORT=${MONGO_HOST_PORT}
JWT_EXPIRE=${JWT_EXPIRE}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_NAME=${ADMIN_NAME}
ADMIN_EMPLOYEE_ID=${ADMIN_EMPLOYEE_ID}
ADMIN_SCHOOL=${ADMIN_SCHOOL}
ADMIN_DEPARTMENT=${ADMIN_DEPARTMENT}
ENVEOF

if [[ -n "${EMAIL_USER:-}" ]]; then
  cat >> .env <<ENVEOF
EMAIL_USER=${EMAIL_USER}
EMAIL_PASS=${EMAIL_PASS}
EMAIL_FROM=${EMAIL_FROM}
ENVEOF
fi

ok ".env written"

# =============================================================================
# Generate nginx/nginx.conf  (internal reverse proxy)
# =============================================================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Generating nginx configs${NC}"
echo ""

cat > nginx/nginx.conf <<NGINXEOF
# Generated by deploy.sh — do not edit manually
upstream backend {
    server vista-server:5000;
}

upstream frontend {
    server vista-client:80;
}

server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
NGINXEOF

if [[ "$MULTI" == true ]]; then
  cat >> nginx/nginx.conf <<NGINXEOF

    location /multi/ {
        proxy_pass http://multi-server:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
NGINXEOF
fi

cat >> nginx/nginx.conf <<NGINXEOF

    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 120s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://backend/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
NGINXEOF

ok "nginx/nginx.conf generated"

# =============================================================================
# Generate waf/nginx.conf  (ModSecurity edge proxy)
# =============================================================================
# Generate WAF config (full generation for both HTTP and HTTPS)
if [[ "$HTTPS" == true ]]; then
  cat > waf/nginx.conf <<WAFEOF
# Generated by deploy.sh — do not edit manually
load_module modules/ngx_http_modsecurity_module.so;

worker_processes auto;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    log_format waf '\$remote_addr - \$remote_user [\$time_local] '
                   '"\$request" \$status \$body_bytes_sent '
                   '"\$http_referer" "\$http_user_agent" '
                   'WAF:\$upstream_http_x_waf_action';

    access_log /var/log/nginx/access.log waf;
    error_log  /var/log/nginx/error.log warn;

    limit_req_zone \$binary_remote_addr zone=waf_login:10m rate=5r/m;
    limit_req_zone \$binary_remote_addr zone=waf_api:10m rate=100r/m;
    limit_req_zone \$binary_remote_addr zone=waf_static:10m rate=500r/m;

    upstream app {
        server vista-nginx:80 max_fails=3 fail_timeout=10s;
    }

    # HTTP → HTTPS redirect
    server {
        listen 80 default_server;
        server_name ${DOMAIN};
        return 301 https://\$host\$request_uri;
    }

    # HTTPS server with WAF
    server {
        listen 443 ssl http2 default_server;
        server_name ${DOMAIN};

        ssl_certificate     /etc/nginx/ssl/server.crt;
        ssl_certificate_key /etc/nginx/ssl/server.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        modsecurity on;
        modsecurity_rules_file /etc/nginx/modsecurity-rules.conf;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header X-WAF-Action "passed" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location /api/ {
            limit_req zone=waf_api burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection '';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_connect_timeout 120s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        location ~ ^/api/auth/(login|register|setup-password|reset-password) {
            limit_req zone=waf_login burst=5 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location /health {
            access_log off;
            proxy_pass http://app/health;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
        }

        location / {
            limit_req zone=waf_static burst=100 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
        }

        location ~ /\.(git|env|svn|htaccess|htpasswd) { deny all; access_log off; return 404; }
        location ~ /(node_modules|vendor|bin|scripts)   { deny all; access_log off; return 404; }
        location ~* (cmd|shell|exec|eval|system|passthru|wp-config) { deny all; return 403; }

        error_page 502 503 504 /50x.html;
        location = /50x.html { root /usr/share/nginx/html; internal; }

        error_page 429 @rate_limited;
        location @rate_limited {
            default_type application/json;
            return 429 '{"success":false,"message":"Too many requests. Please slow down."}';
        }
    }
}
WAFEOF
  ok "waf/nginx.conf generated (HTTPS mode)"
else
  cat > waf/nginx.conf <<WAFEOF
# Generated by deploy.sh — do not edit manually
load_module modules/ngx_http_modsecurity_module.so;

worker_processes auto;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    log_format waf '\$remote_addr - \$remote_user [\$time_local] '
                   '"\$request" \$status \$body_bytes_sent '
                   '"\$http_referer" "\$http_user_agent" '
                   'WAF:\$upstream_http_x_waf_action';

    access_log /var/log/nginx/access.log waf;
    error_log  /var/log/nginx/error.log warn;

    limit_req_zone \$binary_remote_addr zone=waf_login:10m rate=5r/m;
    limit_req_zone \$binary_remote_addr zone=waf_api:10m rate=100r/m;
    limit_req_zone \$binary_remote_addr zone=waf_static:10m rate=500r/m;

    upstream app {
        server vista-nginx:80 max_fails=3 fail_timeout=10s;
    }

    server {
        listen 80 default_server;
        server_name ${DOMAIN};

        modsecurity on;
        modsecurity_rules_file /etc/nginx/modsecurity-rules.conf;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header X-WAF-Action "passed" always;

        location /api/ {
            limit_req zone=waf_api burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection '';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_connect_timeout 120s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        location ~ ^/api/auth/(login|register|setup-password|reset-password) {
            limit_req zone=waf_login burst=5 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location /health {
            access_log off;
            proxy_pass http://app/health;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
        }

        location / {
            limit_req zone=waf_static burst=100 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
        }

        location ~ /\.(git|env|svn|htaccess|htpasswd) { deny all; access_log off; return 404; }
        location ~ /(node_modules|vendor|bin|scripts)   { deny all; access_log off; return 404; }
        location ~* (cmd|shell|exec|eval|system|passthru|wp-config) { deny all; return 403; }

        error_page 502 503 504 /50x.html;
        location = /50x.html { root /usr/share/nginx/html; internal; }

        error_page 429 @rate_limited;
        location @rate_limited {
            default_type application/json;
            return 429 '{"success":false,"message":"Too many requests. Please slow down."}';
        }
    }
}
WAFEOF
  ok "waf/nginx.conf generated (HTTP mode)"
fi

# =============================================================================
# Generate SSL override file (if HTTPS)
# =============================================================================
COMPOSE_FILES="-f docker-compose.yml"

if [[ "$HTTPS" == true ]]; then
  cat > docker-compose.ssl.yml <<SSLEOF
# Generated by deploy.sh — SSL certificate bind mounts
version: '3.8'
services:
  waf:
    volumes:
      - ${SSL_CERT}:/etc/nginx/ssl/server.crt:ro
      - ${SSL_KEY}:/etc/nginx/ssl/server.key:ro
SSLEOF
  COMPOSE_FILES="${COMPOSE_FILES} -f docker-compose.ssl.yml"
  ok "SSL override generated"
fi

# =============================================================================
# Build & Deploy
# =============================================================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Building and deploying${NC}"
echo ""

# Determine compose profiles
COMPOSE_PROFILES=""
if [[ "$MULTI" == true ]]; then
  COMPOSE_PROFILES="--profile multi"
fi

info "Starting docker compose..."
if [[ "$HTTPS" == true ]]; then
  info "HTTPS mode: WAF will listen on ports 80 (redirect) and 443 (SSL)"
fi
if [[ "$MULTI" == true ]]; then
  info "Multi-service: separate backend + MongoDB started"
fi

docker compose $COMPOSE_FILES up -d --build $COMPOSE_PROFILES

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete                                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
PORT_DISPLAY=""
[[ "${HOST_PORT_HTTP:-80}" != "80" ]] && PORT_DISPLAY=":${HOST_PORT_HTTP}"
if [[ "$HTTPS" == true ]]; then
  echo "  Application:  https://${DOMAIN}${PORT_DISPLAY}"
  echo "  (HTTP → HTTPS redirect active)"
else
  echo "  Application:  http://${DOMAIN}${PORT_DISPLAY}"
fi
echo "  API:         http://${DOMAIN}${PORT_DISPLAY}/api"
echo "  Health:      http://${DOMAIN}${PORT_DISPLAY}/health"
echo "  MongoDB:     localhost:${MONGO_HOST_PORT} (host port)"
if [[ "$MULTI" == true ]]; then
  echo "  Multi:       http://${DOMAIN}${PORT_DISPLAY}/multi/"
fi
echo ""
echo "  Admin login: ${ADMIN_EMAIL}"
echo "  Admin pass:  $(cat secrets/admin_password.txt)"
echo ""
echo "  Secrets:     ./secrets/"
echo "  Config:      .env"
echo ""

# =============================================================================
# Verification
# =============================================================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}Verifying deployment${NC}"
echo ""

sleep 5

if command -v curl &>/dev/null; then
  for i in 1 2 3; do
    HEALTH_URL="http://localhost:${HOST_PORT_HTTP:-80}/health"
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
      ok "Application health check passed"
      break
    fi
    if [[ $i -lt 3 ]]; then
      info "Waiting for services... (attempt $i/3)"
      sleep 5
    else
      warn "Health check not yet passing. Check logs: docker compose logs -f"
    fi
  done
fi

echo ""
docker compose ps

echo ""
ok "Deployment finished. Run 'docker compose logs -f' to follow logs."
