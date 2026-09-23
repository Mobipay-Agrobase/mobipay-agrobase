import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/pickups — list pickups / e-receipts (paginated + search)
 * POST /api/dairy/pickups — create a new pickup / e-receipt
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tripId = searchParams.get('tripId')
    const farmerId = searchParams.get('farmerId')
    const grade = searchParams.get('grade')
    const qrVerified = searchParams.get('qrVerified')
    const farmerConfirmed = searchParams.get('farmerConfirmed')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (tripId) where.tripId = tripId
    if (farmerId) where.farmerId = farmerId
    if (grade) where.grade = grade
    if (qrVerified === 'true') where.qrVerified = true
    if (qrVerified === 'false') where.qrVerified = false
    if (farmerConfirmed === 'true') where.farmerConfirmed = true
    if (farmerConfirmed === 'false') where.farmerConfirmed = false
    if (search) {
      where.OR = [
        { receiptNo: { contains: search, mode: 'insensitive' } },
        { farmerName: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyPickup.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          trip: {
            select: {
              id: true,
              tripDate: true,
              status: true,
              transporter: { select: { id: true, fullName: true } },
              vehicle: { select: { id: true, plateNo: true } },
            },
          },
        },
        orderBy: { pickedAt: 'desc' },
      }),
      db.dairyPickup.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyPickup list error:', error)
    return NextResponse.json({ error: 'Failed to fetch pickups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.tripId || !body.farmerName || !body.receiptNo || body.litres === undefined) {
      return NextResponse.json(
        { error: 'tripId, farmerName, receiptNo and litres are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyPickup.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: body.tripId,
        farmerId: body.farmerId || null,
        farmerName: body.farmerName,
        receiptNo: body.receiptNo,
        litres: parseFloat(body.litres),
        pickedAt: body.pickedAt ? new Date(body.pickedAt) : undefined,
        lat: body.lat ? parseFloat(body.lat) : null,
        lng: body.lng ? parseFloat(body.lng) : null,
        qrVerified: body.qrVerified !== undefined ? !!body.qrVerified : false,
        smsSentAt: body.smsSentAt ? new Date(body.smsSentAt) : null,
        farmerConfirmed: body.farmerConfirmed !== undefined ? !!body.farmerConfirmed : false,
        quickTestJson: body.quickTestJson || null,
        grade: body.grade || null,
        pricePerLitre: body.pricePerLitre ? parseFloat(body.pricePerLitre) : null,
        grossAmount: body.grossAmount ? parseFloat(body.grossAmount) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyPickup create error:', error)
    return NextResponse.json(
      { error: 'Failed to create pickup', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
