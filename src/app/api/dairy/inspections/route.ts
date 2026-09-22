import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/inspections — list inspections (paginated + search)
 * POST /api/dairy/inspections — create a new inspection
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const scope = searchParams.get('scope')
    const status = searchParams.get('status')
    const inspector = searchParams.get('inspector')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (scope) where.scope = scope
    if (status) where.status = status
    if (inspector) where.inspector = { contains: inspector, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { batchOrFarmId: { contains: search, mode: 'insensitive' } },
        { inspector: { contains: search, mode: 'insensitive' } },
        { scope: { contains: search, mode: 'insensitive' } },
        { observations: { contains: search, mode: 'insensitive' } },
        { correctiveActions: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyInspection.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { inspectionDate: 'desc' },
      }),
      db.dairyInspection.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyInspection list error:', error)
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.batchOrFarmId || !body.inspectionDate || !body.inspector) {
      return NextResponse.json({ error: 'batchOrFarmId, inspectionDate and inspector are required' }, { status: 400 })
    }

    const created = await db.dairyInspection.create({
      data: {
        tenantId: ctx.tenantId,
        batchOrFarmId: body.batchOrFarmId,
        inspectionDate: new Date(body.inspectionDate),
        inspector: body.inspector,
        scope: body.scope || 'Farm',
        observations: body.observations || null,
        nonConformance: body.nonConformance !== undefined ? !!body.nonConformance : false,
        correctiveActions: body.correctiveActions || null,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        status: body.status || 'Open',
        reportUrl: body.reportUrl || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyInspection create error:', error)
    return NextResponse.json(
      { error: 'Failed to create inspection', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
