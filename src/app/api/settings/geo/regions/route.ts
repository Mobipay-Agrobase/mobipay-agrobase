import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// NOTE: This is a SYSTEM_ROUTE that bypasses auth in middleware.
// Geo data (regions, districts, etc.) is shared across all tenants — no tenant isolation needed.

/**
 * GET /api/settings/geo/regions — Get full geographic hierarchy tree
 * POST /api/settings/geo/regions — Create a new region/sub-region/district
 */
export async function GET() {
  try {
    const regions = await db.region.findMany({
      include: {
        subRegions: {
          include: {
            districts: {
              include: {
                constituencies: {
                  include: {
                    subCounties: {
                      include: {
                        parishes: {
                          include: { villages: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ data: regions })
  } catch (error) {
    console.error('Geo regions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
  }
}

/**
 * POST /api/settings/geo/regions — Create geographic entities at any level
 * 
 * Body options:
 *   { name, country }                           → Create Region
 *   { name, regionId }                          → Create SubRegion
 *   { name, subRegionId }                       → Create District
 *   { name, districtId }                        → Create Constituency
 *   { name, constituencyId }                    → Create SubCounty
 *   { name, subCountyId }                       → Create Parish
 *   { name, parishId }                          → Create Village
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Determine level based on parent ID provided
    if (body.parishId) {
      const village = await db.village.create({
        data: { name: body.name, parishId: body.parishId }
      })
      return NextResponse.json({ data: village }, { status: 201 })
    }
    if (body.subCountyId) {
      const parish = await db.parish.create({
        data: { name: body.name, subCountyId: body.subCountyId }
      })
      return NextResponse.json({ data: parish }, { status: 201 })
    }
    if (body.constituencyId) {
      const subCounty = await db.subCounty.create({
        data: { name: body.name, constituencyId: body.constituencyId }
      })
      return NextResponse.json({ data: subCounty }, { status: 201 })
    }
    if (body.districtId) {
      const constituency = await db.constituency.create({
        data: { name: body.name, districtId: body.districtId }
      })
      return NextResponse.json({ data: constituency }, { status: 201 })
    }
    if (body.subRegionId) {
      const district = await db.district.create({
        data: { name: body.name, subRegionId: body.subRegionId }
      })
      return NextResponse.json({ data: district }, { status: 201 })
    }
    if (body.regionId) {
      const subRegion = await db.subRegion.create({
        data: { name: body.name, regionId: body.regionId }
      })
      return NextResponse.json({ data: subRegion }, { status: 201 })
    }
    
    // Default: Create Region
    const region = await db.region.create({
      data: { name: body.name, country: body.country || 'Uganda' }
    })
    return NextResponse.json({ data: region }, { status: 201 })
  } catch (error) {
    console.error('Geo create error:', error)
    return NextResponse.json({ error: 'Failed to create geo entity' }, { status: 500 })
  }
}
