import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const ctx = await getTenantContext()
    if (!hasPermission(ctx.role, 'vsla:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const groupId = url.searchParams.get('groupId')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (groupId) where.groupId = groupId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { member: { fullName: { contains: search, mode: 'insensitive' } } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (!ctx.isSuperAdmin) {
      where.group = { tenantId: { in: ctx.tenantScope } }
    }

    const [loans, total] = await Promise.all([
      db.vslaLoanV2.findMany({
        where,
        include: {
          member: { select: { fullName: true, memberId: true, phone: true } },
          group: { select: { name: true, code: true } },
          approvals: { include: { keyHolder: { select: { fullName: true, role: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.vslaLoanV2.count({ where }),
    ])

    const stats = await db.vslaLoanV2.aggregate({
      where,
      _sum: { amount: true, outstanding: true },
      _count: true,
    })

    return NextResponse.json({
      loans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { totalLoans: stats._count, totalAmount: stats._sum.amount || 0, totalOutstanding: stats._sum.outstanding || 0 },
    })
  } catch (error) {
    console.error('[vsla-v2/loans GET] error:', error)
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}
