import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/vet-service-areas — list vet service areas (paginated + search)
 * POST /api/dairy/vet-service-areas — create a new vet service area
 *
 * Note: DairyVetServiceArea has no tenantId column; tenant scoping is enforced
 * via the parent DairyVet relation (vet.tenantId).
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const vetId = searchParams.get('vetId')
    const district = searchParams.get('district')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { vet: { ...buildTenantFilter(ctx, 'tenantId') } }
    if (vetId) where.vetId = vetId
    if (district) where.district = district
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { district: { contains: search, mode: 'insensitive' } },
        { subCounty: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyVetServiceArea.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { vet: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyVetServiceArea.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyVetServiceArea list error:', error)
    return NextResponse.json({ error: 'Failed to fetch vet service areas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!body.vetId) {
      return NextResponse.json({ error: 'vetId is required' }, { status: 400 })
    }
    if (!body.district) {
      return NextResponse.json({ error: 'district is required' }, { status: 400 })
    }

    // Enforce tenant isolation: the vet must belong to the caller's tenant scope.
    const tf = buildTenantFilter(ctx, 'tenantId')
    const vet = await db.dairyVet.findFirst({ where: { id: body.vetId, ...tf } })
    if (!vet) return NextResponse.json({ error: 'Vet not found in tenant scope' }, { status: 404 })

    const created = await db.dairyVetServiceArea.create({
      data: {
        vetId: body.vetId,
        district: body.district,
        subCounty: body.subCounty || null,
        radiusKm: body.radiusKm !== undefined ? (body.radiusKm ? parseFloat(body.radiusKm) : null) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyVetServiceArea create error:', error)
    return NextResponse.json(
      { error: 'Failed to create vet service area', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
