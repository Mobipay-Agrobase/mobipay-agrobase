import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/vet-reviews — list vet reviews/ratings (paginated + search)
 * POST /api/dairy/vet-reviews — create a new vet review
 *
 * Note: DairyVetReview has no tenantId column; tenant scoping is enforced
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
    const rating = searchParams.get('rating')

    const where: Record<string, unknown> = { vet: { ...buildTenantFilter(ctx, 'tenantId') } }
    if (vetId) where.vetId = vetId
    if (rating) where.rating = parseInt(rating)
    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyVetReview.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { vet: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyVetReview.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyVetReview list error:', error)
    return NextResponse.json({ error: 'Failed to fetch vet reviews' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!body.vetId) {
      return NextResponse.json({ error: 'vetId is required' }, { status: 400 })
    }
    if (!body.farmerName) {
      return NextResponse.json({ error: 'farmerName is required' }, { status: 400 })
    }
    if (body.rating === undefined || body.rating === null) {
      return NextResponse.json({ error: 'rating is required' }, { status: 400 })
    }

    // Enforce tenant isolation: the vet must belong to the caller's tenant scope.
    const tf = buildTenantFilter(ctx, 'tenantId')
    const vet = await db.dairyVet.findFirst({ where: { id: body.vetId, ...tf } })
    if (!vet) return NextResponse.json({ error: 'Vet not found in tenant scope' }, { status: 404 })

    const created = await db.dairyVetReview.create({
      data: {
        vetId: body.vetId,
        vetRequestId: body.vetRequestId || null,
        farmerName: body.farmerName,
        rating: parseInt(body.rating),
        tags: body.tags
          ? (Array.isArray(body.tags) ? JSON.stringify(body.tags) : String(body.tags))
          : null,
        comment: body.comment || null,
        responseTimeMin:
          body.responseTimeMin !== undefined
            ? body.responseTimeMin
              ? parseInt(body.responseTimeMin)
              : null
            : null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyVetReview create error:', error)
    return NextResponse.json(
      { error: 'Failed to create vet review', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
