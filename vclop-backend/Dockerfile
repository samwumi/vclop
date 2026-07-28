# =============================================================================
# VCLOP Backend — Multi-stage Dockerfile
# Stage 1 (builder): compile TypeScript + generate Prisma client
# Stage 2 (runner):  minimal production image with only compiled output
# =============================================================================

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached until package files change)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Prune dev dependencies so only production deps are carried forward
RUN npm prune --omit=dev --legacy-peer-deps


# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist        ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma      ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Create uploads directory with correct ownership
RUN mkdir -p uploads logs && chown -R nestjs:nodejs uploads logs

USER nestjs

EXPOSE 3000

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
