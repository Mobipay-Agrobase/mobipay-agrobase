import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/predictions — list predictions (paginated + search)
 *   Filters: predictionType, targetDateFrom / targetDateTo (range), targetType
 * POST /api/dairy/predictions — create a new prediction
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const predictionType = searchParams.get('predictionType')
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')
    const targetDateFrom = searchParams.get('targetDateFrom')
    const targetDateTo = searchParams.get('targetDateTo')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (predictionType) where.predictionType = predictionType
    if (targetType) where.targetType = targetType
    if (targetId) where.targetId = targetId

    // targetDate range filter
    const range: Record<string, Date> = {}
    if (targetDateFrom) range.gte = new Date(targetDateFrom)
    if (targetDateTo) range.lte = new Date(targetDateTo)
    if (Object.keys(range).length > 0) where.targetDate = range

    if (search) {
      where.OR = [
        { predictionType: { contains: search, mode: 'insensitive' } },
        { targetType: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
        { unit: { contains: search, mode: 'insensitive' } },
        { modelVersion: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyPrediction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { targetDate: 'desc' },
      }),
      db.dairyPrediction.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyPrediction list error:', error)
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyPrediction.create({
      data: {
        tenantId: ctx.tenantId,
        predictionType: body.predictionType || 'yield',
        targetType: body.targetType || 'cow',
        targetId: body.targetId || null,
        predictionDate: body.predictionDate ? new Date(body.predictionDate) : new Date(),
        targetDate: body.targetDate ? new Date(body.targetDate) : new Date(),
        predictedValue:
          body.predictedValue !== undefined && body.predictedValue !== null
            ? parseFloat(body.predictedValue)
            : null,
        unit: body.unit || null,
        confidence:
          body.confidence !== undefined && body.confidence !== null
            ? parseFloat(body.confidence)
            : null,
        modelVersion: body.modelVersion || 'v1.0',
        features: body.features || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyPrediction create error:', error)
    return NextResponse.json(
      { error: 'Failed to create prediction', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
