import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/withdrawals — list withdrawal locks (paginated + search)
 * POST /api/dairy/withdrawals — create a new withdrawal lock
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cowId = searchParams.get('cowId')
    const isActive = searchParams.get('isActive')
    const milkWithheld = searchParams.get('milkWithheld')
    const meatWithheld = searchParams.get('meatWithheld')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (cowId) where.cowId = cowId
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (milkWithheld === 'true') where.milkWithheld = true
    if (milkWithheld === 'false') where.milkWithheld = false
    if (meatWithheld === 'true') where.meatWithheld = true
    if (meatWithheld === 'false') where.meatWithheld = false
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { treatmentType: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { cow: { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cowCode: { contains: search, mode: 'insensitive' } },
          { tagNumber: { contains: search, mode: 'insensitive' } },
        ] } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyWithdrawalLock.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: { select: { id: true, name: true, cowCode: true, tagNumber: true } } },
        orderBy: { startDate: 'desc' },
      }),
      db.dairyWithdrawalLock.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyWithdrawalLock list error:', error)
    return NextResponse.json({ error: 'Failed to fetch withdrawal locks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.cowId) {
      return NextResponse.json({ error: 'cowId is required' }, { status: 400 })
    }
    if (!body.reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 })
    }
    if (!body.endDate) {
      return NextResponse.json({ error: 'endDate is required' }, { status: 400 })
    }

    const created = await db.dairyWithdrawalLock.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId,
        reason: body.reason,
        treatmentType: body.treatmentType || 'Medication',
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: new Date(body.endDate),
        milkWithheld: body.milkWithheld !== undefined ? !!body.milkWithheld : true,
        meatWithheld: body.meatWithheld !== undefined ? !!body.meatWithheld : true,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
        triggeredBy: body.triggeredBy || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyWithdrawalLock create error:', error)
    return NextResponse.json(
      { error: 'Failed to create withdrawal lock', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
