/**
 * Idempotent cultivation backfill.
 *
 * For every FarmLand that currently has NO cultivations, derives crops from the
 * farmer's CropProduction records, structured `mainCrops`, or farm-name keywords,
 * and creates ACTIVE Cultivation rows. Re-running is safe: farms that already have
 * cultivations are skipped.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const KEYWORD_CROPS: { pat: RegExp; crop: string }[] = [
  { pat: /coffee/i, crop: 'Coffee' },
  { pat: /cocoa|cacao/i, crop: 'Cocoa' },
  { pat: /avocado/i, crop: 'Avocado' },
  { pat: /vanilla/i, crop: 'Vanilla' },
  { pat: /maize|corn/i, crop: 'Maize' },
  { pat: /cassava/i, crop: 'Cassava' },
  { pat: /bean/i, crop: 'Beans' },
  { pat: /matooke|banana|plantain/i, crop: 'Banana' },
  { pat: /irish|potato/i, crop: 'Potato' },
  { pat: /sugarcane|sugar/i, crop: 'Sugarcane' },
  { pat: /rice/i, crop: 'Rice' },
  { pat: /millet/i, crop: 'Millet' },
  { pat: /soya|soybean/i, crop: 'Soybean' },
  { pat: /groundnut|peanut/i, crop: 'Groundnut' },
  { pat: /bamboo/i, crop: 'Bamboo' },
]

type RawCrop = { cropName: string; variety?: string | null; landPercentage?: number | null }

function parseMainCrops(raw: unknown): RawCrop[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((c) => (typeof c === 'string' ? { cropName: c } : (c as RawCrop)))
  }
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (t.startsWith('[')) {
      try {
        return (JSON.parse(t) as unknown[]).map((c) => (typeof c === 'string' ? { cropName: c } : (c as RawCrop)))
      } catch {
        return []
      }
    }
    return t.split(',').map((s) => ({ cropName: s.trim() })).filter((c) => c.cropName)
  }
  return []
}

function cropsFromName(name: string): string[] {
  const out: string[] = []
  for (const { pat, crop } of KEYWORD_CROPS) {
    if (pat.test(name || '') && !out.includes(crop)) out.push(crop)
  }
  return out
}

async function main() {
  let farms
  for (let i = 1; i <= 5; i++) {
    try {
      farms = await db.farmLand.findMany({
        include: {
          farmer: { include: { cropProductions: true } },
          cultivations: { select: { id: true } },
        },
      })
      break
    } catch (e) {
      if (i === 5) throw e
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
  if (!farms) throw new Error('unable to load farms')

  let farmFarms = 0
  let created = 0

  for (const farm of farms) {
    if (farm.cultivations.length > 0) continue

    const crops: RawCrop[] = [
      ...farm.farmer.cropProductions.map((c) => ({
        cropName: c.cropName,
        variety: c.variety,
        landPercentage: c.landPercentage,
      })),
      ...parseMainCrops((farm.farmer as unknown as Record<string, unknown>).mainCrops),
    ]

    const nameCrops = cropsFromName(farm.name)
    const unique = new Map<string, RawCrop>()
    for (const c of crops) if (c.cropName) unique.set(c.cropName.toLowerCase(), c)
    for (const n of nameCrops) if (!unique.has(n.toLowerCase())) unique.set(n.toLowerCase(), { cropName: n })

    if (unique.size === 0) continue

    for (const c of unique.values()) {
      await db.cultivation.create({
        data: {
          farmId: farm.id,
          cropName: c.cropName,
          variety: c.variety || null,
          season: '2026A',
          status: 'ACTIVE',
          cultivationAreaHa: c.landPercentage != null ? Math.round(((farm.sizeHectares || 1) * c.landPercentage) / 100 * 100) / 100 : null,
        },
      })
      created++
    }
    farmFarms++
  }

  console.log(`Backfilled ${created} cultivations across ${farmFarms} farms.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })