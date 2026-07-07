import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/crop-insurance?farmerId=xxx
 *   List crop insurance records for a farmer (or all in tenant).
 *
 * POST /api/crop-insurance
 *   Enroll a farmer in crop insurance.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    const tf = buildTenantFilter(ctx, 'tenantId') as any
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { ...tf }
    if (farmerId) where.farmerId = farmerId
    if (status) where.status = status

    const records = await db.cropInsurance.findMany({
      where,
      include: {
        farmer: { select: { id: true, firstName: true, lastName: true, farmerCode: true } },
      },
      orderBy: { enrollmentDate: 'desc' },
      take: 200,
    })

    return NextResponse.json({ data: records })
  } catch (error: any) {
    console.error('Crop insurance list error:', error)
    return NextResponse.json({ error: 'Failed to fetch crop insurance records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext(request)
    const body = await request.json()
    const { farmerId, crop, provider, policyNumber, premium, coverageAmount, enrollmentDate, notes } = body

    if (!farmerId || !crop) {
      return NextResponse.json({ error: 'farmerId and crop are required' }, { status: 400 })
    }

    const farmer = await db.farmerProfile.findFirst({
      where: { id: farmerId, ...buildTenantFilter(ctx, 'tenantId') },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!farmer) return NextResponse.json({ error: 'Farmer not found' }, { status: 404 })

    const record = await db.cropInsurance.create({
      data: {
        tenantId: ctx.tenantId,
        farmerId,
        crop,
        provider: provider || null,
        policyNumber: policyNumber || null,
        premium: premium ? parseFloat(premium) : null,
        coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null,
        status: 'ENROLLED',
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
        notes: notes || null,
      },
    })

    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error: any) {
    console.error('Crop insurance create error:', error)
    return NextResponse.json({ error: 'Failed to create crop insurance record' }, { status: 500 })
  }
}
