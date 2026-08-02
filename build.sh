#!/bin/bash
set -e

echo "=== Installing backend dependencies ==="
cd vclop-backend
npm install --legacy-peer-deps

echo "=== Rebuilding native modules (bcrypt, sharp) ==="
# npm's allow-scripts gate can skip install scripts for native deps like
# bcrypt/sharp during `npm install`. `npm rebuild` compiles/fetches their
# bindings explicitly so the app doesn't crash at runtime with a missing
# .node binary even when that gate is active.
npm rebuild

echo "=== Building backend ==="
npm run build

echo "=== Installing frontend dependencies ==="
cd ../vclop-frontend
npm install --legacy-peer-deps

echo "=== Rebuilding native modules (esbuild) ==="
npm rebuild

echo "=== Building frontend ==="
VITE_API_URL=/api/v1 npm run build

echo "=== Copying frontend into backend ==="
cd ../vclop-backend
rm -rf public
cp -r ../vclop-frontend/dist public

echo "=== Build complete ==="