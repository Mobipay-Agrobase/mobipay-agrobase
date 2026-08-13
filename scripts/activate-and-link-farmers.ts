import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env'), override: true })

async function main() {
  const db = new PrismaClient()
  // Activate all FARMER + EXTENSION_OFFICER + CBT users (they were seeded as inactive)
  const result = await db.user.updateMany({
    where: { role: { in: ['FARMER', 'EKB_FARMER', 'EXTENSION_OFFICER', 'CBT', 'VSLA_MEMBER'] } },
    data: { isActive: true },
  })
  console.log(`✅ Activated ${result.count} users`)

  // Now link each FARMER user to a FarmerProfile
  const farmerUsers = await db.user.findMany({
    where: { role: { in: ['FARMER', 'EKB_FARMER'] }, isActive: true },
    select: { id: true, email: true, tenantId: true, firstName: true, lastName: true },
  })
  console.log(`\nLinking ${farmerUsers.length} farmer users to FarmerProfiles...`)

  let linked = 0
  for (const user of farmerUsers) {
    const existing = await db.farmerProfile.findFirst({
      where: { userId: user.id },
      select: { id: true },
    })
    if (existing) {
      console.log(`⏭️  ${user.email} already linked`)
      continue
    }
    // Find a farmer in the same tenant with matching name
    let farmer = await db.farmerProfile.findFirst({
      where: { tenantId: user.tenantId, userId: null, firstName: user.firstName, lastName: user.lastName },
    })
    if (!farmer) {
      farmer = await db.farmerProfile.findFirst({
        where: { tenantId: user.tenantId, userId: null },
      })
    }
    if (!farmer) {
      console.log(`❌ No farmer to link for ${user.email}`)
      continue
    }
    await db.farmerProfile.update({
      where: { id: farmer.id },
      data: { userId: user.id },
    })
    console.log(`✅ ${user.email} → farmer ${farmer.id} (${farmer.firstName} ${farmer.lastName})`)
    linked++
  }
  console.log(`\n✅ Done. Linked ${linked} farmer users.`)
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
