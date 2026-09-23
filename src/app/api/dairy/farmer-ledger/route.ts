import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/farmer-ledger — list dairy farmer ledger entries (paginated + search)
 *   Ordered by postedAt desc (most recent entries first).
 * POST /api/dairy/farmer-ledger — create a new ledger entry
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const farmerId = searchParams.get('farmerId')
    const entryType = searchParams.get('entryType')
    const direction = searchParams.get('direction')
    const refType = searchParams.get('refType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (farmerId) where.farmerId = farmerId
    if (entryType) where.entryType = entryType
    if (direction) where.direction = direction
    if (refType) where.refType = refType
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.postedAt = range
    }
    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { entryType: { contains: search, mode: 'insensitive' } },
        { direction: { contains: search, mode: 'insensitive' } },
        { narrative: { contains: search, mode: 'insensitive' } },
        { refType: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyFarmerLedger.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { postedAt: 'desc' },
      }),
      db.dairyFarmerLedger.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyFarmerLedger list error:', error)
    return NextResponse.json({ error: 'Failed to fetch farmer ledger entries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.farmerId || !body.farmerName || !body.entryType || !body.direction || body.amount === undefined) {
      return NextResponse.json(
        { error: 'farmerId, farmerName, entryType, direction and amount are required' },
        { status: 400 },
      )
    }

    const amount = parseFloat(body.amount)
    const runningBalance = body.runningBalance !== undefined ? parseFloat(body.runningBalance) : 0

    const created = await db.dairyFarmerLedger.create({
      data: {
        tenantId: ctx.tenantId,
        farmerId: body.farmerId,
        farmerName: body.farmerName,
        entryType: body.entryType,
        direction: body.direction,
        amount,
        currency: body.currency || 'UGX',
        refType: body.refType || null,
        refId: body.refId || null,
        runningBalance,
        narrative: body.narrative || null,
        postedAt: body.postedAt ? new Date(body.postedAt) : undefined,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyFarmerLedger create error:', error)
    return NextResponse.json(
      { error: 'Failed to create ledger entry', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
