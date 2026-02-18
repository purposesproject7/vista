#!/bin/sh
# Docker entrypoint script for server
set -e

echo "🚀 Starting Vista Server..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

until mongosh --host mongodb --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ MongoDB did not become ready in time"
    exit 1
  fi
  echo "MongoDB is unavailable - sleeping (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "✅ MongoDB is ready!"

# Run admin setup if needed (only on first run)
if [ "$RUN_ADMIN_SETUP" = "true" ]; then
  echo "🔧 Running admin setup..."
  node scripts/setupAdmin001.js || echo "⚠️  Admin setup failed or already completed"
fi

# Start the application
echo "🎉 Starting Node.js application..."
exec node index.js
