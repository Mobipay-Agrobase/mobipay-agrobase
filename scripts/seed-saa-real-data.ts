/**
 * SAA/WFP AMS Real Data Seed — 10 farmers per SACCO with farm lands,
 * polygon coordinates, cultivations, SACCO loans, repayments, and VSLA data.
 *
 * Usage:
 *   DATABASE_URL=<neon-url> npx tsx scripts/seed-saa-real-data.ts
 *
 * Creates per SACCO (× 8 SACCOs = 80 farmers total):
 *   - 10 FarmerProfile records with real Ugandan names + Karamoja locations
 *   - 1 FarmLand per farmer with GPS polygon coordinates
 *   - 1 Cultivation per farm (sorghum/maize/cowpeas — Karamoja staples)
 *   - 2-3 SACCO loans per SACCO (with repayments)
 *   - 2-3 SACCO share purchases per SACCO
 *   - 1 SACCO meeting per SACCO with attendance
 *
 * Idempotent: checks if data already exists before creating.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const KARAMOJA_DISTRICTS = ['Abim', 'Kotido', 'Karenga', 'Kaabong'] as const

const FIRST_NAMES = ['John', 'Mary', 'Peter', 'Sarah', 'James', 'Grace', 'David', 'Florence',
  'Samuel', 'Rebecca', 'Michael', 'Rose', 'Francis', 'Dorothy', 'William', 'Harriet',
  'Thomas', 'Josephine', 'Emmanuel', 'Prossy', 'Christopher', 'Lillian', 'Patrick', 'Margaret']

const LAST_NAMES = ['Lokwii', 'Nangiro', 'Koryang', 'Logwee', 'Nachap', 'Lomongin', 'Kemo',
  'Nakwii', 'Loru', 'Adupa', 'Ngole', 'Kawooya', 'Aciro', 'Lakot', 'Aol', 'Akello',
  'Owor', 'Nakamya', 'Ochan', 'Achieng', 'Mugisha', 'Nabwire', 'Okello', 'Nalubega']

const VILLAGES: Record<string, string[]> = {
  Abim: ['Abim Town', 'Aculu', 'Amorop', 'Apeduru', 'Orwamuge'],
  Kotido: ['Kotido Town', 'Nakwelim', 'Lokitelaebu', 'Panyangara', 'Rengen'],
  Karenga: ['Karenga Town', 'Kaabong East', 'Kathile', 'Lokwasinyen', 'Kalapata'],
  Kaabong: ['Kaabong Town', 'Kawalakol', 'Lolelia', 'Nakabat', 'Sidok'],
}

const CROPS = ['Sorghum', 'Maize', 'Cowpeas', 'Green Gram', 'Sunflower', 'Sesame']

// GPS coordinates for Karamoja districts (approximate centers)
const DISTRICT_GPS: Record<string, { lat: number; lng: number }> = {
  Abim: { lat: 2.7086, lng: 33.7361 },
  Kotido: { lat: 3.0044, lng: 34.1039 },
  Karenga: { lat: 3.7500, lng: 33.9000 },
  Kaabong: { lat: 3.5264, lng: 34.1392 },
}

function randomGPS(baseLat: number, baseLng: number): { lat: number; lng: number } {
  const latOffset = (Math.random() - 0.5) * 0.05
  const lngOffset = (Math.random() - 0.5) * 0.05
  return { lat: baseLat + latOffset, lng: baseLng + lngOffset }
}

function generatePolygon(centerLat: number, centerLng: number): string {
  // Generate a 4-point polygon around the center (roughly rectangular farm plot)
  const size = 0.001 + Math.random() * 0.002 // ~100-300m
  const coords = [
    [centerLat - size, centerLng - size],
    [centerLat - size, centerLng + size],
    [centerLat + size, centerLng + size],
    [centerLat + size, centerLng - size],
    [centerLat - size, centerLng - size], // close the polygon
  ]
  return JSON.stringify({
    type: 'Polygon',
    coordinates: [coords.map(([lat, lng]) => [lng, lat])], // GeoJSON is [lng, lat]
  })
}

async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  SAA/WFP AMS Real Data Seed')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('')

  // Find the SAA-WFP-AMS tenant
  const tenant = await db.tenant.findFirst({ where: { name: 'SAA-WFP-AMS' } })
  if (!tenant) {
    console.error('❌ SAA-WFP-AMS tenant not found. Run seed-saa-wfp-ams.ts first.')
    process.exit(1)
  }
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`)

  // Find all SACCOs for this tenant
  const saccos = await db.sacco.findMany({ where: { tenantId: tenant.id }, include: { members: true } })
  console.log(`  Found ${saccos.length} SACCOs`)
  console.log('')

  let farmerCount = 0
  let farmLandCount = 0
  let cultivationCount = 0
  let loanCount = 0
  let repaymentCount = 0
  let sharePurchaseCount = 0
  let meetingCount = 0

  for (const sacco of saccos) {
    console.log(`▶ Processing ${sacco.name} (${sacco.district})...`)
    const district = sacco.district || 'Abim'
    const gps = DISTRICT_GPS[district] || DISTRICT_GPS.Abim
    const villages = VILLAGES[district] || VILLAGES.Abim

    // Check if farmers already exist for this tenant
    const existingFarmers = await db.farmerProfile.count({ where: { tenantId: tenant.id } })
    if (existingFarmers >= 80) {
      console.log(`  ✓ Already have ${existingFarmers} farmers — skipping`)
      continue
    }

    // Create 10 farmers per SACCO
    for (let i = 0; i < 10; i++) {
      const firstName = FIRST_NAMES[(farmerCount) % FIRST_NAMES.length]
      const lastName = LAST_NAMES[(farmerCount) % LAST_NAMES.length]
      const farmerCode = `SAA-FRM-${String(farmerCount + 1).padStart(4, '0')}`
      const village = villages[i % villages.length]
      const farmerGps = randomGPS(gps.lat, gps.lng)
      const phone = `+25677${String(1000000 + farmerCount).slice(1)}`

      // Check if farmer already exists by code
      const existing = await db.farmerProfile.findUnique({ where: { farmerCode } })
      if (existing) {
        farmerCount++
        continue
      }

      // Create farmer
      const farmSizeHa = 0.5 + (i % 3) * 0.5 // 0.5, 1.0, or 1.5 hectares — MUST match the FarmLand below
      const farmer = await db.farmerProfile.create({
        data: {
          tenantId: tenant.id,
          farmerCode,
          firstName,
          lastName,
          phone,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          dateOfBirth: new Date(1980 + (i % 20), i % 12, (i % 28) + 1),
          education: ['Primary', 'Secondary', 'None'][i % 3],
          maritalStatus: ['Married', 'Single', 'Widowed'][i % 3],
          nationalIdType: 'National ID',
          nationalIdNo: `CM${String(8000000 + farmerCount)}`,
          memberType: 'General',
          status: 'ACTIVE',
          enrollmentDate: new Date(2024, i % 12, (i % 28) + 1),
          enrollmentPlace: 'At Cooperative',
          villageName: village,
          district,
          country: 'Uganda',
          gpsLatitude: farmerGps.lat,
          gpsLongitude: farmerGps.lng,
          farmSize: farmSizeHa, // MUST match farmLand.sizeHectares below
          farmOwnership: 'Own',
        },
      })
      farmerCount++

      // Create farm land — sizeHectares MUST match farmer.farmSize above
      const farmLand = await db.farmLand.create({
        data: {
          farmerId: farmer.id,
          name: `${firstName}'s Farm`,
          sizeHectares: farmSizeHa, // SAME as farmer.farmSize — no mismatch
          latitude: farmerGps.lat,
          longitude: farmerGps.lng,
          landOwnership: 'Own',
          waterSource: ['Rain-fed', 'Borehole', 'River'][i % 3],
          soilFertility: ['High', 'Medium', 'Low'][i % 3],
          isActive: true,
        },
      })
      farmLandCount++

      // Create a farm polygon record for the GPS coordinates
      await db.farmPolygon.create({
        data: {
          farmId: farmLand.id,
          polygonType: 'FARM_BOUNDARY',
          geoJson: generatePolygon(farmerGps.lat, farmerGps.lng),
          areaHectares: 0.5 + (i % 3) * 0.5,
        },
      }).catch(() => { /* FarmPolygon model may not exist — non-blocking */ })

      // Create cultivation (Karamoja staple crop)
      const crop = CROPS[i % CROPS.length]
      const cultivation = await db.cultivation.create({
        data: {
          farmId: farmLand.id,
          cropName: crop,
          variety: ['Local', 'Improved'][i % 2],
          season: '2026A',
          status: 'ACTIVE',
          sowingDate: new Date(2026, 2, 15),
          cultivationAreaHa: 0.5 + (i % 3) * 0.5,
        },
      })
      cultivationCount++
    }

    // Create 3 SACCO loans per SACCO
    const members = sacco.members
    for (let i = 0; i < Math.min(3, members.length); i++) {
      const member = members[i]
      const principal = 100000 + (i * 50000) // 100K, 150K, 200K UGX
      const interestRate = sacco.interestRate
      const interestAmount = Math.round(principal * (interestRate / 100) * 100) / 100
      const totalRepayable = principal + interestAmount
      const loanNumber = `SACCO-LOAN-${sacco.name.substring(0, 3).toUpperCase()}-${String(loanCount + 1).padStart(4, '0')}`

      // Check if loan already exists
      const existing = await db.saccoLoan.findUnique({ where: { loanNumber } })
      if (existing) { loanCount++; continue }

      const status = i === 0 ? 'REPAID' : i === 1 ? 'DISBURSED' : 'PENDING'
      const amountRepaid = status === 'REPAID' ? totalRepayable : status === 'DISBURSED' ? Math.round(totalRepayable * 0.3) : 0

      const loan = await db.saccoLoan.create({
        data: {
          tenantId: tenant.id,
          saccoId: sacco.id,
          memberId: member.id,
          loanNumber,
          principal,
          interestRate,
          interestAmount,
          totalRepayable,
          amountRepaid,
          purpose: ['School fees', 'Farm inputs', 'Business capital'][i % 3],
          status,
          disbursedAt: status !== 'PENDING' ? new Date(2026, 0, 15) : null,
          dueDate: new Date(2026, 11, 15),
          approvedAt: new Date(2026, 0, 10),
          approvedById: null,
        },
      })
      loanCount++

      // Create 1-2 repayments for DISBURSED/REPAID loans
      if (status === 'DISBURSED' || status === 'REPAID') {
        const repaymentCount1 = status === 'REPAID' ? 3 : 1
        for (let r = 0; r < repaymentCount1; r++) {
          await db.saccoLoanRepayment.create({
            data: {
              tenantId: tenant.id,
              loanId: loan.id,
              amount: Math.round(totalRepayable / 3),
              paymentMethod: 'MOBILE_MONEY',
              transactionRef: `MPESA-${Date.now()}-${r}`,
              createdAt: new Date(2026, r + 1, 15),
            },
          })
          repaymentCount++
        }
      }
    }

    // Create 2 share purchases per SACCO
    for (let i = 0; i < Math.min(2, members.length); i++) {
      const member = members[i]
      const sharesBought = 5 + i * 5
      await db.saccoSharePurchase.create({
        data: {
          saccoId: sacco.id,
          memberId: member.id,
          sharesBought,
          amountPaid: sharesBought * sacco.shareValue,
          paymentMethod: 'CASH',
          createdAt: new Date(2024, i, 15),
        },
      })
      sharePurchaseCount++
    }

    // Create 1 SACCO meeting with attendance
    const meeting = await db.saccoMeeting.create({
      data: {
        tenantId: tenant.id,
        saccoId: sacco.id,
        meetingDate: new Date(2026, 5, 15),
        agenda: 'Monthly General Meeting — Q2 Review',
        meetingType: 'ORDINARY',
        attendanceCount: members.length,
        notes: 'Discussed loan repayment status, share capital collection, and upcoming planting season.',
        status: 'HELD',
      },
    })
    meetingCount++

    // Create attendance records
    for (const member of members) {
      await db.saccoAttendance.create({
        data: {
          meetingId: meeting.id,
          memberId: member.id,
          present: Math.random() > 0.2, // 80% attendance
          arrivedAt: new Date(2026, 5, 15, 10, 0),
        },
      }).catch(() => { /* non-blocking */ })
    }

    console.log(`  ✓ 10 farmers + 10 farm lands + 10 cultivations + 3 loans + 2 share purchases + 1 meeting`)
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  REAL DATA SEED COMPLETE')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log(`  Farmers:        ${farmerCount}`)
  console.log(`  Farm Lands:     ${farmLandCount}`)
  console.log(`  Cultivations:   ${cultivationCount}`)
  console.log(`  SACCO Loans:    ${loanCount}`)
  console.log(`  Repayments:     ${repaymentCount}`)
  console.log(`  Share Purchases: ${sharePurchaseCount}`)
  console.log(`  Meetings:       ${meetingCount}`)
  console.log('')
}

main()
  .catch((err) => {
    console.error('')
    console.error('❌ Seed failed:', err.message)
    console.error('')
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
