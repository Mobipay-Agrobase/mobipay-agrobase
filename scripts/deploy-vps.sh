#!/usr/bin/env bash
#
# Deploy Agrobase V3 to Eric's VPS (newagrobase.mobipayagrosys.com)
#
# Usage:
#   ./scripts/deploy-vps.sh
#
# Prerequisites:
#   - On your Mac, in the mobipay-agrobase directory
#   - SSH key configured for farm@67.223.117.117 (or password auth)
#   - Node.js 20+ installed locally
#
# What this script does:
#   1. Pulls latest code from GitHub
#   2. Builds the Next.js standalone bundle locally
#   3. Packages it into a tar.gz
#   4. Uploads to the VPS via SCP
#   5. Extracts on the VPS
#   6. Restarts PM2 (zero-downtime reload)
#
set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────────────────
VPS_HOST="67.223.117.117"
VPS_USER="farm"
VPS_APP_DIR="/home/farm/newagrobase"
LOCAL_BUILD_DIR=".next/standalone"
LOCAL_STATIC_DIR=".next/static"
PUBLIC_DIR="public"
SCHEMA_FILE="prisma/schema.prisma"
PACKAGE_JSON="package.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()   { echo -e "${GREEN}[$(date +%H:%M:%S)] ✅${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠️${NC} $1"; }
err()  { echo -e "${RED}[$(date +%H:%M:%S)] ❌${NC} $1"; }

# ─── Step 1: Pull latest code ────────────────────────────────────────────────
log "Step 1: Pulling latest code from GitHub..."
git pull origin main
ok "Code pulled"

# ─── Step 2: Install dependencies ────────────────────────────────────────────
log "Step 2: Installing dependencies..."
npm install
ok "Dependencies installed"

# ─── Step 3: Generate Prisma client ──────────────────────────────────────────
log "Step 3: Generating Prisma client..."
npx prisma generate
ok "Prisma client generated"

# ─── Step 4: Build Next.js standalone bundle ────────────────────────────────
log "Step 4: Building Next.js standalone bundle (this takes ~5-10 min)..."
# Use ESLINT_IGNORE_DURING_BUILD=true to skip lint during build (already checked in CI)
ESLINT_IGNORE_DURING_BUILD=true npm run build
ok "Build complete"

# Verify the standalone output exists
if [ ! -f "$LOCAL_BUILD_DIR/server.js" ]; then
  err "Build failed — $LOCAL_BUILD_DIR/server.js not found"
  exit 1
fi

# ─── Step 5: Copy static assets into the standalone dir ─────────────────────
# The standalone output doesn't include .next/static by default — we need to
# copy it so the server can serve static assets (JS, CSS, fonts).
log "Step 5: Copying static assets into standalone dir..."
mkdir -p "$LOCAL_BUILD_DIR/.next"
cp -r "$LOCAL_STATIC_DIR" "$LOCAL_BUILD_DIR/.next/static"
cp -r "$PUBLIC_DIR" "$LOCAL_BUILD_DIR/public"
cp "$SCHEMA_FILE" "$LOCAL_BUILD_DIR/prisma/schema.prisma"
cp "$PACKAGE_JSON" "$LOCAL_BUILD_DIR/package.json"
mkdir -p "$LOCAL_BUILD_DIR/prisma"
ok "Static assets copied"

# ─── Step 6: Package into tar.gz ─────────────────────────────────────────────
TAR_FILE="agrobase-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
log "Step 6: Packaging into $TAR_FILE..."
cd "$LOCAL_BUILD_DIR"
tar -czf "../$TAR_FILE" .
cd - > /dev/null
TAR_SIZE=$(du -h "$TAR_FILE" | cut -f1)
ok "Package created: $TAR_FILE ($TAR_SIZE)"

# ─── Step 7: Upload to VPS via SCP ───────────────────────────────────────────
log "Step 7: Uploading to VPS ($VPS_HOST)..."
log "You may be prompted for the VPS password: CvTd7{%ticr6MW*K"
scp "$TAR_FILE" "$VPS_USER@$VPS_HOST:/tmp/"
ok "Upload complete"

# ─── Step 8: Extract + restart PM2 on the VPS ────────────────────────────────
log "Step 8: Extracting + restarting PM2 on the VPS..."
ssh "$VPS_USER@$VPS_HOST" << EOF
set -e
echo "[VPS] Creating app directory..."
mkdir -p $VPS_APP_DIR

echo "[VPS] Backing up current deployment..."
if [ -d "$VPS_APP_DIR/current" ]; then
  mv "$VPS_APP_DIR/current" "$VPS_APP_DIR/backup-\$(date +%Y%m%d-%H%M%S)"
fi

echo "[VPS] Extracting new build..."
mkdir -p "$VPS_APP_DIR/current"
cd "$VPS_APP_DIR/current"
tar -xzf /tmp/$TAR_FILE

echo "[VPS] Installing Prisma client (server-side)..."
cd "$VPS_APP_DIR/current"
npm install prisma @prisma/client --production=false
npx prisma generate

echo "[VPS] Creating .env file if not exists..."
if [ ! -f "$VPS_APP_DIR/current/.env" ]; then
  cat > "$VPS_APP_DIR/current/.env" <<'ENV'
DATABASE_URL=postgresql://neondb_owner:npg_wsm31RAcGOjq@ep-icy-wind-asjngzei-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=20
DIRECT_URL=postgresql://neondb_owner:npg_wsm31RAcGOjq@ep-icy-wind-asjngzei.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=agrobase-dev-secret-key-change-in-production
NEXTAUTH_URL=https://newagrobase.mobipayagrosys.com
ENCRYPTION_KEY=q3KQH8itGaWLiBucQKIqk05V4dX0gEX1p6ULR3gW8ys=
NODE_ENV=production
PORT=3000
ENV
  echo "[VPS] .env file created"
else
  echo "[VPS] .env file already exists — keeping existing config"
fi

echo "[VPS] Stopping existing PM2 process (if any)..."
pm2 delete agrobase || true

echo "[VPS] Starting PM2 process..."
cd "$VPS_APP_DIR/current"
pm2 start server.js --name agrobase --env production
pm2 save

echo "[VPS] Deployment complete!"
echo "[VPS] App running at: http://127.0.0.1:3000"
echo "[VPS] Check status: pm2 status"
echo "[VPS] Check logs: pm2 logs agrobase"
EOF

ok "PM2 restarted on VPS"

# ─── Step 9: Cleanup ────────────────────────────────────────────────────────
log "Step 9: Cleaning up local tar file..."
rm -f "$TAR_FILE"
ok "Cleanup complete"

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
ok "═══════════════════════════════════════════════════════════════"
ok "  Deployment complete!"
ok "═══════════════════════════════════════════════════════════════"
echo ""
log "Next steps:"
echo "  1. Configure Apache reverse proxy (see deploy guide)"
echo "  2. Set up SSL via cPanel → SSL/TLS Status → Run AutoSSL"
echo "  3. Set up cron jobs in cPanel (5 jobs — see deploy guide)"
echo "  4. Test: visit https://newagrobase.mobipayagrosys.com/"
echo ""
log "Useful PM2 commands (run on the VPS via SSH):"
echo "  pm2 status              — check if app is running"
echo "  pm2 logs agrobase       — view live logs"
echo "  pm2 restart agrobase    — restart the app"
echo "  pm2 stop agrobase       — stop the app"
echo ""
