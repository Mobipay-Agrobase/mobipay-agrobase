/**
 * POST /api/support/tickets/[id]/replies — add a reply to a ticket
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'support:read')) {
      return NextResponse.json({ error: 'Support access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const isFinanceOrAdmin = ctx.isSuperAdmin || ctx.role === 'MOBIPAY_FINANCE'

    // Verify ticket exists and user has access
    const ticket = await db.supportTicket.findFirst({
      where: { id, ...(isFinanceOrAdmin ? {} : { tenantId: ctx.tenantId }) },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const reply = await db.supportTicketReply.create({
      data: {
        ticketId: id,
        message,
        fromUserId: ctx.userId,
        fromRole: ctx.role,
      },
    })

    // If finance/admin replies, mark ticket as IN_PROGRESS
    if (isFinanceOrAdmin && ticket.status === 'OPEN') {
      await db.supportTicket.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      })
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 })
  }
}
