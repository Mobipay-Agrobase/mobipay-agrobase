import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/country-configs — list country configs (paginated + search)
 * POST /api/dairy/country-configs — create a new country config
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const countryCode = searchParams.get('countryCode')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (countryCode) where.countryCode = countryCode
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { countryCode: { contains: search, mode: 'insensitive' } },
        { countryName: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
        { defaultLanguage: { contains: search, mode: 'insensitive' } },
        { vetAuthority: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyCountryConfig.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyCountryConfig.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyCountryConfig list error:', error)
    return NextResponse.json({ error: 'Failed to fetch country configs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await db.dairyCountryConfig.create({
      data: {
        tenantId: ctx.tenantId,
        countryCode: body.countryCode,
        countryName: body.countryName,
        currency: body.currency || 'UGX',
        defaultLanguage: body.defaultLanguage || 'en',
        supportedLanguages: body.supportedLanguages || null,
        vetAuthority: body.vetAuthority || null,
        ussdShortcode: body.ussdShortcode || null,
        ussdGateway: body.ussdGateway || null,
        minFarmgatePrice: body.minFarmgatePrice ? parseFloat(body.minFarmgatePrice) : null,
        maxFarmgatePrice: body.maxFarmgatePrice ? parseFloat(body.maxFarmgatePrice) : null,
        nationalLivestockIdApi: body.nationalLivestockIdApi || null,
        eVetApiUrl: body.eVetApiUrl || null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyCountryConfig create error:', error)
    return NextResponse.json(
      { error: 'Failed to create country config', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
