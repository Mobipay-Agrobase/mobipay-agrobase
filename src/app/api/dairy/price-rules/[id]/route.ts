import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyPriceRule.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Price rule not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyPriceRule detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch price rule' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPriceRule.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Price rule not found' }, { status: 404 })
    const body = await req.json()

    const updated = await db.dairyPriceRule.update({
      where: { id },
      data: {
        offtakerId: body.offtakerId !== undefined ? body.offtakerId || null : undefined,
        name: body.name !== undefined ? body.name : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        basePrice: body.basePrice !== undefined ? (body.basePrice ? parseFloat(body.basePrice) : undefined) : undefined,
        season: body.season !== undefined ? body.season : undefined,
        fatBonusPerPct: body.fatBonusPerPct !== undefined ? (body.fatBonusPerPct ? parseFloat(body.fatBonusPerPct) : 0) : undefined,
        snfBonusPerPct: body.snfBonusPerPct !== undefined ? (body.snfBonusPerPct ? parseFloat(body.snfBonusPerPct) : 0) : undefined,
        gradeAdjustJson: body.gradeAdjustJson !== undefined ? body.gradeAdjustJson || null : undefined,
        penaltyJson: body.penaltyJson !== undefined ? body.penaltyJson || null : undefined,
        coolingBonus: body.coolingBonus !== undefined ? (body.coolingBonus ? parseFloat(body.coolingBonus) : 0) : undefined,
        minPrice: body.minPrice !== undefined ? (body.minPrice ? parseFloat(body.minPrice) : null) : undefined,
        maxPrice: body.maxPrice !== undefined ? (body.maxPrice ? parseFloat(body.maxPrice) : null) : undefined,
        priority: body.priority !== undefined ? parseInt(body.priority) : undefined,
        validFrom: body.validFrom !== undefined ? (body.validFrom ? new Date(body.validFrom) : undefined) : undefined,
        validTo: body.validTo !== undefined ? (body.validTo ? new Date(body.validTo) : null) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyPriceRule update error:', error)
    return NextResponse.json(
      { error: 'Failed to update price rule', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyPriceRule.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Price rule not found' }, { status: 404 })
    await db.dairyPriceRule.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyPriceRule delete error:', error)
    return NextResponse.json({ error: 'Failed to delete price rule' }, { status: 500 })
  }
}
