import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/suppliers — list dairy suppliers (paginated + search)
 * POST /api/dairy/suppliers — create a new supplier
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const supplierType = searchParams.get('supplierType')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (supplierType) where.supplierType = supplierType
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairySupplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { feedItems: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairySupplier.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairySupplier list error:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const created = await db.dairySupplier.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name,
        supplierType: body.supplierType || 'feed',
        contactNumber: body.contactNumber || null,
        email: body.email || null,
        productsSupplied: body.productsSupplied
          ? (Array.isArray(body.productsSupplied) ? JSON.stringify(body.productsSupplied) : String(body.productsSupplied))
          : null,
        rating: body.rating || null,
        location: body.location || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairySupplier create error:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
