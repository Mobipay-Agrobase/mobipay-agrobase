import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

/**
 * GET /api/dairy/tasks — list task assignments (paginated + search)
 * POST /api/dairy/tasks — create a new task assignment
 */
export async function GET(request: Request) {
  try {
    const ctx = await getTenantContext()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const staffId = searchParams.get('staffId')
    const cowId = searchParams.get('cowId')
    const taskStatus = searchParams.get('taskStatus')
    const taskType = searchParams.get('taskType')

    const where: Record<string, unknown> = { ...buildTenantFilter(ctx, 'tenantId') }
    if (staffId) where.staffId = staffId
    if (cowId) where.cowId = cowId
    if (taskStatus) where.taskStatus = taskStatus
    if (taskType) where.taskType = taskType
    if (search) {
      where.OR = [
        { taskType: { contains: search, mode: 'insensitive' } },
        { taskStatus: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { staff: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [items, total] = await Promise.all([
      db.dairyTaskAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          staff: { select: { id: true, name: true } },
          cow: { select: { id: true, name: true, cowCode: true } },
        },
        orderBy: { taskDate: 'desc' },
      }),
      db.dairyTaskAssignment.count({ where }),
    ])

    return NextResponse.json({ data: items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('DairyTaskAssignment list error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext()
    const body = await request.json()

    if (!ctx.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!body.staffId || !body.taskDate) {
      return NextResponse.json({ error: 'staffId and taskDate are required' }, { status: 400 })
    }

    const created = await db.dairyTaskAssignment.create({
      data: {
        tenantId: ctx.tenantId,
        staffId: body.staffId,
        cowId: body.cowId || null,
        taskType: body.taskType || 'Milking',
        taskDate: new Date(body.taskDate),
        taskStatus: body.taskStatus || 'Pending',
        notes: body.notes || null,
        photoUrl: body.photoUrl || null,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
      },
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('DairyTaskAssignment create error:', error)
    return NextResponse.json(
      { error: 'Failed to create task', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
