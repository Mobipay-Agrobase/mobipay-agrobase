import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyInsuranceEnrollment.findFirst({
      where: { id, ...tf },
      include: {
        product: {
          select: {
            id: true,
            productName: true,
            insurer: true,
            productType: true,
            coverageType: true,
            currency: true,
            premiumPerAnimal: true,
            coverageAmount: true,
          },
        },
      },
    })
    if (!item) return NextResponse.json({ error: 'Insurance enrollment not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyInsuranceEnrollment detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch insurance enrollment' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyInsuranceEnrollment.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Insurance enrollment not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyInsuranceEnrollment.update({
      where: { id },
      data: {
        productId: body.productId !== undefined ? body.productId : undefined,
        farmerId: body.farmerId !== undefined ? body.farmerId : undefined,
        farmerName: body.farmerName !== undefined ? body.farmerName : undefined,
        cowId: body.cowId !== undefined ? body.cowId || null : undefined,
        enrollmentDate:
          body.enrollmentDate !== undefined
            ? body.enrollmentDate
              ? new Date(body.enrollmentDate)
              : new Date()
            : undefined,
        premiumPaid:
          body.premiumPaid !== undefined
            ? body.premiumPaid !== null && body.premiumPaid !== ''
              ? parseFloat(body.premiumPaid)
              : null
            : undefined,
        coverageStart:
          body.coverageStart !== undefined
            ? body.coverageStart
              ? new Date(body.coverageStart)
              : new Date()
            : undefined,
        coverageEnd:
          body.coverageEnd !== undefined ? (body.coverageEnd ? new Date(body.coverageEnd) : null) : undefined,
        status: body.status !== undefined ? body.status : undefined,
        claimAmount:
          body.claimAmount !== undefined
            ? body.claimAmount !== null && body.claimAmount !== ''
              ? parseFloat(body.claimAmount)
              : null
            : undefined,
        claimDate: body.claimDate !== undefined ? (body.claimDate ? new Date(body.claimDate) : null) : undefined,
        claimStatus: body.claimStatus !== undefined ? body.claimStatus || null : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyInsuranceEnrollment update error:', error)
    return NextResponse.json(
      { error: 'Failed to update insurance enrollment', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyInsuranceEnrollment.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Insurance enrollment not found' }, { status: 404 })
    await db.dairyInsuranceEnrollment.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyInsuranceEnrollment delete error:', error)
    return NextResponse.json({ error: 'Failed to delete insurance enrollment' }, { status: 500 })
  }
}
