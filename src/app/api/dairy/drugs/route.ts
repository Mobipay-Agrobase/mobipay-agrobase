import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/drugs — list dairy drug catalog (paginated + search)
 * POST /api/dairy/drugs — create a new drug catalog entry
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (category) where.category = category
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { drugName: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyDrugCatalog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyDrugCatalog.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyDrugCatalog list error:', error)
    return NextResponse.json({ error: 'Failed to fetch drugs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.drugName) {
      return NextResponse.json({ error: 'drugName is required' }, { status: 400 })
    }

    const created = await db.dairyDrugCatalog.create({
      data: {
        tenantId: ctx.tenantId,
        drugName: body.drugName,
        genericName: body.genericName || null,
        category: body.category || null,
        manufacturer: body.manufacturer || null,
        unitSize: body.unitSize || null,
        unitPrice: body.unitPrice !== undefined ? (body.unitPrice ? parseFloat(body.unitPrice) : null) : null,
        withdrawalPeriodDays:
          body.withdrawalPeriodDays !== undefined
            ? body.withdrawalPeriodDays
              ? parseInt(body.withdrawalPeriodDays)
              : null
            : null,
        batchNumber: body.batchNumber || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        stockQuantity: body.stockQuantity !== undefined ? (body.stockQuantity ? parseFloat(body.stockQuantity) : null) : null,
        minStockLevel: body.minStockLevel !== undefined ? (body.minStockLevel ? parseFloat(body.minStockLevel) : null) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyDrugCatalog create error:', error)
    return NextResponse.json(
      { error: 'Failed to create drug', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
