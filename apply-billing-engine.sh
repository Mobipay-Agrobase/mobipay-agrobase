#!/usr/bin/env bash
#
# Billing Engine — Apply Changes Script
# ───────────────────────────────────────────
#
# Run this from your mobipay-agrobase project root:
#
#   bash /path/to/apply-billing-engine.sh
#
# This script:
#   1. Extracts all new + modified files from billing-engine-changes.tar.gz
#      into your project (overwriting the 5 modified files, adding 9 new files)
#   2. Runs npx tsc --noEmit to verify compilation
#   3. Generates the Prisma client
#   4. Stages everything for commit
#
# After this script runs, you manually:
#   1. Review with: git diff --cached
#   2. Commit: git commit -m "feat: configurable billing engine with vendor financing"
#   3. Push: git push origin main
#   4. After deploy: npx prisma migrate deploy
#   5. Seed: npx tsx scripts/seed-ekibbo-billing-agreement.ts

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Billing Engine — Apply Changes${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Verify we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "prisma" ] || [ ! -d "src" ]; then
  echo -e "${RED}❌ Run this from the mobipay-agrobase project root.${NC}"
  echo -e "   Expected: package.json, prisma/, src/ in current directory."
  echo -e "   Current: $(pwd)"
  exit 1
fi

# Find the tarball
TARBALL=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/billing-engine-changes.tar.gz" ]; then
  TARBALL="$SCRIPT_DIR/billing-engine-changes.tar.gz"
elif [ -f "billing-engine-changes.tar.gz" ]; then
  TARBALL="billing-engine-changes.tar.gz"
else
  echo -e "${RED}❌ Can't find billing-engine-changes.tar.gz${NC}"
  echo -e "   Place it next to this script or in the current directory."
  exit 1
fi

echo -e "${GREEN}✓ Project root: $(pwd)${NC}"
echo -e "${GREEN}✓ Tarball: $TARBALL${NC}"
echo ""

# Step 1: Extract files (overwrites modified files, adds new ones)
echo -e "${YELLOW}Step 1: Extracting billing engine files...${NC}"
tar -xzf "$TARBALL"
echo -e "${GREEN}  ✓ Files extracted${NC}"
echo ""

# Step 2: Generate Prisma client
echo -e "${YELLOW}Step 2: Generating Prisma client...${NC}"
npx prisma generate 2>&1 | tail -3
echo -e "${GREEN}  ✓ Prisma client generated${NC}"
echo ""

# Step 3: Verify TypeScript
echo -e "${YELLOW}Step 3: Verifying TypeScript compilation...${NC}"
echo -e "  (This may take 30-60 seconds)"
if npx tsc --noEmit 2>&1; then
  echo -e "${GREEN}  ✓ TypeScript compiles cleanly${NC}"
else
  echo -e "${RED}  ❌ TypeScript errors detected. Review the errors above.${NC}"
  exit 1
fi
echo ""

# Step 4: Stage changes
echo -e "${YELLOW}Step 4: Staging changes for commit...${NC}"
git add -A
echo -e "${GREEN}  ✓ Changes staged${NC}"
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Billing engine integrated successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Files added (9 new):${NC}"
echo -e "  • src/lib/vendor-financing/engine.ts (core billing engine)"
echo -e "  • src/app/api/admin/billing/overview/route.ts"
echo -e "  • src/app/api/admin/billing/agreements/route.ts"
echo -e "  • src/app/api/billing/recovery/route.ts"
echo -e "  • src/app/api/billing/cron/monthly/route.ts"
echo -e "  • src/components/admin/BillingOperationsDashboard.tsx"
echo -e "  • src/components/billing/RecoveryDashboard.tsx"
echo -e "  • scripts/seed-ekibbo-billing-agreement.ts"
echo -e "  • mobile/lib/features/billing/presentation/pages/recovery_page.dart"
echo ""
echo -e "${YELLOW}Files modified (6 existing):${NC}"
echo -e "  • prisma/schema.prisma (+5 models, +3 Tenant relations)"
echo -e "  • src/lib/store.ts (+2 ModuleKeys)"
echo -e "  • src/app/page.tsx (+2 lazy imports, +2 switch cases)"
echo -e "  • src/components/layout/Sidebar.tsx (+2 menu items)"
echo -e "  • src/app/api/purchases/route.ts (+fee hook)"
echo -e "  • vercel.json (+monthly cron)"
echo ""
echo -e "${YELLOW}NEXT STEPS (you do these):${NC}"
echo ""
echo -e "  1. Review changes:    ${GREEN}git diff --cached${NC}"
echo -e "  2. Commit:            ${GREEN}git commit -m \"feat: configurable billing engine with vendor financing\"${NC}"
echo -e "  3. Push:              ${GREEN}git push origin main${NC}"
echo -e "  4. Wait for Vercel deploy (~2 min)"
echo -e "  5. Pull prod env:     ${GREEN}npx vercel env pull .env --environment=production --token=YOUR_TOKEN${NC}"
echo -e "  6. Run migration:     ${GREEN}npx prisma migrate deploy${NC}"
echo -e "  7. Seed EKIBBO:       ${GREEN}npx tsx scripts/seed-ekibbo-billing-agreement.ts${NC}"
echo ""
echo -e "${YELLOW}VERCEL.JSON NOTE:${NC}"
echo -e "  The cron entry uses 'CRON_SECRET_PLACEHOLDER' as the key."
echo -e "  Replace it with your actual IMPACT_CRON_SECRET env var value,"
echo -e "  OR just leave the placeholder — the cron will return 401 until"
echo -e "  you set it, which is safe (just won't run until configured)."
echo ""
echo -e "${RED}SECURITY:${NC}"
echo -e "  ${RED}• Revoke the GitHub PAT you shared earlier${NC}"
echo -e "  ${RED}• Rotate the Neon database password you shared earlier${NC}"
echo -e "  ${RED}• Both are compromised — do this NOW${NC}"
echo ""
