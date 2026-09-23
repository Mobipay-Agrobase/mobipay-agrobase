import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/mcc-intakes — list MCC intake records (paginated + search)
 * POST /api/dairy/mcc-intakes — create a new MCC intake record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const mccId = searchParams.get('mccId')
    const farmerId = searchParams.get('farmerId')
    const session = searchParams.get('session')
    const grade = searchParams.get('grade')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (mccId) where.mccId = mccId
    if (farmerId) where.farmerId = farmerId
    if (session) where.session = session
    if (grade) where.grade = grade
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.intakeDate = range
    }
    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { rejectReason: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyMccIntake.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          mcc: { select: { id: true, name: true, capacityLitres: true, hasCooler: true } },
        },
        orderBy: { intakeDate: 'desc' },
      }),
      db.dairyMccIntake.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyMccIntake list error:', error)
    return NextResponse.json({ error: 'Failed to fetch MCC intakes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.mccId || !body.farmerName || body.litresReceived === undefined || body.litresAccepted === undefined || body.pricePerLitre === undefined) {
      return NextResponse.json(
        { error: 'mccId, farmerName, litresReceived, litresAccepted and pricePerLitre are required' },
        { status: 400 },
      )
    }

    const litresReceived = parseFloat(body.litresReceived)
    const litresAccepted = parseFloat(body.litresAccepted)
    const litresRejected = body.litresRejected ? parseFloat(body.litresRejected) : Math.max(0, litresReceived - litresAccepted)
    const pricePerLitre = parseFloat(body.pricePerLitre)
    const grossAmount = body.grossAmount ? parseFloat(body.grossAmount) : litresAccepted * pricePerLitre

    const created = await db.dairyMccIntake.create({
      data: {
        tenantId: ctx.tenantId,
        mccId: body.mccId,
        farmerId: body.farmerId || null,
        farmerName: body.farmerName,
        pickupId: body.pickupId || null,
        intakeDate: body.intakeDate ? new Date(body.intakeDate) : undefined,
        session: body.session || 'morning',
        litresReceived,
        litresAccepted,
        litresRejected,
        rejectReason: body.rejectReason || null,
        grade: body.grade || 'A',
        pricePerLitre,
        grossAmount,
        currency: body.currency || 'UGX',
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyMccIntake create error:', error)
    return NextResponse.json(
      { error: 'Failed to create MCC intake', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
