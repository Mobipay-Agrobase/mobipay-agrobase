import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/lenders — list lenders (paginated + search)
 * POST /api/dairy/lenders — create a new lender
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const lenderType = searchParams.get('lenderType')
    const countryCode = searchParams.get('countryCode')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (lenderType) where.lenderType = lenderType
    if (countryCode) where.countryCode = countryCode
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { lenderName: { contains: search, mode: 'insensitive' } },
        { lenderType: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search, mode: 'insensitive' } },
        { countryCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyLender.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          loanApplications: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { id: true, farmerName: true, requestedAmount: true, status: true, appliedAt: true },
          },
          _count: { select: { loanApplications: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyLender.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyLender list error:', error)
    return NextResponse.json({ error: 'Failed to fetch lenders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyLender.create({
      data: {
        tenantId: ctx.tenantId,
        lenderName: body.lenderName,
        lenderType: body.lenderType || 'bank',
        countryCode: body.countryCode || 'UG',
        contactName: body.contactName || null,
        contactPhone: body.contactPhone || null,
        contactEmail: body.contactEmail || null,
        apiUrl: body.apiUrl || null,
        apiKey: body.apiKey || null,
        maxLoanAmount: body.maxLoanAmount !== undefined && body.maxLoanAmount !== null ? parseFloat(body.maxLoanAmount) : null,
        minCreditScore: body.minCreditScore !== undefined && body.minCreditScore !== null ? parseInt(body.minCreditScore) : null,
        interestRate: body.interestRate !== undefined && body.interestRate !== null ? parseFloat(body.interestRate) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyLender create error:', error)
    return NextResponse.json(
      { error: 'Failed to create lender', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
