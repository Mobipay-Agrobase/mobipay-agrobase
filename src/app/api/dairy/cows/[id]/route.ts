import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyCow.findFirst({
      where: { id, ...tf },
      include: {
        shed: true,
        milkingRecords: { take: 10, orderBy: { milkingDate: 'desc' } },
        vaccinationRecords: { take: 10, orderBy: { vaccinationDate: 'desc' } },
        healthChecks: { take: 10, orderBy: { checkDate: 'desc' } },
        weights: { take: 10, orderBy: { weightDate: 'desc' } },
        feedSchedules: { take: 10, orderBy: { feedDate: 'desc' }, include: { feedItem: { select: { id: true, name: true } } } },
        breedingEvents: { take: 10, orderBy: { breedingDate: 'desc' } },
        _count: {
          select: { milkingRecords: true, vaccinationRecords: true, healthChecks: true, weights: true },
        },
      },
    })
    if (!item) return NextResponse.json({ error: 'Cow not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyCow detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch cow' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyCow.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Cow not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyCow.update({
      where: { id },
      data: {
        farmId: body.farmId !== undefined ? body.farmId || null : undefined,
        farmerId: body.farmerId !== undefined ? body.farmerId || null : undefined,
        cowCode: body.cowCode !== undefined ? body.cowCode || null : undefined,
        tagNumber: body.tagNumber !== undefined ? body.tagNumber || null : undefined,
        rfidUid: body.rfidUid !== undefined ? body.rfidUid || null : undefined,
        name: body.name !== undefined ? body.name || null : undefined,
        breed: body.breed !== undefined ? body.breed || null : undefined,
        coatColor: body.coatColor !== undefined ? body.coatColor || null : undefined,
        type: body.type !== undefined ? body.type : undefined,
        gender: body.gender !== undefined ? body.gender : undefined,
        dateOfBirth: body.dateOfBirth !== undefined ? (body.dateOfBirth ? new Date(body.dateOfBirth) : null) : undefined,
        approximateAgeMonths: body.approximateAgeMonths !== undefined ? (body.approximateAgeMonths ? parseInt(body.approximateAgeMonths) : null) : undefined,
        purchaseDate: body.purchaseDate !== undefined ? (body.purchaseDate ? new Date(body.purchaseDate) : null) : undefined,
        purchasePrice: body.purchasePrice !== undefined ? (body.purchasePrice ? parseFloat(body.purchasePrice) : null) : undefined,
        photoUrl: body.photoUrl !== undefined ? body.photoUrl || null : undefined,
        lifecycleState: body.lifecycleState !== undefined ? body.lifecycleState : undefined,
        sireId: body.sireId !== undefined ? body.sireId || null : undefined,
        damId: body.damId !== undefined ? body.damId || null : undefined,
        shedId: body.shedId !== undefined ? body.shedId || null : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyCow update error:', error)
    return NextResponse.json(
      { error: 'Failed to update cow', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyCow.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Cow not found' }, { status: 404 })
    await db.dairyCow.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyCow delete error:', error)
    return NextResponse.json({ error: 'Failed to delete cow' }, { status: 500 })
  }
}
