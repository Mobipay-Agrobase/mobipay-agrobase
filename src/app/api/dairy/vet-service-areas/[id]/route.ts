import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * DairyVetServiceArea has no tenantId column; tenant scoping is enforced via the
 * parent DairyVet relation (vet.tenantId).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyVetServiceArea.findFirst({
      where: { id, vet: { ...tf } },
      include: { vet: { select: { id: true, fullName: true, phone: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Vet service area not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyVetServiceArea detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch vet service area' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVetServiceArea.findFirst({ where: { id, vet: { ...tf } } })
    if (!existing) return NextResponse.json({ error: 'Vet service area not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyVetServiceArea.update({
      where: { id },
      data: {
        vetId: body.vetId !== undefined ? body.vetId : undefined,
        district: body.district !== undefined ? body.district : undefined,
        subCounty: body.subCounty !== undefined ? body.subCounty || null : undefined,
        radiusKm:
          body.radiusKm !== undefined ? (body.radiusKm ? parseFloat(body.radiusKm) : null) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyVetServiceArea update error:', error)
    return NextResponse.json(
      { error: 'Failed to update vet service area', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVetServiceArea.findFirst({ where: { id, vet: { ...tf } } })
    if (!existing) return NextResponse.json({ error: 'Vet service area not found' }, { status: 404 })
    await db.dairyVetServiceArea.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyVetServiceArea delete error:', error)
    return NextResponse.json({ error: 'Failed to delete vet service area' }, { status: 500 })
  }
}
