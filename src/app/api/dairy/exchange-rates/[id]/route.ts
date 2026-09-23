import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyExchangeRate.findFirst({ where: { id, ...tf } })
    if (!item) return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyExchangeRate detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyExchangeRate.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyExchangeRate.update({
      where: { id },
      data: {
        baseCurrency: body.baseCurrency !== undefined ? body.baseCurrency : undefined,
        quoteCurrency: body.quoteCurrency !== undefined ? body.quoteCurrency : undefined,
        rate: body.rate !== undefined ? parseFloat(body.rate) : undefined,
        rateDate: body.rateDate !== undefined ? (body.rateDate ? new Date(body.rateDate) : new Date()) : undefined,
        source: body.source !== undefined ? body.source : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyExchangeRate update error:', error)
    return NextResponse.json(
      { error: 'Failed to update exchange rate', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyExchangeRate.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 })
    await db.dairyExchangeRate.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyExchangeRate delete error:', error)
    return NextResponse.json({ error: 'Failed to delete exchange rate' }, { status: 500 })
  }
}
