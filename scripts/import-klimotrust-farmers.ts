/**
 * Bulk Import: Klimotrust Farmers from CSV
 * Run: npx tsx scripts/import-klimotrust-farmers.ts <path-to-csv>
 * 
 * CSV format (headers required):
 *   firstName,lastName,phone,gender,district,village,valueChain,nationalId,nssfNumber
 * 
 * Example CSV row:
 *   John,Mukasa,+256771234567,Male,Mukasa,Kampala,Coffee,CF12345678,NSSF12345
 * 
 * The script:
 *   1. Reads the CSV file
 *   2. Creates FarmerProfile records for each row
 *   3. Links to Klimotrust tenant
 *   4. Sets NSSF fields (nationalId, nssfNumber, valueChain, activationStatus)
 *   5. Reports success/failure count
 * 
 * If a farmer with the same phone already exists, skips (no duplicates).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const db = new PrismaClient()

interface CsvRow {
  firstName: string
  lastName: string
  phone: string
  gender?: string
  district?: string
  village?: string
  valueChain?: string
  nationalId?: string
  nssfNumber?: string
  email?: string
  dateOfBirth?: string
  farmSize?: string
  mainCrops?: string
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: CsvRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: any = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })
    rows.push(row)
  }
  
  return rows
}

async function main() {
  const csvPath = process.argv[2]
  
  if (!csvPath) {
    console.error('❌ Usage: npx tsx scripts/import-klimotrust-farmers.ts <path-to-csv>')
    console.error('   Example: npx tsx scripts/import-klimotrust-farmers.ts ./klimotrust-farmers.csv')
    process.exit(1)
  }
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`)
    process.exit(1)
  }
  
  console.log('📂 Reading CSV file...')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCsv(csvContent)
  
  console.log(`   Found ${rows.length} rows in CSV`)
  
  // Find Klimotrust tenant
  const klimotrust = await db.tenant.findFirst({
    where: { name: { contains: 'Klimotrust' } },
    select: { id: true, name: true },
  })
  
  if (!klimotrust) {
    console.error('❌ Klimotrust tenant not found. Run seed-klimotrust-nssf.ts first.')
    process.exit(1)
  }
  
  console.log(`📋 Tenant: ${klimotrust.name} (${klimotrust.id})`)
  console.log('')
  
  let created = 0
  let skipped = 0
  let errors = 0
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    
    try {
      // Validate required fields
      if (!row.firstname || !row.lastname || !row.phone) {
        console.log(`   ⚠️  Row ${i + 2}: Missing required fields (firstName, lastName, phone) — skipped`)
        errors++
        continue
      }
      
      // Normalize phone number
      let phone = row.phone.replace(/\s/g, '')
      if (!phone.startsWith('+')) {
        if (phone.startsWith('256')) {
          phone = '+' + phone
        } else if (phone.startsWith('0')) {
          phone = '+256' + phone.substring(1)
        } else {
          phone = '+' + phone
        }
      }
      
      // Check for duplicate (by phone)
      const existing = await db.farmerProfile.findFirst({
        where: { phone },
      })
      
      if (existing) {
        console.log(`   ↻ Row ${i + 2}: ${row.firstname} ${row.lastname} (${phone}) — already exists, skipped`)
        skipped++
        continue
      }
      
      // Generate farmer code
      const farmerCount = await db.farmerProfile.count({ where: { tenantId: klimotrust.id } })
      const farmerCode = `KT${String(farmerCount + 1).padStart(4, '0')}`
      
      // Create farmer
      const farmer = await db.farmerProfile.create({
        data: {
          tenantId: klimotrust.id,
          firstName: row.firstname,
          lastName: row.lastname,
          phone,
          email: row.email || null,
          gender: row.gender || null,
          farmerCode,
          status: 'ACTIVE',
          district: row.district || null,
          village: row.village || null,
          country: 'Uganda',
          farmSize: row.farmsize ? parseFloat(row.farmsize) : null,
          mainCrops: row.maincrops || row.valuechain || null,
          // NSSF fields (nullable — only set if provided in CSV)
          nssfNationalId: row.nationalid || row.national_id || null,
          nssfNumber: row.nssfnumber || row.nssf_number || null,
          nssfValueChain: row.valuechain || row.value_chain || null,
          nssfActivationStatus: row.nssfnumber || row.nssf_number ? 'PENDING' : null,
          nssfEnrolledAt: row.nssfnumber || row.nssf_number ? new Date() : null,
        },
      })
      
      created++
      if (created % 100 === 0) {
        console.log(`   ✅ ${created} farmers imported...`)
      }
    } catch (e: any) {
      console.log(`   ❌ Row ${i + 2}: ${e.message}`)
      errors++
    }
  }
  
  console.log('')
  console.log('='.repeat(60))
  console.log('✅ Import complete!')
  console.log('='.repeat(60))
  console.log(`   Created: ${created}`)
  console.log(`   Skipped (duplicates): ${skipped}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total in CSV: ${rows.length}`)
  
  // Summary
  const totalFarmers = await db.farmerProfile.count({ where: { tenantId: klimotrust.id } })
  const nssfEnrolled = await db.farmerProfile.count({ 
    where: { tenantId: klimotrust.id, nssfActivationStatus: { not: null } } 
  })
  
  console.log('')
  console.log('📊 Klimotrust Farmer Summary:')
  console.log(`   Total farmers: ${totalFarmers}`)
  console.log(`   NSSF enrolled: ${nssfEnrolled}`)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
