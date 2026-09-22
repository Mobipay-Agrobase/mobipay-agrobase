import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/health-checks — list health checks (paginated + search)
 * POST /api/dairy/health-checks — create a new health check
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cowId = searchParams.get('cowId')
    const healthStatus = searchParams.get('healthStatus')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (cowId) where.cowId = cowId
    if (healthStatus) where.healthStatus = healthStatus
    if (search) {
      where.OR = [
        { healthStatus: { contains: search, mode: 'insensitive' } },
        { diseaseObserved: { contains: search, mode: 'insensitive' } },
        { treatmentAdministered: { contains: search, mode: 'insensitive' } },
        { veterinarian: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyHealthCheck.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: { select: { id: true, name: true, cowCode: true } } },
        orderBy: { checkDate: 'desc' },
      }),
      db.dairyHealthCheck.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyHealthCheck list error:', error)
    return NextResponse.json({ error: 'Failed to fetch health checks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.cowId) {
      return NextResponse.json({ error: 'cowId is required' }, { status: 400 })
    }

    const created = await db.dairyHealthCheck.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId,
        checkDate: body.checkDate ? new Date(body.checkDate) : new Date(),
        healthStatus: body.healthStatus || 'Good',
        diseaseObserved: body.diseaseObserved || null,
        treatmentAdministered: body.treatmentAdministered || null,
        nextCheckDate: body.nextCheckDate ? new Date(body.nextCheckDate) : null,
        veterinarian: body.veterinarian || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyHealthCheck create error:', error)
    return NextResponse.json(
      { error: 'Failed to create health check', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
