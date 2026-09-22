import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/vaccinations — list vaccinations (paginated + search)
 * POST /api/dairy/vaccinations — create a new vaccination
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
        { vaccineName: { contains: search, mode: 'insensitive' } },
        { dose: { contains: search, mode: 'insensitive' } },
        { administeredBy: { contains: search, mode: 'insensitive' } },
        { effectObserved: { contains: search, mode: 'insensitive' } },
        { cow: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyVaccination.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: { select: { id: true, name: true, cowCode: true } } },
        orderBy: { vaccinationDate: 'desc' },
      }),
      db.dairyVaccination.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyVaccination list error:', error)
    return NextResponse.json({ error: 'Failed to fetch vaccinations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.cowId || !body.vaccineName || !body.vaccinationDate) {
      return NextResponse.json({ error: 'cowId, vaccineName and vaccinationDate are required' }, { status: 400 })
    }

    const created = await db.dairyVaccination.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId,
        vaccineName: body.vaccineName,
        vaccinationDate: new Date(body.vaccinationDate),
        dose: body.dose || null,
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        effectObserved: body.effectObserved || null,
        administeredBy: body.administeredBy || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyVaccination create error:', error)
    return NextResponse.json(
      { error: 'Failed to create vaccination', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
