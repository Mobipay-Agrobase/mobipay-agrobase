import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/cows — list cows (paginated + search)
 * POST /api/dairy/cows — create a new cow
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const shedId = searchParams.get('shedId')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (shedId) where.shedId = shedId
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cowCode: { contains: search, mode: 'insensitive' } },
        { tagNumber: { contains: search, mode: 'insensitive' } },
        { breed: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyCow.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          shed: { select: { id: true, shadeNumber: true } },
          _count: {
            select: {
              milkingRecords: true,
              vaccinationRecords: true,
              healthChecks: true,
              feedSchedules: true,
              taskAssignments: true,
              weights: true,
              breedingEvents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyCow.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyCow list error:', error)
    return NextResponse.json({ error: 'Failed to fetch cows' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyCow.create({
      data: {
        tenantId: ctx.tenantId,
        farmId: body.farmId || null,
        farmerId: body.farmerId || null,
        cowCode: body.cowCode || null,
        tagNumber: body.tagNumber || null,
        rfidUid: body.rfidUid || null,
        name: body.name || null,
        breed: body.breed || null,
        coatColor: body.coatColor || null,
        type: body.type || 'Cow',
        gender: body.gender || 'Female',
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        approximateAgeMonths: body.approximateAgeMonths ? parseInt(body.approximateAgeMonths) : null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        photoUrl: body.photoUrl || null,
        lifecycleState: body.lifecycleState || 'Calf',
        sireId: body.sireId || null,
        damId: body.damId || null,
        shedId: body.shedId || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyCow create error:', error)
    return NextResponse.json(
      { error: 'Failed to create cow', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
