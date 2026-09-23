import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/contracts — list dairy contracts (paginated + search)
 * POST /api/dairy/contracts — create a new contract
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const pricingType = searchParams.get('pricingType')
    const sellerOrgUnitId = searchParams.get('sellerOrgUnitId')
    const buyerOfftakerId = searchParams.get('buyerOfftakerId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (status) where.status = status
    if (pricingType) where.pricingType = pricingType
    if (sellerOrgUnitId) where.sellerOrgUnitId = sellerOrgUnitId
    if (buyerOfftakerId) where.buyerOfftakerId = buyerOfftakerId
    if (search) {
      where.OR = [
        { contractNo: { contains: search, mode: 'insensitive' } },
        { pricingType: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { penaltyTerms: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyContract.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      db.dairyContract.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyContract list error:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.contractNo || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'contractNo, startDate and endDate are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyContract.create({
      data: {
        tenantId: ctx.tenantId,
        sellerOrgUnitId: body.sellerOrgUnitId || null,
        buyerOfftakerId: body.buyerOfftakerId || null,
        contractNo: body.contractNo,
        pricingType: body.pricingType || 'fixed',
        pricePerLitre: body.pricePerLitre !== undefined ? (body.pricePerLitre ? parseFloat(body.pricePerLitre) : null) : null,
        currency: body.currency || 'UGX',
        minLitresDay: body.minLitresDay !== undefined ? (body.minLitresDay ? parseInt(body.minLitresDay) : null) : null,
        maxLitresDay: body.maxLitresDay !== undefined ? (body.maxLitresDay ? parseInt(body.maxLitresDay) : null) : null,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        penaltyTerms: body.penaltyTerms || null,
        status: body.status || 'draft',
        documentUrl: body.documentUrl || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyContract create error:', error)
    return NextResponse.json(
      { error: 'Failed to create contract', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
