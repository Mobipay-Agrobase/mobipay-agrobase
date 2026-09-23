import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/diseases — list dairy disease master (paginated + search)
 * POST /api/dairy/diseases — create a new disease record
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const isNotifiable = searchParams.get('isNotifiable')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (category) where.category = category
    if (isNotifiable === 'true') where.isNotifiable = true
    if (isNotifiable === 'false') where.isNotifiable = false
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { symptoms: { contains: search, mode: 'insensitive' } },
        { treatmentProtocol: { contains: search, mode: 'insensitive' } },
        { preventionMeasures: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyDisease.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyDisease.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyDisease list error:', error)
    return NextResponse.json({ error: 'Failed to fetch diseases' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const created = await db.dairyDisease.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name,
        category: body.category || null,
        symptoms: body.symptoms
          ? (Array.isArray(body.symptoms) ? JSON.stringify(body.symptoms) : String(body.symptoms))
          : null,
        isNotifiable: body.isNotifiable !== undefined ? !!body.isNotifiable : false,
        treatmentProtocol: body.treatmentProtocol || null,
        preventionMeasures: body.preventionMeasures || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyDisease create error:', error)
    return NextResponse.json(
      { error: 'Failed to create disease', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
