import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { numericId } from '@/lib/mobile/ekibbo-adapter'
import { resolveByNumericId, isMobileStaff } from '@/lib/mobile/ekibbo-mobile-utils'

/**
 * GET /api/mobile/ekibbo-geo?type=country|province|district|commune|cooperatives&parentId=<numeric>
 *
 * Serves the upstream mobile location cascade from the Agrobase geo
 * hierarchy:
 *   upstream Country  ← Region (top level)
 *   upstream Province ← SubRegion (children of a region)
 *   upstream District ← District (children of a sub-region)
 *   upstream Commune  ← SubCounty (all sub-counties under the district's counties)
 *   cooperatives      ← FarmerGroup (tenant-scoped, staff only)
 *
 * Geo data is system-wide (like /api/settings/geo/*). Staff screens only —
 * farmer-role accounts are rejected (mirrors web RBAC).
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext(req)
    if (!isMobileStaff(ctx.role)) {
      return NextResponse.json({ result: false, message: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'country'
    const parentIdRaw = searchParams.get('parentId') || ''
    const parentId = parentIdRaw ? parseInt(parentIdRaw, 10) : null

    switch (type) {
      case 'country': {
        const regions = await db.region.findMany({
          select: { id: true, name: true, country: true },
          orderBy: { name: 'asc' },
          take: 200,
        })
        return NextResponse.json({
          result: true,
          data: regions.map(r => ({
            id: numericId(r.id),
            country_name: r.name,
            country_code: r.country,
          })),
        })
      }
      case 'province': {
        let subRegions
        if (parentId != null) {
          const regions = await db.region.findMany({ select: { id: true }, take: 500 })
          const region = await resolveByNumericId(regions, parentId)
          subRegions = region
            ? await db.subRegion.findMany({
                where: { regionId: region.id },
                select: { id: true, name: true, regionId: true },
                orderBy: { name: 'asc' },
                take: 200,
              })
            : []
        } else {
          subRegions = await db.subRegion.findMany({
            select: { id: true, name: true, regionId: true },
            orderBy: { name: 'asc' },
            take: 500,
          })
        }
        return NextResponse.json({
          result: true,
          data: subRegions.map(s => ({
            id: numericId(s.id),
            province_name: s.name,
            province_code: '',
            country_id: numericId(s.regionId),
          })),
        })
      }
      case 'district': {
        let districts
        if (parentId != null) {
          const subRegions = await db.subRegion.findMany({ select: { id: true }, take: 1000 })
          const subRegion = await resolveByNumericId(subRegions, parentId)
          districts = subRegion
            ? await db.district.findMany({
                where: { subRegionId: subRegion.id },
                select: { id: true, name: true, subRegionId: true },
                orderBy: { name: 'asc' },
                take: 200,
              })
            : []
        } else {
          districts = await db.district.findMany({
            select: { id: true, name: true, subRegionId: true },
            orderBy: { name: 'asc' },
            take: 500,
          })
        }
        return NextResponse.json({
          result: true,
          data: districts.map(d => ({
            id: numericId(d.id),
            district_name: d.name,
            district_code: '',
            province_id: numericId(d.subRegionId),
          })),
        })
      }
      case 'commune': {
        let subCounties
        if (parentId != null) {
          const districts = await db.district.findMany({ select: { id: true }, take: 1000 })
          const district = await resolveByNumericId(districts, parentId)
          subCounties = district
            ? await db.subCounty.findMany({
                where: { county: { districtId: district.id } },
                select: { id: true, name: true, countyId: true },
                orderBy: { name: 'asc' },
                take: 200,
              })
            : []
        } else {
          subCounties = await db.subCounty.findMany({
            select: { id: true, name: true, countyId: true },
            orderBy: { name: 'asc' },
            take: 500,
          })
        }
        return NextResponse.json({
          result: true,
          data: subCounties.map(s => ({
            id: numericId(s.id),
            commune_name: s.name,
            commune_code: '',
            district_id: numericId(s.countyId),
          })),
        })
      }
      case 'cooperatives': {
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
            id: numericId(g.id),
            staff_id: 0,
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
