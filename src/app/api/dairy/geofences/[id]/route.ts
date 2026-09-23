import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyGeofence.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Geofence not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyGeofence detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch geofence' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyGeofence.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Geofence not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyGeofence.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        fenceType: body.fenceType !== undefined ? body.fenceType : undefined,
        polygonJson: body.polygonJson !== undefined ? body.polygonJson : undefined,
        centerLat:
          body.centerLat !== undefined
            ? body.centerLat !== null && body.centerLat !== ''
              ? parseFloat(body.centerLat)
              : null
            : undefined,
        centerLng:
          body.centerLng !== undefined
            ? body.centerLng !== null && body.centerLng !== ''
              ? parseFloat(body.centerLng)
              : null
            : undefined,
        radiusKm:
          body.radiusKm !== undefined
            ? body.radiusKm !== null && body.radiusKm !== ''
              ? parseFloat(body.radiusKm)
              : null
            : undefined,
        alertOnExit: body.alertOnExit !== undefined ? !!body.alertOnExit : undefined,
        alertOnEntry: body.alertOnEntry !== undefined ? !!body.alertOnEntry : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyGeofence update error:', error)
    return NextResponse.json(
      { error: 'Failed to update geofence', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyGeofence.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Geofence not found' }, { status: 404 })
    await db.dairyGeofence.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyGeofence delete error:', error)
    return NextResponse.json({ error: 'Failed to delete geofence' }, { status: 500 })
  }
}
