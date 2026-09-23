import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyPickup.findFirst({
      where: { id, ...tf },
      include: {
        trip: {
          include: {
            transporter: { select: { id: true, fullName: true, phone: true } },
            vehicle: { select: { id: true, plateNo: true, vehicleType: true } },
          },
        },
      },
    })
    if (!item) return NextResponse.json({ error: 'Pickup not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyPickup detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch pickup' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPickup.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Pickup not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyPickup.update({
      where: { id },
      data: {
        tripId: body.tripId !== undefined ? body.tripId : undefined,
        farmerId: body.farmerId !== undefined ? body.farmerId || null : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName : undefined,
        receiptNo: body.receiptNo !== undefined ? body.receiptNo : undefined,
        litres: body.litres !== undefined ? (body.litres ? parseFloat(body.litres) : undefined) : undefined,
        pickedAt: body.pickedAt !== undefined ? (body.pickedAt ? new Date(body.pickedAt) : undefined) : undefined,
        lat: body.lat !== undefined ? (body.lat ? parseFloat(body.lat) : null) : undefined,
        lng: body.lng !== undefined ? (body.lng ? parseFloat(body.lng) : null) : undefined,
        qrVerified: body.qrVerified !== undefined ? !!body.qrVerified : undefined,
        smsSentAt: body.smsSentAt !== undefined ? (body.smsSentAt ? new Date(body.smsSentAt) : null) : undefined,
        farmerConfirmed: body.farmerConfirmed !== undefined ? !!body.farmerConfirmed : undefined,
        quickTestJson: body.quickTestJson !== undefined ? body.quickTestJson || null : undefined,
        grade: body.grade !== undefined ? body.grade || null : undefined,
        pricePerLitre: body.pricePerLitre !== undefined ? (body.pricePerLitre ? parseFloat(body.pricePerLitre) : null) : undefined,
        grossAmount: body.grossAmount !== undefined ? (body.grossAmount ? parseFloat(body.grossAmount) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyPickup update error:', error)
    return NextResponse.json(
      { error: 'Failed to update pickup', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPickup.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Pickup not found' }, { status: 404 })
    await db.dairyPickup.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyPickup delete error:', error)
    return NextResponse.json({ error: 'Failed to delete pickup' }, { status: 500 })
  }
}
