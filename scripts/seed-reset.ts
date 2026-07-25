import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding ReSET MarketLink demo data...')

  // Cleanup existing ReSET data
  await db.resetVslaLinkage.deleteMany()
  await db.resetConsortiumReport.deleteMany()
  await db.resetDuplicateFlag.deleteMany()
  await db.resetSettlement.deleteMany()
  await db.resetFieldAgent.deleteMany()
  await db.resetDisbursementBatch.deleteMany()
  await db.resetCashDisbursement.deleteMany()
  await db.resetMerchantPayout.deleteMany()
  await db.resetVoucherRedemption.deleteMany()
  await db.resetVoucher.deleteMany()
  await db.resetHouseholdMember.deleteMany()
  await db.resetBeneficiary.deleteMany()

  // Get ReSET tenant
  const tenant = await db.tenant.findFirst({ where: { name: { contains: 'ReSET' } } })
  if (!tenant) { console.error('ReSET tenant not found'); process.exit(1) }

  // 1. Create settlements
  const settlements = [
    { name: 'Kiryandongo', district: 'Kiryandongo', region: 'Northern', latitude: 1.4833, longitude: 32.2500 },
    { name: 'Kyangwali', district: 'Kikuube', region: 'Western', latitude: 1.0500, longitude: 30.6333 },
    { name: 'Nakivale', district: 'Isingiro', region: 'Western', latitude: -0.8167, longitude: 30.9167 },
    { name: 'Kyaka II', district: 'Kyegegwa', region: 'Western', latitude: 0.3333, longitude: 30.7667 },
  ]

  for (const s of settlements) {
    await db.resetSettlement.create({ data: { ...s, country: 'Uganda', isActive: true, totalHouseholds: Math.floor(Math.random() * 8000) + 2000 } })
  }
  console.log(`✓ Created ${settlements.length} settlements`)

  // 2. Create field agents
  const agentNames = ['James Okello', 'Sarah Nakato', 'Peter Mukasa', 'Grace Auma', 'David Byaruhanga', 'Mary Akello', 'John Ssempa', 'Ruth Nabirye']
  const agentTypes = ['SWISS_CONTACT', 'MOBIPAY', 'E_TELLER']
  
  for (let i = 0; i < agentNames.length; i++) {
    await db.resetFieldAgent.create({
      data: {
        agentCode: `AGENT-${String(i + 1).padStart(3, '0')}`,
        tenantId: tenant.id,
        fullName: agentNames[i],
        phone: `+2567${String(30000000 + i * 1000).padStart(8, '0')}`,
        agentType: agentTypes[i % 3],
        settlement: settlements[i % 4].name,
        village: `Village ${i + 1}`,
        status: 'ACTIVE',
        trainedAt: new Date(Date.now() - 14 * 86400000),
        beneficiariesEnrolled: Math.floor(Math.random() * 500),
        merchantsOnboarded: Math.floor(Math.random() * 20),
        vouchersDistributed: Math.floor(Math.random() * 200),
      },
    })
  }
  console.log(`✓ Created ${agentNames.length} field agents`)

  // 3. Create beneficiaries (50 across settlements)
  const benefNames = [
    'John Mukasa', 'Mary Nabirye', 'Peter Okello', 'Grace Auma', 'Samuel Kato', 'Sarah Nalwoga', 'James Ssempa', 'Ruth Akello',
    'David Byaruhanga', 'Esther Atim', 'Joseph Wasswa', 'Hannah Nakato', 'Moses Ochen', 'Rebecca Adoch', 'Isaac Okware',
    'Deborah Nabukenya', 'Michael Opio', 'Janet Aber', 'Paul Ssali', 'Patricia Aciro', 'Stephen Odongo', 'Florence Lamwaka',
    'Robert Bbosa', 'Agnes Akot', 'Daniel Eotu', 'Margaret Letaru', 'Francis Emuge', 'Beatrice Adoch', 'Patrick Otim', 'Carol Akello',
    'Simon Peter', 'Joyce Nakimera', 'Alex Tumusiime', 'Diana Nabukenya', 'Emmanuel Okello', 'Phoebe Namuli', 'George Emaru',
    'Vicky Atim', 'Sam Otim', 'Lillian Akello', 'Bosco Mukasa', 'Nancy Adoch', 'Julius Ochen', 'Susan Nabirye', 'Moses Opio',
    'Racheal Auma', 'Denis Ssali', 'Patience Akello', 'Solomon Okware', 'Mercy Lamwaka',
  ]

  const partners = ['SWISS_CONTACT', 'CARE', 'SCI']
  let benCount = 0
  const beneficiaries = []

  for (let i = 0; i < benefNames.length; i++) {
    const settlement = settlements[i % 4].name
    const partner = partners[i % 3]
    const beneficiaryId = `RESET-BEN-${String(i + 1).padStart(5, '0')}`
    const householdId = `HH-${Date.now().toString(36).toUpperCase()}-${i}`
    const pin = String(2000 + i)
    const pinHash = await bcrypt.hash(pin, 12)
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE'

    const ben = await db.resetBeneficiary.create({
      data: {
        tenantId: tenant.id,
        beneficiaryId,
        householdId,
        fullName: benefNames[i],
        phone: `+2567${String(40000000 + i * 100).padStart(8, '0')}`,
        nationalId: `CF${100000000 + i}`,
        refugeeId: i % 3 === 0 ? `UNHCR-${String(500000 + i)}` : null,
        gender,
        settlement,
        village: `Village ${Math.floor(i / 5) + 1}`,
        enrolledBy: partner,
        agentId: `AGENT-${String((i % 8) + 1).padStart(3, '0')}`,
        pinHash,
        walletBalance: i % 4 === 0 ? 50000 : 0,
        voucherBalance: 0,
        status: 'ACTIVE',
      },
    })
    beneficiaries.push({ ...ben, pin })
    benCount++

    // Add 2-3 household members
    const memberCount = 2 + (i % 3)
    for (let j = 0; j < memberCount; j++) {
      await db.resetHouseholdMember.create({
        data: {
          beneficiaryId: ben.id,
          fullName: `${benefNames[(i + j + 1) % benefNames.length].split(' ')[0]} ${benefNames[i].split(' ')[1]}`,
          relationship: j === 0 ? 'SPOUSE' : 'CHILD',
          gender: j % 2 === 0 ? 'FEMALE' : 'MALE',
          age: j === 0 ? 25 + (i % 15) : 5 + (j * 3),
        },
      })
    }
  }
  console.log(`✓ Created ${benCount} beneficiaries with household members`)

  // 4. Create merchants (15 across settlements)
  const merchantData = [
    { name: 'Nakivale General Store', owner: 'Hassan Ibrahim', type: 'GROCERY', settlement: 'Nakivale' },
    { name: 'Kiryandongo Agro-Vet', owner: 'Sarah Nakato', type: 'AGRICULTURE', settlement: 'Kiryandongo' },
    { name: 'Kyangwali Hardware', owner: 'Peter Mugisa', type: 'HARDWARE', settlement: 'Kyangwali' },
    { name: 'Kyaka Pharmacy', owner: 'Dr. Mary Atim', type: 'PHARMACY', settlement: 'Kyaka II' },
    { name: 'Nakivale Farm Inputs', owner: 'John Mukasa', type: 'AGRICULTURE', settlement: 'Nakivale' },
    { name: 'Kiryandongo Food Mart', owner: 'Grace Auma', type: 'GROCERY', settlement: 'Kiryandongo' },
    { name: 'Kyangwali General', owner: 'David Byaruhanga', type: 'GROCERY', settlement: 'Kyangwali' },
    { name: 'Kyaka Farm Supply', owner: 'Esther Adoch', type: 'AGRICULTURE', settlement: 'Kyaka II' },
    { name: 'Nakivale Tools Shop', owner: 'Samuel Kato', type: 'HARDWARE', settlement: 'Nakivale' },
    { name: 'Kiryandongo Medical', owner: 'Dr. James Okello', type: 'PHARMACY', settlement: 'Kiryandongo' },
    { name: 'Kyangwali Seed Center', owner: 'Ruth Akello', type: 'AGRICULTURE', settlement: 'Kyangwali' },
    { name: 'Kyaka General Store', owner: 'Moses Ochen', type: 'GROCERY', settlement: 'Kyaka II' },
    { name: 'Nakivale Pharmacy', owner: 'Dr. Patricia Aciro', type: 'PHARMACY', settlement: 'Nakivale' },
    { name: 'Kiryandongo Hardware', owner: 'Stephen Odongo', type: 'HARDWARE', settlement: 'Kiryandongo' },
    { name: 'Kyangwali Food Center', owner: 'Florence Lamwaka', type: 'GROCERY', settlement: 'Kyangwali' },
  ]

  for (let i = 0; i < merchantData.length; i++) {
    const m = merchantData[i]
    const status = i < 10 ? 'APPROVED' : 'PENDING'
    await db.resetMerchant.create({
      data: {
        merchantCode: `MER-${String(i + 1).padStart(4, '0')}`,
        tenantId: tenant.id,
        businessName: m.name,
        ownerName: m.owner,
        phone: `+2567${String(50000000 + i * 100).padStart(8, '0')}`,
        settlement: m.settlement,
        businessType: m.type,
        itemsSold: JSON.stringify(['seeds', 'tools', 'food', 'medicine'].slice(0, 2 + (i % 3))),
        momoNumber: `+2567${String(50000000 + i * 100).padStart(8, '0')}`,
        payoutFrequency: 'WEEKLY',
        payoutAmount: Math.floor(Math.random() * 500000),
        status,
        approvedAt: status === 'APPROVED' ? new Date(Date.now() - 7 * 86400000) : null,
        approvedBy: status === 'APPROVED' ? 'admin@resetconsortium.org' : null,
      },
    })
  }
  console.log(`✓ Created ${merchantData.length} merchants`)

  // 5. Create vouchers (30 in various states)
  const voucherTypes = ['ASSET', 'CASH', 'FOOD', 'INPUT']
  let voucherCount = 0

  for (let i = 0; i < 30; i++) {
    const beneficiary = beneficiaries[i % beneficiaries.length]
    const type = voucherTypes[i % 4]
    const amount = [50000, 100000, 75000, 150000, 20000, 30000][i % 6]
    const status = i < 10 ? 'ISSUED' : i < 18 ? 'REDEEMED' : i < 25 ? 'EXPIRED' : 'ISSUED'
    const voucherCode = `VC-2026-${String(i + 1).padStart(6, '0')}`
    const expiryDate = new Date(Date.now() + (i < 15 ? 60 : -10) * 86400000)

    const voucher = await db.resetVoucher.create({
      data: {
        voucherCode,
        beneficiaryId: beneficiary.id,
        issuedBy: partners[i % 3],
        agentId: `AGENT-${String((i % 8) + 1).padStart(3, '0')}`,
        type,
        amount,
        allowedItems: type === 'INPUT' ? JSON.stringify(['seeds', 'fertilizer']) : type === 'FOOD' ? JSON.stringify(['rice', 'beans', 'oil']) : null,
        allowedLocations: i % 3 === 0 ? JSON.stringify([beneficiary.settlement]) : null,
        expiryDate,
        status,
        issuedAt: new Date(Date.now() - (15 + i) * 86400000),
        redeemedAt: status === 'REDEEMED' ? new Date(Date.now() - (5 + i % 10) * 86400000) : null,
        redeemedAtMerchantId: status === 'REDEEMED' ? `MER-${String((i % 10) + 1).padStart(4, '0')}` : null,
      },
    })

    // Update beneficiary voucher balance for ISSUED vouchers
    if (status === 'ISSUED') {
      await db.resetBeneficiary.update({ where: { id: beneficiary.id }, data: { voucherBalance: { increment: amount } } })
    }

    // Create redemption record for REDEEMED vouchers
    if (status === 'REDEEMED') {
      const merchantId = `MER-${String((i % 10) + 1).padStart(4, '0')}`
      const merchant = await db.resetMerchant.findUnique({ where: { merchantCode: merchantId } })
      if (merchant) {
        await db.resetVoucherRedemption.create({
          data: {
            voucherId: voucher.id,
            beneficiaryId: beneficiary.id,
            merchantId: merchant.id,
            amount,
            pinVerified: true,
            status: 'COMPLETED',
            redeemedAt: new Date(Date.now() - (5 + i % 10) * 86400000),
          },
        })
      }
    }
    voucherCount++
  }
  console.log(`✓ Created ${voucherCount} vouchers`)

  // 6. Create cash disbursements (20)
  for (let i = 0; i < 20; i++) {
    const beneficiary = beneficiaries[i % beneficiaries.length]
    const amount = [100000, 150000, 200000, 80000, 120000][i % 5]
    const status = i < 12 ? 'CONFIRMED' : i < 16 ? 'SENT' : 'PENDING'

    await db.resetCashDisbursement.create({
      data: {
        batchId: `BATCH-2026-${String(Math.floor(i / 10) + 1).padStart(3, '0')}`,
        beneficiaryId: beneficiary.id,
        partner: partners[i % 3],
        amount,
        paymentMethod: i % 2 === 0 ? 'MTN_MOMO' : 'AIRTEL_MONEY',
        status,
        sentAt: status !== 'PENDING' ? new Date(Date.now() - (3 + i) * 86400000) : null,
        confirmedAt: status === 'CONFIRMED' ? new Date(Date.now() - (1 + i % 3) * 86400000) : null,
        momoRef: status !== 'PENDING' ? `MOMO-${Date.now()}-${i}` : null,
        initiatedBy: 'admin@resetconsortium.org',
      },
    })
  }
  console.log(`✓ Created 20 cash disbursements`)

  // Summary
  const totalBen = await db.resetBeneficiary.count()
  const totalVouchers = await db.resetVoucher.count()
  const totalMerchants = await db.resetMerchant.count()
  const totalAgents = await db.resetFieldAgent.count()

  console.log(`\n✅ ReSET seed complete!`)
  console.log(`   Beneficiaries: ${totalBen}`)
  console.log(`   Vouchers: ${totalVouchers}`)
  console.log(`   Merchants: ${totalMerchants}`)
  console.log(`   Field Agents: ${totalAgents}`)
  console.log(`   Settlements: ${settlements.length}`)
  console.log(`\n📋 Login: admin@resetconsortium.org / password123`)
}

main().catch(e => { console.error('❌', e); process.exit(1) }).finally(() => db.$disconnect())
