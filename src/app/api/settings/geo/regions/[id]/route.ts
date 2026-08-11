import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/settings/geo/regions/[id] — Get a region with full hierarchy
 * PUT /api/settings/geo/regions/[id] — Update a region
 * DELETE /api/settings/geo/regions/[id] — Delete a region (soft or hard)
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const region = await db.region.findUnique({
      where: { id },
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
      }
    })
    if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 })
    return NextResponse.json({ data: region })
  } catch (error) {
    console.error('Region fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch region' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const region = await db.region.update({
      where: { id },
      data: {
        name: body.name,
        country: body.country,
      },
    })
    return NextResponse.json({ data: region })
  } catch (error) {
    console.error('Region update error:', error)
    return NextResponse.json({ error: 'Failed to update region' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Check if region has any sub-regions
    const subRegionCount = await db.subRegion.count({ where: { regionId: id } })
    if (subRegionCount > 0) {
      return NextResponse.json({ error: 'Cannot delete region with sub-regions. Remove sub-regions first.' }, { status: 400 })
    }
    await db.region.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Region delete error:', error)
    return NextResponse.json({ error: 'Failed to delete region' }, { status: 500 })
  }
}
