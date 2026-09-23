import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyVaccinationProtocol.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Vaccination protocol not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyVaccinationProtocol detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch vaccination protocol' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVaccinationProtocol.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vaccination protocol not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyVaccinationProtocol.update({
      where: { id },
      data: {
        country: body.country !== undefined ? body.country : undefined,
        vaccineName: body.vaccineName !== undefined ? body.vaccineName : undefined,
        disease: body.disease !== undefined ? body.disease || null : undefined,
        species: body.species !== undefined ? body.species : undefined,
        ageStartMonths: body.ageStartMonths !== undefined ? parseInt(body.ageStartMonths) : undefined,
        ageEndMonths:
          body.ageEndMonths !== undefined ? (body.ageEndMonths ? parseInt(body.ageEndMonths) : null) : undefined,
        doseSchedule:
          body.doseSchedule !== undefined
            ? body.doseSchedule
              ? (Array.isArray(body.doseSchedule) ? JSON.stringify(body.doseSchedule) : String(body.doseSchedule))
              : null
            : undefined,
        boosterIntervalDays:
          body.boosterIntervalDays !== undefined
            ? body.boosterIntervalDays
              ? parseInt(body.boosterIntervalDays)
              : null
            : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyVaccinationProtocol update error:', error)
    return NextResponse.json(
      { error: 'Failed to update vaccination protocol', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVaccinationProtocol.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vaccination protocol not found' }, { status: 404 })
    await db.dairyVaccinationProtocol.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyVaccinationProtocol delete error:', error)
    return NextResponse.json({ error: 'Failed to delete vaccination protocol' }, { status: 500 })
  }
}
