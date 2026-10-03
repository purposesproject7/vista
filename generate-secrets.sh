#!/usr/bin/env bash
# =============================================================================
# generate-secrets.sh — Secure Random Secret Generator
# =============================================================================
# Generates cryptographically strong secrets for:
#   JWT_SECRET, SIGNING_SECRET, MONGO_ROOT_PASSWORD, ADMIN_PASSWORD
#
# Usage:
#   ./generate-secrets.sh              # print all secrets to stdout
#   source ./generate-secrets.sh       # export GENERATED_* variables
#   ./generate-secrets.sh --env        # print as .env snippet (export FRIENDLY)
# =============================================================================
set -euo pipefail

if ! command -v openssl &>/dev/null; then
  echo "ERROR: openssl is required but not found." >&2
  exit 1
fi

# --- Generate secrets --------------------------------------------------------
# Use /dev/urandom (via openssl) which is cryptographically secure
GENERATED_JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
GENERATED_SIGNING_SECRET=$(openssl rand -hex 64 | tr -d '\n')
GENERATED_MONGO_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
GENERATED_ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr '+/' '_-')
GENERATED_ADMIN_PASSWORD="${GENERATED_ADMIN_PASSWORD}Aa1!"  # ensure complexity

GENERATED_JWT_EXPIRE="1h"

# --- Output modes ------------------------------------------------------------
if [[ "${1:-}" == "--env" ]]; then
  cat <<EOF
# =============================================================================
# Auto-generated secrets — DO NOT commit this file to version control
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# =============================================================================

# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=${GENERATED_MONGO_ROOT_PASSWORD}

# JWT
JWT_SECRET=${GENERATED_JWT_SECRET}
JWT_EXPIRE=${GENERATED_JWT_EXPIRE}

# Signing (for internal HMAC / webhook signing)
SIGNING_SECRET=${GENERATED_SIGNING_SECRET}

# Admin account (first-run setup)
ADMIN_PASSWORD=${GENERATED_ADMIN_PASSWORD}

# Randomised host ports (user-serviceable range; regenerate if clash)
HOST_PORT_HTTP=$(( ((RANDOM << 15) | RANDOM) % 57344 + 8000 ))   # 8000–64535
HOST_PORT_HTTPS=$(( ((RANDOM << 15) | RANDOM) % 57344 + 8000 ))  # 8000–64535
EOF
elif [[ "${1:-}" == "--json" ]]; then
  cat <<EOF
{
  "generatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "jwtSecret": "${GENERATED_JWT_SECRET}",
  "signingSecret": "${GENERATED_SIGNING_SECRET}",
  "mongoRootPassword": "${GENERATED_MONGO_ROOT_PASSWORD}",
  "adminPassword": "${GENERATED_ADMIN_PASSWORD}",
  "jwtExpire": "${GENERATED_JWT_EXPIRE}"
}
EOF
else
  cat <<EOF
╔══════════════════════════════════════════════════════════════╗
║  Generated Secrets                                          ║
╚══════════════════════════════════════════════════════════════╝

  JWT_SECRET .............. ${GENERATED_JWT_SECRET}
  SIGNING_SECRET .......... ${GENERATED_SIGNING_SECRET}
  MONGO_ROOT_PASSWORD ..... ${GENERATED_MONGO_ROOT_PASSWORD}
  ADMIN_PASSWORD .......... ${GENERATED_ADMIN_PASSWORD}

  JWT_EXPIRE .............. ${GENERATED_JWT_EXPIRE}

  ⚠  Save these securely. They will NOT be shown again.
EOF
fi
