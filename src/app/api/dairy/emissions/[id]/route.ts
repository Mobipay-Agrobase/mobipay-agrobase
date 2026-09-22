import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyEmissionRecord.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Emission record not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyEmissionRecord detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch emission record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyEmissionRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Emission record not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyEmissionRecord.update({
      where: { id },
      data: {
        recordDate: body.recordDate !== undefined ? new Date(body.recordDate) : undefined,
        species: body.species !== undefined ? body.species : undefined,
        animalCount: body.animalCount !== undefined ? parseInt(body.animalCount) : undefined,
        entericMethaneKgDay: body.entericMethaneKgDay !== undefined ? (body.entericMethaneKgDay ? parseFloat(body.entericMethaneKgDay) : null) : undefined,
        manureEmissionsKgDay: body.manureEmissionsKgDay !== undefined ? (body.manureEmissionsKgDay ? parseFloat(body.manureEmissionsKgDay) : null) : undefined,
        totalEmissionsKgCO2e: body.totalEmissionsKgCO2e !== undefined ? (body.totalEmissionsKgCO2e ? parseFloat(body.totalEmissionsKgCO2e) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyEmissionRecord update error:', error)
    return NextResponse.json(
      { error: 'Failed to update emission record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyEmissionRecord.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Emission record not found' }, { status: 404 })
    await db.dairyEmissionRecord.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyEmissionRecord delete error:', error)
    return NextResponse.json({ error: 'Failed to delete emission record' }, { status: 500 })
  }
}
