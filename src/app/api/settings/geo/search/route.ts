import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/settings/geo/search?q=<query>&level=<level>&limit=<limit>
 *
 * Cross-hierarchy location search. Returns matching locations of any level
 * (region / subRegion / district / county / subCounty / parish / village)
 * with their full parent chain, so the UI can render a flat search results
 * list and let the user jump directly to a village without manually
 * expanding 7 levels of the tree.
 *
 * Query params:
 *   - q:       search term (case-insensitive, matches name with LIKE %q%)
 *   - level:   optional filter — one of 'region' | 'subRegion' | 'district' |
 *              'county' | 'subCounty' | 'parish' | 'village'. If omitted,
 *              searches ALL levels.
 *   - limit:   max results per level (default 50, capped at 200)
 *
 * Response shape:
 *   { data: [
 *     { level: 'village', id, name,
 *       region: { id, name }, subRegion: { id, name }, district: { id, name },
 *       county: { id, name }, subCounty: { id, name }, parish: { id, name },
 *       village: { id, name } },
 *     ...
 *   ] }
 *
 * The response only includes the parent chain relevant to the matched level
 * (e.g. a district match includes region + subRegion + district but not
 * county/subCounty/parish/village).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const levelFilter = searchParams.get('level') // optional
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    if (!q || q.length < 1) {
      return NextResponse.json({ data: [] })
    }

    const results: any[] = []

    // Helper to push a result with the right shape
    const push = (level: string, row: any, chain: any) => {
      results.push({ level, id: row.id, name: row.name, ...chain })
    }

    // Build the LIKE condition (case-insensitive)
    const contains = { contains: q, mode: 'insensitive' as const }

    // ─── Region ───
    if (!levelFilter || levelFilter === 'region') {
      const rows = await db.region.findMany({ where: { name: contains }, take: limit, orderBy: { name: 'asc' } })
      for (const r of rows) push('region', r, { region: { id: r.id, name: r.name } })
    }

    // ─── Sub-Region ───
    if (!levelFilter || levelFilter === 'subRegion') {
      const rows = await db.subRegion.findMany({
        where: { name: contains },
        take: limit,
        orderBy: { name: 'asc' },
        include: { region: { select: { id: true, name: true } } },
      })
      for (const r of rows) push('subRegion', r, {
        region: r.region ? { id: r.region.id, name: r.region.name } : null,
        subRegion: { id: r.id, name: r.name },
      })
    }

    // ─── District ───
    if (!levelFilter || levelFilter === 'district') {
      const rows = await db.district.findMany({
        where: { name: contains },
        take: limit,
        orderBy: { name: 'asc' },
        include: { subRegion: { select: { id: true, name: true, region: { select: { id: true, name: true } } } } },
      })
      for (const r of rows) push('district', r, {
        region: r.subRegion?.region ? { id: r.subRegion.region.id, name: r.subRegion.region.name } : null,
        subRegion: r.subRegion ? { id: r.subRegion.id, name: r.subRegion.name } : null,
        district: { id: r.id, name: r.name },
      })
    }

    // ─── County ───
    if (!levelFilter || levelFilter === 'county') {
      const rows = await db.county.findMany({
        where: { name: contains },
        take: limit,
        orderBy: { name: 'asc' },
        include: { district: { select: { id: true, name: true, subRegion: { select: { id: true, name: true, region: { select: { id: true, name: true } } } } } } },
      })
      for (const r of rows) push('county', r, {
        region: r.district?.subRegion?.region ? { id: r.district.subRegion.region.id, name: r.district.subRegion.region.name } : null,
        subRegion: r.district?.subRegion ? { id: r.district.subRegion.id, name: r.district.subRegion.name } : null,
        district: r.district ? { id: r.district.id, name: r.district.name } : null,
        county: { id: r.id, name: r.name },
      })
    }

    // ─── Sub-County ───
    if (!levelFilter || levelFilter === 'subCounty') {
      const rows = await db.subCounty.findMany({
        where: { name: contains },
        take: limit,
        orderBy: { name: 'asc' },
        include: { county: { select: { id: true, name: true, district: { select: { id: true, name: true, subRegion: { select: { id: true, name: true, region: { select: { id: true, name: true } } } } } } } } },
      })
      for (const r of rows) push('subCounty', r, {
        region: r.county?.district?.subRegion?.region ? { id: r.county.district.subRegion.region.id, name: r.county.district.subRegion.region.name } : null,
        subRegion: r.county?.district?.subRegion ? { id: r.county.district.subRegion.id, name: r.county.district.subRegion.name } : null,
        district: r.county?.district ? { id: r.county.district.id, name: r.county.district.name } : null,
        county: r.county ? { id: r.county.id, name: r.county.name } : null,
        subCounty: { id: r.id, name: r.name },
      })
    }

    // ─── Parish ───
    if (!levelFilter || levelFilter === 'parish') {
      const rows = await db.parish.findMany({
        where: { name: contains },
        take: limit,
        orderBy: { name: 'asc' },
        include: { subCounty: { select: { id: true, name: true, county: { select: { id: true, name: true, district: { select: { id: true, name: true, subRegion: { select: { id: true, name: true, region: { select: { id: true, name: true } } } } } } } } } } },
      })
      for (const r of rows) push('parish', r, {
        region: r.subCounty?.county?.district?.subRegion?.region ? { id: r.subCounty.county.district.subRegion.region.id, name: r.subCounty.county.district.subRegion.region.name } : null,
        subRegion: r.subCounty?.county?.district?.subRegion ? { id: r.subCounty.county.district.subRegion.id, name: r.subCounty.county.district.subRegion.name } : null,
        district: r.subCounty?.county?.district ? { id: r.subCounty.county.district.id, name: r.subCounty.county.district.name } : null,
        county: r.subCounty?.county ? { id: r.subCounty.county.id, name: r.subCounty.county.name } : null,
        subCounty: r.subCounty ? { id: r.subCounty.id, name: r.subCounty.name } : null,
        parish: { id: r.id, name: r.name },
      })
    }

    // ─── Village ───
    if (!levelFilter || levelFilter === 'village') {
      const rows = await db.village.findMany({
        where: { name: contains },
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          parish: {
            select: {
              id: true, name: true,
              subCounty: {
                select: {
                  id: true, name: true,
                  county: {
                    select: {
                      id: true, name: true,
                      district: {
                        select: {
                          id: true, name: true,
                          subRegion: {
                            select: {
                              id: true, name: true,
                              region: { select: { id: true, name: true } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
      for (const r of rows) push('village', r, {
        region: r.parish?.subCounty?.county?.district?.subRegion?.region ? { id: r.parish.subCounty.county.district.subRegion.region.id, name: r.parish.subCounty.county.district.subRegion.region.name } : null,
        subRegion: r.parish?.subCounty?.county?.district?.subRegion ? { id: r.parish.subCounty.county.district.subRegion.id, name: r.parish.subCounty.county.district.subRegion.name } : null,
        district: r.parish?.subCounty?.county?.district ? { id: r.parish.subCounty.county.district.id, name: r.parish.subCounty.county.district.name } : null,
        county: r.parish?.subCounty?.county ? { id: r.parish.subCounty.county.id, name: r.parish.subCounty.county.name } : null,
        subCounty: r.parish?.subCounty ? { id: r.parish.subCounty.id, name: r.parish.subCounty.name } : null,
        parish: r.parish ? { id: r.parish.id, name: r.parish.name } : null,
        village: { id: r.id, name: r.name },
      })
    }

    // Sort: villages first (most specific), then parishes, subCounties, counties,
    // districts, subRegions, regions. Within each level, alphabetical by name.
    const levelOrder = ['village', 'parish', 'subCounty', 'county', 'district', 'subRegion', 'region']
    results.sort((a, b) => {
      const lo = levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
      if (lo !== 0) return lo
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ data: results, total: results.length })
  } catch (error) {
    console.error('Geo search error:', error)
    return NextResponse.json({ error: 'Failed to search locations' }, { status: 500 })
  }
}
