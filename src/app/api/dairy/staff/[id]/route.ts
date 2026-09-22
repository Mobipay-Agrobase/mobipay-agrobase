import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(_req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const item = await db.dairyStaff.findFirst({
      where: { id, ...tf },
      include: {
        _count: { select: { taskAssignments: true, feedSchedules: true } },
        taskAssignments: { take: 10, orderBy: { taskDate: 'desc' }, include: { cow: { select: { id: true, name: true } } } },
      },
    })
    if (!item) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('DairyStaff detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyStaff.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    const body = await req.json()
    const updated = await db.dairyStaff.update({
      where: { id },
      data: {
        staffCode: body.staffCode !== undefined ? body.staffCode || null : undefined,
        name: body.name !== undefined ? body.name : undefined,
        role: body.role !== undefined ? body.role : undefined,
        contactNumber: body.contactNumber !== undefined ? body.contactNumber || null : undefined,
        email: body.email !== undefined ? body.email || null : undefined,
        schedule: body.schedule !== undefined ? body.schedule || null : undefined,
        employmentDate: body.employmentDate !== undefined ? (body.employmentDate ? new Date(body.employmentDate) : null) : undefined,
        salary: body.salary !== undefined ? (body.salary ? parseFloat(body.salary) : null) : undefined,
        isActive: body.isActive !== undefined ? !!body.isActive : undefined,
      },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('DairyStaff update error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getTenantContext(req)
    const tf = buildTenantFilter(ctx, 'tenantId')
    const existing = await db.dairyStaff.findFirst({ where: { id, ...tf } })
    if (!existing) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    await db.dairyStaff.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    console.error('DairyStaff delete error:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
