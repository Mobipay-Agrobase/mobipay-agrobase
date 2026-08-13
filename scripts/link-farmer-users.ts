/**
 * Link FARMER-role Users to existing FarmerProfile records by setting
 * FarmerProfile.userId. This makes the farmer self-service dashboard work
 * (GET /api/dashboard returns the farmer's own data when userId is linked).
 *
 * Picks the first 2 unlinked farmers per tenant and links them to the
 * corresponding FARMER-role users.
 *
 * Usage: npx tsx scripts/link-farmer-users.ts
 */
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env'), override: true })

const db = new PrismaClient()

async function main() {
  // Find all FARMER-role users (not yet linked to a farmer profile)
  const farmerUsers = await db.user.findMany({
    where: { role: { in: ['FARMER', 'EKB_FARMER'] }, isActive: true },
    select: { id: true, email: true, tenantId: true, firstName: true, lastName: true },
  })
  console.log(`Found ${farmerUsers.length} FARMER-role users`)

  let linked = 0
  for (const user of farmerUsers) {
    // Check if this user is already linked to a farmer profile
    const existing = await db.farmerProfile.findFirst({
      where: { userId: user.id },
      select: { id: true },
    })
    if (existing) {
      console.log(`⏭️  ${user.email} already linked to farmer ${existing.id}`)
      continue
    }

    // Find an unlinked farmer in the same tenant with matching first+last name
    let farmer = await db.farmerProfile.findFirst({
      where: {
        tenantId: user.tenantId,
        userId: null,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
    // Fallback: any unlinked farmer in the tenant
    if (!farmer) {
      farmer = await db.farmerProfile.findFirst({
        where: { tenantId: user.tenantId, userId: null },
      })
    }
    if (!farmer) {
      console.log(`❌ No unlinked farmer found for ${user.email} in tenant ${user.tenantId}`)
      continue
    }

    await db.farmerProfile.update({
      where: { id: farmer.id },
      data: { userId: user.id },
    })
    console.log(`✅ Linked ${user.email} → farmer ${farmer.id} (${farmer.firstName} ${farmer.lastName})`)
    linked++
  }

  console.log(`\n✅ Done. Linked ${linked} farmer users.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
