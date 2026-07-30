/**
 * startup.js — Hostinger entry point wrapper
 * Runs Prisma migrations then starts the NestJS app.
 * Set Hostinger entry point to: startup.js
 */
const { execSync } = require('child_process');
const path = require('path');

// Run pending migrations before starting
try {
  console.log('[startup] Running Prisma migrations...');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: __dirname,
    env: process.env,
  });
  console.log('[startup] Migrations complete.');
} catch (err) {
  console.error('[startup] Migration failed:', err.message);
  process.exit(1);
}

// Start the NestJS application
console.log('[startup] Starting application...');
require('./dist/src/main.js');
