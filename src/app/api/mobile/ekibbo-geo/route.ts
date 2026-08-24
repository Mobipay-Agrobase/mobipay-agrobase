import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'
import { resolveByNumericId, isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * GET /api/mobile/ekibbo-geo
 *   ?type=region|sub-region|district|county|sub-county|parish|village|villages-flat|cooperatives
 *   &parentId=<numeric id of the parent level>
 *
 * The FULL 7-level location hierarchy exactly as the web Location Master
 * manages it:
 *   Region → SubRegion → District → County → SubCounty → Parish → Village
 *
 * (Legacy aliases kept for older app builds: country=region,
 * province=sub-region, commune=sub-county.)
 * Geo data is system-wide; cooperatives are tenant-scoped (staff only).
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    const { searchParams } = new URL(req.url)
    let type = searchParams.get('type') || 'region'
    const parentIdRaw = searchParams.get('parentId') || ''
    const parentId = parentIdRaw ? parseInt(parentIdRaw, 10) : null

    // Legacy aliases from earlier app builds
    const ALIASES: Record<string, string> = {
      country: 'region', province: 'sub-region', district: 'district',
      commune: 'sub-county', village: 'village',
    }
    type = ALIASES[type] || type

    switch (type) {
      case 'region': {
        const regions = await db.region.findMany({
          select: { id: true, name: true, country: true },
          orderBy: { name: 'asc' },
          take: 300,
        })
        return NextResponse.json({
          result: true,
          data: regions.map(r => ({
            id: numericId(r.id), region_name: r.name, country_code: r.country,
            country_name: r.name, // legacy alias field
          })),
        })
      }
      case 'sub-region': {
        let rows
        if (parentId != null) {
          const regions = await db.region.findMany({ select: { id: true }, take: 500 })
          const region = await resolveByNumericId(regions, parentId)
          rows = region
            ? await db.subRegion.findMany({
                where: { regionId: region.id },
                select: { id: true, name: true, regionId: true },
                orderBy: { name: 'asc' }, take: 300,
              })
            : []
        } else {
          rows = await db.subRegion.findMany({
            select: { id: true, name: true, regionId: true },
            orderBy: { name: 'asc' }, take: 1000,
          })
        }
        return NextResponse.json({
          result: true,
          data: rows.map(s => ({
            id: numericId(s.id), sub_region_name: s.name, region_id: numericId(s.regionId),
            province_name: s.name, country_id: numericId(s.regionId), // legacy alias fields
          })),
        })
      }
      case 'district': {
        let rows
        if (parentId != null) {
          const subs = await db.subRegion.findMany({ select: { id: true }, take: 1500 })
          const sub = await resolveByNumericId(subs, parentId)
          rows = sub
            ? await db.district.findMany({
                where: { subRegionId: sub.id },
                select: { id: true, name: true, subRegionId: true },
                orderBy: { name: 'asc' }, take: 300,
              })
            : []
        } else {
          rows = await db.district.findMany({
            select: { id: true, name: true, subRegionId: true },
            orderBy: { name: 'asc' }, take: 1000,
          })
        }
        return NextResponse.json({
          result: true,
          data: rows.map(d => ({
            id: numericId(d.id), district_name: d.name,
            sub_region_id: numericId(d.subRegionId), province_id: numericId(d.subRegionId),
          })),
        })
      }
      case 'county': {
        let rows
        if (parentId != null) {
          const districts = await db.district.findMany({ select: { id: true }, take: 1500 })
          const district = await resolveByNumericId(districts, parentId)
          rows = district
            ? await db.county.findMany({
                where: { districtId: district.id },
                select: { id: true, name: true, districtId: true },
                orderBy: { name: 'asc' }, take: 300,
              })
            : []
        } else {
          rows = []
        }
        return NextResponse.json({
          result: true,
          data: rows.map(c => ({
            id: numericId(c.id), county_name: c.name, district_id: numericId(c.districtId),
          })),
        })
      }
      case 'sub-county': {
        let rows
        if (parentId != null) {
          const counties = await db.county.findMany({ select: { id: true }, take: 2000 })
          const county = await resolveByNumericId(counties, parentId)
          rows = county
            ? await db.subCounty.findMany({
                where: { countyId: county.id },
                select: { id: true, name: true, countyId: true },
                orderBy: { name: 'asc' }, take: 300,
              })
            : []
        } else {
          rows = await db.subCounty.findMany({
            select: { id: true, name: true, countyId: true },
            orderBy: { name: 'asc' }, take: 3000,
          })
        }
        return NextResponse.json({
          result: true,
          data: rows.map(s => ({
            id: numericId(s.id), sub_county_name: s.name, county_id: numericId(s.countyId),
            commune_name: s.name, district_id: numericId(s.countyId), // legacy alias fields
          })),
        })
      }
      case 'parish': {
        let rows
        if (parentId != null) {
          const subCounties = await db.subCounty.findMany({ select: { id: true }, take: 3000 })
          const subCounty = await resolveByNumericId(subCounties, parentId)
          rows = subCounty
            ? await db.parish.findMany({
                where: { subCountyId: subCounty.id },
                select: { id: true, name: true, subCountyId: true },
                orderBy: { name: 'asc' }, take: 300,
              })
            : []
        } else {
          rows = []
        }
        return NextResponse.json({
          result: true,
          data: rows.map(p => ({
            id: numericId(p.id), parish_name: p.name, sub_county_id: numericId(p.subCountyId),
          })),
        })
      }
      case 'village': {
        let rows
        if (parentId != null) {
          const parishes = await db.parish.findMany({ select: { id: true }, take: 5000 })
          const parish = await resolveByNumericId(parishes, parentId)
          rows = parish
            ? await db.village.findMany({
                where: { parishId: parish.id },
                select: { id: true, name: true, parishId: true },
                orderBy: { name: 'asc' }, take: 500,
              })
            : []
        } else {
          rows = []
        }
        return NextResponse.json({
          result: true,
          data: rows.map(v => ({
            id: numericId(v.id), village_name: v.name, parish_id: numericId(v.parishId),
          })),
        })
      }
      case 'cooperatives': {
        if (!isMobileStaff(ctx.role)) {
          return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
        }
        const tf = buildTenantFilter(ctx, 'tenantId')
        const groups = await db.farmerGroup.findMany({
          where: tf,
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
          take: 500,
        })
        return NextResponse.json({
          result: true,
          data: groups.map((g, i) => ({
            id: numericId(g.id), staff_id: 0,
            // Return BOTH key spellings so every app build deserializes the
            // name correctly (older builds read `name`, newer read
            // `cooperative_name`).
            name: g.name,
            cooperative_name: g.name,
            cooperative_code: `GRP-${i + 1}`,
          })),
        })
      }
      default:
        return NextResponse.json({ result: false, message: 'Unknown type' }, { status: 400 })
    }
  } catch (error) {
    console.error('[ekibbo-geo]', error)
    return NextResponse.json({ result: false, message: 'Failed to load geo data' }, { status: 500 })
  }
}
