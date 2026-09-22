import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/processing — list processing records (paginated + search)
 * POST /api/dairy/processing — create a new processing record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const species = searchParams.get('species')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (species) where.species = species
    if (search) {
      where.OR = [
        { species: { contains: search, mode: 'insensitive' } },
        { productCategories: { contains: search, mode: 'insensitive' } },
        { processingPlantId: { contains: search, mode: 'insensitive' } },
        { coldStorageId: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyProcessingRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { processingDate: 'desc' },
      }),
      db.dairyProcessingRecord.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyProcessingRecord list error:', error)
    return NextResponse.json({ error: 'Failed to fetch processing records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (body.numberProcessed === undefined || body.carcassWeightKg === undefined) {
      return NextResponse.json({ error: 'numberProcessed and carcassWeightKg are required' }, { status: 400 })
    }

    const created = await db.dairyProcessingRecord.create({
      data: {
        tenantId: ctx.tenantId,
        processingDate: body.processingDate ? new Date(body.processingDate) : new Date(),
        species: body.species || 'Cattle',
        numberProcessed: parseInt(body.numberProcessed),
        carcassWeightKg: parseFloat(body.carcassWeightKg),
        yieldPct: body.yieldPct ? parseFloat(body.yieldPct) : null,
        processingPlantId: body.processingPlantId || null,
        productCategories: body.productCategories
          ? (Array.isArray(body.productCategories) ? JSON.stringify(body.productCategories) : String(body.productCategories))
          : null,
        coldStorageId: body.coldStorageId || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyProcessingRecord create error:', error)
    return NextResponse.json(
      { error: 'Failed to create processing record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
