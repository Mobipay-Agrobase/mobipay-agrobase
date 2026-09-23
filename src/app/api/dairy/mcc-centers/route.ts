import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/mcc-centers — list MCC cooling centers (paginated + search)
 * POST /api/dairy/mcc-centers — create a new MCC center
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offtakerId = searchParams.get('offtakerId')
    const hasCooler = searchParams.get('hasCooler')
    const hasAnalyzer = searchParams.get('hasAnalyzer')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (offtakerId) where.offtakerId = offtakerId
    if (hasCooler === 'true') where.hasCooler = true
    if (hasCooler === 'false') where.hasCooler = false
    if (hasAnalyzer === 'true') where.hasAnalyzer = true
    if (hasAnalyzer === 'false') where.hasAnalyzer = false
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { offtaker: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyMccCenter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          offtaker: { select: { id: true, name: true, offtakerType: true } },
          _count: { select: { intakes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyMccCenter.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyMccCenter list error:', error)
    return NextResponse.json({ error: 'Failed to fetch MCC centers' }, { status: 500 })
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

    const created = await db.dairyMccCenter.create({
      data: {
        tenantId: ctx.tenantId,
        offtakerId: body.offtakerId || null,
        name: body.name,
        capacityLitres: body.capacityLitres ? parseInt(body.capacityLitres) : null,
        hasCooler: body.hasCooler !== undefined ? !!body.hasCooler : false,
        hasAnalyzer: body.hasAnalyzer !== undefined ? !!body.hasAnalyzer : false,
        lat: body.lat ? parseFloat(body.lat) : null,
        lng: body.lng ? parseFloat(body.lng) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyMccCenter create error:', error)
    return NextResponse.json(
      { error: 'Failed to create MCC center', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
