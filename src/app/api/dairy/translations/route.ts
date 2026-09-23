import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/translations — list translations (paginated + search)
 * POST /api/dairy/translations — create a new translation
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const languageCode = searchParams.get('languageCode')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (languageCode) where.languageCode = languageCode
    if (search) {
      where.OR = [
        { languageCode: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyTranslation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyTranslation.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyTranslation list error:', error)
    return NextResponse.json({ error: 'Failed to fetch translations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyTranslation.create({
      data: {
        tenantId: ctx.tenantId,
        languageCode: body.languageCode,
        key: body.key,
        value: body.value,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyTranslation create error:', error)
    return NextResponse.json(
      { error: 'Failed to create translation', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
