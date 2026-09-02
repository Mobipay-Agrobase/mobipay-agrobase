import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { isFarmerRole, ownFarmerProfileId } from '@/lib/mobile/ekibbo-mobile-utils'

async function ownPurchaseIds(farmerId: string): Promise<string[]> {
  const rows = await db.purchase.findMany({ where: { farmerId }, select: { id: true }, take: 20000 })
  return rows.map(r => r.id)
}

async function ownSaleIds(farmerId: string): Promise<string[]> {
  const rows = await db.sale.findMany({ where: { farmerId }, select: { id: true }, take: 20000 })
  return rows.map(r => r.id)
}

export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type
    // Tenant scoping: a payment belongs to the tenant when it is linked to
    // the tenant's PaymentAccount, OR it settles a tenant purchase/sale
    // (the purchase & sale "pay" flows link via purchaseId/saleId — those
    // payments must stay visible in the tenant Payments module).
    // Farmer sessions are SELF-SERVICE: they see only payments settling
    // their OWN purchases/sales (mirrors the mobile scope).
    if (!ctx.isSuperAdmin) {
      if (isFarmerRole(ctx.role)) {
        const ownId = await ownFarmerProfileId(ctx.userId)
        where.OR = ownId
          ? [{ purchaseId: { in: await ownPurchaseIds(ownId) } },
             { saleId: { in: await ownSaleIds(ownId) } }]
          : [{ id: 'none' }] // no farmer profile → sees nothing
      } else {
        const scope = ctx.tenantScope as string[]
        const [purchases, sales] = await Promise.all([
          db.purchase.findMany({
            where: { OR: [{ tenantId: { in: scope } }, { farmer: { tenantId: { in: scope } } }] },
            select: { id: true },
            take: 20000,
          }),
          db.sale.findMany({
            where: { OR: [{ tenantId: { in: scope } }, { farmer: { tenantId: { in: scope } } }] },
            select: { id: true },
            take: 20000,
          }),
        ])
        const or: Record<string, unknown>[] = [
          { paymentAccount: { tenantId: { in: scope } } },
        ]
        if (purchases.length) or.push({ purchaseId: { in: purchases.map(p => p.id) } })
        if (sales.length) or.push({ saleId: { in: sales.map(s => s.id) } })
        where.OR = or
      }
    }

    const [data, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { paymentAccount: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    // Write gate: manual payment records require payments:create.
    // (For EKIBBO, farmer payments are recorded through the purchase
    // workflow — approve → record payment — gated by purchases:approve.)
    if (!hasPermission(ctx.role || '', 'payments:create')) {
      return NextResponse.json({ error: 'Insufficient permissions to create payments' }, { status: 403 })
    }
    const body = await request.json()
    // Link to the tenant's active PaymentAccount when one exists so the
    // payment is visible in the tenant Payments module (see GET scoping).
    let paymentAccountId: string | null = null
    if (ctx.tenantId) {
      const account = await db.paymentAccount.findFirst({
        where: { tenantId: ctx.tenantId, isActive: true },
        select: { id: true },
      })
      paymentAccountId = account?.id ?? null
    }
    const payment = await db.payment.create({
      data: {
        type: body.type,
        recipientName: body.recipientName,
        recipientPhone: body.recipientPhone,
        amount: body.amount,
        description: body.description,
        transactionRef: `PAY-${Date.now()}`,
        status: 'PENDING',
        paymentAccountId,
        purchaseId: body.purchaseId || null,
        saleId: body.saleId || null,
      }
    })
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}