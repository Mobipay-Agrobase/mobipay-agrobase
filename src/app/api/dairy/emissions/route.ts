import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/emissions — list emission records (paginated + search)
 * POST /api/dairy/emissions — create a new emission record
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
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyEmissionRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recordDate: 'desc' },
      }),
      db.dairyEmissionRecord.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyEmissionRecord list error:', error)
    return NextResponse.json({ error: 'Failed to fetch emission records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (body.animalCount === undefined) {
      return NextResponse.json({ error: 'animalCount is required' }, { status: 400 })
    }

    const created = await db.dairyEmissionRecord.create({
      data: {
        tenantId: ctx.tenantId,
        recordDate: body.recordDate ? new Date(body.recordDate) : new Date(),
        species: body.species || 'Cattle',
        animalCount: parseInt(body.animalCount),
        entericMethaneKgDay: body.entericMethaneKgDay ? parseFloat(body.entericMethaneKgDay) : null,
        manureEmissionsKgDay: body.manureEmissionsKgDay ? parseFloat(body.manureEmissionsKgDay) : null,
        totalEmissionsKgCO2e: body.totalEmissionsKgCO2e ? parseFloat(body.totalEmissionsKgCO2e) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyEmissionRecord create error:', error)
    return NextResponse.json(
      { error: 'Failed to create emission record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
