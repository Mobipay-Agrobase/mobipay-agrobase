import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/staff — list dairy staff (paginated + search)
 * POST /api/dairy/staff — create a new staff member
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (role) where.role = role
    if (isActive === 'true') where.isActive = true
    if (isActive === 'false') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { staffCode: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyStaff.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { taskAssignments: true, feedSchedules: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.dairyStaff.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyStaff list error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
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

    const created = await db.dairyStaff.create({
      data: {
        tenantId: ctx.tenantId,
        staffCode: body.staffCode || null,
        name: body.name,
        role: body.role || 'Milker',
        contactNumber: body.contactNumber || null,
        email: body.email || null,
        schedule: body.schedule || null,
        employmentDate: body.employmentDate ? new Date(body.employmentDate) : null,
        salary: body.salary ? parseFloat(body.salary) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyStaff create error:', error)
    return NextResponse.json(
      { error: 'Failed to create staff', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
