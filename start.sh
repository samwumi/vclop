#!/bin/bash
# VCLOP start script — run from repo root
# Hostinger start command: bash start.sh
set -e

cd vclop-backend

echo "=== Running database migrations ==="
npx prisma migrate deploy

echo "=== Starting VCLOP API server ==="
node dist/src/main.js
