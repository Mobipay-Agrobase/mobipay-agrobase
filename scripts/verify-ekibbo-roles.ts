/**
 * Verify and fix EKIBBO user roles
 * Run: npx tsx scripts/verify-ekibbo-roles.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const EXPECTED_ROLES: Record<string, string> = {
  'eric@ekibbo.co':      'EKB_MD',
  'ops@ekibbo.co':       'EKB_OPS_MANAGER',
  'finance@ekibbo.co':   'EKB_FINANCE',
  'assistant@ekibbo.co': 'EKB_FIN_ASSISTANT',
  'mec@ekibbo.co':       'EKB_MEC',
  'eo1@ekibbo.co':       'EKB_EXTENSION',
  'eo2@ekibbo.co':       'EKB_EXTENSION',
}

async function main() {
  console.log('🔍 Verifying EKIBBO User Roles')
  console.log('='.repeat(60))

  let fixed = 0
  let ok = 0

  for (const [email, expectedRole] of Object.entries(EXPECTED_ROLES)) {
    const user = await db.user.findFirst({
      where: { email },
      select: { id: true, role: true, firstName: true, lastName: true },
    })

    if (!user) {
      console.log(`❌ ${email.padEnd(28)} NOT FOUND`)
      continue
    }

    if (user.role === expectedRole) {
      console.log(`✅ ${email.padEnd(28)} role=${user.role}`)
      ok++
    } else {
      console.log(`⚠️  ${email.padEnd(28)} role=${user.role} (expected ${expectedRole}) — FIXING`)
      await db.user.update({
        where: { id: user.id },
        data: { role: expectedRole },
      })
      console.log(`   ✓ Fixed → ${expectedRole}`)
      fixed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Already correct: ${ok}`)
  console.log(`🔧 Fixed: ${fixed}`)
  console.log('\n💡 Affected users must log out and log back in for the new role to take effect.')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
