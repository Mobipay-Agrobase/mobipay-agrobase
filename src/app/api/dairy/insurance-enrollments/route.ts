import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/insurance-enrollments — list enrollments (paginated + search)
 *   Filters: status, productId, farmerId, cowId
 * POST /api/dairy/insurance-enrollments — create a new enrollment
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const productId = searchParams.get('productId')
    const farmerId = searchParams.get('farmerId')
    const cowId = searchParams.get('cowId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (status) where.status = status
    if (productId) where.productId = productId
    if (farmerId) where.farmerId = farmerId
    if (cowId) where.cowId = cowId
    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { claimStatus: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyInsuranceEnrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              productName: true,
              insurer: true,
              productType: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyInsuranceEnrollment.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyInsuranceEnrollment list error:', error)
    return NextResponse.json({ error: 'Failed to fetch insurance enrollments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyInsuranceEnrollment.create({
      data: {
        tenantId: ctx.tenantId,
        productId: body.productId,
        farmerId: body.farmerId,
        farmerName: body.farmerName,
        cowId: body.cowId || null,
        enrollmentDate: body.enrollmentDate ? new Date(body.enrollmentDate) : new Date(),
        premiumPaid:
          body.premiumPaid !== undefined && body.premiumPaid !== null ? parseFloat(body.premiumPaid) : null,
        coverageStart: body.coverageStart ? new Date(body.coverageStart) : new Date(),
        coverageEnd: body.coverageEnd ? new Date(body.coverageEnd) : null,
        status: body.status || 'active',
        claimAmount:
          body.claimAmount !== undefined && body.claimAmount !== null ? parseFloat(body.claimAmount) : null,
        claimDate: body.claimDate ? new Date(body.claimDate) : null,
        claimStatus: body.claimStatus || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyInsuranceEnrollment create error:', error)
    return NextResponse.json(
      { error: 'Failed to create insurance enrollment', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
