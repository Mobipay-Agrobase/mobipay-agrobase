# ============================================
# Agrobase V3 — Production Dockerfile
# MobiPay AgroSys Limited
# Multi-stage, security-hardened, optimized for East Africa deployment
# ============================================

# --- Stage 1: Build ---
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy manifest + prisma schema first (npm ci postinstall runs `prisma generate`,
# which requires prisma/schema.prisma to be present in the image)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ALL dependencies (dev deps are needed for the Next.js build)
RUN npm ci

# Copy source
COPY . .

# Re-generate Prisma client (in case schema changed after npm ci)
RUN npx prisma generate

# Next.js production build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_SKIP_TYPECHECK=true
# Inert placeholder for build-time Prisma client instantiation (runtime value
# is injected via docker-compose / k8s env). Mirrors the known-passing CI setup.
ENV DATABASE_URL="postgresql://agrobase:placeholder@localhost:5432/agrobase_v3?schema=public"

RUN npm run build

# --- Stage 2: Production Runner (minimal attack surface) ---
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat wget ca-certificates tzdata && \
    cp /usr/share/zoneinfo/Africa/Kampala /etc/localtime && \
    echo "Africa/Kampala" > /etc/timezone && \
    apk del tzdata

WORKDIR /app

# Create non-root user with restricted permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone output (self-contained server)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

# Health check — verifies the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Start with Node.js (standalone mode)
CMD ["node", "server.js"]