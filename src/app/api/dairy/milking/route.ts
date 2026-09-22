import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/milking — list milking records (paginated + search)
 * POST /api/dairy/milking — create a new milking record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cowId = searchParams.get('cowId')
    const session = searchParams.get('session')
    const qualityGrade = searchParams.get('qualityGrade')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (cowId) where.cowId = cowId
    if (session) where.session = session
    if (qualityGrade) where.qualityGrade = qualityGrade
    if (search) {
      where.OR = [
        { session: { contains: search, mode: 'insensitive' } },
        { qualityGrade: { contains: search, mode: 'insensitive' } },
        { cow: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyMilkingRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: { select: { id: true, name: true, cowCode: true } } },
        orderBy: { milkingDate: 'desc' },
      }),
      db.dairyMilkingRecord.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyMilkingRecord list error:', error)
    return NextResponse.json({ error: 'Failed to fetch milking records' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.cowId || !body.milkingDate || body.milkYieldLitres === undefined) {
      return NextResponse.json({ error: 'cowId, milkingDate and milkYieldLitres are required' }, { status: 400 })
    }

    const created = await db.dairyMilkingRecord.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId,
        milkingDate: new Date(body.milkingDate),
        session: body.session || 'Morning',
        milkYieldLitres: parseFloat(body.milkYieldLitres),
        fatContentPct: body.fatContentPct ? parseFloat(body.fatContentPct) : null,
        proteinContentPct: body.proteinContentPct ? parseFloat(body.proteinContentPct) : null,
        qualityGrade: body.qualityGrade || null,
        storageTempC: body.storageTempC ? parseFloat(body.storageTempC) : null,
        bulkTankId: body.bulkTankId || null,
        recordedBy: body.recordedBy || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyMilkingRecord create error:', error)
    return NextResponse.json(
      { error: 'Failed to create milking record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
