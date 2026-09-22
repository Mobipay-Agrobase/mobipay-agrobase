import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyVaccination.findFirst({
      where: { id, ...tf },
      include: { cow: { select: { id: true, name: true, cowCode: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Vaccination not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyVaccination detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch vaccination' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVaccination.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vaccination not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyVaccination.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId : undefined,
        vaccineName: body.vaccineName !== undefined ? body.vaccineName : undefined,
        vaccinationDate: body.vaccinationDate !== undefined ? new Date(body.vaccinationDate) : undefined,
        dose: body.dose !== undefined ? body.dose || null : undefined,
        nextDueDate: body.nextDueDate !== undefined ? (body.nextDueDate ? new Date(body.nextDueDate) : null) : undefined,
        effectObserved: body.effectObserved !== undefined ? body.effectObserved || null : undefined,
        administeredBy: body.administeredBy !== undefined ? body.administeredBy || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyVaccination update error:', error)
    return NextResponse.json(
      { error: 'Failed to update vaccination', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVaccination.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vaccination not found' }, { status: 404 })
    await db.dairyVaccination.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyVaccination delete error:', error)
    return NextResponse.json({ error: 'Failed to delete vaccination' }, { status: 500 })
  }
}
