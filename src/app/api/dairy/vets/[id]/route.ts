import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyVet.findFirst({
      where: { id, ...tf },
      include: {
        serviceAreas: true,
        reviews: { take: 20, orderBy: { createdAt: 'desc' } },
        _count: { select: { vetRequests: true, reviews: true, serviceAreas: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Vet not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyVet detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch vet' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVet.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vet not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyVet.update({
      where: { id },
      data: {
        vetCode: body.vetCode !== undefined ? body.vetCode || null : undefined,
        fullName: body.fullName !== undefined ? body.fullName : undefined,
        licenseNumber: body.licenseNumber !== undefined ? body.licenseNumber || null : undefined,
        isVerified: body.isVerified !== undefined ? !!body.isVerified : undefined,
        verifiedAt:
          body.verifiedAt !== undefined ? (body.verifiedAt ? new Date(body.verifiedAt) : null) : undefined,
        verifiedBy: body.verifiedBy !== undefined ? body.verifiedBy || null : undefined,
        phone: body.phone !== undefined ? body.phone || null : undefined,
        email: body.email !== undefined ? body.email || null : undefined,
        specialties:
          body.specialties !== undefined
            ? body.specialties
              ? (Array.isArray(body.specialties) ? JSON.stringify(body.specialties) : String(body.specialties))
              : null
            : undefined,
        workingHours:
          body.workingHours !== undefined
            ? body.workingHours
              ? (typeof body.workingHours === 'object' ? JSON.stringify(body.workingHours) : String(body.workingHours))
              : null
            : undefined,
        rating: body.rating !== undefined ? (body.rating ? parseFloat(body.rating) : 0) : undefined,
        totalReviews: body.totalReviews !== undefined ? parseInt(body.totalReviews) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyVet update error:', error)
    return NextResponse.json(
      { error: 'Failed to update vet', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyVet.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Vet not found' }, { status: 404 })
    await db.dairyVet.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyVet delete error:', error)
    return NextResponse.json({ error: 'Failed to delete vet' }, { status: 500 })
  }
}
