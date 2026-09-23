import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/milk-losses — list milk loss records (paginated + search)
 * POST /api/dairy/milk-losses — create a new milk loss record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tripId = searchParams.get('tripId')
    const pickupId = searchParams.get('pickupId')
    const lossType = searchParams.get('lossType')
    const reconciled = searchParams.get('reconciled')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (tripId) where.tripId = tripId
    if (pickupId) where.pickupId = pickupId
    if (lossType) where.lossType = lossType
    if (reconciled === 'true') where.reconciled = true
    if (reconciled === 'false') where.reconciled = false
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.lossDate = range
    }
    if (search) {
      where.OR = [
        { lossType: { contains: search, mode: 'insensitive' } },
        { responsibleParty: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyMilkLoss.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lossDate: 'desc' },
      }),
      db.dairyMilkLoss.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyMilkLoss list error:', error)
    return NextResponse.json({ error: 'Failed to fetch milk loss records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (body.litresLost === undefined) {
      return NextResponse.json({ error: 'litresLost is required' }, { status: 400 })
    }

    const created = await db.dairyMilkLoss.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: body.tripId || null,
        pickupId: body.pickupId || null,
        lossDate: body.lossDate ? new Date(body.lossDate) : undefined,
        lossType: body.lossType || 'spillage',
        litresLost: parseFloat(body.litresLost),
        valueLost: body.valueLost ? parseFloat(body.valueLost) : null,
        responsibleParty: body.responsibleParty || null,
        reconciled: body.reconciled !== undefined ? !!body.reconciled : false,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyMilkLoss create error:', error)
    return NextResponse.json(
      { error: 'Failed to create milk loss record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
