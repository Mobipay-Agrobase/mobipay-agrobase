import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyTaskAssignment.findFirst({
      where: { id, ...tf },
      include: {
        staff: { select: { id: true, name: true } },
        cow: { select: { id: true, name: true, cowCode: true } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyTaskAssignment detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTaskAssignment.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyTaskAssignment.update({
      where: { id },
      data: {
        staffId: body.staffId !== undefined ? body.staffId : undefined,
        cowId: body.cowId !== undefined ? body.cowId || null : undefined,
        taskType: body.taskType !== undefined ? body.taskType : undefined,
        taskDate: body.taskDate !== undefined ? new Date(body.taskDate) : undefined,
        taskStatus: body.taskStatus !== undefined ? body.taskStatus : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
        photoUrl: body.photoUrl !== undefined ? body.photoUrl || null : undefined,
        completedAt: body.completedAt !== undefined ? (body.completedAt ? new Date(body.completedAt) : null) : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyTaskAssignment update error:', error)
    return NextResponse.json(
      { error: 'Failed to update task', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyTaskAssignment.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    await db.dairyTaskAssignment.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyTaskAssignment delete error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
