import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// The 12 official NSSF value chains. Stored in the CatalogMaster table with
// category='nssf_value_chains' so the NSSF admin can add/edit/disable them
// via the web Dashboard → Master Data → Dropdown Catalog screen, WITHOUT
// requiring a code change or app redeploy.
//
// The mobile app's ValueChainMultiSelect fetches these via GET /api/nssf/value-chains
// (which in turn reads from CatalogMaster). When NSSF adds a new value chain
// (e.g. "Honey" or "Vanilla"), they just add it via the web UI — the mobile
// app picks it up automatically on the next enrollment.
const NSSF_VALUE_CHAINS = [
  { value: 'Maize',                   label: 'Maize',                   sortOrder: 1 },
  { value: 'Rice',                    label: 'Rice',                    sortOrder: 2 },
  { value: 'Banana (matooke)',        label: 'Banana (matooke)',         sortOrder: 3 },
  { value: 'Cassava',                 label: 'Cassava',                 sortOrder: 4 },
  { value: 'Irish potato',            label: 'Irish potato',            sortOrder: 5 },
  { value: 'Beans',                   label: 'Beans',                   sortOrder: 6 },
  { value: 'Fruits and vegetables',   label: 'Fruits and vegetables',    sortOrder: 7 },
  { value: 'Coffee',                  label: 'Coffee',                  sortOrder: 8 },
  { value: 'Tea',                     label: 'Tea',                     sortOrder: 9 },
  { value: 'Dairy cattle',            label: 'Dairy cattle',            sortOrder: 10 },
  { value: 'Beef cattle / meat',      label: 'Beef cattle / meat',      sortOrder: 11 },
  { value: 'Fish / Aquaculture',      label: 'Fish / Aquaculture',      sortOrder: 12 },
]

async function main() {
  console.log('🌱 Seeding NSSF value chains into CatalogMaster')
  console.log('='.repeat(60))

  let created = 0
  let updated = 0
  let skipped = 0

  for (const vc of NSSF_VALUE_CHAINS) {
    // Find by (category, value) — both are unique together
    const existing = await db.catalogMaster.findFirst({
      where: { category: 'nssf_value_chains', value: vc.value },
    })

    if (existing) {
      // Update label + sortOrder + ensure isActive=true
      await db.catalogMaster.update({
        where: { id: existing.id },
        data: { label: vc.label, sortOrder: vc.sortOrder, isActive: true },
      })
      updated++
      console.log(`   ↻ Updated: ${vc.value}`)
    } else {
      // Create as a GLOBAL catalog entry (tenantId=null) so all tenants
      // see the same NSSF value chains. The NSSF admin can still edit
      // them via the Dropdown Catalog screen.
      await db.catalogMaster.create({
        data: {
          category: 'nssf_value_chains',
          value: vc.value,
          label: vc.label,
          sortOrder: vc.sortOrder,
          isGlobal: true,
          tenantId: null,
          isActive: true,
        },
      })
      created++
      console.log(`   ✅ Created: ${vc.value}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`✅ Seeding complete: ${created} created, ${updated} updated, ${skipped} skipped`)
  console.log('='.repeat(60))
  console.log('\n📋 The mobile app fetches these via GET /api/nssf/value-chains')
  console.log('   which reads from CatalogMaster where category=\'nssf_value_chains\'.')
  console.log('   NSSF admin can add/edit/disable value chains via the web Dashboard →')
  console.log('   Master Data → Dropdown Catalog → category: nssf_value_chains.')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => db.$disconnect())
