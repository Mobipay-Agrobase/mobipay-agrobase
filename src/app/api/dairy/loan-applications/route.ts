import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/loan-applications — list loan applications (paginated + search)
 * POST /api/dairy/loan-applications — create a new loan application
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const lenderId = searchParams.get('lenderId')
    const farmerId = searchParams.get('farmerId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (lenderId) where.lenderId = lenderId
    if (farmerId) where.farmerId = farmerId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { farmerPhone: { contains: search, mode: 'insensitive' } },
        { lenderRef: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyLoanApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lender: { select: { id: true, lenderName: true, lenderType: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyLoanApplication.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyLoanApplication list error:', error)
    return NextResponse.json({ error: 'Failed to fetch loan applications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyLoanApplication.create({
      data: {
        tenantId: ctx.tenantId,
        lenderId: body.lenderId,
        farmerId: body.farmerId,
        farmerName: body.farmerName,
        farmerPhone: body.farmerPhone || null,
        creditScoreId: body.creditScoreId || null,
        requestedAmount: parseFloat(body.requestedAmount),
        approvedAmount:
          body.approvedAmount !== undefined && body.approvedAmount !== null
            ? parseFloat(body.approvedAmount)
            : null,
        currency: body.currency || 'UGX',
        purpose: body.purpose || null,
        durationMonths:
          body.durationMonths !== undefined && body.durationMonths !== null
            ? parseInt(body.durationMonths)
            : null,
        interestRate:
          body.interestRate !== undefined && body.interestRate !== null
            ? parseFloat(body.interestRate)
            : null,
        status: body.status || 'pending',
        lenderRef: body.lenderRef || null,
        appliedAt: body.appliedAt ? new Date(body.appliedAt) : new Date(),
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : null,
        approvedAt: body.approvedAt ? new Date(body.approvedAt) : null,
        disbursedAt: body.disbursedAt ? new Date(body.disbursedAt) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyLoanApplication create error:', error)
    return NextResponse.json(
      { error: 'Failed to create loan application', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
