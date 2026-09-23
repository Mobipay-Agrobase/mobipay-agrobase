import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/payment-batches — list dairy payment batches (paginated + search)
 *   Includes `payments` relation in each batch.
 * POST /api/dairy/payment-batches — create a new payment batch
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (status) where.status = status
    if (channel) where.channel = channel
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.batchDate = range
    }
    if (search) {
      where.OR = [
        { batchNo: { contains: search, mode: 'insensitive' } },
        { channel: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyPaymentBatch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { batchDate: 'desc' },
      }),
      db.dairyPaymentBatch.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyPaymentBatch list error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment batches' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.batchNo || body.totalAmount === undefined || body.totalPayments === undefined) {
      return NextResponse.json(
        { error: 'batchNo, totalAmount and totalPayments are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyPaymentBatch.create({
      data: {
        tenantId: ctx.tenantId,
        batchNo: body.batchNo,
        batchDate: body.batchDate ? new Date(body.batchDate) : undefined,
        totalAmount: parseFloat(body.totalAmount),
        totalPayments: parseInt(body.totalPayments),
        currency: body.currency || 'UGX',
        channel: body.channel || 'mobipay_wallet',
        status: body.status || 'draft',
        submittedBy: body.submittedBy || null,
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : null,
        approvedBy: body.approvedBy || null,
        approvedAt: body.approvedAt ? new Date(body.approvedAt) : null,
        processedAt: body.processedAt ? new Date(body.processedAt) : null,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyPaymentBatch create error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment batch', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
