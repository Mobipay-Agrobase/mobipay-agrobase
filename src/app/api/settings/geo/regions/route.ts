import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// NOTE: This is a SYSTEM_ROUTE that bypasses auth in middleware.
// Geo data (regions, districts, etc.) is shared across all tenants — no tenant isolation needed.

/**
 * GET /api/settings/geo/regions — List top-level regions (shallow, for lazy-loading the hierarchy)
 * POST /api/settings/geo/regions — Create a new region/sub-region/district/...
 * Body options:
 *   { name, country }                           → Create Region
 *   { name, regionId }                          → Create SubRegion
 *   { name, subRegionId }                       → Create District
 *   { name, districtId }                        → Create County
 *   { name, countyId }                          → Create SubCounty
 *   { name, subCountyId }                       → Create Parish
 *   { name, parishId }                          → Create Village
 */
export async function GET() {
  try {
    const regions = await db.region.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        _count: { select: { subRegions: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: regions })
  } catch (error) {
    console.error('Geo regions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.parishId) {
      const village = await db.village.create({ data: { name: body.name, parishId: body.parishId } })
      return NextResponse.json({ data: village }, { status: 201 })
    }
    if (body.subCountyId) {
      const parish = await db.parish.create({ data: { name: body.name, subCountyId: body.subCountyId } })
      return NextResponse.json({ data: parish }, { status: 201 })
    }
    if (body.countyId) {
      const subCounty = await db.subCounty.create({ data: { name: body.name, countyId: body.countyId } })
      return NextResponse.json({ data: subCounty }, { status: 201 })
    }
    if (body.districtId) {
      const county = await db.county.create({ data: { name: body.name, districtId: body.districtId } })
      return NextResponse.json({ data: county }, { status: 201 })
    }
    if (body.subRegionId) {
      const district = await db.district.create({ data: { name: body.name, subRegionId: body.subRegionId } })
      return NextResponse.json({ data: district }, { status: 201 })
    }
    if (body.regionId) {
      const subRegion = await db.subRegion.create({ data: { name: body.name, regionId: body.regionId } })
      return NextResponse.json({ data: subRegion }, { status: 201 })
    }

    // Default: Create Region
    const region = await db.region.create({ data: { name: body.name, country: body.country || 'Uganda' } })
    return NextResponse.json({ data: region }, { status: 201 })
  } catch (error) {
    console.error('Geo create error:', error)
    return NextResponse.json({ error: 'Failed to create geo entity' }, { status: 500 })
  }
}