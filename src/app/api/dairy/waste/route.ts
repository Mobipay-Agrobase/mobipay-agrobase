import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/waste — list waste records (paginated + search)
 * POST /api/dairy/waste — create a new waste record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const wasteType = searchParams.get('wasteType')
    const handlingMethod = searchParams.get('handlingMethod')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (wasteType) where.wasteType = wasteType
    if (handlingMethod) where.handlingMethod = handlingMethod
    if (search) {
      where.OR = [
        { wasteType: { contains: search, mode: 'insensitive' } },
        { handlingMethod: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyWasteRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { wasteDate: 'desc' },
      }),
      db.dairyWasteRecord.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyWasteRecord list error:', error)
    return NextResponse.json({ error: 'Failed to fetch waste records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyWasteRecord.create({
      data: {
        tenantId: ctx.tenantId,
        wasteDate: body.wasteDate ? new Date(body.wasteDate) : new Date(),
        wasteType: body.wasteType || 'Manure',
        quantityKg: body.quantityKg ? parseFloat(body.quantityKg) : null,
        handlingMethod: body.handlingMethod || 'Composting',
        treatmentDurationDays: body.treatmentDurationDays ? parseInt(body.treatmentDurationDays) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyWasteRecord create error:', error)
    return NextResponse.json(
      { error: 'Failed to create waste record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
