import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/quality-tests — list milk quality tests (paginated + search)
 * POST /api/dairy/quality-tests — create a new quality test
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const batchId = searchParams.get('batchId')
    const testParameter = searchParams.get('testParameter')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (batchId) where.batchId = batchId
    if (testParameter) where.testParameter = testParameter
    if (search) {
      where.OR = [
        { batchId: { contains: search, mode: 'insensitive' } },
        { testParameter: { contains: search, mode: 'insensitive' } },
        { testResult: { contains: search, mode: 'insensitive' } },
        { labName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyMilkQualityTest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { collectionDate: 'desc' },
      }),
      db.dairyMilkQualityTest.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyMilkQualityTest list error:', error)
    return NextResponse.json({ error: 'Failed to fetch quality tests' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.batchId || !body.collectionDate || !body.testParameter || !body.testResult) {
      return NextResponse.json({ error: 'batchId, collectionDate, testParameter and testResult are required' }, { status: 400 })
    }

    const created = await db.dairyMilkQualityTest.create({
      data: {
        tenantId: ctx.tenantId,
        batchId: body.batchId,
        tankId: body.tankId || null,
        collectionDate: new Date(body.collectionDate),
        samplingTime: body.samplingTime || '00:00',
        testParameter: body.testParameter,
        testResult: body.testResult,
        labName: body.labName || null,
        reportUrl: body.reportUrl || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyMilkQualityTest create error:', error)
    return NextResponse.json(
      { error: 'Failed to create quality test', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
