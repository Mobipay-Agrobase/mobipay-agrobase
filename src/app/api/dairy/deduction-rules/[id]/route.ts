import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyDeductionRule.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Deduction rule not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyDeductionRule detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch deduction rule' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyDeductionRule.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Deduction rule not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyDeductionRule.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        deductionType: body.deductionType !== undefined ? body.deductionType : undefined,
        amount: body.amount !== undefined ? (body.amount ? parseFloat(body.amount) : undefined) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        appliesTo: body.appliesTo !== undefined ? body.appliesTo : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyDeductionRule update error:', error)
    return NextResponse.json(
      { error: 'Failed to update deduction rule', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyDeductionRule.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Deduction rule not found' }, { status: 404 })
    await db.dairyDeductionRule.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyDeductionRule delete error:', error)
    return NextResponse.json({ error: 'Failed to delete deduction rule' }, { status: 500 })
  }
}
