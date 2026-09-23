import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/deduction-rules — list dairy deduction rules (paginated + search)
 * POST /api/dairy/deduction-rules — create a new deduction rule
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const deductionType = searchParams.get('deductionType')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (deductionType) where.deductionType = deductionType
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { deductionType: { contains: search, mode: 'insensitive' } },
        { appliesTo: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyDeductionRule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyDeductionRule.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyDeductionRule list error:', error)
    return NextResponse.json({ error: 'Failed to fetch deduction rules' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.name || body.amount === undefined) {
      return NextResponse.json(
        { error: 'name and amount are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyDeductionRule.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name,
        deductionType: body.deductionType || 'fixed_per_litre',
        amount: parseFloat(body.amount),
        currency: body.currency || 'UGX',
        appliesTo: body.appliesTo || 'all',
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyDeductionRule create error:', error)
    return NextResponse.json(
      { error: 'Failed to create deduction rule', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
