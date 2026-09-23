import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/market-orders — list dairy market orders (paginated + search)
 * POST /api/dairy/market-orders — create a new market order
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const listingId = searchParams.get('listingId')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const buyerType = searchParams.get('buyerType')
    const buyerId = searchParams.get('buyerId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (listingId) where.listingId = listingId
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (buyerType) where.buyerType = buyerType
    if (buyerId) where.buyerId = buyerId
    if (search) {
      where.OR = [
        { buyerName: { contains: search, mode: 'insensitive' } },
        { buyerType: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { paymentStatus: { contains: search, mode: 'insensitive' } },
        { escrowRef: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyMarketOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          listing: { select: { id: true, title: true, listingType: true, price: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyMarketOrder.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyMarketOrder list error:', error)
    return NextResponse.json({ error: 'Failed to fetch market orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.listingId || !body.buyerId || !body.buyerName || body.unitPrice === undefined) {
      return NextResponse.json(
        { error: 'listingId, buyerId, buyerName and unitPrice are required' },
        { status: 400 },
      )
    }

    const quantity = body.quantity !== undefined ? parseInt(body.quantity) : 1
    const unitPrice = parseFloat(body.unitPrice)
    const totalAmount = body.totalAmount !== undefined ? parseFloat(body.totalAmount) : quantity * unitPrice

    const created = await db.dairyMarketOrder.create({
      data: {
        tenantId: ctx.tenantId,
        listingId: body.listingId,
        buyerType: body.buyerType || 'farmer',
        buyerId: body.buyerId,
        buyerName: body.buyerName,
        quantity,
        unitPrice,
        totalAmount,
        currency: body.currency || 'UGX',
        status: body.status || 'pending',
        escrowRef: body.escrowRef || null,
        paymentStatus: body.paymentStatus || 'unpaid',
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyMarketOrder create error:', error)
    return NextResponse.json(
      { error: 'Failed to create market order', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
