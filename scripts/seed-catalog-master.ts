/**
 * Seed CatalogMaster — dropdown values for all farmer enrollment fields.
 * Run: DATABASE_URL=<neon> npx tsx scripts/seed-catalog-master.ts
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const CATALOG: Record<string, string[]> = {
  gender: ['Male', 'Female', 'Other'],
  education_level: ['None', 'Primary (PLE)', 'Secondary (UCE)', 'Advanced (UACE)', 'Diploma', 'Degree', 'Post Graduate'],
  marital_status: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
  house_type: ['Brick House', 'Wooden House', 'Mud House', 'Hut', 'Other'],
  housing_ownership: ['Owned', 'Rented', 'Leased', 'Family Owned'],
  consumer_electronics: ['TV', 'Radio', 'Mobile Phone', 'Smartphone', 'Refrigerator', 'Solar Panel', 'Generator', 'Washing Machine'],
  vehicle_type: ['Bicycle', 'Motorcycle', 'Car', 'Pickup Truck', 'Tractor', 'Boat', 'None'],
  land_ownership: ['Owned', 'Rented', 'Leased', 'Communal', 'Sales Agreement'],
  land_topology: ['Valley', 'Plains', 'Plateaus', 'Hillside'],
  land_gradient: ['Up Land', 'Low Land', 'Flat'],
  water_source: ['Well', 'Bore Well', 'Pump', 'River', 'Rain Water', 'Canal'],
  power_source: ['Solar', 'Electricity', 'Fuel', 'None'],
  irrigation_source: ['Rainfed', 'Irrigated', 'Mixed'],
  irrigation_type: ['Drip', 'Sprinkler', 'Flood', 'Furrow', 'None'],
  soil_fertility: ['Good', 'Normal', 'Poor'],
  certification_type: ['Individual', 'Group', 'NPOP', 'NOP'],
  conversion_status: ['IC-1', 'IC-2', 'IC-3', 'Organic', 'SRP', 'Not Applicable'],
  soil_criteria: ['pH', 'Sulphur (S)', 'Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Organic Carbon'],
  loan_source: ['Bank', 'Relative', 'Friend', 'Farming Contract', 'SACCO', 'VSLA', 'Other'],
  loan_purpose: ['Farm Inputs', 'Equipment', 'Education', 'Medical', 'Construction', 'Business', 'Other'],
  enrollment_place: ['At Farmer Place', 'At Cooperative', 'At Farmer Organization', 'At Warehouse'],
  national_id_type: ['National ID', 'Driving License', 'Passport', 'Voter Card'],
  account_type: ['Savings', 'Current', 'Fixed Deposit'],
  insurance_type: ['Life', 'Health', 'Crop', 'Social', 'Other'],
  animal_type: ['Cattle', 'Goat', 'Sheep', 'Poultry', 'Pigs', 'Rabbits', 'Fish', 'Bees'],
  animal_for_growth: ['Meat', 'Milk', 'Eggs', 'Draught', 'Breeding', 'Other'],
  fodder_type: ['Napier Grass', 'Brachiaria', 'Hay', 'Silage', 'Crop Residue', 'Concentrate', 'Other'],
  animal_housing: ['Open', 'Semi-Permanent', 'Permanent', 'None'],
  employment_type: ['Wage Employment', 'Self Employment', 'Informal Employment', 'Not Employed'],
  income_source: ['Farming', 'Business', 'Formal Employment', 'Informal Employment', 'Remittances', 'Pension', 'Other'],
  fuel_type: ['Firewood', 'Charcoal', 'Gas', 'Kerosene', 'Solar', 'Electricity'],
  cooperative_service: ['Fertilizer', 'Harvester', 'Soil Preparation', 'Seeds', 'Plant Protection Products', 'Compost', 'Market Linkage'],
}

async function main() {
  console.log('Seeding CatalogMaster...')
  let created = 0
  for (const [category, values] of Object.entries(CATALOG)) {
    for (let i = 0; i < values.length; i++) {
      const existing = await db.catalogMaster.findFirst({
        where: { category, value: values[i] },
      })
      if (!existing) {
        await db.catalogMaster.create({
          data: { category, value: values[i], sortOrder: i, isGlobal: true },
        })
        created++
      }
    }
  }
  console.log(`Created ${created} catalog entries`)
  
  // Also seed SeasonMaster
  const seasons = [
    { name: 'Winter Spring 2026', fromDate: new Date('2026-01-01'), toDate: new Date('2026-05-31') },
    { name: 'Summer Autumn 2026', fromDate: new Date('2026-06-01'), toDate: new Date('2026-10-31') },
    { name: 'Autumn Winter 2026', fromDate: new Date('2026-11-01'), toDate: new Date('2027-02-28') },
  ]
  for (const s of seasons) {
    const existing = await db.seasonMaster.findUnique({ where: { name: s.name } })
    if (!existing) {
      await db.seasonMaster.create({ data: s })
      console.log(`Created season: ${s.name}`)
    }
  }
  
  // Seed CropMaster with common crops
  const crops = [
    { name: 'Coffee', category: 'Field Crop' },
    { name: 'Cocoa', category: 'Field Crop' },
    { name: 'Maize', category: 'Field Crop' },
    { name: 'Cassava', category: 'Field Crop' },
    { name: 'Vanilla', category: 'Spices' },
    { name: 'Avocado', category: 'Fruits' },
    { name: 'Jackfruit', category: 'Fruits' },
    { name: 'Banana', category: 'Fruits' },
    { name: 'Rice', category: 'Field Crop' },
    { name: 'Beans', category: 'Field Crop' },
  ]
  for (const c of crops) {
    const existing = await db.cropMaster.findUnique({ where: { name: c.name } })
    if (!existing) {
      await db.cropMaster.create({ data: c })
      console.log(`Created crop: ${c.name}`)
    }
  }
  
  console.log('Done!')
}
main().then(() => db.$disconnect()).catch(e => { console.error(e); process.exit(1) })
