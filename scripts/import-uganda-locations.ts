/**
 * Import Uganda Government Admin Units into the location master.
 *
 * Reads the phpMyAdmin/MariaDB dump (admin_units_30th_october.sql) which is the
 * standard gov-authorized hierarchy:
 *
 *   Country → Region → Sub Region → District → County → Sub County → Parish → Village
 *
 * The dump has 7 flat tables linked by an integer `parent`:
 *   location_regions (id, name, ...)                     → Region (country = 'Uganda')
 *   location_sub_regions (id, name, parent→region)        → SubRegion
 *   location_districts (id, name, parent→subRegion)       → District
 *   location_counties (id, name, parent→district)         → County
 *   location_sub_counties (id, name, parent→county)       → SubCounty
 *   location_parishes (id, name, parent→subCounty)        → Parish
 *   location_villages (id, name, parent→parish)           → Village
 *
 * Usage:
 *   tsx scripts/import-uganda-locations.ts /path/to/admin_units_30th_october.sql [--truncate] [--dry-run]
 *
 *   --truncate  Deletes existing location rows first (children before parents).
 *   --dry-run   Parse + count only; does not touch the database.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const filePath = process.argv[2]
const TRUNCATE = process.argv.includes('--truncate')
const DRY_RUN = process.argv.includes('--dry-run')

if (!filePath) {
  console.error('Usage: tsx scripts/import-uganda-locations.ts <sql-file> [--truncate] [--dry-run]')
  process.exit(1)
}

// Expected column positions per table (from the dump's INSERT column lists).
// index 0 = id, 1 = name, 2 = parent. regions have no parent column.
const TABLES = {
  regions: { hasParent: false },
  sub_regions: { hasParent: true },
  districts: { hasParent: true },
  counties: { hasParent: true },
  sub_counties: { hasParent: true },
  parishes: { hasParent: true },
  villages: { hasParent: true },
} as const

// Split a tuple's inner text into fields on commas that are NOT inside a
// single-quoted string (handles quotes escaped as \' or '').
function splitFields(inner: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (inQ) {
      if (ch === '\\' && inner[i + 1] === "'") { cur += "'"; i++; continue }
      if (ch === "'") {
        if (inner[i + 1] === "'") { cur += "'"; i++; continue }
        inQ = false
      } else cur += ch
      continue
    }
    if (ch === "'") { inQ = true; continue }
    if (ch === ',') { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out
}

function extractTuples(sql: string, table: string): { id: number; name: string; parent: number }[] {
  const rows: { id: number; name: string; parent: number }[] = []
  const marker = 'INSERT INTO `location_' + table + '`'
  const isVillage = table === 'villages'

  let searchFrom = 0
  while (true) {
    const start = sql.indexOf(marker, searchFrom)
    if (start === -1) break
    const valuesIdx = sql.indexOf('VALUES', start)
    if (valuesIdx === -1) break
    let endIdx = sql.indexOf(';', valuesIdx)
    if (endIdx === -1) endIdx = sql.length
    const body = sql.slice(valuesIdx + 6, endIdx).trim()

    // Iterate over the value list scanning tuple-by-tuple char by char
    let i = 0
    const n = body.length
    while (i < n) {
      while (i < n && (body[i] === ' ' || body[i] === '\n' || body[i] === '\t' || body[i] === ',' || body[i] === ';')) i++
      if (i >= n) break
      if (body[i] === '(') {
        // find matching close paren, respecting quotes
        let depth = 0
        let j = i
        let inQ = false
        for (; j < n; j++) {
          const ch = body[j]
          if (inQ) {
            if (ch === '\\' && body[j + 1] === "'") { j++; continue }
            if (ch === "'") inQ = false
            continue
          }
          if (ch === "'") { inQ = true; continue }
          if (ch === '(') depth++
          else if (ch === ')') { depth--; if (depth === 0) break }
        }
        const tuple = body.slice(i + 1, j)
        const fields = splitFields(tuple)
        const id = parseInt(fields[0], 10)
        const name = (fields[1] || '').trim()
        // region: (id, name, sub_name, ...). Others: (id, name, sub_name, parent, ...) → parent at index 3
        const parent = TABLES[table].hasParent ? parseInt(fields[3] || '0', 10) : 0
        if (!Number.isNaN(id) && name && (!TABLES[table].hasParent || parent > 0)) {
          rows.push({ id, name: name.toUpperCase(), parent })
        }
        i = j + 1
      } else {
        i++
      }
    }
    searchFrom = endIdx + 1
  }
  return rows
}

async function main() {
  const sql = await import('fs').then(fs => fs.readFileSync(filePath, 'utf8'))

  const regions = extractTuples(sql, 'regions')
  const subRegions = extractTuples(sql, 'sub_regions')
  const districts = extractTuples(sql, 'districts')
  const counties = extractTuples(sql, 'counties')
  const subCounties = extractTuples(sql, 'sub_counties')
  const parishes = extractTuples(sql, 'parishes')
  const villages = extractTuples(sql, 'villages')

  console.log(`Parsed: regions=${regions.length} sub_regions=${subRegions.length} districts=${districts.length} counties=${counties.length} sub_counties=${subCounties.length} parishes=${parishes.length} villages=${villages.length}`)

  if (DRY_RUN) {
    console.log('DRY-RUN — no database writes performed.')
    await db.$disconnect()
    return
  }

  if (TRUNCATE) {
    console.log('Truncating existing location hierarchy (children first)...')
    await db.village.deleteMany({})
    await db.parish.deleteMany({})
    await db.subCounty.deleteMany({})
    await db.county.deleteMany({})
    await db.district.deleteMany({})
    await db.subRegion.deleteMany({})
    await db.region.deleteMany({})
  }

  // Bulk insert each level via createManyAndReturn (PostgreSQL) to avoid
  // per-row round trips over the pooled Neon connection. Maps keep
  // source int id → generated cuid so children can reference parents.
  const CHUNK = 2000

  const regionMap = new Map<number, string>()
  for (let i = 0; i < regions.length; i += CHUNK) {
    const chunk = regions.slice(i, i + CHUNK).map(r => ({ name: r.name, country: 'Uganda' }))
    const recs = await db.region.createManyAndReturn({ data: chunk })
    chunk.forEach((_, idx) => regionMap.set(regions[i + idx].id, recs[idx].id))
  }
  console.log(`Inserted ${regionMap.size} regions`)

  const subRegionMap = new Map<number, string>()
  for (let i = 0; i < subRegions.length; i += CHUNK) {
    const chunk = subRegions.slice(i, i + CHUNK)
    const data = chunk.map(r => ({ name: r.name, regionId: regionMap.get(r.parent) })).filter(d => d.regionId)
    const recs = await db.subRegion.createManyAndReturn({ data })
    let n = 0
    chunk.forEach((r) => { const rid = regionMap.get(r.parent); if (rid) subRegionMap.set(r.id, recs[n++].id) })
  }
  console.log(`Inserted ${subRegionMap.size} sub-regions`)

  const districtMap = new Map<number, string>()
  for (let i = 0; i < districts.length; i += CHUNK) {
    const chunk = districts.slice(i, i + CHUNK)
    const data = chunk.map(r => ({ name: r.name, subRegionId: subRegionMap.get(r.parent) })).filter(d => d.subRegionId)
    const recs = await db.district.createManyAndReturn({ data })
    let n = 0
    chunk.forEach((r) => { const rid = subRegionMap.get(r.parent); if (rid) districtMap.set(r.id, recs[n++].id) })
  }
  console.log(`Inserted ${districtMap.size} districts`)

  const countyMap = new Map<number, string>()
  for (let i = 0; i < counties.length; i += CHUNK) {
    const chunk = counties.slice(i, i + CHUNK)
    const data = chunk.map(r => ({ name: r.name, districtId: districtMap.get(r.parent) })).filter(d => d.districtId)
    const recs = await db.county.createManyAndReturn({ data })
    let n = 0
    chunk.forEach((r) => { const rid = districtMap.get(r.parent); if (rid) countyMap.set(r.id, recs[n++].id) })
  }
  console.log(`Inserted ${countyMap.size} counties`)

  const subCountyMap = new Map<number, string>()
  for (let i = 0; i < subCounties.length; i += CHUNK) {
    const chunk = subCounties.slice(i, i + CHUNK)
    const data = chunk.map(r => ({ name: r.name, countyId: countyMap.get(r.parent) })).filter(d => d.countyId)
    const recs = await db.subCounty.createManyAndReturn({ data })
    let n = 0
    chunk.forEach((r) => { const rid = countyMap.get(r.parent); if (rid) subCountyMap.set(r.id, recs[n++].id) })
  }
  console.log(`Inserted ${subCountyMap.size} sub-counties`)

  const parishMap = new Map<number, string>()
  for (let i = 0; i < parishes.length; i += CHUNK) {
    const chunk = parishes.slice(i, i + CHUNK)
    const data = chunk.map(r => ({ name: r.name, subCountyId: subCountyMap.get(r.parent) })).filter(d => d.subCountyId)
    const recs = await db.parish.createManyAndReturn({ data })
    let n = 0
    chunk.forEach((r) => { const rid = subCountyMap.get(r.parent); if (rid) parishMap.set(r.id, recs[n++].id) })
  }
  console.log(`Inserted ${parishMap.size} parishes`)

  let villageCount = 0
  const villageData = villages
    .map(v => { const pid = parishMap.get(v.parent); return pid ? { name: v.name, parishId: pid } : null })
    .filter(Boolean) as { name: string; parishId: string }[]
  for (let i = 0; i < villageData.length; i += CHUNK) {
    const res = await db.village.createMany({ data: villageData.slice(i, i + CHUNK) })
    villageCount += res.count
  }
  console.log(`Inserted ${villageCount} villages`)

  console.log('Done. Hierarchy loaded.')
  await db.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await db.$disconnect()
  process.exit(1)
})