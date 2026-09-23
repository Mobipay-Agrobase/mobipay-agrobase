import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/price-rules — list dairy price rules (paginated + search)
 * POST /api/dairy/price-rules — create a new price rule
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offtakerId = searchParams.get('offtakerId')
    const season = searchParams.get('season')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (offtakerId) where.offtakerId = offtakerId
    if (season) where.season = season
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { season: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyPriceRule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: 'asc' }, { validFrom: 'desc' }],
      }),
      db.dairyPriceRule.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyPriceRule list error:', error)
    return NextResponse.json({ error: 'Failed to fetch price rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.name || body.basePrice === undefined || !body.validFrom) {
      return NextResponse.json(
        { error: 'name, basePrice and validFrom are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyPriceRule.create({
      data: {
        tenantId: ctx.tenantId,
        offtakerId: body.offtakerId || null,
        name: body.name,
        currency: body.currency || 'UGX',
        basePrice: parseFloat(body.basePrice),
        season: body.season || 'all',
        fatBonusPerPct: body.fatBonusPerPct !== undefined ? parseFloat(body.fatBonusPerPct) : 0,
        snfBonusPerPct: body.snfBonusPerPct !== undefined ? parseFloat(body.snfBonusPerPct) : 0,
        gradeAdjustJson: body.gradeAdjustJson || null,
        penaltyJson: body.penaltyJson || null,
        coolingBonus: body.coolingBonus !== undefined ? parseFloat(body.coolingBonus) : 0,
        minPrice: body.minPrice !== undefined ? (body.minPrice ? parseFloat(body.minPrice) : null) : null,
        maxPrice: body.maxPrice !== undefined ? (body.maxPrice ? parseFloat(body.maxPrice) : null) : null,
        priority: body.priority !== undefined ? parseInt(body.priority) : 100,
        validFrom: new Date(body.validFrom),
        validTo: body.validTo ? new Date(body.validTo) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyPriceRule create error:', error)
    return NextResponse.json(
      { error: 'Failed to create price rule', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
