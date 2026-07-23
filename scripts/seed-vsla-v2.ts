/**
 * VSLA V2 — Seed demo data
 * Creates: 1 group, 3 key holders, 5 members, 1 active cycle, sample loans
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding VSLA V2 demo data...')

  // Get the MobiPay AgroSys tenant (SUPER_ADMIN tenant)
  const tenant = await db.tenant.findFirst({
    where: { name: 'MobiPay AgroSys' },
  })
  if (!tenant) {
    console.error('❌ MobiPay AgroSys tenant not found. Run the base seed first.')
    process.exit(1)
  }
  console.log(`✓ Using tenant: ${tenant.name} (${tenant.id})`)

  // 1. Create VSLA V2 group
  const group = await db.vslaGroupV2.create({
    data: {
      tenantId: tenant.id,
      name: 'Buwama Rural Farmers VSLA V2',
      code: `VSLA-V2-${Date.now().toString(36).toUpperCase()}`,
      district: 'Mpigi',
      region: 'Central',
      description: 'SRS V2 compliant VSLA group with key holders, E-Teller, and cycle management',
      sharePrice: 5000,
      loanMultiplier: 3,
      welfareContribution: 1000,
      lateAttendanceFine: 500,
      absenceFine: 2000,
      cycleLengthDays: 365,
      minKeyHolders: 3,
      maxKeyHolders: 6,
      cashboxBalance: 500000, // starting cashbox
      status: 'ACTIVE',
    },
  })
  console.log(`✓ Created group: ${group.name}`)

  // 2. Create active cycle
  const startDate = new Date()
  const endDate = new Date(Date.now() + 365 * 86400000)
  const freezeDate = new Date(endDate.getTime() - 30 * 86400000)
  const cycle = await db.vslaCycleV2.create({
    data: {
      groupId: group.id,
      name: `Cycle ${startDate.getFullYear()}`,
      startDate,
      endDate,
      freezeDate,
      status: 'ACTIVE',
    },
  })
  console.log(`✓ Created cycle: ${cycle.name} (freeze date: ${freezeDate.toISOString().slice(0, 10)})`)

  // 3. Create 5 members
  const membersData = [
    { fullName: 'John Mukasa', phone: '+256700100001', gender: 'MALE' },
    { fullName: 'Mary Nabirye', phone: '+256700100002', gender: 'FEMALE' },
    { fullName: 'Peter Okello', phone: '+256700100003', gender: 'MALE' },
    { fullName: 'Grace Auma', phone: '+256700100004', gender: 'FEMALE' },
    { fullName: 'Samuel Kato', phone: '+256700100005', gender: 'MALE' },
  ]

  const members = []
  for (let i = 0; i < membersData.length; i++) {
    const m = membersData[i]
    const memberId = `VSLA-MBR-${String(i + 1).padStart(4, '0')}`
    const pin = String(1000 + i) // PIN: 1000, 1001, 1002, 1003, 1004
    const pinHash = await bcrypt.hash(pin, 12)

    // Give each member some savings (5 contributions of sharePrice)
    const totalSavings = group.sharePrice * 5
    const totalShares = 5

    const member = await db.vslaMemberV2.create({
      data: {
        groupId: group.id,
        memberId,
        fullName: m.fullName,
        phone: m.phone,
        gender: m.gender,
        nationalId: `CF${100000000 + i}`,
        pinHash,
        pinSetAt: new Date(),
        totalShares,
        totalSavings,
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    })
    members.push({ ...member, pin })
    console.log(`✓ Created member: ${m.fullName} (${memberId}) — PIN: ${pin}`)
  }

  // 4. Assign 3 key holders (first 3 members)
  const keyHolderRoles = ['CHAIRPERSON', 'SECRETARY', 'TREASURER']
  for (let i = 0; i < 3; i++) {
    await db.vslaKeyHolderV2.create({
      data: {
        groupId: group.id,
        memberId: members[i].id,
        fullName: members[i].fullName,
        phone: members[i].phone,
        nationalId: members[i].nationalId,
        role: keyHolderRoles[i],
        status: 'ACTIVE',
      },
    })
    console.log(`✓ Assigned key holder: ${members[i].fullName} (${keyHolderRoles[i]})`)
  }

  // 5. Create sample savings transactions (for the cashbox)
  for (const member of members) {
    await db.vslaTransactionV2.create({
      data: {
        groupId: group.id,
        memberId: member.id,
        type: 'SAVING',
        amount: group.sharePrice * 5,
        direction: 'IN',
        description: 'Initial savings (5 shares)',
        transactionRef: `SAV-SEED-${member.memberId}`,
        status: 'COMPLETED',
        recordedByName: 'System Seed',
      },
    })
  }
  console.log(`✓ Created savings transactions for ${members.length} members`)

  // 6. Create a sample loan (SYSTEM_APPROVED — pending key holder approval)
  const loan = await db.vslaLoanV2.create({
    data: {
      groupId: group.id,
      memberId: members[3].id, // Grace Auma applies
      cycleId: cycle.id,
      amount: 50000,
      interestRate: 10,
      totalRepayable: 55000,
      outstanding: 55000,
      purpose: 'School fees for children',
      termDays: 90,
      eligibilityChecked: true,
      eligibilityPassed: true,
      eligibilityCheckedAt: new Date(),
      status: 'SYSTEM_APPROVED',
      systemApprovedAt: new Date(),
      expectedRepaymentDate: new Date(Date.now() + 90 * 86400000),
      transactionRef: `LOAN-V2-SEED-${Date.now().toString(36).toUpperCase()}`,
    },
  })
  console.log(`✓ Created sample loan: UGX 50,000 to ${members[3].fullName} (pending key holder approval)`)

  // 7. Create a sample meeting
  const meeting = await db.vslaMeetingV2.create({
    data: {
      groupId: group.id,
      meetingNumber: 1,
      title: 'Weekly Meeting #1',
      meetingDate: new Date(),
      startTime: '14:00',
      endTime: '16:00',
      location: 'Buwama Community Hall',
      status: 'SCHEDULED',
      totalMembers: members.length,
    },
  })
  console.log(`✓ Created meeting: ${meeting.title}`)

  console.log('\n✅ VSLA V2 seed complete!')
  console.log('\n📋 Login details for testing:')
  console.log('   Admin login: admin@agrobase.co / password123')
  console.log('   Then visit: /vsla-v2')
  console.log('\n📱 VSLA Member login (mobile app):')
  members.forEach((m, i) => {
    console.log(`   ${m.memberId} / PIN: ${m.pin} (${m.fullName})`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
