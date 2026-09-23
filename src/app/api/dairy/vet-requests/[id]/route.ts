import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyVetRequest.findFirst({
      where: { id, ...tf },
      include: {
        cow: { select: { id: true, name: true, cowCode: true, tagNumber: true } },
        vet: { select: { id: true, fullName: true, phone: true, rating: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Vet request not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyVetRequest detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch vet request' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVetRequest.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vet request not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyVetRequest.update({
      where: { id },
      data: {
        cowId: body.cowId !== undefined ? body.cowId || null : undefined,
        farmerId: body.farmerId !== undefined ? body.farmerId || null : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName || null : undefined,
        farmerPhone: body.farmerPhone !== undefined ? body.farmerPhone || null : undefined,
        vetId: body.vetId !== undefined ? body.vetId || null : undefined,
        symptom: body.symptom !== undefined ? body.symptom : undefined,
        urgency: body.urgency !== undefined ? body.urgency : undefined,
        status: body.status !== undefined ? body.status : undefined,
        acceptedAt:
          body.acceptedAt !== undefined ? (body.acceptedAt ? new Date(body.acceptedAt) : null) : undefined,
        completedAt:
          body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined,
        diagnosis: body.diagnosis !== undefined ? body.diagnosis || null : undefined,
        treatment: body.treatment !== undefined ? body.treatment || null : undefined,
        prescriptionUrl: body.prescriptionUrl !== undefined ? body.prescriptionUrl || null : undefined,
        visitFee:
          body.visitFee !== undefined ? (body.visitFee ? parseFloat(body.visitFee) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyVetRequest update error:', error)
    return NextResponse.json(
      { error: 'Failed to update vet request', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVetRequest.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vet request not found' }, { status: 404 })
    await db.dairyVetRequest.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyVetRequest delete error:', error)
    return NextResponse.json({ error: 'Failed to delete vet request' }, { status: 500 })
  }
}
