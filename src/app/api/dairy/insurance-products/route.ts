import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/insurance-products — list insurance products (paginated + search)
 * POST /api/dairy/insurance-products — create a new insurance product
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const productType = searchParams.get('productType')
    const coverageType = searchParams.get('coverageType')
    const insurer = searchParams.get('insurer')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (productType) where.productType = productType
    if (coverageType) where.coverageType = coverageType
    if (insurer) where.insurer = { contains: insurer, mode: 'insensitive' }
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { insurer: { contains: search, mode: 'insensitive' } },
        { productType: { contains: search, mode: 'insensitive' } },
        { coverageType: { contains: search, mode: 'insensitive' } },
        { triggerType: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyInsuranceProduct.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          enrollments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { id: true, farmerName: true, status: true, enrollmentDate: true, premiumPaid: true },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyInsuranceProduct.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyInsuranceProduct list error:', error)
    return NextResponse.json({ error: 'Failed to fetch insurance products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyInsuranceProduct.create({
      data: {
        tenantId: ctx.tenantId,
        productName: body.productName,
        insurer: body.insurer,
        productType: body.productType || 'index_based',
        coverageType: body.coverageType || 'per_animal',
        premiumPerAnimal:
          body.premiumPerAnimal !== undefined && body.premiumPerAnimal !== null
            ? parseFloat(body.premiumPerAnimal)
            : null,
        coverageAmount:
          body.coverageAmount !== undefined && body.coverageAmount !== null
            ? parseFloat(body.coverageAmount)
            : null,
        triggerType: body.triggerType || null,
        triggerThreshold:
          body.triggerThreshold !== undefined && body.triggerThreshold !== null
            ? parseFloat(body.triggerThreshold)
            : null,
        payoutAmount:
          body.payoutAmount !== undefined && body.payoutAmount !== null
            ? parseFloat(body.payoutAmount)
            : null,
        currency: body.currency || 'UGX',
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyInsuranceProduct create error:', error)
    return NextResponse.json(
      { error: 'Failed to create insurance product', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
