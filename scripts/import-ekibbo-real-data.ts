/**
 * EKIBBO Real Data Import — Imports 1,985 real farmers from 4 CSV files.
 *
 * Usage:
 *   DATABASE_URL=<neon-url> npx tsx scripts/import-ekibbo-real-data.ts
 *
 * Files:
 *   1. CLEAN_DATA_494_STANDARDIZED.csv (492 farmers, 147 cols — demographics)
 *   2. Enabel_502.csv (497 farmers, ~50 real cols — demographics + contact)
 *   3. Enable_306.csv (292 farmers, 257 cols — demographics + crop data)
 *   4. Registration Cycle 1.csv (704 farmers, 149 cols — crop-specific data)
 *
 * Strategy:
 *   - Deduplicate by farmer code (keep the most complete record)
 *   - Create FarmerProfile + FarmLand + Cultivation + CropProduction
 *   - Encrypt phone numbers with field-crypto
 *   - Convert acres to hectares (× 0.404686)
 *   - Prefix phone numbers with +256
 */

import { PrismaClient } from '@prisma/client'
import { encryptField } from '../src/lib/security/field-crypto'
import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'

const db = new PrismaClient()

const CSV_DIR = '/home/z/my-project/upload'
const FILES = [
  { name: 'CLEAN_DATA_494_STANDARDIZED.csv', encoding: 'utf-8-sig', type: 'demographic' },
  { name: 'Enabel_502.csv', encoding: 'latin-1', type: 'demographic' },
  { name: 'Enable_306.csv', encoding: 'latin-1', type: 'demographic+crop' },
  { name: 'Registration Cycle 1.csv', encoding: 'utf-8-sig', type: 'crop' },
]

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const n = parseFloat(val.replace(/,/g, '').replace(/[^\d.-]/g, ''))
  return isNaN(n) ? null : n
}

function parseDate(val: string | undefined): Date | null {
  if (!val || val.trim() === '') return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function formatPhone(val: string | undefined): string | null {
  if (!val || val.trim() === '') return null
  let phone = val.trim().replace(/\s+/g, '')
  // If starts with 0, replace with +256
  if (phone.startsWith('0')) phone = '+256' + phone.substring(1)
  // If starts with 256, add +
  else if (phone.startsWith('256')) phone = '+' + phone
  // If just digits (9+), prefix +256
  else if (/^\d{9,}$/.test(phone)) phone = '+256' + phone
  return phone
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  // Last part is lastName, rest is firstName (handles "Lubega paul" → Paul Lubega)
  const lastName = parts[parts.length - 1]
  const firstName = parts.slice(0, -1).join(' ')
  // Capitalize first letter
  return {
    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
    lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase(),
  }
}

function acresToHa(acres: number | null): number | null {
  if (acres === null) return null
  return Math.round(acres * 0.404686 * 100) / 100
}

interface FarmerRecord {
  farmerCode: string
  firstName: string
  lastName: string
  phone: string | null
  gender: string | null
  dateOfBirth: Date | null
  education: string | null
  maritalStatus: string | null
  memberType: string | null
  district: string | null
  subCounty: string | null
  villageName: string | null
  gpsLatitude: number | null
  gpsLongitude: number | null
  gpsAltitude: number | null
  farmSize: number | null // in acres from CSV → convert to hectares
  landOwnership: string | null
  familyMembers: number | null
  childrenUnder18: number | null
  schoolGoingChildren: number | null
  spouseName: string | null
  monthlyHouseholdIncome: number | null
  annualHouseholdIncome: number | null
  monthlyFarmIncome: number | null
  annualFarmIncome: number | null
  primaryIncomeSource: string | null
  secondaryIncomeSource: string | null
  extensionOfficer: string | null
  orgMembership: string | null
  orgNames: string | null
  livingConditions: string | null
  fuelType: string | null
  fuelCostMonthly: number | null
  mealsPerDay: string | null
  dailyCostOfLiving: string | null
  hasUnusedLand: boolean | null
  unusedLandSize: number | null
  // Crop data (from Registration Cycle 1 / Enable_306)
  crops: Array<{
    cropName: string
    variety: string | null
    landPercentage: number | null
    yearsInFarming: number | null
    treeCount: number | null
    yieldPerTreeKg: number | null
    majorBuyers: string | null
    pricePerKg: number | null
    paymentMethod: string | null
    incomeContributionPct: number | null
    challenges: string | null
    homeConsumption: boolean | null
  }>
}

async function readCSV(filePath: string, encoding: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = []
    fs.createReadStream(filePath)
      .pipe(csv({ skipLines: 0 }))
      .on('data', (data: Record<string, string>) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err: Error) => reject(err))
  })
}

