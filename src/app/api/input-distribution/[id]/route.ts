import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    // Write gate: corrections require input_aggregation:update
    // (MD/OPS among EKB roles; field roles are submit-only).
    if (!hasPermission(ctx.role || '', 'input_aggregation:update')) {
      return NextResponse.json({ error: 'Insufficient permissions to update input distributions' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const body = await req.json()

    const existing = await db.inputDistribution.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.inputDistribution.update({
      where: { id },
      data: {
        ...(body.inputType && { inputType: body.inputType }),
        ...(body.inputName !== undefined && { inputName: body.inputName }),
        ...(body.quantity && { quantity: parseFloat(body.quantity) }),
        ...(body.unitCost && { unitCost: parseFloat(body.unitCost) }),
        ...(body.status && { status: body.status }),
        ...(body.balanceRemaining !== undefined && { balanceRemaining: parseFloat(body.balanceRemaining) }),
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
    // Write gate: deletion requires input_aggregation:delete (MD/OPS only).
    if (!hasPermission(ctx.role || '', 'input_aggregation:delete')) {
      return NextResponse.json({ error: 'Insufficient permissions to delete input distributions' }, { status: 403 })
    }
    const tf = buildTenantFilter(ctx, 'tenantId') as any

    const existing = await db.inputDistribution.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.inputDistribution.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
