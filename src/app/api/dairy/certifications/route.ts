import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/certifications — list certifications (paginated + search)
 * POST /api/dairy/certifications — create a new certification
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const standard = searchParams.get('standard')
    const outcome = searchParams.get('outcome')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (standard) where.standard = standard
    if (outcome) where.outcome = outcome
    if (search) {
      where.OR = [
        { standard: { contains: search, mode: 'insensitive' } },
        { assessorName: { contains: search, mode: 'insensitive' } },
        { outcome: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyCertification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assessmentDate: 'desc' },
      }),
      db.dairyCertification.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyCertification list error:', error)
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.assessmentDate || !body.assessorName) {
      return NextResponse.json({ error: 'assessmentDate and assessorName are required' }, { status: 400 })
    }

    const created = await db.dairyCertification.create({
      data: {
        tenantId: ctx.tenantId,
        standard: body.standard || 'G.R.A.S',
        assessmentDate: new Date(body.assessmentDate),
        assessorName: body.assessorName,
        animalWelfare: body.animalWelfare || 'Compliant',
        biosecurity: body.biosecurity || 'Compliant',
        wasteManagement: body.wasteManagement || 'Compliant',
        climateSmart: body.climateSmart || 'Compliant',
        outcome: body.outcome || 'Passed',
        totalScorePct: body.totalScorePct ? parseFloat(body.totalScorePct) : null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyCertification create error:', error)
    return NextResponse.json(
      { error: 'Failed to create certification', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
