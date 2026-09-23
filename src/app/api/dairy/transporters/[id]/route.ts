import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyTransporter.findFirst({
      where: { id, ...tf },
      include: {
        vehicles: { take: 20, orderBy: { createdAt: 'desc' } },
        trips: { take: 20, orderBy: { tripDate: 'desc' }, include: { vehicle: { select: { id: true, plateNo: true } } } },
        _count: { select: { vehicles: true, trips: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Transporter not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyTransporter detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch transporter' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTransporter.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Transporter not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyTransporter.update({
      where: { id },
      data: {
        transporterCode: body.transporterCode !== undefined ? body.transporterCode || null : undefined,
        fullName: body.fullName !== undefined ? body.fullName : undefined,
        companyName: body.companyName !== undefined ? body.companyName || null : undefined,
        transporterType: body.transporterType !== undefined ? body.transporterType : undefined,
        licenceNo: body.licenceNo !== undefined ? body.licenceNo || null : undefined,
        insuranceExpiry: body.insuranceExpiry !== undefined ? (body.insuranceExpiry ? new Date(body.insuranceExpiry) : null) : undefined,
        phone: body.phone !== undefined ? body.phone || null : undefined,
        verificationStatus: body.verificationStatus !== undefined ? body.verificationStatus : undefined,
        avgRating: body.avgRating !== undefined ? (body.avgRating ? parseFloat(body.avgRating) : 0) : undefined,
        totalReviews: body.totalReviews !== undefined ? (body.totalReviews ? parseInt(body.totalReviews) : 0) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyTransporter update error:', error)
    return NextResponse.json(
      { error: 'Failed to update transporter', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTransporter.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Transporter not found' }, { status: 404 })
    await db.dairyTransporter.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyTransporter delete error:', error)
    return NextResponse.json({ error: 'Failed to delete transporter' }, { status: 500 })
  }
}
