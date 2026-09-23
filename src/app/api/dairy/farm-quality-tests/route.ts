import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/farm-quality-tests — list farm-level quality tests (paginated + search)
 * POST /api/dairy/farm-quality-tests — create a new farm-level quality test
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cowId = searchParams.get('cowId')
    const farmerId = searchParams.get('farmerId')
    const testType = searchParams.get('testType')
    const isAbnormal = searchParams.get('isAbnormal')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (cowId) where.cowId = cowId
    if (farmerId) where.farmerId = farmerId
    if (testType) where.testType = testType
    if (isAbnormal === 'true') where.isAbnormal = true
    if (isAbnormal === 'false') where.isAbnormal = false
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.testDate = range
    }
    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { testType: { contains: search, mode: 'insensitive' } },
        { result: { contains: search, mode: 'insensitive' } },
        { mastitisRisk: { contains: search, mode: 'insensitive' } },
        { testedBy: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyFarmQualityTest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { testDate: 'desc' },
      }),
      db.dairyFarmQualityTest.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyFarmQualityTest list error:', error)
    return NextResponse.json({ error: 'Failed to fetch farm quality tests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.testType || !body.result) {
      return NextResponse.json(
        { error: 'testType and result are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyFarmQualityTest.create({
      data: {
        tenantId: ctx.tenantId,
        cowId: body.cowId || null,
        farmerId: body.farmerId || null,
        farmerName: body.farmerName || null,
        testDate: body.testDate ? new Date(body.testDate) : undefined,
        testType: body.testType,
        result: body.result,
        unit: body.unit || null,
        isAbnormal: body.isAbnormal !== undefined ? !!body.isAbnormal : false,
        mastitisRisk: body.mastitisRisk || null,
        notes: body.notes || null,
        testedBy: body.testedBy || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyFarmQualityTest create error:', error)
    return NextResponse.json(
      { error: 'Failed to create farm quality test', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
