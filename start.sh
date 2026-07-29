#!/bin/bash
# VCLOP start script for Hostinger Cloud Startup
set -e

cd vclop-backend

echo "=== Generating Prisma client ==="
npx prisma generate

echo "=== Running database migrations ==="
# Use || true so a migration failure doesn't prevent the app from starting
npx prisma migrate deploy || {
  echo "Migration had issues — attempting db push as fallback"
  npx prisma db push --accept-data-loss || true
}

echo "=== Starting VCLOP server on port ${PORT:-3000} ==="
node dist/src/main.js
