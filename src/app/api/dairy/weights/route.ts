import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/weights — list animal weights (paginated + search)
 * POST /api/dairy/weights — create a new weight record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cowId = searchParams.get('cowId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (cowId) where.cowId = cowId
    if (search) {
      where.OR = [
        { measurementMethod: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { cow: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyAnimalWeight.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: { select: { id: true, name: true, cowCode: true } } },
        orderBy: { weightDate: 'desc' },
      }),
      db.dairyAnimalWeight.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyAnimalWeight list error:', error)
    return NextResponse.json({ error: 'Failed to fetch weights' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.cowId || body.weightKg === undefined) {
      return NextResponse.json({ error: 'cowId and weightKg are required' }, { status: 400 })
    }

    const created = await db.dairyAnimalWeight.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId,
        weightDate: body.weightDate ? new Date(body.weightDate) : new Date(),
        weightKg: parseFloat(body.weightKg),
        bodyConditionScore: body.bodyConditionScore ? parseFloat(body.bodyConditionScore) : null,
        measurementMethod: body.measurementMethod || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyAnimalWeight create error:', error)
    return NextResponse.json(
      { error: 'Failed to create weight record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
