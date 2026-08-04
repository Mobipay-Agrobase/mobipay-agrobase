/**
 * GET  /api/support/tickets/[id]  — get ticket details + replies
 * PATCH /api/support/tickets/[id] — update status/priority/assignment
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'support:read')) {
      return NextResponse.json({ error: 'Support access required' }, { status: 403 })
    }

    const { id } = await params
    const isFinanceOrAdmin = ctx.isSuperAdmin || ctx.role === 'MOBIPAY_FINANCE'

    const ticket = await db.supportTicket.findFirst({
      where: { id, ...(isFinanceOrAdmin ? {} : { tenantId: ctx.tenantId }) },
      include: {
        tenant: { select: { name: true, country: true } },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        replies: {
          include: { fromUser: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load ticket' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getTenantContext()
    if (!ctx.isSuperAdmin && ctx.role !== 'MOBIPAY_FINANCE') {
      return NextResponse.json({ error: 'Finance/Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, priority, assignedToId } = body

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date()
      }
    }
    if (priority) updateData.priority = priority
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    const ticket = await db.supportTicket.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ ticket })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
