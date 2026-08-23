import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/purchases/[id] — full purchase detail with E2E chain:
 * farmer, ledger entries, traceability batch (sourcePurchaseId), payments.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any

  const purchase = await db.purchase.findFirst({
    where: { id, farmer: { ...tf } },
    include: { farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true, phone: true, villageName: true, district: true } } },
  })
  if (!purchase) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [ledger, batch, payments] = await Promise.all([
    db.farmerLedgerEntry.findMany({
      where: { purchaseId: id },
      orderBy: { date: 'asc' },
    }),
    db.productBatch.findFirst({ where: { sourcePurchaseId: id } }),
    db.payment.findMany({
      where: { purchaseId: id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ data: purchase, ledger, batch, payments })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any
  const body = await req.json()
  const existing = await db.purchase.findFirst({ where: { id, farmer: { ...tf } } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await db.purchase.update({ where: { id }, data: { ...body } })
  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getTenantContext(req)
  const tf = buildTenantFilter(ctx, 'tenantId') as any
  const existing = await db.purchase.findFirst({ where: { id, farmer: { ...tf } } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await db.purchase.delete({ where: { id } })
  return NextResponse.json({ message: 'Deleted' })
}