function mapRow(row: Record<string, string>, fileType: string): FarmerRecord | null {
  const farmerCode = (row['Farmer Code'] || row['farmer_code'] || '').trim()
  if (!farmerCode) return null

  const farmerName = (row['Farmer Name'] || row['farmer_name'] || '').trim()
  if (!farmerName) return null

  const { firstName, lastName } = splitName(farmerName)

  // Phone — try multiple column names
  const phoneRaw = row['a'] || row['Contact 1'] || row['contact_1'] || row['Contact 2'] || ''
  const phone = formatPhone(phoneRaw)

  // GPS
  const gpsLat = parseNum(row['_GPS_latitude'] || row['GPS_latitude'])
  const gpsLng = parseNum(row['_GPS_longitude'] || row['GPS_longitude'])
  const gpsAlt = parseNum(row['_GPS_altitude'] || row['GPS_altitude'])

  // Land
  const landSize = parseNum(row['What is the size of your land?'] || row['land_size'])
  const landUnit = (row['Units'] || row['units'] || 'Acres').trim()
  const farmSize = landUnit.toLowerCase().includes('acre') ? acresToHa(landSize) : landSize

  // Unused land
  const unusedLandRaw = (row['Do you have unused land available for farming?'] || '').trim()
  const hasUnusedLand = unusedLandRaw.toLowerCase() === 'yes' ? true : unusedLandRaw.toLowerCase() === 'no' ? false : null
  const unusedLandSize = parseNum(row['If yes, what is the size of the land?'])

  // Crops (from Registration Cycle 1 / Enable_306)
  const crops: FarmerRecord['crops'] = []
  const cropConfig = [
    { name: 'Coffee', growField: 'Do you grow coffee', varietyField: 'Variaties of coffee you grow', pctField: '% of land dediated to coffee', yearsField: 'Years spent in farming coffee', treesField: 'Number of productive coffee trees', yieldField: 'Estimated coffee yield (kg) per tree', buyersField: 'Major Coffee buyers', priceField: 'Price per kg of coffee', paymentField: 'Methods of payment after selling coffee', incomeField: '% of income Coffee contributes to the household', challengeField: 'Common challenges faced in coffee farming' },
    { name: 'Cocoa', growField: 'Do you grow Cocoa', varietyField: 'Varieties of the Cocoa', pctField: '% of land dedicated to cocoa', yearsField: 'Years spent in cocoa farmimg', treesField: 'Number of productive cocoa trees', yieldField: 'Estimated yield (Kgs) of Cocoa per tree in the past 12 months', buyersField: 'Major Cocoa buyers', priceField: 'Price you sell cocoa per kg', paymentField: 'Methods of payment aftr selling cocoa', incomeField: '% of income cocoa contributies to the household', challengeField: 'Common  challenge you face face in cocoa farming' },
    { name: 'Avocado', growField: 'Do you grow Avocado', varietyField: 'Variety/s of the Avocado do you grow', pctField: '% of land dedicated to avocado', yearsField: 'Years spent in avocado farming', treesField: 'Number of productive avaocado trees', yieldField: 'Column1Estimated yield (Kgs) of each of the avocado in the past 12 months', buyersField: null, priceField: 'Price per kg of avocado', paymentField: 'Methods of payment after selling avaocado', incomeField: '% of income avaocado contributes to the household', challengeField: 'Coomon challenge faced in avocado farming' },
    { name: 'Vanilla', growField: 'Do you grow Vanilla', varietyField: null, pctField: '% of land dedicated to vanilla', yearsField: 'Yaers spent in vanilla farmimg', treesField: 'Number of productive vanilla trees', yieldField: 'Estimated yield (Kgs) of each of the Vanilla in the past 12 months', buyersField: null, priceField: 'How much do you sell a kilogram of Vanilla', paymentField: 'Method of payment after sale of vanilla', incomeField: '% of income vanilla contributes to the household', challengeField: 'Common challenges you face in  Vanilla farming' },
    { name: 'Cassava', growField: 'Do you grow Cassava', varietyField: 'Variety/s of cassava', pctField: '% of land dedicated to casaava', yearsField: 'Years spent in cassava farming', treesField: 'Number of productive casaava stems', yieldField: 'Estimated yield (Kgs) per cassava stem  in the past 12 months', buyersField: null, priceField: 'Price per kg of casaava', paymentField: 'Methods of payment after selling cassava', incomeField: '% of income cassava contributes to the household', challengeField: 'Common challenges faced in cassava farming' },
    { name: 'Jackfruit', growField: 'Do you grow Jackfruit', varietyField: 'Variety/s of  Jackfruit', pctField: '% of land dedicated to jackfruit', yearsField: 'Yaers spent in jackfruit farming', treesField: 'Number of productive jackfruit trees', yieldField: 'Estimated yield (Kgs) of each of the Jackfruit in the past 12 months', buyersField: null, priceField: 'Price per keg of the jackfruit', paymentField: 'Method of payment after sale of the jackfruit', incomeField: '% of income jackfruit contributes to the household', challengeField: 'Common challenge faced in jackfruit farming' },
    { name: 'Oyster Nuts', growField: 'Do you grow Oyster nuts', varietyField: 'Aariety/s of Oyster nuts', pctField: '% of land dedicated to Oyster nuts', yearsField: 'Years spent in Osyter nuts farming', treesField: 'Number of productive Osyter nut trees', yieldField: 'Estimated yield (Kgs) of each of the Oyster nuts in the past 12 months', buyersField: null, priceField: 'Price per kilogram of Oyster nuts', paymentField: 'Method of payment after sale of Osyter nuts', incomeField: '% of income Osyternut contributes to the household', challengeField: null },
  ]

  for (const cc of cropConfig) {
    const grows = (row[cc.growField] || '').trim().toLowerCase()
    if (grows === 'yes' || grows === 'true' || grows === '1') {
      crops.push({
        cropName: cc.name,
        variety: cc.varietyField ? (row[cc.varietyField] || '').trim() || null : null,
        landPercentage: cc.pctField ? parseNum(row[cc.pctField]) : null,
        yearsInFarming: cc.yearsField ? parseNum(row[cc.yearsField]) : null,
        treeCount: cc.treesField ? parseNum(row[cc.treesField]) : null,
        yieldPerTreeKg: cc.yieldField ? parseNum(row[cc.yieldField]) : null,
        majorBuyers: cc.buyersField ? (row[cc.buyersField] || '').trim() || null : null,
        pricePerKg: cc.priceField ? parseNum(row[cc.priceField]) : null,
        paymentMethod: cc.paymentField ? (row[cc.paymentField] || '').trim() || null : null,
        incomeContributionPct: cc.incomeField ? parseNum(row[cc.incomeField]) : null,
        challenges: cc.challengeField ? (row[cc.challengeField] || '').trim() || null : null,
        homeConsumption: null,
      })
    }
  }

  return {
    farmerCode,
    firstName,
    lastName,
    phone,
    gender: (row['Gender'] || '').trim() || null,
    dateOfBirth: parseDate(row['Date of Birth']),
    education: (row['Highest level of education?'] || row['What is your highest level of education'] || '').trim() || null,
    maritalStatus: (row['Marital Status'] || '').trim() || null,
    memberType: (row['Category'] || '').trim() || null,
    district: (row['District'] || '').trim() || null,
    subCounty: (row['Subcounty'] || row['Sub County'] || '').trim() || null,
    villageName: (row['Village'] || '').trim() || null,
    gpsLatitude: gpsLat,
    gpsLongitude: gpsLng,
    gpsAltitude: gpsAlt,
    farmSize,
    landOwnership: (row['What is the nature of ownership of the land?'] || '').trim() || null,
    familyMembers: parseNum(row['Size of the household, including all family members and dependents']),
    childrenUnder18: parseNum(row['Number of children are in this household']),
    schoolGoingChildren: parseNum(row['Number of children that attend school']),
    spouseName: (row["What is your wife's name?"] || '').trim() || null,
    monthlyHouseholdIncome: parseNum(row['Total monthly household income (shs)']),
    annualHouseholdIncome: parseNum(row['Gross annual household income (shs)']),
    monthlyFarmIncome: parseNum(row['Average monthly income from farming only?']),
    annualFarmIncome: parseNum(row['Gross annual income from farming only']),
    primaryIncomeSource: (row['Primary source of income for your household'] || row['Which of the following is your main source of income?'] || '').trim() || null,
    secondaryIncomeSource: (row['Secondary source of income for your household'] || '').trim() || null,
    extensionOfficer: (row['Extension Officer'] || row['Extension officer'] || row['Extension officer/Survey Assistant name'] || '').trim() || null,
    orgMembership: (row['Are you a member of the following organisations?'] || row['Membership to an organisation'] || '').trim() || null,
    orgNames: (row['Could you please provide the names of the organisations you are currently a member of?'] || row['Names of the organisatiosn affiliated to'] || '').trim() || null,
    livingConditions: (row['How would you describe the overall living conditions in your household?'] || '').trim() || null,
    fuelType: (row['Fuel type primarily used by the household form cooking'] || '').trim() || null,
    fuelCostMonthly: parseNum(row['How much does your Household spend on fuel per month (shs).']),
    mealsPerDay: (row['No of meals  household haves averagely on a typical day'] || '').trim() || null,
    dailyCostOfLiving: (row['Household daily cost of living?'] || '').trim() || null,
    hasUnusedLand,
    unusedLandSize,
    crops,
  }
}

