#!/bin/bash
set -e

echo "=== Installing backend dependencies ==="
cd vclop-backend
npm install --legacy-peer-deps

echo "=== Building backend ==="
npm run build

echo "=== Installing frontend dependencies ==="
cd ../vclop-frontend
npm install --legacy-peer-deps

echo "=== Building frontend ==="
VITE_API_URL=/api/v1 npm run build

echo "=== Copying frontend into backend ==="
cd ../vclop-backend
rm -rf public
cp -r ../vclop-frontend/dist public

echo "=== Build complete ==="