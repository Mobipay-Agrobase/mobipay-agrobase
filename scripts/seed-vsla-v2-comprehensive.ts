/**
 * VSLA V2 — Comprehensive seed with diverse Ugandan scenarios
 * Creates 8 groups across different regions with varied configurations
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding comprehensive VSLA V2 data...')

  // Cleanup
  console.log('🧹 Cleaning up existing V2 data...')
  await db.vslaSmsOtpV2.deleteMany()
  await db.vslaCashboxEntryV2.deleteMany()
  await db.vslaTransactionV2.deleteMany()
  await db.vslaETellerV2.deleteMany()
  await db.vslaMeetingAttendanceV2.deleteMany()
  await db.vslaMeetingV2.deleteMany()
  await db.vslaLoanApprovalV2.deleteMany()
  await db.vslaLoanV2.deleteMany()
  await db.vslaCycleV2.deleteMany()
  await db.vslaKeyHolderV2.deleteMany()
  await db.vslaMemberV2.deleteMany()
  await db.vslaGroupV2.deleteMany()

  // Get tenants
  const mobipay = await db.tenant.findFirst({ where: { name: 'MobiPay AgroSys' } })
  const klimo = await db.tenant.findFirst({ where: { name: { contains: 'Klim' } } })
  if (!mobipay) { console.error('❌ MobiPay tenant not found'); process.exit(1) }

  const tenants = [mobipay, klimo].filter(Boolean) as any[]
  
  // ─── 8 diverse groups across Uganda ───
  const groupsConfig = [
    // Central Region
    {
      tenantId: mobipay.id,
      name: 'Buwama Coffee Farmers VSLA',
      district: 'Mpigi', region: 'Central',
      sharePrice: 5000, loanMultiplier: 3, welfareContribution: 1000,
      lateAttendanceFine: 500, absenceFine: 2000, cycleLengthDays: 365,
      cashboxBalance: 1250000, members: 12,
    },
    {
      tenantId: mobipay.id,
      name: 'Mukono Matooke Traders VSLA',
      district: 'Mukono', region: 'Central',
      sharePrice: 10000, loanMultiplier: 4, welfareContribution: 2000,
      lateAttendanceFine: 1000, absenceFine: 3000, cycleLengthDays: 180,
      cashboxBalance: 3400000, members: 8,
    },
    // Eastern Region
    {
      tenantId: mobipay.id,
      name: 'Jinja Cassava Cooperative VSLA',
      district: 'Jinja', region: 'Eastern',
      sharePrice: 5000, loanMultiplier: 3, welfareContribution: 1500,
      lateAttendanceFine: 750, absenceFine: 2500, cycleLengthDays: 365,
      cashboxBalance: 890000, members: 15,
    },
    {
      tenantId: mobipay.id,
      name: 'Mbale Maize Growers VSLA',
      district: 'Mbale', region: 'Eastern',
      sharePrice: 3000, loanMultiplier: 2, welfareContribution: 500,
      lateAttendanceFine: 300, absenceFine: 1000, cycleLengthDays: 270,
      cashboxBalance: 450000, members: 20,
    },
    // Western Region
    {
      tenantId: klimo?.id || mobipay.id,
      name: 'Mbarara Dairy Farmers VSLA',
      district: 'Mbarara', region: 'Western',
      sharePrice: 8000, loanMultiplier: 3, welfareContribution: 2000,
      lateAttendanceFine: 800, absenceFine: 3000, cycleLengthDays: 365,
      cashboxBalance: 2100000, members: 10,
    },
    {
      tenantId: klimo?.id || mobipay.id,
      name: 'Kasese Vanilla Growers VSLA',
      district: 'Kasese', region: 'Western',
      sharePrice: 15000, loanMultiplier: 5, welfareContribution: 3000,
      lateAttendanceFine: 1500, absenceFine: 5000, cycleLengthDays: 365,
      cashboxBalance: 5600000, members: 6,
    },
    // Northern Region
    {
      tenantId: mobipay.id,
      name: 'Gulu Cotton Farmers VSLA',
      district: 'Gulu', region: 'Northern',
      sharePrice: 2000, loanMultiplier: 2, welfareContribution: 500,
      lateAttendanceFine: 200, absenceFine: 800, cycleLengthDays: 365,
      cashboxBalance: 320000, members: 18,
    },
    // Refugee Settlement (Kilimo Trust)
    {
      tenantId: klimo?.id || mobipay.id,
      name: 'Nakivale Refugee Women VSLA',
      district: 'Isingiro', region: 'Western',
      sharePrice: 1000, loanMultiplier: 2, welfareContribution: 200,
      lateAttendanceFine: 100, absenceFine: 500, cycleLengthDays: 180,
      cashboxBalance: 180000, members: 25,
    },
  ]

  const ugandanNames = [
    'John Mukasa', 'Mary Nabirye', 'Peter Okello', 'Grace Auma', 'Samuel Kato',
    'Sarah Nalwoga', 'James Ssempa', 'Ruth Akello', 'David Byaruhanga', 'Esther Atim',
    'Joseph Wasswa', 'Hannah Nakato', 'Moses Ochen', 'Rebecca Adoch', 'Isaac Okware',
    'Deborah Nabukenya', 'Michael Opio', 'Janet Aber', 'Paul Ssali', 'Patricia Aciro',
    'Stephen Odongo', 'Florence Lamwaka', 'Robert Bbosa', 'Agnes Akot', 'Daniel Eotu',
    'Margaret Letaru', 'Francis Emuge', 'Beatrice Adoch', 'Patrick Otim', 'Carol Akello',
  ]

  let memberCounter = 0
  let loanCounter = 0

  for (const gc of groupsConfig) {
    // Create group
    const group = await db.vslaGroupV2.create({
      data: {
        tenantId: gc.tenantId,
        name: gc.name,
        code: `VSLA-V2-${Date.now().toString(36).toUpperCase()}-${memberCounter}`,
        district: gc.district,
        region: gc.region,
        description: `${gc.region} region VSLA group in ${gc.district} district`,
        sharePrice: gc.sharePrice,
        loanMultiplier: gc.loanMultiplier,
        welfareContribution: gc.welfareContribution,
        lateAttendanceFine: gc.lateAttendanceFine,
        absenceFine: gc.absenceFine,
        cycleLengthDays: gc.cycleLengthDays,
        minKeyHolders: 3,
        maxKeyHolders: 6,
        cashboxBalance: gc.cashboxBalance,
        status: 'ACTIVE',
      },
    })

    // Create active cycle
    const startDate = new Date()
    const endDate = new Date(Date.now() + gc.cycleLengthDays * 86400000)
    const freezeDate = new Date(endDate.getTime() - 30 * 86400000)
    const cycle = await db.vslaCycleV2.create({
      data: {
        groupId: group.id,
        name: `Cycle ${startDate.getFullYear()}`,
        startDate, endDate, freezeDate,
        status: 'ACTIVE',
      },
    })

    // Create members
    const members = []
    for (let i = 0; i < gc.members; i++) {
      const nameIdx = (memberCounter + i) % ugandanNames.length
      const fullName = ugandanNames[nameIdx]
      const memberId = `VSLA-MBR-${String(memberCounter + i + 1).padStart(4, '0')}`
      const pin = String(1000 + memberCounter + i)
      const pinHash = await bcrypt.hash(pin, 12)
      const totalShares = 3 + Math.floor(Math.random() * 10)
      const totalSavings = totalShares * gc.sharePrice

      const member = await db.vslaMemberV2.create({
        data: {
          groupId: group.id,
          memberId,
          fullName,
          phone: `+2567${String(10000000 + memberCounter + i).padStart(8, '0')}`,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          nationalId: `CF${100000000 + memberCounter + i}`,
          pinHash,
          pinSetAt: new Date(),
          totalShares,
          totalSavings,
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      })
      members.push({ ...member, pin })

      // Create savings transactions
      await db.vslaTransactionV2.create({
        data: {
          groupId: group.id,
          memberId: member.id,
          type: 'SAVING',
          amount: totalSavings,
          direction: 'IN',
          description: `${totalShares} shares × UGX ${gc.sharePrice}`,
          transactionRef: `SAV-${memberId}`,
          status: 'COMPLETED',
          recordedByName: 'System Seed',
        },
      })
    }
    memberCounter += gc.members

    // Assign 3 key holders
    const khRoles = ['CHAIRPERSON', 'SECRETARY', 'TREASURER']
    for (let i = 0; i < 3 && i < members.length; i++) {
      await db.vslaKeyHolderV2.create({
        data: {
          groupId: group.id,
          memberId: members[i].id,
          fullName: members[i].fullName,
          phone: members[i].phone,
          nationalId: members[i].nationalId,
          role: khRoles[i],
          status: 'ACTIVE',
        },
      })
    }

    // Create sample loans — diverse statuses
    const loanStatuses = ['SYSTEM_APPROVED', 'KEYHOLDER_APPROVED', 'DISBURSED', 'REPAID', 'REJECTED']
    const loanPurposes = [
      'School fees for children', 'Farm inputs (seeds, fertilizer)', 'Medical bills',
      'Business capital — produce trading', 'Motorcycle purchase for transport',
      'Home improvement', 'Wedding expenses', 'Livestock purchase',
    ]

    const numLoans = 2 + Math.floor(Math.random() * 4)
    for (let i = 0; i < numLoans && i < members.length; i++) {
      const member = members[3 + i] || members[i]
      if (!member) continue
      const amount = gc.sharePrice * (5 + Math.floor(Math.random() * 20))
      const interestRate = 10
      const totalRepayable = amount + (amount * interestRate / 100)
      const status = loanStatuses[loanCounter % loanStatuses.length]
      const purpose = loanPurposes[loanCounter % loanPurposes.length]

      const loan = await db.vslaLoanV2.create({
        data: {
          groupId: group.id,
          memberId: member.id,
          cycleId: cycle.id,
          amount,
          interestRate,
          totalRepayable,
          outstanding: status === 'REPAID' ? 0 : (status === 'DISBURSED' ? totalRepayable * 0.6 : totalRepayable),
          amountRepaid: status === 'REPAID' ? totalRepayable : (status === 'DISBURSED' ? totalRepayable * 0.4 : 0),
          purpose,
          termDays: 90,
          eligibilityChecked: true,
          eligibilityPassed: true,
          eligibilityCheckedAt: new Date(Date.now() - 30 * 86400000),
          status,
          systemApprovedAt: new Date(Date.now() - 25 * 86400000),
          disbursedAt: status === 'DISBURSED' || status === 'REPAID' ? new Date(Date.now() - 20 * 86400000) : null,
          repaidAt: status === 'REPAID' ? new Date(Date.now() - 5 * 86400000) : null,
          closedAt: (status === 'REPAID' || status === 'REJECTED') ? new Date() : null,
          expectedRepaymentDate: new Date(Date.now() + 70 * 86400000),
          transactionRef: `LOAN-V2-${Date.now().toString(36).toUpperCase()}-${loanCounter}`,
        },
      })

      // For KEYHOLDER_APPROVED loans, add key holder approval votes
      if (status === 'KEYHOLDER_APPROVED' || status === 'DISBURSED' || status === 'REPAID') {
        const keyHolders = await db.vslaKeyHolderV2.findMany({ where: { groupId: group.id, status: 'ACTIVE' } })
        for (const kh of keyHolders) {
          await db.vslaLoanApprovalV2.create({
            data: {
              loanId: loan.id,
              keyHolderId: kh.id,
              decision: 'APPROVED',
              approvedAt: new Date(Date.now() - 22 * 86400000),
            },
          })
        }
      }
      loanCounter++
    }

    // Create a meeting
    await db.vslaMeetingV2.create({
      data: {
        groupId: group.id,
        meetingNumber: 1,
        title: 'Weekly Meeting #1',
        meetingDate: new Date(Date.now() + 2 * 86400000),
        startTime: '14:00',
        endTime: '16:00',
        location: `${gc.district} Community Hall`,
        status: 'SCHEDULED',
        totalMembers: gc.members,
        cashboxBefore: gc.cashboxBalance,
        cashboxAfter: gc.cashboxBalance,
      },
    })

    // Create a concluded meeting with attendance
    const concludedMeeting = await db.vslaMeetingV2.create({
      data: {
        groupId: group.id,
        meetingNumber: 2,
        title: 'Weekly Meeting #2',
        meetingDate: new Date(Date.now() - 7 * 86400000),
        startTime: '14:00',
        endTime: '16:00',
        location: `${gc.district} Community Hall`,
        status: 'CONCLUDED',
        attendanceCount: gc.members - 2,
        totalMembers: gc.members,
        totalSavings: gc.sharePrice * gc.members,
        cashboxBefore: gc.cashboxBalance - (gc.sharePrice * gc.members),
        cashboxAfter: gc.cashboxBalance,
      },
    })

    // Create attendance for concluded meeting
    for (let i = 0; i < members.length; i++) {
      await db.vslaMeetingAttendanceV2.create({
        data: {
          meetingId: concludedMeeting.id,
          memberId: members[i].id,
          present: i < gc.members - 2,
          arrivedLate: i === gc.members - 3,
        },
      })
    }

    // Create cashbox entries
    await db.vslaCashboxEntryV2.create({
      data: {
        groupId: group.id,
        meetingId: concludedMeeting.id,
        type: 'SAVING_IN',
        amount: gc.sharePrice * gc.members,
        balanceBefore: gc.cashboxBalance - (gc.sharePrice * gc.members),
        balanceAfter: gc.cashboxBalance,
        transactionRef: `CB-${Date.now().toString(36).toUpperCase()}-${memberCounter}`,
        description: 'Weekly savings collection',
        recordedByName: 'E-Teller',
      },
    })

    console.log(`✓ ${gc.name} (${gc.district}, ${gc.region}) — ${gc.members} members, cashbox UGX ${gc.cashboxBalance.toLocaleString()}`)
  }

  // Summary
  const totalGroups = await db.vslaGroupV2.count()
  const totalMembers = await db.vslaMemberV2.count()
  const totalKeyHolders = await db.vslaKeyHolderV2.count()
  const totalLoans = await db.vslaLoanV2.count()
  const totalCashbox = await db.vslaGroupV2.aggregate({ _sum: { cashboxBalance: true } })

  console.log('\n✅ Seed complete!')
  console.log(`   Groups: ${totalGroups}`)
  console.log(`   Members: ${totalMembers}`)
  console.log(`   Key Holders: ${totalKeyHolders}`)
  console.log(`   Loans: ${totalLoans}`)
  console.log(`   Total Cashbox: UGX ${(totalCashbox._sum.cashboxBalance || 0).toLocaleString()}`)
  console.log('\n📋 Login details:')
  console.log('   Admin: admin@agrobase.co / password123')
  console.log('   Kilimo Admin: admin@klimotrust.org / password123')
  console.log('   VSLA Officer: vsla@klimotrust.org / password123')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => db.$disconnect())
