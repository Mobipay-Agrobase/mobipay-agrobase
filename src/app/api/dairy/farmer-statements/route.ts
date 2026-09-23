import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/farmer-statements — list dairy farmer statements (paginated + search)
 * POST /api/dairy/farmer-statements — create a new farmer statement
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const farmerId = searchParams.get('farmerId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (farmerId) where.farmerId = farmerId
    if (status) where.status = status
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.periodStart = range
    }
    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { statementNo: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyFarmerStatement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyFarmerStatement.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyFarmerStatement list error:', error)
    return NextResponse.json({ error: 'Failed to fetch farmer statements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.farmerId || !body.farmerName || !body.statementNo || !body.periodStart || !body.periodEnd) {
      return NextResponse.json(
        { error: 'farmerId, farmerName, statementNo, periodStart and periodEnd are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyFarmerStatement.create({
      data: {
        tenantId: ctx.tenantId,
        farmerId: body.farmerId,
        farmerName: body.farmerName,
        statementNo: body.statementNo,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        totalMilkLitres: body.totalMilkLitres !== undefined ? parseFloat(body.totalMilkLitres) : 0,
        totalEarnings: body.totalEarnings !== undefined ? parseFloat(body.totalEarnings) : 0,
        totalDeductions: body.totalDeductions !== undefined ? parseFloat(body.totalDeductions) : 0,
        totalPayments: body.totalPayments !== undefined ? parseFloat(body.totalPayments) : 0,
        closingBalance: body.closingBalance !== undefined ? parseFloat(body.closingBalance) : 0,
        currency: body.currency || 'UGX',
        pdfUrl: body.pdfUrl || null,
        status: body.status || 'generated',
        sentAt: body.sentAt ? new Date(body.sentAt) : null,
        acknowledgedAt: body.acknowledgedAt ? new Date(body.acknowledgedAt) : null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyFarmerStatement create error:', error)
    return NextResponse.json(
      { error: 'Failed to create farmer statement', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
