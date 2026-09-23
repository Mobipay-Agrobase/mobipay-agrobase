import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/sustainability — list sustainability records (paginated + search)
 * POST /api/dairy/sustainability — create a new sustainability record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const recordType = searchParams.get('recordType')
    const farmerId = searchParams.get('farmerId')
    const cowId = searchParams.get('cowId')
    const metric = searchParams.get('metric')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (recordType) where.recordType = recordType
    if (farmerId) where.farmerId = farmerId
    if (cowId) where.cowId = cowId
    if (metric) where.metric = metric
    const range: Record<string, Date> = {}
    if (dateFrom) range.gte = new Date(dateFrom)
    if (dateTo) range.lte = new Date(dateTo)
    if (Object.keys(range).length > 0) where.recordDate = range

    if (search) {
      where.OR = [
        { recordType: { contains: search, mode: 'insensitive' } },
        { farmerName: { contains: search, mode: 'insensitive' } },
        { metric: { contains: search, mode: 'insensitive' } },
        { unit: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairySustainabilityRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recordDate: 'desc' },
      }),
      db.dairySustainabilityRecord.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairySustainabilityRecord list error:', error)
    return NextResponse.json({ error: 'Failed to fetch sustainability records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairySustainabilityRecord.create({
      data: {
        tenantId: ctx.tenantId,
        recordType: body.recordType || 'carbon_footprint',
        recordDate: body.recordDate ? new Date(body.recordDate) : new Date(),
        farmerId: body.farmerId || null,
        farmerName: body.farmerName || null,
        cowId: body.cowId || null,
        metric: body.metric,
        value: parseFloat(body.value),
        unit: body.unit,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairySustainabilityRecord create error:', error)
    return NextResponse.json(
      { error: 'Failed to create sustainability record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
