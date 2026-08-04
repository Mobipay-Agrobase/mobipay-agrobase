/**
 * GET  /api/support/tickets          — list tickets (tenant sees own, finance sees all)
 * POST /api/support/tickets          — create a new ticket
 */
import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext, buildTenantFilter } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'support:read')) {
      return NextResponse.json({ error: 'Support access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const isFinanceOrAdmin = ctx.isSuperAdmin || ctx.role === 'MOBIPAY_FINANCE'

    const where: any = isFinanceOrAdmin ? {} : buildTenantFilter(ctx, 'tenantId')
    if (status) where.status = status

    const tickets = await db.supportTicket.findMany({
      where,
      include: {
        tenant: { select: { name: true, country: true } },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ tickets })
  } catch (error: any) {
    console.error('[support/tickets GET] error:', error)
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'support:read')) {
      return NextResponse.json({ error: 'Support access required' }, { status: 403 })
    }

    const body = await request.json()
    const { subject, message, category, priority } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'subject and message are required' }, { status: 400 })
    }

    const ticket = await db.supportTicket.create({
      data: {
        tenantId: ctx.tenantId,
        subject,
        message,
        category: category || 'GENERAL',
        priority: priority || 'NORMAL',
        status: 'OPEN',
        createdById: ctx.userId,
      },
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error: any) {
    console.error('[support/tickets POST] error:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
