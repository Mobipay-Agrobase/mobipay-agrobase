import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

/**
 * Second review (follow-up — Crop Master mapping):
 *
 * The plant-inventory categories (farm-plants catalog: Coffee, Cocoa,
 * Vanilla, Bamboo, Shade Trees, …) are now LINKED to Crop Master instead of
 * staying catalog-only. This script seeds the missing CropMaster rows so
 * the auto-link (src/lib/farm-plant-crop-link.ts, name match) can resolve
 * them — including the Bamboo seedlings and the 10 shade-tree species from
 * the review.
 *
 * IDEMPOTENT: every row is an upsert on `name` (@unique). Existing crops
 * (Coffee, Banana, Jackfruit, Avocado, …) keep their current ids and data;
 * only missing rows are created. Varieties are added when the crop has none
 * yet (never duplicated).
 *
 * Run: npx tsx scripts/seed-ekibbo-crop-master.ts
 * CI runs this after `prisma db push` (see ci-cd.yml migrate job).
 */

const CROPS: Array<{
  name: string
  category: string
  varieties?: string[]
}> = [
  // Plantation crops from the review catalog (upsert — may already exist).
  { name: 'Coffee', category: 'Field Crop', varieties: ['Robusta'] },
  { name: 'Cocoa', category: 'Field Crop', varieties: ['Trinitario', 'Forastero', 'Criollo'] },
  { name: 'Vanilla', category: 'Spices' },
  { name: 'Cassava', category: 'Field Crop' },
  { name: 'Banana', category: 'Fruits' },
  { name: 'Jackfruit', category: 'Fruits' },
  { name: 'Avocado', category: 'Fruits' },
  // Bamboo seedlings (review H/J: Asper, Strictus, Vulgaris Green).
  { name: 'Bamboo', category: 'Fiber', varieties: ['Asper', 'Strictus', 'Vulgaris Green'] },
  // Shade trees from the review catalog (agroforestry species).
  { name: 'Musizi', category: 'Agroforestry' },
  { name: 'Mutuba', category: 'Agroforestry' },
  { name: 'Calliandra', category: 'Agroforestry' },
  { name: 'Albizia', category: 'Agroforestry' },
  { name: 'Ficus Natalensis', category: 'Agroforestry' },
  { name: 'Cordia Africana', category: 'Agroforestry' },
  { name: 'Maesopsis Emini', category: 'Agroforestry' },
  { name: 'Ficus Ovata', category: 'Agroforestry' },
]

async function main() {
  console.log('🌱 Seeding EKiBBO Crop Master (idempotent upserts)...')

  let created = 0
  let existing = 0

  for (const crop of CROPS) {
    const row = await db.cropMaster.upsert({
      where: { name: crop.name },
      update: {}, // never touch existing data — only fill gaps
      create: {
        name: crop.name,
        category: crop.category,
        status: 'ACTIVE',
      },
    })

    const wasCreated = await db.cropMaster.count({
      where: { name: crop.name, createdAt: { gte: new Date(Date.now() - 60_000) } },
    })
    if (wasCreated > 0) created++
    else existing++

    // Add varieties only when the crop has none (no duplicates, no
    // overwrites of varieties staff may have curated themselves).
    if (crop.varieties?.length) {
      const current = await db.cropVariety.findMany({
        where: { cropId: row.id },
        select: { name: true },
      })
      const currentNames = new Set(current.map(v => v.name.toLowerCase()))
      for (const v of crop.varieties) {
        if (currentNames.has(v.toLowerCase())) continue
        await db.cropVariety.create({
          data: { cropId: row.id, name: v },
        })
        console.log(`   + variety ${crop.name} / ${v}`)
      }
    }
  }

  console.log(`✅ Crop Master seed complete: ${existing} already present, ${created} created.`)

  // ── Backfill: re-link existing FarmPlant rows whose cropMasterId is null ──
  // Rows recorded before the variety-aware resolver only linked by category,
  // so Bamboo / Shade Trees stayed null. Re-resolve them (variety first).
  const { resolveCropMasterId } = await import('../src/lib/farm-plant-crop-link')
  const unlinked = await db.farmPlant.findMany({
    where: { cropMasterId: null },
    select: { id: true, cropCategory: true, variety: true },
    take: 10000,
  })
  let relinked = 0
  for (const p of unlinked) {
    const cropMasterId = await resolveCropMasterId(p.cropCategory, p.variety)
    if (cropMasterId) {
      await db.farmPlant.update({ where: { id: p.id }, data: { cropMasterId } })
      relinked++
    }
  }
  console.log(`🔗 FarmPlant backfill: ${relinked}/${unlinked.length} previously-unlinked rows now mapped to Crop Master.`)
}

main()
  .catch((e) => {
    console.error('Crop master seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
