import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/local-partners — list local partners (paginated + search)
 * POST /api/dairy/local-partners — create a new local partner
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const partnerType = searchParams.get('partnerType')
    const countryCode = searchParams.get('countryCode')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (partnerType) where.partnerType = partnerType
    if (countryCode) where.countryCode = countryCode
    if (status) where.status = status
    if (search) {
      where.OR = [
        { partnerName: { contains: search, mode: 'insensitive' } },
        { partnerType: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { countryCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyLocalPartner.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyLocalPartner.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyLocalPartner list error:', error)
    return NextResponse.json({ error: 'Failed to fetch local partners' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyLocalPartner.create({
      data: {
        tenantId: ctx.tenantId,
        partnerName: body.partnerName,
        partnerType: body.partnerType || 'cooperative',
        countryCode: body.countryCode || 'UG',
        contactName: body.contactName || null,
        contactPhone: body.contactPhone || null,
        contactEmail: body.contactEmail || null,
        agreementUrl: body.agreementUrl || null,
        status: body.status || 'pending',
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyLocalPartner create error:', error)
    return NextResponse.json(
      { error: 'Failed to create local partner', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
