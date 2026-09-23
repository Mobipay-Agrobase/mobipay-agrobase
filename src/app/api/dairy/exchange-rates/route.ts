import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/exchange-rates — list exchange rates (paginated + search)
 * POST /api/dairy/exchange-rates — create a new exchange rate
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const baseCurrency = searchParams.get('baseCurrency')
    const quoteCurrency = searchParams.get('quoteCurrency')
    const source = searchParams.get('source')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (baseCurrency) where.baseCurrency = baseCurrency
    if (quoteCurrency) where.quoteCurrency = quoteCurrency
    if (source) where.source = source
    if (search) {
      where.OR = [
        { baseCurrency: { contains: search, mode: 'insensitive' } },
        { quoteCurrency: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyExchangeRate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rateDate: 'desc' },
      }),
      db.dairyExchangeRate.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyExchangeRate list error:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyExchangeRate.create({
      data: {
        tenantId: ctx.tenantId,
        baseCurrency: body.baseCurrency || 'UGX',
        quoteCurrency: body.quoteCurrency,
        rate: parseFloat(body.rate),
        rateDate: body.rateDate ? new Date(body.rateDate) : new Date(),
        source: body.source || 'manual',
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyExchangeRate create error:', error)
    return NextResponse.json(
      { error: 'Failed to create exchange rate', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
