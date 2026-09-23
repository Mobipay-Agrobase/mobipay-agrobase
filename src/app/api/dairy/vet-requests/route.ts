import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/vet-requests — list vet requests / "Need Vet" flow (paginated + search)
 * POST /api/dairy/vet-requests — create a new vet request
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const urgency = searchParams.get('urgency')
    const vetId = searchParams.get('vetId')
    const cowId = searchParams.get('cowId')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (status) where.status = status
    if (urgency) where.urgency = urgency
    if (vetId) where.vetId = vetId
    if (cowId) where.cowId = cowId
    if (search) {
      where.OR = [
        { symptom: { contains: search, mode: 'insensitive' } },
        { farmerName: { contains: search, mode: 'insensitive' } },
        { farmerPhone: { contains: search } },
        { diagnosis: { contains: search, mode: 'insensitive' } },
        { treatment: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyVetRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          cow: { select: { id: true, name: true, cowCode: true, tagNumber: true } },
          vet: { select: { id: true, fullName: true, phone: true, rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyVetRequest.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyVetRequest list error:', error)
    return NextResponse.json({ error: 'Failed to fetch vet requests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.symptom) {
      return NextResponse.json({ error: 'symptom is required' }, { status: 400 })
    }

    const created = await db.dairyVetRequest.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId || null,
        farmerId: body.farmerId || null,
        farmerName: body.farmerName || null,
        farmerPhone: body.farmerPhone || null,
        vetId: body.vetId || null,
        symptom: body.symptom,
        urgency: body.urgency || 'Normal',
        status: body.status || 'PENDING',
        acceptedAt: body.acceptedAt ? new Date(body.acceptedAt) : null,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        diagnosis: body.diagnosis || null,
        treatment: body.treatment || null,
        prescriptionUrl: body.prescriptionUrl || null,
        visitFee: body.visitFee !== undefined ? (body.visitFee ? parseFloat(body.visitFee) : null) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyVetRequest create error:', error)
    return NextResponse.json(
      { error: 'Failed to create vet request', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
