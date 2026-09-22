import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyBreedingEvent.findFirst({
      where: { id, ...tf },
      include: {
        dam: { select: { id: true, name: true, cowCode: true } },
        sire: { select: { id: true, name: true, cowCode: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Breeding event not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyBreedingEvent detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch breeding event' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyBreedingEvent.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Breeding event not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyBreedingEvent.update({
      where: { id },
      data: {
        damId: body.damId !== undefined ? body.damId : undefined,
        sireId: body.sireId !== undefined ? body.sireId || null : undefined,
        breedingDate: body.breedingDate !== undefined ? new Date(body.breedingDate) : undefined,
        breedingType: body.breedingType !== undefined ? body.breedingType : undefined,
        semenBatch: body.semenBatch !== undefined ? body.semenBatch || null : undefined,
        aiTechnician: body.aiTechnician !== undefined ? body.aiTechnician || null : undefined,
        expectedBirthDate: body.expectedBirthDate !== undefined ? (body.expectedBirthDate ? new Date(body.expectedBirthDate) : null) : undefined,
        actualBirthDate: body.actualBirthDate !== undefined ? (body.actualBirthDate ? new Date(body.actualBirthDate) : null) : undefined,
        offspringCount: body.offspringCount !== undefined ? (body.offspringCount ? parseInt(body.offspringCount) : null) : undefined,
        pregnancyConfirmed: body.pregnancyConfirmed !== undefined ? !!body.pregnancyConfirmed : undefined,
        pregnancyCheckDate: body.pregnancyCheckDate !== undefined ? (body.pregnancyCheckDate ? new Date(body.pregnancyCheckDate) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyBreedingEvent update error:', error)
    return NextResponse.json(
      { error: 'Failed to update breeding event', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyBreedingEvent.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Breeding event not found' }, { status: 404 })
    await db.dairyBreedingEvent.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyBreedingEvent delete error:', error)
    return NextResponse.json({ error: 'Failed to delete breeding event' }, { status: 500 })
  }
}
