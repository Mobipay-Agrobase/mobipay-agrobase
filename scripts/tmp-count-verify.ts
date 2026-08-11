import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const [farmersWithCrops, cropProds, farms, cultivs] = await Promise.all([
    db.farmerProfile.count({ where: { mainCrops: { not: null } } }),
    db.cropProduction.count(),
    db.farmLand.count(),
    db.cultivation.count(),
  ])
  const sample = await db.farmerProfile.findFirst({ where: { mainCrops: { not: null } }, select: { mainCrops: true, farmSize: true } })
  const farmSample = await db.farmLand.findFirst({ select: { id: true, name: true } })
  console.log(JSON.stringify({ farmersWithCrops, cropProductions: cropProds, farmLands: farms, cultivations: cultivs, cropSample: sample?.mainCrops, farmSize: sample?.farmSize, firstFarm: farmSample }))
}
main().catch(e => console.error('ERR', (e as any).message)).finally(() => db.$disconnect())
