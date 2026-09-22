import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/breeding — list breeding events (paginated + search)
 * POST /api/dairy/breeding — create a new breeding event
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const damId = searchParams.get('damId')
    const breedingType = searchParams.get('breedingType')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (damId) where.damId = damId
    if (breedingType) where.breedingType = breedingType
    if (search) {
      where.OR = [
        { breedingType: { contains: search, mode: 'insensitive' } },
        { semenBatch: { contains: search, mode: 'insensitive' } },
        { aiTechnician: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyBreedingEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          dam: { select: { id: true, name: true, cowCode: true } },
          sire: { select: { id: true, name: true, cowCode: true } },
        },
        orderBy: { breedingDate: 'desc' },
      }),
      db.dairyBreedingEvent.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyBreedingEvent list error:', error)
    return NextResponse.json({ error: 'Failed to fetch breeding events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.damId || !body.breedingDate) {
      return NextResponse.json({ error: 'damId and breedingDate are required' }, { status: 400 })
    }

    const created = await db.dairyBreedingEvent.create({
      data: {
        tenantId: ctx.tenantId,
        damId: body.damId,
        sireId: body.sireId || null,
        breedingDate: new Date(body.breedingDate),
        breedingType: body.breedingType || 'AI',
        semenBatch: body.semenBatch || null,
        aiTechnician: body.aiTechnician || null,
        expectedBirthDate: body.expectedBirthDate ? new Date(body.expectedBirthDate) : null,
        actualBirthDate: body.actualBirthDate ? new Date(body.actualBirthDate) : null,
        offspringCount: body.offspringCount ? parseInt(body.offspringCount) : null,
        pregnancyConfirmed: body.pregnancyConfirmed !== undefined ? !!body.pregnancyConfirmed : null,
        pregnancyCheckDate: body.pregnancyCheckDate ? new Date(body.pregnancyCheckDate) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyBreedingEvent create error:', error)
    return NextResponse.json(
      { error: 'Failed to create breeding event', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
