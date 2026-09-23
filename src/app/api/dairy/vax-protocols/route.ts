import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/vax-protocols — list vaccination protocols (paginated + search)
 * POST /api/dairy/vax-protocols — create a new vaccination protocol
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const country = searchParams.get('country')
    const species = searchParams.get('species')
    const vaccineName = searchParams.get('vaccineName')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (country) where.country = country
    if (species) where.species = species
    if (vaccineName) where.vaccineName = vaccineName
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { vaccineName: { contains: search, mode: 'insensitive' } },
        { disease: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { species: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyVaccinationProtocol.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyVaccinationProtocol.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyVaccinationProtocol list error:', error)
    return NextResponse.json({ error: 'Failed to fetch vaccination protocols' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.vaccineName) {
      return NextResponse.json({ error: 'vaccineName is required' }, { status: 400 })
    }
    if (body.ageStartMonths === undefined || body.ageStartMonths === null) {
      return NextResponse.json({ error: 'ageStartMonths is required' }, { status: 400 })
    }

    const created = await db.dairyVaccinationProtocol.create({
      data: {
        tenantId: ctx.tenantId,
        country: body.country || 'UG',
        vaccineName: body.vaccineName,
        disease: body.disease || null,
        species: body.species || 'Cattle',
        ageStartMonths: parseInt(body.ageStartMonths),
        ageEndMonths:
          body.ageEndMonths !== undefined ? (body.ageEndMonths ? parseInt(body.ageEndMonths) : null) : null,
        doseSchedule: body.doseSchedule
          ? (Array.isArray(body.doseSchedule) ? JSON.stringify(body.doseSchedule) : String(body.doseSchedule))
          : null,
        boosterIntervalDays:
          body.boosterIntervalDays !== undefined
            ? body.boosterIntervalDays
              ? parseInt(body.boosterIntervalDays)
              : null
            : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyVaccinationProtocol create error:', error)
    return NextResponse.json(
      { error: 'Failed to create vaccination protocol', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
