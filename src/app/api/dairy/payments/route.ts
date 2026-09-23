import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/payments — list dairy payments (paginated + search)
 * POST /api/dairy/payments — create a new payment
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const batchId = searchParams.get('batchId')
    const payeeType = searchParams.get('payeeType')
    const payeeId = searchParams.get('payeeId')
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (batchId) where.batchId = batchId
    if (payeeType) where.payeeType = payeeType
    if (payeeId) where.payeeId = payeeId
    if (status) where.status = status
    if (channel) where.channel = channel
    if (search) {
      where.OR = [
        { payeeName: { contains: search, mode: 'insensitive' } },
        { payeePhone: { contains: search, mode: 'insensitive' } },
        { payeeType: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { channel: { contains: search, mode: 'insensitive' } },
        { providerRef: { contains: search, mode: 'insensitive' } },
        { idempotencyKey: { contains: search, mode: 'insensitive' } },
        { failureReason: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyPayment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          batch: { select: { id: true, batchNo: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyPayment.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyPayment list error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.payeeId || !body.payeeName || body.amount === undefined || !body.idempotencyKey) {
      return NextResponse.json(
        { error: 'payeeId, payeeName, amount and idempotencyKey are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyPayment.create({
      data: {
        tenantId: ctx.tenantId,
        batchId: body.batchId || null,
        payeeType: body.payeeType || 'farmer',
        payeeId: body.payeeId,
        payeeName: body.payeeName,
        payeePhone: body.payeePhone || null,
        amount: parseFloat(body.amount),
        feeAmount: body.feeAmount !== undefined ? parseFloat(body.feeAmount) : 0,
        currency: body.currency || 'UGX',
        channel: body.channel || 'mobipay_wallet',
        idempotencyKey: body.idempotencyKey,
        providerRef: body.providerRef || null,
        status: body.status || 'pending',
        failureReason: body.failureReason || null,
        initiatedAt: body.initiatedAt ? new Date(body.initiatedAt) : undefined,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyPayment create error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
