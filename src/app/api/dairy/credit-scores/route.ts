import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/credit-scores — list dairy credit scores (paginated + search)
 * POST /api/dairy/credit-scores — create a new credit score record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const farmerId = searchParams.get('farmerId')
    const band = searchParams.get('band')
    const minScore = searchParams.get('minScore')
    const maxScore = searchParams.get('maxScore')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (farmerId) where.farmerId = farmerId
    if (band) where.band = band
    if (minScore || maxScore) {
      const range: Record<string, unknown> = {}
      if (minScore) range.gte = parseInt(minScore)
      if (maxScore) range.lte = parseInt(maxScore)
      where.score = range
    }
    if (startDate || endDate) {
      const range: Record<string, unknown> = {}
      if (startDate) range.gte = new Date(startDate)
      if (endDate) range.lte = new Date(endDate)
      where.scoredOn = range
    }
    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { band: { contains: search, mode: 'insensitive' } },
        { modelVersion: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyCreditScore.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scoredOn: 'desc' },
      }),
      db.dairyCreditScore.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyCreditScore list error:', error)
    return NextResponse.json({ error: 'Failed to fetch credit scores' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.farmerId || !body.farmerName || body.score === undefined || !body.band) {
      return NextResponse.json(
        { error: 'farmerId, farmerName, score and band are required' },
        { status: 400 },
      )
    }

    const created = await db.dairyCreditScore.create({
      data: {
        tenantId: ctx.tenantId,
        farmerId: body.farmerId,
        farmerName: body.farmerName,
        scoredOn: body.scoredOn ? new Date(body.scoredOn) : undefined,
        score: parseInt(body.score),
        band: body.band,
        monthsOfHistory: body.monthsOfHistory !== undefined ? parseInt(body.monthsOfHistory) : 0,
        avgMonthlyIncome: body.avgMonthlyIncome !== undefined ? (body.avgMonthlyIncome ? parseFloat(body.avgMonthlyIncome) : null) : null,
        volumeConsistency: body.volumeConsistency !== undefined ? (body.volumeConsistency ? parseFloat(body.volumeConsistency) : null) : null,
        qualityIndex: body.qualityIndex !== undefined ? (body.qualityIndex ? parseFloat(body.qualityIndex) : null) : null,
        herdHealthIndex: body.herdHealthIndex !== undefined ? (body.herdHealthIndex ? parseFloat(body.herdHealthIndex) : null) : null,
        modelVersion: body.modelVersion || 'v1.0',
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyCreditScore create error:', error)
    return NextResponse.json(
      { error: 'Failed to create credit score', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
