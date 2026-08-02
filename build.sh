#!/bin/bash
set -e

echo "=== Installing backend dependencies ==="
cd vclop-backend
npm install --legacy-peer-deps

# vclop-backend's own "build" script (see package.json) already generates
# the Prisma client, compiles the backend, and then builds vclop-frontend
# and copies its dist/ into vclop-backend/public — so this single step
# produces the full deployable app. Native module rebuilds (bcrypt, sharp,
# esbuild) happen automatically via each package's postinstall hook.
echo "=== Building (backend + frontend, copied into vclop-backend/public) ==="
npm run build

echo "=== Build complete ==="