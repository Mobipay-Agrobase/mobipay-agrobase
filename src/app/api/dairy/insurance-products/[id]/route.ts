import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyInsuranceProduct.findFirst({
      where: { id, ...tf },
      include: {
        enrollments: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { enrollments: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Insurance product not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyInsuranceProduct detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch insurance product' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyInsuranceProduct.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Insurance product not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyInsuranceProduct.update({
      where: { id },
      data: {
        productName: body.productName !== undefined ? body.productName : undefined,
        insurer: body.insurer !== undefined ? body.insurer : undefined,
        productType: body.productType !== undefined ? body.productType : undefined,
        coverageType: body.coverageType !== undefined ? body.coverageType : undefined,
        premiumPerAnimal:
          body.premiumPerAnimal !== undefined
            ? body.premiumPerAnimal !== null && body.premiumPerAnimal !== ''
              ? parseFloat(body.premiumPerAnimal)
              : null
            : undefined,
        coverageAmount:
          body.coverageAmount !== undefined
            ? body.coverageAmount !== null && body.coverageAmount !== ''
              ? parseFloat(body.coverageAmount)
              : null
            : undefined,
        triggerType: body.triggerType !== undefined ? body.triggerType || null : undefined,
        triggerThreshold:
          body.triggerThreshold !== undefined
            ? body.triggerThreshold !== null && body.triggerThreshold !== ''
              ? parseFloat(body.triggerThreshold)
              : null
            : undefined,
        payoutAmount:
          body.payoutAmount !== undefined
            ? body.payoutAmount !== null && body.payoutAmount !== ''
              ? parseFloat(body.payoutAmount)
              : null
            : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyInsuranceProduct update error:', error)
    return NextResponse.json(
      { error: 'Failed to update insurance product', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyInsuranceProduct.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Insurance product not found' }, { status: 404 })
    await db.dairyInsuranceProduct.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyInsuranceProduct delete error:', error)
    return NextResponse.json({ error: 'Failed to delete insurance product' }, { status: 500 })
  }
}