async function main() {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  EKIBBO Real Data Import')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('')

  // Find EKIBBO tenant
  const tenant = await db.tenant.findFirst({ where: { name: 'EKIBBO Coffee Exporters' } })
  if (!tenant) {
    console.error('❌ EKIBBO tenant not found')
    process.exit(1)
  }
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`)

  // Read all CSV files and deduplicate by farmer code
  const farmerMap = new Map<string, FarmerRecord>()
  let totalRows = 0

  for (const file of FILES) {
    const filePath = path.join(CSV_DIR, file.name)
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ File not found: ${file.name} — skipping`)
      continue
    }

    console.log(`\n▶ Reading ${file.name}...`)
    const rows = await readCSV(filePath, file.encoding)
    console.log(`  Rows: ${rows.length}`)

    for (const row of rows) {
      totalRows++
      const record = mapRow(row, file.type)
      if (!record) continue

      // Deduplicate — keep the record with more crop data, or the first one
      const existing = farmerMap.get(record.farmerCode)
      if (!existing) {
        farmerMap.set(record.farmerCode, record)
      } else {
        // Merge — if the new record has crops and existing doesn't, replace
        if (record.crops.length > existing.crops.length) {
          farmerMap.set(record.farmerCode, record)
        } else if (record.crops.length > 0 && existing.crops.length === 0) {
          // Merge crop data into existing
          existing.crops = record.crops
          farmerMap.set(record.farmerCode, existing)
        }
      }
    }
  }

  console.log(`\n  Total CSV rows: ${totalRows}`)
  console.log(`  Unique farmers (deduplicated): ${farmerMap.size}`)
  console.log('')

  // Import farmers
  let imported = 0
  let farmLands = 0
  let cultivations = 0
  let cropProductions = 0
  let errors = 0

  const farmers = Array.from(farmerMap.values())

  for (let i = 0; i < farmers.length; i++) {
    const f = farmers[i]
    try {
      // Check if farmer already exists (by farmerCode)
      const existing = await db.farmerProfile.findUnique({ where: { farmerCode: f.farmerCode } })
      if (existing) {
        // Skip — already imported
        continue
      }

      // Create farmer
      const farmer = await db.farmerProfile.create({
        data: {
          tenantId: tenant.id,
          farmerCode: f.farmerCode,
          firstName: f.firstName,
          lastName: f.lastName,
          phone: f.phone ? encryptField(f.phone) || f.phone : '0000000000',
          gender: f.gender,
          dateOfBirth: f.dateOfBirth,
          education: f.education,
          maritalStatus: f.maritalStatus,
          memberType: f.memberType || 'General',
          status: 'ACTIVE',
          enrollmentDate: new Date(),
          country: 'Uganda',
          district: f.district,
          commune: f.subCounty,
          villageName: f.villageName,
          gpsLatitude: f.gpsLatitude,
          gpsLongitude: f.gpsLongitude,
          gpsAltitude: f.gpsAltitude,
          farmSize: f.farmSize,
          farmOwnership: f.landOwnership,
          familyMembers: f.familyMembers,
          childrenUnder18: f.childrenUnder18,
          schoolGoingChildren: f.schoolGoingChildren,
          spouseName: f.spouseName,
          monthlyHouseholdIncome: f.monthlyHouseholdIncome,
          annualHouseholdIncome: f.annualHouseholdIncome,
          monthlyFarmIncome: f.monthlyFarmIncome,
          annualFarmIncome: f.annualFarmIncome,
          primaryIncomeSource: f.primaryIncomeSource,
          secondaryIncomeSource: f.secondaryIncomeSource,
          extensionOfficer: f.extensionOfficer,
          orgMembership: f.orgMembership,
          orgNames: f.orgNames,
          livingConditions: f.livingConditions,
          fuelType: f.fuelType,
          fuelCostMonthly: f.fuelCostMonthly,
          mealsPerDay: f.mealsPerDay,
          dailyCostOfLiving: f.dailyCostOfLiving,
          hasUnusedLand: f.hasUnusedLand,
          unusedLandSize: f.unusedLandSize,
        },
      })
      imported++

      // Create farm land
      if (f.farmSize !== null || f.gpsLatitude !== null) {
        const farmLand = await db.farmLand.create({
          data: {
            farmerId: farmer.id,
            name: `${f.firstName}'s Farm`,
            sizeHectares: f.farmSize,
            latitude: f.gpsLatitude,
            longitude: f.gpsLongitude,
            landOwnership: f.landOwnership,
            isActive: true,
          },
        })
        farmLands++

        // Create cultivations for each crop
        for (const crop of f.crops) {
          await db.cultivation.create({
            data: {
              farmId: farmLand.id,
              cropName: crop.cropName,
              variety: crop.variety,
              season: '2026A',
              status: 'ACTIVE',
              cultivationAreaHa: crop.landPercentage ? (f.farmSize || 1) * (crop.landPercentage / 100) : null,
            },
          })
          cultivations++

          // Create crop production record
          await db.cropProduction.create({
            data: {
              farmerId: farmer.id,
              cropName: crop.cropName,
              variety: crop.variety,
              landPercentage: crop.landPercentage,
              yearsInFarming: crop.yearsInFarming,
              treeCount: crop.treeCount,
              yieldPerTreeKg: crop.yieldPerTreeKg,
              majorBuyers: crop.majorBuyers,
              pricePerKg: crop.pricePerKg,
              paymentMethod: crop.paymentMethod,
              incomeContributionPct: crop.incomeContributionPct,
              challenges: crop.challenges,
              homeConsumption: crop.homeConsumption,
            },
          })
          cropProductions++
        }
      }

      if (imported % 100 === 0) {
        console.log(`  Progress: ${imported}/${farmers.length} imported, ${farmLands} farm lands, ${cultivations} cultivations, ${cropProductions} crop productions`)
      }
    } catch (err) {
      errors++
      if (errors <= 5) {
        console.error(`  Error importing ${f.farmerCode}:`, err instanceof Error ? err.message.substring(0, 100) : String(err))
      }
    }
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log('  IMPORT COMPLETE')
  console.log('═══════════════════════════════════════════════════════════════════════')
  console.log(`  Farmers:          ${imported}`)
  console.log(`  Farm Lands:       ${farmLands}`)
  console.log(`  Cultivations:     ${cultivations}`)
  console.log(`  Crop Productions: ${cropProductions}`)
  console.log(`  Errors:           ${errors}`)
  console.log('')

  // Verify
  const totalFarmers = await db.farmerProfile.count({ where: { tenantId: tenant.id } })
  console.log(`  Verification — EKIBBO farmers in DB: ${totalFarmers}`)
  console.log('')
}

main()
  .catch((err) => {
    console.error('❌ Import failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
