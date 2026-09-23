import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/vets — list dairy vets (paginated + search)
 * POST /api/dairy/vets — create a new vet
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const isActive = searchParams.get('isActive')
    const isVerified = searchParams.get('isVerified')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (isVerified === 'true') where.isVerified = true
    if (isVerified === 'false') where.isVerified = false
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { vetCode: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyVet.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          serviceAreas: {
            select: { id: true, district: true, subCounty: true, radiusKm: true, isActive: true },
          },
          _count: { select: { vetRequests: true, reviews: true, serviceAreas: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyVet.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyVet list error:', error)
    return NextResponse.json({ error: 'Failed to fetch vets' }, { status: 500 })
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

    const created = await db.dairyVet.create({
      data: {
        tenantId: ctx.tenantId,
        vetCode: body.vetCode || null,
        fullName: body.fullName,
        licenseNumber: body.licenseNumber || null,
        isVerified: body.isVerified !== undefined ? !!body.isVerified : false,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : null,
        verifiedBy: body.verifiedBy || null,
        phone: body.phone || null,
        email: body.email || null,
        specialties: body.specialties
          ? (Array.isArray(body.specialties) ? JSON.stringify(body.specialties) : String(body.specialties))
          : null,
        workingHours: body.workingHours
          ? (typeof body.workingHours === 'object' ? JSON.stringify(body.workingHours) : String(body.workingHours))
          : null,
        rating: body.rating ? parseFloat(body.rating) : 0,
        totalReviews: body.totalReviews !== undefined ? parseInt(body.totalReviews) : 0,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyVet create error:', error)
    return NextResponse.json(
      { error: 'Failed to create vet', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
