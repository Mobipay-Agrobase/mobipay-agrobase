import { db } from './db'

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
 *   · the variety first when present — "Shade Trees / Jackfruit" links to
 *     the Jackfruit crop, "Calliandra (Kalisambuzi)" links to Calliandra
 *     (parenthesized local names are stripped before matching)
 *   · exact case-insensitive match second ("Coffee" → CropMaster "Coffee")
 *   · singular fallback third ("Bananas" → CropMaster "Banana")
 *   · null when nothing matches
 *
 * The CropMaster rows for Bamboo + the shade-tree species are seeded by
 * scripts/seed-ekibbo-crop-master.ts (idempotent, run in CI) so those
 * categories link too — they used to stay null by design; the user asked
 * for the mapping, so the master data now carries them.
 */
export async function resolveCropMasterId(
  cropCategory: string,
  variety?: string | null,
): Promise<string | null> {
  // Candidate names in priority order: variety first (it carries the actual
  // species for shade trees), then the category.
  const candidates: string[] = []

  const addCandidate = (raw: string | null | undefined) => {
    const name = (raw || '').trim()
    if (!name) return
    // "Calliandra (Kalisambuzi)" → ["Calliandra (Kalisambuzi)", "Calliandra"]
    candidates.push(name)
    const parenIdx = name.indexOf('(')
    if (parenIdx > 0) {
      const stripped = name.slice(0, parenIdx).trim()
      if (stripped) candidates.push(stripped)
    }
    // Singular fallback: "Bananas" → "Banana"
    if (name.length > 3 && name.toLowerCase().endsWith('s')) {
      candidates.push(name.slice(0, -1))
    }
    if (parenIdx > 0) {
      const stripped = name.slice(0, parenIdx).trim()
      if (stripped.length > 3 && stripped.toLowerCase().endsWith('s')) {
        candidates.push(stripped.slice(0, -1))
      }
    }
  }

  addCandidate(variety)
  addCandidate(cropCategory)

  for (const candidate of candidates) {
    const crop = await db.cropMaster.findFirst({
      where: { name: { equals: candidate, mode: 'insensitive' }, status: 'ACTIVE' },
      select: { id: true },
    })
    if (crop) return crop.id
  }
  return null
}
