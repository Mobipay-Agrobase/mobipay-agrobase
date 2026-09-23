import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/geofences — list geofences (paginated + search)
 * POST /api/dairy/geofences — create a new geofence
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const fenceType = searchParams.get('fenceType')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (fenceType) where.fenceType = fenceType
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fenceType: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyGeofence.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyGeofence.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyGeofence list error:', error)
    return NextResponse.json({ error: 'Failed to fetch geofences' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyGeofence.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name,
        fenceType: body.fenceType || 'grazing',
        polygonJson: body.polygonJson,
        centerLat: body.centerLat !== undefined && body.centerLat !== null ? parseFloat(body.centerLat) : null,
        centerLng: body.centerLng !== undefined && body.centerLng !== null ? parseFloat(body.centerLng) : null,
        radiusKm: body.radiusKm !== undefined && body.radiusKm !== null ? parseFloat(body.radiusKm) : null,
        alertOnExit: body.alertOnExit !== undefined ? !!body.alertOnExit : true,
        alertOnEntry: body.alertOnEntry !== undefined ? !!body.alertOnEntry : false,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyGeofence create error:', error)
    return NextResponse.json(
      { error: 'Failed to create geofence', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
