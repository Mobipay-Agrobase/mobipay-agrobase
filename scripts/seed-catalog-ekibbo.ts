import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

/**
 * Curated, Ekibbo-tenant-scoped catalog values.
 *
 * Context: dev_terra_farm.sql (the old "farmangel" system) was reviewed and is
 * mostly from a different South-Asian / Vietnamese value chain (Indian pesticides,
 * turmeric/cumin crops, Relikaj/Khammam warehouses, Vietnamese placeholders). The
 * app's canonical Uganda-appropriate catalog already lives in
 * scripts/seed-catalog-master.ts and covers the relevant overlaps (Voter Card,
 * Motorcycle, Lorry, Charcoal, Firewood, etc.).
 *
 * So instead of bulk-importing that data, this seeds a SMALL set of genuinely
 * Uganda/Ekibbo (coffee-export) native values that the canonical catalog does NOT
 * include, scoped to the Ekibbo tenant only (isGlobal=false) so they can be
 * maintained independently per tenant.
 *
 * Values already present for the same (category, value) — global OR for this
 * tenant — are skipped, so no duplicate dropdown keys are introduced.
 *
 * Run: npx tsx scripts/seed-catalog-ekibbo.ts
 */

type Entry = { category: string; value: string; label?: string; sortOrder?: number }

const EKIBBO_CURATED: Entry[] = [
  // Exporter enrollment places
  { category: 'enrollment_place', value: 'Farm Visit', sortOrder: 10 },
  { category: 'enrollment_place', value: 'Buying Centre', sortOrder: 11 },
  { category: 'enrollment_place', value: 'Cooperative Meeting', sortOrder: 12 },
  // Income streams relevant to a coffee exporter's smallholders
  { category: 'income_source', value: 'Coffee Sale', sortOrder: 10 },
  { category: 'income_source', value: 'Certification Premium', sortOrder: 11 },
  { category: 'income_source', value: 'Farm Labour', sortOrder: 12 },
  // Ekibbo-specific loan uses
  { category: 'loan_purpose', value: 'Certification Fees', sortOrder: 10 },
  { category: 'loan_purpose', value: 'Drying / Screen Equipment', sortOrder: 11 },
  // Customary land tenure is the majority in Uganda
  { category: 'land_ownership', value: 'Customary', sortOrder: 10 },
]

async function main() {
  const tenant = await db.tenant.findFirst({ where: { name: { contains: 'EKIBBO' } } })
  if (!tenant) {
    console.error('EKIBBO tenant not found. Run scripts/seed-users.ts (or seed-v2-standalone.ts) first.')
    process.exit(1)
  }
  console.log(`Seeding curated values for tenant: ${tenant.name} (${tenant.id})`)

  let created = 0
  let skipped = 0

  for (const e of EKIBBO_CURATED) {
    // Skip if any row already exists for this (category, value) regardless of tenant.
    const exists = await db.catalogMaster.findFirst({
      where: { category: e.category, value: e.value },
    })
    if (exists) {
      console.log(`  skip  ${e.category} → "${e.value}" (already exists)`)
      skipped++
      continue
    }
    await db.catalogMaster.create({
      data: {
        category: e.category,
        value: e.value,
        label: e.label ?? null,
        sortOrder: e.sortOrder ?? 0,
        isActive: true,
        isGlobal: false,
        tenantId: tenant.id,
      },
    })
    created++
    console.log(`  add   ${e.category} → "${e.value}"` + (e.label ? ` (${e.label})` : ''))
  }

  console.log(`\nDone: created ${created} tenant-specific rows, skipped ${skipped} duplicates.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())