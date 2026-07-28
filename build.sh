#!/bin/bash
# VCLOP full build script — run from repo root
# Hostinger build command: bash build.sh
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

echo "=== Build complete ==="
