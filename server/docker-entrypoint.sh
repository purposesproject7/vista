#!/bin/sh
# Docker entrypoint script for server
set -e

echo "Starting Vista Server..."

# =============================================================================
# Read Docker secrets and export as environment variables
# This bridges Docker secrets (files) with the app (which reads env vars)
# =============================================================================

# JWT_SECRET
if [ -f "$JWT_SECRET_FILE" ]; then
  export JWT_SECRET=$(cat "$JWT_SECRET_FILE")
fi

# SIGNING_SECRET
if [ -f "$SIGNING_SECRET_FILE" ]; then
  export SIGNING_SECRET=$(cat "$SIGNING_SECRET_FILE")
fi

# MONGO_ROOT_PASSWORD — also build MONGO_URI if not already set
if [ -f "$MONGO_ROOT_PASSWORD_FILE" ]; then
  MONGO_ROOT_PASSWORD=$(cat "$MONGO_ROOT_PASSWORD_FILE")
  export MONGO_ROOT_PASSWORD
fi

# ADMIN_PASSWORD
if [ -f "$ADMIN_PASSWORD_FILE" ]; then
  export ADMIN_PASSWORD=$(cat "$ADMIN_PASSWORD_FILE")
fi

# Construct MONGO_URI from components if not explicitly set
if [ -z "$MONGO_URI" ]; then
  MONGO_USER="${MONGO_ROOT_USER:-admin}"
  MONGO_PASS="${MONGO_ROOT_PASSWORD}"
  MONGO_HOST="${MONGO_HOST:-mongodb}"
  MONGO_PORT="${MONGO_PORT:-27017}"
  MONGO_DB="${MONGO_DB:-vista}"
  export MONGO_URI="mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin"
  echo "MONGO_URI constructed from components"
fi

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

until mongosh "$MONGO_URI" --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "MongoDB did not become ready in time"
    exit 1
  fi
  echo "MongoDB is unavailable - sleeping (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "MongoDB is ready!"

# Run admin setup if needed (only on first run)
if [ "$RUN_ADMIN_SETUP" = "true" ]; then
  echo "Running admin setup..."
  node scripts/setupAdmin001.js || echo "Admin setup failed or already completed"
fi

# Start the application
echo "Starting Node.js application..."
exec node index.js
