import { db } from '@/lib/db'

/**
 * FarmPlant ↔ CropMaster link (server-only — imports Prisma).
 *
 * The plant-inventory categories come from the review-fixed catalog
 * (farm-plants-catalog.ts: Coffee, Cocoa, Vanilla, Bamboo, Shade Trees,
 * Bananas, Jackfruit, Avocado, Cassava). CropMaster is the platform's
 * crop master registry used by cultivation planning.
 *
 * To keep the two aligned WITHOUT breaking the review-H breakdown (which
 * groups by category string), every plant row also stores an optional
 * `cropMasterId` resolved here by name match:
 *   · exact case-insensitive match first ("Coffee" → CropMaster "Coffee")
 *   · singular fallback second ("Bananas" → CropMaster "Banana")
 *   · null when the review category has no CropMaster counterpart
 *     (e.g. "Shade Trees", "Bamboo" seedlings) — those remain
 *     catalog-managed and still count in the Total Plants KPI.
 */
export async function resolveCropMasterId(cropCategory: string): Promise<string | null> {
  const name = (cropCategory || '').trim()
  if (!name) return null

  const candidates = [name]
  if (name.length > 3 && name.toLowerCase().endsWith('s')) {
    candidates.push(name.slice(0, -1))
  }

  for (const candidate of candidates) {
    const crop = await db.cropMaster.findFirst({
      where: { name: { equals: candidate, mode: 'insensitive' }, status: 'ACTIVE' },
      select: { id: true },
    })
    if (crop) return crop.id
  }
  return null
}
