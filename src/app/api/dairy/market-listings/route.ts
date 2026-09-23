import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/market-listings — list dairy marketplace listings (paginated + search)
 *   Includes `orders` relation in each listing.
 * POST /api/dairy/market-listings — create a new marketplace listing
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const listingType = searchParams.get('listingType')
    const status = searchParams.get('status')
    const sellerType = searchParams.get('sellerType')
    const sellerId = searchParams.get('sellerId')
    const animalId = searchParams.get('animalId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (listingType) where.listingType = listingType
    if (status) where.status = status
    if (sellerType) where.sellerType = sellerType
    if (sellerId) where.sellerId = sellerId
    if (animalId) where.animalId = animalId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { sellerName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { listingType: { contains: search, mode: 'insensitive' } },
        { unit: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyMarketListing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyMarketListing.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyMarketListing list error:', error)
    return NextResponse.json({ error: 'Failed to fetch market listings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.sellerId || !body.sellerName || !body.title || body.price === undefined) {
      return NextResponse.json(
        { error: 'sellerId, sellerName, title and price are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyMarketListing.create({
      data: {
        tenantId: ctx.tenantId,
        sellerType: body.sellerType || 'farmer',
        sellerId: body.sellerId,
        sellerName: body.sellerName,
        listingType: body.listingType || 'live_animal',
        animalId: body.animalId || null,
        title: body.title,
        description: body.description || null,
        price: parseFloat(body.price),
        currency: body.currency || 'UGX',
        quantity: body.quantity !== undefined ? parseInt(body.quantity) : 1,
        unit: body.unit || 'each',
        imageUrl: body.imageUrl || null,
        location: body.location || null,
        status: body.status || 'active',
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyMarketListing create error:', error)
    return NextResponse.json(
      { error: 'Failed to create market listing', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
