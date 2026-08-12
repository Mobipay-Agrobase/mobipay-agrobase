/**
 * Seed CatalogMaster with default dropdown values for all 32 categories.
 * Idempotent — uses upsert pattern via unique [category, value, tenantId].
 *
 * Usage:  npx tsx scripts/seed-catalog-master.ts
 */
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env from p4-clone/.env (override any inherited values from parent dirs)
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true })

if (!process.env.DATABASE_URL?.startsWith('postgres')) {
  console.error('DATABASE_URL is not a postgres URL. Got:', process.env.DATABASE_URL?.substring(0, 50))
  process.exit(1)
}

const db = new PrismaClient()

// Canonical default values per category — drives all farmer enrollment dropdowns.
const CATALOG: Record<string, string[]> = {
  gender: ['Male', 'Female'],
  education_level: ['None', 'Primary', 'O-Level', 'A-Level', 'Certificate', 'Diploma', 'Degree', 'Postgraduate'],
  marital_status: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
  house_type: ['Mud and Wattle', 'Semi-Permanent', 'Permanent', 'Tent', 'Other'],
  housing_ownership: ['Owned', 'Rented', 'Leased', 'Family', 'Government', 'Other'],
  consumer_electronics: ['None', 'Radio', 'Mobile Phone', 'Smartphone', 'Television', 'Refrigerator', 'Solar System', 'Generator'],
  vehicle_type: ['None', 'Bicycle', 'Motorcycle', 'Car', 'Pickup', 'Lorry', 'Tractor', 'Animal-drawn Cart'],
  land_ownership: ['Owned', 'Rented', 'Leased', 'Communal', 'Family', 'Government'],
  land_topology: ['Flat', 'Gentle Slope', 'Steep Slope', 'Valley', 'Hilltop', 'Wetland'],
  land_gradient: ['0-2%', '3-5%', '6-10%', '11-15%', '16-25%', '>25%'],
  water_source: ['Rain-fed', 'Borehole', 'Well', 'River', 'Stream', 'Lake', 'Pond', 'Dam', 'Tap', 'Tank', 'Irrigation Canal'],
  power_source: ['Grid Electricity', 'Solar', 'Generator', 'Battery', 'None'],
  irrigation_source: ['None', 'Rain-fed', 'Drip', 'Sprinkler', 'Surface', 'Furrow', 'Manual Watering'],
  irrigation_type: ['None', 'Drip', 'Sprinkler', 'Surface', 'Furrow', 'Manual'],
  soil_fertility: ['High', 'Medium', 'Low', 'Very Low', 'Unknown'],
  certification_type: ['Organic', 'Fairtrade', 'UTZ', 'Rainforest Alliance', 'GlobalGAP', 'None'],
  conversion_status: ['Conventional', 'In Conversion', 'Organic', 'Mixed'],
  soil_criteria: ['Sandy', 'Loam', 'Clay', 'Silty', 'Peat', 'Chalky', 'Mixed'],
  loan_source: ['Bank', 'SACCO', 'VSLA', 'MFI', 'Friend/Family', 'Moneylender', 'Government Program', 'NGO', 'Other'],
  loan_purpose: ['Farm Inputs', 'Land Purchase', 'Equipment', 'Livestock', 'Education', 'Medical', 'Household', 'Business', 'Other'],
  enrollment_place: ['VSLA Meeting', 'Field Visit', 'Office', 'Market Day', 'Church/Mosque', 'Community Gathering', 'Other'],
  national_id_type: ['National ID', 'Passport', 'Driving Permit', 'Voter Card', 'Refugee ID', 'Birth Certificate', 'Other'],
  account_type: ['Savings', 'Current', 'Fixed Deposit', 'Joint', 'Mobile Money', 'Wallet'],
  insurance_type: ['Life', 'Health', 'Crop', 'Livestock', 'Weather-Index', 'Social', 'Property', 'Other'],
  animal_type: ['Cattle', 'Goat', 'Sheep', 'Poultry', 'Pigs', 'Rabbits', 'Fish', 'Bees', 'Donkey', 'Horse', 'Camel'],
  animal_for_growth: ['Meat', 'Milk', 'Eggs', 'Draught', 'Breeding', 'Wool', 'Manure', 'Other'],
  fodder_type: ['Natural Pasture', 'Planted Fodder', 'Crop Residue', 'Concentrates', 'Hay', 'Silage', 'Mixed'],
  animal_housing: ['Open Grazing', 'Semi-Permanent', 'Permanent', 'Free Range', 'Zero Grazing', 'Other'],
  employment_type: ['Full-time Farming', 'Part-time Farming', 'Salaried Employment', 'Casual Labor', 'Self-employed', 'Unemployed', 'Student'],
  income_source: ['Crop Sales', 'Livestock Sales', 'Salary', 'Business', 'Remittances', 'Pension', 'Casual Labor', 'Other'],
  fuel_type: ['Firewood', 'Charcoal', 'Gas', 'Electricity', 'Solar', 'Kerosene', 'Biogas', 'Mixed'],
  cooperative_service: ['Marketing', 'Input Supply', 'Credit', 'Processing', 'Transport', 'Training', 'Insurance', 'Other'],
  // EKIBBO sales categories — inputs vs produce
  produce_type: ['Hulled Coffee', 'Cocoa', 'Cassava', 'Avocado', 'Vanilla', 'Jackfruit', 'Other'],
  input_type: ['Fertilizers', 'Tarpaulins', 'Seedlings', 'Pruning Saws', 'Other'],
  sale_category: ['PRODUCE', 'INPUT'],
}

async function main() {
  // Flatten the CATALOG into rows for createMany
  const rows: Array<{
    category: string
    value: string
    label: string | null
    sortOrder: number
    isActive: boolean
    isGlobal: boolean
    tenantId: null
  }> = []

  for (const [category, values] of Object.entries(CATALOG)) {
    for (let i = 0; i < values.length; i++) {
      rows.push({
        category,
        value: values[i],
        label: null,
        sortOrder: i,
        isActive: true,
        isGlobal: true,
        tenantId: null,
      })
    }
  }

  console.log(`Seeding ${rows.length} catalog values across ${Object.keys(CATALOG).length} categories...`)

  // createMany with skipDuplicates — idempotent. Already-existing rows are skipped.
  const result = await db.catalogMaster.createMany({
    data: rows,
    skipDuplicates: true,
  })

  console.log(`Created ${result.count} new rows (already-existing rows skipped).`)

  // Update sortOrder for existing rows to match canonical order
  let updatedCount = 0
  for (const [category, values] of Object.entries(CATALOG)) {
    for (let i = 0; i < values.length; i++) {
      const r = await db.catalogMaster.updateMany({
        where: { category, value: values[i], tenantId: null },
        data: { sortOrder: i, isGlobal: true, isActive: true },
      })
      updatedCount += r.count
    }
  }
  console.log(`Refreshed sortOrder/isActive on ${updatedCount} rows.`)

  // Verification
  const sample = await db.catalogMaster.groupBy({
    by: ['category'],
    _count: { value: true },
    orderBy: { category: 'asc' },
  })
  console.log(`\nCatalog by category (${sample.length} categories):`)
  for (const s of sample) {
    console.log(`  ${s.category}: ${s._count.value} values`)
  }
  const totalRows = await db.catalogMaster.count()
  console.log(`\nTotal CatalogMaster rows: ${totalRows}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
