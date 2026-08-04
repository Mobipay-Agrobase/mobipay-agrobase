/**
 * Data Consistency Fix Script
 * 1. Add farm lands to farmers who don't have any
 * 2. Seed Kilimo farmers + NSSF registrations
 * 3. Link VSLA V2 members to real farmers by updating their phones
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  console.log('🔧 Fixing data consistency...')

  // ─── 1. Add farm lands for farmers without any ───
  const farmersWithoutLands = await db.farmerProfile.findMany({
    where: { farms: { none: {} }, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, tenantId: true, farmerCode: true },
    take: 30,
  })
  console.log(`Found ${farmersWithoutLands.length} farmers without farm lands`)

  for (const farmer of farmersWithoutLands) {
    const farmName = `${farmer.firstName}'s Farm`
    const sizeHectares = 0.5 + Math.random() * 4.5
    const lat = 0.3 + Math.random() * 1.2  // Uganda latitude range
    const lng = 30.0 + Math.random() * 3.0  // Uganda longitude range

    await db.farmLand.create({
      data: {
        farmerId: farmer.id,
        name: farmName,
        sizeHectares: parseFloat(sizeHectares.toFixed(2)),
        // GeoJSON polygon (simplified — small rectangular plot)
        latitude: lat,
        longitude: lng,
        isActive: true,
      },
    })
  }
  console.log(`✓ Added farm lands for ${farmersWithoutLands.length} farmers`)

  // ─── 2. Seed Kilimo farmers (10 farmers + farm lands) ───
  const kilimoTenant = await db.tenant.findFirst({ where: { name: { contains: 'Klim' } } })
  if (kilimoTenant) {
    console.log(`Seeding farmers for ${kilimoTenant.name}...`)
    
    const kilimoFarmers = [
      { firstName: 'Robert', lastName: 'Mukasa', phone: '+256772000001', village: 'Nakivale' },
      { firstName: 'Sarah', lastName: 'Nabirye', phone: '+256772000002', village: 'Nakivale' },
      { firstName: 'John', lastName: 'Okello', phone: '+256772000003', village: 'Kiryandongo' },
      { firstName: 'Grace', lastName: 'Auma', phone: '+256772000004', village: 'Kiryandongo' },
      { firstName: 'Peter', lastName: 'Kato', phone: '+256772000005', village: 'Kampala' },
      { firstName: 'Mary', lastName: 'Akello', phone: '+256772000006', village: 'Mpigi' },
      { firstName: 'David', lastName: 'Byaruhanga', phone: '+256772000007', village: 'Mbarara' },
      { firstName: 'Esther', lastName: 'Atim', phone: '+256772000008', village: 'Jinja' },
      { firstName: 'Samuel', lastName: 'Ssempa', phone: '+256772000009', village: 'Mukono' },
      { firstName: 'Ruth', lastName: 'Nalwoga', phone: '+256772000010', village: 'Mbale' },
    ]

    for (let i = 0; i < kilimoFarmers.length; i++) {
      const f = kilimoFarmers[i]
      const existing = await db.farmerProfile.findFirst({ where: { phone: f.phone } })
      if (existing) { console.log(`  Farmer ${f.phone} already exists, skipping`); continue }

      const farmer = await db.farmerProfile.create({
        data: {
          tenantId: kilimoTenant.id,
          firstName: f.firstName,
          lastName: f.lastName,
          phone: f.phone,
          farmerCode: `KLF-${String(i + 1).padStart(4, '0')}`,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          status: 'ACTIVE',
          villageName: f.village,
          district: 'Central',
          country: 'Uganda',
          memberType: 'General',
        },
      })

      // Add farm land
      await db.farmLand.create({
        data: {
          farmerId: farmer.id,
          name: `${f.firstName}'s Farm`,
          sizeHectares: parseFloat((1 + Math.random() * 4).toFixed(2)),
          latitude: 0.5 + Math.random(),
          longitude: 30.5 + Math.random(),
          isActive: true,
        },
      })
    }
    console.log(`✓ Seeded ${kilimoFarmers.length} Kilimo farmers with farm lands`)
  }

  // ─── 3. Seed NSSF registrations for Kilimo farmers ───
  if (kilimoTenant) {
    const kilimoFarmerProfiles = await db.farmerProfile.findMany({
      where: { tenantId: kilimoTenant.id, status: 'ACTIVE' },
      take: 10,
    })

    for (const farmer of kilimoFarmerProfiles) {
      const existingReg = await db.nssfRegistration.findFirst({ where: { farmerId: farmer.id } })
      if (existingReg) continue

      await db.nssfRegistration.create({
        data: {
          tenantId: kilimoTenant.id,
          farmerId: farmer.id,
          fullName: `${farmer.firstName} ${farmer.lastName}`,
          phoneNumber: farmer.phone || '',
          nssfNumber: `NSSF/${10000000 + Math.floor(Math.random() * 89999999)}`,
          nationalId: `CF${100000000 + Math.floor(Math.random() * 899999999)}`,
          gender: farmer.gender || 'MALE',
          district: 'Central',
          village: farmer.villageName || '',
          employer: 'Self-employed (Farmer)',
          activationStatus: Math.random() > 0.3 ? 'ACTIVATED' : 'VERIFIED',
          registeredById: 'system',
        },
      })

      // Add 1-3 contributions
      const contribCount = 1 + Math.floor(Math.random() * 3)
      for (let j = 0; j < contribCount; j++) {
        const reg = await db.nssfRegistration.findFirst({ where: { farmerId: farmer.id } })
        if (!reg) continue
        await db.nssfContribution.create({
          data: {
            tenantId: kilimoTenant.id,
            registrationId: reg.id,
            farmerId: farmer.id,
            amount: 10000 + Math.floor(Math.random() * 40000),
            currency: 'UGX',
            paymentMethod: 'MTN_MOMO',
            paymentProvider: 'MTN_DIRECT',
            status: 'COMPLETED',
            contributionDate: new Date(Date.now() - j * 30 * 86400000),
            completedAt: new Date(Date.now() - j * 30 * 86400000),
            channel: 'FIELD_OFFICER',
            initiatedById: 'system',
          },
        })
      }
    }
    
    const regCount = await db.nssfRegistration.count({ where: { tenantId: kilimoTenant.id } })
    const contribCount = await db.nssfContribution.count({ where: { tenantId: kilimoTenant.id } })
    console.log(`✓ Seeded NSSF: ${regCount} registrations, ${contribCount} contributions for Kilimo`)
  }

  // ─── 4. Fix VSLA V2 member phone links ───
  // Update first 10 VSLA V2 members to use real farmer phones
  const realFarmers = await db.farmerProfile.findMany({
    where: { phone: { not: '' }, status: 'ACTIVE' },
    select: { id: true, phone: true, firstName: true, lastName: true },
    take: 20,
  })

  const vslaMembers = await db.vslaMemberV2.findMany({
    take: 20,
    select: { id: true, memberId: true, fullName: true },
  })

  let linked = 0
  for (let i = 0; i < Math.min(realFarmers.length, vslaMembers.length); i++) {
    const farmer = realFarmers[i]
    const member = vslaMembers[i]
    
    // Update the VSLA member's phone to match the farmer's phone
    await db.vslaMemberV2.update({
      where: { id: member.id },
      data: { phone: farmer.phone! },
    })
    linked++
  }
  console.log(`✓ Linked ${linked} VSLA V2 members to real farmers by phone`)

  // ─── Summary ───
  const totalFarmers = await db.farmerProfile.count()
  const farmersWithLands = await db.farmerProfile.count({ where: { farms: { some: {} } } })
  const totalNssfRegs = await db.nssfRegistration.count()
  const totalNssfContribs = await db.nssfContribution.count()
  
  console.log('\n✅ Data consistency fix complete!')
  console.log(`   Total farmers: ${totalFarmers}`)
  console.log(`   Farmers with farm lands: ${farmersWithLands} (${Math.round(farmersWithLands / totalFarmers * 100)}%)`)
  console.log(`   NSSF registrations: ${totalNssfRegs}`)
  console.log(`   NSSF contributions: ${totalNssfContribs}`)
  console.log(`   VSLA members linked to farmers: ${linked}`)
}

main().catch(e => { console.error('❌', e); process.exit(1) }).finally(() => db.$disconnect())
