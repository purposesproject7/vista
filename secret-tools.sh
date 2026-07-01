#!/usr/bin/env bash
# =============================================================================
# secret-tools.sh — Secret management utilities
# =============================================================================
# Commands:
#   read    <name>   Print a secret value (usage: secret-tools.sh read jwt_secret)
#   rotate  <name>   Regenerate a named secret
#   list             List all stored secrets
# =============================================================================
set -euo pipefail

SECRETS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/secrets"

case "${1:-help}" in
  read)
    if [[ -z "${2:-}" ]]; then
      echo "Usage: $0 read <secret_name>" >&2
      exit 1
    fi
    if [[ ! -f "$SECRETS_DIR/${2}.txt" ]]; then
      echo "ERROR: Secret '$2' not found at $SECRETS_DIR/${2}.txt" >&2
      exit 1
    fi
    cat "$SECRETS_DIR/${2}.txt"
    echo ""
    ;;
  rotate)
    if [[ -z "${2:-}" ]]; then
      echo "Usage: $0 rotate <secret_name>" >&2
      exit 1
    fi
    length=64
    mode=base64
    case "$2" in
      jwt_secret)      length=64; mode=base64 ;;
      signing_secret)  length=64; mode=hex ;;
      mongo_root_password) length=32; mode=base64 ;;
      admin_password)  length=24; mode=base64 ;;
      *)
        echo "ERROR: Unknown secret '$2'. Valid: jwt_secret, signing_secret, mongo_root_password, admin_password" >&2
        exit 1
        ;;
    esac
    value=$(openssl rand -"$mode" "$length" | tr -d '\n')
    if [[ "$2" == "admin_password" ]]; then
      value="${value}Aa1!"
    fi
    echo -n "$value" > "$SECRETS_DIR/${2}.txt"
    chmod 600 "$SECRETS_DIR/${2}.txt"
    echo "Secret '$2' rotated successfully."
    ;;
  list)
    echo "Stored secrets:"
    for f in "$SECRETS_DIR"/*.txt; do
      if [[ -f "$f" ]]; then
        name=$(basename "$f" .txt)
        size=$(wc -c < "$f")
        echo "  $name ($size bytes)"
      fi
    done
    ;;
  help|*)
    echo "Usage: $0 {read|rotate|list} [secret_name]"
    echo ""
    echo "  read    <name>   Print a secret value"
    echo "  rotate  <name>   Regenerate a named secret"
    echo "  list            List all stored secrets"
    exit 1
    ;;
esac
