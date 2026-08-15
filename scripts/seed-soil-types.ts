/**
 * Seed SoilTypeMaster with Uganda's 10 major soil types.
 * Each row has: name, keyRegions, fertility, mainCrops, description.
 *
 * Usage: npx tsx scripts/seed-soil-types.ts
 */
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env'), override: true })

const db = new PrismaClient()

const SOIL_TYPES = [
  {
    name: 'Ferralitic Soils / Red Tropical Soils',
    keyRegions: 'Central, Southern, Eastern Uganda: Kampala, Mukono, Masaka, Jinja',
    fertility: 'Low to Moderate. Acidic. Needs manure and fertilizer.',
    mainCrops: 'Coffee, Bananas, Maize, Beans, Cassava',
    description: 'Deep, well-drained, reddish soils. High in iron and aluminum oxides. Common in high rainfall areas.',
  },
  {
    name: 'Ferruginous Soils',
    keyRegions: 'Northern and Eastern Uganda: Lira, Gulu, Soroti, Mbale',
    fertility: 'Moderate. Fertility drops fast without organic matter.',
    mainCrops: 'Cotton, Sorghum, Millet, Groundnuts, Simsim',
    description: 'Reddish-brown, sandy to loamy. Well-drained but prone to leaching.',
  },
  {
    name: 'Hydromorphic Soils / Wetland Soils',
    keyRegions: 'Swamps and valley bottoms nationwide: Nakivubo, Lubigi, Katonga wetlands',
    fertility: 'High in organic matter. Requires drainage for crops.',
    mainCrops: 'Rice, Yams, Vegetables, Napier Grass',
    description: 'Dark soils in waterlogged areas. High organic matter but poor drainage.',
  },
  {
    name: 'Alluvial Soils',
    keyRegions: 'Along major rivers: Nile Valley, Katonga, Rwizi, Aswa',
    fertility: 'High. Very fertile and good for irrigation.',
    mainCrops: 'Vegetables, Maize, Beans, Sugarcane, Rice',
    description: 'Young soils deposited by rivers. Loamy and moisture-retentive.',
  },
  {
    name: 'Lithosols / Shallow Soils',
    keyRegions: 'Hilly and mountainous areas: Mt. Elgon, Rwenzori, Kabale, Kisoro',
    fertility: 'Low. Needs terracing and conservation.',
    mainCrops: 'Irish Potatoes, Wheat, Barley, Tea',
    description: 'Very shallow, stony soils over bedrock. Prone to erosion.',
  },
  {
    name: 'Volcanic Soils',
    keyRegions: 'Southwestern Uganda: Kabale, Kisoro, around Mt. Muhabura',
    fertility: 'Very High. Among the most fertile in Uganda.',
    mainCrops: 'Irish Potatoes, Wheat, Vegetables, Pyrethrum, Tea',
    description: 'Deep, dark, fertile soils from volcanic ash. Good structure.',
  },
  {
    name: 'Black Cotton Soils / Vertisols',
    keyRegions: 'Eastern and Northern Uganda: Teso, Lango, parts of Karamoja',
    fertility: 'Moderate to High. Hard to till but nutrient-rich.',
    mainCrops: 'Cotton, Sorghum, Rice, Sunflower',
    description: 'Heavy clay soils. Dark, crack when dry and sticky when wet.',
  },
  {
    name: 'Lateritic Soils',
    keyRegions: 'Patches in Central and Western Uganda',
    fertility: 'Low. Poor for agriculture. Used for bricks/roads.',
    mainCrops: 'Cassava, Grasses',
    description: 'Red soils with hardpan layer. Poor drainage and low water holding.',
  },
  {
    name: 'Sandy Soils',
    keyRegions: 'Parts of Northern and Eastern Uganda: Karamoja, Teso',
    fertility: 'Low. Needs manure and mulching.',
    mainCrops: 'Millet, Cassava, Groundnuts, Cowpeas',
    description: 'Light, coarse soils. Well-drained but dry out quickly.',
  },
  {
    name: 'Peat Soils',
    keyRegions: 'Permanent swamps: Nakivubo, Lubigi, Doho',
    fertility: 'High potential. Needs liming and drainage.',
    mainCrops: 'Rice, Vegetables',
    description: 'Very high organic matter. Acidic and waterlogged.',
  },
]

async function main() {
  let created = 0
  let skipped = 0

  for (const st of SOIL_TYPES) {
    const existing = await db.soilTypeMaster.findUnique({ where: { name: st.name } })
    if (existing) {
      // Update existing
      await db.soilTypeMaster.update({
        where: { id: existing.id },
        data: {
          keyRegions: st.keyRegions,
          fertility: st.fertility,
          mainCrops: st.mainCrops,
          description: st.description,
        },
      })
      skipped++
    } else {
      await db.soilTypeMaster.create({ data: st })
      created++
    }
  }

  console.log(`\nSoil type seed complete.`)
  console.log(`  Created: ${created}`)
  console.log(`  Updated: ${skipped}`)
  console.log(`  Total soil types: ${SOIL_TYPES.length}`)

  const all = await db.soilTypeMaster.findMany({ orderBy: { name: 'asc' } })
  console.log(`\nAll soil types in database:`)
  for (const s of all) {
    console.log(`  ${s.name}`)
    console.log(`    Regions: ${s.keyRegions || '—'}`)
    console.log(`    Fertility: ${s.fertility || '—'}`)
    console.log(`    Crops: ${s.mainCrops || '—'}`)
    console.log('')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
