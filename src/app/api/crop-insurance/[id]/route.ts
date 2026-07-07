import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const body = await req.json()

    const existing = await db.cropInsurance.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.cropInsurance.update({
      where: { id },
      data: {
        ...(body.provider !== undefined && { provider: body.provider }),
        ...(body.policyNumber !== undefined && { policyNumber: body.policyNumber }),
        ...(body.premium !== undefined && { premium: parseFloat(body.premium) }),
        ...(body.coverageAmount !== undefined && { coverageAmount: parseFloat(body.coverageAmount) }),
        ...(body.status && { status: body.status }),
        ...(body.payoutAmount !== undefined && { payoutAmount: parseFloat(body.payoutAmount) }),
        ...(body.payoutDate !== undefined && { payoutDate: body.payoutDate ? new Date(body.payoutDate) : null }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    const existing = await db.cropInsurance.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.cropInsurance.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
