# =============================================================================
# VCLOP Frontend — Multi-stage Dockerfile
# Stage 1 (builder): Vite production build
# Stage 2 (runner):  nginx serving static files
# =============================================================================

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Pass the API URL at build time (override default /api/v1 for production)
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# ── Stage 2: nginx ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config: serve SPA, proxy /api to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
