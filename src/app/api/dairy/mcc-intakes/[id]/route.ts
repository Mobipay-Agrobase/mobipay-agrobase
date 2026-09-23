import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyMccIntake.findFirst({
      where: { id, ...tf },
      include: {
        mcc: { select: { id: true, name: true, capacityLitres: true, hasCooler: true, offtaker: { select: { id: true, name: true } } } },
      },
    })
    if (!item) return NextResponse.json({ error: 'MCC intake not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyMccIntake detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch MCC intake' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMccIntake.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'MCC intake not found' }, { status: 404 })
    const body = await req.json()

    const litresReceived = body.litresReceived !== undefined ? (body.litresReceived ? parseFloat(body.litresReceived) : undefined) : undefined
    const litresAccepted = body.litresAccepted !== undefined ? (body.litresAccepted ? parseFloat(body.litresAccepted) : undefined) : undefined
    let litresRejected: number | undefined = undefined
    if (body.litresRejected !== undefined) {
      litresRejected = body.litresRejected ? parseFloat(body.litresRejected) : undefined
    } else if (litresReceived !== undefined && litresAccepted !== undefined) {
      litresRejected = Math.max(0, litresReceived - litresAccepted)
    }
    const pricePerLitre = body.pricePerLitre !== undefined ? (body.pricePerLitre ? parseFloat(body.pricePerLitre) : undefined) : undefined
    let grossAmount: number | undefined = undefined
    if (body.grossAmount !== undefined) {
      grossAmount = body.grossAmount ? parseFloat(body.grossAmount) : undefined
    } else if (litresAccepted !== undefined && pricePerLitre !== undefined) {
      grossAmount = litresAccepted * pricePerLitre
    }

    const updated = await db.dairyMccIntake.update({
      where: { id },
      data: {
        mccId: body.mccId !== undefined ? body.mccId : undefined,
        farmerId: body.farmerId !== undefined ? body.farmerId || null : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName : undefined,
        pickupId: body.pickupId !== undefined ? body.pickupId || null : undefined,
        intakeDate: body.intakeDate !== undefined ? (body.intakeDate ? new Date(body.intakeDate) : undefined) : undefined,
        session: body.session !== undefined ? body.session : undefined,
        litresReceived,
        litresAccepted,
        litresRejected,
        rejectReason: body.rejectReason !== undefined ? body.rejectReason || null : undefined,
        grade: body.grade !== undefined ? body.grade : undefined,
        pricePerLitre,
        grossAmount,
        currency: body.currency !== undefined ? body.currency : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyMccIntake update error:', error)
    return NextResponse.json(
      { error: 'Failed to update MCC intake', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyMccIntake.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'MCC intake not found' }, { status: 404 })
    await db.dairyMccIntake.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyMccIntake delete error:', error)
    return NextResponse.json({ error: 'Failed to delete MCC intake' }, { status: 500 })
  }
}
