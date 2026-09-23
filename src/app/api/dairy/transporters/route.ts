import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/transporters — list transporters (paginated + search)
 * POST /api/dairy/transporters — create a new transporter
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const transporterType = searchParams.get('transporterType')
    const verificationStatus = searchParams.get('verificationStatus')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (transporterType) where.transporterType = transporterType
    if (verificationStatus) where.verificationStatus = verificationStatus
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { transporterCode: { contains: search, mode: 'insensitive' } },
        { licenceNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyTransporter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { vehicles: true, trips: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyTransporter.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyTransporter list error:', error)
    return NextResponse.json({ error: 'Failed to fetch transporters' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.fullName) {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 })
    }

    const created = await db.dairyTransporter.create({
      data: {
        tenantId: ctx.tenantId,
        transporterCode: body.transporterCode || null,
        fullName: body.fullName,
        companyName: body.companyName || null,
        transporterType: body.transporterType || 'pickup',
        licenceNo: body.licenceNo || null,
        insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
        phone: body.phone || null,
        verificationStatus: body.verificationStatus || 'pending',
        avgRating: body.avgRating ? parseFloat(body.avgRating) : 0,
        totalReviews: body.totalReviews ? parseInt(body.totalReviews) : 0,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyTransporter create error:', error)
    return NextResponse.json(
      { error: 'Failed to create transporter', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
